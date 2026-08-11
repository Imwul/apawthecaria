import { findEncounter } from './data/encounters';
import { REAGENT_BY_ID } from './data/reagents';
import type { RuleCard } from './cards';
import type { EngineInventoryItem, GameplayLocationType, PendingEncounterState, TravelGraphNode } from './gameplay';
import type { EncounterDefinition, Season, TravelRegion } from './types';

export interface TravelEngineState {
  currentLocationId: string;
  currentLocationName: string;
  currentRegion: TravelRegion;
  currentLocationType: GameplayLocationType;
  baseSpeed: number;
  carry: number;
  inventory: EngineInventoryItem[];
  calendarDays: number;
  visitedLocationIds: string[];
  needsLocalHelp: boolean;
  canSoar: boolean;
  ridingWagon: boolean;
  experimentalContraption: boolean;
}

export interface TravelEngineInput {
  transactionId: string;
  state: TravelEngineState;
  graph: Record<string, TravelGraphNode>;
  destinationId: string;
  destinationRegion: TravelRegion;
  destinationType: GameplayLocationType;
  mode: 'move' | 'soar';
  card: RuleCard;
  season: Season;
  route?: string[];
  mustUseFullSpeed?: boolean;
  canStopInLoch: boolean;
  protectsFromSoaking?: boolean;
  waterwaySpan?: number;
}

export interface TravelEngineOutcome {
  transactionId: string;
  nextState: TravelEngineState;
  route: string[];
  pathCount: number;
  movementCost: number;
  effectiveSpeed: number;
  overEncumbered: boolean;
  soakedItemIds: string[];
  encounter: EncounterDefinition;
  pendingEncounter: PendingEncounterState;
}

export interface TravelEngineResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: TravelEngineOutcome | null;
  messages: string[];
}

export const resolveBraveTravelEffect = (input: {
  transactionId: string;
  inventory: EngineInventoryItem[];
  encounter: EncounterDefinition;
  region: Exclude<TravelRegion, 'Soar'>;
  card: RuleCard;
  reagentId: string;
  preparationId: string;
}): { status: 'resolved' | 'invalid'; inventory: EngineInventoryItem[]; ignoredNegativeOutcome: boolean; messages: string[] } => {
  const cardSuit = typeof input.card === 'number' ? '' : input.card.suit;
  if (!input.transactionId || !input.encounter.tags?.includes('Behemoth') || !['♥', '♦'].includes(cardSuit || '')) {
    return { status: 'invalid', inventory: input.inventory, ignoredNegativeOutcome: false, messages: ['Brave requires a heart or diamond Travel Encounter with the Behemoth tag.'] };
  }
  const reagent = REAGENT_BY_ID.get(input.reagentId);
  const preparation = reagent?.preparations.find(row => row.id === input.preparationId);
  if (!reagent || !preparation || reagent.baseRarity > 6 || reagent.regionAvailability[input.region] === 'Unavailable') {
    return { status: 'invalid', inventory: input.inventory, ignoredNegativeOutcome: false, messages: ['Brave requires a local Reagent with Base Rarity 6 or lower.'] };
  }
  const item: EngineInventoryItem = {
    id: `${input.transactionId}:item`, name: `${reagent.canonicalName} (${preparation.name}, ${preparation.method})`,
    type: 'reagent', weight: preparation.weight, canonicalReagentId: reagent.id,
    preparationId: preparation.id, usesRemaining: preparation.uses, ruinedWhenSoaked: true
  };
  return {
    status: 'resolved',
    inventory: input.inventory.some(row => row.id === item.id) ? input.inventory : [...input.inventory, item],
    ignoredNegativeOutcome: true,
    messages: ['Brave ended the Behemoth encounter positively and gained one local Reagent.']
  };
};

export const inventoryWeight = (inventory: readonly EngineInventoryItem[]): number =>
  inventory.reduce((total, item) => total + item.weight * Math.max(1, item.quantity || 1), 0);

const edgeTo = (edge: TravelGraphNode['edges'][number]): string => edge.to;

const validateRoute = (
  graph: Record<string, TravelGraphNode>,
  route: readonly string[],
  expectedStart: string,
  expectedEnd: string
): boolean => {
  if (route[0] !== expectedStart || route[route.length - 1] !== expectedEnd) return false;
  return route.slice(0, -1).every((nodeId, index) =>
    graph[nodeId]?.edges.some(edge => edgeTo(edge) === route[index + 1])
  );
};

const routeMovementCost = (
  graph: Record<string, TravelGraphNode>,
  route: readonly string[],
  waterwaySpan: number
): number => {
  let cost = 0;
  let waterwayRun = 0;
  const flushWaterways = () => {
    if (waterwayRun > 0) cost += Math.ceil(waterwayRun / Math.max(1, waterwaySpan));
    waterwayRun = 0;
  };
  route.slice(0, -1).forEach((nodeId, index) => {
    const kind = graph[nodeId]?.edges.find(edge => edge.to === route[index + 1])?.kind || 'path';
    if (kind === 'waterway') waterwayRun += 1;
    else {
      flushWaterways();
      cost += 1;
    }
  });
  flushWaterways();
  return cost;
};

const findRoute = (
  graph: Record<string, TravelGraphNode>,
  start: string,
  destination: string,
  exactCost: number | null,
  waterwaySpan: number
): string[] | null => {
  if (!graph[start] || !graph[destination]) return null;
  const queue: string[][] = [[start]];
  const shortestSeen = new Map<string, number>([[start, 0]]);
  const maximumEdges = exactCost === null ? Number.POSITIVE_INFINITY : exactCost * Math.max(1, waterwaySpan);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const cost = routeMovementCost(graph, path, waterwaySpan);
    if (current === destination && (exactCost === null || cost === exactCost)) return path;
    if (cost > (exactCost ?? Number.POSITIVE_INFINITY) || path.length - 1 >= maximumEdges) continue;
    for (const edge of graph[current]?.edges || []) {
      if (path.includes(edge.to)) continue;
      const nextPath = [...path, edge.to];
      const nextCost = routeMovementCost(graph, nextPath, waterwaySpan);
      if (nextCost > (exactCost ?? Number.POSITIVE_INFINITY)) continue;
      if (exactCost === null) {
        const seen = shortestSeen.get(edge.to);
        if (seen !== undefined && seen <= nextCost) continue;
        shortestSeen.set(edge.to, nextCost);
      }
      queue.push(nextPath);
    }
  }
  return null;
};

const routeUsesWaterway = (graph: Record<string, TravelGraphNode>, route: readonly string[]): boolean =>
  route.slice(0, -1).some((nodeId, index) =>
    graph[nodeId]?.edges.find(edge => edge.to === route[index + 1])?.kind === 'waterway'
  );

export const resolveTravelEngine = (input: TravelEngineInput): TravelEngineResolution => {
  const { state } = input;
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Travel requires a transaction ID.'] };
  if (state.needsLocalHelp) return { status: 'invalid', value: null, messages: ['Help Local Beasts or finish the Barrow Delve before moving.'] };
  const destination = input.graph[input.destinationId];
  if (!destination) return { status: 'invalid', value: null, messages: ['Destination is not present in the map graph.'] };

  const weight = inventoryWeight(state.inventory);
  const overEncumbered = weight > state.carry;
  const effectiveSpeed = overEncumbered ? 1 : Math.max(1, state.baseSpeed);
  const waterwaySpan = Math.max(1, input.waterwaySpan || 1);
  let route: string[];
  let pathCount: number;
  let movementCost: number;
  let days = 1;
  let encounterRegion: TravelRegion = input.destinationRegion;

  if (input.mode === 'soar') {
    if (!state.canSoar) return { status: 'invalid', value: null, messages: ['This apothecary cannot Soar.'] };
    if (overEncumbered) return { status: 'invalid', value: null, messages: ['You cannot Soar while over encumbered.'] };
    if (state.ridingWagon && !state.experimentalContraption) return { status: 'invalid', value: null, messages: ['A normal Wagon cannot Soar.'] };
    if ((input.destinationType === 'Titan Ruin' || input.destinationType === 'Behemoth Barrow')
      && !state.visitedLocationIds.includes(input.destinationId)) {
      return { status: 'invalid', value: null, messages: ['Unvisited Titan Ruins and Behemoth Barrows cannot be Soar destinations.'] };
    }
    route = [state.currentLocationId, input.destinationId];
    pathCount = 0;
    encounterRegion = 'Soar';
    days = state.experimentalContraption ? 3 : 1;
    movementCost = days;
  } else {
    const exactCost = input.mustUseFullSpeed === false ? null : effectiveSpeed;
    route = input.route ? [...input.route] : findRoute(input.graph, state.currentLocationId, input.destinationId, exactCost, waterwaySpan) || [];
    if (!validateRoute(input.graph, route, state.currentLocationId, input.destinationId)) {
      return { status: 'invalid', value: null, messages: ['The supplied destination is not connected by the selected Path route.'] };
    }
    pathCount = route.length - 1;
    movementCost = routeMovementCost(input.graph, route, waterwaySpan);
    if (input.mustUseFullSpeed !== false && movementCost !== effectiveSpeed) {
      return { status: 'invalid', value: null, messages: [`Move must use Speed ${effectiveSpeed}; route costs ${movementCost}.`] };
    }
    if (input.mustUseFullSpeed === false && movementCost > effectiveSpeed) {
      return { status: 'invalid', value: null, messages: [`Route exceeds Speed ${effectiveSpeed}.`] };
    }
  }

  const endsInLoch = input.destinationRegion === 'Loch'
    && input.destinationType !== 'Settlement'
    && input.destinationType !== 'City';
  if (endsInLoch && !input.canStopInLoch) {
    return { status: 'invalid', value: null, messages: ['You cannot normally end a Move in a Loch or River Location.'] };
  }

  const usesWaterway = input.mode === 'move' && routeUsesWaterway(input.graph, route);
  const soakedItemIds = usesWaterway && !input.protectsFromSoaking
    ? state.inventory.filter(item => item.type === 'reagent' || item.ruinedWhenSoaked).map(item => item.id)
    : [];
  const nextInventory = state.inventory.filter(item => !soakedItemIds.includes(item.id));
  const encounterType = input.destinationType === 'Settlement' || input.destinationType === 'City' ? 'social' : 'travel';
  const encounter = findEncounter({
    encounterType,
    region: encounterRegion,
    card: input.card,
    season: input.season,
    locationType: input.destinationType === 'City' ? 'City' : input.destinationType === 'Settlement' ? 'Settlement' : undefined,
    city: input.destinationType === 'City' ? destination.name : undefined
  });
  if (!encounter) return { status: 'invalid', value: null, messages: ['No canonical encounter matches the completed Move.'] };

  const cardValue = typeof input.card === 'number' ? input.card : 'value' in input.card ? input.card.value : input.card.val;
  const cardSuit = typeof input.card === 'number' ? undefined : input.card.suit;
  const pendingEncounter: PendingEncounterState = {
    transactionId: `${input.transactionId}:encounter`,
    encounterId: encounter.id,
    encounter,
    phase: encounter.support === 'implemented' ? 'pending' : 'manual',
    unresolvedEffectCodes: [],
    card: { value: cardValue, suit: cardSuit }
  };
  return {
    status: encounter.support === 'implemented' ? 'resolved' : 'manual',
    value: {
      transactionId: input.transactionId,
      nextState: {
        ...state,
        currentLocationId: input.destinationId,
        currentLocationName: destination.name,
        currentRegion: input.destinationRegion,
        currentLocationType: input.destinationType,
        inventory: nextInventory,
        calendarDays: state.calendarDays + days,
        visitedLocationIds: [...new Set([...state.visitedLocationIds, input.destinationId])],
        needsLocalHelp: true
      },
      route,
      pathCount,
      movementCost,
      effectiveSpeed,
      overEncumbered,
      soakedItemIds,
      encounter,
      pendingEncounter
    },
    messages: encounter.support === 'implemented' ? [] : ['Movement is complete; resolve the printed encounter before continuing.']
  };
};
