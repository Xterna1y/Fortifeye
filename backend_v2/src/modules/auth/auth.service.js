import { db } from "../../config/db.js";

const generateSerialId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "FE-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const login = async (email) => {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("email", "==", email).get();

  if (snapshot.empty) {
    return null;
  }

  // Assuming email is unique, returning the first match
  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
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
    serialId,
    createdAt: new Date().toISOString(),
  };

  const docRef = await usersRef.add(newUser);
  return { id: docRef.id, ...newUser };
};