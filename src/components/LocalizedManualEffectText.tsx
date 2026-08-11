import {
  localizeManualEffectOption,
  localizeManualJournalText,
  localizeManualJournalTitle,
  localizeManualEffectText,
  localizeManualEffectValue
} from '../localization/manualEffectKo';

export default function LocalizedManualEffectText({
  kind = 'value',
  summary = '',
  text,
  maxLength
}: {
  kind?: 'value' | 'text' | 'option' | 'journal-title' | 'journal-text';
  summary?: string;
  text: string;
  maxLength?: number;
}) {
  const localized = kind === 'journal-title'
    ? localizeManualJournalTitle(text)
    : kind === 'journal-text'
      ? localizeManualJournalText(text)
      : kind === 'text'
    ? localizeManualEffectText(summary, text)
    : kind === 'option'
      ? localizeManualEffectOption(text)
      : localizeManualEffectValue(text);

  return <>{typeof maxLength === 'number' ? localized.slice(0, maxLength) : localized}</>;
}
