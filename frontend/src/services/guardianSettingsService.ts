import type { GuardianSettings } from '../types/guardian';
import { getStoredUser } from '../utils/userSession';

const API_BASE_URL = 'http://localhost:5001/api/guardian';
const REQUEST_TIMEOUT_MS = 5000;

export const DEFAULT_GUARDIAN_SETTINGS: GuardianSettings = {
  emergencyLock: false,
};

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

export const guardianSettingsService = {
  async getSettings(): Promise<GuardianSettings> {
    const user = getStoredUser();
    if (!user) {
      return DEFAULT_GUARDIAN_SETTINGS;
    }

    return fetchJson(`${API_BASE_URL}/settings?userId=${user.id}`);
  },

  async updateSettings(
    updates: Partial<GuardianSettings>,
  ): Promise<GuardianSettings> {
    const user = getStoredUser();
    if (!user) {
      throw new Error('User not logged in.');
    }

    return fetchJson(`${API_BASE_URL}/settings/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },
};
