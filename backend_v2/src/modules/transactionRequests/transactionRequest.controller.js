import * as transactionRequestService from "./transactionRequest.service.js";

export const createTransactionRequest = async (req, res) => {
  try {
    const { guardianId, dependentId, amount } = req.body;

    if (!guardianId || !dependentId) {
      return res
        .status(400)
        .json({ message: "Guardian ID and dependent ID are required." });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "A valid amount is required." });
    }

    const request = await transactionRequestService.createTransactionRequest(
      req.body,
    );
    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating transaction request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGuardianTransactionRequests = async (req, res) => {
  try {
    const requests = await transactionRequestService.getRequestsByGuardian(
      req.params.guardianId,
    );
    res.json(requests);
  } catch (error) {
    console.error("Error fetching guardian transaction requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDependentTransactionRequests = async (req, res) => {
  try {
    const requests = await transactionRequestService.getRequestsByDependent(
      req.params.dependentId,
    );
    res.json(requests);
  } catch (error) {
    console.error("Error fetching dependent transaction requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTransactionRequestStatus = async (req, res) => {
  try {
    const request = await transactionRequestService.updateTransactionRequestStatus(
      req.params.id,
      req.body.status,
      req.body.decisionReason,
    );

    if (!request) {
      return res.status(404).json({ message: "Transaction request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Error updating transaction request status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
