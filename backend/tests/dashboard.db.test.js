import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/server.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/passwords.js";
import { signSessionToken } from "../src/lib/session.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";

process.env.AUTH_TOKEN_SECRET ||= "dashboard-db-test-secret-key-32-chars-min";

test("dashboard is organization-wide for admins and personal for employees", { skip: !runDbTests }, async () => {
  const stamp = Date.now();
  const tenant = await prisma.tenant.create({
    data: { tenant_name: "Dashboard Test", tenant_code: `D${stamp}`.slice(0, 20), tenant_status: "ACTIVE" },
  });
  await prisma.organization_app_entitlement.create({
    data: {
      tenant_fk: tenant.tenant_id,
      app_code: "CRM",
      entitlement_status: "ACTIVE",
      effective_start: new Date(Date.now() - 86400000),
    },
  });

  const password = await hashPassword("Password123!");
  const admin = await prisma.user.create({
    data: {
      user_name: "Dash Admin",
      user_email: `dash.admin.${stamp}@example.test`,
      user_password: password,
      user_role: "ADMIN",
      user_is_tenant_owner: true,
      tenant_fk: tenant.tenant_id,
    },
  });
  const employee = await prisma.user.create({
    data: {
      user_name: "Dash Employee",
      user_email: `dash.employee.${stamp}@example.test`,
      user_password: password,
      user_role: "SALES",
      tenant_fk: tenant.tenant_id,
    },
  });
  const teammate = await prisma.user.create({
    data: {
      user_name: "Dash Teammate",
      user_email: `dash.teammate.${stamp}@example.test`,
      user_password: password,
      user_role: "SALES",
      tenant_fk: tenant.tenant_id,
    },
  });

  const contact = await prisma.contact.create({
    data: {
      tenant_fk: tenant.tenant_id,
      contact_code: `DBT-${stamp}`,
      contact_firstname: "Live",
      contact_lastname: "Contact",
      contact_owner_fk: employee.user_id,
    },
  });
  await prisma.call.create({
    data: {
      tenant_fk: tenant.tenant_id,
      call_user_fk: employee.user_id,
      call_contact_fk: contact.contact_id,
      call_subject: "Intro call",
    },
  });
  const teammateContact = await prisma.contact.create({
    data: {
      tenant_fk: tenant.tenant_id,
      contact_code: `DBT2-${stamp}`,
      contact_firstname: "Other",
      contact_lastname: "Contact",
      contact_owner_fk: teammate.user_id,
    },
  });
  await prisma.call.create({
    data: {
      tenant_fk: tenant.tenant_id,
      call_user_fk: teammate.user_id,
      call_contact_fk: teammateContact.contact_id,
      call_subject: "Teammate call",
    },
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const token = signSessionToken(admin);
    const response = await fetch(`${base}/api/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);

    // Organization-wide counts: the admin sees both teammates' work.
    assert.equal(body.data.scope, "ORGANIZATION");
    assert.equal(body.data.callsToday, 2);
    assert.equal(body.data.callsByDay.reduce((sum, day) => sum + day.count, 0), 2);

    const contactActivity = body.data.recentActivity.find((item) => item.type === "contact");
    assert.equal(contactActivity.user, "Dash Teammate");
    assert.deepEqual(
      [...new Set(body.data.recentActivity.map((item) => item.user))].sort(),
      ["Dash Employee", "Dash Teammate"]
    );

    // Same data, employee scope: only their own calls, contacts and tasks.
    const employeeResponse = await fetch(`${base}/api/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${signSessionToken(employee)}` },
    });
    assert.equal(employeeResponse.status, 200);
    const employeeBody = await employeeResponse.json();
    assert.equal(employeeBody.data.scope, "PERSONAL");
    assert.equal(employeeBody.data.callsToday, 1);
    assert.equal(
      employeeBody.data.callsByDay.reduce((sum, day) => sum + day.count, 0),
      1
    );
    assert.ok(
      employeeBody.data.recentActivity.every((item) => item.user === "Dash Employee"),
      "employees only see their own activity"
    );
    assert.equal(employeeBody.data.recentActivity.length, 2);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
    await prisma.call.deleteMany({ where: { tenant_fk: tenant.tenant_id } });
    await prisma.contact.deleteMany({ where: { tenant_fk: tenant.tenant_id } });
    await prisma.user.deleteMany({ where: { tenant_fk: tenant.tenant_id } });
    await prisma.organization_app_entitlement.deleteMany({ where: { tenant_fk: tenant.tenant_id } });
    await prisma.tenant.delete({ where: { tenant_id: tenant.tenant_id } });
    await prisma.$disconnect();
  }
});
