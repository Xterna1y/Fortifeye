import express from "express";
import {
  addEvent,
  analyzeSession,
  createSession,
  getEvents,
  getSession,
  getVerdict,
  legacyAddEvent,
  openSandbox,
  terminateSession,
} from "./sandbox.controller.js";

const router = express.Router();

router.post("/session", createSession);
router.get("/session/:id", getSession);
router.post("/session/:id/terminate", terminateSession);
router.post("/session/:id/events", addEvent);
router.get("/session/:id/events", getEvents);
router.get("/session/:id/verdict", getVerdict);

// Compatibility routes for the current frontend/stubbed calls.
router.post("/open", openSandbox);
router.post("/event", legacyAddEvent);
router.post("/analyze", analyzeSession);

export default router;
