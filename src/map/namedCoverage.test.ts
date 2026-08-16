// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildRoadSegmentGeometry, nearestRoadWaypoint, snapToRoadWaypoint, ROAD_GEOMETRY_COVERAGE } from './roadGeometry';

type NamedLocation = {
  id: string;
  label: string;
  x: number;
  y: number;
  neighbors: string[];
};

const loadNamedLocations = (): Record<string, NamedLocation> => {
  const source = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');
  const block = source.match(/const MAP_LOCATIONS: Record<string, MapLocationNode> = \{([\s\S]*?)\n\};/)?.[1] || '';
  const locations: Record<string, NamedLocation> = {};
  const entryPattern = /([a-z0-9_]+):\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = entryPattern.exec(block))) {
    const id = match[1];
    const body = match[2];
    const labelMatch = body.match(/label:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/);
    const xMatch = body.match(/x:\s*([0-9.]+)/);
    const yMatch = body.match(/y:\s*([0-9.]+)/);
    const neighborsMatch = body.match(/neighbors:\s*\[([^\]]*)\]/);
    if (!labelMatch || !xMatch || !yMatch || !neighborsMatch) continue;
    locations[id] = {
      id,
      label: labelMatch[1] || labelMatch[2] || id,
      x: Number(xMatch[1]),
      y: Number(yMatch[1]),
      neighbors: (neighborsMatch[1].match(/'([^']+)'|"([^"]+)"/g) || []).map(token => token.slice(1, -1))
    };
  }
  return locations;
};

const namedConnections = () => {
  const locations = loadNamedLocations();
  const seen = new Set<string>();
  return Object.values(locations).flatMap(from => from.neighbors.flatMap(toId => {
    const to = locations[toId];
    if (!to) return [];
    const key = from.id < to.id ? `${from.id}|${to.id}` : `${to.id}|${from.id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const snapFrom = nearestRoadWaypoint(from.x, from.y);
    const snapTo = nearestRoadWaypoint(to.x, to.y);
    const segment = buildRoadSegmentGeometry(
      { id: from.id, x: from.x, y: from.y },
      { id: to.id, x: to.x, y: to.y }
    );
    return [{
      from: from.id,
      to: to.id,
      fromLabel: from.label,
      toLabel: to.label,
      mapped: segment.mapped && segment.points.length >= 2,
      snapFrom: snapFrom ? Number(snapFrom.distance.toFixed(3)) : null,
      snapTo: snapTo ? Number(snapTo.distance.toFixed(3)) : null,
      points: segment.points.length
    }];
  })).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
};

describe('named connection coverage', () => {
  const rows = namedConnections();
  const unmapped = rows.filter(row => !row.mapped);

  it('recomputes named-neighbor mapping against current geometry', () => {
    expect(ROAD_GEOMETRY_COVERAGE.waypointEdges).toBeGreaterThan(500);
    expect(ROAD_GEOMETRY_COVERAGE.waypointNodes).toBeGreaterThan(400);
    expect(rows.length).toBeGreaterThan(80);
    expect(rows.filter(row => row.mapped).length).toBeGreaterThan(40);
  });

  it('prints the current unmapped named connections for classification', () => {
    const report = [
      `mapped ${rows.filter(row => row.mapped).length} / ${rows.length}`,
      ...unmapped.map(row =>
        `${row.from} → ${row.to} nearest ${row.snapFrom}/${row.snapTo} pts ${row.points}`
      )
    ];
    console.log(report.join('\n'));
    expect(report[0]).toMatch(/^mapped \d+ \/ \d+$/);
  });
});
