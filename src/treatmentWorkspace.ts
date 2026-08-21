import {
  applyAilmentTagOverrides,
  evaluateRequirement,
  type RequirementExpression,
  type RuleTag,
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
