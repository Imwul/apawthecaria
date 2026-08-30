import { getRuleCardValue, type RuleCard } from './cards';
import type { EngineInventoryItem } from './gameplay';
import type { CompanionState } from './data/mobility';
import { ENCOUNTERS } from './data/encounters';
import { REAGENTS } from './data/reagents';
import { TOOL_BY_ID } from './data/tools';
import { isForagingPreparationAvailableInSeason } from './foragingEngine';
import {
  ENCOUNTER_CONDITION_CODES,
  FRESH_CLAMS_BARTER_VALUE,
  encounterForagingPointMultiplier,
  isStackableEncounterCondition
} from './encounterConditionRuntime';
import {
  isPrintedResolutionInputSatisfied,
  type PrintedCanonicalActionTemplate,
  type PrintedEffectDefinition,
  type PrintedResolutionInput,
  type PrintedTrigger
} from './printedEffects';
import type { PatientState } from './state';
import type { Season } from './types';

const OBJECTS = ['Implement or Gadget', 'Container', 'Accessory', 'Clothing or Equipment', 'Book', 'Toy / Animal / Entertainment', 'Instrument', 'Tchotchke', 'Pilgrimage Memento', 'Local Souvenir', 'Food / Delicacy', 'Seedling / Potted Plant'] as const;
const MATERIALS = ['Titanesque', 'Hardwood', 'Bone', 'Iron', 'Silver', 'Repurposed', 'Copper', 'Flint', 'Grasses / Plant Fibres', 'Pretty Stone', 'Glass', 'Softwood'] as const;
const ORIGINS = ['Unwanted Gift', 'Tattered & sentimental', 'Inherited from family', 'Discovered by roadside', 'Handmade by owner', 'Part of a collection', 'Traded from faraway', 'Survived spring cleaning', 'Imported from the west coast', 'Permanently borrowed', 'Too big or small for the original owner', 'A friend’s (they went Elsewhere)'] as const;
const uniqueRows = <T,>(rows: T[]): T[] => [...new Set(rows)];

const CLAMMY_REAGENTS = new Set([
  'Big Fish', 'Small Fish', 'Beehive', 'Blackcurrant',
  'Cucumber', 'Strawberries', 'Roses', 'Wild Garlic'
]);
const QUICK_CURE_TAGS = new Set(['INFECTION', 'BURN', 'PAIN']);
const TITAN_THINGAMABOB_TOOL_ID = 'titan-thingamabob';
const MANUAL_SEASONS: readonly Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
const MANUAL_CARD_VALUE_OPTIONS = [
  'A · 1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J · 11', 'Q/K (M) · 12'
] as const;

const canonicalPartOption = (reagentId: string, preparationId: string): string | null => {
  const reagent = REAGENTS.find(row => row.id === reagentId);
  const preparation = reagent?.preparations.find(row => row.id === preparationId);
  return reagent && preparation
    ? `${reagent.canonicalName} · ${preparation.name} · ${preparation.method}`
    : null;
};

const canonicalPartFromOption = (option: string) => {
  for (const reagent of REAGENTS) {
    for (const preparation of reagent.preparations) {
      if (canonicalPartOption(reagent.id, preparation.id) === option) return { reagent, preparation };
    }
  }
  return null;
};

const canonicalReagentItem = (
  transactionId: string,
  actionId: string,
  reagent: (typeof REAGENTS)[number],
  preparation: (typeof REAGENTS)[number]['preparations'][number]
): EngineInventoryItem => ({
  id: `${transactionId}:inventory:${actionId}:${preparation.id}`,
  name: `${reagent.canonicalName} (${preparation.name})`,
  type: 'reagent',
  weight: preparation.weight,
  quantity: 1,
  canonicalReagentId: reagent.id,
  preparationId: preparation.id,
  usesRemaining: preparation.uses,
  ruinedWhenSoaked: true
});

const preparationForInventoryItem = (item: EngineInventoryItem) => {
  if (item.type !== 'reagent' || !item.canonicalReagentId || !item.preparationId) return null;
  const reagent = REAGENTS.find(row => row.id === item.canonicalReagentId);
  const preparation = reagent?.preparations.find(row => row.id === item.preparationId);
  return reagent && preparation ? { reagent, preparation } : null;
};

const inventoryTagPotency = (item: EngineInventoryItem, tag: string): number => {
  const part = preparationForInventoryItem(item);
  return part?.preparation.tags
    .filter(candidate => candidate.tag === tag)
    .reduce((total, candidate) => total + candidate.value, 0) || 0;
};

const isHoneyOrFairReagent = (item: EngineInventoryItem): boolean => {
  const part = preparationForInventoryItem(item);
  return Boolean(part && (part.preparation.name === 'Honey' || inventoryTagPotency(item, 'FAIR') > 0));
};

const acquireEncounterCompanion = (
  companions: CompanionState[],
  transactionId: string,
  companionId: 'butterfly' | 'honeybee'
): CompanionState[] => companions.some(row => row.instanceId === `${transactionId}:companion:${companionId}`)
  ? companions
  : [...companions, {
      instanceId: `${transactionId}:companion:${companionId}`,
      companionId,
      pathsTravelled: 0,
      seasonsTravelled: 0,
      usedThisJourney: false,
      pendingForage: null,
      pendingForageDraws: 0
    }];

const isTitanThingamabob = (item: EngineInventoryItem): boolean =>
  item.canonicalToolId === TITAN_THINGAMABOB_TOOL_ID
  || /^Titan Thingamabob$/i.test(item.name.trim());

const allPartsReagentForAction = (action: PrintedCanonicalActionTemplate) => {
  const text = `${action.fixedTarget || ''} ${action.label} ${action.sourceText}`;
  const canonicalName = /Small Fish/i.test(text) && /all (?:canonical )?Parts/i.test(text)
    ? 'Small Fish'
    : /Big Fish/i.test(text) && /all (?:canonical )?Parts/i.test(text)
      ? 'Big Fish'
      : null;
  return canonicalName ? REAGENTS.find(row => row.canonicalName === canonicalName) || null : null;
};

export const BEES_MANUAL_OWNER_ID = 'social-meadow-spring-♣';
export const BETTING_MANUAL_OWNER_ID = 'social-forest-summer-♣';
export const QUEEN_BEE_COMPANION_ID = 'queen-bee';
export const BETTING_MATCH_TRINKET_ACTION_ID = `${BETTING_MANUAL_OWNER_ID}:branch:bet:trinkets`;
export const BETTING_MATCH_WAGER_OPTIONS = ['1', '2', '4'] as const;
export const BETTING_MATCH_RESULT_OPTIONS = [
  '1st — double the bet',
  '2nd — make the bet back',
  '3rd or 4th — lose the bet'
] as const;

export interface BettingMatchTrinketOutcome {
  wager: 1 | 2 | 4;
  result: typeof BETTING_MATCH_RESULT_OPTIONS[number];
  /** Net change after the wager itself is returned or lost. */
  netChange: number;
}

/** p.196: first place returns the stake plus equal winnings, second returns
 * only the stake, and third/fourth loses it. */
export const deriveBettingMatchTrinketOutcome = (
  wagerValue: unknown,
  resultValue: unknown
): BettingMatchTrinketOutcome | null => {
  const wager = Number(String(wagerValue ?? '').trim());
  if (wager !== 1 && wager !== 2 && wager !== 4) return null;
  const result = String(resultValue ?? '').trim();
  if (!BETTING_MATCH_RESULT_OPTIONS.includes(result as typeof BETTING_MATCH_RESULT_OPTIONS[number])) return null;
  return {
    wager,
    result: result as typeof BETTING_MATCH_RESULT_OPTIONS[number],
    netChange: result === BETTING_MATCH_RESULT_OPTIONS[0]
      ? wager
      : result === BETTING_MATCH_RESULT_OPTIONS[1] ? 0 : -wager
  };
};

export const acquireQueenBeeCompanion = (
  companions: CompanionState[],
  transactionId: string
): CompanionState[] => companions.some(row => row.instanceId === `${transactionId}:companion:${QUEEN_BEE_COMPANION_ID}`)
  ? companions
  : [...companions, {
      instanceId: `${transactionId}:companion:${QUEEN_BEE_COMPANION_ID}`,
      companionId: QUEEN_BEE_COMPANION_ID,
      pathsTravelled: 0,
      seasonsTravelled: 0,
      usedThisJourney: false,
      pendingForage: null,
      pendingForageDraws: 0
    }];

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
  /** Stable map node ids paired with location targets selected in the UI. */
  mapTargetIds?: Record<string, string>;
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
  /** Stable selected Encounter branch; optional for pre-v9/legacy drafts. */
  encounterChoiceId?: string;
  barterId?: string;
  patientId?: string;
  ailmentInstanceId?: string;
  locationId?: string;
  /** Current campaign season for Encounter rewards constrained to
   * "in-season" Reagents. Legacy drafts without it request the season once. */
  season?: Season;
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
  /** Typed canonical work carried by this follow-up. Omitted for narrative-only rows. */
  kind?: 'cocoon-hatch' | 'delivery';
  /** Stable Bag item created by the originating transaction. */
  targetInventoryItemId?: string;
  /** Destination for a printed delivery quest (for example the Parcel). */
  targetLocationId?: string;
  targetLocationName?: string;
  /** Reward granted exactly once when the carried item reaches its address. */
  deliveryReward?: {
    trinkets?: number;
    reputation?: number;
  };
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
  actionTargets: Record<string, string>;
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
  /** Optional only for legacy callers; the production runtime always supplies these. */
  companions?: CompanionState[];
  companionCapacity?: number;
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
    mapTargetIds: {},
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
    mapTargetIds: row.mapTargetIds && typeof row.mapTargetIds === 'object' && !Array.isArray(row.mapTargetIds)
      ? Object.fromEntries(Object.entries(row.mapTargetIds).filter(([key, value]) => typeof key === 'string' && typeof value === 'string' && value.trim()))
      : {},
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

export const normalizePendingManualFollowUp = (
  value: unknown,
  now = 0
): PendingManualFollowUp | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Partial<PendingManualFollowUp>;
  if (typeof row.id !== 'string' || !row.id.trim()) return null;
  const allowedTriggers = new Set<PendingManualFollowUp['trigger']>([
    'encounter',
    'diagnosis',
    'timer-change',
    'barter',
    'treatment-success',
    'treatment-failure',
    'leave',
    'service-follow-up'
  ]);
  const trigger = allowedTriggers.has(row.trigger as PendingManualFollowUp['trigger'])
    ? row.trigger as PendingManualFollowUp['trigger']
    : 'service-follow-up';
  const context = row.context && typeof row.context === 'object' && !Array.isArray(row.context)
    ? row.context
    : { continuation: 'none' as const };
  const parsedCreatedAt = Number(row.createdAt);
  const fallbackCreatedAt = Number(now);
  const ownerId = typeof row.ownerId === 'string' && row.ownerId.trim() ? row.ownerId : row.id;
  const description = typeof row.description === 'string' ? row.description : '';
  const cocoonKind = ownerId === BETTING_MANUAL_OWNER_ID
    && (row.kind === 'cocoon-hatch'
      || /\bcocoon\b.{0,180}\b(?:hatch(?:es|ed|ing)?|butterfly)\b/i.test(description))
    ? 'cocoon-hatch' as const
    : undefined;
  const deliveryKind = row.kind === 'delivery'
    || (typeof row.targetLocationName === 'string' && /parcel|소포/i.test(`${row.targetLocationName} ${description}`))
    ? 'delivery' as const
    : undefined;
  const kind = cocoonKind || deliveryKind;
  const targetInventoryItemId = kind
    && typeof row.targetInventoryItemId === 'string'
    && row.targetInventoryItemId.trim()
    ? row.targetInventoryItemId
    : undefined;
  const targetLocationId = deliveryKind
    && typeof row.targetLocationId === 'string'
    && row.targetLocationId.trim()
    ? row.targetLocationId
    : undefined;
  const targetLocationName = deliveryKind
    && typeof row.targetLocationName === 'string'
    && row.targetLocationName.trim()
    ? row.targetLocationName.trim()
    : undefined;
  const deliveryReward = deliveryKind && row.deliveryReward && typeof row.deliveryReward === 'object'
    ? {
        ...(Number.isFinite(Number(row.deliveryReward.trinkets)) ? { trinkets: Math.max(0, Number(row.deliveryReward.trinkets)) } : {}),
        ...(Number.isFinite(Number(row.deliveryReward.reputation)) ? { reputation: Math.max(0, Number(row.deliveryReward.reputation)) } : {})
      }
    : undefined;
  return {
    id: row.id,
    effectId: typeof row.effectId === 'string' && row.effectId.trim() ? row.effectId : row.id,
    ownerId,
    trigger,
    description,
    context,
    createdAt: Number.isFinite(parsedCreatedAt)
      ? parsedCreatedAt
      : Number.isFinite(fallbackCreatedAt) ? fallbackCreatedAt : 0,
    transactionId: typeof row.transactionId === 'string' && row.transactionId.trim()
      ? row.transactionId
      : `${row.id}:legacy`,
    status: row.status === 'resolved' ? 'resolved' : 'pending',
    ...(kind ? { kind } : {}),
    ...(targetInventoryItemId ? { targetInventoryItemId } : {}),
    ...(targetLocationId ? { targetLocationId } : {}),
    ...(targetLocationName ? { targetLocationName } : {}),
    ...(deliveryReward && Object.keys(deliveryReward).length > 0 ? { deliveryReward } : {})
  };
};

export interface ManualFollowUpRuntimeState {
  inventory: EngineInventoryItem[];
  companions: CompanionState[];
  companionCapacity?: number;
  pendingFollowUps: PendingManualFollowUp[];
  appliedTransactionIds: string[];
}

export interface ManualFollowUpTransactionResolution {
  status: 'resolved' | 'invalid';
  value: {
    followUp: PendingManualFollowUp;
    nextState: ManualFollowUpRuntimeState;
    canonicalResult: string;
  } | null;
  messages: string[];
}

export interface DeliveryFollowUpRuntimeState {
  inventory: EngineInventoryItem[];
  reputation: number;
  trinkets: number;
  pendingFollowUps: PendingManualFollowUp[];
  appliedTransactionIds: string[];
}

export interface DeliveryFollowUpResolution {
  status: 'resolved' | 'invalid';
  value: {
    nextState: DeliveryFollowUpRuntimeState;
    completedFollowUps: PendingManualFollowUp[];
    canonicalResult: string;
  } | null;
  messages: string[];
}

const normalizedDeliveryLocation = (value: unknown): string => String(value || '')
  .normalize('NFKC')
  .toLocaleLowerCase('en-US')
  .replace(/[“”‘’'"`]/g, '')
  .replace(/[^\p{Letter}\p{Number}]+/gu, '')
  .trim();

const deliveryParcelForFollowUp = (
  inventory: readonly EngineInventoryItem[],
  followUp: PendingManualFollowUp
): EngineInventoryItem | null => {
  const isParcel = (item: EngineInventoryItem) => item.type === 'item'
    && item.quantity !== undefined
    && item.quantity > 0
    && /^parcel$/i.test(item.name.trim());
  if (followUp.targetInventoryItemId) {
    const exact = inventory.find(item => item.id === followUp.targetInventoryItemId);
    return exact && isParcel(exact) ? exact : null;
  }
  const candidates = inventory.filter(item => item.id.startsWith(`${followUp.transactionId}:inventory:`) && isParcel(item));
  return candidates.length === 1 ? candidates[0] : null;
};

/**
 * Resolves printed Parcel deliveries when a Move reaches the chosen address.
 * The destination is deliberately matched by the player's saved map id or
 * exact name; this never infers a route or silently completes a wrong stop.
 */
export const resolveDeliveryFollowUpsAtLocation = (input: {
  transactionId: string;
  destinationId?: string;
  destinationName: string;
  state: DeliveryFollowUpRuntimeState;
}): DeliveryFollowUpResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Delivery transaction is missing or already applied.'] };
  }
  const destinationId = String(input.destinationId || '').trim();
  const destinationName = normalizedDeliveryLocation(input.destinationName);
  const matching = input.state.pendingFollowUps
    .map(row => normalizePendingManualFollowUp(row))
    .filter((row): row is PendingManualFollowUp => Boolean(row)
      && row.status === 'pending'
      && row.kind === 'delivery'
      && Boolean(row.targetLocationId && destinationId && row.targetLocationId === destinationId
        || row.targetLocationName && destinationName
          && normalizedDeliveryLocation(row.targetLocationName) === destinationName));
  if (matching.length === 0) {
    return { status: 'invalid', value: null, messages: ['No pending Parcel delivery is addressed to this Location.'] };
  }

  const inventory = input.state.inventory.map(item => ({ ...item }));
  const completed: PendingManualFollowUp[] = [];
  let reputation = input.state.reputation;
  let trinkets = input.state.trinkets;
  const completedIds = new Set<string>();
  for (const followUp of matching) {
    const parcel = deliveryParcelForFollowUp(inventory, followUp);
    if (!parcel) continue;
    const reward = followUp.deliveryReward || {};
    const rewardTrinkets = Number.isFinite(Number(reward.trinkets)) ? Math.max(0, Number(reward.trinkets)) : 0;
    const rewardReputation = Number.isFinite(Number(reward.reputation)) ? Math.max(0, Number(reward.reputation)) : 0;
    const remaining = Math.max(0, Number(parcel.quantity || 0) - 1);
    if (remaining === 0) {
      const index = inventory.findIndex(item => item.id === parcel.id);
      if (index >= 0) inventory.splice(index, 1);
    } else {
      const index = inventory.findIndex(item => item.id === parcel.id);
      if (index >= 0) inventory[index] = { ...inventory[index], quantity: remaining };
    }
    trinkets += rewardTrinkets;
    reputation = Math.max(0, reputation + rewardReputation);
    completed.push({ ...followUp, status: 'resolved' });
    completedIds.add(followUp.id);
  }
  if (completed.length === 0) {
    return {
      status: 'invalid',
      value: null,
      messages: ['The addressed Parcel is not in the Bags, so the delivery remains pending.']
    };
  }
  const completedById = new Map(completed.map(row => [row.id, row]));
  const pendingFollowUps = input.state.pendingFollowUps.map(row => completedById.get(row.id) || row);
  const rewardText = completed.map(row => {
    const reward = row.deliveryReward || {};
    const parts = [
      Number(reward.trinkets) > 0 ? `장신구 ${Number(reward.trinkets)}개` : '',
      Number(reward.reputation) > 0 ? `Guild Reputation ${Number(reward.reputation)}` : ''
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' 및 ') : '보상 없음';
  }).join(', ');
  return {
    status: 'resolved',
    value: {
      completedFollowUps: completed,
      canonicalResult: `${input.destinationName}에 소포를 전달했습니다. ${rewardText}을 받았습니다.`,
      nextState: {
        inventory,
        reputation,
        trinkets,
        pendingFollowUps,
        appliedTransactionIds: [...new Set([...input.state.appliedTransactionIds, input.transactionId])]
      }
    },
    messages: []
  };
};

const cocoonItemForFollowUp = (
  inventory: readonly EngineInventoryItem[],
  followUp: PendingManualFollowUp
): EngineInventoryItem | null => {
  const isCanonicalCocoon = (item: EngineInventoryItem): boolean => item.type === 'item'
    && item.quantity > 0
    && /^cocoon$/i.test(item.name.trim());
  const belongsToOriginatingTransaction = (item: EngineInventoryItem): boolean =>
    item.id.startsWith(`${followUp.transactionId}:inventory:`);
  if (followUp.targetInventoryItemId) {
    const exactTarget = inventory.find(item => item.id === followUp.targetInventoryItemId);
    return exactTarget
      && belongsToOriginatingTransaction(exactTarget)
      && isCanonicalCocoon(exactTarget)
      ? exactTarget
      : null;
  }
  const fromOriginatingTransaction = inventory.filter(item =>
    belongsToOriginatingTransaction(item) && isCanonicalCocoon(item)
  );
  if (fromOriginatingTransaction.length === 1) return fromOriginatingTransaction[0];
  return null;
};

/** Commits a confirmed follow-up against the latest canonical state exactly once. */
export const resolveManualFollowUpTransaction = (input: {
  followUpId: string;
  transactionId: string;
  state: ManualFollowUpRuntimeState;
  eligibilityEvidence?: 'travelled-10-paths' | 'journey-ended';
}): ManualFollowUpTransactionResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Manual follow-up transaction is missing or already applied.'] };
  }
  const stored = input.state.pendingFollowUps.find(row => row.id === input.followUpId);
  const current = normalizePendingManualFollowUp(stored);
  if (!current || current.status !== 'pending') {
    return { status: 'invalid', value: null, messages: ['This manual follow-up is no longer pending.'] };
  }

  let inventory = input.state.inventory.map(item => ({ ...item }));
  let companions = input.state.companions.map(row => ({ ...row }));
  let canonicalResult = '후속 판정을 기록했습니다.';

  if (current.kind === 'cocoon-hatch') {
    if (input.eligibilityEvidence !== 'travelled-10-paths'
      && input.eligibilityEvidence !== 'journey-ended') {
      return {
        status: 'invalid',
        value: null,
        messages: ['Confirm that the Cocoon has travelled 10 Paths since it was gained, or that its Journey has ended.']
      };
    }
    const cocoon = cocoonItemForFollowUp(inventory, current);
    if (!cocoon) {
      return {
        status: 'invalid',
        value: null,
        messages: ['The Cocoon created by this result is missing or ambiguous. Restore the affected item before completing its hatch.']
      };
    }
    if (typeof input.state.companionCapacity === 'number' && companions.length >= input.state.companionCapacity) {
      return {
        status: 'invalid',
        value: null,
        messages: ['No travelling Companion slot is available for the Butterfly.']
      };
    }
    inventory = cocoon.quantity > 1
      ? inventory.map(item => item.id === cocoon.id ? { ...item, quantity: item.quantity - 1 } : item)
      : inventory.filter(item => item.id !== cocoon.id);
    companions = [...companions, {
      instanceId: `${input.transactionId}:companion:butterfly`,
      companionId: 'butterfly',
      pathsTravelled: 0,
      seasonsTravelled: 0,
      usedThisJourney: false,
      pendingForage: null,
      pendingForageDraws: 0
    }];
    const evidenceLabel = input.eligibilityEvidence === 'travelled-10-paths'
      ? 'Cocoon을 얻은 뒤 10 Paths 이동 완료'
      : 'Cocoon을 얻은 여정 종료';
    canonicalResult = `${evidenceLabel}: Cocoon 1개가 Butterfly 동반자로 부화했습니다.`;
  }

  const followUp = { ...current, status: 'resolved' as const };
  return {
    status: 'resolved',
    value: {
      followUp,
      canonicalResult,
      nextState: {
        inventory,
        companions,
        companionCapacity: input.state.companionCapacity,
        pendingFollowUps: input.state.pendingFollowUps.map(row => row.id === current.id ? followUp : row),
        appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
      }
    },
    messages: []
  };
};

export const resolveManualEffect = (draft: ManualEffectDraft, transactionId: string, override = false): ManualEffectDraft => {
  if (!transactionId || draft.transactionId) throw new Error('Manual effect transaction is missing or already applied.');
  if (override && !draft.overrideReason.trim()) throw new Error('Override reason is required.');
  return {
    ...draft,
    resultSummary: draft.resultSummary.trim() || manualEffectSystemSummary(draft),
    transactionId,
    status: override ? 'overridden' : 'resolved',
    updatedAt: Date.now()
  };
};

const manualEffectSystemSummary = (draft: ManualEffectDraft): string => {
  const encounterChoiceId = typeof draft.context.encounterChoiceId === 'string'
    ? draft.context.encounterChoiceId
    : '';
  const encounterChoice = encounterChoiceId
    ? ENCOUNTERS.find(encounter => encounter.id === draft.ownerId)
      ?.choices.find(choice => choice.id === encounterChoiceId)?.label
    : '';
  const printedChoice = typeof draft.inputValues['printed-choice'] === 'string'
    ? draft.inputValues['printed-choice'].trim()
    : '';
  const branch = printedChoice || encounterChoice || encounterChoiceId;
  const selectedIds = new Set(draft.selectedActionIds);
  const actions = draft.actionTemplates
    .filter(action => selectedIds.has(action.id))
    .map(action => action.label);
  const parts = [
    branch ? `선택: ${branch}` : '',
    actions.length > 0 ? `적용: ${actions.join(', ')}` : '추가 상태 변화 없음'
  ].filter(Boolean);
  return parts.join(' · ');
};

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
  .replace(/\s*\(\s*No Weight\s*\)\s*/ig, ' ')
  .trim()
  .replace(/^['‘’“”"]+|['‘’“”"]+$/g, '')
  .trim();

const expectedPrintedChoiceForContext = (draft: ManualEffectDraft): string | null => {
  if (draft.ownerId === BEES_MANUAL_OWNER_ID) {
    if (draft.context.encounterChoiceId === 'protect-the-queen') return 'Protect the Queen';
    if (draft.context.encounterChoiceId === 'release-the-queen') return 'Release The Queen';
    if (draft.context.encounterChoiceId === 'wish-them-luck') return 'Wish Them Luck';
  }
  if (draft.ownerId === BETTING_MANUAL_OWNER_ID) {
    if (draft.context.encounterChoiceId === 'an-opportunity') return 'An Opportunity';
    if (draft.context.encounterChoiceId === 'place-a-bet') return 'Place a Bet';
  }
  if (draft.ownerId === 'travel-meadow-7-8'
    && draft.context.encounterChoiceId === 'deliver-the-parcel') return 'Deliver the Parcel';
  return null;
};

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
  const missingFields = input.draft.inputFields
    // Rulebook p.7 treats journal/narrative writing as optional. A legacy
    // draft may still mark prose as required, but only mechanical inputs can
    // block the transaction.
    .filter(field => field.required
      && field.type !== 'free-text'
      && !isPrintedResolutionInputSatisfied(field, input.draft.inputValues[field.id]))
    .map(field => field.label);
  if (missingFields.length > 0) return { status: 'invalid', value: null, messages: missingFields.map(label => `Required resolution input: ${label}`) };
  const expectedPrintedChoice = expectedPrintedChoiceForContext(input.draft);
  if (expectedPrintedChoice && input.draft.inputValues['printed-choice'] !== expectedPrintedChoice) {
    return {
      status: 'invalid',
      value: null,
      messages: ['The persisted printed choice does not match the selected Encounter branch. Re-select the printed choice before resolving.']
    };
  }
  if (input.override && !input.draft.overrideReason.trim()) {
    return { status: 'invalid', value: null, messages: ['Override reason is required and is recorded separately from a normal resolution.'] };
  }

  const actionById = new Map(input.draft.actionTemplates.map(action => [action.id, action]));
  const selectedActions = input.draft.selectedActionIds.map(id => actionById.get(id));
  if (selectedActions.some(action => !action)) return { status: 'invalid', value: null, messages: ['A selected canonical action is not part of this printed effect.'] };
  const isParcelDeliveryBranch = input.draft.ownerId === 'travel-meadow-7-8'
    && input.draft.context.encounterChoiceId === 'deliver-the-parcel';
  if (isParcelDeliveryBranch) {
    const parcelAction = input.draft.actionTemplates.find(action =>
      action.kind === 'gain-inventory' && /\bparcel\b/i.test(`${action.sourceText} ${action.label}`));
    const addressAction = input.draft.actionTemplates.find(action =>
      action.kind === 'record-map-change' && (action.targetInputId === 'parcel-address'
        || /(?:choose|location|4\s+paths?)/i.test(action.sourceText)));
    const selectedIds = new Set(input.draft.selectedActionIds);
    if (!parcelAction || !addressAction
      || input.draft.inputValues['printed-choice'] !== 'Deliver the Parcel'
      || !selectedIds.has(parcelAction.id)
      || !selectedIds.has(addressAction.id)
      || input.draft.selectedActionIds.length !== 2) {
      return {
        status: 'invalid',
        value: null,
        messages: ['The Parcel delivery branch requires the printed Parcel and 4-Path address actions.']
      };
    }
  }
  if (input.draft.ownerId === BETTING_MANUAL_OWNER_ID && input.draft.context.encounterChoiceId === 'place-a-bet') {
    const outcome = deriveBettingMatchTrinketOutcome(
      input.draft.inputValues['bet-wager'],
      input.draft.inputValues['bet-result']
    );
    if (!outcome) {
      return { status: 'invalid', value: null, messages: ['Choose the printed wager and finishing result for Place a Bet.'] };
    }
    const action = actionById.get(BETTING_MATCH_TRINKET_ACTION_ID);
    if (!action
      || action.kind !== 'modify-trinkets'
      || action.required !== true
      || action.amount !== outcome.netChange
      || input.draft.selectedActionIds.length !== 1
      || input.draft.selectedActionIds[0] !== BETTING_MATCH_TRINKET_ACTION_ID) {
      return { status: 'invalid', value: null, messages: ['The Place a Bet Trinket result does not match the persisted wager and finishing result.'] };
    }
    if (input.state.trinkets < outcome.wager) {
      return { status: 'invalid', value: null, messages: [`Place a Bet requires ${outcome.wager} Trinkets before resolving the wager.`] };
    }
  }
  const missingRequiredActions = input.draft.actionTemplates.filter(action =>
    action.required && !input.draft.selectedActionIds.includes(action.id)
  );
  if (missingRequiredActions.length > 0) {
    return {
      status: 'invalid',
      value: null,
      messages: missingRequiredActions.map(action => `Required printed action is not selected: ${action.label}`)
    };
  }
  const actionTarget = (action: PrintedCanonicalActionTemplate): string => {
    if (action.fixedTarget) return action.fixedTarget;
    if (action.targetInputId) return String(input.draft.inputValues[action.targetInputId] ?? '');
    return input.draft.actionTargets[action.id] || '';
  };
  const missingActionTargets = (selectedActions as PrintedCanonicalActionTemplate[]).filter(action =>
    (action.targetType === 'inventory-item' || action.targetType === 'timer'
      || action.targetType === 'location' || action.targetType === 'free-text')
    && !actionTarget(action).trim()
  );
  if (missingActionTargets.length > 0) {
    return {
      status: 'invalid',
      value: null,
      messages: missingActionTargets.map(action => `Choose the required target for: ${action.label}`)
    };
  }
  const selectedCanonicalActions = selectedActions as PrintedCanonicalActionTemplate[];
  const collectorSwap = input.draft.ownerId === 'foraging-forest-3'
    && input.draft.context.encounterChoiceId === 'collections-development-policy';
  const clammyDeal = input.draft.ownerId === 'social-loch-spring-♣'
    && input.draft.context.encounterChoiceId === 'a-clammy-deal';
  const quickCure = input.draft.ownerId === 'social-forest-odoak-♥'
    && input.draft.context.encounterChoiceId === 'a-quick-cure';
  const titanPower = input.draft.ownerId === 'foraging-titan-6'
    && ['light', 'cameras', 'action'].includes(input.draft.context.encounterChoiceId || '');
  const collectorPart = collectorSwap
    ? canonicalPartFromOption(String(input.draft.inputValues['collector-forest-part'] || ''))
    : null;
  if (collectorSwap && (!collectorPart || collectorPart.reagent.regionAvailability.Forest === 'Unavailable')) {
    return { status: 'invalid', value: null, messages: ['Choose a canonical Reagent Part that can be found in the Forest.'] };
  }
  if (collectorSwap) {
    const offeredAction = selectedCanonicalActions.find(action => action.id.endsWith(':give-reagent-part'));
    const offered = offeredAction ? input.state.inventory.find(item => item.id === actionTarget(offeredAction)) : null;
    if (!offered || offered.type !== 'reagent' || !preparationForInventoryItem(offered)) {
      return { status: 'invalid', value: null, messages: ['The Collector only accepts one canonical Reagent Part from the Bags.'] };
    }
  }
  if (clammyDeal) {
    const payment = String(input.draft.inputValues['clammy-payment'] || '');
    if (payment === '장신구 3개 지불' && input.state.trinkets < 3) {
      return { status: 'invalid', value: null, messages: ['A Clammy Deal requires 3 Trinkets for this payment choice.'] };
    }
    if (payment === '지정된 영약재 부위 하나 제공') {
      const paymentAction = selectedCanonicalActions.find(action => action.id.endsWith(':give-listed-reagent-part'));
      const item = paymentAction ? input.state.inventory.find(row => row.id === actionTarget(paymentAction)) : null;
      const part = item ? preparationForInventoryItem(item) : null;
      if (!part || !CLAMMY_REAGENTS.has(part.reagent.canonicalName)) {
        return {
          status: 'invalid',
          value: null,
          messages: ['Choose a Part from Big Fish, Small Fish, Beehive, Blackcurrant, Cucumber, Strawberries, Roses, or Wild Garlic.']
        };
      }
    }
  }
  let quickCurePotency = 0;
  if (quickCure) {
    const count = Number(input.draft.inputValues['quick-cure-part-count']);
    const removalActions = selectedCanonicalActions.filter(action => /:quick-cure-part-\d+$/.test(action.id));
    if (!Number.isInteger(count) || count < 1 || count > 50 || removalActions.length !== count) {
      return { status: 'invalid', value: null, messages: ['Choose between 1 and 50 Reagent Parts for A Quick Cure.'] };
    }
    const requestedCounts = new Map<string, number>();
    for (const action of removalActions) {
      const itemId = actionTarget(action);
      requestedCounts.set(itemId, (requestedCounts.get(itemId) || 0) + 1);
      const item = input.state.inventory.find(row => row.id === itemId);
      const part = item ? preparationForInventoryItem(item) : null;
      const potency = part?.preparation.tags
        .filter(tag => QUICK_CURE_TAGS.has(tag.tag))
        .reduce((total, tag) => total + tag.value, 0) || 0;
      if (!part || potency < 1) {
        return { status: 'invalid', value: null, messages: ['A Quick Cure only accepts Reagent Parts providing INFECTION, BURN, or PAIN.'] };
      }
      quickCurePotency += potency;
    }
    for (const [itemId, requested] of requestedCounts) {
      const available = Math.max(1, input.state.inventory.find(item => item.id === itemId)?.quantity || 1);
      if (requested > available) {
        return { status: 'invalid', value: null, messages: ['A Quick Cure cannot trade more copies of a Part than are in the Bags.'] };
      }
    }
  }
  const titanThingamabob = titanPower
    ? input.state.inventory.find(isTitanThingamabob) || null
    : null;
  if (titanPower) {
    const consumeActions = selectedCanonicalActions.filter(action => action.id.includes(':lock-and-key:')
      && action.id.endsWith(':thingamabob')
      && action.kind === 'remove-inventory');
    if (!titanThingamabob || consumeActions.length !== 1) {
      return { status: 'invalid', value: null, messages: ['Lock and Key requires one carried Titan Thingamabob.'] };
    }
  }
  const titanPart = titanPower && input.draft.context.encounterChoiceId === 'action'
    ? canonicalPartFromOption(String(input.draft.inputValues['lock-and-key-titan-part'] || ''))
    : null;
  if (titanPower && input.draft.context.encounterChoiceId === 'action'
    && (!titanPart || titanPart.reagent.type !== 'TITAN')) {
    return { status: 'invalid', value: null, messages: ['Choose one canonical Titan Reagent Part for Lock and Key.'] };
  }
  const isBranch = (ownerId: string, choiceId: string): boolean => input.draft.ownerId === ownerId
    && input.draft.context.encounterChoiceId === choiceId;
  const butterflyBefriend = isBranch('foraging-bog-j-spring', 'befriend-it');
  const butterflyFollow = isBranch('foraging-bog-j-spring', 'follow-it');
  const deepWater = isBranch('foraging-loch-a', 'deep-water');
  const funeralRites = isBranch('foraging-loch-8', 'funeral-rites');
  const snackTime = isBranch('foraging-mountain-10-summer', 'snack-time');
  const helpBee = isBranch('foraging-meadow-j-summer', 'help-the-bee');
  const workingForSnack = isBranch('social-loch-autumn-♣', 'working-for-a-snack');
  const fixedPurchase = isBranch('social-loch-settlement-♦', 'projects-wide')
    || isBranch('social-mountain-spoolkeep-♥', 'offcuts');
  const branchBeaten = isBranch('travel-bog-5-6', 'draw-and-pass-the-branches');
  const thatSucks = isBranch('travel-bog-9-10-summer', 'continue');
  const hotTea = isBranch('travel-forest-5-6', 'eavesdrop');
  const piledriver = isBranch('travel-forest-j-winter', 'hurry-forwards');
  const ancientSalvage = isBranch('foraging-bog-2', 'dig');
  const pleasantSurprise = isBranch('foraging-mountain-3', 'luck');
  const marshWader = isBranch('social-bog-winter-♠', 'curiosity');

  if (branchBeaten) {
    const result = String(input.draft.inputValues['branch-beaten-card-result'] || '');
    const seasonValue = input.draft.context.season
      || String(input.draft.inputValues['branch-beaten-season'] || '');
    const season = MANUAL_SEASONS.includes(seasonValue as Season) ? seasonValue as Season : null;
    const selected = selectedCanonicalActions;
    if (result === '4 이하 · 달력 +1일') {
      if (selected.length !== 1 || selected[0].kind !== 'modify-days'
        || selected[0].amount !== 1 || !selected[0].id.endsWith(':branch-beaten:day')) {
        return { status: 'invalid', value: null, messages: ['Branch-Beaten below 5 must apply exactly one marked Day.'] };
      }
    } else if (result === '5–9 · 변화 없이 계속') {
      if (selected.length !== 0) {
        return { status: 'invalid', value: null, messages: ['Branch-Beaten 5–9 has no additional state change.'] };
      }
    } else if (result === '10 이상 · 제철 Bog 영약재 부위 획득') {
      const part = canonicalPartFromOption(String(input.draft.inputValues['branch-beaten-bog-part'] || ''));
      const action = selected[0];
      if (!season || !part
        || part.reagent.regionAvailability.Bog === 'Unavailable'
        || part.reagent.seasonAvailability[season] === 'Unavailable'
        || !isForagingPreparationAvailableInSeason(part.preparation, season)
        || selected.length !== 1
        || action.kind !== 'gain-inventory'
        || !action.id.endsWith(':branch-beaten:reagent')
        || actionTarget(action) !== canonicalPartOption(part.reagent.id, part.preparation.id)) {
        return { status: 'invalid', value: null, messages: ['Choose one canonical in-season Bog Reagent Part for Branch-Beaten.'] };
      }
    } else {
      return { status: 'invalid', value: null, messages: ['Choose the actual Branch-Beaten card range.'] };
    }
  }

  if (thatSucks) {
    const part = canonicalPartFromOption(String(input.draft.inputValues['that-sucks-leech-part'] || ''));
    const action = selectedCanonicalActions[0];
    if (!part || part.reagent.canonicalName !== 'Leech'
      || selectedCanonicalActions.length !== 1
      || action.kind !== 'gain-inventory'
      || !action.id.endsWith(':that-sucks:leech')
      || actionTarget(action) !== canonicalPartOption(part.reagent.id, part.preparation.id)) {
      return { status: 'invalid', value: null, messages: ['Silver Lining must add exactly one canonical Leech Reagent Part.'] };
    }
  }

  if (hotTea) {
    const action = selectedCanonicalActions[0];
    if (selectedCanonicalActions.length !== 1
      || action.kind !== 'gain-inventory'
      || !action.id.endsWith(':hot-tea:gossip')
      || actionTarget(action) !== 'Juicy Gossip (No Weight)') {
      return { status: 'invalid', value: null, messages: ['Eavesdrop must add exactly one weightless Juicy Gossip Guild Note.'] };
    }
  }

  if (piledriver) {
    const result = String(input.draft.inputValues['piledriver-card-result'] || '');
    const carriedWeight = input.state.inventory.reduce((total, item) => (
      total + Math.max(0, Number(item.weight) || 0) * Math.max(1, item.quantity || 1)
    ), 0);
    const safe = result === '♥ · 무사히 통과'
      || result === '♦ · Carry 4 이하 · 무사히 통과';
    const chased = result === '♦ · Carry 4 초과 · 추격'
      || result === '♣ / ♠ · 추격';
    if ((!safe && !chased)
      || (result === '♦ · Carry 4 이하 · 무사히 통과' && carriedWeight > 4)
      || (result === '♦ · Carry 4 초과 · 추격' && carriedWeight <= 4)) {
      return { status: 'invalid', value: null, messages: ['Piledriver Diamond result must match the Bags\' current total Weight.'] };
    }
    if (safe && selectedCanonicalActions.length !== 0) {
      return { status: 'invalid', value: null, messages: ['A safe Piledriver result does not discard any Bag items.'] };
    }
    if (chased) {
      const count = Number(input.draft.inputValues['piledriver-discard-count']);
      const removals = selectedCanonicalActions.filter(action => action.kind === 'remove-inventory'
        && /:piledriver:discard-\d+$/.test(action.id));
      if (!Number.isInteger(count) || count < 1 || count > 50
        || removals.length !== count || selectedCanonicalActions.length !== count) {
        return { status: 'invalid', value: null, messages: ['Choose between 1 and 50 Bag items for the Piledriver chase.'] };
      }
      const requestedCounts = new Map<string, number>();
      let discardedWeight = 0;
      for (const action of removals) {
        const itemId = actionTarget(action);
        const item = input.state.inventory.find(row => row.id === itemId);
        if (!item) {
          return { status: 'invalid', value: null, messages: ['Every Piledriver discard must be an item currently in the Bags.'] };
        }
        requestedCounts.set(itemId, (requestedCounts.get(itemId) || 0) + 1);
        discardedWeight += Math.max(0, Number(item.weight) || 0);
      }
      for (const [itemId, requested] of requestedCounts) {
        const available = Math.max(1, input.state.inventory.find(item => item.id === itemId)?.quantity || 1);
        if (requested > available) {
          return { status: 'invalid', value: null, messages: ['Piledriver cannot discard more copies than are currently in the Bags.'] };
        }
      }
      if (discardedWeight + Number.EPSILON < 3) {
        return { status: 'invalid', value: null, messages: ['Piledriver requires discarding at least 3 total Weight.'] };
      }
    }
  }

  if (ancientSalvage) {
    const result = String(input.draft.inputValues['ancient-salvage-card-result'] || '');
    const success = result === '10 이상 · Titan Thingamabob 획득';
    const failure = result === '9 이하 · 획득 없음';
    const action = selectedCanonicalActions[0];
    if ((!success && !failure)
      || (failure && selectedCanonicalActions.length !== 0)
      || (success && (selectedCanonicalActions.length !== 1
        || action.kind !== 'gain-inventory'
        || !action.id.endsWith(':ancient-salvage:thingamabob')
        || !/^Titan Thingamabob\b/.test(actionTarget(action))))) {
      return { status: 'invalid', value: null, messages: ['Ancient Salvage must match the actual below-10 or 10-or-more card result.'] };
    }
  }

  if (pleasantSurprise) {
    const part = canonicalPartFromOption(String(input.draft.inputValues['pleasant-surprise-earth-part'] || ''));
    const cardOption = String(input.draft.inputValues['pleasant-surprise-card-value'] || '');
    const cardValue = MANUAL_CARD_VALUE_OPTIONS.indexOf(cardOption as typeof MANUAL_CARD_VALUE_OPTIONS[number]) + 1;
    if (!part || part.reagent.type !== 'EARTH' || cardValue < 1) {
      return { status: 'invalid', value: null, messages: ['Choose a canonical Earth Reagent Part, then the actual card value.'] };
    }
    const succeeds = cardValue >= part.reagent.baseRarity;
    const action = selectedCanonicalActions[0];
    if ((!succeeds && selectedCanonicalActions.length !== 0)
      || (succeeds && (selectedCanonicalActions.length !== 1
        || action.kind !== 'gain-inventory'
        || !action.id.endsWith(':pleasant-surprise:earth')
        || actionTarget(action) !== canonicalPartOption(part.reagent.id, part.preparation.id)))) {
      return { status: 'invalid', value: null, messages: ['Pleasant Surprise must compare the card with the chosen Earth Reagent\'s Base Rarity.'] };
    }
  }

  const selectedRemoval = (suffix: string): EngineInventoryItem | null => {
    const action = selectedCanonicalActions.find(candidate => candidate.kind === 'remove-inventory' && candidate.id.endsWith(suffix));
    return action ? input.state.inventory.find(item => item.id === actionTarget(action)) || null : null;
  };

  const marshWaderFood = marshWader ? selectedRemoval(':marsh-wader:food') : null;
  // "Edible" is a narrative judgement in the printed rule. The transaction
  // can still guarantee that the chosen payment is one carried canonical
  // Reagent Part, while leaving the food judgement with the player.
  if (marshWader && (!marshWaderFood || !preparationForInventoryItem(marshWaderFood))) {
    return { status: 'invalid', value: null, messages: ['Marsh Wader requires one carried canonical Reagent Part chosen as edible.'] };
  }

  const butterflyPayment = butterflyBefriend ? selectedRemoval(':butterfly:plant-payment') : null;
  if (butterflyBefriend && (!butterflyPayment || preparationForInventoryItem(butterflyPayment)?.reagent.type !== 'PLANT')) {
    return { status: 'invalid', value: null, messages: ['Fluttering Fancy requires one PLANT Reagent Part.'] };
  }
  const butterflyCardValue = butterflyFollow ? Number(input.draft.inputValues['butterfly-card-value']) : 0;
  const butterflyPart = butterflyFollow
    ? canonicalPartFromOption(String(input.draft.inputValues['butterfly-plant-part'] || ''))
    : null;
  if (butterflyFollow && (!Number.isInteger(butterflyCardValue) || butterflyCardValue < 1 || butterflyCardValue > 12
    || !butterflyPart || butterflyPart.reagent.type !== 'PLANT'
    || butterflyPart.reagent.baseRarity > butterflyCardValue)) {
    return { status: 'invalid', value: null, messages: ['Choose a canonical Plant Reagent Part within the drawn Base Rarity.'] };
  }

  if (deepWater) {
    const timerLoss = Number(input.draft.inputValues['deep-water-timer-loss']);
    const actionLoss = selectedCanonicalActions.reduce((total, action) => (
      action.kind === 'modify-timer' || action.kind === 'modify-foraging-points'
        ? total + Math.abs(action.amount || 0)
        : total
    ), 0);
    if (!Number.isInteger(timerLoss) || timerLoss < 0 || timerLoss > 5 || actionLoss !== 5) {
      return { status: 'invalid', value: null, messages: ['Deep Water must divide exactly 5 between all Timers and Foraging Points.'] };
    }
  }

  const funeralPayment = funeralRites ? selectedRemoval(':funeral-rites:elsewhere-part') : null;
  const funeralPotency = funeralPayment ? inventoryTagPotency(funeralPayment, 'ELSEWHERE') : 0;
  if (funeralRites && funeralPotency < 1) {
    return { status: 'invalid', value: null, messages: ['Funeral Rites requires one Reagent Part with ELSEWHERE.'] };
  }

  const snackPayment = snackTime ? selectedRemoval(':snack-time:reagent') : null;
  if (snackTime && (!snackPayment || !preparationForInventoryItem(snackPayment))) {
    return { status: 'invalid', value: null, messages: ['Snack Time requires one carried canonical Reagent Part.'] };
  }

  const beeSupply = helpBee ? selectedRemoval(':bee-kind:supply') : null;
  const beeRescue = helpBee && selectedCanonicalActions.some(action => action.id.endsWith(':bee-kind:rescue-timers'));
  if (helpBee && beeSupply && !isHoneyOrFairReagent(beeSupply)) {
    return { status: 'invalid', value: null, messages: ['Help the Bee requires Honey or a FAIR Reagent Part for Sweet.'] };
  }
  if (beeRescue && input.state.inventory.some(isHoneyOrFairReagent)) {
    return { status: 'invalid', value: null, messages: ['Rescue is only available when no Honey or FAIR Reagent Part is carried.'] };
  }
  if (fixedPurchase && selectedCanonicalActions.some(action => action.id.endsWith(':purchase:cost'))
    && input.state.trinkets < 5) {
    return { status: 'invalid', value: null, messages: ['This purchase requires 5 Trinkets.'] };
  }

  const companionId = butterflyBefriend ? 'butterfly' as const : helpBee ? 'honeybee' as const : null;
  if (companionId) {
    const companions = input.state.companions || [];
    const instanceId = `${input.transactionId}:companion:${companionId}`;
    if (!companions.some(row => row.instanceId === instanceId)
      && typeof input.state.companionCapacity === 'number'
      && companions.length >= input.state.companionCapacity) {
      return { status: 'invalid', value: null, messages: [`No travelling Companion slot is available for the ${companionId === 'honeybee' ? 'Honeybee' : 'Butterfly'}.`] };
    }
  }
  let nextState: ManualResolutionRuntimeState = {
    ...input.state,
    inventory: [...input.state.inventory],
    conditions: [...input.state.conditions],
    pendingFollowUps: [...input.state.pendingFollowUps],
    appliedTransactionIds: [...input.state.appliedTransactionIds],
    companions: [...(input.state.companions || [])]
  };
  const freshClamsAction = workingForSnack
    ? selectedCanonicalActions.find(action => action.id.endsWith(':working-snack:clams'))
    : undefined;
  const freshClamsItemId = freshClamsAction
    ? `${input.transactionId}:inventory:${freshClamsAction.id}`
    : '';

  for (const action of selectedCanonicalActions) {
    if (action.kind === 'modify-reputation') {
      const amount = funeralRites && action.id.endsWith(':funeral-rites:reputation')
        ? 1 + funeralPotency
        : action.amount || 0;
      nextState.reputation = Math.max(0, nextState.reputation + amount);
    }
    if (action.kind === 'modify-trinkets') nextState.trinkets = Math.max(0, nextState.trinkets + (action.amount || 0));
    if (action.kind === 'modify-days') nextState.calendarDays = Math.max(0, nextState.calendarDays + (action.amount || 0));
    if (action.kind === 'modify-foraging-points') {
      const rawAmount = action.amount || 0;
      const amount = rawAmount > 0
        ? Math.floor(rawAmount * encounterForagingPointMultiplier(nextState.conditions, nextState.patient?.id))
        : rawAmount;
      nextState.foragingPoints = Math.max(0, nextState.foragingPoints + amount);
    }
    if (action.kind === 'set-foraging-points') nextState.foragingPoints = Math.max(0, action.amount || 0);
    if (action.kind === 'modify-timer') {
      if (!nextState.patient) return { status: 'invalid', value: null, messages: ['This Timer action requires the affected Patient to remain available.'] };
      const targetId = actionTarget(action);
      const eligible = nextState.patient.timers.filter(timer => timer.status === 'active'
        && (!targetId || timer.id === targetId || timer.ailmentInstanceId === targetId));
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
      const targetId = titanPower && action.id.includes(':lock-and-key:') && action.id.endsWith(':thingamabob')
        ? titanThingamabob?.id || ''
        : actionTarget(action);
      if (!targetId || !nextState.inventory.some(item => item.id === targetId)) {
        return { status: 'invalid', value: null, messages: ['Choose an eligible Inventory item to remove.'] };
      }
      let removed = false;
      nextState.inventory = nextState.inventory.flatMap(item => {
        if (removed || item.id !== targetId) return [item];
        removed = true;
        const quantity = Math.max(1, item.quantity || 1);
        return quantity > 1 ? [{ ...item, quantity: quantity - 1 }] : [];
      });
    }
    if (action.kind === 'gain-inventory') {
      if (butterflyFollow && action.id.endsWith(':butterfly:plant-reward') && butterflyPart) {
        nextState.inventory.push(canonicalReagentItem(
          input.transactionId,
          action.id,
          butterflyPart.reagent,
          butterflyPart.preparation
        ));
        continue;
      }
      if (titanPower && action.id.endsWith(':lock-and-key:action:reagent') && titanPart) {
        nextState.inventory.push(canonicalReagentItem(
          input.transactionId,
          action.id,
          titanPart.reagent,
          titanPart.preparation
        ));
        continue;
      }
      if (collectorSwap && action.id.endsWith(':receive-forest-part') && collectorPart) {
        nextState.inventory.push(canonicalReagentItem(
          input.transactionId,
          action.id,
          collectorPart.reagent,
          collectorPart.preparation
        ));
        continue;
      }
      const allPartsReagent = allPartsReagentForAction(action);
      if (allPartsReagent) {
        nextState.inventory.push(...allPartsReagent.preparations.map(preparation => canonicalReagentItem(
          input.transactionId,
          action.id,
          allPartsReagent,
          preparation
        )));
        continue;
      }
      const rawItemName = actionTarget(action).trim();
      const canonicalPart = canonicalPartFromOption(rawItemName);
      if (canonicalPart) {
        nextState.inventory.push(canonicalReagentItem(
          input.transactionId,
          action.id,
          canonicalPart.reagent,
          canonicalPart.preparation
        ));
        continue;
      }
      const itemName = rawItemName ? printedInventoryName(rawItemName) : '';
      if (!itemName) return { status: 'invalid', value: null, messages: ['Name the printed Inventory item to gain.'] };
      if (/^Titan Thingamabob$/i.test(itemName)) {
        const tool = TOOL_BY_ID.get(TITAN_THINGAMABOB_TOOL_ID);
        if (!tool) return { status: 'invalid', value: null, messages: ['Titan Thingamabob canonical Tool data is unavailable.'] };
        nextState.inventory.push({
          id: `${input.transactionId}:inventory:${action.id}`,
          name: tool.canonicalName,
          type: 'tool',
          weight: tool.weight,
          quantity: 1,
          canonicalToolId: tool.id
        });
        continue;
      }
      const gainedItem: EngineInventoryItem = {
        id: `${input.transactionId}:inventory:${action.id}`,
        name: itemName,
        type: 'item',
        weight: printedInventoryWeight(rawItemName!, action.sourceText),
        quantity: 1,
        ruinedWhenSoaked: /ruined if soaked/i.test(`${rawItemName} ${action.sourceText}`)
      };
      if (/^Juicy Gossip$/i.test(itemName)) {
        gainedItem.weight = 0;
        gainedItem.guildNote = { kind: 'gossip' };
      }
      if (workingForSnack && action.id.endsWith(':working-snack:clams')) {
        gainedItem.barterValue = FRESH_CLAMS_BARTER_VALUE;
      }
      if (fixedPurchase && action.id.endsWith(':purchase:item')) {
        if (isBranch('social-loch-settlement-♦', 'projects-wide')) {
          gainedItem.type = 'tool';
          gainedItem.weight = 1;
          gainedItem.canonicalToolId = 'bark-coracle';
        } else {
          gainedItem.weight = 1;
          gainedItem.craftedItemId = 'knitted-blanket';
        }
      }
      nextState.inventory.push(gainedItem);
    }
    if (action.kind === 'record-condition') {
      const description = actionTarget(action) || action.sourceText;
      const isQueenAcquisitionRecord = input.draft.ownerId === BEES_MANUAL_OWNER_ID
        && input.draft.context.encounterChoiceId === 'protect-the-queen'
        && /queen bee companion acquired now/i.test(description);
      const isCompanionAcquisitionRecord = /^gain-companion:(?:butterfly|honeybee)$/.test(description);
      if (!isQueenAcquisitionRecord && !isCompanionAcquisitionRecord) {
        const storedCondition = workingForSnack
          && description === ENCOUNTER_CONDITION_CODES.freshClamsSpoil
          && freshClamsItemId
          ? `manual:${input.draft.ownerId}:${description}:${freshClamsItemId}`
          : `manual:${input.draft.ownerId}:${description}`;
        nextState.conditions = isStackableEncounterCondition(storedCondition)
          ? [...nextState.conditions, storedCondition]
          : [...new Set([...nextState.conditions, storedCondition])];
      }
    }
  }

  if (quickCurePotency > 0) nextState.trinkets += quickCurePotency;

  if (companionId) {
    nextState.companions = acquireEncounterCompanion(
      nextState.companions || [],
      input.transactionId,
      companionId
    );
  }

  const isQueenProtect = input.draft.ownerId === BEES_MANUAL_OWNER_ID
    && input.draft.context.encounterChoiceId === 'protect-the-queen';
  if (isQueenProtect) {
    const companions = nextState.companions || [];
    const queenInstanceId = `${input.transactionId}:companion:queen-bee`;
    if (!companions.some(row => row.instanceId === queenInstanceId)
      && typeof nextState.companionCapacity === 'number'
      && companions.length >= nextState.companionCapacity) {
      return {
        status: 'invalid',
        value: null,
        messages: ['No travelling Companion slot is available. Defer this result, then release or store a Companion before protecting the Queen.']
      };
    }
    nextState.companions = acquireQueenBeeCompanion(nextState.companions || [], input.transactionId);
  }

  const resolvedFollowUp = String(input.draft.inputValues['follow-up-result'] || '').trim();
  // Delivery has a typed resolver below; do not also create the old generic
  // free-text reminder for the same printed condition.
  const pendingDescriptions = resolvedFollowUp || isParcelDeliveryBranch
    ? []
    : [...input.draft.followUpRequirements];
  const isParcelDelivery = isParcelDeliveryBranch;
  const parcelAction = isParcelDelivery
    ? (selectedActions as PrintedCanonicalActionTemplate[]).find(action =>
        action.kind === 'gain-inventory' && /\bparcel\b/i.test(`${action.sourceText} ${action.label}`))
    : undefined;
  const parcelInventoryItemId = parcelAction
    ? `${input.transactionId}:inventory:${parcelAction.id}`
    : undefined;
  const parcelAddressAction = isParcelDelivery
    ? (selectedActions as PrintedCanonicalActionTemplate[]).find(action =>
        action.kind === 'record-map-change' && (action.targetInputId === 'parcel-address'
          || /(?:choose|location|4\s+paths?)/i.test(action.sourceText)))
    : undefined;
  for (const action of selectedActions as PrintedCanonicalActionTemplate[]) {
    if (action.kind === 'record-map-change' || action.kind === 'record-movement') {
      // The Parcel address is a typed delivery follow-up, not a generic
      // narrative map note. Keeping it out of this list prevents a duplicate
      // unresolved task from appearing beside the real delivery task.
      if (!(isParcelDelivery && action === parcelAddressAction)) {
        pendingDescriptions.push(actionTarget(action) || action.sourceText);
      }
    }
  }
  const cocoonAction = (selectedActions as PrintedCanonicalActionTemplate[]).find(action =>
    action.kind === 'gain-inventory' && /\bcocoon\b/i.test(`${action.fixedTarget || ''} ${action.sourceText}`)
  );
  const cocoonInventoryItemId = cocoonAction
    ? `${input.transactionId}:inventory:${cocoonAction.id}`
    : undefined;
  const deliveryAddress = parcelAddressAction ? actionTarget(parcelAddressAction).trim() : '';
  const deliveryFollowUp: PendingManualFollowUp | null = isParcelDelivery
    && parcelInventoryItemId
    && deliveryAddress
    ? {
        id: `${input.transactionId}:follow-up:delivery`,
        effectId: input.draft.effectId,
        ownerId: input.draft.ownerId,
        trigger: input.draft.trigger,
        description: `소포를 ${deliveryAddress}에 전달하면 장신구 3개를 받습니다.`,
        context: { ...input.draft.context },
        createdAt: input.resolvedAt || Date.now(),
        transactionId: input.transactionId,
        status: 'pending',
        kind: 'delivery',
        targetInventoryItemId: parcelInventoryItemId,
        targetLocationName: deliveryAddress,
        deliveryReward: { trinkets: 3 }
      }
    : null;
  const genericFollowUps: PendingManualFollowUp[] = uniqueRows(pendingDescriptions).map((description, index) => {
    const isCocoonHatch = input.draft.ownerId === BETTING_MANUAL_OWNER_ID
      && Boolean(cocoonInventoryItemId)
      && /\bcocoon\b.{0,180}\b(?:hatch(?:es|ed|ing)?|butterfly)\b/i.test(description);
    return {
      id: `${input.transactionId}:follow-up:${index + 1}`,
      effectId: input.draft.effectId,
      ownerId: input.draft.ownerId,
      trigger: input.draft.trigger,
      description,
      context: { ...input.draft.context },
      createdAt: input.resolvedAt || Date.now(),
      transactionId: input.transactionId,
      status: 'pending',
      ...(isCocoonHatch ? { kind: 'cocoon-hatch' as const, targetInventoryItemId: cocoonInventoryItemId } : {})
    };
  });
  nextState.pendingFollowUps = [...nextState.pendingFollowUps, ...(deliveryFollowUp ? [deliveryFollowUp] : []), ...genericFollowUps];
  nextState.appliedTransactionIds = [...new Set([...nextState.appliedTransactionIds, input.transactionId])];
  const resolvedAt = input.resolvedAt || Date.now();
  const draft = {
    ...input.draft,
    resultSummary: input.draft.resultSummary.trim() || manualEffectSystemSummary(input.draft),
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
    actionTargets: Object.fromEntries((selectedActions as PrintedCanonicalActionTemplate[]).flatMap(action => {
      const target = actionTarget(action);
      return target ? [[action.id, target]] : [];
    })),
    resultSummary: draft.resultSummary,
    journalNote: draft.journalNote,
    transactionId: input.transactionId,
    resolvedAt
  };
  return { status: 'resolved', value: { draft, record, nextState }, messages: [] };
};
