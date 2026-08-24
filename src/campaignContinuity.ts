export type CampaignStage = 'journey' | 'manual-effect' | 'downtime-required' | 'season-ready' | 'journey-ready';

export interface CampaignContinuityState {
  journeyActive?: boolean;
  downtimeRequired?: boolean;
  downtimeCompleted?: boolean;
  pendingEncounter?: unknown;
  pendingForaging?: unknown;
  pendingManualEffect?: unknown;
  manualEffectQueue?: unknown[];
  pendingPatientArchive?: unknown;
  activeAilment?: unknown;
  scroungingMode?: boolean;
  needsLocalHelpBeforeMove?: boolean;
  currentLocationName?: string;
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

const pendingEncounterLabel = (pendingEncounter: unknown): '이동 조우' | '사회 조우' => {
  if (!pendingEncounter || typeof pendingEncounter !== 'object') return '이동 조우';
  const encounter = 'encounter' in pendingEncounter
    && pendingEncounter.encounter
    && typeof pendingEncounter.encounter === 'object'
    ? pendingEncounter.encounter
    : pendingEncounter;
  return 'encounterType' in encounter && encounter.encounterType === 'social'
    ? '사회 조우'
    : '이동 조우';
};

export const getCampaignContinuity = (state: CampaignContinuityState): CampaignContinuity => {
  const hasManualEffect = Boolean(state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0);
  if (hasManualEffect && !state.journeyActive) {
    return {
      stage: 'manual-effect',
      label: '보류 판정 대기',
      nextAction: '보류한 직접 판정을 먼저 마무리하세요.',
      continueLabel: '보류 판정 이어가기',
      guidance: '판정 결과를 기록한 뒤 휴식기나 다음 여정을 이어갈 수 있습니다.'
    };
  }

  if (state.journeyActive) {
    const elapsed = Math.max(0, state.calendarDays || 0);
    const limit = Math.max(0, state.calendarMaxDays || 0);
    const remaining = Math.max(0, limit - elapsed);
    const encounterLabel = pendingEncounterLabel(state.pendingEncounter);
    const nextAction = hasManualEffect
      ? '보류한 직접 판정을 먼저 마무리하세요.'
      : state.pendingEncounter
      ? `열어 둔 ${encounterLabel}를 먼저 해결하세요.`
      : state.pendingForaging
        ? '열어 둔 채집 조우를 먼저 해결하세요.'
        : state.pendingPatientArchive
          ? '끝난 진료를 환자 기록장에 마무리하세요.'
          : state.pursuedByBehemoth
            ? '진행 중인 거수의 추격을 이어가세요.'
            : state.activeDelve
              ? '진행 중인 거수 고분 탐사를 이어가세요.'
              : state.activeAilment
                ? '현재 환자의 치료를 이어가세요.'
                : state.scroungingMode
                  ? '남은 치료 시간으로 여분 채집을 하거나 마감하세요.'
                  : state.needsLocalHelpBeforeMove
                    ? '현지 야수의 질환을 해결해야 다시 이동할 수 있습니다.'
                    : '현재 위치에서 다음 Move를 해결하세요.';
    const continueLabel = hasManualEffect
      ? '보류 판정 이어가기'
      : state.pendingEncounter
      ? `${encounterLabel} 이어가기`
      : state.pendingForaging
        ? '채집 조우 이어가기'
        : state.pendingPatientArchive
          ? '진료 기록 마무리'
          : state.pursuedByBehemoth
            ? '거수 추격 이어가기'
            : state.activeDelve
              ? '고분 탐사 이어가기'
              : state.activeAilment
                ? '환자 치료 이어가기'
                : state.scroungingMode
                  ? '여분 채집 이어가기'
                  : state.needsLocalHelpBeforeMove
                    ? '현지 진료 이어가기'
                    : '다음 Move 이어가기';
    return {
      stage: 'journey',
      label: '여정 진행 중',
      nextAction,
      continueLabel,
      guidance: `${state.journeyDestination || '목적지'}까지 이동 중 · ${elapsed}/${limit}일 경과 · ${remaining}일 남음`
    };
  }

  if (state.downtimeRequired && !state.downtimeCompleted) {
    return {
      stage: 'downtime-required',
      label: '휴식기 활동 필요',
      nextAction: '지난 여정이 끝났습니다. 휴식기 활동 하나를 선택하세요.',
      continueLabel: '휴식기 활동 고르기',
      guidance: '활동의 혜택을 적용하면 이번 계절을 정산할 수 있습니다.'
    };
  }

  if (state.downtimeCompleted) {
    return {
      stage: 'season-ready',
      label: '계절 정산 준비 완료',
      nextAction: '휴식기 혜택이 저장되었습니다. 다음 계절로 넘어가세요.',
      continueLabel: '계절 정산하기',
      guidance: '약제소 수입·기부 명성·건설·동반자 계절 효과가 함께 반영됩니다.'
    };
  }

  return {
    stage: 'journey-ready',
    label: '새 여정 준비',
    nextAction: '현재 위치에서 다음 계절의 여정을 시작하세요.',
    continueLabel: '새 여정 준비하기',
    guidance: `${state.currentLocationName || '현재 위치'}에서 목적지·이유·목표·기한을 정합니다.`
  };
};

export const getCampaignResumeActionIds = (state: CampaignContinuityState, hasCurrentBarrow = false): string[] => {
  if (!state.journeyActive) {
    if (state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0) return ['manual-effect'];
    if (state.downtimeRequired && !state.downtimeCompleted) return ['downtime-activities', 'downtime-shop'];
    if (state.downtimeCompleted) return ['season-advance', 'downtime-shop'];
    return ['start-journey', 'downtime-shop'];
  }

  const ids: string[] = [];
  if (state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0) ids.push('manual-effect');
  if (state.pendingEncounter) ids.push('pending-encounter');
  if (state.pendingForaging) ids.push('pending-foraging');
  if (state.pendingPatientArchive) ids.push('archive-patient');
  if (state.pursuedByBehemoth) ids.push('behemoth-chase');
  else if (state.activeDelve) ids.push('active-delve');
  else if (hasCurrentBarrow) ids.push('barrow-here');
  if (state.scroungingMode) ids.push('scrounging');
  if (state.needsLocalHelpBeforeMove && !state.activeAilment && !state.scroungingMode) ids.push('local-help');
  if (state.activeAilment) ids.push('active-patient', 'barter-reagent', 'clinic-open');
  if (!state.needsLocalHelpBeforeMove && !state.pursuedByBehemoth) ids.push('travel-next');
  if (!state.activeAilment) ids.push('clinic-open');
  return ids;
};

interface CalendarState {
  calendarDays?: number;
  calendarMaxDays?: number;
  cumulativeDays?: number;
  calendarHistory?: string[];
}

export const applyManualCalendarAdjustment = <T extends CalendarState>(state: T, requestedDay: number): T => {
  const maximum = Math.max(0, Math.floor(state.calendarMaxDays || 0));
  const previous = Math.max(0, Math.floor(state.calendarDays || 0));
  const next = Math.max(0, Math.min(maximum, Math.floor(requestedDay)));
  const delta = next - previous;
  if (delta === 0) return state;
  const direction = delta > 0 ? `+${delta}` : String(delta);
  return {
    ...state,
    calendarDays: next,
    cumulativeDays: Math.max(0, Math.floor(state.cumulativeDays || 0) + delta),
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
