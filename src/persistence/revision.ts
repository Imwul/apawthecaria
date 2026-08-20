const MAX_INCREMENTABLE_REVISION = Number.MAX_SAFE_INTEGER - 1;

/** Converts legacy or malformed revision values into a safe monotonic integer. */
export const normalizeSaveRevision = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(Math.floor(parsed), MAX_INCREMENTABLE_REVISION);
};

/**
 * A mutation may replace the current state (for example, importing a backup).
 * Advance from whichever revision is newer so the replacement cannot move the
 * campaign behind an older cloud copy.
 */
export const nextCampaignSaveRevision = (previous: unknown, replacement?: unknown): number =>
  Math.max(normalizeSaveRevision(previous), normalizeSaveRevision(replacement)) + 1;
