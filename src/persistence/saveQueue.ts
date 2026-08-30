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
  ownerUid: string | null;
  slot: 1 | 2 | 3 | null;
  attempts: number;
  queuedAt: number;
  lastError: string | null;
}

export const offlineSaveRequiresManualResolution = (lastError: string | null | undefined) =>
  lastError === 'cloud-slot-deleted' || lastError === 'cloud-slot-newer';

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
      ownerUid: typeof row.ownerUid === 'string' && row.ownerUid.trim() ? row.ownerUid.trim() : null,
      slot: row.slot === 1 || row.slot === 2 || row.slot === 3 ? row.slot : null,
      attempts: Number.isInteger(row.attempts) && Number(row.attempts) >= 0 ? Number(row.attempts) : 0,
      queuedAt: Number.isFinite(Number(row.queuedAt)) ? Number(row.queuedAt) : 0,
      lastError: typeof row.lastError === 'string' ? row.lastError : null
    }];
  });
};

const stablePayload = (value: RevisionedSave) => JSON.stringify(value);

const offlineSaveTarget = (entry: Pick<OfflineSaveEntry, 'key' | 'ownerUid' | 'slot'>) =>
  `${entry.ownerUid || 'unbound'}:${entry.slot || 'unbound'}:${entry.key}`;

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
  const target = offlineSaveTarget(input);
  if (outbox.some(row => offlineSaveTarget(row) === target && row.revision > input.revision)) return outbox;
  const withoutOlder = outbox.filter(row => offlineSaveTarget(row) !== target || row.revision > input.revision);
  if (withoutOlder.some(row => offlineSaveTarget(row) === target && row.revision === input.revision && row.payload === input.payload)) return withoutOlder;
  return [...withoutOlder, { ...input, attempts: 0, lastError: null }].sort((a, b) => a.queuedAt - b.queuedAt);
};

export const removeOfflineSavesThroughRevision = (
  outbox: OfflineSaveEntry[],
  input: { key: string; ownerUid: string; slot: 1 | 2 | 3; revision: number }
): OfflineSaveEntry[] => {
  const target = offlineSaveTarget(input);
  return outbox.filter(entry => offlineSaveTarget(entry) !== target || entry.revision > input.revision);
};

export const reconcileOfflineSaveFlush = (
  latestOutbox: OfflineSaveEntry[],
  flushResult: { completed: string[]; remaining: OfflineSaveEntry[] }
): OfflineSaveEntry[] => {
  const completedIds = new Set(flushResult.completed);
  const failedById = new Map(flushResult.remaining.map(entry => [entry.id, entry]));
  return latestOutbox
    .filter(entry => !completedIds.has(entry.id))
    .map(entry => failedById.get(entry.id) || entry)
    .sort((left, right) => left.queuedAt - right.queuedAt);
};

export const flushOfflineSaves = async (outbox: OfflineSaveEntry[], write: (entry: OfflineSaveEntry) => Promise<void>) => {
  const remaining: OfflineSaveEntry[] = [];
  const completed: string[] = [];
  const newestByKey = new Map<string, OfflineSaveEntry>();
  for (const entry of outbox) {
    const target = offlineSaveTarget(entry);
    const previous = newestByKey.get(target);
    if (!previous || entry.revision > previous.revision || (entry.revision === previous.revision && entry.queuedAt > previous.queuedAt)) {
      newestByKey.set(target, entry);
    }
  }
  const canonicalOutbox = [...newestByKey.values()].sort((left, right) => left.queuedAt - right.queuedAt);
  const canonicalIds = new Set(canonicalOutbox.map(entry => entry.id));
  // Coalesced rows are obsolete regardless of whether the newest write
  // succeeds.  Keeping them in the persisted outbox makes the next flush try
  // an older revision after the canonical row has already been reconciled,
  // which can falsely look like a cloud conflict and detach the active slot.
  completed.push(...outbox.filter(entry => !canonicalIds.has(entry.id)).map(entry => entry.id));
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
