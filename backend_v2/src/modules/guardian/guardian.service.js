import { db } from "../../config/db.js";

export const getDependents = async (guardianId) => {
  const snapshot = await db
    .collection("protectedPersons")
    .where("guardianId", "==", guardianId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};