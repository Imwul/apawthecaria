import { describe, expect, it } from 'vitest';
import { AILMENTS } from './data/ailments';
import { resolvePatient } from './engine';
import {
  reconcileImmediateRemedyCheckpoint,
  releaseImmediateRemedyCheckpoint,
  withImmediateRemedyCheckpoint
} from './immediateRemedyEngine';

describe('p.33/p.35 immediate Remedy checkpoint', () => {
  const createPatient = () => resolvePatient({
    id: 'immediate-remedy-patient',
    name: 'Patient',
    species: 'Mouse',
    ailmentIds: [AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!.id]
  }).value!;

  it('releases only the exact treated Ailment captured by the checkpoint', () => {
    const patient = createPatient();
    const ailmentId = patient.ailments[0].id;
    const checkpoint = withImmediateRemedyCheckpoint({}, patient.id, [ailmentId]);

    expect(releaseImmediateRemedyCheckpoint(checkpoint, patient.id, 'another-ailment')).toEqual(checkpoint);
    expect(releaseImmediateRemedyCheckpoint(checkpoint, 'another-patient', ailmentId)).toEqual(checkpoint);
    expect(releaseImmediateRemedyCheckpoint(checkpoint, patient.id, ailmentId)).toBeNull();
  });

  it('atomically settles the deferred Timer once when the captured Remedy is no longer treatable', () => {
    const patient = createPatient();
    const before = patient.timers.map(timer => timer.current);
    const checkpoint = withImmediateRemedyCheckpoint(
      {},
      patient.id,
      [patient.ailments[0].id]
    );
    const settled = reconcileImmediateRemedyCheckpoint({
      checkpoint: JSON.parse(JSON.stringify(checkpoint)),
      patient,
      inventory: [],
      deferredTimerCost: 2
    });

    expect(settled.checkpoint).toBeNull();
    expect(settled.timerApplied).toBe(true);
    expect(settled.patient?.timers.map(timer => timer.current))
      .toEqual(before.map(value => Math.max(0, value - 2)));

    const repeated = reconcileImmediateRemedyCheckpoint({
      checkpoint: settled.checkpoint,
      patient: settled.patient,
      inventory: [],
      deferredTimerCost: 2
    });
    expect(repeated.timerApplied).toBe(false);
    expect(repeated.patient).toEqual(settled.patient);
  });

  it('clears an orphan without inventing a patient or Timer mutation', () => {
    const checkpoint = withImmediateRemedyCheckpoint(
      {},
      'missing-patient',
      ['missing-ailment']
    );
    const result = reconcileImmediateRemedyCheckpoint({
      checkpoint,
      patient: null,
      inventory: [],
      deferredTimerCost: 1
    });

    expect(result).toEqual({ checkpoint: null, patient: null, timerApplied: false, orphaned: true });
  });
});
