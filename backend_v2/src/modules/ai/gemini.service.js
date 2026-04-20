import { VertexAI } from "@google-cloud/vertexai";
import { buildPrompt } from "./promptBuilder.js";
import { validateAIResponse } from "./ai.validator.js";
import { buildAugmentedPayload } from "./rag.service.js";
import {
  GOOGLE_APPLICATION_CREDENTIALS_PATH,
  GOOGLE_CLOUD_LOCATION,
  GOOGLE_CLOUD_PROJECT,
} from "../../config/env.js";

if (GOOGLE_APPLICATION_CREDENTIALS_PATH) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS_PATH;
}

const project = GOOGLE_CLOUD_PROJECT;
const location = GOOGLE_CLOUD_LOCATION;

let vertexAI = null;

const getVertexAI = () => {
  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT is not configured");
  }

  if (!vertexAI) {
    vertexAI = new VertexAI({ project, location });
  }

  return vertexAI;
};

// ✅ ONLY valid + stable models
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

const normalizeRiskLevel = (riskLevel, score) => {
  const normalized = (riskLevel || "").toUpperCase();
  if (["LOW", "MEDIUM", "HIGH"].includes(normalized)) {
    return normalized;
  }

  if (score >= 71) return "HIGH";
  if (score >= 41) return "MEDIUM";
  return "LOW";
};

const normalizeAction = (riskLevel, action) => {
  const normalized = (action || "").toLowerCase();
  if (["allow", "warn", "block"].includes(normalized)) {
    return normalized;
  }

  if (riskLevel === "HIGH") return "block";
  if (riskLevel === "MEDIUM") return "warn";
  return "allow";
};

const extractPatterns = (rawText) => {
  const match = rawText.match(/"patterns"\s*:\s*\[([\s\S]*?)\]/);
  if (!match) return [];

  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
};

const salvageJsonLikeResponse = (rawText) => {
  const scoreMatch = rawText.match(/"risk_score"\s*:\s*(\d+)/);
  const levelMatch = rawText.match(/"risk_level"\s*:\s*"([^"]+)"/);
  const detectedMatch = rawText.match(/"scam_detected"\s*:\s*(true|false)/);
  const actionMatch = rawText.match(/"recommended_action"\s*:\s*"([^"]+)"/);
  const verdictMatch = rawText.match(/"verdict"\s*:\s*"([^"]*)"/);
  const explanationMatch = rawText.match(/"explanation"\s*:\s*"([\s\S]*?)"/);
  const reasonsMatch = rawText.match(/"reasons"\s*:\s*\[([\s\S]*?)\]/);

  if (!scoreMatch && !levelMatch && !actionMatch) {
    return null;
  }

  const riskScore = scoreMatch ? Number(scoreMatch[1]) : 50;
  const riskLevel = normalizeRiskLevel(levelMatch?.[1], riskScore);
  const patterns = extractPatterns(rawText);
  const reasons = reasonsMatch
    ? [...reasonsMatch[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
    : [];

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    scam_detected:
      detectedMatch?.[1] === "true" || riskLevel === "HIGH" || riskScore >= 71,
    patterns,
    verdict: verdictMatch?.[1] || "Analysis complete",
    reasons,
    explanation:
      explanationMatch?.[1] ||
      "The AI response was only partially parseable, so the result was reconstructed from the returned fields.",
    recommended_action: normalizeAction(riskLevel, actionMatch?.[1]),
  };
};

const applyTextSafetyFloor = (result, context = {}) => {
  if (context.type !== "text") {
    return result;
  }

  const text = (context.text || "").toLowerCase();
  const patterns = new Set(result.patterns || []);

  const mentionsMoney =
    /\b(rm|usd|\$|money|cash|transfer|bank in|bank transfer|pay|payment|send)\b/.test(text) ||
    /\b\d{2,}\b/.test(text);
  const directRequest =
    /\b(give me|send me|transfer|bank in|pay me|please give|can you send)\b/.test(text);
  const urgency = /\b(now|immediately|urgent|asap|today)\b/.test(text);

  if (mentionsMoney && directRequest) {
    patterns.add("financial_pressure");
    const riskScore = Math.max(result.risk_score ?? 0, urgency ? 60 : 45);
    const riskLevel = normalizeRiskLevel(result.risk_level, riskScore);
    const recommendedAction = normalizeAction(riskLevel, result.recommended_action);

    return {
      ...result,
      risk_score: riskScore,
      risk_level: riskLevel,
      scam_detected: riskLevel !== "LOW",
      patterns: [...patterns],
      reasons:
        result.reasons && result.reasons.length > 0
          ? result.reasons
          : ["The message includes a direct request for money, which is a common scam pressure signal."],
      explanation:
        result.explanation && !result.explanation.trim().startsWith("{")
          ? result.explanation
          : "This message directly asks for money, so it should not be treated as zero-risk even if the model output was incomplete or inconsistent.",
      recommended_action: recommendedAction,
    };
  }

  return result;
};

const normalizeParsedResult = (parsed, fallbackExplanation) => {
  const riskScore = Math.max(0, Math.min(100, Number(parsed.risk_score ?? 50)));
  const riskLevel = normalizeRiskLevel(parsed.risk_level, riskScore);

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    scam_detected: parsed.scam_detected ?? riskLevel === "HIGH",
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
    verdict: parsed.verdict ?? "Analysis complete",
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    explanation:
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation
        : fallbackExplanation,
    recommended_action: normalizeAction(riskLevel, parsed.recommended_action),
  };
};

const ensureValidResponse = (result, fallbackExplanation) => {
  const normalized = normalizeParsedResult(result, fallbackExplanation);
  if (validateAIResponse(normalized)) {
    return normalized;
  }

  return normalizeParsedResult(
    {
      risk_score: normalized.risk_score || 50,
      risk_level: normalized.risk_level || "MEDIUM",
      scam_detected: normalized.risk_level === "HIGH",
      patterns: normalized.patterns || ["validation_error"],
      verdict: normalized.verdict || "Analysis partial",
      reasons:
        normalized.reasons && normalized.reasons.length
          ? normalized.reasons
          : ["The AI response did not fully satisfy the required schema."],
      explanation:
        normalized.explanation ||
        fallbackExplanation ||
        "The AI response was normalized because some required fields were missing or invalid.",
      recommended_action: normalized.recommended_action || "warn",
    },
    fallbackExplanation
  );
};

export const callGemini = async (prompt, context = {}) => {
  for (const modelName of MODELS) {
    try {
      console.log(`🚀 Trying Vertex AI model (${location}): ${modelName}`);

      const generativeModel = getVertexAI().getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      });

      const request = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      };

      const result = await generativeModel.generateContent(request);
      const response = result.response;

      const text =
        response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) {
        throw new Error("Empty response from Vertex AI");
      }

      console.log(`✅ Success with model: ${modelName}`);

      // ✅ Robust JSON extraction
      let cleaned = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      const createFallback = (rawText) =>
        applyTextSafetyFloor(
          {
            risk_score: 50,
            risk_level: "MEDIUM",
            scam_detected: false,
            patterns: ["parse_error"],
            verdict: "Analysis partial",
            reasons: ["The AI response was malformed or truncated."],
            explanation:
              "The AI returned a malformed response, so a safe fallback assessment was used.",
            recommended_action: "warn",
            raw_ai_output: rawText,
          },
          context
        );

      try {
        const parsed = JSON.parse(cleaned);
        return applyTextSafetyFloor(ensureValidResponse(parsed, text), context);
      } catch (parseErr) {
        console.warn("⚠️ JSON parse failed, attempting salvage");
        const salvaged = salvageJsonLikeResponse(text);
        if (salvaged) {
          return applyTextSafetyFloor(ensureValidResponse(salvaged, text), context);
        }

        console.warn("⚠️ Salvage failed, returning safe structure");
        return createFallback(text);
      }
    } catch (err) {
      const errMsg = err.message || String(err);
      console.warn(`❌ Model ${modelName} failed: ${errMsg}`);
    }
  }

  // ❌ All models failed
  console.error("🚨 All Vertex AI models failed. Returning emergency fallback.");
  return {
    risk_score: 50,
    risk_level: "MEDIUM",
    scam_detected: false,
    patterns: ["vertex_failure"],
    verdict: "AI analysis unavailable",
    reasons: ["Vertex AI request failed after all attempts"],
    explanation: "The connection to Vertex AI was lost or the model failed to respond. Please check GCP status.",
    recommended_action: "warn",
  };
};

export const analyzeSandboxRisk = async (input) => {
  const augmentedInput = await buildAugmentedPayload("sandbox", input);
  const prompt = buildPrompt("sandbox", augmentedInput);
  const aiResult = await callGemini(prompt, { type: "sandbox", ...augmentedInput });

  return {
    ...ensureValidResponse(aiResult, "Sandbox analysis completed with normalized output."),
    generated_at: new Date().toISOString(),
    model: "vertex-gemini",
  };
};

export const analyzeTextRisk = async (input) => {
  const augmentedInput = await buildAugmentedPayload("text", input);
  const prompt = buildPrompt("text", augmentedInput);
  const aiResult = await callGemini(prompt, { type: "text", ...augmentedInput });

  return {
    ...ensureValidResponse(aiResult, "Text analysis completed with normalized output."),
    model: "vertex-gemini",
  };
};

export const analyzeUrlRisk = async (input) => {
  const augmentedInput = await buildAugmentedPayload("url", input);
  const prompt = buildPrompt("url", augmentedInput);
  const aiResult = await callGemini(prompt, { type: "url", ...augmentedInput });

  return {
    ...ensureValidResponse(aiResult, "URL analysis completed with normalized output."),
    generated_at: new Date().toISOString(),
    model: "vertex-gemini",
  };
};
