import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Users, Plus, Search, Edit3, Trash2, Loader2, Building2, ShieldCheck, Mail,
} from 'lucide-react'
import { api } from '../../utils/api'
import UserFormModal from '../../components/superadmin/UserFormModal'
import toast from 'react-hot-toast'

const UsersManagement = () => {
  const [users, setUsers] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)
  const [presetTenant, setPresetTenant] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const load = async () => {
    try {
      const [uRes, tRes] = await Promise.all([api.get('/api/users'), api.get('/api/tenants')])
      if (uRes.success) setUsers(uRes.data)
      if (tRes.success) setTenants(tRes.data)
    } catch (err) {
      console.error('Error loading users:', err)
      toast.error('Could not load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    const tenant = searchParams.get('tenant') || ''
    setUserToEdit(null)
    setPresetTenant(tenant)
    if (tenant) setTenantFilter(tenant)
    setModalOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const openCreate = () => {
    setUserToEdit(null)
    setPresetTenant('')
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setUserToEdit(u)
    setPresetTenant('')
    setModalOpen(true)
  }

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.user_name}? They will no longer be able to sign in.`)) return
    try {
      const res = await api.delete(`/api/tenants/${u.tenant_fk}/users/${u.user_id}`)
      if (!res.success) throw new Error(res.message || 'Could not delete employee')
      toast.success('Employee deleted')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not delete employee')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      if (!u.tenant_fk) return false
      const matchesTenant = tenantFilter === 'ALL' || String(u.tenant_fk) === tenantFilter
      const matchesSearch =
        u.user_name?.toLowerCase().includes(q) ||
        u.user_email?.toLowerCase().includes(q) ||
        u.tenant?.tenant_name?.toLowerCase().includes(q)
      return matchesTenant && matchesSearch
    })
  }, [users, search, tenantFilter])

  const clientUsers = users.filter((u) => u.tenant_fk).length
  const activeUsers = users.filter((u) => u.tenant_fk && u.user_status).length

  const initials = (value = '') =>
    value.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'EM'

  const stats = [
    { label: 'Employees', value: clientUsers, hint: 'People with a CRM membership', icon: Users, tone: 'text-vsph-core-blue bg-vsph-light-blue/20' },
    { label: 'Active', value: activeUsers, hint: 'Can sign in right now', icon: ShieldCheck, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Organizations', value: tenants.length, hint: 'Synced client workspaces', icon: Building2, tone: 'text-vsph-navy bg-vsph-grey' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">PLATFORM / EMPLOYEES</p>
          <h1 className="text-vsph-navy text-3xl font-semibold tracking-tight mt-1">Employees</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create and manage the people who can sign in to a client's CRM.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-[#0054A4] transition-colors shadow-sm shadow-vsph-core-blue/20"
        >
          <Plus size={18} /> Create employee
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">{s.label}</p>
                <p className="text-3xl font-semibold text-vsph-navy mt-1">{s.value}</p>
              </div>
              <span className={`w-11 h-11 rounded-xl grid place-items-center ${s.tone}`}>
                <s.icon size={21} />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div>
            <h2 className="text-vsph-navy text-lg font-semibold">All employees</h2>
            <p className="text-xs text-slate-500 mt-0.5">Internal support view across every organization.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
            >
              <option value="ALL">All organizations</option>
              {tenants.map((t) => (
                <option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</option>
              ))}
            </select>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#475569] text-xs">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Organization</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin text-vsph-core-blue mx-auto mb-2" />
                    Loading employees...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Mail size={24} className="text-slate-300" />
                      <p>{clientUsers === 0 ? 'No employees yet. Create the first one.' : 'No employees match your filters.'}</p>
                      <button onClick={openCreate} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-vsph-core-blue text-white text-xs font-semibold">
                        <Plus size={15} /> Create employee
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.user_id} className="hover:bg-[#F7FBFF] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-vsph-light-blue/20 text-vsph-core-blue grid place-items-center text-xs font-bold shrink-0">
                          {initials(u.user_name || u.user_email)}
                        </span>
                        <div className="min-w-0">
                          <span className="block font-semibold text-vsph-navy truncate">{u.user_name}</span>
                          <span className="block text-xs text-slate-500 truncate">{u.user_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {u.tenant ? (
                        <Link to={`/superadmin/tenants/${u.tenant_fk}/users`} className="inline-flex items-center gap-1.5 text-vsph-core-blue hover:underline">
                          <Building2 size={14} />
                          {u.tenant.tenant_name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-vsph-light-blue/20 text-vsph-core-blue">
                        {u.user_role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        u.user_status ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.user_status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.user_status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-slate-500 hover:text-vsph-core-blue hover:bg-vsph-light-blue/20" title="Edit employee">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteUser(u)} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50" title="Delete employee">
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

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        tenants={tenants}
        tenantId={presetTenant || undefined}
        userToEdit={userToEdit}
      />
    </div>
  )
}

export default UsersManagement
