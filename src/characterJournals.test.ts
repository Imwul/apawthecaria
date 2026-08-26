import { describe, expect, it } from 'vitest';
import {
  CHARACTER_JOURNAL_IDS,
  characterJournalsFromBio,
  clearCharacterJournalSource,
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
    expect(rows[0].text).toBe('그 빚을 갚으러 떠났다.');
    expect(rows[0].semantic).toMatchObject({ category: 'player-memory', memory: '그 빚을 갚으러 떠났다.' });
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
      text: '새로 적은 출발.',
      semantic: { category: 'player-memory', memory: '새로 적은 출발.' }
    });
  });

  it('uses trimming only to detect an empty entry and preserves authored spacing and line breaks', () => {
    const memory = '  첫 문장\n\n둘째 문장  ';
    const rows = characterJournalsFromBio({
      originJournal: memory,
      mementoNote: ' \n\t ',
      relationshipJournal: '\n  조용히 곁을 지킨다.\n'
    }, 40);

    expect(rows.map(row => row.id)).toEqual([
      CHARACTER_JOURNAL_IDS.origin,
      CHARACTER_JOURNAL_IDS.relationship
    ]);
    expect(rows[0]).toMatchObject({ text: memory, semantic: { memory } });
    expect(rows[1]).toMatchObject({
      text: '\n  조용히 곁을 지킨다.\n',
      semantic: { memory: '\n  조용히 곁을 지킨다.\n' }
    });
  });

  it('clears the canonical bio source so a deleted Character journal does not return after reload', () => {
    const source = {
      originJournal: '떠난 이유',
      mementoNote: '단추의 기억',
      familiarJournal: '첫 만남'
    };
    const existing = characterJournalsFromBio(source, 1);
    const cleared = clearCharacterJournalSource(source, CHARACTER_JOURNAL_IDS.origin);
    const afterDelete = mergeCharacterJournals(
      existing.filter(row => row.id !== CHARACTER_JOURNAL_IDS.origin),
      cleared,
      2
    );
    const afterReload = mergeCharacterJournals(
      JSON.parse(JSON.stringify(afterDelete)),
      JSON.parse(JSON.stringify(cleared)),
      3
    );

    expect(cleared.originJournal).toBe('');
    expect(afterReload.some(row => row.id === CHARACTER_JOURNAL_IDS.origin)).toBe(false);
    expect(afterReload.some(row => row.id === CHARACTER_JOURNAL_IDS.memento)).toBe(true);
  });
});
