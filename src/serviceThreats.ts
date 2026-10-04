import {
  ENCOUNTER_CONDITION_CODES as C, ENCOUNTER_CONDITION_OWNERS as O,
  FABLED_BEHEMOTH_MUST_MOVE_CONDITION, normalizeEncounterConditions, storedEncounterCondition
} from './rules/encounterConditionRuntime';

interface ThreatState {
  barrows?: Array<{ id: string; name: string; locationName: string; locationId?: string; removed?: boolean }>;
  activeDelve?: { barrowId: string } | null;
  pursuedByBehemoth?: { headStart: number } | null;
  manualConditions?: string[];
  currentMapLocationId?: string;
  currentLocationName?: string;
  mapEncounterRecords: Array<{ id: string; label: string; locationId?: string; locationName: string; sourceEncounterId?: string }>;
}

const deerPrefix = `${storedEncounterCondition(O.duchyOfDeer, C.duchyOfDeerBan)}:`;
const boars = storedEncounterCondition(O.rootingAround, C.rootingAround);

/** p.61 targets actual world effects, never names or broad Encounter tags.
 * p.162's angry bear is already a bear-barrow, not a second chargeable note.
 * p.158 Deer, p.87 boars and p.170 loch monster are non-barrow restrictions.
 * Instant attacks, friendly Bakar, illnesses and weather are not map effects. */
export const guildThreatTargets = (state: ThreatState): Array<{
  id: string; label: string; locationId?: string; sourceEncounterId?: string;
}> => [
  ...(state.barrows || []).filter(row => !row.removed && row.id !== state.activeDelve?.barrowId)
    .map(row => ({ id: `barrow:${row.id}`, label: `${row.name} · ${row.locationName}`, locationId: row.locationId })),
  ...(state.pursuedByBehemoth ? [{ id: 'pursuit:behemoth', label: '뒤쫓는 거수 · 추격 종료' }] : []),
  ...[...new Set(normalizeEncounterConditions(state.manualConditions || []))].flatMap(condition => {
    const deerLocation = condition.startsWith(deerPrefix) ? condition.slice(deerPrefix.length) : '';
    const kind = deerLocation ? 'deer' : condition === boars ? 'boars'
      : condition === FABLED_BEHEMOTH_MUST_MOVE_CONDITION ? 'loch' : null;
    if (!kind) return [];
    const locationId = deerLocation || state.currentMapLocationId;
    const sourceEncounterId = kind === 'deer' ? O.duchyOfDeer : kind === 'boars' ? O.rootingAround : 'foraging-loch-m-autumn';
    const name = state.mapEncounterRecords.find(row => row.locationId === locationId)?.locationName
      || (locationId === state.currentMapLocationId ? state.currentLocationName : '') || locationId || '현재 위치';
    const label = kind === 'deer' ? '사슴의 영지 · 통행·채집 금지' : kind === 'boars' ? '거대한 멧돼지 · 현지 채집 금지' : '전설 속 거수 · 이 장소 떠나기';
    return [{ id: `condition:${condition}`, label: `${label} · ${name}`, locationId, sourceEncounterId }];
  })
];

export const removeGuildThreat = <T extends ThreatState>(state: T, target: string): T => {
  const threat = guildThreatTargets(state).find(row => row.id === target);
  if (!threat) return state;
  const barrow = state.barrows?.find(row => `barrow:${row.id}` === target);
  return {
    ...state,
    barrows: (state.barrows || []).map(row => row === barrow ? { ...row, removed: true } : row),
    pursuedByBehemoth: target === 'pursuit:behemoth' ? null : state.pursuedByBehemoth,
    manualConditions: (state.manualConditions || []).filter(condition =>
      `condition:${normalizeEncounterConditions([condition])[0]}` !== target),
    mapEncounterRecords: state.mapEncounterRecords.filter(row => {
      if (threat.sourceEncounterId && row.sourceEncounterId === threat.sourceEncounterId && row.locationId === threat.locationId) return false;
      return !(barrow && (row.id === `barrow:${barrow.id}`
        || (barrow.id.startsWith('bear-barrow:') && row.sourceEncounterId === 'foraging-forest-m-winter' && row.locationId === barrow.locationId)));
    })
  };
};
