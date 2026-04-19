import express from "express";
import {
  startSession,
  addEvent,
  analyzeSession,
} from "./sandbox.controller.js";

const router = express.Router();

router.post("/start", startSession);
router.post("/event", addEvent);
router.post("/analyze", analyzeSession);

export default router;