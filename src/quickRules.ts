import { getCampaignNextAction, type CampaignContinuityState } from './campaignContinuity';
import { getPatientTimerProjection } from './patientTimerProjection';
import { getJourneyUiContext } from './journeyUiContext';
import type { RulebookReferenceRequest } from './rulebook/types';

export type QuickRuleId = 'move' | 'diagnosis' | 'research' | 'foraging' | 'bartering' | 'leave' | 'ending';

export interface QuickRule {
  id: QuickRuleId;
  label: string;
  page: number;
  entryId: string;
  summary: string;
}

/** Recurring rules, independently extracted from the play procedures. */
export const QUICK_RULES: readonly QuickRule[] = [
  { id: 'move', label: '이동', page: 24, entryId: 'procedure:move',
    summary: '속도만큼 경로를 이동 → 도착 조우 → 달력 1일. 현지 진료를 마친 뒤 다시 이동합니다.' },
  { id: 'diagnosis', label: '환자 진단', page: 29, entryId: 'procedure:diagnosis',
    summary: '환자 → 중증도 → 질환·요구 약효·기한. 여러 질환의 기한은 각각 기록하고, 반복 복용은 회분별 조건을 확인합니다.' },
  { id: 'research', label: '재료 조사', page: 30, entryId: 'procedure:treatment',
    summary: '현재·인접 지역의 부위와 도구를 대조합니다. 일반 약효는 최댓값이며 합산하지 않습니다. FAIR·FOUL과 촉매는 별도 규칙입니다.' },
  { id: 'foraging', label: '채집', page: 33, entryId: 'procedure:foraging',
    summary: '재료 획득 → 채집 조우 → 치료 가능 확인. 가능하면 기한 감소 전에 치료합니다. 불가능하면 현재 1시간·인접 2시간, 추가 부위마다 +1시간.' },
  { id: 'bartering', label: '교환', page: 35, entryId: 'procedure:bartering',
    summary: '사회 조우 → 두 번째 카드 → 거래 결과. 치료할 수 있으면 기한 감소 전에 치료하고, 그렇지 않으면 1시간을 줄입니다.' },
  { id: 'leave', label: '떠날 준비', page: 36, entryId: 'procedure:leave',
    summary: '보상·실패 결과를 정산하고 채집 포인트를 0으로 만듭니다. 남은 시간의 여분 채집은 선택이며 바로 떠나도 됩니다.' },
  { id: 'ending', label: '여정 결말', page: 38, entryId: 'procedure:journey-close',
    summary: '목적지의 마지막 조우·진료를 마친 뒤 목표 달성 여부와 결말을 정하고 휴식기로 넘어갑니다.' }
];

export interface QuickRulesPresentation {
  relevantIds: QuickRuleId[];
  context: string;
  urgent: boolean;
}

/** Recommends references without changing, advancing or repairing game state. */
export const getQuickRulesPresentation = (state: CampaignContinuityState): QuickRulesPresentation => {
  const next = getCampaignNextAction(state);
  const timers = getPatientTimerProjection(state);
  const journey = getJourneyUiContext(state);
  const hours = timers.shortestHours === null ? '' : `가장 짧은 치료 기한 ${timers.shortestHours}시간. `;
  if (next.kind === 'foraging-remedy' || next.kind === 'barter-remedy') return {
    relevantIds: [next.kind === 'foraging-remedy' ? 'foraging' : 'bartering', 'research', 'leave'],
    context: '재료가 모였습니다. 조우를 마친 지금, 치료 기한을 줄이기 전에 치료제를 만드세요.',
    urgent: true
  };
  if (next.kind === 'foraging') return {
    relevantIds: ['foraging', 'research', 'leave'],
    context: `${hours}이번 채집의 재료·조우를 마치고 치료 가능 여부를 먼저 확인합니다.`, urgent: true
  };
  if (next.kind === 'barter') return {
    relevantIds: ['bartering', 'research', 'leave'],
    context: `${hours}교환 중입니다. 사회 조우와 두 번째 카드는 서로 다른 판정입니다.`, urgent: true
  };
  if (next.kind === 'delve' || state.activeDelve) return {
    relevantIds: ['research', 'foraging', 'move'],
    context: '고분 도전은 현지 환자 진료를 대신합니다. 도전별 기한과 결과를 따르고 일반 진료 보상을 중복 적용하지 않습니다.', urgent: true
  };
  if (['archive', 'scrounging', 'treatment-reward'].includes(next.kind)) return {
    relevantIds: ['leave', 'foraging', 'move'],
    context: state.scroungingMode
      ? `여분 채집 ${timers.scroungingHours ?? 0}시간. 더 모으지 않고 바로 떠나도 됩니다.`
      : '진료 결과와 보상을 확인합니다. 개인 메모는 비워 두어도 됩니다.', urgent: false
  };
  if (next.kind === 'journey-end') return {
    relevantIds: ['ending', 'leave', 'move'],
    context: '마지막 위치의 의무를 마쳤습니다. 실제 여정 기록을 돌아보고 결말을 정하세요.', urgent: false
  };
  if (timers.hasActiveAilment) return {
    relevantIds: ['research', 'foraging', 'bartering'],
    context: `${hours}일반 약효는 같은 태그의 최댓값입니다. 여러 질환의 기한은 각각 추적하며 일반 시간 비용은 동시에 적용합니다.`, urgent: timers.shortestHours === 0
  };
  if (next.kind === 'local-help') return {
    relevantIds: ['diagnosis', 'research', 'foraging'],
    context: '먼저 현지 환자의 중증도·질환·기한을 확인한 뒤 필요한 부위를 조사합니다.', urgent: false
  };
  return {
    relevantIds: ['move', 'diagnosis', 'research'],
    context: next.kind === 'encounter'
      ? '도착 조우를 먼저 마칩니다. 이동은 여정 달력의 일, 진료 중 채집·교환은 환자 기한의 시간을 사용합니다.'
      : journey.active
        ? '여정 달력은 일, 환자 치료 기한은 시간입니다. 이동과 진료의 두 시계를 구분하세요.'
        : '여정을 정한 뒤 이동 → 조우 → 현지 진료를 반복합니다. 여정은 일, 환자 치료 기한은 시간으로 기록합니다.',
    urgent: false
  };
};

export const quickRuleRequest = (rule: QuickRule, context: string): RulebookReferenceRequest => ({
  entryId: rule.entryId, page: rule.page, title: `${rule.label} · p.${rule.page}`,
  context: [{ label: '현재 절차', value: context }]
});
