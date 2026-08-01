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

const stablePayload = (value: RevisionedSave) => JSON.stringify(value);

export const resolveRevisionConflict = <T extends RevisionedSave>(local: T | null, cloud: T | null) => {
  if (!local) return { source: 'cloud' as const, state: cloud, conflict: false };
  if (!cloud) return { source: 'local' as const, state: local, conflict: false };
  const localRevision = Number(local.saveRevision || 0);
  const cloudRevision = Number(cloud.saveRevision || 0);
  if (localRevision > cloudRevision) return { source: 'local' as const, state: local, conflict: false };
  if (cloudRevision > localRevision) return { source: 'cloud' as const, state: cloud, conflict: false };
  if (stablePayload(local) === stablePayload(cloud)) return { source: 'equal' as const, state: local, conflict: false };
  return { source: 'local' as const, state: local, conflict: true };
};

export const enqueueOfflineSave = (outbox: OfflineSaveEntry[], input: Omit<OfflineSaveEntry, 'attempts' | 'lastError'>): OfflineSaveEntry[] => {
  const withoutOlder = outbox.filter(row => row.key !== input.key || row.revision > input.revision);
  if (withoutOlder.some(row => row.key === input.key && row.revision === input.revision && row.payload === input.payload)) return withoutOlder;
  return [...withoutOlder, { ...input, attempts: 0, lastError: null }].sort((a, b) => a.queuedAt - b.queuedAt);
};

export const flushOfflineSaves = async (outbox: OfflineSaveEntry[], write: (entry: OfflineSaveEntry) => Promise<void>) => {
  const remaining: OfflineSaveEntry[] = [];
  const completed: string[] = [];
  for (const entry of outbox) {
    try {
      await write(entry);
      completed.push(entry.id);
    } catch (error) {
      remaining.push({ ...entry, attempts: entry.attempts + 1, lastError: error instanceof Error ? error.message : 'Cloud write failed' });
    }
  }
  return { remaining, completed };
};
