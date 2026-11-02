import React from 'react'
import { ShieldIcon, UserIcon, Building2Icon } from 'lucide-react'
import { Link } from 'react-router-dom'

const Login = () => {

    const handleLogin = [
        {
            to: "/v2/login/superadmin",
            role: "superadmin",
            title: "Superadmin login",
            subtitle: "Create and manage client accounts",
            icon: ShieldIcon,
            color: "text-vsph-core-blue",
            bg: "bg-vsph-light-blue/10",
            border: "border-vsph-navy hover:border-vsph-core-blue"
        },
        {
            to: "/v2/login/client",
            role: "client",
            title: "Client login",
            subtitle: "Access your CRM workspace",
            icon: Building2Icon,
            color: "text-vsph-navy",
            bg: "bg-vsph-grey",
            border: "border-vsph-navy hover:border-vsph-core-blue"
        }
    ]

  return (
    <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
          <div className="max-w-md w-full mx-auto">
            {/* VSPh Brand Header */}
            <div className="mb-12 text-center md:text-left animate-slide-up">
              <div className="flex items-center gap-2 mb-6">
                <img src="/vsph-logo-dark.png" alt="VSPH" className="h-14 w-auto" />
              </div>
              <h1 className="text-vsph-navy text-3xl font-bold tracking-tight leading-tight">Welcome to VSPH CRM</h1>
              <p className="text-slate-500 mt-2 text-base">Choose your account type to continue</p>
            </div>

            {/* Body: Selection Cards */}
            <div className='flex flex-col gap-5 animate-fade-in' style={{ animationFillMode: 'both', animationDelay: '0.1s' }}>
              {handleLogin.map((handle) => {
                const Icon = handle.icon;
                return (
                  <Link 
                    key={handle.role} 
                    to={handle.to} 
                    className={`group flex items-start p-6 rounded-xl border-2 transition-all duration-300 hover:border-vsph-core-blue hover:bg-vsph-light-blue/20 hover:-translate-y-1 ${handle.border} bg-white cursor-pointer`}
                  >
                    <div className={`p-3 rounded-lg ${handle.bg} ${handle.color} mr-4 transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-vsph-navy group-hover:text-vsph-core-blue transition-colors">{handle.title}</h2>
                      <p className="text-slate-500 text-sm mt-1">{handle.subtitle}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-sm text-slate-500 border-t border-slate-200 pt-6">
              <p>Powered by <span className="font-semibold text-vsph-navy">VSPH</span> — Enterprise Software Solutions</p>
            </div>
          </div>
        </div>
  )
}

export default Login
