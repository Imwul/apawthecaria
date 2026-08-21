import { describe, expect, it } from 'vitest';
import { routeReadinessText } from './routeComposerPresentation';

const readiness = (patch: Partial<Parameters<typeof routeReadinessText>[0]> = {}) => routeReadinessText({
  movementMode: 'move',
  travelReady: false,
  hasDestination: true,
  canTravel: true,
  travelBlockedReason: null,
  reason: 'incomplete',
  speed: 4,
  cost: 0,
  ...patch
});

describe('route composer readiness copy', () => {
  it('states the remaining route work instead of only repeating the fraction', () => {
    expect(readiness({ hasDestination: false, canTravel: false, travelBlockedReason: '조우 해결 필요' }))
      .toBe('다음 위치 필요');
    expect(readiness({ reason: 'too-close', cost: 2 })).toBe('2경로 더 필요');
    expect(readiness({ reason: 'too-far', cost: 6 })).toBe('2경로 줄이기');
  });

  it('surfaces a loch stop restriction at the top of the editor', () => {
    expect(readiness({ reason: 'loch-locked', cost: 4 })).toBe('호수·강 정차 불가');
  });

  it('keeps external blockers and completed routes distinct', () => {
    expect(readiness({ reason: 'legal', cost: 4, canTravel: false, travelBlockedReason: '조우 해결 필요' }))
      .toBe('이동 전 확인 필요');
    expect(readiness({ reason: 'legal', cost: 4, travelReady: true })).toBe('Move 준비 완료');
  });
});
