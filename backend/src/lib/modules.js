// CRM modules a client employee can be granted. Dashboard is the landing page
// and is always available; the rest are assigned by the client super admin.
export const CRM_MODULES = [
  "CONTACTS",
  "ACCOUNTS",
  "OPPORTUNITIES",
  "PROJECTS",
  "CAMPAIGNS",
  "TASKS",
];

export const MODULE_LABELS = {
  CONTACTS: "Contacts",
  ACCOUNTS: "Accounts",
  OPPORTUNITIES: "Opportunities",
  PROJECTS: "Projects",
  CAMPAIGNS: "Campaigns",
  TASKS: "Tasks",
};

// null  -> no restriction (legacy users and the organization owner)
// ""    -> no optional modules
// "A,B" -> exactly those modules
export const parseModuleAccess = (raw) => {
  if (raw === null || raw === undefined) return null;
  const modules = String(raw)
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => CRM_MODULES.includes(code));
  return [...new Set(modules)];
};

export const serializeModuleAccess = (modules) => {
  if (modules === null || modules === undefined) return null;
  return parseModuleAccess(Array.isArray(modules) ? modules.join(",") : modules).join(",");
};

export const validateModules = (modules) => {
  if (modules === undefined || modules === null) return { ok: true, modules: null };
  if (!Array.isArray(modules)) {
    return { ok: false, message: "modules must be an array of CRM module codes." };
  }
  const normalized = modules.map((code) => String(code).trim().toUpperCase());
  const invalid = normalized.filter((code) => !CRM_MODULES.includes(code));
  if (invalid.length) {
    return { ok: false, message: `Unknown CRM module: ${invalid.join(", ")}.` };
  }
  return { ok: true, modules: [...new Set(normalized)] };
};

export const canAccessModule = (user, code) => {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const modules = user.modules === undefined ? parseModuleAccess(user.user_module_access) : user.modules;
  return modules === null || modules.includes(code);
};
