import express from "express";
import {
  createTransactionRequest,
  getDependentTransactionRequests,
  getGuardianTransactionRequests,
  updateTransactionRequestStatus,
} from "./transactionRequest.controller.js";

const router = express.Router();

router.post("/", createTransactionRequest);
router.get("/guardian/:guardianId", getGuardianTransactionRequests);
router.get("/dependent/:dependentId", getDependentTransactionRequests);
router.patch("/:id/status", updateTransactionRequestStatus);

export default router;
