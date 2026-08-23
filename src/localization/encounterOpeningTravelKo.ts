/**
 * Korean opening lines that were printed in the title column of the travel
 * encounter tables. The legacy table extraction stores these lines in
 * `EncounterDefinition.title`, while the play UI deliberately reduces that
 * field to the short encounter title. Keeping the missing opening keyed by the
 * stable encounter id lets the UI restore it without changing saved encounter
 * transactions or inferring sentence boundaries at runtime.
 *
 * An empty string is intentional: the corresponding printed row keeps its
 * complete player-facing opening in `prompt` rather than `title`.
 */
export const ENCOUNTER_OPENING_TRAVEL_KO: Record<string, string> = {
  // Bog travel, pp.74–77
  'travel-bog-a-2': '해 질 녘이나 동틀 무렵의 희미한 빛 속을 터벅터벅 나아갑니다.',
  'travel-bog-3-4': '길가에서 한 야수가 썩은 잔해와 이끼를 색깔별로 가지런히 쌓고 있습니다.',
  'travel-bog-5-6': '물에 젖어 썩은 나무들이 거센 바람을 견디지 못하고 쓰러져 있습니다.',
  'travel-bog-7-8': '날씨가 뜻밖의 방향으로 돌변합니다.',
  'travel-bog-9-10-spring': '늪은 으스스하고 쓸쓸한 곳이 될 수 있습니다.',
  'travel-bog-9-10-summer': '얕은 물을 헤치고 나온 뒤, 몸에 끔찍한 거머리가 들러붙은 것을 발견합니다! 어떻게 떼어 낼까요? 뜻밖의 수확 — Leech(거머리) 영약재를 얻습니다. 어떻게 보관하나요?',
  'travel-bog-9-10-autumn': '작은 야수들(생쥐, 쥐, 들쥐 따위)이 커다란 호박을 임시 카페로 꾸미고 온갖 음료와 식사를 내고 있습니다.',
  'travel-bog-9-10-winter': '황야 너머로 거수(Behemoth)가 지나간 흔적이 보이고, 공기에는 갓 흘린 피 냄새가 감돕니다.',
  'travel-bog-j-spring': '명랑한 공예가들이 도예 수업을 여는 곳과 마주칩니다.',
  'travel-bog-j-summer': '개구리 한 마리가 젖은 진흙 속에 몸을 묻고 작은 갈대로 숨 쉬는 모습이 보입니다.',
  'travel-bog-j-autumn': '썩은 나무껍질과 질척한 토탄을 헤치다 처음 보는 버섯을 발견합니다.',
  'travel-bog-j-winter': '근처 나무 사이에서 몸이 반쯤 파랗게 질리고 기진맥진한 어린 야수를 발견합니다.',
  'travel-bog-m-spring': '겨울의 마지막 서리가 아직 남아, 늪 한쪽이 단단히 얼어 손쉽게 건널 수 있습니다.',
  'travel-bog-m-summer': 'Bristley Woods의 늪을 일부러 찾는 야수는 공예가와 약제사 정도뿐입니다.',
  'travel-bog-m-autumn': '',
  'travel-bog-m-winter': '',

  // Forest travel, pp.78–81
  'travel-forest-a-2': '',
  'travel-forest-3-4': '숲에 들어선 지 얼마 지나지 않아 여행자의 모닥불이 보입니다.',
  'travel-forest-5-6': '길가에 여러 야수가 모여 소문을 나누고 있습니다.',
  'travel-forest-7-8': '길에서 조금 벗어난 곳의 티탄 물건 주변에 야수들이 모여 있습니다.',
  'travel-forest-9-10-spring': '기분 좋은 바람이 나무 사이를 지나며, 숲은 몇 달 만에 처음으로 생기를 되찾은 듯합니다.',
  'travel-forest-9-10-summer': '날씨가 험악해져 밤을 보낼 피난처를 찾아야 합니다.',
  'travel-forest-9-10-autumn': '숲길을 걷던 중, 동료 여행자가 커다란 날개를 흔들어 인사합니다.',
  'travel-forest-9-10-winter': '북쪽의 추운 땅에서 이주해 온 야수가 물자를 채울 가장 가까운 도시로 가는 길을 묻습니다.',
  'travel-forest-j-spring': '겁에 질린 야수들이 앞길을 막고 더는 이 길로 가지 말라고 합니다.',
  'travel-forest-j-summer': '숲속 작은 개울가의 여름 바비큐에서 숯불에 지글거리는 생선 기름 냄새가 풍겨 옵니다.',
  'travel-forest-j-autumn': '앞길은 성가실 만큼 질척하고 지나가기 싫어 보입니다.',
  'travel-forest-j-winter': '진창에 찍힌 거대한 발자국은 최근 이곳을 거수가 지나갔음을 분명히 보여 줍니다.',
  'travel-forest-m-spring': '알록달록한 옷을 입고 즐거운 노래를 부르는 야수 무리와 마주칩니다.',
  'travel-forest-m-summer': '어린 야수들이 머리 위 수관의 가지 사이에 몸놀림 훈련 코스를 만들고 있습니다.',
  'travel-forest-m-autumn': '누군가 떨어뜨린 장신구가 진흙에 반쯤 묻혀 있습니다.',
  'travel-forest-m-winter': '굶주린 야수들이 겨울 추위를 버틸 무언가를 찾아 나무 뒤에서 모습을 드러냅니다.',

  // Loch travel, pp.82–85
  'travel-loch-a-2': '물살이 너무 거세 도저히 버틸 수 없습니다.',
  'travel-loch-3-4': '물속에서 무언가의 끝자락이 몸을 스칩니다.',
  'travel-loch-5-6': '커다란 물고기 한 마리가 아래로 지나가고, 춤추는 물빛 속에서 비늘이 반짝입니다.',
  'travel-loch-7-8': '갑자기 불어난 물살이 몸을 들어 휩쓸고 갑니다! 카드 한 장을 뽑아 물살이 이동을 돕는지 방해하는지 확인하세요.',
  'travel-loch-9-10-spring': '물에 익숙하지 않은 야수 하나가 천천히 가라앉는 유목 조각에 매달려 있습니다.',
  'travel-loch-9-10-summer': '거친 밧줄로 묶은 통나무 뗏목이 비버 선원들을 태운 채 느긋하게 떠내려옵니다.',
  'travel-loch-9-10-autumn': '운이 다했습니다. 이 물길은 Hornweed(마름풀)로 꽉 막혀 있습니다.',
  'travel-loch-9-10-winter': '깨끗한 얼음판 위로 스케이트 자국이 이리저리 교차해 있습니다.',
  'travel-loch-j-spring': '재주를 뽐내는 물새 한 마리가 무리 앞에서 경주를 걸어 옵니다.',
  'travel-loch-j-summer': '해골 깃발을 단 배 한 척이 고함치는 야수들을 싣고 이쪽으로 다가옵니다.',
  'travel-loch-j-autumn': '혼란에 빠져 죽어 가는 커다란 말벌 한 마리가 물 위까지 떠밀려 왔습니다.',
  'travel-loch-j-winter': '매서운 바람과 얼음장 같은 물이 사기를 갉아먹고 마음까지 쓰라리게 합니다.',
  'travel-loch-m-spring': '야수 선원들이 눈부시게 아름다운 배를 타고 곁을 지나갑니다.',
  'travel-loch-m-summer': '청록색 조류가 이곳 수면을 뒤덮고 있습니다.',
  'travel-loch-m-autumn': '병사 둘을 태운 작은 배가 다가와 이 물에서 위험한 야수를 보았느냐고 묻습니다.',
  'travel-loch-m-winter': '먼 추운 나라에서 온 기러기들이 호수와 강을 건너는 야수들에게 따뜻한 음료를 나누어 줍니다. 왜 이런 일을 하고 있을까요? 어느 추운 땅에서 왔을까요? 음료는 어떤 맛인가요?',

  // Meadow travel, pp.86–89
  'travel-meadow-a-2': '',
  'travel-meadow-3-4': '지나가던 제빵사가 길에서 먹으라며 구운 음식을 건네고, 대가는 한사코 받지 않습니다.',
  'travel-meadow-5-6': '석공들이 일하는 소리가 초원 멀리까지 울려 퍼집니다.',
  'travel-meadow-7-8': '지나가던 Noonmessenger(정오 전령)의 가방에서 무언가 떨어졌지만, 전령은 알아채지 못했습니다.',
  'travel-meadow-9-10-spring': '장난감 검을 든 들쥐 아이가 길을 막고 장난스럽게 통행세를 요구합니다.',
  'travel-meadow-9-10-summer': '거대한 멧돼지들이 목초지를 헤집으며 정성껏 일군 밭과 굴을 망가뜨리고 있습니다.',
  'travel-meadow-9-10-autumn': '비가 쉼 없이 쏟아져 온몸을 적시고 흙길을 진창으로 만듭니다.',
  'travel-meadow-9-10-winter': '야수들이 쓰러진 통나무 위에서 ‘나뭇가지 위의 거수’ 놀이를 하고 있습니다.',
  'travel-meadow-j-spring': '겨울을 피해 남쪽으로 떠났던 새 가족이 날개를 쉬려고 이곳에 머물고 있습니다.',
  'travel-meadow-j-summer': '우호적인 벌집지기가 윙윙거리는 벌 떼 곁으로 다가오는 당신을 맞이합니다.',
  'travel-meadow-j-autumn': '여러 마차와 여행자들이 앞쪽에 야영지를 꾸렸습니다.',
  'travel-meadow-j-winter': '누군가 길가에 눈으로 야수 하나를 만들어 두었습니다.',
  'travel-meadow-m-spring': '온갖 야수들이 씨를 뿌리고 땅을 일구느라 분주합니다.',
  'travel-meadow-m-summer': '이동 상인 마을 Baile bò(발러 보)가 이 초원에 머물렀습니다. 이 목가적인 정착지를 안장에 얹고 다니는 커다란 하일랜드 소가 풀을 뜯는 동안, 쥐 상인들은 물건과 손님을 위해 옆구리로 밧줄과 사다리를 내립니다. 작은 마을에는 어떤 소리와 냄새가 가득한가요? 들어가기에는 몸집이 너무 크다면 소는 어떻게 반응할까요? 상인들은 물건을 어떻게 보여 주나요?',
  'travel-meadow-m-autumn': '수확이 한창이라 밭 가장자리에 채소와 곡식 상자가 높이 쌓여 있습니다.',
  'travel-meadow-m-winter': '들판에는 발자국 하나 없이 눈이 두껍게 쌓여 있습니다.',

  // Mountain travel, pp.90–93
  'travel-mountain-a-2': '날씨가 뜻밖의 방향으로 돌변합니다.',
  'travel-mountain-3-4': '',
  'travel-mountain-5-6': '오래된 티탄 표식에 기호와 글자가 새겨져 있지만, 이제 그 뜻을 아는 것은 까치들뿐입니다.',
  'travel-mountain-7-8': '여정이 고되어 당신이나 동행이 곧 쉬어야 할 듯합니다.',
  'travel-mountain-9-10-spring': '산비탈이 빽빽한 가시금작화 덤불로 뒤덮여 있습니다.',
  'travel-mountain-9-10-summer': '산길의 다음 굽이를 돌기 전부터 흥겨운 콧노래가 들립니다.',
  'travel-mountain-9-10-autumn': '작은 골짜기를 지나던 중, 불한당 무리가 가장 가까운 정착지를 해칠 일을 꾸미는 소리를 엿듣습니다.',
  'travel-mountain-9-10-winter': '',
  'travel-mountain-j-spring': '거칠고 씩씩해 보이는 야수 무리가 산길 위쪽에서 다가옵니다.',
  'travel-mountain-j-summer': '물은 사방에 보이는데 마실 물은 한 방울도 없습니다.',
  'travel-mountain-j-autumn': '',
  'travel-mountain-j-winter': '썰매를 든 채 근처 비탈을 내려다보는 불안한 야수와 마주칩니다.',
  'travel-mountain-m-spring': '길가로 흐르는 봄철 눈 녹은 물이 무척이나 시원하고 맛있어 보입니다.',
  'travel-mountain-m-summer': '수레를 고치려 애쓰는 길드 야수와 마주칩니다.',
  'travel-mountain-m-autumn': '돋아나는 약초 냄새를 맡아 보는 이 지역의 채집가와 길에서 마주칩니다.',
  'travel-mountain-m-winter': '굵은 눈발이 산비탈을 휘감아 좁은 길과 가파른 흰 비탈의 경계를 거의 지워 버립니다.',

  // Soar travel, pp.94–97
  'travel-soar-a-2': '갑작스러운 옆바람이 날개 아래를 파고들어 목표에서 점점 멀리 밀어냅니다.',
  'travel-soar-3-4': '빠른 바람이 목적지를 향해 힘들이지 않고 나아가도록 등을 밀어 줍니다.',
  'travel-soar-5-6': '날갯짓할 때마다 무언가가 점점 헐거워지며 달그락거리는 느낌이 듭니다.',
  'travel-soar-7-8': '알맞은 상승기류를 타고 날던 중, 아래에서 붉고 갈색인 깃털 뭉치가 필사적으로 퍼덕이는 모습이 보입니다.',
  'travel-soar-9-10-spring': '차가운 공기와 낮게 깔린 구름이 잘 기름 먹인 옷까지 축축하게 적시는 높이에서, 중력의 지배를 벗어나 날아갑니다.',
  'travel-soar-9-10-summer': '',
  'travel-soar-9-10-autumn': '',
  'travel-soar-9-10-winter': '',
  'travel-soar-j-spring': '하늘을 미끄러지듯 날던 중, 시야 가장자리의 짙은 회색 점이 점점 커집니다.',
  'travel-soar-j-summer': '햇살이 낮게 깔린 구름 사이로 느릿한 안개 자락을 하늘로 끌어올립니다.',
  'travel-soar-j-autumn': '숲과 산 위로 높이 오르자 사방을 두른 지평선이 막힘없이 펼쳐집니다.',
  'travel-soar-j-winter': '',
  'travel-soar-m-spring': '방향을 확인하려고 땅을 내려다보다가 무언가 이상한 광경을 발견합니다.',
  'travel-soar-m-summer': '방향을 확인하려고 땅을 내려다보다가 무언가 이상한 광경을 발견합니다.',
  'travel-soar-m-autumn': '울부짖는 바람이 날갯짓 하나하나를 같은 힘으로 밀어내며 정면으로 들이칩니다.',
  'travel-soar-m-winter': '',

  // Titan travel, pp.98–99
  'travel-titan-a-2': '기묘한 티탄 유적의 벽을 오르다 상자를 넘어뜨려 사나운 공포를 풀어 놓고 맙니다! 그것은 이빨을 딱딱거리며 쫓아오다가… 멈춥니다. 자세히 보니 어딘가 귀엽기도 합니다. 이 조그만 녀석은 어떤 곤충을 닮았나요? 어떤 이름을 붙일까요?',
  'travel-titan-3-4': '유적 바깥에서 작은 야수 백 마리도 들어갈 만큼 거대한 천막을 발견합니다.',
  'travel-titan-5-6': '알 수 없는 이유로 티탄은 음식을 금속 통에 보관하곤 했습니다.',
  'travel-titan-7-8': '',
  'travel-titan-9-10': '',
  'travel-titan-j': '',
  'travel-titan-m': ''
};

/**
 * Exact English prompt prefixes already absorbed into a complete Korean
 * opening above. A caller should remove only these verified prefixes before
 * passing the remainder through the ordinary prompt localization path.
 */
export const ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX: Record<string, string> = {
  'travel-bog-9-10-summer': '. How do you store it?',
  'travel-bog-9-10-autumn': "(mice, rats, voles, and such) have turned a large pumpkin into a temporary cafe; they're serving all manner of drinks and meals.",
  'travel-loch-m-winter': '. Why are they doing this? What cold land are they from? What does their drink taste like?',
  'travel-meadow-7-8': 'Something falls out of a passing Noonmessenger’s satchel.',
  'travel-meadow-m-summer': 'ò has stopped in this meadow. The great highland cow that carries this pastoral settlement upon its saddle is grazing while rat merchants lower ropes and ladders down its sides for goods and guests. What sounds and smells are there in the little town? If you are too big to enter, how does the cow react to you? How do the merchants show you their wares?',
  'travel-titan-a-2': "... it stops? Now that you're looking at it, it's cute, in a way. What insect does this tiny critter look like? What do you name it?"
};
