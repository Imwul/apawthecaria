export const CAMPAIGN_SAVE_KEY = 'apawthecaria_rpg_state';

export type CloudSaveAction = 'load-cloud' | 'keep-local' | 'upload-local';

type CampaignSaveShape = {
  bio?: { name?: string };
  journals?: unknown[];
  journeyActive?: boolean;
  saveRevision?: number;
};

export const campaignSaveHasNamedApothecary = (parsed: unknown): boolean => {
  if (!parsed || typeof parsed !== 'object') return false;
  return Boolean((parsed as CampaignSaveShape).bio?.name?.trim());
};

export const campaignSaveHasProgress = (parsed: unknown): boolean => {
  if (!parsed || typeof parsed !== 'object') return false;
  const save = parsed as CampaignSaveShape;
  return campaignSaveHasNamedApothecary(save)
    || (Array.isArray(save.journals) && save.journals.length > 0)
    || Boolean(save.journeyActive);
};

export const tryMigrateCampaignSave = <T>(
  raw: unknown,
  migrate: (value: unknown) => T
): { ok: true; state: T } | { ok: false } => {
  try {
    if (!raw || typeof raw !== 'object') return { ok: false };
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
  const cloudHasNamed = Boolean(input.cloudHasNamedApothecary);
  if (!input.localRaw) return cloudHasNamed || input.cloudRevision > 0 ? 'load-cloud' : 'keep-local';
  const parsed = parseCampaignSaveRaw(input.localRaw);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object') {
    return cloudHasNamed ? 'load-cloud' : 'keep-local';
  }
  const localParsed = parsed.value as CampaignSaveShape;
  const localHasName = campaignSaveHasNamedApothecary(localParsed);
  const isLocalDefault = !localHasName && (!localParsed.journals || localParsed.journals.length === 0);
  const localRevision = Number(localParsed.saveRevision || 0);
  const localHasProgress = campaignSaveHasProgress(localParsed);

  if (cloudHasNamed && !localHasName) return 'load-cloud';
  if (isLocalDefault) return cloudHasNamed || input.cloudRevision > 0 ? 'load-cloud' : 'keep-local';
  if (input.cloudRevision > localRevision) {
    if (!localHasProgress || input.confirmOverwrite()) return 'load-cloud';
    return 'keep-local';
  }
  if (localRevision > input.cloudRevision) return localHasName ? 'upload-local' : (cloudHasNamed ? 'load-cloud' : 'keep-local');
  if (input.cloudRevision === localRevision && localRevision === 0 && cloudHasNamed && input.confirmOverwrite()) {
    return 'load-cloud';
  }
  return 'keep-local';
};
