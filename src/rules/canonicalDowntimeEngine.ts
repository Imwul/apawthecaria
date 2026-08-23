import { AILMENT_BY_ID } from './data/ailments';
import { REAGENT_BY_ID } from './data/reagents';
import type { EngineInventoryItem, EngineJournalEvent, TravelGraphNode } from './gameplay';
import type { AilmentSeverity, Region, RequirementExpression, RuleTag, Season } from './types';

export interface AilmentTagOverride {
  id: string;
  ailmentId: string;
  originalTag: RuleTag;
  replacementTag: RuleTag;
  transactionId: string;
}

export interface CanonicalDowntimeState {
  downtimeRequired: boolean;
  downtimeCompleted: boolean;
  reputation: number;
  trinkets: number;
  speed: number;
  carry: number;
  travelStyle: string;
  currentLocationId: string;
  currentSeason: Season;
  inventory: EngineInventoryItem[];
  graph: Record<string, TravelGraphNode>;
  ailmentTagOverrides: AilmentTagOverride[];
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

type CanonicalDowntimeInput =
  | { activity: 'general-practice'; ailmentId: string; originalTag: RuleTag; replacementTag: RuleTag; journalText?: string }
  | { activity: 'replenish'; items: EngineInventoryItem[]; addedItemIds?: string[]; totalCapacity: number; journalText?: string }
  | { activity: 'explore'; fromId: string; toId: string; kind: 'path' | 'waterway'; playerConfirmedClose: boolean; journalText?: string }
  | { activity: 'self-improvement'; choice: 'speed' | 'carry' | 'style'; travelStyle?: string; styleSpeed?: number; styleCarry?: number; journalText?: string }
  | { activity: 'reconnect'; nearestCityId: string; noteItem: EngineInventoryItem; journalText?: string };

const SEVERITY_ORDER: readonly AilmentSeverity[] = ['lesser', 'intermediate', 'severe', 'dire'];
const maxSeverityForReputation = (reputation: number): AilmentSeverity => {
  if (reputation >= 35) return 'dire';
  if (reputation >= 25) return 'severe';
  if (reputation >= 15) return 'intermediate';
  return 'lesser';
};

const requirementTags = (requirement: RequirementExpression): RuleTag[] => {
  if (requirement.kind === 'tag') return [requirement.tag];
  if (requirement.kind === 'special') return [];
  if (requirement.kind === 'alternatives') return requirement.alternatives.flatMap(requirementTags);
  return requirement.requirements.flatMap(requirementTags);
};

const graphDistances = (graph: Record<string, TravelGraphNode>, startId: string) => {
  const distances = new Map<string, number>();
  if (!graph[startId]) return distances;
  distances.set(startId, 0);
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const distance = distances.get(id)!;
    graph[id].edges.forEach(edge => {
      if (!graph[edge.to] || distances.has(edge.to)) return;
      distances.set(edge.to, distance + 1);
      queue.push(edge.to);
    });
  }
  return distances;
};

const validateReplenish = (
  state: CanonicalDowntimeState,
  input: Extract<CanonicalDowntimeInput, { activity: 'replenish' }>
) => {
  const ids = input.items.map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Replenish Inventory item IDs must be unique.');
  const weight = input.items.reduce((sum, item) => sum + item.weight * Math.max(1, item.quantity || 1), 0);
  if (weight > input.totalCapacity) throw new Error('Replenish selections exceed Inventory capacity.');
  const addedIds = new Set(input.addedItemIds || input.items.filter(item => item.type === 'reagent').map(item => item.id));
  if (addedIds.size === 0) throw new Error('Replenish requires at least one canonical Reagent Part.');
  const region = state.graph[state.currentLocationId]?.region;
  if (!region || region === 'Soar') throw new Error('Replenish requires the canonical Region where the last Journey ended.');
  input.items.filter(item => addedIds.has(item.id)).forEach(item => {
    const reagent = item.canonicalReagentId ? REAGENT_BY_ID.get(item.canonicalReagentId) : null;
    const preparation = reagent?.preparations.find(row => row.id === item.preparationId);
    if (!reagent || !preparation || item.type !== 'reagent') throw new Error('Replenish requires canonical Reagent Preparations.');
    if (reagent.regionAvailability[region] === 'Unavailable' || reagent.seasonAvailability[state.currentSeason] !== 'Common') {
      throw new Error(`${reagent.canonicalName} is not both local and in season.`);
    }
  });
};

export const resolveCanonicalDowntime = (transactionId: string, state: CanonicalDowntimeState, input: CanonicalDowntimeInput): CanonicalDowntimeState => {
  if (!transactionId || state.appliedTransactionIds.includes(transactionId) || !state.downtimeRequired || state.downtimeCompleted) throw new Error('Exactly one unapplied Downtime activity after a Journey is required.');
  let next: CanonicalDowntimeState = { ...state };
  if (input.activity === 'general-practice') {
    const ailment = AILMENT_BY_ID.get(input.ailmentId);
    if (!ailment) throw new Error('General Practice requires a canonical Ailment.');
    if (SEVERITY_ORDER.indexOf(ailment.severity) > SEVERITY_ORDER.indexOf(maxSeverityForReputation(state.reputation))) {
      throw new Error('General Practice cannot choose an Ailment above the current Reputation tier.');
    }
    if (input.originalTag === input.replacementTag) throw new Error('General Practice must change one Ailment Tag.');
    if (input.replacementTag === 'FAIR' || input.replacementTag === 'FOUL') throw new Error('General Practice requires a Remedy Tag.');
    if (!requirementTags(ailment.requirements).includes(input.originalTag)) throw new Error('The selected original Tag is not part of this Ailment.');
    next = { ...next, trinkets: next.trinkets + 5, ailmentTagOverrides: [...next.ailmentTagOverrides, { id: `override:${transactionId}`, ailmentId: input.ailmentId, originalTag: input.originalTag, replacementTag: input.replacementTag, transactionId }] };
  } else if (input.activity === 'replenish') {
    validateReplenish(state, input);
    next = { ...next, inventory: input.items };
  } else if (input.activity === 'explore') {
    const from = next.graph[input.fromId];
    const to = next.graph[input.toId];
    if (!from || !to || input.fromId === input.toId || from.edges.some(edge => edge.to === input.toId)) throw new Error('Explore requires two distinct, nearby, unconnected Locations.');
    if (!input.playerConfirmedClose) throw new Error('Explore requires the player to confirm both Locations are close to where the last Journey ended.');
    next = { ...next, graph: { ...next.graph, [from.id]: { ...from, edges: [...from.edges, { to: to.id, kind: input.kind }] }, [to.id]: { ...to, edges: [...to.edges, { to: from.id, kind: input.kind }] } } };
  } else if (input.activity === 'self-improvement') {
    if (input.choice === 'speed') next = { ...next, speed: next.speed + 1 };
    else if (input.choice === 'carry') next = { ...next, carry: next.carry + 1 };
    else {
      if (!input.travelStyle?.trim() || !Number.isFinite(input.styleSpeed) || !Number.isFinite(input.styleCarry)) throw new Error('Changing Travel Style requires its canonical Move and Carry values.');
      next = { ...next, travelStyle: input.travelStyle, speed: input.styleSpeed!, carry: input.styleCarry! };
    }
  } else {
    if (!next.graph[input.nearestCityId] || next.graph[input.nearestCityId].locationType !== 'City') throw new Error('Reconnect requires the nearest canonical City.');
    const distances = graphDistances(next.graph, next.currentLocationId);
    const nearestDistance = Math.min(...Object.values(next.graph)
      .filter(node => node.locationType === 'City')
      .map(node => distances.get(node.id) ?? Infinity));
    if ((distances.get(input.nearestCityId) ?? Infinity) !== nearestDistance) throw new Error('Reconnect destination is not a nearest canonical City.');
    if (!input.noteItem.id || input.noteItem.type !== 'item' || !input.noteItem.guildNote) throw new Error('Reconnect requires one canonical Guild note item.');
    const note = input.noteItem.guildNote;
    if (!['ledger', 'map', 'gossip'].includes(note.kind)) throw new Error('Reconnect Guild note kind is invalid.');
    if (note.kind !== 'gossip' && !note.region) throw new Error('Ledgers and Maps require their acquired Region.');
    const expectedWeight = note.kind === 'ledger' ? 1 / 3 : note.kind === 'map' ? 2 / 3 : 0;
    if (Math.abs(input.noteItem.weight - expectedWeight) > Number.EPSILON) throw new Error('Reconnect Guild note has the wrong printed Weight.');
    next = { ...next, currentLocationId: input.nearestCityId, inventory: [...next.inventory, input.noteItem] };
  }
  return {
    ...next,
    downtimeCompleted: true,
    downtimeRequired: false,
    appliedTransactionIds: [...next.appliedTransactionIds, transactionId],
    journalEvents: [...next.journalEvents, {
      id: `${transactionId}:journal`,
      type: 'downtime',
      title: `Downtime: ${input.activity}`,
      text: input.journalText?.trim() || 'Canonical Downtime transaction applied.'
    }]
  };
};

export const getGuildLedgerForagingPointBonus = (inventory: readonly EngineInventoryItem[], region: Region) =>
  inventory.filter(item => item.guildNote?.kind === 'ledger' && item.guildNote.region === region).length * 2;

export const hasGuildLogisticalMap = (inventory: readonly EngineInventoryItem[], region: Region) =>
  inventory.some(item => item.guildNote?.kind === 'map' && item.guildNote.region === region);
