import { AILMENT_BY_ID } from './data/ailments';
import type { RuleCard } from './cards';
import { REAGENTS } from './data/reagents';
import { TOOL_UPGRADES } from './data/upgrades';
import { resolveBadIdeaOutcomeEffect, type BadIdeaOutcomeChoice } from './ailmentEffectEngine';
import type { EngineInventoryItem, ProvidedTags, TreatmentTransactionState } from './gameplay';
import { evaluateRequirement, type RequirementEvaluation } from './requirements';
import type { PatientAilmentState, PatientState, TreatmentHistoryEntry } from './state';
import { resolveToolEffects, toolWeight, type CanonicalToolState } from './toolEngine';
import type { AilmentSeverity, ReagentPreparation, RequirementExpression, RuleTag, StructuredRuleEffect } from './types';

const PREPARATION_BY_ID = new Map<string, { reagentId: string; preparation: ReagentPreparation }>(
  REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => [
    preparation.id,
    { reagentId: reagent.id, preparation }
  ] as const))
);

const severityValue = (severity: AilmentSeverity): number => ({ lesser: 1, intermediate: 2, severe: 3, dire: 4 })[severity];

export interface TreatmentAilmentTagOverride {
  ailmentId: string;
  originalTag: RuleTag;
  replacementTag: RuleTag;
}

export const applyAilmentTagOverrides = (
  requirement: RequirementExpression,
  ailmentId: string,
  overrides: readonly TreatmentAilmentTagOverride[] = []
): RequirementExpression => {
  const relevant = overrides.filter(row => row.ailmentId === ailmentId);
  if (requirement.kind === 'tag') {
    const tag = relevant.reduce((current, row) => current === row.originalTag ? row.replacementTag : current, requirement.tag);
    return { ...requirement, tag };
  }
  if (requirement.kind === 'special') return requirement;
  if (requirement.kind === 'alternatives') {
    return { ...requirement, alternatives: requirement.alternatives.map(row => applyAilmentTagOverrides(row, ailmentId, relevant)) };
  }
  return { ...requirement, requirements: requirement.requirements.map(row => applyAilmentTagOverrides(row, ailmentId, relevant)) };
};

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
  preserve?: boolean;
  /** PURIFY is learned from Special Technique and only legal when the last gathered Reagent was gathered in Mountains (p.180). */
  purify?: boolean;
  purifyEligible?: boolean;
  gifting?: boolean;
  trinketRewardBonus?: number;
  doseCount?: number;
  confirmedManualRequirements?: string[];
  badIdeaOutcome?: BadIdeaOutcomeChoice;
  toolCards?: Record<string, RuleCard>;
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
  remedyFlags: Array<'PRESERVED'>;
  fair: number;
  foul: number;
  trinketReward: number;
  reputationChange: number;
  consumedItemIds: string[];
  manualEffects: StructuredRuleEffect[];
  badIdeaOutcomeApplied: boolean;
  allAilmentsResolved: boolean;
}

export interface TreatmentEngineResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: TreatmentEngineOutcome | null;
  messages: string[];
  manualAction?: {
    kind: 'bad-idea-inspiration';
    upgradeTargets: Array<{
      toolInstanceId: string;
      toolId: string;
      upgrades: Array<{ id: string; canonicalName: string }>;
    }>;
    lightenTargets: Array<{ toolInstanceId: string; toolId: string; currentWeight: number }>;
  };
}

export interface TreatmentSelectionPreview {
  ready: boolean;
  requiresCatalyse: boolean;
  catalyseTags: Array<Exclude<RuleTag, 'FAIR' | 'FOUL'>>;
  providedTags: ProvidedTags;
  requirement: RequirementEvaluation | null;
  fair: number;
  foul: number;
  rawFoul: number;
  missingToolIds: string[];
  messages: string[];
}

const toolIdsForInventory = (
  inventory: readonly EngineInventoryItem[],
  selectedToolIds: readonly string[],
  toolStates: readonly CanonicalToolState[] = []
): Set<string> =>
  new Set(inventory
    .filter(item => {
      if (item.type !== 'tool'
        || (!selectedToolIds.includes(item.id) && item.canonicalToolId !== 'fairwind-spices')) return false;
      const toolState = toolStates.find(tool => tool.instanceId === item.id);
      return !toolState || (!toolState.broken && !toolState.consumed);
    })
    .flatMap(item => [item.canonicalToolId, item.id].filter((id): id is string => Boolean(id))));

const inventoryQuantity = (item: EngineInventoryItem): number => item.quantity === undefined
  ? 1
  : Math.max(0, Math.floor(item.quantity));

const availablePreparationUses = (item: EngineInventoryItem, preparation: ReagentPreparation): number => {
  const quantity = inventoryQuantity(item);
  if (quantity === 0) return 0;
  const currentUses = item.usesRemaining === undefined
    ? preparation.uses
    : Math.max(0, Math.floor(item.usesRemaining));
  return currentUses + Math.max(0, quantity - 1) * preparation.uses;
};

const consumeItems = (inventory: readonly EngineInventoryItem[], selectedIds: readonly string[], usesPerItem = 1): {
  inventory: EngineInventoryItem[];
  consumedIds: string[];
} => {
  const selected = new Set(selectedIds);
  const consumedIds: string[] = [];
  const next = inventory.flatMap(item => {
    if (!selected.has(item.id)) return [item];
    consumedIds.push(item.id);
    const preparation = item.preparationId ? PREPARATION_BY_ID.get(item.preparationId)?.preparation : null;
    if (!preparation) return [item];
    const remainingUses = availablePreparationUses(item, preparation) - usesPerItem;
    if (remainingUses <= 0) return [];
    const quantity = Math.ceil(remainingUses / preparation.uses);
    const usesRemaining = remainingUses - Math.max(0, quantity - 1) * preparation.uses;
    return [{ ...item, quantity, usesRemaining }];
  });
  return { inventory: next, consumedIds };
};

const collectTags = (
  selected: Array<{ item: EngineInventoryItem; preparation: ReagentPreparation }>,
  tools: Set<string>,
  catalyse: readonly CatalyseSelection[],
  potencyBoost?: { itemId: string; amount: number }
): { tags: ProvidedTags; fair: number; foul: number; messages: string[] } => {
  const contributions = new Map<RuleTag, Array<{ itemId: string; value: number }>>();
  selected.forEach(({ item, preparation }) => preparation.tags.forEach(tag => {
    const rows = contributions.get(tag.tag) || [];
    const boost = potencyBoost?.itemId === item.id && tag.tag !== 'FAIR' && tag.tag !== 'FOUL' ? potencyBoost.amount : 0;
    rows.push({ itemId: item.id, value: tag.value + boost });
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
  const fair = (contributions.get('FAIR') || []).reduce((total, row) => total + row.value, 0);
  const foul = (contributions.get('FOUL') || []).reduce((total, row) => total + row.value, 0);
  // FAIR and FOUL are the exception to normal Remedy Tags: every copy stacks,
  // then the two totals cancel one another. Ailments that explicitly require
  // FAIR/FOUL must therefore see the remaining net value.
  tags.FAIR = Math.max(0, fair - foul);
  tags.FOUL = Math.max(0, foul - fair);
  return {
    tags,
    fair,
    foul,
    messages
  };
};

/**
 * Side-effect-free preview used by the treatment workspace. It deliberately
 * does not guess narrative/manual requirements or optional Tool choices.
 */
export const previewTreatmentSelection = ({
  patient,
  ailmentInstanceId,
  inventory,
  selectedItemIds,
  selectedToolIds,
  toolStates = [],
  overrides = [],
  purify = false,
  purifyEligible = false
}: {
  patient: PatientState;
  ailmentInstanceId: string;
  inventory: readonly EngineInventoryItem[];
  selectedItemIds: readonly string[];
  selectedToolIds: readonly string[];
  toolStates?: readonly CanonicalToolState[];
  overrides?: readonly TreatmentAilmentTagOverride[];
  purify?: boolean;
  purifyEligible?: boolean;
}): TreatmentSelectionPreview => {
  if (!patient || !Array.isArray(patient.ailments) || !Array.isArray(patient.timers)) {
    return { ready: false, requiresCatalyse: false, catalyseTags: [], providedTags: {}, requirement: null, fair: 0, foul: 0, rawFoul: 0, missingToolIds: [], messages: ['Patient state is malformed.'] };
  }
  const ailment = patient.ailments.find(row => row.id === ailmentInstanceId && row.status === 'active');
  const definition = ailment?.ailmentId ? AILMENT_BY_ID.get(ailment.ailmentId) : null;
  if (!ailment || !definition) {
    return { ready: false, requiresCatalyse: false, catalyseTags: [], providedTags: {}, requirement: null, fair: 0, foul: 0, rawFoul: 0, missingToolIds: [], messages: ['Active canonical Ailment instance not found.'] };
  }
  const duplicateItemIds = selectedItemIds.length !== new Set(selectedItemIds).size;
  const selectedItems = selectedItemIds.flatMap(id => {
    const item = inventory.find(row => row.id === id);
    return item?.type === 'reagent' && item.preparationId ? [item] : [];
  });
  const selected = selectedItems.flatMap(item => {
    const preparation = item.preparationId ? PREPARATION_BY_ID.get(item.preparationId)?.preparation : null;
    return preparation ? [{ item, preparation }] : [];
  });
  const depletedItems = selected.filter(row => availablePreparationUses(row.item, row.preparation) < 1);
  const selectedCanonicalTools = toolStates.filter(tool => selectedToolIds.includes(tool.instanceId) && !tool.broken && !tool.consumed);
  const tools = toolIdsForInventory(inventory, selectedToolIds, toolStates);
  selectedCanonicalTools.forEach(tool => tools.add(tool.toolId));
  const missingToolIds = Array.from(new Set(selected.flatMap(row => row.preparation.requiredTools)
    .filter(tool => tool !== 'none' && !tools.has(tool))));
  const boilOrBrew = selected.filter(row => /BOIL|BREW/i.test(row.preparation.method));
  const hasDoubleBoiler = selectedCanonicalTools.some(tool => tool.upgradeId === 'double-boiler');
  const potencyBoost = hasDoubleBoiler && boilOrBrew.length === 1
    ? { itemId: boilOrBrew[0].item.id, amount: 1 }
    : undefined;
  const collected = collectTags(selected, tools, [], potencyBoost);
  const requirement = evaluateRequirement(
    applyAilmentTagOverrides(definition.requirements, definition.id, overrides),
    collected.tags
  );
  const specialState = ailment.specialState || {};
  const specialRequirements = [
    ...(Array.isArray(specialState.additionalRequirements)
      ? specialState.additionalRequirements as Array<{ tag: RuleTag; threshold: number }>
      : []),
    ...(typeof specialState.poisonRequirement === 'number'
      ? [{ tag: 'POISON' as RuleTag, threshold: specialState.poisonRequirement }]
      : [])
  ];
  const missingSpecial = specialRequirements
    .filter(row => (collected.tags[row.tag] || 0) < row.threshold)
    .map(row => `${row.tag} ${row.threshold}`);
  const first = selected[0];
  const second = selected[1];
  const catalyseTags = first && second && tools.has('glass-alembic')
    ? first.preparation.tags
      .map(row => row.tag)
      .filter((tag): tag is Exclude<RuleTag, 'FAIR' | 'FOUL'> => tag !== 'FAIR' && tag !== 'FOUL')
      .filter(tag => second.preparation.tags.some(row => row.tag === tag))
      .filter((tag, index, rows) => rows.indexOf(tag) === index)
      .filter(tag => {
        const catalysed = collectTags(selected, tools, [{ tag, itemIds: [first.item.id, second.item.id] }], potencyBoost);
        const catalysedRequirement = evaluateRequirement(
          applyAilmentTagOverrides(definition.requirements, definition.id, overrides),
          catalysed.tags
        );
        const catalysedSpecial = specialRequirements.every(row => (catalysed.tags[row.tag] || 0) >= row.threshold);
        return catalysedRequirement.satisfied && catalysedSpecial;
      })
    : [];
  const requiresCatalyse = catalyseTags.length > 0 && (!requirement.satisfied || missingSpecial.length > 0);
  const messages = [
    ...(selected.length === 0 ? ['Select at least one prepared Reagent.'] : []),
    ...(duplicateItemIds ? ['The same Remedy ingredient cannot be selected more than once.'] : []),
    ...depletedItems.map(row => `Selected Reagent has no remaining Uses: ${row.item.name}`),
    ...missingToolIds.map(tool => `Required Tool is not selected: ${tool}`),
    ...requirement.missing,
    ...missingSpecial,
    ...(purify && !purifyEligible ? ['PURIFY requires the last gathered Reagent to have been gathered in a Mountain Location.'] : []),
    ...collected.messages
  ];
  const foul = purify && purifyEligible ? 0 : collected.foul;
  if (definition.canonicalName === 'Bad Idea' && foul > 0) messages.push('Bad Idea cannot be treated with a Remedy containing FOUL.');
  return {
    ready: selected.length > 0 && !duplicateItemIds && depletedItems.length === 0 && missingToolIds.length === 0
      && (requirement.satisfied || requiresCatalyse) && (missingSpecial.length === 0 || requiresCatalyse)
      && !(purify && !purifyEligible) && collected.messages.length === 0
      && !(definition.canonicalName === 'Bad Idea' && foul > 0),
    requiresCatalyse,
    catalyseTags,
    providedTags: collected.tags,
    requirement,
    fair: collected.fair,
    foul,
    rawFoul: collected.foul,
    missingToolIds,
    messages: Array.from(new Set(messages))
  };
};

export const canTreatAilmentWithInventory = (
  patient: PatientState,
  ailmentInstanceId: string,
  inventory: readonly EngineInventoryItem[],
  overrides: readonly TreatmentAilmentTagOverride[] = [],
  availableToolIds: readonly string[] = [],
  toolStates: readonly CanonicalToolState[] = []
): boolean => {
  const ailment = patient.ailments.find(row => row.id === ailmentInstanceId && row.status === 'active');
  if (!ailment?.ailmentId) return false;
  const definition = AILMENT_BY_ID.get(ailment.ailmentId);
  if (!definition) return false;

  const inventoryToolInstanceIds = new Set(inventory
    .filter(item => item.type === 'tool')
    .map(item => item.id));
  const usableToolStates = toolStates.filter(tool =>
    inventoryToolInstanceIds.has(tool.instanceId) && !tool.broken && !tool.consumed
  );
  const toolStateByInstanceId = new Map(toolStates.map(tool => [tool.instanceId, tool]));
  const tools = new Set(availableToolIds);
  inventory
    .filter(item => item.type === 'tool')
    .forEach(item => {
      const toolState = toolStateByInstanceId.get(item.id);
      if (toolState?.broken || toolState?.consumed) return;
      [item.canonicalToolId, item.id].forEach(id => { if (id) tools.add(id); });
    });
  usableToolStates
    .forEach(tool => tools.add(tool.toolId));
  const prepared = inventory.flatMap(item => {
    if (item.type !== 'reagent' || !item.preparationId) return [];
    const preparation = PREPARATION_BY_ID.get(item.preparationId)?.preparation;
    if (!preparation || availablePreparationUses(item, preparation) < 1
      || preparation.requiredTools.some(tool => tool !== 'none' && !tools.has(tool))) return [];
    return [{ item, preparation }];
  });
  if (prepared.length === 0) return false;

  const ingredientPolaritySelections = [
    prepared,
    prepared.filter(row => !row.preparation.tags.some(tag => tag.tag === 'FOUL')),
    prepared.filter(row => !row.preparation.tags.some(tag => tag.tag === 'FAIR'))
  ].filter((rows, index, all) => rows.length > 0
    && all.findIndex(other => other.map(row => row.item.id).join('\u0000') === rows.map(row => row.item.id).join('\u0000')) === index);
  const hasDoubleBoiler = usableToolStates.some(tool => tool.upgradeId === 'double-boiler');
  const candidateSelections = ingredientPolaritySelections.flatMap(selection => {
    if (!hasDoubleBoiler) return [selection];
    const nonBoilOrBrew = selection.filter(row => !/BOIL|BREW/i.test(row.preparation.method));
    const boilOrBrew = selection.filter(row => /BOIL|BREW/i.test(row.preparation.method));
    return [selection, ...boilOrBrew.map(row => [...nonBoilOrBrew, row])];
  }).filter((rows, index, all) => rows.length > 0
    && all.findIndex(other => other.map(row => row.item.id).join('\u0000') === rows.map(row => row.item.id).join('\u0000')) === index);
  const specialState = ailment.specialState || {};
  const specialRequirements = [
    ...(Array.isArray(specialState.additionalRequirements)
      ? specialState.additionalRequirements as Array<{ tag: RuleTag; threshold: number }>
      : []),
    ...(typeof specialState.poisonRequirement === 'number'
      ? [{ tag: 'POISON' as RuleTag, threshold: specialState.poisonRequirement }]
      : [])
  ];

  return candidateSelections.some(selection => {
    const boilOrBrew = selection.filter(row => /BOIL|BREW/i.test(row.preparation.method));
    const potencyBoost = hasDoubleBoiler && boilOrBrew.length === 1
      ? { itemId: boilOrBrew[0].item.id, amount: 1 }
      : undefined;
    const collected = collectTags(selection, tools, [], potencyBoost);
    const tags = collected.tags;
    if (tools.has('glass-alembic')) {
      const contributions = new Map<RuleTag, Array<{ itemId: string; value: number }>>();
      selection.forEach(({ item, preparation }) => preparation.tags.forEach(tag => {
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
    const canonicalSatisfied = evaluateRequirement(
      applyAilmentTagOverrides(definition.requirements, definition.id, overrides),
      tags
    ).satisfied;
    const dynamicSatisfied = specialRequirements.every(row => (tags[row.tag] || 0) >= row.threshold);
    const forbiddenFoul = definition.canonicalName === 'Bad Idea' && (tags.FOUL || 0) > 0;
    return collected.messages.length === 0 && canonicalSatisfied && dynamicSatisfied && !forbiddenFoul;
  });
};

/** p.33: if any active Ailment can now be treated, create that Remedy before decreasing any Timers. */
export const hasImmediatelyTreatableAilment = (
  patient: PatientState,
  inventory: readonly EngineInventoryItem[],
  overrides: readonly TreatmentAilmentTagOverride[] = [],
  availableToolIds: readonly string[] = [],
  toolStates: readonly CanonicalToolState[] = []
): boolean => patient.ailments.some(ailment => ailment.status === 'active'
  && canTreatAilmentWithInventory(patient, ailment.id, inventory, overrides, availableToolIds, toolStates));

const updateAilment = (
  patient: PatientState,
  ailment: PatientAilmentState,
  treatment: TreatmentHistoryEntry,
  status: 'treated' | 'failed'
): PatientState => {
  const timers = patient.timers.map(timer => (ailment.timerIds || []).includes(timer.id)
    ? { ...timer, status: 'stopped' as const }
    : timer);
  const ailments = patient.ailments.map(row => row.id === ailment.id
    ? {
      ...row,
      status,
      treatmentHistoryIds: [...(row.treatmentHistoryIds || []), treatment.id],
      successResolved: status === 'treated',
      failureResolved: status === 'failed',
      consequenceResolved: status === 'failed',
      effectIds: [...(row.effectIds || []), treatment.id]
    }
    : row);
  const allResolved = ailments.every(row => row.status !== 'active');
  return {
    ...patient,
    status: allResolved ? (ailments.some(row => row.status === 'failed') ? 'failed' : 'cured') : 'active',
    ailments,
    timers,
    treatmentHistory: [...(patient.treatmentHistory || []), treatment]
  };
};

export const resolveTreatmentTransaction = (input: TreatmentEngineInput): TreatmentEngineResolution => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Treatment requires a transaction ID.'] };
  if (!input.state.patient || !Array.isArray(input.state.patient.ailments) || !Array.isArray(input.state.patient.timers)) {
    return { status: 'invalid', value: null, messages: ['Patient state is malformed.'] };
  }
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: {
      transactionId: input.transactionId,
      nextState: input.state,
      requirement: null,
      providedTags: {},
      remedyFlags: [],
      fair: 0,
      foul: 0,
      trinketReward: 0,
      reputationChange: 0,
      consumedItemIds: [],
      manualEffects: [],
      badIdeaOutcomeApplied: false,
      allAilmentsResolved: input.state.patient.ailments.every(ailment => ailment.status !== 'active')
    }, messages: ['Transaction was already applied.'] };
  }

  if (input.mode === 'fail-expired') {
    if (input.ailmentInstanceIds.length === 0 || input.ailmentInstanceIds.length !== new Set(input.ailmentInstanceIds).size) {
      return { status: 'invalid', value: null, messages: ['Expired Ailment instances must be a non-empty unique list.'] };
    }
    const expiring = input.ailmentInstanceIds.map(id => input.state.patient.ailments.find(row => row.id === id));
    const invalidExpired = expiring.some(ailment => !ailment
      || ailment.status !== 'failed'
      || !ailment.failureResolved
      || ailment.consequenceResolved
      || !(ailment.timerIds || []).some(timerId => input.state.patient.timers.find(timer => timer.id === timerId)?.status === 'expired'));
    if (invalidExpired) {
      return { status: 'invalid', value: null, messages: ['Every failed Ailment must have a newly expired Timer and an unresolved Consequence.'] };
    }
    let patient = input.state.patient;
    let reputationLoss = 0;
    for (const id of input.ailmentInstanceIds) {
      const ailment = patient.ailments.find(row => row.id === id)!;
      const treatment: TreatmentHistoryEntry = {
        id: `${input.transactionId}:${id}`,
        ailmentInstanceIds: [id],
        preparationIds: [],
        providedTags: {},
        outcome: 'failure',
        effects: []
      };
      // Some encounter patients explicitly grant and cost no Reputation or
      // Trinkets (for example The Branded, p.162). That printed exception
      // applies to failure as well as successful treatment.
      if (ailment.specialState?.rewardMode !== 'none') {
        reputationLoss += severityValue(ailment.severity);
      }
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
        remedyFlags: [],
        fair: 0,
        foul: 0,
        trinketReward: 0,
        reputationChange: reputationLoss === 0 ? 0 : -reputationLoss,
        consumedItemIds: [],
        manualEffects: [],
        badIdeaOutcomeApplied: false,
        allAilmentsResolved: patient.ailments.every(row => row.status !== 'active')
      },
      messages: ['Apply each printed Ailment Consequence before Moving On.']
    };
  }

  if (input.purify && !input.purifyEligible) {
    return { status: 'invalid', value: null, messages: ['PURIFY requires the last gathered Reagent to have been gathered in a Mountain Location.'] };
  }

  const ailment = input.state.patient.ailments.find(row => row.id === input.ailmentInstanceId && row.status === 'active');
  if (!ailment || !ailment.ailmentId) return { status: 'invalid', value: null, messages: ['Active canonical Ailment instance not found.'] };
  const definition = AILMENT_BY_ID.get(ailment.ailmentId);
  if (!definition) return { status: 'invalid', value: null, messages: ['Canonical Ailment definition not found.'] };
  if (input.selectedItemIds.length !== new Set(input.selectedItemIds).size) {
    return { status: 'invalid', value: null, messages: ['The same Remedy ingredient cannot be selected more than once.'] };
  }
  const selectedItems = input.selectedItemIds.map(id => input.state.inventory.find(item => item.id === id));
  if (selectedItems.length === 0 || selectedItems.some(item => !item || item.type !== 'reagent' || !item.preparationId)) {
    return { status: 'invalid', value: null, messages: ['Every selected Remedy ingredient must be a canonical prepared Reagent in Inventory.'] };
  }
  const selected = selectedItems.map(item => ({
    item: item!,
    preparation: PREPARATION_BY_ID.get(item!.preparationId!)?.preparation
  }));
  if (selected.some(row => !row.preparation)) return { status: 'invalid', value: null, messages: ['Selected Inventory contains an unknown Preparation.'] };
  const doseCount = Math.max(1, Math.floor(input.doseCount || 1));
  if (doseCount > 1 && (definition.canonicalName !== 'Stingshock' || doseCount !== 2)) {
    return { status: 'invalid', value: null, messages: ['Only Stingshock may use exactly two complete Remedy doses in one treatment.'] };
  }
  if (selected.some(row => availablePreparationUses(row.item!, row.preparation!) < doseCount)) {
    return { status: 'invalid', value: null, messages: ['Every selected Remedy ingredient needs enough remaining Uses for the complete dose.'] };
  }
  let resolvedTools = input.state.tools || [];
  const selectedCanonicalTools = resolvedTools.filter(tool => input.selectedToolIds.includes(tool.instanceId) && !tool.broken && !tool.consumed);
  const tools = toolIdsForInventory(input.state.inventory, input.selectedToolIds, resolvedTools);
  selectedCanonicalTools.forEach(tool => tools.add(tool.toolId));
  const missingTool = selected.find(row => row.preparation!.requiredTools.some(tool => tool !== 'none' && !tools.has(tool)));
  if (missingTool) return { status: 'invalid', value: null, messages: [`Required Tool is not selected: ${missingTool.preparation!.requiredTools.join(', ')}`] };
  if (input.preserve && !tools.has('big-iron-cauldron')) {
    return { status: 'invalid', value: null, messages: ['PRESERVE requires a selected Big Iron Cauldron.'] };
  }
  const preservedByIngredient = selected.some(row => row.preparation!.specialRules.some(rule =>
    rule.effect.type === 'customEffect' && rule.effect.code === 'ADDS_PRESERVED'
  ));
  const remedyFlags: Array<'PRESERVED'> = input.preserve || preservedByIngredient ? ['PRESERVED'] : [];

  let potencyBoost: { itemId: string; amount: number } | undefined;
  const boilOrBrew = selected.filter(row => /BOIL|BREW/i.test(row.preparation!.method));
  const doubleBoilers = selectedCanonicalTools.filter(tool => tool.upgradeId === 'double-boiler' && !tool.broken && !tool.consumed).slice(0, 1);
  if (doubleBoilers.length > 0 && boilOrBrew.length === 1) {
    const resolved = resolveToolEffects({
      transactionId: `${input.transactionId}:tool:double-boiler`,
      phase: 'treatment', trigger: 'treatment', tools: resolvedTools,
      selectedToolInstanceIds: doubleBoilers.map(tool => tool.instanceId), rulesetId: 'original-1e-3p'
    });
    resolvedTools = resolved.tools;
    potencyBoost = { itemId: boilOrBrew[0].item.id, amount: resolved.potencyDelta };
  }
  const combs = selectedCanonicalTools.filter(tool => tool.toolId === 'fine-toothed-comb' && !tool.broken && !tool.consumed);
  for (const comb of combs) {
    const card = input.toolCards?.[comb.instanceId];
    if (!card) return { status: 'invalid', value: null, messages: ['Fine-toothed Comb use requires its breakage card.'] };
    const resolved = resolveToolEffects({
      transactionId: `${input.transactionId}:tool:comb:${comb.instanceId}`,
      phase: 'treatment', trigger: 'comb-remedy', tools: resolvedTools,
      selectedToolInstanceIds: [comb.instanceId], card, rulesetId: 'original-1e-3p'
    });
    resolvedTools = resolved.tools;
  }

  const collected = collectTags(
    selected as Array<{ item: EngineInventoryItem; preparation: ReagentPreparation }>,
    tools,
    input.catalyse || [],
    potencyBoost
  );
  if (collected.messages.length > 0) return { status: 'invalid', value: null, messages: collected.messages };
  const effectiveFoul = input.purify ? 0 : collected.foul;
  if (definition.canonicalName === 'Bad Idea' && effectiveFoul > 0) {
    return { status: 'invalid', value: null, messages: ['Bad Idea cannot be treated with a Remedy containing FOUL.'] };
  }
  const badIdeaQualifies = definition.canonicalName === 'Bad Idea'
    && selected.some(row => row.preparation!.tags.some(tag => tag.tag !== 'FAIR' && tag.tag !== 'FOUL' && tag.value >= 3));
  let badIdeaTools = resolvedTools;
  let badIdeaAppliedTransactionIds = input.state.appliedTransactionIds;
  if (badIdeaQualifies) {
    if (!input.badIdeaOutcome) {
      const availableTools = (input.state.tools || []).filter(tool => !tool.broken && !tool.consumed);
      const upgradeTargets = availableTools.flatMap(tool => {
        if (tool.upgradeId) return [];
        const upgrades = TOOL_UPGRADES
          .filter(upgrade => upgrade.baseToolId === tool.toolId)
          .map(upgrade => ({ id: upgrade.id, canonicalName: upgrade.canonicalName }));
        return upgrades.length > 0 ? [{ toolInstanceId: tool.instanceId, toolId: tool.toolId, upgrades }] : [];
      });
      const lightenTargets = availableTools
        .filter(tool => toolWeight(tool) > 0)
        .map(tool => ({ toolInstanceId: tool.instanceId, toolId: tool.toolId, currentWeight: toolWeight(tool) }));
      return {
        status: 'manual',
        value: null,
        messages: ['Choose the Bad Idea Inspiration reward and its Tool target before committing treatment.'],
        manualAction: { kind: 'bad-idea-inspiration', upgradeTargets, lightenTargets }
      };
    }
    const inspiration = resolveBadIdeaOutcomeEffect({
      transactionId: `${input.transactionId}:bad-idea-inspiration`,
      state: { tools: input.state.tools || [], appliedTransactionIds: input.state.appliedTransactionIds },
      choice: input.badIdeaOutcome
    });
    if (!inspiration.value) return { status: 'invalid', value: null, messages: inspiration.messages };
    badIdeaTools = inspiration.value.tools;
    badIdeaAppliedTransactionIds = inspiration.value.appliedTransactionIds;
  }
  const specialState = ailment.specialState || {};
  const additionalRequirements = Array.isArray(specialState.additionalRequirements)
    ? specialState.additionalRequirements as Array<{ tag: RuleTag; threshold: number }>
    : [];
  const quagmirePoison = typeof specialState.poisonRequirement === 'number'
    ? [{ tag: 'POISON' as const, threshold: specialState.poisonRequirement }]
    : [];
  const unmetSpecial = [...additionalRequirements, ...quagmirePoison]
    .filter(row => (collected.tags[row.tag] || 0) < row.threshold)
    .map(row => `${row.tag} ${row.threshold}`);
  const requirement = evaluateRequirement(
    applyAilmentTagOverrides(definition.requirements, definition.id, input.state.ailmentTagOverrides),
    collected.tags
  );
  if (unmetSpecial.length > 0) return { status: 'invalid', value: null, messages: unmetSpecial };
  if (!requirement.satisfied) return { status: 'invalid', value: null, messages: requirement.missing };
  const confirmed = new Set(input.confirmedManualRequirements || []);
  const unconfirmedManual = requirement.manual.filter(message => !confirmed.has(message));
  if (unconfirmedManual.length > 0) return { status: 'manual', value: null, messages: unconfirmedManual };

  const consumed = consumeItems(input.state.inventory, input.selectedItemIds, doseCount);
  const netFair = definition.canonicalName === 'Wormridden'
    ? Math.max(0, collected.fair - effectiveFoul)
    : collected.fair - effectiveFoul;
  const baseReward = Math.max(0, severityValue(definition.severity) + Math.trunc(netFair / 2));
  const rewardsSuppressed = specialState.rewardMode === 'none';
  const gifting = Boolean(!rewardsSuppressed && input.gifting && baseReward > 0);
  const trinketReward = rewardsSuppressed
    ? 0
    : gifting ? 0 : baseReward + Math.max(0, Math.floor(input.trinketRewardBonus || 0));
  const brandCareChange = definition.canonicalName === 'Brand Care' && specialState.brandCareChoice !== 'treat' ? -2 : 0;
  const stingshockChange = definition.canonicalName === 'Stingshock' && doseCount >= 2 ? 3 : 0;
  const cookedWakeChange = definition.canonicalName === 'Wake'
    && selected.some(row => row.preparation?.method.toUpperCase().includes('COOK')) ? 2 : 0;
  const reputationChange = rewardsSuppressed
    ? 0
    : severityValue(definition.severity) + (gifting ? 2 : 0)
      + brandCareChange + stingshockChange + cookedWakeChange;
  const treatment: TreatmentHistoryEntry = {
    id: `${input.transactionId}:treatment`,
    ailmentInstanceIds: [ailment.id],
    preparationIds: selected.map(row => row.preparation!.id),
    providedTags: collected.tags,
    remedyFlags,
    outcome: 'success',
    effects: definition.successEffects,
    journalEventId: `${input.transactionId}:journal`
  };
  const patient = updateAilment(input.state.patient, ailment, treatment, 'treated');
  const nextState: TreatmentTransactionState = {
    ...input.state,
    inventory: consumed.inventory,
    tools: badIdeaTools,
    patient,
    reputation: input.state.reputation + reputationChange,
    trinkets: input.state.trinkets + trinketReward,
    journalEvents: [...input.state.journalEvents, {
      id: `${input.transactionId}:journal`,
      type: 'treatment',
      title: `Remedy: ${definition.canonicalName}`,
      text: input.journalText
    }],
    appliedTransactionIds: [...badIdeaAppliedTransactionIds, input.transactionId]
  };
  const manualEffects = [...definition.successEffects, ...definition.specialRules]
    .filter(effect => effect.support !== 'implemented')
    .filter(() => definition.canonicalName !== 'Bad Idea');
  return {
    status: manualEffects.length > 0 ? 'manual' : 'resolved',
    value: {
      transactionId: input.transactionId,
      nextState,
      requirement,
      providedTags: collected.tags,
      remedyFlags,
      fair: collected.fair,
      foul: effectiveFoul,
      trinketReward,
      reputationChange,
      consumedItemIds: consumed.consumedIds,
      manualEffects,
      badIdeaOutcomeApplied: badIdeaQualifies,
      allAilmentsResolved: patient.ailments.every(row => row.status !== 'active')
    },
    messages: manualEffects.length > 0 ? ['Base treatment succeeded. Resolve any printed optional Outcome or special rule shown.'] : []
  };
};
