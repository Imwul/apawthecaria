import { createPatientArchiveRecord, upsertPatientArchive, type CanonicalPatientArchiveRecord } from './archiveEngine';
import { resolveTimer } from './engine';
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

export interface GlobalActiveTimerCostOutcome {
  patients: PatientState[];
  expiredPatientIds: string[];
  appliedTransactionIds: string[];
  applied: boolean;
}

/**
 * Applies a printed cost to every active Patient Timer as one idempotent
 * transaction. Encounter Remedies such as Fire and Iron (p.175) affect the
 * previously active Patient as well as the temporary encounter case, so this
 * cannot safely be expressed as a mutation of only the currently displayed
 * Patient.
 *
 * Consequences are deliberately not resolved here. The caller receives the
 * exact Patient ids with newly expired Ailments and can run the canonical
 * failure/Archive transition for each one.
 */
export const applyGlobalActiveTimerCost = ({
  transactionId,
  patients,
  appliedTransactionIds,
  hours
}: {
  transactionId: string;
  patients: readonly PatientState[];
  appliedTransactionIds: readonly string[];
  hours: number;
}): GlobalActiveTimerCostOutcome => {
  if (!transactionId
    || !Number.isInteger(hours)
    || hours <= 0
    || appliedTransactionIds.includes(transactionId)) {
    return {
      patients: [...patients],
      expiredPatientIds: [],
      appliedTransactionIds: [...appliedTransactionIds],
      applied: false
    };
  }

  const expiredPatientIds: string[] = [];
  const nextPatients = patients.map(patient => {
    const activeBefore = new Set(patient.ailments
      .filter(ailment => ailment.status === 'active')
      .map(ailment => ailment.id));
    if (activeBefore.size === 0 || !patient.timers.some(timer => timer.status === 'active')) return patient;
    const after = resolveTimer({ patient, hours }).value || patient;
    if (after.ailments.some(ailment => activeBefore.has(ailment.id) && ailment.status === 'failed')) {
      expiredPatientIds.push(patient.id);
    }
    return after;
  });

  return {
    patients: nextPatients,
    expiredPatientIds,
    appliedTransactionIds: [...appliedTransactionIds, transactionId],
    applied: true
  };
};

export const patientHasActiveAilments = (patient: PatientState): boolean =>
  patient.status === 'active' && patient.ailments.some(ailment => ailment.status === 'active');

const hasExpiredTimer = (patient: PatientState, ailment: PatientAilmentState): boolean =>
  ailment.timerIds.some(timerId => {
    const timer = patient.timers.find(row => row.id === timerId);
    return Boolean(timer && (timer.status === 'expired' || timer.current === 0));
  });

export const unsettledExpiredAilmentIds = (patient: PatientState): string[] =>
  patient.ailments
    .filter(ailment => ailment.status !== 'treated'
      && !ailment.consequenceResolved
      && hasExpiredTimer(patient, ailment))
    .map(ailment => ailment.id);

/** An old unfinished marker is not authority to replay historical failures
 * against today's Reputation, local-care gate or quest. Recover only patients
 * owned by the current workflow, including the suspended parent of a fixed
 * encounter Remedy. A terminal Archive is historical even if its old Patient
 * mirror still says active or lacks consequenceResolved. */
export const currentTimerRecoveryPatientIds = (input: {
  patients: readonly PatientState[];
  patientArchive: readonly CanonicalPatientArchiveRecord[];
  workflowPatientIds: readonly (string | null | undefined)[];
  currentJourneyId: string | null;
  currentLocationName: string;
}): string[] => {
  const patientById = new Map(input.patients.map(patient => [patient.id, patient]));
  const queue = input.workflowPatientIds.filter((id): id is string => Boolean(id));
  const visited = new Set<string>();
  const eligible: string[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index];
    if (visited.has(id)) continue;
    visited.add(id);
    const patient = patientById.get(id);
    if (!patient || patient.status === 'cured' || patient.status === 'departed') continue;
    const archive = input.patientArchive.find(row => row.caseId === id || row.patientId === id);
    if (archive && ((['treated', 'failed', 'abandoned'].includes(archive.status) && archive.treatmentResult !== 'pending')
      || (archive.sourceJourneyId && archive.sourceJourneyId !== input.currentJourneyId)
      || (!archive.sourceJourneyId && archive.location && archive.location !== input.currentLocationName))) continue;
    eligible.push(id);
    patient.ailments.forEach(ailment => {
      const parentId = ailment.specialState?.previousActivePatientId;
      if (typeof parentId === 'string' && parentId) queue.push(parentId);
    });
  }
  return eligible;
};

export const patientTimerArchiveContext = (
  patientId: string,
  patientArchive: readonly CanonicalPatientArchiveRecord[],
  fallback: NonNullable<LeaveRuntimeState['archiveContext']>
): NonNullable<LeaveRuntimeState['archiveContext']> => {
  const archive = patientArchive.find(row => row.caseId === patientId || row.patientId === patientId);
  return archive
    ? {
      ...fallback,
      location: archive.location || fallback.location,
      encounteredAt: archive.encounteredAt,
      sourceJourneyId: archive.sourceJourneyId
    }
    : fallback;
};

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

  const expiredAilmentInstanceIds = unsettledExpiredAilmentIds(input.state.patient);

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
  const playerFailureMemory = input.journalText?.trim() ? input.journalText : undefined;
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
    journalText: playerFailureMemory || '환자 타이머가 만료되어 인쇄된 실패 결과를 적용했습니다.',
    journalAuthorship: playerFailureMemory ? 'player' : 'system'
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
  // A Timer can expire inside the Scrounging/Encounter obligation itself.
  // Close the failed case now without either skipping that scene or letting
  // its movement gate discard the already-computed failure transaction.
  const pendingObligation = nextState.pendingObligation;
  const leave = resolveLeave({
    transactionId: leaveTransactionId,
    state: { ...nextState, pendingObligation: null },
    status: 'failed',
    journalNote: '환자 타이머가 만료되어 인쇄된 실패 결과를 적용하고 환자 기록을 마감했습니다.',
    journalAuthorship: 'system'
  });
  if (!leave.value) {
    return { status: 'invalid', value: null, messages: [...failure.messages, ...leave.messages] };
  }
  return {
    status: 'manual',
    value: {
      nextState: pendingObligation && !pendingObligation.resolved
        ? { ...leave.value, pendingObligation }
        : leave.value,
      expiredAilmentInstanceIds,
      failureTransactionId,
      leaveTransactionId,
      closed: leave.value.activePatientId === null
    },
    messages: [...failure.messages, ...leave.messages]
  };
};
