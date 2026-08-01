import { AILMENT_BY_ID } from './data/ailments';
import { BARROW_DELVE_BY_ID, POTENT_POISON_REAGENT_IDS, findBarrowDelve, type BarrowDelveId, type BehemothClass } from './data/barrows';
import { ALMANACK_TOOLS, TOOL_BY_ID } from './data/tools';
import { REAGENT_BY_ID } from './data/reagents';
import { getRuleCardValue, type RuleCard } from './cards';
import type { EngineInventoryItem, EngineJournalEvent, TravelGraphNode } from './gameplay';
import type { CardSuit, RuleTag } from './types';

export interface DelveItemSelection {
  itemId: string;
  reagentId: string;
  preparationId: string;
  sourceTransactionId: string;
}

export interface CanonicalBarrowRecord {
  id: string;
  name: string;
  behemothClass: BehemothClass;
  locationId: string;
  removed: boolean;
}

export interface BarrowDelveState {
  delveId: BarrowDelveId;
  barrowId: string;
  sourcePage: number;
  currentStep: 'ready' | 'challenge' | 'awaiting-choice' | 'resolved' | 'failed' | 'fled';
  challengeSuit: CardSuit;
  cards: Array<{ value?: number; suit?: CardSuit; ruleValue?: number }>;
  requirements: string[];
  selectedItems: DelveItemSelection[];
  timer: number;
  progress: number;
  unresolvedChoices: string[];
  mandatoryEffects: string[];
  reward: { trinkets: number; reputation: number; toolId?: string; carry?: number };
  failure: { code: string; description: string } | null;
  fleeState: { available: boolean; costDays: number; nextMoveSpeed: number };
  appliedEffectIds: string[];
  removedFromMap: boolean;
  journalEntries: string[];
  requiredRarities: number[];
  ailmentId: string | null;
}

export interface BarrowRuntimeState {
  currentLocationId: string;
  calendarDays: number;
  reputation: number;
  trinkets: number;
  carry: number;
  speed: number;
  inventory: EngineInventoryItem[];
  graph: Record<string, TravelGraphNode>;
  barrows: CanonicalBarrowRecord[];
  activeDelve: BarrowDelveState | null;
  movementBlocked: boolean;
  needsLocalHelp: boolean;
  nextMoveSpeedOverride: number | null;
  pursuit: { headStart: number; minimumPaths: number } | null;
  journeyEnded: boolean;
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

export interface BarrowResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: BarrowRuntimeState | null;
  messages: string[];
}

const journal = (id: string, title: string, text: string): EngineJournalEvent => ({ id, type: 'encounter', title, text });
const removeBarrow = (state: BarrowRuntimeState, barrowId: string) => ({
  ...state,
  barrows: state.barrows.map(row => row.id === barrowId ? { ...row, removed: true } : row)
});

const commit = (transactionId: string, state: BarrowRuntimeState, next: BarrowRuntimeState): BarrowRuntimeState => ({
  ...next,
  appliedTransactionIds: [...next.appliedTransactionIds, transactionId]
});

const transactionError = (transactionId: string, state: BarrowRuntimeState) => !transactionId
  ? 'Barrow action requires a transaction ID.'
  : state.appliedTransactionIds.includes(transactionId)
    ? 'This Barrow transaction has already been applied.'
    : null;

export const startBarrowDelve = (input: {
  transactionId: string;
  state: BarrowRuntimeState;
  barrowId: string;
  suit: CardSuit;
  journalNote: string;
}): BarrowResolution => {
  const error = transactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (input.state.activeDelve) return { status: 'invalid', value: null, messages: ['Finish the active Delve first.'] };
  const barrow = input.state.barrows.find(row => row.id === input.barrowId && !row.removed);
  if (!barrow || barrow.locationId !== input.state.currentLocationId) return { status: 'invalid', value: null, messages: ['The selected Barrow is not active at the current Location.'] };
  const definition = findBarrowDelve(barrow.behemothClass, input.suit);
  if (!definition) return { status: 'invalid', value: null, messages: ['No Delve matches this Behemoth and suit.'] };
  if (!input.journalNote.trim()) return { status: 'invalid', value: null, messages: ['Starting a Delve requires a journal note.'] };
  const activeDelve: BarrowDelveState = {
    delveId: definition.id,
    barrowId: barrow.id,
    sourcePage: definition.sourcePage,
    currentStep: 'ready',
    challengeSuit: input.suit,
    cards: [{ suit: input.suit }],
    requirements: definition.requiredTags.map(row => `${row.tag} ${row.value}${row.count ? ` x${row.count}` : ''}`),
    selectedItems: [],
    timer: definition.initialTimer,
    progress: 0,
    unresolvedChoices: [],
    mandatoryEffects: [],
    reward: { trinkets: 0, reputation: 0 },
    failure: null,
    fleeState: { available: true, costDays: 1, nextMoveSpeed: 1 },
    appliedEffectIds: [],
    removedFromMap: false,
    journalEntries: [`${input.transactionId}:journal`],
    requiredRarities: [],
    ailmentId: null
  };
  const next = { ...input.state, activeDelve, movementBlocked: true, needsLocalHelp: false, journalEvents: [...input.state.journalEvents, journal(`${input.transactionId}:journal`, definition.name, input.journalNote.trim())] };
  return { status: 'resolved', value: commit(input.transactionId, input.state, next), messages: [] };
};

export const beginBarrowChallenge = (transactionId: string, state: BarrowRuntimeState): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (!state.activeDelve || state.activeDelve.currentStep !== 'ready') return { status: 'invalid', value: null, messages: ['The Delve is not ready to begin.'] };
  const activeDelve = { ...state.activeDelve, currentStep: 'challenge' as const, fleeState: { ...state.activeDelve.fleeState, available: false } };
  return { status: 'resolved', value: commit(transactionId, state, { ...state, activeDelve }), messages: [] };
};

export const fleeBarrowDelve = (transactionId: string, state: BarrowRuntimeState, journalNote: string): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  if (!delve || delve.currentStep !== 'ready' || !delve.fleeState.available) return { status: 'invalid', value: null, messages: ['Flee is only available before starting the Challenge.'] };
  if (!journalNote.trim()) return { status: 'invalid', value: null, messages: ['Flee requires a journal note.'] };
  const next = {
    ...state,
    calendarDays: state.calendarDays + 1,
    activeDelve: null,
    movementBlocked: false,
    needsLocalHelp: false,
    nextMoveSpeedOverride: 1,
    journalEvents: [...state.journalEvents, journal(`${transactionId}:journal`, 'Fled the Barrow', journalNote.trim())]
  };
  return { status: 'resolved', value: commit(transactionId, state, next), messages: [] };
};

const selectedPreparations = (state: BarrowRuntimeState, selections: DelveItemSelection[]) => selections.map(selection => {
  const item = state.inventory.find(row => row.id === selection.itemId && row.canonicalReagentId === selection.reagentId && row.preparationId === selection.preparationId);
  const reagent = REAGENT_BY_ID.get(selection.reagentId);
  const preparation = reagent?.preparations.find(row => row.id === selection.preparationId);
  return item && reagent && preparation ? { selection, item, reagent, preparation } : null;
}).filter((row): row is NonNullable<typeof row> => Boolean(row));

const tagCount = (state: BarrowRuntimeState, selections: DelveItemSelection[], tag: RuleTag, threshold: number) => selectedPreparations(state, selections).filter(row => row.preparation.tags.some(value => value.tag === tag && value.value >= threshold)).length;
const tagTotal = (state: BarrowRuntimeState, selections: DelveItemSelection[], tag: RuleTag) => selectedPreparations(state, selections).reduce((sum, row) => sum + row.preparation.tags.filter(value => value.tag === tag).reduce((part, value) => part + value.value, 0), 0);

const consumeSelections = (inventory: EngineInventoryItem[], selections: DelveItemSelection[]) => {
  const ids = new Set(selections.map(row => row.itemId));
  return inventory.flatMap(item => {
    if (!ids.has(item.id)) return [item];
    const uses = item.usesRemaining ?? 1;
    return uses > 1 ? [{ ...item, usesRemaining: uses - 1 }] : [];
  });
};

export const resolveBarrowForageAttempt = (transactionId: string, state: BarrowRuntimeState): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  if (!delve || delve.currentStep !== 'challenge') return { status: 'invalid', value: null, messages: ['No active Barrow Challenge.'] };
  let timer = delve.timer;
  if (['uneasy-sleep', 'bellies-of-many', 'potent-poison'].includes(delve.delveId)) timer = Math.max(0, timer - 1);
  else if (['inside-job', 'suitable-furnishings'].includes(delve.delveId)) timer += 1;
  else return { status: 'invalid', value: null, messages: ['This Delve does not use Foraging attempts.'] };
  let currentStep: BarrowDelveState['currentStep'] = delve.currentStep;
  let failure = delve.failure;
  let next: BarrowRuntimeState = { ...state, activeDelve: { ...delve, timer, progress: delve.progress + 1 } };
  if (delve.delveId === 'uneasy-sleep' && timer === 0) {
    currentStep = 'failed';
    failure = { code: 'BEHEMOTH_PURSUIT', description: 'The Behemoth wakes and pursues the apothecary.' };
    next = { ...next, activeDelve: null, movementBlocked: false, pursuit: { headStart: 2, minimumPaths: 3 } };
  } else if (delve.delveId === 'inside-job' && timer >= 10) {
    currentStep = 'failed';
    failure = { code: 'TIMER_TEN', description: 'The plot happens before the concoction is finished.' };
    next = { ...next, activeDelve: null, movementBlocked: false, calendarDays: next.calendarDays + 1 };
  }
  if (next.activeDelve) next = { ...next, activeDelve: { ...next.activeDelve, currentStep, failure } };
  return { status: 'resolved', value: commit(transactionId, state, next), messages: failure ? [failure.description] : [] };
};

export const drawCollapsedEntranceCard = (transactionId: string, state: BarrowRuntimeState, card: RuleCard): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  if (!delve || delve.delveId !== 'collapsed-entrance' || delve.currentStep !== 'challenge') return { status: 'invalid', value: null, messages: ['Collapsed Entrance is not active.'] };
  const value = getRuleCardValue(card, 'delve');
  const previous = delve.progress;
  const progress = previous + value;
  const timer = delve.timer + 1;
  const trinkets = (previous < 15 && progress >= 15 ? 1 : 0) + (previous < 50 && progress >= 50 ? 10 : 0);
  const reputation = previous < 30 && progress >= 30 ? 5 : 0;
  let next: BarrowRuntimeState = { ...state, trinkets: state.trinkets + trinkets, reputation: state.reputation + reputation };
  const cards = [...delve.cards, { value: typeof card === 'number' ? card : 'value' in card ? card.value : card.val, ruleValue: value }];
  if (progress >= 50) {
    next = removeBarrow(next, delve.barrowId);
    next = { ...next, calendarDays: next.calendarDays + Math.floor(timer / 4), activeDelve: null, movementBlocked: false };
  } else next = { ...next, activeDelve: { ...delve, progress, timer, cards, reward: { ...delve.reward, trinkets: delve.reward.trinkets + trinkets, reputation: delve.reward.reputation + reputation } } };
  return { status: 'resolved', value: commit(transactionId, state, next), messages: [] };
};

export const bidFarewellCollapsedEntrance = (transactionId: string, state: BarrowRuntimeState): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  if (!delve || delve.delveId !== 'collapsed-entrance') return { status: 'invalid', value: null, messages: ['Collapsed Entrance is not active.'] };
  const next = { ...state, calendarDays: state.calendarDays + Math.floor(delve.timer / 4), activeDelve: null, movementBlocked: false };
  return { status: 'resolved', value: commit(transactionId, state, next), messages: [] };
};

const finishSuccessfulDelve = (transactionId: string, state: BarrowRuntimeState, delve: BarrowDelveState, updates: Partial<BarrowRuntimeState>, note: string) => {
  let next = removeBarrow({ ...state, ...updates }, delve.barrowId);
  next = { ...next, activeDelve: null, movementBlocked: false, journalEvents: [...next.journalEvents, journal(`${transactionId}:journal`, BARROW_DELVE_BY_ID.get(delve.delveId)!.name, note)] };
  return commit(transactionId, state, next);
};

export const submitBarrowRemedy = (input: { transactionId: string; state: BarrowRuntimeState; selections: DelveItemSelection[]; moveTargetId?: string; journalNote: string }): BarrowResolution => {
  const error = transactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = input.state.activeDelve;
  if (!delve || !['uneasy-sleep', 'bellies-of-many', 'inside-job'].includes(delve.delveId)) return { status: 'invalid', value: null, messages: ['This Delve does not accept a Remedy.'] };
  if (selectedPreparations(input.state, input.selections).length !== input.selections.length) return { status: 'invalid', value: null, messages: ['Every selected Part must exist in Inventory with canonical identity.'] };
  if (!input.journalNote.trim()) return { status: 'invalid', value: null, messages: ['Resolving a Delve requires a journal note.'] };
  if (delve.delveId === 'uneasy-sleep' && tagTotal(input.state, input.selections, 'SLEEP') < 6) return { status: 'invalid', value: null, messages: ['Soporific Incense requires SLEEP 6.'] };
  if (delve.delveId === 'bellies-of-many') {
    const valid = tagCount(input.state, input.selections, 'JOY', 2) >= 1
      && tagCount(input.state, input.selections, 'STOMACH', 2) >= 2
      && tagCount(input.state, input.selections, 'NERVES', 2) >= 1
      && tagCount(input.state, input.selections, 'SENSES', 3) >= 1
      && tagCount(input.state, input.selections, 'MOOD', 2) >= 1;
    if (!valid) return { status: 'invalid', value: null, messages: ['The banquet requires JOY 2, two STOMACH 2 Parts, NERVES 2, SENSES 3, and MOOD 2.'] };
  }
  if (delve.delveId === 'inside-job' && (tagTotal(input.state, input.selections, 'SLEEP') < 4 || tagTotal(input.state, input.selections, 'FOUL') < 8)) {
    return { status: 'invalid', value: null, messages: ['Nefarious Concoction requires SLEEP 4 and FOUL 8.'] };
  }
  const inventory = consumeSelections(input.state.inventory, input.selections);
  if (delve.delveId === 'uneasy-sleep') {
    const target = input.moveTargetId;
    if (!target || !input.state.graph[input.state.currentLocationId]?.edges.some(edge => edge.to === target)) return { status: 'invalid', value: null, messages: ['Uneasy Sleep success must move exactly 1 Path away.'] };
    const reward = input.state.carry * 3;
    const value = finishSuccessfulDelve(input.transactionId, input.state, delve, { inventory, trinkets: input.state.trinkets + reward, calendarDays: input.state.calendarDays + 1, currentLocationId: target }, input.journalNote.trim());
    return { status: 'resolved', value, messages: [] };
  }
  if (delve.delveId === 'bellies-of-many') {
    const thingamabob: EngineInventoryItem = { id: `${input.transactionId}:artifact`, name: 'Titan-seeking Artefact', type: 'item', weight: 1 };
    const value = finishSuccessfulDelve(input.transactionId, input.state, delve, { inventory: [...inventory, thingamabob], calendarDays: input.state.calendarDays + 1 }, input.journalNote.trim());
    return { status: 'resolved', value, messages: [] };
  }
  const reward = Math.max(0, 20 - delve.timer);
  const value = finishSuccessfulDelve(input.transactionId, input.state, delve, { inventory, trinkets: input.state.trinkets + reward, calendarDays: input.state.calendarDays + 1 }, input.journalNote.trim());
  return { status: 'resolved', value, messages: [] };
};

export const warnOthersInsideJob = (transactionId: string, state: BarrowRuntimeState, journalNote: string): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  if (!delve || delve.delveId !== 'inside-job' || !journalNote.trim()) return { status: 'invalid', value: null, messages: ['Inside Job and a journal note are required.'] };
  const value = finishSuccessfulDelve(transactionId, state, delve, { speed: Math.max(0, state.speed - 1), carry: Math.max(0, state.carry - 1) }, journalNote.trim());
  return { status: 'resolved', value, messages: [] };
};

export const drawPilferCard = (transactionId: string, state: BarrowRuntimeState, card: RuleCard, escapeItemId?: string): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  if (!delve || delve.delveId !== 'pilfer-unnoticed' || delve.currentStep !== 'challenge') return { status: 'invalid', value: null, messages: ['Pilfer Unnoticed is not active.'] };
  const value = getRuleCardValue(card, 'delve');
  const total = delve.progress + value;
  const cards = [...delve.cards, { value: typeof card === 'number' ? card : 'value' in card ? card.value : card.val, ruleValue: value }];
  if (total <= 21) return { status: 'resolved', value: commit(transactionId, state, { ...state, activeDelve: { ...delve, progress: total, cards } }), messages: [] };
  const escape = escapeItemId ? state.inventory.find(item => item.id === escapeItemId) : null;
  const escaped = escape?.canonicalToolId === 'bolts' || escape?.canonicalToolId === 'crossbow';
  const inventory = escaped ? state.inventory.filter(item => item.id !== escapeItemId) : state.inventory;
  const next = { ...state, inventory, activeDelve: null, movementBlocked: false, calendarDays: escaped ? state.calendarDays + 1 : state.calendarDays, journeyEnded: !escaped };
  return { status: escaped ? 'resolved' : 'manual', value: commit(transactionId, state, next), messages: escaped ? [] : ['The Journey ends unless a specific Tool or Benefit permits escape.'] };
};

export const standPilfer = (input: { transactionId: string; state: BarrowRuntimeState; selectedToolId?: string; journalNote: string }): BarrowResolution => {
  const error = transactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = input.state.activeDelve;
  if (!delve || delve.delveId !== 'pilfer-unnoticed' || delve.progress > 21 || delve.progress < 1) return { status: 'invalid', value: null, messages: ['A valid Pilfer total from 1 to 21 is required.'] };
  if (!input.journalNote.trim()) return { status: 'invalid', value: null, messages: ['Escaping the Barrow requires a journal note.'] };
  const exact = delve.progress === 21;
  if (exact && (!input.selectedToolId || !ALMANACK_TOOLS.some(tool => tool.id === input.selectedToolId))) return { status: 'invalid', value: null, messages: ['A total of 21 grants one real Tool choice.'] };
  const tool = exact ? TOOL_BY_ID.get(input.selectedToolId!)! : null;
  const toolItem: EngineInventoryItem[] = tool ? [{ id: `${input.transactionId}:tool`, name: tool.canonicalName, type: 'tool', weight: tool.weight, canonicalToolId: tool.id }] : [];
  const reward = exact ? 15 : Math.floor(delve.progress / 2);
  const value = finishSuccessfulDelve(input.transactionId, input.state, delve, { inventory: [...input.state.inventory, ...toolItem], trinkets: input.state.trinkets + reward, calendarDays: input.state.calendarDays + 1 }, input.journalNote.trim());
  return { status: 'resolved', value, messages: [] };
};

export const setBuildingTrustAilment = (transactionId: string, state: BarrowRuntimeState, ailmentId: string): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  const ailment = AILMENT_BY_ID.get(ailmentId);
  if (!delve || delve.delveId !== 'building-trust' || !ailment || ailment.severity !== 'intermediate') return { status: 'invalid', value: null, messages: ['Building Trust requires one drawn Intermediate Ailment.'] };
  return { status: 'resolved', value: commit(transactionId, state, { ...state, activeDelve: { ...delve, ailmentId } }), messages: [] };
};

export const resolveBuildingTrust = (input: { transactionId: string; state: BarrowRuntimeState; success: boolean; trinketEquivalent: number; journalNote: string }): BarrowResolution => {
  const error = transactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = input.state.activeDelve;
  if (!delve || delve.delveId !== 'building-trust' || !delve.ailmentId || !input.journalNote.trim()) return { status: 'invalid', value: null, messages: ['Building Trust requires its Ailment result and a journal note.'] };
  let graph = Object.fromEntries(Object.entries(input.state.graph).map(([id, node]) => [id, { ...node, edges: node.edges.map(edge => ({ ...edge })) }]));
  if (input.success && graph[input.state.currentLocationId]) graph[input.state.currentLocationId] = { ...graph[input.state.currentLocationId], locationType: 'Settlement' };
  const updates: Partial<BarrowRuntimeState> = input.success
    ? { graph, reputation: input.state.reputation + Math.max(0, input.trinketEquivalent) }
    : { calendarDays: input.state.calendarDays + 1 };
  const value = finishSuccessfulDelve(input.transactionId, input.state, delve, updates, input.journalNote.trim());
  return { status: 'resolved', value, messages: [] };
};

export const drawSuitableFurnishings = (transactionId: string, state: BarrowRuntimeState, cards: RuleCard[]): BarrowResolution => {
  const error = transactionError(transactionId, state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = state.activeDelve;
  if (!delve || delve.delveId !== 'suitable-furnishings' || cards.length !== 5) return { status: 'invalid', value: null, messages: ['Suitable Furnishings requires exactly five cards.'] };
  const requiredRarities = cards.map(card => getRuleCardValue(card, 'delve'));
  const storedCards = cards.map(card => ({ value: typeof card === 'number' ? card : 'value' in card ? card.value : card.val, ruleValue: getRuleCardValue(card, 'delve') }));
  return { status: 'resolved', value: commit(transactionId, state, { ...state, activeDelve: { ...delve, requiredRarities, cards: [...delve.cards, ...storedCards] } }), messages: [] };
};

export const resolveSuitableFurnishings = (input: { transactionId: string; state: BarrowRuntimeState; selections: DelveItemSelection[]; journalNote: string }): BarrowResolution => {
  const error = transactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = input.state.activeDelve;
  if (!delve || delve.delveId !== 'suitable-furnishings' || delve.requiredRarities.length !== 5 || input.selections.length !== 5) return { status: 'invalid', value: null, messages: ['Suitable Furnishings requires five ordered Reagents.'] };
  const rows = selectedPreparations(input.state, input.selections);
  if (rows.length !== 5 || rows.some((row, index) => row.reagent.baseRarity !== delve.requiredRarities[index])) return { status: 'invalid', value: null, messages: ['Each Reagent Base Rarity must match its card in draw order.'] };
  if (!input.journalNote.trim()) return { status: 'invalid', value: null, messages: ['Suitable Furnishings requires a journal note.'] };
  const reward = delve.timer < 10 ? { trinkets: 10, reputation: 5, days: 1 } : delve.timer < 20 ? { trinkets: 7, reputation: 0, days: 1 } : { trinkets: 1, reputation: 0, days: 2 };
  const value = finishSuccessfulDelve(input.transactionId, input.state, delve, { inventory: consumeSelections(input.state.inventory, input.selections), trinkets: input.state.trinkets + reward.trinkets, reputation: input.state.reputation + reward.reputation, calendarDays: input.state.calendarDays + reward.days }, input.journalNote.trim());
  return { status: 'resolved', value, messages: [] };
};

export const resolvePotentPoison = (input: { transactionId: string; state: BarrowRuntimeState; selections: DelveItemSelection[]; card: RuleCard; journalNote: string }): BarrowResolution => {
  const error = transactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const delve = input.state.activeDelve;
  if (!delve || delve.delveId !== 'potent-poison' || delve.timer !== 0) return { status: 'invalid', value: null, messages: ['Potent Poison resolves when its Timer reaches 0.'] };
  const rows = selectedPreparations(input.state, input.selections);
  const identities = new Set(rows.map(row => row.reagent.id));
  if (rows.length !== input.selections.length || [...identities].some(id => !POTENT_POISON_REAGENT_IDS.includes(id as typeof POTENT_POISON_REAGENT_IDS[number]))) return { status: 'invalid', value: null, messages: ['Potent Poison only counts the seven named Reagents with canonical identity.'] };
  if (!input.journalNote.trim()) return { status: 'invalid', value: null, messages: ['Potent Poison requires a journal note.'] };
  const total = getRuleCardValue(input.card, 'delve') + identities.size * 2;
  if (total < 9) {
    const next = { ...input.state, activeDelve: null, movementBlocked: false, calendarDays: input.state.calendarDays + 1, journalEvents: [...input.state.journalEvents, journal(`${input.transactionId}:journal`, 'Potent Poison Failed', input.journalNote.trim())] };
    return { status: 'resolved', value: commit(input.transactionId, input.state, next), messages: [] };
  }
  const value = finishSuccessfulDelve(input.transactionId, input.state, delve, { inventory: consumeSelections(input.state.inventory, input.selections), trinkets: input.state.trinkets + 5, carry: input.state.carry + 1, calendarDays: input.state.calendarDays + 1 }, input.journalNote.trim());
  return { status: 'resolved', value, messages: [] };
};
