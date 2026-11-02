import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireTenantAdmin } from "../middleware/tenantAdmin.middleware.js";
import {
  inviteEmployee,
  listEmployees,
  resendEmployeeInvitation,
  updateEmployee,
} from "../controllers/organization.controller.js";

const router = express.Router();

router.use(authMiddleware, requireTenantAdmin);

router.get("/employees", listEmployees);
router.post("/employees/invite", inviteEmployee);
router.post("/employees/:userId/resend-invite", resendEmployeeInvitation);
router.patch("/employees/:userId", updateEmployee);

export default router;
