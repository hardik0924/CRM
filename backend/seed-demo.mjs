// Demo CRM data for the client workspace. Idempotent: safe to re-run.
// Target tenant: ABC (31f2a7a7-8843-438b-be65-5d66a6bc40dc).
import { prisma } from "./src/lib/prisma.js";

const TENANT_ID = "31f2a7a7-8843-438b-be65-5d66a6bc40dc";
const OWNER_ID = "15ceb8f2-3daf-46a8-8cb4-9a6c730bdb74";
const SALES_ID = "d4781680-b126-4e1b-8e05-1fcd737064c7";

const industries = ["Technology", "Consulting", "Retail", "Manufacturing", "Finance"];

for (const name of industries) {
  await prisma.industry.upsert({
    where: { industry_name: name },
    update: {},
    create: { industry_name: name, tenant_fk: TENANT_ID },
  });
}
const industryMap = new Map(
  (await prisma.industry.findMany({ where: { tenant_fk: TENANT_ID } })).map((i) => [
    i.industry_name,
    i.industry_id,
  ]),
);

const accounts = [
  { code: "DEMO-0001", name: "Contoso Ltd", city: "New York", country: "USA", industry: "Technology", size: 120, revenue: 12500000 },
  { code: "DEMO-0002", name: "Northwind Traders", city: "Chicago", country: "USA", industry: "Retail", size: 40, revenue: 3200000 },
  { code: "DEMO-0003", name: "Fabrikam Consulting", city: "Boston", country: "USA", industry: "Consulting", size: 25, revenue: 1800000 },
  { code: "DEMO-0004", name: "Tailspin Toys", city: "Austin", country: "USA", industry: "Manufacturing", size: 90, revenue: 6400000 },
  { code: "DEMO-0005", name: "Wingtip Bank", city: "New York", country: "USA", industry: "Finance", size: 300, revenue: 47000000 },
  { code: "DEMO-0006", name: "Adventure Works", city: "Seattle", country: "USA", industry: "Retail", size: 60, revenue: 4100000 },
];

const accountIds = [];
for (const a of accounts) {
  const existing = await prisma.account.findUnique({ where: { account_code: a.code } });
  if (existing) {
    accountIds.push(existing.account_id);
    continue;
  }
  const created = await prisma.account.create({
    data: {
      tenant_fk: TENANT_ID,
      account_code: a.code,
      account_name: a.name,
      account_city: a.city,
      account_country: a.country,
      account_industry_fk: industryMap.get(a.industry) || null,
      account_employees_size: a.size,
      account_annual_revenue: a.revenue,
      account_account_status: "ACTIVE",
      account_owner_fk: OWNER_ID,
    },
  });
  accountIds.push(created.account_id);
}

const contacts = [
  ["John", "Doe", "john.doe@contoso.com", 0, "CFO"],
  ["Jane", "Smith", "jane.smith@northwind.com", 1, "Procurement Head"],
  ["Robert", "Brown", "robert.brown@fabrikam.com", 2, "Partner"],
  ["Emily", "Davis", "emily.davis@tailspin.com", 3, "Operations Lead"],
  ["Michael", "Wilson", "michael.wilson@wingtip.com", 4, "VP Sales"],
  ["Sarah", "Miller", "sarah.miller@adventure.com", 5, "Marketing Director"],
  ["David", "Taylor", "david.taylor@contoso.com", 0, "IT Director"],
  ["Laura", "Anderson", "laura.anderson@wingtip.com", 4, "Analyst"],
];

for (let i = 0; i < contacts.length; i++) {
  const [first, last, email, accIdx, title] = contacts[i];
  const code = `DEMO-C-${String(i + 1).padStart(4, "0")}`;
  const existing = await prisma.contact.findUnique({ where: { contact_code: code } });
  if (existing) continue;
  await prisma.contact.create({
    data: {
      tenant_fk: TENANT_ID,
      contact_code: code,
      contact_salutation: "MR",
      contact_firstname: first,
      contact_lastname: last,
      contact_title: title,
      contact_professional_email: email,
      contact_account_fk: accountIds[accIdx],
      contact_owner_fk: i % 2 === 0 ? OWNER_ID : SALES_ID,
      contact_call_status: "CONNECTED",
      contact_email_status: "VALID",
      contact_phone_status: "VALID",
      contact_status: "ACTIVE",
    },
  });
}

const stages = ["PITCH_DONE", "FOLLOW_UP", "CONTRACT_OUT", "CLOSED_WON", "CLOSED_LOST", "PITCH_DONE"];
const opportunities = [
  ["Q4 Software Licensing", 0, 0],
  ["Annual Support Renewal", 1, 1],
  ["Consulting Engagement", 2, 2],
  ["Retail Analytics Platform", 3, 3],
  ["Banking Integration Project", 4, 4],
  ["E-commerce Expansion", 5, 5],
];

for (let i = 0; i < opportunities.length; i++) {
  const [name, accIdx, contactIdx] = opportunities[i];
  const existing = await prisma.opportunity.findFirst({ where: { opportunity_name: name, tenant_fk: TENANT_ID } });
  if (existing) continue;
  await prisma.opportunity.create({
    data: {
      tenant_fk: TENANT_ID,
      opportunity_name: name,
      opportunity_close_date: new Date(`2027-${String(Math.min(1 + i, 12)).padStart(2, "0")}-15`),
      opportunity_owner_fk: OWNER_ID,
      opportunity_account_fk: accountIds[accIdx],
      opportunity_contact_fk: undefined,
      opportunity_stage: stages[i],
    },
  });
}

const projects = [
  ["Q4 Cloud Migration", "New York", "INBOUND", "ACTIVE"],
  ["Data Center Consolidation", "Chicago", "INBOUND", "ACTIVE"],
  ["Security Audit", "Boston", "OUTBOUND", "ACTIVE"],
  ["Compliance Review", "Austin", "OUTBOUND", "INACTIVE"],
];

for (const [name, loc, type, status] of projects) {
  const existing = await prisma.project.findFirst({ where: { project_name: name, tenant_fk: TENANT_ID } });
  if (existing) continue;
  await prisma.project.create({
    data: {
      tenant_fk: TENANT_ID,
      project_name: name,
      project_location: loc,
      project_date: new Date(),
      project_type: type,
      project_is_active: status,
    },
  });
}

const tasks = [
  ["Follow up with John Doe", "High priority follow-up call", "HIGH", OWNER_ID],
  ["Prepare Q4 proposal", "Draft proposal for Contoso", "HIGH", SALES_ID],
  ["Update pipeline stages", "Refresh opportunity statuses", "NORMAL", SALES_ID],
  ["Send invoice to Wingtip", "Invoice #2214", "NORMAL", OWNER_ID],
  ["Schedule kickoff meeting", "Cloud migration kickoff", "LOW", SALES_ID],
];

for (const [subject, desc, priority, userId] of tasks) {
  const existing = await prisma.task.findFirst({ where: { task_subject: subject, tenant_fk: TENANT_ID } });
  if (existing) continue;
  await prisma.task.create({
    data: {
      tenant_fk: TENANT_ID,
      task_subject: subject,
      task_description: desc,
      task_priority: priority,
      task_due_date: new Date(Date.now() + 7 * 86400000),
      task_user_fk: userId,
    },
  });
}

const campaigns = ["Q4 Product Launch", "Annual Tech Summit", "Regional Roadshow"];

for (const name of campaigns) {
  const existing = await prisma.campaign.findFirst({ where: { campaign_name: name, tenant_fk: TENANT_ID } });
  if (existing) continue;
  await prisma.campaign.create({
    data: {
      tenant_fk: TENANT_ID,
      campaign_name: name,
      campaign_user_fk: OWNER_ID,
    },
  });
}

const summary = {
  accounts: await prisma.account.count({ where: { tenant_fk: TENANT_ID, account_deleted_at: null } }),
  contacts: await prisma.contact.count({ where: { tenant_fk: TENANT_ID, contact_deleted_at: null } }),
  opportunities: await prisma.opportunity.count({ where: { tenant_fk: TENANT_ID } }),
  projects: await prisma.project.count({ where: { tenant_fk: TENANT_ID, project_deleted_at: null } }),
  tasks: await prisma.task.count({ where: { tenant_fk: TENANT_ID, task_deleted_at: null } }),
  campaigns: await prisma.campaign.count({ where: { tenant_fk: TENANT_ID, campaign_deleted_at: null } }),
};

console.log("Demo data ready:", JSON.stringify(summary));

await prisma.$disconnect();
