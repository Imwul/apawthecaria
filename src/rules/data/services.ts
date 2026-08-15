import { canonicalMetadata } from '../source';
import type { CanonicalRuleRecord, Region } from '../types';

export type GuildServiceId =
  | 'send-package'
  | 'rug-of-wonders'
  | 'news-from-the-trail'
  | 'smithing'
  | 'forecast'
  | 'catch-of-the-day'
  | 'shortcut'
  | 'hitch-a-ride'
  | 'survey-paths'
  | 'build-a-bridge'
  | 'floodplain'
  | 'taxi-service'
  | 'take-clippings'
  | 'pick-of-the-deep'
  | 'retrieval'
  | 'send-a-missive'
  | 'scare-tactics';

export type ServiceLocationRequirement =
  | { kind: 'any-settlement-or-city' }
  | { kind: 'any-city' }
  | { kind: 'region-settlement'; region: Region }
  | { kind: 'region-settlement-or-any-city'; region: Region }
  | { kind: 'named'; location: string };

export interface GuildServiceDefinition extends CanonicalRuleRecord {
  id: GuildServiceId;
  name: string;
  provider: string;
  cost: number | [number, number];
  locationRequirement: ServiceLocationRequirement;
  target: 'inventory' | 'journey' | 'move' | 'map-node' | 'map-edge' | 'reagent' | 'upgrade' | 'settlement' | 'external-player';
  duration: 'instant' | 'once-per-journey' | 'three-moves' | 'until-destination' | 'until-next-spring' | 'pending-delivery';
  mapEffect: 'none' | 'temporary-region' | 'add-path' | 'convert-waterways' | 'remove-threat';
  followUp: string;
  sourcePage: number;
  ruleIds: string[];
}

const service = (definition: Omit<GuildServiceDefinition, keyof CanonicalRuleRecord> & { page: number }): GuildServiceDefinition => {
  const { page, ...rest } = definition;
  return { ...rest, ...canonicalMetadata(page) };
};

export const GUILD_SERVICES: readonly GuildServiceDefinition[] = [
  service({ id: 'send-package', name: 'Send Package', provider: 'Noonmessengers', cost: 2, locationRequirement: { kind: 'any-settlement-or-city' }, target: 'external-player', duration: 'pending-delivery', mapEffect: 'none', followUp: 'Recipient receives up to 5 Weight on next entering a Settlement or City.', page: 58, ruleIds: ['ALMANACK-004', 'SERVICE-005'] }),
  service({ id: 'rug-of-wonders', name: 'Rug of Wonders', provider: 'Griph, the Travelling Merchant', cost: 1, locationRequirement: { kind: 'any-settlement-or-city' }, target: 'reagent', duration: 'once-per-journey', mapEffect: 'none', followUp: 'Gain one Part from a non-Titan Reagent with Base Rarity 9 or lower.', page: 58, ruleIds: ['ALMANACK-004'] }),
  service({ id: 'news-from-the-trail', name: 'News From The Trail', provider: 'Chatty Beasts', cost: 2, locationRequirement: { kind: 'any-settlement-or-city' }, target: 'journey', duration: 'until-destination', mapEffect: 'none', followUp: 'Redraw one Travel Encounter and choose until reaching the Journey destination.', page: 58, ruleIds: ['ALMANACK-004'] }),
  service({ id: 'smithing', name: 'Smithing', provider: 'Guild of Orebeaters', cost: 3, locationRequirement: { kind: 'region-settlement-or-any-city', region: 'Mountain' }, target: 'upgrade', duration: 'instant', mapEffect: 'none', followUp: 'Upgrade one eligible Basic Tool using a page 66 Upgrade.', page: 59, ruleIds: ['ALMANACK-004', 'TOOL-005'] }),
  service({ id: 'forecast', name: 'Forecast', provider: 'Lodge of Weatherwarts', cost: [1, 2], locationRequirement: { kind: 'region-settlement', region: 'Bog' }, target: 'journey', duration: 'three-moves', mapEffect: 'none', followUp: 'Ignore negative Weather Foraging Encounter effects for the next 3 Moves.', page: 59, ruleIds: ['SERVICE-001'] }),
  service({ id: 'catch-of-the-day', name: 'Catch of the Day', provider: 'Guild of Fishfinders', cost: [1, 2], locationRequirement: { kind: 'region-settlement', region: 'Loch' }, target: 'reagent', duration: 'instant', mapEffect: 'none', followUp: 'Gain a Small Fish Part for 1 Trinket or Big Fish Part for 2.', page: 59, ruleIds: ['ALMANACK-004'] }),
  service({ id: 'shortcut', name: 'Shortcut', provider: 'Underbrush Beasts', cost: 2, locationRequirement: { kind: 'region-settlement', region: 'Forest' }, target: 'move', duration: 'instant', mapEffect: 'none', followUp: 'Move immediately to a nearby Location without requiring a connecting Path.', page: 59, ruleIds: ['SERVICE-002'] }),
  service({ id: 'hitch-a-ride', name: 'Hitch a Ride', provider: 'Friendly Farmers', cost: 2, locationRequirement: { kind: 'region-settlement', region: 'Meadow' }, target: 'move', duration: 'instant', mapEffect: 'none', followUp: 'Next Move travels up to 5 Paths, ends in Meadow, and replaces the Travel Encounter with a journal.', page: 59, ruleIds: ['SERVICE-002'] }),
  service({ id: 'survey-paths', name: 'Survey Paths', provider: 'Guild of Mapmakers', cost: 10, locationRequirement: { kind: 'any-city' }, target: 'map-edge', duration: 'instant', mapEffect: 'add-path', followUp: 'Add a Path between nearby Locations or connect a Location to an existing Path.', page: 60, ruleIds: ['SERVICE-002'] }),
  service({ id: 'build-a-bridge', name: 'Build a Bridge', provider: 'Guild of Stonestackers', cost: 8, locationRequirement: { kind: 'named', location: 'Spoolkeep' }, target: 'map-edge', duration: 'instant', mapEffect: 'convert-waterways', followUp: 'Convert a pair of Waterways through one Loch Location to Paths.', page: 60, ruleIds: ['SERVICE-002'] }),
  service({ id: 'floodplain', name: 'Floodplain', provider: 'Guild of Loggnawers', cost: 8, locationRequirement: { kind: 'named', location: 'Newdam' }, target: 'map-node', duration: 'until-next-spring', mapEffect: 'temporary-region', followUp: 'Turn one Wild Location into Loch until the next Spring.', page: 60, ruleIds: ['SERVICE-003'] }),
  service({ id: 'taxi-service', name: 'Taxi Service', provider: 'Boldheart the Sea Eagle', cost: 5, locationRequirement: { kind: 'named', location: 'Summit' }, target: 'move', duration: 'instant', mapEffect: 'none', followUp: 'The next Move is a protected Soar.', page: 60, ruleIds: ['ALMANACK-004'] }),
  service({ id: 'take-clippings', name: 'Take Clippings', provider: 'Wallaby Glasshouse Gardeners', cost: 5, locationRequirement: { kind: 'named', location: 'Glasswall' }, target: 'reagent', duration: 'instant', mapEffect: 'none', followUp: 'Gain one Plant Reagent Part of your choice.', page: 60, ruleIds: ['ALMANACK-004'] }),
  service({ id: 'pick-of-the-deep', name: 'Pick of the Deep', provider: 'Guild of Lochdivers', cost: 2, locationRequirement: { kind: 'named', location: 'Vessel' }, target: 'reagent', duration: 'instant', mapEffect: 'none', followUp: 'Draw a card and gain a Titan Reagent no rarer than its M=12 value.', page: 61, ruleIds: ['SERVICE-004'] }),
  service({ id: 'retrieval', name: 'Retrieval', provider: 'Freelancers', cost: 5, locationRequirement: { kind: 'named', location: 'Vessel' }, target: 'settlement', duration: 'pending-delivery', mapEffect: 'none', followUp: 'Leave a non-Titan Reagent or lost item at a Settlement at least 5 Paths away.', page: 61, ruleIds: ['SERVICE-005'] }),
  service({ id: 'send-a-missive', name: 'Send a Missive', provider: 'Order of Dragontamers', cost: 3, locationRequirement: { kind: 'named', location: 'Noonhill' }, target: 'settlement', duration: 'until-destination', mapEffect: 'none', followUp: 'Mark up to three Settlements where the next Ailment may be chosen.', page: 61, ruleIds: ['ALMANACK-004'] }),
  service({ id: 'scare-tactics', name: 'Scare Tactics', provider: 'Guild of Thickbloods', cost: 8, locationRequirement: { kind: 'named', location: 'Odoak' }, target: 'map-node', duration: 'instant', mapEffect: 'remove-threat', followUp: 'Remove one Behemoth-related map effect or Barrow.', page: 61, ruleIds: ['ALMANACK-004'] })
];

export const GUILD_SERVICE_BY_ID = new Map(GUILD_SERVICES.map(row => [row.id, row]));
