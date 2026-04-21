import { db } from "../../config/db.js";

// --- Helpers for file-based fallback ---
const inMemoryPersons = [
  { id: "user_123", guardianId: "guardian_456" },
];

const getPersons = () => inMemoryPersons;

const DEFAULT_GUARDIAN_SETTINGS = {
  emergencyLock: false,
};

const normalizeGuardianSettings = (settings) => ({
  emergencyLock:
    typeof settings?.emergencyLock === "boolean"
      ? settings.emergencyLock
      : DEFAULT_GUARDIAN_SETTINGS.emergencyLock,
});

const getGuardianSettingsForUser = async (userId) => {
  if (!db) {
    return DEFAULT_GUARDIAN_SETTINGS;
  }

  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    throw new Error("Guardian user not found.");
  }

  return normalizeGuardianSettings(userDoc.data()?.guardianSettings);
};

const enrichTransactionRequestDoc = async (doc) => {
  const data = doc.data();
  const [guardianDoc, dependentDoc, linkDoc] = await Promise.all([
    db.collection("users").doc(data.guardianId).get(),
    db.collection("users").doc(data.dependentId).get(),
    db.collection("protectedPersons").doc(data.linkId).get(),
  ]);

  const guardianData = guardianDoc.exists ? guardianDoc.data() : null;
  const dependentData = dependentDoc.exists ? dependentDoc.data() : null;
  const linkData = linkDoc.exists ? linkDoc.data() : null;

  return {
    id: doc.id,
    ...data,
    guardianName: guardianData?.name ?? null,
    guardianEmail: guardianData?.email ?? null,
    guardianSerial: guardianData?.serialId ?? null,
    guardianSettings: normalizeGuardianSettings(guardianData?.guardianSettings),
    dependentName: dependentData?.name ?? null,
    dependentEmail: dependentData?.email ?? null,
    dependentSerial: dependentData?.serialId ?? null,
    linkNickname: linkData?.nickname ?? null,
  };
};

// --- Exported functions ---

export const getDependents = async (guardianId) => {
  if (db) {
    const snapshot = await db
      .collection("protectedPersons")
      .where("guardianId", "==", guardianId)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
  return getPersons().filter((p) => p.guardianId === guardianId);
};

export const getGuardianForUser = (userId) => {
  const persons = getPersons();
  const dependent = persons.find((p) => p.id === userId);
  return dependent ? dependent.guardianId : null;
};

export const createLinkingRequest = async (fromUserId, toSerialId, type) => {
  if (!db) throw new Error("Firebase not configured.");

  const usersRef = db.collection("users");
  const userSnapshot = await usersRef.where("serialId", "==", toSerialId).get();

  if (userSnapshot.empty) {
    throw new Error("User with this Serial ID not found.");
  }

  const targetUser = userSnapshot.docs[0];
  const toUserId = targetUser.id;

  if (fromUserId === toUserId) {
    throw new Error("You cannot link your own account.");
  }

  const requestsRef = db.collection("linkingRequests");
  const existingRequest = await requestsRef
    .where("fromUserId", "==", fromUserId)
    .where("toUserId", "==", toUserId)
    .where("status", "==", "pending")
    .get();

  if (!existingRequest.empty) {
    throw new Error("A link request is already pending.");
  }

  const newRequest = {
    fromUserId,
    toUserId,
    type,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const docRef = await requestsRef.add(newRequest);
  return { id: docRef.id, ...newRequest };
};

export const getPendingRequests = async (userId) => {
  if (!db) return [];

  const snapshot = await db
    .collection("linkingRequests")
    .where("toUserId", "==", userId)
    .where("status", "==", "pending")
    .get();

  const requests = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const requesterDoc = await db.collection("users").doc(data.fromUserId).get();
    const requesterData = requesterDoc.data();
    requests.push({
      id: doc.id,
      ...data,
      requesterEmail: requesterData?.email,
      requesterName: requesterData?.name,
    });
  }
  return requests;
};

export const getRequestHistory = async (userId) => {
  if (!db) return [];

  const requestsRef = db.collection("linkingRequests");
  const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
    requestsRef.where("toUserId", "==", userId).get(),
    requestsRef.where("fromUserId", "==", userId).get(),
  ]);

  const docsById = new Map();
  [...incomingSnapshot.docs, ...outgoingSnapshot.docs].forEach((doc) => {
    docsById.set(doc.id, doc);
  });

  const userIds = new Set();
  docsById.forEach((doc) => {
    const data = doc.data();
    if (data.fromUserId) {
      userIds.add(data.fromUserId);
    }
    if (data.toUserId) {
      userIds.add(data.toUserId);
    }
  });

  const userDocs = await Promise.all(
    [...userIds].map(async (id) => {
      const doc = await db.collection("users").doc(id).get();
      return [id, doc.exists ? doc.data() : null];
    }),
  );

  const usersById = new Map(userDocs);

  return [...docsById.values()]
    .map((doc) => {
      const data = doc.data();
      const requesterData = usersById.get(data.fromUserId);
      const targetData = usersById.get(data.toUserId);

      return {
        id: doc.id,
        ...data,
        requesterName: requesterData?.name ?? null,
        requesterEmail: requesterData?.email ?? null,
        requesterSerial: requesterData?.serialId ?? null,
        targetName: targetData?.name ?? null,
        targetEmail: targetData?.email ?? null,
        targetSerial: targetData?.serialId ?? null,
      };
    })
    .sort((a, b) => {
      const first = new Date(b.respondedAt ?? b.createdAt).getTime();
      const second = new Date(a.respondedAt ?? a.createdAt).getTime();
      return first - second;
    });
};

export const handleLinkingRequest = async (requestId, status, nickname = null) => {
  if (!db) throw new Error("Firebase not configured.");

  const requestRef = db.collection("linkingRequests").doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) throw new Error("Request not found.");

  const requestData = requestDoc.data();
  if (requestData.status !== "pending") throw new Error("Request has already been processed.");

  await requestRef.update({ status, respondedAt: new Date().toISOString(), nickname });

  if (status === "accepted") {
    const guardianId = requestData.type === "guardian" ? requestData.fromUserId : requestData.toUserId;
    const childId = requestData.type === "guardian" ? requestData.toUserId : requestData.fromUserId;

    await db.collection("protectedPersons").add({
      guardianId,
      childId,
      nickname: nickname || "Protected Person",
      linkedAt: new Date().toISOString(),
    });

    await db.collection("users").doc(guardianId).update({ identity: "guardian" });
  }

  return { id: requestId, ...requestData, status, nickname };
};

export const getLinks = async (userId) => {
  if (!db) return [];

  const guardianSnapshot = await db
    .collection("protectedPersons")
    .where("guardianId", "==", userId)
    .get();

  const dependentSnapshot = await db
    .collection("protectedPersons")
    .where("childId", "==", userId)
    .get();

  const links = [];

  for (const doc of guardianSnapshot.docs) {
    const data = doc.data();
    const childDoc = await db.collection("users").doc(data.childId).get();
    const childData = childDoc.data();
    const guardianDoc = await db.collection("users").doc(data.guardianId).get();
    const guardianData = guardianDoc.data();
    links.push({
      id: doc.id,
      ...data,
      otherUserEmail: childData?.email,
      otherUserName: childData?.name,
      otherUserSerial: childData?.serialId,
      guardianSettings: normalizeGuardianSettings(guardianData?.guardianSettings),
      role: "dependent",
    });
  }

  for (const doc of dependentSnapshot.docs) {
    const data = doc.data();
    const guardianDoc = await db.collection("users").doc(data.guardianId).get();
    const guardianData = guardianDoc.data();
    links.push({
      id: doc.id,
      ...data,
      otherUserEmail: guardianData?.email,
      otherUserName: guardianData?.name,
      otherUserSerial: guardianData?.serialId,
      guardianSettings: normalizeGuardianSettings(guardianData?.guardianSettings),
      role: "guardian",
    });
  }

  return links;
};

export const removeLink = async (linkId, userId) => {
  if (!db) throw new Error("Firebase not configured.");

  const linkRef = db.collection("protectedPersons").doc(linkId);
  const linkDoc = await linkRef.get();

  if (!linkDoc.exists) {
    throw new Error("Linked account not found.");
  }

  const linkData = linkDoc.data();
  const isAuthorizedUser =
    linkData.guardianId === userId || linkData.childId === userId;

  if (!isAuthorizedUser) {
    throw new Error("You do not have permission to remove this linked account.");
  }

  await linkRef.delete();

  return {
    id: linkId,
    ...linkData,
    removed: true,
  };
};

export const updateLinkNickname = async (linkId, userId, nickname) => {
  if (!db) throw new Error("Firebase not configured.");

  const nextNickname = typeof nickname === "string" ? nickname.trim() : "";
  if (!nextNickname) {
    throw new Error("Nickname is required.");
  }

  const linkRef = db.collection("protectedPersons").doc(linkId);
  const linkDoc = await linkRef.get();

  if (!linkDoc.exists) {
    throw new Error("Linked account not found.");
  }

  const linkData = linkDoc.data();
  const isAuthorizedUser =
    linkData.guardianId === userId || linkData.childId === userId;

  if (!isAuthorizedUser) {
    throw new Error("You do not have permission to update this nickname.");
  }

  await linkRef.update({
    nickname: nextNickname,
    updatedAt: new Date().toISOString(),
  });

  const updatedDoc = await linkRef.get();
  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
  };
};

export const createTransactionRequest = async (
  dependentId,
  linkId,
  amount,
  title,
  reason,
  details = "",
) => {
  if (!db) throw new Error("Firebase not configured.");

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const nextTitle = typeof title === "string" ? title.trim() : "";
  const nextReason = typeof reason === "string" ? reason.trim() : "";
  const nextDetails = typeof details === "string" ? details.trim() : "";

  if (!nextTitle) {
    throw new Error("Transaction title is required.");
  }

  if (!nextReason) {
    throw new Error("Transaction reason is required.");
  }

  const linkRef = db.collection("protectedPersons").doc(linkId);
  const linkDoc = await linkRef.get();

  if (!linkDoc.exists) {
    throw new Error("Linked guardian account not found.");
  }

  const linkData = linkDoc.data();

  if (linkData.childId !== dependentId) {
    throw new Error("You can only submit transaction requests for your own guardian link.");
  }

  const guardianSettings = await getGuardianSettingsForUser(linkData.guardianId);

  if (guardianSettings.emergencyLock) {
    throw new Error("Your guardian has temporarily locked transaction requests.");
  }

  const now = new Date().toISOString();

  const newRequest = {
    linkId,
    guardianId: linkData.guardianId,
    dependentId,
    amount: numericAmount,
    title: nextTitle,
    reason: nextReason,
    details: nextDetails,
    status: "pending",
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };

  const docRef = await db.collection("transactionRequests").add(newRequest);
  const requestDoc = await docRef.get();
  return enrichTransactionRequestDoc(requestDoc);
};

export const getTransactionRequests = async (userId) => {
  if (!db) return [];

  const requestsRef = db.collection("transactionRequests");
  const [guardianSnapshot, dependentSnapshot] = await Promise.all([
    requestsRef.where("guardianId", "==", userId).get(),
    requestsRef.where("dependentId", "==", userId).get(),
  ]);

  const docsById = new Map();
  [...guardianSnapshot.docs, ...dependentSnapshot.docs].forEach((doc) => {
    docsById.set(doc.id, doc);
  });

  const enrichedRequests = await Promise.all(
    [...docsById.values()].map((doc) => enrichTransactionRequestDoc(doc)),
  );

  return enrichedRequests.sort(
    (first, second) =>
      new Date(second.updatedAt ?? second.createdAt).getTime() -
      new Date(first.updatedAt ?? first.createdAt).getTime(),
  );
};

export const updateTransactionRequest = async (
  requestId,
  guardianId,
  status,
  rejectionReason = "",
) => {
  if (!db) throw new Error("Firebase not configured.");

  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid transaction request status.");
  }

  const requestRef = db.collection("transactionRequests").doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new Error("Transaction request not found.");
  }

  const requestData = requestDoc.data();

  if (requestData.guardianId !== guardianId) {
    throw new Error("You do not have permission to review this transaction request.");
  }

  if (requestData.status !== "pending") {
    throw new Error("This transaction request has already been reviewed.");
  }

  const nextRejectionReason =
    status === "rejected" && typeof rejectionReason === "string" && rejectionReason.trim()
      ? rejectionReason.trim()
      : null;

  await requestRef.update({
    status,
    rejectionReason: nextRejectionReason,
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const updatedDoc = await requestRef.get();
  return enrichTransactionRequestDoc(updatedDoc);
};

export const getGuardianSettings = async (userId) => {
  return getGuardianSettingsForUser(userId);
};

export const updateGuardianSettings = async (userId, updates) => {
  if (!db) throw new Error("Firebase not configured.");

  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("Guardian user not found.");
  }

  const currentSettings = normalizeGuardianSettings(userDoc.data()?.guardianSettings);
  const nextSettings = normalizeGuardianSettings({
    ...currentSettings,
    ...updates,
  });

  await userRef.update({
    guardianSettings: nextSettings,
    updatedAt: new Date().toISOString(),
  });

  return nextSettings;
};
