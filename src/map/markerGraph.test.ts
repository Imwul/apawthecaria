import { describe, expect, it } from 'vitest';
import {
  MARKER_EDGES,
  MARKER_GRAPH_COVERAGE,
  MARKER_NODES,
  getMarkerEdge,
  listMarkerNeighbors,
  markerPathPoints,
  shortestMarkerHopPath
} from './markerGraph';

const pathLength = (points: Array<[number, number]>) => {
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  }
  return total;
};

describe('marker-first path graph', () => {
  it('keeps markers on traced printed roads instead of invented ink chords', () => {
    expect(MARKER_GRAPH_COVERAGE.method).toBe('markers-on-traced-roads');
    expect(MARKER_GRAPH_COVERAGE.markers).toBeGreaterThan(400);
    expect(MARKER_GRAPH_COVERAGE.edges).toBeGreaterThan(400);
    expect(MARKER_GRAPH_COVERAGE.coordinateSpace).toBe('percent-0-100');
  });

  it('counts destination distance as hops along black-connected markers', () => {
    const toSpoolkeep = shortestMarkerHopPath('odoak', 'spoolkeep');
    const toSummit = shortestMarkerHopPath('odoak', 'summit');
    expect(toSpoolkeep[0]).toBe('odoak');
    expect(toSpoolkeep.at(-1)).toBe('spoolkeep');
    expect(toSpoolkeep.length - 1).toBeGreaterThan(8);
    expect(toSummit.length - 1).toBeGreaterThan(12);
    expect(listMarkerNeighbors('odoak').length).toBeGreaterThan(0);
  });

  it('does not skip Obridge when walking the printed road beside it', () => {
    const neighbors = listMarkerNeighbors('obridge');
    expect(neighbors.length).toBeGreaterThan(1);
    const toOdoak = shortestMarkerHopPath('obridge', 'odoak');
    expect(toOdoak[0]).toBe('obridge');
    expect(toOdoak.at(-1)).toBe('odoak');
    expect(toOdoak).toContain('loc_180');
    expect(getMarkerEdge('loc_170', 'loc_180')).toBeNull();
  });

  it('keeps named settlements such as Spoutneck on the printed road', () => {
    expect(listMarkerNeighbors('spoutneck').length).toBeGreaterThan(0);
    expect(shortestMarkerHopPath('obridge', 'spoutneck').at(-1)).toBe('spoutneck');
    for (const id of ['obridge', 'odoak', 'spoutneck', 'holdall', 'whitebirch', 'crossyce', 'widrow']) {
      expect(listMarkerNeighbors(id).length, id).toBeGreaterThan(0);
    }
    const isolated = MARKER_NODES.filter(node => node.named && listMarkerNeighbors(node.id).length === 0);
    expect(isolated.length).toBeLessThan(10);
  });

  it('draws named routes on the traced road instead of a straight jump', () => {
    const points = markerPathPoints('obridge', 'odoak');
    expect(points.length).toBeGreaterThan(8);
    const first = points[0];
    const last = points[points.length - 1];
    const chord = Math.hypot(last[0] - first[0], last[1] - first[1]);
    expect(pathLength(points)).toBeGreaterThan(chord * 1.02);
    const longChords = MARKER_EDGES.filter(edge => {
      if (edge.points.length > 3) return false;
      const start = edge.points[0];
      const end = edge.points[edge.points.length - 1];
      return Math.hypot(end[0] - start[0], end[1] - start[1]) > 3;
    });
    expect(longChords).toEqual([]);
  });
});
