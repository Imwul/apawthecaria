import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '../rules/data/encounters';
import {
  SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO,
  SOCIAL_ENCOUNTER_REVIEW_CONTEXT_KO
} from './encounterReviewSocialKo';

const socialEncounters = ENCOUNTERS.filter(encounter => encounter.encounterType === 'social');
const reviewedChoices = Object.entries(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO)
  .flatMap(([encounterId, choices]) => Object.entries(choices)
    .map(([choiceId, text]) => ({ encounterId, choiceId, text })));
const canonicalChoices = socialEncounters.flatMap(encounter => encounter.choices
  .filter(choice => choice.id !== 'continue')
  .map(choice => ({ encounterId: encounter.id, choiceId: choice.id, text: choice.label })));

const sortedKeys = (rows: Array<{ encounterId: string; choiceId: string }>): string[] => rows
  .map(row => `${row.encounterId}/${row.choiceId}`)
  .sort();

const canonicalTags = (value: string): string[] => [...value.matchAll(/\[([A-Z]+)(?:\s+\d+(?:\/\d+)?)?\]/g)]
  .map(match => match[1])
  .sort();

describe('fully reviewed social encounter Korean copy', () => {
  it('covers every social context and only social encounter ids', () => {
    expect(socialEncounters).toHaveLength(66);
    expect(Object.keys(SOCIAL_ENCOUNTER_REVIEW_CONTEXT_KO).sort()).toEqual(
      socialEncounters.map(encounter => encounter.id).sort()
    );
  });

  it('covers every actual social choice and no generated continue action', () => {
    // The current canonical data has 89 printed/player choices. The other 18
    // rows use the shared generated "기록하고 계속" action and need no override.
    expect(canonicalChoices).toHaveLength(89);
    expect(reviewedChoices).toHaveLength(89);
    expect(sortedKeys(reviewedChoices)).toEqual(sortedKeys(canonicalChoices));
    expect(reviewedChoices.some(choice => choice.choiceId === 'continue')).toBe(false);
  });

  it('keeps every canonical bracketed rule tag in its reviewed branch', () => {
    const sourceByKey = new Map<string, string>(canonicalChoices
      .map(choice => [`${choice.encounterId}/${choice.choiceId}`, choice.text] as const));

    for (const choice of reviewedChoices) {
      const key = `${choice.encounterId}/${choice.choiceId}`;
      const sourceTags = canonicalTags(sourceByKey.get(key) || '');
      const reviewedTags = canonicalTags(choice.text);
      expect(sourceTags.every(tag => reviewedTags.includes(tag)), key).toBe(true);
    }
  });

  it('uses the encounter choice delimiter and contains no extraction or machine-translation residue', () => {
    const allText = [
      ...Object.values(SOCIAL_ENCOUNTER_REVIEW_CONTEXT_KO),
      ...reviewedChoices.map(choice => choice.text)
    ];

    for (const choice of reviewedChoices) {
      expect(choice.text, `${choice.encounterId}/${choice.choiceId}`).toContain(' — ');
      expect(choice.text, `${choice.encounterId}/${choice.choiceId}`).not.toContain(' - ');
    }

    for (const text of allText) {
      expect(text).toMatch(/[가-힣]/);
      expect(text).not.toMatch(/\b(?:Gain|Lose|Draw|Journal|Add|Reduce|Increase|What|How|Where|Does|Do|If|When|You|Your)\b/);
      expect(text).not.toMatch(/\b(?:PAGE|ACE)\b|\bp\.?\s*\d{2,3}\b|\s\d{3}\s*$/i);
      expect(text).not.toContain(' - ');
      expect(text).not.toMatch(/당신와|당신가|영약재 부위을|명성를|약제사s|짐승은 어떤가요|좁니다|갈대 뚝|삭뚝|머물럽|두드겨|끕끕|잖는|잗는|햇별|뾈|얇힌|진흙을 일어|엌전|큰들꿑|나무꺼질|알아챍|배\)을|진주\)을|민물조개[^)]*\)를|여왕벌\)를|담요\)을|뜨개담요\)과|빠진 털\)를|은 조각\)를/);
      expect(text).not.toMatch(/\s{2,}|\n/);
    }
  });

  it('preserves the high-risk printed mechanics reviewed against pp.190-213', () => {
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-bog-summer-♣'].demonstration)
      .toContain('Iris Oil(붓꽃 기름, 무게 1/3)');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-bog-summer-♣'].demonstration)
      .toContain('[NERVES 2]');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-forest-summer-♣']['place-a-bet'])
      .toContain('장신구 1개, 2개 또는 4개');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-forest-winter-♣']['hauling-the-winter-log'])
      .toContain('Burned Wood(탄 나무)의 Ash(재) 부위');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-loch-newdam-♦']['mother-o-fruits'])
      .toContain('Fruit(과일, 무게 1)');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-meadow-spring-♣']['protect-the-queen'])
      .toMatch(/Queen Bee\(여왕벌\)[\s\S]*Beehive[\s\S]*Honey\(꿀\)[\s\S]*Wax\(밀랍\)/);
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-mountain-spoolkeep-♦'].woolworks)
      .toContain('Behemoth Bits의 Fur(빠진 털) 부위');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-mountain-summer-♣']['storied-swap'])
      .toContain('Iron(철)의 Pellets(알갱이) 부위');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-mountain-autumn-♣']['go-panning'])
      .toContain('♥가 나오면 Silver Shards(은 조각)');
    expect(SOCIAL_ENCOUNTER_REVIEW_CHOICE_KO['social-loch-autumn-♣']['working-for-a-snack'])
      .toContain('다음에 달력에 1일을 표시하면 상합니다');
  });
});
