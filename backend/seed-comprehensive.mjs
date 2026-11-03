// Comprehensive CRM demo data seed for ABC tenant (31f2a7a7-8843-438b-be65-5d66a6bc40dc)
// Idempotent: safe to re-run. Uses account_code/contact_code/opportunity_name as unique keys.
import { prisma } from "./src/lib/prisma.js";

const TENANT_ID = "31f2a7a7-8843-438b-be65-5d66a6bc40dc";
const OWNER_ID = "15ceb8f2-3daf-46a8-8cb4-9a6c730bdb74";
const SALES_ID = "d4781680-b126-4e1b-8e05-1fcd737064c7";
const HARDIK_ID = "76dfe842-4d15-4034-bc69-19d9a3498e2b";

// Valid enum values from schema:
// call_status: RINGING, PITCH_DONE, NOT_INTERESTED, NOT_RELEVANT, LEFT_ORGANIZATION, NOT_AVAILABLE, CONNECTED, NOT_CONNECTED, WRONG_NUMBER, DNC
// email_status: GENERATED, NOT_FOUND, PENDING, RECHECKED, VALID, INVALID, BOUNCE
// number_status: GENERATED, NOT_FOUND, PENDING, RECHECKED, VALID, INVALID, BOUNCE
// contact_status: ACTIVE, INACTIVE
// account_type: CUSTOMER, PARTNER, PROSPECT, COMPETITER, RESELLER, DISTRIBUTOR
// stage: PITCH_DONE, FOLLOW_UP, CONTRACT_OUT, CLOSED_WON, CLOSED_LOST
// type: INBOUND, OUTBOUND
// priority: NORMAL, HIGH, LOW

// Industries
const industries = ["Technology", "Consulting", "Retail", "Manufacturing", "Finance", "Healthcare", "Education", "Real Estate"];
for (const name of industries) {
  await prisma.industry.upsert({
    where: { industry_name: name },
    update: {},
    create: { industry_name: name, tenant_fk: TENANT_ID },
  });
}
const industryMap = new Map(
  (await prisma.industry.findMany({ where: { tenant_fk: TENANT_ID } })).map((i) => [i.industry_name, i.industry_id]),
);

// ============================================================
// ACCOUNTS
// ============================================================
const accounts = [
  { code: "ACC-00001", name: "TechNova Solutions", city: "San Francisco", country: "USA", industry: "Technology", size: 250, revenue: 45000000, status: "ACTIVE" },
  { code: "ACC-00002", name: "Global Manufacturing Inc", city: "Detroit", country: "USA", industry: "Manufacturing", size: 800, revenue: 120000000, status: "ACTIVE" },
  { code: "ACC-00003", name: "RetailMax Stores", city: "Chicago", country: "USA", industry: "Retail", size: 150, revenue: 32000000, status: "ACTIVE" },
  { code: "ACC-00004", name: "FinTrust Bank", city: "New York", country: "USA", industry: "Finance", size: 400, revenue: 200000000, status: "ACTIVE" },
  { code: "ACC-00005", name: "HealthFirst Clinic", city: "Boston", country: "USA", industry: "Healthcare", size: 120, revenue: 18000000, status: "ACTIVE" },
  { code: "ACC-00006", name: "EduLearn University", city: "Austin", country: "USA", industry: "Education", size: 300, revenue: 55000000, status: "ACTIVE" },
  { code: "ACC-00007", name: "SkyHigh Realty", city: "Miami", country: "USA", industry: "Real Estate", size: 45, revenue: 8500000, status: "ACTIVE" },
  { code: "ACC-00008", name: "ConsultPro Advisors", city: "Seattle", country: "USA", industry: "Consulting", size: 60, revenue: 12000000, status: "ACTIVE" },
  { code: "ACC-00009", name: "NexGen Logistics", city: "Atlanta", country: "USA", industry: "Retail", size: 200, revenue: 38000000, status: "ACTIVE" },
  { code: "ACC-00010", name: "BuildWell Construction", city: "Denver", country: "USA", industry: "Manufacturing", size: 180, revenue: 42000000, status: "ACTIVE" },
  { code: "ACC-00011", name: "QuickServe IT", city: "Portland", country: "USA", industry: "Technology", size: 55, revenue: 9500000, status: "ACTIVE" },
  { code: "ACC-00012", name: "Meridian Financial", city: "Charlotte", country: "USA", industry: "Finance", size: 90, revenue: 25000000, status: "INACTIVE" },
  { code: "ACC-00013", name: "GreenField Agriculture", city: "Des Moines", country: "USA", industry: "Retail", size: 95, revenue: 16000000, status: "ACTIVE" },
  { code: "ACC-00014", name: "Urban Living Properties", city: "Nashville", country: "USA", industry: "Real Estate", size: 30, revenue: 6200000, status: "ACTIVE" },
  { code: "ACC-00015", name: "Strategic Growth Consulting", city: "Dallas", country: "USA", industry: "Consulting", size: 40, revenue: 7800000, status: "ACTIVE" },
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
      account_account_status: a.status,
      account_owner_fk: OWNER_ID,
    },
  });
  accountIds.push(created.account_id);
}
console.log(`Accounts: ${accountIds.length} ready`);

// ============================================================
// CONTACTS
// ============================================================
const CALL_STATUSES = ["CONNECTED", "PITCH_DONE", "NOT_INTERESTED", "FOLLOW_UP"];
const contacts = [
  { firstname: "Sarah", lastname: "Chen", email: "sarah.chen@technova.com", accountIdx: 0, ownerIdx: 0, title: "CTO", department: "Engineering", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Michael", lastname: "Roberts", email: "m.roberts@globalmfg.com", accountIdx: 1, ownerIdx: 1, title: "Plant Manager", department: "Operations", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
  { firstname: "Emily", lastname: "Watson", email: "emily.watson@retailmax.com", accountIdx: 2, ownerIdx: 0, title: "Procurement Lead", department: "Procurement", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
  { firstname: "David", lastname: "Williams", email: "d.williams@ftrust.com", accountIdx: 3, ownerIdx: 1, title: "VP Risk", department: "Risk Management", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Lisa", lastname: "Thompson", email: "l.thompson@healthfirst.com", accountIdx: 4, ownerIdx: 0, title: "Medical Director", department: "Clinical", status: "ACTIVE", call_status: "NOT_INTERESTED", email_status: "VALID" },
  { firstname: "Robert", lastname: "Garcia", email: "r.garcia@edulearn.edu", accountIdx: 5, ownerIdx: 0, title: "Dean of Admissions", department: "Administration", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
  { firstname: "Jessica", lastname: "Martinez", email: "j.martinez@skyhigh.com", accountIdx: 6, ownerIdx: 1, title: "Broker", department: "Sales", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
  { firstname: "Daniel", lastname: "Lee", email: "daniel.lee@consultpro.com", accountIdx: 7, ownerIdx: 0, title: "Senior Consultant", department: "Strategy", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Amanda", lastname: "Foster", email: "a.foster@nexgen.com", accountIdx: 8, ownerIdx: 1, title: "Logistics Coordinator", department: "Supply Chain", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Christopher", lastname: "Brown", email: "c.brown@buildwell.com", accountIdx: 9, ownerIdx: 0, title: "Project Director", department: "Construction", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
  { firstname: "Rachel", lastname: "Adams", email: "rachel.adams@quickserve.com", accountIdx: 10, ownerIdx: 1, title: "Support Manager", department: "Customer Success", status: "ACTIVE", call_status: "NOT_CONNECTED", email_status: "INVALID" },
  { firstname: "James", lastname: "Wilson", email: "j.wilson@meridian.com", accountIdx: 11, ownerIdx: 0, title: "Compliance Officer", department: "Compliance", status: "INACTIVE", call_status: "NOT_INTERESTED", email_status: "VALID" },
  { firstname: "Patricia", lastname: "Taylor", email: "p.taylor@greenfield.com", accountIdx: 12, ownerIdx: 1, title: "Operations Head", department: "Operations", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Matthew", lastname: "Anderson", email: "m.anderson@urbanliving.com", accountIdx: 13, ownerIdx: 0, title: "Leasing Agent", department: "Sales", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
  { firstname: "Stephanie", lastname: "Thomas", email: "s.thomas@strategic.com", accountIdx: 14, ownerIdx: 1, title: "Partner", department: "Strategy", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Andrew", lastname: "Jackson", email: "andrew.j@techstart.io", accountIdx: 0, ownerIdx: 0, title: "Product Manager", department: "Product", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
  { firstname: "Nicole", lastname: "White", email: "nicole.white@finbank.net", accountIdx: 3, ownerIdx: 0, title: "Branch Manager", department: "Retail Banking", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Kevin", lastname: "Harris", email: "kevin.h@retailhub.biz", accountIdx: 2, ownerIdx: 1, title: "Store Manager", department: "Retail", status: "ACTIVE", call_status: "NOT_AVAILABLE", email_status: "BOUNCE" },
  { firstname: "Laura", lastname: "Clark", email: "laura.clark@mediacorp.com", accountIdx: 0, ownerIdx: 1, title: "Marketing Director", department: "Marketing", status: "ACTIVE", call_status: "CONNECTED", email_status: "VALID" },
  { firstname: "Steven", lastname: "Lewis", email: "steven.l@autoparts.com", accountIdx: 1, ownerIdx: 0, title: "Procurement Officer", department: "Procurement", status: "ACTIVE", call_status: "PITCH_DONE", email_status: "VALID" },
];

for (let i = 0; i < contacts.length; i++) {
  const c = contacts[i];
  const code = `CON-${String(i + 1).padStart(6, "0")}`;
  const existing = await prisma.contact.findUnique({ where: { contact_code: code } });
  if (existing) continue;
  await prisma.contact.create({
    data: {
      tenant_fk: TENANT_ID,
      contact_code: code,
      contact_salutation: "MR",
      contact_firstname: c.firstname,
      contact_lastname: c.lastname,
      contact_title: c.title,
      contact_professional_email: c.email,
      contact_account_fk: accountIds[c.accountIdx],
      contact_owner_fk: c.ownerIdx === 0 ? OWNER_ID : c.ownerIdx === 1 ? SALES_ID : HARDIK_ID,
      contact_department: c.department,
      contact_call_status: c.call_status,
      contact_email_status: c.email_status,
      contact_phone_status: "VALID",
      contact_status: c.status,
      contact_city: accounts[c.accountIdx].account_city,
      contact_country: accounts[c.accountIdx].account_country,
    },
  });
}
console.log(`Contacts: ${contacts.length} ready`);

// ============================================================
// OPPORTUNITIES
// ============================================================
const stages = ["PITCH_DONE", "FOLLOW_UP", "CONTRACT_OUT", "CLOSED_WON", "CLOSED_LOST"];
const opportunities = [
  { name: "Enterprise Software License", accountIdx: 0, stage: "PITCH_DONE", value: 75000, closeMonth: 12 },
  { name: "Plant Automation Upgrade", accountIdx: 1, stage: "FOLLOW_UP", value: 120000, closeMonth: 1 },
  { name: "Retail POS Rollout", accountIdx: 2, stage: "CONTRACT_OUT", value: 45000, closeMonth: 11 },
  { name: "Risk Management Platform", accountIdx: 3, stage: "CLOSED_WON", value: 85000, closeMonth: 10 },
  { name: "Healthcare System Integration", accountIdx: 4, stage: "CLOSED_LOST", value: 32000, closeMonth: 9 },
  { name: "Admissions Portal", accountIdx: 5, stage: "PITCH_DONE", value: 55000, closeMonth: 2 },
  { name: "Commercial Listing Package", accountIdx: 6, stage: "FOLLOW_UP", value: 18000, closeMonth: 11 },
  { name: "Digital Transformation", accountIdx: 7, stage: "CONTRACT_OUT", value: 95000, closeMonth: 12 },
  { name: "Supply Chain Optimization", accountIdx: 8, stage: "CLOSED_WON", value: 68000, closeMonth: 10 },
  { name: "Commercial Construction", accountIdx: 9, stage: "PITCH_DONE", value: 150000, closeMonth: 3 },
  { name: "IT Support Outsourcing", accountIdx: 10, stage: "CLOSED_LOST", value: 28000, closeMonth: 8 },
  { name: "Compliance Audit", accountIdx: 11, stage: "PITCH_DONE", value: 22000, closeMonth: 1 },
  { name: "AgriTech Implementation", accountIdx: 12, stage: "FOLLOW_UP", value: 41000, closeMonth: 1 },
  { name: "Leasing Platform", accountIdx: 13, stage: "CONTRACT_OUT", value: 35000, closeMonth: 12 },
  { name: "Strategy Consulting Retainer", accountIdx: 14, stage: "CLOSED_WON", value: 52000, closeMonth: 10 },
  { name: "Product Analytics Suite", accountIdx: 0, stage: "FOLLOW_UP", value: 63000, closeMonth: 1 },
  { name: "Branch Digital Banking", accountIdx: 3, stage: "CONTRACT_OUT", value: 78000, closeMonth: 2 },
  { name: "Store Inventory System", accountIdx: 2, stage: "CLOSED_LOST", value: 19000, closeMonth: 9 },
  { name: "Marketing Automation", accountIdx: 0, stage: "PITCH_DONE", value: 48000, closeMonth: 1 },
  { name: "Auto Parts Procurement", accountIdx: 1, stage: "FOLLOW_UP", value: 34000, closeMonth: 11 },
];

for (let i = 0; i < opportunities.length; i++) {
  const o = opportunities[i];
  const existing = await prisma.opportunity.findFirst({ where: { opportunity_name: o.name, tenant_fk: TENANT_ID } });
  if (existing) continue;
  await prisma.opportunity.create({
    data: {
      tenant_fk: TENANT_ID,
      opportunity_name: o.name,
      opportunity_close_date: new Date(`2027-${String(o.closeMonth).padStart(2, "0")}-15`),
      opportunity_owner_fk: OWNER_ID,
      opportunity_account_fk: accountIds[o.accountIdx],
      opportunity_contact_fk: null,
      opportunity_stage: stages[i % stages.length],
    },
  });
}
console.log(`Opportunities: ${opportunities.length} ready`);

// ============================================================
// PROJECTS
// ============================================================
const projects = [
  { name: "Cloud Migration Phase 1", location: "San Francisco", type: "INBOUND", status: "ACTIVE", date: "2026-11-01" },
  { name: "Factory IoT Integration", location: "Detroit", type: "OUTBOUND", status: "ACTIVE", date: "2026-11-15" },
  { name: "Omnichannel Retail", location: "Chicago", type: "INBOUND", status: "ACTIVE", date: "2026-10-20" },
  { name: "Core Banking Upgrade", location: "New York", type: "OUTBOUND", status: "ACTIVE", date: "2026-12-01" },
  { name: "Hospital EMR Deployment", location: "Boston", type: "INBOUND", status: "INACTIVE", date: "2026-09-10" },
  { name: "Campus Network Refresh", location: "Austin", type: "OUTBOUND", status: "ACTIVE", date: "2026-11-25" },
  { name: "Luxury Condo Dev", location: "Miami", type: "INBOUND", status: "ACTIVE", date: "2027-01-10" },
  { name: "Market Entry Strategy", location: "Seattle", type: "OUTBOUND", status: "ACTIVE", date: "2026-12-15" },
  { name: "Last-Mile Delivery Hub", location: "Atlanta", type: "INBOUND", status: "ACTIVE", date: "2027-02-01" },
  { name: "Bridge Reconstruction", location: "Denver", type: "OUTBOUND", status: "ACTIVE", date: "2027-03-01" },
  { name: "SaaS Platform v2", location: "Portland", type: "INBOUND", status: "ACTIVE", date: "2026-11-30" },
  { name: "Branch Network Security", location: "Charlotte", type: "OUTBOUND", status: "INACTIVE", date: "2026-10-05" },
  { name: "Smart Farming IoT", location: "Des Moines", type: "INBOUND", status: "ACTIVE", date: "2027-01-20" },
  { name: "Historic District Revitalization", location: "Nashville", type: "OUTBOUND", status: "ACTIVE", date: "2027-02-15" },
  { name: "Growth Roadmap 2027", location: "Dallas", type: "INBOUND", status: "ACTIVE", date: "2026-12-20" },
];

for (const p of projects) {
  const existing = await prisma.project.findFirst({ where: { project_name: p.name, tenant_fk: TENANT_ID } });
  if (existing) continue;
  await prisma.project.create({
    data: {
      tenant_fk: TENANT_ID,
      project_name: p.name,
      project_location: p.location,
      project_date: new Date(p.date),
      project_type: p.type,
      project_is_active: p.status,
    },
  });
}
console.log(`Projects: ${projects.length} ready`);

// ============================================================
// TASKS
// ============================================================
const priorities = ["HIGH", "NORMAL", "LOW"];
const taskOwners = [OWNER_ID, SALES_ID, HARDIK_ID];
const tasks = [
  { subject: "Quarterly business review call", desc: "Schedule QBR with TechNova leadership", priority: "HIGH", ownerIdx: 0, dueDays: 7 },
  { subject: "Send proposal to Global Mfg", desc: "Proposal for plant automation upgrade", priority: "HIGH", ownerIdx: 1, dueDays: 3 },
  { subject: "Follow up with RetailMax", desc: "Check on POS rollout contract status", priority: "NORMAL", ownerIdx: 0, dueDays: 5 },
  { subject: "FinTrust onboarding call", desc: "Welcome call for new risk platform", priority: "HIGH", ownerIdx: 1, dueDays: 2 },
  { subject: "HealthFirst debrief", desc: "Understand why they didn't proceed", priority: "LOW", ownerIdx: 0, dueDays: 10 },
  { subject: "EduLearn contract signing", desc: "Prepare documents for admissions portal", priority: "NORMAL", ownerIdx: 0, dueDays: 4 },
  { subject: "SkyHigh listing photos", desc: "Schedule photographer for condo listings", priority: "NORMAL", ownerIdx: 1, dueDays: 6 },
  { subject: "ConsultPro strategy workshop", desc: "Facilitate digital transformation workshop", priority: "HIGH", ownerIdx: 0, dueDays: 8 },
  { subject: "NexGen delivery timeline", desc: "Review last-mile delivery hub milestones", priority: "NORMAL", ownerIdx: 1, dueDays: 3 },
  { subject: "BuildWell site visit", desc: "Inspect bridge reconstruction progress", priority: "HIGH", ownerIdx: 0, dueDays: 12 },
  { subject: "QuickServe support SLA", desc: "Review IT support SLA compliance", priority: "LOW", ownerIdx: 1, dueDays: 14 },
  { subject: "Meridian compliance review", desc: "Annual compliance audit prep", priority: "NORMAL", ownerIdx: 0, dueDays: 20 },
  { subject: "GreenField harvest season", desc: "Prepare agri-tech implementation for harvest", priority: "NORMAL", ownerIdx: 1, dueDays: 30 },
  { subject: "Urban Living open house", desc: "Coordinate luxury condo open house events", priority: "LOW", ownerIdx: 0, dueDays: 18 },
  { subject: "Strategic growth planning", desc: "Annual planning session with partners", priority: "HIGH", ownerIdx: 1, dueDays: 25 },
  { subject: "TechNova product demo", desc: "Schedule product analytics demo for Andrew", priority: "NORMAL", ownerIdx: 0, dueDays: 5 },
  { subject: "FinTrust branch training", desc: "Train branch managers on digital banking", priority: "HIGH", ownerIdx: 1, dueDays: 10 },
  { subject: "RetailMax inventory audit", desc: "Follow up on store inventory system", priority: "NORMAL", ownerIdx: 0, dueDays: 15 },
  { subject: "MediaCorp win-back", desc: "Re-engage Laura Clark after lost deal", priority: "HIGH", ownerIdx: 1, dueDays: 7 },
  { subject: "Auto parts order follow-up", desc: "Check on Steven Lewis procurement order", priority: "NORMAL", ownerIdx: 0, dueDays: 9 },
];

for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i];
  const existing = await prisma.task.findFirst({ where: { task_subject: t.subject, tenant_fk: TENANT_ID } });
  if (existing) continue;
  await prisma.task.create({
    data: {
      tenant_fk: TENANT_ID,
      task_subject: t.subject,
      task_description: t.desc,
      task_priority: priorities[i % priorities.length],
      task_due_date: new Date(Date.now() + t.dueDays * 86400000),
      task_user_fk: taskOwners[i % taskOwners.length],
    },
  });
}
console.log(`Tasks: ${tasks.length} ready`);

// ============================================================
// CAMPAIGNS
// ============================================================
const campaigns = [
  "Q4 Enterprise Outreach",
  "Manufacturing Automation Roadshow",
  "Holiday Retail Campaign",
  "FinTech Innovation Series",
  "Healthcare Partnership Program",
  "Education Technology Grant",
  "Luxury Real Estate Showcase",
  "Consulting Excellence Forum",
];

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
console.log(`Campaigns: ${campaigns.length} ready`);

// Summary
const summary = {
  accounts: await prisma.account.count({ where: { tenant_fk: TENANT_ID, account_deleted_at: null } }),
  contacts: await prisma.contact.count({ where: { tenant_fk: TENANT_ID, contact_deleted_at: null } }),
  opportunities: await prisma.opportunity.count({ where: { tenant_fk: TENANT_ID } }),
  projects: await prisma.project.count({ where: { tenant_fk: TENANT_ID, project_deleted_at: null } }),
  tasks: await prisma.task.count({ where: { tenant_fk: TENANT_ID, task_deleted_at: null } }),
  campaigns: await prisma.campaign.count({ where: { tenant_fk: TENANT_ID, campaign_deleted_at: null } }),
};

console.log("Demo data complete:", JSON.stringify(summary));

await prisma.$disconnect();
