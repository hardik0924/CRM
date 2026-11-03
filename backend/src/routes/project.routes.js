import express from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProjects,
  getProjectEnums,
  getProjectById,
} from "../controllers/project.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();
const view = requirePermission("PROJECTS", "VIEW");
const create = requirePermission("PROJECTS", "CREATE");
const edit = requirePermission("PROJECTS", "EDIT");
const remove = requirePermission("PROJECTS", "DELETE");

router.get("/enums", view, getProjectEnums);
router.get("/", view, getProjects);
router.get("/:id", view, getProjectById);
router.post("/", create, createProject);
router.put("/:id", edit, updateProject);
router.post("/delete", remove, deleteProjects);

export default router;
