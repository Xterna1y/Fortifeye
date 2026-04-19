import * as alertService from "./alert.service.js";
import { terminateSession } from "../sandbox/sandbox.service.js";

export const createAlert = (req, res) => {
  const alert = alertService.createAlert(req.body);
  res.json(alert);
};

export const getGuardianAlerts = (req, res) => {
  const alerts = alertService.getAlertsByGuardian(req.params.guardianId);
  res.json(alerts);
};

export const updateStatus = (req, res) => {
  const alert = alertService.updateAlertStatus(req.params.id, req.body.status);
  
  if (!alert) {
    return res.status(404).json({ message: "Alert not found" });
  }

  // If guardian blocks and there is a session ID, terminate the session
  if (req.body.status === "blocked" && alert.sessionId) {
    try {
      terminateSession(alert.sessionId);
    } catch (error) {
      console.error("Failed to terminate session on block:", error.message);
    }
  }

  res.json(alert);
};