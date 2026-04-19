import { buildPrompt } from "../ai/promptBuilder.js";
import { callGemini } from "../ai/gemini.service.js";
import { db } from "../../config/db.js";
import { v4 as uuid } from "uuid";
import { getGuardianForUser } from "../guardian/guardian.service.js";
import { createAlert } from "../alerts/alert.service.js";

export const scanText = async (text, userId) => {
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
    userId,
    createdAt: new Date().toISOString(),
  };

  await db.collection("scans").doc(newScan.id).set(newScan);

  // If high or medium risk, alert guardian if exists
  if (userId && (aiResult.risk_level === "HIGH" || aiResult.risk_level === "MEDIUM")) {
    const guardianId = getGuardianForUser(userId);
    if (guardianId) {
      createAlert({
        guardianId,
        dependentId: userId,
        type: "TEXT_SCAM_DETECTED",
        title: "Scam Text Detected",
        message: `Dependent received a ${aiResult.risk_level} risk message: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
        riskLevel: aiResult.risk_level,
        scanId: newScan.id,
      });
    }
  }

  return newScan;
};

export const scanUrl = async (url, userId) => {
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
    userId,
    createdAt: new Date().toISOString(),
  };

  await db.collection("scans").doc(newScan.id).set(newScan);

  // If high or medium risk, alert guardian if exists
  if (userId && (aiResult.risk_level === "HIGH" || aiResult.risk_level === "MEDIUM")) {
    const guardianId = getGuardianForUser(userId);
    if (guardianId) {
      createAlert({
        guardianId,
        dependentId: userId,
        type: "URL_SCAM_DETECTED",
        title: "Scam URL Detected",
        message: `Dependent accessed a ${aiResult.risk_level} risk URL: ${url}`,
        riskLevel: aiResult.risk_level,
        scanId: newScan.id,
      });
    }
  }

  return newScan;
};

export const getScan = async (id) => {
  const doc = await db.collection("scans").doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data();
};