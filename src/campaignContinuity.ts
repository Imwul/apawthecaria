import { readCalendarClocks } from './calendarTime';
import { getJourneyUiContext } from './journeyUiContext';
import { getCampaignNextAction } from './campaignNextAction';
import { getPatientTimerProjection } from './patientTimerProjection';
export { getCampaignNextAction, type CampaignNextAction } from './campaignNextAction';

export type CampaignStage = 'journey' | 'manual-effect' | 'downtime-required' | 'season-ready' | 'journey-ready';

export interface CampaignContinuityState {
  bio?: { name?: string };
  patients?: import('./patientTimerProjection').PatientTimerProjectionState['patients'];
  scroungingTimer?: number;
  pendingTreatmentReward?: unknown;
  journeyActive?: boolean;
  journey?: {
    journeyId?: string;
    destinationId?: string;
    status?: 'setup' | 'active' | 'ending' | 'completed' | 'abandoned';
  } | null;
  pendingEnding?: {
    journeyId?: string;
    selectedOutcome?: 'success' | 'partial' | 'failure' | 'abandoned';
  } | null;
  downtimeRequired?: boolean;
  downtimeCompleted?: boolean;
  pendingEncounter?: unknown;
  pendingForaging?: unknown;
  pendingBarter?: {
    status?: string;
    paymentRequired?: number;
    awaitingImmediateRemedy?: boolean;
    immediateRemedyPatientId?: string;
    immediateRemedyAilmentIds?: string[];
  } | null;
  pendingManualEffect?: unknown;
  manualEffectQueue?: unknown[];
  pendingPatientArchive?: unknown;
  activeAilment?: unknown;
  activePatientId?: unknown;
  scroungingMode?: boolean;
  needsLocalHelpBeforeMove?: boolean;
  currentLocationName?: string;
  currentMapLocationId?: string;
  journeyDestination?: string;
  calendarDays?: number;
  calendarMaxDays?: number;
  pursuedByBehemoth?: unknown;
  activeDelve?: unknown;
}

export interface CampaignContinuity {
  stage: CampaignStage;
  label: string;
  nextAction: string;
  continueLabel: string;
  guidance: string;
}


const journeyOutcomeLabel = (outcome: 'success' | 'partial' | 'failure' | 'abandoned' | undefined): string => outcome === 'success'
  ? '성공'
  : outcome === 'partial'
    ? '부분 성공'
    : outcome === 'failure'
      ? '실패'
      : outcome === 'abandoned'
        ? '포기'
        : '';

export const getCampaignContinuity = (state: CampaignContinuityState): CampaignContinuity => {
  const next = getCampaignNextAction(state);
  const journeyContext = getJourneyUiContext(state);
  const hasManualEffect = Boolean(state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0);
  if (hasManualEffect && !journeyContext.active) {
    return {
      stage: 'manual-effect',
      label: '보류 판정 대기',
      nextAction: next.title,
      continueLabel: next.label,
      guidance: '판정 결과를 기록한 뒤 휴식기나 다음 여정을 이어갈 수 있습니다.'
    };
  }

  if (journeyContext.active) {
    const elapsed = Math.max(0, state.calendarDays || 0);
    const limit = Math.max(0, state.calendarMaxDays || 0);
    const remaining = Math.max(0, limit - elapsed);
    const endingLabel = journeyOutcomeLabel(state.pendingEnding?.selectedOutcome);
    const guidance = journeyContext.phase === 'ending'
      ? `${state.journeyDestination || '목적지'} 도착 · ${endingLabel ? `${endingLabel} 선택 저장됨 · ` : ''}${elapsed}/${limit}일 경과`
      : journeyContext.phase === 'destination-ready'
        ? `${state.journeyDestination || '목적지'} 도착 · 최종 Move 완료 · ${remaining}일 남음`
        : journeyContext.atDestination
          ? `${state.journeyDestination || '목적지'} 도착 · 마지막 Move의 현지 절차 진행 중 · ${remaining}일 남음`
          : `${state.journeyDestination || '목적지'}까지 이동 중 · ${elapsed}/${limit}일 경과 · ${remaining}일 남음`;
    return {
      stage: 'journey',
      label: '여정 진행 중',
      nextAction: next.title,
      continueLabel: next.label,
      guidance
    };
  }

  if (state.downtimeRequired && !state.downtimeCompleted) {
    return {
      stage: 'downtime-required',
      label: '휴식기 활동 필요',
      nextAction: next.title,
      continueLabel: next.label,
      guidance: '활동의 혜택을 적용하면 이번 계절을 정산할 수 있습니다.'
    };
  }

  if (state.downtimeCompleted) {
    return {
      stage: 'season-ready',
      label: '계절 정산 준비 완료',
      nextAction: next.title,
      continueLabel: next.label,
      guidance: '약제소 수입·기부 명성·건설·동반자 계절 효과가 함께 반영됩니다.'
    };
  }

  return {
    stage: 'journey-ready',
    label: '새 여정 준비',
    nextAction: next.title,
    continueLabel: next.label,
    guidance: `${state.currentLocationName || '현재 위치'}에서 목적지·이유·목표·기한을 정합니다.`
  };
};

export const getCampaignResumeActionIds = (state: CampaignContinuityState, hasCurrentBarrow = false): string[] => {
  const next = getCampaignNextAction(state);
  // Ongoing Barter has no hub action: focus its persisted acquisition panel.
  if (next.kind === 'barter' || next.kind === 'character') return [];
  const journeyContext = getJourneyUiContext(state);
  if (!journeyContext.active) {
    if (state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0) return ['manual-effect'];
    if (state.downtimeRequired && !state.downtimeCompleted) return ['downtime-activities', 'downtime-shop'];
    if (state.downtimeCompleted) return ['season-advance', 'downtime-shop'];
    return ['start-journey', 'downtime-shop'];
  }

  const ids: string[] = next.actionId ? [next.actionId] : [];
  if (journeyContext.primaryActionId === 'journey-end') ids.push('journey-end');
  if (state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0) ids.push('manual-effect');
  if (state.pendingEncounter) ids.push('pending-encounter');
  if (state.pendingForaging) ids.push('pending-foraging');
  if (state.pendingPatientArchive) ids.push('archive-patient');
  if (state.pursuedByBehemoth) ids.push('behemoth-chase');
  else if (state.activeDelve) ids.push('active-delve');
  else if (hasCurrentBarrow) ids.push('barrow-here');
  if (state.scroungingMode) ids.push('scrounging');
  if (state.needsLocalHelpBeforeMove && !state.activeAilment && !state.scroungingMode) ids.push('local-help');
  if (getPatientTimerProjection(state).hasActiveAilment) ids.push('active-patient', 'barter-reagent', 'clinic-open');
  if (journeyContext.canMove && !state.pursuedByBehemoth) ids.push('travel-next');
  if (!state.activeAilment) ids.push('clinic-open');
  return [...new Set(ids)];
};

interface CalendarState {
  calendarDays?: number;
  calendarMaxDays?: number;
  cumulativeDays?: number;
  calendarHistory?: string[];
}

export const applyManualCalendarAdjustment = <T extends CalendarState>(state: T, requestedDay: number): T => {
  const maximum = Math.max(0, Math.floor(state.calendarMaxDays || 0));
  const clocks = readCalendarClocks(state);
  const previous = clocks.calendarDays;
  const next = Math.max(0, Math.min(maximum, Math.floor(requestedDay)));
  const delta = next - previous;
  if (delta === 0) return {
    ...state,
    calendarDays: clocks.calendarDays,
    cumulativeDays: clocks.cumulativeDays
  };
  const direction = delta > 0 ? `+${delta}` : String(delta);
  return {
    ...state,
    calendarDays: next,
    cumulativeDays: Math.max(0, clocks.cumulativeDays + delta),
    calendarHistory: [
      ...(state.calendarHistory || []),
      `${next}일째: 앱 밖 판정 반영을 위해 달력을 직접 조정했습니다. (경과일 ${direction})`
    ]
  };
};

interface LegacySeasonState {
  completedSeasons?: unknown;
  journals?: Array<{ id?: string; title?: string }>;
}

const isRecordedSeasonBoundary = (entry: { id?: string; title?: string }) => {
  const id = entry.id || '';
  const title = entry.title || '';
  return id.startsWith('season_settle_')
    || /^season:.+:journal$/.test(id)
    || /계절 (?:전환|정산 결과)/.test(title)
    || /^(Spring|Summer|Autumn|Winter) to (Spring|Summer|Autumn|Winter)$/.test(title);
};

export const inferCompletedSeasons = (state: LegacySeasonState): number => {
  const explicit = typeof state.completedSeasons === 'number'
    ? state.completedSeasons
    : typeof state.completedSeasons === 'string' && /^\d+$/.test(state.completedSeasons.trim())
      ? Number(state.completedSeasons)
      : null;
  if (Number.isSafeInteger(explicit)) {
    return Math.max(0, explicit as number);
  }
  const recorded = (state.journals || []).filter(isRecordedSeasonBoundary);
  return new Set(recorded.map((entry, index) => entry.id || `${index}:${entry.title}`)).size;
};
