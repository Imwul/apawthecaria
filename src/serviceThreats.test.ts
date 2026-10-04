import { describe, expect, it } from 'vitest';
import { guildThreatTargets, removeGuildThreat } from './serviceThreats';
import { resolveGuildService, type ServiceRuntimeState } from './rules/serviceEngine';
import { ENCOUNTER_CONDITION_CODES as C, ENCOUNTER_CONDITION_OWNERS as O, storedEncounterCondition, isDuchyOfDeerLocationBlocked, FABLED_BEHEMOTH_MUST_MOVE_CONDITION } from './rules/encounterConditionRuntime';

const deer = storedEncounterCondition(O.duchyOfDeer, C.duchyOfDeerBan, 'bog:one');
const deerTarget = `condition:${deer}`;

const state = () => ({
  barrows: [{ id: 'one', name: '고분', locationName: '숲' }, { id: 'gone', name: '옛 고분', locationName: '산', removed: true }],
  pursuedByBehemoth: { headStart: 2 }, activeDelve: null as { barrowId: string } | null,
  manualConditions: [deer, 'unrelated:condition'],
  mapEncounterRecords: [
    { id: 'deer', label: '사슴의 영지', locationId: 'bog:one', locationName: '수렁', sourceEncounterId: O.duchyOfDeer },
    { id: 'bear', label: '성난 곰 그림', locationName: '숲' },
    { id: 'note', label: '약초 군락', locationName: '숲' },
    { id: 'bakar', label: '친구', locationName: '산', sourceEncounterId: 'travel-mountain-m-summer' }
  ]
});

describe('Scare Tactics targets', () => {
  it('offers only canonical live effects, not labels or broadly Behemoth-tagged encounters', () => {
    expect(guildThreatTargets(state()).map(row => row.id)).toEqual(['barrow:one', 'pursuit:behemoth', deerTarget]);
    expect(guildThreatTargets({ ...state(), activeDelve: { barrowId: 'one' } }).some(row => row.id === 'barrow:one')).toBe(false);
  });
  it('removes only the selected target and preserves unrelated notes across reload', () => {
    const original = state();
    const removed = removeGuildThreat(original, deerTarget);
    expect(removed.mapEncounterRecords.map(row => row.id)).toEqual(['bear', 'note', 'bakar']);
    expect(removed.barrows).toEqual(original.barrows);
    expect(removed.pursuedByBehemoth).toEqual(original.pursuedByBehemoth);
    expect(guildThreatTargets(JSON.parse(JSON.stringify(removed))).some(row => row.id === deerTarget)).toBe(false);
    expect(isDuchyOfDeerLocationBlocked(original.manualConditions, 'bog:one')).toBe(true);
    expect(isDuchyOfDeerLocationBlocked(removed.manualConditions, 'bog:one')).toBe(false);
    expect(removed.manualConditions).toEqual(['unrelated:condition']);
    expect(removeGuildThreat(removed, deerTarget)).toBe(removed);
    expect(removeGuildThreat(original, 'record:note')).toBe(original);
    expect(removeGuildThreat(original, 'pursuit:behemoth').pursuedByBehemoth).toBeNull();
    expect(removeGuildThreat(original, 'barrow:one').barrows[0].removed).toBe(true);
  });
  it('handles independent restrictions at multiple locations and until-Move Behemoths', () => {
    const otherDeer = storedEncounterCondition(O.duchyOfDeer, C.duchyOfDeerBan, 'bog:two');
    const multiple = { ...state(), manualConditions: [deer, otherDeer, C.rootingAround, FABLED_BEHEMOTH_MUST_MOVE_CONDITION] };
    expect(guildThreatTargets(multiple)).toHaveLength(6);
    const removed = removeGuildThreat(multiple, deerTarget);
    expect(isDuchyOfDeerLocationBlocked(removed.manualConditions, 'bog:two')).toBe(true);
    expect(removed.manualConditions).toContain(C.rootingAround);
    expect(removeGuildThreat(removed, `condition:${storedEncounterCondition(O.rootingAround, C.rootingAround)}`).manualConditions).not.toContain(C.rootingAround);
  });
  it('removes the p.162 bear once without charging separately for its annotation', () => {
    const original = { ...state(), barrows: [{ id: 'bear-barrow:wood', name: '곰', locationId: 'wood', locationName: '숲', removed: false }],
      mapEncounterRecords: [{ id: 'bear-note', label: '곰', locationId: 'wood', locationName: '숲', sourceEncounterId: 'foraging-forest-m-winter' }] };
    expect(guildThreatTargets(original).filter(row => row.id.startsWith('record:'))).toEqual([]);
    const removed = removeGuildThreat(original, 'barrow:bear-barrow:wood');
    expect(removed.barrows[0].removed).toBe(true);
    expect(removed.mapEncounterRecords).toEqual([]);
  });
  it('does not charge for stale or already removed targets', () => {
    const runtime: ServiceRuntimeState = { currentLocationId: 'odoak', currentLocationName: 'Odoak', currentLocationType: 'City', currentRegion: 'Forest', currentSeason: 'Spring', calendarDays: 0,
      trinkets: 20, inventory: [], graph: {}, mapMutations: [], pendingServices: [], usedJourneyServiceIds: [], weatherProtectionMoves: 0, weatherProtectionActive: false,
      travelEncounterRerolls: 0, missiveSettlementIds: [], removedThreatIds: [], availableThreatIds: [deerTarget], appliedTransactionIds: [], journalEvents: [] };
    const input = { transactionId: 'scare', serviceId: 'scare-tactics' as const, targetIds: [deerTarget], journalNote: '사슴을 설득했다.' };
    const done = resolveGuildService({ ...input, state: runtime });
    expect(done.value!.nextState.trinkets).toBe(12);
    expect(resolveGuildService({ ...input, transactionId: 'twice', state: done.value!.nextState }).status).toBe('invalid');
    expect(resolveGuildService({ ...input, targetIds: ['unknown'], state: runtime }).status).toBe('invalid');
    expect(resolveGuildService({ ...input, state: { ...runtime, availableThreatIds: undefined } }).status).toBe('invalid');
    // A later encounter can create a new live effect at the same Location.
    expect(resolveGuildService({ ...input, transactionId: 'new-threat', state: { ...done.value!.nextState, availableThreatIds: [deerTarget] } }).status).toBe('resolved');
  });
});
