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
      effectIds: [...ailment.effectIds]
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
    patientId: String(legacy.patientId || legacy.sourceId || 'legacy-patient'),
    patientName: String(legacy.patientName || legacy.name || ''),
    personality: String(legacy.personality || ''),
    descriptor: String(legacy.descriptor || legacy.species || ''),
    location: String(legacy.location || legacy.locationName || ''),
    encounteredAt: Number(legacy.encounteredAt || legacy.timestamp || 0),
    treatedAt: legacy.treatedAt === null || legacy.treatedAt === undefined ? null : Number(legacy.treatedAt),
    ailments: Array.isArray(legacy.ailments) ? legacy.ailments as CanonicalPatientArchiveRecord['ailments'] : [],
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
  const preserveFailure = existing.status === 'failed' && record.status === 'treated' && record.treatmentResult !== 'success';
  const next = preserveFailure
    ? { ...record, status: existing.status, treatmentResult: existing.treatmentResult, success: false, failure: true, transactionIds }
    : { ...record, transactionIds };
  return archive.map(row => row.caseId === record.caseId ? next : row);
};
