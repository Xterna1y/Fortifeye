import express from "express";
import {
  createAlert,
  getDependentAlerts,
  getGuardianAlerts,
  updateStatus,
} from "./alert.controller.js";

const router = express.Router();

router.post("/create", createAlert);
router.get("/guardian/:guardianId", getGuardianAlerts);
router.get("/dependent/:dependentId", getDependentAlerts);
router.patch("/:id/status", updateStatus);

export default router;
