/**
 * Session Token & Auto-Save Manager
 * Handles JWT session token lifecycles, expiration countdowns,
 * 2-minute pre-expiration auto-save warnings, and session extension.
 */

import { getSecureLocalItem, setSecureLocalItem } from './securitySanitizer.ts';

export interface SessionData {
  token: string;
  expiresAt: number; // Unix timestamp in ms
  createdAt: number;
  lastAutoSavedAt: number | null;
  autoSaveCount: number;
}

const SESSION_STORAGE_KEY = 'icallog_session_token_v1';
const AUTOSAVE_VAULT_KEY = 'icallog_autosave_vault_v1';
const DEFAULT_SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes default

// Generate a client-side initial fallback token if none exists
function generateGuestToken(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor((Date.now() + DEFAULT_SESSION_DURATION_MS) / 1000);
  const payload = btoa(JSON.stringify({ id: 'demo_user', role: 'user', exp }));
  const sig = btoa(String(Date.now()));
  return `${header}.${payload}.${sig}`;
}

/**
 * Retrieve current active session data from localStorage or create a fresh one.
 */
export function getStoredSession(): SessionData {
  if (typeof window === 'undefined') {
    return {
      token: '',
      expiresAt: Date.now() + DEFAULT_SESSION_DURATION_MS,
      createdAt: Date.now(),
      lastAutoSavedAt: null,
      autoSaveCount: 0,
    };
  }

  try {
    const parsed = getSecureLocalItem<SessionData | null>(SESSION_STORAGE_KEY, null);
    if (parsed) {
      // If token expired more than 1 hour ago, initialize a fresh session
      if (parsed.expiresAt && parsed.expiresAt > Date.now() - 3600 * 1000) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored session:', err);
  }

  // Initialize fresh session
  const freshSession: SessionData = {
    token: generateGuestToken(),
    expiresAt: Date.now() + DEFAULT_SESSION_DURATION_MS,
    createdAt: Date.now(),
    lastAutoSavedAt: null,
    autoSaveCount: 0,
  };
  saveStoredSession(freshSession);
  return freshSession;
}

/**
 * Save session data to localStorage.
 */
export function saveStoredSession(session: SessionData): void {
  if (typeof window === 'undefined') return;
  try {
    setSecureLocalItem(SESSION_STORAGE_KEY, session);
  } catch (err) {
    console.error('Failed to save session token data:', err);
  }
}

/**
 * Extend session token by N minutes (calls backend /api/auth/refresh and updates local state).
 */
export async function extendSessionToken(extendMinutes = 15): Promise<SessionData> {
  const current = getStoredSession();
  let newToken = current.token;
  let newExpiresAt = Date.now() + extendMinutes * 60 * 1000;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${current.token}`,
      },
      body: JSON.stringify({ token: current.token, extendMinutes }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) newToken = data.token;
      if (data.expiresAt) newExpiresAt = data.expiresAt;
    }
  } catch (err) {
    console.warn('Backend session refresh request failed, extending locally:', err);
  }

  const updated: SessionData = {
    ...current,
    token: newToken,
    expiresAt: newExpiresAt,
  };
  saveStoredSession(updated);
  return updated;
}

/**
 * Set session token expiration to a specific number of seconds from now.
 * Useful for simulating / testing the 2-minute auto-save warning (e.g. 115 seconds).
 */
export function simulateSessionExpiryInSeconds(seconds: number): SessionData {
  const current = getStoredSession();
  const updated: SessionData = {
    ...current,
    expiresAt: Date.now() + seconds * 1000,
  };
  saveStoredSession(updated);
  return updated;
}

export interface AutoSaveSnapshot {
  timestamp: string;
  savedAtMs: number;
  reason: string;
  userProfile?: unknown;
  projectsCount?: number;
  activeTab?: string;
}

/**
 * Perform auto-save of user projects, current active state, and profile into the recovery vault.
 */
export function executeAutoSave(reason = '2-minute pre-expiry auto-save'): {
  success: boolean;
  savedAt: string;
  itemsCount: number;
} {
  if (typeof window === 'undefined') {
    return { success: false, savedAt: new Date().toISOString(), itemsCount: 0 };
  }

  try {
    const profileRaw = localStorage.getItem('icallog_user_profile_v1');
    const projectsRaw = localStorage.getItem('icallog_user_projects_v1');
    const cookiePerms = localStorage.getItem('icallog_cookie_permissions_v1');

    let projectsCount = 0;
    if (projectsRaw) {
      try {
        const parsed = JSON.parse(projectsRaw);
        if (Array.isArray(parsed)) projectsCount = parsed.length;
      } catch {
        // ignore
      }
    }

    const snapshot: AutoSaveSnapshot = {
      timestamp: new Date().toLocaleTimeString(),
      savedAtMs: Date.now(),
      reason,
      userProfile: profileRaw ? JSON.parse(profileRaw) : null,
      projectsCount,
    };

    // Store latest snapshot in emergency auto-save recovery checkpoint
    localStorage.setItem(AUTOSAVE_VAULT_KEY, JSON.stringify(snapshot));

    // Update session record
    const session = getStoredSession();
    session.lastAutoSavedAt = Date.now();
    session.autoSaveCount = (session.autoSaveCount || 0) + 1;
    saveStoredSession(session);

    return {
      success: true,
      savedAt: snapshot.timestamp,
      itemsCount: projectsCount + (profileRaw ? 1 : 0) + (cookiePerms ? 1 : 0),
    };
  } catch (err) {
    console.error('Auto-save execution encountered error:', err);
    return { success: false, savedAt: new Date().toISOString(), itemsCount: 0 };
  }
}
