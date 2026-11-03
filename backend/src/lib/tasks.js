import { getOrgRole, isEmployee, isOrgAdmin, isPlatformAdmin } from "./roles.js";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"];
export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH"];

export const isTaskStatus = (value) => TASK_STATUSES.includes(value);
export const isTaskPriority = (value) => TASK_PRIORITIES.includes(value);

/** Progress must be a whole number between 0 and 100. */
export const validateProgress = (value) => {
  if (value === undefined) return { ok: true };
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 100) {
    return { ok: false, message: "Progress must be a whole number between 0 and 100." };
  }
  return { ok: true, value: number };
};

export const TASK_TRANSITIONS = {
  TODO: ["IN_PROGRESS", "BLOCKED", "COMPLETED"],
  IN_PROGRESS: ["TODO", "BLOCKED", "COMPLETED"],
  BLOCKED: ["TODO", "IN_PROGRESS"],
  COMPLETED: ["IN_PROGRESS"],
};

export const canTransition = (from, to) => {
  if (!isTaskStatus(to)) return false;
  if (!from) return true;
  if (from === to) return true;
  return (TASK_TRANSITIONS[from] || []).includes(to);
};

/** Employee may only change their own work state, never the assignment. */
export const EMPLOYEE_TASK_FIELDS = ["task_status", "task_progress", "note"];

const userIdOf = (user) => user?.id ?? user?.user_id ?? null;

export const isTaskAssignee = (user, task) =>
  Boolean(userIdOf(user) && task?.task_user_fk && userIdOf(user) === task.task_user_fk);

export const canViewTask = (user, task) => {
  if (!user || !task) return false;
  if (isOrgAdmin(user) || isPlatformAdmin(user)) return true;
  return isTaskAssignee(user, task);
};

export const canUpdateTaskProgress = (user, task) => {
  if (!user || !task) return false;
  if (isOrgAdmin(user) || isPlatformAdmin(user)) return true;
  return isTaskAssignee(user, task);
};

/**
 * Admin assigns to employees, the organization owner assigns to admins and
 * employees, and an employee can only create work for themselves.
 */
export const canAssignTaskTo = (actor, target) => {
  if (!actor || !target) return false;
  const actorRole = getOrgRole(actor);
  if (actorRole === "ORG_SUPER_ADMIN" || actorRole === "PLATFORM_SUPERADMIN") return true;
  if (actorRole === "ORG_ADMIN") return isEmployee(target);
  return userIdOf(actor) === userIdOf(target);
};

/** Fields an employee may send when updating a task they own. */
export const assertEmployeeTaskPatch = (body = {}) => {
  const protectedFields = [
    "task_user_fk",
    "task_assigned_by_fk",
    "task_subject",
    "task_description",
    "task_priority",
    "task_due_date",
    "task_start_date",
    "task_contact_fk",
    "task_call_fk",
  ];
  const blocked = protectedFields.filter((field) => body[field] !== undefined);
  if (blocked.length) {
    return {
      ok: false,
      message: "You can only update the status, progress and work notes of your own tasks.",
    };
  }
  return { ok: true };
};
