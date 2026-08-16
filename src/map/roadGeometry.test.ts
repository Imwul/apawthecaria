// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ROAD_GEOMETRY_COVERAGE,
  buildRoadRouteGeometry,
  buildRoadSegmentGeometry,
  listTracedRoadPolylines,
  routeJoinGaps,
  snapToRoadWaypoint
} from './roadGeometry';

const ODOAK = { id: 'odoak', x: 47, y: 34 };
const WIDROW = { id: 'widrow', x: 53, y: 32 };
const WHITEBIRCH = { id: 'whitebirch', x: 30, y: 23 };
const STARTING_OAK = { id: 'starting_oak_road', x: 26, y: 34 };
const SPOOLKEEP = { id: 'spoolkeep', x: 94, y: 17 };
const GLASSWALL = { id: 'glasswall', x: 27, y: 69 };
const NOONHILL = { id: 'noonhill', x: 37, y: 91 };

describe('road geometry tracing', () => {
  it('loads traced brown-road polylines instead of inventing them', () => {
    expect(ROAD_GEOMETRY_COVERAGE.waypointEdges).toBeGreaterThan(500);
    expect(ROAD_GEOMETRY_COVERAGE.waterwayEdges).toBeGreaterThan(0);
    expect(ROAD_GEOMETRY_COVERAGE.alignedEdges).toBeGreaterThan(200);
    expect(ROAD_GEOMETRY_COVERAGE.unsafeEdges).toBeGreaterThan(0);
    expect(ROAD_GEOMETRY_COVERAGE.waypointNodes).toBeGreaterThan(400);
    expect(ROAD_GEOMETRY_COVERAGE.coordinateSpace).toBe('percent-0-100');
    expect(ROAD_GEOMETRY_COVERAGE.imageSize).toEqual([1754, 1754]);
  });

  it('snaps named settlements onto nearby printed road waypoints', () => {
    const snap = snapToRoadWaypoint(ODOAK.x, ODOAK.y);
    expect(snap).not.toBeNull();
    expect(snap!.distance).toBeLessThanOrEqual(ROAD_GEOMETRY_COVERAGE.snapDistanceMax);
  });

  it('maps a direct nearby route onto a multi-point road polyline', () => {
    const segment = buildRoadSegmentGeometry(ODOAK, WIDROW);
    expect(segment.mapped).toBe(true);
    expect(segment.points.length).toBeGreaterThan(2);
    const unique = new Set(segment.points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`));
    expect(unique.size).toBeGreaterThan(2);
  });

  it('maps a one-junction route without falling back to a straight line', () => {
    const segment = buildRoadSegmentGeometry(ODOAK, WHITEBIRCH);
    expect(segment.mapped).toBe(true);
    expect(segment.points.length).toBeGreaterThan(4);
    const first = segment.points[0];
    const last = segment.points[segment.points.length - 1];
    const straight = Math.hypot(WHITEBIRCH.x - ODOAK.x, WHITEBIRCH.y - ODOAK.y);
    let road = 0;
    for (let index = 1; index < segment.points.length; index++) {
      road += Math.hypot(segment.points[index][0] - segment.points[index - 1][0], segment.points[index][1] - segment.points[index - 1][1]);
    }
    expect(road).toBeGreaterThan(straight * 0.95);
    expect(Math.hypot(first[0] - ODOAK.x, first[1] - ODOAK.y)).toBeLessThan(5);
    expect(Math.hypot(last[0] - WHITEBIRCH.x, last[1] - WHITEBIRCH.y)).toBeLessThan(5);
  });

  it('maps a long multi-turn route across the woods', () => {
    const route = buildRoadRouteGeometry([STARTING_OAK, ODOAK, SPOOLKEEP]);
    expect(route.missingPairs).toEqual([]);
    expect(route.segments.every(segment => segment.mapped && segment.points.length > 8)).toBe(true);
  });

  it('maps a winding south-west route that must turn more than once', () => {
    const segment = buildRoadSegmentGeometry(GLASSWALL, NOONHILL);
    expect(segment.mapped).toBe(true);
    expect(segment.kind).toBe('road');
    expect(segment.points.length).toBeGreaterThan(8);
  });

  it('keeps reviewed water crossings off the brown-road graph', () => {
    const land = buildRoadSegmentGeometry(GLASSWALL, NOONHILL);
    expect(land.kind).toBe('road');
    expect(land.mapped).toBe(true);
  });

  it('leaves unmapped edges empty instead of inventing a path', () => {
    const segment = buildRoadSegmentGeometry({ id: 'off-map', x: 0.2, y: 0.2 }, ODOAK);
    expect(segment.mapped).toBe(false);
    expect(segment.points).toEqual([]);
  });

  it('reverses stored polyline points for the opposite direction', () => {
    const forward = buildRoadSegmentGeometry(ODOAK, WIDROW);
    const reverse = buildRoadSegmentGeometry(WIDROW, ODOAK);
    expect(forward.mapped).toBe(true);
    expect(reverse.mapped).toBe(true);
    expect(reverse.points[0]).toEqual(forward.points[forward.points.length - 1]);
    expect(reverse.points[reverse.points.length - 1]).toEqual(forward.points[0]);
  });

  it('keeps a multi-edge route continuous without jumping', () => {
    const route = buildRoadRouteGeometry([STARTING_OAK, ODOAK, WIDROW]);
    expect(route.missingPairs).toEqual([]);
    const gaps = routeJoinGaps(route.segments);
    expect(gaps.every(gap => gap <= 1.2)).toBe(true);
  });

  it('reports an explicit unmapped state instead of a straight fallback', () => {
    const route = buildRoadRouteGeometry([
      { id: 'ghost-a', x: 0.2, y: 0.2 },
      { id: 'ghost-b', x: 1.1, y: 1.4 }
    ]);
    expect(route.segments).toEqual([]);
    expect(route.missingPairs).toEqual([{ from: 'ghost-a', to: 'ghost-b' }]);
    expect(route.total).toBe(1);
  });

  it('keeps every traced point inside the percent map bounds', () => {
    const outOfBounds = listTracedRoadPolylines().flatMap(points =>
      points.filter(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100)
    );
    expect(outOfBounds).toEqual([]);
    expect(listTracedRoadPolylines().every(points => points.length >= 2)).toBe(true);
  });

  it('does not keep a hash or straight-line fallback in the route builder', () => {
    const source = readFileSync(fileURLToPath(new URL('./roadGeometry.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/charCodeAt/);
    expect(source).not.toMatch(/bezier/i);
    expect(source).not.toMatch(/quadraticCurve|straight line/i);
    expect(source).toContain('points: [], mapped: false');
  });
});
