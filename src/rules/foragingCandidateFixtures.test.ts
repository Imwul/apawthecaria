import { describe, expect, it } from 'vitest';
import {
  REAGENT_BY_ID,
  REAGENTS,
  calculateCanonicalForageRarity,
  resolveForagingEngine
} from './index';
import type { ForagingEngineState, RuleCard } from './index';

const stateFor = (
  currentRegion: ForagingEngineState['currentRegion']
): ForagingEngineState => ({
  season: 'Spring',
  currentRegion,
  currentLocationType: 'Wilds',
  foragingPoints: 0,
  inventory: [],
  toolIds: []
});

const fixture = (
  region: ForagingEngineState['currentRegion'],
  card: RuleCard,
  reagentTypeFilter?: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN'
) => {
  const resolution = resolveForagingEngine({
    transactionId: `foraging-candidate-fixture:${region}:${typeof card === 'number' ? card : 'value' in card ? card.value : card.val}:${reagentTypeFilter || 'all'}`,
    state: stateFor(region),
    forageRegion: region,
    locationRelation: 'current',
    card,
    reagentTypeFilter,
    skipEncounter: true
  });
  expect(resolution.status).toBe('resolved');
  expect(resolution.value).not.toBeNull();
  return resolution.value!;
};

const successful = (result: ReturnType<typeof fixture>) =>
  result.candidates.filter(candidate => candidate.cardSuccess);

const missed = (result: ReturnType<typeof fixture>) =>
  result.candidates.filter(candidate => !candidate.cardSuccess);

const canonicalAvailableIds = (region: ForagingEngineState['currentRegion']) => REAGENTS
  .filter(reagent => calculateCanonicalForageRarity(reagent, region, 'Spring', []) !== null)
  .map(reagent => reagent.id);

describe('canonical large-result Foraging candidate fixtures', () => {
  it('keeps the Spring Loch 3 of Hearts result at 30 available and 2 card-success candidates', () => {
    const result = fixture('Loch', { value: 3, suit: '♥' });

    expect(result.candidates).toHaveLength(30);
    expect(successful(result).map(candidate => candidate.canonicalName)).toEqual([
      'Clay',
      'Marshgold'
    ]);
    expect(missed(result)).toHaveLength(28);
  });

  it('keeps the Spring Meadow 5 of Clubs result at 42 available and 18 card-success candidates', () => {
    const result = fixture('Meadow', { value: 5, suit: '♣' });

    expect(result.candidates).toHaveLength(42);
    expect(successful(result)).toHaveLength(18);
    expect(missed(result)).toHaveLength(24);
  });

  it('keeps the Spring Meadow Jack of Hearts large result at 42 available, 38 successes, and 4 misses', () => {
    const result = fixture('Meadow', { value: 11, suit: '♥' });

    expect(result.candidates).toHaveLength(42);
    expect(successful(result)).toHaveLength(38);
    expect(missed(result).map(candidate => [candidate.canonicalName, candidate.rarity])).toEqual([
      ['Cucumbers', 12],
      ['Hoarhound', 12],
      ['Maggots', 13],
      ['Nightshade', 12]
    ]);
  });

  it('preserves the neutral canonical Almanack order without ranking by card success', () => {
    const result = fixture('Meadow', { value: 11, suit: '♥' });

    expect(result.candidates.map(candidate => candidate.reagentId)).toEqual(
      canonicalAvailableIds('Meadow')
    );
    expect(successful(result).findIndex(candidate => candidate.canonicalName === 'Marigold')).toBe(21);
    expect(result.candidates.findIndex(candidate => candidate.canonicalName === 'Cucumbers')).toBeLessThan(
      result.candidates.findIndex(candidate => candidate.canonicalName === 'Marigold')
    );
  });

  it('keeps a canonical type-filtered result as a stable subsequence of the complete result', () => {
    const complete = fixture('Meadow', { value: 11, suit: '♥' });
    const plants = fixture('Meadow', { value: 11, suit: '♥' }, 'PLANT');
    const expectedPlantIds = complete.candidates
      .filter(candidate => REAGENT_BY_ID.get(candidate.reagentId)?.type === 'PLANT')
      .map(candidate => candidate.reagentId);

    expect(plants.candidates.map(candidate => candidate.reagentId)).toEqual(expectedPlantIds);
    expect(new Set(plants.candidates.map(candidate => candidate.reagentId)).size).toBe(plants.candidates.length);
  });
});
