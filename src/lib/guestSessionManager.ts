/**
 * Guest Session Lifecycle Manager
 * Handles 10-minute base guest sessions, +5 minute extensions (max 15 minutes),
 * 2-minute pre-expiration alerts, and draft auto-preservation.
 */

export interface GuestSessionState {
  sessionId: string;
  startedAt: number; // timestamp
  expiresAt: number; // timestamp
  baseDurationMinutes: number; // 10 min
  maxDurationMinutes: number; // 15 min
  extendedMinutes: number; // total extension applied so far (0, 5, etc.)
  canExtend: boolean; // true if extendedMinutes < 5
  hasWarned2Min: boolean;
  isExpired: boolean;
}

const GUEST_SESSION_KEY = 'icallog_guest_session_v1';
const BASE_MINUTES = 10;
const MAX_MINUTES = 15;
const EXTENSION_STEP_MINUTES = 5;

export function initializeGuestSession(): GuestSessionState {
  const now = Date.now();
  const session: GuestSessionState = {
    sessionId: `guest_sess_${Math.random().toString(36).substring(2, 9)}_${now}`,
    startedAt: now,
    expiresAt: now + BASE_MINUTES * 60 * 1000,
    baseDurationMinutes: BASE_MINUTES,
    maxDurationMinutes: MAX_MINUTES,
    extendedMinutes: 0,
    canExtend: true,
    hasWarned2Min: false,
    isExpired: false,
  };
  saveGuestSession(session);
  return session;
}

export function getGuestSession(): GuestSessionState {
  if (typeof window === 'undefined') {
    return {
      sessionId: 'guest_ssr',
      startedAt: Date.now(),
      expiresAt: Date.now() + BASE_MINUTES * 60 * 1000,
      baseDurationMinutes: BASE_MINUTES,
      maxDurationMinutes: MAX_MINUTES,
      extendedMinutes: 0,
      canExtend: true,
      hasWarned2Min: false,
      isExpired: false,
    };
  }

  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    if (raw) {
      const parsed: GuestSessionState = JSON.parse(raw);
      // If valid object with expiresAt
      if (parsed && typeof parsed.expiresAt === 'number') {
        const remaining = Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000));
        parsed.isExpired = remaining <= 0;
        parsed.canExtend = (parsed.extendedMinutes || 0) < (MAX_MINUTES - BASE_MINUTES);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse guest session:', err);
  }

  return initializeGuestSession();
}

export function saveGuestSession(session: GuestSessionState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save guest session:', err);
  }
}

/**
 * Extends guest session by +5 minutes up to a maximum of 15 minutes total.
 */
export function extendGuestSession(): { success: boolean; session: GuestSessionState; message: string } {
  const current = getGuestSession();
  const currentTotal = BASE_MINUTES + current.extendedMinutes;

  if (currentTotal >= MAX_MINUTES || !current.canExtend) {
    return {
      success: false,
      session: current,
      message: `Maximum guest session limit (${MAX_MINUTES} min) reached. Please sign in or create an account to continue!`,
    };
  }

  const newExtendedMinutes = current.extendedMinutes + EXTENSION_STEP_MINUTES;
  const newExpiresAt = current.expiresAt + EXTENSION_STEP_MINUTES * 60 * 1000;
  const canExtendFurther = (BASE_MINUTES + newExtendedMinutes) < MAX_MINUTES;

  const updated: GuestSessionState = {
    ...current,
    expiresAt: newExpiresAt,
    extendedMinutes: newExtendedMinutes,
    canExtend: canExtendFurther,
    hasWarned2Min: false,
    isExpired: false,
  };

  saveGuestSession(updated);
  return {
    success: true,
    session: updated,
    message: `Guest session extended by +${EXTENSION_STEP_MINUTES} minutes! (Total: ${BASE_MINUTES + newExtendedMinutes} min / max ${MAX_MINUTES} min)`,
  };
}

/**
 * Resets the guest session to a brand new 10-minute session.
 */
export function resetGuestSession(): GuestSessionState {
  return initializeGuestSession();
}
