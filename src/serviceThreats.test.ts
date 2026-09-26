import { describe, expect, it } from 'vitest';
import { guildThreatTargets, removeGuildThreat } from './serviceThreats';
import { resolveGuildService, type ServiceRuntimeState } from './rules/serviceEngine';

const state = () => ({
  barrows: [{ id: 'one', name: '고분', locationName: '숲' }, { id: 'gone', name: '옛 고분', locationName: '산', removed: true }],
  pursuedByBehemoth: { headStart: 2 }, activeDelve: null as { barrowId: string } | null,
  mapEncounterRecords: [{ id: 'bear', label: '성난 곰', locationName: '숲' }, { id: 'note', label: '약초 군락', locationName: '숲' }]
});

describe('Scare Tactics targets', () => {
  it('offers only live threats, including pursuit and marked bears', () => {
    expect(guildThreatTargets(state()).map(row => row.id)).toEqual(['barrow:one', 'pursuit:behemoth', 'record:bear']);
    expect(guildThreatTargets({ ...state(), activeDelve: { barrowId: 'one' } }).some(row => row.id === 'barrow:one')).toBe(false);
  });
  it('removes only the selected target and preserves unrelated notes across reload', () => {
    const original = state();
    const removed = removeGuildThreat(original, 'record:bear');
    expect(removed.mapEncounterRecords.map(row => row.id)).toEqual(['note']);
    expect(removed.barrows).toEqual(original.barrows);
    expect(removed.pursuedByBehemoth).toEqual(original.pursuedByBehemoth);
    expect(guildThreatTargets(JSON.parse(JSON.stringify(removed))).some(row => row.id === 'record:bear')).toBe(false);
    expect(removeGuildThreat(original, 'record:note')).toBe(original);
    expect(removeGuildThreat(original, 'pursuit:behemoth').pursuedByBehemoth).toBeNull();
    expect(removeGuildThreat(original, 'barrow:one').barrows[0].removed).toBe(true);
  });
  it('does not charge for stale or already removed targets', () => {
    const runtime: ServiceRuntimeState = { currentLocationId: 'odoak', currentLocationName: 'Odoak', currentLocationType: 'City', currentRegion: 'Forest', currentSeason: 'Spring', calendarDays: 0,
      trinkets: 20, inventory: [], graph: {}, mapMutations: [], pendingServices: [], usedJourneyServiceIds: [], weatherProtectionMoves: 0, weatherProtectionActive: false,
      travelEncounterRerolls: 0, missiveSettlementIds: [], removedThreatIds: [], availableThreatIds: ['record:bear'], appliedTransactionIds: [], journalEvents: [] };
    const input = { transactionId: 'scare', serviceId: 'scare-tactics' as const, targetIds: ['record:bear'], journalNote: '곰을 쫓았다.' };
    const done = resolveGuildService({ ...input, state: runtime });
    expect(done.value!.nextState.trinkets).toBe(12);
    expect(resolveGuildService({ ...input, transactionId: 'twice', state: done.value!.nextState }).status).toBe('invalid');
    expect(resolveGuildService({ ...input, targetIds: ['unknown'], state: runtime }).status).toBe('invalid');
  });
});
