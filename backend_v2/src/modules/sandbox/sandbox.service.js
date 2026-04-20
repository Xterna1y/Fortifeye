import { v4 as uuid } from "uuid";
import { readData, writeData } from "../../config/db.js";
import { analyzeSandboxRisk } from "../ai/gemini.service.js";
import { createHttpError } from "./sandbox.model.js";

const DATA_FILE = "sandboxSessions";

const readSessions = () => readData(DATA_FILE);
const writeSessions = (sessions) => writeData(DATA_FILE, sessions);

const findSessionIndex = (sessions, sessionId) =>
  sessions.findIndex((session) => session.session_id === sessionId);

const getSessionOrThrow = (sessions, sessionId) => {
  const index = findSessionIndex(sessions, sessionId);

  if (index === -1) {
    throw createHttpError(404, "Sandbox session not found");
  }

  return { session: sessions[index], index };
};

const createSandboxUrl = (sessionId) =>
  `https://sandbox.example.com/session/${sessionId}`;

export const createSession = ({
  url,
  device_type,
  session_mode,
  user_id,
}) => {
  const sessions = readSessions();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  const sessionId = `sess_${uuid().slice(0, 8)}`;

  const session = {
    session_id: sessionId,
    status: "starting",
    submitted_url: url,
    current_url: url,
    page_title: null,
    sandbox_url: createSandboxUrl(sessionId),
    device_type,
    session_mode,
    user_id,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    terminated_at: null,
    events: [],
    verdict: null,
  };

  sessions.push(session);
  writeSessions(sessions);

  return {
    session_id: session.session_id,
    status: session.status,
    sandbox_url: session.sandbox_url,
    expires_at: session.expires_at,
  };
};

export const getSessionById = (sessionId) => {
  const sessions = readSessions();
  return getSessionOrThrow(sessions, sessionId).session;
};

export const terminateSession = (sessionId) => {
  const sessions = readSessions();
  const { session, index } = getSessionOrThrow(sessions, sessionId);

  session.status = "terminated";
  session.terminated_at = new Date().toISOString();
  sessions[index] = session;

  writeSessions(sessions);
  return session;
};

export const addEvent = (sessionId, payload) => {
  const sessions = readSessions();
  const { session, index } = getSessionOrThrow(sessions, sessionId);

  if (session.status === "terminated") {
    throw createHttpError(400, "Cannot add event to a terminated session");
  }

  const event = {
    session_id: sessionId,
    event_id: `evt_${uuid().slice(0, 8)}`,
    event_type: payload.event_type,
    event_time: payload.event_time || new Date().toISOString(),
    details: payload.details || {},
  };

  if (event.event_type === "redirect" && event.details.to_url) {
    session.current_url = event.details.to_url;
  }

  if (event.event_type === "domain_change" && event.details.new_url) {
    session.current_url = event.details.new_url;
  }

  if (event.details?.page_title) {
    session.page_title = event.details.page_title;
  }

  if (session.status === "starting") {
    session.status = "active";
  }

  session.events.push(event);
  sessions[index] = session;

  writeSessions(sessions);
  return event;
};

export const getEvents = (sessionId) => getSessionById(sessionId).events;

export const buildMonitoringInput = (sessionId) => {
  const session = getSessionById(sessionId);

  return {
    session_id: session.session_id,
    submitted_url: session.submitted_url,
    current_url: session.current_url,
    page_title: session.page_title || "Unknown Page",
    events: session.events.map((event) => {
      if (
        event.event_type === "download_attempt" &&
        event.details?.file_type === "apk"
      ) {
        return "apk_download_attempt";
      }

      if (event.event_type === "domain_change") {
        return "redirect_to_unknown_domain";
      }

      return event.event_type;
    }),
    device_type: session.device_type,
  };
};

export const saveVerdict = (sessionId, verdict) => {
  const sessions = readSessions();
  const { session, index } = getSessionOrThrow(sessions, sessionId);

  session.verdict = verdict;

  if (verdict?.recommended_action?.toLowerCase() === "block") {
    session.status = "risk_flagged";
  }

  sessions[index] = session;
  writeSessions(sessions);
  return verdict;
};

export const getVerdict = async (sessionId) => {
  const session = getSessionById(sessionId);

  if (session.verdict) {
    return session.verdict;
  }

  const monitoringInput = buildMonitoringInput(sessionId);
  const verdict = await analyzeSandboxRisk(monitoringInput);
  saveVerdict(sessionId, verdict);
  return verdict;
};
