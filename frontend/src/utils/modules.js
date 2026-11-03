export const CRM_MODULES = [
  { code: 'CONTACTS', label: 'Contacts' },
  { code: 'ACCOUNTS', label: 'Accounts' },
  { code: 'OPPORTUNITIES', label: 'Opportunities' },
  { code: 'PROJECTS', label: 'Projects' },
  { code: 'CAMPAIGNS', label: 'Campaigns' },
  { code: 'TASKS', label: 'Tasks' },
]

export const MODULE_ACTIONS = [
  { code: 'VIEW', label: 'View' },
  { code: 'CREATE', label: 'Create' },
  { code: 'EDIT', label: 'Edit' },
  { code: 'DELETE', label: 'Delete' },
]

// null means every module (legacy users and the organization owner).
export const parseUserModules = () => {
  try {
    const raw = localStorage.getItem('vsph_user_modules')
    if (raw === null) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const parseUserActions = () => {
  try {
    const raw = localStorage.getItem('vsph_user_actions')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const hasModule = (code) => {
  const modules = parseUserModules()
  return modules === null || modules.includes(code)
}

export const canDoAction = (code, action) => {
  const role = localStorage.getItem('vsph_user_role')
  const isOwner = localStorage.getItem('vsph_user_owner') === 'true'
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || isOwner) return true
  if (!hasModule(code)) return false

  const modules = parseUserModules()
  if (modules === null) return true

  const actions = parseUserActions()
  return Array.isArray(actions?.[code]) && actions[code].includes(action)
}

/** ORG_SUPER_ADMIN | ORG_ADMIN | EMPLOYEE | PLATFORM_SUPERADMIN */
export const currentOrgRole = () => {
  const role = localStorage.getItem('vsph_user_role')
  const isOwner = localStorage.getItem('vsph_user_owner') === 'true'
  if (role === 'SUPER_ADMIN') return 'PLATFORM_SUPERADMIN'
  if (isOwner) return 'ORG_SUPER_ADMIN'
  if (role === 'ADMIN') return 'ORG_ADMIN'
  return 'EMPLOYEE'
}

export const canManageOrganization = () =>
  ['ORG_SUPER_ADMIN', 'ORG_ADMIN'].includes(currentOrgRole())

export const orgRoleLabel = (role = currentOrgRole()) =>
  ({
    ORG_SUPER_ADMIN: 'Organization Super Admin',
    ORG_ADMIN: 'Organization Admin',
    EMPLOYEE: 'Employee',
    PLATFORM_SUPERADMIN: 'Platform Super Admin',
  })[role] || 'Employee'

export const moduleLabel = (code) =>
  CRM_MODULES.find((m) => m.code === code)?.label || code
