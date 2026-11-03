import { CRM_MODULES } from '../utils/modules'

const ModulePicker = ({ value = [], onChange }) => {
  const toggle = (code) =>
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {CRM_MODULES.map((module) => (
        <label
          key={module.code}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-vsph-navy cursor-pointer hover:border-vsph-core-blue has-[:checked]:border-vsph-core-blue has-[:checked]:bg-[#F7FBFF]"
        >
          <input
            type="checkbox"
            checked={value.includes(module.code)}
            onChange={() => toggle(module.code)}
            className="accent-vsph-core-blue"
          />
          {module.label}
        </label>
      ))}
    </div>
  )
}

export default ModulePicker
