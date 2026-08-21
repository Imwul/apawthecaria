import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID } from './rules/data/reagents';
import {
  formatReagentItemName,
  formatReagentName,
  gatheredReagentSummary,
  groupReagentPartNames,
  reagentInventorySearchText
} from './foragingInventoryPresentation';

describe('foraging and inventory presentation', () => {
  it('uses the canonical English reagent name and only an exact Korean common name', () => {
    expect(formatReagentName(REAGENT_BY_ID.get('reagent-marigold')!)).toBe('Marigold (금잔화)');
    expect(formatReagentName(REAGENT_BY_ID.get('reagent-lavender')!)).toBe('Lavender');
  });

  it('normalizes legacy Korean and English names to one prepared-item label', () => {
    expect(formatReagentItemName('금잔화/메리골드 (꽃잎)', 'reagent-marigold')).toBe('Marigold (금잔화) — 꽃잎');
    expect(formatReagentItemName('Marigold (Nectar, Added)', 'reagent-marigold')).toBe('Marigold (금잔화) — 꽃꿀 · 넣어 사용');
  });

  it('groups different parts of the same reagent without making them look duplicated', () => {
    expect(groupReagentPartNames([
      'Marigold (Nectar, Added)',
      '금잔화/메리골드 (꽃잎)',
      'Beehive (Honey)'
    ])).toEqual([
      'Marigold (금잔화) — 꽃꿀 · 넣어 사용 / 꽃잎',
      'Beehive (벌집) — 꿀'
    ]);
  });

  it('reports the acquisition delta and the post-acquisition total', () => {
    expect(gatheredReagentSummary(
      [{ name: 'Marigold (Petals, Ground)', canonicalReagentId: 'reagent-marigold', quantity: 2 }],
      [
        { name: 'Marigold (Petals, Ground)', canonicalReagentId: 'reagent-marigold', quantity: 2 },
        { name: '금잔화/메리골드 (꽃꿀)', canonicalReagentId: 'reagent-marigold', quantity: 1 }
      ]
    )).toBe('Marigold (금잔화) — 꽃잎 · 갈음 +2 · 현재 3개');
  });

  it('keeps both English and exact Korean names searchable', () => {
    const searchable = reagentInventorySearchText({ name: '금잔화/메리골드 (꽃잎)', canonicalReagentId: 'reagent-marigold' });
    expect(searchable).toContain('marigold');
    expect(searchable).toContain('금잔화');
  });
});
