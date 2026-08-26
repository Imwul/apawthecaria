export type ForageCandidateFilter = 'all' | 'remembered' | 'patient' | 'owned';

export interface ForageCandidateRowLike {
  name: string;
  reagentId?: string;
}

export interface ForageCandidateViewContext {
  query: string;
  filter: ForageCandidateFilter;
  aliasesByReagentId?: ReadonlyMap<string, readonly string[]>;
  rememberedReagentIds: ReadonlySet<string>;
  patientRelevantReagentIds: ReadonlySet<string>;
  ownedReagentIds: ReadonlySet<string>;
}

/**
 * Narrows only the current canonical result. Array order and row identity are
 * deliberately preserved: this is a neutral lens, never a ranking function.
 */
export const filterForageCandidateRows = <T extends ForageCandidateRowLike>(
  rows: readonly T[],
  context: ForageCandidateViewContext
): T[] => {
  const query = context.query.trim().toLocaleLowerCase();
  return rows.filter(row => {
    const id = row.reagentId || '';
    const matchesFilter = context.filter === 'all'
      || (context.filter === 'remembered' && context.rememberedReagentIds.has(id))
      || (context.filter === 'patient' && context.patientRelevantReagentIds.has(id))
      || (context.filter === 'owned' && context.ownedReagentIds.has(id));
    if (!matchesFilter) return false;
    if (!query) return true;
    return [row.name, ...(context.aliasesByReagentId?.get(id) || [])]
      .some(label => label.toLocaleLowerCase().includes(query));
  });
};
