# VSPH CRM — Central Platform Integration Contract

Status: **CRM side implemented and tested.** End-to-end integration with
`apps.vsph.in` is **pending** until the central platform supplies a base URL,
shared secret and confirms field names.

Base path: `/api/integrations`

All integration routes are mounted **before** the JSON body parser so the HMAC
is calculated over the exact raw bytes. They never accept a user session.

---

## 1. Authentication

Headers:

| Header | Required | Meaning |
|--------|----------|---------|
| `X-VSPH-Timestamp` | Yes (production) | Unix time in **seconds** |
| `X-VSPH-Signature` | Yes (production) | Hex HMAC-SHA256 of `timestamp + "." + rawBody` |
| `X-Integration-Key` | Dev only | Fallback key; ignored when `NODE_ENV=production` |
| `Content-Type` | Yes | `application/json` |

Signature:

```
signature = hex( HMAC_SHA256( INTEGRATION_HMAC_SECRET, `${timestamp}.${rawBody}` ) )
```

Rules:

- Reject if `abs(nowSeconds - timestamp) > INTEGRATION_MAX_SKEW_SECONDS` (default 300).
- Compare signatures in constant time.
- Reject with `401` and a reason when the secret is missing or invalid.
- `sha256=` prefix on the signature is accepted.

Environment:

| Variable | Purpose |
|----------|---------|
| `INTEGRATION_HMAC_SECRET` | Shared signing secret (production) |
| `INTEGRATION_API_KEY` | Development-only fallback |
| `INTEGRATION_MAX_SKEW_SECONDS` | Replay window, default `300` |

---

## 2. Provision / synchronize organization

`POST /api/integrations/organizations/provision`

Payload (camelCase; common aliases are accepted):

```json
{
  "externalOrganizationId": "org_123",
  "organizationName": "Acme Industries",
  "organizationCode": "ACME001",
  "primaryAdminEmail": "owner@acme.com",
  "primaryAdminName": "Asha Rao",
  "crmEntitlementStatus": "ACTIVE",
  "subscriptionReference": "sub_456",
  "effectiveStart": "2026-11-01T00:00:00.000Z",
  "effectiveEnd": "2027-11-01T00:00:00.000Z",
  "plan": "PROFESSIONAL"
}
```

Required: `externalOrganizationId`, `organizationName`.
`primaryAdminEmail` is optional; when present it must be a valid email.

Accepted aliases currently include `external_organization_id`,
`organizationId`, `organization_name`, `name`, `organizationCode`, `code`,
`primaryAdminEmail`, `adminEmail`, `email`, `crmEntitlementStatus`,
`entitlementStatus`, `status`, `subscriptionReference`, `subscription_id`,
`effectiveStart`, `effectiveEnd`, `plan`.

Behavior:

1. Normalize and validate the payload.
2. Look up the tenant by **`externalOrganizationId`** only. Names and emails are
   never used as identity.
3. Create the tenant if missing (unique `tenant_code`, suffixed on collision).
4. Update synchronized fields if it exists.
5. Upsert the CRM entitlement (`app_code = CRM`).
6. Find an existing owner (`user_is_tenant_owner` or role `ADMIN`). If none and
   an admin email is supplied:
   - link an existing unassigned user safely, or create a pending user
     (`user_password = NULL`, `user_status = false`, `user_role = ADMIN`);
   - create/reuse a single pending invitation;
   - send the invitation email.
7. Write an `integration_events` audit row.
8. All related writes run in a transaction. Concurrent duplicate requests are
   reconciled by the unique `external_organization_id`.

Success (`200`):

```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "externalOrganizationId": "org_123",
    "organizationName": "Acme Industries",
    "organizationCode": "ACME001",
    "created": true,
    "entitlementStatus": "ACTIVE",
    "admin": {
      "userId": "uuid",
      "email": "owner@acme.com",
      "status": "PENDING",
      "invitationStatus": "PENDING",
      "invitationReused": false
    },
    "devInvitationUrl": "http://localhost:5173/accept-invite?token=..."
  },
  "warnings": []
}
```

Notes:

- Retries are safe. A repeated request returns `created: false` and does not
  create a second tenant, user, entitlement or invitation.
- If an admin conflict exists (email already belongs to another organization or
  an internal account), the organization is still created and the response
  includes a warning with `admin.status = "CONFLICT"`. CRM never moves an
  account between organizations.
- `devInvitationUrl` is only returned when `NODE_ENV !== "production"`.
- Status codes: `200` success/partial, `400` validation error, `401` auth error,
  `500` retryable failure.

---

## 3. Entitlement lifecycle events

`POST /api/integrations/entitlements/sync`

```json
{
  "externalOrganizationId": "org_123",
  "eventType": "crm.entitlement.suspended",
  "crmEntitlementStatus": "SUSPENDED",
  "subscriptionReference": "sub_456",
  "effectiveStart": "2026-11-01T00:00:00.000Z",
  "effectiveEnd": "2027-11-01T00:00:00.000Z",
  "organizationStatus": "ACTIVE"
}
```

Supported `crmEntitlementStatus`: `ACTIVE`, `SUSPENDED`, `EXPIRED`, `REVOKED`,
`PENDING`. Common aliases (`enabled`, `paused`, `cancelled`, …) are normalized.

Behavior:

- Requires `externalOrganizationId` (`400` if missing).
- `404` if the organization is not provisioned.
- Upserts the CRM entitlement and updates `tenant_synced_at`.
- `organizationStatus` (`ACTIVE` / `INACTIVE`) optionally updates the local
  tenant status. Entitlement suspension alone does **not** delete data.
- Writes an `integration_events` row.

Success (`200`):

```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "entitlementStatus": "SUSPENDED",
    "effectiveEnd": "2027-11-01T00:00:00.000Z"
  }
}
```

---

## 4. Enforcement behavior

- Login checks the organization's CRM entitlement. Missing entitlement blocks
  access (fail closed).
- `authMiddleware` re-checks entitlement on every protected CRM API request.
- `SUPER_ADMIN` bypasses entitlement for internal support.
- Blocked responses: `403` with `code = CRM_ACCESS_<REASON>`.
- `ENFORCE_ENTITLEMENT=false` is a local development escape hatch only.

---

## 5. Invitation flow (CRM-owned)

1. Integration creates a pending user + invitation (hash stored only).
2. Email contains `INVITATION_BASE_URL/accept-invite?token=<raw token>`.
3. Recipient opens the link, previews the invitation and sets a password
   (minimum 8 characters).
4. CRM validates the token hash, single-use status and expiry, activates the
   user, marks the invitation `ACCEPTED`.
5. The user signs in at the normal client login.

Rules:

- Raw tokens are 32 random bytes (base64url), stored only as SHA-256 hashes.
- Default lifetime: `INVITATION_TTL_HOURS=72`.
- Accepted, revoked and expired tokens are rejected.
- No plaintext password is ever generated, emailed or returned.
- In development without `EMAIL_WEBHOOK_URL`, the link is printed to the server
  console and returned as `devInvitationUrl`.
- In production, a missing email provider fails the delivery step and adds a
  warning; the token is **not** logged or returned.

Email adapter: `backend/src/services/email.service.js`. Set
`EMAIL_WEBHOOK_URL` (and optional `EMAIL_WEBHOOK_TOKEN`); CRM POSTs
`{ to, subject, text }`.

---

## 6. Client administrator employee management

All routes require `X-User-Id` of an `ADMIN`/owner in their own organization and
an active entitlement.

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/organization/employees` | Own tenant only; includes pending invitation info |
| POST | `/api/organization/employees/invite` | Creates pending user + invitation |
| POST | `/api/organization/employees/:userId/resend-invite` | Reissues token on the same invitation row |
| PATCH | `/api/organization/employees/:userId` | Name, role, department, status |

Server-enforced restrictions:

- No `SUPER_ADMIN` grant.
- No cross-tenant reads or writes.
- No self-deactivation.
- No self role change.
- Owner must remain `ADMIN`.
- Deactivating an employee revokes their pending invitation.

---

## 7. Pending items owned by `apps.vsph.in`

| Item | Status |
|------|--------|
| Base URL for staging/production | Pending |
| HMAC secret distribution and rotation | Pending |
| Final payload field names | Pending (aliases supported) |
| Event list and retry/backoff policy | Pending (idempotent handlers ready) |
| Primary admin email/name availability | Pending |
| Subscription reference format | Pending |
| Email provider choice | Pending (adapter ready) |

End-to-end integration is **not** claimed until these are agreed and a real
request from `apps.vsph.in` is verified in staging.
