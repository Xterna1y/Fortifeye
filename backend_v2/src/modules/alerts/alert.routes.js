import express from "express";
import { createAlert } from "./alert.controller.js";

const router = express.Router();

router.post("/create", createAlert);

export default router;