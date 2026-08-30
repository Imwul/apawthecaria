import type { ManualEffectDraft } from './rules';
import { isPrintedResolutionInputSatisfied } from './rules/printedEffects';

/**
 * Encounter choices are already presented and recorded in their Encounter
 * workspace.  A second, blocking "manual judgement" sheet is only useful when
 * something still has to be supplied or applied there.  In particular, a
 * prefilled `printed-choice` plus optional prose is a record of work that has
 * already happened, not unfinished gameplay.
 *
 * Non-Encounter drafts stay actionable because service/delivery/legacy
 * follow-ups have their own completion semantics.
 */
export const manualEffectDraftNeedsPlayerResolution = (
  draft: ManualEffectDraft
): boolean => {
  if (draft.ownerType !== 'encounter') return true;
  if (draft.actionTemplates.length > 0 || draft.followUpRequirements.length > 0) return true;

  return draft.inputFields.some(field => {
    if (field.type === 'free-text') return false;
    if (field.id === 'printed-choice') {
      return field.required
        && !isPrintedResolutionInputSatisfied(field, draft.inputValues[field.id]);
    }
    // A typed card/result/condition/target field represents a real unresolved
    // step even when the printed text marks it optional.
    return true;
  });
};

export const actionableManualEffectDrafts = (
  queue: readonly ManualEffectDraft[]
): ManualEffectDraft[] => queue.filter(manualEffectDraftNeedsPlayerResolution);

/**
 * Fresh manual work may open as part of its originating flow. A draft the
 * player explicitly deferred stays queued until they choose to resume it.
 */
export const selectAutoOpenManualDraft = (
  queue: readonly ManualEffectDraft[]
): ManualEffectDraft | null => queue.find(draft =>
  draft.status === 'manual'
  && !draft.transactionId
  && manualEffectDraftNeedsPlayerResolution(draft)
) || null;
