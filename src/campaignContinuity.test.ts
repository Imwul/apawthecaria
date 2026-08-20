import { describe, expect, it } from 'vitest';
import { applyManualCalendarAdjustment, getCampaignContinuity, inferCompletedSeasons } from './campaignContinuity';

describe('campaign continuity', () => {
  it('prioritizes the required downtime and season boundary stages', () => {
    expect(getCampaignContinuity({ journeyActive: false, downtimeRequired: true, downtimeCompleted: false }).stage).toBe('downtime-required');
    expect(getCampaignContinuity({ journeyActive: false, downtimeRequired: false, downtimeCompleted: true }).stage).toBe('season-ready');
    expect(getCampaignContinuity({ journeyActive: false, downtimeRequired: false, downtimeCompleted: false }).stage).toBe('journey-ready');
  });

  it('reports journey time without allowing negative remaining days', () => {
    const continuity = getCampaignContinuity({ journeyActive: true, journeyDestination: 'Widrow', calendarDays: 14, calendarMaxDays: 12 });
    expect(continuity.stage).toBe('journey');
    expect(continuity.guidance).toContain('0일 남음');
  });

  it('keeps the journey and cumulative clocks aligned during a manual correction', () => {
    const forward = applyManualCalendarAdjustment({ calendarDays: 2, calendarMaxDays: 12, cumulativeDays: 17, calendarHistory: [] }, 5);
    expect(forward.calendarDays).toBe(5);
    expect(forward.cumulativeDays).toBe(20);
    expect(forward.calendarHistory.at(-1)).toContain('경과일 +3');

    const back = applyManualCalendarAdjustment(forward, 3);
    expect(back.calendarDays).toBe(3);
    expect(back.cumulativeDays).toBe(18);
    expect(back.calendarHistory.at(-1)).toContain('경과일 -2');
  });

  it('never invents completed seasons from elapsed days in a legacy save', () => {
    expect(inferCompletedSeasons({ completedSeasons: undefined, journals: [] })).toBe(0);
    expect(inferCompletedSeasons({
      completedSeasons: undefined,
      journals: [
        { id: 'season_settle_1', title: '계절 정산 결과 (봄 → 여름)' },
        { id: 'unrelated', title: '30일 동안 걸었다' },
        { id: 'season:2:random:journal', title: '계절 전환: 여름 → 가을' }
      ]
    })).toBe(2);
    expect(inferCompletedSeasons({ completedSeasons: 4, journals: [] })).toBe(4);
    expect(inferCompletedSeasons({ completedSeasons: '3', journals: [] })).toBe(3);
  });
});
