# CRM Onboarding Migration — Centralized Client Management

Status: CRM-side implementation complete; end-to-end integration pending on `apps.vsph.in`
Owner: CRM engineering
Central platform: `apps.vsph.in` (external, separate codebase)

This document records the audit of the current CRM and the plan to move normal
client onboarding to the central platform while keeping CRM as the system of
record for CRM users and business data.

---

## 1. Current architecture

| Layer | Implementation |
|-------|----------------|
| Frontend | React 19 + Vite 8 + React Router 7 + Tailwind 4 |
| Backend | Node.js + Express 5 |
| ORM | Prisma 7 (`@prisma/adapter-mariadb`) |
| Database | MySQL (Laragon) |
| Auth | HMAC-signed bearer token issued at login + `authMiddleware`; no server-side session store |
| Tenancy | Single `tenant` table; every CRM data model has `tenant_fk` |
| Email | **None.** No SMTP/SendGrid/nodemailer anywhere |
| Tests | **None in the repo.** No test runner configured |
| Migrations | Two migrations exist; project operates with `prisma db push` |

### Key models (`backend/prisma/schema.prisma`)

- `tenant` — `tenant_id` (uuid PK), `tenant_name`, `tenant_code` (unique),
  `tenant_status`, `tenant_plan`, timestamps.
- `user` — `user_id`, `user_email` (unique), `user_role` (`Role` enum),
  `user_department`, `user_password` (required, plaintext), `user_status`,
  optional `tenant_fk`.
- Data models with `tenant_fk`: `account`, `contact`, `opportunity`, `project`,
  `task`, `call`, `campaign`, `industry`.
- No membership table: membership is implied by `user.tenant_fk`.
- No invitation, entitlement, subscription, or sync/audit model.

### Roles

`Role`: `USER`, `ADMIN`, `SUPER_ADMIN`, `SALES`, `DATA`, `PRODUCTION`,
`SPONSORSHIP`, `OPERATION`.

- `SUPER_ADMIN` = VSPH internal admin, `tenant_fk = null`.
- `ADMIN` currently doubles as "client super admin" by convention only.

### Tenant filtering

`backend/src/middleware/auth.middleware.js`:

- `authMiddleware` loads the user + tenant, sets `req.user`.
- `getTenantFilter(req)` → `{}` for `SUPER_ADMIN`, else `{ tenant_fk }`.
- Every data controller spreads this filter into queries. Tenant isolation is
  enforced server-side today.

---

## 2. Current onboarding sequence

1. VSPH operator signs in at `/` as Superadmin → `/superadmin`.
2. Operator creates a client: `POST /api/tenants` (`tenant.controller.js`).
3. Operator opens the client and creates users:
   `POST /api/tenants/:id/users` (operator-supplied password, stored as a scrypt hash).
4. Client user signs in at `/` → `/v2/dashboard`.

Problems with this flow for a commercial product:

- Duplicate manual data entry from the central platform.
- Operator chooses/communicates a password (no secure invitation).
- No link between the CRM organization and the platform organization.
- No entitlement state; access cannot be suspended or revoked centrally.

---

## 3. Proposed onboarding sequence

1. VSPH Owner creates the organization on `apps.vsph.in` and assigns CRM.
2. Central platform calls CRM integration endpoint with an authenticated,
   idempotent payload (`externalOrganizationId` + org + primary admin).
3. CRM validates the caller, normalizes the payload, and in a single
   transaction:
   - finds/creates the tenant by `external_organization_id` (unique),
   - upserts the CRM entitlement record,
   - creates a pending invitation for the primary admin if none exists,
   - writes an integration audit row.
4. CRM emails a single-use, time-limited invitation link (hash stored only).
5. Client Super Admin opens the link, sets a password, invitation is marked
   accepted, the user is activated, and they sign in to the existing CRM.
6. Client Super Admin invites/manages employees from inside CRM (`/v2/team`).
7. Central platform sends entitlement events (activated/changed/suspended/
   expired/revoked/deactivated). CRM stores them and enforces access.

Backward compatibility: the internal `/superadmin` panel remains for support
and maintenance, but is no longer the normal commercial onboarding path.

---

## 4. Existing files/modules that must change

### Backend

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `external_organization_id`, sync metadata, `user_is_tenant_owner`, optional password, `organization_app_entitlement`, `invitation`, `integration_event` |
| `prisma/migrations/…_central_client_onboarding/migration.sql` | Additive SQL + backfill entitlements for existing tenants |
| `prisma/seed.js` | Seed entitlement for the demo tenant; keep demo creds dev-only |
| `src/middleware/auth.middleware.js` | Expose `user_is_tenant_owner`; add entitlement decision helpers |
| `src/middleware/integration.middleware.js` | **New** HMAC + timestamp verification |
| `src/middleware/tenantAdmin.middleware.js` | **New** `requireTenantAdmin`, `requireEntitlement` |
| `src/services/integration.service.js` | **New** normalize + idempotent provisioning + audit |
| `src/services/invitation.service.js` | **New** token issue/preview/accept/resend |
| `src/services/entitlement.service.js` | **New** entitlement read/decision |
| `src/services/email.service.js` | **New** email adapter with safe dev fallback |
| `src/controllers/integration.controller.js` | **New** provision + entitlement event endpoints |
| `src/controllers/invitation.controller.js` | **New** accept/preview endpoints |
| `src/controllers/organization.controller.js` | **New** client-admin employee management |
| `src/controllers/auth.controller.js` | Block pending/entitlement-blocked logins |
| `src/controllers/tenant.controller.js` | Record source, expose entitlement/sync fields |
| `src/controllers/user.controller.js` | Expose owner flag |
| `src/routes/{integration,invitation,organization}.routes.js` | **New** |
| `src/server.js` | Mount new routes; apply entitlement guard to CRM routes |
| `tests/*` | **New** unit tests (node:test) |

### Frontend

| File | Change |
|------|--------|
| `src/App.jsx` | Add `/accept-invite`, `/v2/team` |
| `src/pages/AcceptInvite.jsx` | **New** set-password flow |
| `src/pages/Team.jsx` | **New** client employee management |
| `src/components/modals/InviteEmployeeModal.jsx` | **New** |
| `src/components/v2/sidebar.jsx` | Add "Team" nav item |
| `src/pages/superadmin/*` | Replace manual onboarding UI with centralized notice; keep support actions |
| `src/components/superadmin/UserFormModal.jsx` | Mark internal-support use |

### Docs

- `docs/CRM_ONBOARDING_MIGRATION.md` (this file)
- `README.md` — new env vars and integration contract
- `docs/INTEGRATION_CONTRACT.md` — **New** exact API contract for `apps.vsph.in`

---

## 5. Database changes and migration risks

### Additive changes (no drops, no data deletion)

- `tenant.external_organization_id` `VARCHAR(191) NULL UNIQUE`
- `tenant.tenant_sync_status` `VARCHAR(32) NULL`
- `tenant.tenant_synced_at` `DATETIME(3) NULL`
- `user.user_is_tenant_owner` `BOOLEAN NOT NULL DEFAULT false`
- `user.user_password` → nullable (existing values preserved)
- New `organization_app_entitlement` (unique `[tenant_fk, app_code]`)
- New `invitation` (unique `token_hash`; index `[tenant_fk, email, status]`)
- New `integration_event` (audit; index `[external_organization_id]`)

### Backfill

- Create an `ACTIVE` CRM entitlement for every existing tenant so current
  clients keep working immediately after migration.
- Backfill `user_is_tenant_owner = true` for existing client users whose role
  is `ADMIN` and who have no owner in their tenant (first one only).

### Risks

1. **Password nullability** — MySQL `MODIFY COLUMN` is safe, but any code that
   assumes a password must be taught to treat `NULL` as "not activated".
2. **Entitlement backfill** — if skipped, every existing client is blocked.
   The migration and seed both create the backfill deliberately.
3. **Unique external ID** — existing rows are `NULL` (allowed multiple times
   in MySQL), so no collision on existing data.
4. **No rollback of business data** — all changes are additive; the rollback
   script only removes the new columns/tables.
5. **`prisma db push`** — must run without `--accept-data-loss`; review the
   diff before applying in any shared environment.

---

## 6. Authentication and integration design

### Integration authentication

- Caller signs `timestamp + "." + rawBody` with HMAC-SHA256 using
  `INTEGRATION_HMAC_SECRET`.
- Headers: `X-VSPH-Timestamp`, `X-VSPH-Signature`.
- Reject timestamps older than `INTEGRATION_MAX_SKEW_SECONDS` (default 300)
  and constant-time compare signatures (replay protection).
- Dev fallback: `X-Integration-Key` matching `INTEGRATION_API_KEY`, enabled
  only outside production. No credentials are committed to the repo.
- The integration routes are mounted separately and never accept a user
  session as proof of identity.

### Client authentication

- Login resolves the user → tenant → entitlement on the server.
- Browser-supplied `tenant_fk` is never trusted; `getTenantFilter` derives it
  from the authenticated user.
- Pending invitation users (no password) cannot log in until they accept.
- `requireTenantAdmin` restricts employee management to `user_is_tenant_owner`
  or `ADMIN` within their own tenant.

### Entitlement enforcement

- `requireEntitlement` runs on CRM data routes.
- `SUPER_ADMIN` bypasses entitlement (internal support).
- Missing/unknown entitlement → deny (fail closed) when enforcement is on.
- `ENFORCE_ENTITLEMENT=false` is a development escape hatch only.

---

## 7. Backward-compatibility strategy

1. All schema changes are additive; no existing column/table is removed.
2. Existing tenants receive an `ACTIVE` entitlement during migration.
3. Existing users keep their passwords and `tenant_fk`.
4. The existing `/superadmin` routes and the client CRM stay functional.
5. Manual client creation remains available only as an explicit internal
   support action; normal onboarding starts at `apps.vsph.in`.
6. There is no new login page — the invitation acceptance page is additive.
7. Rollback: drop new tables/columns only; business data untouched.

---

## 8. Test plan and acceptance criteria

### Automated (node:test, no test framework dependency)

- Integration signature: valid accepted; wrong secret/tampered body/expired
  timestamp rejected.
- Idempotency: repeated provision payload yields one tenant, one entitlement,
  one pending invitation.
- Invitation: raw token never stored; hash matches; expired/accepted tokens
  rejected; password set activates user.
- Entitlement: ACTIVE allows; SUSPENDED/EXPIRED/REVOKED/unknown denies;
  SUPER_ADMIN bypasses.
- Tenant isolation: filter is `{}` for superadmin and `{tenant_fk}` otherwise.
- Authorization: client admin cannot target another tenant.

### Manual / integration

- Provision → invitation link → accept → login → dashboard.
- Resend invitation does not duplicate the user.
- Suspend entitlement → next request blocked with a clear message.
- Existing CRM modules still load for a seeded client.
- `npx vite build` passes.

### Acceptance criteria

- [ ] Central provision endpoint creates/links org idempotently.
- [ ] Primary admin receives an invitation, not a password.
- [ ] Client Super Admin manages own employees only.
- [ ] Entitlement enforced on protected routes.
- [ ] Existing data and modules preserved.
- [ ] Integration contract documented; pending items flagged.

---

## Integration dependencies on `apps.vsph.in`

CRM will implement the CRM side and a configurable adapter. The following must
be agreed/implemented by the central platform before end-to-end can be claimed:

| Dependency | Status |
|------------|--------|
| Base URL + environment (staging/prod) | Pending |
| HMAC secret distribution / rotation | Pending |
| Final payload field names | Pending (CRM normalizes aliases) |
| Event list and retry policy | Pending |
| Primary admin email/name availability | Pending |
| Subscription reference format | Pending |

Until then, the CRM endpoints can be exercised with the documented contract and
local dev key. End-to-end integration is **not** claimed as complete.
