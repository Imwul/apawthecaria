import type { RuleCard } from './cards';
import { AILMENT_BY_ID } from './data/ailments';
import { findEncounter } from './data/encounters';
import { SEASON_BY_ID } from './data/seasons';
import { executeEncounter, type EncounterExecutionInput, type EncounterExecutionResolution } from './encounterEngine';
import { resolveForagingEngine, type ForagingEngineInput, type ForagingEngineResolution } from './foragingEngine';
import { resolvePatientCards, type PatientCardEngineInput, type PatientCardEngineResolution } from './patientEngine';
import { evaluateRequirement, type RequirementEvaluation } from './requirements';
import { resolveSeasonBoundary, type SeasonEngineInput, type SeasonEngineResolution } from './seasonEngine';
import { resolveTravelEngine, type TravelEngineInput, type TravelEngineResolution } from './travelEngine';
import { resolveTreatmentTransaction, type TreatmentEngineInput, type TreatmentEngineResolution } from './treatmentEngine';
import type {
  EncounterDefinition,
  RuleTag,
  Season,
  StructuredRuleEffect,
  TravelRegion
} from './types';
import type { PatientAilmentState, PatientState, PatientTimerState } from './state';

export type ResolutionStatus = 'resolved' | 'manual' | 'invalid';

export interface RuleResolution<T> {
  status: ResolutionStatus;
  value: T | null;
  effects: StructuredRuleEffect[];
  messages: string[];
}

export interface EncounterResolutionInput {
  encounterType: 'travel' | 'foraging' | 'social';
  region: TravelRegion;
  card: RuleCard;
  season?: Season;
  locationType?: 'Settlement' | 'City';
  city?: string;
}

const encounterResult = (encounter: EncounterDefinition | null): RuleResolution<EncounterDefinition> => encounter
  ? {
      status: encounter.support === 'implemented' ? 'resolved' : 'manual',
      value: encounter,
      effects: encounter.mandatoryEffects,
      messages: encounter.support === 'implemented' ? [] : ['The encounter is indexed, but its printed effects still require manual resolution.']
    }
  : { status: 'invalid', value: null, effects: [], messages: ['No canonical encounter matches the supplied context.'] };

export function resolveEncounter(input: EncounterResolutionInput): RuleResolution<EncounterDefinition>;
export function resolveEncounter(input: EncounterExecutionInput): EncounterExecutionResolution;
export function resolveEncounter(input: EncounterResolutionInput | EncounterExecutionInput): RuleResolution<EncounterDefinition> | EncounterExecutionResolution {
  return 'encounter' in input ? executeEncounter(input) : encounterResult(findEncounter(input));
}

export interface TravelResolutionInput {
  destinationRegion: TravelRegion;
  destinationType: 'Wilds' | 'Settlement' | 'City' | 'Titan Ruin' | 'Behemoth Barrow' | 'Soar';
  card: RuleCard;
  season: Season;
  city?: string;
}

export function resolveTravel(input: TravelResolutionInput): RuleResolution<EncounterDefinition>;
export function resolveTravel(input: TravelEngineInput): TravelEngineResolution;
export function resolveTravel(input: TravelResolutionInput | TravelEngineInput): RuleResolution<EncounterDefinition> | TravelEngineResolution {
  if ('state' in input) return resolveTravelEngine(input);
  const isSocial = input.destinationType === 'Settlement' || input.destinationType === 'City';
  return resolveEncounter({
    encounterType: isSocial ? 'social' : 'travel',
    region: input.destinationRegion,
    card: input.card,
    season: input.season,
    locationType: input.destinationType === 'City' ? 'City' : input.destinationType === 'Settlement' ? 'Settlement' : undefined,
    city: input.city
  });
}

export interface ForagingResolutionInput {
  region: Exclude<TravelRegion, 'Soar'>;
  card: RuleCard;
  season: Season;
}

export function resolveForaging(input: ForagingResolutionInput): RuleResolution<EncounterDefinition>;
export function resolveForaging(input: ForagingEngineInput): ForagingEngineResolution;
export function resolveForaging(input: ForagingResolutionInput | ForagingEngineInput): RuleResolution<EncounterDefinition> | ForagingEngineResolution {
  return 'state' in input
    ? resolveForagingEngine(input)
    : resolveEncounter({ encounterType: 'foraging', ...input });
}

export { evaluateRequirement } from './requirements';
export type { RequirementEvaluation } from './requirements';

export interface TreatmentResolutionInput {
  ailmentId: string;
  providedTags: Partial<Record<RuleTag, number>>;
}

export function resolveTreatment(input: TreatmentResolutionInput): RuleResolution<RequirementEvaluation>;
export function resolveTreatment(input: TreatmentEngineInput): TreatmentEngineResolution;
export function resolveTreatment(input: TreatmentResolutionInput | TreatmentEngineInput): RuleResolution<RequirementEvaluation> | TreatmentEngineResolution {
  if ('mode' in input) return resolveTreatmentTransaction(input);
  const ailment = AILMENT_BY_ID.get(input.ailmentId);
  if (!ailment) return { status: 'invalid', value: null, effects: [], messages: [`Unknown ailment: ${input.ailmentId}`] };
  const evaluation = evaluateRequirement(ailment.requirements, input.providedTags);
  return {
    status: evaluation.manual.length > 0 ? 'manual' : evaluation.satisfied ? 'resolved' : 'invalid',
    value: evaluation,
    effects: evaluation.satisfied ? ailment.successEffects : [],
    messages: [...evaluation.missing, ...evaluation.manual]
  };
}

export function resolveSeason(season: Season): RuleResolution<Season>;
export function resolveSeason(input: SeasonEngineInput): SeasonEngineResolution;
export function resolveSeason(input: Season | SeasonEngineInput): RuleResolution<Season> | SeasonEngineResolution {
  if (typeof input !== 'string') return resolveSeasonBoundary(input);
  const season = input;
  const definition = SEASON_BY_ID.get(season);
  return definition
    ? { status: 'resolved', value: definition.nextSeason, effects: [], messages: [] }
    : { status: 'invalid', value: null, effects: [], messages: [`Unknown season: ${season}`] };
}

export interface TimerResolutionInput {
  patient: PatientState;
  hours: number;
  timerIds?: string[];
  hasSteelAxe?: boolean;
  hasLocalSettlementHelp?: boolean;
}

export const resolveTimer = (input: TimerResolutionInput): RuleResolution<PatientState> => {
  if (!Number.isInteger(input.hours) || input.hours < 0) {
    return { status: 'invalid', value: null, effects: [], messages: ['Timer hours must be a non-negative integer.'] };
  }
  const selected = input.timerIds ? new Set(input.timerIds) : null;
  const timers = input.patient.timers.map(timer => {
    if (timer.status !== 'active' || (selected && !selected.has(timer.id))) return timer;
    const ailment = input.patient.ailments.find(row => row.id === timer.ailmentInstanceId);
    const pinnedExtra = ailment?.ailmentId === 'ailment-pinned-by-pine'
      && input.hours > 0 && !input.hasSteelAxe && !input.hasLocalSettlementHelp ? 1 : 0;
    const current = Math.max(0, timer.current - input.hours - pinnedExtra);
    return { ...timer, current, status: current === 0 ? 'expired' as const : 'active' as const };
  });
  const timerById = new Map(timers.map(timer => [timer.id, timer]));
  const ailments = input.patient.ailments.map(ailment => {
    if (ailment.status !== 'active') return ailment;
    const expired = ailment.timerIds.some(timerId => timerById.get(timerId)?.status === 'expired');
    const current = Math.min(...ailment.timerIds.map(timerId => timerById.get(timerId)?.current ?? Infinity));
    const quagmire = ailment.ailmentId === 'ailment-quagmire-s-scale' && current <= 2;
    return {
      ...ailment,
      status: expired ? 'failed' as const : ailment.status,
      failureResolved: expired || ailment.failureResolved,
      specialState: {
        ...ailment.specialState,
        ...(quagmire ? { poisonRequirement: 3, forcesOverstay: expired } : {})
      }
    };
  });
  const expired = timers.filter(timer => timer.status === 'expired').map(timer => timer.id);
  return {
    status: 'resolved',
    value: { ...input.patient, timers, ailments },
    effects: [],
    messages: expired.length > 0 ? [`Expired timers: ${expired.join(', ')}`] : []
  };
};

export interface PatientResolutionInput {
  id: string;
  name: string;
  species: string;
  personality?: string;
  descriptor?: string;
  ailmentIds: string[];
}

export function resolvePatient(input: PatientResolutionInput): RuleResolution<PatientState>;
export function resolvePatient(input: PatientCardEngineInput): PatientCardEngineResolution;
export function resolvePatient(input: PatientResolutionInput | PatientCardEngineInput): RuleResolution<PatientState> | PatientCardEngineResolution {
  if ('personalityCard' in input) return resolvePatientCards(input);
  const missing = input.ailmentIds.filter(id => !AILMENT_BY_ID.has(id));
  if (missing.length > 0) {
    return { status: 'invalid', value: null, effects: [], messages: missing.map(id => `Unknown ailment: ${id}`) };
  }
  const ailments: PatientAilmentState[] = [];
  const timers: PatientTimerState[] = [];
  input.ailmentIds.forEach(ailmentId => {
    const definition = AILMENT_BY_ID.get(ailmentId)!;
    const count = definition.repeatCount || 1;
    for (let instance = 1; instance <= count; instance += 1) {
      const ailmentInstanceId = `${input.id}-${ailmentId}-${instance}`;
      const timerId = `${ailmentInstanceId}-timer`;
      ailments.push({
        id: ailmentInstanceId,
        ailmentId,
        severity: definition.severity,
        timerIds: [timerId],
        conditionIds: [],
        treatmentHistoryIds: [],
        status: 'active',
        instance,
        repeatIndex: instance,
        specialState: {},
        successResolved: false,
        failureResolved: false,
        consequenceResolved: false,
        effectIds: []
      });
      timers.push({
        id: timerId,
        ailmentInstanceId,
        current: definition.timer,
        maximum: definition.timer,
        status: 'active'
      });
    }
  });
  return {
    status: 'resolved',
    value: {
      id: input.id,
      name: input.name,
      species: input.species,
      personality: input.personality,
      descriptor: input.descriptor,
      status: 'active',
      ailments,
      timers,
      conditions: [],
      treatmentHistory: [],
      journalEvents: []
    },
    effects: [],
    messages: []
  };
}
