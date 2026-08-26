import generatedTranslations from './printedEffectKo.generated.json';
import { PRINTED_EFFECT_REGISTRY } from '../rules/printedEffects';
import { ENCOUNTERS } from '../rules/data/encounters';
import { localizeRegionLabel, localizeSeasonLabel } from './gameplayKo';
import {
  normalizeCanonicalGuildReputationTerms,
  normalizeGuildReputationTerms
} from './guildReputation';
import { ENCOUNTER_TITLE_KO } from './encounterTitleKo';
import {
  ENCOUNTER_OPENING_FORAGING_KO,
  ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX
} from './encounterOpeningForagingKo';
import {
  ENCOUNTER_OPENING_SOCIAL_KO,
  ENCOUNTER_OPENING_SOCIAL_PROMPT_PREFIX
} from './encounterOpeningSocialKo';
import {
  ENCOUNTER_OPENING_TRAVEL_KO,
  ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX
} from './encounterOpeningTravelKo';
import {
  ENCOUNTER_REVIEW_CHOICE_KO,
  ENCOUNTER_REVIEW_CONTEXT_KO
} from './encounterReviewKo';

const MUSHROOM_PICKERS_TEXT = `버섯 하나를 두고 먹어도 되는지 다투는 채집꾼 둘과 마주칩니다. 약용 버섯이 아닌 것은 분명하지만, 위험한 버섯일까요?

풋내기에게 맡기기 — 의견을 묻자 어깨를 으쓱합니다. 풋내기는 태연히 버섯을 입에 넣습니다. 카드를 뽑으세요.
♥ — 맛있는 간식입니다. 버섯을 나눠 받아 먹을 수 있는 장신구 1개를 얻습니다.
♦·♣·♣ (룰북 표기) — 버섯에 속았습니다. 풋내기는 곧 심하게 앓고, 당신은 그 실수에서 교훈을 얻습니다.

숙련자에게 맡기기 — 버섯이 다른 채집물에 닿지 않게 따로 집으로 가져가 확인하자고 정중히 제안합니다. 숙련자는 현명하다는 듯 고개를 끄덕이고, 길드 명성 1을 얻습니다.`;

const HIGHWAY_ROBBERY_CONTEXT = '장난감 검을 든 어린 들쥐가 길을 막고 서서, 장난스럽게 통행세를 내라고 요구합니다.';
const HIGHWAY_ROBBERY_POCKETS = '장신구로 내기 — 장신구 1개를 잃습니다. 갑자기 전리품을 얻은 들쥐 아이는 어떤 반응을 보이나요?';
const HIGHWAY_ROBBERY_DUEL = '결투로 대신하기 — 달력에 1일을 표시합니다. 들쥐 아이와 모의 결투를 벌이고, 둘 중 누가 누구를 ‘쓰러뜨렸는지’ 일지에 기록하세요.';
const HIGHWAY_ROBBERY_PASS = '그냥 지나치기 — 아이를 성급히 지나쳐 여정을 계속합니다. 길드 명성 1을 잃습니다.';
const FRESH_CATCH_CONTEXT = '선착장을 지나던 중, 갓 손질한 생선 냄새와 부지런히 일한 야수들의 땀 냄새가 풍깁니다. 오늘의 어획물이 배에서 부두로 옮겨지고, 흔들리는 배가 부교를 규칙적으로 두드립니다. 오늘은 무엇을 잡았을까요? 오늘의 어획물 중 특히 눈길이 가는 것은 무엇인가요?';
const DAM_LOTTA_TROUBLE_CONTEXT = '그들은 자신의 일에 대해 어떻게 생각하나요? 건축업자들은 어떤 이야기를 들려주나요?';
const DAM_LOTTA_TROUBLE_EFFECT = `${DAM_LOTTA_TROUBLE_CONTEXT} 현재 위치를 비버 댐으로 표시하고 지역을 호수로 바꾸세요. 겨울이 끝나면 댐이 무너져 이 위치는 다시 숲 지역이 됩니다.`;
const PROJECT_LAUNCH_CONTEXT = '각지에서 온 야수들이 현지 장인발 길드원의 최신 발명품 공개를 보려고 모였습니다. 이 발명품은 무슨 용도인가요? 제대로 작동하나요? 작동하지 않는다면 어떤 대형 사고가 벌어지나요?';
const PROJECT_LAUNCH_WATCH = '공개 지켜보기 — 모든 타이머를 2 줄입니다. ‘길드 소문’(무게 없음) 하나를 가방에 넣습니다. 이 소문을 아무 정착지에나 가져가면 길드 명성 2를 얻습니다.';
const PROJECT_LAUNCH_KEEP_CLEAR = '몸을 사리기 — 발명가들의 소동에 끼어들지 않고 채집을 계속합니다.';
const PROJECT_LAUNCH_EFFECT = `${PROJECT_LAUNCH_CONTEXT}\n\n${PROJECT_LAUNCH_WATCH}\n\n${PROJECT_LAUNCH_KEEP_CLEAR}`;
const FLOOD_CONTEXT = '녹은 눈과 얼음으로 이곳의 물이 불어나 길과 굴이 모두 잠겼습니다. 홍수로 큰 피해를 입은 야수가 있나요? 현지 야수들은 이 변화에 어떻게 적응했나요?';
const FLOOD_PAWS_IN = '발 벗고 돕기 — 모든 타이머를 2 줄이고 길드 명성 1을 얻습니다.';
const FLOOD_MOVE_ON = '어깨를 으쓱하고 지나가기 — 길드 명성 1을 잃습니다.';
const FLOOD_EFFECT = `${FLOOD_CONTEXT}\n\n${FLOOD_PAWS_IN}\n\n${FLOOD_MOVE_ON}`;
const SOCIAL_CONTEXT_KO: Record<string, string> = {
  Preserved: '늪지 야수들은 “늪이 받은 것은 늪이 돌려준다”는 말을 자주 합니다. 오래전부터 갓 자른 이탄에 봉헌물을 묻었고, 제대로 보관된 물건은 좀처럼 낡지 않습니다.',
  Airborne: '멀리서 커다란 윙윙거림이 빠르게 다가옵니다. 몸을 돌려 소리를 찾자, 무언가가 눈앞을 스치기 직전에야 정체가 보입니다.',
  Florist: '탁한 회색 화분들이 진흙에 반쯤 잠긴 채 야생화로 뒤덮인 나무 오두막을 둘러싸고 있습니다. 이곳의 향기는 푸르고 생생합니다.',
  Bridges: '서로 맞닿을 듯 자란 나뭇가지들을 숲의 야수들이 밧줄 다리로 잇습니다. 정착지가 커질수록 다리도 가지 사이로 계속 뻗어 나갑니다.',
  'Orebeater Forges': 'Odoak의 굵은 뿌리 아래, 돌 아치로 보강한 대장간에서 오소리 광석장이들이 달아오른 금속을 두드립니다.',
  Nursery: '부두에서 둑 위로 올라가면 지붕이 열린 커다란 점토 건물 ‘화분들’이 나옵니다. 농부들은 소나무·참나무·버드나무를 비롯한 여러 묘목을 돌봅니다.',
  Exterior: '거대한 베슬 바깥에는 부교와 선상 가옥, 비좁은 모임터가 빽빽한 판자촌 ‘막대기들’이 펼쳐져 있습니다.',
  Monuments: '초원 정착지는 자연 지형에 기대어 오래 자리를 지키기 때문에, 마을 곳곳의 높고 낮은 자리에는 작은 기념물과 표식이 남아 있습니다.',
  Junction: '두 개 이상의 터널이 만나는 교차로마다 위·아래·앞으로 가려는 야수들이 한데 몰려 북적입니다.',
  'Getting Around': '산악 정착지의 집들은 멀리 떨어져 고립되어 보이지만, 절벽의 새집과 천연 동굴의 모자이크 출입구가 저마다의 생활 공간으로 이어집니다.',
  Thinkers: 'Spoolkeep 북쪽의 높은 산에는 거대한 염소 철학자들이 삽니다. 이들은 돌 원에 모여 세상의 법칙을 두고 우렁차게 논쟁합니다.'
};

const ENCOUNTER_OPENING_KO: Record<string, string> = {
  ...ENCOUNTER_OPENING_TRAVEL_KO,
  ...ENCOUNTER_OPENING_FORAGING_KO,
  ...ENCOUNTER_OPENING_SOCIAL_KO
};

const ENCOUNTER_OPENING_PROMPT_PREFIX: Record<string, string> = {
  ...ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX,
  ...ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX,
  ...ENCOUNTER_OPENING_SOCIAL_PROMPT_PREFIX
};

// A few printed rows continue their scene for one more sentence after the
// title/prompt column boundary. These reviewed lines sit between the restored
// opening and the first choice. Keeping them explicit avoids repeating the
// absorbed title text from a generated full-prompt translation.
const ENCOUNTER_OPENING_REMAINDER_KO: Record<string, string> = {
  'social-bog-settlement-♦': '이 말은 옛날 야수들이 갓 자른 이탄에 봉헌물을 묻던 풍습을 뜻합니다. 제대로 보관하면 어떤 물건이든 세월의 흔적이 멎습니다.',
  'social-bog-summer-♠': '잠시 멈춰 햇볕을 즐기고 몸을 늘어뜨릴까요?',
  'social-loch-newdam-♦': '농부들은 소나무·참나무·버드나무를 비롯한 여러 묘목을 돌봅니다.',
  'social-glasswall-♦': '그들은 금속 톱니바퀴와 걸쭉한 진홍색 꿀단지를 나누며 정답게 이야기하고 있습니다.',
  'foraging-bog-9-spring': '그 야수는 자신을 이탄 잠수부라고 소개하며, 늪 아래의 보물을 찾는 중이라고 합니다. 왜 아무도 이 질척한 탐사에 함께하려 하지 않았을까요?',
  'foraging-loch-8': '두꺼비들은 떠난 벗에 대해 무슨 이야기를 나눌까요? 어느 기사단에 속했고, 어떤 기록을 지켰을까요?',
  'foraging-meadow-j-autumn': '이 기묘한 장치는 무엇이며, 원래는 무슨 용도였을까요?',
  'foraging-meadow-m-summer': '그대로 두면 둘 중 하나는 다른 하나를 확실히 죽일 것입니다. 싸우는 이유를 알 수 있나요? 어느 쪽이 우세해 보이나요?',
  'foraging-mountain-9-autumn': '다른 감각에 집중하면 풍경은 어떻게 달라지나요?',
  'foraging-mountain-10-summer': '이렇게 외진 곳에서 장사하는 이유는 무엇일까요?'
};

// The generated translation is useful as a compatibility fallback, but a
// handful of dense printed rows lose their meaning when translated one clause
// at a time. These are reviewed against the complete rulebook row so the scene
// a player reads is natural Korean rather than a stitched OCR draft.
const REVIEWED_ENCOUNTER_CONTEXT_KO: Record<string, string> = {
  'foraging-bog-m-winter': '커다란 왜가리가 급강하자 간신히 몸을 숨길 틈을 찾습니다. 왜가리는 날개로 그늘을 드리우며 비웃고 조롱합니다. 발톱잡이일까요, 산적일까요? 무엇을 원하는 걸까요?',
  'travel-soar-m-spring': '거대한 도시와 산이 작은 점처럼 보일 만큼 높은 곳에서 세상을 내려다보면 어떤 기분인가요?',
  'travel-soar-m-summer': '거대한 도시와 산이 작은 점처럼 보일 만큼 높은 곳에서 세상을 내려다보면 어떤 기분인가요?',
  'foraging-bog-m-autumn': '거대한 사슴이 느리지만 성난 발걸음으로 안개 속을 헤치며 나타납니다. 사슴은 왜 이렇게 흥분했고, 당신이 찾는 영약재를 지키고 있는 것일까요?',
  'foraging-bog-10-winter': '얼어붙은 늪지와 차가운 바람이 채집을 힘겹게 만듭니다. 이런 날씨에도 긍정적인 마음을 유지하기 위해 어떤 작은 기쁨을 찾나요?',
  'foraging-forest-8': '숲길에서 수상한 흔적을 발견합니다. 이 흔적을 남긴 야수는 무엇을 찾고 있을까요?',
  'foraging-forest-j-autumn': '숲속에서 여러 야수가 한데 모여 경쟁을 벌이고 있습니다. 주변의 분위기는 어떤가요?',
  'foraging-forest-j-winter': '숲속 오두막의 문을 두드리자 안에서 물음이 들려옵니다. 누가 살고 있으며, 어떻게 당신을 맞이하나요?',
  'foraging-forest-m-spring': '숲 속에서 거대한 곰을 마주칩니다. 이 곰의 이름은 무엇인가요?',
  'foraging-meadow-10-winter': '소리 없이 쌓인 눈이 초원을 덮어 살아남은 식물마저 감춥니다. 앞발이 저릴 만큼 추운데 벌써 어두워집니다.',
  'foraging-meadow-j-spring': '초원의 풀숲 사이에서 새로운 흔적을 발견합니다. 이곳에서 무슨 일이 벌어진 것일까요?',
  'foraging-mountain-10-autumn': '산등성이 너머에서 피가 식는 듯한 늑대 울음이 길게 울려 퍼집니다.',
  'travel-bog-m-autumn': '길가 모닥불 가까이에서 무장한 강혈단 용병들이 지도와 일지를 대조하고 있습니다. 이들은 낙인이나 처형을 위해 도망자를 추적하는 듯합니다. 누구를 쫓고 있으며, 그 야수는 어떤 죄를 뒤집어썼나요? 여정 중 이에 관한 소문을 들은 적이 있나요?',
  'travel-bog-m-winter': '길가 모닥불 가까이에서 무장한 강혈단 용병들이 지도와 일지를 대조하고 있습니다. 이들은 낙인이나 처형을 위해 도망자를 추적하는 듯합니다. 누구를 쫓고 있으며, 그 야수는 어떤 죄를 뒤집어썼나요? 여정 중 이에 관한 소문을 들은 적이 있나요?',
  'travel-loch-3-4': '물속에서 무언가의 끝자락이 몸을 스칩니다. 카드를 한 장 뽑아 아래에 무엇이 숨어 있는지 확인하세요. J 또는 M이면 티탄의 난파선입니다. 어떤 모습이며, 티탄은 이것을 무엇에 썼을까요? A–10이면 덩굴이나 수초, 모래톱 같은 자연 지형입니다. 이곳에 어떻게 생겼을까요?',
  'travel-meadow-5-6': '돌을 다듬는 소리가 초원 멀리까지 울려 퍼집니다. 가까이 다가가자 반쯤 완성된 건축물이 보입니다. 어떤 티탄 유적에서 영감을 받은 건축물인가요?',
  'travel-mountain-9-10-summer': '산길 모퉁이를 돌기도 전에 흥얼거림이 들려옵니다. 소리의 주인은 티탄의 행방을 추적하는 거대한 고릴라 바카르입니다. 바카르를 전에 만난 적이 있나요? 잠시 멈춰 이야기를 들으면, 따뜻한 바위 그늘에 앉아 티탄 구조물의 스케치가 가득한 일지를 보여 줍니다.',
  'travel-soar-9-10-summer': '바다 독수리의 추격을 따돌려야 합니다. 카드를 한 장 더 뽑고 문양에 따른 결과를 적용하세요.',
  'travel-soar-9-10-autumn': '바다 독수리의 추격을 따돌려야 합니다. 카드를 한 장 더 뽑고 문양에 따른 결과를 적용하세요.',
  'travel-soar-9-10-winter': '바다 독수리의 추격을 따돌려야 합니다. 카드를 한 장 더 뽑고 문양에 따른 결과를 적용하세요.',
  'travel-soar-j-summer': '햇살이 낮게 깔린 구름 사이에서 안개 자락을 하늘로 끌어올립니다. 거대한 회색 구름마다 해동을 맞은 땅 위로 소나기를 쏟아부을 듯 움직입니다. 선택한 목적지에서 활공을 마치세요. 방수 가방이 없다면 가방이 물에 젖습니다.',
  'travel-soar-m-winter': '빙하가 날개를 두드리고 진눈이 옷과 털 사이로 스며듭니다. 선택한 목적지에서 활공을 마치세요. 방수 가방이 없다면 가방이 물에 젖고, 비행 뒤 몸을 녹이느라 다음 타이머를 2 줄입니다.',
  'foraging-mountain-m-winter': '가까운 동굴에서 낮고 묵직한 신음이 들립니다. 안에는 지칠 대로 지친 곰 영주가 누워 있으며, 검은 혈관처럼 보이는 심한 감염이 앞발에서 팔꿈치까지 퍼져 있습니다. 곰은 간절한 눈빛으로 도움을 청합니다. 원한다면 [INFECTION 3], [INFECTION 3], [PAIN 2], 타이머 8인 질환을 시작하세요.',
  'foraging-titan-5': '모든 것이 고요합니다. 너무 고요합니다. 뒤를 돌아보자 유적 너머에서 기묘한 ‘고양이 아닌 것’이 바라보고 있습니다. 눈에는 빨간 빛이 맥박처럼 울리고, 누렇게 변한 금속 이를 드러낸 입은 끊임없이 웃고 있습니다. 본능이 그 존재가 당신을 먹이로 본다고 경고합니다.',
  'social-bog-settlement-♥': '굵고 싱싱한 갈대 다발이 푸른 창처럼 땅 위로 솟아 있습니다. 그중 한 다발이 휘청이더니 갈대가 한 줄기씩 쓰러집니다. 물길을 막을 만큼 자란 갈대를 현지 야수가 베어 내고 있습니다. 갈대엮이 길드원들은 이를 물에 불려 부드럽게 만든 뒤, 무늬·바구니·어항·접이식 사다리로 엮습니다. 지금 만들고 있는 것은 무엇일까요?',
  'social-loch-vessel-♥': '베슬의 티탄 거주실은 흰 자기로 마감한 입구와 금속 터널로 서로 이어져 있습니다. 돌쌓이 길드원들은 이 통로가 예전에 티탄의 음식을 방마다 옮겨 주었을 것이라고 추측하지만, 대부분은 잘 정비된 길로만 볼 뿐입니다.',
  'social-mountain-summer-♣': '낮게 울리는 진동이 발밑의 흙과 바위를 뒤흔듭니다. 광석장이 길드원들이 거대한 돌바퀴로 철광석을 잘게 부수고, 눈썰미 빠른 견습생들은 붉은 녹색을 띠는 광석만 골라 엮은 채반에 모으고 있습니다.'
};

type ReviewedEncounterChoice = { encounterId: string; choiceId: string; text: string };

const REVIEWED_ENCOUNTER_CHOICES: ReviewedEncounterChoice[] = [
  { encounterId: 'travel-bog-3-4', choiceId: 'trade-spare-material', text: '여분 재료 — 장신구 1개를 거래해 일반 또는 희귀 늪지 영약재 하나를 얻습니다.' },
  { encounterId: 'travel-mountain-9-10-summer', choiceId: 'stop-for-a-tale', text: '이야기 듣기 — 바카르가 따뜻한 바위 그늘에서 티탄 구조물 그림이 든 수첩을 보여 줍니다. 달력에 1일을 표시하고 ‘티탄 이야기’(무게 없음)를 가방에 넣습니다. 흥정할 때 버리면 영약재 부위 하나를 자동으로 얻습니다.' },
  { encounterId: 'travel-titan-5-6', choiceId: 'well-fed', text: '든든한 한 끼 — 다음 타이머에 2를 더합니다.' },
  { encounterId: 'foraging-meadow-10-winter', choiceId: 'hot-toddy', text: '따뜻한 토디차 — 텐트가 있다면 채집하는 동안 몸을 피할 야영지를 차리고 따뜻한 음료를 끓입니다. 모든 타이머를 1 줄입니다. 같은 질환을 치료하는 동안 이 사건을 다시 만나면 토디차에 관해 일지에 기록하세요.' },
  { encounterId: 'foraging-titan-8', choiceId: 'careful', text: '조심히 탐색하기 — 티탄의 함정을 자주 살피느라 각 조우가 끝날 때마다 타이머를 추가로 1 줄입니다.' },
  { encounterId: 'foraging-titan-8', choiceId: 'quick', text: '서둘러 탐색하기 — 위험을 무릎쓰고 빠르게 움직입니다. 각 조우가 끝날 때마다 카드를 뽑으세요. ♣ 또는 ♠이면 위험한 장치를 건드려 고통이 온몸을 관통합니다. 상처를 돌보기 위해 이 위치를 떠나 채집을 끝냅니다.' },
  { encounterId: 'social-loch-autumn-♣', choiceId: 'working-for-a-snack', text: '간식값 하기 — “조개를 깰 힘은 있지만 등에 난 종기에는 손이 안 닿아. 종기를 터뜨려 주면 싱싱한 조개를 줄게!” 잠시 도와 원하는 타이머를 1 줄이고 Fresh Clams(싱싱한 조개, 무게 2/3)를 가방에 넣습니다. 물물교환할 때 장신구 3개와 같은 가치이며, 다음에 달력에 1일을 표시하면 상합니다.' },
  { encounterId: 'travel-loch-m-spring', choiceId: 'choppy-waters', text: '거친 물결 — 큰 배가 만든 파도에 휘말려 따라갑니다. 카드를 뽑으세요.\nJ 또는 M — 배가 원하는 방향으로 갑니다. 경로 1개를 이동하거나 제자리에 머물러도 됩니다.\n2–10 — 배가 육지로 향합니다. 가장 가까운 해안 쪽으로 경로 1개를 이동하세요.\nA — 배가 바로 이쪽으로 다가옵니다. 충돌해 전복되며, 방수 가방이 없다면 가방이 물에 젖습니다.' },
  { encounterId: 'travel-mountain-j-spring', choiceId: 'quest', text: '원정 시작하기! — 현재 여정을 포기하고 같은 계절에 특별 원정을 시작합니다. 무작위 방향으로 경로 24개 떨어진 곳을 목적지로 정하고 긴급도는 중요함(9일)으로 설정하세요. 목적지에는 거수 고분을 표시하고, 이 여정에서 만나는 질환은 원정대 야수들과 연결합니다.\n기한 안에 도착 — 카드 1장을 뽑고 해결하지 못한 질환마다 최종 값을 2 낮춥니다. 7 이상이면 거수를 쓰러뜨리고, 7 미만이면 거수가 이깁니다.\n기한을 넘김 — 거수는 자취를 감추고 원정대는 당신 없이 떠납니다.\n여정 종료 — 성공적으로 해결한 질환마다 Guild Reputation 1을 얻습니다. 거수를 쓰러뜨렸다면 장신구 10개와 원하는 Tool 하나를 얻습니다.' },
  { encounterId: 'travel-mountain-j-spring', choiceId: 'decline-quest', text: '원정 사양하기 — 현재 여정을 유지하고 원정대가 당신 없이 길을 계속하도록 둡니다.' },
  { encounterId: 'travel-titan-a-2', choiceId: 'what-a-wind-up', text: '성질 고약한 기계장치 — 성질 고약한 기계장치 길동무를 얻습니다.' },
  { encounterId: 'foraging-bog-2', choiceId: 'dig', text: '파헤치기! — 모든 타이머를 1 줄이고 카드를 뽑습니다. 카드 값이 10 이상이면 Titan Thingamabob(티탄 장치) 하나를 얻습니다. 10 미만이면 물건이 진흙 아래로 가라앉아 아무것도 얻지 못합니다.' },
  { encounterId: 'foraging-bog-9-spring', choiceId: 'assistant', text: '보조하기 — 이탄 잠수부가 질식할 듯한 진흙 아래를 탐사하도록 호흡 장치의 풀무를 밟습니다. 모든 타이머를 2 줄이고 장신구 1개를 얻습니다. 돕든 지나치든 이 신생 ‘1인 길드’와의 인연으로 Guild Reputation 1을 얻습니다.' },
  { encounterId: 'foraging-bog-9-spring', choiceId: 'keep-moving', text: '돕지 않고 계속 — 탐사에는 참여하지 않지만, 새로 생긴 ‘1인 길드’와의 인연은 남아 Guild Reputation 1을 얻습니다.' },
  { encounterId: 'foraging-bog-10-spring', choiceId: 'sail', text: '항해하기 — 나무껍질 배가 있다면 불어난 물을 타고 벗어날 수 있습니다. 카드를 뽑으세요.\n♥ 또는 ♦ — 인접한 위치로 탈출합니다. 가장 아찔했던 순간은 언제였나요?\n♣ 또는 ♠ — 배가 전복됩니다. 안전한 땅으로 헤엄쳐 나오며 타이머를 1 줄입니다.' },
  { encounterId: 'foraging-forest-9-winter', choiceId: 'dodge', text: '피하기 — 카드를 뽑습니다.\n♥·♦·♣ — 탁 피해 빠져나갑니다.\n♠ — 고드름에 베어 [WOUND 2]를 즉시 치료해야 합니다. 바로 치료할 수 없다면 가장 가까운 정착지까지의 경로 1개마다 모든 타이머를 1씩 줄이고, 그곳의 바느질꾼에게 치료받으세요.' },
  { encounterId: 'foraging-titan-2', choiceId: 'look-around', text: '둘러보기 — 이번 채집 중 이후 J 또는 M을 뽑으면 Reagent 대신 티탄 문양이 적힌 물건을 찾을 수 있습니다. 문양을 찾은 뒤에만 문을 열 수 있습니다. 유적을 묘사한 방식에 따라 Titan Codex(티탄 기록서, 무게 1)를 얻어 여정 끝에 Knowers 길드와 장신구 20개에 교환하거나, 이 위치에 Clinic을 세우고 자격이 없는 새 Service 하나를 Agenda에 더합니다.' },
  { encounterId: 'foraging-titan-6', choiceId: 'light', text: '빛 — 티탄 장치를 홈에 넣습니다. 다음 장소로 이동할 때까지, 이 위치에서 조우를 마칠 때마다 채집 포인트 3을 얻습니다.' },
  { encounterId: 'foraging-titan-6', choiceId: 'cameras', text: '미래의 환영 — 티탄 장치를 홈에 넣습니다. 다음 장소로 이동할 때까지 조우 카드 하나를 한 번 다시 뽑을 수 있습니다.' },
  { encounterId: 'foraging-titan-6', choiceId: 'action', text: '장치 작동 — 티탄 장치를 홈에 넣습니다. 유적 안에서 무언가가 움직이며, 원하는 티탄 영약재 하나가 드러납니다.' },
  { encounterId: 'social-bog-noonhill-♥', choiceId: 'fleeing-thickblood', text: '말벌에게 쫓기는 용병 — 말벌 떼에 쫓기는 강혈단 용병이 어디로 피신하는지 떠올려 보세요.' },
  { encounterId: 'social-forest-summer-♠', choiceId: 'wheee', text: '휘이잉! — 장인발 길드원 하나가 나선형으로 날아오르다 집나무 옆면에 부딪힙니다. 얼마나 아래로 떨어졌나요? 장치는 충돌 뒤에도 멀쩡한가요?' },
  { encounterId: 'social-forest-autumn-♠', choiceId: 'check-for-rot', text: '썩은 곳 살피기 — 약제사로서 곰팡이를 잘 알고 있습니다. 집나무에서 위험하거나 독이 있는 버섯을 찾는 현지 작업반을 어떻게 도왔는지 일지에 기록하세요.' },
  { encounterId: 'social-loch-spring-♣', choiceId: 'depthdivers', text: '물밑잠수 길드 — 이 길드에는 수달·물찌기새·영원·개구리가 많습니다. 강바닥과 호수 밑을 수색하며 무엇을 찾았을까요?' },
  { encounterId: 'social-meadow-summer-♠', choiceId: 'stitcher-s-care', text: '바느질꾼의 돌봄 — 바느질꾼 길드는 약제사 길드와 가까운 일을 합니다. 약제사가 습포제와 약초 치료제를 만들 때, 이들은 수술을 위해 야수의 몸과 내부 구조를 연구하고 기록합니다. 바느질꾼들을 어떻게 생각하나요? 야수 의료에서 이들은 어떤 역할을 할까요?' },
  { encounterId: 'social-mountain-summer-♣', choiceId: 'talents-of-all-sizes', text: '모든 크기의 재능 — 대부분은 광석장이 길드를 Odoak의 뿌리 아래서 처음 세운 오소리들을 떠올립니다. 지금은 구리발톱·은주둥이·백랍발 등 여러 소부 직종에 온갖 야수가 일합니다. 오늘은 어떤 야수가 보이나요? 그들은 타고난 재능을 일에 어떻게 쓰고 있나요?' }
];

const exactTranslations: Record<string, string> = {
  'Little wagons laden with foods and goods are backed up along the path; a fallen tree blocks the road while beavers gnaw it clear. If you have a Wagon, mark 1 Day on the Calendar while stuck in traffic. Without a Wagon, slip through and scramble over the trunk with a friendly boost from the beavers.': '음식과 물건을 가득 실은 작은 마차들이 길을 따라 늘어서 있습니다. 쓰러진 나무가 앞길을 막아 비버들이 갉아 내는 중입니다. Wagon과 함께라면 교통이 풀릴 때까지 기다리며 달력에 1일을 표시합니다. Wagon 없이 이동 중이라면 마차 사이를 빠져나와 비버의 도움으로 나무줄기를 넘습니다.',
  'If you have a Wagon, mark 1 Day on the Calendar while stuck in traffic.': 'Wagon과 함께라면 교통이 풀릴 때까지 기다리며 달력에 1일을 표시합니다.',
  'A massive heron swoops down at you, giving you just enough time to take cover. It laughs and taunts as it raises its wings to put you in shade. It seems like it might be a clawlicker or a bandit. What do they want?': '커다란 왜가리가 급강하자 간신히 몸을 숨길 틈을 찾습니다. 왜가리는 날개로 그늘을 드리우며 비웃고 조롱합니다. 발톱잡이일까요, 산적일까요? 무엇을 원하는 걸까요?',
  'Go Fish': '낚시하기',
  'Fish Some More': '조금 더 낚시하기',
  "They wave you over and say you can use one of their empty stools that are perched around a fishing-hole. They don't say much, but the advice they give is invaluable. What special patches do they have on their fishing jacket? Go Fish - Decrease Timers by 1. Gain all the Parts of a Small Fish. Fish Some More - Decrease Timers by 1 and Draw a Card: ♥ or ♦ - Gain all parts from a Small Fish ♣ - Gain all parts from a Big Fish ♠ - You don't catch anything.": '낚시꾼이 얼음 구멍 둘레의 빈 의자를 써도 된다고 손짓합니다. 말수는 적지만 조언은 아주 유용합니다. 낚시 재킷에는 어떤 특별한 천 조각이 붙어 있나요?\n\n낚시하기 — 타이머를 1 줄이고 작은 물고기의 모든 부위를 얻습니다.\n\n조금 더 낚시하기 — 타이머를 1 줄이고 카드를 뽑습니다.\n♥ 또는 ♦ — 작은 물고기의 모든 부위를 얻습니다.\n♣ — 큰 물고기의 모든 부위를 얻습니다.\n♠ — 아무것도 잡지 못합니다.',
  "They wave you over and say you can use one of their empty stools that are perched around a fishing-hole. They don't say much, but the advice they give is invaluable. What special patches do they have on their fishing jacket?": '낚시꾼이 얼음 구멍 둘레의 빈 의자를 써도 된다고 손짓합니다. 말수는 적지만 조언은 아주 유용합니다. 낚시 재킷에는 어떤 특별한 천 조각이 붙어 있나요?',
  'Go Fish - Decrease Timers by 1.': '낚시하기 — 타이머를 1 줄입니다.',
  'Fish Some More - Decrease Timers by 1 and Draw a Card: ♥ or ♦ - Gain all parts from a Small Fish ♣ - Gain all parts from a Big Fish ♠ - You don\'t catch anything.': '조금 더 낚시하기 — 타이머를 1 줄이고 카드를 뽑습니다.\n♥ 또는 ♦ — 작은 물고기의 모든 부위를 얻습니다.\n♣ — 큰 물고기의 모든 부위를 얻습니다.\n♠ — 아무것도 잡지 못합니다.',
  'Any Season': '모든 계절',
  'Project Launch': '새 발명품 공개',
  'Watch the Unveiling': '공개 지켜보기',
  'Keep Your Head Down': '몸을 사리기',
  'Paws In': '발 벗고 돕기',
  'Shrug and move on': '어깨를 으쓱하고 지나가기',
  'Dam Lotta Trouble': '댐 때문에 골치 아파',
  'Pay with your pockets — Lose 1 Trinket. How does the mouse pup react to their sudden bounty': HIGHWAY_ROBBERY_POCKETS,
  "Pay with your life — Mark 1 Day on your Calendar. Journal about a mock fight you have with the pup, and how one of you 'slays' the other": HIGHWAY_ROBBERY_DUEL,
  'Pay with your patience — Storming past the pup, you continue your journey. Lose 1 Reputation.': HIGHWAY_ROBBERY_PASS,
  'Pay with your (short) patience — Storming past the pup, you continue your journey. Lose 1 Reputation.': HIGHWAY_ROBBERY_PASS,
  'Friend In Need': '도움이 필요한 동료',
  'Rest Stop': '길가의 쉼터',
  'To Glide, or not to Glide': '활공할까, 말까',
  'Alluring Odours': '매혹적인 향기',
  'Awkward Small Talk': '어색한 잡담',
  'New Plans': '새로운 계획',
  ". Naturally, pulley lifts are a common feature in most settlements. Awkward Small Talk - You find yourself scampering for an available lift, and a local holds it until you leap aboard. Journal about your experience aboard the lift, out of breath and assailed with polite questions about your day.": '도르래식 승강기는 대부분의 정착지에서 흔히 볼 수 있습니다. 어색한 잡담 — 이용 가능한 승강기를 찾아 달려가자 현지 야수가 당신이 올라탈 때까지 붙잡아 줍니다. 숨이 찬 채 승강기에 올라 오늘 하루에 관한 공손한 질문을 연달아 받습니다. 그 경험을 일지에 기록하세요.',
  "Naturally, pulley lifts are a common feature in most settlements. Awkward Small Talk - You find yourself scampering for an available lift, and a local holds it until you leap aboard. Journal about your experience aboard the lift, out of breath and assailed with polite questions about your day.": '도르래식 승강기는 대부분의 정착지에서 흔히 볼 수 있습니다. 어색한 잡담 — 이용 가능한 승강기를 찾아 달려가자 현지 야수가 당신이 올라탈 때까지 붙잡아 줍니다. 숨이 찬 채 승강기에 올라 오늘 하루에 관한 공손한 질문을 연달아 받습니다. 그 경험을 일지에 기록하세요.',
  "Wheee! — One Craftpaw manages to swirl into a curving flight, up until they slam into the side of the hometree. How far do they fall? Does their contraption survive the crash?": '휘이잉! — 장인발 길드원 하나가 나선형으로 날아오르다 집나무 옆면에 부딪힙니다. 얼마나 아래로 떨어졌나요? 장치는 충돌 뒤에도 멀쩡한가요?',
  "Slowfall — A shadow passes over you, large and round. Its owner is a Craftpaw testing a device they call a 'fall protector'. Its a wide, thin sack that fills with air and slows their descent through the air. Do they get caught in the hometree's branches, or get enveloped by their falling parachute?": '느린 낙하 — 크고 둥근 그림자가 머리 위를 지납니다. 주인은 ‘낙하 보호 장치’를 시험하는 장인발 길드원입니다. 공기로 부풀어 낙하 속도를 늦추는 넓고 얇은 자루입니다. 집나무 가지에 걸렸나요, 아니면 떨어지는 낙하산에 휘감겼나요?',
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
  'Draw a card and decrease all Timers by 1. If your result was 7 or higher, gain a Reagent that can provide [Fair] and that can also be Foraged for in the Forest. If no such Reagent exists, invent a new one for your Almanack. 162': '카드를 한 장 뽑고 모든 타이머를 1만큼 줄입니다. 결과가 7 이상이면 [FAIR]를 제공하면서 숲에서 채집할 수 있는 영약재를 얻습니다. 그런 영약재가 없다면 연감에 새 영약재를 만드세요.',
  'You find yourself scampering for an available lift, and a local holds it until you leap aboard. Journal about your experience aboard the lift, out of breath and assailed with polite questions about your day.': '이용 가능한 승강기로 달려가자 현지 야수가 기다려 주어 간신히 올라탑니다. 숨을 고르는 동안 오늘 하루에 관한 공손한 질문을 받습니다. 승강기에서 나눈 어색한 대화를 일지에 기록하세요.',
  'This location has been flooded with river water from a local dam. Mark on your map that this is a Beaver Dam, and that its Region has changed Loch': '이 위치가 인근 비버 댐의 강물로 잠겼습니다. 지도에 이곳을 비버 댐으로 표시하고 지역을 호수로 바꾸세요.',
  'The dam bursts after Winter, causing this Location to return to being a Forest Region. 161': '겨울이 지난 뒤 댐이 무너집니다. 이 위치의 지역을 다시 숲으로 바꾸세요.',
  'Dam Burst - The dam bursts after Winter, causing this Location to return to being a Forest Region. 161': '겨울이 끝나면 댐이 무너져 이 위치가 다시 숲 지역이 됩니다.',
  'How do they feel about their work? What gossip have the builders got to share? Beaver Flood - This location has been flooded with river water from a local dam. Mark on your map that this is a Beaver Dam, and that its Region has changed Loch. Dam Burst - The dam bursts after Winter, causing this Location to return to being a Forest Region. 161': '그들은 자신의 일에 대해 어떻게 생각하나요? 건축업자들은 어떤 이야기를 들려주나요? 비버 댐 범람 - 이 위치가 인근 비버 댐의 강물로 잠겼습니다. 지도에 이곳을 비버 댐으로 표시하고 지역을 호수로 바꾸세요. 댐 붕괴 - 겨울이 지난 뒤 댐이 무너집니다. 이 위치의 지역을 다시 숲으로 바꾸세요. 161',
  'Draw a card and gain a Forest Reagent with Rarity equal to the card’s value. Decrease your Ailment Timer by 1': '카드를 한 장 뽑고 카드 값과 희귀도가 같은 숲 영약재 하나를 얻습니다. 질병 타이머를 1만큼 줄이세요.',
  'Decrease Guild Reputation by 1. Journal about your fellow Poulticier’s patient.': '길드 명성 1을 잃습니다. 동료 약제사의 환자에 관해 일지에 기록하세요.',
  'A grouchy meadow hare comes bounding over to you, yelling "watch yer paws"! They explain that the peat bog is a delicate ecosystem. Though... you aren\'t walking on any peat right now. Despite this, they draw in deep breath as if to give a lecture. Listen & Learn - Unfortunately, once the hare gets started they cannot be stopped. Decrease Timers by 4. However, from now on everytime you Forage in a Bog, gain 1 Foraging Point. Interrupt - Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.': '심술궂은 초원 토끼가 뛰어오며 "발 조심해!" 하고 소리칩니다. 이탄 습지는 섬세한 생태계라고 설명하지만… 당신은 지금 이탄 위를 걷고 있지 않습니다. 그래도 토끼는 강의를 시작하려는 듯 깊게 숨을 들이쉽니다. 듣고 배우기 - 한 번 시작하면 멈추지 않습니다. 타이머를 4 줄입니다. 대신 앞으로 습지에서 채집할 때마다 채집 포인트 1을 얻습니다. 끼어들기 - 무례했다고 소문내어 길드 명성 1을 잃습니다.',
  'Wayfinders have made a new route. Draw a Path from this Location to an unconnected nearby Location. New Path - Record a Path from this Location to an unconnected nearby Location.': '길잡이들이 새 길을 냈습니다. 이 위치에서 아직 이어지지 않은 가까운 위치까지 경로를 그립니다. 새 길 - 이 위치에서 아직 이어지지 않은 가까운 위치까지 경로를 기록합니다.',
  'Something slithers beneath the water. Draw and resolve the suit result. Deep Water - Draw a card and apply the printed suit result on p166.': '물 아래에서 무언가가 미끄러집니다. 카드를 뽑아 문양 결과를 해결합니다. 깊은 물 - 카드를 뽑아 166쪽의 인쇄된 문양 결과를 적용합니다.',
  'Music carries across the meadow as another beast sings. Listen - Journal about the melody and the singer.': '초원 너머로 다른 짐승의 노랫소리가 들려옵니다. 듣기 - 선율과 노래하는 이에 대해 일지를 적습니다.',
  'A Titan plaque stands off the path. Read It - Journal about why it is here and what it says.': '길 옆에 티탄 명판이 서 있습니다. 읽어 보기 - 왜 여기 있는지, 무엇이 적혀 있는지 일지를 적습니다.',
  'A Helpful Lift — You delicately ask if you could move past. Bashfully, he gathers his things, and asks where you\'re headed. Upon reply, he lifts you up a sheer cliff face - "Here, little one" his voice rumbles, "a short cut; my way of apologising!" Add 1 Day to your Calendar and continue your Journey.': '도움의 손길 — 조심스럽게 지나가도 될지 묻자, 바카르는 수줍게 짐을 챙기며 목적지를 묻습니다. 대답을 들은 그는 당신을 가파른 절벽 위로 번쩍 올려 줍니다. “자, 작은 친구. 지름길이야. 사과의 표시지!” 낮은 목소리가 울립니다. 달력에 1일을 표시하고 여정을 계속하세요.',
  'Wooden streets circle from forest floor up to canopy tops. Irresistible Bargain - A keen merchant steps out of their stall, exclaiming that you have just the thing they were hoping the find. You can choose to swap one of your non-basic Tools for any other from the Tools list. Delightful Indulgence - Journal about a new food or luxury you experience. Impulse Purchase - You\'re tempted by all manner of strange and foreign plant cuttings on display. You can buy a \'Foreign Reagent\' for 2 Trinkets (Weight 2/3) It provides [TAG 2]. You decide its Type, Tag, and Preparation Method. Journal about this Reagent’s origin.': '나무로 된 거리가 숲 바닥에서 우듬지까지 빙 둘러 이어집니다. 거절하기 힘든 거래 — 열성적인 상인이 가판대에서 달려 나와, 마침 자신이 찾던 물건을 당신이 가지고 있다고 외칩니다. 기본 도구가 아닌 도구 하나를 도구 목록의 다른 도구 하나와 교환할 수 있습니다. 기분 좋은 호사 — 처음 맛본 음식이나 누린 사치에 관해 일지를 적습니다. 충동구매 — 진열된 낯선 외지 식물의 삽수에 마음을 빼앗깁니다. 장신구 2개로 ‘외지 영약재’ 하나를 살 수 있습니다(무게 2/3). 이 영약재는 [TAG 2]를 제공합니다. 유형, 태그, 조제법을 정하고 원산지에 관해 일지를 적습니다.',
  'You see that travellers bags are being checked by local volunteers for contaminants that could spread spores to valuable goods like grain. Waved on past - If your Bags do not contain any Plant Reagent Parts from mushrooms the beast lets you continue with a friendly smile. Journal your thoughts on the effects of these searches. A Stern Lecture - If your Bags contain Plant Reagent Parts from mushrooms, the beast\'s face draws down with a grimace. Explaining their medicinal use, the beast\'s anxiety lessons, but not before they give a stern lecture about the danger that blight causes on the settlement\'s winter stores. Journal about the beast that searched your bag. Have they seen first-hand the danger that blight poses? Why did they volunteer for this role?': '현지 자원봉사자들이 여행자의 가방을 살피고 있습니다. 곡물처럼 귀중한 물자에 포자를 퍼뜨릴 수 있는 오염원을 막기 위한 검사입니다. 그냥 통과 — 가방에 버섯에서 얻은 식물성 영약재 부위가 없다면, 검사관은 친절하게 웃으며 길을 열어 줍니다. 이런 검사가 여행자와 정착지에 어떤 영향을 주는지 기록해 보세요. 엄중한 주의 — 가방에 버섯에서 얻은 식물성 영약재 부위가 있다면, 검사관은 얼굴을 찌푸립니다. 약용으로 쓴다고 설명하면 불안은 누그러지지만, 정착지의 겨울 식량에 번지는 병해의 위험에 대해 긴 주의를 듣습니다. 가방을 검사한 야수에 관해 기록해 보세요. 그 야수는 병해의 위험을 직접 본 적이 있을까요? 왜 이 일에 자원했을까요?',
  'Adventurous beasts have left markings on the wall warning others of the dangers within. You may ignore the negative effects of an event in this Location. Graffiti - If you\'ve already had a negative effect from an event in this Location, you can make warning marks of your own. Gain 1 Reputation. Heed The Warning - Ignore the negative effects of an event in this Location.': '모험심 많은 짐승들이 안의 위험을 알리는 표시를 벽에 남겼습니다. 이 위치에서 일어나는 사건의 부정적 효과를 무시할 수 있습니다. 낙서 - 이미 이 위치의 사건으로 부정적 효과를 겪었다면 당신도 경고 표시를 남길 수 있습니다. 길드 명성 1을 얻습니다. 경고를 따르기 - 이 위치에서 일어나는 사건의 부정적 효과를 무시합니다.',
  'While beasts may shun the Titan ruins, insects of all kinds can be found thriving in the forgotten shadows and lost places. Stunned - Some near dead insects can be found laying around a pillar. Gain a Beetle, Honey Bee, Butterfly, or Wasp Reagent Part. Burrowed - Some insects can be dug out from inside ancient wood structures. Gain a Maggot, Slug, or Spider Reagent Part.': '짐승들은 티탄 유적을 피하지만, 잊힌 그늘과 잃어버린 장소에는 온갖 곤충이 번성합니다. 기절한 곤충 - 기둥 주위에 거의 죽은 곤충이 있습니다. 딱정벌레, 꿀벌, 나비, 말벌 부위 하나를 얻습니다. 파묻힌 곤충 - 고대 나무 구조 안에서 파낼 수 있습니다. 구더기, 민달팽이, 거미 부위 하나를 얻습니다.',
  'You hear the faint call of a beast from within a strange Titan construct. Open Says Me! - If you have a Titan Thingamabob, you may use it to activate the device and release the beast. Rescue - Draw a card: hearts or diamonds get the beast out, decrease the Timer by 1 and gain 2 Reputation; clubs or spades are a complication. Helping Hand - If you have come across Bakar in this ruin, you can get him to break the Titan construct open.': '이상한 티탄 장치 안에서 희미한 짐승의 부름이 들립니다. 열려라! - 티탄 물건이 있으면 장치를 작동시켜 짐승을 풀어줄 수 있습니다. 구조 - 카드를 뽑습니다. 하트나 다이아면 구해내고 타이머를 1 줄이며 명성 2를 얻습니다. 클럽이나 스페이드면 문제가 생깁니다. 돕는 손 - 이 유적에서 바카르를 만났다면 티탄 장치를 부수게 할 수 있습니다.',
  'You meet Bakar the Gorilla reading Titan words. Chat - Bakar tells you what he knows about the Titans. Reunion - Whenever you repeat this event in a new Titan Location, Bakar will have pieced together more of the mystery. Discovery - Once you have been to every Titan Location and get this event again, Bakar announces his departure.': '티탄 글자를 읽고 있는 고릴라 바카르를 만납니다. 이야기 - 바카르가 티탄에 대해 아는 것을 들려줍니다. 재회 - 새로운 티탄 위치에서 이 사건을 다시 만나면 수수께끼를 조금 더 맞춰 둡니다. 발견 - 모든 티탄 위치를 다녀온 뒤 다시 이 사건을 만나면 바카르가 떠남을 알립니다.',
  'New Path': '새 길',
  'Deep Water': '깊은 물',
  Listen: '듣기',
  'Listen & Learn': '듣고 배우기',
  Interrupt: '말 끊기',
  'Waved on past': '그냥 통과',
  'A Stern Lecture': '엄중한 주의',
  'Irresistible Bargain': '거절하기 힘든 거래',
  'Delightful Indulgence': '기분 좋은 호사',
  'Count down the Items in your Bags equal to the card’s value; discard the Item you land on.': '카드 값만큼 가방의 물품 목록을 세어, 마지막으로 센 물품 하나를 버리세요.',
  'It looks like it was built quickly and abandoned just as fast. Why would someone build a tower out here? Does it bear any markings? Get A Better View - You may be able to scout the land better from up there. Draw a Card: ♥ or ♦ - It holds remarkably well, and you get a good view. Gain 3 Foraging Points ♣ or ♠ - It shifts unexpectedly and sinks further in the bog. Something falls out of your satchel and vanishes into the mud below! Count down the Items in your Bags equal to the card’s value; discard the Item you land on.': '급히 세웠다가 그만큼 급히 버려진 탑처럼 보입니다. 누가 이런 곳에 탑을 세웠을까요? 어떤 표식이 남아 있나요? 더 나은 시야 확보 - 위에서 주변을 더 잘 살필 수 있을지도 모릅니다. 카드 한 장을 뽑습니다. ♥ 또는 ♦ - 탑은 놀라울 만큼 튼튼합니다. 좋은 시야를 확보하고 채집 포인트 3을 얻습니다. ♣ 또는 ♠ - 탑이 갑자기 기울며 늪 속으로 더 가라앉습니다. 가방에서 물품 하나가 떨어져 아래 진흙 속으로 사라집니다. 카드 값만큼 가방의 물품 목록을 세어, 마지막으로 센 물품 하나를 버리세요.',
  'Get A Better View — You may be able to scout the land better from up there. Draw a Card: ♥ or ♦ - It holds remarkably well, and you get a good view. Gain 3 Foraging Points ♣ or ♠ - It shifts unexpectedly and sinks further in the bog. Something falls out of your satchel and vanishes into the mud below! Count down the Items in your Bags equal to the card’s value; discard the Item you land on.': '더 나은 시야 확보 — 위에서 주변을 더 잘 살필 수 있을지도 모릅니다. 카드 한 장을 뽑습니다.\n♥ 또는 ♦ — 탑은 놀라울 만큼 튼튼합니다. 좋은 시야를 확보하고 채집 포인트 3을 얻습니다.\n♣ 또는 ♠ — 탑이 갑자기 기울며 늪 속으로 더 가라앉습니다. 가방에서 물품 하나가 떨어져 아래 진흙 속으로 사라집니다. 카드 값만큼 가방의 물품 목록을 세어, 마지막으로 센 물품 하나를 버리세요.',
  'Lost Item — Use the value of your card to count down the list of items in your Bags; discard the item you land on.': '분실물 — 카드 값만큼 가방의 물품 목록을 세어, 마지막으로 센 물품 하나를 버리세요.',
  'Gain 3 채집 포인트 ♣ or ♠ - It shifts unexpectedly and sinks further in the bog.': '채집 포인트 3 획득 — ♥ 또는 ♦ 결과에서만 적용합니다. ♣ 또는 ♠이면 탑이 늪 속으로 더 가라앉습니다.',
  '카드를 뽑습니다: ♥ or ♦ - It holds remarkably well, and you get a good view.': '카드를 뽑습니다. ♥ 또는 ♦이면 탑이 잘 버티며 좋은 시야를 확보합니다.',
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
  '- If you have a Titan Thingamabob, you may use it to activate the device and release the beast.': '- 티탄 물건이 있으면 장치를 작동시켜 짐승을 풀어줄 수 있습니다.',
  'Helping Hand - If you have come across Bakar in this ruin, you can get him to break the Titan construct open.': '돕는 손 - 이 유적에서 바카르를 만났다면 티탄 장치를 부수게 할 수 있습니다.',
  'Rescue - Draw a card: hearts or diamonds get the beast out, decrease the Timer by 1 and gain 2 Reputation; clubs or spades are a complication.': '구조 - 카드를 뽑습니다. 하트나 다이아면 구해내고 타이머를 1 줄이며 명성 2를 얻습니다. 클럽이나 스페이드면 문제가 생깁니다.'
  ,'Collect a Plant Reagent Part that can be found in the Forest with a Base Value equal to the card’s.': '카드 값과 기본 희귀도가 같고 숲에서 발견되는 식물 영약재 부위 하나를 채집합니다.'
  ,'The Gift of Knowledge - You can draw a Sketch (Weight 1/3) of this mysterious artefact, and add it to your bags.': '지식의 선물 - 이 신비한 유물을 스케치해 스케치(무게 1/3)를 가방에 넣을 수 있습니다.'
  ,"Deliver the Parcel - Add a 'Parcel' to your Bags.": '소포 배달 - 소포를 가방에 넣습니다.'
  ,'Add a Titan Thingamabob to your Bags.': '티탄 물건 하나를 가방에 넣습니다.'
  ,"You're able to clip some samples while you help; add any Part from Stinging Nettles to your Bags.": '돕는 동안 표본을 조금 자를 수 있습니다. 쐐기풀 부위 하나를 골라 가방에 넣습니다.'
  ,'- Add a Shiny Object to your Bags.': '- 반짝이는 물건 하나를 가방에 넣습니다.'
  ,'Complete it, and add Delicious Food to your bags.': '완료하고 맛있는 음식 하나를 가방에 넣습니다.'
  ,'Add a Guild Rumour to your Bags.': '길드 소문 하나를 가방에 넣습니다.'
  ,'Take - You may add a piece of Dense Charcoal and Animal Sheddings to your Bags.': '가져가기 - 단단한 숯과 동물 허물 부위 하나씩을 가방에 넣을 수 있습니다.'
  ,'Add it to your Bags.': '그 물품을 가방에 넣습니다.'
  ,'Add Rock Salt to your Bags.': '암염을 가방에 넣습니다.'
  ,'Kite - Add a Kite to your Bags.': '연 - 연 하나를 가방에 넣습니다.'
  ,'Add a ‘Cocoon’ (Weight 1/3) to your Bags.': '고치(무게 1/3)를 가방에 넣습니다.'
  ,'Decrease any Timers by 1, and add Fresh Clams (Weight 2/3) to your Bags.': '원하는 타이머를 1 줄이고 신선한 조개(무게 2/3)를 가방에 넣습니다.'
  ,'Add them to your Bags.': '그 물품들을 가방에 넣습니다.'
  ,'For a thick coat, you may cut the fur back to increase this Ailment Timer by 2.': '털이 두껍다면 털을 잘라 이 질병 타이머를 2 늘릴 수 있습니다.'
  ,'You may decrease this Ailment Timer by 2 to help put out the fire and gain 4 Reputation.': '불을 끄는 일을 도우려면 이 질병 타이머를 2 줄이고 길드 명성 4를 얻을 수 있습니다.'
  ,'Treat three ailments and retain the seasonal map consequences.': '질병 세 개를 치료하고 계절 지도 결과를 유지합니다.'
  ,"Something falls out of a passing Noonmessenger’s satchel. Call out to the Messenger - Gain 1 Reputation. Deliver the Parcel - Add a 'Parcel' (Weight 1) to your Bags. Choose a Location 4 Paths away for its address. Gain 3 Trinkets if you go to that Location, delivering it. Keep the Parcel - Choose and Gain a Tool or Upgrade from the Almanac, and lose 1 Reputation.": '지나가던 정오 전령의 가방에서 무언가가 떨어집니다. 전령 부르기 - 길드 명성 1을 얻습니다. 소포 배달 - 소포(무게 1)를 가방에 넣고 4경로 떨어진 배달 장소를 정합니다. 그곳에 도착해 배달하면 장신구 3개를 얻습니다. 소포 갖기 - 연감에서 도구 또는 개조 하나를 골라 얻고 길드 명성 1을 잃습니다.'
  ,"Deliver the Parcel - Add a 'Parcel' (Weight 1) to your Bags.": '소포 배달 - 소포(무게 1)를 가방에 넣습니다.'
  ,'The Right Thing To Do — Leave it somewhere it can easily be found. Increase Guild Reputation by 1 80': '옳은 일 하기 — 쉽게 찾을 수 있는 곳에 두세요. 길드 명성 1을 얻습니다.'
  ,'Lessons should be learned — This beast needs to learn not to bite off more than they can chew.': '교훈을 남기기 — 이 야수도 감당하지 못할 일에 함부로 덤비면 안 된다는 것을 배워야 합니다.'
  ,'If you win — Gain 1 Trinket as a prize': '승리 — 상품으로 장신구 1개를 얻습니다.'
  ,'If you lose — Gain 1 Reputation, for being a good sport.': '패배 — 훌륭한 경기 태도를 인정받아 길드 명성 1을 얻습니다.'
  ,'Taken Prisoner — Your Journey ends here. The pirates capture you and keep you prisoner for the remainder of the Season. What do you learn about them? How do you finally get away?': '포로가 되기 — 여정이 여기서 끝납니다. 해적에게 붙잡혀 이번 계절이 끝날 때까지 포로로 지냅니다. 그들에 관해 무엇을 알게 되었나요? 마지막에는 어떻게 탈출했나요?'
  ,'If you win — Start a new Goal with the nearest City as your Destination. Gain 10 Reputation for bringing them in. Journal about why you felt the need to enforce justice': '승리 — 가장 가까운 도시를 목적지로 삼는 새 목표를 시작합니다. 이들을 붙잡아 데려가면 길드 명성 10을 얻습니다. 왜 정의를 집행해야 한다고 느꼈는지 일지에 기록하세요.'
  ,'If you lose — They escape, never to be seen by you again. 85': '패배 — 그들은 달아나고, 다시는 마주치지 못합니다.'
  ,'마차를 타고 있음 — Mark 1 Day': '마차를 타고 있음 — 달력에 1일을 표시합니다.'
  ,'Not Highest — you had fun but got knocked off. You land with a thud in the slushy snow.': '가장 높지 않음 — 즐거웠지만 결국 떨어져 질척한 눈 위에 쿵 하고 내려앉습니다.'
  ,"Stay out of it — He got himself into this situation, and he only has himself to blame. As you ride the breeze, you look back and see a rug full of glittering specks topple off of the capercaille's back. End your Soar at your chosen destination. Griph's Services as a trader are unavailable for the remainder of your Journey.": '관여하지 않기 — 그리프가 자초한 일이니 그대로 지나갑니다. 바람을 타고 멀어지며 돌아보면 반짝이는 물건이 가득한 깔개가 큰들꿩의 등에서 쏟아집니다. 선택한 목적지에서 활공을 끝냅니다. 이번 여정이 끝날 때까지 그리프와 거래할 수 없습니다.'
  ,'Ignore the distraction — You shift your eyes back towards the horizon. End your Soar at your chosen destination.': '한눈팔지 않기 — 다시 지평선을 바라봅니다. 선택한 목적지에서 활공을 끝냅니다.'
  ,'Follow the wind — rotate your Flightpath 180 degrees. End your Soar at a location up to twice as far as you originally intended to travel.': '바람을 따르기 — 비행 경로를 180도 돌립니다. 원래 가려던 거리의 최대 두 배만큼 떨어진 위치에서 활공을 끝냅니다.'
  ,'Warm Up — You have to take a moment to heat up before you go trudging on. Decrease Timer by 1.': '몸 녹이기 — 다시 길을 나서기 전에 잠시 몸을 덥힙니다. 타이머를 1만큼 줄입니다.'
  ,'If the deer has the highest card — they chase you off, stamping the ground and threatening with their antlers. You do not gather anything for this Forage, and cannot Move through or Forage here again.': '사슴의 카드가 가장 높음 — 사슴이 땅을 구르고 뿔로 위협하며 당신을 쫓아냅니다. 이번 채집에서는 아무것도 얻지 못하며, 다시 이동하기 전까지 이곳을 통과하거나 여기서 채집할 수 없습니다.'
  ,'Guild Level is Upstanding or higher — They recognise the look in your eyes, and forlornly offer you one of the dishes. If you were looking for an Insect Reagent Part, add it to your Bags.': '길드 등급이 신망 있음 이상 — 그들은 당신의 눈빛을 알아보고 침울하게 요리 하나를 내어 줍니다. 곤충 영약재 부위를 찾고 있었다면 그 부위를 가방에 넣습니다.'
  ,'Nut Hunt — Draw a card for yourself and two cards for the other of the beasts. Whoever has the single highest value card finds the most nuts. If you win, gain 1 Trinket.': '견과 찾기 — 자신을 위해 카드 1장, 다른 야수들을 위해 카드 2장을 뽑습니다. 가장 높은 값의 카드 한 장을 가진 쪽이 견과를 가장 많이 찾습니다. 이기면 장신구 1개를 얻습니다.'
  ,'Leave It — If it is really that important, someone else will get it. Continue foraging. Gain 1 Foraging Point.': '그대로 두기 — 정말 중요한 물건이라면 다른 누군가가 가져갈 것입니다. 채집을 계속하고 채집 포인트 1을 얻습니다.'
  ,'Startled — You cannot find any Big Fish or Small Fish in this Location until you next Move On 169': '놀라 달아남 — 다음 장소로 이동할 때까지 이 위치에서는 큰 물고기나 작은 물고기를 찾을 수 없습니다.'
  ,'Hot Toddy — If you have a Tent, you can set up a campsite to take refuge in as you Forage, with a pot of something warm to drink from. Decrease Timers by 1. If you draw this event again during the same Ailment, Journal about your Hot Toddy.': '따뜻한 토디차 — 텐트가 있다면 채집 중 몸을 피할 야영지를 차리고 따뜻한 음료를 끓입니다. 타이머를 1만큼 줄입니다. 같은 질병을 치료하는 동안 이 사건을 다시 뽑으면 토디차에 관해 일지에 기록하세요.'
  ,'Run & Hide — You dive for cover, only to find another beast hiding from "The Crow Scarer". What legend do they tell you of the terrifying thing out there? Decrease Timers by 1, but you may choose the Knowledge action next time you encounter this event': '달아나 숨기 — 몸을 숨긴 곳에서 ‘까마귀 허수아비’를 피해 숨어 있는 다른 야수를 만납니다. 그 야수는 바깥의 무서운 존재에 관한 어떤 전설을 들려주나요? 타이머를 1만큼 줄입니다. 다음에 이 사건을 만나면 지식 행동을 선택할 수 있습니다.'
  ,'If you win the fight — you chase them off and can take their Weapon. It has the same function as a Crossbow, but only works against Beasts, not Behemoths': '싸움에서 승리 — 상대를 쫓아내고 무기를 가져올 수 있습니다. 이 무기는 석궁과 같은 기능을 하지만 거수가 아닌 일반 야수에게만 사용할 수 있습니다.'
  ,'If you lose the fight — they kick, beat and bite you. While you shelter from their attacks, they snatch your Bags. Discard all of your Items, and lose all your Trinkets. 179': '싸움에서 패배 — 상대가 발로 차고 때리고 물어뜯습니다. 공격을 피하는 사이 가방을 빼앗깁니다. 모든 물품을 버리고 장신구를 전부 잃습니다.'
  ,'If you make it into the chamber — amongst the long deceased behemoths you find a crumbling sack of tools far too big for you to use. However, the sack also contains a number of strange devices. Gain either a Cranky Contraption Companion, a Titan Thingamabob, or a Titan Reagent of value 8 or lower.': '방 안에 들어감 — 오래전에 죽은 거수들 사이에서 너무 커서 쓸 수 없는 도구가 든 낡은 자루를 찾습니다. 그 안에는 이상한 장치도 여럿 있습니다. 괴팍한 장치 동반자, 티탄 물건, 또는 값 8 이하의 티탄 영약재 중 하나를 얻습니다.'
  ,"If your total is still lower — The Not-Cat's slaps force you into a space it can't reach. It's oddly echoing meows sound both familiar, and also like meaningless babble": '합계가 여전히 낮음 — ‘고양이 아닌 것’의 앞발질에 밀려 그 존재가 닿지 못하는 틈으로 들어갑니다. 기묘하게 울리는 울음은 익숙한 듯하면서도 의미 없는 옹알이처럼 들립니다.'
  ,"Regrowth — When they're big enough, the Guild of Loggnawers collect the sapplings and plant them out in the land they've cleared. How many beavers does it take to move a single sapling": '다시 심기 — 묘목이 충분히 자라면 통나무갉이 길드가 이를 거두어 개간한 땅에 옮겨 심습니다. 묘목 하나를 옮기려면 비버가 몇 마리나 필요할까요?'
  ,"Mother 'o Fruits — Towering over the Pots is a single, massive apple tree. Wait, no its a pear tree. Hang on... its all sorts of trees! Branches from different species have been grafted onto a single host, so that the tree bears fruit all year long. What fruit is in season right now? Apples, pears, peaches, cherries? Add 'Fruit' to your Bags. It can be USED/COOKED for [FAIR 2/3]. Far to the north of the Bristley Woods sits Loch Katrine, a languid mirror to the stars. A crew of Beavers dug a river to lower lying bodies of water, and established Newdam. This tiny settlement flourishes with trade from the northern heart of the woods, and is famous for its shipyards and waterside wooden lodges. NewDam 199": '열매의 어머니 — 화분들 위로 거대한 사과나무 한 그루가 솟아 있습니다. 아니, 배나무인가요? 자세히 보니 여러 나무가 한데 섞여 있습니다. 서로 다른 종의 가지를 한 나무에 접붙여 일 년 내내 열매가 열립니다. 지금 제철인 열매는 무엇인가요? 과일 1개를 가방에 넣습니다. 과일은 [FAIR 2/3]을 위해 그대로 사용하거나 요리할 수 있습니다.'
  ,'What do you think its original purpose was — to commemorate memories, to celebrate life? Or something more mundane? Open rolling hills of wild grasses peppered with mossy stones and thistly flowers dot the Bristley Woods, and to the untrained eye they can appear to be completely uninhabited. These Settlements use natural features as shelter from the elements; they’re built into sturdy gorse bushes, or in hillside barrows reinforced by the roots of old, gnarled trees. Anything exterior can be quickly packed down and hauled to safety, away from fast approaching predators and Behemoths. Meadows 204': '이곳의 원래 목적은 무엇이었을까요? — 추억을 기리거나 삶을 축하하기 위한 곳이었을까요? 아니면 더 평범한 용도였을까요?'
  ,'Floral beastlore — You know for sure this flower has no medicinal value. However, it does have some sentimental quality. What is this plant? What stories do beasts tell that involve or are somehow tied to this flower?': '꽃에 얽힌 야수 전승 — 이 꽃에 약효가 없다는 점은 확실하지만, 정서적으로 특별한 의미가 있습니다. 어떤 식물인가요? 야수들은 이 꽃과 얽힌 어떤 이야기를 전하나요?'
  ,'Wish them luck — Sometimes its bee-st not to get involved in the business of other guilds. Lose 1 Reputation.': '행운을 빌기 — 때로는 다른 길드의 일에 끼어들지 않는 편이 최선입니다. 길드 명성 1을 잃습니다.'
  ,'Arbitrate — "Wait a minute, you\'re holding the red rod, but so is your friend. What does that mean?" you ask inquisitively. "Wait, well, uh..." the bird begins... The wee beasts are eager to explain their game. What are the rules? How many can play? How do you win, lose, or have fun?': '중재하기 — “잠깐, 너도 빨간 막대를 들고 있고 친구도 들고 있네. 그게 무슨 뜻이야?”라고 묻습니다. 작은 야수들은 신이 나서 놀이를 설명합니다. 규칙은 무엇인가요? 몇 명이 할 수 있나요? 어떻게 이기고 지며, 무엇이 재미있나요?'
  ,'Eavesdrop — Add Gossip to your bags. When Bartering, you can trade this Gossip to automatically receive your chosen Reagent; however, the Guild loses 1 Reputation.': '엿듣기 — 소문을 가방에 넣습니다. 물물교환할 때 이 소문을 건네면 고른 영약재를 바로 받을 수 있지만, 길드 명성 1을 잃습니다.'
  ,'Take Shelter — Decrease Timers by 1 as you hide from the Behemoth': '몸을 숨기기 — 거수를 피해 숨으며 모든 타이머를 1 줄입니다.'
  ,'Creep Away — Draw a Card. If it is a ♥ - you escape unnoticed. If it is ♦, ♣ or ♠, the eagle spots you! Its talons rake across your back; Lose all Foraging Points and 1 Reagent.': '살금살금 벗어나기 — 카드를 뽑습니다. ♥면 들키지 않고 벗어납니다. ♦·♣·♠면 독수리가 발견하여 등을 발톱으로 할퀘니다. 채집 포인트를 모두 잃고 영약재 1개를 잃습니다.'
  ,"Luck — Choose an Earth Reagent, and draw a card. If its value is equal to or higher than the Reagent's Base Rarity, it is unearthed from behind the rocky ledge! Add it to your Bags.": '행운 — 땅과 돌 영약재 하나를 고르고 카드를 뽑습니다. 카드 값이 영약재의 기본 희귀도 이상이면, 바위 턱 뒤에서 그 영약재를 발견하여 가방에 넣습니다.'
  ,'Fixer Upper — Mark 1 Day, and Draw a Card. 2 - 10 - You fix the issue and the magpie lets out an appreciative caw. However, it\'s only revealed another problem. The magpie frustratedly thanks you for your help and gives you 1 Trinket. You can choose to Mark 1 Day and Draw again': '수리하기 — 달력에 1일을 표시하고 카드를 뽑습니다. 2–10이면 문제를 고치지만 또 다른 문제가 드러납니다. 까치는 답답한 듯 감사를 표하며 장신구 1개를 건넥니다. 원하면 달력에 1일을 더 표시하고 카드를 다시 뽑을 수 있습니다.'
  ,'M or J — Lights swirl inside the box, and inside the Ruins music begins to play. Just what does this box do, exactly? At the end of this season, this Ruin becomes a Settlement. What beasts have moved in and what strange things can be found here?': 'M 또는 J — 상자 안에서 빛이 휘돌고 유적 안에 음악이 흐르기 시작합니다. 이 상자는 도대체 무엇을 하는 물건일까요? 이번 계절이 끝나면 이 유적은 정착지가 됩니다. 어떤 야수들이 이주해 왔고, 어떤 신기한 물건을 찾을 수 있나요?'
  ,'Rescue! — Mark 1 Day and change the end of your move to the nearest non-Loch Location. Gain 1 Reputation': '구조하기! — 달력에 1일을 표시하고, 이번 이동의 도착지를 가장 가까운 호수가 아닌 위치로 바꿉니다. 길드 명성 1을 얻습니다.'
  ,'Refuse — They mock you and splash water at you. Flick water on one of your Journal pages, or blur/ alter some of the words': '거절하기 — 새가 비웃으며 물을 튀깁니다. 일지 한 쪽에 물을 튀기거나 단어 몇 개를 번지게 하고 바꾸세요.'
  ,'Race — Draw two cards for the bird, and one for you. The highest value card wins': '경주하기 — 새를 위해 카드 2장, 자신을 위해 카드 1장을 뽑습니다. 가장 높은 값의 카드가 이깁니다.'
  ,'Swoop in to help — You guide the large bird towards a nearby tree, where he can breathlessly perch and recollect himself. He introduces himself as Griph, Wanderer Extraordinaire. This elderly bird excitedly tells you about why he was crossing over from the mountain. End your Soar at a Location roughly halfway along your Flightpath. Gain 1 Reputation': '날아내려 돕기 — 큰 새를 가까운 나무로 안내하자, 겨우 내려앉아 숨을 고릅니다. 그는 자신을 탁월한 방랑자 그리프라고 소개하며, 산을 넘어오던 이유를 신나게 이야기합니다. 비행 경로의 대략 중간 지점에서 활공을 끝내고 길드 명성 1을 얻습니다.'
  ,'If you have the highest card — they permit you to stay and search for Reagents': '내 카드가 가장 높음 — 사슴은 여기 머물며 영약재를 찾아도 된다고 허락합니다.'
  ,'Play it Safe — You give them your satchel. Discard everything in your Bags, and lose all your Trinkets': '안전하게 물러나기 — 가방을 내줍니다. 가방의 모든 물품을 버리고 장신구를 모두 잃습니다.'
  ,'Scrap — You try to fight them off. Draw a card for you and two cards for them. The highest single card wins. You can draw a second card if you have a Crossbow and Bolt': '맞서 싸우기 — 자신을 위해 카드 1장, 상대를 위해 카드 2장을 뽑습니다. 단일 카드 중 가장 높은 값을 뽑은 쪽이 이깁니다. 석궁과 볼트가 있다면 카드를 한 장 더 뽑을 수 있습니다.'
  ,'Fight the wind — End your Soar at your chosen destination, but Mark 1 Day for the time lost fighting the elements': '바람에 맞서기 — 고른 목적지에서 활공을 끝내지만, 거센 날씨와 싸우느라 잃은 시간만큼 달력에 1일을 표시합니다.'
};

const optionTranslations: Record<string, string> = {
  'Go Fish': '낚시하기',
  'Fish Some More': '조금 더 낚시하기',
  'Paws In': '발 벗고 돕기',
  'Cold Shoulder': '냉대하기',
  'Ship-to-Ship Combat': '선박 간 전투',
  'Long Walk': '먼 길로 걷기',
  Communal: '함께 보태기',
  Humble: '그냥 건너기',
  'Find Shelter': '비를 피하기',
  'Push On': '계속 나아가기',
  Visit: '방문하기',
  Trade: '거래하기',
  'Delicious!': '맛있게 먹기!',
  'Rescue!': '구조하기!',
  'Quest!': '특별 여정 시작!',
  'Duty Call': '의무를 다하기',
  'Duty Calls': '의무를 다하기',
  'Silence!': '소리 멈추기!',
  'Dig!': '파헤치기!',
  'Run!': '도망치기!',
  'Help!': '돕기!',
  'Gimme!': '가져가기!',
  'Take cover! Hide': '몸을 숨기기!',
  'Scamper!': '달아나기!',
  'Hold!': '재채기 참기!',
  'Go Panning': '사금 채취하기',
  'A Reintroduction': '다시 인사하기',
  'Release The Queen': '여왕벌 놓아주기',
  'Fixer Upper': '수리하기',
  'Creep Away': '살금살금 벗어나기',
  Scrap: '맞서 싸우기',
  Canteen: '구내식당',
  Cull: '솟아내기',
  Parley: '협상하기',
  'Spook Flock': '벌 떼 놀라게 하기',
  March: '계속 행군하기',
  Shrug: '어깨를 으쓱하고 떠나기',
  Help: '돕기',
  'Intervene · Monarch': '중재 · Monarch',
  'Intervene · Not A Monarch · 즉시 치료': '중재 · Monarch 아님 · 즉시 치료',
  'Intervene · Not A Monarch · Stitcher 치료': '중재 · Monarch 아님 · Stitcher 치료',
  'Just In Time': '때맞춰 치료하기',
  Light: '조명 켜기',
  'Wish Them Luck': '행운 빌기',
  'Pitch In': '거들기',
  'Wharf Rats': '부두의 쥐 아이들',
  Duty: '의무',
  'Pay with your pockets': '장신구로 내기',
  'Pay with your life': '결투로 대신하기',
  'Pay with your patience': '그냥 지나치기',
  'Pay with your (short) patience': '그냥 지나치기',
  'Listen & Learn': '듣고 배우기',
  Interrupt: '말 끊기',
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
  ,'Beaver Flood': '비버 댐 범람'
  ,'Dam Burst': '댐 붕괴'
  ,'Help Your Guildmate': '길드 동료 돕기'
  ,'Keep to Yourself': '혼자 조용히 지내기'
  ,'Wheee!': '휘이잉!'
  ,Slowfall: '느린 낙하'
};

const generatedTranslationMap = generatedTranslations as Record<string, string>;
const encounterTitleKeys = Object.keys(ENCOUNTER_TITLE_KO).sort((left, right) => right.length - left.length);
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
  'Paws In': '발 벗고 돕기',
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
  ,'Beaver Flood': '비버 댐 범람'
  ,'Dam Burst': '댐 붕괴'
  ,'Help Your Guildmate': '길드 동료 돕기'
  ,'Keep to Yourself': '혼자 조용히 지내기'
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
    .replace(/\bMove\b/g, '이동')
    .replace(/\bForaging\b/g, '채집')
    .replace(/\bForage\b/g, '채집')
    .replace(/\bBase Rarity\b/g, '기본 희귀도')
    .replace(/\bRarity\b/g, '희귀도')
    .replace(/\bSoar\b/g, '활공')
    .replace(/\bBehemoth\b/g, '거수')
    .replace(/\bBarrow\b/g, '고분')
    .replace(/\bTowering\b/g, '거대한')
    .replace(/\bMany\b/g, '다수의')
    .replace(/\bnon-Loch\b|비Loch/g, '호수가 아닌')
    .replace(/\bForest\b/g, '숲')
    .replace(/\bMeadow\b/g, '초원')
    .replace(/\bLoch\b/g, '호수')
    .replace(/\bBog\b/g, '늪지')
    .replace(/\bMountain\b/g, '산맥')
    // Generated OCR translations occasionally choose a vowel-ending particle
    // for these stable, consonant-ending Korean rule terms. Keep the correction
    // deliberately narrow instead of rewriting the generated source wholesale.
    .replaceAll('명성를', '명성을')
    .replaceAll('명성가', '명성이')
    .replaceAll('여정를', '여정을')
    .replaceAll('여정가', '여정이')
    .replaceAll('질병를', '질병을')
    .replaceAll('질병가', '질병이')
    .replaceAll('처방를', '처방을')
    .replaceAll('계절가', '계절이')
    .replaceAll('활공를', '활공을')
    .replaceAll('고분로', '고분으로')
    .replaceAll('물물교환를', '물물교환을')
    .replaceAll('여정는', '여정은')
    .replaceAll('질병는', '질병은')
    .replaceAll('질병로', '질병으로')
    .replaceAll('영약재 부위을', '영약재 부위를')
    .replaceAll('채집를', '채집을')
    .replaceAll('당신가', '당신이')
    .replaceAll('당신와', '당신과')
    .replaceAll('약제사s', '약제사들')
    .replaceAll('이 두 번째 채집는', '이 두 번째 채집은')
    .replaceAll('Titan가', '티탄이')
    .replaceAll('영약재의 모든 부품', '영약재의 모든 부위')
    .replaceAll('영약재 부품', '영약재 부위')
    .replaceAll('영약재 부분', '영약재 부위')
    .replaceAll('영약재 부위을', '영약재 부위를')
    .replaceAll('영약재의 모든 부위을', '영약재의 모든 부위를')
    .replaceAll('부위(비늘 또는 뼈 등)을', '부위(비늘이나 뼈 등)를')
    .replaceAll('마초', '채집')
    .replaceAll('귀하', '당신')
    .replaceAll('장바구니', '가방')
    .replaceAll('당신의 해클이 곤경에 처한 순간', '잔뜩 긴장한 바로 그때')
    .replaceAll('미지용', '각다귀 떼를 위해')
    .replaceAll('캐리 2', '운반 한도 +2')
    .replaceAll('Poulticepounder', '약제사')
    .replaceAll('Hivewarden', '벌집지기')
    .replaceAll('데크에서 그리기', '카드 더미에서 뽑기')
    .replaceAll('데크에서 그립니다', '카드 더미에서 뽑습니다')
    .replaceAll('\u200b', '')
    .replaceAll('\u00ad', '')
    .replace(/\s+or\s+/gi, ' 또는 ')
    .replace(/\s+--\s+/g, ' — ')
    .replace(/\.{3,}/g, '…');
  return normalizeCanonicalGuildReputationTerms(
    protectedNames.reduce((current, name, index) => current.replaceAll(`\uE000${index}\uE001`, name), polished)
  );
};
const normalizeTranslationKey = (text: string): string => text
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^[.,;:]\s+/, '');

const reviewedEncounterChoices: ReviewedEncounterChoice[] = [
  ...REVIEWED_ENCOUNTER_CHOICES,
  ...Object.entries(ENCOUNTER_REVIEW_CHOICE_KO).flatMap(([encounterId, choices]) =>
    Object.entries(choices).map(([choiceId, text]) => ({ encounterId, choiceId, text })))
];

const reviewedEncounterChoiceMap = new Map<string, string>(
  reviewedEncounterChoices.map(review => {
    const encounter = ENCOUNTERS.find(row => row.id === review.encounterId);
    const choice = encounter?.choices.find(row => row.id === review.choiceId);
    if (!choice) {
      throw new Error(`Reviewed encounter choice not found: ${review.encounterId}/${review.choiceId}`);
    }
    return [normalizeTranslationKey(choice.label), review.text];
  })
);

const hashTranslationKey = (text: string): string => {
  const normalized = normalizeTranslationKey(text);
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const branchDelimiters = (text: string): Array<{ start: number; end: number }> =>
  [...text.matchAll(/\s+[—-]\s+/g)].map(match => ({
    start: match.index || 0,
    end: (match.index || 0) + match[0].length
  }));

const translatedBranchStart = (text: string, delimiterStart: number): number => {
  for (let index = delimiterStart - 1; index >= 0; index -= 1) {
    if (!/[.!?]/.test(text[index])) continue;
    // Choice headings such as “Rescue!” end immediately before the dash. That
    // punctuation belongs to the heading, not to the previous sentence.
    if (delimiterStart - index <= 3) continue;
    return index + 1;
  }
  return 0;
};

const cleanPrintedDisplayText = (text: string, sourcePage?: number): string => {
  let cleaned = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.,;:]\s*/, '')
    .replace(/\s+([,.;!?])/g, '$1');
  const boilerplate = cleaned.search(/\b(?:Bog|Forest|Loch|Meadow|Mountain|Titan|Soar)\s+(?:travel|foraging)\s+encounters\b/i);
  if (boilerplate > 0) cleaned = cleaned.slice(0, boilerplate).trim();
  const localizedBoilerplate = cleaned.search(/(?:늪지|숲|호수|초원|산맥|티탄)\s*(?:여행|채집)(?:\s*조우|은|는)/);
  if (localizedBoilerplate > 0) cleaned = cleaned.slice(0, localizedBoilerplate).trim();
  const adjacentSocialColumn = cleaned.search(/\b(?:Amongst thin streams|Of the Bristley Wood's different cities|Odoak Originally called|Far to the north of the Bristley Woods|In the centre of the Crossing Loch|Open rolling hills of wild grasses|Thousands of beasts can fit inside this city|The architecture of mountain settlements|In a word, Spoolkeep)\b|(?:얇은 시냇물,?\s*키가 큰 갈대|Bristley Wood의 여러 도시 중에서 Noonhill|Odoak\s*원래|Bristley Woods 북쪽|Crossing 호수 중앙|Bristley Woods에는 이끼 낀 돌|고대 Titan 채석장에 건설된 이 도시|산간 정착지의 건축물|한마디로 Spoolkeep)/i);
  if (adjacentSocialColumn > 0) cleaned = cleaned.slice(0, adjacentSocialColumn).trim();
  if (sourcePage) cleaned = cleaned
    .replace(new RegExp(`(?:[.!?]\\s*)?${sourcePage}\\s*$`), '')
    .replace(/\s+(?:Bogs|Forests|Lochs|Meadows|Mountains|Noonhill|Odoak|NewDam|Vessel|Summit|Spoolkeep)\s*$/i, '')
    .trim();
  return cleaned.replace(/\s*[—-]\s*$/, '').trim();
};

const cleanEncounterOptionText = (text: string): string => cleanPrintedDisplayText(text)
  .replace(/\s+([♥♦♣♠]\s+(?:또는|or)\s+[♥♦♣♠]\s+[—-])/g, '\n$1')
  .replace(/(?<!또는)(?<!or)\s+([♥♦♣♠]\s+[—-])/g, '\n$1');

let generatedEncounterOptionMap: Map<string, string> | null = null;

const getGeneratedEncounterOptionMap = (): Map<string, string> => {
  if (generatedEncounterOptionMap) return generatedEncounterOptionMap;
  const result = new Map<string, string>();
  ENCOUNTERS.forEach(encounter => {
    const rawPrompt = normalizeTranslationKey(encounter.prompt);
    const translatedPrompt = exactTranslations[rawPrompt] || generatedTranslationMap[hashTranslationKey(rawPrompt)];
    if (!translatedPrompt || translatedPrompt === rawPrompt || encounter.choices.length === 0) return;
    const rawDelimiters = branchDelimiters(rawPrompt);
    const translatedDelimiters = branchDelimiters(translatedPrompt);
    const rows = encounter.choices.map(choice => {
      const match = choice.label.match(/^(.+?)\s+[—-]\s+([\s\S]+)$/);
      if (!match) return null;
      const sourceNeedle = `${match[1]} - `;
      const headingStart = rawPrompt.indexOf(sourceNeedle);
      if (headingStart < 0) return null;
      const delimiterStart = headingStart + match[1].length;
      const delimiterOrdinal = rawDelimiters.findIndex(delimiter => delimiter.start === delimiterStart);
      return delimiterOrdinal >= 0 ? { choice, match, delimiterOrdinal } : null;
    }).filter((row): row is NonNullable<typeof row> => Boolean(row));

    rows.forEach((row, index) => {
      const translatedDelimiter = translatedDelimiters[row.delimiterOrdinal];
      if (!translatedDelimiter) return;
      const next = rows[index + 1];
      const nextDelimiter = next ? translatedDelimiters[next.delimiterOrdinal] : null;
      const detailEnd = nextDelimiter
        ? translatedBranchStart(translatedPrompt, nextDelimiter.start)
        : translatedPrompt.length;
      const detail = cleanPrintedDisplayText(
        translatedPrompt.slice(translatedDelimiter.end, detailEnd),
        encounter.sourcePage
      );
      if (!detail) return;
      const heading = optionTranslations[row.match[1]] || localizeManualEffectValue(row.match[1]);
      result.set(row.choice.label.trim(), `${heading} — ${polishGenericRuleTerms(detail)}`);
    });
  });
  generatedEncounterOptionMap = result;
  return result;
};

const translatedManualEffectValue = (text: string): string | undefined => {
  const compact = text.trim();
  const normalized = normalizeTranslationKey(compact);
  const translated = exactTranslations[compact] || exactTranslations[normalized] || generatedTranslationMap[hashTranslationKey(compact)];
  return translated ? normalizeCanonicalGuildReputationTerms(polishGenericRuleTerms(translated)) : undefined;
};

export const localizeManualEffectValue = (text: string): string =>
  translatedManualEffectValue(text) || normalizeCanonicalGuildReputationTerms(text);

export const localizeEncounterTitle = (text: string, encounterId?: string): string => {
  const persistedEncounter = encounterId
    ? ENCOUNTERS.find(encounter => encounter.id === encounterId)
    : undefined;
  if (persistedEncounter) {
    const canonicalTitle = encounterTitleKeys.find(title => {
      const sourceTitle = cleanPrintedDisplayText(persistedEncounter.title);
      return sourceTitle === title || sourceTitle.startsWith(`${title} `);
    });
    if (canonicalTitle) return ENCOUNTER_TITLE_KO[canonicalTitle];
  }
  const compact = cleanPrintedDisplayText(text);
  const canonicalTitle = encounterTitleKeys.find(title => compact === title || compact.startsWith(`${title} `));
  return (canonicalTitle ? ENCOUNTER_TITLE_KO[canonicalTitle] : undefined) || localizeManualEffectValue(compact);
};

const localizeManualEffectTextUnnormalized = (summary: string, text: string): string => {
  if (summary === 'Mushroom Pickers') return MUSHROOM_PICKERS_TEXT;
  const compact = text.trim();
  const cleanSummary = cleanPrintedDisplayText(summary);
  if (cleanSummary === 'Dam Lotta Trouble' || cleanSummary.startsWith('Dam Lotta Trouble ')) {
    return DAM_LOTTA_TROUBLE_EFFECT;
  }
  if (cleanSummary === 'Project Launch' || cleanSummary.startsWith('Project Launch ')) {
    return PROJECT_LAUNCH_EFFECT;
  }
  if (cleanSummary === 'Flood' || cleanSummary.startsWith('Flood ')) {
    return FLOOD_EFFECT;
  }
  const canonicalEncounter = ENCOUNTERS.find(encounter => {
    const cleanTitle = cleanPrintedDisplayText(encounter.title);
    // Some source-table titles also contain their opening narrative line. A
    // persisted manual draft keeps only the encounter's short title, so match
    // that stable prefix as well as the exact normalized title.
    return cleanTitle === cleanSummary
      || cleanTitle.startsWith(`${cleanSummary} `)
      || cleanSummary.startsWith(`${cleanTitle} `);
  });
  if (canonicalEncounter) {
    const canonicalPrompt = normalizeTranslationKey(canonicalEncounter.prompt);
    const canonicalOpening = canonicalPrompt.slice(0, Math.min(72, canonicalPrompt.length));
    const compactNormalized = normalizeTranslationKey(compact);
    if (canonicalOpening.length > 40 && compactNormalized.includes(canonicalOpening)) {
      const canonicalTranslation = exactTranslations[canonicalPrompt] || generatedTranslationMap[hashTranslationKey(canonicalPrompt)];
      if (canonicalTranslation) return cleanPrintedDisplayText(
        polishGenericRuleTerms(canonicalTranslation, summary ? [summary] : []),
        canonicalEncounter.sourcePage
      );
    }
  }
  const directTranslation = exactTranslations[compact] || exactTranslations[normalizeTranslationKey(compact)] || generatedTranslationMap[hashTranslationKey(compact)];
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

export const localizeManualEffectText = (summary: string, text: string): string =>
  normalizeGuildReputationTerms(localizeManualEffectTextUnnormalized(summary, text));

const encounterChoiceSourceHeadings = (encounter: (typeof ENCOUNTERS)[number]): string[] =>
  [...new Set(encounter.choices.flatMap(choice => {
    const heading = choice.label.match(/^(.+?)\s+[—-]\s+/)?.[1]?.trim();
    if (!heading) return [];
    return [heading, ...heading.split(/\s+·\s+/)].filter(candidate => /[A-Za-z]/.test(candidate));
  }))].sort((left, right) => right.length - left.length);

const localizedEncounterPromptContext = (
  summary: string,
  raw: string,
  encounter: (typeof ENCOUNTERS)[number]
): string => {
  const localized = localizeManualEffectText(summary, raw);
  if (encounter.choices.length === 0) return cleanPrintedDisplayText(localized, encounter.sourcePage);

  const firstChoice = encounterChoiceSourceHeadings(encounter)
    .map(heading => ({ heading, start: raw.indexOf(`${heading} - `) }))
    .filter(candidate => candidate.start >= 0)
    .sort((left, right) => left.start - right.start)[0];
  if (!firstChoice) return cleanPrintedDisplayText(localized, encounter.sourcePage);
  const rawDelimiterStart = firstChoice.start + firstChoice.heading.length;
  const ordinal = branchDelimiters(raw).findIndex(delimiter => delimiter.start === rawDelimiterStart);
  const translatedDelimiter = branchDelimiters(localized)[ordinal];
  const descriptionEnd = translatedDelimiter
    ? translatedBranchStart(localized, translatedDelimiter.start)
    : localized.length;
  return cleanPrintedDisplayText(localized.slice(0, descriptionEnd), encounter.sourcePage);
};

const promptStartsWithChoice = (encounter: (typeof ENCOUNTERS)[number], text: string): boolean =>
  encounterChoiceSourceHeadings(encounter)
    .some(heading => text.startsWith(`${heading} - `) || text.startsWith(`${heading} — `));

const localizeEncounterDisplayTextUnnormalized = (summary: string, text: string, encounterId?: string): string => {
  const raw = normalizeTranslationKey(text);
  const cleanSummary = cleanPrintedDisplayText(summary);
  const persistedEncounterContext = encounterId
    ? ENCOUNTER_REVIEW_CONTEXT_KO[encounterId]
    : undefined;
  // Pending encounters are persisted between sessions. Older saves can hold
  // an OCR-derived or partly translated prompt that no longer equals the
  // canonical source row, so prefer the stable encounter id when the UI has it.
  if (persistedEncounterContext) return persistedEncounterContext;
  const reviewedEncounter = ENCOUNTERS.find(row => normalizeTranslationKey(row.prompt) === raw);
  const canonicalReviewedContext = reviewedEncounter
    ? ENCOUNTER_REVIEW_CONTEXT_KO[reviewedEncounter.id]
    : undefined;
  // Canonical rows always use the fully reviewed table transcription. The
  // title-based branches below remain only for partially translated legacy
  // saves whose stored prompt no longer matches the canonical source row.
  if (canonicalReviewedContext) return canonicalReviewedContext;
  // Older saves retain the p.87 row with its opening scene inside the title
  // and only the three result branches in `text`. Keep those saves readable
  // without rewriting or invalidating their pending encounter transaction.
  if (cleanSummary === 'Highway Robbery' || cleanSummary.startsWith('Highway Robbery ') || raw.includes('Pay with your pockets')) {
    return HIGHWAY_ROBBERY_CONTEXT;
  }
  if (cleanSummary === 'Dam Lotta Trouble' || cleanSummary.startsWith('Dam Lotta Trouble ')) {
    return DAM_LOTTA_TROUBLE_CONTEXT;
  }
  if (cleanSummary === 'Project Launch' || cleanSummary.startsWith('Project Launch ')) {
    return PROJECT_LAUNCH_CONTEXT;
  }
  if (cleanSummary === 'Flood' || cleanSummary.startsWith('Flood ')) {
    return FLOOD_CONTEXT;
  }
  const socialContext = Object.entries(SOCIAL_CONTEXT_KO)
    .find(([title]) => cleanSummary === title || cleanSummary.startsWith(`${title} `))?.[1];
  if (socialContext) return socialContext;
  // The p.198 source extraction puts this encounter's opening sentence in
  // the title column and appends the Loch overview from the adjacent column
  // to its body. Keep the complete encounter prompt while excluding that
  // unrelated page-layout spill.
  if (cleanSummary === 'Fresh Catch' || cleanSummary.startsWith('Fresh Catch ')) {
    return FRESH_CATCH_CONTEXT;
  }
  const encounter = reviewedEncounter;
  if (!encounter) return cleanPrintedDisplayText(localizeManualEffectText(summary, raw));
  const reviewedContext = ENCOUNTER_REVIEW_CONTEXT_KO[encounter.id]
    || REVIEWED_ENCOUNTER_CONTEXT_KO[encounter.id];
  if (reviewedContext) return reviewedContext;
  const localizedContext = localizedEncounterPromptContext(summary, raw, encounter);
  if (!Object.prototype.hasOwnProperty.call(ENCOUNTER_OPENING_KO, encounter.id)) return localizedContext;

  const opening = ENCOUNTER_OPENING_KO[encounter.id];
  if (!opening) return localizedContext;

  const absorbedPrefix = ENCOUNTER_OPENING_PROMPT_PREFIX[encounter.id];
  if (!absorbedPrefix) return [opening, localizedContext].filter(Boolean).join('\n\n');
  if (!encounter.prompt.startsWith(absorbedPrefix)) return [opening, localizedContext].filter(Boolean).join('\n\n');

  const promptRemainder = encounter.prompt.slice(absorbedPrefix.length).trim();
  if (!promptRemainder || promptStartsWithChoice(encounter, promptRemainder)) return opening;

  const remainder = ENCOUNTER_OPENING_REMAINDER_KO[encounter.id]
    || (absorbedPrefix === '.' ? localizedContext : '');
  return [opening, remainder].filter(Boolean).join('\n\n');
};

export const localizeEncounterDisplayText = (summary: string, text: string, encounterId?: string): string =>
  normalizeGuildReputationTerms(localizeEncounterDisplayTextUnnormalized(summary, text, encounterId));

export const localizeManualEffectLine = (text: string): string => {
  const compact = text.trim();
  if (/^Dam Burst\s*-/i.test(compact)) return '겨울이 끝나면 댐이 무너져 이 위치가 다시 숲 지역이 됩니다.';
  if (/Beaver Dam/i.test(compact) && /Region.{0,20}(?:changed|Loch)/i.test(compact)) {
    return '이 위치를 비버 댐으로 표시하고 지역을 호수로 바꾸세요.';
  }
  const region = compact.match(/^Region:\s*(.+)$/i);
  if (region) return `지역: ${localizeRegionLabel(region[1])}`;
  const season = compact.match(/^Season:\s*(.+)$/i);
  if (season) return `계절: ${localizeSeasonLabel(season[1])}`;
  const translated = localizeManualEffectValue(compact);
  if (translated !== compact) return translated;
  return text;
};

export const localizeManualJournalTitle = (text: string): string => {
  const match = text.match(/^((?:판정 대기|여정 조우|채집 조우|사회 조우|사교 조우|직접 판정|예외 처리):\s*)(.+)$/);
  if (!match) return text;
  const effect = PRINTED_EFFECT_REGISTRY.find(row => match[2] === row.ownerName || match[2].startsWith(`${row.ownerName} `));
  return `${match[1]}${localizeEncounterTitle(effect?.ownerName || match[2])}`;
};

export const localizeManualJournalText = (text: string): string =>
  text.split(/(\n\s*\n)/)
    .map(block => {
    if (/^\n\s*\n$/.test(block)) return block;
    const pagePrefix = block.match(/^(\[p\.\d+\]\s*)([\s\S]+)$/);
    if (pagePrefix) return `${pagePrefix[1]}${localizeManualEffectValue(pagePrefix[2])}`;
    const direct = translatedManualEffectValue(block);
    if (direct) return direct;
    const recordedOutcome = block.match(/^(.+?)(\s+추가로 바뀐 수치 없이 장면을 기록했습니다\.)$/);
    if (recordedOutcome) {
      return `${localizeManualEffectValue(recordedOutcome[1])}${recordedOutcome[2]}`;
    }
    const embeddedEncounter = ENCOUNTERS.find(encounter => encounter.prompt.length > 40 && block.includes(encounter.prompt));
    if (!embeddedEncounter) return block;
    return block.replace(
      embeddedEncounter.prompt,
      localizeManualEffectText(embeddedEncounter.title, embeddedEncounter.prompt)
    );
    })
    .join('');

const localizeManualEffectOptionUnnormalized = (option: string, encounterId?: string, choiceId?: string): string => {
  const compact = option.trim();
  const persistedChoice = encounterId && choiceId
    ? ENCOUNTER_REVIEW_CHOICE_KO[encounterId]?.[choiceId]
    : undefined;
  // Choice labels are also part of pending encounter saves. Resolve them by
  // stable ids before inspecting their possibly stale player-facing text.
  if (persistedChoice) return persistedChoice.trim();
  const reviewedChoice = reviewedEncounterChoiceMap.get(normalizeTranslationKey(compact));
  // Exact canonical choices use the complete reviewed translation set. The
  // heading fallbacks below are retained for hybrid/legacy persisted strings.
  // Reviewed copy deliberately uses paragraph and card-result line breaks to
  // keep dense printed outcomes readable in the modal. Do not run it through
  // the legacy one-line PDF cleaner, which collapses that editorial structure.
  if (reviewedChoice) return reviewedChoice.trim();
  // Some persisted encounter rows already have generic rule terms such as
  // Trinket/Calendar/Reputation localized. That hybrid text no longer equals
  // the canonical English choice, so identify this p.87 branch by its stable
  // printed heading before applying the generic translation fallbacks.
  const printedHeading = compact.match(/^(.+?)\s+[—-]\s+/)?.[1].trim();
  if (printedHeading === 'Pay with your pockets') return HIGHWAY_ROBBERY_POCKETS;
  if (printedHeading === 'Pay with your life') return HIGHWAY_ROBBERY_DUEL;
  if (printedHeading === 'Pay with your patience' || printedHeading === 'Pay with your (short) patience') return HIGHWAY_ROBBERY_PASS;
  if (printedHeading === 'Watch the Unveiling') return PROJECT_LAUNCH_WATCH;
  if (printedHeading === 'Keep Your Head Down') return PROJECT_LAUNCH_KEEP_CLEAR;
  if (printedHeading === 'Paws In') return FLOOD_PAWS_IN;
  if (printedHeading === 'Shrug and move on') return FLOOD_MOVE_ON;
  if (optionTranslations[compact]) return optionTranslations[compact];
  if (exactTranslations[compact]) return cleanEncounterOptionText(exactTranslations[compact]);
  const branch = compact.match(/^(.+?)\s+[—-]\s+([\s\S]+)$/);
  if (branch) {
    const heading = optionTranslations[branch[1]] || localizeManualEffectValue(branch[1]);
    const detail = localizeManualEffectValue(branch[2]);
    if (detail !== branch[2]) return cleanEncounterOptionText(`${heading} — ${detail}`);
    // Hand-authored overrides already carry carefully reviewed Korean detail.
    // Keep that text instead of replacing it with the older generated OCR
    // translation merely because the printed English heading still matches.
    if (/[가-힣]/.test(branch[2])) {
      return cleanEncounterOptionText(`${heading} — ${polishGenericRuleTerms(branch[2])}`);
    }
  }
  const generatedOption = getGeneratedEncounterOptionMap().get(compact);
  if (generatedOption) return cleanEncounterOptionText(generatedOption);
  if (branch) {
    const heading = optionTranslations[branch[1]] || localizeManualEffectValue(branch[1]);
    if (heading !== branch[1]) return cleanEncounterOptionText(`${heading} — ${branch[2]}`);
  }
  return cleanEncounterOptionText(localizeManualEffectValue(compact).replace(/\s+or\s+/gi, ' 또는 '));
};

export const localizeManualEffectOption = (option: string, encounterId?: string, choiceId?: string): string =>
  normalizeGuildReputationTerms(localizeManualEffectOptionUnnormalized(option, encounterId, choiceId));

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
