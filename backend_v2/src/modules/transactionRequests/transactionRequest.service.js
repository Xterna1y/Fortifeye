import { db } from "../../config/db.js";
import { v4 as uuid } from "uuid";

const COLLECTION_NAME = "transactionRequests";

export const createTransactionRequest = async (data) => {
  if (!db) {
    throw new Error("Firebase not configured.");
  }

  const newRequest = {
    id: uuid(),
    guardianId: data.guardianId,
    dependentId: data.dependentId,
    title: data.title || "Transaction request",
    message: data.message || "",
    amount: Number(data.amount) || 0,
    status: "pending",
    riskLevel: data.riskLevel || "medium",
    decisionReason: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection(COLLECTION_NAME).doc(newRequest.id).set(newRequest);
  return newRequest;
};

export const getRequestsByGuardian = async (guardianId) => {
  if (!db) {
    return [];
  }

  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where("guardianId", "==", guardianId)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    );
};

export const getRequestsByDependent = async (dependentId) => {
  if (!db) {
    return [];
  }

  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where("dependentId", "==", dependentId)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    );
};

export const updateTransactionRequestStatus = async (
  requestId,
  status,
  decisionReason,
) => {
  if (!db) {
    return null;
  }

  const ref = db.collection(COLLECTION_NAME).doc(requestId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  const normalizedStatus = status === "blocked" ? "denied" : status;

  await ref.update({
    status: normalizedStatus,
    decisionReason:
      typeof decisionReason === "string" ? decisionReason.trim() : "",
    updatedAt: new Date().toISOString(),
  });

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
};
