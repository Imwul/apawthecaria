import { useRef } from 'react';
import { localizeJourneyGoalText, localizeLocationName, localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import { referenceForJournalTab } from '../rulebook/context';
import type { RulebookReferenceRequest } from '../rulebook/types';
import { getCampaignNextAction } from '../campaignContinuity';
import { getPatientTimerProjection } from '../patientTimerProjection';
import { formatRuleTag } from '../localization/ruleTagsKo';
import { getJourneyUiContext } from '../journeyUiContext';
import { readCalendarClocks } from '../calendarTime';
import type { JournalTab } from '../sessionNavigation';
import { getPatientArrivalPreview } from '../patientArrivalPreview';
import { isActivityJournalEntry, journalDisplayTitle, journalEntriesNewestFirst, journalPreview } from '../journalSemantics';

export type { JournalTab } from '../sessionNavigation';

type ChapterTab = Exclude<JournalTab, 'play'>;

const CHAPTER_ENGLISH: Record<JournalTab, string> = {
  play: 'The journey', map: 'The atlas', ailments: 'Ailments', reagents: 'The herbarium',
  bio: 'The satchel', almanack: 'Field guide', patientArchive: 'The casebook',
  livingArchive: 'Discoveries', journals: 'The journal'
};
const CHAPTER_NUMBER: Record<JournalTab, string> = {
  play: '01', map: '02', ailments: '03', reagents: '04', bio: '05',
  almanack: '06', patientArchive: '07', livingArchive: '08', journals: '09'
};

const NAVIGATION = [
  {
    id: 'primary', label: '모험의 도구', items: [
      { id: 'play', label: '모험', emoji: '🧭' },
      { id: 'map', label: '세계 지도', emoji: '🗺️' },
      { id: 'ailments', label: '병증 사전', emoji: '🩺' },
      { id: 'reagents', label: '약초', emoji: '🌿' },
      { id: 'bio', label: '배낭', emoji: '🎒' }
    ]
  },
  {
    id: 'reference', label: '도움이 필요할 때', items: [
      { id: 'almanack', label: '자료실', emoji: '🔎' }
    ]
  },
  {
    id: 'memories', label: '남긴 기억', items: [
      { id: 'patientArchive', label: '진료 기록', emoji: '🗂️' },
      { id: 'livingArchive', label: '발견', emoji: '🪻' },
      { id: 'journals', label: '이야기', emoji: '✒️' }
    ]
  }
] as const;

export function JournalNavigation({ activeTab, onChange }: { activeTab: JournalTab; onChange: (tab: JournalTab) => void }) {
  const moreRef = useRef<HTMLDetailsElement>(null);


  const renderItems = (group: typeof NAVIGATION[number]) => group.items.map(item => (
              <button
                key={item.id}
                type="button"
                className={`journal-tab adventure-nav__item journal-tab--${item.id} ${activeTab === item.id ? 'journal-tab--active' : ''}`}
                aria-current={activeTab === item.id ? 'page' : undefined}
                title={item.label}
                onClick={() => {
                  onChange(item.id);
                  if (moreRef.current) moreRef.current.open = false;
                }}
              >
                <span className="workspace-nav__number" aria-hidden="true">{CHAPTER_NUMBER[item.id]}</span>
                <span className="workspace-nav__copy"><span>{item.label}</span><span className="workspace-nav__english" aria-hidden="true">{CHAPTER_ENGLISH[item.id]}</span></span>
              </button>
            ));
  const secondaryActive = NAVIGATION.slice(1).some(group => group.items.some(item => item.id === activeTab));
  return (
    <nav className="journal-tabs workspace-nav" aria-label="모험 도구와 기록">
      <div className="workspace-nav__primary">{renderItems(NAVIGATION[0])}</div>
      <details ref={moreRef} className={`workspace-nav__more${secondaryActive ? ' is-active' : ''}`}>
        <summary>자료 · 기록 <span aria-hidden="true">⌄</span></summary>
        <div className="workspace-nav__menu">
          {NAVIGATION.slice(1).map(group => <div key={group.id} role="group" aria-label={group.label}>
            <p>{group.label}</p>
            {renderItems(group)}
          </div>)}
          </div>
      </details>
    </nav>
  );
}

export function ChapterOpening({
  tab,
  state,
  maxCarry,
  onReturnToToday,
  onOpenReference
}: {
  tab: ChapterTab;
  state: any;
  maxCarry: number;
  onReturnToToday: () => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const journeyActive = getJourneyUiContext(state).active;
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId && row.status === 'active');
  const ailment = patient?.ailments?.find((row: any) => row.status === 'active');
  const legacyAilment = state.activeAilment;
  const patientName = patient?.name || legacyAilment?.patientName;
  const ailmentName = legacyAilment?.name || ailment?.legacyName;
  const journalCount = state.journals?.filter((row: any) => !isActivityJournalEntry(row)).length || 0;
  const caseCount = (state.patientArchive?.length || 0) + (state.patientCasebook?.length || 0);
  const discoveryCount = state.worldAlmanac?.length || 0;
  const bagCount = state.bag?.reduce((sum: number, item: any) => sum + (item.qty || 1), 0) || 0;

  const content: Record<ChapterTab, { kicker: string; title: string; body: string; notes: string[]; steps: string[] }> = {
    ailments: {
      kicker: patientName ? `현재 환자 · ${patientName}` : '치료에 필요한 정보',
      title: '병증 사전',
      body: ailmentName
        ? `${ailmentName}에 필요한 약효를 확인하고 모험 화면에서 채집과 조제를 이어가세요.`
        : patientName
          ? `${patientName}의 병증 이름은 아직 기록되지 않았습니다. 관찰을 이어가며 아래 병증 기록과 징후를 대조해보세요.`
          : '병증을 검색해 증상과 필요한 약효를 확인하세요. 환자를 만나면 모험 화면에서 치료를 진행합니다.',
      notes: [ailmentName || '병증 미기록', patient ? displayTimer(patient) : legacyAilment ? `${legacyAilment.timer}시간` : '기한 없음', localizeSeasonLabel(state.currentSeason)],
      steps: ['증상 확인', '필요 약효 찾기', '모험에서 치료']
    },
    reagents: {
      kicker: '치료 재료 찾기',
      title: '약초',
      body: '약효로 재료를 찾고 서식지·계절·채집 부위와 조제법을 확인하세요.',
      notes: [localizeSeasonLabel(state.currentSeason), `${localizeRegionLabel(state.currentRegion)} 관찰`, `${bagCount}점 소지`],
      steps: ['약효로 약재 찾기', '서식지·계절 확인', '채집 부위·조제법 확인']
    },
    bio: {
      kicker: '출발 전 채비',
      title: '배낭',
      body: '약재와 도구, 약제사와 길동무를 관리하세요. 짐이 소지 한도를 넘으면 이동 전에 정리합니다.',
      notes: [`이동 속도 ${state.bio?.speed ?? '미기록'} · 소지 한도 ${maxCarry}`, `길드 명성 ${state.reputation ?? 0} · 마친 계절 ${state.completedSeasons ?? 0}`, `${localizeSeasonLabel(state.currentSeason)} · 누적 ${state.cumulativeDays ?? 0}일`],
      steps: ['약제사·길동무 살피기', '약재와 도구 확인', '출발 전 짐 정리']
    },
    map: {
      kicker: '이동 경로 살피기',
      title: '세계 지도',
      body: `${localizeLocationName(state.currentLocationName) || '현재 위치'}에서 이어지는 길을 살펴보세요. 장소를 눌러 경로를 확인하고 모험 화면에서 이동합니다.`,
      notes: [localizeRegionLabel(state.currentRegion), `${state.visitedLocations?.length || 0}곳의 발자국`, journeyActive ? `${localizeLocationName(state.journeyDestination) || '목적지'}로 이동 중` : '머무르는 중'],
      steps: ['현재 위치 찾기', '연결된 길 확인', '모험에서 이동']
    },
    almanack: {
      kicker: '궁금한 것 찾아보기',
      title: '자료실',
      body: '병증·약재·도구·만남을 검색하고 쓰임과 조건, 관련 자료를 확인하세요.',
      notes: [`${discoveryCount}건의 발견`, localizeSeasonLabel(state.currentSeason), state.currentRegion ? localizeRegionLabel(state.currentRegion) : '전 지역'],
      steps: ['궁금한 이름 검색', '쓰임과 조건 읽기', '관련 기록 함께 보기']
    },
    patientArchive: {
      kicker: '만났던 환자들',
      title: '진료 기록',
      body: '지난 환자의 증상과 처방, 치료 결과와 남겨둔 기억을 다시 읽어보세요.',
      notes: [`${caseCount}건의 진료`, patientName ? `${patientName} 치료 중` : '현재 환자 없음', localizeLocationName(state.currentLocationName)],
      steps: ['지난 환자 찾기', '처방과 결과 돌아보기', '남겨둔 기억 다시 읽기']
    },
    livingArchive: {
      kicker: '여행에서 모은 것들',
      title: '발견',
      body: '관찰한 약초와 지나온 장소, 만남과 기념품을 살펴보고 연결된 기록으로 이동하세요.',
      notes: [`${discoveryCount}건의 관찰`, `${caseCount}건의 만남`, `${state.trinketArchive?.length || 0}개의 기념품`],
      steps: ['발견과 기념품 살피기', '기억 한 장 펼치기', '연결된 기록 돌아보기']
    },
    journals: {
      kicker: '당신이 남기는 이야기',
      title: '이야기',
      body: '오늘의 기억을 적고 지난 이야기를 읽어보세요. 여행 기록을 저장하거나 불러올 수도 있습니다.',
      notes: [`${journalCount}편의 일지`, localizeSeasonLabel(state.currentSeason), localizeLocationName(state.currentLocationName)],
      steps: ['오늘의 기억 적기', '지난 일지 돌아보기', '여행 기록 보관하기']
    }
  };

  const chapter = content[tab];
  return (
    <header className={`chapter-opening adventure-tool-heading chapter-opening--${tab}`} aria-labelledby={`chapter-title-${tab}`}>
      <div className="chapter-opening__plate" aria-hidden="true">
        <img className="chapter-opening__art" src={tab === 'reagents' || tab === 'ailments' || tab === 'livingArchive' ? '/art/botanical-endpaper.webp' : '/art/forest-folio.jpg'} alt="" />
        <span className="chapter-opening__seal">{CHAPTER_NUMBER[tab]}</span>
        <p className="folio-chapter-title">{CHAPTER_ENGLISH[tab]}</p>
        <span className="chapter-opening__flourish">✦</span>
      </div>
      <div className="chapter-opening__copy">
        <p className="chapter-opening__kicker">{chapter.kicker}</p>
        <h2 id={`chapter-title-${tab}`}>{chapter.title}</h2>
        <p className="chapter-opening__body">{chapter.body}</p>
        <ul className="chapter-opening__notes" aria-label="현재 기록 요약">
          {chapter.notes.slice(0, 2).map(note => <li key={note}>{note}</li>)}
        </ul>
        <div className="chapter-opening__actions">
        {tab === 'ailments' && patientName ? (
          <button type="button" onClick={onReturnToToday}>
            <span className="emoji-icon" aria-hidden="true">🧭</span> 모험에서 치료 이어가기
          </button>
        ) : null}
        <button type="button" className="chapter-opening__reference" onClick={() => onOpenReference(referenceForJournalTab(tab, state))}>
          <span className="emoji-icon" aria-hidden="true">🔎</span> 플레이 방법
        </button>
        <details className="chapter-opening__help">
          <summary>이 화면에서 하는 일</summary>
          <ol className="chapter-opening__flow">
            {chapter.steps.map(step => <li key={step}>{step}</li>)}
          </ol>
        </details>
        </div>
      </div>
      <span className="folio-divider" aria-hidden="true"><span>✦</span></span>
    </header>
  );
}

const displayTimer = (patient: any) => {
  const projection = getPatientTimerProjection({ patients: patient ? [patient] : [], activePatientId: patient?.id });
  return projection.shortestHours === null ? '기한 없음' : `${projection.shortestHours}시간`;
};

const requirementWords = (value: string) => value
  .split(/[,+/]|\s{2,}/)
  .map(word => word.trim())
  .filter(Boolean)
  .slice(0, 5);

export function TodayOverview({ state, currentWeight, maxCarry, onNavigate, onContinue, onOpenReference }: {
  state: any;
  currentWeight: number;
  maxCarry: number;
  onNavigate: (tab: JournalTab) => void;
  onContinue: () => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId && row.status === 'active');
  const ailment = patient?.ailments?.find((row: any) => row.status === 'active');
  const legacy = state.activeAilment;
  const timers = getPatientTimerProjection(state);
  const next = getCampaignNextAction(state);
  const journey = getJourneyUiContext(state);
  const calendar = readCalendarClocks(state);
  const requirements = requirementWords(legacy?.tags || ailment?.requirementSnapshot || '');
  const recent = journalEntriesNewestFirst<any>(state.journals || []).find((row: any) => !isActivityJournalEntry(row));
  const arrival = getPatientArrivalPreview(recent);
  const overCapacity = currentWeight > maxCarry;
  const sceneTitle = ({
    'journey-start': 'Where to next?', downtime: 'A little time to rest.', season: 'A new season.',
    patient: 'The art of care.', 'patient-expired': 'A difficult goodbye.',
    'foraging-remedy': 'The art of care.', 'barter-remedy': 'The art of care.',
    'treatment-reward': 'A little kindness.', 'local-help': 'A little kindness.',
    archive: 'The casebook.', manual: 'An unfinished story.', encounter: 'Along the way.',
    foraging: 'Among the leaves.', barter: 'A fair exchange.', scrounging: 'Among the leaves.',
    'journey-end': 'The journey, remembered.', delve: 'Beneath the woods.', chase: 'Find your way.', move: 'On the road.'
  } as Record<string, string>)[next.kind] || 'Field notes.';
  const facts = journey.active ? [
    { label: '여정 목적지', value: localizeLocationName(state.journeyDestination) || '미정' },
    { label: '여정 달력', value: `${calendar.calendarDays} / ${state.calendarMaxDays || 0}일` },
    { label: '남은 기한', value: `${Math.max(0, (state.calendarMaxDays || 0) - calendar.calendarDays)}일` },
    { label: '길드 명성', value: `${state.reputation || 0}` }
  ] : [
    { label: '누적 여행', value: `${calendar.cumulativeDays}일` },
    { label: '마친 계절', value: `${state.completedSeasons || 0}회` },
    { label: '길드 명성', value: `${state.reputation || 0}` }
  ];

  return <section className="workspace-today" aria-labelledby="today-title">
    <div className="workspace-today__main">
      <div className="workspace-today__context">
        <span className="workspace-kicker">{patient || legacy ? '오늘의 진료' : '길 위의 약제사'}</span>
        <span>{localizeLocationName(state.currentLocationName)} · {localizeSeasonLabel(state.currentSeason)}</span>
      </div>
      <p className="folio-scene-title" aria-hidden="true">{sceneTitle}</p>
      <h2 id="today-title">{next.title}</h2>
      <p className="workspace-today__reason">{next.reason}</p>
      <div className="workspace-today__actions">
        <button type="button" className="workspace-primary" onClick={onContinue}>{next.label}<span aria-hidden="true"> →</span></button>
        <button type="button" className="workspace-link" onClick={() => onOpenReference(next.reference)}>이 단계의 규칙</button>
      </div>
      {patient || legacy || overCapacity ? <div className="workspace-patient-strip" aria-label="현재 진료와 준비물">
        {patient || legacy ? <>
          <div><span>현재 환자</span><strong>{patient?.name || legacy?.patientName || '이름 없는 환자'}</strong><small>{legacy?.name || ailment?.legacyName || '병증 확인 중'}</small></div>
          {requirements.length > 0 && <div><span>필요 약효</span><strong className="workspace-patient-strip__tags">{requirements.map(value => value.replace(/\b[A-Z]+\b/g, formatRuleTag)).join(' · ')}</strong></div>}
          <div><span>가장 급한 치료 기한</span><strong className={timers.shortestHours === 0 ? 'is-urgent' : ''}>{timers.shortestHours === null ? '기한 없음' : `${timers.shortestHours}시간`}</strong>{timers.activeTimers.length > 1 && <small>{timers.activeTimers.length}개 기한을 각각 추적합니다</small>}</div>
        </> : null}
        {overCapacity && <div className="is-urgent"><span>배낭 한도 초과</span><strong>{currentWeight.toFixed(1)} / {maxCarry}</strong><button type="button" className="workspace-link" onClick={() => onNavigate('bio')}>짐 정리하기</button></div>}
      </div> : null}
    </div>
    <div className="workspace-today__atmosphere" aria-hidden="true">
      <img src="/art/forest-folio.jpg" alt="" />
      <span className="workspace-today__seal">01</span>
      <span className="workspace-today__flourish">✦</span>
      <span>The Bristley Woods<small>A travelling apothecary's journal</small></span>
    </div>
    <details className="workspace-session">
      <summary><span>{journey.active ? '여정과 남긴 기록' : '나의 여행 기록'}</span><span>{journey.active ? `${calendar.calendarDays} / ${state.calendarMaxDays || 0}일` : `${state.completedSeasons || 0}계절`}<span aria-hidden="true"> ＋</span></span></summary>
      <div className="workspace-session__body">
        <dl>{facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        {journey.active && state.journeyGoalTitle && <p><strong>이번 목표 · {state.journeyGoalTitle}</strong><br />{localizeJourneyGoalText(state.journeyGoalDesc || '')}</p>}
        {recent && <div><strong>{journalDisplayTitle(recent)}</strong>{arrival ? <dl className="workspace-arrival-preview"><div><dt>첫인상</dt><dd>{arrival.impression}</dd></div><div><dt>병증</dt><dd>{arrival.diagnosis}</dd></div></dl> : <p>{journalPreview(recent, 160)}</p>}<button type="button" className="workspace-link" onClick={() => onNavigate('journals')}>기록 펼치기 →</button></div>}
        <button type="button" className="workspace-link" onClick={() => onNavigate('map')}>세계 지도에서 보기 →</button>
      </div>
    </details>
  </section>;
}
