import { REAGENTS } from './data/reagents';
import { toolsForPreparationMethod } from './data/reagentPreparations';
import type { EngineInventoryItem } from './gameplay';
import { canonicalMetadata } from './source';
import type { ReagentPreparation } from './types';

const preparations = new Map(REAGENTS.flatMap(reagent => reagent.preparations.map(part => [part.id, part] as const)));

/** A printed Foreign/Replaced Reagent is a real consumable Part, too. */
export const preparationForInventory = (item: EngineInventoryItem): ReagentPreparation | null => {
  if (item.type !== 'reagent') return null;
  if (item.preparationId && preparations.has(item.preparationId)) return preparations.get(item.preparationId)!;
  const custom = item.customReagent;
  if (!custom?.targetTag || !custom.preparation?.trim()) return null;
  const metadata = (item as EngineInventoryItem & { encounterMetadata?: { kind?: string; tagPotency?: number } }).encounterMetadata;
  // v9 Foreign Reagents already recorded strength in encounter metadata. Old
  // Replacements did not: retain the item conservatively at Potency 1.
  const potency = custom.potency ?? metadata?.tagPotency ?? 1;
  if (!Number.isInteger(potency) || potency < 1) return null;
  const requiredTools = toolsForPreparationMethod(custom.preparation);
  return {
    ...canonicalMetadata(metadata?.kind === 'foreign-reagent' ? 195 : 30),
    id: item.preparationId || `custom:${item.id}`,
    name: custom.preparation,
    method: custom.preparation.toUpperCase(),
    requiredTool: requiredTools[0],
    requiredTools,
    weight: item.weight,
    uses: Math.max(1, Math.floor(custom.uses || 1)),
    tags: [{ tag: custom.targetTag, value: potency }],
    specialRules: []
  };
};
