import { v4 as uuid } from "uuid";
import { db } from "../../config/db.js";
import { analyzeSandboxRisk } from "../ai/gemini.service.js";
import { createHttpError } from "./sandbox.model.js";
import { getGuardianForUser } from "../guardian/guardian.service.js";
import { createAlert } from "../alerts/alert.service.js";

const COLLECTION = "sandboxSessions";
const memoryStorage = new Map();

const getCollection = () => {
  if (db) return db.collection(COLLECTION);
  return {
    doc: (id) => ({
      set: async (data) => memoryStorage.set(id, data),
      get: async () => ({
        exists: memoryStorage.has(id),
        data: () => memoryStorage.get(id)
      })
    })
  };
};

const createSandboxUrl = (sessionId) =>
  `https://sandbox.example.com/session/${sessionId}`;

export const createSession = async ({
  url,
  device_type,
  session_mode,
  user_id,
}) => {
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
    createdAt: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    terminated_at: null,
    events: [],
    verdict: null,
  };

  await getCollection().doc(sessionId).set(session);

  return {
    session_id: session.session_id,
    status: session.status,
    sandbox_url: session.sandbox_url,
    expires_at: session.expires_at,
  };
};

export const getSessionById = async (sessionId) => {
  const doc = await getCollection().doc(sessionId).get();
  if (!doc.exists) {
    throw createHttpError(404, "Sandbox session not found");
  }
  return doc.data();
};

export const terminateSession = async (sessionId) => {
  const session = await getSessionById(sessionId);

  session.status = "terminated";
  session.terminated_at = new Date().toISOString();

  await getCollection().doc(sessionId).set(session);
  return session;
};

export const addEvent = async (sessionId, payload) => {
  const session = await getSessionById(sessionId);

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

  await getCollection().doc(sessionId).set(session);
  return event;
};

export const getEvents = async (sessionId) => {
  const session = await getSessionById(sessionId);
  return session.events;
};

export const buildMonitoringInput = async (sessionId) => {
  const session = await getSessionById(sessionId);

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

export const saveVerdict = async (sessionId, verdict) => {
  const session = await getSessionById(sessionId);

  session.verdict = verdict;

  if (verdict?.recommended_action?.toLowerCase().includes("terminate") || verdict?.risk_level === "HIGH") {
    session.status = "risk_flagged";
    
    // Check if the user is a dependent and has a guardian
    if (session.user_id) {
      const guardianId = getGuardianForUser(session.user_id);
      if (guardianId) {
        createAlert({
          guardianId,
          dependentId: session.user_id,
          type: "SANDBOX_HIGH_RISK",
          title: "High Risk Sandbox Activity Blocked",
          message: `Dependent encountered a high risk sandbox session. Verdict: ${verdict.verdict}. Reasons: ${verdict.reasons?.join(", ")}`,
          sessionId: session.session_id,
          url: session.current_url,
          read: false
        });
      }
    }
  }

  await getCollection().doc(sessionId).set(session);
  return verdict;
};

export const getVerdict = async (sessionId) => {
  const session = await getSessionById(sessionId);

  if (session.verdict) {
    return session.verdict;
  }

  const monitoringInput = await buildMonitoringInput(sessionId);
  const verdict = await analyzeSandboxRisk(monitoringInput);
  await saveVerdict(sessionId, verdict);
  return verdict;
};
