import { isClientRole } from "../lib/onboarding.logic.js";

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
  if (req.user.role !== "ADMIN" && !req.user.isTenantOwner) {
    return res.status(403).json({
      success: false,
      message: "Only the organization administrator can manage employees.",
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
