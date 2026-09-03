// @ts-expect-error Vitest runs this source audit in Node; app compilation exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createCampaignWriteOwnership } from './campaignWriteOwnership';
import { cloudSlotHasSameRevisionConflict, cloudSlotRecordFromPayload } from './cloudSlots';

const appSource = readFileSync('src/App.tsx', 'utf8');
const fixture = () => {
  const original = JSON.stringify({ bio: { name: 'Original' }, saveRevision: 10 });
  const shared = { payload: original, slot: '3', uid: 'user-a' };
  const read = () => [shared.payload, shared.slot, shared.uid];
  return { original, shared, oldTab: createCampaignWriteOwnership(read), newTab: createCampaignWriteOwnership(read), read };
};

describe('campaign write ownership across tabs', () => {
  it('blocks an edited clone before local or cloud writes when another tab returns to slot 1', () => {
    const { original, shared, oldTab, newTab } = fixture();
    const editedClone = JSON.stringify({ bio: { name: 'Original' }, saveRevision: 11, calendarDays: 1 });
    // The cloud revision check alone allows this exact hazard.
    expect(cloudSlotHasSameRevisionConflict(editedClone,
      cloudSlotRecordFromPayload(1, original, '2026-09-03T00:00:00Z'))).toBe(false);
    newTab.write(() => { shared.slot = '1'; });
    const save = vi.fn(() => { shared.payload = editedClone; });
    const cloudWrite = vi.fn();
    expect(() => oldTab.write(() => { save(); cloudWrite(shared.slot, editedClone); }))
      .toThrow('stale-campaign-tab');
    expect(save).not.toHaveBeenCalled();
    expect(cloudWrite).not.toHaveBeenCalled();
    expect(shared.payload).toBe(original);
    expect(newTab.isCurrent()).toBe(true);
  });

  it('also blocks different campaign bodies, same-slot remote edits, and account changes', () => {
    for (const field of ['payload', 'slot', 'uid'] as const) {
      const { shared, oldTab, newTab } = fixture();
      newTab.write(() => { shared[field] = 'different'; });
      expect(oldTab.isCurrent()).toBe(false);
      expect(() => oldTab.write(() => { shared.slot = '3'; })).toThrow('stale-campaign-tab');
    }
  });

  it('keeps same-tab autosaves and explicit slot replacement writable', () => {
    const { shared, oldTab } = fixture();
    oldTab.write(() => { shared.payload = 'next save'; });
    oldTab.write(() => { shared.uid = ''; });
    oldTab.write(() => { shared.payload = 'downloaded original'; });
    oldTab.write(() => { shared.slot = '1'; shared.uid = 'user-a'; });
    expect(oldTab.isCurrent()).toBe(true);
    oldTab.write(() => { shared.payload = 'next original edit'; });
    expect(shared.payload).toBe('next original edit');
  });

  it('never reacquires ownership after a slot returns to the old value', () => {
    const { shared, oldTab, newTab, read } = fixture();
    newTab.write(() => { shared.slot = '1'; });
    expect(oldTab.isCurrent()).toBe(false);
    newTab.write(() => { shared.slot = '3'; });
    expect(oldTab.isCurrent()).toBe(false);
    // A new page loading the current campaign can safely acquire it.
    expect(createCampaignWriteOwnership(read).isCurrent()).toBe(true);
  });

  it('uses storage-event invalidation to catch even a completed A -> B -> A switch', () => {
    const { oldTab } = fixture();
    oldTab.invalidate();
    expect(oldTab.isCurrent()).toBe(false);
    expect(() => oldTab.write(() => undefined)).toThrow('stale-campaign-tab');
  });

  it('checks again after async work without adopting the newer shared context', async () => {
    const { shared, oldTab, newTab } = fixture();
    const delayed = Promise.resolve().then(() => oldTab.write(() => { shared.payload = 'stale'; }));
    newTab.write(() => { shared.slot = '1'; });
    await expect(delayed).rejects.toThrow('stale-campaign-tab');
    expect(shared.payload).not.toBe('stale');
  });

  it('does not invalidate ownership after a failed primary write', () => {
    const { oldTab } = fixture();
    expect(() => oldTab.write(() => { throw new Error('quota'); })).toThrow('quota');
    expect(oldTab.isCurrent()).toBe(true);
  });

  it('invalidates delayed fallback work after even this tab replaces the campaign', () => {
    const { shared, oldTab } = fixture();
    const stillOwned = oldTab.checkpoint();
    expect(stillOwned()).toBe(true);
    oldTab.write(() => { shared.payload = 'new campaign'; });
    expect(stillOwned()).toBe(false);
    expect(oldTab.isCurrent()).toBe(true);
  });

  it('guards both UI edits/pagehide and persistence before shared mutations', () => {
    const update = appSource.slice(appSource.indexOf('const updateState ='), appSource.indexOf('const applyImportedCampaignState ='));
    expect(update.indexOf('if (!ensureCurrentCampaignWrite()) return;')).toBeLessThan(update.indexOf('setState(prev =>'));
    expect(update).toContain('if (!prev || !ensureCurrentCampaignWrite()) return prev;');
    const store = appSource.slice(appSource.indexOf('const store ='), appSource.indexOf('// 2. INTERFACES'));
    expect(store.indexOf('if (!ensureCurrentCampaignWrite()) return blockedSave;'))
      .toBeLessThan(store.indexOf('localStorage.setItem(key, jsonString)'));
    expect(store).toContain('readActiveCloudSlot() !== saveOwnerSlot');
    expect(store).toContain('readCloudAccountBinding() !== saveOwnerUid');
    expect(appSource).toContain("window.addEventListener('storage', handleStorage)");
    expect(appSource).toContain('campaignWriteOwnership.invalidate();');
    expect(appSource).toContain('campaignWriteBlocked && <p role="alert"');
    for (const name of ['openCloudSlots', 'handleDownloadCloudSlot', 'handleUploadCloudSlot', 'handleDeleteCloudSlot', 'applyImportedCampaignState']) {
      const start = appSource.indexOf(`const ${name} =`);
      expect(appSource.slice(start, start + 220)).toContain('if (!ensureCurrentCampaignWrite()) return;');
    }
  });

  it('reports stale ownership ahead of quota, permission, or generic save errors', () => {
    expect(appSource.includes("const saveStatusText = campaignWriteBlocked\n    ? '다른 탭에서 변경됨'"))
      .toBe(true);
    expect(appSource.includes('const saveStatusTitle = campaignWriteBlocked\n    ? STALE_CAMPAIGN_TAB_MESSAGE'))
      .toBe(true);
    expect(appSource.includes('title={saveStatusTitle}')).toBe(true);
    const blocked = appSource.slice(appSource.indexOf('const handleBlocked ='), appSource.indexOf('const handleStorage ='));
    expect(blocked.includes('setLocalSaveFailure(null);')).toBe(true);
    const update = appSource.slice(appSource.indexOf('const updateState ='), appSource.indexOf('const applyImportedCampaignState ='));
    const resultHandler = update.slice(update.indexOf('.then(result =>'), update.indexOf('}).catch(error =>'));
    expect(resultHandler.indexOf('if (!ensureCurrentCampaignWrite())'))
      .toBeLessThan(resultHandler.indexOf("setLocalSaveFailure(result.localSaved ? null : result.localFailure || 'unavailable')"));
    const errorHandler = update.slice(update.indexOf('}).catch(error =>'));
    expect(errorHandler.indexOf('if (!ensureCurrentCampaignWrite())'))
      .toBeLessThan(errorHandler.indexOf("setLocalSaveFailure('unavailable')"));
  });
});
