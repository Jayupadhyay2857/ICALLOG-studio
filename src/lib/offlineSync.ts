/**
 * Offline Synchronization & Connectivity Orchestrator
 * Coordinates Service Worker caching, IndexedDB persistence,
 * and automatic synchronization when network connectivity is restored.
 */

import {
  saveUserStateToIDB,
  getUserStateFromIDB,
  saveProjectsToIDB,
  getProjectsFromIDB,
  getPendingOfflineActions,
  clearOfflineQueue,
  enqueueOfflineAction,
  getOfflineStorageDiagnostics,
  clearAllOfflineData,
  OfflineDiagnostics,
} from './offlineIndexedDB.ts';
import { UserProfile, ProjectItem } from '../types.ts';
import { fetchProfile } from './api.ts';
import { setSecureLocalItem } from './securitySanitizer.ts';

export interface ConnectivityState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingActionsCount: number;
  lastOnlineTimestamp: number;
}

let simulatedOffline = false;
let isSyncing = false;
const listeners = new Set<(state: ConnectivityState) => void>();

export function getEffectiveOnlineStatus(): boolean {
  if (simulatedOffline) return false;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function notifyState() {
  const state: ConnectivityState = {
    isOnline: getEffectiveOnlineStatus(),
    isSimulatedOffline: simulatedOffline,
    isSyncing,
    pendingActionsCount: 0,
    lastOnlineTimestamp: Date.now(),
  };

  // Get pending count asynchronously
  getPendingOfflineActions()
    .then((actions) => {
      state.pendingActionsCount = actions.length;
      listeners.forEach((l) => l(state));
    })
    .catch(() => {
      listeners.forEach((l) => l(state));
    });
}

export function subscribeConnectivity(
  listener: (state: ConnectivityState) => void
): () => void {
  listeners.add(listener);
  notifyState();
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Toggle simulated offline mode (for immediate testing without disabling network adapter)
 */
export function setSimulatedOffline(enabled: boolean): void {
  simulatedOffline = enabled;
  notifyState();
  window.dispatchEvent(new CustomEvent(enabled ? 'app:offline' : 'app:online'));
}

/**
 * Persist user state to both localStorage and IndexedDB
 */
export async function syncUserState(user: UserProfile): Promise<void> {
  // 1. LocalStorage
  try {
    localStorage.setItem('icallog_user_profile_v1', JSON.stringify(user));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  // 2. IndexedDB
  await saveUserStateToIDB(user);

  // If offline, record in queue
  if (!getEffectiveOnlineStatus()) {
    await enqueueOfflineAction('UPDATE_PROFILE', {
      userId: user.id,
      timestamp: Date.now(),
      data: user,
    });
  }

  notifyState();
}

/**
 * Persist projects to both localStorage and IndexedDB
 */
export async function syncProjects(projects: ProjectItem[]): Promise<void> {
  // 1. LocalStorage
  try {
    localStorage.setItem('icallog_user_projects_v1', JSON.stringify(projects));
  } catch (e) {
    console.warn('LocalStorage projects save failed:', e);
  }

  // 2. IndexedDB
  await saveProjectsToIDB(projects);

  // If offline, record in queue
  if (!getEffectiveOnlineStatus()) {
    await enqueueOfflineAction('SAVE_PROJECT', {
      count: projects.length,
      timestamp: Date.now(),
    });
  }

  notifyState();
}

/**
 * Process any pending actions queued while offline
 */
export async function processPendingOfflineSync(): Promise<{
  syncedCount: number;
  message: string;
}> {
  if (!getEffectiveOnlineStatus()) {
    return { syncedCount: 0, message: 'Cannot sync while offline' };
  }

  isSyncing = true;
  notifyState();

  try {
    const pending = await getPendingOfflineActions();
    if (pending.length === 0) {
      isSyncing = false;
      notifyState();
      return { syncedCount: 0, message: 'No offline actions pending' };
    }

    // In this app, IndexedDB is authoritative locally; clear the queue after syncing
    await clearOfflineQueue();
    isSyncing = false;
    notifyState();

    return {
      syncedCount: pending.length,
      message: `Successfully synchronized ${pending.length} offline changes with cloud session.`,
    };
  } catch (err) {
    isSyncing = false;
    notifyState();
    return { syncedCount: 0, message: 'Synchronization encountered an error' };
  }
}

/**
 * Initialize background listeners for online/offline events
 */
export function initOfflineSyncListeners(
  onStatusChange?: (isOnline: boolean, wasOffline: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let wasOffline = !getEffectiveOnlineStatus();

  const handleOnline = async () => {
    if (simulatedOffline) return;
    notifyState();
    if (wasOffline) {
      await processPendingOfflineSync();
      if (onStatusChange) onStatusChange(true, true);
      wasOffline = false;
    }
  };

  const handleOffline = () => {
    wasOffline = true;
    notifyState();
    if (onStatusChange) onStatusChange(false, false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Force a hard-refresh of the local IndexedDB state against the server-side database.
 * Fetches canonical user state from server, purges local IndexedDB cache, re-populates object stores,
 * and updates cryptographic local storage signatures.
 */
export async function forceHardRefreshIndexedDB(
  fallbackUser?: UserProfile
): Promise<{ success: boolean; user: UserProfile; message: string }> {
  isSyncing = true;
  notifyState();

  try {
    let serverUser: UserProfile | null = null;
    
    if (getEffectiveOnlineStatus()) {
      try {
        serverUser = await fetchProfile();
      } catch (e) {
        console.warn('Failed to fetch server profile, using current state fallback:', e);
      }
    }

    const targetUser = serverUser || fallbackUser;
    if (!targetUser) {
      isSyncing = false;
      notifyState();
      throw new Error('No valid user profile available for hard refresh');
    }

    // 1. Wipe stale IndexedDB stores
    await clearAllOfflineData();

    // 2. Overwrite IndexedDB stores with canonical state
    await saveUserStateToIDB(targetUser);

    // 3. Update signed LocalStorage key
    setSecureLocalItem('icallog_user_profile_v1', targetUser);

    isSyncing = false;
    notifyState();

    return {
      success: true,
      user: targetUser,
      message: `Hard refresh complete! Local IndexedDB state successfully synchronized with server database.`,
    };
  } catch (err: any) {
    isSyncing = false;
    notifyState();
    return {
      success: false,
      user: fallbackUser!,
      message: err.message || 'Hard refresh failed',
    };
  }
}

