import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";

export const createCall = async (req, res) => {
  try {
    const { call_contact_fk, call_subject, call_description } = req.body;

    // Resolve tenant: client users always use their own tenant; superadmin may specify one
    let tenantId = req.user.tenantFk;
    if (req.user.role === "SUPER_ADMIN" && req.body.tenant_fk) {
      tenantId = req.body.tenant_fk;
    }
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "No tenant context. Client users are auto-assigned; superadmin must provide tenant_fk.",
      });
    }

    // Attribute the call to the signed-in user; only platform superadmins may
    // log on behalf of someone else.
    const callUserId =
      req.user.role === "SUPER_ADMIN" && req.body.call_user_fk
        ? req.body.call_user_fk
        : req.user.id;

    // A call may only link to a contact inside the same organization.
    if (call_contact_fk) {
      const contact = await prisma.contact.findFirst({
        where: { contact_id: call_contact_fk, tenant_fk: tenantId, contact_deleted_at: null },
        select: { contact_id: true },
      });
      if (!contact) {
        return res.status(400).json({ success: false, error: "Contact not found in this organization" });
      }
    }

    const newCall = await prisma.call.create({
      data: {
        tenant_fk: tenantId,
        call_user_fk: callUserId,
        call_contact_fk,
        call_subject,
        call_description,
      },
    });

    res.status(201).json(newCall);
  } catch (error) {
    console.error("Error creating call:", error);
    res.status(500).json({ error: "Failed to create call" });
  }
};

export const getCalls = async (req, res) => {
  try {
    const { contact_id } = req.query;

    const query = {
      where: { call_deleted_at: null, ...getTenantFilter(req) },
      include: {
        user: { select: { user_id: true, user_name: true } },
      },
      orderBy: { call_created_at: "desc" },
    };

    if (contact_id) {
      query.where.call_contact_fk = contact_id;
    }

    const calls = await prisma.call.findMany(query);
    res.status(200).json(calls);
  } catch (error) {
    console.error("Error fetching calls:", error);
    res.status(500).json({ error: "Failed to fetch calls" });
  }
};

export const getCallById = async (req, res) => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findUnique({
      where: { call_id: id, ...getTenantFilter(req) },
      include: {
        user: { select: { user_id: true, user_name: true } },
        contact: { select: { contact_id: true, contact_firstname: true, contact_lastname: true } },
        call_tasks: true,
      },
    });

    if (!call || call.call_deleted_at) {
      return res.status(404).json({ error: "Call not found" });
    }

    res.status(200).json(call);
  } catch (error) {
    console.error("Error fetching call:", error);
    res.status(500).json({ error: "Failed to fetch call" });
  }
};

export const updateCall = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCall = await prisma.call.update({
      where: { call_id: id, ...getTenantFilter(req) },
      data: updateData,
    });

    res.status(200).json(updatedCall);
  } catch (error) {
    console.error("Error updating call:", error);
    res.status(500).json({ error: "Failed to update call" });
  }
};

export const deleteCall = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.call.update({
      where: { call_id: id, ...getTenantFilter(req) },
      data: { call_deleted_at: new Date() },
    });

    res.status(200).json({ message: "Call deleted successfully" });
  } catch (error) {
    console.error("Error deleting call:", error);
    res.status(500).json({ error: "Failed to delete call" });
  }
};
