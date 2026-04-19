import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { FIREBASE_SERVICE_ACCOUNT_PATH } from "./env.js";

// Ensure the path is resolved properly
const serviceAccountPath = path.resolve(FIREBASE_SERVICE_ACCOUNT_PATH);

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Firebase service account file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();