import { describe, expect, it } from 'vitest';
import { FAMILIAR_BENEFITS, getActiveFamiliarMechanic, hasTool } from '../rulesEngine';
import {
  AILMENTS,
  AILMENT_BY_ID,
  AILMENT_WORDING_CLAUSES,
  ALMANACK_TOOLS,
  CLINIC_AGENDAS,
  COMPANIONS,
  GUILD_SERVICES,
  REAGENTS,
  TOOL_UPGRADES,
  WAGON_EXPANSIONS,
  canonicalMetadata,
  commissionClinic,
  completeGuildServiceDelivery,
  consumeGuildServiceMissive,
  consumeGuildServiceMove,
  consumeGuildServiceTravelReroll,
  getPassengerDestinationOptions,
  resolveBraveTravelEffect,
  resolveClayPotHarvest,
  resolveClinicAgendaAction,
  resolveCompanionAdoption,
  resolveCompanionStorage,
  resolveCompanionTravel,
  resolveForaging,
  resolveGuildService,
  resolveGuildServiceJourneyEnd,
  resolveGuildServiceJourneyStart,
  resolveInstrumentShow,
  resolveKnittingProject,
  resolvePassengerPickupAvailability,
  resolvePatient,
  resolveTreatment,
  resolveToolEffects,
  resolveTravel,
  resolveWagonCapabilities,
  resolveWaterwayPermissions,
  restoreSeasonalServiceMutations,
  saddlebagsCarryBonus,
  withIngenuitiveToolBenefit,
  type CanonicalToolState,
  type ClinicAgendaRuntimeState,
  type EngineInventoryItem,
  type MobilityRuntimeState,
  type PatientState,
  type ServiceRuntimeState,
  type TravelGraphNode
} from './index';

const graph = (): Record<string, TravelGraphNode> => ({
  a: { id: 'a', name: 'Bogstead', x: 0, y: 0, region: 'Bog', locationType: 'Settlement', edges: [{ to: 'b', kind: 'waterway' }] },
  b: { id: 'b', name: 'Reedway', x: 1, y: 0, region: 'Loch', locationType: 'Wilds', edges: [{ to: 'a', kind: 'waterway' }, { to: 'c', kind: 'waterway' }] },
  c: { id: 'c', name: 'Far Bank', x: 2, y: 0, region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'b', kind: 'waterway' }, { to: 'd', kind: 'path' }] },
  d: { id: 'd', name: 'Clover Field', x: 3, y: 0, region: 'Meadow', locationType: 'Wilds', edges: [{ to: 'c', kind: 'path' }] }
});

const serviceState = (overrides: Partial<ServiceRuntimeState> = {}): ServiceRuntimeState => ({
  currentLocationId: 'a', currentLocationName: 'Bogstead', currentLocationType: 'Settlement', currentRegion: 'Bog',
  currentSeason: 'Spring', calendarDays: 0, trinkets: 50, inventory: [], graph: graph(), mapMutations: [],
  pendingServices: [], usedJourneyServiceIds: [], weatherProtectionMoves: 0, weatherProtectionActive: false,
  travelEncounterRerolls: 0, missiveSettlementIds: [], removedThreatIds: [], appliedTransactionIds: [], journalEvents: [],
  ...overrides
});

const mobilityState = (overrides: Partial<MobilityRuntimeState> = {}): MobilityRuntimeState => ({
  wagon: { commissioned: true, expansionIds: [], clayPotReagentId: null, clayPotMoves: 0 },
  companions: [], storedCompanions: [], passenger: null, passengerPickupReady: false,
  reputation: 0, trinkets: 0, inventory: [], season: 'Spring', appliedTransactionIds: [], journalEvents: [],
  ...overrides
});

const tool = (instanceId: string, toolId: string, upgradeId: string | null = null): CanonicalToolState => ({
  instanceId, toolId, upgradeId, charges: null, broken: false, consumed: false, acquiredBy: 'test', appliedEffectIds: []
});

describe('Phase 10 release blocker elimination', () => {
  it('[CHARACTER-002/CHARACTER-005] keeps current Style permissions and all twelve Familiar mechanics canonical', () => {
    expect(FAMILIAR_BENEFITS).toHaveLength(12);
    expect(new Set(FAMILIAR_BENEFITS.map(row => row.mechanic)).size).toBe(12);
    expect(getActiveFamiliarMechanic({
      bio: { familiarBenefit: FAMILIAR_BENEFITS[0].name }, bag: [], currentRegion: 'Forest', currentSeason: 'Spring', reputation: 0,
      wagonState: { commissioned: true, expansionIds: ['passenger-booth'] },
      activePassenger: { roleBenefit: FAMILIAR_BENEFITS[2].name }
    })).toBe('brave');

    const local = REAGENTS.find(row => row.baseRarity <= 6 && row.regionAvailability.Forest !== 'Unavailable')!;
    const brave = resolveBraveTravelEffect({
      transactionId: 'p10:brave', inventory: [],
      encounter: { id: 'p10:behemoth', encounterType: 'travel', region: 'Forest', suit: '♥',
        isSettlement: false, isTitan: false, title: 'Behemoth', prompt: '', tags: ['Behemoth'], mandatoryEffects: [], choices: [],
        support: 'manual-only', ...canonicalMetadata(1) },
      region: 'Forest', card: { value: 5, suit: '♥' }, reagentId: local.id, preparationId: local.preparations[0].id
    });
    expect(brave.status).toBe('resolved');
    expect(brave.inventory).toHaveLength(1);

    const ingenuitive = FAMILIAR_BENEFITS.find(row => row.mechanic === 'ingenuitive')!;
    expect(hasTool({
      bio: { familiarBenefit: FAMILIAR_BENEFITS[0].name }, bag: [], currentRegion: 'Forest', currentSeason: 'Spring', reputation: 0,
      wagonState: { commissioned: true, expansionIds: ['passenger-booth'] },
      activePassenger: { roleBenefit: ingenuitive.name, ingenuitiveToolId: 'glass-alembic' }
    }, 'glass-alembic')).toBe(true);
  });

  it('[TRAVEL-002/WAGON-001/WAGON-004] resolves mixed Path and Waterway segments without flattening the route', () => {
    const result = resolveTravel({
      transactionId: 'p10:travel',
      state: { currentLocationId: 'a', currentLocationName: 'Bogstead', currentRegion: 'Bog', currentLocationType: 'Settlement',
        baseSpeed: 2, carry: 4, inventory: [{ id: 'herb', name: 'Herb', type: 'reagent', weight: 1, ruinedWhenSoaked: true }],
        calendarDays: 0, visitedLocationIds: ['a'], needsLocalHelp: false, canSoar: false, ridingWagon: true, experimentalContraption: false },
      graph: graph(), destinationId: 'd', destinationRegion: 'Meadow', destinationType: 'Wilds', mode: 'move',
      card: { value: 5, suit: '♣' }, season: 'Spring', route: ['a', 'b', 'c', 'd'], canStopInLoch: true,
      protectsFromSoaking: true, waterwaySpan: 2
    });
    expect(result.value?.pathCount).toBe(3);
    expect(result.value?.movementCost).toBe(2);
    expect(result.value?.soakedItemIds).toEqual([]);

    const wagon: MobilityRuntimeState['wagon'] = { commissioned: false, expansionIds: [], clayPotReagentId: null, clayPotMoves: 0 };
    const waxed = resolveWaterwayPermissions([tool('waxed', 'waxed-satchel')], wagon);
    const coracle = resolveWaterwayPermissions([tool('coracle', 'bark-coracle')], wagon);
    expect(waxed).toMatchObject({ canStopInLoch: false, protectsFromSoaking: true });
    expect(coracle).toMatchObject({ canStopInLoch: true, protectsFromSoaking: true });
    const illegalLochStop = resolveTravel({
      transactionId: 'p11:waxed-loch-stop',
      state: { currentLocationId: 'a', currentLocationName: 'Bogstead', currentRegion: 'Bog', currentLocationType: 'Settlement',
        baseSpeed: 2, carry: 4, inventory: [], calendarDays: 0, visitedLocationIds: ['a'], needsLocalHelp: false,
        canSoar: false, ridingWagon: false, experimentalContraption: false },
      graph: graph(), destinationId: 'b', destinationRegion: 'Loch', destinationType: 'Wilds', mode: 'move',
      card: { value: 5, suit: '♣' }, season: 'Spring', route: ['a', 'b'], mustUseFullSpeed: false,
      canStopInLoch: waxed.canStopInLoch, protectsFromSoaking: waxed.protectsFromSoaking
    });
    expect(illegalLochStop.status).toBe('invalid');
    expect(illegalLochStop.messages.join(' ')).toMatch(/cannot normally end/i);
  });

  it('[CLINIC-001/CLINIC-005] uses completed Seasons and commits stateful Agenda actions', () => {
    const commissioned = commissionClinic({
      transactionId: 'p10:clinic',
      state: { currentSeason: 'Spring', completedSeasons: 4, trinkets: 30, reputation: 15, clinics: [], agendaIds: [], goodwillWeight: 0,
        graph: graph(), visitedLocationNames: ['Noonhill'], appliedTransactionIds: [], journalEvents: [] },
      locationId: 'd', name: 'Clover Clinic', locationType: 'Wild', curedHere: true, agendaId: 'gardens'
    });
    expect(commissioned.clinics[0].status).toBe('building');
    expect(() => commissionClinic({
      transactionId: 'p10:clinic:early', state: { ...commissioned, completedSeasons: 3, clinics: [] },
      locationId: 'd', name: 'Early Clinic', locationType: 'Wild', curedHere: true
    })).toThrow(/four completed Seasons/);
    expect(() => commissionClinic({
      transactionId: 'p11:clinic:locked-agenda',
      state: { ...commissioned, clinics: [], agendaIds: [], visitedLocationNames: [] },
      locationId: 'd', name: 'Locked Garden', locationType: 'Wild', curedHere: true, agendaId: 'gardens'
    })).toThrow(/Noonhill/);
    expect(CLINIC_AGENDAS).toHaveLength(10);

    const plant = REAGENTS.find(row => row.type === 'PLANT')!;
    const item: EngineInventoryItem = { id: 'plant', name: plant.canonicalName, type: 'reagent', weight: 1,
      canonicalReagentId: plant.id, preparationId: plant.preparations[0].id, usesRemaining: 1 };
    const agendaState: ClinicAgendaRuntimeState = {
      season: 'Spring', reputation: 15, trinkets: 20, inventory: [item], patient: null,
      clinics: [{ ...commissioned.clinics[0], status: 'active' }], agendaIds: ['gardens', 'mailbox'], goodwillWeight: 0,
      soddenReagentId: null, appliedTransactionIds: [], journalEvents: []
    };
    const planted = resolveClinicAgendaAction({ transactionId: 'p10:garden', state: agendaState,
      action: { kind: 'plant-garden', clinicId: commissioned.clinics[0].id, itemId: item.id } });
    const mailboxNote = '  A Guild request from Odoak.\nBring warm blankets.  ';
    const called = resolveClinicAgendaAction({ transactionId: 'p10:mailbox', state: planted,
      action: { kind: 'record-mailbox-call', note: mailboxNote } });
    expect(called.clinics[0].gardenReagentId).toBe(plant.id);
    expect(called.journalEvents.at(-1)?.title).toBe('Guild Mailbox call');
    expect(called.journalEvents.at(-1)).toMatchObject({ text: mailboxNote, playerMemory: mailboxNote });

    const donated = resolveClinicAgendaAction({
      transactionId: 'p11:goodwill-stack',
      state: { ...agendaState, agendaIds: ['goodwill-stand'], inventory: [{ ...item, id: 'stack', weight: 2 / 3, quantity: 3 }] },
      action: { kind: 'donate-goodwill', itemId: 'stack' }
    });
    expect(donated.goodwillWeight).toBe(2);
  });

  it('[ALMANACK-004/SERVICE-001/SERVICE-002/SERVICE-005] closes Service duration, movement, and delivery consumers', () => {
    expect(GUILD_SERVICES).toHaveLength(17);
    const forecast = resolveGuildService({ transactionId: 'p10:forecast', state: serviceState(), serviceId: 'forecast', journalNote: 'Forecast read.' });
    expect(forecast.value?.nextState.weatherProtectionMoves).toBe(3);
    let moved = forecast.value!.nextState;
    for (let move = 0; move < 3; move += 1) {
      moved = consumeGuildServiceMove({ transactionId: `p10:move:${move}`, state: moved, destinationId: 'd', destinationRegion: 'Meadow', mode: 'move', pathCount: 1 }).value!.nextState;
    }
    expect(moved.weatherProtectionMoves).toBe(0);

    const shortcut = resolveGuildService({ transactionId: 'p10:shortcut', state: serviceState({ currentLocationName: 'Forest Rest', currentRegion: 'Forest' }),
      serviceId: 'shortcut', targetIds: ['b'], journalNote: 'Underbrush route.' });
    expect(shortcut.value?.nextState.currentLocationId).toBe('b');

    const deliveryGraph: Record<string, TravelGraphNode> = {};
    for (let index = 0; index <= 5; index += 1) deliveryGraph[`n${index}`] = {
      id: `n${index}`, name: index === 0 ? 'Vessel' : `Road ${index}`, region: 'Loch',
      locationType: index === 0 || index === 5 ? 'Settlement' : 'Wilds',
      edges: [index > 0 ? { to: `n${index - 1}`, kind: 'path' as const } : null, index < 5 ? { to: `n${index + 1}`, kind: 'path' as const } : null].filter(Boolean) as Array<{ to: string; kind: 'path' }>
    };
    const reagent = REAGENTS.find(row => row.type !== 'TITAN')!;
    const retrieval = resolveGuildService({ transactionId: 'p10:retrieval',
      state: serviceState({ currentLocationId: 'n0', currentLocationName: 'Vessel', currentRegion: 'Loch', graph: deliveryGraph }),
      serviceId: 'retrieval', targetIds: ['n5'], selectedReagentId: reagent.id, selectedPreparationId: reagent.preparations[0].id, journalNote: 'Retrieve medicine.' });
    const delivered = completeGuildServiceDelivery({ transactionId: 'p10:retrieval:complete',
      state: { ...retrieval.value!.nextState, currentLocationId: 'n5', currentLocationName: 'Road 5' }, serviceTransactionId: 'p10:retrieval' });
    expect(delivered.value?.nextState.inventory.some(row => row.canonicalReagentId === reagent.id)).toBe(true);

    const survey = resolveGuildService({
      transactionId: 'p11:survey-existing-path',
      state: serviceState({ currentLocationType: 'City' }),
      serviceId: 'survey-paths', targetIds: ['d', 'b', 'c'], journalNote: 'Joined Clover Field to the Reedway path.'
    });
    expect(survey.value?.nextState.graph.d.edges.some(edge => edge.to === 'b')).toBe(true);
    expect(survey.value?.nextState.graph.d.edges.some(edge => edge.to === 'c')).toBe(true);
    expect(survey.value?.nextState.graph.b.edges.some(edge => edge.to === 'c')).toBe(true);

    const beforeJourney = serviceState({
      usedJourneyServiceIds: ['rug-of-wonders'], weatherProtectionMoves: 2,
      travelEncounterRerolls: 1, missiveSettlementIds: ['a']
    });
    const journeyStart = resolveGuildServiceJourneyStart({ transactionId: 'p11:services:start', state: beforeJourney });
    expect(journeyStart.value).toMatchObject({
      usedJourneyServiceIds: [], weatherProtectionMoves: 2,
      travelEncounterRerolls: 1, missiveSettlementIds: ['a']
    });
    const news = consumeGuildServiceTravelReroll({ transactionId: 'p11:services:news', state: journeyStart.value! });
    expect(news.value?.travelEncounterRerolls).toBe(0);
    const missive = consumeGuildServiceMissive({ transactionId: 'p11:services:missive', state: news.value!, settlementId: 'a' });
    expect(missive.value?.missiveSettlementIds).toEqual([]);
    const journeyEnd = resolveGuildServiceJourneyEnd({ transactionId: 'p11:services:end', state: missive.value! });
    expect(journeyEnd.value).toMatchObject({ travelEncounterRerolls: 0, weatherProtectionMoves: 2, missiveSettlementIds: [] });
  });

  it('[ALMANACK-005/ALMANACK-006/TOOL-003/TOOL-005] executes all Tool and Upgrade families through canonical transactions', () => {
    expect(ALMANACK_TOOLS).toHaveLength(18);
    expect(TOOL_UPGRADES).toHaveLength(7);
    const show = resolveInstrumentShow({ transactionId: 'p10:show', tools: [tool('instrument', 'instruments')],
      rulesetId: 'original-1e-3p', hasFamiliar: true, hasPassenger: false, hasCricket: true });
    expect(show.trinketsDelta).toBe(2);
    const upgrades = resolveToolEffects({ transactionId: 'p10:upgrades', phase: 'foraging', trigger: 'forage',
      tools: [tool('sickle', 'belt-knife', 'silver-sickle')], rulesetId: 'original-1e-3p' });
    expect(upgrades.foragingPoints).toBe(1);
    const knitting = resolveKnittingProject({ transactionId: 'p10:knit', projectId: 'knitted-satchel', availableHours: 10,
      state: { trinkets: 0, inventory: [], tools: [tool('needles', 'knitting-needles')], appliedTransactionIds: [], journalEvents: [] } });
    expect(knitting.value?.inventory[0].craftedItemId).toBe('knitted-satchel');

    const saddlebags = [tool('saddle:one', 'saddlebags'), tool('saddle:two', 'saddlebags'), tool('saddle:three', 'saddlebags')];
    expect(saddlebagsCarryBonus(saddlebags, false)).toBe(2);
    expect(saddlebagsCarryBonus(saddlebags, true)).toBe(4);

    const ingenuitiveTools = withIngenuitiveToolBenefit([], 'titan-thingamabob', 'familiar:journey:thingamabob');
    const titanSignal = resolveToolEffects({
      transactionId: 'p11:titan-signal', phase: 'travel', trigger: 'titan-proximity', tools: ingenuitiveTools,
      rulesetId: 'original-1e-3p'
    });
    expect(titanSignal.appliedToolInstanceIds).toEqual(['familiar:journey:thingamabob']);

    const anxious = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const treatmentPatient = resolvePatient({ id: 'p11:patient', name: 'Patient', species: 'Mouse', ailmentIds: [anxious.id] }).value!;
    const ingredients: EngineInventoryItem[] = REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => ({
      id: `p11:${preparation.id}`, name: preparation.name, type: 'reagent' as const, weight: preparation.weight,
      canonicalReagentId: reagent.id, preparationId: preparation.id, usesRemaining: preparation.uses
    })));
    const preparationTools: EngineInventoryItem[] = ['belt-knife', 'mortar-and-pestle', 'camp-kettle', 'teeth', 'paws', 'copper-frying-pan']
      .map(id => ({ id: `p11:${id}`, name: id, type: 'tool' as const, weight: 0, canonicalToolId: id }));
    const virtualCauldron = withIngenuitiveToolBenefit([], 'big-iron-cauldron', 'familiar:journey:cauldron');
    const preserved = resolveTreatment({
      mode: 'treat', transactionId: 'p11:ingenuitive-treatment',
      state: { inventory: [...ingredients, ...preparationTools], tools: virtualCauldron, patient: treatmentPatient,
        reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: treatmentPatient.ailments[0].id,
      selectedItemIds: ingredients.map(row => row.id),
      selectedToolIds: [...preparationTools.map(row => row.id), virtualCauldron[0].instanceId],
      preserve: true,
      journalText: 'Ingenuitive cauldron remedy.'
    });
    expect(preserved.value?.remedyFlags).toEqual(['PRESERVED']);
    expect(preserved.value?.nextState.patient.treatmentHistory[0].remedyFlags).toEqual(['PRESERVED']);

    const cookedFruit = ingredients.find(item => item.preparationId?.includes('crab-apples')
      && item.preparationId?.includes('cooked'))!;
    const ingredientPreserved = resolveTreatment({
      mode: 'treat', transactionId: 'p11:ingredient-preserved',
      state: { inventory: [...ingredients, ...preparationTools], patient: treatmentPatient,
        reputation: 0, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: treatmentPatient.ailments[0].id,
      selectedItemIds: Array.from(new Set([cookedFruit.id, ...ingredients
        .filter(row => !row.preparationId?.includes('distilled'))
        .map(row => row.id)])),
      selectedToolIds: preparationTools.map(row => row.id),
      journalText: 'Cooked fruit preserved remedy.'
    });
    expect(ingredientPreserved.value?.remedyFlags).toEqual(['PRESERVED']);
  });

  it('[WAGON-002/COMPANION-001/COMPANION-005] enforces expansion lifecycles and every Companion counter family', () => {
    expect(WAGON_EXPANSIONS).toHaveLength(10);
    expect(COMPANIONS).toHaveLength(9);
    const capabilities = resolveWagonCapabilities({ commissioned: true,
      expansionIds: ['side-brackets', 'axel-springs', 'sealed-carriage', 'pedal-motor', 'experimental-contraption'], clayPotReagentId: null, clayPotMoves: 0 });
    expect(capabilities).toMatchObject({ carryBonus: 6, speedBonus: 2, canStopInLoch: true, waterwaySpan: 2, canSoar: true, soarDays: 3 });

    const plant = REAGENTS.find(row => row.type === 'PLANT' && row.seasonAvailability.Spring !== 'Unavailable')!;
    const harvested = resolveClayPotHarvest({ transactionId: 'p10:clay', state: mobilityState({
      wagon: { commissioned: true, expansionIds: ['clay-pots'], clayPotReagentId: plant.id, clayPotMoves: 2 }
    }) });
    expect(harvested.value?.wagon.clayPotMoves).toBe(0);
    expect(harvested.value?.inventory[0].canonicalReagentId).toBe(plant.id);

    const milestone = resolveCompanionTravel([
      { instanceId: 'bee', companionId: 'honeybee', pathsTravelled: 9, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null },
      { instanceId: 'wasp', companionId: 'wasp', pathsTravelled: 9, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null, pendingForageDraws: 0 }
    ], 1);
    expect(milestone).toMatchObject({ honeyHarvests: 1, waspForageDraws: 1 });

    const passengerGraph = graph();
    expect(getPassengerDestinationOptions(passengerGraph, 'a').some(row => row.destinationId === 'a')).toBe(false);

    const passengerReady = resolvePassengerPickupAvailability({
      transactionId: 'p11:passenger-ready',
      state: mobilityState({ wagon: { commissioned: true, expansionIds: ['passenger-booth'], clayPotReagentId: null, clayPotMoves: 0 } }),
      currentLocationType: 'Settlement', remedyTraded: true
    });
    expect(passengerReady.value?.passengerPickupReady).toBe(true);
    expect(resolvePassengerPickupAvailability({
      transactionId: 'p11:passenger-gift',
      state: mobilityState({ wagon: { commissioned: true, expansionIds: ['passenger-booth'], clayPotReagentId: null, clayPotMoves: 0 } }),
      currentLocationType: 'Settlement', remedyTraded: false
    }).status).toBe('invalid');

    const fullRoster = mobilityState({
      wagon: { commissioned: true, expansionIds: ['hive-brackets'], clayPotReagentId: null, clayPotMoves: 0 },
      trinkets: 20,
      companions: [
        { instanceId: 'old:bee', companionId: 'honeybee', pathsTravelled: 0, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null },
        { instanceId: 'old:spider', companionId: 'spider', pathsTravelled: 0, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null }
      ]
    });
    expect(resolveCompanionAdoption({
      transactionId: 'p11:adopt:no-choice', state: fullRoster, companionId: 'cricket', currentRegion: 'Bog', currentLocationType: 'City'
    }).status).toBe('invalid');
    const adopted = resolveCompanionAdoption({
      transactionId: 'p11:adopt:choice', state: fullRoster, companionId: 'cricket', currentRegion: 'Bog', currentLocationType: 'City',
      replaceCompanionInstanceId: 'old:bee'
    });
    expect(adopted.value?.companions.map(row => row.companionId)).toEqual(['spider', 'cricket']);
    expect(resolveCompanionStorage({
      transactionId: 'p11:hive:away', state: fullRoster, companionInstanceId: 'old:bee', action: 'store', atClinic: false, hasHiveBoxes: true
    }).status).toBe('invalid');
    expect(resolveCompanionStorage({
      transactionId: 'p11:hive:clinic', state: fullRoster, companionInstanceId: 'old:bee', action: 'store', atClinic: true, hasHiveBoxes: true
    }).value?.storedCompanions[0].instanceId).toBe('old:bee');
  });

  it('[AILMENT-005/UX-001] proves conditional wording and the Hunted action through an executable result', () => {
    expect(AILMENT_WORDING_CLAUSES.length).toBeGreaterThan(40);
    expect(new Set(AILMENT_WORDING_CLAUSES.map(row => row.id)).size).toBe(AILMENT_WORDING_CLAUSES.length);
    expect(AILMENT_WORDING_CLAUSES.every(row => AILMENT_BY_ID.has(row.ailmentId) && row.sourcePage >= 104 && row.sourcePage <= 115 && row.consumer.trim())).toBe(true);
    expect(AILMENT_WORDING_CLAUSES.some(row => row.operator === 'may')).toBe(true);
    expect(AILMENT_WORDING_CLAUSES.some(row => row.operator === 'must')).toBe(true);
    expect(AILMENT_WORDING_CLAUSES.some(row => row.operator === 'cannot')).toBe(true);
    expect(AILMENT_WORDING_CLAUSES.some(row => row.operator === 'unless')).toBe(false);
    const normativeKeywordClauses = [
      'ailment-bad-idea:no-foul',
      'ailment-bite-the-hand-that-cures:find-first',
      'ailment-broken-beaks-and-thinning-fangs:stay',
      'ailment-groundhog-syndrome:three-patients',
      'ailment-groundhog-syndrome:warm-season-ban',
      'ailment-groundhog-syndrome:cold-season-ban',
      'ailment-seasonshift:trim-fur',
      'ailment-snail-ails:settlement-ban',
      'ailment-the-runs:woeful-waters',
      'ailment-tickbitten-twice-shy:return-pair'
    ];
    expect(normativeKeywordClauses.every(id => AILMENT_WORDING_CLAUSES.some(row => row.id === id))).toBe(true);

    const hunted = AILMENTS.find(row => row.id === 'ailment-hunted')!;
    const patient: PatientState = {
      id: 'patient', name: 'Rowan', species: 'Vole', status: 'active', conditions: [], treatmentHistory: [], journalEvents: [],
      ailments: [{ id: 'patient:hunted', ailmentId: hunted.id, severity: hunted.severity, timerIds: ['timer'], conditionIds: [],
        treatmentHistoryIds: [], status: 'active', instance: 1, repeatIndex: 0, specialState: {}, successResolved: false,
        failureResolved: false, consequenceResolved: false, effectIds: [] }],
      timers: [{ id: 'timer', ailmentInstanceId: 'patient:hunted', current: 4, maximum: 4, status: 'active' }]
    };
    const result = resolveForaging({ transactionId: 'p10:hunted', state: { season: 'Spring', currentRegion: 'Forest',
      currentLocationType: 'Wilds', adjacentRegions: [], foragingPoints: 3, inventory: [], toolIds: [], patient },
      forageRegion: 'Forest', locationRelation: 'current', card: { value: 7, suit: '♠' } });
    expect(result.value?.ailmentInterruption).toBe('hunted-behemoth');
    expect(result.value?.nextState.patient?.timers[0].current).toBe(3);
    expect(result.value?.candidates).toEqual([]);
    expect(result.value?.foragingPointsGained).toBe(0);
    const expiry = resolveForaging({ transactionId: 'p10:hunted:expiry', state: { season: 'Spring', currentRegion: 'Forest',
      currentLocationType: 'Wilds', adjacentRegions: [], foragingPoints: 3, inventory: [], toolIds: [],
      patient: { ...patient, timers: [{ ...patient.timers[0], current: 1, maximum: 1 }] } },
      forageRegion: 'Forest', locationRelation: 'current', card: { value: 7, suit: '♠' } });
    expect(expiry.value?.nextState.patient?.ailments[0]).toMatchObject({ status: 'failed', failureResolved: true });
  });

  it('[SERVICE-002/WAGON-004/UX-001] restores temporary map state and exposes only executable next actions', () => {
    const flooded = serviceState({ currentLocationId: 'd', currentLocationName: 'Clover Field', currentRegion: 'Loch',
      graph: { ...graph(), d: { ...graph().d, region: 'Loch' } },
      mapMutations: [{ id: 'flood', serviceId: 'floodplain', kind: 'temporary-region', nodeIds: ['d'], previousRegion: 'Meadow', restoredAtSeason: 'Spring', active: true, transactionId: 'flood' }] });
    const restored = restoreSeasonalServiceMutations(flooded, 'Spring');
    expect(restored.graph.d.region).toBe('Meadow');
    expect(restored.currentRegion).toBe('Meadow');
    expect(restored.mapMutations[0].active).toBe(false);
  });
});
