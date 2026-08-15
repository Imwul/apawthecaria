import { BARROW_DELVE_BY_ID, type BarrowDelveId } from '../rules';
import { localizeBehemothClass, localizeLocationName, localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import { localizeGameplayMessage } from '../localization/engineMessagesKo';

const delveStepLabels: Record<string, string> = {
  ready: '입구',
  challenge: '도전',
  'awaiting-choice': '선택 대기',
  resolved: '귀환'
};

export function JourneyStatusStrip({ state, currentWeight, maxCarry }: { state: any; currentWeight: number; maxCarry: number }) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId);
  const timer = patient?.timers?.filter((row: any) => row.status === 'active').sort((a: any, b: any) => a.current - b.current)[0];
  const pending = state.pendingEncounter ? '조우 선택' : state.pendingBarter ? '거래 판정' : state.pendingForaging ? '채집 판정' : state.pendingManualEffect ? '직접 판정' : state.activeDelve ? '고분 탐사' : null;
  return <section className="status-strip" aria-label="현재 진행 상황">
    <div className="status-strip__primary"><span className="document-kicker">현재 들녘 상태</span><strong>{localizeLocationName(state.currentLocationName)}</strong><span>{localizeSeasonLabel(state.currentSeason)} · {localizeRegionLabel(state.currentRegion)} · {state.journeyActive ? localizeLocationName(state.journeyDestination) : '휴식 중'}</span></div>
    <dl><div><dt>환자</dt><dd>{patient?.name || '없음'}</dd></div><div><dt>가장 낮은 타이머</dt><dd>{timer ? `${timer.current}시간` : '없음'}</dd></div><div><dt>배낭</dt><dd>{currentWeight.toFixed(1)} / {maxCarry}</dd></div><div><dt>다음 행동</dt><dd>{pending || '여정을 준비하세요'}</dd></div></dl>
  </section>;
}

export function BarrowPanel({ delve }: { delve: any }) {
  if (!delve) return null;
  const legacyIds: Record<string, BarrowDelveId> = {
    UneasySleep: 'uneasy-sleep', CollapsedEntrance: 'collapsed-entrance', BelliesOfMany: 'bellies-of-many',
    InsideJob: 'inside-job', PotentPoison: 'potent-poison', StealEverything: 'pilfer-unnoticed',
    BuildingTrust: 'building-trust', SuitableFurnishings: 'suitable-furnishings'
  };
  const delveId = (delve.delveId || legacyIds[delve.challengeType]) as BarrowDelveId | undefined;
  const definition = delveId ? BARROW_DELVE_BY_ID.get(delveId) : null;
  const requirements = delve.requirements || definition?.requiredTags.map(row => `${row.tag} ${row.value}${row.count ? ` x${row.count}` : ''}`) || [];
  const cards = delve.cards || (delve.cardsDrawn || []).map((value: string) => ({ value }));
  const selected = delve.selectedItems || delve.reagentsGathered || [];
  const step = delve.currentStep || (delve.challengeType ? 'challenge' : 'ready');
  const progress = delve.progress ?? delve.points ?? 0;
  const timer = delve.timer ?? definition?.initialTimer ?? 0;
  const unresolved = delve.unresolvedChoices || [];
  const reward = delve.reward || {};
  return <section className="barrow-panel barrow-field-note" aria-labelledby="barrow-heading" data-delve={delveId}>
    <header className="barrow-field-note__header">
      <div>
        <span className="status-label status-label--unresolved">고분 탐사 기록</span>
        <h2 id="barrow-heading">{definition?.name || delve.behemothName || '고분 탐사'}</h2>
        <p>{definition?.challenge || delve.behemothName} · {localizeBehemothClass(definition?.behemothClass || delve.behemothClass)} · 원문 p.{definition?.sourcePage || delve.sourcePage || '116–125'}</p>
      </div>
      <div className="barrow-field-note__suit" aria-label="도전 문양">{delve.challengeSuit || delve.suit || '·'}</div>
    </header>

    <ol className="barrow-steps" aria-label="고분 진행 단계">
      {['ready', 'challenge', 'awaiting-choice', 'resolved'].map((row, index) => <li key={row} className={row === step ? 'is-current' : index < ['ready', 'challenge', 'awaiting-choice', 'resolved'].indexOf(step) ? 'is-done' : ''}><span>{index + 1}</span>{row === 'ready' ? '입구' : row === 'challenge' ? '도전' : row === 'awaiting-choice' ? '선택' : '귀환'}</li>)}
    </ol>

    <div className="barrow-field-note__ledger">
      <dl>
        <div><dt>현재 단계</dt><dd>{delveStepLabels[step] || step}</dd></div>
        <div><dt>진행도</dt><dd>{progress}</dd></div>
        <div><dt>타이머</dt><dd>{timer}</dd></div>
        <div><dt>후퇴 비용</dt><dd>{delve.fleeState?.costDays ?? 1}일 · 다음 속도 {delve.fleeState?.nextMoveSpeed ?? 1}</dd></div>
      </dl>
      <div className="barrow-field-note__column"><span>뽑은 카드</span><strong>{cards.length ? cards.map((card: any) => `${card.suit || ''}${card.ruleValue ?? card.value ?? ''}`).join(' · ') : '아직 없음'}</strong></div>
      <div className="barrow-field-note__column"><span>선택한 영약재와 도구</span><strong>{selected.length ? selected.map((item: any) => item.itemId || item).join(' · ') : '아직 없음'}</strong></div>
      <div className="barrow-field-note__column"><span>보상</span><strong>{reward.trinkets ? `장신구 ${reward.trinkets}` : ''}{reward.reputation ? ` · 명성 ${reward.reputation}` : ''}{reward.toolId ? ` · ${reward.toolId}` : ''}{!reward.trinkets && !reward.reputation && !reward.toolId ? '도전 결과에 따라 기록' : ''}</strong></div>
      <div className="barrow-field-note__column"><span>지도 결과</span><strong>{delve.removedFromMap ? '고분이 지도에서 사라짐' : '해결 전까지 현재 위치 유지'}</strong></div>
    </div>

    {requirements.length > 0 && <div className="barrow-requirements"><span>필요한 처방</span><ul>{requirements.map((row: string) => <li key={row}>{row}</li>)}</ul></div>}
    {unresolved.length > 0 && <div className="barrow-unresolved"><span>선택 필요</span>{unresolved.map(localizeGameplayMessage).join(' · ')}</div>}
    <p className="barrow-panel__note">새로고침해도 이 단계가 저장됩니다. 도전을 시작한 뒤에는 현재 판정 결과 또는 원문의 후퇴 절차로만 탐사를 마칠 수 있습니다.</p>
  </section>;
}
