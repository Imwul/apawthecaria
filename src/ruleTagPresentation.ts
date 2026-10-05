import { RULE_TAGS, normalizeRuleTag } from './rules/tags';
import type { RuleTag } from './rules/types';
import { RULE_TAG_LABELS_KO } from './localization/ruleTagsKo';
import { TAG_READING_KO } from './localization/tagReadingKo';

interface TagPalette { bg: string; text: string; border: string }

// Keep the familiar tag hues, with darker ink for readable small game labels.
export const RULE_TAG_PALETTES: Record<RuleTag, TagPalette> = {
  PAIN: { bg: '#fff0f0', text: '#9f272f', border: '#fcc8c8' },
  WOUND: { bg: '#fff5f0', text: '#a03822', border: '#ffd2c4' },
  INFECTION: { bg: '#f2f9f3', text: '#29663b', border: '#cce6d2' },
  PARASITE: { bg: '#fbf5eb', text: '#7a4a24', border: '#e8dbcd' },
  SENSES: { bg: '#f5f0ff', text: '#633596', border: '#e3d2fd' },
  SLEEP: { bg: '#f0f4ff', text: '#30559e', border: '#d0ddfc' },
  BREATH: { bg: '#f0f9ff', text: '#195d8b', border: '#cce9fc' },
  BURN: { bg: '#fffdf0', text: '#7a5900', border: '#fcf2c4' },
  FUR: { bg: '#faf6f0', text: '#66503c', border: '#e6dec8' },
  FEATHER: { bg: '#f0fbfb', text: '#17676b', border: '#cceeee' },
  HIDE: { bg: '#fbf6f2', text: '#794726', border: '#ebd8cc' },
  SCALE: { bg: '#f0fbf7', text: '#126c51', border: '#ccf0e4' },
  POISON: { bg: '#fdf0ff', text: '#89308d', border: '#fcd0fc' },
  STOMACH: { bg: '#fafdf0', text: '#536a12', border: '#edf7cc' },
  TEMPERATURE: { bg: '#fff0df', text: '#994305', border: '#f9c48c' },
  JOY: { bg: '#fff9e6', text: '#795500', border: '#ffeebf' },
  MOOD: { bg: '#fdf6f7', text: '#97384d', border: '#f7d2d8' },
  INSTINCT: { bg: '#f7f6f5', text: '#514942', border: '#ded9d5' },
  ELSEWHERE: { bg: '#f0fdf4', text: '#216837', border: '#ccf5d9' },
  NERVES: { bg: '#f9f6ff', text: '#572698', border: '#dec9ff' },
  FAIR: { bg: '#fff5ce', text: '#6f5814', border: '#e7d282' },
  FOUL: { bg: '#f3eaf8', text: '#694b7c', border: '#d6c0e1' }
};

export const ruleTagPalette = (tag: string): TagPalette => {
  const canonical = normalizeRuleTag(tag);
  return canonical ? RULE_TAG_PALETTES[canonical] : { bg: '#f5f5ef', text: '#55574a', border: '#d6d8ce' };
};

/** Only tag fields use this; player-written memories are never rewritten. */
export function englishRuleTagText(text: string): string {
  let result = text;
  for (const tag of RULE_TAGS) {
    for (const label of new Set([RULE_TAG_LABELS_KO[tag], TAG_READING_KO[tag]])) {
      result = result.replaceAll(`${label} (${tag})`, tag).replaceAll(`${tag} · ${label}`, tag);
    }
  }
  return result;
}

export type TagTextPart = { text: string } | { tag: RuleTag; value?: string; minimum: boolean };
export function splitRuleTagText(text: string): TagTextPart[] {
  const input = englishRuleTagText(text);
  const matcher = new RegExp(`\\b(MINIMUM\\s+)?(${RULE_TAGS.join('|')})\\b(?:[ \\t]+([+-]?\\d+(?:/\\d+)?))?`, 'g');
  const parts: TagTextPart[] = [];
  let cursor = 0;
  for (const match of input.matchAll(matcher)) {
    if (match.index > cursor) parts.push({ text: input.slice(cursor, match.index) });
    parts.push({ tag: match[2] as RuleTag, value: match[3], minimum: Boolean(match[1]) });
    cursor = match.index + match[0].length;
  }
  if (cursor < input.length) parts.push({ text: input.slice(cursor) });
  return parts;
}
