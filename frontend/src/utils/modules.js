export const CRM_MODULES = [
  { code: 'CONTACTS', label: 'Contacts' },
  { code: 'ACCOUNTS', label: 'Accounts' },
  { code: 'OPPORTUNITIES', label: 'Opportunities' },
  { code: 'PROJECTS', label: 'Projects' },
  { code: 'CAMPAIGNS', label: 'Campaigns' },
  { code: 'TASKS', label: 'Tasks' },
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

export const hasModule = (code) => {
  const modules = parseUserModules()
  return modules === null || modules.includes(code)
}

export const moduleLabel = (code) =>
  CRM_MODULES.find((m) => m.code === code)?.label || code
