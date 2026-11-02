import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldAlert } from 'lucide-react'
import { api } from '../utils/api'

const AcceptInvite = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState(token ? '' : 'This invitation link is missing its token.')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get(`/api/invitations/${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.success) throw new Error(res.message || 'This invitation link is invalid.')
        setInvitation(res.data)
        if (!res.data.usable) {
          setError(
            res.data.status === 'ACCEPTED'
              ? 'This invitation has already been used. Sign in with your password.'
              : 'This invitation has expired. Ask your administrator to resend it.'
          )
        }
      })
      .catch((err) => setError(err.message || 'This invitation link is invalid.'))
      .finally(() => setLoading(false))
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/api/invitations/accept', { token, password })
      if (!res.success) throw new Error(res.message || 'Could not activate your account.')
      setDone(true)
      setTimeout(() => navigate('/v2/login/client', { replace: true }), 2500)
    } catch (err) {
      setError(err.message || 'Could not activate your account.')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue'

  return (
    <div className="min-h-screen w-full bg-vsph-grey flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/vsph-logo-dark.png" alt="VSPH" className="h-12 w-auto" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-7">
          {loading ? (
            <div className="flex flex-col items-center py-10 text-slate-500">
              <Loader2 size={26} className="animate-spin text-vsph-core-blue" />
              <p className="mt-3 text-sm">Checking your invitation...</p>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={44} className="text-emerald-500 mx-auto" />
              <h1 className="text-vsph-navy text-xl font-semibold mt-4">Your account is ready</h1>
              <p className="text-slate-500 text-sm mt-2">
                You can now sign in with your email and new password.
              </p>
              <Link
                to="/v2/login/client"
                className="inline-flex mt-6 h-11 px-5 items-center rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-[#0054A4]"
              >
                Go to client login
              </Link>
            </div>
          ) : error && !invitation?.usable ? (
            <div className="text-center py-4">
              <ShieldAlert size={44} className="text-rose-500 mx-auto" />
              <h1 className="text-vsph-navy text-xl font-semibold mt-4">Invitation unavailable</h1>
              <p className="text-slate-500 text-sm mt-2">{error}</p>
              <Link
                to="/v2/login/client"
                className="inline-flex mt-6 h-11 px-5 items-center rounded-lg border border-vsph-navy text-vsph-navy text-sm font-semibold hover:bg-vsph-navy hover:text-white"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-[11px] font-bold tracking-[0.14em] text-vsph-core-blue">
                  {invitation?.organizationName || 'VSPH CRM'}
                </p>
                <h1 className="text-vsph-navy text-2xl font-semibold tracking-tight mt-1">
                  Activate your account
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Set a password for <span className="font-medium text-vsph-navy">{invitation?.email}</span>.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#253F60] mb-1.5" htmlFor="password">
                    New password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${input} pl-9 pr-10`}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-vsph-navy"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#253F60] mb-1.5" htmlFor="confirm">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={input}
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-[#0054A4] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Activating...' : 'Activate account'}
                </button>
              </form>

              {invitation?.expiresAt && (
                <p className="text-xs text-slate-400 mt-4 text-center">
                  This invitation expires {new Date(invitation.expiresAt).toLocaleString()}.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AcceptInvite
