import type { EncounterRuntimeState } from './gameplay';
import type { EncounterChoice, EncounterDefinition, RuleEffect, StructuredRuleEffect } from './types';
import { encounterChoiceRequiresJournal } from './data/encounterChoices';

export interface EncounterExecutionInput {
  transactionId: string;
  encounter: EncounterDefinition;
  state: EncounterRuntimeState;
  choiceId?: string;
  journalNote?: string;
  journalAcknowledged?: boolean;
  protection?: 'negative' | 'all';
}

export interface EncounterExecutionOutcome {
  transactionId: string;
  nextState: EncounterRuntimeState;
  appliedEffectIds: string[];
  unresolvedEffects: StructuredRuleEffect[];
}

export interface EncounterExecutionResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: EncounterExecutionOutcome | null;
  messages: string[];
}

export interface EncounterChoiceAvailability {
  available: boolean;
  reasons: string[];
}

export const encounterChoiceAvailability = (
  choice: EncounterChoice,
  state: Pick<EncounterRuntimeState, 'reputation' | 'trinkets'> & { conditions?: readonly string[] }
): EncounterChoiceAvailability => {
  const requirements = choice.requirements;
  if (!requirements) return { available: true, reasons: [] };
  const reasons: string[] = [];
  if (typeof requirements.minGuildReputation === 'number' && state.reputation < requirements.minGuildReputation) {
    reasons.push(`Requires Guild Reputation ${requirements.minGuildReputation} or higher.`);
  }
  if (typeof requirements.maxGuildReputation === 'number' && state.reputation > requirements.maxGuildReputation) {
    reasons.push(`Requires Guild Reputation ${requirements.maxGuildReputation} or lower.`);
  }
  if (typeof requirements.minTrinkets === 'number' && state.trinkets < requirements.minTrinkets) {
    reasons.push(`Requires ${requirements.minTrinkets} Trinket(s).`);
  }
  if (requirements.requiredConditionId && !state.conditions?.includes(requirements.requiredConditionId)) {
    reasons.push(`Requires encounter condition: ${requirements.requiredConditionId}.`);
  }
  return { available: reasons.length === 0, reasons };
};

const applyEffect = (state: EncounterRuntimeState, effect: RuleEffect): EncounterRuntimeState | null => {
  if (effect.type === 'modifyReputation') return { ...state, reputation: Math.max(0, state.reputation + effect.amount) };
  if (effect.type === 'modifyTrinkets') return { ...state, trinkets: Math.max(0, state.trinkets + effect.amount) };
  if (effect.type === 'markDays') return { ...state, calendarDays: Math.max(0, state.calendarDays + effect.amount) };
  if (effect.type === 'modifyForagingPoints') return { ...state, foragingPoints: Math.max(0, state.foragingPoints + effect.amount) };
  if (effect.type === 'addItem') {
    return {
      ...state,
      inventory: [...state.inventory, {
        id: effect.itemId,
        name: effect.itemId,
        type: 'item',
        weight: 0,
        quantity: effect.quantity
      }]
    };
  }
  if (effect.type === 'removeItem') {
    let remaining = effect.quantity;
    return {
      ...state,
      inventory: state.inventory.filter(item => {
        if (remaining > 0 && item.id === effect.itemId) {
          remaining -= Math.max(1, item.quantity || 1);
          return false;
        }
        return true;
      })
    };
  }
  if (effect.type === 'blockMovement' || effect.type === 'requireLocalHelp') {
    return { ...state, movementBlocked: true, conditions: [...new Set([...state.conditions, effect.reason])] };
  }
  if (effect.type === 'addCondition') return { ...state, conditions: [...new Set([...state.conditions, effect.conditionId])] };
  if (effect.type === 'modifyTimer') {
    if (!state.patient) return state;
    const hours = Math.abs(effect.amount);
    if (effect.amount > 0) {
      const timers = state.patient.timers.map(timer => timer.status === 'active'
        ? { ...timer, current: Math.min(timer.maximum, timer.current + hours) }
        : timer);
      return { ...state, patient: { ...state.patient, timers } };
    }
    const timers = state.patient.timers.map(timer => {
      if (timer.status !== 'active') return timer;
      const current = Math.max(0, timer.current - hours);
      return { ...timer, current, status: current === 0 ? 'expired' as const : 'active' as const };
    });
    const timerById = new Map(timers.map(timer => [timer.id, timer]));
    const ailments = state.patient.ailments.map(ailment => ailment.status === 'active'
      && ailment.timerIds.some(timerId => timerById.get(timerId)?.status === 'expired')
      ? { ...ailment, status: 'failed' as const }
      : ailment);
    return { ...state, patient: { ...state.patient, timers, ailments } };
  }
  if (effect.type === 'unlockEntry') return { ...state, conditions: [...new Set([...state.conditions, `unlocked:${effect.entryId}`])] };
  return null;
};

const isNegativeEffect = (effect: RuleEffect): boolean => {
  if (effect.type === 'modifyReputation' || effect.type === 'modifyTrinkets' || effect.type === 'modifyForagingPoints') return effect.amount < 0;
  if (effect.type === 'markDays') return effect.amount > 0;
  if (effect.type === 'modifyTimer') return effect.amount < 0;
  return effect.type === 'removeItem'
    || effect.type === 'blockMovement'
    || effect.type === 'requireLocalHelp'
    || effect.type === 'addCondition';
};

export const executeEncounter = (input: EncounterExecutionInput): EncounterExecutionResolution => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Encounter requires a transaction ID.'] };
  const choice = input.choiceId ? input.encounter.choices.find(candidate => candidate.id === input.choiceId) : undefined;
  if (input.choiceId && !choice) return { status: 'invalid', value: null, messages: [`Unknown encounter choice: ${input.choiceId}`] };
  if (input.encounter.choices.length > 0 && !choice) {
    return { status: 'manual', value: null, messages: ['Select one printed encounter choice before resolving.'] };
  }
  if (choice) {
    const availability = encounterChoiceAvailability(choice, input.state);
    if (!availability.available) return { status: 'invalid', value: null, messages: availability.reasons };
  }
  if (choice && encounterChoiceRequiresJournal(input.encounter, choice.id)
    && !input.journalNote?.trim() && !input.journalAcknowledged) {
    return { status: 'invalid', value: null, messages: ['Acknowledge the printed journaling prompt before resolving.'] };
  }

  // A voluntary payment cannot silently succeed by clamping a negative
  // balance to zero. Forced losses still discard as much as the player has.
  const voluntaryTrinketCost = choice && /(?:\b(?:pay|trade|spend|give|buy|leave|swap)\b[^.]{0,80}\btrinkets?\b|장신구[^.]{0,50}(?:주고|남기고|바꾸고|엮고|지불|구매|거래)|(?:주고|남기고|바꾸고|엮고|지불|구매|거래)[^.]{0,50}장신구)/i.test(choice.label)
    ? choice.effects.reduce((sum, structured) => structured.support === 'implemented'
      && structured.effect.type === 'modifyTrinkets'
      && structured.effect.amount < 0
      ? sum + Math.abs(structured.effect.amount)
      : sum, 0)
    : 0;
  if (voluntaryTrinketCost > input.state.trinkets) {
    return { status: 'invalid', value: null, messages: [`This choice requires ${voluntaryTrinketCost} Trinket(s).`] };
  }

  const effects = [...input.encounter.mandatoryEffects, ...(choice?.effects || [])];
  let nextState = { ...input.state, inventory: [...input.state.inventory], conditions: [...input.state.conditions], appliedEffectIds: [...input.state.appliedEffectIds] };
  const appliedEffectIds: string[] = [];
  const unresolvedEffects: StructuredRuleEffect[] = [];
  effects.forEach((structured, index) => {
    const effectId = `${input.transactionId}:${choice?.id || 'mandatory'}:${index}`;
    if (nextState.appliedEffectIds.includes(effectId)) return;
    if (input.protection === 'all' || (input.protection === 'negative' && isNegativeEffect(structured.effect))) {
      nextState = { ...nextState, appliedEffectIds: [...nextState.appliedEffectIds, `${effectId}:protected`] };
      appliedEffectIds.push(`${effectId}:protected`);
      return;
    }
    if (structured.support !== 'implemented') {
      unresolvedEffects.push(structured);
      return;
    }
    const applied = applyEffect(nextState, structured.effect);
    if (!applied) {
      unresolvedEffects.push(structured);
      return;
    }
    nextState = { ...applied, appliedEffectIds: [...applied.appliedEffectIds, effectId] };
    appliedEffectIds.push(effectId);
  });
  if (input.protection !== 'all' && input.encounter.support !== 'implemented' && unresolvedEffects.length === 0 && !choice) {
    unresolvedEffects.push({
      support: input.encounter.support,
      effect: {
        type: 'customEffect',
        code: `PRINTED_${input.encounter.id}`,
        description: input.encounter.prompt
      }
    });
  }

  return {
    status: unresolvedEffects.length > 0 ? 'manual' : 'resolved',
    value: { transactionId: input.transactionId, nextState, appliedEffectIds, unresolvedEffects },
    messages: unresolvedEffects.length > 0
      ? ['Automatic effects were applied. Resolve the remaining printed effects manually.']
      : []
  };
};
