import * as scanService from "./scan.service.js";

export const scanText = async (req, res) => {
  const result = await scanService.scanText(req.body.text, req.body.userId);
  res.json(result);
};

export const scanUrl = async (req, res) => {
  const result = await scanService.scanUrl(req.body.url, req.body.userId);
  res.json(result);
};

export const getScanById = (req, res) => {
  const scan = scanService.getScan(req.params.id);
  res.json(scan);
};