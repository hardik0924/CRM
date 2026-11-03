import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ModulePicker from '../ModulePicker'
import { CRM_MODULES } from '../../utils/modules'
import { api } from '../../utils/api'
import toast from 'react-hot-toast'

const ALL_MODULES = CRM_MODULES.map((m) => m.code)

const EmployeeAccessModal = ({ isOpen, onClose, employee, onSaved }) => {
  const [selected, setSelected] = useState(() =>
    employee?.modules === null ? ALL_MODULES : employee?.modules || []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!employee) return null

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const res = await api.patch(`/api/organization/employees/${employee.user_id}`, { modules: selected })
      if (!res.success) throw new Error(res.message || 'Could not update access')
      toast.success('Module access updated')
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not update access')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Module access · ${employee.user_name}`}
      widthClass="w-full max-w-lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" onClick={save} disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {saving ? 'Saving...' : 'Save access'}
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-600">
          Choose which CRM modules this employee can open. The dashboard is always available.
        </p>
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-700">{error}</div>
        )}
        <ModulePicker value={selected} onChange={setSelected} />
        <p className="text-xs text-slate-500">
          Access is enforced on the server, not just hidden in the navigation.
        </p>
      </div>
    </Modal>
  )
}

export default EmployeeAccessModal
