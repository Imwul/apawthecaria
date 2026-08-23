import { describe, expect, it } from 'vitest';
import {
  bandolierAdjustedWeight,
  installWagonExpansion,
  resolveCanonicalDowntime,
  resolveCompanionTravel,
  resolveToolTrigger,
  type CanonicalDowntimeState,
  type CanonicalToolState,
  type TravelGraphNode
} from './index';

const tool = (toolId: string, upgradeId: string | null = null): CanonicalToolState => ({
  instanceId: `tool:${toolId}`,
  toolId,
  upgradeId,
  charges: null,
  broken: false,
  consumed: false,
  acquiredBy: 'test',
  appliedEffectIds: []
});

const downtimeState = (): CanonicalDowntimeState => {
  const graph: Record<string, TravelGraphNode> = {
    a: { id: 'a', name: 'A', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'c', kind: 'path' }] },
    b: { id: 'b', name: 'B', region: 'Meadow', locationType: 'City', edges: [{ to: 'c', kind: 'path' }] },
    c: { id: 'c', name: 'C', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'a', kind: 'path' }, { to: 'b', kind: 'path' }] }
  };
  return {
    downtimeRequired: true,
    downtimeCompleted: false,
    reputation: 15,
    trinkets: 0,
    speed: 3,
    carry: 4,
    travelStyle: 'Rambling and Ready',
    currentLocationId: 'a',
    currentSeason: 'Spring',
    inventory: [],
    graph,
    ailmentTagOverrides: [],
    appliedTransactionIds: [],
    journalEvents: []
  };
};

describe('Phase 5 canonical closure', () => {
  it('[TOOL-002] applies Bandolier Weight only to eligible Plant/Insect Parts', () => {
    const weight = bandolierAdjustedWeight([
      { weight: 3, type: 'plant' },
      { weight: 3, type: 'insect' },
      { weight: 2, type: 'earth' }
    ], [tool('greenpaw-bandolier')]);
    expect(weight).toBe(4);
  });

  it('[TOOL-003/TOOL-005] applies a Tool trigger once and persists breakage', () => {
    const tent = resolveToolTrigger({ transactionId: 'tent:1', tool: tool('canvas-tent'), trigger: 'weather-encounter', card: { value: 6, suit: '♣' } });
    expect(tent).toMatchObject({ ignoredOutcome: true, tool: { broken: true } });
    expect(() => resolveToolTrigger({ transactionId: 'tent:1', tool: tent.tool, trigger: 'weather-encounter', card: 4 })).toThrow();
  });

  it('[WAGON-002/WAGON-004] installs Sealed Carriage only on a commissioned Wagon and applies the Coracle discount', () => {
    const result = installWagonExpansion({
      wagon: { commissioned: true, expansionIds: [], clayPotReagentId: null, clayPotMoves: 0 },
      expansionId: 'sealed-carriage',
      locationName: 'Newdam',
      isCity: true,
      trinkets: 5,
      recycleCoracle: true
    });
    expect(result).toMatchObject({ trinkets: 0, wagon: { expansionIds: ['sealed-carriage'] } });
  });

  it('[COMPANION-002] queues every crossed Wasp milestone and grants Honey separately', () => {
    const outcome = resolveCompanionTravel([
      { instanceId: 'w', companionId: 'wasp', pathsTravelled: 9, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null },
      { instanceId: 'h', companionId: 'honeybee', pathsTravelled: 9, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null }
    ], 21);
    expect(outcome).toMatchObject({ waspForageDraws: 3, honeyHarvests: 3 });
    expect(outcome.companions[0]).toMatchObject({ pathsTravelled: 0, pendingForage: 'insect', pendingForageDraws: 3 });
  });

  it('[DOWNTIME-003/DOWNTIME-005] makes one canonical activity idempotent and graph-backed', () => {
    const explored = resolveCanonicalDowntime('explore:1', downtimeState(), { activity: 'explore', fromId: 'a', toId: 'b', kind: 'path', playerConfirmedClose: true });
    expect(explored.downtimeCompleted).toBe(true);
    expect(explored.graph.a.edges).toContainEqual({ to: 'b', kind: 'path' });
    expect(() => resolveCanonicalDowntime('explore:2', explored, { activity: 'self-improvement', choice: 'carry' })).toThrow();
  });

  it('[DOWNTIME-005] leaves p.41 close-to-the-journey-end judgment to the player', () => {
    const state = downtimeState();
    state.currentLocationId = 'start';
    state.graph = {
      start: { id: 'start', name: 'Journey End', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'left-1', kind: 'path' }, { to: 'right-1', kind: 'path' }] },
      'left-1': { id: 'left-1', name: 'Left One', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'start', kind: 'path' }, { to: 'left-2', kind: 'path' }] },
      'left-2': { id: 'left-2', name: 'Left Two', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'left-1', kind: 'path' }, { to: 'left-far', kind: 'path' }] },
      'left-far': { id: 'left-far', name: 'Left Far', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'left-2', kind: 'path' }] },
      'right-1': { id: 'right-1', name: 'Right One', region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'start', kind: 'path' }, { to: 'right-2', kind: 'path' }] },
      'right-2': { id: 'right-2', name: 'Right Two', region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'right-1', kind: 'path' }, { to: 'right-far', kind: 'path' }] },
      'right-far': { id: 'right-far', name: 'Right Far', region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'right-2', kind: 'path' }] }
    };

    expect(() => resolveCanonicalDowntime('explore:unconfirmed', state, {
      activity: 'explore', fromId: 'left-far', toId: 'right-far', kind: 'waterway', playerConfirmedClose: false
    })).toThrow(/player to confirm/i);

    const explored = resolveCanonicalDowntime('explore:confirmed', state, {
      activity: 'explore', fromId: 'left-far', toId: 'right-far', kind: 'waterway', playerConfirmedClose: true
    });
    expect(explored.graph['left-far'].edges).toContainEqual({ to: 'right-far', kind: 'waterway' });
    expect(explored.graph['right-far'].edges).toContainEqual({ to: 'left-far', kind: 'waterway' });
  });
});
