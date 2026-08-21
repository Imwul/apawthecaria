import { describe, expect, it } from 'vitest';
import { buildTreatmentRequirementRows } from './treatmentWorkspace';
import type { RequirementExpression } from './rules';

describe('Treatment workspace requirement comparison', () => {
  it('distinguishes selected, available, and missing canonical requirements', () => {
    const requirement: RequirementExpression = {
      kind: 'allOf',
      requirements: [
        { kind: 'tag', tag: 'PAIN', threshold: 2 },
        { kind: 'tag', tag: 'FAIR', threshold: 3 }
      ]
    };
    const available = buildTreatmentRequirementRows({
      requirement,
      ailmentId: 'waen-drops',
      selectedTags: { FAIR: 1 },
      ownedTags: { PAIN: 2, FAIR: 3 }
    });
    expect(available.map(row => row.state)).toEqual(['available', 'available']);
    expect(available[0].selectedProgress).toBe('PAIN 0/2');
    expect(available[1].ownedProgress).toBe('FAIR 3/3');

    const selected = buildTreatmentRequirementRows({
      requirement,
      ailmentId: 'waen-drops',
      selectedTags: { PAIN: 2, FAIR: 3 },
      ownedTags: { PAIN: 2, FAIR: 3 }
    });
    expect(selected.every(row => row.state === 'satisfied')).toBe(true);

    const missing = buildTreatmentRequirementRows({
      requirement,
      ailmentId: 'waen-drops',
      selectedTags: {},
      ownedTags: { FAIR: 1 }
    });
    expect(missing.map(row => row.state)).toEqual(['missing', 'missing']);
  });

  it('keeps alternatives and manual requirements explicit instead of inventing a result', () => {
    const choice: RequirementExpression = {
      kind: 'allOf',
      requirements: [
        { kind: 'anyOf', requirements: [
          { kind: 'tag', tag: 'FUR', threshold: 1 },
          { kind: 'tag', tag: 'FEATHER', threshold: 1 }
        ] },
        { kind: 'special', code: 'NARRATIVE', description: '환자의 반응을 직접 판단합니다.' }
      ]
    };
    const rows = buildTreatmentRequirementRows({
      requirement: choice,
      ailmentId: 'manual-choice',
      selectedTags: { FEATHER: 1 },
      ownedTags: { FEATHER: 1 }
    });
    expect(rows[0]).toMatchObject({ state: 'satisfied', stateLabel: '선택으로 충족' });
    expect(rows[0].label).toContain('중 하나');
    expect(rows[1]).toMatchObject({ state: 'manual', stateLabel: '직접 확인 필요' });
  });

  it('uses the same ailment Tag override as the treatment engine', () => {
    const rows = buildTreatmentRequirementRows({
      requirement: { kind: 'tag', tag: 'PAIN', threshold: 2 },
      ailmentId: 'practice-case',
      overrides: [{ ailmentId: 'practice-case', originalTag: 'PAIN', replacementTag: 'JOY' }],
      selectedTags: { JOY: 2 },
      ownedTags: { JOY: 2 }
    });
    expect(rows[0]).toMatchObject({ label: 'JOY 2', state: 'satisfied' });
  });
});
