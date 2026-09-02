import {
  CAMPAIGN_SAVE_KEY,
  campaignSaveHasNamedApothecary,
  campaignSaveHasProgress,
  parseCampaignSaveRaw
} from './campaignSave';
import { nextCampaignSaveRevision, normalizeSaveRevision } from './revision';

export const CLOUD_SLOT_COUNT = 3;
export const CLOUD_SLOTS_FIELD = 'apawthecaria_cloud_slots';
export const CLOUD_SLOT_TOMBSTONES_FIELD = 'apawthecaria_cloud_slot_tombstones';
export const ACTIVE_CLOUD_SLOT_KEY = 'apawthecaria_active_cloud_slot';
export const CLOUD_ACCOUNT_BINDING_KEY = 'apawthecaria_cloud_account_uid';
export const CLOUD_DOCUMENT_SAFE_BYTES = 950_000;
/** Firestore documents have a 1 MiB hard limit. Payloads are therefore split
 * into comfortably smaller child documents and committed with one manifest.
 * Keep the total below Firestore's 10 MiB atomic write request ceiling. */
export const CLOUD_PAYLOAD_CHUNK_SAFE_BYTES = 700_000;
export const CLOUD_PAYLOAD_SAFE_BYTES = 8_000_000;

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

export type CloudSlotTombstone = {
  slot: CloudSlotId;
  deletedAt: string;
  saveRevision: number;
};

export type CloudUploadSourceView = {
  available: boolean;
  canUpload: boolean;
  name: string | null;
  saveRevision: number;
  payloadBytes: number;
};

const SLOT_IDS: CloudSlotId[] = [1, 2, 3];

// A private browsing context can reject Storage synchronously. Keep the
// binding/active-slot usable for the current tab in that case; on a later
// reload the absence of a durable binding intentionally falls back to the
// safe, manual-account-linking path.
let memoryActiveCloudSlot: CloudSlotId = 1;
let memoryCloudAccountBinding: string | null = null;

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
  (() => {
    if (!documentId) return false;
    const prefix = cloudSlotPayloadDocumentPrefix(uid);
    if (!documentId.startsWith(prefix)) return false;
    // Do not accept another UID merely because it begins with this UID plus
    // `_slot_` (for example `fox` and `fox_slot_archive`).  Every payload id
    // produced by this app has a structured suffix; chunks retain that same
    // suffix before their `_chunk_N` trailer. Firestore ownerUid checks remain
    // the final authority for historical flat documents.
    return /^[123]_\d+_fnv1a-[0-9a-f]{8}-\d+_.+/.test(documentId.slice(prefix.length));
  })();

export const cloudSlotPayloadChunkDocumentId = (payloadDocumentId: string, index: number) =>
  `${payloadDocumentId}_chunk_${Math.max(0, Math.floor(index))}`;

/** Split at UTF-8 character boundaries so concatenating downloaded chunks is
 * byte-for-byte equivalent to the original JSON payload. */
export const splitCloudPayload = (
  payload: string,
  maxChunkBytes = CLOUD_PAYLOAD_CHUNK_SAFE_BYTES
): string[] => {
  if (!payload) return [];
  if (!Number.isFinite(maxChunkBytes) || maxChunkBytes < 4) {
    throw new Error('cloud-payload-invalid-chunk-size');
  }
  const encoded = new TextEncoder().encode(payload);
  if (encoded.byteLength <= maxChunkBytes) return [payload];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const chunks: string[] = [];
  let offset = 0;
  while (offset < encoded.byteLength) {
    let end = Math.min(encoded.byteLength, offset + Math.floor(maxChunkBytes));
    // A continuation byte belongs to the code point beginning before `end`.
    // Leave that whole code point for the next child document.
    while (end < encoded.byteLength && end > offset && (encoded[end] & 0xc0) === 0x80) end -= 1;
    if (end <= offset) throw new Error('cloud-payload-invalid-chunk-size');
    chunks.push(decoder.decode(encoded.subarray(offset, end)));
    offset = end;
  }
  return chunks;
};

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

const slotTombstoneFields = (tombstone: CloudSlotTombstone) => ({
  slot: tombstone.slot,
  deletedAt: tombstone.deletedAt,
  saveRevision: tombstone.saveRevision
});

export const emptyCloudSlotViews = (): CloudSlotView[] =>
  SLOT_IDS.map(slot => ({ slot, empty: true, name: null, uploadedAt: null, saveRevision: 0, payloadBytes: 0 }));

export const readActiveCloudSlot = (storage: Pick<Storage, 'getItem'> = localStorage): CloudSlotId => {
  try {
    const raw = Number(storage.getItem(ACTIVE_CLOUD_SLOT_KEY) || memoryActiveCloudSlot);
    if (isCloudSlotId(raw)) {
      memoryActiveCloudSlot = raw;
      return raw;
    }
  } catch {
    // Some private browsing contexts expose Storage but reject access.
    return memoryActiveCloudSlot;
  }
  return memoryActiveCloudSlot;
};

export const writeActiveCloudSlot = (slot: CloudSlotId, storage: Pick<Storage, 'setItem'> = localStorage) => {
  try {
    storage.setItem(ACTIVE_CLOUD_SLOT_KEY, String(slot));
    memoryActiveCloudSlot = slot;
    return true;
  } catch {
    memoryActiveCloudSlot = slot;
    return false;
  }
};

export const readCloudAccountBinding = (storage: Pick<Storage, 'getItem'> = localStorage): string | null => {
  try {
    const value = storage.getItem(CLOUD_ACCOUNT_BINDING_KEY);
    const uid = value?.trim();
    memoryCloudAccountBinding = uid || null;
    return uid || null;
  } catch {
    return memoryCloudAccountBinding;
  }
};

export const writeCloudAccountBinding = (uid: string, storage: Pick<Storage, 'setItem'> = localStorage) => {
  const normalized = uid.trim();
  if (!normalized) return false;
  try {
    storage.setItem(CLOUD_ACCOUNT_BINDING_KEY, normalized);
    memoryCloudAccountBinding = normalized;
    return true;
  } catch {
    memoryCloudAccountBinding = normalized;
    return false;
  }
};

export const clearCloudAccountBinding = (storage: Pick<Storage, 'removeItem'> = localStorage) => {
  try {
    storage.removeItem(CLOUD_ACCOUNT_BINDING_KEY);
    memoryCloudAccountBinding = null;
    return true;
  } catch {
    // Reads may still expose the old binding even when writes are rejected.
    memoryCloudAccountBinding = null;
    return false;
  }
};

/** The caller must durably detach before replacing the local campaign. A
 * failed metadata write leaves the downloaded record unbound, including after
 * reload; never connect a new campaign to an old persisted slot. */
export const bindDownloadedCloudCampaign = (
  uid: string,
  slot: CloudSlotId,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage
) => {
  if (writeActiveCloudSlot(slot, storage) && writeCloudAccountBinding(uid, storage)) return true;
  clearCloudAccountBinding(storage);
  return false;
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
  const save = parsed.value as {
    bio?: { name?: unknown };
    workflowDrafts?: { character?: { name?: unknown } | unknown };
  };
  const savedName = String(save.bio?.name || '').trim();
  if (savedName) return savedName;
  const draft = save.workflowDrafts?.character;
  return draft && typeof draft === 'object' && !Array.isArray(draft)
    ? String((draft as { name?: unknown }).name || '').trim()
    : '';
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

/**
 * Select the freshest usable local snapshot when a form draft has just been
 * flushed. The debounced localStorage copy can still be the previous unnamed
 * snapshot for one render, so a named live snapshot must win over it.
 */
export const preferredCloudUploadPayload = (
  livePayload: string | null,
  storedPayload: string | null
): string | null => {
  const candidates = [livePayload, storedPayload].filter((payload): payload is string => Boolean(payload));
  return candidates.reduce<string | null>((best, payload) => {
    if (!best) return payload;
    const bestSummary = summarizeCloudUploadSource(best);
    const candidateSummary = summarizeCloudUploadSource(payload);
    if (candidateSummary.saveRevision !== bestSummary.saveRevision) {
      return candidateSummary.saveRevision > bestSummary.saveRevision ? payload : best;
    }
    // A just-committed character name can exist in React before the debounced
    // storage copy catches up. Prefer that named copy only when doing so does
    // not roll the campaign back to an older revision.
    if (candidateSummary.name && !bestSummary.name) return payload;
    return best;
  }, null);
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

type PayloadIdentity = { saveRevision: number; payloadFingerprint: string };
type HydrationRepairBase = PayloadIdentity & { kind: string; ancestors?: PayloadIdentity[] };
const hydratedSourceIdentity = new WeakMap<object, PayloadIdentity>();
const HYDRATION_ANCESTOR_LIMIT = 16;

const repairBaseFromSave = (value: unknown): HydrationRepairBase | null => {
  const candidate = value && typeof value === 'object'
    ? (value as { hydrationRepairBase?: unknown }).hydrationRepairBase
    : null;
  if (!candidate || typeof candidate !== 'object') return null;
  const base = candidate as HydrationRepairBase;
  if (!['state-recovery-v1', 'timer-expiry-v1'].includes(base.kind)
    || typeof base.payloadFingerprint !== 'string'
    || !/^fnv1a-[0-9a-f]{8}-\d+$/.test(base.payloadFingerprint)) return null;
  return {
    ...base,
    saveRevision: normalizeSaveRevision(base.saveRevision),
    ancestors: Array.isArray(base.ancestors)
      ? base.ancestors.filter(row => row && typeof row.payloadFingerprint === 'string'
        && /^fnv1a-[0-9a-f]{8}-\d+$/.test(row.payloadFingerprint))
        .map(row => ({ saveRevision: normalizeSaveRevision(row.saveRevision), payloadFingerprint: row.payloadFingerprint }))
        .slice(-HYDRATION_ANCESTOR_LIMIT)
      : []
  };
};

const payloadIdentity = (payload: string): PayloadIdentity => ({
  saveRevision: revisionFromPayload(payload),
  payloadFingerprint: cloudPayloadFingerprint(payload)
});

/** Keep exact recent parents, not merely a shared repair origin. Two devices
 * can repair the same save and then make different choices. Older unproven
 * branches require a player decision instead of growing an unbounded ledger. */
export const recordCampaignHydrationAncestry = <T extends { saveRevision: number }>(previous: T, next: T): T => {
  const previousBase = repairBaseFromSave(previous);
  const base = repairBaseFromSave(next) || previousBase;
  if (!base) return next;
  const sameBase = previousBase?.saveRevision === base.saveRevision
    && previousBase?.payloadFingerprint === base.payloadFingerprint;
  const candidates = sameBase
    ? [...(previousBase?.ancestors || []), ...(base.ancestors || []),
        hydratedSourceIdentity.get(previous), payloadIdentity(JSON.stringify(previous))]
    : base.ancestors || [];
  const unique = new Map<string, PayloadIdentity>();
  for (const row of candidates) {
    if (!row || row.saveRevision < base.saveRevision || row.saveRevision >= next.saveRevision) continue;
    unique.set(`${row.saveRevision}:${row.payloadFingerprint}`, row);
  }
  const ancestors = [...unique.values()].sort((a, b) => a.saveRevision - b.saveRevision).slice(-HYDRATION_ANCESTOR_LIMIT);
  return { ...next, hydrationRepairBase: { ...base, ancestors } };
};

/** A repair is a real state transition, unlike harmless schema hydration.
 * Retain its source identity so incrementing the revision cannot conceal an
 * already divergent copy on another device. Ordinary schema normalization is
 * not a repair; callers must pass explicit evidence for earlier repair stages. */
export const finalizeCampaignHydrationRepair = <T extends { saveRevision: number }>(
  sourcePayload: string,
  hydrated: T,
  repaired: T,
  earlierRepairApplied = false
): { state: T; repaired: boolean } => {
  const source = parseCampaignSaveRaw(sourcePayload);
  const previousBase = source.ok ? repairBaseFromSave(source.value) : null;
  const sourceIdentity = payloadIdentity(sourcePayload);
  const result = repaired === hydrated && !earlierRepairApplied
    ? { state: hydrated, repaired: false }
    : {
      state: {
        ...repaired,
        saveRevision: nextCampaignSaveRevision(hydrated.saveRevision, repaired.saveRevision),
        hydrationRepairBase: previousBase ? {
          ...previousBase,
          ancestors: [...(previousBase.ancestors || []), sourceIdentity].slice(-HYDRATION_ANCESTOR_LIMIT)
        } : {
          kind: 'state-recovery-v1',
          ...sourceIdentity
        }
      },
      repaired: true
    };
  // Only an in-memory identity is needed: don't persist a normalized copy at
  // the same revision merely to remember which exact cloud payload it came from.
  hydratedSourceIdentity.set(result.state, sourceIdentity);
  return result;
};

/**
 * Detects cross-device divergence that revision ordering alone cannot resolve:
 * different bodies with the same revision, including the source revision of
 * a locally repaired campaign that has not yet reached this cloud slot.
 * The caller must stop automatic sync and ask the player which copy to keep.
 */
export const cloudSlotHasSameRevisionConflict = (
  localPayload: string | null,
  cloudRecord: Pick<CloudSlotRecord, 'payload' | 'saveRevision' | 'payloadFingerprint'> | null | undefined
): boolean => {
  if (!localPayload || !cloudRecord) return false;
  const local = summarizeCloudUploadSource(localPayload);
  if (!local.available) return false;
  const cloudRevision = normalizeSaveRevision(cloudRecord.saveRevision);
  const cloudFingerprint = cloudRecord.payloadFingerprint
    || (cloudRecord.payload ? cloudPayloadFingerprint(cloudRecord.payload) : '');
  if (!cloudFingerprint) return false;
  if (local.saveRevision === cloudRevision) return cloudPayloadFingerprint(localPayload) !== cloudFingerprint;
  const parsed = parseCampaignSaveRaw(localPayload);
  const base = parsed.ok ? repairBaseFromSave(parsed.value) : null;
  if (!base || cloudRevision < base.saveRevision || cloudRevision >= local.saveRevision) return false;
  const knownParent = [base, ...(base.ancestors || [])].some(parent =>
    parent.saveRevision === cloudRevision && parent.payloadFingerprint === cloudFingerprint);
  return !knownParent;
};

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

const tombstoneFromUnknown = (slot: CloudSlotId, value: unknown): CloudSlotTombstone | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as { deletedAt?: unknown; saveRevision?: unknown };
  const deletedAt = parseUploadedAt(row.deletedAt);
  if (!deletedAt) return null;
  return {
    slot,
    deletedAt,
    saveRevision: normalizeSaveRevision(row.saveRevision)
  };
};

export const readCloudSlotsFromDocument = (
  data: Record<string, unknown> | null | undefined,
  documentUpdatedAt: string | null = null
): {
  records: Array<CloudSlotRecord | null>;
  tombstones: Array<CloudSlotTombstone | null>;
  views: CloudSlotView[];
  migratedFromLegacy: boolean;
} => {
  const tombstonesField = data?.[CLOUD_SLOT_TOMBSTONES_FIELD];
  const tombstones: Array<CloudSlotTombstone | null> = [null, null, null];
  if (tombstonesField && typeof tombstonesField === 'object') {
    const map = tombstonesField as Record<string, unknown>;
    for (const slot of SLOT_IDS) {
      tombstones[slot - 1] = tombstoneFromUnknown(
        slot,
        map[cloudSlotMapKey(slot)] ?? map[String(slot)] ?? map[slot]
      );
    }
  }

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
      // A deletion marker is authoritative until the player explicitly
      // uploads into this slot again. This keeps a delayed autosave from an
      // older tab or another device from making a deleted slot reappear.
      if (tombstones[slot - 1]) records[slot - 1] = null;
    }
  }

  const legacyRaw = data?.[CAMPAIGN_SAVE_KEY];
  const migratedFromLegacy = !records[0] && !tombstones[0]
    && typeof legacyRaw === 'string' && legacyRaw.length > 0;
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

  return { records, tombstones, views, migratedFromLegacy };
};

export const cloudSlotWriteFields = (record: CloudSlotRecord): Record<string, unknown> => {
  const fields: Record<string, unknown> = {
    [`${CLOUD_SLOTS_FIELD}.${cloudSlotMapKey(record.slot)}`]: slotRecordFields(record)
  };
  if (record.slot === 1 && !record.storagePath && !record.payloadDocumentId) fields[CAMPAIGN_SAVE_KEY] = record.payload;
  return fields;
};

export const assembleCloudSlotDocument = (
  records: Array<CloudSlotRecord | null | undefined>,
  tombstones: Array<CloudSlotTombstone | null | undefined> = []
): Record<string, unknown> => {
  const slots: Record<string, ReturnType<typeof slotRecordFields>> = {};
  const deletedSlots: Record<string, ReturnType<typeof slotTombstoneFields>> = {};
  for (const record of records) {
    if (!record) continue;
    slots[cloudSlotMapKey(record.slot)] = slotRecordFields(record);
  }
  for (const tombstone of tombstones) {
    if (!tombstone) continue;
    deletedSlots[cloudSlotMapKey(tombstone.slot)] = slotTombstoneFields(tombstone);
  }
  const first = records[0] || null;
  return {
    ...(first && !first.storagePath && !first.payloadDocumentId ? { [CAMPAIGN_SAVE_KEY]: first.payload } : {}),
    [CLOUD_SLOTS_FIELD]: slots,
    ...(Object.keys(deletedSlots).length > 0 ? { [CLOUD_SLOT_TOMBSTONES_FIELD]: deletedSlots } : {})
  };
};

export const assembleNewCloudSlotDocument = (record: CloudSlotRecord): Record<string, unknown> => {
  const records: Array<CloudSlotRecord | null> = [null, null, null];
  records[record.slot - 1] = record;
  return assembleCloudSlotDocument(records);
};

/**
 * Replace the cloud-slot portion of an account document while retaining
 * unrelated account metadata. A full replacement of the managed maps is
 * important: Firestore's recursive merge would otherwise retain old numeric
 * aliases and deletion markers that are intentionally being cleared.
 */
export const assembleCloudAccountDocument = (
  currentData: Record<string, unknown> | null | undefined,
  ownerUid: string,
  records: Array<CloudSlotRecord | null | undefined>,
  tombstones: Array<CloudSlotTombstone | null | undefined> = []
): Record<string, unknown> => {
  const preserved = { ...(currentData || {}) };
  delete preserved[CAMPAIGN_SAVE_KEY];
  delete preserved[CLOUD_SLOTS_FIELD];
  delete preserved[CLOUD_SLOT_TOMBSTONES_FIELD];
  delete preserved.ownerUid;
  return {
    ...preserved,
    ownerUid,
    ...assembleCloudSlotDocument(records, tombstones)
  };
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

export const mergeCloudSlotTombstone = (
  tombstones: Array<CloudSlotTombstone | null | undefined>,
  slot: CloudSlotId,
  tombstone: CloudSlotTombstone | null
): Array<CloudSlotTombstone | null> => {
  const next: Array<CloudSlotTombstone | null> = [null, null, null];
  tombstones.forEach((row, index) => {
    if (row) next[index] = row;
  });
  next[slot - 1] = tombstone;
  return next;
};

export const cloudSlotDeletionTombstone = (
  record: CloudSlotRecord,
  deletedAt = new Date().toISOString()
): CloudSlotTombstone => ({
  slot: record.slot,
  deletedAt: parseUploadedAt(deletedAt) || new Date().toISOString(),
  saveRevision: normalizeSaveRevision(record.saveRevision)
});

export const cloudSlotTombstoneBlocksWrite = (
  tombstone: CloudSlotTombstone | null | undefined,
  manualUpload: boolean
) => Boolean(tombstone) && !manualUpload;

export const estimateCloudSlotDocumentBytes = (records: Array<CloudSlotRecord | null | undefined>): number =>
  cloudPayloadByteLength(JSON.stringify(assembleCloudSlotDocument(records)));

const askBoundWindowConfirm = (message: string) => window.confirm.call(window, message);

export const manualSlotDownloadConfirmationMessage = (input: {
  slot: CloudSlotId;
  localRaw: string | null;
  cloudName: string | null;
}): string | null => {
  const parsed = parseCampaignSaveRaw(input.localRaw);
  const localHasProgress = parsed.ok && campaignSaveHasProgress(parsed.value);
  if (!localHasProgress) return null;
  const name = input.cloudName?.trim();
  return name
    ? `클라우드 슬롯 ${input.slot}의 ${name} 기록으로 이 기기 기록을 덮어쓸까요? 지금 기기의 로컬 진행은 사라집니다.`
    : `클라우드 슬롯 ${input.slot} 기록으로 이 기기 기록을 덮어쓸까요? 지금 기기의 로컬 진행은 사라집니다.`;
};

export const confirmManualSlotDownload = (input: {
  slot: CloudSlotId;
  localRaw: string | null;
  cloudName: string | null;
  confirm?: (message: string) => boolean;
}): boolean => {
  const message = manualSlotDownloadConfirmationMessage(input);
  if (!message) return true;
  return (input.confirm ?? askBoundWindowConfirm)(message);
};

type ManualSlotUploadConfirmationInput = {
  slot: CloudSlotId;
  localRaw: string;
  occupied: boolean;
  cloudName: string | null;
  cloudRevision?: number;
  cloudUploadedAt?: string | null;
  accountLabel?: string | null;
  accountChanged?: boolean;
};

export const manualSlotUploadConfirmationMessage = (
  input: ManualSlotUploadConfirmationInput
): string | null => {
  if (!input.occupied && !input.accountChanged) return null;
  const localName = nameFromPayload(input.localRaw) || '로컬';
  const localRevision = revisionFromPayload(input.localRaw);
  const cloudName = input.cloudName?.trim();
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
  return `${accountNotice}${action}${uploadedAtNotice}${newerCloudNotice}`;
};

export const confirmManualSlotUpload = (input: ManualSlotUploadConfirmationInput & {
  confirm?: (message: string) => boolean;
}): boolean => {
  const parsed = parseCampaignSaveRaw(input.localRaw);
  if (!parsed.ok || !campaignSaveHasNamedApothecary(parsed.value)) return false;
  const message = manualSlotUploadConfirmationMessage(input);
  if (!message) return true;
  return (input.confirm ?? askBoundWindowConfirm)(message);
};
