import { describe, expect, it } from 'vitest';
import { ailmentDisplayRecord } from './ailmentPresentation';
import { AILMENTS, AILMENT_BY_ID } from './rules/data/ailments';
import { PRINTED_EFFECT_BY_OWNER } from './rules/printedEffects';

const reading = (id: string) => ailmentDisplayRecord(AILMENT_BY_ID.get(`ailment-${id}`)!);

describe('source-aligned patient case sheets (rulebook pp.104–115)', () => {
  it('provides a Korean account, consequence and prescription for every canonical ailment', () => {
    expect(AILMENTS).toHaveLength(45);
    for (const row of AILMENTS) {
      const shown = ailmentDisplayRecord(row);
      expect(shown.description, row.id).toMatch(/[가-힣]/);
      expect(shown.consequence, row.id).toMatch(/[가-힣]/);
      expect(shown.tags, row.id).not.toBe('');
      expect(shown.timer).toBe(row.timer);
      expect(shown.severity).toBe(row.severity);
    }
  });
  it('shows whole alternative recipes and separate doses instead of a flattened legacy tag list', () => {
    const crestfallen = reading('crestfallen').tags;
    expect(crestfallen).toContain('(FEATHER 2 + NERVES 2 + INSTINCT 2) 또는');
    expect(crestfallen).toContain('FEATHER 2 + JOY 2');
    expect(crestfallen).toContain('밝은 색의 식물');
    expect(reading('safety-stench').tags).toBe('SENSES 1 + (NERVES 1 또는 INSTINCT 1)');
    expect(reading('broken-beaks-and-thinning-fangs').tags).toBe('PAIN 3 + PAIN 2 + STOMACH 3');
    expect(reading('wake').tags).toContain('각각 별도의 요구치');
  });
  it('retains the printed seasonal map outcomes rather than invented rewards', () => {
    const titan = reading('titan-touched');
    expect(titan.outcome).toContain('타이머가 0이 되기 전에');
    expect(titan.outcome).toContain('경로 2개');
    expect(titan.consequence).toContain('다음 계절이 끝날 때까지 모든 티탄 영약재의 희귀도가 1');
    expect(titan.outcome).not.toContain('난이도');
    expect(reading('snail-ails').consequence).toContain('다음 계절이 될 때까지');
    expect(reading('wingbreak').consequence).toContain('이번 계절이 끝날 때까지');
    expect(reading('wingbreak').consequence).toContain('희귀도를 2');
    expect(reading('trowel-trouble').outcome).toContain('약효 강도 3');
    expect(reading('trowel-trouble').outcome).toContain('새 경로');
    expect(reading('waen-drops').consequence).not.toContain('무게');
    for (const id of ['titan-touched', 'snail-ails', 'wingbreak', 'trowel-trouble']) {
      const shown = reading(id);
      const printed = PRINTED_EFFECT_BY_OWNER.get(`ailment-${id}`)!;
      expect(printed.triggerText['treatment-failure']).toContain(shown.consequence);
    }
  });
  it('makes diagnosis options, foul branches and return-patient obligations explicit', () => {
    expect(reading('seasonshift').description).toContain('타이머를 2');
    expect(reading('smokesnout').description).toContain('타이머를 2 줄이고 길드 명예 4');
    expect(reading('the-runs').outcome).toContain('[FOUL 1] 이하');
    expect(reading('the-runs').outcome).toContain('[FOUL 2] 이상');
    expect(reading('the-runs').consequence).toContain('원문에 없어');
    expect(reading('tickbitten-twice-shy').consequence).toContain('타이머가 동시에 흐르는');
    expect(reading('bite-the-hand-that-cures').description).toContain('기본 희귀도 8');
    expect(reading('bite-the-hand-that-cures').outcome).toContain('길드 명예는 잃지 않습니다');
  });
});
