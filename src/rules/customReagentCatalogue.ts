import type { EngineInventoryItem } from './gameplay';
import { preparationForInventory } from './inventoryPreparation';
import { RULE_TAGS } from './tags';
import type { RuleTag } from './types';

/** Learned definitions remain in the Almanack after their physical Part is consumed. */
export interface CustomReagentCatalogueEntry {
  id: string;
  acquisitionId: string;
  name: string;
  preparation: string;
  targetTag: RuleTag;
  potency: number;
  weight: number;
  uses: number;
  requiredToolIds: string[];
  baseRarity: number;
  reagentType?: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN';
  source: 'replacement' | 'foreign-reagent';
  sourcePage: 30 | 195;
  sourceTransactionId: string;
}

export const normalizeCustomReagentCatalogue = (value: unknown): CustomReagentCatalogueEntry[] => {
  if (!Array.isArray(value)) return [];
  const entries = new Map<string, CustomReagentCatalogueEntry>();
  value.forEach(row => {
    if (!row || typeof row !== 'object') return;
    const entry = row as CustomReagentCatalogueEntry;
    if (typeof entry.id !== 'string' || !entry.id.trim() || typeof entry.acquisitionId !== 'string'
      || typeof entry.name !== 'string' || !entry.name.trim() || typeof entry.preparation !== 'string' || !entry.preparation.trim()
      || !RULE_TAGS.includes(entry.targetTag) || !Number.isInteger(entry.potency) || entry.potency < 1
      || !Number.isFinite(entry.weight) || entry.weight < 0 || !Number.isInteger(entry.uses) || entry.uses < 1
      || !['replacement', 'foreign-reagent'].includes(entry.source)) return;
    entries.set(entry.id, { ...entry, requiredToolIds: Array.isArray(entry.requiredToolIds)
      ? entry.requiredToolIds.filter((id): id is string => typeof id === 'string') : [],
      sourcePage: entry.source === 'foreign-reagent' ? 195 : 30 });
  });
  return [...entries.values()];
};

/** Idempotent acquisition projection: it records definitions, never creates inventory rewards. */
export const rememberCustomReagents = (
  catalogue: unknown,
  inventory: readonly EngineInventoryItem[]
): CustomReagentCatalogueEntry[] => {
  const entries = new Map(normalizeCustomReagentCatalogue(catalogue).map(entry => [entry.id, entry]));
  inventory.forEach(item => {
    const custom = item.customReagent;
    const preparation = custom && preparationForInventory(item);
    if (!custom || !preparation) return;
    const metadata = (item as EngineInventoryItem & { encounterMetadata?: { kind?: string; reagentType?: CustomReagentCatalogueEntry['reagentType'] } }).encounterMetadata;
    const source = metadata?.kind === 'foreign-reagent' ? 'foreign-reagent' : 'replacement';
    const acquisitionId = item.provenance?.acquisitionId || item.id;
    const potency = preparation.tags.find(tag => tag.tag === custom.targetTag)?.value;
    if (!potency) return;
    const id = `${acquisitionId}:${custom.targetTag}:${potency}`;
    if (entries.has(id)) return;
    entries.set(id, { id, acquisitionId, name: item.name, preparation: preparation.method,
      targetTag: custom.targetTag, potency, weight: preparation.weight, uses: preparation.uses,
      requiredToolIds: preparation.requiredTools.filter(tool => tool !== 'none'),
      baseRarity: custom.baseRarity, reagentType: custom.reagentType || metadata?.reagentType,
      source, sourcePage: source === 'foreign-reagent' ? 195 : 30,
      sourceTransactionId: item.provenance?.sourceTransactionId || item.id });
  });
  return [...entries.values()];
};

export const customReagentCatalogueProjection = (
  catalogue: unknown,
  inventory: readonly EngineInventoryItem[] = [],
  search = ''
): Array<CustomReagentCatalogueEntry & { remainingUses: number; inBag: boolean }> => {
  const query = search.trim().toLowerCase();
  return rememberCustomReagents(catalogue, inventory)
    .filter(entry => !query || [entry.name, entry.preparation, entry.targetTag, entry.reagentType || ''].join(' ').toLowerCase().includes(query))
    .map(entry => {
      const remainingUses = inventory.filter(item => {
        const preparation = preparationForInventory(item);
        return (item.provenance?.acquisitionId || item.id) === entry.acquisitionId
          && item.customReagent?.targetTag === entry.targetTag
          && preparation?.tags.some(tag => tag.tag === entry.targetTag && tag.value === entry.potency);
      })
        .reduce((sum, item) => sum + Math.max(0, item.usesRemaining ?? entry.uses)
          + Math.max(0, (item.quantity ?? 1) - 1) * entry.uses, 0);
      return { ...entry, remainingUses, inBag: remainingUses > 0 };
    });
};
