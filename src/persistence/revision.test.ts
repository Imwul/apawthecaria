import { describe, expect, it } from 'vitest';
import { nextCampaignSaveRevision, normalizeSaveRevision } from './revision';

describe('campaign save revision monotonicity', () => {
  it('recovers numeric legacy values and rejects unsafe values', () => {
    expect(normalizeSaveRevision('12')).toBe(12);
    expect(normalizeSaveRevision(4.9)).toBe(4);
    expect(normalizeSaveRevision(-1)).toBe(0);
    expect(normalizeSaveRevision(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeSaveRevision('not-a-number')).toBe(0);
  });

  it('advances from an imported replacement when it is newer than local state', () => {
    expect(nextCampaignSaveRevision(3, 100)).toBe(101);
    expect(nextCampaignSaveRevision(100, 3)).toBe(101);
    expect(nextCampaignSaveRevision('8', undefined)).toBe(9);
  });
});
