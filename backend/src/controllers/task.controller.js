import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";
import { isEmployee } from "../lib/roles.js";
import {
  assertEmployeeTaskPatch,
  canAssignTaskTo,
  canTransition,
  canUpdateTaskProgress,
  canViewTask,
  isTaskPriority,
  isTaskStatus,
  validateProgress,
} from "../lib/tasks.js";

const TASK_INCLUDE = {
  user: { select: { user_id: true, user_name: true, user_role: true } },
  task_assigned_by: { select: { user_id: true, user_name: true } },
  task_updates: {
    orderBy: { created_at: "desc" },
    take: 50,
    include: { user: { select: { user_id: true, user_name: true } } },
  },
};

const resolveTenantId = (req) => {
  if (req.user.role === "SUPER_ADMIN") return req.body.tenant_fk || null;
  return req.user.tenantFk;
};

const findTenantUser = (userId, tenantId) =>
  prisma.user.findFirst({
    where: {
      user_id: userId,
      tenant_fk: tenantId,
      user_deleted_at: null,
    },
    select: {
      user_id: true,
      user_name: true,
      user_role: true,
      user_is_tenant_owner: true,
    },
  });

const assertRelatedRecord = async (model, id, tenantId, label) => {
  if (!id) return { ok: true };
  const record = await prisma[model].findFirst({
    where: { [model === "contact" ? "contact_id" : "call_id"]: id, tenant_fk: tenantId },
    select: { [model === "contact" ? "contact_id" : "call_id"]: true },
  });
  return record ? { ok: true } : { ok: false, message: `The linked ${label} does not belong to this organization.` };
};

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
      task_start_date,
      task_status,
    } = req.body;

    if (!String(task_subject || "").trim()) {
      return res.status(400).json({ success: false, message: "Task subject is required." });
    }
    if (task_priority !== undefined && !isTaskPriority(task_priority)) {
      return res.status(400).json({ success: false, message: "Invalid task priority." });
    }
    if (task_status !== undefined && !isTaskStatus(task_status)) {
      return res.status(400).json({ success: false, message: "Invalid task status." });
    }
    const progressCheck = validateProgress(req.body.task_progress ?? 0);
    if (!progressCheck.ok) {
      return res.status(400).json({ success: false, message: progressCheck.message });
    }

    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "No tenant context. Client users are auto-assigned; superadmin must provide tenant_fk.",
      });
    }

    const assigneeId = task_user_fk || req.user.id;
    const target = await findTenantUser(assigneeId, tenantId);
    if (!target) {
      return res.status(400).json({ success: false, message: "The assignee does not belong to this organization." });
    }
    if (!canAssignTaskTo(req.user, target)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to assign a task to this person.",
      });
    }

    const contactCheck = await assertRelatedRecord("contact", task_contact_fk, tenantId, "contact");
    if (!contactCheck.ok) return res.status(400).json({ success: false, message: contactCheck.message });
    const callCheck = await assertRelatedRecord("call", task_call_fk, tenantId, "call");
    if (!callCheck.ok) return res.status(400).json({ success: false, message: callCheck.message });

    const newTask = await prisma.task.create({
      data: {
        tenant_fk: tenantId,
        task_user_fk: target.user_id,
        task_assigned_by_fk: req.user.id,
        task_call_fk: task_call_fk || null,
        task_contact_fk: task_contact_fk || null,
        task_subject: String(task_subject).trim(),
        task_description: task_description || null,
        task_priority: task_priority || "NORMAL",
        task_status: task_status || "TODO",
        task_progress: progressCheck.value ?? 0,
        task_start_date: task_start_date ? new Date(task_start_date) : null,
        task_due_date: task_due_date ? new Date(task_due_date) : null,
        task_completed_at: task_status === "COMPLETED" ? new Date() : null,
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
    const { user_id, assigned_to, call_id, contact_id, status, page = 1, limit = 20, search = "" } = req.query;
    const take = Math.max(1, Number(limit) || 20);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const where = { task_deleted_at: null, ...getTenantFilter(req) };

    if (isEmployee(req.user)) {
      // Employees only ever receive their own work, regardless of query string.
      where.task_user_fk = req.user.id;
    } else if (assigned_to) {
      where.task_user_fk = assigned_to;
    } else if (user_id) {
      where.task_user_fk = user_id;
    }

    if (call_id) where.task_call_fk = call_id;
    if (contact_id) where.task_contact_fk = contact_id;
    if (status) {
      if (!isTaskStatus(status)) {
        return res.status(400).json({ success: false, message: "Invalid task status filter." });
      }
      where.task_status = status;
    }
    if (search) where.task_subject = { contains: search };

    const [tasks, totalRecords] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { user_id: true, user_name: true } },
          task_assigned_by: { select: { user_id: true, user_name: true } },
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

    const task = await prisma.task.findFirst({
      where: { task_id: id, ...getTenantFilter(req) },
      include: TASK_INCLUDE,
    });

    if (!task || task.task_deleted_at) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (!canViewTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "You can only view tasks assigned to you." });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ success: false, message: "Failed to fetch task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findFirst({
      where: { task_id: id, task_deleted_at: null, ...getTenantFilter(req) },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const employee = isEmployee(req.user);
    const data = {};
    let note = null;

    if (employee) {
      if (!canUpdateTaskProgress(req.user, existing)) {
        return res.status(403).json({ success: false, message: "You can only update tasks assigned to you." });
      }
      const guard = assertEmployeeTaskPatch(req.body);
      if (!guard.ok) return res.status(403).json({ success: false, message: guard.message });
      note = req.body.note !== undefined ? String(req.body.note || "").trim() || null : null;
    } else {
      for (const field of ["task_subject", "task_description", "task_priority", "task_contact_fk", "task_call_fk"]) {
        if (req.body[field] !== undefined) {
          data[field] = req.body[field] === "" ? null : req.body[field];
        }
      }
      if (data.task_priority != null && !isTaskPriority(data.task_priority)) {
        return res.status(400).json({ success: false, message: "Invalid task priority." });
      }
      if (req.body.task_due_date !== undefined) {
        data.task_due_date = req.body.task_due_date ? new Date(req.body.task_due_date) : null;
      }
      if (req.body.task_start_date !== undefined) {
        data.task_start_date = req.body.task_start_date ? new Date(req.body.task_start_date) : null;
      }
      if (req.body.task_user_fk !== undefined) {
        const target = await findTenantUser(req.body.task_user_fk || req.user.id, existing.tenant_fk);
        if (!target) {
          return res.status(400).json({ success: false, message: "The assignee does not belong to this organization." });
        }
        if (!canAssignTaskTo(req.user, target)) {
          return res.status(403).json({ success: false, message: "You are not allowed to assign a task to this person." });
        }
        data.task_user_fk = target.user_id;
      } else if (req.user.orgRole === "ORG_ADMIN") {
        const currentAssignee = existing.task_user_fk
          ? await findTenantUser(existing.task_user_fk, existing.tenant_fk)
          : null;
        if (currentAssignee && !canAssignTaskTo(req.user, currentAssignee)) {
          return res.status(403).json({
            success: false,
            message: "Admins can only manage tasks assigned to employees.",
          });
        }
      }
      if (data.task_contact_fk) {
        const check = await assertRelatedRecord("contact", data.task_contact_fk, existing.tenant_fk, "contact");
        if (!check.ok) return res.status(400).json({ success: false, message: check.message });
      }
      if (data.task_call_fk) {
        const check = await assertRelatedRecord("call", data.task_call_fk, existing.tenant_fk, "call");
        if (!check.ok) return res.status(400).json({ success: false, message: check.message });
      }
      note = req.body.note !== undefined ? String(req.body.note || "").trim() || null : null;
    }

    if (req.body.task_progress !== undefined) {
      const progressCheck = validateProgress(req.body.task_progress);
      if (!progressCheck.ok) {
        return res.status(400).json({ success: false, message: progressCheck.message });
      }
      data.task_progress = progressCheck.value;
    }

    if (req.body.task_status !== undefined) {
      if (!isTaskStatus(req.body.task_status)) {
        return res.status(400).json({ success: false, message: "Invalid task status." });
      }
      if (employee && !canTransition(existing.task_status, req.body.task_status)) {
        return res.status(400).json({
          success: false,
          message: `You cannot move a task from ${existing.task_status} to ${req.body.task_status}.`,
        });
      }
      data.task_status = req.body.task_status;
      if (req.body.task_status === "COMPLETED") {
        data.task_completed_at = existing.task_completed_at || new Date();
      } else {
        data.task_completed_at = null;
      }
    }

    const nextStatus = data.task_status ?? existing.task_status;
    const nextProgress = data.task_progress ?? existing.task_progress;
    const statusChanged = nextStatus !== existing.task_status;
    const progressChanged = nextProgress !== existing.task_progress;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({ where: { task_id: id }, data });
      if (statusChanged || progressChanged || note) {
        await tx.task_update.create({
          data: {
            tenant_fk: existing.tenant_fk,
            task_fk: id,
            user_fk: req.user.id,
            previous_status: existing.task_status,
            new_status: nextStatus,
            previous_progress: existing.task_progress,
            new_progress: nextProgress,
            note,
          },
        });
      }
      return updated;
    });

    const withRelations = await prisma.task.findUnique({ where: { task_id: updatedTask.task_id }, include: TASK_INCLUDE });
    res.status(200).json({ success: true, message: "Task updated", ...withRelations, data: withRelations });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (isEmployee(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only an organization administrator can delete tasks.",
      });
    }

    const existing = await prisma.task.findFirst({
      where: { task_id: id, task_deleted_at: null, ...getTenantFilter(req) },
      select: { task_id: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Soft delete, tenant scoped.
    await prisma.task.update({
      where: { task_id: existing.task_id },
      data: { task_deleted_at: new Date() },
    });

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};
