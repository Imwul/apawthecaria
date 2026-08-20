import { describe, expect, it } from 'vitest';
import {
  isRulebookHistoryState,
  journalHash,
  journalHistoryState,
  journalTabFromHash
} from './sessionNavigation';

describe('session navigation', () => {
  it('opens valid chapter deep links and safely falls back to Today', () => {
    expect(journalTabFromHash('#almanack')).toBe('almanack');
    expect(journalTabFromHash('#/patientArchive')).toBe('patientArchive');
    expect(journalTabFromHash('#map?focus=odoak')).toBe('map');
    expect(journalTabFromHash('#unknown')).toBe('play');
    expect(journalTabFromHash('')).toBe('play');
  });

  it('builds stable chapter hashes', () => {
    expect(journalHash('play')).toBe('#play');
    expect(journalHash('journals')).toBe('#journals');
  });

  it('marks only the transient rulebook entry as a closeable overlay', () => {
    const base = journalHistoryState('ailments', { existing: 'kept' });
    const drawer = journalHistoryState('ailments', base, 'rulebook');

    expect(base).toMatchObject({ existing: 'kept', journalTab: 'ailments' });
    expect(isRulebookHistoryState(base)).toBe(false);
    expect(isRulebookHistoryState(drawer)).toBe(true);
  });
});
