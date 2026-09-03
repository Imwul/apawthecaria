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

export type DeviceSaveFailure = 'quota' | 'unavailable';

/** Storage APIs report quota, privacy blocking, and disabled persistence with
 * different browser-specific exception shapes. Keep quota messaging limited
 * to errors that actually identify a capacity problem. */
export const classifyDeviceSaveFailure = (error: unknown): DeviceSaveFailure => {
  const row = error && typeof error === 'object'
    ? error as { name?: unknown; code?: unknown; message?: unknown }
    : {};
  const name = String(row.name || '');
  const code = Number(row.code);
  const message = String(row.message || error || '');
  return name === 'QuotaExceededError'
    || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || code === 22
    || code === 1014
    || /quota|storage\s+(?:is\s+)?full|exceed(?:ed|s)?\s+(?:the\s+)?(?:storage|quota)/i.test(message)
    ? 'quota'
    : 'unavailable';
};

let databasePromise: Promise<IDBDatabase | null> | null = null;

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (databasePromise) return databasePromise;
  const opening = new Promise<IDBDatabase | null>(resolve => {
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
      request.onsuccess = () => {
        const database = request.result;
        database.onclose = () => {
          databasePromise = null;
        };
        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };
        finish(database);
      };
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
    } catch {
      finish(null);
    }
  });
  // A transient Safari privacy/locking failure must not poison persistence for
  // the rest of the tab. Keep successful connections cached, but allow the
  // next save to retry after a failed or timed-out open.
  databasePromise = opening.then(database => {
    if (!database) databasePromise = null;
    return database;
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

export const writeDeviceSave = async (key: string, value: string, stillCurrent?: () => boolean): Promise<boolean> => {
  const database = await openDatabase();
  if (!database || stillCurrent?.() === false) return false;
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

export const removeDeviceSave = async (key: string, stillCurrent?: () => boolean): Promise<boolean> => {
  const database = await openDatabase();
  if (!database || stillCurrent?.() === false) return false;
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

/** A deliberate cloud-slot replacement can have a lower revision than the
 * campaign being left. Do not fall back to a second store whose stale primary
 * copy could win on reload. Preserve the old latest snapshot before clearing
 * its fallback, and require the replacement itself to reach the primary store.
 * Ordinary autosaves continue using IndexedDB when localStorage is blocked. */
export const persistDeviceSaveReplacement = async (
  key: string,
  snapshot: string,
  dependencies: {
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    readFallback?: typeof readDeviceSave;
    removeFallback?: typeof removeDeviceSave;
    stillCurrent?: () => boolean;
  } = {}
): Promise<{ localSaved: boolean; localFailure: DeviceSaveFailure | null }> => {
  const storage = dependencies.storage ?? localStorage;
  try {
    const fallbackRaw = await (dependencies.readFallback ?? readDeviceSave)(key);
    if (dependencies.stillCurrent?.() === false) return { localSaved: false, localFailure: null };
    const localRaw = storage.getItem(key);
    if (fallbackRaw !== null) {
      // If promotion fails, neither durable copy of the old campaign changes.
      const current = preferDeviceSave(localRaw, fallbackRaw);
      if (current !== null) storage.setItem(key, current);
      if (!await (dependencies.removeFallback ?? removeDeviceSave)(key)) {
        return { localSaved: false, localFailure: 'unavailable' };
      }
    }
    if (dependencies.stillCurrent?.() === false) return { localSaved: false, localFailure: null };
    storage.setItem(key, snapshot);
    return { localSaved: true, localFailure: null };
  } catch (error) {
    return { localSaved: false, localFailure: classifyDeviceSaveFailure(error) };
  }
};
