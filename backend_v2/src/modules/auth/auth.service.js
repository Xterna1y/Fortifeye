import crypto from "crypto";
import { db } from "../../config/db.js";

const generateSerialId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "FE-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const sanitizeUser = (userData, userId) => {
  const { passwordHash, password, passwordUpdatedAt, ...safeUser } = userData;
  return { id: userId, ...safeUser };
};

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const derivedHash = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (derivedHash.length !== originalBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedHash, originalBuffer);
};

const assertPasswordStrength = (password) => {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password cannot be empty");
  }
};

const checkPassword = (userData, password) => {
  if (userData.passwordHash) {
    return verifyPassword(password, userData.passwordHash);
  }

  if (typeof userData.password === "string") {
    return userData.password === password;
  }

  return false;
};

export const login = async (email, password) => {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("email", "==", email).get();

  if (snapshot.empty) {
    return null;
  }

  // Assuming email is unique, returning the first match
  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();
  const hasStoredPassword = Boolean(userData.passwordHash || userData.password);

  if (hasStoredPassword && !checkPassword(userData, password)) {
    throw new Error("Invalid email or password");
  }

  return sanitizeUser(userData, userDoc.id);
};

export const register = async (userData) => {
  const usersRef = db.collection("users");
  assertPasswordStrength(userData.password);
  
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
    email: userData.email.toLowerCase(),
    passwordHash: hashPassword(userData.password),
    passwordUpdatedAt: new Date().toISOString(),
    serialId,
    createdAt: new Date().toISOString(),
  };

  delete newUser.password;

  const docRef = await usersRef.add(newUser);
  return sanitizeUser(newUser, docRef.id);
};

export const getProfile = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }
  return sanitizeUser(userDoc.data(), userDoc.id);
};

export const updateProfile = async (userId, updates) => {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const currentData = userDoc.data();
  const nextData = {};

  if (typeof updates.name === "string" && updates.name.trim()) {
    nextData.name = updates.name.trim();
  }

  if (typeof updates.email === "string" && updates.email.trim()) {
    const nextEmail = updates.email.trim().toLowerCase();

    if (nextEmail !== currentData.email) {
      const existingUsers = await db
        .collection("users")
        .where("email", "==", nextEmail)
        .get();

      const emailTaken = existingUsers.docs.some((doc) => doc.id !== userId);
      if (emailTaken) {
        throw new Error("User with this email already exists");
      }
    }

    nextData.email = nextEmail;
  }

  nextData.updatedAt = new Date().toISOString();

  await userRef.update(nextData);

  const updatedDoc = await userRef.get();
  return sanitizeUser(updatedDoc.data(), updatedDoc.id);
};

export const updatePassword = async (userId, currentPassword, newPassword) => {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  assertPasswordStrength(newPassword);

  const userData = userDoc.data();
  const hasStoredPassword = Boolean(userData.passwordHash || userData.password);

  if (hasStoredPassword && !checkPassword(userData, currentPassword)) {
    throw new Error("Current password is incorrect");
  }

  await userRef.update({
    passwordHash: hashPassword(newPassword),
    passwordUpdatedAt: new Date().toISOString(),
  });

  const updatedDoc = await userRef.get();
  return sanitizeUser(updatedDoc.data(), updatedDoc.id);
};
