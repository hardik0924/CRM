import { prisma } from "../lib/prisma.js";
import { checkCrmAccess } from "../services/entitlement.service.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { user_email: email },
    include: { tenant: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Invited users have no password until they accept their invitation.
  if (!user.user_password) {
    return res.status(403).json({
      success: false,
      message: "This account has not been activated yet. Open your invitation link to set a password.",
    });
  }

  if (!user.user_status) {
    return res.status(401).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
    });
  }

  // Simple password check (plaintext match for dev; hash in production)
  if (user.user_password !== password) {
    return res.status(401).json({
      success: false,
      message: "Invalid password",
    });
  }

  // Superadmin can log in without a tenant; client users must belong to a tenant
  if (user.user_role !== "SUPER_ADMIN" && !user.tenant_fk) {
    return res.status(403).json({
      success: false,
      message: "Your account is not assigned to any client. Contact your superadmin.",
    });
  }

  // Fail closed when CRM entitlement is missing, suspended, expired or revoked.
  const access = await checkCrmAccess(user);
  if (!access.allowed) {
    return res.status(403).json({
      success: false,
      message:
        access.reason === "entitlement_unknown"
          ? "CRM access is not available for your organization. Contact your provider."
          : "CRM access is currently suspended for your organization.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user.user_id,
      name: user.user_name,
      email: user.user_email,
      role: user.user_role,
      department: user.user_department,
      isTenantOwner: Boolean(user.user_is_tenant_owner),
      tenantId: user.tenant_fk || null,
      tenantName: user.tenant?.tenant_name || null,
      tenantCode: user.tenant?.tenant_code || null,
    },
  });
};
