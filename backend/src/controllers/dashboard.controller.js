import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";
import { canAccessModule } from "../lib/modules.js";
import { isEmployee } from "../lib/roles.js";
import { TASK_STATUSES } from "../lib/tasks.js";

const countByStatus = () =>
  Object.fromEntries(TASK_STATUSES.map((status) => [status, 0]));

const startOfDaysAgo = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
};

const dayKey = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
};

const fullName = (contact) =>
  [contact?.contact_firstname, contact?.contact_lastname].filter(Boolean).join(" ");

/**
 * Dashboard summary. Organization roles see every teammate's calls, records
 * and activity; employees see only their own. Module counts stay null for
 * modules the user cannot access.
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const userId =
      req.user.role === "SUPER_ADMIN" && req.query.user_id
        ? req.query.user_id
        : req.user.id;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    const weekStart = startOfDaysAgo(7);

    const tenant = getTenantFilter(req);
    const can = {
      accounts: canAccessModule(req.user, "ACCOUNTS"),
      contacts: canAccessModule(req.user, "CONTACTS"),
      opportunities: canAccessModule(req.user, "OPPORTUNITIES"),
      tasks: canAccessModule(req.user, "TASKS"),
    };

    const openStages = { notIn: ["CLOSED_WON", "CLOSED_LOST"] };

    // Employees see only their own dashboard; organization roles see the whole
    // organization.
    const personal = isEmployee(req.user);
    const own = {
      call: personal ? { call_user_fk: req.user.id } : {},
      contact: personal ? { contact_owner_fk: req.user.id } : {},
      account: personal ? { account_owner_fk: req.user.id } : {},
      opportunity: personal ? { opportunity_owner_fk: req.user.id } : {},
      task: personal ? { task_user_fk: req.user.id } : {},
    };

    const [
      callsToday,
      callsThisWeek,
      oppsWonThisMonth,
      accounts,
      contacts,
      openOpportunities,
      myOpenTasks,
      openTasks,
      stageGroups,
      recentOpportunities,
      recentTasks,
    ] = await Promise.all([
      can.contacts
        ? prisma.call.count({
            where: {
              ...tenant,
              ...own.call,
              call_deleted_at: null,
              call_created_at: { gte: startOfToday, lte: endOfToday },
            },
          })
        : null,
      can.contacts
        ? prisma.call.findMany({
            where: { ...tenant, ...own.call, call_deleted_at: null, call_created_at: { gte: weekStart } },
            select: { call_created_at: true },
            take: 2000,
          })
        : null,
      can.opportunities
        ? prisma.opportunity.count({
            where: {
              ...tenant,
              ...own.opportunity,
              opportunity_stage: "CLOSED_WON",
              opportunity_close_date: { gte: startOfMonth, lte: endOfMonth },
            },
          })
        : null,
      can.accounts
        ? prisma.account.count({ where: { account_deleted_at: null, ...tenant, ...own.account } })
        : null,
      can.contacts
        ? prisma.contact.count({ where: { contact_deleted_at: null, ...tenant, ...own.contact } })
        : null,
      can.opportunities
        ? prisma.opportunity.count({
            where: { opportunity_stage: openStages, ...tenant, ...own.opportunity },
          })
        : null,
      can.tasks
        ? prisma.task.count({
            where: { task_user_fk: userId, task_status: { not: "COMPLETED" }, task_deleted_at: null, ...tenant },
          })
        : null,
      can.tasks
        ? prisma.task.count({
            where: {
              task_deleted_at: null,
              task_status: { not: "COMPLETED" },
              ...tenant,
              ...own.task,
            },
          })
        : null,
      can.opportunities
        ? prisma.opportunity.groupBy({
            by: ["opportunity_stage"],
            where: { ...tenant, ...own.opportunity },
            _count: { _all: true },
          })
        : null,
      can.opportunities
        ? prisma.opportunity.findMany({
            where: { ...tenant, ...own.opportunity },
            orderBy: { opportunity_created_at: "desc" },
            take: 5,
            include: {
              opportunity_owner: { select: { user_name: true } },
              opportunity_account: { select: { account_name: true } },
            },
          })
        : null,
      can.tasks
        ? prisma.task.findMany({
            where: {
              task_deleted_at: null,
              ...tenant,
              ...own.task,
            },
            orderBy: { task_due_date: "asc" },
            take: 5,
            include: { user: { select: { user_name: true } } },
          })
        : null,
    ]);

    // Seven-day call volume, bucketed by local day.
    let callsByDay = null;
    if (callsThisWeek) {
      const buckets = new Map();
      for (let index = 0; index < 7; index += 1) {
        const day = startOfDaysAgo(7 - index);
        buckets.set(dayKey(day), { date: dayKey(day), count: 0 });
      }
      for (const call of callsThisWeek) {
        const bucket = buckets.get(dayKey(call.call_created_at));
        if (bucket) bucket.count += 1;
      }
      callsByDay = [...buckets.values()];
    }

    // One recent feed per scope: organization-wide for admins, own work for
    // employees.
    const [recentCalls, recentContacts, recentAccounts, recentOpps, recentTaskRows] =
      await Promise.all([
        can.contacts
          ? prisma.call.findMany({
              where: { ...tenant, ...own.call, call_deleted_at: null },
              orderBy: { call_created_at: "desc" },
              take: 6,
              include: {
                user: { select: { user_name: true } },
                contact: { select: { contact_firstname: true, contact_lastname: true } },
              },
            })
          : [],
        can.contacts
          ? prisma.contact.findMany({
              where: { contact_deleted_at: null, ...tenant, ...own.contact },
              orderBy: { contact_created_at: "desc" },
              take: 4,
              include: {
                contact_owner: { select: { user_name: true } },
                account: { select: { account_name: true } },
              },
            })
          : [],
        can.accounts
          ? prisma.account.findMany({
              where: { account_deleted_at: null, ...tenant, ...own.account },
              orderBy: { account_created_at: "desc" },
              take: 4,
              include: { owner: { select: { user_name: true } } },
            })
          : [],
        can.opportunities
          ? prisma.opportunity.findMany({
              where: { ...tenant, ...own.opportunity },
              orderBy: { opportunity_created_at: "desc" },
              take: 4,
              include: {
                opportunity_owner: { select: { user_name: true } },
                opportunity_account: { select: { account_name: true } },
              },
            })
          : [],
        can.tasks
          ? prisma.task.findMany({
              where: { task_deleted_at: null, ...tenant, ...own.task },
              orderBy: { task_created_at: "desc" },
              take: 4,
              include: { user: { select: { user_name: true } } },
            })
          : [],
      ]);

    const recentActivity = [
      ...recentCalls.map((call) => ({
        id: call.call_id,
        type: "call",
        title: call.call_subject || "Call logged",
        subtitle: fullName(call.contact) || call.call_description || "Call",
        user: call.user?.user_name || null,
        at: call.call_created_at,
      })),
      ...recentContacts.map((contact) => ({
        id: contact.contact_id,
        type: "contact",
        title: fullName(contact) || "New contact",
        subtitle: contact.account?.account_name || "Contact added",
        user: contact.contact_owner?.user_name || null,
        at: contact.contact_created_at,
      })),
      ...recentAccounts.map((account) => ({
        id: account.account_id,
        type: "account",
        title: account.account_name,
        subtitle: "Account added",
        user: account.owner?.user_name || null,
        at: account.account_created_at,
      })),
      ...recentOpps.map((opp) => ({
        id: opp.opportunity_id,
        type: "opportunity",
        title: opp.opportunity_name,
        subtitle: [opp.opportunity_account?.account_name, opp.opportunity_stage?.replace(/_/g, " ")]
          .filter(Boolean)
          .join(" · "),
        user: opp.opportunity_owner?.user_name || null,
        at: opp.opportunity_created_at,
      })),
      ...recentTaskRows.map((task) => ({
        id: task.task_id,
        type: "task",
        title: task.task_subject || "New task",
        subtitle: `Assigned to ${task.user?.user_name || "unassigned"}`,
        user: task.user?.user_name || null,
        at: task.task_created_at,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 12);

    let work = null;
    if (can.tasks) {
      const workWhere = { task_deleted_at: null, ...tenant, ...own.task };

      const [workTasks, recentUpdates] = await Promise.all([
        prisma.task.findMany({
          where: workWhere,
          select: {
            task_status: true,
            task_progress: true,
            task_due_date: true,
            task_user_fk: true,
            user: { select: { user_name: true } },
          },
        }),
        prisma.task_update.findMany({
          where: {
            ...tenant,
            ...(personal ? { user_fk: req.user.id } : {}),
          },
          orderBy: { created_at: "desc" },
          take: 10,
          include: {
            user: { select: { user_id: true, user_name: true } },
            task: { select: { task_id: true, task_subject: true, task_status: true } },
          },
        }),
      ]);

      const byStatus = countByStatus();
      const byUserMap = new Map();
      const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      let overdue = 0;
      let upcoming = 0;
      let progressSum = 0;

      for (const task of workTasks) {
        byStatus[task.task_status] = (byStatus[task.task_status] || 0) + 1;
        progressSum += task.task_progress || 0;

        if (task.task_status !== "COMPLETED" && task.task_due_date) {
          const due = new Date(task.task_due_date);
          if (due < today) overdue += 1;
          else if (due <= weekAhead) upcoming += 1;
        }

        const key = task.task_user_fk || "unassigned";
        const entry = byUserMap.get(key) || {
          user_id: task.task_user_fk,
          user_name: task.user?.user_name || "Unassigned",
          total: 0,
          completed: 0,
          overdue: 0,
          progressSum: 0,
        };
        entry.total += 1;
        entry.progressSum += task.task_progress || 0;
        if (task.task_status === "COMPLETED") entry.completed += 1;
        if (task.task_status !== "COMPLETED" && task.task_due_date && new Date(task.task_due_date) < today) {
          entry.overdue += 1;
        }
        byUserMap.set(key, entry);
      }

      work = {
        scope: personal ? "PERSONAL" : "ORGANIZATION",
        total: workTasks.length,
        byStatus,
        overdue,
        upcoming,
        averageProgress: workTasks.length ? Math.round(progressSum / workTasks.length) : 0,
        byUser: [...byUserMap.values()]
          .map((entry) => ({
            user_id: entry.user_id,
            user_name: entry.user_name,
            total: entry.total,
            completed: entry.completed,
            overdue: entry.overdue,
            averageProgress: entry.total ? Math.round(entry.progressSum / entry.total) : 0,
          }))
          .sort((a, b) => b.total - a.total),
        recentUpdates,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        scope: personal ? "PERSONAL" : "ORGANIZATION",
        callsToday,
        callsByDay,
        oppsWonThisMonth,
        accounts,
        contacts,
        openOpportunities,
        myOpenTasks,
        openTasks,
        pipeline: stageGroups
          ? stageGroups.map((row) => ({
              stage: row.opportunity_stage || "UNASSIGNED",
              count: row._count._all,
            }))
          : null,
        recentActivity,
        recentOpportunities,
        recentTasks,
        work,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
