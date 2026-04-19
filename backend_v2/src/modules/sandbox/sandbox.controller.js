import * as sandboxService from "./sandbox.service.js";

export const startSession = (req, res) => {
  const { url } = req.body;
  const session = sandboxService.startSession(url);
  res.json(session);
};

export const addEvent = (req, res) => {
  const { session_id, event } = req.body;
  const updated = sandboxService.addEvent(session_id, event);
  res.json(updated);
};

export const analyzeSession = (req, res) => {
  // TEMP mock (AI later)
  res.json({
    risk_score: 70,
    risk_level: "MEDIUM",
    scam_detected: true,
    patterns: ["credential_harvesting"],
    reasons: ["Login form detected"],
    explanation: "Potential phishing behavior",
    recommended_action: "warn"
  });
};