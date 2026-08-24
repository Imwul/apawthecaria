import { describe, expect, it } from 'vitest';

import { ENCOUNTER_REVIEW_FORAGING_CHOICE_KO } from '../../localization/encounterReviewForagingKo';
import { SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO } from '../../localization/encounterReviewSocialKo';
import { ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO } from '../../localization/encounterReviewTravelKo';
import { executeEncounter } from '../encounterEngine';
import { ENCOUNTERS } from './encounters';

const encounter = (id: string) => ENCOUNTERS.find(row => row.id === id)!;

const activePatient = {
  id: 'patient',
  name: 'Patient',
  species: 'Beast',
  status: 'active' as const,
  ailments: [{
    id: 'ailment-instance',
    ailmentId: 'test-ailment',
    severity: 'lesser' as const,
    timerIds: ['timer'],
    conditionIds: [],
    treatmentHistoryIds: [],
    status: 'active' as const,
    instance: 1,
    repeatIndex: 0,
    specialState: {},
    successResolved: false,
    failureResolved: false,
    consequenceResolved: false,
    effectIds: []
  }],
  timers: [{
    id: 'timer',
    ailmentInstanceId: 'ailment-instance',
    current: 5,
    maximum: 5,
    status: 'active' as const
  }],
  conditions: [],
  treatmentHistory: [],
  journalEvents: []
};

const baseState = {
  reputation: 5,
  trinkets: 0,
  calendarDays: 0,
  foragingPoints: 3,
  inventory: [],
  patient: activePatient,
  movementBlocked: false,
  conditions: [],
  appliedEffectIds: []
};

const manualCode = (result: ReturnType<typeof executeEncounter>, code: string): void => {
  expect(result.status).toBe('manual');
  expect(result.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
    effect: expect.objectContaining({ type: 'customEffect', code })
  }));
};

describe('high-risk printed follow-ups remain attached to their triggering action', () => {
  it('keeps both later Sketch trades inside The Gift of Knowledge', () => {
    const row = encounter('travel-forest-7-8');
    expect(row.sourcePage).toBe(78);
    expect(row.choices.map(choice => choice.id)).toEqual([
      'the-gift-of-knowledge',
      'leave-without-sketch'
    ]);

    const result = executeEncounter({
      transactionId: 'from-up-high',
      encounter: row,
      choiceId: 'the-gift-of-knowledge',
      state: baseState
    });
    manualCode(result, 'FROM_UP_HIGH_SKETCH');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO[row.id]['the-gift-of-knowledge'])
      .toMatch(/Craftspaws[\s\S]*Knowers[\s\S]*둘 중 한 보상/);
  });

  it('treats Electrician card headings as outcomes of one repeatable repair draw', () => {
    const row = encounter('travel-titan-m');
    expect(row.sourcePage).toBe(99);
    expect(row.choices.map(choice => choice.id)).toEqual(['fixer-upper', 'decline-repair']);

    const result = executeEncounter({
      transactionId: 'electrician',
      encounter: row,
      choiceId: 'fixer-upper',
      state: baseState
    });
    manualCode(result, 'ELECTRICIAN_REPAIR_LOOP');
    expect(result.value?.nextState.calendarDays).toBe(1);
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO[row.id]['fixer-upper'])
      .toMatch(/M 또는 J[\s\S]*2-10[\s\S]*A/);
  });

  it('keeps the Ancient Salvage draw result under Dig and applies its time cost once', () => {
    const row = encounter('foraging-bog-2');
    expect(row.sourcePage).toBe(154);
    expect(row.choices.map(choice => choice.id)).toEqual(['dig', 'leave-it-buried']);

    const result = executeEncounter({
      transactionId: 'ancient-salvage',
      encounter: row,
      choiceId: 'dig',
      state: baseState
    });
    manualCode(result, 'ANCIENT_SALVAGE_DRAW');
    expect(result.value?.nextState.patient?.timers[0].current).toBe(4);
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[row.id].dig).toMatch(/10 이상[\s\S]*10 미만/);
  });

  it('keeps Heat Sink as one compulsory Warm Up action', () => {
    const row = encounter('foraging-bog-10-winter');
    expect(row.sourcePage).toBe(159);
    expect(row.choices.map(choice => choice.id)).toEqual(['warm-up']);

    const result = executeEncounter({
      transactionId: 'heat-sink',
      encounter: row,
      choiceId: 'warm-up',
      state: baseState
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.patient?.timers[0].current).toBe(4);
  });

  it('keeps the future Warm Up consequence inside the compulsory cold Timer', () => {
    const row = encounter('foraging-mountain-10-winter');
    expect(row.sourcePage).toBe(183);
    expect(row.choices.map(choice => choice.id)).toEqual(['harsh-wind']);

    const result = executeEncounter({
      transactionId: 'chilled-to-bone',
      encounter: row,
      choiceId: 'harsh-wind',
      state: baseState
    });
    manualCode(result, 'CHILLED_TO_BONE_TIMER');
  });

  it('offers the Bear Lord Ailment once and nests both future Timer resolutions', () => {
    const row = encounter('foraging-mountain-m-winter');
    expect(row.sourcePage).toBe(183);
    expect(row.choices.map(choice => choice.id)).toEqual(['start-ailment', 'decline-ailment']);

    const result = executeEncounter({
      transactionId: 'mercy-for-mighty',
      encounter: row,
      choiceId: 'start-ailment',
      state: baseState
    });
    manualCode(result, 'MERCY_FOR_MIGHTY_AILMENT');
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[row.id]['start-ailment'])
      .toMatch(/타이머 8[\s\S]*제때[\s\S]*타이머가 0/);
  });

  it('does not offer Open the Door until Password has produced a Symbol', () => {
    const row = encounter('foraging-titan-2');
    expect(row.sourcePage).toBe(184);
    expect(row.choices.map(choice => choice.id)).toEqual(['look-around', 'leave-it-locked']);

    const result = executeEncounter({
      transactionId: 'password',
      encounter: row,
      choiceId: 'look-around',
      state: baseState
    });
    manualCode(result, 'PASSWORD_SYMBOL_HUNT');
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[row.id]['look-around'])
      .toMatch(/J 또는 M[\s\S]*문양을 찾은 뒤에만[\s\S]*Titan Codex[\s\S]*Clinic/);
  });

  it('keeps Gas Leak Rush and the later Poisoned result in one mandatory procedure', () => {
    const row = encounter('foraging-titan-3');
    expect(row.sourcePage).toBe(184);
    expect(row.choices.map(choice => choice.id)).toEqual(['rush']);

    const result = executeEncounter({
      transactionId: 'gas-leak',
      encounter: row,
      choiceId: 'rush',
      state: baseState
    });
    manualCode(result, 'GAS_LEAK_RUSH');
  });

  it('keeps releasing the Queen as the future resolution of Protect the Queen', () => {
    const row = encounter('social-meadow-spring-♣');
    expect(row.sourcePage).toBe(206);
    expect(row.choices.map(choice => choice.id)).toEqual(['protect-the-queen', 'wish-them-luck']);

    const protectedQueen = executeEncounter({
      transactionId: 'bees-protect',
      encounter: row,
      choiceId: 'protect-the-queen',
      state: baseState
    });
    manualCode(protectedQueen, 'BEES_REHOME_QUEEN');

    const wishedLuck = executeEncounter({
      transactionId: 'bees-decline',
      encounter: row,
      choiceId: 'wish-them-luck',
      state: baseState
    });
    expect(wishedLuck.status).toBe('resolved');
    expect(wishedLuck.value?.nextState.reputation).toBe(4);
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO[row.id]['protect-the-queen'])
      .toMatch(/Queen Bee[\s\S]*벌집[\s\S]*Honey[\s\S]*Wax/);
  });
});
