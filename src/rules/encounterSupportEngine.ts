import type { ManualEffectDraft } from './almanackEngine';
import { isNearbyMapLocation, shortestPathDistance } from './serviceEngine';
import type { TravelGraphNode } from './gameplay';
import type { CardSuit, Season } from './types';

export type EncounterMapMutationKind = 'add-path' | 'block-location' | 'rarity-modifier';

export interface EncounterMapMutation {
  id: string;
  encounterId: string;
  kind: EncounterMapMutationKind;
  nodeIds: string[];
  amount?: number;
  createdSeason: Season;
  expiresAtSeason?: Season;
  active: boolean;
  transactionId: string;
  sourcePage: number;
  note: string;
}

export interface EncounterMapResolution {
  status: 'resolved' | 'invalid';
  value: {
    currentLocationId: string;
    mutations: EncounterMapMutation[];
  } | null;
  messages: string[];
}

export interface FollowUpCardResolution {
  card: { suit: CardSuit; value: number };
  label: string;
  outcome: string;
}

export interface EncounterFollowUpCardSlot {
  id: string;
  label: string;
  required: boolean;
}

const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const drawDeterministicFollowUpCard = (seed: string): { suit: CardSuit; value: number } => {
  const hash = hashSeed(seed);
  const suits: CardSuit[] = ['♥', '♦', '♣', '♠'];
  return { suit: suits[hash % suits.length], value: ((hash >>> 4) % 13) + 1 };
};

const canonicalCardValue = (value: number) => Math.min(12, Math.max(1, Math.floor(value)));
const cardValueLabel = (value: number) => canonicalCardValue(value) === 1 ? 'A' : canonicalCardValue(value) === 11 ? 'J' : canonicalCardValue(value) === 12 ? 'M' : String(canonicalCardValue(value));

const suitBranch = (text: string, suit: CardSuit): string => {
  const escaped = suit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escaped}\\s*(?:or\\s*[♥♦♣♠])?\\s*[-–—:]\\s*([\\s\\S]*?)(?=[♥♦♣♠]\\s*(?:or\\s*[♥♦♣♠])?\\s*[-–—:]|$)`, 'i'));
  return match?.[1]?.replace(/\s+/g, ' ').trim() || '';
};

export const resolveFollowUpCard = (draft: Pick<ManualEffectDraft, 'ownerId' | 'printedText'>, card: { suit: CardSuit; value: number }): FollowUpCardResolution => {
  let outcome = suitBranch(draft.printedText, card.suit);
  if (draft.ownerId === 'travel-loch-9-10-autumn') {
    outcome = card.suit === '♣' || card.suit === '♠'
      ? 'Hornweed spreads: every Reagent in the current Location has +3 Rarity until Winter.'
      : 'Hornweed does not spread; no map condition is added.';
  }
  if (draft.ownerId === 'travel-bog-j-autumn') {
    outcome = card.suit === '♥'
      ? 'Curative: record the custom mushroom Reagent described by the encounter.'
      : card.suit === '♦'
        ? 'Delicious: record the printed Trinket exchange option.'
        : 'Poisonous: Speed is halved for the printed duration.';
  }
  if (!outcome) outcome = 'Use the drawn suit and value to resolve the matching printed branch.';
  return { card, label: `${card.suit} ${cardValueLabel(card.value)}`, outcome };
};

export const encounterFollowUpCardSlots = (ownerId: string, selectedChoiceLabel = ''): EncounterFollowUpCardSlot[] => {
  if (ownerId === 'travel-loch-5-6' && /Grabby Paws/i.test(selectedChoiceLabel)) return [
    { id: 'follow-up-card-player', label: '나의 카드', required: true },
    { id: 'follow-up-card-fish', label: 'Big Fish 카드', required: true }
  ];
  if (ownerId === 'travel-loch-j-spring' && /Race/i.test(selectedChoiceLabel)) return [
    { id: 'follow-up-card-bird-1', label: '물새 카드 1', required: true },
    { id: 'follow-up-card-bird-2', label: '물새 카드 2', required: true },
    { id: 'follow-up-card-player', label: '나의 카드', required: true }
  ];
  if (ownerId === 'travel-loch-j-summer' && /Ship-to-Ship Combat/i.test(selectedChoiceLabel)) return [
    { id: 'follow-up-card-player-1', label: '나의 카드', required: true },
    { id: 'follow-up-card-player-2', label: 'Crossbow 추가 카드', required: false },
    { id: 'follow-up-card-pirates-1', label: 'Pirates 카드 1', required: true },
    { id: 'follow-up-card-pirates-2', label: 'Pirates 카드 2', required: true }
  ];
  return [];
};

export const resolveFollowUpCardSet = (
  draft: Pick<ManualEffectDraft, 'ownerId' | 'printedText'>,
  cards: Record<string, { suit: CardSuit; value: number }>
): string => {
  const main = cards['follow-up-card'];
  const value = main ? canonicalCardValue(main.value) : 0;
  if (draft.ownerId === 'travel-bog-5-6' && main) return value < 5
    ? 'A branch gives way: Mark 1 Day.'
    : value <= 9
      ? 'You find a safe way through and continue the Journey.'
      : 'The hollow opens into a fertile glen: choose one in-season Bog Reagent.';
  if (draft.ownerId === 'travel-loch-3-4' && main) return value >= 11
    ? 'A Titan wreck lies below. Journal what it looks like and what it was used for.'
    : 'A natural formation lies below. Journal how it formed here.';
  if (draft.ownerId === 'travel-loch-m-spring' && main) return value >= 11
    ? 'Move along 1 Path in the desired direction, or stay where you are.'
    : value >= 2
      ? 'Move 1 Path toward the closest shore.'
      : 'You capsize. Unless you have a Waxed Satchel, your Bags are Soaked.';
  if (draft.ownerId === 'travel-loch-5-6') {
    const player = cards['follow-up-card-player'];
    const fish = cards['follow-up-card-fish'];
    if (!player || !fish) return '';
    const playerValue = canonicalCardValue(player.value);
    const fishValue = canonicalCardValue(fish.value);
    if (playerValue > fishValue) return 'You win: gain every Part of a Big Fish Reagent.';
    if (playerValue < fishValue) return 'The fish wins: choose and lose one Item from your Bags.';
    return 'The printed rule does not define a tie. Record your table ruling before continuing.';
  }
  if (draft.ownerId === 'travel-loch-j-spring') {
    const player = cards['follow-up-card-player'];
    const birdOne = cards['follow-up-card-bird-1'];
    const birdTwo = cards['follow-up-card-bird-2'];
    if (!player || !birdOne || !birdTwo) return '';
    const playerValue = canonicalCardValue(player.value);
    const birdValue = Math.max(canonicalCardValue(birdOne.value), canonicalCardValue(birdTwo.value));
    if (playerValue > birdValue) return 'You win the race: gain 1 Trinket.';
    if (playerValue < birdValue) return 'The water bird wins: gain 1 Reputation for being a good sport.';
    return 'The printed rule does not define a tie. Record your table ruling before continuing.';
  }
  if (draft.ownerId === 'travel-loch-j-summer') {
    const playerOne = cards['follow-up-card-player-1'];
    const pirateOne = cards['follow-up-card-pirates-1'];
    const pirateTwo = cards['follow-up-card-pirates-2'];
    if (!playerOne || !pirateOne || !pirateTwo) return '';
    const playerTotal = canonicalCardValue(playerOne.value) + (cards['follow-up-card-player-2'] ? canonicalCardValue(cards['follow-up-card-player-2'].value) : 0);
    const pirateTotal = canonicalCardValue(pirateOne.value) + canonicalCardValue(pirateTwo.value);
    if (playerTotal > pirateTotal) return `You win ${playerTotal}–${pirateTotal}: escape to an adjacent Location unharmed.`;
    if (playerTotal < pirateTotal) return `The Pirates win ${pirateTotal}–${playerTotal}: you are Taken Prisoner.`;
    return `The totals tie at ${playerTotal}. The printed rule does not define a tie; record your table ruling.`;
  }
  return main ? resolveFollowUpCard(draft, main).outcome : '';
};

const action = (
  id: string,
  kind: 'record-map-change' | 'record-movement',
  label: string,
  sourceText: string
) => ({ id, kind, label, targetType: 'location' as const, sourceText });

export const enrichEncounterSupportDraft = (draft: ManualEffectDraft, selectedChoiceLabel = ''): ManualEffectDraft => {
  const inputValues = selectedChoiceLabel
    ? { ...draft.inputValues, 'printed-choice': selectedChoiceLabel }
    : draft.inputValues;
  let actionTemplates = [...draft.actionTemplates];
  let selectedActionIds = [...draft.selectedActionIds];
  const addRequiredAction = (template: ReturnType<typeof action>) => {
    if (!actionTemplates.some(row => row.id === template.id)) actionTemplates.push(template);
    if (!selectedActionIds.includes(template.id)) selectedActionIds.push(template.id);
  };

  if (draft.ownerId === 'travel-bog-j-winter' && /Stop and help/i.test(selectedChoiceLabel)) {
    addRequiredAction(action(`${draft.ownerId}:nearest-settlement`, 'record-movement', '가장 가까운 Settlement로 이동', 'Move to the nearest Settlement.'));
  }
  if (draft.ownerId === 'travel-loch-9-10-spring' && /Rescue/i.test(selectedChoiceLabel)) {
    addRequiredAction(action(`${draft.ownerId}:nearest-non-loch`, 'record-movement', '가장 가까운 non-Loch Location으로 이동', 'Move to the nearest non-Loch Location.'));
  }
  if (draft.ownerId === 'travel-forest-j-autumn') {
    const mapAction = actionTemplates.find(row => row.kind === 'record-map-change');
    if (mapAction && !selectedActionIds.includes(mapAction.id)) selectedActionIds.push(mapAction.id);
  }
  if (draft.ownerId === 'travel-loch-m-summer') {
    addRequiredAction(action(`${draft.ownerId}:retreat`, 'record-movement', '인접한 이전 Location으로 1 Path 후퇴', 'Travel back 1 Path.'));
  }

  const cardSlots = encounterFollowUpCardSlots(draft.ownerId, selectedChoiceLabel);
  const needsFollowUpCard = draft.ownerId === 'travel-loch-9-10-autumn' && /Leave It/i.test(selectedChoiceLabel)
    || draft.followUpRequirements.some(row => /draw (?:another |a )?card/i.test(row))
    || /draw (?:another |a )?card/i.test(draft.printedText);
  let inputFields = cardSlots.length > 0
    ? [...draft.inputFields.filter(field => field.type !== 'card-reference'), ...cardSlots.map(slot => ({ ...slot, type: 'card-reference' as const, helpText: '앱에서 뽑거나 실제 카드의 문양과 값을 선택하세요.' }))]
    : draft.inputFields;
  if (needsFollowUpCard && cardSlots.length === 0 && !inputFields.some(field => field.id === 'follow-up-card')) inputFields = [
    ...inputFields,
    { id: 'follow-up-card', type: 'card-reference' as const, label: '후속 카드', required: true, helpText: '앱에서 뽑거나 실제 카드의 문양과 값을 선택하세요.' }
  ];

  return { ...draft, inputFields, inputValues, actionTemplates, selectedActionIds };
};

const targetFor = (draft: ManualEffectDraft, suffix: string) => draft.actionTargets[`${draft.ownerId}:${suffix}`]?.replace(/^location:/, '') || '';

const nearestDistance = (
  graph: Record<string, TravelGraphNode>,
  currentLocationId: string,
  predicate: (node: TravelGraphNode) => boolean
) => Math.min(...Object.values(graph)
  .filter(node => node.id !== currentLocationId && predicate(node))
  .map(node => shortestPathDistance(graph, currentLocationId, node.id))
  .filter((distance): distance is number => distance !== null));

export const resolveEncounterMapConsequences = (input: {
  draft: ManualEffectDraft;
  transactionId: string;
  currentLocationId: string;
  currentSeason: Season;
  graph: Record<string, TravelGraphNode>;
  existingMutations: EncounterMapMutation[];
}): EncounterMapResolution => {
  const { draft, graph } = input;
  if (!input.transactionId || !graph[input.currentLocationId]) return { status: 'invalid', value: null, messages: ['Encounter map resolution requires a real current Location and transaction ID.'] };
  let currentLocationId = input.currentLocationId;
  const mutations: EncounterMapMutation[] = [];
  const selected = new Set(draft.selectedActionIds);
  if (draft.ownerId === 'travel-forest-j-autumn') {
    const choseCost = draft.actionTemplates.some(template => selected.has(template.id) && (template.kind === 'modify-days' || template.kind === 'remove-inventory'));
    if (!choseCost) return { status: 'invalid', value: null, messages: ['Turning Fortune requires either Marking 1 Day or losing one Reagent or Tool.'] };
  }
  const addMutation = (mutation: Omit<EncounterMapMutation, 'id' | 'encounterId' | 'transactionId' | 'sourcePage'>) => mutations.push({
    ...mutation,
    id: `${input.transactionId}:map:${mutations.length + 1}`,
    encounterId: draft.ownerId,
    transactionId: input.transactionId,
    sourcePage: draft.sourcePage
  });

  for (const template of draft.actionTemplates.filter(row => selected.has(row.id))) {
    if (template.kind !== 'record-map-change' && template.kind !== 'record-movement') continue;
    const mutatesCurrentLocation = template.kind === 'record-movement' && ['travel-bog-j-winter', 'travel-loch-9-10-spring', 'travel-loch-m-summer'].includes(draft.ownerId);
    const addsPrintedPath = template.kind === 'record-map-change' && draft.ownerId === 'travel-forest-j-autumn';
    if (!mutatesCurrentLocation && !addsPrintedPath) continue;
    const rawTarget = draft.actionTargets[template.id] || '';
    const target = rawTarget.replace(/^location:/, '');
    if (!target || !graph[target]) return { status: 'invalid', value: null, messages: [`${template.label}: choose a real map Location.`] };
    if (mutatesCurrentLocation) currentLocationId = target;
    if (addsPrintedPath) {
      if (!isNearbyMapLocation(graph, input.currentLocationId, target)) return { status: 'invalid', value: null, messages: ['The new Path must connect the current Location to another nearby Location.'] };
      if (graph[input.currentLocationId].edges.some(edge => edge.to === target)) return { status: 'invalid', value: null, messages: ['The selected Locations already have a connecting Path.'] };
      addMutation({ kind: 'add-path', nodeIds: [input.currentLocationId, target], createdSeason: input.currentSeason, active: true, note: template.sourceText });
    }
  }

  if (draft.ownerId === 'travel-bog-j-winter' && /Stop and help/i.test(String(draft.inputValues['printed-choice'] || ''))) {
    const target = targetFor(draft, 'nearest-settlement');
    const expected = nearestDistance(graph, input.currentLocationId, node => node.locationType === 'Settlement');
    const actual = target ? shortestPathDistance(graph, input.currentLocationId, target) : null;
    if (!target || graph[target]?.locationType !== 'Settlement' || actual !== expected) return { status: 'invalid', value: null, messages: ['Choose one of the nearest Settlement Locations.'] };
    currentLocationId = target;
  }
  if (draft.ownerId === 'travel-loch-9-10-spring' && /Rescue/i.test(String(draft.inputValues['printed-choice'] || ''))) {
    const target = targetFor(draft, 'nearest-non-loch');
    const expected = nearestDistance(graph, input.currentLocationId, node => node.region !== 'Loch');
    const actual = target ? shortestPathDistance(graph, input.currentLocationId, target) : null;
    if (!target || graph[target]?.region === 'Loch' || actual !== expected) return { status: 'invalid', value: null, messages: ['Choose one of the nearest non-Loch Locations.'] };
    currentLocationId = target;
  }
  if (draft.ownerId === 'travel-loch-m-summer') {
    const target = targetFor(draft, 'retreat');
    if (!target || shortestPathDistance(graph, input.currentLocationId, target) !== 1) return { status: 'invalid', value: null, messages: ['Vicious Murk requires retreating to an adjacent Location exactly 1 Path away.'] };
    addMutation({ kind: 'block-location', nodeIds: [input.currentLocationId], createdSeason: input.currentSeason, active: true, note: 'Off-limits for moving through or foraging until the end of the Season.' });
    currentLocationId = target;
  }
  if (draft.ownerId === 'travel-loch-9-10-autumn' && /Leave It/i.test(String(draft.inputValues['printed-choice'] || ''))) {
    const suit = String(draft.inputValues['follow-up-suit'] || '');
    if (suit === '♣' || suit === '♠') addMutation({ kind: 'rarity-modifier', nodeIds: [input.currentLocationId], amount: 3, createdSeason: input.currentSeason, expiresAtSeason: 'Winter', active: true, note: 'Hornweed: Reagent Rarity +3 until Winter.' });
  }

  const merged = [...input.existingMutations, ...mutations];
  return { status: 'resolved', value: { currentLocationId, mutations: merged }, messages: [] };
};

export const expireEncounterMapMutations = (mutations: EncounterMapMutation[], previousSeason: Season, nextSeason: Season) => mutations.map(mutation => {
  if (!mutation.active || previousSeason === nextSeason) return mutation;
  if (mutation.kind === 'block-location' && mutation.createdSeason === previousSeason) return { ...mutation, active: false };
  if (mutation.expiresAtSeason === nextSeason) return { ...mutation, active: false };
  return mutation;
});

export const encounterLocationConditions = (mutations: EncounterMapMutation[], locationId: string) => mutations.filter(mutation => mutation.active && mutation.nodeIds.includes(locationId));
