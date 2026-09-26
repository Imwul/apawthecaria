import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID, REAGENTS } from './rules/data/reagents';
import { RULE_TAGS } from './rules/tags';
import { formatRuleTag, TAG_READING_KO } from './localization/tagReadingKo';
import {
  formatReagentItemName,
  formatReagentName,
  formatReagentPartChoice,
  gatheredReagentSummary,
  groupReagentPartNames,
  reagentInventorySearchText,
  splitForagingTags
} from './foragingInventoryPresentation';

describe('foraging and inventory presentation', () => {
  it('explains every canonical tag in Korean while retaining the rule token', () => {
    expect(Object.keys(TAG_READING_KO).sort()).toEqual([...RULE_TAGS].sort());
    for (const tag of RULE_TAGS) {
      expect(formatRuleTag(tag)).toMatch(/[가-힣]/);
      expect(formatRuleTag(tag)).toContain(tag);
    }
    expect(formatRuleTag('사용자 태그')).toBe('사용자 태그');
  });

  it('pairs every canonical name with a Korean reading label without changing the data', () => {
    expect(formatReagentName(REAGENT_BY_ID.get('reagent-marigold')!)).toBe('Marigold (금잔화)');
    expect(formatReagentName(REAGENT_BY_ID.get('reagent-lavender')!)).toBe('Lavender (라벤더)');
    for (const reagent of REAGENTS) {
      expect(formatReagentName(reagent)).toMatch(/[가-힣]/);
      expect(formatReagentName(reagent)).toContain(reagent.canonicalName);
    }
  });

  it('normalizes legacy Korean and English names to one prepared-item label', () => {
    expect(formatReagentItemName('금잔화/메리골드 (꽃잎)', 'reagent-marigold')).toBe('Marigold (금잔화) — Petals (꽃잎)');
    expect(formatReagentItemName('Marigold (Nectar, Added)', 'reagent-marigold')).toBe('Marigold (금잔화) — Nectar (꽃꿀) · 넣어 사용');
  });

  it('shows every part’s preparation, potency and uses before a service selection', () => {
    for (const reagent of REAGENTS) for (const part of reagent.preparations) {
      const label = formatReagentPartChoice(part);
      expect(label).toContain(part.name);
      expect(label).toContain(`${part.uses}회분`);
      for (const tag of part.tags) {
        expect(label).toContain(tag.tag);
        expect(label).toContain(` ${tag.value}`);
      }
    }
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
