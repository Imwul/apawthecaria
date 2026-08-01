import { canonicalMetadata } from '../source';
import type { RegionDefinition, TravelRegion } from '../types';

const REGION_IDS: readonly TravelRegion[] = ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan', 'Soar'];

export const REGIONS: readonly RegionDefinition[] = REGION_IDS.map(id => ({
  id,
  reagentRegion: id !== 'Soar',
  travelRegion: true,
  foragingRegion: id !== 'Soar',
  ...canonicalMetadata(id === 'Soar' ? 72 : 22)
}));

export const REGION_BY_ID = new Map(REGIONS.map(region => [region.id, region]));
