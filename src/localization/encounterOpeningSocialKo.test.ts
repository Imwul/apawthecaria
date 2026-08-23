import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '../rules/data/encounters';
import {
  ENCOUNTER_OPENING_SOCIAL_KO,
  ENCOUNTER_OPENING_SOCIAL_PROMPT_PREFIX
} from './encounterOpeningSocialKo';

const socialEncounters = ENCOUNTERS.filter(encounter => encounter.encounterType === 'social');

describe('social encounter Korean opening narratives', () => {
  it('explicitly covers every social encounter id and no non-social id', () => {
    expect(socialEncounters).toHaveLength(66);
    expect(Object.keys(ENCOUNTER_OPENING_SOCIAL_KO).sort()).toEqual(
      socialEncounters.map(encounter => encounter.id).sort()
    );
  });

  it('leaves only the two title-only source rows intentionally empty', () => {
    const emptyIds = Object.entries(ENCOUNTER_OPENING_SOCIAL_KO)
      .filter(([, opening]) => opening === '')
      .map(([id]) => id)
      .sort();

    expect(emptyIds).toEqual([
      'social-bog-spring-♠',
      'social-meadow-autumn-♣'
    ]);
  });

  it('uses exact prompt prefixes only where the printed opening crosses the field boundary', () => {
    expect(Object.keys(ENCOUNTER_OPENING_SOCIAL_PROMPT_PREFIX).sort()).toEqual([
      'social-bog-settlement-♦',
      'social-bog-summer-♠',
      'social-glasswall-♦',
      'social-loch-newdam-♥',
      'social-loch-newdam-♦'
    ]);

    for (const [id, prefix] of Object.entries(ENCOUNTER_OPENING_SOCIAL_PROMPT_PREFIX)) {
      const encounter = socialEncounters.find(row => row.id === id);
      expect(encounter, id).toBeDefined();
      expect(encounter!.prompt.startsWith(prefix), id).toBe(true);
      expect(ENCOUNTER_OPENING_SOCIAL_KO[id], id).toMatch(/[.!?]$/);
    }
  });

  it('keeps the reviewed openings Korean, complete, and free of extraction residue', () => {
    const rendered = Object.values(ENCOUNTER_OPENING_SOCIAL_KO).filter(Boolean);

    expect(rendered).toHaveLength(64);
    for (const opening of rendered) {
      expect(opening).toMatch(/[.!?]$/);
      expect(opening).not.toMatch(/[A-Za-z]{2}/);
      expect(opening).not.toMatch(/^[.,;:—]|\s{2,}|\n|\b(?:ACE|PAGE)\b/i);
      expect(opening).not.toMatch(/갈대 뚝|머물럽|삭뚝|두드겨|끕끕|잖는|잗는|햇별|햇볍|뾈|파 만든/);
    }
  });

  it('repairs source heading wraps without leaking them into the opening', () => {
    expect(ENCOUNTER_OPENING_SOCIAL_KO['social-loch-spring-♠']).toBe(
      '근처 배의 뱃머리에 앉아 발을 물에 담근 야수 하나가 연어의 커다랗고 단단한 뼛조각을 깎고 있습니다.'
    );
    expect(ENCOUNTER_OPENING_SOCIAL_KO['social-meadow-summer-♣']).toBe(
      '어린 야수 여럿이 근처 집 창문에 섬세한 거미줄을 짜는 풀거미를 유심히 바라보고 있습니다.'
    );
    expect(ENCOUNTER_OPENING_SOCIAL_KO['social-glasswall-♦']).toContain('어쩌면 낯익은');
    expect(ENCOUNTER_OPENING_SOCIAL_KO['social-glasswall-♦']).toContain('커다란 뇌조');
  });
});
