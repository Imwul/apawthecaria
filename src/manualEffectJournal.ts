export const formatManualEffectJournalEntry = ({
  ruleIds,
  sourcePage,
  resultSummary,
  journalNote,
  overrideReason = ''
}: {
  ruleIds: readonly string[];
  sourcePage: number;
  resultSummary: string;
  journalNote: string;
  overrideReason?: string;
}): string => {
  const summary = resultSummary.trim();
  const note = journalNote.trim();
  const override = overrideReason.trim();
  let text = `[${ruleIds.join(', ')} · p.${sourcePage}]\n${summary}`;

  if (note && note !== summary) text += `\n\n${note}`;
  if (override) text += `\n\n예외 처리 사유: ${override}`;

  return text;
};
