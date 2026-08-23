import { describe, expect, it } from 'vitest';
import { applyManualCalendarAdjustment, getCampaignContinuity, getCampaignResumeActionIds, inferCompletedSeasons } from './campaignContinuity';

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

  it('prioritizes the active cross-system workflow over another Move', () => {
    const journey = { journeyActive: true, journeyDestination: 'Widrow', calendarDays: 3, calendarMaxDays: 12 };
    expect(getCampaignContinuity({ ...journey, pendingEncounter: { id: 'travel' } }).nextAction)
      .toBe('열어 둔 이동 조우를 먼저 해결하세요.');
    expect(getCampaignContinuity({ ...journey, pendingForaging: { id: 'forage' }, activeAilment: { id: 'patient' } }).nextAction)
      .toBe('열어 둔 채집 조우를 먼저 해결하세요.');
    expect(getCampaignContinuity({ ...journey, activeAilment: { id: 'patient' } }).nextAction)
      .toBe('현재 환자의 치료를 이어가세요.');
    expect(getCampaignContinuity({ ...journey, scroungingMode: true }).nextAction)
      .toBe('남은 치료 시간으로 여분 채집을 하거나 마감하세요.');
    expect(getCampaignContinuity({ ...journey, needsLocalHelpBeforeMove: true }).nextAction)
      .toBe('현지 야수의 질환을 해결해야 다시 이동할 수 있습니다.');
    expect(getCampaignContinuity({ ...journey, activeAilment: { id: 'patient' } }).continueLabel)
      .toBe('환자 치료 이어가기');
    expect(getCampaignContinuity({ ...journey, pendingForaging: { id: 'forage' } }).continueLabel)
      .toBe('채집 조우 이어가기');
    expect(getCampaignContinuity({ ...journey, pendingForaging: { id: 'forage' }, manualEffectQueue: [{ id: 'manual' }] }).continueLabel)
      .toBe('보류 판정 이어가기');
    expect(getCampaignContinuity({ ...journey, pursuedByBehemoth: { id: 'chase' } }).continueLabel)
      .toBe('거수 추격 이어가기');
    expect(getCampaignContinuity({ ...journey, activeDelve: { id: 'barrow' } }).continueLabel)
      .toBe('고분 탐사 이어가기');
  });

  it('routes Home resume to the blocking work before offering another Move', () => {
    const journey = { journeyActive: true, journeyDestination: 'Widrow', calendarDays: 3, calendarMaxDays: 12 };
    expect(getCampaignResumeActionIds({ ...journey, activeAilment: { id: 'patient' } }).slice(0, 2))
      .toEqual(['active-patient', 'barter-reagent']);
    expect(getCampaignResumeActionIds({ ...journey, activeAilment: { id: 'patient' } }).indexOf('active-patient'))
      .toBeLessThan(getCampaignResumeActionIds({ ...journey, activeAilment: { id: 'patient' } }).indexOf('travel-next'));
    expect(getCampaignResumeActionIds({ ...journey, pendingEncounter: { id: 'travel' } }).at(0))
      .toBe('pending-encounter');
    expect(getCampaignResumeActionIds({ ...journey, pendingForaging: { id: 'forage' }, manualEffectQueue: [{ id: 'manual' }] }).slice(0, 2))
      .toEqual(['manual-effect', 'pending-foraging']);
    expect(getCampaignResumeActionIds({ journeyActive: false, downtimeRequired: true, downtimeCompleted: false }).at(0))
      .toBe('downtime-activities');
  });

  it('resumes a queued manual ruling before downtime or a new journey outside an active journey', () => {
    const state = {
      journeyActive: false,
      downtimeRequired: true,
      downtimeCompleted: false,
      manualEffectQueue: [{ effectId: 'manual:waiting' }]
    };

    expect(getCampaignContinuity(state)).toMatchObject({
      stage: 'manual-effect',
      nextAction: '보류한 직접 판정을 먼저 마무리하세요.',
      continueLabel: '보류 판정 이어가기'
    });
    expect(getCampaignResumeActionIds(state)).toEqual(['manual-effect']);
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
