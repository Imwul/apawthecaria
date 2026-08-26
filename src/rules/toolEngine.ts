import { getRuleCardValue, type RuleCard } from './cards';
import { TOOL_BY_ID } from './data/tools';
import { REAGENT_BY_ID } from './data/reagents';
import { TOOL_UPGRADE_BY_ID, type ToolUpgradeTrigger } from './data/upgrades';
import type { RuleTag } from './types';
import type { RulesetId } from './types';
import type { EngineInventoryItem, EngineJournalEvent } from './gameplay';

export interface CanonicalToolState {
  instanceId: string;
  toolId: string;
  upgradeId: string | null;
  charges: number | null;
  broken: boolean;
  consumed: boolean;
  acquiredBy: string;
  appliedEffectIds: string[];
  weightAdjustment?: number;
}

export interface ToolTransactionState {
  trinkets: number;
  inventory: EngineInventoryItem[];
  tools: CanonicalToolState[];
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

export interface ToolTransactionResolution {
  status: 'resolved' | 'invalid';
  value: ToolTransactionState | null;
  messages: string[];
}

const toolTransactionError = (transactionId: string, state: ToolTransactionState) => !transactionId
  ? 'Tool action requires a transaction ID.'
  : state.appliedTransactionIds.includes(transactionId)
    ? 'This Tool transaction has already been applied.'
    : null;

export const purchaseCanonicalTool = (input: {
  transactionId: string;
  state: ToolTransactionState;
  toolId: string;
  source: 'market' | 'basic-replacement' | 'downtime-gift' | 'barrow-reward';
  currentLocationName?: string;
  currentLocationType?: string;
  currentRegion?: string;
  allowLocationOverride?: boolean;
}): ToolTransactionResolution => {
  const error = toolTransactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const definition = TOOL_BY_ID.get(input.toolId);
  if (!definition) return { status: 'invalid', value: null, messages: ['Unknown canonical Tool.'] };
  const cost = input.source === 'market' ? definition.cost
    : input.source === 'basic-replacement' ? 1
      : 0;
  if (cost === null) return { status: 'invalid', value: null, messages: ['This Tool cannot be purchased from a market.'] };
  if (input.source === 'basic-replacement' && definition.category !== 'basic') {
    return { status: 'invalid', value: null, messages: ['Basic Tools can only replace Belt Knife, Camp Kettle, or Mortar and Pestle.'] };
  }
  if (input.source === 'market' && !input.allowLocationOverride) {
    const eligible = definition.purchaseLocations.some(location => location === 'Any'
      || location === input.currentLocationName
      || (location === 'Any City' && input.currentLocationType === 'City')
      || (location.endsWith('Settlement') && input.currentLocationType === 'Settlement' && location.startsWith(input.currentRegion || '')));
    if (!eligible) return { status: 'invalid', value: null, messages: ['This Tool is not sold at the current canonical Location.'] };
  }
  if (input.state.trinkets < cost) return { status: 'invalid', value: null, messages: ['Not enough Trinkets.'] };
  const instanceId = `${input.transactionId}:tool`;
  if (input.state.inventory.some(item => item.id === instanceId) || input.state.tools.some(tool => tool.instanceId === instanceId)) {
    return { status: 'invalid', value: null, messages: ['Tool instance identity already exists.'] };
  }
  const tool: CanonicalToolState = {
    instanceId,
    toolId: definition.id,
    upgradeId: null,
    charges: null,
    broken: false,
    consumed: false,
    acquiredBy: input.source,
    appliedEffectIds: []
  };
  const item: EngineInventoryItem = {
    id: instanceId,
    name: definition.canonicalName,
    type: 'tool',
    weight: definition.weight,
    canonicalToolId: definition.id
  };
  const next: ToolTransactionState = {
    ...input.state,
    trinkets: input.state.trinkets - cost,
    inventory: [...input.state.inventory, item],
    tools: [...input.state.tools, tool],
    appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
    journalEvents: [...input.state.journalEvents, {
      id: `${input.transactionId}:journal`,
      type: 'downtime',
      title: `Tool acquired: ${definition.canonicalName}`,
      text: `${input.source}; Trinkets spent: ${cost}.`
    }]
  };
  return { status: 'resolved', value: next, messages: [] };
};

export const upgradeCanonicalTool = (input: {
  transactionId: string;
  state: ToolTransactionState;
  toolInstanceId: string;
  upgradeId: string;
  currentLocationType: string;
  currentRegion: string;
  allowLocationOverride?: boolean;
}): ToolTransactionResolution => {
  const error = toolTransactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const eligibleLocation = input.allowLocationOverride || input.currentLocationType === 'City'
    || (input.currentLocationType === 'Settlement' && input.currentRegion === 'Mountain');
  if (!eligibleLocation) return { status: 'invalid', value: null, messages: ['Smithing requires a Mountain Settlement or City.'] };
  if (input.state.trinkets < 3) return { status: 'invalid', value: null, messages: ['Smithing requires 3 Trinkets.'] };
  const toolIndex = input.state.tools.findIndex(tool => tool.instanceId === input.toolInstanceId);
  const itemIndex = input.state.inventory.findIndex(item => item.id === input.toolInstanceId && item.type === 'tool');
  if (toolIndex < 0 || itemIndex < 0) return { status: 'invalid', value: null, messages: ['Canonical Tool instance is not present in Inventory.'] };
  const current = input.state.tools[toolIndex];
  if (current.broken || current.consumed || current.upgradeId) return { status: 'invalid', value: null, messages: ['Only an intact, unmodified Basic Tool can be upgraded.'] };
  let upgraded: CanonicalToolState;
  try {
    upgraded = equipToolUpgrade(current, input.upgradeId);
  } catch (cause) {
    return { status: 'invalid', value: null, messages: [cause instanceof Error ? cause.message : 'Invalid Tool upgrade.'] };
  }
  const definition = TOOL_UPGRADE_BY_ID.get(input.upgradeId)!;
  const tools = [...input.state.tools];
  tools[toolIndex] = upgraded;
  const inventory = [...input.state.inventory];
  inventory[itemIndex] = { ...inventory[itemIndex], name: definition.canonicalName, weight: toolWeight(upgraded), canonicalToolId: upgraded.toolId };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      trinkets: input.state.trinkets - 3,
      inventory,
      tools,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`,
        type: 'downtime',
        title: `Tool upgraded: ${definition.canonicalName}`,
        text: `${definition.canonicalName} retained its identity and was upgraded for 3 Trinkets.`
      }]
    },
    messages: []
  };
};

export const repairCanonicalTool = (input: {
  transactionId: string;
  state: ToolTransactionState;
  toolInstanceId: string;
  currentLocationType: string;
}): ToolTransactionResolution => {
  const error = toolTransactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (!['Settlement', 'City'].includes(input.currentLocationType) || input.state.trinkets < 2) {
    return { status: 'invalid', value: null, messages: ['Repair requires a Settlement or City and 2 Trinkets.'] };
  }
  const index = input.state.tools.findIndex(tool => tool.instanceId === input.toolInstanceId && tool.broken && !tool.consumed);
  if (index < 0) return { status: 'invalid', value: null, messages: ['Broken canonical Tool was not found.'] };
  const tools = [...input.state.tools];
  tools[index] = { ...tools[index], broken: false };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      trinkets: input.state.trinkets - 2,
      tools,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'downtime', title: 'Tool repaired', text: `${tools[index].toolId} was repaired for 2 Trinkets.` }]
    },
    messages: []
  };
};

export const resolveCrossbowProtection = (input: {
  transactionId: string;
  state: ToolTransactionState;
  encounterTags: readonly string[];
}): ToolTransactionResolution => {
  const error = toolTransactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  if (!input.encounterTags.some(tag => tag === 'Beast' || tag === 'Behemoth')) {
    return { status: 'invalid', value: null, messages: ['Crossbow protection requires a Beast or Behemoth Encounter.'] };
  }
  const crossbow = input.state.tools.find(tool => tool.toolId === 'crossbow' && !tool.broken && !tool.consumed);
  const bolts = input.state.tools.find(tool => tool.toolId === 'bolts' && !tool.broken && !tool.consumed
    && input.state.inventory.some(item => item.id === tool.instanceId));
  if (!crossbow || !bolts) return { status: 'invalid', value: null, messages: ['Crossbow protection requires an intact Crossbow and Bolts.'] };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      inventory: input.state.inventory.filter(item => item.id !== bolts.instanceId),
      tools: input.state.tools.map(tool => tool.instanceId === bolts.instanceId ? { ...tool, consumed: true } : tool),
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'encounter', title: 'Crossbow protection', text: 'Discarded one Bolts Tool and ignored negative Beast or Behemoth outcomes.' }]
    },
    messages: []
  };
};

export const resolveGraniteMortarPound = (input: {
  transactionId: string;
  state: ToolTransactionState;
  itemIds: string[];
  carryScore: number;
}): ToolTransactionResolution => {
  const error = toolTransactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const mortar = input.state.tools.find(tool => tool.upgradeId === 'granite-mortar' && !tool.broken && !tool.consumed);
  if (!mortar) return { status: 'invalid', value: null, messages: ['Granite Mortar and Pestle is required.'] };
  const selected = input.state.inventory.filter(item => input.itemIds.includes(item.id));
  if (selected.length === 0 || selected.some(item => {
    const reagent = item.canonicalReagentId ? REAGENT_BY_ID.get(item.canonicalReagentId) : null;
    const preparation = reagent?.preparations.find(row => row.id === item.preparationId);
    return reagent?.type !== 'PLANT' || !preparation || !/BREW/i.test(preparation.method);
  })) return { status: 'invalid', value: null, messages: ['POUND requires canonical Plant Parts with a BREW preparation.'] };
  const existing = input.state.inventory.filter(item => item.granitePounded).length;
  if (existing + selected.length > Math.max(0, Math.floor(input.carryScore))) {
    return { status: 'invalid', value: null, messages: ['Powders and Teas stored with the Granite Mortar cannot exceed Carry score.'] };
  }
  const selectedIds = new Set(selected.map(item => item.id));
  const tools = resolveToolEffects({
    transactionId: `${input.transactionId}:trigger`, phase: 'foraging', trigger: 'pound', tools: input.state.tools,
    selectedToolInstanceIds: [mortar.instanceId], rulesetId: 'original-1e-3p'
  }).tools;
  return {
    status: 'resolved',
    value: {
      ...input.state,
      inventory: input.state.inventory.map(item => selectedIds.has(item.id)
        ? { ...item, name: `${item.name} - Powder/Tea`, weight: 0, granitePounded: true }
        : item),
      tools,
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'foraging', title: 'Granite Mortar POUND', text: `${selected.length} Plant Part(s) became weightless Powder or Tea.` }]
    },
    messages: []
  };
};

export type KnittingProjectId = NonNullable<EngineInventoryItem['craftedItemId']>;

const KNITTING_PROJECTS: Record<KnittingProjectId, { name: string; hours: number; weight: number }> = {
  'knitted-blanket': { name: 'Knitted Blanket', hours: 20, weight: 1 },
  'knitted-coat': { name: 'Knitted Coat', hours: 15, weight: 2 / 3 },
  'knitted-satchel': { name: 'Knitted Satchel', hours: 10, weight: 0 },
  'knitted-scarf': { name: 'Knitted Scarf', hours: 5, weight: 1 / 3 }
};

export const resolveKnittingProject = (input: {
  transactionId: string;
  state: ToolTransactionState;
  projectId: KnittingProjectId;
  availableHours: number;
}): ToolTransactionResolution & { hoursSpent?: number } => {
  const error = toolTransactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const needles = input.state.tools.find(tool => tool.toolId === 'knitting-needles' && !tool.broken && !tool.consumed);
  const project = KNITTING_PROJECTS[input.projectId];
  if (!needles || !project) return { status: 'invalid', value: null, messages: ['Knitting requires intact Knitting Needles and a canonical project.'] };
  if (input.availableHours <= 0 || input.availableHours < project.hours) {
    return { status: 'invalid', value: null, messages: [`${project.name} requires ${project.hours} Timer hours, and no Timer may already be 0.`] };
  }
  const item: EngineInventoryItem = {
    id: `${input.transactionId}:${input.projectId}`,
    name: project.name,
    type: 'item',
    weight: project.weight,
    quantity: 1,
    craftedItemId: input.projectId
  };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      inventory: [...input.state.inventory, item],
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'downtime', title: `Knitted ${project.name}`,
        text: `Reduced all eligible Timers by ${project.hours} hours while Preparing to Leave.`
      }]
    },
    hoursSpent: project.hours,
    messages: []
  };
};

export const resolveKnittedBlanket = (input: {
  transactionId: string;
  state: ToolTransactionState;
  itemId: string;
}): ToolTransactionResolution => {
  const error = toolTransactionError(input.transactionId, input.state);
  if (error) return { status: 'invalid', value: null, messages: [error] };
  const blanket = input.state.inventory.find(item => item.id === input.itemId && item.craftedItemId === 'knitted-blanket');
  if (!blanket) return { status: 'invalid', value: null, messages: ['A Knitted Blanket is required to prevent the premature Journey ending.'] };
  return {
    status: 'resolved',
    value: {
      ...input.state,
      inventory: input.state.inventory.filter(item => item.id !== blanket.id),
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
      journalEvents: [...input.state.journalEvents, {
        id: `${input.transactionId}:journal`, type: 'travel', title: 'Knitted Blanket discarded',
        text: 'The Blanket miraculously prevented the Journey from ending prematurely.'
      }]
    },
    messages: []
  };
};

export const equipToolUpgrade = (tool: CanonicalToolState, upgradeId: string): CanonicalToolState => {
  const upgrade = TOOL_UPGRADE_BY_ID.get(upgradeId);
  if (!upgrade || upgrade.baseToolId !== tool.toolId) throw new Error('Upgrade can only replace its canonical Basic Tool.');
  return { ...tool, upgradeId, broken: false, consumed: false };
};

export const toolWeight = (tool: CanonicalToolState): number => {
  const upgrade = tool.upgradeId ? TOOL_UPGRADE_BY_ID.get(tool.upgradeId) : null;
  const baseWeight = upgrade?.weight ?? TOOL_BY_ID.get(tool.toolId)?.weight ?? 0;
  return Math.max(0, baseWeight + (tool.weightAdjustment || 0));
};

export const canPrepareWithTools = (method: string, tools: CanonicalToolState[]): boolean => {
  if (['CHEWED', 'DIGESTED', 'ADDED', 'APPLIED'].includes(method)) return true;
  return tools.some(tool => !tool.broken && !tool.consumed && TOOL_BY_ID.get(tool.toolId)?.preparationMethods.includes(method));
};

export const bandolierAdjustedWeight = (items: Array<{ weight: number; type?: string; tags?: RuleTag[] }>, tools: CanonicalToolState[]) => {
  const hasBandolier = tools.some(tool => tool.toolId === 'greenpaw-bandolier' && !tool.broken && !tool.consumed);
  if (!hasBandolier) return items.reduce((sum, item) => sum + item.weight, 0);
  let stored = 0;
  let outside = 0;
  for (const item of items) {
    const eligible = item.type === 'plant' || item.type === 'insect';
    const room = Math.max(0, 5 - stored);
    const packed = eligible ? Math.min(room, item.weight) : 0;
    stored += packed;
    outside += item.weight - packed;
  }
  return outside + (stored > 0 ? 1 : 0);
};

export const saddlebagsCarryBonus = (tools: CanonicalToolState[], hasFamiliar: boolean): number => {
  const maximumSets = hasFamiliar ? 2 : 1;
  const sets = tools.filter(tool => tool.toolId === 'saddlebags' && !tool.broken && !tool.consumed).length;
  return Math.min(maximumSets, sets) * 2;
};

export const withIngenuitiveToolBenefit = (
  tools: CanonicalToolState[],
  toolId: string | null | undefined,
  instanceId: string
): CanonicalToolState[] => {
  const withoutPreviousBenefit = tools.filter(tool => tool.acquiredBy !== 'familiar-ingenuitive');
  if (!toolId || !TOOL_BY_ID.has(toolId)) return withoutPreviousBenefit;
  const existing = tools.find(tool => tool.instanceId === instanceId && tool.toolId === toolId);
  return [...withoutPreviousBenefit, existing || {
    instanceId,
    toolId,
    upgradeId: null,
    charges: null,
    broken: false,
    consumed: false,
    acquiredBy: 'familiar-ingenuitive',
    appliedEffectIds: []
  }];
};

export const resolveToolTrigger = (input: {
  transactionId: string;
  tool: CanonicalToolState;
  trigger: ToolUpgradeTrigger | 'weather-encounter' | 'comb-remedy' | 'settlement-arrival' | 'bog-move' | 'titan-proximity';
  card?: RuleCard;
}): { tool: CanonicalToolState; foragingPoints: number; timerDelta: number; potencyDelta: number; speedDelta: number; trinketsDelta: number; ignoredOutcome: boolean } => {
  if (!input.transactionId || input.tool.appliedEffectIds.includes(input.transactionId) || input.tool.broken || input.tool.consumed) {
    throw new Error('Tool transaction is invalid or already applied.');
  }
  let tool = { ...input.tool, appliedEffectIds: [...input.tool.appliedEffectIds, input.transactionId] };
  let foragingPoints = 0;
  let timerDelta = 0;
  let potencyDelta = 0;
  let speedDelta = 0;
  let trinketsDelta = 0;
  let ignoredOutcome = false;
  const upgrade = tool.upgradeId ? TOOL_UPGRADE_BY_ID.get(tool.upgradeId) : null;
  if (upgrade?.trigger === input.trigger) {
    if (upgrade.id === 'silver-sickle') foragingPoints = 1;
    if (upgrade.id === 'steel-axe') foragingPoints = 3;
    if (upgrade.id === 'steel-lined-mortar' || upgrade.id === 'efficient-copper-kettle') timerDelta = 1;
    if (upgrade.id === 'double-boiler') potencyDelta = 1;
  }
  if (tool.toolId === 'canvas-tent' && input.trigger === 'weather-encounter') {
    ignoredOutcome = true;
    if (!input.card) throw new Error('Tent breakage requires a card.');
    const rawSuit = typeof input.card === 'number' ? undefined : input.card.suit;
    if (rawSuit === '♣' || rawSuit === '♠') tool = { ...tool, broken: true };
  }
  if (tool.toolId === 'fine-toothed-comb' && input.trigger === 'comb-remedy') {
    if (!input.card) throw new Error('Comb breakage requires a card.');
    getRuleCardValue(input.card, 'general');
    const rawSuit = typeof input.card === 'number' ? undefined : input.card.suit;
    if (rawSuit === '♠') tool = { ...tool, broken: true };
  }
  if (tool.toolId === 'stilts' && input.trigger === 'bog-move') speedDelta = 1;
  if (tool.toolId === 'instruments' && input.trigger === 'settlement-arrival') trinketsDelta = 1;
  return { tool, foragingPoints, timerDelta, potencyDelta, speedDelta, trinketsDelta, ignoredOutcome };
};

export type ToolEffectPhase = 'travel' | 'foraging' | 'treatment' | 'barter' | 'barrow' | 'downtime' | 'season';

export interface ToolEffectContext {
  transactionId: string;
  phase: ToolEffectPhase;
  trigger?: ToolUpgradeTrigger | 'weather-encounter' | 'comb-remedy' | 'settlement-arrival' | 'bog-move' | 'titan-proximity';
  tools: CanonicalToolState[];
  selectedToolInstanceIds?: string[];
  card?: RuleCard;
  rulesetId: RulesetId;
  availablePerformers?: number;
}

export interface ToolEffectResolution {
  tools: CanonicalToolState[];
  foragingPoints: number;
  timerDelta: number;
  potencyDelta: number;
  speedDelta: number;
  trinketsDelta: number;
  ignoredOutcome: boolean;
  appliedToolInstanceIds: string[];
}

export const resolveInstrumentShow = (input: {
  transactionId: string;
  tools: CanonicalToolState[];
  rulesetId: RulesetId;
  hasFamiliar: boolean;
  hasPassenger: boolean;
  hasCricket: boolean;
}): ToolEffectResolution => {
  const instruments = input.tools.filter(tool => tool.toolId === 'instruments' && !tool.broken && !tool.consumed);
  const performers = 1 + Number(input.hasFamiliar) + Number(input.hasPassenger) + Number(input.hasCricket);
  const resolved = resolveToolEffects({
    transactionId: input.transactionId,
    phase: 'travel',
    trigger: 'settlement-arrival',
    tools: input.tools,
    selectedToolInstanceIds: instruments.map(tool => tool.instanceId),
    availablePerformers: performers,
    rulesetId: input.rulesetId
  });
  const instrumentCount = instruments.length + Number(input.hasCricket && instruments.length > 0);
  return { ...resolved, trinketsDelta: Math.min(instrumentCount, performers) };
};

const matchingTrigger = (tool: CanonicalToolState, trigger: ToolEffectContext['trigger']) => {
  if (!trigger || tool.broken || tool.consumed) return false;
  const upgrade = tool.upgradeId ? TOOL_UPGRADE_BY_ID.get(tool.upgradeId) : null;
  return upgrade?.trigger === trigger
    || (tool.toolId === 'canvas-tent' && trigger === 'weather-encounter')
    || (tool.toolId === 'fine-toothed-comb' && trigger === 'comb-remedy')
    || (tool.toolId === 'stilts' && trigger === 'bog-move')
    || (tool.toolId === 'instruments' && trigger === 'settlement-arrival')
    || (tool.toolId === 'titan-thingamabob' && trigger === 'titan-proximity');
};

export const resolveToolEffects = (context: ToolEffectContext): ToolEffectResolution => {
  if (!context.transactionId) throw new Error('Tool effects require a transaction ID.');
  const selected = new Set(context.selectedToolInstanceIds || context.tools.map(tool => tool.instanceId));
  const appliedToolInstanceIds: string[] = [];
  let foragingPoints = 0;
  let timerDelta = 0;
  let potencyDelta = 0;
  let speedDelta = 0;
  let trinketsDelta = 0;
  let ignoredOutcome = false;
  const tools = context.tools.map(tool => {
    if (!selected.has(tool.instanceId) || !matchingTrigger(tool, context.trigger)) return tool;
    if (tool.toolId === 'instruments' && appliedToolInstanceIds.length >= Math.max(0, context.availablePerformers ?? 1)) return tool;
    if (tool.appliedEffectIds.includes(context.transactionId)) return tool;
    const resolved = resolveToolTrigger({
      transactionId: context.transactionId,
      tool,
      trigger: context.trigger!,
      card: context.card
    });
    appliedToolInstanceIds.push(tool.instanceId);
    foragingPoints += resolved.foragingPoints;
    timerDelta += resolved.timerDelta;
    potencyDelta += resolved.potencyDelta;
    speedDelta += resolved.speedDelta;
    trinketsDelta += resolved.trinketsDelta;
    ignoredOutcome ||= resolved.ignoredOutcome;
    if (resolved.tool.charges === null) return resolved.tool;
    const charges = Math.max(0, resolved.tool.charges - 1);
    return { ...resolved.tool, charges, consumed: resolved.tool.consumed || charges === 0 };
  });
  return { tools, foragingPoints, timerDelta, potencyDelta, speedDelta, trinketsDelta, ignoredOutcome, appliedToolInstanceIds };
};
