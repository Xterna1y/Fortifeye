import { analyzeTextRisk, analyzeUrlRisk } from "../ai/gemini.service.js";
import { readData, writeData } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const scanText = async (text) => {
  const aiResult = await analyzeTextRisk({ text });
  const scans = readData("scans");

  const newScan = {
    id: uuid(),
    type: "text",
    input: text,
    ...aiResult,
    createdAt: new Date().toISOString(),
  };

  scans.push(newScan);
  writeData("scans", scans);

  return newScan;
};

export const scanUrl = async (url) => {
  const aiResult = await analyzeUrlRisk({ url });
  const scans = readData("scans");

  const newScan = {
    id: uuid(),
    type: "url",
    input: url,
    ...aiResult,
    createdAt: new Date().toISOString(),
  };

  scans.push(newScan);
  writeData("scans", scans);

  return newScan;
};

export const getScan = (id) => {
  const scans = readData("scans");
  return scans.find((scan) => scan.id === id);
};
