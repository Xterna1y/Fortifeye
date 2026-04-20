import { useEffect, useMemo, useState } from 'react';
import { guardianLinkingService } from '../services/guardianLinkingService';
import type { GuardianRole, LinkedGuardianAccount, GuardianLinkingState } from '../types/guardian';

function getTargetRole(role: GuardianRole): GuardianRole {
  return role === 'guardian' ? 'dependent' : 'guardian';
}

const initialState: GuardianLinkingState = {
  currentRole: 'dependent',
  serials: { guardian: '', dependent: '' },
  requests: [],
};

export default function useGuardianLinking() {
  const [state, setState] = useState<GuardianLinkingState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  const refreshState = async () => {
    setIsLoading(true);
    const nextState = await guardianLinkingService.getState();
    setState(nextState);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshState();
    return guardianLinkingService.subscribe(refreshState);
  }, []);

  const currentRole = state.currentRole;
  const currentSerial = state.serials[currentRole];
  const targetRole = getTargetRole(currentRole);

  const linkedRequests = useMemo(
    () => state.requests.filter((request) => request.status === 'accepted'),
    [state.requests],
  );

  const linkedAccounts: LinkedGuardianAccount[] = linkedRequests.map((request) => ({
      requestId: request.id,
      serial: request.requesterSerial === currentSerial ? request.targetSerial : request.requesterSerial,
      role: request.requesterSerial === currentSerial ? getTargetRole(request.requesterRole) : request.requesterRole,
      nickname: request.nickname,
      name: request.requesterName,
      email: request.requesterEmail,
      linkedAt: request.respondedAt ?? request.createdAt,
    }));

  const pendingIncomingRequests = state.requests.filter(
    (request) => request.status === 'pending' // Our API already filters by target userId
  );

  const pendingOutgoingRequests = state.requests.filter(
    (request) => request.status === 'pending' && request.requesterSerial === currentSerial,
  );

  const linkedAccount = linkedAccounts[0] ?? null;
  const guardian =
    linkedAccounts.find((account) => account.role === 'guardian') ?? null;
  const hasGuardian = Boolean(guardian);

  return {
    isLoading,
    currentRole,
    currentSerial,
    targetRole,
    serials: state.serials,
    requests: state.requests,
    linkedAccount,
    linkedAccounts,
    guardian,
    hasGuardian,
    pendingIncomingRequests,
    pendingOutgoingRequests,
    setRole: async (role: GuardianRole) => {
      const nextState = await guardianLinkingService.setRole(role);
      setState(nextState);
    },
    sendRequest: async (targetSerial: string) => {
      const result = await guardianLinkingService.sendRequest(targetSerial);
      await refreshState();
      return result;
    },
    acceptRequest: async (requestId: string, nickname?: string) => {
      const success = await guardianLinkingService.acceptRequest(requestId, nickname);
      if (success) await refreshState();
    },
    declineRequest: async (requestId: string) => {
      const success = await guardianLinkingService.declineRequest(requestId);
      if (success) await refreshState();
    },
    removeLink: async (requestId: string) => {
      const success = await guardianLinkingService.removeLink(requestId);
      if (success) await refreshState();
    },
    updateLinkNickname: async (requestId: string, nickname: string) => {
      const success = await guardianLinkingService.updateLinkNickname(requestId, nickname);
      if (success) await refreshState();
      return success;
    },
    refresh: refreshState
  };
}
