import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '../rules/data/encounters';
import {
  ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO,
  ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO
} from './encounterReviewTravelKo';

const travelEncounters = ENCOUNTERS.filter(encounter => encounter.encounterType === 'travel');
const travelEncounterIds = travelEncounters.map(encounter => encounter.id).sort();
const reviewedChoiceIds = Object.entries(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO)
  .flatMap(([encounterId, choices]) => Object.keys(choices).map(choiceId => `${encounterId}:${choiceId}`))
  .sort();
const canonicalChoiceIds = travelEncounters
  .flatMap(encounter => encounter.choices
    .filter(choice => choice.id !== 'continue')
    .map(choice => `${encounter.id}:${choice.id}`))
  .sort();

describe('ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO', () => {
  it('covers all 103 canonical travel encounters without stale ids', () => {
    expect(travelEncounterIds).toHaveLength(103);
    expect(Object.keys(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO).sort()).toEqual(travelEncounterIds);
  });

  it('keeps every reviewed scene complete and free of extraction residue', () => {
    Object.entries(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO).forEach(([id, text]) => {
      expect(text, id).toBe(text.trim());
      expect(text, id).not.toBe('');
      expect(text, id).toMatch(/[.!?…]$/);
      expect(text, id).not.toMatch(/\b(?:Bog|Forest|Loch|Meadow|Mountain|Soar|Titan) travel encounters\b/i);
      expect(text, id).not.toMatch(/\b(?:Draw a|Mark \d|Gain \d|Lose \d|Continue your|Travel Encounter|Foraging Points?)\b/);
      expect(text, id).not.toMatch(/명성를|채집를|환자에서|당신가|당신와|느지|마크\s*\d|\bPage\s*\d|\b(?:74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99)\s*$/);
    });
  });

  it('removes verified adjacent-column spills and restores omitted source scenes', () => {
    expect(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO['travel-bog-3-4']).not.toContain('브리슬리 숲의 늪지');
    expect(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO['travel-mountain-5-6']).not.toContain('네 모퉁이');
    expect(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO['travel-forest-a-2']).toContain('길가에 무언가가 자라고');
    expect(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO['travel-meadow-a-2']).toContain('나무가 쓰러져 앞길을 막은');
    expect(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO['travel-mountain-9-10-winter']).toContain('경고하기');
    expect(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO['travel-soar-9-10-summer']).toContain('[WOUND 3] [INFECTION 2] [PAIN 2]');
  });
});

describe('ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO', () => {
  it('reviews every canonical non-continue choice without stale ids', () => {
    expect(canonicalChoiceIds).toHaveLength(124);
    expect(reviewedChoiceIds).toEqual(canonicalChoiceIds);
  });

  it('keeps choice copy readable and free of known machine-translation residue', () => {
    Object.entries(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO).forEach(([encounterId, choices]) => {
      const encounter = travelEncounters.find(row => row.id === encounterId);
      expect(encounter, encounterId).toBeDefined();
      Object.entries(choices).forEach(([choiceId, text]) => {
        expect(encounter?.choices.some(choice => choice.id === choiceId), `${encounterId}:${choiceId}`).toBe(true);
        expect(text, `${encounterId}:${choiceId}`).toBe(text.trim());
        expect(text, `${encounterId}:${choiceId}`).toContain('—');
        expect(text, `${encounterId}:${choiceId}`).not.toMatch(/\b(?:Draw a|Mark \d|Gain \d|Lose \d|Continue your|Travel Encounter|Foraging Points?)\b/);
        expect(text, `${encounterId}:${choiceId}`).not.toMatch(/명성를|채집를|환자에서|당신가|당신와|느지|마크\s*\d|럭키 브레이크|그래비 발|도움말:|비즈니스에 주의|\bPage\s*\d|\b(?:74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99)\s*$/);
      });
    });
  });

  it('preserves representative deterministic and conditional rules', () => {
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-bog-a-2']['follow-the-trail']).toContain('♣ 또는 ♠');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-loch-a-2']['washed-away']).toContain('♥ — 북쪽·위');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-meadow-9-10-autumn']['push-on']).toContain('[TEMPERATURE 1]');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-mountain-j-spring'].quest).toContain('중요함(9일)');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-mountain-j-spring'].quest).toContain('경로 24개');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-soar-9-10-spring'].outmanoeuvre).toContain('[WOUND 3] [INFECTION 2] [PAIN 2]');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-titan-7-8']['duty-calls']).toContain('[HIDE 2] [POISON 1]');
    expect(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-meadow-9-10-winter']['challenge-accepted']).toContain('장신구로 취급');
    expect(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO['travel-loch-7-8']).toContain('경로 2개');
    expect(Object.values(ENCOUNTER_REVIEW_TRAVEL_CONTEXT_KO).join('\n')).not.toContain('육로');
    expect(Object.values(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO).flatMap(choices => Object.values(choices)).join('\n')).not.toContain('육로');
  });

  it('keeps the Highway Robbery choices natural instead of translating the wordplay literally', () => {
    const choices = ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO['travel-meadow-9-10-spring'];
    expect(choices['pay-with-your-pockets']).toBe('장신구로 내기 — 장신구 1개를 잃습니다. 갑자기 전리품을 얻은 들쥐 아이는 어떤 반응을 보이나요?');
    expect(choices['pay-with-your-life']).toBe('결투로 대신하기 — 달력에 1일을 표시합니다. 들쥐 아이와 모의 결투를 벌이고, 둘 중 누가 누구를 ‘쓰러뜨렸는지’ 일지에 기록하세요.');
    expect(choices['pay-with-your-patience']).toBe('그냥 지나치기 — 아이를 성급히 지나쳐 여정을 계속합니다. 길드 명성 1을 잃습니다.');
  });

  it('keeps canonical English item and ingredient names with Korean glosses', () => {
    const reviewed = Object.values(ENCOUNTER_REVIEW_TRAVEL_CHOICE_KO).flatMap(choices => Object.values(choices)).join('\n');
    expect(reviewed).toContain('Box of Treats(간식 상자');
    expect(reviewed).toContain('Hornweed(마름풀)');
    expect(reviewed).toContain('Honeybees(꿀벌)의 Pollen(꽃가루)');
    expect(reviewed).toContain('Cranky Contraption(성질 고약한 기계장치)');
    expect(reviewed).toContain('Sketch(소묘, 무게 1/3)');
  });
});
