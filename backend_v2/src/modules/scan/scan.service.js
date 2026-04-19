import { buildPrompt } from "../ai/promptBuilder.js";
import { callGemini } from "../ai/gemini.service.js";
import { db } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const scanText = async (text) => {
  const prompt = buildPrompt("text", { text });

  const aiResult = await callGemini(prompt);

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

  const aiResult = await callGemini(prompt);

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