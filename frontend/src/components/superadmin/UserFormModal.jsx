import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../utils/api'
import toast from 'react-hot-toast'

const ROLES = ['ADMIN', 'SALES', 'DATA', 'PRODUCTION', 'SPONSORSHIP', 'OPERATION', 'USER']
const DEPARTMENTS = ['SALES', 'MARKETING', 'FINANCE', 'IT', 'HUMAN_RESOURCES']

const empty = {
  user_name: '',
  user_email: '',
  user_password: '',
  user_role: 'ADMIN',
  user_department: 'SALES',
  user_status: true,
  tenant_fk: '',
}

const UserFormModal = ({ isOpen, onClose, onSaved, tenants = [], tenantId, userToEdit }) => {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fixedTenant = Boolean(tenantId)

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (userToEdit) {
      setForm({
        user_name: userToEdit.user_name || '',
        user_email: userToEdit.user_email || '',
        user_password: '',
        user_role: userToEdit.user_role || 'ADMIN',
        user_department: userToEdit.user_department || 'SALES',
        user_status: userToEdit.user_status ?? true,
        tenant_fk: userToEdit.tenant_fk || tenantId || '',
      })
    } else {
      setForm({ ...empty, tenant_fk: tenantId || '' })
    }
  }, [isOpen, userToEdit, tenantId])

  const change = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const targetTenant = tenantId || form.tenant_fk
    if (!targetTenant) {
      setError('Select a client for this user.')
      return
    }
    if (!userToEdit && !form.user_password) {
      setError('A password is required for a new user.')
      return
    }

    setSaving(true)
    try {
      const payload = { ...form }
      if (userToEdit) {
        if (!payload.user_password) delete payload.user_password
        const res = await api.put(`/api/tenants/${targetTenant}/users/${userToEdit.user_id}`, payload)
        if (!res.success) throw new Error(res.message || 'Could not update user')
        toast.success('User updated')
      } else {
        const res = await api.post(`/api/tenants/${targetTenant}/users`, payload)
        if (!res.success) throw new Error(res.message || 'Could not create user')
        toast.success('User created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue'
  const label = 'block text-[13px] font-semibold text-[#253F60] mb-1.5'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? 'Edit user (internal support)' : 'Add client user (internal support)'}
      widthClass="w-full max-w-2xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="client-user-form" variant="primary" disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {saving ? 'Saving...' : userToEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="client-user-form" onSubmit={submit} className="p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!fixedTenant && (
          <div>
            <label className={label} htmlFor="tenant_fk">Client *</label>
            <select id="tenant_fk" name="tenant_fk" value={form.tenant_fk} onChange={change} className={input} required>
              <option value="">Select a client</option>
              {tenants.map((t) => (
                <option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={label} htmlFor="user_name">Full name *</label>
            <input id="user_name" name="user_name" value={form.user_name} onChange={change} className={input} required placeholder="e.g. Priya Sharma" />
          </div>
          <div>
            <label className={label} htmlFor="user_email">Email address *</label>
            <input id="user_email" name="user_email" type="email" value={form.user_email} onChange={change} className={input} required placeholder="name@client.com" />
          </div>
          <div>
            <label className={label} htmlFor="user_password">
              Password {userToEdit ? '(leave blank to keep)' : '*'}
            </label>
            <input id="user_password" name="user_password" type="text" value={form.user_password} onChange={change} className={input} placeholder={userToEdit ? 'Unchanged' : 'Set a login password'} required={!userToEdit} />
          </div>
          <div>
            <label className={label} htmlFor="user_role">Role</label>
            <select id="user_role" name="user_role" value={form.user_role} onChange={change} className={input}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="user_department">Department</label>
            <select id="user_department" name="user_department" value={form.user_department} onChange={change} className={input}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="user_status">Status</label>
            <select id="user_status" name="user_status" value={String(form.user_status)} onChange={(e) => setForm((f) => ({ ...f, user_status: e.target.value === 'true' }))} className={input}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Commercial onboarding and employee invitations happen in the client CRM or at apps.vsph.in.
          Use this form only for internal support.
        </p>
      </form>
    </Modal>
  )
}

export default UserFormModal