import { prisma } from "../lib/prisma.js";
import {
  evaluateCrmAccess,
  isEntitlementEnforced,
} from "../lib/onboarding.logic.js";

const APP_CODE = "CRM";

export const getCrmEntitlement = async (tenantFk) => {
  if (!tenantFk) return null;
  return prisma.organization_app_entitlement.findUnique({
    where: { tenant_fk_app_code: { tenant_fk: tenantFk, app_code: APP_CODE } },
  });
};

export const upsertCrmEntitlement = async (
  {
    tenantFk,
    status = "ACTIVE",
    subscriptionReference,
    effectiveStart,
    effectiveEnd,
  },
  tx = prisma
) => {
  const syncedFields = {
    ...(subscriptionReference !== undefined
      ? { external_subscription_ref: subscriptionReference }
      : {}),
    ...(effectiveStart !== undefined ? { effective_start: effectiveStart } : {}),
    ...(effectiveEnd !== undefined ? { effective_end: effectiveEnd } : {}),
  };

  return tx.organization_app_entitlement.upsert({
    where: { tenant_fk_app_code: { tenant_fk: tenantFk, app_code: APP_CODE } },
    create: {
      tenant_fk: tenantFk,
      app_code: APP_CODE,
      entitlement_status: status,
      ...syncedFields,
      last_synced_at: new Date(),
    },
    update: {
      entitlement_status: status,
      ...syncedFields,
      last_synced_at: new Date(),
    },
  });
};

/** Server-side decision used by authMiddleware on every protected route. */
export const checkCrmAccess = async (user) => {
  const entitlement = user.tenant_fk ? await getCrmEntitlement(user.tenant_fk) : null;
  return {
    ...evaluateCrmAccess({
      role: user.user_role,
      tenant: user.tenant,
      entitlement,
      enforce: isEntitlementEnforced(process.env.ENFORCE_ENTITLEMENT),
    }),
    entitlement,
  };
};
