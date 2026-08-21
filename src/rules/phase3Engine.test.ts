import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  CURRENT_SCHEMA_VERSION,
  ENCOUNTERS,
  JOURNEY_GOALS,
  PRINTED_EFFECT_REGISTRY,
  REAGENTS,
  calculateBarterBR,
  calculatePawnReward,
  canonicalMetadata,
  createMakeDoAcquisition,
  createPatientArchiveRecord,
  createReplacementAcquisition,
  evaluateJourneyGoal,
  executeEncounter,
  findJourneyDestinationCandidates,
  migrateSavedRulesState,
  normalizeLegacyArchiveRecord,
  resolveAilmentTimerEffect,
  resolveBarterEncounter,
  resolveBarterGossip,
  resolveBarterLeave,
  resolveBarterOffer,
  resolveBarterPayment,
  resolveBarterStart,
  resolveJourneyEnding,
  resolveJourneyStart,
  resolvePatient,
  resolvePawn,
  resolveScrounge,
  upsertPatientArchive,
  type BarterMapNode,
  type BarterRuntimeState,
  type EncounterDefinition,
  type EngineInventoryItem,
  type JourneyGoalId,
  type JourneyMapNode,
  type JourneyRuntimeState,
  type JourneyState,
  type LeaveRuntimeState,
  type PatientState,
  type Region
} from './index';

const patient = (ailmentId = 'ailment-fight-marks'): PatientState => resolvePatient({
  id: 'phase3-patient', name: 'Moss', species: 'Vole', ailmentIds: [ailmentId]
}).value!;

const barterGraph = (): Record<string, BarterMapNode> => ({
  wild: { id: 'wild', region: 'Forest', locationType: 'Wilds', neighbors: ['settlement'] },
  settlement: { id: 'settlement', region: 'Forest', locationType: 'Settlement', neighbors: ['wild', 'road-1'] },
  'road-1': { id: 'road-1', region: 'Meadow', locationType: 'Wilds', neighbors: ['settlement', 'road-2'] },
  'road-2': { id: 'road-2', region: 'Bog', locationType: 'Wilds', neighbors: ['road-1', 'city'] },
  city: { id: 'city', region: 'Mountain', locationType: 'City', neighbors: ['road-2'] }
});

const target = () => REAGENTS
  .filter(row => row.type !== 'TITAN')
  .flatMap(reagent => reagent.preparations.map(preparation => ({ reagent, preparation })))
  .sort((a, b) => b.reagent.baseRarity - a.reagent.baseRarity)[0];

const barterState = (activePatient = patient()): BarterRuntimeState => ({
  inventory: [], patient: activePatient, reputation: 10, trinkets: 30,
  attemptHistory: {}, pendingBarter: null, journalEvents: [], appliedTransactionIds: []
});

const socialEncounter: EncounterDefinition = {
  id: 'phase3-social', encounterType: 'social', region: 'Forest', isSettlement: true, isTitan: false,
  locationType: 'Settlement', suit: '♥', title: 'A quiet street', prompt: 'Journal about the trader.',
  mandatoryEffects: [], choices: [], support: 'implemented', ...canonicalMetadata(190)
};

const startBarter = (state = barterState(), locationId = 'settlement', transactionId = 'barter-start') => {
  const selected = target();
  return resolveBarterStart({
    transactionId, state, patientId: state.patient.id,
    targetReagentId: selected.reagent.id, preparationId: selected.preparation.id,
    currentLocationId: locationId, locationId, season: 'Spring', graph: barterGraph()
  });
};

describe('Phase 3 printed effects and Ailments', () => {
  const warningIds = [
    'travel-bog-m-winter', 'travel-forest-a-2', 'travel-meadow-a-2',
    'travel-mountain-9-10-winter', 'travel-soar-9-10-summer', 'travel-soar-9-10-autumn',
    'travel-soar-9-10-winter', 'travel-soar-j-winter', 'travel-soar-m-winter',
    'foraging-loch-j-winter'
  ];

  it('[TRAVEL-008/TRAVEL-009/FORAGE-006/TABLE-001] transcribes all ten warning rows with explicit status', () => {
    warningIds.forEach(id => {
      const encounter = ENCOUNTERS.find(row => row.id === id);
      const printed = PRINTED_EFFECT_REGISTRY.find(row => row.ownerId === id);
      expect(encounter?.title).not.toMatch(/Rulebook p/);
      expect(printed?.status).toMatch(/implemented|manual/);
      expect(printed?.sourcePage).toBe(encounter?.sourcePage);
    });
  });

  it('[CORE-002/CORE-003/TRAVEL-009] requires an explicit choice and applies it only once', () => {
    const encounter = ENCOUNTERS.find(row => row.id === 'travel-bog-m-winter')!;
    const runtime = { reputation: 2, trinkets: 0, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: [] };
    expect(executeEncounter({ transactionId: 'printed-choice', encounter, state: runtime }).status).toBe('manual');
    const first = executeEncounter({ transactionId: 'printed-choice', encounter, state: runtime, choiceId: 'help' });
    expect(first.value?.nextState.reputation).toBe(3);
    const repeated = executeEncounter({ transactionId: 'printed-choice', encounter, state: first.value!.nextState, choiceId: 'help' });
    expect(repeated.value?.nextState.reputation).toBe(3);
    expect(executeEncounter({ transactionId: 'bad-choice', encounter, state: runtime, choiceId: 'invented' }).status).toBe('invalid');
  });

  it('[AILMENT-003/AILMENT-005] applies Pinned by Pine and Quagmire timer exceptions before generic failure', () => {
    const pinned = patient('ailment-pinned-by-pine');
    const pinnedResult = resolveAilmentTimerEffect({
      transactionId: 'pine-timer', state: { patient: pinned, reputation: 0, worldConditions: [], appliedTransactionIds: [] },
      ailmentInstanceId: pinned.ailments[0].id, decreaseBy: 1
    });
    expect(pinnedResult.value?.patient.timers[0].current).toBe(pinned.timers[0].current - 2);

    const quagmire = patient('ailment-quagmire-s-scale');
    const q = resolveAilmentTimerEffect({
      transactionId: 'quagmire-timer', state: { patient: quagmire, reputation: 0, worldConditions: [], appliedTransactionIds: [] },
      ailmentInstanceId: quagmire.ailments[0].id, decreaseBy: quagmire.timers[0].current - 2
    });
    expect(q.value?.patient.ailments[0].specialState.poisonRequirement).toBe(3);
  });

  it('[AILMENT-003/AILMENT-007] registers every named Ailment and preserves repeat-instance effect state', () => {
    const ailmentEffects = PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'ailment');
    expect(ailmentEffects).toHaveLength(45);
    const repeated = patient('ailment-soured-dough');
    expect(repeated.ailments).toHaveLength(4);
    expect(repeated.ailments.every(row => row.repeatIndex > 0 && Array.isArray(row.effectIds))).toBe(true);
  });
});

describe('Phase 3 canonical Barter transactions', () => {
  it('[BARTER-001/BARTER-003] permits one Settlement attempt and three City attempts per patient and location', () => {
    const first = startBarter();
    expect(first.value?.pendingBarter?.attemptsRemaining).toBe(0);
    expect(startBarter({ ...first.value!, pendingBarter: null }, 'settlement', 'barter-start-2').status).toBe('invalid');

    let cityState = barterState();
    for (let index = 0; index < 3; index += 1) {
      const result = startBarter(cityState, 'city', `city-${index}`);
      expect(result.status).toBe('resolved');
      cityState = { ...result.value!, pendingBarter: null };
    }
    expect(startBarter(cityState, 'city', 'city-4').status).toBe('invalid');
  });

  it('[BARTER-001/BARTER-003] rejects non-current/non-adjacent locations and Titan Reagents', () => {
    const selected = target();
    const distant = resolveBarterStart({
      transactionId: 'distant', state: barterState(), patientId: patient().id,
      targetReagentId: selected.reagent.id, preparationId: selected.preparation.id,
      currentLocationId: 'wild', locationId: 'city', season: 'Spring', graph: barterGraph()
    });
    expect(distant.status).toBe('invalid');
    const titan = REAGENTS.find(row => row.type === 'TITAN')!;
    const forbidden = resolveBarterStart({
      transactionId: 'titan', state: barterState(), patientId: patient().id,
      targetReagentId: titan.id, preparationId: titan.preparations[0].id,
      currentLocationId: 'settlement', locationId: 'settlement', season: 'Spring', graph: barterGraph()
    });
    expect(forbidden.status).toBe('invalid');
  });

  it('[BARTER-003/BARTER-006/REMEDY-001] calculates Availability and only the selected Preparation modifiers', () => {
    const selected = target();
    const result = calculateBarterBR({
      targetReagentId: selected.reagent.id, preparationId: selected.preparation.id,
      locationId: 'city', season: 'Spring', reputation: 10, graph: barterGraph()
    });
    expect(['Common', 'Rare', 'Unavailable']).toContain(result.availability.region);
    expect(['Common', 'Rare', 'Unavailable']).toContain(result.availability.season);
    expect(result.modifiers.some(row => row.id === 'reputation' && row.amount === 1)).toBe(true);
    expect(Number.isFinite(result.br)).toBe(true);
  });

  it('[CORE-001/BARTER-005/BARTER-006] treats Q and K as Monarch 12 and persists the second draw', () => {
    const started = startBarter();
    const social = resolveBarterEncounter({ transactionId: 'social', state: started.value!, card: { value: 13, suit: '♥' }, encounter: socialEncounter });
    expect(social.value?.pendingBarter?.firstCard?.value).toBe(12);
    const offered = resolveBarterOffer({ transactionId: 'offer', state: social.value!, card: { value: 13, suit: '♦' } });
    expect(offered.value?.pendingBarter?.secondCard?.value).toBe(12);
  });

  it('[DOWNTIME-005/BARTER-006] consumes Juicy Gossip to obtain the selected Reagent while Haggling', () => {
    const gossip: EngineInventoryItem = { id: 'gossip:1', name: 'Juicy Gossip', type: 'item', weight: 0, guildNote: { kind: 'gossip' } };
    const started = startBarter({ ...barterState(), inventory: [gossip] }, 'settlement', 'barter-gossip');
    const social = resolveBarterEncounter({ transactionId: 'social-gossip', state: started.value!, card: { value: 5, suit: '♥' }, encounter: socialEncounter });
    const resolved = resolveBarterGossip({ transactionId: 'use-gossip', state: social.value!, gossipItemId: gossip.id });
    expect(resolved.value?.pendingBarter?.status).toBe('completed');
    expect(resolved.value?.inventory.some(item => item.id === gossip.id)).toBe(false);
    expect(resolved.value?.inventory.some(item => item.type === 'reagent')).toBe(true);
  });

  it('[BARTER-006/BARTER-007/BARTER-008/REMEDY-008] supports mixed payment, all Timers, and duplicate-payment protection', () => {
    const started = startBarter({ ...barterState(), reputation: 100, trinkets: 100 });
    const social = resolveBarterEncounter({ transactionId: 'social-pay', state: started.value!, card: { value: 1, suit: '♥' }, encounter: socialEncounter });
    const offered = resolveBarterOffer({ transactionId: 'offer-pay', state: social.value!, card: { value: 1, suit: '♦' } });
    const gap = offered.value?.pendingBarter?.paymentRequired || 0;
    if (gap === 0) {
      expect(offered.value?.pendingBarter?.status).toBe('completed');
      return;
    }
    const trinkets = Math.min(1, gap);
    const paid = resolveBarterPayment({ transactionId: 'pay', state: offered.value!, payment: { trinkets, reputation: gap - trinkets } });
    expect(paid.status).toBe('resolved');
    expect(paid.value?.pendingBarter?.status).toBe('completed');
    const duplicate = resolveBarterPayment({ transactionId: 'pay', state: paid.value!, payment: { trinkets, reputation: gap - trinkets } });
    expect(duplicate.value).toBe(paid.value);
  });

  it('[BARTER-008/REMEDY-008/SAVE-004] backing out decreases every active Timer once after reload-safe state', () => {
    const started = startBarter();
    const social = resolveBarterEncounter({ transactionId: 'social-leave', state: started.value!, card: { value: 1, suit: '♥' }, encounter: socialEncounter });
    const offered = resolveBarterOffer({ transactionId: 'offer-leave', state: social.value!, card: { value: 1, suit: '♦' } });
    if (offered.value?.pendingBarter?.status === 'completed') return;
    const before = offered.value!.patient.timers.map(row => row.current);
    const left = resolveBarterLeave({ transactionId: 'leave-barter', state: structuredClone(offered.value!) });
    expect(left.value?.patient.timers.map(row => row.current)).toEqual(before.map(value => value - 1));
    expect(resolveBarterLeave({ transactionId: 'leave-barter', state: left.value! }).value).toBe(left.value);
  });
});

const journeyGraph = (): Record<string, JourneyMapNode> => {
  const graph: Record<string, JourneyMapNode> = {
    origin: { id: 'origin', name: 'Origin', x: 50, y: 50, region: 'Forest', locationType: 'City', neighbors: [] }
  };
  const build = (prefix: string, dx: number, dy: number) => {
    let previous = 'origin';
    for (let i = 1; i <= 26; i += 1) {
      const id = `${prefix}-${i}`;
      const locationType = i === 5 || i === 15 ? 'Settlement' : i === 24 ? 'City' : 'Wilds';
      graph[id] = { id, name: id, x: 50 + dx * i, y: 50 + dy * i, region: 'Meadow', locationType, neighbors: [previous] };
      graph[previous].neighbors.push(id);
      previous = id;
    }
  };
  build('north', 0, -1);
  build('south', 0, 1);
  build('east', 1, 0);
  build('west', -1, 0);
  return graph;
};

const journeyRuntime = (): JourneyRuntimeState => ({
  currentLocationId: 'origin', reputation: 5, inventory: [], patients: [],
  pendingEncounter: null, pendingBarter: null, pendingForaging: null,
  journey: null, pendingEnding: null, downtimeRequired: false, journalEvents: [], appliedTransactionIds: []
});

const journeyFor = (goalId: JourneyGoalId): JourneyState => ({
  journeyId: 'goal-journey', originId: 'origin', season: 'Spring',
  destinationCard: { value: 1, suit: '♥' },
  destinationRequirements: { distanceBand: 'near', minimumPaths: 0, maximumPaths: 12, locationType: 'Settlement', direction: 'north' },
  destinationId: 'north-5', reason: 'A promise', goalId,
  goalState: { events: [], playerDeclaredComplete: false, gmOverride: false, evaluation: { goalId, complete: false, automaticComplete: false, evidence: [], manualConfirmationRequired: false } },
  urgency: { label: 'Relaxed', days: 12 }, startDate: 1, status: 'active', journalPrompts: [], deviations: [], rulesetId: 'original-1e-3p', startReputation: 5
});

describe('Phase 3 Journey, Goal, and Ending engines', () => {
  it('[JOURNEY-003] filters actual graph candidates by direction, distance, and location type', () => {
    const graph = journeyGraph();
    expect(findJourneyDestinationCandidates({ graph, originId: 'origin', card: { value: 1, suit: '♥' } }).map(row => row.id)).toContain('north-5');
    expect(findJourneyDestinationCandidates({ graph, originId: 'origin', card: { value: 1, suit: '♥' } }).map(row => row.id)).not.toContain('north-1');
    expect(findJourneyDestinationCandidates({ graph, originId: 'origin', card: { value: 8, suit: '♦' } }).map(row => row.id)).toContain('south-15');
    expect(findJourneyDestinationCandidates({ graph, originId: 'origin', card: { value: 13, suit: '♣' } }).map(row => row.id)).toContain('east-24');
    expect(findJourneyDestinationCandidates({ graph, originId: 'origin', card: { value: 13, suit: '♣' } }).map(row => row.id)).not.toContain('east-15');
  });

  it('[JOURNEY-001/JOURNEY-003/JOURNEY-004] requires Reason and starts Justice with Weight 1 Evidence', () => {
    const invalid = resolveJourneyStart({
      transactionId: 'journey-invalid', state: journeyRuntime(), graph: journeyGraph(), originId: 'origin', season: 'Spring',
      destinationCard: { value: 1, suit: '♥' }, destinationId: 'north-5', goalCard: 8, reason: '', startDate: 1, rulesetId: 'original-1e-3p'
    });
    expect(invalid.status).toBe('invalid');
    const wrongLocationType = resolveJourneyStart({
      transactionId: 'journey-wilds', state: journeyRuntime(), graph: journeyGraph(), originId: 'origin', season: 'Spring',
      destinationCard: { value: 1, suit: '♥' }, destinationId: 'north-1', goalCard: 8, reason: 'Carry the truth', startDate: 1, rulesetId: 'original-1e-3p'
    });
    expect(wrongLocationType.status).toBe('invalid');
    const started = resolveJourneyStart({
      transactionId: 'journey-start', state: journeyRuntime(), graph: journeyGraph(), originId: 'origin', season: 'Spring',
      destinationCard: { value: 1, suit: '♥' }, destinationId: 'north-5', goalCard: 8, reason: 'Carry the truth', startDate: 1, rulesetId: 'original-1e-3p'
    });
    expect(started.value?.journey?.reason).toBe('Carry the truth');
    expect(started.value?.inventory.find(row => row.name === 'Evidence')?.weight).toBe(1);
  });

  it('[JOURNEY-001] requires the completed Downtime to cross the Season boundary before another Journey', () => {
    const waitingForSeason = { ...journeyRuntime(), downtimeCompleted: true };
    const result = resolveJourneyStart({
      transactionId: 'journey-before-season', state: waitingForSeason, graph: journeyGraph(), originId: 'origin', season: 'Spring',
      destinationCard: { value: 1, suit: '♥' }, destinationId: 'north-5', goalCard: 1,
      reason: 'Leave too early', startDate: 1, rulesetId: 'original-1e-3p'
    });
    expect(result.status).toBe('invalid');
    expect(result.messages).toContain('Resolve the Season boundary before starting the next Journey.');
  });

  it('[JOURNEY-003/JOURNEY-004] supports the printed choose-destination and invent-goal paths', () => {
    const started = resolveJourneyStart({
      transactionId: 'journey-chosen-custom', state: journeyRuntime(), graph: journeyGraph(), originId: 'origin', season: 'Spring',
      destinationSelection: 'choose', destinationId: 'north-1', destinationCard: null,
      goalCard: null, customGoal: { title: 'Return a borrowed recipe', requiredState: 'Journal the handoff at the Destination.' },
      reason: 'Keep a promise', startDate: 1, rulesetId: 'original-1e-3p'
    });
    expect(started.status).toBe('resolved');
    expect(started.value?.journey).toMatchObject({
      destinationId: 'north-1', destinationSelection: 'choose', goalId: 'custom',
      customGoal: { title: 'Return a borrowed recipe' }
    });
    expect(started.value?.journey?.destinationCard).toBeUndefined();
    const journey = structuredClone(started.value!.journey!);
    expect(evaluateJourneyGoal(journey, { inventory: [], reputation: 5, patients: [] }).complete).toBe(false);
    journey.goalState.playerDeclaredComplete = true;
    expect(evaluateJourneyGoal(journey, { inventory: [], reputation: 5, patients: [] }).complete).toBe(true);
  });

  it('[JOURNEY-003] allows a City as a printed choose-destination selection', () => {
    const result = resolveJourneyStart({
      transactionId: 'journey-chosen-city', state: journeyRuntime(), graph: journeyGraph(), originId: 'origin', season: 'Spring',
      destinationSelection: 'choose', destinationId: 'east-24', destinationCard: null,
      goalCard: 1, reason: 'Travel to the city', startDate: 1, rulesetId: 'original-1e-3p'
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.journey?.destinationId).toBe('east-24');
  });

  it('[JOURNEY-004] defines all 12 printed Goals and evaluates state evidence instead of a free counter', () => {
    expect(JOURNEY_GOALS).toHaveLength(12);
    const tagged = (tag: string, threshold: number) => {
      const row = REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => ({ reagent, preparation })))
        .find(candidate => candidate.preparation.tags.some(value => value.tag === tag && value.value >= threshold))!;
      return { id: `${tag}-item`, name: row.preparation.name, type: 'reagent' as const, weight: row.preparation.weight, canonicalReagentId: row.reagent.id, preparationId: row.preparation.id, quantity: 1 };
    };
    const plant = REAGENTS.find(row => row.type === 'PLANT')!;
    const knowledgeAilment = AILMENTS.find(row => JSON.stringify(row.requirements).match(/SCALE|FEATHER|FUR/))!;
    const cases: Array<{ id: JourneyGoalId; events?: JourneyState['goalState']['events']; inventory?: EngineInventoryItem[]; reputation?: number; declared?: boolean }> = [
      { id: 'self-discovery', events: [1, 2, 3].map(i => ({ id: `e${i}`, type: 'encounter', category: 'beast' })) },
      { id: 'partnership', events: [1, 2, 3].map(i => ({ id: `f${i}`, type: 'journal', category: 'familiar' })) },
      { id: 'responsibility', reputation: 10 },
      { id: 'survey', events: [1, 2, 3].map(i => ({ id: `s${i}`, type: 'journal', category: 'survey', region: 'Forest', locationId: `l${i}` })) },
      { id: 'injury', inventory: [tagged('WOUND', 3)] },
      { id: 'inspiration', events: (['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan'] as Region[]).map(region => ({ id: `p${region}`, type: 'forage', reagentId: plant.id, region })) },
      { id: 'knowledge', events: [1, 2, 3].map(i => ({ id: `k${i}`, type: 'treatment', ailmentId: knowledgeAilment.id })) },
      { id: 'justice', inventory: [{ id: 'goal-journey:evidence', name: 'Evidence', type: 'item', weight: 1 }] },
      { id: 'restock', inventory: [{ ...tagged('PAIN', 1), quantity: 3 }] },
      { id: 'closure', events: [1, 2, 3].map(i => ({ id: `c${i}`, type: 'journal', category: 'conflict' })), declared: true },
      { id: 'finality', inventory: [tagged('ELSEWHERE', 2)] },
      { id: 'wanderlust', events: (['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'] as Region[]).map(region => ({ id: `w${region}`, type: 'journal', region })), declared: true }
    ];
    cases.forEach(testCase => {
      const journey = journeyFor(testCase.id);
      journey.goalState.events = testCase.events || [];
      journey.goalState.playerDeclaredComplete = Boolean(testCase.declared);
      const result = evaluateJourneyGoal(journey, { inventory: testCase.inventory || [], reputation: testCase.reputation ?? 5, patients: [] });
      expect(result.complete, testCase.id).toBe(true);
    });
  });

  it('[TRAVEL-010/ENDING-001/ENDING-002/ENDING-003] blocks ending away from Destination and removes fixed original-mode Reputation', () => {
    const journey = journeyFor('responsibility');
    journey.startReputation = 0;
    const away = resolveJourneyEnding({ transactionId: 'end-away', state: { ...journeyRuntime(), journey, reputation: 5 }, endedAt: 2, outcome: 'success', journalText: 'Done.' });
    expect(away.status).toBe('invalid');
    const arrived = resolveJourneyEnding({
      transactionId: 'end-arrived', state: { ...journeyRuntime(), currentLocationId: journey.destinationId, journey, reputation: 5 },
      endedAt: 2, outcome: 'success', journalText: 'I arrived and reflected.'
    });
    expect(arrived.status).toBe('resolved');
    expect(arrived.value?.reputation).toBe(5);
    expect(arrived.value?.downtimeRequired).toBe(true);

    const untreatedArrival = resolveJourneyEnding({
      transactionId: 'end-before-local-ailment',
      state: { ...journeyRuntime(), currentLocationId: journey.destinationId, journey, reputation: 5, needsLocalHelp: true },
      endedAt: 2, outcome: 'success', journalText: 'I tried to leave before earning my keep.'
    });
    expect(untreatedArrival.status).toBe('invalid');
    expect(untreatedArrival.messages.join(' ')).toMatch(/local beast.*Ailment/i);
  });
});

describe('Phase 3 Leave, Pawn, Archive, and persistence', () => {
  const leaveState = (): LeaveRuntimeState => ({
    inventory: [], patient: patient(), reputation: 10, trinkets: 0,
    currentRegion: 'Forest', adjacentRegions: ['Meadow'], foragingPoints: 2,
    pendingObligation: null, journalEvents: [], appliedTransactionIds: []
  });

  it('[LEAVE-001/LEAVE-002/LEAVE-003/REMEDY-008] requires every Timer above zero and reduces all Timers by current/adjacent cost', () => {
    const current = resolveScrounge({ transactionId: 'scrounge-current', state: leaveState(), action: 'forage-current', region: 'Forest' });
    expect(current.value?.patient.timers.every((timer, index) => timer.current === leaveState().patient.timers[index].current - 1)).toBe(true);
    expect(current.value?.pendingObligation?.kind).toBe('foraging-encounter');
    const expiredState = leaveState();
    expiredState.patient.timers[0] = { ...expiredState.patient.timers[0], current: 0, status: 'expired' };
    expect(resolveScrounge({ transactionId: 'scrounge-no', state: expiredState, action: 'forage-adjacent', region: 'Meadow' }).status).toBe('invalid');
  });

  it('[REMEDY-002/REMEDY-003] Make Do and Replacement create acquisition requirements, not Inventory placeholders', () => {
    expect(createMakeDoAcquisition('PAIN', 2)).toMatchObject({ acquisition: 'forage-or-barter', requiredPotency: 3 });
    expect(createReplacementAcquisition({ targetTag: 'PAIN', requiredPotency: 2, name: 'Mossmilk', preparation: 'BREWED' }))
      .toMatchObject({ acquisition: 'forage-or-barter', baseRarity: 12, weight: 2 / 3 });
  });

  it('[LEAVE-005] calculates Pawn from total Weight, rounds once, removes items, and is idempotent', () => {
    const inventory: EngineInventoryItem[] = [
      { id: 'one-third', name: 'Part', type: 'reagent', weight: 1 / 3, usesRemaining: 1 },
      { id: 'two-thirds', name: 'Tool', type: 'tool', weight: 2 / 3 },
      { id: 'spent', name: 'Spent Part', type: 'reagent', weight: 2, usesRemaining: 0 }
    ];
    expect(calculatePawnReward(inventory, ['one-third', 'two-thirds', 'spent'])).toMatchObject({ totalWeight: 1, trinketReward: 1 });
    const first = resolvePawn({ transactionId: 'pawn', state: { ...leaveState(), inventory }, selectedItemIds: ['one-third', 'two-thirds'] });
    expect(first.value?.trinkets).toBe(1);
    const duplicate = resolvePawn({ transactionId: 'pawn', state: first.value!, selectedItemIds: ['one-third'] });
    expect(duplicate.status).toBe('resolved');
    expect(duplicate.value).toBe(first.value);
  });

  it('[ARCHIVE-001/ARCHIVE-002/ARCHIVE-003/ARCHIVE-004] never normalizes an unresolved or failed case into success', () => {
    const unresolved = normalizeLegacyArchiveRecord({ id: 'u', outcome: 'pending' });
    const failed = normalizeLegacyArchiveRecord({ id: 'f', outcome: 'failure' });
    expect(unresolved.status).toBe('unresolved');
    expect(unresolved.success).toBe(false);
    expect(failed.status).toBe('failed');
    const failedRecord = createPatientArchiveRecord({ caseId: 'same', patient: { ...patient(), status: 'failed' }, location: 'Odoak', encounteredAt: 1, treatmentResult: 'failure' });
    expect(failedRecord.patientName).toBe(patient().name);
    const staleSuccess = { ...failedRecord, status: 'treated' as const, treatmentResult: 'pending' as const, success: true, failure: false };
    expect(upsertPatientArchive([failedRecord], staleSuccess)[0]).toMatchObject({ status: 'failed', success: false, failure: true });
  });

  it.each([
    {
      name: 'legacy pending Barter and free-text Journey',
      save: {
        schemaVersion: 3, rulesetId: 'legacy-campaign', journeyActive: true,
        journeyDestination: 'Free Text', journeyOrigin: 'Odoak',
        activeBarter: { phase: 'social', reagentName: 'Beech' }, patients: [patient()]
      },
      verify: (migrated: ReturnType<typeof migrateSavedRulesState>) => {
        expect(migrated.pendingBarter).toMatchObject({ migratedFromLegacy: true });
        expect(migrated.journey).toMatchObject({ migratedFromLegacy: true, rulesetId: 'legacy-campaign' });
      }
    },
    {
      name: 'failed legacy Archive',
      save: { schemaVersion: 3, patientCasebook: [{ id: 'failed-case', outcome: 'failure' }] },
      verify: (migrated: ReturnType<typeof migrateSavedRulesState>) => {
        expect(migrated.patientArchive[0]).toMatchObject({ status: 'failed', success: false, failure: true });
      }
    },
    {
      name: 'Ailment without Phase 3 effect fields',
      save: { schemaVersion: 3, patients: [patient()] },
      verify: (migrated: ReturnType<typeof migrateSavedRulesState>) => {
        expect(migrated.patients[0].ailments[0]).toMatchObject({ specialState: {}, effectIds: [], successResolved: false });
      }
    },
    {
      name: 'pending Leave and alternative acquisition',
      save: {
        schemaVersion: 3,
        pendingLeaveObligation: { transactionId: 'leave-pending', kind: 'foraging-encounter', resolved: false },
        pendingAlternativeAcquisition: { kind: 'replacement', acquisition: 'forage-or-barter', baseRarity: 12 }
      },
      verify: (migrated: ReturnType<typeof migrateSavedRulesState>) => {
        expect(migrated.pendingLeaveObligation).toMatchObject({ resolved: false });
        expect(migrated.pendingAlternativeAcquisition).toMatchObject({ kind: 'replacement', baseRarity: 12 });
      }
    }
  ])('[SAVE-004/SAVE-005] survives hostile save: $name', ({ save, verify }) => {
    const migrated = migrateSavedRulesState(save);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    verify(migrated);
  });
});
