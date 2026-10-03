interface TimerRow {
  id: string;
  ailmentInstanceId?: string;
  current: number;
  status?: string;
}

interface AilmentRow {
  id?: string;
  status?: string;
  timerIds?: string[];
}

interface TimerPatient {
  id: string;
  status?: string;
  ailments?: AilmentRow[];
  timers?: TimerRow[];
}

export interface PatientTimerProjectionState {
  activePatientId?: unknown;
  patients?: TimerPatient[];
  activeAilment?: unknown;
  scroungingMode?: boolean;
  scroungingTimer?: number;
}

export interface PatientTimerProjection {
  source: 'canonical' | 'legacy' | 'none';
  patientId: string | null;
  shortestHours: number | null;
  selectedHours: number | null;
  activeTimers: TimerRow[];
  scroungingHours: number | null;
  hasActiveAilment: boolean;
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object'
  ? value as Record<string, unknown> : {};
const hours = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value)
  ? Math.max(0, value) : null;
const shortest = (timers: TimerRow[]): number | null => timers.length
  ? Math.min(...timers.map(timer => Math.max(0, timer.current))) : null;

/** The active case is authoritative; a cured case never revives its legacy Timer. */
export const getPatientTimerProjection = (state: PatientTimerProjectionState): PatientTimerProjection => {
  const patientId = typeof state.activePatientId === 'string' ? state.activePatientId : null;
  const patient = state.patients?.find(row => row.id === patientId);
  const legacy = record(state.activeAilment);
  const scroungingHours = state.scroungingMode ? hours(state.scroungingTimer) : null;
  if (patient) {
    const activeAilments = !patient.status || patient.status === 'active'
      ? (patient.ailments || []).filter(row => row.status === 'active') : [];
    const activeIds = new Set(activeAilments.flatMap(row => row.timerIds || []));
    const ailmentIds = new Set(activeAilments.map(row => row.id).filter(Boolean));
    const activeTimers = (patient.timers || []).filter(timer => timer.status !== 'stopped'
      && Number.isFinite(timer.current)
      && (activeIds.has(timer.id) || Boolean(timer.ailmentInstanceId && ailmentIds.has(timer.ailmentInstanceId))));
    const selected = activeAilments.find(row => row.id === legacy.id);
    const selectedIds = new Set(selected?.timerIds || []);
    const selectedTimers = selected ? activeTimers.filter(timer => selectedIds.has(timer.id)
      || timer.ailmentInstanceId === selected.id) : activeTimers;
    return {
      source: 'canonical', patientId, shortestHours: shortest(activeTimers), selectedHours: shortest(selectedTimers),
      activeTimers, scroungingHours, hasActiveAilment: activeAilments.length > 0
    };
  }
  const legacyHours = state.activeAilment ? hours(legacy.timer) : null;
  return {
    source: state.activeAilment ? 'legacy' : 'none', patientId,
    shortestHours: legacyHours, selectedHours: legacyHours, activeTimers: [], scroungingHours,
    hasActiveAilment: Boolean(state.activeAilment)
  };
};
