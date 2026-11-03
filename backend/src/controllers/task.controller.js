import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";

export const createTask = async (req, res) => {
  try {
    const {
      task_user_fk,
      task_call_fk,
      task_contact_fk,
      task_subject,
      task_description,
      task_priority,
      task_due_date,
    } = req.body;

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

    const newTask = await prisma.task.create({
      data: {
        tenant_fk: tenantId,
        task_user_fk: task_user_fk || null,
        task_call_fk: task_call_fk || null,
        task_contact_fk: task_contact_fk || null,
        task_subject,
        task_description,
        task_priority: task_priority || "NORMAL",
        task_due_date: task_due_date ? new Date(task_due_date) : null,
      },
    });

    res.status(201).json({ success: true, message: "Task created", ...newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { user_id, call_id, contact_id, page = 1, limit = 20, search = "" } = req.query;
    const take = Math.max(1, Number(limit) || 20);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const where = { task_deleted_at: null, ...getTenantFilter(req) };
    if (user_id) where.task_user_fk = user_id;
    if (call_id) where.task_call_fk = call_id;
    if (contact_id) where.task_contact_fk = contact_id;
    if (search) where.task_subject = { contains: search };

    const [tasks, totalRecords] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { user_id: true, user_name: true } },
        },
        orderBy: { task_created_at: "desc" },
      }),
      prisma.task.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / take),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { task_id: id, ...getTenantFilter(req) },
      include: {
        user: { select: { user_id: true, user_name: true } },
        call: true,
      },
    });

    if (!task || task.task_deleted_at) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    // Allow-list fields so a browser cannot move a task to another tenant.
    const data = {};
    for (const field of [
      "task_user_fk",
      "task_call_fk",
      "task_contact_fk",
      "task_subject",
      "task_description",
      "task_priority",
    ]) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field] === "" ? null : req.body[field];
      }
    }
    if (req.body.task_due_date !== undefined) {
      data.task_due_date = req.body.task_due_date ? new Date(req.body.task_due_date) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { task_id: id, ...getTenantFilter(req) },
      data,
    });

    res.status(200).json({ success: true, message: "Task updated", ...updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    await prisma.task.update({
      where: { task_id: id, ...getTenantFilter(req) },
      data: { task_deleted_at: new Date() },
    });

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};
