import type { CompanionState, WagonState } from './data/mobility';
import type { AilmentSeverity, RuleTag, RulesetId, Season, StructuredRuleEffect } from './types';

export const CURRENT_SCHEMA_VERSION = 9 as const;

export type PatientStatus = 'active' | 'cured' | 'failed' | 'departed';
export type AilmentStatus = 'active' | 'treated' | 'failed';
export type TimerStatus = 'active' | 'expired' | 'stopped';

export interface PatientAilmentState {
  id: string;
  ailmentId: string | null;
  legacyName?: string;
  severity: AilmentSeverity;
  requirementSnapshot?: string;
  timerIds: string[];
  conditionIds: string[];
  treatmentHistoryIds: string[];
  status: AilmentStatus;
  instance: number;
  repeatIndex: number;
  specialState: Record<string, unknown>;
  successResolved: boolean;
  failureResolved: boolean;
  consequenceResolved: boolean;
  effectIds: string[];
}

export interface PatientTimerState {
  id: string;
  ailmentInstanceId: string;
  current: number;
  maximum: number;
  status: TimerStatus;
}

export interface PatientConditionState {
  id: string;
  ailmentInstanceId?: string;
  code: string;
  description: string;
  active: boolean;
}

export interface TreatmentHistoryEntry {
  id: string;
  ailmentInstanceIds: string[];
  preparationIds: string[];
  providedTags: Partial<Record<RuleTag, number>>;
  remedyFlags?: Array<'PRESERVED'>;
  outcome: 'success' | 'failure' | 'pending';
  effects: StructuredRuleEffect[];
  journalEventId?: string;
}

export interface PatientJournalEvent {
  id: string;
  type: 'diagnosis' | 'timer' | 'treatment' | 'success' | 'failure' | 'note';
  text: string;
  campaignDay?: number;
}

export interface PatientState {
  id: string;
  name: string;
  species: string;
  personality?: string;
  descriptor?: string;
  foragingPoints?: number;
  reagentsGathered?: string[];
  initialRememberedNote?: string;
  startedAtDay?: number;
  journeyTitle?: string;
  status: PatientStatus;
  ailments: PatientAilmentState[];
  timers: PatientTimerState[];
  conditions: PatientConditionState[];
  treatmentHistory: TreatmentHistoryEntry[];
  journalEvents: PatientJournalEvent[];
}

export interface TreatmentDraftPart {
  itemId: string;
  reagentId: string | null;
  preparationId: string | null;
}

export interface TreatmentDraft {
  id: string;
  patientId: string;
  ailmentInstanceId: string;
  selectedParts: TreatmentDraftPart[];
  selectedPreparationIds: string[];
  selectedToolIds: string[];
  catalyse: Array<{ tag: RuleTag; itemIds: string[] }>;
  fair: number;
  foul: number;
  purify: boolean;
  replacementContext: {
    kind: 'make-do' | 'replacement';
    targetTag: RuleTag;
    requiredPotency: number;
  } | null;
  status: 'draft' | 'committed' | 'discarded';
  committedTransactionId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface RulesApplicationState {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  rulesetId: RulesetId;
  currentSeason: Season;
  activePatientId: string | null;
  patients: PatientState[];
  appliedTransactionIds: string[];
  appliedEncounterEffectIds: string[];
  pendingBarter: unknown | null;
  journey: unknown | null;
  pendingEnding: unknown | null;
  pendingLeaveObligation: unknown | null;
  pendingAlternativeAcquisition: unknown | null;
  patientArchive: unknown[];
  activeDelve: unknown | null;
  pendingServices: unknown[];
  serviceMapMutations: unknown[];
  toolStates: unknown[];
  wagonState: WagonState | null;
  companionStates: CompanionState[];
  companionHiveStates: CompanionState[];
  rumours: unknown[];
  clinics: unknown[];
  clinicAgendaIds: string[];
  ailmentTagOverrides: unknown[];
  trinketRecords: unknown[];
  legacyTrinketCount: number;
  pendingManualEffect: unknown | null;
  treatmentDraft: TreatmentDraft | null;
  manualEffectDraft: unknown | null;
  manualEffectQueue: unknown[];
  manualEffectRecords: unknown[];
  pendingManualFollowUps: unknown[];
  manualConditions: string[];
  offlineOutbox: unknown[];
  downtimeCompleted: boolean;
  downtimeRequired: boolean;
  saveRevision: number;
}
