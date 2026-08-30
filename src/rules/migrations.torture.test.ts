import { describe, expect, it } from 'vitest';
import { migrateSavedRulesState, SAVE_MIGRATIONS } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './state';
import { createSerializedForagingRollbackSnapshot } from '../foragingRecovery';
import { SOCIAL_ENCOUNTERS } from './data/encounters';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const richSaveAt = (schemaVersion: number | string) => ({
  schemaVersion,
  rulesetId: 'original-1e-3p',
  rulebookEdition: 'first-edition-third-printing-may-2023',
  bio: { name: 'Migration Tester', speed: 3, carry: 6 },
  bag: [
    { id: 'tool-mortar', name: 'Mortar and Pestle', type: 'tool', canonicalToolId: 'mortar-and-pestle', weight: 1 / 3 },
    { id: 'reagent-dandelion', name: 'Dandelions', type: 'reagent', canonicalReagentId: 'dandelions', usesRemaining: 2, weight: 1 / 3 }
  ],
  currentSeason: 'Fall',
  calendarDays: 8,
  completedSeasons: 2,
  currentLocationName: 'Odoak',
  routeDraft: {
    stops: [
      { id: 'origin', name: 'Origin', kind: 'Wilds', terrain: 'Forest', hasClinic: false, x: 10, y: 20 },
      { id: 'loch', name: 'Loch Waypoint', kind: 'Wilds', terrain: 'Loch', hasClinic: false, x: 20, y: 30 },
      { id: 'loch-settlement', name: 'Loch Settlement', kind: 'Settlement', terrain: 'Loch', hasClinic: false, x: 30, y: 40 },
      { id: 'destination', name: 'Destination', kind: 'Settlement', terrain: 'Forest', hasClinic: false, x: 40, y: 50 }
    ],
    edgeKinds: ['path', 'waterway', 'river']
  },
  activePatientId: 'patient-1',
  patients: [{
    id: 'patient-1', name: 'Moss', species: 'Mouse', status: 'active', foragingPoints: 3,
    reagentsGathered: ['reagent-dandelion'],
    ailments: [{
      id: 'ailment-1', ailmentId: 'paw-rot', severity: 'lesser', status: 'active', instance: 1,
      timerIds: ['timer-1'], conditionIds: [], treatmentHistoryIds: []
    }],
    timers: [{ id: 'timer-1', ailmentInstanceId: 'ailment-1', current: 4, maximum: 8, status: 'active' }],
    conditions: [], treatmentHistory: [], journalEvents: []
  }],
  patientArchive: [{ caseId: 'archive-1', patientId: 'old-patient', status: 'treated', success: true, failure: false }],
  journey: { journeyId: 'journey-1', originId: 'origin', destinationId: 'destination', status: 'active' },
  pendingForaging: {
    transactionId: 'forage-pending', region: 'Forest', locationRelation: 'current',
    card: { value: 7, suit: '♥' }, timerCostAfterEncounter: 1, encounterId: null, phase: 'choose-reagent',
    targetReagentId: 'reagent-dandelions',
    rememberedReagentIds: [' reagent-marigold ', 'reagent-nettles', 'reagent-marigold', 'missing-reagent'],
    candidateSelectionReagentId: ' reagent-marigold ',
    journalNote: '말린 풀 냄새와 젖은 흙을 기억했다.', journalAcknowledged: true,
    undoSnapshot: {
      activePatientId: 'patient-1',
      patientForagingPoints: 3,
      patientReagentsGathered: ['reagent-dandelion'],
      activeAilmentForagingPoints: 3,
      activeAilmentReagentsGathered: ['reagent-dandelion'],
      independentUsedThisAilment: false,
      lastForageCardValue: 4,
      toolStates: [{ instanceId: 'tool-mortar', toolId: 'mortar-and-pestle', broken: false, consumed: false }],
      pendingAlternativeAcquisition: null,
      rollbackState: createSerializedForagingRollbackSnapshot('forage-pending', {
        bag: [{ id: 'reagent-dandelion' }],
        pendingManualEffect: null,
        activeDelve: undefined,
        journals: [{ id: 'journal-before-forage' }]
      })
    }
  },
  pendingEncounter: {
    transactionId: 'encounter-pending', encounterId: 'forest-memory',
    encounter: { id: 'forest-memory', title: 'Memories', text: 'What returns to mind?', sourcePage: 161 },
    phase: 'pending', unresolvedEffectCodes: [], card: { value: 8, suit: '♠' },
    journalNote: '바람 소리와 오래된 돌을 기억했다.', journalAcknowledged: true
  },
  treatmentDraft: {
    id: 'draft-1', patientId: 'patient-1', ailmentInstanceId: 'ailment-1', selectedParts: [],
    selectedPreparationIds: [], selectedToolIds: ['tool-mortar'], catalyse: [], fair: 0, foul: 0,
    purify: false, replacementContext: null, status: 'draft', committedTransactionId: null,
    createdAt: 100, updatedAt: 100
  },
  toolStates: [{ instanceId: 'tool-mortar', toolId: 'mortar-and-pestle', upgradeId: null, charges: null, broken: false, consumed: false, acquiredBy: 'test', appliedEffectIds: [] }],
  downtimeRequired: true,
  downtimeCompleted: false,
  saveRevision: '27',
  unknownCampaignMemory: { preserve: 'exactly' }
});

describe('save migration torture matrix', () => {
  it('has a complete migration function for every supported historical version', () => {
    expect(Object.keys(SAVE_MIGRATIONS).map(Number).sort((a, b) => a - b))
      .toEqual(Array.from({ length: CURRENT_SCHEMA_VERSION }, (_, index) => index));
  });

  it.each(Array.from({ length: CURRENT_SCHEMA_VERSION + 1 }, (_, index) => index))(
    'migrates schema v%i to the current canonical state without losing gameplay data',
    schemaVersion => {
      const migrated = migrateSavedRulesState(clone(richSaveAt(schemaVersion)));
      expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated.bio).toMatchObject({ name: 'Migration Tester', speed: 3, carry: 6 });
      expect(migrated.bag).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'tool-mortar', canonicalToolId: 'mortar-and-pestle' }),
        expect.objectContaining({ id: 'reagent-dandelion', usesRemaining: 2 })
      ]));
      expect(migrated.routeDraft.edgeKinds).toEqual(['path', 'waterway', 'river']);
      expect(migrated.routeDraft.stops.map(stop => stop.id)).toEqual(['origin', 'loch', 'loch-settlement', 'destination']);
      expect(migrated.activePatientId).toBe('patient-1');
      expect(migrated.patients[0]).toMatchObject({ id: 'patient-1', foragingPoints: 3, reagentsGathered: ['reagent-dandelion'] });
      expect(migrated.patientArchive).toHaveLength(1);
      expect(migrated.toolStates).toEqual(expect.arrayContaining([expect.objectContaining({ instanceId: 'tool-mortar', toolId: 'mortar-and-pestle' })]));
      expect(migrated.journey).toMatchObject({ journeyId: 'journey-1', destinationId: 'destination' });
      expect(migrated.journey).toMatchObject({
        goalId: 'custom',
        goalState: { events: [], playerDeclaredComplete: false, gmOverride: false },
        urgency: { label: 'Important', days: 12 }
      });
      expect(migrated.pendingForaging).toMatchObject({
        transactionId: 'forage-pending', region: 'Forest', phase: 'choose-reagent',
        targetReagentId: 'reagent-dandelions',
        rememberedReagentIds: ['reagent-marigold', 'reagent-nettles'],
        candidateSelectionReagentId: 'reagent-marigold',
        journalNote: '말린 풀 냄새와 젖은 흙을 기억했다.', journalAcknowledged: true,
        undoSnapshot: {
          activePatientId: 'patient-1',
          patientForagingPoints: 3,
          patientReagentsGathered: ['reagent-dandelion'],
          activeAilmentForagingPoints: 3,
          activeAilmentReagentsGathered: ['reagent-dandelion'],
          lastForageCardValue: 4,
          rollbackState: {
            version: 1,
            transactionId: 'forage-pending',
            fields: {
              bag: { present: true, value: [{ id: 'reagent-dandelion' }] },
              pendingManualEffect: { present: true, value: null },
              activeDelve: { present: true }
            },
            journalIds: ['journal-before-forage']
          }
        }
      });
      expect(migrated.pendingEncounter).toMatchObject({
        transactionId: 'encounter-pending', encounterId: 'forest-memory',
        journalNote: '바람 소리와 오래된 돌을 기억했다.', journalAcknowledged: true
      });
      expect(migrated.treatmentDraft).toMatchObject({ id: 'draft-1', patientId: 'patient-1', selectedToolIds: ['tool-mortar'], status: 'draft' });
      expect(migrated).toMatchObject({ currentSeason: 'Autumn', calendarDays: 8, completedSeasons: 2, downtimeRequired: true, saveRevision: 27 });
      expect(migrated.unknownCampaignMemory).toEqual({ preserve: 'exactly' });
    }
  );

  it('also accepts an unversioned v0 save and a numeric-string schema version', () => {
    const unversioned = richSaveAt(0);
    delete (unversioned as { schemaVersion?: number | string }).schemaVersion;
    expect(migrateSavedRulesState(unversioned).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrateSavedRulesState(richSaveAt('8')).routeDraft.edgeKinds).toEqual(['path', 'waterway', 'river']);
  });

  it('is idempotent and JSON round-trip stable for every supported version', () => {
    for (let version = 0; version <= CURRENT_SCHEMA_VERSION; version += 1) {
      const once = migrateSavedRulesState(clone(richSaveAt(version)));
      const twice = migrateSavedRulesState(clone(once));
      const roundTripped = migrateSavedRulesState(JSON.parse(JSON.stringify(once)));
      expect(twice, `idempotency v${version}`).toEqual(once);
      expect(roundTripped, `round trip v${version}`).toEqual(once);
    }
  });

  it('round-trips remembered Foraging research and an uncommitted canonical candidate selection', () => {
    const source = richSaveAt(CURRENT_SCHEMA_VERSION);
    const once = migrateSavedRulesState(clone({
      ...source,
      pendingForaging: {
        ...source.pendingForaging,
        targetReagentId: ' reagent-nettles ',
        rememberedReagentIds: [
          ' reagent-marigold ',
          'reagent-nettles',
          'reagent-marigold',
          'unknown-reagent',
          null
        ],
        candidateSelectionReagentId: ' reagent-marigold '
      }
    }));
    const reloaded = migrateSavedRulesState(JSON.parse(JSON.stringify(once)));

    expect(once.pendingForaging).toMatchObject({
      phase: 'choose-reagent',
      targetReagentId: 'reagent-nettles',
      rememberedReagentIds: ['reagent-marigold', 'reagent-nettles'],
      candidateSelectionReagentId: 'reagent-marigold'
    });
    expect(reloaded).toEqual(once);
    expect(reloaded.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('drops invalid Foraging reagent IDs and never carries a draft selection past commitment', () => {
    const source = richSaveAt(CURRENT_SCHEMA_VERSION);
    const committed = migrateSavedRulesState(clone({
      ...source,
      pendingForaging: {
        ...source.pendingForaging,
        phase: 'encounter',
        targetReagentId: 'unknown-target',
        rememberedReagentIds: ['unknown-reagent', 'reagent-nettles', 'reagent-nettles', 42],
        candidateSelectionReagentId: 'reagent-marigold',
        selectedReagentId: ' reagent-nettles '
      }
    }));

    expect(committed.pendingForaging).toMatchObject({
      phase: 'encounter',
      rememberedReagentIds: ['reagent-nettles'],
      selectedReagentId: 'reagent-nettles'
    });
    expect(committed.pendingForaging.targetReagentId).toBeUndefined();
    expect(committed.pendingForaging.candidateSelectionReagentId).toBeUndefined();

    const malformed = migrateSavedRulesState(clone({
      ...source,
      pendingForaging: {
        ...source.pendingForaging,
        rememberedReagentIds: 'reagent-marigold',
        candidateSelectionReagentId: 'not-canonical',
        selectedReagentId: 'not-canonical'
      }
    }));
    expect(malformed.pendingForaging.rememberedReagentIds).toBeUndefined();
    expect(malformed.pendingForaging.candidateSelectionReagentId).toBeUndefined();
    expect(malformed.pendingForaging.selectedReagentId).toBeUndefined();
    expect(migrateSavedRulesState(clone(malformed))).toEqual(malformed);
  });

  it('reconciles the canonical Journey status mirror and preserves an in-progress ending draft', () => {
    const source = richSaveAt(CURRENT_SCHEMA_VERSION);
    const ending = migrateSavedRulesState(clone({
      ...source,
      journeyActive: false,
      journey: { ...source.journey, status: 'active' },
      pendingEnding: {
        journeyId: 'journey-1',
        blockers: [],
        selectedOutcome: 'partial',
        journalText: 'The road almost reached what I hoped for.',
        playerDeclaredGoalComplete: false,
        gmOverride: false,
        updatedAt: 42
      }
    }));

    expect(ending).toMatchObject({
      journeyActive: true,
      journey: { journeyId: 'journey-1', status: 'ending' },
      pendingEnding: {
        journeyId: 'journey-1',
        selectedOutcome: 'partial',
        journalText: 'The road almost reached what I hoped for.',
        playerDeclaredGoalComplete: false,
        updatedAt: 42
      }
    });
    expect(migrateSavedRulesState(clone(ending))).toEqual(ending);

    const terminal = migrateSavedRulesState(clone({
      ...source,
      journeyActive: true,
      journey: { ...source.journey, status: 'completed' },
      pendingEnding: { journeyId: 'journey-1', selectedOutcome: 'failure' }
    }));
    expect(terminal.journeyActive).toBe(false);
    expect(terminal.pendingEnding).toBeNull();
  });

  it('repairs a legacy journey whose cumulative calendar fell behind its current journey day', () => {
    const migrated = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      calendarDays: 2,
      cumulativeDays: 1,
      calendarHistory: ['1일째: 기존 기록', null, 7],
      patients: [],
      routeDraft: { stops: [], edgeKinds: [] }
    });
    expect(migrated).toMatchObject({
      calendarDays: 2,
      cumulativeDays: 2,
      calendarHistory: ['1일째: 기존 기록']
    });
    expect(migrateSavedRulesState(clone(migrated))).toEqual(migrated);
  });

  it('does not reinterpret legacy location names as stable map ids', () => {
    const migrated = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      journeyActive: true,
      journeyOrigin: 'Odoak',
      journeyDestination: 'Fort Bulrush',
      journey: { journeyId: 'legacy-names-only', status: 'active' },
      patients: [],
      routeDraft: { stops: [], edgeKinds: [] }
    });
    expect(migrated.journey).toMatchObject({
      journeyId: 'legacy-names-only',
      originId: '',
      destinationId: ''
    });
    expect(migrated).toMatchObject({ journeyOrigin: 'Odoak', journeyDestination: 'Fort Bulrush' });
  });

  it('recovers partial current-schema arrays, patients, route data, and legacy enum values', () => {
    const migrated = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      currentSeason: 'Fall',
      bag: 'not-an-array',
      patients: [null, {
        name: 'Partial Patient',
        foragingPoints: -4,
        reagentsGathered: null,
        ailments: [{ severity: 'unknown', timerIds: null }],
        timers: [{ current: '3', maximum: '7' }]
      }],
      activePatientId: 'missing-patient',
      routeDraft: {
        stops: [
          null,
          { id: 'a', name: 'A', kind: 'Wilds', terrain: 'Forest', x: -100, y: 999 },
          { id: 'a', name: 'A duplicate', kind: 'Wilds', terrain: 'Forest' },
          { id: 'b', name: 'B', kind: 'Wilds', terrain: 'Loch' }
        ],
        edgeKinds: ['unknown', 'waterway', 'river']
      },
      appliedTransactionIds: 'bad',
      manualConditions: null,
      toolStates: {},
      pendingForaging: { transactionId: 'missing-required-fields' },
      pendingEncounter: { transactionId: 'missing-required-fields' },
      treatmentDraft: {
        patientId: 'legacy-patient-2', ailmentInstanceId: 'legacy-patient-2-ailment-1',
        replacementContext: { kind: 'invalid', targetTag: 'PAIN', requiredPotency: 3 }
      },
      patientArchive: [null, { id: 'legacy-case', outcome: 'failure' }],
      saveRevision: '12.8',
      unknownNonCriticalField: { keep: true }
    });

    expect(migrated.currentSeason).toBe('Autumn');
    expect(migrated.bag).toEqual([]);
    expect(migrated.activePatientId).toBeNull();
    expect(migrated.patients).toHaveLength(1);
    expect(migrated.patients[0]).toMatchObject({
      id: 'legacy-patient-2', name: 'Partial Patient', status: 'active', foragingPoints: 0,
      reagentsGathered: [], conditions: [], treatmentHistory: [], journalEvents: []
    });
    expect(migrated.patients[0].ailments[0]).toMatchObject({
      id: 'legacy-patient-2-ailment-1', severity: 'lesser', timerIds: [], specialState: {}, effectIds: []
    });
    expect(migrated.patients[0].timers[0]).toMatchObject({ current: 3, maximum: 7, status: 'active' });
    expect(migrated.routeDraft.stops.map(stop => stop.id)).toEqual(['a', 'b']);
    expect(migrated.routeDraft.stops[0]).toMatchObject({ x: 0, y: 100 });
    expect(migrated.routeDraft.edgeKinds).toEqual(['waterway']);
    expect(migrated.appliedTransactionIds).toEqual([]);
    expect(migrated.pendingForaging).toBeNull();
    expect(migrated.pendingEncounter).toBeNull();
    expect(migrated.treatmentDraft).toMatchObject({
      patientId: 'legacy-patient-2', ailmentInstanceId: 'legacy-patient-2-ailment-1', replacementContext: null
    });
    expect(migrated.patientArchive).toHaveLength(1);
    expect(migrated.saveRevision).toBe(12);
    expect(migrated.unknownNonCriticalField).toEqual({ keep: true });
  });

  it('remains stable across repeated gameplay mutation, serialization, and reload cycles', () => {
    let state = migrateSavedRulesState(clone(richSaveAt(0)));
    state = migrateSavedRulesState(JSON.parse(JSON.stringify({
      ...state,
      saveRevision: Number(state.saveRevision) + 1,
      bag: [...(state.bag as unknown[]), { id: 'new-resource', name: 'New Resource', type: 'reagent', weight: 1 / 3, usesRemaining: 1 }],
      routeDraft: {
        ...state.routeDraft,
        edgeKinds: ['river', 'waterway', 'path']
      },
      patients: state.patients.map(patient => ({
        ...patient,
        timers: patient.timers.map(timer => ({ ...timer, current: Math.max(0, timer.current - 1) }))
      }))
    })));

    expect((state.bag as Array<{ id?: string }>).some(item => item.id === 'new-resource')).toBe(true);
    expect(state.routeDraft.edgeKinds).toEqual(['river', 'waterway', 'path']);
    expect(state.patients[0].timers[0].current).toBe(3);

    state = migrateSavedRulesState(JSON.parse(JSON.stringify({
      ...state,
      saveRevision: Number(state.saveRevision) + 1,
      currentSeason: 'Winter',
      downtimeRequired: false,
      downtimeCompleted: true,
      appliedTransactionIds: [...state.appliedTransactionIds, 'cycle-2', 'cycle-2']
    })));

    expect(state).toMatchObject({ saveRevision: 29, currentSeason: 'Winter', downtimeRequired: false, downtimeCompleted: true });
    expect(state.appliedTransactionIds.filter(id => id === 'cycle-2')).toHaveLength(1);
  });

  it('preserves and normalizes the persisted p.33 immediate-Remedy checkpoint idempotently', () => {
    const source = richSaveAt(CURRENT_SCHEMA_VERSION);
    const once = migrateSavedRulesState(clone({
      ...source,
      pendingForaging: {
        ...source.pendingForaging,
        phase: 'resolved',
        awaitingImmediateRemedy: true,
        immediateRemedyPatientId: '  patient-1  '
      }
    }));
    const twice = migrateSavedRulesState(clone(once));

    expect(once.pendingForaging).toMatchObject({
      phase: 'resolved',
      awaitingImmediateRemedy: true,
      immediateRemedyPatientId: 'patient-1',
      immediateRemedyAilmentIds: []
    });
    expect(twice).toEqual(once);

    const malformed = migrateSavedRulesState(clone({
      ...source,
      pendingForaging: {
        ...source.pendingForaging,
        phase: 'encounter',
        awaitingImmediateRemedy: true,
        immediateRemedyPatientId: 'patient-1'
      }
    }));
    expect(malformed.pendingForaging).toMatchObject({
      phase: 'encounter',
      awaitingImmediateRemedy: false
    });
    expect(malformed.pendingForaging.immediateRemedyPatientId).toBeUndefined();

    const orphan = migrateSavedRulesState(clone({
      ...source,
      pendingForaging: {
        ...source.pendingForaging,
        phase: 'resolved',
        awaitingImmediateRemedy: true,
        immediateRemedyPatientId: 'missing-patient',
        immediateRemedyAilmentIds: ['missing-ailment']
      }
    }));
    expect(orphan.pendingForaging).toBeNull();
    expect(migrateSavedRulesState(clone(orphan))).toEqual(orphan);

    const orphanBarter = migrateSavedRulesState(clone({
      ...source,
      pendingBarter: {
        barterId: 'barter-orphan',
        patientId: 'missing-patient',
        status: 'completed',
        awaitingImmediateRemedy: true,
        immediateRemedyPatientId: 'missing-patient',
        immediateRemedyAilmentIds: ['missing-ailment']
      }
    }));
    expect(orphanBarter.pendingBarter).toMatchObject({
      barterId: 'barter-orphan',
      status: 'completed',
      awaitingImmediateRemedy: false
    });
    expect(orphanBarter.pendingBarter.immediateRemedyPatientId).toBeUndefined();
    expect(migrateSavedRulesState(clone(orphanBarter))).toEqual(orphanBarter);
  });

  it('keeps only resumable canonical Barter checkpoints and clears unsafe legacy identity', () => {
    const source = richSaveAt(CURRENT_SCHEMA_VERSION);
    const canonicalSocialEncounter = SOCIAL_ENCOUNTERS[0];
    const validPendingBarter = {
      barterId: 'barter-resume',
      patientId: 'patient-1',
      targetReagentId: 'reagent-nettles',
      preparationId: 'nettles-leaves-brewed-1',
      locationId: 'settlement',
      locationType: 'Settlement',
      attemptIndex: 1,
      attemptsRemaining: 0,
      socialEncounter: canonicalSocialEncounter,
      firstCard: { value: 5, suit: '♥' },
      secondCard: { value: 1, suit: '♦' },
      calculatedBR: 3,
      modifiers: [],
      availability: { region: 'Common', season: 'Common' },
      paymentRequired: 2,
      paymentSelection: { trinkets: 0, reputation: 0 },
      status: 'awaiting-payment',
      appliedEffectIds: []
    };
    const valid = migrateSavedRulesState(clone({ ...source, pendingBarter: validPendingBarter }));

    expect(valid.pendingBarter).toMatchObject({
      barterId: 'barter-resume',
      patientId: 'patient-1',
      targetReagentId: 'reagent-nettles',
      preparationId: 'nettles-leaves-brewed-1',
      status: 'awaiting-payment',
      paymentRequired: 2
    });
    expect(migrateSavedRulesState(clone(valid))).toEqual(valid);

    const wrongPreparation = migrateSavedRulesState(clone({
      ...source,
      pendingBarter: { ...validPendingBarter, preparationId: 'roses-rosehips-crushed-3' }
    }));
    expect(wrongPreparation.pendingBarter).toBeNull();

    const emptyNumbers = migrateSavedRulesState(clone({
      ...source,
      pendingBarter: { ...validPendingBarter, calculatedBR: '', paymentRequired: null }
    }));
    expect(emptyNumbers.pendingBarter).toBeNull();

    const mismatchedGap = migrateSavedRulesState(clone({
      ...source,
      pendingBarter: { ...validPendingBarter, paymentRequired: 1 }
    }));
    expect(mismatchedGap.pendingBarter).toBeNull();

    const unknownSocialEncounter = migrateSavedRulesState(clone({
      ...source,
      pendingBarter: { ...validPendingBarter, socialEncounter: { id: 'unknown-social' } }
    }));
    expect(unknownSocialEncounter.pendingBarter).toBeNull();

    const legacyWithoutCanonicalPart = migrateSavedRulesState(clone({
      ...source,
      schemaVersion: 3,
      activeBarter: { phase: 'social', reagentName: 'Nettles' }
    }));
    expect(legacyWithoutCanonicalPart.pendingBarter).toBeNull();
  });

  it('preserves an acquired Barter Part and its canonical provenance through migration and reload', () => {
    const source = richSaveAt(4);
    const acquiredPart = {
      id: 'barter-acquire:nettles-leaves-brewed-1',
      name: '쐐기풀 (Leaves)',
      type: 'reagent',
      canonicalReagentId: 'reagent-nettles',
      preparationId: 'nettles-leaves-brewed-1',
      quantity: 1,
      usesRemaining: 1,
      weight: 1 / 3,
      provenance: {
        acquisitionId: 'barter-acquire:nettles-leaves-brewed-1',
        source: 'barter',
        sourceTransactionId: 'barter-acquire'
      }
    };
    const once = migrateSavedRulesState(clone({
      ...source,
      bag: [...source.bag, acquiredPart]
    }));
    const twice = migrateSavedRulesState(JSON.parse(JSON.stringify(once)));
    const restored = (once.bag as Array<Record<string, unknown>>).find(item => item.id === acquiredPart.id);

    expect(restored).toMatchObject(acquiredPart);
    expect(twice).toEqual(once);
  });

  it('normalizes legacy deferred Encounter condition codes once without losing unrelated state', () => {
    const source = richSaveAt(CURRENT_SCHEMA_VERSION);
    const once = migrateSavedRulesState(clone({
      ...source,
      manualConditions: [
        'typical-summer:next-move-speed-halved',
        'roadtreat:next-forage-two-path-adjacent',
        'chilled-to-the-bone:mountain-forage-timer:3',
        'manual:travel-forest-j-summer:FRESHLY_GRILLED_NEXT_TIMER',
        'manual:unknown:keep-this-condition'
      ]
    }));
    const twice = migrateSavedRulesState(clone(once));

    expect(once.manualConditions).toEqual([
      'manual:travel-forest-9-10-summer:typical-summer:next-move-speed-halved',
      'manual:travel-meadow-3-4:roadtreat:next-forage-two-path-adjacent',
      'manual:foraging-mountain-10-winter:chilled-to-the-bone:mountain-forage-timer:3',
      'manual:travel-forest-j-summer:freshly-grilled:next-ailment-timer:+2',
      'manual:unknown:keep-this-condition'
    ]);
    expect(twice).toEqual(once);
  });

  it('round-trips travel encounter world changes and a committed Unbuckled recovery checkpoint', () => {
    const source = richSaveAt(CURRENT_SCHEMA_VERSION);
    const once = migrateSavedRulesState(clone({
      ...source,
      travelEncounterWorld: {
        locationBlocks: [{
          id: 'murk:loch', kind: 'vicious-murk', locationId: 'loch', activeSeason: 'Summer'
        }, {
          id: 'bad-murk', kind: 'vicious-murk', locationId: '', activeSeason: 'Monsoon'
        }],
        unbuckledCaches: [{
          id: 'cache:one', kind: 'unbuckled-cache', sourceEncounterId: 'travel-soar-5-6',
          locationId: 'origin', rarity: 10, status: 'available',
          items: [{ id: 'dropped-herb', name: 'Dandelions', type: 'reagent', quantity: 1, weight: 1 / 3 }]
        }],
        deferredConversions: [{
          id: 'electrician:ruin', kind: 'electrician-settlement', locationId: 'destination',
          activeSeason: 'Summer', newLocationType: 'Settlement'
        }]
      },
      pendingForaging: {
        ...source.pendingForaging,
        phase: 'encounter',
        selectedReagentId: undefined,
        specialAcquisition: {
          kind: 'unbuckled-cache', cacheId: 'cache:one',
          label: '떨어진 짐 1개 회수 · Dandelions', itemCount: 1
        }
      }
    }));
    const twice = migrateSavedRulesState(JSON.parse(JSON.stringify(once)));

    expect(once.travelEncounterWorld).toEqual({
      locationBlocks: [expect.objectContaining({
        id: 'murk:loch', blocksMovementThrough: true, blocksForaging: true
      })],
      unbuckledCaches: [expect.objectContaining({ id: 'cache:one', status: 'available', rarity: 10 })],
      deferredConversions: [expect.objectContaining({ id: 'electrician:ruin', newLocationType: 'Settlement' })]
    });
    expect(once.pendingForaging).toMatchObject({
      phase: 'encounter',
      specialAcquisition: {
        kind: 'unbuckled-cache', cacheId: 'cache:one',
        label: '떨어진 짐 1개 회수 · Dandelions', itemCount: 1
      }
    });
    expect(twice).toEqual(once);
  });

  it('rejects a future schema instead of silently reinterpreting it as current', () => {
    expect(() => migrateSavedRulesState({ schemaVersion: CURRENT_SCHEMA_VERSION + 1, patients: [] }))
      .toThrow(/newer than supported/);
  });
});
