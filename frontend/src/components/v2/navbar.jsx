import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  Bell,
  Grid,
  Menu,
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-[72px] flex items-center justify-between px-6 bg-white border-b border-slate-100 sticky top-0 z-30 shrink-0">
      
      {/* Left: Sidebar toggle (visible on all screens) */}
      <div className="flex items-center gap-4 mr-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-3xl">
        <div className="relative group flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search accounts, contacts, opportunities..."
            className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {/* <div className="flex items-center justify-center px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded shadow-sm border border-slate-200">
              ⌘ K
            </div> */}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5 ml-6">
        
        {/* Icons */}
        <button className="relative text-slate-500 hover:text-indigo-600 transition-colors p-1">
          <Bell size={22} strokeWidth={2} />
          <span className="absolute -top-1 -right-1.5 w-[18px] h-[18px] bg-red-500 rounded-full border-[2px] border-white flex items-center justify-center text-[9px] font-bold text-white leading-none">
            3
          </span>
        </button>

        <button className="text-slate-500 hover:text-indigo-600 transition-colors p-1">
          <Clock size={22} strokeWidth={2} />
        </button>

        <button className="text-slate-500 hover:text-indigo-600 transition-colors p-1 mr-1">
          <Grid size={22} strokeWidth={2} />
        </button>

        {/* Profile Avatar */}
        <div className="relative ml-2">
          <button className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[13px] font-bold shadow-sm transition-transform hover:scale-105 active:scale-95">
            {user ? getInitials(user.user_name || user.name) : "US"}
          </button>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-[2px] border-white"></span>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
