import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { api } from "../../../utils/api"

const LoginForm = ({ title = "Welcome back", subtitle = "Sign in to your VSPH CRM workspace" }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.post("/api/auth/login", {
                email: formData.email,
                password: formData.password,
            });

            if (res.success) {
                const user = res.user;
                localStorage.setItem("vsph_auth_token", res.token);
                localStorage.setItem("vsph_user_id", user.id);
                localStorage.setItem("vsph_user_role", user.role);
                localStorage.setItem("vsph_user_name", user.name);
                localStorage.setItem("vsph_user_email", user.email);
                localStorage.setItem("vsph_user_owner", user.isTenantOwner ? "true" : "false");
                localStorage.setItem("vsph_org_role", user.orgRole || "");
                localStorage.setItem("vsph_tenant_id", user.tenantId || "");
                localStorage.setItem("vsph_tenant_name", user.tenantName || "");
                localStorage.setItem("vsph_tenant_code", user.tenantCode || "");
                localStorage.setItem("vsph_user_modules", JSON.stringify(user.modules ?? null));
                localStorage.setItem("vsph_user_actions", JSON.stringify(user.moduleActions ?? null));

                if (user.role === "SUPER_ADMIN") {
                    navigate("/superadmin");
                } else {
                    navigate("/v2/dashboard");
                }
            } else {
                setError(res.message || "Login failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex w-full flex-col justify-center bg-white px-6 py-10 sm:px-12 md:w-1/2 lg:px-16">
            <div className="mx-auto w-full max-w-[420px]">
                {/* Brand (mobile only, the left panel is hidden) */}
                <div className="mb-8 flex items-center md:hidden">
                    <img src="/vsph-logo-dark.png" alt="VSPH" className="h-10 w-auto object-contain" />
                </div>

                {/* Header */}
                <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
                    <h1 className="text-[28px] font-semibold tracking-tight text-vsph-navy">{title}</h1>
                    <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                </div>

                {/* Error */}
                {error && (
                    <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5 animate-slide-up" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">Email address</label>
                        <div className="relative">
                            <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@company.com"
                                className="!h-12 !rounded-xl !border-slate-200 !pl-11 !text-[15px] shadow-sm transition-all focus:!border-vsph-core-blue focus:!ring-4 focus:!ring-vsph-core-blue/10"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
                        <div className="relative">
                            <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                className="!h-12 !rounded-xl !border-slate-200 !pl-11 !pr-12 !text-[15px] shadow-sm transition-all focus:!border-vsph-core-blue focus:!ring-4 focus:!ring-vsph-core-blue/10"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-vsph-navy to-vsph-core-blue text-sm font-semibold text-white shadow-lg shadow-vsph-core-blue/20 transition-all hover:shadow-xl hover:shadow-vsph-core-blue/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Signing in…
                            </>
                        ) : (
                            <>
                                Sign in
                                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
                    Your role and module access are managed by your organization administrator.
                </p>
            </div>
        </div>
    )
}

export default LoginForm
