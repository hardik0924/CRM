import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Users, Building2, ArrowLeft, Plus, Edit3, Trash2, Loader2, ShieldCheck,
  Mail, LayoutGrid, UserPlus,
} from 'lucide-react'
import { api } from '../../utils/api'
import UserFormModal from '../../components/superadmin/UserFormModal'
import toast from 'react-hot-toast'

const TenantUsers = () => {
  const { id } = useParams()
  const [users, setUsers] = useState([])
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)

  useEffect(() => {
    fetchTenantUsers()
  }, [id])

  const fetchTenantUsers = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        api.get(`/api/tenants/${id}`),
        api.get(`/api/tenants/${id}/users`),
      ])
      if (tRes.success) setTenant(tRes.data)
      if (uRes.success) setUsers(uRes.data)
    } catch (err) {
      console.error('Error fetching employees:', err)
      toast.error('Could not load employees')
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
      const res = await api.delete(`/api/tenants/${id}/users/${u.user_id}`)
      if (!res.success) throw new Error(res.message || 'Could not delete employee')
      toast.success('Employee deleted')
      fetchTenantUsers()
    } catch (err) {
      toast.error(err.message || 'Could not delete employee')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-page-bg">
        <Loader2 size={28} className="animate-spin text-vsph-core-blue" />
        <p className="mt-3 text-sm text-sidebar">Loading organization...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in bg-page-bg min-h-screen">
      <Link to="/superadmin/tenants" className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-vsph-core-blue mb-5">
        <ArrowLeft size={16} /> Back to organizations
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-6">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-xl bg-vsph-core-blue text-white grid place-items-center shrink-0">
            <Building2 size={24} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sidebar text-3xl font-semibold tracking-tight">{tenant?.tenant_name || 'Organization'}</h1>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                tenant?.tenant_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {tenant?.tenant_status || '—'}
              </span>
            </div>
            <p className="text-sm text-secondary mt-1">
              <span className="font-mono">{tenant?.tenant_code}</span>
              <span className="mx-2 text-slate-300">•</span>
              {tenant?.tenant_plan} plan
              {tenant?.tenant_entitlements?.[0] && (
                <span className="ml-2 font-semibold text-sidebar">
                  · CRM {tenant.tenant_entitlements[0].entitlement_status}
                </span>
              )}
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-vsph-navy transition-colors shrink-0 shadow-sm shadow-vsph-core-blue/20">
          <UserPlus size={17} /> Create employee
        </button>
      </div>

      {tenant?.external_organization_id && (
        <div className="mb-6 rounded-xl bg-vsph-core-blue/5 border border-vsph-core-blue/20 p-4 text-sm text-secondary">
          This organization is linked to <span className="font-semibold text-sidebar">apps.vsph.in</span>.
          Manage its identity, subscription and CRM entitlement there. Employee actions here are internal support only.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-secondary uppercase">EMPLOYEES</p>
              <p className="text-3xl font-semibold text-sidebar mt-1">{users.length}</p>
            </div>
            <Users size={22} className="text-vsph-core-blue" />
          </div>
        </div>
        <div className="card border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-secondary uppercase">ACTIVE</p>
              <p className="text-3xl font-semibold text-sidebar mt-1">{users.filter((u) => u.user_status).length}</p>
            </div>
            <ShieldCheck size={22} className="text-emerald-500" />
          </div>
        </div>
        <div className="card border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-secondary uppercase">CRM ACCOUNTS</p>
              <p className="text-3xl font-semibold text-sidebar mt-1">{tenant?._count?.tenant_accounts ?? 0}</p>
            </div>
            <LayoutGrid size={22} className="text-sidebar" />
          </div>
        </div>
      </div>

      <div className="card border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-sidebar text-lg font-semibold">Employees</h2>
          <p className="text-sm text-secondary mt-0.5">People at this organization who can sign in to the CRM.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern min-w-[720px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-secondary">
                    <div className="flex flex-col items-center gap-3">
                      <Mail size={24} className="text-slate-300" />
                      <p>No employees yet. Create the first person who will sign in to this organization's CRM.</p>
                      <button onClick={openCreate} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-vsph-core-blue text-white text-xs font-semibold">
                        <Plus size={15} /> Create employee
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-vsph-light-blue/20 transition-colors">
                    <td className="border-b border-border px-5 py-4 font-semibold text-sidebar">{u.user_name}</td>
                    <td className="border-b border-border px-5 py-4 text-slate-600">{u.user_email}</td>
                    <td className="border-b border-border px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-vsph-light-blue/20 text-vsph-core-blue">
                        {u.user_role?.replace(/_/g, ' ')}
                      </span>
                      {u.user_is_tenant_owner && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <ShieldCheck size={11} /> Owner
                        </span>
                      )}
                    </td>
                    <td className="border-b border-border px-5 py-4 text-slate-600">{u.user_department?.replace(/_/g, ' ')}</td>
                    <td className="border-b border-border px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                        u.user_status ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {u.user_status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="border-b border-border px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(u)} className="p-2 rounded-md text-slate-500 hover:text-vsph-core-blue hover:bg-vsph-light-blue/20 transition-colors" title="Edit employee">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteUser(u)} className="p-2 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete employee">
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
        onSaved={fetchTenantUsers}
        tenantId={id}
        userToEdit={userToEdit}
      />
    </div>
  )
}

export default TenantUsers
