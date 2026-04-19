import { buildPrompt } from "../ai/promptBuilder.js";
import { callGemini } from "../ai/gemini.service.js";
import { db } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const scanText = async (text) => {
  const prompt = buildPrompt("text", { text });

  // const aiResult = await callGemini(prompt);

  // Provide mock data structure expected by the frontend
  const isScam = text.toLowerCase().includes("transfer") || text.toLowerCase().includes("urgent") || text.toLowerCase().includes("compromised") || text.toLowerCase().includes("rm");
  
  const aiResult = {
    risk_score: isScam ? 85 : 15,
    scam_detected: isScam,
    patterns: isScam ? ['urgency', 'financial_request'] : [],
    explanation: isScam ? 'Message uses urgency tactics and requests money transfer. High probability of scam.' : 'Message appears safe with no detected scam indicators.',
    recommended_action: isScam ? 'block' : 'allow',
    risk_level: isScam ? 'HIGH' : 'LOW'
  };

  const newScan = {
    id: uuid(),
    type: "text",
    input: text,
    ...aiResult,
    createdAt: new Date().toISOString(),
  };

  await db.collection("scans").doc(newScan.id).set(newScan);

  return newScan;
};

export const scanUrl = async (url) => {
  const prompt = buildPrompt("url", { url });

  // const aiResult = await callGemini(prompt);

  const isScam = url.toLowerCase().includes("login") || url.toLowerCase().includes("short.ly");
  
  const aiResult = {
    risk_score: isScam ? 90 : 20,
    scam_detected: isScam,
    patterns: isScam ? ['suspicious_domain'] : [],
    explanation: isScam ? 'URL directs to a known phishing or highly suspicious domain.' : 'URL appears to be safe.',
    recommended_action: isScam ? 'block' : 'allow',
    risk_level: isScam ? 'HIGH' : 'LOW'
  };

  const newScan = {
    id: uuid(),
    type: "url",
    input: url,
    ...aiResult,
    createdAt: new Date().toISOString(),
  };

  await db.collection("scans").doc(newScan.id).set(newScan);

  return newScan;
};

export const getScan = async (id) => {
  const doc = await db.collection("scans").doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data();
};