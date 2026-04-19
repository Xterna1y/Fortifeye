import * as alertService from "./alert.service.js";

export const createAlert = async (req, res) => {
  try {
    const alert = await alertService.createAlert(req.body);
    res.status(201).json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};