import { describe, expect, it } from 'vitest';

import {
  ENCOUNTER_REVIEW_FORAGING_CHOICE_KO,
  ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO
} from '../../localization/encounterReviewForagingKo';
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
  reputation: 0,
  trinkets: 0,
  calendarDays: 0,
  foragingPoints: 0,
  inventory: [],
  patient: activePatient,
  movementBlocked: false,
  conditions: [],
  appliedEffectIds: []
};

describe('remaining printed follow-up branches stay attached to their cause', () => {
  it('keeps Two-Faced as two present choices and records Vigilante as a future follow-up', () => {
    const twoFaced = encounter('travel-loch-m-autumn');
    expect(twoFaced.sourcePage).toBe(85);
    expect(twoFaced.choices.map(choice => choice.id)).toEqual(['spill-the-beans', 'keep-quiet']);
    expect(twoFaced.choices.flatMap(choice => choice.effects)).toContainEqual(expect.objectContaining({
      support: 'manual-only',
      effect: expect.objectContaining({ type: 'customEffect', code: 'TWO_FACED_KEEP_QUIET' })
    }));

    const localized = ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO[twoFaced.id];
    expect(Object.keys(localized)).toEqual(['spill-the-beans', 'keep-quiet']);
    expect(localized['keep-quiet']).toMatch(/M을 뽑[\s\S]*승리[\s\S]*패배/);
    expect(localized['keep-quiet']).toContain('Guild Reputation 10');
  });

  it('offers the p.91 Quest once and keeps arrival outcomes inside it', () => {
    const knights = encounter('travel-mountain-j-spring');
    expect(knights.sourcePage).toBe(91);
    expect(knights.choices.map(choice => choice.id)).toEqual(['quest', 'decline-quest']);
    expect(knights.choices.some(choice => ['fighting-the-behemoth', 'too-late'].includes(choice.id))).toBe(false);

    const accepted = executeEncounter({
      transactionId: 'knights-quest',
      encounter: knights,
      choiceId: 'quest',
      state: baseState
    });
    expect(accepted.status).toBe('manual');
    expect(accepted.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'KNIGHTS_ROUND_TABLE_QUEST' })
    }));
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO[knights.id].quest)
      .toMatch(/경로 24개[\s\S]*기한 안에 도착[\s\S]*기한을 넘김[\s\S]*여정 종료/);
  });

  it('automates hiding from the p.182 wolf but keeps both fight results under Blood to Blood', () => {
    const howl = encounter('foraging-mountain-10-autumn');
    expect(howl.sourcePage).toBe(182);
    expect(howl.choices.map(choice => choice.id)).toEqual(['stay-low', 'blood-to-blood']);
    expect(howl.choices.some(choice => ['if-you-win-the-fight', 'if-you-lose-the-fight'].includes(choice.id))).toBe(false);

    const hidden = executeEncounter({
      transactionId: 'howl-hide',
      encounter: howl,
      choiceId: 'stay-low',
      state: baseState
    });
    expect(hidden.status).toBe('resolved');
    expect(hidden.value?.nextState.patient?.timers[0].current).toBe(3);

    const fight = executeEncounter({
      transactionId: 'howl-fight',
      encounter: howl,
      choiceId: 'blood-to-blood',
      state: baseState
    });
    expect(fight.status).toBe('manual');
    expect(fight.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'HOWL_BLOOD_TO_BLOOD' })
    }));

    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO[howl.id]).not.toContain('몸 낮추기');
    expect(Object.keys(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[howl.id]))
      .toEqual(['stay-low', 'blood-to-blood']);
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[howl.id]['blood-to-blood'])
      .toMatch(/승리[\s\S]*패배[\s\S]*Speed 또는 Carry/);
  });
});
