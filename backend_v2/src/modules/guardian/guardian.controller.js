import * as guardianService from "./guardian.service.js";

export const getDependents = async (req, res) => {
  try {
    const { guardianId } = req.query;

    if (!guardianId) {
      return res.status(400).json({ message: "guardianId is required" });
    }

    const dependents = await guardianService.getDependents(guardianId);

    res.json(dependents);
  } catch (error) {
    console.error("Error fetching dependents:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};