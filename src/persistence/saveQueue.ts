import { normalizeSaveRevision } from './revision';

export interface RevisionedSave {
  saveRevision?: number;
  [key: string]: unknown;
}

export interface OfflineSaveEntry {
  id: string;
  key: string;
  payload: string;
  revision: number;
  attempts: number;
  queuedAt: number;
  lastError: string | null;
}

export const normalizeOfflineSaveEntries = (value: unknown): OfflineSaveEntry[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): OfflineSaveEntry[] => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string' || typeof row.key !== 'string' || typeof row.payload !== 'string') return [];
    return [{
      id: row.id,
      key: row.key,
      payload: row.payload,
      revision: normalizeSaveRevision(row.revision),
      attempts: Number.isInteger(row.attempts) && Number(row.attempts) >= 0 ? Number(row.attempts) : 0,
      queuedAt: Number.isFinite(Number(row.queuedAt)) ? Number(row.queuedAt) : 0,
      lastError: typeof row.lastError === 'string' ? row.lastError : null
    }];
  });
};

const stablePayload = (value: RevisionedSave) => JSON.stringify(value);

export const resolveRevisionConflict = <T extends RevisionedSave>(local: T | null, cloud: T | null) => {
  if (!local) return { source: 'cloud' as const, state: cloud, conflict: false };
  if (!cloud) return { source: 'local' as const, state: local, conflict: false };
  const localRevision = normalizeSaveRevision(local.saveRevision);
  const cloudRevision = normalizeSaveRevision(cloud.saveRevision);
  if (localRevision > cloudRevision) return { source: 'local' as const, state: local, conflict: false };
  if (cloudRevision > localRevision) return { source: 'cloud' as const, state: cloud, conflict: false };
  if (stablePayload(local) === stablePayload(cloud)) return { source: 'equal' as const, state: local, conflict: false };
  return { source: 'local' as const, state: local, conflict: true };
};

export const enqueueOfflineSave = (outbox: OfflineSaveEntry[], input: Omit<OfflineSaveEntry, 'attempts' | 'lastError'>): OfflineSaveEntry[] => {
  if (outbox.some(row => row.key === input.key && row.revision > input.revision)) return outbox;
  const withoutOlder = outbox.filter(row => row.key !== input.key || row.revision > input.revision);
  if (withoutOlder.some(row => row.key === input.key && row.revision === input.revision && row.payload === input.payload)) return withoutOlder;
  return [...withoutOlder, { ...input, attempts: 0, lastError: null }].sort((a, b) => a.queuedAt - b.queuedAt);
};

export const flushOfflineSaves = async (outbox: OfflineSaveEntry[], write: (entry: OfflineSaveEntry) => Promise<void>) => {
  const remaining: OfflineSaveEntry[] = [];
  const completed: string[] = [];
  const newestByKey = new Map<string, OfflineSaveEntry>();
  for (const entry of outbox) {
    const previous = newestByKey.get(entry.key);
    if (!previous || entry.revision > previous.revision || (entry.revision === previous.revision && entry.queuedAt > previous.queuedAt)) {
      newestByKey.set(entry.key, entry);
    }
  }
  const canonicalOutbox = [...newestByKey.values()].sort((left, right) => left.queuedAt - right.queuedAt);
  for (const entry of canonicalOutbox) {
    try {
      await write(entry);
      completed.push(entry.id);
    } catch (error) {
      remaining.push({ ...entry, attempts: entry.attempts + 1, lastError: error instanceof Error ? error.message : 'Cloud write failed' });
    }
  }
  return { remaining, completed };
};
