import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2, Users, LayoutGrid, TrendingUp, ArrowRight, Plus, CheckCircle2,
  Loader2, ShieldCheck, UserPlus, Database,
} from 'lucide-react'
import { api } from '../../utils/api'

const SuperadminDashboard = () => {
  const [tenants, setTenants] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, uRes] = await Promise.all([
          api.get('/api/tenants'),
          api.get('/api/users'),
        ])
        if (tRes.success) setTenants(tRes.data)
        if (uRes.success) setUsers(uRes.data)
      } catch (err) {
        console.error('Error loading overview:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-vsph-core-blue" />
        <p className="mt-3 text-sm text-vsph-navy">Loading platform overview...</p>
      </div>
    )
  }

  const activeClients = tenants.filter((t) => t.tenant_status === 'ACTIVE').length
  const totalAccounts = tenants.reduce((sum, t) => sum + (t._count?.tenant_accounts || 0), 0)
  const clientUsers = users.filter((u) => u.tenant_fk).length

  const stats = [
    { label: 'Clients', value: tenants.length, hint: 'Organizations on the platform', icon: Building2, tone: 'text-vsph-core-blue bg-vsph-light-blue/20' },
    { label: 'Active clients', value: activeClients, hint: 'Currently enabled', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Client users', value: clientUsers, hint: 'People who can sign in', icon: Users, tone: 'text-vsph-navy bg-vsph-grey' },
    { label: 'CRM accounts', value: totalAccounts, hint: 'Across all clients', icon: LayoutGrid, tone: 'text-vsph-core-blue bg-[#EAF4FD]' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">PLATFORM / OVERVIEW</p>
          <h1 className="text-vsph-navy text-3xl font-semibold tracking-tight mt-1">Platform overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage which clients use the CRM, and who can sign in to each one.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/superadmin/tenants?new=1" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-[#0054A4] transition-colors">
            <Plus size={17} /> New client
          </Link>
          <Link to="/superadmin/users" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-vsph-navy text-vsph-navy text-sm font-semibold hover:bg-vsph-navy hover:text-white transition-colors">
            <Users size={17} /> Manage users
          </Link>
        </div>
      </div>

      {/* Purpose banner */}
      <div className="rounded-xl bg-vsph-navy text-white p-6 md:p-8 mb-6">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#B7D4EF]">FOR VSPH PLATFORM ADMINISTRATORS</p>
        <h2 className="text-2xl font-semibold tracking-tight mt-3">One place to manage client access.</h2>
        <p className="text-sm text-[#D5E3F0] leading-relaxed max-w-3xl mt-2">
          Create a client organization, add its users, and set their CRM role. This is the platform
          control center — it is separate from the CRM workspace your clients see.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { step: '01', title: 'Set up clients', text: 'Create an organization and choose a plan.' },
            { step: '02', title: 'Add client users', text: 'Give each person a login and a CRM role.' },
            { step: '03', title: 'Client signs in', text: 'They use the client login and see only their data.' },
          ].map((s) => (
            <div key={s.step} className="rounded-lg bg-[#16416F] border border-[#35618A] p-4">
              <span className="text-[11px] font-bold text-[#99D4EF]">{s.step}</span>
              <strong className="block text-sm font-semibold mt-1.5">{s.title}</strong>
              <p className="text-xs text-[#D4E4F1] leading-relaxed mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">{s.label}</p>
                <p className="text-3xl font-semibold text-vsph-navy mt-1">{s.value}</p>
              </div>
              <span className={`w-10 h-10 rounded-lg grid place-items-center ${s.tone}`}>
                <s.icon size={20} />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent clients */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 className="text-vsph-navy text-lg font-semibold">Recent clients</h2>
              <p className="text-xs text-slate-500 mt-0.5">The newest organizations on the platform.</p>
            </div>
            <Link to="/superadmin/tenants" className="inline-flex items-center gap-1.5 text-xs font-semibold text-vsph-core-blue hover:text-vsph-navy">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="bg-[#f8fafc] text-[#475569] text-xs">
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Users</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.slice(0, 5).map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-[#F7FBFF] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-vsph-navy">{t.tenant_name}</span>
                      <span className="block text-xs text-slate-500 font-mono">{t.tenant_code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-vsph-light-blue/20 text-vsph-core-blue">{t.tenant_plan}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{t._count?.tenant_users ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                        t.tenant_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>{t.tenant_status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/superadmin/tenants/${t.tenant_id}/users`} className="text-xs font-semibold text-vsph-core-blue hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-500">
                      No clients yet. Create your first one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-vsph-navy text-lg font-semibold">Quick actions</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Shortcuts for common setup tasks.</p>
          <div className="space-y-2.5">
            <Link to="/superadmin/tenants?new=1" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-vsph-core-blue hover:bg-[#F7FBFF] transition-colors">
              <span className="w-9 h-9 rounded-lg bg-vsph-light-blue/20 text-vsph-core-blue grid place-items-center"><Building2 size={18} /></span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-vsph-navy">Create a client</strong>
                <small className="block text-xs text-slate-500">Add a new organization</small>
              </span>
              <ArrowRight size={15} className="ml-auto text-slate-400" />
            </Link>
            <Link to="/superadmin/users" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-vsph-core-blue hover:bg-[#F7FBFF] transition-colors">
              <span className="w-9 h-9 rounded-lg bg-vsph-grey text-vsph-navy grid place-items-center"><UserPlus size={18} /></span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-vsph-navy">Add a user</strong>
                <small className="block text-xs text-slate-500">Give someone a CRM login</small>
              </span>
              <ArrowRight size={15} className="ml-auto text-slate-400" />
            </Link>
            <Link to="/superadmin/tenants" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-vsph-core-blue hover:bg-[#F7FBFF] transition-colors">
              <span className="w-9 h-9 rounded-lg bg-[#EAF4FD] text-vsph-core-blue grid place-items-center"><ShieldCheck size={18} /></span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-vsph-navy">Review access</strong>
                <small className="block text-xs text-slate-500">Plans, status and users</small>
              </span>
              <ArrowRight size={15} className="ml-auto text-slate-400" />
            </Link>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              Clients sign in from the same page with <strong className="text-vsph-navy">Client login</strong>.
              Their CRM only shows their own organization's data.
            </p>
            <button
              onClick={() => navigate('/superadmin/users')}
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-vsph-core-blue hover:text-vsph-navy"
            >
              <Database size={14} /> Manage client users
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperadminDashboard