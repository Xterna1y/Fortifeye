import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(backendRoot, ".env") });

let db = null;

function resolveServiceAccountPath() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!configuredPath) {
    return null;
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(backendRoot, configuredPath);
}

function loadServiceAccount(serviceAccountPath) {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Firebase service account not found at ${serviceAccountPath}`);
  }

  const raw = fs.readFileSync(serviceAccountPath, "utf-8").trim();

  if (!raw) {
    throw new Error(`Firebase service account file is empty at ${serviceAccountPath}`);
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error(`Firebase service account file is not valid JSON at ${serviceAccountPath}`);
  }

  const requiredFields = ["project_id", "client_email", "private_key"];
  const missingFields = requiredFields.filter((field) => !serviceAccount[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Firebase service account is missing required fields (${missingFields.join(", ")}) at ${serviceAccountPath}`
    );
  }

  return serviceAccount;
}

try {
  const serviceAccountPath = resolveServiceAccountPath();

  if (serviceAccountPath) {
    const serviceAccount = loadServiceAccount(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    console.log("✅ Firebase connected.");
  } else {
    console.warn("⚠️  Firebase service account not found — running without Firebase.");
  }
} catch (err) {
  console.warn("⚠️  Firebase init failed:", err.message);
}

export { db };
