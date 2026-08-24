import { describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  migrateSavedRulesState,
  resolvePatient,
  resolveSeason,
  resolveTimer,
  resolveTravel
} from './index';

describe('rule engine foundation entry points', () => {
  it('[TRAVEL-004/TABLE-001/TABLE-005] resolves exactly one encounter family from destination type', () => {
    const wilds = resolveTravel({
      destinationRegion: 'Forest',
      destinationType: 'Wilds',
      card: { val: 3, suit: '♥' },
      season: 'Spring'
    });
    const settlement = resolveTravel({
      destinationRegion: 'Forest',
      destinationType: 'Settlement',
      card: { val: 3, suit: '♥' },
      season: 'Spring'
    });

    expect(wilds.value?.encounterType).toBe('travel');
    expect(settlement.value?.encounterType).toBe('social');
  });

  it('uses only the suit for a Settlement social encounter while the same J card uses the seasonal Travel table in Wilds', () => {
    const card = { val: 11, suit: '♥' as const };
    const settlement = resolveTravel({
      destinationRegion: 'Loch',
      destinationType: 'Settlement',
      card,
      season: 'Spring'
    });
    const wilds = resolveTravel({
      destinationRegion: 'Loch',
      destinationType: 'Wilds',
      card,
      season: 'Spring'
    });

    expect(settlement.value).toMatchObject({
      id: 'social-loch-settlement-♥',
      encounterType: 'social',
      title: expect.stringContaining('Fresh Catch')
    });
    expect(wilds.value).toMatchObject({
      id: 'travel-loch-j-spring',
      encounterType: 'travel',
      choices: expect.arrayContaining([expect.objectContaining({ id: 'race' })])
    });
  });

  it('[AILMENT-004/PATIENT-004] expands repeated ailments into separate ailment and timer records', () => {
    const result = resolvePatient({
      id: 'patient-one',
      name: 'Patient One',
      species: 'Mouse',
      ailmentIds: ['ailment-soured-dough']
    });

    expect(result.status).toBe('resolved');
    expect(result.value?.ailments).toHaveLength(4);
    expect(result.value?.timers).toHaveLength(4);
    expect(new Set(result.value?.timers.map(timer => timer.id)).size).toBe(4);
  });

  it('[PATIENT-005] reduces every active timer without mutating the input patient', () => {
    const patientResult = resolvePatient({
      id: 'patient-two',
      name: 'Patient Two',
      species: 'Hare',
      ailmentIds: ['ailment-fight-marks']
    });
    const patient = patientResult.value!;
    const before = patient.timers.map(timer => timer.current);
    const result = resolveTimer({ patient, hours: 2 });

    expect(result.value?.timers).toHaveLength(2);
    expect(result.value?.timers.map(timer => timer.current)).toEqual(before.map(value => Math.max(0, value - 2)));
    expect(patient.timers.map(timer => timer.current)).toEqual(before);
  });

  it('[JOURNEY-002] advances seasons through the canonical season dataset', () => {
    expect(resolveSeason('Spring').value).toBe('Summer');
    expect(resolveSeason('Winter').value).toBe('Spring');
  });
});

describe('sequential save migration', () => {
  it('[SAVE-005/PATIENT-004] migrates an unversioned single-ailment save without dropping legacy fields', () => {
    const migrated = migrateSavedRulesState({
      reputation: 9,
      customCampaignField: 'preserve',
      activeAilment: {
        id: 'legacy-id',
        name: 'Soured Dough',
        severity: 'intermediate',
        timer: 6,
        maxTimer: 10,
        tags: 'STOMACH 2',
        patientName: 'Baker',
        species: 'Vole'
      }
    });

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.rulesetId).toBe('legacy-campaign');
    expect(migrated.customCampaignField).toBe('preserve');
    expect(migrated.activePatientId).toBe('legacy-active-patient');
    expect(migrated.patients[0]).toMatchObject({ name: 'Baker', species: 'Vole' });
    expect(migrated.patients[0].ailments).toHaveLength(1);
    expect(migrated.patients[0].timers[0]).toMatchObject({ current: 6, maximum: 10 });
  });

  it('[SAVE-005] normalizes already-versioned partial saves once and then remains stable', () => {
    const saved = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      rulesetId: 'original-1e-3p',
      activePatientId: null,
      patients: [],
      custom: 42
    } as const;
    const migrated = migrateSavedRulesState(saved);
    expect(migrated).toMatchObject({
      ...saved,
      routeDraft: { stops: [], edgeKinds: [] },
      currentSeason: 'Spring',
      patientArchive: [],
      saveRevision: 0
    });
    expect(migrateSavedRulesState(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });

  it('[SAVE-005/CORE-002] drops completed manual-effect rows from current-schema blocking state', () => {
    const completedPending = {
      effectId: 'manual:completed-pending',
      status: 'resolved',
      transactionId: 'manual-transaction:pending'
    };
    const completedQueued = {
      effectId: 'manual:completed-queued',
      status: 'overridden',
      transactionId: 'manual-transaction:queued'
    };

    const migrated = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      rulesetId: 'original-1e-3p',
      pendingManualEffect: completedPending,
      manualEffectQueue: [completedQueued]
    });

    expect(migrated.pendingManualEffect).toBeNull();
    expect(migrated.manualEffectQueue).toEqual([]);
    expect(migrateSavedRulesState(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });

  it('[SAVE-004/SAVE-005] migrates and safely restores an in-progress route draft', () => {
    const migrated = migrateSavedRulesState({
      schemaVersion: 8,
      rulesetId: 'original-1e-3p',
      routeDraft: {
        stops: [
          { id: 'odoak', name: 'Odoak', kind: 'City', terrain: 'Forest', hasClinic: false, x: 20, y: 30 },
          { id: 'road', name: 'Road', kind: 'Wilds', terrain: 'Forest', hasClinic: false, x: 30, y: 30 }
        ],
        edgeKinds: ['river', 'invalid-extra']
      }
    });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.routeDraft).toMatchObject({
      stops: [{ id: 'odoak' }, { id: 'road' }],
      edgeKinds: ['river']
    });
  });

  it('[MAP-005/SAVE-004/SAVE-005] migrates v2 gameplay state for idempotent Phase 2 transactions', () => {
    const migrated = migrateSavedRulesState({
      schemaVersion: 2,
      rulesetId: 'original-1e-3p',
      activePatientId: null,
      patients: [],
      visitedLocations: ['Odoak'],
      customMapEdges: [{ from: 'odoak', to: 'oak-road' }],
      custom: 'preserved'
    });
    expect(migrated).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appliedTransactionIds: [],
      appliedEncounterEffectIds: [],
      pendingEncounter: null,
      pendingForaging: null,
      downtimeCompleted: false,
      downtimeRequired: false,
      saveRevision: 0,
      visitedLocations: ['Odoak'],
      customMapEdges: [{ from: 'odoak', to: 'oak-road' }],
      custom: 'preserved'
    });
  });
});
