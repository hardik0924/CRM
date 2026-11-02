import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Plus, Search, Edit3, Trash2, Loader2, Building2, ShieldCheck, UserPlus,
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

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const [uRes, tRes] = await Promise.all([api.get('/api/users'), api.get('/api/tenants')])
      if (uRes.success) setUsers(uRes.data)
      if (tRes.success) setTenants(tRes.data)
    } catch (err) {
      console.error('Error loading users:', err)
      toast.error('Could not load users')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setUserToEdit(null)
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setUserToEdit(u)
    setModalOpen(true)
  }

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.user_name}? They will no longer be able to sign in.`)) return
    try {
      const res = await api.delete(`/api/tenants/${u.tenant_fk}/users/${u.user_id}`)
      if (!res.success) throw new Error(res.message || 'Could not delete user')
      toast.success('User deleted')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not delete user')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      const matchesTenant = tenantFilter === 'ALL' || u.tenant_fk === tenantFilter
      const matchesSearch =
        u.user_name?.toLowerCase().includes(q) ||
        u.user_email?.toLowerCase().includes(q) ||
        u.tenant?.tenant_name?.toLowerCase().includes(q)
      return matchesTenant && matchesSearch
    })
  }, [users, search, tenantFilter])

  const clientUsers = users.filter((u) => u.tenant_fk).length
  const activeUsers = users.filter((u) => u.tenant_fk && u.user_status).length

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">PLATFORM / USERS</p>
          <h1 className="text-vsph-navy text-3xl font-semibold tracking-tight mt-1">Client users</h1>
          <p className="text-slate-500 text-sm mt-1">Everyone who can sign in to a client's CRM workspace.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-[#0054A4] transition-colors">
          <Plus size={18} /> Add user
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">TOTAL USERS</p>
            <p className="text-3xl font-semibold text-vsph-navy mt-1">{clientUsers}</p>
          </div>
          <Users size={22} className="text-vsph-core-blue" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">ACTIVE</p>
            <p className="text-3xl font-semibold text-vsph-navy mt-1">{activeUsers}</p>
          </div>
          <ShieldCheck size={22} className="text-emerald-500" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">CLIENTS</p>
            <p className="text-3xl font-semibold text-vsph-navy mt-1">{tenants.length}</p>
          </div>
          <Building2 size={22} className="text-vsph-navy" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <h2 className="text-vsph-navy text-lg font-semibold">All users</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
            >
              <option value="ALL">All clients</option>
              {tenants.map((t) => (
                <option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</option>
              ))}
            </select>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] text-[#475569] text-xs">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin text-vsph-core-blue mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <UserPlus size={24} className="text-slate-300" />
                      <p>{clientUsers === 0 ? 'No client users yet.' : 'No users match your filters.'}</p>
                      <button onClick={openCreate} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-vsph-core-blue text-white text-xs font-semibold">
                        <Plus size={15} /> Add user
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.user_id} className="hover:bg-[#F7FBFF] transition-colors">
                    <td className="px-5 py-4">
                      <span className="block font-semibold text-vsph-navy">{u.user_name}</span>
                      <span className="block text-xs text-slate-500">{u.user_email}</span>
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
                    <td className="px-5 py-4 text-slate-600">{u.user_department?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                        u.user_status ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.user_status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-slate-500 hover:text-vsph-core-blue hover:bg-vsph-light-blue/20" title="Edit user">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteUser(u)} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50" title="Delete user">
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
        userToEdit={userToEdit}
      />
    </div>
  )
}

export default UsersManagement