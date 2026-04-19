import express from "express";
import { getDependents } from "./guardian.controller.js";

const router = express.Router();

router.get("/dependents", getDependents);

export default router;