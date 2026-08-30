// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { classifyDeviceSaveFailure, preferDeviceSave, readDeviceSave, removeDeviceSave, writeDeviceSave } from './deviceSave';

const appSource = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');

describe('device save fallback', () => {
  it('fails closed when IndexedDB is unavailable instead of throwing', async () => {
    await expect(readDeviceSave('campaign')).resolves.toBeNull();
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
