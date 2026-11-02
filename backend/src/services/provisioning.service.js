import { prisma } from "../lib/prisma.js";
import {
  normalizeEntitlementStatus,
  normalizeProvisionPayload,
  sanitizeTenantCode,
} from "../lib/onboarding.logic.js";
import { createInvitation, inviteUrlFor } from "./invitation.service.js";
import { sendInvitationEmail } from "./email.service.js";
import { upsertCrmEntitlement } from "./entitlement.service.js";

const APP_CODE = "CRM";
const isProduction = () => process.env.NODE_ENV === "production";

const recordEvent = async ({ externalOrganizationId, eventType, outcome, message, payload }) => {
  try {
    await prisma.integration_event.create({
      data: {
        external_organization_id: externalOrganizationId || null,
        event_type: eventType,
        event_outcome: outcome,
        event_message: message || null,
        event_payload: payload ? JSON.stringify(payload) : null,
      },
    });
  } catch (error) {
    // Audit failures must not break the integration response.
    console.error("Could not record integration event:", error.message);
  }
};

const uniqueTenantCode = async (preferredCode, externalId) => {
  const base = sanitizeTenantCode(preferredCode, externalId);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await prisma.tenant.findUnique({ where: { tenant_code: candidate } });
    if (!clash) return candidate;
  }
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
};

const findOwner = (tenantId) =>
  prisma.user.findFirst({
    where: {
      tenant_fk: tenantId,
      OR: [{ user_is_tenant_owner: true }, { user_role: "ADMIN" }],
    },
    orderBy: [{ user_is_tenant_owner: "desc" }, { user_created_at: "asc" }],
  });

/**
 * Idempotent organization provisioning.
 * Returns { ok, status, data, warnings }.
 */
export const provisionOrganization = async (payload) => {
  const { value, errors } = normalizeProvisionPayload(payload);
  if (errors.length > 0) {
    await recordEvent({
      eventType: "organization.provision",
      outcome: "rejected",
      message: errors.join("; "),
      payload: { externalOrganizationId: value.externalOrganizationId },
    });
    return { ok: false, status: 400, message: errors.join("; ") };
  }

  const warnings = [];
  let tenant = await prisma.tenant.findUnique({
    where: { external_organization_id: value.externalOrganizationId },
  });
  let created = false;

  if (!tenant) {
    const tenantCode = await uniqueTenantCode(
      value.organizationCode,
      value.externalOrganizationId
    );
    try {
      tenant = await prisma.$transaction(async (tx) => {
        const row = await tx.tenant.create({
          data: {
            tenant_name: value.organizationName,
            tenant_code: tenantCode,
            tenant_plan: value.plan || "STARTER",
            tenant_status: "ACTIVE",
            external_organization_id: value.externalOrganizationId,
            tenant_sync_status: "SYNCED",
            tenant_synced_at: new Date(),
          },
        });
        await upsertCrmEntitlement(
          {
            tenantFk: row.tenant_id,
            status: value.crmEntitlementStatus,
            subscriptionReference: value.subscriptionReference,
            effectiveStart: value.effectiveStart,
            effectiveEnd: value.effectiveEnd,
          },
          tx
        );
        return row;
      });
      created = true;
    } catch (error) {
      if (error.code !== "P2002") throw error;
      // A concurrent retry won the race; reuse its row.
      tenant = await prisma.tenant.findUnique({
        where: { external_organization_id: value.externalOrganizationId },
      });
      if (!tenant) throw error;
    }
  }

  if (!created) {
    tenant = await prisma.$transaction(async (tx) => {
      const row = await tx.tenant.update({
        where: { tenant_id: tenant.tenant_id },
        data: {
          tenant_name: value.organizationName,
          tenant_sync_status: "SYNCED",
          tenant_synced_at: new Date(),
        },
      });
      await upsertCrmEntitlement(
        {
          tenantFk: row.tenant_id,
          status: value.crmEntitlementStatus,
          subscriptionReference: value.subscriptionReference,
          effectiveStart: value.effectiveStart,
          effectiveEnd: value.effectiveEnd,
        },
        tx
      );
      return row;
    });
  }

  let admin = null;
  let devInviteUrl;

  const existingOwner = await findOwner(tenant.tenant_id);
  if (existingOwner) {
    admin = {
      userId: existingOwner.user_id,
      email: existingOwner.user_email,
      status: existingOwner.user_password ? "ACTIVE" : "PENDING",
    };

    // A retry after a failed delivery or expiry must still leave a usable link.
    if (!existingOwner.user_password) {
      const { invitation, token, reused } = await createInvitation({
        tenantFk: tenant.tenant_id,
        email: existingOwner.user_email,
        role: "ADMIN",
        source: "central_provisioning",
        invitedBy: "apps.vsph.in",
        reusePending: true,
      });
      admin.invitationStatus = invitation.invitation_status;
      admin.invitationReused = reused;
      if (token) {
        const inviteUrl = inviteUrlFor(token);
        try {
          const delivery = await sendInvitationEmail({
            to: existingOwner.user_email,
            name: existingOwner.user_name,
            organizationName: tenant.tenant_name,
            inviteUrl,
          });
          if (!isProduction() && delivery.devInviteUrl) devInviteUrl = delivery.devInviteUrl;
        } catch (error) {
          warnings.push(`Invitation email could not be delivered: ${error.message}`);
          if (!isProduction()) devInviteUrl = inviteUrl;
        }
      }
    }
  } else if (!value.primaryAdminEmail) {
    warnings.push("No primaryAdminEmail supplied; no client super admin was provisioned.");
  } else {
    let user = await prisma.user.findUnique({
      where: { user_email: value.primaryAdminEmail },
    });

    if (user && user.user_role === "SUPER_ADMIN") {
      warnings.push("Primary admin email belongs to an internal account; it was not linked.");
      admin = { email: value.primaryAdminEmail, status: "CONFLICT" };
    } else if (user && user.tenant_fk && user.tenant_fk !== tenant.tenant_id) {
      warnings.push("Primary admin email is already linked to another organization.");
      admin = { email: value.primaryAdminEmail, status: "CONFLICT" };
    } else {
      if (user) {
        user = await prisma.user.update({
          where: { user_id: user.user_id },
          data: {
            tenant_fk: tenant.tenant_id,
            user_role: "ADMIN",
            user_is_tenant_owner: true,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            user_name: value.primaryAdminName || value.primaryAdminEmail.split("@")[0],
            user_email: value.primaryAdminEmail,
            user_password: null,
            user_status: false,
            user_role: "ADMIN",
            user_is_tenant_owner: true,
            tenant_fk: tenant.tenant_id,
          },
        });
      }

      const { invitation, token, reused } = await createInvitation({
        tenantFk: tenant.tenant_id,
        email: value.primaryAdminEmail,
        role: "ADMIN",
        source: "central_provisioning",
        invitedBy: "apps.vsph.in",
        reusePending: true,
      });

      admin = {
        userId: user.user_id,
        email: user.user_email,
        status: user.user_password ? "ACTIVE" : "PENDING",
        invitationStatus: invitation.invitation_status,
        invitationReused: reused,
      };

      if (token) {
        const inviteUrl = inviteUrlFor(token);
        try {
          const delivery = await sendInvitationEmail({
            to: value.primaryAdminEmail,
            name: value.primaryAdminName,
            organizationName: tenant.tenant_name,
            inviteUrl,
          });
          if (!isProduction() && delivery.devInviteUrl) devInviteUrl = delivery.devInviteUrl;
        } catch (error) {
          warnings.push(`Invitation email could not be delivered: ${error.message}`);
          if (!isProduction()) devInviteUrl = inviteUrl;
        }
      }
    }
  }

  await recordEvent({
    externalOrganizationId: value.externalOrganizationId,
    eventType: "organization.provision",
    outcome: warnings.length ? "partial" : "success",
    message: warnings.join("; ") || null,
    payload: {
      tenantId: tenant.tenant_id,
      created,
      entitlementStatus: value.crmEntitlementStatus,
    },
  });

  return {
    ok: true,
    status: 200,
    data: {
      tenantId: tenant.tenant_id,
      externalOrganizationId: value.externalOrganizationId,
      organizationName: tenant.tenant_name,
      organizationCode: tenant.tenant_code,
      created,
      entitlementStatus: value.crmEntitlementStatus,
      admin,
      ...(devInviteUrl ? { devInvitationUrl: devInviteUrl } : {}),
    },
    warnings,
  };
};

/** Applies an entitlement lifecycle event from the central platform. */
export const syncEntitlementEvent = async (payload = {}) => {
  const externalOrganizationId =
    payload.externalOrganizationId ||
    payload.external_organization_id ||
    payload.organizationId;

  if (!externalOrganizationId) {
    return { ok: false, status: 400, message: "externalOrganizationId is required" };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { external_organization_id: String(externalOrganizationId) },
  });
  if (!tenant) {
    await recordEvent({
      externalOrganizationId,
      eventType: payload.eventType || "entitlement.sync",
      outcome: "not_found",
      message: "Organization is not provisioned in CRM",
    });
    return { ok: false, status: 404, message: "Organization is not provisioned in CRM" };
  }

  const status = normalizeEntitlementStatus(
    payload.crmEntitlementStatus || payload.entitlementStatus || payload.status
  );

  const entitlement = await upsertCrmEntitlement({
    tenantFk: tenant.tenant_id,
    status,
    subscriptionReference: payload.subscriptionReference,
    effectiveStart: payload.effectiveStart ? new Date(payload.effectiveStart) : undefined,
    effectiveEnd: payload.effectiveEnd ? new Date(payload.effectiveEnd) : undefined,
  });

  const organizationStatus = String(
    payload.organizationStatus || payload.tenantStatus || ""
  ).toUpperCase();

  await prisma.tenant.update({
    where: { tenant_id: tenant.tenant_id },
    data: {
      tenant_sync_status: "SYNCED",
      tenant_synced_at: new Date(),
      ...(organizationStatus === "ACTIVE" || organizationStatus === "INACTIVE"
        ? { tenant_status: organizationStatus }
        : {}),
    },
  });

  await recordEvent({
    externalOrganizationId,
    eventType: payload.eventType || "entitlement.sync",
    outcome: "success",
    payload: { status, appCode: APP_CODE },
  });

  return {
    ok: true,
    status: 200,
    data: {
      tenantId: tenant.tenant_id,
      entitlementStatus: entitlement.entitlement_status,
      effectiveEnd: entitlement.effective_end,
    },
  };
};
