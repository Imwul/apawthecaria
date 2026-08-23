// Social encounter extraction rows keep the printed heading and the opening
// narrative in the same `title` field. These hand-authored lines restore only
// that opening narrative; the remaining prompt and its rules stay untouched.
// Empty strings are intentional for the two rows whose title contains only the
// printed heading.
export const ENCOUNTER_OPENING_SOCIAL_KO: Record<string, string> = {
  'social-bog-settlement-♥': '굵고 무성한 갈대 다발이 땅 위로 푸른 창처럼 솟아 있습니다.',
  'social-bog-settlement-♦': '늪지 야수들은 “늪이 받은 것은 늪이 돌려준다”는 지혜를 자주 입에 올립니다.',
  'social-bog-noonhill-♥': '크고 요란한 윙윙거림이 서서히, 그러나 분명히 당신 쪽으로 다가옵니다.',
  'social-bog-noonhill-♦': '탁한 회색 화분들이 진흙땅에 반쯤 잠긴 채, 야생화로 뒤덮인 나무 기둥 위의 오두막을 에워싸고 있습니다.',
  'social-bog-spring-♣': '이끼가 걸러 낸 작은 물줄기들이 흘러드는 근처 연못의 수면이 거의 소리 없이 보글거립니다.',
  'social-bog-spring-♠': '',
  'social-bog-summer-♣': '주변 공기가 점점 습해지더니, 물에 잠긴 것도 있고 작은 불 위에 놓인 것도 있는 기묘한 구리 용기들을 돌보는 야수에게 다다릅니다.',
  'social-bog-autumn-♣': '정착지 가장자리에서 주민들이 폭신한 이끼 뭉치를 나무 말뚝에 묶는 모습을 지나칩니다.',
  'social-bog-summer-♠': '조금 앞에서 느긋한 신음 소리가 들립니다. 차가운 진흙 사이로 드문 뜨거운 바위 위에서, 일광욕 중인 도마뱀이 지글지글 몸을 데우며 천천히 뒤집고 있습니다.',
  'social-bog-autumn-♠': '앞길에서 들려온 짧은 환호에 시선이 끌립니다.',
  'social-bog-winter-♣': '질척이는 진흙 벌판에서 주민 한 무리가 갈대 둑을 베고 파헤치는 모습이 보입니다.',
  'social-bog-winter-♠': '거대한 왜가리 한 마리가 이 정착지를 둘러싼 반쯤 언 습지를 신중한 걸음으로 가로지릅니다.',

  'social-forest-settlement-♥': '모든 야수가 나무껍질을 타고 재빠르게 오르내릴 수 있는 것은 아닙니다.',
  'social-forest-settlement-♦': '나무들은 자연스레 가지 끝이 이웃 나무에 살짝 닿을 만큼 가까이 자랍니다.',
  'social-forest-odoak-♦': '세계 각지에서 온 페어윈드 새들이 페들바우에 들러 이국의 물건을 팔고 갑니다.',
  'social-forest-odoak-♥': '오도악의 굵은 가지 아래마다 분주한 대장간이 자리합니다.',
  'social-forest-spring-♣': '봄이 오면 새싹이 돋고 가지가 갈라지며 깃털 같은 꽃이 만발합니다.',
  'social-forest-summer-♠': '장인발 길드 지부에서는 숲속 비행을 혁신할 것이라 장담하는 온갖 장치를 시험하고 있습니다.',
  'social-forest-summer-♣': '숲에서는 작은 벌레들을 경주시키며 누가 가장 멀리 기어가는지, 누가 가장 빨리 고치를 완성하는지 내기하는 놀이가 인기입니다.',
  'social-forest-spring-♠': '활짝 피려는 꽃봉오리는 특히 겨울 저장 식량의 남은 재료와 함께 쓰면 훌륭한 별미가 됩니다.',
  'social-forest-autumn-♠': '가을이 오면 많은 식물과 나무가 휴면에 들고 버섯이 피어나기 시작합니다.',
  'social-forest-winter-♣': '겨울이면 야수들은 숲 바닥에 임시 한증막을 세웁니다.',
  'social-forest-winter-♠': '겨울에는 잎이 드문 탓에 숲의 야수 대부분이 집 가까이에 머무릅니다.',
  'social-forest-autumn-♣': '가시덤불은 거수를 막아 주는 훌륭한 장벽이자, 새콤하고 풍성한 열매를 내는 먹거리입니다.',

  'social-loch-settlement-♦': '물에 발 담그는 일로 이름난 버들공예 길드원들이 물가에 반원 모양으로 둘러앉아 있습니다.',
  'social-loch-settlement-♥': '선착장을 지나던 중 갓 손질한 생선 냄새와 부지런히 일한 야수들의 땀 냄새가 풍깁니다.',
  'social-loch-newdam-♥': '망치질과 톱질 소리, 공기 중에 감도는 싱싱한 수액 맛과 갓 자른 나무 냄새가 조선소를 지나는 모든 야수의 감각을 압도합니다.',
  'social-loch-newdam-♦': '부두에서 둑 위로 올라가면 지붕이 열린 커다란 점토 건물 ‘화분들’이 나옵니다.',
  'social-loch-vessel-♥': '베슬의 티탄 방들은 흰 자기로 된 입구 홀과 금속 터널망으로 편리하게 이어져 있습니다.',
  'social-loch-vessel-♦': '이 유서 깊은 배 밖에는 부교와 선상 가옥, 비좁은 모임터가 빽빽한 판자촌 ‘막대기들’이 펼쳐져 있으며, 야수들은 베슬의 그늘 아래에서 살아갑니다.',
  'social-loch-spring-♣': '첨벙이는 소리와 놀란 숨소리에 깜짝 놀랍니다.',
  'social-loch-spring-♠': '근처 배의 뱃머리에 앉아 발을 물에 담근 야수 하나가 연어의 커다랗고 단단한 뼛조각을 깎고 있습니다.',
  'social-loch-summer-♠': '발걸음에 맞춰 규칙적인 ‘싹둑’ 소리가 들려옵니다.',
  'social-loch-summer-♣': '장난스러운 비명과 환호, 첨벙이는 소리에 물 쪽으로 시선이 끌립니다.',
  'social-loch-autumn-♣': '톡, 톡, 딱! 톡, 톡, 딱! 현지 야수 하나가 근처의 넓적한 바위에서 민물조개를 규칙적으로 두드려 까고, 조갯살은 물이 담긴 나무 양동이에 넣고 있습니다.',
  'social-loch-autumn-♠': '타는 참나무와 말라가는 생선의 진한 냄새가 잠시 감각을 압도합니다.',
  'social-loch-winter-♠': '나무껍질 부교를 걷다가 발아래에서 여러 야수가 노래하는 소리를 듣습니다.',
  'social-loch-winter-♣': '발밑의 두꺼운 얼음에 규칙적으로 땅을 파는 듯한 맑은 진동이 울립니다.',

  'social-meadow-settlement-♥': '화려한 겉옷을 입은 야수가 손짓해 당신을 부릅니다.',
  'social-meadow-settlement-♦': '초원 정착지는 자연 지형에 기대어 자리 잡아 세월이 흘러도 좀처럼 옮겨 가지 않습니다.',
  'social-meadow-summit-♥': '서밋의 터널은 황금빛 기름등과 환기구로 스며드는 가느다란 회색 햇살에 밝혀져 있습니다.',
  'social-meadow-summit-♦': '둘 이상의 터널이 만나는 교차로마다 위와 아래, 혹은 앞쪽 터널로 가려는 야수들이 한데 몰려 북적입니다.',
  'social-meadow-spring-♠': '섬세하고 화려한 꽃봉오리 하나가 주변의 두꺼운 여러해살이풀 잎 아래에서 고개를 내밉니다.',
  'social-meadow-spring-♣': '벌집지기 하나가 서로 윙윙대고 뒤엉켜 침을 쏘는 벌들을 필사적으로 떼어 놓으려 애쓰는 모습을 마주칩니다.',
  'social-meadow-summer-♠': '길먼지 얼룩과 앞발로 셀 수 없을 만큼 많은 튼튼한 덧댄 자국이 가득한 크림색 천막 하나가 정착지의 공동 공간에 떡하니 세워져 있습니다.',
  'social-meadow-summer-♣': '어린 야수 여럿이 근처 집 창문에 섬세한 거미줄을 짜는 풀거미를 유심히 바라보고 있습니다.',
  'social-meadow-autumn-♣': '',
  'social-meadow-autumn-♠': '나무껍질 조각을 엮어 만든 가판대를 스쳐 지나갑니다.',
  'social-meadow-winter-♣': '나이 든 야수 하나가 끙끙 고민하며, 자기 몸집만큼 커다란 책을 넘기는 동안 발을 까딱거립니다.',
  'social-meadow-winter-♠': '앞길의 진창을 가로질러 선명하고 갓 생긴 발자국들이 이어집니다.',

  'social-mountain-settlement-♥': '산은 아래쪽 숲의 울창함과 초원의 풍요로움에 비하면 자원이 빈약한 곳입니다.',
  'social-mountain-settlement-♦': '산악 정착지의 집들은 서로 멀리 떨어져 단절된 듯 느껴질 때가 있습니다.',
  'social-mountain-spoolkeep-♥': '낮이면 아마 가공 길드 일꾼들이 거친 섬유를 두드리고, 크기와 굵기가 제각각인 리넨 실뭉치로 잣는 소리가 들립니다.',
  'social-mountain-spoolkeep-♦': '스풀킵 북쪽 먼 산, 독수리만 감히 날아오를 법한 곳에 염소 부족들이 삽니다.',
  'social-mountain-spring-♣': '졸린 얼굴의 야수들이 무리 지어 마을 가장자리로 터덜터덜 걸어갑니다.',
  'social-mountain-summer-♣': '낮게 으르렁대는 진동이 발밑의 흙과 바위를 뒤흔듭니다.',
  'social-mountain-spring-♠': '날카로운 바위 돌출부의 곡면은 멀리 떨어진 두 야수가 서로 소리치면서도 또렷이 들을 수 있을 만큼 절묘합니다.',
  'social-mountain-summer-♠': '햇볕에 데워진 바위와 서풍이 만나 절벽 가장자리와 산비탈 위로 기분 좋은 상승기류를 만듭니다.',
  'social-mountain-autumn-♠': '상쾌하고 차가운 공기가 일하는 근육이 과열되지 않게 해 줍니다.',
  'social-mountain-autumn-♣': '맑은 물줄기가 정착지를 졸졸 가로지릅니다.',
  'social-mountain-winter-♣': '야수 여럿이 근처의 돌 발코니에 모여, 저 아래 나무 꼭대기 둘레를 소용돌이치는 차가운 안개를 바라봅니다.',
  'social-mountain-winter-♠': '매서운 찬바람이 정착지의 석조 회랑 사이로 날카롭게 울부짖습니다.',

  'social-glasswall-♥': '도시 밖 호숫가에 야수들이 만든 거대한 웅덩이가 있습니다.',
  'social-glasswall-♦': '어쩌면 낯익은 커다란 뇌조 하나의 실루엣이 작은 왈라비 벌집지기 둘 위로 드리워져 있습니다.',
  'social-glasswall-♣': '글래스월 북쪽에는 거대한 티탄 유물이 햇빛을 받아 도시의 생태 환경을 유지합니다.',
  'social-glasswall-♠': '매달린 나무 다리들이 글래스월의 수증기 자욱한 정원 사이로 여행자들을 안내합니다.'
};

// These source prefixes finish a sentence that begins in `title`. Consumers
// should remove the exact prefix before translating/rendering the remaining
// prompt so the hand-authored opening is not duplicated.
export const ENCOUNTER_OPENING_SOCIAL_PROMPT_PREFIX: Record<string, string> = {
  'social-bog-settlement-♦': ': "the Bogs gives what the Bog gets".',
  'social-bog-summer-♠': '— a sun- basking lizard slowly turns itself over on a sizzlingly hot rock, a rare feature to poke out of the cool wet mud around it.',
  'social-loch-newdam-♥': '; these senses overwhelm any beast moving through the dockyard.',
  'social-loch-newdam-♦': '; large clay-walled buildings with open roofs.',
  'social-glasswall-♦': 'capercaillie looms over two smaller wallaby Hivewardens.'
};
