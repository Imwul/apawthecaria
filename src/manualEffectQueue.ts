import type { ManualEffectDraft } from './rules';

/**
 * Fresh manual work may open as part of its originating flow. A draft the
 * player explicitly deferred stays queued until they choose to resume it.
 */
export const selectAutoOpenManualDraft = (
  queue: readonly ManualEffectDraft[]
): ManualEffectDraft | null => queue.find(draft =>
  draft.status === 'manual' && !draft.transactionId
) || null;
