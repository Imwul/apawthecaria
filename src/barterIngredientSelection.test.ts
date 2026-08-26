import { describe, expect, it } from 'vitest';
import {
  buildCanonicalBarterSelections,
  canonicalBarterSelectionKey,
  filterCanonicalBarterSelections,
  findCanonicalBarterSelection,
  parseCanonicalBarterSelectionKey
} from './barterIngredientSelection';
import { REAGENT_BY_ID } from './rules/data/reagents';

const identity = (rows: ReturnType<typeof buildCanonicalBarterSelections>) =>
  rows.map(row => row.key);

describe('canonical Barter ingredient selection', () => {
  it('builds preparation-level Nettles choices with exact canonical identity', () => {
    const rows = filterCanonicalBarterSelections(buildCanonicalBarterSelections(), 'Nettles');

    expect(rows.map(row => ({
      reagentId: row.reagentId,
      preparationId: row.preparationId,
      part: row.preparation.name,
      method: row.preparation.method
    }))).toEqual([
      {
        reagentId: 'reagent-nettles',
        preparationId: 'nettles-leaves-brewed-1',
        part: 'Leaves',
        method: 'BREWED'
      },
      {
        reagentId: 'reagent-nettles',
        preparationId: 'nettles-stems-chewed-2',
        part: 'Stems',
        method: 'CHEWED'
      }
    ]);
    expect(parseCanonicalBarterSelectionKey(rows[0].key)).toEqual({
      reagentId: 'reagent-nettles',
      preparationId: 'nettles-leaves-brewed-1'
    });
    expect(parseCanonicalBarterSelectionKey('reagent-nettles')).toBeNull();
  });

  it('finds Rosehip through canonical Roses preparations instead of inventing a reagent', () => {
    const rows = filterCanonicalBarterSelections(buildCanonicalBarterSelections(), 'Rosehip');

    expect(rows).toHaveLength(2);
    expect(rows.every(row => row.reagentId === 'reagent-roses')).toBe(true);
    expect(rows.map(row => row.preparationId)).toEqual([
      'roses-rosehips-crushed-3',
      'roses-rosehips-distilled-4'
    ]);
    expect(REAGENT_BY_ID.has('reagent-rosehip')).toBe(false);
  });

  it('searches exact, partial, middle, case-insensitive, and Korean canonical presentation text', () => {
    const rows = buildCanonicalBarterSelections();

    expect(filterCanonicalBarterSelections(rows, 'NETTLES')).toHaveLength(2);
    expect(filterCanonicalBarterSelections(rows, 'ettle')).toHaveLength(2);
    expect(filterCanonicalBarterSelections(rows, '쐐기풀')).toHaveLength(2);
    expect(filterCanonicalBarterSelections(rows, '장미 열매')).toHaveLength(2);
    expect(filterCanonicalBarterSelections(rows, 'rosehips 증류')).toMatchObject([
      { reagentId: 'reagent-roses', preparationId: 'roses-rosehips-distilled-4' }
    ]);
  });

  it('returns no phantom choice for a typo and the complete catalogue for blank search', () => {
    const rows = buildCanonicalBarterSelections();

    expect(filterCanonicalBarterSelections(rows, 'Nettlez')).toEqual([]);
    expect(filterCanonicalBarterSelections(rows, '   ')).toEqual(rows);
  });

  it('retains unrelated legal choices when a Patient requirement is present', () => {
    const rows = buildCanonicalBarterSelections({
      patientRequirements: [{ tag: 'INFECTION', threshold: 1 }]
    });
    const nettlesLeaves = findCanonicalBarterSelection(
      rows,
      canonicalBarterSelectionKey('reagent-nettles', 'nettles-leaves-brewed-1')
    );
    const rosehips = filterCanonicalBarterSelections(rows, 'Rosehip');

    expect(nettlesLeaves?.patientRelevantTags).toEqual([{ tag: 'INFECTION', value: 1 }]);
    expect(rosehips).toHaveLength(2);
    expect(rosehips.every(row => row.patientRelevantTags.length === 0)).toBe(true);
  });

  it('keeps every matching Part visible instead of implying one uniquely correct remedy', () => {
    const rows = buildCanonicalBarterSelections({
      patientRequirements: [{ tag: 'HIDE', threshold: 1 }]
    });
    const matching = rows.filter(row => row.patientRelevantTags.some(tag => tag.tag === 'HIDE'));

    expect(matching.length).toBeGreaterThan(1);
    expect(matching.some(row => row.reagentId === 'reagent-roses')).toBe(true);
    expect(rows.every(row => row.reagent.type !== 'TITAN')).toBe(true);
  });

  it('does not mark a weaker matching Part when tags cannot stack by default', () => {
    const rows = buildCanonicalBarterSelections({
      patientRequirements: [{ tag: 'INFECTION', threshold: 3 }]
    });
    const nettlesLeaves = findCanonicalBarterSelection(
      rows,
      canonicalBarterSelectionKey('reagent-nettles', 'nettles-leaves-brewed-1')
    );

    expect(nettlesLeaves?.patientRelevantTags).toEqual([]);
  });

  it('includes a threshold-satisfying FAIR Part in Patient context without changing its trade category', () => {
    const rows = buildCanonicalBarterSelections({
      patientRequirements: [{ tag: 'FAIR', threshold: 4 }]
    });
    const cookedStrawberries = rows.find(row =>
      row.reagentId === 'reagent-strawberries'
      && row.preparation.name === 'Berries'
      && row.preparation.method === 'COOKED'
    );

    expect(cookedStrawberries?.patientRelevantTags).toEqual([{ tag: 'FAIR', value: 4 }]);
    expect(cookedStrawberries?.remedyTags).toEqual([]);
    expect(cookedStrawberries?.tradeTags).toEqual([{ tag: 'FAIR', value: 4 }]);
  });

  it('does not use Patient relevance or owned quantity to change canonical ordering', () => {
    const baseline = buildCanonicalBarterSelections();
    const annotated = buildCanonicalBarterSelections({
      patientRequirements: [{ tag: 'SLEEP', threshold: 1 }],
      inventory: [{
        canonicalReagentId: 'reagent-roses',
        preparationId: 'roses-rosehips-crushed-3',
        quantity: 99
      }]
    });

    expect(identity(annotated)).toEqual(identity(baseline));
    const firstReagentNames = Array.from(new Set(annotated.map(row => row.reagent.canonicalName)));
    expect(firstReagentNames).toEqual([...firstReagentNames].sort((a, b) =>
      new Intl.Collator('en', { sensitivity: 'base' }).compare(a, b)
    ));
  });

  it('counts only inventory with both matching canonical IDs', () => {
    const rows = buildCanonicalBarterSelections({
      inventory: [
        { canonicalReagentId: 'reagent-roses', preparationId: 'roses-rosehips-crushed-3', quantity: 2 },
        { canonicalReagentId: 'reagent-roses', preparationId: 'roses-rosehips-crushed-3', qty: 3 },
        { canonicalReagentId: 'reagent-roses', preparationId: 'roses-rosehips-distilled-4', quantity: 7 },
        { canonicalReagentId: 'reagent-nettles', preparationId: 'roses-rosehips-crushed-3', quantity: 11 },
        { canonicalReagentId: 'reagent-roses', quantity: 13 }
      ]
    });

    expect(findCanonicalBarterSelection(
      rows,
      canonicalBarterSelectionKey('reagent-roses', 'roses-rosehips-crushed-3')
    )?.ownedQuantity).toBe(5);
    expect(findCanonicalBarterSelection(
      rows,
      canonicalBarterSelectionKey('reagent-roses', 'roses-rosehips-distilled-4')
    )?.ownedQuantity).toBe(7);
  });
});
