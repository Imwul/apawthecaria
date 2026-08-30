import { describe, expect, it } from 'vitest';

import { ENCOUNTER_REVIEW_FORAGING_CHOICE_KO } from '../../localization/encounterReviewForagingKo';
import { SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO } from '../../localization/encounterReviewSocialKo';
import { ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO } from '../../localization/encounterReviewTravelKo';
import { encounterChoiceAvailability, executeEncounter } from '../encounterEngine';
import { encounterChoiceRequiresJournal } from './encounterChoices';
import { ENCOUNTERS } from './encounters';

const encounter = (id: string) => ENCOUNTERS.find(row => row.id === id)!;

const patient = {
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

const state = (conditions: string[] = []) => ({
  reputation: 0,
  trinkets: 0,
  calendarDays: 0,
  foragingPoints: 0,
  inventory: [],
  patient,
  movementBlocked: false,
  conditions,
  appliedEffectIds: []
});

const expectManualCode = (encounterId: string, choiceId: string, code: string): void => {
  const row = encounter(encounterId);
  const result = executeEncounter({
    transactionId: `conditional:${encounterId}:${choiceId}`,
    encounter: row,
    choiceId,
    state: state(),
    journalAcknowledged: true
  });
  expect(result.status).toBe('manual');
  expect(result.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
    effect: expect.objectContaining({ type: 'customEffect', code })
  }));
};

describe('printed conditional and follow-up hierarchy', () => {
  it('uses one state check for Obstruction instead of letting the player declare a travel mode', () => {
    const row = encounter('travel-meadow-a-2');
    expect(row.sourcePage).toBe(86);
    expect(row.choices.map(choice => choice.id)).toEqual(['resolve-obstruction']);
    expectManualCode(row.id, 'resolve-obstruction', 'OBSTRUCTION_WAGON_CHECK');
    const localized = ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO[row.id]['resolve-obstruction'];
    expect(localized).toContain('Wagon');
    expect(localized).toContain('1일');
    expect(localized).toContain('Wagon 없이');
  });

  it('keeps later Ailment failures under their triggering checks', () => {
    const fangs = encounter('foraging-bog-m-summer');
    expect(fangs.sourcePage).toBe(157);
    expect(fangs.choices.map(choice => choice.id)).toEqual(['check-for-soothing-supplies']);
    expectManualCode(fangs.id, 'check-for-soothing-supplies', 'FANGS_WITH_WINGS_AILMENT');

    const tadpoles = encounter('foraging-loch-9-summer');
    expect(tadpoles.sourcePage).toBe(169);
    expect(tadpoles.choices.map(choice => choice.id)).toEqual(['tadpediatrician']);
    expectManualCode(tadpoles.id, 'tadpediatrician', 'SMALL_AILMENT_TADPOLE_DRAW');
    const localized = ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[tadpoles.id].tadpediatrician;
    expect(localized).toContain('♥ 또는 ♦');
    expect(localized).toContain('♣ 또는 ♠');
    expect(localized).toContain('실제로 치료했을 때만');
  });

  it('nests Lost Item under Give Chase and Leave Them without repairing the printed suit typo', () => {
    const row = encounter('foraging-forest-j-summer');
    expect(row.sourcePage).toBe(163);
    expect(row.choices.map(choice => choice.id)).toEqual(['give-chase', 'leave-them']);
    expect(row.choices.some(choice => choice.id === 'lost-item')).toBe(false);

    const chased = executeEncounter({
      transactionId: 'thief:chase', encounter: row, choiceId: 'give-chase', state: state()
    });
    expect(chased.status).toBe('manual');
    expect(chased.value?.nextState.patient?.timers[0].current).toBe(4);
    expect(chased.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ code: 'THIEF_GIVE_CHASE_DRAW' })
    }));

    const left = executeEncounter({
      transactionId: 'thief:leave', encounter: row, choiceId: 'leave-them', state: state()
    });
    expect(left.status).toBe('manual');
    expect(left.value?.nextState.patient?.timers[0].current).toBe(5);
    expect(row.choices.find(choice => choice.id === 'leave-them')?.effects).toContainEqual({
      support: 'implemented', effect: { type: 'modifyTimer', amount: 1, target: 'all' }
    });
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[row.id]['give-chase']).toContain('♣ 또는 ♣');
  });

  it('turns size, inventory, and species outcomes into one checked procedure each', () => {
    const cases: Array<[string, string, string]> = [
      ['foraging-forest-m-summer', 'rescue-young-beast', 'STUNG_ON_ALL_SIDES_SIZE_BRANCH'],
      ['foraging-meadow-j-summer', 'help-the-bee', 'BEE_KIND_SUPPLY_BRANCH'],
      ['foraging-mountain-m-summer', 'resolve-blazing-sun', 'BLAZING_SUN_BODY_BRANCH']
    ];
    for (const [encounterId, choiceId, code] of cases) {
      const row = encounter(encounterId);
      expect(row.choices.map(choice => choice.id)).toEqual(
        encounterId === 'foraging-meadow-j-summer'
          ? [choiceId, 'leave-the-bee']
          : [choiceId]
      );
      expectManualCode(encounterId, choiceId, code);
    }
  });

  it('offers only the real Fire and Iron decision before resolving its card outcome', () => {
    const row = encounter('foraging-meadow-m-summer');
    expect(row.sourcePage).toBe(175);
    expect(row.choices.map(choice => choice.id)).toEqual(['intervene', 'leave-them-be']);
    expectManualCode(row.id, 'intervene', 'FIRE_AND_IRON_INTERVENE_DRAW');
    const localized = ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[row.id].intervene;
    expect(localized).toContain('M —');
    expect(localized).toContain('M 아님');
    expect(localized).toContain('바느질꾼');
  });

  it('persists Trembling Technology Knowledge and blocks it on the first encounter', () => {
    const row = encounter('foraging-meadow-j-autumn');
    expect(row.sourcePage).toBe(176);
    expect(row.choices.map(choice => choice.id)).toEqual(['run-hide', 'knowledge']);
    const knowledge = row.choices[1];
    expect(encounterChoiceAvailability(knowledge, state()).available).toBe(false);

    const hidden = executeEncounter({
      transactionId: 'trembling:first', encounter: row, choiceId: 'run-hide', state: state()
    });
    expect(hidden.status).toBe('resolved');
    expect(hidden.value?.nextState.patient?.timers[0].current).toBe(4);
    expect(hidden.value?.nextState.conditions).toContain('knowledge:trembling-titan-technology');
    expect(encounterChoiceAvailability(knowledge, hidden.value!.nextState).available).toBe(true);
  });

  it('applies Konami exhaustion before the rest companion decision', () => {
    const row = encounter('foraging-mountain-4');
    expect(row.sourcePage).toBe(178);
    expect(row.choices.map(choice => choice.id)).toEqual(['rest-alone', 'fellow-hiker']);
    for (const choice of row.choices) {
      const result = executeEncounter({
        transactionId: `konami:${choice.id}`, encounter: row, choiceId: choice.id, state: state()
      });
      expect(result.status).toBe('resolved');
      expect(result.value?.nextState.patient?.timers[0].current).toBe(4);
    }
  });

  it('removes the Protective Parents introduction from its actual escape choices', () => {
    const row = encounter('foraging-mountain-j-spring');
    expect(row.sourcePage).toBe(180);
    expect(row.choices.map(choice => choice.id)).toEqual([
      'down-the-scree', 'up-the-slope', 'on-flitting-wings'
    ]);
    const uphill = executeEncounter({
      transactionId: 'parents:up', encounter: row, choiceId: 'up-the-slope', state: state()
    });
    expect(uphill.status).toBe('resolved');
    expect(uphill.value?.nextState.patient?.timers[0].current).toBe(3);
  });

  it('keeps Worrying Ache setup, future failure, and optional Tent procedure in order', () => {
    const row = encounter('foraging-meadow-10-winter');
    expect(row.sourcePage).toBe(177);
    expect(row.choices.map(choice => choice.id)).toEqual(['hot-toddy', 'continue-in-the-cold']);
    expect(row.choices.some(choice => ['chill', 'snotladen'].includes(choice.id))).toBe(false);
    expectManualCode(row.id, 'hot-toddy', 'WORRYING_ACHE_HOT_TODDY');
    const mandatoryCode = row.mandatoryEffects.find(effect => effect.effect.type === 'customEffect');
    expect(mandatoryCode?.effect).toEqual(expect.objectContaining({ code: 'WORRYING_ACHE_COLD_TIMER' }));
  });

  it('keeps What Remains Memento and Snap Crackle Searching out of the choice list', () => {
    const remains = encounter('foraging-titan-7');
    expect(remains.sourcePage).toBe(186);
    expect(remains.choices.map(choice => choice.id)).toEqual(['attend-to-the-remains']);
    expectManualCode(remains.id, 'attend-to-the-remains', 'WHAT_REMAINS_PROCEDURE');

    const snap = encounter('foraging-titan-8');
    expect(snap.sourcePage).toBe(186);
    expect(snap.choices.map(choice => choice.id)).toEqual(['careful', 'quick']);
    expect(snap.choices.some(choice => choice.id === 'searching')).toBe(false);
  });

  it('uses visit history, Bag contents, and prior meeting history instead of narrative self-selection', () => {
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      const researcher = encounter(`foraging-titan-m-${season}`);
      expect(researcher.sourcePage).toBe(187);
      expect(researcher.choices.map(choice => choice.id)).toEqual(['resolve-bakar-visit']);
      expectManualCode(researcher.id, 'resolve-bakar-visit', 'RESEARCHER_VISIT_STAGE');
    }

    const inspection = encounter('social-meadow-settlement-♥');
    expect(inspection.sourcePage).toBe(204);
    expect(inspection.choices.map(choice => choice.id)).toEqual(['inspect-bags']);
    expect(encounterChoiceRequiresJournal(inspection, 'inspect-bags')).toBe(false);
    expectManualCode(inspection.id, 'inspect-bags', 'INSPECTION_MUSHROOM_BRANCH');
    const localizedInspection = SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO[inspection.id]['inspect-bags'];
    expect(localizedInspection).toContain('없다면');
    expect(localizedInspection).toContain('하나라도 있다면');

    const doneDeal = encounter('social-glasswall-♦');
    expect(doneDeal.sourcePage).toBe(213);
    expect(doneDeal.choices.map(choice => choice.id)).toEqual(['greet-griph']);
    expectManualCode(doneDeal.id, 'greet-griph', 'DONE_DEAL_GRIPH_HISTORY');
  });
});
