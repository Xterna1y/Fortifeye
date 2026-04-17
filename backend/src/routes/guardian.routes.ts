import express from "express";
import {
  linkDependent,
  suspendUser,
  lockFinance
} from "../controllers/guardian.controller";

const router = express.Router();

router.post("/link", linkDependent);
router.post("/suspend", suspendUser);
router.post("/lock-finance", lockFinance);

export default router;