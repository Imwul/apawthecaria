// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_SAVE_KEY } from './campaignSave';
import {
  ACTIVE_CLOUD_SLOT_KEY,
  CLOUD_ACCOUNT_BINDING_KEY,
  CLOUD_DOCUMENT_SAFE_BYTES,
  CLOUD_PAYLOAD_SAFE_BYTES,
  CLOUD_SLOT_COUNT,
  CLOUD_SLOTS_FIELD,
  assembleCloudSlotDocument,
  assembleNewCloudSlotDocument,
  cloudPayloadByteLength,
  cloudPayloadFingerprint,
  cloudSaveDocumentId,
  cloudSlotPayloadDocumentBelongsToAccount,
  cloudSlotPayloadDocumentId,
  cloudSlotPathBelongsToAccount,
  cloudSlotMapKey,
  cloudSlotRecordFromPayload,
  cloudSlotStoragePath,
  cloudSlotWriteFields,
  confirmManualSlotDownload,
  confirmManualSlotUpload,
  emptyCloudSlotViews,
  estimateCloudSlotDocumentBytes,
  formatCloudPayloadBytes,
  formatCloudSlotUploadedAt,
  mergeCloudSlotRecord,
  readActiveCloudSlot,
  readCloudAccountBinding,
  readCloudSlotsFromDocument,
  summarizeCloudUploadSource,
  writeCloudAccountBinding,
  writeActiveCloudSlot
} from './cloudSlots';

const appSource = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');

const namedSave = (name: string, revision: number) =>
  JSON.stringify({ bio: { name }, journals: [{ id: '1' }], saveRevision: revision });

describe('cloud save slots', () => {
  it('keeps exactly three slots and treats the legacy cloud field as slot 1', () => {
    expect(CLOUD_SLOT_COUNT).toBe(3);
    expect(emptyCloudSlotViews()).toHaveLength(3);

    const payload = namedSave('커스타드', 39);
    const result = readCloudSlotsFromDocument(
      { [CAMPAIGN_SAVE_KEY]: payload },
      '2026-08-16T12:08:37.713Z'
    );

    expect(result.migratedFromLegacy).toBe(true);
    expect(result.records[0]?.name).toBe('커스타드');
    expect(result.records[0]?.saveRevision).toBe(39);
    expect(result.records[0]?.uploadedAt).toBe('2026-08-16T12:08:37.713Z');
    expect(result.records[1]).toBeNull();
    expect(result.records[2]).toBeNull();
    expect(result.views[0]).toMatchObject({ slot: 1, empty: false, name: '커스타드' });
    expect(result.views[0].payloadBytes).toBeGreaterThan(0);
    expect(result.views[1].empty).toBe(true);
    expect(result.views[1].payloadBytes).toBe(0);
    expect(result.views[2].empty).toBe(true);
  });

  it('does not overwrite a stored slot 1 with the legacy field', () => {
    const result = readCloudSlotsFromDocument({
      [CAMPAIGN_SAVE_KEY]: namedSave('옛이름', 1),
      [CLOUD_SLOTS_FIELD]: {
        1: {
          payload: namedSave('커스타드', 39),
          uploadedAt: '2026-08-16T12:08:37.713Z',
          name: '커스타드',
          saveRevision: 39
        }
      }
    });
    expect(result.migratedFromLegacy).toBe(false);
    expect(result.records[0]?.name).toBe('커스타드');
  });

  it('writes slot 1 back onto the legacy field and keeps other slots when composing a document', () => {
    const record = cloudSlotRecordFromPayload(1, namedSave('커스타드', 39), '2026-08-16T12:08:37.713Z');
    expect(cloudSlotWriteFields(record)[CAMPAIGN_SAVE_KEY]).toBe(record.payload);
    expect(cloudSlotWriteFields(record)[`${CLOUD_SLOTS_FIELD}.${cloudSlotMapKey(1)}`]).toMatchObject({ slot: 1, name: '커스타드' });

    const slotTwo = cloudSlotRecordFromPayload(2, namedSave('다른약제사', 4), '2026-08-16T13:00:00.000Z');
    expect(cloudSlotWriteFields(slotTwo)[CAMPAIGN_SAVE_KEY]).toBeUndefined();
    expect(assembleNewCloudSlotDocument(slotTwo)[CLOUD_SLOTS_FIELD]).toHaveProperty(cloudSlotMapKey(2));

    const merged = mergeCloudSlotRecord([record, null, null], slotTwo);
    const document = assembleCloudSlotDocument(merged);
    expect(document[CAMPAIGN_SAVE_KEY]).toBe(record.payload);
    expect(document[CLOUD_SLOTS_FIELD]).toHaveProperty(cloudSlotMapKey(1));
    expect(document[CLOUD_SLOTS_FIELD]).toHaveProperty(cloudSlotMapKey(2));
    expect(readCloudSlotsFromDocument(document).records[0]?.name).toBe('커스타드');
    expect(readCloudSlotsFromDocument(document).records[1]?.name).toBe('다른약제사');
  });

  it('stores campaign bodies in independent Firestore payload documents and preserves their metadata', () => {
    const inline = cloudSlotRecordFromPayload(1, namedSave('큰기록', 41), '2026-08-21T06:00:00.000Z');
    const payloadDocumentId = cloudSlotPayloadDocumentId('user-a', inline, 'fixed');
    const stored = { ...inline, payload: '', payloadDocumentId };
    const document = assembleCloudSlotDocument([stored, null, null]);
    const slotFields = (document[CLOUD_SLOTS_FIELD] as Record<string, Record<string, unknown>>)[cloudSlotMapKey(1)];

    expect(document[CAMPAIGN_SAVE_KEY]).toBeUndefined();
    expect(slotFields.payload).toBeUndefined();
    expect(slotFields).toMatchObject({
      payloadDocumentId,
      payloadBytes: inline.payloadBytes,
      payloadFingerprint: inline.payloadFingerprint,
      name: '큰기록',
      saveRevision: 41
    });
    expect(readCloudSlotsFromDocument(document).records[0]).toMatchObject({
      payload: '',
      payloadDocumentId,
      payloadBytes: inline.payloadBytes,
      payloadFingerprint: inline.payloadFingerprint
    });
    expect(estimateCloudSlotDocumentBytes([stored, null, null])).toBeLessThan(2_000);
  });

  it('still reads older numeric slot keys from existing cloud documents', () => {
    const result = readCloudSlotsFromDocument({
      [CLOUD_SLOTS_FIELD]: {
        2: {
          payload: namedSave('옛슬롯', 8),
          uploadedAt: '2026-08-16T13:00:00.000Z',
          name: '옛슬롯',
          saveRevision: 8
        }
      }
    });
    expect(result.records[1]?.name).toBe('옛슬롯');
    expect(result.records[0]).toBeNull();
  });

  it('recovers revision metadata from the payload when slot metadata is malformed', () => {
    const result = readCloudSlotsFromDocument({
      [CLOUD_SLOTS_FIELD]: {
        1: {
          payload: namedSave('복구', 17),
          uploadedAt: '2026-08-16T13:00:00.000Z',
          name: '복구',
          saveRevision: -99
        }
      }
    });
    expect(result.records[0]?.saveRevision).toBe(17);
  });

  it('asks before a manual download or upload overwrites an occupied record', () => {
    const confirm = vi.fn(() => false);
    expect(confirmManualSlotDownload({
      slot: 1,
      localRaw: namedSave('로컬', 2),
      cloudName: '커스타드',
      confirm
    })).toBe(false);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('슬롯 1'));

    confirm.mockReturnValueOnce(true);
    expect(confirmManualSlotUpload({
      slot: 2,
      localRaw: namedSave('로컬', 3),
      occupied: true,
      cloudName: '커스타드',
      confirm
    })).toBe(true);

    expect(confirmManualSlotUpload({
      slot: 3,
      localRaw: JSON.stringify({ bio: { name: '' }, journals: [] }),
      occupied: false,
      cloudName: null,
      confirm
    })).toBe(false);
  });

  it('warns when an upload changes accounts or replaces a newer cloud revision', () => {
    const confirm = vi.fn(() => true);
    expect(confirmManualSlotUpload({
      slot: 3,
      localRaw: namedSave('로컬', 3),
      occupied: false,
      cloudName: null,
      accountLabel: '다른@example.com',
      accountChanged: true,
      confirm
    })).toBe(true);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('다른 Google 계정'));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('빈 슬롯 3'));

    confirm.mockClear();
    expect(confirmManualSlotUpload({
      slot: 2,
      localRaw: namedSave('로컬', 3),
      occupied: true,
      cloudName: '클라우드',
      cloudRevision: 8,
      cloudUploadedAt: '2026-08-16T13:00:00.000Z',
      confirm
    })).toBe(true);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('클라우드 기록(저장 버전 8)'));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('마지막 업로드'));
  });

  it('binds local automatic sync to one account and creates distinct Firestore document ids', () => {
    const storage = {
      values: {} as Record<string, string>,
      getItem(key: string) { return this.values[key] ?? null; },
      setItem(key: string, value: string) { this.values[key] = value; }
    };
    expect(readCloudAccountBinding(storage)).toBeNull();
    writeCloudAccountBinding(' user-a ', storage);
    expect(storage.values[CLOUD_ACCOUNT_BINDING_KEY]).toBe('user-a');
    expect(readCloudAccountBinding(storage)).toBe('user-a');
    expect(cloudSaveDocumentId('user-a')).not.toBe(cloudSaveDocumentId('user-b'));
    const record = cloudSlotRecordFromPayload(2, namedSave('계정분리', 1), '2026-08-21T06:00:00.000Z');
    const path = cloudSlotStoragePath('user-a', record, 'fixed');
    expect(cloudSlotPathBelongsToAccount(path, 'user-a')).toBe(true);
    expect(cloudSlotPathBelongsToAccount(path, 'user-b')).toBe(false);
    const payloadDocumentId = cloudSlotPayloadDocumentId('user-a', record, 'fixed');
    expect(cloudSlotPayloadDocumentBelongsToAccount(payloadDocumentId, 'user-a')).toBe(true);
    expect(cloudSlotPayloadDocumentBelongsToAccount(payloadDocumentId, 'user-b')).toBe(false);
  });

  it('measures UTF-8 payload and the combined three-slot Firestore document', () => {
    expect(cloudPayloadByteLength('가')).toBe(3);
    expect(formatCloudPayloadBytes(1025)).toBe('2KB');
    const source = summarizeCloudUploadSource(namedSave('한글 약제사', 7));
    expect(source).toMatchObject({ available: true, canUpload: true, name: '한글 약제사', saveRevision: 7 });
    const records = [1, 2, 3].map(slot => cloudSlotRecordFromPayload(
      slot as 1 | 2 | 3,
      namedSave(`약제사-${slot}`, slot),
      '2026-08-16T13:00:00.000Z'
    ));
    expect(estimateCloudSlotDocumentBytes(records)).toBeGreaterThan(source.payloadBytes);
    expect(CLOUD_DOCUMENT_SAFE_BYTES).toBeLessThan(1_000_000);
    expect(CLOUD_PAYLOAD_SAFE_BYTES).toBeLessThan(CLOUD_DOCUMENT_SAFE_BYTES);
    expect(cloudPayloadFingerprint('동일')).toBe(cloudPayloadFingerprint('동일'));
    expect(cloudPayloadFingerprint('동일')).not.toBe(cloudPayloadFingerprint('다름'));
  });

  it('allows a sizable slot that would overflow when three campaign bodies share one document', () => {
    const payload = JSON.stringify({
      bio: { name: '대용량 약제사' },
      journals: [{ id: '1', body: 'x'.repeat(600_000) }],
      saveRevision: 9
    });
    const source = summarizeCloudUploadSource(payload);
    expect(source.payloadBytes * 3).toBeGreaterThan(CLOUD_DOCUMENT_SAFE_BYTES);
    expect(source.payloadBytes).toBeLessThan(CLOUD_PAYLOAD_SAFE_BYTES);
    expect(source.canUpload).toBe(true);
  });

  it('formats the last upload time in Korean and remembers the active slot', () => {
    const storage = {
      values: {} as Record<string, string>,
      getItem(key: string) { return this.values[key] ?? null; },
      setItem(key: string, value: string) { this.values[key] = value; }
    };
    expect(readActiveCloudSlot(storage)).toBe(1);
    writeActiveCloudSlot(2, storage);
    expect(storage.values[ACTIVE_CLOUD_SLOT_KEY]).toBe('2');
    expect(readActiveCloudSlot(storage)).toBe(2);
    const formatted = formatCloudSlotUploadedAt('2026-08-16T12:08:37.713Z');
    expect(formatted).toMatch(/2026년/);
    expect(formatted).toMatch(/8월/);
    expect(formatted).toMatch(/16일/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    expect(formatCloudSlotUploadedAt(null)).toBe('시각 미상');
  });

  it('exposes a three-slot cloud panel with manual download and upload', () => {
    expect(appSource).toContain('이 기기로 내려받기');
    expect(appSource).toContain('이 슬롯에 올리기');
    expect(appSource).toContain('이 기록으로 덮어쓰기');
    expect(appSource).toContain('클라우드 기록');
    expect(appSource).toContain('마지막 업로드');
    expect(appSource).toContain('다른 사람의 기록이 이 계정에 자동으로 올라가지 않도록');
    expect(appSource).toContain('CloudSlotsDialog');
    expect(appSource).toContain('handleDownloadCloudSlot');
    expect(appSource).toContain('handleUploadCloudSlot');
    expect(appSource).toContain('runTransaction');
    expect(appSource).toContain("setDoc(doc(db, 'saves', payloadDocumentId)");
    expect(appSource).toContain("getDoc(doc(db, 'saves', record.payloadDocumentId))");
    expect(appSource).toContain('[CAMPAIGN_SAVE_KEY]: deleteField()');
    expect(appSource).toContain('cloudSlotPayloadDocumentBelongsToAccount');
    expect(appSource).toContain('readCloudAccountBinding() === uid');
    expect(appSource).toContain('window.confirm.call(window, message)');
    expect(readFileSync(fileURLToPath(new URL('./cloudSlots.ts', import.meta.url)), 'utf8')).toContain('window.confirm.call(window, message)');
  });
});
