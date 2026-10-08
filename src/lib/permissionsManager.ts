import { MASTER_ENTERTAINMENT_CATALOG, MASTER_CHARACTER_REPOSITORY } from './entertainmentAggregator.ts';

/**
 * Central Permissions & Auto-Start Manager
 * Auto-starts access permissions when the app launches (Storage, Hardware Acceleration, WebGL, Audio/Video readiness)
 * and auto-syncs all cartoons, anime, movies, series, and character profiles so no content is ever missed.
 */

export interface AppPermissions {
  essential: boolean; // LocalStorage & Session
  storage: boolean; // IndexedDB & persistent offline vault
  gpuHardware: boolean; // WebGL & GPU acceleration
  analytics: boolean; // Performance telemetry
  mediaDevices: boolean; // Camera & Mic
  location: boolean; // Geolocation
  notifications: boolean; // Web Push
  autoStartAccess: boolean; // Auto-activate permissions on app start
  hasConsented: boolean; // User has confirmed
}

export const PERMISSIONS_STORAGE_KEY = 'icallog_cookie_permissions_v1';
export const AUTO_START_KEY = 'icallog_auto_start_permissions_v1';

export function getDefaultPermissions(): AppPermissions {
  return {
    essential: true,
    storage: true,
    gpuHardware: true,
    analytics: true,
    mediaDevices: true, // Auto-start enabled as requested by user
    location: false, // Location optional for privacy, can be enabled
    notifications: false,
    autoStartAccess: true, // Default to true so app is ready on launch
    hasConsented: true, // Auto-consented on start, editable in settings
  };
}

export function getStoredPermissions(): AppPermissions {
  if (typeof window === 'undefined') return getDefaultPermissions();
  try {
    const saved = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...getDefaultPermissions(),
        ...parsed,
      };
    }
  } catch {
    // fallback
  }
  return getDefaultPermissions();
}

export function savePermissions(perms: AppPermissions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(perms));
    localStorage.setItem(AUTO_START_KEY, perms.autoStartAccess ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('app:permissions-changed', { detail: perms }));
  } catch {
    // ignore
  }
}

/**
 * Auto-sync all cartoons, anime, OTT series, movies, and character profiles into localStorage
 * so that all old and new entertainment items are always available offline and on mobile.
 */
export function autoSyncAllEntertainmentAndCartoons(): void {
  if (typeof window === 'undefined') return;
  try {
    const existingCatalog = localStorage.getItem('icallog_entertainment_catalog_v1');
    if (!existingCatalog || JSON.parse(existingCatalog).length < MASTER_ENTERTAINMENT_CATALOG.length) {
      localStorage.setItem('icallog_entertainment_catalog_v1', JSON.stringify(MASTER_ENTERTAINMENT_CATALOG));
    }
    const existingRepo = localStorage.getItem('icallog_character_repo_saved_v1');
    if (!existingRepo || JSON.parse(existingRepo).length < MASTER_CHARACTER_REPOSITORY.length) {
      localStorage.setItem('icallog_character_repo_saved_v1', JSON.stringify(MASTER_CHARACTER_REPOSITORY));
    }
    window.dispatchEvent(new CustomEvent('icallog_entertainment_auto_synced', { detail: { count: MASTER_ENTERTAINMENT_CATALOG.length } }));
  } catch (err) {
    console.warn('Auto-sync entertainment error:', err);
  }
}

/**
 * Auto-initialize permissions on application startup
 * Runs seamlessly in the background without blocking the UI
 */
export async function autoInitializeAppAccess(): Promise<AppPermissions> {
  const current = getStoredPermissions();

  // If autoStart is enabled (which defaults to true), prime the environment & auto-sync all cartoons / media
  if (current.autoStartAccess) {
    // 1. Prime essential storage
    try {
      localStorage.setItem('icallog_boot_timestamp', Date.now().toString());
    } catch (e) {
      console.warn('LocalStorage priming issue:', e);
    }

    // 2. Auto-sync all cartoons, anime, and entertainment catalog items
    autoSyncAllEntertainmentAndCartoons();

    // 3. Prime WebGL context readiness (check support)
    if (current.gpuHardware && typeof document !== 'undefined') {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (gl) {
          // Hardware acceleration active
        }
      } catch (e) {
        console.warn('WebGL init check:', e);
      }
    }

    // 4. Mark hasConsented true so blocking modal does not disrupt startup
    if (!current.hasConsented) {
      current.hasConsented = true;
      savePermissions(current);
    }
  }

  return current;
}
