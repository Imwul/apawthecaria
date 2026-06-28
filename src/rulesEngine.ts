export const RULEBOOK_REFS = {
  familiarBenefits: 'p.14-15',
  foragingPickup: 'p.17',
  journeySetup: 'p.19-21',
  earningYourKeep: 'p.25',
  bartering: 'p.34',
  remedy: 'p.36',
  scrounging: 'p.37'
} as const;

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

export type RuleSeverity = 'lesser' | 'intermediate' | 'severe' | 'dire' | string;

export interface RuleBagItem {
  id: string;
  name: string;
  weight: number;
  type: 'tool' | 'reagent' | 'trinket' | 'item';
  qty?: number;
  tags?: string;
  preps?: string;
  inBandolier?: boolean;
}

export interface RuleAilment {
  name?: string;
  severity: RuleSeverity;
  timer: number;
  tags: string;
  consequence?: string;
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
  activePassenger?: { roleBenefit?: string } | null;
  companions?: Array<{ name: string }>;
  wagonExpansions?: { baseUnit?: boolean; passengerBooth?: boolean } | null;
}

export interface AilmentRequirement {
  alternatives: { tag: string; val: number }[];
  isSpecialBone?: boolean;
}

export interface ConcoctionValidation {
  isComplete: boolean;
  totalFair: number;
  totalFoul: number;
  missingRequirements: string[];
  statusText: string;
  providedEffects: Record<string, number>;
  ruleRef: string;
}

export interface ConcoctionPreview {
  validation: ConcoctionValidation;
  timeSpent: number;
  nextTimer: number;
  timedOut: boolean;
  severityLevel: number;
  reputationLoss: number;
  ruleRef: string;
}

export interface PatientTimerPreview {
  hoursSpent: number;
  nextTimer: number;
  timedOut: boolean;
  reputationLoss: number;
  ruleRef: string;
}

export interface RemedyRewardPreview {
  severityLevel: number;
  reputationGain: number;
  baseTrinkets: number;
  actualTrinkets: number;
  actualReputation: number;
  fairFoulNet: number;
  fairFoulAdjustment: number;
  ruleRef: string;
}

export const getSeverityLevel = (severity: RuleSeverity): number => {
  if (severity === 'dire') return 4;
  if (severity === 'severe') return 3;
  if (severity === 'intermediate') return 2;
  return 1;
};

export const getActiveFamiliarBenefit = (s: RuleState): string =>
  (s.wagonExpansions?.passengerBooth && s.activePassenger?.roleBenefit)
    ? s.activePassenger.roleBenefit
    : s.bio.familiarBenefit;

export const getActiveFamiliarMechanic = (s: RuleState): string =>
  FAMILIAR_BENEFITS.find(f => f.name === getActiveFamiliarBenefit(s))?.mechanic || '';

export const hasTool = (s: RuleState, toolIdOrName: string): boolean => {
  const target = toolIdOrName.toLowerCase();
  const inBag = s.bag.some(item =>
    item.id === toolIdOrName ||
    item.name.toLowerCase().includes(target)
  );
  if (inBag) return true;

  const familiarMechanic = getActiveFamiliarMechanic(s);
  if (familiarMechanic === 'ingenuitive' && s.ingenuitiveTool) {
    const toolName = s.ingenuitiveTool.toLowerCase();
    return s.ingenuitiveTool === toolIdOrName || toolName.includes(target);
  }

  return false;
};

export const getFamiliarReduction = (s: RuleState, mechanic: string, defaultVal: number = 2): number => {
  const familiarMechanic = getActiveFamiliarMechanic(s);
  if (familiarMechanic !== mechanic) return 0;
  const trust = s.activePassenger ? 0 : ((s as any).familiarTrust || 0);
  if (trust >= 80) return defaultVal + 2;
  if (trust >= 40) return defaultVal + 1;
  return defaultVal;
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

export const normalizeEffectTag = (tag: string) => tag.toUpperCase()
  .replace('INSTINCTS', 'INSTINCT')
  .replace('PARASITES', 'PARASITE')
  .replace('SCALES', 'SCALE')
  .replace('MINIMUM_FAIR', 'MINIMUM FAIR');

export const reagentEffectText = (item: RuleBagItem) => {
  const explicit = `${item.name || ''} ${item.tags || ''}`;
  if (/\[[A-Z_ ]+\s+\d+\]/i.test(explicit)) return explicit;
  return `${explicit} ${item.preps || ''}`;
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

export const toolEffectItem = <T extends RuleBagItem = RuleBagItem>(tool: RuleBagItem): T | null => {
  const text = `${tool.id} ${tool.name}`.toLowerCase();
  if (text.includes('fairwind') || tool.name.includes('페어윈드')) {
    return { id: `${tool.id}_effect`, name: `${tool.name} 효과`, weight: 0, type: 'reagent', tags: '[FAIR 1]', preps: '[FAIR 1]' } as T;
  }
  if (text.includes('comb') || tool.name.includes('참빗')) {
    return { id: `${tool.id}_effect`, name: `${tool.name} 효과`, weight: 0, type: 'reagent', tags: '[FUR 3] [PARASITE 1]', preps: '[FUR 3] [PARASITE 1]' } as T;
  }
  if (text.includes('cauldron') || tool.name.includes('가마솥')) {
    return { id: `${tool.id}_effect`, name: `${tool.name} 효과`, weight: 0, type: 'reagent', tags: '[PRESERVED 1] [DISTILLED 1]', preps: '[PRESERVED 1] [DISTILLED 1]' } as T;
  }
  if (text.includes('frying') || tool.name.includes('프라이팬')) {
    return { id: `${tool.id}_effect`, name: `${tool.name} 효과`, weight: 0, type: 'reagent', tags: '[COOKED 1]', preps: '[COOKED 1]' } as T;
  }
  if (text.includes('double boiler') || tool.name.includes('이중 가마솥')) {
    return { id: `${tool.id}_effect`, name: `${tool.name} 효과`, weight: 0, type: 'reagent', tags: '[BOIL 1] [BREW 1]', preps: '[BOIL 1] [BREW 1]' } as T;
  }
  if (text.includes('alembic') || tool.name.includes('증류기')) {
    return { id: `${tool.id}_effect`, name: `${tool.name} 촉매 효과`, weight: 0, type: 'reagent', tags: '[CATALYSE 1]', preps: '[CATALYSE 1]' } as T;
  }
  return null;
};

export const selectedToolEffectItems = <T extends RuleBagItem = RuleBagItem>(bag: T[], selectedToolIds: string[]) =>
  bag
    .filter(item => selectedToolIds.includes(item.id))
    .map(toolEffectItem<T>)
    .filter(Boolean) as T[];

export const validateConcoction = (
  ailment: RuleAilment | null,
  selectedReagents: RuleBagItem[],
  bag: RuleBagItem[],
  _s: RuleState,
  purifyFoul: boolean = false
): ConcoctionValidation => {
  if (!ailment) {
    return {
      isComplete: false,
      totalFair: 0,
      totalFoul: 0,
      missingRequirements: [],
      statusText: '환자 없음',
      providedEffects: {},
      ruleRef: RULEBOOK_REFS.remedy
    };
  }

  const providedEffects: Record<string, number> = {};
  const regularEffects: Array<{ tag: string; val: number; itemId: string; used: boolean }> = [];
  let totalFair = 0;
  let totalFoul = 0;
  let hasCatalyse = false;

  selectedReagents.forEach(item => {
    if (!item.name && !item.preps) return;
    const regex = /\[([A-Z_]+)\s+(\d+)\]/g;
    let match;
    const effectText = reagentEffectText(item);
    if (/alembic|증류기|catalyse/i.test(`${item.id} ${item.name} ${effectText}`)) {
      hasCatalyse = true;
    }
    while ((match = regex.exec(effectText)) !== null) {
      const tag = normalizeEffectTag(match[1]);
      const val = parseInt(match[2]);

      if (tag === 'FAIR') {
        totalFair += val;
        providedEffects[tag] = (providedEffects[tag] || 0) + val;
      } else if (tag === 'FOUL') {
        totalFoul += val;
        providedEffects[tag] = (providedEffects[tag] || 0) + val;
      } else if (tag !== 'CATALYSE') {
        regularEffects.push({ tag, val, itemId: item.id, used: false });
      }
    }
  });

  if (purifyFoul) {
    totalFoul = 0;
    providedEffects.FOUL = 0;
  }

  const regularTags = Array.from(new Set(regularEffects.map(effect => effect.tag)));
  regularTags.forEach(tag => {
    const effects = regularEffects.filter(effect => effect.tag === tag);
    let best = effects.reduce((max, effect) => Math.max(max, effect.val), 0);
    if (hasCatalyse) {
      effects.forEach((effect, idx) => {
        effects.slice(idx + 1).forEach(other => {
          if (effect.itemId !== other.itemId) {
            best = Math.max(best, effect.val + other.val);
          }
        });
      });
    }
    providedEffects[tag] = best;
  });

  const claimRegularEffect = (tag: string, val: number): boolean => {
    const single = regularEffects
      .filter(effect => !effect.used && effect.tag === tag && effect.val >= val)
      .sort((a, b) => a.val - b.val)[0];
    if (single) {
      single.used = true;
      return true;
    }

    if (!hasCatalyse) return false;

    const candidates = regularEffects
      .filter(effect => !effect.used && effect.tag === tag)
      .sort((a, b) => a.val - b.val);

    for (let i = 0; i < candidates.length; i += 1) {
      for (let j = i + 1; j < candidates.length; j += 1) {
        if (candidates[i].itemId !== candidates[j].itemId && candidates[i].val + candidates[j].val >= val) {
          candidates[i].used = true;
          candidates[j].used = true;
          return true;
        }
      }
    }

    return false;
  };

  const reqs = parseAilmentRequirements(ailment.tags);
  const missingRequirements: string[] = [];

  reqs.forEach(req => {
    if (req.isSpecialBone) {
      const hasBoneSetter = [...selectedReagents, ...bag].some(item => {
        const nameLower = reagentEffectText(item).toLowerCase();
        return nameLower.includes('oak') ||
          nameLower.includes('가지') ||
          nameLower.includes('splint') ||
          nameLower.includes('부목') ||
          nameLower.includes('bandage') ||
          nameLower.includes('붕대');
      });
      if (!hasBoneSetter) {
        missingRequirements.push('부목용 약재 (Oak Branch or Splint/Bandage)');
      }
      return;
    }

    const satisfied = req.alternatives.some(alt => {
      if (alt.tag === 'MINIMUM_FAIR') return totalFair >= alt.val;
      return claimRegularEffect(alt.tag, alt.val);
    });

    if (!satisfied) {
      const reqStr = req.alternatives.map(alt => `${alt.tag} ${alt.val}`).join(' 또는 ');
      missingRequirements.push(reqStr);
    }
  });

  const isComplete = missingRequirements.length === 0;
  let statusText = '불완전 Remedy';
  if (isComplete) {
    statusText = purifyFoul ? '정화된 Remedy' : totalFoul > 0 ? 'Foul Remedy' : 'Fair Remedy';
  }

  return {
    isComplete,
    totalFair,
    totalFoul,
    missingRequirements,
    statusText,
    providedEffects,
    ruleRef: RULEBOOK_REFS.remedy
  };
};

export const previewPatientTimer = (ailment: RuleAilment, hoursSpent: number): PatientTimerPreview => {
  const nextTimer = Math.max(0, ailment.timer - hoursSpent);
  const timedOut = nextTimer === 0;

  return {
    hoursSpent,
    nextTimer,
    timedOut,
    reputationLoss: timedOut ? getSeverityLevel(ailment.severity) : 0,
    ruleRef: RULEBOOK_REFS.remedy
  };
};

export const previewConcoction = (
  ailment: RuleAilment,
  selectedReagents: RuleBagItem[],
  bag: RuleBagItem[],
  s: RuleState,
  purifyFoul: boolean,
  selectedIngredientCount: number
): ConcoctionPreview => {
  const validation = validateConcoction(ailment, selectedReagents, bag, s, purifyFoul);
  const timer = previewPatientTimer(ailment, selectedIngredientCount);
  const severityLevel = getSeverityLevel(ailment.severity);

  return {
    validation,
    timeSpent: selectedIngredientCount,
    nextTimer: timer.nextTimer,
    timedOut: timer.timedOut,
    severityLevel,
    reputationLoss: severityLevel,
    ruleRef: RULEBOOK_REFS.remedy
  };
};

export const calculateRemedyRewards = ({
  severity,
  fair,
  foul,
  gifting,
  shrewdBonus = 0
}: {
  severity: RuleSeverity;
  fair: number;
  foul: number;
  gifting: boolean;
  shrewdBonus?: number;
}): RemedyRewardPreview => {
  const severityLevel = getSeverityLevel(severity);
  const fairFoulNet = fair - foul;
  const fairFoulAdjustment = fairFoulNet >= 0
    ? Math.floor(fairFoulNet / 2)
    : -Math.floor(Math.abs(fairFoulNet) / 2);
  const baseTrinkets = Math.max(0, severityLevel + fairFoulAdjustment);
  const reputationGain = severityLevel;

  return {
    severityLevel,
    reputationGain,
    baseTrinkets,
    actualTrinkets: gifting ? 0 : baseTrinkets + shrewdBonus,
    actualReputation: reputationGain + (gifting ? 2 : 0),
    fairFoulNet,
    fairFoulAdjustment,
    ruleRef: RULEBOOK_REFS.remedy
  };
};

export const calculateForageRarity = (s: RuleState, r: RuleReagent, regionName: string = s.currentRegion): number => {
  const isInSeason = r.seasons.includes(s.currentSeason);
  const isLocal = r.regions.includes(regionName) || (s.resourcefulReagent && r.name === s.resourcefulReagent);
  const baseRarity = r.br + (isLocal ? 0 : 3) + (isInSeason ? 0 : 3);
  let finalRarity = baseRarity;

  if (r.type === 'PLANT') {
    finalRarity = Math.max(1, finalRarity - getFamiliarReduction(s, 'brushwise'));
    const hasButterfly = (s.companions || []).some(comp => comp.name === 'butterfly');
    if (hasButterfly && (s.currentSeason === 'Spring' || s.currentSeason === 'Summer')) {
      finalRarity = Math.max(1, finalRarity - 1);
    }
  }

  if (r.type === 'TITAN') {
    finalRarity = Math.max(1, finalRarity - getFamiliarReduction(s, 'titanwise'));
  }

  if (regionName === 'Loch' && (hasTool(s, 'tool_coracle') || hasTool(s, 'coracle') || hasTool(s, '자작나무 보트'))) {
    finalRarity = Math.max(1, finalRarity - 2);
  }

  const isSmallFish = String(r.rawName || r.name).toLowerCase().includes('small fish');
  if ((r.type === 'INSECT' || isSmallFish) && (hasTool(s, 'tool_spidersilk_net') || hasTool(s, 'spidersilk') || hasTool(s, '거미줄'))) {
    finalRarity = Math.max(1, finalRarity - 3);
  }

  if (r.type === 'INSECT' && (s.companions || []).some(comp => comp.name === 'spider')) {
    finalRarity = Math.max(1, finalRarity - 1);
  }

  return finalRarity;
};

export const calculateBarterRarity = (s: RuleState, r: RuleReagent, isCity: boolean): number => {
  let finalRarity = r.br;
  const isLocal = r.regions.includes(s.currentRegion);
  const isInSeason = r.seasons.includes(s.currentSeason);
  const preps = r.preps || '';

  if (isLocal) {
    finalRarity -= 2;
  } else if (isCity) {
    finalRarity -= 2;
  }

  if (isInSeason) {
    finalRarity -= 1;
  } else if (!isLocal && !isCity) {
    finalRarity += 2;
  }

  if (/\[FAIR\s+\d+\]/i.test(preps)) {
    finalRarity += 3;
  }

  if (/\[[A-Z_]+\s+3\]/i.test(preps)) {
    finalRarity += 5;
  }

  const foulMatches = [...preps.matchAll(/\[FOUL\s+(\d+)\]/gi)];
  const foulPenalty = foulMatches.reduce((sum, match) => sum + (parseInt(match[1]) || 0), 0);
  finalRarity += foulPenalty;

  if (s.reputation >= 35) finalRarity -= 2;
  else if (s.reputation >= 25) finalRarity -= 1;
  else if (s.reputation < 15) finalRarity += 1;

  const familiarBenefit = getActiveFamiliarBenefit(s);
  const familiarMechanic = getActiveFamiliarMechanic(s);
  if (familiarMechanic === 'chatty' || familiarBenefit.includes('말동무')) {
    finalRarity -= getFamiliarReduction(s, 'chatty');
  }

  return Math.max(1, finalRarity);
};

export const getBarterLimitForLocation = (locationType: string) => {
  if (locationType === 'City') return 3;
  if (locationType === 'Settlement') return 1;
  return 0;
};

export const validateBarterAttempt = (s: RuleState, r: RuleReagent) => {
  if (r.type === 'TITAN') {
    return {
      allowed: false,
      reason: '룰북 p.34 기준으로 물꼬 거래 대상은 비-티탄(non-Titan) 영약재입니다. 티탄 영약재는 채집/유적/특수 서비스로 획득해야 합니다.',
      ruleRef: RULEBOOK_REFS.bartering
    };
  }

  const maxBarters = getBarterLimitForLocation(s.currentLocationType || '');
  if (maxBarters === 0) {
    return {
      allowed: false,
      reason: '물꼬 거래는 정착지(Settlement)나 도시(City)에서만 가능합니다.',
      ruleRef: RULEBOOK_REFS.bartering
    };
  }

  const usedBarters = s.barterCountThisAilment || 0;
  if (usedBarters >= maxBarters) {
    return {
      allowed: false,
      reason: `거래 횟수 초과!\n${s.currentLocationType === 'City' ? '도시(City): 최대 3회' : '정착지(Settlement): 최대 1회'} 거래 가능합니다.\n이미 ${usedBarters}회 사용했습니다.`,
      maxBarters,
      usedBarters,
      ruleRef: RULEBOOK_REFS.bartering
    };
  }

  const isCity = s.currentLocationType === 'City';
  return {
    allowed: true,
    maxBarters,
    usedBarters,
    isCity,
    finalRarity: calculateBarterRarity(s, r, isCity),
    ruleRef: RULEBOOK_REFS.bartering
  };
};
