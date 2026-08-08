import { REAGENT_BY_ID } from './data/reagents';
import type { EngineInventoryItem, EngineJournalEvent } from './gameplay';
import type { PatientState } from './state';
import type { Region, RuleTag } from './types';

export type ScroungeAction = 'forage-current' | 'forage-adjacent' | 'guaranteed-current' | 'guaranteed-adjacent';

export interface PendingLeaveObligation {
  transactionId: string;
  kind: 'foraging-encounter' | 'barrow-delve' | 'move-on';
  region?: Region;
  source: ScroungeAction | 'leave';
  resolved: boolean;
}

export interface LeaveRuntimeState {
  inventory: EngineInventoryItem[];
  patient: PatientState;
  reputation: number;
  trinkets: number;
  currentRegion: Region;
  adjacentRegions: Region[];
  foragingPoints: number;
  pendingObligation: PendingLeaveObligation | null;
  journalEvents: EngineJournalEvent[];
  appliedTransactionIds: string[];
}

export interface ScroungeInput {
  transactionId: string;
  state: LeaveRuntimeState;
  action: ScroungeAction;
  region: Region;
  targetReagentId?: string;
  preparationId?: string;
}

export interface LeaveResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: LeaveRuntimeState | null;
  messages: string[];
}

const scroungeCost: Record<ScroungeAction, number> = {
  'forage-current': 1,
  'forage-adjacent': 2,
  'guaranteed-current': 3,
  'guaranteed-adjacent': 4
};

const allActiveTimersAboveZero = (patient: PatientState) => {
  return patient.timers.length > 0 && patient.timers.every(timer => timer.current > 0);
};

const reduceAllActiveTimers = (patient: PatientState, amount: number): PatientState => {
  const timers = patient.timers.map(timer => {
    const current = Math.max(0, timer.current - amount);
    return { ...timer, current, status: current === 0 ? 'expired' as const : timer.status };
  });
  const timersById = new Map(timers.map(timer => [timer.id, timer]));
  const ailments = patient.ailments.map(ailment => ailment.status === 'active'
    && ailment.timerIds.some(id => timersById.get(id)?.status === 'expired')
    ? { ...ailment, status: 'failed' as const, failureResolved: true }
    : ailment);
  return { ...patient, timers, ailments };
};

const maximumPotency = (preparationId: string, reagentId: string) => {
  const preparation = REAGENT_BY_ID.get(reagentId)?.preparations.find(row => row.id === preparationId);
  return preparation ? Math.max(0, ...preparation.tags.filter(tag => !['FAIR', 'FOUL'].includes(tag.tag)).map(tag => tag.value)) : Infinity;
};

export const resolveScrounge = (input: ScroungeInput): LeaveResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Scrounge transaction is missing or already applied.'] };
  if (input.state.pendingObligation && !input.state.pendingObligation.resolved) return { status: 'invalid', value: null, messages: ['Resolve the pending Encounter or Delve first.'] };
  if (!allActiveTimersAboveZero(input.state.patient)) return { status: 'invalid', value: null, messages: ['Scrounging requires every active Timer to be above 0.'] };
  const adjacent = input.action.endsWith('adjacent');
  if ((!adjacent && input.region !== input.state.currentRegion) || (adjacent && !input.state.adjacentRegions.includes(input.region))) {
    return { status: 'invalid', value: null, messages: ['Scrounge Region must match the current or a graph-adjacent Region.'] };
  }
  const cost = scroungeCost[input.action];
  if (input.state.patient.timers.some(timer => timer.current < cost)) {
    return { status: 'invalid', value: null, messages: [`Every active Timer must have at least ${cost} remaining.`] };
  }
  let inventory = input.state.inventory;
  let pendingObligation: PendingLeaveObligation | null = null;
  if (input.action.startsWith('forage')) {
    pendingObligation = { transactionId: input.transactionId, kind: 'foraging-encounter', region: input.region, source: input.action, resolved: false };
  } else {
    const reagent = input.targetReagentId ? REAGENT_BY_ID.get(input.targetReagentId) : undefined;
    const preparation = reagent?.preparations.find(row => row.id === input.preparationId);
    if (!reagent || !preparation) return { status: 'invalid', value: null, messages: ['Guaranteed Scrounging requires one canonical Reagent Preparation.'] };
    if (reagent.regionAvailability[input.region] === 'Unavailable') return { status: 'invalid', value: null, messages: ['The target Part cannot be found in the selected Region.'] };
    if (maximumPotency(preparation.id, reagent.id) > 2) return { status: 'invalid', value: null, messages: ['Guaranteed Scrounging is limited to Potency 2 or lower.'] };
    inventory = [...inventory, {
      id: `${input.transactionId}:${preparation.id}`,
      name: `${reagent.displayName} (${preparation.name})`,
      type: 'reagent',
      weight: preparation.weight,
      canonicalReagentId: reagent.id,
      preparationId: preparation.id,
      usesRemaining: preparation.uses,
      quantity: 1
    }];
  }
  return {
    status: 'resolved',
    value: {
      ...input.state,
      inventory,
      patient: reduceAllActiveTimers(input.state.patient, cost),
      pendingObligation,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'foraging', title: 'Scrounging',
        text: `${input.action} in ${input.region}; every active Timer decreased by ${cost}.`
      }]
    },
    messages: []
  };
};

export interface AlternativeAcquisition {
  id: string;
  kind: 'make-do' | 'replacement';
  acquisition: 'forage-or-barter';
  selectedSource: 'forage' | 'barter' | null;
  targetTag: RuleTag;
  requiredPotency: number;
  baseRarity?: number;
  weight?: number;
  name?: string;
  preparation?: string;
  journalPrompt: string;
}

export const createMakeDoAcquisition = (targetTag: RuleTag, requiredPotency: number): AlternativeAcquisition => ({
  id: `make-do:${targetTag}:${requiredPotency + 1}`,
  kind: 'make-do',
  acquisition: 'forage-or-barter',
  selectedSource: null,
  targetTag,
  requiredPotency: requiredPotency + 1,
  journalPrompt: 'Journal about how the stronger substitute soothes the current Ailment.'
});

export const createReplacementAcquisition = (input: {
  targetTag: RuleTag;
  requiredPotency: number;
  name: string;
  preparation: string;
}): AlternativeAcquisition => ({
  id: `replacement:${input.targetTag}:${input.name.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-')}:${input.preparation.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-')}`,
  kind: 'replacement',
  acquisition: 'forage-or-barter',
  selectedSource: null,
  targetTag: input.targetTag,
  requiredPotency: input.requiredPotency,
  baseRarity: 12,
  weight: 2 / 3,
  name: input.name.trim(),
  preparation: input.preparation.trim(),
  journalPrompt: 'Invent the stand-in Reagent, add it to the Almanack, and Journal about it after it is actually acquired.'
});

export const commitAlternativeAcquisition = (input: {
  transactionId: string;
  state: LeaveRuntimeState;
  acquisition: AlternativeAcquisition;
  source: 'forage' | 'barter';
  sourceTransactionId: string;
  acquisitionSucceeded: boolean;
}): LeaveResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Acquisition transaction is missing or already applied.'] };
  if (!input.acquisitionSucceeded || !input.sourceTransactionId) return { status: 'invalid', value: null, messages: ['Replacement can only be committed after a successful Forage or Barter transaction.'] };
  const acquisition = input.acquisition;
  if (acquisition.selectedSource && acquisition.selectedSource !== input.source) return { status: 'invalid', value: null, messages: [`This acquisition is waiting for a successful ${acquisition.selectedSource} transaction.`] };
  if (input.state.inventory.some(item => item.provenance?.acquisitionId === acquisition.id)) return { status: 'invalid', value: null, messages: ['This Replacement acquisition is already in Inventory.'] };
  const name = acquisition.kind === 'replacement' ? acquisition.name?.trim() : `Make Do: ${acquisition.targetTag}`;
  if (!name || (acquisition.kind === 'replacement' && !acquisition.preparation?.trim())) return { status: 'invalid', value: null, messages: ['Replacement requires a custom name and preparation.'] };
  const item: EngineInventoryItem = {
    id: `alternative:${input.transactionId}`,
    name: `${name} (${acquisition.preparation || 'Substitute'})`,
    type: 'reagent',
    weight: acquisition.kind === 'replacement' ? 2 / 3 : 1 / 3,
    quantity: 1,
    usesRemaining: 1,
    customReagent: {
      baseRarity: acquisition.baseRarity ?? acquisition.requiredPotency,
      targetTag: acquisition.targetTag,
      preparation: acquisition.preparation || 'Substitute'
    },
    provenance: {
      acquisitionId: acquisition.id,
      source: input.source,
      sourceTransactionId: input.sourceTransactionId
    }
  };
  return { status: 'resolved', value: { ...input.state, inventory: [...input.state.inventory, item], appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId], journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'foraging', title: acquisition.kind === 'replacement' ? 'Replacement Acquired' : 'Make Do Acquired', text: `${item.name} acquired through ${input.source}; BR ${acquisition.baseRarity ?? acquisition.requiredPotency}, Weight ${item.weight}, target ${acquisition.targetTag}, source REMEDY-003.` }] }, messages: [] };
};

export interface PawnPreview {
  selectedItemIds: string[];
  totalWeight: number;
  trinketReward: number;
}

const pawnableWeight = (item: EngineInventoryItem) => {
  if (item.type === 'reagent' && (item.usesRemaining || 0) <= 0) return 0;
  return Math.max(0, item.weight) * Math.max(1, item.quantity || 1);
};

export const calculatePawnReward = (inventory: EngineInventoryItem[], selectedItemIds: string[]): PawnPreview => {
  const selected = new Set(selectedItemIds);
  const rows = inventory.filter(item => selected.has(item.id));
  const totalWeight = rows.reduce((sum, item) => sum + pawnableWeight(item), 0);
  return { selectedItemIds: [...selected], totalWeight, trinketReward: Math.round(totalWeight) };
};

export const resolvePawn = (input: {
  transactionId: string;
  state: LeaveRuntimeState;
  selectedItemIds: string[];
}): LeaveResolution => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Pawn transaction is missing.'] };
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Pawn transaction was already applied.'] };
  }
  const preview = calculatePawnReward(input.state.inventory, input.selectedItemIds);
  if (preview.selectedItemIds.length === 0 || preview.totalWeight <= 0) return { status: 'invalid', value: null, messages: ['Select at least one pawnable item with remaining Weight.'] };
  const selected = new Set(preview.selectedItemIds);
  if (preview.selectedItemIds.some(id => !input.state.inventory.some(item => item.id === id))) return { status: 'invalid', value: null, messages: ['A selected Pawn item is not in the Inventory.'] };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      inventory: input.state.inventory.filter(item => !selected.has(item.id)),
      trinkets: input.state.trinkets + preview.trinketReward,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'downtime', title: 'Pawning',
        text: `Discarded ${preview.totalWeight} Weight and gained ${preview.trinketReward} Trinkets.`
      }]
    },
    messages: []
  };
};

export const resolveLeave = (input: {
  transactionId: string;
  state: LeaveRuntimeState;
  status: 'treated' | 'failed' | 'abandoned';
}): LeaveResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Leave transaction is missing or already applied.'] };
  if (input.state.pendingObligation && !input.state.pendingObligation.resolved) return { status: 'invalid', value: null, messages: ['Resolve the pending Encounter or Delve before Moving On.'] };
  const activeAilments = input.state.patient.ailments.filter(ailment => ailment.status === 'active');
  if (input.status === 'treated' && activeAilments.length > 0) return { status: 'invalid', value: null, messages: ['All Ailments must be resolved before leaving as treated.'] };
  const failedCount = activeAilments.length;
  const severityLoss = activeAilments.reduce((sum, ailment) => sum + ({ lesser: 1, intermediate: 2, severe: 3, dire: 4 }[ailment.severity]), 0);
  const ailments = input.state.patient.ailments.map(ailment => ailment.status === 'active'
    ? { ...ailment, status: 'failed' as const, failureResolved: true, consequenceResolved: true }
    : ailment);
  const patient = {
    ...input.state.patient,
    status: (input.status === 'treated' ? 'cured' : input.status === 'failed' ? 'failed' : 'departed') as PatientState['status'],
    ailments,
    timers: input.state.patient.timers.map(timer => timer.status === 'active' ? { ...timer, status: 'stopped' as const } : timer)
  };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      patient,
      reputation: Math.max(0, input.state.reputation - (input.status === 'treated' ? 0 : severityLoss)),
      foragingPoints: 0,
      pendingObligation: { transactionId: input.transactionId, kind: 'move-on', source: 'leave', resolved: true },
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: input.status === 'treated' ? 'treatment' : 'failure', title: 'Preparing to Leave',
        text: failedCount > 0 ? `${failedCount} unresolved Ailments faced their Consequences.` : 'All Ailments were resolved before Moving On.'
      }]
    },
    messages: []
  };
};
