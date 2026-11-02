import { prisma } from "../lib/prisma.js";
import { account_type } from "@prisma/client";
import { getTenantFilter } from "../middleware/auth.middleware.js";

export const getAccountTypes = async (req, res) => {
  try {
    // Prisma exposes enums as objects, so we get the values
    const types = Object.values(account_type);
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      account_deleted_at: null,
      ...getTenantFilter(req),
    };

    if (search) {
      where.OR = [
        { account_name: { contains: search } },
        { industry: { industry_name: { contains: search } } },
        { account_city: { contains: search } },
      ];
    }

    // Run both count and findMany concurrently for better performance
    const [accounts, totalRecords] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take,
        orderBy: { account_created_at: "desc" },
        include: {
          owner: {
            select: { user_id: true }, // Fetch the owner's name so we can display it in the table
          },
          industry: {
            select: { industry_name: true },
          },
          account_billing_address: true,
          account_shipping_address: true,
        },
      }),
      prisma.account.count({ where }),
    ]);

    console.log("Accounts Fetched Successfully");

    res.status(200).json({
      success: true,
      data: accounts.map((acc) => ({
        ...acc,
        account_industry: acc.industry?.industry_name || "",
      })),
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / take),
      },
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET /api/accounts/:id
// Fetches a single account by ID (useful for the "View" action)
export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await prisma.account.findUnique({
      where: { account_id: id, ...getTenantFilter(req) },
      include: {
        owner: {
          select: { user_name: true, user_email: true },
        },
        industry: {
          select: { industry_name: true },
        },
        account_billing_address: true,
        account_shipping_address: true,
        account_contacts: true,
      },
    });

    if (!account || account.account_deleted_at) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...account,
        account_industry: account.industry?.industry_name || "",
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// POST /api/accounts
// Creates a new account (useful for the "Add Account" action)
export const createAccount = async (req, res) => {
  try {
    const {
      account_name,
      account_owner_fk,
      account_industry,
      account_employees_size,
      account_city,
      account_website,
      account_type,
      account_phone,
      account_email,
      account_country,
      account_description,
      account_account_status,
      account_annual_revenue,

      // Billing
      billing_street,
      billing_city,
      billing_state,
      billing_zip,
      billing_country,

      // Shipping
      shipping_street,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
    } = req.body;

    if (!account_name) {
      return res.status(400).json({
        success: false,
        message: "Account name are required",
      });
    }

    // if (account_type === "") {
    //   account_type = "";
    // }

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

    const lastAccount = await prisma.account.findFirst({
      where: { tenant_fk: tenantId },
      orderBy: { account_created_at: "desc" },
      select: { account_code: true },
    });
    let newCodeNumber = 1;
    if (lastAccount && lastAccount.account_code) {
      const lastNumber = parseInt(lastAccount.account_code.split("-")[1], 10);
      if (!isNaN(lastNumber)) {
        newCodeNumber = lastNumber + 1;
      }
    }
    const generatedCode = `ACC-${String(newCodeNumber).padStart(6, "0")}`;

    const billingData =
      billing_street ||
      billing_city ||
      billing_state ||
      billing_zip ||
      billing_country
        ? {
            create: {
              billing_street,
              billing_city,
              billing_state,
              billing_zip,
              billing_country,
            },
          }
        : undefined;

    const shippingData =
      shipping_street ||
      shipping_city ||
      shipping_state ||
      shipping_zip ||
      shipping_country
        ? {
            create: {
              shipping_street,
              shipping_city,
              shipping_state,
              shipping_zip,
              shipping_country,
            },
          }
        : undefined;

    let industryId = null;
    if (account_industry) {
      const industry = await prisma.industry.findUnique({
        where: { industry_name: account_industry },
      });
      if (industry) {
        industryId = industry.industry_id;
      }
    }

    const newAccount = await prisma.account.create({
      data: {
        tenant_fk: tenantId,
        account_code: generatedCode,
        account_name,
        account_owner_fk,
        account_type: account_type || undefined,
        account_phone,
        account_email,
        account_city,
        account_country,
        account_industry_fk: industryId,
        account_description,
        account_account_status,
        account_website,
        account_employees_size: account_employees_size
          ? Number(account_employees_size)
          : null,
        account_annual_revenue: account_annual_revenue
          ? parseFloat(account_annual_revenue)
          : null,
        account_billing_address: billingData,
        account_shipping_address: shippingData,
      },
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { ...newAccount, account_industry: account_industry || "" },
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// PUT /api/accounts/:id
// Updates an existing account (useful for the "Edit" action)
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      account_name,
      account_owner_fk,
      account_industry,
      account_employees_size,
      account_city,
      account_website,
      account_type,
      account_phone,
      account_email,
      account_country,
      account_description,
      account_account_status,
      account_annual_revenue,
      account_parent_fk,
      billing_street,
      billing_city,
      billing_state,
      billing_zip,
      billing_country,
      shipping_street,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
    } = req.body;

    const dataToUpdate = {};

    if (account_name !== undefined) dataToUpdate.account_name = account_name;
    
    if (account_owner_fk) {
      dataToUpdate.owner = { connect: { user_id: account_owner_fk } };
    }

    if (account_employees_size !== undefined) {
      dataToUpdate.account_employees_size = account_employees_size ? Number(account_employees_size) : null;
    }
    
    if (account_annual_revenue !== undefined) {
      dataToUpdate.account_annual_revenue = account_annual_revenue ? parseFloat(account_annual_revenue) : null;
    }

    if (account_city !== undefined) dataToUpdate.account_city = account_city;
    if (account_website !== undefined) dataToUpdate.account_website = account_website;
    if (account_type !== undefined) dataToUpdate.account_type = account_type || undefined;
    if (account_phone !== undefined) dataToUpdate.account_phone = account_phone;
    if (account_email !== undefined) dataToUpdate.account_email = account_email;
    if (account_country !== undefined) dataToUpdate.account_country = account_country;
    if (account_description !== undefined) dataToUpdate.account_description = account_description;
    if (account_account_status !== undefined) dataToUpdate.account_account_status = account_account_status;

    if (account_parent_fk !== undefined) {
      if (account_parent_fk === null || account_parent_fk === "") {
        dataToUpdate.account_parent = { disconnect: true };
      } else {
        dataToUpdate.account_parent = { connect: { account_id: account_parent_fk } };
      }
    }

    if (account_industry) {
      const industry = await prisma.industry.findUnique({
        where: { industry_name: account_industry },
      });
      if (industry) {
        dataToUpdate.industry = { connect: { industry_id: industry.industry_id } };
      }
    } else if (account_industry === "") {
      dataToUpdate.industry = { disconnect: true };
    }

    if (
      billing_street !== undefined ||
      billing_city !== undefined ||
      billing_state !== undefined ||
      billing_zip !== undefined ||
      billing_country !== undefined
    ) {
      const hasBilling = billing_street || billing_city || billing_state || billing_zip || billing_country;
      dataToUpdate.account_billing_address = hasBilling
        ? {
            deleteMany: {},
            create: {
              billing_street,
              billing_city,
              billing_state,
              billing_zip,
              billing_country,
            },
          }
        : { deleteMany: {} };
    }

    if (
      shipping_street !== undefined ||
      shipping_city !== undefined ||
      shipping_state !== undefined ||
      shipping_zip !== undefined ||
      shipping_country !== undefined
    ) {
      const hasShipping = shipping_street || shipping_city || shipping_state || shipping_zip || shipping_country;
      dataToUpdate.account_shipping_address = hasShipping
        ? {
            deleteMany: {},
            create: {
              shipping_street,
              shipping_city,
              shipping_state,
              shipping_zip,
              shipping_country,
            },
          }
        : { deleteMany: {} };
    }

    const updatedAccount = await prisma.account.update({
      where: { account_id: id, ...getTenantFilter(req) },
      data: dataToUpdate,
    });

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating account:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// DELETE /api/accounts
// Deletes multiple accounts (useful when selecting rows via checkboxes and hitting a delete button)
export const deleteAccounts = async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of account_ids from the frontend

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of account IDs to delete",
      });
    }

    // Soft delete approach based on your schema having account_deleted_at
    await prisma.account.updateMany({
      where: {
        account_id: { in: ids },
        ...getTenantFilter(req),
      },
      data: {
        account_deleted_at: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: `${ids.length} accounts deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting accounts:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
