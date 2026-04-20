import { db } from "../../config/db.js";
import { getLinks } from "../guardian/guardian.service.js";

const startOfTodayIso = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
};

const toDateValue = (value) => new Date(value || 0).getTime();

const riskWeight = (riskLevel) => {
  switch ((riskLevel || "").toUpperCase()) {
    case "HIGH":
      return 0;
    case "MEDIUM":
      return 0.45;
    case "LOW":
      return 1;
    default:
      return 0.7;
  }
};

const mapRiskType = (riskLevel) => {
  switch ((riskLevel || "").toUpperCase()) {
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    default:
      return "success";
  }
};

const safeScoreLabel = (score) => {
  if (score >= 80) return "High";
  if (score >= 55) return "Moderate";
  return "Low";
};

const summarizeScanMessage = (scan) => {
  const subject =
    scan.type === "voice" ? "call" : scan.type === "url" ? "link" : "message";
  const riskLevel = (scan.risk_level || "").toUpperCase();

  if (riskLevel === "HIGH") return `High risk ${subject} detected`;
  if (riskLevel === "MEDIUM") return `Suspicious ${subject} flagged`;
  return `Safe ${subject} verified`;
};

const summarizeSessionMessage = (session) => {
  const riskLevel = (session.verdict?.risk_level || "").toUpperCase();

  if (riskLevel === "HIGH") return "High risk website blocked";
  if (riskLevel === "MEDIUM") return "Suspicious website flagged";
  return "Safe website verified";
};

const formatActivity = (item) => ({
  id: item.id,
  type: item.type,
  message: item.message,
  createdAt: item.createdAt,
});

const fetchCollectionByField = async (collectionName, field, value) => {
  if (!db) {
    return [];
  }

  const snapshot = await db.collection(collectionName).where(field, "==", value).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const getUserAlerts = async (userId) => {
  const [guardianAlerts, dependentAlerts] = await Promise.all([
    fetchCollectionByField("alerts", "guardianId", userId),
    fetchCollectionByField("alerts", "dependentId", userId),
  ]);

  const deduped = new Map();
  for (const alert of [...guardianAlerts, ...dependentAlerts]) {
    deduped.set(alert.id, alert);
  }

  return [...deduped.values()].sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt));
};

const getUserScans = async (userId) => {
  const scans = await fetchCollectionByField("scans", "userId", userId);
  return scans.sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt));
};

const getUserSessions = async (userId) => {
  const sessions = await fetchCollectionByField("sandboxSessions", "user_id", userId);
  return sessions.sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt));
};

const buildRecentActivity = (alerts, scans, sessions) => {
  const alertItems = alerts.map((alert) =>
    formatActivity({
      id: alert.id,
      type: mapRiskType(alert.riskLevel),
      message: alert.title || alert.message || "Security alert detected",
      createdAt: alert.createdAt,
    })
  );

  const scanItems = scans.map((scan) =>
    formatActivity({
      id: scan.id,
      type: mapRiskType(scan.risk_level),
      message: summarizeScanMessage(scan),
      createdAt: scan.createdAt,
    })
  );

  const sessionItems = sessions
    .filter((session) => session.verdict)
    .map((session) =>
      formatActivity({
        id: session.session_id,
        type: mapRiskType(session.verdict?.risk_level),
        message: summarizeSessionMessage(session),
        createdAt: session.createdAt,
      })
    );

  return [...alertItems, ...scanItems, ...sessionItems]
    .sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt))
    .slice(0, 3);
};

export const getDashboardData = async (userId) => {
  if (!db) {
    return {
      stats: {
        protected: 0,
        blocked: 0,
        verified: 0,
        alerts: 0,
      },
      recentAlerts: [],
      summary: {
        messagesAnalyzed: 0,
        callsScreened: 0,
        threatsBlocked: 0,
        safeTransactions: 0,
      },
      riskOverview: {
        level: "High",
        safeScore: 100,
      },
      guardian: {
        hasGuardian: false,
      },
      safetyTip:
        "Banks will never ask for your password or PIN via phone or message. Always verify requests through official channels.",
    };
  }

  const [alerts, scans, sessions, links] = await Promise.all([
    getUserAlerts(userId),
    getUserScans(userId),
    getUserSessions(userId),
    getLinks(userId),
  ]);

  const todayIso = startOfTodayIso();
  const todaysScans = scans.filter((scan) => (scan.createdAt || "") >= todayIso);
  const todaysSessions = sessions.filter((session) => (session.createdAt || "") >= todayIso);
  const todaysAlerts = alerts.filter((alert) => (alert.createdAt || "") >= todayIso);

  const riskyItems = [...scans, ...todaysSessions.map((session) => session.verdict || {})].filter(
    (item) => (item.risk_level || "").toUpperCase() === "HIGH"
  );
  const safeItems = [...scans, ...todaysSessions.map((session) => session.verdict || {})].filter(
    (item) => (item.risk_level || "").toUpperCase() === "LOW"
  );

  const evaluatedItems = [
    ...scans,
    ...sessions.filter((session) => session.verdict).map((session) => session.verdict),
  ];

  const safeScore = evaluatedItems.length
    ? Math.round(
        (evaluatedItems.reduce((total, item) => total + riskWeight(item.risk_level), 0) /
          evaluatedItems.length) *
          100
      )
    : 100;

  const threatsBlocked = todaysAlerts.filter(
    (alert) =>
      alert.status === "blocked" ||
      (alert.riskLevel || "").toUpperCase() === "HIGH" ||
      alert.type === "SANDBOX_HIGH_RISK"
  ).length;

  const hasGuardian = links.some((link) => link.role === "guardian");

  return {
    stats: {
      protected: scans.length + sessions.length,
      blocked: riskyItems.length,
      verified: safeItems.length,
      alerts: alerts.length,
    },
    recentAlerts: buildRecentActivity(alerts, scans, sessions),
    summary: {
      messagesAnalyzed: todaysScans.filter((scan) => scan.type === "text").length,
      callsScreened: todaysScans.filter((scan) => scan.type === "voice").length,
      threatsBlocked,
      safeTransactions: todaysScans.filter(
        (scan) =>
          (scan.risk_level || "").toUpperCase() === "LOW" ||
          (scan.recommended_action || "").toLowerCase() === "allow"
      ).length,
    },
    riskOverview: {
      level: safeScoreLabel(safeScore),
      safeScore,
    },
    guardian: {
      hasGuardian,
    },
    safetyTip:
      threatsBlocked > 0
        ? "Pause before acting on urgent requests. Scammers rely on pressure and secrecy to force quick decisions."
        : "Banks will never ask for your password or PIN via phone or message. Always verify requests through official channels.",
  };
};
