import { describe, expect, it, vi } from 'vitest';
import {
  CAMPAIGN_SAVE_KEY,
  campaignSaveHasNamedApothecary,
  campaignSaveHasProgress,
  decideCloudSaveAction,
  isRecognizableCampaignSave,
  parseCampaignSaveRaw,
  readCampaignSaveWithoutWipe,
  tryMigrateCampaignSave
} from './campaignSave';

describe('campaign save safety', () => {
  it('does not treat an empty or unnamed save as progress', () => {
    expect(campaignSaveHasProgress(null)).toBe(false);
    expect(campaignSaveHasProgress({ bio: {}, journals: [] })).toBe(false);
    expect(campaignSaveHasProgress({ workflowDrafts: { character: null, patient: null, journey: null }, pendingTreatmentReward: null })).toBe(false);
    expect(campaignSaveHasProgress({ bio: { name: 'Bramble' } })).toBe(true);
    expect(campaignSaveHasProgress({ journals: [{ id: '1' }] })).toBe(true);
    expect(campaignSaveHasProgress({ journeyActive: true })).toBe(true);
    expect(campaignSaveHasProgress({ routeDraft: { stops: [{ id: 'a' }, { id: 'b' }] } })).toBe(true);
    expect(campaignSaveHasProgress({ patients: [{ id: 'patient' }] })).toBe(true);
    expect(campaignSaveHasProgress({ saveRevision: '4' })).toBe(true);
  });

  it('recognizes a named character draft as uploadable before card setup is complete', () => {
    expect(campaignSaveHasNamedApothecary({
      bio: { name: '' },
      workflowDrafts: { character: { name: 'Bramble' } }
    })).toBe(true);
    expect(campaignSaveHasNamedApothecary({
      bio: { name: '' },
      workflowDrafts: { character: { name: '   ' } }
    })).toBe(false);
  });

  it.each([
    ['Character creation', { workflowDrafts: { character: { version: 1, touched: ['name'], name: 'Bramble' } } }],
    ['Patient intake', { workflowDrafts: { patient: { version: 1, transactionId: 'intake:1', name: 'Pip' } } }],
    ['Journey preparation', { workflowDrafts: { journey: { version: 1, reason: 'A promise' } } }],
    ['Treatment reward', { pendingTreatmentReward: { version: 1, transactionId: 'treatment:1' } }]
  ])('treats a meaningful unfinished %s checkpoint as local progress', (_label, save) => {
    expect(campaignSaveHasProgress(save)).toBe(true);
  });

  it('recognizes partial historical saves without requiring bio and bag', () => {
    expect(isRecognizableCampaignSave({ schemaVersion: 3, patients: [] })).toBe(true);
    expect(isRecognizableCampaignSave({ activeAilment: { id: 'legacy' } })).toBe(true);
    expect(isRecognizableCampaignSave({ routeDraft: { stops: [] } })).toBe(true);
    expect(isRecognizableCampaignSave({ unrelated: true })).toBe(false);
    expect(isRecognizableCampaignSave([])).toBe(false);
  });

  it('keeps the raw payload when migrate throws and never calls removeItem', () => {
    const raw = JSON.stringify({ bio: { name: 'Bramble' }, bag: [], journals: [{ id: 'keep-me' }] });
    const removeItem = vi.fn();
    const storage = {
      getItem: (key: string) => key === CAMPAIGN_SAVE_KEY ? raw : null,
      removeItem
    };

    const result = readCampaignSaveWithoutWipe(storage, () => {
      throw new Error('corrupt schema');
    });

    expect(result).toEqual({ ok: false, raw });
    expect(removeItem).not.toHaveBeenCalled();
    expect(storage.getItem(CAMPAIGN_SAVE_KEY)).toBe(raw);
  });

  it('keeps the raw payload when the stored JSON cannot be parsed', () => {
    const raw = '{not-json';
    const storage = { getItem: () => raw };
    expect(parseCampaignSaveRaw(raw).ok).toBe(false);
    expect(readCampaignSaveWithoutWipe(storage, value => value)).toEqual({ ok: false, raw });
  });

  it('returns the migrated state only when migrate succeeds', () => {
    const migrated = tryMigrateCampaignSave({ schemaVersion: 8 }, value => ({ ...(value as object), ok: true }));
    expect(migrated).toEqual({ ok: true, state: { schemaVersion: 8, ok: true } });
    expect(tryMigrateCampaignSave(null, value => value).ok).toBe(false);
    expect(tryMigrateCampaignSave([], value => value).ok).toBe(false);
  });

  it('asks before a newer cloud save overwrites local progress', () => {
    const localRaw = JSON.stringify({ bio: { name: 'Bramble' }, journals: [{ id: '1' }], saveRevision: 2 });
    const confirmOverwrite = vi.fn(() => false);
    expect(decideCloudSaveAction({ localRaw, cloudRevision: 9, confirmOverwrite })).toBe('keep-local');
    expect(confirmOverwrite).toHaveBeenCalledTimes(1);

    confirmOverwrite.mockReturnValueOnce(true);
    expect(decideCloudSaveAction({ localRaw, cloudRevision: 9, confirmOverwrite })).toBe('load-cloud');
  });

  it('uploads a newer local save and loads cloud when local is empty', () => {
    expect(decideCloudSaveAction({
      localRaw: JSON.stringify({ bio: { name: 'Bramble' }, saveRevision: 4 }),
      cloudRevision: 1,
      cloudHasNamedApothecary: false,
      confirmOverwrite: () => false
    })).toBe('upload-local');

    expect(decideCloudSaveAction({
      localRaw: JSON.stringify({ bio: {}, journals: [] }),
      cloudRevision: 3,
      cloudHasNamedApothecary: true,
      confirmOverwrite: () => {
        throw new Error('should not confirm an empty local save');
      }
    })).toBe('load-cloud');

    expect(decideCloudSaveAction({
      localRaw: null,
      cloudRevision: 1,
      cloudHasNamedApothecary: true,
      confirmOverwrite: () => false
    })).toBe('load-cloud');

    expect(decideCloudSaveAction({
      localRaw: JSON.stringify({ bio: { name: 'Bramble' }, saveRevision: 4 }),
      cloudRevision: Number.POSITIVE_INFINITY,
      cloudHasNamedApothecary: false,
      confirmOverwrite: () => false
    })).toBe('upload-local');
  });

  it('does not silently overwrite an unnamed but progressed local save with cloud data', () => {
    const confirmOverwrite = vi.fn(() => false);
    expect(decideCloudSaveAction({
      localRaw: JSON.stringify({ bio: { name: '' }, journals: [], saveRevision: 12 }),
      cloudRevision: 3,
      cloudHasNamedApothecary: true,
      confirmOverwrite
    })).toBe('keep-local');
    expect(confirmOverwrite).toHaveBeenCalledTimes(1);

    confirmOverwrite.mockReturnValueOnce(true);
    expect(decideCloudSaveAction({
      localRaw: JSON.stringify({ bio: { name: '' }, patients: [{ id: 'unsaved-name' }], saveRevision: 12 }),
      cloudRevision: 3,
      cloudHasNamedApothecary: true,
      confirmOverwrite
    })).toBe('load-cloud');
  });

  it('does not silently replace an unnamed local workflow draft with another cloud campaign', () => {
    const confirmOverwrite = vi.fn(() => false);
    const localRaw = JSON.stringify({
      bio: { name: '' },
      workflowDrafts: {
        character: { version: 1, touched: ['name'], name: 'Still choosing' },
        patient: null,
        journey: null
      },
      saveRevision: 0
    });

    expect(decideCloudSaveAction({
      localRaw,
      cloudRevision: 8,
      cloudHasNamedApothecary: true,
      confirmOverwrite
    })).toBe('keep-local');
    expect(confirmOverwrite).toHaveBeenCalledTimes(1);
  });
});
