import { prisma } from "../lib/prisma.js";
import { getTenantFilter } from "../middleware/auth.middleware.js";

const cleanName = (value) => {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name ? name.slice(0, 191) : null;
};

export const getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const take = Math.max(1, Number(limit) || 20);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const where = { campaign_deleted_at: null, ...getTenantFilter(req) };
    if (search) where.campaign_name = { contains: search };

    const [campaigns, totalRecords] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { campaign_created_at: "desc" },
        include: {
          user: { select: { user_name: true } },
          _count: { select: { contacts: true, opportunities: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / take),
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const name = cleanName(req.body?.campaign_name);
    if (!name) {
      return res.status(400).json({ success: false, message: "Campaign name is required" });
    }

    let tenantId = req.user.tenantFk;
    if (req.user.role === "SUPER_ADMIN" && req.body.tenant_fk) {
      tenantId = req.body.tenant_fk;
    }
    if (!tenantId) {
      return res.status(400).json({ success: false, message: "No tenant context for this campaign" });
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenant_fk: tenantId,
        campaign_name: name,
        campaign_user_fk: req.body?.campaign_user_fk || null,
      },
    });

    res.status(201).json({ success: true, message: "Campaign created", data: campaign });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET /api/campaigns/:id
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { campaign_id: id, ...getTenantFilter(req) },
      include: {
        user: { select: { user_name: true } },
      },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const name = cleanName(req.body?.campaign_name);
    if (!name) {
      return res.status(400).json({ success: false, message: "Campaign name is required" });
    }

    const campaign = await prisma.campaign.update({
      where: { campaign_id: id, ...getTenantFilter(req) },
      data: {
        campaign_name: name,
        ...(req.body.campaign_user_fk !== undefined
          ? { campaign_user_fk: req.body.campaign_user_fk || null }
          : {}),
      },
    });

    res.status(200).json({ success: true, message: "Campaign updated", data: campaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.campaign.updateMany({
      where: { campaign_id: id, campaign_deleted_at: null, ...getTenantFilter(req) },
      data: { campaign_deleted_at: new Date() },
    });

    if (!deleted.count) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
