import type { PatientState } from './state';
import type { EncounterDefinition, Region, RuleTag, Season, TravelRegion } from './types';
import type { CanonicalToolState } from './toolEngine';

export type GameplayLocationType = 'Wilds' | 'Settlement' | 'City' | 'Titan Ruin' | 'Behemoth Barrow';

export interface EngineInventoryItem {
  id: string;
  name: string;
  type: 'tool' | 'reagent' | 'trinket' | 'item';
  weight: number;
  quantity?: number;
  canonicalToolId?: string;
  canonicalReagentId?: string;
  preparationId?: string;
  usesRemaining?: number;
  ruinedWhenSoaked?: boolean;
  granitePounded?: boolean;
  craftedItemId?: 'knitted-blanket' | 'knitted-coat' | 'knitted-satchel' | 'knitted-scarf';
  customReagent?: {
    baseRarity: number;
    targetTag: RuleTag;
    preparation: string;
  };
  guildNote?: {
    kind: 'ledger' | 'map' | 'gossip';
    region?: Region;
  };
  provenance?: {
    acquisitionId: string;
    source: 'forage' | 'barter';
    sourceTransactionId: string;
    /** Region where this exact Part was gathered. Needed by PURIFY (p.180). */
    region?: TravelRegion;
  };
}

export interface EngineJournalEvent {
  id: string;
  type: 'travel' | 'encounter' | 'foraging' | 'diagnosis' | 'treatment' | 'failure' | 'season' | 'downtime';
  title: string;
  text: string;
}

export interface PendingEncounterState {
  transactionId: string;
  encounterId: string;
  encounter: EncounterDefinition;
  phase: 'pending' | 'manual' | 'resolved';
  selectedChoiceId?: string;
  /** Optional player-written memory kept with an interrupted encounter. */
  journalNote?: string;
  /** The player completed a required prompt outside the text field (spoken/drawn). */
  journalAcknowledged?: boolean;
  unresolvedEffectCodes: string[];
  card: { value: number; suit?: string };
  secondaryCard?: { value: number; suit: string };
  ignoreNegativeEncounterEffects?: boolean;
  encounterProtection?: 'negative' | 'all';
}

export interface PendingForagingState {
  transactionId: string;
  region: Exclude<TravelRegion, 'Soar'>;
  locationRelation: 'current' | 'adjacent';
  card: { value: number; suit?: string };
  secondaryCard?: { value: number; suit: string };
  /** Reagent researched and listed before the Foraging card was drawn (pp.30–32). */
  targetReagentId?: string;
  selectedReagentId?: string;
  timerCostAfterEncounter: number;
  encounterId: string | null;
  selectedChoiceId?: string;
  /** Optional player-written memory kept with an interrupted forage encounter. */
  journalNote?: string;
  /** The player completed a required prompt outside the text field (spoken/drawn). */
  journalAcknowledged?: boolean;
  phase: 'choose-reagent' | 'encounter' | 'timer' | 'resolved';
  reagentTypeFilter?: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN';
  source?: 'standard' | 'companion-wasp' | 'familiar-independent' | 'barrow-delve';
  ignoreNegativeEncounterEffects?: boolean;
}

export interface TravelGraphEdge {
  to: string;
  kind?: 'path' | 'river' | 'waterway';
}

export interface TravelGraphNode {
  id: string;
  name: string;
  x?: number;
  y?: number;
  region: TravelRegion;
  locationType: GameplayLocationType;
  edges: TravelGraphEdge[];
}

export interface EncounterRuntimeState {
  reputation: number;
  trinkets: number;
  calendarDays: number;
  foragingPoints: number;
  inventory: EngineInventoryItem[];
  patient: PatientState | null;
  movementBlocked: boolean;
  conditions: string[];
  appliedEffectIds: string[];
}

export interface TreatmentTransactionState {
  inventory: EngineInventoryItem[];
  tools?: CanonicalToolState[];
  ailmentTagOverrides?: Array<{
    ailmentId: string;
    originalTag: RuleTag;
    replacementTag: RuleTag;
  }>;
  patient: PatientState;
  reputation: number;
  trinkets: number;
  journalEvents: EngineJournalEvent[];
  appliedTransactionIds: string[];
}

export interface SeasonClinicState {
  id: string;
  locationId: string;
  status: 'building' | 'active';
  completesAtSeason?: Season;
  gardenReagentId?: string;
}

export interface SeasonCompanionState {
  id: string;
  kind: string;
  seasonsTravelled: number;
}

export interface SeasonRuntimeState {
  season: Season;
  completedSeasons: number;
  reputation: number;
  trinkets: number;
  clinics: SeasonClinicState[];
  agendaServices: string[];
  goodwillDonatedWeight: number;
  companions: SeasonCompanionState[];
  downtimeCompleted: boolean;
  journalEvents: EngineJournalEvent[];
  appliedTransactionIds: string[];
}

export type ProvidedTags = Partial<Record<RuleTag, number>>;
