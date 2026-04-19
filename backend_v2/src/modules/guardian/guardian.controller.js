import * as guardianService from "./guardian.service.js";

export const getDependents = (req, res) => {
  const { guardianId } = req.query;

  const dependents = guardianService.getDependents(guardianId);

  res.json(dependents);
};