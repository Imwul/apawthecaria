import { describe, expect, it } from 'vitest';
import {
  appendRouteStop,
  canChooseRouteEdgeKind,
  composedRouteCost,
  cycleRouteEdgeKind,
  draftFromOrigin,
  evaluateRouteDraft,
  glyphKindFromLocation,
  nearestTerrain,
  removeRouteStopAt,
  setRouteEdgeKind,
  stopFromPlace,
  terrainFromRegion,
  updateRouteStopAt,
  type RouteStop
} from './routeComposer';

const stop = (id: string, patch: Partial<RouteStop> = {}): RouteStop => ({
  id,
  name: id,
  kind: 'Wilds',
  terrain: 'Forest',
  hasClinic: false,
  x: 10,
  y: 10,
  ...patch
});

describe('route composer draft', () => {
  it('starts from the current place and appends later clicks as side paths', () => {
    const origin = stop('oak', { name: 'Odoak', kind: 'Wilds', terrain: 'Forest' });
    const first = appendRouteStop(draftFromOrigin(origin), stop('widrow', { name: 'Widrow', kind: 'Settlement' }));
    const next = appendRouteStop(first, stop('odoak', { name: 'Odoak', kind: 'City' }), 'waterway');
    expect(next.stops.map(row => row.id)).toEqual(['oak', 'widrow', 'odoak']);
    expect(next.edgeKinds).toEqual(['path', 'waterway']);
  });

  it('does not duplicate the last stop when the same node is clicked again', () => {
    const draft = appendRouteStop(draftFromOrigin(stop('oak')), stop('oak'));
    expect(draft.stops).toHaveLength(1);
  });

  it('lets a player correct auto-filled kind and terrain', () => {
    const draft = updateRouteStopAt(
      appendRouteStop(draftFromOrigin(stop('oak')), stop('bog-spot', { kind: 'Wilds', terrain: 'Forest' })),
      1,
      { kind: 'Ruin', terrain: 'Bog' }
    );
    expect(draft.stops[1]).toMatchObject({ kind: 'Ruin', terrain: 'Bog' });
  });

  it('removes an intermediate stop and keeps one edge between its neighbors', () => {
    let draft = draftFromOrigin(stop('a'));
    draft = appendRouteStop(draft, stop('b'), 'path');
    draft = appendRouteStop(draft, stop('c'), 'waterway');
    draft = removeRouteStopAt(draft, 1);
    expect(draft.stops.map(row => row.id)).toEqual(['a', 'c']);
    expect(draft.edgeKinds).toEqual(['waterway']);
  });
});

describe('waterway and carry rules', () => {
  it('counts two waterways as one move when a pedal motor spans two', () => {
    expect(composedRouteCost(['waterway', 'waterway', 'path'], 2)).toEqual({
      cost: 2,
      landCount: 1,
      riverCount: 0,
      waterwayCount: 2
    });
    expect(composedRouteCost(['river', 'path'], 2)).toEqual({
      cost: 2,
      landCount: 1,
      riverCount: 1,
      waterwayCount: 0
    });
  });

  it('soaks unprotected reagents, locks a loch wilds stop, and drops over-encumbered speed to 1', () => {
    let draft = draftFromOrigin(stop('shore', { terrain: 'Meadow' }));
    draft = appendRouteStop(draft, stop('mid', { terrain: 'Loch' }), 'waterway');
    const wet = evaluateRouteDraft({
      draft,
      speed: 3,
      carry: 4,
      weight: 6,
      canStopInLoch: false,
      protectsFromSoaking: false,
      soakableItemIds: ['herb'],
      mustUseFullSpeed: true
    });
    expect(wet).toMatchObject({
      effectiveSpeed: 1,
      movementCost: 1,
      reason: 'loch-locked',
      soakedItemIds: ['herb'],
      usesWaterway: true
    });

    const city = evaluateRouteDraft({
      draft: appendRouteStop(draftFromOrigin(stop('shore')), stop('port', { kind: 'City', terrain: 'Loch' }), 'waterway'),
      speed: 1,
      carry: 8,
      weight: 2,
      canStopInLoch: false,
      protectsFromSoaking: true
    });
    expect(city).toMatchObject({ reason: 'legal', soakedItemIds: [], endsInLochWilds: false });
  });
});

describe('map-key appearance', () => {
  it('reads clinic, city, ruin, and the five terrain colours from place data', () => {
    expect(glyphKindFromLocation({ hasClinic: true, locationType: 'Settlement' })).toBe('Clinic');
    expect(glyphKindFromLocation({ kind: 'city' })).toBe('City');
    expect(glyphKindFromLocation({ locationType: 'Titan Ruin' })).toBe('Ruin');
    expect(terrainFromRegion('Bog')).toBe('Bog');
    expect(terrainFromRegion('Titan')).toBe(null);
    expect(nearestTerrain(10, 10, [
      { x: 80, y: 80, region: 'Mountain' },
      { x: 12, y: 11, region: 'Meadow' }
    ])).toBe('Meadow');
  });

  it('copies a clicked place into a stop the player can later edit', () => {
    expect(stopFromPlace({
      id: 'glasswall',
      name: 'Glasswall',
      x: 27,
      y: 69,
      region: 'Forest',
      kind: 'city',
      hasClinic: false
    })).toMatchObject({
      id: 'glasswall',
      kind: 'City',
      terrain: 'Forest'
    });
  });
});

describe('edge toggles', () => {
  it('lets the player mark a side path as a river, and a waterway only when a loch is touched', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('a')), stop('b'));
    draft = setRouteEdgeKind(draft, 0, 'river');
    expect(draft.edgeKinds).toEqual(['river']);
    draft = setRouteEdgeKind(draft, 0, 'waterway');
    expect(draft.edgeKinds).toEqual(['river']);
    expect(canChooseRouteEdgeKind('waterway', stop('a'), stop('b'))).toBe(false);
    expect(canChooseRouteEdgeKind('waterway', stop('a'), stop('lake', { terrain: 'Loch' }))).toBe(true);
    expect(cycleRouteEdgeKind('path', stop('a'), stop('b'))).toBe('river');
    expect(cycleRouteEdgeKind('river', stop('a'), stop('b'))).toBe('path');
    expect(cycleRouteEdgeKind('river', stop('a'), stop('lake', { terrain: 'Loch' }))).toBe('waterway');
  });
});
