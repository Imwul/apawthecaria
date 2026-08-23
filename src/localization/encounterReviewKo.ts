import {
  ENCOUNTER_REVIEW_FORAGING_CHOICE_KO,
  ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO
} from './encounterReviewForagingKo';
import {
  SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO,
  SOCIAL_ENCOUNTER_REVIEW_CONTEXT_KO
} from './encounterReviewSocialKo';
import {
  ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO,
  ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO
} from './encounterReviewTravelKo';

export type EncounterReviewChoiceKo = Readonly<Record<string, string>>;

/**
 * Player-facing encounter prose reviewed against the printed tables.
 *
 * Keeping the category files separate makes another rulebook pass practical;
 * the application consumes this single combined view so no subsystem silently
 * falls back to the older OCR-derived translation path.
 */
export const ENCOUNTER_REVIEW_CONTEXT_KO: Readonly<Record<string, string>> = {
  ...ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO,
  ...ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO,
  ...SOCIAL_ENCOUNTER_REVIEW_CONTEXT_KO
};

export const ENCOUNTER_REVIEW_CHOICE_KO: Readonly<Record<string, EncounterReviewChoiceKo>> = {
  ...ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO,
  ...ENCOUNTER_REVIEW_FORAGING_CHOICE_KO,
  ...SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO
};
