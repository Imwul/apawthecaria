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
    expect(html).toContain('aria-label="09 들녘의 일지"');
  });

  it('keeps the resume action ahead of the accessible plate and renders without mutating the campaign', () => {
    const original = structuredClone(state);
    const html = renderToStaticMarkup(<TodayOverview state={state} currentWeight={0} maxCarry={4}
      onNavigate={noop} onContinue={noop} onOpenReference={noop} />);
    expect(html).toContain('새 여정 준비하기');
    expect(html).toContain('지도에 짚어보기');
    expect(html).toContain('현재 절차 확인');
    expect(html).toContain('aria-labelledby="campaign-continuity-title"');
    expect(html.indexOf('class="today-scene__actions"')).toBeLessThan(html.indexOf('<figure'));
    const plate = html.match(/<figure class="woodland-travellers">[\s\S]*?<\/figure>/)?.[0];
    expect(plate).toBeDefined();
    expect(plate).toContain('alt="망토를 두른 곰과 흰 올빼미가 함께 걷는 삽화"');
    expect(plate).toContain('<figcaption><span>01 · 여행의 권두화</span><span>봄 · Odoak</span></figcaption>');
    expect(plate).not.toContain('aria-hidden');
    expect(state).toEqual(original);
  });

  it.each([
    { season: 'Autumn', location: '뉴댐', caption: '가을 · New Dam' },
    { season: 'Winter', location: '스풀킵', caption: '겨울 · Spoolkeep' }
  ])('uses current localized season and place in the plate caption for $season', ({ season, location, caption }) => {
    const campaign = { ...state, currentSeason: season, currentLocationName: location };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<TodayOverview state={campaign} currentWeight={0} maxCarry={4}
      onNavigate={noop} onContinue={noop} onOpenReference={noop} />);
    expect(html).toContain(`<figcaption><span>01 · 여행의 권두화</span><span>${caption}</span></figcaption>`);
    expect(campaign).toEqual(original);
  });

  it('retains the blocking workflow resume label in an illustrated active journey', () => {
    const html = renderToStaticMarkup(<TodayOverview
      state={{ ...state, journeyActive: true, journeyDestination: 'Obridge', calendarDays: 2, calendarMaxDays: 12, pendingForaging: { id: 'forage' } }}
      currentWeight={0} maxCarry={4} onNavigate={noop} onContinue={noop} onOpenReference={noop} />);
    expect(html).toContain('채집 조우 이어가기');
    expect(html).toContain('Obridge');
    expect(html).toContain('2 / 12일');
  });

  it.each(tabs.filter(tab => tab !== 'play'))('keeps source access and an accessible chapter title for %s', tab => {
    const original = structuredClone(state);
    const html = renderToStaticMarkup(<ChapterOpening tab={tab as Exclude<JournalTab, 'play'>}
      state={state} maxCarry={4} onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain(`aria-labelledby="chapter-title-${tab}"`);
    expect(html).toContain(`id="chapter-title-${tab}"`);
    expect(html).toContain('class="chapter-opening__heading"');
    expect(html).toContain('class="chapter-opening__context"');
    expect(html).toContain('이 장의 룰북 맥락');
    expect(html).toContain('aria-label="현재 기록 요약"');
    expect(html.match(/<li>/g)).toHaveLength(3);
    expect(html).not.toContain('<figure');
    expect(html).not.toContain('<img');
    expect(state).toEqual(original);
  });

  it('retains live journal count, season, and location as chapter metadata', () => {
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
    expect(html).toContain('<li>2편의 일지</li><li>가을</li><li>New Dam</li>');
    expect(html).toContain('들녘 기록 / 09');
    expect(campaign).toEqual(original);
  });

  it('retains the current patient summary and return action after removing chapter decoration', () => {
    const campaign = {
      ...state,
      activePatientId: 'patient-current',
      patients: [{
        id: 'patient-current', name: '솔', status: 'active',
        ailments: [{ status: 'active', legacyName: '가시 상처' }],
        timers: [{ status: 'active', current: 7 }, { status: 'active', current: 4 }, { status: 'resolved', current: 1 }]
      }]
    };
    const original = structuredClone(campaign);
    const html = renderToStaticMarkup(<ChapterOpening tab="ailments" state={campaign} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(html).toContain('<h2 id="chapter-title-ailments">솔의 진료 수첩</h2>');
    expect(html).toContain('<li>가시 상처</li><li>4시간</li><li>봄</li>');
    expect(html).toMatch(/<button type="button"><span[^>]*>📖<\/span> 현재 진료로 돌아가기<\/button>/);
    expect(html).toContain('이 장의 룰북 맥락');
    expect(campaign).toEqual(original);

    const emptyHtml = renderToStaticMarkup(<ChapterOpening tab="ailments" state={state} maxCarry={4}
      onReturnToToday={noop} onOpenReference={noop} />);
    expect(emptyHtml).not.toContain('현재 진료로 돌아가기');
    expect(emptyHtml).toContain('이 장의 룰북 맥락');
  });
});
