import { describe, expect, it } from 'vitest';
import {
  buildTreatmentRequirementRows,
  deriveForageRequirementProgress,
  reconcileTreatmentDraftAfterBagRemoval
} from './treatmentWorkspace';
import { REAGENTS, type RequirementExpression, type TreatmentDraft } from './rules';

describe('Treatment workspace requirement comparison', () => {
  it('keeps a researched PAIN 2 plan potential-only until the Part is owned', () => {
    const planned = deriveForageRequirementProgress({
      tag: 'PAIN',
      threshold: 2,
      ownedPotency: 0,
      plannedPotencies: [2]
    });
    expect(planned).toEqual({
      ownedPotency: 0,
      plannedPotency: 2,
      projectedPotency: 2,
      satisfied: false,
      potential: true
    });

    const acquired = deriveForageRequirementProgress({
      tag: 'PAIN',
      threshold: 2,
      ownedPotency: 2,
      plannedPotencies: []
    });
    expect(acquired).toEqual({
      ownedPotency: 2,
      plannedPotency: 0,
      projectedPotency: 2,
      satisfied: true,
      potential: false
    });
  });

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

  it('removes a discarded Part from every dependent treatment draft field', () => {
    const fairReagent = REAGENTS.find(reagent => reagent.preparations.some(part => part.tags.some(tag => tag.tag === 'FAIR'))) !;
    const fairPart = fairReagent.preparations.find(part => part.tags.some(tag => tag.tag === 'FAIR'))!;
    const foulReagent = REAGENTS.find(reagent => reagent.preparations.some(part => part.tags.some(tag => tag.tag === 'FOUL'))) !;
    const foulPart = foulReagent.preparations.find(part => part.tags.some(tag => tag.tag === 'FOUL'))!;
    const fairValue = fairPart.tags.filter(tag => tag.tag === 'FAIR').reduce((sum, tag) => sum + tag.value, 0);
    const draft: TreatmentDraft = {
      id: 'draft', patientId: 'patient', ailmentInstanceId: 'ailment',
      selectedParts: [
        { itemId: 'fair-part', reagentId: fairReagent.id, preparationId: fairPart.id },
        { itemId: 'foul-part', reagentId: foulReagent.id, preparationId: foulPart.id }
      ],
      selectedPreparationIds: [fairPart.id, foulPart.id],
      selectedToolIds: ['alembic', 'discarded-tool'],
      catalyse: [{ tag: 'MOOD', itemIds: ['fair-part', 'foul-part'] }],
      fair: 999, foul: 999, purify: true, replacementContext: null,
      status: 'draft', committedTransactionId: null, createdAt: 1, updatedAt: 1
    };

    const next = reconcileTreatmentDraftAfterBagRemoval({
      draft,
      removedItemId: 'foul-part',
      remainingInventory: [{
        id: 'fair-part', canonicalReagentId: fairReagent.id, preparationId: fairPart.id,
        provenance: { source: 'forage', region: 'Mountain' }
      }, { id: 'alembic' }, { id: 'discarded-tool' }],
      updatedAt: 2
    });

    expect(next.selectedParts.map(part => part.itemId)).toEqual(['fair-part']);
    expect(next.selectedPreparationIds).toEqual([fairPart.id]);
    expect(next.catalyse).toEqual([]);
    expect(next.fair).toBe(fairValue);
    expect(next.foul).toBe(0);
    expect(next.purify).toBe(true);
    expect(next.updatedAt).toBe(2);
  });

  it('removes discarded Tools and disables PURIFY when the last remaining selected Part is not Mountain-gathered', () => {
    const reagent = REAGENTS.find(candidate => candidate.preparations.length > 0)!;
    const part = reagent.preparations[0];
    const draft: TreatmentDraft = {
      id: 'draft', patientId: 'patient', ailmentInstanceId: 'ailment',
      selectedParts: [{ itemId: 'part', reagentId: reagent.id, preparationId: part.id }],
      selectedPreparationIds: [part.id], selectedToolIds: ['discarded-tool'], catalyse: [],
      fair: 0, foul: 0, purify: true, replacementContext: null,
      status: 'draft', committedTransactionId: null, createdAt: 1, updatedAt: 1
    };

    const next = reconcileTreatmentDraftAfterBagRemoval({
      draft,
      removedItemId: 'discarded-tool',
      remainingInventory: [{
        id: 'part', canonicalReagentId: reagent.id, preparationId: part.id,
        provenance: { source: 'forage', region: 'Forest' }
      }],
      updatedAt: 2
    });

    expect(next.selectedToolIds).toEqual([]);
    expect(next.selectedParts).toHaveLength(1);
    expect(next.purify).toBe(false);
  });
});
