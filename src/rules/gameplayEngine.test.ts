import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  REAGENTS,
  canTreatAilmentWithInventory,
  canonicalMetadata,
  listLegalMoveStops,
  previewMoveStops,
  resolveDowntime,
  resolveAilmentDiagnosisEffect,
  resolveBadIdeaOutcomeEffect,
  resolveEncounter,
  resolveForaging,
  resolvePatient,
  resolveSeason,
  resolveTravel,
  resolveTreatment
} from './index';
import type {
  EncounterDefinition,
  EncounterRuntimeState,
  EngineInventoryItem,
  PatientState,
  SeasonRuntimeState,
  TravelEngineState,
  TravelGraphNode
} from './index';

const travelState = (): TravelEngineState => ({
  currentLocationId: 'start',
  currentLocationName: 'Start',
  currentRegion: 'Bog',
  currentLocationType: 'Wilds',
  baseSpeed: 2,
  carry: 4,
  inventory: [],
  calendarDays: 0,
  visitedLocationIds: ['start'],
  needsLocalHelp: false,
  canSoar: false,
  ridingWagon: false,
  experimentalContraption: false
});

const graph = (waterway = false): Record<string, TravelGraphNode> => ({
  start: { id: 'start', name: 'Start', region: 'Bog', locationType: 'Wilds', edges: [{ to: 'middle', kind: waterway ? 'waterway' : 'path' }] },
  middle: { id: 'middle', name: 'Middle', region: 'Bog', locationType: 'Wilds', edges: [{ to: 'start' }, { to: 'end' }] },
  end: { id: 'end', name: 'End', region: 'Bog', locationType: 'Wilds', edges: [{ to: 'middle' }] }
});

describe('travel and encounter execution', () => {
  it('[MAP-002/MAP-003/TRAVEL-001/TRAVEL-002/TRAVEL-004/TRAVEL-006/TRAVEL-008/SAVE-002/UX-003] moves exactly Speed paths and produces one canonical encounter', () => {
    const result = resolveTravel({
      transactionId: 'travel-1', state: travelState(), graph: graph(), destinationId: 'end',
      destinationRegion: 'Bog', destinationType: 'Wilds', mode: 'move', card: 3,
      season: 'Spring', canStopInLoch: false
    });
    expect(result.value?.pathCount).toBe(2);
    expect(result.value?.nextState.currentLocationId).toBe('end');
    expect(result.value?.nextState.calendarDays).toBe(1);
    expect(result.value?.encounter.encounterType).toBe('travel');
    expect(result.value?.pendingEncounter.encounterId).toBe(result.value?.encounter.id);
    const blocked = resolveTravel({
      transactionId: 'travel-blocked', state: result.value!.nextState, graph: graph(), destinationId: 'start',
      destinationRegion: 'Bog', destinationType: 'Wilds', mode: 'move', card: 3,
      season: 'Spring', canStopInLoch: false
    });
    expect(blocked.status).toBe('invalid');
  });

  it('[TRAVEL-007] enforces Soar carry, Wagon, and unvisited Titan destination restrictions', () => {
    const state = { ...travelState(), canSoar: true, ridingWagon: true };
    const wagon = resolveTravel({
      transactionId: 'soar-wagon', state, graph: graph(), destinationId: 'end',
      destinationRegion: 'Titan', destinationType: 'Titan Ruin', mode: 'soar', card: 3,
      season: 'Spring', canStopInLoch: false
    });
    expect(wagon.status).toBe('invalid');
    const unvisited = resolveTravel({
      transactionId: 'soar-unvisited', state: { ...state, ridingWagon: false }, graph: graph(), destinationId: 'end',
      destinationRegion: 'Titan', destinationType: 'Titan Ruin', mode: 'soar', card: 3,
      season: 'Spring', canStopInLoch: false
    });
    expect(unvisited.status).toBe('invalid');
  });

  it('[TRAVEL-007/TRAVEL-008] uses the seasonal Soar table for City landings and permits Loch landings', () => {
    const soarGraph: Record<string, TravelGraphNode> = {
      start: { id: 'start', name: 'Start', region: 'Bog', locationType: 'Wilds', edges: [] },
      city: { id: 'city', name: 'New Dam', region: 'Forest', locationType: 'City', edges: [] },
      loch: { id: 'loch', name: 'Open Water', region: 'Loch', locationType: 'Wilds', edges: [] }
    };
    const state = { ...travelState(), canSoar: true };
    const city = resolveTravel({
      transactionId: 'soar-city', state, graph: soarGraph, destinationId: 'city',
      destinationRegion: 'Forest', destinationType: 'City', mode: 'soar', card: { suit: '♦', value: 11 },
      season: 'Spring', canStopInLoch: false
    });
    expect(city.value?.nextState.currentLocationId).toBe('city');
    expect(city.value?.encounter).toMatchObject({ encounterType: 'travel', region: 'Soar', season: 'Spring', cardKey: 'J' });

    const loch = resolveTravel({
      transactionId: 'soar-loch', state, graph: soarGraph, destinationId: 'loch',
      destinationRegion: 'Loch', destinationType: 'Wilds', mode: 'soar', card: 3,
      season: 'Spring', canStopInLoch: false
    });
    expect(loch.value?.nextState.currentLocationId).toBe('loch');
    expect(loch.value?.encounter).toMatchObject({ encounterType: 'travel', region: 'Soar', cardKey: '3&4' });
  });

  it('[TRAVEL-004/SAVE-002] rejects re-entered destination metadata that disagrees with the map', () => {
    const result = resolveTravel({
      transactionId: 'travel-metadata', state: travelState(), graph: graph(), destinationId: 'end',
      destinationRegion: 'Forest', destinationType: 'City', mode: 'move', card: 3,
      season: 'Spring', canStopInLoch: false
    });
    expect(result.status).toBe('invalid');
    expect(result.messages.join(' ')).toMatch(/match the selected map node/i);
  });

  it('[TRAVEL-002/TRAVEL-005] limits an overencumbered move to one path and soaks vulnerable inventory on a waterway', () => {
    const state = travelState();
    state.inventory = [{ id: 'wet', name: 'Herb', type: 'reagent', weight: 5, ruinedWhenSoaked: true }];
    const result = resolveTravel({
      transactionId: 'travel-2', state, graph: graph(true), destinationId: 'middle',
      destinationRegion: 'Bog', destinationType: 'Wilds', mode: 'move', card: 3,
      season: 'Spring', canStopInLoch: false
    });
    expect(result.value?.effectiveSpeed).toBe(1);
    expect(result.value?.soakedItemIds).toEqual(['wet']);
    expect(result.value?.nextState.inventory).toHaveLength(0);
  });

  it('[TRAVEL-009/CORE-002] applies automatic encounter effects once and leaves printed manual effects unresolved', () => {
    const encounter: EncounterDefinition = {
      id: 'test-encounter', encounterType: 'travel', region: 'Bog', isSettlement: false, isTitan: false,
      title: 'Test', prompt: 'Test effect', choices: [], support: 'structured-but-not-executed',
      mandatoryEffects: [
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 2 } },
        { support: 'manual-only', effect: { type: 'customEffect', code: 'PRINTED', description: 'Resolve printed text.' } }
      ],
      ...canonicalMetadata(75)
    };
    const state: EncounterRuntimeState = {
      reputation: 1, trinkets: 0, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null,
      movementBlocked: false, conditions: [], appliedEffectIds: []
    };
    const first = resolveEncounter({ transactionId: 'enc-1', encounter, state });
    expect(first.status).toBe('manual');
    expect(first.value?.nextState.reputation).toBe(3);
    const second = resolveEncounter({ transactionId: 'enc-1', encounter, state: first.value!.nextState });
    expect(second.value?.nextState.reputation).toBe(3);
  });
});

describe('How To Move preview', () => {
  const exampleGraph = (): Record<string, TravelGraphNode> => ({
    'mountain-city': {
      id: 'mountain-city', name: 'Mountain City', region: 'Mountain', locationType: 'City',
      edges: [{ to: 'a' }, { to: 'b' }, { to: 'loch-approach' }]
    },
    a: { id: 'a', name: 'A', region: 'Mountain', locationType: 'Wilds', edges: [{ to: 'mountain-city' }, { to: 'd' }] },
    d: { id: 'd', name: 'D', region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'a' }, { to: 'meadow-wilds' }] },
    'meadow-wilds': { id: 'meadow-wilds', name: 'Meadow Wilds', region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'd' }, { to: 'forest-1' }] },
    b: { id: 'b', name: 'B', region: 'Mountain', locationType: 'Wilds', edges: [{ to: 'mountain-city' }, { to: 'c' }] },
    c: { id: 'c', name: 'C', region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'b' }, { to: 'meadow-settlement' }] },
    'meadow-settlement': { id: 'meadow-settlement', name: 'Meadow Settlement', region: 'Meadow', locationType: 'Settlement', edges: [{ to: 'c' }] },
    'loch-approach': {
      id: 'loch-approach', name: 'Loch Approach', region: 'Mountain', locationType: 'Wilds',
      edges: [{ to: 'mountain-city' }, { to: 'loch-mid' }]
    },
    'loch-mid': {
      id: 'loch-mid', name: 'Loch Mid', region: 'Loch', locationType: 'Wilds',
      edges: [
        { to: 'loch-approach', kind: 'waterway' },
        { to: 'loch-wilds', kind: 'waterway' },
        { to: 'loch-city', kind: 'waterway' }
      ]
    },
    'loch-wilds': {
      id: 'loch-wilds', name: 'Loch Wilds', region: 'Loch', locationType: 'Wilds',
      edges: [{ to: 'loch-mid', kind: 'waterway' }]
    },
    'loch-city': {
      id: 'loch-city', name: 'Loch City', region: 'Loch', locationType: 'City',
      edges: [{ to: 'loch-mid', kind: 'waterway' }]
    },
    'forest-1': { id: 'forest-1', name: 'F1', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'meadow-wilds' }, { to: 'forest-wilds' }] },
    'forest-wilds': { id: 'forest-wilds', name: 'Forest Wilds', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'forest-1' }] }
  });

  it('lets a Speed 3 traveller stop in the Meadow Wilds or Meadow Settlement, but not Loch Wilds or Forest Wilds', () => {
    const previews = previewMoveStops({
      graph: exampleGraph(),
      originId: 'mountain-city',
      speed: 3,
      canStopInLoch: false
    });
    expect(previews['meadow-wilds']).toMatchObject({ reason: 'legal', encounterKind: 'travel', cost: 3 });
    expect(previews['meadow-settlement']).toMatchObject({ reason: 'legal', encounterKind: 'social', cost: 3 });
    expect(previews['loch-wilds'].reason).toBe('loch-locked');
    expect(previews['forest-wilds'].reason).toBe('too-far');
    expect(previews.a.reason).toBe('too-close');
    expect(listLegalMoveStops({
      graph: exampleGraph(),
      originId: 'mountain-city',
      speed: 3,
      canStopInLoch: false
    }).sort()).toEqual(['loch-city', 'meadow-settlement', 'meadow-wilds']);
  });

  it('allows swimming a waterway without stopping, and keeps an over-encumbered move to one path', () => {
    const wet = previewMoveStops({
      graph: exampleGraph(),
      originId: 'loch-approach',
      speed: 2,
      canStopInLoch: false
    });
    expect(wet['loch-mid'].reason).toBe('loch-locked');
    expect(wet['loch-wilds'].reason).toBe('loch-locked');
    expect(wet['loch-city']).toMatchObject({ reason: 'legal', usesWaterway: true, encounterKind: 'social' });

    const encumbered = previewMoveStops({
      graph: exampleGraph(),
      originId: 'mountain-city',
      speed: 1,
      canStopInLoch: false
    });
    expect(encumbered.a.reason).toBe('legal');
    expect(encumbered['meadow-wilds'].reason).toBe('too-far');
  });

  it('treats a printed free-path location as already paid when previewing Speed stops', () => {
    const previews = previewMoveStops({
      graph: exampleGraph(),
      originId: 'mountain-city',
      speed: 2,
      canStopInLoch: false,
      freePathLocationIds: ['a']
    });
    expect(previews['meadow-wilds']).toMatchObject({ reason: 'legal', cost: 2 });
  });
});

describe('foraging and treatment transactions', () => {
  it('[FORAGE-001/FORAGE-002/FORAGE-003/FORAGE-004/FORAGE-005/FORAGE-006/FORAGE-008] resolves one Reagent and gains FP on an unboosted failed search', () => {
    const preview = resolveForaging({
      transactionId: 'forage-preview',
      state: { season: 'Spring', currentRegion: 'Bog', currentLocationType: 'Wilds', foragingPoints: 0, inventory: [], toolIds: [] },
      forageRegion: 'Bog', locationRelation: 'current', card: 1, skipEncounter: true
    });
    const candidate = preview.value!.candidates.find(row => row.rarity > 1
      && REAGENTS.find(reagent => reagent.id === row.reagentId)?.preparations.some(part => part.requiredTools.includes('none')))!
    const part = REAGENTS.find(reagent => reagent.id === candidate.reagentId)!.preparations.find(row => row.requiredTools.includes('none'))!;
    const result = resolveForaging({
      transactionId: 'forage-fail', state: preview.value!.nextState, forageRegion: 'Bog',
      locationRelation: 'current', card: 1, targetReagentId: candidate.reagentId,
      parts: [{ preparationId: part.id, quantity: 1 }], skipEncounter: true
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.gatheredItems).toHaveLength(0);
    expect(result.value?.foragingPointsGained).toBe(1);
    expect(result.value?.nextState.foragingPoints).toBe(1);
  });

  it('[FORAGE-002/UX-001] records a known miss without asking for a Part or quantity', () => {
    const state = { season: 'Spring' as const, currentRegion: 'Bog' as const, currentLocationType: 'Wilds' as const, foragingPoints: 0, inventory: [], toolIds: [] };
    const preview = resolveForaging({ transactionId: 'forage-miss-preview', state, forageRegion: 'Bog', locationRelation: 'current', card: 1, skipEncounter: true });
    const missed = preview.value!.candidates.find(candidate => candidate.rarity > 1)!;
    const result = resolveForaging({
      transactionId: 'forage-miss-direct', state, forageRegion: 'Bog', locationRelation: 'current', card: 1,
      targetReagentId: missed.reagentId, declineGather: true, skipEncounter: true
    });
    expect(result.status).toBe('resolved');
    expect(result.value).toMatchObject({ gatheredItems: [], foragingPointsGained: 1, timerCostAfterEncounter: 1 });
    expect(result.value?.nextState.foragingPoints).toBe(1);
  });

  it('[FORAGE-004/FORAGE-005/FORAGE-006/FORAGE-007/SAVE-003] spends only the card gap and stores multiple Parts of one Reagent', () => {
    const baseState = { season: 'Spring' as const, currentRegion: 'Bog' as const, currentLocationType: 'Wilds' as const, foragingPoints: 0, inventory: [], toolIds: [] };
    const preview = resolveForaging({ transactionId: 'forage-p2', state: baseState, forageRegion: 'Bog', locationRelation: 'adjacent', card: 1, skipEncounter: true });
    const candidate = preview.value!.candidates.find(row => row.rarity > 1
      && REAGENTS.find(reagent => reagent.id === row.reagentId)?.preparations.some(part => part.requiredTools.includes('none')))!
    const part = REAGENTS.find(reagent => reagent.id === candidate.reagentId)!.preparations.find(row => row.requiredTools.includes('none'))!;
    const spendingState = { ...baseState, foragingPoints: candidate.gapCost };
    const result = resolveForaging({
      transactionId: 'forage-success', state: spendingState, forageRegion: 'Bog', locationRelation: 'adjacent', card: 1,
      targetReagentId: candidate.reagentId, parts: [{ preparationId: part.id, quantity: 2 }],
      spendForagingPoints: true, skipEncounter: true
    });
    expect(result.value?.foragingPointsSpent).toBe(candidate.gapCost);
    expect(result.value?.gatheredItems).toHaveLength(2);
    expect(result.value?.timerCostAfterEncounter).toBe(3);
    expect(new Set(result.value?.gatheredItems.map(item => item.canonicalReagentId))).toEqual(new Set([candidate.reagentId]));
  });

  it('[CHARACTER-005/FORAGE-001/FORAGE-006] resolves Independent Familiar foraging with a real draw and no Encounter or Timer cost', () => {
    const result = resolveForaging({
      transactionId: 'forage-independent',
      state: { season: 'Spring', currentRegion: 'Forest', currentLocationType: 'Settlement', foragingPoints: 0, inventory: [], toolIds: [] },
      forageRegion: 'Meadow',
      locationRelation: 'adjacent',
      card: { value: 7, suit: '♣' },
      source: 'familiar-independent'
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.encounter).toBeNull();
    expect(result.value?.timerCostAfterEncounter).toBe(0);
    expect(result.value?.candidates.length).toBeGreaterThan(0);
  });

  it('[FORAGE-001/MAP-002] rejects an adjacent Region that is not connected by the canonical map graph', () => {
    const result = resolveForaging({
      transactionId: 'forage-invalid-adjacent',
      state: {
        season: 'Spring', currentRegion: 'Forest', currentLocationType: 'Settlement',
        adjacentRegions: ['Meadow'], foragingPoints: 0, inventory: [], toolIds: []
      },
      forageRegion: 'Bog',
      locationRelation: 'adjacent',
      card: 7,
      skipEncounter: true
    });
    expect(result.status).toBe('invalid');
    expect(result.value).toBeNull();
  });

  it('[AILMENT-006/REMEDY-001/REMEDY-004/REMEDY-005/REMEDY-006/SAVE-004] commits a valid treatment atomically without consuming time', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patientResult = resolvePatient({ id: 'p', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] });
    const patient = patientResult.value!;
    const reagents: EngineInventoryItem[] = REAGENTS.flatMap(reagent => reagent.preparations.map((part, index) => ({
      id: `${reagent.id}:${index}`, name: part.name, type: 'reagent' as const, weight: part.weight,
      canonicalReagentId: reagent.id, preparationId: part.id, usesRemaining: part.uses
    })));
    const tools: EngineInventoryItem[] = ['belt-knife', 'mortar-and-pestle', 'camp-kettle', 'teeth', 'paws', 'copper-frying-pan', 'big-iron-cauldron']
      .map(id => ({ id, name: id, type: 'tool' as const, weight: 0, canonicalToolId: id }));
    expect(canTreatAilmentWithInventory(patient, patient.ailments[0].id, [...reagents, ...tools])).toBe(true);
    const result = resolveTreatment({
      mode: 'treat', transactionId: 'treatment-1',
      state: { inventory: [...reagents, ...tools], patient, reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: patient.ailments[0].id,
      selectedItemIds: reagents.map(item => item.id), selectedToolIds: tools.map(item => item.id),
      journalText: 'Remedy prepared.'
    });
    expect(result.value?.nextState.patient.ailments[0].status).toBe('treated');
    expect(result.value?.nextState.patient.timers[0].current).toBe(patient.timers[0].current);
    expect(result.value?.consumedItemIds.length).toBe(reagents.length);
    expect(result.value?.nextState.appliedTransactionIds).toContain('treatment-1');
  });

  it('[TOOL-003/REMEDY-004] applies Double Boiler potency inside the treatment transaction', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'double-patient', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const rows = REAGENTS.flatMap(reagent => reagent.preparations.map(part => ({ reagent, part })));
    const boiledMood = rows.find(row => /BOIL|BREW/i.test(row.part.method)
      && row.part.tags.some(tag => tag.tag === 'MOOD' && tag.value === 1)
      && !row.part.tags.some(tag => tag.tag === 'FOUL'))!;
    const covering = rows.find(row => !/BOIL|BREW/i.test(row.part.method)
      && row.part.tags.some(tag => ['FUR', 'FEATHER', 'SCALE'].includes(tag.tag) && tag.value >= 1)
      && !row.part.tags.some(tag => tag.tag === 'FOUL'))!;
    expect(boiledMood).toBeTruthy();
    expect(covering).toBeTruthy();
    const ingredients: EngineInventoryItem[] = [boiledMood, covering].map(({ reagent, part }, index) => ({
      id: `double:ingredient:${index}`, name: part.name, type: 'reagent', weight: part.weight,
      canonicalReagentId: reagent.id, preparationId: part.id, usesRemaining: part.uses
    }));
    const required = [...new Set([boiledMood, covering].flatMap(row => row.part.requiredTools).filter(id => id !== 'none' && id !== 'camp-kettle'))];
    const toolItems: EngineInventoryItem[] = [
      { id: 'double:tool', name: 'Double Boiler', type: 'tool', weight: 1, canonicalToolId: 'camp-kettle' },
      ...required.map(id => ({ id: `double:${id}`, name: id, type: 'tool' as const, weight: 0, canonicalToolId: id }))
    ];
    const result = resolveTreatment({
      mode: 'treat', transactionId: 'double:treatment',
      state: {
        inventory: [...ingredients, ...toolItems], patient, reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: [],
        tools: [{ instanceId: 'double:tool', toolId: 'camp-kettle', upgradeId: 'double-boiler', charges: null, broken: false, consumed: false, acquiredBy: 'test', appliedEffectIds: [] }]
      },
      ailmentInstanceId: patient.ailments[0].id,
      selectedItemIds: ingredients.map(item => item.id), selectedToolIds: toolItems.map(item => item.id), journalText: 'Double boiled.'
    });
    expect(result.value?.providedTags.MOOD).toBe(2);
    expect(result.value?.nextState.patient.ailments[0].status).toBe('treated');
    expect(result.value?.nextState.tools?.[0].appliedEffectIds).toContain('double:treatment:tool:double-boiler');
  });

  it('[TOOL-003/REMEDY-004] resolves Comb contribution and breakage in the same treatment transaction', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'comb-patient', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const row = REAGENTS.flatMap(reagent => reagent.preparations.map(part => ({ reagent, part })))
      .find(candidate => candidate.part.tags.some(tag => tag.tag === 'MOOD' && tag.value >= 2) && !candidate.part.tags.some(tag => tag.tag === 'FOUL'))!;
    const ingredient: EngineInventoryItem = {
      id: 'comb:ingredient', name: row.part.name, type: 'reagent', weight: row.part.weight,
      canonicalReagentId: row.reagent.id, preparationId: row.part.id, usesRemaining: row.part.uses
    };
    const required = [...new Set(row.part.requiredTools.filter(id => id !== 'none'))];
    const toolItems: EngineInventoryItem[] = [
      { id: 'comb:tool', name: 'Fine-toothed Comb', type: 'tool', weight: 1 / 3, canonicalToolId: 'fine-toothed-comb' },
      ...required.map(id => ({ id: `comb:${id}`, name: id, type: 'tool' as const, weight: 0, canonicalToolId: id }))
    ];
    const result = resolveTreatment({
      mode: 'treat', transactionId: 'comb:treatment',
      state: {
        inventory: [ingredient, ...toolItems], patient, reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: [],
        tools: [{ instanceId: 'comb:tool', toolId: 'fine-toothed-comb', upgradeId: null, charges: null, broken: false, consumed: false, acquiredBy: 'test', appliedEffectIds: [] }]
      },
      ailmentInstanceId: patient.ailments[0].id,
      selectedItemIds: [ingredient.id], selectedToolIds: toolItems.map(item => item.id),
      toolCards: { 'comb:tool': { value: 5, suit: '♠' } }, journalText: 'Combed remedy.'
    });
    expect(result.value?.providedTags.FUR).toBe(3);
    expect(result.value?.nextState.patient.ailments[0].status).toBe('treated');
    expect(result.value?.nextState.tools?.[0].broken).toBe(true);
  });

  it('[REMEDY-005/SAVE-004] rejects a missing preparation Tool without mutating inventory', () => {
    const patient: PatientState = resolvePatient({ id: 'p2', name: 'Patient', species: 'Mouse', ailmentIds: [AILMENTS[0].id] }).value!;
    const reagent = REAGENTS.flatMap(row => row.preparations.map(part => ({ reagent: row, part })))
      .find(row => !row.part.requiredTools.includes('none'))!;
    const item: EngineInventoryItem = {
      id: 'ingredient', name: reagent.part.name, type: 'reagent', weight: reagent.part.weight,
      canonicalReagentId: reagent.reagent.id, preparationId: reagent.part.id, usesRemaining: 1
    };
    const result = resolveTreatment({
      mode: 'treat', transactionId: 'treatment-invalid',
      state: { inventory: [item], patient, reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: patient.ailments[0].id, selectedItemIds: [item.id], selectedToolIds: [], journalText: ''
    });
    expect(result.status).toBe('invalid');
    expect(result.value).toBeNull();
  });

  it('[REMEDY-007/REMEDY-009/REMEDY-010/SAVE-004] applies rewards and gifting once after a complete Remedy', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'gift-patient', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const available = REAGENTS.flatMap(reagent => reagent.preparations
      .filter(part => !part.tags.some(tag => tag.tag === 'FOUL'))
      .map(part => ({ reagent, part })));
    const mood = available.find(row => row.part.tags.some(tag => tag.tag === 'MOOD' && tag.value >= 2))!;
    const coat = available.find(row => row.part.tags.some(tag => ['FUR', 'FEATHER', 'SCALE'].includes(tag.tag) && tag.value >= 1))!;
    const selectedRows = [...new Map([mood, coat].map(row => [row.part.id, row])).values()];
    const ingredients: EngineInventoryItem[] = selectedRows.map(({ reagent, part }) => ({
      id: `gift:${part.id}`, name: part.name, type: 'reagent', weight: part.weight,
      canonicalReagentId: reagent.id, preparationId: part.id, usesRemaining: part.uses
    }));
    const toolIds = [...new Set(selectedRows.flatMap(row => row.part.requiredTools).filter(id => id !== 'none'))];
    const tools: EngineInventoryItem[] = toolIds.map(id => ({ id: `gift-tool:${id}`, name: id, type: 'tool', weight: 0, canonicalToolId: id }));
    const input = {
      mode: 'treat' as const, transactionId: 'treatment-gift',
      state: { inventory: [...ingredients, ...tools], patient, reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: patient.ailments[0].id, selectedItemIds: ingredients.map(item => item.id),
      selectedToolIds: tools.map(item => item.id), gifting: true, journalText: 'Gifted the reward.'
    };
    const first = resolveTreatment(input);
    expect(first.value?.trinketReward).toBe(0);
    expect(first.value?.reputationChange).toBe(3);
    expect(first.value?.nextState.patient.ailments[0].status).toBe('treated');
    const repeated = resolveTreatment({ ...input, state: first.value!.nextState });
    expect(repeated.value?.reputationChange).toBe(0);
  });

  it('[AILMENT-003/REMEDY-007/TOOL-003/SAVE-004] commits Bad Idea Inspiration as part of the treatment transaction', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Bad Idea')!;
    const patient = resolvePatient({ id: 'bad-idea-patient', name: 'Inventor', species: 'Vole', ailmentIds: [ailment.id] }).value!;
    const selectedRows = [
      { reagent: REAGENTS.find(row => row.canonicalName === 'Cherry Trees')!, method: 'COOKED' },
      { reagent: REAGENTS.find(row => row.canonicalName === 'Chillies')!, method: 'DISTILLED' },
      { reagent: REAGENTS.find(row => row.canonicalName === 'Glass Silk')!, method: 'USED' }
    ].map(row => ({ reagent: row.reagent, part: row.reagent.preparations.find(part => part.method === row.method)! }));
    const ingredients: EngineInventoryItem[] = selectedRows.map(({ reagent, part }) => ({
      id: `bad-idea:${part.id}`, name: part.name, type: 'reagent', weight: part.weight,
      canonicalReagentId: reagent.id, preparationId: part.id, usesRemaining: part.uses
    }));
    const requiredToolIds = [...new Set(selectedRows.flatMap(row => row.part.requiredTools).filter(id => id !== 'none'))];
    const preparationTools: EngineInventoryItem[] = requiredToolIds.map(id => ({
      id: `bad-idea-tool:${id}`, name: id, type: 'tool', weight: 0, canonicalToolId: id
    }));
    const knife: EngineInventoryItem = { id: 'bad-idea-knife', name: 'Belt Knife', type: 'tool', weight: 1 / 3, canonicalToolId: 'belt-knife' };
    const state = {
      inventory: [...ingredients, ...preparationTools, knife],
      tools: [{
        instanceId: knife.id, toolId: 'belt-knife', upgradeId: null, charges: null,
        broken: false, consumed: false, acquiredBy: 'campaign-inventory', appliedEffectIds: []
      }],
      patient, reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: []
    };
    const baseInput = {
      mode: 'treat' as const, transactionId: 'bad-idea-treatment', state,
      ailmentInstanceId: patient.ailments[0].id,
      selectedItemIds: ingredients.map(item => item.id),
      selectedToolIds: preparationTools.map(item => item.id),
      journalText: 'The invention inspired a better tool.'
    };

    const pending = resolveTreatment(baseInput);
    expect(pending.status).toBe('manual');
    expect(pending.value).toBeNull();
    expect(pending.manualAction).toMatchObject({ kind: 'bad-idea-inspiration' });
    expect(pending.manualAction?.upgradeTargets[0].upgrades.map(upgrade => upgrade.id)).toContain('silver-sickle');

    const resolved = resolveTreatment({
      ...baseInput,
      badIdeaOutcome: { kind: 'upgrade-basic-tool', toolInstanceId: knife.id, upgradeId: 'silver-sickle' }
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.badIdeaOutcomeApplied).toBe(true);
    expect(resolved.value?.nextState.tools?.[0].upgradeId).toBe('silver-sickle');
    expect(resolved.value?.nextState.patient.ailments[0].status).toBe('treated');
    expect(resolved.value?.nextState.appliedTransactionIds).toEqual([
      'bad-idea-treatment:bad-idea-inspiration',
      'bad-idea-treatment'
    ]);
  });

  it('[AILMENT-003/TOOL-003/SAVE-004] lightens a Tool by exactly one third and rejects a repeated Inspiration transaction', () => {
    const state = {
      tools: [{
        instanceId: 'light-tool', toolId: 'camp-kettle', upgradeId: null, charges: null,
        broken: false, consumed: false, acquiredBy: 'campaign-inventory', appliedEffectIds: []
      }],
      appliedTransactionIds: []
    };
    const first = resolveBadIdeaOutcomeEffect({
      transactionId: 'inspiration-lighten', state,
      choice: { kind: 'lighten-tool', toolInstanceId: 'light-tool' }
    });
    expect(first.value?.tools[0].weightAdjustment).toBeCloseTo(-1 / 3);
    const repeated = resolveBadIdeaOutcomeEffect({
      transactionId: 'inspiration-lighten', state: first.value!,
      choice: { kind: 'lighten-tool', toolInstanceId: 'light-tool' }
    });
    expect(repeated.status).toBe('invalid');
  });
});

describe('patient, downtime, and season procedures', () => {
  it('[PATIENT-001/PATIENT-002/PATIENT-003/PATIENT-004/AILMENT-002/AILMENT-004] draws identity and creates separate timers for repeated ailments', () => {
    const result = resolvePatient({
      transactionId: 'patient-cards', patientName: 'Moss', species: 'Mouse',
      personalityCard: 1, personalityChoice: 0, descriptorCard: 2,
      severityCard: { value: 1, suit: '♠' }, ailmentCard: 1, reputation: 35
    });
    expect(result.value?.appliedSeverity).toBe('dire');
    expect(result.value?.patient.personality).toBe('Witty');
    expect(result.value?.patient.ailments).toHaveLength(2);
    expect(new Set(result.value?.patient.timers.map(timer => timer.id)).size).toBe(2);
  });

  it('[AILMENT-003/PATIENT-003/SAVE-004] resolves Brand Care and Forager\'s Twitch during diagnosis', () => {
    const brand = AILMENTS.find(row => row.canonicalName === 'Brand Care')!;
    const brandPatient = resolvePatient({ id: 'brand-patient', name: 'Patient', species: 'Mouse', ailmentIds: [brand.id] }).value!;
    const treated = resolveAilmentDiagnosisEffect({
      transactionId: 'brand-treat',
      state: { patient: brandPatient, reputation: 5, worldConditions: [], appliedTransactionIds: [] },
      ailmentInstanceId: brandPatient.ailments[0].id,
      brandCareChoice: 'treat'
    });
    expect(treated.value?.reputation).toBe(3);
    expect(treated.value?.patient.ailments[0].specialState.brandCareChoice).toBe('treat');

    const refused = resolveAilmentDiagnosisEffect({
      transactionId: 'brand-refuse',
      state: { patient: brandPatient, reputation: 5, worldConditions: [], appliedTransactionIds: [] },
      ailmentInstanceId: brandPatient.ailments[0].id,
      brandCareChoice: 'refuse'
    });
    expect(refused.value?.reputation).toBe(7);
    expect(refused.value?.patient.status).toBe('departed');
    expect(refused.value?.patient.ailments[0].status).toBe('failed');

    const twitch = AILMENTS.find(row => row.canonicalName === "Forager's Twitch")!;
    const twitchPatient = resolvePatient({ id: 'twitch-patient', name: 'Patient', species: 'Mouse', ailmentIds: [twitch.id] }).value!;
    const badTrip = resolveAilmentDiagnosisEffect({
      transactionId: 'twitch-spade',
      state: { patient: twitchPatient, reputation: 0, worldConditions: [], appliedTransactionIds: [] },
      ailmentInstanceId: twitchPatient.ailments[0].id,
      cardSuit: '♠'
    });
    expect(badTrip.value?.patient.ailments[0].specialState).toMatchObject({
      diagnosisCardSuit: '♠',
      trip: 'bad',
      additionalRequirements: [{ tag: 'WOUND', threshold: 1 }]
    });
  });

  it('[DOWNTIME-001/DOWNTIME-003/DOWNTIME-006/DOWNTIME-007] permits exactly one Downtime and applies automatic rewards', () => {
    const first = resolveDowntime({
      transactionId: 'down-1', activity: 'lend-a-paw',
      state: { downtimeCompleted: false, reputation: 2, trinkets: 0, journalEvents: [], appliedTransactionIds: [] }
    });
    expect(first.value?.nextState.reputation).toBe(7);
    expect(resolveDowntime({ transactionId: 'down-2', activity: 'lend-a-paw', state: first.value!.nextState }).status).toBe('invalid');
    const practice = resolveDowntime({
      transactionId: 'down-practice', activity: 'general-practice',
      state: { downtimeCompleted: false, reputation: 2, trinkets: 1, journalEvents: [], appliedTransactionIds: [] }
    });
    expect(practice.value?.nextState.trinkets).toBe(6);
    const relax = resolveDowntime({
      transactionId: 'down-relax', activity: 'relax-tool',
      state: { downtimeCompleted: false, reputation: 2, trinkets: 1, journalEvents: [], appliedTransactionIds: [] }
    });
    expect(relax.status).toBe('manual');
    expect(resolveDowntime({ transactionId: 'down-relax-again', activity: 'relax-familiar', state: relax.value!.nextState }).status).toBe('invalid');
  });

  it('[DOWNTIME-007/WAGON-001/WAGON-002] charges the canonical Wagon transaction cost exactly once', () => {
    const state = { downtimeCompleted: false, reputation: 2, trinkets: 10, journalEvents: [], appliedTransactionIds: [] };
    const result = resolveDowntime({
      transactionId: 'down-wagon-expansion', activity: 'commission-wagon', state, atCity: true, resourceCost: 6
    });
    expect(result.status).toBe('manual');
    expect(result.value?.nextState.trinkets).toBe(4);
    expect(resolveDowntime({
      transactionId: 'down-wagon-expansion', activity: 'commission-wagon', state: result.value!.nextState, atCity: true, resourceCost: 6
    }).status).toBe('invalid');
  });

  it('[CLINIC-002/CLINIC-005/CLINIC-006/COMPANION-003] applies all Season boundary effects once', () => {
    const state: SeasonRuntimeState = {
      season: 'Spring', completedSeasons: 0, reputation: 4, trinkets: 1,
      clinics: [{ id: 'clinic-1', locationId: 'wild', status: 'building', completesAtSeason: 'Summer', gardenReagentId: 'reagent-yarrow' }],
      agendaServices: ['hostel', 'goodwill_stand'], goodwillDonatedWeight: 2.75,
      companions: [{ id: 'cat-1', kind: 'caterpillar', seasonsTravelled: 0 }],
      downtimeCompleted: true, journalEvents: [], appliedTransactionIds: []
    };
    const result = resolveSeason({ transactionId: 'season-1', state });
    expect(result.value?.nextSeason).toBe('Summer');
    expect(result.value?.clinicIncome).toBe(2);
    expect(result.value?.goodwillReputation).toBe(2);
    expect(result.value?.nextState.clinics[0].status).toBe('active');
    expect(result.value?.nextState.companions[0].kind).toBe('butterfly');
    expect(result.value?.nextState.downtimeCompleted).toBe(false);
  });
});
