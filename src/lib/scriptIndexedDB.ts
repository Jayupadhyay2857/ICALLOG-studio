/**
 * IndexedDB Storage Engine for CameraStudio Teleprompter Scripts
 * Provides robust multi-document persistence, auto-seeding with factory scripts,
 * search indexing, and real-time retrieval for live teleprompter presentations.
 */

import { TeleprompterScript } from '../types.ts';
import { DEFAULT_FACTORY_SCRIPTS } from './cameraVault.ts';

const DB_NAME = 'iCALLOG_ScriptLibrary_DB_v1';
const DB_VERSION = 1;
const STORE_NAME = 'scripts';

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB instance with 'scripts' object store
 */
export function initScriptDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not supported in this browser.'));
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

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });

          // Pre-seed with default factory scripts
          DEFAULT_FACTORY_SCRIPTS.forEach((script) => {
            store.put(script);
          });
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

/**
 * Retrieve all scripts from IndexedDB (seeds factory defaults if empty)
 */
export async function getAllScriptsFromIDB(): Promise<TeleprompterScript[]> {
  try {
    const db = await initScriptDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = async () => {
        let results: TeleprompterScript[] = req.result || [];
        if (results.length === 0) {
          // If empty, seed defaults
          await seedDefaultScriptsToIDB();
          resolve(DEFAULT_FACTORY_SCRIPTS);
          return;
        }

        // Sort: most recently updated first
        results.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime() || 0;
          const timeB = new Date(b.updatedAt || b.createdAt).getTime() || 0;
          return timeB - timeA;
        });

        resolve(results);
      };

      req.onerror = () => {
        console.warn('[ScriptDB] Error getting scripts from IndexedDB, falling back to factory defaults');
        resolve(DEFAULT_FACTORY_SCRIPTS);
      };
    });
  } catch (err) {
    console.warn('[ScriptDB] Failed to access IndexedDB, falling back to defaults:', err);
    return DEFAULT_FACTORY_SCRIPTS;
  }
}

/**
 * Seed or re-seed default factory scripts into IndexedDB
 */
export async function seedDefaultScriptsToIDB(): Promise<void> {
  try {
    const db = await initScriptDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      DEFAULT_FACTORY_SCRIPTS.forEach((script) => {
        store.put(script);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[ScriptDB] Could not seed default scripts:', err);
  }
}

/**
 * Save or update a script document in IndexedDB
 */
export async function saveScriptToIDB(script: TeleprompterScript): Promise<TeleprompterScript[]> {
  try {
    const db = await initScriptDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(script);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return await getAllScriptsFromIDB();
  } catch (err) {
    console.warn('[ScriptDB] Save script failed:', err);
    return await getAllScriptsFromIDB();
  }
}

/**
 * Delete a script document from IndexedDB by ID
 */
export async function deleteScriptFromIDB(id: string): Promise<TeleprompterScript[]> {
  try {
    const db = await initScriptDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return await getAllScriptsFromIDB();
  } catch (err) {
    console.warn('[ScriptDB] Delete script failed:', err);
    return await getAllScriptsFromIDB();
  }
}

/**
 * Reset all scripts to default factory sample documents
 */
export async function resetScriptsToFactoryIDB(): Promise<TeleprompterScript[]> {
  try {
    const db = await initScriptDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => {
        DEFAULT_FACTORY_SCRIPTS.forEach((scr) => store.put(scr));
        resolve();
      };
      req.onerror = () => reject(req.error);
    });

    return DEFAULT_FACTORY_SCRIPTS;
  } catch (err) {
    console.warn('[ScriptDB] Reset scripts failed:', err);
    return DEFAULT_FACTORY_SCRIPTS;
  }
}
