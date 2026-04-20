import { getStoredUser } from '../utils/userSession';
import type { TransactionRequestRecord, TransactionRequestStatus } from '../types/transactions';

const API_BASE_URL = 'http://localhost:5001/api/guardian';
const REQUEST_TIMEOUT_MS = 5000;

async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const transactionRequestService = {
  async getRequests(): Promise<TransactionRequestRecord[]> {
    const user = getStoredUser();
    if (!user) {
      return [];
    }

    try {
      return await fetchJson(`${API_BASE_URL}/transaction-requests?userId=${user.id}`);
    } catch (error) {
      console.error('Failed to fetch transaction requests:', error);
      return [];
    }
  },

  async createRequest(payload: {
    linkId: string;
    amount: number;
    title: string;
    reason: string;
    details?: string;
  }) {
    const user = getStoredUser();
    if (!user) {
      throw new Error('User not logged in.');
    }

    return fetchJson(`${API_BASE_URL}/transaction-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dependentId: user.id,
        ...payload,
      }),
    });
  },

  async updateRequest(
    requestId: string,
    status: Exclude<TransactionRequestStatus, 'pending'>,
    rejectionReason?: string,
  ) {
    const user = getStoredUser();
    if (!user) {
      throw new Error('User not logged in.');
    }

    return fetchJson(`${API_BASE_URL}/transaction-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardianId: user.id,
        status,
        rejectionReason,
      }),
    });
  },

  subscribe(listener: () => void) {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const handleStorage = () => listener();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },
};
