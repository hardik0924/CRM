import { prisma } from "../lib/prisma.js";
import { isClientRole, isEmail } from "../lib/onboarding.logic.js";
import { parseModuleAccess, serializeModuleAccess, validateModules } from "../lib/modules.js";
import {
  createInvitation,
  inviteUrlFor,
  reissueInvitation,
} from "../services/invitation.service.js";
import { sendInvitationEmail } from "../services/email.service.js";

const isProduction = () => process.env.NODE_ENV === "production";

const deliver = async ({ email, name, organizationName, token, warnings }) => {
  const inviteUrl = inviteUrlFor(token);
  try {
    const delivery = await sendInvitationEmail({ to: email, name, organizationName, inviteUrl });
    if (!isProduction() && delivery.devInviteUrl) return { devInvitationUrl: delivery.devInviteUrl };
  } catch (error) {
    warnings.push(`Invitation email could not be delivered: ${error.message}`);
    if (!isProduction()) return { devInvitationUrl: inviteUrl };
  }
  return {};
};

export const listEmployees = async (req, res) => {
  try {
    const [users, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { tenant_fk: req.user.tenantFk },
        select: {
          user_id: true,
          user_name: true,
          user_email: true,
          user_role: true,
          user_department: true,
          user_status: true,
          user_is_tenant_owner: true,
          user_module_access: true,
          user_created_at: true,
        },
        orderBy: [{ user_is_tenant_owner: "desc" }, { user_created_at: "asc" }],
      }),
      prisma.invitation.findMany({
        where: { tenant_fk: req.user.tenantFk, invitation_status: "PENDING" },
        select: {
          invitation_id: true,
          invitation_email: true,
          invitation_status: true,
          invitation_expires_at: true,
        },
      }),
    ]);

    const byEmail = new Map(invitations.map((i) => [i.invitation_email, i]));

    return res.status(200).json({
      success: true,
      data: users.map((user) => ({
        ...user,
        user_module_access: undefined,
        modules: parseModuleAccess(user.user_module_access),
        pendingInvitation: byEmail.get(user.user_email) || null,
      })),
    });
  } catch (error) {
    console.error("Error listing employees:", error);
    return res.status(500).json({ success: false, message: "Could not load employees." });
  }
};

export const inviteEmployee = async (req, res) => {
  const { email, name, role = "USER", department = "SALES", modules } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!isEmail(normalizedEmail)) {
    return res.status(400).json({ success: false, message: "A valid email address is required." });
  }
  if (!isClientRole(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Client users cannot be granted platform roles.",
    });
  }
  const moduleCheck = validateModules(modules);
  if (!moduleCheck.ok) {
    return res.status(400).json({ success: false, message: moduleCheck.message });
  }

  const warnings = [];
  try {
    const existing = await prisma.user.findUnique({ where: { user_email: normalizedEmail } });
    if (existing && existing.user_role === "SUPER_ADMIN") {
      return res.status(409).json({ success: false, message: "This email cannot be invited." });
    }
    if (existing && existing.tenant_fk && existing.tenant_fk !== req.user.tenantFk) {
      return res.status(409).json({ success: false, message: "This email cannot be invited." });
    }
    if (existing && existing.user_password && existing.user_status) {
      return res.status(409).json({ success: false, message: "This person is already an employee." });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { tenant_id: req.user.tenantFk },
    });

    let user;
    let inviteResult;
    await prisma.$transaction(async (tx) => {
      user = existing
        ? await tx.user.update({
            where: { user_id: existing.user_id },
            data: {
              user_name: name || existing.user_name,
              user_role: role,
              user_department: department,
              user_module_access: serializeModuleAccess(moduleCheck.modules),
              tenant_fk: req.user.tenantFk,
            },
          })
        : await tx.user.create({
            data: {
              user_name: name || normalizedEmail.split("@")[0],
              user_email: normalizedEmail,
              user_password: null,
              user_status: false,
              user_role: role,
              user_department: department,
              user_module_access: serializeModuleAccess(moduleCheck.modules),
              tenant_fk: req.user.tenantFk,
            },
          });

      inviteResult = await createInvitation({
        tenantFk: req.user.tenantFk,
        email: normalizedEmail,
        role,
        source: "tenant_admin",
        invitedBy: req.user.id,
        reusePending: false,
        tx,
      });
    });

    const delivery = await deliver({
      email: normalizedEmail,
      name: name || user.user_name,
      organizationName: tenant?.tenant_name,
      token: inviteResult.token,
      warnings,
    });

    return res.status(201).json({
      success: true,
      message: "Invitation created. The employee will receive a link to set their password.",
      data: { userId: user.user_id, email: user.user_email, ...delivery },
      warnings,
    });
  } catch (error) {
    console.error("Error inviting employee:", error);
    return res.status(500).json({ success: false, message: "Could not create the invitation." });
  }
};

export const resendEmployeeInvitation = async (req, res) => {
  const { userId } = req.params;
  const warnings = [];
  try {
    const user = await prisma.user.findFirst({
      where: { user_id: userId, tenant_fk: req.user.tenantFk },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    if (user.user_password) {
      return res.status(409).json({ success: false, message: "This employee has already activated their account." });
    }

    const existingInvite = await prisma.invitation.findFirst({
      where: { tenant_fk: req.user.tenantFk, invitation_email: user.user_email },
      orderBy: { created_at: "desc" },
    });

    const result = existingInvite
      ? await reissueInvitation({ invitationId: existingInvite.invitation_id, tenantFk: req.user.tenantFk })
      : await createInvitation({
          tenantFk: req.user.tenantFk,
          email: user.user_email,
          role: user.user_role,
          source: "tenant_admin",
          invitedBy: req.user.id,
          reusePending: false,
        });

    if (!result) {
      return res.status(404).json({ success: false, message: "Invitation not found." });
    }

    const tenant = await prisma.tenant.findUnique({ where: { tenant_id: req.user.tenantFk } });
    const delivery = await deliver({
      email: user.user_email,
      name: user.user_name,
      organizationName: tenant?.tenant_name,
      token: result.token,
      warnings,
    });

    return res.status(200).json({
      success: true,
      message: "Invitation resent.",
      data: delivery,
      warnings,
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return res.status(500).json({ success: false, message: "Could not resend the invitation." });
  }
};

export const updateEmployee = async (req, res) => {
  const { userId } = req.params;
  const { user_name, user_role, user_department, user_status, modules } = req.body || {};

  if (user_role !== undefined && !isClientRole(user_role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Client users cannot be granted platform roles.",
    });
  }
  const moduleCheck = validateModules(modules);
  if (!moduleCheck.ok) {
    return res.status(400).json({ success: false, message: moduleCheck.message });
  }

  try {
    const target = await prisma.user.findFirst({
      where: { user_id: userId, tenant_fk: req.user.tenantFk },
    });
    if (!target) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    if (target.user_id === req.user.id && user_status === false) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
    }
    if (target.user_id === req.user.id && user_role && user_role !== target.user_role) {
      return res.status(400).json({ success: false, message: "You cannot change your own role." });
    }
    if (target.user_is_tenant_owner && user_role && user_role !== "ADMIN") {
      return res.status(400).json({ success: false, message: "The organization owner must remain an administrator." });
    }

    const data = {};
    if (user_name !== undefined) data.user_name = user_name;
    if (user_role !== undefined) data.user_role = user_role;
    if (user_department !== undefined) data.user_department = user_department;
    if (user_status !== undefined) data.user_status = Boolean(user_status);
    // The owner always keeps full module access.
    if (modules !== undefined && !target.user_is_tenant_owner) {
      data.user_module_access = serializeModuleAccess(moduleCheck.modules);
    }

    const updated = await prisma.user.update({ where: { user_id: userId }, data });

    if (user_status === false) {
      await prisma.invitation.updateMany({
        where: { tenant_fk: req.user.tenantFk, invitation_email: target.user_email, invitation_status: "PENDING" },
        data: { invitation_status: "REVOKED" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated.",
      data: {
        user_id: updated.user_id,
        user_name: updated.user_name,
        user_email: updated.user_email,
        user_role: updated.user_role,
        user_department: updated.user_department,
        user_status: updated.user_status,
        user_is_tenant_owner: updated.user_is_tenant_owner,
        modules: parseModuleAccess(updated.user_module_access),
      },
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    return res.status(500).json({ success: false, message: "Could not update the employee." });
  }
};
