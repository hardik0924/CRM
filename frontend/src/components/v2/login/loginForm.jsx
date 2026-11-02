import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { api } from "../../../utils/api"
import Button from "../../ui/Button"

const LoginForm = ({ role, title, subtitle }) => {
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
                localStorage.setItem("vsph_user_id", user.id);
                localStorage.setItem("vsph_user_role", user.role);
                localStorage.setItem("vsph_user_name", user.name);
                localStorage.setItem("vsph_user_email", user.email);
                localStorage.setItem("vsph_tenant_id", user.tenantId || "");
                localStorage.setItem("vsph_tenant_name", user.tenantName || "");
                localStorage.setItem("vsph_tenant_code", user.tenantCode || "");

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
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
                <div className="max-w-md w-full mx-auto">
                    {/* Back button */}
                    <div className="mb-8 animate-fade-in">
                        <Link to="/v2/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-vsph-core-blue transition-colors font-medium">
                            <ArrowLeft size={16} />
                            Back to role selection
                        </Link>
                    </div>

                    {/* VSPh Brand */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-vsph-navy rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-bold">V</span>
                        </div>
                        <span className="text-vsph-navy font-bold text-sm tracking-tight">VSPH</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                        <h1 className="text-vsph-navy text-2xl font-bold tracking-tight">{title}</h1>
                        <p className="text-slate-500 mt-2">{subtitle}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-rose-50 text-rose-700 text-sm rounded-md border border-rose-100">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    id="email" 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="!pl-10 block w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
                                <a href="#" className="text-sm font-medium text-vsph-core-blue hover:text-vsph-navy hover:underline transition-colors">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    className="!pl-10 !pr-10 block w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
                        </button>
                    </form>
                </div>
        </div>
    )
}

export default LoginForm
