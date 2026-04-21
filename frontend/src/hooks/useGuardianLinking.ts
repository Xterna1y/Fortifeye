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
    try {
      const nextState = await guardianLinkingService.getState();
      setState(nextState);
    } catch (error) {
      console.error('Failed to refresh guardian linking state:', error);
      setState(initialState);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = guardianLinkingService.subscribe(refreshState);
    const intervalId = window.setInterval(refreshState, 10000);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
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
      name: request.requesterSerial === currentSerial ? undefined : request.requesterName,
      email: request.requesterSerial === currentSerial ? undefined : request.requesterEmail,
      guardianSettings: request.guardianSettings,
      linkedAt: request.respondedAt ?? request.createdAt,
    }));

  const pendingIncomingRequests = state.requests.filter(
    (request) => request.status === 'pending' // Our API already filters by target userId
  );

  const pendingOutgoingRequests = state.requests.filter(
    (request) => request.status === 'pending' && request.requesterSerial === currentSerial,
  );

  return {
    isLoading,
    currentRole,
    currentSerial,
    targetRole,
    serials: state.serials,
    requests: state.requests,
    linkedAccounts,
    pendingIncomingRequests,
    pendingOutgoingRequests,
    sendRequest: async (targetSerial: string, requestRole: GuardianRole) => {
      const result = await guardianLinkingService.sendRequest(targetSerial, requestRole);
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
      return success;
    },
    updateLinkNickname: async (linkId: string, nickname: string) => {
      const success = await guardianLinkingService.updateLinkNickname(linkId, nickname);
      if (success) {
        await refreshState();
      }
      return success;
    },
    refresh: refreshState
  };
}
