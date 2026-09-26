import { ENCOUNTERS } from './rules/data/encounters';

interface ThreatState {
  barrows?: Array<{ id: string; name: string; locationName: string; removed?: boolean }>;
  activeDelve?: { barrowId: string } | null;
  pursuedByBehemoth?: { headStart: number } | null;
  mapEncounterRecords: Array<{ id: string; label: string; locationName: string; sourceEncounterId?: string }>;
}

/** Explicit targets prevent Scare Tactics from deleting unrelated map notes. */
export const guildThreatTargets = (state: ThreatState): Array<{ id: string; label: string }> => [
  ...(state.barrows || []).filter(row => !row.removed && row.id !== state.activeDelve?.barrowId)
    .map(row => ({ id: `barrow:${row.id}`, label: `${row.name} · ${row.locationName}` })),
  ...(state.pursuedByBehemoth ? [{ id: 'pursuit:behemoth', label: '뒤쫓는 거수 · 추격 종료' }] : []),
  ...state.mapEncounterRecords.filter(row => /behemoth|거수|angry bear|성난 곰|화난 곰/i.test(row.label)
    || ENCOUNTERS.find(encounter => encounter.id === row.sourceEncounterId)?.tags.includes('Behemoth'))
    .map(row => ({ id: `record:${row.id}`, label: `${row.label} · ${row.locationName}` }))
];

export const removeGuildThreat = <T extends ThreatState>(state: T, target: string): T => {
  if (!guildThreatTargets(state).some(row => row.id === target)) return state;
  return {
    ...state,
    barrows: (state.barrows || []).map(row => `barrow:${row.id}` === target ? { ...row, removed: true } : row),
    pursuedByBehemoth: target === 'pursuit:behemoth' ? null : state.pursuedByBehemoth,
    mapEncounterRecords: state.mapEncounterRecords.filter(row => `record:${row.id}` !== target)
  };
};
