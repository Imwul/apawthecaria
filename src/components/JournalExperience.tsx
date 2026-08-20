import { lazy, Suspense } from 'react';
import { localizeLocationName, localizeLocationTypeLabel, localizeRegionLabel, localizeSavedJourneyText } from '../localization/gameplayKo';
import { localizeGameplayMessage } from '../localization/engineMessagesKo';
import { referenceForJournalTab } from '../rulebook/context';
import type { RulebookReferenceRequest } from '../rulebook/types';
import { getCampaignContinuity } from '../campaignContinuity';

const LocalizedManualEffectText = lazy(() => import('./LocalizedManualEffectText'));

export type JournalTab = 'play' | 'bio' | 'reagents' | 'ailments' | 'almanack' | 'patientArchive' | 'livingArchive' | 'map' | 'journals';

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
  return (
    <nav className="journal-tabs" aria-label="여행 일지 책갈피">
      {NAVIGATION.map((item, index) => {
        return (
          <button
            key={item.id}
            type="button"
            className={`journal-tab journal-tab--${item.id} ${activeTab === item.id ? 'journal-tab--active' : ''}`}
            aria-current={activeTab === item.id ? 'page' : undefined}
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

const seasonLabel = (season: string | undefined) => ({ Spring: '봄', Summer: '여름', Autumn: '가을', Winter: '겨울' } as Record<string, string>)[season || ''] || season || '계절 미기록';

export function ChapterOpening({
  tab,
  state,
  currentWeight,
  maxCarry,
  onReturnToToday,
  onOpenReference
}: {
  tab: ChapterTab;
  state: any;
  currentWeight: number;
  maxCarry: number;
  onReturnToToday: () => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId && row.status === 'active');
  const ailment = patient?.ailments?.find((row: any) => row.status === 'active');
  const legacyAilment = state.activeAilment;
  const patientName = patient?.name || legacyAilment?.patientName;
  const ailmentName = legacyAilment?.name || ailment?.legacyName;
  const journalCount = state.journals?.length || 0;
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
      notes: [ailmentName || '병증 미기록', patient ? displayTimer(patient) : legacyAilment ? `${legacyAilment.timer}시간` : '기한 없음', seasonLabel(state.currentSeason)]
    },
    reagents: {
      kicker: '약재 기록',
      title: '약초 도감',
      body: `${localizeRegionLabel(state.currentRegion)}에서 만날 수 있는 잎과 뿌리, 꽃과 균류의 쓰임을 기록합니다. 이름보다 생김새와 조제법을 먼저 읽어보세요.`,
      notes: [seasonLabel(state.currentSeason), `${localizeRegionLabel(state.currentRegion)} 관찰`, `${bagCount}점 소지`]
    },
    bio: {
      kicker: '여행 채비',
      title: '배낭과 약제사',
      body: '여행 도구와 길동무, 모아둔 약재를 한데 펼쳐보고 다음 걸음을 준비하는 페이지입니다.',
      notes: [`속도 ${state.bio?.speed ?? '미기록'} · 소지 ${maxCarry}`, `평판 ${state.reputation ?? 0} · 마친 계절 ${state.completedSeasons ?? 0}`, `${seasonLabel(state.currentSeason)} · 누적 ${state.cumulativeDays ?? 0}일`]
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
      notes: [`${discoveryCount}건의 발견`, seasonLabel(state.currentSeason), state.currentRegion ? localizeRegionLabel(state.currentRegion) : '전 지역']
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
      notes: [`${journalCount}편의 일지`, seasonLabel(state.currentSeason), localizeLocationName(state.currentLocationName)]
    }
  };

  const chapter = content[tab];
  const chapterEmoji = CHAPTER_EMOJIS[tab];

  return (
    <header className={`chapter-opening chapter-opening--${tab}`} aria-labelledby={`chapter-title-${tab}`}>
      <span className="chapter-opening__mark emoji-icon" aria-hidden="true">{chapterEmoji}</span>
      <span className="chapter-opening__folio" aria-hidden="true">FIELD NOTE / {String(NAVIGATION.findIndex(item => item.id === tab) + 1).padStart(2, '0')}</span>
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
  const recentJournal = state.journals?.[0];
  const continuity = getCampaignContinuity(state);
  const recentTimeChanges = (state.calendarHistory || []).slice(-2).reverse();
  const dayPlace = state.journeyActive
    ? localizeLocationName(state.journeyDestination || '다음 마을')
    : localizeLocationName(state.currentLocationName);
  const dayPhrase = state.journeyActive ? '목적지를 향해 걷는 날' : '이곳에 머무는 날';

  return (
    <section className="today-overview" aria-labelledby="today-title">
      <div className="today-scene">
        <span className="today-scene__mark emoji-icon" aria-hidden="true">🧭</span>
        <span className="today-scene__folio" aria-hidden="true">FIELD NOTE / 01</span>
        <div className="today-scene__copy">
          <span className="today-scene__season"><span className="emoji-icon" aria-hidden="true">🌤️</span> {seasonLabel(state.currentSeason)}</span>
          <p>오늘의 들녘 기록</p>
          <h2 id="today-title">
            <span className="today-title__place">{dayPlace}</span>
            <span className="today-title__phrase">{dayPhrase}</span>
          </h2>
          <div className="today-scene__actions">
            <button type="button" onClick={onContinue}>
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
          <span className="campaign-continuity__season">{seasonLabel(state.currentSeason)}</span>
        </div>
        <dl className="campaign-continuity__facts">
          <div><dt>현재 위치</dt><dd>{localizeLocationName(state.currentLocationName)}</dd></div>
          <div><dt>누적 경과</dt><dd>{Math.max(0, state.cumulativeDays || 0)}일</dd></div>
          <div><dt>마친 계절</dt><dd>{Math.max(0, state.completedSeasons || 0)}회</dd></div>
          <div><dt>길드 평판</dt><dd>{Math.max(0, state.reputation || 0)}</dd></div>
        </dl>
        <div className="campaign-continuity__next">
          <span>다음 단계</span>
          <strong>{continuity.nextAction}</strong>
          <p>{continuity.guidance}</p>
        </div>
        {recentTimeChanges.length > 0 ? (
          <details className="campaign-continuity__history">
            <summary>최근 시간 변화 {recentTimeChanges.length}건</summary>
            <ol>{recentTimeChanges.map((line: string, index: number) => <li key={`${line}:${index}`}>{line}</li>)}</ol>
          </details>
        ) : (
          <p className="campaign-continuity__empty">아직 기록된 시간 변화가 없습니다. Move나 수동 달력 보정이 생기면 여기에 남습니다.</p>
        )}
      </section>

      <div className="today-story">
        <article className="today-patient">
          <span className="journal-note-label">오늘 돌볼 이</span>
          <h3>{patient?.name || legacyAilment?.patientName || '아직 찾아온 환자가 없습니다'}</h3>
          <p>{patient?.species || legacyAilment?.species || '새 여정에서 누군가를 만나게 될 거예요.'}</p>
          {patient || legacyAilment ? (
            <dl>
              <div><dt>병증</dt><dd>{ailmentName}</dd></div>
              <div><dt>남은 시간</dt><dd>{patient ? displayTimer(patient) : `${legacyAilment.timer}시간`}</dd></div>
            </dl>
          ) : null}
          <button type="button" className="journal-text-action" onClick={() => onNavigate('ailments')}>
            <span className="emoji-icon" aria-hidden="true">🩺</span> 진료 수첩 펼치기
          </button>
        </article>

        <article className="today-herbs">
          <span className="journal-note-label">찾아야 할 약초</span>
          <h3>{requirements.length ? '처방에 필요한 기운' : '오늘의 채집 목록'}</h3>
          {requirements.length ? (
            <ul>{requirements.map(word => <li key={word}>{word}</li>)}</ul>
          ) : (
            <p>환자를 만나면 필요한 효능이 이곳에 적힙니다.</p>
          )}
          <button type="button" className="journal-text-action" onClick={() => onNavigate('reagents')}>
            <span className="emoji-icon" aria-hidden="true">🌿</span> 약초 도감 살피기
          </button>
        </article>

        <article className="today-place">
          <span className="journal-note-label">지금 머무는 곳</span>
          <h3>{localizeLocationName(state.currentLocationName)}</h3>
          <p>{localizeRegionLabel(state.currentRegion)} · {localizeLocationTypeLabel(state.currentLocationType)} · {seasonLabel(state.currentSeason)}</p>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('map')}>
            <span className="emoji-icon" aria-hidden="true">🗺️</span> 지도에 짚어보기
          </button>
        </article>

        <article className="today-bag">
          <span className="journal-note-label">펼쳐둔 배낭</span>
          <h3>{currentWeight.toFixed(1)} / {maxCarry}</h3>
          <p>영약재 {state.bag?.filter((item: any) => item.type === 'reagent').length || 0} · 도구 {state.bag?.filter((item: any) => item.type === 'tool').length || 0}</p>
          <div className="today-bag__line"><span style={{ width: `${Math.min(100, (currentWeight / Math.max(1, maxCarry)) * 100)}%` }} /></div>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('bio')}>
            <span className="emoji-icon" aria-hidden="true">🎒</span> 배낭 정리하기
          </button>
        </article>

        <article className="today-journal">
          <span className="journal-note-label">가장 최근의 문장</span>
          <h3>{recentJournal?.title ? <Suspense fallback={localizeGameplayMessage(recentJournal.title)}><LocalizedManualEffectText kind="journal-title" text={localizeGameplayMessage(recentJournal.title)} /></Suspense> : '아직 적힌 이야기가 없습니다'}</h3>
          <p>{recentJournal?.text ? <Suspense fallback={localizeGameplayMessage(localizeSavedJourneyText(recentJournal.text)).slice(0, 180)}><LocalizedManualEffectText kind="journal-text" text={localizeGameplayMessage(localizeSavedJourneyText(recentJournal.text))} maxLength={180} /></Suspense> : '첫 여행을 떠나면 이곳에 작은 기억이 남습니다.'}</p>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('journals')}>
            <span className="emoji-icon" aria-hidden="true">✒️</span> 지난 기록 읽기
          </button>
        </article>
      </div>
    </section>
  );
}
