import { describe, expect, it } from 'vitest';
import { encounterChoiceAvailability, executeEncounter } from '../encounterEngine';
import { FORAGING_ENCOUNTERS } from './encounters';

const baseState = {
  reputation: 0,
  trinkets: 0,
  calendarDays: 0,
  foragingPoints: 0,
  inventory: [],
  patient: null,
  movementBlocked: false,
  conditions: [],
  appliedEffectIds: []
};

describe('composite printed encounter overrides', () => {
  it('applies Guild of One · New Connections whether Assistant is chosen or not', () => {
    const encounter = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-bog-9-spring')!;
    expect(encounter.sourcePage).toBe(156);
    expect(encounter.choices.map(choice => choice.id)).toEqual(['assistant', 'keep-moving']);
    expect(encounter.mandatoryEffects).toContainEqual({
      support: 'implemented',
      effect: { type: 'modifyReputation', amount: 1 }
    });

    const helped = executeEncounter({
      transactionId: 'guild-of-one-help',
      encounter,
      choiceId: 'assistant',
      state: baseState
    });
    expect(helped.status).toBe('resolved');
    expect(helped.value?.nextState).toMatchObject({ reputation: 1, trinkets: 1 });

    const continued = executeEncounter({
      transactionId: 'guild-of-one-continue',
      encounter,
      choiceId: 'keep-moving',
      state: baseState
    });
    expect(continued.status).toBe('resolved');
    expect(continued.value?.nextState).toMatchObject({ reputation: 1, trinkets: 0 });
  });

  it('keeps Mycophiliacs calendar outcome mandatory and Barter optional while requiring the printed Journal', () => {
    const encounter = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-meadow-m-autumn')!;
    expect(encounter.sourcePage).toBe(176);
    expect(encounter.choices.map(choice => choice.id)).toEqual(['beseech', 'continue-without-barter']);
    expect(encounter.mandatoryEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'MYCOPHILIACS_CALENDAR_BRANCH' })
    }));
    expect(encounter.choices.every(choice => choice.requiresJournal)).toBe(true);

    const beseech = encounter.choices[0];
    expect(encounterChoiceAvailability(beseech, { reputation: 25, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(beseech, { reputation: 34, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(beseech, { reputation: 24, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(beseech, { reputation: 35, trinkets: 0 }).available).toBe(false);
  });

  it('keeps Sain De Claws delivery as the follow-up to its present-hunt setup', () => {
    const encounter = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-meadow-9-winter')!;
    expect(encounter.sourcePage).toBe(177);
    expect(encounter.choices.map(choice => choice.id)).toEqual(['begin-present-hunt']);
    expect(encounter.choices[0].effects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'SAIN_DE_CLAWS_PRESENT_HUNT' })
    }));
  });
});
