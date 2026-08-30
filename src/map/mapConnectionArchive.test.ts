import { describe, expect, it } from 'vitest';
import {
  findMapConnectionSnapshot,
  importMapConnectionSnapshot,
  mapConnectionFingerprint,
  normalizeArchivedMapEdges,
  publishMapConnectionSnapshot,
  recordMapConnectionSnapshot
} from './mapConnectionArchive';
import { createOfficialMapSnapshot, normalizeOfficialMapSnapshot, normalizeReferencedOfficialMapSnapshot } from './officialMap';

const edge = (from: string, to: string, kind: 'path' | 'river' | 'waterway' = 'path') => ({
  id: `${from}-${to}`,
  from,
  to,
  kind
});

describe('map connection archive', () => {
  it('deduplicates an undirected pair without changing its selected route kind', () => {
    const normalized = normalizeArchivedMapEdges([
      edge('a', 'b', 'path'),
      edge('b', 'a', 'waterway')
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({ from: 'b', to: 'a', kind: 'waterway' });
  });

  it('creates a new immutable version only when the connection content changes', () => {
    const first = recordMapConnectionSnapshot(null, [edge('a', 'b')], 'auto', 100);
    const same = recordMapConnectionSnapshot(first.archive, [edge('b', 'a')], 'auto', 200);
    const changed = recordMapConnectionSnapshot(same.archive, [edge('a', 'b', 'river')], 'auto', 300);

    expect(same.created).toBe(false);
    expect(same.archive.snapshots).toHaveLength(1);
    expect(changed.created).toBe(true);
    expect(changed.archive.snapshots).toHaveLength(2);
    expect(mapConnectionFingerprint(changed.snapshot.edges)).not.toBe(first.snapshot.fingerprint);
  });

  it('retains the explicitly published version while newer edits become active', () => {
    const first = recordMapConnectionSnapshot(null, [edge('a', 'b')], 'manual', 100);
    const published = publishMapConnectionSnapshot(first.archive, first.snapshot.id);
    const changed = recordMapConnectionSnapshot(published, [edge('a', 'c')], 'auto', 200);

    expect(changed.archive.activeSnapshotId).toBe(changed.snapshot.id);
    expect(changed.archive.publishedSnapshotId).toBe(first.snapshot.id);
    expect(findMapConnectionSnapshot(changed.archive, first.snapshot.id)?.edges[0]).toMatchObject({ from: 'a', to: 'b' });
  });

  it('imports an account snapshot without erasing local history', () => {
    const local = recordMapConnectionSnapshot(null, [edge('a', 'b')], 'auto', 100);
    const remote = recordMapConnectionSnapshot(null, [edge('x', 'y', 'river')], 'manual', 200);
    const merged = importMapConnectionSnapshot(local.archive, remote.snapshot, true);

    expect(merged.snapshots).toHaveLength(2);
    expect(merged.publishedSnapshotId).toBe(remote.snapshot.id);
  });
});

describe('official map snapshot', () => {
  it('stores corrected node positions and connections in one versioned payload', () => {
    const snapshot = createOfficialMapSnapshot({
      revision: 4,
      createdAt: 100,
      publishedBy: 'admin',
      locations: [{ id: 'odoak', label: 'Odoak', x: 51.25, y: 42.5, neighbors: [] }],
      edges: [edge('odoak', 'wild-1', 'waterway')]
    });
    const restored = normalizeOfficialMapSnapshot(JSON.parse(JSON.stringify(snapshot)));

    expect(restored).toMatchObject({ revision: 4, locationCount: 1, edgeCount: 1 });
    expect(restored?.locations[0]).toMatchObject({ id: 'odoak', x: 51.25, y: 42.5 });
    expect(restored?.edges[0].kind).toBe('waterway');
    expect(restored?.fingerprint).toBe(snapshot.fingerprint);
  });

  it('accepts a legacy embedded fingerprint when the cloud pointer and payload still agree', () => {
    const snapshot = createOfficialMapSnapshot({
      revision: 1,
      createdAt: 100,
      publishedBy: 'admin',
      locations: [{ id: 'odoak', label: 'Odoak', x: 51, y: 42, neighbors: [], terrainOptions: ['Forest'] }],
      edges: [edge('odoak', 'wild-1')]
    });
    const legacy = { ...snapshot, fingerprint: 'fnv1a-legacy' };

    expect(normalizeReferencedOfficialMapSnapshot(legacy, {
      snapshotId: snapshot.id,
      pointerFingerprint: 'fnv1a-legacy',
      payloadFingerprint: 'fnv1a-legacy'
    })?.id).toBe(snapshot.id);
  });

  it('rejects an official map whose cloud reference does not match either fingerprint', () => {
    const snapshot = createOfficialMapSnapshot({
      revision: 1,
      createdAt: 100,
      publishedBy: 'admin',
      locations: [{ id: 'odoak', label: 'Odoak', x: 51, y: 42, neighbors: [] }],
      edges: []
    });

    expect(normalizeReferencedOfficialMapSnapshot(snapshot, {
      snapshotId: snapshot.id,
      pointerFingerprint: 'fnv1a-wrong-pointer',
      payloadFingerprint: 'fnv1a-wrong-payload'
    })).toBeNull();
  });
});
