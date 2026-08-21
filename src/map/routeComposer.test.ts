import { describe, expect, it } from 'vitest';
import {
  appendRouteStop,
  canChooseRouteEdgeKind,
  composedRouteCost,
  confirmedRouteCoverage,
  cycleRouteEdgeKind,
  draftFromOrigin,
  evaluateRouteDraft,
  glyphKindFromLocation,
  insertRouteStopBeforeTarget,
  nearestTerrain,
  moveRouteStop,
  normalizeRouteDraft,
  removeRouteStopAt,
  setRouteEdgeKind,
  shortestConfirmedRouteDistance,
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
    const first = appendRouteStop(draftFromOrigin(origin), stop('widrow', { name: 'Widrow', kind: 'Settlement', terrain: 'Loch' }));
    const next = appendRouteStop(first, stop('odoak', { name: 'Odoak', kind: 'City' }), 'waterway');
    expect(next.stops.map(row => row.id)).toEqual(['oak', 'widrow', 'odoak']);
    expect(next.edgeKinds).toEqual(['path', 'waterway']);
  });

  it('allows a later retrace but keeps a repeated tap on the current end idempotent', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('oak')), stop('middle'));
    draft = appendRouteStop(draft, stop('end'));
    const repeatedMiddle = appendRouteStop(draft, stop('middle'));
    expect(repeatedMiddle.stops.map(row => row.id)).toEqual(['oak', 'middle', 'end', 'middle']);
    expect(appendRouteStop(repeatedMiddle, stop('middle'))).toBe(repeatedMiddle);
  });

  it('inserts daily map clicks before a fixed Journey Destination', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('origin')), stop('target'));
    draft = insertRouteStopBeforeTarget(draft, stop('wild-1'), 'target', (from, to) =>
      `${from.id}-${to.id}` === 'wild-1-target' ? 'river' : 'path'
    );
    expect(draft.stops.map(row => row.id)).toEqual(['origin', 'wild-1', 'target']);
    expect(draft.edgeKinds).toEqual(['path', 'river']);

    const repeated = insertRouteStopBeforeTarget(draft, stop('wild-1'), 'target');
    expect(repeated).toBe(draft);
  });

  it('keeps ordinary appending when the Journey Destination is only a pinned reference', () => {
    const draft = insertRouteStopBeforeTarget(draftFromOrigin(stop('origin')), stop('wild-1'), 'target');
    expect(draft.stops.map(row => row.id)).toEqual(['origin', 'wild-1']);
  });

  it('lets a player correct auto-filled kind and terrain', () => {
    const draft = updateRouteStopAt(
      appendRouteStop(draftFromOrigin(stop('oak')), stop('bog-spot', { kind: 'Wilds', terrain: 'Forest' })),
      1,
      { kind: 'Ruin', terrain: 'Bog' }
    );
    expect(draft.stops[1]).toMatchObject({ kind: 'Ruin', terrain: 'Bog' });
  });

  it('removes an intermediate stop and resolves the newly joined physical segment', () => {
    let draft = draftFromOrigin(stop('a'));
    draft = appendRouteStop(draft, stop('b'), 'path');
    draft = appendRouteStop(draft, stop('c'), 'river');
    draft = removeRouteStopAt(draft, 1, (from, to) => from.id === 'a' && to.id === 'c' ? 'river' : 'path');
    expect(draft.stops.map(row => row.id)).toEqual(['a', 'c']);
    expect(draft.edgeKinds).toEqual(['river']);
  });

  it('collapses a self-loop exposed by deleting the middle of a retrace', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('a')), stop('b'));
    draft = appendRouteStop(draft, stop('c'));
    draft = appendRouteStop(draft, stop('b'));
    draft = removeRouteStopAt(draft, 2);
    expect(draft.stops.map(row => row.id)).toEqual(['a', 'b']);
    expect(draft.edgeKinds).toHaveLength(1);
  });

  it('keeps edge types on endpoint pairs when stops are reordered', () => {
    let draft = draftFromOrigin(stop('a'));
    draft = appendRouteStop(draft, stop('b'), 'river');
    draft = appendRouteStop(draft, stop('c'), 'path');
    draft = appendRouteStop(draft, stop('d'), 'river');
    draft = moveRouteStop(draft, 2, 1, (from, to) => `${from.id}-${to.id}` === 'a-c' ? 'river' : 'path');
    expect(draft.stops.map(row => row.id)).toEqual(['a', 'c', 'b', 'd']);
    expect(draft.edgeKinds).toEqual(['river', 'path', 'path']);
  });

  it('keeps the current-location origin fixed when reordering', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('origin')), stop('b'));
    draft = appendRouteStop(draft, stop('c'));
    expect(moveRouteStop(draft, 0, 1)).toBe(draft);
    expect(moveRouteStop(draft, 1, 0)).toBe(draft);
  });

  it('does not leave adjacent duplicate ids after a reorder', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('a')), stop('b'));
    draft = appendRouteStop(draft, stop('c'));
    draft = appendRouteStop(draft, stop('b'));
    draft = moveRouteStop(draft, 3, 2);
    expect(draft.stops.map(row => row.id)).toEqual(['a', 'b', 'c']);
    expect(draft.edgeKinds).toHaveLength(2);
  });

  it('repairs malformed persisted drafts without inventing connector counts', () => {
    const restored = normalizeRouteDraft({
      stops: [
        stop('origin'),
        { ...stop('lake'), terrain: 'Loch', x: 500 },
        null,
        { name: 'missing id' }
      ],
      edgeKinds: ['waterway', 'bogus', 'river']
    });
    expect(restored.stops.map(row => row.id)).toEqual(['origin', 'lake']);
    expect(restored.stops[1].x).toBe(100);
    expect(restored.edgeKinds).toEqual(['waterway']);
  });

  it('repairs a persisted self-loop without dropping a later retrace', () => {
    const restored = normalizeRouteDraft({
      stops: [stop('a'), stop('b'), stop('b'), stop('c'), stop('b')],
      edgeKinds: ['path', 'river', 'path', 'river']
    });
    expect(restored.stops.map(row => row.id)).toEqual(['a', 'b', 'c', 'b']);
    expect(restored.edgeKinds).toEqual(['path', 'path', 'river']);
  });

  it('round-trips a 20-node mixed route including a legitimate retrace', () => {
    let draft = draftFromOrigin(stop('n0'));
    for (let index = 1; index < 20; index += 1) {
      const id = index === 19 ? 'n3' : `n${index}`;
      draft = appendRouteStop(draft, stop(id, { terrain: index % 4 === 0 ? 'Loch' : 'Forest' }), index % 3 === 0 ? 'river' : 'path');
    }
    const restored = normalizeRouteDraft(JSON.parse(JSON.stringify(draft)));
    expect(restored).toEqual(draft);
    expect(restored.stops).toHaveLength(20);
    expect(restored.edgeKinds).toHaveLength(19);
    expect(restored.stops.at(-1)?.id).toBe('n3');
  });
});

describe('player-confirmed route distances', () => {
  const edges = [
    { from: 'origin', to: 'a' },
    { from: 'a', to: 'b' },
    { from: 'b', to: 'target' },
    { from: 'origin', to: 'detour' },
    { from: 'detour', to: 'long-1' },
    { from: 'long-1', to: 'long-2' },
    { from: 'long-2', to: 'target' }
  ];

  it('finds the bidirectional minimum using only saved connections', () => {
    expect(shortestConfirmedRouteDistance(edges, 'origin', 'target')).toBe(3);
    expect(shortestConfirmedRouteDistance(edges, 'target', 'origin')).toBe(3);
    expect(shortestConfirmedRouteDistance(edges, 'origin', 'missing')).toBeNull();
  });

  it('reports which selected Move segments still lack confirmation', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('origin')), stop('a'));
    draft = appendRouteStop(draft, stop('unknown'));
    expect(confirmedRouteCoverage(draft, edges)).toEqual({
      confirmed: 1,
      total: 2,
      missingPairs: [{ from: 'a', to: 'unknown' }]
    });
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

  it('updates every occurrence when the same bidirectional path is retraced', () => {
    let draft = appendRouteStop(draftFromOrigin(stop('a')), stop('b'));
    draft = appendRouteStop(draft, stop('a'));
    draft = setRouteEdgeKind(draft, 1, 'river');
    expect(draft.edgeKinds).toEqual(['river', 'river']);
  });
});
