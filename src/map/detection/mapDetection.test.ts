import { describe, expect, it } from 'vitest';
import { ROAD_GEOMETRY_COVERAGE, buildRoadSegmentGeometry, isReviewedWaterwayPair, listAlignedRoadPolylines, listTracedRoadPolylines, listUnsafeRoadPolylines, listWaterwayPolylines } from '../roadGeometry';
import mapDetectionSummary from './mapDetectionSummary.json';
import reviewedWaterCrossings from './reviewedWaterCrossings.json';

const MAP_DETECTION_SUMMARY = mapDetectionSummary;

describe('offline map detection contract', () => {
  it('keeps image, geometry, and markers in the same percent space', () => {
    expect(MAP_DETECTION_SUMMARY.coordinateSpace).toBe('percent-0-100');
    expect(MAP_DETECTION_SUMMARY.imageSize).toEqual([1754, 1754]);
    expect(ROAD_GEOMETRY_COVERAGE.coordinateSpace).toBe('percent-0-100');
  });

  it('treats the current audit as assisted correction, not a rewrite', () => {
    expect(MAP_DETECTION_SUMMARY.strategy).toBe('B');
    expect(MAP_DETECTION_SUMMARY.roads.total).toBe(746);
    expect(MAP_DETECTION_SUMMARY.roads.low).toBeGreaterThan(0);
    expect(MAP_DETECTION_SUMMARY.locations.verified).toBeGreaterThan(40);
  });

  it('keeps the existing graph for play and isolates low-confidence edges as review data', () => {
    expect(listTracedRoadPolylines().length + listWaterwayPolylines().length).toBe(ROAD_GEOMETRY_COVERAGE.waypointEdges);
    expect(listAlignedRoadPolylines().length).toBe(ROAD_GEOMETRY_COVERAGE.alignedEdges);
    expect(listUnsafeRoadPolylines().length).toBe(ROAD_GEOMETRY_COVERAGE.unsafeEdges);
    expect(listWaterwayPolylines().length).toBe(27);
    expect(MAP_DETECTION_SUMMARY.lowConfidenceEdges.length).toBe(ROAD_GEOMETRY_COVERAGE.unsafeEdges);
  });

  it('treats reviewed water crossings as blue waterways, not brown roads', () => {
    expect(reviewedWaterCrossings.reviewed).toBe(true);
    expect(reviewedWaterCrossings.edges).toHaveLength(27);
    expect(isReviewedWaterwayPair(325, 338)).toBe(true);
    expect(isReviewedWaterwayPair(156, 142)).toBe(false);
    const land = buildRoadSegmentGeometry({ id: 'odoak', x: 47, y: 34 }, { id: 'widrow', x: 53, y: 32 });
    expect(land.kind).toBe('road');
  });

  it('still maps a known on-ink settlement pair and refuses invented endpoints', () => {
    const onRoad = buildRoadSegmentGeometry({ id: 'odoak', x: 47, y: 34 }, { id: 'widrow', x: 53, y: 32 });
    expect(onRoad.mapped).toBe(true);
    expect(onRoad.points.length).toBeGreaterThan(2);
    const invented = buildRoadSegmentGeometry({ id: 'off-map', x: 0.2, y: 0.2 }, { id: 'odoak', x: 47, y: 34 });
    expect(invented.mapped).toBe(false);
    expect(invented.points).toEqual([]);
  });
});
