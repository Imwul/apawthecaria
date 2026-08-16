import { GAME_DATA } from '../../gameData';
import { getTableLookupKey, type RuleCard } from '../cards';
import { canonicalMetadata } from '../source';
import { applyPrintedEncounterOverride } from './printedEncounterOverrides';
import { enrichEncounterChoices } from './encounterChoices';
import type {
  CardSuit,
  EncounterDefinition,
  EncounterType,
  Region,
  Season,
  TravelRegion
} from '../types';

const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
const TRAVEL_SEASONAL_KEYS = ['9&10', 'J', 'M'];
const FORAGING_SEASONAL_KEYS = ['9', '10', 'J', 'M'];

type LegacyEncounter = { page: number; card?: string; suit?: string; title: string; text: string };

const inferEncounterTags = (title: string, prompt: string): EncounterDefinition['tags'] => {
  const text = `${title} ${prompt}`;
  const tags: NonNullable<EncounterDefinition['tags']> = [];
  if (/weather|climate|storm|thunder|lightning|rain|downpour|sleet|hail|blizzard|frost|heatwave|drought|fogbank/i.test(text)) tags.push('Weather');
  if (/behemoth/i.test(text)) tags.push('Behemoth');
  else if (/aggressive beast|armed beast|violent beast|beast[^.]{0,30}(attack|ambush|chase|threat)|bandit|robber/i.test(text)) tags.push('Beast');
  return tags;
};

const travelLegacy = Object.values(GAME_DATA.travelEncounters).flat() as LegacyEncounter[];
const foragingLegacy = Object.values(GAME_DATA.foragingEncounters).flat() as LegacyEncounter[];
const socialLegacy = Object.values(GAME_DATA.socialEncounters).flat() as LegacyEncounter[];

const normalizeTravelKey = (key?: string): string => {
  const normalized = String(key || '').toLowerCase().replace(/\s+/g, '');
  if (normalized === 'ace&2' || normalized === 'a&2') return 'A&2';
  if (normalized === '3&4') return '3&4';
  if (normalized === '5&6') return '5&6';
  if (normalized === '7&8') return '7&8';
  if (normalized === '9&10') return '9&10';
  if (normalized === 'j') return 'J';
  if (normalized === 'm') return 'M';
  return key || '';
};

const normalizeForagingKey = (key?: string): string => {
  const normalized = String(key || '').toUpperCase();
  if (normalized === 'ACE') return 'A';
  return normalized;
};

const sourceOnly = (
  encounterType: EncounterType,
  region: TravelRegion,
  cardKey: string,
  sourcePage: number,
  season?: Season,
  title?: string,
  prompt?: string
): EncounterDefinition => ({
  id: `${encounterType}-${region.toLowerCase()}-${cardKey.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${season ? `-${season.toLowerCase()}` : ''}`,
  encounterType,
  region,
  isSettlement: false,
  isTitan: region === 'Titan',
  season,
  cardKey,
  title: title || `Rulebook p${sourcePage} ${cardKey}`,
  prompt: prompt || `The source row is indexed at rulebook page ${sourcePage}. Its effect remains manual until the row transcription is independently verified.`,
  tags: inferEncounterTags(title || '', prompt || ''),
  mandatoryEffects: prompt
    ? []
    : [{ support: 'manual-only', effect: { type: 'customEffect', code: 'SOURCE_ROW_PENDING', description: `Resolve the printed encounter on page ${sourcePage}.` } }],
  choices: [],
  ...canonicalMetadata(sourcePage),
  support: prompt ? 'manual-only' : 'structured-but-not-executed'
});

const fromLegacy = (
  encounterType: EncounterType,
  region: TravelRegion,
  cardKey: string,
  row: LegacyEncounter,
  season?: Season
): EncounterDefinition => ({
  id: `${encounterType}-${region.toLowerCase()}-${cardKey.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${season ? `-${season.toLowerCase()}` : ''}`,
  encounterType,
  region,
  isSettlement: false,
  isTitan: region === 'Titan',
  season,
  cardKey,
  title: row.title.trim(),
  prompt: row.text.trim(),
  tags: inferEncounterTags(row.title, row.text),
  mandatoryEffects: [{
    support: 'manual-only',
    effect: { type: 'customEffect', code: 'ENCOUNTER_PRINTED_TEXT', description: 'Resolve mandatory instructions in the printed prompt.' }
  }],
  choices: [],
  ...canonicalMetadata(row.page),
  support: 'manual-only'
});

const pageRows = (rows: LegacyEncounter[], firstPage: number, lastPage: number): LegacyEncounter[] => rows
  .map((row, index) => ({ ...row, __index: index }))
  .filter(row => row.page >= firstPage && row.page <= lastPage)
  .sort((a, b) => a.page - b.page || a.__index - b.__index);

const buildTravelRegion = (region: TravelRegion, firstPage: number, lastPage: number): EncounterDefinition[] => {
  const rows = pageRows(travelLegacy, firstPage, lastPage);
  const fixedKeys = ['A&2', '3&4', '5&6', '7&8'];
  const fixed = fixedKeys.map(key => {
    const row = rows.find(candidate => normalizeTravelKey(candidate.card) === key);
    return row
      ? fromLegacy('travel', region, key, row)
      : sourceOnly('travel', region, key, firstPage);
  });
  const seasonal = TRAVEL_SEASONAL_KEYS.flatMap(key => {
    const candidates = rows.filter(candidate => normalizeTravelKey(candidate.card) === key);
    return SEASONS.map((season, index) => {
      const row = candidates[index];
      const fallbackPage = Math.min(lastPage, firstPage + (index === 0 ? 1 : index < 3 ? 2 : 3));
      return row
        ? fromLegacy('travel', region, key, row, season)
        : sourceOnly('travel', region, key, fallbackPage, season);
    });
  });
  return [...fixed, ...seasonal];
};

const buildTitanTravel = (): EncounterDefinition[] => {
  const rows = pageRows(travelLegacy, 98, 99);
  return ['A&2', '3&4', '5&6', '7&8', '9&10', 'J', 'M'].map(key => {
    const row = rows.find(candidate => normalizeTravelKey(candidate.card) === key);
    return row ? fromLegacy('travel', 'Titan', key, row) : sourceOnly('travel', 'Titan', key, key === 'A&2' || key === '3&4' || key === '5&6' ? 98 : 99);
  });
};

export const TRAVEL_ENCOUNTERS: EncounterDefinition[] = [
  ...buildTravelRegion('Bog', 74, 77),
  ...buildTravelRegion('Forest', 78, 81),
  ...buildTravelRegion('Loch', 82, 85),
  ...buildTravelRegion('Meadow', 86, 89),
  ...buildTravelRegion('Mountain', 90, 93),
  ...buildTravelRegion('Soar', 94, 97),
  ...buildTitanTravel()
].map(applyPrintedEncounterOverride).map(enrichEncounterChoices);

const FORAGING_ACE_ROWS: Record<Exclude<Region, 'Titan'>, { page: number; title: string; prompt: string }> = {
  Bog: {
    page: 154,
    title: 'Mind Yerself!',
    prompt: 'A grouchy meadow hare comes bounding over to you, yelling "watch yer paws"! They explain that the peat bog is a delicate ecosystem. Though... you aren\'t walking on any peat right now. Despite this, they draw in deep breath as if to give a lecture. Listen & Learn - Unfortunately, once the hare gets started they cannot be stopped. Decrease Timers by 4. However, from now on everytime you Forage in a Bog, gain 1 Foraging Point. Interrupt - Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.'
  },
  Forest: { page: 160, title: 'New Route', prompt: 'Wayfinders have made a new route. Draw a Path from this Location to an unconnected nearby Location. New Path - Record a Path from this Location to an unconnected nearby Location.' },
  Loch: { page: 166, title: 'Horrors From The Deep', prompt: 'Something slithers beneath the water. Draw and resolve the suit result. Deep Water - Draw a card and apply the printed suit result on p166.' },
  Meadow: { page: 172, title: 'Soft Song', prompt: 'Music carries across the meadow as another beast sings. Listen - Journal about the melody and the singer.' },
  Mountain: { page: 178, title: 'A Sign To Nowhere', prompt: 'A Titan plaque stands off the path. Read It - Journal about why it is here and what it says.' }
};

const buildForagingRegion = (region: Exclude<Region, 'Titan'>, firstPage: number, lastPage: number): EncounterDefinition[] => {
  const rows = pageRows(foragingLegacy, firstPage, lastPage);
  const used = new Set<LegacyEncounter>();
  const fixed = ['A', '2', '3', '4', '5', '6', '7', '8'].map(key => {
    const row = rows.find(candidate => !used.has(candidate) && normalizeForagingKey(candidate.card) === key);
    if (row) {
      used.add(row);
      return fromLegacy('foraging', region, key, row);
    }
    const ace = FORAGING_ACE_ROWS[region];
    return key === 'A'
      ? sourceOnly('foraging', region, key, ace.page, undefined, ace.title, ace.prompt)
      : sourceOnly('foraging', region, key, firstPage);
  });

  const seasonal = FORAGING_SEASONAL_KEYS.flatMap(key => {
    const exact = rows.filter(candidate => !used.has(candidate) && normalizeForagingKey(candidate.card) === key);
    return SEASONS.map((season, index) => {
      const row = exact[index];
      if (row) {
        used.add(row);
        return fromLegacy('foraging', region, key, row, season);
      }
      return sourceOnly('foraging', region, key, Math.min(lastPage, firstPage + 2 + index), season);
    });
  });
  return [...fixed, ...seasonal];
};

const TITAN_FORAGING_SOURCE: Record<string, { page: number; title: string; prompt: string }> = {
  A: {
    page: 184,
    title: 'A Message',
    prompt: 'Adventurous beasts have left markings on the wall warning others of the dangers within. You may ignore the negative effects of an event in this Location. Graffiti - If you\'ve already had a negative effect from an event in this Location, you can make warning marks of your own. Gain 1 Reputation. Heed The Warning - Ignore the negative effects of an event in this Location.'
  },
  '2': {
    page: 184,
    title: 'Password',
    prompt: 'Part of this ruin is protected by a mysterious lock made of metal buttons with embossed Titan glyphs. Look Around - As you Forage, if you draw a J or M you may, instead of a Reagent, find something with the Titan Symbols written on it. If you do, you may Open The Door. Open The Door - You press the symbols and the lock opens, revealing what lies beyond. Gain a Titan Codex (Weight 1) you can trade the Knowers for 20 Trinkets at the end of this Journey, or Establish a Clinic at this Location and add a new Service to the Agenda.'
  },
  '3': {
    page: 184,
    title: 'Gas Leak',
    prompt: 'A horrible stinging haze hangs in the air. Rush - Draw a Card at the end of each Encounter in this Location, including this event, until you next Move On. If you draw a ♠, the stinging haze poisons you. Poisoned - Make a remedy that solves [Poison 2], or lose all Foraging Points. You cannot Forage at this Location again until you next Move On.'
  },
  '4': {
    page: 185,
    title: 'Final Resting Place',
    prompt: 'A collapsed wall reveals a chamber of long-dried dust and Behemoth bones. Wailing Curse - If you choose to enter this new chamber, draw a card. Hearts or diamonds let you explore; clubs or spades force you to flee unless you have a Titan Thingamabob. If you make it into the chamber, gain either a Cranky Contraption Companion, a Titan Thingamabob, or a Titan Reagent of value 8 or lower.'
  },
  '5': {
    page: 185,
    title: 'Malevolence Grafted To Metal',
    prompt: 'A Not-Cat watches you from elsewhere in the ruin. Flee - Draw two Cards, one for you and one for the not-cat. Higher escapes; lower goes to Confrontation. Confrontation - Draw another card and add its value to your original. If still lower, you are Trapped: draw a card and decrease all Timers by its value.'
  },
  '6': {
    page: 186,
    title: 'Lock And Key',
    prompt: 'You come across an intentional hollow. Power! - If you have a Titan Thingamabob, you may put it in the hole and gain one of the following effects: Light - Gain 3 Foraging Points after completing an Encounter in this location, until you next Move On. Cameras - You can redraw an Encounter card once until you next Move On. Action - Reveal a Titan Reagent of your choice.'
  },
  '7': {
    page: 186,
    title: 'What Remains',
    prompt: 'You find the remains of a beast. Investigate - Draw a Card. If it is higher than 6, you find something among their things that tells you where they are from. If you take news of their demise to their home, gain 4 Reputation. Borrow - Gain a Tool for free. Memento - If you borrowed a Tool and take news of this beast\'s demise to their home, you can return it for an additional 6 Reputation.'
  },
  '8': {
    page: 186,
    title: 'Snap, Crackle, Pop!',
    prompt: 'Something in this ruin makes a terrible and dangerous noise. Searching - Choose to be Careful or Quick. Careful - Decrease Timers by an additional 1 after each Encounter. Quick - Draw a card after each Encounter: clubs or spades force you to leave this Location and end the Forage.'
  },
  '9': {
    page: 186,
    title: 'False Idols',
    prompt: 'You come across what appears to be some sort of shrine to the Titans. Shortcut - Pawprints in the dust show you a safer route through this portion of the ruin. Gain 2 Foraging Points.'
  },
  '10': {
    page: 187,
    title: 'The Meek Shall Inherit',
    prompt: 'While beasts may shun the Titan ruins, insects of all kinds can be found thriving in the forgotten shadows and lost places. Stunned - Some near dead insects can be found laying around a pillar. Gain a Beetle, Honey Bee, Butterfly, or Wasp Reagent Part. Burrowed - Some insects can be dug out from inside ancient wood structures. Gain a Maggot, Slug, or Spider Reagent Part.'
  },
  J: {
    page: 187,
    title: 'Trapped',
    prompt: 'You hear the faint call of a beast from within a strange Titan construct. Open Says Me! - If you have a Titan Thingamabob, you may use it to activate the device and release the beast. Rescue - Draw a card: hearts or diamonds get the beast out, decrease the Timer by 1 and gain 2 Reputation; clubs or spades are a complication. Helping Hand - If you have come across Bakar in this ruin, you can get him to break the Titan construct open.'
  },
  M: {
    page: 187,
    title: 'The Researcher',
    prompt: 'You meet Bakar the Gorilla reading Titan words. Chat - Bakar tells you what he knows about the Titans. Reunion - Whenever you repeat this event in a new Titan Location, Bakar will have pieced together more of the mystery. Discovery - Once you have been to every Titan Location and get this event again, Bakar announces his departure.'
  }
};

const buildTitanForaging = (): EncounterDefinition[] => {
  const rows = pageRows(foragingLegacy, 184, 187);
  const base = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'M'].map(key => {
    const row = rows.find(candidate => normalizeForagingKey(candidate.card) === key);
    const source = TITAN_FORAGING_SOURCE[key];
    if (row) return fromLegacy('foraging', 'Titan', key, row);
    return source
      ? sourceOnly('foraging', 'Titan', key, source.page, undefined, source.title, source.prompt)
      : sourceOnly('foraging', 'Titan', key, key === '9' ? 186 : 184);
  });
  const fixed = base.filter(encounter => !FORAGING_SEASONAL_KEYS.includes(encounter.cardKey || ''));
  const seasonal = FORAGING_SEASONAL_KEYS.flatMap(key => {
    const source = base.find(encounter => encounter.cardKey === key)!;
    return SEASONS.map(season => ({
      ...source,
      id: `foraging-titan-${key.toLowerCase()}-${season.toLowerCase()}`,
      season
    }));
  });
  return [...fixed, ...seasonal];
};

export const FORAGING_ENCOUNTERS: EncounterDefinition[] = [
  ...buildForagingRegion('Bog', 154, 159),
  ...buildForagingRegion('Forest', 160, 165),
  ...buildForagingRegion('Loch', 166, 171),
  ...buildForagingRegion('Meadow', 172, 177),
  ...buildForagingRegion('Mountain', 178, 183),
  ...buildTitanForaging()
].map(applyPrintedEncounterOverride).map(enrichEncounterChoices);

const socialGroup = (region: Region, firstPage: number, lastPage: number, genericPage: number, cities: Record<number, string>): EncounterDefinition[] => {
  const rows = pageRows(socialLegacy, firstPage, lastPage);
  const seasonalCounter: Record<CardSuit, number> = { '♥': 0, '♦': 0, '♣': 0, '♠': 0 };
  return rows.map(row => {
    const suit = row.suit as CardSuit;
    const city = cities[row.page];
    const isSeasonal = suit === '♣' || suit === '♠';
    const season = isSeasonal ? SEASONS[seasonalCounter[suit]++] : undefined;
    const locationType: 'Settlement' | 'City' = city ? 'City' : 'Settlement';
    const idContext = city ? city.toLowerCase() : season ? season.toLowerCase() : 'settlement';
    return {
      id: `social-${region.toLowerCase()}-${idContext}-${suit}`,
      encounterType: 'social' as const,
      region,
      isSettlement: locationType === 'Settlement',
      isTitan: false,
      locationType,
      city,
      season,
      suit,
      title: row.title.trim(),
      prompt: row.text.trim(),
      mandatoryEffects: [{ support: 'manual-only' as const, effect: { type: 'customEffect' as const, code: 'SOCIAL_PRINTED_TEXT', description: 'Resolve the printed social prompt.' } }],
      choices: [],
      ...canonicalMetadata(row.page),
      support: 'manual-only' as const
    };
  }).filter(row => row.sourcePage === genericPage || row.city || row.season);
};

export const SOCIAL_ENCOUNTERS: EncounterDefinition[] = [
  ...socialGroup('Bog', 190, 193, 190, { 191: 'Noonhill' }),
  ...socialGroup('Forest', 194, 197, 194, { 195: 'Odoak' }),
  ...socialGroup('Loch', 198, 203, 198, { 199: 'Newdam', 201: 'Vessel' }),
  ...socialGroup('Meadow', 204, 207, 204, { 205: 'Summit' }),
  ...socialGroup('Mountain', 208, 211, 208, { 209: 'Spoolkeep' }),
  ...pageRows(socialLegacy, 213, 213).map(row => ({
    id: `social-glasswall-${row.suit}`,
    encounterType: 'social' as const,
    region: 'Loch' as const,
    isSettlement: false,
    isTitan: false,
    locationType: 'City' as const,
    city: 'Glasswall',
    suit: row.suit as CardSuit,
    title: row.title.trim(),
    prompt: row.text.trim(),
    mandatoryEffects: [{ support: 'manual-only' as const, effect: { type: 'customEffect' as const, code: 'SOCIAL_PRINTED_TEXT', description: 'Resolve the printed Glasswall prompt.' } }],
    choices: [],
    ...canonicalMetadata(213),
    support: 'manual-only' as const
  }))
].map(enrichEncounterChoices);

export const ENCOUNTERS: EncounterDefinition[] = [
  ...TRAVEL_ENCOUNTERS,
  ...FORAGING_ENCOUNTERS,
  ...SOCIAL_ENCOUNTERS
];

export interface EncounterQuery {
  encounterType: EncounterType;
  region: TravelRegion;
  card?: RuleCard;
  season?: Season;
  locationType?: 'Settlement' | 'City';
  city?: string;
}

export const findEncounter = (query: EncounterQuery): EncounterDefinition | null => {
  if (query.encounterType === 'social') {
    if (!query.card || typeof query.card === 'number' || !query.card.suit) return null;
    const suit = query.card.suit as CardSuit;
    const cityMatch = query.city
      ? SOCIAL_ENCOUNTERS.find(entry => entry.city?.toLowerCase() === query.city!.toLowerCase() && entry.suit === suit)
      : null;
    if (cityMatch) return cityMatch;
    return SOCIAL_ENCOUNTERS.find(entry =>
      entry.region === query.region
      && entry.locationType === 'Settlement'
      && entry.suit === suit
      && (!entry.season || entry.season === query.season)
    ) || null;
  }

  if (!query.card) return null;
  const tableId = query.encounterType === 'travel' ? 'travel' : 'foraging';
  const cardKey = getTableLookupKey(query.card, tableId);
  const table = ENCOUNTERS.filter(entry => entry.encounterType === query.encounterType);
  return table.find(entry =>
    entry.region === query.region
    && entry.cardKey === cardKey
    && (!entry.season || entry.season === query.season)
  ) || null;
};
