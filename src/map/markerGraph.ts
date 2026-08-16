import { ROAD_NETWORK_WAYPOINT_GEOMETRIES } from '../data/roadNetworkGeometry';
import markerGraph from './detection/markerGraph.json';
import reviewedWaterCrossings from './detection/reviewedWaterCrossings.json';

export type MarkerKind = 'wild' | 'settlement' | 'city' | 'ruin' | 'barrow';
export type MarkerEdgeKind = 'path' | 'waterway';

export type MarkerNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  region: string;
  kind: MarkerKind;
  named: boolean;
};

export type MarkerEdge = {
  from: string;
  to: string;
  kind: MarkerEdgeKind;
  points: Array<[number, number]>;
};

type RoadPoint = [number, number];

const data = markerGraph as {
  coordinateSpace: string;
  imageSize: [number, number];
  method: string;
  markerCount: number;
  edgeCount: number;
  waterwayCount: number;
  markers: MarkerNode[];
  edges: MarkerEdge[];
};

export const MARKER_NODES: readonly MarkerNode[] = data.markers;
export const MARKER_BY_ID = new Map(MARKER_NODES.map(node => [node.id, node]));

const NAMED_MARKERS = MARKER_NODES.filter(node => node.named);
const WAYPOINT_ABSORB = 1.2;
const NAMED_ON_ROAD = 1.15;
const NAMED_RESCUE = 2.6;
const MIN_EDGE_LENGTH = 0.18;

const pairKey = (from: string, to: string) => (from < to ? `${from}|${to}` : `${to}|${from}`);
const waypointPairKey = (from: number, to: number) => (from < to ? `${from}:${to}` : `${to}:${from}`);

const WATERWAY_WAYPOINT_KEYS = new Set(
  (reviewedWaterCrossings.edges || []).map(edge => waypointPairKey(edge.from, edge.to))
);

const WAYPOINT_POSITIONS: Array<RoadPoint | undefined> = [];
for (const edge of ROAD_NETWORK_WAYPOINT_GEOMETRIES) {
  if (edge.points.length < 2) continue;
  if (!WAYPOINT_POSITIONS[edge.from]) WAYPOINT_POSITIONS[edge.from] = edge.points[0];
  if (!WAYPOINT_POSITIONS[edge.to]) WAYPOINT_POSITIONS[edge.to] = edge.points[edge.points.length - 1];
}

const namedAtWaypoint = (index: number): string | null => {
  const position = WAYPOINT_POSITIONS[index];
  if (!position) return null;
  let bestId: string | null = null;
  let best = WAYPOINT_ABSORB;
  for (const marker of NAMED_MARKERS) {
    const distance = Math.hypot(marker.x - position[0], marker.y - position[1]);
    if (distance < best) {
      best = distance;
      bestId = marker.id;
    }
  }
  return bestId;
};

const idForWaypoint = (index: number): string | null => {
  const locId = `loc_${index}`;
  if (MARKER_BY_ID.has(locId)) return locId;
  return namedAtWaypoint(index);
};

const polylineLength = (points: RoadPoint[]) => {
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  }
  return total;
};

const projectOnPolyline = (points: RoadPoint[], x: number, y: number) => {
  let best = { distance: Number.POSITIVE_INFINITY, along: 0, index: 0, x, y };
  let walked = 0;
  for (let index = 0; index < points.length - 1; index++) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const span = dx * dx + dy * dy;
    const t = span === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / span));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const distance = Math.hypot(x - px, y - py);
    if (distance < best.distance) {
      best = { distance, along: walked + Math.hypot(px - x1, py - y1), index, x: px, y: py };
    }
    walked += Math.hypot(dx, dy);
  }
  return best;
};

const slicePolyline = (points: RoadPoint[], startAlong: number, endAlong: number): RoadPoint[] => {
  if (points.length < 2) return [];
  const lo = Math.min(startAlong, endAlong);
  const hi = Math.max(startAlong, endAlong);
  const sliced: RoadPoint[] = [];
  let walked = 0;
  const push = (point: RoadPoint) => {
    const last = sliced[sliced.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) sliced.push(point);
  };
  for (let index = 0; index < points.length - 1; index++) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const next = walked + length;
    if (next < lo - 1e-6 || walked > hi + 1e-6) {
      walked = next;
      continue;
    }
    if (walked <= lo && lo <= next && length > 0) {
      const t = (lo - walked) / length;
      push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    } else if (walked >= lo && walked <= hi) {
      push([x1, y1]);
    }
    if (walked <= hi && hi <= next && length > 0) {
      const t = (hi - walked) / length;
      push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
    walked = next;
  }
  if (sliced.length < 2) return [];
  return startAlong <= endAlong ? sliced : [...sliced].reverse();
};

const bboxOf = (points: RoadPoint[], pad: number) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
};

type RoadHit = { id: string; along: number; distance: number };

const collectRoadHits = (
  road: (typeof ROAD_NETWORK_WAYPOINT_GEOMETRIES)[number],
  extras: readonly MarkerNode[],
  snap: number
): { points: RoadPoint[]; kind: MarkerEdgeKind; hits: RoadHit[] } | null => {
  const points = road.points as RoadPoint[];
  if (points.length < 2) return null;
  const fromId = idForWaypoint(road.from);
  const toId = idForWaypoint(road.to);
  if (!fromId && !toId) return null;
  const total = polylineLength(points);
  if (total <= 0) return null;
  const kind: MarkerEdgeKind = WATERWAY_WAYPOINT_KEYS.has(waypointPairKey(road.from, road.to))
    ? 'waterway'
    : 'path';
  const hits: RoadHit[] = [];
  if (fromId) hits.push({ id: fromId, along: 0, distance: 0 });
  if (toId) hits.push({ id: toId, along: total, distance: 0 });
  const box = bboxOf(points, snap);
  for (const marker of extras) {
    if (marker.x < box.minX || marker.x > box.maxX || marker.y < box.minY || marker.y > box.maxY) continue;
    const projection = projectOnPolyline(points, marker.x, marker.y);
    if (projection.distance > snap) continue;
    hits.push({ id: marker.id, along: projection.along, distance: projection.distance });
  }
  return { points, kind, hits };
};

const commitRoadHits = (
  built: Map<string, MarkerEdge>,
  points: RoadPoint[],
  kind: MarkerEdgeKind,
  hits: RoadHit[]
) => {
  const bestById = new Map<string, RoadHit>();
  for (const hit of hits) {
    const previous = bestById.get(hit.id);
    if (!previous || hit.distance < previous.distance) bestById.set(hit.id, hit);
  }
  const ordered = [...bestById.values()].sort((left, right) => left.along - right.along || left.id.localeCompare(right.id));
  for (let index = 0; index < ordered.length - 1; index++) {
    const start = ordered[index];
    const end = ordered[index + 1];
    if (start.id === end.id) continue;
    if (end.along - start.along < MIN_EDGE_LENGTH) continue;
    const slice = slicePolyline(points, start.along, end.along);
    if (slice.length < 2) continue;
    const key = pairKey(start.id, end.id);
    const next: MarkerEdge = { from: start.id, to: end.id, kind, points: slice };
    const existing = built.get(key);
    if (!existing || polylineLength(slice) < polylineLength(existing.points)) built.set(key, next);
  }
};

const connectedNamedIds = (edges: Iterable<MarkerEdge>) => {
  const connected = new Set<string>();
  for (const edge of edges) {
    if (MARKER_BY_ID.get(edge.from)?.named) connected.add(edge.from);
    if (MARKER_BY_ID.get(edge.to)?.named) connected.add(edge.to);
  }
  return connected;
};

const buildTracedMarkerEdges = (): MarkerEdge[] => {
  const roadHits: Array<NonNullable<ReturnType<typeof collectRoadHits>>> = [];
  for (const road of ROAD_NETWORK_WAYPOINT_GEOMETRIES) {
    const collected = collectRoadHits(road, NAMED_MARKERS, NAMED_ON_ROAD);
    if (collected) roadHits.push(collected);
  }

  const preview = new Map<string, MarkerEdge>();
  for (const collected of roadHits) commitRoadHits(preview, collected.points, collected.kind, collected.hits);
  const attached = connectedNamedIds(preview.values());

  for (const marker of NAMED_MARKERS) {
    if (attached.has(marker.id)) continue;
    let best: { collected: (typeof roadHits)[number]; distance: number; along: number } | null = null;
    for (const collected of roadHits) {
      const projection = projectOnPolyline(collected.points, marker.x, marker.y);
      if (!best || projection.distance < best.distance) {
        best = { collected, distance: projection.distance, along: projection.along };
      }
    }
    if (!best || best.distance > NAMED_RESCUE) continue;
    best.collected.hits.push({ id: marker.id, along: best.along, distance: best.distance });
    attached.add(marker.id);
  }

  const built = new Map<string, MarkerEdge>();
  for (const collected of roadHits) commitRoadHits(built, collected.points, collected.kind, collected.hits);
  return [...built.values()];
};

export const MARKER_EDGES: readonly MarkerEdge[] = buildTracedMarkerEdges();

const EDGE_BY_PAIR = new Map<string, MarkerEdge>();
const NEIGHBORS = new Map<string, string[]>();

for (const edge of MARKER_EDGES) {
  EDGE_BY_PAIR.set(pairKey(edge.from, edge.to), edge);
  const from = NEIGHBORS.get(edge.from) || [];
  const to = NEIGHBORS.get(edge.to) || [];
  from.push(edge.to);
  to.push(edge.from);
  NEIGHBORS.set(edge.from, from);
  NEIGHBORS.set(edge.to, to);
}

export const MARKER_GRAPH_COVERAGE = {
  method: 'markers-on-traced-roads',
  coordinateSpace: data.coordinateSpace,
  imageSize: data.imageSize,
  markers: MARKER_NODES.length,
  edges: MARKER_EDGES.length,
  waterways: MARKER_EDGES.filter(edge => edge.kind === 'waterway').length
};

export const listMarkerNeighbors = (id: string): readonly string[] => NEIGHBORS.get(id) || [];

export const getMarkerEdge = (from: string, to: string): MarkerEdge | null =>
  EDGE_BY_PAIR.get(pairKey(from, to)) || null;

export const shortestMarkerHopPath = (from: string, to: string): string[] => {
  if (from === to) return [from];
  if (!NEIGHBORS.has(from) || !NEIGHBORS.has(to)) return [];
  const queue = [from];
  const prev = new Map<string, string | null>([[from, null]]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) break;
    for (const next of NEIGHBORS.get(current) || []) {
      if (prev.has(next)) continue;
      prev.set(next, current);
      queue.push(next);
    }
  }
  if (!prev.has(to)) return [];
  const path = [to];
  while (path[0] !== from) {
    const parent = prev.get(path[0]);
    if (!parent) return [];
    path.unshift(parent);
  }
  return path;
};

export const markerPathPoints = (from: string, to: string): Array<[number, number]> => {
  const hops = shortestMarkerHopPath(from, to);
  if (hops.length < 2) return [];
  const points: Array<[number, number]> = [];
  for (let index = 0; index < hops.length - 1; index++) {
    const edge = getMarkerEdge(hops[index], hops[index + 1]);
    if (!edge || edge.points.length < 2) return [];
    const reversed = hops[index] !== edge.from && hops[index] === edge.to;
    const ordered = reversed ? [...edge.points].reverse() : edge.points.map(([x, y]) => [x, y] as [number, number]);
    if (points.length > 0) ordered.shift();
    points.push(...ordered);
  }
  return points;
};

export const markerPathUsesWaterway = (from: string, to: string): boolean => {
  const hops = shortestMarkerHopPath(from, to);
  for (let index = 0; index < hops.length - 1; index++) {
    if (getMarkerEdge(hops[index], hops[index + 1])?.kind === 'waterway') return true;
  }
  return false;
};

export const markerEdgeKind = (from: string, to: string): MarkerEdgeKind =>
  getMarkerEdge(from, to)?.kind
  || (markerPathUsesWaterway(from, to) ? 'waterway' : 'path');
