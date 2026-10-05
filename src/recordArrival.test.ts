import { describe, expect, it } from 'vitest';
import { newlyAddedRecordIds } from './recordArrival';

describe('discovery arrival feedback', () => {
  it('does not replay an arrival when a saved campaign first loads', () => {
    expect(newlyAddedRecordIds(null, { scope: 'one', ids: ['old', 'older'] })).toEqual([]);
  });
  it('does not call an import or another slot a new discovery', () => {
    expect(newlyAddedRecordIds({ scope: 'one', ids: ['old'] }, { scope: 'two', ids: ['imported'] })).toEqual([]);
  });
  it('announces only new identifiers, ignoring reorder, removal and duplicates', () => {
    expect(newlyAddedRecordIds({ scope: 'one', ids: ['old', 'removed'] }, { scope: 'one', ids: ['new', 'old', 'new'] })).toEqual(['new']);
    expect(newlyAddedRecordIds({ scope: 'one', ids: ['a', 'b'] }, { scope: 'one', ids: ['b', 'a'] })).toEqual([]);
  });
});
