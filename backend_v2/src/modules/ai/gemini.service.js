import { VertexAI } from "@google-cloud/vertexai";
import { buildPrompt } from "./promptBuilder.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Resolve credentials path
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

// Initialize Vertex AI
const vertexAI = new VertexAI({ project, location });

// ✅ ONLY valid + stable models
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

export const callGemini = async (prompt) => {
  for (const modelName of MODELS) {
    try {
      console.log(`🚀 Trying Vertex AI model (${location}): ${modelName}`);

      const generativeModel = vertexAI.getGenerativeModel({
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

      const createFallback = (rawText) => ({
        risk_score: 50,
        risk_level: "MEDIUM",
        scam_detected: false,
        patterns: ["parse_error"],
        verdict: "Analysis partial",
        reasons: ["The AI response was malformed or truncated."],
        explanation: rawText || "The AI failed to provide a readable analysis.",
        recommended_action: "warn",
      });

      try {
        const parsed = JSON.parse(cleaned);
        // Ensure all required fields exist for the frontend
        return {
          risk_score: parsed.risk_score ?? 50,
          risk_level: parsed.risk_level ?? "MEDIUM",
          scam_detected: parsed.scam_detected ?? false,
          patterns: parsed.patterns ?? [],
          verdict: parsed.verdict ?? "Analysis complete",
          reasons: parsed.reasons ?? [],
          explanation: parsed.explanation ?? text,
          recommended_action: parsed.recommended_action ?? "warn",
        };
      } catch (parseErr) {
        console.warn("⚠️ JSON parse failed, returning safe structure");
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
  const prompt = buildPrompt("sandbox", input);
  const aiResult = await callGemini(prompt);

  return {
    ...aiResult,
    generated_at: new Date().toISOString(),
  };
};