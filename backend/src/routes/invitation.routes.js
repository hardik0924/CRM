import express from "express";
import { accept, preview } from "../controllers/invitation.controller.js";

const router = express.Router();

router.get("/:token", preview);
router.post("/accept", accept);

export default router;
