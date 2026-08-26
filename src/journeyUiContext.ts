import { isAwaitingImmediateRemedy } from './rules/immediateRemedyEngine';

export type JourneyUiPhase =
  | 'idle'
  | 'route-ready'
  | 'manual-pending'
  | 'encounter-pending'
  | 'foraging-pending'
  | 'local-care'
  | 'destination-ready'
  | 'ending'
  | 'completed';

export type JourneyOutcomeSelection = 'success' | 'partial' | 'failure' | 'abandoned';

const JOURNEY_OUTCOMES: JourneyOutcomeSelection[] = ['success', 'partial', 'failure', 'abandoned'];

type JourneyStatus = 'setup' | 'active' | 'ending' | 'completed' | 'abandoned';

interface JourneyUiBarter {
  status?: string;
  awaitingImmediateRemedy?: boolean;
  immediateRemedyPatientId?: string;
  immediateRemedyAilmentIds?: string[];
}

export interface JourneyUiState {
  journeyActive?: boolean;
  journey?: {
    journeyId?: string;
    destinationId?: string;
    status?: JourneyStatus;
  } | null;
  pendingEnding?: { journeyId?: string } | null;
  currentMapLocationId?: string;
  currentLocationName?: string;
  journeyDestination?: string;
  pendingEncounter?: unknown;
  pendingBarter?: JourneyUiBarter | null;
  pendingForaging?: unknown;
  pendingManualEffect?: unknown;
  manualEffectQueue?: unknown[];
  pendingPatientArchive?: unknown;
  activeAilment?: unknown;
  activePatientId?: unknown;
  scroungingMode?: boolean;
  needsLocalHelpBeforeMove?: boolean;
  activeDelve?: unknown;
  pursuedByBehemoth?: unknown;
}

export interface JourneyUiContext {
  phase: JourneyUiPhase;
  active: boolean;
  atDestination: boolean;
  canMove: boolean;
  primaryActionId: string | null;
  focusTargetId: string;
  moveBlockedReason: string | null;
}

const samePrintedLocation = (left: unknown, right: unknown): boolean => {
  const normalize = (value: unknown) => String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const a = normalize(left);
  const b = normalize(right);
  return Boolean(a && b && a === b);
};

const context = (
  phase: JourneyUiPhase,
  active: boolean,
  atDestination: boolean,
  primaryActionId: string | null,
  focusTargetId: string,
  moveBlockedReason: string | null,
  canMove = false
): JourneyUiContext => ({
  phase,
  active,
  atDestination,
  canMove,
  primaryActionId,
  focusTargetId,
  moveBlockedReason
});

/**
 * Projects the existing canonical Journey state into one UI context. This is
 * deliberately not persisted: the Journey engine and its pending records stay
 * authoritative, while every UI consumer gets the same phase interpretation.
 */
export const getJourneyUiContext = (state: JourneyUiState): JourneyUiContext => {
  const status = state.journey?.status;
  const canonicalTerminal = status === 'completed' || status === 'abandoned';
  const canonicalActive = status === 'active' || status === 'ending';
  const active = status ? canonicalActive : Boolean(state.journeyActive);
  const currentId = String(state.currentMapLocationId || '').trim();
  const destinationId = String(state.journey?.destinationId || '').trim();
  const hasBothCanonicalIds = Boolean(currentId && destinationId);
  const atDestination = active && (hasBothCanonicalIds
    ? currentId === destinationId
    : samePrintedLocation(state.currentLocationName, state.journeyDestination));

  if (canonicalTerminal) {
    return context('completed', false, false, null, 'downtime-panel', null);
  }
  if (!active) {
    return context('idle', false, false, null, 'journey-start-panel', null);
  }

  if (state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0) {
    return context('manual-pending', true, atDestination, 'manual-effect', 'patient-clinic-panel', '보류한 직접 판정을 먼저 마무리하세요.');
  }
  if (state.pendingEncounter) {
    return context('encounter-pending', true, atDestination, 'pending-encounter', 'travel-panel', '현재 위치의 필수 조우를 먼저 해결하세요.');
  }
  if (state.pendingForaging) {
    return context('foraging-pending', true, atDestination, 'pending-foraging', 'patient-clinic-panel', '진행 중인 채집 절차를 먼저 마무리하세요.');
  }
  const blockingBarter = Boolean(state.pendingBarter && (
    !['completed', 'abandoned'].includes(state.pendingBarter.status || '')
    || isAwaitingImmediateRemedy(state.pendingBarter)
  ));
  if (blockingBarter) {
    return context('local-care', true, atDestination, 'active-patient', 'patient-clinic-panel', '진행 중인 거래와 현지 진료를 먼저 마무리하세요.');
  }
  if (state.pendingPatientArchive) {
    return context('local-care', true, atDestination, 'archive-patient', 'pending-archive-panel', '끝난 진료 기록을 먼저 마무리하세요.');
  }
  if (state.activeDelve) {
    return context('local-care', true, atDestination, 'active-delve', 'barrow-panel', '진행 중인 거수 고분 탐사를 먼저 마무리하세요.');
  }
  if (state.scroungingMode) {
    return context('local-care', true, atDestination, 'scrounging', 'patient-clinic-panel', 'Moving On으로 떠날 준비를 마무리하세요.');
  }
  if (state.activeAilment || state.activePatientId) {
    return context('local-care', true, atDestination, 'active-patient', 'treatment-workspace', '현재 환자의 진료를 먼저 마무리하세요.');
  }
  if (state.needsLocalHelpBeforeMove) {
    return context('local-care', true, atDestination, 'local-help', 'patient-clinic-panel', '현지 야수의 질환을 해결한 뒤 이동할 수 있습니다.');
  }
  const matchingEnding = status === 'ending'
    || Boolean(state.pendingEnding
      && (!state.journey?.journeyId || !state.pendingEnding.journeyId
        || state.pendingEnding.journeyId === state.journey.journeyId));
  if (matchingEnding) {
    return context('ending', true, atDestination, 'journey-end', 'journey-ending-panel', '먼저 여정 결말을 마무리하세요.');
  }
  if (atDestination) {
    return context('destination-ready', true, true, 'journey-end', 'journey-ending-panel', '목적지에 도착했습니다. 다음 이동 대신 여정 결말을 정하세요.');
  }
  if (state.pursuedByBehemoth) {
    return context('route-ready', true, false, 'behemoth-chase', 'route-planning-panel', null, true);
  }
  return context('route-ready', true, false, 'travel-next', 'route-planning-panel', null, true);
};

export const journeyPhaseTransitionFocusTarget = (
  previous: JourneyUiPhase,
  nextPhase: JourneyUiPhase,
  focusTargetId: string
): string | null => previous === nextPhase ? null : focusTargetId;

export const journeyOutcomePromptValue = (
  savedOutcome: JourneyOutcomeSelection | undefined,
  evaluationComplete: boolean
): string => {
  const savedIndex = savedOutcome ? JOURNEY_OUTCOMES.indexOf(savedOutcome) : -1;
  return String((savedIndex >= 0 ? savedIndex : evaluationComplete ? 0 : 1) + 1);
};

export const journeyGoalConfirmationDefault = (
  outcome: JourneyOutcomeSelection,
  savedDeclaration: boolean | undefined,
  evaluationComplete: boolean
): 'confirmed' | 'not-confirmed' => {
  if (savedDeclaration !== undefined) return savedDeclaration ? 'confirmed' : 'not-confirmed';
  return outcome === 'success' && evaluationComplete ? 'confirmed' : 'not-confirmed';
};
