// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { classifyDeviceSaveFailure, isDeviceSavePointer, isUnavailableDeviceSave, persistDeviceSaveReplacement, preferDeviceSave, readDeviceSave, removeDeviceSave, writeDeviceSave } from './deviceSave';

const appSource = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');

const withDeviceDatabase = async (run: (fixture: {
  api: typeof import('./deviceSave');
  records: Map<string, string>;
  controls: { failReads: boolean; failWrites: boolean; holdWrites: boolean; beforeRead: (() => void) | null };
  pending: Array<{ complete: () => void; aborted: () => boolean }>;
}) => Promise<void>) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  const records = new Map<string, string>();
  const controls = { failReads: false, failWrites: false, holdWrites: false, beforeRead: null as (() => void) | null };
  const pending: Array<{ complete: () => void; aborted: () => boolean }> = [];
  const database = {
    close: vi.fn(), onclose: null, onversionchange: null,
    transaction: (_store: string, mode: string) => {
      let aborted = false;
      const changes: Array<() => void> = [];
      const transaction = {
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onabort: null as (() => void) | null,
        abort: () => { aborted = true; queueMicrotask(() => transaction.onabort?.()); },
        objectStore: () => ({
          get: (key: string) => {
            const request = { result: undefined as { key: string; value: string } | undefined,
              onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
            queueMicrotask(() => {
              controls.beforeRead?.();
              if (controls.failReads) request.onerror?.();
              else {
                request.result = records.has(key) ? { key, value: records.get(key)! } : undefined;
                request.onsuccess?.();
              }
            });
            return request;
          },
          put: (row: { key: string; value: string }) => changes.push(() => records.set(row.key, row.value)),
          add: (row: { key: string; value: string }) => changes.push(() => {
            if (records.has(row.key)) throw new Error('duplicate immutable generation');
            records.set(row.key, row.value);
          }),
          delete: (key: string) => changes.push(() => { records.delete(key); })
        })
      };
      const complete = () => {
        if (aborted) return;
        if (controls.failWrites) { transaction.onerror?.(); return; }
        try { changes.forEach(change => change()); transaction.oncomplete?.(); }
        catch { transaction.onerror?.(); }
      };
      if (mode === 'readwrite') {
        if (controls.holdWrites) pending.push({ complete, aborted: () => aborted });
        else queueMicrotask(complete);
      }
      return transaction;
    }
  };
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: { open: () => {
      const request = { result: database, onsuccess: null as (() => void) | null };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    } }
  });
  try {
    vi.resetModules();
    await run({ api: await import('./deviceSave'), records, controls, pending });
  } finally {
    vi.useRealTimers();
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous);
    else Reflect.deleteProperty(globalThis, 'indexedDB');
    vi.resetModules();
  }
};

describe('device save fallback', () => {
  it('does not start fallback writes or cleanup after ownership changes while opening IndexedDB', async () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
    const transaction = vi.fn();
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: {
        open: () => {
          const request = {
            result: { transaction, close: vi.fn(), onclose: null, onversionchange: null },
            onsuccess: null as (() => void) | null
          };
          queueMicrotask(() => request.onsuccess?.());
          return request;
        }
      }
    });
    try {
      vi.resetModules();
      const guarded = await import('./deviceSave');
      let current = true;
      const write = guarded.writeDeviceSave('campaign', 'stale', () => current);
      const cleanup = guarded.removeDeviceSave('campaign', () => current);
      current = false;
      expect(await write).toBe(false);
      expect(await cleanup).toBe(false);
      expect(transaction).not.toHaveBeenCalled();
    } finally {
      if (previous) Object.defineProperty(globalThis, 'indexedDB', previous);
      else Reflect.deleteProperty(globalThis, 'indexedDB');
      vi.resetModules();
    }
  });

  it('fails closed when IndexedDB is unavailable instead of throwing', async () => {
    expect(isUnavailableDeviceSave(await readDeviceSave('campaign'))).toBe(true);
    await expect(writeDeviceSave('campaign', '{}')).resolves.toBe(false);
    await expect(removeDeviceSave('campaign')).resolves.toBe(false);
  });

  it('does not let an older localStorage copy hide a newer fallback snapshot', () => {
    const local = JSON.stringify({ bio: { name: 'Old' }, saveRevision: 3 });
    const fallback = JSON.stringify({ bio: { name: 'New' }, saveRevision: 4 });
    expect(preferDeviceSave(local, fallback)).toBe(fallback);
    expect(preferDeviceSave('{broken', fallback)).toBe(fallback);
    expect(preferDeviceSave(local, JSON.stringify({ bio: { name: 'Stale' }, saveRevision: 2 }))).toBe(local);
    expect(preferDeviceSave('{broken', null)).toBe('{broken');
  });

  it('preserves both old stores if even the small replacement pointer is denied', async () => {
    const campaignA = JSON.stringify({ bio: { name: 'A' }, saveRevision: 100 });
    const campaignB = JSON.stringify({ bio: { name: 'B' }, saveRevision: 10 });
    let fallback: string | null = null;
    const storage = { getItem: () => campaignA, setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } };
    const removeFallback = vi.fn(async () => { fallback = null; return true; });
    expect(await persistDeviceSaveReplacement('campaign', campaignB, {
      storage, readFallback: async () => fallback, removeFallback,
      stageSnapshot: async () => true
    })).toEqual({ localSaved: false, localFailure: 'quota' });
    expect(removeFallback).not.toHaveBeenCalled();
    expect(preferDeviceSave(storage.getItem(), fallback)).toBe(campaignA);
    expect(fallback).toBeNull();
  });

  it('never promotes or deletes the old fallback before a successful pointer commit', async () => {
    for (const failAt of ['stage', 'pointer', 'stale']) {
      let primary = JSON.stringify({ bio: { name: 'A' }, saveRevision: 100 });
      let fallback: string | null = JSON.stringify({ bio: { name: 'A' }, saveRevision: 101 });
      const originalPrimary = primary;
      const latestA = fallback;
      const campaignB = JSON.stringify({ bio: { name: 'B' }, saveRevision: 10 });
      let current = true;
      const storage = {
        getItem: () => primary,
        setItem: (_key: string, value: string) => {
          if (failAt === 'pointer') throw new DOMException('full', 'QuotaExceededError');
          primary = value;
        }
      };
      const removeFallback = vi.fn(async () => { fallback = null; return true; });
      const result = await persistDeviceSaveReplacement('campaign', campaignB, {
        storage, readFallback: async () => fallback,
        removeFallback, stillCurrent: () => current,
        stageSnapshot: async () => {
          if (failAt === 'stale') current = false;
          return failAt !== 'stage';
        }
      });
      expect(result.localSaved).toBe(false);
      expect(primary).toBe(originalPrimary);
      expect(fallback).toBe(latestA);
      expect(removeFallback).not.toHaveBeenCalled();
      expect(preferDeviceSave(primary, fallback)).toBe(latestA);
    }
  });

  it('restores selected B after reload even when the old fallback A had a larger revision', async () => {
    let primary = JSON.stringify({ bio: { name: 'A' }, saveRevision: 100 });
    let fallback: string | null = JSON.stringify({ bio: { name: 'A' }, saveRevision: 101 });
    const campaignB = JSON.stringify({ bio: { name: 'B' }, saveRevision: 10 });
    const storage = { getItem: () => primary, setItem: (_key: string, value: string) => { primary = value; } };
    let staged: string | null = null;
    expect(await persistDeviceSaveReplacement('campaign', campaignB, {
      storage, readFallback: async () => fallback,
      removeFallback: async () => { fallback = null; return true; },
      stageSnapshot: async (_key, value) => { staged = value; return true; }
    })).toEqual({ localSaved: true, localFailure: null });
    expect(isDeviceSavePointer(primary)).toBe(true);
    expect(preferDeviceSave(primary, staged)).toBe(campaignB);
    expect(fallback).not.toBeNull();
  });

  it('never persists a stale-account replacement after either asynchronous storage barrier', async () => {
    for (const staleDuring of ['read', 'stage']) {
      const campaignA = JSON.stringify({ bio: { name: 'A' }, saveRevision: 100 });
      const campaignB = JSON.stringify({ bio: { name: 'B' }, saveRevision: 10 });
      let primary = campaignA;
      let current = true;
      const setItem = vi.fn((_key: string, value: string) => { primary = value; });
      const result = await persistDeviceSaveReplacement('campaign', campaignB, {
        storage: { getItem: () => primary, setItem },
        readFallback: async () => { if (staleDuring === 'read') current = false; return campaignA; },
        stageSnapshot: async () => { if (staleDuring === 'stage') current = false; return true; },
        stillCurrent: () => current
      });
      expect(result.localSaved).toBe(false);
      expect(setItem).not.toHaveBeenCalledWith('campaign', campaignB);
      expect(primary).toBe(campaignA);
    }
  });

  it('retries IndexedDB after a transient open failure instead of disabling fallback for the tab', async () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
    let openAttempts = 0;
    const database = {
      close: vi.fn(),
      onclose: null as (() => void) | null,
      onversionchange: null as (() => void) | null,
      transaction: vi.fn(() => {
        const transaction = {
          oncomplete: null as (() => void) | null,
          onerror: null as (() => void) | null,
          onabort: null as (() => void) | null,
          objectStore: () => ({ put: vi.fn() })
        };
        queueMicrotask(() => transaction.oncomplete?.());
        return transaction;
      })
    };
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: {
        open: () => {
          openAttempts += 1;
          if (openAttempts === 1) throw new DOMException('temporarily blocked', 'InvalidStateError');
          const request = {
            result: database,
            onupgradeneeded: null as (() => void) | null,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
            onblocked: null as (() => void) | null
          };
          queueMicrotask(() => request.onsuccess?.());
          return request;
        }
      }
    });

    try {
      await expect(writeDeviceSave('campaign', '{"saveRevision":1}')).resolves.toBe(false);
      await expect(writeDeviceSave('campaign', '{"saveRevision":2}')).resolves.toBe(true);
      expect(openAttempts).toBe(2);
    } finally {
      database.onversionchange?.();
      if (previous) Object.defineProperty(globalThis, 'indexedDB', previous);
      else Reflect.deleteProperty(globalThis, 'indexedDB');
    }
  });

  it('does not call every blocked device store a capacity problem', () => {
    expect(classifyDeviceSaveFailure({ name: 'QuotaExceededError' })).toBe('quota');
    expect(classifyDeviceSaveFailure({ code: 22 })).toBe('quota');
    expect(classifyDeviceSaveFailure({ name: 'SecurityError', message: 'Storage access denied' })).toBe('unavailable');
    expect(classifyDeviceSaveFailure(new Error('IndexedDB timed out'))).toBe('unavailable');
  });

  it('does not tell the player that the physical device is out of space', () => {
    expect(appSource).not.toMatch(/기기 저장 공간 부족|브라우저 저장 공간 부족|로컬 저장 공간이 부족/);
    expect(appSource).toContain('사이트 데이터 한도나 비공개 탐색 제한');
  });
});

describe('quota-only authoritative device pointers', () => {
  const campaignA = JSON.stringify({ bio: { name: 'A' }, saveRevision: 100 });
  const campaignB = JSON.stringify({ bio: { name: 'B' }, saveRevision: 10 });
  const pointer = (snapshotKey: string, format = 'apawthecaria-device-save-pointer-v1') => JSON.stringify({ format, snapshotKey });

  it('restores a lower revision on reload while preserving the superseded legacy stores', async () => {
    await withDeviceDatabase(async ({ api, records }) => {
      let primary = campaignA;
      records.set('campaign', campaignA);
      const storage = { getItem: () => primary, setItem: (_key: string, value: string) => {
        if (!api.isDeviceSavePointer(value)) throw new DOMException('full', 'QuotaExceededError');
        primary = value;
      } };
      expect(await api.persistDeviceSaveReplacement('campaign', campaignB, { storage }))
        .toEqual({ localSaved: true, localFailure: null });
      expect(api.isDeviceSavePointer(primary)).toBe(true);
      expect(records.get('campaign')).toBe(campaignA);
      expect(api.preferDeviceSave(primary, await api.readDeviceSave('campaign', storage, primary))).toBe(campaignB);
      expect(await api.removeDeviceSave('campaign', undefined, storage)).toBe(false);
      expect(await api.readDeviceSave('campaign', storage)).toBe(campaignB);
    });
  });

  it('falls back to a tiny pointer when only the full primary replacement exceeds quota', async () => {
    await withDeviceDatabase(async ({ api }) => {
      let primary = campaignA;
      const storage = { getItem: () => primary, setItem: (_key: string, value: string) => {
        if (!api.isDeviceSavePointer(value)) throw new DOMException('full', 'QuotaExceededError');
        primary = value;
      } };
      expect((await api.persistDeviceSaveReplacement('campaign', campaignB, { storage })).localSaved).toBe(true);
      expect(await api.readDeviceSave('campaign', storage)).toBe(campaignB);
    });
  });

  it('keeps subsequent saves pointed and cleans only obsolete immutable generations', async () => {
    await withDeviceDatabase(async ({ api, records }) => {
      let primary = pointer('campaign::snapshot::old');
      records.set('campaign::snapshot::old', campaignB);
      records.set('campaign', campaignA);
      const storage = { getItem: () => primary, setItem: (_key: string, value: string) => { primary = value; } };
      const next = JSON.stringify({ bio: { name: 'B' }, saveRevision: 11 });
      expect(await api.writeDeviceSave('campaign', next, () => true, storage)).toBe(true);
      expect(api.isDeviceSavePointer(primary)).toBe(true);
      expect(await api.readDeviceSave('campaign', storage)).toBe(next);
      expect(records.has('campaign::snapshot::old')).toBe(false);
      expect(records.get('campaign')).toBe(campaignA);
      expect(records.get(JSON.parse(primary).snapshotKey)).toBe(next);
    });
  });

  it('fails closed on missing, unavailable, invalid-version, or cross-key pointer targets', async () => {
    await withDeviceDatabase(async ({ api, records, controls }) => {
      records.set('campaign', campaignA);
      records.set('campaign::snapshot::exists', campaignB);
      for (const raw of [pointer('campaign::snapshot::missing'), pointer('other::snapshot::exists'),
        pointer('campaign::snapshot::exists', 'apawthecaria-device-save-pointer-v2')]) {
        const result = await api.readDeviceSave('campaign', { getItem: () => raw });
        expect(api.isUnavailableDeviceSave(result)).toBe(true);
        expect(api.isUnavailableDeviceSave(api.preferDeviceSave(campaignA, result))).toBe(true);
      }
      controls.failReads = true;
      expect(api.isUnavailableDeviceSave(await api.readDeviceSave('campaign', { getItem: () => pointer('campaign::snapshot::exists') }))).toBe(true);
      const unavailableLegacy = await api.readDeviceSave('campaign', { getItem: () => campaignA });
      expect(api.isUnavailableDeviceSave(unavailableLegacy)).toBe(true);
      expect(api.isUnavailableDeviceSave(api.preferDeviceSave(campaignA, unavailableLegacy))).toBe(true);
      expect(isUnavailableDeviceSave(preferDeviceSave(pointer('campaign::snapshot::missing'), null))).toBe(true);
    });
  });

  it('does not infer absent fallback from a failed read before lower-revision replacement', async () => {
    await withDeviceDatabase(async ({ api, records, controls }) => {
      let primary = campaignA;
      records.set('campaign', campaignA);
      controls.failReads = true;
      const storage = { getItem: () => primary, setItem: (_key: string, value: string) => { primary = value; } };
      expect((await api.persistDeviceSaveReplacement('campaign', campaignB, { storage })).localSaved).toBe(true);
      expect(api.isDeviceSavePointer(primary)).toBe(true);
      controls.failReads = false;
      expect(api.preferDeviceSave(primary, await api.readDeviceSave('campaign', storage))).toBe(campaignB);
      expect(records.get('campaign')).toBe(campaignA);
    });
  });

  it('detects pointer and legacy-primary changes across asynchronous reads', async () => {
    await withDeviceDatabase(async ({ api, records, controls }) => {
      records.set('campaign', campaignA);
      records.set('campaign::snapshot::old', campaignB);
      for (const starting of [campaignA, pointer('campaign::snapshot::old')]) {
        let primary = starting;
        controls.beforeRead = () => { primary = pointer('campaign::snapshot::new'); };
        const result = await api.readDeviceSave('campaign', { getItem: () => primary }, starting);
        expect(api.isUnavailableDeviceSave(result)).toBe(true);
      }
      expect(api.isUnavailableDeviceSave(await api.readDeviceSave('campaign', { getItem: () => campaignB }, campaignA))).toBe(true);
    });
  });

  it('leaves the previous pointer and target intact when staging or pointer commit fails', async () => {
    await withDeviceDatabase(async ({ api, records, controls }) => {
      const original = pointer('campaign::snapshot::old');
      let primary = original;
      records.set('campaign::snapshot::old', campaignB);
      for (const failure of ['stage', 'pointer']) {
        controls.failWrites = failure === 'stage';
        const storage = { getItem: () => primary, setItem: (_key: string, value: string) => {
          if (failure === 'pointer') throw new DOMException('full', 'QuotaExceededError');
          primary = value;
        } };
        expect(await api.writeDeviceSave('campaign', campaignA, () => true, storage)).toBe(false);
        expect(primary).toBe(original);
        expect(records.get('campaign::snapshot::old')).toBe(campaignB);
      }
    });
  });

  it('aborts timed-out staging and cleanup so late completion cannot publish or erase data', async () => {
    await withDeviceDatabase(async ({ api, records, controls, pending }) => {
      vi.useFakeTimers();
      let primary = campaignA;
      records.set('campaign', campaignA);
      controls.holdWrites = true;
      const storage = { getItem: () => primary, setItem: (_key: string, value: string) => { primary = value; } };
      const replacement = api.persistDeviceSaveReplacement('campaign', campaignB, { storage });
      await vi.advanceTimersByTimeAsync(1501);
      expect((await replacement).localSaved).toBe(false);
      expect(primary).toBe(campaignA);
      expect(pending.length).toBe(1);
      expect(pending[0].aborted()).toBe(true);
      pending[0].complete();
      expect([...records.keys()]).toEqual(['campaign']);
      const cleanup = api.removeDeviceSave('campaign', () => true, storage);
      await vi.advanceTimersByTimeAsync(1501);
      expect(await cleanup).toBe(false);
      expect(pending[1].aborted()).toBe(true);
      pending[1].complete();
      expect(records.get('campaign')).toBe(campaignA);
    });
  });
});
