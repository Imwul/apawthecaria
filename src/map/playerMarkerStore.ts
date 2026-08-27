import { MAP_TERRAINS, type MapTerrain } from './mapGlyphTypes';

export type PlayerMarkerRecord = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind?: string;
  region?: string;
  terrainOptions?: MapTerrain[];
  updatedAt: number;
};

export const PLAYER_MARKER_STORAGE_KEY = 'apawthecaria.playerMarkers.v1';

const isRecord = (value: unknown): value is PlayerMarkerRecord => {
  if (!value || typeof value !== 'object') return false;
  const row = value as PlayerMarkerRecord;
  return typeof row.id === 'string'
    && typeof row.label === 'string'
    && Number.isFinite(row.x)
    && Number.isFinite(row.y)
    && (!('terrainOptions' in row) || (Array.isArray(row.terrainOptions)
      && row.terrainOptions.every(value => MAP_TERRAINS.includes(value as MapTerrain))));
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

export const removePlayerMarkerRecords = (ids: readonly string[]): PlayerMarkerRecord[] => {
  const banned = new Set(ids);
  const next = loadPlayerMarkers().filter(row => !banned.has(row.id));
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PLAYER_MARKER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Preference only; ignore quota / private-mode failures.
    }
  }
  return next;
};

export const upsertPlayerMarkerRecords = (records: readonly PlayerMarkerRecord[]): PlayerMarkerRecord[] => {
  const byId = new Map(loadPlayerMarkers().map(row => [row.id, row]));
  records.forEach(record => {
    if (!record.id) return;
    byId.set(record.id, {
      ...byId.get(record.id),
      ...record,
      terrainOptions: record.terrainOptions?.length
        ? [...new Set(record.terrainOptions.filter(value => MAP_TERRAINS.includes(value)))]
        : undefined,
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
