/**
 * Idempotent backfill for existing local data after the onboarding migration.
 * Safe to run more than once. Never deletes or rewrites business records.
 *
 *   node prisma/backfillOnboarding.js
 */
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { tenant_id: true, tenant_name: true } });
  let entitlementsCreated = 0;
  let ownersMarked = 0;

  for (const tenant of tenants) {
    const entitlement = await prisma.organization_app_entitlement.findUnique({
      where: { tenant_fk_app_code: { tenant_fk: tenant.tenant_id, app_code: "CRM" } },
    });
    if (!entitlement) {
      await prisma.organization_app_entitlement.create({
        data: {
          tenant_fk: tenant.tenant_id,
          app_code: "CRM",
          entitlement_status: "ACTIVE",
          last_synced_at: new Date(),
        },
      });
      entitlementsCreated += 1;
    }

    const owner = await prisma.user.findFirst({
      where: { tenant_fk: tenant.tenant_id, user_is_tenant_owner: true },
      select: { user_id: true },
    });
    if (!owner) {
      const admin = await prisma.user.findFirst({
        where: { tenant_fk: tenant.tenant_id, user_role: "ADMIN" },
        orderBy: { user_created_at: "asc" },
      });
      if (admin) {
        await prisma.user.update({
          where: { user_id: admin.user_id },
          data: { user_is_tenant_owner: true },
        });
        ownersMarked += 1;
      }
    }
  }

  console.log(
    `Backfill complete: ${entitlementsCreated} entitlement(s), ${ownersMarked} owner(s) across ${tenants.length} tenant(s).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
