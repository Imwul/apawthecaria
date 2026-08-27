import {
  BEES_MANUAL_OWNER_ID as BEES_OWNER_ID,
  BETTING_MATCH_RESULT_OPTIONS,
  BETTING_MATCH_TRINKET_ACTION_ID,
  BETTING_MATCH_WAGER_OPTIONS,
  BETTING_MANUAL_OWNER_ID as BETTING_OWNER_ID,
  deriveBettingMatchTrinketOutcome,
  type ManualEffectDraft
} from './rules/almanackEngine';
import type { PrintedCanonicalActionTemplate, PrintedResolutionInput } from './rules/printedEffects';
import { RACING_BETS_SNACK_SPEED_TEXT } from './racingBetsSpeedCondition';

type ManualEffectInputValue = ManualEffectDraft['inputValues'][string];

export type ManualEffectDraftUpdater = (current: ManualEffectDraft) => ManualEffectDraft;
export type ManualEffectDraftUpdatedAt = number | ((current: ManualEffectDraft) => number);
export type ManualEffectDraftPatch = Partial<ManualEffectDraft> | ((current: ManualEffectDraft) => Partial<ManualEffectDraft>);

export const BETTING_OPPORTUNITY_CHOICE_INPUT_ID = 'betting-opportunity-choice';
export const PARCEL_DELIVERY_CHOICE_ID = 'deliver-the-parcel';
export const PARCEL_DELIVERY_ADDRESS_INPUT_ID = 'parcel-address';
export const PARCEL_ENCOUNTER_OWNER_ID = 'travel-meadow-7-8';

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
  const parcelAction = draft.actionTemplates.find(action =>
    action.kind === 'gain-inventory' && /\bparcel\b/i.test(`${action.sourceText} ${action.label}`)
  );
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
  if (!parcelAction) return draft;
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
