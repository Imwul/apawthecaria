import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChapterOpening, JournalNavigation, TodayOverview, type JournalTab } from './JournalExperience';

const tabs: JournalTab[] = ['play', 'ailments', 'reagents', 'bio', 'map', 'almanack', 'patientArchive', 'livingArchive', 'journals'];
const state = {
  currentLocationName: 'Odoak', currentRegion: 'Forest', currentSeason: 'Spring',
  journeyActive: false, reputation: 5, completedSeasons: 0, cumulativeDays: 0,
  bio: { name: '검증 약제사', speed: 3 }, bag: [], journals: [], patients: [],
  worldAlmanac: [], patientArchive: [], trinketArchive: []
};
const noop = () => {};

describe('play loop workspace presentation', () => {
  it.each(tabs)('keeps all nine navigation actions and a unique current page for %s', tab => {
    const html = renderToStaticMarkup(<JournalNavigation activeTab={tab} onChange={noop} />);
    expect(html.match(/class="journal-tab /g)).toHaveLength(9);
    expect(html.match(/<button /g)).toHaveLength(9);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain(`journal-tab--${tab} journal-tab--active`);
    expect(html).toContain('title="일지"');
    expect(html).not.toContain("station-mode-switch");
    expect(html).toContain("기록 더 보기");
  });

  it('shows the source-derived loop without duplicating the action hub or mutating the campaign', () => {
    const original = structuredClone(state);
    const html = renderToStaticMarkup(<TodayOverview state={state} currentWeight={0} maxCarry={4}
      onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain('어디로 떠나볼까요');
    expect(html).toContain('이 단계의 규칙');
    expect(html).toContain('aria-labelledby="today-title"');
    expect(html).toContain('aria-label="반복 플레이 순서"');
    expect(html).not.toContain('workspace-primary');
    expect(html).not.toContain('aria-current="step"');
    expect(html).not.toContain('workspace-today__atmosphere');
    expect(state).toEqual(original);
  });

  it.each([
    { season: 'Autumn', location: '뉴댐', caption: '가을 · New Dam' },
    { season: 'Winter', location: '스풀킵', caption: '겨울 · Spoolkeep' }
  ])('uses current localized season and place in visible gameplay context for $season', ({ season, location, caption }) => {
    const campaign = { ...state, currentSeason: season, currentLocationName: location };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<TodayOverview state={campaign} currentWeight={0} maxCarry={4}
      onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain(`${caption.split(' · ').reverse().join(' · ')}</p>`);
    expect(campaign).toEqual(original);
  });

  it('identifies the blocking care stage and retains the journey clocks', () => {
    const html = renderToStaticMarkup(<TodayOverview
      state={{ ...state, journeyActive: true, journeyDestination: 'Obridge', calendarDays: 2, calendarMaxDays: 12, pendingForaging: { id: 'forage' } }}
      currentWeight={0} maxCarry={4} onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain('채집 결과를 끝까지 확인하세요');
    expect(html).toContain('class="play-loop__step is-current" aria-current="step"');
    expect(html).toContain('Obridge');
    expect(html).toContain('2 / 12일');
  });

  it('reports a late journey honestly while keeping patient hours independent from calendar days', () => {
    const campaign = { ...state, journeyActive: true, calendarDays: 14, calendarMaxDays: 12,
      activePatientId: 'current', patients: [{ id: 'current', name: '솔', status: 'active',
        ailments: [{ id: 'a', status: 'active', timerIds: ['t1', 't2'], requirementSnapshot: 'WOUND 2' }],
        timers: [{ id: 't1', current: 7, status: 'active' }, { id: 't2', current: 4, status: 'active' }] }] };
    const html = renderToStaticMarkup(<TodayOverview state={campaign} currentWeight={0} maxCarry={4}
      onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain('14 / 12일');
    expect(html).toContain('기한 2일 초과');
    expect(html).toContain('4시간');
    expect(html).toContain('2개 기한 중 가장 짧은 시간');
    expect(html).not.toContain('남은 기한 0일');
  });

  it('does not imply completed loop steps when a procedure is interrupted or awaiting setup', () => {
    const html = renderToStaticMarkup(<TodayOverview state={{ ...state, journeyActive: true,
      pendingEncounter: { encounter: { encounterType: 'social' } } }} currentWeight={0} maxCarry={4}
      onNavigate={noop} onOpenReference={noop} />);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('<strong>조우</strong>');
    expect(html).not.toContain('is-complete');
    expect(html).not.toContain('완료');
  });

  it('preserves requirements for every active ailment in the patient summary', () => {
    const html = renderToStaticMarkup(<TodayOverview state={{ ...state, activePatientId: 'current',
      patients: [{ id: 'current', name: '솔', status: 'active', ailments: [
        { id: 'a', status: 'active', legacyName: '상처', requirementSnapshot: 'WOUND 2' },
        { id: 'b', status: 'active', legacyName: '추가 질환', requirementSnapshot: 'POISON 1' },
        { id: 'old', status: 'cured', requirementSnapshot: 'STALE 9' }
      ], timers: [] }] }} currentWeight={0} maxCarry={4} onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain('data-rule-tag="WOUND"');
    expect(html).toContain('data-rule-tag="POISON"');
    expect(html).toContain('추가 질환');
    expect(html).not.toContain('STALE');
    expect(html).toContain('기한 확인 필요');
  });

  it.each(tabs.filter(tab => tab !== 'play'))('keeps source access and an accessible chapter title for %s', tab => {
    const original = structuredClone(state);
    const html = renderToStaticMarkup(<ChapterOpening tab={tab as Exclude<JournalTab, 'play'>}
      state={state} maxCarry={4} onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain(`aria-labelledby="chapter-title-${tab}"`);
    expect(html).toContain(`id="chapter-title-${tab}"`);
    expect(html).toContain('이 화면의 규칙');
    expect(html).toContain('현재 상황');
    expect(html).toContain('aria-label="현재 기록 요약"');
    const notes = html.match(/<ul class="chapter-opening__notes"[\s\S]*?<\/ul>/)?.[0];
    expect(notes?.match(/<li>/g)).toHaveLength(2);
    expect(html).not.toContain('chapter-opening__plate');
    expect(state).toEqual(original);
  });

  it('retains live player journal count and season as chapter metadata', () => {
    const campaign = {
      ...state,
      currentSeason: 'Autumn',
      currentLocationName: '뉴댐',
      journals: [
        { id: 'memory-1', title: '첫 기억', text: '곁에 머물렀다.', timestamp: 1,
          semantic: { version: 1, category: 'player-memory', origin: 'player', memory: '곁에 머물렀다.' } },
        { id: 'activity', title: '여정 시작', text: '여정 시작', timestamp: 2,
          semantic: { version: 1, category: 'activity', origin: 'engine', outcome: '여정 시작' } },
        { id: 'memory-2', title: '두 번째 기억', text: '다시 길을 나섰다.', timestamp: 3,
          semantic: { version: 1, category: 'player-memory', origin: 'player', memory: '다시 길을 나섰다.' } }
      ]
    };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<ChapterOpening tab="journals" state={campaign} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain('<li>2편의 일지</li><li>가을</li>');
    expect(html).toContain('두 번째 기억');
    expect(html).toContain('“다시 길을 나섰다.”');
    expect(html).not.toContain('여정 시작');
    expect(campaign).toEqual(original);
  });

  it('retains the shortest active patient timer and a treatment return action in the context disclosure', () => {
    const campaign = {
      ...state,
      activePatientId: 'patient-current',
      patients: [{
        id: 'patient-current', name: '솔', status: 'active',
        ailments: [{ id: 'ailment-current', status: 'active', legacyName: '가시 상처', timerIds: ['timer-a', 'timer-b'] }],
        timers: [{ id: 'timer-a', status: 'active', current: 7 }, { id: 'timer-b', status: 'active', current: 4 }, { id: 'timer-old', status: 'stopped', current: 1 }]
      }]
    };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<ChapterOpening tab="ailments" state={campaign} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain('<dt>환자</dt><dd>솔</dd>');
    expect(html).toContain('<dt>가장 급한 기한</dt><dd>4시간</dd>');
    expect(html).toContain('치료 이어가기');
    expect(html).toContain('이 화면의 규칙');
    expect(campaign).toEqual(original);

    const emptyHtml = renderToStaticMarkup(<ChapterOpening tab="ailments" state={state} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(emptyHtml).not.toContain('치료 이어가기');
    expect(emptyHtml).toContain('이 화면의 규칙');
  });

  it('shows the selected patient’s collection needs instead of a stale legacy ailment', () => {
    const campaign = { ...state, activePatientId: 'patient-new',
      activeAilment: { name: '오래된 병증', patientName: '지난 환자', tags: 'Stale', timer: 99 },
      patients: [{ id: 'patient-new', name: '새봄', status: 'active',
        ailments: [{ id: 'a', status: 'active', legacyName: '새 상처', requirementSnapshot: 'WOUND 2, PAIN 1' }], timers: [] }]
    };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<TodayOverview state={campaign} currentWeight={0} maxCarry={4}
      onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain('필요 약효');
    expect(html).toContain('새봄');
    expect(html.replace(/<[^>]*>/g, '')).toContain('WOUND 2, PAIN 1');
    expect(html).toContain('data-rule-tag="WOUND"');
    expect(html).toContain('data-rule-tag="PAIN"');
    expect(html).not.toContain('상처 (WOUND)');
    expect(html).not.toContain('Stale');
    expect(html).not.toContain('지난 환자');
    expect(campaign).toEqual(original);
  });

  it('reads a newly drawn canonical patient’s name and complete prescription from the catalogue', () => {
    const campaign = { ...state, activePatientId: 'current',
      patients: [{ id: 'current', name: '새 환자', status: 'active',
        ailments: [{ id: 'a', ailmentId: 'ailment-monthly-chore', status: 'active', timerIds: ['t'] }],
        timers: [{ id: 't', current: 6, status: 'active' }] }],
      activeAilment: { name: '지난 환자의 병증', tags: 'STALE 9' }
    };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<TodayOverview state={campaign} currentWeight={0} maxCarry={4}
      onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain('Monthly Chore');
    expect(html.replace(/<[^>]*>/g, '')).toContain('SCALE 2 + PAIN 1');
    expect(html).toContain('6시간');
    expect(html).not.toContain('STALE');
    expect(campaign).toEqual(original);
  });

  it('shows applied tag replacements and dynamic requirements instead of the original catalogue prescription', () => {
    const campaign = { ...state, activePatientId: 'current',
      ailmentTagOverrides: [{ ailmentId: 'ailment-monthly-chore', originalTag: 'SCALE', replacementTag: 'HIDE' }],
      patients: [{ id: 'current', name: '솔', status: 'active', ailments: [{ id: 'a',
        ailmentId: 'ailment-monthly-chore', status: 'active', timerIds: [], specialState: {
          additionalRequirements: [{ tag: 'WOUND', threshold: 3 }], poisonRequirement: 2
        } }], timers: [] }] };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<TodayOverview state={campaign} currentWeight={0} maxCarry={4}
      onNavigate={noop} onOpenReference={noop} />);
    expect(html.replace(/<[^>]*>/g, '')).toContain('HIDE 2 + PAIN 1 + WOUND 3 + POISON 2');
    expect(html).not.toContain('data-rule-tag="SCALE"');
    expect(campaign).toEqual(original);
  });

  it('preserves alternative complete recipes when an ailment has more than one treatment', () => {
    const html = renderToStaticMarkup(<TodayOverview state={{ ...state, activePatientId: 'current',
      patients: [{ id: 'current', name: '솔', status: 'active', ailments: [{ id: 'a',
        ailmentId: 'ailment-crestfallen', status: 'active', timerIds: [] }], timers: [] }] }}
      currentWeight={0} maxCarry={4} onNavigate={noop} onOpenReference={noop} />);
    expect(html).toContain(' 또는 ');
    for (const tag of ['FEATHER', 'NERVES', 'INSTINCT', 'JOY']) expect(html).toContain(`data-rule-tag="${tag}"`);
    expect(html.match(/data-rule-tag="FEATHER"/g)).toHaveLength(2);
  });

  it('reads encounter-only remedy requirements without a stale snapshot', () => {
    const html = renderToStaticMarkup(<TodayOverview state={{ ...state, activePatientId: 'current',
      patients: [{ id: 'current', name: '올챙이', status: 'active', ailments: [{ id: 'a',
        ailmentId: 'encounter-remedy-sick-tadpoles', status: 'active', timerIds: [], requirementSnapshot: 'STALE 9' }], timers: [] }] }}
      currentWeight={0} maxCarry={4} onNavigate={noop} onOpenReference={noop} />);
    expect(html.replace(/<[^>]*>/g, '')).toContain('TEMPERATURE 2 + INFECTION 1');
    expect(html).not.toContain('STALE');
  });

  it('does not carry a completed journey’s destination and objective into the live map note', () => {
    const campaign = { ...state, journeyActive: true, journey: { status: 'completed' },
      journeyDestination: 'OldDestination', journeyGoalTitle: 'OldObjective' };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<ChapterOpening tab="map" state={campaign} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain('다음 이동을 준비합니다.');
    expect(html).not.toContain('OldDestination');
    expect(html).not.toContain('OldObjective');
    expect(campaign).toEqual(original);
  });
});
