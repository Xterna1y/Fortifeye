import * as scanService from "./scan.service.js";

export const scanText = async (req, res) => {
  try {
    const result = await scanService.scanText(req.body.text, req.body.userId);
    res.json(result);
  } catch (error) {
    console.error("Error scanning text:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const scanUrl = async (req, res) => {
  try {
    const result = await scanService.scanUrl(req.body.url, req.body.userId);
    res.json(result);
  } catch (error) {
    console.error("Error scanning url:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getScanById = async (req, res) => {
  try {
    const scan = await scanService.getScan(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }
    res.json(scan);
  } catch (error) {
    console.error("Error fetching scan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};