import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("🌱 Seeding default tenant...");

  const tenant = await prisma.tenant.create({
    data: {
      tenant_name: "VSPH Demo Client",
      tenant_code: "VSPH001",
      tenant_plan: "STARTER",
      tenant_status: "ACTIVE",
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
      user_password: "0000",
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
      user_password: "0000",
      user_status: true,
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
