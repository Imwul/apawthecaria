import { describe, expect, it } from 'vitest';

import { ENCOUNTER_TITLE_KO } from './encounterTitleKo';
import {
  ENCOUNTER_OPENING_FORAGING_KO,
  ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX,
} from './encounterOpeningForagingKo';
import { FORAGING_ENCOUNTERS } from '../rules/data/encounters';

const compactSourceText = (value: string): string => value
  .toLocaleLowerCase('en')
  .replace(/[^a-z0-9]+/g, '');

const canonicalTitles = Object.keys(ENCOUNTER_TITLE_KO)
  .sort((left, right) => compactSourceText(right).length - compactSourceText(left).length);

const idsWithOpeningInTitleCell = FORAGING_ENCOUNTERS
  .filter(encounter => {
    const compactTitleCell = compactSourceText(encounter.title);
    const canonicalTitle = canonicalTitles.find(title => compactTitleCell.startsWith(compactSourceText(title)));
    return Boolean(canonicalTitle && compactTitleCell !== compactSourceText(canonicalTitle));
  })
  .map(encounter => encounter.id)
  .sort();

describe('foraging encounter Korean openings', () => {
  it('covers every and only the encounters whose title cell also contains narration', () => {
    expect(idsWithOpeningInTitleCell).toHaveLength(118);
    expect(Object.keys(ENCOUNTER_OPENING_FORAGING_KO).sort()).toEqual(idsWithOpeningInTitleCell);
  });

  it('contains complete Korean display copy without source-language or page-number residue', () => {
    Object.entries(ENCOUNTER_OPENING_FORAGING_KO).forEach(([id, opening]) => {
      expect(opening, id).toBe(opening.trim());
      expect(opening, id).toMatch(/[가-힣]/);
      expect(opening, id).not.toMatch(/[A-Za-z]/);
      expect(opening, id).not.toMatch(/(?:p\.?\s*)?\d{3}\s*$/i);
      expect(opening, id).toMatch(/[.!?。！？…]$/);
    });
  });

  it('records an exact consumed prompt prefix for every translated opening', () => {
    expect(Object.keys(ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX).sort()).toEqual(idsWithOpeningInTitleCell);

    Object.entries(ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX).forEach(([id, prefix]) => {
      const encounter = FORAGING_ENCOUNTERS.find(row => row.id === id);
      expect(encounter, id).toBeDefined();
      expect(prefix, id).not.toBe('');
      expect(encounter?.prompt.startsWith(prefix), `${id}: ${JSON.stringify(prefix)}`).toBe(true);
    });
  });

  it('preserves title-cell rules and joins the three split-word openings without truncation', () => {
    expect(ENCOUNTER_OPENING_FORAGING_KO['foraging-loch-10-spring'])
      .toContain('카드 한 장을 뽑습니다');
    expect(ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX['foraging-loch-8'])
      .toBe('“going to the Blackwater”.');
    expect(ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX['foraging-mountain-9-summer'])
      .toBe('butting heads over it.');
    expect(ENCOUNTER_OPENING_FORAGING_PROMPT_PREFIX['foraging-mountain-10-summer'])
      .toBe('beast has rolled up a cart full of cool drinks to a popular rest stop on this side of the mountain, serving all the beasts who are making the trek today.');
  });
});
