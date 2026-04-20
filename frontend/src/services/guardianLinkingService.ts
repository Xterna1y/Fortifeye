import type {
  GuardianLinkRequest,
  GuardianLinkingState,
  SendRequestResult,
} from '../types/guardian';
import { getStoredUser, getUserRole, saveStoredUser } from '../utils/userSession';

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

export const guardianLinkingService = {
  async getState(): Promise<GuardianLinkingState> {
    const user = getStoredUser();
    if (!user) {
      return {
        currentRole: 'dependent',
        serials: { guardian: '', dependent: '' },
        requests: [],
      };
    }

    // Fetch pending requests and accepted links from backend
    try {
      const [requests, links] = await Promise.all([
        fetchJson(`${API_BASE_URL}/requests?userId=${user.id}`),
        fetchJson(`${API_BASE_URL}/links?userId=${user.id}`),
      ]);

      const allRequests: GuardianLinkRequest[] = [
        ...requests.map((req: any) => ({
          id: req.id,
          requesterRole: req.type,
          requesterSerial: 'Incoming',
          requesterName: req.requesterName,
          requesterEmail: req.requesterEmail,
          targetSerial: user.serialId,
          status: req.status,
          createdAt: req.createdAt,
        })),
        ...links.map((link: any) => ({
          id: link.id,
          requesterRole: link.role === 'guardian' ? 'guardian' : 'dependent',
          requesterSerial: link.otherUserSerial,
          requesterName: link.otherUserName,
          requesterEmail: link.otherUserEmail,
          targetSerial: user.serialId,
          nickname: link.nickname,
          status: 'accepted' as const,
          createdAt: link.linkedAt,
          respondedAt: link.linkedAt,
        }))
      ];
      
      return {
        currentRole: getUserRole(user),
        serials: {
          guardian: user.serialId,
          dependent: user.serialId,
        },
        requests: allRequests,
      };
    } catch (error) {
      console.error('Failed to fetch linking state:', error);
      return {
        currentRole: 'dependent',
        serials: { guardian: user.serialId, dependent: user.serialId },
        requests: [],
      };
    }
  },

  subscribe(listener: () => void) {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const handleStorage = () => listener();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },

  async sendRequest(targetSerialInput: string): Promise<SendRequestResult> {
    const user = getStoredUser();
    if (!user) return { ok: false, error: 'User not logged in.' };

    const targetSerial = targetSerialInput.trim().toUpperCase();
    if (!targetSerial) {
      return { ok: false, error: 'Enter a serial ID to continue.' };
    }

    try {
      await fetchJson(`${API_BASE_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.id,
          toSerialId: targetSerial,
          type: user.identity === 'guardian' ? 'guardian' : 'dependent',
        }),
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to send request.',
      };
    }
  },

  async acceptRequest(requestId: string, nickname?: string) {
    try {
      await fetchJson(`${API_BASE_URL}/request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'accepted', nickname }),
      });

      // Refresh user info in localStorage because identity might have changed
      const user = getStoredUser();
      if (user) {
        const updatedUser = await fetchJson(`http://localhost:5001/api/auth/profile/${user.id}`);
        saveStoredUser(updatedUser);
      }

      return true;
    } catch (error) {
      console.error('Failed to accept request:', error);
      return false;
    }
  },

  async declineRequest(requestId: string) {
    try {
      await fetchJson(`${API_BASE_URL}/request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'rejected' }),
      });
      return true;
    } catch (error) {
      console.error('Failed to decline request:', error);
      return false;
    }
  },

  async removeLink(linkId: string) {
    const user = getStoredUser();
    if (!user) {
      return false;
    }

    try {
      await fetchJson(`${API_BASE_URL}/links/${linkId}?userId=${user.id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to remove linked account:', error);
      return false;
    }
  },
};
