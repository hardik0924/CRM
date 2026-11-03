import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldIcon, UserIcon, Building2Icon, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft,
} from 'lucide-react';
import { api } from '../utils/api';

const Login = () => {
  const [role, setRole] = useState(null); // 'superadmin' | 'client'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError(null);
  };

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
        localStorage.setItem("vsph_user_id", user.id);
        localStorage.setItem("vsph_user_role", user.role);
        localStorage.setItem("vsph_user_name", user.name);
        localStorage.setItem("vsph_user_email", user.email);
        localStorage.setItem("vsph_user_owner", user.isTenantOwner ? "true" : "false");
        localStorage.setItem("vsph_tenant_id", user.tenantId || "");
        localStorage.setItem("vsph_tenant_name", user.tenantName || "");
        localStorage.setItem("vsph_tenant_code", user.tenantCode || "");

        // Superadmin → client management panel; Client → CRM dashboard
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
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const roleCards = [
    {
      value: "superadmin",
      title: "Superadmin Login",
      subtitle: "Create and manage client accounts",
      icon: ShieldIcon,
      color: "text-vsph-core-blue",
      bg: "bg-vsph-light-blue/10",
      border: "border-vsph-navy hover:border-vsph-core-blue",
    },
    {
      value: "client",
      title: "CRM Login",
      subtitle: "For client administrators and employees",
      icon: Building2Icon,
      color: "text-vsph-navy",
      bg: "bg-vsph-grey",
      border: "border-vsph-navy hover:border-vsph-core-blue",
    },
  ];

  return (
    <div className="h-screen w-full flex bg-vsph-navy text-slate-900 overflow-hidden">
      {/* Left: VSPh Brand */}
      <div className="hidden lg:flex w-1/2 bg-vsph-navy flex-col justify-between p-12 lg:p-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-vsph-core-blue/10 opacity-60"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-10">
            <img src="/vsph-logo-white.png" alt="VSPH" className="h-20 w-auto object-cover" />
          </div>

          <h1 className="text-vsph-white text-4xl lg:text-6xl font-bold leading-tight mb-6">
            Your complete relationship<br />
            management platform.
          </h1>
          <p className="text-vsph-light-blue/90 text-lg mb-10 leading-relaxed max-w-md font-light">
            Manage accounts, contacts, opportunities, and campaigns — all in one place.
          </p>

          <ul className="space-y-5">
            {[
              "Unified contact &amp; account management",
              "Pipeline tracking &amp; opportunity insights",
              "Bulk import &amp; export for all modules",
              "Secure, role-based access control",
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-4 text-vsph-light-blue/80">
                <div className="w-9 h-9 rounded-full bg-vsph-core-blue/20 border border-vsph-core-blue/30 flex items-center justify-center shrink-0">
                  <ShieldIcon size={16} className="text-vsph-core-blue" />
                </div>
                <span className="text-base font-light">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mb-8">
          <p className="text-vsph-light-blue/60 text-xs font-semibold uppercase tracking-widest">
            Vision &bull; Straight &bull; Patience &bull; Higher
          </p>
          <p className="text-vsph-light-blue/50 text-sm mt-1">
            &copy; 2026 VSPH. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Role selection (shown when no role selected) */}
        {!role && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-8">
            <div className="max-w-md w-full mx-auto">
              <div className="flex items-center gap-2 mb-8">
                <img src="/vsph-logo-dark.png" alt="VSPH" className="h-14 w-auto object-cover" />
              </div>

              <h1 className="text-vsph-navy text-2xl font-bold tracking-tight mb-2">
                Sign in to VSPH CRM
              </h1>
              <p className="text-slate-500 text-sm mb-8">
                Choose your account type to continue
              </p>

              <div className="grid grid-cols-1 gap-4">
                {roleCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.value}
                      onClick={() => handleRoleSelect(card.value)}
                      className={`w-full flex items-start p-6 rounded-xl border-2 transition-all duration-300 hover:border-vsph-core-blue hover:bg-vsph-light-blue/20 ${card.border} bg-white cursor-pointer`}
                    >
                      <div className={`p-3 rounded-lg ${card.bg} ${card.color} mr-4 transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-vsph-navy group-hover:text-vsph-core-blue transition-colors">
                          {card.title}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">{card.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Login form (shown after role selected) */}
        {role && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-8">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => setRole(null)}
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-vsph-core-blue transition-colors font-medium"
                >
                  <ArrowLeft size={16} /> Back to role selection
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <img src="/vsph-logo-dark.png" alt="VSPH" className="h-12 w-auto object-cover" />
              </div>

              <h1 className="text-vsph-navy text-2xl font-bold tracking-tight mb-1">
                {role === "superadmin" ? "Superadmin login" : "CRM login"}
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                {role === "superadmin"
                  ? "Create and manage client accounts"
                  : "Client administrators and employees sign in here"}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-md border border-rose-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="!pl-10 block w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue transition-all"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                      Password
                    </label>
                    <a href="#" className="text-sm font-medium text-vsph-core-blue hover:text-vsph-navy hover:underline transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="!pl-10 !pr-10 block w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue transition-all"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
