import { describe, expect, it } from 'vitest';
import { buildEncounterJournalText, isActivityJournalEntry, presentEncounterJournal } from './encounterJournal';

describe('encounter journal presentation', () => {
  it('keeps the player memory ahead of the printed context', () => {
    const text = buildEncounterJournalText({
      printedText: 'Printed encounter prompt',
      note: '검사관이 조용히 길을 열어 주었다.'
    });
    expect(text.startsWith('나의 기록: 검사관이 조용히 길을 열어 주었다.')).toBe(true);
    expect(presentEncounterJournal('여정 조우: Inspection', text)).toEqual({
      isEncounter: true,
      memory: '검사관이 조용히 길을 열어 주었다.',
      context: 'Printed encounter prompt',
      metadata: {}
    });
  });

  it('keeps canonical encounter metadata outside the player memory', () => {
    const text = buildEncounterJournalText({
      printedText: 'Printed encounter prompt',
      note: '짧은 기억',
      location: 'Windtop',
      season: 'Spring',
      outcome: 'Waved on past',
      result: '추가로 바뀐 수치 없음'
    });
    expect(presentEncounterJournal('여정 조우: Inspection', text).metadata).toEqual({
      location: 'Windtop',
      season: 'Spring',
      outcome: 'Waved on past',
      result: '추가로 바뀐 수치 없음'
    });
    expect(presentEncounterJournal('여정 조우: Inspection', text).memory).toBe('짧은 기억');
  });

  it('represents an intentionally blank note without inventing prose', () => {
    const text = buildEncounterJournalText({ printedText: 'Printed encounter prompt', note: '  ' });
    expect(presentEncounterJournal('여정 조우: Inspection', text).memory).toBe('별도 메모 없이 조우를 마쳤습니다.');
  });

  it('recovers legacy encounter notes and removes the pasted page marker', () => {
    expect(presentEncounterJournal(
      '여정 조우: Inspection',
      '[p.204] Printed encounter prompt\n\n나의 선택: 오래된 기록'
    )).toEqual({
      isEncounter: true,
      memory: '오래된 기록',
      context: 'Printed encounter prompt',
      metadata: {}
    });
  });

  it('separates engine activity from narrative journal entries', () => {
    expect(isActivityJournalEntry('Journey started')).toBe(true);
    expect(isActivityJournalEntry('여정 started')).toBe(true);
    expect(isActivityJournalEntry('Guild Services ready for 여정')).toBe(true);
    expect(isActivityJournalEntry('이동: Windtop')).toBe(true);
    expect(isActivityJournalEntry('여정 조우: Inspection')).toBe(false);
    expect(isActivityJournalEntry('여정 출발 기록: Odoak')).toBe(false);
  });
});
