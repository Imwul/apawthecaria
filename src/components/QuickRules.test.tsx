import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import QuickRules from './QuickRules';
import { getQuickRulesPresentation, QUICK_RULES, quickRuleRequest } from '../quickRules';
import { RULEBOOK_REFERENCE_BY_ID } from '../rulebook/referenceRegistry';
import type { CampaignContinuityState } from '../campaignContinuity';

const base: CampaignContinuityState = {
  bio: { name: '솔' }, journeyActive: true, currentLocationName: 'Odoak',
  journeyDestination: 'Obridge', calendarDays: 2, calendarMaxDays: 12
};

describe('contextual recurring rule access', () => {
  it('opens all seven recurring rules through valid references at pages within their source ranges', () => {
    expect(QUICK_RULES).toHaveLength(7);
    expect(new Set(QUICK_RULES.map(rule => rule.id)).size).toBe(7);
    expect(QUICK_RULES.map(rule => rule.page)).toEqual([24, 29, 30, 33, 35, 36, 38]);
    for (const rule of QUICK_RULES) {
      const request = quickRuleRequest(rule, '현재 진료');
      const source = RULEBOOK_REFERENCE_BY_ID.get(request.entryId!);
      expect(source, rule.id).toBeDefined();
      expect(request.page!).toBeGreaterThanOrEqual(source!.sourcePage);
      expect(request.page!).toBeLessThanOrEqual(source!.endPage || source!.sourcePage);
      expect(request.context).toEqual([{ label: '현재 절차', value: '현재 진료' }]);
    }
  });

  it.each([
    { pendingForaging: { awaitingImmediateRemedy: true }, first: 'foraging' },
    { pendingBarter: { status: 'completed', awaitingImmediateRemedy: true }, first: 'bartering' }
  ])('keeps immediate remedy before timer reduction for $first', ({ first, ...pending }) => {
    const state = { ...base, ...pending, activeAilment: { timer: 1 } };
    const original = structuredClone(state);
    const view = getQuickRulesPresentation(state);
    expect(view.relevantIds[0]).toBe(first);
    expect(view.context).toContain('치료 기한을 줄이기 전에');
    expect(view.urgent).toBe(true);
    expect(state).toEqual(original);
  });

  it('uses canonical active patient clocks and preserves independent hours', () => {
    const state = { ...base, activePatientId: 'current', activeAilment: { id: 'a', timer: 99 },
      patients: [{ id: 'current', status: 'active',
        ailments: [{ id: 'a', status: 'active', timerIds: ['a-timer'] }, { id: 'b', status: 'active', timerIds: ['b-timer'] }],
        timers: [{ id: 'a-timer', current: 7, status: 'active' }, { id: 'b-timer', current: 3, status: 'active' }] }]
    };
    const original = structuredClone(state);
    const view = getQuickRulesPresentation(state);
    expect(view.context).toContain('가장 짧은 치료 기한 3시간');
    expect(view.context).toContain('같은 태그의 최댓값');
    expect(view.context).toContain('기한은 각각 추적');
    expect(view.context).not.toContain('99');
    expect(view.relevantIds).toEqual(['research', 'foraging', 'bartering']);
    expect(state).toEqual(original);
  });

  it('keeps distinct day and hour rules visible during arrival encounters', () => {
    const view = getQuickRulesPresentation({ ...base, pendingEncounter: { encounter: {} } });
    expect(view.context).toContain('도착 조우를 먼저');
    expect(view.context).toContain('여정 달력의 일');
    expect(view.context).toContain('환자 기한의 시간');
  });

  it('distinguishes optional departure time and special barrow rules', () => {
    const leaving = getQuickRulesPresentation({ ...base, scroungingMode: true, scroungingTimer: 4 });
    expect(leaving.relevantIds[0]).toBe('leave');
    expect(leaving.context).toContain('여분 채집 4시간');
    expect(leaving.context).toContain('바로 떠나도 됩니다');
    const barrow = getQuickRulesPresentation({ ...base, activeDelve: { timer: 4 } });
    expect(barrow.context).toContain('현지 환자 진료를 대신');
    expect(barrow.context).toContain('일반 진료 보상을 중복 적용하지');
    expect(barrow.relevantIds).not.toContain('diagnosis');
    expect(barrow.relevantIds).not.toContain('leave');
  });

  it('shows three contextual rules and four different optional rules without duplicate shortcuts', () => {
    const original = structuredClone(base);
    const html = renderToStaticMarkup(<QuickRules state={base} onOpenReference={() => {}} />);
    expect(html.match(/class="quick-rules__rule"/g)).toHaveLength(7);
    const immediate = html.slice(0, html.indexOf('<details'));
    expect(immediate.match(/class="quick-rules__rule"/g)).toHaveLength(3);
    expect(html).toContain('다른 반복 규칙 4개');
    expect(html).toContain('aria-labelledby=');
    expect(html).not.toContain('runtimeStatus');
    expect(base).toEqual(original);
  });
});
