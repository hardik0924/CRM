import { prisma } from "../lib/prisma.js";
import { CLIENT_ROLES } from "../lib/onboarding.logic.js";
import { hashPassword } from "../lib/passwords.js";
import { upsertCrmEntitlement } from "../services/entitlement.service.js";

const tenantInclude = {
  tenant_entitlements: {
    where: { app_code: "CRM" },
    select: {
      entitlement_status: true,
      external_subscription_ref: true,
      effective_end: true,
      last_synced_at: true,
    },
  },
};

export const getTenants = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = search
      ? {
          OR: [
            { tenant_name: { contains: search } },
            { tenant_code: { contains: search } },
          ],
        }
      : {};

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { tenant_created_at: "desc" },
        include: {
          ...tenantInclude,
          _count: {
            select: { tenant_users: true, tenant_accounts: true },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: tenants,
      pagination: {
        totalRecords: total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / take),
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const createTenant = async (req, res) => {
  try {
    const { tenant_name, tenant_code, tenant_plan } = req.body;

    if (!tenant_name || !tenant_code) {
      return res.status(400).json({
        success: false,
        message: "Tenant name and code are required",
      });
    }

    const existing = await prisma.tenant.findUnique({
      where: { tenant_code },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A client with this code already exists",
      });
    }

    const tenant = await prisma.$transaction(async (tx) => {
      const row = await tx.tenant.create({
        data: {
          tenant_name,
          tenant_code,
          tenant_plan: tenant_plan || "STARTER",
          tenant_sync_status: "INTERNAL_MANUAL",
        },
      });
      // Internal support creation still needs a valid entitlement.
      await upsertCrmEntitlement(
        { tenantFk: row.tenant_id, status: "ACTIVE" },
        tx
      );
      return row;
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_name, tenant_status, tenant_plan, tenant_code } = req.body;

    if (tenant_code) {
      const clash = await prisma.tenant.findUnique({ where: { tenant_code } });
      if (clash && clash.tenant_id !== id) {
        return res.status(409).json({
          success: false,
          message: "A client with this code already exists",
        });
      }
    }

    const dataToUpdate = {};
    if (tenant_name !== undefined) dataToUpdate.tenant_name = tenant_name;
    if (tenant_status !== undefined) dataToUpdate.tenant_status = tenant_status;
    if (tenant_plan !== undefined) dataToUpdate.tenant_plan = tenant_plan;
    if (tenant_code !== undefined) dataToUpdate.tenant_code = tenant_code;

    const tenant = await prisma.tenant.update({
      where: { tenant_id: id },
      data: dataToUpdate,
    });

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Error updating tenant:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const counts = await prisma.tenant.findUnique({
      where: { tenant_id: id },
      include: {
        _count: { select: { tenant_users: true, tenant_accounts: true } },
      },
    });

    if (!counts) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    if (counts._count.tenant_users > 0 || counts._count.tenant_accounts > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This client still has users or CRM data. Remove them first, or set the client to Inactive.",
      });
    }

    await prisma.tenant.delete({ where: { tenant_id: id } });

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { tenant_id: id },
      include: {
        ...tenantInclude,
        _count: {
          select: { tenant_users: true, tenant_accounts: true, tenant_invitations: true },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getTenantUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await prisma.user.findMany({
      where: { tenant_fk: id },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
        user_role: true,
        user_department: true,
        user_status: true,
        user_is_tenant_owner: true,
        tenant_fk: true,
      },
      orderBy: { user_created_at: "desc" },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching tenant users:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const createTenantUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_name, user_email, user_password, user_role, user_department, user_status } = req.body;

    if (!user_name || !user_email || !user_password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (!CLIENT_ROLES.includes(user_role || "ADMIN")) {
      return res.status(400).json({ success: false, message: "Invalid role for a client user" });
    }

    const tenant = await prisma.tenant.findUnique({ where: { tenant_id: id } });
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const existing = await prisma.user.findUnique({ where: { user_email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "A user with this email already exists" });
    }

    const role = user_role || "ADMIN";
    const tenantHasOwner = await prisma.user.findFirst({
      where: { tenant_fk: id, OR: [{ user_is_tenant_owner: true }, { user_role: "ADMIN" }] },
      select: { user_id: true },
    });

    const user = await prisma.user.create({
      data: {
        user_name,
        user_email,
        user_password: await hashPassword(user_password),
        user_role: role,
        user_department: user_department || "SALES",
        user_status: user_status === undefined ? true : Boolean(user_status),
        user_is_tenant_owner: role === "ADMIN" && !tenantHasOwner,
        tenant_fk: id,
      },
    });

    res.status(201).json({ success: true, message: "User created successfully", data: user });
  } catch (error) {
    console.error("Error creating tenant user:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const updateTenantUser = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { user_name, user_email, user_password, user_role, user_department, user_status } = req.body;

    const target = await prisma.user.findFirst({ where: { user_id: userId, tenant_fk: id } });
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found for this client" });
    }

    if (user_role && !CLIENT_ROLES.includes(user_role)) {
      return res.status(400).json({ success: false, message: "Invalid role for a client user" });
    }

    if (user_email && user_email !== target.user_email) {
      const existing = await prisma.user.findUnique({ where: { user_email } });
      if (existing) {
        return res.status(409).json({ success: false, message: "A user with this email already exists" });
      }
    }

    const data = {};
    if (user_name !== undefined) data.user_name = user_name;
    if (user_email !== undefined) data.user_email = user_email;
    if (user_role !== undefined) data.user_role = user_role;
    if (user_department !== undefined) data.user_department = user_department;
    if (user_status !== undefined) data.user_status = Boolean(user_status);
    if (user_password) data.user_password = await hashPassword(user_password);

    const user = await prisma.user.update({ where: { user_id: userId }, data });

    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    console.error("Error updating tenant user:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const deleteTenantUser = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const target = await prisma.user.findFirst({ where: { user_id: userId, tenant_fk: id } });
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found for this client" });
    }

    await prisma.user.delete({ where: { user_id: userId } });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant user:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
