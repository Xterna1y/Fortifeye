import fs from "fs";
import path from "path";
import { db } from "../src/config/db.js";

const dataPath = path.resolve("src/data");

const migrateCollection = async (collectionName) => {
  const filePath = path.join(dataPath, `${collectionName}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`No local data found for collection: ${collectionName}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (!Array.isArray(data)) {
    console.error(`Data in ${collectionName}.json is not an array.`);
    return;
  }

  console.log(`Migrating ${data.length} records to ${collectionName}...`);

  const batch = db.batch();
  let count = 0;

  for (const item of data) {
    // If the item has an 'id' or 'session_id', we use it as the document ID
    const docId = item.id || item.session_id || item.email;

    const docRef = docId
      ? db.collection(collectionName).doc(docId)
      : db.collection(collectionName).doc();

    batch.set(docRef, item);
    count++;

    // Firestore batch limit is 500 operations
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Committed ${count} records...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully migrated ${collectionName}`);
};

const collections = [
  "users",
  "scans",
  "protectedPersons",
  "sandboxSessions",
  "alerts",
];

const runMigration = async () => {
  console.log("Starting data migration to Firestore...");
  for (const collection of collections) {
    await migrateCollection(collection);
  }
  console.log("Migration complete.");
  process.exit(0);
};

runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
