import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";
import { canAccessModule } from "../lib/modules.js";
import { getOrgRole, isEmployee } from "../lib/roles.js";
import { TASK_STATUSES } from "../lib/tasks.js";

const countByStatus = () =>
  Object.fromEntries(TASK_STATUSES.map((status) => [status, 0]));

/**
 * Dashboard summary. Every number is tenant-filtered; module counts are omitted
 * (null) for employees who were not granted that module.
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    // Dashboard is personal: default to the signed-in user, ignore another
    // user_id from the browser for non-superadmins.
    const userId =
      req.user.role === "SUPER_ADMIN" && req.query.user_id
        ? req.query.user_id
        : req.user.id;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const tenant = getTenantFilter(req);
    const can = {
      accounts: canAccessModule(req.user, "ACCOUNTS"),
      contacts: canAccessModule(req.user, "CONTACTS"),
      opportunities: canAccessModule(req.user, "OPPORTUNITIES"),
      tasks: canAccessModule(req.user, "TASKS"),
    };

    const openStages = { notIn: ["CLOSED_WON", "CLOSED_LOST"] };

    const [
      callsToday,
      oppsWonThisMonth,
      accounts,
      contacts,
      openOpportunities,
      myOpenTasks,
      stageGroups,
      recentOpportunities,
      recentTasks,
    ] = await Promise.all([
      prisma.call.count({
        where: {
          call_user_fk: userId,
          ...tenant,
          call_deleted_at: null,
          call_created_at: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.opportunity.count({
        where: {
          opportunity_owner_fk: userId,
          ...tenant,
          opportunity_stage: "CLOSED_WON",
          opportunity_close_date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      can.accounts
        ? prisma.account.count({ where: { account_deleted_at: null, ...tenant } })
        : null,
      can.contacts
        ? prisma.contact.count({ where: { contact_deleted_at: null, ...tenant } })
        : null,
      can.opportunities
        ? prisma.opportunity.count({
            where: { opportunity_stage: openStages, ...tenant },
          })
        : null,
      can.tasks
        ? prisma.task.count({
            where: { task_user_fk: userId, task_status: { not: "COMPLETED" }, task_deleted_at: null, ...tenant },
          })
        : null,
      can.opportunities
        ? prisma.opportunity.groupBy({
            by: ["opportunity_stage"],
            where: tenant,
            _count: { _all: true },
          })
        : null,
      can.opportunities
        ? prisma.opportunity.findMany({
            where: tenant,
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
              // Employees only ever see their own work, including the sidebar list.
              ...(isEmployee(req.user) ? { task_user_fk: req.user.id } : {}),
            },
            orderBy: { task_due_date: "asc" },
            take: 5,
            include: { user: { select: { user_name: true } } },
          })
        : null,
    ]);

    let work = null;
    if (can.tasks) {
      const orgRole = getOrgRole(req.user);
      const employeeScope = orgRole === "EMPLOYEE" ? { task_user_fk: req.user.id } : {};
      const workWhere = { task_deleted_at: null, ...tenant, ...employeeScope };

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
            ...(orgRole === "EMPLOYEE" ? { user_fk: req.user.id } : {}),
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
        scope: orgRole === "EMPLOYEE" ? "PERSONAL" : "ORGANIZATION",
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
        callsToday,
        oppsWonThisMonth,
        accounts,
        contacts,
        openOpportunities,
        myOpenTasks,
        pipeline: stageGroups
          ? stageGroups.map((row) => ({
              stage: row.opportunity_stage || "UNASSIGNED",
              count: row._count._all,
            }))
          : null,
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
