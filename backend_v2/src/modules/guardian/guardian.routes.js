import express from "express";
import { 
  getDependents, 
  sendRequest, 
  getRequests, 
  getRequestHistory,
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
router.get("/links", getLinks);
router.delete("/links/:linkId", removeLink);
router.patch("/links/:linkId/nickname", updateLinkNickname);
router.post("/request/respond", respondToRequest);

export default router;
