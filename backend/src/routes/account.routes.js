import express from "express";
import { getAccounts, getAccountById, createAccount, updateAccount, deleteAccounts, getAccountTypes } from "../controllers/account.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();
const view = requirePermission("ACCOUNTS", "VIEW");
const create = requirePermission("ACCOUNTS", "CREATE");
const edit = requirePermission("ACCOUNTS", "EDIT");
const remove = requirePermission("ACCOUNTS", "DELETE");

router.get("/", view, getAccounts);
router.get("/types", view, getAccountTypes);
router.get("/:id", view, getAccountById);
router.post("/", create, createAccount);
router.put("/:id", edit, updateAccount);
router.delete("/", remove, deleteAccounts);

export default router;
