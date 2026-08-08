import type { PatientState } from './state';
import type { EncounterDefinition, RuleTag, Season, TravelRegion } from './types';

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
  customReagent?: {
    baseRarity: number;
    targetTag: RuleTag;
    preparation: string;
  };
  provenance?: {
    acquisitionId: string;
    source: 'forage' | 'barter';
    sourceTransactionId: string;
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
  unresolvedEffectCodes: string[];
  card: { value: number; suit?: string };
}

export interface PendingForagingState {
  transactionId: string;
  region: Exclude<TravelRegion, 'Soar'>;
  locationRelation: 'current' | 'adjacent';
  card: { value: number; suit?: string };
  selectedReagentId?: string;
  timerCostAfterEncounter: number;
  encounterId: string | null;
  phase: 'choose-reagent' | 'encounter' | 'timer' | 'resolved';
  reagentTypeFilter?: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN';
  source?: 'standard' | 'companion-wasp';
}

export interface TravelGraphEdge {
  to: string;
  kind?: 'path' | 'waterway';
}

export interface TravelGraphNode {
  id: string;
  name: string;
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
