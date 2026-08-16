export type PlayerMarkerRecord = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind?: string;
  region?: string;
  updatedAt: number;
};

export const PLAYER_MARKER_STORAGE_KEY = 'apawthecaria.playerMarkers.v1';

const isRecord = (value: unknown): value is PlayerMarkerRecord => {
  if (!value || typeof value !== 'object') return false;
  const row = value as PlayerMarkerRecord;
  return typeof row.id === 'string'
    && typeof row.label === 'string'
    && Number.isFinite(row.x)
    && Number.isFinite(row.y);
};

export const loadPlayerMarkers = (): PlayerMarkerRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PLAYER_MARKER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
};

export const upsertPlayerMarkerRecords = (records: readonly PlayerMarkerRecord[]): PlayerMarkerRecord[] => {
  const byId = new Map(loadPlayerMarkers().map(row => [row.id, row]));
  records.forEach(record => {
    if (!record.id) return;
    byId.set(record.id, {
      ...byId.get(record.id),
      ...record,
      updatedAt: Date.now()
    });
  });
  const next = Array.from(byId.values());
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PLAYER_MARKER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Preference only; ignore quota / private-mode failures.
    }
  }
  return next;
};
