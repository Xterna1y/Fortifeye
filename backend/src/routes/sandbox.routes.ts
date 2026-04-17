import express from "express";
import { openSandbox } from "../controllers/sandbox.controller";

const router = express.Router();

router.post("/open", openSandbox);

export default router;