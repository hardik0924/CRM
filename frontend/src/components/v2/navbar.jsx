import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Search, LayoutGrid, Loader2 } from 'lucide-react';
import { hasModule, canDoAction, canManageOrganization } from '../../utils/modules';
import { api } from '../../utils/api';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/v2/dashboard' },
  { name: 'Contacts', path: '/v2/contacts', module: 'CONTACTS' },
  { name: 'Accounts', path: '/v2/accounts', module: 'ACCOUNTS' },
  { name: 'Opportunities', path: '/v2/opportunities', module: 'OPPORTUNITIES' },
  { name: 'Projects', path: '/v2/projects', module: 'PROJECTS' },
  { name: 'Campaigns', path: '/v2/campaigns', module: 'CAMPAIGNS' },
  { name: 'Tasks', path: '/v2/tasks', module: 'TASKS' },
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
  const searchRef = useRef(null);

  const canManage = canManageOrganization();
  const navItems = [
    ...NAV_ITEMS.filter((item) => !item.module || (hasModule(item.module) && canDoAction(item.module, 'VIEW'))),
    ...(canManage ? [{ name: 'Team', path: '/v2/team' }] : []),
  ];

  const userName = localStorage.getItem('vsph_user_name') || 'CRM user';
  const userRole = localStorage.getItem('vsph_user_role')?.replace(/_/g, ' ') || 'User';
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

  const submitSearch = () => {
    if (results[0]) goTo(results[0]);
    else searchRef.current?.focus();
  };

  const signOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <header className="shrink-0 z-30">
      {/* Top bar */}
      <div className="bg-vsph-navy">
        <div className="h-16 flex items-center gap-3 sm:gap-6 px-4 sm:px-6">
          <NavLink to="/v2/dashboard" className="shrink-0 leading-none select-none">
            <span className="block text-[22px] font-bold text-white tracking-tight">VSPH</span>
            <span className="block text-[9px] font-semibold text-vsph-light-blue tracking-[0.28em] mt-1">
              CRM
            </span>
          </NavLink>

          <div className="relative flex-1 max-w-[680px] hidden md:block">
            <div className="flex items-center h-10 bg-white rounded-md overflow-hidden">
              <Search size={17} className="ml-3.5 text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length && setOpen(true)}
                onBlur={() => {
                  blurTimer.current = setTimeout(() => setOpen(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOpen(false);
                  if (e.key === 'Enter') submitSearch();
                }}
                placeholder="Search work"
                className="flex-1 min-w-0 px-3 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searching ? (
                <Loader2 size={15} className="mr-3 text-slate-400 animate-spin" />
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={submitSearch}
                  className="px-4 text-sm font-medium text-vsph-core-blue hover:text-vsph-navy shrink-0"
                >
                  Search
                </button>
              )}
            </div>

            {open && (
              <div
                onMouseDown={() => clearTimeout(blurTimer.current)}
                className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50"
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

          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            <NavLink
              to="/v2/dashboard"
              title="Dashboard"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded border border-white/25 text-white/85 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LayoutGrid size={17} />
            </NavLink>
            <div className="w-9 h-9 rounded-full bg-vsph-core-blue border border-white/20 flex items-center justify-center text-white text-[12px] font-bold">
              {initials}
            </div>
            <div className="hidden md:block leading-tight max-w-[150px]">
              <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-white/60 truncate">{userRole}</p>
            </div>
            <button
              onClick={signOut}
              className="flex h-9 w-9 items-center justify-center rounded border border-white/25 text-white/85 hover:bg-white/10 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="bg-[#001B44] border-t border-white/10">
        <nav
          className="flex items-stretch gap-1 px-2 sm:px-4 overflow-x-auto"
          aria-label="Navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-5 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-vsph-core-blue text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
