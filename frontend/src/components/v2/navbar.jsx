import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';

const ROUTES = {
  account: '/v2/accounts',
  contact: '/v2/contacts',
  opportunity: '/v2/opportunities',
  project: '/v2/projects',
  task: '/v2/tasks',
};

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef(null);

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
    navigate(ROUTES[result.type] || '/v2/dashboard');
  };

  return (
    <header className="h-[64px] flex items-center justify-between gap-4 px-4 sm:px-6 bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md text-slate-600 hover:text-vsph-core-blue hover:bg-vsph-grey transition-colors md:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 max-w-3xl relative hidden sm:block">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
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
            className="w-full pl-10 pr-10 py-2.5 bg-vsph-grey border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vsph-core-blue/20 focus:border-vsph-core-blue transition-all"
          />
          {searching && <Loader2 size={16} className="absolute right-3.5 text-slate-400 animate-spin" />}
        </div>

        {open && (
          <div
            onMouseDown={() => clearTimeout(blurTimer.current)}
            className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
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

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative ml-2">
          <button className="w-10 h-10 rounded-full bg-vsph-core-blue flex items-center justify-center text-white text-[13px] font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
            {initials}
          </button>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-[2px] border-white"></span>
        </div>

        <div className="hidden sm:block leading-tight">
          <p className="text-xs font-semibold text-vsph-navy max-w-[180px] truncate">{userName}</p>
          <p className="text-[10px] text-slate-500">{localStorage.getItem('vsph_user_role')?.replace(/_/g, ' ') || 'User'}</p>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
