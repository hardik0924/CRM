import express from "express";
import {
  createCall,
  getCalls,
  getCallById,
  updateCall,
  deleteCall,
} from "../controllers/call.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();
// Calls are part of the contact workspace, so they follow CONTACTS permissions.
const view = requirePermission("CONTACTS", "VIEW");
const create = requirePermission("CONTACTS", "CREATE");
const edit = requirePermission("CONTACTS", "EDIT");
const remove = requirePermission("CONTACTS", "DELETE");

router.post("/", create, createCall);
router.get("/", view, getCalls);
router.get("/:id", view, getCallById);
router.put("/:id", edit, updateCall);
router.delete("/:id", remove, deleteCall);

export default router;
