import { db } from "../../config/db.js";

<<<<<<< HEAD
export const getDependents = (guardianId) => {
  const persons = readData("protectedPersons");
  return persons.filter((p) => p.guardianId === guardianId);
};

export const getGuardianForUser = (userId) => {
  const persons = readData("protectedPersons");
  const dependent = persons.find((p) => p.id === userId);
  return dependent ? dependent.guardianId : null;
=======
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

export const createLinkingRequest = async (fromUserId, toSerialId, type) => {
  // 1. Find the target user by serialId
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

  // 2. Check for existing requests or links
  const requestsRef = db.collection("linkingRequests");
  const existingRequest = await requestsRef
    .where("fromUserId", "==", fromUserId)
    .where("toUserId", "==", toUserId)
    .where("status", "==", "pending")
    .get();

  if (!existingRequest.empty) {
    throw new Error("A link request is already pending.");
  }

  // 3. Create the request
  const newRequest = {
    fromUserId,
    toUserId,
    type, // 'guardian' or 'dependent'
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const docRef = await requestsRef.add(newRequest);
  return { id: docRef.id, ...newRequest };
};

export const getPendingRequests = async (userId) => {
  const snapshot = await db
    .collection("linkingRequests")
    .where("toUserId", "==", userId)
    .where("status", "==", "pending")
    .get();

  const requests = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Get requester info
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

export const handleLinkingRequest = async (requestId, status, nickname = null) => {
  const requestRef = db.collection("linkingRequests").doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new Error("Request not found.");
  }

  const requestData = requestDoc.data();
  if (requestData.status !== "pending") {
    throw new Error("Request has already been processed.");
  }

  await requestRef.update({
    status,
    respondedAt: new Date().toISOString(),
    nickname, // Store nickname in the request as well for reference
  });

  if (status === "accepted") {
    // Create link in protectedPersons
    const guardianId = requestData.type === "guardian" ? requestData.fromUserId : requestData.toUserId;
    const childId = requestData.type === "guardian" ? requestData.toUserId : requestData.fromUserId;

    await db.collection("protectedPersons").add({
      guardianId,
      childId,
      nickname: nickname || requestData.requesterName || "Protected Person",
      linkedAt: new Date().toISOString(),
    });

    // Update guardian identity to 'guardian'
    await db.collection("users").doc(guardianId).update({
      identity: "guardian"
    });
  }

  return { id: requestId, ...requestData, status, nickname };
};

export const getLinks = async (userId) => {
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
      role: 'dependent'
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
      role: 'guardian'
    });
  }

  return links;
>>>>>>> origin/hg
};