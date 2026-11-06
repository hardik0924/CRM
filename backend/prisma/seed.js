import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/passwords.js";

async function main() {
  console.log("🌱 Seeding default tenant...");

  const tenant = await prisma.tenant.create({
    data: {
      tenant_name: "VSPH Demo Client",
      tenant_code: "VSPH001",
      tenant_plan: "STARTER",
      tenant_status: "ACTIVE",
      tenant_sync_status: "INTERNAL_SEED",
    },
  });
  await prisma.organization_app_entitlement.create({
    data: {
      tenant_fk: tenant.tenant_id,
      app_code: "CRM",
      entitlement_status: "ACTIVE",
      last_synced_at: new Date(),
    },
  });
  console.log("✅ Tenant seeded:", tenant.tenant_name);

  console.log("🌱 Seeding superadmin user...");
  await prisma.user.create({
    data: {
      user_email: "superadmin@crm.com",
      user_name: "VSPH Superadmin",
      user_role: "SUPER_ADMIN",
      user_department: "SALES",
      user_password: await hashPassword("0000"),
      user_status: true,
      tenant_fk: null,
    },
  });
  console.log("✅ Superadmin seeded!");

  console.log("🌱 Seeding client user...");
  await prisma.user.create({
    data: {
      user_email: "client@vsph.com",
      user_name: "Client User",
      user_role: "ADMIN",
      user_department: "SALES",
      user_password: await hashPassword("0000"),
      user_status: true,
      user_is_tenant_owner: true,
      tenant_fk: tenant.tenant_id,
    },
  });
  console.log("✅ Client user seeded!");

  console.log("✅ All seeds completed successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
