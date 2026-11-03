import express from "express";
import {
  getContacts,
  createContact,
  updateContact,
  getContactById,
  deleteContact,
} from "../controllers/contact.controller.js";

const router = express.Router();

router.get("/", getContacts);
router.post("/", createContact);
router.get("/:id", getContactById);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
