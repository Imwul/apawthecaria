import { lazy, Suspense, useEffect, useRef } from 'react';
import { localizeLocationName, localizeRegionLabel, localizeSavedJourneyText, localizeSeasonLabel } from '../localization/gameplayKo';
import { localizeGameplayMessage } from '../localization/engineMessagesKo';
import { referenceForJournalTab } from '../rulebook/context';
import type { RulebookReferenceRequest } from '../rulebook/types';
import { getCampaignContinuity } from '../campaignContinuity';
import type { JournalTab } from '../sessionNavigation';
import { isActivityJournalEntry, presentEncounterJournal } from '../encounterJournal';

export type { JournalTab } from '../sessionNavigation';

const LocalizedManualEffectText = lazy(() => import('./LocalizedManualEffectText'));

type ChapterTab = Exclude<JournalTab, 'play'>;

const NAVIGATION = [
  { id: 'play', label: '오늘의 여행', emoji: '📖' },
  { id: 'ailments', label: '진료 수첩', emoji: '🩺' },
  { id: 'reagents', label: '약초 도감', emoji: '🌿' },
  { id: 'bio', label: '배낭과 약제사', emoji: '🎒' },
  { id: 'map', label: '접어둔 지도', emoji: '🗺️' },
  { id: 'almanack', label: '자연사 색인', emoji: '📚' },
  { id: 'patientArchive', label: '환자 기록장', emoji: '🗂️' },
  { id: 'livingArchive', label: '표본과 기억', emoji: '🪻' },
  { id: 'journals', label: '들녘의 일지', emoji: '✒️' }
] as const;

export function JournalNavigation({ activeTab, onChange }: { activeTab: JournalTab; onChange: (tab: JournalTab) => void }) {
  const tabRefs = useRef<Partial<Record<JournalTab, HTMLButtonElement | null>>>({});

  useEffect(() => {
    tabRefs.current[activeTab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  return (
    <nav className="journal-tabs" aria-label="여행 일지 책갈피">
      {NAVIGATION.map((item, index) => {
        return (
          <button
            key={item.id}
            ref={node => { tabRefs.current[item.id] = node; }}
            type="button"
            className={`journal-tab journal-tab--${item.id} ${activeTab === item.id ? 'journal-tab--active' : ''}`}
            aria-current={activeTab === item.id ? 'page' : undefined}
            aria-label={`${String(index + 1).padStart(2, '0')} ${item.label}`}
            title={item.label}
            onClick={() => onChange(item.id)}
          >
            <span className="journal-tab__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className="journal-tab__emoji emoji-icon" aria-hidden="true">{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const CHAPTER_EMOJIS = {
  ailments: '🩺',
  reagents: '🌿',
  bio: '🎒',
  map: '🗺️',
  almanack: '📚',
  patientArchive: '🗂️',
  livingArchive: '🪻',
  journals: '✒️'
};

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
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId && row.status === 'active');
  const ailment = patient?.ailments?.find((row: any) => row.status === 'active');
  const legacyAilment = state.activeAilment;
  const patientName = patient?.name || legacyAilment?.patientName;
  const ailmentName = legacyAilment?.name || ailment?.legacyName;
  const journalCount = state.journals?.filter((row: any) => !isActivityJournalEntry(row.title)).length || 0;
  const caseCount = state.patientArchive?.length || state.patientCasebook?.length || 0;
  const discoveryCount = state.worldAlmanac?.length || 0;
  const bagCount = state.bag?.reduce((sum: number, item: any) => sum + (item.qty || 1), 0) || 0;

  const content: Record<ChapterTab, { kicker: string; title: string; body: string; notes: string[] }> = {
    ailments: {
      kicker: patientName ? `현재 환자 · ${patientName}` : '진료 메모',
      title: patientName ? `${patientName}의 진료 수첩` : '진료 수첩',
      body: ailmentName
        ? `${ailmentName}의 징후와 필요한 약효를 차분히 대조합니다. 아래 병증 기록은 현재 처방을 위한 참고 페이지입니다.`
        : patientName
          ? `${patientName}의 병증 이름은 아직 기록되지 않았습니다. 관찰을 이어가며 아래 병증 기록과 징후를 대조해보세요.`
          : '아직 기다리는 환자는 없습니다. 길 위에서 누군가를 만나면 증상과 관찰, 처방의 순서가 이곳에 이어집니다.',
      notes: [ailmentName || '병증 미기록', patient ? displayTimer(patient) : legacyAilment ? `${legacyAilment.timer}시간` : '기한 없음', localizeSeasonLabel(state.currentSeason)]
    },
    reagents: {
      kicker: '약재 기록',
      title: '약초 도감',
      body: `${localizeRegionLabel(state.currentRegion)}에서 만날 수 있는 잎과 뿌리, 꽃과 균류의 쓰임을 기록합니다. 이름보다 생김새와 조제법을 먼저 읽어보세요.`,
      notes: [localizeSeasonLabel(state.currentSeason), `${localizeRegionLabel(state.currentRegion)} 관찰`, `${bagCount}점 소지`]
    },
    bio: {
      kicker: '여행 채비',
      title: '배낭과 약제사',
      body: '여행 도구와 길동무, 모아둔 약재를 한데 펼쳐보고 다음 걸음을 준비하는 페이지입니다.',
      notes: [`속도 ${state.bio?.speed ?? '미기록'} · 소지 ${maxCarry}`, `평판 ${state.reputation ?? 0} · 마친 계절 ${state.completedSeasons ?? 0}`, `${localizeSeasonLabel(state.currentSeason)} · 누적 ${state.cumulativeDays ?? 0}일`]
    },
    map: {
      kicker: '지도 기록',
      title: '접어둔 지도',
      body: `${localizeLocationName(state.currentLocationName) || '이름 없는 길목'}에서 시작해 지나온 숲과 아직 걷지 않은 길을 함께 펼칩니다.`,
      notes: [localizeRegionLabel(state.currentRegion), `${state.visitedLocations?.length || 0}곳의 발자국`, state.journeyActive ? `${localizeLocationName(state.journeyDestination) || '목적지'}로 이동 중` : '머무르는 중']
    },
    almanack: {
      kicker: '들녘의 참고 기록',
      title: '자연사 색인',
      body: '병증, 약재, 도구와 길 위의 만남을 서로 대조해 읽는 자연사 색인입니다. 필요한 말에서 시작해 관련 기록으로 천천히 건너가세요.',
      notes: [`${discoveryCount}건의 발견`, localizeSeasonLabel(state.currentSeason), state.currentRegion ? localizeRegionLabel(state.currentRegion) : '전 지역']
    },
    patientArchive: {
      kicker: '진료 기록철',
      title: '환자 기록장',
      body: '만났던 이의 첫인상과 병색, 건넨 처방과 그 뒤의 이야기를 한 사람씩 다시 읽습니다.',
      notes: [`${caseCount}건의 진료`, patientName ? `${patientName} 치료 중` : '현재 환자 없음', localizeLocationName(state.currentLocationName)]
    },
    livingArchive: {
      kicker: '압화한 기억',
      title: '표본과 기억',
      body: '길에서 주운 작은 발견과 오래 남겨두고 싶은 기억을 압화 표본처럼 한 장씩 모았습니다.',
      notes: [`${discoveryCount}건의 관찰`, `${caseCount}건의 만남`, `${state.trinketArchive?.length || 0}개의 기념품`]
    },
    journals: {
      kicker: '계절의 기억',
      title: '들녘의 일지',
      body: '하루의 사건을 숫자로 세지 않고 문장으로 남기는 곳입니다. 계절과 장소를 따라 지난 여행을 다시 읽어보세요.',
      notes: [`${journalCount}편의 일지`, localizeSeasonLabel(state.currentSeason), localizeLocationName(state.currentLocationName)]
    }
  };

  const chapter = content[tab];
  const chapterEmoji = CHAPTER_EMOJIS[tab];

  return (
    <header className={`chapter-opening chapter-opening--${tab}`} aria-labelledby={`chapter-title-${tab}`}>
      <span className="chapter-opening__mark emoji-icon" aria-hidden="true">{chapterEmoji}</span>
      <span className="chapter-opening__folio" aria-hidden="true">들녘 기록 / {String(NAVIGATION.findIndex(item => item.id === tab) + 1).padStart(2, '0')}</span>
      <div className="chapter-opening__copy">
        <p className="chapter-opening__kicker">{chapter.kicker}</p>
        <h2 id={`chapter-title-${tab}`}>{chapter.title}</h2>
        <p className="chapter-opening__body">{chapter.body}</p>
        <ul className="chapter-opening__notes" aria-label="현재 기록 요약">
          {chapter.notes.map(note => <li key={note}>{note}</li>)}
        </ul>
        {tab === 'ailments' && patientName ? (
          <button type="button" onClick={onReturnToToday}>
            <span className="emoji-icon" aria-hidden="true">📖</span> 현재 진료로 돌아가기
          </button>
        ) : null}
        <button type="button" className="chapter-opening__reference" onClick={() => onOpenReference(referenceForJournalTab(tab, state))}>
          <span className="emoji-icon" aria-hidden="true">📚</span> 이 장의 룰북 맥락
        </button>
      </div>
    </header>
  );
}

const displayTimer = (patient: any) => {
  const active = patient?.timers?.filter((timer: any) => timer.status === 'active') || [];
  return active.length ? `${Math.min(...active.map((timer: any) => timer.current))}시간` : '기한 없음';
};

const requirementWords = (value: string) => value
  .split(/[,+/]|\s{2,}/)
  .map(word => word.trim())
  .filter(Boolean)
  .slice(0, 5);

export function TodayOverview({
  state,
  currentWeight,
  maxCarry,
  onNavigate,
  onContinue,
  onOpenReference
}: {
  state: any;
  currentWeight: number;
  maxCarry: number;
  onNavigate: (tab: JournalTab) => void;
  onContinue: () => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId);
  const ailment = patient?.ailments?.find((row: any) => row.status === 'active');
  const legacyAilment = state.activeAilment;
  const ailmentName = legacyAilment?.name || ailment?.legacyName || '살펴볼 병증이 없습니다';
  const requirements = requirementWords(legacyAilment?.tags || ailment?.requirementSnapshot || '');
  const recentJournal = state.journals?.find((row: any) => !isActivityJournalEntry(row.title));
  const recentJournalPresentation = recentJournal
    ? presentEncounterJournal(recentJournal.title, recentJournal.text)
    : null;
  const recentJournalText = recentJournal ? localizeSavedJourneyText(recentJournal.text) : '';
  const recentJournalSummary = recentJournal?.title.startsWith('새 환자:')
    ? (() => {
        const [impression = '', diagnosis = ''] = recentJournalText.split('\n').filter(Boolean);
        const cleanImpression = impression.replace(/^첫인상:\s*/, '');
        const cleanDiagnosis = diagnosis.replace(/^병증:\s*/, '');
        return [`첫인상: ${cleanImpression}`, cleanDiagnosis ? `병증: ${cleanDiagnosis}` : ''].filter(Boolean).join('\n');
      })()
    : recentJournalText;
  const continuity = getCampaignContinuity(state);
  const recentTimeChanges = (state.calendarHistory || []).slice(-2).reverse();
  const dayPlace = localizeLocationName(state.currentLocationName) || '현재 위치 미기록';
  const dayPhrase = state.journeyActive ? '여정을 이어가는 날' : '이곳에 머무는 날';
  const continuityFacts = state.journeyActive
    ? [
        { label: '여정 목적지', value: localizeLocationName(state.journeyDestination) || '미정' },
        { label: '여정 경과', value: `${Math.max(0, state.calendarDays || 0)} / ${Math.max(0, state.calendarMaxDays || 0)}일` },
        { label: '남은 기한', value: `${Math.max(0, (state.calendarMaxDays || 0) - (state.calendarDays || 0))}일` },
        { label: '누적 경과', value: `${Math.max(0, state.cumulativeDays || 0)}일` },
        { label: '길드 평판', value: `${Math.max(0, state.reputation || 0)}` }
      ]
    : [
        { label: '누적 경과', value: `${Math.max(0, state.cumulativeDays || 0)}일` },
        { label: '마친 계절', value: `${Math.max(0, state.completedSeasons || 0)}회` },
        { label: '길드 평판', value: `${Math.max(0, state.reputation || 0)}` }
      ];
  const isOverCapacity = currentWeight > maxCarry;
  const hasResumeContext = Boolean(patient || legacyAilment || requirements.length || isOverCapacity || recentJournal);

  return (
    <section className="today-overview" aria-labelledby="today-title">
      <div className="today-focus">
      <div className="today-scene">
        <span className="today-scene__mark emoji-icon" aria-hidden="true">🧭</span>
        <span className="today-scene__folio" aria-hidden="true">들녘 기록 / 01</span>
        <div className="today-scene__copy">
          <span className="today-scene__season"><span className="emoji-icon" aria-hidden="true">🌤️</span> {localizeSeasonLabel(state.currentSeason)}</span>
          <p>오늘의 들녘 기록</p>
          <h2 id="today-title">
            <span className="today-title__place">{dayPlace}</span>
            <span className="today-title__phrase">{dayPhrase}</span>
          </h2>
          <div className="today-scene__actions">
            <button
              type="button"
              onClick={onContinue}
              aria-label={`${continuity.continueLabel}. ${continuity.nextAction}`}
              title={continuity.guidance}
            >
              <span className="emoji-icon" aria-hidden="true">🧭</span> {continuity.continueLabel}
            </button>
            <button
              type="button"
              className="today-scene__map-preview"
              onClick={() => document.getElementById('play-journey-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <span className="emoji-icon" aria-hidden="true">🗺️</span> 지도에 짚어보기
            </button>
            <button type="button" className="today-scene__reference" onClick={() => onOpenReference(referenceForJournalTab('play', state))}>
              <span className="emoji-icon" aria-hidden="true">📚</span> 현재 절차 확인
            </button>
          </div>
        </div>
      </div>

      <section className={`campaign-continuity campaign-continuity--${continuity.stage}`} aria-labelledby="campaign-continuity-title">
        <div className="campaign-continuity__heading">
          <div>
            <span className="journal-note-label">캠페인 이어보기</span>
            <h3 id="campaign-continuity-title">{continuity.label}</h3>
          </div>
          <span className="campaign-continuity__season">{localizeSeasonLabel(state.currentSeason)}</span>
        </div>
        <dl className="campaign-continuity__facts">
          {continuityFacts.map(fact => (
            <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
        <p className="campaign-continuity__guidance">
          <strong>{continuity.nextAction}</strong>
          <span>{continuity.guidance}</span>
        </p>
        {recentTimeChanges.length > 0 ? (
          <details className="campaign-continuity__history">
            <summary>최근 시간 변화 {recentTimeChanges.length}건</summary>
            <ol>{recentTimeChanges.map((line: string, index: number) => <li key={`${line}:${index}`}>{line}</li>)}</ol>
          </details>
        ) : null}
      </section>
      </div>

      {hasResumeContext ? <div className="today-story today-story--resume" aria-label="다시 시작할 때 필요한 맥락">
        {patient || legacyAilment ? (
        <article className="today-patient">
          <span className="journal-note-label">오늘 돌볼 이</span>
          <h3>{patient?.name || legacyAilment?.patientName || '이름 없는 환자'}</h3>
          <p>{patient?.species || legacyAilment?.species || '종 미기록'}</p>
          <dl>
            <div><dt>병증</dt><dd>{ailmentName}</dd></div>
            <div><dt>남은 시간</dt><dd>{patient ? displayTimer(patient) : `${legacyAilment.timer}시간`}</dd></div>
          </dl>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('ailments')}>
            <span className="emoji-icon" aria-hidden="true">🩺</span> 진료 수첩 펼치기
          </button>
        </article>
        ) : null}

        {requirements.length ? (
        <article className="today-herbs">
          <span className="journal-note-label">찾아야 할 약초</span>
          <h3>처방에 필요한 기운</h3>
          <ul>{requirements.map(word => <li key={word}>{word}</li>)}</ul>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('reagents')}>
            <span className="emoji-icon" aria-hidden="true">🌿</span> 약초 도감 살피기
          </button>
        </article>
        ) : null}

        {isOverCapacity ? (
        <article className="today-bag">
          <span className="journal-note-label">이동 전 확인</span>
          <h3>가방 한도 초과 · {currentWeight.toFixed(1)} / {maxCarry}</h3>
          <p>영약재 {state.bag?.filter((item: any) => item.type === 'reagent').length || 0} · 도구 {state.bag?.filter((item: any) => item.type === 'tool').length || 0}</p>
          <div className="today-bag__line"><span style={{ width: `${Math.min(100, (currentWeight / Math.max(1, maxCarry)) * 100)}%` }} /></div>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('bio')}>
            <span className="emoji-icon" aria-hidden="true">🎒</span> 배낭 정리하기
          </button>
        </article>
        ) : null}

        {recentJournal ? (
        <article className="today-journal">
          <span className="journal-note-label">최근에 남긴 기록</span>
          <h3><Suspense fallback={localizeGameplayMessage(recentJournal.title)}><LocalizedManualEffectText kind="journal-title" text={recentJournal.title} /></Suspense></h3>
          <p className="today-journal__summary">{recentJournal.text ? (
            recentJournalPresentation?.isEncounter
              ? recentJournalPresentation.memory
              : <Suspense fallback={localizeGameplayMessage(recentJournalSummary).slice(0, 180)}><LocalizedManualEffectText kind="journal-text" text={recentJournalSummary} maxLength={180} /></Suspense>
          ) : '남긴 내용이 없습니다.'}</p>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('journals')}>
            <span className="emoji-icon" aria-hidden="true">✒️</span> 지난 기록 읽기
          </button>
        </article>
        ) : null}
      </div> : null}
    </section>
  );
}
