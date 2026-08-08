import {
  Backpack,
  BookHeart,
  BookOpen,
  Compass,
  Feather,
  Flower2,
  Images,
  LibraryBig,
  Map,
  NotebookTabs,
  Stethoscope,
  SunMedium,
  UserRound
} from 'lucide-react';

export type JournalTab = 'play' | 'bio' | 'reagents' | 'ailments' | 'almanack' | 'patientArchive' | 'livingArchive' | 'map' | 'journals';

type ChapterTab = Exclude<JournalTab, 'play'>;

type ChapterArtwork = {
  src: string;
  alt: string;
  credit: string;
  source: string;
  tone: 'dark' | 'light';
  position?: string;
};

const NAVIGATION = [
  { id: 'play', label: '오늘의 여행', icon: BookOpen },
  { id: 'ailments', label: '진료 수첩', icon: Stethoscope },
  { id: 'reagents', label: '약초 도감', icon: Flower2 },
  { id: 'bio', label: '배낭과 약제사', icon: Backpack },
  { id: 'map', label: '접어둔 지도', icon: Map },
  { id: 'almanack', label: 'Almanack', icon: LibraryBig },
  { id: 'patientArchive', label: '환자 기록장', icon: BookHeart },
  { id: 'livingArchive', label: '표본과 기억', icon: Images },
  { id: 'journals', label: '들녘의 일지', icon: Feather }
] as const;

export function JournalNavigation({ activeTab, onChange }: { activeTab: JournalTab; onChange: (tab: JournalTab) => void }) {
  return (
    <nav className="journal-tabs" aria-label="여행 일지 책갈피">
      {NAVIGATION.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`journal-tab ${activeTab === item.id ? 'journal-tab--active' : ''}`}
            aria-current={activeTab === item.id ? 'page' : undefined}
            title={item.label}
            onClick={() => onChange(item.id)}
          >
            <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const CHAPTER_ART: Record<ChapterTab, ChapterArtwork> = {
  ailments: {
    src: '/art/apothecary-bottles.jpg',
    alt: '오래된 약병이 놓인 19세기 약방 선반',
    credit: 'Apothecary bottles · France3470 · Public Domain',
    source: 'https://commons.wikimedia.org/wiki/File:Apothecarybottles.jpg',
    tone: 'dark',
    position: 'center 58%'
  },
  reagents: {
    src: '/art/medicinal-sage.jpg',
    alt: '1887년 약용 세이지 자연사 도판',
    credit: 'Salvia officinalis, 1887 · BHL · Public Domain',
    source: "https://commons.wikimedia.org/wiki/File:K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_(Plate_38)_BHL303638.jpg",
    tone: 'light',
    position: 'center 42%'
  },
  bio: {
    src: '/art/apothecary-bottles.jpg',
    alt: '여행용 약병을 떠올리게 하는 오래된 약방 선반',
    credit: 'Apothecary bottles · France3470 · Public Domain',
    source: 'https://commons.wikimedia.org/wiki/File:Apothecarybottles.jpg',
    tone: 'dark',
    position: 'center 52%'
  },
  map: {
    src: '/art/forest-1891.jpg',
    alt: '길이 이어지는 고요한 숲의 수채화',
    credit: 'Forest, 1891 · Smithsonian CC0',
    source: 'https://www.si.edu/object/forest%3Achndm_1948-47-6',
    tone: 'dark',
    position: 'center 38%'
  },
  almanack: {
    src: '/art/medicinal-sage.jpg',
    alt: '꽃과 잎의 세부가 기록된 약용 식물 도판',
    credit: 'Salvia officinalis, 1887 · BHL · Public Domain',
    source: "https://commons.wikimedia.org/wiki/File:K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_(Plate_38)_BHL303638.jpg",
    tone: 'light',
    position: 'center 53%'
  },
  patientArchive: {
    src: '/art/woodland-patients.jpg',
    alt: '정원에서 함께 일하는 토끼 가족의 수채화 삽화',
    credit: 'Peter Rabbit and the Flopsy Bunnies, 1909 · Beatrix Potter · Public Domain',
    source: 'https://commons.wikimedia.org/wiki/File:Peter_rabbit_flopsy_bunnies.jpg',
    tone: 'light',
    position: 'center 48%'
  },
  livingArchive: {
    src: '/art/herbarium-specimen.jpg',
    alt: '종이 위에 고정해 기록한 푸른 꽃의 식물 표본',
    credit: 'Herbarium specimen · GeorgieMcD · CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Herbarium_specimen.jpg',
    tone: 'light',
    position: 'center 28%'
  },
  journals: {
    src: '/art/herbarium-specimen.jpg',
    alt: '여행 중 눌러 말려둔 듯한 푸른 꽃의 표본',
    credit: 'Herbarium specimen · GeorgieMcD · CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Herbarium_specimen.jpg',
    tone: 'light',
    position: 'center 20%'
  }
};

const seasonLabel = (season: string | undefined) => season || '계절 미기록';

export function ChapterOpening({
  tab,
  state,
  currentWeight,
  maxCarry,
  onReturnToToday
}: {
  tab: ChapterTab;
  state: any;
  currentWeight: number;
  maxCarry: number;
  onReturnToToday: () => void;
}) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId);
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
      kicker: patientName ? `현재 환자 · ${patientName}` : 'Clinic notes',
      title: patientName ? `${patientName}의 진료 수첩` : '진료 수첩',
      body: ailmentName
        ? `${ailmentName}의 징후와 필요한 약효를 차분히 대조합니다. 아래 병증 기록은 현재 처방을 위한 참고 페이지입니다.`
        : patientName
          ? `${patientName}의 병증 이름은 아직 기록되지 않았습니다. 관찰을 이어가며 아래 병증 기록과 징후를 대조해보세요.`
          : '아직 기다리는 환자는 없습니다. 길 위에서 누군가를 만나면 증상과 관찰, 처방의 순서가 이곳에 이어집니다.',
      notes: [ailmentName || '병증 미기록', patient ? displayTimer(patient) : legacyAilment ? `${legacyAilment.timer}시간` : '기한 없음', seasonLabel(state.currentSeason)]
    },
    reagents: {
      kicker: 'Materia medica',
      title: '약초 도감',
      body: `${state.currentRegion || '들녘'}에서 만날 수 있는 잎과 뿌리, 꽃과 균류의 쓰임을 기록합니다. 이름보다 생김새와 조제법을 먼저 읽어보세요.`,
      notes: [seasonLabel(state.currentSeason), `${state.currentRegion || '지역 미기록'} 관찰`, `${bagCount}점 소지`]
    },
    bio: {
      kicker: 'Travelling kit',
      title: '배낭과 약제사',
      body: '여행 도구와 길동무, 모아둔 약재를 한데 펼쳐보고 다음 걸음을 준비하는 페이지입니다.',
      notes: [`${currentWeight.toFixed(1)} / ${maxCarry} 무게`, state.bio?.familiarName ? `길동무 ${state.bio.familiarName}` : '길동무 미기록', seasonLabel(state.currentSeason)]
    },
    map: {
      kicker: 'Cartographer’s leaf',
      title: '접어둔 지도',
      body: `${state.currentLocationName || '이름 없는 길목'}에서 시작해 지나온 숲과 아직 걷지 않은 길을 함께 펼칩니다.`,
      notes: [state.currentRegion || '지역 미기록', `${state.visitedLocations?.length || 0}곳의 발자국`, state.journeyActive ? `${state.journeyDestination || '목적지'}로 이동 중` : '머무르는 중']
    },
    almanack: {
      kicker: 'Natural history index',
      title: 'Almanack',
      body: '병증, 약재, 도구와 길 위의 만남을 서로 대조해 읽는 자연사 색인입니다. 필요한 말에서 시작해 관련 기록으로 천천히 건너가세요.',
      notes: [`${discoveryCount}건의 발견`, seasonLabel(state.currentSeason), state.currentRegion || '전 지역']
    },
    patientArchive: {
      kicker: 'Casebook',
      title: '환자 기록장',
      body: '만났던 이의 첫인상과 병색, 건넨 처방과 그 뒤의 이야기를 한 사람씩 다시 읽습니다.',
      notes: [`${caseCount}건의 진료`, patientName ? `${patientName} 치료 중` : '현재 환자 없음', state.currentLocationName || '위치 미기록']
    },
    livingArchive: {
      kicker: 'Pressed memories',
      title: '표본과 기억',
      body: '길에서 주운 작은 발견과 오래 남겨두고 싶은 기억을 압화 표본처럼 한 장씩 모았습니다.',
      notes: [`${discoveryCount}건의 관찰`, `${caseCount}건의 만남`, `${state.trinketArchive?.length || 0}개의 기념품`]
    },
    journals: {
      kicker: 'Seasons remembered',
      title: '들녘의 일지',
      body: '하루의 사건을 숫자로 세지 않고 문장으로 남기는 곳입니다. 계절과 장소를 따라 지난 여행을 다시 읽어보세요.',
      notes: [`${journalCount}편의 일지`, seasonLabel(state.currentSeason), state.currentLocationName || '위치 미기록']
    }
  };

  const art = CHAPTER_ART[tab];
  const chapter = content[tab];

  return (
    <header className={`chapter-opening chapter-opening--${art.tone} chapter-opening--${tab}`} aria-labelledby={`chapter-title-${tab}`}>
      <img src={art.src} alt={art.alt} style={{ objectPosition: art.position }} />
      <div className="chapter-opening__copy">
        <p className="chapter-opening__kicker">{chapter.kicker}</p>
        <h2 id={`chapter-title-${tab}`}>{chapter.title}</h2>
        <p className="chapter-opening__body">{chapter.body}</p>
        <ul className="chapter-opening__notes" aria-label="현재 기록 요약">
          {chapter.notes.map(note => <li key={note}>{note}</li>)}
        </ul>
        {tab === 'ailments' && patientName ? (
          <button type="button" onClick={onReturnToToday}>
            <BookOpen aria-hidden="true" size={17} /> 현재 진료로 돌아가기
          </button>
        ) : null}
      </div>
      <a className="chapter-opening__credit" href={art.source} target="_blank" rel="noreferrer">{art.credit}</a>
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
  onContinue
}: {
  state: any;
  currentWeight: number;
  maxCarry: number;
  onNavigate: (tab: JournalTab) => void;
  onContinue: () => void;
}) {
  const patient = state.patients?.find((row: any) => row.id === state.activePatientId);
  const ailment = patient?.ailments?.find((row: any) => row.status === 'active');
  const legacyAilment = state.activeAilment;
  const ailmentName = legacyAilment?.name || ailment?.legacyName || '살펴볼 병증이 없습니다';
  const requirements = requirementWords(legacyAilment?.tags || ailment?.requirementSnapshot || '');
  const recentJournal = state.journals?.[0];
  const dayTitle = state.journeyActive
    ? `${state.journeyDestination || '다음 마을'}로 향하는 날`
    : `${state.currentLocationName}에 머무는 날`;

  return (
    <section className="today-overview" aria-labelledby="today-title">
      <div className="today-scene">
        <img src="/art/forest-1891.jpg" alt="수채화로 그린 고요한 숲" />
        <div className="today-scene__copy">
          <span className="today-scene__season"><SunMedium aria-hidden="true" size={17} /> {state.currentSeason}</span>
          <p>오늘의 들녘 기록</p>
          <h2 id="today-title">{dayTitle}</h2>
          <button type="button" onClick={onContinue}>
            <Compass aria-hidden="true" size={18} /> 이어서 걷기
          </button>
        </div>
        <a className="today-scene__credit" href="https://www.si.edu/object/forest%3Achndm_1948-47-6" target="_blank" rel="noreferrer">Forest, 1891 · Smithsonian CC0</a>
      </div>

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
            <Stethoscope aria-hidden="true" size={17} /> 진료 수첩 펼치기
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
            <Flower2 aria-hidden="true" size={17} /> 약초 도감 살피기
          </button>
        </article>

        <article className="today-place">
          <span className="journal-note-label">지금 머무는 곳</span>
          <h3>{state.currentLocationName}</h3>
          <p>{state.currentRegion} · {state.currentLocationType} · {state.currentSeason}</p>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('map')}>
            <Map aria-hidden="true" size={17} /> 지도에 짚어보기
          </button>
        </article>

        <article className="today-bag">
          <span className="journal-note-label">펼쳐둔 배낭</span>
          <h3>{currentWeight.toFixed(1)} / {maxCarry}</h3>
          <p>영약재 {state.bag?.filter((item: any) => item.type === 'reagent').length || 0} · 도구 {state.bag?.filter((item: any) => item.type === 'tool').length || 0}</p>
          <div className="today-bag__line"><span style={{ width: `${Math.min(100, (currentWeight / Math.max(1, maxCarry)) * 100)}%` }} /></div>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('bio')}>
            <Backpack aria-hidden="true" size={17} /> 배낭 정리하기
          </button>
        </article>

        <article className="today-journal">
          <span className="journal-note-label">가장 최근의 문장</span>
          <h3>{recentJournal?.title || '아직 적힌 이야기가 없습니다'}</h3>
          <p>{recentJournal?.text?.slice(0, 180) || '첫 여행을 떠나면 이곳에 작은 기억이 남습니다.'}</p>
          <button type="button" className="journal-text-action" onClick={() => onNavigate('journals')}>
            <NotebookTabs aria-hidden="true" size={17} /> 지난 기록 읽기
          </button>
        </article>
      </div>
    </section>
  );
}
