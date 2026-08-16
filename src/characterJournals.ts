export type CharacterJournalSource = {
  originName?: string;
  originJournal?: string;
  mementoNote?: string;
  familiarJournal?: string;
  familiarRelation?: string;
  relationshipJournal?: string;
};

export type CharacterJournalEntry = {
  id: string;
  title: string;
  text: string;
  timestamp: number;
  source: 'character-origin';
};

export const CHARACTER_JOURNAL_IDS = {
  origin: 'character:origin',
  memento: 'character:memento',
  familiar: 'character:familiar',
  relationship: 'character:relationship'
} as const;

const CHARACTER_TITLES: Record<string, string> = {
  [CHARACTER_JOURNAL_IDS.origin]: '약제사의 출발 계기',
  [CHARACTER_JOURNAL_IDS.memento]: '첫 여정의 기념품',
  [CHARACTER_JOURNAL_IDS.familiar]: '길동무와의 첫 만남',
  [CHARACTER_JOURNAL_IDS.relationship]: '길동무와의 관계'
};

const LEGACY_ID_PREFIX: Record<string, string> = {
  [CHARACTER_JOURNAL_IDS.origin]: 'origin_',
  [CHARACTER_JOURNAL_IDS.memento]: 'memento_',
  [CHARACTER_JOURNAL_IDS.familiar]: 'familiar_',
  [CHARACTER_JOURNAL_IDS.relationship]: 'relation_'
};

export const isCharacterJournalId = (id: string): boolean =>
  Object.values(CHARACTER_JOURNAL_IDS).includes(id as typeof CHARACTER_JOURNAL_IDS[keyof typeof CHARACTER_JOURNAL_IDS])
  || id.startsWith('origin_')
  || id.startsWith('memento_')
  || id.startsWith('familiar_')
  || id.startsWith('relation_');

const textFor = (source: CharacterJournalSource, id: string): string => {
  if (id === CHARACTER_JOURNAL_IDS.origin) {
    const body = (source.originJournal || '').trim();
    if (!body) return '';
    return source.originName ? `${source.originName}\n${body}` : body;
  }
  if (id === CHARACTER_JOURNAL_IDS.memento) return (source.mementoNote || '').trim();
  if (id === CHARACTER_JOURNAL_IDS.familiar) return (source.familiarJournal || '').trim();
  const relation = (source.relationshipJournal || '').trim();
  if (!relation) return '';
  return source.familiarRelation ? `${source.familiarRelation}\n${relation}` : relation;
};

export const characterJournalsFromBio = (
  source: CharacterJournalSource,
  timestamp = Date.now()
): CharacterJournalEntry[] =>
  Object.values(CHARACTER_JOURNAL_IDS).flatMap(id => {
    const text = textFor(source, id);
    if (!text) return [];
    return [{ id, title: CHARACTER_TITLES[id], text, timestamp, source: 'character-origin' as const }];
  });

export const mergeCharacterJournals = <T extends { id: string; title: string; text: string; timestamp: number }>(
  journals: readonly T[],
  source: CharacterJournalSource,
  timestamp = Date.now()
): T[] => {
  const incoming = characterJournalsFromBio(source, timestamp);
  const used = new Set<string>();
  const next = journals.flatMap(entry => {
    const match = incoming.find(row =>
      row.id === entry.id
      || entry.id.startsWith(LEGACY_ID_PREFIX[row.id] || '\0')
      || entry.title === row.title
    );
    if (!match) return [entry];
    used.add(match.id);
    return [{ ...entry, id: match.id, title: match.title, text: match.text }];
  });
  incoming.forEach(row => {
    if (!used.has(row.id)) next.unshift({ id: row.id, title: row.title, text: row.text, timestamp: row.timestamp } as T);
  });
  return next;
};
