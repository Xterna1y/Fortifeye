import { analyzeTextRisk, analyzeUrlRisk } from "../ai/gemini.service.js";
import { v4 as uuid } from "uuid";
import { getGuardianForUser } from "../guardian/guardian.service.js";
import { createAlert } from "../alerts/alert.service.js";
import { db } from "../../config/db.js";

const memoryScans = new Map();

const persistScan = async (scan) => {
  if (db) {
    await db.collection("scans").doc(scan.id).set(scan);
    return;
  }

  memoryScans.set(scan.id, scan);
};

export const scanText = async (text, userId) => {
  const aiResult = await analyzeTextRisk({ text });

  const newScan = {
    id: uuid(),
    type: "text",
    input: text,
    ...aiResult,
    userId,
    createdAt: new Date().toISOString(),
  };

  await persistScan(newScan);

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
  const aiResult = await analyzeUrlRisk({ url });

  const newScan = {
    id: uuid(),
    type: "url",
    input: url,
    ...aiResult,
    userId,
    createdAt: new Date().toISOString(),
  };

  await persistScan(newScan);

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
  if (db) {
    const doc = await db.collection("scans").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  return memoryScans.get(id) || null;
};
