import { RULEBOOK_EDITION, type RulebookEdition, type RulesetId } from './types';

export type HouseRuleKey =
  | 'familiarTrustScaling'
  | 'legacySuccession'
  | 'journeyReputationSwing'
  | 'brewingTimePerIngredient'
  | 'incompleteRemedyAdministration'
  | 'directMakeDoReplacement'
  | 'companionFlightWaterPermissions'
  | 'manualSeasonChange'
  | 'freeDelveCancellation';

export interface RulesetConfig {
  id: RulesetId;
  rulebookEdition: RulebookEdition;
  label: string;
  houseRules: Record<HouseRuleKey, boolean>;
  allowRecoveryTools: boolean;
}

const originalHouseRules: Record<HouseRuleKey, boolean> = {
  familiarTrustScaling: false,
  legacySuccession: false,
  journeyReputationSwing: false,
  brewingTimePerIngredient: false,
  incompleteRemedyAdministration: false,
  directMakeDoReplacement: false,
  companionFlightWaterPermissions: false,
  manualSeasonChange: false,
  freeDelveCancellation: false
};
export const RULESETS: Record<RulesetId, RulesetConfig> = {
  'original-1e-3p': {
    id: 'original-1e-3p',
    rulebookEdition: RULEBOOK_EDITION,
    label: 'Apawthecaria 1E Third Printing',
    houseRules: { ...originalHouseRules },
    allowRecoveryTools: false
  },
  'legacy-campaign': {
    id: 'legacy-campaign',
    rulebookEdition: RULEBOOK_EDITION,
    label: 'Legacy Campaign Compatibility',
    houseRules: Object.fromEntries(
      Object.keys(originalHouseRules).map(key => [key, true])
    ) as Record<HouseRuleKey, boolean>,
    allowRecoveryTools: false
  },
  sandbox: {
    id: 'sandbox',
    rulebookEdition: RULEBOOK_EDITION,
    label: 'Sandbox and Recovery',
    houseRules: Object.fromEntries(
      Object.keys(originalHouseRules).map(key => [key, true])
    ) as Record<HouseRuleKey, boolean>,
    allowRecoveryTools: true
  }
};

export const getRulesetConfig = (rulesetId?: RulesetId | string): RulesetConfig =>
  RULESETS[(rulesetId || 'original-1e-3p') as RulesetId] || RULESETS['legacy-campaign'];

export const isHouseRuleEnabled = (
  rulesetId: RulesetId | string | undefined,
  rule: HouseRuleKey
): boolean => getRulesetConfig(rulesetId).houseRules[rule];

export const migrateRulesetMetadata = <T extends Record<string, unknown>>(saved: T | null | undefined): T & {
  rulesetId: RulesetId;
  rulebookEdition: RulebookEdition;
} => {
  const source = (saved || {}) as T;
  const rulesetId = source.rulesetId && RULESETS[source.rulesetId as RulesetId]
    ? source.rulesetId as RulesetId
    : 'legacy-campaign';
  return {
    ...source,
    rulesetId,
    rulebookEdition: RULEBOOK_EDITION
  };
};
