// @ts-expect-error Vitest runs this source integration check in Node; the app build exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source integration check in Node; the app build exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  calendarHistoryTimestamp,
  chronicleDateTimestamp,
  dedupeJourneyChronicles,
  isJourneyStartJournalId,
  newestJourneyArchiveEntries,
  promoteLegacyCalendarScrapbookRow,
  reconcileScrapbookMirrors,
  upsertJourneyChronicle,
  withoutChronicleMirrorCopies,
  type ScrapbookMirrorSource
} from './worldMemorySync';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');

interface ScrapbookRow {
  id: string;
  sourceId: string;
  title: string;
  text: string;
  mirrorSource?: ScrapbookMirrorSource;
}

const row = (
  id: string,
  sourceId: string,
  text: string,
  mirrorSource?: ScrapbookMirrorSource
): ScrapbookRow => ({ id, sourceId, title: sourceId, text, mirrorSource });

describe('world-memory scrapbook mirror reconciliation', () => {
  it('updates a Journal mirror, removes its deleted sibling, and preserves player scrapbook rows', () => {
    const personal = row('player-scrap', 'journal-kept', '플레이어가 따로 붙인 종이 조각');
    const result = reconcileScrapbookMirrors([
      row('scrap-journal-kept', 'journal-kept', '수정 전', 'journal'),
      row('scrap-journal-deleted', 'journal-deleted', '삭제 전', 'journal'),
      personal
    ], [
      row('scrap-journal-kept', 'journal-kept', '수정 후', 'journal'),
      row('scrap-journal-new', 'journal-new', '새 기록', 'journal')
    ]);

    expect(result.map(entry => entry.id)).toEqual([
      'scrap-journal-new', 'scrap-journal-kept', 'player-scrap'
    ]);
    expect(result.find(entry => entry.id === 'scrap-journal-kept')?.text).toBe('수정 후');
    expect(result.find(entry => entry.id === 'player-scrap')).toBe(personal);
    expect(result.some(entry => entry.sourceId === 'journal-deleted')).toBe(false);
  });

  it('upgrades recognized legacy mirrors while leaving unrecognized legacy data untouched', () => {
    const legacyMirror = row('legacy-generated', 'old-chronicle', '옛 사본');
    const independent = row('independent', 'missing-source', '출처와 무관한 보존 기록');
    const classifyLegacy = (entry: ScrapbookRow): ScrapbookMirrorSource | null =>
      entry.id === 'legacy-generated' ? 'chronicle' : null;

    const updated = reconcileScrapbookMirrors([legacyMirror, independent], [
      row('new-generated', 'old-chronicle', '수정된 연대기', 'chronicle')
    ], classifyLegacy);
    expect(updated).toEqual([
      row('new-generated', 'old-chronicle', '수정된 연대기', 'chronicle'),
      independent
    ]);

    const afterSourceDeletion = reconcileScrapbookMirrors(updated, [], classifyLegacy);
    expect(afterSourceDeletion).toEqual([independent]);
  });

  it('collapses duplicate desired and existing mirrors without touching non-mirrors', () => {
    const desired = row('new', 'same-source', '최신', 'journal');
    const independent = row('manual', 'same-source', '독립 스크랩');
    const result = reconcileScrapbookMirrors([
      row('old-a', 'same-source', '오래된 사본 A', 'journal'),
      row('old-b', 'same-source', '오래된 사본 B', 'journal'),
      independent
    ], [desired, { ...desired, id: 'duplicate-desired' }]);

    expect(result).toEqual([desired, independent]);
  });
});

describe('Journey memoir identity', () => {
  it('recognizes only current Journey-start memories, not the ending Journal mirrored by its Chronicle', () => {
    expect(isJourneyStartJournalId('journey:1720000000000:abc123:journal')).toBe(true);
    expect(isJourneyStartJournalId('journey:1720000000000:abc123:reflection')).toBe(true);
    expect(isJourneyStartJournalId('journey:1720000000000:abc123:ending:journal')).toBe(false);
    expect(isJourneyStartJournalId('travel:1720000000000:abc123:journal')).toBe(false);
  });

  it('keeps the newest occurrence when loading duplicate stable Chronicle ids', () => {
    const newest = { id: 'journey-1:ending:chronicle', text: '최신 회고', title: '여정' };
    const olderDuplicate = { ...newest, text: '오래된 중복 회고' };
    const other = { id: 'journey-0:ending:chronicle', text: '이전 여정', title: '이전' };

    expect(dedupeJourneyChronicles([newest, other, olderDuplicate, other])).toEqual([
      newest,
      other
    ]);
  });

  it('upserts a retried Journey Chronicle by its stable id', () => {
    const previous = { id: 'journey-1:ending:chronicle', text: '첫 저장', title: '첫 여정' };
    const corrected = { ...previous, text: '수정된 저장' };
    const unrelated = { id: 'journey-0:ending:chronicle', text: '이전 여정', title: '이전' };

    expect(upsertJourneyChronicle([previous, unrelated, previous], corrected)).toEqual([
      corrected,
      unrelated
    ]);
  });

  it('omits only Chronicle mirrors from a combined view and preserves same-source personal rows', () => {
    const chronicleIds = new Set(['journey-1:ending:chronicle']);
    const mirror = row('mirror', 'journey-1:ending:chronicle', '사본', 'chronicle');
    const personal = row('personal', 'journey-1:ending:chronicle', '내가 따로 붙인 기록');
    const other = row('other', 'other-source', '다른 여정', 'journal');

    expect(withoutChronicleMirrorCopies([mirror, personal, other], chronicleIds)).toEqual([
      personal,
      other
    ]);
  });
});

describe('Journey calendar scrapbook identity', () => {
  const identity = {
    legacyId: 'scrap:legacy-calendar',
    legacySourceId: 'legacy-calendar',
    scopedId: 'scrap:journey-2-calendar',
    scopedSourceId: 'journey-2-calendar',
    text: '1일째: Whitebirch로 1구간 이동.'
  };

  it('promotes only the exact generated legacy row and is idempotent', () => {
    const generated = {
      id: identity.legacyId,
      sourceId: identity.legacySourceId,
      kind: 'journey',
      text: identity.text,
      timestamp: 17
    };
    const independent = {
      id: 'player-scrap',
      sourceId: identity.legacySourceId,
      kind: 'journey',
      text: identity.text,
      timestamp: 29
    };

    const once = promoteLegacyCalendarScrapbookRow([generated, independent], identity);
    expect(once).toEqual([
      { ...generated, id: identity.scopedId, sourceId: identity.scopedSourceId },
      independent
    ]);
    expect(promoteLegacyCalendarScrapbookRow(once, identity)).toEqual(once);
  });

  it('removes the exact obsolete copy when a scoped row already exists', () => {
    const scoped = {
      id: identity.scopedId,
      sourceId: identity.scopedSourceId,
      kind: 'journey',
      text: identity.text
    };
    const legacy = {
      id: identity.legacyId,
      sourceId: identity.legacySourceId,
      kind: 'journey',
      text: identity.text
    };
    expect(promoteLegacyCalendarScrapbookRow([legacy, scoped], identity)).toEqual([scoped]);
  });

  it('keeps a bulk legacy calendar sync in oldest-to-newest timestamp order', () => {
    const now = 1_000;
    expect([0, 1, 2].map(index => calendarHistoryTimestamp(now, index, 3)))
      .toEqual([998, 999, 1_000]);
  });
});

describe('Living Archive chronology', () => {
  it('parses current Korean Chronicle dates and gives malformed legacy dates an explicit oldest fallback', () => {
    expect(chronicleDateTimestamp('2026년 8월 26일')).toBe(new Date(2026, 7, 26).getTime());
    expect(chronicleDateTimestamp('2026. 8. 26.')).toBe(new Date(2026, 7, 26).getTime());
    expect(chronicleDateTimestamp('언젠가의 여정')).toBe(0);
  });

  it('stably merges Chronicle and scrapbook rows newest-first', () => {
    const oldest = { id: 'chronicle-old', timestamp: 10 };
    const firstAtSameTime = { id: 'scrap-first', timestamp: 30 };
    const secondAtSameTime = { id: 'chronicle-second', timestamp: 30 };
    const newest = { id: 'scrap-new', timestamp: 40 };
    expect(newestJourneyArchiveEntries([oldest, firstAtSameTime, secondAtSameTime, newest]))
      .toEqual([newest, firstAtSameTime, secondAtSameTime, oldest]);
  });
});

describe('App world-memory integration', () => {
  it('routes save migration, world-memory sync, and Journey ending through stable mirror identities', () => {
    const syncSource = appSource.slice(
      appSource.indexOf('const syncWorldMemory ='),
      appSource.indexOf('const getCardSvgUrl =')
    );
    const endingSource = appSource.slice(
      appSource.indexOf('const handleEndJourney ='),
      appSource.indexOf('// BARROW DELVE HANDLERS')
    );
    const archiveSource = appSource.slice(
      appSource.indexOf('function LivingArchiveView'),
      appSource.indexOf('// 11. JOURNALS VIEW COMPONENT', appSource.indexOf('function LivingArchiveView'))
    );
    const journalSource = appSource.slice(
      appSource.indexOf('function JournalsView'),
      appSource.indexOf('// =================================================================', appSource.indexOf('function JournalsView') + 1)
    );

    expect(syncSource).toContain('travelScrapbook = reconcileScrapbookMirrors(');
    expect(syncSource).toContain('promoteLegacyCalendarScrapbookRow(');
    expect(syncSource).toContain("memoryKey('calendar', calendarJourneyId, String(idx), line)");
    expect(syncSource).toContain('calendarHistoryTimestamp(now, idx, calendarHistory.length)');
    expect(appSource).toContain('isJourneyStartJournalId(journal.id)');
    expect(syncSource).toContain("mirrorSource: 'journal'");
    expect(syncSource).toContain("mirrorSource: 'chronicle'");
    expect(syncSource).toContain('semantic: journal.semantic');
    expect(syncSource).toContain('semantic: createPlayerMemorySemantic(chronicle.text)');
    expect(endingSource).toContain('journeyChronicles: upsertJourneyChronicle(');
    expect(archiveSource).toContain('withoutChronicleMirrorCopies(');
    expect(archiveSource).toContain('newestJourneyArchiveEntries([');
    expect(archiveSource).toContain('chronicleDateTimestamp(c.date)');
    expect(archiveSource).toContain('const presentation = presentJournalEntry(entry);');
    expect(archiveSource).toContain('presentation.memory');
    expect(journalSource).toContain('const presentation = presentJournalEntry(entry);');
    expect(journalSource).toContain('presentation.memory');
    expect(appSource).toContain('journeyChronicles: dedupeJourneyChronicles(');
  });

  it('keeps Journal context player-facing and classifies a no-note familiar forage as an Encounter event', () => {
    const moveSource = appSource.slice(
      appSource.indexOf('const executeCanonicalTravelMoveTransaction ='),
      appSource.indexOf('const handleRecordExternalAilmentResolution =')
    );
    const forageStart = appSource.indexOf("if (pending.source === 'familiar-independent')");
    const forageSource = appSource.slice(forageStart, appSource.indexOf('const activePatient =', forageStart));

    expect(moveSource).toContain('journey: s.journeyGoalTitle || s.journey?.customGoal.title');
    expect(moveSource).not.toContain('journey: s.journey?.customGoal.title || s.journey?.goalId');
    expect(moveSource).toContain("category: 'activity'");
    expect(forageSource).toContain('semantic: createEncounterSemantic({');
    expect(forageSource).not.toContain('...createPlayerMemorySemantic(resolvedJournalNote)');
  });
});
