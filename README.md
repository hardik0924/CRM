# VSPH CRM

A sellable, multi-tenant CRM built for the **VSPH** platform. One superadmin panel manages every client organization (tenant); each client signs in and gets their own isolated, VSPH-branded CRM workspace.

> **VSPH** — "Enterprise software. Practical thinking. Human impact." Design system and brand guidance live in [`frontend/DESIGN.md`](frontend/DESIGN.md).

---

## Table of Contents

- [Overview](#overview)
- [The Flow](#the-flow)
- [Feature Highlights](#feature-highlights)
- [Multi-Tenancy](#multi-tenancy)
- [Authentication](#authentication)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Routes](#api-routes)
- [Test Credentials](#test-credentials)
- [Roles & Departments](#roles--departments)
- [Design System](#design-system)
- [Dev Notes & Known Limits](#dev-notes--known-limits)

---

## Overview

The product is split into **two experiences** behind one login page:

| Area | Who | Route | What it does |
|------|-----|-------|--------------|
| **Central platform** | VSPH Owner | `apps.vsph.in` | Creates client organizations, assigns CRM, manages subscriptions and entitlement. |
| **Platform Control Center** | Superadmin | `/superadmin` | Internal support/maintenance view of organizations and users. Normal commercial onboarding is no longer done here. |
| **Client CRM** | Client users | `/v2/dashboard` | The actual daily CRM — accounts, contacts, opportunities, projects, campaigns, tasks, plus the team page for the client administrator. |

A client sees **only their own organization's data**. A superadmin sees **everything** across all clients, but from the control center, not inside any client's CRM.

---

## The Flow

### 1. Platform login
- Everyone starts at `/` — a VSPH-branded login page with a role picker.
- **Superadmin login** → routed to `/superadmin`.
- **CRM login** → routed to `/v2/dashboard`.

### 2. Central platform onboards a new client
1. The VSPH Owner signs in to **apps.vsph.in** and creates the client organization.
2. CRM is assigned to the organization and the first administrator's email is supplied.
3. The central platform calls the CRM provisioning API with an authenticated, idempotent request.
4. CRM creates or links the organization, stores the CRM entitlement, and creates a pending administrator account plus a single-use invitation.
5. The administrator receives an invitation link, sets their own password, and signs in to the CRM.
6. From **Team** in the CRM, the administrator invites employees and assigns CRM roles.

> The normal commercial path starts at **apps.vsph.in**. The CRM control center remains available for internal support only.

### 3. Client administrator and employees sign in
- - Client administrators and employees use the same `/` login page -> **CRM login**.
- Login succeeds only if the user exists, is **active**, the password is set, the user belongs to a tenant, and the organization has an **ACTIVE CRM entitlement**.
- They land on `/v2/dashboard` and only ever see their tenant's data.

### 4. Client uses the CRM
- Sidebar navigation: Home (dashboard), Contacts, Accounts, Opportunities, Projects, Campaigns, Tasks, **Team** (administrators only), Calendar, Reports, Settings.
- The sidebar is **collapsible**: hamburger at top-left collapses/expands it on desktop; on narrow screens it becomes a mobile drawer with an X and backdrop.
- **Sign out** button at the bottom of the sidebar clears the session and returns to the login page.

### 5. Client administrator manages employees
- Open **Team** in the sidebar.
- **Invite employee**: email, role, department. The employee gets a single-use link, not a password.
- Change roles, deactivate/re-activate, and resend invitations.
- Backend rules: only the organization's `ADMIN`/owner can manage employees; cross-tenant access, `SUPER_ADMIN` grants, self-deactivation and self role changes are rejected server-side.

### 6. Entitlement enforces access
- CRM stores entitlement per organization and checks it on login and on every protected API request.
- `ACTIVE` allows access. `SUSPENDED`, `EXPIRED`, `REVOKED`, `PENDING`, or an unknown entitlement blocks client access (fail closed).
- Internal `SUPER_ADMIN` support access bypasses entitlement checks. Organization data is never deleted when access is suspended.

---

## Multi-Tenancy

- Every data model (`user`, `account`, `contact`, `opportunity`, `project`, `task`, `call`, `campaign`, …) carries a `tenant_fk` foreign key back to the `tenant` model.
- `tenant` table: `tenant_id`, `tenant_name`, `tenant_code` (unique), `tenant_status`, `tenant_plan`, `external_organization_id` (unique, from `apps.vsph.in`), sync metadata, timestamps.
- CRM entitlement lives in `organization_app_entitlements` (`tenant_fk` + `app_code = CRM`), plus `invitations` and `integration_events` for the integration.
- **Isolation rule** (`backend/src/middleware/auth.middleware.js` → `getTenantFilter`):
  - `SUPER_ADMIN` → `tenant_fk` is `null`; sees all data.
  - Any client user → queries are automatically scoped with `{ tenant_fk: <their tenant> }`.
- All shared data routes mount `authMiddleware`, so the tenant filter applies everywhere.

---

## Authentication

- **No JWT.** Sessions are tracked by the user's ID in localStorage.
- On login, the frontend stores `vsph_user_id`, `vsph_user_role`, `vsph_user_name`, `vsph_user_email`, `vsph_user_owner`, `vsph_tenant_id`, `vsph_tenant_name`, `vsph_tenant_code`, and the sidebar preference `vsph.sidebar.collapsed`.
- Every API call (`frontend/src/utils/api.js`) sends the `X-User-Id` header.
- `authMiddleware` looks up the user, checks the organization's CRM entitlement, and rejects missing/inactive/blocked users. `superadminOnly` guards all `/api/tenants` routes.
- Client users are identified by `user_is_tenant_owner` (the organization's Client Super Admin) plus `user_role = ADMIN`.
- Invited users start with `user_password = NULL` and `user_status = false`; they cannot sign in until they accept their invitation.
- **Passwords are plaintext in the DB (dev only)** — see [Known Limits](#dev-notes--known-limits).
- Superadmin routes redirect to `/` when the role isn't `SUPER_ADMIN`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, lucide-react icons, react-hot-toast |
| Backend | Node.js, Express 5, Prisma 7 (MySQL/MariaDB adapter) |
| Database | MySQL (via Laragon) — Prisma schema in `backend/prisma/schema.prisma` |
| Brand | VSPH design system (see `frontend/DESIGN.md`) |

---

## Project Structure

```
CRM/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # models: tenant, user, account, contact, opportunity, …
│   │   └── seed.js            # demo tenant + superadmin + client user
│   └── src/
│       ├── server.js          # Express app, route mounting
│       ├── lib/prisma.js      # Prisma client
│       ├── middleware/
│       │   └── auth.middleware.js  # authMiddleware, superadminOnly, getTenantFilter
│       ├── controllers/       # auth, tenant, user, account, contact, opportunity, project, task, call, dashboard, search
│       └── routes/            # one router per controller
├── frontend/
│   ├── public/
│   │   ├── vsph-logo-dark.png    # logo for light backgrounds
│   │   └── vsph-logo-white.png   # logo for dark backgrounds
│   ├── DESIGN.md              # VSPH design system reference
│   └── src/
│       ├── App.jsx            # all routes
│       ├── components/
│       │   ├── login.jsx      # root login + role picker
│       │   ├── superadmin/    # SuperadminLayout, UserFormModal
│       │   └── v2/            # client layout: dashboardLayout, sidebar, navbar, login/*
│       └── pages/
│           ├── superadmin/    # SuperadminDashboard, TenantManagement, TenantUsers, UsersManagement
│           └── …              # client CRUD pages (Contacts, Accounts, …)
```

---

## Getting Started

### Prerequisites
- Node.js (v20+, npm)
- [Laragon](https://laragon.org/) (or any MySQL/MariaDB server) running on `localhost:3306`
- Git

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment

Create `backend/.env`:

```
PORT=5000
DATABASE_URL="mysql://root:@localhost:3306/crm"
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=crm

# Central platform integration
INTEGRATION_HMAC_SECRET=change-me
INTEGRATION_API_KEY=change-me
INTEGRATION_MAX_SKEW_SECONDS=300
INVITATION_BASE_URL=http://localhost:5173
INVITATION_TTL_HOURS=72
ENFORCE_ENTITLEMENT=true
```

> Adjust user/password to match your Laragon MySQL credentials. Create the `crm` database in Laragon/phpMyAdmin first.
> `INTEGRATION_API_KEY` is a **development-only** fallback. Production must use the HMAC secret and `NODE_ENV=production`.

### 3. Sync the schema & seed

```bash
cd backend
npx prisma db push   # creates tables from schema.prisma (also generates the client)
npm run seed          # seeds demo tenant + users
npm run backfill:onboarding  # idempotent: ACTIVE entitlement + owner for existing tenants
```

> The project uses `prisma db push` to keep the schema in sync (migrations are not the source of truth here).

### 4. Run the servers

Terminal 1 — backend:

```bash
cd backend
npm run dev     # http://localhost:5000 (should log "CRM API Running" at /)
```

Terminal 2 — frontend:

```bash
cd frontend
npm run dev     # http://localhost:5173
```

Open **http://localhost:5173** — the VSPH login page should appear.

### 5. Production frontend build

```bash
cd frontend
npx vite build
```

---

## Configuration

| Variable | Purpose |
|----------|---------|
| `PORT` | Backend port (default `5000`) |
| `DATABASE_URL` | Prisma connection string (MySQL) |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_NAME` | Alternate connection details |
| `INTEGRATION_HMAC_SECRET` | Shared secret used to verify `apps.vsph.in` HMAC signatures |
| `INTEGRATION_API_KEY` | Development-only fallback key; ignored in production |
| `INTEGRATION_MAX_SKEW_SECONDS` | Allowed clock skew / replay window (default `300`) |
| `INVITATION_BASE_URL` | Frontend base used to build invitation links |
| `INVITATION_TTL_HOURS` | Invitation lifetime (default `72`) |
| `ENFORCE_ENTITLEMENT` | Set `false` only for local development; defaults to enforced |
| `EMAIL_WEBHOOK_URL` | Optional email provider webhook used for invitations |
| `VITE_CENTRAL_PLATFORM_URL` | Frontend link to `apps.vsph.in` (defaults to `https://apps.vsph.in`) |

Frontend API base is `VITE_API_URL` in `frontend/.env` (consumed via `import.meta.env.VITE_API_URL` in `frontend/src/utils/api.js`).

---

## API Routes

All data routes require `X-User-Id` header. `/api/tenants` additionally requires superadmin.

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login with `{ email, password }`; returns user + tenant info |

### Central platform integration (HMAC, no user session)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/integrations/organizations/provision` | Create/link an organization, sync CRM entitlement, invite the first administrator |
| POST | `/api/integrations/entitlements/sync` | Apply an entitlement lifecycle event (activated/changed/suspended/expired/revoked) |

Full contract: [`docs/INTEGRATION_CONTRACT.md`](docs/INTEGRATION_CONTRACT.md).

### Invitations (public, token-based)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/invitations/:token` | Preview an invitation (organization, email, expiry) |
| POST | `/api/invitations/accept` | Set a password with `{ token, password }` and activate the account |

### Client employee management (organization admin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organization/employees` | List employees in the caller's organization |
| POST | `/api/organization/employees/invite` | Invite an employee (`email`, `name`, `role`, `department`) |
| POST | `/api/organization/employees/:userId/resend-invite` | Reissue a pending invitation |
| PATCH | `/api/organization/employees/:userId` | Update name/role/department/status in the caller's organization |

### Tenants (superadmin only, internal support)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tenants` | List clients (search, paginated) with user/account counts |
| POST | `/api/tenants` | Create a client (`tenant_name`, `tenant_code`, `tenant_plan`) |
| GET | `/api/tenants/:id` | Client detail with counts |
| PUT | `/api/tenants/:id` | Update name/code/plan/status |
| DELETE | `/api/tenants/:id` | Delete client (409 if it has users or accounts) |

### Tenant users (superadmin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tenants/:id/users` | List users of a client |
| POST | `/api/tenants/:id/users` | Create a client user |
| PUT | `/api/tenants/:id/users/:userId` | Update a client user |
| DELETE | `/api/tenants/:id/users/:userId` | Delete a client user |

### Core CRM data (any authenticated user, tenant-scoped)
| Area | Route prefix |
|------|--------------|
| Users | `/api/users` |
| Accounts | `/api/accounts` |
| Contacts | `/api/contacts` |
| Opportunities | `/api/opportunities` |
| Projects | `/api/projects` |
| Tasks | `/api/tasks` |
| Calls | `/api/calls` |
| Dashboard | `/api/dashboard` |
| Search | `/api/search` |

---

## Test Credentials

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Superadmin | `superadmin@crm.com` | `0000` | `/superadmin` |
| Client (ADMIN) | `client@vsph.com` | `0000` | `/v2/dashboard` |

Both are created by `npm run seed`. Client users created in the superadmin panel use the same login page.

---

## Roles & Departments

**Roles** (`Role` enum): `USER`, `ADMIN`, `SUPER_ADMIN`, `SALES`, `DATA`, `PRODUCTION`, `SPONSORSHIP`, `OPERATION`.

**Departments** (`Department` enum): `SALES`, `MARKETING`, `FINANCE`, `IT`, `HUMAN_RESOURCES`.

Client users created via the control center can only be assigned non-`SUPER_ADMIN` roles.

---

## Testing

Backend tests use Node's built-in `node:test` (no new framework):

```bash
cd backend
npm test                      # unit tests (signature, validation, invitation, entitlement, isolation)
RUN_DB_TESTS=1 npm test       # also runs transactional provisioning/idempotency tests (needs local DB)
```

Frontend checks:

```bash
cd frontend
npx vite build
npm run lint
```

> `npm run lint` currently reports pre-existing issues across older pages. The new onboarding files (`AcceptInvite`, `Team`, `InviteEmployeeModal`) lint clean.

---

## Design System

The UI follows the VSPH brand (`frontend/DESIGN.md`):

- **Colors:** navy `#00255A`, core-blue `#0069C8`, light-blue `#50C0E8`, white `#FFFFFF`, grey `#F1F2F2`.
- **Typeface:** Inter.
- **Logos:** `vsph-logo-dark.png` on light backgrounds, `vsph-logo-white.png` on dark backgrounds (navy / slate / `#111827` surfaces).

---

## Dev Notes & Known Limits

- **Plaintext passwords** — dev only. Hash before any production deployment.
- **No JWT / server sessions** — `X-User-Id` header auth; fine for dev, needs hardening for production.
- **Invitation email** — no provider is installed. Development prints the invitation URL / returns it in the API response. Set `EMAIL_WEBHOOK_URL` before production; tokens are never logged or returned in production.
- **Integration is CRM-side complete, end-to-end pending** — the contract is implemented and tested locally. `apps.vsph.in` must supply its base URL, HMAC secret and final field names before end-to-end can be claimed.
- **Entitlement fail-closed** — client access is blocked when no entitlement record exists. Run `npm run backfill:onboarding` after migrating existing data.
- **Supabase later** — the multi-tenant model is database-agnostic, but switching to Supabase/PostgreSQL requires a new Prisma provider/adapter and schema re-push.
- **Migrations** — use `npx prisma db push`, not `prisma migrate` (shipped migrations are out of sync).
- **Tenant deletion** — intentionally blocked (409) when users or CRM data exist, to prevent FK errors / data loss.
- **Test data** — the local DB may contain extra test clients (e.g. "Test Client", "Test Client Corp", "Acme Corp"); remove them in the Clients page if you want a clean slate.
```
