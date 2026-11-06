import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.js";
import { provisionOrganization, syncEntitlementEvent } from "../src/services/provisioning.service.js";
import { acceptInvitation } from "../src/services/invitation.service.js";
import { getCrmEntitlement } from "../src/services/entitlement.service.js";
import { evaluateCrmAccess } from "../src/lib/onboarding.logic.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";

test("provisioning is idempotent and invitations are single-use", { skip: !runDbTests }, async () => {
  const stamp = Date.now();
  const externalId = `test-ext-${stamp}`;
  const email = `owner.${stamp}@example.test`;
  let tenantId = null;

  try {
    const payload = {
      externalOrganizationId: externalId,
      organizationName: "Test Provision Co",
      organizationCode: `TP${stamp.toString(36).toUpperCase()}`,
      primaryAdminEmail: email,
      primaryAdminName: "Test Owner",
      crmEntitlementStatus: "ACTIVE",
      subscriptionReference: "sub-test",
    };

    const first = await provisionOrganization(payload);
    assert.equal(first.ok, true);
    assert.equal(first.data.created, true);
    assert.ok(first.data.devInvitationUrl, "dev invitation URL expected outside production");
    tenantId = first.data.tenantId;

    const token = new URL(first.data.devInvitationUrl).searchParams.get("token");
    assert.ok(token);

    const second = await provisionOrganization(payload);
    assert.equal(second.ok, true);
    assert.equal(second.data.created, false);
    assert.equal(second.data.tenantId, tenantId);

    const [tenants, users, invitations, entitlements] = await Promise.all([
      prisma.tenant.count({ where: { external_organization_id: externalId } }),
      prisma.user.count({ where: { tenant_fk: tenantId } }),
      prisma.invitation.count({ where: { tenant_fk: tenantId } }),
      prisma.organization_app_entitlement.count({ where: { tenant_fk: tenantId } }),
    ]);
    assert.equal(tenants, 1);
    assert.equal(users, 1);
    assert.equal(invitations, 1);
    assert.equal(entitlements, 1);

    const activated = await acceptInvitation(token, "secret123");
    assert.equal(activated.user_status, true);
    assert.equal(activated.user_role, "ADMIN");
    assert.equal(activated.user_is_tenant_owner, true);
    assert.ok(activated.user_password.startsWith("scrypt$"), "password must be stored as a hash");
    assert.notEqual(activated.user_password, "secret123");

    await assert.rejects(() => acceptInvitation(token, "secret123"), /already been used|invalid/i);

    const synced = await syncEntitlementEvent({
      externalOrganizationId: externalId,
      crmEntitlementStatus: "SUSPENDED",
    });
    assert.equal(synced.ok, true);

    const entitlement = await getCrmEntitlement(tenantId);
    const decision = evaluateCrmAccess({
      role: "ADMIN",
      tenant: { tenant_status: "ACTIVE" },
      entitlement,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "entitlement_suspended");
  } finally {
    if (tenantId) {
      await prisma.invitation.deleteMany({ where: { tenant_fk: tenantId } });
      await prisma.user.deleteMany({ where: { tenant_fk: tenantId } });
      await prisma.organization_app_entitlement.deleteMany({ where: { tenant_fk: tenantId } });
      await prisma.tenant.deleteMany({ where: { tenant_id: tenantId } });
    }
    await prisma.integration_event.deleteMany({ where: { external_organization_id: externalId } });
    await prisma.$disconnect();
  }
});
