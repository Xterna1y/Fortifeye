import { useEffect, useMemo, useState } from 'react';
import { transactionRequestService } from '../services/transactionRequestService';
import type { TransactionRequestRecord } from '../types/transactions';

export default function useTransactionRequests() {
  const [requests, setRequests] = useState<TransactionRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRequests = async () => {
    setIsLoading(true);
    try {
      const nextRequests = await transactionRequestService.getRequests();
      setRequests(nextRequests);
    } catch (error) {
      console.error('Failed to refresh transaction requests:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshRequests();
    const unsubscribe = transactionRequestService.subscribe(refreshRequests);
    const intervalId = window.setInterval(refreshRequests, 10000);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests],
  );

  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status === 'approved'),
    [requests],
  );

  const rejectedRequests = useMemo(
    () => requests.filter((request) => request.status === 'rejected'),
    [requests],
  );

  return {
    requests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    isLoading,
    refresh: refreshRequests,
    createRequest: async (payload: {
      linkId: string;
      amount: number;
      title: string;
      reason: string;
      details?: string;
    }) => {
      const result = await transactionRequestService.createRequest(payload);
      await refreshRequests();
      return result;
    },
    approveRequest: async (requestId: string) => {
      const result = await transactionRequestService.updateRequest(requestId, 'approved');
      await refreshRequests();
      return result;
    },
    rejectRequest: async (requestId: string, rejectionReason?: string) => {
      const result = await transactionRequestService.updateRequest(
        requestId,
        'rejected',
        rejectionReason,
      );
      await refreshRequests();
      return result;
    },
  };
}
