import express from "express";
import { 
  getDependents, 
  sendRequest, 
  getRequests, 
  getRequestHistory,
  getGuardianSettings,
  createTransactionRequest,
  getTransactionRequests,
  updateGuardianSettings,
  updateTransactionRequest,
  respondToRequest,
  getLinks,
  removeLink,
  updateLinkNickname,
} from "./guardian.controller.js";

const router = express.Router();

router.get("/dependents/:guardianId", getDependents);
router.post("/request", sendRequest);
router.get("/requests", getRequests);
router.get("/requests/history", getRequestHistory);
router.get("/settings", getGuardianSettings);
router.patch("/settings/:userId", updateGuardianSettings);
router.post("/transaction-requests", createTransactionRequest);
router.get("/transaction-requests", getTransactionRequests);
router.patch("/transaction-requests/:requestId", updateTransactionRequest);
router.get("/links", getLinks);
router.delete("/links/:linkId", removeLink);
router.patch("/links/:linkId/nickname", updateLinkNickname);
router.post("/request/respond", respondToRequest);

export default router;
