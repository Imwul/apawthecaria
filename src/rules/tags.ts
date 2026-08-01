import { canonicalMetadata } from './source';
import type { RuleTag, TagDefinition } from './types';

const REMEDY_TAGS: readonly RuleTag[] = [
  'ELSEWHERE', 'INSTINCT', 'JOY', 'MOOD', 'NERVES', 'INFECTION', 'PAIN',
  'PARASITE', 'SENSES', 'SLEEP', 'BREATH', 'BURN', 'FEATHER', 'FUR',
  'HIDE', 'POISON', 'SCALE', 'STOMACH', 'TEMPERATURE', 'WOUND'
];

export const TAG_DEFINITIONS: readonly TagDefinition[] = [
  ...REMEDY_TAGS.map(id => ({
    id,
    category: 'remedy' as const,
    stacks: false,
    ...canonicalMetadata(27)
  })),
  ...(['FAIR', 'FOUL'] as const).map(id => ({
    id,
    category: 'trade' as const,
    stacks: true,
    ...canonicalMetadata(27)
  }))
];

export const RULE_TAGS: readonly RuleTag[] = TAG_DEFINITIONS.map(tag => tag.id);
export const TAG_BY_ID = new Map(TAG_DEFINITIONS.map(tag => [tag.id, tag]));

const TAG_ALIASES: Record<string, RuleTag> = {
  ELSWHERE: 'ELSEWHERE',
  INSTINCTS: 'INSTINCT',
  PARASITES: 'PARASITE',
  SCALES: 'SCALE'
};

export const normalizeRuleTag = (value: string): RuleTag | null => {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z]/g, '');
  const candidate = TAG_ALIASES[normalized] || normalized;
  return RULE_TAGS.includes(candidate as RuleTag) ? candidate as RuleTag : null;
};

export const isRuleTag = (value: string): value is RuleTag => normalizeRuleTag(value) !== null;
