import { db } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const createAlert = async (data) => {
  const newAlert = {
    id: uuid(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  await db.collection("alerts").doc(newAlert.id).set(newAlert);

  return newAlert;
};