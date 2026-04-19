import type {
  GuardianLinkRequest,
  GuardianLinkingState,
  GuardianRole,
  SendRequestResult,
} from '../types/guardian';

const STORAGE_KEY = 'fortifeye.guardian-linking';

function randomId(length: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function createSerial(role: GuardianRole) {
  return `${role === 'guardian' ? 'GDN' : 'DEP'}-${randomId(3)}-${randomId(3)}`;
}

function createInitialState(): GuardianLinkingState {
  return {
    currentRole: 'dependent',
    serials: {
      guardian: createSerial('guardian'),
      dependent: createSerial('dependent'),
    },
    requests: [],
  };
}

function saveState(nextState: GuardianLinkingState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function getTargetRole(role: GuardianRole): GuardianRole {
  return role === 'guardian' ? 'dependent' : 'guardian';
}

function readState(): GuardianLinkingState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    const initialState = createInitialState();
    saveState(initialState);
    return initialState;
  }

  try {
    const parsed = JSON.parse(rawValue) as GuardianLinkingState;
    return {
      currentRole: parsed.currentRole ?? 'dependent',
      serials: parsed.serials ?? {
        guardian: createSerial('guardian'),
        dependent: createSerial('dependent'),
      },
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
    };
  } catch {
    const fallbackState = createInitialState();
    saveState(fallbackState);
    return fallbackState;
  }
}

function updateState(updater: (previous: GuardianLinkingState) => GuardianLinkingState) {
  const nextState = updater(readState());
  saveState(nextState);
  return nextState;
}

function buildRequest(
  state: GuardianLinkingState,
  targetSerial: string,
): GuardianLinkRequest {
  return {
    id: crypto.randomUUID(),
    requesterRole: state.currentRole,
    requesterSerial: state.serials[state.currentRole],
    targetSerial,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export const guardianLinkingService = {
  getState() {
    return readState();
  },

  subscribe(listener: () => void) {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const handleStorage = () => listener();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },

  setRole(role: GuardianRole) {
    return updateState((previous) => ({
      ...previous,
      currentRole: role,
    }));
  },

  sendRequest(targetSerialInput: string): SendRequestResult {
    const state = readState();
    const currentSerial = state.serials[state.currentRole];
    const targetRole = getTargetRole(state.currentRole);
    const targetSerial = targetSerialInput.trim().toUpperCase();

    if (!targetSerial) {
      return { ok: false, error: 'Enter a serial ID to continue.' };
    }

    if (targetSerial === currentSerial) {
      return { ok: false, error: 'You cannot link your account to your own serial ID.' };
    }

    const requiredPrefix = targetRole === 'guardian' ? 'GDN-' : 'DEP-';
    if (!targetSerial.startsWith(requiredPrefix)) {
      return { ok: false, error: `This role expects a ${targetRole} serial starting with ${requiredPrefix}.` };
    }

    const existingRelationship = state.requests.find(
      (request) =>
        (request.requesterSerial === currentSerial && request.targetSerial === targetSerial) ||
        (request.requesterSerial === targetSerial && request.targetSerial === currentSerial),
    );

    if (existingRelationship?.status === 'pending') {
      return { ok: false, error: 'A link request is already pending between these two accounts.' };
    }

    if (existingRelationship?.status === 'accepted') {
      return { ok: false, error: 'These accounts are already linked.' };
    }

    updateState((previous) => ({
      ...previous,
      requests: [buildRequest(previous, targetSerial), ...previous.requests],
    }));

    return { ok: true };
  },

  acceptRequest(requestId: string) {
    return updateState((previous) => ({
      ...previous,
      requests: previous.requests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: 'accepted',
              respondedAt: new Date().toISOString(),
            }
          : request,
      ),
    }));
  },

  declineRequest(requestId: string) {
    return updateState((previous) => ({
      ...previous,
      requests: previous.requests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: 'declined',
              respondedAt: new Date().toISOString(),
            }
          : request,
      ),
    }));
  },

  removeLink(requestId: string) {
    return updateState((previous) => ({
      ...previous,
      requests: previous.requests.filter((request) => request.id !== requestId),
    }));
  },
};
