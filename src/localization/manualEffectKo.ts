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
  'Gain 1 Reputation.': '길드 명성 1을 얻습니다.',
  'A grouchy meadow hare comes bounding over to you, yelling "watch yer paws"! They explain that the peat bog is a delicate ecosystem. Though... you aren\'t walking on any peat right now. Despite this, they draw in deep breath as if to give a lecture. Listen & Learn - Unfortunately, once the hare gets started they cannot be stopped. Decrease Timers by 4. However, from now on everytime you Forage in a Bog, gain 1 Foraging Point. Interrupt - Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.': '심술궂은 초원 토끼가 뛰어오며 "발 조심해!" 하고 소리칩니다. 이탄 습지는 섬세한 생태계라고 설명하지만… 당신은 지금 이탄 위를 걷고 있지 않습니다. 그래도 토끼는 강의를 시작하려는 듯 깊게 숨을 들이쉽니다. 듣고 배우기 - 한 번 시작하면 멈추지 않습니다. 타이머를 4 줄입니다. 대신 앞으로 습지에서 채집할 때마다 채집 포인트 1을 얻습니다. 끼어들기 - 무례했다고 소문내어 길드 명성 1을 잃습니다.',
  'Wayfinders have made a new route. Draw a Path from this Location to an unconnected nearby Location. New Path - Record a Path from this Location to an unconnected nearby Location.': '길잡이들이 새 길을 냈습니다. 이 위치에서 아직 이어지지 않은 가까운 위치까지 경로를 그립니다. 새 길 - 이 위치에서 아직 이어지지 않은 가까운 위치까지 경로를 기록합니다.',
  'Something slithers beneath the water. Draw and resolve the suit result. Deep Water - Draw a card and apply the printed suit result on p166.': '물 아래에서 무언가가 미끄러집니다. 카드를 뽑아 문양 결과를 해결합니다. 깊은 물 - 카드를 뽑아 166쪽의 인쇄된 문양 결과를 적용합니다.',
  'Music carries across the meadow as another beast sings. Listen - Journal about the melody and the singer.': '초원 너머로 다른 짐승의 노랫소리가 들려옵니다. 듣기 - 선율과 노래하는 이에 대해 일지를 적습니다.',
  'A Titan plaque stands off the path. Read It - Journal about why it is here and what it says.': '길 옆에 타이탄 명판이 서 있습니다. 읽어 보기 - 왜 여기 있는지, 무엇이 적혀 있는지 일지를 적습니다.',
  'Adventurous beasts have left markings on the wall warning others of the dangers within. You may ignore the negative effects of an event in this Location. Graffiti - If you\'ve already had a negative effect from an event in this Location, you can make warning marks of your own. Gain 1 Reputation. Heed The Warning - Ignore the negative effects of an event in this Location.': '모험심 많은 짐승들이 안의 위험을 알리는 표시를 벽에 남겼습니다. 이 위치에서 일어나는 사건의 부정적 효과를 무시할 수 있습니다. 낙서 - 이미 이 위치의 사건으로 부정적 효과를 겪었다면 당신도 경고 표시를 남길 수 있습니다. 길드 명성 1을 얻습니다. 경고를 따르기 - 이 위치에서 일어나는 사건의 부정적 효과를 무시합니다.',
  'While beasts may shun the Titan ruins, insects of all kinds can be found thriving in the forgotten shadows and lost places. Stunned - Some near dead insects can be found laying around a pillar. Gain a Beetle, Honey Bee, Butterfly, or Wasp Reagent Part. Burrowed - Some insects can be dug out from inside ancient wood structures. Gain a Maggot, Slug, or Spider Reagent Part.': '짐승들은 타이탄 유적을 피하지만, 잊힌 그늘과 잃어버린 장소에는 온갖 곤충이 번성합니다. 기절한 곤충 - 기둥 주위에 거의 죽은 곤충이 있습니다. 딱정벌레, 꿀벌, 나비, 말벌 부위 하나를 얻습니다. 파묻힌 곤충 - 고대 나무 구조 안에서 파낼 수 있습니다. 구더기, 민달팽이, 거미 부위 하나를 얻습니다.',
  'You hear the faint call of a beast from within a strange Titan construct. Open Says Me! - If you have a Titan Thingamabob, you may use it to activate the device and release the beast. Rescue - Draw a card: hearts or diamonds get the beast out, decrease the Timer by 1 and gain 2 Reputation; clubs or spades are a complication. Helping Hand - If you have come across Bakar in this ruin, you can get him to break the Titan construct open.': '이상한 타이탄 장치 안에서 희미한 짐승의 부름이 들립니다. 열려라! - 타이탄 물건이 있으면 장치를 작동시켜 짐승을 풀어줄 수 있습니다. 구조 - 카드를 뽑습니다. 하트나 다이아면 구해내고 타이머를 1 줄이며 명성 2를 얻습니다. 클럽이나 스페이드면 문제가 생깁니다. 돕는 손 - 이 유적에서 바카르를 만났다면 타이탄 장치를 부수게 할 수 있습니다.',
  'You meet Bakar the Gorilla reading Titan words. Chat - Bakar tells you what he knows about the Titans. Reunion - Whenever you repeat this event in a new Titan Location, Bakar will have pieced together more of the mystery. Discovery - Once you have been to every Titan Location and get this event again, Bakar announces his departure.': '타이탄 글자를 읽고 있는 고릴라 바카르를 만납니다. 이야기 - 바카르가 타이탄에 대해 아는 것을 들려줍니다. 재회 - 새로운 타이탄 위치에서 이 사건을 다시 만나면 수수께끼를 조금 더 맞춰 둡니다. 발견 - 모든 타이탄 위치를 다녀온 뒤 다시 이 사건을 만나면 바카르가 떠남을 알립니다.',
  'New Path': '새 길',
  'Deep Water': '깊은 물',
  Listen: '듣기',
  'Read It': '읽어 보기',
  Graffiti: '낙서',
  'Heed The Warning': '경고를 따르기',
  Stunned: '기절한 곤충',
  Burrowed: '파묻힌 곤충',
  'Open Says Me!': '열려라!',
  Rescue: '구조',
  'Helping Hand': '돕는 손',
  Chat: '이야기',
  Reunion: '재회',
  Discovery: '발견',
  'Gain a Beetle, Honey Bee, Butterfly, or Wasp Reagent Part.': '딱정벌레, 꿀벌, 나비, 말벌 부위 하나를 얻습니다.',
  'Graffiti - If you\'ve already had a negative effect from an event in this Location, you can make warning marks of your own.': '낙서 - 이미 이 위치의 사건으로 부정적 효과를 겪었다면 당신도 경고 표시를 남길 수 있습니다.',
  'Deep Water - Draw a card and apply the printed suit result on p166.': '깊은 물 - 카드를 뽑아 166쪽의 인쇄된 문양 결과를 적용합니다.',
  '- If you have a Titan Thingamabob, you may use it to activate the device and release the beast.': '- 타이탄 물건이 있으면 장치를 작동시켜 짐승을 풀어줄 수 있습니다.',
  'Helping Hand - If you have come across Bakar in this ruin, you can get him to break the Titan construct open.': '돕는 손 - 이 유적에서 바카르를 만났다면 타이탄 장치를 부수게 할 수 있습니다.',
  'Rescue - Draw a card: hearts or diamonds get the beast out, decrease the Timer by 1 and gain 2 Reputation; clubs or spades are a complication.': '구조 - 카드를 뽑습니다. 하트나 다이아면 구해내고 타이머를 1 줄이며 명성 2를 얻습니다. 클럽이나 스페이드면 문제가 생깁니다.'
};

const optionTranslations: Record<string, string> = {
  Duty: '의무',
  Junior: '풋내기 (젊은 채집꾼)',
  Repellent: '퇴치',
  Senior: '숙련자 (숙련된 채집꾼)',
  Shortcut: '지름길',
  Trapped: '갇힘',
  'New Path': '새 길',
  'Deep Water': '깊은 물',
  Listen: '듣기',
  'Read It': '읽어 보기',
  Graffiti: '낙서',
  'Heed The Warning': '경고를 따르기',
  Stunned: '기절한 곤충',
  Burrowed: '파묻힌 곤충',
  'Open Says Me!': '열려라!',
  Rescue: '구조',
  'Helping Hand': '돕는 손',
  Chat: '이야기',
  Reunion: '재회',
  Discovery: '발견'
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
    .replace(/\bSoar\b/g, '활공')
    .replace(/\bBehemoth\b/g, '거수')
    .replace(/\bBarrow\b/g, '고분')
    .replace(/\bUpstanding\b/g, '신망 있음')
    .replace(/\bTowering\b/g, '거대한')
    .replace(/\bMany\b/g, '다수의')
    .replace(/\bnon-Loch\b|비Loch/g, '호수가 아닌')
    .replace(/\bForest\b/g, '숲')
    .replace(/\bMeadow\b/g, '초원')
    .replace(/\bLoch\b/g, '호수')
    .replace(/\bBog\b/g, '늪지')
    .replace(/\bMountain\b/g, '산맥');
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
