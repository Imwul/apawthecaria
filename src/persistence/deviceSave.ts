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
type DeviceSaveStorage = Pick<Storage, 'getItem' | 'setItem'>;
const DEVICE_SAVE_POINTER_FORMAT = 'apawthecaria-device-save-pointer-v1';
const DEVICE_SAVE_POINTER_PREFIX = 'apawthecaria-device-save-pointer-';
const UNAVAILABLE_DEVICE_SAVE = '__apawthecaria_unavailable_device_save_pointer__';
type DeviceSavePointer = { format: string; snapshotKey?: unknown };

const parseDeviceSavePointer = (raw: string | null): DeviceSavePointer | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && typeof parsed.format === 'string'
      && parsed.format.startsWith(DEVICE_SAVE_POINTER_PREFIX) ? parsed : null;
  } catch {
    return null;
  }
};

export const isDeviceSavePointer = (raw: string | null): boolean => Boolean(parseDeviceSavePointer(raw));
export const isUnavailableDeviceSave = (raw: string | null): boolean => raw === UNAVAILABLE_DEVICE_SAVE;

const readPrimary = (key: string, storage?: Pick<Storage, 'getItem'>): { ok: true; raw: string | null } | { ok: false } => {
  try {
    const target = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    return { ok: true, raw: target?.getItem(key) ?? null };
  } catch {
    return { ok: false };
  }
};

const snapshotKeyPrefix = (key: string) => `${key}::snapshot::`;

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

type DeviceRecordRead = { status: 'found'; value: string } | { status: 'absent' | 'unavailable' };

const readDeviceRecordResult = async (key: string): Promise<DeviceRecordRead> => {
  const database = await openDatabase();
  if (!database) return { status: 'unavailable' };
  return new Promise(resolve => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      settled = true;
      resolve({ status: 'unavailable' });
    }, DEVICE_STORAGE_TIMEOUT_MS);
    const finish = (value: DeviceRecordRead) => {
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
        finish(typeof value === 'string' ? { status: 'found', value } : { status: 'absent' });
      };
      request.onerror = () => finish({ status: 'unavailable' });
    } catch {
      finish({ status: 'unavailable' });
    }
  });
};

const readDeviceRecord = async (key: string): Promise<string | null> => {
  const result = await readDeviceRecordResult(key);
  return result.status === 'found' ? result.value : null;
};

const writeDeviceRecord = async (key: string, value: string, stillCurrent?: () => boolean, immutable = false): Promise<boolean> => {
  const database = await openDatabase();
  if (!database || stillCurrent?.() === false) return false;
  return new Promise(resolve => {
    let settled = false;
    let transaction: IDBTransaction | null = null;
    const timeoutId = setTimeout(() => {
      try { transaction?.abort(); } catch { /* Already completed or aborted. */ }
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
      transaction = database.transaction(STORE_NAME, 'readwrite');
      const record = { key, value } satisfies StoredRecord;
      if (immutable) transaction.objectStore(STORE_NAME).add(record);
      else transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = () => finish(true);
      transaction.onerror = () => finish(false);
      transaction.onabort = () => finish(false);
    } catch {
      finish(false);
    }
  });
};

const removeDeviceRecord = async (key: string, stillCurrent?: () => boolean): Promise<boolean> => {
  const database = await openDatabase();
  if (!database || stillCurrent?.() === false) return false;
  return new Promise(resolve => {
    let settled = false;
    let transaction: IDBTransaction | null = null;
    const timeoutId = setTimeout(() => {
      try { transaction?.abort(); } catch { /* Already completed or aborted. */ }
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
      transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => finish(true);
      transaction.onerror = () => finish(false);
      transaction.onabort = () => finish(false);
    } catch {
      finish(false);
    }
  });
};

/** Resolve an authoritative tiny primary pointer, never the legacy fallback
 * that it superseded. Missing/unavailable targets deliberately fail parsing. */
export const readDeviceSave = async (
  key: string,
  storage?: Pick<Storage, 'getItem'>,
  expectedPrimaryRaw?: string | null
): Promise<string | null> => {
  const primary = readPrimary(key, storage);
  if (!primary.ok || (expectedPrimaryRaw !== undefined && primary.raw !== expectedPrimaryRaw)) return UNAVAILABLE_DEVICE_SAVE;
  const pointer = parseDeviceSavePointer(primary.raw);
  if (!pointer) {
    const result = await readDeviceRecordResult(key);
    const latest = readPrimary(key, storage);
    if (!latest.ok || latest.raw !== primary.raw || result.status === 'unavailable') return UNAVAILABLE_DEVICE_SAVE;
    return result.status === 'found' ? result.value : null;
  }
  if (pointer.format !== DEVICE_SAVE_POINTER_FORMAT
    || typeof pointer.snapshotKey !== 'string'
    || !pointer.snapshotKey.startsWith(snapshotKeyPrefix(key))) return UNAVAILABLE_DEVICE_SAVE;
  const payload = await readDeviceRecord(pointer.snapshotKey);
  const latest = readPrimary(key, storage);
  if (!latest.ok || latest.raw !== primary.raw || payload === null) return UNAVAILABLE_DEVICE_SAVE;
  return payload;
};

type StageSnapshot = (key: string, value: string, stillCurrent?: () => boolean) => Promise<boolean>;

const commitPointerSnapshot = async (
  key: string,
  snapshot: string,
  storage: DeviceSaveStorage,
  expectedPrimaryRaw: string | null,
  stillCurrent?: () => boolean,
  stageSnapshot: StageSnapshot = (recordKey, value, current) => writeDeviceRecord(recordKey, value, current, true),
  makeSnapshotId: () => string = () => globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`
): Promise<{ localSaved: boolean; localFailure: DeviceSaveFailure | null }> => {
  const snapshotKey = `${snapshotKeyPrefix(key)}${makeSnapshotId()}`;
  const removeUnreferenced = (recordKey: string) => {
    void removeDeviceRecord(recordKey, () => {
      const current = readPrimary(key, storage);
      return current.ok && parseDeviceSavePointer(current.raw)?.snapshotKey !== recordKey;
    });
  };
  if (stillCurrent?.() === false) return { localSaved: false, localFailure: null };
  if (!await stageSnapshot(snapshotKey, snapshot, stillCurrent)) {
    return { localSaved: false, localFailure: stillCurrent?.() === false ? null : 'unavailable' };
  }
  try {
    // The staged record is immutable and not authoritative until this small
    // primary write succeeds. A denied pointer leaves both old stores intact.
    if (stillCurrent?.() === false || storage.getItem(key) !== expectedPrimaryRaw) {
      removeUnreferenced(snapshotKey);
      return { localSaved: false, localFailure: null };
    }
    storage.setItem(key, JSON.stringify({ format: DEVICE_SAVE_POINTER_FORMAT, snapshotKey }));
    const oldPointer = parseDeviceSavePointer(expectedPrimaryRaw);
    if (oldPointer?.format === DEVICE_SAVE_POINTER_FORMAT && typeof oldPointer.snapshotKey === 'string'
      && oldPointer.snapshotKey.startsWith(snapshotKeyPrefix(key))) {
      // Cleanup is conditional and never part of the commit. Readers of the
      // previous pointer detect its changed primary key and fail closed.
      removeUnreferenced(oldPointer.snapshotKey);
    }
    return { localSaved: true, localFailure: null };
  } catch (error) {
    removeUnreferenced(snapshotKey);
    return { localSaved: false, localFailure: classifyDeviceSaveFailure(error) };
  }
};

export const writeDeviceSave = async (
  key: string,
  value: string,
  stillCurrent?: () => boolean,
  storage?: DeviceSaveStorage
): Promise<boolean> => {
  const primary = readPrimary(key, storage);
  if (!primary.ok || stillCurrent?.() === false) return false;
  if (!isDeviceSavePointer(primary.raw)) return writeDeviceRecord(key, value, stillCurrent);
  const pointer = parseDeviceSavePointer(primary.raw)!;
  if (pointer.format !== DEVICE_SAVE_POINTER_FORMAT || typeof pointer.snapshotKey !== 'string'
    || !pointer.snapshotKey.startsWith(snapshotKeyPrefix(key))) return false;
  try {
    const target = storage ?? localStorage;
    return (await commitPointerSnapshot(key, value, target, primary.raw, stillCurrent)).localSaved;
  } catch {
    return false;
  }
};

/** Normal primary-save cleanup must not delete an authoritative generation. */
export const removeDeviceSave = async (
  key: string,
  stillCurrent?: () => boolean,
  storage?: Pick<Storage, 'getItem'>
): Promise<boolean> => {
  const mayRemove = () => {
    const primary = readPrimary(key, storage);
    return primary.ok && !isDeviceSavePointer(primary.raw) && stillCurrent?.() !== false;
  };
  if (!mayRemove()) return false;
  return removeDeviceRecord(key, mayRemove);
};

/**
 * Pick the newest usable JSON snapshot when localStorage and the durable
 * fallback both exist. The fallback is written only after a localStorage
 * failure, so an older localStorage value must not hide a newer fallback copy.
 * Invalid JSON never wins over a parseable snapshot.
 */
export const preferDeviceSave = (localRaw: string | null, fallbackRaw: string | null): string | null => {
  if (isDeviceSavePointer(localRaw)) return fallbackRaw ?? UNAVAILABLE_DEVICE_SAVE;
  if (isUnavailableDeviceSave(fallbackRaw)) return UNAVAILABLE_DEVICE_SAVE;
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

/** A small primary pointer can commit a lower-revision replacement even when
 * the full JSON exceeds localStorage's quota. No older fallback is promoted or
 * removed first. Total primary-write denial still fails safely. */
export const persistDeviceSaveReplacement = async (
  key: string,
  snapshot: string,
  dependencies: {
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    readFallback?: typeof readDeviceSave;
    removeFallback?: typeof removeDeviceSave;
    stillCurrent?: () => boolean;
    stageSnapshot?: StageSnapshot;
    makeSnapshotId?: () => string;
  } = {}
): Promise<{ localSaved: boolean; localFailure: DeviceSaveFailure | null }> => {
  try {
    const storage = dependencies.storage ?? localStorage;
    const initialPrimary = storage.getItem(key);
    let fallbackRaw: string | null;
    if (dependencies.readFallback) {
      fallbackRaw = await dependencies.readFallback(key);
    } else if (isDeviceSavePointer(initialPrimary)) {
      fallbackRaw = await readDeviceSave(key, storage, initialPrimary);
    } else {
      const fallback = await readDeviceRecordResult(key);
      fallbackRaw = fallback.status === 'found' ? fallback.value
        : fallback.status === 'absent' ? null : UNAVAILABLE_DEVICE_SAVE;
    }
    if (dependencies.stillCurrent?.() === false || storage.getItem(key) !== initialPrimary) {
      return { localSaved: false, localFailure: null };
    }
    // With no older fallback, replacing the primary JSON is already atomic.
    // Otherwise commit a pointer so crash/reload cannot prefer that old copy.
    if (fallbackRaw === null && !isDeviceSavePointer(initialPrimary)) {
      try {
        storage.setItem(key, snapshot);
        return { localSaved: true, localFailure: null };
      } catch {
        // The tiny pointer can still fit when the full JSON cannot.
      }
    }
    return commitPointerSnapshot(key, snapshot, storage, initialPrimary, dependencies.stillCurrent,
      dependencies.stageSnapshot, dependencies.makeSnapshotId);
  } catch (error) {
    return { localSaved: false, localFailure: classifyDeviceSaveFailure(error) };
  }
};
