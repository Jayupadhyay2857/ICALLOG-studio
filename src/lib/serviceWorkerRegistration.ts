/**
 * Service Worker Registration & Management for iCALLOG PWA
 */

export interface SWState {
  isRegistered: boolean;
  isRunning: boolean;
  registration: ServiceWorkerRegistration | null;
  hasUpdate: boolean;
}

let swState: SWState = {
  isRegistered: false,
  isRunning: false,
  registration: null,
  hasUpdate: false,
};

const listeners = new Set<(state: SWState) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...swState }));
}

export function subscribeSWState(listener: (state: SWState) => void): () => void {
  listeners.add(listener);
  listener({ ...swState });
  return () => {
    listeners.delete(listener);
  };
}

export function getSWState(): SWState {
  return { ...swState };
}

/**
 * Register Service Worker if supported by browser environment
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.info('[SW] Service Worker is not supported in this browser/environment.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swState = {
      isRegistered: true,
      isRunning: !!navigator.serviceWorker.controller,
      registration,
      hasUpdate: !!registration.waiting,
    };
    notifyListeners();

    // Listen for updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            swState.hasUpdate = true;
            console.log('[SW] New version available for offline use.');
          } else {
            console.log('[SW] Critical application shell cached for offline use.');
          }
          notifyListeners();
        }
      };
    };

    // Controller change (new SW claimed clients)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      swState.isRunning = true;
      notifyListeners();
    });

    return registration;
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
    return null;
  }
}

/**
 * Unregister service worker (if user resets cache)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
    swState = {
      isRegistered: false,
      isRunning: false,
      registration: null,
      hasUpdate: false,
    };
    notifyListeners();
    return true;
  } catch (err) {
    console.error('[SW] Unregister failed:', err);
    return false;
  }
}
