import { useEffect, useState } from 'react'
import {
  Ban, Check, CheckCircle2, Copy, Loader2, Mail, RefreshCw, ShieldCheck, UserPlus, Users, BarChart3,
} from 'lucide-react'
import Button from '../components/ui/Button'
import InviteEmployeeModal from '../components/modals/InviteEmployeeModal'
import EmployeeAccessModal from '../components/modals/EmployeeAccessModal'
import { moduleLabel, currentOrgRole, orgRoleLabel } from '../utils/modules'
import { api } from '../utils/api'
import toast from 'react-hot-toast'

const EMPLOYEE_ROLES = ['USER', 'SALES', 'DATA', 'PRODUCTION', 'SPONSORSHIP', 'OPERATION']
const OWNER_ROLES = ['ADMIN', ...EMPLOYEE_ROLES]
const roleLabel = (employee) =>
  employee.user_is_tenant_owner ? 'Organization Super Admin' : employee.user_role === 'ADMIN' ? 'Organization Admin' : 'Employee'

const Team = () => {
  const currentUserId = localStorage.getItem('vsph_user_id')
  const isOwner = currentOrgRole() === 'ORG_SUPER_ADMIN'
  const canManage = ['ORG_ADMIN', 'ORG_SUPER_ADMIN'].includes(currentOrgRole())
  const ROLES = isOwner ? OWNER_ROLES : EMPLOYEE_ROLES

  const [employees, setEmployees] = useState([])
  const [work, setWork] = useState(null)
  const [loading, setLoading] = useState(canManage)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [accessFor, setAccessFor] = useState(null)
  const [devLink, setDevLink] = useState('')
  const [busyId, setBusyId] = useState(null)

  const fetchEmployees = async () => {
    try {
      const [res, metrics] = await Promise.all([
        api.get('/api/organization/employees'),
        api.get('/api/dashboard/metrics').catch(() => null),
      ])
      if (res.success) setEmployees(res.data)
      else toast.error(res.message || 'Could not load employees')
      if (metrics?.success) setWork(metrics.data?.work || null)
    } catch (err) {
      console.error('Error fetching employees:', err)
      toast.error('Could not load employees')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canManage) fetchEmployees()
  }, [canManage])

  const updateEmployee = async (employee, patch) => {
    setBusyId(employee.user_id)
    try {
      const res = await api.patch(`/api/organization/employees/${employee.user_id}`, patch)
      if (!res.success) throw new Error(res.message || 'Could not update employee')
      toast.success('Employee updated')
      fetchEmployees()
    } catch (err) {
      toast.error(err.message || 'Could not update employee')
    } finally {
      setBusyId(null)
    }
  }

  const resend = async (employee) => {
    setBusyId(employee.user_id)
    try {
      const res = await api.post(`/api/organization/employees/${employee.user_id}/resend-invite`, {})
      if (!res.success) throw new Error(res.message || 'Could not resend invitation')
      if (res.data?.devInvitationUrl) setDevLink(res.data.devInvitationUrl)
      toast.success('Invitation resent')
      fetchEmployees()
    } catch (err) {
      toast.error(err.message || 'Could not resend invitation')
    } finally {
      setBusyId(null)
    }
  }

  const copyDevLink = async () => {
    await navigator.clipboard.writeText(devLink)
    toast.success('Link copied')
  }

  if (!canManage) {
    return (
      <div className="p-8 bg-page-bg">
        <div className="card border-border p-8 max-w-xl mx-auto">
          <ShieldCheck size={32} className="text-slate-300" />
          <h1 className="text-sidebar text-xl font-semibold mt-4">Administrator access required</h1>
          <p className="text-secondary text-sm mt-2">
            Only your organization's administrator can manage employees.
          </p>
        </div>
      </div>
    )
  }

  const accessLabel = (employee) => {
    if (employee.user_is_tenant_owner || employee.modules === null) return 'All modules'
    if (!employee.modules?.length) return 'Dashboard only'
    const labels = employee.modules.map(moduleLabel)
    return labels.length <= 2 ? labels.join(', ') : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
  }

  return (
    <div className="flex flex-col h-full bg-page-bg animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between px-8 py-6 surface border-b border-border shrink-0">
        <div>
          <h1 className="text-sidebar text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-secondary text-sm font-medium mt-0.5">
            People in your organization who can sign in to CRM.
          </p>
        </div>
        <Button variant="primary" size="sm" className="gap-2 font-semibold" onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Invite employee
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {devLink && (
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#F7FBFF] border border-[#CFE1F1] p-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold tracking-[0.12em] text-vsph-core-blue">DEVELOPMENT INVITATION LINK</p>
              <code className="block text-xs break-all text-sidebar mt-1">{devLink}</code>
            </div>
            <button onClick={copyDevLink} className="p-2 rounded-lg text-slate-500 hover:text-vsph-core-blue" title="Copy link">
              <Copy size={16} />
            </button>
          </div>
        )}

        {work && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
            {[
              { label: 'Total tasks', value: work.total },
              { label: 'To do', value: work.byStatus?.TODO || 0 },
              { label: 'In progress', value: work.byStatus?.IN_PROGRESS || 0 },
              { label: 'Blocked', value: work.byStatus?.BLOCKED || 0 },
              { label: 'Overdue', value: work.overdue },
              { label: 'Avg progress', value: `${work.averageProgress}%` },
            ].map((tile) => (
              <div key={tile.label} className="card border-border p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">{tile.label}</p>
                <p className="text-xl font-bold text-sidebar mt-1">{tile.value}</p>
              </div>
            ))}
          </div>
        )}

        {work?.byUser?.length > 0 && (
          <div className="card border-border mb-5">
            <div className="flex items-center gap-2 p-5 border-b border-border">
              <BarChart3 size={18} className="text-vsph-core-blue" />
              <h2 className="text-sidebar text-lg font-semibold">Work progress</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="bg-surface text-[#475569] text-xs">
                    <th className="px-5 py-3 font-semibold">Person</th>
                    <th className="px-5 py-3 font-semibold">Tasks</th>
                    <th className="px-5 py-3 font-semibold">Completed</th>
                    <th className="px-5 py-3 font-semibold">Overdue</th>
                    <th className="px-5 py-3 font-semibold">Average progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {work.byUser.map((row) => (
                    <tr key={row.user_id || 'unassigned'} className="hover:bg-vsph-light-blue/20">
                      <td className="px-5 py-3 font-semibold text-sidebar">{row.user_name}</td>
                      <td className="px-5 py-3 text-slate-600">{row.total}</td>
                      <td className="px-5 py-3 text-slate-600">{row.completed}</td>
                      <td className="px-5 py-3 text-slate-600">{row.overdue}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full bg-vsph-core-blue" style={{ width: `${row.averageProgress}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{row.averageProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-vsph-core-blue" />
              <h2 className="text-sidebar text-lg font-semibold">Employees</h2>
            </div>
            <span className="text-xs text-secondary">{employees.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="bg-surface text-[#475569] text-xs">
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Module access</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-14 text-center text-secondary">
                      <Loader2 size={24} className="animate-spin text-vsph-core-blue mx-auto mb-2" />
                      Loading employees...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-14 text-center text-secondary">
                      <Mail size={24} className="text-slate-300 mx-auto mb-3" />
                      No employees yet. Invite your first team member.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => {
                    const isSelf = employee.user_id === currentUserId
                    const pending = Boolean(employee.pendingInvitation)
                    const busy = busyId === employee.user_id
                    return (
                      <tr key={employee.user_id} className="hover:bg-vsph-light-blue/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-vsph-light-blue/20 text-vsph-core-blue grid place-items-center font-bold text-xs shrink-0">
                              {(employee.user_name || employee.user_email || 'U').substring(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <span className="block font-semibold text-sidebar truncate">
                                {employee.user_name}
                                {employee.user_is_tenant_owner && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    <ShieldCheck size={11} /> Owner
                                  </span>
                                )}
                                {isSelf && <span className="ml-2 text-[10px] font-bold text-slate-400">YOU</span>}
                              </span>
                              <span className="block text-xs text-slate-500 truncate">{employee.user_email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {employee.user_is_tenant_owner || isSelf || (employee.user_role === 'ADMIN' && !isOwner) ? (
                            <span className="text-xs font-medium text-sidebar">{roleLabel(employee)}</span>
                          ) : (
                            <select
                              value={employee.user_role}
                              disabled={busy}
                              onChange={(e) => updateEmployee(employee, { user_role: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue"
                            >
                              {ROLES.map((r) => <option key={r} value={r}>{r === 'ADMIN' ? 'Organization Admin' : 'Employee'}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-xs">
                          {employee.user_department?.replace(/_/g, ' ') || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600">{accessLabel(employee)}</span>
                            {!employee.user_is_tenant_owner && (
                              <button
                                onClick={() => setAccessFor(employee)}
                                className="text-[11px] font-semibold text-vsph-core-blue hover:underline"
                              >
                                Manage
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {pending ? (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
                              Invited
                            </span>
                          ) : employee.user_status ? (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {pending && (
                              <button
                                onClick={() => resend(employee)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-semibold text-sidebar hover:border-vsph-core-blue hover:text-vsph-core-blue disabled:opacity-50"
                                title="Resend invitation"
                              >
                                <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Resend
                              </button>
                            )}
                            {!employee.user_is_tenant_owner && !isSelf && !(employee.user_role === 'ADMIN' && !isOwner) && (
                              <button
                                onClick={() => updateEmployee(employee, { user_status: !employee.user_status })}
                                disabled={busy}
                                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold disabled:opacity-50 ${
                                  employee.user_status
                                    ? 'border-border text-rose-600 hover:bg-rose-50'
                                    : 'border-border text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={employee.user_status ? 'Deactivate employee' : 'Activate employee'}
                              >
                                {employee.user_status ? <Ban size={14} /> : <Check size={14} />}
                                {employee.user_status ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            {!pending && employee.user_status && !employee.user_is_tenant_owner && !isSelf && (
                              <span className="p-2 text-emerald-500" title="Account active">
                                <CheckCircle2 size={16} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-secondary mt-4">
          Employees only see this organization's CRM data, and only the modules you assign. Platform-level roles cannot be granted here.
        </p>
      </div>

      {inviteOpen && (
        <InviteEmployeeModal isOpen onClose={() => setInviteOpen(false)} onSaved={fetchEmployees} />
      )}

      {accessFor && (
        <EmployeeAccessModal
          isOpen
          employee={accessFor}
          onClose={() => setAccessFor(null)}
          onSaved={fetchEmployees}
        />
      )}
    </div>
  )
}

export default Team
