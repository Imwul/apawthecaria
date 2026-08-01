import { canonicalMetadata } from '../source';
import type { Season, SeasonDefinition } from '../types';

const SEASON_ORDER: readonly Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

export const SEASONS: readonly SeasonDefinition[] = SEASON_ORDER.map((id, order) => ({
  id,
  order,
  nextSeason: SEASON_ORDER[(order + 1) % SEASON_ORDER.length],
  ...canonicalMetadata(18)
}));

export const SEASON_BY_ID = new Map(SEASONS.map(season => [season.id, season]));
