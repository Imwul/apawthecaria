import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RULE_TAGS } from './rules/tags';
import { RULE_TAG_PALETTES, ruleTagPalette, splitRuleTagText, englishRuleTagText } from './ruleTagPresentation';
import { RuleTagText } from './components/RuleTag';

const luminance = (hex: string) => {
  const channels = hex.slice(1).match(/../g)!.map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
};

describe('game tag reading', () => {
  it('keeps all 22 canonical labels readable on their own colored paper', () => {
    expect(Object.keys(RULE_TAG_PALETTES).sort()).toEqual([...RULE_TAGS].sort());
    for (const tag of RULE_TAGS) {
      const { bg, text } = ruleTagPalette(tag);
      expect((luminance(bg) + .05) / (luminance(text) + .05), tag).toBeGreaterThanOrEqual(4.5);
    }
    expect(new Set(Object.values(RULE_TAG_PALETTES).map(palette => palette.bg)).size).toBe(22);
  });
  it('uses exact canonical identities and keeps unknown labels neutral', () => {
    expect(ruleTagPalette('parasites')).toEqual(ruleTagPalette('PARASITE'));
    expect(ruleTagPalette('PAINT')).not.toEqual(ruleTagPalette('PAIN'));
    expect(splitRuleTagText('PAINT 2')).toEqual([{ text: 'PAINT 2' }]);
  });
  it('cleans known legacy bilingual tag fields without changing surrounding words', () => {
    expect(englishRuleTagText('통증 (PAIN) 2 OR WOUND · 상처 1')).toBe('PAIN 2 OR WOUND 1');
    expect(englishRuleTagText('통증에 관한 나의 기억')).toBe('통증에 관한 나의 기억');
  });
  it('retains alternative recipes, separate doses and minimum FAIR rather than merging requirements', () => {
    const recipe = '(INFECTION 3 + INFECTION 2) OR (PAIN 2 + MINIMUM FAIR 3)';
    const parts = splitRuleTagText(recipe);
    expect(parts.filter(part => 'tag' in part)).toEqual([
      { tag: 'INFECTION', value: '3', minimum: false },
      { tag: 'INFECTION', value: '2', minimum: false },
      { tag: 'PAIN', value: '2', minimum: false },
      { tag: 'FAIR', value: '3', minimum: true }
    ]);
    expect(parts.filter(part => 'text' in part).map(part => part.text).join('')).toBe('( + ) OR ( + )');
    const html = renderToStaticMarkup(<RuleTagText text={recipe} />);
    expect(html.replace(/<[^>]*>/g, '')).toBe('(INFECTION 3 + INFECTION 2) OR (PAIN 2 + FAIR ≥ 3)');
    expect(html).not.toContain('통증 (PAIN)');
  });
  it('keeps the numerical progress attached to the label in comparisons', () => {
    const html = renderToStaticMarkup(<RuleTagText text="PAIN 0/2 · FAIR 3/3" />);
    expect(html.replace(/<[^>]*>/g, '')).toBe('PAIN 0/2 · FAIR 3/3');
    expect(html).toContain('data-rule-tag="FAIR"');
  });
});
