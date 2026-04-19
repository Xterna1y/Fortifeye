import { useEffect, useMemo, useState } from 'react';
import { guardianLinkingService } from '../services/guardianLinkingService';
import type { GuardianRole, LinkedGuardianAccount } from '../types/guardian';

function getTargetRole(role: GuardianRole): GuardianRole {
  return role === 'guardian' ? 'dependent' : 'guardian';
}

export default function useGuardianLinking() {
  const [state, setState] = useState(() => guardianLinkingService.getState());

  useEffect(() => {
    return guardianLinkingService.subscribe(() => {
      setState(guardianLinkingService.getState());
    });
  }, []);

  const currentRole = state.currentRole;
  const currentSerial = state.serials[currentRole];
  const targetRole = getTargetRole(currentRole);

  const linkedRequests = useMemo(
    () => state.requests.filter((request) => request.status === 'accepted'),
    [state.requests],
  );

  const linkedAccount =
    linkedRequests.find(
      (request) => request.requesterSerial === currentSerial || request.targetSerial === currentSerial,
    ) ?? null;

  const linkedAccounts: LinkedGuardianAccount[] = linkedRequests
    .filter((request) => request.requesterSerial === currentSerial || request.targetSerial === currentSerial)
    .map((request) => ({
      requestId: request.id,
      serial: request.requesterSerial === currentSerial ? request.targetSerial : request.requesterSerial,
      role: request.requesterSerial === currentSerial ? getTargetRole(request.requesterRole) : request.requesterRole,
      linkedAt: request.respondedAt ?? request.createdAt,
    }));

  const pendingIncomingRequests = state.requests.filter(
    (request) => request.status === 'pending' && request.targetSerial === currentSerial,
  );

  const pendingOutgoingRequests = state.requests.filter(
    (request) => request.status === 'pending' && request.requesterSerial === currentSerial,
  );

  const hasGuardian = linkedRequests.some(
    (request) =>
      request.requesterSerial === state.serials.dependent ||
      request.targetSerial === state.serials.dependent,
  );

  const guardian =
    linkedRequests.find(
      (request) =>
        request.requesterSerial === state.serials.dependent ||
        request.targetSerial === state.serials.dependent,
    ) ?? null;

  return {
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
    setRole: (role: GuardianRole) => setState(guardianLinkingService.setRole(role)),
    sendRequest: (targetSerial: string) => {
      const result = guardianLinkingService.sendRequest(targetSerial);
      setState(guardianLinkingService.getState());
      return result;
    },
    acceptRequest: (requestId: string) => setState(guardianLinkingService.acceptRequest(requestId)),
    declineRequest: (requestId: string) => setState(guardianLinkingService.declineRequest(requestId)),
    removeLink: (requestId: string) => setState(guardianLinkingService.removeLink(requestId)),
  };
}
