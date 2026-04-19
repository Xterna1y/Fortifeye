import { db } from "../../config/db.js";

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

  // Add new user
  const newUser = {
    ...userData,
    createdAt: new Date().toISOString(),
  };

  const docRef = await usersRef.add(newUser);
  return { id: docRef.id, ...newUser };
};