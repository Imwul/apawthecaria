import {
  ROAD_NETWORK_WAYPOINT_GEOMETRIES,
  ROAD_NETWORK_WAYPOINT_GEOMETRY_META
} from '../data/roadNetworkGeometry';
import mapDetectionSummary from './detection/mapDetectionSummary.json';
import reviewedWaterCrossings from './detection/reviewedWaterCrossings.json';

export type RoadPoint = [number, number];
export type RoadRouteKind = 'road' | 'waterway';

export type RoadRouteSegment = {
  id: string;
  from: string;
  to: string;
  points: RoadPoint[];
  mapped: boolean;
  kind: RoadRouteKind;
};

export type RoadRouteGeometry = {
  segments: RoadRouteSegment[];
  missingPairs: Array<{ from: string; to: string }>;
  total: number;
};

export type RoadAnchor = {
  x: number;
  y: number;
  id?: string;
};

const SNAP_DISTANCE_MAX = ROAD_NETWORK_WAYPOINT_GEOMETRY_META.snapDistanceMax;
const NAMED_LOCATION_SNAP_MAX = Math.max(SNAP_DISTANCE_MAX, 3);
const UNSAFE_ROAD_KEYS = new Set(
  (mapDetectionSummary.lowConfidenceEdges || []).map(edge =>
    edge.from < edge.to ? `${edge.from}:${edge.to}` : `${edge.to}:${edge.from}`
  )
);
const WATERWAY_KEYS = new Set(
  (reviewedWaterCrossings.edges || []).map(edge =>
    edge.from < edge.to ? `${edge.from}:${edge.to}` : `${edge.to}:${edge.from}`
  )
);

const waypointKey = (from: number, to: number) => `${from}:${to}`;

const pairKey = (from: number, to: number) => (from < to ? waypointKey(from, to) : waypointKey(to, from));

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

const polylineLength = (points: RoadPoint[]) => {
  if (points.length < 2) return 0;
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  }
  return total;
};

const WAYPOINT_COUNT = ROAD_NETWORK_WAYPOINT_GEOMETRY_META.count > 0
  ? Math.max(...ROAD_NETWORK_WAYPOINT_GEOMETRIES.flatMap(edge => [edge.from, edge.to])) + 1
  : 0;

const WAYPOINT_POSITIONS: Array<{ x: number; y: number }> = Array.from({ length: WAYPOINT_COUNT }, () => ({ x: Number.NaN, y: Number.NaN }));
const GEOMETRY_BY_KEY = new Map<string, RoadPoint[]>();
const WAYPOINT_GRAPH: Array<Array<{ to: number; distance: number }>> = Array.from({ length: WAYPOINT_COUNT }, () => []);
const WATERWAY_GRAPH: Array<Array<{ to: number; distance: number }>> = Array.from({ length: WAYPOINT_COUNT }, () => []);

const seenEdges = new Set<string>();
for (const edge of ROAD_NETWORK_WAYPOINT_GEOMETRIES) {
  const points = edge.points.map(([x, y]) => [x, y] as RoadPoint);
  if (points.length < 2) continue;

  const key = pairKey(edge.from, edge.to);
  if (seenEdges.has(key)) continue;
  seenEdges.add(key);

  const forward = points;
  const reverse = [...points].reverse();
  GEOMETRY_BY_KEY.set(waypointKey(edge.from, edge.to), forward);
  GEOMETRY_BY_KEY.set(waypointKey(edge.to, edge.from), reverse);

  if (!Number.isFinite(WAYPOINT_POSITIONS[edge.from].x)) {
    WAYPOINT_POSITIONS[edge.from] = { x: forward[0][0], y: forward[0][1] };
  }
  if (!Number.isFinite(WAYPOINT_POSITIONS[edge.to].x)) {
    WAYPOINT_POSITIONS[edge.to] = { x: forward[forward.length - 1][0], y: forward[forward.length - 1][1] };
  }

  const length = polylineLength(forward);
  if (!Number.isFinite(length) || length <= 0) continue;
  const hop = { to: edge.to, distance: length };
  const back = { to: edge.from, distance: length };
  if (WATERWAY_KEYS.has(key)) {
    WATERWAY_GRAPH[edge.from].push(hop);
    WATERWAY_GRAPH[edge.to].push(back);
    continue;
  }
  WAYPOINT_GRAPH[edge.from].push(hop);
  WAYPOINT_GRAPH[edge.to].push(back);
}

const LAND_PATH_CACHE = new Map<string, number[]>();
const COMBINED_PATH_CACHE = new Map<string, number[]>();

const shortestWaypointPath = (
  from: number,
  to: number,
  graph: Array<Array<{ to: number; distance: number }>>,
  cache: Map<string, number[]>
): number[] => {
  if (from === to) return [from];
  const cacheKey = waypointKey(from, to);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const dist = Array(WAYPOINT_COUNT).fill(Infinity);
  const prev = Array(WAYPOINT_COUNT).fill(-1);
  const visited = Array(WAYPOINT_COUNT).fill(false);
  dist[from] = 0;

  for (let step = 0; step < WAYPOINT_COUNT; step++) {
    let current = -1;
    let best = Infinity;
    for (let index = 0; index < WAYPOINT_COUNT; index++) {
      if (visited[index] || dist[index] >= best) continue;
      best = dist[index];
      current = index;
    }
    if (current === -1 || current === to) break;
    visited[current] = true;
    for (const edge of graph[current]) {
      const next = dist[current] + edge.distance;
      if (next < dist[edge.to]) {
        dist[edge.to] = next;
        prev[edge.to] = current;
      }
    }
  }

  if (!Number.isFinite(dist[to])) {
    cache.set(cacheKey, []);
    return [];
  }

  const path: number[] = [];
  let cursor = to;
  while (cursor !== -1) {
    path.unshift(cursor);
    if (cursor === from) break;
    cursor = prev[cursor];
  }
  if (path[0] !== from) {
    cache.set(cacheKey, []);
    return [];
  }

  cache.set(cacheKey, path);
  return path;
};

const COMBINED_GRAPH: Array<Array<{ to: number; distance: number }>> = Array.from({ length: WAYPOINT_COUNT }, (_, index) => [
  ...WAYPOINT_GRAPH[index],
  ...WATERWAY_GRAPH[index]
]);

const pathUsesWaterway = (path: number[]) => {
  for (let index = 0; index < path.length - 1; index++) {
    if (WATERWAY_KEYS.has(pairKey(path[index], path[index + 1]))) return true;
  }
  return false;
};

const geometryForWaypointPath = (path: number[]): RoadPoint[] => {
  if (path.length === 0) return [];
  if (path.length === 1) {
    const point = WAYPOINT_POSITIONS[path[0]];
    return Number.isFinite(point.x) ? [[point.x, point.y]] : [];
  }

  const points: RoadPoint[] = [];
  for (let index = 0; index < path.length - 1; index++) {
    const segment = GEOMETRY_BY_KEY.get(waypointKey(path[index], path[index + 1]));
    if (!segment || segment.length < 2) return [];
    if (points.length === 0) {
      points.push(...segment);
      continue;
    }
    const tail = points[points.length - 1];
    const head = segment[0];
    if (tail[0] === head[0] && tail[1] === head[1]) points.push(...segment.slice(1));
    else points.push(...segment);
  }
  return points;
};

export const nearestRoadWaypoint = (x: number, y: number) => {
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let index = 0; index < WAYPOINT_POSITIONS.length; index++) {
    const point = WAYPOINT_POSITIONS[index];
    if (!Number.isFinite(point.x)) continue;
    const next = distance({ x, y }, point);
    if (next < bestDistance) {
      bestDistance = next;
      bestIndex = index;
    }
  }
  if (bestIndex < 0) return null;
  return { index: bestIndex, distance: bestDistance, ...WAYPOINT_POSITIONS[bestIndex] };
};

export const snapToRoadWaypoint = (x: number, y: number, maxDistance = NAMED_LOCATION_SNAP_MAX) => {
  const nearest = nearestRoadWaypoint(x, y);
  if (!nearest || nearest.distance > maxDistance) return null;
  return nearest;
};

export const buildRoadSegmentGeometry = (from: RoadAnchor, to: RoadAnchor): RoadRouteSegment => {
  const id = `${from.id || `${from.x},${from.y}`}->${to.id || `${to.x},${to.y}`}`;
  const empty = (kind: RoadRouteKind = 'road'): RoadRouteSegment => ({
    id, from: from.id || '', to: to.id || '', points: [], mapped: false, kind
  });
  if (from.id && to.id && from.id === to.id) {
    return { id, from: from.id, to: to.id, points: [[from.x, from.y]], mapped: true, kind: 'road' };
  }

  const start = snapToRoadWaypoint(from.x, from.y);
  const end = snapToRoadWaypoint(to.x, to.y);
  if (!start || !end) return empty();

  const landPath = shortestWaypointPath(start.index, end.index, WAYPOINT_GRAPH, LAND_PATH_CACHE);
  const landPoints = geometryForWaypointPath(landPath);
  if (landPoints.length >= 2) {
    return { id, from: from.id || '', to: to.id || '', points: landPoints, mapped: true, kind: 'road' };
  }

  const waterPath = shortestWaypointPath(start.index, end.index, COMBINED_GRAPH, COMBINED_PATH_CACHE);
  const waterPoints = geometryForWaypointPath(waterPath);
  if (waterPoints.length >= 2 && pathUsesWaterway(waterPath)) {
    return { id, from: from.id || '', to: to.id || '', points: waterPoints, mapped: true, kind: 'waterway' };
  }

  return empty();
};

export const buildRoadRouteGeometry = (stops: RoadAnchor[]): RoadRouteGeometry => {
  if (stops.length < 2) {
    return { segments: [], missingPairs: [], total: 0 };
  }

  const segments: RoadRouteSegment[] = [];
  const missingPairs: Array<{ from: string; to: string }> = [];
  for (let index = 0; index < stops.length - 1; index++) {
    const from = stops[index];
    const to = stops[index + 1];
    const segment = buildRoadSegmentGeometry(from, to);
    if (segment.mapped && segment.points.length >= 2) {
      segments.push(segment);
    } else {
      missingPairs.push({ from: from.id || `${from.x},${from.y}`, to: to.id || `${to.x},${to.y}` });
    }
  }

  return {
    segments,
    missingPairs,
    total: stops.length - 1
  };
};

export const pointsToPolyString = (points: RoadPoint[]) => points.map(([x, y]) => `${x},${y}`).join(' ');

export const reverseRoadPoints = (points: RoadPoint[]): RoadPoint[] => [...points].reverse();

export const routeJoinGaps = (segments: RoadRouteSegment[]): number[] => {
  const gaps: number[] = [];
  for (let index = 1; index < segments.length; index++) {
    const previous = segments[index - 1].points;
    const next = segments[index].points;
    if (previous.length === 0 || next.length === 0) {
      gaps.push(Number.POSITIVE_INFINITY);
      continue;
    }
    const tail = previous[previous.length - 1];
    const head = next[0];
    gaps.push(Math.hypot(tail[0] - head[0], tail[1] - head[1]));
  }
  return gaps;
};

const collectPolylines = (filter?: 'aligned' | 'unsafe' | 'waterway' | 'land'): RoadPoint[][] => {
  const seen = new Set<string>();
  const lines: RoadPoint[][] = [];
  for (const [key, points] of GEOMETRY_BY_KEY) {
    const [from, to] = key.split(':').map(Number);
    const undirected = pairKey(from, to);
    if (seen.has(undirected) || points.length < 2) continue;
    if (filter === 'waterway' && !WATERWAY_KEYS.has(undirected)) continue;
    if (filter === 'land' && WATERWAY_KEYS.has(undirected)) continue;
    if (filter === 'aligned' && (UNSAFE_ROAD_KEYS.has(undirected) || WATERWAY_KEYS.has(undirected))) continue;
    if (filter === 'unsafe' && !UNSAFE_ROAD_KEYS.has(undirected)) continue;
    seen.add(undirected);
    lines.push(points);
  }
  return lines;
};

const TRACED_ROAD_POLYLINES = collectPolylines('land');
const ALIGNED_ROAD_POLYLINES = collectPolylines('aligned');
const UNSAFE_ROAD_POLYLINES = collectPolylines('unsafe');
const WATERWAY_POLYLINES = collectPolylines('waterway');

export const listTracedRoadPolylines = (): readonly RoadPoint[][] => TRACED_ROAD_POLYLINES;
export const listAlignedRoadPolylines = (): readonly RoadPoint[][] => ALIGNED_ROAD_POLYLINES;
export const listUnsafeRoadPolylines = (): readonly RoadPoint[][] => UNSAFE_ROAD_POLYLINES;
export const listWaterwayPolylines = (): readonly RoadPoint[][] => WATERWAY_POLYLINES;
export const isUnsafeRoadPair = (from: number, to: number) => UNSAFE_ROAD_KEYS.has(pairKey(from, to));
export const isReviewedWaterwayPair = (from: number, to: number) => WATERWAY_KEYS.has(pairKey(from, to));

export const ROAD_GEOMETRY_COVERAGE = {
  waypointEdges: seenEdges.size,
  alignedEdges: ALIGNED_ROAD_POLYLINES.length,
  unsafeEdges: UNSAFE_ROAD_POLYLINES.length,
  waterwayEdges: WATERWAY_POLYLINES.length,
  waypointNodes: WAYPOINT_POSITIONS.filter(point => Number.isFinite(point.x)).length,
  snapDistanceMax: NAMED_LOCATION_SNAP_MAX,
  coordinateSpace: 'percent-0-100' as const,
  imageSize: [1754, 1754] as const
} as const;
