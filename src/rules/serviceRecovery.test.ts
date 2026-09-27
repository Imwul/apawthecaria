import { describe, expect, it } from 'vitest';
import { beginPickOfTheDeep, collectGuildRetrievalsAtLocation, completeGuildServiceDelivery, guildRetrievalTargets, resolveGuildService, type ServiceRuntimeState } from './serviceEngine';
import { REAGENTS } from './data/reagents';
import { TOOLS } from './data/tools';
import type { EngineInventoryItem, TravelGraphNode } from './gameplay';
import { resolveUnbuckled, recoverUnbuckledCache } from './travelEncounterRuntime';
import { migrateSavedRulesState } from './migrations';

const state = (): ServiceRuntimeState => {
  const graph: Record<string, TravelGraphNode> = {};
  for (let i = 0; i <= 5; i++) graph[`n${i}`] = {
    id: `n${i}`, name: i === 0 ? 'Vessel' : `Stop ${i}`, region: 'Forest', locationType: i === 0 ? 'City' : 'Settlement',
    edges: [...(i > 0 ? [{ to: `n${i - 1}`, kind: 'path' as const }] : []), ...(i < 5 ? [{ to: `n${i + 1}`, kind: 'path' as const }] : [])]
  };
  return { currentLocationId: 'n0', currentLocationName: 'Vessel', currentLocationType: 'City', currentRegion: 'Forest', currentSeason: 'Spring', calendarDays: 0,
    trinkets: 20, inventory: [], graph, mapMutations: [], pendingServices: [], usedJourneyServiceIds: [], weatherProtectionMoves: 0,
    weatherProtectionActive: false, travelEncounterRerolls: 0, missiveSettlementIds: [], removedThreatIds: [], appliedTransactionIds: [], journalEvents: [] };
};
const titan = REAGENTS.filter(row => row.type === 'TITAN').sort((a, b) => a.baseRarity - b.baseRarity)[0];
const choice = { selectedReagentId: titan.id, selectedPreparationId: titan.preparations[0].id };
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

describe('p.61 paid draws and delayed deliveries', () => {
  it('honours either printed Forecast price without changing its three-Move protection', () => {
    const bog: ServiceRuntimeState = { ...state(), currentLocationType: 'Settlement', currentRegion: 'Bog' };
    for (const forecastPayment of [1, 2] as const) {
      const result = resolveGuildService({ transactionId: `forecast:${forecastPayment}`, serviceId: 'forecast', state: bog, forecastPayment, journalNote: '날씨 예보' });
      expect(result.status).toBe('resolved');
      expect(result.value!.nextState).toMatchObject({ trinkets: 20 - forecastPayment, weatherProtectionMoves: 3 });
    }
    expect(resolveGuildService({ transactionId: 'poor-forecast', serviceId: 'forecast', state: { ...bog, trinkets: 1 }, forecastPayment: 2, journalNote: '예보' }).status).toBe('invalid');
    expect(bog.trinkets).toBe(20);
  });

  it('persists the paid card before selection; reload and cancellation cannot reroll or charge twice', () => {
    const paid = beginPickOfTheDeep({ transactionId: 'pay', state: { ...state(), trinkets: 2 }, card: 12, journalNote: '잠수 의뢰' });
    expect(paid.status).toBe('manual');
    const restored = copy(paid.value!.nextState);
    expect(restored.trinkets).toBe(0);
    expect(restored.pendingServices[0].paidDrawCard).toBe(12);
    expect(beginPickOfTheDeep({ transactionId: 'again', state: restored, card: 12, journalNote: '' }).status).toBe('invalid');
    expect(resolveGuildService({ transactionId: 'bad-choice', serviceId: 'pick-of-the-deep', state: restored, journalNote: '잠수' }).status).toBe('invalid');
    const acquired = resolveGuildService({ transactionId: 'receive', serviceId: 'pick-of-the-deep', state: restored, card: 1, ...choice, journalNote: '수확' });
    expect(acquired.status).toBe('resolved');
    expect(acquired.value!.nextState.trinkets).toBe(0);
    expect(acquired.value!.nextState.inventory).toHaveLength(1);
    expect(acquired.value!.nextState.pendingServices[0].status).toBe('completed');
    expect(resolveGuildService({ transactionId: 'receive', serviceId: 'pick-of-the-deep', state: acquired.value!.nextState, ...choice, journalNote: '중복' }).status).toBe('invalid');
    expect(resolveGuildService({ transactionId: 'another', serviceId: 'pick-of-the-deep', state: acquired.value!.nextState, ...choice, journalNote: '다시' }).status).toBe('invalid');
  });

  it('charges a failed low draw once and rejects insufficient funds or the wrong city', () => {
    const original = state();
    const failed = beginPickOfTheDeep({ transactionId: 'low', state: original, card: 1, journalNote: '' });
    expect(failed.status).toBe('resolved');
    expect(failed.value!.nextState).toMatchObject({ trinkets: 18, inventory: [], pendingServices: [] });
    expect(original.trinkets).toBe(20);
    expect(beginPickOfTheDeep({ transactionId: 'low', state: failed.value!.nextState, card: 12, journalNote: '' }).status).toBe('invalid');
    expect(beginPickOfTheDeep({ transactionId: 'poor', state: { ...original, trinkets: 1 }, card: 12, journalNote: '' }).status).toBe('invalid');
    expect(beginPickOfTheDeep({ transactionId: 'wrong', state: { ...original, currentLocationName: 'Odoak' }, card: 12, journalNote: '' }).status).toBe('invalid');
  });

  it('delivers lost items and tools together, only at the chosen stop, once across reload', () => {
    const tool = TOOLS.find(row => row.id === 'belt-knife')!;
    const dropped = lostState([{ id: 'old', name: '잃어버린 수첩', type: 'item', weight: 0.5, quantity: 1 },
      { id: 'old-knife', name: tool.canonicalName, type: 'tool', weight: tool.weight, canonicalToolId: tool.id }]);
    const first = resolveGuildService({ transactionId: 'notebook', serviceId: 'retrieval', state: dropped, targetIds: ['n5'], journalNote: '분실물',
      lostItem: { cacheId: 'drop:unbuckled-cache', itemId: 'old' } });
    const second = resolveGuildService({ transactionId: 'knife', serviceId: 'retrieval', state: first.value!.nextState, targetIds: ['n5'], journalNote: '잃어버린 칼',
      lostItem: { cacheId: 'drop:unbuckled-cache', itemId: 'old-knife' } });
    expect(second.value!.nextState.trinkets).toBe(10);
    expect(completeGuildServiceDelivery({ transactionId: 'early', serviceTransactionId: 'notebook', state: second.value!.nextState }).status).toBe('invalid');
    const arrived = collectGuildRetrievalsAtLocation({ ...copy(second.value!.nextState), currentLocationId: 'n5' }, 'arrive');
    expect(arrived.inventory.map(row => row.id)).toEqual(['old', 'old-knife']);
    expect(arrived.pendingServices.every(row => row.status === 'completed')).toBe(true);
    expect(collectGuildRetrievalsAtLocation(copy(arrived), 'reload').inventory).toEqual(arrived.inventory);
    expect(arrived.inventory[1].canonicalToolId).toBe(tool.id);
    expect(guildRetrievalTargets(arrived)).toEqual([]);
    expect(recoverUnbuckledCache({ cache: arrived.retrievalCaches![0], currentLocationId: 'n2', card: 12, foragingPoints: 0 }).status).toBe('invalid');
  });

  it('rejects missing requests, Titan reagents, and invalid lost items before payment', () => {
    const base = { transactionId: 'invalid', serviceId: 'retrieval' as const, state: state(), targetIds: ['n5'], journalNote: '회수' };
    expect(resolveGuildService(base).status).toBe('invalid');
    expect(resolveGuildService({ ...base, ...choice }).status).toBe('invalid');
    for (const weight of [-1, NaN, Infinity]) expect(resolveGuildService({ ...base, requestedItem: { id: 'x', name: '수첩', type: 'item', weight } }).status).toBe('invalid');
    expect(resolveGuildService({ ...base, targetIds: ['n4'], requestedItem: { id: 'x', name: '수첩', type: 'item', weight: 1 } }).status).toBe('invalid');
    expect(base.state.trinkets).toBe(20);
  });

  it('rejects stale paid-result confirmation even when money is still available', () => {
    let paid = beginPickOfTheDeep({ transactionId: 'paid-id', state: state(), card: { value: 10, suit: '♣' }, journalNote: '' }).value!.nextState;
    for (let i = 0; i < 3; i++) {
      paid = copy(paid); // selection cancellation has no domain mutation
      expect(paid.pendingServices[0]).toMatchObject({ transactionId: 'paid-id', paidDrawCard: { value: 10, suit: '♣' } });
      expect(paid.trinkets).toBe(18);
    }
    const input = { transactionId: 'finish', serviceId: 'pick-of-the-deep' as const, paidDrawTransactionId: 'paid-id', ...choice, journalNote: '수확' };
    const done = resolveGuildService({ ...input, state: paid }).value!.nextState;
    expect(resolveGuildService({ ...input, transactionId: 'stale-dialog', state: copy(done), card: 12 }).status).toBe('invalid');
    expect(done.inventory).toHaveLength(1);
    expect(done.trinkets).toBe(18);
    expect(migrateSavedRulesState(copy({ pendingServices: paid.pendingServices })).pendingServices).toEqual(paid.pendingServices);
  });

  it.each([
    { id: 'herb', name: 'Dandelions', type: 'reagent', weight: 1 / 3, canonicalReagentId: 'dandelions', preparationId: 'flowers', usesRemaining: 1 },
    { id: 'coat', name: 'Knitted Coat', type: 'item', weight: 1, craftedItemId: 'knitted-coat' },
    { id: 'note', name: 'Notebook', type: 'item', weight: 0, guildNote: { kind: 'ledger', region: 'Forest' } },
    { id: 'token', name: 'Keepsake', type: 'trinket', weight: 1 / 3 }
  ] satisfies EngineInventoryItem[])('restores the original category and metadata of $id', item => {
    const dropped = lostState([item]);
    const request = { transactionId: 'hire', serviceId: 'retrieval' as const, targetIds: ['n5'], journalNote: '회수', lostItem: { cacheId: 'drop:unbuckled-cache', itemId: item.id } };
    const sent = resolveGuildService({ ...request, state: dropped }).value!.nextState;
    expect(sent.inventory).toEqual([]);
    expect(resolveGuildService({ ...request, transactionId: 'second-hire', state: copy(sent) }).status).toBe('invalid');
    const received = collectGuildRetrievalsAtLocation({ ...copy(sent), currentLocationId: 'n5' }, 'arrival');
    expect(received.inventory).toEqual([item]);
    expect(collectGuildRetrievalsAtLocation(copy(received), 'again').inventory).toEqual([item]);
  });

  it('rejects current/arbitrary items, and cancelling before confirmation does not reserve or pay', () => {
    const item: EngineInventoryItem = { id: 'held', name: 'My notebook', type: 'item', weight: 1 };
    const current = { ...state(), inventory: [item] };
    const input = { transactionId: 'held', serviceId: 'retrieval' as const, state: current, targetIds: ['n5'], journalNote: '회수' };
    expect(resolveGuildService({ ...input, requestedItem: item }).status).toBe('invalid');
    expect(resolveGuildService({ ...input, lostItem: { cacheId: 'invented', itemId: item.id } }).status).toBe('invalid');
    const dropped = lostState([item]);
    expect(guildRetrievalTargets(copy(dropped))).toEqual(guildRetrievalTargets(dropped));
    expect(dropped.trinkets).toBe(20);
    expect(current.inventory).toEqual([item]);
  });

  it('preserves upgraded-tool instance state, charges and adjusted weight', () => {
    const item: EngineInventoryItem = { id: 'knife', type: 'tool', name: 'Pairing Knife', weight: 0, canonicalToolId: 'belt-knife' };
    const original = lostState([item]);
    const tool = { instanceId: 'knife', toolId: 'belt-knife', upgradeId: 'pairing-knife', charges: 2, broken: true, consumed: false, acquiredBy: 'market', appliedEffectIds: ['upgrade'], weightAdjustment: -1 / 3 };
    original.retrievalCaches![0].toolStates = [tool];
    const sent = resolveGuildService({ transactionId: 'hire', serviceId: 'retrieval', state: original, targetIds: ['n5'], journalNote: '칼', lostItem: { cacheId: 'drop:unbuckled-cache', itemId: 'knife' } }).value!.nextState;
    const received = collectGuildRetrievalsAtLocation({ ...copy(sent), currentLocationId: 'n5', toolStates: [] }, 'arrival');
    expect(received.inventory).toEqual([item]);
    expect(received.toolStates).toEqual([tool]);
  });
});

function lostState(items: EngineInventoryItem[]): ServiceRuntimeState {
  const original = state();
  const drop = resolveUnbuckled({ transactionId: 'drop', choice: 'too-important', graph: original.graph,
    currentLocationId: 'n5', inventory: items, dropSuit: '♠', cacheLocationId: 'n2' });
  expect(drop.status).toBe('resolved');
  return { ...original, inventory: drop.value!.inventory, retrievalCaches: [drop.value!.cache!] };
}
