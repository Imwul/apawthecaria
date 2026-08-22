const preparationNames: Record<string, string> = {
  Acorns: '도토리',
  Ash: '재',
  'Barbed Strands': '가시 가닥',
  Bark: '나무껍질',
  Berries: '열매',
  Bones: '뼈',
  'Bottled Sap': '병에 담은 수액',
  Branch: '가지',
  Burrs: '가시열매',
  Cap: '버섯갓',
  'Captured Flies': '포획한 파리',
  Catkins: '꽃차례',
  Chalk: '분필',
  Charcoal: '숯',
  Cherries: '체리',
  Chestnuts: '밤',
  Clay: '점토',
  'Egg Shell': '알 껍데기',
  FILTHY: '불결한 물질',
  Feathers: '깃털',
  Fibres: '섬유',
  Flesh: '살점',
  Flower: '꽃',
  Flowers: '꽃',
  Fruit: '과일',
  Fur: '털',
  Gizzard: '모래주머니',
  Grit: '굵은 모래',
  Guano: '구아노',
  Guts: '내장',
  Hair: '털',
  Honey: '꿀',
  'Iron Pebbles': '철 자갈',
  Larvae: '유충',
  'Leafy Whorls': '잎 돌려나기',
  Leaves: '잎',
  Leech: '거머리',
  'Living Butterfly': '살아 있는 나비',
  Marrow: '골수',
  Meat: '고기',
  Membranes: '막',
  Mushroom: '버섯',
  Musk: '사향',
  Nectar: '꽃꿀',
  Nuts: '견과',
  Pearl: '진주',
  Pellets: '환약',
  Petals: '꽃잎',
  Poison: '독',
  Pollen: '꽃가루',
  'Root Sap': '뿌리 수액',
  Roots: '뿌리',
  Rosehips: '장미 열매',
  'Royal Jelly': '로열젤리',
  Salt: '소금',
  Sand: '모래',
  Scales: '비늘',
  'Seed Pods': '씨앗 꼬투리',
  Seeds: '씨앗',
  Shells: '껍질',
  Shoots: '새순',
  'Silver Shards': '은 조각',
  Skin: '가죽',
  Slime: '점액',
  Slivers: '조각',
  Sloes: '슬로 열매',
  Slugs: '민달팡이',
  'Spike Head': '가시 머리',
  'Spiky Husks': '가시 껍질',
  Spores: '포자',
  Spritzer: '분무액',
  Stems: '줄기',
  Sweat: '땀',
  Thorns: '가시',
  Thread: '실',
  Urine: '소변',
  Venom: '독액',
  Wax: '밀랍',
  Websilk: '거미줄 실'
};

const preparationMethods: Record<string, string> = {
  ADDED: '넣어 사용',
  APPLIED: '발라 사용',
  BARTERED: '물물교환',
  BOILED: '끓임',
  'BOILED IN CONSUMED REMEDIES': '먹는 처방에 끓임',
  'BOILED THEN APPLIED': '끓인 뒤 발라 사용',
  'BOILED THEN USED': '끓인 뒤 사용',
  BREWED: '우려냄',
  CHEWED: '씹음',
  'CHEWED AND USED': '씹어 사용',
  'CHEWED AND WASHED': '씹은 뒤 씻음',
  'CHEWED THEN BREWED': '씹은 뒤 우려냄',
  COOKED: '요리',
  'COOKED AND APPLIED': '요리한 뒤 발라 사용',
  'COOKED IN CONSUMED REMEDIES': '먹는 처방에 요리',
  CRUSHED: '부순',
  'CRUSHED AND APPLIED': '부순 뒤 발라 사용',
  DIGESTED: '소화',
  DISTILLED: '증류',
  GROUND: '갈음',
  'GROUND AND APPLIED': '갈은 뒤 발라 사용',
  'GROUND AND BOILED': '갈은 뒤 끓임',
  'GROUND AND BREWED': '갈은 뒤 우려냄',
  'GROUND AND COOKED': '갈은 뒤 요리',
  'GROUND THEN COOKED': '갈은 뒤 요리',
  USED: '그대로 사용',
  'USED IN CONSUMED REMEDIES': '먹는 처방에 사용'
};

const journeyGoalText: Record<string, string> = {
  'Journal about 3 Encounters with Beasts and/or Behemoths.': '야수 또는 거수와의 조우 3건을 일지에 기록합니다.',
  'Journal about your Familiar 3 or more times.': '길동무에 대해 일지에 3회 이상 기록합니다.',
  'Journal about your 길동무 3 or more times.': '길동무에 대해 일지에 3회 이상 기록합니다.',
  'End the Journey with 5 more Guild Reputation than at its start.': '출발할 때보다 길드 명성을 5 이상 높인 채 여정을 마칩니다.',
  'Journal at 3 Locations of the same Region type.': '같은 지역 유형의 장소 3곳에서 일지를 기록합니다.',
  'Bring a Reagent with WOUND, INFECTION, or SLEEP 3 to the Destination.': 'WOUND, INFECTION 또는 SLEEP 3을 가진 영약재를 목적지까지 가져갑니다.',
  'Gather a Plant Reagent Part from every Region.': '모든 지역에서 식물 영약재 부위를 하나씩 채집합니다.',
  'Resolve 3 or more Ailments requiring SCALE, FEATHER, or FUR.': 'SCALE, FEATHER 또는 FUR가 필요한 질병을 3개 이상 해결합니다.',
  'Bring the starting Evidence to the Destination.': '출발할 때 받은 Evidence를 목적지까지 가져갑니다.',
  'Bring 3 Reagents sharing the same Tag.': '같은 태그를 공유하는 영약재 3개를 가져갑니다.',
  'Journal about one personal conflict 3 or more times.': '하나의 개인적 갈등을 일지에 3회 이상 기록합니다.',
  'Bring a Reagent with ELSEWHERE 2 or more.': 'ELSEWHERE 2 이상을 가진 영약재를 가져갑니다.',
  'Journal in Bog, Forest, Loch, Meadow, and Mountain.': '늪지, 숲, 호수, 초원, 산맥 각 지역에서 일지를 기록합니다.',
  'Three Beast or Behemoth Encounter journal entries': '야수 또는 거수 조우 일지 3건',
  'Three Familiar journal entries': '길동무 일지 3건',
  'Guild Reputation increased by 5': '길드 명성 5 증가',
  'Journal at three Locations in one Region': '한 지역의 장소 3곳에서 일지 기록',
  'WOUND, INFECTION, or SLEEP 3 Part in Bags': '가방에 WOUND, INFECTION 또는 SLEEP 3 부위 보유',
  'Three matching Ailments resolved': '해당 질병 3개 해결',
  'Original unsoaked Evidence, Weight 1': '젖지 않은 초기 Evidence 보유, 무게 1',
  'Three Reagent Parts sharing one Tag': '같은 태그를 공유하는 영약재 부위 3개',
  'Three player-authored conflict journal entries': '플레이어가 작성한 갈등 일지 3건',
  'ELSEWHERE 2 Part in Bags': '가방에 ELSEWHERE 2 부위 보유'
};

const legacyPolishedGoal = (value: string): string => value
  .replace(/Familiar/g, '길동무')
  .replace(/Bartering/g, '물꼬 거래')
  .replace(/Rarity/g, '희귀도')
  .replace(/Trinkets?/g, '장신구')
  .replace(/Reagents?/g, '영약재')
  .replace(/Journey/g, '여정')
  .replace(/Calendar/g, '일정')
  .replace(/Reputation/g, '길드 명성')
  .replace(/Foraging Points?|FP/g, '채집 포인트')
  .replace(/Behemoth/g, '거수');

const characterDescriptors: Record<string, string> = {
  Aquatic: '수생 동물',
  Melodic: '노래하는 조류',
  Burrowing: '땅을 파는 포유류',
  Playful: '장난기 많은 동물',
  Befurred: '풍성한 털을 지닌 포유류',
  Bescaled: '비늘이 있는 파충류',
  Clawed: '날카로운 발톱을 지닌 동물',
  'Sun-loving': '햇볕을 즐기는 동물',
  'Star-dancing': '별빛 아래 활동하는 동물',
  'Mud-dwelling': '진흙에 사는 조류나 양서류',
  Unnoticed: '눈에 잘 띄지 않는 동물',
  Majestic: '위엄 있는 조류나 포유류'
};

const patientPersonalities: Record<string, string> = {
  Witty: '재치 있는', Passionate: '열정적인', Snide: '빈정대는',
  Soft: '부드러운', Stoic: '묵묵한', Cruel: '잔인한',
  Furious: '격노한', Oblivious: '둔감한', Scared: '겁이 많은',
  Joyous: '기쁨에 찬', Depressed: '침울한', Evasive: '회피적인',
  Immaterial: '초연한', Dreamy: '몽상적인', Distracted: '산만한',
  Suspicious: '의심 많은', Curious: '호기심 많은', Secretive: '비밀스러운',
  Loud: '목소리 큰', Disgusting: '불쾌한', Brash: '거침없는',
  Radiant: '빛나는', Generous: '너그러운', Energetic: '활기찬',
  Cool: '냉정한', Calm: '차분한', Collected: '침착한',
  Whelmed: '벅찬', Draining: '기운 빠지게 하는', Killjoy: '흥을 깨는',
  Anxious: '불안한', Skittish: '겁 많은', Jubilant: '환희에 찬',
  Distant: '거리감 있는', Righteous: '정의로운', Rebellious: '반항적인'
};

const travelStyles: Record<string, string> = {
  'Slow and Steady': '천천히 꾸준하게',
  'Rambling and Ready': '방랑하며 든든하게',
  'Fast and Heady': '빠르고 대담하게',
  'Swift and Soaring': '가볍고 신속하게'
};

const reagentTypes: Record<string, string> = {
  PLANT: '식물',
  ANIMAL: '동물',
  INSECT: '곤충',
  EARTH: '흙과 광물',
  MINERAL: '광물',
  TITAN: 'Titan'
};

const treatmentResults: Record<string, string> = {
  pending: '대기 중',
  success: '치료 성공',
  failure: '치료 실패',
  treated: '치료 완료',
  abandoned: '떠나보냄',
  unresolved: '미해결'
};

const severityLabels: Record<string, string> = {
  lesser: '가벼움',
  intermediate: '중간',
  greater: '중함',
  severe: '중증',
  dire: '위급'
};

const behemothClassLabels: Record<string, string> = {
  Towering: '거대한',
  Many: '다수의',
  Violent: '폭력적인',
  Demanding: '까다로운'
};

export const localizePreparationName = (value: string): string => preparationNames[value] || value;
export const localizePreparationMethod = (value: string): string => preparationMethods[value] || value;
export const localizeCharacterDescriptor = (value: string): string => characterDescriptors[value] || value;
export const localizePatientPersonality = (value: string): string => patientPersonalities[value] || value;
export const localizeTravelStyle = (value: string): string => travelStyles[value] || value;
export const localizeCharacterChoiceLabel = (value: string): string => localizeTravelStyle(localizeCharacterDescriptor(value));
export const localizeReagentType = (value: string): string => reagentTypes[value.toUpperCase()] || value;
export const localizeTreatmentResult = (value: string): string => treatmentResults[value.toLowerCase()] || value;
export const localizeSeverityLabel = (value: string): string => severityLabels[value.toLowerCase()] || value;
export const localizeBehemothClass = (value: string | undefined): string =>
  behemothClassLabels[value || ''] || value || '분류 미기록';

export const localizeSavedJourneyText = (value: string): string =>
  value
    .replace(/, Urgency (?=\d+일, 이유:)/g, ', 긴급도 ')
    .split('\n')
    .map(line => {
      const patientTraits = line.match(/^([^·\n]+)\s*·\s*([^\n]+)$/);
      if (!patientTraits) return line;
      const personality = localizePatientPersonality(patientTraits[1].trim());
      const descriptor = localizeCharacterDescriptor(patientTraits[2].trim());
      return personality !== patientTraits[1].trim() || descriptor !== patientTraits[2].trim()
        ? `${personality} · ${descriptor}`
        : line;
    })
    .join('\n');

export const localizeAilmentPresentationText = (value: string): string => value
  .replace(/(?:부목용 약재\s*\(){2,}SOMETHING TO SET A BONE\){2,}/g, '부목용 약재')
  .replace(/\bINSTINCTS\b/g, 'INSTINCT')
  .replace(/\bPARASITES\b/g, 'PARASITE')
  .replace(/\bSCALES\b/g, 'SCALE')
  .replace(/^Include a brightly coloured Plant Reagent\.$/, '밝은 색의 식물 영약재를 포함합니다.')
  .replace(/^Provide ELSEWHERE 3 and 2, plus JOY 3 and 2, as separate listed requirements\.$/, 'ELSEWHERE 3과 2, JOY 3과 2를 각각 별도의 요구치로 충족합니다.')
  .replace(/^Provide something long and sturdy to set the bone, such as Oak \(Branch\), or donate a proper tool\.$/, 'Oak (Branch)처럼 길고 단단한 물건으로 뼈를 고정하거나 알맞은 도구를 내어줍니다.')
  .replace(/^Draw a Lesser or Intermediate ailment, then find the patient as BR 8 in the current or adjacent location\.$/, '가벼운 또는 중간 질병을 뽑은 뒤 현재 또는 인접한 장소에서 기본 희귀도 8로 환자를 찾습니다.')
  .replace(/\bPreparation\b/g, '조제법')
  .replace(/머무는 시간이 초과\(Overstay\)되지는/g, '환대 기간을 넘긴 것으로 처리되지는')
  .replace(/하루를 더 소모\(Mark 1 Day\)/g, '하루를 더 소모')
  .replace(/하루를 소모\(Mark 1 Day\)/g, '하루를 소모')
  .replace(/하늘 택시\(Air Taxi\)/g, '하늘 택시')
  .replace(/반드시 Overstay your Welcome을 적용합니다\./g, '반드시 환대 기간 초과를 적용합니다.')
  .replace(/영구적으로 Unavailable이 됩니다\./g, '영구적으로 채집할 수 없게 됩니다.');

const canonicalToolNamesKo: Record<string, string> = {
  'belt-knife': '벨트 칼',
  'Belt Knife': '벨트 칼',
  'mortar-and-pestle': '나무 절구와 공이',
  'Wooden Mortar and Pestle': '나무 절구와 공이',
  'camp-kettle': '낡은 캠프 주전자',
  'Battered Camp Kettle': '낡은 캠프 주전자',
  teeth: '이빨',
  Jaws: '이빨',
  paws: '앞발/발톱',
  'Paws/Claws': '앞발/발톱',
  'canvas-tent': '가죽 텐트',
  'Canvas Tent': '가죽 텐트',
  'copper-frying-pan': '구리 프라이팬',
  'Copper Frying Pan': '구리 프라이팬',
  'big-iron-cauldron': '철제 가마솥',
  'Big Iron Cauldron': '철제 가마솥',
  'bark-coracle': '자작나무 보트',
  'Bark Coracle': '자작나무 보트',
  'basic-tools-replacement': '기본 도구 교체품',
  'Basic Tools': '기본 도구 교체품',
  crossbow: '석궁',
  Crossbow: '석궁',
  bolts: '석궁 볼트',
  Bolts: '석궁 볼트',
  'greenpaw-bandolier': '그린포 반도리어',
  'Greenpaw Bandolier': '그린포 반도리어',
  'glass-alembic': '유리 증류기',
  'Glass Alembic': '유리 증류기',
  'fine-spidersilk-net': '스파이더실크 그물',
  'Fine Spidersilk Net': '스파이더실크 그물',
  'fairwind-spices': '페어윈드 양념',
  'Fairwind Spices': '페어윈드 양념',
  'fine-toothed-comb': '참빗',
  'Fine-toothed Comb': '참빗',
  'knitting-needles': '뜨개바늘',
  'Knitting Needles': '뜨개바늘',
  instruments: '악기',
  Instruments: '악기',
  'titan-thingamabob': '티탄 장치',
  'Titan Thingamabob': '티탄 장치',
  saddlebags: '안장가방',
  Saddlebags: '안장가방',
  'waxed-satchel': '방수 가방',
  'Waxed Satchel': '방수 가방',
  stilts: '죽마',
  Stilts: '죽마'
};

export const localizeCanonicalToolName = (value: string): string => canonicalToolNamesKo[value] || value;

export const localizeInventoryItemName = (value: string): string => {
  if (value === '기념품 (Memento)') return '기념품';
  const canonicalToolName = localizeCanonicalToolName(value);
  if (canonicalToolName !== value) return canonicalToolName;
  const preparedReagent = value.match(/^(.+?) \(([^,]+),\s*([^)]+)\)$/);
  if (preparedReagent) {
    return `${preparedReagent[1]} (${localizePreparationName(preparedReagent[2].trim())}, ${localizePreparationMethod(preparedReagent[3].trim())})`;
  }
  const singlePreparation = value.match(/^(.+?) \(([^)]+)\)$/);
  if (singlePreparation) return `${singlePreparation[1]} (${localizePreparationName(singlePreparation[2].trim())})`;
  return value.replace(/\(Part:\s*/g, '(부위: ');
};

const ENGLISH_LOCATION_NAMES: Record<string, string> = {
  'starting oak road': 'Odoak',
  'oak road': 'Odoak',
  '오크 길': 'Odoak',
  'bristley woods': 'Bristley Woods',
  '브리슬리 숲': 'Bristley Woods',
  noonhill: 'Noonhill',
  '눈힐': 'Noonhill',
  odoak: 'Odoak',
  '오도악': 'Odoak',
  newdam: 'New Dam',
  'new dam': 'New Dam',
  '뉴댐': 'New Dam',
  vessel: 'Vessel',
  '베셀': 'Vessel',
  summit: 'Summit',
  '서밋': 'Summit',
  spoolkeep: 'Spoolkeep',
  '스풀킵': 'Spoolkeep',
  glasswall: 'Glasswall',
  '글래스월': 'Glasswall'
};

export const localizeLocationName = (value: string | undefined): string => {
  const clean = value?.trim();
  if (!clean) return 'Unknown Location';
  return ENGLISH_LOCATION_NAMES[clean.toLowerCase()] || clean;
};

export const localizeRegionLabel = (value: string | undefined): string => ({
  Bog: '늪지',
  Forest: '숲',
  Loch: '호수',
  Meadow: '초원',
  Mountain: '산맥',
  Soar: '활공',
  Titan: 'Titan 유적'
} as Record<string, string>)[value || ''] || value || '지역 미기록';

export const localizeRegionList = (value: string | undefined): string =>
  value
    ? value.split(',').map(region => localizeRegionLabel(region.trim())).join(', ')
    : '지역 미기록';

export const localizeDirectionLabel = (value: string | undefined): string => ({
  North: '북쪽',
  South: '남쪽',
  East: '동쪽',
  West: '서쪽'
} as Record<string, string>)[value || ''] || value || '방향 미기록';

export const localizeLocationTypeLabel = (value: string | undefined): string => ({
  Barrow: '거수 고분',
  'Behemoth Barrow': '거수 고분',
  City: '도시',
  Clinic: '약제소',
  Ruin: '유적지',
  'Titan Ruin': '티탄 유적',
  Settlement: '정착지',
  Wilds: '야생 구역'
} as Record<string, string>)[value || ''] || value || '장소 미기록';

export const localizeAvailabilityLabel = (value: string | undefined): string => ({
  Any: '모든 장소',
  'Any City': '모든 도시',
  'Any Settlement or City': '모든 정착지와 도시',
  'Bog Settlement': '늪지 정착지',
  'Forest Settlement': '숲 정착지',
  'Loch Settlement': '호수 정착지',
  'Meadow Settlement': '초원 정착지',
  'Mountain Settlements': '산맥 정착지'
} as Record<string, string>)[value || ''] || value || '장소 미기록';

export const localizeSeasonLabel = (value: string | undefined): string => ({
  Spring: '봄',
  Summer: '여름',
  Autumn: '가을',
  Winter: '겨울'
} as Record<string, string>)[value || ''] || value || '계절 미기록';

export const localizeJourneyGoalText = (value: string): string => {
  if (journeyGoalText[value]) return journeyGoalText[value];
  const legacyMatch = Object.entries(journeyGoalText).find(([source]) => legacyPolishedGoal(source) === value);
  if (legacyMatch) return legacyMatch[1];
  const plantRegion = value.match(/^Plant Part gathered in (.+)$/);
  if (plantRegion) return `${plantRegion[1]}에서 식물 영약재 부위 채집`;
  const journalRegion = value.match(/^Journal in (.+)$/);
  if (journalRegion) return `${journalRegion[1]}에서 일지 기록`;
  return value;
};
