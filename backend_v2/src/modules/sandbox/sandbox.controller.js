import * as sandboxService from "./sandbox.service.js";
import {
  createHttpError,
  validateCreateSessionBody,
  validateEventBody,
} from "./sandbox.model.js";

const handleError = (res, error) => {
  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
  });
};

export const createSession = (req, res) => {
  try {
    const payload = validateCreateSessionBody(req.body);
    const session = sandboxService.createSession(payload);
    res.status(201).json(session);
  } catch (error) {
    handleError(res, error);
  }
};

export const getSession = (req, res) => {
  try {
    const session = sandboxService.getSessionById(req.params.id);
    res.json(session);
  } catch (error) {
    handleError(res, error);
  }
};

export const terminateSession = (req, res) => {
  try {
    const session = sandboxService.terminateSession(req.params.id);
    res.json(session);
  } catch (error) {
    handleError(res, error);
  }
};

export const addEvent = async (req, res) => {
  try {
    const eventPayload = validateEventBody(req.body);
    const event = sandboxService.addEvent(req.params.id, eventPayload);
    const latestVerdict = await sandboxService.getVerdict(req.params.id);

    res.status(201).json({
      message: "Event recorded",
      event,
      latest_verdict: latestVerdict,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getEvents = (req, res) => {
  try {
    const events = sandboxService.getEvents(req.params.id);
    res.json({
      session_id: req.params.id,
      events,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getVerdict = async (req, res) => {
  try {
    const verdict = await sandboxService.getVerdict(req.params.id);
    res.json({
      session_id: req.params.id,
      verdict,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const openSandbox = (req, res) => createSession(req, res);

export const legacyAddEvent = async (req, res) => {
  try {
    const { session_id, event } = req.body || {};

    if (!session_id || !event || typeof event !== "object") {
      throw createHttpError(
        400,
        "session_id and event object are required for this route",
      );
    }

    req.params.id = session_id;
    req.body = event;
    await addEvent(req, res);
  } catch (error) {
    handleError(res, error);
  }
};

export const analyzeSession = async (req, res) => {
  try {
    const { session_id } = req.body || {};

    if (!session_id || typeof session_id !== "string") {
      throw createHttpError(400, "session_id is required");
    }

    const verdict = await sandboxService.getVerdict(session_id);
    res.json(verdict);
  } catch (error) {
    handleError(res, error);
  }
};
