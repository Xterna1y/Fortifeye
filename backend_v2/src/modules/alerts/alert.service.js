import { readData, writeData } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const createAlert = (data) => {
  const alerts = readData("alerts");

  const newAlert = {
    id: uuid(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  alerts.push(newAlert);
  writeData("alerts", alerts);

  return newAlert;
};