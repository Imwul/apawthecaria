import {
  immediatelyTreatableAilmentIds,
  isAwaitingImmediateRemedy as isAwaitingImmediateRemedyCheckpoint,
  releaseImmediateRemedyCheckpoint as releaseImmediateRemedyCheckpointRule,
  resolveTimer,
  withImmediateRemedyCheckpoint,
  withoutImmediateRemedyCheckpoint,
  type AilmentTagOverride,
  type CanonicalToolState,
  type EngineInventoryItem,
  type ManualEffectDraft,
  type PendingForagingState,
  type PatientState
} from './rules';

export interface ForagingPostEncounterResolution {
  patient: PatientState | null;
  immediatelyTreatable: boolean;
  immediatelyTreatableAilmentIds: string[];
  timerApplied: boolean;
  waitingForManualEffect: boolean;
}

/**
 * Rulebook p.33 checkpoint shared by automatic and manual encounter endings.
 * Manual printed effects are still part of the encounter, so neither the
 * immediate-Remedy check nor the Timer decrease happens until they finish.
 */
export const resolveForagingPostEncounterCheckpoint = ({
  patient,
  inventory,
  ailmentTagOverrides = [],
  availableToolIds = [],
  toolStates = [],
  timerCost,
  manualEffectPending
}: {
  patient: PatientState | null;
  inventory: readonly EngineInventoryItem[];
  ailmentTagOverrides?: readonly AilmentTagOverride[];
  availableToolIds?: readonly string[];
  toolStates?: readonly CanonicalToolState[];
  timerCost: number;
  manualEffectPending: boolean;
}): ForagingPostEncounterResolution => {
  if (manualEffectPending) {
    return {
      patient,
      immediatelyTreatable: false,
      immediatelyTreatableAilmentIds: [],
      timerApplied: false,
      waitingForManualEffect: true
    };
  }
  if (!patient) {
    return {
      patient: null,
      immediatelyTreatable: false,
      immediatelyTreatableAilmentIds: [],
      timerApplied: false,
      waitingForManualEffect: false
    };
  }
  const treatableAilmentIds = immediatelyTreatableAilmentIds(
    patient,
    inventory,
    ailmentTagOverrides,
    availableToolIds,
    toolStates
  );
  const immediatelyTreatable = treatableAilmentIds.length > 0;
  if (immediatelyTreatable || timerCost <= 0) {
    return {
      patient,
      immediatelyTreatable,
      immediatelyTreatableAilmentIds: treatableAilmentIds,
      timerApplied: false,
      waitingForManualEffect: false
    };
  }
  const resolved = resolveTimer({ patient, hours: timerCost }).value || patient;
  return {
    patient: resolved,
    immediatelyTreatable: false,
    immediatelyTreatableAilmentIds: [],
    timerApplied: true,
    waitingForManualEffect: false
  };
};

/**
 * Persist the unfinished portion of the p.33 checkpoint. A printed manual
 * effect still owns the encounter until it is resolved; after that, a complete
 * Remedy owns the checkpoint until the matching patient receives a Remedy.
 */
export const pendingForagingAfterEncounterCheckpoint = (
  pending: PendingForagingState,
  resolution: ForagingPostEncounterResolution
): PendingForagingState | null => {
  if (resolution.waitingForManualEffect) {
    return withoutImmediateRemedyCheckpoint({
      ...pending,
      phase: 'resolved'
    });
  }
  if (!resolution.immediatelyTreatable || !resolution.patient) return null;
  return withImmediateRemedyCheckpoint({
    ...pending,
    phase: 'resolved'
  }, resolution.patient.id, resolution.immediatelyTreatableAilmentIds);
};

export const isAwaitingImmediateRemedy = (
  pending: PendingForagingState | null | undefined
): boolean => Boolean(pending?.phase === 'resolved' && isAwaitingImmediateRemedyCheckpoint(pending));

/** Release only the checkpoint belonging to the Remedy's patient. */
export const releaseImmediateRemedyCheckpoint = (
  pending: PendingForagingState | null | undefined,
  patientId: string,
  treatedAilmentId: string
): PendingForagingState | null => releaseImmediateRemedyCheckpointRule(
  pending,
  patientId,
  treatedAilmentId
);

/** A manual result may resume only the Foraging transaction that created it. */
export const manualForagingCheckpointMatchesDraft = (
  pending: PendingForagingState | null | undefined,
  draft: ManualEffectDraft | null | undefined
): boolean => Boolean(
  pending?.phase === 'resolved'
  && draft
  && !draft.transactionId
  && (draft.status === 'manual' || draft.status === 'deferred')
  && draft.context.continuation === 'foraging'
  && draft.context.encounterTransactionId === `${pending.transactionId}:encounter`
);

export const hasPendingManualForagingCheckpoint = (
  pending: PendingForagingState | null | undefined,
  drafts: readonly ManualEffectDraft[]
): boolean => Boolean(
  pending?.phase === 'resolved'
  && !isAwaitingImmediateRemedy(pending)
  && drafts.some(draft => manualForagingCheckpointMatchesDraft(pending, draft))
);

/** Fields that a Foraging transaction can mutate before the player is able to
 * choose “start this forage over”. Static route/map-edge data is deliberately
 * excluded; mutable Barrow location markers are retained for exact recovery. */
export const FORAGING_ROLLBACK_FIELDS = [
  'bio',
  'bag',
  'patients',
  'activeAilment',
  'activeAilments',
  'activePatientId',
  'patientArchive',
  'pendingPatientArchive',
  'worldAlmanac',
  'travelScrapbook',
  'trinketArchive',
  'reputation',
  'trinkets',
  'calendarDays',
  'calendarHistory',
  'cumulativeDays',
  'toolStates',
  'manualConditions',
  'appliedTransactionIds',
  'appliedEncounterEffectIds',
  'journey',
  'journeyActive',
  'pendingEnding',
  'journeyGoalCounter',
  'journeyGoalChecklist',
  'barrows',
  'activeDelve',
  'pursuedByBehemoth',
  'nextMoveSpeedOverride',
  'companionStates',
  'pendingAlternativeAcquisition',
  'pendingLeaveObligation',
  'scroungingMode',
  'scroungingTimer',
  'independentUsedThisAilment',
  'lastForageCardValue',
  'manualEffectQueue',
  'pendingManualEffect',
  'manualEffectDraft',
  'manualEffectRecords',
  'pendingManualFollowUps',
  'needsLocalHelpBeforeMove',
  'currentLocationName',
  'currentMapLocationId',
  'currentLocationType',
  'currentRegion',
  'customMapLocations'
] as const;

export type ForagingRollbackField = typeof FORAGING_ROLLBACK_FIELDS[number];

interface SerializedFieldValue {
  present: boolean;
  value?: unknown;
}

export interface SerializedForagingRollbackSnapshot {
  version: 1;
  transactionId: string;
  fields: Partial<Record<ForagingRollbackField, SerializedFieldValue>>;
  journalIds: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value)
  && typeof value === 'object'
  && !Array.isArray(value);

export const createSerializedForagingRollbackSnapshot = (
  transactionId: string,
  state: Record<string, unknown>
): SerializedForagingRollbackSnapshot => ({
  version: 1,
  transactionId,
  fields: Object.fromEntries(FORAGING_ROLLBACK_FIELDS.map(field => [field,
    Object.prototype.hasOwnProperty.call(state, field)
      ? { present: true, value: structuredClone(state[field]) }
      : { present: false }
  ])) as SerializedForagingRollbackSnapshot['fields'],
  journalIds: Array.isArray(state.journals)
    ? state.journals.flatMap(row => isRecord(row) && typeof row.id === 'string' ? [row.id] : [])
    : []
});

/**
 * Decode only the allow-listed fields from an interrupted-save checkpoint.
 * Explicit `present: false` entries survive JSON round trips and restore an
 * optional field to `undefined` rather than silently retaining later state.
 */
export const readSerializedForagingRollbackSnapshot = (
  value: unknown,
  transactionId: string
): { patch: Partial<Record<ForagingRollbackField, unknown>>; journalIds: string[] } | null => {
  if (!isRecord(value)
    || value.version !== 1
    || value.transactionId !== transactionId
    || !isRecord(value.fields)
    || !Array.isArray(value.journalIds)
    || !value.journalIds.every(id => typeof id === 'string')) return null;
  const patch: Partial<Record<ForagingRollbackField, unknown>> = {};
  for (const field of FORAGING_ROLLBACK_FIELDS) {
    const entry = value.fields[field];
    // New checkpoints always contain every allow-listed field, including an
    // explicit marker for absent optional state. A partial payload is treated
    // as legacy/malformed so the caller can use its conservative inverse
    // fallback instead of silently restoring only half of an action.
    if (!isRecord(entry) || typeof entry.present !== 'boolean') return null;
    patch[field] = entry.present ? structuredClone(entry.value) : undefined;
  }
  return { patch, journalIds: [...value.journalIds] };
};

export const restoreSerializedForagingRollbackState = <T extends Record<string, unknown>>(
  current: T,
  value: unknown,
  transactionId: string
): T | null => {
  const decoded = readSerializedForagingRollbackSnapshot(value, transactionId);
  if (!decoded) return null;
  const journalIds = new Set(decoded.journalIds);
  const journals = Array.isArray(current.journals)
    ? current.journals.filter(row => isRecord(row) && typeof row.id === 'string' && journalIds.has(row.id))
    : [];
  return {
    ...current,
    ...decoded.patch,
    journals,
    pendingForaging: null
  } as T;
};
