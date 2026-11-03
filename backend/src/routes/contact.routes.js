import express from "express";
import {
  getContacts,
  createContact,
  updateContact,
  getContactById,
  deleteContact,
} from "../controllers/contact.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();
const view = requirePermission("CONTACTS", "VIEW");
const create = requirePermission("CONTACTS", "CREATE");
const edit = requirePermission("CONTACTS", "EDIT");
const remove = requirePermission("CONTACTS", "DELETE");

router.get("/", view, getContacts);
router.post("/", create, createContact);
router.get("/:id", view, getContactById);
router.put("/:id", edit, updateContact);
router.delete("/:id", remove, deleteContact);

export default router;
