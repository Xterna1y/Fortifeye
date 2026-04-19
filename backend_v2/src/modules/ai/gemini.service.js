import { GoogleGenAI } from "@google/genai";
import { buildPrompt } from "./promptBuilder.js";
import dotenv from "dotenv";

dotenv.config();

// Placeholder API Key if not present
const apiKey = process.env.GEMINI_API_KEY;

// Instantiate the SDK
const ai = new GoogleGenAI({ apiKey });

export const callGemini = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    // Extract the text and parse the JSON since the prompt enforces strict JSON
    const resultText = response.text;
    const parsedResult = JSON.parse(resultText);
    return parsedResult;
  } catch (error) {
    console.error("Gemini AI error:", error);
    // Fallback Condition as specified in the prompt
    return {
      risk_score: 50,
      risk_level: "MEDIUM",
      scam_detected: false,
      patterns: ["fallback_triggered"],
      verdict: "AI analysis failed, fallback applied.",
      reasons: ["Unable to process AI response or malformed JSON"],
      explanation: "The AI analysis encountered an error. Proceed with caution.",
      recommended_action: "warn"
    };
  }
};

export const analyzeSandboxRisk = async (input) => {
  const prompt = buildPrompt("sandbox", input);

  const aiResult = await callGemini(prompt);

  return {
    ...aiResult,
    generated_at: new Date().toISOString(),
    model: "gemini-2.5-flash",
  };
};
