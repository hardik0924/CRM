import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/passwords.js";
import {
  buildInviteUrl,
  generateInvitationToken,
  hashInvitationToken,
  isInvitationUsable,
  validateNewPassword,
} from "../lib/onboarding.logic.js";

const INVITATION_TTL_HOURS = Number(process.env.INVITATION_TTL_HOURS || 72);

export const invitationExpiry = () =>
  new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);

export const inviteBaseUrl = () =>
  process.env.INVITATION_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Creates (or reuses) an invitation for an email inside a tenant.
 * Only the hash is stored; the raw token is returned once for delivery.
 */
export const createInvitation = async ({
  tenantFk,
  email,
  role = "ADMIN",
  source = "tenant_admin",
  invitedBy = null,
  reusePending = true,
  tx = prisma,
}) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const pending = await tx.invitation.findFirst({
    where: {
      tenant_fk: tenantFk,
      invitation_email: normalizedEmail,
      invitation_status: "PENDING",
    },
    orderBy: { created_at: "desc" },
  });

  if (pending && isInvitationUsable(pending) && reusePending) {
    return { invitation: pending, token: null, reused: true };
  }

  if (pending) {
    // Expired or deliberately reissued: retire the old token.
    await tx.invitation.update({
      where: { invitation_id: pending.invitation_id },
      data: { invitation_status: "EXPIRED" },
    });
  }

  const token = generateInvitationToken();
  const invitation = await tx.invitation.create({
    data: {
      tenant_fk: tenantFk,
      invitation_email: normalizedEmail,
      invitation_role: role,
      invitation_token_hash: hashInvitationToken(token),
      invitation_expires_at: invitationExpiry(),
      invitation_source: source,
      invited_by: invitedBy,
    },
  });

  return { invitation, token, reused: false };
};

export const inviteUrlFor = (token) => buildInviteUrl(token, inviteBaseUrl());

export const previewInvitation = async (rawToken) => {
  if (!rawToken) return null;
  const invitation = await prisma.invitation.findUnique({
    where: { invitation_token_hash: hashInvitationToken(rawToken) },
    include: { tenant: { select: { tenant_name: true, tenant_code: true } } },
  });
  if (!invitation) return null;
  return {
    email: invitation.invitation_email,
    role: invitation.invitation_role,
    organizationName: invitation.tenant?.tenant_name || null,
    organizationCode: invitation.tenant?.tenant_code || null,
    status: invitation.invitation_status,
    expiresAt: invitation.invitation_expires_at,
    usable: isInvitationUsable(invitation),
  };
};

/** One-time use: marks the invitation accepted and activates the membership. */
export const acceptInvitation = async (rawToken, password) => {
  const passwordError = validateNewPassword(password);
  if (passwordError) {
    const err = new Error(passwordError);
    err.status = 400;
    throw err;
  }

  // Hash outside the transaction so the scrypt work does not hold a DB lock.
  const passwordHash = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { invitation_token_hash: hashInvitationToken(rawToken) },
    });

    if (!invitation) {
      const err = new Error("This invitation link is invalid.");
      err.status = 400;
      throw err;
    }
    if (invitation.invitation_status !== "PENDING") {
      const err = new Error("This invitation has already been used or revoked.");
      err.status = 400;
      throw err;
    }
    if (!isInvitationUsable(invitation)) {
      await tx.invitation.update({
        where: { invitation_id: invitation.invitation_id },
        data: { invitation_status: "EXPIRED" },
      });
      const err = new Error("This invitation has expired. Ask your administrator to resend it.");
      err.status = 400;
      throw err;
    }

    const email = invitation.invitation_email;
    const existing = await tx.user.findUnique({ where: { user_email: email } });

    if (existing) {
      if (existing.user_role === "SUPER_ADMIN") {
        const err = new Error("This email belongs to an internal account and cannot be invited.");
        err.status = 409;
        throw err;
      }
      if (existing.tenant_fk && existing.tenant_fk !== invitation.tenant_fk) {
        // Never move an account between organizations.
        const err = new Error("This email is already linked to another organization.");
        err.status = 409;
        throw err;
      }
    }

    const becomesOwner =
      invitation.invitation_role === "ADMIN" &&
      invitation.invitation_source === "central_provisioning";

    const user = existing
      ? await tx.user.update({
          where: { user_id: existing.user_id },
          data: {
            user_password: passwordHash,
            user_status: true,
            tenant_fk: invitation.tenant_fk,
            user_role: invitation.invitation_role,
            user_is_tenant_owner: existing.user_is_tenant_owner || becomesOwner,
          },
        })
      : await tx.user.create({
          data: {
            user_name: email.split("@")[0],
            user_email: email,
            user_password: passwordHash,
            user_status: true,
            user_role: invitation.invitation_role,
            user_is_tenant_owner: becomesOwner,
            tenant_fk: invitation.tenant_fk,
          },
        });

    await tx.invitation.update({
      where: { invitation_id: invitation.invitation_id },
      data: {
        invitation_status: "ACCEPTED",
        invitation_accepted_at: new Date(),
      },
    });

    return user;
  });
};

/** Reissues a pending/expired invitation without creating a duplicate row. */
export const reissueInvitation = async ({ invitationId, tenantFk, tx = prisma }) => {
  const invitation = await tx.invitation.findFirst({
    where: { invitation_id: invitationId, tenant_fk: tenantFk },
  });
  if (!invitation) return null;

  const token = generateInvitationToken();
  const updated = await tx.invitation.update({
    where: { invitation_id: invitation.invitation_id },
    data: {
      invitation_token_hash: hashInvitationToken(token),
      invitation_status: "PENDING",
      invitation_expires_at: invitationExpiry(),
      invitation_accepted_at: null,
    },
  });
  return { invitation: updated, token };
};
