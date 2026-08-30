import type { EngineInventoryItem } from './gameplay';
import type { PatientState } from './state';
import type { TravelRegion } from './types';

/**
 * Stable machine-readable conditions emitted by printed Encounter choices.
 *
 * Manual resolution persists `record-condition` actions as
 * `manual:<encounter id>:<condition code>[:<location id>]`.  Keep all parsing
 * here so UI guards do not depend on translated labels or narrative prose.
 */
export const ENCOUNTER_CONDITION_CODES = {
  duchyOfDeerBan: 'duchy-of-deer:forage-and-move-ban',
  startledFish: 'boat-that-rocks:fish-unavailable-until-move',
  lodgeTrade: 'lodge-of-wonders:barter-skip-step-2-once',
  lodgeVisit: 'lodge-of-wonders:encounter-foraging-points-until-move',
  howlSpeedLoss: 'howl:permanent-speed:-1',
  howlCarryLoss: 'howl:permanent-carry:-1',
  titanLight: 'lock-and-key:encounter-foraging-points-until-move',
  titanCameras: 'lock-and-key:encounter-redraw-once-until-move',
  freshClamsSpoil: 'working-for-a-snack:fresh-clams-spoil-next-mark-day',
  fungiPoisoned: 'fungi-founder:speed-halved-mark-days',
  typicalSummer: 'typical-summer:next-move-speed-halved',
  wayfriend: 'wayfriend:next-forest-move-protection',
  freshlyGrilled: 'freshly-grilled:next-ailment-timer:+2',
  frostbitten: 'frostbitten:next-ailment-foraging',
  frostbittenActive: 'frostbitten:active-ailment-foraging',
  hospitality: 'hospitality:next-ailment-foraging-points:4',
  roadtreat: 'roadtreat:next-forage-two-path-adjacent',
  rootingAround: 'rooting-around:no-current-forage-until-move',
  parched: 'parched:next-ailment-timer:-3',
  frigidGusts: 'frigid-gusts:next-ailment-timer:-2',
  dastardsWarning: 'dastards-ahead:settlement-warning',
  hailstorm: 'hailstorm:next-ailment-timer:-2',
  canIt: 'can-it:next-ailment-timer:+2',
  musty: 'musty:mushroom-rarity:-4-until-move',
  rayTracing: 'ray-tracing:forage-points:+1-until-move',
  chilledToBone: 'chilled-to-the-bone:mountain-forage-timer',
  marshWader: 'marsh-wader:next-ailment-foraging-points:+5',
  boatmakers: 'boatmakers:next-move-carry:+2',
  refreshingDip: 'panning:next-move-speed:+2'
} as const;

/** p.170 Fabled Behemoth's Row result is emitted by the typed forage
 * transaction dispatcher. It is intentionally not a `manual:` token: the
 * source transaction already validated the exact printed branch. */
export const FABLED_BEHEMOTH_MUST_MOVE_CONDITION = 'foraging-loch-m-autumn:must-move';

export const ENCOUNTER_CONDITION_OWNERS = {
  duchyOfDeer: 'foraging-bog-m-autumn',
  boatThatRocks: 'foraging-loch-10-summer',
  lodgeOfWonders: 'foraging-loch-m-winter',
  howl: 'foraging-mountain-10-autumn',
  lockAndKey: 'foraging-titan-6',
  workingForSnack: 'social-loch-autumn-♣',
  fungiFounder: 'travel-bog-j-autumn',
  typicalSummer: 'travel-forest-9-10-summer',
  wayfriend: 'travel-forest-9-10-autumn',
  freshlyGrilled: 'travel-forest-j-summer',
  frostbitten: 'travel-loch-j-winter',
  hospitality: 'travel-loch-m-winter',
  roadtreat: 'travel-meadow-3-4',
  rootingAround: 'travel-meadow-9-10-summer',
  parched: 'travel-mountain-j-summer',
  frigidGusts: 'travel-mountain-m-winter',
  dastardsAhead: 'travel-mountain-9-10-winter',
  hailstorm: 'travel-soar-m-winter',
  canIt: 'travel-titan-5-6',
  musty: 'foraging-forest-m-autumn',
  rayTracing: 'foraging-mountain-m-spring',
  chilledToBone: 'foraging-mountain-10-winter',
  marshWader: 'social-bog-winter-♠',
  boatmakers: 'social-loch-newdam-♥',
  panning: 'social-mountain-autumn-♣'
} as const;

/** Fresh Clams have a fixed printed Barter value until their one-day expiry. */
export const FRESH_CLAMS_BARTER_VALUE = 3;

export interface PermanentEncounterStatDelta {
  speed: number;
  carry: number;
}

export interface ConsumedEncounterCondition {
  active: boolean;
  conditions: string[];
}

export const storedEncounterCondition = (
  ownerId: string,
  code: string,
  locationId?: string
): string => `manual:${ownerId}:${code}${locationId ? `:${locationId}` : ''}`;

const DUCHY_PREFIX = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.duchyOfDeer,
  ENCOUNTER_CONDITION_CODES.duchyOfDeerBan
);
const FISH_PREFIX = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.boatThatRocks,
  ENCOUNTER_CONDITION_CODES.startledFish
);
const LODGE_TRADE_PREFIX = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.lodgeOfWonders,
  ENCOUNTER_CONDITION_CODES.lodgeTrade
);
const LODGE_VISIT_PREFIX = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.lodgeOfWonders,
  ENCOUNTER_CONDITION_CODES.lodgeVisit
);
const HOWL_SPEED = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.howl,
  ENCOUNTER_CONDITION_CODES.howlSpeedLoss
);
const HOWL_CARRY = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.howl,
  ENCOUNTER_CONDITION_CODES.howlCarryLoss
);
const TITAN_LIGHT_PREFIX = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.lockAndKey,
  ENCOUNTER_CONDITION_CODES.titanLight
);
const TITAN_CAMERAS_PREFIX = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.lockAndKey,
  ENCOUNTER_CONDITION_CODES.titanCameras
);
const FRESH_CLAMS_PREFIX = storedEncounterCondition(
  ENCOUNTER_CONDITION_OWNERS.workingForSnack,
  ENCOUNTER_CONDITION_CODES.freshClamsSpoil
);

const conditionFor = (
  owner: keyof typeof ENCOUNTER_CONDITION_OWNERS,
  code: keyof typeof ENCOUNTER_CONDITION_CODES
): string => storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS[owner], ENCOUNTER_CONDITION_CODES[code]);

const FUNGI_PREFIX = conditionFor('fungiFounder', 'fungiPoisoned');
const TYPICAL_SUMMER = conditionFor('typicalSummer', 'typicalSummer');
const WAYFRIEND = conditionFor('wayfriend', 'wayfriend');
const FRESHLY_GRILLED = conditionFor('freshlyGrilled', 'freshlyGrilled');
const FROSTBITTEN = conditionFor('frostbitten', 'frostbitten');
const FROSTBITTEN_ACTIVE_PREFIX = conditionFor('frostbitten', 'frostbittenActive');
const HOSPITALITY = conditionFor('hospitality', 'hospitality');
const ROADTREAT = conditionFor('roadtreat', 'roadtreat');
const ROOTING_AROUND = conditionFor('rootingAround', 'rootingAround');
const PARCHED = conditionFor('parched', 'parched');
const FRIGID_GUSTS = conditionFor('frigidGusts', 'frigidGusts');
const DASTARDS_PREFIX = conditionFor('dastardsAhead', 'dastardsWarning');
const HAILSTORM = conditionFor('hailstorm', 'hailstorm');
const CAN_IT = conditionFor('canIt', 'canIt');
const MUSTY = conditionFor('musty', 'musty');
const RAY_TRACING = conditionFor('rayTracing', 'rayTracing');
const CHILLED_TO_BONE_PREFIX = conditionFor('chilledToBone', 'chilledToBone');
const MARSH_WADER = conditionFor('marshWader', 'marshWader');
const BOATMAKERS = conditionFor('boatmakers', 'boatmakers');
const REFRESHING_DIP = conditionFor('panning', 'refreshingDip');

/**
 * Conditions whose printed effect is beneficial. Encounter protection ignores
 * negative effects only; treating every deferred condition as harmful would
 * silently discard rewards such as Roadtreat or Hospitality.
 *
 * Unknown condition IDs remain negative for backward compatibility with the
 * older engine's conservative protection behaviour.
 */
const POSITIVE_RAW_CONDITION_CODES = new Set<string>([
  ENCOUNTER_CONDITION_CODES.wayfriend,
  ENCOUNTER_CONDITION_CODES.freshlyGrilled,
  ENCOUNTER_CONDITION_CODES.hospitality,
  ENCOUNTER_CONDITION_CODES.roadtreat,
  ENCOUNTER_CONDITION_CODES.dastardsWarning,
  ENCOUNTER_CONDITION_CODES.canIt,
  ENCOUNTER_CONDITION_CODES.musty,
  ENCOUNTER_CONDITION_CODES.rayTracing,
  ENCOUNTER_CONDITION_CODES.marshWader,
  ENCOUNTER_CONDITION_CODES.boatmakers,
  ENCOUNTER_CONDITION_CODES.refreshingDip
]);

export const isNegativeEncounterCondition = (conditionId: string): boolean => (
  !POSITIVE_RAW_CONDITION_CODES.has(conditionId)
);

export const INITIAL_FUNGI_POISON_CONDITION = `${FUNGI_PREFIX}:3`;
export const INITIAL_TYPICAL_SUMMER_CONDITION = TYPICAL_SUMMER;
export const INITIAL_CHILLED_TO_BONE_CONDITION = `${CHILLED_TO_BONE_PREFIX}:3`;
export const INITIAL_DASTARDS_WARNING_CONDITION = DASTARDS_PREFIX;

const atLocation = (prefix: string, locationId: string): string => `${prefix}:${locationId}`;

const consumeExact = (
  conditions: readonly string[],
  condition: string
): ConsumedEncounterCondition => {
  let consumed = false;
  const remaining = conditions.filter(candidate => {
    if (!consumed && candidate === condition) {
      consumed = true;
      return false;
    }
    return true;
  });
  return { active: consumed, conditions: remaining };
};

/** The Deer result permanently blocks both traversal and Foraging here. */
export const isDuchyOfDeerLocationBlocked = (
  conditions: readonly string[],
  locationId: string
): boolean => conditions.includes(atLocation(DUCHY_PREFIX, locationId));

/** Big Fish and Small Fish alone are unavailable until the next Move. */
export const areFishUnavailableUntilMove = (
  conditions: readonly string[],
  locationId: string
): boolean => conditions.includes(atLocation(FISH_PREFIX, locationId));

/**
 * Encounter completion rewards active at this exact Location. Lodge of
 * Wonders grants 2 FP and Lock and Key's Light grants 3 FP; imported saves
 * containing both retain both canonical effects.
 */
export const encounterCompletionForagingPointBonus = (
  conditions: readonly string[],
  locationId: string
): number => (
  (conditions.includes(atLocation(LODGE_VISIT_PREFIX, locationId)) ? 2 : 0)
  + (conditions.includes(atLocation(TITAN_LIGHT_PREFIX, locationId)) ? 3 : 0)
);

/** Consume the Lodge's Step-2 exception exactly once for its immediate Barter. */
export const consumeLodgeBarterStepTwoSkip = (
  conditions: readonly string[],
  locationId: string
): ConsumedEncounterCondition => consumeExact(conditions, atLocation(LODGE_TRADE_PREFIX, locationId));

/** Consume Lock and Key's one optional Encounter redraw at this Location. */
export const consumeTitanEncounterRedraw = (
  conditions: readonly string[],
  locationId: string
): ConsumedEncounterCondition => consumeExact(conditions, atLocation(TITAN_CAMERAS_PREFIX, locationId));

/**
 * Howl losses are permanent and may stack across separate encounters. The
 * shell applies these deltas to canonical character stats once, then stores
 * only `conditions` from the return value so save/reload cannot reapply them.
 */
export const consumePermanentEncounterStatDeltas = (
  conditions: readonly string[]
): { conditions: string[]; delta: PermanentEncounterStatDelta } => {
  let speed = 0;
  let carry = 0;
  const remaining = conditions.filter(condition => {
    if (condition === HOWL_SPEED) {
      speed -= 1;
      return false;
    }
    if (condition === HOWL_CARRY) {
      carry -= 1;
      return false;
    }
    return true;
  });
  return { conditions: remaining, delta: { speed, carry } };
};

const parseCountdown = (condition: string, prefix: string): number | null => {
  if (!condition.startsWith(`${prefix}:`)) return null;
  const value = Number(condition.slice(prefix.length + 1));
  return Number.isInteger(value) && value >= 0 ? value : null;
};

/**
 * Convert condition identifiers written by older manual-effect saves into the
 * stable runtime tokens. Narrative strings are deliberately not guessed: a
 * translated sentence is not strong enough evidence that its choice occurred.
 */
export const normalizeEncounterConditions = (conditions: readonly string[]): string[] => conditions.map(condition => {
  const ownerPrefix = (owner: string) => `manual:${owner}:`;
  const aliases: Array<[string, string]> = [
    [`${ownerPrefix(ENCOUNTER_CONDITION_OWNERS.freshlyGrilled)}FRESHLY_GRILLED_NEXT_TIMER`, FRESHLY_GRILLED],
    [`${ownerPrefix(ENCOUNTER_CONDITION_OWNERS.dastardsAhead)}SETTLEMENT_WARNING_DEADLINE`, DASTARDS_PREFIX],
    [`${ownerPrefix(ENCOUNTER_CONDITION_OWNERS.hailstorm)}HAILSTORM_NEXT_TIMER`, HAILSTORM],
    [`${ownerPrefix(ENCOUNTER_CONDITION_OWNERS.chilledToBone)}CHILLED_TO_BONE_TIMER`, INITIAL_CHILLED_TO_BONE_CONDITION]
  ];
  const alias = aliases.find(([legacy]) => condition === legacy);
  if (alias) return alias[1];
  const rawAliases = new Map<string, string>([
    [ENCOUNTER_CONDITION_CODES.typicalSummer, TYPICAL_SUMMER],
    [ENCOUNTER_CONDITION_CODES.wayfriend, WAYFRIEND],
    [ENCOUNTER_CONDITION_CODES.freshlyGrilled, FRESHLY_GRILLED],
    [ENCOUNTER_CONDITION_CODES.frostbitten, FROSTBITTEN],
    [ENCOUNTER_CONDITION_CODES.hospitality, HOSPITALITY],
    [ENCOUNTER_CONDITION_CODES.roadtreat, ROADTREAT],
    [ENCOUNTER_CONDITION_CODES.rootingAround, ROOTING_AROUND],
    [ENCOUNTER_CONDITION_CODES.parched, PARCHED],
    [ENCOUNTER_CONDITION_CODES.frigidGusts, FRIGID_GUSTS],
    [ENCOUNTER_CONDITION_CODES.dastardsWarning, DASTARDS_PREFIX],
    [ENCOUNTER_CONDITION_CODES.hailstorm, HAILSTORM],
    [ENCOUNTER_CONDITION_CODES.canIt, CAN_IT],
    [ENCOUNTER_CONDITION_CODES.musty, MUSTY],
    [ENCOUNTER_CONDITION_CODES.rayTracing, RAY_TRACING],
    [ENCOUNTER_CONDITION_CODES.marshWader, MARSH_WADER],
    [ENCOUNTER_CONDITION_CODES.boatmakers, BOATMAKERS],
    [ENCOUNTER_CONDITION_CODES.refreshingDip, REFRESHING_DIP],
    [`${ENCOUNTER_CONDITION_CODES.chilledToBone}:3`, INITIAL_CHILLED_TO_BONE_CONDITION]
  ]);
  const rawAlias = rawAliases.get(condition);
  if (rawAlias) return rawAlias;
  if (condition === FUNGI_PREFIX) return INITIAL_FUNGI_POISON_CONDITION;
  if (condition === CHILLED_TO_BONE_PREFIX) return INITIAL_CHILLED_TO_BONE_CONDITION;
  return condition;
});

export interface MarkedDayConditionOutcome {
  conditions: string[];
  expired: Array<'fungi-poison' | 'dastards-warning'>;
}

/** Advance only counters whose printed clock is an actual Calendar Mark Day. */
export const advanceEncounterConditionsOnMarkedDays = (
  rawConditions: readonly string[],
  markedDays: number
): MarkedDayConditionOutcome => {
  const conditions = normalizeEncounterConditions(rawConditions);
  if (!Number.isFinite(markedDays) || markedDays <= 0) return { conditions, expired: [] };
  const elapsed = Math.floor(markedDays);
  const expired: MarkedDayConditionOutcome['expired'] = [];
  const next = conditions.flatMap(condition => {
    const fungiRemaining = parseCountdown(condition, FUNGI_PREFIX);
    if (fungiRemaining !== null) {
      const remaining = Math.max(0, fungiRemaining - elapsed);
      if (remaining === 0) {
        expired.push('fungi-poison');
        return [];
      }
      return [`${FUNGI_PREFIX}:${remaining}`];
    }
    if (condition === DASTARDS_PREFIX) {
      const nextRemaining = Math.max(0, 2 - elapsed);
      if (nextRemaining === 0) {
        expired.push('dastards-warning');
        return [];
      }
      // A legacy save may predate target binding. Keep the deadline honest
      // while leaving the unknown destination explicitly unresolved.
      return [`${DASTARDS_PREFIX}:unbound:${nextRemaining}`];
    }
    if (condition.startsWith(`${DASTARDS_PREFIX}:`)) {
      const parts = condition.slice(DASTARDS_PREFIX.length + 1).split(':');
      const remaining = Number(parts.pop());
      const targetId = parts.join(':');
      if (targetId && Number.isInteger(remaining) && remaining >= 0) {
        const nextRemaining = Math.max(0, remaining - elapsed);
        if (nextRemaining === 0) {
          expired.push('dastards-warning');
          return [];
        }
        return [`${DASTARDS_PREFIX}:${targetId}:${nextRemaining}`];
      }
    }
    return [condition];
  });
  return { conditions: next, expired };
};

export const bindDastardsWarningTarget = (
  rawConditions: readonly string[],
  targetLocationId: string | null | undefined
): string[] => {
  const conditions = normalizeEncounterConditions(rawConditions);
  if (!targetLocationId) return conditions;
  return conditions.map(condition => {
    if (condition === DASTARDS_PREFIX) return `${DASTARDS_PREFIX}:${targetLocationId}:2`;
    if (!condition.startsWith(`${DASTARDS_PREFIX}:unbound:`)) return condition;
    const remaining = Number(condition.slice(`${DASTARDS_PREFIX}:unbound:`.length));
    return Number.isInteger(remaining) && remaining > 0
      ? `${DASTARDS_PREFIX}:${targetLocationId}:${remaining}`
      : condition;
  });
};

/** Award the printed Reputation only once, on timely arrival at the bound Settlement. */
export const resolveDastardsWarningArrival = (
  rawConditions: readonly string[],
  destinationId: string
): { conditions: string[]; reputationGained: number } => {
  let reputationGained = 0;
  const conditions = normalizeEncounterConditions(rawConditions).filter(condition => {
    if (!condition.startsWith(`${DASTARDS_PREFIX}:`)) return true;
    const parts = condition.slice(DASTARDS_PREFIX.length + 1).split(':');
    const remaining = Number(parts.pop());
    const targetId = parts.join(':');
    const eligibleTargets = targetId.split('|').filter(Boolean);
    if (eligibleTargets.includes(destinationId) && Number.isInteger(remaining) && remaining > 0) {
      reputationGained += 4;
      return false;
    }
    return true;
  });
  return { conditions, reputationGained };
};

export const applyEncounterMoveSpeed = (
  baseSpeed: number,
  rawConditions: readonly string[]
): number => {
  const conditions = normalizeEncounterConditions(rawConditions);
  let speed = baseSpeed + (conditions.includes(REFRESHING_DIP) ? 2 : 0);
  const halvingEffects = (conditions.includes(TYPICAL_SUMMER) ? 1 : 0)
    + (conditions.some(condition => parseCountdown(condition, FUNGI_PREFIX) !== null) ? 1 : 0);
  for (let index = 0; index < halvingEffects; index += 1) speed /= 2;
  return Math.max(1, Math.floor(speed));
};

export const encounterMoveCarryBonus = (rawConditions: readonly string[]): number => (
  normalizeEncounterConditions(rawConditions).includes(BOATMAKERS) ? 2 : 0
);

export const hasWayfriendProtection = (
  rawConditions: readonly string[],
  destinationRegion: TravelRegion
): boolean => destinationRegion === 'Forest' && normalizeEncounterConditions(rawConditions).includes(WAYFRIEND);

/** Consume effects whose duration ends with the completed Move. */
export const consumeEncounterConditionsOnMove = (
  rawConditions: readonly string[],
  destinationRegion?: TravelRegion
): string[] => normalizeEncounterConditions(rawConditions).filter(condition => {
  if (condition.startsWith(`${FISH_PREFIX}:`)
    || condition.startsWith(`${LODGE_VISIT_PREFIX}:`)
    || condition.startsWith(`${TITAN_LIGHT_PREFIX}:`)
    || condition.startsWith(`${TITAN_CAMERAS_PREFIX}:`)
    || condition === TYPICAL_SUMMER
    || condition === ROOTING_AROUND
    || condition === FABLED_BEHEMOTH_MUST_MOVE_CONDITION
    || condition === MUSTY
    || condition === RAY_TRACING
    || condition === BOATMAKERS
    || condition === REFRESHING_DIP
    || parseCountdown(condition, CHILLED_TO_BONE_PREFIX) !== null) return false;
  if (condition === WAYFRIEND && destinationRegion === 'Forest') return false;
  return true;
});

export const nextForageAdjacentPathLimit = (rawConditions: readonly string[]): 1 | 2 => (
  normalizeEncounterConditions(rawConditions).includes(ROADTREAT) ? 2 : 1
);

export const isCurrentLocationForageBlocked = (rawConditions: readonly string[]): boolean => (
  normalizeEncounterConditions(rawConditions).some(condition => (
    condition === ROOTING_AROUND || condition === FABLED_BEHEMOTH_MUST_MOVE_CONDITION
  ))
);

export const consumeNextForageRangeCondition = (rawConditions: readonly string[]): string[] => (
  normalizeEncounterConditions(rawConditions).filter(condition => condition !== ROADTREAT)
);

export const mushroomRarityConditionModifier = (rawConditions: readonly string[]): number => (
  normalizeEncounterConditions(rawConditions).includes(MUSTY) ? -4 : 0
);

export interface ForageConditionOutcome {
  conditions: string[];
  foragingPointsGained: number;
  timerCost: number;
  chilledTimerRemaining: number | null;
}

/**
 * Apply effects triggered by completion of one Forage.  Chilled To The Bone
 * ticks only in Mountain locations; reaching zero emits the one-time Warm Up
 * Timer cost and removes the special Timer.
 */
export const applyEncounterConditionsAfterForage = (
  rawConditions: readonly string[],
  region: Exclude<TravelRegion, 'Soar'>
): ForageConditionOutcome => {
  const conditions = normalizeEncounterConditions(rawConditions);
  const foragingPointsGained = conditions.includes(RAY_TRACING) ? 1 : 0;
  let timerCost = 0;
  let chilledTimerRemaining: number | null = null;
  const next = conditions.flatMap(condition => {
    const remaining = parseCountdown(condition, CHILLED_TO_BONE_PREFIX);
    if (remaining === null || region !== 'Mountain') return [condition];
    const updated = Math.max(0, remaining - 1);
    chilledTimerRemaining = updated;
    if (updated === 0) {
      timerCost = 3;
      return [];
    }
    return [`${CHILLED_TO_BONE_PREFIX}:${updated}`];
  });
  return { conditions: next, foragingPointsGained, timerCost, chilledTimerRemaining };
};

export interface NextAilmentConditionOutcome {
  conditions: string[];
  patient: PatientState;
  foragingPoints: number;
  timerDelta: number;
}

/** Consume every pending "next Ailment/Timer" effect in the same transaction. */
export const applyEncounterConditionsAtAilmentStart = (
  rawConditions: readonly string[],
  patient: PatientState,
  normalStartingForagingPoints: number
): NextAilmentConditionOutcome => {
  const conditions = normalizeEncounterConditions(rawConditions);
  const timerDeltas = new Map<string, number>([
    [FRESHLY_GRILLED, 2],
    [PARCHED, -3],
    [FRIGID_GUSTS, -2],
    [HAILSTORM, -2],
    [CAN_IT, 2]
  ]);
  const timerDelta = conditions.reduce((sum, condition) => sum + (timerDeltas.get(condition) || 0), 0);
  const frostbitten = conditions.includes(FROSTBITTEN);
  const hospitality = conditions.includes(HOSPITALITY);
  const marshWader = conditions.includes(MARSH_WADER);
  let foragingPoints = frostbitten ? 0 : hospitality ? 4 : normalStartingForagingPoints;
  if (marshWader) foragingPoints += 5;
  const activeTimerIds = new Set(patient.ailments
    .filter(ailment => ailment.status === 'active')
    .flatMap(ailment => ailment.timerIds));
  const adjustedTimers = patient.timers.map(timer => {
    if (timer.status !== 'active' || !activeTimerIds.has(timer.id) || timerDelta === 0) return timer;
    const current = Math.max(0, timer.current + timerDelta);
    const maximum = Math.max(0, timer.maximum + timerDelta);
    return { ...timer, current, maximum, status: current === 0 ? 'expired' as const : timer.status };
  });
  const adjustedTimerById = new Map(adjustedTimers.map(timer => [timer.id, timer]));
  const adjustedPatient: PatientState = {
    ...patient,
    foragingPoints,
    timers: adjustedTimers,
    ailments: patient.ailments.map(ailment => ailment.status === 'active'
      && ailment.timerIds.some(timerId => adjustedTimerById.get(timerId)?.status === 'expired')
      ? { ...ailment, status: 'failed' as const }
      : ailment)
  };
  const consumed = new Set([...timerDeltas.keys(), FROSTBITTEN, HOSPITALITY, MARSH_WADER]);
  const nextConditions = conditions.filter(condition => !consumed.has(condition));
  if (frostbitten) nextConditions.push(`${FROSTBITTEN_ACTIVE_PREFIX}:${patient.id}`);
  return { conditions: nextConditions, patient: adjustedPatient, foragingPoints, timerDelta };
};

export const encounterForagingPointMultiplier = (
  rawConditions: readonly string[],
  patientId: string | null | undefined
): number => patientId && normalizeEncounterConditions(rawConditions).includes(`${FROSTBITTEN_ACTIVE_PREFIX}:${patientId}`)
  ? 0.5
  : 1;

/**
 * Clear only effects whose printed duration is "until you next Move On".
 * The permanent Deer prohibition and unconsumed immediate Lodge trade are not
 * removed here.
 */
export const clearEncounterConditionsOnMove = (
  conditions: readonly string[]
): string[] => consumeEncounterConditionsOnMove(conditions);

/** Only permanent Howl penalties intentionally allow duplicate saved tokens. */
export const isStackableEncounterCondition = (condition: string): boolean => (
  condition === HOWL_SPEED || condition === HOWL_CARRY
);

/**
 * p.203: each Working for a Snack result owns exactly one Fresh Clams unit.
 * Mark Day consumes that unit and its condition atomically; stale legacy
 * conditions are also cleared rather than repeatedly trying to spoil an item
 * that is no longer carried.
 */
export const spoilFreshClamsOnMarkedDay = (
  conditions: readonly string[],
  inventory: readonly EngineInventoryItem[]
): { conditions: string[]; inventory: EngineInventoryItem[]; spoiledItemIds: string[] } => {
  const itemIds = conditions
    .filter(condition => condition.startsWith(`${FRESH_CLAMS_PREFIX}:`))
    .map(condition => condition.slice(FRESH_CLAMS_PREFIX.length + 1))
    .filter(Boolean);
  if (itemIds.length === 0) {
    return { conditions: [...conditions], inventory: inventory.map(item => ({ ...item })), spoiledItemIds: [] };
  }

  const requested = new Map<string, number>();
  for (const itemId of itemIds) requested.set(itemId, (requested.get(itemId) || 0) + 1);
  const spoiledItemIds: string[] = [];
  const nextInventory = inventory.flatMap(item => {
    const count = requested.get(item.id) || 0;
    if (count === 0) return [{ ...item }];
    const available = Math.max(1, item.quantity || 1);
    const spoiled = Math.min(available, count);
    spoiledItemIds.push(...Array.from({ length: spoiled }, () => item.id));
    const remaining = available - spoiled;
    return remaining > 0 ? [{ ...item, quantity: remaining }] : [];
  });
  return {
    conditions: conditions.filter(condition => !condition.startsWith(`${FRESH_CLAMS_PREFIX}:`)),
    inventory: nextInventory,
    spoiledItemIds
  };
};
