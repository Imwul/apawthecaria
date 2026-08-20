import { describe, expect, it } from 'vitest';
import { enqueueOfflineSave, flushOfflineSaves, normalizeOfflineSaveEntries, resolveRevisionConflict } from './saveQueue';

describe('Phase 5 local-first persistence', () => {
  it('[SAVE-006/SAVE-008] preserves local state on a same-revision conflict', () => {
    const result = resolveRevisionConflict({ saveRevision: 4, marker: 'local' }, { saveRevision: 4, marker: 'cloud' });
    expect(result).toMatchObject({ source: 'local', conflict: true, state: { marker: 'local' } });
  });

  it('[OFFLINE-001/OFFLINE-002] coalesces older writes and retries delayed cloud saves', async () => {
    let outbox = enqueueOfflineSave([], { id: 'one', key: 'save', payload: 'v1', revision: 1, queuedAt: 1 });
    outbox = enqueueOfflineSave(outbox, { id: 'two', key: 'save', payload: 'v2', revision: 2, queuedAt: 2 });
    expect(outbox.map(row => row.revision)).toEqual([2]);
    let attempt = 0;
    const first = await flushOfflineSaves(outbox, async () => { attempt += 1; throw new Error('offline'); });
    expect(first.remaining[0]).toMatchObject({ attempts: 1, lastError: 'offline' });
    const second = await flushOfflineSaves(first.remaining, async () => { attempt += 1; });
    expect(second).toEqual({ remaining: [], completed: ['two'] });
    expect(attempt).toBe(2);
  });

  it('never re-enqueues or flushes an older campaign revision after a newer one', async () => {
    const newer = { id: 'newer', key: 'save', payload: 'v9', revision: 9, queuedAt: 9, attempts: 0, lastError: null };
    const staleInput = { id: 'stale', key: 'save', payload: 'v8', revision: 8, queuedAt: 10 };
    expect(enqueueOfflineSave([newer], staleInput)).toEqual([newer]);

    const written: string[] = [];
    const result = await flushOfflineSaves([
      { ...newer, queuedAt: 8 },
      { id: 'legacy-stale', key: 'save', payload: 'v7', revision: 7, queuedAt: 9, attempts: 2, lastError: 'offline' }
    ], async entry => { written.push(entry.payload); });

    expect(written).toEqual(['v9']);
    expect(result).toEqual({ remaining: [], completed: ['newer'] });
  });

  it('keeps only the latest payload when the same revision was queued twice', async () => {
    const written: string[] = [];
    await flushOfflineSaves([
      { id: 'first', key: 'save', payload: 'old-payload', revision: 5, queuedAt: 1, attempts: 0, lastError: null },
      { id: 'second', key: 'save', payload: 'new-payload', revision: 5, queuedAt: 2, attempts: 0, lastError: null }
    ], async entry => { written.push(entry.payload); });
    expect(written).toEqual(['new-payload']);
  });

  it('recovers a partially malformed persisted outbox without throwing', () => {
    expect(normalizeOfflineSaveEntries({ not: 'an array' })).toEqual([]);
    expect(normalizeOfflineSaveEntries([
      null,
      { id: 'valid', key: 'save', payload: '{}', revision: '8', attempts: -1, queuedAt: '12', lastError: 7 },
      { id: 'missing-payload', key: 'save' }
    ])).toEqual([{
      id: 'valid', key: 'save', payload: '{}', revision: 8, attempts: 0, queuedAt: 12, lastError: null
    }]);
  });

  it('[OFFLINE-003] chooses the higher revision without a false conflict', () => {
    expect(resolveRevisionConflict({ saveRevision: 5 }, { saveRevision: 4 }).source).toBe('local');
    expect(resolveRevisionConflict({ saveRevision: 4 }, { saveRevision: 5 }).source).toBe('cloud');
  });
});
