import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";
import { canDoAction } from "../lib/modules.js";

export const globalSearch = async (req, res) => {
  try {
    const { q, type = "all" } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const searchStr = q.toLowerCase();
    const filterType = type.toLowerCase();

    const results = [];

    // Query across major entities concurrently based on filterType
    const promises = [];

    // Accounts
    if ((filterType === "all" || filterType === "accounts") && canDoAction(req.user, "ACCOUNTS", "VIEW")) {
      promises.push(
        prisma.account.findMany({
          where: { account_name: { contains: searchStr }, ...getTenantFilter(req) },
          take: filterType === "all" ? 5 : 20,
          select: { account_id: true, account_name: true },
        }).then(res => results.push(...res.map(acc => ({
          id: acc.account_id,
          title: acc.account_name,
          subtitle: "Account",
          type: "account",
        }))))
      );
    }

    // Contacts
    if ((filterType === "all" || filterType === "contacts") && canDoAction(req.user, "CONTACTS", "VIEW")) {
      promises.push(
        prisma.contact.findMany({
          where: {
            OR: [
              { contact_firstname: { contains: searchStr } },
              { contact_lastname: { contains: searchStr } },
              { contact_professional_email: { contains: searchStr } },
              { contact_mobile: { contains: searchStr } },
            ],
            ...getTenantFilter(req),
          },
          take: filterType === "all" ? 5 : 20,
          select: {
            contact_id: true,
            contact_firstname: true,
            contact_lastname: true,
            contact_professional_email: true,
            contact_account_fk: true,
          },
        }).then(res => results.push(...res.map(con => ({
          id: con.contact_id,
          title: `${con.contact_firstname || ""} ${con.contact_lastname || ""}`.trim() || "Unknown Contact",
          subtitle: con.contact_professional_email || "Contact",
          type: "contact",
          accountId: con.contact_account_fk,
        }))))
      );
    }

    // Opportunities
    if ((filterType === "all" || filterType === "opportunities") && canDoAction(req.user, "OPPORTUNITIES", "VIEW")) {
      promises.push(
        prisma.opportunity.findMany({
          where: { opportunity_name: { contains: searchStr }, ...getTenantFilter(req) },
          take: filterType === "all" ? 5 : 20,
          select: { opportunity_id: true, opportunity_name: true },
        }).then(res => results.push(...res.map(opp => ({
          id: opp.opportunity_id,
          title: opp.opportunity_name,
          subtitle: "Opportunity",
          type: "opportunity",
        }))))
      );
    }

    // Projects
    if ((filterType === "all" || filterType === "projects") && canDoAction(req.user, "PROJECTS", "VIEW")) {
      promises.push(
        prisma.project.findMany({
          where: { project_name: { contains: searchStr }, ...getTenantFilter(req) },
          take: filterType === "all" ? 3 : 20,
          select: { project_id: true, project_name: true },
        }).then(res => results.push(...res.map(proj => ({
          id: proj.project_id,
          title: proj.project_name || "Unknown Project",
          subtitle: "Project",
          type: "project",
        }))))
      );
    }

    await Promise.all(promises);

    res.status(200).json(results);
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: "Failed to search" });
  }
};
