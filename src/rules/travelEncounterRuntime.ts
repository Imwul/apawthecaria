import { getRuleCardValue, type RuleCard } from './cards';
import type { EngineInventoryItem, TravelGraphNode } from './gameplay';
import type { CardSuit, Season } from './types';

export type TravelEncounterRuntimeStatus = 'resolved' | 'needs-input' | 'invalid';

export interface TravelEncounterRuntimeResolution<T> {
  status: TravelEncounterRuntimeStatus;
  value: T | null;
  messages: string[];
}

export type CardinalDirection = 'north' | 'south' | 'east' | 'west';

export const WASHED_AWAY_DIRECTION_BY_SUIT: Readonly<Record<CardSuit, CardinalDirection>> = {
  '♥': 'north',
  '♦': 'south',
  '♣': 'east',
  '♠': 'west'
};

const resolved = <T>(value: T, messages: string[] = []): TravelEncounterRuntimeResolution<T> => ({
  status: 'resolved', value, messages
});

const needsInput = <T>(value: T, messages: string[]): TravelEncounterRuntimeResolution<T> => ({
  status: 'needs-input', value, messages
});

const invalid = <T>(message: string): TravelEncounterRuntimeResolution<T> => ({
  status: 'invalid', value: null, messages: [message]
});

const isFinitePoint = (node: TravelGraphNode | undefined): node is TravelGraphNode & { x: number; y: number } =>
  Boolean(node && Number.isFinite(node.x) && Number.isFinite(node.y));

const liesInDirection = (
  origin: TravelGraphNode & { x: number; y: number },
  candidate: TravelGraphNode & { x: number; y: number },
  direction: CardinalDirection
): boolean => {
  if (direction === 'north') return candidate.y < origin.y;
  if (direction === 'south') return candidate.y > origin.y;
  if (direction === 'east') return candidate.x > origin.x;
  return candidate.x < origin.x;
};

const squaredDistance = (
  left: TravelGraphNode & { x: number; y: number },
  right: TravelGraphNode & { x: number; y: number }
): number => (left.x - right.x) ** 2 + (left.y - right.y) ** 2;

/**
 * p.82 uses map geometry, not graph connectivity: move to the nearest Location
 * in the drawn cardinal direction. Equidistant candidates remain an explicit
 * player choice because the rulebook supplies no tie-breaker.
 */
export const findNearestDirectionalLocations = (input: {
  graph: Record<string, TravelGraphNode>;
  originLocationId: string;
  suit: CardSuit;
}): TravelEncounterRuntimeResolution<{
  direction: CardinalDirection;
  distance: number;
  candidateLocationIds: string[];
}> => {
  const origin = input.graph[input.originLocationId];
  if (!isFinitePoint(origin)) return invalid('Washed Away requires map coordinates for the current Location.');
  const direction = WASHED_AWAY_DIRECTION_BY_SUIT[input.suit];
  const candidates = Object.values(input.graph)
    .filter((node): node is TravelGraphNode & { x: number; y: number } =>
      node.id !== origin.id && isFinitePoint(node) && liesInDirection(origin, node, direction))
    .map(node => ({ node, distanceSquared: squaredDistance(origin, node) }))
    .sort((left, right) => left.distanceSquared - right.distanceSquared || left.node.name.localeCompare(right.node.name));
  if (candidates.length === 0) return invalid(`There is no mapped Location to the ${direction}.`);
  const minimum = candidates[0].distanceSquared;
  const epsilon = Math.max(1, minimum) * Number.EPSILON * 16;
  const tied = candidates.filter(row => Math.abs(row.distanceSquared - minimum) <= epsilon);
  return resolved({
    direction,
    distance: Math.sqrt(minimum),
    candidateLocationIds: tied.map(row => row.node.id)
  });
};

export interface WashedAwayOutcome {
  route: string[];
  currentLocationId: string;
  consumedDraws: number;
  nextDrawRequired: boolean;
  unresolvedTie: null | {
    drawIndex: number;
    suit: CardSuit;
    candidateLocationIds: string[];
  };
}

/** Resolve as many p.82 redraws as have actually been supplied. */
export const resolveWashedAway = (input: {
  graph: Record<string, TravelGraphNode>;
  startLocationId: string;
  drawnSuits: readonly CardSuit[];
  /** One entry per draw; only required when the nearest distance is tied. */
  selectedTargetLocationIds?: readonly (string | null | undefined)[];
}): TravelEncounterRuntimeResolution<WashedAwayOutcome> => {
  if (!input.graph[input.startLocationId]) return invalid('Washed Away requires a current map Location.');
  if (input.drawnSuits.length === 0) {
    return needsInput({
      route: [input.startLocationId], currentLocationId: input.startLocationId,
      consumedDraws: 0, nextDrawRequired: true, unresolvedTie: null
    }, ['Draw a card for Washed Away.']);
  }

  const route = [input.startLocationId];
  let currentLocationId = input.startLocationId;
  for (let index = 0; index < input.drawnSuits.length; index += 1) {
    const suit = input.drawnSuits[index];
    const nearest = findNearestDirectionalLocations({ graph: input.graph, originLocationId: currentLocationId, suit });
    if (nearest.status === 'invalid' || !nearest.value) return invalid(nearest.messages[0] || 'Washed Away cannot find the nearest Location.');
    const candidates = nearest.value.candidateLocationIds;
    const selected = input.selectedTargetLocationIds?.[index] || null;
    if (selected && !candidates.includes(selected)) {
      return invalid('The selected Washed Away destination is not tied for the nearest Location in the drawn direction.');
    }
    if (candidates.length > 1 && !selected) {
      return needsInput({
        route,
        currentLocationId,
        consumedDraws: index,
        nextDrawRequired: false,
        unresolvedTie: { drawIndex: index, suit, candidateLocationIds: candidates }
      }, ['Two or more Locations are equally near in that direction. Choose one; the rulebook gives no tie-breaker.']);
    }
    currentLocationId = selected || candidates[0];
    route.push(currentLocationId);
    const destination = input.graph[currentLocationId];
    if (destination.region !== 'Loch') {
      return resolved({ route, currentLocationId, consumedDraws: index + 1, nextDrawRequired: false, unresolvedTie: null });
    }
  }
  return needsInput({
    route,
    currentLocationId,
    consumedDraws: input.drawnSuits.length,
    nextDrawRequired: true,
    unresolvedTie: null
  }, ['The nearest Location is another Loch. Draw again and continue Washed Away from there.']);
};

const adjacentLocationIds = (graph: Record<string, TravelGraphNode>, locationId: string): string[] =>
  [...new Set((graph[locationId]?.edges || []).map(edge => edge.to).filter(id => Boolean(graph[id])))];

/** First one-Path steps belonging to any shortest graph route to non-Loch land. */
export const findClosestShoreSteps = (input: {
  graph: Record<string, TravelGraphNode>;
  originLocationId: string;
}): TravelEncounterRuntimeResolution<{ distanceInPaths: number; candidateLocationIds: string[] }> => {
  const origin = input.graph[input.originLocationId];
  if (!origin) return invalid('Choppy Waters requires a current map Location.');
  if (origin.region !== 'Loch') return invalid('Choppy Waters can only resolve from a Loch Location.');

  const queue: Array<{ id: string; distance: number; firstStep: string }> = adjacentLocationIds(input.graph, origin.id)
    .map(id => ({ id, distance: 1, firstStep: id }));
  const bestDistanceByState = new Map<string, number>();
  let shoreDistance = Number.POSITIVE_INFINITY;
  const firstSteps = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.distance > shoreDistance) continue;
    const stateKey = `${current.id}\u0000${current.firstStep}`;
    const seen = bestDistanceByState.get(stateKey);
    if (seen !== undefined && seen <= current.distance) continue;
    bestDistanceByState.set(stateKey, current.distance);
    const node = input.graph[current.id];
    if (!node) continue;
    if (node.region !== 'Loch') {
      if (current.distance < shoreDistance) {
        shoreDistance = current.distance;
        firstSteps.clear();
      }
      if (current.distance === shoreDistance) firstSteps.add(current.firstStep);
      continue;
    }
    adjacentLocationIds(input.graph, node.id).forEach(id => {
      if (id !== origin.id) queue.push({ id, distance: current.distance + 1, firstStep: current.firstStep });
    });
  }

  if (!Number.isFinite(shoreDistance) || firstSteps.size === 0) {
    return invalid('No non-Loch shore is reachable from this Location.');
  }
  return resolved({ distanceInPaths: shoreDistance, candidateLocationIds: [...firstSteps].sort() });
};

const inventoryHasTool = (inventory: readonly EngineInventoryItem[], canonicalToolId: string): boolean =>
  inventory.some(item => item.type === 'tool' && item.canonicalToolId === canonicalToolId && (item.usesRemaining ?? 1) > 0);

const soakedInventoryItemIds = (inventory: readonly EngineInventoryItem[]): string[] =>
  inventory.filter(item => item.type === 'reagent' || item.ruinedWhenSoaked).map(item => item.id);

export type ChoppyWatersBranch = 'desired-direction' | 'closest-shore' | 'capsized';

export interface ChoppyWatersOutcome {
  branch: ChoppyWatersBranch;
  currentLocationId: string;
  eligibleDestinationIds: string[];
  soakedItemIds: string[];
  protectedByWaxedSatchel: boolean;
}

export const resolveChoppyWaters = (input: {
  graph: Record<string, TravelGraphNode>;
  currentLocationId: string;
  card: RuleCard;
  inventory: readonly EngineInventoryItem[];
  destinationLocationId?: string | null;
}): TravelEncounterRuntimeResolution<ChoppyWatersOutcome> => {
  if (!input.graph[input.currentLocationId]) return invalid('Choppy Waters requires a current map Location.');
  let value: number;
  try {
    value = getRuleCardValue(input.card, 'travel');
  } catch (cause) {
    return invalid(cause instanceof Error ? cause.message : 'Choppy Waters requires a valid card.');
  }
  const protectedByWaxedSatchel = inventoryHasTool(input.inventory, 'waxed-satchel');
  if (value === 1) {
    if (input.destinationLocationId && input.destinationLocationId !== input.currentLocationId) {
      return invalid('Capsizing does not move to another Location.');
    }
    return resolved({
      branch: 'capsized',
      currentLocationId: input.currentLocationId,
      eligibleDestinationIds: [input.currentLocationId],
      soakedItemIds: protectedByWaxedSatchel ? [] : soakedInventoryItemIds(input.inventory),
      protectedByWaxedSatchel
    });
  }

  if (value >= 11) {
    const eligibleDestinationIds = [input.currentLocationId, ...adjacentLocationIds(input.graph, input.currentLocationId)];
    if (!input.destinationLocationId) {
      return needsInput({
        branch: 'desired-direction', currentLocationId: input.currentLocationId,
        eligibleDestinationIds, soakedItemIds: [], protectedByWaxedSatchel
      }, ['Choose one adjacent Location, or stay where you are.']);
    }
    if (!eligibleDestinationIds.includes(input.destinationLocationId)) {
      return invalid('J/M Choppy Waters may only stay or move along one adjacent Path.');
    }
    return resolved({
      branch: 'desired-direction', currentLocationId: input.destinationLocationId,
      eligibleDestinationIds, soakedItemIds: [], protectedByWaxedSatchel
    });
  }

  const shore = findClosestShoreSteps({ graph: input.graph, originLocationId: input.currentLocationId });
  if (shore.status === 'invalid' || !shore.value) return invalid(shore.messages[0] || 'No closest shore could be found.');
  if (!input.destinationLocationId) {
    return needsInput({
      branch: 'closest-shore', currentLocationId: input.currentLocationId,
      eligibleDestinationIds: shore.value.candidateLocationIds, soakedItemIds: [], protectedByWaxedSatchel
    }, ['Choose a one-Path step belonging to a shortest route toward the closest shore.']);
  }
  if (!shore.value.candidateLocationIds.includes(input.destinationLocationId)) {
    return invalid('The chosen step does not lead toward a closest shore.');
  }
  return resolved({
    branch: 'closest-shore', currentLocationId: input.destinationLocationId,
    eligibleDestinationIds: shore.value.candidateLocationIds, soakedItemIds: [], protectedByWaxedSatchel
  });
};

const cardTotal = (cards: readonly RuleCard[]): number => cards.reduce<number>(
  (sum, card) => sum + getRuleCardValue(card),
  0
);

export interface PirateCombatOutcome {
  outcome: 'win' | 'lose' | 'tie-unresolved';
  playerTotal: number;
  pirateTotal: number;
  currentLocationId: string;
  eligibleEscapeLocationIds: string[];
  takenPrisoner: boolean;
  endJourney: boolean;
  restUntilNextSeason: boolean;
}

export const resolvePirateCombat = (input: {
  graph: Record<string, TravelGraphNode>;
  currentLocationId: string;
  hasCoracle: boolean;
  hasAdaptedWagon: boolean;
  hasCrossbow: boolean;
  playerCards: readonly RuleCard[];
  pirateCards: readonly RuleCard[];
  escapeLocationId?: string | null;
}): TravelEncounterRuntimeResolution<PirateCombatOutcome> => {
  if (!input.graph[input.currentLocationId]) return invalid('Pi-rats combat requires a current map Location.');
  if (!input.hasCoracle && !input.hasAdaptedWagon) {
    return invalid('Ship-to-Ship Combat requires a Coracle or adapted Wagon.');
  }
  const expectedPlayerCards = input.hasCrossbow ? 2 : 1;
  if (input.playerCards.length !== expectedPlayerCards || input.pirateCards.length !== 2) {
    return invalid(`Draw exactly ${expectedPlayerCards} card${expectedPlayerCards === 1 ? '' : 's'} for yourself and 2 for the pirates.`);
  }
  let playerTotal: number;
  let pirateTotal: number;
  try {
    playerTotal = cardTotal(input.playerCards);
    pirateTotal = cardTotal(input.pirateCards);
  } catch (cause) {
    return invalid(cause instanceof Error ? cause.message : 'Pi-rats combat requires valid cards.');
  }
  const eligibleEscapeLocationIds = adjacentLocationIds(input.graph, input.currentLocationId);
  if (playerTotal === pirateTotal) {
    return needsInput({
      outcome: 'tie-unresolved', playerTotal, pirateTotal,
      currentLocationId: input.currentLocationId, eligibleEscapeLocationIds,
      takenPrisoner: false, endJourney: false, restUntilNextSeason: false
    }, ['The printed rule does not resolve equal totals. Record a table ruling; do not silently award either result.']);
  }
  if (playerTotal < pirateTotal) {
    return resolved({
      outcome: 'lose', playerTotal, pirateTotal,
      currentLocationId: input.currentLocationId, eligibleEscapeLocationIds,
      takenPrisoner: true, endJourney: true, restUntilNextSeason: true
    });
  }
  if (!input.escapeLocationId) {
    return needsInput({
      outcome: 'win', playerTotal, pirateTotal,
      currentLocationId: input.currentLocationId, eligibleEscapeLocationIds,
      takenPrisoner: false, endJourney: false, restUntilNextSeason: false
    }, ['Choose the adjacent Location where you escape.']);
  }
  if (!eligibleEscapeLocationIds.includes(input.escapeLocationId)) {
    return invalid('A Pi-rats victory must escape to an adjacent Location.');
  }
  return resolved({
    outcome: 'win', playerTotal, pirateTotal,
    currentLocationId: input.escapeLocationId, eligibleEscapeLocationIds,
    takenPrisoner: false, endJourney: false, restUntilNextSeason: false
  });
};

export interface ViciousMurkLocationBlock {
  id: string;
  kind: 'vicious-murk';
  locationId: string;
  activeSeason: Season;
  blocksMovementThrough: true;
  blocksForaging: true;
}

export const resolveViciousMurk = (input: {
  graph: Record<string, TravelGraphNode>;
  currentLocationId: string;
  previousLocationId: string;
  season: Season;
}): TravelEncounterRuntimeResolution<{
  currentLocationId: string;
  blockedLocation: ViciousMurkLocationBlock;
}> => {
  if (!input.graph[input.currentLocationId] || !input.graph[input.previousLocationId]) {
    return invalid('Vicious Murk requires both the affected Location and the previous route Location.');
  }
  if (!adjacentLocationIds(input.graph, input.currentLocationId).includes(input.previousLocationId)) {
    return invalid('Vicious Murk must travel back exactly one connected Path.');
  }
  return resolved({
    currentLocationId: input.previousLocationId,
    blockedLocation: {
      id: `vicious-murk:${input.currentLocationId}:${input.season}`,
      kind: 'vicious-murk',
      locationId: input.currentLocationId,
      activeSeason: input.season,
      blocksMovementThrough: true,
      blocksForaging: true
    }
  });
};

export interface UnbuckledForageCache {
  id: string;
  kind: 'unbuckled-cache';
  sourceEncounterId: 'travel-soar-5-6';
  locationId: string;
  rarity: 10;
  items: EngineInventoryItem[];
  status: 'available' | 'recovered';
}

const splitOneInventoryItem = (
  inventory: readonly EngineInventoryItem[],
  itemId: string
): { inventory: EngineInventoryItem[]; dropped: EngineInventoryItem } | null => {
  const selected = inventory.find(item => item.id === itemId);
  if (!selected) return null;
  const quantity = Math.max(1, selected.quantity || 1);
  const dropped = quantity > 1 ? { ...selected, quantity: 1 } : { ...selected };
  const nextInventory = quantity > 1
    ? inventory.map(item => item.id === itemId ? { ...item, quantity: quantity - 1 } : item)
    : inventory.filter(item => item.id !== itemId);
  return { inventory: nextInventory, dropped };
};

export type UnbuckledChoice = 'safe-descent' | 'too-important';

export interface UnbuckledOutcome {
  choice: UnbuckledChoice;
  currentLocationId: string;
  inventory: EngineInventoryItem[];
  cache: UnbuckledForageCache | null;
  droppedItemIds: string[];
}

export const resolveUnbuckled = (input: {
  transactionId: string;
  choice: UnbuckledChoice;
  graph: Record<string, TravelGraphNode>;
  currentLocationId: string;
  inventory: readonly EngineInventoryItem[];
  /** UI-derived locations on the Flightpath no farther than halfway. */
  safeDescentLocationIds?: readonly string[];
  safeDescentLocationId?: string | null;
  dropSuit?: CardSuit;
  selectedInventoryItemId?: string | null;
  cacheLocationId?: string | null;
}): TravelEncounterRuntimeResolution<UnbuckledOutcome> => {
  if (!input.transactionId) return invalid('Unbuckled requires a stable transaction ID.');
  if (!input.graph[input.currentLocationId]) return invalid('Unbuckled requires the Soar destination on the map.');
  if (input.choice === 'safe-descent') {
    const candidates = (input.safeDescentLocationIds || []).filter(id => Boolean(input.graph[id]));
    if (!input.safeDescentLocationId) {
      return needsInput({
        choice: input.choice, currentLocationId: input.currentLocationId,
        inventory: [...input.inventory], cache: null, droppedItemIds: []
      }, ['Choose a mapped Location no farther than halfway along the Flightpath.']);
    }
    if (!candidates.includes(input.safeDescentLocationId)) {
      return invalid('Safe Descent must end at an eligible Location no farther than halfway along the Flightpath.');
    }
    return resolved({
      choice: input.choice, currentLocationId: input.safeDescentLocationId,
      inventory: [...input.inventory], cache: null, droppedItemIds: []
    });
  }

  if (!input.dropSuit) return needsInput({
    choice: input.choice, currentLocationId: input.currentLocationId,
    inventory: [...input.inventory], cache: null, droppedItemIds: []
  }, ['Draw a card to determine what falls.']);
  if (!input.cacheLocationId) return needsInput({
    choice: input.choice, currentLocationId: input.currentLocationId,
    inventory: [...input.inventory], cache: null, droppedItemIds: []
  }, ['Choose and record a mapped Location near the Flightpath for the dropped goods.']);
  if (!input.graph[input.cacheLocationId]) return invalid('The Unbuckled cache must be attached to a mapped Location.');

  let inventory = [...input.inventory];
  let dropped: EngineInventoryItem[];
  if (input.dropSuit === '♠') {
    dropped = [...inventory];
    inventory = [];
  } else {
    const requiredType = input.dropSuit === '♣' ? 'tool' : 'reagent';
    if (!input.selectedInventoryItemId) return needsInput({
      choice: input.choice, currentLocationId: input.currentLocationId,
      inventory, cache: null, droppedItemIds: []
    }, [`Choose one ${requiredType === 'tool' ? 'Tool' : 'Reagent'} to drop.`]);
    const selected = inventory.find(item => item.id === input.selectedInventoryItemId);
    if (!selected || selected.type !== requiredType) {
      return invalid(`${input.dropSuit === '♣' ? 'Clubs' : 'Hearts/Diamonds'} must drop one ${requiredType === 'tool' ? 'Tool' : 'Reagent'}.`);
    }
    const split = splitOneInventoryItem(inventory, selected.id);
    if (!split) return invalid('The selected dropped item is no longer in the Bags.');
    inventory = split.inventory;
    dropped = [split.dropped];
  }

  const cache: UnbuckledForageCache = {
    id: `${input.transactionId}:unbuckled-cache`,
    kind: 'unbuckled-cache',
    sourceEncounterId: 'travel-soar-5-6',
    locationId: input.cacheLocationId,
    rarity: 10,
    items: dropped.map(item => ({ ...item })),
    status: 'available'
  };
  return resolved({
    choice: input.choice,
    currentLocationId: input.currentLocationId,
    inventory,
    cache,
    droppedItemIds: dropped.map(item => item.id)
  });
};

export const recoverUnbuckledCache = (input: {
  cache: UnbuckledForageCache;
  currentLocationId: string;
  card: RuleCard;
  foragingPoints: number;
  spendForagingPoints?: boolean;
}): TravelEncounterRuntimeResolution<{
  cache: UnbuckledForageCache;
  recoveredItems: EngineInventoryItem[];
  foragingPoints: number;
  foragingPointsSpent: number;
}> => {
  if (input.cache.status !== 'available') return invalid('These Unbuckled goods have already been recovered.');
  if (input.currentLocationId !== input.cache.locationId) return invalid('Dropped Unbuckled goods can only be found by Foraging at their recorded Location.');
  let cardValue: number;
  try {
    cardValue = getRuleCardValue(input.card, 'forage');
  } catch (cause) {
    return invalid(cause instanceof Error ? cause.message : 'Cache recovery requires a valid Foraging card.');
  }
  const gap = Math.max(0, input.cache.rarity - cardValue);
  if (gap > 0 && (!input.spendForagingPoints || input.foragingPoints < gap)) {
    return needsInput({
      cache: input.cache, recoveredItems: [], foragingPoints: input.foragingPoints, foragingPointsSpent: 0
    }, [`Card ${cardValue} is below Rarity 10. Spend ${gap} Foraging Point${gap === 1 ? '' : 's'} or leave the cache in place.`]);
  }
  return resolved({
    cache: { ...input.cache, status: 'recovered' },
    recoveredItems: input.cache.items.map(item => ({ ...item })),
    foragingPoints: input.foragingPoints - gap,
    foragingPointsSpent: gap
  });
};

export type ElectricianFinalOutcome = 'stopped-after-repair' | 'settlement-after-season' | 'electrocuted';

export interface ElectricianOutcome {
  finalOutcome: ElectricianFinalOutcome;
  markedDays: number;
  trinketsGained: number;
  repairDrawCount: number;
  currentLocationId: string;
  settlementLocationId: string | null;
  convertRuinAfterSeason: null | {
    locationId: string;
    activeSeason: Season;
    newLocationType: 'Settlement';
  };
  endJourney: boolean;
  restUntilNextSeason: boolean;
}

export interface ElectricianDeferredConversion {
  id: string;
  kind: 'electrician-settlement';
  locationId: string;
  activeSeason: Season;
  newLocationType: 'Settlement';
}

/**
 * Persisted world changes created by the six travel encounters in this
 * module. Keeping them typed and normalized separately from translated
 * journal prose lets legacy saves safely default to an empty ledger.
 */
export interface TravelEncounterWorldState {
  locationBlocks: ViciousMurkLocationBlock[];
  unbuckledCaches: UnbuckledForageCache[];
  deferredConversions: ElectricianDeferredConversion[];
}

export const EMPTY_TRAVEL_ENCOUNTER_WORLD: TravelEncounterWorldState = {
  locationBlocks: [],
  unbuckledCaches: [],
  deferredConversions: []
};

const SEASONS = new Set<Season>(['Spring', 'Summer', 'Autumn', 'Winter']);

export const normalizeTravelEncounterWorldState = (value: unknown): TravelEncounterWorldState => {
  const row = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<TravelEncounterWorldState>
    : {};
  const locationBlocks = Array.isArray(row.locationBlocks)
    ? row.locationBlocks.filter((candidate): candidate is ViciousMurkLocationBlock => Boolean(
      candidate
      && candidate.kind === 'vicious-murk'
      && typeof candidate.id === 'string' && Boolean(candidate.id.trim())
      && typeof candidate.locationId === 'string' && Boolean(candidate.locationId.trim())
      && SEASONS.has(candidate.activeSeason)
    )).map(candidate => ({
      ...candidate,
      blocksMovementThrough: true as const,
      blocksForaging: true as const
    }))
    : [];
  const unbuckledCaches = Array.isArray(row.unbuckledCaches)
    ? row.unbuckledCaches.filter((candidate): candidate is UnbuckledForageCache => Boolean(
      candidate
      && candidate.kind === 'unbuckled-cache'
      && candidate.sourceEncounterId === 'travel-soar-5-6'
      && typeof candidate.id === 'string' && Boolean(candidate.id.trim())
      && typeof candidate.locationId === 'string' && Boolean(candidate.locationId.trim())
      && candidate.rarity === 10
      && (candidate.status === 'available' || candidate.status === 'recovered')
      && Array.isArray(candidate.items)
    )).map(candidate => ({ ...candidate, items: candidate.items.map(item => ({ ...item })) }))
    : [];
  const deferredConversions = Array.isArray(row.deferredConversions)
    ? row.deferredConversions.filter((candidate): candidate is ElectricianDeferredConversion => Boolean(
      candidate
      && candidate.kind === 'electrician-settlement'
      && typeof candidate.id === 'string' && Boolean(candidate.id.trim())
      && typeof candidate.locationId === 'string' && Boolean(candidate.locationId.trim())
      && SEASONS.has(candidate.activeSeason)
      && candidate.newLocationType === 'Settlement'
    )).map(candidate => ({ ...candidate }))
    : [];
  return {
    locationBlocks: [...new Map(locationBlocks.map(block => [block.id, block])).values()],
    unbuckledCaches: [...new Map(unbuckledCaches.map(cache => [cache.id, cache])).values()],
    deferredConversions: [...new Map(deferredConversions.map(change => [change.id, change])).values()]
  };
};

export const settleTravelEncounterSeason = (
  value: unknown,
  nextSeason: Season
): {
  world: TravelEncounterWorldState;
  convertedLocationIds: string[];
  expiredBlockLocationIds: string[];
} => {
  const world = normalizeTravelEncounterWorldState(value);
  const expiredBlockLocationIds = world.locationBlocks
    .filter(block => block.activeSeason !== nextSeason)
    .map(block => block.locationId);
  const convertedLocationIds = world.deferredConversions
    .filter(change => change.activeSeason !== nextSeason)
    .map(change => change.locationId);
  return {
    world: {
      ...world,
      locationBlocks: world.locationBlocks.filter(block => block.activeSeason === nextSeason),
      deferredConversions: world.deferredConversions.filter(change => change.activeSeason === nextSeason)
    },
    convertedLocationIds: [...new Set(convertedLocationIds)],
    expiredBlockLocationIds: [...new Set(expiredBlockLocationIds)]
  };
};

export const isTravelEncounterLocationBlocked = (
  value: unknown,
  locationId: string,
  season: Season,
  action: 'move-through' | 'forage'
): boolean => normalizeTravelEncounterWorldState(value).locationBlocks.some(block =>
  block.locationId === locationId
  && block.activeSeason === season
  && (action === 'move-through' ? block.blocksMovementThrough : block.blocksForaging)
);

/**
 * p.99 repeat loop. Each draw after a 2-10 requires another marked Day. The
 * first Day is included here, so callers must not also apply the old static
 * markDays effect when committing this complete outcome.
 */
export const resolveElectricianRepair = (input: {
  graph: Record<string, TravelGraphNode>;
  ruinLocationId: string;
  season: Season;
  draws: readonly RuleCard[];
  /** Required only when the last supplied draw is 2-10. */
  stopAfterLatestRepair?: boolean;
  /** The rule says a nearby Settlement but supplies no deterministic radius. */
  wakeSettlementLocationId?: string | null;
}): TravelEncounterRuntimeResolution<ElectricianOutcome> => {
  const ruin = input.graph[input.ruinLocationId];
  if (!ruin || ruin.locationType !== 'Titan Ruin') return invalid('Electrician must originate at the encountered Titan Ruin.');
  if (input.draws.length === 0) return needsInput({
    finalOutcome: 'stopped-after-repair', markedDays: 1, trinketsGained: 0, repairDrawCount: 0,
    currentLocationId: input.ruinLocationId, settlementLocationId: null,
    convertRuinAfterSeason: null, endJourney: false, restUntilNextSeason: false
  }, ['Mark 1 Day and draw the first repair card.']);

  let trinketsGained = 0;
  for (let index = 0; index < input.draws.length; index += 1) {
    let value: number;
    try {
      value = getRuleCardValue(input.draws[index]);
    } catch (cause) {
      return invalid(cause instanceof Error ? cause.message : 'Electrician requires valid repair cards.');
    }
    const markedDays = index + 1;
    if (value >= 11) {
      if (index !== input.draws.length - 1) return invalid('Electrician M/J ends the repair loop; later draws cannot be applied.');
      return resolved({
        finalOutcome: 'settlement-after-season', markedDays, trinketsGained, repairDrawCount: input.draws.length,
        currentLocationId: input.ruinLocationId, settlementLocationId: null,
        convertRuinAfterSeason: {
          locationId: input.ruinLocationId,
          activeSeason: input.season,
          newLocationType: 'Settlement'
        },
        endJourney: false, restUntilNextSeason: false
      });
    }
    if (value === 1) {
      if (index !== input.draws.length - 1) return invalid('Electrician Ace ends the repair loop; later draws cannot be applied.');
      if (!input.wakeSettlementLocationId) {
        return needsInput({
          finalOutcome: 'electrocuted', markedDays, trinketsGained, repairDrawCount: input.draws.length,
          currentLocationId: input.ruinLocationId, settlementLocationId: null,
          convertRuinAfterSeason: null, endJourney: true, restUntilNextSeason: true
        }, ['Choose the nearby Settlement where the apothecary wakes. The rulebook supplies no deterministic radius or tie-breaker.']);
      }
      const settlement = input.graph[input.wakeSettlementLocationId];
      if (!settlement || !['Settlement', 'City'].includes(settlement.locationType)) {
        return invalid('Electrician Ace must move to a mapped Settlement or City.');
      }
      return resolved({
        finalOutcome: 'electrocuted', markedDays, trinketsGained, repairDrawCount: input.draws.length,
        currentLocationId: settlement.id, settlementLocationId: settlement.id,
        convertRuinAfterSeason: null, endJourney: true, restUntilNextSeason: true
      });
    }

    trinketsGained += 1;
    const isLast = index === input.draws.length - 1;
    if (isLast && input.stopAfterLatestRepair !== true) {
      return needsInput({
        finalOutcome: 'stopped-after-repair', markedDays, trinketsGained, repairDrawCount: input.draws.length,
        currentLocationId: input.ruinLocationId, settlementLocationId: null,
        convertRuinAfterSeason: null, endJourney: false, restUntilNextSeason: false
      }, ['Take 1 Trinket, then choose whether to stop or mark another Day and draw again.']);
    }
  }

  return resolved({
    finalOutcome: 'stopped-after-repair', markedDays: input.draws.length, trinketsGained,
    repairDrawCount: input.draws.length, currentLocationId: input.ruinLocationId, settlementLocationId: null,
    convertRuinAfterSeason: null, endJourney: false, restUntilNextSeason: false
  });
};
