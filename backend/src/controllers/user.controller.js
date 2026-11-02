import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";

export const getUsers = async (req, res) => {
  try {
    const isSuperadmin = req.user.role === "SUPER_ADMIN";
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
        user_role: true,
        user_status: true,
        user_is_tenant_owner: true,
        tenant_fk: true,
        tenant: { select: { tenant_name: true, tenant_code: true } },
      },
      where: {
        ...(isSuperadmin ? {} : { user_status: true }),
        ...getTenantFilter(req),
      },
      orderBy: { user_created_at: "desc" },
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
