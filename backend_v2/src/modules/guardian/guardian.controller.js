import * as guardianService from "./guardian.service.js";

export const sendRequest = async (req, res) => {
  try {
    const { fromUserId, toSerialId, type } = req.body;
    if (!fromUserId || !toSerialId || !type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const request = await guardianService.createLinkingRequest(fromUserId, toSerialId, type);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const requests = await guardianService.getPendingRequests(userId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const respondToRequest = async (req, res) => {
  try {
    const { requestId, status, nickname } = req.body;
    if (!requestId || !status) {
      return res.status(400).json({ message: "Request ID and status are required." });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const result = await guardianService.handleLinkingRequest(requestId, status, nickname);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const getLinks = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const links = await guardianService.getLinks(userId);
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDependents = async (req, res) => {
  try {
    const { guardianId } = req.params;
    const dependents = await guardianService.getDependents(guardianId);
    res.json(dependents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const result = await guardianService.removeLink(linkId, String(userId));
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const patchLinkNickname = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId, nickname } = req.body;

    if (!userId || !nickname) {
      return res.status(400).json({ message: "User ID and nickname are required." });
    }

    const result = await guardianService.updateLinkNickname(linkId, String(userId), nickname);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
