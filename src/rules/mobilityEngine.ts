import { COMPANION_BY_ID, WAGON_EXPANSION_BY_ID, type CompanionState, type WagonState } from './data/mobility';
import { REAGENT_BY_ID } from './data/reagents';
import { TOOL_BY_ID } from './data/tools';
import type { EngineInventoryItem, EngineJournalEvent, TravelGraphNode } from './gameplay';
import type { CanonicalToolState } from './toolEngine';
import type { Region, Season } from './types';

export interface MobilityCapabilities {
  carryBonus: number;
  speedBonus: number;
  canStopInLoch: boolean;
  canUseWaterway: boolean;
  waterwaySpan: number;
  canSoar: boolean;
  soarDays: number;
  companionSlots: number;
}

export const resolveWagonCapabilities = (wagon: WagonState): MobilityCapabilities => {
  const owned = new Set(wagon.expansionIds.filter(id => WAGON_EXPANSION_BY_ID.has(id)));
  if (!wagon.commissioned) return { carryBonus: 0, speedBonus: 0, canStopInLoch: false, canUseWaterway: false, waterwaySpan: 1, canSoar: false, soarDays: 1, companionSlots: 1 };
  return {
    carryBonus: owned.has('side-brackets') ? 6 : 4,
    speedBonus: owned.has('axel-springs') ? 2 : 1,
    canStopInLoch: owned.has('sealed-carriage'),
    canUseWaterway: owned.has('sealed-carriage'),
    waterwaySpan: owned.has('pedal-motor') ? 2 : 1,
    canSoar: owned.has('experimental-contraption'),
    soarDays: owned.has('experimental-contraption') ? 3 : 1,
    companionSlots: owned.has('hive-brackets') ? 2 : 1
  };
};

export const resolveWaterwayPermissions = (tools: CanonicalToolState[], wagon: WagonState) => {
  const activeToolIds = new Set(tools.filter(tool => !tool.broken && !tool.consumed).map(tool => tool.toolId));
  const capabilities = resolveWagonCapabilities(wagon);
  const hasCoracle = activeToolIds.has('bark-coracle');
  return {
    canStopInLoch: hasCoracle || capabilities.canStopInLoch,
    protectsFromSoaking: hasCoracle || activeToolIds.has('waxed-satchel') || capabilities.canUseWaterway,
    waterwaySpan: capabilities.waterwaySpan
  };
};

export const commissionWagon = (input: { wagon: WagonState; isCity: boolean; trinkets: number }) => {
  if (!input.isCity || input.trinkets < 20 || input.wagon.commissioned) throw new Error('Commissioning a Wagon requires a City, 20 Trinkets, and no existing Wagon.');
  return { wagon: { ...input.wagon, commissioned: true }, trinkets: input.trinkets - 20 };
};

export const installWagonExpansion = (input: { wagon: WagonState; expansionId: string; locationName: string; isCity: boolean; trinkets: number; recycleCoracle?: boolean }) => {
  const expansion = WAGON_EXPANSION_BY_ID.get(input.expansionId);
  if (!expansion) throw new Error('Unknown Wagon Expansion.');
  if (!input.isCity || (expansion.location !== 'Any City' && expansion.location !== input.locationName)) throw new Error('Expansion is not available here.');
  const cost = expansion.id === 'sealed-carriage' && input.recycleCoracle ? expansion.cost - 5 : expansion.cost;
  if (input.trinkets < cost) throw new Error('Not enough Trinkets.');
  if (input.wagon.expansionIds.includes(expansion.id)) throw new Error('Expansion is already installed.');
  if (!input.wagon.commissioned) throw new Error('Commission the Wagon first.');
  if (expansion.id === 'base-unit') throw new Error('The commissioned Wagon already includes its Base Unit.');
  return {
    wagon: { ...input.wagon, commissioned: true, expansionIds: [...input.wagon.expansionIds, expansion.id] },
    trinkets: input.trinkets - cost
  };
};

export const advanceCompanions = (companions: CompanionState[], paths: number) => companions.map(row => {
  const nextPaths = row.pathsTravelled + Math.max(0, paths);
  if (row.companionId === 'wasp' && nextPaths >= 10) return {
    ...row,
    pathsTravelled: nextPaths % 10,
    pendingForage: 'insect' as const,
    pendingForageDraws: (row.pendingForageDraws || 0) + Math.floor(nextPaths / 10)
  };
  return { ...row, pathsTravelled: nextPaths % 10 };
});

export interface CompanionTravelOutcome {
  companions: CompanionState[];
  honeyHarvests: number;
  waspForageDraws: number;
}

export const resolveCompanionTravel = (companions: CompanionState[], paths: number): CompanionTravelOutcome => {
  let honeyHarvests = 0;
  let waspForageDraws = 0;
  const safePaths = Math.max(0, paths);
  const next = companions.map(row => {
    const total = row.pathsTravelled + safePaths;
    const milestones = Math.floor(total / 10);
    if (row.companionId === 'honeybee') honeyHarvests += milestones;
    if (row.companionId === 'wasp') waspForageDraws += milestones;
    return row.companionId === 'wasp' && milestones > 0
      ? { ...row, pathsTravelled: total % 10, pendingForage: 'insect' as const, pendingForageDraws: (row.pendingForageDraws || 0) + milestones }
      : { ...row, pathsTravelled: total % 10 };
  });
  return { companions: next, honeyHarvests, waspForageDraws };
};

export const resolveCompanionForageDraw = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const wasp = input.state.companions.find(row => row.companionId === 'wasp' && (row.pendingForageDraws || 0) > 0);
  if (!wasp) return { status: 'invalid', value: null, messages: ['No Wasp Foraging draw is ready.'] };
  const companions = input.state.companions.map(row => {
    if (row.instanceId !== wasp.instanceId) return row;
    const pendingForageDraws = Math.max(0, (row.pendingForageDraws || 0) - 1);
    return { ...row, pendingForageDraws, pendingForage: pendingForageDraws > 0 ? 'insect' as const : null };
  });
  return {
    status: 'resolved',
    value: {
      ...input.state,
      companions,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'foraging', title: 'Wasp Foraging draw',
        text: 'Consumed one Insect-only Foraging draw earned after ten Paths.'
      }]
    },
    messages: []
  };
};

export const advanceCompanionSeason = (companions: CompanionState[], _season: Season) => companions.map(row => {
  const seasonsTravelled = row.seasonsTravelled + 1;
  return row.companionId === 'caterpillar' && seasonsTravelled >= 1
    ? { ...row, companionId: 'butterfly', seasonsTravelled: 0 }
    : { ...row, seasonsTravelled };
});

export const canUseCompanion = (state: CompanionState, trigger: 'beast' | 'behemoth' | 'loch-redraw') => {
  if (!COMPANION_BY_ID.has(state.companionId)) return false;
  if (trigger === 'beast') return state.companionId === 'beetle' && !state.usedThisJourney;
  if (trigger === 'behemoth') return state.companionId === 'cranky-contraption';
  return state.companionId === 'pond-skimmer' && !state.usedThisJourney;
};

export interface MobilityPassenger {
  id: string;
  name: string;
  origin: string;
  destination: string;
  destinationType: 'nearby_settlement' | 'distant_settlement' | 'city';
  reward: number;
  roleBenefit: string;
  pickedUpAtDay: number;
  originId?: string;
  destinationId?: string;
  ingenuitiveToolId?: string;
}

export interface PassengerDestinationOption {
  destinationId: string;
  destination: string;
  destinationType: MobilityPassenger['destinationType'];
  reward: number;
  distance: number;
}

const passengerDistances = (graph: Record<string, TravelGraphNode>, originId: string): Map<string, number> => {
  const distances = new Map<string, number>();
  if (!graph[originId]) return distances;
  const queue: Array<[string, number]> = [[originId, 0]];
  distances.set(originId, 0);
  while (queue.length > 0) {
    const [id, distance] = queue.shift()!;
    for (const edge of graph[id].edges) {
      if (!graph[edge.to] || distances.has(edge.to)) continue;
      distances.set(edge.to, distance + 1);
      queue.push([edge.to, distance + 1]);
    }
  }
  return distances;
};

export const getPassengerDestinationOptions = (
  graph: Record<string, TravelGraphNode>,
  originId: string
): PassengerDestinationOption[] => {
  const origin = graph[originId];
  if (!origin) return [];
  const distances = passengerDistances(graph, originId);
  const settlements = Object.values(graph).filter(node => node.id !== originId && node.locationType === 'Settlement' && distances.has(node.id));
  const cities = Object.values(graph).filter(node => node.id !== originId && node.locationType === 'City' && distances.has(node.id));
  const nearestSettlementDistance = settlements.length > 0 ? Math.min(...settlements.map(node => distances.get(node.id)!)) : Infinity;
  const nearestCityDistance = cities.length > 0 ? Math.min(...cities.map(node => distances.get(node.id)!)) : Infinity;
  const options: PassengerDestinationOption[] = [];
  settlements.forEach(node => {
    const distance = distances.get(node.id)!;
    if (distance === nearestSettlementDistance) options.push({ destinationId: node.id, destination: node.name, destinationType: 'nearby_settlement', reward: 1, distance });
    if (node.region !== origin.region && distance >= 10) options.push({ destinationId: node.id, destination: node.name, destinationType: 'distant_settlement', reward: 2, distance });
  });
  cities.forEach(node => {
    const distance = distances.get(node.id)!;
    if (distance > nearestCityDistance) options.push({ destinationId: node.id, destination: node.name, destinationType: 'city', reward: 4, distance });
  });
  return options;
};

export interface MobilityRuntimeState {
  wagon: WagonState;
  companions: CompanionState[];
  storedCompanions: CompanionState[];
  passenger: MobilityPassenger | null;
  passengerPickupReady: boolean;
  reputation: number;
  trinkets: number;
  inventory: EngineInventoryItem[];
  season: Season;
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
  downtimeRequired?: boolean;
  downtimeCompleted?: boolean;
  behemothPursuitActive?: boolean;
}

export interface MobilityResolution {
  status: 'resolved' | 'invalid';
  value: MobilityRuntimeState | null;
  messages: string[];
}

const invalidTransaction = (transactionId: string, state: MobilityRuntimeState) => !transactionId
  ? 'Mobility action requires a transaction ID.'
  : state.appliedTransactionIds.includes(transactionId) ? 'Mobility transaction was already applied.' : null;

const reagentItem = (transactionId: string, reagentId: string, index: number): EngineInventoryItem | null => {
  const reagent = REAGENT_BY_ID.get(reagentId);
  const preparation = reagent?.preparations[0];
  if (!reagent || !preparation) return null;
  return {
    id: `${transactionId}:${reagentId}:${index}`,
    name: `${reagent.displayName} (${preparation.name})`,
    type: 'reagent',
    weight: preparation.weight,
    canonicalReagentId: reagent.id,
    preparationId: preparation.id,
    usesRemaining: preparation.uses,
    quantity: 1
  };
};

export const resolveCompanionTrigger = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  trigger: 'beast' | 'behemoth' | 'loch-redraw';
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const companion = input.state.companions.find(row => canUseCompanion(row, input.trigger));
  if (!companion) return { status: 'invalid', value: null, messages: ['No available canonical Companion matches this trigger.'] };
  const consumed = input.trigger === 'behemoth';
  const companions = consumed
    ? input.state.companions.filter(row => row.instanceId !== companion.instanceId)
    : input.state.companions.map(row => row.instanceId === companion.instanceId ? { ...row, usedThisJourney: true } : row);
  return {
    status: 'resolved',
    value: {
      ...input.state,
      companions,
      behemothPursuitActive: consumed ? false : input.state.behemothPursuitActive,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'travel', title: `Companion trigger: ${companion.companionId}`,
        text: consumed ? 'The Companion was discarded after preventing the Behemoth outcome.' : `The ${input.trigger} benefit was used for this Journey.`
      }]
    },
    messages: []
  };
};

export const resolveMobilityJourneyStart = (input: { transactionId: string; state: MobilityRuntimeState; clayPotReagentId?: string | null }): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  let wagon = input.state.wagon;
  if (wagon.commissioned && wagon.expansionIds.includes('clay-pots')) {
    const reagent = input.clayPotReagentId ? REAGENT_BY_ID.get(input.clayPotReagentId) : null;
    if (!reagent || reagent.type !== 'PLANT' || reagent.seasonAvailability[input.state.season] === 'Unavailable') {
      return { status: 'invalid', value: null, messages: ['Clay Pots require one Plant Reagent that is in Season at the start of the Journey.'] };
    }
    wagon = { ...wagon, clayPotReagentId: reagent.id, clayPotMoves: 0 };
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      wagon,
      companions: input.state.companions.map(companion => ({ ...companion, usedThisJourney: false })),
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
    },
    messages: []
  };
};

export const resolveWagonUpgrade = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  action: 'commission' | 'install';
  expansionId?: string;
  locationName: string;
  isCity: boolean;
  recycleCoracleItemId?: string;
  clayPotReagentId?: string;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (!input.state.downtimeRequired || input.state.downtimeCompleted) {
    return { status: 'invalid', value: null, messages: ['Wagon commissioning and expansion require the one Downtime activity after a Journey.'] };
  }
  const coracle = input.recycleCoracleItemId
    ? input.state.inventory.find(item => item.id === input.recycleCoracleItemId && item.canonicalToolId === 'bark-coracle')
    : null;
  if (input.recycleCoracleItemId && !coracle) return { status: 'invalid', value: null, messages: ['Sealed Carriage recycling requires the selected Bark Coracle in Inventory.'] };
  try {
    const outcome = input.action === 'commission'
      ? commissionWagon({ wagon: input.state.wagon, isCity: input.isCity, trinkets: input.state.trinkets })
      : installWagonExpansion({
        wagon: input.state.wagon,
        expansionId: input.expansionId || '',
        locationName: input.locationName,
        isCity: input.isCity,
        trinkets: input.state.trinkets,
        recycleCoracle: Boolean(coracle)
      });
    let wagon = outcome.wagon;
    if (input.action === 'install' && input.expansionId === 'clay-pots') {
      const reagent = input.clayPotReagentId ? REAGENT_BY_ID.get(input.clayPotReagentId) : null;
      if (!reagent || reagent.type !== 'PLANT' || reagent.seasonAvailability[input.state.season] === 'Unavailable') {
        return { status: 'invalid', value: null, messages: ['Fitting Clay Pots requires one Plant Reagent that is in Season.'] };
      }
      wagon = { ...wagon, clayPotReagentId: reagent.id, clayPotMoves: 0 };
    }
    const label = input.action === 'commission' ? 'Wagon commissioned' : `Wagon expansion installed: ${input.expansionId}`;
    return {
      status: 'resolved',
      value: {
        ...input.state,
        wagon,
        trinkets: outcome.trinkets,
        inventory: coracle ? input.state.inventory.filter(item => item.id !== coracle.id) : input.state.inventory,
        downtimeRequired: false,
        downtimeCompleted: true,
        appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
        journalEvents: [...input.state.journalEvents, {
          id: `${input.transactionId}:journal`, type: 'downtime', title: label,
          text: `${input.state.trinkets - outcome.trinkets} Trinkets spent.${coracle ? ' Bark Coracle recycled.' : ''}`
        }]
      },
      messages: []
    };
  } catch (cause) {
    return { status: 'invalid', value: null, messages: [cause instanceof Error ? cause.message : 'Wagon action failed.'] };
  }
};

export const resolveMobilityTravel = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  paths: number;
  destinationName: string;
  destinationType: string;
  harvestClayPot?: boolean;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const companionTravel = resolveCompanionTravel(input.state.companions, input.paths);
  let inventory = [...input.state.inventory];
  const journals: EngineJournalEvent[] = [];
  for (let index = 0; index < companionTravel.honeyHarvests; index += 1) {
    const item = reagentItem(input.transactionId, 'reagent-beehive', index);
    if (item) inventory.push(item);
  }
  if (companionTravel.honeyHarvests > 0) journals.push({
    id: `${input.transactionId}:honeybee`, type: 'travel', title: 'Honeybee milestone',
    text: `Generated ${companionTravel.honeyHarvests} Hive Reagent after travelling ten Paths.`
  });
  if (companionTravel.waspForageDraws > 0) journals.push({
    id: `${input.transactionId}:wasp`, type: 'travel', title: 'Wasp forage pending',
    text: `${companionTravel.waspForageDraws} Insect Foraging draw(s) are ready.`
  });

  let wagon = { ...input.state.wagon };
  if (wagon.commissioned && wagon.expansionIds.includes('clay-pots')) {
    const moves = Math.min(2, wagon.clayPotMoves + 1);
    wagon = { ...wagon, clayPotMoves: moves };
    if (moves >= 2 && input.harvestClayPot && wagon.clayPotReagentId) {
      const reagent = REAGENT_BY_ID.get(wagon.clayPotReagentId);
      const inSeason = reagent?.type === 'PLANT' && reagent.seasonAvailability[input.state.season] !== 'Unavailable';
      if (inSeason) {
        const item = reagentItem(input.transactionId, wagon.clayPotReagentId, 0);
        if (item) inventory.push(item);
        wagon = { ...wagon, clayPotMoves: 0 };
        journals.push({ id: `${input.transactionId}:clay-pots`, type: 'travel', title: 'Clay Pots harvest', text: `${reagent!.canonicalName} was harvested after two Moves.` });
      }
    } else if (moves >= 2) {
      journals.push({ id: `${input.transactionId}:clay-pots-ready`, type: 'travel', title: 'Clay Pots ready', text: 'The planted Reagent is ready and remains available until gathered.' });
    }
  }

  const passengerArrived = Boolean(input.state.passenger
    && input.state.passenger.destination.trim().toLowerCase() === input.destinationName.trim().toLowerCase());
  const passengerReward = passengerArrived ? input.state.passenger!.reward : 0;
  if (passengerArrived) journals.push({
    id: `${input.transactionId}:passenger`, type: 'travel', title: 'Passenger delivered',
    text: `${input.state.passenger!.name} reached ${input.destinationName}; gained ${passengerReward} Trinkets.`
  });
  const shadowCanvasReward = input.destinationType === 'Settlement' && wagon.expansionIds.includes('shadow-canvas') ? 1 : 0;
  if (shadowCanvasReward) journals.push({ id: `${input.transactionId}:shadow-canvas`, type: 'travel', title: 'Shadow Canvas show', text: 'Gained 1 Reputation on arriving in a Settlement.' });

  return {
    status: 'resolved',
    value: {
      ...input.state,
      wagon,
      companions: companionTravel.companions,
      passenger: passengerArrived ? null : input.state.passenger,
      reputation: input.state.reputation + shadowCanvasReward,
      trinkets: input.state.trinkets + passengerReward,
      inventory,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, ...journals]
    },
    messages: []
  };
};

export const resolvePassengerBoarding = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  passenger: Omit<MobilityPassenger, 'id' | 'origin' | 'reward'>;
  origin: string;
  originId: string;
  graph: Record<string, TravelGraphNode>;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (!input.state.wagon.commissioned || !input.state.wagon.expansionIds.includes('passenger-booth')) return { status: 'invalid', value: null, messages: ['Passenger Booth is required.'] };
  if (input.state.passenger || !input.state.passengerPickupReady) return { status: 'invalid', value: null, messages: ['A Passenger is unavailable or already aboard.'] };
  if (!input.passenger.name.trim() || !input.passenger.destination.trim()) return { status: 'invalid', value: null, messages: ['Passenger name and destination are required.'] };
  if (input.passenger.ingenuitiveToolId && !TOOL_BY_ID.has(input.passenger.ingenuitiveToolId)) {
    return { status: 'invalid', value: null, messages: ['Passenger Ingenuitive benefit requires a canonical Tool.'] };
  }
  const validOption = getPassengerDestinationOptions(input.graph, input.originId).find(option =>
    option.destinationId === input.passenger.destinationId && option.destinationType === input.passenger.destinationType
  );
  if (!validOption) return { status: 'invalid', value: null, messages: ['Passenger destination does not satisfy its printed distance, Region, or nearest-location condition.'] };
  const passenger: MobilityPassenger = {
    ...input.passenger,
    destination: validOption.destination,
    destinationId: validOption.destinationId,
    originId: input.originId,
    id: `${input.transactionId}:passenger`,
    origin: input.origin,
    reward: validOption.reward
  };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      passenger,
      passengerPickupReady: false,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'travel', title: 'Passenger boarded', text: `${passenger.name} is travelling to ${passenger.destination}.` }]
    },
    messages: []
  };
};

export const resolvePassengerPickupAvailability = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  currentLocationType: string;
  remedyTraded: boolean;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (!input.state.wagon.commissioned || !input.state.wagon.expansionIds.includes('passenger-booth')) {
    return { status: 'invalid', value: null, messages: ['Passenger Booth is required.'] };
  }
  if (input.state.passenger || input.currentLocationType !== 'Settlement' || !input.remedyTraded) {
    return { status: 'invalid', value: null, messages: ['Passenger pickup becomes available only after trading a Remedy at a Settlement.'] };
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      passengerPickupReady: true,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'treatment', title: 'Passenger available',
        text: 'A Remedy was traded at this Settlement; one Passenger may now board.'
      }]
    },
    messages: []
  };
};

export const resolveClayPotHarvest = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const wagon = input.state.wagon;
  if (!wagon.commissioned || !wagon.expansionIds.includes('clay-pots') || !wagon.clayPotReagentId) {
    return { status: 'invalid', value: null, messages: ['Clay Pots with a planted Reagent are required.'] };
  }
  if (wagon.clayPotMoves < 2) return { status: 'invalid', value: null, messages: ['The Clay Pots must regrow for two Moves before gathering.'] };
  const reagent = REAGENT_BY_ID.get(wagon.clayPotReagentId);
  if (!reagent || reagent.type !== 'PLANT' || reagent.seasonAvailability[input.state.season] === 'Unavailable') {
    return { status: 'invalid', value: null, messages: ['The planted Reagent is not in Season for this Journey.'] };
  }
  const item = reagentItem(input.transactionId, reagent.id, 0);
  if (!item) return { status: 'invalid', value: null, messages: ['The planted Reagent has no canonical Part.'] };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      wagon: { ...wagon, clayPotMoves: 0 },
      inventory: [...input.state.inventory, item],
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'foraging', title: 'Clay Pots harvest',
        text: `${reagent.canonicalName} was gathered without reducing a Timer; the planter now needs two Moves to regrow.`
      }]
    },
    messages: []
  };
};

export const resolvePassengerArrival = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  locationName: string;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const passenger = input.state.passenger;
  if (!passenger || passenger.destination.trim().toLowerCase() !== input.locationName.trim().toLowerCase()) {
    return { status: 'invalid', value: null, messages: ['Passenger rewards are only paid at the recorded destination.'] };
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      passenger: null,
      trinkets: input.state.trinkets + passenger.reward,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'travel', title: 'Passenger delivered',
        text: `${passenger.name} reached ${input.locationName}; gained ${passenger.reward} Trinkets.`
      }]
    },
    messages: []
  };
};

export const resolveCompanionAdoption = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  companionId: string;
  currentRegion: string;
  currentLocationType: string;
  replaceCompanionInstanceId?: string;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const definition = COMPANION_BY_ID.get(input.companionId);
  if (!definition) return { status: 'invalid', value: null, messages: ['Unknown canonical Companion.'] };
  if (input.currentLocationType !== 'City' || !definition.regions.includes(input.currentRegion as Region)) {
    return { status: 'invalid', value: null, messages: ['Companions are adopted in a City of a Region where they can be found.'] };
  }
  if (input.state.trinkets < definition.cost) return { status: 'invalid', value: null, messages: ['Not enough Trinkets.'] };
  const slots = resolveWagonCapabilities(input.state.wagon).companionSlots;
  let companions = [...input.state.companions];
  if (companions.length >= slots) {
    if (!input.replaceCompanionInstanceId || !companions.some(row => row.instanceId === input.replaceCompanionInstanceId)) {
      return { status: 'invalid', value: null, messages: ['Choose which travelling Companion returns to the wild.'] };
    }
    companions = companions.filter(row => row.instanceId !== input.replaceCompanionInstanceId);
  }
  companions.push({
    instanceId: `${input.transactionId}:companion`, companionId: definition.id,
    pathsTravelled: 0, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null, pendingForageDraws: 0
  });
  return {
    status: 'resolved',
    value: {
      ...input.state,
      companions,
      trinkets: input.state.trinkets - definition.cost,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'downtime', title: `Companion adopted: ${definition.canonicalName}`, text: `Paid ${definition.cost} Trinkets.` }]
    },
    messages: []
  };
};

export const resolveCompanionRelease = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  companionInstanceId: string;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const companion = input.state.companions.find(row => row.instanceId === input.companionInstanceId);
  if (!companion) return { status: 'invalid', value: null, messages: ['Companion is not travelling with you.'] };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      companions: input.state.companions.filter(row => row.instanceId !== input.companionInstanceId),
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'downtime', title: 'Companion released', text: `${companion.companionId} returned to the wild.` }]
    },
    messages: []
  };
};

export const resolveCompanionStorage = (input: {
  transactionId: string;
  state: MobilityRuntimeState;
  companionInstanceId: string;
  action: 'store' | 'recall';
  atClinic: boolean;
  hasHiveBoxes: boolean;
}): MobilityResolution => {
  const error = invalidTransaction(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (!input.atClinic || !input.hasHiveBoxes) {
    return { status: 'invalid', value: null, messages: ['Companions can be stored or swapped only at a Clinic with Hive Boxes.'] };
  }
  const source = input.action === 'store' ? input.state.companions : input.state.storedCompanions;
  const companion = source.find(row => row.instanceId === input.companionInstanceId);
  if (!companion) return { status: 'invalid', value: null, messages: ['Companion is not in the selected roster.'] };
  let companions = input.state.companions.filter(row => row.instanceId !== companion.instanceId);
  let storedCompanions = input.state.storedCompanions.filter(row => row.instanceId !== companion.instanceId);
  if (input.action === 'store') {
    storedCompanions.push(companion);
  } else {
    const slots = resolveWagonCapabilities(input.state.wagon).companionSlots;
    if (companions.length >= slots) {
      const swapped = companions.shift();
      if (swapped) storedCompanions.push(swapped);
    }
    companions.push(companion);
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      companions,
      storedCompanions,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'downtime',
        title: input.action === 'store' ? 'Companion stored' : 'Companion recalled',
        text: `${companion.companionId} ${input.action === 'store' ? 'stays at the Clinic.' : 'joins the Journey.'}`
      }]
    },
    messages: []
  };
};
