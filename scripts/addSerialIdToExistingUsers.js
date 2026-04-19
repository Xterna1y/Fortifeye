import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: "../backend_v2/.env" });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error("FIREBASE_SERVICE_ACCOUNT_PATH not found in .env");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve("../backend_v2", serviceAccountPath), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const generateSerialId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "FE-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const migrate = async () => {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log("No users found.");
    return;
  }

  const batch = db.batch();
  const existingSerials = new Set();

  // First pass: collect existing serials
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.serialId) {
      existingSerials.add(data.serialId);
    }
  });

  // Second pass: add serials to users who don't have them
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.serialId) {
      let serialId;
      let isUnique = false;
      while (!isUnique) {
        serialId = generateSerialId();
        if (!existingSerials.has(serialId)) {
          isUnique = true;
          existingSerials.add(serialId);
        }
      }
      batch.update(doc.ref, { serialId });
      console.log(`Assigning ${serialId} to ${data.email}`);
    }
  }

  await batch.commit();
  console.log("Migration completed.");
};

migrate().catch(console.error);
