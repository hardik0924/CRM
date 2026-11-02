import { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../utils/api'

const ROLES = ['USER', 'ADMIN', 'SALES', 'DATA', 'PRODUCTION', 'SPONSORSHIP', 'OPERATION']
const DEPARTMENTS = ['SALES', 'MARKETING', 'FINANCE', 'IT', 'HUMAN_RESOURCES']

const empty = { name: '', email: '', role: 'USER', department: 'SALES' }

const InviteEmployeeModal = ({ isOpen = true, onClose, onSaved }) => {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [devLink, setDevLink] = useState('')
  const [copied, setCopied] = useState(false)

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post('/api/organization/employees/invite', form)
      if (!res.success) throw new Error(res.message || 'Could not create the invitation.')
      if (res.data?.devInvitationUrl) {
        setDevLink(res.data.devInvitationUrl)
      } else {
        onSaved?.()
        onClose()
      }
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Could not create the invitation.')
    } finally {
      setSaving(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(devLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const input = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue'
  const label = 'block text-[13px] font-semibold text-[#253F60] mb-1.5'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite employee"
      widthClass="w-full max-w-xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {devLink ? 'Close' : 'Cancel'}
          </Button>
          {!devLink && (
            <Button type="submit" form="invite-employee-form" variant="primary" disabled={saving} className="min-w-[140px]">
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {saving ? 'Sending...' : 'Send invitation'}
            </Button>
          )}
        </>
      }
    >
      {devLink ? (
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Invitation created. No email provider is configured in development, so share this one-time link:
          </p>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <code className="text-xs break-all flex-1 text-vsph-navy">{devLink}</code>
            <button onClick={copy} className="p-1.5 rounded text-slate-500 hover:text-vsph-core-blue shrink-0" title="Copy link">
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            The employee opens this link, sets their own password, then signs in with their email.
          </p>
        </div>
      ) : (
        <form id="invite-employee-form" onSubmit={submit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label} htmlFor="name">Full name</label>
              <input id="name" name="name" value={form.name} onChange={change} className={input} placeholder="e.g. Priya Sharma" />
            </div>
            <div>
              <label className={label} htmlFor="email">Work email *</label>
              <input id="email" name="email" type="email" value={form.email} onChange={change} className={input} required placeholder="name@company.com" />
            </div>
            <div>
              <label className={label} htmlFor="role">CRM role</label>
              <select id="role" name="role" value={form.role} onChange={change} className={input}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="department">Department</label>
              <select id="department" name="department" value={form.department} onChange={change} className={input}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            The employee receives a single-use link to set their own password. You never see or set their password.
          </p>
        </form>
      )}
    </Modal>
  )
}

export default InviteEmployeeModal
