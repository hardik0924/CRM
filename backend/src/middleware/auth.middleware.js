import { prisma } from "../lib/prisma.js";

export const authMiddleware = async (req, res, next) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. X-User-Id header missing.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { tenant: true },
  });

  if (!user || !user.user_status) {
    return res.status(401).json({
      success: false,
      message: "Invalid or inactive user session.",
    });
  }

  req.user = {
    id: user.user_id,
    email: user.user_email,
    name: user.user_name,
    role: user.user_role,
    department: user.user_department,
    tenantFk: user.tenant_fk,
    tenantName: user.tenant?.tenant_name || null,
    tenantCode: user.tenant?.tenant_code || null,
  };

  next();
};

export const superadminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Superadmin access required.",
    });
  }
  next();
};

export const getTenantFilter = (req) => {
  // Superadmin sees all data; client users see only their tenant's data
  if (req.user.role === "SUPER_ADMIN") {
    return {};
  }
  return { tenant_fk: req.user.tenantFk };
};
