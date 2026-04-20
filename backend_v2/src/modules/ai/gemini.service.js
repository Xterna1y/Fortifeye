import { VertexAI } from "@google-cloud/vertexai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPrompt } from "./promptBuilder.js";
import { validateAIResponse } from "./ai.validator.js";
import {
  extractSandboxSignals,
  extractTextSignals,
  extractUrlSignals,
  retrieveScamContext,
} from "./rag.service.js";

dotenv.config();

const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const backendRoot = path.resolve(moduleDir, "../../..");

const DEFAULT_VERTEX_CREDENTIALS = path.resolve(
  backendRoot,
  "credentials/vertexServiceAccount.json",
);
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const DEFAULT_MODEL_TIMEOUT_MS = 15000;

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

const credentialsPath = resolveExistingPath([
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  process.env.VERTEX_APPLICATION_CREDENTIALS,
  process.env.VERTEX_SERVICE_ACCOUNT_PATH,
  DEFAULT_VERTEX_CREDENTIALS,
]);

if (credentialsPath) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const vertexAI = new VertexAI({ project, location });

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const scoreToRiskLevel = (score) => {
  if (score >= 71) {
    return "HIGH";
  }

  if (score >= 41) {
    return "MEDIUM";
  }

  return "LOW";
};

const riskLevelToAction = (riskLevel) => {
  if (riskLevel === "HIGH") {
    return "block";
  }

  if (riskLevel === "MEDIUM") {
    return "warn";
  }

  return "allow";
};

const deriveScamDetected = (score, patternCount) =>
  score >= 71 || (score >= 41 && patternCount >= 2);

const toStringArray = (value) =>
  Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))]
    : [];

const buildKnowledgeBaseReason = (retrievedContext) => {
  if (!retrievedContext?.match_count) {
    return null;
  }

  return `Matched ${retrievedContext.match_count} related scam pattern${retrievedContext.match_count === 1 ? "" : "s"} from the Firestore knowledge base`;
};

const buildFallbackAnalysis = ({
  type,
  extractedSignals,
  retrievedContext,
  failureReason,
}) => {
  const patterns = toStringArray(extractedSignals?.detected_patterns);
  const evidence = toStringArray(extractedSignals?.evidence);
  const eventsPresent = Array.isArray(extractedSignals?.events_present)
    ? extractedSignals.events_present
    : [];

  let score = 0;

  if (type === "text") {
    const weights = {
      urgency: 15,
      fear: 15,
      authority_impersonation: 20,
      financial_pressure: 20,
      credential_request: 25,
      otp_request: 30,
    };

    score = patterns.reduce((sum, pattern) => sum + (weights[pattern] || 0), 0);

    if (patterns.length >= 2) {
      score += 10;
    }

    if (patterns.length >= 3) {
      score += 20;
    }

    if (
      patterns.includes("authority_impersonation") &&
      patterns.includes("financial_pressure") &&
      patterns.includes("urgency")
    ) {
      score = Math.max(score, 80);
    }

    if (
      (patterns.includes("otp_request") ||
        patterns.includes("credential_request")) &&
      patterns.length >= 2
    ) {
      score = Math.max(score, 75);
    }
  } else if (type === "url") {
    const weights = {
      phishing_intent: 20,
      suspicious_domain: 25,
      impersonation: 30,
      shortened_or_obfuscated_url: 15,
      raw_ip: 20,
      misleading_title: 15,
      credential_harvesting: 25,
    };

    score = patterns.reduce((sum, pattern) => sum + (weights[pattern] || 0), 0);

    if (patterns.length >= 2) {
      score += 10;
    }

    if (patterns.length >= 3) {
      score += 20;
    }

    if (
      patterns.includes("impersonation") &&
      patterns.includes("credential_harvesting")
    ) {
      score = Math.max(score, 80);
    }

    if (
      patterns.includes("phishing_intent") &&
      (patterns.includes("credential_harvesting") ||
        patterns.includes("misleading_title"))
    ) {
      score = Math.max(score, 75);
    }
  } else {
    const weights = {
      redirect: eventsPresent.includes("redirect_to_unknown_domain") ? 15 : 0,
      credential_harvesting: eventsPresent.includes("login_form_detected")
        ? 25
        : 0,
      credential_submission_attempt: eventsPresent.includes(
        "credential_submission_attempt",
      )
        ? 30
        : 0,
      otp_capture: eventsPresent.includes("otp_field_detected") ? 35 : 0,
      malware_download:
        eventsPresent.includes("download_attempt") ||
        eventsPresent.includes("apk_download_attempt")
          ? eventsPresent.includes("apk_download_attempt")
            ? 50
            : 40
          : 0,
    };

    score = Object.values(weights).reduce((sum, value) => sum + value, 0);

    if (
      eventsPresent.includes("redirect_to_unknown_domain") &&
      eventsPresent.includes("login_form_detected")
    ) {
      score = Math.max(score, 70);
    }

    if (
      eventsPresent.includes("login_form_detected") &&
      eventsPresent.includes("otp_field_detected")
    ) {
      score = Math.max(score, 80);
    }

    if (
      eventsPresent.includes("redirect_to_unknown_domain") &&
      eventsPresent.includes("login_form_detected") &&
      eventsPresent.includes("otp_field_detected")
    ) {
      score = Math.max(score, 90);
    }

    if (
      eventsPresent.includes("download_attempt") ||
      eventsPresent.includes("apk_download_attempt")
    ) {
      score = Math.max(score, 90);
    }

    if (
      eventsPresent.includes("redirect_to_unknown_domain") &&
      eventsPresent.includes("login_form_detected") &&
      eventsPresent.includes("otp_field_detected") &&
      (eventsPresent.includes("download_attempt") ||
        eventsPresent.includes("apk_download_attempt"))
    ) {
      score = 100;
    }
  }

  if (retrievedContext?.match_count) {
    score += Math.min(15, retrievedContext.match_count * 4);
  }

  const riskScore = clampScore(score);
  const riskLevel = scoreToRiskLevel(riskScore);
  const recommendedAction = riskLevelToAction(riskLevel);
  const scamDetected = deriveScamDetected(riskScore, patterns.length);

  const reasons = uniqueStrings([
    ...evidence.slice(0, 3),
    buildKnowledgeBaseReason(retrievedContext),
    failureReason ? `Fallback used because ${failureReason}` : null,
  ]).slice(0, 4);

  const explanationParts = [];

  if (patterns.length > 0) {
    explanationParts.push(
      `Deterministic fallback analysis detected ${patterns.join(", ")} indicators.`,
    );
  } else {
    explanationParts.push(
      "Deterministic fallback analysis did not detect strong scam indicators from local heuristics.",
    );
  }

  if (retrievedContext?.match_count) {
    explanationParts.push(
      `Firestore retrieval returned ${retrievedContext.match_count} relevant scam pattern match${retrievedContext.match_count === 1 ? "" : "es"}.`,
    );
  }

  const verdict =
    riskLevel === "HIGH"
      ? "High-risk scam indicators detected"
      : riskLevel === "MEDIUM"
        ? "Moderate scam risk detected"
        : "Low scam risk detected";

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    scam_detected: scamDetected,
    patterns,
    verdict,
    reasons,
    explanation: explanationParts.join(" "),
    recommended_action: recommendedAction,
    model: "fallback-heuristic",
  };
};

const uniqueStrings = (items) => [...new Set(items.filter(Boolean))];

const normalizeAIResponse = (data, fallbackAnalysis, modelName) => {
  if (!data || typeof data !== "object") {
    return fallbackAnalysis;
  }

  const parsedScore = Number(data.risk_score);
  const riskScore = Number.isFinite(parsedScore)
    ? clampScore(parsedScore)
    : fallbackAnalysis.risk_score;
  const riskLevel = scoreToRiskLevel(riskScore);
  const recommendedAction = riskLevelToAction(riskLevel);
  const patterns = toStringArray(data.patterns);
  const reasons = toStringArray(data.reasons);
  const explanation =
    typeof data.explanation === "string" && data.explanation.trim()
      ? data.explanation.trim()
      : fallbackAnalysis.explanation;
  const verdict =
    typeof data.verdict === "string" && data.verdict.trim()
      ? data.verdict.trim()
      : fallbackAnalysis.verdict;

  const normalized = {
    risk_score: riskScore,
    risk_level: riskLevel,
    scam_detected:
      typeof data.scam_detected === "boolean"
        ? data.scam_detected
        : deriveScamDetected(riskScore, patterns.length),
    patterns: patterns.length > 0 ? patterns : fallbackAnalysis.patterns,
    verdict,
    reasons: reasons.length > 0 ? reasons : fallbackAnalysis.reasons,
    explanation,
    recommended_action: recommendedAction,
    model: modelName,
  };

  return validateAIResponse(normalized) ? normalized : fallbackAnalysis;
};

const extractJsonPayload = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
};

export const callGemini = async (prompt, fallbackAnalysis) => {
  const modelTimeoutMs = parsePositiveInteger(
    process.env.AI_MODEL_TIMEOUT_MS,
    DEFAULT_MODEL_TIMEOUT_MS,
  );

  for (const modelName of MODELS) {
    try {
      console.log(`Trying Vertex AI model (${location}): ${modelName}`);

      const generativeModel = vertexAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      });

      const result = await withTimeout(
        generativeModel.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
        modelTimeoutMs,
        `Vertex AI generation for ${modelName}`,
      );

      const response = result.response;
      const text =
        response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (!text) {
        throw new Error("empty response from Vertex AI");
      }

      try {
        const parsed = JSON.parse(extractJsonPayload(text));
        return normalizeAIResponse(parsed, fallbackAnalysis, modelName);
      } catch (error) {
        console.warn(
          `JSON parse failed for ${modelName}, using deterministic fallback: ${error.message}`,
        );
        return {
          ...fallbackAnalysis,
          explanation: fallbackAnalysis.explanation || text,
        };
      }
    } catch (error) {
      console.warn(`Model ${modelName} failed: ${error.message}`);
    }
  }

  console.error("All Vertex AI models failed. Using deterministic fallback.");
  return fallbackAnalysis;
};

const analyzeRisk = async ({ type, payload, signalExtractor }) => {
  const extractedSignals = signalExtractor(payload);
  const retrievedContext = await retrieveScamContext({
    type,
    payload,
    extractedSignals,
  });
  const fallbackAnalysis = buildFallbackAnalysis({
    type,
    extractedSignals,
    retrievedContext,
    failureReason: "the AI response was unavailable or invalid",
  });
  const prompt = buildPrompt(type, {
    ...payload,
    extracted_signals: extractedSignals,
    retrieved_context: retrievedContext,
  });

  return callGemini(prompt, fallbackAnalysis);
};

export const analyzeTextRisk = async ({ text }) =>
  analyzeRisk({
    type: "text",
    payload: { text },
    signalExtractor: ({ text: userText }) => extractTextSignals(userText),
  });

export const analyzeUrlRisk = async ({ url, current_url, page_title }) =>
  analyzeRisk({
    type: "url",
    payload: { url, current_url, page_title },
    signalExtractor: extractUrlSignals,
  });

export const analyzeSandboxRisk = async (input) => {
  const aiResult = await analyzeRisk({
    type: "sandbox",
    payload: input,
    signalExtractor: extractSandboxSignals,
  });

  return {
    ...aiResult,
    generated_at: new Date().toISOString(),
  };
};
