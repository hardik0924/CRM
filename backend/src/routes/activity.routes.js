import express from "express";
import { getActivity } from "../controllers/activity.controller.js";

const router = express.Router();

router.get("/", getActivity);

export default router;
