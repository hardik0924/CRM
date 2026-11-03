import { prisma } from "../lib/prisma.js";
import { checkCrmAccess } from "../services/entitlement.service.js";
import {
  canAccessModule,
  canDoAction,
  parseModuleGrants,
} from "../lib/modules.js";
import { getOrgRole } from "../lib/roles.js";

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

  if (!user || !user.user_status || user.user_deleted_at) {
    return res.status(401).json({
      success: false,
      message: "Invalid or inactive user session.",
    });
  }

  // Fail closed: unknown or inactive entitlement blocks client access.
  const access = await checkCrmAccess(user);
  if (!access.allowed) {
    return res.status(403).json({
      success: false,
      code: `CRM_ACCESS_${access.reason.toUpperCase()}`,
      message:
        access.reason === "entitlement_unknown"
          ? "CRM access is not available for your organization. Contact your provider."
          : "CRM access is currently suspended for your organization.",
    });
  }

  const grants = parseModuleGrants(user.user_module_access);

  req.user = {
    id: user.user_id,
    email: user.user_email,
    name: user.user_name,
    role: user.user_role,
    department: user.user_department,
    tenantFk: user.tenant_fk,
    tenantName: user.tenant?.tenant_name || null,
    tenantCode: user.tenant?.tenant_code || null,
    isTenantOwner: Boolean(user.user_is_tenant_owner),
    orgRole: getOrgRole(user),
    modules: grants.modules,
    moduleActions: grants.permissions,
  };

  next();
};

export const requireModule = (code) => (req, res, next) => {
  if (!canAccessModule(req.user, code)) {
    return res.status(403).json({
      success: false,
      code: "MODULE_ACCESS_DENIED",
      message: "Your organization administrator has not granted you access to this module.",
    });
  }
  next();
};

export const requirePermission = (code, action) => (req, res, next) => {
  if (!canDoAction(req.user, code, action)) {
    return res.status(403).json({
      success: false,
      code: "ACTION_ACCESS_DENIED",
      message: `You do not have ${String(action).toLowerCase()} access to this module.`,
    });
  }
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
