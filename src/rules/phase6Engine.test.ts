import { describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  PRINTED_EFFECT_BY_OWNER,
  PRINTED_EFFECT_REGISTRY,
  classifyPrintedEffect,
  commitAlternativeAcquisition,
  createReplacementAcquisition,
  migrateSavedRulesState,
  printedAutomationLabel,
  resolveToolEffects,
  type CanonicalToolState,
  type LeaveRuntimeState,
  type PatientState
} from './index';

const patient = (): PatientState => ({
  id: 'patient-1',
  name: 'Rowan',
  species: 'Vole',
  status: 'active',
  ailments: [{
    id: 'ailment-instance-1', ailmentId: 'ailment-paw-rot', severity: 'lesser', timerIds: ['timer-1'],
    conditionIds: [], treatmentHistoryIds: [], status: 'active', instance: 1, repeatIndex: 0,
    specialState: {}, successResolved: false, failureResolved: false, consequenceResolved: false, effectIds: []
  }],
  timers: [{ id: 'timer-1', ailmentInstanceId: 'ailment-instance-1', current: 7, maximum: 7, status: 'active' }],
  conditions: [], treatmentHistory: [], journalEvents: []
});

const leaveState = (): LeaveRuntimeState => ({
  inventory: [], patient: patient(), reputation: 0, trinkets: 0, currentRegion: 'Forest', adjacentRegions: ['Meadow'],
  foragingPoints: 0, pendingObligation: null, journalEvents: [], appliedTransactionIds: []
});

const tool = (input: Partial<CanonicalToolState> & Pick<CanonicalToolState, 'instanceId' | 'toolId'>): CanonicalToolState => ({
  upgradeId: null, charges: null, broken: false, consumed: false, acquiredBy: 'test', appliedEffectIds: [], ...input
});

describe('Phase 6 resumable canonical state', () => {
  it('[SAVE-001/SAVE-004/REMEDY-001] restores an unfinished treatment draft without replaying a committed transaction', () => {
    const migrated = migrateSavedRulesState({
      schemaVersion: 5,
      appliedTransactionIds: [],
      treatmentDraft: {
        patientId: 'patient-1', ailmentInstanceId: 'ailment-instance-1',
        selectedParts: [{ itemId: 'part-1', reagentId: 'reagent-beech', preparationId: 'reagent-beech:bark' }],
        selectedPreparationIds: ['reagent-beech:bark'], selectedToolIds: ['tool-1'], catalyse: [], fair: 1, foul: 0,
        purify: false, status: 'draft', committedTransactionId: null, createdAt: 10, updatedAt: 12
      },
      pendingAlternativeAcquisition: { kind: 'replacement', targetTag: 'PAIN', requiredPotency: 2, name: 'Moon Sap' }
    });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.treatmentDraft).toMatchObject({
      patientId: 'patient-1', ailmentInstanceId: 'ailment-instance-1', selectedToolIds: ['tool-1'], fair: 1, status: 'draft'
    });
    expect(migrated.pendingAlternativeAcquisition).toMatchObject({ selectedSource: null });
    expect((migrated.pendingAlternativeAcquisition as unknown as { id: string }).id).toContain('replacement:PAIN');

    const committed = migrateSavedRulesState({
      schemaVersion: 5,
      appliedTransactionIds: ['treatment:done'],
      treatmentDraft: {
        patientId: 'patient-1', ailmentInstanceId: 'ailment-instance-1', selectedParts: [], selectedPreparationIds: [],
        selectedToolIds: [], catalyse: [], fair: 0, foul: 0, purify: false, status: 'committed',
        committedTransactionId: 'treatment:done', createdAt: 10, updatedAt: 12
      }
    });
    expect(committed.treatmentDraft).toBeNull();
  });
});

describe('Phase 6 replacement acquisition closure', () => {
  it('[REMEDY-003/FORAGE-005/BARTER-005/SAVE-004] commits BR 12 and Weight 2/3 only after the selected acquisition succeeds', () => {
    const acquisition = { ...createReplacementAcquisition({ targetTag: 'PAIN', requiredPotency: 2, name: 'Moon Sap', preparation: 'Brewed' }), selectedSource: 'forage' as const };
    expect(commitAlternativeAcquisition({
      transactionId: 'replacement:wrong-source', state: leaveState(), acquisition, source: 'barter',
      sourceTransactionId: 'barter:1', acquisitionSucceeded: true
    }).status).toBe('invalid');

    const committed = commitAlternativeAcquisition({
      transactionId: 'replacement:commit', state: leaveState(), acquisition, source: 'forage',
      sourceTransactionId: 'forage:1', acquisitionSucceeded: true
    });
    expect(committed.status).toBe('resolved');
    expect(committed.value?.inventory[0]).toMatchObject({
      weight: 2 / 3,
      customReagent: { baseRarity: 12, targetTag: 'PAIN', preparation: 'Brewed' },
      provenance: { acquisitionId: acquisition.id, source: 'forage', sourceTransactionId: 'forage:1' }
    });
    expect(commitAlternativeAcquisition({
      transactionId: 'replacement:duplicate', state: committed.value!, acquisition, source: 'forage',
      sourceTransactionId: 'forage:2', acquisitionSucceeded: true
    }).status).toBe('invalid');
  });
});

describe('Phase 6 common Tool effects', () => {
  it('[TOOL-002/TOOL-003/SAVE-004] routes matching triggers once and preserves state across phases', () => {
    const sickle = tool({ instanceId: 'sickle-1', toolId: 'belt-knife', upgradeId: 'silver-sickle' });
    const first = resolveToolEffects({
      transactionId: 'forage:tool', phase: 'foraging', trigger: 'forage', tools: [sickle],
      selectedToolInstanceIds: ['sickle-1'], rulesetId: 'original-1e-3p'
    });
    expect(first).toMatchObject({ foragingPoints: 1, appliedToolInstanceIds: ['sickle-1'] });
    const replay = resolveToolEffects({
      transactionId: 'forage:tool', phase: 'foraging', trigger: 'forage', tools: first.tools,
      selectedToolInstanceIds: ['sickle-1'], rulesetId: 'original-1e-3p'
    });
    expect(replay).toMatchObject({ foragingPoints: 0, appliedToolInstanceIds: [] });

    const tent = tool({ instanceId: 'tent-1', toolId: 'canvas-tent', charges: 1 });
    const weather = resolveToolEffects({
      transactionId: 'travel:weather', phase: 'travel', trigger: 'weather-encounter', tools: [tent],
      card: { value: 5, suit: '♥' }, rulesetId: 'original-1e-3p'
    });
    expect(weather.ignoredOutcome).toBe(true);
    expect(weather.tools[0]).toMatchObject({ charges: 0, consumed: true, broken: false });

    const travelTools = [
      tool({ instanceId: 'stilts-1', toolId: 'stilts' }),
      tool({ instanceId: 'instrument-1', toolId: 'instruments' }),
      tool({ instanceId: 'instrument-2', toolId: 'instruments' })
    ];
    const bogMove = resolveToolEffects({
      transactionId: 'travel:bog', phase: 'travel', trigger: 'bog-move', tools: travelTools,
      rulesetId: 'original-1e-3p'
    });
    expect(bogMove.speedDelta).toBe(1);
    const performance = resolveToolEffects({
      transactionId: 'travel:arrival', phase: 'travel', trigger: 'settlement-arrival', tools: bogMove.tools,
      availablePerformers: 1, rulesetId: 'original-1e-3p'
    });
    expect(performance.trinketsDelta).toBe(1);
    expect(performance.appliedToolInstanceIds).toHaveLength(1);
  });
});

describe('Phase 6 printed-effect classification', () => {
  it('[CORE-002/AILMENT-003/TRAVEL-009] exposes stable automation classes without hiding manual narrative rows', () => {
    expect(PRINTED_EFFECT_REGISTRY).toHaveLength(358);
    expect(new Set(PRINTED_EFFECT_REGISTRY.map(effect => effect.ownerId)).size).toBe(358);
    expect(PRINTED_EFFECT_REGISTRY.filter(effect => effect.status === 'implemented').length).toBeGreaterThanOrEqual(10);

    const brandCare = PRINTED_EFFECT_BY_OWNER.get('ailment-brand-care')!;
    const pinned = PRINTED_EFFECT_BY_OWNER.get('ailment-pinned-by-pine')!;
    const forestFollowUp = PRINTED_EFFECT_BY_OWNER.get('travel-forest-a-2')!;
    expect(classifyPrintedEffect(brandCare)).toBe('structured-choice');
    expect(classifyPrintedEffect(pinned)).toBe('deterministic');
    expect(classifyPrintedEffect(forestFollowUp)).toBe('narrative');
    expect(printedAutomationLabel(forestFollowUp)).toBe('직접 처리');
  });
});
