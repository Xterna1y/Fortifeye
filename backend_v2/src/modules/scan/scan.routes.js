import express from "express";
import {
  scanText,
  scanUrl,
  getScanById,
} from "./scan.controller.js";

const router = express.Router();

router.post("/text", scanText);
router.post("/url", scanUrl);
router.get("/:id", getScanById);

export default router;