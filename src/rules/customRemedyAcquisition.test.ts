import { describe, expect, it } from 'vitest';
import {
  ENCOUNTERS, ENCOUNTER_REMEDY_BY_ID, REAGENTS, FORAGING_ENCOUNTER_IDS,
  applyBearDeference, canTreatAilmentWithInventory, createReplacementAcquisition,
  customReagentCatalogueProjection, rememberCustomReagents,
  migrateSavedRulesState, preparationForInventory, previewTreatmentSelection, resolveBarterEncounter,
  resolveBarterOffer, resolveBarterPayment, resolveBarterStart, resolveEncounter,
  resolveForaging, resolveOdoakMarket, resolveTimer, resolveTreatment,
  startFixedEncounterRemedy, type BarterRuntimeState, type EngineInventoryItem,
  type ForagingEngineState, type ForagingEncounterTransactionState
} from './index';
import { encounterRemedySuccessPlan } from '../encounterRemedyIntegration';

const patientFor = (remedyId = 'encounter-remedy-gas-leak-poison') => startFixedEncounterRemedy({
  transactionId: `patient:${remedyId}`, patient: null, remedyId,
  encounterId: remedyId === 'encounter-remedy-bear-lord' ? 'foraging-mountain-m-winter' : 'foraging-titan-3',
  choiceId: remedyId === 'encounter-remedy-bear-lord' ? 'start-ailment' : 'rush',
  patientName: 'Test Patient', species: 'Bear', context: 'printed Remedy'
}).value!;

const part = (preparationId: string, id = preparationId): EngineInventoryItem => {
  const reagent = REAGENTS.find(row => row.preparations.some(p => p.id === preparationId))!;
  const preparation = reagent.preparations.find(row => row.id === preparationId)!;
  return { id, name: reagent.canonicalName, type: 'reagent', weight: preparation.weight,
    quantity: 1, preparationId, canonicalReagentId: reagent.id, usesRemaining: preparation.uses };
};
const treatment = (started: ReturnType<typeof patientFor>, inventory: EngineInventoryItem[], selectedToolIds: string[] = []) => resolveTreatment({
  mode: 'treat', transactionId: 'treatment:one',
  state: { patient: started.patient, inventory, reputation: 11, trinkets: 4, journalEvents: [], appliedTransactionIds: [] },
  ailmentInstanceId: started.ailmentInstanceId, selectedItemIds: inventory.filter(item => item.type === 'reagent').map(item => item.id),
  selectedToolIds, journalText: 'A prepared Remedy.'
});
const forageState = (foragingPoints = 0): ForagingEngineState => ({
  season: 'Spring', currentRegion: 'Forest', currentLocationType: 'Wilds', adjacentRegions: ['Meadow'],
  foragingPoints, inventory: [], toolIds: ['belt-knife'], patient: patientFor().patient, conditions: []
});

describe('p.30 Replacement acquisition and prepared consumption', () => {
  const replacement = { ...createReplacementAcquisition({ targetTag: 'POISON', requiredPotency: 2, name: 'Moon Sap', preparation: 'USED' }), selectedSource: 'forage' as const };
  const forage = (card: number, foragingPoints = 0, spendForagingPoints = false) => resolveForaging({
    transactionId: `forage:${card}:${foragingPoints}`, state: forageState(foragingPoints),
    card, locationRelation: 'current', forageRegion: 'Forest', targetReagentId: replacement.id,
    replacement, spendForagingPoints, skipEncounter: true
  });

  it('uses Rarity 12 itself, with a miss giving FP and no ordinary or stand-in Part', () => {
    const miss = forage(11).value!;
    expect(miss.candidates).toHaveLength(1);
    expect(miss.candidates[0]).toMatchObject({ reagentId: replacement.id, rarity: 12, cardSuccess: false, gapCost: 1 });
    expect(miss.gatheredItems).toEqual([]);
    expect(miss.nextState.inventory).toEqual([]);
    expect(miss.foragingPointsGained).toBe(1);
    expect(miss.timerCostAfterEncounter).toBe(1);
  });

  it('acquires exactly one usable Weight 2/3 Part through a successful BR12 card or gap payment', () => {
    const direct = forage(12).value!;
    const gap = forage(10, 2, true).value!;
    const automatic = forage(2, 12).value!;
    [direct, gap, automatic].forEach(outcome => {
      expect(outcome.gatheredItems).toHaveLength(1);
      expect(outcome.nextState.inventory).toHaveLength(1);
      expect(outcome.gatheredItems[0]).toMatchObject({ weight: 2 / 3, customReagent: { potency: 2, uses: 1 }, provenance: { acquisitionId: replacement.id, source: 'forage' } });
      expect(canTreatAilmentWithInventory(outcome.nextState.patient!, patientFor().ailmentInstanceId, outcome.nextState.inventory)).toBe(true);
      expect(treatment(patientFor(), outcome.nextState.inventory).value?.nextState.inventory).toEqual([]);
    });
    expect(gap.foragingPointsSpent).toBe(2);
    expect(gap.nextState.foragingPoints).toBe(0);
    expect(automatic.foragingPointsSpent).toBe(0);
  });

  it('gathers an invented Part without its preparation Tool, but still rejects a different active patient scope', () => {
    const brewed = { ...replacement, preparation: 'BREWED' };
    const gathered = resolveForaging({ transactionId: 'forage:tool', state: forageState(), card: 12, locationRelation: 'current', forageRegion: 'Forest', targetReagentId: brewed.id, replacement: brewed, skipEncounter: true });
    expect(gathered.status).toBe('resolved');
    expect(gathered.value?.gatheredItems).toHaveLength(1);
    expect(canTreatAilmentWithInventory(gathered.value!.nextState.patient!, patientFor().ailmentInstanceId, gathered.value!.nextState.inventory)).toBe(false);
    expect(resolveForaging({ transactionId: 'forage:wrong-patient', state: forageState(), card: 12, locationRelation: 'current', forageRegion: 'Forest', targetReagentId: replacement.id, replacement: { ...replacement, patientId: 'another-patient' }, skipEncounter: true }).status).toBe('invalid');
  });

  it('carries BR12 through social encounter, gap payment, immediate Remedy, and replay without a second reward', () => {
    const started = patientFor();
    const initial: BarterRuntimeState = { patient: started.patient, inventory: [], reputation: 15, trinkets: 4, attemptHistory: {}, pendingBarter: null, journalEvents: [], appliedTransactionIds: [] };
    const acquisition = { ...replacement, selectedSource: 'barter' as const };
    const begin = resolveBarterStart({ transactionId: 'barter:start', state: initial, patientId: started.patient.id,
      targetReagentId: acquisition.id, replacement: acquisition, preparationId: 'custom:moon-sap', currentLocationId: 'town', locationId: 'town', season: 'Spring',
      graph: { town: { id: 'town', region: 'Forest', locationType: 'Settlement', neighbors: [] } } }).value!;
    expect(begin.pendingBarter?.calculatedBR).toBe(12);
    const social = ENCOUNTERS.find(encounter => encounter.encounterType === 'social' && encounter.support === 'implemented' && encounter.mandatoryEffects.every(effect => effect.support === 'implemented'))!;
    const afterSocial = resolveBarterEncounter({ transactionId: 'barter:social', state: begin, card: { value: 3, suit: '♥' }, encounter: social }).value!;
    const offer = resolveBarterOffer({ transactionId: 'barter:offer', state: afterSocial, card: { value: 10, suit: '♥' } }).value!;
    expect(offer.inventory).toHaveLength(0);
    expect(offer.pendingBarter?.paymentRequired).toBe(2);
    const paid = resolveBarterPayment({ transactionId: 'barter:paid', state: offer, payment: { trinkets: 2, reputation: 0 } }).value!;
    expect(paid.inventory).toHaveLength(1);
    expect(paid.inventory[0].canonicalReagentId).toBeUndefined();
    expect(paid.inventory[0].provenance?.sourceTransactionId).toBe('barter:start');
    expect(paid.pendingBarter?.awaitingImmediateRemedy).toBe(true);
    expect(paid.patient.timers).toEqual(started.patient.timers);
    expect(resolveBarterPayment({ transactionId: 'barter:paid', state: paid, payment: { trinkets: 2, reputation: 0 } }).value).toEqual(paid);
    expect(treatment(started, paid.inventory).value?.nextState.inventory).toEqual([]);
    const catalogue = rememberCustomReagents([], paid.inventory);
    expect(rememberCustomReagents(catalogue, paid.inventory)).toEqual(catalogue);
    expect(catalogue).toHaveLength(1);
  });

  it('preserves a saved acquisition receipt and prepared Tag even when the invented name matches a printed Reagent', () => {
    const started = patientFor();
    const acquired = resolveForaging({ transactionId: 'forage:saved', state: forageState(), card: 12, locationRelation: 'current', forageRegion: 'Forest',
      targetReagentId: replacement.id, replacement: { ...replacement, name: 'Beech' }, skipEncounter: true }).value!;
    const migrated = migrateSavedRulesState(JSON.parse(JSON.stringify({ schemaVersion: 9, activePatientId: started.patient.id, patients: [started.patient],
      bag: acquired.nextState.inventory, pendingForaging: { transactionId: 'forage:saved', card: { value: 12, suit: '♥' }, region: 'Forest', phase: 'encounter',
        selectedReagentId: replacement.id, specialAcquisition: { kind: 'replacement', cacheId: replacement.id, label: 'Beech · acquired', itemCount: 1 } } })));
    const restored = migrated.bag as EngineInventoryItem[];
    expect(restored[0].canonicalReagentId).toBeUndefined();
    expect(preparationForInventory(restored[0])?.tags).toEqual([{ tag: 'POISON', value: 2 }]);
    expect(migrated.pendingForaging).toMatchObject({ selectedReagentId: replacement.id, phase: 'encounter', specialAcquisition: { kind: 'replacement', itemCount: 1 } });
    expect(treatment(started, restored).value?.nextState.inventory).toEqual([]);
    const failedReceipt = migrateSavedRulesState({ ...migrated, pendingForaging: { ...(migrated.pendingForaging as object), specialAcquisition: { kind: 'replacement', cacheId: replacement.id, label: 'miss', itemCount: 0 } } });
    expect(failedReceipt.pendingForaging).toMatchObject({ specialAcquisition: { itemCount: 0 } });
  });

  it('resumes a persisted Replacement Barter payment instead of dropping its noncanonical target', () => {
    const started = patientFor();
    const social = ENCOUNTERS.find(row => row.encounterType === 'social')!;
    const pending = { barterId: 'barter:resume', patientId: started.patient.id, targetReagentId: replacement.id, replacement: { ...replacement, selectedSource: 'barter' },
      preparationId: 'custom:moon-sap', locationId: 'town', locationType: 'Settlement', status: 'awaiting-payment', calculatedBR: 12,
      firstCard: { value: 3, suit: '♥' }, secondCard: { value: 10, suit: '♥' }, socialEncounter: social, paymentRequired: 2, appliedEffectIds: [] };
    const migrated = migrateSavedRulesState(JSON.parse(JSON.stringify({ schemaVersion: 9, activePatientId: started.patient.id, patients: [started.patient], bag: [], pendingBarter: pending })));
    expect(migrated.pendingBarter).toMatchObject({ targetReagentId: replacement.id, replacement: { kind: 'replacement' }, paymentRequired: 2 });
    const runtime: BarterRuntimeState = { patient: started.patient, inventory: [], reputation: 15, trinkets: 4, attemptHistory: {}, pendingBarter: migrated.pendingBarter as BarterRuntimeState['pendingBarter'], journalEvents: [], appliedTransactionIds: [] };
    const paid = resolveBarterPayment({ transactionId: 'barter:resume:pay', state: runtime, payment: { trinkets: 2, reputation: 0 } }).value!;
    expect(paid.inventory).toHaveLength(1);
    expect(treatment(started, paid.inventory).value?.nextState.inventory).toEqual([]);
  });

  it('retains an acquired invented definition in the Almanack through consumption, JSON save, and reload', () => {
    const acquired = forage(12).value!;
    const catalogue = rememberCustomReagents([], acquired.gatheredItems);
    expect(customReagentCatalogueProjection(catalogue, acquired.gatheredItems, 'poison')[0])
      .toMatchObject({ name: 'Moon Sap (USED)', potency: 2, source: 'replacement', sourcePage: 30, inBag: true, remainingUses: 1 });
    const consumed = treatment(patientFor(), acquired.gatheredItems).value!.nextState.inventory;
    const saved = JSON.parse(JSON.stringify({ schemaVersion: 9, bag: consumed, customReagentCatalogue: catalogue }));
    const restored = migrateSavedRulesState(saved);
    expect(restored.customReagentCatalogue).toEqual(catalogue);
    expect(customReagentCatalogueProjection(restored.customReagentCatalogue, [], 'moon'))
      .toMatchObject([{ source: 'replacement', inBag: false, remainingUses: 0 }]);
    expect(customReagentCatalogueProjection(restored.customReagentCatalogue, [], 'not-a-match')).toEqual([]);
  });

  it('backfills a legacy acquired definition once and does not add a definition for a failed BR12 acquisition', () => {
    const acquired = forage(12).value!;
    const restored = migrateSavedRulesState(JSON.parse(JSON.stringify({ schemaVersion: 9, bag: acquired.gatheredItems })));
    expect(restored.customReagentCatalogue).toHaveLength(1);
    expect(migrateSavedRulesState(JSON.parse(JSON.stringify(restored))).customReagentCatalogue).toEqual(restored.customReagentCatalogue);
    expect(rememberCustomReagents([], forage(11).value!.gatheredItems)).toEqual([]);
  });
});

describe('p.195 Foreign Reagent preparation', () => {
  it('links the purchased TAG2 to its preparation tool, uses, and consumption', () => {
    const started = patientFor();
    const state: ForagingEncounterTransactionState = { revision: 3, reputation: 15, trinkets: 4, foragingPoints: 2,
      patient: started.patient, inventory: [], tools: [], companions: [], conditions: [], deliveries: [], sainDeClawsQuests: [], appliedTransactionIds: [] };
    const bought = resolveOdoakMarket({ transactionId: 'foreign:buy', expectedRevision: 3, encounterId: FORAGING_ENCOUNTER_IDS.odoakMarket,
      state, choice: 'impulse-purchase', reagentName: 'Moon Pepper', reagentType: 'PLANT', tag: 'POISON', preparationMethods: ['BREWED'] }).value!;
    const foreign = bought.nextState.inventory[0];
    expect(bought.nextState.trinkets).toBe(2);
    expect(preparationForInventory(foreign)).toMatchObject({ tags: [{ tag: 'POISON', value: 2 }], requiredTools: ['camp-kettle'], uses: 1 });
    expect(treatment(started, [foreign]).status).toBe('invalid');
    const kettle: EngineInventoryItem = { id: 'kettle', name: 'Camp Kettle', type: 'tool', weight: 1, canonicalToolId: 'camp-kettle' };
    const treated = treatment(started, [foreign, kettle], ['kettle']);
    expect(treated.value?.providedTags.POISON).toBe(2);
    expect(treated.value?.nextState.inventory).toEqual([kettle]);
    // Persisted Foreign Reagents predating the potency field retain TAG2.
    const legacy = { ...foreign, customReagent: { ...foreign.customReagent!, potency: undefined } };
    expect(preparationForInventory(legacy)?.tags).toEqual([{ tag: 'POISON', value: 2 }]);
    const migrated = migrateSavedRulesState(JSON.parse(JSON.stringify({ schemaVersion: 9, activePatientId: started.patient.id, patients: [started.patient], bag: [legacy, kettle] })));
    expect(treatment(started, migrated.bag as EngineInventoryItem[], ['kettle']).value?.nextState.inventory).toEqual([kettle]);
    expect(migrated.customReagentCatalogue).toMatchObject([{ name: 'Foreign Reagent: Moon Pepper', source: 'foreign-reagent', sourcePage: 195, reagentType: 'PLANT', potency: 2, requiredToolIds: ['camp-kettle'] }]);
    const catalogue = rememberCustomReagents(migrated.customReagentCatalogue, [legacy]);
    expect(catalogue).toHaveLength(1);
    expect(customReagentCatalogueProjection(catalogue, [kettle])).toMatchObject([{ source: 'foreign-reagent', inBag: false, remainingUses: 0 }]);
  });
});

describe('p.183 Bear Lord separate doses and later outcomes', () => {
  it('allocates two actual INFECTION3 Parts, consumes each only once, and preserves the PAIN2 Part uses', () => {
    const started = patientFor('encounter-remedy-bear-lord');
    const inventory = [part('maggots-larvae-used-1', 'infection-a'), part('maggots-larvae-used-1', 'infection-b'), part('ironslug-guts-used-1', 'pain')];
    const preview = previewTreatmentSelection({ patient: started.patient, ailmentInstanceId: started.ailmentInstanceId, inventory, selectedItemIds: inventory.map(item => item.id), selectedToolIds: [] });
    expect(preview.ready).toBe(true);
    expect(preview.separateDoses?.map(dose => dose.itemIds)).toEqual([['infection-a'], ['infection-b']]);
    expect(preview.ingredientUses).toEqual({ 'infection-a': 1, 'infection-b': 1, pain: 1 });
    const treated = treatment(started, inventory).value!;
    expect(treated.nextState.inventory.some(item => item.id.startsWith('infection-'))).toBe(false);
    expect(treated.nextState.inventory.some(item => item.id === 'pain')).toBe(false);
    expect(treated.nextState.patient.treatmentHistory.at(-1)?.separateDoses).toEqual(preview.separateDoses);
    expect(treated.reputationChange).toBe(0);
    expect(treated.trinketReward).toBe(0);
  });

  it('permits two physical Parts stored as a stack and rejects reusing one remaining Part as both doses', () => {
    const started = patientFor('encounter-remedy-bear-lord');
    const pain = part('ironslug-guts-used-1', 'pain');
    const stack = { ...part('maggots-larvae-used-1', 'infection-stack'), quantity: 2 };
    const success = treatment(started, [stack, pain]).value!;
    expect(success.nextState.inventory.some(item => item.id === stack.id)).toBe(false);
    expect(success.nextState.patient.treatmentHistory.at(-1)?.ingredientUses?.[stack.id]).toBe(2);
    expect(treatment(started, [{ ...stack, quantity: 1 }, pain]).status).toBe('invalid');
  });

  it('turns actual subsequent bear losses into a journal meeting while leaving unrelated encounters unchanged', () => {
    const successPlan = encounterRemedySuccessPlan(ENCOUNTER_REMEDY_BY_ID.get('encounter-remedy-bear-lord')!.success)!;
    expect(successPlan.addCondition).toBe('bear-lord-deference');
    const foraging = resolveForaging({ transactionId: 'after-bear:forage', state: { ...forageState(5), conditions: [successPlan.addCondition!] },
      forageRegion: 'Forest', locationRelation: 'current', card: { value: 12, suit: '♥' }, bearScurryActive: true }).value!;
    expect(foraging.encounter?.choices.map(choice => choice.id)).toEqual(['bear-deference']);
    expect(foraging.encounter?.choices[0].requiresJournal).toBe(true);
    expect(foraging.encounter?.mandatoryEffects).toEqual([]);
    const state = { reputation: 15, trinkets: 4, calendarDays: 0, foragingPoints: 5, inventory: [], patient: patientFor().patient, movementBlocked: false, conditions: [successPlan.addCondition!], appliedEffectIds: [] };
    const encounter = resolveEncounter({ transactionId: 'after-bear:meeting', encounter: foraging.encounter!, state, choiceId: 'bear-deference', journalNote: 'The great bear bowed.', journalAcknowledged: true }).value!;
    expect(encounter.nextState.foragingPoints).toBe(5);
    expect(encounter.nextState.patient?.timers).toEqual(state.patient.timers);
    const unrelated = ENCOUNTERS.find(row => row.id !== 'foraging-forest-m-spring')!;
    expect(applyBearDeference(unrelated, state.conditions)).toBe(unrelated);
  });

  it('retains the printed death/optional Rarity10 branch after Timer8 expiration without a normal penalty', () => {
    const started = patientFor('encounter-remedy-bear-lord');
    const expired = resolveTimer({ patient: started.patient, hours: 8 }).value!;
    const failed = resolveTreatment({ mode: 'fail-expired', transactionId: 'bear:expired', ailmentInstanceIds: [started.ailmentInstanceId], journalText: 'The Bear Lord died.',
      state: { patient: expired, inventory: [], reputation: 11, trinkets: 4, journalEvents: [], appliedTransactionIds: [] } }).value!;
    expect(failed.nextState.reputation).toBe(11);
    expect(failed.nextState.patient.ailments[0].specialState.failureOutcome).toMatchObject({ code: 'BEAR_LORD_PASSES_ELSEWHERE' });
    expect(ENCOUNTER_REMEDY_BY_ID.get('encounter-remedy-bear-lord')!.failure.description).toContain('Rarity up to 10');
    expect(failed.nextState.patient.ailments[0].consequenceResolved).toBe(true);
    expect(failed.consumedItemIds).toEqual([]);
  });
});
