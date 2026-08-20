import { getRuleCardValue, type RuleCard } from './cards';
import type { EngineInventoryItem } from './gameplay';
import type {
  PrintedCanonicalActionTemplate,
  PrintedEffectDefinition,
  PrintedResolutionInput,
  PrintedTrigger
} from './printedEffects';
import type { PatientState } from './state';

const OBJECTS = ['Implement or Gadget', 'Container', 'Accessory', 'Clothing or Equipment', 'Book', 'Toy / Animal / Entertainment', 'Instrument', 'Tchotchke', 'Pilgrimage Memento', 'Local Souvenir', 'Food / Delicacy', 'Seedling / Potted Plant'] as const;
const MATERIALS = ['Titanesque', 'Hardwood', 'Bone', 'Iron', 'Silver', 'Repurposed', 'Copper', 'Flint', 'Grasses / Plant Fibres', 'Pretty Stone', 'Glass', 'Softwood'] as const;
const ORIGINS = ['Unwanted Gift', 'Tattered & sentimental', 'Inherited from family', 'Discovered by roadside', 'Handmade by owner', 'Part of a collection', 'Traded from faraway', 'Survived spring cleaning', 'Imported from the west coast', 'Permanently borrowed', 'Too big or small for the original owner', 'A friend’s (they went Elsewhere)'] as const;
const uniqueRows = <T,>(rows: T[]): T[] => [...new Set(rows)];

export interface TrinketRecord {
  trinketId: string;
  object: string;
  material: string;
  origin: string;
  acquiredAt: number;
  source: string;
  spent: boolean;
  journalEntryId: string;
}

export const createTrinketRecord = (input: { transactionId: string; cards: [RuleCard, RuleCard, RuleCard]; acquiredAt: number; source: string; journalEntryId: string }): TrinketRecord => {
  const indexes = input.cards.map(card => getRuleCardValue(card, 'table') - 1);
  return { trinketId: `trinket:${input.transactionId}`, object: OBJECTS[indexes[0]], material: MATERIALS[indexes[1]], origin: ORIGINS[indexes[2]], acquiredAt: input.acquiredAt, source: input.source, spent: false, journalEntryId: input.journalEntryId };
};

export interface ManualEffectDraft {
  effectId: string;
  ruleId: string;
  ruleIds: string[];
  sourcePage: number;
  summary: string;
  registryEffectId: string | null;
  ownerId: string;
  ownerType: 'encounter' | 'ailment' | 'service' | 'legacy';
  trigger: PrintedTrigger | 'service-follow-up';
  printedText: string;
  resolutionInstruction: string;
  mandatoryConditions: string[];
  choices: string[];
  canonicalActions: string[];
  inputFields: PrintedResolutionInput[];
  inputValues: Record<string, string | number | boolean>;
  actionTemplates: PrintedCanonicalActionTemplate[];
  selectedActionIds: string[];
  actionTargets: Record<string, string>;
  followUpRequirements: string[];
  context: ManualEffectContext;
  resultSummary: string;
  journalNote: string;
  status: 'manual' | 'deferred' | 'resolved' | 'overridden';
  transactionId: string | null;
  overrideReason: string;
  createdAt: number;
  updatedAt: number;
}

export interface ManualEffectContext {
  encounterTransactionId?: string;
  barterId?: string;
  patientId?: string;
  ailmentInstanceId?: string;
  locationId?: string;
  continuation?: 'barter-social' | 'foraging' | 'travel' | 'ailment-close' | 'none';
}

export interface PendingManualFollowUp {
  id: string;
  effectId: string;
  ownerId: string;
  trigger: ManualEffectDraft['trigger'];
  description: string;
  context: ManualEffectContext;
  createdAt: number;
  transactionId: string;
  status: 'pending' | 'resolved';
}

export interface ManualEffectRecord {
  id: string;
  effectId: string;
  registryEffectId: string | null;
  ownerId: string;
  trigger: ManualEffectDraft['trigger'];
  status: 'resolved' | 'overridden';
  override: boolean;
  overrideReason: string;
  inputValues: Record<string, string | number | boolean>;
  appliedActionIds: string[];
  resultSummary: string;
  journalNote: string;
  transactionId: string;
  resolvedAt: number;
}

export interface ManualResolutionRuntimeState {
  reputation: number;
  trinkets: number;
  calendarDays: number;
  foragingPoints: number;
  inventory: EngineInventoryItem[];
  patient: PatientState | null;
  conditions: string[];
  pendingFollowUps: PendingManualFollowUp[];
  appliedTransactionIds: string[];
}

export interface ManualEffectTransactionResolution {
  status: 'resolved' | 'invalid';
  value: {
    draft: ManualEffectDraft;
    record: ManualEffectRecord;
    nextState: ManualResolutionRuntimeState;
  } | null;
  messages: string[];
}

export const createManualEffectDraft = (
  effect: PrintedEffectDefinition,
  trigger: PrintedTrigger,
  context: ManualEffectContext = {},
  createdAt = Date.now()
): ManualEffectDraft => {
  if (!effect.supportedTriggers.includes(trigger)) throw new Error(`${effect.ownerId} does not support the ${trigger} trigger.`);
  const metadata = effect.manualResolutionByTrigger[trigger] || effect.manualResolution;
  if (!metadata) throw new Error(`${effect.ownerId} has no manual resolution metadata for ${trigger}.`);
  return {
    effectId: `${effect.id}:${trigger}:${context.encounterTransactionId || context.patientId || createdAt}`,
    ruleId: effect.ruleIds[0],
    ruleIds: [...effect.ruleIds],
    sourcePage: effect.sourcePage,
    summary: effect.ownerName,
    registryEffectId: effect.id,
    ownerId: effect.ownerId,
    ownerType: effect.ownerType,
    trigger,
    printedText: effect.triggerText[trigger] || effect.printedText,
    resolutionInstruction: metadata.decision,
    mandatoryConditions: [...metadata.mandatoryConditions],
    choices: [...metadata.choices],
    canonicalActions: metadata.actionTemplates.map(action => action.label),
    inputFields: metadata.inputFields.map(field => ({ ...field, options: field.options ? [...field.options] : undefined })),
    inputValues: {},
    actionTemplates: metadata.actionTemplates.map(action => ({ ...action })),
    selectedActionIds: [],
    actionTargets: {},
    followUpRequirements: [...metadata.followUpRequirements],
    context: { ...context, continuation: context.continuation || 'none' },
    resultSummary: '',
    journalNote: '',
    status: 'manual',
    transactionId: null,
    overrideReason: '',
    createdAt,
    updatedAt: createdAt
  };
};

export const normalizeLegacyManualEffectDraft = (value: unknown, now = Date.now()): ManualEffectDraft | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<ManualEffectDraft>;
  if (typeof row.effectId !== 'string') return null;
  const ruleIds = Array.isArray(row.ruleIds) ? row.ruleIds.map(String) : [String(row.ruleId || 'CORE-002')];
  return {
    effectId: row.effectId,
    ruleId: String(row.ruleId || ruleIds[0]),
    ruleIds,
    sourcePage: Number(row.sourcePage || 6),
    summary: String(row.summary || 'Legacy manual effect'),
    registryEffectId: typeof row.registryEffectId === 'string' ? row.registryEffectId : null,
    ownerId: String(row.ownerId || row.effectId),
    ownerType: row.ownerType === 'encounter' || row.ownerType === 'ailment' || row.ownerType === 'service' ? row.ownerType : 'legacy',
    trigger: row.trigger || 'service-follow-up',
    printedText: String(row.printedText || row.summary || ''),
    resolutionInstruction: String(row.resolutionInstruction || 'Record the decision required by the saved manual effect.'),
    mandatoryConditions: Array.isArray(row.mandatoryConditions) ? row.mandatoryConditions.map(String) : [],
    choices: Array.isArray(row.choices) ? row.choices.map(String) : [],
    canonicalActions: Array.isArray(row.canonicalActions) ? row.canonicalActions.map(String) : [],
    inputFields: Array.isArray(row.inputFields) ? row.inputFields : [{ id: 'outcome-detail', type: 'free-text', label: 'Saved effect outcome', required: true }],
    inputValues: row.inputValues && typeof row.inputValues === 'object' ? row.inputValues : {},
    actionTemplates: Array.isArray(row.actionTemplates) ? row.actionTemplates : [],
    selectedActionIds: Array.isArray(row.selectedActionIds) ? row.selectedActionIds.map(String) : [],
    actionTargets: row.actionTargets && typeof row.actionTargets === 'object' ? row.actionTargets : {},
    followUpRequirements: Array.isArray(row.followUpRequirements) ? row.followUpRequirements.map(String) : [],
    context: row.context && typeof row.context === 'object' ? row.context : { continuation: 'none' },
    resultSummary: String(row.resultSummary || ''),
    journalNote: String(row.journalNote || ''),
    status: row.status === 'deferred' || row.status === 'resolved' || row.status === 'overridden' ? row.status : 'manual',
    transactionId: typeof row.transactionId === 'string' ? row.transactionId : null,
    overrideReason: String(row.overrideReason || ''),
    createdAt: Number(row.createdAt || now),
    updatedAt: Number(row.updatedAt || row.createdAt || now)
  };
};

export const resolveManualEffect = (draft: ManualEffectDraft, transactionId: string, override = false): ManualEffectDraft => {
  if (!transactionId || draft.transactionId) throw new Error('Manual effect transaction is missing or already applied.');
  if (!draft.resultSummary.trim() || !draft.journalNote.trim()) throw new Error('Result summary and journal note are required.');
  if (override && !draft.overrideReason.trim()) throw new Error('Override reason is required.');
  return { ...draft, transactionId, status: override ? 'overridden' : 'resolved', updatedAt: Date.now() };
};

const hasFieldValue = (value: string | number | boolean | undefined) => value === true
  || typeof value === 'number'
  || (typeof value === 'string' && value.trim().length > 0);

const printedInventoryWeight = (target: string, sourceText: string): number => {
  const text = `${target} ${sourceText}`
    .replaceAll('⅓', '1/3')
    .replaceAll('⅔', '2/3');
  if (/\bNo Weight\b/i.test(text)) return 0;
  const match = text.match(/\bWeight\s+(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/i);
  if (!match) return 1 / 3;
  const numerator = Number(match[1]);
  const denominator = match[2] ? Number(match[2]) : 1;
  return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0
    ? numerator / denominator
    : 1 / 3;
};

const printedInventoryName = (target: string): string => target
  .replace(/\s*\(\s*Weight\s+(?:\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|[⅓⅔])\s*\)\s*/ig, ' ')
  .trim()
  .replace(/^['‘’“”"]+|['‘’“”"]+$/g, '')
  .trim();

export const resolveManualEffectTransaction = (input: {
  draft: ManualEffectDraft;
  transactionId: string;
  state: ManualResolutionRuntimeState;
  override?: boolean;
  resolvedAt?: number;
}): ManualEffectTransactionResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId) || input.draft.transactionId) {
    return { status: 'invalid', value: null, messages: ['Manual effect transaction is missing or already applied.'] };
  }
  if (!input.draft.resultSummary.trim() || !input.draft.journalNote.trim()) {
    return { status: 'invalid', value: null, messages: ['Result summary and journal note are required.'] };
  }
  const missingFields = input.draft.inputFields
    .filter(field => field.required && !hasFieldValue(input.draft.inputValues[field.id]))
    .map(field => field.label);
  if (missingFields.length > 0) return { status: 'invalid', value: null, messages: missingFields.map(label => `Required resolution input: ${label}`) };
  if (input.override && !input.draft.overrideReason.trim()) {
    return { status: 'invalid', value: null, messages: ['Override reason is required and is recorded separately from a normal resolution.'] };
  }

  const actionById = new Map(input.draft.actionTemplates.map(action => [action.id, action]));
  const selectedActions = input.draft.selectedActionIds.map(id => actionById.get(id));
  if (selectedActions.some(action => !action)) return { status: 'invalid', value: null, messages: ['A selected canonical action is not part of this printed effect.'] };
  let nextState: ManualResolutionRuntimeState = {
    ...input.state,
    inventory: [...input.state.inventory],
    conditions: [...input.state.conditions],
    pendingFollowUps: [...input.state.pendingFollowUps],
    appliedTransactionIds: [...input.state.appliedTransactionIds]
  };

  for (const action of selectedActions as PrintedCanonicalActionTemplate[]) {
    if (action.kind === 'modify-reputation') nextState.reputation = Math.max(0, nextState.reputation + (action.amount || 0));
    if (action.kind === 'modify-trinkets') nextState.trinkets = Math.max(0, nextState.trinkets + (action.amount || 0));
    if (action.kind === 'modify-days') nextState.calendarDays = Math.max(0, nextState.calendarDays + (action.amount || 0));
    if (action.kind === 'modify-foraging-points') nextState.foragingPoints = Math.max(0, nextState.foragingPoints + (action.amount || 0));
    if (action.kind === 'modify-timer') {
      if (!nextState.patient) return { status: 'invalid', value: null, messages: ['This Timer action requires the affected Patient to remain available.'] };
      const targetId = input.draft.actionTargets[action.id];
      const eligible = nextState.patient.timers.filter(timer => timer.status === 'active' && (!targetId || timer.id === targetId));
      if (eligible.length === 0) return { status: 'invalid', value: null, messages: ['Choose an active Timer for the printed Timer change.'] };
      const eligibleIds = new Set(eligible.map(timer => timer.id));
      nextState.patient = {
        ...nextState.patient,
        timers: nextState.patient.timers.map(timer => {
          if (!eligibleIds.has(timer.id)) return timer;
          const current = Math.max(0, Math.min(timer.maximum, timer.current + (action.amount || 0)));
          return { ...timer, current, status: current === 0 ? 'expired' as const : timer.status };
        })
      };
    }
    if (action.kind === 'remove-inventory') {
      const targetId = input.draft.actionTargets[action.id];
      if (!targetId || !nextState.inventory.some(item => item.id === targetId)) {
        return { status: 'invalid', value: null, messages: ['Choose an eligible Inventory item to remove.'] };
      }
      nextState.inventory = nextState.inventory.filter(item => item.id !== targetId);
    }
    if (action.kind === 'gain-inventory') {
      const rawItemName = input.draft.actionTargets[action.id]?.trim();
      const itemName = rawItemName ? printedInventoryName(rawItemName) : '';
      if (!itemName) return { status: 'invalid', value: null, messages: ['Name the printed Inventory item to gain.'] };
      nextState.inventory.push({
        id: `${input.transactionId}:inventory:${action.id}`,
        name: itemName,
        type: 'item',
        weight: printedInventoryWeight(rawItemName!, action.sourceText),
        quantity: 1,
        ruinedWhenSoaked: /ruined if soaked/i.test(`${rawItemName} ${action.sourceText}`)
      });
    }
    if (action.kind === 'record-condition') {
      const description = input.draft.actionTargets[action.id] || action.sourceText;
      nextState.conditions = [...new Set([...nextState.conditions, `manual:${input.draft.ownerId}:${description}`])];
    }
  }

  const resolvedFollowUp = String(input.draft.inputValues['follow-up-result'] || '').trim();
  const pendingDescriptions = resolvedFollowUp ? [] : input.draft.followUpRequirements;
  for (const action of selectedActions as PrintedCanonicalActionTemplate[]) {
    if (action.kind === 'record-map-change' || action.kind === 'record-movement') {
      pendingDescriptions.push(input.draft.actionTargets[action.id] || action.sourceText);
    }
  }
  const createdFollowUps: PendingManualFollowUp[] = uniqueRows(pendingDescriptions).map((description, index) => ({
    id: `${input.transactionId}:follow-up:${index + 1}`,
    effectId: input.draft.effectId,
    ownerId: input.draft.ownerId,
    trigger: input.draft.trigger,
    description,
    context: { ...input.draft.context },
    createdAt: input.resolvedAt || Date.now(),
    transactionId: input.transactionId,
    status: 'pending'
  }));
  nextState.pendingFollowUps = [...nextState.pendingFollowUps, ...createdFollowUps];
  nextState.appliedTransactionIds = [...nextState.appliedTransactionIds, input.transactionId];
  const resolvedAt = input.resolvedAt || Date.now();
  const draft = {
    ...input.draft,
    transactionId: input.transactionId,
    status: input.override ? 'overridden' as const : 'resolved' as const,
    updatedAt: resolvedAt
  };
  const record: ManualEffectRecord = {
    id: `${input.transactionId}:record`,
    effectId: draft.effectId,
    registryEffectId: draft.registryEffectId,
    ownerId: draft.ownerId,
    trigger: draft.trigger,
    status: draft.status,
    override: Boolean(input.override),
    overrideReason: input.override ? draft.overrideReason : '',
    inputValues: { ...draft.inputValues },
    appliedActionIds: selectedActions.map(action => action!.id),
    resultSummary: draft.resultSummary,
    journalNote: draft.journalNote,
    transactionId: input.transactionId,
    resolvedAt
  };
  return { status: 'resolved', value: { draft, record, nextState }, messages: [] };
};
