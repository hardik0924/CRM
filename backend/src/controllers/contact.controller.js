import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";
import { findOrCreateIndustry } from "../lib/industries.js";

export const getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Search by name, code, email or linked account name. Soft-deleted rows never come back.
    const where = search
      ? {
          contact_deleted_at: null,
          OR: [
            { contact_firstname: { contains: search } },
            { contact_lastname: { contains: search } },
            { contact_code: { contains: search } },
            { contact_professional_email: { contains: search } },
            { account: { account_name: { contains: search } } },
          ],
          ...getTenantFilter(req),
        }
      : { contact_deleted_at: null, ...getTenantFilter(req) };

    // Fetch data and count in parallel
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: { select: { account_name: true } },
          contact_owner: { select: { user_name: true } },
        },
        orderBy: { contact_created_at: "desc" },
      }),
      prisma.contact.count({ where }),
    ]);
    console.log("Contacts Fetched Successfully");

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contacts" });
  }
};

export const createContact = async (req, res) => {
  try {
    const {
      contact_salutation,
      contact_firstname,
      contact_middlename,
      contact_lastname,
      contact_suffix,
      contact_title,
      contact_designation,
      contact_role,
      contact_department,
      contact_partner_name,
      contact_reportsto,
      contact_professional_email,
      contact_personal_email,
      contact_phone,
      contact_mobile,
      contact_alternate_number,
      contact_landline_number,
      contact_fax_number,
      contact_profile_link,
      contact_navigator_link,
      contact_account_fk,
      contact_industry_fk,
      contact_project_fk,
      contact_campaign_fk,
      contact_owner_fk,
      contact_call_status,
      contact_email_status,
      contact_phone_status,
      contact_status,
      contact_segment,
      contact_level_field,
      contact_tpid,
      contact_employee_size,
      contact_city,
      contact_state,
      contact_country,
      contact_pickup_date,
      contact_pickup_time,
      contact_pickup_location,
      contact_drop_date,
      contact_drop_time,
      contact_drop_location,

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

    if (!contact_firstname || !contact_lastname) {
      return res
        .status(400)
        .json({ success: false, message: "First and last name are required" });
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

    const lastContact = await prisma.contact.findFirst({
      orderBy: { contact_created_at: "desc" },
      select: { contact_code: true },
    });

    let newCodeNumber = 1;
    if (lastContact && lastContact.contact_code) {
      const lastNumber = parseInt(lastContact.contact_code.split("-")[1], 10);
      if (!isNaN(lastNumber)) newCodeNumber = lastNumber + 1;
    }
    const generatedCode = `CON-${String(newCodeNumber).padStart(6, "0")}`;

    let resolvedIndustryId = contact_industry_fk || null;
    if (
      contact_industry_fk &&
      !contact_industry_fk.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    ) {
      const industry = await findOrCreateIndustry(
        prisma,
        tenantId,
        contact_industry_fk,
      );
      resolvedIndustryId = industry?.industry_id || null;
    }

    let resolvedOwnerId = contact_owner_fk || req.user.id;
    if (resolvedOwnerId) {
      const ownerExists = await prisma.user.findUnique({
        where: { user_id: resolvedOwnerId },
      });
      if (!ownerExists) {
        return res.status(400).json({ success: false, message: "Invalid user session. The logged-in user no longer exists in the database. Please log out and log back in." });
      }
    }

    const newContact = await prisma.contact.create({
      data: {
        tenant_fk: tenantId,
        contact_code: generatedCode,
        contact_salutation: contact_salutation || null,
        contact_firstname,
        contact_middlename,
        contact_lastname,
        contact_suffix,
        contact_title,
        contact_designation,
        contact_role,
        contact_department,
        contact_partner_name,
        contact_reportsto,
        contact_professional_email,
        contact_personal_email,
        contact_phone,
        contact_mobile,
        contact_alternate_number,
        contact_landline_number,
        contact_fax_number,
        contact_profile_link,
        contact_navigator_link,
        contact_account_fk: contact_account_fk || null,
        contact_industry_fk: resolvedIndustryId,
        contact_project_fk: contact_project_fk || null,
        contact_campaign_fk: contact_campaign_fk || null,
        contact_owner_fk: resolvedOwnerId,

        contact_call_status: contact_call_status || null,
        contact_email_status: contact_email_status || null,
        contact_phone_status: contact_phone_status || null,
        contact_status: contact_status || "ACTIVE",

        contact_segment,
        contact_level_field,
        contact_tpid,
        contact_employee_size,
        contact_city,
        contact_state,
        contact_country,
        contact_pickup_date: contact_pickup_date
          ? new Date(contact_pickup_date)
          : null,
        contact_pickup_time,
        contact_pickup_location,
        contact_drop_date: contact_drop_date
          ? new Date(contact_drop_date)
          : null,
        contact_drop_time,
        contact_drop_location,

        contact_account_billing_address:
          billing_street || billing_city || billing_country
            ? {
                create: {
                  billing_street,
                  billing_city,
                  billing_state,
                  billing_zip,
                  billing_country,
                },
              }
            : undefined,

        contact_account_shipping_address:
          shipping_street || shipping_city || shipping_country
            ? {
                create: {
                  shipping_street,
                  shipping_city,
                  shipping_state,
                  shipping_zip,
                  shipping_country,
                },
              }
            : undefined,
      },
      include: {
        account: { select: { account_name: true } },
        contact_owner: { select: { user_name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contact_salutation,
      contact_firstname,
      contact_middlename,
      contact_lastname,
      contact_suffix,
      contact_title,
      contact_designation,
      contact_role,
      contact_department,
      contact_partner_name,
      contact_reportsto,
      contact_professional_email,
      contact_personal_email,
      contact_phone,
      contact_mobile,
      contact_alternate_number,
      contact_landline_number,
      contact_fax_number,
      contact_profile_link,
      contact_navigator_link,
      contact_account_fk,
      contact_industry_fk,
      contact_project_fk,
      contact_campaign_fk,
      contact_owner_fk,
      contact_call_status,
      contact_email_status,
      contact_phone_status,
      contact_status,
      contact_segment,
      contact_level_field,
      contact_tpid,
      contact_employee_size,
      contact_city,
      contact_state,
      contact_country,
      contact_pickup_date,
      contact_pickup_time,
      contact_pickup_location,
      contact_drop_date,
      contact_drop_time,
      contact_drop_location,

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

    const existingContact = await prisma.contact.findUnique({
      where: { contact_id: id },
      include: {
        contact_account_billing_address: true,
        contact_account_shipping_address: true,
      },
    });

    if (!existingContact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    let resolvedIndustryId = contact_industry_fk || null;
    if (
      contact_industry_fk &&
      !contact_industry_fk.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    ) {
      const industry = await findOrCreateIndustry(
        prisma,
        req.user.tenantFk || existingContact.tenant_fk,
        contact_industry_fk,
      );
      resolvedIndustryId = industry?.industry_id || null;
    }

    let resolvedOwnerId = contact_owner_fk || null;
    if (resolvedOwnerId) {
      const ownerExists = await prisma.user.findUnique({
        where: { user_id: resolvedOwnerId },
      });
      if (!ownerExists) {
        return res.status(400).json({ success: false, message: "Invalid user session. The logged-in user no longer exists in the database. Please log out and log back in." });
      }
    }

    await prisma.contact.update({
      where: { contact_id: id, ...getTenantFilter(req) },
      data: {
        contact_salutation: contact_salutation || null,
        contact_firstname,
        contact_middlename,
        contact_lastname,
        contact_suffix,
        contact_title,
        contact_designation,
        contact_role,
        contact_department,
        contact_partner_name,
        contact_reportsto,
        contact_professional_email,
        contact_personal_email,
        contact_phone,
        contact_mobile,
        contact_alternate_number,
        contact_landline_number,
        contact_fax_number,
        contact_profile_link,
        contact_navigator_link,
        contact_account_fk: contact_account_fk || null,
        contact_industry_fk: resolvedIndustryId,
        contact_project_fk: contact_project_fk || null,
        contact_campaign_fk: contact_campaign_fk || null,
        contact_owner_fk: resolvedOwnerId,

        contact_call_status: contact_call_status || null,
        contact_email_status: contact_email_status || null,
        contact_phone_status: contact_phone_status || null,
        contact_status: contact_status || "ACTIVE",

        contact_segment,
        contact_level_field,
        contact_tpid,
        contact_employee_size,
        contact_city,
        contact_state,
        contact_country,
        contact_pickup_date: contact_pickup_date
          ? new Date(contact_pickup_date)
          : null,
        contact_pickup_time,
        contact_pickup_location,
        contact_drop_date: contact_drop_date
          ? new Date(contact_drop_date)
          : null,
        contact_drop_time,
        contact_drop_location,
      },
    });

    const billingId =
      existingContact.contact_account_billing_address?.[0]?.billing_id;
    if (billing_street || billing_city || billing_country || billingId) {
      if (billingId) {
        await prisma.billing.update({
          where: { billing_id: billingId },
          data: {
            billing_street,
            billing_city,
            billing_state,
            billing_zip,
            billing_country,
          },
        });
      } else {
        await prisma.billing.create({
          data: {
            billing_street,
            billing_city,
            billing_state,
            billing_zip,
            billing_country,
            billing_contact_fk: id,
          },
        });
      }
    }

    const shippingId =
      existingContact.contact_account_shipping_address?.[0]?.shipping_id;
    if (shipping_street || shipping_city || shipping_country || shippingId) {
      if (shippingId) {
        await prisma.shipping.update({
          where: { shipping_id: shippingId },
          data: {
            shipping_street,
            shipping_city,
            shipping_state,
            shipping_zip,
            shipping_country,
          },
        });
      } else {
        await prisma.shipping.create({
          data: {
            shipping_street,
            shipping_city,
            shipping_state,
            shipping_zip,
            shipping_country,
            shipping_contact_fk: id,
          },
        });
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Contact updated successfully" });
  } catch (error) {
    console.error("Error updating contact:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findUnique({
      where: { contact_id: id, ...getTenantFilter(req) },
      include: {
        account: { select: { account_name: true } },
        contact_owner: { select: { user_name: true } },
        contact_industry: { select: { industry_name: true } },
        contact_project: { select: { project_name: true } },
        contact_campaign: true,
        contact_account_billing_address: true,
        contact_account_shipping_address: true,
        opportunities: {
          select: {
            opportunity_id: true,
            opportunity_name: true,
            opportunity_stage: true,
            opportunity_close_date: true,
          },
          orderBy: { opportunity_created_at: "desc" },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found"});
    }

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// DELETE /api/contacts/:id (soft delete)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.contact.updateMany({
      where: { contact_id: id, contact_deleted_at: null, ...getTenantFilter(req) },
      data: { contact_deleted_at: new Date() },
    });

    if (!deleted.count) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};