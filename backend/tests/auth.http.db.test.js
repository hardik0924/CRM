import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/server.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, isPasswordHash } from "../src/lib/passwords.js";
import { signSessionToken } from "../src/lib/session.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";

process.env.AUTH_TOKEN_SECRET ||= "http-db-test-secret-key-32-characters-min";

const stamp = Date.now();
const email = (name) => `auth.${name}.${stamp}@example.test`;
const password = "Password123!";

const login = (base, emailAddress, supplied = password) =>
  fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailAddress, password: supplied }),
  });

const usersRequest = (base, headers) => fetch(`${base}/api/users`, { headers });

test("login, spoofing, expiry, revocation and tenant isolation", { skip: !runDbTests }, async () => {
  const tenantA = await prisma.tenant.create({
    data: {
      tenant_name: "Auth Test A",
      tenant_code: `ATA${stamp.toString(36)}`,
      tenant_sync_status: "TEST",
    },
  });
  const tenantB = await prisma.tenant.create({
    data: {
      tenant_name: "Auth Test B",
      tenant_code: `ATB${stamp.toString(36)}`,
      tenant_sync_status: "TEST",
    },
  });
  await prisma.organization_app_entitlement.createMany({
    data: [tenantA.tenant_id, tenantB.tenant_id].map((tenant_fk) => ({
      tenant_fk,
      app_code: "CRM",
      entitlement_status: "ACTIVE",
      last_synced_at: new Date(),
    })),
  });

  const adminA = await prisma.user.create({
    data: {
      user_name: "Admin A",
      user_email: email("admin-a"),
      user_password: await hashPassword(password),
      user_role: "ADMIN",
      user_is_tenant_owner: true,
      tenant_fk: tenantA.tenant_id,
    },
  });
  const userB = await prisma.user.create({
    data: {
      user_name: "User B",
      user_email: email("user-b"),
      user_password: await hashPassword(password),
      user_role: "SALES",
      tenant_fk: tenantB.tenant_id,
    },
  });
  const legacy = await prisma.user.create({
    data: {
      user_name: "Legacy A",
      user_email: email("legacy-a"),
      user_password: "legacy123",
      user_role: "SALES",
      tenant_fk: tenantA.tenant_id,
    },
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await login(base, adminA.user_email);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.token);
    const token = body.token;
    const auth = { Authorization: `Bearer ${token}` };

    // The signed token authenticates.
    const allowed = await usersRequest(base, auth);
    assert.equal(allowed.status, 200);

    // Tenant isolation: tenant A's admin never sees tenant B's user.
    const listed = await allowed.json();
    assert.equal(listed.data.some((row) => row.user_id === userB.user_id), false);
    assert.equal(listed.data.some((row) => row.user_id === adminA.user_id), true);

    // A client-supplied identity header is ignored.
    const spoofed = await usersRequest(base, { "x-user-id": adminA.user_id });
    assert.equal(spoofed.status, 401);

    const tampered = await usersRequest(base, { Authorization: `Bearer ${token}x` });
    assert.equal(tampered.status, 401);

    const expired = signSessionToken(adminA, Date.now() - 13 * 60 * 60 * 1000);
    assert.equal((await usersRequest(base, { Authorization: `Bearer ${expired}` })).status, 401);

    // Wrong password and an expired token both fail.
    assert.equal((await login(base, adminA.user_email, "wrong password")).status, 401);

    // Changing the password revokes tokens issued before the change.
    await prisma.user.update({
      where: { user_id: adminA.user_id },
      data: { user_password: await hashPassword("NewPassword123!") },
    });
    assert.equal((await usersRequest(base, auth)).status, 401);

    // A legacy plaintext row logs in once and is upgraded to a hash.
    const legacyLogin = await login(base, legacy.user_email, "legacy123");
    assert.equal(legacyLogin.status, 200);
    const migrated = await prisma.user.findUnique({ where: { user_id: legacy.user_id } });
    assert.ok(isPasswordHash(migrated.user_password));
    assert.notEqual(migrated.user_password, "legacy123");
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
    await prisma.invitation.deleteMany({ where: { tenant_fk: { in: [tenantA.tenant_id, tenantB.tenant_id] } } });
    await prisma.user.deleteMany({ where: { tenant_fk: { in: [tenantA.tenant_id, tenantB.tenant_id] } } });
    await prisma.organization_app_entitlement.deleteMany({
      where: { tenant_fk: { in: [tenantA.tenant_id, tenantB.tenant_id] } },
    });
    await prisma.tenant.deleteMany({ where: { tenant_id: { in: [tenantA.tenant_id, tenantB.tenant_id] } } });
    await prisma.$disconnect();
  }
});
