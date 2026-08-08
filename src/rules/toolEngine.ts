import { getRuleCardValue, type RuleCard } from './cards';
import { TOOL_BY_ID } from './data/tools';
import { TOOL_UPGRADE_BY_ID, type ToolUpgradeTrigger } from './data/upgrades';
import type { RuleTag } from './types';
import type { RulesetId } from './types';

export interface CanonicalToolState {
  instanceId: string;
  toolId: string;
  upgradeId: string | null;
  charges: number | null;
  broken: boolean;
  consumed: boolean;
  acquiredBy: string;
  appliedEffectIds: string[];
}

export const equipToolUpgrade = (tool: CanonicalToolState, upgradeId: string): CanonicalToolState => {
  const upgrade = TOOL_UPGRADE_BY_ID.get(upgradeId);
  if (!upgrade || upgrade.baseToolId !== tool.toolId) throw new Error('Upgrade can only replace its canonical Basic Tool.');
  return { ...tool, upgradeId, broken: false, consumed: false };
};

export const toolWeight = (tool: CanonicalToolState): number => {
  const upgrade = tool.upgradeId ? TOOL_UPGRADE_BY_ID.get(tool.upgradeId) : null;
  return upgrade?.weight ?? TOOL_BY_ID.get(tool.toolId)?.weight ?? 0;
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

export const resolveToolTrigger = (input: {
  transactionId: string;
  tool: CanonicalToolState;
  trigger: ToolUpgradeTrigger | 'weather-encounter' | 'comb-remedy';
  card?: RuleCard;
}): { tool: CanonicalToolState; foragingPoints: number; timerDelta: number; potencyDelta: number; ignoredOutcome: boolean } => {
  if (!input.transactionId || input.tool.appliedEffectIds.includes(input.transactionId) || input.tool.broken || input.tool.consumed) {
    throw new Error('Tool transaction is invalid or already applied.');
  }
  let tool = { ...input.tool, appliedEffectIds: [...input.tool.appliedEffectIds, input.transactionId] };
  let foragingPoints = 0;
  let timerDelta = 0;
  let potencyDelta = 0;
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
  return { tool, foragingPoints, timerDelta, potencyDelta, ignoredOutcome };
};

export type ToolEffectPhase = 'travel' | 'foraging' | 'treatment' | 'barter' | 'barrow' | 'downtime' | 'season';

export interface ToolEffectContext {
  transactionId: string;
  phase: ToolEffectPhase;
  trigger?: ToolUpgradeTrigger | 'weather-encounter' | 'comb-remedy';
  tools: CanonicalToolState[];
  selectedToolInstanceIds?: string[];
  card?: RuleCard;
  rulesetId: RulesetId;
}

export interface ToolEffectResolution {
  tools: CanonicalToolState[];
  foragingPoints: number;
  timerDelta: number;
  potencyDelta: number;
  ignoredOutcome: boolean;
  appliedToolInstanceIds: string[];
}

const matchingTrigger = (tool: CanonicalToolState, trigger: ToolEffectContext['trigger']) => {
  if (!trigger || tool.broken || tool.consumed) return false;
  const upgrade = tool.upgradeId ? TOOL_UPGRADE_BY_ID.get(tool.upgradeId) : null;
  return upgrade?.trigger === trigger
    || (tool.toolId === 'canvas-tent' && trigger === 'weather-encounter')
    || (tool.toolId === 'fine-toothed-comb' && trigger === 'comb-remedy');
};

export const resolveToolEffects = (context: ToolEffectContext): ToolEffectResolution => {
  if (!context.transactionId) throw new Error('Tool effects require a transaction ID.');
  const selected = new Set(context.selectedToolInstanceIds || context.tools.map(tool => tool.instanceId));
  const appliedToolInstanceIds: string[] = [];
  let foragingPoints = 0;
  let timerDelta = 0;
  let potencyDelta = 0;
  let ignoredOutcome = false;
  const tools = context.tools.map(tool => {
    if (!selected.has(tool.instanceId) || !matchingTrigger(tool, context.trigger)) return tool;
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
    ignoredOutcome ||= resolved.ignoredOutcome;
    if (resolved.tool.charges === null) return resolved.tool;
    const charges = Math.max(0, resolved.tool.charges - 1);
    return { ...resolved.tool, charges, consumed: resolved.tool.consumed || charges === 0 };
  });
  return { tools, foragingPoints, timerDelta, potencyDelta, ignoredOutcome, appliedToolInstanceIds };
};
