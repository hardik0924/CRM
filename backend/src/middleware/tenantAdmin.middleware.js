import { isClientRole } from "../lib/onboarding.logic.js";
import { getOrgRole } from "../lib/roles.js";

/**
 * Employee management is limited to the signed-in user's own organization.
 * Superadmins use the separate internal support routes instead.
 */
export const requireTenantAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }
  if (!req.user.tenantFk) {
    return res.status(403).json({ success: false, message: "No organization context." });
  }
  const orgRole = getOrgRole(req.user);
  if (orgRole !== "ORG_ADMIN" && orgRole !== "ORG_SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only an organization administrator can manage employees.",
    });
  }
  next();
};

/** Only the organization owner (CRM Super Admin) may manage admins. */
export const requireOrgOwner = (req, res, next) => {
  if (!req.user || getOrgRole(req.user) !== "ORG_SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only the organization Super Admin can perform this action.",
    });
  }
  next();
};

export const validateClientRole = (role) => {
  if (role === undefined) return { ok: true };
  if (!isClientRole(role)) {
    return {
      ok: false,
      message: "Invalid role. Client users cannot be granted platform roles.",
    };
  }
  return { ok: true };
};
