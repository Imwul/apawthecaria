import markerGraph from './detection/markerGraph.json';

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
export const MARKER_EDGES: readonly MarkerEdge[] = data.edges;
export const MARKER_BY_ID = new Map(MARKER_NODES.map(node => [node.id, node]));

const EDGE_BY_PAIR = new Map<string, MarkerEdge>();
const NEIGHBORS = new Map<string, string[]>();

const pairKey = (from: string, to: string) => (from < to ? `${from}|${to}` : `${to}|${from}`);

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
  method: data.method,
  coordinateSpace: data.coordinateSpace,
  imageSize: data.imageSize,
  markers: data.markerCount,
  edges: data.edgeCount,
  waterways: data.waterwayCount
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
    const start = MARKER_BY_ID.get(hops[index]);
    const end = MARKER_BY_ID.get(hops[index + 1]);
    let segment = edge?.points.map(([x, y]) => [x, y] as [number, number]) || [];
    if (segment.length < 2 && start && end) segment = [[start.x, start.y], [end.x, end.y]];
    if (segment.length < 2) continue;
    const reversed = hops[index] !== edge?.from && hops[index] === edge?.to;
    const ordered = reversed ? [...segment].reverse() : segment;
    if (points.length > 0) ordered.shift();
    points.push(...ordered);
  }
  return points;
};

export const markerEdgeKind = (from: string, to: string): MarkerEdgeKind =>
  getMarkerEdge(from, to)?.kind || 'path';
