import test from "node:test";
import assert from "node:assert/strict";
import { findOrCreateIndustry } from "../src/lib/industries.js";

const fakePrisma = () => {
  const calls = [];
  return {
    calls,
    industry: {
      upsert: async (args) => {
        calls.push(args);
        return {
          industry_id: `id-${args.where.tenant_fk_industry_name.tenant_fk}`,
        };
      },
    },
  };
};

test("an industry name is created per tenant, not shared across tenants", async () => {
  const prisma = fakePrisma();

  const first = await findOrCreateIndustry(prisma, "tenant-a", " Technology ");
  const second = await findOrCreateIndustry(prisma, "tenant-b", "Technology");

  assert.equal(first.industry_id, "id-tenant-a");
  assert.equal(second.industry_id, "id-tenant-b");
  assert.deepEqual(prisma.calls[0].where, {
    tenant_fk_industry_name: {
      tenant_fk: "tenant-a",
      industry_name: "Technology",
    },
  });
  assert.equal(prisma.calls[1].create.tenant_fk, "tenant-b");
  assert.equal(prisma.calls[1].create.industry_name, "Technology");
});

test("a missing name or tenant does not write anything", async () => {
  const prisma = fakePrisma();

  assert.equal(await findOrCreateIndustry(prisma, "tenant-a", "  "), null);
  assert.equal(await findOrCreateIndustry(prisma, null, "Retail"), null);
  assert.equal(prisma.calls.length, 0);
});
