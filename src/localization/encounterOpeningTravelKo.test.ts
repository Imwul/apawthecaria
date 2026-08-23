import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '../rules/data/encounters';
import {
  ENCOUNTER_OPENING_TRAVEL_KO,
  ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX
} from './encounterOpeningTravelKo';

const travelEncounters = ENCOUNTERS.filter(encounter => encounter.encounterType === 'travel');
const travelEncounterIds = travelEncounters.map(encounter => encounter.id).sort();

const rowsWhosePrintedTitleHasNoOpening = [
  'travel-bog-m-autumn',
  'travel-bog-m-winter',
  'travel-forest-a-2',
  'travel-meadow-a-2',
  'travel-mountain-3-4',
  'travel-mountain-9-10-winter',
  'travel-mountain-j-autumn',
  'travel-soar-9-10-autumn',
  'travel-soar-9-10-summer',
  'travel-soar-9-10-winter',
  'travel-soar-j-winter',
  'travel-soar-m-winter',
  'travel-titan-7-8',
  'travel-titan-9-10',
  'travel-titan-j',
  'travel-titan-m'
].sort();

describe('ENCOUNTER_OPENING_TRAVEL_KO', () => {
  it('covers every canonical travel encounter id without stale keys', () => {
    expect(Object.keys(ENCOUNTER_OPENING_TRAVEL_KO).sort()).toEqual(travelEncounterIds);
    expect(travelEncounterIds).toHaveLength(103);
  });

  it('uses an explicit empty value only when the printed title has no opening prose', () => {
    const emptyIds = Object.entries(ENCOUNTER_OPENING_TRAVEL_KO)
      .filter(([, opening]) => opening === '')
      .map(([id]) => id)
      .sort();

    expect(emptyIds).toEqual(rowsWhosePrintedTitleHasNoOpening);
  });

  it('keeps restored Korean openings complete and free of known machine-translation residue', () => {
    Object.entries(ENCOUNTER_OPENING_TRAVEL_KO).forEach(([id, opening]) => {
      if (!opening) return;
      expect(opening, id).toBe(opening.trim());
      expect(opening, id).toMatch(/[.!?…]$/);
      expect(opening, id).not.toMatch(/명성를|환자에서|다음 마초|자신 자신|타이머(?:를)?\s*\d+\s*만큼|귀하/);
    });
  });

  it('restores rule instructions that were trapped in the printed title column', () => {
    expect(ENCOUNTER_OPENING_TRAVEL_KO['travel-bog-9-10-summer']).toContain('Leech(거머리) 영약재를 얻습니다');
    expect(ENCOUNTER_OPENING_TRAVEL_KO['travel-loch-7-8']).toContain('카드 한 장을 뽑아');
  });

  it('restores representative narrative openings instead of starting at a choice', () => {
    expect(ENCOUNTER_OPENING_TRAVEL_KO['travel-bog-9-10-spring']).toBe('늪은 으스스하고 쓸쓸한 곳이 될 수 있습니다.');
    expect(ENCOUNTER_OPENING_TRAVEL_KO['travel-forest-5-6']).toBe('길가에 여러 야수가 모여 소문을 나누고 있습니다.');
    expect(ENCOUNTER_OPENING_TRAVEL_KO['travel-loch-j-spring']).toBe('재주를 뽐내는 물새 한 마리가 무리 앞에서 경주를 걸어 옵니다.');
  });
});

describe('ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX', () => {
  it('contains only verified prefixes from canonical travel prompts', () => {
    Object.entries(ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX).forEach(([id, prefix]) => {
      const encounter = travelEncounters.find(row => row.id === id);
      expect(encounter, id).toBeDefined();
      expect(prefix, id).not.toBe('');
      expect(encounter?.prompt.startsWith(prefix), id).toBe(true);
      expect(ENCOUNTER_OPENING_TRAVEL_KO[id], id).not.toBe('');
    });
  });

  it('covers every row whose title and prompt split or duplicate one opening sentence', () => {
    expect(Object.keys(ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX).sort()).toEqual([
      'travel-bog-9-10-autumn',
      'travel-bog-9-10-summer',
      'travel-loch-m-winter',
      'travel-meadow-7-8',
      'travel-meadow-m-summer',
      'travel-titan-a-2'
    ]);
  });

  it('leaves the next printed choice intact after removing an absorbed prefix', () => {
    const expectedRemainders: Record<string, RegExp> = {
      'travel-bog-9-10-autumn': /^Delicious!\s*-/,
      'travel-loch-m-winter': /^Warmth\s*-/,
      'travel-meadow-7-8': /^Call out to the Messenger\s*-/,
      'travel-meadow-m-summer': /^Visit\s*-/,
      'travel-titan-a-2': /^What A Wind Up\s*-/
    };

    Object.entries(expectedRemainders).forEach(([id, expected]) => {
      const encounter = travelEncounters.find(row => row.id === id);
      const prefix = ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX[id];
      expect(encounter?.prompt.slice(prefix.length).trimStart(), id).toMatch(expected);
    });

    const absorbedWholePrompt = travelEncounters.find(row => row.id === 'travel-bog-9-10-summer');
    const absorbedPrefix = ENCOUNTER_OPENING_TRAVEL_PROMPT_PREFIX['travel-bog-9-10-summer'];
    expect(absorbedWholePrompt?.prompt.slice(absorbedPrefix.length).trim(), 'travel-bog-9-10-summer').toBe('');
  });
});
