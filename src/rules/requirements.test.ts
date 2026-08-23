import { describe, expect, it } from 'vitest';
import { aggregateRemedyTagPotency } from './requirements';

describe('aggregateRemedyTagPotency', () => {
  it('uses only the strongest copy of an ordinary remedy tag', () => {
    expect(aggregateRemedyTagPotency('MOOD', [1, 2, 2])).toBe(2);
    expect(aggregateRemedyTagPotency('SCALE', [1, 3])).toBe(3);
  });

  it('stacks FAIR and FOUL as the printed exception', () => {
    expect(aggregateRemedyTagPotency('FAIR', [1, 2, 3])).toBe(6);
    expect(aggregateRemedyTagPotency('FOUL', [2, 4])).toBe(6);
  });

  it('ignores invalid and non-positive preview values', () => {
    expect(aggregateRemedyTagPotency('PAIN', [Number.NaN, -2, 0])).toBe(0);
  });
});
