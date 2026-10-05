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

describe('book object journal presentation', () => {
  it.each(tabs)('keeps all nine navigation actions and a unique current page for %s', tab => {
    const html = renderToStaticMarkup(<JournalNavigation activeTab={tab} onChange={noop} />);
    expect(html.match(/<button /g)).toHaveLength(9);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain(`journal-tab--${tab} journal-tab--active`);
    expect(html).toContain('title="이야기"');
  });

  it('keeps the resume action ahead of decorative artwork without mutating the campaign', () => {
    const original = structuredClone(state);
    const html = renderToStaticMarkup(<TodayOverview state={state} currentWeight={0} maxCarry={4}
      onNavigate={noop} onContinue={noop} onOpenReference={noop} />);
    expect(html).toContain('여정 준비하기');
    expect(html).toContain('이 단계의 규칙');
    expect(html).toContain('aria-labelledby="today-title"');
    expect(html.indexOf('class="workspace-today__actions"')).toBeLessThan(html.indexOf('class="workspace-today__atmosphere"'));
    const artwork = html.match(/<div class="workspace-today__atmosphere"[\s\S]*?<\/div>/)?.[0];
    expect(artwork).toContain('aria-hidden="true"');
    expect(artwork).toContain('alt=""');
    expect(state).toEqual(original);
  });

  it.each([
    { season: 'Autumn', location: '뉴댐', caption: '가을 · New Dam' },
    { season: 'Winter', location: '스풀킵', caption: '겨울 · Spoolkeep' }
  ])('uses current localized season and place in visible gameplay context for $season', ({ season, location, caption }) => {
    const campaign = { ...state, currentSeason: season, currentLocationName: location };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<TodayOverview state={campaign} currentWeight={0} maxCarry={4}
      onNavigate={noop} onContinue={noop} onOpenReference={noop} />);
    expect(html).toContain(`<span>${caption.split(' · ').reverse().join(' · ')}</span>`);
    expect(campaign).toEqual(original);
  });

  it('retains the blocking workflow resume label in an illustrated active journey', () => {
    const html = renderToStaticMarkup(<TodayOverview
      state={{ ...state, journeyActive: true, journeyDestination: 'Obridge', calendarDays: 2, calendarMaxDays: 12, pendingForaging: { id: 'forage' } }}
      currentWeight={0} maxCarry={4} onNavigate={noop} onContinue={noop} onOpenReference={noop} />);
    expect(html).toContain('채집 이어가기');
    expect(html).toContain('Obridge');
    expect(html).toContain('2 / 12일');
  });

  it.each(tabs.filter(tab => tab !== 'play'))('keeps source access and an accessible chapter title for %s', tab => {
    const original = structuredClone(state);
    const html = renderToStaticMarkup(<ChapterOpening tab={tab as Exclude<JournalTab, 'play'>}
      state={state} maxCarry={4} onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain(`aria-labelledby="chapter-title-${tab}"`);
    expect(html).toContain(`id="chapter-title-${tab}"`);
    expect(html).toContain('플레이 방법');
    expect(html).toContain('이 화면에서 하는 일');
    expect(html).toContain('aria-label="현재 기록 요약"');
    const notes = html.match(/<ul class="chapter-opening__notes"[\s\S]*?<\/ul>/)?.[0];
    expect(notes?.match(/<li>/g)).toHaveLength(2);
    const artwork = html.match(/<div class="chapter-opening__plate"[\s\S]*?<\/div>/)?.[0];
    expect(artwork).toContain('aria-hidden="true"');
    expect(artwork).toContain('alt=""');
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

  it('retains the shortest active patient timer and a treatment return action alongside decoration', () => {
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
    expect(html).toContain('현재 환자 · 솔');
    expect(html).toContain('<li>가시 상처</li><li>4시간</li>');
    expect(html).toContain('모험에서 치료 이어가기');
    expect(html).toContain('플레이 방법');
    expect(campaign).toEqual(original);

    const emptyHtml = renderToStaticMarkup(<ChapterOpening tab="ailments" state={state} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(emptyHtml).not.toContain('모험에서 치료 이어가기');
    expect(emptyHtml).toContain('플레이 방법');
  });

  it('shows the selected patient’s collection needs instead of a stale legacy ailment', () => {
    const campaign = { ...state, activePatientId: 'patient-new',
      activeAilment: { name: '오래된 병증', patientName: '지난 환자', tags: 'Stale', timer: 99 },
      patients: [{ id: 'patient-new', name: '새봄', status: 'active',
        ailments: [{ id: 'a', status: 'active', legacyName: '새 상처', requirementSnapshot: 'WOUND 2, PAIN 1' }], timers: [] }]
    };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<ChapterOpening tab="reagents" state={campaign} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain('오늘의 채집 메모');
    expect(html).toContain('새봄');
    expect(html).toContain('상처 (WOUND) 2 · 통증 (PAIN) 1');
    expect(html).not.toContain('Stale');
    expect(html).not.toContain('지난 환자');
    expect(campaign).toEqual(original);
  });

  it('does not carry a completed journey’s destination and objective into the live map note', () => {
    const campaign = { ...state, journeyActive: true, journey: { status: 'completed' },
      journeyDestination: 'OldDestination', journeyGoalTitle: 'OldObjective' };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<ChapterOpening tab="map" state={campaign} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain('다음 길을 생각하며');
    expect(html).not.toContain('OldDestination');
    expect(html).not.toContain('OldObjective');
    expect(campaign).toEqual(original);
  });
});
