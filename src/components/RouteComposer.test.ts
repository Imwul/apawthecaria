import { describe, expect, it } from 'vitest';
import { routeExecutionPreview, routeReadinessText } from './routeComposerPresentation';

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
    expect(readiness({ reason: 'legal', cost: 4, travelReady: true })).toBe('이동 준비 완료');
  });
});

describe('route execution preview', () => {
  it('shows arrival, calendar cost, arrival encounter type, and discarded wet Parts before Move', () => {
    expect(routeExecutionPreview({ destinationName: 'Obridge', destinationKind: 'Settlement', movementMode: 'move', days: 1, soakedItemNames: ['Moon Sap'] }))
      .toBe('Obridge에 도착 · 달력 1일 소비 · 사교 조우 카드 1장 · 젖어서 버릴 물품: Moon Sap');
    expect(routeExecutionPreview({ destinationName: '숲', destinationKind: 'Wilds', movementMode: 'move', days: 1, soakedItemNames: [] }))
      .toContain('도착 지역의 여행 조우 카드 1장');
    expect(routeExecutionPreview({ destinationName: '도시', destinationKind: 'City', movementMode: 'soar', days: 3, soakedItemNames: [] }))
      .toBe('도시에 도착 · 달력 3일 소비 · 활공 조우 카드 1장');
  });
});
