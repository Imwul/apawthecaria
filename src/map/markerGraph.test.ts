import { describe, expect, it } from 'vitest';
import {
  MARKER_GRAPH_COVERAGE,
  listMarkerNeighbors,
  shortestMarkerHopPath
} from './markerGraph';

describe('marker-first path graph', () => {
  it('keeps a reviewed marker graph instead of nearest-neighbor invention', () => {
    expect(MARKER_GRAPH_COVERAGE.method).toBe('markers-then-ink');
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
});
