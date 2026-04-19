export type GuardianRole = 'guardian' | 'dependent';

export interface GuardianLinkRequest {
  id: string;
  requesterRole: GuardianRole;
  requesterSerial: string;
  targetSerial: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface GuardianLinkingState {
  currentRole: GuardianRole;
  serials: Record<GuardianRole, string>;
  requests: GuardianLinkRequest[];
}

export interface SendRequestResult {
  ok: boolean;
  error?: string;
}

export interface LinkedGuardianAccount {
  requestId: string;
  serial: string;
  role: GuardianRole;
  linkedAt: string;
}
