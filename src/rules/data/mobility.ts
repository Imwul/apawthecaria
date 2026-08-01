import { canonicalMetadata } from '../source';
import type { CanonicalRuleRecord, Region, Season } from '../types';

export interface WagonExpansionDefinition extends CanonicalRuleRecord {
  id: string;
  canonicalName: string;
  cost: number;
  location: string;
  effect: string;
  sourcePage: number;
  ruleIds: string[];
}

const wagon = (page: number, row: Omit<WagonExpansionDefinition, keyof CanonicalRuleRecord | 'ruleIds'>): WagonExpansionDefinition => ({ ...row, ...canonicalMetadata(page), ruleIds: ['WAGON-001', 'WAGON-002', 'WAGON-003'] });

export const WAGON_EXPANSIONS: readonly WagonExpansionDefinition[] = [
  wagon(68, { id: 'base-unit', canonicalName: 'Base Unit', cost: 15, location: 'Any City', effect: 'Carry +4 and Speed +1.' }),
  wagon(68, { id: 'side-brackets', canonicalName: 'Side Brackets', cost: 7, location: 'Any City', effect: 'Wagon Carry bonus becomes +6.' }),
  wagon(68, { id: 'axel-springs', canonicalName: 'Axel Springs', cost: 7, location: 'Any City', effect: 'Wagon Speed bonus becomes +2.' }),
  wagon(68, { id: 'hive-brackets', canonicalName: 'Hive Brackets', cost: 7, location: 'Odoak', effect: 'Bring up to two Companions.' }),
  wagon(68, { id: 'sealed-carriage', canonicalName: 'Sealed Carriage and Sails', cost: 10, location: 'Newdam', effect: 'Stop in Loch and cross Waterways at normal Speed without losing Reagents.' }),
  wagon(68, { id: 'pedal-motor', canonicalName: 'Pedal Motor', cost: 6, location: 'Vessel', effect: 'Two connected Waterways count as one Waterway.' }),
  wagon(69, { id: 'experimental-contraption', canonicalName: 'Experimental Contraption', cost: 20, location: 'Glasswall', effect: 'Wagon may Soar; a Soar Move marks 3 Days instead of 1.' }),
  wagon(69, { id: 'passenger-booth', canonicalName: 'Passenger Booth', cost: 20, location: 'Summit', effect: 'Carry one Passenger after trading a Remedy.' }),
  wagon(69, { id: 'clay-pots', canonicalName: 'Clay Pots', cost: 5, location: 'Noonhill', effect: 'Grow one in-season Plant Reagent and gather after two Moves.' }),
  wagon(69, { id: 'shadow-canvas', canonicalName: 'Shadow Canvas', cost: 5, location: 'Spoolkeep', effect: 'Gain 1 Reputation when arriving in a Settlement.' })
];

export interface CompanionDefinition extends CanonicalRuleRecord {
  id: string;
  canonicalName: string;
  cost: number;
  regions: Region[];
  effect: string;
  sourcePage: number;
  ruleIds: string[];
}

const companion = (page: number, row: Omit<CompanionDefinition, keyof CanonicalRuleRecord | 'ruleIds'>): CompanionDefinition => ({ ...row, ...canonicalMetadata(page), ruleIds: ['COMPANION-001', 'COMPANION-002', 'COMPANION-004'] });

export const COMPANIONS: readonly CompanionDefinition[] = [
  companion(70, { id: 'beetle', canonicalName: 'Beetle', cost: 5, regions: ['Meadow', 'Mountain'], effect: 'Once per Journey ignore an Encounter involving aggressive Beasts.' }),
  companion(70, { id: 'butterfly', canonicalName: 'Butterfly', cost: 12, regions: ['Bog', 'Meadow'], effect: 'In Spring or Summer reduce Plant Reagent Rarity by 1.' }),
  companion(70, { id: 'caterpillar', canonicalName: 'Caterpillar', cost: 3, regions: ['Bog', 'Forest'], effect: 'Add 1 to Lesser and Intermediate Timers; becomes a Butterfly after one Season.' }),
  companion(70, { id: 'cranky-contraption', canonicalName: 'Cranky Contraption', cost: 3, regions: ['Titan'], effect: 'Sacrifice it to escape a Behemoth Encounter and avoid negative outcomes.' }),
  companion(70, { id: 'cricket', canonicalName: 'Cricket', cost: 6, regions: ['Bog', 'Forest'], effect: 'With an Instrument, counts as an extra Instrument and paws to play it.' }),
  companion(70, { id: 'honeybee', canonicalName: 'Honeybee', cost: 8, regions: ['Forest', 'Meadow'], effect: 'After 10 Paths, generate a Hive (Honey) Reagent.' }),
  companion(71, { id: 'pond-skimmer', canonicalName: 'Pond Skimmer', cost: 6, regions: ['Loch'], effect: 'Once per Journey redraw a Loch Travel Encounter.' }),
  companion(71, { id: 'spider', canonicalName: 'Spider', cost: 7, regions: ['Bog', 'Mountain'], effect: 'Reduce Insect Reagent Rarity by 1 while Foraging.' }),
  companion(71, { id: 'wasp', canonicalName: 'Wasp', cost: 8, regions: ['Forest', 'Mountain'], effect: 'After 10 Paths, draw once as Foraging for an Insect Part.' })
];

export interface CompanionState {
  instanceId: string;
  companionId: string;
  pathsTravelled: number;
  seasonsTravelled: number;
  usedThisJourney: boolean;
  pendingForage: 'insect' | null;
  pendingForageDraws?: number;
}

export interface WagonState {
  commissioned: boolean;
  expansionIds: string[];
  clayPotReagentId: string | null;
  clayPotMoves: number;
}

export const companionRarityModifier = (companions: CompanionState[], type: 'plant' | 'insect', season: Season) => {
  if (type === 'plant' && ['Spring', 'Summer'].includes(season) && companions.some(row => row.companionId === 'butterfly')) return -1;
  if (type === 'insect' && companions.some(row => row.companionId === 'spider')) return -1;
  return 0;
};

export const WAGON_EXPANSION_BY_ID = new Map(WAGON_EXPANSIONS.map(row => [row.id, row]));
export const COMPANION_BY_ID = new Map(COMPANIONS.map(row => [row.id, row]));
