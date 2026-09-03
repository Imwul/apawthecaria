// @ts-expect-error Vitest runs this source audit in Node; app compilation exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; app compilation exposes browser types only.
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { createCampaignWriteOwnership } from './campaignWriteOwnership';

// App owns these non-exported barriers. Audit the integration separately from
// the IndexedDB helper tests so a safe helper cannot hide an unsafe caller.
const appSource = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');

const region = (source: string, start: string, end: string) => {
  const startIndex = source.indexOf(start);
  expect(startIndex, `missing source boundary: ${start}`).toBeGreaterThanOrEqual(0);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex, `missing source boundary: ${end}`).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
};

const expectInOrder = (source: string, ...statements: string[]) => {
  let previous = -1;
  for (const statement of statements) {
    const index = source.indexOf(statement);
    expect(index, `missing or out-of-order statement: ${statement}`).toBeGreaterThan(previous);
    previous = index;
  }
};

describe('App device-save queue integration', () => {
  it('serializes rapid pointer writes and keeps the queue usable after a rejection', () => {
    const write = region(appSource, 'const writeDeviceSave =', 'const removeDeviceSave =');
    expect(appSource).toContain('let deviceSaveWriteQueue: Promise<boolean> = Promise.resolve(true);');
    expectInOrder(write,
      'deviceSaveWriteQueue = deviceSaveWriteQueue.catch(() => false).then(() => {',
      'return writePersistedDeviceSave(',
      'return deviceSaveWriteQueue;'
    );
  });

  it('captures replacement generation, account, and slot when each edit is enqueued', () => {
    const write = region(appSource, 'const writeDeviceSave =', 'const removeDeviceSave =');
    expectInOrder(write,
      'const generation = deviceSaveReplacementGeneration;',
      'const owner = readCloudAccountBinding();',
      'const slot = readActiveCloudSlot();',
      'deviceSaveWriteQueue = deviceSaveWriteQueue.catch(() => false).then(() => {'
    );
    const queued = write.slice(write.indexOf('.then(() => {'));
    expect(queued).toContain('generation === deviceSaveReplacementGeneration');
    expect(queued).toContain('&& ensureCurrentCampaignWrite()');
    expect(queued).toContain('readCloudAccountBinding() === owner');
    expect(queued).toContain('readActiveCloudSlot() === slot');
  });

  it('captures ownership only after earlier own writes finish, preserving the newer rapid edit', () => {
    const write = region(appSource, 'const writeDeviceSave =', 'const removeDeviceSave =');
    const checkpoint = 'campaignWriteOwnership.checkpoint()';
    expect(write.split(checkpoint)).toHaveLength(2);
    expectInOrder(write,
      '.then(() => {',
      'if (!stillCurrent()) return false;',
      `const stillOwned = ${checkpoint};`,
      'return writePersistedDeviceSave(key, value, () => stillCurrent() && stillOwned(), guardedDeviceSaveStorage);'
    );
  });

  it('invalidates old edits and drains the queue before committing an explicit replacement', () => {
    const hydrate = region(appSource, 'const persistHydratedCampaignLocally =', 'const exportRawCampaignSave =');
    const replacement = region(hydrate, 'if (replacingCampaign) {', '\n  if (isDeviceSavePointer(');
    expectInOrder(replacement,
      'const generation = ++deviceSaveReplacementGeneration;',
      'await deviceSaveWriteQueue.catch(() => false);',
      'const replacementStillCurrent = () => generation === deviceSaveReplacementGeneration',
      'if (!replacementStillCurrent()) return { localSaved: false, localFailure: null };',
      'return persistDeviceSaveReplacement(CAMPAIGN_SAVE_KEY, snapshot, {'
    );
    expect(replacement).toContain('&& ensureCurrentCampaignWrite() && stillCurrent?.() !== false');
    expect(replacement).toContain('stillCurrent: replacementStillCurrent');
    expect(replacement).toContain('storage: guardedDeviceSaveStorage');
  });

  it('routes ordinary pointer hydration through the same queue instead of replacing the pointer directly', () => {
    const hydrate = region(appSource, 'const persistHydratedCampaignLocally =', 'const exportRawCampaignSave =');
    expectInOrder(hydrate,
      'if (isDeviceSavePointer(safeLocalStorageGetItem(CAMPAIGN_SAVE_KEY))) {',
      'const localSaved = await writeDeviceSave(CAMPAIGN_SAVE_KEY, snapshot);',
      "return { localSaved, localFailure: localSaved ? null : 'unavailable' as const };",
      'campaignWriteOwnership.write(() => localStorage.setItem(CAMPAIGN_SAVE_KEY, snapshot));'
    );
  });
});

type SaveResult = { localSaved: boolean; localFailure: 'quota' | 'unavailable' | null };
type PendingWrite = { value: string; complete: () => void; reject: () => void };
type AppSaveHelpers = {
  writeDeviceSave: (key: string, value: string) => Promise<boolean>;
  persistHydratedCampaignLocally: (state: object, replacing: boolean, stillCurrent?: () => boolean) => Promise<SaveResult>;
  replacementGeneration: () => number;
};

// Execute only the real App wrappers, not an independently reimplemented
// queue. Injected persistence writes model an asynchronous immutable stage
// followed by its guarded pointer commit, without importing/mounting App.
const extractedHelpers = ts.transpileModule([
  region(appSource, 'let deviceSaveReplacementGeneration =', 'const removeDeviceSave ='),
  region(appSource, 'const persistHydratedCampaignLocally =', 'const exportRawCampaignSave =')
].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;

const createExtractedHelpers = new Function('dependencies', `
  const {
    campaignWriteOwnership, ensureCurrentCampaignWrite,
    readCloudAccountBinding, readActiveCloudSlot, writePersistedDeviceSave,
    guardedDeviceSaveStorage, persistDeviceSaveReplacement, CAMPAIGN_SAVE_KEY,
    removeDeviceSave, isDeviceSavePointer, safeLocalStorageGetItem,
    localStorage, classifyDeviceSaveFailure
  } = dependencies;
  ${extractedHelpers}
  return {
    writeDeviceSave, persistHydratedCampaignLocally,
    replacementGeneration: () => deviceSaveReplacementGeneration
  };
`) as (dependencies: Record<string, unknown>) => AppSaveHelpers;

const queueFixture = () => {
  const shared = { primary: 'pointer-0', owner: 'account-a', slot: 1 };
  const ownership = createCampaignWriteOwnership(() => [shared.primary, shared.owner, String(shared.slot)]);
  const checkpoint = vi.fn(ownership.checkpoint);
  const committed: string[] = [];
  const pending: PendingWrite[] = [];
  const storage = {
    getItem: () => shared.primary,
    setItem: (_key: string, value: string) => ownership.write(() => { shared.primary = value; })
  };
  const commit = (key: string, value: string) => {
    storage.setItem(key, `pointer-${committed.length + 1}`);
    committed.push(value);
  };
  const writePersistedDeviceSave = vi.fn((key: string, value: string, stillCurrent: () => boolean) =>
    new Promise<boolean>((resolve, reject) => {
      pending.push({
        value,
        complete: () => {
          if (!stillCurrent()) { resolve(false); return; }
          commit(key, value);
          resolve(true);
        },
        reject: () => reject(new Error('staging interrupted'))
      });
    }));
  const persistDeviceSaveReplacement = vi.fn(async (key: string, value: string, options: { stillCurrent: () => boolean }): Promise<SaveResult> => {
    if (!options.stillCurrent()) return { localSaved: false, localFailure: null };
    commit(key, value);
    return { localSaved: true, localFailure: null };
  });
  const helpers = createExtractedHelpers({
    campaignWriteOwnership: { ...ownership, checkpoint },
    ensureCurrentCampaignWrite: ownership.isCurrent,
    readCloudAccountBinding: () => shared.owner,
    readActiveCloudSlot: () => shared.slot,
    writePersistedDeviceSave,
    guardedDeviceSaveStorage: storage,
    persistDeviceSaveReplacement,
    CAMPAIGN_SAVE_KEY: 'campaign',
    removeDeviceSave: vi.fn(async () => false),
    isDeviceSavePointer: () => true,
    safeLocalStorageGetItem: storage.getItem,
    localStorage: storage,
    classifyDeviceSaveFailure: () => 'unavailable'
  });
  const waitForStarted = (count: number) => vi.waitFor(() => expect(pending).toHaveLength(count), { interval: 1, timeout: 250 });
  return { shared, ownership, checkpoint, committed, pending, helpers, persistDeviceSaveReplacement, waitForStarted };
};

describe('executed App device-save queue behavior', () => {
  it('persists both rapid same-tab edits, with the newest edit last despite pointer changes', async () => {
    const fixture = queueFixture();
    const first = fixture.helpers.writeDeviceSave('campaign', 'edit-1');
    const second = fixture.helpers.writeDeviceSave('campaign', 'edit-2');
    expect(fixture.checkpoint).not.toHaveBeenCalled();
    await fixture.waitForStarted(1);
    expect(fixture.checkpoint).toHaveBeenCalledTimes(1);
    fixture.pending[0].complete();
    expect(await first).toBe(true);
    await fixture.waitForStarted(2);
    expect(fixture.checkpoint).toHaveBeenCalledTimes(2);
    fixture.pending[1].complete();
    expect(await second).toBe(true);
    expect(fixture.committed).toEqual(['edit-1', 'edit-2']);
    expect(fixture.shared.primary).toBe('pointer-2');
    expect(fixture.ownership.isCurrent()).toBe(true);
  });

  it.each(['account', 'slot', 'external-tab'] as const)('drops in-flight and queued edits after an %s change', async change => {
    const fixture = queueFixture();
    const first = fixture.helpers.writeDeviceSave('campaign', 'old-1');
    const second = fixture.helpers.writeDeviceSave('campaign', 'old-2');
    await fixture.waitForStarted(1);
    if (change === 'external-tab') fixture.shared.primary = 'other-tab-pointer';
    else fixture.ownership.write(() => {
      if (change === 'account') fixture.shared.owner = 'account-b';
      else fixture.shared.slot = 3;
    });
    fixture.pending[0].complete();
    expect(await Promise.all([first, second])).toEqual([false, false]);
    expect(fixture.pending).toHaveLength(1);
    expect(fixture.committed).toEqual([]);
  });

  it('cancels the old generation and waits for its queue before committing a replacement', async () => {
    const fixture = queueFixture();
    const first = fixture.helpers.writeDeviceSave('campaign', 'old-1');
    const second = fixture.helpers.writeDeviceSave('campaign', 'old-2');
    await fixture.waitForStarted(1);
    const selected = { bio: { name: 'Selected' }, saveRevision: 10 };
    const replacement = fixture.helpers.persistHydratedCampaignLocally(selected, true);
    expect(fixture.helpers.replacementGeneration()).toBe(1);
    expect(fixture.persistDeviceSaveReplacement).not.toHaveBeenCalled();
    fixture.pending[0].complete();
    expect(await Promise.all([first, second])).toEqual([false, false]);
    expect(await replacement).toEqual({ localSaved: true, localFailure: null });
    expect(fixture.pending).toHaveLength(1);
    expect(fixture.persistDeviceSaveReplacement).toHaveBeenCalledTimes(1);
    expect(fixture.committed).toEqual([JSON.stringify(selected)]);
  });

  it('allows the next queued edit to persist after an earlier staging rejection', async () => {
    const fixture = queueFixture();
    const first = fixture.helpers.writeDeviceSave('campaign', 'failed');
    const second = fixture.helpers.writeDeviceSave('campaign', 'recovered');
    const firstFailure = expect(first).rejects.toThrow('staging interrupted');
    await fixture.waitForStarted(1);
    fixture.pending[0].reject();
    await firstFailure;
    await fixture.waitForStarted(2);
    fixture.pending[1].complete();
    expect(await second).toBe(true);
    expect(fixture.committed).toEqual(['recovered']);
  });
});
