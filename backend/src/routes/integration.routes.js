import express from "express";
import { verifyIntegration } from "../middleware/integration.middleware.js";
import {
  entitlementEventHandler,
  provisionOrganizationHandler,
} from "../controllers/integration.controller.js";

const router = express.Router();

// Raw body is required for signature verification over exact bytes.
router.use(express.raw({ type: "application/json", limit: "1mb" }), verifyIntegration);

router.post("/organizations/provision", provisionOrganizationHandler);
router.post("/entitlements/sync", entitlementEventHandler);

export default router;
