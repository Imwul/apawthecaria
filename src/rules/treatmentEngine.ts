import { AILMENT_BY_ID } from './data/ailments';
import { REAGENTS } from './data/reagents';
import type { EngineInventoryItem, ProvidedTags, TreatmentTransactionState } from './gameplay';
import { evaluateRequirement, type RequirementEvaluation } from './requirements';
import type { PatientAilmentState, PatientState, TreatmentHistoryEntry } from './state';
import type { AilmentSeverity, ReagentPreparation, RuleTag, StructuredRuleEffect } from './types';

const PREPARATION_BY_ID = new Map<string, { reagentId: string; preparation: ReagentPreparation }>(
  REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => [
    preparation.id,
    { reagentId: reagent.id, preparation }
  ] as const))
);

const severityValue = (severity: AilmentSeverity): number => ({ lesser: 1, intermediate: 2, severe: 3, dire: 4 })[severity];

export interface CatalyseSelection {
  tag: Exclude<RuleTag, 'FAIR' | 'FOUL'>;
  itemIds: [string, string];
}

export interface TreatmentSuccessInput {
  mode: 'treat';
  transactionId: string;
  state: TreatmentTransactionState;
  ailmentInstanceId: string;
  selectedItemIds: string[];
  selectedToolIds: string[];
  catalyse?: CatalyseSelection[];
  gifting?: boolean;
  doseCount?: number;
  confirmedManualRequirements?: string[];
  journalText: string;
}

export interface TreatmentFailureInput {
  mode: 'fail-expired';
  transactionId: string;
  state: TreatmentTransactionState;
  ailmentInstanceIds: string[];
  journalText: string;
}

export type TreatmentEngineInput = TreatmentSuccessInput | TreatmentFailureInput;

export interface TreatmentEngineOutcome {
  transactionId: string;
  nextState: TreatmentTransactionState;
  requirement: RequirementEvaluation | null;
  providedTags: ProvidedTags;
  fair: number;
  foul: number;
  trinketReward: number;
  reputationChange: number;
  consumedItemIds: string[];
  manualEffects: StructuredRuleEffect[];
  allAilmentsResolved: boolean;
}

export interface TreatmentEngineResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: TreatmentEngineOutcome | null;
  messages: string[];
}

const toolIdsForInventory = (inventory: readonly EngineInventoryItem[], selectedToolIds: readonly string[]): Set<string> =>
  new Set(inventory
    .filter(item => item.type === 'tool' && selectedToolIds.includes(item.id))
    .flatMap(item => [item.canonicalToolId, item.id].filter((id): id is string => Boolean(id))));

const consumeItems = (inventory: readonly EngineInventoryItem[], selectedIds: readonly string[], usesPerItem = 1): {
  inventory: EngineInventoryItem[];
  consumedIds: string[];
} => {
  const selected = new Set(selectedIds);
  const consumedIds: string[] = [];
  const next = inventory.flatMap(item => {
    if (!selected.has(item.id)) return [item];
    consumedIds.push(item.id);
    const uses = item.usesRemaining || 1;
    return uses > usesPerItem ? [{ ...item, usesRemaining: uses - usesPerItem }] : [];
  });
  return { inventory: next, consumedIds };
};

const collectTags = (
  selected: Array<{ item: EngineInventoryItem; preparation: ReagentPreparation }>,
  tools: Set<string>,
  catalyse: readonly CatalyseSelection[]
): { tags: ProvidedTags; fair: number; foul: number; messages: string[] } => {
  const contributions = new Map<RuleTag, Array<{ itemId: string; value: number }>>();
  selected.forEach(({ item, preparation }) => preparation.tags.forEach(tag => {
    const rows = contributions.get(tag.tag) || [];
    rows.push({ itemId: item.id, value: tag.value });
    contributions.set(tag.tag, rows);
  }));
  if (tools.has('fairwind-spices')) {
    const fairRows = contributions.get('FAIR') || [];
    fairRows.push({ itemId: 'fairwind-spices', value: 1 });
    contributions.set('FAIR', fairRows);
  }
  if (tools.has('fine-toothed-comb')) {
    contributions.set('FUR', [...(contributions.get('FUR') || []), { itemId: 'fine-toothed-comb', value: 3 }]);
    contributions.set('PARASITE', [...(contributions.get('PARASITE') || []), { itemId: 'fine-toothed-comb', value: 1 }]);
  }

  const tags: ProvidedTags = {};
  const messages: string[] = [];
  contributions.forEach((rows, tag) => {
    if (tag === 'FAIR' || tag === 'FOUL') return;
    tags[tag] = Math.max(...rows.map(row => row.value));
  });
  catalyse.forEach(selection => {
    if (!tools.has('glass-alembic')) {
      messages.push('Glass Alembic is required to CATALYSE.');
      return;
    }
    const rows = contributions.get(selection.tag) || [];
    const chosen = selection.itemIds.map(id => rows.find(row => row.itemId === id));
    if (!chosen[0] || !chosen[1] || selection.itemIds[0] === selection.itemIds[1]) {
      messages.push(`CATALYSE ${selection.tag} requires two different selected Reagents with that Tag.`);
      return;
    }
    tags[selection.tag] = chosen[0].value + chosen[1].value;
  });
  return {
    tags,
    fair: (contributions.get('FAIR') || []).reduce((total, row) => total + row.value, 0),
    foul: (contributions.get('FOUL') || []).reduce((total, row) => total + row.value, 0),
    messages
  };
};

export const canTreatAilmentWithInventory = (
  patient: PatientState,
  ailmentInstanceId: string,
  inventory: readonly EngineInventoryItem[]
): boolean => {
  const ailment = patient.ailments.find(row => row.id === ailmentInstanceId && row.status === 'active');
  if (!ailment?.ailmentId) return false;
  const definition = AILMENT_BY_ID.get(ailment.ailmentId);
  if (!definition) return false;

  const tools = new Set(inventory
    .filter(item => item.type === 'tool')
    .flatMap(item => [item.canonicalToolId, item.id].filter((id): id is string => Boolean(id))));
  const prepared = inventory.flatMap(item => {
    if (item.type !== 'reagent' || !item.preparationId) return [];
    const preparation = PREPARATION_BY_ID.get(item.preparationId)?.preparation;
    if (!preparation || preparation.requiredTools.some(tool => tool !== 'none' && !tools.has(tool))) return [];
    return [{ item, preparation }];
  });
  if (prepared.length === 0) return false;

  const tags = collectTags(prepared, tools, []).tags;
  if (tools.has('glass-alembic')) {
    const contributions = new Map<RuleTag, Array<{ itemId: string; value: number }>>();
    prepared.forEach(({ item, preparation }) => preparation.tags.forEach(tag => {
      if (tag.tag === 'FAIR' || tag.tag === 'FOUL') return;
      const rows = contributions.get(tag.tag) || [];
      rows.push({ itemId: item.id, value: tag.value });
      contributions.set(tag.tag, rows);
    }));
    contributions.forEach((rows, tag) => {
      const strongest = [...rows].sort((a, b) => b.value - a.value).slice(0, 2);
      if (strongest.length === 2) tags[tag] = Math.max(tags[tag] || 0, strongest[0].value + strongest[1].value);
    });
  }
  return evaluateRequirement(definition.requirements, tags).satisfied;
};

const updateAilment = (
  patient: PatientState,
  ailment: PatientAilmentState,
  treatment: TreatmentHistoryEntry,
  status: 'treated' | 'failed'
): PatientState => {
  const timers = patient.timers.map(timer => ailment.timerIds.includes(timer.id)
    ? { ...timer, status: 'stopped' as const }
    : timer);
  const ailments = patient.ailments.map(row => row.id === ailment.id
    ? {
      ...row,
      status,
      treatmentHistoryIds: [...row.treatmentHistoryIds, treatment.id],
      successResolved: status === 'treated',
      failureResolved: status === 'failed',
      consequenceResolved: status === 'failed',
      effectIds: [...row.effectIds, treatment.id]
    }
    : row);
  const allResolved = ailments.every(row => row.status !== 'active');
  return {
    ...patient,
    status: allResolved ? (ailments.some(row => row.status === 'failed') ? 'failed' : 'cured') : 'active',
    ailments,
    timers,
    treatmentHistory: [...patient.treatmentHistory, treatment]
  };
};

export const resolveTreatmentTransaction = (input: TreatmentEngineInput): TreatmentEngineResolution => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Treatment requires a transaction ID.'] };
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: {
      transactionId: input.transactionId,
      nextState: input.state,
      requirement: null,
      providedTags: {},
      fair: 0,
      foul: 0,
      trinketReward: 0,
      reputationChange: 0,
      consumedItemIds: [],
      manualEffects: [],
      allAilmentsResolved: input.state.patient.ailments.every(ailment => ailment.status !== 'active')
    }, messages: ['Transaction was already applied.'] };
  }

  if (input.mode === 'fail-expired') {
    let patient = input.state.patient;
    let reputationLoss = 0;
    for (const id of input.ailmentInstanceIds) {
      const ailment = patient.ailments.find(row => row.id === id && (row.status === 'active' || row.status === 'failed'));
      if (!ailment) continue;
      const treatment: TreatmentHistoryEntry = {
        id: `${input.transactionId}:${id}`,
        ailmentInstanceIds: [id],
        preparationIds: [],
        providedTags: {},
        outcome: 'failure',
        effects: []
      };
      reputationLoss += severityValue(ailment.severity);
      patient = updateAilment(patient, ailment, treatment, 'failed');
    }
    const nextState = {
      ...input.state,
      patient,
      reputation: Math.max(0, input.state.reputation - reputationLoss),
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`,
        type: 'failure' as const,
        title: 'Ailment consequences',
        text: input.journalText
      }],
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
    };
    return {
      status: 'manual',
      value: {
        transactionId: input.transactionId,
        nextState,
        requirement: null,
        providedTags: {},
        fair: 0,
        foul: 0,
        trinketReward: 0,
        reputationChange: -reputationLoss,
        consumedItemIds: [],
        manualEffects: [],
        allAilmentsResolved: patient.ailments.every(row => row.status !== 'active')
      },
      messages: ['Apply each printed Ailment Consequence before Moving On.']
    };
  }

  const ailment = input.state.patient.ailments.find(row => row.id === input.ailmentInstanceId && row.status === 'active');
  if (!ailment || !ailment.ailmentId) return { status: 'invalid', value: null, messages: ['Active canonical Ailment instance not found.'] };
  const definition = AILMENT_BY_ID.get(ailment.ailmentId);
  if (!definition) return { status: 'invalid', value: null, messages: ['Canonical Ailment definition not found.'] };
  const selectedItems = input.selectedItemIds.map(id => input.state.inventory.find(item => item.id === id));
  if (selectedItems.length === 0 || selectedItems.some(item => !item || item.type !== 'reagent' || !item.preparationId)) {
    return { status: 'invalid', value: null, messages: ['Every selected Remedy ingredient must be a canonical prepared Reagent in Inventory.'] };
  }
  const selected = selectedItems.map(item => ({
    item: item!,
    preparation: PREPARATION_BY_ID.get(item!.preparationId!)?.preparation
  }));
  if (selected.some(row => !row.preparation)) return { status: 'invalid', value: null, messages: ['Selected Inventory contains an unknown Preparation.'] };
  const tools = toolIdsForInventory(input.state.inventory, input.selectedToolIds);
  const missingTool = selected.find(row => row.preparation!.requiredTools.some(tool => tool !== 'none' && !tools.has(tool)));
  if (missingTool) return { status: 'invalid', value: null, messages: [`Required Tool is not selected: ${missingTool.preparation!.requiredTools.join(', ')}`] };

  const collected = collectTags(
    selected as Array<{ item: EngineInventoryItem; preparation: ReagentPreparation }>,
    tools,
    input.catalyse || []
  );
  if (collected.messages.length > 0) return { status: 'invalid', value: null, messages: collected.messages };
  if (definition.canonicalName === 'Bad Idea' && collected.foul > 0) {
    return { status: 'invalid', value: null, messages: ['Bad Idea cannot be treated with a Remedy containing FOUL.'] };
  }
  const additionalRequirements = Array.isArray(ailment.specialState.additionalRequirements)
    ? ailment.specialState.additionalRequirements as Array<{ tag: RuleTag; threshold: number }>
    : [];
  const quagmirePoison = typeof ailment.specialState.poisonRequirement === 'number'
    ? [{ tag: 'POISON' as const, threshold: ailment.specialState.poisonRequirement }]
    : [];
  const unmetSpecial = [...additionalRequirements, ...quagmirePoison]
    .filter(row => (collected.tags[row.tag] || 0) < row.threshold)
    .map(row => `${row.tag} ${row.threshold}`);
  const requirement = evaluateRequirement(definition.requirements, collected.tags);
  if (unmetSpecial.length > 0) return { status: 'invalid', value: null, messages: unmetSpecial };
  if (!requirement.satisfied) return { status: 'invalid', value: null, messages: requirement.missing };
  const confirmed = new Set(input.confirmedManualRequirements || []);
  const unconfirmedManual = requirement.manual.filter(message => !confirmed.has(message));
  if (unconfirmedManual.length > 0) return { status: 'manual', value: null, messages: unconfirmedManual };

  const doseCount = Math.max(1, Math.floor(input.doseCount || 1));
  if (definition.canonicalName === 'Stingshock' && doseCount > 1 && selectedItems.some(item => (item?.usesRemaining || 1) < doseCount)) {
    return { status: 'invalid', value: null, messages: ['Each selected Stingshock ingredient needs enough remaining Uses for both complete doses.'] };
  }
  const consumed = consumeItems(input.state.inventory, input.selectedItemIds, doseCount);
  const netFair = definition.canonicalName === 'Wormridden'
    ? Math.max(0, collected.fair - collected.foul)
    : collected.fair - collected.foul;
  const baseReward = Math.max(0, severityValue(definition.severity) + Math.trunc(netFair / 2));
  const gifting = Boolean(input.gifting && baseReward > 0);
  const trinketReward = gifting ? 0 : baseReward;
  const brandCareChange = definition.canonicalName === 'Brand Care' && ailment.specialState.brandCareChoice !== 'treat' ? -2 : 0;
  const stingshockChange = definition.canonicalName === 'Stingshock' && doseCount >= 2 ? 3 : 0;
  const cookedWakeChange = definition.canonicalName === 'Wake'
    && selected.some(row => row.preparation?.method.toUpperCase().includes('COOK')) ? 2 : 0;
  const reputationChange = severityValue(definition.severity) + (gifting ? 2 : 0)
    + brandCareChange + stingshockChange + cookedWakeChange;
  const treatment: TreatmentHistoryEntry = {
    id: `${input.transactionId}:treatment`,
    ailmentInstanceIds: [ailment.id],
    preparationIds: selected.map(row => row.preparation!.id),
    providedTags: collected.tags,
    outcome: 'success',
    effects: definition.successEffects,
    journalEventId: `${input.transactionId}:journal`
  };
  const patient = updateAilment(input.state.patient, ailment, treatment, 'treated');
  const nextState: TreatmentTransactionState = {
    ...input.state,
    inventory: consumed.inventory,
    patient,
    reputation: input.state.reputation + reputationChange,
    trinkets: input.state.trinkets + trinketReward,
    journalEvents: [...input.state.journalEvents, {
      id: `${input.transactionId}:journal`,
      type: 'treatment',
      title: `Remedy: ${definition.canonicalName}`,
      text: input.journalText
    }],
    appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
  };
  const manualEffects = [...definition.successEffects, ...definition.specialRules]
    .filter(effect => effect.support !== 'implemented');
  return {
    status: manualEffects.length > 0 ? 'manual' : 'resolved',
    value: {
      transactionId: input.transactionId,
      nextState,
      requirement,
      providedTags: collected.tags,
      fair: collected.fair,
      foul: collected.foul,
      trinketReward,
      reputationChange,
      consumedItemIds: consumed.consumedIds,
      manualEffects,
      allAilmentsResolved: patient.ailments.every(row => row.status !== 'active')
    },
    messages: manualEffects.length > 0 ? ['Base treatment succeeded. Resolve any printed optional Outcome or special rule shown.'] : []
  };
};
