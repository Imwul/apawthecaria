import { describe, expect, it } from 'vitest';
import { enqueueOfflineSave, flushOfflineSaves, resolveRevisionConflict } from './saveQueue';

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

  it('[OFFLINE-003] chooses the higher revision without a false conflict', () => {
    expect(resolveRevisionConflict({ saveRevision: 5 }, { saveRevision: 4 }).source).toBe('local');
    expect(resolveRevisionConflict({ saveRevision: 4 }, { saveRevision: 5 }).source).toBe('cloud');
  });
});
