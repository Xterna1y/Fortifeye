import { db } from "../../config/db.js";

const MAX_ITEMS = 5;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const unique = (values) => [...new Set(values.filter(Boolean))];

const normalizeText = (value) => String(value || "").toLowerCase();

const collectKeywords = (value) => {
  const text = normalizeText(value);
  if (!text) {
    return [];
  }

  return unique(
    text
      .split(/[^a-z0-9$]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
  );
};

export const extractTextSignals = (payload = {}) => {
  const text = normalizeText(payload.text);
  const signals = {
    urgency: /\b(act now|immediately|urgent|asap|today|now)\b/.test(text),
    fear: /\b(hacked|blocked|suspended|frozen|risk|warning|threat)\b/.test(text),
    authority_impersonation: /\b(bank|police|government|court|customs|tax|officer)\b/.test(text),
    financial_pressure: /\b(rm|usd|\$|money|transfer|bank in|payment|pay|send)\b/.test(text),
    credential_request: /\b(password|username|login|account details|card number)\b/.test(text),
    otp_request: /\b(otp|one time password|verification code|tac)\b/.test(text),
  };

  return {
    ...signals,
    keywords: collectKeywords(text),
  };
};

export const extractUrlSignals = (payload = {}) => {
  const url = normalizeText(payload.url);
  const title = normalizeText(payload.page_title);
  const combined = `${url} ${title}`;

  const signals = {
    phishing_intent: /\b(login|verify|secure|update|signin|account)\b/.test(combined),
    suspicious_domain:
      /@\w|--|\d{4,}|free-|bonus|claim/.test(url) ||
      /\.(ru|cn|tk|top|xyz)\b/.test(url),
    impersonation: /\b(maybank|cimb|bank|paypal|government|lhdn)\b/.test(combined),
    shortened_or_obfuscated_url: /\b(bit\.ly|tinyurl|t\.co|goo\.gl)\b/.test(url),
    raw_ip: /\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(url),
    misleading_title: /\b(verify|urgent|security alert|account suspended)\b/.test(title),
    credential_harvesting: /\b(login|password|otp|verify identity)\b/.test(combined),
  };

  return {
    ...signals,
    keywords: collectKeywords(combined),
  };
};

export const extractSandboxSignals = (payload = {}) => {
  const events = Array.isArray(payload.events) ? payload.events.map((event) => normalizeText(event)) : [];
  const joinedEvents = events.join(" ");
  const combined = `${normalizeText(payload.current_url)} ${normalizeText(payload.page_title)} ${joinedEvents}`;

  const signals = {
    redirect: events.some((event) => event.includes("redirect")),
    credential_harvesting: events.some((event) => event.includes("login") || event.includes("credential")),
    otp_capture: events.some((event) => event.includes("otp")),
    malware_download: events.some((event) => event.includes("download") || event.includes("apk")),
  };

  return {
    ...signals,
    keywords: collectKeywords(combined),
  };
};

export const extractSignals = (type, payload = {}) => {
  if (type === "text") return extractTextSignals(payload);
  if (type === "url") return extractUrlSignals(payload);
  return extractSandboxSignals(payload);
};

const docToSearchableText = (data = {}) =>
  normalizeText(
    [
      data.input,
      data.title,
      data.message,
      data.current_url,
      data.submitted_url,
      data.page_title,
      data.type,
      data.risk_level,
      Array.isArray(data.reasons) ? data.reasons.join(" ") : "",
      Array.isArray(data.events) ? data.events.join(" ") : "",
    ].join(" ")
  );

const getCollectionSnapshot = async (collectionName) => {
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection(collectionName).limit(50).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn(`RAG fetch failed for ${collectionName}:`, error.message);
    return [];
  }
};

const scoreItem = (item, keywords) => {
  const haystack = docToSearchableText(item);
  if (!haystack) {
    return 0;
  }

  return keywords.reduce((score, keyword) => {
    if (!keyword) return score;
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    return regex.test(haystack) ? score + 1 : score;
  }, 0);
};

const simplifyContextItem = (collection, item) => ({
  source: collection,
  id: item.id,
  risk_level: item.risk_level || item.riskLevel || item.verdict?.risk_level || "UNKNOWN",
  summary:
    item.title ||
    item.message ||
    item.input ||
    item.verdict?.verdict ||
    item.page_title ||
    "Related historical context",
  createdAt: item.createdAt || item.updatedAt || item.linkedAt || null,
});

export const retrieveRelevantContext = async (type, payload = {}) => {
  const extracted = extractSignals(type, payload);
  const keywords = extracted.keywords || [];

  if (!keywords.length) {
    return [];
  }

  const [scans, alerts, sessions] = await Promise.all([
    getCollectionSnapshot("scans"),
    getCollectionSnapshot("alerts"),
    getCollectionSnapshot("sandboxSessions"),
  ]);

  const scored = [
    ...scans.map((item) => ({ collection: "scans", item, score: scoreItem(item, keywords) })),
    ...alerts.map((item) => ({ collection: "alerts", item, score: scoreItem(item, keywords) })),
    ...sessions.map((item) => ({ collection: "sandboxSessions", item, score: scoreItem(item, keywords) })),
  ]
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return new Date(b.item.createdAt || 0).getTime() - new Date(a.item.createdAt || 0).getTime();
    })
    .slice(0, MAX_ITEMS)
    .map((entry) => simplifyContextItem(entry.collection, entry.item));

  return scored;
};

export const formatRetrievedContext = (items = []) => {
  if (!items.length) {
    return "No prior related context found.";
  }

  return JSON.stringify(items, null, 2);
};

export const buildAugmentedPayload = async (type, payload = {}) => {
  const extracted_signals = extractSignals(type, payload);
  const retrievedItems = await retrieveRelevantContext(type, payload);

  return {
    ...payload,
    extracted_signals,
    retrieved_context: formatRetrievedContext(retrievedItems),
  };
};
