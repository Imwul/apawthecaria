import { describe, expect, it } from 'vitest';
import { splitForagingTags } from './foragingInventoryPresentation';
import { REAGENT_BY_ID, resolveForaging } from './rules';

describe('foraging part semantics', () => {
  it('persists only the selected Horse Chestnut part/preparation and its own tags', () => {
    const reagent = REAGENT_BY_ID.get('reagent-horse-chestnuts')!;
    const boiled = reagent.preparations.find(part => part.name === 'Chestnuts' && part.method === 'BOILED')!;
    const cooked = reagent.preparations.find(part => part.name === 'Chestnuts' && part.method === 'COOKED')!;
    const baseState = {
      season: 'Autumn' as const,
      currentRegion: 'Meadow' as const,
      currentLocationType: 'Wilds' as const,
      foragingPoints: 0,
      inventory: [],
      toolIds: ['camp-kettle', 'copper-frying-pan']
    };

    const result = resolveForaging({
      transactionId: 'part-semantics:boiled',
      state: baseState,
      forageRegion: 'Meadow',
      locationRelation: 'current',
      card: 13,
      targetReagentId: reagent.id,
      parts: [{ preparationId: boiled.id, quantity: 1 }],
      skipEncounter: true
    });

    expect(result.value?.gatheredItems).toHaveLength(1);
    expect(result.value?.gatheredItems[0]).toMatchObject({
      canonicalReagentId: reagent.id,
      preparationId: boiled.id
    });
    expect(splitForagingTags(boiled.tags)).toEqual({
      remedy: [{ tag: 'STOMACH', value: 2 }],
      trade: []
    });
    expect(splitForagingTags(cooked.tags)).toEqual({
      remedy: [],
      trade: [{ tag: 'FAIR', value: 2 }]
    });
  });

  it('keeps repeated quantities explicit instead of merging their tags into the displayed part', () => {
    const reagent = REAGENT_BY_ID.get('reagent-horse-chestnuts')!;
    const cooked = reagent.preparations.find(part => part.name === 'Chestnuts' && part.method === 'COOKED')!;
    const result = resolveForaging({
      transactionId: 'part-semantics:repeat',
      state: {
        season: 'Autumn', currentRegion: 'Meadow', currentLocationType: 'Wilds',
        foragingPoints: 0, inventory: [], toolIds: ['copper-frying-pan']
      },
      forageRegion: 'Meadow',
      locationRelation: 'current',
      card: 13,
      targetReagentId: reagent.id,
      parts: [{ preparationId: cooked.id, quantity: 2 }],
      skipEncounter: true
    });

    expect(result.value?.gatheredItems).toHaveLength(2);
    expect(result.value?.gatheredItems.every(item => item.preparationId === cooked.id)).toBe(true);
    expect(result.value?.timerCostAfterEncounter).toBe(2);
    expect(splitForagingTags(cooked.tags).trade).toEqual([{ tag: 'FAIR', value: 2 }]);
  });
});
