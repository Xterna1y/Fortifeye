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

export const getRequestHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const requests = await guardianService.getRequestHistory(userId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransactionRequest = async (req, res) => {
  try {
    const { dependentId, linkId, amount, title, reason, details } = req.body;

    if (!dependentId || !linkId || amount === undefined || !title || !reason) {
      return res.status(400).json({
        message: "Dependent ID, link ID, amount, title, and reason are required.",
      });
    }

    const transactionRequest = await guardianService.createTransactionRequest(
      dependentId,
      linkId,
      amount,
      title,
      reason,
      details,
    );

    res.status(201).json(transactionRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTransactionRequests = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const requests = await guardianService.getTransactionRequests(userId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTransactionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { guardianId, status, rejectionReason } = req.body;

    if (!requestId || !guardianId || !status) {
      return res.status(400).json({
        message: "Request ID, guardian ID, and status are required.",
      });
    }

    const updatedRequest = await guardianService.updateTransactionRequest(
      requestId,
      guardianId,
      status,
      rejectionReason,
    );

    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

export const getGuardianSettings = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const settings = await guardianService.getGuardianSettings(userId);
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGuardianSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const settings = await guardianService.updateGuardianSettings(userId, req.body ?? {});
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId } = req.query;

    if (!linkId || !userId) {
      return res.status(400).json({ message: "Link ID and user ID are required." });
    }

    const removedLink = await guardianService.removeLink(linkId, userId);
    res.json(removedLink);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLinkNickname = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId, nickname } = req.body;

    if (!linkId || !userId || !nickname) {
      return res.status(400).json({ message: "Link ID, user ID, and nickname are required." });
    }

    const updatedLink = await guardianService.updateLinkNickname(linkId, userId, nickname);
    res.json(updatedLink);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
