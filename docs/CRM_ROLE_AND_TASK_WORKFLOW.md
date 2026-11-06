# CRM Roles, Employee Management and Task Workflow

This document records the implementation that is currently in the repository and
the incremental changes made for the three organizational roles and the employee
task/progress workflow. It is a working record, not a proposal.

## 1. Architecture found during the audit

| Area | Current implementation |
| --- | --- |
| Frontend | React 19 + Vite, React Router (`frontend/src/App.jsx`), Tailwind v4 tokens in `frontend/src/index.css` |
| Backend | Node + Express 5 (`backend/src/app.js`), controllers + routes, no service layer for CRM CRUD |
| ORM / DB | Prisma 7 with MariaDB adapter, MySQL database `crm` |
| Auth | `POST /api/auth/login` (email + password) returns a signed bearer token; every protected request sends `Authorization: Bearer <token>`; `authMiddleware` verifies the token and reloads the user from the database on every call |
| Tenant isolation | `tenant_fk` on every CRM table + `getTenantFilter(req)`; browser supplied tenant ids are ignored for client users |
| Platform admin | `user_role = SUPER_ADMIN`, no tenant, `/superadmin` portal, `/api/tenants` (`superadminOnly`) |
| Client roles | `user_role = ADMIN` for organization admin; `USER`/`SALES`/`DATA`/`PRODUCTION`/`SPONSORSHIP`/`OPERATION` for employees; `user_is_tenant_owner` marks the client organization owner |
| Module access | `user.user_module_access` CSV of module codes; `requireModule()` on routes; `ModuleGuard`/`hasModule()` in the UI |
| Entitlement | `organization_app_entitlement` per tenant, fail-closed in `authMiddleware` and login |
| Invitations | `invitation` table with hashed single-use tokens (`invitation.service.js`), used by the client Team page |
| Tasks | `task` table with subject, description, priority, due date, assignee, optional contact/call links; no status, progress or history |
| Tests | `node --test` in `backend/tests` (pure logic + one DB test gated by `RUN_DB_TESTS=1`) |
| Build | `npx vite build` in `frontend` |

Important separation that is preserved:

* **VSPH platform SUPER_ADMIN** (`role = SUPER_ADMIN`, no tenant) provisions and
  supports clients through `/superadmin` and `/api/tenants`.
* **CRM Organization Super Admin** is the existing `user_is_tenant_owner` user of
  a tenant. It never becomes a platform role and never gains cross-tenant access.

## 2. Role mapping (no enum migration)

The existing `Role` enum is reused. No role value is rewritten, so existing
accounts keep their role and password.

| Product role | Stored representation | Notes |
| --- | --- | --- |
| Organization Super Admin | `user_is_tenant_owner = true` (role stays `ADMIN`) | Existing owner account, seeded by provisioning |
| Organization Admin | `user_role = ADMIN`, `user_is_tenant_owner = false` | Existing admin accounts |
| Employee | any other client role (`USER`, `SALES`, `DATA`, ...) | Existing employees |
| Platform Super Admin | `user_role = SUPER_ADMIN` | Unchanged, separate security boundary |

`getOrgRole()` (`backend/src/lib/roles.js`) is the single source of truth used by
middleware, controllers and tests.

## 3. Login and routing

* One shared CRM login: `/v2/login` renders the existing login form directly.
  The old `/v2/login/client`, `/v2/login/admin` and `/v2/login/employee` URLs
  redirect to it, so bookmarks keep working but there is only one form and one
  URL for the three organizational roles.
* `/v2/login/superadmin` remains for the platform administrator (different
  security boundary) and `/` redirects to the shared CRM login.
* The backend decides the role: the login response contains `role`,
  `isTenantOwner`, `orgRole`, `modules` and `moduleActions`, all loaded from the
  database. A role sent by the browser is never read.
* Redirect: platform `SUPER_ADMIN` -> `/superadmin`; all organization roles ->
  `/v2/dashboard`. Employees see a personal work dashboard, admins/owners see
  the organization dashboard. No redirect loops.
* Inactive users are rejected by login and by `authMiddleware`; users without a
  tenant are rejected for CRM access.

## 4. Module permissions

`user_module_access` is reused and extended in a backward-compatible way:

```
null                                  -> every module, every action (owner / legacy)
""                                    -> dashboard only
"CONTACTS,TASKS"                      -> legacy grant: both modules, all actions
"CONTACTS:VIEW,CREATE,EDIT|TASKS:VIEW" -> explicit per-action grants
```

Supported actions: `VIEW`, `CREATE`, `EDIT`, `DELETE`. CSV export is a read of
already loaded rows, so it requires `VIEW`.

* `parseModuleGrants()`, `canAccessModule()` and `canDoAction()` live in
  `backend/src/lib/modules.js`; the same list is mirrored in
  `frontend/src/utils/modules.js`.
* The organization owner, organization admins and the platform superadmin always
  have full access. Employees are restricted by the stored grants.
* Routes enforce actions with `requirePermission(module, action)` in addition to
  the existing `requireModule(module)`; the UI only mirrors that decision.
* Search results are filtered per module, so a page/route gate is not the only
  enforcement.

## 5. Employee management rules

Implemented in `organization.controller.js` and `tenantAdmin.middleware.js`:

* Organization Super Admin can invite/deactivate Admins and Employees, change
  roles and module grants.
* Organization Admin can invite/deactivate Employees and manage employee module
  grants. Admin cannot create or promote an `ADMIN`/`SUPER_ADMIN`, cannot edit
  another admin, and cannot touch the owner account.
* The owner account cannot be deactivated or demoted; nobody can deactivate or
  change their own role.
* Roles accepted from clients are limited to `CLIENT_ROLES`; `SUPER_ADMIN` is
  never a valid client role.
* Invitations stay single-use, hashed, time limited, delivered by the existing
  service. Passwords are never set by an admin for an invitee.

## 6. Tasks and progress

Additive schema changes (migration `20261103030000_task_workflow`):

* `task.task_assigned_by_fk` (nullable, FK to `users`) — who assigned the work.
* `task.task_status` enum `TODO | IN_PROGRESS | BLOCKED | COMPLETED`, default `TODO`.
* `task.task_progress` int, default `0`, validated 0-100 on the backend.
* `task.task_start_date`, `task.task_completed_at`.
* New `task_update` table: task, tenant, user, previous/new status, previous/new
  progress, note, timestamp. Appended, never overwritten.

Authorization:

* Employees create personal tasks; the assignee is forced to themselves.
* Admins assign tasks to Employees only; the owner assigns to Admins and Employees;
  the platform superadmin may target any user of a supplied tenant.
* Employees only see tasks assigned to them (`GET /api/tasks` is filtered in SQL).
* Employees may change status, progress and a work note on their own task only.
  Changing assignee/priority/due date/subject through the API is rejected.
* Admins/owners keep the existing full task editing, scoped to their tenant.
* Progress 100 does not auto-complete a task; status is explicit.
* Task detail returns the update history; dashboards include recent updates.

Status transitions (employees): `TODO -> IN_PROGRESS | BLOCKED | COMPLETED`,
`IN_PROGRESS -> TODO | BLOCKED | COMPLETED`, `BLOCKED -> TODO | IN_PROGRESS`,
`COMPLETED -> IN_PROGRESS`. Reaching 100% is not required for `COMPLETED`.

## 7. Dashboards

`GET /api/dashboard/metrics` gains a `work` block, tenant-scoped and gated by the
TASKS module:

* Employee: own counts by status, overdue, upcoming, average progress, recent
  updates.
* Admin / owner: organization counts by status, overdue, per-assignee task
  counts and average progress, recent updates.
* Platform superadmin: the same aggregate across tenants (existing behavior).

The existing CRM KPI cards, pipeline and recent activity stay unchanged.

## 8. Migration and rollback

Migration: additive only, no drops, no data rewrite.

```sql
ALTER TABLE tasks
  ADD COLUMN task_assigned_by_fk VARCHAR(191) NULL,
  ADD COLUMN task_status ENUM('TODO','IN_PROGRESS','BLOCKED','COMPLETED') NOT NULL DEFAULT 'TODO',
  ADD COLUMN task_progress INT NOT NULL DEFAULT 0,
  ADD COLUMN task_start_date DATETIME(3) NULL,
  ADD COLUMN task_completed_at DATETIME(3) NULL;

CREATE INDEX tasks_task_status_idx ON tasks(task_status);
CREATE INDEX tasks_task_user_fk_task_status_idx ON tasks(task_user_fk, task_status);
-- plus the task_updates table (see migration.sql)
```

`prisma migrate deploy` cannot be used on this database because the schema was
never baselined (`P3005`). Apply the migration with:

```powershell
cd backend
npx prisma db execute --file prisma/migrations/20261103030000_task_workflow/migration.sql
npx prisma generate
```

Rollback considerations: drop `task_update` first, then the added columns; the
existing task rows and all other tables are untouched. The rollback SQL is stored
in `prisma/migrations/20261103030000_task_workflow/rollback.sql`.

## 9. Verification performed

### Commands (actually run)

| Command | Result |
| --- | --- |
| `cd backend ; npm test` | 21 tests, 20 pass, 1 skipped (DB test), 0 fail |
| `$env:RUN_DB_TESTS='1'; npm test` | 21 tests, 21 pass, 0 skipped, 0 fail |
| `cd frontend ; npx vite build` | built successfully; only the pre-existing >500 kB chunk warning |
| `npx prisma db execute --file .../migration.sql` | "Script executed successfully." |
| `information_schema` column check | all new `tasks` columns and the `task_updates` table exist with the expected types |

The new `backend/tests/roles-tasks.test.js` covers role mapping, module grant
parsing/serialisation, action enforcement, progress validation, status
transitions, assignment rules and the employee field guard.

### API scenarios (live server, real MySQL data)

All 29 checks were executed against `http://localhost:5000`; 28 passed on the
first run. The one reported failure was a typo in the test email, not an
application failure; re-running that check with the correct email returned
`401 Account is deactivated` and `401` for the protected request.

| Scenario | Observed result |
| --- | --- |
| Owner login (`abc@vsph.in`) | 200, `orgRole=ORG_SUPER_ADMIN`, owner=true |
| Employee login (`abcsales@vsph.in`) | 200, `orgRole=EMPLOYEE`, modules `CONTACTS,TASKS` |
| Platform login (`superadmin@crm.com`) | 200, `orgRole=PLATFORM_SUPERADMIN`, no tenant |
| Employee `GET /api/users` | only the employee's own record |
| Employee `GET /api/tasks` | only tasks assigned to that employee |
| Employee updates own status/progress/note | 200, row updated |
| `GET /api/tasks/:id` after update | history row with previous/new status and progress |
| Employee changes priority / assignee | 403 |
| Employee creates a task for someone else | 403 |
| Employee reads or updates another user's task | 403 |
| Employee calls organization endpoints | 403 |
| Employee granted `TASKS:VIEW` only | list 200, edit 403 `ACTION_ACCESS_DENIED` |
| Owner assigns to an admin | 201 |
| Admin assigns to an employee | 201 |
| Admin assigns to owner/admin, creates an admin, edits the owner | 403 |
| Cross-tenant task read by employee | 404 |
| Cross-tenant task absent from employee list | confirmed |
| Inactive user session / login | 401 / 401 |
| Employee dashboard | `scope=PERSONAL`, total equals own DB task count |
| Owner dashboard | `scope=ORGANIZATION`, per-person progress present |
| Module endpoints for owner | all 6 modules 200 |
| Module endpoints for employee | Contacts/Tasks 200; Accounts/Opportunities/Projects/Campaigns 403 |
| Search as employee | 200, returns only granted modules |
| Employee sends `?user_id=<owner>` to dashboard | ignored, personal scope returned |

### Browser checks (Vite dev server on 5174, since 5173 was occupied)

* `/v2/login` renders one shared form for organization users; old `/v2/login/client`
  and `/v2/login/employee` redirect to it.
* Employee login lands on `/v2/dashboard`, sidebar shows only Dashboard, Contacts
  and Tasks, role label "Employee", "My work" summary and no opportunity data.
* Owner login lands on `/v2/dashboard`, sees all modules plus Team, role label
  "Organization Super Admin", and the "Organization work overview" with per-person
  progress.
* `/v2/team` renders work-progress tiles/table and the employee role controls.
* Employee task detail: work-update form saves 40% / In progress / note; the
  Activity tab shows `Todo → In progress`, `0% → 40%` and the note.
* The employee detail view and task list no longer expose full Edit/Delete.

A defect found during browser verification was fixed: the employee dashboard's
"Recent activity" list was returning other users' tasks. `recentTasks` is now
scoped to the signed-in employee in `dashboard.controller.js`.

### Files changed

Backend:
`prisma/schema.prisma`, `prisma/migrations/20261103030000_task_workflow/*`,
`src/lib/roles.js` (new), `src/lib/tasks.js` (new), `src/lib/modules.js`,
`src/middleware/auth.middleware.js`, `src/middleware/tenantAdmin.middleware.js`,
`src/controllers/auth.controller.js`, `task.controller.js`,
`organization.controller.js`, `user.controller.js`, `dashboard.controller.js`,
`search.controller.js`, and the route files for accounts, contacts,
opportunities, projects, campaigns, calls and tasks,
`tests/roles-tasks.test.js` (new).

Frontend:
`src/App.jsx`, `src/utils/modules.js`, `src/components/OrgGuard.jsx` (new),
`v2/login/loginForm.jsx`, `v2/sidebar.jsx`, `v2/dashboard.jsx`,
`ModulePicker.jsx`, `TaskDetailView.jsx`, `modals/AddTaskModal.jsx`,
`modals/EmployeeAccessModal.jsx`, `modals/InviteEmployeeModal.jsx`,
`pages/Tasks.jsx`, `pages/Team.jsx`, `ConDetailView.jsx`,
`pages/Accounts.jsx`, `pages/Contacts.jsx`, `pages/Opportunities.jsx`,
`pages/Projects.jsx`, `pages/Campaigns.jsx`, `AccDetailView.jsx`,
`OppDetailView.jsx`, `ProjectDetailView.jsx`, `CampaignDetailView.jsx`.

### Remaining issues / manual steps

* `prisma migrate deploy` is still blocked by `P3005` until the database is
  baselined; apply future migrations with `prisma db execute` (documented above).
* The employee task form allows any status in the dropdown; an invalid transition
  is rejected by the backend with a 400 and the message is shown in the form.
* Production deployment must run the migration and `prisma generate` before
  restarting the API; no production configuration was touched here.

### Full browser regression pass (2026-11-04)

Run against the Vite dev server on `http://localhost:5174` and API on
`http://localhost:5000`, signed in through the shared CRM login. All records
created for the pass were deleted afterwards; no demo data was reset.

| Area | Check | Result |
| --- | --- | --- |
| Login | Admin, employee and owner sign in through the same form; sign-out returns to `/v2/login` | Pass |
| Navigation | Employee sidebar shows Dashboard, Contacts, Tasks only; direct visits to Accounts, Opportunities, Projects, Team and Campaigns redirect to dashboard | Pass |
| API enforcement | Employee `GET /api/accounts`, `/opportunities`, `/projects`, `/campaigns` = 403 `MODULE_ACCESS_DENIED`; Contacts/Tasks = 200; `/api/users` scoped to self | Pass |
| Dashboard | Admin sees organization pipeline/team progress; employee sees own tasks only, no other user's tasks, pipeline access message | Pass |
| Contacts | Create with 46 fields; edit designation/mobile; delete + confirm; list/detail render | Pass, with display gaps below |
| Accounts | Create with email, phone, website, employees, revenue, description and billing/shipping; edit, required-name validation, delete; detail tabs render | Pass, with placeholder tabs below |
| Opportunities | Create with core fields, statuses, dates, pickup/drop, account/contact/project; stage saved on edit; detail/Activity; delete | Pass |
| Projects | Create name/location/date/type/status; edit date; detail/Activity; delete | Pass |
| Campaigns | Create name; detail/Activity; delete | Pass, owner select empty (below) |
| Tasks | Admin creates and assigns to employee, edits priority; employee sees own tasks only, updates status/progress/note, history entry appears; employee personal task assigns self | Pass |
| Task permissions | Employee delete attempt returns 403 (admin-only); UI no longer shows Delete, checkboxes or bulk delete to employees | Pass after fix |
| Module grants | Employee temporarily set to `ACCOUNTS:VIEW` saw the Accounts nav/list but no New/Edit/Delete/bulk controls; backend create/edit returned 403 `ACTION_ACCESS_DENIED` | Pass after fix |
| Search | Global navbar search (2+ chars) and per-page search with 300 ms debounce work | Pass |

Fixes made during the pass:

* List pages (`Accounts`, `Contacts`, `Opportunities`, `Projects`, `Campaigns`)
  now gate New/Edit/Delete, row checkboxes and bulk delete with `canDoAction`.
* Detail views (`AccDetailView`, `ConDetailView`, `OppDetailView`,
  `ProjectDetailView`, `CampaignDetailView`) gate their action buttons; the
  previously inert Edit buttons now open the edit modal via an `onEdit` prop.
* `Tasks.jsx` now treats delete and bulk selection as admin/owner-only, matching
  the backend's "Only an organization administrator can delete tasks."

Known gaps observed but not changed (pre-existing or out of scope):

* Account/Opportunity/Project/Campaign detail Activity tabs are placeholders.
* Contact detail labels "Designation" with `contact_title` first, so a real
  designation is hidden when a title exists; billing/shipping addresses are
  stored but not shown in the contact detail view.
* Account drawer "New Contact"/"New Opportunity" do not prefill the linked
  account.
* Campaign create owner dropdown has only the empty option, so new campaigns
  have no owner.
* Detail drawers show stale data after an edit until reopened.
* Employee personal tasks cannot be deleted by the employee (backend rule);
  the UI now reflects that.

### Account industry and location fix (2026-11-04)

Two display bugs were fixed in `account.controller.js`:

* **Industry** — the form offers a much larger list than the eight seeded
  industries, so saving an unknown name previously dropped the value. The
  controller now creates the industry on demand (scoped to the account's tenant)
  and links it. Known names still reuse the existing row.
* **Location** — when `account_city`/`account_country` were empty, the list and
  detail responses now fall back to the billing city/country, so the Location
  column is not blank for accounts that only have a billing address.

Verified against the dev database and API on port 5000, then in the browser:

| Check | Result |
| --- | --- |
| Create/edit an account with an industry outside the seeded list; `GET /api/accounts/:id` returns it | Pass |
| Account with only billing city/country shows Location in list and detail | Pass |
| Flipkart (`ACC-000020`) after re-save: `account_industry_fk` set, industry `Telecommunications`, list row shows `Telecommunications` and `pune` | Pass |

No schema change was needed for this fix. Existing accounts that stored no
industry keep `NULL` until the account is edited and saved again.

### Follow-up fixes (branch `fix/industry-tenant-ui`, not merged)

These were built and tested in a separate git worktree with its own database
copy (`crm_fix`), API on 5001 and Vite on 5175. The live app (`5000`/`5174`) and
the live `crm` database were not modified.

1. **Industries are unique per tenant, not globally.** Migration
   `20261104090000_industry_per_tenant` drops the global key and adds
   `(tenant_fk, industry_name)`. Account and contact saves create or reuse the
   industry inside the signed-in tenant only. Apply with `prisma db execute`
   while `migrate deploy` is blocked by `P3005`; `rollback.sql` restores the
   global key and only works while no two tenants share a name.
2. **New campaigns default their owner to the signed-in user.** The owner
   dropdown was always populated, but nothing was preselected, so campaigns
   could be saved without an owner.
3. **The account drawer pre-fills the account** in "New Contact" and
   "New Opportunity" (the prop was passed but ignored).
4. **Contact detail shows the real designation** (`contact_designation`, not
   `contact_title`) and displays the stored billing and shipping addresses
   instead of a dead "Mailing Box" placeholder.
5. **Employee task status choices follow the workflow**, so the UI no longer
   offers moves the backend rejects. Admins still see every status.
6. **Activity tabs show real data.** Account, opportunity, project and campaign
   detail views replace the "content will go here" placeholder with a feed of
   calls and tasks logged against the record's linked contacts
   (`GET /api/activity?entity=…&id=…`). The endpoint runs behind the same auth
   middleware, checks module access, and filters by tenant, so an entity in
   another tenant returns 404 and a module the user lacks returns 403. The
   Chatter tab was later removed in the open-issue batch below.
7. **The account Opportunities tab lists the account's opportunities.** The
   label was hardcoded to `Opportunities (0)` and the pane had no content, even
   when the opportunity was saved with that account. `GET /api/accounts/:id` now
   returns them and the tab shows name, stage and close date.

Verification in the sandbox: `npm test` 23 tests (22 pass, 1 skipped, 0 fail),
`vite build` passes, and browser checks covered each item above with temporary
records that were removed afterwards.

Activity tab checks: the account `xyz` feed listed a real task and call (subject,
status, contact, user, timestamp); project and campaign feeds showed the same
items while a contact was temporarily linked and went back to the empty state
after the link was reverted; an opportunity with no logged calls or tasks showed
"No activity yet". API checks returned 200 for a valid record, 200 with `[]` for
no activity, 404 for another tenant's account and for a soft-deleted project,
403 for a module the signed-in user lacks, and 400 for an unknown entity.

Deliberately not changed:

* Accounts with no industry cannot be backfilled automatically: the old code
  never stored the chosen free-text name, so there is nothing to read. The four
  remaining rows in the dev copy are test records (`Test Account`, `TestCo`,
  `xyz`, `pqr`) and need a manual edit.
* A billing-to-account location backfill would touch only two of those test
  rows, so the display fallback stays and no data write is planned.
* Detail drawers already close before an edit and refetch on reopen; the older
  "stale until reopened" note no longer reproduces.

### Open-issue fixes and horizontal navbar

8. **Global search opens the record.** Clicking a search result now navigates to
   the module with the record id (`?account_id=`, `?contact_id=`,
   `?opportunity_id=`, `?project_id=`, `?task_id=`), which opens the detail
   drawer instead of the plain list.
9. **Team roles are distinct.** The role dropdown and invite form use readable
   labels (`Employee (Sales)`, `Employee (Data)`, …) instead of six identical
   "Employee" options. The table shows the same label.
10. **Contact search matches the account name**, so searching "Flipkart"
    returns that account's contacts.
11. **Real detail lists replace placeholders.** Account "Member Accounts" lists
    `account_children`; contact "Opportunities" lists the linked opportunities;
    campaign "Contacts" and "Opportunities" tabs list the linked records and
    counts come from the detail API.
12. **Placeholder-only tabs removed.** Chatter, contact Accuracy and contact
    Related had no schema behind them and are gone.
13. **Legacy v1 URLs redirect to `/v2`** (`/dashboard`, `/contacts`,
    `/accounts`, `/opportunities`, `/projects`, `/campaigns`, `/tasks`). The old
    layout is no longer routed.
14. **Horizontal navbar.** The v2 sidebar is replaced by a top navigation bar
    with the same module permissions, search and sign out; `sidebar.jsx` is
    deleted.

Verified in the sandbox: search deep links open the account/opportunity/project/
task drawers; contact search by account name returns the contact; account member
list, contact opportunities and campaign contact/opportunity tabs render real
temporary links that were reverted; employee nav shows only Dashboard, Contacts
and Tasks; legacy URLs redirect; `vite build` passes and `npm test` runs 23 tests
(22 pass, 1 skipped).

Before merging: take a database backup, apply the migration, run
`prisma generate`, restart the API, then merge the branch and push.

