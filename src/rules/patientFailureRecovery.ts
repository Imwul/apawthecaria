import { createPatientArchiveRecord, upsertPatientArchive } from './archiveEngine';
import type { TreatmentTransactionState } from './gameplay';
import { resolveLeave, type LeaveRuntimeState } from './leaveEngine';
import type { PatientAilmentState, PatientState } from './state';
import { resolveTreatmentTransaction, type TreatmentAilmentTagOverride } from './treatmentEngine';

export interface ExpiredPatientRecoveryInput {
  transactionId: string;
  state: LeaveRuntimeState;
  ailmentTagOverrides?: readonly TreatmentAilmentTagOverride[];
  journalText?: string;
}

export interface ExpiredPatientRecoveryOutcome {
  nextState: LeaveRuntimeState;
  expiredAilmentInstanceIds: string[];
  failureTransactionId: string | null;
  leaveTransactionId: string | null;
  closed: boolean;
}

export interface ExpiredPatientRecoveryResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: ExpiredPatientRecoveryOutcome | null;
  messages: string[];
}

const hasExpiredTimer = (patient: PatientState, ailment: PatientAilmentState): boolean =>
  ailment.timerIds.some(timerId => {
    const timer = patient.timers.find(row => row.id === timerId);
    return Boolean(timer && (timer.status === 'expired' || timer.current === 0));
  });

/**
 * Completes the existing canonical failure transaction after a Timer mutation.
 *
 * `resolveTimer` intentionally stages an expired Ailment as failed before its
 * printed Consequence is recorded.  Foraging used to persist that intermediate
 * state directly, leaving no active treatment or leave action on screen.  This
 * adapter reuses the same `fail-expired` and `resolveLeave` transactions used by
 * the normal patient clock.  It also accepts recoverable legacy/interrupted
 * states whose expired marker was saved before `failureResolved` was set.
 */
export const resolveExpiredPatientAfterTimer = (
  input: ExpiredPatientRecoveryInput
): ExpiredPatientRecoveryResolution => {
  if (!input.transactionId) {
    return { status: 'invalid', value: null, messages: ['Timer failure recovery requires a transaction ID.'] };
  }

  const expiredAilmentInstanceIds = input.state.patient.ailments
    .filter(ailment => ailment.status !== 'treated'
      && !ailment.consequenceResolved
      && hasExpiredTimer(input.state.patient, ailment))
    .map(ailment => ailment.id);

  if (expiredAilmentInstanceIds.length === 0) {
    return {
      status: 'resolved',
      value: {
        nextState: input.state,
        expiredAilmentInstanceIds: [],
        failureTransactionId: null,
        leaveTransactionId: null,
        closed: input.state.activePatientId === null
      },
      messages: []
    };
  }

  const expiredIds = new Set(expiredAilmentInstanceIds);
  const stagedPatient: PatientState = {
    ...input.state.patient,
    ailments: input.state.patient.ailments.map(ailment => expiredIds.has(ailment.id)
      ? { ...ailment, status: 'failed' as const, failureResolved: true }
      : ailment),
    timers: input.state.patient.timers.map(timer => expiredIds.has(timer.ailmentInstanceId) && timer.current === 0
      ? { ...timer, status: 'expired' as const }
      : timer)
  };
  const failureTransactionId = `${input.transactionId}:failure`;
  const treatmentState: TreatmentTransactionState = {
    inventory: input.state.inventory,
    patient: stagedPatient,
    reputation: input.state.reputation,
    trinkets: input.state.trinkets,
    journalEvents: input.state.journalEvents,
    appliedTransactionIds: input.state.appliedTransactionIds,
    ailmentTagOverrides: [...(input.ailmentTagOverrides || [])]
  };
  const failure = resolveTreatmentTransaction({
    mode: 'fail-expired',
    transactionId: failureTransactionId,
    state: treatmentState,
    ailmentInstanceIds: expiredAilmentInstanceIds,
    journalText: input.journalText?.trim() || '환자 타이머가 만료되어 인쇄된 실패 결과를 적용한다.'
  });
  if (!failure.value) {
    return { status: 'invalid', value: null, messages: failure.messages };
  }

  const penaltyReputation = Math.max(0, input.state.reputation - failure.value.nextState.reputation);
  let nextState: LeaveRuntimeState = {
    ...input.state,
    patient: failure.value.nextState.patient,
    reputation: failure.value.nextState.reputation,
    journalEvents: failure.value.nextState.journalEvents,
    appliedTransactionIds: failure.value.nextState.appliedTransactionIds
  };
  if (nextState.archiveContext) {
    const archive = createPatientArchiveRecord({
      caseId: nextState.patient.id,
      patient: nextState.patient,
      location: nextState.archiveContext.location,
      encounteredAt: nextState.archiveContext.encounteredAt,
      treatedAt: nextState.archiveContext.resolvedAt,
      treatmentResult: 'failure',
      status: nextState.patient.ailments.some(ailment => ailment.status === 'active') ? 'active' : 'failed',
      penalty: { reputation: penaltyReputation },
      specialEffects: ['타이머 만료와 룰북의 질환 실패 결과'],
      journalEntryIds: [`${failureTransactionId}:journal`],
      sourceJourneyId: nextState.archiveContext.sourceJourneyId,
      transactionIds: [failureTransactionId]
    });
    nextState = {
      ...nextState,
      patientArchive: upsertPatientArchive(nextState.patientArchive || [], archive)
    };
  }

  if (nextState.patient.ailments.some(ailment => ailment.status === 'active')) {
    return {
      status: 'manual',
      value: {
        nextState,
        expiredAilmentInstanceIds,
        failureTransactionId,
        leaveTransactionId: null,
        closed: false
      },
      messages: failure.messages
    };
  }

  const leaveTransactionId = `${input.transactionId}:leave`;
  const leave = resolveLeave({
    transactionId: leaveTransactionId,
    state: nextState,
    status: 'failed',
    journalNote: '환자 타이머가 만료되어 인쇄된 실패 결과를 적용하고 환자 기록을 마감했다.'
  });
  if (!leave.value) {
    return { status: 'invalid', value: null, messages: [...failure.messages, ...leave.messages] };
  }
  return {
    status: 'manual',
    value: {
      nextState: leave.value,
      expiredAilmentInstanceIds,
      failureTransactionId,
      leaveTransactionId,
      closed: leave.value.activePatientId === null
    },
    messages: [...failure.messages, ...leave.messages]
  };
};
