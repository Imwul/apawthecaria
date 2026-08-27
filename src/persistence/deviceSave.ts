import { normalizeSaveRevision } from './revision';

/**
 * Small IndexedDB fallback for browsers that reject localStorage writes
 * (Safari private windows and exhausted localStorage quotas are common
 * examples).  The campaign payload is already serialized JSON, so keeping a
 * single key/value record avoids introducing a second save schema.
 */

const DATABASE_NAME = 'apawthecaria-device-save';
const DATABASE_VERSION = 1;
const STORE_NAME = 'records';
const DEVICE_STORAGE_TIMEOUT_MS = 1500;

type StoredRecord = { key: string; value: string };

let databasePromise: Promise<IDBDatabase | null> | null = null;

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (databasePromise) return databasePromise;
  databasePromise = new Promise(resolve => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      settled = true;
      resolve(null);
    }, DEVICE_STORAGE_TIMEOUT_MS);
    const finish = (database: IDBDatabase | null) => {
      if (settled) {
        database?.close();
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      resolve(database);
    };
    try {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => finish(request.result);
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
    } catch {
      finish(null);
    }
  });
  return databasePromise;
};

export const readDeviceSave = async (key: string): Promise<string | null> => {
  const database = await openDatabase();
  if (!database) return null;
  return new Promise(resolve => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      settled = true;
      resolve(null);
    }, DEVICE_STORAGE_TIMEOUT_MS);
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(value);
    };
    try {
      const request = database.transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(key);
      request.onsuccess = () => {
        const value = (request.result as StoredRecord | undefined)?.value;
        finish(typeof value === 'string' ? value : null);
      };
      request.onerror = () => finish(null);
    } catch {
      finish(null);
    }
  });
};

export const writeDeviceSave = async (key: string, value: string): Promise<boolean> => {
  const database = await openDatabase();
  if (!database) return false;
  return new Promise(resolve => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      settled = true;
      resolve(false);
    }, DEVICE_STORAGE_TIMEOUT_MS);
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(value);
    };
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ key, value } satisfies StoredRecord);
      transaction.oncomplete = () => finish(true);
      transaction.onerror = () => finish(false);
      transaction.onabort = () => finish(false);
    } catch {
      finish(false);
    }
  });
};

export const removeDeviceSave = async (key: string): Promise<boolean> => {
  const database = await openDatabase();
  if (!database) return false;
  return new Promise(resolve => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      settled = true;
      resolve(false);
    }, DEVICE_STORAGE_TIMEOUT_MS);
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(value);
    };
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => finish(true);
      transaction.onerror = () => finish(false);
      transaction.onabort = () => finish(false);
    } catch {
      finish(false);
    }
  });
};

/**
 * Pick the newest usable JSON snapshot when localStorage and the durable
 * fallback both exist. The fallback is written only after a localStorage
 * failure, so an older localStorage value must not hide a newer fallback copy.
 * Invalid JSON never wins over a parseable snapshot.
 */
export const preferDeviceSave = (localRaw: string | null, fallbackRaw: string | null): string | null => {
  const revisionOf = (raw: string | null): number => {
    if (!raw) return -1;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return -1;
      return normalizeSaveRevision((parsed as { saveRevision?: unknown }).saveRevision);
    } catch {
      return -1;
    }
  };
  const localRevision = revisionOf(localRaw);
  const fallbackRevision = revisionOf(fallbackRaw);
  if (localRevision < 0) return fallbackRaw ?? localRaw;
  if (fallbackRevision > localRevision) return fallbackRaw;
  return localRaw;
};
