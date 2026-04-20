const USER_STORAGE_KEY = 'fortifeye.user';
const USER_UPDATED_EVENT = 'fortifeye:user-updated';

export interface StoredUser {
  id: string;
  email?: string;
  identity?: string;
  serialId?: string;
  [key: string]: unknown;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userJson = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson) as StoredUser;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: StoredUser) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}

export function clearStoredUser() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}

export function getUserRole(user: StoredUser | null): 'guardian' | 'dependent' {
  return user?.identity === 'guardian' ? 'guardian' : 'dependent';
}

export function isGuardianUser(user: StoredUser | null) {
  return getUserRole(user) === 'guardian';
}

export function isDependentUser(user: StoredUser | null) {
  return !!user && getUserRole(user) === 'dependent';
}

export function subscribeToStoredUser(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => listener();
  window.addEventListener('storage', handleChange);
  window.addEventListener(USER_UPDATED_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(USER_UPDATED_EVENT, handleChange);
  };
}
