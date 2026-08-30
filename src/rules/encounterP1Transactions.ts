import { CLINIC_AGENDA_BY_ID } from './data/clinics';
import type { CompanionState } from './data/mobility';
import { REAGENT_BY_ID, REAGENT_BY_NAME } from './data/reagents';
import { TOOL_BY_ID } from './data/tools';
import type { CanonicalClinicState } from './clinicEngine';
import type { EngineInventoryItem } from './gameplay';
import type { PatientState } from './state';
import type { CanonicalToolState } from './toolEngine';
import type { CardSuit, Region, Season, TravelRegion } from './types';

export const ENCOUNTER_P1_IDS = {
  sketch: 'travel-forest-7-8',
  cowtown: 'travel-meadow-m-summer',
  springmelt: 'travel-mountain-m-spring',
  knightsQuest: 'travel-mountain-j-spring',
  lessThanMajestic: 'travel-soar-7-8',
  mushroomPickers: 'foraging-forest-4',
  greatSilence: 'foraging-loch-9-autumn',
  flockFullOfTrouble: 'foraging-mountain-7',
  password: 'foraging-titan-2',
  snapCracklePop: 'foraging-titan-8',
  damselflyTraining: 'social-bog-spring-♠',
  grindingOre: 'social-mountain-summer-♣'
} as const;

export interface EncounterP1Card {
  value: number;
  suit: CardSuit;
}

export type EncounterP1InventoryKind = 'sketch' | 'titan-codex' | 'iron-pellets';

export interface EncounterP1InventoryItem extends EngineInventoryItem {
  encounterP1?: {
    kind: EncounterP1InventoryKind;
    sourcePage: 78 | 184 | 210;
    sourceTransactionId: string;
  };
}

/**
 * Damselfly is not a separate p.70 table row. Keeping the selected canonical
 * rules id in companionId lets the existing Companion engine apply the exact
 * Butterfly/Cricket function, while the override preserves the encountered
 * creature's identity for presentation and persistence.
 */
export interface EncounterP1CompanionState extends CompanionState {
  displayNameOverride?: 'Damselfly';
  rulesAsCompanionId?: 'butterfly' | 'cricket';
}

interface ConditionBase {
  id: string;
  sourceTransactionId: string;
}

export type EncounterP1Condition =
  | (ConditionBase & {
      kind: 'cowtown';
      sourcePage: 88;
      locationId: string;
      nextPatientPending: boolean;
    })
  | (ConditionBase & {
      kind: 'springmelt';
      sourcePage: 91;
    })
  | (ConditionBase & {
      kind: 'griph-trader-unavailable';
      sourcePage: 95;
      journeyId: string;
    })
  | (ConditionBase & {
      kind: 'great-silence-forage';
      sourcePage: 170;
      sourceLocationId: string;
      targetLocationId: string;
    })
  | (ConditionBase & {
      kind: 'flock-full-of-trouble';
      sourcePage: 179;
      locationId: string;
    })
  | (ConditionBase & {
      kind: 'password';
      sourcePage: 184;
      locationId: string;
      status: 'looking' | 'symbol-found' | 'door-opened';
    })
  | (ConditionBase & {
      kind: 'snap-crackle-pop';
      sourcePage: 186;
      locationId: string;
      mode: 'careful' | 'quick';
    });

export type KnightsQuestStatus =
  | 'active'
  | 'arrived-late'
  | 'behemoth-slain'
  | 'behemoth-victorious'
  | 'completed';

export interface KnightsQuestState {
  id: string;
  sourceTransactionId: string;
  sourcePage: 91;
  abandonedJourneyId: string;
  season: Season;
  direction: 'north' | 'south' | 'east' | 'west';
  destinationLocationId: string;
  distancePaths: 24;
  urgencyDays: 9;
  successfulAilmentIds: string[];
  failedAilmentIds: string[];
  status: KnightsQuestStatus;
  arrivalDaysElapsed: number | null;
  combatCardValue: number | null;
  combatFinalValue: number | null;
}

export interface EncounterP1ClinicState extends CanonicalClinicState {
  establishedByEncounterId?: typeof ENCOUNTER_P1_IDS.password;
}

export interface EncounterP1TransactionState {
  /** Incremented on each successful transaction; persist this with the save. */
  revision: number;
  currentSeason: Season;
  reputation: number;
  trinkets: number;
  foragingPoints: number;
  inventory: EncounterP1InventoryItem[];
  patient: PatientState | null;
  tools: CanonicalToolState[];
  companions: EncounterP1CompanionState[];
  conditions: EncounterP1Condition[];
  knightsQuests: KnightsQuestState[];
  clinics: EncounterP1ClinicState[];
  clinicAgendaIds: string[];
  appliedTransactionIds: string[];
}

/** Only deferred P1 state is persisted as a dedicated block in campaign
 * saves. Canonical inventory/patient/tool/companion/clinic values continue to
 * live in their existing campaign fields and are supplied through the App
 * adapter when a transaction runs. */
export interface EncounterP1PersistenceState {
  revision: number;
  conditions: EncounterP1Condition[];
  knightsQuests: KnightsQuestState[];
  appliedTransactionIds: string[];
}

export const EMPTY_ENCOUNTER_P1_PERSISTENCE: EncounterP1PersistenceState = {
  revision: 0,
  conditions: [],
  knightsQuests: [],
  appliedTransactionIds: []
};

export type EncounterP1Directive =
  | {
      kind: 'replace-active-journey-with-knights-quest';
      questId: string;
      abandonedJourneyId: string;
      destinationLocationId: string;
      direction: KnightsQuestState['direction'];
      distancePaths: 24;
      urgencyDays: 9;
      preserveSeason: true;
      patientKind: 'questing-beast';
    }
  | {
      kind: 'place-behemoth-barrow';
      questId: string;
      locationId: string;
    }
  | {
      kind: 'end-soar-at-location';
      locationId: string;
    }
  | {
      kind: 'forage-adjacent-without-timer-decrease';
      conditionId: string;
      sourceLocationId: string;
      targetLocationId: string;
    }
  | {
      kind: 'leave-location-and-end-forage';
      locationId: string;
    }
  | {
      kind: 'replace-forage-reagent-with-password-symbol';
      locationId: string;
    }
  | {
      kind: 'establish-password-clinic';
      clinicId: string;
      locationId: string;
      agendaId: string;
      bypassAgendaRequirements: true;
    };

export interface EncounterP1TransactionValue<T> {
  nextState: EncounterP1TransactionState;
  outcome: T;
  directives: EncounterP1Directive[];
}

export interface EncounterP1TransactionResolution<T> {
  status: 'resolved' | 'invalid';
  value: EncounterP1TransactionValue<T> | null;
  code?:
    | 'missing-transaction-id'
    | 'already-applied'
    | 'stale-state'
    | 'wrong-encounter'
    | 'invalid-choice'
    | 'invalid-card'
    | 'invalid-selection'
    | 'ineligible'
    | 'missing-resource'
    | 'ambiguous-printed-rule';
  messages: string[];
}

export interface EncounterP1TransactionEnvelope {
  transactionId: string;
  encounterId: string;
  expectedRevision: number;
  state: EncounterP1TransactionState;
}

type TransactionEnvelope = EncounterP1TransactionEnvelope;

const recordValue = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object'
  ? value as Record<string, unknown>
  : null;

const nonEmptyString = (value: unknown): string | null => typeof value === 'string' && value.trim()
  ? value
  : null;

const stringList = (value: unknown): string[] => Array.isArray(value)
  ? Array.from(new Set(value.filter((row): row is string => typeof row === 'string' && Boolean(row.trim()))))
  : [];

const normalizePersistedCondition = (value: unknown): EncounterP1Condition | null => {
  const row = recordValue(value);
  const id = nonEmptyString(row?.id);
  const sourceTransactionId = nonEmptyString(row?.sourceTransactionId);
  if (!row || !id || !sourceTransactionId) return null;
  const base = { id, sourceTransactionId };
  const locationId = nonEmptyString(row.locationId);
  if (row.kind === 'cowtown' && row.sourcePage === 88 && locationId) return {
    ...base, kind: 'cowtown', sourcePage: 88, locationId,
    nextPatientPending: row.nextPatientPending === true
  };
  if (row.kind === 'springmelt' && row.sourcePage === 91) return {
    ...base, kind: 'springmelt', sourcePage: 91
  };
  const journeyId = nonEmptyString(row.journeyId);
  if (row.kind === 'griph-trader-unavailable' && row.sourcePage === 95 && journeyId) return {
    ...base, kind: 'griph-trader-unavailable', sourcePage: 95, journeyId
  };
  const sourceLocationId = nonEmptyString(row.sourceLocationId);
  const targetLocationId = nonEmptyString(row.targetLocationId);
  if (row.kind === 'great-silence-forage' && row.sourcePage === 170 && sourceLocationId && targetLocationId) return {
    ...base, kind: 'great-silence-forage', sourcePage: 170, sourceLocationId, targetLocationId
  };
  if (row.kind === 'flock-full-of-trouble' && row.sourcePage === 179 && locationId) return {
    ...base, kind: 'flock-full-of-trouble', sourcePage: 179, locationId
  };
  if (row.kind === 'password' && row.sourcePage === 184 && locationId
    && ['looking', 'symbol-found', 'door-opened'].includes(String(row.status))) return {
    ...base, kind: 'password', sourcePage: 184, locationId,
    status: row.status as 'looking' | 'symbol-found' | 'door-opened'
  };
  if (row.kind === 'snap-crackle-pop' && row.sourcePage === 186 && locationId
    && ['careful', 'quick'].includes(String(row.mode))) return {
    ...base, kind: 'snap-crackle-pop', sourcePage: 186, locationId,
    mode: row.mode as 'careful' | 'quick'
  };
  return null;
};

const normalizePersistedQuest = (value: unknown): KnightsQuestState | null => {
  const row = recordValue(value);
  const id = nonEmptyString(row?.id);
  const sourceTransactionId = nonEmptyString(row?.sourceTransactionId);
  const abandonedJourneyId = nonEmptyString(row?.abandonedJourneyId);
  const destinationLocationId = nonEmptyString(row?.destinationLocationId);
  if (!row || !id || !sourceTransactionId || !abandonedJourneyId || !destinationLocationId
    || row.sourcePage !== 91 || row.distancePaths !== 24 || row.urgencyDays !== 9
    || !['Spring', 'Summer', 'Autumn', 'Winter'].includes(String(row.season))
    || !['north', 'south', 'east', 'west'].includes(String(row.direction))
    || !['active', 'arrived-late', 'behemoth-slain', 'behemoth-victorious', 'completed'].includes(String(row.status))) {
    return null;
  }
  const nullableInteger = (candidate: unknown): number | null => candidate === null
    ? null
    : Number.isInteger(candidate) ? Number(candidate) : null;
  const arrivalDaysElapsed = nullableInteger(row.arrivalDaysElapsed);
  const combatCardValue = nullableInteger(row.combatCardValue);
  const combatFinalValue = nullableInteger(row.combatFinalValue);
  if ((row.arrivalDaysElapsed !== null && arrivalDaysElapsed === null)
    || (row.combatCardValue !== null && combatCardValue === null)
    || (row.combatFinalValue !== null && combatFinalValue === null)) return null;
  return {
    id,
    sourceTransactionId,
    sourcePage: 91,
    abandonedJourneyId,
    season: row.season as Season,
    direction: row.direction as KnightsQuestState['direction'],
    destinationLocationId,
    distancePaths: 24,
    urgencyDays: 9,
    successfulAilmentIds: stringList(row.successfulAilmentIds),
    failedAilmentIds: stringList(row.failedAilmentIds),
    status: row.status as KnightsQuestStatus,
    arrivalDaysElapsed,
    combatCardValue,
    combatFinalValue
  };
};

/** Safe migration boundary for new and malformed saves. Unknown condition
 * shapes are not guessed; valid gameplay records survive repeated migration
 * unchanged. */
export const normalizeEncounterP1Persistence = (value: unknown): EncounterP1PersistenceState => {
  const row = recordValue(value);
  const uniqueById = <T extends { id: string }>(values: T[]): T[] => [
    ...new Map(values.map(candidate => [candidate.id, candidate])).values()
  ];
  return {
    revision: Number.isInteger(row?.revision) && Number(row?.revision) >= 0 ? Number(row?.revision) : 0,
    conditions: uniqueById((Array.isArray(row?.conditions) ? row.conditions : [])
      .map(normalizePersistedCondition)
      .filter((condition): condition is EncounterP1Condition => Boolean(condition))),
    knightsQuests: uniqueById((Array.isArray(row?.knightsQuests) ? row.knightsQuests : [])
      .map(normalizePersistedQuest)
      .filter((quest): quest is KnightsQuestState => Boolean(quest))),
    appliedTransactionIds: stringList(row?.appliedTransactionIds)
  };
};

interface MutableTransaction {
  state: EncounterP1TransactionState;
  directives: EncounterP1Directive[];
}

const invalid = <T>(
  code: NonNullable<EncounterP1TransactionResolution<T>['code']>,
  message: string
): EncounterP1TransactionResolution<T> => ({ status: 'invalid', value: null, code, messages: [message] });

const clonePatient = (patient: PatientState | null): PatientState | null => patient ? {
  ...patient,
  ailments: patient.ailments.map(row => ({
    ...row,
    timerIds: [...row.timerIds],
    conditionIds: [...row.conditionIds],
    treatmentHistoryIds: [...row.treatmentHistoryIds],
    specialState: { ...row.specialState },
    effectIds: [...row.effectIds]
  })),
  timers: patient.timers.map(row => ({ ...row })),
  conditions: patient.conditions.map(row => ({ ...row })),
  treatmentHistory: patient.treatmentHistory.map(row => ({
    ...row,
    ailmentInstanceIds: [...row.ailmentInstanceIds],
    preparationIds: [...row.preparationIds],
    providedTags: { ...row.providedTags },
    effects: [...row.effects]
  })),
  journalEvents: patient.journalEvents.map(row => ({ ...row })),
  reagentsGathered: patient.reagentsGathered ? [...patient.reagentsGathered] : undefined
} : null;

const cloneState = (state: EncounterP1TransactionState): EncounterP1TransactionState => ({
  ...state,
  inventory: state.inventory.map(item => ({
    ...item,
    customReagent: item.customReagent ? { ...item.customReagent } : undefined,
    guildNote: item.guildNote ? { ...item.guildNote } : undefined,
    provenance: item.provenance ? { ...item.provenance } : undefined,
    encounterP1: item.encounterP1 ? { ...item.encounterP1 } : undefined
  })),
  patient: clonePatient(state.patient),
  tools: state.tools.map(tool => ({ ...tool, appliedEffectIds: [...tool.appliedEffectIds] })),
  companions: state.companions.map(companion => ({ ...companion })),
  conditions: state.conditions.map(condition => ({ ...condition })),
  knightsQuests: state.knightsQuests.map(quest => ({
    ...quest,
    successfulAilmentIds: [...quest.successfulAilmentIds],
    failedAilmentIds: [...quest.failedAilmentIds]
  })),
  clinics: state.clinics.map(clinic => ({
    ...clinic,
    gardenHarvestedAilmentIds: clinic.gardenHarvestedAilmentIds
      ? [...clinic.gardenHarvestedAilmentIds]
      : undefined
  })),
  clinicAgendaIds: [...state.clinicAgendaIds],
  appliedTransactionIds: [...state.appliedTransactionIds]
});

const begin = <T>(
  input: TransactionEnvelope,
  expectedEncounterId: string
): MutableTransaction | EncounterP1TransactionResolution<T> => {
  if (!input.transactionId.trim()) return invalid('missing-transaction-id', 'A stable transaction ID is required.');
  if (input.encounterId !== expectedEncounterId) {
    return invalid('wrong-encounter', `Expected ${expectedEncounterId}, received ${input.encounterId}.`);
  }
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return invalid('already-applied', 'This encounter transaction has already been applied.');
  }
  if (input.expectedRevision !== input.state.revision) {
    return invalid('stale-state', 'The campaign changed after this choice opened. Refresh it before applying the result.');
  }
  return { state: cloneState(input.state), directives: [] };
};

const isFailure = <T>(
  value: MutableTransaction | EncounterP1TransactionResolution<T>
): value is EncounterP1TransactionResolution<T> => 'status' in value;

const finish = <T>(
  input: TransactionEnvelope,
  mutable: MutableTransaction,
  outcome: T,
  messages: string[] = []
): EncounterP1TransactionResolution<T> => {
  mutable.state.revision = input.state.revision + 1;
  mutable.state.appliedTransactionIds.push(input.transactionId);
  return {
    status: 'resolved',
    value: { nextState: mutable.state, outcome, directives: mutable.directives },
    messages
  };
};

const validCard = (card: EncounterP1Card | null | undefined): card is EncounterP1Card => Boolean(card)
  && Number.isInteger(card.value)
  && card.value >= 1
  && card.value <= 12
  && ['♥', '♦', '♣', '♠'].includes(card.suit);

const canonicalPart = (reagentId: string, preparationId: string) => {
  const reagent = REAGENT_BY_ID.get(reagentId);
  const preparation = reagent?.preparations.find(row => row.id === preparationId);
  return reagent && preparation ? { reagent, preparation } : null;
};

const addCanonicalPart = (
  mutable: MutableTransaction,
  transactionId: string,
  key: string,
  reagentId: string,
  preparationId: string,
  encounterP1?: EncounterP1InventoryItem['encounterP1']
): EncounterP1InventoryItem | null => {
  const selected = canonicalPart(reagentId, preparationId);
  if (!selected) return null;
  const item: EncounterP1InventoryItem = {
    id: `${transactionId}:reagent:${key}:${preparationId}`,
    name: `${selected.reagent.canonicalName} (${selected.preparation.name}, ${selected.preparation.method})`,
    type: 'reagent',
    weight: selected.preparation.weight,
    quantity: 1,
    canonicalReagentId: selected.reagent.id,
    preparationId: selected.preparation.id,
    usesRemaining: selected.preparation.uses,
    ruinedWhenSoaked: true,
    encounterP1
  };
  mutable.state.inventory.push(item);
  return item;
};

const isGrantableTool = (toolId: string): boolean => {
  const tool = TOOL_BY_ID.get(toolId);
  return Boolean(tool && tool.id !== 'teeth' && tool.id !== 'paws' && tool.category !== 'replacement');
};

export const isEncounterRewardToolId = isGrantableTool;

const addTool = (
  mutable: MutableTransaction,
  transactionId: string,
  key: string,
  toolId: string,
  acquiredBy: string
): EncounterP1InventoryItem | null => {
  const tool = TOOL_BY_ID.get(toolId);
  if (!tool || !isGrantableTool(toolId)) return null;
  const instanceId = `${transactionId}:tool:${key}:${toolId}`;
  const item: EncounterP1InventoryItem = {
    id: instanceId,
    name: tool.canonicalName,
    type: 'tool',
    weight: tool.weight,
    quantity: 1,
    canonicalToolId: tool.id
  };
  mutable.state.inventory.push(item);
  mutable.state.tools.push({
    instanceId,
    toolId: tool.id,
    upgradeId: null,
    charges: null,
    broken: false,
    consumed: false,
    acquiredBy,
    appliedEffectIds: []
  });
  return item;
};

const removeOneInventoryUnit = (
  inventory: EncounterP1InventoryItem[],
  itemId: string
): EncounterP1InventoryItem[] | null => {
  const index = inventory.findIndex(item => item.id === itemId);
  if (index < 0) return null;
  const item = inventory[index];
  const itemQuantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
  return inventory.flatMap((candidate, candidateIndex) => candidateIndex !== index
    ? [candidate]
    : itemQuantity > 1 ? [{ ...item, quantity: itemQuantity - 1 }] : []);
};

const adjustAllActiveTimers = (state: EncounterP1TransactionState, amount: number): number => {
  if (!state.patient) return 0;
  let changed = 0;
  state.patient = {
    ...state.patient,
    timers: state.patient.timers.map(timer => {
      if (timer.status !== 'active') return timer;
      changed += 1;
      const current = Math.max(0, Math.min(timer.maximum, timer.current + amount));
      return { ...timer, current, status: current === 0 ? 'expired' : 'active' };
    })
  };
  return changed;
};

const directionBySuit: Readonly<Record<CardSuit, KnightsQuestState['direction']>> = {
  '♥': 'north',
  '♦': 'south',
  '♣': 'east',
  '♠': 'west'
};

/** p.78: take one weight-1/3 Sketch now; its two future redemptions remain exclusive. */
export const resolveSketchDiscovery = (input: TransactionEnvelope & {
  choice: 'take-sketch' | 'leave-sketch';
}): EncounterP1TransactionResolution<{ sketchItemId: string | null }> => {
  const started = begin<{ sketchItemId: string | null }>(input, ENCOUNTER_P1_IDS.sketch);
  if (isFailure(started)) return started;
  if (input.choice === 'leave-sketch') return finish(input, started, { sketchItemId: null });
  if (input.choice !== 'take-sketch') return invalid('invalid-choice', 'Choose whether to take the Sketch.');
  const item: EncounterP1InventoryItem = {
    id: `${input.transactionId}:item:sketch`,
    name: 'Sketch',
    type: 'item',
    weight: 1 / 3,
    quantity: 1,
    encounterP1: { kind: 'sketch', sourcePage: 78, sourceTransactionId: input.transactionId }
  };
  started.state.inventory.push(item);
  return finish(input, started, { sketchItemId: item.id });
};

export type SketchRedemption =
  | {
      kind: 'craftpaws-local-reagent';
      atLocationType: 'City';
      currentRegion: Region;
      reagentId: string;
      preparationId: string;
    }
  | {
      kind: 'knowers-trinkets';
      atJourneyEndDowntime: true;
    }
  | {
      kind: 'knowers-tool';
      atJourneyEndDowntime: true;
      toolId: string;
    };

/** p.78: consume the exact Sketch before granting exactly one mutually-exclusive reward. */
export const redeemSketch = (input: TransactionEnvelope & {
  encounterId: 'sketch-redemption';
  sketchItemId: string;
  redemption: SketchRedemption;
}): EncounterP1TransactionResolution<{ rewardItemId: string | null; trinketsGained: number }> => {
  const started = begin<{ rewardItemId: string | null; trinketsGained: number }>(input, 'sketch-redemption');
  if (isFailure(started)) return started;
  const sketch = started.state.inventory.find(item => item.id === input.sketchItemId && item.encounterP1?.kind === 'sketch');
  if (!sketch) return invalid('missing-resource', 'The exact Sketch being traded is no longer in the Bags.');
  let rewardItemId: string | null = null;
  let trinketsGained = 0;
  if (input.redemption.kind === 'craftpaws-local-reagent') {
    if (input.redemption.atLocationType !== 'City') return invalid('ineligible', 'Craftpaws can only accept the Sketch in a City.');
    const selected = canonicalPart(input.redemption.reagentId, input.redemption.preparationId);
    if (!selected || selected.reagent.regionAvailability[input.redemption.currentRegion] === 'Unavailable') {
      return invalid('invalid-selection', 'Choose one canonical Reagent Part that can be foraged in this City\'s Region.');
    }
    const item = addCanonicalPart(
      started,
      input.transactionId,
      'craftpaws-local',
      input.redemption.reagentId,
      input.redemption.preparationId
    );
    if (!item) return invalid('invalid-selection', 'The selected local Reagent Part is not canonical.');
    rewardItemId = item.id;
  } else if (input.redemption.kind === 'knowers-trinkets') {
    if (!input.redemption.atJourneyEndDowntime) return invalid('ineligible', 'The Knowers arrive during Downtime at Journey end.');
    started.state.trinkets += 5;
    trinketsGained = 5;
  } else {
    if (!input.redemption.atJourneyEndDowntime) return invalid('ineligible', 'The Knowers arrive during Downtime at Journey end.');
    const item = addTool(started, input.transactionId, 'knowers-sketch', input.redemption.toolId, 'sketch-knowers');
    if (!item) return invalid('invalid-selection', 'Choose one canonical carried Tool.');
    rewardItemId = item.id;
  }
  started.state.inventory = removeOneInventoryUnit(started.state.inventory, input.sketchItemId)!;
  return finish(input, started, { rewardItemId, trinketsGained });
};

/** p.88: Cowtown is a temporary Settlement and owns exactly one next-patient flag. */
export const resolveCowtownVisit = (input: TransactionEnvelope & {
  choice: 'visit' | 'pass-by';
  locationId: string;
}): EncounterP1TransactionResolution<{ activeConditionId: string | null }> => {
  const started = begin<{ activeConditionId: string | null }>(input, ENCOUNTER_P1_IDS.cowtown);
  if (isFailure(started)) return started;
  if (!input.locationId.trim()) return invalid('invalid-selection', 'Cowtown requires the current map Location.');
  if (input.choice === 'pass-by') return finish(input, started, { activeConditionId: null });
  if (input.choice !== 'visit') return invalid('invalid-choice', 'Choose whether to visit Baile bò.');
  const existing = started.state.conditions.find(condition => condition.kind === 'cowtown' && condition.locationId === input.locationId);
  if (existing) return finish(input, started, { activeConditionId: existing.id });
  const condition: EncounterP1Condition = {
    id: `${input.transactionId}:condition:cowtown`,
    kind: 'cowtown',
    sourcePage: 88,
    sourceTransactionId: input.transactionId,
    locationId: input.locationId,
    nextPatientPending: true
  };
  started.state.conditions.push(condition);
  return finish(input, started, { activeConditionId: condition.id });
};

export const cowtownContextAt = (
  state: Pick<EncounterP1TransactionState, 'conditions'>,
  locationId: string
) => {
  const condition = state.conditions.find(row => row.kind === 'cowtown' && row.locationId === locationId);
  return {
    countsAsSettlement: Boolean(condition),
    permitsPreparingToLeaveServices: Boolean(condition),
    permitsBarterDuringAilments: Boolean(condition),
    nextPatientIsBaileBoCitizen: Boolean(condition?.kind === 'cowtown' && condition.nextPatientPending)
  };
};

export const consumeCowtownNextPatient = (input: TransactionEnvelope & {
  encounterId: 'cowtown-next-patient';
  locationId: string;
  patientId: string;
}): EncounterP1TransactionResolution<{ patientId: string; citizenOf: 'Baile bò' }> => {
  const started = begin<{ patientId: string; citizenOf: 'Baile bò' }>(input, 'cowtown-next-patient');
  if (isFailure(started)) return started;
  if (!input.patientId.trim()) return invalid('invalid-selection', 'The created Patient requires a stable ID.');
  const condition = started.state.conditions.find(
    row => row.kind === 'cowtown' && row.locationId === input.locationId && row.nextPatientPending
  );
  if (!condition || condition.kind !== 'cowtown') return invalid('ineligible', 'Cowtown has no pending next-Patient benefit here.');
  condition.nextPatientPending = false;
  return finish(input, started, { patientId: input.patientId, citizenOf: 'Baile bò' });
};

/** p.91: Drink Up stores one independently consumable next Mountain 7/8 ignore. */
export const resolveSpringmelt = (input: TransactionEnvelope & {
  choice: 'drink-up' | 'decline';
}): EncounterP1TransactionResolution<{ conditionId: string | null }> => {
  const started = begin<{ conditionId: string | null }>(input, ENCOUNTER_P1_IDS.springmelt);
  if (isFailure(started)) return started;
  if (input.choice === 'decline') return finish(input, started, { conditionId: null });
  if (input.choice !== 'drink-up') return invalid('invalid-choice', 'Choose whether to Drink Up.');
  const condition: EncounterP1Condition = {
    id: `${input.transactionId}:condition:springmelt`,
    kind: 'springmelt',
    sourcePage: 91,
    sourceTransactionId: input.transactionId
  };
  started.state.conditions.push(condition);
  return finish(input, started, { conditionId: condition.id });
};

export const consumeSpringmeltTravelIgnore = (input: TransactionEnvelope & {
  encounterId: 'springmelt-travel-ignore';
  conditionId: string;
  region: TravelRegion;
  travelCardValue: number;
}): EncounterP1TransactionResolution<{ ignored: true }> => {
  const started = begin<{ ignored: true }>(input, 'springmelt-travel-ignore');
  if (isFailure(started)) return started;
  const index = started.state.conditions.findIndex(row => row.id === input.conditionId && row.kind === 'springmelt');
  if (index < 0) return invalid('ineligible', 'The selected Springmelt benefit is not active.');
  if (input.region !== 'Mountain' || ![7, 8].includes(input.travelCardValue)) {
    return invalid('ineligible', 'Springmelt only ignores the next 7 or 8 drawn while Travelling along Mountain.');
  }
  started.state.conditions.splice(index, 1);
  return finish(input, started, { ignored: true });
};

export const startKnightsQuest = (input: TransactionEnvelope & {
  choice: 'accept-quest' | 'decline';
  currentJourneyId: string;
  directionSuit?: CardSuit;
  destinationLocationId?: string;
  confirmedPathDistance?: number;
}): EncounterP1TransactionResolution<{ questId: string | null }> => {
  const started = begin<{ questId: string | null }>(input, ENCOUNTER_P1_IDS.knightsQuest);
  if (isFailure(started)) return started;
  if (input.choice === 'decline') return finish(input, started, { questId: null });
  if (input.choice !== 'accept-quest') return invalid('invalid-choice', 'Choose whether to abandon the current Journey and accept the Quest.');
  if (!input.currentJourneyId.trim() || !input.destinationLocationId?.trim() || !input.directionSuit) {
    return invalid('invalid-selection', 'The Quest requires the abandoned Journey, random direction, and mapped destination.');
  }
  if (input.confirmedPathDistance !== 24) {
    return invalid('invalid-selection', 'The Quest destination must be exactly 24 Paths away.');
  }
  if (started.state.knightsQuests.some(quest => quest.status !== 'completed')) {
    return invalid('ineligible', 'Another Knights of the Round Table Quest is already active.');
  }
  started.state.conditions = started.state.conditions.filter(
    condition => condition.kind !== 'griph-trader-unavailable' || condition.journeyId !== input.currentJourneyId
  );
  const quest: KnightsQuestState = {
    id: `${input.transactionId}:quest:knights`,
    sourceTransactionId: input.transactionId,
    sourcePage: 91,
    abandonedJourneyId: input.currentJourneyId,
    season: started.state.currentSeason,
    direction: directionBySuit[input.directionSuit],
    destinationLocationId: input.destinationLocationId,
    distancePaths: 24,
    urgencyDays: 9,
    successfulAilmentIds: [],
    failedAilmentIds: [],
    status: 'active',
    arrivalDaysElapsed: null,
    combatCardValue: null,
    combatFinalValue: null
  };
  started.state.knightsQuests.push(quest);
  started.directives.push({
    kind: 'replace-active-journey-with-knights-quest',
    questId: quest.id,
    abandonedJourneyId: quest.abandonedJourneyId,
    destinationLocationId: quest.destinationLocationId,
    direction: quest.direction,
    distancePaths: 24,
    urgencyDays: 9,
    preserveSeason: true,
    patientKind: 'questing-beast'
  });
  started.directives.push({ kind: 'place-behemoth-barrow', questId: quest.id, locationId: quest.destinationLocationId });
  return finish(input, started, { questId: quest.id });
};

export const recordKnightsQuestAilment = (input: TransactionEnvelope & {
  encounterId: 'knights-quest-ailment';
  questId: string;
  ailmentId: string;
  outcome: 'success' | 'failure';
}): EncounterP1TransactionResolution<{ successes: number; failures: number }> => {
  const started = begin<{ successes: number; failures: number }>(input, 'knights-quest-ailment');
  if (isFailure(started)) return started;
  const quest = started.state.knightsQuests.find(row => row.id === input.questId && row.status === 'active');
  if (!quest || !input.ailmentId.trim()) return invalid('ineligible', 'This Ailment does not belong to an active Quest.');
  if (quest.successfulAilmentIds.includes(input.ailmentId) || quest.failedAilmentIds.includes(input.ailmentId)) {
    return invalid('already-applied', 'This Quest Ailment outcome has already been recorded.');
  }
  (input.outcome === 'success' ? quest.successfulAilmentIds : quest.failedAilmentIds).push(input.ailmentId);
  return finish(input, started, {
    successes: quest.successfulAilmentIds.length,
    failures: quest.failedAilmentIds.length
  });
};

export const resolveKnightsQuestArrival = (input: TransactionEnvelope & {
  encounterId: 'knights-quest-arrival';
  questId: string;
  currentLocationId: string;
  daysElapsed: number;
  combatCard?: EncounterP1Card;
}): EncounterP1TransactionResolution<{
  outcome: 'too-late' | 'behemoth-slain' | 'behemoth-victorious';
  finalCardValue: number | null;
}> => {
  const started = begin<{
    outcome: 'too-late' | 'behemoth-slain' | 'behemoth-victorious';
    finalCardValue: number | null;
  }>(input, 'knights-quest-arrival');
  if (isFailure(started)) return started;
  const quest = started.state.knightsQuests.find(row => row.id === input.questId && row.status === 'active');
  if (!quest || input.currentLocationId !== quest.destinationLocationId) {
    return invalid('ineligible', 'The Quest can only resolve at its Behemoth Barrow destination.');
  }
  if (!Number.isInteger(input.daysElapsed) || input.daysElapsed < 0) {
    return invalid('invalid-selection', 'Quest arrival requires the exact number of elapsed Days.');
  }
  quest.arrivalDaysElapsed = input.daysElapsed;
  if (input.daysElapsed > quest.urgencyDays) {
    if (input.combatCard) return invalid('invalid-card', 'Too Late does not draw the Behemoth combat card.');
    quest.status = 'arrived-late';
    return finish(input, started, { outcome: 'too-late', finalCardValue: null });
  }
  if (!input.combatCard || !validCard(input.combatCard)) {
    return invalid('invalid-card', 'Timely arrival requires one canonical combat card.');
  }
  const finalCardValue = input.combatCard.value - (2 * quest.failedAilmentIds.length);
  quest.combatCardValue = input.combatCard.value;
  quest.combatFinalValue = finalCardValue;
  quest.status = finalCardValue >= 7 ? 'behemoth-slain' : 'behemoth-victorious';
  return finish(input, started, { outcome: quest.status, finalCardValue });
};

export const completeKnightsQuest = (input: TransactionEnvelope & {
  encounterId: 'knights-quest-complete';
  questId: string;
  atJourneyEnd: true;
  hoardToolId?: string;
}): EncounterP1TransactionResolution<{
  reputationGained: number;
  trinketsGained: number;
  toolItemId: string | null;
}> => {
  const started = begin<{
    reputationGained: number;
    trinketsGained: number;
    toolItemId: string | null;
  }>(input, 'knights-quest-complete');
  if (isFailure(started)) return started;
  if (input.atJourneyEnd !== true) return invalid('ineligible', 'Quest rewards resolve only at the end of this Journey.');
  const quest = started.state.knightsQuests.find(row => row.id === input.questId && row.status !== 'active' && row.status !== 'completed');
  if (!quest) return invalid('ineligible', 'The Quest must reach its destination before Journey-end rewards resolve.');
  const reputationGained = quest.successfulAilmentIds.length;
  started.state.reputation += reputationGained;
  let trinketsGained = 0;
  let toolItemId: string | null = null;
  if (quest.status === 'behemoth-slain') {
    if (!input.hoardToolId) return invalid('invalid-selection', 'The slain Behemoth hoard requires one chosen Tool.');
    const item = addTool(started, input.transactionId, 'knights-hoard', input.hoardToolId, 'knights-quest-hoard');
    if (!item) return invalid('invalid-selection', 'Choose one canonical carried Tool from the hoard.');
    toolItemId = item.id;
    trinketsGained = 10;
    started.state.trinkets += 10;
  } else if (input.hoardToolId) {
    return invalid('invalid-selection', 'A Tool is only awarded when the Behemoth is slain.');
  }
  quest.status = 'completed';
  return finish(input, started, { reputationGained, trinketsGained, toolItemId });
};

export const activeKnightsQuest = (
  state: Pick<EncounterP1TransactionState, 'knightsQuests'>
): KnightsQuestState | null => state.knightsQuests.find(quest => quest.status === 'active') || null;

/** p.95: the player chooses the landing; Griph's trade lock is journey-scoped. */
export const resolveLessThanMajestic = (input: TransactionEnvelope & {
  choice: 'swoop-in' | 'stay-out';
  journeyId: string;
  chosenDestinationLocationId: string;
  selectedLandingLocationId: string;
  halfwayCandidateLocationIds: string[];
}): EncounterP1TransactionResolution<{ landingLocationId: string; reputationGained: number }> => {
  const started = begin<{ landingLocationId: string; reputationGained: number }>(input, ENCOUNTER_P1_IDS.lessThanMajestic);
  if (isFailure(started)) return started;
  if (!input.journeyId.trim() || !input.selectedLandingLocationId.trim()) {
    return invalid('invalid-selection', 'Less Than Majestic requires the active Journey and selected landing Location.');
  }
  if (input.choice === 'swoop-in') {
    if (!input.halfwayCandidateLocationIds.includes(input.selectedLandingLocationId)) {
      return invalid('invalid-selection', 'Swoop in to Help must end at a Location roughly halfway along the Flightpath.');
    }
    started.state.reputation += 1;
    started.directives.push({ kind: 'end-soar-at-location', locationId: input.selectedLandingLocationId });
    return finish(input, started, { landingLocationId: input.selectedLandingLocationId, reputationGained: 1 });
  }
  if (input.choice !== 'stay-out') return invalid('invalid-choice', 'Choose whether to help Griph.');
  if (input.selectedLandingLocationId !== input.chosenDestinationLocationId) {
    return invalid('invalid-selection', 'Stay Out of It must end at the chosen Soar destination.');
  }
  if (!started.state.conditions.some(row => row.kind === 'griph-trader-unavailable' && row.journeyId === input.journeyId)) {
    started.state.conditions.push({
      id: `${input.transactionId}:condition:griph-trader-unavailable`,
      kind: 'griph-trader-unavailable',
      sourcePage: 95,
      sourceTransactionId: input.transactionId,
      journeyId: input.journeyId
    });
  }
  started.directives.push({ kind: 'end-soar-at-location', locationId: input.selectedLandingLocationId });
  return finish(input, started, { landingLocationId: input.selectedLandingLocationId, reputationGained: 0 });
};

export const isGriphTraderAvailable = (
  state: Pick<EncounterP1TransactionState, 'conditions'>,
  journeyId: string
): boolean => !state.conditions.some(row => row.kind === 'griph-trader-unavailable' && row.journeyId === journeyId);

/**
 * p.160: the printed failure row reads "♦, ♣ or ♣". Do not silently
 * turn the duplicated Club into Spade: a Spade draw remains a player/rulebook
 * judgement until an authoritative correction is supplied.
 */
export const resolveMushroomPickers = (input: TransactionEnvelope & ({
  choice: 'junior';
  card: EncounterP1Card;
} | {
  choice: 'senior';
})): EncounterP1TransactionResolution<{ trinketsGained: number; reputationGained: number }> => {
  const started = begin<{ trinketsGained: number; reputationGained: number }>(input, ENCOUNTER_P1_IDS.mushroomPickers);
  if (isFailure(started)) return started;
  if (input.choice === 'senior') {
    started.state.reputation += 1;
    return finish(input, started, { trinketsGained: 0, reputationGained: 1 });
  }
  if (input.choice !== 'junior') return invalid('invalid-choice', 'Choose the Junior or Senior picker.');
  if (!validCard(input.card)) return invalid('invalid-card', 'Junior requires one canonical card draw.');
  if (input.card.suit === '♠') {
    return invalid(
      'ambiguous-printed-rule',
      'The printed p.160 row duplicates Club and does not define a Spade result. Resolve this draw manually; no reward or penalty was applied.'
    );
  }
  const trinketsGained = input.card.suit === '♥' ? 1 : 0;
  started.state.trinkets += trinketsGained;
  return finish(input, started, { trinketsGained, reputationGained: 0 });
};

/** p.170: Startle creates a required adjacent non-Loch Forage checkpoint. */
export const resolveGreatSilence = (input: TransactionEnvelope & ({
  choice: 'patience';
} | {
  choice: 'startle';
  sourceLocationId: string;
  targetLocationId: string;
  adjacentLocations: Array<{ locationId: string; region: TravelRegion }>;
})): EncounterP1TransactionResolution<{ timersChanged: number; pendingForageConditionId: string | null }> => {
  const started = begin<{ timersChanged: number; pendingForageConditionId: string | null }>(input, ENCOUNTER_P1_IDS.greatSilence);
  if (isFailure(started)) return started;
  if (input.choice === 'patience') {
    const timersChanged = adjustAllActiveTimers(started.state, -3);
    return finish(input, started, { timersChanged, pendingForageConditionId: null });
  }
  if (input.choice !== 'startle') return invalid('invalid-choice', 'Choose Patience or Startle.');
  const target = input.adjacentLocations.find(row => row.locationId === input.targetLocationId);
  if (!input.sourceLocationId.trim() || !target || target.region === 'Loch') {
    return invalid('invalid-selection', 'Startle requires one adjacent non-Loch Location.');
  }
  started.state.foragingPoints = 0;
  const condition: EncounterP1Condition = {
    id: `${input.transactionId}:condition:great-silence-forage`,
    kind: 'great-silence-forage',
    sourcePage: 170,
    sourceTransactionId: input.transactionId,
    sourceLocationId: input.sourceLocationId,
    targetLocationId: input.targetLocationId
  };
  started.state.conditions.push(condition);
  started.directives.push({
    kind: 'forage-adjacent-without-timer-decrease',
    conditionId: condition.id,
    sourceLocationId: condition.sourceLocationId,
    targetLocationId: condition.targetLocationId
  });
  return finish(input, started, { timersChanged: 0, pendingForageConditionId: condition.id });
};

export const consumeGreatSilenceForage = (input: TransactionEnvelope & {
  encounterId: 'great-silence-forage';
  conditionId: string;
  forageLocationId: string;
}): EncounterP1TransactionResolution<{ timerDecrease: 0 }> => {
  const started = begin<{ timerDecrease: 0 }>(input, 'great-silence-forage');
  if (isFailure(started)) return started;
  const index = started.state.conditions.findIndex(row => row.id === input.conditionId && row.kind === 'great-silence-forage');
  const condition = index >= 0 ? started.state.conditions[index] : null;
  if (!condition || condition.kind !== 'great-silence-forage' || condition.targetLocationId !== input.forageLocationId) {
    return invalid('ineligible', 'This Forage does not match the pending Great Silence target.');
  }
  started.state.conditions.splice(index, 1);
  return finish(input, started, { timerDecrease: 0 });
};

/** p.179: one extra draw per gathered Part in this Location, with strict > comparisons. */
export const activateFlockFullOfTrouble = (input: TransactionEnvelope & {
  locationId: string;
}): EncounterP1TransactionResolution<{ conditionId: string }> => {
  const started = begin<{ conditionId: string }>(input, ENCOUNTER_P1_IDS.flockFullOfTrouble);
  if (isFailure(started)) return started;
  if (!input.locationId.trim()) return invalid('invalid-selection', 'Flock Full of Trouble requires the current Location.');
  const existing = started.state.conditions.find(row => row.kind === 'flock-full-of-trouble' && row.locationId === input.locationId);
  if (existing) return finish(input, started, { conditionId: existing.id });
  const condition: EncounterP1Condition = {
    id: `${input.transactionId}:condition:flock-full-of-trouble`,
    kind: 'flock-full-of-trouble',
    sourcePage: 179,
    sourceTransactionId: input.transactionId,
    locationId: input.locationId
  };
  started.state.conditions.push(condition);
  return finish(input, started, { conditionId: condition.id });
};

export const resolveFlockGather = (input: TransactionEnvelope & {
  encounterId: 'flock-full-of-trouble-gather';
  conditionId: string;
  locationId: string;
  originalForageCard: EncounterP1Card;
  sheepCard: EncounterP1Card;
  effectiveReagentRarity: number;
  reagentId: string;
  preparationId: string;
}): EncounterP1TransactionResolution<{ reagentEaten: boolean; acquiredItemId: string | null }> => {
  const started = begin<{ reagentEaten: boolean; acquiredItemId: string | null }>(input, 'flock-full-of-trouble-gather');
  if (isFailure(started)) return started;
  const condition = started.state.conditions.find(row => row.id === input.conditionId && row.kind === 'flock-full-of-trouble');
  if (!condition || condition.kind !== 'flock-full-of-trouble' || condition.locationId !== input.locationId) {
    return invalid('ineligible', 'Flock Full of Trouble is not active at this Location.');
  }
  if (!validCard(input.originalForageCard) || !validCard(input.sheepCard)) {
    return invalid('invalid-card', 'Flock Full of Trouble requires the original Forage card and one new card.');
  }
  if (!Number.isFinite(input.effectiveReagentRarity) || input.effectiveReagentRarity < 0) {
    return invalid('invalid-selection', 'The gathered Reagent requires its effective Rarity.');
  }
  if (!canonicalPart(input.reagentId, input.preparationId)) {
    return invalid('invalid-selection', 'Choose one canonical gathered Reagent Part.');
  }
  const reagentEaten = input.sheepCard.value > input.effectiveReagentRarity
    || input.sheepCard.value > input.originalForageCard.value;
  const item = reagentEaten ? null : addCanonicalPart(
    started,
    input.transactionId,
    'flock-survived',
    input.reagentId,
    input.preparationId
  );
  return finish(input, started, { reagentEaten, acquiredItemId: item?.id || null });
};

export const resolvePasswordEncounter = (input: TransactionEnvelope & {
  choice: 'look-around' | 'leave-lock';
  locationId: string;
}): EncounterP1TransactionResolution<{ conditionId: string | null }> => {
  const started = begin<{ conditionId: string | null }>(input, ENCOUNTER_P1_IDS.password);
  if (isFailure(started)) return started;
  if (!input.locationId.trim()) return invalid('invalid-selection', 'Password requires the Titan Ruin Location.');
  if (input.choice === 'leave-lock') return finish(input, started, { conditionId: null });
  if (input.choice !== 'look-around') return invalid('invalid-choice', 'Choose whether to look for the Password symbols.');
  const existing = started.state.conditions.find(row => row.kind === 'password' && row.locationId === input.locationId);
  if (existing) return finish(input, started, { conditionId: existing.id });
  const condition: EncounterP1Condition = {
    id: `${input.transactionId}:condition:password`,
    kind: 'password',
    sourcePage: 184,
    sourceTransactionId: input.transactionId,
    locationId: input.locationId,
    status: 'looking'
  };
  started.state.conditions.push(condition);
  return finish(input, started, { conditionId: condition.id });
};

export const resolvePasswordForageChoice = (input: TransactionEnvelope & {
  encounterId: 'password-forage-choice';
  conditionId: string;
  locationId: string;
  forageCard: EncounterP1Card;
  choice: 'keep-reagent' | 'take-symbols';
}): EncounterP1TransactionResolution<{ replaceReagentWithSymbols: boolean }> => {
  const started = begin<{ replaceReagentWithSymbols: boolean }>(input, 'password-forage-choice');
  if (isFailure(started)) return started;
  const condition = started.state.conditions.find(row => row.id === input.conditionId && row.kind === 'password');
  if (!condition || condition.kind !== 'password' || condition.locationId !== input.locationId || condition.status !== 'looking') {
    return invalid('ineligible', 'The Password symbol search is not active at this Location.');
  }
  if (!validCard(input.forageCard) || ![11, 12].includes(input.forageCard.value)) {
    return invalid('ineligible', 'Password symbols can replace a Reagent only on a J or M Forage draw.');
  }
  if (input.choice === 'keep-reagent') return finish(input, started, { replaceReagentWithSymbols: false });
  if (input.choice !== 'take-symbols') return invalid('invalid-choice', 'Choose the Reagent or the Titan symbols, not both.');
  condition.status = 'symbol-found';
  started.directives.push({ kind: 'replace-forage-reagent-with-password-symbol', locationId: input.locationId });
  return finish(input, started, { replaceReagentWithSymbols: true });
};

export const openPasswordDoor = (input: TransactionEnvelope & ({
  encounterId: 'password-open-door';
  conditionId: string;
  locationId: string;
  choice: 'titan-codex';
} | {
  encounterId: 'password-open-door';
  conditionId: string;
  locationId: string;
  choice: 'establish-clinic';
  clinicName: string;
  agendaId: string;
})): EncounterP1TransactionResolution<{
  reward: 'titan-codex' | 'clinic';
  rewardId: string;
}> => {
  const started = begin<{ reward: 'titan-codex' | 'clinic'; rewardId: string }>(input, 'password-open-door');
  if (isFailure(started)) return started;
  const condition = started.state.conditions.find(row => row.id === input.conditionId && row.kind === 'password');
  if (!condition || condition.kind !== 'password' || condition.locationId !== input.locationId || condition.status !== 'symbol-found') {
    return invalid('ineligible', 'Open the Door requires the symbols found at this Titan Ruin.');
  }
  if (input.choice === 'titan-codex') {
    const item: EncounterP1InventoryItem = {
      id: `${input.transactionId}:item:titan-codex`,
      name: 'Titan Codex',
      type: 'item',
      weight: 1,
      quantity: 1,
      encounterP1: { kind: 'titan-codex', sourcePage: 184, sourceTransactionId: input.transactionId }
    };
    started.state.inventory.push(item);
    condition.status = 'door-opened';
    return finish(input, started, { reward: 'titan-codex', rewardId: item.id });
  }
  if (input.choice !== 'establish-clinic') {
    return invalid('invalid-choice', 'Open the Door grants either the Titan Codex or a Clinic.');
  }
  if (!input.clinicName.trim() || !CLINIC_AGENDA_BY_ID.has(input.agendaId)) {
    return invalid('invalid-selection', 'The Password Clinic requires a name and one canonical Agenda Service.');
  }
  if (started.state.clinics.some(clinic => clinic.locationId === input.locationId)) {
    return invalid('ineligible', 'A Clinic already exists at this Location.');
  }
  if (started.state.clinicAgendaIds.includes(input.agendaId)) {
    return invalid('invalid-selection', 'Password requires a new Service not already on the Agenda.');
  }
  const clinic: EncounterP1ClinicState = {
    id: `${input.transactionId}:clinic:password`,
    name: input.clinicName.trim(),
    locationId: input.locationId,
    commissionedSeason: started.state.currentSeason,
    completesAtSeason: started.state.currentSeason,
    status: 'active',
    gardenReagentId: null,
    gardenHarvestedAilmentIds: [],
    establishedByEncounterId: ENCOUNTER_P1_IDS.password
  };
  started.state.clinics.push(clinic);
  started.state.clinicAgendaIds.push(input.agendaId);
  condition.status = 'door-opened';
  started.directives.push({
    kind: 'establish-password-clinic',
    clinicId: clinic.id,
    locationId: clinic.locationId,
    agendaId: input.agendaId,
    bypassAgendaRequirements: true
  });
  return finish(input, started, { reward: 'clinic', rewardId: clinic.id });
};

export const redeemTitanCodex = (input: TransactionEnvelope & {
  encounterId: 'titan-codex-redemption';
  codexItemId: string;
  atJourneyEnd: boolean;
}): EncounterP1TransactionResolution<{ trinketsGained: 20 }> => {
  const started = begin<{ trinketsGained: 20 }>(input, 'titan-codex-redemption');
  if (isFailure(started)) return started;
  if (!input.atJourneyEnd) return invalid('ineligible', 'The Knowers trade the Titan Codex at Journey end.');
  const codex = started.state.inventory.find(item => item.id === input.codexItemId && item.encounterP1?.kind === 'titan-codex');
  if (!codex) return invalid('missing-resource', 'The exact Titan Codex is no longer in the Bags.');
  started.state.inventory = removeOneInventoryUnit(started.state.inventory, codex.id)!;
  started.state.trinkets += 20;
  return finish(input, started, { trinketsGained: 20 });
};

export const resolveSnapCrackleChoice = (input: TransactionEnvelope & {
  locationId: string;
  choice: 'careful' | 'quick';
}): EncounterP1TransactionResolution<{ conditionId: string; mode: 'careful' | 'quick' }> => {
  const started = begin<{ conditionId: string; mode: 'careful' | 'quick' }>(input, ENCOUNTER_P1_IDS.snapCracklePop);
  if (isFailure(started)) return started;
  if (!input.locationId.trim() || !['careful', 'quick'].includes(input.choice)) {
    return invalid('invalid-choice', 'Searching requires Careful or Quick at the current Location.');
  }
  const existing = started.state.conditions.find(row => row.kind === 'snap-crackle-pop' && row.locationId === input.locationId);
  if (existing) return invalid('ineligible', 'A Snap, Crackle, Pop search mode is already active here.');
  const condition: EncounterP1Condition = {
    id: `${input.transactionId}:condition:snap-crackle-pop`,
    kind: 'snap-crackle-pop',
    sourcePage: 186,
    sourceTransactionId: input.transactionId,
    locationId: input.locationId,
    mode: input.choice
  };
  started.state.conditions.push(condition);
  return finish(input, started, { conditionId: condition.id, mode: condition.mode });
};

/** Call after every Encounter at the Location, including Snap, Crackle, Pop itself. */
export const resolveSnapCrackleAfterEncounter = (input: TransactionEnvelope & {
  encounterId: 'snap-crackle-pop-after-encounter';
  conditionId: string;
  locationId: string;
  card?: EncounterP1Card;
}): EncounterP1TransactionResolution<{ timersChanged: number; forcedToLeave: boolean }> => {
  const started = begin<{ timersChanged: number; forcedToLeave: boolean }>(input, 'snap-crackle-pop-after-encounter');
  if (isFailure(started)) return started;
  const index = started.state.conditions.findIndex(row => row.id === input.conditionId && row.kind === 'snap-crackle-pop');
  const condition = index >= 0 ? started.state.conditions[index] : null;
  if (!condition || condition.kind !== 'snap-crackle-pop' || condition.locationId !== input.locationId) {
    return invalid('ineligible', 'Snap, Crackle, Pop is not active at this Location.');
  }
  if (condition.mode === 'careful') {
    if (input.card) return invalid('invalid-card', 'Careful decreases Timers and does not draw a danger card.');
    const timersChanged = adjustAllActiveTimers(started.state, -1);
    return finish(input, started, { timersChanged, forcedToLeave: false });
  }
  if (!input.card || !validCard(input.card)) return invalid('invalid-card', 'Quick requires one card after each Encounter.');
  const forcedToLeave = input.card.suit === '♣' || input.card.suit === '♠';
  if (forcedToLeave) {
    started.state.conditions.splice(index, 1);
    started.directives.push({ kind: 'leave-location-and-end-forage', locationId: input.locationId });
  }
  return finish(input, started, { timersChanged: 0, forcedToLeave });
};

export const resolveDamselflyTraining = (input: TransactionEnvelope & ({
  choice: 'decline';
  companionCapacity: number;
} | {
  choice: 'adopt';
  function: 'butterfly' | 'cricket';
  companionCapacity: number;
  replaceCompanionInstanceId?: string;
})): EncounterP1TransactionResolution<{ companionInstanceId: string | null; rulesAs: 'butterfly' | 'cricket' | null }> => {
  const started = begin<{ companionInstanceId: string | null; rulesAs: 'butterfly' | 'cricket' | null }>(input, ENCOUNTER_P1_IDS.damselflyTraining);
  if (isFailure(started)) return started;
  if (!Number.isInteger(input.companionCapacity) || input.companionCapacity < 0) {
    return invalid('invalid-selection', 'Companion capacity must be a non-negative whole number.');
  }
  if (input.choice === 'decline') return finish(input, started, { companionInstanceId: null, rulesAs: null });
  if (input.choice !== 'adopt' || !['butterfly', 'cricket'].includes(input.function)) {
    return invalid('invalid-choice', 'Choose whether to adopt Damselfly and, if so, one printed Companion function.');
  }
  const replaceIndex = input.replaceCompanionInstanceId
    ? started.state.companions.findIndex(row => row.instanceId === input.replaceCompanionInstanceId)
    : -1;
  if (started.state.companions.length >= input.companionCapacity && replaceIndex < 0) {
    return invalid('ineligible', 'Adopting Damselfly requires a free Companion slot or one selected Companion to release.');
  }
  if (replaceIndex >= 0) started.state.companions.splice(replaceIndex, 1);
  if (started.state.companions.length >= input.companionCapacity) {
    return invalid('ineligible', 'There is still no free Companion slot.');
  }
  const companion: EncounterP1CompanionState = {
    instanceId: `${input.transactionId}:companion:damselfly`,
    companionId: input.function,
    displayNameOverride: 'Damselfly',
    rulesAsCompanionId: input.function,
    pathsTravelled: 0,
    seasonsTravelled: 0,
    usedThisJourney: false,
    pendingForage: null,
    pendingForageDraws: 0
  };
  started.state.companions.push(companion);
  return finish(input, started, { companionInstanceId: companion.instanceId, rulesAs: input.function });
};

/** p.210 uses the source label Iron (Pellets), mapped to the canonical p.140 Iron Pebbles Part. */
export const resolveGrindingOre = (input: TransactionEnvelope & {
  choice: 'teach-fact' | 'listen';
}): EncounterP1TransactionResolution<{ ironItemId: string | null }> => {
  const started = begin<{ ironItemId: string | null }>(input, ENCOUNTER_P1_IDS.grindingOre);
  if (isFailure(started)) return started;
  if (input.choice === 'listen') return finish(input, started, { ironItemId: null });
  if (input.choice !== 'teach-fact') return invalid('invalid-choice', 'Choose whether to teach the Orebeater apprentices a new fact.');
  const iron = REAGENT_BY_NAME.get('Iron Ore');
  const pellets = iron?.preparations.find(preparation => preparation.name === 'Iron Pebbles');
  if (!iron || !pellets) return invalid('invalid-selection', 'The canonical Iron Ore (Iron Pebbles) Part is unavailable.');
  const item = addCanonicalPart(started, input.transactionId, 'orebeater-iron-pellets', iron.id, pellets.id, {
    kind: 'iron-pellets',
    sourcePage: 210,
    sourceTransactionId: input.transactionId
  });
  if (!item) return invalid('invalid-selection', 'The canonical Iron Ore (Iron Pebbles) Part is unavailable.');
  return finish(input, started, { ironItemId: item.id });
};

/** Successful Move clears only effects whose printed context ends on leaving the Location. */
export const clearEncounterP1ConditionsOnMove = (input: TransactionEnvelope & {
  encounterId: 'encounter-p1-move-complete';
}): EncounterP1TransactionResolution<{ removedConditionIds: string[] }> => {
  const started = begin<{ removedConditionIds: string[] }>(input, 'encounter-p1-move-complete');
  if (isFailure(started)) return started;
  const removable = new Set<EncounterP1Condition['kind']>([
    'cowtown',
    'flock-full-of-trouble',
    'snap-crackle-pop'
  ]);
  const removedConditionIds = started.state.conditions.filter(condition => removable.has(condition.kind)).map(condition => condition.id);
  started.state.conditions = started.state.conditions.filter(condition => !removable.has(condition.kind));
  return finish(input, started, { removedConditionIds });
};

/** Journey-end cleanup for the explicit "remainder of your Journey" Griph restriction. */
export const clearEncounterP1ConditionsAtJourneyEnd = (input: TransactionEnvelope & {
  encounterId: 'encounter-p1-journey-end';
  journeyId: string;
}): EncounterP1TransactionResolution<{ removedConditionIds: string[] }> => {
  const started = begin<{ removedConditionIds: string[] }>(input, 'encounter-p1-journey-end');
  if (isFailure(started)) return started;
  const removedConditionIds = started.state.conditions
    .filter(condition => condition.kind === 'griph-trader-unavailable' && condition.journeyId === input.journeyId)
    .map(condition => condition.id);
  started.state.conditions = started.state.conditions.filter(
    condition => condition.kind !== 'griph-trader-unavailable' || condition.journeyId !== input.journeyId
  );
  return finish(input, started, { removedConditionIds });
};
