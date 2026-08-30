import { AILMENT_BY_ID } from './data/ailments';
import {
  ENCOUNTER_REMEDY_BY_ID,
  ENCOUNTER_REMEDY_BY_PATIENT_AILMENT_ID,
  type EncounterRemedyDefinition
} from './data/encounterRemedies';
import type { AilmentDefinition } from './types';

export interface TreatmentAilmentDefinitionView extends AilmentDefinition {
  encounterRemedy: EncounterRemedyDefinition | null;
  encounterOnly: boolean;
}

const encounterTreatmentView = (
  remedy: EncounterRemedyDefinition
): TreatmentAilmentDefinitionView => ({
  id: remedy.patientAilmentId,
  canonicalName: remedy.canonicalName,
  displayName: remedy.displayName,
  // Encounter-only Remedies have no printed Severity. stateSeverity is only
  // the PatientState compatibility value and reward calculations are disabled.
  severity: remedy.stateSeverity,
  timer: remedy.timerHours || 0,
  requirements: remedy.requirements,
  successEffects: [],
  failureEffects: [],
  specialRules: [],
  allowsMultiple: false,
  rulebookEdition: remedy.rulebookEdition,
  sourcePage: remedy.sourcePage,
  source: remedy.source,
  support: 'structured-but-not-executed',
  encounterRemedy: remedy,
  encounterOnly: true
});

/**
 * Resolves both normal card-table Ailments and fixed Encounter Remedies for
 * treatment UI/domain consumers without adding the latter to AILMENTS.
 */
export const getTreatmentAilmentDefinition = (
  ailmentId: string | null | undefined
): TreatmentAilmentDefinitionView | null => {
  if (!ailmentId) return null;
  const canonical = AILMENT_BY_ID.get(ailmentId);
  if (canonical) return { ...canonical, encounterRemedy: null, encounterOnly: false };
  const encounter = ENCOUNTER_REMEDY_BY_PATIENT_AILMENT_ID.get(ailmentId);
  return encounter ? encounterTreatmentView(encounter) : null;
};

/** Uses the stable remedy ID stored in specialState when available. */
export const getEncounterRemedyForPatientAilment = (
  ailmentId: string | null | undefined,
  remedyId?: unknown
): EncounterRemedyDefinition | null => {
  if (typeof remedyId === 'string') {
    const exact = ENCOUNTER_REMEDY_BY_ID.get(remedyId);
    if (exact && exact.patientAilmentId === ailmentId) return exact;
  }
  return ailmentId ? ENCOUNTER_REMEDY_BY_PATIENT_AILMENT_ID.get(ailmentId) || null : null;
};

export const isEncounterOnlyRemedyAilmentId = (
  ailmentId: string | null | undefined
): boolean => Boolean(ailmentId && !AILMENT_BY_ID.has(ailmentId)
  && ENCOUNTER_REMEDY_BY_PATIENT_AILMENT_ID.has(ailmentId));
