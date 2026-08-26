import { getRuleCardLabel, getRuleCardValue, type RuleCard } from './cards';
import { AILMENT_BY_ID } from './data/ailments';
import { REAGENT_BY_ID } from './data/reagents';
import { canonicalMetadata } from './source';
import type { EngineInventoryItem, EngineJournalEvent } from './gameplay';
import type { PatientState } from './state';
import type { CardSuit, CanonicalRuleRecord, Region, RuleTag, RulesetId, Season } from './types';

export type JourneyGoalId =
  | 'self-discovery'
  | 'partnership'
  | 'responsibility'
  | 'survey'
  | 'injury'
  | 'inspiration'
  | 'knowledge'
  | 'justice'
  | 'restock'
  | 'closure'
  | 'finality'
  | 'wanderlust'
  | 'custom';

export type JourneyDirection = 'north' | 'south' | 'east' | 'west';
export type JourneyStatus = 'setup' | 'active' | 'ending' | 'completed' | 'abandoned';
export type JourneyEndingOutcome = 'success' | 'partial' | 'failure' | 'abandoned';

export interface JourneyMapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  region: Region;
  locationType: 'Wilds' | 'Settlement' | 'City' | 'Titan Ruin' | 'Behemoth Barrow';
  neighbors: string[];
}

export interface JourneyDestinationRequirements {
  distanceBand: 'near' | 'far' | 'over-horizon';
  minimumPaths: number;
  maximumPaths: number | null;
  locationType: 'Settlement' | 'City';
  direction: JourneyDirection;
}

export interface JourneyDestinationEvaluation {
  destination: JourneyMapNode;
  requirements: JourneyDestinationRequirements;
  paths: number | null;
  relativeDirections: JourneyDirection[];
  locationTypeMatches: boolean;
  directionMatches: boolean;
  distanceMatches: boolean;
  eligible: boolean;
}

export interface JourneyProgressEvent {
  id: string;
  type: 'journal' | 'encounter' | 'forage' | 'treatment' | 'visit' | 'inventory' | 'manual-declaration';
  locationId?: string;
  region?: Region;
  category?: 'beast' | 'behemoth' | 'familiar' | 'conflict' | 'survey';
  ailmentId?: string;
  reagentId?: string;
  text?: string;
}

export interface GoalEvidence {
  id: string;
  label: string;
  satisfied: boolean;
  automatic: boolean;
}

export interface GoalEvaluation {
  goalId: JourneyGoalId;
  complete: boolean;
  automaticComplete: boolean;
  evidence: GoalEvidence[];
  manualConfirmationRequired: boolean;
}

export interface JourneyGoalState {
  events: JourneyProgressEvent[];
  playerDeclaredComplete: boolean;
  gmOverride: boolean;
  evaluation: GoalEvaluation;
}

export interface LegacyJournalGoalProgress {
  counter: number;
  checklist: string[];
}

export interface JourneyState {
  journeyId: string;
  originId: string;
  season: Season;
  destinationCard?: { value: number; suit: CardSuit };
  destinationRequirements?: JourneyDestinationRequirements;
  destinationSelection?: 'draw' | 'choose';
  destinationId: string;
  reason: string;
  goalId: JourneyGoalId;
  customGoal?: { title: string; requiredState: string } | null;
  goalState: JourneyGoalState;
  urgency: { label: 'Relaxed' | 'Important' | 'Urgent' | 'Dire'; days: number };
  startDate: number;
  status: JourneyStatus;
  journalPrompts: string[];
  deviations: string[];
  rulesetId: RulesetId;
  startReputation: number;
  ending?: {
    outcome: JourneyEndingOutcome;
    journalText: string;
    endedAt: number;
  };
}

export interface JourneyEndingDraft {
  journeyId: string;
  blockers: string[];
  evaluation: GoalEvaluation;
  selectedOutcome?: JourneyEndingOutcome;
  journalText?: string;
  playerDeclaredGoalComplete?: boolean;
  gmOverride?: boolean;
  updatedAt?: number;
}

interface ForcedJourneyAbandonmentState {
  journeyActive: boolean;
  journey: JourneyState | null;
  pendingEnding: JourneyEndingDraft | null;
  downtimeRequired: boolean;
  downtimeCompleted?: boolean;
}

/**
 * Printed effects can end a Journey outside the normal memoir form. Keep the
 * canonical Journey record, its legacy activity mirror, and the p.40 Downtime
 * hand-off atomic so save/reload cannot revive the Journey.
 */
export const applyForcedJourneyAbandonment = <T extends ForcedJourneyAbandonmentState>(state: T): T => {
  const canonicalActive = state.journey?.status === 'active' || state.journey?.status === 'ending';
  if (!state.journeyActive && !canonicalActive) return state;
  return {
    ...state,
    journeyActive: false,
    journey: canonicalActive && state.journey
      ? { ...state.journey, status: 'abandoned' }
      : state.journey,
    pendingEnding: null,
    downtimeRequired: true,
    downtimeCompleted: false
  };
};

export interface JourneyGoalDefinition extends CanonicalRuleRecord {
  id: JourneyGoalId;
  cardKey: string;
  title: string;
  requiredState: string;
  progressEvents: JourneyProgressEvent['type'][];
  inventoryRequirements: string[];
  locationRequirements: string[];
  treatmentRequirements: string[];
  specialRules: string[];
}

export interface JourneyRuntimeState {
  currentLocationId: string;
  reputation: number;
  inventory: EngineInventoryItem[];
  patients: PatientState[];
  pendingEncounter: unknown | null;
  pendingBarter: unknown | null;
  pendingForaging: unknown | null;
  pendingManualEffect?: unknown | null;
  manualEffectQueue?: unknown[];
  needsLocalHelp?: boolean;
  journey: JourneyState | null;
  pendingEnding: JourneyEndingDraft | null;
  downtimeRequired: boolean;
  downtimeCompleted?: boolean;
  journalEvents: EngineJournalEvent[];
  appliedTransactionIds: string[];
}

const goal = (
  id: JourneyGoalId,
  cardKey: string,
  title: string,
  requiredState: string,
  progressEvents: JourneyProgressEvent['type'][],
  inventoryRequirements: string[] = [],
  locationRequirements: string[] = [],
  treatmentRequirements: string[] = [],
  specialRules: string[] = [],
  sourcePage = 20
): JourneyGoalDefinition => ({
  id, cardKey, title, requiredState, progressEvents, inventoryRequirements,
  locationRequirements, treatmentRequirements, specialRules, ...canonicalMetadata(sourcePage)
});

export const JOURNEY_GOALS: JourneyGoalDefinition[] = [
  goal('self-discovery', 'A', 'Self Discovery', 'Journal about 3 Encounters with Beasts and/or Behemoths.', ['journal', 'encounter']),
  goal('partnership', '2', 'Partnership', 'Journal about your Familiar 3 or more times.', ['journal']),
  goal('responsibility', '3', 'Responsibility', 'End the Journey with 5 more Guild Reputation than at its start.', ['inventory']),
  goal('survey', '4', 'Survey', 'Journal at 3 Locations of the same Region type.', ['journal', 'visit'], [], ['Three locations in one Region']),
  goal('injury', '5', 'Injury', 'Bring a Reagent with WOUND, INFECTION, or SLEEP 3 to the Destination.', ['inventory'], ['WOUND/INFECTION/SLEEP 3']),
  goal('inspiration', '6', 'Inspiration', 'Gather a Plant Reagent Part from every Region.', ['forage'], ['Plant Part from each Region']),
  goal('knowledge', '7', 'Knowledge', 'Resolve 3 or more Ailments requiring SCALE, FEATHER, or FUR.', ['treatment'], [], [], ['Three matching Ailments']),
  goal('justice', '8', 'Justice', 'Bring the starting Evidence to the Destination.', ['inventory'], ['Evidence, Weight 1'], [], [], ['Evidence is ruined if Soaked.']),
  goal('restock', '9', 'Restock', 'Bring 3 Reagents sharing the same Tag.', ['inventory'], ['Three Parts with one shared Tag'], [], [], [], 21),
  goal('closure', '10', 'Closure', 'Journal about one personal conflict 3 or more times.', ['journal'], [], [], [], ['Narrative entries remain player-authored.'], 21),
  goal('finality', 'J', 'Finality', 'Bring a Reagent with ELSEWHERE 2 or more.', ['inventory'], ['ELSEWHERE 2'], [], [], [], 21),
  goal('wanderlust', 'M', 'Wanderlust', 'Journal in Bog, Forest, Loch, Meadow, and Mountain.', ['journal', 'visit'], [], ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'], [], [], 21)
];

export const JOURNEY_GOAL_BY_ID = new Map(JOURNEY_GOALS.map(row => [row.id, row]));

const directionBySuit: Record<CardSuit, JourneyDirection> = { '♥': 'north', '♦': 'south', '♣': 'east', '♠': 'west' };

export const getDestinationRequirements = (card: RuleCard & { suit?: CardSuit }): JourneyDestinationRequirements => {
  if (typeof card === 'number' || !card.suit) throw new Error('Destination cards require a Suit.');
  const value = getRuleCardValue(card, 'table');
  if (value <= 6) return { distanceBand: 'near', minimumPaths: 0, maximumPaths: 12, locationType: 'Settlement', direction: directionBySuit[card.suit] };
  if (value <= 9) return { distanceBand: 'far', minimumPaths: 13, maximumPaths: 24, locationType: 'Settlement', direction: directionBySuit[card.suit] };
  return { distanceBand: 'over-horizon', minimumPaths: 24, maximumPaths: null, locationType: 'City', direction: directionBySuit[card.suit] };
};

const pathDistances = (graph: Record<string, JourneyMapNode>, originId: string): Map<string, number> => {
  const distances = new Map<string, number>([[originId, 0]]);
  const queue = [originId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const nextDistance = distances.get(current)! + 1;
    for (const next of graph[current]?.neighbors || []) {
      if (!graph[next] || distances.has(next)) continue;
      distances.set(next, nextDistance);
      queue.push(next);
    }
  }
  return distances;
};

const liesInDirection = (origin: JourneyMapNode, candidate: JourneyMapNode, direction: JourneyDirection) => {
  if (direction === 'north') return candidate.y < origin.y;
  if (direction === 'south') return candidate.y > origin.y;
  if (direction === 'east') return candidate.x > origin.x;
  return candidate.x < origin.x;
};

const relativeDirectionsFrom = (origin: JourneyMapNode, candidate: JourneyMapNode): JourneyDirection[] => {
  const directions: JourneyDirection[] = [];
  if (candidate.y < origin.y) directions.push('north');
  if (candidate.y > origin.y) directions.push('south');
  if (candidate.x > origin.x) directions.push('east');
  if (candidate.x < origin.x) directions.push('west');
  return directions;
};

export const evaluateJourneyDestination = (input: {
  graph: Record<string, JourneyMapNode>;
  originId: string;
  destinationId: string;
  card: RuleCard & { suit?: CardSuit };
}): JourneyDestinationEvaluation | null => {
  const origin = input.graph[input.originId];
  const destination = input.graph[input.destinationId];
  if (!origin || !destination || origin.id === destination.id) return null;
  const requirements = getDestinationRequirements(input.card);
  const paths = pathDistances(input.graph, input.originId).get(destination.id) ?? null;
  const relativeDirections = relativeDirectionsFrom(origin, destination);
  const locationTypeMatches = destination.locationType === requirements.locationType;
  const directionMatches = relativeDirections.includes(requirements.direction);
  const distanceMatches = paths !== null
    && paths >= requirements.minimumPaths
    && (requirements.maximumPaths === null || paths <= requirements.maximumPaths);
  return {
    destination,
    requirements,
    paths,
    relativeDirections,
    locationTypeMatches,
    directionMatches,
    distanceMatches,
    eligible: locationTypeMatches && directionMatches && distanceMatches
  };
};

export const findJourneyDestinationCandidates = (input: {
  graph: Record<string, JourneyMapNode>;
  originId: string;
  card: RuleCard & { suit?: CardSuit };
}): Array<{ id: string; name: string; paths: number; region: Region; locationType: JourneyMapNode['locationType'] }> => {
  const origin = input.graph[input.originId];
  if (!origin) return [];
  const requirements = getDestinationRequirements(input.card);
  const distances = pathDistances(input.graph, input.originId);
  return Object.values(input.graph)
    .filter(node => node.id !== input.originId)
    .filter(node => node.locationType === requirements.locationType)
    .filter(node => liesInDirection(origin, node, requirements.direction))
    .map(node => ({ node, paths: distances.get(node.id) }))
    .filter((row): row is { node: JourneyMapNode; paths: number } => row.paths !== undefined)
    .filter(row => row.paths >= requirements.minimumPaths && (requirements.maximumPaths === null || row.paths <= requirements.maximumPaths))
    .sort((a, b) => a.paths - b.paths || a.node.name.localeCompare(b.node.name))
    .map(({ node, paths }) => ({ id: node.id, name: node.name, paths, region: node.region, locationType: node.locationType }));
};

export const findJourneyDestinationMapCandidates = (input: {
  graph: Record<string, JourneyMapNode>;
  originId: string;
  card: RuleCard & { suit?: CardSuit };
}): Array<{ id: string; name: string; paths: number | null; region: Region; locationType: JourneyMapNode['locationType'] }> => {
  const origin = input.graph[input.originId];
  if (!origin) return [];
  const requirements = getDestinationRequirements(input.card);
  const distances = pathDistances(input.graph, input.originId);
  return Object.values(input.graph)
    .filter(node => node.id !== input.originId)
    .filter(node => node.locationType === requirements.locationType)
    .filter(node => liesInDirection(origin, node, requirements.direction))
    .map(node => ({
      id: node.id,
      name: node.name,
      paths: distances.get(node.id) ?? null,
      region: node.region,
      locationType: node.locationType
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const listJourneyDestinationChoices = (input: {
  graph: Record<string, JourneyMapNode>;
  originId: string;
}): Array<{ id: string; name: string; paths: number | null; region: Region; locationType: JourneyMapNode['locationType'] }> => {
  if (!input.graph[input.originId]) return [];
  const distances = pathDistances(input.graph, input.originId);
  return Object.values(input.graph)
    .filter(node => node.id !== input.originId)
    .map(node => ({
      id: node.id,
      name: node.name,
      paths: distances.get(node.id) ?? null,
      region: node.region,
      locationType: node.locationType
    }))
    .sort((a, b) => (a.paths ?? Number.POSITIVE_INFINITY) - (b.paths ?? Number.POSITIVE_INFINITY)
      || a.name.localeCompare(b.name));
};

export const urgencyFor = (reputation: number): JourneyState['urgency'] => {
  if (reputation >= 35) return { label: 'Dire', days: 3 };
  if (reputation >= 25) return { label: 'Urgent', days: 6 };
  if (reputation >= 15) return { label: 'Important', days: 9 };
  return { label: 'Relaxed', days: 12 };
};

const goalIdFromCard = (card: RuleCard): JourneyGoalId => {
  const key = getRuleCardLabel(card);
  const found = JOURNEY_GOALS.find(row => row.cardKey === key);
  if (!found) throw new Error(`No Journey Goal for ${key}.`);
  return found.id;
};

const itemTags = (item: EngineInventoryItem): Partial<Record<RuleTag, number>> => {
  if (!item.canonicalReagentId || !item.preparationId) return {};
  const preparation = REAGENT_BY_ID.get(item.canonicalReagentId)?.preparations.find(row => row.id === item.preparationId);
  return Object.fromEntries((preparation?.tags || []).map(tag => [tag.tag, tag.value]));
};

const inventoryHasTag = (inventory: EngineInventoryItem[], tags: RuleTag[], threshold: number) => inventory.some(item => {
  const values = itemTags(item);
  return tags.some(tag => (values[tag] || 0) >= threshold);
});

export const evaluateJourneyGoal = (journey: JourneyState, runtime: Pick<JourneyRuntimeState, 'inventory' | 'reputation' | 'patients'>): GoalEvaluation => {
  const events = journey.goalState.events;
  const evidence: GoalEvidence[] = [];
  const add = (id: string, label: string, satisfied: boolean, automatic = true) => evidence.push({ id, label, satisfied, automatic });
  if (journey.goalId === 'self-discovery') add('encounters', 'Three Beast or Behemoth Encounter journal entries', new Set(events.filter(row => row.type === 'encounter' && ['beast', 'behemoth'].includes(row.category || '')).map(row => row.id)).size >= 3);
  if (journey.goalId === 'partnership') add('familiar', 'Three Familiar journal entries', events.filter(row => row.type === 'journal' && row.category === 'familiar').length >= 3);
  if (journey.goalId === 'responsibility') add('reputation', 'Guild Reputation increased by 5', runtime.reputation >= journey.startReputation + 5);
  if (journey.goalId === 'survey') {
    const regions = new Map<Region, Set<string>>();
    events.filter(row => row.type === 'journal' && row.category === 'survey' && row.region && row.locationId).forEach(row => {
      const set = regions.get(row.region!) || new Set<string>();
      set.add(row.locationId!);
      regions.set(row.region!, set);
    });
    add('survey', 'Journal at three Locations in one Region', [...regions.values()].some(set => set.size >= 3));
  }
  if (journey.goalId === 'injury') add('injury-reagent', 'WOUND, INFECTION, or SLEEP 3 Part in Bags', inventoryHasTag(runtime.inventory, ['WOUND', 'INFECTION', 'SLEEP'], 3));
  if (journey.goalId === 'inspiration') {
    const regions = new Set(events.filter(row => row.type === 'forage' && row.reagentId && REAGENT_BY_ID.get(row.reagentId)?.type === 'PLANT').map(row => row.region));
    ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan'].forEach(region => add(`plant-${region}`, `Plant Part gathered in ${region}`, regions.has(region as Region)));
  }
  if (journey.goalId === 'knowledge') {
    const matching = new Set(events.filter(row => row.type === 'treatment' && row.ailmentId).filter(row => {
      const ailment = AILMENT_BY_ID.get(row.ailmentId!);
      return JSON.stringify(ailment?.requirements || '').match(/SCALE|FEATHER|FUR/);
    }).map(row => row.id));
    add('knowledge', 'Three matching Ailments resolved', matching.size >= 3);
  }
  if (journey.goalId === 'justice') add('evidence', 'Original unsoaked Evidence, Weight 1', runtime.inventory.some(item => item.id === `${journey.journeyId}:evidence` && item.weight === 1));
  if (journey.goalId === 'restock') {
    const counts: Partial<Record<RuleTag, number>> = {};
    runtime.inventory.filter(item => item.type === 'reagent').forEach(item => Object.keys(itemTags(item)).forEach(tag => {
      counts[tag as RuleTag] = (counts[tag as RuleTag] || 0) + (item.quantity || 1);
    }));
    add('restock', 'Three Reagent Parts sharing one Tag', Object.values(counts).some(count => (count || 0) >= 3));
  }
  if (journey.goalId === 'closure') add('closure', 'Three player-authored conflict journal entries', events.filter(row => row.type === 'journal' && row.category === 'conflict').length >= 3, false);
  if (journey.goalId === 'finality') add('elsewhere', 'ELSEWHERE 2 Part in Bags', inventoryHasTag(runtime.inventory, ['ELSEWHERE'], 2));
  if (journey.goalId === 'wanderlust') {
    const regions = new Set(events.filter(row => row.type === 'journal').map(row => row.region));
    ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'].forEach(region => add(`visit-${region}`, `Journal in ${region}`, regions.has(region as Region), false));
  }
  if (journey.goalId === 'custom') {
    add(
      'custom-goal',
      journey.customGoal?.requiredState || journey.customGoal?.title || 'Player-invented Journey Goal',
      journey.goalState.playerDeclaredComplete,
      false
    );
  }
  const automaticComplete = evidence.length > 0 && evidence.every(row => row.satisfied);
  const manualConfirmationRequired = evidence.some(row => !row.automatic);
  const complete = automaticComplete && (!manualConfirmationRequired || journey.goalState.playerDeclaredComplete || journey.goalState.gmOverride);
  return { goalId: journey.goalId, complete, automaticComplete, evidence, manualConfirmationRequired };
};

export const resolveJourneyStart = (input: {
  transactionId: string;
  state: JourneyRuntimeState;
  graph: Record<string, JourneyMapNode>;
  originId: string;
  season: Season;
  destinationCard?: { value: number; suit: CardSuit } | null;
  destinationSelection?: 'draw' | 'choose';
  destinationDistanceConfirmed?: boolean;
  destinationId: string;
  goalCard?: RuleCard | null;
  customGoal?: { title: string; requiredState: string } | null;
  reason: string;
  startDate: number;
  rulesetId: RulesetId;
}): { status: 'resolved' | 'invalid'; value: JourneyRuntimeState | null; messages: string[] } => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Journey transaction is missing or already applied.'] };
  if (input.state.journey?.status === 'active') return { status: 'invalid', value: null, messages: ['End the active Journey first.'] };
  if (input.state.downtimeRequired) return { status: 'invalid', value: null, messages: ['Complete one Downtime activity first.'] };
  if (input.state.downtimeCompleted) return { status: 'invalid', value: null, messages: ['Resolve the Season boundary before starting the next Journey.'] };
  if (!input.reason.trim()) return { status: 'invalid', value: null, messages: ['Journey Reason is required.'] };
  const choosesDestination = input.destinationSelection === 'choose';
  if (choosesDestination) {
    if (!input.graph[input.destinationId] || input.destinationId === input.originId) {
      return { status: 'invalid', value: null, messages: ['Choose another mapped Location as the Journey Destination.'] };
    }
  } else {
    if (!input.destinationCard) return { status: 'invalid', value: null, messages: ['Draw or enter a Destination card.'] };
    const evaluation = evaluateJourneyDestination({
      graph: input.graph,
      originId: input.originId,
      destinationId: input.destinationId,
      card: input.destinationCard
    });
    if (!evaluation || !evaluation.locationTypeMatches || !evaluation.directionMatches) {
      return { status: 'invalid', value: null, messages: ['Choose a destination matching the drawn card direction and Location type.'] };
    }
    if (!evaluation.distanceMatches && !input.destinationDistanceConfirmed) {
      return { status: 'invalid', value: null, messages: ['Confirm the printed-map path band when saved connections cannot verify it.'] };
    }
  }
  const customGoal = input.customGoal && input.customGoal.title.trim() && input.customGoal.requiredState.trim()
    ? { title: input.customGoal.title.trim(), requiredState: input.customGoal.requiredState.trim() }
    : null;
  if (input.customGoal && !customGoal) {
    return { status: 'invalid', value: null, messages: ['An invented Goal needs both a purpose/title and a clear completion condition.'] };
  }
  if (!customGoal && !input.goalCard) return { status: 'invalid', value: null, messages: ['Draw, choose, or invent a Journey Goal.'] };
  const goalId: JourneyGoalId = customGoal ? 'custom' : goalIdFromCard(input.goalCard!);
  const destinationRequirements = input.destinationCard && !choosesDestination
    ? getDestinationRequirements(input.destinationCard)
    : undefined;
  const baseJourney: JourneyState = {
    journeyId: input.transactionId,
    originId: input.originId,
    season: input.season,
    ...(input.destinationCard && !choosesDestination ? {
      destinationCard: { value: getRuleCardValue(input.destinationCard), suit: input.destinationCard.suit },
      destinationRequirements
    } : {}),
    destinationSelection: choosesDestination ? 'choose' : 'draw',
    destinationId: input.destinationId,
    reason: input.reason.trim(),
    goalId,
    customGoal,
    goalState: { events: [], playerDeclaredComplete: false, gmOverride: false, evaluation: { goalId, complete: false, automaticComplete: false, evidence: [], manualConfirmationRequired: false } },
    urgency: urgencyFor(input.state.reputation),
    startDate: input.startDate,
    status: 'active',
    journalPrompts: ['What does your Origin mean to you?', 'How does this Season make you feel?', 'Why are you travelling?', 'How does the Urgency relate to your Goal?'],
    deviations: input.destinationDistanceConfirmed && !choosesDestination
      ? ['Destination path band confirmed against the map.']
      : [],
    rulesetId: input.rulesetId,
    startReputation: input.state.reputation
  };
  const inventory = goalId === 'justice'
    ? [...input.state.inventory, { id: `${input.transactionId}:evidence`, name: 'Evidence', type: 'item' as const, weight: 1, quantity: 1, ruinedWhenSoaked: true }]
    : input.state.inventory;
  const evaluation = evaluateJourneyGoal(baseJourney, { inventory, reputation: input.state.reputation, patients: input.state.patients });
  const journey = { ...baseJourney, goalState: { ...baseJourney.goalState, evaluation } };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      inventory,
      journey,
      pendingEnding: null,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'travel', title: 'Journey started',
        text: `${input.originId} to ${input.destinationId}. Reason: ${input.reason.trim()}. Goal: ${customGoal?.title || JOURNEY_GOAL_BY_ID.get(goalId)?.title}.`
      }]
    },
    messages: []
  };
};

export const recordJourneyProgress = (journey: JourneyState, event: JourneyProgressEvent, runtime: Pick<JourneyRuntimeState, 'inventory' | 'reputation' | 'patients'>): JourneyState => {
  if (journey.goalState.events.some(row => row.id === event.id)) return journey;
  const next = { ...journey, goalState: { ...journey.goalState, events: [...journey.goalState.events, event] } };
  return { ...next, goalState: { ...next.goalState, evaluation: evaluateJourneyGoal(next, runtime) } };
};

/**
 * Remove one recorded progress event and immediately rebuild the canonical
 * evaluation. Journal deletion uses this instead of mutating the event array
 * directly so a previously completed goal cannot retain stale evidence.
 */
export const removeJourneyProgress = (
  journey: JourneyState,
  eventId: string,
  runtime: Pick<JourneyRuntimeState, 'inventory' | 'reputation' | 'patients'>
): JourneyState => {
  if (!journey.goalState.events.some(row => row.id === eventId)) return journey;
  const next = {
    ...journey,
    goalState: {
      ...journey.goalState,
      events: journey.goalState.events.filter(row => row.id !== eventId)
    }
  };
  return { ...next, goalState: { ...next.goalState, evaluation: evaluateJourneyGoal(next, runtime) } };
};

/**
 * The current save schema still mirrors a small amount of goal progress in
 * legacy counter/checklist fields. Only journal-driven goals are projected
 * here; inventory, treatment, and encounter goals keep their existing legacy
 * bookkeeping.
 */
export const projectLegacyJournalGoalProgress = (journey: JourneyState): LegacyJournalGoalProgress | null => {
  const journalEvents = journey.goalState.events.filter(row => row.type === 'journal');
  if (journey.goalId === 'partnership') {
    return {
      counter: journalEvents.filter(row => row.category === 'familiar').length,
      checklist: []
    };
  }
  if (journey.goalId === 'closure') {
    return {
      counter: journalEvents.filter(row => row.category === 'conflict').length,
      checklist: []
    };
  }
  if (journey.goalId === 'survey') {
    const seenLocations = new Set<string>();
    const checklist: string[] = [];
    journalEvents.forEach(event => {
      if (event.category !== 'survey' || !event.region || !event.locationId) return;
      const key = `${event.region}:${event.locationId}`;
      if (seenLocations.has(key)) return;
      seenLocations.add(key);
      checklist.push(event.region);
    });
    const counts = checklist.reduce<Record<string, number>>((result, region) => {
      result[region] = (result[region] || 0) + 1;
      return result;
    }, {});
    return {
      counter: Math.max(0, ...Object.values(counts)),
      checklist
    };
  }
  if (journey.goalId === 'wanderlust') {
    const requiredRegions = new Set<Region>(['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain']);
    const checklist = Array.from(new Set(journalEvents
      .map(row => row.region)
      .filter((region): region is Region => Boolean(region && requiredRegions.has(region)))));
    return { counter: checklist.length, checklist };
  }
  return null;
};

const sameStringList = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const listCounts = (values: readonly string[]) => values.reduce<Record<string, number>>((result, value) => {
  result[value] = (result[value] || 0) + 1;
  return result;
}, {});

/**
 * Apply only the canonical transition's delta to mirrored legacy progress.
 * Exact current-schema mirrors become exactly equal to the new projection,
 * while additional progress from older/imported saves is preserved.
 */
export const reconcileLegacyJournalGoalProgress = ({
  counter,
  checklist,
  beforeJourney,
  afterJourney
}: {
  counter: number;
  checklist: readonly string[];
  beforeJourney: JourneyState;
  afterJourney: JourneyState;
}): LegacyJournalGoalProgress => {
  const before = projectLegacyJournalGoalProgress(beforeJourney);
  const after = projectLegacyJournalGoalProgress(afterJourney);
  if (!before || !after) return { counter, checklist: [...checklist] };

  const nextCounter = counter === before.counter
    ? after.counter
    : Math.max(0, counter + after.counter - before.counter);
  if (sameStringList(checklist, before.checklist)) {
    return { counter: nextCounter, checklist: [...after.checklist] };
  }

  const beforeCounts = listCounts(before.checklist);
  const afterCounts = listCounts(after.checklist);
  const removals = Object.fromEntries(Object.entries(beforeCounts).map(([value, count]) => [
    value,
    Math.max(0, count - (afterCounts[value] || 0))
  ]));
  const additions = Object.fromEntries(Object.entries(afterCounts).map(([value, count]) => [
    value,
    Math.max(0, count - (beforeCounts[value] || 0))
  ]));
  const nextChecklist = checklist.filter(value => {
    if (!removals[value]) return true;
    removals[value] -= 1;
    return false;
  });
  Object.entries(additions).forEach(([value, count]) => {
    for (let index = 0; index < count; index += 1) nextChecklist.push(value);
  });
  return { counter: nextCounter, checklist: nextChecklist };
};

export const resolveJourneyEnding = (input: {
  transactionId: string;
  state: JourneyRuntimeState;
  endedAt: number;
  outcome?: JourneyEndingOutcome;
  journalText?: string;
  playerDeclaredGoalComplete?: boolean;
  gmOverride?: boolean;
  journeyStakesEnabled?: boolean;
}): { status: 'resolved' | 'manual' | 'invalid'; value: JourneyRuntimeState | null; messages: string[] } => {
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Ending transaction was already applied.'] };
  }
  const journey = input.state.journey;
  if (!journey || !['active', 'ending'].includes(journey.status)) return { status: 'invalid', value: null, messages: ['There is no active Journey to end.'] };
  const savedDraft = input.state.pendingEnding?.journeyId === journey.journeyId
    ? input.state.pendingEnding
    : null;
  if (journey.status === 'ending' && input.state.pendingEnding && !savedDraft) {
    return { status: 'invalid', value: null, messages: ['The saved Journey ending belongs to another Journey.'] };
  }
  const blockers: string[] = [];
  if (input.state.currentLocationId !== journey.destinationId) blockers.push('You have not arrived at the canonical Destination.');
  if (input.state.pendingEncounter) blockers.push('Resolve the pending Encounter.');
  if (input.state.pendingBarter) blockers.push('Resolve the pending Barter.');
  if (input.state.pendingForaging) blockers.push('Resolve the pending Foraging action.');
  if (input.state.pendingManualEffect || (input.state.manualEffectQueue?.length || 0) > 0) blockers.push('Resolve the pending manual effect.');
  if (input.state.needsLocalHelp) blockers.push('Resolve a local beast’s Ailment before ending the Move at this Location.');
  if (input.state.patients.some(patient => patient.status === 'active' && (patient.ailments.some(row => row.status === 'active') || patient.timers.some(row => row.status === 'active')))) blockers.push('Resolve or leave every active Patient and Timer.');
  if (blockers.length > 0) return { status: 'invalid', value: null, messages: blockers };
  const selectedOutcome = input.outcome ?? savedDraft?.selectedOutcome;
  const journalText = input.journalText ?? savedDraft?.journalText;
  const playerDeclaredGoalComplete = input.playerDeclaredGoalComplete
    ?? savedDraft?.playerDeclaredGoalComplete
    ?? journey.goalState.playerDeclaredComplete;
  const gmOverride = input.gmOverride ?? savedDraft?.gmOverride ?? journey.goalState.gmOverride;
  const declaredJourney = {
    ...journey,
    goalState: {
      ...journey.goalState,
      playerDeclaredComplete: Boolean(playerDeclaredGoalComplete),
      gmOverride: Boolean(gmOverride)
    }
  };
  const evaluation = evaluateJourneyGoal(declaredJourney, input.state);
  const evaluatedJourney = { ...declaredJourney, goalState: { ...declaredJourney.goalState, evaluation } };
  // Merely reopening a saved ending is a read/resume operation. Even a fully
  // populated draft must not commit until this invocation explicitly supplies
  // the memoir text as the final confirmation step.
  const commitRequested = typeof input.journalText === 'string';
  if (!commitRequested || !selectedOutcome || !journalText?.trim()) {
    return {
      status: 'manual',
      value: {
        ...input.state,
        journey: { ...evaluatedJourney, status: 'ending' },
        pendingEnding: {
          journeyId: journey.journeyId,
          blockers: [],
          evaluation,
          ...(selectedOutcome ? { selectedOutcome } : {}),
          ...(journalText !== undefined ? { journalText } : {}),
          ...(playerDeclaredGoalComplete !== undefined ? { playerDeclaredGoalComplete: Boolean(playerDeclaredGoalComplete) } : {}),
          ...(gmOverride !== undefined ? { gmOverride: Boolean(gmOverride) } : {}),
          updatedAt: input.endedAt
        }
      },
      messages: ['Choose success, partial, failure, or abandoned and write the Journey ending.']
    };
  }
  if (selectedOutcome === 'success' && !evaluation.complete && !gmOverride) {
    return { status: 'invalid', value: null, messages: ['The Goal evidence does not support a successful ending. Choose partial/failure or record the required evidence.'] };
  }
  const legacyStakes = journey.rulesetId === 'legacy-campaign' && input.journeyStakesEnabled;
  const reputationChange = legacyStakes ? (selectedOutcome === 'success' ? 5 : selectedOutcome === 'failure' ? -3 : 0) : 0;
  const nextJourney: JourneyState = {
    ...evaluatedJourney,
    status: selectedOutcome === 'abandoned' ? 'abandoned' : 'completed',
    ending: { outcome: selectedOutcome, journalText: journalText.trim(), endedAt: input.endedAt }
  };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      reputation: Math.max(0, input.state.reputation + reputationChange),
      journey: nextJourney,
      pendingEnding: null,
      downtimeRequired: true,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'travel', title: `Journey ${selectedOutcome}`,
        text: journalText.trim()
      }]
    },
    messages: []
  };
};
