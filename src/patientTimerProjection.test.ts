import { describe, expect, it } from 'vitest';
import { getPatientTimerProjection, type PatientTimerProjectionState } from './patientTimerProjection';

const state = (): PatientTimerProjectionState => ({
  activePatientId: 'p', activeAilment: { id: 'a', timer: 99 }, patients: [{
    id: 'p', status: 'active', ailments: [
      { id: 'a', status: 'active', timerIds: ['a1', 'a2'] },
      { id: 'b', status: 'active', timerIds: ['b1'] },
      { id: 'old', status: 'treated', timerIds: ['old1'] }
    ], timers: [
      { id: 'a1', ailmentInstanceId: 'a', current: 8, status: 'active' },
      { id: 'a2', ailmentInstanceId: 'a', current: 5, status: 'active' },
      { id: 'b1', ailmentInstanceId: 'b', current: 2, status: 'active' },
      { id: 'old1', ailmentInstanceId: 'old', current: 0, status: 'expired' },
      { id: 'stopped', ailmentInstanceId: 'a', current: 0, status: 'stopped' }
    ]
  }]
});

describe('patient Timer projection', () => {
  it('separates selected ailment time from the earliest live case deadline', () => {
    expect(getPatientTimerProjection(state())).toMatchObject({
      source: 'canonical', shortestHours: 2, selectedHours: 5, hasActiveAilment: true
    });
    expect(getPatientTimerProjection(state()).activeTimers.map(timer => timer.id)).toEqual(['a1', 'a2', 'b1']);
  });
  it('shows zero for an expired active ailment instead of falling back to its legacy value', () => {
    const input = state();
    input.patients![0].timers![2] = { id: 'b1', current: -2, status: 'expired' };
    expect(getPatientTimerProjection(input).shortestHours).toBe(0);
  });
  it('never revives treatment for a terminal canonical patient with a stale legacy mirror', () => {
    const input = state();
    input.patients![0].status = 'cured';
    input.scroungingMode = true;
    input.scroungingTimer = 4;
    expect(getPatientTimerProjection(input)).toMatchObject({
      source: 'canonical', shortestHours: null, selectedHours: null, hasActiveAilment: false, scroungingHours: 4
    });
  });
  it('uses the legacy deadline only when the canonical case is absent', () => {
    expect(getPatientTimerProjection({ activeAilment: { timer: 3 } })).toMatchObject({ source: 'legacy', shortestHours: 3 });
    expect(getPatientTimerProjection({ activeAilment: { timer: NaN } }).shortestHours).toBeNull();
    expect(getPatientTimerProjection({})).toMatchObject({ source: 'none', shortestHours: null });
  });
});
