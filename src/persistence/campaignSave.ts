import { normalizeSaveRevision } from './revision';

export const CAMPAIGN_SAVE_KEY = 'apawthecaria_rpg_state';

export type CloudSaveAction = 'load-cloud' | 'keep-local' | 'upload-local';

type CampaignSaveShape = {
  bio?: { name?: string };
  journals?: unknown[];
  journeyActive?: boolean;
  journey?: unknown;
  patients?: unknown[];
  patientArchive?: unknown[];
  routeDraft?: { stops?: unknown[] };
  calendarDays?: number;
  downtimeRequired?: boolean;
  downtimeCompleted?: boolean;
  saveRevision?: unknown;
  workflowDrafts?: {
    character?: { name?: unknown } | unknown;
    patient?: unknown;
    journey?: unknown;
  };
  pendingTreatmentReward?: unknown;
};

const CAMPAIGN_SAVE_MARKERS = new Set([
  'schemaVersion', 'rulesetId', 'rulebookEdition', 'bio', 'bag', 'journals',
  'journeyActive', 'journey', 'patients', 'activePatientId', 'activeAilment',
  'patientArchive', 'patientCasebook', 'routeDraft', 'currentSeason',
  'currentLocationName', 'calendarDays', 'downtimeRequired', 'saveRevision',
  'workflowDrafts', 'pendingTreatmentReward'
]);

/** Accepts partial historical saves, but not arrays or unrelated JSON objects. */
export const isRecognizableCampaignSave = (parsed: unknown): parsed is Record<string, unknown> => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
  return Object.keys(parsed).some(key => CAMPAIGN_SAVE_MARKERS.has(key));
};

export const campaignSaveHasNamedApothecary = (parsed: unknown): boolean => {
  if (!parsed || typeof parsed !== 'object') return false;
  const save = parsed as CampaignSaveShape;
  const savedName = typeof save.bio?.name === 'string' ? save.bio.name.trim() : '';
  if (savedName) return true;
  // Character creation is intentionally persisted as a draft. A player who
  // has already entered their name should be able to back that draft up to
  // the signed-in slot before finishing the remaining card choices.
  const draft = save.workflowDrafts?.character;
  const draftName = draft && typeof draft === 'object' && !Array.isArray(draft)
    ? String((draft as { name?: unknown }).name || '').trim()
    : '';
  return Boolean(draftName);
};

export const campaignSaveHasProgress = (parsed: unknown): boolean => {
  if (!parsed || typeof parsed !== 'object') return false;
  const save = parsed as CampaignSaveShape;
  return campaignSaveHasNamedApothecary(save)
    || (Array.isArray(save.journals) && save.journals.length > 0)
    || Boolean(save.journeyActive || save.journey)
    || (Array.isArray(save.patients) && save.patients.length > 0)
    || (Array.isArray(save.patientArchive) && save.patientArchive.length > 0)
    || (Array.isArray(save.routeDraft?.stops) && save.routeDraft.stops.length > 1)
    || normalizeSaveRevision(save.saveRevision) > 0
    || (typeof save.calendarDays === 'number' && save.calendarDays > 0)
    || Boolean(save.downtimeRequired || save.downtimeCompleted)
    || Boolean(save.workflowDrafts?.character || save.workflowDrafts?.patient || save.workflowDrafts?.journey)
    || Boolean(save.pendingTreatmentReward);
};

export const tryMigrateCampaignSave = <T>(
  raw: unknown,
  migrate: (value: unknown) => T
): { ok: true; state: T } | { ok: false } => {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false };
    return { ok: true, state: migrate(raw) };
  } catch (error) {
    console.error('게임 저장 데이터 마이그레이션 실패. 기존 파일은 유지합니다.', error);
    return { ok: false };
  }
};

export const parseCampaignSaveRaw = (raw: string | null): { ok: true; value: unknown } | { ok: false } => {
  if (!raw) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
};

/** Load a campaign save without ever deleting the stored raw payload. */
export const readCampaignSaveWithoutWipe = (
  storage: Pick<Storage, 'getItem'>,
  migrate: (value: unknown) => unknown
): { ok: true; state: unknown } | { ok: false; raw: string | null } => {
  const raw = storage.getItem(CAMPAIGN_SAVE_KEY);
  const parsed = parseCampaignSaveRaw(raw);
  if (!parsed.ok) return { ok: false, raw };
  const migrated = tryMigrateCampaignSave(parsed.value, migrate);
  if (!migrated.ok) return { ok: false, raw };
  return migrated;
};

export const decideCloudSaveAction = (input: {
  localRaw: string | null;
  cloudRevision: number;
  cloudHasNamedApothecary?: boolean;
  confirmOverwrite: () => boolean;
}): CloudSaveAction => {
  const cloudRevision = normalizeSaveRevision(input.cloudRevision);
  const cloudHasNamed = Boolean(input.cloudHasNamedApothecary);
  if (!input.localRaw) return cloudHasNamed || cloudRevision > 0 ? 'load-cloud' : 'keep-local';
  const parsed = parseCampaignSaveRaw(input.localRaw);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object') {
    return cloudHasNamed ? 'load-cloud' : 'keep-local';
  }
  const localParsed = parsed.value as CampaignSaveShape;
  const localHasName = campaignSaveHasNamedApothecary(localParsed);
  const localHasProgress = campaignSaveHasProgress(localParsed);
  const isLocalDefault = !localHasProgress;
  const localRevision = normalizeSaveRevision(localParsed.saveRevision);

  if (cloudHasNamed && !localHasName) {
    if (!localHasProgress || input.confirmOverwrite()) return 'load-cloud';
    return 'keep-local';
  }
  if (isLocalDefault) return cloudHasNamed || cloudRevision > 0 ? 'load-cloud' : 'keep-local';
  if (cloudRevision > localRevision) {
    if (!localHasProgress || input.confirmOverwrite()) return 'load-cloud';
    return 'keep-local';
  }
  if (localRevision > cloudRevision) return localHasName ? 'upload-local' : (cloudHasNamed ? 'load-cloud' : 'keep-local');
  if (cloudRevision === localRevision && localRevision === 0 && cloudHasNamed && input.confirmOverwrite()) {
    return 'load-cloud';
  }
  return 'keep-local';
};
