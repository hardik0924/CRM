/**
 * Organizational roles are derived from the existing user columns.
 * The platform SUPER_ADMIN is a different security boundary and never becomes
 * an organization role.
 */
export const ORG_ROLES = {
  SUPER_ADMIN: "ORG_SUPER_ADMIN",
  ADMIN: "ORG_ADMIN",
  EMPLOYEE: "EMPLOYEE",
  PLATFORM: "PLATFORM_SUPERADMIN",
};

export const getOrgRole = (user) => {
  if (!user) return null;
  const role = user.user_role ?? user.role;
  const isOwner = Boolean(user.user_is_tenant_owner ?? user.isTenantOwner);
  if (role === "SUPER_ADMIN") return ORG_ROLES.PLATFORM;
  if (isOwner) return ORG_ROLES.SUPER_ADMIN;
  if (role === "ADMIN") return ORG_ROLES.ADMIN;
  return ORG_ROLES.EMPLOYEE;
};

export const isPlatformAdmin = (user) => getOrgRole(user) === ORG_ROLES.PLATFORM;
export const isOrgSuperAdmin = (user) => getOrgRole(user) === ORG_ROLES.SUPER_ADMIN;
export const isOrgAdmin = (user) =>
  [ORG_ROLES.SUPER_ADMIN, ORG_ROLES.ADMIN, ORG_ROLES.PLATFORM].includes(getOrgRole(user));
export const isEmployee = (user) => getOrgRole(user) === ORG_ROLES.EMPLOYEE;
