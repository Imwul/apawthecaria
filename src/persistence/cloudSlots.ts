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

export type CloudSlotId = 1 | 2 | 3;

export type CloudSlotRecord = {
  slot: CloudSlotId;
  payload: string;
  uploadedAt: string;
  name: string;
  saveRevision: number;
};

export type CloudSlotView = {
  slot: CloudSlotId;
  empty: boolean;
  name: string | null;
  uploadedAt: string | null;
  saveRevision: number;
};

const SLOT_IDS: CloudSlotId[] = [1, 2, 3];

export const cloudSlotMapKey = (slot: CloudSlotId) => `slot-${slot}`;

const isCloudSlotId = (value: unknown): value is CloudSlotId =>
  value === 1 || value === 2 || value === 3;

const slotRecordFields = (record: CloudSlotRecord) => ({
  slot: record.slot,
  payload: record.payload,
  uploadedAt: record.uploadedAt,
  name: record.name,
  saveRevision: record.saveRevision
});

export const emptyCloudSlotViews = (): CloudSlotView[] =>
  SLOT_IDS.map(slot => ({ slot, empty: true, name: null, uploadedAt: null, saveRevision: 0 }));

export const readActiveCloudSlot = (storage: Pick<Storage, 'getItem'> = localStorage): CloudSlotId => {
  const raw = Number(storage.getItem(ACTIVE_CLOUD_SLOT_KEY) || 1);
  return isCloudSlotId(raw) ? raw : 1;
};

export const writeActiveCloudSlot = (slot: CloudSlotId, storage: Pick<Storage, 'setItem'> = localStorage) => {
  storage.setItem(ACTIVE_CLOUD_SLOT_KEY, String(slot));
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

export const cloudSlotRecordFromPayload = (
  slot: CloudSlotId,
  payload: string,
  uploadedAt: string
): CloudSlotRecord => ({
  slot,
  payload,
  uploadedAt: parseUploadedAt(uploadedAt) || new Date().toISOString(),
  name: nameFromPayload(payload),
  saveRevision: revisionFromPayload(payload)
});

const recordFromUnknown = (slot: CloudSlotId, value: unknown, fallbackUploadedAt: string | null): CloudSlotRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as { payload?: unknown; uploadedAt?: unknown; name?: unknown; saveRevision?: unknown };
  if (typeof row.payload !== 'string' || !row.payload) return null;
  const storedRevision = normalizeSaveRevision(row.saveRevision);
  return {
    slot,
    payload: row.payload,
    uploadedAt: parseUploadedAt(row.uploadedAt) || fallbackUploadedAt || new Date().toISOString(),
    name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : nameFromPayload(row.payload),
    saveRevision: storedRevision || revisionFromPayload(row.payload)
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
          saveRevision: record.saveRevision
        }
      : { slot: SLOT_IDS[index], empty: true, name: null, uploadedAt: null, saveRevision: 0 }
  ));

  return { records, views, migratedFromLegacy };
};

export const cloudSlotWriteFields = (record: CloudSlotRecord): Record<string, unknown> => {
  const fields: Record<string, unknown> = {
    [`${CLOUD_SLOTS_FIELD}.${cloudSlotMapKey(record.slot)}`]: slotRecordFields(record)
  };
  if (record.slot === 1) fields[CAMPAIGN_SAVE_KEY] = record.payload;
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
    ...(first ? { [CAMPAIGN_SAVE_KEY]: first.payload } : {}),
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
  confirm?: (message: string) => boolean;
}): boolean => {
  const parsed = parseCampaignSaveRaw(input.localRaw);
  if (!parsed.ok || !campaignSaveHasNamedApothecary(parsed.value)) return false;
  if (!input.occupied) return true;
  const localName = nameFromPayload(input.localRaw) || '로컬';
  const cloudName = input.cloudName?.trim();
  const ask = input.confirm ?? askBoundWindowConfirm;
  return ask(
    cloudName
      ? `슬롯 ${input.slot}에 이미 ${cloudName} 기록이 있습니다. 지금 이 기기의 ${localName} 기록으로 덮어쓸까요?`
      : `슬롯 ${input.slot}에 이미 기록이 있습니다. 지금 이 기기의 ${localName} 기록으로 덮어쓸까요?`
  );
};
