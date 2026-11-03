import express from "express";
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignById,
} from "../controllers/campaign.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();
const view = requirePermission("CAMPAIGNS", "VIEW");
const create = requirePermission("CAMPAIGNS", "CREATE");
const edit = requirePermission("CAMPAIGNS", "EDIT");
const remove = requirePermission("CAMPAIGNS", "DELETE");

router.get("/", view, getCampaigns);
router.post("/", create, createCampaign);
router.get("/:id", view, getCampaignById);
router.put("/:id", edit, updateCampaign);
router.delete("/:id", remove, deleteCampaign);

export default router;
