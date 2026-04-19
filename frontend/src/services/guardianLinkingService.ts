import type {
  GuardianLinkRequest,
  GuardianLinkingState,
  GuardianRole,
  SendRequestResult,
} from '../types/guardian';

const API_BASE_URL = 'http://localhost:5001/api/guardian';

const getUser = () => {
  const userJson = localStorage.getItem('fortifeye.user');
  return userJson ? JSON.parse(userJson) : null;
};

export const guardianLinkingService = {
  async getState(): Promise<GuardianLinkingState> {
    const user = getUser();
    if (!user) {
      return {
        currentRole: 'dependent',
        serials: { guardian: '', dependent: '' },
        requests: [],
      };
    }

    // Fetch pending requests and accepted links from backend
    try {
      const [requestsRes, linksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/requests?userId=${user.id}`),
        fetch(`${API_BASE_URL}/links?userId=${user.id}`)
      ]);
      
      const requests = await requestsRes.json();
      const links = await linksRes.json();
      
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
        currentRole: user.identity === 'guardian' ? 'guardian' : 'dependent',
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
    const user = getUser();
    if (!user) return { ok: false, error: 'User not logged in.' };

    const targetSerial = targetSerialInput.trim().toUpperCase();
    if (!targetSerial) {
      return { ok: false, error: 'Enter a serial ID to continue.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.id,
          toSerialId: targetSerial,
          type: user.identity === 'guardian' ? 'guardian' : 'dependent',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.message };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Failed to send request.' };
    }
  },

  async acceptRequest(requestId: string, nickname?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'accepted', nickname }),
      });
      
      if (response.ok) {
        // Refresh user info in localStorage because identity might have changed
        const user = getUser();
        // Since we don't have a getProfile endpoint yet, we manually update it
        // Or we could fetch user doc from backend if we had an endpoint.
        // For now, let's just assume identity might change.
      }
      
      return response.ok;
    } catch (error) {
      console.error('Failed to accept request:', error);
      return false;
    }
  },

  async declineRequest(requestId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'rejected' }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to decline request:', error);
      return false;
    }
  },
};
