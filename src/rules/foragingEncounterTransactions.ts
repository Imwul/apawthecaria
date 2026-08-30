import { COMPANION_BY_ID, type CompanionState } from './data/mobility';
import { REAGENT_BY_ID, REAGENT_BY_NAME } from './data/reagents';
import { TOOL_BY_ID } from './data/tools';
import {
  ENCOUNTER_CONDITION_CODES,
  ENCOUNTER_CONDITION_OWNERS,
  storedEncounterCondition
} from './encounterConditionRuntime';
import type { EngineInventoryItem } from './gameplay';
import type { PatientState } from './state';
import type { CanonicalToolState } from './toolEngine';
import type { CardSuit, ReagentDefinition, RuleTag, Season } from './types';

export const FORAGING_ENCOUNTER_IDS = {
  rightPlaceWrongTime: 'foraging-bog-8',
  friendInNeed: 'foraging-forest-8',
  theBranded: 'foraging-forest-9-spring',
  alluringOdours: 'foraging-forest-10-spring',
  riverSnatchers: 'foraging-loch-10-spring',
  fabledBehemoth: 'foraging-loch-m-autumn',
  antHeist: 'foraging-meadow-6',
  projectLaunch: 'foraging-meadow-9-spring',
  mycophiliacs: 'foraging-meadow-m-autumn',
  lifeSavingTransplant: 'foraging-meadow-m-winter',
  stickEmUp: 'foraging-mountain-8',
  finalRestingPlace: 'foraging-titan-4',
  whatRemains: 'foraging-titan-7',
  odoakMarket: 'social-forest-odoak-♦'
} as const;

export type ForagingEncounterId = typeof FORAGING_ENCOUNTER_IDS[keyof typeof FORAGING_ENCOUNTER_IDS];

export const TRAPPED_ENCOUNTER_IDS = [
  'foraging-titan-j-spring',
  'foraging-titan-j-summer',
  'foraging-titan-j-autumn',
  'foraging-titan-j-winter'
] as const;

export const MEEK_ENCOUNTER_IDS = [
  'foraging-titan-10-spring',
  'foraging-titan-10-summer',
  'foraging-titan-10-autumn',
  'foraging-titan-10-winter'
] as const;

export interface EncounterCardResult {
  value: number;
  suit: CardSuit;
}

export interface EncounterInventoryItem extends EngineInventoryItem {
  encounterMetadata?: {
    kind: 'guild-rumour' | 'foreign-reagent' | 'weapon' | 'missing-present';
    reagentType?: ReagentDefinition['type'];
    /** Foreign Reagent is explicitly [TAG 2] on p.195. This is potency, not Base Rarity. */
    tagPotency?: number;
    preparationMethods?: string[];
    worksAgainst?: Array<'Beast' | 'Behemoth'>;
  };
}

export interface EncounterDelivery {
  id: string;
  kind: 'guild-rumour' | 'remains-news';
  sourceTransactionId: string;
  status: 'pending' | 'resolved';
  destination: { kind: 'any-settlement' } | { kind: 'location'; locationId: string };
  payloadItemId?: string;
  borrowedToolItemId?: string;
}

export interface SainDeClawsQuest {
  id: string;
  sourceTransactionId: string;
  locationId: string;
  targetCards: [EncounterCardResult, EncounterCardResult, EncounterCardResult];
  matchedTargetIndexes: number[];
  /** One printed Forage card can reveal at most one present, even if it happens
   * to match multiple target cards. */
  matchedForageTransactionIds: string[];
  returnedTargetIndexes: number[];
  status: 'finding' | 'waiting-season-end' | 'resolved';
}

export interface ForagingEncounterTransactionState {
  /** Incremented by every successful transaction. Callers must persist it. */
  revision: number;
  reputation: number;
  trinkets: number;
  foragingPoints: number;
  inventory: EncounterInventoryItem[];
  patient: PatientState | null;
  tools: CanonicalToolState[];
  companions: CompanionState[];
  conditions: string[];
  deliveries: EncounterDelivery[];
  sainDeClawsQuests: SainDeClawsQuest[];
  appliedTransactionIds: string[];
}

export interface ForagingEncounterPersistence {
  encounterDeliveries: EncounterDelivery[];
  sainDeClawsQuests: SainDeClawsQuest[];
}

export const EMPTY_FORAGING_ENCOUNTER_PERSISTENCE: ForagingEncounterPersistence = {
  encounterDeliveries: [],
  sainDeClawsQuests: []
};

/** Save-boundary normalizer for the two long-lived encounter workflows. It
 * drops malformed rows instead of inventing delivery rewards or found gifts. */
export const normalizeForagingEncounterPersistence = (value: unknown): ForagingEncounterPersistence => {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const encounterDeliveries = (Array.isArray(source.encounterDeliveries) ? source.encounterDeliveries : []).flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const candidate = row as Record<string, unknown>;
    const destination = candidate.destination && typeof candidate.destination === 'object'
      ? candidate.destination as Record<string, unknown>
      : null;
    if (typeof candidate.id !== 'string' || !candidate.id.trim()
      || typeof candidate.sourceTransactionId !== 'string' || !candidate.sourceTransactionId.trim()
      || !['guild-rumour', 'remains-news'].includes(String(candidate.kind))
      || !['pending', 'resolved'].includes(String(candidate.status))
      || !destination || !['any-settlement', 'location'].includes(String(destination.kind))
      || (destination.kind === 'location' && (typeof destination.locationId !== 'string' || !destination.locationId.trim()))) return [];
    return [{
      id: candidate.id,
      kind: candidate.kind as EncounterDelivery['kind'],
      sourceTransactionId: candidate.sourceTransactionId,
      status: candidate.status as EncounterDelivery['status'],
      destination: destination.kind === 'any-settlement'
        ? { kind: 'any-settlement' as const }
        : { kind: 'location' as const, locationId: String(destination.locationId) },
      ...(typeof candidate.payloadItemId === 'string' && candidate.payloadItemId.trim()
        ? { payloadItemId: candidate.payloadItemId }
        : {}),
      ...(typeof candidate.borrowedToolItemId === 'string' && candidate.borrowedToolItemId.trim()
        ? { borrowedToolItemId: candidate.borrowedToolItemId }
        : {})
    }];
  });
  const sainDeClawsQuests = (Array.isArray(source.sainDeClawsQuests) ? source.sainDeClawsQuests : []).flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const candidate = row as Record<string, unknown>;
    const cards = Array.isArray(candidate.targetCards) ? candidate.targetCards : [];
    if (typeof candidate.id !== 'string' || !candidate.id.trim()
      || typeof candidate.sourceTransactionId !== 'string' || !candidate.sourceTransactionId.trim()
      || typeof candidate.locationId !== 'string' || !candidate.locationId.trim()
      || cards.length !== 3 || cards.some(card => !cardIsValid(card as EncounterCardResult))
      || !['finding', 'waiting-season-end', 'resolved'].includes(String(candidate.status))) return [];
    const indexes = (input: unknown) => [...new Set((Array.isArray(input) ? input : [])
      .filter(index => Number.isInteger(index) && Number(index) >= 0 && Number(index) < 3)
      .map(Number))].sort((a, b) => a - b);
    const matchedTargetIndexes = indexes(candidate.matchedTargetIndexes);
    const returnedTargetIndexes = indexes(candidate.returnedTargetIndexes)
      .filter(index => matchedTargetIndexes.includes(index));
    return [{
      id: candidate.id,
      sourceTransactionId: candidate.sourceTransactionId,
      locationId: candidate.locationId,
      targetCards: cards.map(card => ({
        value: Number((card as Record<string, unknown>).value),
        suit: (card as Record<string, unknown>).suit as CardSuit
      })) as SainDeClawsQuest['targetCards'],
      matchedTargetIndexes,
      matchedForageTransactionIds: [...new Set((Array.isArray(candidate.matchedForageTransactionIds)
        ? candidate.matchedForageTransactionIds : []).filter((id): id is string => typeof id === 'string' && Boolean(id.trim())))],
      returnedTargetIndexes,
      status: candidate.status as SainDeClawsQuest['status']
    }];
  });
  return { encounterDeliveries, sainDeClawsQuests };
};

export type ForagingEncounterDirective =
  | { kind: 'move-to-nearest-settlement-and-abandon-journey'; sourcePage: 155 }
  | { kind: 'start-lesser-ailment-before-overstay'; sourcePage: 162 }
  | { kind: 'leave-current-location'; sourcePage: 170 }
  | { kind: 'invent-forest-fair-reagent'; sourcePage: 162 }
  | { kind: 'may-retry-trapped-rescue'; sourcePage: 187 }
  | { kind: 'released-trapped-beast'; sourcePage: 187 };

export interface ForagingEncounterTransactionValue {
  nextState: ForagingEncounterTransactionState;
  directives: ForagingEncounterDirective[];
  messages: string[];
}

export interface ForagingEncounterTransactionResolution {
  status: 'resolved' | 'invalid';
  value: ForagingEncounterTransactionValue | null;
  code?:
    | 'missing-transaction-id'
    | 'already-applied'
    | 'stale-state'
    | 'wrong-encounter'
    | 'invalid-card'
    | 'invalid-choice'
    | 'ineligible'
    | 'missing-resource'
    | 'invalid-selection'
    | 'ambiguous-tie';
  messages: string[];
}

interface TransactionEnvelope {
  transactionId: string;
  encounterId: string;
  expectedRevision: number;
  state: ForagingEncounterTransactionState;
}

type MutableResolution = {
  state: ForagingEncounterTransactionState;
  directives: ForagingEncounterDirective[];
  messages: string[];
};

const invalid = (
  code: NonNullable<ForagingEncounterTransactionResolution['code']>,
  message: string
): ForagingEncounterTransactionResolution => ({ status: 'invalid', value: null, code, messages: [message] });

const clonePatient = (patient: PatientState | null): PatientState | null => patient ? {
  ...patient,
  ailments: patient.ailments.map(row => ({ ...row, timerIds: [...row.timerIds], conditionIds: [...row.conditionIds], treatmentHistoryIds: [...row.treatmentHistoryIds], specialState: { ...row.specialState }, effectIds: [...row.effectIds] })),
  timers: patient.timers.map(row => ({ ...row })),
  conditions: patient.conditions.map(row => ({ ...row })),
  treatmentHistory: patient.treatmentHistory.map(row => ({ ...row, ailmentInstanceIds: [...row.ailmentInstanceIds], preparationIds: [...row.preparationIds], providedTags: { ...row.providedTags }, effects: [...row.effects] })),
  journalEvents: patient.journalEvents.map(row => ({ ...row })),
  reagentsGathered: patient.reagentsGathered ? [...patient.reagentsGathered] : undefined
} : null;

const cloneState = (state: ForagingEncounterTransactionState): ForagingEncounterTransactionState => ({
  ...state,
  inventory: state.inventory.map(item => ({
    ...item,
    customReagent: item.customReagent ? { ...item.customReagent } : undefined,
    guildNote: item.guildNote ? { ...item.guildNote } : undefined,
    provenance: item.provenance ? { ...item.provenance } : undefined,
    encounterMetadata: item.encounterMetadata ? {
      ...item.encounterMetadata,
      preparationMethods: item.encounterMetadata.preparationMethods ? [...item.encounterMetadata.preparationMethods] : undefined,
      worksAgainst: item.encounterMetadata.worksAgainst ? [...item.encounterMetadata.worksAgainst] : undefined
    } : undefined
  })),
  patient: clonePatient(state.patient),
  tools: state.tools.map(tool => ({ ...tool, appliedEffectIds: [...tool.appliedEffectIds] })),
  companions: state.companions.map(companion => ({ ...companion })),
  conditions: [...state.conditions],
  deliveries: state.deliveries.map(delivery => ({ ...delivery, destination: { ...delivery.destination } })),
  sainDeClawsQuests: state.sainDeClawsQuests.map(quest => ({
    ...quest,
    targetCards: quest.targetCards.map(card => ({ ...card })) as SainDeClawsQuest['targetCards'],
    matchedTargetIndexes: [...quest.matchedTargetIndexes],
    matchedForageTransactionIds: [...(quest.matchedForageTransactionIds || [])],
    returnedTargetIndexes: [...quest.returnedTargetIndexes]
  })),
  appliedTransactionIds: [...state.appliedTransactionIds]
});

const begin = (
  input: TransactionEnvelope,
  expectedEncounterId: string
): MutableResolution | ForagingEncounterTransactionResolution => {
  if (!input.transactionId.trim()) return invalid('missing-transaction-id', 'Encounter transaction requires a stable transaction ID.');
  if (input.encounterId !== expectedEncounterId) return invalid('wrong-encounter', `Expected ${expectedEncounterId}, received ${input.encounterId}.`);
  if (input.state.appliedTransactionIds.includes(input.transactionId)) return invalid('already-applied', 'This encounter transaction has already been applied.');
  if (input.expectedRevision !== input.state.revision) return invalid('stale-state', 'The campaign changed after this encounter choice was opened. Refresh the choice and try again.');
  return { state: cloneState(input.state), directives: [], messages: [] };
};

const beginOneOf = (
  input: TransactionEnvelope,
  expectedEncounterIds: readonly string[]
): MutableResolution | ForagingEncounterTransactionResolution => {
  if (!expectedEncounterIds.includes(input.encounterId)) {
    return invalid('wrong-encounter', `Expected one of ${expectedEncounterIds.join(', ')}, received ${input.encounterId}.`);
  }
  return begin(input, input.encounterId);
};

const isFailure = (value: MutableResolution | ForagingEncounterTransactionResolution): value is ForagingEncounterTransactionResolution => 'status' in value;

const finish = (input: TransactionEnvelope, mutable: MutableResolution): ForagingEncounterTransactionResolution => {
  mutable.state.revision = input.state.revision + 1;
  mutable.state.appliedTransactionIds.push(input.transactionId);
  return {
    status: 'resolved',
    value: { nextState: mutable.state, directives: mutable.directives, messages: mutable.messages },
    messages: mutable.messages
  };
};

const cardIsValid = (card: EncounterCardResult): boolean => Number.isInteger(card.value)
  && card.value >= 1
  && card.value <= 12
  && ['♥', '♦', '♣', '♠'].includes(card.suit);

const quantity = (item: EngineInventoryItem): number => Math.max(1, Math.floor(Number(item.quantity) || 1));

const removeOneInventoryUnit = (inventory: EncounterInventoryItem[], itemId: string): EncounterInventoryItem[] | null => {
  const index = inventory.findIndex(item => item.id === itemId);
  if (index < 0) return null;
  const item = inventory[index];
  return inventory.flatMap((candidate, candidateIndex) => candidateIndex !== index
    ? [candidate]
    : quantity(item) > 1 ? [{ ...item, quantity: quantity(item) - 1 }] : []);
};

const removeToolStateIfGone = (state: ForagingEncounterTransactionState, itemId: string): void => {
  if (!state.inventory.some(item => item.id === itemId)) {
    state.tools = state.tools.filter(tool => tool.instanceId !== itemId);
  }
};

const hasCanonicalTool = (state: ForagingEncounterTransactionState, toolId: string): boolean => state.inventory.some(
  item => item.type === 'tool' && item.canonicalToolId === toolId && quantity(item) > 0
);

const canonicalPart = (reagentId: string, preparationId: string) => {
  const reagent = REAGENT_BY_ID.get(reagentId);
  const preparation = reagent?.preparations.find(row => row.id === preparationId);
  return reagent && preparation ? { reagent, preparation } : null;
};

const canonicalPartItem = (
  transactionId: string,
  acquisitionKey: string,
  reagentId: string,
  preparationId: string
): EncounterInventoryItem | null => {
  const selected = canonicalPart(reagentId, preparationId);
  if (!selected) return null;
  return {
    id: `${transactionId}:inventory:${acquisitionKey}:${selected.preparation.id}`,
    name: `${selected.reagent.canonicalName} (${selected.preparation.name}, ${selected.preparation.method})`,
    type: 'reagent',
    weight: selected.preparation.weight,
    quantity: 1,
    canonicalReagentId: selected.reagent.id,
    preparationId: selected.preparation.id,
    usesRemaining: selected.preparation.uses,
    ruinedWhenSoaked: true
  };
};

const addCanonicalPart = (
  mutable: MutableResolution,
  transactionId: string,
  acquisitionKey: string,
  reagentId: string,
  preparationId: string
): boolean => {
  const item = canonicalPartItem(transactionId, acquisitionKey, reagentId, preparationId);
  if (!item || mutable.state.inventory.some(row => row.id === item.id)) return false;
  mutable.state.inventory.push(item);
  return true;
};

const addCanonicalTool = (
  mutable: MutableResolution,
  transactionId: string,
  acquisitionKey: string,
  toolId: string,
  acquiredBy: string
): boolean => {
  const definition = TOOL_BY_ID.get(toolId);
  const instanceId = `${transactionId}:tool:${acquisitionKey}:${toolId}`;
  if (!definition
    || definition.id === 'teeth'
    || definition.id === 'paws'
    || definition.category === 'replacement'
    || mutable.state.inventory.some(row => row.id === instanceId)
    || mutable.state.tools.some(row => row.instanceId === instanceId)) return false;
  mutable.state.inventory.push({
    id: instanceId,
    name: definition.canonicalName,
    type: 'tool',
    weight: definition.weight,
    quantity: 1,
    canonicalToolId: definition.id
  });
  mutable.state.tools.push({
    instanceId,
    toolId: definition.id,
    upgradeId: null,
    charges: null,
    broken: false,
    consumed: false,
    acquiredBy,
    appliedEffectIds: []
  });
  return true;
};

const activeTimer = (patient: PatientState | null, timerId: string) => patient?.timers.find(
  timer => timer.id === timerId && timer.status === 'active'
) || null;

const modifyTimers = (
  mutable: MutableResolution,
  amount: number,
  target: { kind: 'all-active' } | { kind: 'one'; timerId: string }
): boolean => {
  if (!mutable.state.patient) return false;
  if (target.kind === 'one' && !activeTimer(mutable.state.patient, target.timerId)) return false;
  const targetIds = target.kind === 'all-active'
    ? new Set(mutable.state.patient.timers.filter(timer => timer.status === 'active').map(timer => timer.id))
    : new Set([target.timerId]);
  if (targetIds.size === 0) return false;
  mutable.state.patient = {
    ...mutable.state.patient,
    timers: mutable.state.patient.timers.map(timer => {
      if (!targetIds.has(timer.id)) return timer;
      const current = Math.max(0, Math.min(timer.maximum, timer.current + amount));
      return { ...timer, current, status: current === 0 ? 'expired' : 'active' };
    })
  };
  return true;
};

const addUniqueCondition = (state: ForagingEncounterTransactionState, condition: string): void => {
  if (!state.conditions.includes(condition)) state.conditions.push(condition);
};

const removeOneBolt = (state: ForagingEncounterTransactionState): boolean => {
  const bolt = state.inventory.find(item => item.canonicalToolId === 'bolts');
  if (!bolt) return false;
  const inventory = removeOneInventoryUnit(state.inventory, bolt.id);
  if (!inventory) return false;
  state.inventory = inventory;
  removeToolStateIfGone(state, bolt.id);
  return true;
};

const isMushroom = (reagent: ReagentDefinition): boolean => reagent.preparations.some(preparation => preparation.name === 'Mushroom')
  || /mushroom|fungus|blewit|waxcap|deathcap|polypore/i.test(`${reagent.canonicalName} ${reagent.description}`);

const mycophiliacsRarityCondition = (locationId: string): string => `mycophiliacs:mushroom-rarity-10:${locationId}`;
const mycophiliacsBarterCondition = (locationId: string): string => `mycophiliacs:mushroom-barter-once:${locationId}`;

/** p.176 Picked Clean only changes Mushroom Rarity while the apothecary is in
 * the exact Location where Mycophiliacs was encountered. This helper is kept
 * pure so the Forage candidate builder can apply it before the card is drawn. */
export const applyMycophiliacsMushroomRarity = (input: {
  conditions: readonly string[];
  currentLocationId: string;
  reagentId: string;
  baseRarity: number;
}): number => {
  const reagent = REAGENT_BY_ID.get(input.reagentId);
  return reagent
    && isMushroom(reagent)
    && input.conditions.includes(mycophiliacsRarityCondition(input.currentLocationId))
    ? 10
    : input.baseRarity;
};

/** p.176 Beseech permits exactly one Mushroom Barter in the encounter
 * Location. Call this only as part of the successful Barter transaction; the
 * returned list consumes the grant, while invalid attempts leave it intact. */
export const consumeMycophiliacsMushroomBarter = (input: {
  conditions: readonly string[];
  currentLocationId: string;
  reagentId: string;
}): { consumed: boolean; conditions: string[] } => {
  const condition = mycophiliacsBarterCondition(input.currentLocationId);
  const reagent = REAGENT_BY_ID.get(input.reagentId);
  if (!reagent || !isMushroom(reagent) || !input.conditions.includes(condition)) {
    return { consumed: false, conditions: [...input.conditions] };
  }
  return { consumed: true, conditions: input.conditions.filter(row => row !== condition) };
};

/** Both p.176 effects say "while in this Location". Leaving that Location
 * invalidates the unused Barter as well as the temporary Rarity override. */
export const clearMycophiliacsLocationConditions = (
  conditions: readonly string[],
  locationId: string
): string[] => {
  const locationConditions = new Set([
    mycophiliacsRarityCondition(locationId),
    mycophiliacsBarterCondition(locationId)
  ]);
  return conditions.filter(row => !locationConditions.has(row));
};

const isAvailableIn = (reagent: ReagentDefinition, region: keyof ReagentDefinition['regionAvailability']): boolean => reagent.regionAvailability[region] !== 'Unavailable';

const createCompanion = (transactionId: string, companionId: string): CompanionState | null => {
  if (!COMPANION_BY_ID.has(companionId)) return null;
  return {
    instanceId: `${transactionId}:companion:${companionId}`,
    companionId,
    pathsTravelled: 0,
    seasonsTravelled: 0,
    usedThisJourney: false,
    pendingForage: null,
    pendingForageDraws: 0
  };
};

/** p.155: Right Place, Wrong Time. A tie is not specified by the rulebook and is
 * deliberately rejected instead of silently treating it as a loss. */
export const resolveRightPlaceWrongTime = (input: TransactionEnvelope & ({
  choice: 'vigilante'; playerCard: EncounterCardResult; robberCard: EncounterCardResult;
} | {
  choice: 'archer';
})): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.rightPlaceWrongTime);
  if (isFailure(started)) return started;
  if (input.choice === 'archer') {
    if (!hasCanonicalTool(started.state, 'crossbow') || !hasCanonicalTool(started.state, 'bolts')) {
      return invalid('ineligible', 'Archer requires a carried Crossbow and at least one Bolt.');
    }
    if (!removeOneBolt(started.state)) return invalid('missing-resource', 'The required Bolt is no longer in the Bags.');
    started.state.reputation += 3;
    return finish(input, started);
  }
  if (!cardIsValid(input.playerCard) || !cardIsValid(input.robberCard)) return invalid('invalid-card', 'Vigilante requires two canonical card results.');
  if (input.playerCard.value === input.robberCard.value) return invalid('ambiguous-tie', 'The printed encounter does not specify how a tied Vigilante draw resolves.');
  started.state.reputation += 3;
  if (input.playerCard.value < input.robberCard.value) {
    started.directives.push({ kind: 'move-to-nearest-settlement-and-abandon-journey', sourcePage: 155 });
  }
  return finish(input, started);
};

/** p.161: Friend in Need. Exact card Rarity and one explicit active Ailment Timer. */
export const resolveFriendInNeed = (input: TransactionEnvelope & ({
  choice: 'help';
  card: EncounterCardResult;
  reagentId: string;
  preparationId: string;
  timerId: string;
} | {
  choice: 'keep-to-yourself';
})): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.friendInNeed);
  if (isFailure(started)) return started;
  if (input.choice === 'keep-to-yourself') {
    started.state.reputation = Math.max(0, started.state.reputation - 1);
    return finish(input, started);
  }
  if (!cardIsValid(input.card)) return invalid('invalid-card', 'Help Your Guildmate requires the drawn card.');
  const selected = canonicalPart(input.reagentId, input.preparationId);
  if (!selected || selected.reagent.baseRarity !== input.card.value || !isAvailableIn(selected.reagent, 'Forest')) {
    return invalid('invalid-selection', 'Choose a canonical Forest Reagent whose Base Rarity exactly equals the card value.');
  }
  if (!activeTimer(started.state.patient, input.timerId)) return invalid('invalid-selection', 'Choose the active Ailment Timer affected by this encounter.');
  if (!addCanonicalPart(started, input.transactionId, 'friend-in-need', input.reagentId, input.preparationId)) {
    return invalid('invalid-selection', 'The selected canonical Reagent Part cannot be acquired.');
  }
  modifyTimers(started, -1, { kind: 'one', timerId: input.timerId });
  return finish(input, started);
};

/** p.161: Log Knocking. "All Parts" means one selected preparation for every
 * distinct printed Part name, never every preparation variant of the same Part. */
export const resolveLogKnocking = (input: TransactionEnvelope & {
  encounterId: 'foraging-forest-6';
  reagentId: string;
  partSelections: Array<{ preparationId: string }>;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'foraging-forest-6');
  if (isFailure(started)) return started;
  const reagent = REAGENT_BY_ID.get(input.reagentId);
  if (!reagent || !['Beetles', 'Maggots', 'Wasps'].includes(reagent.canonicalName)) {
    return invalid('invalid-selection', 'Log Knocking only grants all Parts of Beetles, Maggots, or Wasps.');
  }
  const expectedPartNames = [...new Set(reagent.preparations.map(part => part.name))].sort();
  const selections = input.partSelections.map(row => reagent.preparations.find(part => part.id === row.preparationId)).filter(Boolean);
  const selectedPartNames = selections.map(part => part!.name).sort();
  if (selections.length !== input.partSelections.length
    || new Set(input.partSelections.map(row => row.preparationId)).size !== input.partSelections.length
    || JSON.stringify(selectedPartNames) !== JSON.stringify(expectedPartNames)) {
    return invalid('invalid-selection', 'Select exactly one canonical preparation for every distinct Part of the chosen Reagent.');
  }
  for (const [index, part] of selections.entries()) {
    addCanonicalPart(started, input.transactionId, `log-knocking-${index + 1}`, reagent.id, part!.id);
  }
  return finish(input, started);
};

/** p.162: the patient creation itself still needs the existing canonical Lesser
 * Ailment draw UI, but the branch and Reputation outcome are transaction-safe. */
export const resolveTheBranded = (input: TransactionEnvelope & {
  choice: 'compassion' | 'duty';
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.theBranded);
  if (isFailure(started)) return started;
  if (input.choice === 'compassion') {
    started.directives.push({ kind: 'start-lesser-ailment-before-overstay', sourcePage: 162 });
  } else {
    started.state.reputation += 1;
  }
  return finish(input, started);
};

/** p.162: all Timers decrease once; the reward is only available on 7+. */
export const resolveAlluringOdours = (input: TransactionEnvelope & {
  card: EncounterCardResult;
  reagentId?: string;
  preparationId?: string;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.alluringOdours);
  if (isFailure(started)) return started;
  if (!cardIsValid(input.card)) return invalid('invalid-card', 'Follow Your Nose requires the drawn card.');
  if (started.state.patient && !modifyTimers(started, -1, { kind: 'all-active' })) {
    return invalid('invalid-selection', 'No active Ailment Timers are available to decrease.');
  }
  if (input.card.value < 7) {
    if (input.reagentId || input.preparationId) return invalid('invalid-selection', 'A result below 7 cannot gain the printed Reagent reward.');
    return finish(input, started);
  }
  if (!input.reagentId || !input.preparationId) {
    const hasCanonicalCandidate = [...REAGENT_BY_ID.values()].some(reagent => isAvailableIn(reagent, 'Forest')
      && reagent.preparations.some(preparation => preparation.tags.some(tag => tag.tag === 'FAIR')));
    if (!hasCanonicalCandidate) {
      started.directives.push({ kind: 'invent-forest-fair-reagent', sourcePage: 162 });
      return finish(input, started);
    }
    return invalid('invalid-selection', 'Choose the canonical Forest Reagent Part that provides FAIR.');
  }
  const selected = canonicalPart(input.reagentId, input.preparationId);
  if (!selected || !isAvailableIn(selected.reagent, 'Forest') || !selected.preparation.tags.some(tag => tag.tag === 'FAIR')) {
    return invalid('invalid-selection', 'The reward must be a canonical Forest Reagent Part that provides FAIR.');
  }
  addCanonicalPart(started, input.transactionId, 'alluring-odours', input.reagentId, input.preparationId);
  return finish(input, started);
};

/** p.168: card-indexed loss uses the exact displayed unit order. Counting wraps
 * through the list, as it must when the card value exceeds the number carried. */
export const resolveRiverSnatchers = (input: TransactionEnvelope & {
  card: EncounterCardResult;
  expectedBagUnitIds: string[];
  selectedItemId?: string;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.riverSnatchers);
  if (isFailure(started)) return started;
  if (!cardIsValid(input.card)) return invalid('invalid-card', 'River Snatchers requires the drawn card.');
  const currentUnits = started.state.inventory.flatMap(item => Array.from({ length: quantity(item) }, () => item.id));
  if (JSON.stringify(currentUnits) !== JSON.stringify(input.expectedBagUnitIds)) {
    return invalid('stale-state', 'The Bags changed after the card-indexed item was shown.');
  }
  if (currentUnits.length === 0) {
    if (input.selectedItemId) return invalid('invalid-selection', 'There is no Bag item for the thief to take.');
    return finish(input, started);
  }
  const landedItemId = currentUnits[(input.card.value - 1) % currentUnits.length];
  if (input.selectedItemId !== landedItemId) return invalid('invalid-selection', 'The selected item is not the item reached by counting the card value through the Bags.');
  const landedItem = started.state.inventory.find(item => item.id === landedItemId)!;
  const mustDiscard = ['♣', '♠'].includes(input.card.suit) || landedItem.type === 'reagent';
  if (mustDiscard) {
    started.state.inventory = removeOneInventoryUnit(started.state.inventory, landedItemId)!;
    removeToolStateIfGone(started.state, landedItemId);
  }
  return finish(input, started);
};

/** p.170: every Row branch leaves; Spades additionally lose exactly one Reagent.
 * Crossbow uses and discards one Bolt, stays, and grants one Titan Part. */
export const resolveFabledBehemoth = (input: TransactionEnvelope & ({
  choice: 'row'; card: EncounterCardResult; reagentItemId?: string;
} | {
  choice: 'face'; reagentId: string; preparationId: string;
})): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.fabledBehemoth);
  if (isFailure(started)) return started;
  if (input.choice === 'row') {
    if (!cardIsValid(input.card)) return invalid('invalid-card', 'Row requires the drawn card.');
    if (input.card.suit === '♠') {
      const item = started.state.inventory.find(row => row.id === input.reagentItemId && row.type === 'reagent');
      if (!item) return invalid('invalid-selection', 'The Spade result must discard exactly one carried Reagent Part.');
      started.state.inventory = removeOneInventoryUnit(started.state.inventory, item.id)!;
    } else if (input.reagentItemId) {
      return invalid('invalid-selection', 'Only the Spade Row result discards a Reagent.');
    }
    started.directives.push({ kind: 'leave-current-location', sourcePage: 170 });
    return finish(input, started);
  }
  if (!hasCanonicalTool(started.state, 'crossbow') || !hasCanonicalTool(started.state, 'bolts')) {
    return invalid('ineligible', 'Face the Goliath requires a Crossbow and Bolt.');
  }
  const selected = canonicalPart(input.reagentId, input.preparationId);
  if (!selected || selected.reagent.type !== 'TITAN') return invalid('invalid-selection', 'Choose one canonical Titan Reagent Part.');
  if (!removeOneBolt(started.state)) return invalid('missing-resource', 'The required Bolt is no longer in the Bags.');
  addCanonicalPart(started, input.transactionId, 'fabled-behemoth', input.reagentId, input.preparationId);
  return finish(input, started);
};

/** p.173: Trusted uses Airlift; every lower Reputation tier can only take Taxi
 * by paying one Trinket, or decline without gaining points. */
export const resolveFowlFare = (input: TransactionEnvelope & {
  encounterId: 'foraging-meadow-8';
  choice: 'airlift' | 'taxi' | 'decline';
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'foraging-meadow-8');
  if (isFailure(started)) return started;
  if (input.choice === 'airlift') {
    if (started.state.reputation < 35) return invalid('ineligible', 'Airlift requires Trusted Guild Reputation (35+).');
    started.state.foragingPoints += 4;
  } else if (input.choice === 'taxi') {
    if (started.state.reputation >= 35) return invalid('ineligible', 'Taxi is the Upstanding-or-lower branch.');
    if (started.state.trinkets < 1) return invalid('missing-resource', 'Taxi requires one Trinket.');
    started.state.trinkets -= 1;
    started.state.foragingPoints += 4;
  }
  return finish(input, started);
};

/** p.173: first draw gains one eligible Part. The optional second draw either
 * gains one more eligible Part on Hearts or removes every Reagent unit. */
export const resolveAntHeist = (input: TransactionEnvelope & {
  firstCard: EncounterCardResult;
  firstPart: { reagentId: string; preparationId: string };
  secondCard?: EncounterCardResult;
  secondPart?: { reagentId: string; preparationId: string };
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.antHeist);
  if (isFailure(started)) return started;
  if (!cardIsValid(input.firstCard) || (input.secondCard && !cardIsValid(input.secondCard))) return invalid('invalid-card', 'Ant Heist requires canonical card result(s).');
  const validatePart = (part: { reagentId: string; preparationId: string }, maxRarity: number) => {
    const selected = canonicalPart(part.reagentId, part.preparationId);
    return selected && ['PLANT', 'INSECT'].includes(selected.reagent.type)
      && isAvailableIn(selected.reagent, 'Meadow')
      && selected.reagent.baseRarity <= maxRarity;
  };
  if (!validatePart(input.firstPart, input.firstCard.value)) return invalid('invalid-selection', 'Snatch and Go requires one eligible Meadow Plant or Insect Part at or below the first card value.');
  addCanonicalPart(started, input.transactionId, 'ant-heist-first', input.firstPart.reagentId, input.firstPart.preparationId);
  if (!input.secondCard) {
    if (input.secondPart) return invalid('invalid-selection', 'A second Part requires the Going for Broke card.');
    return finish(input, started);
  }
  if (input.secondCard.suit === '♥') {
    if (!input.secondPart || !validatePart(input.secondPart, input.secondCard.value)) return invalid('invalid-selection', 'The Heart result requires one additional eligible Meadow Plant or Insect Part.');
    addCanonicalPart(started, input.transactionId, 'ant-heist-second', input.secondPart.reagentId, input.secondPart.preparationId);
  } else {
    if (input.secondPart) return invalid('invalid-selection', 'Diamond, Club, or Spade discards all Reagents and grants no second Part.');
    started.state.inventory = started.state.inventory.filter(item => item.type !== 'reagent');
  }
  return finish(input, started);
};

/** p.174: immediate Timer cost plus a linked, weightless Guild Rumour. */
export const resolveProjectLaunch = (input: TransactionEnvelope & {
  choice: 'watch' | 'keep-head-down';
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.projectLaunch);
  if (isFailure(started)) return started;
  if (input.choice === 'keep-head-down') return finish(input, started);
  if (started.state.patient && !modifyTimers(started, -2, { kind: 'all-active' })) {
    return invalid('invalid-selection', 'No active Ailment Timers are available to decrease.');
  }
  const itemId = `${input.transactionId}:inventory:guild-rumour`;
  started.state.inventory.push({
    id: itemId,
    name: 'Guild Rumour',
    type: 'item',
    weight: 0,
    quantity: 1,
    guildNote: { kind: 'gossip' },
    encounterMetadata: { kind: 'guild-rumour' }
  });
  started.state.deliveries.push({
    id: `${input.transactionId}:delivery:guild-rumour`,
    kind: 'guild-rumour',
    sourceTransactionId: input.transactionId,
    status: 'pending',
    destination: { kind: 'any-settlement' },
    payloadItemId: itemId
  });
  return finish(input, started);
};

/** p.174/p.186 delivery completion. Rewards occur once and never at pickup. */
export const deliverEncounterPayload = (input: TransactionEnvelope & {
  encounterId: 'encounter-delivery';
  deliveryId: string;
  currentLocationId: string;
  currentLocationType: 'Wilds' | 'Settlement' | 'City' | 'Titan Ruin' | 'Behemoth Barrow';
  returnBorrowedTool?: boolean;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'encounter-delivery');
  if (isFailure(started)) return started;
  const delivery = started.state.deliveries.find(row => row.id === input.deliveryId && row.status === 'pending');
  if (!delivery) return invalid('invalid-selection', 'The selected delivery is not pending.');
  const atDestination = delivery.destination.kind === 'any-settlement'
    ? input.currentLocationType === 'Settlement'
    : delivery.destination.locationId === input.currentLocationId;
  if (!atDestination) return invalid('ineligible', 'This is not the destination required by the pending delivery.');
  if (delivery.kind === 'guild-rumour') {
    const payload = delivery.payloadItemId && started.state.inventory.find(item => item.id === delivery.payloadItemId && item.encounterMetadata?.kind === 'guild-rumour');
    if (!payload) return invalid('missing-resource', 'The linked Guild Rumour is no longer in the Bags.');
    started.state.inventory = removeOneInventoryUnit(started.state.inventory, payload.id)!;
    started.state.reputation += 2;
  } else {
    started.state.reputation += 4;
    if (input.returnBorrowedTool) {
      const toolId = delivery.borrowedToolItemId;
      const tool = toolId && started.state.inventory.find(item => item.id === toolId && item.type === 'tool');
      if (!tool) return invalid('missing-resource', 'The exact Tool borrowed from the remains is no longer in the Bags.');
      started.state.inventory = removeOneInventoryUnit(started.state.inventory, tool.id)!;
      removeToolStateIfGone(started.state, tool.id);
      started.state.reputation += 6;
    }
  }
  delivery.status = 'resolved';
  return finish(input, started);
};

/** p.176: encounter-start comparison is exclusive: more remaining, majority
 * marked, or equality. Beseech is a separate Upstanding eligibility flag. */
export const resolveMycophiliacs = (input: TransactionEnvelope & {
  locationId: string;
  calendarDaysTotal: number;
  daysMarkedAtEncounterStart: number;
  reagentId?: string;
  preparationId?: string;
  beseech?: boolean;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.mycophiliacs);
  if (isFailure(started)) return started;
  if (!input.locationId || !Number.isInteger(input.calendarDaysTotal) || input.calendarDaysTotal < 0
    || !Number.isInteger(input.daysMarkedAtEncounterStart) || input.daysMarkedAtEncounterStart < 0
    || input.daysMarkedAtEncounterStart > input.calendarDaysTotal) {
    return invalid('invalid-selection', 'Mycophiliacs requires the exact encounter-start Calendar totals and Location.');
  }
  const remaining = input.calendarDaysTotal - input.daysMarkedAtEncounterStart;
  if (remaining > input.daysMarkedAtEncounterStart) {
    if (!input.reagentId || !input.preparationId) return invalid('invalid-selection', 'Early Bird requires one chosen Mushroom Reagent Part.');
    const selected = canonicalPart(input.reagentId, input.preparationId);
    if (!selected || !isMushroom(selected.reagent)) return invalid('invalid-selection', 'Early Bird can only grant a canonical Mushroom Reagent Part.');
    addCanonicalPart(started, input.transactionId, 'mycophiliacs-early-bird', input.reagentId, input.preparationId);
  } else {
    if (input.reagentId || input.preparationId) return invalid('invalid-selection', 'Early Bird is not active for this Calendar comparison.');
    if (input.daysMarkedAtEncounterStart > remaining) {
      addUniqueCondition(started.state, mycophiliacsRarityCondition(input.locationId));
    }
  }
  if (input.beseech) {
    if (started.state.reputation < 25 || started.state.reputation >= 35) {
      return invalid('ineligible', 'Beseech requires the Upstanding Guild Reputation tier (25–34).');
    }
    addUniqueCondition(started.state, mycophiliacsBarterCondition(input.locationId));
  }
  return finish(input, started);
};

/** p.177: exactly one Charcoal Part and Animal Sheddings (Hair/Fur), not every
 * preparation variant from either Reagent. */
export const resolveLifeSavingTransplant = (input: TransactionEnvelope & {
  charcoalPreparationId: string;
  sheddingsPreparationId: string;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.lifeSavingTransplant);
  if (isFailure(started)) return started;
  const charcoalReagent = REAGENT_BY_NAME.get('Doused Bonfires');
  const sheddingsReagent = REAGENT_BY_NAME.get('Animal Sheddings');
  const charcoal = charcoalReagent?.preparations.find(part => part.id === input.charcoalPreparationId && part.name === 'Charcoal');
  const sheddings = sheddingsReagent?.preparations.find(part => part.id === input.sheddingsPreparationId && /hair|fur/i.test(part.name));
  if (!charcoalReagent || !sheddingsReagent || !charcoal || !sheddings) {
    return invalid('invalid-selection', 'Take requires one canonical Doused Bonfires Charcoal Part and one Animal Sheddings Hair/Fur Part.');
  }
  addCanonicalPart(started, input.transactionId, 'life-saving-charcoal', charcoalReagent.id, charcoal.id);
  addCanonicalPart(started, input.transactionId, 'life-saving-sheddings', sheddingsReagent.id, sheddings.id);
  return finish(input, started);
};

/** p.177: stores the three target cards. Matching and season-end rewards are
 * separate atomic transactions so reload cannot duplicate a present or Tool. */
export const startSainDeClawsQuest = (input: TransactionEnvelope & {
  encounterId: 'foraging-meadow-9-winter';
  locationId: string;
  targetCards: [EncounterCardResult, EncounterCardResult, EncounterCardResult];
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'foraging-meadow-9-winter');
  if (isFailure(started)) return started;
  if (!input.locationId || input.targetCards.some(card => !cardIsValid(card))) return invalid('invalid-card', 'Sain De Claws requires exactly three valid target cards.');
  started.state.sainDeClawsQuests.push({
    id: `${input.transactionId}:sain-de-claws`,
    sourceTransactionId: input.transactionId,
    locationId: input.locationId,
    targetCards: input.targetCards.map(card => ({ ...card })) as SainDeClawsQuest['targetCards'],
    matchedTargetIndexes: [],
    matchedForageTransactionIds: [],
    returnedTargetIndexes: [],
    status: 'finding'
  });
  return finish(input, started);
};

export const recordSainDeClawsMatch = (input: TransactionEnvelope & {
  encounterId: 'sain-de-claws-match';
  questId: string;
  forageTransactionId: string;
  locationId: string;
  forageCard: EncounterCardResult;
  targetIndex: number;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'sain-de-claws-match');
  if (isFailure(started)) return started;
  const quest = started.state.sainDeClawsQuests.find(row => row.id === input.questId && row.status === 'finding');
  const target = quest?.targetCards[input.targetIndex];
  if (!input.forageTransactionId.trim() || !quest || quest.locationId !== input.locationId || !target || !cardIsValid(input.forageCard)) return invalid('ineligible', 'This forage does not match an active Sain De Claws quest at this Location.');
  if (quest.matchedForageTransactionIds.includes(input.forageTransactionId)) return invalid('already-applied', 'This Forage card has already revealed a present.');
  if (quest.matchedTargetIndexes.includes(input.targetIndex)) return invalid('already-applied', 'That missing present has already been found.');
  if (target.value !== input.forageCard.value && target.suit !== input.forageCard.suit) return invalid('ineligible', 'The forage card matches neither the target value nor its suit.');
  quest.matchedTargetIndexes.push(input.targetIndex);
  quest.matchedForageTransactionIds.push(input.forageTransactionId);
  const itemId = `${quest.id}:present:${input.targetIndex}`;
  started.state.inventory.push({ id: itemId, name: `Missing Present ${input.targetIndex + 1}`, type: 'item', weight: 0, quantity: 1, encounterMetadata: { kind: 'missing-present' } });
  return finish(input, started);
};

export const returnSainDeClawsPresents = (input: TransactionEnvelope & {
  encounterId: 'sain-de-claws-return';
  questId: string;
  locationId: string;
  targetIndexes: number[];
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'sain-de-claws-return');
  if (isFailure(started)) return started;
  const quest = started.state.sainDeClawsQuests.find(row => row.id === input.questId && row.status === 'finding');
  const indexes = [...new Set(input.targetIndexes)].sort((a, b) => a - b);
  if (!quest || quest.locationId !== input.locationId || indexes.length === 0
    || indexes.some(index => !quest.matchedTargetIndexes.includes(index) || quest.returnedTargetIndexes.includes(index))) {
    return invalid('invalid-selection', 'Return one or more found, not-yet-returned presents from this quest.');
  }
  for (const index of indexes) {
    const itemId = `${quest.id}:present:${index}`;
    const item = started.state.inventory.find(row => row.id === itemId && row.encounterMetadata?.kind === 'missing-present');
    if (!item) return invalid('missing-resource', 'A selected missing present is no longer in the Bags.');
    started.state.inventory = removeOneInventoryUnit(started.state.inventory, itemId)!;
    quest.returnedTargetIndexes.push(index);
  }
  if (quest.returnedTargetIndexes.length === 3) quest.status = 'waiting-season-end';
  return finish(input, started);
};

export const settleSainDeClawsAtSeasonEnd = (input: TransactionEnvelope & {
  encounterId: 'sain-de-claws-season-end';
  questId: string;
  atSeasonEnd: true;
  toolId?: string;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'sain-de-claws-season-end');
  if (isFailure(started)) return started;
  if (input.atSeasonEnd !== true) return invalid('ineligible', 'Sain De Claws presents can only be unwrapped at Season end.');
  const quest = started.state.sainDeClawsQuests.find(row => row.id === input.questId && row.status !== 'resolved');
  if (!quest || quest.returnedTargetIndexes.length === 0) return invalid('ineligible', 'No returned Sain De Claws presents are waiting to be unwrapped.');
  if (quest.returnedTargetIndexes.length === 3) {
    if (!input.toolId || !addCanonicalTool(started, input.transactionId, 'sain-de-claws', input.toolId, 'sain-de-claws')) {
      return invalid('invalid-selection', 'Returning all three presents grants exactly one chosen canonical Tool.');
    }
  } else {
    if (input.toolId) return invalid('invalid-selection', 'Fewer than three returned presents grant Trinkets, not a Tool.');
    started.state.trinkets += quest.returnedTargetIndexes.length;
  }
  quest.status = 'resolved';
  return finish(input, started);
};

const clearAllBags = (state: ForagingEncounterTransactionState): void => {
  const removedIds = new Set(state.inventory.map(item => item.id));
  state.inventory = [];
  state.tools = state.tools.filter(tool => !removedIds.has(tool.instanceId));
  state.trinkets = 0;
};

/** p.179: both loss branches discard the entire Bags collection and every
 * Trinket. Crossbow's extra draw consumes one Bolt before comparing cards. */
export const resolveStickEmUp = (input: TransactionEnvelope & ({
  choice: 'play-safe';
} | {
  choice: 'scrap';
  playerCards: EncounterCardResult[];
  robberCards: [EncounterCardResult, EncounterCardResult];
  usedCrossbowExtraDraw: boolean;
})): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.stickEmUp);
  if (isFailure(started)) return started;
  if (input.choice === 'play-safe') {
    clearAllBags(started.state);
    return finish(input, started);
  }
  const expectedPlayerCards = input.usedCrossbowExtraDraw ? 2 : 1;
  if (input.playerCards.length !== expectedPlayerCards || [...input.playerCards, ...input.robberCards].some(card => !cardIsValid(card))) {
    return invalid('invalid-card', 'Scrap requires one player card (or exactly two with Crossbow + Bolt) and exactly two robber cards.');
  }
  if (input.usedCrossbowExtraDraw) {
    if (!hasCanonicalTool(started.state, 'crossbow') || !hasCanonicalTool(started.state, 'bolts')) return invalid('ineligible', 'The extra Scrap draw requires a Crossbow and Bolt.');
    removeOneBolt(started.state);
  }
  const playerHigh = Math.max(...input.playerCards.map(card => card.value));
  const robberHigh = Math.max(...input.robberCards.map(card => card.value));
  if (playerHigh === robberHigh) return invalid('ambiguous-tie', 'The printed encounter does not specify how a tied highest card resolves.');
  if (playerHigh < robberHigh) {
    clearAllBags(started.state);
  } else {
    started.state.inventory.push({
      id: `${input.transactionId}:inventory:weapon`,
      name: 'Taken Weapon',
      type: 'tool',
      weight: 1,
      quantity: 1,
      encounterMetadata: { kind: 'weapon', worksAgainst: ['Beast'] }
    });
  }
  return finish(input, started);
};

/** p.185: entry and reward are one transaction; a failed Club/Spade draw may
 * only proceed when a Titan Thingamabob is actually carried. */
export const resolveFinalRestingPlace = (input: TransactionEnvelope & {
  card: EncounterCardResult;
  reward?: { kind: 'companion' } | { kind: 'thingamabob' } | { kind: 'reagent'; reagentId: string; preparationId: string };
  companionCapacity: number;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.finalRestingPlace);
  if (isFailure(started)) return started;
  if (!cardIsValid(input.card)) return invalid('invalid-card', 'Wailing Curse requires the drawn card.');
  if (['♣', '♠'].includes(input.card.suit) && !hasCanonicalTool(started.state, 'titan-thingamabob')) {
    if (input.reward) return invalid('ineligible', 'Without a Titan Thingamabob, Club or Spade makes you flee before taking a reward.');
    started.messages.push('The Wailing Curse drove the Apothecary away; no reward was taken.');
    return finish(input, started);
  }
  if (!input.reward) return invalid('invalid-selection', 'A successful chamber entry grants exactly one chosen reward.');
  if (input.reward.kind === 'companion') {
    if (started.state.companions.length >= input.companionCapacity) return invalid('ineligible', 'There is no available Companion slot.');
    const companion = createCompanion(input.transactionId, 'cranky-contraption');
    if (!companion) return invalid('invalid-selection', 'Cranky Contraption canonical data is unavailable.');
    started.state.companions.push(companion);
  } else if (input.reward.kind === 'thingamabob') {
    if (!addCanonicalTool(started, input.transactionId, 'final-resting-place', 'titan-thingamabob', 'final-resting-place')) {
      return invalid('invalid-selection', 'Titan Thingamabob canonical data is unavailable.');
    }
  } else {
    const selected = canonicalPart(input.reward.reagentId, input.reward.preparationId);
    if (!selected || selected.reagent.type !== 'TITAN' || selected.reagent.baseRarity > 8) {
      return invalid('invalid-selection', 'Choose a canonical Titan Reagent Part with Base Rarity 8 or lower.');
    }
    addCanonicalPart(started, input.transactionId, 'final-resting-place', input.reward.reagentId, input.reward.preparationId);
  }
  return finish(input, started);
};

/** p.186: Investigate and Borrow are independent. Reputation is deferred to
 * the beast's home, and the optional +6 requires returning the exact Tool. */
export const resolveWhatRemains = (input: TransactionEnvelope & {
  card?: EncounterCardResult;
  homeLocationId?: string;
  borrowedToolId?: string;
}): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.whatRemains);
  if (isFailure(started)) return started;
  if (!input.card && !input.borrowedToolId) return invalid('invalid-choice', 'Choose Investigate, Borrow, or both.');
  if (input.card && !cardIsValid(input.card)) return invalid('invalid-card', 'Investigate requires a canonical card result.');
  if (input.card && input.card.value > 6 && !input.homeLocationId) return invalid('invalid-selection', 'A successful investigation requires the discovered home Location.');
  if (input.card && input.card.value <= 6 && input.homeLocationId) return invalid('invalid-selection', 'A result of 6 or lower does not reveal a delivery destination.');
  let borrowedItemId: string | undefined;
  if (input.borrowedToolId) {
    if (!addCanonicalTool(started, input.transactionId, 'what-remains', input.borrowedToolId, 'what-remains')) {
      return invalid('invalid-selection', 'Borrow requires one canonical Tool.');
    }
    borrowedItemId = `${input.transactionId}:tool:what-remains:${input.borrowedToolId}`;
  }
  if (input.card && input.card.value > 6) {
    started.state.deliveries.push({
      id: `${input.transactionId}:delivery:remains-news`,
      kind: 'remains-news',
      sourceTransactionId: input.transactionId,
      status: 'pending',
      destination: { kind: 'location', locationId: input.homeLocationId! },
      borrowedToolItemId: borrowedItemId
    });
  }
  return finish(input, started);
};

/** p.186: Lock and Key requires, but does not say to discard, a Thingamabob. */
export const resolveLockAndKey = (input: TransactionEnvelope & ({
  encounterId: 'foraging-titan-6'; choice: 'light' | 'cameras'; locationId: string;
} | {
  encounterId: 'foraging-titan-6'; choice: 'action'; locationId: string; reagentId: string; preparationId: string;
})): ForagingEncounterTransactionResolution => {
  const started = begin(input, 'foraging-titan-6');
  if (isFailure(started)) return started;
  if (!input.locationId || !hasCanonicalTool(started.state, 'titan-thingamabob')) return invalid('ineligible', 'Lock and Key requires a carried Titan Thingamabob and current Location.');
  if (input.choice === 'light') addUniqueCondition(started.state, storedEncounterCondition(
    ENCOUNTER_CONDITION_OWNERS.lockAndKey,
    ENCOUNTER_CONDITION_CODES.titanLight,
    input.locationId
  ));
  if (input.choice === 'cameras') addUniqueCondition(started.state, storedEncounterCondition(
    ENCOUNTER_CONDITION_OWNERS.lockAndKey,
    ENCOUNTER_CONDITION_CODES.titanCameras,
    input.locationId
  ));
  if (input.choice === 'action') {
    const selected = canonicalPart(input.reagentId, input.preparationId);
    if (!selected || selected.reagent.type !== 'TITAN') return invalid('invalid-selection', 'Action grants one chosen canonical Titan Reagent Part.');
    addCanonicalPart(started, input.transactionId, 'lock-and-key-action', input.reagentId, input.preparationId);
  }
  return finish(input, started);
};

/** p.187: every Rescue draw decreases exactly one active Timer. Hearts/Diamonds
 * release and grant +2; Clubs/Spades expose an explicit retry-or-stop directive. */
export const resolveTrapped = (input: TransactionEnvelope & ({
  choice: 'open-says-me';
} | {
  choice: 'helping-hand'; locationId: string;
} | {
  choice: 'rescue'; card: EncounterCardResult; timerId: string;
})): ForagingEncounterTransactionResolution => {
  const started = beginOneOf(input, TRAPPED_ENCOUNTER_IDS);
  if (isFailure(started)) return started;
  if (input.choice === 'open-says-me') {
    if (!hasCanonicalTool(started.state, 'titan-thingamabob')) return invalid('ineligible', 'Open Says Me requires a carried Titan Thingamabob.');
    started.directives.push({ kind: 'released-trapped-beast', sourcePage: 187 });
    return finish(input, started);
  }
  if (input.choice === 'helping-hand') {
    if (!started.state.conditions.includes(`bakar:met-in-ruin:${input.locationId}`)) return invalid('ineligible', 'Helping Hand requires Bakar to have been met in this exact ruin.');
    started.directives.push({ kind: 'released-trapped-beast', sourcePage: 187 });
    return finish(input, started);
  }
  if (!cardIsValid(input.card)) return invalid('invalid-card', 'Rescue requires the drawn card.');
  if (!modifyTimers(started, -1, { kind: 'one', timerId: input.timerId })) return invalid('invalid-selection', 'Choose the active Ailment Timer decreased by the rescue attempt.');
  if (['♥', '♦'].includes(input.card.suit)) {
    started.state.reputation += 2;
    started.directives.push({ kind: 'released-trapped-beast', sourcePage: 187 });
  } else {
    started.directives.push({ kind: 'may-retry-trapped-rescue', sourcePage: 187 });
  }
  return finish(input, started);
};

/** p.187: grants exactly one selected canonical Part from the printed list. */
export const resolveMeekShallInherit = (input: TransactionEnvelope & {
  encounterId: typeof MEEK_ENCOUNTER_IDS[number];
  search: 'stunned' | 'burrowed';
  reagentId: string;
  preparationId: string;
}): ForagingEncounterTransactionResolution => {
  const started = beginOneOf(input, MEEK_ENCOUNTER_IDS);
  if (isFailure(started)) return started;
  const selected = canonicalPart(input.reagentId, input.preparationId);
  const allowed = input.search === 'stunned'
    ? ['Beetles', 'Honeybees', 'Butterfly', 'Wasps']
    : ['Maggots', 'Slugs', 'Spiders'];
  if (!selected || !allowed.includes(selected.reagent.canonicalName)) return invalid('invalid-selection', `The ${input.search} search only grants one Part from its printed Reagent list.`);
  addCanonicalPart(started, input.transactionId, `meek-${input.search}`, input.reagentId, input.preparationId);
  return finish(input, started);
};

const RULE_TAGS: readonly RuleTag[] = [
  'ELSEWHERE', 'INSTINCT', 'JOY', 'MOOD', 'NERVES', 'INFECTION', 'PAIN', 'PARASITE', 'SENSES', 'SLEEP',
  'BREATH', 'BURN', 'FEATHER', 'FUR', 'HIDE', 'POISON', 'SCALE', 'STOMACH', 'TEMPERATURE', 'WOUND', 'FAIR', 'FOUL'
];

/** p.195: canonical Tool swap or a fully specified Foreign Reagent purchase. */
export const resolveOdoakMarket = (input: TransactionEnvelope & ({
  choice: 'irresistible-bargain';
  sourceToolItemId: string;
  targetToolId: string;
} | {
  choice: 'impulse-purchase';
  reagentName: string;
  reagentType: ReagentDefinition['type'];
  tag: RuleTag;
  preparationMethods: string[];
} | {
  choice: 'delightful-indulgence';
})): ForagingEncounterTransactionResolution => {
  const started = begin(input, FORAGING_ENCOUNTER_IDS.odoakMarket);
  if (isFailure(started)) return started;
  if (input.choice === 'delightful-indulgence') return finish(input, started);
  if (input.choice === 'irresistible-bargain') {
    const sourceItem = started.state.inventory.find(item => item.id === input.sourceToolItemId && item.type === 'tool' && item.canonicalToolId);
    const sourceDefinition = sourceItem?.canonicalToolId ? TOOL_BY_ID.get(sourceItem.canonicalToolId) : null;
    const targetDefinition = TOOL_BY_ID.get(input.targetToolId);
    if (!sourceItem || !sourceDefinition || sourceDefinition.category === 'basic') return invalid('invalid-selection', 'Irresistible Bargain requires one carried non-basic canonical Tool.');
    if (!targetDefinition || targetDefinition.id === sourceDefinition.id) return invalid('invalid-selection', 'Choose a different canonical Tool from the Tools list.');
    started.state.inventory = removeOneInventoryUnit(started.state.inventory, sourceItem.id)!;
    removeToolStateIfGone(started.state, sourceItem.id);
    if (!addCanonicalTool(started, input.transactionId, 'odoak-market-swap', targetDefinition.id, 'odoak-market-swap')) return invalid('invalid-selection', 'The selected target Tool cannot be acquired.');
    return finish(input, started);
  }
  const name = input.reagentName.trim();
  const methods = [...new Set(input.preparationMethods.map(method => method.trim()).filter(Boolean))];
  if (started.state.trinkets < 2) return invalid('missing-resource', 'Impulse Purchase requires 2 Trinkets.');
  if (!name || !['PLANT', 'ANIMAL', 'INSECT', 'EARTH', 'TITAN'].includes(input.reagentType) || !RULE_TAGS.includes(input.tag) || methods.length !== 1) {
    return invalid('invalid-selection', 'Name the Foreign Reagent and choose its Type, Tag, and exactly one Preparation Method.');
  }
  started.state.trinkets -= 2;
  started.state.inventory.push({
    id: `${input.transactionId}:inventory:foreign-reagent`,
    name: `Foreign Reagent: ${name}`,
    type: 'reagent',
    weight: 2 / 3,
    quantity: 1,
    usesRemaining: 1,
    customReagent: { baseRarity: 0, targetTag: input.tag, preparation: methods.join(' / ') },
    encounterMetadata: {
      kind: 'foreign-reagent',
      reagentType: input.reagentType,
      tagPotency: 2,
      preparationMethods: methods
    }
  });
  return finish(input, started);
};

/** Small helper for UI candidate lists. It centralises canonical filters without
 * choosing for the player. */
export const canonicalEncounterPartCandidates = (input: {
  region?: keyof ReagentDefinition['regionAvailability'];
  season?: Season;
  exactRarity?: number;
  maximumRarity?: number;
  types?: ReagentDefinition['type'][];
  requiredTag?: RuleTag;
  mushroomsOnly?: boolean;
}): Array<{ reagentId: string; preparationId: string; label: string }> => [...REAGENT_BY_ID.values()].flatMap(reagent => {
  if (input.region && !isAvailableIn(reagent, input.region)) return [];
  if (input.season && reagent.seasonAvailability[input.season] === 'Unavailable') return [];
  if (input.exactRarity !== undefined && reagent.baseRarity !== input.exactRarity) return [];
  if (input.maximumRarity !== undefined && reagent.baseRarity > input.maximumRarity) return [];
  if (input.types && !input.types.includes(reagent.type)) return [];
  if (input.mushroomsOnly && !isMushroom(reagent)) return [];
  return reagent.preparations.filter(preparation => !input.requiredTag || preparation.tags.some(tag => tag.tag === input.requiredTag)).map(preparation => ({
    reagentId: reagent.id,
    preparationId: preparation.id,
    label: `${reagent.canonicalName} · ${preparation.name} · ${preparation.method}`
  }));
});
