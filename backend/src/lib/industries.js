// Industry names are unique per tenant, so two clients can each have
// "Technology" without sharing (or leaking) a row.
export async function findOrCreateIndustry(prisma, tenantId, name) {
  const industryName = String(name || "").trim();
  if (!industryName || !tenantId) return null;

  // shortcut: two first-time saves of the same name at once can race on the
  // create; the unique key makes it a failed request, not bad data.
  return prisma.industry.upsert({
    where: {
      tenant_fk_industry_name: {
        tenant_fk: tenantId,
        industry_name: industryName,
      },
    },
    update: {},
    create: { industry_name: industryName, tenant_fk: tenantId },
  });
}
