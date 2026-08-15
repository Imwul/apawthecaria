import generatedTranslations from './printedEffectKo.generated.json';
import { PRINTED_EFFECT_REGISTRY } from '../rules/printedEffects';
import { localizeRegionLabel, localizeSeasonLabel } from './gameplayKo';

const MUSHROOM_PICKERS_TEXT = `약용 버섯이 아닌 것은 확실하지만, 위험한 버섯일까요?

풋내기 - 의견을 묻자 어깨를 으쓱합니다. 풋내기 채집꾼은 태연하게 버섯을 입에 넣습니다. 카드를 한 장 뽑습니다.
♥ - 맛있는 간식입니다. 버섯 하나를 나눠 받아 맛있는 장신구 1개를 얻습니다.
♦, ♣ 또는 ♣ - 이런, 완전히 속았네요! 잠시 뒤 풋내기 채집꾼은 심하게 앓습니다. 그 실수에서 교훈을 얻습니다.

숙련자 - 정중히 끼어들어 버섯이 다른 채집물에 닿지 않게 집으로 가져가 확인하자고 제안합니다. 숙련자 채집꾼은 현명하다는 듯 고개를 끄덕입니다. 길드 명성 1을 얻습니다.`;

const exactTranslations: Record<string, string> = {
  'Any Season': '모든 계절',
  Duty: '의무',
  Repellent: '퇴치',
  'Region: Forest': '지역: 숲',
  Shortcut: '지름길',
  Trapped: '갇힘',
  'Junior - When asked your opinion, you shrug.': '풋내기 - 의견을 묻자 어깨를 으쓱합니다.',
  'Shortly after, the junior picker is violently sick.': '잠시 뒤 풋내기 채집꾼은 심하게 앓습니다.',
  "The Junior picker nonchalantly stuffs it in their maw; draw a card: ♥ - It's a tasty snack; they share one with you, Gain a tasty Trinket.": '풋내기 채집꾼이 태연하게 버섯을 입에 넣습니다. 카드를 뽑아 ♥가 나오면 맛있는 간식을 나눠 받고 장신구 1개를 얻습니다.',
  "The Junior picker nonchalantly stuffs it in their maw; 카드를 뽑습니다: ♥ - It's a tasty snack; they share one with you, Gain a tasty 장신구.": '풋내기 채집꾼이 태연하게 버섯을 입에 넣습니다. 카드를 뽑아 ♥가 나오면 맛있는 간식을 나눠 받고 장신구 1개를 얻습니다.',
  'Gain 1 Reputation.': '길드 명성 1을 얻습니다.'
};

const optionTranslations: Record<string, string> = {
  Duty: '의무',
  Junior: '풋내기 (젊은 채집꾼)',
  Repellent: '퇴치',
  Senior: '숙련자 (숙련된 채집꾼)',
  Shortcut: '지름길',
  Trapped: '갇힘'
};

const generatedTranslationMap = generatedTranslations as Record<string, string>;
const protectedRuleNames = [...new Set(PRINTED_EFFECT_REGISTRY.map(effect => effect.ownerName))]
  .filter(Boolean)
  .sort((left, right) => right.length - left.length);

const genericPhraseTranslations: Record<string, string> = {
  'The Right Thing To Do': '옳은 일 하기',
  'Horrors From The Deep': '깊은 곳에서 온 공포',
  'Fur and Feathered Fools': '털과 깃털의 고생',
  'A Sign To Nowhere': '아무 데도 향하지 않는 표지판',
  'Catch of the Day': '오늘의 수확',
  'Coldblooded Bliss': '냉혈동물의 행복',
  'Hedgerow Wandering': '생울타리 둘러보기',
  'Mother \'o Fruits': '열매의 어머니',
  'Going For Broke': '승부 걸기',
  'Stitcher\'s Care': '바느질꾼의 돌봄',
  'Spill The Beans': '모두 털어놓기',
  'Bleated Wisdom': '염소의 지혜',
  'Friendly Natter': '정겨운 수다',
  'Friend for the road': '길 위의 동행',
  'Pounder\'s Take': '약제사의 몫',
  'Fetch The Oil': '기름 가져오기',
  'Run & Hide': '달아나 숨기',
  'Snatch and Go': '낚아채기',
  'Take Shelter': '몸을 숨기기',
  'Tick Bitten, Twice Shy': '진드기에 물리고 더욱 조심하기',
  'Fur and Feathered': '털과 깃털',
  'Choppy Waters': '거친 물결',
  'Fixer Upper': '수리하기',
  'Grabby Paws': '욕심 많은 발',
  'Greased Paws': '기름칠한 발',
  'Helping Paw': '돕는 발',
  'Sick Tadpoles': '아픈 올챙이',
  'Ship-to-Ship': '선박 간 이동',
  'Whirling Rods': '휘도는 막대',
  'Beaver Builders': '비버 건축가들',
  'Warf Rats': '부두 쥐떼',
  'Mind Yerself': '조심하세요',
  'The Right Thing': '옳은 일',
  'Blood to blood': '피에는 피',
  'Creep Away': '살금살금 벗어나기',
  'Early Bird': '부지런한 새',
  'Frigid Gusts': '차가운 돌풍',
  'Give Chase': '뒤쫓기',
  'Go Panning': '사금 채취하기',
  'Harsh Wind': '매서운 바람',
  'Lucky Break': '뜻밖의 행운',
  'New Verse': '새 소절',
  'Nut Hunt': '견과 찾기',
  'Old Verse': '오래된 소절',
  Outmanoeuvre: '기동으로 따돌리기',
  'Picked Clean': '말끔히 뜯김',
  'Push On': '계속 나아가기',
  'Soft Song': '부드러운 노래',
  'Spook Flock': '무리를 놀라게 하기',
  'Sugar Rush': '당 충전',
  'Tall Tale': '허풍',
  'Tick Check': '진드기 확인',
  'Washed Away': '휩쓸려 감',
  'Well Fed': '든든히 먹음',
  Woolworks: '양모 작업',
  'A Giant Help': '큰 도움',
  'Crunchy Treat': '바삭한 간식',
  'Fumble on': '더듬어 나아가기',
  'Get High': '높은 곳으로',
  'In Bloom': '꽃이 한창',
  'Paws In': '발을 담그기',
  'Hot Toddy': '따뜻한 토디차',
  Lockdown: '봉쇄',
  Communal: '공동체',
  Canteen: '구내식당',
  Cull: '솎아내기',
  Dodge: '피하기',
  Eavesdrop: '엿듣기',
  Flapaway: '날아 벗어나기',
  Flee: '도망치기',
  Munched: '뜯어 먹힘',
  Obstruction: '장애물',
  Offcuts: '자투리',
  Panning: '사금 채취',
  Parley: '협상',
  Rush: '서두르기',
  Sauna: '한증욕',
  Scurry: '재빨리 달리기',
  Slowfall: '천천히 낙하',
  Tadpediatrician: '올챙이 소아과의',
  Duty: '의무',
  Repellent: '퇴치',
  Shortcut: '지름길',
  Trapped: '갇힘',
  Junior: '풋내기',
  Senior: '숙련자'
};

const polishGenericRuleTerms = (text: string, names: string[] = protectedRuleNames): string => {
  const protectedNames = names.filter(name => text.includes(name));
  let polished = protectedNames.reduce((current, name, index) => current.replaceAll(name, `\uE000${index}\uE001`), text);
  polished = Object.entries(genericPhraseTranslations)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((current, [source, translated]) => current.replaceAll(source, translated), polished);
  polished = polished
    .replace(/\bMark (\d+) Days?\b/g, '$1일 소모')
    .replace(/\bMove On\b/g, '다음 장소로 이동')
    .replace(/\bBase Rarity\b/g, '기본 희귀도')
    .replace(/\bRarity\b/g, '희귀도')
    .replace(/\bBehemoth\b/g, '거수')
    .replace(/\bBarrow\b/g, '고분')
    .replace(/\bUpstanding\b/g, '신망 있음')
    .replace(/\bTowering\b/g, '거대한')
    .replace(/\bMany\b/g, '다수의')
    .replace(/\bnon-Loch\b|비Loch/g, 'non-Loch');
  return protectedNames.reduce((current, name, index) => current.replaceAll(`\uE000${index}\uE001`, name), polished);
};
const normalizeTranslationKey = (text: string): string => text
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^[.,;:]\s+/, '');

const hashTranslationKey = (text: string): string => {
  const normalized = normalizeTranslationKey(text);
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const localizeManualEffectValue = (text: string): string => {
  const compact = text.trim();
  const translated = exactTranslations[compact] || generatedTranslationMap[hashTranslationKey(compact)];
  return translated ? polishGenericRuleTerms(translated) : text;
};

export const localizeManualEffectText = (summary: string, text: string): string => {
  if (summary === 'Mushroom Pickers') return MUSHROOM_PICKERS_TEXT;
  const compact = text.trim();
  const directTranslation = exactTranslations[compact] || generatedTranslationMap[hashTranslationKey(compact)];
  if (directTranslation) return polishGenericRuleTerms(directTranslation, summary ? [summary] : []);
  const blocks = text.split(/(\n\s*\n)/);
  const localized = blocks.map(block => {
    if (/^\n\s*\n$/.test(block)) return block;
    const normalized = block.trim();
    const translation = exactTranslations[normalized] || generatedTranslationMap[hashTranslationKey(normalized)];
    return translation ? polishGenericRuleTerms(translation, summary ? [summary] : []) : block;
  });
  return localized.some((block, index) => block !== blocks[index]) ? localized.join('') : text;
};

export const localizeManualEffectLine = (text: string): string => {
  const compact = text.trim();
  const region = compact.match(/^Region:\s*(.+)$/i);
  if (region) return `지역: ${localizeRegionLabel(region[1])}`;
  const season = compact.match(/^Season:\s*(.+)$/i);
  if (season) return `계절: ${localizeSeasonLabel(season[1])}`;
  const translated = localizeManualEffectValue(compact);
  if (translated !== compact) return translated;
  return text;
};

export const localizeManualJournalTitle = (text: string): string => {
  const match = text.match(/^((?:판정 대기|여정 조우|채집 조우):\s*)(.+)$/);
  if (!match) return text;
  const effect = PRINTED_EFFECT_REGISTRY.find(row => match[2] === row.ownerName || match[2].startsWith(`${row.ownerName} `));
  return effect ? `${match[1]}${effect.ownerName}` : text;
};

export const localizeManualJournalText = (text: string): string => text
  .split(/(\n\s*\n)/)
  .map(block => {
    if (/^\n\s*\n$/.test(block)) return block;
    const pagePrefix = block.match(/^(\[p\.\d+\]\s*)([\s\S]+)$/);
    if (pagePrefix) return `${pagePrefix[1]}${localizeManualEffectValue(pagePrefix[2])}`;
    return localizeManualEffectValue(block);
  })
  .join('');

export const localizeManualEffectOption = (option: string): string =>
  optionTranslations[option] || localizeManualEffectValue(option).replace(/\s+or\s+/gi, ' 또는 ');

export const localizeManualEffectTrigger = (trigger: string): string => ({
  encounter: '조우',
  diagnosis: '진단',
  'timer-change': '타이머 변화',
  barter: '물꼬 거래',
  'treatment-success': '치료 성공',
  'treatment-failure': '치료 실패',
  leave: '환자 떠남',
  'service-follow-up': '서비스 후속 처리'
} as Record<string, string>)[trigger] || trigger;
