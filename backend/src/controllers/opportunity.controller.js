import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";

export const getOpportunities = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      ...getTenantFilter(req),
    };
    if (search) {
      where.OR = [{ opportunity_name: { contains: search } }];
    }

    const [opportunities, totalRecords] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take,
        orderBy: { opportunity_created_at: "desc" },
        include: {
          opportunity_owner: { select: { user_name: true } },
          opportunity_account: { select: { account_name: true } },
          opportunity_contact: {
            select: { contact_firstname: true, contact_lastname: true },
          },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    console.log("Opportunities Fetched Successfully");

    res.status(200).json({
      success: true,
      data: opportunities,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / take),
      },
    });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// // GET /api/opportunities/:id
// export const getOpportunityById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // TODO: fetch unique opportunity with prisma.opportunity.findUnique

//     res.status(200).json({ success: true, data: {} });
//   } catch (error) {
//     console.error("Error fetching opportunity:", error);
//     res.status(500).json({ success: false, message: "Server Error", error: error.message });
//   }
// };

// // POST /api/opportunities
// POST /api/opportunities
export const createOpportunity = async (req, res) => {
  try {
    const {
      opportunity_name,
      opportunity_owner_fk,
      opportunity_close_date,
      ...otherFields
    } = req.body;

    if (!opportunity_name || !opportunity_owner_fk || !opportunity_close_date) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: Name, Owner, and Close Date are mandatory.",
      });
    }

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

    // Clean up fields: remove empty strings, properly format dates
    const dataToSave = {
      tenant_fk: tenantId,
      opportunity_name,
      opportunity_owner_fk,
      opportunity_close_date: new Date(opportunity_close_date),
    };

    const dateFields = [
      "opportunity_pitched_at",
      "opportunity_pickup_date",
      "opportunity_drop_date",
    ];

    for (const [key, value] of Object.entries(otherFields)) {
      if (value === "" || value === null || value === undefined) continue;

      if (dateFields.includes(key)) {
        dataToSave[key] = new Date(value);
      } else {
        dataToSave[key] = value;
      }
    }

    const newOpportunity = await prisma.opportunity.create({
      data: dataToSave,
    });

    res.status(201).json({
      success: true,
      message: "Opportunity created",
      data: newOpportunity,
    });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// PUT /api/opportunities/:id
export const updateOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      opportunity_name,
      opportunity_owner_fk,
      opportunity_close_date,
      ...otherFields
    } = req.body;

    // Clean up fields: remove empty strings, properly format dates
    const dataToSave = {};

    if (opportunity_name) dataToSave.opportunity_name = opportunity_name;
    if (opportunity_owner_fk)
      dataToSave.opportunity_owner_fk = opportunity_owner_fk;
    if (opportunity_close_date)
      dataToSave.opportunity_close_date = new Date(opportunity_close_date);

    const dateFields = [
      "opportunity_pitched_at",
      "opportunity_pickup_date",
      "opportunity_drop_date",
    ];

    for (const [key, value] of Object.entries(otherFields)) {
      if (value === "") {
        dataToSave[key] = null; // Clear out the field if empty string is passed during update
        continue;
      }
      if (value === null || value === undefined) continue;

      if (dateFields.includes(key)) {
        dataToSave[key] = new Date(value);
      } else {
        dataToSave[key] = value;
      }
    }

    const updatedOpportunity = await prisma.opportunity.update({
      where: { opportunity_id: id, ...getTenantFilter(req) },
      data: dataToSave,
    });

    res.status(200).json({
      success: true,
      message: "Opportunity updated",
      data: updatedOpportunity,
    });
  } catch (error) {
    console.error("Error updating opportunity:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// // DELETE /api/opportunities/:id
// export const deleteOpportunity = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // TODO: Write delete or soft-delete logic here

//     res.status(200).json({ success: true, message: "Opportunity deleted" });
//   } catch (error) {
//     console.error("Error deleting opportunity:", error);
//     res.status(500).json({ success: false, message: "Server Error", error: error.message });
//   }
// };
