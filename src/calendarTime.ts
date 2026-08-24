export interface CalendarClockState {
  calendarDays?: unknown;
  cumulativeDays?: unknown;
  calendarHistory?: unknown;
}

export interface CalendarClocks {
  calendarDays: number;
  cumulativeDays: number;
}

export const normalizeDayCount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
};

/**
 * The current journey calendar is part of the campaign's cumulative elapsed
 * time. Older saves and a few runtime paths could leave the latter behind, so
 * reading the clocks always repairs that impossible relationship.
 */
export const readCalendarClocks = (state: CalendarClockState): CalendarClocks => {
  const calendarDays = normalizeDayCount(state.calendarDays);
  return {
    calendarDays,
    cumulativeDays: Math.max(calendarDays, normalizeDayCount(state.cumulativeDays))
  };
};

export const repairCalendarClocks = <T extends CalendarClockState>(state: T): T & CalendarClocks => ({
  ...state,
  ...readCalendarClocks(state)
});

/**
 * Applies a domain/runtime calendar result and mirrors only newly elapsed days
 * into cumulative campaign time. Journey resets intentionally use a direct
 * calendarDays: 0 assignment instead of this helper.
 */
export const applyCalendarAdvance = <T extends CalendarClockState>(
  state: T,
  requestedDay: unknown,
  reason?: string
): T & CalendarClocks => {
  const clocks = readCalendarClocks(state);
  const calendarDays = normalizeDayCount(requestedDay);
  const elapsed = Math.max(0, calendarDays - clocks.calendarDays);
  const next = {
    ...state,
    calendarDays,
    cumulativeDays: clocks.cumulativeDays + elapsed
  };
  if (elapsed === 0 || !reason?.trim()) return next;
  const calendarHistory = Array.isArray(state.calendarHistory)
    ? state.calendarHistory.filter((entry): entry is string => typeof entry === 'string')
    : [];
  return {
    ...next,
    calendarHistory: [...calendarHistory, `${calendarDays}일째: ${reason.trim()} (+${elapsed}일)`]
  };
};
