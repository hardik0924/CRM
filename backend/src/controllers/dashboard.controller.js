import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";
import { canAccessModule } from "../lib/modules.js";

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
            where: { task_user_fk: userId, task_deleted_at: null, ...tenant },
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
            where: { task_deleted_at: null, ...tenant },
            orderBy: { task_due_date: "asc" },
            take: 5,
            include: { user: { select: { user_name: true } } },
          })
        : null,
    ]);

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
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
