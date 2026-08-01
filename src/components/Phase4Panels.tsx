import type { ManualEffectDraft } from '../rules';

export function JourneyStatusStrip({ state, currentWeight, maxCarry }: { state: any; currentWeight: number; maxCarry: number }) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId);
  const timer = patient?.timers?.filter((row: any) => row.status === 'active').sort((a: any, b: any) => a.current - b.current)[0];
  const pending = state.pendingEncounter ? '조우 선택' : state.pendingBarter ? '거래 판정' : state.pendingForaging ? '채집 판정' : state.pendingManualEffect ? '직접 판정' : state.activeDelve ? '고분 탐사' : null;
  return <section className="status-strip" aria-label="현재 진행 상황">
    <div className="status-strip__primary"><span className="document-kicker">Current field state</span><strong>{state.currentLocationName}</strong><span>{state.currentSeason} · {state.journeyActive ? state.journeyDestination || '여정 진행 중' : '휴식 중'}</span></div>
    <dl><div><dt>환자</dt><dd>{patient?.name || '없음'}</dd></div><div><dt>가장 낮은 타이머</dt><dd>{timer ? `${timer.current}시간` : '없음'}</dd></div><div><dt>배낭</dt><dd>{currentWeight.toFixed(1)} / {maxCarry}</dd></div><div><dt>다음 행동</dt><dd>{pending || '여정을 준비하세요'}</dd></div></dl>
  </section>;
}

export function BarrowPanel({ delve }: { delve: any }) {
  if (!delve) return null;
  return <section className="barrow-panel" aria-labelledby="barrow-heading">
    <div><span className="status-label status-label--unresolved">고분 탐사 진행 중</span><h2 id="barrow-heading">{delve.delveId || delve.type || 'Barrow Delve'}</h2><p>단계 {delve.currentStep || delve.step || 'challenge'} · 원문 p.{delve.sourcePage || '116–125'}</p></div>
    <dl><div><dt>도전 문양</dt><dd>{delve.challengeSuit || delve.suit || '확인 필요'}</dd></div><div><dt>진행</dt><dd>{delve.progress ?? 0}</dd></div><div><dt>타이머</dt><dd>{delve.timer ?? 0}</dd></div><div><dt>후퇴 비용</dt><dd>시작 전 1일, 다음 이동 Speed 1</dd></div></dl>
    {delve.requirements?.length > 0 && <p><strong>요구:</strong> {delve.requirements.join(' · ')}</p>}
    <p className="barrow-panel__note">탐사를 시작한 뒤에는 일반 취소할 수 없습니다. 현재 단계의 판정 또는 원문 후퇴 절차로 종료하세요.</p>
  </section>;
}

export function ManualEffectPanel({ draft, onChange, onDefer, onResolve }: { draft: ManualEffectDraft; onChange: (draft: ManualEffectDraft) => void; onDefer: () => void; onResolve: (override: boolean) => void }) {
  return <section className="manual-effect" aria-labelledby="manual-effect-title">
    <header><span className="status-label status-label--manual">직접 처리 필요</span><h2 id="manual-effect-title">{draft.summary}</h2><p>{draft.ruleId} · 원문 p.{draft.sourcePage}</p></header>
    {draft.mandatoryConditions.length > 0 && <div><h3>강제 조건</h3><ul>{draft.mandatoryConditions.map(row => <li key={row}>{row}</li>)}</ul></div>}
    {draft.choices.length > 0 && <div><h3>가능한 선택</h3><ul>{draft.choices.map(row => <li key={row}>{row}</li>)}</ul></div>}
    <label><span>판정 결과 요약</span><textarea value={draft.resultSummary} onChange={event => onChange({ ...draft, resultSummary: event.target.value })} rows={3} /></label>
    <label><span>저널 기록</span><textarea value={draft.journalNote} onChange={event => onChange({ ...draft, journalNote: event.target.value })} rows={4} /></label>
    <div className="manual-effect__actions"><button type="button" onClick={onDefer}>나중에 처리</button><button type="button" className="btn-cozy-primary" onClick={() => onResolve(false)}>기록하고 완료</button><button type="button" className="btn-cozy-danger" onClick={() => onResolve(true)}>GM override</button></div>
  </section>;
}
