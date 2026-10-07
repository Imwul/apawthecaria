import { useEffect, useRef } from 'react';
import { RuleTagText } from './RuleTag';
import { localizeJourneyGoalText, localizeLocationName, localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import { referenceForJournalTab } from '../rulebook/context';
import type { RulebookReferenceRequest } from '../rulebook/types';
import { getCampaignNextAction } from '../campaignContinuity';
import { getPatientTimerProjection } from '../patientTimerProjection';
import { getJourneyUiContext } from '../journeyUiContext';
import { readCalendarClocks } from '../calendarTime';
import { getPatientArrivalPreview } from '../patientArrivalPreview';
import { AILMENT_BY_ID } from '../rules/data/ailments';
import { ailmentRequirementText } from '../ailmentPresentation';
import type { JournalTab } from '../sessionNavigation';
import { isActivityJournalEntry, journalDisplayTitle, journalEntriesNewestFirst, journalPreview } from '../journalSemantics';

export type { JournalTab } from '../sessionNavigation';
type ChapterTab = Exclude<JournalTab, 'play'>;
const WORKSPACES = [
  { id: 'travel', label: '여행', note: '길 위에서 할 일', first: 'play', items: [
    { id: 'play', label: '지금 할 일', number: '01' },
    { id: 'map', label: '세계 지도', number: '02' },
    { id: 'bio', label: '약제사와 배낭', number: '03' }
  ] },
  { id: 'reference', label: '찾기', note: '필요한 지식', first: 'reagents', items: [
    { id: 'reagents', label: '영약재', number: '04' },
    { id: 'ailments', label: '질환 사전', number: '05' },
    { id: 'almanack', label: '규칙 자료실', number: '06' }
  ] },
  { id: 'memory', label: '기록', note: '여행이 남긴 것', first: 'journals', items: [
    { id: 'journals', label: '나의 이야기', number: '07' },
    { id: 'patientArchive', label: '진료 기록', number: '08' },
    { id: 'livingArchive', label: '발견과 기억', number: '09' }
  ] }
] as const;

export function JournalNavigation({ activeTab, onChange }: { activeTab: JournalTab; onChange: (tab: JournalTab) => void }) {
  const currentGroup = WORKSPACES.find(group => group.items.some(item => item.id === activeTab))!;
  const lastVisited = useRef<Partial<Record<typeof WORKSPACES[number]['id'], JournalTab>>>({
    [currentGroup.id]: activeTab
  });
  useEffect(() => {
    lastVisited.current[currentGroup.id] = activeTab;
  }, [activeTab, currentGroup.id]);
  return <nav className="station-navigation" aria-label="작업 색인">
    <div className="station-mode-switch" aria-label="작업 모드">
      {WORKSPACES.map(group => <button key={group.id} type="button" aria-pressed={currentGroup.id === group.id}
        onClick={() => onChange(currentGroup.id === group.id ? activeTab : lastVisited.current[group.id] || group.first)}>{group.label}</button>)}
    </div>
    {WORKSPACES.map(group => <div key={group.id} className={`station-nav-group${currentGroup.id === group.id ? ' is-current' : ''}`} role="group" aria-label={group.note}>
      <p className="station-nav-group__label"><span>{group.label}</span><small>{group.note}</small></p>
      {group.items.map(item => <button key={item.id} type="button"
        className={`journal-tab journal-tab--${item.id}${activeTab === item.id ? ' journal-tab--active' : ''}`}
        aria-current={activeTab === item.id ? 'page' : undefined} title={item.label} onClick={() => onChange(item.id)}>
        <span className="station-nav-number" aria-hidden="true">{item.number}</span><span>{item.label}</span><span className="station-nav-arrow" aria-hidden="true">↗</span>
      </button>)}
    </div>)}
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
      <p className="station-eyebrow">{chapter.group} <span aria-hidden="true">/</span> FIELD INDEX {chapter.number}</p>
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

export function TodayOverview({ state, currentWeight, maxCarry, onNavigate, onContinue, onOpenReference }: {
  state: any; currentWeight: number; maxCarry: number; onNavigate: (tab: JournalTab) => void;
  onContinue: () => void; onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId && row.status === 'active');
  const ailment = patient?.ailments?.find((row: any) => row.status === 'active');
  const legacy = state.patients?.some((row: any) => row.id === state.activePatientId) ? null : state.activeAilment;
  const timers = getPatientTimerProjection(state);
  const next = getCampaignNextAction(state);
  const journey = getJourneyUiContext(state);
  const calendar = readCalendarClocks(state);
  const definition = ailment?.ailmentId ? AILMENT_BY_ID.get(ailment.ailmentId) : undefined;
  const requirements = definition ? ailmentRequirementText(definition.requirements) : ailment?.requirementSnapshot || legacy?.tags || '';
  const recent = journalEntriesNewestFirst<any>(state.journals || []).find(row => !isActivityJournalEntry(row));
  const arrival = getPatientArrivalPreview(recent);
  return <section className="workspace-today station-dossier" aria-labelledby="today-title">
    <div className="station-dossier__task">
      <div className="station-dossier__top"><span className="station-eyebrow">현재 작업 / NOW</span><span>{localizeLocationName(state.currentLocationName)} · {localizeSeasonLabel(state.currentSeason)}</span></div>
      <h2 id="today-title">{next.title}</h2><p className="workspace-today__reason">{next.reason}</p>
      <div className="workspace-today__actions"><button type="button" className="workspace-primary" onClick={onContinue}>{next.label}<span aria-hidden="true"> →</span></button>
        <button type="button" className="workspace-link" onClick={() => onOpenReference(next.reference)}>이 단계의 규칙 ↗</button></div>
    </div>
    <aside className="station-journey" aria-label="여정 현황">
      <div className="station-journey__heading"><span className="station-eyebrow">{journey.active ? '진행 중인 여정' : '여행 대장'}</span><span className="station-folio">{String(calendar.cumulativeDays).padStart(2, '0')} DAYS</span></div>
      {journey.active ? <><div className="station-journey__destination"><span>목적지</span><button type="button" onClick={() => onNavigate('map')}>{localizeLocationName(state.journeyDestination) || '미정'} ↗</button></div>
        <div className="station-journey__calendar"><strong>{calendar.calendarDays} / {state.calendarMaxDays || 0}일</strong><span>남은 기한 {Math.max(0, (state.calendarMaxDays || 0) - calendar.calendarDays)}일</span></div>
        <meter min={0} max={Math.max(1, state.calendarMaxDays || 0)} value={calendar.calendarDays} aria-label="여정 달력 진행" />
        {state.journeyGoalTitle && <details className="station-goal"><summary>{state.journeyGoalTitle}</summary><p>{localizeJourneyGoalText(state.journeyGoalDesc || '')}</p></details>}
      </> : <><p>아직 정해지지 않은 다음 길.<br />목적지와 목표를 정하면 여기에 펼쳐집니다.</p><div className="station-journey__calendar"><span>마친 계절 <strong>{state.completedSeasons || 0}</strong></span><span>길드 명성 <strong>{state.reputation || 0}</strong></span></div></>}
      {recent && <button type="button" className="station-recent" onClick={() => onNavigate('journals')}><span>마지막 기억</span><strong>{journalDisplayTitle(recent)} ↗</strong></button>}
      {arrival && <details className="station-recent-note"><summary>최근 환자의 첫인상과 병증</summary><dl><div><dt>첫인상</dt><dd>{arrival.impression}</dd></div><div><dt>병증</dt><dd>{arrival.diagnosis}</dd></div></dl></details>}
    </aside>
    {patient || legacy || currentWeight > maxCarry ? <div className="workspace-patient-strip" aria-label="현재 진료와 준비물">
      {patient || legacy ? <><div><span>현재 환자</span><strong>{patient?.name || legacy?.patientName || '이름 없는 환자'}</strong><small>{definition?.displayName || ailment?.legacyName || legacy?.name || '병증 확인 중'}</small></div>
        {Boolean(requirements) && <div><span>필요 약효</span><strong><RuleTagText text={requirements} /></strong></div>}
        <div><span>가장 급한 치료 기한</span><strong className={timers.shortestHours === 0 ? 'is-urgent' : ''}>{timers.shortestHours === null ? '기한 없음' : `${timers.shortestHours}시간`}</strong>{timers.activeTimers.length > 1 && <small>{timers.activeTimers.length}개 기한을 각각 추적합니다</small>}</div></> : null}
      {currentWeight > maxCarry && <div className="is-urgent"><span>배낭 한도 초과</span><strong>{currentWeight.toFixed(1)} / {maxCarry}</strong><button type="button" className="workspace-link" onClick={() => onNavigate('bio')}>짐 정리하기</button></div>}
    </div> : null}
  </section>;
}
