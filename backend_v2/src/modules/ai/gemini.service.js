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
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export const callGemini = async (prompt) => {
  for (const modelName of MODELS) {
    try {
      console.log(`🚀 Trying Vertex AI model (${location}): ${modelName}`);

      const generativeModel = vertexAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200, // 🔥 VERY IMPORTANT (cost control)
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

      // Clean markdown JSON if present
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // ✅ Safe JSON parsing
      try {
        return JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn("⚠️ JSON parse failed, returning raw text");
        return {
          raw: cleaned,
          note: "Model did not return valid JSON",
        };
      }
    } catch (err) {
      const errMsg = err.message || String(err);

      console.warn(`❌ Model ${modelName} failed: ${errMsg}`);

      // Helpful debugging logs
      if (errMsg.includes("403") || errMsg.includes("Permission")) {
        console.error("🔒 PERMISSION ISSUE:");
        console.error("- Check IAM → add 'Vertex AI User'");
      }

      if (errMsg.includes("404")) {
        console.error("📦 MODEL NOT FOUND:");
        console.error("- Model name is invalid or not available");
      }

      if (errMsg.includes("<!DOCTYPE")) {
        console.error("🌐 HTML ERROR RESPONSE:");
        console.error("- Vertex API not enabled OR wrong region");
      }
    }
  }

  // ❌ All models failed
  console.error("🚨 All Vertex AI models failed. Returning fallback.");

  return {
    risk_score: 50,
    risk_level: "MEDIUM",
    scam_detected: false,
    patterns: ["vertex_failure"],
    verdict: "AI analysis unavailable",
    reasons: ["Vertex AI request failed"],
    explanation:
      "All model attempts failed due to configuration, permission, or model availability issues.",
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