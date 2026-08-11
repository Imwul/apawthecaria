import { getRuleCardValue, type RuleCard } from './cards';
import { GUILD_SERVICE_BY_ID, type GuildServiceDefinition, type GuildServiceId } from './data/services';
import { REAGENT_BY_ID } from './data/reagents';
import type { EngineInventoryItem, EngineJournalEvent, TravelGraphNode } from './gameplay';
import type { Region, Season } from './types';

export interface ServiceMapMutation {
  id: string;
  serviceId: GuildServiceId;
  kind: 'add-path' | 'convert-waterway' | 'temporary-region' | 'remove-threat';
  nodeIds: string[];
  previousRegion?: Region;
  restoredAtSeason?: Season;
  active: boolean;
  transactionId: string;
}

export interface PendingGuildService {
  transactionId: string;
  serviceId: GuildServiceId;
  status: 'pending-choice' | 'pending-move' | 'pending-delivery' | 'completed' | 'cancelled';
  targetIds: string[];
  itemIds: string[];
  selectedReagentId?: string;
  selectedPreparationId?: string;
  journalNote: string;
  createdAtDay: number;
  sourcePage: number;
}

export interface ServiceMoveOutcome {
  nextState: ServiceRuntimeState;
  skipTravelEncounter: boolean;
  protectNegativeEncounter: boolean;
  consumedServiceId: GuildServiceId | null;
}

export interface ServiceRuntimeState {
  currentLocationId: string;
  currentLocationName: string;
  currentLocationType: TravelGraphNode['locationType'];
  currentRegion: Region;
  currentSeason: Season;
  calendarDays: number;
  trinkets: number;
  inventory: EngineInventoryItem[];
  graph: Record<string, TravelGraphNode>;
  mapMutations: ServiceMapMutation[];
  pendingServices: PendingGuildService[];
  usedJourneyServiceIds: GuildServiceId[];
  weatherProtectionMoves: number;
  weatherProtectionActive: boolean;
  travelEncounterRerolls: number;
  missiveSettlementIds: string[];
  removedThreatIds: string[];
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

export interface GuildServiceInput {
  transactionId: string;
  state: ServiceRuntimeState;
  serviceId: GuildServiceId;
  targetIds?: string[];
  selectedItemIds?: string[];
  selectedReagentId?: string;
  selectedPreparationId?: string;
  selectedToolId?: string;
  option?: 'small' | 'big';
  card?: RuleCard;
  journalNote: string;
}

export interface GuildServiceOutcome {
  transactionId: string;
  service: GuildServiceDefinition;
  nextState: ServiceRuntimeState;
  pendingService: PendingGuildService | null;
  messages: string[];
}

export interface GuildServiceResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: GuildServiceOutcome | null;
  messages: string[];
}

export interface ServiceStateResolution {
  status: 'resolved' | 'invalid';
  value: ServiceRuntimeState | null;
  messages: string[];
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
const isSettlement = (type: TravelGraphNode['locationType']) => type === 'Settlement' || type === 'City';

const locationError = (definition: GuildServiceDefinition, state: ServiceRuntimeState): string | null => {
  const requirement = definition.locationRequirement;
  if (requirement.kind === 'any-settlement-or-city') return isSettlement(state.currentLocationType) ? null : 'This Service requires a Settlement or City.';
  if (requirement.kind === 'any-city') return state.currentLocationType === 'City' ? null : 'This Service requires a City.';
  if (requirement.kind === 'region-settlement') {
    return state.currentLocationType === 'Settlement' && state.currentRegion === requirement.region
      ? null
      : `This Service requires a ${requirement.region} Settlement.`;
  }
  return normalize(state.currentLocationName) === normalize(requirement.location)
    ? null
    : `This Service is only available in ${requirement.location}.`;
};

export const shortestPathDistance = (graph: Record<string, TravelGraphNode>, from: string, to: string): number | null => {
  if (!graph[from] || !graph[to]) return null;
  const queue: Array<[string, number]> = [[from, 0]];
  const seen = new Set([from]);
  while (queue.length > 0) {
    const [id, distance] = queue.shift()!;
    if (id === to) return distance;
    for (const edge of graph[id].edges) {
      if (!graph[edge.to] || seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push([edge.to, distance + 1]);
    }
  }
  return null;
};

export const isNearbyMapLocation = (graph: Record<string, TravelGraphNode>, from: string, to: string): boolean => {
  const source = graph[from];
  const target = graph[to];
  if (!source || !target || from === to || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return false;
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  const nearest = Object.values(graph)
    .filter(node => node.id !== from && node.x !== undefined && node.y !== undefined)
    .map(node => Math.hypot(node.x! - source.x!, node.y! - source.y!))
    .filter(value => value > 0)
    .sort((a, b) => a - b)[0];
  return nearest !== undefined && distance <= nearest * 1.75;
};

const cloneGraph = (graph: Record<string, TravelGraphNode>) => Object.fromEntries(Object.entries(graph).map(([id, node]) => [id, { ...node, edges: node.edges.map(edge => ({ ...edge })) }]));
const appendPath = (graph: Record<string, TravelGraphNode>, a: string, b: string, kind: 'path' | 'waterway' = 'path') => {
  const next = cloneGraph(graph);
  if (!next[a] || !next[b]) return null;
  next[a].edges = [...next[a].edges.filter(edge => edge.to !== b), { to: b, kind }];
  next[b].edges = [...next[b].edges.filter(edge => edge.to !== a), { to: a, kind }];
  return next;
};

const serviceCost = (definition: GuildServiceDefinition, input: GuildServiceInput) => {
  if (!Array.isArray(definition.cost)) return definition.cost;
  if (definition.id === 'catch-of-the-day') return input.option === 'big' ? 2 : 1;
  return definition.cost[0];
};

const makeInventoryItem = (input: GuildServiceInput): EngineInventoryItem | null => {
  if (!input.selectedReagentId || !input.selectedPreparationId) return null;
  const reagent = REAGENT_BY_ID.get(input.selectedReagentId);
  const preparation = reagent?.preparations.find(row => row.id === input.selectedPreparationId);
  if (!reagent || !preparation) return null;
  return {
    id: `${input.transactionId}:item`,
    name: `${reagent.canonicalName} (${preparation.name})`,
    type: 'reagent',
    weight: preparation.weight,
    canonicalReagentId: reagent.id,
    preparationId: preparation.id,
    usesRemaining: preparation.uses
  };
};

const pending = (input: GuildServiceInput, definition: GuildServiceDefinition, status: PendingGuildService['status']): PendingGuildService => ({
  transactionId: input.transactionId,
  serviceId: definition.id,
  status,
  targetIds: [...(input.targetIds || [])],
  itemIds: [...(input.selectedItemIds || [])],
  selectedReagentId: input.selectedReagentId,
  selectedPreparationId: input.selectedPreparationId,
  journalNote: input.journalNote.trim(),
  createdAtDay: input.state.calendarDays,
  sourcePage: definition.sourcePage
});

export const resolveGuildService = (input: GuildServiceInput): GuildServiceResolution => {
  const definition = GUILD_SERVICE_BY_ID.get(input.serviceId);
  if (!definition) return { status: 'invalid', value: null, messages: ['Unknown Guild Service.'] };
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Service transaction is missing or already applied.'] };
  }
  const atError = locationError(definition, input.state);
  if (atError) return { status: 'invalid', value: null, messages: [atError] };
  if (!input.journalNote.trim()) return { status: 'invalid', value: null, messages: ['Guild Services require a journal note.'] };
  const cost = serviceCost(definition, input);
  if (input.state.trinkets < cost) return { status: 'invalid', value: null, messages: [`${definition.name} costs ${cost} Trinkets.`] };
  if (definition.duration === 'once-per-journey' && input.state.usedJourneyServiceIds.includes(definition.id)) {
    return { status: 'invalid', value: null, messages: ['This once-per-Journey Service has already been used.'] };
  }

  let next: ServiceRuntimeState = { ...input.state, trinkets: input.state.trinkets - cost };
  let pendingService: PendingGuildService | null = null;
  const messages: string[] = [];

  if (definition.id === 'forecast') next = { ...next, weatherProtectionMoves: 3 };
  else if (definition.id === 'news-from-the-trail') next = { ...next, travelEncounterRerolls: 1 };
  else if (definition.id === 'send-a-missive') {
    const targets = [...new Set(input.targetIds || [])];
    if (targets.length < 1 || targets.length > 3 || targets.some(id => next.graph[id]?.locationType !== 'Settlement')) {
      return { status: 'invalid', value: null, messages: ['Send a Missive requires one to three real Settlement targets.'] };
    }
    next = { ...next, missiveSettlementIds: [...new Set([...next.missiveSettlementIds, ...targets])] };
  } else if (definition.id === 'retrieval') {
    const target = input.targetIds?.[0];
    const distance = target ? shortestPathDistance(next.graph, next.currentLocationId, target) : null;
    if (!target || next.graph[target]?.locationType !== 'Settlement' || distance === null || distance < 5) {
      return { status: 'invalid', value: null, messages: ['Retrieval requires a Settlement at least 5 Paths away.'] };
    }
    if (input.selectedReagentId && REAGENT_BY_ID.get(input.selectedReagentId)?.type === 'TITAN') {
      return { status: 'invalid', value: null, messages: ['Retrieval cannot request a Titan Reagent.'] };
    }
    pendingService = pending(input, definition, 'pending-delivery');
    next = { ...next, pendingServices: [...next.pendingServices, pendingService] };
  } else if (definition.id === 'send-package') {
    const selected = next.inventory.filter(item => (input.selectedItemIds || []).includes(item.id));
    const weight = selected.reduce((sum, item) => sum + item.weight * Math.max(1, item.quantity || 1), 0);
    if (selected.length === 0 || weight > 5) return { status: 'invalid', value: null, messages: ['Send Package requires selected items totalling no more than 5 Weight.'] };
    pendingService = pending(input, definition, 'pending-delivery');
    next = { ...next, inventory: next.inventory.filter(item => !selected.some(row => row.id === item.id)), pendingServices: [...next.pendingServices, pendingService] };
  } else if (definition.id === 'shortcut') {
    const target = input.targetIds?.[0];
    const node = target ? next.graph[target] : null;
    if (!target || !node || !isNearbyMapLocation(next.graph, next.currentLocationId, target)) {
      return { status: 'invalid', value: null, messages: ['Shortcut requires one nearby map Location other than the current Location.'] };
    }
    next = {
      ...next,
      currentLocationId: target,
      currentLocationName: node.name,
      currentLocationType: node.locationType,
      currentRegion: node.region as Region
    };
  } else if (definition.id === 'survey-paths') {
    const targets = input.targetIds || [];
    if (targets.length === 2) {
      const [a, b] = targets;
      const graph = a && b ? appendPath(next.graph, a, b) : null;
      if (!graph || a === b || !isNearbyMapLocation(next.graph, a, b)) return { status: 'invalid', value: null, messages: ['Survey Paths requires two distinct nearby map Locations.'] };
      const mutation: ServiceMapMutation = { id: `${input.transactionId}:map`, serviceId: definition.id, kind: 'add-path', nodeIds: [a, b], active: true, transactionId: input.transactionId };
      next = { ...next, graph, mapMutations: [...next.mapMutations, mutation] };
    } else {
      const [location, a, b] = targets;
      const existingPath = Boolean(location && a && b && location !== a && location !== b && a !== b
        && next.graph[a]?.edges.some(edge => edge.to === b));
      const first = existingPath ? appendPath(next.graph, location, a) : null;
      const graph = first ? appendPath(first, location, b) : null;
      if (!graph) return { status: 'invalid', value: null, messages: ['Survey Paths can join one Location only to a real existing Path.'] };
      const mutation: ServiceMapMutation = { id: `${input.transactionId}:map`, serviceId: definition.id, kind: 'add-path', nodeIds: [location, a, b], active: true, transactionId: input.transactionId };
      next = { ...next, graph, mapMutations: [...next.mapMutations, mutation] };
    }
  } else if (definition.id === 'build-a-bridge') {
    const [loch, a, b] = input.targetIds || [];
    const valid = next.graph[loch]?.region === 'Loch'
      && next.graph[a]?.region !== 'Loch'
      && next.graph[b]?.region !== 'Loch'
      && next.graph[loch].edges.some(edge => edge.to === a && edge.kind === 'waterway')
      && next.graph[loch].edges.some(edge => edge.to === b && edge.kind === 'waterway');
    if (!valid) return { status: 'invalid', value: null, messages: ['Build a Bridge requires one Loch joined by Waterways to two non-Loch Locations.'] };
    const first = appendPath(next.graph, loch, a);
    const graph = first ? appendPath(first, loch, b) : null;
    const mutation: ServiceMapMutation = { id: `${input.transactionId}:map`, serviceId: definition.id, kind: 'convert-waterway', nodeIds: [loch, a, b], active: true, transactionId: input.transactionId };
    next = { ...next, graph: graph!, mapMutations: [...next.mapMutations, mutation] };
  } else if (definition.id === 'floodplain') {
    const target = input.targetIds?.[0];
    const node = target ? next.graph[target] : null;
    if (!target || !node || node.locationType !== 'Wilds' || node.region === 'Loch') return { status: 'invalid', value: null, messages: ['Floodplain requires one non-Loch Wild Location.'] };
    const graph = cloneGraph(next.graph);
    graph[target] = { ...graph[target], region: 'Loch' };
    const mutation: ServiceMapMutation = { id: `${input.transactionId}:map`, serviceId: definition.id, kind: 'temporary-region', nodeIds: [target], previousRegion: node.region as Region, restoredAtSeason: 'Spring', active: true, transactionId: input.transactionId };
    next = { ...next, graph, mapMutations: [...next.mapMutations, mutation] };
  } else if (definition.id === 'scare-tactics') {
    const target = input.targetIds?.[0];
    if (!target) return { status: 'invalid', value: null, messages: ['Scare Tactics requires one Behemoth-related map target.'] };
    const mutation: ServiceMapMutation = { id: `${input.transactionId}:map`, serviceId: definition.id, kind: 'remove-threat', nodeIds: [target], active: true, transactionId: input.transactionId };
    next = { ...next, removedThreatIds: [...new Set([...next.removedThreatIds, target])], mapMutations: [...next.mapMutations, mutation] };
  } else if (['hitch-a-ride', 'taxi-service', 'smithing'].includes(definition.id)) {
    pendingService = pending(input, definition, definition.id === 'smithing' ? 'pending-choice' : 'pending-move');
    next = { ...next, pendingServices: [...next.pendingServices, pendingService] };
  } else {
    const item = makeInventoryItem(input);
    if (['rug-of-wonders', 'catch-of-the-day', 'take-clippings', 'pick-of-the-deep'].includes(definition.id)) {
      if (!item) return { status: 'invalid', value: null, messages: ['Select a canonical Reagent and Preparation.'] };
      const reagent = REAGENT_BY_ID.get(item.canonicalReagentId!);
      if (definition.id === 'rug-of-wonders' && (reagent!.baseRarity > 9 || reagent!.type === 'TITAN')) return { status: 'invalid', value: null, messages: ['Rug of Wonders is limited to non-Titan Reagents with Base Rarity 9 or lower.'] };
      if (definition.id === 'take-clippings' && reagent!.type !== 'PLANT') return { status: 'invalid', value: null, messages: ['Take Clippings requires a Plant Reagent.'] };
      if (definition.id === 'pick-of-the-deep') {
        const value = input.card ? getRuleCardValue(input.card, 'table') : null;
        if (value === null || reagent!.type !== 'TITAN' || reagent!.baseRarity > value) return { status: 'invalid', value: null, messages: ['Pick of the Deep requires a Titan Reagent no rarer than the drawn card.'] };
      }
      next = { ...next, inventory: [...next.inventory, item] };
    }
  }

  if (definition.duration === 'once-per-journey') next = { ...next, usedJourneyServiceIds: [...next.usedJourneyServiceIds, definition.id] };
  const event: EngineJournalEvent = { id: `${input.transactionId}:journal`, type: 'downtime', title: definition.name, text: input.journalNote.trim() };
  next = { ...next, journalEvents: [...next.journalEvents, event], appliedTransactionIds: [...next.appliedTransactionIds, input.transactionId] };
  return { status: pendingService ? 'manual' : 'resolved', value: { transactionId: input.transactionId, service: definition, nextState: next, pendingService, messages }, messages };
};

export const consumeGuildServiceMove = (input: {
  transactionId: string;
  state: ServiceRuntimeState;
  destinationId: string;
  destinationRegion: Region | 'Soar';
  mode: 'move' | 'soar';
  pathCount: number;
}): { status: 'resolved' | 'invalid'; value: ServiceMoveOutcome | null; messages: string[] } => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Service Move transaction is missing or already applied.'] };
  }
  const pendingMove = input.state.pendingServices.find(service =>
    service.status === 'pending-move' && ['hitch-a-ride', 'taxi-service'].includes(service.serviceId)
  );
  let skipTravelEncounter = false;
  let protectNegativeEncounter = false;
  if (pendingMove?.serviceId === 'hitch-a-ride') {
    const target = pendingMove.targetIds[0];
    if (target && target !== input.destinationId) return { status: 'invalid', value: null, messages: ['Hitch a Ride must end at its recorded destination.'] };
    if (input.mode !== 'move' || input.pathCount < 1 || input.pathCount > 5 || input.destinationRegion !== 'Meadow') {
      return { status: 'invalid', value: null, messages: ['Hitch a Ride travels up to 5 Paths and must end in a Meadow Location.'] };
    }
    skipTravelEncounter = true;
  }
  if (pendingMove?.serviceId === 'taxi-service') {
    if (input.mode !== 'soar') return { status: 'invalid', value: null, messages: ['Taxi Service must be consumed by a Soar Move.'] };
    protectNegativeEncounter = true;
  }
  const pendingServices = input.state.pendingServices.map(service => service.transactionId === pendingMove?.transactionId
    ? { ...service, status: 'completed' as const }
    : service);
  const weatherProtectionActive = input.state.weatherProtectionMoves > 0;
  const weatherProtectionMoves = Math.max(0, input.state.weatherProtectionMoves - 1);
  const event: EngineJournalEvent = {
    id: `${input.transactionId}:journal`, type: 'travel', title: pendingMove ? `${pendingMove.serviceId} consumed` : 'Guild Service Move',
    text: `${pendingMove ? `${pendingMove.serviceId} completed. ` : ''}Forecast protection remaining: ${weatherProtectionMoves}.`
  };
  return {
    status: 'resolved',
    value: {
      nextState: {
        ...input.state,
        pendingServices,
        weatherProtectionMoves,
        weatherProtectionActive,
        appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
        journalEvents: [...input.state.journalEvents, event]
      },
      skipTravelEncounter,
      protectNegativeEncounter,
      consumedServiceId: pendingMove?.serviceId || null
    },
    messages: []
  };
};

const commitServiceState = (
  transactionId: string,
  state: ServiceRuntimeState,
  title: string,
  text: string,
  update: Partial<ServiceRuntimeState>
): ServiceStateResolution => {
  if (!transactionId || state.appliedTransactionIds.includes(transactionId)) {
    return { status: 'invalid', value: null, messages: ['Service transaction is missing or already applied.'] };
  }
  return {
    status: 'resolved',
    value: {
      ...state,
      ...update,
      appliedTransactionIds: [...state.appliedTransactionIds, transactionId],
      journalEvents: [...state.journalEvents, { id: `${transactionId}:journal`, type: 'travel', title, text }]
    },
    messages: []
  };
};

export const consumeGuildServiceTravelReroll = (input: {
  transactionId: string;
  state: ServiceRuntimeState;
}): ServiceStateResolution => {
  if (input.state.travelEncounterRerolls < 1) {
    return { status: 'invalid', value: null, messages: ['No News From The Trail choice remains.'] };
  }
  return commitServiceState(
    input.transactionId,
    input.state,
    'News From The Trail used',
    'Selected one of two Travel Encounter cards before reaching the Journey destination.',
    { travelEncounterRerolls: input.state.travelEncounterRerolls - 1 }
  );
};

export const consumeGuildServiceMissive = (input: {
  transactionId: string;
  state: ServiceRuntimeState;
  settlementId: string;
}): ServiceStateResolution => {
  if (!input.state.missiveSettlementIds.includes(input.settlementId)) {
    return { status: 'invalid', value: null, messages: ['This Settlement has no pending Guild Missive.'] };
  }
  return commitServiceState(
    input.transactionId,
    input.state,
    'Send a Missive used',
    `Selected the Ailment at ${input.state.graph[input.settlementId]?.name || input.settlementId}.`,
    { missiveSettlementIds: input.state.missiveSettlementIds.filter(id => id !== input.settlementId) }
  );
};

export const resolveGuildServiceJourneyStart = (input: {
  transactionId: string;
  state: ServiceRuntimeState;
}): ServiceStateResolution => commitServiceState(
  input.transactionId,
  input.state,
  'Guild Services ready for Journey',
  'Reset once-per-Journey Service use while preserving purchased Move and Settlement effects.',
  { usedJourneyServiceIds: [] }
);

export const resolveGuildServiceJourneyEnd = (input: {
  transactionId: string;
  state: ServiceRuntimeState;
}): ServiceStateResolution => commitServiceState(
  input.transactionId,
  input.state,
  'Journey Guild Services closed',
  'Expired unused News From The Trail choices at the Journey destination.',
  { travelEncounterRerolls: 0, usedJourneyServiceIds: [] }
);

export const completeGuildServiceDelivery = (input: {
  transactionId: string;
  state: ServiceRuntimeState;
  serviceTransactionId: string;
  confirmExternalDelivery?: boolean;
}): GuildServiceResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Delivery transaction is missing or already applied.'] };
  }
  const delivery = input.state.pendingServices.find(service =>
    service.transactionId === input.serviceTransactionId && service.status === 'pending-delivery'
  );
  if (!delivery) return { status: 'invalid', value: null, messages: ['Pending Guild delivery was not found.'] };
  const definition = GUILD_SERVICE_BY_ID.get(delivery.serviceId);
  if (!definition) return { status: 'invalid', value: null, messages: ['Unknown Guild delivery.'] };
  let inventory = input.state.inventory;
  if (delivery.serviceId === 'retrieval') {
    if (input.state.currentLocationId !== delivery.targetIds[0]) {
      return { status: 'invalid', value: null, messages: ['Retrieval is collected only at the recorded Settlement.'] };
    }
    const item = makeInventoryItem({
      transactionId: delivery.transactionId,
      state: input.state,
      serviceId: delivery.serviceId,
      selectedReagentId: delivery.selectedReagentId,
      selectedPreparationId: delivery.selectedPreparationId,
      journalNote: delivery.journalNote
    });
    if (!item) return { status: 'invalid', value: null, messages: ['Retrieval is missing its canonical Reagent and Preparation.'] };
    if (!inventory.some(row => row.id === item.id)) inventory = [...inventory, item];
  } else if (delivery.serviceId === 'send-package' && !input.confirmExternalDelivery) {
    return { status: 'invalid', value: null, messages: ['Confirm that the recipient entered a Settlement or City before completing Send Package.'] };
  }
  const pendingServices = input.state.pendingServices.map(service => service.transactionId === delivery.transactionId
    ? { ...service, status: 'completed' as const }
    : service);
  const event: EngineJournalEvent = {
    id: `${input.transactionId}:journal`, type: 'downtime', title: `${definition.name} completed`,
    text: delivery.serviceId === 'retrieval'
      ? `Collected the requested item at ${input.state.currentLocationName}.`
      : 'The recipient confirmed arrival at a Settlement or City and received the package.'
  };
  const nextState = {
    ...input.state,
    inventory,
    pendingServices,
    appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
    journalEvents: [...input.state.journalEvents, event]
  };
  return { status: 'resolved', value: { transactionId: input.transactionId, service: definition, nextState, pendingService: null, messages: [] }, messages: [] };
};

export const restoreSeasonalServiceMutations = (state: ServiceRuntimeState, season: Season): ServiceRuntimeState => {
  if (season !== 'Spring') return state;
  const graph = cloneGraph(state.graph);
  const mapMutations = state.mapMutations.map(mutation => {
    if (!mutation.active || mutation.kind !== 'temporary-region' || mutation.restoredAtSeason !== 'Spring') return mutation;
    const nodeId = mutation.nodeIds[0];
    if (graph[nodeId] && mutation.previousRegion) graph[nodeId] = { ...graph[nodeId], region: mutation.previousRegion };
    return { ...mutation, active: false };
  });
  const restoredCurrentRegion = graph[state.currentLocationId]?.region;
  return {
    ...state,
    graph,
    mapMutations,
    currentRegion: restoredCurrentRegion && restoredCurrentRegion !== 'Soar' ? restoredCurrentRegion : state.currentRegion
  };
};
