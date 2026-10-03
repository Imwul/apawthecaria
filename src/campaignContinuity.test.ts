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
      .toBe('열어 둔 이동 조우를 이어가세요');
    expect(getCampaignContinuity({
      ...journey,
      pendingEncounter: { encounter: { encounterType: 'social' } }
    })).toMatchObject({
      nextAction: '열어 둔 사회 조우를 이어가세요',
      continueLabel: '조우 이어가기'
    });
    expect(getCampaignContinuity({ ...journey, pendingForaging: { id: 'forage' }, activeAilment: { id: 'patient' } }).nextAction)
      .toBe('채집 결과를 끝까지 확인하세요');
    expect(getCampaignContinuity({ ...journey, activeAilment: { id: 'patient' } }).nextAction)
      .toBe('필요한 약효부터 살펴보세요');
    expect(getCampaignContinuity({ ...journey, scroungingMode: true }).nextAction)
      .toBe('떠나기 전, 조금 더 머물러도 좋아요');
    expect(getCampaignContinuity({ ...journey, needsLocalHelpBeforeMove: true }).nextAction)
      .toBe('이 길목의 야수를 도와주세요');
    expect(getCampaignContinuity({ ...journey, activeAilment: { id: 'patient' } }).continueLabel)
      .toBe('현재 처방 보기');
    expect(getCampaignContinuity({ ...journey, pendingForaging: { id: 'forage' } }).continueLabel)
      .toBe('채집 이어가기');
    expect(getCampaignContinuity({ ...journey, pendingForaging: { id: 'forage' }, manualEffectQueue: [{ id: 'manual' }] }).continueLabel)
      .toBe('판정 이어가기');
    expect(getCampaignContinuity({ ...journey, pursuedByBehemoth: { id: 'chase' } }).continueLabel)
      .toBe('이동 계획 보기');
    expect(getCampaignContinuity({ ...journey, activeDelve: { id: 'barrow' } }).continueLabel)
      .toBe('고분 도전 보기');
  });

  it('routes Home resume to the blocking work before offering another Move', () => {
    const journey = { journeyActive: true, journeyDestination: 'Widrow', calendarDays: 3, calendarMaxDays: 12 };
    expect(getCampaignResumeActionIds({ ...journey, activeAilment: { id: 'patient' } }).slice(0, 2))
      .toEqual(['active-patient', 'barter-reagent']);
    expect(getCampaignResumeActionIds({ ...journey, activeAilment: { id: 'patient' } })).not.toContain('travel-next');
    expect(getCampaignResumeActionIds({ ...journey, pendingEncounter: { id: 'travel' } }).at(0))
      .toBe('pending-encounter');
    expect(getCampaignResumeActionIds({ ...journey, pendingForaging: { id: 'forage' }, manualEffectQueue: [{ id: 'manual' }] }).slice(0, 2))
      .toEqual(['manual-effect', 'pending-foraging']);
    expect(getCampaignResumeActionIds({ journeyActive: false, downtimeRequired: true, downtimeCompleted: false }).at(0))
      .toBe('downtime-activities');
  });

  it('hands destination arrival and a saved ending draft to Journey completion, not another Move', () => {
    const arrived = {
      journeyActive: true,
      journey: { journeyId: 'journey-1', destinationId: 'obridge', status: 'active' as const },
      currentMapLocationId: 'obridge',
      currentLocationName: 'Obridge',
      journeyDestination: 'Obridge',
      calendarDays: 4,
      calendarMaxDays: 12
    };
    expect(getCampaignContinuity(arrived)).toMatchObject({
      nextAction: '목적지에 도착했어요',
      continueLabel: '여정 마무리 보기'
    });
    expect(getCampaignResumeActionIds(arrived).at(0)).toBe('journey-end');
    expect(getCampaignResumeActionIds(arrived)).not.toContain('travel-next');

    const arrivedWithEncounter = {
      ...arrived,
      pendingEncounter: { id: 'destination-encounter' }
    };
    expect(getCampaignContinuity(arrivedWithEncounter).guidance)
      .toContain('Obridge 도착 · 마지막 Move의 현지 절차 진행 중');
    expect(getCampaignResumeActionIds(arrivedWithEncounter).at(0)).toBe('pending-encounter');
    expect(getCampaignResumeActionIds(arrivedWithEncounter)).not.toContain('travel-next');

    const ending = {
      ...arrived,
      journey: { ...arrived.journey, status: 'ending' as const },
      pendingEnding: { journeyId: 'journey-1', selectedOutcome: 'partial' as const }
    };
    expect(getCampaignContinuity(ending)).toMatchObject({
      continueLabel: '여정 마무리 보기'
    });
    expect(getCampaignContinuity(ending).guidance).toContain('부분 성공 선택 저장됨');
    expect(getCampaignResumeActionIds(ending).at(0)).toBe('journey-end');
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
      nextAction: '남겨 둔 판정을 마무리하세요',
      continueLabel: '판정 이어가기'
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

    const repaired = applyManualCalendarAdjustment({ calendarDays: 2, calendarMaxDays: 12, cumulativeDays: 1, calendarHistory: [] }, 2);
    expect(repaired).toMatchObject({ calendarDays: 2, cumulativeDays: 2 });
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
