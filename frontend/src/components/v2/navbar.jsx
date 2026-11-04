import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Briefcase,
  TrendingUp,
  Layers,
  Megaphone,
  ListChecks,
  UserCog,
  LogOut,
  Search,
  Loader2,
} from 'lucide-react';
import { hasModule, canDoAction, canManageOrganization } from '../../utils/modules';
import { api } from '../../utils/api';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/v2/dashboard', icon: Home },
  { name: 'Contacts', path: '/v2/contacts', icon: Users, module: 'CONTACTS' },
  { name: 'Accounts', path: '/v2/accounts', icon: Briefcase, module: 'ACCOUNTS' },
  { name: 'Opportunities', path: '/v2/opportunities', icon: TrendingUp, module: 'OPPORTUNITIES' },
  { name: 'Projects', path: '/v2/projects', icon: Layers, module: 'PROJECTS' },
  { name: 'Campaigns', path: '/v2/campaigns', icon: Megaphone, module: 'CAMPAIGNS' },
  { name: 'Tasks', path: '/v2/tasks', icon: ListChecks, module: 'TASKS' },
];

const ROUTES = {
  account: '/v2/accounts',
  contact: '/v2/contacts',
  opportunity: '/v2/opportunities',
  project: '/v2/projects',
  task: '/v2/tasks',
};

const ID_PARAMS = {
  account: 'account_id',
  contact: 'contact_id',
  opportunity: 'opportunity_id',
  project: 'project_id',
  task: 'task_id',
};

const Navbar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef(null);

  const canManage = canManageOrganization();
  const navItems = [
    ...NAV_ITEMS.filter((item) => !item.module || (hasModule(item.module) && canDoAction(item.module, 'VIEW'))),
    ...(canManage ? [{ name: 'Team', path: '/v2/team', icon: UserCog }] : []),
  ];

  const userName = localStorage.getItem('vsph_user_name') || 'CRM user';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'US';

  useEffect(() => {
    const trimmed = query.trim();
    let cancelled = false;

    if (trimmed.length >= 2) setSearching(true);

    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        if (!cancelled) {
          setResults([]);
          setSearching(false);
        }
        return;
      }
      try {
        const res = await api.get(`/api/search?q=${encodeURIComponent(trimmed)}&type=all`);
        if (!cancelled) {
          setResults(Array.isArray(res) ? res : res.data || []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, trimmed.length >= 2 ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const goTo = (result) => {
    setOpen(false);
    setQuery('');
    const base = ROUTES[result.type] || '/v2/dashboard';
    const param = ID_PARAMS[result.type];
    navigate(param && result.id ? `${base}?${param}=${result.id}` : base);
  };

  const signOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shrink-0 z-30">
      <div className="h-[64px] flex items-center gap-2 px-4 sm:px-6">
        <span className="font-bold text-xl text-vsph-navy tracking-tight shrink-0 mr-2">VSPH</span>

        <nav className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto" aria-label="Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-vsph-core-blue text-white'
                      : 'text-slate-600 hover:bg-vsph-grey hover:text-vsph-core-blue'
                  }`
                }
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="relative hidden md:block w-64 shrink-0">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length && setOpen(true)}
              onBlur={() => {
                blurTimer.current = setTimeout(() => setOpen(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
                if (e.key === 'Enter' && results[0]) goTo(results[0]);
              }}
              placeholder="Search accounts, contacts, opportunities..."
              className="w-full pl-9 pr-9 py-2 bg-vsph-grey border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vsph-core-blue/20 focus:border-vsph-core-blue transition-all"
            />
            {searching && <Loader2 size={15} className="absolute right-3 text-slate-400 animate-spin" />}
          </div>

          {open && (
            <div
              onMouseDown={() => clearTimeout(blurTimer.current)}
              className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
            >
              {results.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-500">No matches found.</p>
              ) : (
                results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => goTo(result)}
                    className="w-full text-left px-4 py-2.5 hover:bg-vsph-grey transition-colors flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-vsph-navy truncate">{result.title}</span>
                      <span className="block text-xs text-slate-500 truncate">{result.subtitle}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 shrink-0">{result.type}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full bg-vsph-core-blue flex items-center justify-center text-white text-[12px] font-bold">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight max-w-[140px]">
            <p className="text-xs font-semibold text-vsph-navy truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {localStorage.getItem('vsph_user_role')?.replace(/_/g, ' ') || 'User'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline text-xs font-semibold">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
