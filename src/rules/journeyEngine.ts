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
  | 'wanderlust';

export type JourneyDirection = 'north' | 'south' | 'east' | 'west';
export type JourneyStatus = 'setup' | 'active' | 'ending' | 'completed' | 'abandoned';

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

export interface JourneyState {
  journeyId: string;
  originId: string;
  season: Season;
  destinationCard: { value: number; suit: CardSuit };
  destinationRequirements: JourneyDestinationRequirements;
  destinationId: string;
  reason: string;
  setupJournal?: JourneySetupJournal;
  goalId: JourneyGoalId;
  goalState: JourneyGoalState;
  urgency: { label: 'Relaxed' | 'Important' | 'Urgent' | 'Dire'; days: number };
  startDate: number;
  status: JourneyStatus;
  journalPrompts: string[];
  deviations: string[];
  rulesetId: RulesetId;
  startReputation: number;
  ending?: {
    outcome: 'success' | 'partial' | 'failure' | 'abandoned';
    journalText: string;
    endedAt: number;
  };
}

export interface JourneySetupJournal {
  originMeaning: string;
  seasonFeeling: string;
  urgencyRelation: string;
  goalContext: string;
}

export interface JourneyGoalDefinition extends CanonicalRuleRecord {
  id: JourneyGoalId;
  cardKey: string;
  title: string;
  purpose: string;
  setupPrompt: string;
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
  journey: JourneyState | null;
  pendingEnding: { journeyId: string; blockers: string[]; evaluation: GoalEvaluation } | null;
  downtimeRequired: boolean;
  journalEvents: EngineJournalEvent[];
  appliedTransactionIds: string[];
}

const goal = (
  id: JourneyGoalId,
  cardKey: string,
  title: string,
  purpose: string,
  setupPrompt: string,
  requiredState: string,
  progressEvents: JourneyProgressEvent['type'][],
  inventoryRequirements: string[] = [],
  locationRequirements: string[] = [],
  treatmentRequirements: string[] = [],
  specialRules: string[] = [],
  sourcePage = 20
): JourneyGoalDefinition => ({
  id, cardKey, title, purpose, setupPrompt, requiredState, progressEvents, inventoryRequirements,
  locationRequirements, treatmentRequirements, specialRules, ...canonicalMetadata(sourcePage)
});

export const JOURNEY_GOALS: JourneyGoalDefinition[] = [
  goal('self-discovery', 'A', 'Self Discovery', 'Something about you changed; the road may help you process it through new places and encounters.', 'What changed in you, and what do you hope the road will clarify?', 'Journal about 3 Encounters with Beasts and/or Behemoths.', ['journal', 'encounter']),
  goal('partnership', '2', 'Partnership', 'You and your Familiar have grown apart; use this Journey to reconnect.', 'How have you and your Familiar grown apart, and how might you reconnect?', 'Journal about your Familiar 3 or more times.', ['journal']),
  goal('responsibility', '3', 'Responsibility', 'The Guild supported you; now it is your turn to strengthen its standing.', 'What do you owe the Guild, and whose trust do you hope to earn?', 'End the Journey with 5 more Guild Reputation than at its start.', ['inventory']),
  goal('survey', '4', 'Survey', 'A guildmate needs local conditions examined and compared.', 'What conditions were you asked to survey, and for whom?', 'Journal at 3 Locations of the same Region type.', ['journal', 'visit'], [], ['Three locations in one Region']),
  goal('injury', '5', 'Injury', 'A severe injury left a beast in dire need of a Reagent.', 'Who was injured, what happened, and what help do they need?', 'Bring a Reagent with WOUND, INFECTION, or SLEEP 3 to the Destination.', ['inventory'], ['WOUND/INFECTION/SLEEP 3']),
  goal('inspiration', '6', 'Inspiration', 'A stagnant home needs new life gathered from across the Bristley Woods.', 'Which home needs revitalising, and what has become dull or neglected?', 'Gather a Plant Reagent Part from every Region.', ['forage'], ['Plant Part from each Region']),
  goal('knowledge', '7', 'Knowledge', 'A curious Stitcher wants patient sketches to study diverse anatomy.', 'Who requested the knowledge, and what do they hope to understand?', 'Resolve 3 or more Ailments requiring SCALE, FEATHER, or FUR.', ['treatment'], [], [], ['Three matching Ailments']),
  goal('justice', '8', 'Justice', 'You must convey evidence in a Branding case to the Destination.', 'What is the case, who was condemned, and whom does the Evidence favour?', 'Bring the starting Evidence to the Destination.', ['inventory'], ['Evidence, Weight 1'], [], [], ['Evidence is ruined if Soaked.']),
  goal('restock', '9', 'Restock', 'A retired Guild associate needs their essential herbs and cures restocked.', 'Who needs restocking, and why are they vital to their community?', 'Bring 3 Reagents sharing the same Tag.', ['inventory'], ['Three Parts with one shared Tag'], [], [], [], 21),
  goal('closure', '10', 'Closure', 'An old unresolved problem has been gnawing at you.', 'What personal conflict remains unresolved?', 'Journal about one personal conflict 3 or more times.', ['journal'], [], [], [], ['Narrative entries remain player-authored.'], 21),
  goal('finality', 'J', 'Finality', 'Someone you know is preparing for their final Journey.', 'Who is preparing to leave, and what farewell do you hope to give?', 'Bring a Reagent with ELSEWHERE 2 or more.', ['inventory'], ['ELSEWHERE 2'], [], [], [], 21),
  goal('wanderlust', 'M', 'Wanderlust', 'A feral wind has stirred your need to explore the Bristley Woods.', 'What has awakened your wanderlust, and what do you hope to discover?', 'Journal in Bog, Forest, Loch, Meadow, and Mountain.', ['journal', 'visit'], [], ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'], [], [], 21)
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

export const findJourneyDestinationCandidates = (input: {
  graph: Record<string, JourneyMapNode>;
  originId: string;
  card: RuleCard & { suit?: CardSuit };
}): Array<{ id: string; name: string; paths: number; region: Region; locationType: 'Settlement' | 'City' }> => {
  const origin = input.graph[input.originId];
  if (!origin) return [];
  const requirements = getDestinationRequirements(input.card);
  const distances = pathDistances(input.graph, input.originId);
  return Object.values(input.graph)
    .filter(node => node.id !== input.originId && node.locationType === requirements.locationType)
    .filter(node => liesInDirection(origin, node, requirements.direction))
    .map(node => ({ node, paths: distances.get(node.id) }))
    .filter((row): row is { node: JourneyMapNode & { locationType: 'Settlement' | 'City' }; paths: number } => row.paths !== undefined)
    .filter(row => row.paths >= requirements.minimumPaths && (requirements.maximumPaths === null || row.paths <= requirements.maximumPaths))
    .sort((a, b) => a.paths - b.paths || a.node.name.localeCompare(b.node.name))
    .map(({ node, paths }) => ({ id: node.id, name: node.name, paths, region: node.region, locationType: node.locationType }));
};

export const getJourneyUrgency = (reputation: number): JourneyState['urgency'] => {
  if (reputation >= 35) return { label: 'Dire', days: 3 };
  if (reputation >= 25) return { label: 'Urgent', days: 6 };
  if (reputation >= 15) return { label: 'Important', days: 9 };
  return { label: 'Relaxed', days: 12 };
};

export const getJourneyGoalForCard = (card: RuleCard): JourneyGoalDefinition => {
  const key = getRuleCardLabel(card);
  const found = JOURNEY_GOALS.find(row => row.cardKey === key);
  if (!found) throw new Error(`No Journey Goal for ${key}.`);
  return found;
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
  destinationCard: { value: number; suit: CardSuit };
  destinationId: string;
  goalCard: RuleCard;
  reason: string;
  setupJournal: JourneySetupJournal;
  startDate: number;
  rulesetId: RulesetId;
}): { status: 'resolved' | 'invalid'; value: JourneyRuntimeState | null; messages: string[] } => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Journey transaction is missing or already applied.'] };
  if (input.state.journey?.status === 'active') return { status: 'invalid', value: null, messages: ['End the active Journey first.'] };
  if (input.state.downtimeRequired) return { status: 'invalid', value: null, messages: ['Complete one Downtime activity first.'] };
  if (!input.reason.trim()) return { status: 'invalid', value: null, messages: ['Journey Reason is required.'] };
  const missingSetupEntry = (Object.entries(input.setupJournal) as Array<[keyof JourneySetupJournal, string]>).find(([, value]) => !value.trim());
  if (missingSetupEntry) return { status: 'invalid', value: null, messages: [`Journey setup journal entry is required: ${missingSetupEntry[0]}.`] };
  const candidates = findJourneyDestinationCandidates({ graph: input.graph, originId: input.originId, card: input.destinationCard });
  if (!candidates.some(row => row.id === input.destinationId)) return { status: 'invalid', value: null, messages: ['Choose a legal destination candidate for the drawn card. Redraw when no candidate exists.'] };
  const goalId = getJourneyGoalForCard(input.goalCard).id;
  const baseJourney: JourneyState = {
    journeyId: input.transactionId,
    originId: input.originId,
    season: input.season,
    destinationCard: { value: getRuleCardValue(input.destinationCard), suit: input.destinationCard.suit },
    destinationRequirements: getDestinationRequirements(input.destinationCard),
    destinationId: input.destinationId,
    reason: input.reason.trim(),
    setupJournal: {
      originMeaning: input.setupJournal.originMeaning.trim(),
      seasonFeeling: input.setupJournal.seasonFeeling.trim(),
      urgencyRelation: input.setupJournal.urgencyRelation.trim(),
      goalContext: input.setupJournal.goalContext.trim()
    },
    goalId,
    goalState: { events: [], playerDeclaredComplete: false, gmOverride: false, evaluation: { goalId, complete: false, automaticComplete: false, evidence: [], manualConfirmationRequired: false } },
    urgency: getJourneyUrgency(input.state.reputation),
    startDate: input.startDate,
    status: 'active',
    journalPrompts: ['What does your Origin mean to you?', 'How does this Season make you feel?', 'Why are you travelling?', 'How does the Urgency relate to your Goal?'],
    deviations: [],
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
        text: [
          `${input.originId} to ${input.destinationId}.`,
          `Origin: ${input.setupJournal.originMeaning.trim()}.`,
          `Season: ${input.setupJournal.seasonFeeling.trim()}.`,
          `Reason: ${input.reason.trim()}.`,
          `Goal: ${JOURNEY_GOAL_BY_ID.get(goalId)?.title} — ${input.setupJournal.goalContext.trim()}.`,
          `Urgency: ${input.setupJournal.urgencyRelation.trim()}.`
        ].join(' ')
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

export const resolveJourneyEnding = (input: {
  transactionId: string;
  state: JourneyRuntimeState;
  endedAt: number;
  outcome?: 'success' | 'partial' | 'failure' | 'abandoned';
  journalText?: string;
  playerDeclaredGoalComplete?: boolean;
  gmOverride?: boolean;
  journeyStakesEnabled?: boolean;
}): { status: 'resolved' | 'manual' | 'invalid'; value: JourneyRuntimeState | null; messages: string[] } => {
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'resolved', value: input.state, messages: ['Ending transaction was already applied.'] };
  }
  const journey = input.state.journey;
  if (!journey || journey.status !== 'active') return { status: 'invalid', value: null, messages: ['There is no active Journey to end.'] };
  const blockers: string[] = [];
  if (input.state.currentLocationId !== journey.destinationId) blockers.push('You have not arrived at the canonical Destination.');
  if (input.state.pendingEncounter) blockers.push('Resolve the pending Encounter.');
  if (input.state.pendingBarter) blockers.push('Resolve the pending Barter.');
  if (input.state.pendingForaging) blockers.push('Resolve the pending Foraging action.');
  if (input.state.patients.some(patient => patient.status === 'active' && (patient.ailments.some(row => row.status === 'active') || patient.timers.some(row => row.status === 'active')))) blockers.push('Resolve or leave every active Patient and Timer.');
  if (blockers.length > 0) return { status: 'invalid', value: null, messages: blockers };
  const declaredJourney = {
    ...journey,
    goalState: {
      ...journey.goalState,
      playerDeclaredComplete: Boolean(input.playerDeclaredGoalComplete),
      gmOverride: Boolean(input.gmOverride)
    }
  };
  const evaluation = evaluateJourneyGoal(declaredJourney, input.state);
  const evaluatedJourney = { ...declaredJourney, goalState: { ...declaredJourney.goalState, evaluation } };
  if (!input.outcome || !input.journalText?.trim()) {
    return {
      status: 'manual',
      value: { ...input.state, journey: { ...evaluatedJourney, status: 'ending' }, pendingEnding: { journeyId: journey.journeyId, blockers: [], evaluation } },
      messages: ['Choose success, partial, failure, or abandoned and write the Journey ending.']
    };
  }
  if (input.outcome === 'success' && !evaluation.complete && !input.gmOverride) {
    return { status: 'invalid', value: null, messages: ['The Goal evidence does not support a successful ending. Choose partial/failure or record the required evidence.'] };
  }
  const legacyStakes = journey.rulesetId === 'legacy-campaign' && input.journeyStakesEnabled;
  const reputationChange = legacyStakes ? (input.outcome === 'success' ? 5 : input.outcome === 'failure' ? -3 : 0) : 0;
  const nextJourney: JourneyState = {
    ...evaluatedJourney,
    status: input.outcome === 'abandoned' ? 'abandoned' : 'completed',
    ending: { outcome: input.outcome, journalText: input.journalText.trim(), endedAt: input.endedAt }
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
        id: `${input.transactionId}:journal`, type: 'travel', title: `Journey ${input.outcome}`,
        text: input.journalText.trim()
      }]
    },
    messages: []
  };
};
