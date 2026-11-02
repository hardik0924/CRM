import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";

export const createTask = async (req, res) => {
  try {
    const { task_user_fk, task_call_fk, task_subject, task_description, task_priority, task_due_date } = req.body;

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
        task_user_fk,
        task_call_fk,
        task_subject,
        task_description,
        task_priority,
        task_due_date,
      },
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { user_id, call_id } = req.query;

    const query = {
      where: { task_deleted_at: null, ...getTenantFilter(req) },
      include: {
        user: { select: { user_id: true, user_name: true } },
      },
      orderBy: { task_created_at: "desc" },
    };

    if (user_id) {
      query.where.task_user_fk = user_id;
    }
    if (call_id) {
      query.where.task_call_fk = call_id;
    }

    const tasks = await prisma.task.findMany(query);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
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

    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTask = await prisma.task.update({
      where: { task_id: id, ...getTenantFilter(req) },
      data: updateData,
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
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

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};
