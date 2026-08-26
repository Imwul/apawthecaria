import { describe, expect, it } from 'vitest';
import { filterForageCandidateRows } from './foragingCandidateWorkspace';

const rows = Array.from({ length: 38 }, (_, index) => ({
  reagentId: `reagent-${index + 1}`,
  name: index === 21 ? 'Marigold (금잔화)' : `Reagent ${index + 1}`
}));

const context = {
  aliasesByReagentId: new Map([['reagent-22', ['Marigold', '금잔화']]]),
  rememberedReagentIds: new Set(['reagent-22']),
  patientRelevantReagentIds: new Set(['reagent-2', 'reagent-22']),
  ownedReagentIds: new Set(['reagent-3', 'reagent-22'])
};

describe('large forage candidate workspace', () => {
  it('keeps the full legal pool and its canonical order when no lens is active', () => {
    const visible = filterForageCandidateRows(rows, { ...context, query: '', filter: 'all' });
    expect(visible).toEqual(rows);
    expect(visible).not.toBe(rows);
  });

  it('finds a remembered candidate by English or Korean name without reordering it', () => {
    expect(filterForageCandidateRows(rows, { ...context, query: 'marigold', filter: 'all' }).map(row => row.reagentId))
      .toEqual(['reagent-22']);
    expect(filterForageCandidateRows(rows, { ...context, query: '금잔화', filter: 'remembered' }).map(row => row.reagentId))
      .toEqual(['reagent-22']);
  });

  it('uses patient and owned context only as explicit filters', () => {
    expect(filterForageCandidateRows(rows, { ...context, query: '', filter: 'patient' }).map(row => row.reagentId))
      .toEqual(['reagent-2', 'reagent-22']);
    expect(filterForageCandidateRows(rows, { ...context, query: '', filter: 'owned' }).map(row => row.reagentId))
      .toEqual(['reagent-3', 'reagent-22']);
  });
});
