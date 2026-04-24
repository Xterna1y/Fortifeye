import type {
  GuardianLinkRequest,
  GuardianLinkingState,
  GuardianRole,
  SendRequestResult,
} from '../types/guardian';
import { API_BASE_URL, parseJsonResponse } from '../config/api';

const GUARDIAN_API_BASE_URL = `${API_BASE_URL}/guardian`;
const LINKING_ROLE_STORAGE_KEY = 'fortifeye.linkingRole';

const getUser = () => {
  const userJson = localStorage.getItem('fortifeye.user');
  return userJson ? JSON.parse(userJson) : null;
};

const setUser = (user: any) => {
  localStorage.setItem('fortifeye.user', JSON.stringify(user));
  window.dispatchEvent(new Event('fortifeye-user-updated'));
};

const getStoredLinkingRole = (): GuardianRole => {
  const storedRole = localStorage.getItem(LINKING_ROLE_STORAGE_KEY);
  return storedRole === 'guardian' ? 'guardian' : 'dependent';
};

const setStoredLinkingRole = (role: GuardianRole) => {
  localStorage.setItem(LINKING_ROLE_STORAGE_KEY, role);
  window.dispatchEvent(new Event('fortifeye-user-updated'));
};

const inferCurrentRole = (
  user: { identity?: string } | null,
  links: Array<{ role?: string }> = [],
): GuardianRole => {
  if (links.some((link) => link.role === 'dependent')) {
    return 'guardian';
  }

  if (links.some((link) => link.role === 'guardian')) {
    return 'dependent';
  }

  if (user?.identity === 'guardian') {
    return 'guardian';
  }

  if (user?.identity === 'dependent') {
    return 'dependent';
  }

  return getStoredLinkingRole();
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
        fetch(`${GUARDIAN_API_BASE_URL}/requests?userId=${user.id}`),
        fetch(`${GUARDIAN_API_BASE_URL}/links?userId=${user.id}`)
      ]);
      
      const requests = await parseJsonResponse<any[]>(requestsRes);
      const links = await parseJsonResponse<any[]>(linksRes);
      const currentRole = inferCurrentRole(user, links);
      
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
          linkedUserId: link.role === 'guardian' ? link.guardianId : link.childId,
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
        currentRole,
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
    const handleUserUpdate = () => listener();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('fortifeye-user-updated', handleUserUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fortifeye-user-updated', handleUserUpdate);
    };
  },

  async setRole(role: GuardianRole): Promise<GuardianLinkingState> {
    setStoredLinkingRole(role);
    return this.getState();
  },

  async sendRequest(targetSerialInput: string): Promise<SendRequestResult> {
    const user = getUser();
    if (!user) return { ok: false, error: 'User not logged in.' };

    const targetSerial = targetSerialInput.trim().toUpperCase();
    if (!targetSerial) {
      return { ok: false, error: 'Enter a serial ID to continue.' };
    }

    try {
      const { currentRole } = await this.getState();
      const response = await fetch(`${GUARDIAN_API_BASE_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.id,
          toSerialId: targetSerial,
          type: currentRole,
        }),
      });

      const data = await parseJsonResponse<any>(response);
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
      const response = await fetch(`${GUARDIAN_API_BASE_URL}/request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'accepted', nickname }),
      });
      
      if (response.ok) {
        // Refresh user info in localStorage because identity might have changed
        const user = getUser();
        if (user) {
          const profileRes = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`);
          const updatedUser = await parseJsonResponse<any>(profileRes);
          if (profileRes.ok) {
            setUser(updatedUser);
          }
        }
      }
      
      return response.ok;
    } catch (error) {
      console.error('Failed to accept request:', error);
      return false;
    }
  },

  async declineRequest(requestId: string) {
    try {
      const response = await fetch(`${GUARDIAN_API_BASE_URL}/request/respond`, {
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

  async removeLink(linkId: string) {
    const user = getUser();
    if (!user) return false;

    try {
      const response = await fetch(`${GUARDIAN_API_BASE_URL}/links/${linkId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const profileRes = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`);
        const updatedUser = await parseJsonResponse<any>(profileRes);
        if (profileRes.ok) {
          setUser(updatedUser);
        }
      }

      return response.ok;
    } catch (error) {
      console.error('Failed to remove link:', error);
      return false;
    }
  },

  async updateLinkNickname(linkId: string, nickname: string) {
    const user = getUser();
    if (!user) return false;

    try {
      const response = await fetch(`${GUARDIAN_API_BASE_URL}/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, nickname }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update link nickname:', error);
      return false;
    }
  },
};
