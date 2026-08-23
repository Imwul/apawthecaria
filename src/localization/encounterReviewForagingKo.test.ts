import { describe, expect, it } from 'vitest';

import { ENCOUNTERS, FORAGING_ENCOUNTERS } from '../rules/data/encounters';
import {
  ENCOUNTER_REVIEW_FORAGING_CHOICE_KO,
  ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO,
} from './encounterReviewForagingKo';

const encounterById = new Map(ENCOUNTERS.map(encounter => [encounter.id, encounter]));

const reviewedStrings = [
  ...Object.values(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO),
  ...Object.values(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO)
    .flatMap(choiceMap => Object.values(choiceMap)),
];

describe('human-reviewed Korean foraging encounters', () => {
  it('explicitly covers every runtime foraging encounter, including seasonal clones', () => {
    expect(FORAGING_ENCOUNTERS).toHaveLength(144);
    expect(Object.keys(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO).sort())
      .toEqual(FORAGING_ENCOUNTERS.map(encounter => encounter.id).sort());
  });

  it('uses only canonical foraging encounter and choice ids', () => {
    Object.keys(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO).forEach(encounterId => {
      const encounter = encounterById.get(encounterId);
      expect(encounter, encounterId).toBeDefined();
      expect(encounter?.encounterType, encounterId).toBe('foraging');
    });

    Object.entries(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO).forEach(([encounterId, choiceMap]) => {
      const encounter = encounterById.get(encounterId);
      expect(encounter, encounterId).toBeDefined();
      expect(encounter?.encounterType, encounterId).toBe('foraging');

      const canonicalChoiceIds = new Set(encounter?.choices.map(choice => choice.id));
      Object.keys(choiceMap).forEach(choiceId => {
        expect(canonicalChoiceIds.has(choiceId), `${encounterId}/${choiceId}`).toBe(true);
      });
    });
  });

  it('explicitly covers every canonical choice, not only choices with known defects', () => {
    const canonicalChoiceKeys = FORAGING_ENCOUNTERS
      .flatMap(encounter => encounter.choices.map(choice => `${encounter.id}/${choice.id}`))
      .sort();
    const reviewedChoiceKeys = Object.entries(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO)
      .flatMap(([encounterId, choiceMap]) => (
        Object.keys(choiceMap).map(choiceId => `${encounterId}/${choiceId}`)
      ))
      .sort();

    expect(canonicalChoiceKeys).toHaveLength(262);
    expect(reviewedChoiceKeys).toEqual(canonicalChoiceKeys);
  });

  it('contains no blank copy, PDF table residue, or known machine-Korean regressions', () => {
    const machineResidue = /부위을|당신는|채집를|다음 단계로|밋지|명성 \d+개|타이머 \d+개|하부|체이스 제공|스낵타임|워밍업|누군가\?\?|타이탄스|Titan라고|Crossbow|Animal Sheddings를|신작 공개|인터럽트|타이탄/;
    const tableResidue = /(?:Foraging Encounters|Bog Foraging|Forest Foraging|Loch Foraging|Meadow Foraging|Mountain Foraging|Titan Ruins Foraging)|(?:p\.?\s*)?\d{3}\s*$/i;

    reviewedStrings.forEach(text => {
      expect(text).toBe(text.trim());
      expect(text).not.toBe('');
      expect(text).toMatch(/[가-힣]/);
      expect(text).not.toMatch(machineResidue);
      expect(text).not.toMatch(tableResidue);
    });
  });

  it('repairs the contexts that previously belonged to another scene', () => {
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-forest-8'])
      .toContain('다른 약제사');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-forest-8'])
      .not.toContain('수상한 흔적');

    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-bog-m-autumn'])
      .toContain('자신의 땅');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-bog-m-autumn'])
      .not.toContain('안개');

    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-bog-10-winter'])
      .toContain('발의 감각');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-forest-j-autumn'])
      .toContain('견과 찾기 대회');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-forest-j-winter'])
      .toContain('문을 두드릴 건가요?');
  });

  it('keeps printed branches that the legacy table parser omitted', () => {
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-meadow-j-spring'])
      .toContain('농부의 요구');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-meadow-j-spring'])
      .toContain('채집 포인트 2');

    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-mountain-10-autumn'])
      .toContain('몸 낮추기');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-mountain-10-autumn'])
      .toContain('모든 타이머를 2 줄입니다');

    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-loch-a'])
      .toMatch(/♥ 또는 ♦/);
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-loch-a'])
      .toMatch(/♣ 또는 ♠/);
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-loch-a'])
      .toContain('합계 5');
  });

  it('preserves the official p.169 duplicate and missing-row guidance', () => {
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-loch-10-summer'])
      .toContain('공식 룰북 p.169');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-loch-10-summer'])
      .toContain('두 개 인쇄');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-loch-j-summer'])
      .toContain('공식 룰북 p.169');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-loch-j-summer'])
      .toContain('인쇄되어 있지 않습니다');
  });

  it('does not silently invent the missing p.160 Mushroom Pickers suit result', () => {
    const junior = ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-forest-4'].junior;
    expect(junior).toContain('♦·♣·♣ (룰북 표기)');
    expect(junior).not.toContain('♠');
  });

  it('does not silently invent the missing p.163 Thief suit result', () => {
    const giveChase = ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-forest-j-summer']['give-chase'];
    expect(giveChase).toContain('♣ 또는 ♣ (룰북 표기)');
    expect(giveChase).not.toContain('♠');
  });

  it('keeps Titan seasonal clones and their decisions equally reviewed', () => {
    (['spring', 'summer', 'autumn', 'winter'] as const).forEach(season => {
      expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO[`foraging-titan-10-${season}`])
        .toContain('어디를 살필지 고르세요');
      expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO[`foraging-titan-j-${season}`])
        .toContain('갇힌 야수');
      expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO[`foraging-titan-m-${season}`])
        .toContain('바카르');

      expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[`foraging-titan-10-${season}`].stunned)
        .toContain('Beetles(딱정벌레)');
      expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[`foraging-titan-j-${season}`].rescue)
        .toMatch(/♥ 또는 ♦/);
      expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO[`foraging-titan-m-${season}`].discovery)
        .toContain('모든 티탄 유적');
    });
  });

  it('keeps canonical English ingredient names first and exact common Korean names second', () => {
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-loch-2']['catch-of-the-day'])
      .toContain('Small Fish(작은 물고기)');
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-bog-9-autumn']['pounder-s-take'])
      .toContain('Iron Ore(철광석)');
    expect(ENCOUNTER_REVIEW_FORAGING_CONTEXT_KO['foraging-forest-6'])
      .toMatch(/Beetles\(딱정벌레\).*Maggots\(구더기\).*Wasps\(말벌\)/);
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-titan-8'].quick)
      .toContain('위험을 무릅쓰고');
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-meadow-10-winter'].snotladen)
      .toContain('심한 콧물');
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-titan-10-spring'].stunned)
      .toMatch(/Beetles\(딱정벌레\).*Honeybees\(꿀벌\).*Wasps\(말벌\)/);
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-titan-10-spring'].burrowed)
      .toMatch(/Maggots\(구더기\).*Slugs\(민달팽이\).*Spiders\(거미\)/);
  });

  it('uses direct player instructions for card-indexed inventory loss', () => {
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-forest-j-summer']['lost-item'])
      .toContain('마지막으로 센 물품 하나를 버리세요');
    expect(ENCOUNTER_REVIEW_FORAGING_CHOICE_KO['foraging-bog-m-spring']['get-a-better-view'])
      .toContain('마지막으로 센 물품 하나를 버리세요');
    expect(reviewedStrings.join('\n')).not.toContain('마지막 물품을 버립니다');
  });
});
