import { prisma } from "../lib/prisma.js";
import { canAccessModule } from "../lib/modules.js";
import { getTenantFilter } from "./../middleware/auth.middleware.js";

const ENTITY_MODULES = {
  account: "ACCOUNTS",
  opportunity: "OPPORTUNITIES",
  project: "PROJECTS",
  campaign: "CAMPAIGNS",
};

// Contacts are the only record both calls and tasks point at, so an entity's
// activity is the calls/tasks of the contacts linked to it.
const contactIdsFor = async (entity, id, tenantFilter) => {
  if (entity === "account") {
    const rows = await prisma.contact.findMany({
      where: { contact_account_fk: id, contact_deleted_at: null, ...tenantFilter },
      select: { contact_id: true },
    });
    return rows.map((row) => row.contact_id);
  }

  if (entity === "opportunity") {
    const row = await prisma.opportunity.findFirst({
      where: { opportunity_id: id, ...tenantFilter },
      select: { opportunity_contact_fk: true },
    });
    return row?.opportunity_contact_fk ? [row.opportunity_contact_fk] : [];
  }

  const row = await prisma.contact.findMany({
    where:
      entity === "project"
        ? { contact_project_fk: id, contact_deleted_at: null, ...tenantFilter }
        : { contact_campaign_fk: id, contact_deleted_at: null, ...tenantFilter },
    select: { contact_id: true },
  });
  return row.map((item) => item.contact_id);
};

const entityExists = async (entity, id, tenantFilter) => {
  const where = { ...tenantFilter };
  if (entity === "account") {
    const row = await prisma.account.findFirst({
      where: { ...where, account_id: id, account_deleted_at: null },
      select: { account_id: true },
    });
    return Boolean(row);
  }
  if (entity === "opportunity") {
    const row = await prisma.opportunity.findFirst({
      where: { ...where, opportunity_id: id },
      select: { opportunity_id: true },
    });
    return Boolean(row);
  }
  if (entity === "project") {
    const row = await prisma.project.findFirst({
      where: { ...where, project_id: id, project_deleted_at: null },
      select: { project_id: true },
    });
    return Boolean(row);
  }
  const row = await prisma.campaign.findFirst({
    where: { ...where, campaign_id: id, campaign_deleted_at: null },
    select: { campaign_id: true },
  });
  return Boolean(row);
};

export const getActivity = async (req, res) => {
  try {
    const { entity, id } = req.query;
    const moduleCode = ENTITY_MODULES[entity];
    if (!moduleCode || !id) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid entity and id.",
      });
    }
    if (!canAccessModule(req.user, moduleCode)) {
      return res.status(403).json({
        success: false,
        code: "MODULE_ACCESS_DENIED",
        message: `You do not have access to ${moduleCode}.`,
      });
    }

    const tenantFilter = getTenantFilter(req);
    if (!(await entityExists(entity, id, tenantFilter))) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const contactIds = await contactIdsFor(entity, id, tenantFilter);
    if (!contactIds.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const [calls, tasks] = await Promise.all([
      prisma.call.findMany({
        where: {
          call_contact_fk: { in: contactIds },
          call_deleted_at: null,
          ...tenantFilter,
        },
        orderBy: { call_created_at: "desc" },
        take: 50,
        select: {
          call_id: true,
          call_subject: true,
          call_description: true,
          call_created_at: true,
          user: { select: { user_name: true } },
          contact: { select: { contact_firstname: true, contact_lastname: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          task_contact_fk: { in: contactIds },
          task_deleted_at: null,
          ...tenantFilter,
        },
        orderBy: { task_created_at: "desc" },
        take: 50,
        select: {
          task_id: true,
          task_subject: true,
          task_status: true,
          task_progress: true,
          task_created_at: true,
          user: { select: { user_name: true } },
          contact: { select: { contact_firstname: true, contact_lastname: true } },
        },
      }),
    ]);

    const items = [
      ...calls.map((call) => ({
        type: "call",
        id: call.call_id,
        title: call.call_subject || "Call",
        description: call.call_description || "",
        status: null,
        progress: null,
        created_at: call.call_created_at,
        user: call.user?.user_name || null,
        contact: [call.contact?.contact_firstname, call.contact?.contact_lastname]
          .filter(Boolean)
          .join(" "),
      })),
      ...tasks.map((task) => ({
        type: "task",
        id: task.task_id,
        title: task.task_subject || "Task",
        description: "",
        status: task.task_status,
        progress: task.task_progress,
        created_at: task.task_created_at,
        user: task.user?.user_name || null,
        contact: [task.contact?.contact_firstname, task.contact?.contact_lastname]
          .filter(Boolean)
          .join(" "),
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
