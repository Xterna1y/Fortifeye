import express from "express";
import { 
  getDependents, 
  sendRequest, 
  getRequests, 
  respondToRequest,
  getLinks,
  deleteLink,
  patchLinkNickname,
} from "./guardian.controller.js";

const router = express.Router();

router.get("/dependents/:guardianId", getDependents);
router.post("/request", sendRequest);
router.get("/requests", getRequests);
router.get("/links", getLinks);
router.post("/request/respond", respondToRequest);
router.delete("/links/:linkId", deleteLink);
router.patch("/links/:linkId", patchLinkNickname);

export default router;
