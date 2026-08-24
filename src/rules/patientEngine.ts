import { getRuleCardValue, type RuleCard } from './cards';
import { AILMENTS, AILMENT_MONARCH_RULES } from './data/ailments';
import type { PatientAilmentState, PatientState, PatientTimerState } from './state';
import type { AilmentDefinition, AilmentSeverity, CardSuit } from './types';

const PERSONALITIES: readonly (readonly [string, string, string])[] = [
  ['Witty', 'Passionate', 'Snide'],
  ['Soft', 'Stoic', 'Cruel'],
  ['Furious', 'Oblivious', 'Scared'],
  ['Joyous', 'Depressed', 'Evasive'],
  ['Immaterial', 'Dreamy', 'Distracted'],
  ['Suspicious', 'Curious', 'Secretive'],
  ['Loud', 'Disgusting', 'Brash'],
  ['Radiant', 'Generous', 'Energetic'],
  ['Cool', 'Calm', 'Collected'],
  ['Whelmed', 'Draining', 'Killjoy'],
  ['Anxious', 'Skittish', 'Jubilant'],
  ['Distant', 'Righteous', 'Rebellious']
];

const DESCRIPTORS = [
  'Aquatic', 'Melodic', 'Burrowing', 'Playful', 'Befurred', 'Bescaled',
  'Clawed', 'Sun-loving', 'Star-dancing', 'Mud-dwelling', 'Unnoticed', 'Majestic'
] as const;

export const getPatientPersonalityChoices = (card: RuleCard): readonly string[] =>
  PERSONALITIES[getRuleCardValue(card, 'table') - 1] || [];

export const getPatientDescriptor = (card: RuleCard): string | null =>
  DESCRIPTORS[getRuleCardValue(card, 'table') - 1] || null;

const SEVERITY_BY_SUIT: Record<CardSuit, AilmentSeverity> = {
  '♥': 'lesser',
  '♦': 'intermediate',
  '♣': 'severe',
  '♠': 'dire'
};

const SEVERITY_ORDER: readonly AilmentSeverity[] = ['lesser', 'intermediate', 'severe', 'dire'];

export interface PatientCardEngineInput {
  transactionId: string;
  patientName: string;
  species: string;
  personalityCard: RuleCard;
  personalityChoice: 0 | 1 | 2;
  descriptorCard: RuleCard;
  severityCard: { value: number; suit: CardSuit };
  ailmentCard: RuleCard;
  chosenAilmentId?: string;
  multipleAilmentCards?: RuleCard[];
  reputation: number;
  timerBonus?: number;
  lesserIntermediateTimerBonus?: number;
}

export interface PatientCardEngineOutcome {
  patient: PatientState;
  drawnSeverity: AilmentSeverity;
  reputationSeverityLimit: AilmentSeverity;
  appliedSeverity: AilmentSeverity;
  severityCappedByReputation: boolean;
  ailmentIds: string[];
}

export interface PatientCardEngineResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: PatientCardEngineOutcome | null;
  messages: string[];
}

export interface EncounterPatientAilmentInput {
  transactionId: string;
  patient: PatientState | null;
  ailmentCard: RuleCard;
  severity: AilmentSeverity;
  encounterId: string;
  patientName: string;
  species: string;
  context: string;
  rewardMode?: 'none' | 'standard';
  deadline?: 'before-overstay';
  timerBonus?: number;
  lesserIntermediateTimerBonus?: number;
}

export interface EncounterPatientAilmentOutcome {
  patient: PatientState;
  ailmentInstanceId: string;
  ailmentId: string;
}

export interface EncounterPatientAilmentResolution {
  status: 'resolved' | 'invalid';
  value: EncounterPatientAilmentOutcome | null;
  messages: string[];
}

const maxSeverityForReputation = (reputation: number): AilmentSeverity => {
  if (reputation >= 35) return 'dire';
  if (reputation >= 25) return 'severe';
  if (reputation >= 15) return 'intermediate';
  return 'lesser';
};

const ailmentAt = (severity: AilmentSeverity, card: RuleCard): AilmentDefinition | null => {
  const value = getRuleCardValue(card, 'table');
  const rows = AILMENTS.filter(ailment => ailment.severity === severity);
  return rows[value - 1] || null;
};

const resolveAilmentDraw = (
  severity: AilmentSeverity,
  card: RuleCard,
  lowerCards: readonly RuleCard[],
  cursor: { value: number }
): { ailments: AilmentDefinition[]; message?: string } => {
  if (getRuleCardValue(card, 'table') !== 12 || severity === 'lesser') {
    const ailment = ailmentAt(severity, card);
    return ailment ? { ailments: [ailment] } : { ailments: [], message: 'Ailment card did not resolve.' };
  }
  const monarch = AILMENT_MONARCH_RULES[severity];
  if (monarch.kind !== 'drawMultiple') return { ailments: [], message: 'Invalid Monarch rule configuration.' };
  const ailments: AilmentDefinition[] = [];
  for (let index = 0; index < monarch.count; index += 1) {
    const nextCard = lowerCards[cursor.value];
    cursor.value += 1;
    if (!nextCard) return { ailments: [], message: `Monarch requires ${monarch.count} ${monarch.severity} Ailment cards.` };
    const nested = resolveAilmentDraw(monarch.severity, nextCard, lowerCards, cursor);
    if (nested.message) return nested;
    ailments.push(...nested.ailments);
  }
  return { ailments };
};

const createPatient = (
  input: PatientCardEngineInput,
  ailmentsToCreate: AilmentDefinition[],
  personality: string,
  descriptor: string
): PatientState => {
  const patientId = `patient-${input.transactionId}`;
  const ailments: PatientAilmentState[] = [];
  const timers: PatientTimerState[] = [];
  ailmentsToCreate.forEach((definition, drawIndex) => {
    const repeats = definition.repeatCount || 1;
    for (let instance = 1; instance <= repeats; instance += 1) {
      const ailmentInstanceId = `${patientId}:${definition.id}:${drawIndex + 1}:${instance}`;
      const timerId = `${ailmentInstanceId}:timer`;
      const tierBonus = definition.severity === 'lesser' || definition.severity === 'intermediate'
        ? input.lesserIntermediateTimerBonus || 0
        : 0;
      const maximum = definition.timer + (input.timerBonus || 0) + tierBonus;
      ailments.push({
        id: ailmentInstanceId,
        ailmentId: definition.id,
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
      timers.push({ id: timerId, ailmentInstanceId, current: maximum, maximum, status: 'active' });
    }
  });
  return {
    id: patientId,
    name: input.patientName,
    species: input.species,
    personality,
    descriptor,
    foragingPoints: 0,
    reagentsGathered: [],
    status: 'active',
    ailments,
    timers,
    conditions: [],
    treatmentHistory: [],
    journalEvents: [{
      id: `${input.transactionId}:diagnosis`,
      type: 'diagnosis',
      text: `${personality} ${descriptor}; ${ailmentsToCreate.map(ailment => ailment.canonicalName).join(', ')}`
    }]
  };
};

export const resolvePatientCards = (input: PatientCardEngineInput): PatientCardEngineResolution => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Patient generation requires a transaction ID.'] };
  if (!input.patientName.trim() || !input.species.trim()) return { status: 'invalid', value: null, messages: ['Patient name and species are required for the record.'] };
  const personalityValue = getRuleCardValue(input.personalityCard, 'table');
  const descriptorValue = getRuleCardValue(input.descriptorCard, 'table');
  const personality = PERSONALITIES[personalityValue - 1]?.[input.personalityChoice];
  const descriptor = DESCRIPTORS[descriptorValue - 1];
  if (!personality || !descriptor) return { status: 'invalid', value: null, messages: ['Invalid Personality or Descriptor card.'] };

  const drawnSeverity = SEVERITY_BY_SUIT[input.severityCard.suit];
  const maxSeverity = maxSeverityForReputation(input.reputation);
  const appliedSeverity = SEVERITY_ORDER[Math.min(SEVERITY_ORDER.indexOf(drawnSeverity), SEVERITY_ORDER.indexOf(maxSeverity))];
  const chosenAilment = input.chosenAilmentId ? AILMENTS.find(ailment => ailment.id === input.chosenAilmentId) : null;
  if (input.chosenAilmentId && !chosenAilment) return { status: 'invalid', value: null, messages: ['Send a Missive selected an unknown canonical Ailment.'] };
  const draw = chosenAilment
    ? { ailments: [chosenAilment] }
    : resolveAilmentDraw(appliedSeverity, input.ailmentCard, input.multipleAilmentCards || [], { value: 0 });
  if (draw.message) return { status: 'manual', value: null, messages: [draw.message] };
  const ailmentsToCreate = draw.ailments;

  const patient = createPatient(input, ailmentsToCreate, personality, descriptor);
  return {
    status: 'resolved',
    value: {
      patient,
      drawnSeverity,
      reputationSeverityLimit: maxSeverity,
      appliedSeverity,
      severityCappedByReputation: drawnSeverity !== appliedSeverity,
      ailmentIds: ailmentsToCreate.map(ailment => ailment.id)
    },
    messages: drawnSeverity !== appliedSeverity
      ? [`Severity was capped at ${appliedSeverity} by Guild Reputation.`]
      : []
  };
};

/**
 * Adds the patient/Ailment created by an Encounter to the currently running
 * local-beast case. The rulebook explicitly says all concurrent Ailment
 * Timers move together (p.29), so keeping the new instance in the same active
 * PatientState avoids silently freezing the original patient's Timer.
 *
 * The newly encountered beast's identity is stored on the Ailment itself;
 * this lets the treatment workspace show the right patient while preserving
 * the original case identity for the other active Ailments.
 */
export const startEncounterPatientAilment = (
  input: EncounterPatientAilmentInput
): EncounterPatientAilmentResolution => {
  if (!input.transactionId.trim() || !input.encounterId.trim()) {
    return { status: 'invalid', value: null, messages: ['Encounter Ailment requires stable transaction and encounter IDs.'] };
  }
  const definition = ailmentAt(input.severity, input.ailmentCard);
  if (!definition) {
    return { status: 'invalid', value: null, messages: ['Encounter Ailment card did not resolve on the requested Severity table.'] };
  }

  const patientId = input.patient?.id || `patient-${input.transactionId}`;
  const ailmentInstanceId = `${patientId}:${input.encounterId}:${input.transactionId}:${definition.id}`;
  if (input.patient?.ailments.some(row => row.id === ailmentInstanceId)) {
    return {
      status: 'resolved',
      value: { patient: input.patient, ailmentInstanceId, ailmentId: definition.id },
      messages: ['Encounter Ailment was already started.']
    };
  }
  const timerId = `${ailmentInstanceId}:timer`;
  const tierBonus = definition.severity === 'lesser' || definition.severity === 'intermediate'
    ? input.lesserIntermediateTimerBonus || 0
    : 0;
  const maximum = definition.timer + (input.timerBonus || 0) + tierBonus;
  const ailment: PatientAilmentState = {
    id: ailmentInstanceId,
    ailmentId: definition.id,
    severity: definition.severity,
    timerIds: [timerId],
    conditionIds: [`${ailmentInstanceId}:encounter-context`],
    treatmentHistoryIds: [],
    status: 'active',
    instance: 1,
    repeatIndex: 1,
    specialState: {
      sourceEncounterId: input.encounterId,
      encounterPatientName: input.patientName,
      encounterPatientSpecies: input.species,
      encounterContext: input.context,
      rewardMode: input.rewardMode || 'standard',
      deadline: input.deadline || null
    },
    successResolved: false,
    failureResolved: false,
    consequenceResolved: false,
    effectIds: []
  };
  const timer: PatientTimerState = {
    id: timerId,
    ailmentInstanceId,
    current: maximum,
    maximum,
    status: 'active'
  };
  const condition = {
    id: `${ailmentInstanceId}:encounter-context`,
    ailmentInstanceId,
    code: `encounter-patient:${input.encounterId}`,
    description: input.context,
    active: true
  };
  const journalEvent = {
    id: `${input.transactionId}:diagnosis`,
    type: 'diagnosis' as const,
    text: `${input.patientName} (${input.species}) · ${definition.canonicalName} · ${input.context}`
  };
  const base: PatientState = input.patient || {
    id: patientId,
    name: input.patientName,
    species: input.species,
    foragingPoints: 0,
    reagentsGathered: [],
    status: 'active',
    ailments: [],
    timers: [],
    conditions: [],
    treatmentHistory: [],
    journalEvents: []
  };
  const patient: PatientState = {
    ...base,
    status: 'active',
    // Put the new encounter Ailment first so the immediate transition opens
    // the treatment workspace on the beast the player just chose to help.
    ailments: [ailment, ...base.ailments],
    timers: [timer, ...base.timers],
    conditions: [condition, ...base.conditions],
    journalEvents: [journalEvent, ...base.journalEvents]
  };
  return {
    status: 'resolved',
    value: { patient, ailmentInstanceId, ailmentId: definition.id },
    messages: []
  };
};
