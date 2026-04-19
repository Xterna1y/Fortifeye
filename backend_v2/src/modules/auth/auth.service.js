import { readData } from "../../config/db.js";

export const login = (email) => {
  const users = readData("users");

  return users.find((u) => u.email === email);
};