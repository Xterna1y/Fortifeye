import * as alertService from "./alert.service.js";

export const createAlert = (req, res) => {
  const alert = alertService.createAlert(req.body);
  res.json(alert);
};