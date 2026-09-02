export interface JourneyResetStamp {
  journeyId?: string;
  startedAt: number;
  resetAt: number;
}

interface JourneyAnnotation {
  id?: string;
  journeyId?: string;
  createdAt?: number;
  locationId?: string;
  sourceEncounterId?: string;
  removed?: boolean;
}

export interface JourneyAnnotationState {
  journey?: { journeyId?: string; startDate?: number } | null;
  journeyResetHistory?: JourneyResetStamp[];
  journals?: Array<{ id: string; timestamp?: number }>;
  barrows?: JourneyAnnotation[];
  mapEncounterRecords?: JourneyAnnotation[];
}

const positiveTime = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

const journeyTime = (id?: string): number => positiveTime(Number(id?.match(/^journey:(\d+):/)?.[1]));

export const journeyAnnotationStartedAt = (state: JourneyAnnotationState): number =>
  positiveTime(state.journey?.startDate) || journeyTime(state.journey?.journeyId);

/** Old resets only left a journal entry. Recover ownership only from a bounded
 * start → reset interval, never from "not the current journey" (completed
 * journeys may legitimately leave permanent landmarks behind). */
export const journeyResetStamps = (state: JourneyAnnotationState): JourneyResetStamp[] => {
  const stamps = (Array.isArray(state.journeyResetHistory) ? state.journeyResetHistory : [])
    .filter(stamp => stamp && positiveTime(stamp.resetAt))
    .map(stamp => ({ ...stamp, startedAt: positiveTime(stamp.startedAt) }));
  const journals = (Array.isArray(state.journals) ? state.journals : [])
    .filter(row => row && typeof row.id === 'string');
  for (const reset of journals) {
    if (!reset.id.startsWith('journey-reset:')) continue;
    const resetAt = positiveTime(reset.timestamp) || positiveTime(Number(reset.id.slice('journey-reset:'.length)));
    if (!resetAt || stamps.some(stamp => stamp.resetAt === resetAt)) continue;
    const start = journals
      .filter(row => /^journey:[^:]+:[^:]+:journal$/.test(row.id) || /^start_\d+$/.test(row.id))
      .map(row => ({ row, time: positiveTime(row.timestamp) || journeyTime(row.id) || positiveTime(Number(row.id.slice(6))) }))
      .filter(entry => entry.time > 0 && entry.time <= resetAt)
      .sort((a, b) => b.time - a.time)[0];
    const inferredJourneyId = start?.row.id.startsWith('journey:') ? start.row.id.slice(0, -':journal'.length) : undefined;
    // The player may have deleted the reset journey's start entry. Never
    // borrow the previous completed journey in that case (nor fall back to an
    // even older start). App commits endings as `${journeyId}:ending:journal`.
    if (inferredJourneyId && journals.some(row => row.id === `${inferredJourneyId}:ending:journal`)) continue;
    stamps.push({
      journeyId: inferredJourneyId,
      startedAt: start?.time || 0,
      resetAt
    });
  }
  return stamps;
};

const annotationTime = (record: JourneyAnnotation): number =>
  positiveTime(record.createdAt) || positiveTime(Number(typeof record.id === 'string' ? record.id.match(/^barrow_(\d+)$/)?.[1] : undefined));

const belongsToReset = (record: JourneyAnnotation, stamps: JourneyResetStamp[]): boolean => Boolean(record)
  && typeof record === 'object' && stamps.some(stamp => {
  if (stamp.journeyId && record.journeyId) return record.journeyId === stamp.journeyId;
  const createdAt = annotationTime(record);
  return Boolean(stamp.startedAt && createdAt >= stamp.startedAt && createdAt <= stamp.resetAt);
});

/** Repair old saved leftovers without deleting the player's historical prose,
 * map geometry, pre-existing rumours, or landmarks from completed journeys. */
export const reconcileAbandonedJourneyAnnotations = <T extends JourneyAnnotationState>(state: T): T => {
  const stamps = journeyResetStamps(state);
  if (!stamps.length) return state;
  const barrows = Array.isArray(state.barrows) ? state.barrows.filter(record => !belongsToReset(record, stamps)) : state.barrows;
  const mapEncounterRecords = Array.isArray(state.mapEncounterRecords)
    ? state.mapEncounterRecords.filter(record => !belongsToReset(record, stamps)) : state.mapEncounterRecords;
  if (barrows?.length === state.barrows?.length && mapEncounterRecords?.length === state.mapEncounterRecords?.length) return state;
  return { ...state, barrows, mapEncounterRecords };
};

/** Derive visibility rather than deleting the generated note. Both the map
 * badge and the location's record list then return intact when restored. */
export const visibleMapEncounterRecords = <T extends JourneyAnnotation>(
  records: readonly T[] | undefined,
  barrows: readonly JourneyAnnotation[] | undefined
): T[] => (records || []).filter(record => record.sourceEncounterId !== 'foraging-forest-m-spring'
  || !(barrows || []).some(barrow => barrow.removed
    && barrow.id?.startsWith('bear-barrow:')
    && Boolean(barrow.locationId)
    && barrow.locationId === record.locationId));

/** A scoped recovery control: hide one landmark and its generated encounter
 * note, without completing a delve, granting rewards, or changing map paths.
 * Keep all notes in canonical state so restore and reload are lossless. */
export const setBarrowAnnotationRemoved = <T extends JourneyAnnotationState>(state: T, barrowId: string, removed: boolean): T => {
  const barrow = state.barrows?.find(row => row.id === barrowId);
  if (!barrow) return state;
  return {
    ...state,
    barrows: state.barrows?.map(row => row.id === barrowId ? { ...row, removed } : row)
  };
};
