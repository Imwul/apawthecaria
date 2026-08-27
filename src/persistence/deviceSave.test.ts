import { describe, expect, it } from 'vitest';
import { preferDeviceSave, readDeviceSave, removeDeviceSave, writeDeviceSave } from './deviceSave';

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
});
