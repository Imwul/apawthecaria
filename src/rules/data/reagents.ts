import { GAME_DATA } from '../../gameData';
import type { ReagentDefinition, StructuredRuleEffect } from '../types';
import canonicalAvailability from './reagentAvailability.json';
import { CANONICAL_PREPARATIONS } from './reagentPreparations';
import { canonicalMetadata } from '../source';

const NAME_FIXES: Record<string, string> = {
  'can only be Foraged for in Summer Frog Slime': 'Frog Slime',
  'Trinket Ironslug': 'Ironslug',
  'Can only be Foraged for in Summer Wild Garlic': 'Wild Garlic'
};

const normalizeName = (name: string): string => NAME_FIXES[name] || name;
const slugify = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const structuredRule = (code: string, description: string): StructuredRuleEffect => ({
  support: 'structured-but-not-executed',
  effect: { type: 'customEffect', code, description }
});

const SPECIAL_ACQUISITION: Record<string, StructuredRuleEffect[]> = {
  Burdock: [structuredRule('SEASONAL_PARTS', 'Stems are Spring-only, Flowers are Summer-only, and Burrs are Autumn-only.')],
  'Cherry Trees': [structuredRule('SUMMER_ONLY_CHERRIES', 'Cherries can only be Foraged in Summer.')],
  Cucumbers: [structuredRule('SPRING_ONLY_FLOWERS', 'Flowers can only be Foraged in Spring.')],
  'Forget-Me-Not': [structuredRule('SUMMER_ONLY_NECTAR', 'Nectar can only be Foraged in Summer.')],
  'Musk Scrapings': [structuredRule('ONE_BOTTLE_PER_FORAGE', 'Only one bottle of Musk Scrapings can be gathered during a Forage.')],
  Oak: [structuredRule('SEASONAL_PARTS', 'Catkins are Spring-only and Acorns are Autumn-only.')],
  Ribwort: [structuredRule('SUMMER_AUTUMN_ONLY_LEAVES', 'Leaves can only be Foraged in Summer and Autumn.')],
  'White Willow': [structuredRule('SUMMER_ONLY_CATKINS', 'Catkins can only be Foraged in Summer.')]
};

const availabilityFor = (canonicalName: string) => {
  const row = (canonicalAvailability as Record<string, {
    type: ReagentDefinition['type'];
    baseRarity: number;
    regions: ReagentDefinition['regionAvailability'];
    seasons: ReagentDefinition['seasonAvailability'];
    sourcePage: number;
  }>)[canonicalName];
  if (!row) throw new Error(`Missing canonical availability for ${canonicalName}`);
  return row;
};

const preparationsFor = (canonicalName: string) => {
  const rows = CANONICAL_PREPARATIONS[canonicalName];
  if (!rows) throw new Error(`Missing canonical preparations for ${canonicalName}`);
  return rows;
};

const missingReagents: Array<{
  canonicalName: string;
  displayName: string;
  description: string;
  type: 'PLANT';
  baseRarity: number;
}> = [
  {
    canonicalName: 'Woundwort',
    displayName: '운드워트',
    description: 'Hairy and foul smelling hedge nettles used for instinct and nerves.',
    type: 'PLANT',
    baseRarity: 7
  },
  {
    canonicalName: 'Yarrow',
    displayName: '서양톱풀',
    description: 'A wet-soil plant used for cramping, cycles, wounds and infection.',
    type: 'PLANT',
    baseRarity: 7
  },
  {
    canonicalName: 'Yellow Wort',
    displayName: '옐로 워트',
    description: 'A hardy yellow plant nicknamed mountain crest.',
    type: 'PLANT',
    baseRarity: 4
  }
];

const legacyRows = GAME_DATA.reagents.filter((row, index, rows) => {
  const canonicalName = normalizeName(row.rawName);
  return rows.findIndex(candidate => normalizeName(candidate.rawName) === canonicalName) === index;
});

const fromLegacy: ReagentDefinition[] = legacyRows.map(row => {
  const canonicalName = normalizeName(row.rawName);
  const availability = availabilityFor(canonicalName);
  return {
    id: `reagent-${slugify(canonicalName)}`,
    canonicalName,
    displayName: row.name,
    description: row.description,
    type: availability.type,
    baseRarity: availability.baseRarity,
    regionAvailability: availability.regions,
    seasonAvailability: availability.seasons,
    preparations: preparationsFor(canonicalName),
    specialAcquisition: SPECIAL_ACQUISITION[canonicalName] || [],
    ...canonicalMetadata(availability.sourcePage),
    support: 'structured-but-not-executed'
  };
});

const addedMissing: ReagentDefinition[] = missingReagents.map(row => {
  const availability = availabilityFor(row.canonicalName);
  return {
    id: `reagent-${slugify(row.canonicalName)}`,
    canonicalName: row.canonicalName,
    displayName: row.displayName,
    description: row.description,
    type: availability.type,
    baseRarity: availability.baseRarity,
    regionAvailability: availability.regions,
    seasonAvailability: availability.seasons,
    preparations: preparationsFor(row.canonicalName),
    specialAcquisition: SPECIAL_ACQUISITION[row.canonicalName] || [],
    ...canonicalMetadata(availability.sourcePage),
    support: 'structured-but-not-executed'
  };
});

export const REAGENTS: ReagentDefinition[] = [...fromLegacy, ...addedMissing]
  .sort((a, b) => a.sourcePage - b.sourcePage || a.canonicalName.localeCompare(b.canonicalName));

export const REAGENT_BY_ID = new Map(REAGENTS.map(reagent => [reagent.id, reagent]));
export const REAGENT_BY_NAME = new Map(REAGENTS.map(reagent => [reagent.canonicalName, reagent]));
