import {
  CAMPAIGN_SAVE_KEY,
  campaignSaveHasNamedApothecary,
  campaignSaveHasProgress,
  parseCampaignSaveRaw
} from './campaignSave';
import { normalizeSaveRevision } from './revision';

export const CLOUD_SLOT_COUNT = 3;
export const CLOUD_SLOTS_FIELD = 'apawthecaria_cloud_slots';
export const ACTIVE_CLOUD_SLOT_KEY = 'apawthecaria_active_cloud_slot';
export const CLOUD_ACCOUNT_BINDING_KEY = 'apawthecaria_cloud_account_uid';
export const CLOUD_DOCUMENT_SAFE_BYTES = 950_000;
export const CLOUD_PAYLOAD_SAFE_BYTES = 900_000;

export type CloudSlotId = 1 | 2 | 3;

export type CloudSlotRecord = {
  slot: CloudSlotId;
  payload: string;
  uploadedAt: string;
  name: string;
  saveRevision: number;
  payloadDocumentId?: string;
  storagePath?: string;
  payloadBytes?: number;
  payloadFingerprint?: string;
};

export type CloudSlotView = {
  slot: CloudSlotId;
  empty: boolean;
  name: string | null;
  uploadedAt: string | null;
  saveRevision: number;
  payloadBytes: number;
};

export type CloudUploadSourceView = {
  available: boolean;
  canUpload: boolean;
  name: string | null;
  saveRevision: number;
  payloadBytes: number;
};

const SLOT_IDS: CloudSlotId[] = [1, 2, 3];

export const cloudSlotMapKey = (slot: CloudSlotId) => `slot-${slot}`;

export const cloudSaveDocumentId = (uid: string) => `uid_${uid.trim()}`;

export const cloudPayloadByteLength = (payload: string) => new TextEncoder().encode(payload).byteLength;

export const cloudPayloadFingerprint = (payload: string) => {
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}-${cloudPayloadByteLength(payload)}`;
};

const safeAccountPathSegment = (uid: string) => encodeURIComponent(uid.trim());

const createCloudStorageNonce = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const cloudSlotStoragePrefix = (uid: string) => `cloudSaves/${safeAccountPathSegment(uid)}/`;

export const cloudSlotStoragePath = (uid: string, record: CloudSlotRecord, nonce = createCloudStorageNonce()) =>
  `${cloudSlotStoragePrefix(uid)}slot-${record.slot}/${record.saveRevision}-${record.payloadFingerprint || cloudPayloadFingerprint(record.payload)}-${nonce}.json`;

export const cloudSlotPathBelongsToAccount = (path: string, uid: string) =>
  Boolean(path) && path.startsWith(cloudSlotStoragePrefix(uid));

export const cloudSlotPayloadDocumentPrefix = (uid: string) =>
  `${cloudSaveDocumentId(encodeURIComponent(uid.trim()))}_slot_`;

export const cloudSlotPayloadDocumentId = (
  uid: string,
  record: CloudSlotRecord,
  nonce = createCloudStorageNonce()
) => `${cloudSlotPayloadDocumentPrefix(uid)}${record.slot}_${record.saveRevision}_${record.payloadFingerprint || cloudPayloadFingerprint(record.payload)}_${nonce}`;

export const cloudSlotPayloadDocumentBelongsToAccount = (documentId: string, uid: string) =>
  Boolean(documentId) && documentId.startsWith(cloudSlotPayloadDocumentPrefix(uid));

export const formatCloudPayloadBytes = (bytes: number) => `${Math.max(0, Math.ceil(bytes / 1024)).toLocaleString('ko-KR')}KB`;

const isCloudSlotId = (value: unknown): value is CloudSlotId =>
  value === 1 || value === 2 || value === 3;

const slotRecordFields = (record: CloudSlotRecord) => ({
  slot: record.slot,
  ...(record.payloadDocumentId ? {
    payloadDocumentId: record.payloadDocumentId,
    payloadBytes: record.payloadBytes ?? cloudPayloadByteLength(record.payload),
    payloadFingerprint: record.payloadFingerprint || cloudPayloadFingerprint(record.payload)
  } : record.storagePath ? {
    storagePath: record.storagePath,
    payloadBytes: record.payloadBytes ?? cloudPayloadByteLength(record.payload),
    payloadFingerprint: record.payloadFingerprint || cloudPayloadFingerprint(record.payload)
  } : { payload: record.payload }),
  uploadedAt: record.uploadedAt,
  name: record.name,
  saveRevision: record.saveRevision
});

export const emptyCloudSlotViews = (): CloudSlotView[] =>
  SLOT_IDS.map(slot => ({ slot, empty: true, name: null, uploadedAt: null, saveRevision: 0, payloadBytes: 0 }));

export const readActiveCloudSlot = (storage: Pick<Storage, 'getItem'> = localStorage): CloudSlotId => {
  const raw = Number(storage.getItem(ACTIVE_CLOUD_SLOT_KEY) || 1);
  return isCloudSlotId(raw) ? raw : 1;
};

export const writeActiveCloudSlot = (slot: CloudSlotId, storage: Pick<Storage, 'setItem'> = localStorage) => {
  storage.setItem(ACTIVE_CLOUD_SLOT_KEY, String(slot));
};

export const readCloudAccountBinding = (storage: Pick<Storage, 'getItem'> = localStorage): string | null => {
  const uid = storage.getItem(CLOUD_ACCOUNT_BINDING_KEY)?.trim();
  return uid || null;
};

export const writeCloudAccountBinding = (uid: string, storage: Pick<Storage, 'setItem'> = localStorage) => {
  const normalized = uid.trim();
  if (normalized) storage.setItem(CLOUD_ACCOUNT_BINDING_KEY, normalized);
};

export const parseUploadedAt = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
};

export const formatCloudSlotUploadedAt = (iso: string | null): string => {
  const parsed = parseUploadedAt(iso);
  if (!parsed) return '시각 미상';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(new Date(parsed));
};

const nameFromPayload = (payload: string): string => {
  const parsed = parseCampaignSaveRaw(payload);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object') return '';
  return String((parsed.value as { bio?: { name?: string } }).bio?.name || '').trim();
};

const revisionFromPayload = (payload: string): number => {
  const parsed = parseCampaignSaveRaw(payload);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object') return 0;
  return normalizeSaveRevision((parsed.value as { saveRevision?: unknown }).saveRevision);
};

export const summarizeCloudUploadSource = (payload: string | null): CloudUploadSourceView => {
  if (!payload) return { available: false, canUpload: false, name: null, saveRevision: 0, payloadBytes: 0 };
  const parsed = parseCampaignSaveRaw(payload);
  const payloadBytes = cloudPayloadByteLength(payload);
  if (!parsed.ok) return { available: true, canUpload: false, name: null, saveRevision: 0, payloadBytes };
  const name = nameFromPayload(payload) || null;
  return {
    available: true,
    canUpload: Boolean(name) && payloadBytes < CLOUD_PAYLOAD_SAFE_BYTES,
    name,
    saveRevision: revisionFromPayload(payload),
    payloadBytes
  };
};

export const cloudSlotRecordFromPayload = (
  slot: CloudSlotId,
  payload: string,
  uploadedAt: string
): CloudSlotRecord => ({
  slot,
  payload,
  uploadedAt: parseUploadedAt(uploadedAt) || new Date().toISOString(),
  name: nameFromPayload(payload),
  saveRevision: revisionFromPayload(payload),
  payloadBytes: cloudPayloadByteLength(payload),
  payloadFingerprint: cloudPayloadFingerprint(payload)
});

const recordFromUnknown = (slot: CloudSlotId, value: unknown, fallbackUploadedAt: string | null): CloudSlotRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as {
    payload?: unknown;
    uploadedAt?: unknown;
    name?: unknown;
    saveRevision?: unknown;
    storagePath?: unknown;
    payloadBytes?: unknown;
    payloadFingerprint?: unknown;
    payloadDocumentId?: unknown;
  };
  const payload = typeof row.payload === 'string' ? row.payload : '';
  const storagePath = typeof row.storagePath === 'string' ? row.storagePath.trim() : '';
  const payloadDocumentId = typeof row.payloadDocumentId === 'string' ? row.payloadDocumentId.trim() : '';
  if (!payload && !storagePath && !payloadDocumentId) return null;
  const storedRevision = normalizeSaveRevision(row.saveRevision);
  const storedBytes = typeof row.payloadBytes === 'number' && Number.isFinite(row.payloadBytes) && row.payloadBytes >= 0
    ? Math.floor(row.payloadBytes)
    : undefined;
  return {
    slot,
    payload,
    uploadedAt: parseUploadedAt(row.uploadedAt) || fallbackUploadedAt || new Date().toISOString(),
    name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : nameFromPayload(payload),
    saveRevision: storedRevision || revisionFromPayload(payload),
    ...(payloadDocumentId ? { payloadDocumentId } : {}),
    ...(storagePath ? { storagePath } : {}),
    ...(storedBytes !== undefined
      ? { payloadBytes: storedBytes }
      : payload ? { payloadBytes: cloudPayloadByteLength(payload) } : {}),
    ...(typeof row.payloadFingerprint === 'string' && row.payloadFingerprint.trim()
      ? { payloadFingerprint: row.payloadFingerprint.trim() }
      : payload ? { payloadFingerprint: cloudPayloadFingerprint(payload) } : {})
  };
};

export const readCloudSlotsFromDocument = (
  data: Record<string, unknown> | null | undefined,
  documentUpdatedAt: string | null = null
): {
  records: Array<CloudSlotRecord | null>;
  views: CloudSlotView[];
  migratedFromLegacy: boolean;
} => {
  const slotsField = data?.[CLOUD_SLOTS_FIELD];
  const records: Array<CloudSlotRecord | null> = [null, null, null];
  if (slotsField && typeof slotsField === 'object') {
    const map = slotsField as Record<string, unknown>;
    for (const slot of SLOT_IDS) {
      records[slot - 1] = recordFromUnknown(
        slot,
        map[cloudSlotMapKey(slot)] ?? map[String(slot)] ?? map[slot],
        documentUpdatedAt
      );
    }
  }

  const legacyRaw = data?.[CAMPAIGN_SAVE_KEY];
  const migratedFromLegacy = !records[0] && typeof legacyRaw === 'string' && legacyRaw.length > 0;
  if (migratedFromLegacy) {
    records[0] = cloudSlotRecordFromPayload(1, legacyRaw, documentUpdatedAt || new Date().toISOString());
  }

  const views = records.map((record, index) => (
    record
      ? {
          slot: SLOT_IDS[index],
          empty: false,
          name: record.name || null,
          uploadedAt: record.uploadedAt,
          saveRevision: record.saveRevision,
          payloadBytes: record.payloadBytes ?? cloudPayloadByteLength(record.payload)
        }
      : { slot: SLOT_IDS[index], empty: true, name: null, uploadedAt: null, saveRevision: 0, payloadBytes: 0 }
  ));

  return { records, views, migratedFromLegacy };
};

export const cloudSlotWriteFields = (record: CloudSlotRecord): Record<string, unknown> => {
  const fields: Record<string, unknown> = {
    [`${CLOUD_SLOTS_FIELD}.${cloudSlotMapKey(record.slot)}`]: slotRecordFields(record)
  };
  if (record.slot === 1 && !record.storagePath && !record.payloadDocumentId) fields[CAMPAIGN_SAVE_KEY] = record.payload;
  return fields;
};

export const assembleCloudSlotDocument = (
  records: Array<CloudSlotRecord | null | undefined>
): Record<string, unknown> => {
  const slots: Record<string, ReturnType<typeof slotRecordFields>> = {};
  for (const record of records) {
    if (!record) continue;
    slots[cloudSlotMapKey(record.slot)] = slotRecordFields(record);
  }
  const first = records[0] || null;
  return {
    ...(first && !first.storagePath && !first.payloadDocumentId ? { [CAMPAIGN_SAVE_KEY]: first.payload } : {}),
    [CLOUD_SLOTS_FIELD]: slots
  };
};

export const assembleNewCloudSlotDocument = (record: CloudSlotRecord): Record<string, unknown> => {
  const records: Array<CloudSlotRecord | null> = [null, null, null];
  records[record.slot - 1] = record;
  return assembleCloudSlotDocument(records);
};

export const mergeCloudSlotRecord = (
  records: Array<CloudSlotRecord | null | undefined>,
  record: CloudSlotRecord
): Array<CloudSlotRecord | null> => {
  const next: Array<CloudSlotRecord | null> = [null, null, null];
  records.forEach((row, index) => {
    if (row) next[index] = row;
  });
  next[record.slot - 1] = record;
  return next;
};

export const estimateCloudSlotDocumentBytes = (records: Array<CloudSlotRecord | null | undefined>): number =>
  cloudPayloadByteLength(JSON.stringify(assembleCloudSlotDocument(records)));

const askBoundWindowConfirm = (message: string) => window.confirm.call(window, message);

export const confirmManualSlotDownload = (input: {
  slot: CloudSlotId;
  localRaw: string | null;
  cloudName: string | null;
  confirm?: (message: string) => boolean;
}): boolean => {
  const parsed = parseCampaignSaveRaw(input.localRaw);
  const localHasProgress = parsed.ok && campaignSaveHasProgress(parsed.value);
  if (!localHasProgress) return true;
  const name = input.cloudName?.trim();
  const ask = input.confirm ?? askBoundWindowConfirm;
  return ask(
    name
      ? `클라우드 슬롯 ${input.slot}의 ${name} 기록으로 이 기기 기록을 덮어쓸까요? 지금 기기의 로컬 진행은 사라집니다.`
      : `클라우드 슬롯 ${input.slot} 기록으로 이 기기 기록을 덮어쓸까요? 지금 기기의 로컬 진행은 사라집니다.`
  );
};

export const confirmManualSlotUpload = (input: {
  slot: CloudSlotId;
  localRaw: string;
  occupied: boolean;
  cloudName: string | null;
  cloudRevision?: number;
  cloudUploadedAt?: string | null;
  accountLabel?: string | null;
  accountChanged?: boolean;
  confirm?: (message: string) => boolean;
}): boolean => {
  const parsed = parseCampaignSaveRaw(input.localRaw);
  if (!parsed.ok || !campaignSaveHasNamedApothecary(parsed.value)) return false;
  if (!input.occupied && !input.accountChanged) return true;
  const localName = nameFromPayload(input.localRaw) || '로컬';
  const localRevision = revisionFromPayload(input.localRaw);
  const cloudName = input.cloudName?.trim();
  const ask = input.confirm ?? askBoundWindowConfirm;
  const accountNotice = input.accountChanged
    ? `현재 기기 기록은 다른 Google 계정과 연결되어 있습니다. ${input.accountLabel || '지금 로그인한 계정'}에 새로 연결합니다.\n\n`
    : '';
  const newerCloudNotice = input.occupied && normalizeSaveRevision(input.cloudRevision) > localRevision
    ? `\n\n주의: 클라우드 기록(저장 버전 ${normalizeSaveRevision(input.cloudRevision)})이 이 기기 기록(저장 버전 ${localRevision})보다 최신입니다.`
    : '';
  const uploadedAtNotice = input.occupied && input.cloudUploadedAt
    ? `\n마지막 업로드: ${formatCloudSlotUploadedAt(input.cloudUploadedAt)}`
    : '';
  const action = input.occupied
    ? cloudName
      ? `슬롯 ${input.slot}에 이미 ${cloudName} 기록이 있습니다. 지금 이 기기의 ${localName} 기록으로 덮어쓸까요?`
      : `슬롯 ${input.slot}에 이미 기록이 있습니다. 지금 이 기기의 ${localName} 기록으로 덮어쓸까요?`
    : `빈 슬롯 ${input.slot}에 이 기기의 ${localName} 기록을 올릴까요?`;
  return ask(`${accountNotice}${action}${uploadedAtNotice}${newerCloudNotice}`);
};
