import { describe, expect, it } from 'vitest';
import { applyCalendarAdvance, readCalendarClocks, repairCalendarClocks } from './calendarTime';

describe('calendar clocks', () => {
  it('repairs an impossible cumulative clock without losing journey progress', () => {
    expect(readCalendarClocks({ calendarDays: 2, cumulativeDays: 1 })).toEqual({
      calendarDays: 2,
      cumulativeDays: 2
    });
    expect(repairCalendarClocks({ calendarDays: '4', cumulativeDays: null, note: 'kept' })).toEqual({
      calendarDays: 4,
      cumulativeDays: 4,
      note: 'kept'
    });
  });

  it('adds each newly marked journey day exactly once', () => {
    const advanced = applyCalendarAdvance({ calendarDays: 2, cumulativeDays: 9, calendarHistory: [] }, 3, '조우 지시를 반영했습니다.');
    expect(advanced).toMatchObject({
      calendarDays: 3,
      cumulativeDays: 10,
      calendarHistory: ['3일째: 조우 지시를 반영했습니다. (+1일)']
    });
    expect(applyCalendarAdvance(advanced, 3)).toMatchObject({ calendarDays: 3, cumulativeDays: 10 });
    expect(applyCalendarAdvance(advanced, 3).calendarHistory).toHaveLength(1);
  });

  it('repairs a stale baseline before applying a new day', () => {
    expect(applyCalendarAdvance({ calendarDays: 2, cumulativeDays: 1 }, 3)).toMatchObject({
      calendarDays: 3,
      cumulativeDays: 3
    });
  });

  it('never subtracts cumulative campaign time when a runtime day is corrected backwards', () => {
    expect(applyCalendarAdvance({ calendarDays: 5, cumulativeDays: 18 }, 3)).toMatchObject({
      calendarDays: 3,
      cumulativeDays: 18
    });
  });
});
