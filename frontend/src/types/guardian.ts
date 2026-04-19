export type GuardianRole = 'guardian' | 'dependent';

export interface GuardianLinkRequest {
  id: string;
  requesterRole: GuardianRole;
  requesterSerial: string;
  requesterName?: string;
  requesterEmail?: string;
  targetSerial: string;
  status: 'pending' | 'accepted' | 'declined';
  nickname?: string;
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
  nickname?: string;
  linkedAt: string;
}
