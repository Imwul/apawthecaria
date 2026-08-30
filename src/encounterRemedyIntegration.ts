import { getRuleCardValue } from './rules/cards';
import type {
  EncounterRemedyDefinition,
  EncounterRemedyOutcomeMetadata
} from './rules/data/encounterRemedies';
import type { SecondaryDrawCard } from './secondaryCardHistory';

export type EncounterRemedyTriggerStatus = 'start' | 'skip' | 'ask-context' | 'unresolved';

export interface EncounterRemedyTriggerResolution {
  status: EncounterRemedyTriggerStatus;
  reason: string;
}

/**
 * Resolves only facts the app can actually know. Contextual facts are supplied
 * by the player at the Encounter, while an unprinted tie remains unresolved.
 */
export const resolveEncounterRemedyTrigger = (
  remedy: EncounterRemedyDefinition,
  cards: readonly SecondaryDrawCard[],
  contextualConditionApplies?: boolean
): EncounterRemedyTriggerResolution => {
  const condition = remedy.trigger.condition;
  if (condition === 'always') return { status: 'start', reason: 'printed choice starts the Remedy' };
  if (condition === 'no-soothing-supply' || condition === 'swimming' || condition === 'non-aquatic') {
    if (contextualConditionApplies === undefined) {
      return { status: 'ask-context', reason: condition };
    }
    return contextualConditionApplies
      ? { status: 'start', reason: condition }
      : { status: 'skip', reason: `not-${condition}` };
  }

  const needed = remedy.trigger.cardCount || 1;
  if (cards.length < needed) return { status: 'unresolved', reason: `needs ${needed} follow-up card(s)` };
  const last = cards.at(-1)!;
  if (condition === 'club-or-spade') {
    return last.suit === '♣' || last.suit === '♠'
      ? { status: 'start', reason: `${last.suit} starts the Remedy` }
      : { status: 'skip', reason: `${last.suit} does not start the Remedy` };
  }
  if (condition === 'spade') {
    return last.suit === '♠'
      ? { status: 'start', reason: '♠ starts the Remedy' }
      : { status: 'skip', reason: `${last.suit} does not start the Remedy` };
  }
  if (condition === 'not-monarch') {
    return getRuleCardValue(last) === 12
      ? { status: 'skip', reason: 'Monarch result' }
      : { status: 'start', reason: 'non-Monarch result' };
  }
  if (condition === 'self-card-lower') {
    const self = getRuleCardValue(cards[0]);
    const opponent = getRuleCardValue(cards[1]);
    if (self === opponent) {
      return { status: 'unresolved', reason: 'the rulebook does not state how to resolve a tie' };
    }
    return self < opponent
      ? { status: 'start', reason: 'the Apothecary card is lower' }
      : { status: 'skip', reason: 'the Apothecary card is higher' };
  }
  return { status: 'unresolved', reason: 'unknown trigger condition' };
};
export interface EncounterRemedyBranchPlan {
  reputationDelta: number;
  foragingPointDelta: number;
  /** The branch has no remaining mechanical instruction in the current UI. */
  fullyHandled: boolean;
  /** A concise remainder replaces the original duplicated fixed-Remedy text. */
  remainingInstruction: string | null;
  persistentCondition: string | null;
}

/** Immediate branch effects that surround a fixed Remedy but are not rewards. */
export const encounterRemedyBranchPlan = (
  remedy: EncounterRemedyDefinition,
  trigger: EncounterRemedyTriggerResolution,
  cards: readonly SecondaryDrawCard[],
  locationId: string
): EncounterRemedyBranchPlan => {
  const base: EncounterRemedyBranchPlan = {
    reputationDelta: 0,
    foragingPointDelta: 0,
    fullyHandled: trigger.status === 'start' || trigger.status === 'skip',
    remainingInstruction: null,
    persistentCondition: null
  };
  if (trigger.status === 'unresolved' || trigger.status === 'ask-context') {
    return { ...base, fullyHandled: false };
  }
  if (remedy.id === 'encounter-remedy-thousand-biters' && trigger.status === 'skip') {
    return { ...base, foragingPointDelta: -1 };
  }
  if (remedy.id === 'encounter-remedy-fire-and-iron-wound') {
    return { ...base, reputationDelta: trigger.status === 'start' ? 6 : 4 };
  }
  if (remedy.id === 'encounter-remedy-gas-leak-poison') {
    return {
      ...base,
      persistentCondition: `gas-leak-rush:${locationId}`
    };
  }
  if (remedy.id === 'encounter-remedy-talons-trauma') {
    const lastSuit = cards.at(-1)?.suit;
    if (trigger.status === 'start') {
      return {
        ...base,
        fullyHandled: false,
        remainingInstruction: '비행 경로의 중간 지점에 착륙한 현재 위치를 확인하세요. 응급 치료 기록은 이미 생성되었습니다.'
      };
    }
    if (lastSuit === '♦') {
      return {
        ...base,
        fullyHandled: false,
        remainingInstruction: '분실한 가방을 반영하려면 합계 무게 1 이상의 물품을 버리세요.'
      };
    }
  }
  return base;
};

export interface EncounterRemedySuccessPlan {
  reputationDelta: number;
  trinketDelta: number;
  activeTimerDelta: number;
  addCondition: string | null;
  removeConditionPrefix: string | null;
  journalLine: string;
}

export const encounterRemedySuccessPlan = (
  outcome: EncounterRemedyOutcomeMetadata | null | undefined
): EncounterRemedySuccessPlan | null => {
  if (!outcome) return null;
  if (outcome.code === 'RESTORE_FORAGING_POINTS') return {
    reputationDelta: 0,
    trinketDelta: 0,
    activeTimerDelta: 0,
    addCondition: null,
    removeConditionPrefix: 'encounter-remedy:titan-rash-foraging-lock:',
    journalLine: '티탄 발진이 나아 다시 채집 포인트를 얻을 수 있습니다.'
  };
  if (outcome.code === 'HELPING_PAW') return {
    reputationDelta: 2,
    trinketDelta: 2,
    activeTimerDelta: 0,
    addCondition: null,
    removeConditionPrefix: null,
    journalLine: '아픈 올챙이를 치료해 Guild Reputation 2와 장신구 2개를 얻었습니다.'
  };
  if (outcome.code === 'IMMEDIATE_REMEDY_TIMER_COST') return {
    reputationDelta: 0,
    trinketDelta: 0,
    activeTimerDelta: -2,
    addCondition: null,
    removeConditionPrefix: null,
    journalLine: '싸움의 상처를 즉시 치료해 모든 활성 타이머가 2시간씩 줄었습니다.'
  };
  if (outcome.code === 'BEAR_DEFERENCE') return {
    reputationDelta: 0,
    trinketDelta: 0,
    activeTimerDelta: 0,
    addCondition: 'bear-lord-deference',
    removeConditionPrefix: null,
    journalLine: '곰 영주의 치료가 성공했습니다. 향후 곰 조우의 부정적 결과는 거대한 곰이 예의를 보이는 장면으로 대체합니다.'
  };
  return null;
};
