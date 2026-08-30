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
  | 'set-foraging-points'
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

/**
 * Returns whether a required printed-resolution input has a canonical value.
 * Conditions are confirmations rather than generic booleans, and a choice is
 * only complete when it is one of the options printed for that field.
 */
export const isPrintedResolutionInputSatisfied = (
  field: Pick<PrintedResolutionInput, 'type' | 'options'>,
  value: unknown
): boolean => {
  if (field.type === 'condition') return value === true;
  if (field.type === 'choice') {
    return typeof value === 'string'
      && Array.isArray(field.options)
      && field.options.includes(value);
  }
  return typeof value === 'number'
    || (typeof value === 'string' && value.trim().length > 0);
};

export interface PrintedCanonicalActionTemplate {
  id: string;
  kind: PrintedCanonicalActionKind;
  label: string;
  /** The selected printed branch makes this state change mandatory. */
  required?: boolean;
  amount?: number;
  targetType?: 'inventory-item' | 'timer' | 'location' | 'free-text';
  /** Canonical target supplied by the printed rule; it is displayed, not edited. */
  fixedTarget?: string;
  /** Resolution input that owns this action's target; avoids a duplicate target field. */
  targetInputId?: string;
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
  const titleConnectors = new Set(['a', 'an', 'and', 'or', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'from', 'with', 'not', 'is', 'up', 'down']);
  const lines = value.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const title: string[] = [];
  for (const line of lines) {
    const words = line.split(/\s+/).map(word => word.replace(/^[“‘'([{]+|[”’'\])},:;.!?]+$/g, '')).filter(Boolean);
    const looksLikeTitle = words.length > 0 && words.every(word =>
      /^[A-Z0-9]/.test(word) || /^a['’][A-Z]/.test(word) || titleConnectors.has(word.toLowerCase()) || /^[&+/–—-]+$/.test(word)
    );
    if (!looksLikeTitle) break;
    title.push(line);
  }
  if (title.length > 0) return compactText(title.join(' ')).replace(/\s+([,.;!?])/g, '$1');

  const compact = compactText(value);
  const words = compact.split(/\s+/);
  for (let index = 1; index < words.length - 1; index += 1) {
    const word = words[index].replace(/[,:;!?]+$/, '');
    const next = words[index + 1];
    if (/^[A-Z][A-Za-z'’-]*$/.test(word) && /^[a-z]/.test(next)) {
      const articleStart = index > 0 && /^(?:A|An|The)$/.test(words[index - 1]) ? index - 1 : index;
      return words.slice(0, articleStart).join(' ').replace(/\s+([,.;!?])/g, '$1');
    }
  }
  for (const line of lines) {
    if (title.length > 0 && /^(?:You|A |An |Some |Several |Beasts |Massive |Across |After |As |Not |Something |The weather|The smell|The sound)\b/i.test(line)) break;
    title.push(line);
    if (title.join(' ').length >= 56) break;
  }
  return compactText(title.join(' ')) || compact.slice(0, 56);
};

const extractPrintedChoices = (text: string, explicit: string[]): string[] => {
  if (explicit.length > 0) return unique(explicit).slice(0, 12);
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

const cleanPrintedInventoryTarget = (value: string): string => value
  .trim()
  .replace(/^[‘’“”'"`]+/, '')
  .replace(/[‘’“”'"`]+(?=\s*(?:\(|$))/g, '')
  .trim();

export const deriveActionTemplates = (ownerId: string, text: string): PrintedCanonicalActionTemplate[] => {
  const actions: PrintedCanonicalActionTemplate[] = [];
  const push = (
    kind: PrintedCanonicalActionKind,
    label: string,
    sourceText: string,
    amount?: number,
    targetType?: PrintedCanonicalActionTemplate['targetType'],
    fixedTarget?: string
  ) => {
    const signature = `${kind}:${amount ?? ''}:${label}`;
    if (actions.some(action => `${action.kind}:${action.amount ?? ''}:${action.label}` === signature)) return;
    actions.push({
      id: `${ownerId}:action:${actions.length + 1}`,
      kind,
      label,
      amount,
      targetType,
      ...(fixedTarget ? { fixedTarget } : {}),
      sourceText
    });
  };

  sourceClauses(text).forEach(clause => {
    const reputationGain = clause.match(/(?:(?:gain|earn)(?: an extra)?\s+(\d+)\s+(?:Guild\s+)?Reputation|increase\s+(?:Guild\s+)?Reputation\s+by\s+(\d+))/i);
    const reputationLoss = clause.match(/(?:lose\s+(\d+)\s+(?:Guild\s+)?Reputation|decrease\s+(?:Guild\s+)?Reputation\s+by\s+(\d+))/i);
    const trinketGain = clause.match(/(?:gain|earn)(?: an extra)?\s+(\d+|a|one)\s+Trinkets?/i);
    const trinketLoss = clause.match(/(?:lose|trade|pay|leave)\s+(\d+|a|one)\s+Trinkets?/i);
    const markDays = clause.match(/(?:mark|add)(?:ing)?\s+(\d+|a|one)\s+Days?/i);
    // The rulebook uses both “Decrease Timers” and “Reduce Timers” for the
    // same mechanical instruction.  Keep both phrasings canonical so a
    // manual encounter such as Voyage To The Blackwater exposes its timer
    // change alongside the Reputation change instead of silently dropping it.
    const timerDecrease = clause.match(/(?:decrease|reduce)\s+(?:(?:all\s+remaining|all|the|your|any(?:\s+(?:active|current))?)\s+)*(?:(?:Ailment|Foraging|patient)\s+)?Timers?\s+by\s+(?:an\s+additional\s+)?(\d+)/i);
    const timerIncrease = clause.match(/(?:increase|add)\s+(?:(?:all|the|your|any(?:\s+(?:active|current))?)\s+)*(?:next\s+)?(?:(?:Ailment|Foraging|patient)\s+)?Timers?(?:\s+by)?\s+(\d+)/i)
      || clause.match(/add\s+(\d+)\s+to\s+(?:your\s+)?(?:next\s+)?Timer/i);
    const forageGain = clause.match(/gain\s+(\d+)\s+Foraging Points?/i);
    const forageLoss = clause.match(/lose\s+(\d+)\s+Foraging Points?/i);
    const forageSet = clause.match(/(?:decrease|reduce|set)\s+(?:your\s+)?Foraging Points?\s+(?:to|at)\s+(\d+)/i);
    const koreanReputationGain = clause.match(/(?:Guild Reputation|길드\s*명성|명성)(?:을|를)?\s*(?:\+\s*)?(\d+)(?:만큼)?(?:을|를)?\s*(?:얻|올리|증가|적용)/i)
      || clause.match(/(?:Guild Reputation|길드\s*명성|명성)\s*\+(\d+)/i);
    const koreanReputationLoss = clause.match(/(?:Guild Reputation|길드\s*명성|명성)(?:을|를)?\s*(\d+)(?:만큼)?(?:을|를)?\s*(?:잃|낮추|감소)/i)
      || clause.match(/(?:Guild Reputation|길드\s*명성|명성)\s*-(\d+)/i);
    const koreanTrinketGain = clause.match(/장신구(?:를|가|는)?\s*(\d+)개?(?:를|가)?\s*(?:얻|받|추가)/i)
      || clause.match(/장신구\s*\+(\d+)/i);
    const koreanTrinketLoss = clause.match(/장신구(?:를|가|는)?\s*(\d+)개?(?:를|가)?\s*(?:잃|지불|주|건네|제공|소비)/i)
      || clause.match(/장신구\s*-(\d+)/i);
    const koreanMarkDays = clause.match(/(?:달력(?:에|의)?\s*)?(\d+)일(?:을|간)?\s*(?:표시|더|추가|보냄|보내|지남|지난)/i)
      || clause.match(/달력\s*\+(\d+)일/i);
    const koreanTimerDecrease = clause.match(/(?:모든\s*)?(?:환자\s*)?(?:활성\s*)?타이머(?:를|가)?\s*(\d+)(?:만큼)?\s*(?:줄|낮추|감소)/i)
      || clause.match(/타이머\s*-(\d+)/i);
    const koreanTimerIncrease = clause.match(/(?:모든\s*)?(?:환자\s*)?(?:활성\s*)?타이머(?:를|가)?\s*(\d+)(?:만큼)?\s*(?:늘(?:리|립)|올리|증가|더)/i)
      || clause.match(/타이머\s*\+(\d+)/i);
    const koreanForageGain = clause.match(/채집\s*포인트(?:를|가)?\s*(\d+)(?:을|를)?(?:만큼)?\s*(?:얻|올리|증가|추가)/i)
      || clause.match(/채집\s*포인트\s*\+(\d+)/i);
    const koreanForageLoss = clause.match(/채집\s*포인트(?:를|가)?\s*(\d+)(?:을|를)?(?:만큼)?\s*(?:잃|낮추|감소)/i)
      || clause.match(/채집\s*포인트\s*-(\d+)/i);
    const reputationGainAmount = reputationGain?.[1] || reputationGain?.[2] || koreanReputationGain?.[1];
    const reputationLossAmount = reputationLoss?.[1] || reputationLoss?.[2] || koreanReputationLoss?.[1];
    if (reputationGainAmount) push('modify-reputation', `Guild Reputation +${reputationGainAmount}`, clause, Number(reputationGainAmount));
    if (reputationLossAmount) push('modify-reputation', `Guild Reputation -${reputationLossAmount}`, clause, -Number(reputationLossAmount));
    const trinketGainAmount = trinketGain?.[1] || koreanTrinketGain?.[1];
    const trinketLossAmount = trinketLoss?.[1] || koreanTrinketLoss?.[1];
    const markedDaysAmount = markDays?.[1] || koreanMarkDays?.[1];
    const timerDecreaseAmount = timerDecrease?.[1] || koreanTimerDecrease?.[1];
    const timerIncreaseAmount = timerIncrease?.[1] || timerIncrease?.[2] || koreanTimerIncrease?.[1];
    const forageGainAmount = forageGain?.[1] || koreanForageGain?.[1];
    const forageLossAmount = forageLoss?.[1] || koreanForageLoss?.[1];
    const trinketGainNumber = trinketGainAmount ? (trinketGainAmount.match(/\d/) ? Number(trinketGainAmount) : 1) : 0;
    const trinketLossNumber = trinketLossAmount ? (trinketLossAmount.match(/\d/) ? Number(trinketLossAmount) : 1) : 0;
    if (trinketGainAmount) push('modify-trinkets', `장신구 +${trinketGainNumber}`, clause, trinketGainNumber);
    if (trinketLossAmount) push('modify-trinkets', `장신구 -${trinketLossNumber}`, clause, -trinketLossNumber);
    if (!trinketGainAmount
      && /\b(?:(?:gain|earn|receive)\s+(?:an?\s+)?(?:[A-Za-z'-]+\s+){0,3}|(?:gifts?|gives?)\s+you\s+(?:an?\s+)?)Trinket\b/i.test(clause)) {
      push('modify-trinkets', '장신구 +1', clause, 1);
    }
    if (markedDaysAmount) {
      const markedDaysNumber = /\d/.test(markedDaysAmount) ? Number(markedDaysAmount) : 1;
      push('modify-days', `일정 +${markedDaysNumber}일`, clause, markedDaysNumber);
    }
    if (timerDecreaseAmount) push('modify-timer', `타이머 -${timerDecreaseAmount}`, clause, -Number(timerDecreaseAmount), 'timer');
    if (timerIncreaseAmount && !/\b(?:next|future|following)\b/i.test(clause) && !/다음(?:에|\s)/.test(clause)) {
      push('modify-timer', `타이머 +${timerIncreaseAmount}`, clause, Number(timerIncreaseAmount), 'timer');
    }
    if (forageGainAmount) push('modify-foraging-points', `채집 포인트 +${forageGainAmount}`, clause, Number(forageGainAmount));
    if (forageLossAmount) push('modify-foraging-points', `채집 포인트 -${forageLossAmount}`, clause, -Number(forageLossAmount));
    if (forageSet) push('set-foraging-points', `채집 포인트 = ${forageSet[1]}`, clause, Number(forageSet[1]));
    if (/\b(?:lose|discard)\s+all\s+(?:your\s+)?Foraging Points?\b/i.test(clause)
      || /채집\s*포인트(?:를|가)?\s*(?:모두|전부)\s*(?:잃|버리|제거)/i.test(clause)) {
      push('set-foraging-points', '채집 포인트 = 0', clause, 0);
    }
    if (/장신구로\s*취급.{0,30}트로피\s*1개.{0,20}(?:얻|획득)/i.test(clause)) {
      push('modify-trinkets', '장신구 +1', clause, 1);
    }
    const directBagItem = clause.match(/\badd\s+(?:an?\s+)?['“”"]?([^.;]{1,60}?)['“”"]?\s+to\s+(?:your\s+)?Bags?\b/i);
    if (directBagItem) {
      const target = cleanPrintedInventoryTarget(directBagItem[1]);
      const isPronoun = /^(?:it|them|one)$/i.test(target);
      push('gain-inventory', `가방에 ${isPronoun ? '원문의 물품' : target} 추가`, clause, undefined, isPronoun ? 'free-text' : undefined, isPronoun ? undefined : target);
    } else {
      const quotedGain = clause.match(/\b(?:gain|receive|take|buy)\s+['‘’“”"]([^'‘’“”"]{1,60})['‘’“”"]/i);
      if (quotedGain) {
        const target = cleanPrintedInventoryTarget(quotedGain[1]);
        push('gain-inventory', `${target} 획득`, clause, undefined, undefined, target);
      } else if (/\b(?:gain|collect|take|receive|find|buy|trade\s+for)\s+(?:(?:up to as many as you can carry of|an?|one|any|some|your choice of|the)\s+)?(?:[A-Za-z'-]+\s+){0,5}(?:Reagent|Plant|Insect|Tool|Item|Sketch|Gossip|Fruit|Companion|Thingamabob|Codex|Pearl|Ore|Oil|Kite|Object|Bits|Treats?)\b/i.test(clause)
        || /\bGain\s+[^.;]{1,120}\bReagent Parts?\b/i.test(clause)
        || /\b(?:invent|trade for)\s+(?:an?\s+)?(?:Trinket|Reagent Part|Tool)/i.test(clause)) {
        push('gain-inventory', '원문이 지정한 물품 획득', clause, undefined, 'free-text');
      } else {
        const parenthesizedTool = clause.match(/\btrade\s+for\s+(?:some\s+)?([^.;()]{1,60}?)\s*\(\s*Tools?\b/i);
        if (parenthesizedTool) {
          const target = cleanPrintedInventoryTarget(parenthesizedTool[1]);
          push('gain-inventory', `${target} 획득`, clause, undefined, undefined, target);
        } else if (/(?:Reagent|Plant|Insect|Tool|Item|Sketch|Gossip|Fruit|Companion|Thingamabob|Codex|Pearl|Ore|Oil|Kite|Object|Bits|Treats?|영약재|재료|도구|물품|아이템|길동무|장치|기록서|진주|광석|기름|연|소묘|열매|벌레|Behemoth Bits).{0,90}(?:가방에\s*(?:넣|기록|추가)|획득|얻|받|가져|고릅)/i.test(clause)) {
          push('gain-inventory', '원문이 지정한 물품 획득', clause, undefined, 'free-text');
        }
      }
    }
    if (/(?:lose|discard|drop|abandon|leave behind|swap).{0,70}\b(?:Reagent|Part|Tool|Item|Bags?|Weight)\b/i.test(clause)) {
      push('remove-inventory', '적격 가방 물품 제거', clause, undefined, 'inventory-item');
    } else if (/(?:Reagent|Part|Tool|Item|Bag|Scrapings|영약재|재료|도구|물품|아이템|가방).{0,100}(?:discard|remove|hand over|give up|consume|버리|버려|버립|제거|건네|제공|소비|사용|잃)/i.test(clause)) {
      push('remove-inventory', '적격 가방 물품 제거', clause, undefined, 'inventory-item');
    }
    if (/(?:connect|draw|remove|mark|add|make a note).{0,60}\b(?:Path|Location|Settlement|City|Barrow|map)\b|(?:지도|위치).{0,50}(?:표시|기록|추가|제거|연결)/i.test(clause)) {
      push('record-map-change', '지도 변경 기록', clause, undefined, 'location');
    }
    if (/(?:move yourself|move to|move along|move one path|closest shore|travel along an additional|extra Waterways?|end (?:your )?Soar|Flightpath|halve your speed|double your speed|speed is halved)|(?:이동|비행|여정|경로).{0,60}(?:종료|움직|이동|끝|회전)/i.test(clause)) {
      push('record-movement', '이동 상태 변경 기록', clause, undefined, 'location');
    }
    if (/(?:until|next Move|next Timer|next Ailment|next time|in the future|permanently|when you return|following Season|start (?:a |the )?(?:new |next )?Ailment|develops? (?:the |an? )?.{0,40}Ailment|must cure|create a Remedy|set a .{0,30}Timer|cannot (?:Move|Forage)|Rarity.{0,60}(?:is|to|by)|skip (?:Bartering )?Step|gain half|twice as many Foraging Points|do(?:es)? not (?:Mark a Day|gain (?:any )?(?:bonus )?Foraging Points|decrease (?:your )?Timers?)|no Foraging Points|counts? as a Settlement|ignore the negative effects|Companion|off-limits|unavailable for the remainder|reclaim (?:these )?Items)|(?:다음(?:에\s*시작하는)?\s*(?:Move|Move On|이동|질환|타이머|계절)|질환.{0,40}시작|타이머\s*\d+인|치료제.{0,30}만(?:들|듭)|환자.{0,40}(?:생성|시작)|길동무.{0,40}(?:기록|획득)|채집\s*포인트.{0,40}(?:받지|얻지|두\s*배|절반)|(?:Barter|영약재\s*거래).{0,40}(?:단계|건너)|희귀도.{0,30}(?:올리|높이)|선물.{0,60}(?:찾|돌려주)|이\s*위치.{0,60}(?:이동|채집).{0,20}(?:못|않)|사용\s*불가|지역에서\s*다시\s*채집하지)/i.test(clause)) {
      push('record-condition', '지속 조건 기록', clause, undefined, undefined, clause);
    }
  });
  return actions;
};

/**
 * Builds only the still-manual state changes for the encounter branch that
 * was actually selected. Implemented effects have already been committed by
 * executeEncounter, so deriving from the custom remainder prevents the
 * confirmation UI from offering the same Timer/resource change twice.
 */
export const deriveEncounterBranchActionTemplates = (
  ownerId: string,
  choiceId?: string
): PrintedCanonicalActionTemplate[] => {
  const encounter = ENCOUNTERS.find(row => row.id === ownerId);
  if (!encounter) return [];
  const choice = choiceId
    ? encounter.choices.find(row => row.id === choiceId)
    : undefined;
  const manualText = [
    ...encounter.mandatoryEffects.flatMap(structured => structured.support !== 'implemented'
      && structured.effect.type === 'customEffect'
      ? [structured.effect.description]
      : []),
    ...(choice?.effects || []).flatMap(structured => structured.support !== 'implemented'
      && structured.effect.type === 'customEffect'
      ? [structured.effect.description]
      : [])
  ].join(' ');
  const alreadyApplied = new Map<string, number>();
  const rememberApplied = (structured: (typeof encounter.mandatoryEffects)[number]) => {
    if (structured.support !== 'implemented') return;
    const effect = structured.effect;
    const signature = effect.type === 'modifyReputation' ? `modify-reputation:${effect.amount}`
      : effect.type === 'modifyTrinkets' ? `modify-trinkets:${effect.amount}`
        : effect.type === 'markDays' ? `modify-days:${effect.amount}`
          : effect.type === 'modifyForagingPoints' ? `modify-foraging-points:${effect.amount}`
            : effect.type === 'modifyTimer' ? `modify-timer:${effect.amount}`
              : null;
    if (signature) alreadyApplied.set(signature, (alreadyApplied.get(signature) || 0) + 1);
  };
  encounter.mandatoryEffects.forEach(rememberApplied);
  (choice?.effects || []).forEach(rememberApplied);
  return deriveActionTemplates(`${ownerId}:branch:${choiceId || 'mandatory'}`, manualText).filter(action => {
    const signature = `${action.kind}:${action.amount ?? ''}`;
    const duplicates = alreadyApplied.get(signature) || 0;
    if (duplicates <= 0) return true;
    alreadyApplied.set(signature, duplicates - 1);
    return false;
  });
};

const deriveManualResolution = (input: {
  ownerId: string;
  ownerName: string;
  text: string;
  prerequisites: string[];
  explicitChoices: string[];
  actionText?: string;
}): PrintedManualResolution => {
  const text = compactText(input.text);
  const choices = extractPrintedChoices(text, input.explicitChoices);
  const actionTemplates = deriveActionTemplates(input.ownerId, input.actionText || text);
  const clauses = sourceClauses(text);
  const conditionalClauses = clauses.filter(clause => /\b(?:if|when|unless|cannot|must|only|at least|before|after)\b/i.test(clause));
  const followUpRequirements = unique(clauses.filter(clause =>
    /\b(?:draw (?:another |a )?card|resolve another|until|next Move|next Timer|next time|in the future|permanently|when you return|following Season)\b/i.test(clause)
  )).slice(0, 8);
  const inputFields: PrintedResolutionInput[] = [];
  if (choices.length > 0) inputFields.push({ id: 'printed-choice', type: 'choice', label: '적용한 원문 분기 또는 선택', required: false, options: choices });
  if (/\bdraw (?:another |two |one |a )?cards?\b/i.test(text)) inputFields.push({ id: 'follow-up-card', type: 'card-reference', label: '뽑은 후속 카드와 결과', required: false, helpText: '실제로 뽑은 문양과 값을 기록하세요.' });
  if (/\b(?:if|when|unless|may|can|choose whether)\b/i.test(text)) inputFields.push({ id: 'condition-check', type: 'condition', label: '어떤 원문 조건과 분기가 적용되었는지 확인', required: false });
  if (/\?/u.test(text)) inputFields.push({ id: 'narrative-outcome', type: 'free-text', label: '원문이 묻는 서사적 결과', required: false });
  if (/\b(?:any number|as many|how many)\b/i.test(text)) inputFields.push({ id: 'quantity', type: 'number', label: '원문이 플레이어에게 정하도록 한 수량', required: false });
  if (followUpRequirements.length > 0) inputFields.push({ id: 'follow-up-result', type: 'follow-up-reference', label: '후속 판정 또는 지속 효과 기록', required: false });
  if (inputFields.length === 0) inputFields.push({ id: 'outcome-detail', type: 'free-text', label: '원문 지시를 해결한 구체적인 결과', required: false });

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
  const explicitChoices = encounter.choices
    .filter(choice => choice.id !== 'continue')
    .map(choice => choice.label);
  return {
    id: `printed:${encounter.id}`,
    ownerType: 'encounter',
    ownerId: encounter.id,
    ownerName,
    status: encounter.support === 'implemented' ? 'implemented' : 'manual',
    automationClass: encounter.support === 'implemented'
      ? (encounter.choices.some(choice => choice.id !== 'continue') ? 'structured-choice' : 'deterministic')
      : 'narrative',
    trigger: 'encounter',
    supportedTriggers: ['encounter'],
    printedText: compactText(encounter.prompt),
    triggerText: { encounter: compactText(encounter.prompt) },
    prerequisites,
    mandatoryEffects: [],
    optionalChoices: encounter.choices
      .filter(choice => choice.id !== 'continue')
      .map(choice => ({ id: choice.id, label: choice.label, effects: [] })),
    resourceChanges: [], timerChanges: [], inventoryChanges: [], movementChanges: [], mapChanges: [], reputationChanges: [],
    followUpState: null,
    journalPrompt: encounter.prompt,
    manualResolution: encounter.support === 'implemented' ? null : deriveManualResolution({
      ownerId: encounter.id,
      ownerName,
      text: encounter.prompt,
      prerequisites,
      explicitChoices
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
