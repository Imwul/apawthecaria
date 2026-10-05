import { describe, expect, it } from 'vitest';
import { RULE_TAG_LABELS_KO, formatRuleTag, getTagTooltip, localizeRuleTag } from './ruleTagsKo';
import { RULE_TAGS } from '../rules/tags';

describe('canonical English game labels', () => {
  it('covers every canonical tag while retaining its searchable English identifier', () => {
    expect(Object.keys(RULE_TAG_LABELS_KO).sort()).toEqual([...RULE_TAGS].sort());
    expect(formatRuleTag('PAIN')).toBe('PAIN');
    expect(localizeRuleTag('UNKNOWN')).toBe('UNKNOWN');
  });
  it('distinguishes normal maximum potency from FAIR/FOUL addition and cancellation', () => {
    expect(getTagTooltip('PAIN')).toContain('가장 높은 값');
    expect(getTagTooltip('FAIR')).toContain('합산');
    expect(getTagTooltip('FOUL')).toContain('상쇄');
  });
});
