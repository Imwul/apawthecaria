import { describe, expect, it } from 'vitest';
import type { EngineInventoryItem, TravelGraphNode } from './gameplay';
import {
  findClosestShoreSteps,
  findNearestDirectionalLocations,
  recoverUnbuckledCache,
  isTravelEncounterLocationBlocked,
  normalizeTravelEncounterWorldState,
  resolveChoppyWaters,
  resolveElectricianRepair,
  resolvePirateCombat,
  resolveUnbuckled,
  resolveViciousMurk,
  resolveWashedAway,
  settleTravelEncounterSeason
} from './travelEncounterRuntime';

const node = (
  id: string,
  x: number,
  y: number,
  region: TravelGraphNode['region'],
  edges: string[] = [],
  locationType: TravelGraphNode['locationType'] = 'Wilds'
): TravelGraphNode => ({
  id, name: id, x, y, region, locationType,
  edges: edges.map(to => ({ to, kind: 'path' }))
});

const graph = (...nodes: TravelGraphNode[]): Record<string, TravelGraphNode> =>
  Object.fromEntries(nodes.map(row => [row.id, row]));

const reagent = (id = 'reagent', quantity?: number): EngineInventoryItem => ({
  id, name: id, type: 'reagent', weight: 1 / 3, quantity, ruinedWhenSoaked: true
});

const tool = (id: string, canonicalToolId = id): EngineInventoryItem => ({
  id, name: id, type: 'tool', weight: 1, canonicalToolId
});

describe('p.82 Washed Away', () => {
  it('uses the printed suit directions and nearest map geometry rather than graph connectivity', () => {
    const map = graph(
      node('origin', 0, 0, 'Loch'),
      node('near-north', 1, -2, 'Forest'),
      node('far-north', 0, -8, 'Meadow'),
      node('south', 0, 2, 'Bog'),
      node('east', 2, 0, 'Mountain'),
      node('west', -2, 0, 'Titan')
    );

    expect(findNearestDirectionalLocations({ graph: map, originLocationId: 'origin', suit: '♥' }).value)
      .toMatchObject({ direction: 'north', candidateLocationIds: ['near-north'] });
    expect(findNearestDirectionalLocations({ graph: map, originLocationId: 'origin', suit: '♦' }).value)
      .toMatchObject({ direction: 'south', candidateLocationIds: ['south'] });
    expect(findNearestDirectionalLocations({ graph: map, originLocationId: 'origin', suit: '♣' }).value)
      .toMatchObject({ direction: 'east', candidateLocationIds: ['east'] });
    expect(findNearestDirectionalLocations({ graph: map, originLocationId: 'origin', suit: '♠' }).value)
      .toMatchObject({ direction: 'west', candidateLocationIds: ['west'] });
  });

  it('moves immediately, redraws from each Loch landing, and stops on the first non-Loch Location', () => {
    const map = graph(
      node('start', 0, 0, 'Loch'),
      node('loch-north', 0, -1, 'Loch'),
      node('shore-east', 1, -1, 'Forest'),
      node('distant-east', 5, 0, 'Meadow')
    );
    const awaiting = resolveWashedAway({ graph: map, startLocationId: 'start', drawnSuits: ['♥'] });
    expect(awaiting).toMatchObject({
      status: 'needs-input',
      value: { route: ['start', 'loch-north'], currentLocationId: 'loch-north', consumedDraws: 1, nextDrawRequired: true }
    });

    const complete = resolveWashedAway({ graph: map, startLocationId: 'start', drawnSuits: ['♥', '♣'] });
    expect(complete).toMatchObject({
      status: 'resolved',
      value: { route: ['start', 'loch-north', 'shore-east'], currentLocationId: 'shore-east', consumedDraws: 2 }
    });
  });

  it('requires an explicit choice for an exact distance tie and rejects a farther target', () => {
    const map = graph(
      node('start', 0, 0, 'Loch'),
      node('north-west', -1, -1, 'Forest'),
      node('north-east', 1, -1, 'Forest'),
      node('north-far', 0, -3, 'Forest')
    );
    const tied = resolveWashedAway({ graph: map, startLocationId: 'start', drawnSuits: ['♥'] });
    expect(tied).toMatchObject({
      status: 'needs-input',
      value: { unresolvedTie: { drawIndex: 0, candidateLocationIds: ['north-east', 'north-west'] } }
    });
    expect(resolveWashedAway({
      graph: map, startLocationId: 'start', drawnSuits: ['♥'], selectedTargetLocationIds: ['north-far']
    }).status).toBe('invalid');
    expect(resolveWashedAway({
      graph: map, startLocationId: 'start', drawnSuits: ['♥'], selectedTargetLocationIds: ['north-west']
    })).toMatchObject({ status: 'resolved', value: { currentLocationId: 'north-west' } });
  });
});

describe('p.83 Choppy Waters', () => {
  const lochGraph = () => graph(
    node('loch', 0, 0, 'Loch', ['west-channel', 'east-channel']),
    node('west-channel', -1, 0, 'Loch', ['loch', 'west-shore']),
    node('east-channel', 1, 0, 'Loch', ['loch', 'deep-loch']),
    node('deep-loch', 2, 0, 'Loch', ['east-channel', 'east-shore']),
    node('west-shore', -2, 0, 'Forest', ['west-channel']),
    node('east-shore', 3, 0, 'Meadow', ['deep-loch'])
  );

  it('finds only first steps on shortest routes to the closest shore', () => {
    expect(findClosestShoreSteps({ graph: lochGraph(), originLocationId: 'loch' })).toEqual({
      status: 'resolved',
      value: { distanceInPaths: 2, candidateLocationIds: ['west-channel'] },
      messages: []
    });
  });

  it('keeps J/M move-or-stay distinct from the 2-10 forced closest-shore step', () => {
    const map = lochGraph();
    const face = resolveChoppyWaters({
      graph: map, currentLocationId: 'loch', card: { value: 11 }, inventory: []
    });
    expect(face).toMatchObject({
      status: 'needs-input',
      value: { branch: 'desired-direction', eligibleDestinationIds: ['loch', 'west-channel', 'east-channel'] }
    });
    expect(resolveChoppyWaters({
      graph: map, currentLocationId: 'loch', card: { value: 12 }, inventory: [], destinationLocationId: 'loch'
    })).toMatchObject({ status: 'resolved', value: { currentLocationId: 'loch' } });

    const numbered = resolveChoppyWaters({
      graph: map, currentLocationId: 'loch', card: { value: 7 }, inventory: []
    });
    expect(numbered).toMatchObject({
      status: 'needs-input',
      value: { branch: 'closest-shore', eligibleDestinationIds: ['west-channel'] }
    });
    expect(resolveChoppyWaters({
      graph: map, currentLocationId: 'loch', card: { value: 7 }, inventory: [], destinationLocationId: 'east-channel'
    }).status).toBe('invalid');
    expect(resolveChoppyWaters({
      graph: map, currentLocationId: 'loch', card: { value: 7 }, inventory: [], destinationLocationId: 'west-channel'
    })).toMatchObject({ status: 'resolved', value: { currentLocationId: 'west-channel' } });
  });

  it('soaks Reagents on Ace but preserves them with a Waxed Satchel', () => {
    const map = lochGraph();
    const vulnerable = [reagent('herb'), { id: 'evidence', name: 'Evidence', type: 'item' as const, weight: 1 / 3, ruinedWhenSoaked: true }, tool('knife')];
    expect(resolveChoppyWaters({
      graph: map, currentLocationId: 'loch', card: { value: 1 }, inventory: vulnerable
    })).toMatchObject({
      status: 'resolved',
      value: { branch: 'capsized', soakedItemIds: ['herb', 'evidence'], protectedByWaxedSatchel: false }
    });
    expect(resolveChoppyWaters({
      graph: map, currentLocationId: 'loch', card: { value: 1 }, inventory: [...vulnerable, tool('waxed', 'waxed-satchel')]
    })).toMatchObject({
      status: 'resolved', value: { soakedItemIds: [], protectedByWaxedSatchel: true }
    });
  });
});

describe('p.84 Pi-rats and Vicious Murk', () => {
  const map = () => graph(
    node('loch', 0, 0, 'Loch', ['shore', 'channel']),
    node('shore', -1, 0, 'Forest', ['loch']),
    node('channel', 1, 0, 'Loch', ['loch'])
  );

  it('enforces combat vehicle/card eligibility and moves a win to an adjacent Location', () => {
    expect(resolvePirateCombat({
      graph: map(), currentLocationId: 'loch', hasCoracle: false, hasAdaptedWagon: false,
      hasCrossbow: false, playerCards: [{ value: 10 }], pirateCards: [{ value: 2 }, { value: 3 }]
    }).status).toBe('invalid');
    expect(resolvePirateCombat({
      graph: map(), currentLocationId: 'loch', hasCoracle: true, hasAdaptedWagon: false,
      hasCrossbow: true, playerCards: [{ value: 10 }], pirateCards: [{ value: 2 }, { value: 3 }]
    }).status).toBe('invalid');

    const chooseEscape = resolvePirateCombat({
      graph: map(), currentLocationId: 'loch', hasCoracle: true, hasAdaptedWagon: false,
      hasCrossbow: true, playerCards: [{ value: 10 }, { value: 4 }], pirateCards: [{ value: 2 }, { value: 3 }]
    });
    expect(chooseEscape).toMatchObject({ status: 'needs-input', value: { outcome: 'win', playerTotal: 14, pirateTotal: 5 } });
    expect(resolvePirateCombat({
      graph: map(), currentLocationId: 'loch', hasCoracle: true, hasAdaptedWagon: false,
      hasCrossbow: true, playerCards: [{ value: 10 }, { value: 4 }], pirateCards: [{ value: 2 }, { value: 3 }],
      escapeLocationId: 'shore'
    })).toMatchObject({
      status: 'resolved', value: { outcome: 'win', currentLocationId: 'shore', takenPrisoner: false }
    });
  });

  it('ends the Journey/rests through the Season on a loss and refuses to invent a tie-breaker', () => {
    expect(resolvePirateCombat({
      graph: map(), currentLocationId: 'loch', hasCoracle: false, hasAdaptedWagon: true,
      hasCrossbow: false, playerCards: [{ value: 2 }], pirateCards: [{ value: 9 }, { value: 3 }]
    })).toMatchObject({
      status: 'resolved', value: { outcome: 'lose', takenPrisoner: true, endJourney: true, restUntilNextSeason: true }
    });
    expect(resolvePirateCombat({
      graph: map(), currentLocationId: 'loch', hasCoracle: true, hasAdaptedWagon: false,
      hasCrossbow: false, playerCards: [{ value: 10 }], pirateCards: [{ value: 4 }, { value: 6 }]
    })).toMatchObject({ status: 'needs-input', value: { outcome: 'tie-unresolved' } });
  });

  it('blocks the murky Location for the current Season and travels back exactly one Path', () => {
    const outcome = resolveViciousMurk({
      graph: map(), currentLocationId: 'loch', previousLocationId: 'shore', season: 'Summer'
    });
    expect(outcome).toEqual({
      status: 'resolved',
      value: {
        currentLocationId: 'shore',
        blockedLocation: {
          id: 'vicious-murk:loch:Summer', kind: 'vicious-murk', locationId: 'loch', activeSeason: 'Summer',
          blocksMovementThrough: true, blocksForaging: true
        }
      },
      messages: []
    });
    expect(resolveViciousMurk({
      graph: map(), currentLocationId: 'shore', previousLocationId: 'channel', season: 'Summer'
    }).status).toBe('invalid');
  });
});

describe('p.94 Unbuckled', () => {
  const map = () => graph(
    node('origin', 0, 0, 'Forest'),
    node('halfway', 2, 0, 'Meadow'),
    node('destination', 4, 0, 'Mountain'),
    node('cache-place', 3, 1, 'Bog')
  );

  it('allows Safe Descent only at the UI-verified first half of the Flightpath', () => {
    expect(resolveUnbuckled({
      transactionId: 'soar:1', choice: 'safe-descent', graph: map(), currentLocationId: 'destination', inventory: [],
      safeDescentLocationIds: ['origin', 'halfway']
    }).status).toBe('needs-input');
    expect(resolveUnbuckled({
      transactionId: 'soar:1', choice: 'safe-descent', graph: map(), currentLocationId: 'destination', inventory: [],
      safeDescentLocationIds: ['origin', 'halfway'], safeDescentLocationId: 'destination'
    }).status).toBe('invalid');
    expect(resolveUnbuckled({
      transactionId: 'soar:1', choice: 'safe-descent', graph: map(), currentLocationId: 'destination', inventory: [],
      safeDescentLocationIds: ['origin', 'halfway'], safeDescentLocationId: 'halfway'
    })).toMatchObject({ status: 'resolved', value: { currentLocationId: 'halfway', cache: null } });
  });

  it.each([
    ['♥', 'reagent'], ['♦', 'reagent'], ['♣', 'tool']
  ] as const)('drops exactly one canonical %s item for the printed suit branch', (suit, type) => {
    const inventory = [reagent('herbs', 3), tool('knife'), { id: 'parcel', name: 'Parcel', type: 'item' as const, weight: 1 }];
    const selectedInventoryItemId = type === 'reagent' ? 'herbs' : 'knife';
    const outcome = resolveUnbuckled({
      transactionId: `soar:${suit}`, choice: 'too-important', graph: map(), currentLocationId: 'destination', inventory,
      dropSuit: suit, selectedInventoryItemId, cacheLocationId: 'cache-place'
    });
    expect(outcome).toMatchObject({
      status: 'resolved',
      value: {
        currentLocationId: 'destination', droppedItemIds: [selectedInventoryItemId],
        cache: { rarity: 10, locationId: 'cache-place', status: 'available' }
      }
    });
    if (type === 'reagent') {
      expect(outcome.value?.inventory.find(item => item.id === 'herbs')?.quantity).toBe(2);
      expect(outcome.value?.cache?.items[0].quantity).toBe(1);
    } else {
      expect(outcome.value?.inventory.some(item => item.id === 'knife')).toBe(false);
    }
  });

  it('drops every Bag item on spades, but does not invent a Trinket loss', () => {
    const inventory = [reagent('herb'), tool('knife'), { id: 'parcel', name: 'Parcel', type: 'item' as const, weight: 1 }];
    const outcome = resolveUnbuckled({
      transactionId: 'soar:spade', choice: 'too-important', graph: map(), currentLocationId: 'destination', inventory,
      dropSuit: '♠', cacheLocationId: 'cache-place'
    });
    expect(outcome).toMatchObject({ status: 'resolved', value: { inventory: [], droppedItemIds: ['herb', 'knife', 'parcel'] } });
  });

  it('recovers the exact cached goods only by Foraging at that Location at Rarity 10', () => {
    const dropped = resolveUnbuckled({
      transactionId: 'soar:recover', choice: 'too-important', graph: map(), currentLocationId: 'destination',
      inventory: [reagent('herb')], dropSuit: '♥', selectedInventoryItemId: 'herb', cacheLocationId: 'cache-place'
    }).value!.cache!;
    expect(recoverUnbuckledCache({ cache: dropped, currentLocationId: 'destination', card: 10, foragingPoints: 0 }).status).toBe('invalid');
    expect(recoverUnbuckledCache({ cache: dropped, currentLocationId: 'cache-place', card: 7, foragingPoints: 2, spendForagingPoints: true }).status).toBe('needs-input');
    const recovered = recoverUnbuckledCache({
      cache: dropped, currentLocationId: 'cache-place', card: 7, foragingPoints: 4, spendForagingPoints: true
    });
    expect(recovered).toMatchObject({
      status: 'resolved', value: { cache: { status: 'recovered' }, foragingPoints: 1, foragingPointsSpent: 3 }
    });
    expect(recovered.value?.recoveredItems.map(item => item.id)).toEqual(['herb']);
    expect(recoverUnbuckledCache({
      cache: recovered.value!.cache, currentLocationId: 'cache-place', card: 12, foragingPoints: 1
    }).status).toBe('invalid');
  });
});

describe('p.99 Electrician', () => {
  const map = () => graph(
    node('ruin', 0, 0, 'Titan', [], 'Titan Ruin'),
    node('village', 2, 0, 'Forest', [], 'Settlement'),
    node('city', 4, 0, 'Meadow', [], 'City'),
    node('wild', 1, 0, 'Forest')
  );

  it('keeps each 2-10 result in one repeatable draw loop with one Day per draw', () => {
    expect(resolveElectricianRepair({ graph: map(), ruinLocationId: 'ruin', season: 'Autumn', draws: [] }))
      .toMatchObject({ status: 'needs-input', value: { markedDays: 1, repairDrawCount: 0 } });
    expect(resolveElectricianRepair({ graph: map(), ruinLocationId: 'ruin', season: 'Autumn', draws: [5] }))
      .toMatchObject({ status: 'needs-input', value: { markedDays: 1, trinketsGained: 1 } });
    expect(resolveElectricianRepair({
      graph: map(), ruinLocationId: 'ruin', season: 'Autumn', draws: [5], stopAfterLatestRepair: true
    })).toMatchObject({
      status: 'resolved', value: { finalOutcome: 'stopped-after-repair', markedDays: 1, trinketsGained: 1 }
    });
    expect(resolveElectricianRepair({
      graph: map(), ruinLocationId: 'ruin', season: 'Autumn', draws: [5, 7, 11]
    })).toMatchObject({
      status: 'resolved',
      value: {
        finalOutcome: 'settlement-after-season', markedDays: 3, trinketsGained: 2,
        convertRuinAfterSeason: { locationId: 'ruin', activeSeason: 'Autumn', newLocationType: 'Settlement' }
      }
    });
  });

  it('makes Ace movement a typed Settlement choice and ends the Journey through the Season', () => {
    expect(resolveElectricianRepair({
      graph: map(), ruinLocationId: 'ruin', season: 'Winter', draws: [3, 1]
    })).toMatchObject({
      status: 'needs-input', value: { finalOutcome: 'electrocuted', markedDays: 2, trinketsGained: 1, endJourney: true }
    });
    expect(resolveElectricianRepair({
      graph: map(), ruinLocationId: 'ruin', season: 'Winter', draws: [3, 1], wakeSettlementLocationId: 'wild'
    }).status).toBe('invalid');
    expect(resolveElectricianRepair({
      graph: map(), ruinLocationId: 'ruin', season: 'Winter', draws: [3, 1], wakeSettlementLocationId: 'village'
    })).toMatchObject({
      status: 'resolved',
      value: {
        finalOutcome: 'electrocuted', markedDays: 2, trinketsGained: 1,
        currentLocationId: 'village', settlementLocationId: 'village', endJourney: true, restUntilNextSeason: true
      }
    });
  });

  it('rejects extra draws after a terminal M/J or Ace result', () => {
    expect(resolveElectricianRepair({
      graph: map(), ruinLocationId: 'ruin', season: 'Spring', draws: [11, 4]
    }).status).toBe('invalid');
    expect(resolveElectricianRepair({
      graph: map(), ruinLocationId: 'ruin', season: 'Spring', draws: [1, 4], wakeSettlementLocationId: 'village'
    }).status).toBe('invalid');
  });
});

describe('persisted travel encounter world changes', () => {
  it('normalizes recoverable legacy/partial data without inventing malformed entries', () => {
    const world = normalizeTravelEncounterWorldState({
      locationBlocks: [
        { id: 'murk', kind: 'vicious-murk', locationId: 'loch', activeSeason: 'Summer' },
        { id: 'bad', kind: 'vicious-murk', locationId: '', activeSeason: 'Monsoon' }
      ],
      unbuckledCaches: [{
        id: 'cache', kind: 'unbuckled-cache', sourceEncounterId: 'travel-soar-5-6',
        locationId: 'hill', rarity: 10, status: 'available', items: [reagent('herb')]
      }],
      deferredConversions: [{
        id: 'lights', kind: 'electrician-settlement', locationId: 'ruin',
        activeSeason: 'Autumn', newLocationType: 'Settlement'
      }]
    });
    expect(world.locationBlocks).toEqual([expect.objectContaining({
      id: 'murk', blocksMovementThrough: true, blocksForaging: true
    })]);
    expect(world.unbuckledCaches).toHaveLength(1);
    expect(world.deferredConversions).toHaveLength(1);
    expect(normalizeTravelEncounterWorldState(world)).toEqual(world);
  });

  it('expires Vicious Murk and activates Electrician only after the season changes', () => {
    const world = normalizeTravelEncounterWorldState({
      locationBlocks: [{
        id: 'murk', kind: 'vicious-murk', locationId: 'loch', activeSeason: 'Summer',
        blocksMovementThrough: true, blocksForaging: true
      }],
      deferredConversions: [{
        id: 'lights', kind: 'electrician-settlement', locationId: 'ruin',
        activeSeason: 'Summer', newLocationType: 'Settlement'
      }]
    });
    expect(isTravelEncounterLocationBlocked(world, 'loch', 'Summer', 'forage')).toBe(true);
    const sameSeason = settleTravelEncounterSeason(world, 'Summer');
    expect(sameSeason.world.locationBlocks).toHaveLength(1);
    expect(sameSeason.convertedLocationIds).toEqual([]);
    const autumn = settleTravelEncounterSeason(world, 'Autumn');
    expect(autumn.world.locationBlocks).toEqual([]);
    expect(autumn.expiredBlockLocationIds).toEqual(['loch']);
    expect(autumn.convertedLocationIds).toEqual(['ruin']);
  });
});
