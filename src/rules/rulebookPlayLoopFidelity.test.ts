import { describe, expect, it } from 'vitest';
import {
  REAGENTS,
  canTreatAilmentWithInventory,
  listInBloomCandidates,
  resolveForagingEngine,
  resolveJourneyEnding,
  resolvePatient,
  resolveTreatment,
  type CanonicalToolState,
  type EngineInventoryItem,
  type JourneyRuntimeState,
  type JourneyState
} from './index';

const journey = (): JourneyState => ({
  journeyId: 'optional-journal-journey', originId: 'odoak', season: 'Spring',
  destinationId: 'summit', reason: 'Return to a friend', goalId: 'responsibility',
  goalState: {
    events: [], playerDeclaredComplete: false, gmOverride: false,
    evaluation: {
      goalId: 'responsibility', complete: false, automaticComplete: false,
      evidence: [], manualConfirmationRequired: false
    }
  },
  urgency: { label: 'Relaxed', days: 12 }, startDate: 1, status: 'active',
  journalPrompts: [], deviations: [], rulesetId: 'original-1e-3p', startReputation: 5
});

const journeyRuntime = (): JourneyRuntimeState => ({
  currentLocationId: 'summit', reputation: 10, inventory: [], patients: [],
  pendingEncounter: null, pendingBarter: null, pendingForaging: null,
  journey: journey(), pendingEnding: null, downtimeRequired: false,
  journalEvents: [], appliedTransactionIds: []
});

describe('Independent rulebook review: play-loop fidelity', () => {
  it('p.7/p.38 permits explicitly ending without a written journal, without fabricating player memories', () => {
    const result = resolveJourneyEnding({
      transactionId: 'end-without-journal', state: journeyRuntime(), endedAt: 2,
      outcome: 'success', journalText: ''
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.journey).toMatchObject({
      status: 'completed', ending: { outcome: 'success', journalText: '' }
    });
    expect(result.value?.downtimeRequired).toBe(true);
    expect(result.value?.journalEvents[0]).toMatchObject({ authorship: 'system' });
    expect(result.value?.journalEvents[0].playerMemory).toBeUndefined();

    const duplicate = resolveJourneyEnding({
      transactionId: 'end-without-journal', state: result.value!, endedAt: 3,
      outcome: 'failure', journalText: ''
    });
    expect(duplicate.value).toBe(result.value);
  });

  it('reopening a saved empty-journal ending still requires explicit confirmation', () => {
    const state = journeyRuntime();
    state.journey!.status = 'ending';
    state.pendingEnding = {
      journeyId: state.journey!.journeyId, blockers: [],
      evaluation: state.journey!.goalState.evaluation,
      selectedOutcome: 'success', journalText: ''
    };
    const reloaded = JSON.parse(JSON.stringify(state)) as JourneyRuntimeState;
    const reopened = resolveJourneyEnding({
      transactionId: 'empty-ending-reopen', state: reloaded, endedAt: 2
    });
    expect(reopened.status).toBe('manual');
    expect(reopened.value?.journey?.status).toBe('ending');
    expect(reopened.value?.appliedTransactionIds).not.toContain('empty-ending-reopen');

    const confirmed = resolveJourneyEnding({
      transactionId: 'empty-ending-confirm', state: reopened.value!, endedAt: 3,
      journalText: ''
    });
    expect(confirmed.status).toBe('resolved');
    expect(confirmed.value?.journey?.ending?.outcome).toBe('success');
  });

  it('p.27/p.31-32 gathers Cherries without a Frying Pan, then requires the Pan to prepare their Remedy', () => {
    const cherry = REAGENTS.find(row => row.canonicalName === 'Cherry Trees')!;
    const cookedCherries = cherry.preparations.find(row => row.name === 'Cherries' && row.method === 'COOKED')!;
    const chestnut = REAGENTS.find(row => row.canonicalName === 'Horse Chestnuts')!;
    const husks = chestnut.preparations.find(row => row.name === 'Spiky Husks')!;
    const existingItems: EngineInventoryItem[] = [
      {
        id: 'farewell-husks', name: 'Spiky Husks', type: 'reagent', weight: husks.weight,
        canonicalReagentId: chestnut.id, preparationId: husks.id, usesRemaining: husks.uses
      },
      { id: 'paws', name: 'Paws', type: 'tool', weight: 0, canonicalToolId: 'paws' }
    ];
    const patient = resolvePatient({
      id: 'farewell-patient', name: 'Patient', species: 'Vole', ailmentIds: ['ailment-fond-farewell']
    }).value!;
    const gathered = resolveForagingEngine({
      transactionId: 'summer-cherries',
      state: {
        season: 'Summer', currentRegion: 'Forest', currentLocationType: 'Wilds',
        foragingPoints: 0, inventory: existingItems, toolIds: ['paws'], patient
      },
      forageRegion: 'Forest', locationRelation: 'current', card: { value: 12, suit: '♥' },
      targetReagentId: cherry.id, parts: [{ preparationId: cookedCherries.id, quantity: 1 }]
    });
    expect(gathered.status, gathered.messages.join(' ')).not.toBe('invalid');
    expect(gathered.value?.gatheredItems).toHaveLength(1);
    expect(gathered.value?.timerCostAfterEncounter).toBe(1);
    const inventory = gathered.value!.nextState.inventory;
    const ailmentInstanceId = patient.ailments[0].id;
    expect(canTreatAilmentWithInventory(patient, ailmentInstanceId, inventory)).toBe(false);

    const treatment = {
      mode: 'treat' as const, transactionId: 'cherry-farewell',
      state: { inventory, patient, reputation: 5, trinkets: 0, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId,
      selectedItemIds: ['farewell-husks', gathered.value!.gatheredItems[0].id],
      selectedToolIds: ['paws'], journalText: ''
    };
    const tooSoon = resolveTreatment(treatment);
    expect(tooSoon.status).toBe('invalid');
    expect(tooSoon.messages.join(' ')).toContain('copper-frying-pan');

    const pan: EngineInventoryItem = {
      id: 'pan', name: 'Copper Frying Pan', type: 'tool', weight: 2 / 3,
      canonicalToolId: 'copper-frying-pan'
    };
    expect(canTreatAilmentWithInventory(patient, ailmentInstanceId, [...inventory, pan])).toBe(true);
    const prepared = resolveTreatment({
      ...treatment, state: { ...treatment.state, inventory: [...inventory, pan] },
      selectedToolIds: ['paws', 'pan']
    });
    expect(prepared.status, prepared.messages.join(' ')).toBe('resolved');
    expect(prepared.value?.nextState.patient.status).toBe('cured');
  });

  it('p.78 In Bloom lists harvestable Parts without preparation Tools while preserving seasonal Part restrictions', () => {
    const cherry = REAGENTS.find(row => row.canonicalName === 'Cherry Trees')!;
    const cherries = cherry.preparations.find(row => row.name === 'Cherries')!;
    const summer = listInBloomCandidates(cherry.baseRarity, 'Summer', []);
    expect(summer.find(row => row.reagentId === cherry.id)?.preparationIds).toContain(cherries.id);
    const spring = listInBloomCandidates(cherry.baseRarity, 'Spring', []);
    expect(spring.find(row => row.reagentId === cherry.id)?.preparationIds || []).not.toContain(cherries.id);
  });

  it.each([false, true])('p.12/p.66 needs a usable Knife for ordinary miss FP (known miss: %s)', declineGather => {
    const cherry = REAGENTS.find(row => row.canonicalName === 'Cherry Trees')!;
    const cherries = cherry.preparations.find(row => row.name === 'Cherries')!;
    const attempt = (toolIds: string[], tools?: CanonicalToolState[]) => resolveForagingEngine({
      transactionId: `knife-required:${declineGather}`,
      state: {
        season: 'Summer', currentRegion: 'Forest', currentLocationType: 'Wilds',
        foragingPoints: 0, inventory: [], toolIds, tools
      },
      forageRegion: 'Forest', locationRelation: 'current', card: { value: 1, suit: '♥' },
      targetReagentId: cherry.id, parts: [{ preparationId: cherries.id, quantity: 1 }],
      declineGather, skipEncounter: true
    });
    const withoutKnife = attempt([]);
    expect(withoutKnife.value).toMatchObject({ gatheredItems: [], foragingPointsGained: 0 });
    expect(attempt(['belt-knife']).value?.foragingPointsGained).toBe(1);
    const brokenKnife: CanonicalToolState = {
      instanceId: 'broken-knife', toolId: 'belt-knife', upgradeId: 'silver-sickle',
      charges: null, broken: true, consumed: false, acquiredBy: 'smithing', appliedEffectIds: []
    };
    expect(attempt(['belt-knife'], [brokenKnife]).value?.foragingPointsGained).toBe(0);
  });

  it('keeps a specific Encounter grant of FP available even when no Knife is carried', () => {
    const result = resolveForagingEngine({
      transactionId: 'specific-fp-grant',
      state: {
        season: 'Spring', currentRegion: 'Bog', currentLocationType: 'Wilds',
        foragingPoints: 0, inventory: [], toolIds: [], conditions: ['forage-bonus:Bog:1']
      },
      forageRegion: 'Bog', locationRelation: 'current', card: 1, skipEncounter: true
    });
    expect(result.value?.foragingPointsGained).toBe(1);
  });
});
