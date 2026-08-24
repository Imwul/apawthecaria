import { describe, expect, it } from 'vitest';

import { executeEncounter } from '../encounterEngine';
import { ENCOUNTERS } from './encounters';

const encounter = (id: string) => ENCOUNTERS.find(row => row.id === id)!;

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

describe('printed card outcomes stay nested under the action that caused them', () => {
  it('does not present random results as player decisions', () => {
    const expectedChoices: Record<string, string[]> = {
      'travel-bog-5-6': ['draw-and-pass-the-branches'],
      'travel-loch-j-spring': ['refuse', 'race'],
      'travel-meadow-9-10-winter': ['challenge-accepted', 'decline-the-game'],
      'foraging-bog-8': ['vigilante', 'archer', 'do-not-intervene'],
      'foraging-bog-9-summer': ['run'],
      'foraging-bog-10-autumn': ['run'],
      'foraging-loch-9-winter': ['too-risky', 'brave-the-ice'],
      'foraging-mountain-8': ['play-it-safe', 'scrap'],
      'foraging-titan-4': ['enter-the-chamber', 'leave-the-chamber'],
      'foraging-titan-5': ['flee-and-resolve']
    };

    Object.entries(expectedChoices).forEach(([encounterId, choiceIds]) => {
      expect(encounter(encounterId).choices.map(choice => choice.id), encounterId).toEqual(choiceIds);
    });

    expect(Object.fromEntries(Object.keys(expectedChoices).map(encounterId => [
      encounterId,
      encounter(encounterId).sourcePage
    ]))).toEqual({
      'travel-bog-5-6': 75,
      'travel-loch-j-spring': 83,
      'travel-meadow-9-10-winter': 89,
      'foraging-bog-8': 155,
      'foraging-bog-9-summer': 157,
      'foraging-bog-10-autumn': 158,
      'foraging-loch-9-winter': 171,
      'foraging-mountain-8': 179,
      'foraging-titan-4': 185,
      'foraging-titan-5': 185
    });

    const staleOutcomeIds = new Set([
      'if-its-value-is-5',
      'if-you-win',
      'if-you-lose',
      'this-trophy-counts-as-a-trinket',
      'not-highest',
      'lower',
      'if-your-card-is-higher',
      'biting-mood',
      'higher-than-your-carry',
      'if-you-win-the-fight',
      'if-you-lose-the-fight',
      'if-you-make-it-into-the-chamber',
      'confrontation',
      'if-your-total-is-still-lower',
      'trapped'
    ]);
    Object.keys(expectedChoices).forEach(encounterId => {
      expect(encounter(encounterId).choices.some(choice => staleOutcomeIds.has(choice.id)), encounterId).toBe(false);
    });
  });

  it('keeps every printed success and failure branch in the causal action', () => {
    expect(encounter('travel-bog-5-6').choices[0].label).toMatch(/Below 5[\s\S]*5-9[\s\S]*10 or more/);
    expect(encounter('travel-loch-j-spring').choices.find(choice => choice.id === 'race')?.label)
      .toMatch(/Win:[\s\S]*Lose:/);
    expect(encounter('travel-meadow-9-10-winter').choices[0].label)
      .toMatch(/highest[\s\S]*otherwise/);
    expect(encounter('foraging-bog-8').choices.find(choice => choice.id === 'vigilante')?.label)
      .toMatch(/Higher:[\s\S]*Lower:/);
    expect(encounter('foraging-loch-9-winter').choices.find(choice => choice.id === 'brave-the-ice')?.label)
      .toMatch(/At or below Carry[\s\S]*Above Carry/);
    expect(encounter('foraging-mountain-8').choices.find(choice => choice.id === 'scrap')?.label)
      .toMatch(/Win:[\s\S]*Lose:/);
    expect(encounter('foraging-titan-5').choices[0].label)
      .toMatch(/Higher:[\s\S]*Lower:[\s\S]*still lower/);
  });

  it('automates only the unconditional Thin Ice refusal and leaves the draw manual', () => {
    const thinIce = encounter('foraging-loch-9-winter');
    const safe = executeEncounter({
      transactionId: 'thin-ice-safe',
      encounter: thinIce,
      choiceId: 'too-risky',
      state: baseState
    });
    expect(safe.status).toBe('resolved');
    expect(safe.value?.nextState.foragingPoints).toBe(1);

    const brave = executeEncounter({
      transactionId: 'thin-ice-brave',
      encounter: thinIce,
      choiceId: 'brave-the-ice',
      state: baseState
    });
    expect(brave.status).toBe('manual');
    expect(brave.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'THIN_ICE_DRAW' })
    }));
  });
});
