import { db } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const createAlert = async (data) => {
  const newAlert = {
    id: uuid(),
    status: "pending",
    ...data,
    createdAt: new Date().toISOString(),
  };

  await db.collection("alerts").doc(newAlert.id).set(newAlert);

  return newAlert;
};

export const getAlertsByGuardian = (guardianId) => {
  const alerts = readData("alerts");
  return alerts.filter((alert) => alert.guardianId === guardianId);
};

export const updateAlertStatus = (alertId, status) => {
  const alerts = readData("alerts");
  const index = alerts.findIndex((alert) => alert.id === alertId);

  if (index === -1) return null;

  alerts[index].status = status;
  writeData("alerts", alerts);

  return alerts[index];
};