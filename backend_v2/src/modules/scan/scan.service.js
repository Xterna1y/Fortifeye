import { buildPrompt } from "../ai/promptBuilder.js";
import { callGemini } from "../ai/gemini.service.js";
import { readData, writeData } from "../../config/db.js";
import { v4 as uuid } from "uuid";
import { getGuardianForUser } from "../guardian/guardian.service.js";
import { createAlert } from "../alerts/alert.service.js";

export const scanText = async (text, userId) => {
  const prompt = buildPrompt("text", { text });

  const aiResult = await callGemini(prompt);

  const scans = readData("scans");

  const newScan = {
    id: uuid(),
    type: "text",
    input: text,
    ...aiResult,
    userId,
    createdAt: new Date().toISOString(),
  };

  scans.push(newScan);
  writeData("scans", scans);

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

  const aiResult = await callGemini(prompt);

  const scans = readData("scans");

  const newScan = {
    id: uuid(),
    type: "url",
    input: url,
    ...aiResult,
    userId,
    createdAt: new Date().toISOString(),
  };

  scans.push(newScan);
  writeData("scans", scans);

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

export const getScan = (id) => {
  const scans = readData("scans");
  return scans.find((s) => s.id === id);
};