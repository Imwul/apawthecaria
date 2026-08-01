import {
  RULEBOOK_EDITION,
  RULEBOOK_SOURCE_ID,
  RULEBOOK_TITLE,
  type CanonicalRuleRecord,
  type RuleSourceReference
} from './types';

export const rulebookSource = (page: number): RuleSourceReference => ({
  kind: 'rulebook',
  id: RULEBOOK_SOURCE_ID,
  title: RULEBOOK_TITLE,
  edition: RULEBOOK_EDITION,
  page
});

export const canonicalMetadata = (sourcePage: number): CanonicalRuleRecord => ({
  rulebookEdition: RULEBOOK_EDITION,
  sourcePage,
  source: rulebookSource(sourcePage)
});
