import { API_BASE_URL, parseJsonResponse } from '../config/api';

export interface TransactionRequest {
  id: string;
  guardianId: string;
  dependentId: string;
  title?: string;
  message?: string;
  amount: number;
  riskLevel?: string;
  status: 'pending' | 'approved' | 'denied';
  decisionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function createTransactionRequest(payload: {
  guardianId: string;
  dependentId: string;
  title?: string;
  message: string;
  amount: number;
  riskLevel?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/transaction-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<TransactionRequest>(response);
}

export async function getGuardianTransactionRequests(guardianId: string) {
  const response = await fetch(
    `${API_BASE_URL}/transaction-requests/guardian/${guardianId}`,
  );
  return parseJsonResponse<TransactionRequest[]>(response);
}

export async function getDependentTransactionRequests(dependentId: string) {
  const response = await fetch(
    `${API_BASE_URL}/transaction-requests/dependent/${dependentId}`,
  );
  return parseJsonResponse<TransactionRequest[]>(response);
}

export async function updateTransactionRequestStatus(
  requestId: string,
  status: 'approved' | 'denied',
  decisionReason?: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/transaction-requests/${requestId}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, decisionReason }),
    },
  );

  return parseJsonResponse<TransactionRequest>(response);
}
