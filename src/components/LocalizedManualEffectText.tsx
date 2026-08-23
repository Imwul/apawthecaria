import {
  localizeManualEffectOption,
  localizeEncounterTitle,
  localizeManualJournalText,
  localizeManualJournalTitle,
  localizeEncounterDisplayText,
  localizeManualEffectText,
  localizeManualEffectValue
} from '../localization/manualEffectKo';

export default function LocalizedManualEffectText({
  kind = 'value',
  summary = '',
  text,
  maxLength,
  encounterId,
  choiceId
}: {
  kind?: 'value' | 'text' | 'encounter-title' | 'encounter' | 'option' | 'journal-title' | 'journal-text';
  summary?: string;
  text: string;
  maxLength?: number;
  encounterId?: string;
  choiceId?: string;
}) {
  const localized = kind === 'journal-title'
    ? localizeManualJournalTitle(text)
    : kind === 'journal-text'
      ? localizeManualJournalText(text)
    : kind === 'encounter-title'
      ? localizeEncounterTitle(text, encounterId)
    : kind === 'text'
    ? localizeManualEffectText(summary, text)
    : kind === 'encounter'
      ? localizeEncounterDisplayText(summary, text, encounterId)
    : kind === 'option'
      ? localizeManualEffectOption(text, encounterId, choiceId)
      : localizeManualEffectValue(text);

  return <>{typeof maxLength === 'number' ? localized.slice(0, maxLength) : localized}</>;
}
