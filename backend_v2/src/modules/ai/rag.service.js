import { Firestore } from "@google-cloud/firestore";
import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const backendRoot = path.resolve(moduleDir, "../../..");

const DEFAULT_VERTEX_CREDENTIALS = path.resolve(
  backendRoot,
  "credentials/vertexServiceAccount.json",
);
const DEFAULT_FIRESTORE_CREDENTIALS = path.resolve(
  backendRoot,
  "credentials/serviceAccountKey.json",
);

const DEFAULT_COLLECTION = "scam_patterns";
const DEFAULT_VECTOR_FIELD = "embedding";
const DEFAULT_VECTOR_DISTANCE = "COSINE";
const DEFAULT_MATCH_LIMIT = 5;
const DEFAULT_SCAN_LIMIT = 50;
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_EMBEDDING_TIMEOUT_MS = 8000;
const DEFAULT_FIRESTORE_TIMEOUT_MS = 8000;

let firestoreClient;
let googleAuth;

const resolvePath = (value) => {
  if (!value) {
    return null;
  }

  return path.isAbsolute(value) ? value : path.resolve(backendRoot, value);
};

const resolveExistingPath = (values) => {
  for (const value of values) {
    const resolved = resolvePath(value);
    if (resolved && fs.existsSync(resolved)) {
      return resolved;
    }
  }

  return null;
};

const readProjectId = (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }

    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return json.project_id || null;
  } catch {
    return null;
  }
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const withTimeout = async (promise, timeoutMs, label) => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const normalizeTokens = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/https?:\/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

const truncate = (value, maxLength = 600) => {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
};

const uniqueStrings = (items) => [...new Set(items.filter(Boolean))];

const pickCollectionNames = () => {
  const configured = [
    process.env.FIRESTORE_COLLECTIONS,
    process.env.FIRESTORE_COLLECTION,
    process.env.RAG_COLLECTIONS,
    process.env.RAG_COLLECTION,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return uniqueStrings(configured.length ? configured : [DEFAULT_COLLECTION]);
};

const pickVectorFields = () => {
  const configured = [
    process.env.FIRESTORE_VECTOR_FIELDS,
    process.env.FIRESTORE_VECTOR_FIELD,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return uniqueStrings(configured.length ? configured : [DEFAULT_VECTOR_FIELD]);
};

const getVertexConfig = () => {
  const credentialsPath = resolveExistingPath([
    process.env.VERTEX_SERVICE_ACCOUNT_PATH,
    process.env.VERTEX_APPLICATION_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    DEFAULT_VERTEX_CREDENTIALS,
  ]);

  const project =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.VERTEX_PROJECT_ID ||
    readProjectId(credentialsPath);

  return {
    credentialsPath,
    project,
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    embeddingModel:
      process.env.VERTEX_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
  };
};

const getFirestoreConfig = () => {
  const credentialsPath = resolveExistingPath([
    process.env.FIRESTORE_APPLICATION_CREDENTIALS,
    process.env.FIREBASE_APPLICATION_CREDENTIALS,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    DEFAULT_FIRESTORE_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  ]);

  const projectId =
    process.env.FIRESTORE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    readProjectId(credentialsPath);

  return { credentialsPath, projectId };
};

const getFirestoreClient = () => {
  if (firestoreClient) {
    return firestoreClient;
  }

  const { credentialsPath, projectId } = getFirestoreConfig();
  const options = {};

  if (credentialsPath) {
    options.keyFilename = credentialsPath;
  }

  if (projectId) {
    options.projectId = projectId;
  }

  firestoreClient = new Firestore(options);
  return firestoreClient;
};

const getGoogleAuth = () => {
  if (googleAuth) {
    return googleAuth;
  }

  const { credentialsPath } = getVertexConfig();
  const options = {
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  };

  if (credentialsPath) {
    options.keyFilename = credentialsPath;
  }

  googleAuth = new GoogleAuth(options);
  return googleAuth;
};

const keywordGroups = {
  urgency: [
    "urgent",
    "immediately",
    "act now",
    "asap",
    "right away",
    "limited time",
    "expire",
    "expires today",
  ],
  fear: [
    "suspended",
    "blocked",
    "locked",
    "compromised",
    "fraud",
    "penalty",
    "legal action",
    "warning",
  ],
  authority_impersonation: [
    "bank",
    "government",
    "police",
    "tax",
    "authority",
    "officer",
    "support team",
    "security team",
  ],
  financial_pressure: [
    "transfer",
    "payment",
    "wire",
    "banking",
    "refund",
    "wallet",
    "crypto",
    "funds",
    "pay now",
  ],
  credential_request: [
    "password",
    "login",
    "sign in",
    "username",
    "credential",
    "verify account",
    "account verification",
  ],
  otp_request: [
    "otp",
    "one time password",
    "verification code",
    "security code",
    "6 digit code",
  ],
};

const buildSignalSummary = (detectedPatterns, evidence, extra = {}) => ({
  detected_patterns: uniqueStrings(detectedPatterns),
  evidence: uniqueStrings(evidence),
  ...extra,
});

export const extractTextSignals = (text = "") => {
  const normalized = String(text || "").toLowerCase();
  const detectedPatterns = [];
  const evidence = [];

  for (const [pattern, phrases] of Object.entries(keywordGroups)) {
    const hits = phrases.filter((phrase) => normalized.includes(phrase));
    if (hits.length > 0) {
      detectedPatterns.push(pattern);
      evidence.push(`${pattern} indicators: ${hits.slice(0, 3).join(", ")}`);
    }
  }

  return buildSignalSummary(detectedPatterns, evidence, {
    source: "heuristic_text_extractor",
    token_count: normalizeTokens(text).length,
  });
};

export const extractUrlSignals = (payload = {}) => {
  const submittedUrl = payload.submitted_url || payload.url || "";
  const currentUrl = payload.current_url || submittedUrl;
  const pageTitle = String(payload.page_title || "");
  const detectedPatterns = [];
  const evidence = [];

  const parseUrl = (value) => {
    try {
      const normalized = value.startsWith("http") ? value : `https://${value}`;
      return new URL(normalized);
    } catch {
      return null;
    }
  };

  const submitted = parseUrl(submittedUrl);
  const current = parseUrl(currentUrl);
  const shortenerHosts = new Set([
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "short.ly",
    "goo.gl",
    "ow.ly",
    "cutt.ly",
    "rebrand.ly",
  ]);

  const keywordSource = [
    submitted?.hostname,
    submitted?.pathname,
    current?.hostname,
    current?.pathname,
    pageTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/login|verify|secure|update|signin|account|wallet|bank|otp|password/.test(keywordSource)) {
    detectedPatterns.push("phishing_intent");
    evidence.push("URL or title contains phishing-style keywords");
  }

  if (
    /(bank|paypal|wallet|government|police|microsoft|google|apple|support|security)/.test(
      keywordSource,
    ) &&
    (
      /secure|verify|login|signin|account|support/.test(keywordSource) ||
      (submitted && current && submitted.hostname !== current.hostname) ||
      (current && /^\d{1,3}(\.\d{1,3}){3}$/.test(current.hostname))
    )
  ) {
    detectedPatterns.push("impersonation");
    evidence.push("URL appears to imitate a trusted brand or authority");
  }

  if (submitted && current && submitted.hostname !== current.hostname) {
    detectedPatterns.push("suspicious_domain");
    evidence.push("Submitted and current domains do not match");
  }

  if ((submitted && shortenerHosts.has(submitted.hostname)) || /@|%[0-9a-f]{2}|xn--/i.test(currentUrl)) {
    detectedPatterns.push("shortened_or_obfuscated_url");
    evidence.push("URL appears shortened or obfuscated");
  }

  if (
    current &&
    /^\d{1,3}(\.\d{1,3}){3}$/.test(current.hostname)
  ) {
    detectedPatterns.push("raw_ip");
    evidence.push("URL uses a raw IP address instead of a domain");
  }

  if (/secure|verification|support|bank|wallet|invoice|update required/i.test(pageTitle)) {
    detectedPatterns.push("misleading_title");
    evidence.push("Page title resembles a verification or support lure");
  }

  if (/login|password|otp|code|verify|signin/i.test(keywordSource)) {
    detectedPatterns.push("credential_harvesting");
    evidence.push("URL suggests credential or OTP capture intent");
  }

  return buildSignalSummary(detectedPatterns, evidence, {
    source: "heuristic_url_extractor",
    submitted_host: submitted?.hostname || null,
    current_host: current?.hostname || null,
  });
};

export const extractSandboxSignals = (payload = {}) => {
  const events = Array.isArray(payload.events) ? payload.events : [];
  const detectedPatterns = [];
  const evidence = [];

  if (events.includes("redirect_to_unknown_domain")) {
    detectedPatterns.push("redirect");
    evidence.push("Redirected to an unknown or changed domain");
  }

  if (
    events.includes("login_form_detected") ||
    events.includes("credential_submission_attempt")
  ) {
    detectedPatterns.push("credential_harvesting");
    evidence.push("Credential capture behavior detected");
  }

  if (events.includes("otp_field_detected")) {
    detectedPatterns.push("otp_capture");
    evidence.push("OTP capture step detected");
  }

  if (
    events.includes("download_attempt") ||
    events.includes("apk_download_attempt")
  ) {
    detectedPatterns.push("malware_download");
    evidence.push("File or APK download attempt detected");
  }

  if (
    events.includes("redirect_to_unknown_domain") &&
    events.includes("login_form_detected") &&
    events.includes("otp_field_detected")
  ) {
    evidence.push("Chained redirect -> login -> OTP phishing flow detected");
  }

  return buildSignalSummary(detectedPatterns, evidence, {
    source: "heuristic_sandbox_extractor",
    events_present: events,
  });
};

const extractDocumentText = (data) => {
  const preferredFields = [
    "title",
    "name",
    "pattern",
    "scam_type",
    "category",
    "description",
    "summary",
    "content",
    "text",
    "example",
    "recommended_action",
    "risk_level",
  ];

  const parts = [];

  for (const field of preferredFields) {
    const value = data[field];

    if (typeof value === "string" && value.trim()) {
      parts.push(`${field}: ${value.trim()}`);
    } else if (Array.isArray(value) && value.length > 0) {
      parts.push(`${field}: ${value.join(", ")}`);
    }
  }

  if (parts.length > 0) {
    return parts.join(" | ");
  }

  return truncate(JSON.stringify(data));
};

const buildRetrievalQuery = (type, payload, extractedSignals) => {
  const detectedPatterns = extractedSignals.detected_patterns || [];

  if (type === "text") {
    return [
      payload.text || "",
      detectedPatterns.join(" "),
      "financial scam message",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (type === "url") {
    return [
      payload.url || payload.submitted_url || "",
      payload.current_url || "",
      payload.page_title || "",
      detectedPatterns.join(" "),
      "phishing url scam pattern",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    payload.submitted_url || "",
    payload.current_url || "",
    payload.page_title || "",
    (payload.events || []).join(" "),
    detectedPatterns.join(" "),
    "sandbox phishing malware behavior",
  ]
    .filter(Boolean)
    .join(" ");
};

const getAccessToken = async () => {
  const client = await getGoogleAuth().getClient();
  const token = await client.getAccessToken();
  return typeof token === "string" ? token : token?.token;
};

const getQueryEmbedding = async (text) => {
  const { project, location, embeddingModel } = getVertexConfig();

  if (!project || !text.trim()) {
    return null;
  }

  const token = await getAccessToken();

  if (!token) {
    return null;
  }

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${embeddingModel}:predict`;
  const outputDimensionality = Number.parseInt(
    process.env.RAG_EMBEDDING_DIMENSION || "",
    10,
  );
  const timeoutMs = parsePositiveInteger(
    process.env.RAG_EMBEDDING_TIMEOUT_MS,
    DEFAULT_EMBEDDING_TIMEOUT_MS,
  );
  const controller = new AbortController();
  const abortId = setTimeout(() => controller.abort(), timeoutMs);

  const body = {
    instances: [
      {
        content: text,
        task_type: "RETRIEVAL_QUERY",
      },
    ],
    parameters:
      Number.isInteger(outputDimensionality) && outputDimensionality > 0
        ? { outputDimensionality }
        : {},
  };

  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(abortId);
  }

  if (!response.ok) {
    throw new Error(`Embedding request failed with ${response.status}`);
  }

  const json = await response.json();
  const values = json?.predictions?.[0]?.embeddings?.values;

  return Array.isArray(values) ? values : null;
};

const formatMatch = (snapshot, source, scoreField = null) => {
  const data = snapshot.data();
  const score =
    scoreField && typeof data[scoreField] === "number" ? data[scoreField] : null;

  return {
    id: snapshot.id,
    source,
    score,
    snippet: extractDocumentText(data),
    metadata: {
      title: data.title || data.name || null,
      category: data.category || data.scam_type || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
    },
  };
};

const queryVectorMatches = async (queryText) => {
  const embedding = await getQueryEmbedding(queryText);

  if (!embedding) {
    return [];
  }

  const firestore = getFirestoreClient();
  const matches = [];
  const collectionNames = pickCollectionNames();
  const vectorFields = pickVectorFields();
  const limit = parsePositiveInteger(process.env.RAG_MATCH_LIMIT, DEFAULT_MATCH_LIMIT);
  const distanceMeasure =
    process.env.FIRESTORE_VECTOR_DISTANCE || DEFAULT_VECTOR_DISTANCE;
  const firestoreTimeoutMs = parsePositiveInteger(
    process.env.RAG_FIRESTORE_TIMEOUT_MS,
    DEFAULT_FIRESTORE_TIMEOUT_MS,
  );

  for (const collectionName of collectionNames) {
    for (const vectorField of vectorFields) {
      try {
        const snapshot = await withTimeout(
          firestore
            .collection(collectionName)
            .findNearest({
              vectorField,
              queryVector: embedding,
              limit,
              distanceMeasure,
              distanceResultField: "_distance",
            })
            .get(),
          firestoreTimeoutMs,
          `Firestore vector retrieval for ${collectionName}.${vectorField}`,
        );

        for (const doc of snapshot.docs) {
          matches.push({
            collection: collectionName,
            ...formatMatch(doc, "firestore_vector", "_distance"),
          });
        }
      } catch (error) {
        console.warn(
          `Firestore vector retrieval failed for ${collectionName}.${vectorField}: ${error.message}`,
        );
      }
    }
  }

  return matches
    .sort((left, right) => {
      const leftScore = typeof left.score === "number" ? left.score : Number.POSITIVE_INFINITY;
      const rightScore =
        typeof right.score === "number" ? right.score : Number.POSITIVE_INFINITY;
      return leftScore - rightScore;
    })
    .slice(0, limit);
};

const queryKeywordMatches = async (queryText) => {
  const firestore = getFirestoreClient();
  const queryTokens = new Set(normalizeTokens(queryText));
  const matches = [];
  const scanLimit = parsePositiveInteger(
    process.env.RAG_KEYWORD_SCAN_LIMIT,
    DEFAULT_SCAN_LIMIT,
  );
  const resultLimit = parsePositiveInteger(
    process.env.RAG_MATCH_LIMIT,
    DEFAULT_MATCH_LIMIT,
  );
  const firestoreTimeoutMs = parsePositiveInteger(
    process.env.RAG_FIRESTORE_TIMEOUT_MS,
    DEFAULT_FIRESTORE_TIMEOUT_MS,
  );

  for (const collectionName of pickCollectionNames()) {
    try {
      const snapshot = await withTimeout(
        firestore.collection(collectionName).limit(scanLimit).get(),
        firestoreTimeoutMs,
        `Firestore keyword retrieval for ${collectionName}`,
      );

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const text = extractDocumentText(data);
        const docTokens = new Set(normalizeTokens(text));
        const overlap = [...queryTokens].filter((token) => docTokens.has(token));

        if (overlap.length === 0) {
          continue;
        }

        matches.push({
          collection: collectionName,
          ...formatMatch(doc, "keyword_overlap"),
          score: overlap.length,
        });
      }
    } catch (error) {
      console.warn(
        `Firestore keyword retrieval failed for ${collectionName}: ${error.message}`,
      );
    }
  }

  return matches
    .sort((left, right) => (right.score || 0) - (left.score || 0))
    .slice(0, resultLimit);
};

export const retrieveScamContext = async ({ type, payload, extractedSignals }) => {
  const query = buildRetrievalQuery(type, payload, extractedSignals);

  try {
    const vectorMatches = await queryVectorMatches(query);

    if (vectorMatches.length > 0) {
      return {
        knowledge_base: "cloud_firestore",
        strategy: "vertex_embedding_plus_firestore_vector_search",
        match_count: vectorMatches.length,
        matches: vectorMatches,
      };
    }
  } catch (error) {
    console.warn(`Vector retrieval unavailable: ${error.message}`);
  }

  try {
    const keywordMatches = await queryKeywordMatches(query);

    return {
      knowledge_base: "cloud_firestore",
      strategy:
        keywordMatches.length > 0
          ? "firestore_keyword_fallback"
          : "no_retrieval_matches",
      match_count: keywordMatches.length,
      matches: keywordMatches,
    };
  } catch (error) {
    console.warn(`Keyword retrieval unavailable: ${error.message}`);
    return {
      knowledge_base: "cloud_firestore",
      strategy: "retrieval_unavailable",
      match_count: 0,
      matches: [],
    };
  }
};
