import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TodayOverview } from './JournalExperience';

const baseState = {
  activePatientId: null,
  activeAilment: null,
  bag: [],
  currentLocationName: '오크 길',
  currentLocationType: 'Wilds',
  currentRegion: 'Forest',
  currentSeason: 'Spring',
  journals: [],
  journeyActive: false,
  patients: []
};

const renderOverview = (state: any) => renderToStaticMarkup(
  <TodayOverview
    state={state}
    currentWeight={0}
    maxCarry={4}
    onNavigate={() => undefined}
    onContinue={() => undefined}
    onOpenReference={() => undefined}
  />
);

describe('TodayOverview location heading', () => {
  it('keeps legacy Korean location data as a separate English place line', () => {
    const html = renderOverview(baseState);

    expect(html).toContain('<span class="today-title__place">Oak Road</span>');
    expect(html).toContain('<span class="today-title__phrase">이곳에 머무는 날</span>');
    expect(html).not.toContain('오크 길');
  });

  it('uses the English journey destination without attaching a particle', () => {
    const html = renderOverview({
      ...baseState,
      journeyActive: true,
      journeyDestination: '뉴댐'
    });

    expect(html).toContain('<span class="today-title__place">New Dam</span>');
    expect(html).toContain('<span class="today-title__phrase">목적지를 향해 걷는 날</span>');
    expect(html).not.toContain('뉴댐');
  });
});
