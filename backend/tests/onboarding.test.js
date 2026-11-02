import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInviteUrl,
  evaluateCrmAccess,
  generateInvitationToken,
  hashInvitationToken,
  isInvitationUsable,
  normalizeProvisionPayload,
  signIntegrationPayload,
  validateNewPassword,
  verifyIntegrationRequest,
} from "../src/lib/onboarding.logic.js";
import { getTenantFilter } from "../src/middleware/auth.middleware.js";
import { validateClientRole } from "../src/middleware/tenantAdmin.middleware.js";

const SECRET = "test-secret";
const nowSeconds = 1_800_000_000;

test("integration signature accepts a valid HMAC request", () => {
  const body = JSON.stringify({ externalOrganizationId: "org-1" });
  const signature = signIntegrationPayload(nowSeconds, body, SECRET);
  const result = verifyIntegrationRequest({
    rawBody: body,
    headers: { "x-vsph-timestamp": String(nowSeconds), "x-vsph-signature": signature },
    secret: SECRET,
    now: nowSeconds * 1000,
  });
  assert.equal(result.ok, true);
  assert.equal(result.mode, "hmac");
});

test("integration signature rejects tampered body, wrong secret and stale timestamp", () => {
  const body = JSON.stringify({ externalOrganizationId: "org-1" });
  const signature = signIntegrationPayload(nowSeconds, body, SECRET);
  const headers = { "x-vsph-timestamp": String(nowSeconds), "x-vsph-signature": signature };

  assert.equal(
    verifyIntegrationRequest({ rawBody: `${body} `, headers, secret: SECRET, now: nowSeconds * 1000 }).ok,
    false
  );
  assert.equal(
    verifyIntegrationRequest({ rawBody: body, headers, secret: "other", now: nowSeconds * 1000 }).ok,
    false
  );
  assert.equal(
    verifyIntegrationRequest({ rawBody: body, headers, secret: SECRET, now: (nowSeconds + 301) * 1000 }).ok,
    false
  );
});

test("developer key works outside production only", () => {
  const input = {
    rawBody: "{}",
    headers: { "x-integration-key": "dev-key" },
    apiKey: "dev-key",
  };
  assert.equal(verifyIntegrationRequest({ ...input, nodeEnv: "development" }).ok, true);
  assert.equal(verifyIntegrationRequest({ ...input, nodeEnv: "production" }).ok, false);
});

test("provision payload normalizes aliases and validates required fields", () => {
  const { value, errors } = normalizeProvisionPayload({
    external_organization_id: "ext-42",
    organization_name: "Acme",
    admin_email: "Owner@Acme.com",
    entitlement_status: "enabled",
    subscription_id: "sub_1",
  });
  assert.deepEqual(errors, []);
  assert.equal(value.externalOrganizationId, "ext-42");
  assert.equal(value.organizationName, "Acme");
  assert.equal(value.primaryAdminEmail, "owner@acme.com");
  assert.equal(value.crmEntitlementStatus, "ACTIVE");
  assert.equal(value.subscriptionReference, "sub_1");

  const missing = normalizeProvisionPayload({ name: "No id" });
  assert.ok(missing.errors.some((e) => e.includes("externalOrganizationId")));

  const badEmail = normalizeProvisionPayload({
    externalOrganizationId: "x",
    organizationName: "X",
    primaryAdminEmail: "not-an-email",
  });
  assert.ok(badEmail.errors.some((e) => e.includes("primaryAdminEmail")));
});

test("entitlement is fail-closed", () => {
  const tenant = { tenant_status: "ACTIVE" };
  const active = { entitlement_status: "ACTIVE" };

  assert.equal(evaluateCrmAccess({ role: "USER", tenant, entitlement: active }).allowed, true);
  assert.equal(
    evaluateCrmAccess({ role: "USER", tenant, entitlement: { entitlement_status: "SUSPENDED" } }).allowed,
    false
  );
  assert.equal(evaluateCrmAccess({ role: "USER", tenant, entitlement: null }).reason, "entitlement_unknown");
  assert.equal(
    evaluateCrmAccess({ role: "USER", tenant: { tenant_status: "INACTIVE" }, entitlement: active }).allowed,
    false
  );
  assert.equal(
    evaluateCrmAccess({
      role: "USER",
      tenant,
      entitlement: { entitlement_status: "ACTIVE", effective_end: new Date("2020-01-01") },
    }).allowed,
    false
  );
  assert.equal(evaluateCrmAccess({ role: "SUPER_ADMIN", tenant: null, entitlement: null }).allowed, true);
});

test("invitation tokens are random, hashed and single-use window is checked", () => {
  const a = generateInvitationToken();
  const b = generateInvitationToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 40);
  assert.notEqual(hashInvitationToken(a), a);
  assert.equal(hashInvitationToken(a), hashInvitationToken(a));

  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);
  assert.equal(
    isInvitationUsable({ invitation_status: "PENDING", invitation_expires_at: future }),
    true
  );
  assert.equal(
    isInvitationUsable({ invitation_status: "PENDING", invitation_expires_at: past }),
    false
  );
  assert.equal(
    isInvitationUsable({ invitation_status: "ACCEPTED", invitation_expires_at: future }),
    false
  );
});

test("new password is validated before activation", () => {
  assert.ok(validateNewPassword("short"));
  assert.ok(validateNewPassword(null));
  assert.equal(validateNewPassword("long-enough"), null);
});

test("invite URLs are built safely", () => {
  assert.equal(
    buildInviteUrl("abc 123", "https://crm.example.com/"),
    "https://crm.example.com/accept-invite?token=abc%20123"
  );
});

test("tenant filter never trusts a browser supplied tenant", () => {
  assert.deepEqual(
    getTenantFilter({ user: { role: "USER", tenantFk: "tenant-a" }, body: { tenant_fk: "tenant-b" } }),
    { tenant_fk: "tenant-a" }
  );
  assert.deepEqual(getTenantFilter({ user: { role: "SUPER_ADMIN" } }), {});
});

test("client roles cannot include platform SUPER_ADMIN", () => {
  assert.equal(validateClientRole("SUPER_ADMIN").ok, false);
  assert.equal(validateClientRole("ADMIN").ok, true);
  assert.equal(validateClientRole(undefined).ok, true);
});
