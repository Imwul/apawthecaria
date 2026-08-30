import {
  BEES_MANUAL_OWNER_ID as BEES_OWNER_ID,
  BETTING_MATCH_RESULT_OPTIONS,
  BETTING_MATCH_TRINKET_ACTION_ID,
  BETTING_MATCH_WAGER_OPTIONS,
  BETTING_MANUAL_OWNER_ID as BETTING_OWNER_ID,
  deriveBettingMatchTrinketOutcome,
  type ManualEffectDraft
} from './rules/almanackEngine';
import { ENCOUNTERS } from './rules/data/encounters';
import { REAGENTS } from './rules/data/reagents';
import { ENCOUNTER_CONDITION_CODES } from './rules/encounterConditionRuntime';
import { isForagingPreparationAvailableInSeason } from './rules/foragingEngine';
import type { Season } from './rules/types';
import {
  deriveEncounterBranchActionTemplates,
  type PrintedCanonicalActionTemplate,
  type PrintedResolutionInput
} from './rules/printedEffects';
import { RACING_BETS_SNACK_SPEED_TEXT } from './racingBetsSpeedCondition';

type ManualEffectInputValue = ManualEffectDraft['inputValues'][string];

export type ManualEffectDraftUpdater = (current: ManualEffectDraft) => ManualEffectDraft;
export type ManualEffectDraftUpdatedAt = number | ((current: ManualEffectDraft) => number);
export type ManualEffectDraftPatch = Partial<ManualEffectDraft> | ((current: ManualEffectDraft) => Partial<ManualEffectDraft>);

export const BETTING_OPPORTUNITY_CHOICE_INPUT_ID = 'betting-opportunity-choice';
export const PARCEL_DELIVERY_CHOICE_ID = 'deliver-the-parcel';
export const PARCEL_DELIVERY_ADDRESS_INPUT_ID = 'parcel-address';
export const PARCEL_ENCOUNTER_OWNER_ID = 'travel-meadow-7-8';
export const COLLECTOR_FOREST_PART_INPUT_ID = 'collector-forest-part';
export const CLAMMY_PAYMENT_INPUT_ID = 'clammy-payment';
export const QUICK_CURE_COUNT_INPUT_ID = 'quick-cure-part-count';
export const TOBOGGAN_DESTINATION_INPUT_ID = 'toboggan-destination';
export const DEER_TRIAL_RESULT_INPUT_ID = 'duchy-of-deer-result';
export const HOWL_FIGHT_RESULT_INPUT_ID = 'howl-fight-result';
export const TITAN_REAGENT_PART_INPUT_ID = 'lock-and-key-titan-part';
export const BUTTERFLY_CARD_VALUE_INPUT_ID = 'butterfly-card-value';
export const BUTTERFLY_PLANT_PART_INPUT_ID = 'butterfly-plant-part';
export const DEEP_WATER_SPLIT_INPUT_ID = 'deep-water-timer-loss';
export const BEE_KIND_BRANCH_INPUT_ID = 'bee-kind-branch';
export const PURCHASE_DECISION_INPUT_ID = 'purchase-decision';
export const BRANCH_BEATEN_RESULT_INPUT_ID = 'branch-beaten-card-result';
export const BRANCH_BEATEN_SEASON_INPUT_ID = 'branch-beaten-season';
export const BRANCH_BEATEN_REAGENT_INPUT_ID = 'branch-beaten-bog-part';
export const LEECH_REAGENT_PART_INPUT_ID = 'that-sucks-leech-part';
export const PILEDRIVER_RESULT_INPUT_ID = 'piledriver-card-result';
export const PILEDRIVER_DISCARD_COUNT_INPUT_ID = 'piledriver-discard-count';
export const ANCIENT_SALVAGE_RESULT_INPUT_ID = 'ancient-salvage-card-result';
export const PLEASANT_SURPRISE_REAGENT_INPUT_ID = 'pleasant-surprise-earth-part';
export const PLEASANT_SURPRISE_CARD_INPUT_ID = 'pleasant-surprise-card-value';
export const PANNING_CARD_RESULT_INPUT_ID = 'panning-card-result';

export { ENCOUNTER_CONDITION_CODES } from './rules/encounterConditionRuntime';

/** Stable human-readable values used by the choice field and the domain
 * transaction. Canonical name + preparation id is unique even when two Parts
 * share the same printed noun. */
export const canonicalReagentPartOption = (reagentId: string, preparationId: string): string | null => {
  const reagent = REAGENTS.find(row => row.id === reagentId);
  const preparation = reagent?.preparations.find(row => row.id === preparationId);
  return reagent && preparation
    ? `${reagent.canonicalName} · ${preparation.name} · ${preparation.method}`
    : null;
};

const SILVER_SHARDS_PART_OPTION = (() => {
  const reagent = REAGENTS.find(row => row.canonicalName === 'Silver Ore');
  const preparation = reagent?.preparations.find(row => row.name === 'Silver Shards');
  return reagent && preparation ? canonicalReagentPartOption(reagent.id, preparation.id) : null;
})();

export const FOREST_REAGENT_PART_OPTIONS = REAGENTS
  .filter(reagent => reagent.regionAvailability.Forest !== 'Unavailable')
  .flatMap(reagent => reagent.preparations.map(preparation => canonicalReagentPartOption(reagent.id, preparation.id)!));

export const TITAN_REAGENT_PART_OPTIONS = REAGENTS
  .filter(reagent => reagent.type === 'TITAN')
  .flatMap(reagent => reagent.preparations.map(preparation => canonicalReagentPartOption(reagent.id, preparation.id)!));

export const LEECH_REAGENT_PART_OPTIONS = REAGENTS
  .filter(reagent => reagent.canonicalName === 'Leech')
  .flatMap(reagent => reagent.preparations.map(preparation => canonicalReagentPartOption(reagent.id, preparation.id)!));

export const EARTH_REAGENT_PART_OPTIONS = REAGENTS
  .filter(reagent => reagent.type === 'EARTH')
  .flatMap(reagent => reagent.preparations.map(preparation => canonicalReagentPartOption(reagent.id, preparation.id)!));

export const MANUAL_CARD_VALUE_OPTIONS = [
  'A · 1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J · 11', 'Q/K (M) · 12'
] as const;

const MANUAL_SEASONS: readonly Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

const manualContextSeason = (draft: ManualEffectDraft): Season | null => {
  const contextSeason = draft.context.season;
  if (contextSeason && MANUAL_SEASONS.includes(contextSeason)) return contextSeason;
  const legacySeason = String(draft.inputValues[BRANCH_BEATEN_SEASON_INPUT_ID] || '');
  return MANUAL_SEASONS.includes(legacySeason as Season) ? legacySeason as Season : null;
};

export const bogReagentPartOptionsForSeason = (season: Season): string[] => REAGENTS
  .filter(reagent => reagent.regionAvailability.Bog !== 'Unavailable'
    && reagent.seasonAvailability[season] !== 'Unavailable')
  .flatMap(reagent => reagent.preparations
    .filter(preparation => isForagingPreparationAvailableInSeason(preparation, season))
    .map(preparation => canonicalReagentPartOption(reagent.id, preparation.id)!));

const plantReagentPartOptionsAtOrBelow = (rarity: number): string[] => REAGENTS
  .filter(reagent => reagent.type === 'PLANT' && reagent.baseRarity <= rarity)
  .flatMap(reagent => reagent.preparations.map(preparation => canonicalReagentPartOption(reagent.id, preparation.id)!));

const resolveUpdatedAt = (
  current: ManualEffectDraft,
  updatedAt: ManualEffectDraftUpdatedAt | undefined,
  patchedUpdatedAt?: number
): number => {
  if (typeof updatedAt === 'function') return updatedAt(current);
  if (typeof updatedAt === 'number') return updatedAt;
  if (typeof patchedUpdatedAt === 'number') return patchedUpdatedAt;
  return current.updatedAt;
};

/**
 * Produces a React-compatible functional update. Map-shaped properties are
 * merged and array-shaped properties are copied, so a delayed update cannot
 * replace edits that were already applied to the latest draft.
 */
export const patchManualEffectDraft = (
  patch: ManualEffectDraftPatch,
  updatedAt?: ManualEffectDraftUpdatedAt
): ManualEffectDraftUpdater => current => {
  const resolvedPatch = typeof patch === 'function' ? patch(current) : patch;
  return {
    ...current,
    ...resolvedPatch,
    context: resolvedPatch.context ? { ...current.context, ...resolvedPatch.context } : current.context,
    inputValues: resolvedPatch.inputValues ? { ...current.inputValues, ...resolvedPatch.inputValues } : current.inputValues,
    mapTargetIds: resolvedPatch.mapTargetIds ? { ...(current.mapTargetIds || {}), ...resolvedPatch.mapTargetIds } : current.mapTargetIds,
    actionTargets: resolvedPatch.actionTargets ? { ...current.actionTargets, ...resolvedPatch.actionTargets } : current.actionTargets,
    ruleIds: resolvedPatch.ruleIds ? [...resolvedPatch.ruleIds] : current.ruleIds,
    mandatoryConditions: resolvedPatch.mandatoryConditions ? [...resolvedPatch.mandatoryConditions] : current.mandatoryConditions,
    choices: resolvedPatch.choices ? [...resolvedPatch.choices] : current.choices,
    canonicalActions: resolvedPatch.canonicalActions ? [...resolvedPatch.canonicalActions] : current.canonicalActions,
    inputFields: resolvedPatch.inputFields
      ? resolvedPatch.inputFields.map(field => ({ ...field, options: field.options ? [...field.options] : undefined }))
      : current.inputFields,
    actionTemplates: resolvedPatch.actionTemplates ? resolvedPatch.actionTemplates.map(action => ({ ...action })) : current.actionTemplates,
    selectedActionIds: resolvedPatch.selectedActionIds ? [...resolvedPatch.selectedActionIds] : current.selectedActionIds,
    followUpRequirements: resolvedPatch.followUpRequirements ? [...resolvedPatch.followUpRequirements] : current.followUpRequirements,
    updatedAt: resolveUpdatedAt(current, updatedAt, resolvedPatch.updatedAt)
  };
};

const normalizeChoice = (value: unknown): string => String(value || '')
  .normalize('NFKC')
  .trim()
  .toLocaleLowerCase('en-US')
  .replace(/[‘’'“”!?.:,()[\]]/g, '')
  .replace(/[\s_/]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const startsWithChoice = (value: unknown, aliases: readonly string[]): boolean => {
  const normalized = normalizeChoice(value);
  return aliases.some(alias => {
    const normalizedAlias = normalizeChoice(alias);
    return normalized === normalizedAlias || normalized.startsWith(`${normalizedAlias}-`);
  });
};

const contextChoice = (draft: ManualEffectDraft): string | undefined => {
  const context = draft.context as ManualEffectDraft['context'] & { encounterChoiceId?: unknown };
  return typeof context.encounterChoiceId === 'string' && context.encounterChoiceId.trim()
    ? context.encounterChoiceId
    : undefined;
};

const printedChoice = (draft: ManualEffectDraft): ManualEffectInputValue | undefined => draft.inputValues['printed-choice'];

type BeesBranch = 'protect-the-queen' | 'release-the-queen' | 'wish-them-luck';
type BettingBranch = 'an-opportunity' | 'place-a-bet';
type OpportunityBranch = 'snack' | 'friend';

const resolveBeesBranch = (value: unknown): BeesBranch | null => {
  if (startsWithChoice(value, ['protect-the-queen', 'protect the queen', '여왕벌 보호하기', '여왕 보호'])) return 'protect-the-queen';
  if (startsWithChoice(value, ['release-the-queen', 'release the queen', '여왕벌 방출', '여왕벌 다시 자리 잡기'])) return 'release-the-queen';
  if (startsWithChoice(value, ['wish-them-luck', 'wish them luck', '행운을 빌어주기', '행운을 빌기'])) return 'wish-them-luck';
  return null;
};

const resolveBettingBranch = (value: unknown): BettingBranch | null => {
  if (startsWithChoice(value, ['place-a-bet', 'place a bet', '내기 걸기'])) return 'place-a-bet';
  if (startsWithChoice(value, ['an-opportunity', 'an opportunity', '뜻밖의 기회', 'a-snack', 'a snack', 'a-friend', 'a friend'])) return 'an-opportunity';
  return null;
};

const resolveOpportunityBranch = (value: unknown): OpportunityBranch | null => {
  if (startsWithChoice(value, ['snack', 'a-snack', 'a snack', '간식', '먹어 버리기'])) return 'snack';
  if (startsWithChoice(value, ['friend', 'a-friend', 'a friend', '친구', '친구로 삼기'])) return 'friend';
  return null;
};

const printedChoiceField = (draft: ManualEffectDraft, options: string[]): PrintedResolutionInput => {
  const current = draft.inputFields.find(field => field.id === 'printed-choice');
  return {
    ...(current || { id: 'printed-choice', type: 'choice' as const, label: '적용한 원문 분기 또는 선택', required: true }),
    type: 'choice',
    required: true,
    options
  };
};

const conditionConfirmationField = (draft: ManualEffectDraft): PrintedResolutionInput => {
  const current = draft.inputFields.find(field => field.id === 'condition-check');
  return {
    ...(current || { id: 'condition-check', type: 'condition' as const, required: true }),
    type: 'condition',
    label: '위 원문 조건과 선택을 확인했습니다',
    required: true
  };
};

const restrictInputValues = (
  draft: ManualEffectDraft,
  fields: PrintedResolutionInput[],
  values: Record<string, ManualEffectInputValue>
): ManualEffectDraft['inputValues'] => {
  const allowed = new Set(fields.map(field => field.id));
  return Object.fromEntries([
    ...Object.entries(draft.inputValues).filter(([id]) => allowed.has(id)),
    ...Object.entries(values)
  ]);
};

export const canonicalizeManualEffectActionTargets = (
  actions: PrintedCanonicalActionTemplate[],
  savedTargets: ManualEffectDraft['actionTargets'],
  defaults: Record<string, string> = {}
): ManualEffectDraft['actionTargets'] => Object.fromEntries(actions.flatMap(action => {
  // fixedTarget belongs to the printed action. targetInputId makes its input
  // field the sole persisted source of truth. Only free-target actions may
  // retain an actionTargets entry from a save.
  const target = action.fixedTarget
    ?? (action.targetInputId ? undefined : savedTargets[action.id] ?? defaults[action.id]);
  return typeof target === 'string' && target.trim() ? [[action.id, target]] : [];
}));

const restrictActionTargets = (
  draft: ManualEffectDraft,
  actions: PrintedCanonicalActionTemplate[],
  defaults: Record<string, string> = {}
): ManualEffectDraft['actionTargets'] => canonicalizeManualEffectActionTargets(actions, draft.actionTargets, defaults);

const manualDescriptionsForEncounterBranch = (ownerId: string, choiceId: string): string[] => {
  const encounter = ENCOUNTERS.find(row => row.id === ownerId);
  const choice = encounter?.choices.find(row => row.id === choiceId);
  if (!encounter || !choice) return [];
  return [
    ...encounter.mandatoryEffects.flatMap(structured => structured.support !== 'implemented'
      && structured.effect.type === 'customEffect'
      ? [structured.effect.description]
      : []),
    ...choice.effects.flatMap(structured => structured.support !== 'implemented'
      && structured.effect.type === 'customEffect'
      ? [structured.effect.description]
      : [])
  ];
};

const actionDependsOnUnresolvedOutcome = (action: PrintedCanonicalActionTemplate): boolean =>
  /\b(?:if|unless|otherwise|depending on|draw(?:n)?|card|suit|higher|lower|winning|losing|success|fail)\b|(?:이면|라면|없다면|있다면|경우에만|실패하면|성공하면|뽑은\s*카드|카드가|더\s*(?:높|낮)|승리하면|패배하면)/i.test(action.sourceText);

const branchFollowUps = (descriptions: string[]): string[] => descriptions.filter(description =>
  /\b(?:until|next Move|next Timer|next Ailment|next time|in the future|when you return|following Season|after (?:travelling|you have)|at the end of|before the end of|during Haggling|if you go to)\b|(?:다음\s*(?:이동|질환|타이머|계절)|나중에|이후|도착하면|돌아오면|여정이\s*끝|여정\s*끝|계절\s*끝|전까지)/i.test(description)
);

const actionIsDeferredFollowUp = (action: PrintedCanonicalActionTemplate): boolean => {
  // A persistent condition must be recorded now so the later trigger exists.
  // Numeric, inventory, movement and map outcomes explicitly due later must
  // not be offered as though they happened during the current encounter.
  if (action.kind === 'record-condition') return false;
  return /\b(?:later|in the future|when you return|following Season|after (?:travelling|you have)|at the end of|before the end of|during Haggling|if you go to)\b|(?:나중에|이후|도착하면|돌아오면|여정이\s*끝|여정\s*끝|계절\s*끝|전까지)/i.test(action.sourceText);
};

/**
 * The encounter itself already owns the branch selection. Rebuild the manual
 * remainder from that one branch so a follow-up never presents effects from
 * sibling choices, nor asks for an unrelated narrative answer merely because
 * the scene text contains a question mark.
 */
const scopeGenericEncounterBranch = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  if (draft.ownerType !== 'encounter') return draft;
  const encounter = ENCOUNTERS.find(row => row.id === draft.ownerId);
  const choice = encounter?.choices.find(row => row.id === choiceId);
  if (!encounter || !choice) return draft;

  const descriptions = manualDescriptionsForEncounterBranch(draft.ownerId, choiceId);
  const actions = deriveEncounterBranchActionTemplates(draft.ownerId, choiceId)
    .filter(action => !actionIsDeferredFollowUp(action))
    .map(action => ({
      ...action,
      required: !actionDependsOnUnresolvedOutcome(action)
    }));
  const choiceField = printedChoiceField(draft, [choice.label]);
  const cardField = descriptions.some(description => /\bdraw(?:n)?\b|카드(?:를|가)?\s*(?:뽑|확인)/i.test(description))
    ? draft.inputFields.find(field => field.type === 'card-reference') || {
        id: 'follow-up-card',
        type: 'card-reference' as const,
        label: '뽑은 후속 카드와 결과',
        required: false,
        helpText: '실제로 뽑은 문양과 값을 기록하세요.'
      }
    : null;
  const followUpField = branchFollowUps(descriptions).length > 0
    ? draft.inputFields.find(field => field.type === 'follow-up-reference') || {
        id: 'follow-up-result',
        type: 'follow-up-reference' as const,
        label: '후속 판정 또는 지속 효과 기록',
        required: false
      }
    : null;
  const fields = [choiceField, ...(cardField ? [cardField] : []), ...(followUpField ? [followUpField] : [])];
  const actionIds = new Set(actions.map(action => action.id));
  const requiredActionIds = actions.filter(action => action.required).map(action => action.id);
  const selectedActionIds = [...new Set([
    ...requiredActionIds,
    ...draft.selectedActionIds.filter(id => actionIds.has(id))
  ])];
  return {
    ...draft,
    context: { ...draft.context, encounterChoiceId: choiceId },
    choices: [choice.label],
    mandatoryConditions: descriptions,
    inputFields: fields,
    inputValues: restrictInputValues(draft, fields, { 'printed-choice': choice.label }),
    actionTemplates: actions,
    canonicalActions: actions.map(action => action.label),
    selectedActionIds,
    actionTargets: restrictActionTargets(draft, actions),
    followUpRequirements: branchFollowUps(descriptions)
  };
};

type ExclusiveEncounterOutcome = {
  value: string;
  actionMatches: Array<(action: PrintedCanonicalActionTemplate) => boolean>;
};

/** Some printed rows have one top-level action followed by a mutually
 * exclusive mechanical result. Keeping that result as a required segmented
 * choice prevents both costs from being applied (or neither) while preserving
 * the stable top-level Encounter choice stored in existing campaigns. */
const scopeExclusiveEncounterOutcome = (
  draft: ManualEffectDraft,
  choiceId: string,
  inputId: string,
  label: string,
  outcomes: ExclusiveEncounterOutcome[],
  alwaysActionMatches: Array<(action: PrintedCanonicalActionTemplate) => boolean> = []
): ManualEffectDraft => {
  const base = scopeGenericEncounterBranch(draft, choiceId);
  const outcomeField: PrintedResolutionInput = {
    id: inputId,
    type: 'choice',
    label,
    required: true,
    options: outcomes.map(outcome => outcome.value)
  };
  const persistedOutcome = draft.inputValues[inputId];
  const chosen = outcomes.find(outcome => outcome.value === persistedOutcome);
  const chosenActionIds = new Set(base.actionTemplates
    .filter(action => alwaysActionMatches.some(matches => matches(action))
      || chosen?.actionMatches.some(matches => matches(action)))
    .map(action => action.id));
  const actions = base.actionTemplates
    .filter(action => chosenActionIds.has(action.id))
    .map(action => ({ ...action, required: true }));
  const fields = [
    ...base.inputFields.filter(field => field.id !== inputId),
    outcomeField
  ];
  return {
    ...base,
    inputFields: fields,
    inputValues: restrictInputValues(base, fields, persistedOutcome === undefined ? {} : { [inputId]: persistedOutcome }),
    actionTemplates: actions,
    selectedActionIds: actions.map(action => action.id),
    actionTargets: restrictActionTargets(base, actions)
  };
};

const scopePersistentConditionOnly = (
  draft: ManualEffectDraft,
  choiceId: string
): ManualEffectDraft => {
  const base = scopeGenericEncounterBranch(draft, choiceId);
  const actions = base.actionTemplates
    .filter(action => action.kind === 'record-condition')
    .map(action => ({ ...action, required: true }));
  return {
    ...base,
    actionTemplates: actions,
    canonicalActions: actions.map(action => action.label),
    selectedActionIds: actions.map(action => action.id),
    actionTargets: restrictActionTargets(base, actions)
  };
};

const NOT_CAT_ESCAPE_OPTIONS = [
  '첫 비교에서 더 높아 탈출',
  '대치 카드를 더한 합계가 높아 탈출',
  '합계도 낮아 갇힘 · 마지막 카드 값만큼 타이머 감소'
] as const;
const NOT_CAT_CARD_VALUE_OPTIONS = [
  'A · 1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J · 11', 'Q/K (M) · 12'
] as const;

const scopeNotCatFleeOutcome = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const base = scopeGenericEncounterBranch(draft, choiceId);
  const outcomeField: PrintedResolutionInput = {
    id: 'not-cat-result',
    type: 'choice',
    label: '고양이 아닌 것과의 최종 비교',
    required: true,
    options: [...NOT_CAT_ESCAPE_OPTIONS]
  };
  const trapped = draft.inputValues['not-cat-result'] === NOT_CAT_ESCAPE_OPTIONS[2];
  const cardField: PrintedResolutionInput = {
    id: 'not-cat-final-card',
    type: 'choice',
    label: '갇힌 시간과 같은 마지막 카드 값',
    required: trapped,
    options: [...NOT_CAT_CARD_VALUE_OPTIONS],
    helpText: 'A=1, J=11, Q/K=Monarch=12'
  };
  const cardValue = trapped
    ? NOT_CAT_CARD_VALUE_OPTIONS.indexOf(String(draft.inputValues['not-cat-final-card']) as typeof NOT_CAT_CARD_VALUE_OPTIONS[number]) + 1
    : 0;
  const action: PrintedCanonicalActionTemplate | null = trapped && cardValue > 0 ? {
    id: `${draft.ownerId}:not-cat-final-timer`,
    kind: 'modify-timer',
    label: `모든 타이머 -${cardValue}`,
    required: true,
    amount: -cardValue,
    sourceText: 'Draw a card. Decrease all Timers by its value.'
  } : null;
  const fields = [
    ...base.inputFields.filter(field => field.id === 'printed-choice'),
    outcomeField,
    ...(trapped ? [cardField] : [])
  ];
  const persistedValues: Record<string, ManualEffectInputValue> = {};
  if (draft.inputValues['not-cat-result'] !== undefined) {
    persistedValues['not-cat-result'] = draft.inputValues['not-cat-result'];
  }
  if (trapped && draft.inputValues['not-cat-final-card'] !== undefined) {
    persistedValues['not-cat-final-card'] = draft.inputValues['not-cat-final-card'];
  }
  return {
    ...base,
    inputFields: fields,
    inputValues: restrictInputValues(base, fields, persistedValues),
    actionTemplates: action ? [action] : [],
    canonicalActions: action ? [action.label] : [],
    selectedActionIds: action ? [action.id] : [],
    actionTargets: {}
  };
};

const requiredAction = (
  ownerId: string,
  suffix: string,
  action: Omit<PrintedCanonicalActionTemplate, 'id' | 'required'>
): PrintedCanonicalActionTemplate => ({
  id: `${ownerId}:typed:${suffix}`,
  required: true,
  ...action
});

const scopedTypedBranch = (
  draft: ManualEffectDraft,
  choiceId: string,
  fields: PrintedResolutionInput[],
  actions: PrintedCanonicalActionTemplate[],
  followUpRequirements: string[] = []
): ManualEffectDraft => {
  const base = scopeGenericEncounterBranch(draft, choiceId);
  const allFields = [
    ...base.inputFields.filter(field => field.id === 'printed-choice'),
    ...fields
  ];
  return {
    ...base,
    inputFields: allFields,
    inputValues: restrictInputValues(draft, allFields, {
      'printed-choice': String(base.inputValues['printed-choice'] || '')
    }),
    actionTemplates: actions,
    canonicalActions: actions.map(action => action.label),
    selectedActionIds: actions.map(action => action.id),
    actionTargets: restrictActionTargets(draft, actions),
    followUpRequirements
  };
};

const scopeHandmadePot = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [],
  [
    requiredAction(draft.ownerId, 'handmade-pot', {
      kind: 'gain-inventory',
      label: 'Handmade Pot 획득',
      fixedTarget: 'Handmade Pot (No Weight)',
      sourceText: 'Gain a Handmade Pot.'
    }),
    requiredAction(draft.ownerId, 'carry-until-journey-end', {
      kind: 'record-condition',
      label: '이번 여정 동안 Carry +1',
      fixedTarget: 'Carry +1 until the end of this Journey.',
      sourceText: 'Gain +1 Carry until the end of this Journey.'
    })
  ]
);

const scopeGrabbyPaws = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const outcome = String(draft.inputValues['grabby-paws-result'] || '');
  const higher = outcome === '내 카드가 더 높음 · Big Fish 모든 부위 획득';
  const lower = outcome === '물고기 카드가 더 높음 · 가방 물품 하나 분실';
  const actions = higher ? [requiredAction(draft.ownerId, 'big-fish-all-parts', {
    kind: 'gain-inventory',
    label: 'Big Fish의 모든 부위 획득',
    fixedTarget: 'Big Fish · all canonical Parts',
    sourceText: 'If your card is Higher, gain all parts of a Big Fish Reagent.'
  })] : lower ? [requiredAction(draft.ownerId, 'lost-bag-item', {
    kind: 'remove-inventory',
    label: '가방 물품 하나 분실',
    targetType: 'inventory-item',
    sourceText: 'If your card is Lower, lose an item from your Bags.'
  })] : [];
  return scopedTypedBranch(draft, choiceId, [{
    id: 'grabby-paws-result',
    type: 'choice',
    label: '두 카드 비교 결과',
    required: true,
    options: [
      '내 카드가 더 높음 · Big Fish 모든 부위 획득',
      '물고기 카드가 더 높음 · 가방 물품 하나 분실'
    ]
  }], actions);
};

const scopePushAndPull = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const suit = String(draft.inputValues['push-pull-suit'] || '');
  const movement = suit === '♥ / ♦ · 앞으로 2경로 더 이동'
    ? requiredAction(draft.ownerId, 'pulled-forward', {
        kind: 'record-movement',
        label: '앞으로 2경로 더 이동',
        fixedTarget: '현재 Move에서 앞으로 2 Paths 추가 이동',
        sourceText: '♥ or ♦ - You are pulled along; travel an additional 2 Paths.'
      })
    : suit === '♣ / ♠ · 뒤로 1경로 이동'
      ? requiredAction(draft.ownerId, 'pushed-back', {
          kind: 'record-movement',
          label: '뒤로 1경로 이동',
          fixedTarget: '현재 Move의 경로를 따라 뒤로 1 Path 이동',
          sourceText: '♣ or ♠ - You are pushed back; travel backwards 1 Path.'
        })
      : null;
  return scopedTypedBranch(draft, choiceId, [{
    id: 'push-pull-suit',
    type: 'choice',
    label: '뽑은 문양',
    required: true,
    options: ['♥ / ♦ · 앞으로 2경로 더 이동', '♣ / ♠ · 뒤로 1경로 이동']
  }], movement ? [movement] : []);
};

const scopeCollectorSwap = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [{
    id: COLLECTOR_FOREST_PART_INPUT_ID,
    type: 'choice',
    label: '받을 숲 영약재 부위',
    required: true,
    options: [...FOREST_REAGENT_PART_OPTIONS],
    helpText: 'Forest에서 발견 가능한 canonical 영약재와 준비법만 표시합니다.'
  }],
  [
    requiredAction(draft.ownerId, 'give-reagent-part', {
      kind: 'remove-inventory',
      label: '내 영약재 부위 하나 내기',
      targetType: 'inventory-item',
      sourceText: 'Swap a Reagent Part of your own.'
    }),
    requiredAction(draft.ownerId, 'receive-forest-part', {
      kind: 'gain-inventory',
      label: '선택한 숲 영약재 부위 받기',
      targetInputId: COLLECTOR_FOREST_PART_INPUT_ID,
      sourceText: 'Gain any Reagent Part that can be found in the Forest.'
    })
  ]
);

const scopeClammyDeal = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const payment = String(draft.inputValues[CLAMMY_PAYMENT_INPUT_ID] || '');
  const paymentAction = payment === '장신구 3개 지불'
    ? requiredAction(draft.ownerId, 'pay-three-trinkets', {
        kind: 'modify-trinkets',
        label: '장신구 3개 지불',
        amount: -3,
        sourceText: 'Swap the Pearl for 3 Trinkets.'
      })
    : payment === '지정된 영약재 부위 하나 제공'
      ? requiredAction(draft.ownerId, 'give-listed-reagent-part', {
          kind: 'remove-inventory',
          label: '지정된 영약재 부위 하나 제공',
          targetType: 'inventory-item',
          sourceText: 'Give a Part from Big Fish, Small Fish, Beehive, Blackcurrant, Cucumber, Strawberries, Roses, or Wild Garlic.'
        })
      : null;
  const pearl = requiredAction(draft.ownerId, 'receive-pearl', {
    kind: 'gain-inventory',
    label: 'Pearl 획득',
    fixedTarget: 'Pearl (No Weight)',
    sourceText: 'Receive the newly found Pearl.'
  });
  return scopedTypedBranch(draft, choiceId, [{
    id: CLAMMY_PAYMENT_INPUT_ID,
    type: 'choice',
    label: 'Pearl의 대가',
    required: true,
    options: ['장신구 3개 지불', '지정된 영약재 부위 하나 제공']
  }], paymentAction ? [paymentAction, pearl] : []);
};

const scopeQuickCure = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const rawCount = Number(draft.inputValues[QUICK_CURE_COUNT_INPUT_ID]);
  const count = Number.isInteger(rawCount) && rawCount >= 1 && rawCount <= 50 ? rawCount : 0;
  const removals = Array.from({ length: count }, (_, index) => requiredAction(draft.ownerId, `quick-cure-part-${index + 1}`, {
    kind: 'remove-inventory',
    label: `처치용 영약재 부위 ${index + 1}`,
    targetType: 'inventory-item',
    sourceText: 'Trade an INFECTION, BURN, or PAIN Reagent.'
  }));
  const reward = count > 0 ? requiredAction(draft.ownerId, 'quick-cure-reward', {
    kind: 'modify-trinkets',
    label: '선택한 부위의 INFECTION/BURN/PAIN 효능 합계만큼 장신구 획득',
    amount: 0,
    sourceText: 'Gain 1 Trinket per eligible Potency provided.'
  }) : null;
  return scopedTypedBranch(draft, choiceId, [{
    id: QUICK_CURE_COUNT_INPUT_ID,
    type: 'number',
    label: '교환할 영약재 부위 수',
    required: true,
    helpText: '1~50. 각 부위는 아래 가방 목록에서 따로 선택합니다.'
  }], [...removals, ...(reward ? [reward] : [])]);
};

const currentLocationCondition = (
  draft: ManualEffectDraft,
  choiceId: string,
  inputId: string,
  inputLabel: string,
  conditionCode: string,
  actionLabel: string,
  sourceText: string,
  additionalActions: PrintedCanonicalActionTemplate[] = []
): ManualEffectDraft => {
  const locationId = draft.context.locationId?.trim();
  const fields: PrintedResolutionInput[] = locationId ? [] : [{
    id: inputId,
    type: 'target',
    label: inputLabel,
    required: true,
    helpText: '현재 조우가 발생한 지도 위치를 고르세요. 새 캠페인에서는 앱이 이 값을 자동으로 채웁니다.'
  }];
  const condition = requiredAction(draft.ownerId, `condition:${choiceId}`, {
    kind: 'record-condition',
    label: actionLabel,
    ...(locationId
      ? { fixedTarget: `${conditionCode}:${locationId}` }
      : { targetType: 'location' as const, targetInputId: inputId }),
    sourceText
  });
  return scopedTypedBranch(draft, choiceId, fields, [...additionalActions, condition]);
};

const scopeColdShoulder = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const result = String(draft.inputValues['cold-shoulder-suit'] || '');
  const action = result === '♣ · Guild Reputation -1'
    ? requiredAction(draft.ownerId, 'cold-shoulder-reputation', {
        kind: 'modify-reputation',
        label: 'Guild Reputation -1',
        amount: -1,
        sourceText: '♣ - Lose 1 Reputation.'
      })
    : result === '♠ · 장신구 -3'
      ? requiredAction(draft.ownerId, 'cold-shoulder-trinkets', {
          kind: 'modify-trinkets',
          label: '장신구 -3',
          amount: -3,
          sourceText: '♠ - You lose 3 Trinkets.'
        })
      : null;
  return scopedTypedBranch(draft, choiceId, [{
    id: 'cold-shoulder-suit',
    type: 'choice',
    label: '뽑은 카드의 문양',
    required: true,
    options: ['♥ / ♦ · 변화 없이 여정 계속', '♣ · Guild Reputation -1', '♠ · 장신구 -3']
  }], action ? [action] : []);
};

const scopeTobogganMovement = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [{
    id: TOBOGGAN_DESTINATION_INPUT_ID,
    type: 'target',
    label: '이동할 인접 비산악 위치',
    required: true,
    helpText: '지도에서 인접한 Mountain 이외의 위치를 고르세요. 날짜와 Guild Reputation 변화는 이미 선택과 함께 적용되었습니다.'
  }],
  [requiredAction(draft.ownerId, `toboggan:${choiceId}`, {
    kind: 'record-movement',
    label: '선택한 비산악 위치로 즉시 이동',
    targetType: 'location',
    targetInputId: TOBOGGAN_DESTINATION_INPUT_ID,
    sourceText: 'Travel to a nearby non-Mountain Location.'
  })]
);

const scopeDuchyOfDeer = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const result = String(draft.inputValues[DEER_TRIAL_RESULT_INPUT_ID] || '');
  const resultField: PrintedResolutionInput = {
    id: DEER_TRIAL_RESULT_INPUT_ID,
    type: 'choice',
    label: '가장 높은 카드의 주인',
    required: true,
    options: ['약제사 · 이번 채집을 계속함', '사슴 · 이번 채집 실패 및 이 위치 영구 출입 금지'],
    helpText: 'Crossbow 또는 Weapon 하나마다 사슴 쪽 카드를 한 장 더 뽑은 뒤 가장 높은 단일 카드를 비교합니다.'
  };
  if (result !== '사슴 · 이번 채집 실패 및 이 위치 영구 출입 금지') {
    return scopedTypedBranch(draft, choiceId, [resultField], []);
  }
  const cancelForage = requiredAction(draft.ownerId, 'duchy-current-forage', {
    kind: 'set-foraging-points',
    label: '이번 채집 포인트를 0으로 만들기',
    amount: 0,
    sourceText: 'You do not gather anything for this Forage.'
  });
  const scoped = currentLocationCondition(
    draft,
    choiceId,
    'duchy-of-deer-location',
    '사슴에게 쫓겨난 현재 위치',
    ENCOUNTER_CONDITION_CODES.duchyOfDeerBan,
    '이 위치에서 다시 Move/Forage할 수 없음',
    'You cannot Move through or Forage here again.',
    [cancelForage]
  );
  const fields = [
    ...scoped.inputFields.filter(field => field.id === 'printed-choice'),
    resultField,
    ...scoped.inputFields.filter(field => field.id === 'duchy-of-deer-location')
  ];
  return {
    ...scoped,
    inputFields: fields,
    inputValues: restrictInputValues(draft, fields, {
      'printed-choice': String(scoped.inputValues['printed-choice'] || ''),
      [DEER_TRIAL_RESULT_INPUT_ID]: result
    })
  };
};

const scopeStartledFish = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => currentLocationCondition(
  draft,
  choiceId,
  'startled-fish-location',
  '물고기가 자취를 감춘 현재 위치',
  ENCOUNTER_CONDITION_CODES.startledFish,
  '다음 Move 전까지 Big Fish/Small Fish 채집 불가',
  'You cannot find any Big Fish or Small Fish in this Location until you next Move On.'
);

const scopeLodgeTrade = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [],
  [requiredAction(draft.ownerId, 'lodge-trade', {
    kind: 'record-condition',
    label: '영약재 Barter 시작 · 2단계 건너뛰기',
    fixedTarget: `${ENCOUNTER_CONDITION_CODES.lodgeTrade}:${draft.context.locationId || 'current'}`,
    sourceText: 'Barter for a Reagent. During this Barter, skip step 2.'
  })]
);

const scopeLodgeVisit = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => currentLocationCondition(
  draft,
  choiceId,
  'lodge-visit-location',
  '비버집이 있는 현재 위치',
  ENCOUNTER_CONDITION_CODES.lodgeVisit,
  '다음 Move 전까지 이 위치의 조우 완료마다 채집 포인트 +2',
  'Until you Move, gain 2 Foraging Points after completing any Encounter in this Location.'
);

const scopeHowlFight = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const result = String(draft.inputValues[HOWL_FIGHT_RESULT_INPUT_ID] || '');
  const action = result === '패배 · Speed -1'
    ? requiredAction(draft.ownerId, 'howl-speed-loss', {
        kind: 'record-condition',
        label: 'Speed 영구 -1',
        fixedTarget: ENCOUNTER_CONDITION_CODES.howlSpeedLoss,
        sourceText: 'If you lose the fight, lower your Speed by 1.'
      })
    : result === '패배 · Carry -1'
      ? requiredAction(draft.ownerId, 'howl-carry-loss', {
          kind: 'record-condition',
          label: 'Carry 영구 -1',
          fixedTarget: ENCOUNTER_CONDITION_CODES.howlCarryLoss,
          sourceText: 'If you lose the fight, lower your Carry by 1.'
        })
      : null;
  return scopedTypedBranch(draft, choiceId, [{
    id: HOWL_FIGHT_RESULT_INPUT_ID,
    type: 'choice',
    label: '카드 합계 비교 결과',
    required: true,
    options: ['승리 · 수치 변화 없음', '패배 · Speed -1', '패배 · Carry -1'],
    helpText: '자신 1장과 늑대 2장의 합계를 비교합니다. Crossbow/Weapon 하나마다 자신의 카드를 한 장 더 뽑을 수 있습니다.'
  }], action ? [action] : []);
};

const titanThingamabobAction = (draft: ManualEffectDraft, choiceId: string): PrintedCanonicalActionTemplate => requiredAction(
  draft.ownerId,
  `lock-and-key:${choiceId}:thingamabob`,
  {
    kind: 'remove-inventory',
    label: 'Titan Thingamabob을 장치에 넣기',
    fixedTarget: 'Titan Thingamabob',
    sourceText: 'Put one carried Titan Thingamabob in the hollow.'
  }
);

const scopeTitanPower = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const consume = titanThingamabobAction(draft, choiceId);
  if (choiceId === 'action') {
    return scopedTypedBranch(draft, choiceId, [{
      id: TITAN_REAGENT_PART_INPUT_ID,
      type: 'choice',
      label: '드러난 Titan 영약재 부위',
      required: true,
      options: [...TITAN_REAGENT_PART_OPTIONS],
      helpText: '공식 도감에서 type이 Titan인 영약재의 canonical 부위만 표시합니다.'
    }], [
      consume,
      requiredAction(draft.ownerId, 'lock-and-key:action:reagent', {
        kind: 'gain-inventory',
        label: '선택한 Titan 영약재 부위 획득',
        targetInputId: TITAN_REAGENT_PART_INPUT_ID,
        sourceText: 'Reveal a Titan Reagent of your choice.'
      })
    ]);
  }
  return currentLocationCondition(
    draft,
    choiceId,
    `lock-and-key-${choiceId}-location`,
    'Titan 장치가 작동한 현재 위치',
    choiceId === 'light' ? ENCOUNTER_CONDITION_CODES.titanLight : ENCOUNTER_CONDITION_CODES.titanCameras,
    choiceId === 'light'
      ? '다음 Move 전까지 이 위치의 조우 완료마다 채집 포인트 +3'
      : '다음 Move 전까지 조우 카드 1회 다시 뽑기',
    choiceId === 'light'
      ? 'Gain 3 Foraging Points after completing an Encounter in this Location, until you next Move On.'
      : 'You can redraw an Encounter card once until you next Move On.',
    [consume]
  );
};

const scopeButterfly = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  if (choiceId === 'befriend-it') {
    return scopedTypedBranch(draft, choiceId, [], [
      requiredAction(draft.ownerId, 'butterfly:plant-payment', {
        kind: 'remove-inventory',
        label: 'PLANT 영약재 부위 1개 사용',
        targetType: 'inventory-item',
        sourceText: 'Use a PLANT Reagent to befriend the Butterfly.'
      }),
      requiredAction(draft.ownerId, 'butterfly:companion', {
        kind: 'record-condition',
        label: 'Butterfly Companion 획득',
        fixedTarget: 'gain-companion:butterfly',
        sourceText: 'Gain the Butterfly Companion.'
      })
    ]);
  }

  const cardValue = Number(draft.inputValues[BUTTERFLY_CARD_VALUE_INPUT_ID]);
  const rarity = Number.isInteger(cardValue) && cardValue >= 1 && cardValue <= 12 ? cardValue : 0;
  const fields: PrintedResolutionInput[] = [{
    id: BUTTERFLY_CARD_VALUE_INPUT_ID,
    type: 'number',
    label: '뽑은 카드 값 (A=1, J=11, Q/K=12)',
    required: true
  }, {
    id: BUTTERFLY_PLANT_PART_INPUT_ID,
    type: 'choice',
    label: '얻을 Plant 영약재 부위',
    required: true,
    options: plantReagentPartOptionsAtOrBelow(rarity),
    helpText: rarity > 0
      ? `Base Rarity ${rarity} 이하의 Plant 부위만 표시합니다.`
      : '카드 값을 먼저 입력하세요.'
  }];
  const action = rarity > 0 ? requiredAction(draft.ownerId, 'butterfly:plant-reward', {
    kind: 'gain-inventory',
    label: '선택한 Plant 영약재 부위 획득',
    targetInputId: BUTTERFLY_PLANT_PART_INPUT_ID,
    sourceText: 'Gain a Plant Reagent Part with Base Rarity no higher than the card value.'
  }) : null;
  return scopedTypedBranch(draft, choiceId, fields, action ? [action] : []);
};

const scopeDeepWater = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const timerLoss = Number(draft.inputValues[DEEP_WATER_SPLIT_INPUT_ID]);
  const validLoss = Number.isInteger(timerLoss) && timerLoss >= 0 && timerLoss <= 5;
  const foragingLoss = validLoss ? 5 - timerLoss : 0;
  const actions: PrintedCanonicalActionTemplate[] = validLoss ? [
    ...(timerLoss > 0 ? [requiredAction(draft.ownerId, 'deep-water:timers', {
      kind: 'modify-timer',
      label: `모든 타이머 -${timerLoss}`,
      amount: -timerLoss,
      sourceText: 'Reduce all Timers and Foraging Points by a total of 5.'
    })] : []),
    ...(foragingLoss > 0 ? [requiredAction(draft.ownerId, 'deep-water:foraging-points', {
      kind: 'modify-foraging-points',
      label: `채집 포인트 -${foragingLoss}`,
      amount: -foragingLoss,
      sourceText: 'Reduce all Timers and Foraging Points by a total of 5.'
    })] : [])
  ] : [];
  return scopedTypedBranch(draft, choiceId, [{
    id: DEEP_WATER_SPLIT_INPUT_ID,
    type: 'choice',
    label: '타이머에 배분할 감소량',
    required: true,
    options: ['0', '1', '2', '3', '4', '5'],
    helpText: '나머지는 채집 포인트에서 줄어듭니다. 두 감소량의 합계는 항상 5입니다.'
  }], actions);
};

const scopeFuneralRites = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [],
  [
    requiredAction(draft.ownerId, 'funeral-rites:elsewhere-part', {
      kind: 'remove-inventory',
      label: 'ELSEWHERE 영약재 부위 1개 건네기',
      targetType: 'inventory-item',
      sourceText: 'Give a Reagent Part that provides ELSEWHERE.'
    }),
    requiredAction(draft.ownerId, 'funeral-rites:reputation', {
      kind: 'modify-reputation',
      label: 'Guild Reputation +1 + ELSEWHERE Potency',
      amount: 0,
      sourceText: 'Gain 1 Guild Reputation, plus 1 for every ELSEWHERE Potency provided.'
    })
  ]
);

const scopeSnackTime = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const timerTarget = draft.context.ailmentInstanceId?.trim();
  return scopedTypedBranch(draft, choiceId, [], [
    requiredAction(draft.ownerId, 'snack-time:reagent', {
      kind: 'remove-inventory',
      label: '영약재 부위 1개 건네기',
      targetType: 'inventory-item',
      sourceText: 'Give away one Reagent Part.'
    }),
    requiredAction(draft.ownerId, 'snack-time:timer', {
      kind: 'modify-timer',
      label: '현재 채집 타이머 +1',
      amount: 1,
      ...(timerTarget ? { fixedTarget: timerTarget } : { targetType: 'timer' as const }),
      sourceText: 'Increase the current Foraging Timer by 1.'
    })
  ]);
};

const scopeHelpBee = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const branch = String(draft.inputValues[BEE_KIND_BRANCH_INPUT_ID] || '');
  const companion = requiredAction(draft.ownerId, 'bee-kind:companion', {
    kind: 'record-condition',
    label: 'Honeybee Companion 획득',
    fixedTarget: 'gain-companion:honeybee',
    sourceText: 'Gain the Honeybee Companion.'
  });
  const actions = branch === 'Sweet · Honey 또는 FAIR 부위 사용'
    ? [requiredAction(draft.ownerId, 'bee-kind:supply', {
        kind: 'remove-inventory',
        label: 'Honey 또는 FAIR 영약재 부위 1개 사용',
        targetType: 'inventory-item',
        sourceText: 'Use Honey or another FAIR Reagent to nurse the bee back to health.'
      }), companion]
    : branch === 'Rescue · 보유 재료 없이 모든 타이머 -4'
      ? [requiredAction(draft.ownerId, 'bee-kind:rescue-timers', {
          kind: 'modify-timer',
          label: '모든 타이머 -4',
          amount: -4,
          sourceText: 'With neither Honey nor a FAIR Reagent, decrease all Timers by 4.'
        }), companion]
      : [];
  return scopedTypedBranch(draft, choiceId, [{
    id: BEE_KIND_BRANCH_INPUT_ID,
    type: 'choice',
    label: '현재 가방에 맞는 도움 방식',
    required: true,
    options: ['Sweet · Honey 또는 FAIR 부위 사용', 'Rescue · 보유 재료 없이 모든 타이머 -4'],
    helpText: 'Honey 또는 FAIR 부위가 있으면 Sweet, 둘 다 없을 때만 Rescue를 적용합니다.'
  }], actions);
};

const scopePurchase = (
  draft: ManualEffectDraft,
  choiceId: string,
  item: 'Bark Coracle' | 'Lumpy Blanket'
): ManualEffectDraft => {
  const buy = draft.inputValues[PURCHASE_DECISION_INPUT_ID] === '구입 · 장신구 5개 지불';
  const actions = buy ? [
    requiredAction(draft.ownerId, 'purchase:cost', {
      kind: 'modify-trinkets',
      label: '장신구 -5',
      amount: -5,
      sourceText: `Pay 5 Trinkets for the ${item}.`
    }),
    requiredAction(draft.ownerId, 'purchase:item', {
      kind: 'gain-inventory',
      label: `${item} 획득`,
      fixedTarget: item,
      sourceText: `Gain the ${item}.`
    })
  ] : [];
  return scopedTypedBranch(draft, choiceId, [{
    id: PURCHASE_DECISION_INPUT_ID,
    type: 'choice',
    label: `${item} 구입 여부`,
    required: true,
    options: ['구입 · 장신구 5개 지불', '구입하지 않음']
  }], actions);
};

const scopeWorkingForSnack = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [],
  [
    requiredAction(draft.ownerId, 'working-snack:timers', {
      kind: 'modify-timer',
      label: '모든 타이머 -1',
      amount: -1,
      sourceText: 'Decrease any Timers by 1.'
    }),
    requiredAction(draft.ownerId, 'working-snack:clams', {
      kind: 'gain-inventory',
      label: 'Fresh Clams 획득 · 무게 2/3 · Barter 3',
      fixedTarget: 'Fresh Clams (Weight 2/3)',
      sourceText: 'Gain Fresh Clams (Weight 2/3), worth 3 Trinkets while Bartering.'
    }),
    requiredAction(draft.ownerId, 'working-snack:spoil', {
      kind: 'record-condition',
      label: '다음 Mark Day에 Fresh Clams 상함',
      fixedTarget: ENCOUNTER_CONDITION_CODES.freshClamsSpoil,
      sourceText: 'Fresh Clams spoil when you next Mark a Day.'
    })
  ]
);

export const BRANCH_BEATEN_RESULT_OPTIONS = [
  '4 이하 · 달력 +1일',
  '5–9 · 변화 없이 계속',
  '10 이상 · 제철 Bog 영약재 부위 획득'
] as const;

const scopeBranchBeaten = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const result = String(draft.inputValues[BRANCH_BEATEN_RESULT_INPUT_ID] || '');
  const season = manualContextSeason(draft);
  const reward = result === BRANCH_BEATEN_RESULT_OPTIONS[2];
  const fields: PrintedResolutionInput[] = [
    {
      id: BRANCH_BEATEN_RESULT_INPUT_ID,
      type: 'choice',
      label: '뽑은 카드 결과',
      required: true,
      options: [...BRANCH_BEATEN_RESULT_OPTIONS]
    },
    ...(!draft.context.season ? [{
      id: BRANCH_BEATEN_SEASON_INPUT_ID,
      type: 'choice' as const,
      label: '현재 계절 (이전 저장 복구)',
      required: true,
      options: [...MANUAL_SEASONS],
      helpText: '새 기록에서는 캠페인의 현재 계절이 자동으로 들어갑니다.'
    }] : []),
    ...(reward && season ? [{
      id: BRANCH_BEATEN_REAGENT_INPUT_ID,
      type: 'choice' as const,
      label: `${season}에 얻을 Bog 영약재 부위`,
      required: true,
      options: bogReagentPartOptionsForSeason(season),
      helpText: '현재 계절과 Bog에서 실제로 얻을 수 있는 canonical 부위만 표시합니다.'
    }] : [])
  ];
  const action = result === BRANCH_BEATEN_RESULT_OPTIONS[0]
    ? requiredAction(draft.ownerId, 'branch-beaten:day', {
        kind: 'modify-days',
        label: '달력 +1일',
        amount: 1,
        sourceText: 'If its value is less than 5, Mark 1 Day.'
      })
    : reward && season
      ? requiredAction(draft.ownerId, 'branch-beaten:reagent', {
          kind: 'gain-inventory',
          label: '선택한 제철 Bog 영약재 부위 획득',
          targetInputId: BRANCH_BEATEN_REAGENT_INPUT_ID,
          sourceText: 'If its value is 10 or more, gain an in-season Bog Reagent of your choice.'
        })
      : null;
  return scopedTypedBranch(draft, choiceId, fields, action ? [action] : []);
};

const scopeThatSucks = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [{
    id: LEECH_REAGENT_PART_INPUT_ID,
    type: 'choice',
    label: '보관할 Leech 영약재 부위',
    required: true,
    options: [...LEECH_REAGENT_PART_OPTIONS],
    helpText: 'Leech의 canonical 부위와 조제법 중 하나를 고릅니다.'
  }],
  [requiredAction(draft.ownerId, 'that-sucks:leech', {
    kind: 'gain-inventory',
    label: '선택한 Leech 영약재 부위 획득',
    targetInputId: LEECH_REAGENT_PART_INPUT_ID,
    sourceText: 'Silver Lining — Gain a Leech Reagent.'
  })]
);

const scopeHotTea = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [],
  [requiredAction(draft.ownerId, 'hot-tea:gossip', {
    kind: 'gain-inventory',
    label: 'Juicy Gossip 획득 · 무게 없음',
    fixedTarget: 'Juicy Gossip (No Weight)',
    sourceText: 'Eavesdrop — Add Gossip (No Weight) to your Bags.'
  })]
);

export const PILEDRIVER_RESULT_OPTIONS = [
  '♥ · 무사히 통과',
  '♦ · Carry 4 이하 · 무사히 통과',
  '♦ · Carry 4 초과 · 추격',
  '♣ / ♠ · 추격'
] as const;

const scopePiledriver = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const result = String(draft.inputValues[PILEDRIVER_RESULT_INPUT_ID] || '');
  const chased = result === PILEDRIVER_RESULT_OPTIONS[2] || result === PILEDRIVER_RESULT_OPTIONS[3];
  const rawCount = Number(draft.inputValues[PILEDRIVER_DISCARD_COUNT_INPUT_ID]);
  const count = Number.isInteger(rawCount) && rawCount >= 1 && rawCount <= 50 ? rawCount : 0;
  const fields: PrintedResolutionInput[] = [{
    id: PILEDRIVER_RESULT_INPUT_ID,
    type: 'choice',
    label: '뽑은 문양과 현재 Carry 결과',
    required: true,
    options: [...PILEDRIVER_RESULT_OPTIONS]
  }, ...(chased ? [{
    id: PILEDRIVER_DISCARD_COUNT_INPUT_ID,
    type: 'number' as const,
    label: '버릴 물품 수',
    required: true,
    helpText: '각 물품은 아래 가방 목록에서 따로 고릅니다. 합계가 최소 3 Weight여야 합니다.'
  }] : [])];
  const removals = chased ? Array.from({ length: count }, (_, index) => requiredAction(
    draft.ownerId,
    `piledriver:discard-${index + 1}`,
    {
      kind: 'remove-inventory',
      label: `추격 중 버릴 물품 ${index + 1}`,
      targetType: 'inventory-item',
      sourceText: 'Discard at least 3 Weight of items from your Bags.'
    }
  )) : [];
  return scopedTypedBranch(draft, choiceId, fields, removals);
};

export const ANCIENT_SALVAGE_RESULT_OPTIONS = [
  '10 이상 · Titan Thingamabob 획득',
  '9 이하 · 획득 없음'
] as const;

const scopeAncientSalvage = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const success = draft.inputValues[ANCIENT_SALVAGE_RESULT_INPUT_ID] === ANCIENT_SALVAGE_RESULT_OPTIONS[0];
  return scopedTypedBranch(draft, choiceId, [{
    id: ANCIENT_SALVAGE_RESULT_INPUT_ID,
    type: 'choice',
    label: '뽑은 카드 결과',
    required: true,
    options: [...ANCIENT_SALVAGE_RESULT_OPTIONS]
  }], success ? [requiredAction(draft.ownerId, 'ancient-salvage:thingamabob', {
    kind: 'gain-inventory',
    label: 'Titan Thingamabob 획득',
    fixedTarget: 'Titan Thingamabob (Weight 2/3)',
    sourceText: 'Equal to or greater than 10 — Add a Titan Thingamabob to your Bags.'
  })] : []);
};

const canonicalPartForManualOption = (option: unknown) => {
  const normalized = String(option || '');
  for (const reagent of REAGENTS) {
    for (const preparation of reagent.preparations) {
      if (canonicalReagentPartOption(reagent.id, preparation.id) === normalized) return { reagent, preparation };
    }
  }
  return null;
};

const scopePleasantSurprise = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const part = canonicalPartForManualOption(draft.inputValues[PLEASANT_SURPRISE_REAGENT_INPUT_ID]);
  const cardOption = String(draft.inputValues[PLEASANT_SURPRISE_CARD_INPUT_ID] || '');
  const cardValue = MANUAL_CARD_VALUE_OPTIONS.indexOf(cardOption as typeof MANUAL_CARD_VALUE_OPTIONS[number]) + 1;
  const success = Boolean(part?.reagent.type === 'EARTH' && cardValue >= part.reagent.baseRarity);
  const fields: PrintedResolutionInput[] = [
    {
      id: PLEASANT_SURPRISE_REAGENT_INPUT_ID,
      type: 'choice',
      label: '먼저 고른 Earth 영약재 부위',
      required: true,
      options: [...EARTH_REAGENT_PART_OPTIONS]
    },
    {
      id: PLEASANT_SURPRISE_CARD_INPUT_ID,
      type: 'choice',
      label: '그 뒤 뽑은 카드 값',
      required: true,
      options: [...MANUAL_CARD_VALUE_OPTIONS],
      helpText: 'A=1, J=11, Q/K=Monarch=12. 고른 영약재의 Base Rarity와 비교합니다.'
    }
  ];
  const action = success ? requiredAction(draft.ownerId, 'pleasant-surprise:earth', {
    kind: 'gain-inventory',
    label: '선택한 Earth 영약재 부위 획득',
    targetInputId: PLEASANT_SURPRISE_REAGENT_INPUT_ID,
    sourceText: 'If the card is equal to or higher than the Reagent\'s Base Rarity, add it to your Bags.'
  }) : null;
  return scopedTypedBranch(draft, choiceId, fields, action ? [action] : []);
};

const scopeMarshWader = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => scopedTypedBranch(
  draft,
  choiceId,
  [],
  [
    requiredAction(draft.ownerId, 'marsh-wader:food', {
      kind: 'remove-inventory',
      label: '먹을 수 있는 영약재 부위 1개 먹이기',
      targetType: 'inventory-item',
      sourceText: 'Feed the heron an edible Reagent.'
    }),
    requiredAction(draft.ownerId, 'marsh-wader:next-ailment', {
      kind: 'record-condition',
      label: '다음 Ailment 시작 시 채집 포인트 +5',
      fixedTarget: ENCOUNTER_CONDITION_CODES.marshWader,
      sourceText: 'Gain 5 Foraging Points at the start of your next Ailment.'
    })
  ],
  ['먹을 수 있는지는 영약재 설명과 장면 맥락을 보고 플레이어가 판단합니다.']
);

const scopePanning = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const heart = draft.inputValues[PANNING_CARD_RESULT_INPUT_ID] === '♥ · Silver Shards 획득';
  const actions: PrintedCanonicalActionTemplate[] = [];
  if (draft.context.patientId) actions.push(requiredAction(draft.ownerId, 'panning:timers', {
    kind: 'modify-timer',
    label: '현재 타이머 -1',
    amount: -1,
    sourceText: 'Reduce any current Timers by 1.'
  }));
  if (heart && SILVER_SHARDS_PART_OPTION) actions.push(requiredAction(draft.ownerId, 'panning:silver-shards', {
    kind: 'gain-inventory',
    label: 'Silver Shards 획득',
    fixedTarget: SILVER_SHARDS_PART_OPTION,
    sourceText: 'If you drew a Heart, add Silver Shards to your Bags.'
  }));
  return scopedTypedBranch(draft, choiceId, [{
    id: PANNING_CARD_RESULT_INPUT_ID,
    type: 'choice',
    label: '사금질 카드 결과',
    required: true,
    options: ['♥ · Silver Shards 획득', '♦ / ♣ / ♠ · 추가 획득 없음']
  }], actions);
};

const scopeRefreshingDip = (draft: ManualEffectDraft, choiceId: string): ManualEffectDraft => {
  const resolvingAilment = Boolean(draft.context.patientId);
  return scopedTypedBranch(draft, choiceId, [], resolvingAilment ? [
    requiredAction(draft.ownerId, 'refreshing-dip:timers', {
      kind: 'modify-timer',
      label: '현재 타이머 -1',
      amount: -1,
      sourceText: 'Reduce any current Timers by 1.'
    }),
    requiredAction(draft.ownerId, 'refreshing-dip:foraging-points', {
      kind: 'modify-foraging-points',
      label: '채집 포인트 +2',
      amount: 2,
      sourceText: 'If you are resolving an Ailment, gain 2 Foraging Points.'
    })
  ] : [requiredAction(draft.ownerId, 'refreshing-dip:next-move', {
    kind: 'record-condition',
    label: '다음 Move Speed +2',
    fixedTarget: ENCOUNTER_CONDITION_CODES.refreshingDip,
    sourceText: 'If you are travelling, gain +2 Speed for your next Move.'
  })]);
};

const scopeKnownExclusiveEncounterOutcome = (
  draft: ManualEffectDraft,
  choiceId: string
): ManualEffectDraft | null => {
  if (draft.ownerId === 'travel-bog-5-6' && choiceId === 'draw-and-pass-the-branches') {
    return scopeBranchBeaten(draft, choiceId);
  }
  if (draft.ownerId === 'travel-bog-9-10-summer' && choiceId === 'continue') {
    return scopeThatSucks(draft, choiceId);
  }
  if (draft.ownerId === 'travel-forest-5-6' && choiceId === 'eavesdrop') {
    return scopeHotTea(draft, choiceId);
  }
  if (draft.ownerId === 'travel-forest-j-winter' && choiceId === 'hurry-forwards') {
    return scopePiledriver(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-bog-2' && choiceId === 'dig') {
    return scopeAncientSalvage(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-mountain-3' && choiceId === 'luck') {
    return scopePleasantSurprise(draft, choiceId);
  }
  if (draft.ownerId === 'social-bog-winter-♠' && choiceId === 'curiosity') {
    return scopeMarshWader(draft, choiceId);
  }
  if (draft.ownerId === 'social-mountain-autumn-♣' && choiceId === 'go-panning') {
    return scopePanning(draft, choiceId);
  }
  if (draft.ownerId === 'social-mountain-autumn-♣' && choiceId === 'a-refreshing-dip') {
    return scopeRefreshingDip(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-bog-j-spring' && (choiceId === 'befriend-it' || choiceId === 'follow-it')) {
    return scopeButterfly(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-loch-a' && choiceId === 'deep-water') {
    return scopeDeepWater(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-loch-8' && choiceId === 'funeral-rites') {
    return scopeFuneralRites(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-mountain-10-summer' && choiceId === 'snack-time') {
    return scopeSnackTime(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-meadow-j-summer' && choiceId === 'help-the-bee') {
    return scopeHelpBee(draft, choiceId);
  }
  if (draft.ownerId === 'social-loch-settlement-♦' && choiceId === 'projects-wide') {
    return scopePurchase(draft, choiceId, 'Bark Coracle');
  }
  if (draft.ownerId === 'social-loch-autumn-♣' && choiceId === 'working-for-a-snack') {
    return scopeWorkingForSnack(draft, choiceId);
  }
  if (draft.ownerId === 'social-mountain-spoolkeep-♥' && choiceId === 'offcuts') {
    return scopePurchase(draft, choiceId, 'Lumpy Blanket');
  }
  if (draft.ownerId === 'travel-forest-m-winter' && choiceId === 'cold-shoulder') {
    return scopeColdShoulder(draft, choiceId);
  }
  if (draft.ownerId === 'travel-mountain-j-winter' && (choiceId === 'sled' || choiceId === 'long-walk')) {
    return scopeTobogganMovement(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-bog-m-autumn' && choiceId === 'instant-trial') {
    return scopeDuchyOfDeer(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-loch-10-summer' && choiceId === 'the-boat-that-rocks') {
    return scopeStartledFish(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-loch-m-winter' && choiceId === 'trade') {
    return scopeLodgeTrade(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-loch-m-winter' && choiceId === 'visit') {
    return scopeLodgeVisit(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-mountain-10-autumn' && choiceId === 'blood-to-blood') {
    return scopeHowlFight(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-titan-6' && (choiceId === 'light' || choiceId === 'cameras' || choiceId === 'action')) {
    return scopeTitanPower(draft, choiceId);
  }
  if (draft.ownerId === 'travel-bog-j-spring' && choiceId === 'join-in-the-class') {
    return scopeHandmadePot(draft, choiceId);
  }
  if (draft.ownerId === 'travel-loch-5-6' && choiceId === 'grabby-paws') {
    return scopeGrabbyPaws(draft, choiceId);
  }
  if (draft.ownerId === 'travel-loch-7-8' && choiceId === 'continue') {
    return scopePushAndPull(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-forest-3' && choiceId === 'collections-development-policy') {
    return scopeCollectorSwap(draft, choiceId);
  }
  if (draft.ownerId === 'social-loch-spring-♣' && choiceId === 'a-clammy-deal') {
    return scopeClammyDeal(draft, choiceId);
  }
  if (draft.ownerId === 'social-forest-odoak-♥' && choiceId === 'a-quick-cure') {
    return scopeQuickCure(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-mountain-9-spring' && choiceId === 'swept-away') {
    return scopeExclusiveEncounterOutcome(
      draft,
      choiceId,
      'coursing-river-cost',
      '거센 물살의 대가 하나',
      [
        { value: '채집 포인트 3 잃기', actionMatches: [action => action.kind === 'modify-foraging-points' && action.amount === -3] },
        { value: '모든 타이머 2 줄이기', actionMatches: [action => action.kind === 'modify-timer' && action.amount === -2] }
      ]
    );
  }
  if (draft.ownerId === 'foraging-mountain-m-summer' && choiceId === 'resolve-blazing-sun') {
    return scopeExclusiveEncounterOutcome(
      draft,
      choiceId,
      'blazing-sun-body',
      '약제사의 체온 특성',
      [
        { value: '냉혈 동물 · 모든 타이머 2 늘리기', actionMatches: [action => action.kind === 'modify-timer' && action.amount === 2] },
        { value: '그 밖의 동물 · 모든 타이머 2 줄이기', actionMatches: [action => action.kind === 'modify-timer' && action.amount === -2] }
      ]
    );
  }
  if (draft.ownerId === 'travel-titan-j' && choiceId === 'silence') {
    return scopeExclusiveEncounterOutcome(
      draft,
      choiceId,
      'siren-entry-method',
      '사이렌을 통과한 방법',
      [
        { value: 'Crossbow와 Bolt로 장치를 멈춤 · 날짜 변화 없음', actionMatches: [] },
        { value: '다른 길을 찾음 · 달력 1일 표시', actionMatches: [action => action.kind === 'modify-days' && action.amount === 1] }
      ]
    );
  }
  if (draft.ownerId === 'foraging-meadow-4' && choiceId === 'creep-away') {
    return scopeExclusiveEncounterOutcome(
      draft,
      choiceId,
      'winged-hunter-card-result',
      '뽑은 카드의 결과',
      [
        { value: '♥ · 들키지 않고 탈출', actionMatches: [] },
        {
          value: '♦ / ♣ / ♠ · 발각',
          actionMatches: [
            action => action.kind === 'set-foraging-points' && action.amount === 0,
            action => action.kind === 'remove-inventory'
          ]
        }
      ]
    );
  }
  if (draft.ownerId === 'travel-bog-a-2' && choiceId === 'follow-the-trail') {
    return scopeExclusiveEncounterOutcome(draft, choiceId, 'wisp-card-result', '도깨비불 카드 결과', [
      { value: '♥ · 숨은 지름길 · 달력 1일', actionMatches: [action => action.kind === 'modify-days' && action.amount === 1] },
      { value: '♦ · 원하는 Tool 하나', actionMatches: [action => action.kind === 'gain-inventory'] },
      { value: '♣ / ♠ · 빈 웅덩이 · 달력 1일', actionMatches: [action => action.kind === 'modify-days' && action.amount === 1] }
    ]);
  }
  if (draft.ownerId === 'travel-mountain-9-10-spring' && choiceId === 'deep-breath') {
    return scopeExclusiveEncounterOutcome(draft, choiceId, 'pretty-prickles-card-result', '가시덤불 카드 결과', [
      { value: '♥ · 무사히 통과', actionMatches: [] },
      { value: '♦ · Reagent 하나 버리기', actionMatches: [action => action.kind === 'remove-inventory'] },
      { value: '♣ / ♠ · 달력 1일', actionMatches: [action => action.kind === 'modify-days' && action.amount === 1] }
    ]);
  }
  if (draft.ownerId === 'foraging-bog-j-autumn' && choiceId === 'weather-report') {
    return scopePersistentConditionOnly(draft, choiceId);
  }
  if (draft.ownerId === 'foraging-bog-m-spring' && choiceId === 'get-a-better-view') {
    return scopeExclusiveEncounterOutcome(draft, choiceId, 'legacy-tower-card-result', '물탑 카드 결과', [
      { value: '♥ / ♦ · 채집 포인트 +3', actionMatches: [action => action.kind === 'modify-foraging-points' && action.amount === 3] },
      { value: '♣ / ♠ · 카드 값으로 세어 닿은 가방 물품 버리기', actionMatches: [action => action.kind === 'remove-inventory'] }
    ]);
  }
  if (draft.ownerId === 'foraging-forest-10-summer' && choiceId === 'nap') {
    return scopeExclusiveEncounterOutcome(draft, choiceId, 'siesta-card-result', '낮잠 카드 결과', [
      { value: '♥ / ♦ · 채집 포인트 +5', actionMatches: [action => action.kind === 'modify-foraging-points' && action.amount === 5] },
      { value: '♣ / ♠ · 채집 포인트 -1', actionMatches: [action => action.kind === 'modify-foraging-points' && action.amount === -1] }
    ]);
  }
  if (draft.ownerId === 'foraging-meadow-10-autumn' && choiceId === 'bump') {
    return scopeExclusiveEncounterOutcome(draft, choiceId, 'heavy-fog-card-result', '안개 속 카드 결과', [
      { value: '♥ / ♦ · 조사 목록의 Reagent 하나 획득', actionMatches: [action => action.kind === 'gain-inventory'] },
      { value: '♣ / ♠ · 장신구 -1', actionMatches: [action => action.kind === 'modify-trinkets' && action.amount === -1] }
    ]);
  }
  if (draft.ownerId === 'foraging-mountain-9-summer' && choiceId === 'debate-the-goats') {
    return scopeExclusiveEncounterOutcome(draft, choiceId, 'goat-debate-card-result', '염소 토론 카드 결과', [
      { value: '♥ / ♦ / ♣ · Rock Salt 획득', actionMatches: [action => action.kind === 'gain-inventory'] },
      { value: '♠ · 채집 포인트 -2', actionMatches: [action => action.kind === 'modify-foraging-points' && action.amount === -2] }
    ]);
  }
  if (draft.ownerId === 'foraging-loch-10-winter' && choiceId === 'fish-some-more') {
    return scopeExclusiveEncounterOutcome(draft, choiceId, 'ice-fishing-card-result', '얼음낚시 카드 결과', [
      { value: '♥ / ♦ · Small Fish의 모든 부위', actionMatches: [action => action.kind === 'gain-inventory' && /Small Fish/i.test(action.fixedTarget || action.sourceText)] },
      { value: '♣ · Big Fish의 모든 부위', actionMatches: [action => action.kind === 'gain-inventory' && /Big Fish/i.test(action.fixedTarget || action.sourceText)] },
      { value: '♠ · 아무것도 낚지 못함', actionMatches: [] }
    ]);
  }
  if (draft.ownerId === 'foraging-titan-5' && choiceId === 'flee-and-resolve') {
    return scopeNotCatFleeOutcome(draft, choiceId);
  }
  return null;
};

const findOrCreateAction = (
  draft: ManualEffectDraft,
  predicate: (action: PrintedCanonicalActionTemplate) => boolean,
  fallback: PrintedCanonicalActionTemplate
): PrintedCanonicalActionTemplate => ({ ...(draft.actionTemplates.find(predicate) || fallback) });

const scopeBeesDraft = (draft: ManualEffectDraft, branch: BeesBranch): ManualEffectDraft => {
  const choices = ['Protect the Queen', 'Wish Them Luck'];
  const choiceField = printedChoiceField(draft, choices);
  const confirmationField = conditionConfirmationField(draft);
  const context = { ...draft.context, encounterChoiceId: branch };

  if (branch === 'wish-them-luck') {
    const action = { ...findOrCreateAction(
      draft,
      candidate => candidate.kind === 'modify-reputation' && candidate.amount === -1,
      {
        id: `${BEES_OWNER_ID}:branch:wish:reputation`,
        kind: 'modify-reputation',
        label: 'Guild Reputation -1',
        amount: -1,
        sourceText: 'Wish them luck. Lose 1 Guild Reputation.'
      }
    ), required: true };
    return {
      ...draft,
      context,
      choices,
      mandatoryConditions: [],
      inputFields: [choiceField, confirmationField],
      inputValues: restrictInputValues(draft, [choiceField, confirmationField], { 'printed-choice': 'Wish Them Luck' }),
      actionTemplates: [action],
      canonicalActions: [action.label],
      selectedActionIds: [action.id],
      actionTargets: {},
      followUpRequirements: []
    };
  }

  if (branch === 'release-the-queen') {
    const releaseChoices = ['Release The Queen'];
    const releaseChoiceField = printedChoiceField(draft, releaseChoices);
    const mapField: PrintedResolutionInput = {
      id: 'map-target',
      type: 'target',
      label: '여왕벌을 다시 자리 잡게 한 야생 초원·늪지·숲 위치',
      required: true,
      helpText: '이 후속 단계에서만 새 벌집 위치를 지도에 표시합니다.'
    };
    const action = { ...findOrCreateAction(
      draft,
      candidate => candidate.kind === 'record-map-change' && /hive|queen|map/i.test(candidate.sourceText),
      {
        id: `${BEES_OWNER_ID}:branch:release:map`,
        kind: 'record-map-change',
        label: '여왕벌을 방생한 새 벌집 위치 기록',
        targetType: 'location',
        sourceText: 'When the Queen Bee is re-homed in a wild Meadow, Bog, or Forest, mark that Location as a new Beehive.'
      }
    ), required: true, targetInputId: 'map-target' };
    const fields = [releaseChoiceField, mapField, confirmationField];
    return {
      ...draft,
      context,
      choices: releaseChoices,
      mandatoryConditions: ['A Queen Bee Companion is already travelling with you.', 'The release Location is a wild Meadow, Bog, or Forest.'],
      inputFields: fields,
      inputValues: restrictInputValues(draft, fields, { 'printed-choice': 'Release The Queen' }),
      actionTemplates: [action],
      canonicalActions: [action.label],
      selectedActionIds: [action.id],
      actionTargets: restrictActionTargets(draft, [action]),
      followUpRequirements: ['At the marked Beehive Location, Honey and Wax may thereafter be gathered automatically while Foraging.']
    };
  }

  const condition = 'Queen Bee Companion acquired now. Later, re-home her in a wild Meadow, Bog, or Forest; only then mark that Location as a new Beehive.';
  const action: PrintedCanonicalActionTemplate = {
    id: `${BEES_OWNER_ID}:branch:protect:queen-companion`,
    kind: 'record-condition',
    label: 'Queen Bee Companion 획득과 후속 재정착 조건 기록',
    required: true,
    fixedTarget: condition,
    sourceText: condition
  };
  return {
    ...draft,
    context,
    choices,
    mandatoryConditions: [condition],
    inputFields: [choiceField, confirmationField],
    inputValues: restrictInputValues(draft, [choiceField, confirmationField], { 'printed-choice': 'Protect the Queen' }),
    actionTemplates: [action],
    canonicalActions: [action.label],
    selectedActionIds: [action.id],
    actionTargets: restrictActionTargets(draft, [action], { [action.id]: condition }),
    followUpRequirements: [
      'Queen Bee follow-up: after a future re-home in a wild Meadow, Bog, or Forest, mark that Location as a new Beehive; Honey and Wax can then be gathered automatically there while Foraging.'
    ]
  };
};

const opportunityChoiceField = (): PrintedResolutionInput => ({
  id: BETTING_OPPORTUNITY_CHOICE_INPUT_ID,
  type: 'choice',
  label: '뜻밖의 기회 결과',
  required: true,
  options: ['A Snack!', 'A Friend!'],
  helpText: '고치를 먹을지, 친구로 삼을지 먼저 명시적으로 고르세요.'
});

const legacyOpportunityBranch = (draft: ManualEffectDraft): OpportunityBranch | null => {
  const printed = resolveOpportunityBranch(printedChoice(draft));
  if (printed) return printed;
  const selected = draft.actionTemplates.filter(action => draft.selectedActionIds.includes(action.id));
  if (selected.some(action => action.kind === 'gain-inventory' && /cocoon/i.test(`${action.sourceText} ${draft.actionTargets[action.id] || ''}`))) return 'friend';
  if (selected.some(action => action.kind === 'record-condition' && /speed.{0,30}next move|next move.{0,30}speed/i.test(action.sourceText))) return 'snack';
  return null;
};

const scopeBettingOpportunity = (draft: ManualEffectDraft): ManualEffectDraft => {
  const choices = ['An Opportunity', 'Place a Bet'];
  const choiceField = printedChoiceField(draft, choices);
  const nestedField = opportunityChoiceField();
  const confirmationField = conditionConfirmationField(draft);
  const hadStructuredField = draft.inputFields.some(field => field.id === BETTING_OPPORTUNITY_CHOICE_INPUT_ID);
  const nested = resolveOpportunityBranch(draft.inputValues[BETTING_OPPORTUNITY_CHOICE_INPUT_ID])
    || (!hadStructuredField ? legacyOpportunityBranch(draft) : null);
  const baseValues: Record<string, ManualEffectInputValue> = { 'printed-choice': 'An Opportunity' };
  if (nested) baseValues[BETTING_OPPORTUNITY_CHOICE_INPUT_ID] = nested === 'snack' ? 'A Snack!' : 'A Friend!';
  const fields = [choiceField, nestedField, confirmationField];

  if (nested === 'snack') {
    const condition = RACING_BETS_SNACK_SPEED_TEXT;
    const action = { ...findOrCreateAction(
      draft,
      candidate => candidate.kind === 'record-condition' && /speed.{0,30}next move|next move.{0,30}speed/i.test(candidate.sourceText),
      {
        id: `${BETTING_OWNER_ID}:branch:opportunity:snack`,
        kind: 'record-condition',
        label: '다음 Move에만 Speed +1',
        fixedTarget: condition,
        sourceText: condition
      }
    ), required: true };
    return {
      ...draft,
      choices,
      mandatoryConditions: ['A Snack! was chosen under An Opportunity.'],
      inputFields: fields,
      inputValues: restrictInputValues(draft, fields, baseValues),
      actionTemplates: [action],
      canonicalActions: [action.label],
      selectedActionIds: [action.id],
      actionTargets: restrictActionTargets(draft, [action], { [action.id]: condition }),
      followUpRequirements: []
    };
  }

  if (nested === 'friend') {
    const action = { ...findOrCreateAction(
      draft,
      candidate => candidate.kind === 'gain-inventory' && /cocoon/i.test(candidate.sourceText),
      {
        id: `${BETTING_OWNER_ID}:branch:opportunity:friend`,
        kind: 'gain-inventory',
        label: 'Cocoon (Weight 1/3) 획득',
        fixedTarget: 'Cocoon (Weight 1/3)',
        sourceText: "Add a 'Cocoon' (Weight 1/3) to your Bags."
      }
    ), required: true };
    return {
      ...draft,
      choices,
      mandatoryConditions: ['A Friend! was chosen under An Opportunity.'],
      inputFields: fields,
      inputValues: restrictInputValues(draft, fields, baseValues),
      actionTemplates: [action],
      canonicalActions: [action.label],
      selectedActionIds: [action.id],
      actionTargets: restrictActionTargets(draft, [action], { [action.id]: 'Cocoon (Weight 1/3)' }),
      followUpRequirements: ['Cocoon follow-up: after travelling 10 Paths, or when the Journey ends, it hatches into a Butterfly Companion.']
    };
  }

  return {
    ...draft,
    choices,
    mandatoryConditions: ['Choose either A Snack! or A Friend! under An Opportunity before resolving it.'],
    inputFields: fields,
    inputValues: restrictInputValues(draft, fields, baseValues),
    actionTemplates: [],
    canonicalActions: [],
    selectedActionIds: [],
    actionTargets: {},
    followUpRequirements: []
  };
};

const scopeBettingDraft = (draft: ManualEffectDraft, branch: BettingBranch): ManualEffectDraft => {
  const context = { ...draft.context, encounterChoiceId: branch };
  if (branch === 'an-opportunity') return { ...scopeBettingOpportunity(draft), context };

  const choices = ['An Opportunity', 'Place a Bet'];
  const choiceField = printedChoiceField(draft, choices);
  const confirmationField = conditionConfirmationField(draft);
  const fields: PrintedResolutionInput[] = [
    choiceField,
    { id: 'bet-suit', type: 'choice', label: '내기에 고른 문양', required: true, options: ['♥', '♦', '♣', '♠'] },
    { id: 'bet-wager', type: 'choice', label: '걸었던 장신구', required: true, options: [...BETTING_MATCH_WAGER_OPTIONS] },
    {
      id: 'bet-result',
      type: 'choice',
      label: '고른 문양의 순위와 결과',
      required: true,
      options: [...BETTING_MATCH_RESULT_OPTIONS],
      helpText: '처음 나온 각 문양을 1·4위에 놓은 뒤, 고른 문양의 결과를 기록하세요.'
    },
    confirmationField
  ];
  const outcome = deriveBettingMatchTrinketOutcome(
    draft.inputValues['bet-wager'],
    draft.inputValues['bet-result']
  );
  const action: PrintedCanonicalActionTemplate | null = outcome ? {
    id: BETTING_MATCH_TRINKET_ACTION_ID,
    kind: 'modify-trinkets',
    label: outcome.netChange > 0
      ? `내기 결과 · 장신구 +${outcome.netChange}`
      : outcome.netChange < 0
        ? `내기 결과 · 장신구 ${outcome.netChange}`
        : '내기 결과 · 장신구 변화 없음',
    required: true,
    amount: outcome.netChange,
    sourceText: 'If your chosen Suit came 1st, double your bet; 2nd, make your bet back; 3rd or 4th, lose your bet.'
  } : null;
  return {
    ...draft,
    context,
    choices,
    mandatoryConditions: ['Choose one Suit, wager exactly 1, 2, or 4 Trinkets, then place the first card drawn of each Suit into 1st through 4th place.'],
    inputFields: fields,
    inputValues: restrictInputValues(draft, fields, { 'printed-choice': 'Place a Bet' }),
    actionTemplates: action ? [action] : [],
    canonicalActions: action ? [action.label] : [],
    selectedActionIds: action ? [action.id] : [],
    actionTargets: {},
    followUpRequirements: []
  };
};

const scopeParcelDeliveryDraft = (draft: ManualEffectDraft): ManualEffectDraft => {
  const parsedParcelAction = draft.actionTemplates.find(action =>
    action.kind === 'gain-inventory' && /\bparcel\b/i.test(`${action.sourceText} ${action.label}`)
  );
  const parcelAction = parsedParcelAction || {
    id: `${draft.ownerId}:parcel-item`,
    kind: 'gain-inventory' as const,
    label: 'Parcel(소포, 무게 1) 획득',
    required: true,
    fixedTarget: 'Parcel (Weight 1)',
    sourceText: 'Parcel(소포, 무게 1)을 가방에 넣습니다.'
  };
  const parsedAddressAction = draft.actionTemplates.find(action =>
    action.kind === 'record-map-change' && /(?:choose|location|4\s+paths?)/i.test(action.sourceText)
  );
  // Some legacy transcriptions keep the printed address sentence in the
  // prompt but the mechanical parser cannot classify it as an action. Keep
  // the player-facing branch usable by adding the one canonical map-note
  // action here; this is still a manual target, never an inferred location.
  const addressAction = parsedAddressAction || {
    id: `${draft.ownerId}:parcel-address`,
    kind: 'record-map-change' as const,
    label: '배달 주소 기록',
    required: true,
    targetType: 'location' as const,
    sourceText: 'Choose a Location 4 Paths away for its address.'
  };
  const addressField: PrintedResolutionInput = {
    id: PARCEL_DELIVERY_ADDRESS_INPUT_ID,
    type: 'target',
    label: '소포 주소 (출발지에서 4경로 떨어진 위치)',
    required: true,
    helpText: '지도에서 출발지와 정확히 4경로 떨어진 위치 이름을 적으세요. 앱이 경로를 대신 선택하지 않습니다.'
  };
  const choiceField = printedChoiceField(draft, ['Deliver the Parcel']);
  const confirmationField = conditionConfirmationField(draft);
  const fields = [
    ...draft.inputFields.filter(field => field.id !== 'printed-choice' && field.id !== 'condition-check' && field.id !== 'parcel-address'),
    choiceField,
    addressField,
    confirmationField
  ];
  const actions = [
    { ...parcelAction, required: true },
    { ...addressAction, required: true, targetInputId: PARCEL_DELIVERY_ADDRESS_INPUT_ID }
  ];
  return {
    ...draft,
    choices: ['Deliver the Parcel'],
    mandatoryConditions: ['Choose a Location exactly 4 Paths away for the Parcel address. Deliver the Parcel only when you reach that Location.'],
    inputFields: fields,
    inputValues: restrictInputValues(draft, fields, { 'printed-choice': 'Deliver the Parcel' }),
    actionTemplates: actions,
    canonicalActions: actions.map(action => action.label),
    selectedActionIds: actions.map(action => action.id),
    actionTargets: restrictActionTargets(draft, actions, { [parcelAction.id]: 'Parcel' }),
    followUpRequirements: ['Parcel delivery: when you reach the chosen address, remove the Parcel and gain 3 Trinkets.']
  };
};

const scopeBranchWithoutTimestamp = (draft: ManualEffectDraft): ManualEffectDraft => {
  if (draft.ownerId === PARCEL_ENCOUNTER_OWNER_ID && contextChoice(draft) === PARCEL_DELIVERY_CHOICE_ID) {
    return scopeParcelDeliveryDraft(draft);
  }
  if (draft.ownerId === BEES_OWNER_ID) {
    const explicit = contextChoice(draft);
    const branch = explicit ? resolveBeesBranch(explicit) : resolveBeesBranch(printedChoice(draft));
    return branch ? scopeBeesDraft(draft, branch) : draft;
  }
  if (draft.ownerId === BETTING_OWNER_ID) {
    const explicit = contextChoice(draft);
    const branch = explicit ? resolveBettingBranch(explicit) : resolveBettingBranch(printedChoice(draft));
    return branch ? scopeBettingDraft(draft, branch) : draft;
  }
  const selectedChoiceId = contextChoice(draft);
  if (selectedChoiceId) {
    return scopeKnownExclusiveEncounterOutcome(draft, selectedChoiceId)
      || scopeGenericEncounterBranch(draft, selectedChoiceId);
  }
  return draft;
};

/** Applies only the branch represented by context.encounterChoiceId. */
export const scopeManualEffectDraftForEncounterChoice = (
  current: ManualEffectDraft,
  updatedAt?: ManualEffectDraftUpdatedAt
): ManualEffectDraft => {
  const scoped = scopeBranchWithoutTimestamp(current);
  if (scoped === current) return current;
  return { ...scoped, updatedAt: resolveUpdatedAt(current, updatedAt) };
};

/** Stores a top-level encounter choice and immediately removes other branches. */
export const setManualEffectEncounterChoice = (
  encounterChoiceId: string,
  updatedAt?: ManualEffectDraftUpdatedAt
): ManualEffectDraftUpdater => current => {
  const withChoice: ManualEffectDraft = {
    ...current,
    context: { ...current.context, encounterChoiceId }
  };
  const scoped = scopeBranchWithoutTimestamp(withChoice);
  return { ...scoped, updatedAt: resolveUpdatedAt(current, updatedAt) };
};

/** Updates one input against the latest draft and immediately re-scopes nested branches. */
export const setManualEffectInput = (
  inputId: string,
  value: ManualEffectInputValue | undefined,
  updatedAt?: ManualEffectDraftUpdatedAt
): ManualEffectDraftUpdater => current => {
  const inputValues = { ...current.inputValues };
  if (value === undefined) delete inputValues[inputId];
  else inputValues[inputId] = value;
  // A branch change invalidates the earlier source acknowledgement, while
  // ordinary target/text edits must leave it intact.
  if (inputId === 'printed-choice' || inputId === BETTING_OPPORTUNITY_CHOICE_INPUT_ID) {
    delete inputValues['condition-check'];
  }
  let context = current.context as ManualEffectDraft['context'] & { encounterChoiceId?: string };
  if (inputId === 'printed-choice') {
    const selectedBranch = current.ownerId === BEES_OWNER_ID
      ? resolveBeesBranch(value)
      : current.ownerId === BETTING_OWNER_ID
        ? resolveBettingBranch(value)
        : null;
    const { encounterChoiceId: _previousChoice, ...remainingContext } = context;
    context = selectedBranch ? { ...remainingContext, encounterChoiceId: selectedBranch } : remainingContext;
    if (current.ownerId === BETTING_OWNER_ID) {
      const nested = resolveOpportunityBranch(value);
      if (nested) inputValues[BETTING_OPPORTUNITY_CHOICE_INPUT_ID] = nested === 'snack' ? 'A Snack!' : 'A Friend!';
    }
  }
  const scoped = scopeBranchWithoutTimestamp({ ...current, context, inputValues });
  return { ...scoped, updatedAt: resolveUpdatedAt(current, updatedAt) };
};

/** Adds or removes one selected canonical action without losing other selections. */
export const setManualEffectActionSelected = (
  actionId: string,
  selected: boolean,
  updatedAt?: ManualEffectDraftUpdatedAt
): ManualEffectDraftUpdater => current => {
  const selectedActionIds = selected
    ? [...new Set([...current.selectedActionIds, actionId])]
    : current.selectedActionIds.filter(id => id !== actionId);
  return { ...current, selectedActionIds, updatedAt: resolveUpdatedAt(current, updatedAt) };
};

/** Updates or clears one action target without replacing targets for other actions. */
export const setManualEffectActionTarget = (
  actionId: string,
  target: string | undefined,
  updatedAt?: ManualEffectDraftUpdatedAt
): ManualEffectDraftUpdater => current => {
  const action = current.actionTemplates.find(candidate => candidate.id === actionId);
  const actionTargets = { ...current.actionTargets };
  if (action?.fixedTarget) actionTargets[actionId] = action.fixedTarget;
  else if (action?.targetInputId || target === undefined) delete actionTargets[actionId];
  else actionTargets[actionId] = target;
  return { ...current, actionTargets, updatedAt: resolveUpdatedAt(current, updatedAt) };
};
