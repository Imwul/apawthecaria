import { useEffect, useRef } from 'react';
import { RuleTagText } from './RuleTag';
import { localizeJourneyGoalText, localizeLocationName, localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import { referenceForJournalTab } from '../rulebook/context';
import type { RulebookReferenceRequest } from '../rulebook/types';
import { getCampaignNextAction } from '../campaignContinuity';
import { getPatientTimerProjection } from '../patientTimerProjection';
import { getJourneyUiContext } from '../journeyUiContext';
import { readCalendarClocks } from '../calendarTime';
import { getCurrentPlayLoopStage, PLAY_LOOP_STAGES } from '../playLoop';
import { getTreatmentAilmentDefinition } from '../rules/treatableAilments';
import { applyAilmentTagOverrides } from '../rules/treatmentEngine';
import type { RuleTag } from '../rules/types';
import { ailmentRequirementText } from '../ailmentPresentation';
import type { JournalTab } from '../sessionNavigation';
import { isActivityJournalEntry, journalDisplayTitle, journalEntriesNewestFirst, journalPreview } from '../journalSemantics';

export type { JournalTab } from '../sessionNavigation';
type ChapterTab = Exclude<JournalTab, 'play'>;
const MAIN_TABS = [
  { id: 'play', label: '진행' },
  { id: 'map', label: '지도' },
  { id: 'bio', label: '약제사·배낭' },
  { id: 'reagents', label: '영약재' },
  { id: 'almanack', label: '규칙' },
  { id: 'journals', label: '일지' }
] as const;
const MORE_TABS = [
  { id: 'ailments', label: '질환 사전' },
  { id: 'patientArchive', label: '진료 기록' },
  { id: 'livingArchive', label: '발견과 기억' }
] as const;

export function JournalNavigation({ activeTab, onChange }: { activeTab: JournalTab; onChange: (tab: JournalTab) => void }) {
  const moreRef = useRef<HTMLDetailsElement>(null);
  const archiveActive = MORE_TABS.some(tab => tab.id === activeTab);
  useEffect(() => {
    if (archiveActive && moreRef.current) moreRef.current.open = true;
  }, [activeTab, archiveActive]);
  const renderTab = (item: { id: JournalTab; label: string }) => <button key={item.id} type="button"
    className={`journal-tab journal-tab--${item.id}${activeTab === item.id ? ' journal-tab--active' : ''}`}
    aria-current={activeTab === item.id ? 'page' : undefined} title={item.label} onClick={() => onChange(item.id)}>
    <span>{item.label}</span>
  </button>;
  return <nav className="station-navigation direct-navigation" aria-label="플레이 도구">
    <div className="direct-navigation__main">
      {MAIN_TABS.map(renderTab)}
    </div>
    <details className="direct-navigation__more" ref={moreRef} open={archiveActive || undefined}>
      <summary>기록 더 보기</summary>
      <div className="direct-navigation__archives">{MORE_TABS.map(renderTab)}</div>
    </details>
  </nav>;
}

const CHAPTERS: Record<ChapterTab, { title: string; group: string; number: string; purpose: string }> = {
  map: { title: '세계 지도', group: '여행', number: '02', purpose: '장소와 연결된 길을 살펴보고, 다음 이동을 준비합니다.' },
  bio: { title: '약제사와 배낭', group: '여행', number: '03', purpose: '함께 걷는 이와 가지고 있는 것들을 관리합니다.' },
  reagents: { title: '영약재', group: '찾기', number: '04', purpose: '필요한 약효에서 시작해 부위, 조제법, 도구를 대조하세요.' },
  ailments: { title: '질환 사전', group: '찾기', number: '05', purpose: '질환의 기한과 필요한 약효를 먼저 비교하고, 자세한 내용을 펼치세요.' },
  almanack: { title: '규칙 자료실', group: '찾기', number: '06', purpose: '이름이나 용어로 원문 규칙과 관련 자료를 찾습니다.' },
  journals: { title: '나의 이야기', group: '기록', number: '07', purpose: '당신의 문장으로 여행을 기억하세요.' },
  patientArchive: { title: '진료 기록', group: '기록', number: '08', purpose: '만났던 환자들의 증상, 처방, 결과를 다시 읽습니다.' },
  livingArchive: { title: '발견과 기억', group: '기록', number: '09', purpose: '지나온 장소와 발견, 만남과 기념품을 함께 살펴봅니다.' }
};

export function ChapterOpening({ tab, state, maxCarry, onReturnToToday, onOpenReference }: {
  tab: ChapterTab; state: any; maxCarry: number; onReturnToToday: () => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const chapter = CHAPTERS[tab];
  const next = getCampaignNextAction(state);
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId && row.status === 'active');
  const legacy = state.patients?.some((row: any) => row.id === state.activePatientId) ? null : state.activeAilment;
  const timers = getPatientTimerProjection(state);
  const journalCount = state.journals?.filter((row: any) => !isActivityJournalEntry(row)).length || 0;
  const recent = journalEntriesNewestFirst<any>(state.journals || []).find(row => !isActivityJournalEntry(row));
  const notes = tab === 'journals' ? [`${journalCount}편의 일지`, localizeSeasonLabel(state.currentSeason)]
    : tab === 'bio' ? [`${state.bio?.name || '약제사'}`, `휴대 한도 ${maxCarry}`]
    : tab === 'patientArchive' ? [`${(state.patientArchive?.length || 0) + (state.patientCasebook?.length || 0)}건의 진료`, localizeSeasonLabel(state.currentSeason)]
    : [localizeSeasonLabel(state.currentSeason), `${localizeRegionLabel(state.currentRegion)} 관찰`];
  return <header className="chapter-opening station-heading" aria-labelledby={`chapter-title-${tab}`}>
    <div className="station-heading__copy">
      <p className="station-eyebrow">{chapter.group} <span aria-hidden="true">/</span> {chapter.number}</p>
      <h2 id={`chapter-title-${tab}`}>{chapter.title}</h2><p>{chapter.purpose}</p>
    </div>
    <div className="station-heading__tools">
      <ul className="chapter-opening__notes" aria-label="현재 기록 요약">{notes.map(note => <li key={note}>{note}</li>)}</ul>
      <button type="button" className="workspace-link" onClick={() => onOpenReference(referenceForJournalTab(tab, state))}>이 화면의 규칙 ↗</button>
      {(tab === 'ailments' && (patient || legacy)) || tab === 'map' ? <button type="button" className="workspace-primary" onClick={onReturnToToday}>
        {tab === 'ailments' ? '치료 이어가기' : next.label} →
      </button> : null}
      <details className="station-context-note"><summary>현재 상황</summary><dl>
        <div><dt>머무는 곳</dt><dd>{localizeLocationName(state.currentLocationName)}</dd></div>
        {patient || legacy ? <><div><dt>환자</dt><dd>{patient?.name || legacy?.patientName || '이름 없는 환자'}</dd></div><div><dt>가장 급한 기한</dt><dd>{timers.shortestHours === null ? '기한 없음' : `${timers.shortestHours}시간`}</dd></div></> : null}
        <div><dt>이어서 할 일</dt><dd>{next.label}</dd></div>
      </dl>{tab === 'journals' && recent ? <p><strong>{journalDisplayTitle(recent)}</strong><br />“{journalPreview(recent, 130)}”</p> : null}</details>
    </div>
  </header>;
}

export function TodayOverview({ state, currentWeight, maxCarry, onNavigate, onOpenReference }: {
  state: any; currentWeight: number; maxCarry: number; onNavigate: (tab: JournalTab) => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId && row.status === 'active');
  const activeAilments = patient?.ailments?.filter((row: any) => row.status === 'active') || [];
  const legacy = state.patients?.some((row: any) => row.id === state.activePatientId) ? null : state.activeAilment;
  const timers = getPatientTimerProjection(state);
  const next = getCampaignNextAction(state);
  const currentStage = getCurrentPlayLoopStage(state);
  const journey = getJourneyUiContext(state);
  const calendar = readCalendarClocks(state);
  const calendarLimit = Math.max(0, Number(state.calendarMaxDays) || 0);
  const daysRemaining = calendarLimit - calendar.calendarDays;
  const timeHours = state.scroungingMode ? timers.scroungingHours : timers.shortestHours;
  const prescriptions = activeAilments.map((ailment: any) => {
    const definition = getTreatmentAilmentDefinition(ailment.ailmentId);
    const baseExpression = definition ? applyAilmentTagOverrides(
      definition.requirements, definition.id, state.ailmentTagOverrides || []
    ) : null;
    const base = baseExpression ? ailmentRequirementText(baseExpression) : ailment.requirementSnapshot || '';
    const additional = Array.isArray(ailment.specialState?.additionalRequirements)
      ? ailment.specialState.additionalRequirements as Array<{ tag: RuleTag; threshold: number }> : [];
    const dynamic = [...additional, ...(typeof ailment.specialState?.poisonRequirement === 'number'
      ? [{ tag: 'POISON' as const, threshold: ailment.specialState.poisonRequirement }] : [])];
    return {
      id: ailment.id,
      name: definition?.displayName || ailment.legacyName || '병증 확인 중',
      requirements: [dynamic.length > 0 && baseExpression?.kind === 'alternatives' ? `(${base})` : base,
        ...dynamic.map(row => ailmentRequirementText({ kind: 'tag', ...row }))].filter(Boolean).join(' + ')
    };
  });
  if (legacy) prescriptions.push({ id: 'legacy', name: legacy.name || '병증 확인 중', requirements: legacy.tags || '' });
  return <section className="play-overview" aria-labelledby="today-title">
    <header className="play-overview__heading">
      <div>
        <p className="play-overview__place">{localizeLocationName(state.currentLocationName)} · {localizeSeasonLabel(state.currentSeason)}</p>
        <h2 id="today-title">{next.title}</h2>
      </div>
      <button type="button" className="workspace-link" onClick={() => onOpenReference(next.reference)}>이 단계의 규칙 ↗</button>
    </header>
    <p className="play-overview__reason">{next.reason}</p>
    <ol className="play-loop" aria-label="반복 플레이 순서">
      {PLAY_LOOP_STAGES.map((stage, index) => <li key={stage.id}
        className={`play-loop__step${currentStage === stage.id ? ' is-current' : ''}`}
        aria-current={currentStage === stage.id ? 'step' : undefined}>
        <span className="play-loop__number" aria-hidden="true">{index + 1}</span>
        <span><strong>{stage.label}</strong><small>{stage.detail}</small></span>
        {currentStage === stage.id && <span className="play-loop__current">현재</span>}
      </li>)}
    </ol>
    <dl className="play-clock-grid" aria-label="달력과 치료 시간">
      <div className={`play-clock play-clock--calendar${journey.active && calendarLimit > 0 && daysRemaining < 0 ? ' is-urgent' : ''}`}>
        <dt>여정 달력 · 일</dt>
        <dd><strong>{journey.active ? `${calendar.calendarDays} / ${calendarLimit || '미정'}일` : '여정 시작 전'}</strong>
          <small>{journey.active
            ? calendarLimit === 0 ? '기한 미정' : daysRemaining < 0 ? `기한 ${-daysRemaining}일 초과` : daysRemaining === 0 ? '기한 마지막 날' : `기한까지 ${daysRemaining}일`
            : `전체 경과 ${calendar.cumulativeDays}일`}</small></dd>
      </div>
      <div className={`play-clock play-clock--time${timeHours === 0 ? ' is-urgent' : ''}`}>
        <dt>{state.scroungingMode ? '여분 채집 시간 · 시간' : '치료 기한 · 시간'}</dt>
        <dd><strong>{timeHours === null ? timers.hasActiveAilment || state.scroungingMode ? '기한 확인 필요' : '진행 중인 진료 없음' : `${timeHours}시간`}</strong>
          <small>{state.scroungingMode ? '달력의 일수와 별도로 사용합니다'
            : timers.activeTimers.length > 1 ? `${timers.activeTimers.length}개 기한 중 가장 짧은 시간`
              : timeHours === null ? '진단 후 별도 시간으로 추적합니다' : '채집·거래·조우에 따라 줄어듭니다'}</small></dd>
      </div>
    </dl>
    {journey.active && <div className="play-journey-note">
      <span>목적지</span><button type="button" className="workspace-link" onClick={() => onNavigate('map')}>{localizeLocationName(state.journeyDestination) || '미정'} ↗</button>
      {state.journeyGoalTitle && <details><summary>여정 목표: {state.journeyGoalTitle}</summary><p>{localizeJourneyGoalText(state.journeyGoalDesc || '')}</p></details>}
    </div>}
    {patient || legacy || currentWeight > maxCarry ? <div className="play-patient-summary" aria-label="현재 진료와 준비물">
      {patient || legacy ? <><div><span>현재 환자</span><strong>{patient?.name || legacy?.patientName || '이름 없는 환자'}</strong>
        {prescriptions.length === 1 && <small>{prescriptions[0].name}</small>}</div>
        {prescriptions.some((row: { requirements: string }) => row.requirements) && <div><span>필요 약효</span>
          {prescriptions.map((row: { id: string; name: string; requirements: string }) => row.requirements && <div key={row.id}>
            {prescriptions.length > 1 && <small>{row.name}</small>}<strong><RuleTagText text={row.requirements} /></strong>
          </div>)}</div>}</> : null}
      {currentWeight > maxCarry && <div className="is-urgent"><span>배낭 한도 초과</span><strong>{currentWeight.toFixed(1)} / {maxCarry}</strong><button type="button" className="workspace-link" onClick={() => onNavigate('bio')}>짐 정리하기</button></div>}
    </div> : null}
  </section>;
}
