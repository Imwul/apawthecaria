import { describe, expect, it } from 'vitest';
import { getCurrentPlayLoopStage } from './playLoop';
import type { CampaignContinuityState } from './campaignContinuity';

const active: CampaignContinuityState = { bio: { name: '솔' }, journeyActive: true };

describe('current rulebook play loop stage', () => {
  it.each([
    [{}, 'move'],
    [{ pendingEncounter: {} }, 'encounter'],
    [{ activeAilment: { timer: 6 } }, 'care'],
    [{ pendingForaging: { phase: 'encounter' } }, 'care'],
    [{ pendingBarter: { status: 'awaiting-social' } }, 'care'],
    [{ pendingPatientArchive: {} }, 'care'],
    [{ scroungingMode: true }, 'leave'],
    [{ pendingManualEffect: {}, pendingEncounter: {} }, 'encounter'],
    [{ pendingManualEffect: {}, pendingForaging: {} }, 'care']
  ] as Array<[Partial<CampaignContinuityState>, string]>)('projects the authoritative pending procedure %o', (pending, expected) => {
    const state = { ...active, ...pending };
    const original = structuredClone(state);
    expect(getCurrentPlayLoopStage(state)).toBe(expected);
    expect(state).toEqual(original);
  });

  it.each([
    { bio: { name: '' } },
    { bio: { name: '솔' }, journeyActive: false },
    { ...active, pendingManualEffect: {} },
    { ...active, activeDelve: {} },
    { ...active, journey: { status: 'ending' as const } },
    { ...active, journey: { status: 'completed' as const } },
    { bio: { name: '솔' }, downtimeRequired: true }
  ])('does not claim a loop step for a separate or unknown procedure %o', state => {
    expect(getCurrentPlayLoopStage(state)).toBeNull();
  });
});
