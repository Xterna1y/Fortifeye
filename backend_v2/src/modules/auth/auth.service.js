import { db } from "../../config/db.js";
import { hashPassword, verifyPassword } from "./password.service.js";

const generateSerialId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "FE-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const login = async (email, password) => {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("email", "==", email).get();

  if (snapshot.empty) {
    return { ok: false, code: "USER_NOT_FOUND" };
  }

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();

  if (!userData.passwordHash) {
    return { ok: false, code: "PASSWORD_NOT_SET" };
  }

  const isPasswordValid = await verifyPassword(password, userData.passwordHash);

  if (!isPasswordValid) {
    return { ok: false, code: "INVALID_PASSWORD" };
  }

  const { passwordHash, ...safeUserData } = userData;
  return { ok: true, user: { id: userDoc.id, ...safeUserData } };
};

export const register = async (userData) => {
  const usersRef = db.collection("users");
  
  // Check if user already exists
  const snapshot = await usersRef.where("email", "==", userData.email).get();
  if (!snapshot.empty) {
    throw new Error("User with this email already exists");
  }

  // Generate a unique serialId
  let serialId;
  let isUnique = false;
  while (!isUnique) {
    serialId = generateSerialId();
    const serialSnapshot = await usersRef.where("serialId", "==", serialId).get();
    if (serialSnapshot.empty) {
      isUnique = true;
    }
  }

  // Add new user
  const newUser = {
    ...userData,
    passwordHash: await hashPassword(userData.password),
    serialId,
    createdAt: new Date().toISOString(),
  };

  const docRef = await usersRef.add(newUser);
  const { passwordHash, ...safeUserData } = newUser;
  return { id: docRef.id, ...safeUserData };
};

export const getProfile = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }
  const userData = userDoc.data();
  const { passwordHash, ...safeUserData } = userData;
  return { id: userDoc.id, ...safeUserData };
};
