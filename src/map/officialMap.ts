import { mapConnectionFingerprint, normalizeArchivedMapEdges, type ArchivedMapEdge } from './mapConnectionArchive';
import { MAP_TERRAINS, type MapTerrain } from './mapGlyphTypes';

export interface OfficialMapLocation {
  id: string;
  label: string;
  x: number;
  y: number;
  region?: string;
  terrainOptions?: MapTerrain[];
  kind?: string;
  aliases?: string[];
  neighbors: string[];
  source?: string;
  createdAt?: number;
  hidden?: boolean;
}

export interface OfficialMapSnapshot {
  schemaVersion: 1;
  id: string;
  revision: number;
  createdAt: number;
  publishedBy: string;
  fingerprint: string;
  locationCount: number;
  edgeCount: number;
  locations: OfficialMapLocation[];
  edges: ArchivedMapEdge[];
}

export const OFFICIAL_MAP_CACHE_KEY = 'apawthecaria.official-map.v1';

export const normalizeOfficialMapLocations = (value: unknown): OfficialMapLocation[] => {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, OfficialMapLocation>();
  value.forEach(raw => {
    if (!raw || typeof raw !== 'object') return;
    const row = raw as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    const x = typeof row.x === 'number' && Number.isFinite(row.x) ? Math.max(0, Math.min(100, row.x)) : NaN;
    const y = typeof row.y === 'number' && Number.isFinite(row.y) ? Math.max(0, Math.min(100, row.y)) : NaN;
    if (!id || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const location: OfficialMapLocation = {
      id,
      label: typeof row.label === 'string' ? row.label.trim() : '',
      x,
      y,
      neighbors: Array.isArray(row.neighbors)
        ? Array.from(new Set(row.neighbors.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())).map(entry => entry.trim())))
        : []
    };
    if (typeof row.region === 'string' && row.region.trim()) location.region = row.region.trim();
    if (Array.isArray(row.terrainOptions)) {
      const terrainOptions = Array.from(new Set(
        row.terrainOptions.filter((entry): entry is MapTerrain => typeof entry === 'string' && MAP_TERRAINS.includes(entry as MapTerrain))
      ));
      if (terrainOptions.length > 0) location.terrainOptions = terrainOptions;
    }
    if (typeof row.kind === 'string' && row.kind.trim()) location.kind = row.kind.trim();
    if (Array.isArray(row.aliases)) {
      location.aliases = Array.from(new Set(row.aliases.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())).map(entry => entry.trim())));
    }
    if (typeof row.source === 'string' && row.source.trim()) location.source = row.source.trim();
    if (typeof row.createdAt === 'number' && Number.isFinite(row.createdAt)) location.createdAt = row.createdAt;
    if (row.hidden === true) location.hidden = true;
    byId.set(id, location);
  });
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
};

export const officialMapFingerprint = (locationsValue: unknown, edgesValue: unknown): string => {
  const locations = normalizeOfficialMapLocations(locationsValue).map(location => ({
    id: location.id,
    label: location.label,
    x: location.x,
    y: location.y,
    region: location.region || '',
    terrainOptions: [...(location.terrainOptions || [])].sort(),
    kind: location.kind || '',
    aliases: [...(location.aliases || [])].sort(),
    hidden: Boolean(location.hidden)
  }));
  const edgeFingerprint = mapConnectionFingerprint(edgesValue);
  const stable = `${JSON.stringify(locations)}|${edgeFingerprint}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const createOfficialMapSnapshot = ({
  id,
  revision,
  createdAt,
  publishedBy,
  locations: locationsValue,
  edges: edgesValue
}: {
  id?: string;
  revision: number;
  createdAt?: number;
  publishedBy: string;
  locations: unknown;
  edges: unknown;
}): OfficialMapSnapshot => {
  const locations = normalizeOfficialMapLocations(locationsValue);
  const edges = normalizeArchivedMapEdges(edgesValue);
  const fingerprint = officialMapFingerprint(locations, edges);
  const timestamp = createdAt || Date.now();
  return {
    schemaVersion: 1,
    id: id || `official-${timestamp}-${fingerprint.replace('fnv1a-', '')}`,
    revision: Math.max(1, Math.floor(revision)),
    createdAt: timestamp,
    publishedBy,
    fingerprint,
    locationCount: locations.length,
    edgeCount: edges.length,
    locations,
    edges
  };
};

export const normalizeOfficialMapSnapshot = (value: unknown): OfficialMapSnapshot | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.publishedBy !== 'string') return null;
  return createOfficialMapSnapshot({
    id: row.id,
    revision: typeof row.revision === 'number' ? row.revision : 1,
    createdAt: typeof row.createdAt === 'number' ? row.createdAt : Date.now(),
    publishedBy: row.publishedBy,
    locations: row.locations,
    edges: row.edges
  });
};

export const readOfficialMapCache = (storage: Pick<Storage, 'getItem'> = localStorage): OfficialMapSnapshot | null => {
  try {
    const raw = storage.getItem(OFFICIAL_MAP_CACHE_KEY);
    return raw ? normalizeOfficialMapSnapshot(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

export const writeOfficialMapCache = (
  snapshot: OfficialMapSnapshot,
  storage: Pick<Storage, 'setItem'> = localStorage
) => storage.setItem(OFFICIAL_MAP_CACHE_KEY, JSON.stringify(snapshot));
