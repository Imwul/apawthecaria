import {
  formatPreparationName,
  localizePreparationMethod
} from './localization/gameplayKo';
import { formatReagentName, splitForagingTags } from './foragingInventoryPresentation';
import { REAGENTS } from './rules/data/reagents';
import type { ReagentDefinition, ReagentPreparation, RuleTag, TagValue } from './rules/types';

export interface BarterSelectionInventoryItem {
  canonicalReagentId?: string | null;
  preparationId?: string | null;
  quantity?: number | null;
  qty?: number | null;
}

export interface BarterPatientRequirement {
  tag: RuleTag;
  threshold: number;
}

export interface CanonicalBarterIngredientSelection {
  /** Stable UI value; the transaction still receives the two canonical IDs separately. */
  key: string;
  reagentId: string;
  preparationId: string;
  reagent: ReagentDefinition;
  preparation: ReagentPreparation;
  reagentLabel: string;
  preparationLabel: string;
  methodLabel: string;
  remedyTags: TagValue[];
  tradeTags: TagValue[];
  patientRelevantTags: TagValue[];
  ownedQuantity: number;
  searchText: string;
}

export interface BuildCanonicalBarterSelectionsInput {
  inventory?: readonly BarterSelectionInventoryItem[];
  patientRequirements?: readonly BarterPatientRequirement[];
}

const ENGLISH_NAME_ORDER = new Intl.Collator('en', { sensitivity: 'base' });

const normalizeSearchText = (value: string): string => value
  .normalize('NFKC')
  .toLocaleLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

export const matchesCanonicalSearchText = (searchText: string, query: string): boolean => {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);
  const normalizedSearchText = normalizeSearchText(searchText);
  return terms.every(term => normalizedSearchText.includes(term));
};

const inventoryUnits = (item: BarterSelectionInventoryItem): number => {
  const value = item.qty ?? item.quantity ?? 1;
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
};

export const canonicalBarterSelectionKey = (reagentId: string, preparationId: string): string =>
  `${reagentId}::${preparationId}`;

export const parseCanonicalBarterSelectionKey = (
  key: string
): { reagentId: string; preparationId: string } | null => {
  const parts = key.split('::');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { reagentId: parts[0], preparationId: parts[1] };
};

/**
 * Builds the Barter catalogue from the same canonical registry used by the
 * transaction engine. Patient relevance and owned quantity are annotations;
 * neither is allowed to remove or reorder a legal choice.
 */
export const buildCanonicalBarterSelections = (
  input: BuildCanonicalBarterSelectionsInput = {}
): CanonicalBarterIngredientSelection[] => {
  const inventory = input.inventory ?? [];
  const patientRequirements = input.patientRequirements ?? [];

  return [...REAGENTS]
    .filter(reagent => reagent.type !== 'TITAN')
    .sort((a, b) => ENGLISH_NAME_ORDER.compare(a.canonicalName, b.canonicalName))
    .flatMap(reagent => reagent.preparations.map(preparation => {
      const { remedy, trade } = splitForagingTags(preparation.tags);
      // General remedy tags do not stack by default.  Keep the annotation
      // conservative: a Part is relevant only when it can satisfy one of the
      // current requirements by itself.  This remains context, not a filter or
      // recommendation; CATALYSE is resolved later in the treatment workflow.
      const patientRelevantTags = preparation.tags.filter(value => patientRequirements.some(requirement =>
        requirement.tag === value.tag && value.value >= requirement.threshold
      ));
      const ownedQuantity = inventory
        .filter(item => item.canonicalReagentId === reagent.id && item.preparationId === preparation.id)
        .reduce((total, item) => total + inventoryUnits(item), 0);
      const reagentLabel = formatReagentName(reagent);
      const preparationLabel = formatPreparationName(preparation.name);
      const methodLabel = localizePreparationMethod(preparation.method);
      const searchText = normalizeSearchText([
        reagent.canonicalName,
        reagent.displayName,
        reagentLabel,
        preparation.name,
        preparationLabel,
        preparation.method,
        methodLabel
      ].join(' '));

      return {
        key: canonicalBarterSelectionKey(reagent.id, preparation.id),
        reagentId: reagent.id,
        preparationId: preparation.id,
        reagent,
        preparation,
        reagentLabel,
        preparationLabel,
        methodLabel,
        remedyTags: remedy,
        tradeTags: trade,
        patientRelevantTags,
        ownedQuantity,
        searchText
      };
    }));
};

/** Blank search deliberately keeps the complete neutral catalogue visible. */
export const filterCanonicalBarterSelections = (
  selections: readonly CanonicalBarterIngredientSelection[],
  query: string
): CanonicalBarterIngredientSelection[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [...selections];
  return selections.filter(selection => matchesCanonicalSearchText(selection.searchText, normalizedQuery));
};

export const findCanonicalBarterSelection = (
  selections: readonly CanonicalBarterIngredientSelection[],
  key: string
): CanonicalBarterIngredientSelection | null => selections.find(selection => selection.key === key) ?? null;
