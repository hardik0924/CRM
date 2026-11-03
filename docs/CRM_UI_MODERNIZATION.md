# CRM UI Modernization — VSPH CRM

## Root Cause of Inconsistent Styling

1. **Multiple design systems**: VSPh brand colors (`#00255A`, `#0069C8`, `#F1F2F2`) in `index.css` are mixed with random colors (`#B44B00`, `#0070c0`, `bg-blue-100`, `text-blue-600`, `border-[#b9c5d6]`, `bg-[#F7FBFF]`) scattered across `NewDashboard.jsx`, modals, and page components.
2. **No centralized design tokens**: Only basic color variables exist in `index.css`. There are no shared token definitions for typography, spacing, radii, shadows, focus rings, or button/input dimensions.
3. **Per-page duplicated styles**: Each page (`Accounts.jsx`, `Contacts.jsx`, etc.) re-declares table headers, search inputs, pagination, and badge styles inline instead of using shared components.
4. **Inconsistent component variants**: The `Button` component supports multiple variants (primary, secondary, ghost, danger) but pages use them inconsistently — some use `variant="ghost"` with custom classes, others override with inline styles.
5. **NewDashboard.jsx is an outlier**: It uses a completely different orange sponsorship theme (`#B44B00`) that doesn't match the rest of the application.
6. **Input/select styling differs**: `index.css` defines a global input style, but modals and superadmin pages override with inline `border-slate-300`, `border-blue-500`, etc.

## Routes and Pages Reviewed

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `login.jsx` | CRM login (client + superadmin) |
| `/accept-invite` | `AcceptInvite.jsx` | Invitation acceptance |
| `/v2/login` | `LoginV2Layout` / `LoginV2` / `loginForm.jsx` | V2 login (superadmin, client, admin, employee) |
| `/superadmin` | `SuperadminLayout` | Superadmin control center shell |
| `/superadmin` | `SuperadminDashboard.jsx` | Platform overview (orgs, employees, stats) |
| `/superadmin/tenants` | `TenantManagement.jsx` | Organization management |
| `/superadmin/tenants/:id/users` | `TenantUsers.jsx` | Per-organization employee management |
| `/superadmin/users` | `UsersManagement.jsx` | All employees across orgs |
| `/v2/dashboard` | `DashboardV2.jsx` | Client CRM dashboard (metrics, pipeline, activity) |
| `/v2/contacts` | `Contacts.jsx` | Contact management (CRUD, search, export, pagination) |
| `/v2/accounts` | `Accounts.jsx` | Account management |
| `/v2/opportunities` | `Opportunities.jsx` | Opportunity pipeline |
| `/v2/projects` | `Projects.jsx` | Project management |
| `/v2/campaigns` | `Campaigns.jsx` | Campaign management |
| `/v2/tasks` | `Tasks.jsx` | Task management |
| `/v2/team` | `Team.jsx` | Employee management (invite, roles, module access) |
| `/dashboard`, `/contacts`, etc. | `DashboardLayout` | Legacy dashboard routes |

## Shared Components Reviewed

| Component | File | Purpose |
|-----------|------|---------|
| Button | `components/ui/Button.jsx` | Primary/secondary/ghost/danger button |
| Modal | `components/ui/Modal.jsx` | Dialog wrapper with header/body/footer |
| SearchableSelect | `components/ui/SearchableSelect.jsx` | Searchable dropdown |
| Searchbar | `components/ui/Searchbar.jsx` | Global search with type filter |
| Navbar | `components/v2/navbar.jsx` | Top nav with search, profile |
| Sidebar | `components/v2/sidebar.jsx` | Left navigation (module-filtered) |
| DashboardLayout | `components/v2/dashboardLayout.jsx` | V2 layout shell |

## Files Changed and Purpose

### Design System (`index.css`)
- Centralized design tokens: colors, typography, spacing, radii, shadows, focus rings, button/input dimensions
- VSPh brand palette preserved (navy sidebar, core-blue primary, grey background)
- Consistent badge, card, input, button, table, page-header styles
- All hardcoded random colors replaced with design token utilities

### Layout (`sidebar.jsx`, `navbar.jsx`, `dashboardLayout.jsx`)
- Sidebar: navy background, consistent icon + label spacing, active/hover/focus states, icon-rail collapse on desktop, mobile drawer
- Navbar: white background, global search, profile avatar + online status, hamburger toggle on all breakpoints
- Layout: light page background (`#F5F7FB`), scrollable main content

### Pages (all modernized to shared design system)
- `Contacts.jsx`, `Accounts.jsx`, `Opportunities.jsx`, `Projects.jsx`, `Tasks.jsx`, `Campaigns.jsx` — consistent headers, tables, badges, empty states, CSV export, bulk delete
- `Dashboard.jsx` / `DashboardV2.jsx` — real metrics from API, KPI cards, pipeline bars, recent activity
- `Team.jsx` — employee table with status badges, role/module badges
- `SuperadminDashboard.jsx`, `TenantManagement.jsx`, `TenantUsers.jsx`, `UsersManagement.jsx` — consistent tables, cards, status badges

### Modals (`AddContactModal.jsx`, `AddAccountModal.jsx`, `AddOpportunityModal.jsx`, etc.)
- Consistent form inputs, labels, validation error states
- Standardized section headers, grids, spacing

### Utilities
- `csv.js` — CSV export helper (already existed, reused across pages)

## Features and Workflows Verified

- Login/logout with `X-User-Id` header auth
- Per-employee module access enforcement (`ModuleGuard` + backend `requireModule`)
- Tenant isolation (backend enforces `tenant_fk` from session, never browser)
- CRUD for accounts, contacts, opportunities, projects, tasks, campaigns
- Search with debounce, pagination, CSV export
- Bulk delete with confirmation
- Invite employee, role change, module access assignment
- Superadmin: org management, employee management across orgs
- Dashboard metrics from `/api/dashboard/metrics`

## Test, Lint, and Build Results

- `npm test` (with `RUN_DB_TESTS=1`): **13/13 pass** — module access logic, tenant filter, role validation, entitlement fail-closed
- `npx vite build`: ✓ built successfully with no errors
- ESLint on changed files: clean (pre-existing patterns only)
- API smoke tests: all 6 module list endpoints return 200 with `{success, data, pagination}` shape; restricted employee gets 403 on unassigned modules

## Known Issues and Remaining Manual Verification

- Browser UI smoke tests were not executed (in-app browser connectivity issues); verification was via API + build + tests
- Legacy `/dashboard`, `/contacts`, etc. routes still point to `DashboardLayout` pages which are not yet modernized to the same design system (they share the same components as V2 routes but through a different layout)
- Cross-browser responsive testing at tablet/mobile breakpoints not yet completed
- The `Searchbar.jsx` (legacy) component still uses `bg-vsph-navy/10` styling and is not used by V2 routes

## New Dependencies

None. All changes use existing dependencies (React, Vite, Tailwind CSS, lucide-react, react-hot-toast).
