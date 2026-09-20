/**
 * IndexedDB Offline Storage Layer for iCALLOG Creative Gateway
 * Manages persistent storage of User State, Studio Projects,
 * Cached Assets, and Offline Sync Action Queues.
 */

import { UserProfile, ProjectItem } from '../types.ts';

const DB_NAME = 'iCALLOG_OfflineDB_v1';
const DB_VERSION = 1;

export const STORES = {
  USER_STATE: 'userState',
  PROJECTS: 'projects',
  OFFLINE_QUEUE: 'offlineQueue',
  CACHED_ASSETS: 'cachedAssets',
} as const;

export interface OfflineAction {
  id?: number;
  type: 'SAVE_PROJECT' | 'DELETE_PROJECT' | 'UPDATE_PROFILE' | 'SYNC_SESSION' | 'DRAFT_AUTOSAVE';
  payload: any;
  timestamp: number;
}

export interface OfflineDiagnostics {
  isSupported: boolean;
  userStateSaved: boolean;
  projectsCount: number;
  pendingQueueCount: number;
  dbVersion: number;
  lastSyncTimestamp: number | null;
}

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize and upgrade IndexedDB schema
 */
export function initOfflineDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. User State Store (Key: 'current_user' or user.id)
        if (!db.objectStoreNames.contains(STORES.USER_STATE)) {
          db.createObjectStore(STORES.USER_STATE, { keyPath: 'id' });
        }

        // 2. Projects Store (Key: project.id)
        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
          projectStore.createIndex('category', 'category', { unique: false });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 3. Offline Action Queue (Auto-incrementing key)
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 4. Cached Assets Store (Key: asset.id or url)
        if (!db.objectStoreNames.contains(STORES.CACHED_ASSETS)) {
          db.createObjectStore(STORES.CACHED_ASSETS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: Event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;

        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          initPromise = null;
        };

        resolve(dbInstance);
      };

      request.onerror = (event: Event) => {
        initPromise = null;
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      initPromise = null;
      reject(err);
    }
  });

  return initPromise;
}

// ---------------- USER STATE OPERATIONS ----------------

/**
 * Save user profile and current session settings to IndexedDB
 */
export async function saveUserStateToIDB(user: UserProfile): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_STATE, 'readwrite');
      const store = tx.objectStore(STORES.USER_STATE);
      // Ensure fixed key 'current_user' for rapid single-row lookup
      const record = {
        id: 'current_user',
        data: user,
        updatedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not save user state to IndexedDB:', err);
  }
}

/**
 * Retrieve user profile from IndexedDB
 */
export async function getUserStateFromIDB(): Promise<UserProfile | null> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_STATE, 'readonly');
      const store = tx.objectStore(STORES.USER_STATE);
      const req = store.get('current_user');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as UserProfile);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not get user state from IndexedDB:', err);
    return null;
  }
}

// ---------------- PROJECTS OPERATIONS ----------------

/**
 * Batch save projects to IndexedDB
 */
export async function saveProjectsToIDB(projects: ProjectItem[]): Promise<void> {
  if (!projects || projects.length === 0) return;
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PROJECTS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECTS);

      projects.forEach((proj) => {
        store.put(proj);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not save projects to IndexedDB:', err);
  }
}

/**
 * Save or update a single project in IndexedDB
 */
export async function saveSingleProjectToIDB(project: ProjectItem): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PROJECTS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECTS);
      const req = store.put(project);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not save single project to IndexedDB:', err);
  }
}

/**
 * Retrieve all projects stored in IndexedDB
 */
export async function getProjectsFromIDB(): Promise<ProjectItem[]> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PROJECTS, 'readonly');
      const store = tx.objectStore(STORES.PROJECTS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve((req.result as ProjectItem[]) || []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not get projects from IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a project from IndexedDB
 */
export async function deleteProjectFromIDB(projectId: string): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PROJECTS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECTS);
      const req = store.delete(projectId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not delete project from IndexedDB:', err);
  }
}

// ---------------- OFFLINE ACTION QUEUE ----------------

/**
 * Enqueue an action performed while offline to be synced once reconnected
 */
export async function enqueueOfflineAction(
  type: OfflineAction['type'],
  payload: any
): Promise<number | null> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const action: OfflineAction = {
        type,
        payload,
        timestamp: Date.now(),
      };
      const req = store.add(action);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not enqueue offline action:', err);
    return null;
  }
}

/**
 * Retrieve all pending offline actions
 */
export async function getPendingOfflineActions(): Promise<OfflineAction[]> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve((req.result as OfflineAction[]) || []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not retrieve pending offline actions:', err);
    return [];
  }
}

/**
 * Remove a completed action from the queue
 */
export async function removeOfflineAction(id: number): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not remove offline action:', err);
  }
}

/**
 * Clear all actions from the offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not clear offline queue:', err);
  }
}

// ---------------- CACHED ASSETS ----------------

/**
 * Store cached asset or template data
 */
export async function cacheAssetInIDB(id: string, data: any): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CACHED_ASSETS, 'readwrite');
      const store = tx.objectStore(STORES.CACHED_ASSETS);
      const req = store.put({ id, data, cachedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not cache asset in IndexedDB:', err);
  }
}

/**
 * Retrieve cached asset from IndexedDB
 */
export async function getCachedAssetFromIDB(id: string): Promise<any | null> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CACHED_ASSETS, 'readonly');
      const store = tx.objectStore(STORES.CACHED_ASSETS);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Could not get cached asset:', err);
    return null;
  }
}

// ---------------- DIAGNOSTICS & MAINTENANCE ----------------

/**
 * Comprehensive diagnostics for UI metrics in Cookies/Storage and Offline banners
 */
export async function getOfflineStorageDiagnostics(): Promise<OfflineDiagnostics> {
  const isSupported = typeof window !== 'undefined' && 'indexedDB' in window;
  if (!isSupported) {
    return {
      isSupported: false,
      userStateSaved: false,
      projectsCount: 0,
      pendingQueueCount: 0,
      dbVersion: DB_VERSION,
      lastSyncTimestamp: null,
    };
  }

  try {
    const db = await initOfflineDB();

    const [userState, projects, queue] = await Promise.all([
      new Promise<any>((res) => {
        const tx = db.transaction(STORES.USER_STATE, 'readonly');
        const req = tx.objectStore(STORES.USER_STATE).get('current_user');
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      }),
      new Promise<number>((res) => {
        const tx = db.transaction(STORES.PROJECTS, 'readonly');
        const req = tx.objectStore(STORES.PROJECTS).count();
        req.onsuccess = () => res(req.result || 0);
        req.onerror = () => res(0);
      }),
      new Promise<number>((res) => {
        const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
        const req = tx.objectStore(STORES.OFFLINE_QUEUE).count();
        req.onsuccess = () => res(req.result || 0);
        req.onerror = () => res(0);
      }),
    ]);

    return {
      isSupported: true,
      userStateSaved: !!userState,
      projectsCount: projects,
      pendingQueueCount: queue,
      dbVersion: db.version,
      lastSyncTimestamp: userState?.updatedAt || null,
    };
  } catch (err) {
    return {
      isSupported: true,
      userStateSaved: false,
      projectsCount: 0,
      pendingQueueCount: 0,
      dbVersion: DB_VERSION,
      lastSyncTimestamp: null,
    };
  }
}

/**
 * Reset all IndexedDB object stores (for storage maintenance)
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    const db = await initOfflineDB();
    const stores = [STORES.USER_STATE, STORES.PROJECTS, STORES.OFFLINE_QUEUE, STORES.CACHED_ASSETS];
    await Promise.all(
      stores.map(
        (storeName) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          })
      )
    );
  } catch (err) {
    console.error('[OfflineDB] Failed to clear offline data:', err);
  }
}
