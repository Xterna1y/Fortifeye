import { readData } from "../../config/db.js";

export const getDependents = (guardianId) => {
  const persons = readData("protectedPersons");
  return persons.filter((p) => p.guardianId === guardianId);
};