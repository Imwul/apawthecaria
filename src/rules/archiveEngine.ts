import type { PatientState } from './state';

export type PatientArchiveStatus = 'encountered' | 'active' | 'treated' | 'failed' | 'abandoned' | 'unresolved';

export interface CanonicalPatientArchiveRecord {
  caseId: string;
  patientId: string;
  patientName?: string;
  personality: string;
  descriptor: string;
  location: string;
  encounteredAt: number;
  treatedAt: number | null;
  ailments: Array<{
    instanceId: string;
    ailmentId: string | null;
    severity: string;
    status: string;
    effectIds: string[];
    /** Per-Ailment identity for encounter patients merged into an existing case. */
    patientName?: string;
    species?: string;
    context?: string;
  }>;
  timers: Array<{ timerId: string; current: number; maximum: number; status: string }>;
  remedyParts: string[];
  treatmentResult: 'success' | 'failure' | 'abandoned' | 'pending' | 'none';
  success: boolean;
  failure: boolean;
  reward: { trinkets: number; reputation: number };
  penalty: { trinkets: number; reputation: number };
  specialEffects: string[];
  journalEntryIds: string[];
  status: PatientArchiveStatus;
  sourceJourneyId: string | null;
  transactionIds: string[];
}

export interface ArchiveInput {
  caseId: string;
  patient: PatientState;
  location: string;
  encounteredAt: number;
  treatedAt?: number | null;
  remedyParts?: string[];
  treatmentResult?: CanonicalPatientArchiveRecord['treatmentResult'];
  reward?: Partial<CanonicalPatientArchiveRecord['reward']>;
  penalty?: Partial<CanonicalPatientArchiveRecord['penalty']>;
  specialEffects?: string[];
  journalEntryIds?: string[];
  sourceJourneyId?: string | null;
  transactionIds?: string[];
  status?: PatientArchiveStatus;
}

const minimumTimer = (timers: ReadonlyArray<{ current: number }>): number | null => {
  const values = timers.map(timer => timer.current).filter(Number.isFinite);
  return values.length > 0 ? Math.min(...values) : null;
};

/**
 * Active cases read their Timer from the canonical live Patient. Archive
 * timers are immutable historical snapshots and are only a fallback when the
 * case is historical or no matching live Patient remains.
 */
export const derivePatientArchiveTimer = (
  record: CanonicalPatientArchiveRecord,
  livePatient?: PatientState | null
): number | null => {
  const matchingActivePatient = record.status === 'active'
    && livePatient?.id === record.patientId
    && livePatient.status === 'active'
    ? livePatient
    : null;
  if (matchingActivePatient) {
    return minimumTimer(matchingActivePatient.timers.filter(timer => timer.status === 'active'));
  }
  return minimumTimer(record.timers);
};

const deriveStatus = (patient: PatientState, result: CanonicalPatientArchiveRecord['treatmentResult']): PatientArchiveStatus => {
  if (result === 'success' || patient.status === 'cured') return 'treated';
  if (result === 'failure' || patient.status === 'failed') return 'failed';
  if (result === 'abandoned' || patient.status === 'departed') return 'abandoned';
  if (patient.status === 'active') return patient.ailments.some(ailment => ailment.status === 'active') ? 'active' : 'unresolved';
  return 'encountered';
};

export const createPatientArchiveRecord = (input: ArchiveInput): CanonicalPatientArchiveRecord => {
  const treatmentResult = input.treatmentResult || 'none';
  const status = input.status || deriveStatus(input.patient, treatmentResult);
  const success = status === 'treated' && treatmentResult === 'success';
  const failure = status === 'failed' && treatmentResult === 'failure';
  return {
    caseId: input.caseId,
    patientId: input.patient.id,
    patientName: input.patient.name,
    personality: input.patient.personality || '',
    descriptor: input.patient.descriptor || input.patient.species || '',
    location: input.location,
    encounteredAt: input.encounteredAt,
    treatedAt: input.treatedAt ?? null,
    ailments: input.patient.ailments.map(ailment => ({
      instanceId: ailment.id,
      ailmentId: ailment.ailmentId,
      severity: ailment.severity,
      status: ailment.status,
      effectIds: [...ailment.effectIds],
      ...(typeof ailment.specialState?.encounterPatientName === 'string'
        && ailment.specialState.encounterPatientName.trim()
        ? { patientName: ailment.specialState.encounterPatientName.trim() }
        : {}),
      ...(typeof ailment.specialState?.encounterPatientSpecies === 'string'
        && ailment.specialState.encounterPatientSpecies.trim()
        ? { species: ailment.specialState.encounterPatientSpecies.trim() }
        : {}),
      ...(typeof ailment.specialState?.encounterContext === 'string'
        && ailment.specialState.encounterContext.trim()
        ? { context: ailment.specialState.encounterContext.trim() }
        : {})
    })),
    timers: input.patient.timers.map(timer => ({ timerId: timer.id, current: timer.current, maximum: timer.maximum, status: timer.status })),
    remedyParts: [...(input.remedyParts || [])],
    treatmentResult,
    success,
    failure,
    reward: { trinkets: input.reward?.trinkets || 0, reputation: input.reward?.reputation || 0 },
    penalty: { trinkets: input.penalty?.trinkets || 0, reputation: input.penalty?.reputation || 0 },
    specialEffects: [...(input.specialEffects || [])],
    journalEntryIds: [...(input.journalEntryIds || [])],
    status,
    sourceJourneyId: input.sourceJourneyId || null,
    transactionIds: [...(input.transactionIds || [])]
  };
};

type LegacyArchiveRecord = Record<string, unknown>;

const normalizeLegacyStatus = (legacy: LegacyArchiveRecord): PatientArchiveStatus => {
  const raw = String(legacy.status || legacy.outcome || '').toLowerCase();
  if (raw === 'success' || raw === 'treated' || raw === 'cured') return 'treated';
  if (raw === 'failure' || raw === 'failed') return 'failed';
  if (raw === 'abandoned' || raw === 'departed' || raw === 'left') return 'abandoned';
  if (raw === 'active') return 'active';
  if (raw === 'encountered') return 'encountered';
  return 'unresolved';
};

export const normalizeLegacyArchiveRecord = (legacy: LegacyArchiveRecord): CanonicalPatientArchiveRecord => {
  const status = normalizeLegacyStatus(legacy);
  const explicitOutcome = String(legacy.outcome || legacy.treatmentResult || '').toLowerCase();
  const treatmentResult: CanonicalPatientArchiveRecord['treatmentResult'] = explicitOutcome === 'success'
    ? 'success'
    : explicitOutcome === 'failure'
      ? 'failure'
      : status === 'abandoned'
        ? 'abandoned'
        : status === 'active' || status === 'unresolved'
          ? 'pending'
          : 'none';
  return {
    caseId: String(legacy.caseId || legacy.id || legacy.sourceId || 'legacy-case'),
    // `id` is often the archive/case identity in older saves, while
    // `sourceId` points back to the live Patient. Preserve that relationship
    // whenever both are present; id-only saves still retain their identity.
    patientId: String(legacy.patientId || legacy.sourceId || legacy.id || 'legacy-patient'),
    patientName: String(legacy.patientName || legacy.name || ''),
    personality: String(legacy.personality || ''),
    descriptor: String(legacy.descriptor || legacy.species || ''),
    location: String(legacy.location || legacy.locationName || ''),
    encounteredAt: Number(legacy.encounteredAt || legacy.timestamp || 0),
    treatedAt: legacy.treatedAt === null || legacy.treatedAt === undefined ? null : Number(legacy.treatedAt),
    ailments: Array.isArray(legacy.ailments) ? legacy.ailments.flatMap((value, index) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
      const ailment = value as Record<string, unknown>;
      const { patientName: _patientName, species: _species, context: _context, ...legacyFields } = ailment;
      return [{
        ...legacyFields,
        instanceId: String(ailment.instanceId || ailment.id || `legacy-ailment-${index + 1}`),
        ailmentId: ailment.ailmentId === null || ailment.ailmentId === undefined ? null : String(ailment.ailmentId),
        severity: String(ailment.severity || ''),
        status: String(ailment.status || ''),
        effectIds: Array.isArray(ailment.effectIds) ? ailment.effectIds.map(String) : [],
        ...(typeof _patientName === 'string' && _patientName.trim()
          ? { patientName: _patientName.trim() }
          : {}),
        ...(typeof _species === 'string' && _species.trim()
          ? { species: _species.trim() }
          : {}),
        ...(typeof _context === 'string' && _context.trim()
          ? { context: _context.trim() }
          : {})
      }];
    }) : [],
    timers: Array.isArray(legacy.timers) ? legacy.timers as CanonicalPatientArchiveRecord['timers'] : [],
    remedyParts: Array.isArray(legacy.remedyParts) ? legacy.remedyParts.map(String) : Array.isArray(legacy.remedy) ? legacy.remedy.map(String) : [],
    treatmentResult,
    success: treatmentResult === 'success' && status === 'treated',
    failure: treatmentResult === 'failure' && status === 'failed',
    reward: { trinkets: Number((legacy.reward as { trinkets?: number } | undefined)?.trinkets || 0), reputation: Number((legacy.reward as { reputation?: number } | undefined)?.reputation || 0) },
    penalty: { trinkets: Number((legacy.penalty as { trinkets?: number } | undefined)?.trinkets || 0), reputation: Number((legacy.penalty as { reputation?: number } | undefined)?.reputation || 0) },
    specialEffects: Array.isArray(legacy.specialEffects) ? legacy.specialEffects.map(String) : [],
    journalEntryIds: Array.isArray(legacy.journalEntryIds) ? legacy.journalEntryIds.map(String) : [],
    status,
    sourceJourneyId: legacy.sourceJourneyId ? String(legacy.sourceJourneyId) : null,
    transactionIds: Array.isArray(legacy.transactionIds) ? legacy.transactionIds.map(String) : []
  };
};

export const upsertPatientArchive = (
  archive: CanonicalPatientArchiveRecord[],
  record: CanonicalPatientArchiveRecord
): CanonicalPatientArchiveRecord[] => {
  const existing = archive.find(row => row.caseId === record.caseId);
  if (!existing) return [...archive, record];
  const transactionIds = [...new Set([...existing.transactionIds, ...record.transactionIds])];
  const hasNewTransaction = record.transactionIds.some(id => !existing.transactionIds.includes(id));
  const merged: CanonicalPatientArchiveRecord = {
    ...record,
    encounteredAt: existing.encounteredAt || record.encounteredAt,
    treatedAt: record.treatedAt ?? existing.treatedAt,
    remedyParts: [...new Set([...existing.remedyParts, ...record.remedyParts])],
    reward: hasNewTransaction
      ? {
        trinkets: existing.reward.trinkets + record.reward.trinkets,
        reputation: existing.reward.reputation + record.reward.reputation
      }
      : existing.reward,
    penalty: hasNewTransaction
      ? {
        trinkets: existing.penalty.trinkets + record.penalty.trinkets,
        reputation: existing.penalty.reputation + record.penalty.reputation
      }
      : existing.penalty,
    specialEffects: [...new Set([...existing.specialEffects, ...record.specialEffects])],
    journalEntryIds: [...new Set([...existing.journalEntryIds, ...record.journalEntryIds])],
    sourceJourneyId: record.sourceJourneyId || existing.sourceJourneyId,
    transactionIds
  };
  const preserveFailure = existing.status === 'failed' && record.status === 'treated' && record.treatmentResult !== 'success';
  const next = preserveFailure
    ? { ...merged, status: existing.status, treatmentResult: existing.treatmentResult, success: false, failure: true }
    : merged;
  return archive.map(row => row.caseId === record.caseId ? next : row);
};
