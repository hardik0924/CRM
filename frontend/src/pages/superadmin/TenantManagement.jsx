import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Building2, Plus, Trash2, Edit3, Save, X, Search, Users, ArrowRight, Loader2,
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
      console.error('Error fetching clients:', err)
      toast.error('Could not load clients')
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

      if (!res.success) throw new Error(res.message || 'Could not save client')

      toast.success(editing ? 'Client updated' : 'Client created')
      const created = res.data
      closeForm()
      await fetchTenants()
      if (!editing && created?.tenant_id) {
        navigate(`/superadmin/tenants/${created.tenant_id}/users`)
      }
    } catch (err) {
      toast.error(err.message || 'Could not save client')
    } finally {
      setSaving(false)
    }
  }

  const deleteTenant = async (t) => {
    if (!confirm(`Delete "${t.tenant_name}"? All users and CRM data for this client will be removed.`)) return
    try {
      const res = await api.delete(`/api/tenants/${t.tenant_id}`)
      if (!res.success) throw new Error(res.message || 'Could not delete client')
      toast.success('Client deleted')
      fetchTenants()
    } catch (err) {
      toast.error(err.message || 'Could not delete client')
    }
  }

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase()
    return t.tenant_name?.toLowerCase().includes(q) || t.tenant_code?.toLowerCase().includes(q)
  })

  const input = 'w-full px-3.5 py-2.5 border border-[#b9c5d6] rounded-lg bg-[#f8fafc] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue'
  const label = 'block text-[13px] font-bold text-[#253F60] mb-2'

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">PLATFORM / CLIENTS</p>
          <h1 className="text-vsph-navy text-3xl font-semibold tracking-tight mt-1">Client organizations</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create a client, then add the people who can sign in to their CRM.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={import.meta.env.VITE_CENTRAL_PLATFORM_URL || 'https://apps.vsph.in'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-[#0054A4] transition-colors"
          >
            <Plus size={18} /> Onboard via apps.vsph.in
          </a>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-vsph-navy text-vsph-navy text-sm font-semibold hover:bg-vsph-navy hover:text-white transition-colors"
            title="Internal support only"
          >
            Internal support
          </button>
        </div>
      </div>

      {/* Centralized onboarding notice */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-xl bg-[#F7FBFF] border border-[#CFE1F1] p-6 mb-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.14em] text-vsph-core-blue">CENTRALIZED ONBOARDING</p>
          <h2 className="text-vsph-navy text-xl font-semibold tracking-tight mt-2">New clients start at apps.vsph.in</h2>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Create the organization, assign CRM and send the first administrator invitation from the central
            platform. CRM receives the organization automatically and stays the source of truth for CRM data.
            Use <span className="font-semibold text-vsph-navy">Internal support</span> only to repair or maintain
            an existing setup.
          </p>
        </div>
        <a
          href={import.meta.env.VITE_CENTRAL_PLATFORM_URL || 'https://apps.vsph.in'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-vsph-core-blue text-vsph-core-blue text-sm font-semibold hover:bg-vsph-core-blue hover:text-white transition-colors shrink-0"
        >
          Open central platform <ArrowRight size={16} />
        </a>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <h2 className="text-vsph-navy text-lg font-semibold">Clients</h2>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or code"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] text-[#475569] text-xs">
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">CRM access</th>
                <th className="px-5 py-3 font-semibold">Users</th>
                <th className="px-5 py-3 font-semibold">Accounts</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin text-vsph-core-blue mx-auto mb-2" />
                    Loading clients...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-slate-500">
                    {tenants.length === 0
                      ? 'No clients yet. New commercial clients are onboarded at apps.vsph.in.'
                      : 'No clients match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-[#F7FBFF] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-vsph-light-blue/20 text-vsph-core-blue grid place-items-center shrink-0">
                          <Building2 size={18} />
                        </span>
                        <div className="min-w-0">
                          <span className="block font-semibold text-vsph-navy truncate">{t.tenant_name}</span>
                          <span className="block text-xs text-slate-500 font-mono">{t.tenant_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-vsph-light-blue/20 text-vsph-core-blue">
                        {t.tenant_plan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                        t.tenant_status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {t.tenant_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const entitlement = t.tenant_entitlements?.[0]
                        const status = entitlement?.entitlement_status
                        const crew = {
                          ACTIVE: 'bg-emerald-50 text-emerald-700',
                          SUSPENDED: 'bg-amber-50 text-amber-700',
                          EXPIRED: 'bg-rose-50 text-rose-700',
                          REVOKED: 'bg-rose-50 text-rose-700',
                          PENDING: 'bg-slate-100 text-slate-600',
                        }
                        return (
                          <div className="space-y-1">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${crew[status] || 'bg-rose-50 text-rose-700'}`}>
                              {status || 'UNKNOWN'}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {t.external_organization_id ? `Synced ${t.tenant_sync_status || ''}`.trim() : 'Not linked to platform'}
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{t._count?.tenant_users ?? 0}</td>
                    <td className="px-5 py-4 text-slate-600">{t._count?.tenant_accounts ?? 0}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {t.tenant_created_at ? new Date(t.tenant_created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/superadmin/tenants/${t.tenant_id}/users`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-vsph-navy hover:border-vsph-core-blue hover:text-vsph-core-blue transition-colors"
                          title="Manage users"
                        >
                          <Users size={15} /> Users
                        </Link>
                        <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-slate-500 hover:text-vsph-core-blue hover:bg-vsph-light-blue/20" title="Edit client">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteTenant(t)} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50" title="Delete client">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-vsph-navy/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-vsph-navy text-lg font-semibold">{editing ? 'Edit client' : 'Internal support: new client'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editing
                    ? 'Update the client organization. CRM access is controlled by platform entitlement.'
                    : 'Commercial onboarding belongs at apps.vsph.in. Use this only for support or repair.'}
                </p>
              </div>
              <button onClick={closeForm} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-vsph-navy" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveTenant} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className={label} htmlFor="tenant_name">Client name *</label>
                <input id="tenant_name" required value={formData.tenant_name}
                  onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                  className={input} placeholder="e.g. Acme Industries" />
              </div>
              <div>
                <label className={label} htmlFor="tenant_code">Client code *</label>
                <input id="tenant_code" required value={formData.tenant_code}
                  onChange={(e) => setFormData({ ...formData, tenant_code: e.target.value.toUpperCase() })}
                  className={`${input} font-mono`} placeholder="e.g. ACME001" />
                <p className="text-xs text-slate-500 mt-1.5">A short unique code used to identify this client.</p>
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
                <button type="button" onClick={closeForm} className="h-11 px-5 rounded-lg border border-vsph-navy text-vsph-navy text-sm font-semibold hover:bg-vsph-navy hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-[#0054A4] inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? <Save size={16} /> : <Plus size={16} />}
                  {editing ? 'Save changes' : 'Create client'}
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
