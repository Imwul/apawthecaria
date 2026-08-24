import type { EngineInventoryItem } from './gameplay';
import { resolveTimer } from './engine';
import type { PatientState } from './state';
import { canTreatAilmentWithInventory, type TreatmentAilmentTagOverride } from './treatmentEngine';
import type { CanonicalToolState } from './toolEngine';

/** Minimal persisted shape shared by the p.33 Foraging and p.35 Bartering
 * checkpoints. The owning transaction remains on PendingForaging/PendingBarter. */
export interface ImmediateRemedyCheckpointState {
  awaitingImmediateRemedy?: boolean;
  immediateRemedyPatientId?: string;
  immediateRemedyAilmentIds?: string[];
}

export const immediatelyTreatableAilmentIds = (
  patient: PatientState,
  inventory: readonly EngineInventoryItem[],
  overrides: readonly TreatmentAilmentTagOverride[] = [],
  availableToolIds: readonly string[] = [],
  toolStates: readonly CanonicalToolState[] = []
): string[] => patient.ailments
  .filter(ailment => ailment.status === 'active'
    && canTreatAilmentWithInventory(patient, ailment.id, inventory, overrides, availableToolIds, toolStates))
  .map(ailment => ailment.id);

export const isAwaitingImmediateRemedy = (
  checkpoint: ImmediateRemedyCheckpointState | null | undefined
): boolean => checkpoint?.awaitingImmediateRemedy === true;

export const withImmediateRemedyCheckpoint = <T extends ImmediateRemedyCheckpointState>(
  checkpoint: T,
  patientId: string,
  ailmentIds: readonly string[]
): T => ({
  ...checkpoint,
  awaitingImmediateRemedy: true,
  immediateRemedyPatientId: patientId,
  immediateRemedyAilmentIds: [...new Set(ailmentIds)]
});

export const withoutImmediateRemedyCheckpoint = <T extends ImmediateRemedyCheckpointState>(
  checkpoint: T
): T => {
  const {
    awaitingImmediateRemedy: _awaitingImmediateRemedy,
    immediateRemedyPatientId: _immediateRemedyPatientId,
    immediateRemedyAilmentIds: _immediateRemedyAilmentIds,
    ...rest
  } = checkpoint;
  return rest as T;
};

/** A Remedy releases only the exact Ailment instance captured at the p.33/p.35
 * checkpoint. Patient-level matching alone is insufficient for multi-Ailment cases. */
export const releaseImmediateRemedyCheckpoint = <T extends ImmediateRemedyCheckpointState>(
  checkpoint: T | null | undefined,
  patientId: string,
  treatedAilmentId: string
): T | null => {
  if (!checkpoint) return null;
  if (!isAwaitingImmediateRemedy(checkpoint)) return checkpoint;
  const exactAilmentIds = Array.isArray(checkpoint.immediateRemedyAilmentIds)
    ? checkpoint.immediateRemedyAilmentIds
    : [];
  return checkpoint.immediateRemedyPatientId === patientId && exactAilmentIds.includes(treatedAilmentId)
    ? null
    : checkpoint;
};

export interface ImmediateRemedyReconciliation<T extends ImmediateRemedyCheckpointState> {
  checkpoint: T | null;
  patient: PatientState | null;
  timerApplied: boolean;
  orphaned: boolean;
}

/** Revalidates a persisted checkpoint against the latest canonical Bag/Tool
 * state. If the captured Remedy can no longer be created, the deferred p.33 or
 * p.35 Timer cost is applied once and the owning checkpoint is cleared. */
export const reconcileImmediateRemedyCheckpoint = <T extends ImmediateRemedyCheckpointState>({
  checkpoint,
  patient,
  inventory,
  ailmentTagOverrides = [],
  availableToolIds = [],
  toolStates = [],
  deferredTimerCost
}: {
  checkpoint: T | null | undefined;
  patient: PatientState | null;
  inventory: readonly EngineInventoryItem[];
  ailmentTagOverrides?: readonly TreatmentAilmentTagOverride[];
  availableToolIds?: readonly string[];
  toolStates?: readonly CanonicalToolState[];
  deferredTimerCost: number;
}): ImmediateRemedyReconciliation<T> => {
  if (!checkpoint || !isAwaitingImmediateRemedy(checkpoint)) {
    return { checkpoint: checkpoint || null, patient, timerApplied: false, orphaned: false };
  }
  if (!patient || checkpoint.immediateRemedyPatientId !== patient.id) {
    return { checkpoint: null, patient, timerApplied: false, orphaned: true };
  }
  const treatableNow = immediatelyTreatableAilmentIds(
    patient,
    inventory,
    ailmentTagOverrides,
    availableToolIds,
    toolStates
  );
  const captured = Array.isArray(checkpoint.immediateRemedyAilmentIds)
    ? [...new Set(checkpoint.immediateRemedyAilmentIds)]
    : [];
  const stillTreatable = captured.filter(id => treatableNow.includes(id));
  if (stillTreatable.length > 0) {
    return {
      checkpoint: withImmediateRemedyCheckpoint(checkpoint, patient.id, stillTreatable),
      patient,
      timerApplied: false,
      orphaned: false
    };
  }
  const timerCost = Math.max(0, Number(deferredTimerCost) || 0);
  const patientAfterTimer = timerCost > 0
    ? resolveTimer({ patient, hours: timerCost }).value || patient
    : patient;
  return {
    checkpoint: null,
    patient: patientAfterTimer,
    timerApplied: timerCost > 0,
    orphaned: false
  };
};
