import express from "express";
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  createTenantUser,
  updateTenantUser,
  deleteTenantUser,
} from "../controllers/tenant.controller.js";
import { authMiddleware, superadminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// All tenant routes require superadmin
router.use(authMiddleware);
router.use(superadminOnly);

router.get("/", getTenants);
router.post("/", createTenant);
router.get("/:id", getTenant);
router.put("/:id", updateTenant);
router.delete("/:id", deleteTenant);

router.get("/:id/users", getTenantUsers);
router.post("/:id/users", createTenantUser);
router.put("/:id/users/:userId", updateTenantUser);
router.delete("/:id/users/:userId", deleteTenantUser);

export default router;
