import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  CURRENT_SCHEMA_VERSION,
  PRINTED_EFFECT_REGISTRY,
  REAGENTS,
  RULESETS,
  beginBarrowChallenge,
  canonicalMetadata,
  classifyPrintedEffect,
  commissionClinic,
  commitAlternativeAcquisition,
  createManualEffectDraft,
  createReplacementAcquisition,
  diagnoseBuildingTrust,
  drawPilferCard,
  migrateSavedRulesState,
  resolveBarterEncounter,
  resolveBarterGossip,
  resolveBarterStart,
  resolveBuildingTrust,
  resolveDowntime,
  resolveForaging,
  resolveGuildService,
  resolveJourneyEnding,
  resolveJourneyStart,
  resolveManualEffectTransaction,
  resolvePatient,
  resolveSeasonBoundary,
  resolveTravel,
  resolveTreatment,
  resolveTreatmentTransaction,
  startBarrowDelve,
  type BarterMapNode,
  type BarterRuntimeState,
  type BarrowRuntimeState,
  type EncounterDefinition,
  type EngineInventoryItem,
  type JourneyMapNode,
  type JourneyRuntimeState,
  type LeaveRuntimeState,
  type ManualResolutionRuntimeState,
  type SeasonRuntimeState,
  type ServiceRuntimeState,
  type TravelGraphNode
} from './index';

const serviceGraph = (): Record<string, TravelGraphNode> => ({
  city: { id: 'city', name: 'Newdam', region: 'Meadow', locationType: 'City', edges: [{ to: 'wild', kind: 'path' }] },
  wild: { id: 'wild', name: 'Willow Path', region: 'Forest', locationType: 'Wilds', edges: [{ to: 'city', kind: 'path' }, { to: 'barrow', kind: 'path' }] },
  barrow: { id: 'barrow', name: 'Old Barrow', region: 'Forest', locationType: 'Behemoth Barrow', edges: [{ to: 'wild', kind: 'path' }] }
});

const journeyGraph = (): Record<string, JourneyMapNode> => {
  const graph: Record<string, JourneyMapNode> = {
    origin: { id: 'origin', name: 'Odoak', x: 0, y: 0, region: 'Forest', locationType: 'Settlement', neighbors: ['east-1'] }
  };
  for (let path = 1; path <= 15; path += 1) {
    const id = `east-${path}`;
    graph[id] = {
      id,
      name: path === 15 ? 'Far Settlement' : `East Path ${path}`,
      x: path,
      y: 0,
      region: 'Meadow',
      locationType: path === 15 ? 'Settlement' : 'Wilds',
      neighbors: [path === 1 ? 'origin' : `east-${path - 1}`]
    };
    if (path > 1) graph[`east-${path - 1}`].neighbors.push(id);
  }
  return graph;
};

const journeyRuntime = (): JourneyRuntimeState => ({
  currentLocationId: 'origin',
  reputation: 5,
  inventory: [],
  patients: [],
  pendingEncounter: null,
  pendingBarter: null,
  pendingForaging: null,
  journey: null,
  pendingEnding: null,
  downtimeRequired: false,
  journalEvents: [],
  appliedTransactionIds: []
});

const remedyInventory = (prefix: string) => {
  const ingredients: EngineInventoryItem[] = REAGENTS.flatMap(reagent => reagent.preparations.map((part, index) => ({
    id: `${prefix}:${reagent.id}:${index}`,
    name: part.name,
    type: 'reagent' as const,
    weight: part.weight,
    canonicalReagentId: reagent.id,
    preparationId: part.id,
    usesRemaining: part.uses
  })));
  const tools: EngineInventoryItem[] = ['belt-knife', 'mortar-and-pestle', 'camp-kettle', 'teeth', 'paws', 'copper-frying-pan', 'big-iron-cauldron']
    .map(id => ({ id: `${prefix}:tool:${id}`, name: id, type: 'tool' as const, weight: 0, canonicalToolId: id }));
  return { ingredients, tools, inventory: [...ingredients, ...tools] };
};

describe('Release Candidate rulebook closure', () => {
  it('[CORE-002/TRAVEL-009/FORAGE-006/AILMENT-003] accounts for every printed effect without an unlabelled fallback', () => {
    const classes = PRINTED_EFFECT_REGISTRY.reduce<Record<string, number>>((counts, effect) => {
      const classification = classifyPrintedEffect(effect);
      counts[classification] = (counts[classification] || 0) + 1;
      return counts;
    }, { deterministic: 0, 'structured-choice': 0, narrative: 0, ambiguous: 0 });

    expect(PRINTED_EFFECT_REGISTRY).toHaveLength(358);
    expect(Object.values(classes).reduce((sum, count) => sum + count, 0)).toBe(358);
    expect(classes).toMatchObject({ deterministic: 15, 'structured-choice': 13, narrative: 330, ambiguous: 0 });
    expect(PRINTED_EFFECT_REGISTRY.filter(effect => effect.status === 'implemented')).toHaveLength(22);
    expect(PRINTED_EFFECT_REGISTRY.filter(effect => effect.status === 'manual')).toHaveLength(336);
    expect(PRINTED_EFFECT_REGISTRY.every(effect => effect.sourcePage >= 6 && effect.sourcePage <= 213)).toBe(true);
    expect(PRINTED_EFFECT_REGISTRY.filter(effect => effect.status === 'manual').every(effect => effect.manualResolution?.reason.trim())).toBe(true);
  });

  it('[JOURNEY-001/JOURNEY-003/JOURNEY-004/DOWNTIME-001] completes a 15-Path campaign leg and preserves the original ending rules', () => {
    const started = resolveJourneyStart({
      transactionId: 'rc:journey:start',
      state: journeyRuntime(),
      graph: journeyGraph(),
      originId: 'origin',
      season: 'Spring',
      destinationCard: { value: 8, suit: '♣' },
      destinationId: 'east-15',
      goalCard: 8,
      reason: 'Deliver evidence to the distant guildhall.',
      startDate: 1,
      rulesetId: 'original-1e-3p'
    });
    expect(started.value?.journey?.destinationRequirements.distanceBand).toBe('far');
    expect(started.value?.inventory.find(item => item.name === 'Evidence')?.weight).toBe(1);

    const arrived = { ...started.value!, currentLocationId: 'east-15' };
    const ended = resolveJourneyEnding({
      transactionId: 'rc:journey:end',
      state: arrived,
      endedAt: 16,
      outcome: 'success',
      journalText: 'The evidence reached the guildhall intact.'
    });
    expect(ended.value?.journey?.status).toBe('completed');
    expect(ended.value?.downtimeRequired).toBe(true);
    expect(ended.value?.reputation).toBe(5);
    expect(RULESETS['original-1e-3p'].houseRules.legacySuccession).toBe(false);
  });

  it('[DOWNTIME-001/CLINIC-001/CLINIC-002/SERVICE-001/JOURNEY-002] advances two complete years with Guild, Clinic, and Downtime state intact', () => {
    const graph = serviceGraph();
    const commissioned = commissionClinic({
      transactionId: 'rc:clinic',
      state: {
        currentSeason: 'Spring', completedSeasons: 4, trinkets: 40, reputation: 15,
        clinics: [], agendaIds: ['taproom'], goodwillWeight: 0, graph, appliedTransactionIds: [], journalEvents: []
      },
      locationId: 'wild',
      name: 'Field Clinic',
      locationType: 'Wild',
      curedHere: true,
      agendaId: 'hostel'
    });

    const guildState: ServiceRuntimeState = {
      currentLocationId: 'wild', currentLocationName: 'Bogstead', currentLocationType: 'Settlement', currentRegion: 'Bog',
      currentSeason: 'Spring', calendarDays: 0, trinkets: commissioned.trinkets, inventory: [], graph,
      mapMutations: [], pendingServices: [], usedJourneyServiceIds: [], weatherProtectionMoves: 0, weatherProtectionActive: false,
      travelEncounterRerolls: 0, missiveSettlementIds: [], removedThreatIds: [], appliedTransactionIds: commissioned.appliedTransactionIds,
      journalEvents: commissioned.journalEvents
    };
    const guild = resolveGuildService({ transactionId: 'rc:guild', state: guildState, serviceId: 'forecast', journalNote: 'Read the cloud signs.' });
    expect(guild.value?.nextState.weatherProtectionMoves).toBe(3);

    let seasonState: SeasonRuntimeState = {
      season: 'Spring', completedSeasons: 4, reputation: 15, trinkets: guild.value!.nextState.trinkets,
      clinics: commissioned.clinics.map(clinic => ({
        id: clinic.id, locationId: clinic.locationId, status: clinic.status,
        completesAtSeason: clinic.completesAtSeason, gardenReagentId: null
      })),
      agendaServices: ['hostel'], goodwillDonatedWeight: 0,
      companions: [{ id: 'companion-1', kind: 'caterpillar', seasonsTravelled: 0 }],
      downtimeCompleted: false,
      journalEvents: guild.value!.nextState.journalEvents,
      appliedTransactionIds: guild.value!.nextState.appliedTransactionIds
    };

    for (let season = 0; season < 8; season += 1) {
      const downtime = resolveDowntime({
        transactionId: `rc:downtime:${season}`,
        activity: season === 0 ? 'general-practice' : 'lend-a-paw',
        state: {
          downtimeCompleted: seasonState.downtimeCompleted,
          reputation: seasonState.reputation,
          trinkets: seasonState.trinkets,
          journalEvents: seasonState.journalEvents,
          appliedTransactionIds: seasonState.appliedTransactionIds
        }
      });
      seasonState = {
        ...seasonState,
        reputation: downtime.value!.nextState.reputation,
        trinkets: downtime.value!.nextState.trinkets,
        downtimeCompleted: true,
        journalEvents: downtime.value!.nextState.journalEvents,
        appliedTransactionIds: downtime.value!.nextState.appliedTransactionIds
      };
      seasonState = resolveSeasonBoundary({ transactionId: `rc:season:${season}`, state: seasonState }).value!.nextState;
    }

    expect(seasonState.season).toBe('Spring');
    expect(seasonState.clinics[0].status).toBe('active');
    expect(seasonState.companions[0].kind).toBe('butterfly');
    expect(seasonState.appliedTransactionIds).toHaveLength(18);
  });

  it('[AILMENT-005/REMEDY-003/BARROW-005/SAVE-001/SAVE-005] preserves failed treatment, rare Replacement, death, and hostile-save recovery', () => {
    const dire = AILMENTS.find(ailment => ailment.canonicalName === 'Titan Touched')!;
    const patient = resolvePatient({ id: 'rc:patient', name: 'Rowan', species: 'Vole', ailmentIds: [dire.id] }).value!;
    const failure = resolveTreatmentTransaction({
      mode: 'fail-expired',
      transactionId: 'rc:treatment:failure',
      state: { inventory: [], patient, reputation: 12, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceIds: patient.ailments.map(ailment => ailment.id),
      journalText: 'The printed consequence was recorded before leaving.'
    });
    expect(failure.value?.nextState.patient.status).toBe('failed');
    expect(failure.value?.reputationChange).toBe(-4);

    const leaveState: LeaveRuntimeState = {
      inventory: [], patient: failure.value!.nextState.patient, reputation: failure.value!.nextState.reputation,
      trinkets: 0, currentRegion: 'Forest', adjacentRegions: ['Meadow'], foragingPoints: 0,
      pendingObligation: null, journalEvents: failure.value!.nextState.journalEvents,
      appliedTransactionIds: failure.value!.nextState.appliedTransactionIds
    };
    const acquisition = {
      ...createReplacementAcquisition({ targetTag: 'PAIN', requiredPotency: 3, name: 'Moon Sap', preparation: 'Brewed Resin' }),
      selectedSource: 'forage' as const
    };
    const replacement = commitAlternativeAcquisition({
      transactionId: 'rc:replacement', state: leaveState, acquisition, source: 'forage',
      sourceTransactionId: 'rc:forage:replacement', acquisitionSucceeded: true
    });
    expect(replacement.value?.inventory[0]).toMatchObject({ weight: 2 / 3, customReagent: { baseRarity: 12 } });

    const barrowState: BarrowRuntimeState = {
      currentLocationId: 'barrow', calendarDays: 0, reputation: 5, trinkets: 0, carry: 4, speed: 3,
      inventory: [], companions: [], graph: serviceGraph(),
      barrows: [{ id: 'rc:barrow', name: 'Old Barrow', behemothClass: 'Violent', locationId: 'barrow', removed: false }],
      activeDelve: null, movementBlocked: false, needsLocalHelp: false, nextMoveSpeedOverride: null,
      pursuit: null, journeyEnded: false, appliedTransactionIds: [], journalEvents: []
    };
    let delve = startBarrowDelve({ transactionId: 'rc:barrow:start', state: barrowState, barrowId: 'rc:barrow', suit: '♣', journalNote: 'Entered quietly.' }).value!;
    delve = beginBarrowChallenge('rc:barrow:begin', delve).value!;
    delve = drawPilferCard('rc:barrow:draw-1', delve, { value: 12, suit: '♣' }).value!;
    const death = drawPilferCard('rc:barrow:draw-2', delve, { value: 12, suit: '♠' });
    expect(death.value?.journeyEnded).toBe(true);

    const migrated = migrateSavedRulesState(JSON.parse(JSON.stringify({
      reputation: 9,
      activeAilment: { id: 'legacy', name: dire.canonicalName, severity: 'dire', timer: 1, maxTimer: dire.timer, tags: 'PAIN 3', patientName: 'Old Patient', species: 'Mouse' },
      unknownCampaignMemory: { note: 'preserve me' }
    })));
    expect(migrated).toMatchObject({ schemaVersion: CURRENT_SCHEMA_VERSION, rulesetId: 'legacy-campaign', unknownCampaignMemory: { note: 'preserve me' } });
  });

  it('[SAVE-001/SAVE-005/UX-003] completes the canonical campaign loop, reloads, and continues without a legacy gameplay write', () => {
    const graph = serviceGraph();
    const started = resolveJourneyStart({
      transactionId: 'rc:loop:journey', state: journeyRuntime(), graph: journeyGraph(), originId: 'origin',
      season: 'Spring', destinationCard: { value: 8, suit: '♣' }, destinationId: 'east-15', goalCard: 8,
      reason: 'Carry a guild record east.', startDate: 1, rulesetId: 'original-1e-3p'
    }).value!;
    const travelled = resolveTravel({
      transactionId: 'rc:loop:travel',
      state: {
        currentLocationId: 'city', currentLocationName: 'Newdam', currentRegion: 'Meadow', currentLocationType: 'City',
        baseSpeed: 1, carry: 4, inventory: started.inventory, calendarDays: 1, visitedLocationIds: ['city'],
        needsLocalHelp: false, canSoar: false, ridingWagon: false, experimentalContraption: false
      },
      graph, destinationId: 'wild', destinationRegion: 'Forest', destinationType: 'Wilds', mode: 'move',
      card: { value: 7, suit: '♥' }, season: 'Spring', canStopInLoch: false
    }).value!;
    expect(travelled.nextState.currentLocationId).toBe('wild');

    const forageState = {
      season: 'Spring' as const, currentRegion: 'Forest' as const, currentLocationType: 'Wilds' as const,
      foragingPoints: 12, inventory: travelled.nextState.inventory, toolIds: []
    };
    const foragePreview = resolveForaging({
      transactionId: 'rc:loop:forage:preview', state: forageState, forageRegion: 'Forest',
      locationRelation: 'current', card: { value: 12, suit: '♣' }, skipEncounter: true
    }).value!;
    const forageCandidate = foragePreview.candidates.find(candidate => REAGENTS.find(reagent => reagent.id === candidate.reagentId)
      ?.preparations.some(part => part.requiredTools.every(tool => tool === 'none'))) !;
    const foragePart = REAGENTS.find(reagent => reagent.id === forageCandidate.reagentId)!.preparations
      .find(part => part.requiredTools.every(tool => tool === 'none'))!;
    const foraged = resolveForaging({
      transactionId: 'rc:loop:forage', state: forageState, forageRegion: 'Forest', locationRelation: 'current',
      card: { value: 12, suit: '♣' }, targetReagentId: forageCandidate.reagentId,
      parts: [{ preparationId: foragePart.id, quantity: 1 }], spendForagingPoints: true, skipEncounter: true
    }).value!;
    expect(foraged.gatheredItems).toHaveLength(1);

    const treatmentAilment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const secondAilment = AILMENTS.find(row => row.severity === 'intermediate')!;
    const patient = resolvePatient({
      id: 'rc:loop:patient', name: 'Pip', species: 'Vole', ailmentIds: [treatmentAilment.id, secondAilment.id]
    }).value!;
    const treatmentItems = remedyInventory('rc:loop:treatment');
    const treated = resolveTreatment({
      mode: 'treat', transactionId: 'rc:loop:treatment',
      state: { inventory: treatmentItems.inventory, patient, reputation: 10, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: patient.ailments[0].id,
      selectedItemIds: treatmentItems.ingredients.map(item => item.id),
      selectedToolIds: treatmentItems.tools.map(item => item.id), journalText: 'Prepared the first remedy.'
    }).value!;
    expect(treated.nextState.patient.ailments[0].status).toBe('treated');
    expect(treated.nextState.patient.ailments.some(row => row.status === 'active')).toBe(true);

    const printed = PRINTED_EFFECT_REGISTRY.find(row => row.status === 'manual' && row.supportedTriggers.length > 0)!;
    const manualDraft = createManualEffectDraft(printed, printed.supportedTriggers[0], { patientId: patient.id }, 20);
    manualDraft.inputValues = Object.fromEntries(manualDraft.inputFields.filter(field => field.required).map(field => [
      field.id, field.type === 'condition' ? true : field.type === 'number' ? 1 : '원문 결과를 확인함'
    ]));
    manualDraft.resultSummary = '원문에 따라 결과를 확정했다.';
    manualDraft.journalNote = '수동 판정 근거와 결과를 기록했다.';
    const manualState: ManualResolutionRuntimeState = {
      reputation: treated.nextState.reputation, trinkets: treated.nextState.trinkets, calendarDays: 2,
      foragingPoints: 0, inventory: treated.nextState.inventory, patient: treated.nextState.patient,
      conditions: [], pendingFollowUps: [], appliedTransactionIds: treated.nextState.appliedTransactionIds
    };
    const manual = resolveManualEffectTransaction({ draft: manualDraft, transactionId: 'rc:loop:manual', state: manualState, resolvedAt: 21 }).value!;
    expect(manual.record.status).toBe('resolved');

    const barterGraph: Record<string, BarterMapNode> = {
      wild: { id: 'wild', region: 'Forest', locationType: 'Wilds', neighbors: ['settlement'] },
      settlement: { id: 'settlement', region: 'Forest', locationType: 'Settlement', neighbors: ['wild'] }
    };
    const target = REAGENTS.find(row => row.type !== 'TITAN')!;
    const gossip: EngineInventoryItem = { id: 'rc:loop:gossip', name: 'Juicy Gossip', type: 'item', weight: 0, guildNote: { kind: 'gossip' } };
    const barterRuntime: BarterRuntimeState = {
      inventory: [...manual.nextState.inventory, gossip], patient: manual.nextState.patient!, reputation: manual.nextState.reputation,
      trinkets: 30, attemptHistory: {}, pendingBarter: null, journalEvents: [], appliedTransactionIds: manual.nextState.appliedTransactionIds
    };
    const barterStarted = resolveBarterStart({
      transactionId: 'rc:loop:barter', state: barterRuntime, patientId: barterRuntime.patient.id,
      targetReagentId: target.id, preparationId: target.preparations[0].id,
      currentLocationId: 'settlement', locationId: 'settlement', season: 'Spring', graph: barterGraph
    }).value!;
    const socialEncounter: EncounterDefinition = {
      id: 'rc:loop:social', encounterType: 'social', region: 'Forest', isSettlement: true, isTitan: false,
      locationType: 'Settlement', suit: '♥', title: 'A familiar stall', prompt: 'Record the conversation.',
      mandatoryEffects: [], choices: [], support: 'implemented', ...canonicalMetadata(190)
    };
    const social = resolveBarterEncounter({
      transactionId: 'rc:loop:social', state: barterStarted, card: { value: 6, suit: '♥' }, encounter: socialEncounter
    }).value!;
    const bartered = resolveBarterGossip({ transactionId: 'rc:loop:gossip-use', state: social, gossipItemId: gossip.id }).value!;
    expect(bartered.inventory.some(item => item.type === 'reagent')).toBe(true);
    expect(bartered.inventory.some(item => item.id === gossip.id)).toBe(false);

    const barrowAilment = AILMENTS.find(row => row.severity === 'intermediate')!;
    let barrow: BarrowRuntimeState = {
      currentLocationId: 'barrow', calendarDays: 2, reputation: bartered.reputation, trinkets: bartered.trinkets,
      carry: 4, speed: 3, inventory: remedyInventory('rc:loop:barrow').inventory, companions: [], graph,
      barrows: [{ id: 'rc:loop:barrow', name: 'Old Barrow', behemothClass: 'Demanding', locationId: 'barrow', removed: false }],
      activeDelve: null, movementBlocked: false, needsLocalHelp: false, nextMoveSpeedOverride: null,
      pursuit: null, journeyEnded: false, appliedTransactionIds: [], journalEvents: [], patients: [], activePatientId: null,
      patientArchive: [], archiveContext: { location: 'Old Barrow', encounteredAt: 22, resolvedAt: 23, sourceJourneyId: 'rc:loop:journey' }
    };
    barrow = startBarrowDelve({ transactionId: 'rc:loop:barrow:start', state: barrow, barrowId: 'rc:loop:barrow', suit: '♥', journalNote: 'Listened before entering.' }).value!;
    barrow = beginBarrowChallenge('rc:loop:barrow:begin', barrow).value!;
    barrow = diagnoseBuildingTrust('rc:loop:barrow:diagnose', barrow, barrowAilment.id).value!;
    const barrowPatient = barrow.patients!.find(row => row.id === barrow.activePatientId)!;
    const barrowIngredients = barrow.inventory.filter(item => item.type === 'reagent');
    const barrowTools = barrow.inventory.filter(item => item.type === 'tool');
    const barrowTreatment = resolveTreatment({
      mode: 'treat', transactionId: 'rc:loop:barrow:treatment',
      state: { inventory: barrow.inventory, patient: barrowPatient, reputation: barrow.reputation, trinkets: barrow.trinkets, journalEvents: barrow.journalEvents, appliedTransactionIds: barrow.appliedTransactionIds },
      ailmentInstanceId: barrowPatient.ailments[0].id, selectedItemIds: barrowIngredients.map(item => item.id),
      selectedToolIds: barrowTools.map(item => item.id), journalText: 'Completed the Barrow remedy.'
    }).value!;
    barrow = {
      ...barrow, inventory: barrowTreatment.nextState.inventory, reputation: barrowTreatment.nextState.reputation,
      trinkets: barrowTreatment.nextState.trinkets, journalEvents: barrowTreatment.nextState.journalEvents,
      appliedTransactionIds: barrowTreatment.nextState.appliedTransactionIds,
      patients: barrow.patients!.map(row => row.id === barrowPatient.id ? barrowTreatment.nextState.patient : row)
    };
    const barrowClosed = resolveBuildingTrust({
      transactionId: 'rc:loop:barrow:close', state: barrow, success: true, trinketEquivalent: 2, journalNote: 'Trust was restored.'
    }).value!;
    expect(barrowClosed.activePatientId).toBeNull();
    expect(barrowClosed.patientArchive).toHaveLength(1);

    const downtime = resolveDowntime({
      transactionId: 'rc:loop:downtime', activity: 'lend-a-paw',
      state: { downtimeCompleted: false, reputation: barrowClosed.reputation, trinkets: barrowClosed.trinkets, journalEvents: barrowClosed.journalEvents, appliedTransactionIds: barrowClosed.appliedTransactionIds }
    }).value!;
    const season = resolveSeasonBoundary({
      transactionId: 'rc:loop:season',
      state: {
        season: 'Spring', completedSeasons: 0, reputation: downtime.nextState.reputation, trinkets: downtime.nextState.trinkets,
        clinics: [], agendaServices: [], goodwillDonatedWeight: 0, companions: [], downtimeCompleted: true,
        journalEvents: downtime.nextState.journalEvents, appliedTransactionIds: downtime.nextState.appliedTransactionIds
      }
    }).value!;

    const save = JSON.parse(JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION, rulesetId: 'original-1e-3p', activePatientId: null,
      patients: barrowClosed.patients, patientArchive: barrowClosed.patientArchive, currentSeason: season.nextSeason,
      reputation: season.nextState.reputation, trinkets: season.nextState.trinkets,
      appliedTransactionIds: season.nextState.appliedTransactionIds, pendingEncounter: null, pendingForaging: null, pendingBarter: null
    }));
    const reloaded = migrateSavedRulesState(save);
    expect(reloaded).toMatchObject({ schemaVersion: CURRENT_SCHEMA_VERSION, rulesetId: 'original-1e-3p', activePatientId: null });
    expect(reloaded.patientArchive).toHaveLength(1);

    const continued = resolveJourneyStart({
      transactionId: 'rc:loop:continue', state: { ...journeyRuntime(), reputation: reloaded.reputation }, graph: journeyGraph(),
      originId: 'origin', season: reloaded.currentSeason, destinationCard: { value: 8, suit: '♣' },
      destinationId: 'east-15', goalCard: 3, reason: 'Begin the next chapter.', startDate: 25, rulesetId: reloaded.rulesetId
    });
    expect(continued.status).toBe('resolved');
    expect(continued.value?.journey?.status).toBe('active');
  });
});
