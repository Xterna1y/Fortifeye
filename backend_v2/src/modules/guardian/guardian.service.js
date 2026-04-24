import { db } from "../../config/db.js";

// --- Helpers for file-based fallback ---
const inMemoryPersons = [
  { id: "user_123", guardianId: "guardian_456" },
];

const getPersons = () => inMemoryPersons;

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

export const createLinkingRequest = async (
  fromUserId,
  toSerialId,
  type,
  senderNickname = null,
) => {
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
    senderNickname: typeof senderNickname === "string" ? senderNickname.trim() : null,
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
      requesterSerial: requesterData?.serialId,
    });
  }
  return requests;
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
    const senderNickname =
      typeof requestData.senderNickname === "string"
        ? requestData.senderNickname.trim()
        : "";
    const receiverNickname = typeof nickname === "string" ? nickname.trim() : "";

    const guardianNickname =
      requestData.type === "dependent" ? senderNickname : receiverNickname;
    const dependentNickname =
      requestData.type === "guardian" ? senderNickname : receiverNickname;

    await db.collection("protectedPersons").add({
      guardianId,
      childId,
      guardianNickname: guardianNickname || null,
      dependentNickname: dependentNickname || null,
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
    links.push({
      id: doc.id,
      ...data,
      otherUserEmail: childData?.email,
      otherUserName: childData?.name,
      otherUserSerial: childData?.serialId,
      nickname: data.dependentNickname || null,
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
      nickname: data.guardianNickname || null,
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
    throw new Error("Link not found.");
  }

  const linkData = linkDoc.data();
  if (linkData.guardianId !== userId && linkData.childId !== userId) {
    throw new Error("You do not have permission to remove this link.");
  }

  await linkRef.delete();

  const guardianLinks = await db
    .collection("protectedPersons")
    .where("guardianId", "==", linkData.guardianId)
    .get();

  if (guardianLinks.empty) {
    await db.collection("users").doc(linkData.guardianId).update({ identity: "na" });
  }

  return { id: linkId, removed: true };
};

export const updateLinkNickname = async (linkId, userId, nickname) => {
  if (!db) throw new Error("Firebase not configured.");

  const trimmedNickname = String(nickname || "").trim();
  if (!trimmedNickname) {
    throw new Error("Nickname is required.");
  }

  const linkRef = db.collection("protectedPersons").doc(linkId);
  const linkDoc = await linkRef.get();

  if (!linkDoc.exists) {
    throw new Error("Link not found.");
  }

  const linkData = linkDoc.data();
  if (linkData.guardianId !== userId && linkData.childId !== userId) {
    throw new Error("You do not have permission to update this link.");
  }

  const nicknameField =
    linkData.guardianId === userId ? "dependentNickname" : "guardianNickname";

  await linkRef.update({
    [nicknameField]: trimmedNickname,
    updatedAt: new Date().toISOString(),
  });

  const updatedDoc = await linkRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};
