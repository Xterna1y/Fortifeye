import admin from "firebase-admin";
import fs from "fs";
import { FIREBASE_SERVICE_ACCOUNT_PATH } from "./env.js";

let db = null;

try {
  const serviceAccountPath = FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
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
