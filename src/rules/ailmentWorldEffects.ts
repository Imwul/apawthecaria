import type { Season } from './types';

/**
 * Persistent world changes that Ailment Outcomes and Consequences leave on the
 * map (pp.104-115). Each one is stored in `manualConditions` as an
 * `ailment-world:` token so the move, Forage and Barter guards can read it
 * without parsing translated prose. Seasonal tokens carry the number of
 * Season changes they survive and are retired by
 * `advanceAilmentWorldConditionsForSeason`.
 */

export const AILMENT_WORLD_OWNERS = {
  snailAils: 'ailment-snail-ails',
  groundhog: 'ailment-groundhog-syndrome',
  stingshock: 'ailment-stingshock',
  wingbreak: 'ailment-wingbreak',
  titanTouched: 'ailment-titan-touched',
  trowelTrouble: 'ailment-trowel-trouble',
  tickbitten: 'ailment-tickbitten-twice-shy',
  souredDough: 'ailment-soured-dough'
} as const;

export const AILMENT_WORLD_INPUTS = {
  settlement: 'ailment-world-settlement',
  ruin: 'ailment-world-ruin',
  ruinLinkA: 'ailment-world-ruin-link-1',
  ruinLinkB: 'ailment-world-ruin-link-2',
  pathEnd: 'ailment-world-path-end',
  potency: 'ailment-world-potency'
} as const;

export const TROWEL_POTENCY_OPTIONS = ['약효 3 영약재로 치료함 · 새 경로를 냄', '약효 3 영약재를 쓰지 않음'] as const;

const PREFIX = 'ailment-world:';

type AilmentWorldKind =
  | 'snail-quarantine'
  | 'groundhog-no-barter-social'
  | 'groundhog-no-plant-insect'
  | 'stingshock-no-bee-hive'
  | 'titan-rarity-plus-1'
  | 'tickbitten-return-pair'
  | 'location-ban'
  | 'path-closed'
  | 'paw-rot-grateful-trinket';

interface ParsedAilmentWorldCondition {
  kind: AilmentWorldKind;
  locationId: string | null;
  seasonsLeft: number | null;
  raw: string;
}

const token = (kind: AilmentWorldKind, locationId: string | null, seasons: number | null): string =>
  `${PREFIX}${kind}${locationId ? `:@${locationId}` : ''}${seasons !== null ? `:seasons:${seasons}` : ''}`;

export const ailmentWorldCondition = {
  /** p.113 Snail Ails: the nearest Settlement cannot be visited until the next Season. */
  snailQuarantine: (settlementId: string) => token('snail-quarantine', settlementId, 1),
  /** p.107 Groundhog (Spring/Summer): no Barter or social events here until the end of next Season. */
  groundhogNoBarterSocial: (locationId: string) => token('groundhog-no-barter-social', locationId, 2),
  /** p.107 Groundhog (Autumn/Winter): no Plant/Insect Forage within 2 Paths until the end of next Season. */
  groundhogNoPlantInsect: (centerId: string) => token('groundhog-no-plant-insect', centerId, 2),
  /** p.112 Stingshock: Bee and Hive Reagents are permanently Unavailable here. */
  stingshockNoBeeHive: (locationId: string) => token('stingshock-no-bee-hive', locationId, null),
  /** p.114 Titan Touched: every Titan Reagent's Rarity is +1 until the end of next Season. */
  titanRarityPlusOne: () => token('titan-rarity-plus-1', null, 2),
  /** p.113 Tickbitten: the next visit to this Settlement replaces the Ailment draw with two Tickbitten cases. */
  tickbittenReturnPair: (settlementId: string) => token('tickbitten-return-pair', settlementId, null),
  /** p.110 Paw Rot (PRESERVED Remedy): the next time you come through here, a grateful patient gives 1 Trinket. */
  pawRotGratefulTrinket: (locationId: string) => token('paw-rot-grateful-trinket', locationId, null),
  /** p.39 Tangible Effect: this character may not enter or move through the Location. */
  locationBan: (locationId: string) => token('location-ban', locationId, null),
  /** p.39 Tangible Effect: a Path removed from the map. */
  pathClosed: (from: string, to: string) => token('path-closed', [from, to].sort().join('|'), null),
  /** p.115 Wingbreak: Barter Rarity +2 for the rest of this Season (consumed by barterEngine). */
  wingbreak: (season: Season) => `wingbreak:barter-rarity-plus-2:${season}`,
  /** p.112 Soured Dough: when no case was cured the next Remedy earns 0 Trinkets. */
  souredDough: () => SOURED_DOUGH_CONDITION
};

export const SOURED_DOUGH_CONDITION = 'soured-dough:next-remedy-trinkets-zero';

export const parseAilmentWorldCondition = (condition: string): ParsedAilmentWorldCondition | null => {
  // Manual resolutions may prefix the token with `manual:<owner>:`.
  const start = condition.indexOf(PREFIX);
  if (start < 0) return null;
  const body = condition.slice(start + PREFIX.length).split(':');
  const kind = body[0] as AilmentWorldKind;
  if (!['snail-quarantine', 'groundhog-no-barter-social', 'groundhog-no-plant-insect',
    'stingshock-no-bee-hive', 'titan-rarity-plus-1', 'tickbitten-return-pair',
    'location-ban', 'path-closed', 'paw-rot-grateful-trinket'].includes(kind)) return null;
  let locationId: string | null = null;
  let seasonsLeft: number | null = null;
  for (let index = 1; index < body.length; index += 1) {
    const part = body[index];
    if (part === 'seasons') {
      const value = Number(body[index + 1]);
      seasonsLeft = Number.isFinite(value) ? value : null;
      index += 1;
    } else if (part.startsWith('@')) {
      // Location ids may themselves contain ':'; rejoin until the season marker.
      const rest = [part.slice(1)];
      while (index + 1 < body.length && body[index + 1] !== 'seasons') {
        index += 1;
        rest.push(body[index]);
      }
      locationId = rest.join(':');
    }
  }
  return { kind, locationId, seasonsLeft, raw: condition };
};

const active = (conditions: readonly string[] | undefined) =>
  (conditions || []).map(parseAilmentWorldCondition).filter((row): row is ParsedAilmentWorldCondition => Boolean(row));

export const isSettlementQuarantined = (conditions: readonly string[] | undefined, locationId: string): boolean =>
  active(conditions).some(row => row.kind === 'snail-quarantine' && row.locationId === locationId);

export const isLocationBanned = (conditions: readonly string[] | undefined, locationId: string): boolean =>
  active(conditions).some(row => row.kind === 'location-ban' && row.locationId === locationId);

export const isPathClosed = (conditions: readonly string[] | undefined, from: string, to: string): boolean => {
  const pair = [from, to].sort().join('|');
  return active(conditions).some(row => row.kind === 'path-closed' && row.locationId === pair);
};

export const isBarterSocialBanned = (conditions: readonly string[] | undefined, locationId: string): boolean =>
  active(conditions).some(row => row.kind === 'groundhog-no-barter-social' && row.locationId === locationId);

export const isBeeHiveUnavailableAt = (conditions: readonly string[] | undefined, locationId: string): boolean =>
  active(conditions).some(row => row.kind === 'stingshock-no-bee-hive' && row.locationId === locationId);

export const titanRarityAilmentModifier = (conditions: readonly string[] | undefined): number =>
  active(conditions).some(row => row.kind === 'titan-rarity-plus-1') ? 1 : 0;

export const hasTickbittenReturnPair = (conditions: readonly string[] | undefined, locationId: string): boolean =>
  active(conditions).some(row => row.kind === 'tickbitten-return-pair' && row.locationId === locationId);

export const consumeTickbittenReturnPair = (conditions: readonly string[], locationId: string): string[] => {
  let removed = false;
  return conditions.filter(condition => {
    if (removed) return true;
    const row = parseAilmentWorldCondition(condition);
    if (row?.kind === 'tickbitten-return-pair' && row.locationId === locationId) {
      removed = true;
      return false;
    }
    return true;
  });
};

/**
 * p.110 Paw Rot: pay out every grateful-patient Trinket waiting at a Location this Move came
 * through (route stops after the origin) and retire those tokens.
 */
export const collectPawRotGratefulTrinkets = (
  conditions: readonly string[],
  routeLocationIds: readonly string[]
): { conditions: string[]; trinkets: number; locationIds: string[] } => {
  const passed = new Set(routeLocationIds);
  const locationIds: string[] = [];
  const kept = conditions.filter(condition => {
    const row = parseAilmentWorldCondition(condition);
    if (row?.kind === 'paw-rot-grateful-trinket' && row.locationId && passed.has(row.locationId)) {
      locationIds.push(row.locationId);
      return false;
    }
    return true;
  });
  return { conditions: kept, trinkets: locationIds.length, locationIds };
};

export const BEE_HIVE_REAGENT_IDS = new Set(['reagent-beehive', 'reagent-honeybees']);

export interface AilmentWorldGraphNode {
  neighbors: readonly string[];
  kind?: string;
  label?: string;
}

export type AilmentWorldGraph = Record<string, AilmentWorldGraphNode>;

/** Breadth-first distances in Paths, capped at `maxDistance`. */
export const pathDistancesFrom = (graph: AilmentWorldGraph, from: string, maxDistance: number): Map<string, number> => {
  const distances = new Map<string, number>();
  if (!graph[from]) return distances;
  distances.set(from, 0);
  let frontier = [from];
  for (let depth = 1; depth <= maxDistance && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of graph[id]?.neighbors || []) {
        if (!graph[neighbor] || distances.has(neighbor)) continue;
        distances.set(neighbor, depth);
        next.push(neighbor);
      }
    }
    frontier = next;
  }
  return distances;
};

export const isPlantInsectForageBanned = (
  conditions: readonly string[] | undefined,
  locationId: string,
  graph: AilmentWorldGraph
): boolean => active(conditions).some(row => row.kind === 'groundhog-no-plant-insect'
  && row.locationId
  && pathDistancesFrom(graph, row.locationId, 2).has(locationId));

const isSettlementKind = (kind?: string) => kind === 'settlement' || kind === 'city';

/** The nearest Settlement or City by Path count; the current Location counts when it is one. */
export const nearestSettlementId = (graph: AilmentWorldGraph, from: string): string | null => {
  if (!graph[from]) return null;
  if (isSettlementKind(graph[from].kind)) return from;
  const distances = pathDistancesFrom(graph, from, 60);
  let best: { id: string; distance: number } | null = null;
  for (const [id, distance] of distances) {
    if (id === from || !isSettlementKind(graph[id]?.kind)) continue;
    if (!best || distance < best.distance || (distance === best.distance && id < best.id)) best = { id, distance };
  }
  return best?.id || null;
};

/** Retires or ages seasonal Ailment world effects at a Season change. */
export const advanceAilmentWorldConditionsForSeason = (conditions: readonly string[]): string[] => conditions.flatMap(condition => {
  const row = parseAilmentWorldCondition(condition);
  if (!row || row.seasonsLeft === null) return [condition];
  if (row.seasonsLeft <= 1) return [];
  return [condition.replace(/:seasons:\d+$/, `:seasons:${row.seasonsLeft - 1}`)];
});

export interface AilmentWorldResolutionInput {
  ownerId: string;
  trigger: string;
  season: Season;
  currentLocationId: string;
  graph: AilmentWorldGraph;
  /** Map ids chosen in the manual panel, keyed by input id. */
  targets: Partial<Record<string, string>>;
  inputValues: Record<string, unknown>;
  /** True when no Soured Dough case was cured. */
  noSiblingCured?: boolean;
}

export interface AilmentWorldResolution {
  conditions: string[];
  /** Paths to add to the player's map. */
  paths: Array<{ from: string; to: string }>;
  /** Wild Location converted to a Titan Ruin. */
  ruinLocationId: string | null;
  notes: string[];
}

const nameOf = (graph: AilmentWorldGraph, id: string) => graph[id]?.label || id;

/**
 * Turns a resolved Ailment manual effect into the map/world tokens the rules
 * enforce. Returns null for owners that leave no persistent world change.
 */
export const resolveAilmentWorldEffect = (input: AilmentWorldResolutionInput): AilmentWorldResolution | null => {
  const { ownerId, trigger, graph } = input;
  const target = (id: string) => {
    const value = input.targets[id];
    return value && graph[value] ? value : null;
  };
  const settlement = () => target(AILMENT_WORLD_INPUTS.settlement) || nearestSettlementId(graph, input.currentLocationId);
  const empty: AilmentWorldResolution = { conditions: [], paths: [], ruinLocationId: null, notes: [] };

  if (ownerId === AILMENT_WORLD_OWNERS.snailAils && trigger === 'treatment-failure') {
    const id = settlement();
    if (!id) return { ...empty, notes: ['가장 가까운 정착지를 찾지 못해 격리를 지도에 적용하지 못했습니다.'] };
    return { ...empty, conditions: [ailmentWorldCondition.snailQuarantine(id)], notes: [`${nameOf(graph, id)} 격리 · 다음 계절이 시작될 때까지 방문할 수 없습니다.`] };
  }
  if (ownerId === AILMENT_WORLD_OWNERS.groundhog && trigger === 'treatment-failure') {
    if (input.season === 'Spring' || input.season === 'Summer') {
      const ids = [...new Set([input.currentLocationId, settlement()].filter((id): id is string => Boolean(id && graph[id])))];
      return {
        ...empty,
        conditions: ids.map(ailmentWorldCondition.groundhogNoBarterSocial),
        notes: [`${ids.map(id => nameOf(graph, id)).join(', ')} · 다음 계절이 끝날 때까지 물물교환과 사교 행사를 할 수 없습니다.`]
      };
    }
    return {
      ...empty,
      conditions: [ailmentWorldCondition.groundhogNoPlantInsect(input.currentLocationId)],
      notes: [`${nameOf(graph, input.currentLocationId)}에서 2경로 이내 · 다음 계절이 끝날 때까지 식물·곤충 영약재를 채집할 수 없습니다.`]
    };
  }
  if (ownerId === AILMENT_WORLD_OWNERS.stingshock && trigger === 'treatment-failure') {
    return {
      ...empty,
      conditions: [ailmentWorldCondition.stingshockNoBeeHive(input.currentLocationId)],
      notes: [`${nameOf(graph, input.currentLocationId)} · 벌·벌집 영약재를 영구히 구할 수 없습니다.`]
    };
  }
  if (ownerId === AILMENT_WORLD_OWNERS.wingbreak && trigger === 'treatment-failure') {
    return { ...empty, conditions: [ailmentWorldCondition.wingbreak(input.season)], notes: ['이번 계절이 끝날 때까지 모든 물물교환 희귀도 +2.'] };
  }
  if (ownerId === AILMENT_WORLD_OWNERS.souredDough && trigger === 'treatment-failure') {
    return input.noSiblingCured
      ? { ...empty, conditions: [SOURED_DOUGH_CONDITION], notes: ['다음 치료제 보상은 장신구 0개입니다.'] }
      : null;
  }
  if (ownerId === AILMENT_WORLD_OWNERS.titanTouched && trigger === 'treatment-failure') {
    return { ...empty, conditions: [ailmentWorldCondition.titanRarityPlusOne()], notes: ['다음 계절이 끝날 때까지 모든 티탄 영약재 희귀도 +1.'] };
  }
  if (ownerId === AILMENT_WORLD_OWNERS.titanTouched && trigger === 'treatment-success') {
    const ruin = target(AILMENT_WORLD_INPUTS.ruin);
    if (!ruin) return null;
    const links = [target(AILMENT_WORLD_INPUTS.ruinLinkA), target(AILMENT_WORLD_INPUTS.ruinLinkB)]
      .filter((id): id is string => Boolean(id && id !== ruin));
    return {
      ...empty,
      ruinLocationId: ruin,
      paths: [...new Set(links)].map(to => ({ from: ruin, to })),
      notes: [`${nameOf(graph, ruin)}을(를) 티탄 유적으로 표시하고 ${[...new Set(links)].map(id => nameOf(graph, id)).join(', ') || '연결할 위치 없음'}까지 경로를 이었습니다.`]
    };
  }
  if (ownerId === AILMENT_WORLD_OWNERS.trowelTrouble && trigger === 'treatment-success') {
    if (input.inputValues[AILMENT_WORLD_INPUTS.potency] !== TROWEL_POTENCY_OPTIONS[0]) return null;
    const end = target(AILMENT_WORLD_INPUTS.pathEnd);
    if (!end || end === input.currentLocationId) return null;
    return {
      ...empty,
      paths: [{ from: input.currentLocationId, to: end }],
      notes: [`${nameOf(graph, input.currentLocationId)}에서 ${nameOf(graph, end)}까지 새 경로를 냈습니다.`]
    };
  }
  if (ownerId === AILMENT_WORLD_OWNERS.tickbitten && trigger === 'treatment-failure') {
    const id = settlement();
    if (!id) return { ...empty, notes: ['가장 가까운 정착지를 찾지 못해 재방문 표시를 남기지 못했습니다.'] };
    return {
      ...empty,
      conditions: [ailmentWorldCondition.tickbittenReturnPair(id)],
      notes: [`${nameOf(graph, id)} 표시 · 다음에 들르면 질환을 뽑는 대신 진드기 물림 환자 2명을 동시에 치료합니다.`]
    };
  }
  return null;
};

/** Korean lines for the currently active Ailment world effects. */
export const describeAilmentWorldConditions = (
  conditions: readonly string[] | undefined,
  locationName: (id: string) => string
): string[] => active(conditions).map(row => {
  const where = row.locationId ? locationName(row.locationId) : '';
  const until = row.seasonsLeft === 1 ? ' · 다음 계절 시작 때 해제' : row.seasonsLeft === 2 ? ' · 다음 계절이 끝날 때 해제' : '';
  switch (row.kind) {
    case 'snail-quarantine': return `${where} 격리 (달팽이 매개 기생충병) · 방문 불가${until}`;
    case 'groundhog-no-barter-social': return `${where} 조기 동면 (땅다람쥐 신드롬) · 물물교환·사교 불가${until}`;
    case 'groundhog-no-plant-insect': return `${where} 2경로 이내 (땅다람쥐 신드롬) · 식물·곤충 채집 불가${until}`;
    case 'stingshock-no-bee-hive': return `${where} (벌침 쇼크) · 벌·벌집 영약재 영구 불가`;
    case 'titan-rarity-plus-1': return `보물 열풍 (티탄 접촉병) · 티탄 영약재 희귀도 +1${until}`;
    case 'tickbitten-return-pair': return `${where} (진드기 물림) · 다음 방문 때 진드기 물림 환자 2명`;
    case 'paw-rot-grateful-trinket': return `${where} (발썩음 병) · 다음에 이곳을 지나면 고마운 환자가 장신구 1개를 줌`;
    case 'location-ban': return `${where} · 이 약제사는 들어가거나 지나갈 수 없음 (영구적 결과)`;
    case 'path-closed': return `${(row.locationId || '').split('|').map(locationName).join(' ↔ ')} 경로가 사라짐 (영구적 결과)`;
    default: return '';
  }
}).filter(Boolean);
