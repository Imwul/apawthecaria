import { findEncounter } from './data/encounters';
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

const findRoute = (
  graph: Record<string, TravelGraphNode>,
  start: string,
  destination: string,
  exactPaths: number | null
): string[] | null => {
  if (!graph[start] || !graph[destination]) return null;
  const queue: string[][] = [[start]];
  const shortestSeen = new Map<string, number>([[start, 0]]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const steps = path.length - 1;
    if (current === destination && (exactPaths === null || steps === exactPaths)) return path;
    if (exactPaths !== null && steps >= exactPaths) continue;
    for (const edge of graph[current]?.edges || []) {
      if (path.includes(edge.to)) continue;
      const nextSteps = steps + 1;
      if (exactPaths === null) {
        const seen = shortestSeen.get(edge.to);
        if (seen !== undefined && seen <= nextSteps) continue;
        shortestSeen.set(edge.to, nextSteps);
      }
      queue.push([...path, edge.to]);
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
  let route: string[];
  let pathCount: number;
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
  } else {
    const exactPaths = input.mustUseFullSpeed === false ? null : effectiveSpeed;
    route = input.route ? [...input.route] : findRoute(input.graph, state.currentLocationId, input.destinationId, exactPaths) || [];
    if (!validateRoute(input.graph, route, state.currentLocationId, input.destinationId)) {
      return { status: 'invalid', value: null, messages: ['The supplied destination is not connected by the selected Path route.'] };
    }
    pathCount = route.length - 1;
    if (input.mustUseFullSpeed !== false && pathCount !== effectiveSpeed) {
      return { status: 'invalid', value: null, messages: [`Move must use ${effectiveSpeed} Paths; route uses ${pathCount}.`] };
    }
    if (input.mustUseFullSpeed === false && pathCount > effectiveSpeed) {
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
  const soakedItemIds = usesWaterway && !input.canStopInLoch
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
      movementCost: input.mode === 'soar' ? days : pathCount,
      effectiveSpeed,
      overEncumbered,
      soakedItemIds,
      encounter,
      pendingEncounter
    },
    messages: encounter.support === 'implemented' ? [] : ['Movement is complete; resolve the printed encounter before continuing.']
  };
};
