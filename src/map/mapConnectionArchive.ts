export type ArchivedMapEdgeKind = 'path' | 'river' | 'waterway';

export interface ArchivedMapEdge {
  id: string;
  from: string;
  to: string;
  kind: ArchivedMapEdgeKind;
  label?: string;
  createdAt?: number;
}

export type MapConnectionSnapshotSource = 'auto' | 'manual' | 'restore' | 'import';

export interface MapConnectionSnapshot {
  id: string;
  createdAt: number;
  fingerprint: string;
  edgeCount: number;
  edges: ArchivedMapEdge[];
  source: MapConnectionSnapshotSource;
}

export type MapConnectionSnapshotMeta = Omit<MapConnectionSnapshot, 'edges'>;

export interface MapConnectionArchive {
  schemaVersion: 1;
  activeSnapshotId: string | null;
  publishedSnapshotId: string | null;
  snapshots: MapConnectionSnapshot[];
}

export const MAP_CONNECTION_ARCHIVE_SCHEMA_VERSION = 1 as const;
export const MAP_CONNECTION_ARCHIVE_STORAGE_KEY = 'apawthecaria.map-connections.v1';

const LOCAL_SNAPSHOT_LIMIT = 30;

const emptyArchive = (): MapConnectionArchive => ({
  schemaVersion: MAP_CONNECTION_ARCHIVE_SCHEMA_VERSION,
  activeSnapshotId: null,
  publishedSnapshotId: null,
  snapshots: []
});

const kindFromUnknown = (value: unknown): ArchivedMapEdgeKind =>
  value === 'river' || value === 'waterway' ? value : 'path';

const sourceFromUnknown = (value: unknown): MapConnectionSnapshotSource =>
  value === 'manual' || value === 'restore' || value === 'import' ? value : 'auto';

const edgePairKey = (from: string, to: string) => from < to ? `${from}\u0000${to}` : `${to}\u0000${from}`;

export const normalizeArchivedMapEdges = (value: unknown): ArchivedMapEdge[] => {
  if (!Array.isArray(value)) return [];
  const byPair = new Map<string, ArchivedMapEdge>();
  value.forEach(raw => {
    if (!raw || typeof raw !== 'object') return;
    const row = raw as Record<string, unknown>;
    const from = typeof row.from === 'string' ? row.from.trim() : '';
    const to = typeof row.to === 'string' ? row.to.trim() : '';
    if (!from || !to || from === to) return;
    const key = edgePairKey(from, to);
    const [left, right] = from < to ? [from, to] : [to, from];
    const edge: ArchivedMapEdge = {
      id: typeof row.id === 'string' && row.id.trim() ? row.id.trim() : `map_edge_${left}_${right}`,
      from,
      to,
      kind: kindFromUnknown(row.kind)
    };
    if (typeof row.label === 'string' && row.label.trim()) edge.label = row.label.trim();
    if (typeof row.createdAt === 'number' && Number.isFinite(row.createdAt)) edge.createdAt = row.createdAt;
    byPair.set(key, edge);
  });
  return [...byPair.values()].sort((a, b) => {
    const pair = edgePairKey(a.from, a.to).localeCompare(edgePairKey(b.from, b.to));
    return pair || a.kind.localeCompare(b.kind);
  });
};

export const mapConnectionFingerprint = (edges: unknown): string => {
  const stable = normalizeArchivedMapEdges(edges)
    .map(edge => `${edgePairKey(edge.from, edge.to)}\u0000${edge.kind}`)
    .join('\u0001');
  let hash = 0x811c9dc5;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const mapConnectionSnapshotMeta = (snapshot: MapConnectionSnapshot): MapConnectionSnapshotMeta => ({
  id: snapshot.id,
  createdAt: snapshot.createdAt,
  fingerprint: snapshot.fingerprint,
  edgeCount: snapshot.edgeCount,
  source: snapshot.source
});

export const normalizeMapConnectionSnapshot = (value: unknown): MapConnectionSnapshot | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const edges = normalizeArchivedMapEdges(row.edges);
  const fingerprint = mapConnectionFingerprint(edges);
  const createdAt = typeof row.createdAt === 'number' && Number.isFinite(row.createdAt) ? row.createdAt : Date.now();
  const id = typeof row.id === 'string' && row.id.trim()
    ? row.id.trim()
    : `map-${createdAt}-${fingerprint.replace('fnv1a-', '')}`;
  return {
    id,
    createdAt,
    fingerprint,
    edgeCount: edges.length,
    edges,
    source: sourceFromUnknown(row.source)
  };
};

const retainImportantSnapshots = (snapshots: MapConnectionSnapshot[], archive: Pick<MapConnectionArchive, 'activeSnapshotId' | 'publishedSnapshotId'>) => {
  const important = new Set([archive.activeSnapshotId, archive.publishedSnapshotId].filter((id): id is string => Boolean(id)));
  const kept = snapshots.slice(0, LOCAL_SNAPSHOT_LIMIT);
  snapshots.forEach(snapshot => {
    if (important.has(snapshot.id) && !kept.some(row => row.id === snapshot.id)) kept.push(snapshot);
  });
  return kept;
};

export const normalizeMapConnectionArchive = (value: unknown): MapConnectionArchive => {
  if (!value || typeof value !== 'object') return emptyArchive();
  const row = value as Record<string, unknown>;
  const snapshots = Array.isArray(row.snapshots)
    ? row.snapshots.flatMap(snapshot => {
      const normalized = normalizeMapConnectionSnapshot(snapshot);
      return normalized ? [normalized] : [];
    })
    : [];
  const byId = new Map(snapshots.map(snapshot => [snapshot.id, snapshot]));
  const sorted = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  const activeSnapshotId = typeof row.activeSnapshotId === 'string' && byId.has(row.activeSnapshotId)
    ? row.activeSnapshotId
    : sorted[0]?.id || null;
  const publishedSnapshotId = typeof row.publishedSnapshotId === 'string' && byId.has(row.publishedSnapshotId)
    ? row.publishedSnapshotId
    : null;
  const archive: MapConnectionArchive = {
    schemaVersion: MAP_CONNECTION_ARCHIVE_SCHEMA_VERSION,
    activeSnapshotId,
    publishedSnapshotId,
    snapshots: sorted
  };
  archive.snapshots = retainImportantSnapshots(sorted, archive);
  return archive;
};

export const readMapConnectionArchive = (storage: Pick<Storage, 'getItem'> = localStorage): MapConnectionArchive => {
  try {
    const raw = storage.getItem(MAP_CONNECTION_ARCHIVE_STORAGE_KEY);
    return raw ? normalizeMapConnectionArchive(JSON.parse(raw)) : emptyArchive();
  } catch {
    return emptyArchive();
  }
};

export const writeMapConnectionArchive = (
  archive: MapConnectionArchive,
  storage: Pick<Storage, 'setItem'> = localStorage
) => storage.setItem(MAP_CONNECTION_ARCHIVE_STORAGE_KEY, JSON.stringify(normalizeMapConnectionArchive(archive)));

export const findMapConnectionSnapshot = (archive: MapConnectionArchive, id: string | null | undefined) =>
  id ? archive.snapshots.find(snapshot => snapshot.id === id) || null : null;

export const recordMapConnectionSnapshot = (
  archiveValue: unknown,
  edgesValue: unknown,
  source: MapConnectionSnapshotSource,
  now = Date.now()
): { archive: MapConnectionArchive; snapshot: MapConnectionSnapshot; created: boolean } => {
  const archive = normalizeMapConnectionArchive(archiveValue);
  const edges = normalizeArchivedMapEdges(edgesValue);
  const fingerprint = mapConnectionFingerprint(edges);
  const existing = archive.snapshots.find(snapshot => snapshot.fingerprint === fingerprint);
  if (existing) {
    return {
      archive: { ...archive, activeSnapshotId: existing.id },
      snapshot: existing,
      created: false
    };
  }
  const snapshot: MapConnectionSnapshot = {
    id: `map-${now}-${fingerprint.replace('fnv1a-', '')}`,
    createdAt: now,
    fingerprint,
    edgeCount: edges.length,
    edges,
    source
  };
  const next = {
    ...archive,
    activeSnapshotId: snapshot.id,
    snapshots: [snapshot, ...archive.snapshots]
  };
  return {
    archive: { ...next, snapshots: retainImportantSnapshots(next.snapshots, next) },
    snapshot,
    created: true
  };
};

export const publishMapConnectionSnapshot = (archiveValue: unknown, snapshotId: string): MapConnectionArchive => {
  const archive = normalizeMapConnectionArchive(archiveValue);
  if (!archive.snapshots.some(snapshot => snapshot.id === snapshotId)) return archive;
  return { ...archive, activeSnapshotId: snapshotId, publishedSnapshotId: snapshotId };
};

export const importMapConnectionSnapshot = (
  archiveValue: unknown,
  snapshotValue: unknown,
  publish = false
): MapConnectionArchive => {
  const archive = normalizeMapConnectionArchive(archiveValue);
  const snapshot = normalizeMapConnectionSnapshot(snapshotValue);
  if (!snapshot) return archive;
  const snapshots = [snapshot, ...archive.snapshots.filter(row => row.id !== snapshot.id)]
    .sort((a, b) => b.createdAt - a.createdAt);
  const next = {
    ...archive,
    activeSnapshotId: snapshot.id,
    publishedSnapshotId: publish ? snapshot.id : archive.publishedSnapshotId,
    snapshots
  };
  return { ...next, snapshots: retainImportantSnapshots(snapshots, next) };
};
