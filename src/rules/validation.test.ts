import { describe, expect, it } from 'vitest';
import { findDuplicateIds, formatValidationIssues, validateCanonicalData } from './validation';
import { AILMENTS, ENCOUNTERS, PRINTED_EFFECT_REGISTRY } from './index';

describe('canonical build validation', () => {
  it('[TABLE-001/TABLE-002/TABLE-003/TABLE-004/TABLE-005] has no canonical data errors', () => {
    const report = validateCanonicalData();
    expect(report.errors, formatValidationIssues(report.errors)).toEqual([]);
  });

  it('[SAVE-005/TABLE-003] detects duplicate IDs deterministically', () => {
    expect(findDuplicateIds(['a', 'b', 'a', 'c', 'b', 'b'])).toEqual(['a', 'b']);
  });

  it('[CORE-002/AILMENT-003/TRAVEL-009] validates one printed-effect record for every Encounter and named Ailment', () => {
    expect(PRINTED_EFFECT_REGISTRY).toHaveLength(ENCOUNTERS.length + AILMENTS.length);
    expect(new Set(PRINTED_EFFECT_REGISTRY.map(row => row.id)).size).toBe(PRINTED_EFFECT_REGISTRY.length);
    expect(PRINTED_EFFECT_REGISTRY.every(row => row.ruleIds.length > 0 && row.executor.length > 0)).toBe(true);
  });
});
