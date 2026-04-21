import { v4 as uuid } from "uuid";
import { db } from "../../config/db.js";
import { analyzeTextRisk, analyzeUrlRisk } from "../ai/gemini.service.js";

const COLLECTION = "scans";

const saveScan = async ({ type, input, aiResult }) => {
  const newScan = {
    id: uuid(),
    type,
    input,
    ...aiResult,
    createdAt: new Date().toISOString(),
  };

  await db.collection(COLLECTION).doc(newScan.id).set(newScan);
  console.log(
    `[SCAN] ${type} saved id=${newScan.id} risk=${newScan.risk_score} action=${newScan.recommended_action} model=${newScan.model || "unknown"}`,
  );
  return newScan;
};

export const scanText = async (text) => {
  console.log(`[SCAN] text start length=${String(text || "").length}`);
  const aiResult = await analyzeTextRisk({ text });

  return saveScan({
    type: "text",
    input: text,
    aiResult,
  });
};

export const scanUrl = async (url) => {
  console.log(`[SCAN] url start value=${String(url || "")}`);
  const aiResult = await analyzeUrlRisk({ url });

  return saveScan({
    type: "url",
    input: url,
    aiResult,
  });
};

export const getScan = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
};
