import { describe, expect, it } from 'vitest';
import { executeEncounter } from '../encounterEngine';
import { BEAR_SCURRY_ENCOUNTER, FORAGING_ENCOUNTERS, SOCIAL_ENCOUNTERS, findEncounter } from './encounters';
import { enrichEncounterChoices, leftoverNeeded, parseMechanicalEffects, splitEncounterChoices } from './encounterChoices';
import { resolvePatient } from '../engine';

describe('printed encounter choice execution', () => {
  it('splits labeled forage choices and applies reputation and timer changes', () => {
    const split = splitEncounterChoices(
      'A grouchy hare lectures you. Listen & Learn - Decrease Timers by 4. However, from now on everytime you Forage in a Bog, gain 1 Foraging Point. Interrupt - Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.'
    );
    expect(split.choices.map(choice => choice.id)).toEqual(['listen-learn', 'interrupt']);
    const interrupt = split.choices.find(choice => choice.id === 'interrupt')!;
    expect(interrupt.effects).toEqual([
      { support: 'implemented', effect: { type: 'modifyReputation', amount: -1 } }
    ]);
    const listen = split.choices.find(choice => choice.id === 'listen-learn')!;
    expect(listen.effects).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'modifyTimer', amount: -4, target: 'all' } },
      { support: 'implemented', effect: { type: 'addCondition', conditionId: 'forage-bonus:Bog:1' } }
    ]));
  });

  it('parses reduce/increase timers, lost foraging points, and extra calendar days', () => {
    expect(parseMechanicalEffects('Reduce Timers by 1. Lose 2 Foraging Points. Add 1 Day to your Calendar.')).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
      { support: 'implemented', effect: { type: 'modifyForagingPoints', amount: -2 } },
      { support: 'implemented', effect: { type: 'markDays', amount: 1 } }
    ]));
    expect(parseMechanicalEffects('Sit And Soak - Mark a Day. Gain a reed-woven Trinket.')).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
      { support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } }
    ]));
    expect(parseMechanicalEffects('Spare Material - Trade a Trinket to gain any Common or Rare Bog Reagent.')).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } }
    ]));
    expect(leftoverNeeded('Draw a card and add a Titan Thingamabob to your Bags.')).toBe(true);
    expect(leftoverNeeded('Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.')).toBe(false);
  });

  it('does not award a conditional or delayed reward when its choice is first selected', () => {
    expect(parseMechanicalEffects("Add a 'Parcel' to your Bags. Gain 3 Trinkets if you go to that Location, delivering it."))
      .not.toContainEqual({ support: 'implemented', effect: { type: 'modifyTrinkets', amount: 3 } });
    expect(leftoverNeeded('Gain 3 Trinkets if you go to that Location, delivering it.')).toBe(true);

    const encounter = findEncounter({ encounterType: 'travel', region: 'Meadow', card: 8 })!;
    const deliver = encounter.choices.find(choice => choice.id === 'deliver-the-parcel')!;
    const result = executeEncounter({
      transactionId: 'parcel-pickup',
      encounter,
      choiceId: deliver.id,
      state: {
        reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 0,
        inventory: [], patient: null, movementBlocked: true, conditions: [], appliedEffectIds: []
      }
    });
    expect(result.status).toBe('manual');
    expect(result.value?.nextState.trinkets).toBe(0);
  });

  it('does not apply the mechanical result of an unresolved card-suit branch', () => {
    const legacyInMud = parseMechanicalEffects(
      'You may scout. Draw a Card: ♥ or ♦ - It holds. Gain 3 Foraging Points ♣ or ♠ - Discard an Item.'
    );
    expect(legacyInMud).not.toContainEqual({
      support: 'implemented',
      effect: { type: 'modifyForagingPoints', amount: 3 }
    });

    const napBeforeDraw = parseMechanicalEffects(
      'Decrease Timers by 1 and Draw a Card: ♥ or ♦ - Gain 5 Foraging Points. ♣ or ♠ - Lose 1 Foraging Point.'
    );
    expect(napBeforeDraw).toContainEqual({
      support: 'implemented',
      effect: { type: 'modifyTimer', amount: -1, target: 'all' }
    });
    expect(napBeforeDraw.some(({ effect }) => effect.type === 'modifyForagingPoints')).toBe(false);
  });

  it('lets the bog Ace interrupt complete without a leftover printed dump', () => {
    const encounter = findEncounter({
      encounterType: 'foraging',
      region: 'Bog',
      card: 1
    });
    expect(encounter?.choices.length).toBeGreaterThan(0);
    const result = executeEncounter({
      transactionId: 'forage-ace',
      encounter: encounter!,
      choiceId: encounter!.choices.find(choice => choice.id === 'interrupt')?.id,
      state: {
        reputation: 5,
        trinkets: 0,
        calendarDays: 0,
        foragingPoints: 0,
        inventory: [],
        patient: null,
        movementBlocked: false,
        conditions: [],
        appliedEffectIds: []
      }
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.reputation).toBe(4);
  });

  it('offers the two printed Bear’s Necessities branches and applies Scurry costs', () => {
    const bear = findEncounter({ encounterType: 'foraging', region: 'Forest', card: 12, season: 'Spring' });
    expect(bear?.choices.map(choice => choice.id)).toEqual(['mark-barrow', 'appease']);

    const patient = resolvePatient({ id: 'bear-patient', name: 'Thistle', species: 'Squirrel', ailmentIds: ['ailment-dullsweats'] }).value!;
    const before = patient.timers[0].current;
    const result = executeEncounter({
      transactionId: 'bear-scurry-cost',
      encounter: BEAR_SCURRY_ENCOUNTER,
      choiceId: 'lose-foraging-points',
      state: {
        reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 5,
        inventory: [], patient, movementBlocked: false, conditions: [], appliedEffectIds: []
      }
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.foragingPoints).toBe(2);
    expect(result.value?.nextState.patient?.timers[0].current).toBe(before - 2);
  });

  it('keeps every forage and social encounter selectable', () => {
    const forageWithChoices = FORAGING_ENCOUNTERS.filter(row => row.choices.length > 0);
    expect(forageWithChoices.length).toBe(FORAGING_ENCOUNTERS.length);
    expect(SOCIAL_ENCOUNTERS.every(row => row.choices.length > 0)).toBe(true);
    const enriched = enrichEncounterChoices({
      ...FORAGING_ENCOUNTERS[0],
      choices: [{ id: 'keep', label: 'Keep existing', effects: [] }]
    });
    expect(enriched.choices[0].id).toBe('keep');
  });
});
