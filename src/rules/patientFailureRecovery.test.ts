import { describe, expect, it } from 'vitest';
import { createPatientArchiveRecord, normalizeLegacyArchiveRecord } from './archiveEngine';
import type { LeaveRuntimeState } from './leaveEngine';
import {
  applyGlobalActiveTimerCost,
  currentTimerRecoveryPatientIds,
  patientHasActiveAilments,
  patientTimerArchiveContext,
  resolveExpiredPatientAfterTimer,
  unsettledExpiredAilmentIds
} from './patientFailureRecovery';
import type { PatientAilmentState, PatientState, PatientTimerState } from './state';

const ailment = (
  id: string,
  status: PatientAilmentState['status'],
  specialState: Record<string, unknown> = {}
): PatientAilmentState => ({
  id,
  ailmentId: 'ailment-whelmed',
  severity: 'lesser',
  timerIds: [`${id}:timer`],
  conditionIds: [],
  treatmentHistoryIds: [],
  status,
  instance: 1,
  repeatIndex: 1,
  specialState,
  successResolved: false,
  failureResolved: false,
  consequenceResolved: false,
  effectIds: []
});

const timer = (
  ailmentInstanceId: string,
  current: number,
  status: PatientTimerState['status']
): PatientTimerState => ({
  id: `${ailmentInstanceId}:timer`,
  ailmentInstanceId,
  current,
  maximum: 2,
  status
});

const patient = (ailments: PatientAilmentState[], timers: PatientTimerState[]): PatientState => ({
  id: 'patient-existing',
  name: 'Moss',
  species: 'Dormouse',
  personality: 'Soft',
  descriptor: 'Befurred',
  status: 'active',
  ailments,
  timers,
  conditions: [],
  treatmentHistory: [],
  journalEvents: []
});

const runtime = (patientState: PatientState, reputation = 12): LeaveRuntimeState => ({
  inventory: [],
  patient: patientState,
  reputation,
  trinkets: 0,
  currentRegion: 'Forest',
  adjacentRegions: [],
  foragingPoints: 0,
  pendingObligation: null,
  journalEvents: [],
  appliedTransactionIds: [],
  activePatientId: patientState.id,
  patientArchive: [],
  archiveContext: {
    location: 'Odoak',
    encounteredAt: 10,
    resolvedAt: 11,
    sourceJourneyId: 'journey-1'
  }
});

describe('expired Patient transaction recovery', () => {
  it('does not replay unreferenced or previous-journey historical Timer failures on reload', () => {
    const expired = ailment('historical', 'failed');
    const historical = { ...patient([expired], [timer(expired.id, 0, 'expired')]), id: 'patient-historical' };
    const current = { ...patient([expired], [timer(expired.id, 0, 'expired')]), id: 'patient-current' };
    const archive = createPatientArchiveRecord({
      caseId: historical.id, patient: historical, location: 'Odoak', encounteredAt: 1,
      sourceJourneyId: 'journey-old', treatmentResult: 'pending'
    });
    expect(currentTimerRecoveryPatientIds({
      patients: [historical, current], patientArchive: [archive],
      workflowPatientIds: [current.id, historical.id], currentJourneyId: 'journey-current', currentLocationName: 'Newdam'
    })).toEqual([current.id]);
    expect(currentTimerRecoveryPatientIds({
      patients: [historical, current], patientArchive: [],
      workflowPatientIds: [current.id], currentJourneyId: 'journey-current', currentLocationName: 'Newdam'
    })).toEqual([current.id]);
  });

  it('excludes terminal Archive mirrors and unscoped records from a different location', () => {
    const expired = ailment('old', 'failed');
    const historical = patient([expired], [timer(expired.id, 0, 'expired')]);
    for (const archive of [
      createPatientArchiveRecord({ caseId: historical.id, patient: historical, location: 'Newdam', encounteredAt: 1, sourceJourneyId: 'journey-current', treatmentResult: 'failure' }),
      createPatientArchiveRecord({ caseId: historical.id, patient: historical, location: 'Odoak', encounteredAt: 1, sourceJourneyId: null, treatmentResult: 'pending' })
    ]) {
      expect(currentTimerRecoveryPatientIds({
        patients: [historical], patientArchive: [archive], workflowPatientIds: [historical.id],
        currentJourneyId: 'journey-current', currentLocationName: 'Newdam'
      })).toEqual([]);
    }
  });

  it('recovers the suspended parent of a current fixed case but not unrelated patients', () => {
    const expired = ailment('expired', 'failed');
    const parent = patient([expired], [timer(expired.id, 0, 'expired')]);
    const fixed = {
      ...patient([ailment('fixed', 'failed', { previousActivePatientId: parent.id })], [timer('fixed', 0, 'expired')]),
      id: 'patient-fixed', status: 'failed' as const
    };
    const historical = { ...parent, id: 'unreferenced-patient' };
    const pendingArchive = createPatientArchiveRecord({
      caseId: fixed.id, patient: fixed, location: 'Newdam', encounteredAt: 1,
      sourceJourneyId: 'journey-current', treatmentResult: 'pending'
    });
    expect(currentTimerRecoveryPatientIds({
      patients: [historical, parent, fixed], patientArchive: [pendingArchive], workflowPatientIds: [fixed.id],
      currentJourneyId: 'journey-current', currentLocationName: 'Newdam'
    })).toEqual([fixed.id, parent.id]);
  });

  it('preserves the original Archive location, reception time and journey while recording expiry', () => {
    const expired = ailment('archive-context', 'failed');
    const originalPatient = patient([expired], [timer(expired.id, 0, 'expired')]);
    const archive = createPatientArchiveRecord({
      caseId: originalPatient.id, patient: originalPatient, location: 'Odoak', encounteredAt: 1,
      sourceJourneyId: 'journey-original', treatmentResult: 'pending'
    });
    const context = patientTimerArchiveContext(originalPatient.id, [archive], {
      location: 'Newdam', encounteredAt: 30, resolvedAt: 40, sourceJourneyId: 'journey-current'
    });
    expect(context).toEqual({ location: 'Odoak', encounteredAt: 1, resolvedAt: 40, sourceJourneyId: 'journey-original' });
    const result = resolveExpiredPatientAfterTimer({
      transactionId: 'preserve-archive',
      state: { ...runtime(originalPatient), patientArchive: [archive], archiveContext: context }
    });
    expect(result.value?.nextState.patientArchive?.[0]).toMatchObject({
      location: 'Odoak', encounteredAt: 1, sourceJourneyId: 'journey-original', treatmentResult: 'failure'
    });
    expect(patientTimerArchiveContext(originalPatient.id, [{ ...archive, sourceJourneyId: null }], {
      location: 'Newdam', encounteredAt: 30, resolvedAt: 40, sourceJourneyId: 'journey-current'
    }).sourceJourneyId).toBeNull();
  });

  it('distinguishes a staged Timer failure from a treated or already settled Ailment', () => {
    const failed = ailment('unsettled', 'failed');
    const treated = ailment('treated', 'treated');
    const settled = { ...ailment('settled', 'failed'), consequenceResolved: true };
    expect(unsettledExpiredAilmentIds(patient(
      [failed, treated, settled],
      [timer(failed.id, 0, 'expired'), timer(treated.id, 0, 'expired'), timer(settled.id, 0, 'expired')]
    ))).toEqual(['unsettled']);
  });

  it('settles failure while preserving a pending Encounter or Delve obligation', () => {
    const failed = ailment('pending-encounter', 'failed');
    const pendingObligation = {
      transactionId: 'scrounge:encounter', kind: 'foraging-encounter' as const,
      region: 'Forest' as const, source: 'forage-current' as const, resolved: false
    };
    const result = resolveExpiredPatientAfterTimer({
      transactionId: 'pending-encounter:timer',
      state: { ...runtime(patient([failed], [timer(failed.id, 0, 'expired')])), pendingObligation }
    });
    expect(result.value?.closed).toBe(true);
    expect(result.value?.nextState).toMatchObject({ reputation: 11, activePatientId: null, pendingObligation });
    expect(result.value?.nextState.patient.ailments[0].consequenceResolved).toBe(true);
    expect(result.value?.nextState.patientArchive?.[0].status).toBe('failed');
    const replay = resolveExpiredPatientAfterTimer({ transactionId: 'pending-encounter:timer', state: result.value!.nextState });
    expect(replay.value?.nextState.reputation).toBe(11);
    expect(replay.value?.nextState.pendingObligation).toEqual(pendingObligation);
  });

  it('applies a global printed Timer cost once and reports every newly expired Patient', () => {
    const firstAilment = ailment('first', 'active');
    const secondAilment = ailment('second', 'active');
    const stableAilment = ailment('stable', 'active');
    const firstPatient = patient(
      [firstAilment, secondAilment],
      [timer(firstAilment.id, 2, 'active'), timer(secondAilment.id, 5, 'active')]
    );
    const secondPatient: PatientState = {
      ...patient([stableAilment], [timer(stableAilment.id, 4, 'active')]),
      id: 'patient-second'
    };

    const first = applyGlobalActiveTimerCost({
      transactionId: 'fire-and-iron:timer-cost',
      patients: [firstPatient, secondPatient],
      appliedTransactionIds: [],
      hours: 2
    });

    expect(first.applied).toBe(true);
    expect(first.expiredPatientIds).toEqual(['patient-existing']);
    expect(first.patients[0].timers.map(row => row.current)).toEqual([0, 3]);
    expect(first.patients[0].ailments.map(row => row.status)).toEqual(['failed', 'active']);
    expect(first.patients[1].timers.map(row => row.current)).toEqual([2]);
    expect(first.appliedTransactionIds).toContain('fire-and-iron:timer-cost');

    const replay = applyGlobalActiveTimerCost({
      transactionId: 'fire-and-iron:timer-cost',
      patients: first.patients,
      appliedTransactionIds: first.appliedTransactionIds,
      hours: 2
    });
    expect(replay.applied).toBe(false);
    expect(replay.expiredPatientIds).toEqual([]);
    expect(replay.patients).toEqual(first.patients);
  });

  it('settles a Fire and Iron expiry consequence exactly once after the global Timer cost', () => {
    const expiring = ailment('fire-expiry', 'active');
    const cost = applyGlobalActiveTimerCost({
      transactionId: 'fire-and-iron:active-timer-cost',
      patients: [patient([expiring], [timer(expiring.id, 2, 'active')])],
      appliedTransactionIds: [],
      hours: 2
    });
    const afterCost = cost.patients[0];

    const first = resolveExpiredPatientAfterTimer({
      transactionId: 'fire-and-iron:timer-expiry:patient-existing',
      state: {
        ...runtime(afterCost),
        appliedTransactionIds: cost.appliedTransactionIds
      }
    });
    expect(first.value?.nextState.reputation).toBe(11);
    expect(first.value?.nextState.patientArchive?.[0].penalty.reputation).toBe(1);
    expect(first.value?.nextState.appliedTransactionIds).toEqual(expect.arrayContaining([
      'fire-and-iron:active-timer-cost',
      'fire-and-iron:timer-expiry:patient-existing:failure',
      'fire-and-iron:timer-expiry:patient-existing:leave'
    ]));

    const replay = resolveExpiredPatientAfterTimer({
      transactionId: 'fire-and-iron:timer-expiry:patient-existing',
      state: first.value!.nextState
    });
    expect(replay.value?.nextState.reputation).toBe(11);
    expect(replay.value?.nextState.patientArchive?.[0].penalty.reputation).toBe(1);
  });

  it('keeps a Patient active while any other Ailment still needs treatment', () => {
    const failed = ailment('expired', 'failed');
    const active = ailment('still-active', 'active');
    expect(patientHasActiveAilments(patient(
      [failed, active],
      [timer(failed.id, 0, 'expired'), timer(active.id, 3, 'active')]
    ))).toBe(true);
    expect(patientHasActiveAilments({
      ...patient([failed], [timer(failed.id, 0, 'expired')]),
      status: 'failed'
    })).toBe(false);
  });

  it('closes a recoverable failed/expired intermediate state instead of leaving an invisible movement blocker', () => {
    const failed = ailment('ordinary', 'failed');
    const result = resolveExpiredPatientAfterTimer({
      transactionId: 'forage:ordinary:timer',
      state: runtime(patient([failed], [timer(failed.id, 0, 'expired')]))
    });

    expect(result.status).toBe('manual');
    expect(result.value).not.toBeNull();
    expect(result.value?.expiredAilmentInstanceIds).toEqual([failed.id]);
    expect(result.value?.closed).toBe(true);
    expect(result.value?.nextState.activePatientId).toBeNull();
    expect(result.value?.nextState.patient).toMatchObject({ status: 'failed' });
    expect(result.value?.nextState.patient.ailments[0]).toMatchObject({
      status: 'failed',
      failureResolved: true,
      consequenceResolved: true
    });
    expect(result.value?.nextState.reputation).toBe(11);
    expect(result.value?.nextState.patientArchive?.[0]).toMatchObject({
      status: 'failed',
      treatmentResult: 'failure',
      failure: true,
      penalty: { reputation: 1, trinkets: 0 }
    });
    expect(result.value?.nextState.journalEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'forage:ordinary:timer:failure:journal',
        authorship: 'system',
        playerMemory: undefined
      }),
      expect.objectContaining({
        id: 'forage:ordinary:timer:leave:journal',
        authorship: 'system',
        playerMemory: undefined
      })
    ]));

    const replay = resolveExpiredPatientAfterTimer({
      transactionId: 'forage:ordinary:timer',
      state: result.value!.nextState
    });
    expect(replay.status).toBe('resolved');
    expect(replay.value?.expiredAilmentInstanceIds).toEqual([]);
    expect(replay.value?.nextState.reputation).toBe(11);
    expect(replay.value?.nextState.patientArchive?.[0].penalty.reputation).toBe(1);
  });

  it('preserves an explicitly supplied failure note as player memory', () => {
    const failed = ailment('remembered', 'failed');
    const memory = '  비가 그친 뒤 조용히 작별했다.\n\n그 문장을 그대로 남긴다.  ';
    const result = resolveExpiredPatientAfterTimer({
      transactionId: 'forage:remembered:timer',
      state: runtime(patient([failed], [timer(failed.id, 0, 'expired')])),
      journalText: memory
    });

    expect(result.value?.nextState.journalEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'forage:remembered:timer:failure:journal',
        text: memory,
        authorship: 'player',
        playerMemory: memory
      })
    ]));
  });

  it('keeps a mixed case active, then preserves the merged encounter patient identity through final Archive reload', () => {
    const original = ailment('original', 'active');
    const branded = ailment('branded', 'failed', {
      encounterPatientName: '낙인찍힌 추방자',
      encounterPatientSpecies: 'Stoat',
      encounterContext: '비밀리에 맡은 환자 · Overstay Your Welcome 전에 해결',
      rewardMode: 'none'
    });
    const first = resolveExpiredPatientAfterTimer({
      transactionId: 'forage:branded:timer',
      state: runtime(patient(
        [original, branded],
        [timer(original.id, 2, 'active'), timer(branded.id, 0, 'expired')]
      ))
    });

    expect(first.value?.closed).toBe(false);
    expect(first.value?.nextState.activePatientId).toBe('patient-existing');
    expect(first.value?.nextState.reputation).toBe(12);
    expect(first.value?.nextState.patientArchive?.[0]).toMatchObject({ status: 'active' });
    expect(first.value?.nextState.patientArchive?.[0].ailments.find(row => row.instanceId === branded.id)).toMatchObject({
      patientName: '낙인찍힌 추방자',
      species: 'Stoat',
      context: '비밀리에 맡은 환자 · Overstay Your Welcome 전에 해결'
    });

    const secondPatient: PatientState = {
      ...first.value!.nextState.patient,
      ailments: first.value!.nextState.patient.ailments.map(row => row.id === original.id
        ? { ...row, status: 'failed', failureResolved: false, consequenceResolved: false }
        : row),
      timers: first.value!.nextState.patient.timers.map(row => row.ailmentInstanceId === original.id
        ? { ...row, current: 0, status: 'expired' }
        : row)
    };
    const second = resolveExpiredPatientAfterTimer({
      transactionId: 'forage:original:timer',
      state: { ...first.value!.nextState, patient: secondPatient }
    });
    expect(second.value?.closed).toBe(true);
    expect(second.value?.nextState.reputation).toBe(11);
    const archived = second.value!.nextState.patientArchive![0];
    expect(archived.status).toBe('failed');
    expect(archived.patientName).toBe('Moss');
    expect(archived.ailments.find(row => row.instanceId === branded.id)).toMatchObject({
      patientName: '낙인찍힌 추방자',
      species: 'Stoat',
      context: '비밀리에 맡은 환자 · Overstay Your Welcome 전에 해결'
    });

    const serialized = JSON.parse(JSON.stringify(archived)) as Record<string, unknown>;
    (serialized.ailments as Array<Record<string, unknown>>).find(row => row.instanceId === branded.id)!.legacyNote = 'keep-me';
    const reloaded = normalizeLegacyArchiveRecord(serialized);
    expect(reloaded.ailments.find(row => row.instanceId === branded.id)).toMatchObject({
      patientName: '낙인찍힌 추방자',
      species: 'Stoat',
      context: '비밀리에 맡은 환자 · Overstay Your Welcome 전에 해결',
      legacyNote: 'keep-me'
    });
  });
});
