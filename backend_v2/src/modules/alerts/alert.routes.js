import express from "express";
import { createAlert, getGuardianAlerts, updateStatus } from "./alert.controller.js";

const router = express.Router();

router.post("/create", createAlert);
router.get("/guardian/:guardianId", getGuardianAlerts);
router.patch("/:id/status", updateStatus);

export default router;