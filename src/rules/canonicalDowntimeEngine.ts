import type { EngineInventoryItem, EngineJournalEvent, TravelGraphNode } from './gameplay';
import type { RuleTag, Season } from './types';

export interface AilmentTagOverride {
  id: string;
  ailmentId: string;
  originalTag: RuleTag;
  replacementTag: RuleTag;
  transactionId: string;
}

export interface CanonicalDowntimeState {
  downtimeCompleted: boolean;
  reputation: number;
  trinkets: number;
  speed: number;
  carry: number;
  currentLocationId: string;
  currentSeason: Season;
  inventory: EngineInventoryItem[];
  graph: Record<string, TravelGraphNode>;
  ailmentTagOverrides: AilmentTagOverride[];
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

type CanonicalDowntimeInput =
  | { activity: 'general-practice'; ailmentId: string; originalTag: RuleTag; replacementTag: RuleTag }
  | { activity: 'replenish'; items: EngineInventoryItem[]; totalCapacity: number }
  | { activity: 'explore'; fromId: string; toId: string; kind: 'path' | 'waterway' }
  | { activity: 'self-improvement'; choice: 'speed' | 'carry' }
  | { activity: 'reconnect'; nearestCityId: string; noteItem: EngineInventoryItem };

export const resolveCanonicalDowntime = (transactionId: string, state: CanonicalDowntimeState, input: CanonicalDowntimeInput): CanonicalDowntimeState => {
  if (!transactionId || state.appliedTransactionIds.includes(transactionId) || state.downtimeCompleted) throw new Error('Exactly one unapplied Downtime activity is required.');
  let next: CanonicalDowntimeState = { ...state };
  if (input.activity === 'general-practice') {
    if (input.originalTag === input.replacementTag) throw new Error('General Practice must change one Ailment Tag.');
    next = { ...next, trinkets: next.trinkets + 5, ailmentTagOverrides: [...next.ailmentTagOverrides, { id: `override:${transactionId}`, ailmentId: input.ailmentId, originalTag: input.originalTag, replacementTag: input.replacementTag, transactionId }] };
  } else if (input.activity === 'replenish') {
    const weight = input.items.reduce((sum, item) => sum + item.weight * Math.max(1, item.quantity || 1), 0);
    if (weight > input.totalCapacity) throw new Error('Replenish selections exceed Inventory capacity.');
    next = { ...next, inventory: input.items };
  } else if (input.activity === 'explore') {
    const from = next.graph[input.fromId];
    const to = next.graph[input.toId];
    if (!from || !to || input.fromId === input.toId || from.edges.some(edge => edge.to === input.toId)) throw new Error('Explore requires two distinct, nearby, unconnected Locations.');
    next = { ...next, graph: { ...next.graph, [from.id]: { ...from, edges: [...from.edges, { to: to.id, kind: input.kind }] }, [to.id]: { ...to, edges: [...to.edges, { to: from.id, kind: input.kind }] } } };
  } else if (input.activity === 'self-improvement') {
    next = input.choice === 'speed' ? { ...next, speed: next.speed + 1 } : { ...next, carry: next.carry + 1 };
  } else {
    if (!next.graph[input.nearestCityId] || next.graph[input.nearestCityId].locationType !== 'City') throw new Error('Reconnect requires the nearest canonical City.');
    next = { ...next, currentLocationId: input.nearestCityId, inventory: [...next.inventory, input.noteItem] };
  }
  return { ...next, downtimeCompleted: true, appliedTransactionIds: [...next.appliedTransactionIds, transactionId], journalEvents: [...next.journalEvents, { id: `${transactionId}:journal`, type: 'downtime', title: `Downtime: ${input.activity}`, text: 'Canonical Downtime transaction applied.' }] };
};
