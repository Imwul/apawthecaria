import { describe, expect, it } from 'vitest';
import {
  CONSULTATION_CATEGORY_LABELS,
  formatRulebookDetailValue,
  RULEBOOK_KIND_LABELS,
  RULEBOOK_STATUS_LABELS
} from './rulebookPresentation';

describe('rulebook presentation copy', () => {
  it('covers reference kinds and statuses that previously leaked internal values', () => {
    expect(RULEBOOK_KIND_LABELS['printed-effect']).toBe('원문 효과');
    expect(RULEBOOK_KIND_LABELS.companion).toBe('동료');
    expect(RULEBOOK_KIND_LABELS.source).toBe('원문 페이지');
    expect(RULEBOOK_STATUS_LABELS.canonical).toBe('정식 규칙');
    expect(RULEBOOK_STATUS_LABELS['reference-only']).toBe('원문 참고');
  });

  it('localizes common enum, availability, preparation, and tool values', () => {
    expect(formatRulebookDetailValue('Type', 'PLANT')).toBe('식물');
    expect(formatRulebookDetailValue('Region', 'Bog: Common / Loch: Unavailable')).toBe('늪지: 흔함 · 호수: 없음');
    expect(formatRulebookDetailValue('Preparation', 'GROUND, CRUSHED')).toBe('갈기 · 부수기');
    expect(formatRulebookDetailValue('Required Tool', 'camp-kettle, paws')).toBe('낡은 캠프 주전자 · 앞발/발톱');
    expect(formatRulebookDetailValue('Weight', String(2 / 3))).toBe('2/3');
  });

  it('keeps stored consultation values while presenting Korean labels', () => {
    expect(CONSULTATION_CATEGORY_LABELS['rule wording']).toBe('규칙 문구');
    expect(CONSULTATION_CATEGORY_LABELS.terminology).toBe('용어');
  });
});
