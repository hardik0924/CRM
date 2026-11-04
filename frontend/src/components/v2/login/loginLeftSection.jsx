import React from 'react'
import { Users, TrendingUp, Download, ShieldCheck } from 'lucide-react';

const LoginLeftSection = () => {
    const features = [
        { text: "Unified contact & account management", icon: <Users size={18} /> },
        { text: "Pipeline tracking & opportunity insights", icon: <TrendingUp size={18} /> },
        { text: "Bulk import & export for all modules", icon: <Download size={18} /> },
        { text: "Secure, role-based access control", icon: <ShieldCheck size={18} /> }
    ];

    return (
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#031A3D] via-vsph-navy to-[#003E86] p-10 md:flex lg:p-14">
            {/* Dot grid + glow */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)', backgroundSize: '22px 22px' }}
            />
            <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-vsph-light-blue/25 blur-[110px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-vsph-core-blue/40 blur-[110px]" />

            {/* Brand */}
            <div className="relative z-10 flex items-center gap-3">
                <img src="/vsph-logo-white.png" alt="VSPH" className="h-12 w-auto object-contain" />
            </div>

            {/* Message */}
            <div className="relative z-10 my-10">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/80 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-vsph-light-blue" />
                    Relationship intelligence
                </span>
                <h1 className="mb-5 text-4xl font-semibold leading-[1.12] tracking-tight text-white lg:text-[2.75rem]">
                    Your complete relationship management platform.
                </h1>
                <p className="mb-9 max-w-md text-[15px] leading-relaxed text-white/60">
                    Manage accounts, contacts, opportunities, and campaigns — all in one place. Built for the VSPH team.
                </p>

                <ul className="space-y-3">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vsph-light-blue/15 text-vsph-light-blue">
                                {feature.icon}
                            </span>
                            <span className="text-sm text-white/80">{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/40">
                <span>© {new Date().getFullYear()} VSPH</span>
                <span>Secure workspace</span>
            </div>
        </div>
    )
}

export default LoginLeftSection
