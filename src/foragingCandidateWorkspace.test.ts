import { describe, expect, it } from 'vitest';
import { defaultForageCandidateFilter, filterForageCandidateRows, type ForageCandidateFilter } from './foragingCandidateWorkspace';

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

  it('starts with remembered candidates that are in this legal result before patient matches', () => {
    const original = structuredClone(rows);
    const selected = defaultForageCandidateFilter(rows, context);
    expect(selected).toBe('remembered');
    expect(filterForageCandidateRows(rows, { ...context, query: '', filter: selected }).map(row => row.reagentId))
      .toEqual(['reagent-22']);
    expect(rows).toEqual(original);
  });

  it('falls back to patient matches when the note has no candidates in the current result', () => {
    const current = { ...context, rememberedReagentIds: new Set(['reagent-not-found-here']) };
    const selected = defaultForageCandidateFilter(rows, current);
    expect(selected).toBe('patient');
    expect(filterForageCandidateRows(rows, { ...current, query: '', filter: selected }).map(row => row.reagentId))
      .toEqual(['reagent-2', 'reagent-22']);
  });

  it('keeps every legal candidate when neither notes nor patient needs intersect the result', () => {
    const current = { ...context, rememberedReagentIds: new Set(['missing-note']), patientRelevantReagentIds: new Set(['missing-need']) };
    const selected = defaultForageCandidateFilter(rows, current);
    expect(selected).toBe('all');
    expect(filterForageCandidateRows(rows, { ...current, query: '', filter: selected })).toEqual(rows);
    expect(defaultForageCandidateFilter([], current)).toBe('all');
    expect(defaultForageCandidateFilter([{ name: 'Uncatalogued find' }], current)).toBe('all');
  });

  it('preserves an explicit all choice and the original off-prescription options after a contextual default', () => {
    const chosen: ForageCandidateFilter | null = 'all';
    const active = chosen ?? defaultForageCandidateFilter(rows, context);
    const visible = filterForageCandidateRows(rows, { ...context, query: '', filter: active });
    expect(defaultForageCandidateFilter(rows, context)).toBe('remembered');
    expect(visible).toEqual(rows);
    expect(visible[0]).toBe(rows[0]);
    expect(visible.some(row => row.reagentId === 'reagent-38')).toBe(true);
  });
});
