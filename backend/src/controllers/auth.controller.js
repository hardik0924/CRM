import { prisma } from "../lib/prisma.js";

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

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user.user_id,
      name: user.user_name,
      email: user.user_email,
      role: user.user_role,
      department: user.user_department,
      tenantId: user.tenant_fk || null,
      tenantName: user.tenant?.tenant_name || null,
      tenantCode: user.tenant?.tenant_code || null,
    },
  });
};
