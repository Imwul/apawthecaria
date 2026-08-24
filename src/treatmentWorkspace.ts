import {
  aggregateRemedyTagPotency,
  applyAilmentTagOverrides,
  evaluateRequirement,
  REAGENT_BY_ID,
  type RequirementExpression,
  type RuleTag,
  type TreatmentDraft,
  type TreatmentAilmentTagOverride
} from './rules';

export type TreatmentRequirementRowState = 'satisfied' | 'available' | 'missing' | 'manual';

export interface TreatmentRequirementProgressRow {
  id: string;
  label: string;
  selectedProgress: string;
  ownedProgress: string;
  state: TreatmentRequirementRowState;
  stateLabel: string;
}

export interface TreatmentDraftInventoryItem {
  id: string;
  canonicalReagentId?: string;
  preparationId?: string;
  provenance?: {
    source?: string;
    region?: string;
  };
}

export interface ForageRequirementProgress {
  ownedPotency: number;
  plannedPotency: number;
  projectedPotency: number;
  satisfied: boolean;
  potential: boolean;
}

/**
 * A research note is only a plan (rulebook pp.30-32), never an owned Part.
 * Keep its projected contribution visible without allowing it to satisfy the
 * treatment requirement before the Part is actually in Inventory.
 */
export const deriveForageRequirementProgress = ({
  tag,
  threshold,
  ownedPotency,
  plannedPotencies
}: {
  tag: RuleTag;
  threshold: number;
  ownedPotency: number;
  plannedPotencies: readonly number[];
}): ForageRequirementProgress => {
  const owned = aggregateRemedyTagPotency(tag, [ownedPotency]);
  const planned = aggregateRemedyTagPotency(tag, [...plannedPotencies]);
  const projected = aggregateRemedyTagPotency(tag, [owned, ...plannedPotencies]);
  const required = Math.max(0, threshold);
  const satisfied = owned >= required;
  return {
    ownedPotency: owned,
    plannedPotency: planned,
    projectedPotency: projected,
    satisfied,
    potential: !satisfied && projected >= required
  };
};

/**
 * Rebuild the persisted treatment selection after an inventory item is
 * removed.  The inventory order is significant: PURIFY is legal only when
 * the last gathered selected Reagent came from a Mountain location (p.180).
 *
 * Keeping this calculation outside the two inventory UIs prevents a removed
 * Part or Tool from surviving in CATALYSE, FAIR/FOUL, or PURIFY mirrors.
 */
export const reconcileTreatmentDraftAfterBagRemoval = ({
  draft,
  removedItemId,
  remainingInventory,
  updatedAt = Date.now()
}: {
  draft: TreatmentDraft;
  removedItemId: string;
  remainingInventory: readonly TreatmentDraftInventoryItem[];
  updatedAt?: number;
}): TreatmentDraft => {
  const remainingById = new Map(remainingInventory.map(item => [item.id, item]));
  const selectedParts = draft.selectedParts
    .filter(part => part.itemId !== removedItemId && remainingById.has(part.itemId))
    .map(part => {
      const item = remainingById.get(part.itemId)!;
      return {
        itemId: part.itemId,
        reagentId: item.canonicalReagentId || part.reagentId,
        preparationId: item.preparationId || part.preparationId
      };
    });
  const selectedPartIds = new Set(selectedParts.map(part => part.itemId));
  const preparations = selectedParts.flatMap(part => part.reagentId && part.preparationId
    ? [REAGENT_BY_ID.get(part.reagentId)?.preparations.find(row => row.id === part.preparationId)]
    : []).filter((row): row is NonNullable<typeof row> => Boolean(row));
  const fair = preparations.reduce((sum, preparation) => sum + preparation.tags
    .filter(tag => tag.tag === 'FAIR')
    .reduce((part, tag) => part + tag.value, 0), 0);
  const rawFoul = preparations.reduce((sum, preparation) => sum + preparation.tags
    .filter(tag => tag.tag === 'FOUL')
    .reduce((part, tag) => part + tag.value, 0), 0);
  const lastSelectedReagent = [...remainingInventory].reverse().find(item => selectedPartIds.has(item.id));
  const purify = Boolean(draft.purify
    && lastSelectedReagent?.provenance?.source === 'forage'
    && lastSelectedReagent.provenance.region === 'Mountain');

  return {
    ...draft,
    selectedParts,
    selectedPreparationIds: selectedParts.flatMap(part => part.preparationId ? [part.preparationId] : []),
    selectedToolIds: draft.selectedToolIds.filter(toolId => toolId !== removedItemId),
    catalyse: draft.catalyse.filter(row => row.itemIds.length === 2
      && row.itemIds[0] !== row.itemIds[1]
      && row.itemIds.every(itemId => selectedPartIds.has(itemId))),
    fair,
    foul: purify ? 0 : rawFoul,
    purify,
    updatedAt
  };
};

const tagsInRequirement = (requirement: RequirementExpression): RuleTag[] => {
  if (requirement.kind === 'tag') return [requirement.tag];
  if (requirement.kind === 'special') return [];
  const children = requirement.kind === 'alternatives' ? requirement.alternatives : requirement.requirements;
  return children.flatMap(tagsInRequirement);
};

const containsManualRequirement = (requirement: RequirementExpression): boolean => {
  if (requirement.kind === 'special') return true;
  if (requirement.kind === 'tag') return false;
  const children = requirement.kind === 'alternatives' ? requirement.alternatives : requirement.requirements;
  return children.some(containsManualRequirement);
};

const formatRequirement = (requirement: RequirementExpression): string => {
  if (requirement.kind === 'tag') return `${requirement.tag} ${requirement.threshold}`;
  if (requirement.kind === 'special') return requirement.description;
  const children = requirement.kind === 'alternatives' ? requirement.alternatives : requirement.requirements;
  const joined = children.map(formatRequirement).join(requirement.kind === 'allOf' ? ' + ' : ' / ');
  return requirement.kind === 'allOf' ? joined : `${joined} 중 하나`;
};

const formatProgress = (
  requirement: RequirementExpression,
  provided: Partial<Record<RuleTag, number>>
): string => {
  if (requirement.kind === 'tag') return `${requirement.tag} ${provided[requirement.tag] || 0}/${requirement.threshold}`;
  if (requirement.kind === 'special') return '원문을 보고 직접 확인';
  const children = requirement.kind === 'alternatives' ? requirement.alternatives : requirement.requirements;
  return children.map(child => formatProgress(child, provided)).join(requirement.kind === 'allOf' ? ' · ' : ' / ');
};

const rowStateLabel: Record<TreatmentRequirementRowState, string> = {
  satisfied: '선택으로 충족',
  available: '가방에 있음',
  missing: '가방에 부족',
  manual: '직접 확인 필요'
};

export const buildTreatmentRequirementRows = ({
  requirement,
  ailmentId,
  overrides = [],
  selectedTags,
  ownedTags,
  catalyseTags = []
}: {
  requirement: RequirementExpression;
  ailmentId: string;
  overrides?: readonly TreatmentAilmentTagOverride[];
  selectedTags: Partial<Record<RuleTag, number>>;
  ownedTags: Partial<Record<RuleTag, number>>;
  catalyseTags?: readonly RuleTag[];
}): TreatmentRequirementProgressRow[] => {
  const applied = applyAilmentTagOverrides(requirement, ailmentId, overrides);
  const rows = applied.kind === 'allOf'
    ? applied.requirements.map((entry, index) => ({ entry, prefix: '', id: `required-${index}` }))
    : applied.kind === 'alternatives'
      ? applied.alternatives.map((entry, index) => ({ entry, prefix: `처방안 ${String.fromCharCode(65 + index)} · `, id: `alternative-${index}` }))
      : [{ entry: applied, prefix: '', id: 'required-0' }];

  return rows.map(({ entry, prefix, id }) => {
    const selectedSatisfied = evaluateRequirement(entry, selectedTags).satisfied;
    const ownedSatisfied = evaluateRequirement(entry, ownedTags).satisfied;
    const catalyseAvailable = tagsInRequirement(entry).some(tag => catalyseTags.includes(tag));
    const manual = containsManualRequirement(entry);
    const state: TreatmentRequirementRowState = selectedSatisfied
      ? (manual ? 'manual' : 'satisfied')
      : (ownedSatisfied || catalyseAvailable) ? 'available' : 'missing';
    return {
      id,
      label: `${prefix}${formatRequirement(entry)}`,
      selectedProgress: formatProgress(entry, selectedTags),
      ownedProgress: `${formatProgress(entry, ownedTags)}${catalyseAvailable && !ownedSatisfied ? ' · CATALYSE 가능' : ''}`,
      state,
      stateLabel: rowStateLabel[state]
    };
  });
};
