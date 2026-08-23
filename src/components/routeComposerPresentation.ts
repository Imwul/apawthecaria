import type { RouteComposerReason } from '../map/routeComposer';

export const routeReadinessText = ({
  movementMode,
  travelReady,
  hasDestination,
  canTravel,
  travelBlockedReason,
  reason,
  speed,
  cost
}: {
  movementMode: 'move' | 'soar';
  travelReady: boolean;
  hasDestination: boolean;
  canTravel: boolean;
  travelBlockedReason?: string | null;
  reason: RouteComposerReason;
  speed: number;
  cost: number;
}): string => {
  if (movementMode === 'soar') {
    if (travelReady) return '활공 준비 완료';
    return hasDestination ? '이동 전 확인 필요' : '착륙 위치 필요';
  }
  if (travelReady) return '이동 준비 완료';
  if (!hasDestination) return '다음 위치 필요';
  if (travelBlockedReason || !canTravel) return '이동 전 확인 필요';
  if (reason === 'loch-locked') return '호수·강 정차 불가';
  if (reason === 'too-close') return `${Math.max(1, speed - cost)}경로 더 필요`;
  if (reason === 'too-far') return `${Math.max(1, cost - speed)}경로 줄이기`;
  return `경로 ${cost}/${speed}`;
};
