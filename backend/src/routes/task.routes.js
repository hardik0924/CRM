import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();
const view = requirePermission("TASKS", "VIEW");
const create = requirePermission("TASKS", "CREATE");
const edit = requirePermission("TASKS", "EDIT");
const remove = requirePermission("TASKS", "DELETE");

router.post("/", create, createTask);
router.get("/", view, getTasks);
router.get("/:id", view, getTaskById);
router.put("/:id", edit, updateTask);
router.patch("/:id", edit, updateTask);
router.delete("/:id", remove, deleteTask);

export default router;
