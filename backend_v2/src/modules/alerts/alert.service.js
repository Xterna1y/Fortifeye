import { db } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const createAlert = async (data) => {
  const newAlert = {
    id: uuid(),
    status: "pending",
    ...data,
    createdAt: new Date().toISOString(),
  };

  await db.collection("alerts").doc(newAlert.id).set(newAlert);

  return newAlert;
};

export const getAlertsByGuardian = async (guardianId) => {
  if (!db) {
    return [];
  }

  const snapshot = await db
    .collection("alerts")
    .where("guardianId", "==", guardianId)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

export const updateAlertStatus = async (alertId, status) => {
  if (!db) {
    return null;
  }

  const ref = db.collection("alerts").doc(alertId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  await ref.update({
    status,
    updatedAt: new Date().toISOString(),
  });

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
};
