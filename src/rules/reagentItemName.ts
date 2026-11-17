import type { ReagentDefinition, ReagentPreparation } from './types';

/**
 * The one stored name for a printed reagent part, whichever way it was acquired:
 * "Chillies (Membranes, DISTILLED)". Foraging always used this; barter, leave, clinic and
 * mobility rewards used "고추/매운고추 (Membranes)", which hid the method and kept the
 * same part from stacking or matching in search.
 */
export const canonicalReagentItemName = (
  reagent: Pick<ReagentDefinition, 'canonicalName'>,
  preparation: Pick<ReagentPreparation, 'name' | 'method'>
): string => `${reagent.canonicalName} (${preparation.name}, ${preparation.method})`;

/** Names written by the old acquisition paths: "displayName (Part)". */
export const isLegacyAcquiredReagentName = (
  name: string,
  reagent: Pick<ReagentDefinition, 'displayName'>,
  preparation: Pick<ReagentPreparation, 'name'>
): boolean => name === `${reagent.displayName} (${preparation.name})`;
