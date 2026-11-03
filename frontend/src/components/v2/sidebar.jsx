import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Briefcase,
  TrendingUp,
  Layers,
  Megaphone,
  ListChecks,
  LogOut,
  X,
  UserCog,
} from 'lucide-react';
import { hasModule } from '../../utils/modules';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/v2/dashboard', icon: Home },
  { name: 'Contacts', path: '/v2/contacts', icon: Users, module: 'CONTACTS' },
  { name: 'Accounts', path: '/v2/accounts', icon: Briefcase, module: 'ACCOUNTS' },
  { name: 'Opportunities', path: '/v2/opportunities', icon: TrendingUp, module: 'OPPORTUNITIES' },
  { name: 'Projects', path: '/v2/projects', icon: Layers, module: 'PROJECTS' },
  { name: 'Campaigns', path: '/v2/campaigns', icon: Megaphone, module: 'CAMPAIGNS' },
  { name: 'Tasks', path: '/v2/tasks', icon: ListChecks, module: 'TASKS' },
];

const Sidebar = ({ open = false, onClose }) => {
  const location = useLocation();
  const canManage =
    localStorage.getItem('vsph_user_role') === 'ADMIN' ||
    localStorage.getItem('vsph_user_owner') === 'true';

  const navItems = [
    ...NAV_ITEMS.filter((item) => !item.module || hasModule(item.module)),
    ...(canManage ? [{ name: 'Team', path: '/v2/team', icon: UserCog }] : []),
  ];

  const userName = localStorage.getItem('vsph_user_name') || 'CRM user';
  const userRole = (localStorage.getItem('vsph_user_role') || 'USER').replace(/_/g, ' ');

  return (
    <div className={`h-full bg-[#111827] flex flex-col font-sans overflow-hidden transition-all duration-300 fixed inset-y-0 left-0 z-40 ${open ? 'translate-x-0 w-64' : '-translate-x-full w-64'} md:static md:z-20 md:translate-x-0 ${open ? 'md:w-64' : 'md:w-0'}`}>
      
      {/* Brand Section */}
      <div className="h-[72px] flex items-center px-6 shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-2 w-full">
          <img src="/vsph-logo-white.png" alt="VSPH Logo" className="h-12 w-auto object-contain" />
          {open && (
            <button onClick={onClose} className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10" aria-label="Close menu">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 px-3 overflow-y-auto relative z-10 flex flex-col custom-scrollbar">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-300 group ${
                  isActive 
                    ? 'bg-vsph-core-blue text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors duration-300`} />
                <span className={`font-medium text-[13px] ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-800 bg-[#0f172a] shrink-0 space-y-2">
        <div className="flex items-center gap-3 w-full p-2 rounded-lg text-left">
          <div className="w-9 h-9 rounded-full bg-vsph-core-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate">{userRole}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to sign out?")) {
              localStorage.clear();
              window.location.href = '/';
            }
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-white/5 hover:border-slate-500 transition-colors text-left"
        >
          <LogOut size={18} className="text-slate-400 shrink-0" />
          <span className="text-[13px] font-semibold">Sign out</span>
        </button>
      </div>
      
    </div>
  );
};

export default Sidebar;
