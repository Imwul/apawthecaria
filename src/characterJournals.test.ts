import { describe, expect, it } from 'vitest';
import {
  CHARACTER_JOURNAL_IDS,
  characterJournalsFromBio,
  isCharacterJournalId,
  mergeCharacterJournals
} from './characterJournals';

describe('character creation journals', () => {
  it('turns the short creation notes into journal entries', () => {
    const rows = characterJournalsFromBio({
      originName: '길 위의 빚',
      originJournal: '그 빚을 갚으러 떠났다.',
      mementoNote: '어미가 준 단추.',
      familiarJournal: '빗속에서 만났다.',
      familiarRelation: '깊은 동반자',
      relationshipJournal: '서로의 짐을 나눠 든다.'
    }, 10);
    expect(rows.map(row => row.id)).toEqual([
      CHARACTER_JOURNAL_IDS.origin,
      CHARACTER_JOURNAL_IDS.memento,
      CHARACTER_JOURNAL_IDS.familiar,
      CHARACTER_JOURNAL_IDS.relationship
    ]);
    expect(rows[0].text).toContain('그 빚을 갚으러 떠났다.');
    expect(rows[0].title).toBe('약제사의 출발 계기');
  });

  it('upserts into an existing journal list without losing later notes', () => {
    const merged = mergeCharacterJournals([
      { id: 'later', title: 'Odoak 도착', text: '비가 왔다.', timestamp: 20 },
      { id: 'origin_old', title: '약제사의 출발 계기', text: '옛 문장', timestamp: 1 }
    ], { originName: '길 위의 빚', originJournal: '새로 적은 출발.' }, 30);
    expect(merged[0]).toMatchObject({ id: 'later', title: 'Odoak 도착' });
    expect(merged.find(row => isCharacterJournalId(row.id))).toMatchObject({
      id: CHARACTER_JOURNAL_IDS.origin,
      text: '길 위의 빚\n새로 적은 출발.'
    });
  });
});
