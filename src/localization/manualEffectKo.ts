import generatedTranslations from './printedEffectKo.generated.json';
import { PRINTED_EFFECT_REGISTRY } from '../rules/printedEffects';
import { ENCOUNTERS } from '../rules/data/encounters';
import { localizeRegionLabel, localizeSeasonLabel } from './gameplayKo';
import { ENCOUNTER_TITLE_KO } from './encounterTitleKo';

const MUSHROOM_PICKERS_TEXT = `약용 버섯이 아닌 것은 확실하지만, 위험한 버섯일까요?

풋내기 - 의견을 묻자 어깨를 으쓱합니다. 풋내기 채집꾼은 태연하게 버섯을 입에 넣습니다. 카드를 한 장 뽑습니다.
♥ - 맛있는 간식입니다. 버섯 하나를 나눠 받아 맛있는 장신구 1개를 얻습니다.
♦, ♣ 또는 ♣ - 이런, 완전히 속았네요! 잠시 뒤 풋내기 채집꾼은 심하게 앓습니다. 그 실수에서 교훈을 얻습니다.

숙련자 - 정중히 끼어들어 버섯이 다른 채집물에 닿지 않게 집으로 가져가 확인하자고 제안합니다. 숙련자 채집꾼은 현명하다는 듯 고개를 끄덕입니다. 길드 명성 1을 얻습니다.`;

const HIGHWAY_ROBBERY_CONTEXT = '장난감 검을 든 어린 들쥐가 길을 막고 서서, 장난스럽게 통행세를 내라고 요구합니다.';
const HIGHWAY_ROBBERY_POCKETS = '장신구로 내기 — 장신구 1개를 잃습니다. 갑자기 전리품을 얻은 들쥐 아이는 어떤 반응을 보이나요?';
const HIGHWAY_ROBBERY_DUEL = '결투로 대신하기 — 달력에 1일을 표시합니다. 들쥐 아이와 모의 결투를 벌이고, 둘 중 누가 누구를 ‘쓰러뜨렸는지’ 일지에 기록하세요.';
const HIGHWAY_ROBBERY_PASS = '그냥 지나치기 — 아이를 성급히 지나쳐 여정을 계속합니다. 길드 명성 1을 잃습니다.';
const FRESH_CATCH_CONTEXT = '선착장을 지나던 중 갓 손질한 생선 냄새와 부지런히 일한 야수들의 땀 냄새가 풍깁니다. 오늘 잡은 물고기가 배에서 부두로 옮겨지고, 흔들리는 배가 부교를 규칙적으로 두드립니다. 오늘은 무엇을 잡았을까요? 아래의 Fishfinder 중 유심히 살펴볼 만한 것이 있나요?';

const exactTranslations: Record<string, string> = {
  'Go Fish': '낚시하기',
  'Fish Some More': '조금 더 낚시하기',
  "They wave you over and say you can use one of their empty stools that are perched around a fishing-hole. They don't say much, but the advice they give is invaluable. What special patches do they have on their fishing jacket? Go Fish - Decrease Timers by 1. Gain all the Parts of a Small Fish. Fish Some More - Decrease Timers by 1 and Draw a Card: ♥ or ♦ - Gain all parts from a Small Fish ♣ - Gain all parts from a Big Fish ♠ - You don't catch anything.": '낚시꾼이 얼음 구멍 둘레의 빈 의자를 써도 된다고 손짓합니다. 말수는 적지만 조언은 아주 유용합니다. 낚시 재킷에는 어떤 특별한 천 조각이 붙어 있나요?\n\n낚시하기 — 타이머를 1 줄이고 작은 물고기의 모든 부위를 얻습니다.\n\n조금 더 낚시하기 — 타이머를 1 줄이고 카드를 뽑습니다.\n♥ 또는 ♦ — 작은 물고기의 모든 부위를 얻습니다.\n♣ — 큰 물고기의 모든 부위를 얻습니다.\n♠ — 아무것도 잡지 못합니다.',
  "They wave you over and say you can use one of their empty stools that are perched around a fishing-hole. They don't say much, but the advice they give is invaluable. What special patches do they have on their fishing jacket?": '낚시꾼이 얼음 구멍 둘레의 빈 의자를 써도 된다고 손짓합니다. 말수는 적지만 조언은 아주 유용합니다. 낚시 재킷에는 어떤 특별한 천 조각이 붙어 있나요?',
  'Go Fish - Decrease Timers by 1.': '낚시하기 — 타이머를 1 줄입니다.',
  'Fish Some More - Decrease Timers by 1 and Draw a Card: ♥ or ♦ - Gain all parts from a Small Fish ♣ - Gain all parts from a Big Fish ♠ - You don\'t catch anything.': '조금 더 낚시하기 — 타이머를 1 줄이고 카드를 뽑습니다.\n♥ 또는 ♦ — 작은 물고기의 모든 부위를 얻습니다.\n♣ — 큰 물고기의 모든 부위를 얻습니다.\n♠ — 아무것도 잡지 못합니다.',
  'Any Season': '모든 계절',
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
  'How do they feel about their work? What gossip have the builders got to share? Beaver Flood - This location has been flooded with river water from a local dam. Mark on your map that this is a Beaver Dam, and that its Region has changed Loch. Dam Burst - The dam bursts after Winter, causing this Location to return to being a Forest Region. 161': '그들은 자신의 일에 대해 어떻게 생각하나요? 건축업자들은 어떤 이야기를 들려주나요? 비버 댐 범람 - 이 위치가 인근 비버 댐의 강물로 잠겼습니다. 지도에 이곳을 비버 댐으로 표시하고 지역을 호수로 바꾸세요. 댐 붕괴 - 겨울이 지난 뒤 댐이 무너집니다. 이 위치의 지역을 다시 숲으로 바꾸세요. 161',
  'Draw a card and gain a Forest Reagent with Rarity equal to the card’s value. Decrease your Ailment Timer by 1': '카드를 한 장 뽑고 카드 값과 희귀도가 같은 숲 영약재 하나를 얻습니다. 질병 타이머를 1만큼 줄이세요.',
  'Decrease Guild Reputation by 1. Journal about your fellow Poulticier’s patient.': '길드 명성 1을 잃습니다. 동료 약제사의 환자에 관해 일지에 기록하세요.',
  'A grouchy meadow hare comes bounding over to you, yelling "watch yer paws"! They explain that the peat bog is a delicate ecosystem. Though... you aren\'t walking on any peat right now. Despite this, they draw in deep breath as if to give a lecture. Listen & Learn - Unfortunately, once the hare gets started they cannot be stopped. Decrease Timers by 4. However, from now on everytime you Forage in a Bog, gain 1 Foraging Point. Interrupt - Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.': '심술궂은 초원 토끼가 뛰어오며 "발 조심해!" 하고 소리칩니다. 이탄 습지는 섬세한 생태계라고 설명하지만… 당신은 지금 이탄 위를 걷고 있지 않습니다. 그래도 토끼는 강의를 시작하려는 듯 깊게 숨을 들이쉽니다. 듣고 배우기 - 한 번 시작하면 멈추지 않습니다. 타이머를 4 줄입니다. 대신 앞으로 습지에서 채집할 때마다 채집 포인트 1을 얻습니다. 끼어들기 - 무례했다고 소문내어 길드 명성 1을 잃습니다.',
  'Wayfinders have made a new route. Draw a Path from this Location to an unconnected nearby Location. New Path - Record a Path from this Location to an unconnected nearby Location.': '길잡이들이 새 길을 냈습니다. 이 위치에서 아직 이어지지 않은 가까운 위치까지 경로를 그립니다. 새 길 - 이 위치에서 아직 이어지지 않은 가까운 위치까지 경로를 기록합니다.',
  'Something slithers beneath the water. Draw and resolve the suit result. Deep Water - Draw a card and apply the printed suit result on p166.': '물 아래에서 무언가가 미끄러집니다. 카드를 뽑아 문양 결과를 해결합니다. 깊은 물 - 카드를 뽑아 166쪽의 인쇄된 문양 결과를 적용합니다.',
  'Music carries across the meadow as another beast sings. Listen - Journal about the melody and the singer.': '초원 너머로 다른 짐승의 노랫소리가 들려옵니다. 듣기 - 선율과 노래하는 이에 대해 일지를 적습니다.',
  'A Titan plaque stands off the path. Read It - Journal about why it is here and what it says.': '길 옆에 타이탄 명판이 서 있습니다. 읽어 보기 - 왜 여기 있는지, 무엇이 적혀 있는지 일지를 적습니다.',
  'A Helpful Lift — You delicately ask if you could move past. Bashfully, he gathers his things, and asks where you\'re headed. Upon reply, he lifts you up a sheer cliff face - "Here, little one" his voice rumbles, "a short cut; my way of apologising!" Add 1 Day to your Calendar and continue your Journey.': '도움의 손길 — 조심스럽게 지나가도 될지 묻자, 바카르는 수줍게 짐을 챙기며 목적지를 묻습니다. 대답을 들은 그는 당신을 가파른 절벽 위로 번쩍 올려 줍니다. “자, 작은 친구. 지름길이야. 사과의 표시지!” 낮은 목소리가 울립니다. 달력에 1일을 표시하고 여정을 계속하세요.',
  'Wooden streets circle from forest floor up to canopy tops. Irresistible Bargain - A keen merchant steps out of their stall, exclaiming that you have just the thing they were hoping the find. You can choose to swap one of your non-basic Tools for any other from the Tools list. Delightful Indulgence - Journal about a new food or luxury you experience. Impulse Purchase - You\'re tempted by all manner of strange and foreign plant cuttings on display. You can buy a \'Foreign Reagent\' for 2 Trinkets (Weight 2/3) It provides [TAG 2]. You decide its Type, Tag, and Preparation Method. Journal about this Reagent’s origin.': '나무로 된 거리가 숲 바닥에서 우듬지까지 빙 둘러 이어집니다. 거절하기 힘든 거래 — 열성적인 상인이 가판대에서 달려 나와, 마침 자신이 찾던 물건을 당신이 가지고 있다고 외칩니다. 기본 도구가 아닌 도구 하나를 도구 목록의 다른 도구 하나와 교환할 수 있습니다. 기분 좋은 호사 — 처음 맛본 음식이나 누린 사치에 관해 일지를 적습니다. 충동구매 — 진열된 낯선 외지 식물의 삽수에 마음을 빼앗깁니다. 장신구 2개로 ‘외지 영약재’ 하나를 살 수 있습니다(무게 2/3). 이 영약재는 [TAG 2]를 제공합니다. 유형, 태그, 조제법을 정하고 원산지에 관해 일지를 적습니다.',
  'You see that travellers bags are being checked by local volunteers for contaminants that could spread spores to valuable goods like grain. Waved on past - If your Bags do not contain any Plant Reagent Parts from mushrooms the beast lets you continue with a friendly smile. Journal your thoughts on the effects of these searches. A Stern Lecture - If your Bags contain Plant Reagent Parts from mushrooms, the beast\'s face draws down with a grimace. Explaining their medicinal use, the beast\'s anxiety lessons, but not before they give a stern lecture about the danger that blight causes on the settlement\'s winter stores. Journal about the beast that searched your bag. Have they seen first-hand the danger that blight poses? Why did they volunteer for this role?': '현지 자원봉사자들이 여행자의 가방을 살피고 있습니다. 곡물처럼 귀중한 물자에 포자를 퍼뜨릴 수 있는 오염원을 막기 위한 검사입니다. 그냥 통과 — 가방에 버섯에서 얻은 식물성 영약재 부위가 없다면, 검사관은 친절하게 웃으며 길을 열어 줍니다. 이런 검사가 여행자와 정착지에 어떤 영향을 주는지 기록해 보세요. 엄중한 주의 — 가방에 버섯에서 얻은 식물성 영약재 부위가 있다면, 검사관은 얼굴을 찌푸립니다. 약용으로 쓴다고 설명하면 불안은 누그러지지만, 정착지의 겨울 식량에 번지는 병해의 위험에 대해 긴 주의를 듣습니다. 가방을 검사한 야수에 관해 기록해 보세요. 그 야수는 병해의 위험을 직접 본 적이 있을까요? 왜 이 일에 자원했을까요?',
  'Adventurous beasts have left markings on the wall warning others of the dangers within. You may ignore the negative effects of an event in this Location. Graffiti - If you\'ve already had a negative effect from an event in this Location, you can make warning marks of your own. Gain 1 Reputation. Heed The Warning - Ignore the negative effects of an event in this Location.': '모험심 많은 짐승들이 안의 위험을 알리는 표시를 벽에 남겼습니다. 이 위치에서 일어나는 사건의 부정적 효과를 무시할 수 있습니다. 낙서 - 이미 이 위치의 사건으로 부정적 효과를 겪었다면 당신도 경고 표시를 남길 수 있습니다. 길드 명성 1을 얻습니다. 경고를 따르기 - 이 위치에서 일어나는 사건의 부정적 효과를 무시합니다.',
  'While beasts may shun the Titan ruins, insects of all kinds can be found thriving in the forgotten shadows and lost places. Stunned - Some near dead insects can be found laying around a pillar. Gain a Beetle, Honey Bee, Butterfly, or Wasp Reagent Part. Burrowed - Some insects can be dug out from inside ancient wood structures. Gain a Maggot, Slug, or Spider Reagent Part.': '짐승들은 타이탄 유적을 피하지만, 잊힌 그늘과 잃어버린 장소에는 온갖 곤충이 번성합니다. 기절한 곤충 - 기둥 주위에 거의 죽은 곤충이 있습니다. 딱정벌레, 꿀벌, 나비, 말벌 부위 하나를 얻습니다. 파묻힌 곤충 - 고대 나무 구조 안에서 파낼 수 있습니다. 구더기, 민달팽이, 거미 부위 하나를 얻습니다.',
  'You hear the faint call of a beast from within a strange Titan construct. Open Says Me! - If you have a Titan Thingamabob, you may use it to activate the device and release the beast. Rescue - Draw a card: hearts or diamonds get the beast out, decrease the Timer by 1 and gain 2 Reputation; clubs or spades are a complication. Helping Hand - If you have come across Bakar in this ruin, you can get him to break the Titan construct open.': '이상한 타이탄 장치 안에서 희미한 짐승의 부름이 들립니다. 열려라! - 타이탄 물건이 있으면 장치를 작동시켜 짐승을 풀어줄 수 있습니다. 구조 - 카드를 뽑습니다. 하트나 다이아면 구해내고 타이머를 1 줄이며 명성 2를 얻습니다. 클럽이나 스페이드면 문제가 생깁니다. 돕는 손 - 이 유적에서 바카르를 만났다면 타이탄 장치를 부수게 할 수 있습니다.',
  'You meet Bakar the Gorilla reading Titan words. Chat - Bakar tells you what he knows about the Titans. Reunion - Whenever you repeat this event in a new Titan Location, Bakar will have pieced together more of the mystery. Discovery - Once you have been to every Titan Location and get this event again, Bakar announces his departure.': '타이탄 글자를 읽고 있는 고릴라 바카르를 만납니다. 이야기 - 바카르가 타이탄에 대해 아는 것을 들려줍니다. 재회 - 새로운 타이탄 위치에서 이 사건을 다시 만나면 수수께끼를 조금 더 맞춰 둡니다. 발견 - 모든 타이탄 위치를 다녀온 뒤 다시 이 사건을 만나면 바카르가 떠남을 알립니다.',
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
  '- If you have a Titan Thingamabob, you may use it to activate the device and release the beast.': '- 타이탄 물건이 있으면 장치를 작동시켜 짐승을 풀어줄 수 있습니다.',
  'Helping Hand - If you have come across Bakar in this ruin, you can get him to break the Titan construct open.': '돕는 손 - 이 유적에서 바카르를 만났다면 타이탄 장치를 부수게 할 수 있습니다.',
  'Rescue - Draw a card: hearts or diamonds get the beast out, decrease the Timer by 1 and gain 2 Reputation; clubs or spades are a complication.': '구조 - 카드를 뽑습니다. 하트나 다이아면 구해내고 타이머를 1 줄이며 명성 2를 얻습니다. 클럽이나 스페이드면 문제가 생깁니다.'
  ,'Collect a Plant Reagent Part that can be found in the Forest with a Base Value equal to the card’s.': '카드 값과 기본 희귀도가 같고 숲에서 발견되는 식물 영약재 부위 하나를 채집합니다.'
  ,'The Gift of Knowledge - You can draw a Sketch (Weight 1/3) of this mysterious artefact, and add it to your bags.': '지식의 선물 - 이 신비한 유물을 스케치해 스케치(무게 1/3)를 가방에 넣을 수 있습니다.'
  ,"Deliver the Parcel - Add a 'Parcel' to your Bags.": '소포 배달 - 소포를 가방에 넣습니다.'
  ,'Add a Titan Thingamabob to your Bags.': '타이탄 물건 하나를 가방에 넣습니다.'
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
  ,'If you make it into the chamber — amongst the long deceased behemoths you find a crumbling sack of tools far too big for you to use. However, the sack also contains a number of strange devices. Gain either a Cranky Contraption Companion, a Titan Thingamabob, or a Titan Reagent of value 8 or lower.': '방 안에 들어감 — 오래전에 죽은 거수들 사이에서 너무 커서 쓸 수 없는 도구가 든 낡은 자루를 찾습니다. 그 안에는 이상한 장치도 여럿 있습니다. 괴팍한 장치 동반자, 타이탄 물건, 또는 값 8 이하의 타이탄 영약재 중 하나를 얻습니다.'
  ,"If your total is still lower — The Not-Cat's slaps force you into a space it can't reach. It's oddly echoing meows sound both familiar, and also like meaningless babble": '합계가 여전히 낮음 — ‘고양이 아닌 것’의 앞발질에 밀려 그 존재가 닿지 못하는 틈으로 들어갑니다. 기묘하게 울리는 울음은 익숙한 듯하면서도 의미 없는 옹알이처럼 들립니다.'
  ,"Regrowth — When they're big enough, the Guild of Loggnawers collect the sapplings and plant them out in the land they've cleared. How many beavers does it take to move a single sapling": '다시 심기 — 묘목이 충분히 자라면 통나무갉이 길드가 이를 거두어 개간한 땅에 옮겨 심습니다. 묘목 하나를 옮기려면 비버가 몇 마리나 필요할까요?'
  ,"Mother 'o Fruits — Towering over the Pots is a single, massive apple tree. Wait, no its a pear tree. Hang on... its all sorts of trees! Branches from different species have been grafted onto a single host, so that the tree bears fruit all year long. What fruit is in season right now? Apples, pears, peaches, cherries? Add 'Fruit' to your Bags. It can be USED/COOKED for [FAIR 2/3]. Far to the north of the Bristley Woods sits Loch Katrine, a languid mirror to the stars. A crew of Beavers dug a river to lower lying bodies of water, and established Newdam. This tiny settlement flourishes with trade from the northern heart of the woods, and is famous for its shipyards and waterside wooden lodges. NewDam 199": '열매의 어머니 — 화분들 위로 거대한 사과나무 한 그루가 솟아 있습니다. 아니, 배나무인가요? 자세히 보니 여러 나무가 한데 섞여 있습니다. 서로 다른 종의 가지를 한 나무에 접붙여 일 년 내내 열매가 열립니다. 지금 제철인 열매는 무엇인가요? 과일 1개를 가방에 넣습니다. 과일은 [FAIR 2/3]을 위해 그대로 사용하거나 요리할 수 있습니다.'
  ,'What do you think its original purpose was — to commemorate memories, to celebrate life? Or something more mundane? Open rolling hills of wild grasses peppered with mossy stones and thistly flowers dot the Bristley Woods, and to the untrained eye they can appear to be completely uninhabited. These Settlements use natural features as shelter from the elements; they’re built into sturdy gorse bushes, or in hillside barrows reinforced by the roots of old, gnarled trees. Anything exterior can be quickly packed down and hauled to safety, away from fast approaching predators and Behemoths. Meadows 204': '이곳의 원래 목적은 무엇이었을까요? — 추억을 기리거나 삶을 축하하기 위한 곳이었을까요? 아니면 더 평범한 용도였을까요?'
  ,'Floral beastlore — You know for sure this flower has no medicinal value. However, it does have some sentimental quality. What is this plant? What stories do beasts tell that involve or are somehow tied to this flower?': '꽃에 얽힌 야수 전승 — 이 꽃에 약효가 없다는 점은 확실하지만, 정서적으로 특별한 의미가 있습니다. 어떤 식물인가요? 야수들은 이 꽃과 얽힌 어떤 이야기를 전하나요?'
  ,'Wish them luck — Sometimes its bee-st not to get involved in the business of other guilds. Lose 1 Reputation.': '행운을 빌기 — 때로는 다른 길드의 일에 끼어들지 않는 편이 최선입니다. 길드 명성 1을 잃습니다.'
  ,'Arbitrate — "Wait a minute, you\'re holding the red rod, but so is your friend. What does that mean?" you ask inquisitively. "Wait, well, uh..." the bird begins... The wee beasts are eager to explain their game. What are the rules? How many can play? How do you win, lose, or have fun?': '중재하기 — “잠깐, 너도 빨간 막대를 들고 있고 친구도 들고 있네. 그게 무슨 뜻이야?”라고 묻습니다. 작은 야수들은 신이 나서 놀이를 설명합니다. 규칙은 무엇인가요? 몇 명이 할 수 있나요? 어떻게 이기고 지며, 무엇이 재미있나요?'
};

const optionTranslations: Record<string, string> = {
  'Go Fish': '낚시하기',
  'Fish Some More': '조금 더 낚시하기',
  'Cold Shoulder': '냉대하기',
  'Ship-to-Ship Combat': '선박 간 전투',
  'Long Walk': '먼 길로 걷기',
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
  const localizedBoilerplate = cleaned.search(/(?:늪지|숲|호수|초원|산맥|타이탄)\s*(?:여행|채집)(?:\s*조우|은|는)/);
  if (localizedBoilerplate > 0) cleaned = cleaned.slice(0, localizedBoilerplate).trim();
  if (sourcePage) cleaned = cleaned.replace(new RegExp(`(?:[.!?]\\s*)?${sourcePage}\\s*$`), '').trim();
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

export const localizeManualEffectValue = (text: string): string => {
  const compact = text.trim();
  const normalized = normalizeTranslationKey(compact);
  const translated = exactTranslations[compact] || exactTranslations[normalized] || generatedTranslationMap[hashTranslationKey(compact)];
  return translated ? polishGenericRuleTerms(translated) : text;
};

export const localizeEncounterTitle = (text: string): string => {
  const compact = cleanPrintedDisplayText(text);
  const canonicalTitle = encounterTitleKeys.find(title => compact === title || compact.startsWith(`${title} `));
  return (canonicalTitle ? ENCOUNTER_TITLE_KO[canonicalTitle] : undefined) || localizeManualEffectValue(compact);
};

export const localizeManualEffectText = (summary: string, text: string): string => {
  if (summary === 'Mushroom Pickers') return MUSHROOM_PICKERS_TEXT;
  const compact = text.trim();
  const cleanSummary = cleanPrintedDisplayText(summary);
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
      if (canonicalTranslation) return polishGenericRuleTerms(canonicalTranslation, summary ? [summary] : []);
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

export const localizeEncounterDisplayText = (summary: string, text: string): string => {
  const raw = normalizeTranslationKey(text);
  const cleanSummary = cleanPrintedDisplayText(summary);
  // Older saves retain the p.87 row with its opening scene inside the title
  // and only the three result branches in `text`. Keep those saves readable
  // without rewriting or invalidating their pending encounter transaction.
  if (cleanSummary === 'Highway Robbery' || cleanSummary.startsWith('Highway Robbery ') || raw.includes('Pay with your pockets')) {
    return HIGHWAY_ROBBERY_CONTEXT;
  }
  // The p.198 source extraction puts this encounter's opening sentence in
  // the title column and appends the Loch overview from the adjacent column
  // to its body. Keep the complete encounter prompt while excluding that
  // unrelated page-layout spill.
  if (cleanSummary === 'Fresh Catch' || cleanSummary.startsWith('Fresh Catch ')) {
    return FRESH_CATCH_CONTEXT;
  }
  const encounter = ENCOUNTERS.find(row => normalizeTranslationKey(row.prompt) === raw);
  const localized = localizeManualEffectText(summary, raw);
  if (!encounter) return cleanPrintedDisplayText(localized);
  if (encounter.choices.length === 0) return cleanPrintedDisplayText(localized, encounter.sourcePage);

  const firstChoice = encounter.choices
    .map(choice => choice.label.match(/^(.+?)\s+[—-]\s+/)?.[1])
    .find(Boolean);
  if (!firstChoice) return cleanPrintedDisplayText(localized, encounter.sourcePage);
  const rawHeadingStart = raw.indexOf(`${firstChoice} - `);
  if (rawHeadingStart < 0) return cleanPrintedDisplayText(localized, encounter.sourcePage);
  const rawDelimiterStart = rawHeadingStart + firstChoice.length;
  const ordinal = branchDelimiters(raw).findIndex(delimiter => delimiter.start === rawDelimiterStart);
  const translatedDelimiter = branchDelimiters(localized)[ordinal];
  const descriptionEnd = translatedDelimiter
    ? translatedBranchStart(localized, translatedDelimiter.start)
    : localized.length;
  return cleanPrintedDisplayText(localized.slice(0, descriptionEnd), encounter.sourcePage);
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
  return `${match[1]}${localizeEncounterTitle(effect?.ownerName || match[2])}`;
};

export const localizeManualJournalText = (text: string): string => text
  .split(/(\n\s*\n)/)
  .map(block => {
    if (/^\n\s*\n$/.test(block)) return block;
    const pagePrefix = block.match(/^(\[p\.\d+\]\s*)([\s\S]+)$/);
    if (pagePrefix) return `${pagePrefix[1]}${localizeManualEffectValue(pagePrefix[2])}`;
    const direct = localizeManualEffectValue(block);
    if (direct !== block) return direct;
    const embeddedEncounter = ENCOUNTERS.find(encounter => encounter.prompt.length > 40 && block.includes(encounter.prompt));
    if (!embeddedEncounter) return block;
    return block.replace(
      embeddedEncounter.prompt,
      localizeManualEffectText(embeddedEncounter.title, embeddedEncounter.prompt)
    );
  })
  .join('');

export const localizeManualEffectOption = (option: string): string => {
  const compact = option.trim();
  // Some persisted encounter rows already have generic rule terms such as
  // Trinket/Calendar/Reputation localized. That hybrid text no longer equals
  // the canonical English choice, so identify this p.87 branch by its stable
  // printed heading before applying the generic translation fallbacks.
  const printedHeading = compact.match(/^(.+?)\s+[—-]\s+/)?.[1].trim();
  if (printedHeading === 'Pay with your pockets') return HIGHWAY_ROBBERY_POCKETS;
  if (printedHeading === 'Pay with your life') return HIGHWAY_ROBBERY_DUEL;
  if (printedHeading === 'Pay with your patience' || printedHeading === 'Pay with your (short) patience') return HIGHWAY_ROBBERY_PASS;
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
    if (optionTranslations[branch[1]] && /[가-힣]/.test(branch[2])) {
      return cleanEncounterOptionText(`${heading} — ${branch[2]}`);
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
