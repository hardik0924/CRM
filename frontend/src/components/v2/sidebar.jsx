import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Layers, 
  Megaphone, 
  ListChecks,
  Calendar,
  BarChart2,
  Settings,
  Zap,
  PlusCircle,
  UserPlus,
  Phone,
  CheckSquare,
  Sparkles,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const Sidebar = ({ open = false, onClose }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const navItems = [
    { name: 'Home', path: '/v2/dashboard', icon: Home },
    { name: 'Contacts', path: '/v2/contacts', icon: Users },
    { name: 'Accounts', path: '/v2/accounts', icon: Briefcase },
    { name: 'Opportunities', path: '/v2/opportunities', icon: TrendingUp },
    { name: 'Projects', path: '/v2/projects', icon: Layers },
    { name: 'Campaigns', path: '/v2/campaigns', icon: Megaphone },
    { name: 'Tasks', path: '/v2/tasks', icon: ListChecks },
    { name: 'Calendar', path: '/v2/calendar', icon: Calendar },
    { name: 'Reports', path: '/v2/reports', icon: BarChart2 },
    { name: 'Settings', path: '/v2/settings', icon: Settings },
  ];

  const quickActions = [
    { name: 'Add Account', icon: PlusCircle },
    { name: 'Add Contact', icon: UserPlus },
    { name: 'Log a Call', icon: Phone },
    { name: 'Create Task', icon: CheckSquare },
    { name: 'New Opportunity', icon: Sparkles },
  ];

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
      <div className="flex-1 py-2 px-3 overflow-y-auto relative z-10 space-y-6 flex flex-col custom-scrollbar">
        
        {/* Main Menu */}
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
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors duration-300`} />
                <span className={`font-medium text-[13px] ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="px-4">
          <div className="h-px bg-slate-800/60 w-full"></div>
        </div>

        {/* Quick Actions */}
        <div className="pb-4">
          <div className="flex items-center gap-2 px-4 mb-3 text-slate-400">
            <Zap size={14} className="text-slate-400" />
            <span className="text-[11px] font-bold tracking-wider uppercase">Quick Actions</span>
          </div>
          <nav className="space-y-1">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={onClose}
                  className="w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-slate-300 hover:text-white transition-all duration-300 group"
                >
                  <Icon size={18} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
                  <span className="font-medium text-[13px] text-left">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-800 bg-[#0f172a] shrink-0">
        <button 
          onClick={() => {
            if (window.confirm("Are you sure you want to log out?")) {
              localStorage.removeItem('user');
              window.location.href = '/v2/login';
            }
          }}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user ? (user.user_name || user.name || "U").substring(0, 2).toUpperCase() : "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate">
              {user ? (user.user_name || user.name) : "Onsite System"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user ? user.user_role : "Administrator"}
            </p>
          </div>
          <ChevronDown size={16} className="text-slate-500 shrink-0" />
        </button>
      </div>
      
    </div>
  );
};

export default Sidebar;
