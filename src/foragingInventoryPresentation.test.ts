import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID } from './rules/data/reagents';
import {
  formatReagentItemName,
  formatReagentName,
  gatheredReagentSummary,
  groupReagentPartNames,
  reagentInventorySearchText,
  splitForagingTags
} from './foragingInventoryPresentation';

describe('foraging and inventory presentation', () => {
  it('uses the canonical English reagent name and only an exact Korean common name', () => {
    expect(formatReagentName(REAGENT_BY_ID.get('reagent-marigold')!)).toBe('Marigold (금잔화)');
    expect(formatReagentName(REAGENT_BY_ID.get('reagent-lavender')!)).toBe('Lavender');
  });

  it('normalizes legacy Korean and English names to one prepared-item label', () => {
    expect(formatReagentItemName('금잔화/메리골드 (꽃잎)', 'reagent-marigold')).toBe('Marigold (금잔화) — Petals (꽃잎)');
    expect(formatReagentItemName('Marigold (Nectar, Added)', 'reagent-marigold')).toBe('Marigold (금잔화) — Nectar (꽃꿀) · 넣어 사용');
  });

  it('groups different parts of the same reagent without making them look duplicated', () => {
    expect(groupReagentPartNames([
      'Marigold (Nectar, Added)',
      '금잔화/메리골드 (꽃잎)',
      'Beehive (Honey)'
    ])).toEqual([
      'Marigold (금잔화) — Nectar (꽃꿀) · 넣어 사용 / Petals (꽃잎)',
      'Beehive (벌집) — Honey (꿀)'
    ]);
  });

  it('reports the acquisition delta and the post-acquisition total', () => {
    expect(gatheredReagentSummary(
      [{ name: 'Marigold (Petals, Ground)', canonicalReagentId: 'reagent-marigold', quantity: 2 }],
      [
        { name: 'Marigold (Petals, Ground)', canonicalReagentId: 'reagent-marigold', quantity: 2 },
        { name: '금잔화/메리골드 (꽃꿀)', canonicalReagentId: 'reagent-marigold', quantity: 1 }
      ]
    )).toBe('Marigold (금잔화) — Petals (꽃잎) · 갈기 +2 · 현재 3개');
  });

  it('keeps both English and exact Korean names searchable', () => {
    const searchable = reagentInventorySearchText({ name: '금잔화/메리골드 (꽃잎)', canonicalReagentId: 'reagent-marigold' });
    expect(searchable).toContain('marigold');
    expect(searchable).toContain('금잔화');
  });

  it('separates ordinary treatment tags from the FAIR/FOUL reward modifiers', () => {
    expect(splitForagingTags([
      { tag: 'STOMACH', value: 2 },
      { tag: 'FAIR', value: 3 },
      { tag: 'FOUL', value: 1 }
    ])).toEqual({
      remedy: [{ tag: 'STOMACH', value: 2 }],
      trade: [{ tag: 'FAIR', value: 3 }, { tag: 'FOUL', value: 1 }]
    });
  });

  it('keeps effects attached to each canonical part and preparation instead of merging a reagent into one tag row', () => {
    const horseChestnuts = REAGENT_BY_ID.get('reagent-horse-chestnuts')!;
    const options = horseChestnuts.preparations.map(part => ({
      id: part.id,
      name: part.name,
      method: part.method,
      ...splitForagingTags(part.tags)
    }));

    expect(options).toHaveLength(4);
    expect(options.filter(option => option.name === 'Chestnuts')).toHaveLength(2);
    expect(options.find(option => option.method === 'BOILED')).toMatchObject({
      remedy: [{ tag: 'STOMACH', value: 2 }],
      trade: []
    });
    expect(options.find(option => option.method === 'COOKED')).toMatchObject({
      remedy: [],
      trade: [{ tag: 'FAIR', value: 2 }]
    });
  });
});
