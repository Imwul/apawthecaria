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
  CLOUD_PAYLOAD_CHUNK_SAFE_BYTES,
  CLOUD_PAYLOAD_SAFE_BYTES,
  CLOUD_SLOT_COUNT,
  CLOUD_SLOT_TOMBSTONES_FIELD,
  CLOUD_SLOTS_FIELD,
  assembleCloudAccountDocument,
  assembleCloudSlotDocument,
  assembleNewCloudSlotDocument,
  cloudPayloadByteLength,
  cloudPayloadFingerprint,
  cloudSaveDocumentId,
  cloudSlotDeletionTombstone,
  cloudSlotHasSameRevisionConflict,
  cloudSlotPayloadDocumentBelongsToAccount,
  cloudSlotPayloadChunkDocumentId,
  cloudSlotPayloadDocumentId,
  cloudSlotPayloadDocumentPrefix,
  cloudSlotPathBelongsToAccount,
  cloudSlotMapKey,
  cloudSlotRecordFromPayload,
  cloudSlotStoragePath,
  cloudSlotTombstoneBlocksWrite,
  cloudSlotWriteFields,
  clearCloudAccountBinding,
  confirmManualSlotDownload,
  confirmManualSlotUpload,
  emptyCloudSlotViews,
  estimateCloudSlotDocumentBytes,
  formatCloudPayloadBytes,
  formatCloudSlotUploadedAt,
  manualSlotDownloadConfirmationMessage,
  manualSlotUploadConfirmationMessage,
  mergeCloudSlotRecord,
  mergeCloudSlotTombstone,
  readActiveCloudSlot,
  readCloudAccountBinding,
  readCloudSlotsFromDocument,
  preferredCloudUploadPayload,
  summarizeCloudUploadSource,
  splitCloudPayload,
  writeCloudAccountBinding,
  writeActiveCloudSlot
} from './cloudSlots';

const appSource = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');

const namedSave = (name: string, revision: number) =>
  JSON.stringify({ bio: { name }, journals: [{ id: '1' }], saveRevision: revision });

describe('cloud save slots', () => {
  it('splits a multi-megabyte UTF-8 campaign into safe lossless child documents', () => {
    const payload = JSON.stringify({
      bio: { name: '긴 기록' },
      saveRevision: 3905,
      journal: '한밤의 숲길 🐾 '.repeat(230_000)
    });
    expect(cloudPayloadByteLength(payload)).toBeGreaterThan(3_000_000);
    expect(cloudPayloadByteLength(payload)).toBeLessThan(CLOUD_PAYLOAD_SAFE_BYTES);
    expect(summarizeCloudUploadSource(payload)).toMatchObject({ available: true, canUpload: true, name: '긴 기록' });

    const chunks = splitCloudPayload(payload);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => cloudPayloadByteLength(chunk) <= CLOUD_PAYLOAD_CHUNK_SAFE_BYTES)).toBe(true);
    expect(chunks.join('')).toBe(payload);
    expect(cloudPayloadFingerprint(chunks.join(''))).toBe(cloudPayloadFingerprint(payload));
  });

  it('uses account-owned deterministic ids for every payload chunk', () => {
    const record = cloudSlotRecordFromPayload(2, namedSave('큰 기록', 44), '2026-08-28T01:00:00.000Z');
    const manifestId = cloudSlotPayloadDocumentId('user-a', record, 'nonce');
    const first = cloudSlotPayloadChunkDocumentId(manifestId, 0);
    const second = cloudSlotPayloadChunkDocumentId(manifestId, 1);

    expect(first).toBe(`${manifestId}_chunk_0`);
    expect(second).toBe(`${manifestId}_chunk_1`);
    expect(cloudSlotPayloadDocumentBelongsToAccount(first, 'user-a')).toBe(true);
    expect(cloudSlotPayloadDocumentBelongsToAccount(first, 'user-b')).toBe(false);
  });

  it('does not confuse an account whose UID extends another account payload prefix', () => {
    const shortAccount = 'fox';
    const prefixedAccount = 'fox_slot_archive';
    const otherRecord = cloudSlotRecordFromPayload(1, namedSave('다른 계정', 9), '2026-08-28T01:00:00.000Z');
    const otherManifest = cloudSlotPayloadDocumentId(prefixedAccount, otherRecord, 'nonce');

    expect(otherManifest.startsWith(cloudSlotPayloadDocumentPrefix(shortAccount))).toBe(true);
    expect(cloudSlotPayloadDocumentBelongsToAccount(otherManifest, shortAccount)).toBe(false);
    expect(cloudSlotPayloadDocumentBelongsToAccount(otherManifest, prefixedAccount)).toBe(true);
  });

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

  it('keeps a deleted slot empty when a delayed legacy or device write is still present', () => {
    const staleRecord = cloudSlotRecordFromPayload(1, namedSave('삭제 전 기록', 12), '2026-08-20T12:00:00.000Z');
    const tombstone = cloudSlotDeletionTombstone(staleRecord, '2026-08-21T12:00:00.000Z');
    const document = {
      [CAMPAIGN_SAVE_KEY]: staleRecord.payload,
      [CLOUD_SLOTS_FIELD]: { [cloudSlotMapKey(1)]: staleRecord },
      [CLOUD_SLOT_TOMBSTONES_FIELD]: { [cloudSlotMapKey(1)]: tombstone }
    };

    const parsed = readCloudSlotsFromDocument(document);
    expect(parsed.records[0]).toBeNull();
    expect(parsed.views[0]).toMatchObject({ slot: 1, empty: true });
    expect(parsed.migratedFromLegacy).toBe(false);
    expect(parsed.tombstones[0]).toEqual(tombstone);
  });

  it('preserves other deletion markers and clears only the explicitly restored slot', () => {
    const first = cloudSlotRecordFromPayload(1, namedSave('첫째', 4), '2026-08-20T12:00:00.000Z');
    const second = cloudSlotRecordFromPayload(2, namedSave('둘째', 8), '2026-08-20T13:00:00.000Z');
    const tombstones = mergeCloudSlotTombstone(
      mergeCloudSlotTombstone([], 1, cloudSlotDeletionTombstone(first)),
      2,
      cloudSlotDeletionTombstone(second)
    );
    const restored = mergeCloudSlotTombstone(tombstones, 1, null);
    const document = assembleCloudSlotDocument([first, null, null], restored);
    const parsed = readCloudSlotsFromDocument(document);

    expect(parsed.records[0]?.name).toBe('첫째');
    expect(parsed.tombstones[0]).toBeNull();
    expect(parsed.tombstones[1]?.saveRevision).toBe(8);
    expect((document[CLOUD_SLOT_TOMBSTONES_FIELD] as Record<string, unknown>)[cloudSlotMapKey(1)]).toBeUndefined();
    expect((document[CLOUD_SLOT_TOMBSTONES_FIELD] as Record<string, unknown>)[cloudSlotMapKey(2)]).toBeDefined();
  });

  it('round-trips create, delete, stale reread, and deliberate recreation of one slot', () => {
    const created = cloudSlotRecordFromPayload(2, namedSave('첫 기록', 3), '2026-08-20T12:00:00.000Z');
    const createdDocument = assembleCloudAccountDocument(null, 'user-a', [null, created, null]);
    const afterCreate = readCloudSlotsFromDocument(createdDocument);
    expect(afterCreate.records[1]).toMatchObject({ name: '첫 기록', saveRevision: 3 });

    const tombstone = cloudSlotDeletionTombstone(created, '2026-08-21T12:00:00.000Z');
    const deletedDocument = assembleCloudAccountDocument(createdDocument, 'user-a', [null, null, null], [null, tombstone, null]);
    expect(readCloudSlotsFromDocument(deletedDocument).records[1]).toBeNull();

    const staleReplica = {
      ...deletedDocument,
      [CLOUD_SLOTS_FIELD]: {
        ...(deletedDocument[CLOUD_SLOTS_FIELD] as Record<string, unknown>),
        [cloudSlotMapKey(2)]: created
      }
    };
    expect(readCloudSlotsFromDocument(staleReplica).records[1]).toBeNull();

    const recreated = cloudSlotRecordFromPayload(2, namedSave('새 기록', 4), '2026-08-22T12:00:00.000Z');
    const recreatedDocument = assembleCloudAccountDocument(
      staleReplica,
      'user-a',
      [null, recreated, null],
      mergeCloudSlotTombstone(readCloudSlotsFromDocument(staleReplica).tombstones, 2, null)
    );
    expect(readCloudSlotsFromDocument(recreatedDocument)).toMatchObject({
      records: [null, expect.objectContaining({ name: '새 기록', saveRevision: 4 }), null],
      tombstones: [null, null, null]
    });
  });

  it('blocks delayed automatic writes after deletion but permits a deliberate slot upload', () => {
    const record = cloudSlotRecordFromPayload(3, namedSave('지운 기록', 21), '2026-08-20T12:00:00.000Z');
    const tombstone = cloudSlotDeletionTombstone(record);
    expect(cloudSlotTombstoneBlocksWrite(tombstone, false)).toBe(true);
    expect(cloudSlotTombstoneBlocksWrite(tombstone, true)).toBe(false);
    expect(cloudSlotTombstoneBlocksWrite(null, false)).toBe(false);
  });

  it('canonically replaces managed slot maps while preserving unrelated account metadata', () => {
    const restored = cloudSlotRecordFromPayload(1, namedSave('복구', 15), '2026-08-22T12:00:00.000Z');
    const document = assembleCloudAccountDocument({
      ownerUid: 'wrong',
      unrelatedPreference: 'keep',
      [CAMPAIGN_SAVE_KEY]: namedSave('legacy', 1),
      [CLOUD_SLOTS_FIELD]: { 1: { payload: namedSave('stale', 2) } },
      [CLOUD_SLOT_TOMBSTONES_FIELD]: { [cloudSlotMapKey(1)]: cloudSlotDeletionTombstone(restored) }
    }, 'user-a', [{ ...restored, payload: '', payloadDocumentId: 'payload-id' }, null, null]);

    expect(document).toMatchObject({ ownerUid: 'user-a', unrelatedPreference: 'keep' });
    expect(document[CAMPAIGN_SAVE_KEY]).toBeUndefined();
    expect(document[CLOUD_SLOT_TOMBSTONES_FIELD]).toBeUndefined();
    expect(Object.keys(document[CLOUD_SLOTS_FIELD] as object)).toEqual([cloudSlotMapKey(1)]);
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

    expect(manualSlotDownloadConfirmationMessage({
      slot: 1,
      localRaw: namedSave('로컬', 2),
      cloudName: '커스타드'
    })).toContain('이 기기 기록을 덮어쓸까요?');
    expect(manualSlotDownloadConfirmationMessage({
      slot: 1,
      localRaw: null,
      cloudName: '커스타드'
    })).toBeNull();
    expect(manualSlotUploadConfirmationMessage({
      slot: 3,
      localRaw: namedSave('로컬', 3),
      occupied: false,
      cloudName: null
    })).toBeNull();
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

  it('detects divergent same-revision campaign bodies before another device can overwrite them', () => {
    const local = namedSave('로컬 분기', 12);
    const cloudPayload = namedSave('클라우드 분기', 12);
    const cloud = cloudSlotRecordFromPayload(1, cloudPayload, '2026-08-22T12:00:00.000Z');

    expect(cloudSlotHasSameRevisionConflict(local, cloud)).toBe(true);
    expect(cloudSlotHasSameRevisionConflict(cloudPayload, cloud)).toBe(false);
    expect(cloudSlotHasSameRevisionConflict(namedSave('더 최신 로컬', 13), cloud)).toBe(false);
    expect(cloudSlotHasSameRevisionConflict('{broken', cloud)).toBe(false);
    expect(cloudSlotHasSameRevisionConflict(local, null)).toBe(false);
  });

  it('integrates divergence and destructive cloud choices with the in-app dialog', () => {
    const bootstrapStart = appSource.indexOf('// Listen to Auth State');
    const bootstrapEnd = appSource.indexOf('// Load initial state', bootstrapStart);
    const bootstrapSource = appSource.slice(bootstrapStart, bootstrapEnd);
    expect(bootstrapSource).toContain('cloudSlotHasSameRevisionConflict(localRaw, cloudRecord)');
    expect(bootstrapSource).toContain("title: '같은 버전의 서로 다른 기록이 있습니다'");
    expect(bootstrapSource).toContain("defaultValue: 'load-cloud'");
    expect(bootstrapSource).toContain('clearCloudAccountBinding();');
    expect(bootstrapSource).not.toContain('askWindowConfirm(');

    const deleteStart = appSource.indexOf('const handleDeleteCloudSlot');
    const deleteEnd = appSource.indexOf('const handleReset', deleteStart);
    const deleteSource = appSource.slice(deleteStart, deleteEnd);
    expect(deleteSource).toContain('await requestControlledPrompt({');
    expect(deleteSource).toContain("tone: 'destructive'");
    expect(deleteSource).toContain("confirmLabel: '영구 삭제'");
    expect(deleteSource).not.toContain('askWindowConfirm(');

    const downloadStart = appSource.indexOf('const handleDownloadCloudSlot');
    const uploadStart = appSource.indexOf('const handleUploadCloudSlot', downloadStart);
    const deleteHandlerStart = appSource.indexOf('const handleDeleteCloudSlot', uploadStart);
    expect(appSource.slice(downloadStart, uploadStart)).toContain('manualSlotDownloadConfirmationMessage');
    expect(appSource.slice(downloadStart, uploadStart)).not.toContain('confirmManualSlotDownload');
    expect(appSource.slice(uploadStart, deleteHandlerStart)).toContain('manualSlotUploadConfirmationMessage');
    expect(appSource.slice(uploadStart, deleteHandlerStart)).not.toContain('confirmManualSlotUpload');
  });

  it('allows a legacy single-field slot to be replaced or removed after confirmation', () => {
    expect(appSource).toContain('const sameUploadTime = current.migratedFromLegacy');
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
    expect(CLOUD_PAYLOAD_CHUNK_SAFE_BYTES).toBeLessThan(CLOUD_DOCUMENT_SAFE_BYTES);
    expect(CLOUD_PAYLOAD_SAFE_BYTES).toBeGreaterThan(CLOUD_DOCUMENT_SAFE_BYTES);
    expect(cloudPayloadFingerprint('동일')).toBe(cloudPayloadFingerprint('동일'));
    expect(cloudPayloadFingerprint('동일')).not.toBe(cloudPayloadFingerprint('다름'));
  });

  it('uses the character draft name for a pre-confirmation cloud slot', () => {
    const payload = JSON.stringify({
      bio: { name: '' },
      workflowDrafts: { character: { version: 1, name: 'Bramble' } },
      saveRevision: 2
    });
    expect(summarizeCloudUploadSource(payload)).toMatchObject({
      available: true,
      canUpload: true,
      name: 'Bramble',
      saveRevision: 2
    });
    expect(cloudSlotRecordFromPayload(1, payload, '2026-08-16T13:00:00.000Z').name).toBe('Bramble');
  });

  it('keeps a progressed legacy nameless save downloadable until the player names it', () => {
    const nameless = JSON.stringify({ bio: { name: '' }, journals: [{ id: 'legacy-memory' }], saveRevision: 19 });
    const legacy = readCloudSlotsFromDocument({ [CAMPAIGN_SAVE_KEY]: nameless }, '2026-08-16T13:00:00.000Z');

    expect(legacy.migratedFromLegacy).toBe(true);
    expect(legacy.views[0]).toMatchObject({ empty: false, name: null, saveRevision: 19 });
    expect(confirmManualSlotDownload({ slot: 1, localRaw: null, cloudName: null })).toBe(true);
    expect(summarizeCloudUploadSource(nameless)).toMatchObject({ available: true, canUpload: false, name: null });

    const namedDraft = JSON.stringify({
      bio: { name: '' },
      journals: [{ id: 'legacy-memory' }],
      workflowDrafts: { character: { version: 1, name: '되찾은 이름' } },
      saveRevision: 20
    });
    expect(summarizeCloudUploadSource(namedDraft)).toMatchObject({ canUpload: true, name: '되찾은 이름' });
  });

  it('prefers the named live snapshot over a stale unnamed local snapshot', () => {
    const live = JSON.stringify({
      bio: { name: '' },
      workflowDrafts: { character: { version: 1, name: 'Fresh name' } },
      saveRevision: 8
    });
    const stale = JSON.stringify({ bio: { name: '' }, saveRevision: 7 });
    expect(preferredCloudUploadPayload(live, stale)).toBe(live);
    expect(summarizeCloudUploadSource(live)).toMatchObject({ name: 'Fresh name', canUpload: true });
  });

  it('keeps a newer named local snapshot when a live render is stale', () => {
    const staleLive = JSON.stringify({ bio: { name: 'Old name' }, saveRevision: 7 });
    const newerStored = JSON.stringify({ bio: { name: 'New name' }, saveRevision: 8 });
    expect(preferredCloudUploadPayload(staleLive, newerStored)).toBe(newerStored);
  });

  it('never rolls a newer unnamed recovery snapshot back to an older named save', () => {
    const olderNamed = JSON.stringify({ bio: { name: 'Old name' }, saveRevision: 7 });
    const newerRecovery = JSON.stringify({ bio: { name: '' }, journals: [{ id: 'new' }], saveRevision: 8 });

    expect(preferredCloudUploadPayload(olderNamed, newerRecovery)).toBe(newerRecovery);
    expect(summarizeCloudUploadSource(preferredCloudUploadPayload(olderNamed, newerRecovery))).toMatchObject({
      canUpload: false,
      saveRevision: 8
    });
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

  it('keeps account and active-slot helpers safe when browser storage is unavailable', () => {
    const blocked = {
      getItem() { throw new Error('storage blocked'); },
      setItem() { throw new Error('storage blocked'); },
      removeItem() { throw new Error('storage blocked'); }
    };
    clearCloudAccountBinding(blocked);
    writeActiveCloudSlot(1, blocked);
    expect(readActiveCloudSlot(blocked)).toBe(1);
    expect(readCloudAccountBinding(blocked)).toBeNull();
    expect(writeActiveCloudSlot(2, blocked)).toBe(false);
    expect(writeCloudAccountBinding('user-a', blocked)).toBe(false);
    expect(() => clearCloudAccountBinding(blocked)).not.toThrow();
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
    expect(appSource).toContain('handleDeleteCloudSlot');
    expect(appSource).toContain('handleNameLocalCloudRecord');
    expect(appSource).toContain('이 기록에 이름 붙이기');
    expect(appSource).toContain('workflowDrafts: { ...current.workflowDrafts, character }');
    expect(appSource).toContain('cloud-slots-dialog-backdrop');
    expect(appSource).toContain('deleteCloudSlotRecord');
    expect(appSource).toContain('이 작업은 되돌릴 수 없습니다.');
    expect(appSource).toContain('runTransaction');
    expect(appSource).toContain('userPayloadDocRef(uid, payloadDocumentId)');
    expect(appSource).toContain('getDocFromServer(nestedManifestRef)');
    expect(appSource).toContain('userMapDocRef(uid, mapConnectionArchiveDocumentId(uid))');
    expect(appSource).toContain("getDocFromServer(doc(db, 'saves', OFFICIAL_MAP_POINTER_DOCUMENT_ID))");
    expect(appSource).toContain('cloudMapUidRef.current !== user.uid');
    expect(appSource).toContain('auth?.currentUser?.uid !== uid');
    expect(appSource).toContain('const devicePayload = await readDeviceSave(CAMPAIGN_SAVE_KEY);');
    expect(appSource).toContain('assembleCloudAccountDocument(currentData, uid, records, tombstones)');
    expect(appSource).toContain("throw cloudSlotError('cloud-slot-deleted')");
    expect(appSource).toContain('older documents used `"1"` as well as `"slot-1"`');
    expect(appSource).toContain('transaction.set(docRef, compactDocument)');
    expect(appSource).toContain('cloudSlotPayloadDocumentBelongsToAccount');
    expect(appSource).toContain("payloadFormat: 'utf8-chunks-v1'");
    expect(appSource).toContain('const batch = writeBatch(db);');
    expect(appSource).toContain('chunks.join(\'\')');
    expect(appSource).toContain("cloudSaveDocumentId(uid), 'payloads', payloadDocumentId");
    expect(appSource).toContain("cloudSaveDocumentId(uid), 'maps', mapDocumentId");
    expect(appSource).toContain('readCloudAccountBinding() === uid');
    expect(appSource).toContain('writeDeviceSave(key, jsonString)');
    expect(appSource).toContain('writeCloudSaveDirectly(uid, slot, jsonString)');
    expect(appSource).toContain('브라우저가 이 사이트의 기기 저장을 거부했지만, 클라우드에는 저장했습니다.');
    expect(appSource).toContain('window.confirm.call(window, message)');
    expect(readFileSync(fileURLToPath(new URL('./cloudSlots.ts', import.meta.url)), 'utf8')).toContain('window.confirm.call(window, message)');
  });
});
