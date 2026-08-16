import { describe, expect, it } from 'vitest';
import { GAME_DATA } from '../gameData';
import { AILMENTS } from './data/ailments';
import { REAGENTS } from './data/reagents';

describe('canonical catalog coverage', () => {
  it('includes reagents missing from the legacy GAME_DATA table', () => {
    const legacyNames = new Set(GAME_DATA.reagents.map(row => row.rawName));
    for (const name of ['Woundwort', 'Yarrow', 'Yellow Wort']) {
      expect(legacyNames.has(name)).toBe(false);
      expect(REAGENTS.some(row => row.canonicalName === name)).toBe(true);
    }
    expect(REAGENTS.length).toBeGreaterThan(GAME_DATA.reagents.length);
  });

  it('includes ailments missing from the legacy GAME_DATA table', () => {
    const legacyNames = new Set(GAME_DATA.ailments.map(row => row.rawName || row.name));
    expect([...legacyNames].some(name => name.includes('Bite the Hand that Cures'))).toBe(false);
    expect(AILMENTS.some(row => row.canonicalName === 'Bite the Hand that Cures')).toBe(true);
    expect(AILMENTS.length).toBeGreaterThanOrEqual(GAME_DATA.ailments.length);
  });
});
