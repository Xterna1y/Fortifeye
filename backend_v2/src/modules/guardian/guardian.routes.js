import express from "express";
import { 
  getDependents, 
  sendRequest, 
  getRequests, 
  respondToRequest,
  getLinks
} from "./guardian.controller.js";

const router = express.Router();

router.get("/dependents/:guardianId", getDependents);
router.post("/request", sendRequest);
router.get("/requests", getRequests);
router.get("/links", getLinks);
router.post("/request/respond", respondToRequest);

export default router;