import type { RequirementExpression, RuleTag } from './types';

export interface RequirementEvaluation {
  satisfied: boolean;
  missing: string[];
  manual: string[];
}

const combineAll = (results: RequirementEvaluation[]): RequirementEvaluation => ({
  satisfied: results.every(result => result.satisfied),
  missing: results.flatMap(result => result.missing),
  manual: results.flatMap(result => result.manual)
});

/**
 * Remedy tags normally do not stack: a remedy only uses the strongest copy of
 * a tag. FAIR and FOUL are the printed exception and add together before they
 * cancel one another (rulebook p.27). Keeping this rule in one helper prevents
 * planning UIs from promising a remedy the transaction engine would reject.
 */
export const aggregateRemedyTagPotency = (tag: RuleTag, values: number[]): number => {
  const usableValues = values.filter(value => Number.isFinite(value) && value > 0);
  return tag === 'FAIR' || tag === 'FOUL'
    ? usableValues.reduce((sum, value) => sum + value, 0)
    : Math.max(0, ...usableValues);
};

export const evaluateRequirement = (
  requirement: RequirementExpression,
  providedTags: Partial<Record<RuleTag, number>>
): RequirementEvaluation => {
  if (requirement.kind === 'tag') {
    const provided = providedTags[requirement.tag] || 0;
    return {
      satisfied: provided >= requirement.threshold,
      missing: provided >= requirement.threshold ? [] : [`${requirement.tag} ${requirement.threshold} (provided ${provided})`],
      manual: []
    };
  }
  if (requirement.kind === 'special') {
    return { satisfied: true, missing: [], manual: [`${requirement.code}: ${requirement.description}`] };
  }
  const branches = requirement.kind === 'alternatives' ? requirement.alternatives : requirement.requirements;
  const results = branches.map(branch => evaluateRequirement(branch, providedTags));
  if (requirement.kind === 'allOf') return combineAll(results);
  const satisfied = results.find(result => result.satisfied);
  if (satisfied) return { satisfied: true, missing: [], manual: satisfied.manual };
  return {
    satisfied: false,
    missing: [`One of: ${results.flatMap(result => result.missing).join(' OR ')}`],
    manual: results.flatMap(result => result.manual)
  };
};
