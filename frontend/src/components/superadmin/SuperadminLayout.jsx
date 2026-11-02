import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, LogOut, PanelLeftClose, PanelLeftOpen,
  Menu, X, Plus, ChevronRight, ShieldCheck,
} from 'lucide-react'

const NAV = [
  { name: 'Overview', icon: LayoutDashboard, path: '/superadmin', exact: true },
  { name: 'Clients', icon: Building2, path: '/superadmin/tenants' },
  { name: 'Users', icon: Users, path: '/superadmin/users' },
]

const SuperadminLayout = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('vsph.sidebar.collapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('vsph.sidebar.collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (localStorage.getItem('vsph_user_role') !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const userName = localStorage.getItem('vsph_user_name') || 'Superadmin';
  const initials = userName.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const current = NAV.find(isActive) || NAV[0];

  const navLink = (item) => {
    const active = isActive(item);
    return (
      <Link
        key={item.name}
        to={item.path}
        title={item.name}
        className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
          collapsed ? 'justify-center px-0 mx-2' : 'px-4'
        } ${
          active
            ? 'bg-vsph-core-blue text-white'
            : 'text-[#CFDEEF] hover:bg-[#163F72] hover:text-white'
        }`}
      >
        <item.icon size={20} className="shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F8FB] text-slate-900">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-vsph-navy/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'md:w-[76px]' : 'md:w-64'
        } fixed md:sticky top-0 z-40 md:z-0 h-full w-64 shrink-0 bg-vsph-navy text-white flex flex-col transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className={`flex flex-col ${collapsed ? 'items-center gap-3' : 'items-start gap-3'} pt-6 pb-10 ${collapsed ? 'px-2 md:px-0 md:items-center' : 'px-5'}`}>
          <Link to="/superadmin" className="flex flex-col items-center gap-1" title="VSPH Control Center">
            <img src="/vsph-logo-white.png" alt="VSPH" className="h-14 w-auto shrink-0" />
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto md:hidden p-1.5 text-[#AFC8E5] hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`hidden md:grid place-items-center w-9 h-9 rounded-lg border border-[#B9D7F1]/25 text-[#CFDEEF] hover:bg-[#164679] hover:border-[#5B89B8] transition-colors ${
              collapsed ? 'mt-3' : 'ml-auto'
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Platform administration">
          {!collapsed && (
            <p className="px-5 mb-2 text-[10px] font-semibold tracking-[0.15em] text-[#9CB8D6]">
              PLATFORM
            </p>
          )}
          {NAV.map(navLink)}
        </nav>

        <div className="mt-auto pt-6">
          <div className={`flex items-center gap-3 px-4 py-3 border-t border-white/10 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
            <span className="w-9 h-9 rounded-full bg-vsph-core-blue text-white text-xs font-bold grid place-items-center shrink-0">
              {initials || 'VS'}
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <strong className="block text-xs font-semibold truncate">{userName}</strong>
                <small className="block text-[11px] text-[#AFC8E5]">Platform administrator</small>
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className={`flex items-center justify-center gap-2.5 mx-3 mb-4 min-h-[44px] rounded-lg border border-white/25 text-xs font-medium text-[#CFDEEF] hover:bg-white/10 hover:text-white transition-colors ${
              collapsed ? 'md:mx-auto md:w-11 md:px-0' : 'w-[calc(100%-24px)]'
            }`}
          >
            <LogOut size={17} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[72px] shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-1 text-vsph-navy"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <span className="hidden lg:inline text-[11px] font-semibold tracking-[0.14em] text-slate-400">
              CONTROL CENTER
            </span>
            <ChevronRight size={14} className="hidden lg:block text-slate-300" />
            <span className="text-sm font-semibold text-vsph-navy truncate">{current.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/superadmin/tenants?new=1"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-vsph-core-blue text-white text-xs font-semibold hover:bg-[#0054A4] transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New client</span>
            </Link>
            <span className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-vsph-core-blue" />
              {userName}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SuperadminLayout