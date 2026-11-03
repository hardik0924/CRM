import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Building2, Plus, Trash2, Edit3, Save, X, Search, Users, ArrowRight, Loader2,
  UserPlus, ExternalLink,
} from 'lucide-react'
import { api } from '../../utils/api'
import toast from 'react-hot-toast'

const EMPTY = { tenant_name: '', tenant_code: '', tenant_plan: 'STARTER', tenant_status: 'ACTIVE' }

const TenantManagement = () => {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(EMPTY)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate()
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const fetchTenants = async () => {
    try {
      const res = await api.get('/api/tenants')
      if (res.success) setTenants(res.data)
    } catch (err) {
      console.error('Error fetching organizations:', err)
      toast.error('Could not load organizations')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormData(EMPTY)
    setFormOpen(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setFormData({
      tenant_name: t.tenant_name || '',
      tenant_code: t.tenant_code || '',
      tenant_plan: t.tenant_plan || 'STARTER',
      tenant_status: t.tenant_status || 'ACTIVE',
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const saveTenant = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = editing
        ? await api.put(`/api/tenants/${editing.tenant_id}`, formData)
        : await api.post('/api/tenants', formData)

      if (!res.success) throw new Error(res.message || 'Could not save organization')

      toast.success(editing ? 'Organization updated' : 'Organization created')
      const created = res.data
      closeForm()
      await fetchTenants()
      if (!editing && created?.tenant_id) {
        navigate(`/superadmin/tenants/${created.tenant_id}/users`)
      }
    } catch (err) {
      toast.error(err.message || 'Could not save organization')
    } finally {
      setSaving(false)
    }
  }

  const deleteTenant = async (t) => {
    if (!confirm(`Delete "${t.tenant_name}"? All employees and CRM data for this organization will be removed.`)) return
    try {
      const res = await api.delete(`/api/tenants/${t.tenant_id}`)
      if (!res.success) throw new Error(res.message || 'Could not delete organization')
      toast.success('Organization deleted')
      fetchTenants()
    } catch (err) {
      toast.error(err.message || 'Could not delete organization')
    }
  }

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase()
    return t.tenant_name?.toLowerCase().includes(q) || t.tenant_code?.toLowerCase().includes(q)
  })

  const input = 'w-full px-3.5 py-2.5 border border-border rounded-lg bg-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue'
  const label = 'block text-[13px] font-semibold text-sidebar mb-1.5'

  return (
    <div className="animate-fade-in bg-page-bg min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-secondary">PLATFORM / ORGANIZATIONS</p>
          <h1 className="text-sidebar text-3xl font-semibold tracking-tight mt-1">Organizations</h1>
          <p className="text-secondary text-sm mt-1">
            Every client workspace on the CRM. Add their people from the Employees page.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to="/superadmin/users?new=1"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-vsph-navy transition-colors shadow-sm"
          >
            <UserPlus size={18} /> Create employee
          </Link>
          <a
            href={import.meta.env.VITE_CENTRAL_PLATFORM_URL || 'https://apps.vsph.in'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-sidebar text-sidebar text-sm font-semibold hover:bg-sidebar hover:text-white transition-colors"
          >
            <ExternalLink size={16} /> apps.vsph.in
          </a>
        </div>
      </div>

      {/* Centralized onboarding notice */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-xl bg-vsph-core-blue/5 border border-vsph-core-blue/20 p-6 mb-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.14em] text-vsph-core-blue">CENTRALIZED ONBOARDING</p>
          <h2 className="text-sidebar text-xl font-semibold tracking-tight mt-2">New clients start at apps.vsph.in</h2>
          <p className="text-secondary text-sm mt-1 leading-relaxed">
            Create the organization, assign CRM and send the first administrator invitation from the central
            platform. CRM receives the organization automatically and stays the source of truth for CRM data.
            Use <span className="font-semibold text-sidebar">Internal support</span> only to repair or maintain
            an existing setup.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <a
            href={import.meta.env.VITE_CENTRAL_PLATFORM_URL || 'https://apps.vsph.in'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-vsph-navy transition-colors"
          >
            Open central platform <ArrowRight size={16} />
          </a>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-border bg-surface text-sidebar text-sm font-semibold hover:border-sidebar transition-colors"
            title="Internal support only"
          >
            <Plus size={16} /> Internal support
          </button>
        </div>
      </div>

      <div className="card border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border">
          <div>
            <h2 className="text-sidebar text-lg font-semibold">All organizations</h2>
            <p className="text-xs text-secondary mt-0.5">Identity and CRM entitlement come from the central platform.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or code"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-modern min-w-[820px]">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Status</th>
                <th>CRM access</th>
                <th>Employees</th>
                <th>Accounts</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-secondary">
                    <Loader2 size={24} className="animate-spin text-vsph-core-blue mx-auto mb-2" />
                    Loading organizations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-secondary">
                    {tenants.length === 0
                      ? 'No organizations yet. New commercial clients are onboarded at apps.vsph.in.'
                      : 'No organizations match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-vsph-light-blue/20 transition-colors">
                    <td className="border-b border-border px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-vsph-light-blue/20 text-vsph-core-blue grid place-items-center shrink-0">
                          <Building2 size={18} />
                        </span>
                        <div className="min-w-0">
                          <span className="block font-semibold text-sidebar truncate">{t.tenant_name}</span>
                          <span className="block text-xs text-slate-500 font-mono">{t.tenant_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-vsph-light-blue/20 text-vsph-core-blue">
                        {t.tenant_plan}
                      </span>
                    </td>
                    <td className="border-b border-border px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                        t.tenant_status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {t.tenant_status}
                      </span>
                    </td>
                    <td className="border-b border-border px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                          t.tenant_entitlements?.[0]?.entitlement_status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : t.tenant_entitlements?.[0]?.entitlement_status === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : t.tenant_entitlements?.[0]?.entitlement_status === 'EXPIRED' || t.tenant_entitlements?.[0]?.entitlement_status === 'REVOKED'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {t.tenant_entitlements?.[0]?.entitlement_status || 'UNKNOWN'}
                        </span>
                        <span className="block text-[10px] text-secondary">
                          {t.external_organization_id ? `Synced ${t.tenant_sync_status || ''}`.trim() : 'Not linked to platform'}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-border px-6 py-4 text-slate-600">{t._count?.tenant_users ?? 0}</td>
                    <td className="border-b border-border px-6 py-4 text-slate-600">{t._count?.tenant_accounts ?? 0}</td>
                    <td className="border-b border-border px-6 py-4 text-slate-500 text-xs">
                      {t.tenant_created_at ? new Date(t.tenant_created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="border-b border-border px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/superadmin/tenants/${t.tenant_id}/users`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-semibold text-sidebar hover:border-vsph-core-blue hover:text-vsph-core-blue transition-colors"
                          title="Manage employees"
                        >
                          <Users size={15} /> Employees
                        </Link>
                        <button onClick={() => openEdit(t)} className="p-2 rounded-md text-slate-500 hover:text-vsph-core-blue hover:bg-vsph-light-blue/20 transition-colors" title="Edit organization">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteTenant(t)} className="p-2 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete organization">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl border border-border w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sidebar text-lg font-semibold">{editing ? 'Edit organization' : 'Internal support: new organization'}</h2>
                <p className="text-xs text-secondary mt-0.5">
                  {editing
                    ? 'Update the organization. CRM access is controlled by platform entitlement.'
                    : 'Commercial onboarding belongs at apps.vsph.in. Use this only for support or repair.'}
                </p>
              </div>
              <button onClick={closeForm} className="p-2 rounded-md border border-border text-slate-400 hover:text-sidebar hover:bg-vsph-light-blue/20 transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveTenant} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className={label} htmlFor="tenant_name">Organization name *</label>
                <input id="tenant_name" required value={formData.tenant_name}
                  onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                  className={input} placeholder="e.g. Acme Industries" />
              </div>
              <div>
                <label className={label} htmlFor="tenant_code">Organization code *</label>
                <input id="tenant_code" required value={formData.tenant_code}
                  onChange={(e) => setFormData({ ...formData, tenant_code: e.target.value.toUpperCase() })}
                  className={`${input} font-mono`} placeholder="e.g. ACME001" />
                <p className="text-xs text-secondary mt-1.5">A short unique code used to identify this organization.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label} htmlFor="tenant_plan">Plan</label>
                  <select id="tenant_plan" value={formData.tenant_plan}
                    onChange={(e) => setFormData({ ...formData, tenant_plan: e.target.value })} className={input}>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="tenant_status">Status</label>
                  <select id="tenant_status" value={formData.tenant_status}
                    onChange={(e) => setFormData({ ...formData, tenant_status: e.target.value })} className={input}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="h-11 px-5 rounded-lg border border-border text-sidebar text-sm font-semibold hover:bg-sidebar hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-vsph-navy inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? <Save size={16} /> : <Plus size={16} />}
                  {editing ? 'Save changes' : 'Create organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TenantManagement
