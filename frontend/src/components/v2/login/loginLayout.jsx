import React from 'react'
import { Outlet } from 'react-router-dom'
import LoginLeftSection from './loginLeftSection'

const LoginLayout = () => {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F4F7FC] p-0 sm:p-6 lg:p-10">
            {/* Ambient background */}
            <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-vsph-core-blue/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-vsph-light-blue/20 blur-3xl" />

            <div className="relative z-10 flex min-h-screen w-full max-w-6xl overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(2,37,90,0.35)] sm:min-h-[680px] sm:rounded-3xl sm:border sm:border-white/60">
                <LoginLeftSection />
                <Outlet />
            </div>
        </div>
    )
}

export default LoginLayout
