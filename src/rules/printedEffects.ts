import { AILMENTS } from './data/ailments';
import { ENCOUNTERS } from './data/encounters';

export type PrintedEffectStatus = 'implemented' | 'manual' | 'ambiguous' | 'not-applicable' | 'source-conflict';
export type PrintedAutomationClass = 'deterministic' | 'structured-choice' | 'narrative' | 'ambiguous';
export type PrintedTrigger = 'encounter' | 'diagnosis' | 'timer-change' | 'barter' | 'treatment-success' | 'treatment-failure' | 'leave';
export type PrintedResolutionInputType = 'choice' | 'target' | 'number' | 'resource-item' | 'free-text' | 'condition' | 'card-reference' | 'follow-up-reference';
export type PrintedCanonicalActionKind =
  | 'modify-reputation'
  | 'modify-trinkets'
  | 'modify-days'
  | 'modify-foraging-points'
  | 'modify-timer'
  | 'gain-inventory'
  | 'remove-inventory'
  | 'record-condition'
  | 'record-map-change'
  | 'record-movement';

export interface PrintedStateChange {
  id: string;
  category: 'resource' | 'timer' | 'inventory' | 'movement' | 'map' | 'reputation' | 'condition' | 'journal';
  operation: string;
  amount?: number;
  target?: string;
}

export interface PrintedResolutionInput {
  id: string;
  type: PrintedResolutionInputType;
  label: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface PrintedCanonicalActionTemplate {
  id: string;
  kind: PrintedCanonicalActionKind;
  label: string;
  amount?: number;
  targetType?: 'inventory-item' | 'timer' | 'location' | 'free-text';
  sourceText: string;
}

export interface PrintedManualResolution {
  reason: string;
  decision: string;
  choices: string[];
  stateChangesAfterDecision: PrintedStateChange[];
  mandatoryConditions: string[];
  inputFields: PrintedResolutionInput[];
  actionTemplates: PrintedCanonicalActionTemplate[];
  followUpRequirements: string[];
  journalInstruction: string;
}

export interface PrintedEffectDefinition {
  id: string;
  ownerType: 'encounter' | 'ailment';
  ownerId: string;
  ownerName: string;
  status: PrintedEffectStatus;
  automationClass: PrintedAutomationClass;
  trigger: PrintedTrigger;
  supportedTriggers: PrintedTrigger[];
  printedText: string;
  triggerText: Partial<Record<PrintedTrigger, string>>;
  prerequisites: string[];
  mandatoryEffects: PrintedStateChange[];
  optionalChoices: Array<{ id: string; label: string; effects: PrintedStateChange[] }>;
  resourceChanges: PrintedStateChange[];
  timerChanges: PrintedStateChange[];
  inventoryChanges: PrintedStateChange[];
  movementChanges: PrintedStateChange[];
  mapChanges: PrintedStateChange[];
  reputationChanges: PrintedStateChange[];
  followUpState: string | null;
  journalPrompt: string | null;
  manualResolution: PrintedManualResolution | null;
  manualResolutionByTrigger: Partial<Record<PrintedTrigger, PrintedManualResolution>>;
  ruleIds: string[];
  sourcePage: number;
  executor: string;
  testId: string | null;
}

export const classifyPrintedEffect = (effect: PrintedEffectDefinition): PrintedAutomationClass => {
  if (effect.status === 'ambiguous' || effect.status === 'source-conflict') return 'ambiguous';
  return effect.automationClass;
};

export const printedAutomationLabel = (effect: PrintedEffectDefinition) => {
  const labels: Record<PrintedAutomationClass, string> = {
    deterministic: '자동 처리',
    'structured-choice': '선택 필요',
    narrative: '직접 처리',
    ambiguous: '모호함'
  };
  return labels[classifyPrintedEffect(effect)];
};

const change = (id: string, category: PrintedStateChange['category'], operation: string, amount?: number, target?: string): PrintedStateChange => ({ id, category, operation, amount, target });

const compactText = (value: string) => value.replace(/\s+/g, ' ').trim().replace(/^[.,;:]\s+/, '');
const unique = <T,>(rows: T[]): T[] => [...new Set(rows)];
const encounterOwnerName = (value: string): string => {
  const compact = compactText(value);
  const words = compact.split(/\s+/);
  for (let index = 1; index < words.length - 1; index += 1) {
    const word = words[index];
    const next = words[index + 1];
    if (/^[A-Z][A-Za-z'’-]*$/.test(word) && /^[a-z]/.test(next)) {
      return words.slice(0, index).join(' ');
    }
  }
  const lines = value.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const title: string[] = [];
  for (const line of lines) {
    if (title.length > 0 && /^(?:You|A |An |Some |Several |Beasts |Massive |Across |After |As |Not |Something |The weather|The smell|The sound)\b/i.test(line)) break;
    title.push(line);
    if (title.join(' ').length >= 56) break;
  }
  return compactText(title.join(' ')) || compact.slice(0, 56);
};

const extractPrintedChoices = (text: string, explicit: string[]): string[] => {
  const normalized = compactText(text);
  const headings = [...normalized.matchAll(/(?:^|[.!?]\s+)([A-Z][A-Za-z0-9 '&’]{1,48})\s+-\s+/g)]
    .map(match => match[1].trim())
    .filter(label => !['Outcome', 'Consequence'].includes(label) && label.split(/\s+/).length <= 8);
  const suits = [...normalized.matchAll(/([♥♦♣♠](?:\s*(?:or|\/)\s*[♥♦♣♠])?)\s+-\s*/g)].map(match => match[1].trim());
  return unique([...explicit, ...headings, ...suits]).slice(0, 12);
};

const sourceClauses = (text: string): string[] => compactText(text)
  .split(/(?<=[.!?])\s+/)
  .map(row => row.trim())
  .filter(Boolean);

const deriveActionTemplates = (ownerId: string, text: string): PrintedCanonicalActionTemplate[] => {
  const actions: PrintedCanonicalActionTemplate[] = [];
  const push = (
    kind: PrintedCanonicalActionKind,
    label: string,
    sourceText: string,
    amount?: number,
    targetType?: PrintedCanonicalActionTemplate['targetType']
  ) => {
    const signature = `${kind}:${amount ?? ''}:${label}`;
    if (actions.some(action => `${action.kind}:${action.amount ?? ''}:${action.label}` === signature)) return;
    actions.push({ id: `${ownerId}:action:${actions.length + 1}`, kind, label, amount, targetType, sourceText });
  };

  sourceClauses(text).forEach(clause => {
    const reputationGain = clause.match(/(?:gain|earn)(?: an extra)?\s+(\d+)\s+Reputation/i);
    const reputationLoss = clause.match(/lose\s+(\d+)\s+Reputation/i);
    const trinketGain = clause.match(/(?:gain|earn)(?: an extra)?\s+(\d+|a|one)\s+Trinkets?/i);
    const trinketLoss = clause.match(/(?:lose|trade|pay|leave)\s+(\d+|a|one)\s+Trinkets?/i);
    const markDays = clause.match(/(?:mark|add)(?:ing)?\s+(\d+)\s+Days?/i);
    const timerDecrease = clause.match(/decrease\s+(?:all\s+)?Timers?\s+by\s+(\d+)/i);
    const timerIncrease = clause.match(/(?:increase|add)\s+(?:all\s+)?(?:your\s+)?(?:next\s+)?Timers?(?:\s+by)?\s+(\d+)/i)
      || clause.match(/add\s+(\d+)\s+to\s+(?:your\s+)?(?:next\s+)?Timer/i);
    const forageGain = clause.match(/gain\s+(\d+)\s+Foraging Points?/i);
    const forageLoss = clause.match(/lose\s+(\d+)\s+Foraging Points?/i);
    if (reputationGain) push('modify-reputation', `명성 +${reputationGain[1]}`, clause, Number(reputationGain[1]));
    if (reputationLoss) push('modify-reputation', `명성 -${reputationLoss[1]}`, clause, -Number(reputationLoss[1]));
    if (trinketGain) push('modify-trinkets', `장신구 +${trinketGain[1]}`, clause, trinketGain[1].match(/\d/) ? Number(trinketGain[1]) : 1);
    if (trinketLoss) push('modify-trinkets', `장신구 -${trinketLoss[1]}`, clause, -(trinketLoss[1].match(/\d/) ? Number(trinketLoss[1]) : 1));
    if (markDays) push('modify-days', `일정 +${markDays[1]}일`, clause, Number(markDays[1]));
    if (timerDecrease) push('modify-timer', `타이머 -${timerDecrease[1]}`, clause, -Number(timerDecrease[1]), 'timer');
    if (timerIncrease && !/\b(?:next|future|following)\b/i.test(clause)) {
      push('modify-timer', `타이머 +${timerIncrease[1]}`, clause, Number(timerIncrease[1]), 'timer');
    }
    if (forageGain) push('modify-foraging-points', `채집 포인트 +${forageGain[1]}`, clause, Number(forageGain[1]));
    if (forageLoss) push('modify-foraging-points', `채집 포인트 -${forageLoss[1]}`, clause, -Number(forageLoss[1]));
    if (/(?:gain|collect|add).{0,50}\b(?:Reagent|Tool|Item|Trinket|Sketch|Gossip|Fruit)\b/i.test(clause)) {
      push('gain-inventory', '원문이 지정한 물품 획득', clause, undefined, 'free-text');
    }
    if (/(?:lose|discard|drop|abandon|leave behind).{0,50}\b(?:Reagent|Tool|Item|Bags?|Weight)\b/i.test(clause)) {
      push('remove-inventory', '적격 가방 물품 제거', clause, undefined, 'inventory-item');
    }
    if (/(?:connect|draw|remove|mark|add).{0,40}\b(?:Path|Location|Settlement|City|Barrow|map)\b/i.test(clause)) {
      push('record-map-change', '지도 변경 기록', clause, undefined, 'location');
    }
    if (/(?:move yourself|move to|travel along an additional|halve your speed|double your speed|speed is halved)/i.test(clause)) {
      push('record-movement', '이동 상태 변경 기록', clause, undefined, 'location');
    }
    if (/(?:until|next Move|next Timer|next time|in the future|permanently|when you return|following Season)/i.test(clause)) {
      push('record-condition', '지속 조건 기록', clause, undefined, 'free-text');
    }
  });
  return actions;
};

const deriveManualResolution = (input: {
  ownerId: string;
  ownerName: string;
  text: string;
  prerequisites: string[];
  explicitChoices: string[];
}): PrintedManualResolution => {
  const text = compactText(input.text);
  const choices = extractPrintedChoices(text, input.explicitChoices);
  const actionTemplates = deriveActionTemplates(input.ownerId, text);
  const clauses = sourceClauses(text);
  const conditionalClauses = clauses.filter(clause => /\b(?:if|when|unless|cannot|must|only|at least|before|after)\b/i.test(clause));
  const followUpRequirements = unique(clauses.filter(clause =>
    /\b(?:draw (?:another |a )?card|resolve another|until|next Move|next Timer|next time|in the future|permanently|when you return|following Season)\b/i.test(clause)
  )).slice(0, 8);
  const inputFields: PrintedResolutionInput[] = [];
  if (choices.length > 0) inputFields.push({ id: 'printed-choice', type: 'choice', label: '적용한 원문 분기 또는 선택', required: false, options: choices });
  if (/\bdraw (?:another |two |one |a )?cards?\b/i.test(text)) inputFields.push({ id: 'follow-up-card', type: 'card-reference', label: '뽑은 후속 카드와 결과', required: false, helpText: '실제로 뽑은 문양과 값을 기록하세요.' });
  if (actionTemplates.some(action => action.targetType === 'inventory-item' || action.kind === 'gain-inventory')) inputFields.push({ id: 'resource-item', type: 'resource-item', label: '영향을 받은 물품 또는 자원', required: false });
  if (actionTemplates.some(action => action.targetType === 'location')) inputFields.push({ id: 'map-target', type: 'target', label: '선택한 위치, 경로 또는 지도 대상', required: false });
  if (/\b(?:if|when|unless|may|can|choose whether)\b/i.test(text)) inputFields.push({ id: 'condition-check', type: 'condition', label: '어떤 원문 조건과 분기가 적용되었는지 확인', required: true });
  if (/\?/u.test(text)) inputFields.push({ id: 'narrative-outcome', type: 'free-text', label: '원문이 묻는 서사적 결과', required: true });
  if (/\b(?:any number|as many|how many)\b/i.test(text)) inputFields.push({ id: 'quantity', type: 'number', label: '원문이 플레이어에게 정하도록 한 수량', required: false });
  if (followUpRequirements.length > 0) inputFields.push({ id: 'follow-up-result', type: 'follow-up-reference', label: '후속 판정 또는 지속 효과 기록', required: false });
  if (inputFields.length === 0) inputFields.push({ id: 'outcome-detail', type: 'free-text', label: '원문 지시를 해결한 구체적인 결과', required: true });

  const decision = choices.length > 0
    ? `“${input.ownerName}”에서 적용할 원문 분기를 고르고 그 결과를 기록하세요.`
    : /\bdraw (?:another |two |one |a )?cards?\b/i.test(text)
      ? `“${input.ownerName}”의 후속 카드를 뽑고 해당 결과를 기록하세요.`
      : actionTemplates.length > 0
        ? `“${input.ownerName}”에서 실제로 적용된 원문 상태 변화를 확인하세요.`
        : `“${input.ownerName}”이 요구하는 서사적 판단을 직접 정하고 기록하세요.`;
  const reason = actionTemplates.length > 0 || choices.length > 0
    ? `“${input.ownerName}”은 대상·분기·후속 결과를 플레이어가 정해야 하므로 자동 수치를 확정할 수 없습니다.`
    : `“${input.ownerName}”의 결과는 원문상 서사적 판단이며 앱이 대신 결론을 만들 수 없습니다.`;

  const categoryFor = (kind: PrintedCanonicalActionKind): PrintedStateChange['category'] => {
    if (kind === 'modify-reputation') return 'reputation';
    if (kind === 'modify-timer') return 'timer';
    if (kind === 'gain-inventory' || kind === 'remove-inventory') return 'inventory';
    if (kind === 'record-map-change') return 'map';
    if (kind === 'record-movement') return 'movement';
    if (kind === 'record-condition') return 'condition';
    return 'resource';
  };

  return {
    reason,
    decision,
    choices,
    stateChangesAfterDecision: actionTemplates.map(action => change(action.id, categoryFor(action.kind), action.kind, action.amount)),
    mandatoryConditions: unique([...input.prerequisites, ...conditionalClauses]).slice(0, 12),
    inputFields,
    actionTemplates,
    followUpRequirements,
    journalInstruction: `“${input.ownerName}”에서 선택한 분기, 적용한 상태 변화, 남은 후속 판정을 기록하세요.`
  };
};

const describeEffect = (effect: (typeof AILMENTS)[number]['successEffects'][number]): string => {
  const row = effect.effect;
  if (row.type === 'customEffect') return row.description;
  if (row.type === 'modifyReputation') return `Modify Reputation by ${row.amount}.`;
  if (row.type === 'modifyTrinkets') return `Modify Trinkets by ${row.amount}.`;
  if (row.type === 'markDays') return `Mark ${row.amount} Days.`;
  if (row.type === 'modifyForagingPoints') return `Modify Foraging Points by ${row.amount}.`;
  if (row.type === 'modifyTimer') return `Modify ${row.target} Timers by ${row.amount}.`;
  if (row.type === 'addItem') return `Gain ${row.quantity} ${row.itemId}.`;
  if (row.type === 'removeItem') return `Remove ${row.quantity} ${row.itemId}.`;
  if (row.type === 'addCondition') return `Add condition ${row.conditionId}.`;
  if (row.type === 'unlockEntry') return `Unlock ${row.entryId}.`;
  if (row.type === 'requireChoice') return `Choose one of ${row.choiceIds.join(', ')}.`;
  return row.reason;
};

const joinEffects = (effects: (typeof AILMENTS)[number]['successEffects']): string => effects.map(describeEffect).join(' ');

const encounterDefaults: PrintedEffectDefinition[] = ENCOUNTERS.map(encounter => {
  const prerequisites = [encounter.season ? `Season: ${encounter.season}` : 'Any Season', `Region: ${encounter.region}`];
  const ownerName = encounterOwnerName(encounter.title);
  return {
    id: `printed:${encounter.id}`,
    ownerType: 'encounter',
    ownerId: encounter.id,
    ownerName,
    status: encounter.support === 'implemented' ? 'implemented' : 'manual',
    automationClass: encounter.choices.length > 0
      ? 'structured-choice'
      : encounter.support === 'implemented' ? 'deterministic' : 'narrative',
    trigger: 'encounter',
    supportedTriggers: ['encounter'],
    printedText: compactText(encounter.prompt),
    triggerText: { encounter: compactText(encounter.prompt) },
    prerequisites,
    mandatoryEffects: [],
    optionalChoices: encounter.choices.map(choice => ({ id: choice.id, label: choice.label, effects: [] })),
    resourceChanges: [], timerChanges: [], inventoryChanges: [], movementChanges: [], mapChanges: [], reputationChanges: [],
    followUpState: null,
    journalPrompt: encounter.prompt,
    manualResolution: encounter.support === 'implemented' ? null : deriveManualResolution({
      ownerId: encounter.id,
      ownerName,
      text: encounter.prompt,
      prerequisites,
      explicitChoices: encounter.choices.map(choice => choice.label)
    }),
    manualResolutionByTrigger: {},
    ruleIds: [encounter.encounterType === 'travel' ? 'TRAVEL-009' : encounter.encounterType === 'foraging' ? 'FORAGE-006' : 'TABLE-004', 'CORE-002'],
    sourcePage: encounter.sourcePage,
    executor: 'executeEncounter',
    testId: null
  };
});

const encounterOverrides: Record<string, Partial<PrintedEffectDefinition>> = {
  'travel-bog-m-winter': {
    status: 'implemented',
    reputationChanges: [change('help-reputation', 'reputation', 'add', 1), change('hinder-reputation', 'reputation', 'add', -1)],
    manualResolution: null,
    testId: 'TRAVEL-009 warning rows'
  },
  'travel-forest-a-2': {
    followUpState: 'draw-card-and-choose-forest-plant',
    inventoryChanges: [change('forest-plant', 'inventory', 'add-matching-forest-plant-part')],
    testId: 'TRAVEL-008/TRAVEL-009 warning rows'
  },
  'travel-meadow-a-2': {
    prerequisites: ['Check Wagon ownership'],
    mandatoryEffects: [change('wagon-delay', 'resource', 'mark-day-if-wagon', 1)],
    testId: 'TRAVEL-009 warning rows'
  },
  'travel-mountain-9-10-winter': {
    followUpState: 'settlement-warning-deadline-2-days',
    reputationChanges: [change('foil-bandits', 'reputation', 'add-if-arrived-before-deadline', 4)],
    mapChanges: [change('marked-settlement', 'map', 'mark-future-bandit-change')],
    testId: 'TRAVEL-009 warning rows'
  },
  'travel-soar-9-10-summer': { followUpState: 'talons-suit-draw', testId: 'TRAVEL-009 warning rows' },
  'travel-soar-9-10-autumn': { followUpState: 'talons-suit-draw', testId: 'TRAVEL-009 warning rows' },
  'travel-soar-9-10-winter': { followUpState: 'talons-suit-draw', testId: 'TRAVEL-009 warning rows' },
  'travel-soar-j-winter': { status: 'implemented', manualResolution: null, testId: 'TRAVEL-009 warning rows' },
  'travel-soar-m-winter': {
    inventoryChanges: [change('hail-soak', 'inventory', 'soak-unprotected-items')],
    timerChanges: [change('hail-next-timer', 'timer', 'decrease-next-timer', 2)],
    testId: 'TRAVEL-009 warning rows'
  },
  'foraging-loch-j-winter': { status: 'implemented', manualResolution: null, testId: 'FORAGE-006 warning rows' }
};

const ailmentDefaults: PrintedEffectDefinition[] = AILMENTS.map(ailment => {
  const successText = joinEffects([...ailment.successEffects, ...ailment.specialRules]);
  const failureText = joinEffects(ailment.failureEffects);
  const printedText = compactText([
    successText ? `Outcome: ${successText}` : '',
    failureText ? `Consequence: ${failureText}` : ''
  ].filter(Boolean).join(' '));
  const supportedTriggers: PrintedTrigger[] = [
    ...(successText ? ['treatment-success' as const] : []),
    ...(failureText ? ['treatment-failure' as const] : [])
  ];
  const hasEffects = supportedTriggers.length > 0;
  return {
    id: `printed:${ailment.id}`,
    ownerType: 'ailment',
    ownerId: ailment.id,
    ownerName: ailment.canonicalName,
    status: hasEffects ? 'manual' : 'not-applicable',
    automationClass: hasEffects ? 'narrative' : 'deterministic',
    trigger: successText ? 'treatment-success' : 'treatment-failure',
    supportedTriggers,
    printedText,
    triggerText: {
      ...(successText ? { 'treatment-success': compactText(successText) } : {}),
      ...(failureText ? { 'treatment-failure': compactText(failureText) } : {})
    },
    prerequisites: [],
    mandatoryEffects: [], optionalChoices: [], resourceChanges: [], timerChanges: [], inventoryChanges: [], movementChanges: [], mapChanges: [], reputationChanges: [],
    followUpState: null,
    journalPrompt: `Record the applicable printed result for ${ailment.canonicalName}.`,
    manualResolution: hasEffects ? deriveManualResolution({
      ownerId: ailment.id,
      ownerName: ailment.canonicalName,
      text: printedText,
      prerequisites: [],
      explicitChoices: []
    }) : null,
    manualResolutionByTrigger: {},
    ruleIds: ['AILMENT-003', 'AILMENT-005', 'AILMENT-007', 'CORE-002'],
    sourcePage: ailment.sourcePage,
    executor: 'resolveTreatmentTransaction / resolveAilmentPrintedEffect',
    testId: null
  };
});

const ailmentOverrides: Record<string, Partial<PrintedEffectDefinition>> = {
  'ailment-bad-idea': {
    status: 'implemented',
    automationClass: 'structured-choice',
    supportedTriggers: ['treatment-success', 'treatment-failure'],
    prerequisites: ['Remedy cannot contain FOUL', 'Potency 3 Reagent required for Inspiration'],
    optionalChoices: [
      { id: 'upgrade-basic-tool', label: 'Upgrade one Basic Tool', effects: [change('upgrade-tool', 'inventory', 'upgrade-basic-tool')] },
      { id: 'lighten-tool', label: 'Decrease one Tool Weight by 1/3', effects: [change('lighten-tool', 'inventory', 'decrease-tool-weight', 1 / 3)] }
    ],
    testId: 'AILMENT-003/AILMENT-007 special success'
  },
  'ailment-brand-care': {
    status: 'implemented',
    automationClass: 'structured-choice',
    trigger: 'diagnosis',
    supportedTriggers: ['diagnosis', 'treatment-failure'],
    triggerText: {
      diagnosis: '동정심: 치료를 맡으면 추방된 무리와 어울린 대가로 명성 2를 잃습니다. 의무: 치료를 거부하면 길드 법을 지켜 명성 2를 얻고 환자는 야생으로 떠납니다.',
      'treatment-failure': '조용한 흐름: 이 질병을 치료하지 못해도 머무는 시간이 초과(Overstay)되지는 않습니다.'
    },
    optionalChoices: [
      { id: 'treat', label: 'Treat: lose 2 Reputation', effects: [change('brand-treat', 'reputation', 'add', -2)] },
      { id: 'refuse', label: 'Refuse: gain 2 Reputation', effects: [change('brand-refuse', 'reputation', 'add', 2)] }
    ],
    reputationChanges: [change('brand-choice', 'reputation', 'choice', undefined)],
    testId: 'AILMENT-003 special choice'
  },
  'ailment-fight-marks': {
    prerequisites: ['Two independent Ailment instances and Timers', 'Both treated', 'JOY 3 Reagent for reconciliation'],
    mandatoryEffects: [change('fight-repeat', 'condition', 'create-two-instances')],
    testId: 'AILMENT-003/AILMENT-004 special success'
  },
  'ailment-forager-s-twitch': {
    status: 'implemented',
    automationClass: 'structured-choice',
    trigger: 'diagnosis',
    supportedTriggers: ['diagnosis', 'treatment-failure'],
    triggerText: {
      diagnosis: "진단할 때 후속 카드 1장을 뽑습니다. 하트/다이아몬드는 요구조건을 바꾸지 않고, 클럽/스페이드는 이 질병에 WOUND 1 요구조건을 추가합니다.",
      'treatment-failure': '환각의 끝: 환각에서 깨어난 환자가 나누는 심오한 지혜나 말도 안 되는 이야기를 정하고 기록합니다.'
    },
    optionalChoices: [
      { id: 'good-trip', label: 'Heart/Diamond: requirements unchanged', effects: [] },
      { id: 'bad-trip', label: 'Club/Spade: add WOUND 1', effects: [change('twitch-wound', 'condition', 'add-requirement', 1, 'WOUND')] }
    ],
    testId: 'AILMENT-003 special diagnosis'
  },
  'ailment-groundhog-syndrome': {
    mandatoryEffects: [change('groundhog-repeat', 'condition', 'create-three-instances')],
    mapChanges: [change('groundhog-season-ban', 'map', 'apply-seasonal-settlement-or-forage-ban')],
    testId: 'AILMENT-003/AILMENT-005 special failure'
  },
  'ailment-pinned-by-pine': {
    status: 'implemented',
    automationClass: 'deterministic',
    trigger: 'timer-change',
    supportedTriggers: ['timer-change', 'treatment-failure'],
    prerequisites: ['Steel Axe or local Settlement help prevents the extra loss'],
    timerChanges: [change('pine-extra-timer', 'timer', 'decrease', 1)],
    testId: 'AILMENT-003 special timer'
  },
  'ailment-quagmire-s-scale': {
    status: 'implemented',
    automationClass: 'deterministic',
    trigger: 'timer-change',
    supportedTriggers: ['timer-change', 'treatment-failure'],
    timerChanges: [change('quagmire-threshold', 'condition', 'replace-POISON-1-with-POISON-3-at-timer-2')],
    followUpState: 'failure-forces-overstay',
    testId: 'AILMENT-003/AILMENT-005 special timer'
  },
  'ailment-soured-dough': {
    mandatoryEffects: [change('dough-repeat', 'condition', 'create-four-instances')],
    resourceChanges: [change('dough-failure', 'resource', 'next-remedy-trinkets-zero-if-none-treated')],
    testId: 'AILMENT-003/AILMENT-005 special failure'
  },
  'ailment-stingshock': {
    status: 'implemented',
    automationClass: 'deterministic',
    supportedTriggers: ['treatment-success', 'treatment-failure'],
    prerequisites: ['Two complete Remedy doses'],
    reputationChanges: [change('stingshock-double-dose', 'reputation', 'add', 3)],
    testId: 'AILMENT-003/AILMENT-007 special success'
  },
  'ailment-wake': {
    status: 'implemented',
    automationClass: 'deterministic',
    trigger: 'barter',
    supportedTriggers: ['barter', 'treatment-success', 'treatment-failure'],
    timerChanges: [change('wake-barter', 'timer', 'increase-this-ailment', 1)],
    reputationChanges: [change('wake-cooked', 'reputation', 'add-if-cooked-remedy', 2)],
    testId: 'AILMENT-003/AILMENT-007 special success'
  },
  'ailment-wormridden': {
    status: 'implemented',
    automationClass: 'deterministic',
    supportedTriggers: ['treatment-success', 'treatment-failure'],
    prerequisites: ['FOUL cancels FAIR but cannot reduce the reward below the Severity base'],
    resourceChanges: [change('wormridden-foul', 'resource', 'suppress-foul-penalty')],
    testId: 'AILMENT-003/AILMENT-007 special success'
  }
};

const finalizePrintedEffect = (
  row: PrintedEffectDefinition,
  override: Partial<PrintedEffectDefinition> | undefined
): PrintedEffectDefinition => {
  const merged = { ...row, ...(override || {}) };
  if (!merged.manualResolution) return { ...merged, manualResolutionByTrigger: {} };
  const manualResolutionByTrigger = Object.fromEntries(merged.supportedTriggers.map(trigger => [
    trigger,
    deriveManualResolution({
      ownerId: merged.ownerId,
      ownerName: merged.ownerName,
      text: merged.triggerText[trigger] || merged.printedText,
      prerequisites: merged.prerequisites,
      explicitChoices: merged.optionalChoices.map(choice => choice.label)
    })
  ])) as Partial<Record<PrintedTrigger, PrintedManualResolution>>;
  return {
    ...merged,
    manualResolution: manualResolutionByTrigger[merged.trigger] || merged.manualResolution,
    manualResolutionByTrigger
  };
};

export const PRINTED_EFFECT_REGISTRY: PrintedEffectDefinition[] = [
  ...encounterDefaults.map(row => finalizePrintedEffect(row, encounterOverrides[row.ownerId])),
  ...ailmentDefaults.map(row => finalizePrintedEffect(row, ailmentOverrides[row.ownerId]))
];

export const PRINTED_EFFECT_BY_OWNER = new Map(PRINTED_EFFECT_REGISTRY.map(row => [row.ownerId, row]));
