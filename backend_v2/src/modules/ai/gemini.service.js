import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "./promptBuilder.js";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is not set in .env!");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Models confirmed available for this API key (v1beta)
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export const callGemini = async (prompt) => {
  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(prompt);
      const resultText = result.response.text();

      console.log(`✅ Success with model: ${modelName}`);
      console.log("Raw response (first 200 chars):", resultText?.slice(0, 200));

      const cleaned = resultText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      return JSON.parse(cleaned);
    } catch (err) {
      const errMsg = err.message || String(err);
      console.warn(`❌ Model ${modelName} failed: ${errMsg}`);
      if (errMsg.includes("400") || errMsg.includes("API key")) {
        console.error("⚠️  API key may be invalid. Check your .env file!");
        console.error("Current key starts with:", process.env.GEMINI_API_KEY?.slice(0, 10));
      }
    }
  }

  // All models failed
  console.error("All Gemini models failed. Returning fallback.");
  return {
    risk_score: 50,
    risk_level: "MEDIUM",
    scam_detected: false,
    patterns: ["fallback_triggered"],
    verdict: "AI analysis failed, fallback applied.",
    reasons: ["All AI models unavailable or quota exceeded."],
    explanation: "The AI analysis encountered an error. Proceed with caution.",
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
