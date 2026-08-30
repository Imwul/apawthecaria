import { describe, expect, it } from 'vitest';
import { enqueueOfflineSave, flushOfflineSaves, normalizeOfflineSaveEntries, offlineSaveRequiresManualResolution, reconcileOfflineSaveFlush, removeOfflineSavesThroughRevision, resolveRevisionConflict } from './saveQueue';

const queued = (input: { id: string; payload: string; revision: number; queuedAt: number; ownerUid?: string; slot?: 1 | 2 | 3 }) => ({
  ...input,
  key: 'save',
  ownerUid: input.ownerUid || 'user-a',
  slot: input.slot || 1
});

describe('Phase 5 local-first persistence', () => {
  it('[SAVE-006/SAVE-008] preserves local state on a same-revision conflict', () => {
    const result = resolveRevisionConflict({ saveRevision: 4, marker: 'local' }, { saveRevision: 4, marker: 'cloud' });
    expect(result).toMatchObject({ source: 'local', conflict: true, state: { marker: 'local' } });
  });

  it('[OFFLINE-001/OFFLINE-002] coalesces older writes and retries delayed cloud saves', async () => {
    let outbox = enqueueOfflineSave([], queued({ id: 'one', payload: 'v1', revision: 1, queuedAt: 1 }));
    outbox = enqueueOfflineSave(outbox, queued({ id: 'two', payload: 'v2', revision: 2, queuedAt: 2 }));
    expect(outbox.map(row => row.revision)).toEqual([2]);
    let attempt = 0;
    const first = await flushOfflineSaves(outbox, async () => { attempt += 1; throw new Error('offline'); });
    expect(first.remaining[0]).toMatchObject({ attempts: 1, lastError: 'offline' });
    const second = await flushOfflineSaves(first.remaining, async () => { attempt += 1; });
    expect(second).toEqual({ remaining: [], completed: ['two'] });
    expect(attempt).toBe(2);
  });

  it('never re-enqueues or flushes an older campaign revision after a newer one', async () => {
    const newer = { ...queued({ id: 'newer', payload: 'v9', revision: 9, queuedAt: 9 }), attempts: 0, lastError: null };
    const staleInput = queued({ id: 'stale', payload: 'v8', revision: 8, queuedAt: 10 });
    expect(enqueueOfflineSave([newer], staleInput)).toEqual([newer]);

    const written: string[] = [];
    const result = await flushOfflineSaves([
      { ...newer, queuedAt: 8 },
      { ...queued({ id: 'legacy-stale', payload: 'v7', revision: 7, queuedAt: 9 }), attempts: 2, lastError: 'offline' }
    ], async entry => { written.push(entry.payload); });

    expect(written).toEqual(['v9']);
    expect(result).toEqual({ remaining: [], completed: ['legacy-stale', 'newer'] });
  });

  it('keeps only the latest payload when the same revision was queued twice', async () => {
    const written: string[] = [];
    const result = await flushOfflineSaves([
      { ...queued({ id: 'first', payload: 'old-payload', revision: 5, queuedAt: 1 }), attempts: 0, lastError: null },
      { ...queued({ id: 'second', payload: 'new-payload', revision: 5, queuedAt: 2 }), attempts: 0, lastError: null }
    ], async entry => { written.push(entry.payload); });
    expect(written).toEqual(['new-payload']);
    expect(result).toEqual({ remaining: [], completed: ['first', 'second'] });
  });

  it('removes superseded rows while retaining only the newest failed write for retry', async () => {
    const rows = [
      { ...queued({ id: 'old', payload: 'v4', revision: 4, queuedAt: 1 }), attempts: 0, lastError: null },
      { ...queued({ id: 'latest', payload: 'v5', revision: 5, queuedAt: 2 }), attempts: 0, lastError: null }
    ];
    const flushed = await flushOfflineSaves(rows, async () => { throw new Error('offline'); });
    expect(flushed.completed).toEqual(['old']);
    expect(flushed.remaining).toEqual([
      expect.objectContaining({ id: 'latest', payload: 'v5', attempts: 1, lastError: 'offline' })
    ]);
    expect(reconcileOfflineSaveFlush(rows, flushed).map(entry => entry.id)).toEqual(['latest']);
  });

  it('recovers a partially malformed persisted outbox without throwing', () => {
    expect(normalizeOfflineSaveEntries({ not: 'an array' })).toEqual([]);
    expect(normalizeOfflineSaveEntries([
      null,
      { id: 'valid', key: 'save', payload: '{}', revision: '8', attempts: -1, queuedAt: '12', lastError: 7 },
      { id: 'missing-payload', key: 'save' }
    ])).toEqual([{
      id: 'valid', key: 'save', payload: '{}', revision: 8, ownerUid: null, slot: null, attempts: 0, queuedAt: 12, lastError: null
    }]);
  });

  it('keeps queued writes isolated by account and slot', async () => {
    let outbox = enqueueOfflineSave([], queued({ id: 'a1', payload: 'a-slot-1', revision: 2, queuedAt: 1, ownerUid: 'user-a', slot: 1 }));
    outbox = enqueueOfflineSave(outbox, queued({ id: 'a2', payload: 'a-slot-2', revision: 3, queuedAt: 2, ownerUid: 'user-a', slot: 2 }));
    outbox = enqueueOfflineSave(outbox, queued({ id: 'b1', payload: 'b-slot-1', revision: 4, queuedAt: 3, ownerUid: 'user-b', slot: 1 }));
    expect(outbox).toHaveLength(3);

    const userAWrites: string[] = [];
    const userA = outbox.filter(entry => entry.ownerUid === 'user-a');
    const otherAccounts = outbox.filter(entry => entry.ownerUid !== 'user-a');
    const flushed = await flushOfflineSaves(userA, async entry => { userAWrites.push(`${entry.slot}:${entry.payload}`); });

    expect(userAWrites).toEqual(['1:a-slot-1', '2:a-slot-2']);
    expect([...otherAccounts, ...flushed.remaining].map(entry => entry.payload)).toEqual(['b-slot-1']);
  });

  it('clears only the uploaded account and slot through the uploaded revision', () => {
    const outbox = [
      { ...queued({ id: 'old', payload: 'old', revision: 4, queuedAt: 1, ownerUid: 'user-a', slot: 1 }), attempts: 1, lastError: 'offline' },
      { ...queued({ id: 'new', payload: 'new', revision: 6, queuedAt: 2, ownerUid: 'user-a', slot: 1 }), attempts: 0, lastError: null },
      { ...queued({ id: 'other-slot', payload: 'slot-2', revision: 3, queuedAt: 3, ownerUid: 'user-a', slot: 2 }), attempts: 0, lastError: null },
      { ...queued({ id: 'other-user', payload: 'user-b', revision: 3, queuedAt: 4, ownerUid: 'user-b', slot: 1 }), attempts: 0, lastError: null }
    ];
    expect(removeOfflineSavesThroughRevision(outbox, { key: 'save', ownerUid: 'user-a', slot: 1, revision: 4 }).map(row => row.id))
      .toEqual(['new', 'other-slot', 'other-user']);
  });

  it('does not erase a newer save queued while an older cloud write is in flight', () => {
    const inFlight = { ...queued({ id: 'old', payload: 'old', revision: 4, queuedAt: 1 }), attempts: 0, lastError: null };
    const queuedDuringWrite = { ...queued({ id: 'new', payload: 'new', revision: 5, queuedAt: 2 }), attempts: 0, lastError: null };
    const reconciled = reconcileOfflineSaveFlush([queuedDuringWrite], { completed: [inFlight.id], remaining: [] });
    expect(reconciled.map(entry => entry.id)).toEqual(['new']);
  });

  it('[OFFLINE-003] chooses the higher revision without a false conflict', () => {
    expect(resolveRevisionConflict({ saveRevision: 5 }, { saveRevision: 4 }).source).toBe('local');
    expect(resolveRevisionConflict({ saveRevision: 4 }, { saveRevision: 5 }).source).toBe('cloud');
  });

  it('stops retrying deletions and revision conflicts that require an explicit player choice', () => {
    expect(offlineSaveRequiresManualResolution('cloud-slot-deleted')).toBe(true);
    expect(offlineSaveRequiresManualResolution('cloud-slot-newer')).toBe(true);
    expect(offlineSaveRequiresManualResolution('network-request-failed')).toBe(false);
    expect(offlineSaveRequiresManualResolution(null)).toBe(false);
  });
});
