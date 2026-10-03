import type { JournalEntryLike } from './journalSemantics';

export interface PatientArrivalPreview {
  impression: string;
  diagnosis: string;
}

/** Split only the application's labelled intake record; preserve authored prose. */
export const getPatientArrivalPreview = (entry: JournalEntryLike | null | undefined): PatientArrivalPreview | null => {
  if (!entry || !entry.title.startsWith('새 환자:') || entry.authorship === 'player'
    || entry.semantic?.origin === 'player' || Boolean(entry.semantic?.memory)) return null;
  const match = entry.text.match(/^첫인상:[ \t]*(.*?)\r?\n병증:[ \t]*([\s\S]*)$/);
  if (!match) return null;
  return { impression: match[1], diagnosis: match[2] };
};
