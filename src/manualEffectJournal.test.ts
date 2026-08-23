import { describe, expect, it } from 'vitest';
import { formatManualEffectJournalEntry } from './manualEffectJournal';

describe('manual effect journal formatting', () => {
  it('renders a fallback journal note only once when it matches the result summary', () => {
    const text = formatManualEffectJournalEntry({
      ruleIds: ['TRAVEL-009'],
      sourcePage: 162,
      resultSummary: '후속 카드를 확인해 타이머를 1 줄였다.',
      journalNote: '  후속 카드를 확인해 타이머를 1 줄였다.  '
    });

    expect(text).toBe('[TRAVEL-009 · p.162]\n후속 카드를 확인해 타이머를 1 줄였다.');
  });

  it('keeps a distinct optional journal note and override reason', () => {
    const text = formatManualEffectJournalEntry({
      ruleIds: ['FORAGE-006'],
      sourcePage: 174,
      resultSummary: '채집 결과를 적용했다.',
      journalNote: '낯선 향기를 따라간 기억을 남겼다.',
      overrideReason: '테이블 합의로 다른 결과를 적용했다.'
    });

    expect(text).toBe(
      '[FORAGE-006 · p.174]\n채집 결과를 적용했다.\n\n'
      + '낯선 향기를 따라간 기억을 남겼다.\n\n'
      + '예외 처리 사유: 테이블 합의로 다른 결과를 적용했다.'
    );
  });
});
