import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";

export const getDashboardMetrics = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Date calculations for Today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Date calculations for This Month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const [callsTodayCount, oppsWonThisMonthCount] = await Promise.all([
      prisma.call.count({
        where: {
          call_user_fk: user_id,
          ...getTenantFilter(req),
          call_deleted_at: null,
          call_created_at: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      prisma.opportunity.count({
        where: {
          opportunity_owner_fk: user_id,
          ...getTenantFilter(req),
          opportunity_stage: "CLOSED_WON",
          opportunity_close_date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        callsToday: callsTodayCount,
        oppsWonThisMonth: oppsWonThisMonthCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
