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