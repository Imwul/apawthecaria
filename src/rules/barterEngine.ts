import { getRuleCardValue, type RuleCard } from './cards';
import { REAGENT_BY_ID } from './data/reagents';
import {
  immediatelyTreatableAilmentIds,
  withImmediateRemedyCheckpoint,
  withoutImmediateRemedyCheckpoint
} from './immediateRemedyEngine';
import type { TreatmentAilmentTagOverride } from './treatmentEngine';
import type { CanonicalToolState } from './toolEngine';
import type { EngineInventoryItem, EngineJournalEvent } from './gameplay';
import type { PatientState } from './state';
import type { Availability, EncounterDefinition, Region, Season } from './types';

export type BarterLocationType = 'Settlement' | 'City';
export type BarterStatus =
  | 'awaiting-social'
  | 'manual-social'
  | 'awaiting-second-card'
  | 'awaiting-payment'
  | 'failed-awaiting-timer'
  | 'completed'
  | 'abandoned';

export interface BarterMapNode {
  id: string;
  region: Region;
  locationType: 'Wilds' | BarterLocationType | 'Titan Ruin' | 'Behemoth Barrow';
  neighbors: string[];
}

export interface BarterModifier {
  id: 'local' | 'trade-route' | 'in-season' | 'curiosity' | 'fair' | 'tag-3' | 'foul' | 'reputation';
  label: string;
  amount: number;
}

export interface BarterPaymentSelection {
  trinkets: number;
  reputation: number;
}

export interface PendingBarterState {
  barterId: string;
  patientId: string;
  targetReagentId: string;
  preparationId: string;
  locationId: string;
  locationType: BarterLocationType;
  attemptIndex: number;
  attemptsRemaining: number;
  socialEncounter: EncounterDefinition | null;
  firstCard: { value: number; suit?: string } | null;
  secondCard: { value: number; suit?: string } | null;
  calculatedBR: number;
  modifiers: BarterModifier[];
  availability: { region: Availability; season: Availability };
  paymentRequired: number;
  paymentSelection: BarterPaymentSelection;
  status: BarterStatus;
  appliedEffectIds: string[];
  manualResolution?: {
    reason: string;
    decision: string;
    choices: string[];
    stateChangesAfterDecision: string[];
    ruleIds: string[];
    sourcePage: number;
  };
  /** Rulebook p.35: successful Barter made an immediate Remedy possible. */
  awaitingImmediateRemedy?: boolean;
  immediateRemedyPatientId?: string;
  immediateRemedyAilmentIds?: string[];
}

export interface BarterRuntimeState {
  inventory: EngineInventoryItem[];
  patient: PatientState;
  reputation: number;
  trinkets: number;
  attemptHistory: Record<string, number>;
  pendingBarter: PendingBarterState | null;
  journalEvents: EngineJournalEvent[];
  appliedTransactionIds: string[];
  ailmentTagOverrides?: TreatmentAilmentTagOverride[];
  toolStates?: CanonicalToolState[];
}

export interface BarterResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: BarterRuntimeState | null;
  messages: string[];
}

const attemptKey = (patientId: string, locationId: string) => `${patientId}:${locationId}`;
export const getBarterAttemptLimit = (type: BarterLocationType) => type === 'City' ? 3 : 1;
export const getBarterAttemptsRemaining = (
  attemptHistory: Record<string, number>,
  patientId: string,
  locationId: string,
  locationType: BarterLocationType
) => Math.max(0, getBarterAttemptLimit(locationType) - (attemptHistory[attemptKey(patientId, locationId)] || 0));
const isActivePatient = (state: BarterRuntimeState, patientId: string) =>
  state.patient.id === patientId && state.patient.ailments.some(ailment => ailment.status === 'active');

const applyWakeBarterTimer = (patient: PatientState): PatientState => {
  const wakeInstances = new Set(patient.ailments
    .filter(ailment => ailment.status === 'active' && ailment.ailmentId === 'ailment-wake')
    .map(ailment => ailment.id));
  if (wakeInstances.size === 0) return patient;
  return {
    ...patient,
    timers: patient.timers.map(timer => wakeInstances.has(timer.ailmentInstanceId) && timer.status === 'active'
      ? { ...timer, current: timer.current + 1, maximum: Math.max(timer.maximum, timer.current + 1) }
      : timer),
    ailments: patient.ailments.map(ailment => wakeInstances.has(ailment.id)
      ? { ...ailment, effectIds: [...ailment.effectIds, `wake-barter:${patient.id}:${ailment.id}`] }
      : ailment)
  };
};

const distanceWithin = (graph: Record<string, BarterMapNode>, from: string, maxDistance: number): Map<string, number> => {
  const distance = new Map<string, number>([[from, 0]]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = distance.get(current)!;
    if (depth >= maxDistance) continue;
    for (const next of graph[current]?.neighbors || []) {
      if (!graph[next] || distance.has(next)) continue;
      distance.set(next, depth + 1);
      queue.push(next);
    }
  }
  return distance;
};

const reputationModifier = (reputation: number): number => {
  if (reputation >= 35) return -2;
  if (reputation >= 25) return -1;
  if (reputation >= 15) return 0;
  return 1;
};

export const calculateBarterBR = (input: {
  targetReagentId: string;
  preparationId: string;
  locationId: string;
  season: Season;
  reputation: number;
  graph: Record<string, BarterMapNode>;
}): { br: number; modifiers: BarterModifier[]; availability: PendingBarterState['availability'] } => {
  const reagent = REAGENT_BY_ID.get(input.targetReagentId);
  if (!reagent) throw new Error(`Unknown Reagent: ${input.targetReagentId}`);
  const preparation = reagent.preparations.find(row => row.id === input.preparationId);
  if (!preparation) throw new Error(`Preparation ${input.preparationId} does not belong to ${reagent.id}.`);
  const location = input.graph[input.locationId];
  if (!location) throw new Error(`Unknown Barter location: ${input.locationId}`);

  const regionAvailability = reagent.regionAvailability[location.region];
  const seasonAvailability = reagent.seasonAvailability[input.season];
  const local = regionAvailability !== 'Unavailable';
  const nearbyRegions = distanceWithin(input.graph, input.locationId, 3);
  const tradeRoute = location.locationType === 'City' && [...nearbyRegions].some(([id]) => {
    const node = input.graph[id];
    return node && reagent.regionAvailability[node.region] !== 'Unavailable';
  });
  const inSeason = seasonAvailability === 'Common';
  const curiosity = !inSeason && !local && !tradeRoute;
  const fair = preparation.tags.some(tag => tag.tag === 'FAIR' && tag.value > 0);
  const tagThree = preparation.tags.some(tag => !['FAIR', 'FOUL'].includes(tag.tag) && tag.value >= 3);
  const foul = preparation.tags.filter(tag => tag.tag === 'FOUL').reduce((sum, tag) => sum + tag.value, 0);
  const modifiers: BarterModifier[] = [];
  if (location.locationType === 'Settlement' && local) modifiers.push({ id: 'local', label: 'Local', amount: -2 });
  if (location.locationType === 'City' && tradeRoute) modifiers.push({ id: 'trade-route', label: 'Trade Route', amount: -2 });
  if (inSeason) modifiers.push({ id: 'in-season', label: 'In Season', amount: -1 });
  if (curiosity) modifiers.push({ id: 'curiosity', label: 'Curiosity', amount: 2 });
  if (fair) modifiers.push({ id: 'fair', label: 'Gourmand', amount: 3 });
  if (tagThree) modifiers.push({ id: 'tag-3', label: 'Highly Prized', amount: 5 });
  if (foul > 0) modifiers.push({ id: 'foul', label: 'Why The Peck Would You Want That?', amount: foul });
  modifiers.push({ id: 'reputation', label: 'Friendly Donation', amount: reputationModifier(input.reputation) });
  return {
    br: Math.max(0, reagent.baseRarity + modifiers.reduce((sum, modifier) => sum + modifier.amount, 0)),
    modifiers,
    availability: { region: regionAvailability, season: seasonAvailability }
  };
};

const validateLocation = (
  graph: Record<string, BarterMapNode>,
  currentLocationId: string,
  locationId: string
): string | null => {
  const location = graph[locationId];
  if (!location || !['Settlement', 'City'].includes(location.locationType)) return 'Barter requires a Settlement or City.';
  if (locationId !== currentLocationId && !graph[currentLocationId]?.neighbors.includes(locationId)) {
    return 'Barter is limited to the current or an adjacent Settlement or City.';
  }
  return null;
};

export const resolveBarterStart = (input: {
  transactionId: string;
  state: BarterRuntimeState;
  patientId: string;
  targetReagentId: string;
  preparationId: string;
  currentLocationId: string;
  locationId: string;
  season: Season;
  graph: Record<string, BarterMapNode>;
}): BarterResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Barter start transaction is missing or already applied.'] };
  }
  if (input.state.pendingBarter && !['completed', 'abandoned'].includes(input.state.pendingBarter.status)) {
    return { status: 'invalid', value: null, messages: ['Resolve the pending Barter before starting another.'] };
  }
  if (!isActivePatient(input.state, input.patientId)) {
    return { status: 'invalid', value: null, messages: ['Barter requires the active patient and at least one active Ailment.'] };
  }
  const locationError = validateLocation(input.graph, input.currentLocationId, input.locationId);
  if (locationError) return { status: 'invalid', value: null, messages: [locationError] };
  const reagent = REAGENT_BY_ID.get(input.targetReagentId);
  if (!reagent) return { status: 'invalid', value: null, messages: ['Unknown target Reagent.'] };
  if (reagent.type === 'TITAN') return { status: 'invalid', value: null, messages: ['Titan Reagents cannot be Bartered for.'] };
  if (!reagent.preparations.some(row => row.id === input.preparationId)) {
    return { status: 'invalid', value: null, messages: ['Select one Preparation belonging to the target Reagent.'] };
  }
  const location = input.graph[input.locationId];
  const key = attemptKey(input.patientId, input.locationId);
  const used = input.state.attemptHistory[key] || 0;
  const limit = getBarterAttemptLimit(location.locationType as BarterLocationType);
  if (used >= limit) return { status: 'invalid', value: null, messages: ['No Barter attempts remain at this location for this patient.'] };
  const calculation = calculateBarterBR({
    targetReagentId: input.targetReagentId,
    preparationId: input.preparationId,
    locationId: input.locationId,
    season: input.season,
    reputation: input.state.reputation,
    graph: input.graph
  });
  const pendingBarter: PendingBarterState = {
    barterId: input.transactionId,
    patientId: input.patientId,
    targetReagentId: input.targetReagentId,
    preparationId: input.preparationId,
    locationId: input.locationId,
    locationType: location.locationType as BarterLocationType,
    attemptIndex: used + 1,
    attemptsRemaining: limit - used - 1,
    socialEncounter: null,
    firstCard: null,
    secondCard: null,
    calculatedBR: calculation.br,
    modifiers: calculation.modifiers,
    availability: calculation.availability,
    paymentRequired: 0,
    paymentSelection: { trinkets: 0, reputation: 0 },
    status: 'awaiting-social',
    appliedEffectIds: []
  };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      patient: applyWakeBarterTimer(input.state.patient),
      pendingBarter,
      attemptHistory: { ...input.state.attemptHistory, [key]: used + 1 },
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
    },
    messages: []
  };
};

export const resolveBarterEncounter = (input: {
  transactionId: string;
  state: BarterRuntimeState;
  card: RuleCard & { suit?: string };
  encounter: EncounterDefinition;
  manualConfirmed?: boolean;
}): BarterResolution => {
  const pending = input.state.pendingBarter;
  if (!pending || !['awaiting-social', 'manual-social'].includes(pending.status)) {
    return { status: 'invalid', value: null, messages: ['Barter is not waiting for a Social Encounter.'] };
  }
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Social Encounter transaction was already applied.'] };
  }
  if (input.encounter.encounterType !== 'social') {
    return { status: 'invalid', value: null, messages: ['Barter requires a Social Encounter.'] };
  }
  const hasManualEffects = input.encounter.support !== 'implemented'
    || input.encounter.mandatoryEffects.some(effect => effect.support !== 'implemented');
  if (hasManualEffects && !input.manualConfirmed) {
    return {
      status: 'manual',
      value: {
        ...input.state,
        pendingBarter: {
          ...pending,
          socialEncounter: input.encounter,
          firstCard: { value: getRuleCardValue(input.card), suit: input.card.suit },
          status: 'manual-social',
          manualResolution: {
            reason: 'The printed Social Encounter includes narrative or map choices that need the player\'s decision.',
            decision: 'Resolve the printed mandatory and chosen effects before drawing the Barter card.',
            choices: input.encounter.choices.map(choice => choice.label),
            stateChangesAfterDecision: ['Apply the selected printed effects once.', 'Continue to the second Barter card.'],
            ruleIds: ['CORE-002', 'BARTER-005', 'TABLE-004'],
            sourcePage: input.encounter.sourcePage
          }
        }
      },
      messages: ['Resolve and confirm the printed Social Encounter before continuing.']
    };
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      pendingBarter: {
        ...pending,
        socialEncounter: input.encounter,
        firstCard: { value: getRuleCardValue(input.card), suit: input.card.suit },
        status: 'awaiting-second-card',
        manualResolution: undefined
      },
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
    },
    messages: []
  };
};

const decrementAllActiveTimers = (patient: PatientState): PatientState => {
  const timers = patient.timers.map(timer => {
    if (timer.status !== 'active') return timer;
    const current = Math.max(0, timer.current - 1);
    return { ...timer, current, status: current === 0 ? 'expired' as const : 'active' as const };
  });
  const timerById = new Map(timers.map(timer => [timer.id, timer]));
  const ailments = patient.ailments.map(ailment => ailment.status === 'active'
    && ailment.timerIds.some(id => timerById.get(id)?.status === 'expired')
    ? { ...ailment, status: 'failed' as const, failureResolved: true }
    : ailment);
  return { ...patient, timers, ailments };
};

const finalizeSuccessfulBarter = (
  state: BarterRuntimeState,
  pending: PendingBarterState,
  transactionId: string,
  payment: BarterPaymentSelection
): BarterRuntimeState => {
  const reagent = REAGENT_BY_ID.get(pending.targetReagentId)!;
  const preparation = reagent.preparations.find(row => row.id === pending.preparationId)!;
  const acquired: EngineInventoryItem = {
    id: `${pending.barterId}:${preparation.id}`,
    name: `${reagent.displayName} (${preparation.name})`,
    type: 'reagent',
    weight: preparation.weight,
    canonicalReagentId: reagent.id,
    preparationId: preparation.id,
    usesRemaining: preparation.uses,
    quantity: 1
  };
  const inventory = [...state.inventory, acquired];
  const treatableAilmentIds = immediatelyTreatableAilmentIds(
    state.patient,
    inventory,
    state.ailmentTagOverrides,
    [],
    state.toolStates
  );
  const patient = treatableAilmentIds.length > 0 ? state.patient : decrementAllActiveTimers(state.patient);
  const completedPending = withoutImmediateRemedyCheckpoint({
    ...pending,
    paymentSelection: payment,
    status: 'completed' as const,
    appliedEffectIds: [...pending.appliedEffectIds, transactionId]
  });
  return {
    ...state,
    inventory,
    patient,
    trinkets: state.trinkets - payment.trinkets,
    reputation: state.reputation - payment.reputation,
    pendingBarter: treatableAilmentIds.length > 0
      ? withImmediateRemedyCheckpoint(completedPending, state.patient.id, treatableAilmentIds)
      : completedPending,
    journalEvents: [...state.journalEvents, {
      id: `${transactionId}:journal`,
      type: 'encounter',
      authorship: 'system',
      title: `Barter: ${reagent.canonicalName}`,
      text: `BR ${pending.calculatedBR}; paid ${payment.trinkets} Trinkets and ${payment.reputation} Reputation.`
    }],
    appliedTransactionIds: [...state.appliedTransactionIds, transactionId]
  };
};

export const resolveBarterOffer = (input: {
  transactionId: string;
  state: BarterRuntimeState;
  card: RuleCard & { suit?: string };
}): BarterResolution => {
  const pending = input.state.pendingBarter;
  if (!pending || pending.status !== 'awaiting-second-card') {
    return { status: 'invalid', value: null, messages: ['Resolve the Social Encounter before drawing the Barter card.'] };
  }
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Barter card transaction was already applied.'] };
  }
  const value = getRuleCardValue(input.card, 'barter');
  const paymentRequired = Math.max(0, pending.calculatedBR - value);
  const nextPending = {
    ...pending,
    secondCard: { value, suit: input.card.suit },
    paymentRequired,
    status: paymentRequired === 0 ? 'completed' as const : 'awaiting-payment' as const
  };
  if (paymentRequired === 0) {
    return { status: 'resolved', value: finalizeSuccessfulBarter(input.state, nextPending, input.transactionId, { trinkets: 0, reputation: 0 }), messages: [] };
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      pendingBarter: nextPending,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
    },
    messages: []
  };
};

export const resolveBarterGossip = (input: {
  transactionId: string;
  state: BarterRuntimeState;
  gossipItemId: string;
}): BarterResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Gossip Barter transaction is missing or already applied.'] };
  }
  const pending = input.state.pendingBarter;
  if (!pending || pending.status !== 'awaiting-second-card') {
    return { status: 'invalid', value: null, messages: ['Juicy Gossip can only be used when Haggling after the Social Encounter.'] };
  }
  const gossip = input.state.inventory.find(item => item.id === input.gossipItemId);
  if (gossip?.guildNote?.kind !== 'gossip') {
    return { status: 'invalid', value: null, messages: ['Select a canonical Juicy Gossip note from Inventory.'] };
  }
  const stateWithoutGossip = {
    ...input.state,
    inventory: input.state.inventory.filter(item => item.id !== gossip.id)
  };
  const resolvedPending: PendingBarterState = {
    ...pending,
    secondCard: null,
    paymentRequired: 0,
    status: 'completed'
  };
  const resolved = finalizeSuccessfulBarter(stateWithoutGossip, resolvedPending, input.transactionId, { trinkets: 0, reputation: 0 });
  return {
    status: 'resolved',
    value: {
      ...resolved,
      journalEvents: resolved.journalEvents.map(event => event.id === `${input.transactionId}:journal`
        ? { ...event, text: `${event.text} Juicy Gossip was discarded to automatically obtain the Reagent.` }
        : event)
    },
    messages: []
  };
};

export const resolveBarterPayment = (input: {
  transactionId: string;
  state: BarterRuntimeState;
  payment: BarterPaymentSelection;
}): BarterResolution => {
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Barter payment was already applied.'] };
  }
  const pending = input.state.pendingBarter;
  if (!pending || pending.status !== 'awaiting-payment') {
    return { status: 'invalid', value: null, messages: ['Barter is not waiting for payment.'] };
  }
  if (pending.appliedEffectIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Barter payment was already applied.'] };
  }
  const trinkets = Math.max(0, Math.floor(input.payment.trinkets));
  const reputation = Math.max(0, Math.floor(input.payment.reputation));
  if (trinkets > input.state.trinkets || reputation > input.state.reputation) {
    return { status: 'invalid', value: null, messages: ['Payment exceeds available Trinkets or Reputation.'] };
  }
  if (trinkets + reputation !== pending.paymentRequired) {
    return { status: 'invalid', value: null, messages: [`Payment must exactly cover the ${pending.paymentRequired}-point gap.`] };
  }
  return {
    status: 'resolved',
    value: finalizeSuccessfulBarter(input.state, pending, input.transactionId, { trinkets, reputation }),
    messages: []
  };
};

export const resolveBarterLeave = (input: {
  transactionId: string;
  state: BarterRuntimeState;
}): BarterResolution => {
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Barter leave transaction was already applied.'] };
  }
  const pending = input.state.pendingBarter;
  if (!pending || !['awaiting-payment', 'failed-awaiting-timer'].includes(pending.status)) {
    return { status: 'invalid', value: null, messages: ['Backing out is only available after the second card fails.'] };
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      patient: decrementAllActiveTimers(input.state.patient),
      pendingBarter: { ...pending, status: 'abandoned', appliedEffectIds: [...pending.appliedEffectIds, input.transactionId] },
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'encounter', authorship: 'system', title: 'Barter abandoned',
        text: 'The offer was declined; every active Ailment Timer decreased by 1.'
      }]
    },
    messages: []
  };
};
