import React from 'react'
import { Users, TrendingUp, Download, ShieldCheck } from 'lucide-react';

const LoginLeftSection = () => {
    const features = [
        { text: "Unified contact & account management", icon: <Users size={18} className="text-indigo-400" /> },
        { text: "Pipeline tracking & opportunity insights", icon: <TrendingUp size={18} className="text-indigo-400" /> },
        { text: "Bulk import & export for all modules", icon: <Download size={18} className="text-indigo-400" /> },
        { text: "Secure, role-based access control", icon: <ShieldCheck size={18} className="text-indigo-400" /> }
    ];

    return (
        <div className="hidden md:flex w-1/2 bg-slate-950 relative overflow-hidden flex-col justify-between p-12 lg:p-16 border-r border-slate-800">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDAuNWg0ME0wIDQwLjVoNDBWMHoiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPjwvc3ZnPg==')] opacity-20"></div>

            {/* Decorative Glow Blobs */}
            <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none animate-none"></div>
            <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-none"></div>

            {/* Top Logo / Brand Section */}
            <div className="relative z-10 flex items-center gap-3 animate-fade-in">
                <img src="/vsph-logo-white.png" alt="VSPH" className="h-14 w-auto object-cover animate-none" />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 mb-8 mt-auto animate-slide-up">
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-6 tracking-tight">
                    Your complete relationship management platform.
                </h1>
                <p className="text-lg text-slate-400 max-w-md leading-relaxed mb-10">
                    Manage accounts, contacts, opportunities, and campaigns — all in one place. Built for the VSPH team.
                </p>

                <ul className="space-y-4">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-md">
                                {feature.icon}
                            </div>
                            <span className="text-base">{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default LoginLeftSection