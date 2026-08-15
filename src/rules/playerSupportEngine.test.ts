import { describe, expect, it } from 'vitest';
import {
  PRINTED_EFFECT_BY_OWNER,
  advanceKnittingProject,
  createTrinketRecord,
  createManualEffectDraft,
  enrichEncounterSupportDraft,
  expireEncounterMapMutations,
  reconcileTrinketLedger,
  resolveEncounterMapConsequences,
  resolveFollowUpCard,
  resolveFollowUpCardSet,
  type CanonicalToolState,
  type TravelGraphNode
} from './index';

const graph = (): Record<string, TravelGraphNode> => ({
  loch: { id: 'loch', name: 'Bluewater', region: 'Loch', locationType: 'Wilds', x: 0, y: 0, edges: [{ to: 'forest', kind: 'waterway' }, { to: 'settlement', kind: 'waterway' }] },
  forest: { id: 'forest', name: 'Oak Road', region: 'Forest', locationType: 'Wilds', x: 1, y: 0, edges: [{ to: 'loch', kind: 'waterway' }, { to: 'far', kind: 'path' }] },
  settlement: { id: 'settlement', name: 'Reedbank', region: 'Bog', locationType: 'Settlement', x: 0, y: 1, edges: [{ to: 'loch', kind: 'waterway' }] },
  near: { id: 'near', name: 'Mossbank', region: 'Bog', locationType: 'Wilds', x: 1, y: 1, edges: [] },
  far: { id: 'far', name: 'Farhill', region: 'Meadow', locationType: 'Settlement', x: 2, y: 0, edges: [{ to: 'forest', kind: 'path' }] }
});

const encounterDraft = (ownerId: string, choice = '') => {
  const effect = PRINTED_EFFECT_BY_OWNER.get(ownerId)!;
  return enrichEncounterSupportDraft(createManualEffectDraft(effect, 'encounter', { locationId: 'loch' }, 1), choice);
};

describe('player support closure', () => {
  it('[TRAVEL-009] validates and applies the nearest printed movement target', () => {
    const draft = encounterDraft('travel-bog-j-winter', 'Stop and help: Mark 2 Days, gain 3 Reputation, and move to the nearest Settlement');
    draft.actionTargets['travel-bog-j-winter:nearest-settlement'] = 'location:settlement';
    const resolved = resolveEncounterMapConsequences({ draft, transactionId: 'move:1', currentLocationId: 'loch', currentSeason: 'Winter', graph: graph(), existingMutations: [] });
    expect(resolved.value?.currentLocationId).toBe('settlement');

    draft.actionTargets['travel-bog-j-winter:nearest-settlement'] = 'location:far';
    expect(resolveEncounterMapConsequences({ draft, transactionId: 'move:2', currentLocationId: 'loch', currentSeason: 'Winter', graph: graph(), existingMutations: [] }).status).toBe('invalid');
  });

  it('[TRAVEL-009] adds a real nearby Path and enforces the Turning Fortune cost', () => {
    const draft = encounterDraft('travel-forest-j-autumn');
    const mapAction = draft.actionTemplates.find(row => row.kind === 'record-map-change')!;
    const dayAction = draft.actionTemplates.find(row => row.kind === 'modify-days')!;
    draft.actionTargets[mapAction.id] = 'location:near';
    expect(resolveEncounterMapConsequences({ draft, transactionId: 'path:bad', currentLocationId: 'loch', currentSeason: 'Autumn', graph: graph(), existingMutations: [] }).status).toBe('invalid');
    draft.selectedActionIds.push(dayAction.id);
    const resolved = resolveEncounterMapConsequences({ draft, transactionId: 'path:ok', currentLocationId: 'loch', currentSeason: 'Autumn', graph: graph(), existingMutations: [] });
    expect(resolved.value?.mutations[0]).toMatchObject({ kind: 'add-path', nodeIds: ['loch', 'near'] });
  });

  it('[TRAVEL-009] resolves follow-up cards and persists seasonal map conditions', () => {
    const hornweed = encounterDraft('travel-loch-9-10-autumn', 'Leave It: draw a card and resolve whether Hornweed spreads');
    const followUp = resolveFollowUpCard(hornweed, { suit: '♣', value: 7 });
    hornweed.inputValues['follow-up-card'] = followUp.label;
    hornweed.inputValues['follow-up-suit'] = followUp.card.suit;
    hornweed.inputValues['follow-up-result'] = followUp.outcome;
    const spread = resolveEncounterMapConsequences({ draft: hornweed, transactionId: 'hornweed', currentLocationId: 'loch', currentSeason: 'Autumn', graph: graph(), existingMutations: [] });
    expect(spread.value?.mutations[0]).toMatchObject({ kind: 'rarity-modifier', amount: 3, expiresAtSeason: 'Winter' });
    expect(expireEncounterMapMutations(spread.value!.mutations, 'Autumn', 'Winter')[0].active).toBe(false);

    const murk = encounterDraft('travel-loch-m-summer', 'Change Course');
    murk.actionTargets['travel-loch-m-summer:retreat'] = 'location:forest';
    const retreated = resolveEncounterMapConsequences({ draft: murk, transactionId: 'murk', currentLocationId: 'loch', currentSeason: 'Summer', graph: graph(), existingMutations: [] });
    expect(retreated.value).toMatchObject({ currentLocationId: 'forest', mutations: [{ kind: 'block-location', nodeIds: ['loch'] }] });
  });

  it('[TRAVEL-009] resolves multi-card contests without collapsing M face cards', () => {
    const fish = encounterDraft('travel-loch-5-6', 'Grabby Paws: draw one card for you and one for the Big Fish');
    expect(fish.inputFields.filter(field => field.type === 'card-reference').map(field => field.id)).toEqual(['follow-up-card-player', 'follow-up-card-fish']);
    expect(resolveFollowUpCardSet(fish, {
      'follow-up-card-player': { suit: '♥', value: 13 },
      'follow-up-card-fish': { suit: '♠', value: 11 }
    })).toContain('gain every Part');

    const race = encounterDraft('travel-loch-j-spring', 'Race: draw two cards for the bird and one for you');
    expect(resolveFollowUpCardSet(race, {
      'follow-up-card-bird-1': { suit: '♥', value: 5 },
      'follow-up-card-bird-2': { suit: '♦', value: 8 },
      'follow-up-card-player': { suit: '♣', value: 9 }
    })).toContain('gain 1 Trinket');

    const pirates = encounterDraft('travel-loch-j-summer', 'Ship-to-Ship Combat: compare your total with two Pirate cards');
    expect(pirates.inputFields.find(field => field.id === 'follow-up-card-player-2')?.required).toBe(false);
    expect(resolveFollowUpCardSet(pirates, {
      'follow-up-card-player-1': { suit: '♥', value: 8 },
      'follow-up-card-player-2': { suit: '♦', value: 7 },
      'follow-up-card-pirates-1': { suit: '♣', value: 5 },
      'follow-up-card-pirates-2': { suit: '♠', value: 6 }
    })).toContain('escape to an adjacent Location');
  });

  it('[TOOL-004] carries a Knitting project across Preparing to Leave phases', () => {
    const needles: CanonicalToolState = { instanceId: 'needles', toolId: 'knitting-needles', upgradeId: null, charges: null, broken: false, consumed: false, acquiredBy: 'test', appliedEffectIds: [] };
    const first = advanceKnittingProject({ transactionId: 'knit:1', state: { trinkets: 0, inventory: [], tools: [needles], appliedTransactionIds: [], journalEvents: [] }, activeProject: null, projectId: 'knitted-scarf', hoursToSpend: 3, availableHours: 3, currentDay: 1 });
    expect(first.project).toMatchObject({ projectId: 'knitted-scarf', hoursCompleted: 3, hoursRequired: 5 });
    expect(first.value?.inventory).toHaveLength(0);
    const second = advanceKnittingProject({ transactionId: 'knit:2', state: first.value!, activeProject: first.project!, projectId: 'knitted-scarf', hoursToSpend: 2, availableHours: 4, currentDay: 2, journalNote: 'A river pattern and thoughts of home.' });
    expect(second.project).toBeNull();
    expect(second.completedItem?.craftedItemId).toBe('knitted-scarf');
  });

  it('[ALMANACK-002] journals one representative when several Trinkets are gained together', () => {
    const gained = reconcileTrinketLedger({ previousCount: 1, nextCount: 3, records: [], legacyCount: 1, transactionId: 'reward', acquiredAt: 4, source: 'Encounter reward', journalEntryId: 'journal' });
    expect(gained.createdRecords).toHaveLength(1);
    expect(gained.legacyCount).toBe(2);
    expect(gained.createdRecords.every(row => row.object && row.material && row.origin && !row.spent)).toBe(true);
    const spent = reconcileTrinketLedger({ previousCount: 3, nextCount: 1, records: gained.records, legacyCount: gained.legacyCount, transactionId: 'spend', acquiredAt: 5, source: 'Spend', journalEntryId: 'journal:2' });
    expect(spent.legacyCount).toBe(0);
    expect(spent.records.filter(row => row.spent)).toHaveLength(0);
    const spentAll = reconcileTrinketLedger({ previousCount: 1, nextCount: 0, records: spent.records, legacyCount: spent.legacyCount, transactionId: 'spend-all', acquiredAt: 6, source: 'Spend', journalEntryId: 'journal:3' });
    expect(spentAll.records.filter(row => row.spent)).toHaveLength(1);
    const selected = reconcileTrinketLedger({ previousCount: 3, nextCount: 2, records: gained.records, legacyCount: gained.legacyCount, transactionId: 'selected', acquiredAt: 7, source: 'Discard', journalEntryId: 'journal:4', preferredSpentRecordIds: [gained.records[0].trinketId] });
    expect(selected.spentRecordIds).toEqual([gained.records[0].trinketId]);
    expect(selected.legacyCount).toBe(2);
  });

  it('[ALMANACK-002] transcribes the p.56 six row without shifting the table columns', () => {
    const row = createTrinketRecord({ transactionId: 'row-six', cards: [6, 6, 6], acquiredAt: 1, source: 'Test', journalEntryId: 'journal' });
    expect(row).toMatchObject({ object: 'Toy / Entertainment', material: 'Animal / Repurposed', origin: 'Part of a collection' });
  });
});
