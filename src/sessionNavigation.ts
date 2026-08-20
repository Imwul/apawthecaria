export const JOURNAL_TABS = [
  'play',
  'ailments',
  'reagents',
  'bio',
  'map',
  'almanack',
  'patientArchive',
  'livingArchive',
  'journals'
] as const;

export type JournalTab = typeof JOURNAL_TABS[number];

const JOURNAL_TAB_SET = new Set<string>(JOURNAL_TABS);

export const journalTabFromHash = (hash: string): JournalTab => {
  const value = hash.replace(/^#\/?/, '').split(/[?&]/, 1)[0];
  return JOURNAL_TAB_SET.has(value) ? value as JournalTab : 'play';
};

export const journalHash = (tab: JournalTab) => `#${tab}`;

export const journalHistoryState = (
  tab: JournalTab,
  current: unknown,
  overlay?: 'rulebook'
) => ({
  ...(current && typeof current === 'object' ? current : {}),
  apawthecaria: true,
  journalTab: tab,
  ...(overlay ? { overlay } : { overlay: undefined })
});

export const isRulebookHistoryState = (value: unknown) => Boolean(
  value
  && typeof value === 'object'
  && (value as { apawthecaria?: unknown }).apawthecaria === true
  && (value as { overlay?: unknown }).overlay === 'rulebook'
);
