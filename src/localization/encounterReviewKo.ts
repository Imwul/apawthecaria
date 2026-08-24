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
import { normalizeGuildReputationTerms } from './guildReputation';

export type EncounterReviewChoiceKo = Readonly<Record<string, string>>;

/**
 * Player-facing encounter prose reviewed against the printed tables.
 *
 * Keeping the category files separate makes another rulebook pass practical;
 * the application consumes this single combined view so no subsystem silently
 * falls back to the older OCR-derived translation path.
 */
const reviewedContextSource: Readonly<Record<string, string>> = {
  ...ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO,
  ...ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO,
  ...SOCIAL_ENCOUNTER_REVIEW_CONTEXT_KO
};

export const ENCOUNTER_REVIEW_CONTEXT_KO: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(reviewedContextSource).map(([encounterId, text]) => [
    encounterId,
    normalizeGuildReputationTerms(text)
  ])
);

const reviewedChoiceSource: Readonly<Record<string, EncounterReviewChoiceKo>> = {
  ...ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO,
  ...ENCOUNTER_REVIEW_FORAGING_CHOICE_KO,
  ...SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO
};

export const ENCOUNTER_REVIEW_CHOICE_KO: Readonly<Record<string, EncounterReviewChoiceKo>> = Object.fromEntries(
  Object.entries(reviewedChoiceSource).map(([encounterId, choices]) => [
    encounterId,
    Object.fromEntries(Object.entries(choices).map(([choiceId, text]) => [
      choiceId,
      normalizeGuildReputationTerms(text)
    ]))
  ])
);
