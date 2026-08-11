import { describe, expect, it } from 'vitest';
import {
  beginBarrowChallenge,
  bidFarewellCollapsedEntrance,
  drawCollapsedEntranceCard,
  drawPilferCard,
  drawSuitableFurnishings,
  diagnoseBuildingTrust,
  fleeBarrowDelve,
  resolveBarrowForageAttempt,
  resolveBuildingTrust,
  resolvePotentPoison,
  resolveSuitableFurnishings,
  standPilfer,
  startBarrowDelve,
  submitBarrowRemedy,
  warnOthersInsideJob,
  type BarrowRuntimeState,
  type DelveItemSelection
} from './barrowEngine';
import { AILMENTS } from './data/ailments';
import { POTENT_POISON_REAGENT_IDS, type BehemothClass } from './data/barrows';
import { REAGENTS } from './data/reagents';
import type { EngineInventoryItem } from './gameplay';
import type { CardSuit, RuleTag } from './types';
import { purchaseCanonicalTool, resolveToolEffects, upgradeCanonicalTool, type ToolTransactionState } from './toolEngine';
import { resolveForagingEngine } from './foragingEngine';
import { resolvePatient } from './engine';
import { resolveLeave, type LeaveRuntimeState } from './leaveEngine';
import { migrateSavedRulesState } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './state';
import { canTreatAilmentWithInventory } from './treatmentEngine';
import { getGuildLedgerForagingPointBonus, hasGuildLogisticalMap, resolveCanonicalDowntime, type CanonicalDowntimeState } from './canonicalDowntimeEngine';
import type { RequirementExpression } from './types';

const reload = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const stateFor = (behemothClass: BehemothClass, inventory: EngineInventoryItem[] = []): BarrowRuntimeState => ({
  currentLocationId: 'barrow',
  calendarDays: 0,
  reputation: 5,
  trinkets: 6,
  carry: 4,
  speed: 3,
  inventory,
  companions: [],
  graph: {
    barrow: { id: 'barrow', name: 'Old Barrow', region: 'Forest', locationType: 'Behemoth Barrow', edges: [{ to: 'road', kind: 'path' }] },
    road: { id: 'road', name: 'Old Road', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'barrow', kind: 'path' }] }
  },
  barrows: [{ id: 'barrow-1', name: 'Old Barrow', behemothClass, locationId: 'barrow', removed: false }],
  activeDelve: null,
  movementBlocked: false,
  needsLocalHelp: false,
  nextMoveSpeedOverride: null,
  pursuit: null,
  journeyEnded: false,
  appliedTransactionIds: [],
  journalEvents: [],
  patients: [],
  activePatientId: null,
  patientArchive: [],
  archiveContext: { location: 'Old Barrow', encounteredAt: 1, resolvedAt: 2, sourceJourneyId: 'journey-1' }
});

const begin = (behemothClass: BehemothClass, suit: CardSuit, inventory: EngineInventoryItem[] = []) => {
  const started = startBarrowDelve({ transactionId: `start:${behemothClass}:${suit}`, state: stateFor(behemothClass, inventory), barrowId: 'barrow-1', suit, journalNote: 'Entered the Barrow.' }).value!;
  return beginBarrowChallenge(`begin:${behemothClass}:${suit}`, reload(started)).value!;
};

const partForTag = (tag: RuleTag, threshold: number, id: string) => {
  for (const reagent of REAGENTS) {
    const preparation = reagent.preparations.find(row => row.tags.some(value => value.tag === tag && value.value >= threshold));
    if (preparation) {
      const item: EngineInventoryItem = { id, name: `${reagent.canonicalName} (${preparation.name})`, type: 'reagent', weight: preparation.weight, canonicalReagentId: reagent.id, preparationId: preparation.id, usesRemaining: 1 };
      const selection: DelveItemSelection = { itemId: id, reagentId: reagent.id, preparationId: preparation.id, sourceTransactionId: 'test-selection' };
      return { item, selection };
    }
  }
  throw new Error(`No canonical Part supplies ${tag} ${threshold}.`);
};

const partsForTotal = (tag: RuleTag, total: number, prefix: string) => {
  const best = REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => ({ reagent, preparation, value: preparation.tags.filter(row => row.tag === tag).reduce((sum, row) => sum + row.value, 0) })))
    .sort((a, b) => b.value - a.value)[0];
  if (!best?.value) throw new Error(`No canonical Part supplies ${tag}.`);
  const count = Math.ceil(total / best.value);
  return Array.from({ length: count }, (_, index) => {
    const id = `${prefix}-${index + 1}`;
    return {
      item: { id, name: `${best.reagent.canonicalName} (${best.preparation.name})`, type: 'reagent' as const, weight: best.preparation.weight, canonicalReagentId: best.reagent.id, preparationId: best.preparation.id, usesRemaining: 1 },
      selection: { itemId: id, reagentId: best.reagent.id, preparationId: best.preparation.id, sourceTransactionId: 'test-selection' }
    };
  });
};

const tagsInRequirement = (requirement: RequirementExpression): RuleTag[] => {
  if (requirement.kind === 'tag') return [requirement.tag];
  if (requirement.kind === 'special') return [];
  if (requirement.kind === 'alternatives') return requirement.alternatives.flatMap(tagsInRequirement);
  return requirement.requirements.flatMap(tagsInRequirement);
};

const downtimeState = (): CanonicalDowntimeState => ({
  downtimeRequired: true,
  downtimeCompleted: false,
  reputation: 5,
  trinkets: 0,
  speed: 3,
  carry: 4,
  travelStyle: 'Rambling and Ready',
  currentLocationId: 'wild',
  currentSeason: 'Spring',
  inventory: [],
  graph: {
    wild: { id: 'wild', name: 'Wild', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'near', kind: 'path' }] },
    near: { id: 'near', name: 'Near City', region: 'Forest', locationType: 'City', edges: [{ to: 'wild', kind: 'path' }, { to: 'far', kind: 'path' }] },
    far: { id: 'far', name: 'Far City', region: 'Meadow', locationType: 'City', edges: [{ to: 'near', kind: 'path' }] }
  },
  ailmentTagOverrides: [],
  appliedTransactionIds: [],
  journalEvents: []
});

describe('Step 3 canonical Barrow end-to-end flows', () => {
  it('[BARROW-002/BARROW-003/SAVE-001] persists entry and permits Flee only before the Challenge', () => {
    const started = startBarrowDelve({ transactionId: 'flee:start', state: stateFor('Towering'), barrowId: 'barrow-1', suit: '♥', journalNote: 'Saw the sleeper.' }).value!;
    const restored = reload(started);
    const fled = fleeBarrowDelve('flee:commit', restored, 'Withdrew before waking it.').value!;
    expect(fled).toMatchObject({ calendarDays: 1, activeDelve: null, movementBlocked: false, nextMoveSpeedOverride: 1 });
    expect(fleeBarrowDelve('flee:commit', fled, 'Duplicate.').status).toBe('invalid');
  });

  it('[BARROW-005/SAVE-004] completes Uneasy Sleep with SLEEP 6 and exactly one graph Path move', () => {
    const parts = partsForTotal('SLEEP', 6, 'sleep');
    let state = begin('Towering', '♥', parts.map(row => row.item));
    state = resolveBarrowForageAttempt('sleep:forage', reload(state)).value!;
    const result = submitBarrowRemedy({ transactionId: 'sleep:remedy', state, selections: parts.map(row => row.selection), moveTargetId: 'road', journalNote: 'Kept the sleeper calm.' }).value!;
    expect(result).toMatchObject({ currentLocationId: 'road', calendarDays: 1, activeDelve: null, trinkets: 18 });
    expect(result.barrows[0].removed).toBe(true);
  });

  it('[BARROW-004/CORE-001] completes Collapsed Entrance with M=12 milestones, reload, and idempotency', () => {
    let state = begin('Towering', '♣');
    state = drawCollapsedEntranceCard('collapsed:1', state, { value: 13, suit: '♣' }).value!;
    expect(state.activeDelve?.progress).toBe(12);
    state = reload(state);
    state = drawCollapsedEntranceCard('collapsed:2', state, { value: 12, suit: '♣' }).value!;
    state = drawCollapsedEntranceCard('collapsed:3', state, { value: 13, suit: '♣' }).value!;
    state = drawCollapsedEntranceCard('collapsed:4', state, { value: 13, suit: '♣' }).value!;
    const finished = drawCollapsedEntranceCard('collapsed:5', state, 2).value!;
    expect(finished).toMatchObject({ reputation: 10, trinkets: 17, calendarDays: 1, activeDelve: null });
    expect(finished.barrows[0].removed).toBe(true);
    expect(drawCollapsedEntranceCard('collapsed:5', finished, 2).status).toBe('invalid');

    const partial = drawCollapsedEntranceCard('farewell:draw', begin('Towering', '♣'), 7).value!;
    expect(bidFarewellCollapsedEntrance('farewell:done', partial, 'Stopped after the vestibule.').value?.activeDelve).toBeNull();
  });

  it('[BARROW-008] completes The Bellies of Many and applies its Timer failure exactly once', () => {
    const requirements = [partForTag('JOY', 2, 'joy'), partForTag('STOMACH', 2, 'stomach-1'), partForTag('STOMACH', 2, 'stomach-2'), partForTag('NERVES', 2, 'nerves'), partForTag('SENSES', 3, 'senses'), partForTag('MOOD', 2, 'mood')];
    let state = begin('Many', '♥', requirements.map(row => row.item));
    state = resolveBarrowForageAttempt('bellies:forage', reload(state)).value!;
    const success = submitBarrowRemedy({ transactionId: 'bellies:remedy', state, selections: requirements.map(row => row.selection), journalNote: 'Served the banquet.' }).value!;
    expect(success.inventory.some(item => item.name === 'Titan-seeking Artefact')).toBe(true);
    expect(success.calendarDays).toBe(1);

    let failure = begin('Many', '♥');
    for (let index = 0; index < 12; index += 1) failure = resolveBarrowForageAttempt(`bellies:fail:${index}`, failure).value!;
    expect(failure).toMatchObject({ activeDelve: null, calendarDays: 2 });
  });

  it('[BARROW-008] completes or warns on Inside Job through canonical graph and journal state', () => {
    const sleep = partsForTotal('SLEEP', 4, 'inside-sleep');
    const foul = partsForTotal('FOUL', 8, 'inside-foul');
    let state = begin('Many', '♣', [...sleep, ...foul].map(row => row.item));
    state = resolveBarrowForageAttempt('inside:forage', reload(state)).value!;
    const success = submitBarrowRemedy({ transactionId: 'inside:remedy', state, selections: [...sleep, ...foul].map(row => row.selection), journalNote: 'Finished before the plot.' }).value!;
    expect(success).toMatchObject({ calendarDays: 1, trinkets: 25, activeDelve: null });
    const warned = warnOthersInsideJob('inside:warn', begin('Many', '♣'), 'Warned the neighbours.').value!;
    expect(warned).toMatchObject({ carry: 3, speed: 2, activeDelve: null });
  });

  it('[BARROW-009] resolves Potent Poison from seven canonical identities after Timer 0', () => {
    const rows = POTENT_POISON_REAGENT_IDS.map((reagentId, index) => {
      const reagent = REAGENTS.find(row => row.id === reagentId)!;
      const preparation = reagent.preparations[0];
      const itemId = `poison-${index}`;
      return {
        item: { id: itemId, name: reagent.canonicalName, type: 'reagent' as const, weight: preparation.weight, canonicalReagentId: reagent.id, preparationId: preparation.id, usesRemaining: 1 },
        selection: { itemId, reagentId: reagent.id, preparationId: preparation.id, sourceTransactionId: 'poison-selection' }
      };
    });
    let state = begin('Violent', '♥', rows.map(row => row.item));
    for (let index = 0; index < 4; index += 1) state = resolveBarrowForageAttempt(`poison:forage:${index}`, reload(state)).value!;
    const result = resolvePotentPoison({ transactionId: 'poison:resolve', state, selections: rows.map(row => row.selection), card: 1, journalNote: 'Prepared the poison.' }).value!;
    expect(result).toMatchObject({ calendarDays: 1, trinkets: 11, carry: 5, activeDelve: null });
  });

  it('[BARROW-006] resolves Pilfer rewards, exact 21 Tool identity, and fatal overflow', () => {
    let state = begin('Violent', '♣');
    state = drawPilferCard('pilfer:12', reload(state), 12).value!;
    state = drawPilferCard('pilfer:9', state, 9).value!;
    const escaped = standPilfer({ transactionId: 'pilfer:stand', state, selectedToolId: 'crossbow', journalNote: 'Slipped out unseen.' }).value!;
    expect(escaped).toMatchObject({ trinkets: 21, calendarDays: 1, activeDelve: null });
    expect(escaped.inventory[0]).toMatchObject({ canonicalToolId: 'crossbow', id: 'pilfer:stand:tool' });

    let fatal = begin('Violent', '♣');
    fatal = drawPilferCard('pilfer:fatal:12', fatal, 12).value!;
    const death = drawPilferCard('pilfer:fatal:10', fatal, 10);
    expect(death).toMatchObject({ status: 'manual' });
    expect(death.value).toMatchObject({ journeyEnded: true, activeDelve: null });
  });

  it('[BARROW-007] converts Building Trust Trinkets to Reputation and settlement state atomically', () => {
    const ailment = AILMENTS.find(row => row.severity === 'intermediate')!;
    let state = begin('Demanding', '♥');
    state = diagnoseBuildingTrust('trust:ailment', reload(state), ailment.id).value!;
    state = {
      ...state,
      patients: state.patients!.map(patient => ({
        ...patient,
        status: 'cured',
        ailments: patient.ailments.map(row => ({ ...row, status: 'treated', successResolved: true })),
        timers: patient.timers.map(row => ({ ...row, status: 'stopped' }))
      }))
    };
    const result = resolveBuildingTrust({ transactionId: 'trust:success', state, success: true, trinketEquivalent: 4, journalNote: 'The patient recovered.' }).value!;
    expect(result).toMatchObject({ reputation: 9, trinkets: 2, activeDelve: null, activePatientId: null });
    expect(result.graph.barrow.locationType).toBe('Settlement');
    expect(result.barrows[0].removed).toBe(true);
    expect(result.patientArchive).toHaveLength(1);
  });

  it('[BARROW-007] preserves ordered identities for Suitable Furnishings across reload', () => {
    const rarities = [...new Set(REAGENTS.map(row => row.baseRarity))].filter(value => value >= 1 && value <= 12).slice(0, 5);
    expect(rarities).toHaveLength(5);
    const rows = rarities.map((rarity, index) => {
      const reagent = REAGENTS.find(row => row.baseRarity === rarity)!;
      const preparation = reagent.preparations[0];
      const itemId = `furnishing-${index}`;
      return {
        item: { id: itemId, name: reagent.canonicalName, type: 'reagent' as const, weight: preparation.weight, canonicalReagentId: reagent.id, preparationId: preparation.id, usesRemaining: 1 },
        selection: { itemId, reagentId: reagent.id, preparationId: preparation.id, sourceTransactionId: 'furnishing-selection' }
      };
    });
    let state = begin('Demanding', '♣', rows.map(row => row.item));
    state = drawSuitableFurnishings('furnishing:draw', state, rarities).value!;
    state = resolveBarrowForageAttempt('furnishing:forage', reload(state)).value!;
    const result = resolveSuitableFurnishings({ transactionId: 'furnishing:resolve', state, selections: rows.map(row => row.selection), journalNote: 'Placed everything in order.' }).value!;
    expect(result).toMatchObject({ reputation: 10, trinkets: 16, calendarDays: 1, activeDelve: null });
  });
});

describe('Step 3 canonical Tool identity and transactions', () => {
  const toolState = (): ToolTransactionState => ({ trinkets: 12, inventory: [], tools: [], appliedTransactionIds: [], journalEvents: [] });

  it('[TOOL-003/TOOL-005/SAVE-004] keeps duplicate base Tools distinct through purchase, upgrade, and reload', () => {
    let state = purchaseCanonicalTool({ transactionId: 'tool:buy:1', state: toolState(), toolId: 'belt-knife', source: 'basic-replacement' }).value!;
    state = purchaseCanonicalTool({ transactionId: 'tool:buy:2', state, toolId: 'belt-knife', source: 'basic-replacement' }).value!;
    expect(state.tools.map(tool => tool.instanceId)).toEqual(['tool:buy:1:tool', 'tool:buy:2:tool']);

    state = upgradeCanonicalTool({
      transactionId: 'tool:upgrade:1',
      state: reload(state),
      toolInstanceId: 'tool:buy:1:tool',
      upgradeId: 'silver-sickle',
      currentLocationType: 'City',
      currentRegion: 'Forest'
    }).value!;
    expect(state.tools[0]).toMatchObject({ instanceId: 'tool:buy:1:tool', toolId: 'belt-knife', upgradeId: 'silver-sickle' });
    expect(state.tools[1]).toMatchObject({ instanceId: 'tool:buy:2:tool', toolId: 'belt-knife', upgradeId: null });
    expect(state.inventory[0]).toMatchObject({ id: 'tool:buy:1:tool', canonicalToolId: 'belt-knife', name: 'Silver Sickle' });
    expect(upgradeCanonicalTool({ transactionId: 'tool:upgrade:1', state, toolInstanceId: 'tool:buy:2:tool', upgradeId: 'steel-axe', currentLocationType: 'City', currentRegion: 'Forest' }).status).toBe('invalid');
  });

  it('[TOOL-003/TOOL-005] preserves instance identity when a charged Tool breaks and is consumed', () => {
    const tent = {
      instanceId: 'tent:stable', toolId: 'canvas-tent', upgradeId: null, charges: 1,
      broken: false, consumed: false, acquiredBy: 'market', appliedEffectIds: []
    };
    const result = resolveToolEffects({
      transactionId: 'tool:weather:1', phase: 'travel', trigger: 'weather-encounter',
      tools: [tent], selectedToolInstanceIds: [tent.instanceId], card: { value: 5, suit: '♣' }, rulesetId: 'original-1e-3p'
    });
    expect(result.tools[0]).toMatchObject({ instanceId: 'tent:stable', broken: true, charges: 0, consumed: true, appliedEffectIds: ['tool:weather:1'] });
    const restored = reload(result.tools);
    expect(resolveToolEffects({ transactionId: 'tool:weather:1', phase: 'travel', trigger: 'weather-encounter', tools: restored, card: { value: 3, suit: '♥' }, rulesetId: 'original-1e-3p' }).appliedToolInstanceIds).toEqual([]);
  });

  it('[FORAGE-006/TOOL-005] applies Silver Sickle only when the canonical Forage gains FP', () => {
    const sickle = { instanceId: 'sickle:stable', toolId: 'belt-knife', upgradeId: 'silver-sickle', charges: null, broken: false, consumed: false, acquiredBy: 'smithing', appliedEffectIds: [] };
    const baseState = { season: 'Summer' as const, currentRegion: 'Forest' as const, currentLocationType: 'Wilds' as const, foragingPoints: 0, inventory: [], toolIds: ['belt-knife'], tools: [sickle] };
    const preview = resolveForagingEngine({ transactionId: 'sickle:forage', state: baseState, forageRegion: 'Forest', locationRelation: 'current', card: 1 });
    const candidate = preview.value!.candidates.find(row => !row.cardSuccess && !row.automaticWithForagingPoints
      && REAGENTS.find(reagent => reagent.id === row.reagentId)?.preparations.some(preparation => preparation.requiredTools.every(tool => tool === 'none')))!;
    const reagent = REAGENTS.find(row => row.id === candidate.reagentId)!;
    const preparation = reagent.preparations.find(row => row.requiredTools.every(tool => tool === 'none'))!;
    const failed = resolveForagingEngine({ transactionId: 'sickle:forage', state: baseState, forageRegion: 'Forest', locationRelation: 'current', card: 1, targetReagentId: reagent.id, parts: [{ preparationId: preparation.id, quantity: 1 }] });
    expect(failed.value).toMatchObject({ foragingPointsGained: 2, nextState: { foragingPoints: 2 } });
    expect(failed.value?.nextState.tools?.[0].appliedEffectIds).toContain('sickle:forage:tool:foraging-points');
  });

  it('[TOOL-003/TOOL-005] applies the Steel-Lined Mortar Timer bonus only on the first qualifying gather', () => {
    const row = REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => ({ reagent, preparation })))
      .find(({ reagent, preparation }) => /GRIND|CRUSH/i.test(preparation.method)
        && Object.values(reagent.regionAvailability).includes('Common')
        && Object.values(reagent.seasonAvailability).includes('Common'))!;
    const region = Object.entries(row.reagent.regionAvailability).find(([, availability]) => availability === 'Common')![0] as 'Bog' | 'Forest' | 'Loch' | 'Meadow' | 'Mountain' | 'Titan';
    const season = Object.entries(row.reagent.seasonAvailability).find(([, availability]) => availability === 'Common')![0] as 'Spring' | 'Summer' | 'Autumn' | 'Winter';
    const patient = resolvePatient({ id: 'steel-lined-patient', name: 'Pip', species: 'Mouse', ailmentIds: [AILMENTS[0].id] }).value!;
    const steel = { instanceId: 'steel-lined:tool', toolId: 'mortar-and-pestle', upgradeId: 'steel-lined-mortar', charges: null, broken: false, consumed: false, acquiredBy: 'smithing', appliedEffectIds: [] };
    const first = resolveForagingEngine({
      transactionId: 'steel-lined:gather:1',
      state: { season, currentRegion: region, currentLocationType: 'Wilds', foragingPoints: 99, inventory: [], toolIds: row.preparation.requiredTools.filter(tool => tool !== 'none'), tools: [steel], patient },
      forageRegion: region, locationRelation: 'current', card: 12, targetReagentId: row.reagent.id,
      parts: [{ preparationId: row.preparation.id, quantity: 1 }], spendForagingPoints: true, skipEncounter: true
    });
    expect(first.value?.nextState.patient?.timers[0].current).toBe(patient.timers[0].current + 1);
    const second = resolveForagingEngine({
      transactionId: 'steel-lined:gather:2',
      state: { ...first.value!.nextState, currentLocationType: 'Wilds' },
      forageRegion: region, locationRelation: 'current', card: 12, targetReagentId: row.reagent.id,
      parts: [{ preparationId: row.preparation.id, quantity: 1 }], spendForagingPoints: true, skipEncounter: true
    });
    expect(second.value?.nextState.patient?.timers[0].current).toBe(patient.timers[0].current + 1);
  });
});

describe('Step 3 canonical Leave transaction', () => {
  it('[LEAVE-006/SAVE-001] blocks pending obligations and closes patient, timers, reputation, and journal once', () => {
    const ailment = AILMENTS.find(row => row.severity === 'severe')!;
    const patient = resolvePatient({ id: 'leave:patient', name: 'Rowan', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const base: LeaveRuntimeState = {
      inventory: [], patient, reputation: 10, trinkets: 0, currentRegion: 'Forest', adjacentRegions: ['Meadow'],
      foragingPoints: 3, pendingObligation: null, journalEvents: [], appliedTransactionIds: []
    };
    const blocked = resolveLeave({ transactionId: 'leave:blocked', state: { ...base, pendingObligation: { transactionId: 'forage:pending', kind: 'foraging-encounter', source: 'forage-current', region: 'Forest', resolved: false } }, status: 'abandoned' });
    expect(blocked.status).toBe('invalid');

    const left = resolveLeave({ transactionId: 'leave:commit', state: reload(base), status: 'abandoned' }).value!;
    expect(left).toMatchObject({ reputation: 7, foragingPoints: 0, patient: { status: 'departed' } });
    expect(left.patient.ailments[0]).toMatchObject({ status: 'failed', consequenceResolved: true });
    expect(left.patient.timers[0].status).toBe('stopped');
    expect(left.journalEvents).toHaveLength(1);
    expect(resolveLeave({ transactionId: 'leave:commit', state: reload(left), status: 'abandoned' }).status).toBe('invalid');
  });
});

describe('Step 3 canonical Downtime transactions', () => {
  it('[DOWNTIME-003/REMEDY-001] applies General Practice to later treatment requirement evaluation', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Paw Rot')!;
    expect(tagsInRequirement(ailment.requirements)).toEqual(['INFECTION', 'PAIN']);
    const itemFor = (tag: RuleTag, id: string): EngineInventoryItem => {
      const row = REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => ({ reagent, preparation })))
        .find(({ preparation }) => preparation.requiredTools.every(tool => tool === 'none')
          && preparation.tags.some(value => value.tag === tag && value.value >= 1)
          && !preparation.tags.some(value => value.tag === 'INFECTION'))!;
      return {
        id, name: row.preparation.name, type: 'reagent', weight: row.preparation.weight,
        canonicalReagentId: row.reagent.id, preparationId: row.preparation.id, usesRemaining: 1
      };
    };
    const inventory = [itemFor('WOUND', 'practice:wound'), itemFor('PAIN', 'practice:pain')];
    const patient = resolvePatient({ id: 'practice:patient', name: 'Pip', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    expect(canTreatAilmentWithInventory(patient, patient.ailments[0].id, inventory)).toBe(false);
    const practiced = resolveCanonicalDowntime('practice:1', downtimeState(), {
      activity: 'general-practice', ailmentId: ailment.id,
      originalTag: 'INFECTION', replacementTag: 'WOUND',
      journalText: 'The village taught me a different remedy.'
    });
    expect(practiced).toMatchObject({ trinkets: 5, downtimeRequired: false, downtimeCompleted: true });
    const restored = reload(practiced);
    expect(restored.ailmentTagOverrides).toEqual(practiced.ailmentTagOverrides);
    expect(canTreatAilmentWithInventory(patient, patient.ailments[0].id, inventory, restored.ailmentTagOverrides)).toBe(true);
  });

  it('[DOWNTIME-004] validates local in-season canonical Parts and Inventory capacity', () => {
    const base = downtimeState();
    const reagent = REAGENTS.find(row => row.regionAvailability.Forest !== 'Unavailable'
      && row.seasonAvailability.Spring === 'Common'
      && row.preparations.some(part => part.requiredTools.every(tool => tool === 'none') && part.weight > 0))!;
    const preparation = reagent.preparations.find(part => part.requiredTools.every(tool => tool === 'none') && part.weight > 0)!;
    const item: EngineInventoryItem = { id: 'stock:1', name: preparation.name, type: 'reagent', weight: preparation.weight, quantity: 1, canonicalReagentId: reagent.id, preparationId: preparation.id };
    const result = resolveCanonicalDowntime('stock:1', base, { activity: 'replenish', items: [item], addedItemIds: [item.id], totalCapacity: 4 });
    expect(result.inventory).toEqual([item]);
    expect(() => resolveCanonicalDowntime('stock:heavy', base, { activity: 'replenish', items: [{ ...item, id: 'stock:heavy', quantity: 100 }], totalCapacity: 4 })).toThrow(/capacity/);
  });

  it('[DOWNTIME-007/GRAPH-001] only reconnects to a nearest graph-backed City', () => {
    const note: EngineInventoryItem = { id: 'note:1', name: 'Botanist Ledger', type: 'item', weight: 1 / 3, guildNote: { kind: 'ledger', region: 'Forest' } };
    expect(() => resolveCanonicalDowntime('reconnect:far', downtimeState(), { activity: 'reconnect', nearestCityId: 'far', noteItem: note })).toThrow(/nearest/);
    const result = resolveCanonicalDowntime('reconnect:near', downtimeState(), { activity: 'reconnect', nearestCityId: 'near', noteItem: note });
    expect(result).toMatchObject({ currentLocationId: 'near', inventory: [note], downtimeCompleted: true });
    expect(getGuildLedgerForagingPointBonus(result.inventory, 'Forest')).toBe(2);
    expect(getGuildLedgerForagingPointBonus(result.inventory, 'Bog')).toBe(0);
    expect(hasGuildLogisticalMap([{ ...note, id: 'note:map', weight: 2 / 3, guildNote: { kind: 'map', region: 'Forest' } }], 'Forest')).toBe(true);
  });
});

describe('Step 3 save migration', () => {
  it('[SAVE-001/SAVE-006] restores an in-progress legacy Barrow and stable duplicate Tool instances', () => {
    const migrated = migrateSavedRulesState({
      schemaVersion: 7,
      rulesetId: 'legacy-campaign',
      barrows: [{ id: 'barrow-legacy', name: 'Old Barrow', behemothClass: 'Towering' }],
      activeDelve: {
        challengeType: 'CollapsedEntrance',
        behemothName: 'Old Barrow',
        cardsDrawn: ['♣', 13, 12],
        points: 24,
        timer: 3
      },
      bag: [
        { id: 'knife:first', name: 'Silver Sickle', type: 'tool', canonicalToolId: 'belt-knife', weight: 0 },
        { id: 'knife:second', name: 'Belt Knife', type: 'tool', canonicalToolId: 'belt-knife', weight: 0 }
      ],
      toolStates: [{
        instanceId: 'knife:first', toolId: 'belt-knife', upgradeId: 'silver-sickle', charges: null,
        broken: false, consumed: false, acquiredBy: 'smithing', weightAdjustment: 1,
        appliedEffectIds: ['forage:before-save']
      }],
      unknownCampaignMemory: { note: 'preserve me' }
    });

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.activeDelve).toMatchObject({
      delveId: 'collapsed-entrance',
      barrowId: 'barrow-legacy',
      challengeSuit: '♣',
      progress: 24,
      timer: 3
    });
    expect(migrated.toolStates).toEqual(expect.arrayContaining([
      expect.objectContaining({ instanceId: 'knife:first', toolId: 'belt-knife', upgradeId: 'silver-sickle', weightAdjustment: 1, appliedEffectIds: ['forage:before-save'] }),
      expect.objectContaining({ instanceId: 'knife:second', toolId: 'belt-knife', upgradeId: null, acquiredBy: 'legacy-inventory' })
    ]));
    expect(migrated.unknownCampaignMemory).toEqual({ note: 'preserve me' });
  });
});
