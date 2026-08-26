export type ScrapbookMirrorSource = 'journal' | 'chronicle';

export interface ScrapbookMirrorRecord {
  id: string;
  sourceId: string;
  /**
   * Identifies a derived copy owned by world-memory synchronisation.
   * Rows without this marker belong to the player or an older independent
   * scrapbook feature and must not be removed just because a source vanishes.
   */
  mirrorSource?: ScrapbookMirrorSource;
}

const readMirrorSource = (value: unknown): ScrapbookMirrorSource | null =>
  value === 'journal' || value === 'chronicle' ? value : null;

const mirrorKey = (source: ScrapbookMirrorSource, sourceId: string): string =>
  `${source}\u0000${sourceId}`;

/**
 * Current Journey transactions use `journey:<time>:<nonce>` as their stable
 * prefix. Only their start memory and optional departure reflection belong in
 * the scrapbook; ending journals are mirrored separately by the Chronicle.
 */
export const isJourneyStartJournalId = (id: string): boolean =>
  /^journey:[^:]+:[^:]+:(?:journal|reflection)$/.test(id);

export type LegacyScrapbookMirrorClassifier<T> = (entry: T) => ScrapbookMirrorSource | null;

/**
 * Reconciles only derived Journal/Chronicle scrapbook rows.
 *
 * Existing mirrors are updated in place, stale mirrors are removed, and a
 * duplicate mirror key collapses to one row. Unmarked, non-legacy rows are
 * carried through byte-for-byte even when they reuse a sourceId.
 */
export const reconcileScrapbookMirrors = <T extends ScrapbookMirrorRecord>(
  existing: readonly T[],
  desired: readonly T[],
  classifyLegacyMirror: LegacyScrapbookMirrorClassifier<T> = () => null
): T[] => {
  const desiredByKey = new Map<string, T>();
  const desiredKeys: string[] = [];
  for (const entry of desired) {
    const source = readMirrorSource(entry.mirrorSource);
    if (!source) continue;
    const key = mirrorKey(source, entry.sourceId);
    if (desiredByKey.has(key)) continue;
    desiredByKey.set(key, entry);
    desiredKeys.push(key);
  }

  const used = new Set<string>();
  const reconciled: T[] = [];
  for (const entry of existing) {
    const source = readMirrorSource(entry.mirrorSource) || classifyLegacyMirror(entry);
    if (!source) {
      reconciled.push(entry);
      continue;
    }
    const key = mirrorKey(source, entry.sourceId);
    const replacement = desiredByKey.get(key);
    if (!replacement || used.has(key)) continue;
    reconciled.push(replacement);
    used.add(key);
  }

  const missing = desiredKeys.flatMap(key => used.has(key) ? [] : [desiredByKey.get(key)!]);
  return [...missing, ...reconciled];
};

export const dedupeJourneyChronicles = <T extends { id: string }>(chronicles: readonly T[]): T[] => {
  const seen = new Set<string>();
  return chronicles.filter(entry => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
};

/** A retried Journey-ending commit replaces its stable Chronicle row. */
export const upsertJourneyChronicle = <T extends { id: string }>(
  chronicles: readonly T[],
  chronicle: T
): T[] => dedupeJourneyChronicles([
  chronicle,
  ...chronicles.filter(entry => entry.id !== chronicle.id)
]);

/**
 * Chronicle mirrors remain available in the scrapbook tab, but a combined
 * Chronicle + scrapbook surface should not render that same memoir twice.
 */
export const withoutChronicleMirrorCopies = <T extends ScrapbookMirrorRecord>(
  entries: readonly T[],
  chronicleIds: ReadonlySet<string>,
  classifyLegacyMirror: LegacyScrapbookMirrorClassifier<T> = () => null
): T[] => entries.filter(entry => {
  if (!chronicleIds.has(entry.sourceId)) return true;
  const source = readMirrorSource(entry.mirrorSource) || classifyLegacyMirror(entry);
  return source !== 'chronicle';
});

export interface CalendarScrapbookRecord {
  id: string;
  sourceId: string;
  kind: string;
  text: string;
}

export interface CalendarScrapbookIdentity {
  legacyId: string;
  legacySourceId: string;
  scopedId: string;
  scopedSourceId: string;
  text: string;
}

/**
 * Gives an application-generated calendar row its Journey-scoped identity.
 *
 * Older saves keyed these rows only by the line's index and text. When the
 * current Journey is upgraded, replace that exact generated row in place so a
 * reload does not create a second copy. Rows that merely reuse its source id,
 * but do not match the generated id/kind/text tuple, remain untouched.
 */
export const promoteLegacyCalendarScrapbookRow = <T extends CalendarScrapbookRecord>(
  entries: readonly T[],
  identity: CalendarScrapbookIdentity
): T[] => {
  if (identity.legacySourceId === identity.scopedSourceId) return [...entries];

  const scopedExists = entries.some(entry => entry.sourceId === identity.scopedSourceId);
  let promoted = false;
  return entries.flatMap(entry => {
    const exactGeneratedLegacyRow = entry.id === identity.legacyId
      && entry.sourceId === identity.legacySourceId
      && entry.kind === 'journey'
      && entry.text === identity.text;
    if (!exactGeneratedLegacyRow) return [entry];
    if (scopedExists || promoted) return [];
    promoted = true;
    return [{
      ...entry,
      id: identity.scopedId,
      sourceId: identity.scopedSourceId
    }];
  });
};

/** Parse current Korean Chronicle dates without inventing a date for malformed legacy text. */
export const chronicleDateTimestamp = (value: string): number => {
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) return parsed;

  const korean = value.match(/^(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  const dotted = value.match(/^(\d{4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/);
  const match = korean || dotted;
  if (!match) return 0;
  const timestamp = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

/** Stable newest-first ordering for the mixed Chronicle + scrapbook surface. */
export const newestJourneyArchiveEntries = <T extends { timestamp: number }>(entries: readonly T[]): T[] =>
  entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const leftTimestamp = Number.isFinite(left.entry.timestamp) ? left.entry.timestamp : 0;
      const rightTimestamp = Number.isFinite(right.entry.timestamp) ? right.entry.timestamp : 0;
      return rightTimestamp - leftTimestamp || left.index - right.index;
    })
    .map(({ entry }) => entry);

/** Preserve calendarHistory's oldest-to-newest push order during a bulk legacy sync. */
export const calendarHistoryTimestamp = (now: number, index: number, total: number): number =>
  now - Math.max(0, total - 1 - index);
