import { describe, expect, it } from 'vitest';

import { CLINIC_AGENDA_BY_ID } from './data/clinics';
import { ENCOUNTERS } from './data/encounters';
import { REAGENT_BY_NAME } from './data/reagents';
import type { PatientState } from './state';
import {
  ENCOUNTER_P1_IDS,
  activateFlockFullOfTrouble,
  clearEncounterP1ConditionsAtJourneyEnd,
  clearEncounterP1ConditionsOnMove,
  completeKnightsQuest,
  consumeCowtownNextPatient,
  consumeGreatSilenceForage,
  consumeSpringmeltTravelIgnore,
  cowtownContextAt,
  isGriphTraderAvailable,
  normalizeEncounterP1Persistence,
  openPasswordDoor,
  recordKnightsQuestAilment,
  redeemSketch,
  redeemTitanCodex,
  resolveCowtownVisit,
  resolveDamselflyTraining,
  resolveFlockGather,
  resolveGreatSilence,
  resolveGrindingOre,
  resolveKnightsQuestArrival,
  resolveLessThanMajestic,
  resolveMushroomPickers,
  resolvePasswordEncounter,
  resolvePasswordForageChoice,
  resolveSketchDiscovery,
  resolveSnapCrackleAfterEncounter,
  resolveSnapCrackleChoice,
  resolveSpringmelt,
  startKnightsQuest,
  type EncounterP1TransactionState
} from './encounterP1Transactions';

const patient = (): PatientState => ({
  id: 'patient-1',
  name: 'Moss',
  species: 'Badger',
  status: 'active',
  ailments: [{
    id: 'ailment-1',
    ailmentId: 'ailment-anxious-scratching',
    severity: 'lesser',
    timerIds: ['timer-1', 'timer-2'],
    conditionIds: [],
    treatmentHistoryIds: [],
    status: 'active',
    instance: 1,
    repeatIndex: 0,
    specialState: {},
    successResolved: false,
    failureResolved: false,
    consequenceResolved: false,
    effectIds: []
  }],
  timers: [
    { id: 'timer-1', ailmentInstanceId: 'ailment-1', current: 6, maximum: 8, status: 'active' },
    { id: 'timer-2', ailmentInstanceId: 'ailment-1', current: 2, maximum: 8, status: 'active' }
  ],
  conditions: [],
  treatmentHistory: [],
  journalEvents: []
});

const state = (overrides: Partial<EncounterP1TransactionState> = {}): EncounterP1TransactionState => ({
  revision: 7,
  currentSeason: 'Spring',
  reputation: 3,
  trinkets: 2,
  foragingPoints: 4,
  inventory: [],
  patient: patient(),
  tools: [],
  companions: [],
  conditions: [],
  knightsQuests: [],
  clinics: [],
  clinicAgendaIds: [],
  appliedTransactionIds: [],
  ...overrides
});

const part = (name = 'Beech') => {
  const reagent = REAGENT_BY_NAME.get(name)!;
  const preparation = reagent.preparations[0];
  return { reagent, preparation, reagentId: reagent.id, preparationId: preparation.id };
};

describe('printed P1 encounter transactions', () => {
  it('uses only current canonical encounter IDs', () => {
    const ids = new Set(ENCOUNTERS.map(encounter => encounter.id));
    expect(Object.entries(ENCOUNTER_P1_IDS).filter(([, id]) => !ids.has(id))).toEqual([]);
    expect(ENCOUNTERS.find(row => row.id === ENCOUNTER_P1_IDS.cowtown)?.title).toContain('Cowtown');
    expect(ENCOUNTERS.find(row => row.id === ENCOUNTER_P1_IDS.greatSilence)?.title).toContain('Great Silence');
    expect(ENCOUNTERS.find(row => row.id === ENCOUNTER_P1_IDS.grindingOre)?.title).toContain('Grinding Ore');
  });

  it('p.78 consumes the exact Sketch for one mutually-exclusive later reward', () => {
    const discovered = resolveSketchDiscovery({
      transactionId: 'sketch:find', encounterId: ENCOUNTER_P1_IDS.sketch,
      expectedRevision: 7, state: state(), choice: 'take-sketch'
    });
    expect(discovered.status).toBe('resolved');
    const sketchId = discovered.value!.outcome.sketchItemId!;
    const carrying = discovered.value!.nextState;
    expect(carrying.inventory).toContainEqual(expect.objectContaining({
      id: sketchId, name: 'Sketch', weight: 1 / 3, encounterP1: expect.objectContaining({ kind: 'sketch' })
    }));

    const local = part();
    const traded = redeemSketch({
      transactionId: 'sketch:trade', encounterId: 'sketch-redemption',
      expectedRevision: carrying.revision, state: carrying, sketchItemId: sketchId,
      redemption: {
        kind: 'craftpaws-local-reagent', atLocationType: 'City', currentRegion: 'Forest',
        reagentId: local.reagentId, preparationId: local.preparationId
      }
    });
    expect(traded.status).toBe('resolved');
    expect(traded.value!.nextState.inventory.some(item => item.id === sketchId)).toBe(false);
    expect(traded.value!.nextState.inventory).toContainEqual(expect.objectContaining({
      canonicalReagentId: local.reagentId, preparationId: local.preparationId
    }));

    const secondReward = redeemSketch({
      transactionId: 'sketch:second-reward', encounterId: 'sketch-redemption',
      expectedRevision: traded.value!.nextState.revision, state: traded.value!.nextState, sketchItemId: sketchId,
      redemption: { kind: 'knowers-trinkets', atJourneyEndDowntime: true }
    });
    expect(secondReward).toMatchObject({ status: 'invalid', code: 'missing-resource' });

    const discoveredAgain = resolveSketchDiscovery({
      transactionId: 'sketch:find-2', encounterId: ENCOUNTER_P1_IDS.sketch,
      expectedRevision: 7, state: state(), choice: 'take-sketch'
    });
    const knowers = redeemSketch({
      transactionId: 'sketch:knowers', encounterId: 'sketch-redemption',
      expectedRevision: 8, state: discoveredAgain.value!.nextState,
      sketchItemId: discoveredAgain.value!.outcome.sketchItemId!,
      redemption: { kind: 'knowers-tool', atJourneyEndDowntime: true, toolId: 'canvas-tent' }
    });
    expect(knowers.value!.nextState.inventory).toContainEqual(expect.objectContaining({ canonicalToolId: 'canvas-tent' }));
    expect(knowers.value!.nextState.tools).toContainEqual(expect.objectContaining({ toolId: 'canvas-tent' }));
  });

  it('p.88 exposes Cowtown context, consumes its next-patient flag once, and expires it on Move', () => {
    const visited = resolveCowtownVisit({
      transactionId: 'cowtown:visit', encounterId: ENCOUNTER_P1_IDS.cowtown,
      expectedRevision: 7, state: state(), choice: 'visit', locationId: 'meadow:12'
    });
    const current = visited.value!.nextState;
    expect(cowtownContextAt(current, 'meadow:12')).toEqual({
      countsAsSettlement: true,
      permitsPreparingToLeaveServices: true,
      permitsBarterDuringAilments: true,
      nextPatientIsBaileBoCitizen: true
    });
    const assigned = consumeCowtownNextPatient({
      transactionId: 'cowtown:patient', encounterId: 'cowtown-next-patient',
      expectedRevision: current.revision, state: current, locationId: 'meadow:12', patientId: 'patient:cowtown'
    });
    expect(cowtownContextAt(assigned.value!.nextState, 'meadow:12').nextPatientIsBaileBoCitizen).toBe(false);
    const duplicate = consumeCowtownNextPatient({
      transactionId: 'cowtown:patient:again', encounterId: 'cowtown-next-patient',
      expectedRevision: assigned.value!.nextState.revision, state: assigned.value!.nextState,
      locationId: 'meadow:12', patientId: 'patient:cowtown:2'
    });
    expect(duplicate).toMatchObject({ status: 'invalid', code: 'ineligible' });
    const moved = clearEncounterP1ConditionsOnMove({
      transactionId: 'move:1', encounterId: 'encounter-p1-move-complete',
      expectedRevision: assigned.value!.nextState.revision, state: assigned.value!.nextState
    });
    expect(cowtownContextAt(moved.value!.nextState, 'meadow:12').countsAsSettlement).toBe(false);
  });

  it('p.91 consumes Springmelt only on the next Mountain 7 or 8', () => {
    const drank = resolveSpringmelt({
      transactionId: 'springmelt:drink', encounterId: ENCOUNTER_P1_IDS.springmelt,
      expectedRevision: 7, state: state(), choice: 'drink-up'
    });
    const conditionId = drank.value!.outcome.conditionId!;
    const wrong = consumeSpringmeltTravelIgnore({
      transactionId: 'springmelt:wrong', encounterId: 'springmelt-travel-ignore',
      expectedRevision: 8, state: drank.value!.nextState, conditionId, region: 'Forest', travelCardValue: 7
    });
    expect(wrong).toMatchObject({ status: 'invalid', code: 'ineligible' });
    expect(drank.value!.nextState.conditions).toHaveLength(1);
    const consumed = consumeSpringmeltTravelIgnore({
      transactionId: 'springmelt:consume', encounterId: 'springmelt-travel-ignore',
      expectedRevision: 8, state: drank.value!.nextState, conditionId, region: 'Mountain', travelCardValue: 8
    });
    expect(consumed.value!.nextState.conditions).toHaveLength(0);
  });

  it('p.91 runs the 24-Path Quest, penalizes the combat draw, and grants exact Journey-end rewards once', () => {
    const begun = startKnightsQuest({
      transactionId: 'knights:start', encounterId: ENCOUNTER_P1_IDS.knightsQuest,
      expectedRevision: 7, state: state(), choice: 'accept-quest', currentJourneyId: 'journey:old',
      directionSuit: '♣', destinationLocationId: 'mountain:barrow', confirmedPathDistance: 24
    });
    let current = begun.value!.nextState;
    const questId = begun.value!.outcome.questId!;
    expect(begun.value!.directives).toContainEqual(expect.objectContaining({
      kind: 'replace-active-journey-with-knights-quest', direction: 'east', distancePaths: 24, urgencyDays: 9
    }));
    for (const [index, outcome] of (['success', 'success', 'failure'] as const).entries()) {
      const recorded = recordKnightsQuestAilment({
        transactionId: `knights:ailment:${index}`, encounterId: 'knights-quest-ailment',
        expectedRevision: current.revision, state: current, questId,
        ailmentId: `quest-ailment:${index}`, outcome
      });
      current = recorded.value!.nextState;
    }
    const arrival = resolveKnightsQuestArrival({
      transactionId: 'knights:arrive', encounterId: 'knights-quest-arrival',
      expectedRevision: current.revision, state: current, questId,
      currentLocationId: 'mountain:barrow', daysElapsed: 9, combatCard: { value: 9, suit: '♥' }
    });
    expect(arrival.value!.outcome).toEqual({ outcome: 'behemoth-slain', finalCardValue: 7 });
    const rewarded = completeKnightsQuest({
      transactionId: 'knights:reward', encounterId: 'knights-quest-complete',
      expectedRevision: arrival.value!.nextState.revision, state: arrival.value!.nextState,
      questId, atJourneyEnd: true, hoardToolId: 'canvas-tent'
    });
    expect(rewarded.value!.outcome).toMatchObject({ reputationGained: 2, trinketsGained: 10 });
    expect(rewarded.value!.nextState).toMatchObject({ reputation: 5, trinkets: 12 });
    const duplicate = completeKnightsQuest({
      transactionId: 'knights:reward:again', encounterId: 'knights-quest-complete',
      expectedRevision: rewarded.value!.nextState.revision, state: rewarded.value!.nextState,
      questId, atJourneyEnd: true, hoardToolId: 'canvas-tent'
    });
    expect(duplicate).toMatchObject({ status: 'invalid', code: 'ineligible' });
  });

  it('p.95 applies the chosen Griph landing and scopes trader refusal to this Journey', () => {
    const helped = resolveLessThanMajestic({
      transactionId: 'griph:help', encounterId: ENCOUNTER_P1_IDS.lessThanMajestic,
      expectedRevision: 7, state: state(), choice: 'swoop-in', journeyId: 'journey:1',
      chosenDestinationLocationId: 'destination', selectedLandingLocationId: 'halfway',
      halfwayCandidateLocationIds: ['halfway']
    });
    expect(helped.value!.nextState.reputation).toBe(4);
    expect(helped.value!.directives).toEqual([{ kind: 'end-soar-at-location', locationId: 'halfway' }]);

    const ignored = resolveLessThanMajestic({
      transactionId: 'griph:ignore', encounterId: ENCOUNTER_P1_IDS.lessThanMajestic,
      expectedRevision: 7, state: state(), choice: 'stay-out', journeyId: 'journey:1',
      chosenDestinationLocationId: 'destination', selectedLandingLocationId: 'destination',
      halfwayCandidateLocationIds: ['halfway']
    });
    expect(isGriphTraderAvailable(ignored.value!.nextState, 'journey:1')).toBe(false);
    expect(isGriphTraderAvailable(ignored.value!.nextState, 'journey:2')).toBe(true);
    const cleared = clearEncounterP1ConditionsAtJourneyEnd({
      transactionId: 'journey:1:end', encounterId: 'encounter-p1-journey-end',
      expectedRevision: ignored.value!.nextState.revision, state: ignored.value!.nextState, journeyId: 'journey:1'
    });
    expect(isGriphTraderAvailable(cleared.value!.nextState, 'journey:1')).toBe(true);
  });

  it('p.160 gives the Junior reward only on hearts and leaves the duplicated printed suit unresolved', () => {
    for (const suit of ['♥', '♦', '♣'] as const) {
      const result = resolveMushroomPickers({
        transactionId: `mushroom:${suit}`, encounterId: ENCOUNTER_P1_IDS.mushroomPickers,
        expectedRevision: 7, state: state(), choice: 'junior', card: { value: 4, suit }
      });
      expect(result.value!.outcome.trinketsGained).toBe(suit === '♥' ? 1 : 0);
    }
    const unspecifiedSpade = resolveMushroomPickers({
      transactionId: 'mushroom:♠', encounterId: ENCOUNTER_P1_IDS.mushroomPickers,
      expectedRevision: 7, state: state(), choice: 'junior', card: { value: 4, suit: '♠' }
    });
    expect(unspecifiedSpade.status).toBe('invalid');
    expect(unspecifiedSpade.code).toBe('ambiguous-printed-rule');
    expect(unspecifiedSpade.value).toBeNull();
    const senior = resolveMushroomPickers({
      transactionId: 'mushroom:senior', encounterId: ENCOUNTER_P1_IDS.mushroomPickers,
      expectedRevision: 7, state: state(), choice: 'senior'
    });
    expect(senior.value!.outcome).toEqual({ trinketsGained: 0, reputationGained: 1 });
  });

  it('p.170 applies Patience once or forces one exact adjacent non-Loch Forage at zero timer cost', () => {
    const patientChoice = resolveGreatSilence({
      transactionId: 'silence:patience', encounterId: ENCOUNTER_P1_IDS.greatSilence,
      expectedRevision: 7, state: state(), choice: 'patience'
    });
    expect(patientChoice.value!.nextState.patient!.timers.map(timer => [timer.current, timer.status]))
      .toEqual([[3, 'active'], [0, 'expired']]);

    const startled = resolveGreatSilence({
      transactionId: 'silence:startle', encounterId: ENCOUNTER_P1_IDS.greatSilence,
      expectedRevision: 7, state: state(), choice: 'startle', sourceLocationId: 'loch:1', targetLocationId: 'forest:1',
      adjacentLocations: [{ locationId: 'forest:1', region: 'Forest' }, { locationId: 'loch:2', region: 'Loch' }]
    });
    expect(startled.value!.nextState.foragingPoints).toBe(0);
    const conditionId = startled.value!.outcome.pendingForageConditionId!;
    const wrong = consumeGreatSilenceForage({
      transactionId: 'silence:wrong', encounterId: 'great-silence-forage',
      expectedRevision: 8, state: startled.value!.nextState, conditionId, forageLocationId: 'loch:2'
    });
    expect(wrong).toMatchObject({ status: 'invalid', code: 'ineligible' });
    const consumed = consumeGreatSilenceForage({
      transactionId: 'silence:consume', encounterId: 'great-silence-forage',
      expectedRevision: 8, state: startled.value!.nextState, conditionId, forageLocationId: 'forest:1'
    });
    expect(consumed.value!.outcome.timerDecrease).toBe(0);
    expect(consumed.value!.nextState.conditions).toHaveLength(0);
  });

  it('p.179 uses strict greater-than comparisons for every gathered Reagent', () => {
    const activated = activateFlockFullOfTrouble({
      transactionId: 'flock:start', encounterId: ENCOUNTER_P1_IDS.flockFullOfTrouble,
      expectedRevision: 7, state: state(), locationId: 'mountain:1'
    });
    const current = activated.value!.nextState;
    const conditionId = activated.value!.outcome.conditionId;
    const selected = part();
    const equalSurvives = resolveFlockGather({
      transactionId: 'flock:equal', encounterId: 'flock-full-of-trouble-gather',
      expectedRevision: current.revision, state: current, conditionId, locationId: 'mountain:1',
      originalForageCard: { value: 8, suit: '♥' }, sheepCard: { value: 8, suit: '♠' }, effectiveReagentRarity: 8,
      reagentId: selected.reagentId, preparationId: selected.preparationId
    });
    expect(equalSurvives.value!.outcome.reagentEaten).toBe(false);
    expect(equalSurvives.value!.outcome.acquiredItemId).not.toBeNull();
    const higherIsEaten = resolveFlockGather({
      transactionId: 'flock:higher', encounterId: 'flock-full-of-trouble-gather',
      expectedRevision: current.revision, state: current, conditionId, locationId: 'mountain:1',
      originalForageCard: { value: 5, suit: '♥' }, sheepCard: { value: 6, suit: '♠' }, effectiveReagentRarity: 10,
      reagentId: selected.reagentId, preparationId: selected.preparationId
    });
    expect(higherIsEaten.value!.outcome).toEqual({ reagentEaten: true, acquiredItemId: null });
  });

  it('p.184 persists the symbol search and enforces an exclusive Codex or immediate Clinic reward', () => {
    const looking = resolvePasswordEncounter({
      transactionId: 'password:look', encounterId: ENCOUNTER_P1_IDS.password,
      expectedRevision: 7, state: state(), choice: 'look-around', locationId: 'titan:1'
    });
    const conditionId = looking.value!.outcome.conditionId!;
    const tooLow = resolvePasswordForageChoice({
      transactionId: 'password:low', encounterId: 'password-forage-choice',
      expectedRevision: 8, state: looking.value!.nextState, conditionId, locationId: 'titan:1',
      forageCard: { value: 10, suit: '♥' }, choice: 'take-symbols'
    });
    expect(tooLow).toMatchObject({ status: 'invalid', code: 'ineligible' });
    const symbols = resolvePasswordForageChoice({
      transactionId: 'password:symbols', encounterId: 'password-forage-choice',
      expectedRevision: 8, state: looking.value!.nextState, conditionId, locationId: 'titan:1',
      forageCard: { value: 11, suit: '♥' }, choice: 'take-symbols'
    });
    const codex = openPasswordDoor({
      transactionId: 'password:codex', encounterId: 'password-open-door',
      expectedRevision: symbols.value!.nextState.revision, state: symbols.value!.nextState,
      conditionId, locationId: 'titan:1', choice: 'titan-codex'
    });
    const codexId = codex.value!.outcome.rewardId;
    expect(codex.value!.nextState.inventory).toContainEqual(expect.objectContaining({ id: codexId, weight: 1 }));
    const redeemed = redeemTitanCodex({
      transactionId: 'password:redeem', encounterId: 'titan-codex-redemption',
      expectedRevision: codex.value!.nextState.revision, state: codex.value!.nextState,
      codexItemId: codexId, atJourneyEnd: true
    });
    expect(redeemed.value!.nextState.trinkets).toBe(22);

    const lookingAgain = resolvePasswordEncounter({
      transactionId: 'password:look:clinic', encounterId: ENCOUNTER_P1_IDS.password,
      expectedRevision: 7, state: state({ reputation: 0 }), choice: 'look-around', locationId: 'titan:2'
    });
    const clinicConditionId = lookingAgain.value!.outcome.conditionId!;
    const clinicSymbols = resolvePasswordForageChoice({
      transactionId: 'password:symbols:clinic', encounterId: 'password-forage-choice',
      expectedRevision: 8, state: lookingAgain.value!.nextState,
      conditionId: clinicConditionId, locationId: 'titan:2', forageCard: { value: 12, suit: '♣' }, choice: 'take-symbols'
    });
    expect(CLINIC_AGENDA_BY_ID.has('pantry')).toBe(true);
    const clinic = openPasswordDoor({
      transactionId: 'password:clinic', encounterId: 'password-open-door',
      expectedRevision: clinicSymbols.value!.nextState.revision, state: clinicSymbols.value!.nextState,
      conditionId: clinicConditionId, locationId: 'titan:2', choice: 'establish-clinic',
      clinicName: 'Glyph Clinic', agendaId: 'pantry'
    });
    expect(clinic.value!.nextState.clinics[0]).toMatchObject({ status: 'active', locationId: 'titan:2' });
    expect(clinic.value!.nextState.clinicAgendaIds).toContain('pantry');
    expect(clinic.value!.directives).toContainEqual(expect.objectContaining({ bypassAgendaRequirements: true }));
  });

  it('p.186 applies Careful or Quick after each Encounter and stops Quick on clubs/spades', () => {
    const careful = resolveSnapCrackleChoice({
      transactionId: 'snap:careful', encounterId: ENCOUNTER_P1_IDS.snapCracklePop,
      expectedRevision: 7, state: state(), locationId: 'titan:1', choice: 'careful'
    });
    const carefulTick = resolveSnapCrackleAfterEncounter({
      transactionId: 'snap:careful:first', encounterId: 'snap-crackle-pop-after-encounter',
      expectedRevision: 8, state: careful.value!.nextState,
      conditionId: careful.value!.outcome.conditionId, locationId: 'titan:1'
    });
    expect(carefulTick.value!.nextState.patient!.timers.map(timer => timer.current)).toEqual([5, 1]);

    const quick = resolveSnapCrackleChoice({
      transactionId: 'snap:quick', encounterId: ENCOUNTER_P1_IDS.snapCracklePop,
      expectedRevision: 7, state: state(), locationId: 'titan:2', choice: 'quick'
    });
    const safe = resolveSnapCrackleAfterEncounter({
      transactionId: 'snap:quick:heart', encounterId: 'snap-crackle-pop-after-encounter',
      expectedRevision: 8, state: quick.value!.nextState,
      conditionId: quick.value!.outcome.conditionId, locationId: 'titan:2', card: { value: 3, suit: '♥' }
    });
    expect(safe.value!.outcome.forcedToLeave).toBe(false);
    const forced = resolveSnapCrackleAfterEncounter({
      transactionId: 'snap:quick:club', encounterId: 'snap-crackle-pop-after-encounter',
      expectedRevision: safe.value!.nextState.revision, state: safe.value!.nextState,
      conditionId: quick.value!.outcome.conditionId, locationId: 'titan:2', card: { value: 3, suit: '♣' }
    });
    expect(forced.value!.outcome.forcedToLeave).toBe(true);
    expect(forced.value!.directives).toEqual([{ kind: 'leave-location-and-end-forage', locationId: 'titan:2' }]);
  });

  it('p.192 adopts one Damselfly using exactly one chosen canonical Companion function', () => {
    const adopted = resolveDamselflyTraining({
      transactionId: 'damselfly:adopt', encounterId: ENCOUNTER_P1_IDS.damselflyTraining,
      expectedRevision: 7, state: state(), choice: 'adopt', function: 'butterfly', companionCapacity: 1
    });
    expect(adopted.value!.nextState.companions).toEqual([expect.objectContaining({
      companionId: 'butterfly', rulesAsCompanionId: 'butterfly', displayNameOverride: 'Damselfly'
    })]);
    const overCapacity = resolveDamselflyTraining({
      transactionId: 'damselfly:another', encounterId: ENCOUNTER_P1_IDS.damselflyTraining,
      expectedRevision: adopted.value!.nextState.revision, state: adopted.value!.nextState,
      choice: 'adopt', function: 'cricket', companionCapacity: 1
    });
    expect(overCapacity).toMatchObject({ status: 'invalid', code: 'ineligible' });
  });

  it('p.210 maps source Iron (Pellets) to the canonical Iron Ore / Iron Pebbles Part', () => {
    const gained = resolveGrindingOre({
      transactionId: 'iron:teach', encounterId: ENCOUNTER_P1_IDS.grindingOre,
      expectedRevision: 7, state: state(), choice: 'teach-fact'
    });
    const iron = REAGENT_BY_NAME.get('Iron Ore')!;
    const pellets = iron.preparations.find(preparation => preparation.name === 'Iron Pebbles')!;
    expect(gained.value!.nextState.inventory).toContainEqual(expect.objectContaining({
      canonicalReagentId: iron.id,
      preparationId: pellets.id,
      encounterP1: expect.objectContaining({ kind: 'iron-pellets', sourcePage: 210 })
    }));
  });

  it('rejects stale state and replayed transaction IDs before any mutation', () => {
    const stale = resolveSketchDiscovery({
      transactionId: 'guard:stale', encounterId: ENCOUNTER_P1_IDS.sketch,
      expectedRevision: 6, state: state(), choice: 'take-sketch'
    });
    expect(stale).toMatchObject({ status: 'invalid', code: 'stale-state' });
    const replay = resolveSketchDiscovery({
      transactionId: 'guard:replay', encounterId: ENCOUNTER_P1_IDS.sketch,
      expectedRevision: 7, state: state({ appliedTransactionIds: ['guard:replay'] }), choice: 'take-sketch'
    });
    expect(replay).toMatchObject({ status: 'invalid', code: 'already-applied' });
  });

  it('normalizes the persisted P1 block safely and idempotently without inventing malformed records', () => {
    const raw = {
      revision: 4,
      conditions: [
        {
          id: 'condition:cowtown', sourceTransactionId: 'cowtown:visit', kind: 'cowtown',
          sourcePage: 88, locationId: 'meadow:1', nextPatientPending: true,
          ignoredLegacyField: 'preserve neither prose nor guesses'
        },
        { id: 'condition:broken', sourceTransactionId: 'broken', kind: 'password', sourcePage: 184 },
        null
      ],
      knightsQuests: [{
        id: 'quest:1', sourceTransactionId: 'knights:start', sourcePage: 91,
        abandonedJourneyId: 'journey:old', season: 'Spring', direction: 'north',
        destinationLocationId: 'mountain:barrow', distancePaths: 24, urgencyDays: 9,
        successfulAilmentIds: ['a', 'a'], failedAilmentIds: ['b'], status: 'active',
        arrivalDaysElapsed: null, combatCardValue: null, combatFinalValue: null
      }, { id: 'quest:broken', sourcePage: 91 }],
      appliedTransactionIds: ['tx:1', 'tx:1', '', 42]
    };
    const normalized = normalizeEncounterP1Persistence(raw);
    expect(normalized).toEqual({
      revision: 4,
      conditions: [{
        id: 'condition:cowtown', sourceTransactionId: 'cowtown:visit', kind: 'cowtown',
        sourcePage: 88, locationId: 'meadow:1', nextPatientPending: true
      }],
      knightsQuests: [{
        id: 'quest:1', sourceTransactionId: 'knights:start', sourcePage: 91,
        abandonedJourneyId: 'journey:old', season: 'Spring', direction: 'north',
        destinationLocationId: 'mountain:barrow', distancePaths: 24, urgencyDays: 9,
        successfulAilmentIds: ['a'], failedAilmentIds: ['b'], status: 'active',
        arrivalDaysElapsed: null, combatCardValue: null, combatFinalValue: null
      }],
      appliedTransactionIds: ['tx:1']
    });
    expect(normalizeEncounterP1Persistence(normalized)).toEqual(normalized);
    expect(normalizeEncounterP1Persistence(null)).toEqual({
      revision: 0, conditions: [], knightsQuests: [], appliedTransactionIds: []
    });
  });
});
