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
  type: 'plant' | 'animal' | 'insect' | 'earth' | 'titan';
  br: number;
  locs: string;
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
  bioChoices: {
    descriptors: [
      { card: "A", name: "수생 동물 (Aquatic)", examples: "비버, 딱새, 도롱뇽, 개구리" },
      { card: "2", name: "노래하는 조류 (Melodic)", examples: "되새, 박새, 제비, 어치" },
      { card: "3", name: "땅파는 포유류 (Burrowing)", examples: "오소리, 토끼, 고슴도치, 두더지" },
      { card: "4", name: "장난꾸러기 조류/포유류 (Playful)", examples: "까마귀, 종다리, 칼새, 수달" },
      { card: "5", name: "털 많은 포유류 (Befurred)", examples: "청서, 땃쥐, 멧밭쥐" },
      { card: "6", name: "비늘 있는 파충류 (Bescaled)", examples: "장님뱀, 살모사" },
      { card: "7", name: "발톱이 있는 맹수/조류 (Clawed)", examples: "삵, 황조롱이, 족제비" },
      { card: "8", name: "햇볕을 즐기는 동물 (Sun-loving)", examples: "담비, 도마뱀, 갈매기, 비둘기" },
      { card: "9", name: "별빛에 춤추는 야행성 (Star-dancing)", examples: "박쥐, 여우, 쥐, 쏙독새" },
      { card: "10", name: "진흙에 사는 조류/양서류 (Mud-dwelling)", examples: "뜸부기, 두꺼비, 도롱뇽" },
      { card: "J", name: "눈에 띄지 않는 동물 (Unnoticed)", examples: "바위종다리, 금눈쇠부엉이, 들쥐" },
      { card: "M", name: "위엄 있는 조류/포유류 (Majestic)", examples: "맷닭, 소나무담비" }
    ],
    travelStyles: [
      { suit: "♥", name: "천천히 꾸준하게 (Slow and Steady)", speed: 2, carry: 5, desc: "느긋하게 풍경을 감상하며 느리지만 튼튼하게 이동합니다." },
      { suit: "♦ / ♣", name: "방랑하며 든든하게 (Rambling and Ready)", speed: 3, carry: 4, desc: "산과 호수를 가볍게 넘나들며 하이킹할 준비가 되어 있습니다." },
      { suit: "♠", name: "빠르고 대담하게 (Fast and Heady)", speed: 4, carry: 3, desc: "덤불을 뚫고 숲을 가로질러 위험을 개의치 않고 달려갑니다." },
      { suit: "선택", name: "가볍고 신속하게 (Swift and Soaring)", speed: 5, carry: 2, desc: "날개를 활짝 펴고 기류를 타며 소리 없이 활공합니다. (비행 가능)" }
    ],
    origins: [
      { suit: "♥", name: "지나가는 아포테카리의 영감", desc: "이 길을 스쳐간 노련한 아포테카리가 남긴 인상적인 의술의 영향을 받았습니다." },
      { suit: "♦", name: "늙은 아포테카리의 보조원 모집", desc: "나이 든 아포테카리를 도와 숲속의 영약재를 찾는 보조원으로 의술을 배웠습니다." },
      { suit: "♣", name: "격렬한 부상 치료 경험", desc: "야수와의 마주침에서 입은 끔찍한 부상을 치료받으며 약초의 위대함을 알게 되었습니다." },
      { suit: "♠", name: "사고 후의 치료 서비스", desc: "큰 사고를 겪고 치유사의 도움을 받으면서 아포테카리의 길을 걷기로 결심했습니다." }
    ],
    familiars: [
      { card: "A", name: "덤불 마스터 (Brushwise)", desc: "식물 영약재의 희귀도(Rarity) -2" },
      { card: "2", name: "따뜻한 치유사 (Helpful)", desc: "모든 질병 치료 시작 타이머(Timer) +2시간" },
      { card: "3", name: "용감한 동반자 (Brave)", desc: "거대 야수(Behemoth)와의 위험 조우를 긍정적으로 해결하고 영약재를 획득" },
      { card: "4", name: "말동무 (Chatty)", desc: "물꼬(Barter) 거래 시, 원하는 영약재의 기본 희귀도 -2" },
      { card: "5", name: "빈틈없는 계산기 (Shrewd)", desc: "치료제를 장신구(Trinket)로 교환할 때 장신구 +1 획득" },
      { card: "6", name: "힘센 일꾼 (Vigorous)", desc: "소지량(Carry) +2 (수레가 있을 경우 +4)" },
      { card: "7", name: "자원 기획가 (Resourceful)", desc: "희귀도 7 이하 영약재 하나를 지정하여 지역과 상관없이 채집 가능" },
      { card: "8", name: "베테랑 길잡이 (Seasoned)", desc: "여정 조우 드로우 시 2장을 뽑아 원하는 카드를 선택" },
      { card: "9", name: "예리한 관찰자 (Perceptive)", desc: "질병 치료 시작 시 채집 포인트(Foraging Points) +2 획득" },
      { card: "10", name: "자유로운 영혼 (Independent)", desc: "환자 치료마다 1회, 인접한 위치에서 위험 없이 채집을 보냄" },
      { card: "J", name: "유적/고분 마스터 (Titanwise)", desc: "티탄 영약재의 희귀도 -2, 티탄 유적 및 고분에서 드로우 2장 중 선택" },
      { card: "M", name: "엉뚱한 조수 (Ingenuitive)", desc: "기본 도구 중 하나의 기능을 조수가 직접 수행해 줍니다." }
    ],
    relationships: [
      { card: "A", name: "우연한 만남 (Chanced Upon)", desc: "최근까지 서로 몰랐으나, 지금은 급속도로 친해졌습니다." },
      { card: "2", name: "깊은 유대 (Companion)", desc: "서로 사랑하며 함께 있을 때 더 힘을 냅니다." },
      { card: "3", name: "공동 작당 (Collaborators)", desc: "공동의 프로젝트나 큰 야망을 함께 달성하고자 뭉쳤습니다." },
      { card: "4", name: "스승과 제자 (Mentor)", desc: "고집스러운 면도 있지만 지혜로운 조언이 늘 힘이 됩니다." },
      { card: "5", name: "상처 보듬기 (Supportive)", desc: "비슷한 상처나 무서운 과거로부터 함께 도망치는 중입니다." },
      { card: "6", name: "매력적인 파트너 (Wildcard)", desc: "종잡을 수 없는 면이 나를 매료시키고 서로 흥미로워합니다." },
      { card: "7", name: "가장 오래된 친구 (Oldest Friend)", desc: "어릴 적부터 함께 자라 서로의 부끄러운 비밀을 모두 압니다." },
      { card: "8", name: "피의 맹세 (Blood-bound)", desc: "다시는 입밖에 내지 않기로 약속한 어두운 비밀을 공유합니다." },
      { card: "9", name: "형제자매 (Sibling)", desc: "가끔은 답답하고 부딪히지만 가족이나 다름없습니다." },
      { card: "10", name: "과거의 연인 (Rekindled)", desc: "이전에 깊은 아픔을 겪고 다시 만난 애틋한 관계입니다." },
      { card: "J", name: "마음속에만 남은 이 (Elsewhere)", desc: "이미 세상을 떠났거나 만날 수 없지만 마음속에서 속삭입니다." },
      { card: "M", name: "부모 같은 관계 (Parental)", desc: "나를 거둬 기르고 둥지를 떠난 뒤에도 늘 과보호로 감싸 안습니다." }
    ]
  },
  
  goals: [
    { card: "A", title: "자아 성찰 (Self Discovery)", desc: "나에게 일어난 변화를 되돌아보기 위해 여행합니다.", goalText: "여정 중 만난 생물/야수와의 조우 3번 기록하기" },
    { card: "2", title: "관계 회복 (Partnership)", desc: "여행을 통해 소원해진 사역마와의 소통을 다시 늘립니다.", goalText: "사역마에 대한 저널 기록 3번 이상 남기기" },
    { card: "3", title: "길드의 책임 (Responsibility)", desc: "길드 선배들의 업적을 기리고 명성을 크게 쌓습니다.", goalText: "길드 명성(Reputation) +5 이상을 가진 채로 여정 마치기" },
    { card: "4", title: "자연 환경 조사 (Survey)", desc: "동료들의 요청으로 특정 기후 및 지역의 약초 성장을 관찰합니다.", goalText: "같은 종류의 지역(Region) 위치 3곳에서 저널 작성하기" },
    { card: "5", title: "긴급 치료 (Injury)", desc: "먼 곳에서 심한 병마를 앓고 있는 다른 야수를 도우러 떠납니다.", goalText: "가치가 3인 [상처(WOUND), 감염(INFECTION), 수면(SLEEP)] 영약재를 챙겨 목적지에 도착하기" },
    { card: "6", title: "신선한 영감 (Inspiration)", desc: "지루하고 늙어가는 고향에 새로운 생기를 불어넣기 위해 여러 약초를 수집합니다.", goalText: "각 지역(6대 지역)에서 식물 영약재를 하나씩 채집하기" },
    { card: "7", title: "의학 연구 자료 (Knowledge)", desc: "사지나 부리, 비늘의 구조적 질병을 조사해 동료 치유사에게 보냅니다.", goalText: "[비늘(SCALE), 깃털(FEATHER), 털(FUR)] 관련 질병 3개 이상 완치하기" },
    { card: "8", title: "호송 및 정의 (Justice)", desc: "죄를 지어 길드에서 쫓겨난 범죄 동물을 안전한 도시로 호송합니다.", goalText: "수송 증거물(Evidence, 무게 1/3)을 챙겨 안전하게 목적지에 도착하기" },
    { card: "9", title: "영약 보충 (Restock)", desc: "은퇴한 길드 조력자의 요청으로 개인 비축용 약재를 모아 갑니다.", goalText: "동일한 약효 태그를 가진 영약재 3개를 챙겨 목적지에 도착하기" },
    { card: "10", title: "마음의 정리 (Closure)", desc: "해결되지 못한 오랜 갈등을 매듭짓기 위한 여정을 떠납니다.", goalText: "개인적인 갈등을 저널에 3번 이상 기록하며 여행하기" },
    { card: "J", title: "마지막 작별 (Finality)", desc: "세상을 떠날 준비를 하는 오랜 친구에게 마지막 인사를 건네기 위해 떠납니다.", goalText: "최소 [저편/사망(ELSEWHERE) 2] 가치를 가진 영약재를 목적지에 전달하기" },
    { card: "M", title: "방랑벽 (Wanderlust)", desc: "온 사방에 거센 바람이 불어 야생의 길을 모험하고 싶은 열망에 가득 찼습니다.", goalText: "수렁(Bog), 숲(Forest), 호수(Loch), 초원(Meadow), 산맥(Mountain)에서 각각 저널을 한 번 이상 남기기" }
  ],

  ailments: [
  {
    "name": "발썩음병 (Paw Rot)",
    "rawName": "Paw Rot",
    "severity": "lesser",
    "timer": 9,
    "tags": "infection 1 & 통증 (Pain) 1",
    "description": "After walking one too many days on sodden soil, the webbing in-between this beast's feet are itchy and swollen. Something applied regularly every day for a few weeks should clear it up…",
    "outcome": "Squeaky Clean: If the remedy is PRESERVED - with this long-lasting unguent, this infection can be treated reliably when it shows up again. Next time you come through this location, gain 1 trinket from a grateful patient.",
    "consequence": "Trodden In: While a minor issue on its own, this beast is rather popular. Who else have they spread their Paw Rot to? The next time you visit this location, the only ailment you can try to resolve is Paw Rot. 1 1 2 3 4 5 6 100"
  },
  {
    "name": "PAGE 104 --- Anxious Scratching",
    "rawName": "PAGE 104 --- Anxious Scratching",
    "severity": "lesser",
    "timer": 7,
    "tags": "mood 2, fur, feather or 비늘 (Scale) 1",
    "description": "A low and constant level of stress has worn down this beast; they’ve started to moult uncontrollably.",
    "outcome": "",
    "consequence": "Shed Outta Luck: The beast moults completely. What physical or social pressures do they face now?"
  },
  {
    "name": "잘못된 아이디어 (Bad Idea)",
    "rawName": "Bad Idea",
    "severity": "severe",
    "timer": 6,
    "tags": "joy 2, 통증 (Pain) 2, wound 2",
    "description": "Invention is an important past-time to many beasts in the Bristley Woods but that doesn't mean that every idea is a good - or safe - one as this poor beast has just found out. They need medical attention and a pick-me-up. What was their invention, and how did it hurt them? Your cure cannot have any [FOUL]; this will only upset them more.",
    "outcome": "Inspiration: If you solve this Ailment with Potency (3) Reagents; The inventor feels so refreshed that they offer to modify your existing equipment. Upgrade one of your Basic Tools, or decrease the Weight of a Tool by 1/3.",
    "consequence": "Giving Up: Disheartened by the failure of their invention they lose their spark and give up on inventing altogether. What happens to the blueprints they abandon? Bite the hand that Cures Severe - i 12 Draw an ailment from the Lesser or Intermediates tables. To administer this Remedy you must first find your patient! Treat them like a Reagent with BR 8; they can be found in Current or Adjacent Locations. This beast is absolutely terrified of medicine and doctors of any kind. Their family and friends want you to treat them, but you'll have to find them first Outcome - At Least They're Home If you find the patient but fail to create a Remedy for them; Face the Consequences of your drawn Ailment, but do not lose Reputation. How does their ailment develop without the proper treatment it needs? Consequence - Laughing Stock \"You can't find herbs, let alone an actual animal!\" You are the butt of many jokes in the local area. 104 ---"
  },
  {
    "name": "PAGE 105 --- Blocked Ears",
    "rawName": "PAGE 105 --- Blocked Ears",
    "severity": "intermediate",
    "timer": 6,
    "tags": "감각 (Senses) 2, temperature 2,  \ninfection 1",
    "description": "Huh? What? You'll have to repeat that; this poor beast's ears have gummed up with rock hard wax after a sharp fever.",
    "outcome": "",
    "consequence": "A Silent End: Disorientated from the sudden loss of a sense, this poor beast is easy pickings for a predator. What got them in the end?"
  },
  {
    "name": "흡혈 본능 (Bloodthirst)",
    "rawName": "Bloodthirst",
    "severity": "severe",
    "timer": 6,
    "tags": "본능 (Instinct) 3, stomach 3, 감각 (Senses) 3",
    "description": "An terrible hunger has awoken in this beast. They've eaten something which has caused their thoughts to fog, and ancient instincts are telling them to hunt; every passing hour it becomes harder to resist.",
    "outcome": "",
    "consequence": "Violent Nature: Lost in the fog of their instincts, they hunt. Do they catch anyone? Does anyone stop them?"
  },
  {
    "name": "낙인 치료 (Brand Care)",
    "rawName": "Brand Care",
    "severity": "intermediate",
    "timer": 6,
    "tags": "burn 2, infection 2, 가죽 (Hide) 1",
    "description": "A beast has been branded by one of the guilds as a dangerous criminal, and ostracised from their home. The puffy circle of exposed and blistered skin has become infected.",
    "outcome": "Compassion: If you try to treat this beast; Lose 2 Reputation for associating with outcast vermin. What is their story? Why were they branded? What trinkets do they pay you with from their hastily grabbed possessions? Outcome - Duty If you refuse to treat this beast; Gain 2 Reputation for upholding Guild law. The branded beast flees into the wilds while fever wracks their body. How do you feel about this?",
    "consequence": "Unnoticed: Failing to treat this Ailment does not cause you to Overstay your Welcome."
  },
  {
    "name": "깨진 부리와 약해진 송곳니 (Broken Beaks and Thinning Fangs)",
    "rawName": "Broken Beaks and Thinning Fangs",
    "severity": "severe",
    "timer": 6,
    "tags": "통증 (Pain) 3, 통증 (Pain) 2, stomach 3",
    "description": "A crash, a badly aimed peck, or a fight has caused this poor beast's beak or teeth to crack; they're in constant pain, and struggling to eat.",
    "outcome": "Guild of Fangwrights: If you can find some Silver Shards, you can create a prosthetic, replacement tooth or crown for the patient. Doing so gets you an extra 3 Reputation.",
    "consequence": "Compound Problems: The stress and lack of food causes this poor bird to fall foul of another ailment. Lose 3 Reputation. You may stick around to help by Marking 1 Day, and drawing another ailment; if you don't, they will perish. 105 ---"
  },
  {
    "name": "PAGE 106 --- Crestfallen",
    "rawName": "PAGE 106 --- Crestfallen",
    "severity": "lesser",
    "timer": 7,
    "tags": "feather 2, nerves 2 and 본능 (Instinct) 2",
    "description": "or [feather 2, joy 2 & a brightly coloured plant reagent] Not all birds are happy with the colour of their feathers; some seek bolder colours, or hope to disguise themselves from the keen eyes of predators.",
    "outcome": "",
    "consequence": "Your patient attempts to dye their own: feathers, and it goes horribly wrong. They blame you!"
  },
  {
    "name": "미열 식은땀 (Dullsweats)",
    "rawName": "Dullsweats",
    "severity": "lesser",
    "timer": 9,
    "tags": "breath 1, 감각 (Senses) 1, joy 1",
    "description": "After too long spent burrowed under sweaty blankets away from the world. They want something to clear their nose, open their eyes, and lift their spirits.",
    "outcome": "",
    "consequence": "The window of opportunity has passed,: and depression once again draws this beast back into their dark lair. Who misses their absent friend?"
  },
  {
    "name": "전투 상처 (Fight Marks)",
    "rawName": "Fight Marks",
    "severity": "dire",
    "timer": 6,
    "tags": "통증 (Pain) 2, wound 3, 가죽 (Hide) 3",
    "description": "x2 Whether through pride, greed, fear or a combination of all three, two local beasts have fought and harmed each other greatly. Treat this as two Ailments with separate Timers. One of these beasts started the fight, but neither will admit who was involved. Journal about who these beasts are, and who you treat first.",
    "outcome": "If you treat both patients and Forage a: [JOY 3] Reagent; as part of your care, you get both patients to open up. With your help, they talk through their argument. Are they able to come to a common understanding?",
    "consequence": "Failing to treat a beast means they: will succumb to their wounds, passing Elsewhere and leaving their fight unresolved. If both beasts succumb, lose Reputation twice."
  },
  {
    "name": "첫 열병 (Firstfever)",
    "rawName": "Firstfever",
    "severity": "lesser",
    "timer": 7,
    "tags": "infection 1, 가죽 (Hide) 1, temperature 1",
    "description": "A mild enough disease that many cubs and kits catch. Fighting it off grants immunity to many more dangerous fevers one could contract later in life. Many parents host 'fever partys', to promote herd immunity.",
    "outcome": "",
    "consequence": "Chickenscratch: Itchy red bumps plague these little cubs, and they won't stop wailing, no matter what you try. Journal about the parent's lost sleep."
  },
  {
    "name": "다정한 작별 (Fond Farewell)",
    "rawName": "Fond Farewell",
    "severity": "lesser",
    "timer": 8,
    "tags": "elsewhere 1, joy 1",
    "description": "Tragedy has struck and a much loved pet has journeyed on Elsewhere. This beast would greatly appreciate your help in sending their pet off properly.",
    "outcome": "",
    "consequence": "Fast Forgotten: With no ceremony to commemorate their friend’s passing, dark emotions take hold. How do they process the grief? 106"
  },
  {
    "name": "s Twitch",
    "rawName": "s Twitch",
    "severity": "intermediate",
    "timer": 7,
    "tags": "감각 (Senses) 2, mood 2, poison 2",
    "description": "This foolish beast has eaten a strange mushroom. It has left them seeing things that aren't there, and jumping at shadows. Draw a card to see what sort of experience they're having: ♥ or ♦: A Good Trip: they stay put and out of trouble. ♣ or ♠: Bad Trip: add [WOUND 1] to this Ailment's requirements.",
    "outcome": "",
    "consequence": "They come down from their trip,: embarrassed and feeling changed. What profound wisdom or utter nonsense do they share?"
  },
  {
    "name": "불에 데인 발톱 (Forge Clawed)",
    "rawName": "Forge Clawed",
    "severity": "lesser",
    "timer": 8,
    "tags": "burn 1, wound 1",
    "description": "Whether working directly on hot metal or simply in the wrong place at the wrong time, this beast has been speckled with hot sparks. Small angry burns cover their pelt, and the hide underneath is exposed. A simple poultice should do the trick.",
    "outcome": "",
    "consequence": "Cold ... Hot Shoulder: The beast waves away your fussing and leaves their burns untended. In your absence they become infected. Now they weep with puss, and may even scar."
  },
  {
    "name": "독 버섯 중독 (Foul Deceiver)",
    "rawName": "Foul Deceiver",
    "severity": "dire",
    "timer": 6,
    "tags": "poison 3, stomach 3, pain3, 감각 (Senses) 3",
    "description": "An important member of the local community was given what they thought was a fair and tasty mushroom by an enthusiastic cub.",
    "outcome": "",
    "consequence": "Last Meal: If not cured in time, the patient succumbs to the poison. How does the community suffer or shrink without them?"
  },
  {
    "name": "혼수상태 (Groundhog Syndrome)",
    "rawName": "Groundhog Syndrome",
    "severity": "dire",
    "timer": 12,
    "tags": "수면 (Sleep) 3, mood 3, instincts 3",
    "description": "x3 An unseasonal change in temperature triggered the natural urge of these beasts, causing them to begin hibernating prematurely, despite their better judgement. There are three patients in this Ailment that you must treat in order to quell the panic. This Ailment's Consequences change with the seasons.",
    "outcome": "",
    "consequence": "Spring or Summer: The panic spreads causing the nearest settlement to enter Hibernation early. You cannot Barter or do Social Events in this or the nearest Settlement until the end of the next Season; the waking beasts are too busy picking up the slack. Consequence - Autumn or Winter The beasts cannot rest and their stores will not last to Spring. Some beasts will starve. How do the others survive? You cannot Forage for Plant or Insect Reagents within 2 Paths of this Location until the end of the next Season. 107 ---"
  },
  {
    "name": "PAGE 108 --- Herbivorous Tendencies",
    "rawName": "PAGE 108 --- Herbivorous Tendencies",
    "severity": "severe",
    "timer": 8,
    "tags": "본능 (Instinct) 3, nerves 3, 감각 (Senses) 3",
    "description": "A deep, traumatic survival-driven fear has been awoken in this beast, making it difficult for them to relax. Even the sight and smell of another beast sends them into fits of panic.",
    "outcome": "",
    "consequence": "A deep fear becomes hard-set in: this beast. They pack up and hide somewhere remote, far away from anyone else. If this is a Settlement, permanently remove one of its regional Services."
  },
  {
    "name": "사냥 대상이 됨 (Hunted)",
    "rawName": "Hunted",
    "severity": "dire",
    "timer": 6,
    "tags": "통증 (Pain) 3, wound 3, breath 2, 가죽 (Hide) 3",
    "description": "Half chewed up by a Behemoth, this beast is exhausted from running for help. All of the exertion has done no favours for their injury. If you are Foraging in your Current Location, the Behemoth appears whenever you draw a ♠ card. They force you to abandon the event, Decrease the Timer by 1, and gain no Foraging Points.",
    "outcome": "",
    "consequence": "Cycle of Violence: They succumb to their wounds causing a beast who was dear to them to swear vengeance on the Behemoth. Permanently decrease the cost of Thickblood Services by 1."
  },
  {
    "name": "마음의 어둠/흑수 증후군 (Living With a Black Beast)",
    "rawName": "Living With a Black Beast",
    "severity": "dire",
    "timer": 12,
    "tags": "joy 3, nerves 3, mood 3, 수면 (Sleep) 3",
    "description": "This beast is struggling. They feel numb and fragile, and yet constantly scared. They've taken a brave step seeking you out, but desperately need your help.",
    "outcome": "",
    "consequence": "Stuck: You take too long, giving them ample time to close up again. They refuse your help and the help of those around them."
  },
  {
    "name": "파상풍 (Lockjaw)",
    "rawName": "Lockjaw",
    "severity": "dire",
    "timer": 12,
    "tags": "joy 3, nerves 3, mood 3, 수면 (Sleep) 3",
    "description": "Cut by a piece of Titan trash, this poor beast's jaws have seized shut and a fever has taken hold.",
    "outcome": "",
    "consequence": "Stuck: Without treatment, the fever passes to other beasts who care for them. The Guilds agree to seal off the nearby Ruins to prevent this from happening again. Remove the nearest Titan Ruin from the Map. 108 ---"
  },
  {
    "name": "PAGE 109 --- Long Drop",
    "rawName": "PAGE 109 --- Long Drop",
    "severity": "dire",
    "timer": 8,
    "tags": "wound 3, 통증 (Pain) 3, 감각 (Senses) 3",
    "description": "Looking up above you see an ordinary sight; a beast being ferried through the air by a Sea Eagle from Summit. But— Wait— Oh No! The beast slips from the eagle's grasp and plummets to the ground, somewhere in the distance.",
    "outcome": "Unfound: If the patient is not found, what is done to find them when it is too late? How did they fall off?",
    "consequence": "Grounded: Embarrased to have so failed a customer, Boldheart the Sea Eagle shies away from work. Permanently remove the Service 'Air Taxi'."
  },
  {
    "name": "거품 침 (Mawfoam)",
    "rawName": "Mawfoam",
    "severity": "dire",
    "timer": 6,
    "tags": "poison 3, 감각 (Senses) 3, wound 2, and \neither 본능 (Instinct) 2 or mood 2",
    "description": "A violent disease once purged from these lands now rears its head once more. Afflicted beasts quickly become feral and aggressive. Be careful; the deadliest symptom, a fear of water, shows they are past the point of saving.",
    "outcome": "Watch The Teeth!: If you create a remedy; the patient struggles and fights when you give them the cure. Draw a card. If it as ♠, they bite you in the process. You will need to make another Mawfoam cure.",
    "consequence": "Quarantine: Rightly so, the Guilds agree to abandon this part of the Woods. Remove this Location from the Map. If it was a Settlement or City, Journal about the exodus of beasts to other parts of the Woods, and the emotional struggles that come with that."
  },
  {
    "name": "모기/해충 물림 (Midge Munched)",
    "rawName": "Midge Munched",
    "severity": "intermediate",
    "timer": 7,
    "tags": "가죽 (Hide) 2, 통증 (Pain) 1, poison 1",
    "description": "This foolish beast took a nap in a bog with no protection against the clouds of midges that lurk in such places.",
    "outcome": "",
    "consequence": "Irate Rants: They scratch themselves up badly and end up too irate to approach. They'll be fine in a day or so; your Reputation will take a little longer to repair."
  },
  {
    "name": "이동기 두통 (Migration Migraine)",
    "rawName": "Migration Migraine",
    "severity": "intermediate",
    "timer": 9,
    "tags": "본능 (Instinct) 3, mood 2, temperature 1",
    "description": "A distant land calls, and this beast's instincts are telling them they need to go. No matter if they cannot go, or choose not to; they are suffering an increasing discomfort.",
    "outcome": "",
    "consequence": "They give in to the call and leave,: regardless of whatever was preventing them. How does this make things worse? 109 ---"
  },
  {
    "name": "PAGE 110 --- Monthly Chore",
    "rawName": "PAGE 110 --- Monthly Chore",
    "severity": "lesser",
    "timer": 6,
    "tags": "비늘 (Scale) 2, 통증 (Pain) 1",
    "description": "This lizard is rubbing up against every hard surface they can find to soothe the itching of their scales. It’s almost time for them to shed, but if they can’t find a way of soothing it soon they may rub the new skin underneath raw.",
    "outcome": "",
    "consequence": "Dandruff: There are flakes of dead skin everywhere, and the lizard is too sore to clean up. You can stay and help clean; Mark 1 Day, and lose no Reputation."
  },
  {
    "name": "공포증 (Nervefright)",
    "rawName": "Nervefright",
    "severity": "lesser",
    "timer": 9,
    "tags": "본능 (Instinct) 3, nerves 3, mood 3",
    "description": "A close call with a Behemoth has left this poor beast frozen in fright. Their instincts won't let them move and they won't respond to anyone.",
    "outcome": "",
    "consequence": "Heart Attack: The stress is too much and their heart gives out. Who is the Behemoth who caused this? Use the rules on page 40 to mark their Barrow on the Map."
  },
  {
    "name": "수면 장애 (Night Shift)",
    "rawName": "Night Shift",
    "severity": "intermediate",
    "timer": 6,
    "tags": "수면 (Sleep) 3, mood 2",
    "description": "This beast has been honing a special craft, culminating in their Magnum Opus. They can't work during their normal waking hours because of their roommates conflicting sleep schedules, and so have been going without sleep. They're delirious, and desperate to finish their project.",
    "outcome": "Credits: What is their magnum opus? If you can cure them in time, they will make a dedication on their creation to you.",
    "consequence": "Sleeping on the Job: They fall asleep while working on their special project, and ruin it completely."
  },
  {
    "name": "발썩음병 (Paw Rot)",
    "rawName": "Paw Rot",
    "severity": "lesser",
    "timer": 9,
    "tags": "infection 1 & 통증 (Pain) 1",
    "description": "After walking one too many days on sodden soil, the webbing in-between this beast's feet are itchy and swollen. Something applied regularly every day for a few weeks should clear it up…",
    "outcome": "Squeaky Clean: If the remedy is PRESERVED - with this long-lasting unguent, this infection can be treated reliably when it shows up again. Next time you come through this location, gain 1 trinket from a grateful patient.",
    "consequence": "Trodden In: While a minor issue on its own, this beast is rather popular. Who else have they spread their Paw Rot to? The next time you visit this location, the only ailment you can try to resolve is Paw Rot. 110 ---"
  },
  {
    "name": "PAGE 111 --- Pinned by Pine",
    "rawName": "PAGE 111 --- Pinned by Pine",
    "severity": "severe",
    "timer": 12,
    "tags": "wound 3, poison 3, 가죽 (Hide) 3",
    "description": "Terrible luck! This beast has been caught beneath a falling tree, crushing part of them and turning the trapped blood toxic. You will need to be careful moving them but don't dilly dally neither!",
    "outcome": "Knees Up: If you have a Steel Axe, or can find help at a local Settlement, you can free this patient from underneath the tree. Otherwise, whenever you would decrease this Ailment's Timer, decrease it by 1 more.",
    "consequence": "Smushed: You were too late, the crushing weight of the tree was too much to bear, and the patient has gone Elsewhere. Who, if anybeast, will mourn them? Quagmire'"
  },
  {
    "name": "s Scale",
    "rawName": "s Scale",
    "severity": "severe",
    "timer": 9,
    "tags": "비늘 (Scale) 2, infection 2, poison 1",
    "description": "Small scrapes and scratches to this reptile's scales have become infected. Left untreated, the infection will spread into their blood. If you fail to solve this Ailment before the Timer reaches 2, the [POISON 1] tag becomes [POISON 3].",
    "outcome": "",
    "consequence": "Dark Blood: The signs are clear as day. The infection has spread, and is now beyond your abilities. The grief from their family and friends makes it too awkward to stay in town. Who do they leave behind? Who will miss them? Even if you solved other Ailments, failing this Ailment causes you to Overstay your Welcome."
  },
  {
    "name": "과도한 체취 (Safety Stench)",
    "rawName": "Safety Stench",
    "severity": "lesser",
    "timer": 10,
    "tags": "감각 (Senses) 1 and nerves 1 or 본능 (Instinct) 1",
    "description": "A beast wants to ward off all unwanted company by making the entrance of their barrow stink of something frightening, like a giant behemoth.",
    "outcome": "",
    "consequence": "Bad Neighbours: The Titans had an apt phrase; ‘Hell is other people’. How does this irate beast lash out at passersby?"
  },
  {
    "name": "환절기 몸살 (Seasonshift)",
    "rawName": "Seasonshift",
    "severity": "lesser",
    "timer": 6,
    "tags": "fur 3, 본능 (Instinct) 3, 감각 (Senses) 3",
    "description": "For some unknown reason this beast's fur has started to change for the wrong season, growing thick in Summer and thin in Winter. For a thick coat, you may increase the Timer by 2 if you can cut the fur back.",
    "outcome": "",
    "consequence": "Your patient's discomfort manifests: as angry outbursts. Are other beasts understanding of their embarrassment and pain? 111"
  },
  {
    "name": "s Snout",
    "rawName": "s Snout",
    "severity": "severe",
    "timer": 9,
    "tags": "breath 3, burn 3, 통증 (Pain) 2",
    "description": "Your arrival is greeted by gouts of hot flame and thick choking smoke. A house fire! Your patient has burned their throat and lungs from the smoke, leaving them in terrible pain. Fire brigade You can choose to decrease this Timer by 2 to help put out the fire; Gain 4 Reputation.",
    "outcome": "",
    "consequence": "Charred: Without a quick remedy, the damage is done. The beast will survive, but they'll never have their stamina back. How do they process this loss, and what adaptations do they make to their way of life?"
  },
  {
    "name": "상한 빵 식중독 (Soured Dough)",
    "rawName": "Soured Dough",
    "severity": "intermediate",
    "timer": 9,
    "tags": "poison 1, stomach 1",
    "description": "x4 Mistakes happen, but this one takes the cake. A bad batch of sourdough has given a pawful of beasts unbelievably bad cramps, and a condition the cubs are calling \"the spins\". Treat this scenario as four separate Ailments, with four separate Timers. Gain Trinkets and Reputation from each one you manage to cure.",
    "outcome": "",
    "consequence": "If you fail to cure anyone the: understandably annoyed beasts spread news of your failure all around. You earn 0 Trinkets for your next Remedy."
  },
  {
    "name": "벌침 쇼크 (Stingshock)",
    "rawName": "Stingshock",
    "severity": "intermediate",
    "timer": 4,
    "tags": "poison 2, breath 2",
    "description": "This poor beast is allergic to bees, wasps, and all manner of stinging things. Foul luck has found them pricked, and they've since started to swell up.",
    "outcome": "Emergency Averted: If you make two doses of Remedy; The patient swears to always keep their spare cure on hand. Gain 3 Reputation.",
    "consequence": "Beasts Abuzz: The patient's friends and family start a feud with the local Hivewardens, forcing them to relocate. All Bee and Hive Reagents are permanently Unavailable in this Location. 112 ---"
  },
  {
    "name": "PAGE 113 --- Snail Ails",
    "rawName": "PAGE 113 --- Snail Ails",
    "severity": "severe",
    "timer": 6,
    "tags": "parasite 3, breath 3, 수면 (Sleep) 3",
    "description": "Parasites are spread from infected snails and beasts' droppings. Many beasts squirm at the idea that these worms can burrow through to the heart.",
    "outcome": "",
    "consequence": "Another beast starts to show signs,: then another, until the nearest Settlement is forced to quarantine. You cannot visit this Settlement until next Season."
  },
  {
    "name": "일사병 (Sunstruck)",
    "rawName": "Sunstruck",
    "severity": "lesser",
    "timer": 8,
    "tags": "수면 (Sleep) 1, 감각 (Senses) 2 and  \nfeather or 가죽 (Hide) 1",
    "description": "This hard-working Moonmessenger, normally nocturnal, has been flying extra messages during the day. They need a soothing tonic to help get their circadian rhythm back to normal.",
    "outcome": "",
    "consequence": "Yelp!: The messenger badmouths you to their other Guildmates. What 1-star review do they leave at a services board?"
  },
  {
    "name": "설사병 (The Runs)",
    "rawName": "The Runs",
    "severity": "lesser",
    "timer": 8,
    "tags": "stomach 1, poison 1, parasite 1",
    "description": "After wantonly drinking from random puddles, this patient can’t keep something from rushing right out the other end after eating. The beast’s partner wants something with a regrettable flavour to teach this puddle drinker a lesson.",
    "outcome": "If [FOUL 1] or less; Your patient is cured: of their stomach troubles (but not their taste for earthy puddles). Receive trinkets, but suffer the",
    "consequence": "But They're Convenient!: Puddle drinking was just the start. Poor hygiene and a disregard for dirt are in this beast’s future. Mark the nearest Settlement; you must resolve the Intermediate Ailment Woeful Waters when you next travel here."
  },
  {
    "name": "진드기 물림 (Tickbitten, Twice Shy)",
    "rawName": "Tickbitten, Twice Shy",
    "severity": "lesser",
    "timer": 8,
    "tags": "parasite 1 and fur or feather 2",
    "description": "These parasites aren’t so bad if you can catch them early. However, removing a Tick incorrectly can lead to all manner of diseases and infections. Always remember to do a check after pawing through long grass!",
    "outcome": "",
    "consequence": "The ticks have jumped ship, and are: now bothering any beast they can get their claws on. What gossip is spreading about your patient? Mark the nearest Settlement. When you next pass through, instead of drawing you must solve two cases of Tickbitten with concurrent timers. 113 ---"
  },
  {
    "name": "PAGE 114 --- Titan Touched",
    "rawName": "PAGE 114 --- Titan Touched",
    "severity": "dire",
    "timer": 8,
    "tags": "burn 3, nerves 3, 통증 (Pain) 3, 가죽 (Hide) 3",
    "description": "After brushing against something in a Titan ruin that sent pain coursing through them, this patient has been left with branching scars and burns across their body.",
    "outcome": "Treasure Map: If you create a Remedy before the Timer reaches 0; The patient is conscious, and thankful of your efforts. They tell you where they were exploring. Add a Titan Ruin nearby on the Map, connected with two Paths to other Locations.",
    "consequence": "Gold Rush: The pain is too much and the patient passes Elsewhere. What rumours of the Titan ruins spread in the wake of their death? Their danger only makes them more attractive to foolhardy beasts seeking a thrilling adventure. All Titan Reagents have +1 Rarity until the end of the next Season."
  },
  {
    "name": "관절통 (Trowel Troubles)",
    "rawName": "Trowel Troubles",
    "severity": "intermediate",
    "timer": 9,
    "tags": "본능 (Instinct) 2, joy 2",
    "description": "This beast has an addiction for digging holes and tunnels to the point that the ground beneath their home sags in places. They're hoping for a remedy that can retrain their urges.",
    "outcome": "Light at the End of The Tunnel: If you use Potency (3) Reagents: This digging beast is able to retrain their habits into a measured passion; to prove their new self-control, they help dig a new reasonably sized path from this Location to another on the Map!",
    "consequence": "Collapse: Left unchecked, they dig a network of tunnels that end up collapsing their home. Where do they go now?"
  },
  {
    "name": "통풍 (Waen Drops)",
    "rawName": "Waen Drops",
    "severity": "lesser",
    "timer": 9,
    "tags": "통증 (Pain) 2, minimum fair 3",
    "description": "This beast’s litter are all old enough to start teething in their big fangs, and they whine constantly about the ache. This tired parent wants something that will soothe their jaws a little, and distract the ankle-biters, if only for an hour or two.",
    "outcome": "",
    "consequence": "An infectious case of whining has: spread from the little beasts to their parents. They gossip about you at the market; what do they say? 114 ---"
  },
  {
    "name": "PAGE 115 --- Wake",
    "rawName": "PAGE 115 --- Wake",
    "severity": "dire",
    "timer": 12,
    "tags": "elsewhere 3 & 2, joy 3 & 2, fair 4",
    "description": "Recently, a much treasured member of the community has passed away. The community as a whole is your patient, and they need something that will help them collectively grieve and cherish the memories they had of their friend, now Elsewhere. If you Barter during this Ailment, Journal about what beasts say about this recently passed beast. Increase this Ailment's Timer by 1.",
    "outcome": "Hero's Feast: If you COOKED something for this Remedy; Food is a universal in its power to bring folks together. Gain +2 Reputation for this Remedy, and Journal about a street party held in the Beast's memory.",
    "consequence": "Pity Party: The Wake is more like a Snooze. This treasured community member is commiserated, but then soon forgotten. What legacy could they have left?"
  },
  {
    "name": "날개 골절 (Wingbreak)",
    "rawName": "Wingbreak",
    "severity": "dire",
    "timer": 6,
    "tags": "feather 3, temperature 3, mood 2, \n통증 (Pain) 2 and something to set a bone",
    "description": "Mid-routine, this athletic winged beast crashed into their partner and plummeted out of the sky. They wing is broken, and strong tendons are pulling it further and further out of position. A speedy solution is needed! Setting the wing You can set the wing by using something long and sturdy, such as an Oak (Branch) or by donating a proper tool.",
    "outcome": "",
    "consequence": "Career Ending Mistake: The jagged bones are beyond painful, and now threaten the Beast's life. You have to amputate the wing; while this patient understands, they'll never forgive you - and neither will their fans. Increase the Rarity of all Reagent Parts when Bartering by 2, until the end of this Season."
  },
  {
    "name": "배 속의 회충 (Wormridden)",
    "rawName": "Wormridden",
    "severity": "intermediate",
    "timer": 8,
    "tags": "parasite 2, stomach 2",
    "description": "A greedy little passenger has made its way into this patient and is starving them horribly. They beg for anything that'll get rid of it. Desperate Measures [FOUL] cancels out [FAIR], but does not give a penalty with this Ailment.",
    "outcome": "",
    "consequence": "Hungry Is The Beast: Desperately hungry, this beast digs their way into the local grainstore and eats until their hunger pains stop (which isn't for very long). 115"
  }
],
  reagents: [
  {
    "name": "마로니에/말밤 (Horse Chestnuts)",
    "rawName": "Horse Chestnuts",
    "type": "plant",
    "br": 4,
    "locs": "b f l g m tpsa w\nThis reagent causes almost as many injuries as it \ncures",
    "preps": "⅓ Spiky Husks USED for [ELSEWHERE 1] 1 Perfect Conker USED in games for [JOY 2] ⅔ Chestnuts BOILED for [STOMACH 2] COOKED for [FAIR 2] 1 Beetles 4 132 1 Horse Chestnut 4 140 1 Orange Peel Fungus 3 144 2 Doused Bonfires 4 137 2 Marshgold 3 142 1 Fly Agaric 5 138 1 Tansies 5 148 1 White Willow 5 150 2 Behemoth Bits 8 133 2 Catnip 6 135 1 Bird Leavings 4 133 1 Dandelions 2 137 1 Oak 4 144 1 Orange Peel Fungus 3 144 1 Roses 8 146 2 Burdock 3 134 2 Butterfly 9 135 2 Horse Chestnut 4 140 2 Marigold 5 141 2 Marshgold 3 142 2 Pearls 8 144 2 Strawberries 4 148 2 Yellow Wort 4 151 1 Blackcurrant 5 134 1 Catnip 6 135 1 Thistles 3 149 1 Titansorrel 6 149 2 Big Fish 9 133 2 Fly Agaric 5 138 2 Honey Bees 5 140 1 Catnip 6 135 1 Clay 3 136 1 Iron Ore * 7 140 2 Lavender 5 141 2 Woundwort 7 151 1 Burdock 3 134 1 Yellow Wort 4 151 2 Frog Slime 5 138 2 Silver Ore * 11 147 2 Wasps 5 149 1 Garden Mint 6 139 1 Nettles 2 143 1 Goosegrass 5 139 1 Wild Violet 6 150 2 Hoarhound 6 139 2 Marigold 5 141 2 Ironslug 8 140 1 Cucumber 6 136 1 Goosegrass 5 139 2 Lavender 5 141 2 White Willow 5 150 1 Blackcurrant 5 134 1 Burdock 3 134 1 Nettles 2 143 1 Titansorrel 6 149 2 Frog Slime 5 138 2 Leech † 5 141 2 Rock Salt † 7 146 2 Yarrow 7 151 2 Behemoth Bits 8 133 2 Cucumber 6 136 2 Tansies † 5 148 2 Wasps 5 149 2 Wild Violet 6 150 1 Animal Sheddings 3 132 1 Brambles 4 134 1 Cucumber 6 136 1 Dandelions 2 137 1 Goosegrass 5 139 1 Haircap Moss 6 139 1 Small Fish 7 147 1 Strawberries 4 148 1 Yellow Wort 4 151 2 Beech 5 132 2 Beehive 5 132 2 Big Fish 9 133 2 Doused Bonfires 4 137 2 Hidelendings * 7 139 2 Leech 5 141 1 Animal Sheddings 3 132 1 Marshmallow 6 142 2 Beehive 5 132 2 Haircap Moss 6 139 2 Wild Violet 6 150 1 Burdock 3 134 1 Marshmallow 6 142 2 Thistles 3 149 1 Catnip 6 135 1 Cherry Tree 4 135 2 Forget-me-not * 6 138 2 Garden Mint 6 139 2 Marshgold 3 142 2 Wild Garlic 2 150 1 Cucumber 6 136 2 Beehive 5 132 2 Marigold 5 141 2 Roses 8 146 1 Catnip 6 135 1 Cherry Tree 4 135 1 Cucumber 6 136 2 River Mint 6 145 1 Birch Polypore 5 133 1 Rhubarb 2 145 1 Spiders 4 148 1 Yarrow 7 151 2 Beech 5 132 2 Beehive 5 132 2 Hidelendings * 7 139 2 Horsetail 4 140 2 Oak 4 144 2 Rock Salt † 7 146 1 Animal Sheddings 3 132 1 Brambles 4 134 1 Clay 3 136 1 Cucumber 6 136 1 Dandelions 2 137 1 Honey Bees 5 140 1 Miracle Loaf 11 142 2 Blackthorn 7 134 2 Chalk 4 135 2 Coarse Grit 4 136 2 Field Blewit 4 137 2 Garden Mint 6 139 2 Nettles 2 143 1 Bird Leavings 4 133 1 Chalk 4 135 1 Clay 3 136 2 Blackthorn 7 134 2 Doused Bonfires 4 137 2 Leech † 5 141 1 Bird Leavings 4 133 1 Marshmallow 6 142 2 Beetles 4 132 2 Coarse Grit 4 136 2 Doused Bonfires 4 137 2 Small Fish 7 147"
  },
  {
    "name": "동물의 부산물 (Animal Sheddings)",
    "rawName": "Animal Sheddings",
    "type": "animal",
    "br": 3,
    "locs": "bf lgmtpsaw\nAs the seasons change",
    "preps": "⅔ Pellets CRUSHED for [STOMACH 1] ⅔ Hair BOILED and then USED for [HIDE 1] ⅓ Sweat BOILED and then APPLIED for"
  },
  {
    "name": "너도밤나무 (Beech)",
    "rawName": "Beech",
    "type": "plant",
    "br": 5,
    "locs": "bflgmtpsaw\nLegend claims the Birch was a parting gift from the Titans",
    "preps": "⅓ Shells GROUND for [HIDE 2] ⅓ Nuts USED for [FAIR 1] COOKED for [FAIR 2] 1 Bark BREWED for [WOUND 2]"
  },
  {
    "name": "벌집 (Beehive)",
    "rawName": "Beehive",
    "type": "insect",
    "br": 5,
    "locs": "bf l gmtpsaw\nTo many brave sweettooths",
    "preps": "⅓ Wax USED for [FEATHER 2] ⅓ Royal Jelly USED for [HIDE 2] and [BURN 2] ⅓ Honey ADDED for [WOUND 2] USED in consumed remedies"
  },
  {
    "name": "딱정벌레 (Beetles)",
    "rawName": "Beetles",
    "type": "insect",
    "br": 4,
    "locs": "bf l gmtpsa w\nBeetle shells shimmer and shine in ways that unobservant \nor frightful beasts may not notice",
    "preps": "⅓ Shells Crushed for [SCALE 2] USED for [ELSEWHERE 1]"
  },
  {
    "name": "거대 야수 부속물 (Behemoth Bits)",
    "rawName": "Behemoth Bits",
    "type": "animal",
    "br": 8,
    "locs": "bf l gmtpsaw\nWolves",
    "preps": "⅓ Musk APPLIED for [INSTINCT 2] ⅔ Urine BOILED for [SENSES 2] 1 Fur APPLIED for [TEMPERATURE 3]"
  },
  {
    "name": "큰 물고기 (Big Fish)",
    "rawName": "Big Fish",
    "type": "animal",
    "br": 9,
    "locs": "b f l g m tpsaw\nFew things compare to the joy of catching a nice big fish",
    "preps": "⅔ Skin BOILED for oil, which is APPLIED for 1 Meat COOKED for [MOOD 2] and [SENSES 3] ⅓ Scales CRUSHED for [SCALE 3]"
  },
  {
    "name": "자작나무 버섯 (Birch Polypore)",
    "rawName": "Birch Polypore",
    "type": "plant",
    "br": 5,
    "locs": "bf l g m tpsaw\nWide brown",
    "preps": "⅓ Mushroom APPLIED for [HIDE 2] and [WOUND 1] as"
  },
  {
    "name": "새 배설물/배사 (Bird Leavings)",
    "rawName": "Bird Leavings",
    "type": "animal",
    "br": 4,
    "locs": "bf l gmtpsaw\nWhen you fly everywhere",
    "preps": "⅓ Guano GROUND and then COOKED [POISON 1] ⅓ Egg Shell CRUSHED for [SCALE 1] ⅓ Feathers USED for [JOY 1]"
  },
  {
    "name": "블랙커런트 (Blackcurrant)",
    "rawName": "Blackcurrant",
    "type": "plant",
    "br": 5,
    "locs": "b f l gm tpsa w\nBeasts weave living branches of the Blackcurrant bush \nthrough their homes for stability",
    "preps": "⅓ Berries USED raw for [FAIR 1] ⅓ Leaves BREWED for [INFECTION 1] 1 Roots CHEWED for [MOOD 1]"
  },
  {
    "name": "야생 자두 (Blackthorn)",
    "rawName": "Blackthorn",
    "type": "plant",
    "br": 7,
    "locs": "bf l g m tpsaw\nDespite being incredibly sour",
    "preps": "1 Sloes USED in consumed remedies for [FOUL 2] COOKED for [FAIR 2] and [STOMACH 2] ⅓ Thorns GROUND and BREWED for [POISON 2]"
  },
  {
    "name": "가시덤불 (Brambles)",
    "rawName": "Brambles",
    "type": "plant",
    "br": 4,
    "locs": "b f l gm tpsaw\nBramble patches are often home to small birds",
    "preps": "⅓ Berries CHEWED for [FAIR 2] COOKED for [FAIR 3] ⅔ Bark BOILED into an ointment for [HIDE 1] 1 Roots CHEWED and then BREWED for"
  },
  {
    "name": "우엉 (Burdock)",
    "rawName": "Burdock",
    "type": "plant",
    "br": 3,
    "locs": "b flg m tpsa w\nBurdock",
    "preps": "1 Roots BREWED for [INFECTION 1] ⅔ Stems GROUND into a conditioner for [FUR 1], ⅓ Flowers DIGESTED into a bright paste for ⅓ Burrs USED to comb for [PARASITES 1], can"
  },
  {
    "name": "나비 (Butterfly)",
    "rawName": "Butterfly",
    "type": "insect",
    "br": 9,
    "locs": "bflgm t psa w\nYoung beasts love to chase these beautiful bugs",
    "preps": "⅓ Living Butterfly APPLIED to forehead for"
  },
  {
    "name": "개박하 (Catnip)",
    "rawName": "Catnip",
    "type": "plant",
    "br": 6,
    "locs": "b f l g m t psa w\nThe greatest plant in the world",
    "preps": "⅓ Roots CHEWED for [BREATH 1], ⅓ Flowers BREWED for [INSTINCT 2], [MOOD 1]"
  },
  {
    "name": "분필/석회 (Chalk)",
    "rawName": "Chalk",
    "type": "earth",
    "br": 4,
    "locs": "b f l g m t psaw\nTasteless and gritty",
    "preps": "⅓ Chalk CRUSHED for [STOMACH 2] and [POISON 1]"
  },
  {
    "name": "벚나무 (Cherry Trees)",
    "rawName": "Cherry Trees",
    "type": "plant",
    "br": 4,
    "locs": "b f l g m t psaw\nA favourite among the beasts of the Bristley Woods",
    "preps": "⅓ Cherries COOKED for [JOY 3] and [FAIR 4], ⅓ Bark CRUSHED for [BREATH 1] and"
  },
  {
    "name": "고추 (Chillies)",
    "rawName": "Chillies",
    "type": "plant",
    "br": 6,
    "locs": "bf l g mtpsa w\nFor some",
    "preps": "⅓ Membranes BOILED for [PAIN 1] ⅓ Seeds"
  },
  {
    "name": "점토 (Clay)",
    "rawName": "Clay",
    "type": "earth",
    "br": 3,
    "locs": "b f l g m t psaw\nFound where water meets soft earth",
    "preps": "⅔ Clay USED for [NERVES 1] & [POISON 1] DIGESTED for [STOMACH 1]"
  },
  {
    "name": "굵은 모래 (Coarse Grit)",
    "rawName": "Coarse Grit",
    "type": "earth",
    "br": 4,
    "locs": "b f l g m t psaw\nMany birds eat grit to help break up their food",
    "preps": "⅓ Grit CHEWED for [STOMACH 2]"
  },
  {
    "name": "약초 안정제 (Concocted Calm)",
    "rawName": "Concocted Calm",
    "type": "titan",
    "br": 8,
    "locs": "b f l g m tpsaw\nHomesick and nervous beasts find great comfort in a single \nspritz from this Titan Hissbox",
    "preps": "⅔ Spritzer USED for [INSTINCT 3] and [MOOD 3]."
  },
  {
    "name": "야생 사과 (Crab Apples)",
    "rawName": "Crab Apples",
    "type": "plant",
    "br": 5,
    "locs": "bf l gm tps a w\nBitter and sour if not prepared appropriately",
    "preps": "1 Fruit USED in consumed remedies for [FOUL 1] COOKED to add PRESERVED to COOKED in consumed remedies"
  },
  {
    "name": "오이 (Cucumbers)",
    "rawName": "Cucumbers",
    "type": "plant",
    "br": 6,
    "locs": "b f lgmtpsa w\nA staple of salads and sandwiches",
    "preps": "⅓ Flowers BREWED for [SENSES 2], [SLEEP 1], and ⅓ Marrow USED in consumed remedies for"
  },
  {
    "name": "민들레 (Dandelions)",
    "rawName": "Dandelions",
    "type": "plant",
    "br": 2,
    "locs": "bf l gmtpsa w\nBeautiful sun",
    "preps": "⅓ Flowers USED for [JOY 1] ⅓ Roots GROUND for [STOMACH 1] ⅓ Leaves USED in consumed remedies for [FAIR 1] ⅓ Stems BREWED for [HIDE 1]"
  },
  {
    "name": "꺼진 모닥불 재 (Doused Bonfires)",
    "rawName": "Doused Bonfires",
    "type": "earth",
    "br": 4,
    "locs": "b f l gm t psaw\nPoultice pounders waste nothing",
    "preps": "⅓ Ash APPLIED as an exfoliant for [SCALES 2] BREWED into a soap for [HIDE 2] ⅓ Charcoal CRUSHED for [POISON 2] USED for [ELSEWHERE 2]"
  },
  {
    "name": "광대버섯 (False Deathcap)",
    "rawName": "False Deathcap",
    "type": "plant",
    "br": 7,
    "locs": "b f l g m tpsaw\nAs the saying goes",
    "preps": "⅔ Flesh DIGESTED for [SENSES 3] and [FOUL 6]"
  },
  {
    "name": "민자주방망이버섯 (Field Blewit)",
    "rawName": "Field Blewit",
    "type": "plant",
    "br": 4,
    "locs": "b f l gmtpsaw\nA favourite among the superstitious as they often grow in so \ncalled",
    "preps": "⅓ Cap COOKED for [STOMACH 2] and adds"
  },
  {
    "name": "고운 모래 (Fine Sand)",
    "rawName": "Fine Sand",
    "type": "earth",
    "br": 7,
    "locs": "b f l g m t psaw\nThe lizards of the Bristley Woods are always on a lookout for \nsomething that will make their moulting easier",
    "preps": "⅔ Sand USED as a filter for drunk remedies;"
  },
  {
    "name": "모래주머니 (Firegizzards)",
    "rawName": "Firegizzards",
    "type": "titan",
    "br": 6,
    "locs": "b f l g m tpsaw\nPouches are filled with a strange liquid that burns like a soft \nfire when given a good whack",
    "preps": "1 Gizzard USED for [TEMPERATURE 3]. Can be"
  },
  {
    "name": "광대버섯 (Fly Agaric)",
    "rawName": "Fly Agaric",
    "type": "plant",
    "br": 5,
    "locs": "b f l g m tpsaw\nThe archetypal toadstool",
    "preps": "⅓ Spores BREWED for [INSTINCT 1] and [MOOD 2] 1 Cap COOKED for [SLEEP 3]"
  },
  {
    "name": "물망초 (Forget-Me-Not)",
    "rawName": "Forget-Me-Not",
    "type": "plant",
    "br": 6,
    "locs": "b f l g m tpsa w\nOften given in bouquets as a way to show friendship and \nlove",
    "preps": "⅓ Flowers BREWED for [NERVES 3] ⅓ Nectar BREWED for [BREATH 2],"
  },
  {
    "name": "can only be Foraged for in Summer Frog Slime",
    "rawName": "can only be Foraged for in Summer Frog Slime",
    "type": "animal",
    "br": 5,
    "locs": "b f l g m t psaw\nFrogs secrete a naturally disease supressing slime",
    "preps": "⅓ Slime BOILED for [INFECTION 2] and [PARASITE 2]"
  },
  {
    "name": "정원 민트 (Garden Mint)",
    "rawName": "Garden Mint",
    "type": "plant",
    "br": 6,
    "locs": "bf l g m tpsaw\nThe one and true original mint",
    "preps": "⅓ Leaves CHEWED for [BREATH 2] and [PAIN 1] ⅓ Stems BREWED for [STOMACH 2]"
  },
  {
    "name": "유리 실크 (Glass Silk)",
    "rawName": "Glass Silk",
    "type": "titan",
    "br": 7,
    "locs": "b f l g m tpsaw\nStronger than a hemp rope ten times as thick",
    "preps": "⅓ Thread USED for [HIDE 3] and [WOUND 3]"
  },
  {
    "name": "갈퀴덩굴 (Goosegrass)",
    "rawName": "Goosegrass",
    "type": "plant",
    "br": 5,
    "locs": "bf l g m t psa w\nMany young beasts like to throw these hairy weeds at each \nother and shout",
    "preps": "⅓ Seeds GROUND and BREWED for [SLEEP 1] ⅓ Shoots BOILED for [HIDE 1] and [PAIN 1]"
  },
  {
    "name": "솔이끼 (Haircap Moss)",
    "rawName": "Haircap Moss",
    "type": "plant",
    "br": 6,
    "locs": "bf l g m t psaw\nA potent cure for loose bladders",
    "preps": "⅓ Barbed Strands BOILED for [FEATHER 2] and [HIDE 1]"
  },
  {
    "name": "가죽 붕대 (Hidelendings)",
    "rawName": "Hidelendings",
    "type": "titan",
    "br": 7,
    "locs": "b f l g m tpsaw\nSticky backed material the colour of a rat",
    "preps": "⅓ Slivers USED for [HIDE 2] and [WOUND 2]."
  },
  {
    "name": "쓴풀/호하운드 (Hoarhound)",
    "rawName": "Hoarhound",
    "type": "plant",
    "br": 6,
    "locs": "b f l gm tpsa w\nEasy to overlook but hard to miss its distinctive scent",
    "preps": "⅔ Leafy Whorls COOKED for [PAIN 2] and [BREATH 3]"
  },
  {
    "name": "꿀벌 (Honeybees)",
    "rawName": "Honeybees",
    "type": "insect",
    "br": 5,
    "locs": "bflgmtpsa w\nHoney bees can be found busily buzzing the whole woods over",
    "preps": "⅓ Pollen ADDED for [STOMACH 1] and [MOOD 2]"
  },
  {
    "name": "마로니에/말밤 (Horse Chestnuts)",
    "rawName": "Horse Chestnuts",
    "type": "plant",
    "br": 4,
    "locs": "b f l g m tpsaw\nThis reagent causes almost as many injuries as it cures",
    "preps": "⅓ Spiky Husks USED for [ELSEWHERE 1] 1 Perfect Conker USED in games for [JOY 2] ⅔ Chustnuts BOILED for [STOMACH 2] COOKED for [FAIR 2]"
  },
  {
    "name": "쇠뜨기 (Horsetails)",
    "rawName": "Horsetails",
    "type": "plant",
    "br": 4,
    "locs": "b f l g m t psaw\nDo NOT try to gather an actual horse",
    "preps": "⅓ Stems BOILED for [WOUND 2] and"
  },
  {
    "name": "철광석 (Iron Ore)",
    "rawName": "Iron Ore",
    "type": "earth",
    "br": 7,
    "locs": "b f l g mtpsaw\nTales passed from parent to cub are often the basis for the \nsoundest of remedies",
    "preps": "⅓ Iron Pebbles BOILED in consumed remedies for"
  },
  {
    "name": "Trinket Ironslug",
    "rawName": "Trinket Ironslug",
    "type": "titan",
    "br": 8,
    "locs": "b f l g m tpsaw\nThis lethargic slug can be squeezed for a surprisingly soft \nand fragrant white cream that soothes even the most \npainful of burns",
    "preps": "⅓ Guts USED for [PAIN 2] and [BURN 3]"
  },
  {
    "name": "라벤더 (Lavender)",
    "rawName": "Lavender",
    "type": "plant",
    "br": 5,
    "locs": "bf l g m t psa w\nSome poultice pounders believe that lavendar is all you \nneed for any ailment",
    "preps": "⅓ Flowers"
  },
  {
    "name": "거머리 (Leech)",
    "rawName": "Leech",
    "type": "insect",
    "br": 5,
    "locs": "b f l g m tpsa w\nPoulticepounders have known for generations the niche uses \nof a leech",
    "preps": "⅔ Leech GROUND into paste"
  },
  {
    "name": "구더기 (Maggots)",
    "rawName": "Maggots",
    "type": "insect",
    "br": 7,
    "locs": "bf l g m t psa w\nThe deepest wounds necessitate the use of maggots to \nclear the dead flesh and promote healing",
    "preps": "⅔ Larvae USED for [INFECTION 3] and [WOUND 3]"
  },
  {
    "name": "금잔화 (Marigold)",
    "rawName": "Marigold",
    "type": "plant",
    "br": 5,
    "locs": "b f l g m t psa w\nThese yellow and orange blooms are a favourite of the Hive \nWardens and their bees for their sweet nectar",
    "preps": "⅓ Nectar ADDED for [FAIR 1] ⅔ Petals USED for [JOY 2]"
  },
  {
    "name": "동의나물 (Marshgold)",
    "rawName": "Marshgold",
    "type": "plant",
    "br": 3,
    "locs": "bfl g m t ps a w\nOne of the prettiest bog flowers around",
    "preps": "⅔ Flower USED for [ELSWHERE 2] ⅓ Petals BREWED for [JOY 2] and [BREATH 2]"
  },
  {
    "name": "마시멜로 (Marshmallow)",
    "rawName": "Marshmallow",
    "type": "plant",
    "br": 6,
    "locs": "b f l g m t psa w\nNot to be confused with the chewy",
    "preps": "⅓ Flower BOILED for [FEATHER 1], [FUR 1] and ⅓ Root Sap COOKED for [STOMACH 3] and [FAIR 1]"
  },
  {
    "name": "꽃버섯 (Meadow Waxcap)",
    "rawName": "Meadow Waxcap",
    "type": "plant",
    "br": 4,
    "locs": "b f l g m tpsaw\nFound wherever sheep graze",
    "preps": "⅓ Shells ADDED for [STOMACH 1] COOKED for [STOMACH 3] and [FAIR 2]"
  },
  {
    "name": "기적의 빵 (Miracle Loaf)",
    "rawName": "Miracle Loaf",
    "type": "titan",
    "br": 11,
    "locs": "b f l g m tpsaw\nEdible cakes wrapped in silver leaf",
    "preps": "⅓ Shells CRUSHED for [FEATHER 3] [FUR 3]"
  },
  {
    "name": "사향 분비물 (Musk Scrapings)",
    "rawName": "Musk Scrapings",
    "type": "titan",
    "br": 10,
    "locs": "bf l g mtpsaw\nAll manner of smells in the most impractical of bottles",
    "preps": "Shanelle #4 USED for [JOY 3]. Floral undertones. FILTHY USED for [BREATH 3]. Pungently minty. Marmalade USED for [SENSES 3]. Disgustingly bitter. Cabana Boi USED for [ELSEWHERE 3]. Sweet and Sappho USED for [MOOD 3] and [NERVES 3]."
  },
  {
    "name": "쐐기풀 (Nettles)",
    "rawName": "Nettles",
    "type": "plant",
    "br": 2,
    "locs": "bflgmtpsaw\nAs common as the dirt between your toes",
    "preps": "⅓ Leaves BREWED for [INFECTION 1] & [PAIN 1] ⅓ Stems CHEWED for [STOMACH 2]"
  },
  {
    "name": "까마중 (Nightshade)",
    "rawName": "Nightshade",
    "type": "plant",
    "br": 6,
    "locs": "b f l gm t psa w\nIts berries are black as death",
    "preps": "⅓ Berries GROUND and BREWED for [SENSES 3]"
  },
  {
    "name": "참나무 (Oak)",
    "rawName": "Oak",
    "type": "plant",
    "br": 4,
    "locs": "bf l gmtpsaw\nMightiest of all the trees",
    "preps": "⅓ Catkins USED for [JOY 1]. ⅓ Acorns GROUND and COOKED for [FAIR 2]. ⅔ Bark GROUND AND BOILED for [POISON 3] 1 Branch USED to bind broken bones for"
  },
  {
    "name": "오렌지껍질버섯 (Orange Peel Fungus)",
    "rawName": "Orange Peel Fungus",
    "type": "plant",
    "br": 3,
    "locs": "b f l gmt psa w\nTraditionally served after a beast has gone Elsewhere",
    "preps": "⅓ “Petals” USED for [JOY 1] or [ELSEWHERE 1]"
  },
  {
    "name": "진주 (Pearls)",
    "rawName": "Pearls",
    "type": "earth",
    "br": 8,
    "locs": "b f l g m t psaw\nRare and beautiful",
    "preps": "⅓ Pearl USED for [ELSEWHERE 3] or [JOY 2]"
  },
  {
    "name": "만병통치 알약 (Pox-Be-Gones)",
    "rawName": "Pox-Be-Gones",
    "type": "titan",
    "br": 10,
    "locs": "b f l g m tpsaw\nBitter and easy to get caught in the throat these little white \ncircles are great for dealing with all manner of sicknesses \nbut getting anybeast to swallow them is a trial in itself",
    "preps": "⅓ Bitterbones CRUSHED for [INFECTION 3] and ⅔ Purgedew ADDED for [INFECTION 1] and"
  },
  {
    "name": "빨간 수액 (Redsap)",
    "rawName": "Redsap",
    "type": "titan",
    "br": 8,
    "locs": "b f l g m tpsaw\nRumour has it that all the good tasting Redsap was drunk \ncenturies ago",
    "preps": "1 Bottled Sap ADDED for [PAIN 3] [BREATH 3] but"
  },
  {
    "name": "루바브 (Rhubarb)",
    "rawName": "Rhubarb",
    "type": "plant",
    "br": 2,
    "locs": "bf l gm t psa w\nA horrifically astringent and bitter weed that plagues many \na mountain side",
    "preps": "⅓ Stems CHEWED for [FOUL 2] COOKED for [FAIR 2] ⅓ Fibres CHEWED and washed for binding"
  },
  {
    "name": "창질경이 (Ribwort)",
    "rawName": "Ribwort",
    "type": "plant",
    "br": 5,
    "locs": "bf l g m tpsaw\nSometimes called Migrator",
    "preps": "⅓ Seed pods CRUSHED for [FAIR 1] ⅓ Leaves"
  },
  {
    "name": "강민트 (Rivermint)",
    "rawName": "Rivermint",
    "type": "plant",
    "br": 6,
    "locs": "b f l g m t psaw\nA delicate",
    "preps": "⅓ Leaves GROUND and APPLIED for BREWED for [BREATH 2] ⅓ Stems CHEWED for [PAIN 1]"
  },
  {
    "name": "암염 (Rock Salt)",
    "rawName": "Rock Salt",
    "type": "earth",
    "br": 7,
    "locs": "b f l g m t psaw\nTreasured and protected by Philosopher Goats",
    "preps": "⅔ Salt USED for [INFECTION 2] and [WOUND"
  },
  {
    "name": "장미 (Roses)",
    "rawName": "Roses",
    "type": "plant",
    "br": 8,
    "locs": "bf l g m tpsa w\nWere it known by any other name",
    "preps": "⅓ Petals USED for [JOY 1] ⅓ Rosehips"
  },
  {
    "name": "조개껍데기 (Shells)",
    "rawName": "Shells",
    "type": "animal",
    "br": 4,
    "locs": "b f l g m t psaw\nTheir smooth flat interiors make them prized by beasts who \nmix pigments",
    "preps": "⅔ Shells When Bartering, swap this shell for the"
  },
  {
    "name": "은광석 (Silver Ore)",
    "rawName": "Silver Ore",
    "type": "earth",
    "br": 11,
    "locs": "b f l g m t psaw\nPrized for its flexible softness",
    "preps": "⅓ Silver Shards GROUND and APPLIED under bandages"
  },
  {
    "name": "민달팽이 (Slugs)",
    "rawName": "Slugs",
    "type": "insect",
    "br": 3,
    "locs": "bflgmtpsa w\nA staple food in the Bristley Woods",
    "preps": "⅔ Slugs COOKED for [FAIR 2]"
  },
  {
    "name": "작은 물고기 (Small Fish)",
    "rawName": "Small Fish",
    "type": "animal",
    "br": 7,
    "locs": "b f l g m t psaw\nIf you put your mind to it",
    "preps": "⅓ Bones USED as a delicate 1 Meat COOKED in consumed ⅓ Scales BOILED for oil and then"
  },
  {
    "name": "신 알약 (Sourchits)",
    "rawName": "Sourchits",
    "type": "titan",
    "br": 10,
    "locs": "b f l g m tpsaw\nA moment",
    "preps": "⅓ Pellets CRUSHED for [PAIN 3], but causes"
  },
  {
    "name": "거미 (Spiders)",
    "rawName": "Spiders",
    "type": "insect",
    "br": 4,
    "locs": "bf l gmtpsa w\nBearing twice as many legs as the average beast",
    "preps": "⅓ Captured Flies ADDED for [FAIR 1] ⅓ Websilk USED for [WOUND 1]"
  },
  {
    "name": "딸기 (Strawberries)",
    "rawName": "Strawberries",
    "type": "plant",
    "br": 4,
    "locs": "bf l g m t psa w\nThe locations of particularly good strawberry patches are \nsecrets passed down from parent to pup",
    "preps": "⅔ Berries USED for [FAIR 2] or COOKED for [FAIR 4] ⅓ Flowers BREWED or APPLIED for [JOY 2] ⅓ Leaves CRUSHED for [HIDE 1]"
  },
  {
    "name": "쑥국화 (Tansies)",
    "rawName": "Tansies",
    "type": "plant",
    "br": 5,
    "locs": "b flgm t psa w\nAn aromatic flower that favours the verges of regions",
    "preps": "⅓ Leaves DIGESTED for [PARASITE 3] and ⅔ Stems BREWED for [INSTINCT 1]"
  },
  {
    "name": "엉겅퀴 (Thistles)",
    "rawName": "Thistles",
    "type": "plant",
    "br": 3,
    "locs": "bflgmtpsaw\nThe Titans had an affinity for these pretty prickly plants",
    "preps": "⅓ Spike Head APPLIED for [FUR 2] ⅓ Nectar ADDED for [MOOD 1]"
  },
  {
    "name": "거대 수영 (Titansorrel)",
    "rawName": "Titansorrel",
    "type": "plant",
    "br": 6,
    "locs": "b f l gmtpsaw\nTangy and slightly bitter this sorrel makes a tasty addition to \nmany salads",
    "preps": "⅓ Leaves ADDED for [MOOD 1] but adds [FOUL 1] ⅓ Roots COOKED and APPLIED for"
  },
  {
    "name": "두꺼비 (Toads)",
    "rawName": "Toads",
    "type": "animal",
    "br": 7,
    "locs": "b f l g m tpsaw\nWhen stressed",
    "preps": "⅓ Poison ADDED for [SENSES 1] and [FOUL 3]"
  },
  {
    "name": "말벌 (Wasps)",
    "rawName": "Wasps",
    "type": "insect",
    "br": 5,
    "locs": "bflgm tpsa w\nThe defensive cousin of the humble bumble",
    "preps": "⅓ Venom USED for [SENSES 2]"
  },
  {
    "name": "이정표 석회 (Waychalk)",
    "rawName": "Waychalk",
    "type": "titan",
    "br": 10,
    "locs": "b f l g m tpsaw\nDense bricks of pure",
    "preps": "⅓ Chalk USED for [ELSEWHERE 3]"
  },
  {
    "name": "수염 타는 액체 (Whiskerburner)",
    "rawName": "Whiskerburner",
    "type": "titan",
    "br": 9,
    "locs": "b f l g m tpsaw\nAll the brews from the Guild of Grainsoakers couldn",
    "preps": "⅔ Burnjuice"
  },
  {
    "name": "흰버드나무 (White Willow)",
    "rawName": "White Willow",
    "type": "plant",
    "br": 5,
    "locs": "b f l g m t psaw\nSome beasts consider these trees to be guardians of \nthe rivers and lochs",
    "preps": "1 Bark CRUSHED for [INSTINCT 1] ⅔ Catkins BOILED for [PAIN 2]"
  },
  {
    "name": "Can only be Foraged for in Summer Wild Garlic",
    "rawName": "Can only be Foraged for in Summer Wild Garlic",
    "type": "plant",
    "br": 2,
    "locs": "b f l gm t ps a w\nThe fragrant stench of wild garlic turns some parts of the \nBristley Woods into a forager",
    "preps": "⅔ Leaves CHEWED and USED for [FAIR 1] and ⅓ Stems CRUSHED for [BREATH 2]"
  },
  {
    "name": "제비꽃 (Wild Violet)",
    "rawName": "Wild Violet",
    "type": "plant",
    "br": 6,
    "locs": "bflgm t psa w\nThis attractive plant is used as a topical medicine for bug \nbites and as a way to fend off nippy parasites",
    "preps": "⅓ Flowers DIGESTED for [PAIN 1] ⅓ Leaves CHEWED for [SENSES 2]"
  }
],
  travelEncounters: {
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
      "text": ". Eavesdrop - Add Gossip (No Weight) to your bags. When Bartering, you can trade this Gossip to automatically receive your chosen Reagent; however, the Guild loses 1 Reputation. ACE & 2 In Bloom Bless your whiskers, feathers and/or scales! You’ve found something growing at the side of the path! What was it growing in? Why hasn't anybeast noticed it? Greenpaw - Draw a card. Collect a Plant Reagent Part that can be found in the Forest with a Base Value equal to the card’s."
    },
    {
      "page": 78,
      "card": "7 & 8",
      "title": "From Up On High\nBeasts crowd around a Titan \nobject just off the path",
      "text": ". They say it fell out of a tree. Look around the space you are in and choose an object to inject into this scene. How does your Poulticepounder misunderstand its true purpose or function? The Gift of Knowledge - You can draw a Sketch (Weight ⅓) of this mysterious artefact, and add it to your bags. Trade it to the Craftpaws - When in a City, you can trade this Sketch to a Craftpaw representative in exchange for a Local reagent of any value. Trade it to the Knowers - During Downtime, at the end of your Journey, a mysterious magpie will find you. If you give this Sketch to them, they will reward you with 5 trinkets, or a Tool of your choice."
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
      "text": ". How did the beast get there, and why did they need to cross the water? Rescue! - Mark 1 Day and change the end of your move to the nearest non-Loch Location. Gain 1 Reputation. Lessons should be learned - This beast needs to learn not to bite off (or swim into) more than they can chew."
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
      "text": ". Their captain points a sword at you and demands to know your business, and if \"ye wish to be sunk to Nessie's Locker\" What is the Captain's name? What does their boat look like? Do the crew have a uniform? Parley - One of the crew is ill and they demand your help. Instead of Helping a Local Beast, you are now Helping a Local Pirate; if you would earn Reputation from this Ailment, instead gain Trinkets. If you fail to create a Remedy, you are Taken Prisoner. Ship-to-Ship Combat - If you are in a Coracle or adapted Wagon, you can try to fight the Pirates off. Draw a card for yourself (or two if you have a Crossbow) and two for the Pirates. The highest total wins. If you win - You escape to an adjacent Location unharmed. How did you escape? If you lose - You are Taken Prisoner! Taken Prisoner - Your Journey ends here. The pirates capture you and keep you prisoner for the remainder of the Season. What do you learn about them? How do you finally get away?"
    },
    {
      "page": 84,
      "card": "J",
      "title": "Winged  \nMenace\nConfused and near death, \na big wasp has wandered \nout onto the water",
      "text": ". It's taking all its strength just to stay afloat, poor thing. Do you risk saving it? A Second Chance - If you have a Coracle or adapted Wagon, you can scoop it aboard with no issue. Gain a Wasp Companion (page 70)."
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
      "text": ". They describe the last beast you met on a Forage or Travel. What did the apparently dangerous beast do? What city are these guards from? Spill The Beans - You tell them everything they need to know. Is that beast ever caught? If so, what happens to them? Keep Quiet - The guards aren't always right after all. The next time you meet that beast, you can try find out their supposed crime and whether they are innocent or not. Vigiliante - If you draw a Monarch for a Travel Encounter, you cross paths with this beast again. If you think they are guilty, you can try to bring them in. Draw one card for yourself (or two if you have a Crossbow or Weapon) and one for them. Highest card wins. If you win - Start a new Goal with the nearest City as your Destination. Gain 10 Reputation for bringing them in. Journal about why you felt the need to enforce justice. If you lose - They escape, never to be seen by you again. 85"
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
      "text": ". What shape is the parcel, and how is it wrapped? Who is it addressed to, and who is it from? Call out to the Messenger - Gain 1 Reputation. Who is the messenger and how do they react? Deliver the Parcel - Add a 'Parcel' (Weight 1) to your Bags. Choose a Location 4 Paths away for its address. Gain 3 Trinkets if you go to that Location, delivering it. Keep the Parcel - Choose and Gain a Tool or Upgrade from the Almanac, and lose 1 Reputation. ACE & 2 Obstruction Little wagons laden with foods and goods are backed up along the path; it seems a tree has fallen and blocked the road ahead. Beavers have been called to gnaw the path clear, but it'll be a few hours yet before the road is clear again. How are the queuing beasts dealing with the wait? If you have a Wagon - Mark 1 Day on the Calendar as you are stuck in traffic. What other wagons and caravans are ahead and behind you? If you don’t have a Wagon - You easily slip through traffic. With a friendly boost from the beavers, you scramble over the trunk and are on your way. Meadow travel encounters Open skies, bright sunlight, and a wealth of wildflowers await you. Carefully carved out fields grow food for beast settlements. 86"
    },
    {
      "page": 87,
      "card": "9 & 10",
      "title": "Highway Robbery\nA field mouse pup \narmed with a toy sword \nstops you and playfully \ndemands a tithe",
      "text": ". Pay with your pockets - Lose 1 Trinket. How does the mouse pup react to their sudden bounty? Pay with your life - Mark 1 Day on your Calendar. Journal about a mock fight you have with the pup, and how one of you 'slays' the other. Pay with your (short) patience - Storming past the pup, you continue your journey. Lose 1 Reputation."
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
      "text": ". They ask if you can wait so as not to spook their flock. How does this hivewarden distinguish their bees from other colonies? Wait - Mark 1 Day, but gain a Bees (Pollen). Spook Flock - Lose 1 Reputation as you scatter their bees in your haste."
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
      "text": "ò has stopped in this meadow. The great highland cow that carries this pastoral settlement upon its saddle is grazing while rat merchants lower ropes and ladders down its sides for goods and guests. What sounds and smells are there in the little town? If you are too big to enter, how does the cow react to you? How do the merchants show you their wares? Visit - This Location temporarily counts as a Settlement. Your next patient is a citizen of Baile bò. You can request services here when Preparing to Leave, and Barter while resolving Ailment(s)."
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
      "text": ". They appear to be on some sort of adventure! What are their names? What is their quest? What be their favourite colours? Quest! - If you wish, you can abandon your old Journey and start a Quest. This special Journey takes place in the same season, is a distance of 24 Paths away in a random direction, and has an Urgency of Important (9 Days). The goal of this Quest is to put down a vicious and cruel Behemoth. Ailments drawn during this Journey relate to these Questing Beasts. Place a Behemoth Barrow at the destination of this Quest Journey. Fighting the Behemoth - If you arrive at the Barrow in time, Draw a Card, lowering its value by 2 for every Ailment you failed to resolve on your Quest. If the final value is equal to or greater than 7, the Questing Beasts slay the Behemoth! If its final value is lower than 7, the Behemoth is victorious. How do you escape? Too Late - If you are late, the Behemoth has gone to ground. The Questing Beasts thank you for your help, and continue on without you. At the end of this Journey, gain 1 Reputation for each Ailment you successfully resolved. If the Behemoth is slain, gain 10 Trinkets and a Tool of your choice from the creature's hoard. 91"
    },
    {
      "page": 92,
      "card": "9 & 10",
      "title": "Yodelling  \nGorillas\nAround the next bend \nof this mountainside \npath, you hear jovial \nhumming",
      "text": ". Expecting a choir of beasts to make such noise, you are briefly terrified to see a single Behemoth - a massive gorilla! Have you met Bakar before? This friendly gorilla travels the world, trying to understand the mysterious precursors, called Titans, whose civilisation ended as the Beasts' began. Stop for a Tale - Sitting in the warm shade of a rock, Bakar enthusiastically shows you his notebook. Inside are drawings of Titan structures. Mark 1 Day on your Calendar, and add 'Titan Tale' to your bags (No Weight). It can be discarded during Haggling to automatically get a Reagent Part. A Helpful Lift - You delicately ask if you could move past. Bashfully, he gathers his things, and asks where you're headed. Upon reply, he lifts you up a sheer cliff face - \"Here, little one\" his voice rumbles, \"a short cut; my way of apologising!\" Add 1 Day to your Calendar and continue your Journey."
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
      "text": ". A capercaillie is trying his hardest to cross the gap between two mountains. Swoop in to help - You guide the large bird towards a nearby tree, where he can breathlessly perch and recollect himself. He introduces himself (or reintroduces if you've met him before) as Griph, Wanderer Extraordinaire. This elderly bird excitedly tells you about why he was crossing over from the mountain. End your Soar at a Location roughly halfway along your Flightpath. Gain 1 Reputation. Stay out of it - He got himself into this situation, and he only has himself to blame. As you ride the breeze, you look back and see a rug full of glittering specks topple off of the capercaille's back. End your Soar at your chosen destination. Griph's Services as a trader (page 58) are unavailable for the remainder of your Journey."
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
      "text": ". Pushing with all your might, your progress over the ground is hard won. Fight the wind - End your Soar at your chosen destination, but Mark 1 Day for the time lost fighting the elements. Follow the wind - rotate your Flightpath 180 degrees. End your Soar at a location up to twice as far as you originally intended to travel (up to the edge of the map)."
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
      "text": "... it stops? Now that you're looking at it, it's cute, in a way. What insect does this tiny critter look like? What do you name it? What A Wind Up - Gain a Cranky Contraption Companion (page 70)"
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
      "text": ". Perhaps it was their way of preparing for Winter. Whatever the reason, you find a mysteriously preserved (yet tasty) snack. What food is inside? What brand made this tin, and what does the packaging look like? Well Fed - Add 2 to your next Timer. Titan travel encounters These truly gargantuan ruins are abandoned for a reason. Set paw in these places with extreme caution. 98"
    }
  ]
},
  foragingEncounters: {
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
      "text": ". It looks worse for wear but may be worth something to someone. Dig! - You can try to dig out the shining speck. Decrease Timers by 1 and draw a card. If the card’s value is: Equal to or greater than 10 - You manage to pull the item out. Add a Titan Thingamabob (page 65) to your Bags. Less then 10 - Your digging only further buries the object in mud. Eventually, it sinks out of sight and you give up. Bog Foraging Encounters Masses of biting midges, stinking mud and stalking herons separate you from the verdant reagents you need for your patients. 154"
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
      "text": ". What unusual colours does it have on its wings? Befriend It - Use a PLANT Reagent to gain a Butterfly Companion (page 70). Follow It - Draw a card. Gain a Plant Reagent Part with Base Rarity equal to or lower it's value."
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
      "text": "; bellows, hollow tubes, and a massive copper helmet with a glass window. They call themselves a Peatdiver and say they are hunting for treasures beneath the bog. Why haven't they been able to convince anyone to join their boggy expeditions? Assistant - Somebeast needs to pump the bellows of the breathing apparatus so the diver can explore the suffocating muds. You can volunteer; decrease Timers by 2 but gain a Trinket! New Connections - Whether you help or ignore, this fledgling Guild of One won't forget you. Gain 1 Reputation (as they name drop you to their friends). 156"
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
      "text": ". It raises its front legs almost as if greeting you. What is most beautiful about this spider? Dance - You copy its little gestures and the spider seems appeased. Decrease Timers by 1. It follows you around until you Move On. You can permanently befriend it by giving it an INSECT Reagent Part. If you do, gain a Spider Companion (Page 70). Back Away - You don't speak spider and that thing has sharp teeth. It lowers its little legs sadly."
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
      "text": ". Its roar echoes in the distant trees. This place is no longer safe! What fearful whispers follow in this behemoths wake? What is this dreaded bear's name? Mark this Location as a Towering Behemoth Barrow (page 40). Whenever you forage in this or an adjacent location, Monarch results become 'Scurry!' Scurry! - The bear has picked up your scent! You must leave before it finds you. Decrease Timers by 2, and lose either 3 Foraging Points or 1 Reagent Part from your Bags. Appease - You can convince the bear to move on by giving it Reagent Parts that provide a cumulative [Fair 5]. You can do this when you Forage or Travel through this area, and doing so removes the Barrow from the map."
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
      "text": ". What were they doing near the nettles anyway? What kind of beast are they? Mouse, badger, or something in between? Helpful Giant - If you are larger than the young beast, you may simply lift them out, receive their thanks, and be on your way. You're able to clip some samples while you help; add any Part from Stinging Nettles (page ) to your Bags. A Giant Help - If you are smaller than the young beast, how do you help guide them free from the nettles? Gain 1 Reputation; this young beast tells everyone about you when they get home safe. 163"
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
      "text": ". No matter where you go or what you do, it follows you. What type of bug is it? Is there anything unusual about it? The More the Merrier - Gain a Companion (page 70)"
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
      "text": ". It looks like it’s from a settlement nearby. What material is it made from? How do you think it came to be in the water? Gimme! - Add a Shiny Object to your Bags (Weight 11). If you hand it into a Settlement connected to this body of water, gain 2 Reputation and a Trinket. Leave It - If it is really that important, someone else will get it. Continue foraging. Gain 1 Foraging Point. ace Horrors From The Deep Something slithers through the water. Oh stars, what could it be? What monster lurks just underneath the water?! Draw a Card. ♥ or ♦ - A traveller swimming low and slow thuds into your vessel. What are they doing out on the water? How to they respond to bumping into you? ♣ or ♠ - PIKE!! A massive fanged fish will bite you into bloody clumps if you don't get moving! Reduce Timers and Foraging Points by a total of 5 as you backtrack through the water, and hide safely on land."
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
      "text": ". You can't quite shake the feeling of something crawling over you. Tick Check - Decrease Timers by 1 as you check yourself twice over. Risk It - Draw a Card. ♥ or ♦ - You were lucky; no ticks have sunk their nasty little teeth into you. ♣ or ♠ - You develop the Tick Bitten, Twice Shy Ailment (page 113) and must cure it before you Move On, or face the Consequences."
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
      "text": ". What food-scent blows on the wind? Do you have a particular fondness for this food? Follow Your Stomach - Lose two Foraging Points. Draw a Meadow Social Encounter relevant to the season you are in. Complete it, and add Delicious Food (Weight 1) to your bags. It provides [FAIR 4]. The food spoils after you Mark 3 Days on your Calendar. Follow Your Heart - Lose 1 Foraging Point as you are distracted by the hunger."
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
      "text": "(Enhanced Edition) The farmers here have a very unusual way of spreading seeds around the fields. How do they manage it? Do they use a natural feature of their bodies, or a strange contraption? Is it effective? Or just eccentric?"
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
      "text": ". What purpose does it serve? Does it even work? If not, what goes catastrophically wrong? Watch the Unveiling - Reduce Timers by 2. Add a Guild Rumour (No Weight) to your Bags. Bring it to any Settlement to gain 2 Guild Reputation. Keep Your Head Down - Continue with your foraging and leave the inventors to their chaos. 174"
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
      "text": ". Do you help the dazzled bug? Sweet - If you have some Honey or another Fair Reagent, you can nurse the bee to health and gain a Honey Bee Companion (page 70). Rescue - If you don't have any Honey or Fair Reagent, you may carry the bee to safety and gain a Honeybee Companion (page 70) by Decreasing Timers by 4."
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
      "text": ". What sort of beast does it resemble? How does it feel to take bits from someone's work? Take - You may add a piece of Dense Charcoal and Animal Sheddings (Fur) to your Bags. Transplant - You may replace the removed Charcoal or Sheddings with something similar of your own. Gain no Reputation (but you can feel less guilty)."
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
      "text": ". They demand your bag and threaten you with tooth and iron. What fearsome weapons do they wield? Play it Safe - You give them your satchel. Discard everything in your Bags, and lose all your Trinkets. Scrap - You try to fight them off. Draw a card for you and two cards for them. The highest single card wins. You can draw a second card if you have a Crossbow and Bolt. If you win the fight - you chase them off and can take their Weapon (Weight 1). It has the same function as a Crossbow (page 62), but only works against Beasts, not Behemoths. If you lose the fight - they kick, beat and bite you. While you shelter from their attacks, they snatch your Bags. Discard all of your Items (including Tools), and lose all your Trinkets. 179"
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
      "text": ". How sweet! Before you can even introduce yourself, the rest of the flock charge at you to protect it! Scamper! - Run as fast as you can, Down the scree or Up steep slopes. Down the scree - You escape safe and sound, but cannot Forage in this location until you have Moved On. Up the slope - Out of breath (and out of sight), you're safe to keep foraging. Your aching limbs need a break though; decrease Timers by 2. On flitting wings - If you or your Familiar can fly, you dart out of reach of the mountain sheep. Continue Foraging."
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
      "text": "(or perhaps entrepreneurial) beast has rolled up a cart full of cool drinks to a popular rest stop on this side of the mountain, serving all the beasts who are making the trek today. Why do business in such a remote place? Snack Time - Give away one of your Reagents to Increase the Foraging Timer by 1 thanks to your renewed vigour."
    },
    {
      "page": 181,
      "card": "9",
      "title": "Arena of the Mind\nThe thunder crack of \ngoats colliding echoes \ndown past you and as \nyou follow to see its \nsource you discover a \ntrio of goats around a \nnatural salt lick! These \ngoats are arguing over a \nphilosophical principle, \nand are",
      "text": "(quite literally) butting heads over it. Debate the Goats - Decrease Timers by 1, and draw a Card. If it is a ♥, ♦, or ♣ - You invent a reasonable solution to their theoretical problem. Add Rock Salt to your Bags. If it is ♠, the goats are displeased with your theories! They stamp their hooves and scare you off; Lose 2 Foraging Points. Follow in their Hoofsteps - Eventually they tire of bashing, and start to wander the nearby mountainside for fresh ground to stomp around in. In their wake, they leave sheddings! Decrease Timers by 1, and gain 1 Behemoth Bits (Fur). 181"
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
      "text": ". A little plaque says \"take one and fly it if ever you need rescue in these treacherous peaks. Kite - Add a Kite (Weight 1) to your Bags. You may fly it while travelling through Mountain Locations to immediately travel to the nearest Settlement. Doing so while Helping Local Beasts with an Ailment causes you to lose 3 Reputation."
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
      "text": ". Look Around - As you Forage, if you draw a J or M you may, instead of a Reagent, find something with the Titan Symbols written on it. If you do, you may Open The Door. Open The Door - You press the symbols and the lock opens, revealing what lies beyond. Depending on how you've described this Titan Ruin you can either: Gain a Titan Codex (Weight 1); you can trade the Knowers for 20 Trinkets at the end of this Journey. (You don’t have to find them, they'll find you). Establish a Clinic at this Location; choose a new Service to add to the Agenda, even if you don't qualify for it. Titan Foraging Encounters Those that dare scrounge here best beware. Toxins, burning cables, and metal claws await any fool hardy beast who wanders in. 184"
    },
    {
      "page": 185,
      "card": "4",
      "title": "Final Resting Place\nAs you delve deep \ninto this ruin, you \naccidentally cause a wall \nto collapse, revealing \na whole new chamber",
      "text": ". The inside smells of long dried dust, and the massive bones of a strange Behemoth that were interred inside. Wailing Curse - If you choose to enter this new chamber, draw a card. ♥ or ♦ - You scamper through into the eerily silent, dusty chamber. You feel at liberty to explore, and yet also like you're trespassing. ♣ or ♠ - As if you had startled a sleeping wolf, a ear shattering whine begins to fill the air. Dust shivers down from the ceiling. You a forced to flee, unless you have a Titan Thingamabob (which will silence the siren). If you make it into the chamber - amongst the long deceased behemoths you find a crumbling sack of tools far too big for you to use. However, the sack also contains a number of strange devices. Gain either a Cranky Contraption Companion, a Titan Thingamabob, or a Titan Reagent of value 8 or lower."
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
  socialEncounters: {
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
      "text": "\"Come here — you can do it! Follow my voice... there we go... now, through the hoop! Yes, YES! Wait, No!\" You cross paths with a young Hivewarden, in the middle of coaxing a Damselfly to perform a new trick. Wonderful bugs! The hivewarden sees your fleeting interest in the scene, and takes the opportunity to rattle off a number of exciting facts about what wonderful bugs Damselflies are. What do you think of this Hivewarden's enthusiasm? Hatchling. \"Here, it's not so hard. Try holding this one — oh! I think they like you!\" The hivewarden ecclesiastically hands you a delicate Damselfly. It buzzes lazily around your head. If you wish, gain a Damselfly Companion. It has the same function as a Butterfly or a Cricket Companion (page 70)"
    },
    {
      "page": 192,
      "suit": "♣",
      "title": "Essence, in Oil\nThe air around you grows more \nhumid, until you reach a beast \ntending a strange set of copper \ncontainers, some submerged in \nwater, others over small fires",
      "text": ". Explanation - “I'm making perfume! Watch, I boil these iris blossoms here, and their oils extract on the steam... which cools over here... and collects in this glass bottle! It's time consuming, but worth it!\" The perfumer offers to show you more of the process. If you made a perfume, what oils would you use? Demonstration - You help the Perfumer shovel iris blossoms into the boiler, freeing them up to monitor the different apparatus. They're very appreciative of your help! If you stay to keep helping, reduce any active Timers by 1. Gain 'Iris Oil', (Weight ⅓). It can be APPLIED for [NERVES 2]. 192"
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
      "text": ". Forest beasts take advantage of this, connecting different trees together with rope bridges, easily expanding as their population demands. Swinging - A young beast is laughing and hooting as they rock the bridge to and fro. How do you feel about crossing this shifting bridge? Does anyone react to the youngster? New Paths - A recent storm caused the bridge ahead to snap, its two halves now clattering against their respective tree boughs. How often do bridges break in this settlement? How do the locals feel about it? Forest Settlements are threaded through native tree branches, keeping locals off of the ground and away from dangerous behemoths. The beasts that live in these ‘hometrees’ forage for food, gathering berries and mushrooms from the forest floor and nuts and cones from the woods’ trees. Dried goods (like fish and grains) are kept in convenient hollows. Houses made of woven branches and insulated with dry moss are dotted along treetop roads, which are made of multiple branches woven together, connected by rope bridges. Forests 194"
    },
    {
      "page": 195,
      "suit": "♦",
      "title": "Market\nFairwind birds from all over the world \nstop to sell their international wares at \nthe Peddlebough",
      "text": ". Wooden streets circle from forest floor up to canopy tops. Irresistible Bargain - A keen merchant steps out of their stall, exclaiming that you have just the thing they were hoping the find. You can choose to swap one of your non-basic Tools for any other from the Tools list (page 62). Delightful Indulgence - Journal about a new food or luxury you experience. Impulse Purchase - You're tempted by all manner of strange and foreign plant cuttings on display. You can buy a 'Foreign Reagent' for 2 Trinkets (Weight ⅔) It provides [TAG 2]. You decide its Type, Tag, and Preparation Method(s). Journal about this Reagent’s origin."
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
      "text": ". An Opportunity - A lone caterpillar cocoon hangs precariously on a nearby branch, where wind or rain would easily dash them away. A Snack! Chomp down on the convenient treat. Increase your Speed by 1 for your next move. A Friend! Add a ‘Cocoon’ (Weight ⅓) to your Bags. After you have travelled 10 Paths, or ended a Journey, it hatches into a Butterfly Companion (page 70). Place a Bet - Nearby, a race is about to finish. There's time for you to place a bet on one of four caterpillars as they close the gaps on their cocoons. Choose a Suit (e.g ♥) and place a bet of 1, 2 or 4 Trinkets. Draw from the Deck, placing the first of each suit drawn into 1st, 2nd, 3rd and 4th place. If your chosen Suit came 1st, double your bet; 2nd, make your bet back; 3rd or 4th, lose your bet."
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
      "text": ". Their large domed structures fits all sizes, and snow is thrown on the open log fire to create a warm humid interior. Hauling the Winter Log - A tree is felled, stripped, and burned slowly all winter to heat the sauna. Its ashes are collected for soaps, exfoliants, and as a rich fertiliser. Journal about helping the local beasts haul more of the winter log into the Sauna. Add a Burned Wood (Ash) Reagent to your Bags. Easing Aching Muscles - Sit a spell in the steamy sauna, and perform some much needed stretching. Who else is sitting in the sauna with you?"
    },
    {
      "page": 197,
      "suit": "♠",
      "title": "Tall Tales\nA lack of foliage causes most \nforest beasts to stay close to \nhome during the winter",
      "text": ". They play a tree-wide game called 'Tall Tale' where one beast starts a story at the base of their settlement's tree, and it is retold (and often changed) up the tree. When it reaches the top, it is shouted for the whole settlement to hear. Seeding a Story - Journal about a story you start at the base of this tree, or one you are told and then pass to someone else. Sharing the News - Journal about being the last to hear the story, and what it was like to shout it from the top of this settlement."
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
      "text": "; these senses overwhelm any beast moving through the dockyard. Beaver Builders - Teeth gnaw and carve logs of wood into prows, masts and every other shape of ship you could imagine. They're easily absorbed in their work, commissioned as often by Guilds as by individual land-bound beasts. What ship do you see being designed? Canteen - Hard working beasts work up a ferocious appetite, and the Canteen (built into an overturned Titan bucket) serves greasy, belly filling food. If you join the fast-moving queue, you can show your Poulticepounder Guild crest and get a bowl full of food. What do you eat? How does it taste? Gain 2 Carry from the hearty food until the end of your Next Move."
    },
    {
      "page": 199,
      "suit": "♦",
      "title": "Nursery\nUp bank and away from the docks are \nthe Pots",
      "text": "; large clay-walled buildings with open roofs. Farmers tend to a nursery of trees - pines, oaks, willows, and other species too. Regrowth - When they're big enough, the Guild of Loggnawers collect the sapplings and plant them out in the land they've cleared. How many beavers does it take to move a single sapling? Mother 'o Fruits - Towering over the Pots is a single, massive apple tree. Wait, no its a pear tree. Hang on... its all sorts of trees! Branches from different species have been grafted onto a single host, so that the tree bears fruit all year long. What fruit is in season right now? Apples, pears, peaches, cherries? Add 'Fruit' (Weight 1) to your Bags. It can be USED/COOKED for [FAIR 2/3]. Far to the north of the Bristley Woods sits Loch Katrine, a languid mirror to the stars. A crew of Beavers dug a river to lower lying bodies of water, and established Newdam. This tiny settlement flourishes with trade from the northern heart of the woods, and is famous for its shipyards and waterside wooden lodges. NewDam 199"
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
      "text": ". Working for a Snack - “I've the muscles for bashing clams, but can't reach this boil on my back. If you help lance it, I'll happily give you some fresh clams! You can stop and help. Decrease any Timers by 1, and add Fresh Clams (Weight ⅔) to your Bags. You can be use them for the equivalent of 3 Trinkets when Bartering, and will go bad when you next Mark a Day on your Calendar."
    },
    {
      "page": 203,
      "suit": "♠",
      "title": "Oak Smoker\nThe rich smell of burning oak and drying \nfish briefly overwhelms your senses",
      "text": ". On the shore not far away, several smoking chests (each with a fish spit inside) are attended to by a dozing local. What fish do the locals catch here? Do you see anything they use to flavour it, such as rock salt or special herbs?"
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
      "text": ". This means many small monuments (most now half forgotten) dot the highs and lows of each town. Work in progress - Ahead, a beast in the middle of making a monument. You can weave a Trinket of your own into the monument; if you do so, gain 1 Reputation. A curious marking - As you wander this settlement, you half trip over an old (but nonetheless intentional) marking. What is the marking made of? What do you think its original purpose was - to commemorate memories, to celebrate life? Or something more mundane? Open rolling hills of wild grasses peppered with mossy stones and thistly flowers dot the Bristley Woods, and to the untrained eye they can appear to be completely uninhabited. These Settlements use natural features as shelter from the elements; they’re built into sturdy gorse bushes, or in hillside barrows reinforced by the roots of old, gnarled trees. Anything exterior can be quickly packed down and hauled to safety, away from fast approaching predators and Behemoths. Meadows 204"
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
      "text": ". The hivewarden explains that two queens were born, causing a leadership challenge! Protect the Queen - The Hivewarden asks if you can take the Queen to a different meadow and let her go. If you agree, gain a Queen Bee (it counts as a Companion). The Queen Bee can be re-homed in a Wild Meadow, Bog or Forest. Release The Queen - When you re-home a Queen Bee, it starts a new hive. Mark the hive's Location on your Map. You and other Poulticepounders may automatically gather Hive (Honey) and Hive (Wax) Reagent Parts in this Location when Foraging. Wish them luck - Sometimes its bee-st not to get involved in the business of other guilds. Lose 1 Reputation."
    },
    {
      "page": 206,
      "suit": "♠",
      "title": "Emergency Care\nA cream coloured tent spotted with \nroad-dust and more than pawful of \nsturdy patches has been erected \ndefiantly in a communal space of this \nsettlement",
      "text": ". The gentle silhouettes of beasts undergoing treatment can be seen inside. Stitcher's Care - The Guild of Stitchers are somewhat cousins to your own Guild. Where you produce poultices, holistic care, and herbal remedies, their goal is to study the bodies of beasts and document their inner workings for use in surgery. How do you feel about the Stitchers? What do you think their place is in beasts' healthcare? Supply and Demand - A stitcher packs a smoking pipe near an open tent flap, clearly exhausted. Spotting you (and your guildcrest), they initiate a friendly (if very work-focused) conversation, talking about the types of patients they've treated. What sort of problems are their patients facing?"
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
      "text": ". The beasts here are industrious and hard working, and almost every hour of the day a new shift of Guildbeasts is either coming or going from a collaborative task. As you walk the cobbled streets, what Guild do you see going about their business? You have the opportunity to hire a Guild Service (page 58), and all Guild Services have a 1 Trinket discount."
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
      "text": ". Inside Spoolkeep, looms operated by teams of mice weave dyed threads into intricate patterns. Stress Relief - Frustrated beasts can take their anger out on a tough stretches of flax. Slapping at the fibres with rods of birch twigs can be both therapeutic and physically exerting. Do you vent some frustrations? Offcuts - Apprentice Flaxflayers often make a great many mistakes; lumpy flax, poorly spun thread, and patchy fabric. These goods are sold at a discount by a chatty pair of elderly mice, close to Spoolkeep's main gates. Do you have a natter with the mice? What gossip have they got to share from their knitting group? If you wish, you can trade 5 Trinkets for a Lumpy Blanket; it has the same properties as a Knitted Blanket (page 64), but is a bit uglier."
    },
    {
      "page": 209,
      "suit": "♦",
      "title": "Thinkers\nFar to the north of Spoolkeep where \nonly eagles would dare to soar live tribes \nof Goats",
      "text": ". These Philosopher-Behemoths debate the laws of the world, meeting at stone circles to bray their arguments. Bleated Wisdom - You pass a massive, freshly-shorn goat in the middle of a massage from a team of rats. What advice might the goat share? Woolworks - Colleges of goats regularly descend from the mountain tops to Spoolkeep. In exchange for shearing and cleaning them, citybeasts have a rich supply of oily wool for their own crafts. If you lend a paw washing the trimmings, you can add Behemoth Bits (Shed Fur) to your Bags. In a word, Spoolkeep is an industrious city. Its four districts are divided by ancient Titan walls, a source of continual inspiration for the Guild of Stonestackers. Stone pillars and wooden scaffolds support houses on many different levels, with cranked lifts and staircases chaotically built throughout. In the brick huts outside Spoolkeep’s walls live the farmers and threshers, harvesting flax and spinning it into linen thread for extravagant weaving. Spoolkeep 209"
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
      "text": ". A group of Orebeaters use a massive stone wheel to grind chunks of iron ore into finer rubble. Keen eyed apprentices picks out the rusty-red coloured ore, collecting it into a woven pan. Talents of all sizes - Most beasts imagine the Founding Badgers, who started the Guild many years ago underneath the old roots of Odoak. Nowadays all sorts of beasts work the mined metals, under different sub-orders; copperclaws, silversnouts, pewterpaws, and more. What sorts of beasts do you notice amongst the orebeaters today? How do they use their natural talents to enhance their trade? Storied Swap - Iron pellets are a fine, if niche, medicinal reagent. Approaching the beasts, the master orebeater is willing to give you a few of their precious pellets in exchange for a lesson about their value to the apprentices. If you teach the students a new fact about Iron, you can add Iron (Pellets) to your Bags."
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
      "text": "(possibly familiar) capercaillie looms over two smaller wallaby Hivewardens. They're chatting amicably, exchanging metal gears for jars of thick dark-red honey. A Fresh Face - If you haven't met Griph before, he introduces himself as a travelling merchant and job-doer. His goggles are steamed with condensation. A Reintroduction - If you have met Griph before, the scatterbrained Capercaillie reintroduces himself all the same. Halfway through, he remembers exactly who you are! What stories from the road do you two swap? How did Griph find his way to Glasswall, and where has he come from?"
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
