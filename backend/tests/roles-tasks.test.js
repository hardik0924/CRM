import test from "node:test";
import assert from "node:assert/strict";
import { getOrgRole, isEmployee } from "../src/lib/roles.js";
import {
  canAccessModule,
  canDoAction,
  parseModuleGrants,
  serializeModuleGrants,
  validateGrants,
} from "../src/lib/modules.js";
import {
  assertEmployeeTaskPatch,
  canAssignTaskTo,
  canTransition,
  canUpdateTaskProgress,
  validateProgress,
} from "../src/lib/tasks.js";

const owner = { user_id: "u-owner", user_role: "ADMIN", user_is_tenant_owner: true };
const admin = { user_id: "u-admin", user_role: "ADMIN", user_is_tenant_owner: false };
const employee = { user_id: "u-emp", user_role: "SALES", user_is_tenant_owner: false };
const platform = { user_id: "u-super", user_role: "SUPER_ADMIN", user_is_tenant_owner: false };

test("organization roles are derived from the existing user columns", () => {
  assert.equal(getOrgRole(owner), "ORG_SUPER_ADMIN");
  assert.equal(getOrgRole(admin), "ORG_ADMIN");
  assert.equal(getOrgRole(employee), "EMPLOYEE");
  assert.equal(getOrgRole(platform), "PLATFORM_SUPERADMIN");
  assert.equal(isEmployee(employee), true);
  assert.equal(isEmployee(admin), false);
});

test("module grants understand null, legacy csv and explicit actions", () => {
  assert.deepEqual(parseModuleGrants(null), { modules: null, permissions: null });
  assert.deepEqual(parseModuleGrants(""), { modules: [], permissions: {} });
  assert.deepEqual(parseModuleGrants("CONTACTS,TASKS").modules, ["CONTACTS", "TASKS"]);
  assert.deepEqual(parseModuleGrants("CONTACTS:VIEW,EDIT|TASKS:VIEW"), {
    modules: ["CONTACTS", "TASKS"],
    permissions: {
      CONTACTS: ["VIEW", "EDIT"],
      TASKS: ["VIEW"],
    },
  });
});

test("grants round-trip and reject unknown modules or actions", () => {
  assert.equal(
    serializeModuleGrants(["TASKS", "CONTACTS"], { TASKS: ["VIEW"], CONTACTS: ["VIEW", "EDIT"] }),
    "TASKS:VIEW|CONTACTS:VIEW,EDIT"
  );
  assert.equal(validateGrants(["NOPE"]).ok, false);
  assert.equal(validateGrants(["TASKS"], { TASKS: ["FLY"] }).ok, false);
  assert.equal(validateGrants(["TASKS"], { TASKS: ["VIEW"] }).permissions.TASKS.join(","), "VIEW");
});

test("employees are restricted by module and action, admins and the owner are not", () => {
  const restricted = {
    ...employee,
    modules: ["TASKS"],
    moduleActions: { TASKS: ["VIEW"] },
  };
  assert.equal(canAccessModule(restricted, "TASKS"), true);
  assert.equal(canAccessModule(restricted, "CONTACTS"), false);
  assert.equal(canDoAction(restricted, "TASKS", "VIEW"), true);
  assert.equal(canDoAction(restricted, "TASKS", "EDIT"), false);
  assert.equal(canDoAction(admin, "CONTACTS", "DELETE"), true);
  assert.equal(canDoAction({ ...owner, orgRole: "ORG_SUPER_ADMIN" }, "CAMPAIGNS", "DELETE"), true);
});

test("progress is a whole number between 0 and 100", () => {
  assert.equal(validateProgress(undefined).ok, true);
  assert.equal(validateProgress(0).ok, true);
  assert.equal(validateProgress(100).ok, true);
  assert.equal(validateProgress(101).ok, false);
  assert.equal(validateProgress(-1).ok, false);
  assert.equal(validateProgress(12.5).ok, false);
});

test("employee status transitions follow the workflow", () => {
  assert.equal(canTransition("TODO", "IN_PROGRESS"), true);
  assert.equal(canTransition("TODO", "COMPLETED"), true);
  assert.equal(canTransition("BLOCKED", "COMPLETED"), false);
  assert.equal(canTransition("COMPLETED", "IN_PROGRESS"), true);
  assert.equal(canTransition("IN_PROGRESS", "IN_PROGRESS"), true);
});

test("task assignment follows the role hierarchy", () => {
  assert.equal(canAssignTaskTo(owner, admin), true);
  assert.equal(canAssignTaskTo(owner, employee), true);
  assert.equal(canAssignTaskTo(admin, employee), true);
  assert.equal(canAssignTaskTo(admin, admin), false);
  assert.equal(canAssignTaskTo(employee, employee), true);
  assert.equal(canAssignTaskTo(employee, { user_id: "u-other", user_role: "SALES" }), false);
});

test("employees cannot change assignment fields through the API", () => {
  const task = { task_user_fk: employee.user_id };
  assert.equal(assertEmployeeTaskPatch({ task_progress: 50 }).ok, true);
  assert.equal(assertEmployeeTaskPatch({ task_status: "IN_PROGRESS", note: "started" }).ok, true);
  assert.equal(assertEmployeeTaskPatch({ task_priority: "HIGH" }).ok, false);
  assert.equal(assertEmployeeTaskPatch({ task_user_fk: "u-other" }).ok, false);
  assert.equal(assertEmployeeTaskPatch({ task_due_date: "2026-01-01" }).ok, false);

  assert.equal(canUpdateTaskProgress(employee, task), true);
  assert.equal(canUpdateTaskProgress(admin, task), true);
  assert.equal(canUpdateTaskProgress(employee, { task_user_fk: "u-other" }), false);
});
