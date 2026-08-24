export const RULEBOOK_EDITION = 'first-edition-third-printing-may-2023' as const;
export const RULEBOOK_SOURCE_ID = 'apawthecaria-first-edition-third-printing' as const;
export const RULEBOOK_TITLE = 'Apawthecaria: A Role Playing Game' as const;

export type RulebookEdition = typeof RULEBOOK_EDITION;
export type RulesetId = 'original-1e-3p' | 'legacy-campaign' | 'sandbox';

export interface RuleSourceReference {
  kind: 'rulebook';
  id: typeof RULEBOOK_SOURCE_ID;
  title: typeof RULEBOOK_TITLE;
  edition: RulebookEdition;
  page: number;
}

export interface CanonicalRuleRecord {
  rulebookEdition: RulebookEdition;
  sourcePage: number;
  source: RuleSourceReference;
}

export type CardSuit = '♥' | '♦' | '♣' | '♠';
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type Region = 'Bog' | 'Forest' | 'Loch' | 'Meadow' | 'Mountain' | 'Titan';
export type TravelRegion = Region | 'Soar';
export type Availability = 'Common' | 'Rare' | 'Unavailable';
export type RuleSupport = 'implemented' | 'structured-but-not-executed' | 'manual-only' | 'ambiguous';

export type RuleTag =
  | 'ELSEWHERE'
  | 'INSTINCT'
  | 'JOY'
  | 'MOOD'
  | 'NERVES'
  | 'INFECTION'
  | 'PAIN'
  | 'PARASITE'
  | 'SENSES'
  | 'SLEEP'
  | 'BREATH'
  | 'BURN'
  | 'FEATHER'
  | 'FUR'
  | 'HIDE'
  | 'POISON'
  | 'SCALE'
  | 'STOMACH'
  | 'TEMPERATURE'
  | 'WOUND'
  | 'FAIR'
  | 'FOUL';

export interface TagValue {
  tag: RuleTag;
  value: number;
}

export type RequirementExpression =
  | { kind: 'tag'; tag: RuleTag; threshold: number }
  | { kind: 'allOf'; requirements: RequirementExpression[] }
  | { kind: 'anyOf'; requirements: RequirementExpression[] }
  | { kind: 'alternatives'; alternatives: RequirementExpression[] }
  | { kind: 'special'; code: string; description: string };

export type RuleEffect =
  | { type: 'modifyReputation'; amount: number }
  | { type: 'modifyTrinkets'; amount: number }
  | { type: 'markDays'; amount: number }
  | { type: 'modifyForagingPoints'; amount: number }
  | { type: 'modifyTimer'; amount: number; target: 'active' | 'all' }
  | { type: 'addItem'; itemId: string; quantity: number }
  | { type: 'removeItem'; itemId: string; quantity: number }
  | { type: 'blockMovement'; reason: string }
  | { type: 'requireLocalHelp'; reason: string }
  | { type: 'requireChoice'; choiceIds: string[] }
  | { type: 'addCondition'; conditionId: string }
  | { type: 'unlockEntry'; entryId: string }
  | { type: 'customEffect'; code: string; description: string };

export interface StructuredRuleEffect {
  support: RuleSupport;
  effect: RuleEffect;
}

export type PreparationToolId =
  | 'none'
  | 'belt-knife'
  | 'mortar-and-pestle'
  | 'camp-kettle'
  | 'teeth'
  | 'paws'
  | 'copper-frying-pan'
  | 'big-iron-cauldron';

export interface ReagentPreparation extends CanonicalRuleRecord {
  id: string;
  name: string;
  method: string;
  requiredTool: PreparationToolId;
  requiredTools: PreparationToolId[];
  weight: number;
  uses: number;
  tags: TagValue[];
  specialRules: StructuredRuleEffect[];
  alternativeGroup?: string;
}

export interface ReagentDefinition extends CanonicalRuleRecord {
  id: string;
  canonicalName: string;
  displayName: string;
  description: string;
  type: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN';
  baseRarity: number;
  regionAvailability: Record<Region, Availability>;
  seasonAvailability: Record<Season, Availability>;
  preparations: ReagentPreparation[];
  specialAcquisition: StructuredRuleEffect[];
  support: RuleSupport;
}

export type AilmentSeverity = 'lesser' | 'intermediate' | 'severe' | 'dire';

export type MultiAilmentRule =
  | { kind: 'repeat'; count: number }
  | { kind: 'drawMultiple'; count: number; severity: AilmentSeverity };

export interface AilmentDefinition extends CanonicalRuleRecord {
  id: string;
  canonicalName: string;
  displayName: string;
  severity: AilmentSeverity;
  timer: number;
  requirements: RequirementExpression;
  successEffects: StructuredRuleEffect[];
  failureEffects: StructuredRuleEffect[];
  specialRules: StructuredRuleEffect[];
  allowsMultiple: boolean;
  repeatCount?: number;
  multiAilmentRule?: MultiAilmentRule;
  support: RuleSupport;
}

export type EncounterType = 'travel' | 'foraging' | 'social';

export interface EncounterChoice {
  id: string;
  label: string;
  effects: StructuredRuleEffect[];
  requiresJournal?: boolean;
  requirements?: {
    minGuildReputation?: number;
    maxGuildReputation?: number;
    minTrinkets?: number;
    requiredConditionId?: string;
  };
  followUp?: {
    type: 'start-patient';
    timing: 'immediate';
    severity: AilmentSeverity;
    rewardMode: 'none' | 'standard';
    deadline?: 'before-overstay';
    patientKind?: 'exiled-beast' | 'local-beast';
  };
}

export interface EncounterDefinition extends CanonicalRuleRecord {
  id: string;
  encounterType: EncounterType;
  region: TravelRegion;
  isSettlement: boolean;
  isTitan: boolean;
  locationType?: 'Settlement' | 'City';
  city?: string;
  season?: Season;
  suit?: CardSuit;
  cardKey?: string;
  title: string;
  prompt: string;
  tags?: Array<'Weather' | 'Beast' | 'Behemoth'>;
  mandatoryEffects: StructuredRuleEffect[];
  choices: EncounterChoice[];
  support: RuleSupport;
}

export interface TagDefinition extends CanonicalRuleRecord {
  id: RuleTag;
  category: 'remedy' | 'trade';
  stacks: boolean;
}

export interface RegionDefinition extends CanonicalRuleRecord {
  id: TravelRegion;
  reagentRegion: boolean;
  travelRegion: boolean;
  foragingRegion: boolean;
}

export interface SeasonDefinition extends CanonicalRuleRecord {
  id: Season;
  order: number;
  nextSeason: Season;
}

export type ToolCategory = 'basic' | 'market' | 'special' | 'replacement';

export interface ToolDefinition extends CanonicalRuleRecord {
  id: string;
  canonicalName: string;
  category: ToolCategory;
  weight: number;
  cost: number | null;
  purchaseLocations: string[];
  preparationMethods: string[];
  almanackEntry: boolean;
  replacesToolIds?: PreparationToolId[];
  support: RuleSupport;
}
