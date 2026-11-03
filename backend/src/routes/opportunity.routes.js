import express from "express";
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunityById,
} from "../controllers/opportunity.controller.js";

const router = express.Router();

router.get("/", getOpportunities);
router.post("/", createOpportunity);
router.get("/:id", getOpportunityById);
router.put("/:id", updateOpportunity);
router.delete("/:id", deleteOpportunity);

export default router;
