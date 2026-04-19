import * as scanService from "./scan.service.js";

export const scanText = async (req, res) => {
  const result = await scanService.scanText(req.body.text);
  res.json(result);
};

export const scanUrl = async (req, res) => {
  const result = await scanService.scanUrl(req.body.url);
  res.json(result);
};

export const getScanById = (req, res) => {
  const scan = scanService.getScan(req.params.id);
  res.json(scan);
};