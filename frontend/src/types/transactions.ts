export type TransactionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface TransactionRequestRecord {
  id: string;
  linkId: string;
  guardianId: string;
  dependentId: string;
  amount: number;
  title: string;
  reason: string;
  details?: string;
  status: TransactionRequestStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  guardianName?: string | null;
  guardianEmail?: string | null;
  guardianSerial?: string | null;
  dependentName?: string | null;
  dependentEmail?: string | null;
  dependentSerial?: string | null;
  linkNickname?: string | null;
}
