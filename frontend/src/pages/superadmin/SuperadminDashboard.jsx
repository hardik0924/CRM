import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Users, LayoutGrid, ArrowRight, CheckCircle2, Loader2,
  ShieldCheck, UserPlus, Database, ExternalLink, Sparkles,
} from 'lucide-react'
import { api } from '../../utils/api'

const SuperadminDashboard = () => {
  const [tenants, setTenants] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

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

  const platformUrl = import.meta.env.VITE_CENTRAL_PLATFORM_URL || 'https://apps.vsph.in'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-vsph-core-blue" />
        <p className="mt-3 text-sm text-vsph-navy">Loading platform overview...</p>
      </div>
    )
  }

  const activeOrganizations = tenants.filter((t) => t.tenant_status === 'ACTIVE').length
  const totalAccounts = tenants.reduce((sum, t) => sum + (t._count?.tenant_accounts || 0), 0)
  const employees = users.filter((u) => u.tenant_fk).length
  const activeEmployees = users.filter((u) => u.tenant_fk && u.user_status).length

  const stats = [
    { label: 'Organizations', value: tenants.length, hint: 'Workspaces on the platform', icon: Building2, tone: 'text-vsph-core-blue bg-vsph-light-blue/20' },
    { label: 'Active', value: activeOrganizations, hint: 'Currently enabled', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Employees', value: employees, hint: `${activeEmployees} can sign in now`, icon: Users, tone: 'text-vsph-navy bg-vsph-grey' },
    { label: 'CRM accounts', value: totalAccounts, hint: 'Across every organization', icon: LayoutGrid, tone: 'text-vsph-core-blue bg-[#EAF4FD]' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-vsph-navy via-[#012B66] to-[#0054A4] px-6 py-8 md:px-10 md:py-10 mb-6 shadow-lg shadow-vsph-navy/10">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute -right-6 top-16 w-40 h-40 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold tracking-[0.12em] text-[#CFE6FA]">
            <Sparkles size={13} /> VSPH PLATFORM ADMINISTRATOR
          </span>
          <h1 className="text-white text-3xl md:text-4xl font-semibold tracking-tight mt-4">
            Your client workspace, at a glance.
          </h1>
          <p className="text-[#D5E3F0] text-sm md:text-base leading-relaxed mt-2 max-w-2xl">
            Commercial onboarding starts at apps.vsph.in. From here you create employees, review CRM access
            and support the organizations already on the platform.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/superadmin/users?new=1"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-white text-vsph-navy text-sm font-semibold hover:bg-[#EAF4FD] transition-colors shadow-sm"
            >
              <UserPlus size={17} /> Create employee
            </Link>
            <a
              href={platformUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              <ExternalLink size={16} /> Open apps.vsph.in
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">{s.label}</p>
                <p className="text-3xl font-semibold text-vsph-navy mt-1">{s.value}</p>
              </div>
              <span className={`w-11 h-11 rounded-xl grid place-items-center ${s.tone}`}>
                <s.icon size={20} />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent organizations */}
        <div className="xl:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 className="text-vsph-navy text-lg font-semibold">Recent organizations</h2>
              <p className="text-xs text-slate-500 mt-0.5">The newest workspaces on the platform.</p>
            </div>
            <Link to="/superadmin/tenants" className="inline-flex items-center gap-1.5 text-xs font-semibold text-vsph-core-blue hover:text-vsph-navy">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#475569] text-xs">
                  <th className="px-5 py-3 font-semibold">Organization</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Employees</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.slice(0, 5).map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-[#F7FBFF] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-vsph-light-blue/20 text-vsph-core-blue grid place-items-center shrink-0">
                          <Building2 size={15} />
                        </span>
                        <div className="min-w-0">
                          <span className="block font-semibold text-vsph-navy truncate">{t.tenant_name}</span>
                          <span className="block text-xs text-slate-500 font-mono">{t.tenant_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-vsph-light-blue/20 text-vsph-core-blue">{t.tenant_plan}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{t._count?.tenant_users ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        t.tenant_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.tenant_status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {t.tenant_status}
                      </span>
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
                      No organizations yet. New clients are onboarded at apps.vsph.in.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="text-vsph-navy text-lg font-semibold">Quick actions</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Shortcuts for common support tasks.</p>
          <div className="space-y-2.5">
            <Link to="/superadmin/users?new=1" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-vsph-core-blue hover:bg-[#F7FBFF] transition-colors">
              <span className="w-9 h-9 rounded-lg bg-vsph-light-blue/20 text-vsph-core-blue grid place-items-center"><UserPlus size={18} /></span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-vsph-navy">Create employee</strong>
                <small className="block text-xs text-slate-500">Give someone a CRM login</small>
              </span>
              <ArrowRight size={15} className="ml-auto text-slate-400" />
            </Link>
            <Link to="/superadmin/tenants" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-vsph-core-blue hover:bg-[#F7FBFF] transition-colors">
              <span className="w-9 h-9 rounded-lg bg-vsph-grey text-vsph-navy grid place-items-center"><ShieldCheck size={18} /></span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-vsph-navy">Review access</strong>
                <small className="block text-xs text-slate-500">Plans, status and CRM entitlement</small>
              </span>
              <ArrowRight size={15} className="ml-auto text-slate-400" />
            </Link>
            <a href={platformUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-vsph-core-blue hover:bg-[#F7FBFF] transition-colors">
              <span className="w-9 h-9 rounded-lg bg-[#EAF4FD] text-vsph-core-blue grid place-items-center"><Building2 size={18} /></span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold text-vsph-navy">Onboard a client</strong>
                <small className="block text-xs text-slate-500">Starts at apps.vsph.in</small>
              </span>
              <ExternalLink size={15} className="ml-auto text-slate-400" />
            </a>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              Client administrators and employees sign in from the same page with <strong className="text-vsph-navy">CRM login</strong>.
              Their CRM only shows their own organization's data.
            </p>
            <Link
              to="/superadmin/users"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-vsph-core-blue hover:text-vsph-navy"
            >
              <Database size={14} /> Manage all employees
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperadminDashboard
