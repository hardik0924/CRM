import { CRM_MODULES, MODULE_ACTIONS } from '../utils/modules'

const ALL_ACTIONS = MODULE_ACTIONS.map((action) => action.code)

/**
 * value: { CONTACTS: ["VIEW", "EDIT"], TASKS: ["VIEW"] }
 * A missing key means the module is not granted.
 */
const ModulePicker = ({ value = {}, onChange, disabled = false }) => {
  const setGrant = (code, actions) => {
    const next = { ...value }
    if (!actions.length) delete next[code]
    else next[code] = actions
    onChange(next)
  }

  const toggleModule = (code) => {
    if (value[code]) setGrant(code, [])
    else setGrant(code, [...ALL_ACTIONS])
  }

  const toggleAction = (code, action) => {
    const current = value[code] || []
    setGrant(
      code,
      current.includes(action) ? current.filter((a) => a !== action) : [...current, action]
    )
  }

  return (
    <div className="space-y-2">
      {CRM_MODULES.map((module) => {
        const enabled = Boolean(value[module.code])
        const actions = value[module.code] || []
        return (
          <div
            key={module.code}
            className={`rounded-lg border px-3 py-2.5 transition-colors ${
              enabled ? 'border-vsph-core-blue bg-[#F7FBFF]' : 'border-slate-200 bg-white'
            }`}
          >
            <label className="flex items-center gap-2 text-sm font-semibold text-vsph-navy cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                disabled={disabled}
                onChange={() => toggleModule(module.code)}
                className="accent-vsph-core-blue"
              />
              {module.label}
            </label>
            <div className="mt-2 ml-6 flex flex-wrap gap-x-4 gap-y-1.5">
              {MODULE_ACTIONS.map((action) => (
                <label
                  key={action.code}
                  className={`flex items-center gap-1.5 text-xs ${
                    enabled ? 'text-slate-700 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={actions.includes(action.code)}
                    disabled={disabled || !enabled}
                    onChange={() => toggleAction(module.code, action.code)}
                    className="accent-vsph-core-blue"
                  />
                  {action.label}
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ModulePicker
