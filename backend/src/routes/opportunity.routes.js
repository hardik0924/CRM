import express from "express";
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunityById,
} from "../controllers/opportunity.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();
const view = requirePermission("OPPORTUNITIES", "VIEW");
const create = requirePermission("OPPORTUNITIES", "CREATE");
const edit = requirePermission("OPPORTUNITIES", "EDIT");
const remove = requirePermission("OPPORTUNITIES", "DELETE");

router.get("/", view, getOpportunities);
router.post("/", create, createOpportunity);
router.get("/:id", view, getOpportunityById);
router.put("/:id", edit, updateOpportunity);
router.delete("/:id", remove, deleteOpportunity);

export default router;
