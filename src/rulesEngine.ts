export const FAMILIAR_BENEFITS = [
  { card: 'A', name: '덤불 마스터 (Brushwise)', desc: '모든 식물(PLANT) 약재 채집 희귀도 -2', mechanic: 'brushwise' },
  { card: '2', name: '따뜻한 약제사 (Helpful)', desc: '모든 질병 치료 시작 타이머 +2시간', mechanic: 'helpful' },
  { card: '3', name: '용감한 동반자 (Brave)', desc: '거수(Behemoth) 태그 조우 시 ♥/♦ 드로우 → 지역 약재(희귀도≤6) 획득', mechanic: 'brave' },
  { card: '4', name: '말동무 (Chatty)', desc: '물꼬 거래(Bartering) 시 목표 희귀도 -2', mechanic: 'chatty' },
  { card: '5', name: '현명한 장사꾼 (Shrewd)', desc: '치료제를 장신구로 교환 시 장신구 +1', mechanic: 'shrewd' },
  { card: '6', name: '힘센 일꾼 (Vigorous)', desc: '가방 소지 한도 +2 (마차 있으면 +4)', mechanic: 'vigorous' },
  { card: '7', name: '인맥왕 (Resourceful)', desc: '특정 약재 1종 선택, 어느 지역에서든 채집 가능 (여정마다 변경 가능)', mechanic: 'resourceful' },
  { card: '8', name: '베테랑 여행자 (Seasoned)', desc: '여행 조우 드로우 시 2장 드로우 후 원하는 카드 선택', mechanic: 'seasoned' },
  { card: '9', name: '예리한 관찰자 (Perceptive)', desc: '각 질병마다 채집 포인트(FP) +2 시작', mechanic: 'perceptive' },
  { card: '10', name: '자유로운 영혼 (Independent)', desc: '질병당 1회, 인접 지역에서 채집 (이벤트/타이머 영향 없음)', mechanic: 'independent' },
  { card: 'J', name: '유적/고분 마스터 (Titanwise)', desc: 'TITAN 약재 희귀도 -2 + 티탄/고분 채집 시 2장 드로우 후 선택', mechanic: 'titanwise' },
  { card: 'M', name: '창의적인 발명가 (Ingenuitive)', desc: '도구(Tool) 1개의 효과를 추가로 보유 (여정마다 선택)', mechanic: 'ingenuitive' },
] as const;

export interface RuleBagItem {
  id: string;
  name: string;
  weight: number;
  type: 'tool' | 'reagent' | 'trinket' | 'item';
  canonicalToolId?: string;
  qty?: number;
  tags?: string;
  preps?: string;
  inBandolier?: boolean;
}

export interface RuleReagent {
  name: string;
  rawName?: string;
  type: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN' | string;
  br: number;
  regions: string[];
  seasons: string[];
  preps?: string;
}

export interface RuleState {
  rulesetId?: string;
  bio: {
    familiarBenefit: string;
    carry?: number;
    speed?: number;
  };
  bag: RuleBagItem[];
  currentRegion: string;
  currentSeason: string;
  currentLocationType?: string;
  reputation: number;
  barterCountThisAilment?: number;
  resourcefulReagent?: string;
  ingenuitiveTool?: string;
  activePassenger?: { roleBenefit?: string; ingenuitiveToolId?: string } | null;
  companions?: Array<{ name: string }>;
  wagonExpansions?: { baseUnit?: boolean; passengerBooth?: boolean } | null;
  wagonState?: { commissioned?: boolean; expansionIds?: string[] } | null;
}

export interface AilmentRequirement {
  alternatives: { tag: string; val: number }[];
  isSpecialBone?: boolean;
}

export const getActiveFamiliarBenefit = (s: RuleState): string =>
  ((s.wagonExpansions?.passengerBooth || s.wagonState?.expansionIds?.includes('passenger-booth')) && s.activePassenger?.roleBenefit)
    ? s.activePassenger.roleBenefit
    : s.bio.familiarBenefit;

export const getActiveFamiliarMechanic = (s: RuleState): string =>
  FAMILIAR_BENEFITS.find(f => f.name === getActiveFamiliarBenefit(s))?.mechanic || '';

export const hasTool = (s: RuleState, toolIdOrName: string): boolean => {
  const target = toolIdOrName.toLowerCase();
  const normalizedTarget = target.replace(/[^a-z0-9]+/g, '');
  const inBag = s.bag.some(item =>
    item.id === toolIdOrName ||
    item.canonicalToolId === toolIdOrName ||
    item.canonicalToolId?.replace(/[^a-z0-9]+/g, '') === normalizedTarget ||
    item.name.toLowerCase().includes(target)
  );
  if (inBag) return true;

  const familiarMechanic = getActiveFamiliarMechanic(s);
  const ingenuitiveTool = s.activePassenger?.ingenuitiveToolId || s.ingenuitiveTool;
  if (familiarMechanic === 'ingenuitive' && ingenuitiveTool) {
    const toolName = ingenuitiveTool.toLowerCase();
    return ingenuitiveTool === toolIdOrName ||
      toolName.replace(/[^a-z0-9]+/g, '') === normalizedTarget ||
      toolName.includes(target);
  }

  return false;
};

export const getStartingForagingPoints = (s: RuleState): number => {
  const familiarBenefit = getActiveFamiliarBenefit(s);
  const familiarMechanic = getActiveFamiliarMechanic(s);
  const perceptiveFp = familiarMechanic === 'perceptive' || familiarBenefit.includes('예리한 관찰자') ? 2 : 0;
  const steelAxeFp = hasTool(s, 'Steel Axe') || hasTool(s, '강철 도끼') ? 3 : 0;
  return perceptiveFp + steelAxeFp;
};

export const parseAilmentRequirements = (tagsStr: string): AilmentRequirement[] => {
  if (!tagsStr) return [];

  let prepared = tagsStr.toUpperCase()
    .replace('MINIMUM FAIR', 'MINIMUM_FAIR')
    .replace('INSTINCTS', 'INSTINCT')
    .replace('PARASITES', 'PARASITE')
    .replace('SCALES', 'SCALE');

  prepared = prepared.replace(/([A-Z_]+)\s+(\d+)\s*(?:및|&|,)\s*(\d+)/g, '$1 $2 및 $1 $3');

  const normalized = prepared
    .replace(/\r?\n/g, ',')
    .replace(/\s*및\s*/g, ',')
    .replace(/\s*&\s*/g, ',');

  const clauses = normalized.split(',').map(s => s.trim()).filter(s => s.length > 0);

  return clauses.map(clause => {
    if (clause.includes('부목') || clause.toUpperCase().includes('BONE') || clause.toUpperCase().includes('SET A BONE')) {
      return { alternatives: [], isSpecialBone: true };
    }

    const parts = clause.split(/\s*또는\s*|\s*OR\s*/i);
    const numbers = clause.match(/\d+/g);
    const defaultVal = numbers ? parseInt(numbers[numbers.length - 1]) : 1;

    const alternatives = parts.map(p => {
      const tagMatch = p.match(/[A-Z_]+/);
      const tag = tagMatch ? tagMatch[0] : '';
      const valMatch = p.match(/\d+/);
      const val = valMatch ? parseInt(valMatch[0]) : defaultVal;
      return { tag, val };
    }).filter(item => item.tag !== '');

    return { alternatives };
  });
};

export const splitReagentPreparations = (preps: string) => {
  let parts = (preps || '').split('\n').map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length <= 1) {
    parts = (preps || '').split(/(?=⅓|⅔|1\s|🟢)/).map(p => p.trim()).filter(p => p.length > 0);
  }
  return parts.length > 0 ? parts : ['unprepared specimen'];
};

export const createPreparedReagentItem = <T extends RuleBagItem = RuleBagItem>(r: RuleReagent, partText: string, idPrefix: string): T => ({
  id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  name: `${r.name} (${partText.trim()})`,
  weight: 1/3,
  type: 'reagent',
  qty: 1,
  tags: partText.trim(),
  preps: r.preps || ''
}) as T;
