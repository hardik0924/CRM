import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

/**
 * Breadcrumbs component for record detail pages.
 *
 * items: array of { label, path?, current? }
 * - path: when provided, renders a NavLink to that route
 * - current: marks the final/current item (no link, aria-current="page")
 *
 * Falls back gracefully when location or label is missing.
 */
const Breadcrumbs = ({ items }) => {
  const location = useLocation();

  // If no items provided, try to infer from the current location (defensive fallback)
  const crumbs = items || [];

  return (
    <nav
      className="flex items-center gap-1 px-2 text-xs text-slate-500"
      aria-label="Breadcrumb"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const label = crumb.label || '-';
        const path = crumb.path;

        // Separator between items (not before the first)
        if (index > 0) {
          return (
            <>
              <span
                key={`sep-${index}`}
                className="mx-2 text-slate-400 select-none"
                aria-hidden="true"
              >
                &rsaquo;
              </span>
              {isLast ? (
                <span
                  key={`crumb-${index}`}
                  className="text-slate-700 font-medium truncate"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : path ? (
                <NavLink
                  key={`crumb-${index}`}
                  to={path}
                  className="text-slate-600 hover:text-vsph-core-blue transition-colors truncate"
                >
                  {label}
                </NavLink>
              ) : (
                <span
                  key={`crumb-${index}`}
                  className="text-slate-700 font-medium truncate"
                >
                  {label}
                </span>
              )}
            </>
          );
        }

        // First item
        if (isLast) {
          return (
            <span
              key={`crumb-${index}`}
              className="text-slate-700 font-medium truncate"
              aria-current="page"
            >
              {label}
            </span>
          );
        }

        if (path) {
          return (
            <NavLink
              key={`crumb-${index}`}
              to={path}
              className="text-slate-600 hover:text-vsph-core-blue transition-colors truncate"
            >
              {label}
            </NavLink>
          );
        }

        return (
          <span key={`crumb-${index}`} className="text-slate-700 font-medium truncate">
            {label}
          </span>
        );
      })}

      {/* Show current page name when no items provided (fallback) */}
      {crumbs.length === 0 && (
        <span className="text-slate-700 font-medium truncate">
          {location.pathname.split('/').pop() || 'Home'}
        </span>
      )}
    </nav>
  );
};

export default Breadcrumbs;
