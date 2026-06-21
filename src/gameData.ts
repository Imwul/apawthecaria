export interface Ailment {
  name: string;
  rawName: string;
  severity: 'lesser' | 'intermediate' | 'severe' | 'dire';
  timer: number;
  tags: string;
  description: string;
  outcome: string;
  consequence: string;
}

export interface Reagent {
  name: string;
  rawName: string;
  type: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN';
  br: number;
  regions: string[];
  seasons: string[];
  description: string;
  preps: string;
}

export interface Encounter {
  page: number;
  card?: string;
  suit?: string;
  title: string;
  text: string;
}

export const GAME_DATA = {
  "bioChoices": {
    "descriptors": [
      {
        "card": "A",
        "name": "수생 동물",
        "examples": "비버, 딱새, 도롱뇽, 개구리"
      },
      {
        "card": "2",
        "name": "노래하는 조류",
        "examples": "되새, 박새, 제비, 어치"
      },
      {
        "card": "3",
        "name": "땅파는 포유류",
        "examples": "오소리, 토끼, 고슴도치, 두더지"
      },
      {
        "card": "4",
        "name": "장난꾸러기 조류/포유류",
        "examples": "까마귀, 종다리, 칼새, 수달"
      },
      {
        "card": "5",
        "name": "털 많은 포유류",
        "examples": "청서, 땃쥐, 멧밭쥐"
      },
      {
        "card": "6",
        "name": "비늘 있는 파충류",
        "examples": "장님뱀, 살모사"
      },
      {
        "card": "7",
        "name": "발톱이 있는 맹수/조류",
        "examples": "삵, 황조롱이, 족제비"
      },
      {
        "card": "8",
        "name": "햇볕을 즐기는 동물",
        "examples": "담비, 도마뱀, 갈매기, 비둘기"
      },
      {
        "card": "9",
        "name": "별빛에 춤추는 야행성",
        "examples": "박쥐, 여우, 쥐, 쏙독새"
      },
      {
        "card": "10",
        "name": "진흙에 사는 조류/양서류",
        "examples": "뜸부기, 두꺼비, 도롱뇽"
      },
      {
        "card": "J",
        "name": "눈에 띄지 않는 동물",
        "examples": "바위종다리, 금눈쇠부엉이, 들쥐"
      },
      {
        "card": "M",
        "name": "위엄 있는 조류/포유류",
        "examples": "맷닭, 소나무담비"
      }
    ],
    "travelStyles": [
      {
        "suit": "♥",
        "name": "천천히 꾸준하게",
        "speed": 2,
        "carry": 5,
        "desc": "느긋하게 풍경을 감상하며 느리지만 튼튼하게 이동합니다."
      },
      {
        "suit": "♦ / ♣",
        "name": "방랑하며 든든하게",
        "speed": 3,
        "carry": 4,
        "desc": "산과 호수를 가볍게 넘나들며 하이킹할 준비가 되어 있습니다."
      },
      {
        "suit": "♠",
        "name": "빠르고 대담하게",
        "speed": 4,
        "carry": 3,
        "desc": "덤불을 뚫고 숲을 가로질러 위험을 개의치 않고 달려갑니다."
      },
      {
        "suit": "선택",
        "name": "가볍고 신속하게",
        "speed": 5,
        "carry": 2,
        "desc": "날개를 활짝 펴고 기류를 타며 소리 없이 활공합니다. (비행 가능)"
      }
    ],
    "origins": [
      {
        "suit": "♥",
        "name": "지나가는 약제사의 영감",
        "desc": "이 길을 스쳐간 노련한 약제사가 남긴 인상적인 의술의 영향을 받았습니다."
      },
      {
        "suit": "♦",
        "name": "늙은 약제사의 조수 모집",
        "desc": "나이 든 약제사를 도와 숲속의 영약재를 찾는 조수로 의술을 배웠습니다."
      },
      {
        "suit": "♣",
        "name": "격렬한 부상 치료 경험",
        "desc": "야수와의 마주침에서 입은 끔찍한 부상을 치료받으며 약초의 위대함을 알게 되었습니다."
      },
      {
        "suit": "♠",
        "name": "사고 후의 치료 서비스",
        "desc": "큰 사고를 겪고 약제사의 도움을 받으면서 약제사의 길을 걷기로 결심했습니다."
      }
    ],
    "familiars": [
      {
        "card": "A",
        "name": "덤불 마스터",
        "desc": "식물 영약재의 희귀도 -2"
      },
      {
        "card": "2",
        "name": "따뜻한 약제사",
        "desc": "모든 질병 치료 시작 타이머 +2시간"
      },
      {
        "card": "3",
        "name": "용감한 동반자",
        "desc": "거대 야수와의 위험 조우를 긍정적으로 해결하고 영약재를 획득"
      },
      {
        "card": "4",
        "name": "말동무",
        "desc": "물꼬 거래 시, 원하는 영약재의 기본 희귀도 -2"
      },
      {
        "card": "5",
        "name": "빈틈없는 계산기",
        "desc": "치료제를 장신구로 교환할 때 장신구 +1 획득"
      },
      {
        "card": "6",
        "name": "힘센 일꾼",
        "desc": "소지량 +2 (수레가 있을 경우 +4)"
      },
      {
        "card": "7",
        "name": "자원 기획가",
        "desc": "희귀도 7 이하 영약재 하나를 지정하여 지역과 상관없이 채집 가능"
      },
      {
        "card": "8",
        "name": "베테랑 길잡이",
        "desc": "여정 조우 드로우 시 2장을 뽑아 원하는 카드를 선택"
      },
      {
        "card": "9",
        "name": "예리한 관찰자",
        "desc": "질병 치료 시작 시 채집 포인트 +2 획득"
      },
      {
        "card": "10",
        "name": "자유로운 영혼",
        "desc": "환자 치료마다 1회, 인접한 위치에서 위험 없이 채집을 보냄"
      },
      {
        "card": "J",
        "name": "유적/고분 마스터",
        "desc": "티탄 영약재의 희귀도 -2, 티탄 유적 및 고분에서 드로우 2장 중 선택"
      },
      {
        "card": "M",
        "name": "엉뚱한 조수",
        "desc": "기본 도구 중 하나의 기능을 조수가 직접 수행해 줍니다."
      }
    ],
    "relationships": [
      {
        "card": "A",
        "name": "우연한 만남",
        "desc": "최근까지 서로 몰랐으나, 지금은 급속도로 친해졌습니다."
      },
      {
        "card": "2",
        "name": "깊은 유대",
        "desc": "서로 사랑하며 함께 있을 때 더 힘을 냅니다."
      },
      {
        "card": "3",
        "name": "공동 작당",
        "desc": "공동의 프로젝트나 큰 야망을 함께 달성하고자 뭉쳤습니다."
      },
      {
        "card": "4",
        "name": "스승과 제자",
        "desc": "고집스러운 면도 있지만 지혜로운 조언이 늘 힘이 됩니다."
      },
      {
        "card": "5",
        "name": "상처 보듬기",
        "desc": "비슷한 상처나 무서운 과거로부터 함께 도망치는 중입니다."
      },
      {
        "card": "6",
        "name": "매력적인 파트너",
        "desc": "종잡을 수 없는 면이 나를 매료시키고 서로 흥미로워합니다."
      },
      {
        "card": "7",
        "name": "가장 오래된 친구",
        "desc": "어릴 적부터 함께 자라 서로의 부끄러운 비밀을 모두 압니다."
      },
      {
        "card": "8",
        "name": "피의 맹세",
        "desc": "다시는 입밖에 내지 않기로 약속한 어두운 비밀을 공유합니다."
      },
      {
        "card": "9",
        "name": "형제자매",
        "desc": "가끔은 답답하고 부딪히지만 가족이나 다름없습니다."
      },
      {
        "card": "10",
        "name": "과거의 연인",
        "desc": "이전에 깊은 아픔을 겪고 다시 만난 애틋한 관계입니다."
      },
      {
        "card": "J",
        "name": "마음속에만 남은 이",
        "desc": "이미 세상을 떠났거나 만날 수 없지만 마음속에서 속삭입니다."
      },
      {
        "card": "M",
        "name": "부모 같은 관계",
        "desc": "나를 거둬 기르고 둥지를 떠난 뒤에도 늘 과보호로 감싸 안습니다."
      }
    ]
  },
  "goals": [
    {
      "card": "A",
      "title": "자아 성찰",
      "desc": "나에게 일어난 변화를 되돌아보기 위해 여행합니다.",
      "goalText": "여정 중 만난 생물/야수와의 조우 3번 기록하기"
    },
    {
      "card": "2",
      "title": "동반자 우대",
      "desc": "여행을 통해 소원해진 길동무와의 소통을 다시 늘립니다.",
      "goalText": "길동무에 대한 저널 기록 3번 이상 남기기"
    },
    {
      "card": "3",
      "title": "길드의 책임",
      "desc": "길드 선배들의 업적을 기리고 명성을 크게 쌓습니다.",
      "goalText": "길드 명성 +5 이상을 가진 채로 여정 마치기"
    },
    {
      "card": "4",
      "title": "자연 조사",
      "desc": "동료들의 요청으로 특정 기후 및 지역의 약초 성장을 관찰합니다.",
      "goalText": "같은 종류의 지역 위치 3곳에서 저널 작성하기"
    },
    {
      "card": "5",
      "title": "긴급 치료",
      "desc": "먼 곳에서 심한 병마를 앓고 있는 다른 야수를 도우러 떠납니다.",
      "goalText": "가치가 3인 [상처, 감염, 수면] 영약재를 챙겨 목적지에 도착하기"
    },
    {
      "card": "6",
      "title": "영감 수집",
      "desc": "지루하고 늙어가는 고향에 새로운 생기를 불어넣기 위해 여러 약초를 수집합니다.",
      "goalText": "각 지역(6대 지역)에서 식물 영약재를 하나씩 채집하기"
    },
    {
      "card": "7",
      "title": "의학 연구 자료",
      "desc": "사지나 부리, 비늘의 구조적 질병을 조사해 동료 약제사에게 보냅니다.",
      "goalText": "[비늘, 깃털, 털] 관련 질병 3개 이상 완치하기"
    },
    {
      "card": "8",
      "title": "호송 및 정의",
      "desc": "죄를 지어 길드에서 쫓겨난 범죄 동물을 안전한 도시로 호송합니다.",
      "goalText": "수송 증거물(Evidence, 무게 1/3)을 챙겨 안전하게 목적지에 도착하기"
    },
    {
      "card": "9",
      "title": "영약 보충",
      "desc": "은퇴한 길드 조력자의 요청으로 개인 비축용 약재를 모아 갑니다.",
      "goalText": "동일한 약효 태그를 가진 영약재 3개를 챙겨 목적지에 도착하기"
    },
    {
      "card": "10",
      "title": "마음의 정리",
      "desc": "해결되지 못한 오랜 갈등을 매듭짓기 위한 여정을 떠납니다.",
      "goalText": "개인적인 갈등을 저널에 3번 이상 기록하며 여행하기"
    },
    {
      "card": "J",
      "title": "마지막 작별",
      "desc": "세상을 떠날 준비를 하는 오랜 친구에게 마지막 인사를 건네기 위해 떠납니다.",
      "goalText": "최소 [저편/사망 2] 가치를 가진 영약재를 목적지에 전달하기"
    },
    {
      "card": "M",
      "title": "방랑벽",
      "desc": "온 사방에 거센 바람이 불어 야생의 길을 모험하고 싶은 열망에 가득 찼습니다.",
      "goalText": "수렁, 숲, 호수, 초원, 산맥에서 각각 저널을 한 번 이상 남기기"
    }
  ],
  "ailments": [
    {
      "name": "발썩음 병 (Paw Rot)",
      "rawName": "Paw Rot",
      "severity": "lesser",
      "timer": 9,
      "tags": "INFECTION 1 및 PAIN 1",
      "description": "축축한 흙 위를 며칠이고 걸어 다닌 탓에, 이 야수의 발가락 사이 막이 가렵고 부어올랐습니다. 몇 주 동안 매일 정기적으로 무언가를 발라주면 나을 것입니다...",
      "outcome": "티 없이 깨끗하게: 만약 치료제가 보존된다면 - 이 오래 지속되는 연고 덕분에 이 감염병이 다시 발생했을 때 확실하게 치료할 수 있습니다. 다음번에 이 지역을 지날 때, 고마워하는 환자로부터 장신구 1개를 얻습니다.",
      "consequence": "짓밟힌 발: 그 자체로는 사소한 문제일 수 있지만, 이 야수는 꽤나 인기가 많습니다. 그가 또 누구에게 발썩음 병을 옮겼을까요? 다음번에 이 지역을 방문할 때 치료할 수 있는 유일한 질병은 발썩음 병뿐입니다."
    },
    {
      "name": "불안성 가려움증 (Anxious Scratching)",
      "rawName": "PAGE 104 --- Anxious Scratching",
      "severity": "lesser",
      "timer": 7,
      "tags": "MOOD 2 및 FUR 또는 FEATHER 또는 SCALE 1",
      "description": "지속적이고 가벼운 스트레스로 인해 이 야수는 지쳐버렸습니다. 털이나 깃털이 걷잡을 수 없이 빠지기 시작했습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "털 없는 신세: 야수가 완전히 털갈이를 해버립니다. 이제 그들은 어떤 신체적, 사회적 압박에 직면하게 될까요?"
    },
    {
      "name": "잘못된 아이디어 (Bad Idea)",
      "rawName": "Bad Idea",
      "severity": "severe",
      "timer": 6,
      "tags": "JOY 2, PAIN 2, WOUND 2",
      "description": "발명은 브리슬리 숲의 많은 야수들에게 중요한 취미이지만, 모든 아이디어가 좋거나 안전한 것은 아닙니다. 이 가여운 야수가 방금 깨달은 것처럼 말이죠. 치료와 기분 전환이 필요합니다. 그들의 발명품은 무엇이었고, 어떻게 다치게 되었나요? 당신의 치료제에 [독/악취] 성분이 들어가선 안 됩니다. 환자를 더 화나게 할 뿐이니까요.",
      "outcome": "영감: 만약 약효(3) 영약재로 이 질병을 해결한다면; 발명가는 크게 기뻐하며 당신의 기존 도구를 개조해주겠다고 제안합니다. 기본 도구 중 하나를 업그레이드하거나, 도구의 무게를 1/3 줄이세요.",
      "consequence": "포기: 발명 실패에 낙담한 그들은 열정을 잃고 발명을 완전히 포기합니다. 그들이 버려둔 청사진은 어떻게 될까요?"
    },
    {
      "name": "먹먹한 귀 (Blocked Ears)",
      "rawName": "PAGE 105 --- Blocked Ears",
      "severity": "intermediate",
      "timer": 6,
      "tags": "SENSES 2, TEMPERATURE 2,  \nINFECTION 1",
      "description": "네? 뭐라고요? 다시 말씀해주셔야겠어요. 급성 열병을 앓고 난 뒤 이 가여운 야수의 귀가 딱딱한 귀지로 꽉 막혀버렸습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "조용한 최후: 갑작스러운 감각 상실로 방향 감각을 잃은 이 가여운 야수는 포식자의 쉬운 먹잇감이 됩니다. 결국 그들을 덮친 것은 무엇이었을까요?"
    },
    {
      "name": "흡혈 본능 (Bloodthirst)",
      "rawName": "Bloodthirst",
      "severity": "severe",
      "timer": 6,
      "tags": "INSTINCT 3, STOMACH 3, SENSES 3",
      "description": "이 야수에게 끔찍한 굶주림이 깨어났습니다. 정신을 흐리게 만드는 무언가를 먹은 탓에, 고대의 본능이 사냥을 하라고 속삭입니다. 시간이 갈수록 저항하기가 힘들어집니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "야성의 발현: 본능의 안개 속에서 길을 잃은 그들은 결국 사냥을 시작합니다. 누군가를 덮쳤을까요? 아니면 누군가 그들을 저지했을까요?"
    },
    {
      "name": "낙인 상처 (Brand Care)",
      "rawName": "Brand Care",
      "severity": "intermediate",
      "timer": 6,
      "tags": "BURN 2, INFECTION 2, HIDE 1",
      "description": "한 야수가 길드 중 하나에 의해 위험한 범죄자로 낙인찍혀 집에서 쫓겨났습니다. 드러나고 물집이 잡힌 둥근 낙인 자국이 감염되었습니다.",
      "outcome": "동정심: 만약 이 야수를 치료하려 시도한다면; 추방된 무리와 어울렸다는 이유로 명성 2를 잃습니다. 이 야수의 사연은 무엇일까요? 왜 낙인이 찍혔을까요? 서둘러 챙겨 나온 소지품 중에서 그가 건넨 장신구는 무엇인가요?\n의무: 치료를 거부한다면; 길드 법을 수호한 공로로 명성 2를 얻습니다. 낙인찍힌 야수는 열병에 신음하며 야생으로 도망칩니다. 이에 대해 어떻게 느끼시나요?",
      "consequence": "조용한 흐름: 이 질병을 치료하지 못해도 머무는 시간이 초과(Overstay)되지는 않습니다."
    },
    {
      "name": "부러진 부리와 닳은 송곳니 (Broken Beaks and Thinning Fangs)",
      "rawName": "Broken Beaks and Thinning Fangs",
      "severity": "severe",
      "timer": 6,
      "tags": "PAIN 3, PAIN 2, STOMACH 3",
      "description": "충돌, 빗나간 쪼기, 혹은 싸움으로 인해 이 가여운 야수의 부리나 이빨이 부러졌습니다. 그들은 끊임없는 통증에 시달리며 음식을 먹기 위해 분투하고 있습니다.",
      "outcome": "송곳니 제작자 길드: 은 조각(Silver Shards)을 찾을 수 있다면, 환자를 위해 인공 의치나 왕관을 만들어 줄 수 있습니다. 그렇게 하면 명성 3을 추가로 얻습니다.",
      "consequence": "복합적인 문제: 스트레스와 영양 부족으로 인해 이 가여운 새는 다른 질병에 걸리고 맙니다. 명성 3을 잃습니다. 하루를 더 소모(Mark 1 Day)하고 질병을 하나 더 뽑아 계속 도울 수도 있으며, 그러지 않으면 환자는 목숨을 잃습니다."
    },
    {
      "name": "낙담한 깃털 (Crestfallen)",
      "rawName": "PAGE 106 --- Crestfallen",
      "severity": "lesser",
      "timer": 7,
      "tags": "FEATHER 2, NERVES 2 및 INSTINCT 2",
      "description": "모든 조류가 자신의 깃털 색에 만족하는 것은 아닙니다. 일부는 더 대담한 색을 원하거나, 포식자의 예리한 눈을 피해 자신을 위장하고 싶어 합니다. (필요 약효: [깃털 2, 기쁨 2 및 밝은 색상의 식물 영약재])",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "염색 실패: 환자가 스스로 깃털을 염색하려 시도하다가 처참하게 망쳐버립니다. 그리고 그 탓을 당신에게 돌립니다!"
    },
    {
      "name": "식은땀 (Dullsweats)",
      "rawName": "Dullsweats",
      "severity": "lesser",
      "timer": 9,
      "tags": "BREATH 1, SENSES 1, JOY 1",
      "description": "세상과 단절된 채 땀에 젖은 이불 속에서 너무 오랜 시간을 보낸 야수입니다. 코를 뚫어주고, 눈을 맑게 해주며, 기분을 고조시켜 줄 무언가를 원하고 있습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "기회의 창이 닫힘: 치료 기회가 지나가고, 우울증이 다시 이 야수를 어두운 굴속으로 끌어들입니다. 자취를 감춘 친구를 그리워하는 이는 누구일까요?"
    },
    {
      "name": "싸움 흔적 (Fight Marks)",
      "rawName": "Fight Marks",
      "severity": "dire",
      "timer": 6,
      "tags": "PAIN 2, WOUND 3, HIDE 3",
      "description": "자존심, 탐욕, 두려움 또는 이 모든 것이 결합되어 지역의 두 야수가 서로 격렬하게 싸워 큰 상처을 입혔습니다. 이것은 별도의 타이머를 가진 두 개의 질병으로 취급합니다. 한 야수가 싸움을 시작했지만, 두 야수 모두 누가 먼저 시작했는지 인정하려 하지 않습니다. 이 야수들이 누구인지, 그리고 누구를 먼저 치료할 것인지 저널에 기록하세요.",
      "outcome": "화해: 두 환자를 모두 치료하고 [기쁨 3] 영약재를 채집해 제공한다면; 치료 과정에서 두 환자 모두 마음을 열게 됩니다. 당신의 도움으로 그들은 대화를 나눕니다. 서로 공동의 이해에 도달할 수 있을까요?",
      "consequence": "해결되지 못한 비극: 한 야수를 치료하지 못하면 상처가 악화되어 저편으로 떠나버리고, 싸움은 해결되지 못한 채 남습니다. 두 야수 모두 사망하면 명성을 두 번 잃습니다."
    },
    {
      "name": "첫 열병 (Firstfever)",
      "rawName": "Firstfever",
      "severity": "lesser",
      "timer": 7,
      "tags": "INFECTION 1, HIDE 1, TEMPERATURE 1",
      "description": "많은 새끼 동물들이 겪는 가벼운 질병입니다. 이 열병을 이겨내면 나중에 걸릴 수 있는 더 위험한 수많은 열병에 대한 면역력을 얻게 됩니다. 많은 부모들이 집단 면역을 기르기 위해 '열병 파티'를 엽니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "가려운 반점: 가렵고 붉은 반점이 이 어린 새끼들을 괴롭히며, 무슨 짓을 해도 울음을 그치지 않습니다. 부모들의 잠 못 드는 밤에 대해 저널을 작성하세요."
    },
    {
      "name": "애틋한 작별 (Fond Farewell)",
      "rawName": "Fond Farewell",
      "severity": "lesser",
      "timer": 8,
      "tags": "ELSEWHERE 1, JOY 1",
      "description": "비극이 닥쳐 사랑받던 반려동물이 저편으로 떠났습니다. 이 야수는 반려동물을 제대로 보내줄 수 있도록 당신의 도움을 간절히 바라고 있습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "잊혀진 존재: 친구의 떠남을 기리는 의식이 제대로 치러지지 못해 어두운 감정이 환자를 사로잡습니다. 그들은 이 슬픔을 어떻게 극복할까요?"
    },
    {
      "name": "채집가의 경련 (Forager's Twitch)",
      "rawName": "Forager's Twitch",
      "severity": "intermediate",
      "timer": 7,
      "tags": "SENSES 2, MOOD 2, POISON 2",
      "description": "이 어리석은 야수가 이상한 버섯을 먹었습니다. 그 바람에 보이지 않는 것을 보게 되고 환각과 그림자에 깜짝깜짝 놀랍니다. 카드 한 장을 뽑아 그가 어떤 경험을 하고 있는지 확인하세요:\n♥ 또는 ♦: 좋은 환각 - 얌전히 제자리에 머물며 말썽을 피우지 않습니다.\n♣ 또는 ♠: 나쁜 환각 - 이 질병의 요구 사항에 [상처 1]을 추가합니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "환각의 끝: 환각에서 깨어난 그들은 당황스럽고 변해버린 자신을 느깁니다. 그들이 나누는 심오한 지혜나 말도 안 되는 헛소리는 무엇인가요?"
    },
    {
      "name": "대장간 불꽃 부상 (Forge Clawed)",
      "rawName": "Forge Clawed",
      "severity": "lesser",
      "timer": 8,
      "tags": "BURN 1, WOUND 1",
      "description": "뜨거운 금속을 직접 다루다 다쳤거나 그저 잘못된 시간에 잘못된 장소에 있었던 탓에, 이 야수는 뜨거운 불꽃을 온몸에 뒤집어썼습니다. 모피 위로 성난 화상 자국들이 가득하고 가죽이 노출되어 있습니다. 간단한 연고 처치면 충분할 것입니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "차가운 외면: 야수가 당신의 보살핌을 거절하고 화상을 방치한 채 가버립니다. 당신이 없는 사이 상처가 감염되고 진물이 흐르며 흉터가 남을 수도 있습니다."
    },
    {
      "name": "치명적인 속임수 버섯 (Foul Deceiver)",
      "rawName": "Foul Deceiver",
      "severity": "dire",
      "timer": 6,
      "tags": "POISON 3, STOMACH 3, PAIN 3, SENSES 3",
      "description": "지역 공동체의 중요한 일원이 열정적인 새끼 동물이 가져다준 맛있는 버섯을 먹고 중독되었습니다. 환자는 그것이 무해하고 좋은 버섯인 줄 알았습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "마지막 식사: 제때 치료하지 못하면 환자는 독으로 인해 사망합니다. 그가 없어져 공동체는 어떤 슬픔과 결핍을 겪게 될까요?"
    },
    {
      "name": "땅다람쥐 신드롬 (Groundhog Syndrome)",
      "rawName": "Groundhog Syndrome",
      "severity": "dire",
      "timer": 12,
      "tags": "SLEEP 3, MOOD 3, INSTINCTS 3",
      "description": "계절에 맞지 않는 급격한 기온 변화로 인해 이 야수들의 본능이 깨어나, 판단력이 흐려진 채 너무 일찍 겨울잠에 들어가기 시작했습니다. 이 질병에는 당신이 치료해야 할 세 명의 환자가 있으며, 패닉을 진정시켜야 합니다. 이 질병의 실패 결과는 계절에 따라 달라집니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "봄 또는 여름: 공포가 퍼져 가장 가까운 정착지가 조기에 동면에 들어갑니다. 다음 계절이 끝날 때까지 이 정착지 혹은 가장 가까운 정착지에서 거래나 사교 행사를 할 수 없습니다. 깨어 있는 야수들이 일을 메우느라 너무 바쁘기 때문입니다.\n가을 또는 겨울: 야수들이 휴식을 취하지 못하고 겨울 식량 비축분이 봄까지 버티지 못합니다. 일부 야수들은 굶주리게 될 것입니다. 다음 계절이 끝날 때까지 이 위치에서 2개 경로 이내의 위치에서는 식물이나 곤충 영약재를 채집할 수 없습니다."
    },
    {
      "name": "초식성 경향 (Herbivorous Tendencies)",
      "rawName": "PAGE 108 --- Herbivorous Tendencies",
      "severity": "severe",
      "timer": 8,
      "tags": "INSTINCT 3, NERVES 3, SENSES 3",
      "description": "외상으로 인한 생존 본능적 공포가 이 야수에게 깨어나 마음을 놓지 못하고 있습니다. 다른 야수의 모습이나 냄새만 맡아도 극심한 공황 상태에 빠집니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "굳어진 두려움: 깊은 공포가 야수의 마음에 완전히 자리 잡습니다. 그들은 짐을 싸서 누구도 찾을 수 없는 멀고 외딴 곳으로 숨어버립니다. 이곳이 정착지였다면, 정착지의 지역 서비스 중 하나가 영구적으로 제거됩니다."
    },
    {
      "name": "추격당한 부상 (Hunted)",
      "rawName": "Hunted",
      "severity": "dire",
      "timer": 6,
      "tags": "PAIN 3, WOUND 3, BREATH 2, HIDE 3",
      "description": "거대 야수에게 쫓기며 몸의 절반이 물어뜯긴 채, 이 야수는 숨을 헐떡이며 도움을 청하러 왔습니다. 과도한 도망길은 그의 상처를 악화시켰습니다. 현재 위치에서 채집을 시도할 때, ♠ 카드를 뽑으면 거대 야수가 나타납니다. 거대 야수는 당신이 이벤트를 포기하게 만들며, 타이머를 1시간 감소시키고 채집 포인트를 주지 않습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "복수의 굴레: 그가 상처를 이기지 못하고 숨을 거두자, 그의 소중한 동반자가 거대 야수에게 복수를 맹세합니다. 영구적으로 두꺼운 피(Thickblood) 서비스의 비용이 1 장신구 감소합니다."
    },
    {
      "name": "마음속 검은 야수 (Living With a Black Beast)",
      "rawName": "Living With a Black Beast",
      "severity": "dire",
      "timer": 12,
      "tags": "JOY 3, NERVES 3, MOOD 3, SLEEP 3",
      "description": "이 야수는 힘겨운 나날을 보내고 있습니다. 마음이 마비되고 깨지기 쉬운 상태이면서도 늘 알 수 없는 두려움에 떨고 있습니다. 그는 용기를 내어 당신을 찾아왔습니다. 당신의 따뜻한 보살핌이 절실합니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "마음의 빗장: 당신이 너무 오래 지체하여 그가 다시 마음의 문을 닫아버렸습니다. 그는 당신과 주변 사람들의 모든 도움을 거부합니다."
    },
    {
      "name": "파상풍 (Lockjaw)",
      "rawName": "Lockjaw",
      "severity": "dire",
      "timer": 12,
      "tags": "JOY 3, NERVES 3, MOOD 3, SLEEP 3",
      "description": "티탄이 남긴 날카로운 쓰레기에 베인 탓에, 이 가여운 야수의 턱이 굳어 다물어지지 않고 고열이 시작되었습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "격리 조치: 치료를 받지 못하면 열병이 그를 간호하던 다른 야수들에게로 전염됩니다. 길드는 이러한 비극의 재발을 막기 위해 근처의 티탄 유적을 봉쇄하기로 합의했습니다. 지도에서 가장 가까운 티탄 유적을 제거하세요."
    },
    {
      "name": "추락 사고 (Long Drop)",
      "rawName": "PAGE 109 --- Long Drop",
      "severity": "dire",
      "timer": 8,
      "tags": "WOUND 3, PAIN 3, SENSES 3",
      "description": "하늘을 올려다보니 흔한 풍경이 보입니다. 써밋(Summit)에서 온 바다독수리가 환자를 태우고 날아가고 있습니다. 하지만— 잠깐— 오 안 돼! 환자가 독수리의 움켜진 발에서 미끄러져 저 멀리 땅으로 추락하고 맙니다.",
      "outcome": "발견 불가: 환자를 제때 찾지 못하면 무슨 일이 일어날까요? 그들은 애초에 어떻게 미끄러진 것일까요?",
      "consequence": "날개 꺾인 비행: 손님을 떨어뜨린 것에 크게 낙담하고 부끄러워진 바다독수리 '볼드해트'가 일을 중단합니다. 지도에서 '하늘 택시(Air Taxi)' 서비스를 영구적으로 제거합니다."
    },
    {
      "name": "구강 거품병 (Mawfoam)",
      "rawName": "Mawfoam",
      "severity": "dire",
      "timer": 6,
      "tags": "POISON 3, SENSES 3, WOUND 2,  INSTINCT 2 또는 MOOD 2",
      "description": "이 땅에서 완전히 사라진 줄 알았던 치명적인 질병이 다시 머리를 치켜들었습니다. 감염된 야수들은 빠르게 야성을 잃고 난폭해집니다. 조심하세요; 물을 무서워하는 가장 치명적인 증상은 이미 구제할 단계를 지났음을 의미합니다.",
      "outcome": "이빨을 조심해!: 치료제를 만드는 데 성공했지만, 약을 투여할 때 환자가 격렬하게 발버둥 치며 저항합니다. 카드 한 장을 드로우하세요. 만약 ♠ 카드가 나온다면 치료 중 야수에게 물리게 됩니다. 당신은 자신을 위해 또 하나의 구강 거품병 치료제를 조제해야 합니다.",
      "consequence": "폐쇄 격리: 길드들은 숲의 이 지역을 완전히 포기하기로 합의합니다. 지도에서 현재 위치를 제거하세요. 만약 이곳이 정착지나 도시였다면, 다른 지역으로 대이동하는 야수들의 감정적 고통과 혼란에 대해 저널을 작성하세요."
    },
    {
      "name": "모기 물림 (Midge Munched)",
      "rawName": "Midge Munched",
      "severity": "intermediate",
      "timer": 7,
      "tags": "HIDE 2, PAIN 1, POISON 1",
      "description": "이 어리석은 야수는 늪지 모기떼에 대한 대비도 없이 그저 늪가에서 낮잠을 자고 말았습니다. 온몸이 가렵고 부어올랐습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "짜증 가득한 거부: 너무 심하게 긁은 탓에 온몸의 상처가 터지고 짜증이 극에 달해 당신의 접근을 거부합니다. 하루 이틀 지나면 괜찮아지겠지만, 깎인 명성을 회복하는 데는 더 오랜 시간이 걸릴 것입니다."
    },
    {
      "name": "이주 편두통 (Migration Migraine)",
      "rawName": "Migration Migraine",
      "severity": "intermediate",
      "timer": 9,
      "tags": "INSTINCT 3, MOOD 2, TEMPERATURE 1",
      "description": "먼 땅의 부름이 들려오고, 이 야수의 본능은 떠나야 한다고 외치고 있습니다. 그가 떠날 수 없거나 떠나지 않기로 선택했더라도, 몸과 머리는 심각한 고통과 압박감을 겪고 있습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "부름에 이끌려: 그를 가로막고 있던 장애물이 무엇이든 상관없이 본능의 이끌림에 굴복하여 무작정 떠나버립니다. 이로 인해 주변 상황이 어떻게 악화되었을까요?"
    },
    {
      "name": "월간 껍질 벗기 (Monthly Chore)",
      "rawName": "PAGE 110 --- Monthly Chore",
      "severity": "lesser",
      "timer": 6,
      "tags": "SCALE 2, PAIN 1",
      "description": "이 도마뱀은 가려운 비늘을 진정시키기 위해 보이는 단단한 표면마다 몸을 비벼대고 있습니다. 껍질을 벗을 때가 거의 되었지만, 조만간 부드럽게 비늘을 진정시켜주지 못하면 비늘 아래의 새 속살이 쓸려 피가 날 것입니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "허물 투성이: 온 사방에 죽은 비늘 허물이 날리고, 도마뱀은 몸이 너무 아파 치울 엄두를 내지 못합니다. 하루를 소모(Mark 1 Day)해 청소를 도와준다면 명성을 잃지 않습니다."
    },
    {
      "name": "신경 마비 (Nervefright)",
      "rawName": "Nervefright",
      "severity": "lesser",
      "timer": 9,
      "tags": "INSTINCT 3, NERVES 3, MOOD 3",
      "description": "거대 야수와 너무 근접하게 마주친 탓에 이 가여운 야수는 공포로 얼어붙었습니다. 본능이 몸을 굳게 만들어 움직이지 못하고 누구의 말에도 반응하지 않습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "심장 마비: 극심한 스트레스를 이기지 못해 심장이 멈추고 맙니다. 이 참사를 일으킨 거대 야수는 누구인가요? 룰북 40페이지 규칙을 사용해 지도에 그의 무덤(Barrow)을 표시하세요."
    },
    {
      "name": "야간 교대근무 피로 (Night Shift)",
      "rawName": "Night Shift",
      "severity": "intermediate",
      "timer": 6,
      "tags": "SLEEP 3, MOOD 2",
      "description": "이 야수는 필생의 역작을 완성하기 위해 특별한 기술을 연마해왔습니다. 동거인들과의 수면 시간 갈등 때문에 낮에는 집중할 수 없어 밤잠을 설쳐가며 작업해왔습니다. 그는 헛소리를 할 정도로 몽롱하지만 작품을 끝내기 위해 필사적입니다.",
      "outcome": "헌정사: 그의 평생 역작은 무엇인가요? 제때 치료해 준다면 그의 멋진 작품에 당신을 향한 헌정 문구를 새겨줄 것입니다.",
      "consequence": "작업 중 졸음: 작업 도중 밀려오는 잠을 이기지 못하고 쓰러지면서 심혈을 기울이던 작품을 완전히 망쳐버립니다."
    },
    {
      "name": "발썩음 병 (Paw Rot)",
      "rawName": "Paw Rot",
      "severity": "lesser",
      "timer": 9,
      "tags": "INFECTION 1 및 PAIN 1",
      "description": "축축한 흙 위를 며칠이고 걸어 다닌 탓에, 이 야수의 발가락 사이 막이 가렵고 부어올랐습니다. 몇 주 동안 매일 정기적으로 무언가를 발라주면 나을 것입니다...",
      "outcome": "티 없이 깨끗하게: 만약 치료제가 보존된다면 - 이 오래 지속되는 연고 덕분에 이 감염병이 다시 발생했을 때 확실하게 치료할 수 있습니다. 다음번에 이 지역을 지날 때, 고마워하는 환자로부터 장신구 1개를 얻습니다.",
      "consequence": "짓밟힌 발: 그 자체로는 사소한 문제일 수 있지만, 이 야수는 꽤나 인기가 많습니다. 그가 또 누구에게 발썩음 병을 옮겼을까요? 다음번에 이 지역을 방문할 때 치료할 수 있는 유일한 질병은 발썩음 병뿐입니다."
    },
    {
      "name": "소나무에 깔림 (Pinned by Pine)",
      "rawName": "PAGE 111 --- Pinned by Pine",
      "severity": "severe",
      "timer": 12,
      "tags": "WOUND 3, POISON 3, HIDE 3",
      "description": "쿵! 가파른 바람이 불어 늙은 소나무를 쓰러뜨렸고, 불행하게도 이 야수가 그 밑에 깔리고 말았습니다. 상처와 다발성 뼈 부상을 입었습니다. 나무를 조심스럽게 치워야 합니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "지체된 구조: 구조가 너무 지체되어 깔린 부위의 뼈가 잘못 맞춰지거나 감염이 심해집니다. 그는 평생 절름발이로 살아가야 할 수도 있습니다. 당신의 마음에 얹힌 무거운 짐에 대해 저널을 작성하세요."
    },
    {
      "name": "콰그마이어의 비늘병 (Quagmire's Scale)",
      "rawName": "Quagmire's Scale",
      "severity": "severe",
      "timer": 9,
      "tags": "SCALE 2, INFECTION 2, POISON 1",
      "description": "수렁의 썩어가는 진흙 속을 걸어 다닌 탓에 이 파충류의 비늘이 부식되고 떨어져 나가고 있습니다. 비늘 사이로 붉고 아픈 살집이 드러나 괴로워하고 있습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "비늘 탈락: 비늘이 거의 다 빠져버려 추위와 병균에 무방비로 노출됩니다. 그가 정착지에서 격리되어 홀로 아픔을 이겨내는 과정에 대해 기록하세요."
    },
    {
      "name": "방어용 악취 (Safety Stench)",
      "rawName": "Safety Stench",
      "severity": "lesser",
      "timer": 10,
      "tags": "SENSES 1 및 NERVES 1 또는 INSTINCT 1",
      "description": "포식자로부터 자신을 보호하기 위해 이 야수는 몸에서 뿜어 나오는 강력한 화학적 악취 주머니를 터뜨렸습니다. 하지만 주머니가 파열되어 악취 물질이 피부와 점막에 스며들어 극심한 고통과 염증을 겪고 있습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "지독한 고독: 악취가 너무 오래 몸에 배어 주변의 모든 친구와 가족이 그를 멀리합니다. 그가 겪는 지독한 외로움에 대해 기록하세요."
    },
    {
      "name": "계절 변화병 (Seasonshift)",
      "rawName": "Seasonshift",
      "severity": "lesser",
      "timer": 6,
      "tags": "FUR 3, INSTINCT 3, SENSES 3",
      "description": "바람의 방향이 바뀌고 서리가 내리기 시작하자, 이 야수는 계절 변화에 적응하지 못하고 뼈마디가 쑤시는 몸살과 열병을 앓기 시작했습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "드러눕기: 며칠 동안 꼼짝없이 침대에 누워 겨울을 맞이할 준비(식량 비축 등)를 전혀 하지 못합니다. 겨울 동안 그가 겪을 어려움에 대해 저널을 작성하세요."
    },
    {
      "name": "매연 코 (Smokesnout)",
      "rawName": "Smokesnout",
      "severity": "severe",
      "timer": 9,
      "tags": "BREATH 3, BURN 3, PAIN 2",
      "description": "대장간의 연기와 석탄 가루를 너무 많이 마신 탓에 코안의 점막이 타들어가고 호흡기가 막혔습니다. 쌕쌕거리는 숨소리와 함께 피가 섞인 기침을 합니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "호흡 장애: 만성적인 호흡 곤란을 얻게 되어 더 이상 뜨겁고 먼지가 많은 대장간 일을 할 수 없게 됩니다. 그의 가업은 어떻게 될까요?"
    },
    {
      "name": "상한 밀가루 독 (Soured Dough)",
      "rawName": "Soured Dough",
      "severity": "intermediate",
      "timer": 9,
      "tags": "POISON 1, STOMACH 1",
      "description": "습한 창고에 방치되어 푸른 곰팡이가 피어난 밀가루로 구운 빵을 먹고 식중독에 걸렸습니다. 복통과 함께 구토를 멈추지 못합니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "위장 손상: 독소가 위장을 크게 상하게 하여 아주 순하고 가벼운 음식 외에는 소화시키지 못하는 몸이 됩니다. 그가 좋아하는 음식을 더는 먹지 못하는 슬픔을 기록하세요."
    },
    {
      "name": "벌침 쇼크 (Stingshock)",
      "rawName": "Stingshock",
      "severity": "intermediate",
      "timer": 4,
      "tags": "POISON 2, BREATH 2",
      "description": "벌집을 채집하다가 여러 마리의 독충에게 쏘였습니다. 얼굴과 목이 심하게 부어오르고 두드러기와 함께 호흡이 가빠지기 시작했습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "벌집 기피: 벌에 대한 극심한 트라우마가 생겨 다치기 쉬운 벌집 채집을 평생 멀리하게 됩니다. 그가 더 이상 달콤한 꿀을 맛보지 못하게 되는 아쉬움을 저널로 쓰세요."
    },
    {
      "name": "달팽이 점액 알레르기 (Snail Ails)",
      "rawName": "PAGE 113 --- Snail Ails",
      "severity": "severe",
      "timer": 6,
      "tags": "PARASITE 3, BREATH 3, SLEEP 3",
      "description": "달팽이 껍질이나 점액질을 약재로 가공하려다가 점액 독소에 노출되어 온몸의 가죽과 눈이 짓물렀습니다. 눈을 제대로 뜨지 못하고 괴로워합니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "일시적 실명: 한동안 눈을 전혀 뜰 수 없는 상태가 됩니다. 보이지 않는 어둠 속에서 주변 동료들에게 의지해야 하는 그의 심정을 기록하세요."
    },
    {
      "name": "일사병 (Sunstruck)",
      "rawName": "Sunstruck",
      "severity": "lesser",
      "timer": 8,
      "tags": "SLEEP 1, SENSES 2 및  \nFEATHER 또는 HIDE 1",
      "description": "뙤약볕 아래에서 모자도 쓰지 않고 종일 밭일을 하거나 짐을 나른 탓에 체온이 급격히 오르고 두통과 구토 증세를 보입니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "밭농사 중단: 일사병의 여파로 한동안 농사일을 손에서 놓게 됩니다. 잡초가 무성해진 그의 소중한 채소밭은 어떻게 될까요?"
    },
    {
      "name": "배탈 (The Runs)",
      "rawName": "The Runs",
      "severity": "lesser",
      "timer": 8,
      "tags": "STOMACH 1, POISON 1, PARASITE 1",
      "description": "상한 차가운 우유나 오염된 개울물을 마신 탓에 배탈이 나 하루에도 수십 번씩 덤불 속으로 달려가고 있습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "탈수 증상: 심한 설사로 몸의 기운이 빠지고 탈수 증상이 와 며칠간 아무런 활동도 하지 못하고 요양해야 합니다."
    },
    {
      "name": "진드기 물림 (Tickbitten, Twice Shy)",
      "rawName": "Tickbitten, Twice Shy",
      "severity": "lesser",
      "timer": 8,
      "tags": "PARASITE 1 및 FUR 또는 FEATHER 2",
      "description": "수풀을 헤치고 가다가 껍질 두꺼운 거대 진드기에 물렸습니다. 진드기가 껍질 아래 깊숙이 머리를 박고 피를 빨아먹고 있으며 상처 주변이 붓고 가렵습니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "상처 감염: 진드기를 억지로 떼어내려다 대가리가 살 속에 박혀 곪아 터집니다. 흉터가 남고 열병이 동반됩니다."
    },
    {
      "name": "티탄 접촉병 (Titan Touched)",
      "rawName": "PAGE 114 --- Titan Touched",
      "severity": "dire",
      "timer": 8,
      "tags": "BURN 3, NERVES 3, PAIN 3, HIDE 3",
      "description": "고대 티탄의 유적에서 흘러나오는 푸른 광물이나 이상한 소리를 내는 기계와 접촉한 탓에, 온몸의 털이 빠지고 눈동자가 비정상적으로 흐려지며 이명이 들립니다.",
      "outcome": "티탄의 계시: 성공적으로 치료한다면, 환자가 깊은 혼수상태에서 깨어나 티탄 유적의 숨겨진 장치와 비밀번호를 읊조립니다. 지도에서 유적 탐사 시 난이도가 2 감소합니다.",
      "consequence": "정신 착란: 영구적인 이명과 정신 이상을 겪으며 유적 주변을 배회하는 신세가 됩니다. 그의 슬픈 방랑에 대해 기록하세요."
    },
    {
      "name": "모종삽 부상 (Trowel Troubles)",
      "rawName": "Trowel Troubles",
      "severity": "intermediate",
      "timer": 9,
      "tags": "INSTINCT 2, JOY 2",
      "description": "원예용 모종삽이나 날카로운 농기구를 잘못 휘둘러 발목 가죽에 깊은 갈라진 상처를 입었습니다. 피가 멈추지 않고 흙먼지가 묻어 염증 우려가 큽니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "발목 흉터: 상처가 아물어도 힘줄이 상해 발목을 삐끗하기 쉬운 체질이 됩니다. 험난한 지형을 이동할 때 더 조심해야 합니다."
    },
    {
      "name": "수렁 물방울병 (Waen Drops)",
      "rawName": "Waen Drops",
      "severity": "lesser",
      "timer": 9,
      "tags": "PAIN 2, MINIMUM FAIR 3",
      "description": "습기가 가득하고 공기가 정체된 깊은 수렁에서 살던 야수가 다리와 몸에 물이 차 부풀어 오르는 증상을 보입니다. 숨을 쉴 때마다 가슴에서 물소리가 납니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "만성 비대: 몸의 부기가 완전히 빠지지 않고 굳어버려 움직임이 둔해집니다. 도구를 들고 다닐 수 있는 무게 한도가 1/3 감소합니다."
    },
    {
      "name": "추모제 피로 (Wake)",
      "rawName": "PAGE 115 --- Wake",
      "severity": "dire",
      "timer": 12,
      "tags": "ELSEWHERE 3 및 2, JOY 3 및 2, FAIR 4",
      "description": "마을의 족장 야수가 세상을 떠나 며칠 밤낮을 쉬지 않고 추모 의식을 치르느라 온몸이 탈진하고 신경이 날카로워졌습니다. 극심한 두통과 불안증을 호소합니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "전통 중단: 의식이 도중에 중단되어 망자의 영혼이 숲을 떠돌며 마을 야수들의 꿈자리가 숭숭해집니다. 마을 사람들의 불안감에 대해 저널을 쓰세요."
    },
    {
      "name": "날개 골절 (Wingbreak)",
      "rawName": "Wingbreak",
      "severity": "dire",
      "timer": 6,
      "tags": "FEATHER 3, TEMPERATURE 3, MOOD 2, \nPAIN 2 및 부목용 약재 (부목용 약재 (부목용 약재 (부목용 약재 (SOMETHING TO SET A BONE))))",
      "description": "강풍을 뚫고 날아가려다 나뭇가지에 부딪혀 한쪽 날개 뼈가 뚝 부러졌습니다. 날개를 축 늘어뜨린 채 극심한 통증을 호소하고 있습니다.",
      "outcome": "깃털 스플린트: 부러진 날개를 튼튼한 너도밤나무 판자와 밀랍 줄로 아름답고 견고하게 고정해 줍니다. 환자가 감동하여 다음 비행 조우 시 난이도가 감소합니다.",
      "consequence": "평생 불구: 뼈가 비뚤어지게 붙어 다시는 하늘을 날 수 없게 됩니다. 비행 능력을 잃어 슬퍼하는 새의 고독에 대해 기록하세요."
    },
    {
      "name": "기생충 감염 (Wormridden)",
      "rawName": "Wormridden",
      "severity": "intermediate",
      "timer": 8,
      "tags": "PARASITE 2, STOMACH 2",
      "description": "오염된 날고기나 날벌레를 집어먹은 탓에 뱃속에 기생충이 들끓어 아무리 먹어도 살이 빠지고 구토와 무기력증에 시달립니다.",
      "outcome": "성공 보상 장신구 획득",
      "consequence": "영양실조: 몸의 영양분을 모두 빼앗겨 털빛이 칙칙해지고 한동안 제대로 걸어 다니지 못해 채집 효율이 급격히 떨어집니다."
    }
  ],
  "reagents": [
    {
      "name": "마로니에/말밤",
      "rawName": "Horse Chestnuts",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Autumn",
        "Winter"
      ],
      "description": "이 영약재는 치료 효과 못지않게 많은 상처를 내기도 합니다. 종종 떨어지는 밤송이에 머리를 맞곤 하죠.",
      "preps": "🟢⚪⚪ 가시 껍질: [ELSEWHERE 1]로 조제\n🟢🟢🟢 완벽한 밤톨: 놀이용 [JOY 2]로 사용\n🟢🟢⚪ 말밤 알맹이: 끓여서 [STOMACH 2], 요리해서 [FAIR 2]에 사용"
    },
    {
      "name": "동물의 부산물",
      "rawName": "Animal Sheddings",
      "type": "ANIMAL",
      "br": 3,
      "regions": [
        "Bog",
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Autumn"
      ],
      "description": "계절이 변할 때마다 숲의 동물들이 남기는 흔적들입니다.",
      "preps": "🟢🟢⚪ 똥 환약: 빻아서 [STOMACH 1]에 사용\n🟢🟢⚪ 모피/털: 끓여서 [HIDE 1]에 사용\n🟢⚪⚪ 땀: 끓여서 [HIDE 1]에 발라 사용"
    },
    {
      "name": "너도밤나무",
      "rawName": "Beech",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Forest",
        "Loch",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Winter"
      ],
      "description": "전설에 따르면 자작나무는 티탄들이 떠나며 남긴 작별 선물이라고 합니다.",
      "preps": "🟢⚪⚪ 겉껍질: 갈아서 [HIDE 2]에 사용\n🟢⚪⚪ 열매: [FAIR 1]로 사용, 요리하여 [FAIR 2]로 사용\n🟢🟢🟢 나무껍질: 달여서 [WOUND 2]로 조제"
    },
    {
      "name": "벌집",
      "rawName": "Beehive",
      "type": "INSECT",
      "br": 5,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Autumn",
        "Winter"
      ],
      "description": "용감하게 단것을 찾는 야수들이 늘 탐내는 벌들의 둥지입니다.",
      "preps": "🟢⚪⚪ 밀랍: [FEATHER 2]에 사용\n🟢⚪⚪ 로열 젤리: [HIDE 2] 및 [BURN 2]에 사용\n🟢⚪⚪ 꿀: [WOUND 2]에 첨가, 복용 치료제에 사용"
    },
    {
      "name": "딱정벌레",
      "rawName": "Beetles",
      "type": "INSECT",
      "br": 4,
      "regions": [
        "Bog",
        "Forest",
        "Meadow",
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "딱정벌레의 껍질은 겁 많은 야수들이 알아채지 못하는 영롱한 빛을 띱니다.",
      "preps": "🟢⚪⚪ 겉껍질: 빻아서 [SCALE 2]에 사용, [ELSEWHERE 1]로 조제"
    },
    {
      "name": "거대 야수 부속물",
      "rawName": "Behemoth Bits",
      "type": "ANIMAL",
      "br": 8,
      "regions": [
        "Bog",
        "Forest",
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "숲의 거대 야수들에게서 조심스럽게 채취한 희귀한 부속물들입니다.",
      "preps": "🟢⚪⚪ 사향: [INSTINCT 2]에 바름\n🟢🟢⚪ 소변: 끓여서 [SENSES 2]에 사용\n🟢🟢🟢 가죽 털: [TEMPERATURE 3]에 바름"
    },
    {
      "name": "큰 물고기",
      "rawName": "Big Fish",
      "type": "ANIMAL",
      "br": 9,
      "regions": [
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Autumn"
      ],
      "description": "맑은 호수나 강에서 갓 건져 올린 크고 묵직한 물고기입니다.",
      "preps": "🟢🟢⚪ 껍질: 기름을 내기 위해 끓인 뒤 발라서 사용\n🟢🟢🟢 살코기: 요리하여 [MOOD 2] 및 [SENSES 3]에 사용\n🟢⚪⚪ 비늘: 빻아서 [SCALE 3]에 사용"
    },
    {
      "name": "자작나무 버섯",
      "rawName": "Birch Polypore",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Forest"
      ],
      "seasons": [
        "Spring",
        "Winter"
      ],
      "description": "자작나무 둥치에 넓게 자라나는 갈색 버섯입니다.",
      "preps": "🟢⚪⚪ 버섯: [HIDE 2] 및 [WOUND 1]에 발라 사용"
    },
    {
      "name": "새 배설물/배사",
      "rawName": "Bird Leavings",
      "type": "ANIMAL",
      "br": 4,
      "regions": [
        "Bog",
        "Forest",
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer"
      ],
      "description": "하늘을 날아다니는 깃털 달린 동물들이 떨어뜨리고 간 둥지 잔해물입니다.",
      "preps": "🟢⚪⚪ 구아노: 갈아서 요리해 [POISON 1]에 사용\n🟢⚪⚪ 알껍질: 빻아서 [SCALE 1]에 사용\n🟢⚪⚪ 깃털: [JOY 1]에 사용"
    },
    {
      "name": "블랙커런트",
      "rawName": "Blackcurrant",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Summer"
      ],
      "description": "야수들은 집의 안정을 위해 블랙커런트 나뭇가지를 엮어 벽에 걸어둡니다.",
      "preps": "🟢⚪⚪ 열매: 생으로 [FAIR 1]에 사용\n🟢⚪⚪ 잎사귀: 달여서 [INFECTION 1]에 사용\n🟢🟢🟢 뿌리: 씹어서 [MOOD 1]에 사용"
    },
    {
      "name": "야생 자두/슬로나무",
      "rawName": "Blackthorn",
      "type": "PLANT",
      "br": 7,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Autumn",
        "Winter"
      ],
      "description": "열매가 아주 시지만 요리하면 훌륭한 잼이 됩니다.",
      "preps": "🟢🟢🟢 슬로 열매: 복용 치료제에 넣어 [FOUL 2]에 사용, 요리하여 [FAIR 2] 및 [STOMACH 2]에 사용\n🟢⚪⚪ 가시: 갈아서 달인 뒤 [POISON 2]에 사용"
    },
    {
      "name": "가시덤불 나뭇가지",
      "rawName": "Brambles",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "가시덤불 지대는 종종 작은 새들의 안전한 보금자리가 됩니다.",
      "preps": "🟢⚪⚪ 열매: 씹어서 [FAIR 2]에 사용, 요리하여 [FAIR 3]에 사용\n🟢🟢⚪ 껍질: 끓여서 연고를 만든 뒤 [HIDE 1]에 사용\n🟢🟢🟢 뿌리: 씹어서 달인 후 사용"
    },
    {
      "name": "우엉",
      "rawName": "Burdock",
      "type": "PLANT",
      "br": 3,
      "regions": [
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "밭두렁이나 길가에서 흔히 볼 수 있는 생명력 강한 풀입니다.",
      "preps": "🟢🟢🟢 뿌리: 달여서 [INFECTION 1]에 사용\n🟢🟢⚪ 줄기: 갈아서 [FUR 1] 결 고르는 데 사용\n🟢⚪⚪ 꽃: 소화시켜 밝은 페이스트로 만들어 사용\n🟢⚪⚪ 씨꼬투리: 빗처럼 쓸어 [PARASITES 1]에 사용"
    },
    {
      "name": "나비",
      "rawName": "Butterfly",
      "type": "INSECT",
      "br": 9,
      "regions": [
        "Bog",
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "어린 야수들이 숲의 화사한 초원에서 쫓아다니길 좋아하는 곤충입니다.",
      "preps": "🟢⚪⚪ 살아있는 나비: 이마에 얹어 진정시키는 데 사용"
    },
    {
      "name": "개박하",
      "rawName": "Catnip",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "고양이과 야수뿐 아니라 숲의 모든 야수를 나른하고 즐겁게 만드는 최고의 약초입니다.",
      "preps": "🟢⚪⚪ 뿌리: 씹어서 [BREATH 1]에 사용\n🟢⚪⚪ 꽃: 달여서 [INSTINCT 2] 및 [MOOD 1]에 사용"
    },
    {
      "name": "분필/석회석",
      "rawName": "Chalk",
      "type": "EARTH",
      "br": 4,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "아무런 맛도 없지만 빻으면 미세한 가루가 되는 흙 원소입니다.",
      "preps": "🟢⚪⚪ 석회 가루: 빻아서 [STOMACH 2] 및 [POISON 1]에 사용"
    },
    {
      "name": "벚나무/체리",
      "rawName": "Cherry Trees",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "브리슬리 숲의 야수들이 아주 좋아하는 달콤한 열매가 열리는 나무입니다.",
      "preps": "🟢⚪⚪ 버찌: 요리하여 [JOY 3] 및 [FAIR 4]에 사용\n🟢⚪⚪ 껍질: 빻아서 [BREATH 1]에 사용"
    },
    {
      "name": "고추/매운고추",
      "rawName": "Chillies",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Summer"
      ],
      "description": "어떤 야수들에게는 혀가 타들어 갈 것 같지만 훌륭한 각성 유발 약재가 됩니다.",
      "preps": "🟢⚪⚪ 속껍질: 끓여서 [PAIN 1]에 사용\n🟢⚪⚪ 씨앗: 빻아서 사용"
    },
    {
      "name": "진흙/찰흙",
      "rawName": "Clay",
      "type": "EARTH",
      "br": 3,
      "regions": [
        "Bog",
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "물과 부드러운 흙이 만나는 하천가에서 채취하는 흙 원소입니다.",
      "preps": "🟢🟢⚪ 진흙: [NERVES 1] 및 [POISON 1]에 사용, 소화시켜 [STOMACH 1]에 사용"
    },
    {
      "name": "굵은 모래/사석",
      "rawName": "Coarse Grit",
      "type": "EARTH",
      "br": 4,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "많은 조류 야수들은 소화를 돕기 위해 굵은 모래를 삼키곤 합니다.",
      "preps": "🟢⚪⚪ 모래알: 씹어서 [STOMACH 2]에 사용"
    },
    {
      "name": "조제된 평정약 (Titan Hissbox)",
      "rawName": "Concocted Calm",
      "type": "TITAN",
      "br": 8,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "향수병이나 향정신적 긴장을 호소하는 야수들에게 특효약인 티탄의 잔해 도구입니다.",
      "preps": "🟢🟢⚪ 분무액: [INSTINCT 3] 및 [MOOD 3]에 분사하여 사용"
    },
    {
      "name": "야생 사과/고욤사과",
      "rawName": "Crab Apples",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Bog",
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring"
      ],
      "description": "제대로 조리하지 않으면 입안이 텁텁하고 신맛이 강한 야생 과일입니다.",
      "preps": "🟢🟢🟢 과육: 복용 치료제에 넣어 [FOUL 1]에 사용, 요리하여 보존(PRESERVED) 속성을 부여해 복용 치료제에 사용"
    },
    {
      "name": "오이",
      "rawName": "Cucumbers",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Mountain",
        "Titan"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "샐러드와 샌드위치의 필수적인 수분 보충 야채입니다.",
      "preps": "🟢⚪⚪ 꽃: 달여서 [SENSES 2], [SLEEP 1]에 사용\n🟢⚪⚪ 오이 속살: 복용 치료제에 넣어 사용"
    },
    {
      "name": "민들레",
      "rawName": "Dandelions",
      "type": "PLANT",
      "br": 2,
      "regions": [
        "Bog",
        "Meadow",
        "Mountain",
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer"
      ],
      "description": "초원을 황금빛으로 물들이는 아름다운 풀꽃입니다.",
      "preps": "🟢⚪⚪ 꽃: [JOY 1]에 사용\n🟢⚪⚪ 뿌리: 갈아서 [STOMACH 1]에 사용\n🟢⚪⚪ 잎: 복용 치료제에 넣어 [FAIR 1]에 사용\n🟢⚪⚪ 줄기: 달여서 [HIDE 1]에 사용"
    },
    {
      "name": "꺼진 모닥불 재/숯",
      "rawName": "Doused Bonfires",
      "type": "EARTH",
      "br": 4,
      "regions": [
        "Forest",
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "약초 연고를 빻는 약제사들은 모닥불 잔해도 결코 낭비하지 않습니다.",
      "preps": "🟢⚪⚪ 재: 비늘 각질 제거를 위한 [SCALE 2]에 바르거나, 비누로 끓여 [HIDE 2]에 사용\n🟢⚪⚪ 숯: 빻아서 [POISON 2] 및 [ELSEWHERE 2]에 사용"
    },
    {
      "name": "광대버섯아재비",
      "rawName": "False Deathcap",
      "type": "PLANT",
      "br": 7,
      "regions": [
        "Forest"
      ],
      "seasons": [
        "Autumn",
        "Winter"
      ],
      "description": "조심해서 다루지 않으면 치명적인 중독 증상을 보이는 독버섯입니다.",
      "preps": "🟢🟢⚪ 버섯 속살: 소화시켜 [SENSES 3] 및 [FOUL 6]에 사용"
    },
    {
      "name": "민자 자주방망이버섯",
      "rawName": "Field Blewit",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Winter",
        "Spring",
        "Autumn",
        "Winter"
      ],
      "description": "민간 전설에 신비로운 힘이 깃들어 있다고 전해지는 자주색 버섯입니다.",
      "preps": "🟢⚪⚪ 버섯 갓: 요리해서 [STOMACH 2]에 사용"
    },
    {
      "name": "고운 모래",
      "rawName": "Fine Sand",
      "type": "EARTH",
      "br": 7,
      "regions": [
        "Loch",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "숲의 파충류 야수들은 허물을 벗을 때 도움을 줄 수 있는 고운 모래를 늘 찾아 헤맵니다.",
      "preps": "🟢🟢⚪ 고운 모래: 마시는 약의 필터로 사용하여 조제"
    },
    {
      "name": "불꽃 주머니 (Titan Firegizzard)",
      "rawName": "Firegizzards",
      "type": "TITAN",
      "br": 6,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "힘차게 두드리면 은은한 불처럼 타오르는 신비한 티탄의 주머니입니다.",
      "preps": "🟢🟢🟢 붉은 액체 주머니: [TEMPERATURE 3]에 사용"
    },
    {
      "name": "광대버섯",
      "rawName": "Fly Agaric",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Forest"
      ],
      "seasons": [
        "Autumn",
        "Winter"
      ],
      "description": "붉은 갓에 흰 점이 콕콕 박힌 전형적인 판타지 버섯입니다.",
      "preps": "🟢⚪⚪ 포자: 달여서 [INSTINCT 1] 및 [MOOD 2]에 사용\n🟢🟢🟢 버섯 갓: 요리하여 [SLEEP 3]에 사용"
    },
    {
      "name": "물망초",
      "rawName": "Forget-Me-Not",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Loch"
      ],
      "seasons": [
        "Summer"
      ],
      "description": "우정과 사랑을 전할 때 꽃다발로 가장 많이 선물하는 작고 푸른 꽃입니다.",
      "preps": "🟢⚪⚪ 꽃: 달여서 [NERVES 3]에 사용\n🟢⚪⚪ 꿀샘: 달여서 [BREATH 2]에 사용"
    },
    {
      "name": "개구리 점액",
      "rawName": "can only be Foraged for in Summer Frog Slime",
      "type": "ANIMAL",
      "br": 5,
      "regions": [
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "여름철 개구리의 피부에서 분비되는 천연의 질병 억제 점액질입니다.",
      "preps": "🟢⚪⚪ 점액: 끓여서 [INFECTION 2] 및 [PARASITE 2]에 사용"
    },
    {
      "name": "박하/민트",
      "rawName": "Garden Mint",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Bog",
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "머리를 맑게 해주는 상쾌한 정원 허브의 대명사입니다.",
      "preps": "🟢⚪⚪ 잎사귀: 씹어서 [BREATH 2] 및 [PAIN 1]에 사용\n🟢⚪⚪ 줄기: 달여서 [STOMACH 2]에 사용"
    },
    {
      "name": "유리 섬유 (Titan Glass Silk)",
      "rawName": "Glass Silk",
      "type": "TITAN",
      "br": 7,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "삼밧줄보다 열 배는 더 질긴 고대 티탄들의 광택 섬유 실입니다.",
      "preps": "🟢⚪⚪ 유리 실타래: [HIDE 3] 및 [WOUND 3]에 실로 엮어 사용"
    },
    {
      "name": "갈퀴덩굴",
      "rawName": "Goosegrass",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Bog",
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring"
      ],
      "description": "어린 동물들이 털옷에 던지며 노는 거칠거칠한 잡초입니다.",
      "preps": "🟢⚪⚪ 씨앗: 갈아서 달인 뒤 [SLEEP 1]에 사용\n🟢⚪⚪ 어린줄기: 끓여서 [HIDE 1] 및 [PAIN 1]에 사용"
    },
    {
      "name": "솔이끼",
      "rawName": "Haircap Moss",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Bog",
        "Forest",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "축축한 바위 그늘에 자라며 방광염에 효과가 좋은 이끼류입니다.",
      "preps": "🟢⚪⚪ 솔이끼 잎: 끓여서 [FEATHER 2] 및 [HIDE 1]에 사용"
    },
    {
      "name": "인조 가죽 밴드 (Titan Hidelendings)",
      "rawName": "Hidelendings",
      "type": "TITAN",
      "br": 7,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Winter",
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "쥐 가죽 색깔을 띤 접착식 티탄의 인조 피부 보호재입니다.",
      "preps": "🟢⚪⚪ 가죽 조각: [HIDE 2] 및 [WOUND 2]에 부착해 사용"
    },
    {
      "name": "쓴풀/호하운드",
      "rawName": "Hoarhound",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Forest",
        "Mountain"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "쉽게 지나치기 쉽지만 아주 독특하고 쓴 향을 풍기는 약초입니다.",
      "preps": "🟢🟢⚪ 잎사귀 뭉치: 요리하여 [PAIN 2] 및 [BREATH 3]에 사용"
    },
    {
      "name": "꿀벌",
      "rawName": "Honeybees",
      "type": "INSECT",
      "br": 5,
      "regions": [
        "Bog",
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "숲속 곳곳을 바쁘게 잉잉거리며 날아다니는 작은 곤충입니다.",
      "preps": "🟢⚪⚪ 꽃가루: [STOMACH 1] 및 [MOOD 2]에 첨가하여 사용"
    },
    {
      "name": "마로니에/말밤",
      "rawName": "Horse Chestnuts",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Autumn",
        "Winter"
      ],
      "description": "이 영약재는 치료 효과 못지않게 많은 상처를 내기도 합니다. 종종 떨어지는 밤송이에 머리를 맞곤 하죠.",
      "preps": "🟢⚪⚪ 가시 껍질: [ELSEWHERE 1]로 조제\n🟢🟢🟢 완벽한 밤톨: 놀이용 [JOY 2]로 사용\n🟢🟢⚪ 말밤 알맹이: 끓여서 [STOMACH 2], 요리해서 [FAIR 2]에 사용"
    },
    {
      "name": "쇠뜨기/개뜨기",
      "rawName": "Horsetails",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "실제 말의 꼬리가 아니라 마디가 져 자라나는 약용 양치식물입니다.",
      "preps": "🟢⚪⚪ 줄기: 끓여서 [WOUND 2] 및 [FEATHER 3] 혹은 [FUR 3]에 사용"
    },
    {
      "name": "철광석/철 자갈",
      "rawName": "Iron Ore",
      "type": "EARTH",
      "br": 7,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "부모에게서 자식에게로 전해져 내려오는 치료 전설에 자주 등장하는 단단한 돌입니다.",
      "preps": "🟢⚪⚪ 철 자갈: 마시는 치료제에 넣어 끓인 뒤 [NERVES 1] 및 [STOMACH 3]에 사용. 광부들에게 명성이나 장신구로 교환 가능합니다."
    },
    {
      "name": "철 민달팽이 (Titan Ironslug)",
      "rawName": "Trinket Ironslug",
      "type": "TITAN",
      "br": 8,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "이 달팽이를 꾹 쥐어짜면 화상 상처를 즉시 달래주는 부드럽고 향기로운 흰 연고 크림이 나옵니다.",
      "preps": "🟢⚪⚪ 점액 내장: [PAIN 2] 및 [BURN 3]에 연고로 사용"
    },
    {
      "name": "라벤더",
      "rawName": "Lavender",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Bog"
      ],
      "seasons": [
        "Spring",
        "Summer"
      ],
      "description": "일부 연고 약제사들은 라벤더 하나만 있으면 숲의 모든 병을 고칠 수 있다고 굳게 믿습니다.",
      "preps": "🟢⚪⚪ 라벤더 꽃: 달여서 [NERVES 2] 및 [SLEEP 2]에 사용"
    },
    {
      "name": "거머리",
      "rawName": "Leech",
      "type": "INSECT",
      "br": 5,
      "regions": [
        "Loch"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "연고 조제사들은 오래전부터 상처의 나쁜 피를 뽑아내는 거머리의 신비한 가치를 잘 알고 있었습니다.",
      "preps": "🟢🟢⚪ 거머리: 빻아서 페이스트로 만들어 [WOUND 2] 및 [PARASITE 2]에 사용"
    },
    {
      "name": "구더기",
      "rawName": "Maggots",
      "type": "INSECT",
      "br": 7,
      "regions": [
        "Bog",
        "Forest"
      ],
      "seasons": [
        "Summer"
      ],
      "description": "피부가 깊게 썩어 들어가는 끔찍한 상처에는 죽은 살을 먹어치우는 구더기를 쓰는 것이 최선입니다.",
      "preps": "🟢🟢⚪ 유충: [INFECTION 3] 및 [WOUND 3]에 얹어 상처를 소독하는 데 사용"
    },
    {
      "name": "금잔화/메리골드",
      "rawName": "Marigold",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "벌집 관리인들과 꿀벌들이 단 꿀을 모으기 위해 가장 즐겨 찾는 주황색 꽃입니다.",
      "preps": "🟢⚪⚪ 꽃꿀: [FAIR 1]에 첨가하여 사용\n🟢🟢⚪ 꽃잎: [JOY 2]로 조제"
    },
    {
      "name": "동의나물/늪금잔화",
      "rawName": "Marshgold",
      "type": "PLANT",
      "br": 3,
      "regions": [
        "Bog",
        "Loch"
      ],
      "seasons": [
        "Spring"
      ],
      "description": "습지와 늪지대를 밝혀주는 가장 화사하고 아름다운 야생화 중 하나입니다.",
      "preps": "🟢🟢⚪ 꽃잎: [ELSEWHERE 2]에 사용\n🟢⚪⚪ 꽃잎: 달여서 [JOY 2] 및 [BREATH 2]에 사용"
    },
    {
      "name": "마시멜로 풀 (양아욱)",
      "rawName": "Marshmallow",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Bog",
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "캠프파이어 때 구워 먹는 말랑말랑한 과자와 혼동해서는 안 되는 허브 식물입니다.",
      "preps": "🟢⚪⚪ 꽃잎: 끓여서 [FEATHER 1], [FUR 1]에 사용\n🟢⚪⚪ 뿌리 수액: 요리해서 [STOMACH 3] 및 [FAIR 1]에 사용"
    },
    {
      "name": "꽃버섯/초원 왁스캡",
      "rawName": "Meadow Waxcap",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Bog",
        "Meadow"
      ],
      "seasons": [
        "Autumn",
        "Winter"
      ],
      "description": "양들이 풀을 뜯는 목초지 그늘에서 흔히 자라나는 버섯입니다.",
      "preps": "🟢⚪⚪ 버섯: [STOMACH 1]에 첨가, 요리해서 [STOMACH 3] 및 [FAIR 2]에 사용"
    },
    {
      "name": "기적의 빵 (Titan Miracle Loaf)",
      "rawName": "Miracle Loaf",
      "type": "TITAN",
      "br": 11,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "은박지 같은 금속 막에 감싸인 영양 가득한 티탄의 비상식량 조각입니다.",
      "preps": "🟢⚪⚪ 부스러기: 빻아서 [FEATHER 3] 및 [FUR 3]에 사용"
    },
    {
      "name": "사향 병 (Titan Musk Scrapings)",
      "rawName": "Musk Scrapings",
      "type": "TITAN",
      "br": 10,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "아주 신비롭고 이상한 온갖 냄새들이 가득 담겨 있는 실린더 형태의 티탄 용기입니다.",
      "preps": "향수 원액: [JOY 3], [BREATH 3], [SENSES 3], [ELSEWHERE 3], [MOOD 3] 및 [NERVES 3]에 다양하게 스프레이하여 사용"
    },
    {
      "name": "쐐기풀",
      "rawName": "Nettles",
      "type": "PLANT",
      "br": 2,
      "regions": [
        "Bog",
        "Forest",
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "숲속 발가락 사이에 밟히는 흙먼지처럼 어디서든 흔히 볼 수 있는 풀입니다.",
      "preps": "🟢⚪⚪ 쐐기 잎: 달여서 [INFECTION 1] 및 [PAIN 1]에 사용\n🟢⚪⚪ 줄기: 씹어서 [STOMACH 2]에 사용"
    },
    {
      "name": "까마중/벨라도나",
      "rawName": "Nightshade",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "죽음의 어둠처럼 검게 익어가는 매우 치명적인 독을 품은 검은 열매입니다.",
      "preps": "🟢⚪⚪ 검은 열매: 갈아서 달인 뒤 [SENSES 3]에 독성 마취제로 사용"
    },
    {
      "name": "참나무/오크나무",
      "rawName": "Oak",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Forest",
        "Meadow",
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "브리슬리 숲에서 가장 거대하고 위엄 있게 우뚝 솟아오른 고목입니다.",
      "preps": "🟢⚪⚪ 미선나무 꽃: [JOY 1]에 사용\n🟢⚪⚪ 도토리: 갈아 요리해 [FAIR 2]에 사용\n🟢🟢⚪ 나무껍질: 갈아서 끓인 후 [POISON 3]에 사용\n🟢🟢🟢 튼튼한 나뭇가지: 골절된 뼈를 고정하는 데 사용"
    },
    {
      "name": "귤껍질버섯",
      "rawName": "Orange Peel Fungus",
      "type": "PLANT",
      "br": 3,
      "regions": [
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "야수들이 다른 야수를 저편으로 보낸 추모제 의식 때 전통적으로 올리던 오렌지빛 버섯입니다.",
      "preps": "🟢⚪⚪ 버섯 꽃잎: [JOY 1] 혹은 [ELSEWHERE 1]로 사용"
    },
    {
      "name": "진주",
      "rawName": "Pearls",
      "type": "EARTH",
      "br": 8,
      "regions": [
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "맑은 강조개 안에서 간혹 발견되는 영롱하고 매우 아름다운 지구 원소입니다.",
      "preps": "🟢⚪⚪ 조개 진주: [ELSEWHERE 3] 혹은 [JOY 2]로 사용"
    },
    {
      "name": "질병 퇴치제 알약 (Titan Pox-Be-Gones)",
      "rawName": "Pox-Be-Gones",
      "type": "TITAN",
      "br": 10,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "맛이 매우 쓰고 삼키기 힘들지만 온갖 염증과 감염을 즉시 날려버리는 티탄의 작은 백색 하드 알약입니다.",
      "preps": "🟢⚪⚪ 알약 가루: 빻아서 [INFECTION 3]에 사용\n🟢🟢⚪ 알약 즙: [INFECTION 1]에 첨가해 사용"
    },
    {
      "name": "적색 나무 수액 (Titan Redsap)",
      "rawName": "Redsap",
      "type": "TITAN",
      "br": 8,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "수 세기 전에 살던 조상 야수들이 가장 즐겨 마셨다던 진하고 달콤한 붉은 나무 수액 액체입니다.",
      "preps": "🟢🟢🟢 병입 수액: [PAIN 3] 및 [BREATH 3] 완화를 위해 첨가해 사용"
    },
    {
      "name": "루바브/당작약",
      "rawName": "Rhubarb",
      "type": "PLANT",
      "br": 2,
      "regions": [
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer"
      ],
      "description": "산비탈을 따라 군락을 지어 자라며 씹으면 극도로 쓰고 신맛이 강한 풀입니다.",
      "preps": "🟢⚪⚪ 줄기: 씹어서 [FOUL 2]에 사용, 요리하여 [FAIR 2]에 사용\n🟢⚪⚪ 질긴 줄기 섬유: 씹어서 붕대 고정 줄로 묶는 데 사용"
    },
    {
      "name": "창질경이/리브워트",
      "rawName": "Ribwort",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Bog",
        "Meadow"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "야수들 사이에서 종종 나그네의 풀이라고도 불리는 생명력이 끈질긴 약초입니다.",
      "preps": "🟢⚪⚪ 씨꼬투리: 빻아서 [FAIR 1]에 사용\n🟢⚪⚪ 잎사귀: 즙을 내어 연고로 사용"
    },
    {
      "name": "강가박하",
      "rawName": "Rivermint",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Bog",
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Summer"
      ],
      "description": "물안개가 피어나는 서늘한 하천변에서 돋아나는 향긋하고 여린 박하 풀입니다.",
      "preps": "🟢⚪⚪ 잎: 갈아서 상처에 바르거나 [BREATH 2]를 위해 달여서 사용\n🟢⚪⚪ 줄기: 씹어서 [PAIN 1]에 사용"
    },
    {
      "name": "암염",
      "rawName": "Rock Salt",
      "type": "EARTH",
      "br": 7,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "높은 산맥에 사는 현자 염소들이 소중하게 보관하고 지키는 결정 소금입니다.",
      "preps": "🟢🟢⚪ 소금 결정: [INFECTION 2] 및 [WOUND 2] 소독용으로 사용"
    },
    {
      "name": "장미",
      "rawName": "Roses",
      "type": "PLANT",
      "br": 8,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Autumn"
      ],
      "description": "어떤 다른 이름으로 불려도 그 향기는 여전히 달콤할 붉은 꽃송이입니다.",
      "preps": "🟢⚪⚪ 장미 꽃잎: [JOY 1]에 사용\n🟢⚪⚪ 들장미 열매: 빻아서 사용"
    },
    {
      "name": "강조개 껍데기",
      "rawName": "Shells",
      "type": "ANIMAL",
      "br": 4,
      "regions": [
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "내부가 매끄럽고 평평하여 물감이나 연고를 개는 그릇으로 요긴하게 쓰이는 껍데기입니다.",
      "preps": "🟢🟢⚪ 껍데기: 물꼬를 틀 때 다른 영약재 교환 수단으로 요긴하게 가치 발휘"
    },
    {
      "name": "은광석/은 조각",
      "rawName": "Silver Ore",
      "type": "EARTH",
      "br": 11,
      "regions": [
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "부드럽고 가공하기 쉬워 뼈 고정 스플린트나 의치 보철물에 최고로 꼽히는 광물입니다.",
      "preps": "🟢⚪⚪ 은 조각: 갈아서 붕대 안쪽에 얹어 [WOUND 2] 소독 및 뼈 지지용으로 사용"
    },
    {
      "name": "민달팽이",
      "rawName": "Slugs",
      "type": "INSECT",
      "br": 3,
      "regions": [
        "Bog",
        "Forest",
        "Meadow",
        "Titan"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "브리슬리 숲의 야수들이 기력이 떨어졌을 때 단백질을 보충하기 위해 삼키는 주식입니다.",
      "preps": "🟢🟢⚪ 민달팽이: 요리하여 [FAIR 2]에 단백질 보충식으로 사용"
    },
    {
      "name": "작은 물고기",
      "rawName": "Small Fish",
      "type": "ANIMAL",
      "br": 7,
      "regions": [
        "Bog",
        "Loch"
      ],
      "seasons": [
        "Winter",
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "개울가에서 족대로 쉽게 건져 올릴 수 있는 평범한 물고기입니다.",
      "preps": "🟢⚪⚪ 생선 가시: 정교한 봉합 침으로 사용\n🟢🟢🟢 살코기: 요리하여 마시는 약에 풍미 보충\n🟢⚪⚪ 생선 비늘: 기름을 짜내어 연고 기제로 사용"
    },
    {
      "name": "신맛 사탕 (Titan Sourchits)",
      "rawName": "Sourchits",
      "type": "TITAN",
      "br": 10,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "입안에 넣자마자 눈물이 찔끔 날 정도로 신맛이 나는 침 분비용 티탄의 가공 캔디입니다.",
      "preps": "🟢⚪⚪ 알약 사탕: 빻아서 [PAIN 3] 완화에 마취 보조로 사용"
    },
    {
      "name": "거미/거미줄",
      "rawName": "Spiders",
      "type": "INSECT",
      "br": 4,
      "regions": [
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "여덟 개의 다리로 나뭇가지 사이에 정교한 집을 짓는 숲의 사냥꾼 곤충입니다.",
      "preps": "🟢⚪⚪ 거미줄: 상처를 지혈하고 붙잡는 [WOUND 1] 붕대로 사용"
    },
    {
      "name": "야생 딸기",
      "rawName": "Strawberries",
      "type": "PLANT",
      "br": 4,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Autumn"
      ],
      "description": "맛이 좋은 딸기가 자라나는 덩굴의 위치는 부모가 자식에게만 몰래 가르쳐주는 가문 비밀입니다.",
      "preps": "🟢🟢⚪ 딸기 열매: [FAIR 2]로 조제, 요리하여 [FAIR 4]로 조제\n🟢⚪⚪ 딸기꽃: 달이거나 발라서 [JOY 2]에 사용\n🟢⚪⚪ 잎사귀: 빻아서 [HIDE 1]에 사용"
    },
    {
      "name": "쑥국화/탄지 꽃",
      "rawName": "Tansies",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Meadow"
      ],
      "seasons": [
        "Spring"
      ],
      "description": "지역의 경계선이나 길가 모퉁이에서 주로 자라며 톡 쏘는 향이 나는 노란 꽃입니다.",
      "preps": "🟢⚪⚪ 쓴 잎: 소화시켜 뱃속 [PARASITE 3] 구충에 사용\n🟢🟢⚪ 줄기: 달여서 [INSTINCT 1]에 사용"
    },
    {
      "name": "엉겅퀴",
      "rawName": "Thistles",
      "type": "PLANT",
      "br": 3,
      "regions": [
        "Bog",
        "Forest",
        "Meadow",
        "Mountain"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "고대 티탄들이 이 보랏빛의 가시 돋친 아름다운 식물을 아주 좋아했다고 전해집니다.",
      "preps": "🟢⚪⚪ 엉겅퀴 가시 머리: 발라서 [FUR 2]에 사용\n🟢⚪⚪ 엉겅퀴 꿀: [MOOD 1]에 첨가하여 사용"
    },
    {
      "name": "티탄 수영 (Titan Sorrel)",
      "rawName": "Titansorrel",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Forest",
        "Meadow"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn"
      ],
      "description": "샐러드에 넣으면 톡 쏘는 신맛과 쓴맛이 어우러져 입맛을 돋우는 붉은 잎 풀입니다.",
      "preps": "🟢⚪⚪ 잎: [MOOD 1]에 첨가(단, [FOUL 1]도 함께 부가)\n🟢⚪⚪ 뿌리: 요리하여 상처에 연고로 부착 사용"
    },
    {
      "name": "두꺼비",
      "rawName": "Toads",
      "type": "ANIMAL",
      "br": 7,
      "regions": [
        "Bog",
        "Loch"
      ],
      "seasons": [
        "Summer",
        "Autumn"
      ],
      "description": "스트레스를 받으면 피부에서 찐득한 분비물을 내뿜는 양서류 동물입니다.",
      "preps": "🟢⚪⚪ 피부 독성 점액: [SENSES 1]에 소량 첨가(단, [FOUL 3]이 다량 유발됨)"
    },
    {
      "name": "말벌",
      "rawName": "Wasps",
      "type": "INSECT",
      "br": 5,
      "regions": [
        "Bog",
        "Forest",
        "Loch"
      ],
      "seasons": [
        "Winter",
        "Summer",
        "Autumn"
      ],
      "description": "꿀벌보다 몸집이 크고 공격적이며 꿀을 만들지 않는 독충입니다.",
      "preps": "🟢⚪⚪ 말벌 침 독: 신경 자극용 [SENSES 2]에 소량 사용"
    },
    {
      "name": "길잡이 백분 벽돌 (Titan Waychalk)",
      "rawName": "Waychalk",
      "type": "TITAN",
      "br": 10,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "티탄들이 영역을 표시할 때 쓰던 묵직하고 거대한 흰색 석고 분필 벽돌입니다.",
      "preps": "🟢⚪⚪ 석고 조각: 조제용 [ELSEWHERE 3]에 사용"
    },
    {
      "name": "수염 태우개 술 (Titan Whiskerburner)",
      "rawName": "Whiskerburner",
      "type": "TITAN",
      "br": 9,
      "regions": [
        "Titan"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "곡물 발효 길드의 야수들이 빚어낸 어떤 강한 술보다도 독해 코털이 탈 듯한 티탄의 알코올 액체입니다.",
      "preps": "🟢🟢⚪ 소독용 액체: 상처 소독 및 통증 마비용으로 사용"
    },
    {
      "name": "흰버드나무",
      "rawName": "White Willow",
      "type": "PLANT",
      "br": 5,
      "regions": [
        "Bog",
        "Loch"
      ],
      "seasons": [
        "Spring",
        "Summer",
        "Autumn",
        "Winter"
      ],
      "description": "숲의 야수들은 이 버드나무를 강과 호수를 보살피는 물의 수호신으로 여깁니다.",
      "preps": "🟢🟢🟢 껍질: 빻아서 해열용 [INSTINCT 1]에 사용\n🟢🟢⚪ 버들개지: 끓여서 [PAIN 2]에 통증 완화 연고로 사용"
    },
    {
      "name": "야생 마늘/명이풀",
      "rawName": "Can only be Foraged for in Summer Wild Garlic",
      "type": "PLANT",
      "br": 2,
      "regions": [
        "Forest"
      ],
      "seasons": [
        "Spring"
      ],
      "description": "마늘 특유의 짙은 향이 사방에 퍼져 한여름 채집가들의 코를 즐겁게 만드는 풀입니다.",
      "preps": "🟢🟢⚪ 잎사귀: 씹어서 [FAIR 1]에 부착해 사용\n🟢⚪⚪ 줄기: 빻아서 [BREATH 2]에 사용"
    },
    {
      "name": "야생 제비꽃",
      "rawName": "Wild Violet",
      "type": "PLANT",
      "br": 6,
      "regions": [
        "Loch",
        "Meadow"
      ],
      "seasons": [
        "Spring"
      ],
      "description": "벌레에 물린 부위에 바르면 부기를 가라앉히고 가려움을 달래주는 아름다운 보랏빛 꽃입니다.",
      "preps": "🟢⚪⚪ 제비꽃 잎: 소화시켜 [PAIN 1]에 사용\n🟢⚪⚪ 잎사귀: 씹어서 [SENSES 2]에 사용"
    }
  ],
  "travelEncounters": {
    "Bog": [
      {
        "page": 74,
        "card": "ace & 2",
        "title": "Wisps\nYou trudge ahead in the small \ntwilight hours of dusk or \ndawn",
        "text": ". The world is silent, only barely lit by hues of purple, orange and grey. Suddenly, a bright green flare in the distance catches your eye. And then another, and a third! Follow the trail - Something, or perhaps somebeast, is beckoning you deeper into the bog. If you follow the wisps, draw a card. ♥ - Each burst of ethereal colour leads you along a hidden shortcut. Add 1 Day to your calendar. When you turn back, the path is gone. ♦ - Spectral gasps echo throughout the silent bog; the voices of beasts howl from Elsewhere. The wisps lead you to a tool, grasped in the rotten paw of dead beast. Gain a Tool of your choice. ♣ or ♠ - Following the flames only leads you to a wet hollow in the earth that reeks of eggs. Mark 1 Day as you retrace your steps to the road."
      },
      {
        "page": 74,
        "card": "3 & 4",
        "title": "From Rot \nComes Art\nA beast is organising rotting detritus and \nmosses into neat colourful piles by the \nside of the path",
        "text": ". Do you ask them why? If so, what is their reason? Spare Material - You may Trade a Trinket to gain any Common or Rare Bog Reagent. Bog travel encounters The wetlands of the Bristley Woods are many, and scattered amongst the mountains and meadows. Within their lush peat depths lie treasures buried by beasts long since gone Elsewhere. 74"
      },
      {
        "page": 75,
        "card": "5 & 6",
        "title": "Branch-Beaten\nSodden and rotten \ntrees have toppled \nunder pressure \nfrom terrible \nwinds",
        "text": ". You'll need to pick your way through them to get past. The dead branches catch on every nook and cranny. How do you keep your spirits up? Draw a card. If its value is less than 5, a branch breaks underpaw, and you drop you into a dark hollow that is difficult to escape. Mark 1 Day. If its value is 5 - 9, continue your Journey. If its value is 10 or more, the hollow leads to a secluded, fertile glen. Gain an in-season Bog Reagent of your choice."
      },
      {
        "page": 75,
        "card": "7 & 8",
        "title": "Climate Change\nThe weather takes \nan unexpected turn",
        "text": ". A gust of hail in the middle of Summer, or burst of hot sun in Winter; whatever happens, you're left in great discomfort. How do you adapt?"
      },
      {
        "page": 75,
        "card": "9 & 10",
        "title": "Friend In The Mists\nThe bog can be an eerie \nand miserable place",
        "text": ". Just as your hackles are on edge, you bump into another Poulticepounder out collecting Reagents! They ask you how you're doing, what news you have, and if you need any help. Have you met before? What sort of Ailments are they an expert at treating? Helping Paw - They help on your next Forage. Gain twice as many Foraging Points per turn. Giving Back - You help out on their Forage. Mark a Day on your Calendar and earn 1 Trinket from their Patient."
      },
      {
        "page": 75,
        "card": "M",
        "title": "Hardpacked\nThe last creeping frost of \nWinter still holds here as \nyou find a patch of bog \nhard and easily passable",
        "text": ". Lucky Break - You can choose to travel along an additional 2 Paths. Do not complete a second Travel Encounter for you new destination."
      },
      {
        "page": 75,
        "card": "J",
        "title": "Pottering  \nAbout\nYou come across a group of cheery \nCraftpaws holding a pottery class",
        "text": ". Dozens of clay jugs and pots are resting on a large sheet as they cure beneath the warm sun. They ask if you'd like to join in. Join in the class - Mark 1 Day. Gain a Handmade Pot; gain +1 Carry until the end of this Journey. 75"
      },
      {
        "page": 76,
        "card": "M",
        "title": "Busy Work\nCraftpaws and Poulticepounders are some of \nthe few beasts that find themselves drawn \nto the bogs of the Bristley Woods",
        "text": ". This trio of craftpaws are happily soaking reeds for weaving and ask if you'd like to join them. Weave It Alone - You decide you don't have enough time, and so continue on. Sit And Soak - Mark 1 Day. Gain a reed-woven Trinket."
      },
      {
        "page": 76,
        "card": "J",
        "title": "Mudlarking\nYou spy a frog burying \nthemselves beneath \nthe wet mud and using \na little reed to breathe \nout of",
        "text": ". What strange behaviour. Why are they doing that? Do you talk to them? What do they say?"
      },
      {
        "page": 76,
        "card": "9 & 10",
        "title": "That Sucks\nAfter wading through \nshallow water, you emerge \nto find a horrible nasty \nleech stuck onto you!\nHow do you get it off?\nSilver Lining - Gain a \nLeech Reagent",
        "text": ". How do you store it?"
      },
      {
        "page": 76,
        "card": "9 & 10",
        "title": "Pumped Up Cafe\nSome tiny beasts",
        "text": "(mice, rats, voles, and such) have turned a large pumpkin into a temporary cafe; they're serving all manner of drinks and meals. Delicious! - The cooks are happy to trade a Box of Treats (Weight 2/3, [FAIR 4]) for 1 Trinket. You can trade for as many boxes as you like!"
      },
      {
        "page": 76,
        "card": "9 & 10",
        "title": "Blood On The Ice\nAcross the moors you see \nevidence of a Behemoth's \npassing and smell fresh blood \nin the air",
        "text": ". Amongst the frost, slush and mud, panic starts to rise in your chest. What sort of Behemoth would stalk the frozen bogs at this time of year? Abandon your things - You can move faster when unencumbered. Make a note of what you leave behind, and continue your Journey. You can reclaim these Items by returning to this Location on another Move. Take a Detour - Turning right around, you have to back track significantly until you can find a safer route. Mark 2 Days on your Calendar, and continue your Journey. 76"
      }
    ],
    "Forest": [
      {
        "page": 77,
        "card": "M",
        "title": "On The Path\nCampfire smoke brings \nyou close to a group \nof well-armed and \nserious looking beasts",
        "text": "; mercenaries from the Guild of Thickbloods. They're quietly going over a well-marked map, and one compares notes in a journal. \"No, the tracks went north. Your route makes no sense, we must go around this pond here...\" These beasts are tracking down a fugitive, most likely to bring them in for branding (or worse, execution). Who are they tracking? What crime are they accused of? Have you heard rumours about them on your travels? Minding Your Business - These Thickbloods are clearly absorbed in their business. Best the leave them be and continue your own Journey. Directions - Wait - that description sounds familiar... You've seen the beast they're tracking; you can choose to give help or hinder these Thickbloods on their mission: Help - You show on the map where you last saw the Thickbloods' target. Gain 1 Reputation. Hinder - You don't trust these beasts' intentions. You misdirect them. Lose 1 Reputation."
      },
      {
        "page": 77,
        "card": "J",
        "title": "Chilled To The Core\nYou find a young beast in the nearby trees, chilled half \nblue and exhausted",
        "text": ". Where have they come from, and why are they so lost? Stop and help - Mark 2 Days on the Calendar and Gain 3 Reputation. You take the time to guide them home. Move yourself to the nearest Settlement. Passing Warmth - Mark 1 Day on the Calendar and Gain 1 Reputation. You spend the afternoon building them a fire and brewing them hearty teas. They warm their body before heading off on their own."
      },
      {
        "page": 77,
        "card": "J",
        "title": "Fungi Founder\nAs you squidge through \nrotten bark and peaty \nmuck you come across \na mushroom that you've \nnever seen before",
        "text": ". You've found a new species which you get to name! Testing - It's your responsibility to see what it does. Eat the mushroom and Draw a Card: ♥ - It is a curative! Choose a [TAG] and add your Mushroom to the Reagent List with a Foraging Value of 10 and Potency 2. ♦ - It's delicious! You may trade the rest for a Trinket at any Settlement! ♣ or ♠ - It was poisonous. Your Speed is halved until you Mark 3 Days. 77"
      },
      {
        "page": 78,
        "card": "5 & 6",
        "title": "Hot Tea\nSeveral beasts are \ngossiping at the side \nof the path",
        "text": ". Eavesdrop - Add Gossip to your bags. When Bartering, you can trade this Gossip to automatically receive your chosen Reagent; however, the Guild loses 1 Reputation. ACE & 2 In Bloom Bless your whiskers, feathers and/or scales! You’ve found something growing at the side of the path! What was it growing in? Why hasn't anybeast noticed it? Greenpaw - Draw a card. Collect a Plant Reagent Part that can be found in the Forest with a Base Value equal to the card’s."
      },
      {
        "page": 78,
        "card": "7 & 8",
        "title": "From Up On High\nBeasts crowd around a Titan \nobject just off the path",
        "text": ". They say it fell out of a tree. Look around the space you are in and choose an object to inject into this scene. How does your Poulticepounder misunderstand its true purpose or function? The Gift of Knowledge - You can draw a Sketch (Weight 1/3) of this mysterious artefact, and add it to your bags. Trade it to the Craftpaws - When in a City, you can trade this Sketch to a Craftpaw representative in exchange for a Local reagent of any value. Trade it to the Knowers - During Downtime, at the end of your Journey, a mysterious magpie will find you. If you give this Sketch to them, they will reward you with 5 trinkets, or a Tool of your choice."
      },
      {
        "page": 78,
        "card": "3 & 4",
        "title": "Rest Stop\nNot far into the trees \nyou spot a traveller's \ncampfire",
        "text": ". They invite you to sit and share stories from the road. Where have they come from, and where are they going? What stories do they share with you? Forest travel encounters Thick boughs of pine, spruce, oak, silver birch and more hold up the immense canopy above. Meandering trails can lead travellers safely home... usually. 78"
      },
      {
        "page": 79,
        "card": "9 & 10",
        "title": "Memories\nA pleasant wind blows \nthrough the trees \nmaking the forest feel \nalive for the first time \nin months",
        "text": ". You feel your thoughts drift back, reflecting on your past. What moment do you recall?"
      },
      {
        "page": 79,
        "card": "M",
        "title": "Parade\nYou stumble upon a group of \nbeasts clad in colourful clothes, \nsinging happy songs",
        "text": ". What are they celebrating? Do you join in? What is the strangest part of their party?"
      },
      {
        "page": 79,
        "card": "M",
        "title": "Go Ape\nA group of youngsters \nare up constructing \na dexterity course \nabove you amongst \nthe branches of the \ncanopy",
        "text": ". Swings, ziplines, climbing holds, and more are hammered into place! They call down to you and ask if you want to help them build it. What part of the course do you make? What do the young beasts call it? Via Ferratta - Strangely its much faster to take the treetop course than it is to walk along the twisting forest paths. Do not Mark a Day on your calendar at the end of this Move."
      },
      {
        "page": 79,
        "card": "9 & 10",
        "title": "Typical Summer\nThe weather takes \na turn for the worse \nforcing you into \nshelter for the night",
        "text": ". Seek Shelter - Draw a card to see what shelter you can find. ♥ or ♦ - Somewhere safe, such as a friendly beast’s home, a cosy hollow, a warm burrow. ♣ or ♠ - Somewhere cold, wet, or frightening. Halve your speed for your next move."
      },
      {
        "page": 79,
        "card": "J",
        "title": "Freshly Grilled\nThe smell of fish oil sizzling on hot \ncoals draws your attention to a \nsummer barbecue taking place in \nthe lee of a small stream a ways \ninto the nearby woods",
        "text": ". What sort of dishes have folks brought to the party? If the Guild's Reputation is at least Known, they recognise you as a Poulticepounder, and invite you to join them. Add 2 to your next Timer. If the Guild's Reputation is Unknown, they nod cordially as you make your way past."
      },
      {
        "page": 79,
        "card": "J",
        "title": "Danger Ahead\nFrightened beasts stop you, \nsaying not to go any further \ndown the path",
        "text": ". A wasp nest has fallen, and the blighters are stinging anyone who goes near. Find another route - Re- plan your Move, avoiding the last two paths chosen. Brave the monsters - Drop a Reagent or Tool you are carrying as you rush past! 79"
      },
      {
        "page": 80,
        "card": "9 & 10",
        "title": "Wayfriend\nAs you wander the woods, \na fellow traveller waves a \nmassive wing in greeting",
        "text": ". An elderly capercaillie introduces themselves as Griph, and remarks on your interesting packs. What is Griph doing in the woods today? Is he delivering a package, gathering interesting goods for his travelling market stall, or something else? Friendly Natter - Griph shares a tall tale of what he's seen ahead on the road. As he talks, his large claws trod a path through the underbrush. Add 1 Day to your Calendar as he unwittingly beats a path for you. Friend for the road - When you next Move, Griph will follow you if you choose a Forest location. Ignore the negative effects of a Beast or Behemoth encounter; Griph always defends his friends!"
      },
      {
        "page": 80,
        "card": "J",
        "title": "Turning Fortune\nAnnoyingly, the path ahead is muddy \nand unappealing",
        "text": ". You slip from the road and end up covered in bruises, but as luck would have it, you discover a new shortcut. Mark 1 Day on the Calendar, or Lose a Reagent or Tool from your Bags. Connect this Location to another nearby Location with a Path."
      },
      {
        "page": 80,
        "card": "M",
        "title": "Lost-And-Found\nSome poor beast has dropped a Trinket \nand it's been half buried in mud",
        "text": ". Finder's, Keeper's! - Gain a Trinket. The Right Thing To Do - Leave it somewhere it can easily be found. Increase Guild Reputation by 1 80"
      }
    ],
    "Loch": [
      {
        "page": 81,
        "card": "9 & 10",
        "title": "Fairwinders\nA beast migrating from the colder \nlands up north stops and asks you for \ndirections to the nearest City so they \ncan resupply",
        "text": ". They are happy to chat about their home and travels. What amazing, far-away cities do they tell you about?"
      },
      {
        "page": 81,
        "card": "M",
        "title": "Hunger Pains\nRavenous beasts slip \nout from behind trees, \nlooking for something \nto stave off the winter \nchill",
        "text": ". Their mouths ask politely for aid, but their eyes betray a deep desperation. How has winter's scarcity affected these beasts? Roadside Tea - If you have a Reagent that can produce either [FAIR] or [STOMACH], you can brew these rag-tag beasts some hearty tea. Mark 1 Day on your Calendar. Grateful for your generosity, they tell others of your kindness. Gain 3 Reputation. Aid - You've nothing to spare, but they might trade at a nearby Settlement for some food. Give the beasts 1 Trinket and gain 1 Reputation Cold Shoulder - You have neither the stores nor the patience to give in to pressure from roadside beasts. Draw a card: ♥ or ♦ - Continue your Journey. ♣ - They spit at your feet as you leave, and spread nasty rumours about the guild. Lose 1 reputation. ♠ - Hunger pushes them to violence! Chased through the woods, you lose 3 Trinkets."
      },
      {
        "page": 81,
        "card": "J",
        "title": "Piledriver\nMassive tracks in the slushy \nearth prove without a doubt \nthat a Behemoth has passed \nthrough here recently",
        "text": ". Perhaps it still lurks in the woods nearby! Do you know what animal it is, and have you seen one of them before? Backtrack - Mark 1 Day on your Calendar as you detour away. Hurry Forwards - Draw a card: ♥ (or ♦ if you're carrying equal to or less than 4 Weight) - you manage to sneak safely past without being noticed. Phew! ♣ or ♠, (or ♦ if you are carrying more than 4 Weight) - The behemoth spots you, and gives chase! Discard at least 3 Weight of items from your Bags. 81"
      },
      {
        "page": 82,
        "card": "5 & 6",
        "title": "Carpe Carp-ey\nA great big fish moves beneath \nyou, its glittering scales \nshimmering in the dancing light \nbeneath the water's surface",
        "text": ". For a second, it touches the top of the water and you could maybe grab it! What sort of big fish is it? A salmon, trout, pike? Do you grab it or let it go? Grabby Paws - Draw a card for you and a card for the fish. If your card is Higher, gain all parts of a Big Fish Reagent. If your card is Lower, the fish drags you under the water and in the struggle, something falls out of your Bags. Lose an item from your Bags."
      },
      {
        "page": 82,
        "card": "3 & 4",
        "title": "Muddy Waters\nThe tip of something brushes \nagainst you beneath the surface of \nthe water here",
        "text": ". Draw a card to determine what lurks below: J or M - It’s a Titan wreck! What does it look like? What do you think the Titans used it for? Ace - 10 - It's some kind of natural formation such as a tangle or weeds or a sand bank. How do you think it formed in a place like this?"
      },
      {
        "page": 82,
        "card": "ace & 2",
        "title": "Undercurrent\nThe movement of the water \nproves too powerful to resist",
        "text": ". Currents drag you along until you wash up somewhere unexpected. Washed Away - Draw a card and move to the nearest Location in that direction. If that location is a Loch, Move there and repeat this process. ♥ - North ♦ - South ♣ - East ♠ - West Loch travel encounters Freshwater, fed by rivers which in turn are fed by rains. Teeming with fish, clams, and all manner of insects. Their dark, lightless depths hide strange wreckages. 82"
      },
      {
        "page": 83,
        "card": "M",
        "title": "Cruise\nA crew of beasts pass you \naboard a truly beautiful \nboat",
        "text": ". However, the vessel is really making waves!\" Who is the beast that captains this vessel? Choppy Waters - You can't help but be pulled along in their wake. Draw a Card: J or M - They're heading in the direction you want to go! Move along 1 path, or stay where you are. 2 - 10 - They're land bound - move one path toward the closest shore. Ace - They're heading directly for you... wait, look out! You capsize in the water; unless you have a Waxed Satchel, your bags are Soaked!"
      },
      {
        "page": 83,
        "card": "9 & 10",
        "title": "Less Than Titanic\nYou spy a beast not \nsuited to the water \nclinging to a slowly \nsinking piece of \ndriftwood",
        "text": ". How did the beast get there, and why did they need to cross the water? Rescue! - Mark 1 Day and change the end of your move to the nearest non-Loch Location. Gain 1 Reputation. Lessons should be learned - This beast needs to learn not to bite off more than they can chew."
      },
      {
        "page": 83,
        "card": "J",
        "title": "Need For Speed\nA showboating water \nbird challenges you to \na race in front of their \nflock",
        "text": ". Refuse - They mock you and splash water at you. Flick water on one of your Journal pages, or blur/ alter some of the words. Race - Draw two cards for the bird, and one for you. The highest value card wins. If you win - Gain 1 Trinket as a prize. If you lose - Gain 1 Reputation, for being a good sport."
      },
      {
        "page": 83,
        "card": "7 & 8",
        "title": "Push and Pull\nA sudden swell of \nwater picks up and \ncarries you!\nDraw a card to see \nhow the water helps or \nhinders you",
        "text": ". ♥ or ♦ - You are pulled along; travel an additional 2 Paths. ♣ or ♠ - You are pushed back; travel backwards 1 Path."
      },
      {
        "page": 83,
        "card": "9 & 10",
        "title": "Log Floats\nA raft of logs tied together with \ncoarse rope floats lazily ahead, \nmanned by a crew of beavers",
        "text": ". They use tall poles and their paddling tails to push it along. What do you think this lumber will be used for? Where have the trees come from, and what different species are they? 83"
      },
      {
        "page": 84,
        "card": "9 & 10",
        "title": "Snarling Threats\nYour luck has run dry - \nthis waterway is choked \nwith Hornweed",
        "text": ". This nasty nuisance makes it much harder to navigate, and it's just going to get worse if left alone. Cull - Mark 1 Day on your Calendar to remove as much of it as you can. Gain 2 Reputation. Leave It - Draw a card: ♥ or ♦ - A local beast deals with it! ♣ or ♠ - it grows rampant, all Reagents have +3 Rarity in this Location until Winter."
      },
      {
        "page": 84,
        "card": "J",
        "title": "Pi-rats!\nA boat full of hollering \nbeasts with a skull and \nbones flag comes sailing \nup towards you",
        "text": ". Their captain points a sword at you and demands to know your business, and if \"ye wish to be sunk to Nessie's Locker\" What is the Captain's name? What does their boat look like? Do the crew have a uniform? Parley - One of the crew is ill and they demand your help. Instead of Helping a Local Beast, you are now Helping a Local Pirate; if you would earn Reputation from this Ailment, instead gain Trinkets. If you fail to create a Remedy, you are Taken Prisoner. Ship-to-Ship Combat - If you are in a Coracle or adapted Wagon, you can try to fight the Pirates off. Draw a card for yourself and two for the Pirates. The highest total wins. If you win - You escape to an adjacent Location unharmed. How did you escape? If you lose - You are Taken Prisoner! Taken Prisoner - Your Journey ends here. The pirates capture you and keep you prisoner for the remainder of the Season. What do you learn about them? How do you finally get away?"
      },
      {
        "page": 84,
        "card": "J",
        "title": "Winged  \nMenace\nConfused and near death, \na big wasp has wandered \nout onto the water",
        "text": ". It's taking all its strength just to stay afloat, poor thing. Do you risk saving it? A Second Chance - If you have a Coracle or adapted Wagon, you can scoop it aboard with no issue. Gain a Wasp Companion."
      },
      {
        "page": 84,
        "card": "M",
        "title": "Vicious Murk\nBlue-green algae blooms \nacross the surface of the \nwater here",
        "text": ". It would be beautiful if it wasn't so poisonous. Change Course - This Location is off-limits until the end of the Season; it cannot be Moved through or Foraged in. Travel back 1 Path. 84"
      }
    ],
    "Meadow": [
      {
        "page": 85,
        "card": "9 & 10",
        "title": "Figure Skating\nYou see the criss crossing marks of skates across \nan unbroken patch of ice",
        "text": ". Looks like some beasts have been out playing in the short winter sun! Skate - A pair of friendly beasts lend you a set of ice skates. You can choose to travel along up to 2 extra Waterways as part of this Move."
      },
      {
        "page": 85,
        "card": "J",
        "title": "Frostbitten\nBiting cold winds and icy \nwaters are beginning to \nget to you, draining your \nmorale and leaving you \nbitter",
        "text": ". Cold Paws - Start the next Ailment with 0 Foraging Points; you gain half the usual Foraging Points, rounded down."
      },
      {
        "page": 85,
        "card": "M",
        "title": "Hospitality , Eh?\nGeese from a faraway \nland are pouring hot \ndrinks for any chilly \nbeasts they see trying \nto cross the local lochs \nand rivers",
        "text": ". Why are they doing this? What cold land are they from? What does their drink taste like? Warmth - Start your next Ailment with 4 Foraging Points."
      },
      {
        "page": 85,
        "card": "M",
        "title": "Two-Faced\nA small boat with a \ncouple of soldiers pulls \nup and asks if you've \nseen a dangerous beast \nin these waters",
        "text": ". They describe the last beast you met on a Forage or Travel. What did the apparently dangerous beast do? What city are these guards from? Spill The Beans - You tell them everything they need to know. Is that beast ever caught? If so, what happens to them? Keep Quiet - The guards aren't always right after all. The next time you meet that beast, you can try find out their supposed crime and whether they are innocent or not. Vigiliante - If you draw a Monarch for a Travel Encounter, you cross paths with this beast again. If you think they are guilty, you can try to bring them in. Draw one card for yourself and one for them. Highest card wins. If you win - Start a new Goal with the nearest City as your Destination. Gain 10 Reputation for bringing them in. Journal about why you felt the need to enforce justice. If you lose - They escape, never to be seen by you again. 85"
      },
      {
        "page": 86,
        "card": "5 & 6",
        "title": "Brick By Brick\nThe sound of \nStonestackers hard \nat work echoes \nacross the meadow",
        "text": ". As you get nearer you see what they’re halfway finished. What Titan ruin is their construction inspired by?"
      },
      {
        "page": 86,
        "card": "3 & 4",
        "title": "Roadtreat\nA passing Doughfellow \noffers you some baked \ngoods for the road and \nrefuses any payment",
        "text": ". How do they taste? What special ingredients were used to flavour them? Sugar Rush - When you next Forage, Locations up to two Paths away count as Adjacent."
      },
      {
        "page": 86,
        "card": "7 & 8",
        "title": "Sorry , We've  \nMisplaced Your Order\nSomething falls out of a passing \nNoonmessenger’s satchel, and \nthey don’t seem to have noticed",
        "text": ". What shape is the parcel, and how is it wrapped? Who is it addressed to, and who is it from? Call out to the Messenger - Gain 1 Reputation. Who is the messenger and how do they react? Deliver the Parcel - Add a 'Parcel' to your Bags. Choose a Location 4 Paths away for its address. Gain 3 Trinkets if you go to that Location, delivering it. Keep the Parcel - Choose and Gain a Tool or Upgrade from the Almanac, and lose 1 Reputation. ACE & 2 Obstruction Little wagons laden with foods and goods are backed up along the path; it seems a tree has fallen and blocked the road ahead. Beavers have been called to gnaw the path clear, but it'll be a few hours yet before the road is clear again. How are the queuing beasts dealing with the wait? If you have a Wagon - Mark 1 Day on the Calendar as you are stuck in traffic. What other wagons and caravans are ahead and behind you? If you don’t have a Wagon - You easily slip through traffic. With a friendly boost from the beavers, you scramble over the trunk and are on your way. Meadow travel encounters Open skies, bright sunlight, and a wealth of wildflowers await you. Carefully carved out fields grow food for beast settlements. 86"
      },
      {
        "page": 87,
        "card": "9 & 10",
        "title": "Highway Robbery\nA field mouse pup \narmed with a toy sword \nstops you and playfully \ndemands a tithe",
        "text": ". Pay with your pockets - Lose 1 Trinket. How does the mouse pup react to their sudden bounty? Pay with your life - Mark 1 Day on your Calendar. Journal about a mock fight you have with the pup, and how one of you 'slays' the other. Pay with your patience - Storming past the pup, you continue your journey. Lose 1 Reputation."
      },
      {
        "page": 87,
        "card": "M",
        "title": "Hired Paws\nBeasts of all shapes \nand sizes are hard at \nwork planting seeds \nand readying the land",
        "text": ". A farmer asks if you’d be willing to lend a paw. Have you any experience working in fields? Have you tried growing plants before? Farmpaw - Mark as many Days off your Calendar as you like, and gain a Trinket for each Day, paid all at once when you leave. New Cultivar - You can encourage the Farmers here to grow a non Region native plant, if you have a Part of it in your Bags. If you do this, discard the Part, and make a note of this on your Map. You can now Forage for this plant at this location."
      },
      {
        "page": 87,
        "card": "J",
        "title": "Returning  \nSongbirds\nA family of birds who \nmigrated south for the \nwinter have stopped here \nto rest their wings",
        "text": ". They are content to answer a few questions in exchange for news of your own. What do they tell you of distant southern shores? What do you ask and what news do you share? Bargain - You can trade for some Fairwind Spices (Tools, page 62) from these birds."
      },
      {
        "page": 87,
        "card": "J",
        "title": "Animal  \nCrossing\nA friendly hivewarden greets \nyou as you approach their \nbumbling bees",
        "text": ". They ask if you can wait so as not to spook their flock. How does this hivewarden distinguish their bees from other colonies? Wait - Mark 1 Day, but gain a Bees. Spook Flock - Lose 1 Reputation as you scatter their bees in your haste."
      },
      {
        "page": 87,
        "card": "9 & 10",
        "title": "Rooting  \nAround\nGigantic boars terrorise this pasture, tearing up \ncarefully planted fields and breaking burrows",
        "text": ". Where do the locals hide when these dangerous behemoths cause trouble? It is unsafe to Forage in this Location until you next Move On. You can only Forage in Adjacent locations. 87"
      },
      {
        "page": 88,
        "card": "M",
        "title": "Cowtown\nThe travelling \nmerchant town of \nBaile b",
        "text": "ò has stopped in this meadow. The great highland cow that carries this pastoral settlement upon its saddle is grazing while rat merchants lower ropes and ladders down its sides for goods and guests. What sounds and smells are there in the little town? If you are too big to enter, how does the cow react to you? How do the merchants show you their wares? Visit - This Location temporarily counts as a Settlement. Your next patient is a citizen of Baile bò. You can request services here when Preparing to Leave, and Barter while resolving Ailment."
      },
      {
        "page": 88,
        "card": "9 & 10",
        "title": "Deluge\nRain beats down \nincessantly, soaking you \nthrough and turning the \ndirt to mud",
        "text": ". Great puddles turn the once reliable path into mush. Find Shelter - Mark 1 Day on your Calendar as you wait out the rain Push on - If you are a non- aquatic creature, unused to cold and damp conditions, you must create a remedy to soothe a growing [TEMPERATURE 1] before your Move On. If you fail to create a remedy for yourself, mark 3 Days on your Calendar as you are bed-ridden with the most awful cold."
      },
      {
        "page": 88,
        "card": "M",
        "title": "All Paws  \nAppreciated\nHarvest is in full swing and \ncrates of vegetables and \ngrains are piled high at the \nedge of the field",
        "text": ". A farmer offers you a PLANT Reagent of your choice if you help bring in the last of their crops. Help with the harvest - Mark 1 Day on your Calendar and gain a Meadow Plant Reagent of any value."
      },
      {
        "page": 88,
        "card": "J",
        "title": "Ghost Tales\nSeveral wagons and and individual travellers \nhave set up a camapsite ahead",
        "text": ". As the night draws in, they sit around a large bonfire and tell hair-raising stories about the land Beyond Elsewhere. What do their dark beast fables speak of? What place in the Bristley Woods is supposed to be haunted by Beasts who cannot find a road Elsewhere? 88"
      }
    ],
    "Mountain": [
      {
        "page": 89,
        "card": "M",
        "title": "Solitude\nSnow lies thick across the \nfields here, undisturbed by \npaw prints",
        "text": ". An early sunset means you can see the stars. You are utterly alone in the open majesty of the Bristley Woods. What constellations can you see? Can you remember any of their names? Amateur Astronomy - The shape of stars stand out clearly to you, helping orientate your travel. Add 1 Day to your Calendar."
      },
      {
        "page": 89,
        "card": "9 & 10",
        "title": "Alls Fair In  \nSnow And War\nSome beasts are playing \n'Behemoth of the Branch' on \na fallen log",
        "text": ". The log sits on two stones, with fresh snow piled underneath. The snow is marked with the holes of fallen beasts. They ask if you want to join in! Do you think of yourself as a competitive beast? Challenge Accepted - Draw 1 card for yourself and 3 for the other beasts. If your card is: Highest - you win! The beasts give you a trophy and cheery pats on the back. This trophy counts as a trinket - what does it look like? Not Highest - you had fun but got knocked off. You land with a thud in the slushy snow."
      },
      {
        "page": 89,
        "card": "J",
        "title": "Snow \nClan\nIt looks like someone has made a \nsnowbeast beside the path",
        "text": ". What animal does it look like? What has the original artist used to decorate it? Build it a friend - Make your own snowbeast to keep it company. 89"
      },
      {
        "page": 90,
        "card": "7 & 8",
        "title": "Break With A View\nThe journey is exhausting and you \nsoon find that you or your familiar \nneed to rest",
        "text": ". Who calls for a rest stop first? Rest - Mark 1 Day. From your rest stop, you have a wide view over the Bristley Woods below. You can see many natural features from the mountainside. Which is your favourite?"
      },
      {
        "page": 90,
        "card": "ace & 2",
        "title": "Climate Change\nThe weather takes an \nunexpected turn",
        "text": ". A gust of hail in the middle of Summer, or burst of hot sun in Winter; whatever happens, you're left in great discomfort. How do you adapt?"
      },
      {
        "page": 90,
        "card": "3 & 4",
        "title": "What Goes Up",
        "text": "... As you descend a slope, you see another beast labouring up it. They look absolutely exhausted. Can you give any helpful advice for the trail?"
      },
      {
        "page": 90,
        "card": "5 & 6",
        "title": "Magpie's Mark\nThere is an old Titan marker \nhere, it has symbols and \nTitan words upon it but only \nthe Magpies really know what \nthey mean now",
        "text": ". What do you think this marker was for? Mountain travel encounters From the tops of each peak you can see four corners of the Bristley Woods, and the curving horizons containing an infinity of other lives. 90"
      },
      {
        "page": 91,
        "card": "9 & 10",
        "title": "Pretty Prickles\nThick gorse bushes \nhave grown all over \nthe mountainside",
        "text": ". You'll have to go through them somehow. Gorse has a very distinct smell when it flowers; do you like this sweet, coconuty aroma? Deep breath - you push through, trying your best to tough it out. Draw a card to see how you fare: ♥ - You push through unpricked. ♦ - As you move, your Bags were pulled open. Discard a Reagent. ♣ or ♠ - You get tangled and stuck. Mark 1 Day on your Calendar. How do you get out?"
      },
      {
        "page": 91,
        "card": "M",
        "title": "Springmel t\nSome of the spring \nmelt flows by the path \nhere and is deliciously \nrefreshing",
        "text": ". Drink Up - You may ignore the next 7 or 8 you draw while Travelling along the Mountain"
      },
      {
        "page": 91,
        "card": "J",
        "title": "Knights Of  \nThe Round Table\nA group of rough-and-tumble \nbeasts approach from further \nup the path",
        "text": ". They appear to be on some sort of adventure! What are their names? What is their quest? What be their favourite colours? Quest! - If you wish, you can abandon your old Journey and start a Quest. This special Journey takes place in the same season, is a distance of 24 Paths away in a random direction, and has an Urgency of Important. The goal of this Quest is to put down a vicious and cruel Behemoth. Ailments drawn during this Journey relate to these Questing Beasts. Place a Behemoth Barrow at the destination of this Quest Journey. Fighting the Behemoth - If you arrive at the Barrow in time, Draw a Card, lowering its value by 2 for every Ailment you failed to resolve on your Quest. If the final value is equal to or greater than 7, the Questing Beasts slay the Behemoth! If its final value is lower than 7, the Behemoth is victorious. How do you escape? Too Late - If you are late, the Behemoth has gone to ground. The Questing Beasts thank you for your help, and continue on without you. At the end of this Journey, gain 1 Reputation for each Ailment you successfully resolved. If the Behemoth is slain, gain 10 Trinkets and a Tool of your choice from the creature's hoard. 91"
      },
      {
        "page": 92,
        "card": "9 & 10",
        "title": "Yodelling  \nGorillas\nAround the next bend \nof this mountainside \npath, you hear jovial \nhumming",
        "text": ". Expecting a choir of beasts to make such noise, you are briefly terrified to see a single Behemoth - a massive gorilla! Have you met Bakar before? This friendly gorilla travels the world, trying to understand the mysterious precursors, called Titans, whose civilisation ended as the Beasts' began. Stop for a Tale - Sitting in the warm shade of a rock, Bakar enthusiastically shows you his notebook. Inside are drawings of Titan structures. Mark 1 Day on your Calendar, and add 'Titan Tale' to your bags. It can be discarded during Haggling to automatically get a Reagent Part. A Helpful Lift - You delicately ask if you could move past. Bashfully, he gathers his things, and asks where you're headed. Upon reply, he lifts you up a sheer cliff face - \"Here, little one\" his voice rumbles, \"a short cut; my way of apologising!\" Add 1 Day to your Calendar and continue your Journey."
      },
      {
        "page": 92,
        "card": "J",
        "title": "Parched!\nWater, water, everywhere, \nbut not a drop to drink",
        "text": ". The sun has dried up all the fresh water on this mountainside to gooey mud, and you can feel your spit turning to sticky froth. March - No choice but to keep going. When you start your next Ailment, reduce its Timer by 3 to represent your exhaustion. Replenish - You stop to search for something to quench your thirst; damp cave moss, berries on bushes - anything. Mark 1 Day."
      },
      {
        "page": 92,
        "card": "M",
        "title": "Squeaky  \nWheels\nYou come across a Guildbeast \ntrying to fix their cart",
        "text": ". They ask for your help if you can spare it and offer to reimburse you for your time. What guild are they from? What are they carrying? Fetch The Oil - You help repair the broken cart. Gain 1 Trinket, and Mark 1 Day Shrug - You leave the guildbeast to their fate. Lose 1 Reputation. 92"
      }
    ],
    "Soar": [
      {
        "page": 93,
        "card": "J",
        "title": "Tobogganing\nYou come across a \nnervous beast holding \na sled and looking \ndown a nearby hillside",
        "text": ". Their friends have left tempting tracks, but this beast is too scared to follow. Will you help? Sled - Travel to a nearby non-Mountain Location and Add 1 Day to your Calendar as you rush down the mountainside Long Walk - Mark 1 Day and travel to a nearby non-Mountain Location. Gain 1 Reputation for helping the nervous beast"
      },
      {
        "page": 93,
        "card": "M",
        "title": "Treacherous Footing\nThick flurries of \nsnow blow over the \nmountainside, turning \nnarrow paths almost \ninvisible against steep \nwhite slopes",
        "text": ". More snow falls endlessly down from soupy grey skies. Dig through - You can dig through. You need to spend extra time building warm shelters, whenever you take a break; Mark 1 Day on your Calendar. Frigid Gusts - If you can fly or soar, you can ride the wind. Snow saps the heat form your muscles. Lower your next Timer by 2."
      },
      {
        "page": 93,
        "card": "9 & 10",
        "title": "Dastards Ahead\nAs you're passing a small \nhollow you overhear a \ngang of beasts plotting \nsomething foul for the \nnearest settlement",
        "text": ". What do they plan, and when are they going to do it? Warning - If you can Move to the Settlement before you Mark 2 Days, you foil the bandit's plans. Gain 4 Reputation. How does it unfold? On Their Own - You don't have the time or ability to reach the Settlement. The next time you go to that Settlement it will bear the mark of these bandits. How has it changed?"
      },
      {
        "page": 93,
        "card": "J",
        "title": "Red Sky  \nAt Night",
        "text": "... All the beasts you meet mutter about a coming storm, citing all manner of folk rumours and sayings to back up their so-far-unfounded claims. You and your familiar are on the fence: What saying do you hear most? Is there any truth to it?"
      },
      {
        "page": 93,
        "card": "M",
        "title": "Do You Nose  \nYour Herbs?\nYou cross paths with a \nlocal forager, smelling \nat a patch of sprouting \nherbs",
        "text": ". They're hoping to use them in a dish they're cooking tonight, but aren't sure of the herb's flavours. How might this particular herb affect their recipe? 93"
      },
      {
        "page": 94,
        "card": "ace & 2",
        "title": "Gale\nA sudden crosswind blows \nunderwing, shifting you \nfarther and farther from your \nintended goal",
        "text": ". As frustrating as it is, you could follow this new aircurrent to its conclusion, or make an earlier landing. How does it feel to be thrown through the air, in control of your body but not where you're headed? Follow the Winds - Rotate you Flightpath 45° left or right. End your Soar at any Location along your Flightpath. Quick Descent - End your Soar at a Location up to halfway along you Flightpath."
      },
      {
        "page": 94,
        "card": "5 & 6",
        "title": "Unbuckled\nWith every beat \nof your wings, \nyou can feel \nsomething rattling \nlooser and looser",
        "text": ". With growing horror, you realise one of your bags aren't securely strapped down! Safe descent - With a protective whirl, you go to ground so that you can make sure all of your goods are safe. End your Soar at a Location up to halfway along your Flightpath. Too important to stop - Whatever is loose, you can't afford to delay. As you approach your destination, something slips loose. Draw a Card: ♥ or ♦ - Drop a Reagent ♣ - Drop a Tool ♠ - Drop your Bags. Make note of a Location near to your Flightpath. Whatever dropped, you can find it again by Foraging in that Location; it has a Rarity of 10."
      },
      {
        "page": 94,
        "card": "3 & 4",
        "title": "Swift Journey\nA fast breeze carries you \nalong effortlessly, pushing you \ntowards your destination",
        "text": ". Do not Mark a Day for this Move. Soar travel encounters Wide wings and sturdy gliders catch swirling updraughts. Not for the faint-hearted or inexperienced. 94"
      },
      {
        "page": 95,
        "card": "7 & 8",
        "title": "Less Than  \nMajestic\nAs you coast on a \nconvenient updraught, \nyou spot a vigorously \nstruggling blur of \nred and brown \nfeathers below you",
        "text": ". A capercaillie is trying his hardest to cross the gap between two mountains. Swoop in to help - You guide the large bird towards a nearby tree, where he can breathlessly perch and recollect himself. He introduces himself as Griph, Wanderer Extraordinaire. This elderly bird excitedly tells you about why he was crossing over from the mountain. End your Soar at a Location roughly halfway along your Flightpath. Gain 1 Reputation. Stay out of it - He got himself into this situation, and he only has himself to blame. As you ride the breeze, you look back and see a rug full of glittering specks topple off of the capercaille's back. End your Soar at your chosen destination. Griph's Services as a trader are unavailable for the remainder of your Journey."
      },
      {
        "page": 95,
        "card": "9 & 10",
        "title": "Talons\nUp where the air is cold \nand low-lying clouds \npenetrate even well \noiled garments with their \ndrenching spittle, you are \nfree from gravity's reign",
        "text": ". A delightful spin through empty air alerts you to sudden danger. Sea Eagle! Hunger and poor hunting has driven this coastline Behemoth inland. Outmanoeuvre - Twisting and twirling, you stay inches out of reach from the sea eagles claws and beak. Can you keep up the aerial acrobatics? Draw from the deck. ♥ - Somehow, you tire the hungry eagle enough to catch an updraught and escape. You arrive safely at your chosen destination. ♦ - A crosswind spins you head over paws as the eagles talons clasp down. You escape, carried on the wind safely towards your target destination. Only upon landing do you realise one of your bags is missing. Discard a minimum of 1 weight worth of items. ♣ or ♠ - Just as you think you're clear of your pursuer, a white hot pain lances across your back. Arching in pain, the two of you spin down to the ground below. You wake a short time later, desperately hurt. End your Soar halfway along your flight path. You need to create a remedy for [WOUND 3] [INFECTION 2] [PAIN 2], with a Timer of 12. If you fail to create this remedy, you will die. 95"
      },
      {
        "page": 96,
        "card": "J",
        "title": "Silent Observer\nAs you coast through the air, a dark grey speck \ngrows larger in your peripheral vision",
        "text": ". You notice it's some kind of bird, hovering in the air with wings of steel that spin impossibly fast. It's not until you're passing it that you realise it might be some of kind of contraption - possibly of Titan make! What do you think this drone is doing here, miles above the ground? End your Soar at your chosen destination."
      },
      {
        "page": 96,
        "card": "M",
        "title": "High Above It All\nSparing a glance towards the \nground to check your bearing, \nyou notice something unusual \nhappening",
        "text": ". What does it feel like to look down on the world, massive cities and mountains reduced to small specks? Spiral down to see what's going on - Choose a Location that is near your Flightpath. Move to that Location, and draw a Travel Encounter; the events of that encounter are happening to a random traveller, instead of yourself. You can choose to: Intervene - Resolve the Encounter as normal Mind your business - You land far enough away to avoid getting involved; end your Soar safely at this Location. Ignore the distraction - You shift your eyes back towards the horizon. End your Soar at your chosen destination."
      },
      {
        "page": 96,
        "card": "J",
        "title": "The Water Cycle\nBeams of sunlight drag lazy tendrils of mist up \ninto skies laden with low clouds",
        "text": ". Each massive grey shape threatens to pour a shower down onto the thawing land below. End your Soar at your chosen destination. You are Soaked, unless you have a Waxed Satchel. 96"
      }
    ],
    "Titan": [
      {
        "page": 97,
        "card": "M",
        "title": "Windwall\nA howling wind smashes \nagainst you, matching \nevery beat of your wings \nwith equal force",
        "text": ". Pushing with all your might, your progress over the ground is hard won. Fight the wind - End your Soar at your chosen destination, but Mark 1 Day for the time lost fighting the elements. Follow the wind - rotate your Flightpath 180 degrees. End your Soar at a location up to twice as far as you originally intended to travel."
      },
      {
        "page": 97,
        "card": "J",
        "title": "Glimpses Of  \nElsewhere\nAbove the forests and \nmountains, you have \nan unprecedented \nview of the encircling \nhorizon",
        "text": ". Distant clouds are bruised with reds, purples, and gold tones from the setting sun. You ride on a crisp wind, your wings needing only occasional course correction. Who are you thinking of at this moment in time? Who do you think waits for you past where the sun sets? End your Soar at your chosen destination."
      },
      {
        "page": 97,
        "card": "M",
        "title": "Hailstorm\nA cold front rolls \nacross the skies, and \nthe faint patter of rain \nyou're flying through \nquickly turns to a \ndriving hail",
        "text": ". Chunks of ice hammer off of your wings, and sleet seeps shiveringly through your clothes and fur. End your Soar at your chosen destination. You are Soaked, unless you have a Waxed Satchel. You need to spend time warming up after your flight; reduce your next Timer by 2. 97"
      },
      {
        "page": 98,
        "card": "ace & 2",
        "title": "Jitterbug\nAs you climb through the walls of this \nstrange Titan ruin you knock over a box \nrelease a violent terror! It chases after \nyou, gnashing its teeth until",
        "text": "... it stops? Now that you're looking at it, it's cute, in a way. What insect does this tiny critter look like? What do you name it? What A Wind Up - Gain a Cranky Contraption Companion"
      },
      {
        "page": 98,
        "card": "3 & 4",
        "title": "Base Camp\nOutside of this ruin, you come \nacross a massive tent, big \nenough to house a hundred \nsmaller beasts",
        "text": ". Poking around, you find the campsite is empty. A Certain Gorilla - When Foraging in this area, the first time you Draw a 5 or 9, swap the encounter for the Monarch's option instead."
      },
      {
        "page": 98,
        "card": "5 & 6",
        "title": "Can It\nThe Titans, for some unknown \nreason, liked to store their food \naway in metal barrels",
        "text": ". Perhaps it was their way of preparing for Winter. Whatever the reason, you find a mysteriously preserved snack. What food is inside? What brand made this tin, and what does the packaging look like? Well Fed - Add 2 to your next Timer. Titan travel encounters These truly gargantuan ruins are abandoned for a reason. Set paw in these places with extreme caution. 98"
      },
      {
        "page": 99,
        "card": "7 & 8",
        "title": "Grim Opening",
        "text": "The only way into this ruin is filled with some sort of horrendous material that makes your hide itch and your eyes burn. What solution do you find? Could it be another entrance, or something to protect yourself?\n\nHostile Environment - Mark a Day on your Calendar as you find a clever way to get in without hurting yourself.\n\nDuty Calls - You push on regardless. You develop a Titan Rash with [Hide 2], [Poison 1], and no Timer; until you solve this rash, you cannot gain Foraging Points."
      },
      {
        "page": 99,
        "card": "9 & 10",
        "title": "Fabled Place",
        "text": "This ruin has a special name among the beasts of the Bristley Woods. As you approach, you can see why.\n\nWrite this ruin's name on the map. How did it get this name?"
      },
      {
        "page": 99,
        "card": "J",
        "title": "Siren",
        "text": "A terrible high pitched sound blares out from a totem by the door of this Titan ruin. It hurts your ears to be near it.\n\nSilence! - If you have a Crossbow and Bolt you may silence the device and enter. Otherwise, you will have to Mark a Day as you find another way to get in or deal with the sound."
      },
      {
        "page": 99,
        "card": "M",
        "title": "Electrician, or Electrocuted?",
        "text": "A frustrated magpie rests atop a metal box. They call down, asking if you can help them fix something inside!\n\nFixer Upper - Mark 1 Day, and Draw a Card.\n\n2 - 10 - You fix the issue and the magpie lets out an appreciative caw. However, it's only revealed another problem. The magpie frustratedly thanks you for your help and gives you 1 Trinket. You can choose to Mark 1 Day and Draw again.\n\nM or J - Lights swirl inside the box, and inside the Ruins music begins to play. Just what does this box do, exactly? At the end of this season, this Ruin becomes a Settlement. What beasts have moved in and what strange things can be found here?\n\nAce - As you're following the Knower's instructions, two wires touch and the box explodes. You awake at a nearby Settlement, burnt and bruised. End your Journey, as you rest until the start of the next Season."
      }
    ]
  },
  "foragingEncounters": {
    "Bog": [
      {
        "page": 154,
        "card": "3",
        "title": "Bridge Across The Water\nSome considerate beast \nhas built a bridge across \na particularly large and \nfrightful gooey bit of bog",
        "text": ". At the foot of the bridge lies a donation box for beasts to leave Trinkets to help with the upkeep of the bridge. Communal - If you leave a Trinket, make a note of it. Travelling through this Location in the future, doesn’t use up one of your Paths. Humble - It’s okay whether you haven’t the Trinkets to spare or the inclination, you're still free to cross. ACE Mind Yerself! A grouchy meadow hare comes bounding over to you, yelling \"watch yer paws\"! They explain that the peat bog is a delicate ecosystem. Though... you aren't walking on any peat right now. Despite this, they draw in deep breath as if to give a lecture. Listen & Learn - Unfortunately, once the hare gets started they cannot be stopped. Decrease Timers by 4. However, from now on everytime you Forage in a Bog, gain 1 Foraging Point. Interrupt - Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were."
      },
      {
        "page": 154,
        "card": "2",
        "title": "Ancient Salvage\nYou see a gleaming speck \nof metal sticking out of \nthe peat just up ahead",
        "text": ". It looks worse for wear but may be worth something to someone. Dig! - You can try to dig out the shining speck. Decrease Timers by 1 and draw a card. If the card’s value is: Equal to or greater than 10 - You manage to pull the item out. Add a Titan Thingamabob to your Bags. Less then 10 - Your digging only further buries the object in mud. Eventually, it sinks out of sight and you give up. Bog Foraging Encounters Masses of biting midges, stinking mud and stalking herons separate you from the verdant reagents you need for your patients. 154"
      },
      {
        "page": 155,
        "card": "5",
        "title": "Repellent\nYou bump into another \nPoulticepounder who \noffers you some of \ntheir secret recipe bug \ncream to keep the \nmidges away",
        "text": ". What is this cream's main ingredient? Repellent - Ignore any Negative effects from midges until you next Move On."
      },
      {
        "page": 155,
        "card": "6",
        "title": "Even The Mighty \nFall\nThe bones of a \nbehemoth lay here, \na reminder that even \nsuch tremendous \nbeasts aren't safe \nin these dangerous \nlands",
        "text": ". Who was it in life? How did they die?"
      },
      {
        "page": 155,
        "card": "7",
        "title": "Squelch!\nYou mistake a deep peat \npool for solid ground and \nsink in up to your waist",
        "text": ". It takes an age to pull yourself free. How do you get the smell out of your bags and clothes? Escape - Decrease Timers by 1 as you pull yourself free."
      },
      {
        "page": 155,
        "card": "4",
        "title": "The Rattlin' Bog",
        "text": "\"Ho, ro, the rattlin' bog, The bog down in the valley-o. Real Bog, the rattlin' bog, The bog down in the valley-o.\" You hear a quartet of beasts singing as they dig at peat.. Old Verse - The beasts continue singing, and you continue listening: Well in that hole there was a tree, A rare tree, a rattlin' tree, Tree in the hole, And the hole in the bog, And the bog down in the valley-o... New Verse - One of the beasts pause to explain that anyone can join in with a new verse after every chorus is sung. As their companions rattle through the tune, they bet you can't make up a new verse. If you manage to sing along, gain 1 Reputation."
      },
      {
        "page": 155,
        "card": "8",
        "title": "Right Place, \nWrong Time\nYou hear a grunt and a shout \nfrom the other side of some thick \nfoliage",
        "text": ". It sounds like some beast is getting robbed! Vigilante - If you want to fend off the robber, draw a card for you and a card for the robber. If yours is: Higher - You chase them off and earn the thanks of their victim. Gain 3 Reputation. Lower - The robber gets the upper hand and leaves you Wounded before running off. Archer - If you have a Crossbow + Bolt you may chase off the robber. Gain 3 Reputation. Wounded - The robber hurts you badly, but you manage to scare them off. The beast you rescued takes you to the nearest Settlement. You must rest for the remainder of the Season; abandon your Journey. Gain 3 Reputation for trying to help. 155"
      },
      {
        "page": 156,
        "card": "M",
        "title": "Legacy In Mud\nYou come across a tall tower, \nhalf sunk into the bog",
        "text": ". It looks like it was built quickly and abandoned just as fast. Why would someone build a tower out here? Does it bear any markings? Get A Better View - You may be able to scout the land better from up there. Draw a Card: ♥ or ♦ - It holds remarkably well, and you get a good view. Gain 3 Foraging Points ♣ or ♠ - It shifts unexpectedly and sinks further in the bog. Something falls out of your satchel and vanishes into the mud below! Count down the Items in your Bags equal to the card’s value; discard the Item you land on."
      },
      {
        "page": 156,
        "card": "J",
        "title": "Fluttering Fancy\nAn unusual butterfly flutters past, its colourful \nwings catching the light and seeming to almost \nshimmer",
        "text": ". What unusual colours does it have on its wings? Befriend It - Use a PLANT Reagent to gain a Butterfly Companion. Follow It - Draw a card. Gain a Plant Reagent Part with Base Rarity equal to or lower it's value."
      },
      {
        "page": 156,
        "card": "10",
        "title": "Deluge\nClouds gather overhead \nand rain starts to fall in \nthick sheets",
        "text": ". The bog is quickly becoming a death-trap! Get High - You climb a natural feature to wait out the short storm. Decrease Timers by 2. Sail - You can try to surf the surging water if you have a Bark Coracle. Draw a card: ♥ or ♦ - You escape to an adjacent Location. What was the most perilous part of your journey? ♣ or ♠ - You capsize! Decrease Timers by 1 as you haul yourself to safer ground."
      },
      {
        "page": 156,
        "card": "9",
        "title": "Guild of One\nYou meet an eccentric beast \nwith an unusual contraption",
        "text": "; bellows, hollow tubes, and a massive copper helmet with a glass window. They call themselves a Peatdiver and say they are hunting for treasures beneath the bog. Why haven't they been able to convince anyone to join their boggy expeditions? Assistant - Somebeast needs to pump the bellows of the breathing apparatus so the diver can explore the suffocating muds. You can volunteer; decrease Timers by 2 but gain a Trinket! New Connections - Whether you help or ignore, this fledgling Guild of One won't forget you. Gain 1 Reputation. 156"
      },
      {
        "page": 157,
        "card": "J",
        "title": "Aerial Support\nA flock of courier birds \npasses overheard in a tight \nV-formation",
        "text": ". One of them seems to notice you as they drift out of formation for a moment. Helping Wing - If the Guild Reputation is Upstanding or better, the bird swoops down to offer help. Gain 4 Foraging Points as they scout or let you ride upon their back. Unknown - If the Guild Reputation is less than Upstanding, the bird thinks better of breaking formation and continues on."
      },
      {
        "page": 157,
        "card": "M",
        "title": "Fangs With Wings\nSwarms of biting midges \ndescend upon you with \nmalicious intent",
        "text": ". Don’t scratch the bites, it makes them worse! Distracted - If you don’t have something to soothe the itch, start a new Ailment for [HIDE 2] and [POISON 1], with a Timer of 8. Munched - If you fail to create a remedy for this new Ailment, the itching becomes so unbearable that you say something very rude to your Familiar. How does that go down?"
      },
      {
        "page": 157,
        "card": "10",
        "title": "Weaver\nWhile crawling through \na hollow log you spy a \nbeautiful spider sitting in its \nweb",
        "text": ". It raises its front legs almost as if greeting you. What is most beautiful about this spider? Dance - You copy its little gestures and the spider seems appeased. Decrease Timers by 1. It follows you around until you Move On. You can permanently befriend it by giving it an INSECT Reagent Part. If you do, gain a Spider Companion. Back Away - You don't speak spider and that thing has sharp teeth. It lowers its little legs sadly."
      },
      {
        "page": 157,
        "card": "9",
        "title": "A Thousand Thousand Biters\nThey fall from above, \nwhining midges with a thirst \nfor blood",
        "text": ". The treacherous mud of the bog churns beneath your paws as you try to escape! Run! - Draw two Cards, one for you and one for the midges. If your card is higher - You evade the midges and only lose 1 Foraging Point Caught - If your card was lower, you are covered in tiny swelling bites. You must create a remedy for [HIDE 2] and [POISON 1] to alleviate their itchy sting. Biting Mood - If you fail to soothe the itching before you next Move On, you're caught spouting bitter obscenities. Lose 1 Reputation. 157"
      },
      {
        "page": 158,
        "card": "10",
        "title": "Midges!\nThe last surviving midges \ncircle you, eager for one \nlast drop of blood before \nwinter brings their end",
        "text": ". Run! - Draw two Cards, one for you and one for the midges. If your card is: Higher - You evade the midges and only lose 1 Foraging Point. Lower - They leave you with itchy bites and chase you far. Lose 3 Foraging Points."
      },
      {
        "page": 158,
        "card": "M",
        "title": "Duchy of Deer\nA particularly noble deer stops a short distance away \nand looks at you with condescension",
        "text": ". They ask what you're doing in their lands and why they shouldn't chase you away Instant Trial - You plea your case to the judge, jury and executioner that is the Behemoth Deer before you. Draw two cards, one for yourself and one for the deer. If you are carrying a Crossbow or Weapon, draw an additional card for the Deer for each. If you have the highest card - they permit you to stay and search for Reagents. If the deer has the highest card - they chase you off, stamping the ground and threatening with their antlers. You do not gather anything for this Forage, and cannot Move through or Forage here again."
      },
      {
        "page": 158,
        "card": "J",
        "title": "Storm Front\nDark grey clouds gather \noverhead and murmur \nominously",
        "text": ". They threaten to split the bog with lightning and slash the peat with rain. Weather Report - Until you next Move On, compare each Encounter's drawn card to these suit-based outcomes: ♥ - The clouds stay quiet and whole. ♦ - Thunder rumbles overhead. Any beast in this event rushes away to hide. ♣ or ♠ - The clouds split and the rains flood in. Find somewhere high to wait it out and decrease Timers by 3. If you have a tent, you can shelter quickly; instead, decrease Timers by 1. Ignore the current event and stop comparing cards to the Weather Report."
      },
      {
        "page": 158,
        "card": "9",
        "title": "Rusty Pick\nThe familiar yet unexpected \nsound of an Orebeater's pick \nechoes out across the bog",
        "text": ". As you approach you see a precarious, soggy mine with some beasts loading their haul into carts. What is the name of this mine? What are they digging for? Bog Bargains - You can Barter here once. Skip Step 2 of Bartering. Pounder's Take - If you are looking for Iron Ore or Silver Ore and the Guild Reputation is Trusted, they will give you them for free. 158"
      }
    ],
    "Forest": [
      {
        "page": 159,
        "card": "10",
        "title": "Heat Sink\nSemi-frozen bog snaps underpaw, \nplunging you into freezing cold bog \nwater",
        "text": ". Another step, another crack. By the time you get off the ice your feet are numb with cold. How do you stay positive during such moments? Warm Up - You have to take a moment to heat up before you go trudging on. Decrease Timer by 1."
      },
      {
        "page": 159,
        "card": "9",
        "title": "Chestnuts On  \nAn Open Fire\nA haze of campfire smoke and a dark, \nroasting earthy smell draw you to the \ncampfire of a frog and a slow worm",
        "text": ". They're wrapped up under insulating beast-fur blankets, and are toasting snacks on a fire. What are these two doing out on a cold day like this? Campfire Chat - They seem to know the area and tell you where to find some Reagents. Gain 1 Foraging Point."
      },
      {
        "page": 159,
        "card": "J",
        "title": "The Right Thing\nYou cross paths with a Branded \nbeast",
        "text": ". They glance at you, half in terror, and try to cross some nearby ice so as to get out of your way. Three steps in, it cracks and they fall waist deep into frigid mud. What type of beast are they? Why were they trying to avoid you? Help! - If don't mind breaking Guild law, Journal about your strategy to get them out of the wet peat Decrease Timers by 2. Turn Away - Branded are, well, exiled from society for a reason. Best to keep a safe distance."
      },
      {
        "page": 159,
        "card": "M",
        "title": "Winged Menace\nA massive heron swoops down \nat you giving you just enough \ntime to take cover",
        "text": ". It laughs and taunts as it raises its wings to put you in shade. It seems like it might be a clawlicker or a bandit. What do they want? Bold - You can attempt to fight the heron off. Draw a card for you and two cards for it. You get an extra card if you are larger than a hedgehog. If your total is higher - You fend it off and send it packing! Gain 1 Reputation If your total is lower - It gives you a nasty peck before you escape. What scar do you carry from this encounter? Bargain - You can offer the heron a Trinket to leave you alone. What distinguishing marks did it have? Do you report this? 159"
      },
      {
        "page": 160,
        "card": "4",
        "title": "Mushroom Pickers\nYou come across a pair \nof pickers arguing over \nwhether a mushroom \nis edible or not",
        "text": ". You're pretty sure it's not medicinal... but is it dangerous? Junior - When asked your opinion, you shrug. The Junior picker nonchalantly stuffs it in their maw; draw a card: ♥ - It's a tasty snack; they share one with you, Gain a tasty Trinket. ♦, ♣ or ♣ - Oh, foul deceiver! Shortly after, the junior picker is violently sick. You learn from their mistake. Senior - You politely interrupt, and suggest taking the mushroom home to identify, without letting it contaminate their other pickings. The more senior picker nods along, sagely. Gain 1 Reputation."
      },
      {
        "page": 160,
        "card": "3",
        "title": "The Collector\nYou come across an avid \nforager who is excited \nto show you their \ncollection",
        "text": ". Collections Development Policy - You may swap a Reagent Part of your own for any Reagent Part that can be found in the Forest."
      },
      {
        "page": 160,
        "card": "2",
        "title": "Fowl Language\nA rude bird lands on \na branch above you \nand makes fun of \nyou for some reason",
        "text": ". What do they say? How do you react? Forest Foraging Encounters Watch the shadows. Many a beast scurries through these woodlands, and not all of them have the best intentions for their fellows! 160"
      },
      {
        "page": 161,
        "card": "7",
        "title": "Petty  \nSquabbles\nAs you round a tree you come across \ntwo big beasts who are fighting",
        "text": ". What are they arguing over? Do you try to stop them? If so, how? Bring Peace - Gain 1 Reputation but Decrease Timers by 3. Divert Away - Decrease Timers by 1."
      },
      {
        "page": 161,
        "card": "8",
        "title": "Friend In Need\nWhile sniffing around \nsome mushrooms you \ncome across another \nPoulticier",
        "text": ". They need another set of paws to help them with their own task - if you scratch their back, they’ll scratch yours. What is their name? Have you met them before? Where are they headed on their own Journey, and what is their goal? Help Your Guildmate - Draw a card and gain a Forest Reagent with Rarity equal to the card’s value. Decrease your Ailment Timer by 1. Keep to Yourself - Decrease Guild Reputation by 1. Journal about your fellow Poulticier’s patient."
      },
      {
        "page": 161,
        "card": "6",
        "title": "Log Knocking\nA passing stag knocks over a rotting \nlog revealing a treasure trove of bugs",
        "text": ". You eat bugs? - Gain all the Parts of a Beetle, Maggot or Wasp Reagent."
      },
      {
        "page": 161,
        "card": "5",
        "title": "Dam Lotta Trouble\nSome trees have been \nfelled here by beavers \nbuilding a dam",
        "text": ". How do they feel about their work? What gossip have the builders got to share? Beaver Flood - This location has been flooded with river water from a local dam. Mark on your map that this is a Beaver Dam, and that its Region has changed Loch. Dam Burst - The dam bursts after Winter, causing this Location to return to being a Forest Region. 161"
      },
      {
        "page": 162,
        "card": "M",
        "title": "Bear's Necessities\nA hibernating bear \nhas awoken, and is \nravenously hungry",
        "text": ". Its roar echoes in the distant trees. This place is no longer safe! What fearful whispers follow in this behemoths wake? What is this dreaded bear's name? Mark this Location as a Towering Behemoth Barrow. Whenever you forage in this or an adjacent location, Monarch results become 'Scurry!' Scurry! - The bear has picked up your scent! You must leave before it finds you. Decrease Timers by 2, and lose either 3 Foraging Points or 1 Reagent Part from your Bags. Appease - You can convince the bear to move on by giving it Reagent Parts that provide a cumulative [Fair 5]. You can do this when you Forage or Travel through this area, and doing so removes the Barrow from the map."
      },
      {
        "page": 162,
        "card": "9",
        "title": "The Branded\nYou come across an exiled \nbeast who looks like they \nbarely survived the Winter",
        "text": ". They ask you for help. Do you give it? What crime does their brand mark them as having committed? Compassion - If you help, start a new Lesser Ailment with this beast, neither gaining or losing Reputation or Trinkets; no-one can know you helped them. You need to complete it before you Overstay Your Welcome. Duty - Follow commonly agreed Guild Law and leave them be. Gain 1 Reputation. What do they say as you leave? How does that feel?"
      },
      {
        "page": 162,
        "card": "J",
        "title": "Not Forgotten\nYour cross past a \nmemorial for a beast \nthat has gone Elsewhere",
        "text": ". What is special about this spot? What memories does the memorial try to share?"
      },
      {
        "page": 162,
        "card": "10",
        "title": "Alluring Odours\nThe scent and taste of \nsomething sweet hangs in the \nair",
        "text": ". It enchants your senses. Follow Your Nose - Draw a card and decrease all Timers by 1. If your result was 7 or higher, gain a Reagent that can provide [Fair] and that can also be Foraged for in the Forest. If no such Reagent exists, invent a new one for your Almanack. 162"
      },
      {
        "page": 163,
        "card": "9",
        "title": "A Convenient Deal\nWhile searching around the roots of a tree \nyou find the well-hidden stockroom of an \navid Forager",
        "text": ". They happen to be home, and invite you in to browse their wares. Wholesale - You may Barter with this beast once. The desired Reagent Part's Rarity is decreased by 2."
      },
      {
        "page": 163,
        "card": "10",
        "title": "Siesta\nThe sun washes \nover you, warm and \nsoothing",
        "text": ". A crook of roots ahead looks so comfy; surely a little rest would make you faster overall? Push On - Increase Timers by 1, but lose 2 Foraging Points. Nap - Decrease Timers by 1, and draw a card. What or who do you dream about? ♥ or ♦ - You awake after a short while, energised to keep on with your tasks. Gain 5 Foraging Points. ♣ or ♠ - You sleep overly long, and awake musty-eyed and dizzy. Lose 1 Foraging Point."
      },
      {
        "page": 163,
        "card": "J",
        "title": "Thief!\nAs you squint against the \nsunlight in search of a safe path \nto travel, you feel something \nshift in your Bags",
        "text": ". Turning, you spot something - no, somebeast - dashing away! Give Chase - Decrease Timers by 1, and draw a card. ♥ or ♦ - You catch up to the thief! You retrieve your stolen property. Do they apologise, or give an excuse? ♣ or ♣ - You lose them in the roots and loam. Follow 'Lost Item'. Leave them - Whoever felt the need to steal from you must have been desperate. Increase Timers by 1, as you maintain focus on your task. Draw a card, and follow 'Lost Item'. Lost Item - Use the value of your card to count down the list of items in your Bags; discard the item you land on."
      },
      {
        "page": 163,
        "card": "M",
        "title": "Stung On  \nAll Sides\nA young beast has managed \nto get stuck deep in a \nflourishing patch of nettles, \nand cries out for help",
        "text": ". What were they doing near the nettles anyway? What kind of beast are they? Mouse, badger, or something in between? Helpful Giant - If you are larger than the young beast, you may simply lift them out, receive their thanks, and be on your way. You're able to clip some samples while you help; add any Part from Stinging Nettles to your Bags. A Giant Help - If you are smaller than the young beast, how do you help guide them free from the nettles? Gain 1 Reputation; this young beast tells everyone about you when they get home safe. 163"
      },
      {
        "page": 164,
        "card": "9",
        "title": "If You Go Down To  \nThe Woods Today",
        "text": "... You stumble upon a beast with a feast of bugs laid out before them, including some that make useful Reagents. Why is the beast picnicking out in the Forest today? What bug based dishes have they made? Guild Level is Established or lower - The beast refuses to give you the Insects, going so far as to quickly scoff them if you try to take them. Guild Level is Upstanding or higher - They recognise the look in your eyes, and forlornly offer you one of the dishes. If you were looking for an Insect Reagent Part, add it to your Bags."
      },
      {
        "page": 164,
        "card": "10",
        "title": "An Unlikely Friend\nWhile searching through the leaf \nlitter you come across a bug that \nseems to instantly bond with you",
        "text": ". No matter where you go or what you do, it follows you. What type of bug is it? Is there anything unusual about it? The More the Merrier - Gain a Companion"
      },
      {
        "page": 164,
        "card": "J",
        "title": "Competitive  \nSpirit\nA frantic squirrel is organising \na last minute nut hunt with a \ngroup of local beasts",
        "text": ". The prize for the beast who finds the most nuts is a curious Trinket. Do you join in? What is the atmosphere in the hunt like? Nut Hunt - Draw a card for yourself and two cards for the other of the beasts. Whoever has the single highest value card finds the most nuts. If you win, gain 1 Trinket."
      },
      {
        "page": 164,
        "card": "M",
        "title": "Musty!\nThe unmistakeable smell of \nmushrooms wafts through the \nforest",
        "text": ". Does this excite or repulse you? Reduce the Rarity of any Mushroom Reagents by 4 until you next Move On. 164"
      }
    ],
    "Loch": [
      {
        "page": 165,
        "card": "10",
        "title": "White Out\nSnow falls in thick glittering clumps",
        "text": ". It won't be long until everything is buried. Set a Snow Timer, starting at 4. Once this Timer reaches 0, for the remainder of this Ailment all PLANT, EARTH, and BEAST Reagents have their Foraging Value increased to 13."
      },
      {
        "page": 165,
        "card": "9",
        "title": "Blades of the  \nBoreal Dancer\nRazor sharp icicles hang from the \nbranches like swords waiting to drop",
        "text": ". As you pass under, the wind causes some to drop! Dodge - Draw a card to get out of the way. ♥, ♦ or ♣ - you manage to dash, roll or hop out of harms way. ♠ - an icicle gives you a nasty cut. You need to treat it immediately! Unless you can immediately treat [WOUND 2], decrease all Timers by 1 for each Path to the nearest settlement; you find treatment from a local Stitcher."
      },
      {
        "page": 165,
        "card": "J",
        "title": "Winter Feast\nYou spy an incredibly \ndecorated house up ahead",
        "text": ". It looks like they've really gotten into the spirit of the season with lights, food, and what sounds like a party. What sort of decorations do they have? Do you knock? If so, decrease Timers by 1 and take one of these Actions Charity - You explain your current Ailment and ask if they have anything that could aid your patient. Draw a card. If you draw a ♥, they give you any Forest Reagent Part of your choice. Sing - You've heard it's tradition in these parts of the Woods to pay travelling singers. What song do you sing? Are you any good? Regardless gain a Trinket."
      },
      {
        "page": 165,
        "card": "M",
        "title": "Fangs  \na'Hungering\nYou round a bend and come nose to \nnose with a starving branded exile",
        "text": ". They lick their sharp teeth and growl at you. What kind of carnivorous beast are they? What crime does their brand claim they have committed? Flee - Draw two cards; one for you and one card for the exile. Whoever has the highest total wins. If you win - You escape unharmed. What will happen to the exile? If you lose - The exile manages to harm you, but in the process you give them the slip. Move to the nearest Settlement, and end your Winter's Journey; you're too hurt to continue until next Season. Kindness - If you have helped an exiled or branded beast before then your assailant knows of you, and stops their attack. What tales does the exile have of life, shunned from their community? 165"
      },
      {
        "page": 166,
        "card": "3",
        "title": "Lost and Found\nSomething shiny and \ndistinctly beast-made \nfloats past you",
        "text": ". It looks like it’s from a settlement nearby. What material is it made from? How do you think it came to be in the water? Gimme! - Add a Shiny Object to your Bags. If you hand it into a Settlement connected to this body of water, gain 2 Reputation and a Trinket. Leave It - If it is really that important, someone else will get it. Continue foraging. Gain 1 Foraging Point. ace Horrors From The Deep Something slithers through the water. Oh stars, what could it be? What monster lurks just underneath the water?! Draw a Card. ♥ or ♦ - A traveller swimming low and slow thuds into your vessel. What are they doing out on the water? How to they respond to bumping into you? ♣ or ♠ - PIKE!! A massive fanged fish will bite you into bloody clumps if you don't get moving! Reduce Timers and Foraging Points by a total of 5 as you backtrack through the water, and hide safely on land."
      },
      {
        "page": 166,
        "card": "2",
        "title": "Bonepickin'\nA Fishfinder with a coracle \nfull of scuttle passes by",
        "text": ". They stop, and offer some useful scraps from their haul. What prompts this kind act? Catch of the day - Gain a Small Fish Reagent Part (such as Scales, or Bones). Loch Foraging Encounters Water is the source of all life, and at the fringes of where it flows all manner of useful Reagents can be found. Just mind the locals... 166"
      },
      {
        "page": 167,
        "card": "7",
        "title": "Fish Slap\nA massive, truly \nancient salmon lunges \nup from the watery \ndepths below, flipping \ninto the air",
        "text": ". In the process its massive tail slaps you! If you are rowing a Coracle, it is punctured and starts to take on water! Your Coracle provides no benefits until you next Move On. If you are swimming, gain a [WOUND 2] that you need to treat before the end of your highest Timer. If you fail to treat it, Mark 3 Days on your Calendar. You have a concussion, and need time to recover."
      },
      {
        "page": 167,
        "card": "8",
        "title": "Voyage To The Blackwater\nYou come across a group \nof Toad Knights floating a \ndeceased friend or family \nmember out into the water in \na ritual known as",
        "text": "“going to the Blackwater”. What do the Toads have to say about their departed friend? What order of knights do these toads belong to, and which Log do they defend? Offer Condolences - You lend kind words to their funeral, and observe the procession. Reduce Timers by 1, and Gain 1 Reputation. Give them space - You circle wide around the procession, leaving them to their grief. Funeral Rites - If you have a Reagent with the [ELSEWHERE] Tag, you may give it to the Toads. Gain 1 Reputation, and an additional 1 for each Potency of the Reagent."
      },
      {
        "page": 167,
        "card": "4",
        "title": "Stretch And Release\nYou spot a beast doing some \nstretches on a rock nearby",
        "text": ". They see you and invite you to join them for a spot of meditation. Do you take them up on their offer? If so, what thoughts come and go as you meditate?"
      },
      {
        "page": 167,
        "card": "5",
        "title": "Serenity\nThe water here is exceptionally \nclear",
        "text": ": you can get a clear view of what’s below. Gaze - Reduce your Timers by 1, and gain 2 Foraging Points. Paddle - Continue Foraging."
      },
      {
        "page": 167,
        "card": "6",
        "title": "Fogbank\nMist rolls in across the loch, \nmaking it near impossible to \nsee",
        "text": ". You’ll have to wait it out. What do you do to pass the time? Waiting Game - Decrease Timers by 1. 167"
      },
      {
        "page": 168,
        "card": "9",
        "title": "Froglets!\nThe water here is thick with frogspawn \nand caretaker frogs who would love \nto tell you about their little tadpoles-\nto-be",
        "text": ". What is their favourite tadpole name? Natter - Decrease Timers by 1 but gain 3 Foraging Points. What local gossip do these caretakers spread?"
      },
      {
        "page": 168,
        "card": "10",
        "title": "River Snatchers\nAs you search through \nthe cooling shallows, you \nfeel something brush \npast your bag, followed \nby rapid splashing - a \nthief!\nGet back here! - Draw \na card",
        "text": ". Go down the list of your Bags using the card’s value. ♥ or ♦ - You are able to catch the thief, and retrieve your item. If it was a Reagent Part, it is soaked thoroughly through and you must discard it. ♣ or ♠ - The thief is too fast and loses you in the deeper waters."
      },
      {
        "page": 168,
        "card": "M",
        "title": "Danger Ahead\nYou spot the tell-tale sign of \na pike in the water ahead",
        "text": ". It's humongous body and vicious fangs send a shiver up your spine! Have you seen a pike before? Has it noticed you? NOPE - Lose 2 Foraging Points. You cannot Forage at this Location until you next Move On."
      },
      {
        "page": 168,
        "card": "J",
        "title": "Flood\nThe melting snow and ice has raised \nthe water near here, flooding paths and \nburrows alike",
        "text": ". Were any beasts badly affected by the flooding? How have the locals tried to adapt to this change? Paws In - Decrease Timers by 2, and gain 1 Reputation. Shrug and move on - Lose 1 Reputation 168"
      },
      {
        "page": 169,
        "card": "M",
        "title": "Up To Something\nSome magpies are \nscraping around at the \nmuddy shores and depths \nhere, piling the various bits \nand bobs into a dirty cart",
        "text": ". What interesting things have they found already? Why are they mudlarking here? Take Part - The magpies are happy for any help, and will let you keep anything useful they find that isn't Titan-made. Create 3 Trinkets that have been broken and washed up here. Choose one to keep, and decrease Timers by 1."
      },
      {
        "page": 169,
        "card": "9",
        "title": "A Small Ailment\nA nervous parent asks if \nyou could take a look at \ntheir tadpoles",
        "text": ". They're concerned about their wain's health. Tadpediatrician - Draw: ♥ or ♦ - the tadpoles are perfectly healthy. ♣ or ♠ - some of the tadpoles are sick. Sick Tadpoles - Create a Remedy for [TEMPERATURE 2] and [INFECTION 1] before the end of your highest Timer. Helping Paw - If you cure the sick tadpoles, gain 2 Reputation and 2 Trinkets."
      },
      {
        "page": 169,
        "card": "10",
        "title": "Summertime Swim\nWarm sun, still water and a light breeze \nare a welcome treat",
        "text": ". Beasts from all over have taken the chance to dip their paws into the water and play! What sort of games to these beasts like to play? Relax and Exercise! - Decrease Timers by 1, and meet a local beast. What do you learn about your new friend?"
      },
      {
        "page": 169,
        "card": "10",
        "title": "The Boat That Rocks\nMuch to the annoyance of those \nwishing to relax, a few rodents are \nhaving a loud and raucous party on a \nsmall boat",
        "text": ". Just how bad are they? What music do they play? Do they litter? Startled - You cannot find any Big Fish or Small Fish in this Location until you next Move On 169"
      },
      {
        "page": 170,
        "card": "J",
        "title": "Brisk Beach Party\nBeasts flock to the water during what \nfeels like it could be the last warm day \nof the year",
        "text": ". Rushed picnics are had at the lochside and boats are rowed out to desperately get one last day on the water. How do you take advantage of the good weather? What is the weirdest mix of activities you see a desperate beast performing? Boating barbecue? Paddleboard volleyball?"
      },
      {
        "page": 170,
        "card": "M",
        "title": "Fabled Behemoth\nSomething massive passes \nby beneath you",
        "text": ". Too large to be a pike. Too large to be anything that should live in these waters! What could it possibly be?! What rumours have you heard about loch monsters? Row - Draw a Card to get safely to shore and away from this monster. Whatever your result, you must leave the Location. ♥, ♦ or ♣ - You row back and catch just a glimpse of the monster. What did you see? ♠ - You row back quickly but in your haste, you drop one of your Reagents. Lose 1 Reagent. Face the Goliath - You can shoot your Crossbow at the monster. If you do, you do not need to leave this Location, and gain a Titan Reagent of your choice which floats up to the surface."
      },
      {
        "page": 170,
        "card": "10",
        "title": "Showboat\nA massive vessel glides through \nthe water",
        "text": ". Its swell sends you drastically off-course. What boat was it? Where was it headed? Adrift - Lose 3 Foraging Points; you've lost your bearings."
      },
      {
        "page": 170,
        "card": "9",
        "title": "The Great Silence\nFog rolls in from the \nmountains and lays across \nthe water like a thick \nblanket, muting all sounds \nand leaving you terribly \ndisorientated",
        "text": ". What folktales have you heard about fog on the water? Patience - Decrease the Timers by 3. Startle - Decrease your Foraging Points to 0 and Forage again in an adjacent non-Loch Location. This second Forage does not decrease your Timers. 170"
      }
    ],
    "Meadow": [
      {
        "page": 171,
        "card": "10",
        "title": "Ice Fishing\nYou spot a hardy Fishfinder \nout on the ice",
        "text": ". They wave you over and say you can use one of their empty stools that are perched around a fishing-hole. They don't say much, but the advice they give is invaluable. What special patches do they have on their fishing jacket? Go Fish - Decrease Timers by 1. Gain all the Parts of a Small Fish. Fish Some More - Decrease Timers by 1 and Draw a Card: ♥ or ♦ - Gain all parts from a Small Fish ♣ - Gain all parts from a Big Fish ♠ - You don't catch anything."
      },
      {
        "page": 171,
        "card": "M",
        "title": "Lodge of Wonders\nYou come across a magnificent \nbeaver lodge out in the middle of \nthe freezing water",
        "text": ". There is a little post with a rope going under the water that says \"pull for service/ trade”. Trade - You may Barter for a Reagent. During this Barter, skip step 2. Visit - The beaver invites you in from the cold weather and can give you advice on where to find what you're looking for. Decrease your Timers by 1. Until you Move, gain 2 Foraging Points after your complete any Encounter Help - If you have the time, the beaver asks for your assistance in fixing a few leaks. Decrease the Timer by 3 and gain 1 Trinket."
      },
      {
        "page": 171,
        "card": "J",
        "title": "A Gentle  \nMoment\nAs you are \nforaging, you and \nyour familiar take \na moment to \nwatch the falling \nsnowflakes",
        "text": ". What do you say to each other in this moment?"
      },
      {
        "page": 171,
        "card": "9",
        "title": "Thin Ice\nMiraculously, ahead is the \nReagent you're looking for! \nHowever, a stretch of thin \nice separates it from you",
        "text": ". Too risky - There have to be safer opportunities nearby. Gain 1 Foraging Point. Brave the ice - You can risk the freezing water and walk on the ice. Draw a card. If its value is: Equal to or lower than your Carry - you manage to cross the ice, gather a Reagent you're seeking immediately, and make it back to shore safely. Higher than your Carry - You take too long; the ice splits below you, and you plunge into the icy waters below. Reduce Timers by 2 as you spend time drying off and heating back up. 171"
      },
      {
        "page": 172,
        "card": "3",
        "title": "Little Biters\nAs you hike through the \nbrush here, you shake \nloose a tick from a strand \nof grass",
        "text": ". You can't quite shake the feeling of something crawling over you. Tick Check - Decrease Timers by 1 as you check yourself twice over. Risk It - Draw a Card. ♥ or ♦ - You were lucky; no ticks have sunk their nasty little teeth into you. ♣ or ♠ - You develop the Tick Bitten, Twice Shy Ailment and must cure it before you Move On, or face the Consequences."
      },
      {
        "page": 172,
        "card": "4",
        "title": "The Winged Hunter\nA dark shadow falls across the \nmeadow as an eagle passes overhead",
        "text": ". Does it try to grab anyone? Take Shelter - Decrease Timers by 1 as you hide from the Behemoth. Creep Away - Draw a Card. If it is a ♥ - you escape unnoticed. If it is ♦, ♣ or ♠, the eagle spots you! Its talons rake across your back; Lose all Foraging Points and 1 Reagent. ace Soft Song Music carries across the meadow as another beast sings a song. What sort of melody and they singing? Are they any good? Why do you think they're singing?"
      },
      {
        "page": 172,
        "card": "2",
        "title": "Cow Tools?\nYou trip over a broken \nfarm tool discarded \namongst the grass",
        "text": ". What sort of tool or contraption was it? Why was it abandoned here? Meadow Foraging Encounters Farmer's fields pull precious grains and oats out of the mud, providing the basis for other skills. And yet, they aren't without their own dangers... 172"
      },
      {
        "page": 173,
        "card": "7",
        "title": "Wild Chef\nA streak of smoke, a \ndelicious smell, and \nthe distant sounds of \nexcited munching are \nall signs that someone \nclose by is baking \nsomething incredible",
        "text": ". What food-scent blows on the wind? Do you have a particular fondness for this food? Follow Your Stomach - Lose two Foraging Points. Draw a Meadow Social Encounter relevant to the season you are in. Complete it, and add Delicious Food to your bags. It provides [FAIR 4]. The food spoils after you Mark 3 Days on your Calendar. Follow Your Heart - Lose 1 Foraging Point as you are distracted by the hunger."
      },
      {
        "page": 173,
        "card": "8",
        "title": "Fowl Fare\nA friendly bird lands in front \nof you and strikes up a \nconversation",
        "text": ". Airlift - If the guild’s Reputation is Trusted, they offer to give you a lift to your next foraging spot. Gain 4 Foraging Points. Taxi - If the guild’s Reputation is Upstanding or lower, they offer you a lift in exchange for a Trinket. Gain 4 Foraging Points if you take their offer."
      },
      {
        "page": 173,
        "card": "6",
        "title": "Ant Heist!\nWhile searching around, \nyou find an ant colony with \nthousands of busy little \nworkers carrying Reagents",
        "text": ". You could easily grab one, any more than that might anger the hive though. Snatch and Go - Draw a card and gain a PLANT or INSECT that can be Foraged in the Meadow with a Rarity equal to or lower than the card’s value. Going For Broke - You can give into greed, and grab again. Draw a another Card: If it is a ♥ - you gain another Reagent Part! If it is ♦, ♣ or ♠ the ants swarm you. Discard all of the Reagents from your Bags!"
      },
      {
        "page": 173,
        "card": "5",
        "title": "Pest Control\nYou come across a \nfarmer's unique method to \nprevent insects, children, \nor behemoths stealing \ntheir crops",
        "text": ". What is this unique method? Does it catch anyone it isn’t meant to? 173"
      },
      {
        "page": 174,
        "card": "M",
        "title": "Sowing",
        "text": " The farmers here have a very unusual way of spreading seeds around the fields. How do they manage it? Do they use a natural feature of their bodies, or a strange contraption? Is it effective? Or just eccentric?"
      },
      {
        "page": 174,
        "card": "J",
        "title": "Grind Mentality\nIt's all hustle and bustle in \nthe meadow this time of year",
        "text": ". Beasts set out to plant their fields and fix the damage from the winter prior. What are the locals planting? What was damaged by winter frosts? Farmer’s Demands - Get off their land and stop trampling seeds! Lose 2 Foraging Points. Hedgerow Wandering - Navigate around the fields; Reduce Timers by 1. Greased Paws - Pay 1 Trinket to pass through the farmland short cut, and Increase Timers by 2."
      },
      {
        "page": 174,
        "card": "10",
        "title": "One Beast's Rubbish",
        "text": "... You hear a cart rumbling past behind you and spot that it's full of Reagents that local farmers have decided are weeds. Roadside Negotiation - You try to convince the farmer to let you root through their weeds. Draw a card: ♥ or ♦ - The farmer agrees! Gain up to as many as you can Carry of a single Meadow Reagent Part that is in Season during Spring and has Rarity 6 or lower. ♣ or ♠ - The farmer disagrees! They have places to be and won't see reason."
      },
      {
        "page": 174,
        "card": "9",
        "title": "Project Launch\nBeasts from all around \nare gathered to see \nthe unveiling of a local \nCraftpaw’s latest invention",
        "text": ". What purpose does it serve? Does it even work? If not, what goes catastrophically wrong? Watch the Unveiling - Reduce Timers by 2. Add a Guild Rumour to your Bags. Bring it to any Settlement to gain 2 Guild Reputation. Keep Your Head Down - Continue with your foraging and leave the inventors to their chaos. 174"
      },
      {
        "page": 175,
        "card": "M",
        "title": "Fire and Iron\nThe sound of clashing \nsteel rings out across the \nmeadow as you spy two \narmoured beasts fighting",
        "text": ". Left to it, one will certainly kill the other. Can you tell why they are fighting? Is either combatant winning? Intervene - Draw a card if it is a: Monarch - you successfully stop the fight, for now. Gain 4 Reputation. What do you ask them? What cost does peace have? Not a Monarch - You stop the fight, but are caught in the crossfire. Gain 6 Reputation. You suffer a [WOUND 2]; if you have the ability to make a Remedy for it now, reduce Timers by 2. Otherwise, they set aside their differences and take you to a Stitcher to tend your wounds. Reduce timers by 8. Leave Them Be - Probably wisest to leave them to their feud."
      },
      {
        "page": 175,
        "card": "J",
        "title": "Bee Kind  \nTo Yourself\nAs you're making your \nway past colourful \nmeadow flowers, you \nfind a dazed bee lying \non the ground",
        "text": ". Do you help the dazzled bug? Sweet - If you have some Honey or another Fair Reagent, you can nurse the bee to health and gain a Honey Bee Companion. Rescue - If you don't have any Honey or Fair Reagent, you may carry the bee to safety and gain a Honeybee Companion by Decreasing Timers by 4."
      },
      {
        "page": 175,
        "card": "9",
        "title": "Misbehooving \n Behemoths\nA herd of highland cows have been \nplaying and stamping about in this \nmeadow",
        "text": ". While not dangerous on their own, they are trampling or eating most of the flowers in the area. Trampled - Increase the Rarity of all Plant Reagents you Forage for here by 2."
      },
      {
        "page": 175,
        "card": "10",
        "title": "Unyielding Heat\nThe sun hangs high in the sky, hot and heavy as \nthe wind refuses to blow and grant reprieve",
        "text": ". Do you enjoy weather like this? If not, how do you try to keep cool? 175"
      },
      {
        "page": 176,
        "card": "J",
        "title": "Trembling Titan  \nTechnology\nA worrying rumble \nvibrates through the \nsoft earth underpaw",
        "text": "; something is bursting through the ground! What is this strange contraption? What purpose do you think it originally had? Run & Hide - You dive for cover, only to find another beast hiding from \"The Crow Scarer\". What legend do they tell you of the terrifying thing out there? Decrease Timers by 1, but you may choose the Knowledge action next time you encounter this event. Knowledge - It spears out of the earth, chitters, lets out a heart shaking 'BANG', and withdraws. Knowing what it is doesn't detract from its spooky aura. Continue with your foraging."
      },
      {
        "page": 176,
        "card": "10",
        "title": "Heavy Fog\nAn early morning fog rolls \ndown a nearby mountain side, \nconfusing your sense of sight \nand smell till you're all turned \naround",
        "text": ". Worse than that, there's something else in the fog... What ghost stories have you been told about meadow fog? Fog Turned - You do not gain Foraging Points this Encounter. Bump - You bump into something (or someone??) in the fog. Draw a card: ♥ or ♦ -- A friendly face, they help you find what you're looking for. Gain a Reagent from your list. ♣ or ♠ -- An unfortunate meeting. Paws snatch at your bag before disappearing into the mist; lose a Trinket."
      },
      {
        "page": 176,
        "card": "M",
        "title": "Mycophiliacs\nA mob of mushroom pickers \nhave flooded to this meadow \nto look for the tasty treasures \ngrowing from the dying grass",
        "text": ". Early Bird - If you start this encounter with more Days in your Calendar than you have Marked, gain a Mushroom Reagent of your choice. Picked Clean - If you start this encounter with the majority of Days in your Calendar Marked, increase the Rarity of mushroom Reagents to 10 while in this Location. Beseech - If the Guild Reputation is Upstanding, you may Barter once for Mushrooms. Instead of drawing a Social Encounter, Journal about a conversation with the pickers. Where are they from? Do they come to this spot every year?"
      },
      {
        "page": 176,
        "card": "9",
        "title": "Sloppy Steps\nFurrows and tracks from overladen carts and \nfresh harvests have churned the rain-soaked \npath ahead into sticky mud",
        "text": ". Fumble on - Decrease Timers by 1. Flap away - If you and/or your Familiar can fly, you easily dart through the air, avoiding the mud. 176"
      }
    ],
    "Mountain": [
      {
        "page": 177,
        "card": "9",
        "title": "Sain De Claws\nYou come across a \nwood grouse with a \nfloppy green hat trying \nto sort out a pile of \npresents and a burst \nbag",
        "text": ". The Grouse begs you for your help; three gifts are missing, and they haven't the time to replace them! Why are they hauling so many presents on such a cold, dreary afternoon? Locally Sourced - Draw 3 cards and place them to one side. During your Forage in this area, if you find a card that matches their value or suit, then you find a missing present! Cheerful Delivery - If you can return a missing presents, the Yuletide grouse gifts you a Trinket to unwrap at the end of the Season. If you return all three, the trinkets miraculously fit together into a Tool of your choice!"
      },
      {
        "page": 177,
        "card": "10",
        "title": "A Worrying Ache\nSilent snow covers every inch \nof the meadow, hiding what \nfew hardy plants still survive",
        "text": ". Its paw bitingly cold and its getting dark already. Chill - The seed of a cold sets in as you forage. Set a Cold Timer of 6; it only decreases while you Forage. Snotladen - If the Cold Timer reaches 0, you push yourself too hard and must sleep off a vicious, snotty cold. Mark 2 Days on your Calendar before you next Move On. Hot Toddy - If you have a Tent, you can set up a campsite to take refuge in as you Forage, with a pot of something warm to drink from. Decrease Timers by 1. If you draw this event again during the same Ailment, Journal about your Hot Toddy."
      },
      {
        "page": 177,
        "card": "M",
        "title": "Life Saving Transplant\nHow fortunate! Some beasts \nhave been out and made \na snowbeast with Dense \nCharcoal for eyes and Animal \nSheddings for hair",
        "text": ". What sort of beast does it resemble? How does it feel to take bits from someone's work? Take - You may add a piece of Dense Charcoal and Animal Sheddings to your Bags. Transplant - You may replace the removed Charcoal or Sheddings with something similar of your own. Gain no Reputation."
      },
      {
        "page": 177,
        "card": "J",
        "title": "Social  \nOccasion\nYou come across some \nbeasts taking advantage \nof good weather on a \nshort winter’s day",
        "text": ". Stop for a Chat - Reduce Timers by 1, and gain 2 Foraging Points. 177"
      },
      {
        "page": 178,
        "card": "2",
        "title": "Winged Menace\nA massive eagle passes overhead, \nits shadow falling across you and \nsending instinctual fear coursing \nthrough you",
        "text": ". Take cover! Hide - Where do you hide? How close did it come? Did it even notice you? Decrease Timers by 1."
      },
      {
        "page": 178,
        "card": "4",
        "title": "Konami's Path\nUp, up, down, down, scramble, \nscurry, scramble, scurry, wiggle, \nclimb",
        "text": ". Mountain hiking sure is a lot of work! Exhausted - You need to take a rest. Decrease Timers by 1. You may complete the 'Fellow Hiker' Action, or rest alone. Fellow Hiker - A hiking beast stops beside you and chats for a while as you catch your breath. Where are they headed, and why?"
      },
      {
        "page": 178,
        "card": "3",
        "title": "A Pleasant Surprise\nAs you haul yourself over \na rocky ledge, it gives way \nbeneath you",
        "text": ". Cursing at your bruised bottom, you dust yourself off. Luck - Choose an Earth Reagent, and draw a card. If its value is equal to or higher than the Reagent's Base Rarity, it is unearthed from behind the rocky ledge! Add it to your Bags. ACE A Sign To Nowhere A Titan made plaque stands here just off the path. Many beasts have put forward theories as to why its here but few can agree. Why do you think it's here? What do you think it says? Mountain Foraging Encounters Brown ridges encompass the Bristley Woods. Within their stony reaches live the Philosopher-Goats, and several lofty communities. 178"
      },
      {
        "page": 179,
        "card": "5",
        "title": "When You Look Up ,  \nYou Will Find Me\nAt the crest of this particular \nhill, you find a paw-built \ncairn",
        "text": ". Beasts have left some offerings to mark the passing of friends or perhaps family. Invent a Trinket or Reagent Part with the [ELSEWHERE] Tag to find on the cairn. Do you take it? If not, why not?"
      },
      {
        "page": 179,
        "card": "6",
        "title": "The Height Of Wit\nYou pass a group of hikers \nhaving a rest",
        "text": ". They jokingly tell you that its not far to the top, looking over their shoulders at the distant peak of the mountain you're standing on. Who are these beasts? What interesting tidbit do you remember from your chat with them?"
      },
      {
        "page": 179,
        "card": "7",
        "title": "Flock Full Of Trouble\nThe hillside is suddenly \nthronging with sheep \nwho've come up from lower \nparts looking for food",
        "text": ". What names do you hear bleated out through the crowd? How do you avoid being headbutted or stepped on? Having A Baad Time - Whenever you go to gather a Reagent while Foraging in this location, draw a card. If the new card is higher than the Reagent's Rarity or the card you drew to find the Reagent, a sheep eats it before you can get it."
      },
      {
        "page": 179,
        "card": "8",
        "title": "Stick 'Em Up!\nYou're stopped by an \narmed beast with a \ndangerous look to \nthem",
        "text": ". They demand your bag and threaten you with tooth and iron. What fearsome weapons do they wield? Play it Safe - You give them your satchel. Discard everything in your Bags, and lose all your Trinkets. Scrap - You try to fight them off. Draw a card for you and two cards for them. The highest single card wins. You can draw a second card if you have a Crossbow and Bolt. If you win the fight - you chase them off and can take their Weapon. It has the same function as a Crossbow, but only works against Beasts, not Behemoths. If you lose the fight - they kick, beat and bite you. While you shelter from their attacks, they snatch your Bags. Discard all of your Items, and lose all your Trinkets. 179"
      },
      {
        "page": 180,
        "card": "M",
        "title": "Ray Tracing\nThe clouds part, letting refreshingly warm \nbeams of sunlight through",
        "text": ". The whole hillside glows emerald and gold, making it much easier to find hidden Reagents. Lit Up - Gain 1 Foraging Points each time your Forage until you next Move On."
      },
      {
        "page": 180,
        "card": "10",
        "title": "Special Technique\nYou spy a duo of beasts \nweaving fine filters out of \nheather, and collecting spring \nwater in waxed satchels",
        "text": ". They get protective as you approach, covering their work behind their backs. What excuses do they give for their strange actions? Secrets Of The Craft - If your Guild Reputation is Upstanding, these secretive beasts acknowledge the importance of your work, and offer to teach you a special PURIFY preparation method. PURIFY - When Creating A Remedy, you can [PURIFY] it, so long as you gathered the last Reagent in a Mountain Location. Doing this removes all [FOUL] from the final remedy. Shunned - If your Guild Reputation is Established or lower, the beasts hastily grab all their things and dive headlong into a nearby patch of gorse. You leave them to their bickering and yelps."
      },
      {
        "page": 180,
        "card": "J",
        "title": "Protective Parents\nA young lamb has \nwandered over to you \nwhile you're foraging",
        "text": ". How sweet! Before you can even introduce yourself, the rest of the flock charge at you to protect it! Scamper! - Run as fast as you can, Down the scree or Up steep slopes. Down the scree - You escape safe and sound, but cannot Forage in this location until you have Moved On. Up the slope - Out of breath, you're safe to keep foraging. Your aching limbs need a break though; decrease Timers by 2. On flitting wings - If you or your Familiar can fly, you dart out of reach of the mountain sheep. Continue Foraging."
      },
      {
        "page": 180,
        "card": "9",
        "title": "Coursing River\nThe last of the mountain snow is melting, \nswelling a hillside stream into a raging river",
        "text": ". Wait, watch out, don't step there! Swept Away - A violent flood sweeps down and carries you off down the mountain. Lose 3 Foraging Points or Decrease the Timer by 2. 180"
      },
      {
        "page": 181,
        "card": "J",
        "title": "Moment of Clarity\nAs you reach the top of \nthe mountain you come \nacross a beast sitting in \na most unusual position \natop a rock",
        "text": ". They say they are clearing their head, and invite you to join them. Take part - If you stop to meditate, Decrease Timers by 1. What thoughts cross your mind? How do you feel before, during, and after the meditation?"
      },
      {
        "page": 181,
        "card": "M",
        "title": "Blazing Sun\nThe sun bears down on you \nundeterred by the weak \nbreeze while the shade is \nscant and scarce and offers \nlittle respite",
        "text": ". Coldblooded Bliss - If you are a coldblooded beast, you actually find yourself more invigorated by the heat. Increase Timers by 2. Fur and Feathered Fools - The heat forces you to seek out water and shade. Decrease Timers by 2."
      },
      {
        "page": 181,
        "card": "10",
        "title": "Refreshing Drink\nA considerate",
        "text": " beast has rolled up a cart full of cool drinks to a popular rest stop on this side of the mountain, serving all the beasts who are making the trek today. Why do business in such a remote place? Snack Time - Give away one of your Reagents to Increase the Foraging Timer by 1 thanks to your renewed vigour."
      },
      {
        "page": 181,
        "card": "9",
        "title": "Arena of the Mind\nThe thunder crack of \ngoats colliding echoes \ndown past you and as \nyou follow to see its \nsource you discover a \ntrio of goats around a \nnatural salt lick! These \ngoats are arguing over a \nphilosophical principle, \nand are",
        "text": " butting heads over it. Debate the Goats - Decrease Timers by 1, and draw a Card. If it is a ♥, ♦, or ♣ - You invent a reasonable solution to their theoretical problem. Add Rock Salt to your Bags. If it is ♠, the goats are displeased with your theories! They stamp their hooves and scare you off; Lose 2 Foraging Points. Follow in their Hoofsteps - Eventually they tire of bashing, and start to wander the nearby mountainside for fresh ground to stomp around in. In their wake, they leave sheddings! Decrease Timers by 1, and gain 1 Behemoth Bits. 181"
      },
      {
        "page": 182,
        "card": "M",
        "title": "Dreich\nThe clouds part and let their rains fall \nhard and cold, turning the ground to \nmush",
        "text": ". Little streams gouge channels in the mud as they run down the mountain side. You are otherwise safe."
      },
      {
        "page": 182,
        "card": "10",
        "title": "Howl\nDistant, a full moon comes \nto life as it hangs near the \nhorizon",
        "text": ". Echoing across the hills you hear the unmistakable blood chilling sound of a wolf's howl; a single word: \"Feast!\" Stay low - You seek shelter in dew-soaked shrubs. The wolf doesn't spot you. Decrease Timers by 2. Blood to blood - You can turn and fight. Draw three cards; one for you and two for the wolf. The highest total value of all cards wins. If you are carrying a Crossbow and/or a Weapon, you may draw an additional card for yourself for each. If you win the fight - Describe how you injured the wolf enough to search for easier prey. Did you sustain any wounds? If you lose the fight - Your foolishness earns you a painful injury that will undoubtedly heal into a grim scar. You escape, but lower your Speed or Carry by 1."
      },
      {
        "page": 182,
        "card": "J",
        "title": "Gather At  \nThe Tree\nEerie singing flows down \nfrom a gnarled old tree",
        "text": ". You recognise cats and crows, caterwauling and throwing a party at the base of the tree's trunk. As you approach, you can smell sweet treats. The beasts invite you to join in. Why host the party here, at this particular gnarled tree? Tales from elsewhere - The beasts tell you fun, scary legends about this very mountain with some helpfully detailed directions. Gain 4 Foraging Points. What famous characters feature in the legend they tell?"
      },
      {
        "page": 182,
        "card": "9",
        "title": "Softened  \nSensations\nA thick mist flows down the hillside from dew-\nladen peaks, making it near impossible to find your \nway! You'll have to rely on unconventional senses if \nyou want to navigate this part of the mountain",
        "text": "... How does the landscape change when focusing on it with other senses? Sniff and listen - You do not gain any bonus Foraging Points from Tools during this Forage. 182"
      }
    ],
    "Titan": [
      {
        "page": 183,
        "card": "J",
        "title": "Speed of Sound\nAs you hike, a terrible \nsneeze builds in your \nsnout",
        "text": ". However, the snow around you looks too precarious to let loose even a whimper! Hold! - Draw a card: ♥ - You hold the sneeze! Continue on unimpeded. ♦, ♣ or ♠ -- You let out a let a thunderclap of a sneeze, and the snow rumbles down from tree branches and mountains slopes to engulf you. Decrease Timers by 2 as you dig yourself free."
      },
      {
        "page": 183,
        "card": "9",
        "title": "Mountain Rescue\nA box full of waxed \npaper kites sits \nsafely beneath a \nrocky overhang",
        "text": ". A little plaque says \"take one and fly it if ever you need rescue in these treacherous peaks. Kite - Add a Kite to your Bags. You may fly it while travelling through Mountain Locations to immediately travel to the nearest Settlement. Doing so while Helping Local Beasts with an Ailment causes you to lose 3 Reputation."
      },
      {
        "page": 183,
        "card": "10",
        "title": "Chilled To The Bone\nA fell wind blows across the \nmountain's face, chilling you to \nthe bone",
        "text": ". Harsh Wind - Set a Timer of 3. Whenever you Forage in a Mountain location decrease this Timer by 1, until it reaches 0 or you Move On. Warm Up - If the timer reaches 0, you need to stop to make a quick fire. Decrease Timers by 3 as you gather wood and find shelter."
      },
      {
        "page": 183,
        "card": "M",
        "title": "Mercy For  \nThe Mighty\nYou hear some low and rumbling \nwhimpering coming from a cave \nnearby",
        "text": ". Inside, a haggard Bear Lairds groans, a putrid black- veined infection spreading from paw to elbow. They give you a pleading look. You can choose to start an Ailment with [INFECTION 3], [INFECTION 3], [PAIN 2] and Timer 8. Just in time - If you create a Remedy in time, news spreads among the Bear Lords of the Bristley Woods. If in the future you face a bear, replace negative outcomes with “Journal about your encounter with such a massive creature showing deference to you.” Too late - If the Timer reaches 0, you return to the Barrow to find the bear has passed Elsewhere. Do you perform passing rites for this beast? What can you find in its Barrow that could indicate who they were in life? If you so wish, you can pillage their Barrow of up to 10 Rarity's worth of Reagents of any Type. 183"
      },
      {
        "page": 184,
        "card": "3",
        "title": "Gas Leak\nA horrible stinging haze hangs in the air",
        "text": ". When you breathe it in, it makes your eyes burn and your lungs wheeze. You can't spend too long here. Where is the gas coming from? Rush - Draw a Card at the end of each Encounter in this Location, including this event, until you next Move On. If you draw a ♠, the stinging haze poisons you. Poisoned - Make a remedy that solves [Poison 2], or lose all Foraging Points. You cannot Forage at this Location again until you next Move On."
      },
      {
        "page": 184,
        "card": "2",
        "title": "Password\nPart of this ruin is protected by a \nmysterious lock made of metal \nbuttons with embossed  \nTitan glyphs",
        "text": ". Look Around - As you Forage, if you draw a J or M you may, instead of a Reagent, find something with the Titan Symbols written on it. If you do, you may Open The Door. Open The Door - You press the symbols and the lock opens, revealing what lies beyond. Depending on how you've described this Titan Ruin you can either: Gain a Titan Codex; you can trade the Knowers for 20 Trinkets at the end of this Journey. (You don’t have to find them, they'll find you). Establish a Clinic at this Location; choose a new Service to add to the Agenda, even if you don't qualify for it. Titan Foraging Encounters Those that dare scrounge here best beware. Toxins, burning cables, and metal claws await any fool hardy beast who wanders in. 184"
      },
      {
        "page": 185,
        "card": "4",
        "title": "Final Resting Place\nAs you delve deep \ninto this ruin, you \naccidentally cause a wall \nto collapse, revealing \na whole new chamber",
        "text": ". The inside smells of long dried dust, and the massive bones of a strange Behemoth that were interred inside. Wailing Curse - If you choose to enter this new chamber, draw a card. ♥ or ♦ - You scamper through into the eerily silent, dusty chamber. You feel at liberty to explore, and yet also like you're trespassing. ♣ or ♠ - As if you had startled a sleeping wolf, a ear shattering whine begins to fill the air. Dust shivers down from the ceiling. You a forced to flee, unless you have a Titan Thingamabob. If you make it into the chamber - amongst the long deceased behemoths you find a crumbling sack of tools far too big for you to use. However, the sack also contains a number of strange devices. Gain either a Cranky Contraption Companion, a Titan Thingamabob, or a Titan Reagent of value 8 or lower."
      },
      {
        "page": 185,
        "card": "5",
        "title": "Malevolence  \nGrafted To Metal\nEverything is quiet, \nalmost too quiet",
        "text": ". You turn just in time to see a strange Not-Cat watching you from elsewhere in the ruin. Its eye glow with slits of pulsing red, and its jaw is in a constant grin full of yellowing metal teeth. Your instincts scream that it means to eat you. Flee - Draw two Cards, one for you and one for the not-cat. If your card is: Higher - You manage to escape! How did you evade the clanking feline? Lower - It manages to hit you but backs off as if playing. Go to Confrontation. Confrontation - Draw another card, and add its value to your original. If your total is still lower - The Not-Cat's slaps force you into a space it can't reach. It's oddly echoing meows sound both familiar, and also like meaningless babble. Trapped - With the Not-Cat prowling around outside you can only patch up your wounds and wait for an opportunity. Draw a card. Decrease all Timers by its value. It takes that long for you to find an opportunity to escape. What was it like being trapped for so long? How do you manage to escape? 185"
      },
      {
        "page": 186,
        "card": "9",
        "title": "False Idols\nYou come across what appears \nto be some sort of shrine to \nthe Titans",
        "text": ". Some beasts have lit candles and left offerings in front of a picture of what you think might be a Titan. Why would anyone try to talk to the Titans? Shortcut - Pawprints in the dust show you a safer route through this portion of the ruin. Gain 2 Foraging Points."
      },
      {
        "page": 186,
        "card": "7",
        "title": "What Remains\nYou find the remains of a beast",
        "text": ". They've gone Elsewhere, leaving only their lonely dust-covered bones behind. How did they meet their end? Investigate - Draw a Card. If it is higher than 6, you find something among their things that tells you where they are from. If you take news of their demise to their home, gain 4 Reputation. Borrow - They won't be using their gear anymore. Gain a Tool for free. How do you feel about taking something that belongs to someone else? Memento - If you borrowed a Tool and take news of this beast's demise to their home, you can return the it for an additional 6 Reputation."
      },
      {
        "page": 186,
        "card": "6",
        "title": "Lock And Key\nAs you explore this \npeculiar ruin, you \ncome across an \nintentional hollow",
        "text": ". It's clearly titan-made, but for what purpose? Power! - If you have a Titan Thingamabob, you may put it in the hole and gain one of the following effects: Light - The ruin is lit up by a torch, hanging lights, or a mesmerising colourful display. Gain 3 Foraging Points after completing an Encounter in this location, until you next Move On. Cameras - A wall illuminates, showing you a vision of the future. You can redraw an Encounter card once until you next Move On. Action - Something moves in the ruin to reveal a Titan Reagent of your choice!"
      },
      {
        "page": 186,
        "card": "8",
        "title": "Snap , Crackle, Pop!\nSomething in this ruin \nmakes a terrible and \ndangerous noise",
        "text": ". What does the sound remind you of? Can you tell what is making the sound? Searching - Choose to be Careful or Quick. Careful - Decrease Timers by an additional 1 after each Encounter, as you check often for Titan traps. Quick - Move with reckless abandon. Draw a card after each Encounter: ♣ or ♠ - You touch something dangerous; pain courses through you! You must leave this Location and end the Forage as you tend your own wounds. 186"
      }
    ]
  },
  "socialEncounters": {
    "Bog": [
      {
        "page": 190,
        "suit": "♥",
        "title": "Reed Harvesting\nGreen spears strike out from the \nground in thick, luscious bundles",
        "text": ". One cluster shivers and slowly individual reeds start to fall away. Waterway. A freshwater bog can quickly become a stagnant, rotting swamp if they grow too thick. Locals share the responsibility of clearing reeds, keeping on top of them together. This beast is clearing reeds from nearby waterways. What do they look like? Do they hail from a guild? Wickerweavers. The Guild of Wickerweavers make a lot of use out of the constant nuisance that are river reeds. First soaking them in water, the Wickerweavers plait the softened strands into beautiful patterns, baskets, fishing traps, folding ladders, and more. This beast is collecting reeds to make something. What is their project?"
      },
      {
        "page": 190,
        "suit": "♦",
        "title": "Preserved\nBog beasts often utter this piece of \nwisdom",
        "text": ": \"the Bogs gives what the Bog gets\". It refers to the practice started by beasts of old to bury offerings back into the fresh cut peat. If stored correctly, all manner of things cease to age. Time Capsule. A nearby beast is showing a friend what they found when cutting peat in a nearby field. What did they find? How old is it? How does the beast feel about it? Do they know who first buried it? An Offering From The Guild. You pass a guildbeast placing bundles of waxed cloth tied with titan-silk string into the black mud of a fresh-cut hole. They invite you to make your own donation for future generations. What do you think of this custom? Do you bury anything from your Bags? Amongst thin streams, tall reeds and lush heather you can find Bog Settlements. The houses here are often built on wooden stilts, or clinging to rare outcrops of solid rock that poke out beneath the rich peat. Lizards, frogs, newts, dippers, and other wetland- loving beasts live here; however, those with fur might not enjoy the constant mud and muck. Bogs 190"
      },
      {
        "page": 191,
        "suit": "♥",
        "title": "Airborne\nSlowly but surely a loud buzzing \nsound is growing closer towards \nyou",
        "text": ". You twist and turn to see what it is, only spotting the source with moments to spare! Hivewarden. Garbed in gauzy linen and a wicker basket helmet, this guildbeast guides a flock of Dragonflies, each leashed with a thread of spider silk. Where might the hive warden be taking them, and why so many? Noonmessenger. Bold as a bolt of lightning, glimmers of colour and brown fur blur by. A harnessed a team of dragonflies, drags a tiny beast on their errands between settlements! What is the most important package this tiny messenger is carrying? Fleeing Thickblood. Swatting and cursing, honey on their paws, a Thickblood mercenary has been routed from their picnic spot by wasps! Where do they run to for shelter? Of the Bristley Wood's different cities, Noonhill is the youngest. It looks down on the largest body of water in the woods, the Crossing Loch, and serves as an inland rest stop for beasts travelling further south. The most memorable feature of Noonhill is its Watch Tower, which spots Behemoths from miles away. The city is surrounded by small ponds and eddying streams, making it difficult for the heavy hooves of deer or boars to wade through, and therefore much safer for its smaller citizens."
      },
      {
        "page": 191,
        "suit": "♦",
        "title": "Florist\nPots of dull grey clay sit half \nsubmerged in the muddy loam, \nsurrounding a wooden hut on stilts, \ncovered in wild flowers",
        "text": ". The aroma of this place is green, and tangibly alive. Smell the Flowers. The cultivator of this whimsical bog garden sits on the porch of the hut, trowels and shovels scattered around them as they work. Do you stop to indulge your senses at this florist's hut? Keen Eye. You spy a useful reagent, sheltered by large fern leaves. You can pluck it while nobody is looking. If you do so, gain a Plant Reagent Part of Rarity 6 or higher. Connoisseur of Scents - If you carry Titan Musk Scrapings, this florist sniffs them and bounds over excitedly. You can trade the scrapings and fill your Bags with as many Plant Reagent Parts as you can carry of any Rarity. Noonhill 191"
      },
      {
        "page": 192,
        "suit": "♣",
        "title": "Diving Birds\nThe surface of a nearby pond \nbubbles almost silently, fed by \nmany tiny trails of moss filtered \nwater",
        "text": ". In the dark depths dive colourful Kingfishers, emerging with tiny minnow fish in their sharp beaks. Catch of the Day. A small beast strings up caught minnows for smoking. They give you a friendly nod, and gesture at several free stools near their fire. Do you stop to chat with this beast? What personal tale do they share with you? Misplaced Paws. The moss and soil is treacherous this close to the pond; a sure step turns into a wet plunge! You fling your bags safely to the side, but are yourself soaked from tip to toe. What is it like to dip into this boggy pond? Did anyone see? How do they react?"
      },
      {
        "page": 192,
        "suit": "♠",
        "title": "Training",
        "text": "\"Come here — you can do it! Follow my voice... there we go... now, through the hoop! Yes, YES! Wait, No!\" You cross paths with a young Hivewarden, in the middle of coaxing a Damselfly to perform a new trick. Wonderful bugs! The hivewarden sees your fleeting interest in the scene, and takes the opportunity to rattle off a number of exciting facts about what wonderful bugs Damselflies are. What do you think of this Hivewarden's enthusiasm? Hatchling. \"Here, it's not so hard. Try holding this one — oh! I think they like you!\" The hivewarden ecclesiastically hands you a delicate Damselfly. It buzzes lazily around your head. If you wish, gain a Damselfly Companion. It has the same function as a Butterfly or a Cricket Companion"
      },
      {
        "page": 192,
        "suit": "♣",
        "title": "Essence, in Oil\nThe air around you grows more \nhumid, until you reach a beast \ntending a strange set of copper \ncontainers, some submerged in \nwater, others over small fires",
        "text": ". Explanation - “I'm making perfume! Watch, I boil these iris blossoms here, and their oils extract on the steam... which cools over here... and collects in this glass bottle! It's time consuming, but worth it!\" The perfumer offers to show you more of the process. If you made a perfume, what oils would you use? Demonstration - You help the Perfumer shovel iris blossoms into the boiler, freeing them up to monitor the different apparatus. They're very appreciative of your help! If you stay to keep helping, reduce any active Timers by 1. Gain 'Iris Oil', (Weight 1/3). It can be APPLIED for [NERVES 2]. 192"
      }
    ],
    "Forest": [
      {
        "page": 193,
        "suit": "♣",
        "title": "Insulation\nAt the edge of the settlement, \nyou pass some locals tying \nclumps of fluffy moss to \nwooden stakes",
        "text": ". They take each clump from full baskets, all freshly gathered from the surrounding bogs. One of the beasts catches your eye, and leans against a basket. \"It’s good insulation, if you can get 'em dry. Great for keeping out the wet and cold!\" What colours are the different mosses they collect?"
      },
      {
        "page": 193,
        "suit": "♠",
        "title": "Hot Pocket\nA little ways ahead, you hear \ncontented groaning",
        "text": "— a sun- basking lizard slowly turns itself over on a sizzlingly hot rock, a rare feature to poke out of the cool wet mud around it. Do you take a moment to enjoy the sun, and stretch your muscles?"
      },
      {
        "page": 193,
        "suit": "♠",
        "title": "The Bog Gives\nA short cheer draws your attention from \nthe path ahead",
        "text": ". Nearby, some locals are cutting logs of rich, dark peat from the bog. A cluster of them are digging at a spot with fervent interest. Celebration - Investigating the commotion, you arrive to see them dig a clay pot out of the bog. The date clawed on the side marks it as decades old, but the hard, salty butter inside looks freshly made."
      },
      {
        "page": 193,
        "suit": "♣",
        "title": "Stagnant\nOut in the slushy mud, you see a team \nof locals hacking and digging away at a \nreed bank",
        "text": ". “The constant freeze and thaw during winter causes the bog to get dense. If we don't clear channels, the water here will go stagnant come spring, and all sorts of gross.” one beast explains. Pitching In - You can wish the locals luck, or borrow a shovel and help them dig new channels. Reduce active Timers by 1 to gain 1 Reputation, or Mark 1 Day and gain 3 Reputation."
      },
      {
        "page": 193,
        "suit": "♠",
        "title": "Marsh Wader\nMethodically, a massive heron \nstalks through the semi-\nfrozen marsh surrounding this \nsettlement",
        "text": ". Its legs send vibrations through the mud with every step, and it examines each nearby pool with a cool, calculating interest. Occasionally, the heron will stab its sharp beak into a pond or bit of loam, snapping up a fish. The locals side eye this behemoth bird with equal parts apprehension and curiosity. Curiosity - Such a tall behemoth must have seen plenty of the surrounding bogs. You could strike up a conversation with them, if you could sate their appetite for a little while. If you feed the heron an edible Reagent, Gain 5 Foraging Points at the start of your next Ailment. To a heron, most beasts are just inconsequential specks. What does it think of you? 193"
      },
      {
        "page": 194,
        "suit": "♥",
        "title": "Tree Lift\nNot all beasts can scurry up and around \na tree's bark",
        "text": ". Naturally, pulley lifts are a common feature in most settlements. Awkward Small Talk - You find yourself scampering for an available lift, and a local holds it until you leap aboard. Journal about your experience aboard the lift, out of breath and assailed with polite questions about your day."
      },
      {
        "page": 194,
        "suit": "♦",
        "title": "Bridges\nTrees naturally grow so that the \ntips of their branches just touch \ntheir neighbours",
        "text": ". Forest beasts take advantage of this, connecting different trees together with rope bridges, easily expanding as their population demands. Swinging - A young beast is laughing and hooting as they rock the bridge to and fro. How do you feel about crossing this shifting bridge? Does anyone react to the youngster? New Paths - A recent storm caused the bridge ahead to snap, its two halves now clattering against their respective tree boughs. How often do bridges break in this settlement? How do the locals feel about it? Forest Settlements are threaded through native tree branches, keeping locals off of the ground and away from dangerous behemoths. The beasts that live in these ‘hometrees’ forage for food, gathering berries and mushrooms from the forest floor and nuts and cones from the woods’ trees. Dried goods are kept in convenient hollows. Houses made of woven branches and insulated with dry moss are dotted along treetop roads, which are made of multiple branches woven together, connected by rope bridges. Forests 194"
      },
      {
        "page": 195,
        "suit": "♦",
        "title": "Market\nFairwind birds from all over the world \nstop to sell their international wares at \nthe Peddlebough",
        "text": ". Wooden streets circle from forest floor up to canopy tops. Irresistible Bargain - A keen merchant steps out of their stall, exclaiming that you have just the thing they were hoping the find. You can choose to swap one of your non-basic Tools for any other from the Tools list. Delightful Indulgence - Journal about a new food or luxury you experience. Impulse Purchase - You're tempted by all manner of strange and foreign plant cuttings on display. You can buy a 'Foreign Reagent' for 2 Trinkets (Weight 2/3) It provides [TAG 2]. You decide its Type, Tag, and Preparation Method. Journal about this Reagent’s origin."
      },
      {
        "page": 195,
        "suit": "♥",
        "title": "Orebeater Forges\nUnderneath each of Odoak's Boughs \nlies a busy Forge",
        "text": ". Root formed barrows are reinforced with stone arches. Here, badgers hammer away at glowing metal. A Quick Cure - Apprentice Orebeaters are overeager at the forges, and their masters are wise to keep a store of salves on hand. You can trade any [INFECTION], [BURN] or [PAIN] reagents you have, gaining 1 Trinket per Potency provided. Work in Progress - As you navigate the Boughs, you witness a team of Orebeaters in the middle of a complicated project. As you pass by this forge, a resting Orebeater strikes up a conversation with you. What news do you share? Odoak Originally called ‘The Ancient Green Oak’, this city is built under, around and atop a grove of gnarled oak trees that dominate the canopy of the forest. The city’s name shortened over many years from Ancient Oak, to Old Oak, to Ol’ Oak, and now to Odoak. The city is home to bats, mice, squirrels and many small species of bird. Each hometree of the city is called a ‘Bough’, and each Bough has many levels built across trunks and along larger branches. Under the roots of each Bough live badgers who first founded the Guild of Orebeaters. 195"
      },
      {
        "page": 196,
        "suit": "♣",
        "title": "Cul tivation\nSpring brings with it a flourish of \nnew buds, splitting branches, and \nfeathery blossoms",
        "text": ". Caretakers of any hometree know that now is the time to set plans for the coming year, binding branches into new roads, and pruning their trees to provide additional shelter from the elements. New Plans - Several important looking beasts are crowded around a set of sketched plans pinned to their hometree's bark. What are they building?"
      },
      {
        "page": 196,
        "suit": "♠",
        "title": "To Glide, or not to Glide\nA Craftpaw chapterhouse are testing \nout all manner of contraptions they \nclaim will revolutionise how beasts \nmight fly around the woods",
        "text": ". Wheee! - One Craftpaw manages to swirl into a curving flight, up until they slam into the side of the hometree. How far do they fall? Does their contraption survive the crash? Slowfall - A shadow passes over you, large and round. Its owner is a Craftpaw testing a device they call a 'fall protector'. Its a wide, thin sack that fills with air and slows their descent through the air. Do they get caught in the hometree's branches, or get enveloped by their falling parachute?"
      },
      {
        "page": 196,
        "suit": "♣",
        "title": "Betting Match\nA popular pastime in the woods is to \nrace these tiny bugs, betting on which \ncan crawl the furthest or finish their \ncocoon the fastest",
        "text": ". An Opportunity - A lone caterpillar cocoon hangs precariously on a nearby branch, where wind or rain would easily dash them away. A Snack! Chomp down on the convenient treat. Increase your Speed by 1 for your next move. A Friend! Add a ‘Cocoon’ (Weight 1/3) to your Bags. After you have travelled 10 Paths, or ended a Journey, it hatches into a Butterfly Companion. Place a Bet - Nearby, a race is about to finish. There's time for you to place a bet on one of four caterpillars as they close the gaps on their cocoons. Choose a Suit (e.g ♥) and place a bet of 1, 2 or 4 Trinkets. Draw from the Deck, placing the first of each suit drawn into 1st, 2nd, 3rd and 4th place. If your chosen Suit came 1st, double your bet; 2nd, make your bet back; 3rd or 4th, lose your bet."
      },
      {
        "page": 196,
        "suit": "♠",
        "title": "Deep Fried Delicacy\nBlossoming flower buds can make \nfor a delicious treat, especially when \nusing up the remnants of winter \nstores",
        "text": ". Blossoms fried with acorn- flour batter are a lovely seasonal treat, and available in abundance. Crunchy Treat - a branchcart shares out freshly fried blossoms to locals and guild members. Journal about this oily, crunchy and piping hot treat. What spices have been used to complement the blossom? 196"
      }
    ],
    "Loch": [
      {
        "page": 197,
        "suit": "♠",
        "title": "Duty\nCome autumn, many \nplants and trees go \ndormant, and fungi \nstart to bloom",
        "text": ". Forest beasts need to check their home-trees from top to bottom for signs of disease or rot, and quickly burn or poison it, lest the whole tree succumb. Check for Rot - as a Poulticer, your knowledge of fungi is well established. Journal about how you help a local task force in their search for dangerous or poisonous fungi on their tree. Unexpected Detour - Your planned route needs a diversion, as the branch ahead is cordoned off - rot has been found! Journal about a short cut you need to take."
      },
      {
        "page": 197,
        "suit": "♣",
        "title": "Sauna\nDuring the winter, beasts set \nup temporary saunas on the \nforest floor",
        "text": ". Their large domed structures fits all sizes, and snow is thrown on the open log fire to create a warm humid interior. Hauling the Winter Log - A tree is felled, stripped, and burned slowly all winter to heat the sauna. Its ashes are collected for soaps, exfoliants, and as a rich fertiliser. Journal about helping the local beasts haul more of the winter log into the Sauna. Add a Burned Wood Reagent to your Bags. Easing Aching Muscles - Sit a spell in the steamy sauna, and perform some much needed stretching. Who else is sitting in the sauna with you?"
      },
      {
        "page": 197,
        "suit": "♠",
        "title": "Tall Tales\nA lack of foliage causes most \nforest beasts to stay close to \nhome during the winter",
        "text": ". They play a tree-wide game called 'Tall Tale' where one beast starts a story at the base of their settlement's tree, and it is retold up the tree. When it reaches the top, it is shouted for the whole settlement to hear. Seeding a Story - Journal about a story you start at the base of this tree, or one you are told and then pass to someone else. Sharing the News - Journal about being the last to hear the story, and what it was like to shout it from the top of this settlement."
      },
      {
        "page": 197,
        "suit": "♣",
        "title": "Spike Defence\nBrambles are a wonderful deterrent against \nBehemoths, and a source of rich, tart berries",
        "text": ". In the Autumn, local beasts weave tunnels into new growths allowing access to home-trees while keeping Deer and other big animals away. Tunnel Trouble - A local beast has gotten themselves tangled up in sharp thorns while trying to form a new path through the tree's brambles. Do you or some other beast help get them loose? 197"
      },
      {
        "page": 198,
        "suit": "♦",
        "title": "Woven Strands\nBy the water's edge are a half-circle \nof Wickerweavers, a Guild known \nfor getting their paws wet",
        "text": ". They're working busily away on all sorts of baskets, traps and tools. Projects Big - Several apprentices use their combined weight to shift and manoeuvre thick strands of wicker, under the direction of the tutoring master craftbeast. What is this large weaving for? Does it look structural in nature? Designed for use above or below water? Projects Small - On their own, a more experienced weaver fiddles with multi-coloured strips of reed and willow. They've been soaked in dyes, and their paws are stained from tip to elbow. What are they making? Is its functional, beautiful, decorative, or a mixture of all three? Projects Wide - The beasts here are putting the finishing touches on a Coracle, a cumbersome but useful rowing boat that's round and concave, like the shell of a massive nut. You can bargain for the Coracle. For a quick sale, it costs 5 Trinkets."
      },
      {
        "page": 198,
        "suit": "♥",
        "title": "Fresh Catch\nWandering past a dock, you smell \nfreshly gutted fish and the sweat of \nhard working beasts",
        "text": ". The catch of the day is being tossed from boat to dock, and the rocking of the boat makes a rhythmic drumming against the pontoon. What have the beasts caught today? Do any of the Fishfinders below merit a second glance? Amongst the rushes, straddling river banks and sandy beaches you will find Loch Settlements. Here, the predominantly aquatic beasts turn grasses and reeds into semi portable shelters that can be packed up and moved whenever heavy rains cause water levels to rise. Beasts with barges will punt up and down the rivers of the Bristley woods, and rely on these Settlements for safe harbour. Lochs 198"
      },
      {
        "page": 199,
        "suit": "♥",
        "title": "Boatmakers\nHammering, sawing, the taste of fresh \nsap on the air and the smell of cut \nwood",
        "text": "; these senses overwhelm any beast moving through the dockyard. Beaver Builders - Teeth gnaw and carve logs of wood into prows, masts and every other shape of ship you could imagine. They're easily absorbed in their work, commissioned as often by Guilds as by individual land-bound beasts. What ship do you see being designed? Canteen - Hard working beasts work up a ferocious appetite, and the Canteen serves greasy, belly filling food. If you join the fast-moving queue, you can show your Poulticepounder Guild crest and get a bowl full of food. What do you eat? How does it taste? Gain 2 Carry from the hearty food until the end of your Next Move."
      },
      {
        "page": 199,
        "suit": "♦",
        "title": "Nursery\nUp bank and away from the docks are \nthe Pots",
        "text": "; large clay-walled buildings with open roofs. Farmers tend to a nursery of trees - pines, oaks, willows, and other species too. Regrowth - When they're big enough, the Guild of Loggnawers collect the sapplings and plant them out in the land they've cleared. How many beavers does it take to move a single sapling? Mother 'o Fruits - Towering over the Pots is a single, massive apple tree. Wait, no its a pear tree. Hang on... its all sorts of trees! Branches from different species have been grafted onto a single host, so that the tree bears fruit all year long. What fruit is in season right now? Apples, pears, peaches, cherries? Add 'Fruit' to your Bags. It can be USED/COOKED for [FAIR 2/3]. Far to the north of the Bristley Woods sits Loch Katrine, a languid mirror to the stars. A crew of Beavers dug a river to lower lying bodies of water, and established Newdam. This tiny settlement flourishes with trade from the northern heart of the woods, and is famous for its shipyards and waterside wooden lodges. NewDam 199"
      },
      {
        "page": 201,
        "suit": "♥",
        "title": "Interior\nVessel’s Titan chambers are \nconveniently connected by a network \nof metal tunnels with white-porcelain \nentrance halls",
        "text": ". Stonestackers postulate that these once transferred food to each room for the Titans to eat; most only see them as well-organised roads. Guild House - Every Guild you could imagine has set up a chapter house here in the Vessel. Which Guild office do you pass? What services do they offer? Luxury Apartment - Titans clearly used to live in this Vessel. Though beasts live here now, the old grandeur remains. What ornate details do you see as you move from chamber to chamber? Cat Lairds - Ages ago, they cleared Vessel out, declaring it their own. They're less blood thirsty now, focused on trade. Rumour says they've cousins at Shallot. You pass a Laird in a hallway. What do they wear? Who do they speak to?"
      },
      {
        "page": 201,
        "suit": "♦",
        "title": "Exterior\nOutside of this truly ancient boat are \nthe 'Sticks', a shanty town of pontoons, \nhouse boats and tightly packed meeting \nplaces, full of beasts trying to live in the \nshadow of the Vessel",
        "text": ". Lockdown - You pass a small shack with a red cross on its door. A family peers out from the windows, looking miserable. They’ve been quarantined Donate a [BREATH] Reagent Part to gain 1 Reputation. Homecooked Meal - You can stop into long boats with low roofs and hot hearths for a quick meal. You can swap a Trinket for a meal, and double your speed for your next Move. Warf Rats - a group of young scraggly- looking rats are playing a game at the end of one of the narrow pontoons. Have you seen these players before? Have the rules updated since last time? In the centre of the Crossing Loch lies a boat of unimaginable scale. When beside it, it is long enough to fill the horizon, and tall enough to fill the sky. Its strange Titan exterior is breached against a rocky islet, and its many massive chambers are home to beasts, guilds, travellers and a family of Cat Lairds, called the Claires. Vessel 201"
      },
      {
        "page": 202,
        "suit": "♣",
        "title": "Luminescent Orb\nA splash and a gasp startles you",
        "text": ". Swivvling quickly, you're relieved to find the source of noise is a pleased looking otter, recently surfaced nearby. They are treading water while examining a small pearl clutched delicately in their paws. Depthdivers - There are many beasts in the Guild of Depthdivers, but naturally most of their members consist of otters, dippers, newts and frogs. What sort of things have they found while searching riverbeds and loch bottoms? A Clammy Deal - As you glance at the pearl, the otter catches your eye. \"Say, you look like the kind of animal that knows the value of this bauble. How's about we trade?\" This friendly otter will swap their newly found Pearl for 3 Trinkets, or a Part from any of the following Reagents; Big Fish, Small Fish, Beehive, Blackcurrant, Cucumber, Strawberries, Roses, Wild Garlic"
      },
      {
        "page": 202,
        "suit": "♠",
        "title": "Carved  \nin Bone\nSitting on the prow of a nearby \nboat, their feet trailing in the \nwater, a beast whittles away \nat a bit of salmon cuttle - the \nlarger, more durable bones of \nthe fish",
        "text": ". What are they carving? Is it figurative or imaginative?"
      },
      {
        "page": 202,
        "suit": "♠",
        "title": "Maintenance\nA regular 'chop' sound falls in time \nwith your stride",
        "text": ". A local beast is cutting down thick green growths of reeds that are starting to overwhelm a nearby bridge out of town. Occasionally a stack of these reeds are collected by a local weaver, and bundled into a wicker basket. What do you think is the relationship between these two beasts?"
      },
      {
        "page": 202,
        "suit": "♣",
        "title": "Waterdancers\nPlayful shrieking, whooping and splashing \ndraws your attention out over the water",
        "text": ". Several beasts are surging across the water's surface on thin wooden boards connected with pliable reed masts to wide canvas sails. The wind whips them along, occasionally toppling them head first into the drink. Do they have any decorative designs on their boards? Do any of the dancers perform special tricks as they play? 202"
      }
    ],
    "Meadow": [
      {
        "page": 203,
        "suit": "♣",
        "title": "Clammed Up\nTap, tap, crack! Tap, tap, crack! A local is \nmethodically bashing freshwater clams \nopen on a nearby rock flat, shucking their \nflesh into a wooden bucket of water",
        "text": ". Working for a Snack - “I've the muscles for bashing clams, but can't reach this boil on my back. If you help lance it, I'll happily give you some fresh clams! You can stop and help. Decrease any Timers by 1, and add Fresh Clams (Weight 2/3) to your Bags. You can be use them for the equivalent of 3 Trinkets when Bartering, and will go bad when you next Mark a Day on your Calendar."
      },
      {
        "page": 203,
        "suit": "♠",
        "title": "Oak Smoker\nThe rich smell of burning oak and drying \nfish briefly overwhelms your senses",
        "text": ". On the shore not far away, several smoking chests are attended to by a dozing local. What fish do the locals catch here? Do you see anything they use to flavour it, such as rock salt or special herbs?"
      },
      {
        "page": 203,
        "suit": "♠",
        "title": "Shanty\nAs you walk across a bark pontoon, \nyou hear several beasts singing \nbelow you",
        "text": ". They're repairing fishing nets spread out wide across thick ice, and are keeping time with a rhythmic working song. One beast slaps the ice with their tail to keep the others in time, and they're all working up a sweat. Join in - You clamber down from the pontoon and introduce yourself. They'll teach you a song, so long as you help by holding a ball of twine. Does this new song have a deeper message somewhere in the lyrics? Watch from above - Leaning over the edge of the pontoon's railing, you watch the massive net shift and squirm from beast to beast as it is mended. It almost looks as if it's alive itself. What shapes or patterns do you spot in the net? Gain 1 Foraging Point as the net's patterns inspire you."
      },
      {
        "page": 203,
        "suit": "♣",
        "title": "Cranky\nA pinging tremor vibrates through \nthe thick ice you're currently \noccupying, rhythmic and digging",
        "text": ". A short ways ahead, a beast drills at the ice, creating a hole through which to go ice fishing. Sit a spell - You borrow a worn wooden stall to sit and catch your breath, and watch on as the beast churns the hard ice into shavings. Do you share words with the drilling beast? What are they hoping to catch? Take a turn at the crank - Empathising with the beast, you offer to lend your efforts for a short while. While the drilling beasts sits and rests, they snooze for a few minutes. What do you think they dream of? 203"
      },
      {
        "page": 204,
        "suit": "♥",
        "title": "Inspection\nA beast in a colourful tabard waves \nyou over",
        "text": ". You see that travellers bags are being checked by local volunteers for contaminants that could spread spores to valuable goods like grain. Waved on past - If your Bags do not contain any Plant Reagent Parts from mushrooms the beast lets you continue with a friendly smile. Journal your thoughts on the effects of these searches. A Stern Lecture - If your Bags contain Plant Reagent Parts from mushrooms, the beast's face draws down with a grimace. Explaining their medicinal use, the beast's anxiety lessons, but not before they give a stern lecture about the danger that blight causes on the settlement's winter stores. Journal about the beast that searched your bag. Have they seen first-hand the danger that blight poses? Why did they volunteer for this role?"
      },
      {
        "page": 204,
        "suit": "♦",
        "title": "Monuments\nMeadow settlements rarely shift \nover time, tied as they are to natural \nsheltering structures",
        "text": ". This means many small monuments dot the highs and lows of each town. Work in progress - Ahead, a beast in the middle of making a monument. You can weave a Trinket of your own into the monument; if you do so, gain 1 Reputation. A curious marking - As you wander this settlement, you half trip over an old marking. What is the marking made of? What do you think its original purpose was - to commemorate memories, to celebrate life? Or something more mundane? Open rolling hills of wild grasses peppered with mossy stones and thistly flowers dot the Bristley Woods, and to the untrained eye they can appear to be completely uninhabited. These Settlements use natural features as shelter from the elements; they’re built into sturdy gorse bushes, or in hillside barrows reinforced by the roots of old, gnarled trees. Anything exterior can be quickly packed down and hauled to safety, away from fast approaching predators and Behemoths. Meadows 204"
      },
      {
        "page": 205,
        "suit": "♥",
        "title": "Navigation\nThe tunnels of Summit are \nilluminated by the golden light of oil \nlamps, and thin spears of grey skylight \nfrom air shafts",
        "text": ". Tunnels twist over and under one another, connecting barrows and chambers into a network of homes and chapterhouses. Lost - Nestled against an outcrop of rock, a young beast timidly stares at a dimly lit map. Many other beasts hustle about on their own tasks. Journal about the feeling of being lost in a new city. Can you help this beast? Could you confidently give directions? Crestguard - Named for their tower that overlooks the meadows of Summit's entrance, these mostly flighted beasts warn and protect the city against Behemoths. Periodically throughout the tunnels they sit on iron perches, watching for trouble. Journal your thoughts about these guards. Do they help you feel safe, or are you suspicious of them?"
      },
      {
        "page": 205,
        "suit": "♦",
        "title": "Junction\nEvery intersection of two or more \ntunnels creates a throng of beasts, \njostling to go up, down, or through the \njunction of tunnels ahead",
        "text": ". Sorry! - You tread on another beasts paw, or perhaps they shove into you a little too hard. How do they react? Do you argue? Pocketpaws - It's only a street away from a close encounter with a small beast that you realise the straps on one of your Bags is open. When you look inside, your realise that something is missing! Lose 1 Trinket. Do you think it was stolen? If so, why? Thousands of beasts can fit inside this city’s marble tunnels, built into an ancient Titan quarry. Its iron gates are tall enough for a bear, and its thoroughfares split like fattened arteries into ever-smaller burrows. Many different guilds hold chapterhouses here, even if some are simply meeting places or storage halls. Summit 205"
      },
      {
        "page": 206,
        "suit": "♠",
        "title": "Emerging Bud\nA delicate and ornate flower bud \npokes out from beneath the shelter \nof neighbouring thick perennial \nleaves",
        "text": ". Something about it catches your attention - perhaps its smell, colour or texture. Floral beastlore - You know for sure this flower has no medicinal value. However, it does have some sentimental quality. What is this plant? What stories do beasts tell that involve or are somehow tied to this flower?"
      },
      {
        "page": 206,
        "suit": "♣",
        "title": "Bees!\nYou come across a hivewarden \ndesperately trying to separate their \nbees as they buzz and huddle and \nsting one another",
        "text": ". The hivewarden explains that two queens were born, causing a leadership challenge! Protect the Queen - The Hivewarden asks if you can take the Queen to a different meadow and let her go. If you agree, gain a Queen Bee. The Queen Bee can be re-homed in a Wild Meadow, Bog or Forest. Release The Queen - When you re-home a Queen Bee, it starts a new hive. Mark the hive's Location on your Map. You and other Poulticepounders may automatically gather Hive and Hive Reagent Parts in this Location when Foraging. Wish them luck - Sometimes its bee-st not to get involved in the business of other guilds. Lose 1 Reputation."
      },
      {
        "page": 206,
        "suit": "♠",
        "title": "Emergency Care\nA cream coloured tent spotted with \nroad-dust and more than pawful of \nsturdy patches has been erected \ndefiantly in a communal space of this \nsettlement",
        "text": ". The gentle silhouettes of beasts undergoing treatment can be seen inside. Stitcher's Care - The Guild of Stitchers are somewhat cousins to your own Guild. Where you produce poultices, holistic care, and herbal remedies, their goal is to study the bodies of beasts and document their inner workings for use in surgery. How do you feel about the Stitchers? What do you think their place is in beasts' healthcare? Supply and Demand - A stitcher packs a smoking pipe near an open tent flap, clearly exhausted. Spotting you, they initiate a friendly conversation, talking about the types of patients they've treated. What sort of problems are their patients facing?"
      },
      {
        "page": 206,
        "suit": "♣",
        "title": "A Web For  \nCharlotte\nSeveral small cubs are attentively \nwatching a grass-spider weave a \ndelicate web across the window \nof a nearby house",
        "text": ". Join in - Part of you is just as fascinated by the spider. What pattern does the spider weave? What do the cubs say when it is finished? 206"
      }
    ],
    "Mountain": [
      {
        "page": 207,
        "suit": "♣",
        "title": "Calvinball",
        "text": "\"Tag! You're on a three round time out\" a cub yells. \"No, wait, I was holding the red rod - that means I had safety! No fair!\" a fledgling with half their feathers grown in calls back. A group of young animals have invented a game, and its players have distractedly taken over the path ahead. Arbitrate - \"Wait a minute, you're holding the red rod, but so is your friend. What does that mean?\" you ask inquisitively. \"Wait, well, uh...\" the bird begins... The wee beasts are eager to explain their game. What are the rules? How many can play? How do you win, lose, or have fun?"
      },
      {
        "page": 207,
        "suit": "♠",
        "title": "BRB\nYou clip past a stall made out \nstrips of woven bark",
        "text": ". It's currently half draped with a rough cover of knotted grass netting, from which hangs a small painted sign - \"Be Right Back\". Most of the goods of the stall seem to be stashed away. What service does the stall provide? Who runs it, and where have they gone?"
      },
      {
        "page": 207,
        "suit": "♣",
        "title": "Keen Reading\nHumming and hawing, \nan older beast kicks their \nfeet as they flick through a \nrather lengthy book almost \nas big as themselves",
        "text": ". The book rests on a large stone lectern, and is secured with a rather thick iron chain. A short queue of other beasts is growing behind this distressed reader. What to sow? - Spring is coming, and seeds need planting. This older beast is dithering while reading this communal farmers almanack. Do you step in to help them? What do you say? Or, do you mind your own business and leave them to the mercy of the queue?"
      },
      {
        "page": 207,
        "suit": "♠",
        "title": "Pawprint\nCrossing the slush of the \nstreet ahead are a set of \nstark, fresh tracks",
        "text": ". What beast made these tracks? Where were they headed, and how urgently did they move? What do you think they were up to? 207"
      },
      {
        "page": 208,
        "suit": "♥",
        "title": "Shift Change\nThe mountains are places \nof scarcity, in comparison to \nthe lush forests and bountiful \nmeadows of the woods \nbelow",
        "text": ". The beasts here are industrious and hard working, and almost every hour of the day a new shift of Guildbeasts is either coming or going from a collaborative task. As you walk the cobbled streets, what Guild do you see going about their business? You have the opportunity to hire a Guild Service, and all Guild Services have a 1 Trinket discount."
      },
      {
        "page": 208,
        "suit": "♦",
        "title": "Getting Around\nHomes in mountain settlements \ncan sometimes feel distant and \nunconnected",
        "text": ". Cliffside crags are adorned with small opportunistic bird-houses, and natural caves are embedded with mosaic entry-halls to cosy underground burrows. Ease of access - Ahead, you pass into a passage, path or doorway that was built just for you. It's perfect in every way; height, width, and range of movement. How do you feel, being in a space made by beasts with the same requirements as yourself? Unaccommodating spaces - You've followed well intentioned directions that have led you to a route you cannot travel across. What is the impediment? Is it an issue of space, method of travel, or something else? How do you feel about this? The architecture of mountain settlements is very distinct; carefully stacked walls of shale and stone reinforced with living ivy, spherical nests woven from weeds and twigs, and tiled roofs built against flat walls of rock. The beasts that live here can sometimes feel isolated from their friends in the loam and brush of the Bristley Woods. However, the views over the forests and lochs below are incredible. Mountains 208"
      },
      {
        "page": 209,
        "suit": "♥",
        "title": "Linen\nDuring the day, workers from the Guild \nof Flaxflayers can be heard beating \ncoarse fibres, and spinning it into \nballs of linen twine of different sizes \nand widths",
        "text": ". Inside Spoolkeep, looms operated by teams of mice weave dyed threads into intricate patterns. Stress Relief - Frustrated beasts can take their anger out on a tough stretches of flax. Slapping at the fibres with rods of birch twigs can be both therapeutic and physically exerting. Do you vent some frustrations? Offcuts - Apprentice Flaxflayers often make a great many mistakes; lumpy flax, poorly spun thread, and patchy fabric. These goods are sold at a discount by a chatty pair of elderly mice, close to Spoolkeep's main gates. Do you have a natter with the mice? What gossip have they got to share from their knitting group? If you wish, you can trade 5 Trinkets for a Lumpy Blanket; it has the same properties as a Knitted Blanket, but is a bit uglier."
      },
      {
        "page": 209,
        "suit": "♦",
        "title": "Thinkers\nFar to the north of Spoolkeep where \nonly eagles would dare to soar live tribes \nof Goats",
        "text": ". These Philosopher-Behemoths debate the laws of the world, meeting at stone circles to bray their arguments. Bleated Wisdom - You pass a massive, freshly-shorn goat in the middle of a massage from a team of rats. What advice might the goat share? Woolworks - Colleges of goats regularly descend from the mountain tops to Spoolkeep. In exchange for shearing and cleaning them, citybeasts have a rich supply of oily wool for their own crafts. If you lend a paw washing the trimmings, you can add Behemoth Bits to your Bags. In a word, Spoolkeep is an industrious city. Its four districts are divided by ancient Titan walls, a source of continual inspiration for the Guild of Stonestackers. Stone pillars and wooden scaffolds support houses on many different levels, with cranked lifts and staircases chaotically built throughout. In the brick huts outside Spoolkeep’s walls live the farmers and threshers, harvesting flax and spinning it into linen thread for extravagant weaving. Spoolkeep 209"
      },
      {
        "page": 210,
        "suit": "♣",
        "title": "Refresh\nA group of sleepy-\nlooking beasts \ntrudge towards the \nedge of town",
        "text": ". An ice-melt freshwater spring gurgles into a paw-made pool, and you can spot several locals washing the hibernation out of their fur and feathers. Long Sleep - In the mountains, far from foragables, it makes sense to give in to natural instinct and hibernate through the winter. What dreams do hibernating beasts have? How do they honour those that never wake up?"
      },
      {
        "page": 210,
        "suit": "♣",
        "title": "Grinding Ore\nA low growling rumble grips the \nearth and stone beneath you",
        "text": ". A group of Orebeaters use a massive stone wheel to grind chunks of iron ore into finer rubble. Keen eyed apprentices picks out the rusty-red coloured ore, collecting it into a woven pan. Talents of all sizes - Most beasts imagine the Founding Badgers, who started the Guild many years ago underneath the old roots of Odoak. Nowadays all sorts of beasts work the mined metals, under different sub-orders; copperclaws, silversnouts, pewterpaws, and more. What sorts of beasts do you notice amongst the orebeaters today? How do they use their natural talents to enhance their trade? Storied Swap - Iron pellets are a fine, if niche, medicinal reagent. Approaching the beasts, the master orebeater is willing to give you a few of their precious pellets in exchange for a lesson about their value to the apprentices. If you teach the students a new fact about Iron, you can add Iron to your Bags."
      },
      {
        "page": 210,
        "suit": "♠",
        "title": "Echo\nThe curvature of a sharp rocky \noutcrop is perfect for two beasts \nto yell at each other from far away, \nand yet hear each other with perfect \nclarity",
        "text": ". Enthused by this, their jaunty conversation has become now everybeasts' problem. What are they yelling about? Do you join in? Does anybeast tell them to shut their maws?"
      },
      {
        "page": 210,
        "suit": "♠",
        "title": "Cliff Dancing\nSun-warmed stones and westerly \nwinds combine to make joyous \nupdrafts over cliff edges and \nmountain sides",
        "text": ". As you wander about town, you notice several beasts leaping from their balconies, spinning and dancing in the air on their wings and mobility aids. How many cliffdancers are there? Do they compete, give pointers, or do they ignore each other? 210"
      }
    ],
    "Glasswall": [
      {
        "page": 211,
        "suit": "♠",
        "title": "Carved in Stone\nCrisp, cool air helps keep working \nmuscles from overheating",
        "text": ". A busy beast is hauling a roughly hewn block of stone into this settlement on a rickety two- wheeled cart. Chisels and hammers rattle on their hip belt. What colours can you see running through the stone? What do you think they'll carve from it?"
      },
      {
        "page": 211,
        "suit": "♣",
        "title": "Panning\nA stream of freshwater gurgles \nthrough this settlement",
        "text": ". Several beasts are rattling pans through the shallows, stirring up the mud, hoping to find fragments of precious metal. Go Panning - If you ask nicely, one of the panners will lend you their sieve while they stop for a quick break. You can pan in the mud for a while. Reduce any current Timers by 1. Draw a card from the deck; if you drew ♥, you find Silver Shards! Add them to your Bags. A Refreshing Dip - The panners need to constantly stir up the mud, so that they can sieve it for any fragments of precious metal that may be lying deep in the silt. You could help them for a short while, and cool down from your travels. Reduce any current Timers by 1. If you are resolving an Ailment, gain 2 Foraging Points. If you are travelling, gain +2 Speed for your next Move."
      },
      {
        "page": 211,
        "suit": "♣",
        "title": "Hot Toddy\nSeveral beasts have gathered at \na nearby stone balcony, watching \nthe roiling icy mists that swirl \naround the treeline far below",
        "text": ". Each sips their warm drink of choice, watching in amicable silence. What are these beasts drinking? Do you think they know each other? Do you stop to appreciate the mists below?"
      },
      {
        "page": 211,
        "suit": "♠",
        "title": "Warm Embrace\nBitterly cold winds screech \naround the stone halls of this \nsettlement",
        "text": ". A charitable beast has set up a small brazier in the lee of a rocky outcrop, and is warming smooth stones of various sizes around it. A Warm Stone - In exchange for thanks and smile, the beast will help you wrap a hot stone in fabric, perfect for snuggling amongst your clothes. If you are currently resolving an Ailment, gain 1 Foraging Point. Otherwise, enjoy this act of warming kindness. 211"
      },
      {
        "page": 213,
        "suit": "♥",
        "title": "Domestic Salmon\nOutside the city on the edge of the Loch \nis a massive paw-made hollow",
        "text": ". At its mouth are wooden bars woven with a fine mesh of treated reeds. Wallabies rear bright silver salmon in the hollow here. Tickling - If you lower a paw into the water, a placid salmon will swim up to the surface for a scratching. Have you ever handled a live fish? What do its scales feel like?"
      },
      {
        "page": 213,
        "suit": "♦",
        "title": "Done-deal\nThe silhouette of a",
        "text": " capercaillie looms over two smaller wallaby Hivewardens. They're chatting amicably, exchanging metal gears for jars of thick dark-red honey. A Fresh Face - If you haven't met Griph before, he introduces himself as a travelling merchant and job-doer. His goggles are steamed with condensation. A Reintroduction - If you have met Griph before, the scatterbrained Capercaillie reintroduces himself all the same. Halfway through, he remembers exactly who you are! What stories from the road do you two swap? How did Griph find his way to Glasswall, and where has he come from?"
      },
      {
        "page": 213,
        "suit": "♣",
        "title": "Glassblowers\nTowards the north side of \nGlasswall, a giant Titan artefact \ndrinks in sunlight to maintain \nthe city’s biome",
        "text": ". Spare energy is diverted to a glass-blowers glory hole. Panel Repair - Wallabies protected by sodden bark plates are constructing a replacement glass panel. They are very intent on their work. What other safety measures do they have in place to prevent the molten glass from hurting anyone? Whirling Rods - with plenty of space, a master glass-blower spins a long metal rod, shaping a glob of bright yellow glass before it cools. What object are the wallabies making? Who is it for, and what does it do?"
      },
      {
        "page": 213,
        "suit": "♠",
        "title": "Wandering The City\nSuspended wooden bridges guide \ntravellers through the steamy gardens \nof Glasswall",
        "text": ". Below, wallabies tend their lush tropical gardens. Foreign Cutting - A particularly bright flower (at least, you think it's a flower) has an offshoot growing near the bridge you're walking on. What does it smell like? Where do you think it has come from? 213"
      }
    ],
    "Other": []
  }
};
