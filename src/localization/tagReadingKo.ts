import type { RuleTag } from '../rules/types';

/** Display-only glossary from p.27/102; English tokens remain the rule keys. */
export const TAG_READING_KO: Record<RuleTag, string> = {
  ELSEWHERE: '추모', INSTINCT: '본능', JOY: '기쁨', MOOD: '감정', NERVES: '긴장',
  INFECTION: '감염', PAIN: '통증', PARASITE: '기생충', SENSES: '감각', SLEEP: '수면',
  BREATH: '호흡', BURN: '화상', FEATHER: '깃털', FUR: '털', HIDE: '피부', POISON: '해독',
  SCALE: '비늘', STOMACH: '소화', TEMPERATURE: '체온', WOUND: '상처', FAIR: '호평', FOUL: '악평'
};
export { formatRuleTag } from './ruleTagsKo';
