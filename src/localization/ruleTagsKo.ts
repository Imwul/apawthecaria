import type { RuleTag } from '../rules/types';

export const RULE_TAG_LABELS_KO: Record<RuleTag, string> = {
  ELSEWHERE: '이계', INSTINCT: '본능', JOY: '기쁨', MOOD: '기분', NERVES: '신경',
  INFECTION: '감염', PAIN: '통증', PARASITE: '기생충', SENSES: '감각', SLEEP: '수면',
  BREATH: '호흡', BURN: '화상', FEATHER: '깃털', FUR: '털', HIDE: '피부',
  POISON: '독', SCALE: '비늘', STOMACH: '위장', TEMPERATURE: '체온', WOUND: '상처',
  FAIR: '좋은 성질', FOUL: '불쾌한 성질'
};

/** Display translations never replace the canonical identifiers used by engines. */
export const localizeRuleTag = (tag: string): string => RULE_TAG_LABELS_KO[tag as RuleTag] || tag;
export const formatRuleTag = (tag: string): string => {
  const label = localizeRuleTag(tag);
  return label === tag ? tag : `${label} (${tag})`;
};
export const getTagTooltip = (tag: string): string => ['FAIR', 'FOUL'].includes(tag)
  ? `${formatRuleTag(tag)}: 재료별 값을 합산하고 좋은 성질과 불쾌한 성질을 서로 상쇄합니다.`
  : `${formatRuleTag(tag)}: 숫자는 약효의 세기입니다. 같은 태그의 일반 약효는 합산하지 않고 가장 높은 값만 사용합니다.`;
