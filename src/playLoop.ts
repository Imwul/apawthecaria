import { getCampaignNextAction } from './campaignNextAction';
import type { CampaignContinuityState } from './campaignContinuity';

export type PlayLoopStage = 'move' | 'encounter' | 'care' | 'leave';

export const PLAY_LOOP_STAGES: ReadonlyArray<{ id: PlayLoopStage; label: string; detail: string }> = [
  { id: 'move', label: '이동', detail: '경로와 이동 카드' },
  { id: 'encounter', label: '조우', detail: '장면과 선택' },
  { id: 'care', label: '진료', detail: '진단·채집·조제' },
  { id: 'leave', label: '출발', detail: '시간을 정산하고 다음 이동' }
];

/** Shows only the current procedure; an earlier position does not prove completion. */
export const getCurrentPlayLoopStage = (state: CampaignContinuityState): PlayLoopStage | null => {
  const next = getCampaignNextAction(state);
  if (next.kind === 'move' || next.kind === 'chase') return 'move';
  if (next.kind === 'encounter') return 'encounter';
  if (next.kind === 'scrounging') return 'leave';
  if (['patient', 'patient-expired', 'local-help', 'foraging', 'foraging-remedy',
    'barter', 'barter-remedy', 'treatment-reward', 'archive'].includes(next.kind)) return 'care';
  if (next.kind === 'manual') {
    if (state.pendingEncounter) return 'encounter';
    if (state.pendingForaging || state.pendingBarter) return 'care';
  }
  // Character setup, journey setup/ending, downtime and Barrow challenges have
  // their own procedures; keep them visible without claiming a loop step.
  return null;
};
