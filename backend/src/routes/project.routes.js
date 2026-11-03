import express from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProjects,
  getProjectEnums,
  getProjectById,
} from "../controllers/project.controller.js";

const router = express.Router();

router.get("/enums", getProjectEnums);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", createProject);
router.put("/:id", updateProject);
router.post("/delete", deleteProjects);

export default router;
