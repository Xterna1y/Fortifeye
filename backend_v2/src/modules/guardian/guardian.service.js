import { readData } from "../../config/db.js";

export const getDependents = (guardianId) => {
  const persons = readData("protectedPersons");
  return persons.filter((p) => p.guardianId === guardianId);
};

export const getGuardianForUser = (userId) => {
  const persons = readData("protectedPersons");
  const dependent = persons.find((p) => p.id === userId);
  return dependent ? dependent.guardianId : null;
};