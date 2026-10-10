import type { CampaignContinuityState } from './campaignContinuity';
import { getJourneyUiContext } from './journeyUiContext';
import { localizeLocationName } from './localization/gameplayKo';
import { getPatientTimerProjection } from './patientTimerProjection';
import type { RulebookReferenceRequest } from './rulebook/types';
import { isAwaitingImmediateRemedy } from './rules/immediateRemedyEngine';
import { ENCOUNTERS } from './rules/data/encounters';
import type { JournalTab } from './sessionNavigation';

export interface CampaignNextAction {
  kind: string;
  title: string;
  reason: string;
  label: string;
  tab: JournalTab;
  targetId?: string;
  actionId?: string;
  urgent?: boolean;
  reference: RulebookReferenceRequest;
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object'
  ? value as Record<string, unknown> : {};
const action = (kind: string, title: string, reason: string, label: string, targetId: string,
  actionId: string | undefined, entryId: string, page: number, urgent = false): CampaignNextAction => ({
  kind, title, reason, label, tab: 'play', targetId, actionId, urgent, reference: { entryId, page, title }
});

/** Read-only UI recommendation shared by the scene, help and contextual source. */
export const getCampaignNextAction = (state: CampaignContinuityState): CampaignNextAction => {
  if (state.bio && !state.bio.name?.trim()) return {
    kind: 'character', title: '나의 약제사를 소개하세요',
    reason: '이름과 동물, 이동 방식, 길동무를 정하면 첫 여정을 시작할 수 있습니다.',
    label: '약제사 만들기', tab: 'bio', reference: { entryId: 'procedure:character-setup', page: 10, title: '첫 약제사 만들기' }
  };
  if (state.pendingManualEffect || (state.manualEffectQueue?.length || 0) > 0) {
    const draft = record(state.pendingManualEffect || state.manualEffectQueue?.[0]);
    const next = action('manual', '남겨 둔 판정을 마무리하세요', '선택이나 이야기로 정해야 하는 결과가 남았습니다. 판정 창에서 필요한 선택과 적용할 변화를 확인합니다.',
      '판정 이어가기', 'patient-clinic-panel', 'manual-effect', 'chapter:patients', 28, true);
    if (typeof draft.sourcePage === 'number') next.reference.page = draft.sourcePage;
    if (typeof draft.registryEffectId === 'string' && draft.registryEffectId) {
      next.reference.entryId = `printed-effect:${draft.registryEffectId}`;
    } else if (typeof draft.ownerId === 'string' && ['encounter', 'ailment', 'service'].includes(String(draft.ownerType))) {
      next.reference.entryId = `${draft.ownerType}:${draft.ownerId}`;
    } else if (typeof draft.sourcePage === 'number') {
      delete next.reference.entryId;
    }
    return next;
  }

  const journey = getJourneyUiContext(state);
  if (!journey.active) {
    if (state.downtimeRequired && !state.downtimeCompleted) return action(
      'downtime', '이번 휴식기 활동을 골라보세요', '마친 여정 뒤 활동 하나를 선택하고 혜택을 받습니다. 적용을 마치면 계절을 정산할 수 있습니다.',
      '휴식기 활동 보기', 'downtime-activity-choice', 'downtime-activities', 'procedure:downtime', 40);
    if (state.downtimeCompleted) return action(
      'season', '다음 계절을 맞을 준비가 됐어요', '약제소 수입·기부 명성·건설·동반자 계절 효과를 함께 반영합니다.',
      '계절 정산하기', 'downtime-panel', 'season-advance', 'procedure:downtime', 43);
    return action('journey-start', '어디로 떠나볼까요', '목적지, 떠나는 이유, 여정 목표와 기한을 정합니다. 출발 후에는 이동과 현지 진료를 번갈아 진행합니다.',
      '여정 준비하기', 'journey-start-panel', 'start-journey', 'procedure:journey-start', 18);
  }

  if (state.pendingEncounter) {
    const encounter = record(record(state.pendingEncounter).encounter);
    const social = encounter.encounterType === 'social';
    const next = action('encounter', `열어 둔 ${social ? '사회' : '이동'} 조우를 이어가세요`,
      '카드는 이미 뽑았습니다. 장면을 읽고 필요한 선택·추가 카드·짧은 기록을 마친 뒤 결과를 적용합니다.',
      '조우 이어가기', 'travel-panel', 'pending-encounter', social ? 'chapter:social-encounters' : 'chapter:travel-encounters',
      typeof encounter.sourcePage === 'number' ? encounter.sourcePage : social ? 188 : 74, true);
    const encounterId = record(state.pendingEncounter).encounterId || encounter.id;
    if (typeof encounterId === 'string' && encounterId) next.reference.entryId = `encounter:${encounterId}`;
    return next;
  }
  if (state.pendingTreatmentReward) return action('treatment-reward', '치료 보상을 정하세요',
    '치료 결과의 보상 선택이 남았습니다. 장신구·명성의 변화를 확인하고 확정한 뒤 진료 기록을 마감합니다.',
    '치료 보상 고르기', 'treatment-workspace', 'active-patient', 'procedure:leave', 36, true);
  if (state.pendingForaging) {
    if (isAwaitingImmediateRemedy(state.pendingForaging)) return action('foraging-remedy', '재료가 모였어요. 지금 치료하세요',
      '채집 조우를 마쳤고 치료제 재료가 모두 모였습니다. 이번 채집의 치료 기한을 줄이기 전에 조제합니다.',
      '조제대로 가기', 'treatment-workspace', 'pending-foraging', 'procedure:foraging', 33, true);
    const pending = record(state.pendingForaging);
    const choosing = pending.phase === 'choose-reagent';
    const next = action('foraging', choosing ? '이번 카드로 찾을 영약재를 고르세요' : '채집 결과를 끝까지 확인하세요',
      choosing ? '영약재 하나를 선택한 뒤 필요한 부위와 수량을 정합니다. 확보한 부위가 늘면 소요 시간도 늘어납니다.'
        : '영약재 획득, 채집 조우, 치료 기한의 순서로 마무리합니다. 조우의 추가 시간 변화도 함께 확인하세요.',
      '채집 이어가기', 'patient-clinic-panel', 'pending-foraging', 'procedure:foraging', 32, true);
    if (pending.phase === 'encounter' && typeof pending.encounterId === 'string') {
      const encounter = ENCOUNTERS.find(row => row.id === pending.encounterId);
      if (encounter) next.reference = { entryId: `encounter:${encounter.id}`, page: encounter.sourcePage, title: '현재 채집 조우' };
    } else if (pending.phase === 'timer') {
      next.reference.page = 33;
    }
    return next;
  }
  if (isAwaitingImmediateRemedy(state.pendingBarter)) return action('barter-remedy', '거래한 재료로 지금 치료하세요',
    '필요한 재료가 모두 모였습니다. 이번 거래의 치료 기한을 줄이기 전에 치료제를 만듭니다.',
    '조제대로 가기', 'treatment-workspace', 'barter-immediate-remedy', 'procedure:bartering', 35, true);
  if (state.pendingBarter && !['completed', 'abandoned'].includes(state.pendingBarter.status || '')) {
    const status = state.pendingBarter.status;
    const reason = status === 'awaiting-social' || status === 'manual-social' ? '먼저 사회 조우의 선택과 결과를 마무리합니다.'
      : status === 'awaiting-second-card' ? '사회 조우를 마쳤습니다. 둘째 카드를 뽑아 거래 결과를 확인합니다.'
        : status === 'awaiting-payment' ? `필요한 대가 ${state.pendingBarter.paymentRequired || 0}를 확인하고 장신구·명성 또는 허용된 물품으로 지불합니다.`
          : status === 'failed-awaiting-timer' ? '거래 결과를 확인하고 보류된 치료 기한 감소를 마무리합니다.'
            : '시작해 둔 거래의 다음 단계를 마무리합니다.';
    const next = action('barter', '진행 중인 거래를 마무리하세요', reason, '거래 이어가기', 'patient-acquisition-panel', undefined, 'procedure:bartering',
      status === 'awaiting-social' || status === 'manual-social' ? 34 : 35, true);
    const social = record(record(state.pendingBarter).socialEncounter);
    if ((status === 'awaiting-social' || status === 'manual-social') && typeof social.id === 'string') {
      next.reference = { entryId: `encounter:${social.id}`, page: typeof social.sourcePage === 'number' ? social.sourcePage : 188, title: '현재 거래의 사회 조우' };
    }
    return next;
  }
  const timer = getPatientTimerProjection(state);
  // Do not revive a cured canonical patient from an out-of-date legacy mirror.
  let primary = journey.primaryActionId;
  if (timer.hasActiveAilment && ['travel-next', 'journey-end', 'local-help'].includes(primary || '')) {
    primary = 'active-patient';
  } else if (primary === 'active-patient' && !timer.hasActiveAilment) {
    primary = state.needsLocalHelpBeforeMove ? 'local-help' : journey.atDestination ? 'journey-end' : 'travel-next';
  }
  // Escape obligations take precedence over ordinary care. Delve and unfinished
  // transactions retain their earlier priority and cannot be bypassed here.
  if (state.pursuedByBehemoth && ['active-patient', 'scrounging', 'local-help', 'travel-next'].includes(primary || '')) {
    primary = 'behemoth-chase';
  }
  switch (primary) {
    case 'archive-patient': return action('archive', '진료 결과를 확인하고 마감하세요', '진료 결과는 정해졌습니다. 개인 메모는 선택입니다. 기록을 마감하면 다음 행동을 이어갈 수 있습니다.',
      '진료 기록 마감하기', 'pending-archive-panel', 'archive-patient', 'procedure:leave', 36);
    case 'active-delve': return action('delve', '고분 안의 도전을 이어가세요', '고분마다 도전과 시간 규칙이 다릅니다. 현재 도전의 선택지와 결과를 따라 탐사를 마무리합니다.',
      '고분 도전 보기', 'barrow-panel', 'active-delve', 'procedure:barrows', 116, true);
    case 'scrounging': return action('scrounging', '떠나기 전, 조금 더 머물러도 좋아요',
      `${timer.scroungingHours === null ? '' : `여분 채집 시간은 ${timer.scroungingHours}시간입니다. `}모든 치료 기한이 0보다 클 때 현재 지역 채집 1시간·인접 지역 2시간, 약효 2 이하 부위 직접 확보는 현재 3시간·인접 4시간을 씁니다. 바로 길을 떠나도 됩니다.`,
      '떠날 준비 보기', 'patient-clinic-panel', 'scrounging', 'procedure:leave', 37);
    case 'active-patient':
      if (timer.shortestHours === 0) return action('patient-expired', '치료 기한이 끝났어요',
        '남은 치료 기한이 0인 질환이 있습니다. 해당 질환의 실패 결과와 후속 판정을 확인하고 진료 기록을 마감합니다.',
        '실패 결과 확인하기', 'treatment-workspace', 'active-patient', 'procedure:leave', 36, true);
      return action('patient', '필요한 약효부터 살펴보세요',
      `${timer.shortestHours === null ? '' : `가장 짧은 치료 기한은 ${timer.shortestHours}시간입니다. `}질환의 요구 태그와 배낭 재료를 비교합니다. 부족한 부위를 채집하거나 거래한 뒤 조제합니다.`,
      '현재 처방 보기', 'treatment-workspace', 'active-patient', 'procedure:treatment', 27);
    case 'local-help': return action('local-help', '이 길목의 야수를 도와주세요', '현지 진료가 남아 다음 이동이 기다리고 있습니다. 환자를 만나 질환, 필요한 약효와 치료 기한을 확인하세요.',
      '환자 만나기', 'patient-clinic-panel', 'local-help', 'procedure:diagnosis', 28);
    case 'journey-end': return action('journey-end', journey.phase === 'ending' ? '고르던 여정 결말을 이어가세요' : '목적지에 도착했어요',
      `${localizeLocationName(state.journeyDestination || '목적지')}에서 여정 목표와 실제 기록을 돌아봅니다. 결말과 회고를 저장하면 휴식기가 시작됩니다.`,
      '여정 마무리 보기', 'journey-ending-panel', 'journey-end', 'procedure:journey-close', 38);
    case 'behemoth-chase': return action('chase', '추격을 벗어날 길을 살펴보세요', '추격의 선행 거리와 현재 이동 조건을 확인하고 경로 또는 사용할 수 있는 탈출 수단을 고릅니다.',
      '이동 계획 보기', 'route-planning-panel', 'behemoth-chase', 'procedure:move', 22, true);
    default: return action('move', '다음 길목을 향해 걸어볼까요', '이번 이동 속도를 채우는 경로를 고른 뒤 카드를 뽑습니다. 도착한 장소의 조우와 현지 진료를 마쳐야 다시 이동할 수 있습니다.',
      '경로 짜기', 'route-planning-panel', 'travel-next', 'procedure:move', 22);
  }
};
