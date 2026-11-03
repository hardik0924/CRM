// CRM modules a client employee can be granted. Dashboard is the landing page
// and is always available; the rest are assigned by the organization owner.
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

export const MODULE_ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE"];

/**
 * Stored in user.user_module_access:
 *   null                              -> every module and action
 *   ""                                -> dashboard only
 *   "CONTACTS,TASKS"                  -> legacy grant, all actions
 *   "CONTACTS:VIEW,EDIT|TASKS:VIEW"   -> explicit actions
 */
export const parseModuleGrants = (raw) => {
  if (raw === null || raw === undefined) return { modules: null, permissions: null };

  const text = String(raw).trim();
  if (!text) return { modules: [], permissions: {} };

  const entries = text.includes("|")
    ? text.split("|")
    : text.includes(":")
      ? [text]
      : text.split(",");

  const modules = [];
  const permissions = {};

  for (const entry of entries) {
    const [rawCode, rawActions] = entry.split(":");
    const code = String(rawCode || "").trim().toUpperCase();
    if (!CRM_MODULES.includes(code)) continue;

    modules.push(code);
    const actions =
      rawActions === undefined
        ? [...MODULE_ACTIONS]
        : String(rawActions)
            .split(",")
            .map((action) => action.trim().toUpperCase())
            .filter((action) => MODULE_ACTIONS.includes(action));

    permissions[code] = [...new Set([...(permissions[code] || []), ...actions])];
  }

  return { modules: [...new Set(modules)], permissions };
};

export const parseModuleAccess = (raw) => parseModuleGrants(raw).modules;

export const serializeModuleAccess = (modules) => {
  if (modules === null || modules === undefined) return null;
  return parseModuleAccess(Array.isArray(modules) ? modules.join(",") : modules).join(",");
};

export const serializeModuleGrants = (modules, permissions) => {
  if (modules === null || modules === undefined) return null;
  const list = [...new Set(modules.map((code) => String(code).trim().toUpperCase()))].filter(
    (code) => CRM_MODULES.includes(code)
  );
  return list
    .map((code) => {
      const requested = permissions?.[code];
      const allowed = Array.isArray(requested)
        ? MODULE_ACTIONS.filter((action) => requested.map((a) => String(a).toUpperCase()).includes(action))
        : MODULE_ACTIONS;
      return `${code}:${allowed.join(",")}`;
    })
    .join("|");
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

/**
 * Validates a module list plus optional per-module action map. Modules without
 * an entry keep the legacy full-action behaviour.
 */
export const validateGrants = (modules, permissions) => {
  const moduleCheck = validateModules(modules);
  if (!moduleCheck.ok) return moduleCheck;
  if (moduleCheck.modules === null) return { ok: true, modules: null, permissions: null };
  if (permissions !== undefined && permissions !== null && typeof permissions !== "object") {
    return { ok: false, message: "permissions must be an object keyed by CRM module." };
  }

  const result = {};
  for (const code of moduleCheck.modules) {
    const requested = permissions?.[code];
    if (requested === undefined) {
      result[code] = [...MODULE_ACTIONS];
      continue;
    }
    if (!Array.isArray(requested)) {
      return { ok: false, message: `permissions.${code} must be an array of actions.` };
    }
    const normalized = requested.map((action) => String(action).trim().toUpperCase());
    const invalid = normalized.filter((action) => !MODULE_ACTIONS.includes(action));
    if (invalid.length) {
      return { ok: false, message: `Unknown permission for ${code}: ${invalid.join(", ")}.` };
    }
    result[code] = MODULE_ACTIONS.filter((action) => normalized.includes(action));
  }

  return { ok: true, modules: moduleCheck.modules, permissions: result };
};

export const canAccessModule = (user, code) => {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.orgRole === "ORG_SUPER_ADMIN") {
    return true;
  }
  const modules = user.modules === undefined ? parseModuleAccess(user.user_module_access) : user.modules;
  return modules === null || modules.includes(code);
};

export const canDoAction = (user, code, action) => {
  if (!canAccessModule(user, code)) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.orgRole === "ORG_SUPER_ADMIN") {
    return true;
  }
  const modules = user.modules === undefined ? parseModuleAccess(user.user_module_access) : user.modules;
  if (modules === null) return true;

  const permissions =
    user.moduleActions === undefined
      ? parseModuleGrants(user.user_module_access).permissions
      : user.moduleActions;

  const allowed = permissions?.[code];
  return Array.isArray(allowed) && allowed.includes(String(action).toUpperCase());
};
