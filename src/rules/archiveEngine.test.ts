import { describe, expect, it } from 'vitest';
import { createPatientArchiveRecord, derivePatientArchiveTimer, normalizeLegacyArchiveRecord } from './archiveEngine';
import type { PatientState } from './state';

const activePatient = (current: number): PatientState => ({
  id: 'patient-1',
  name: 'Rowan',
  species: 'Mouse',
  status: 'active',
  ailments: [{
    id: 'ailment-1',
    ailmentId: 'ailment-paw-rot',
    severity: 'lesser',
    timerIds: ['timer-1'],
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
  timers: [{ id: 'timer-1', ailmentInstanceId: 'ailment-1', current, maximum: 11, status: 'active' }],
  conditions: [],
  treatmentHistory: [],
  journalEvents: []
});

describe('Patient Archive Timer presentation', () => {
  it('uses the matching live Patient Timer instead of the stale active Archive snapshot', () => {
    const record = createPatientArchiveRecord({
      caseId: 'patient-1',
      patient: activePatient(11),
      location: 'Obridge',
      encounteredAt: 1,
      treatmentResult: 'pending'
    });

    expect(derivePatientArchiveTimer(record, activePatient(10))).toBe(10);
  });

  it('falls back to the Archive snapshot when no live Patient exists', () => {
    const record = createPatientArchiveRecord({
      caseId: 'patient-1',
      patient: activePatient(11),
      location: 'Obridge',
      encounteredAt: 1,
      treatmentResult: 'pending'
    });

    expect(derivePatientArchiveTimer(record, null)).toBe(11);
  });

  it('keeps the same live-first derivation after a serialization round trip', () => {
    const record = createPatientArchiveRecord({
      caseId: 'patient-1',
      patient: activePatient(11),
      location: 'Obridge',
      encounteredAt: 1,
      treatmentResult: 'pending'
    });
    const reloaded = JSON.parse(JSON.stringify({ record, patient: activePatient(10) })) as {
      record: typeof record;
      patient: PatientState;
    };

    expect(derivePatientArchiveTimer(reloaded.record, reloaded.patient)).toBe(10);
  });

  it('keeps historical records on their Archive snapshot even if a matching Patient object remains', () => {
    const record = createPatientArchiveRecord({
      caseId: 'patient-1',
      patient: { ...activePatient(11), status: 'cured' },
      location: 'Obridge',
      encounteredAt: 1,
      treatedAt: 2,
      treatmentResult: 'success'
    });

    expect(derivePatientArchiveTimer(record, activePatient(10))).toBe(11);
  });

  it('does not let a stale cured live Patient replace an active Archive snapshot', () => {
    const record = createPatientArchiveRecord({
      caseId: 'patient-1',
      patient: activePatient(11),
      location: 'Obridge',
      encounteredAt: 1,
      treatmentResult: 'pending'
    });
    const staleCuredPatient: PatientState = {
      ...activePatient(10),
      status: 'cured',
      timers: [{ ...activePatient(10).timers[0], status: 'stopped' }]
    };

    expect(derivePatientArchiveTimer(record, staleCuredPatient)).toBe(11);
  });

  it('preserves a legacy record id as both case and Patient identity for live Timer lookup', () => {
    const normalized = normalizeLegacyArchiveRecord({
      id: 'patient-1',
      status: 'active',
      timers: [{ timerId: 'timer-1', current: 11, maximum: 11, status: 'active' }]
    });

    expect(normalized).toMatchObject({ caseId: 'patient-1', patientId: 'patient-1', status: 'active' });
    expect(derivePatientArchiveTimer(normalized, activePatient(10))).toBe(10);
  });

  it('prefers a legacy source Patient id over a distinct Archive record id', () => {
    const normalized = normalizeLegacyArchiveRecord({
      id: 'archive-row-1',
      sourceId: 'patient-1',
      status: 'active',
      timers: [{ timerId: 'timer-1', current: 11, maximum: 11, status: 'active' }]
    });

    expect(normalized).toMatchObject({ caseId: 'archive-row-1', patientId: 'patient-1', status: 'active' });
    expect(derivePatientArchiveTimer(normalized, activePatient(10))).toBe(10);
  });
});
