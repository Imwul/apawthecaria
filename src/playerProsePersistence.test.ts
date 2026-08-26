// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');

describe('player prose persistence boundaries', () => {
  it('keeps encounter, treatment, Journey, and manual Journal prose raw after nonblank validation', () => {
    expect(appSource).toContain('const resolvedJournalNote = note;');
    expect(appSource).toContain('const journalText = journalChoice;');
    expect(appSource).toContain("const journalAuthorship = journalChoice.trim() ? 'player' as const : 'system' as const;");
    expect(appSource).toContain('text: journeyReason,');
    expect(appSource).toContain('playerMemory: journeyReason,');
    expect(appSource).toContain('text: journeyStartReflection,');
    expect(appSource).toContain('text: memoir,');
    expect(appSource).toContain('title: newTitle,');
    expect(appSource).toContain('text: newText,');
    expect(appSource).toContain('semantic: createPlayerMemorySemantic(newText),');

    expect(appSource).not.toContain('const resolvedJournalNote = note.trim();');
    expect(appSource).not.toContain('text: memoir.trim(),');
    expect(appSource).not.toContain('title: newTitle.trim(),');
    expect(appSource).not.toContain('semantic: createPlayerMemorySemantic(newText.trim()),');
  });

  it('keeps Character and Patient narrative fields raw in canonical state', () => {
    expect(appSource).toContain('originJournal: draft.originJournal,');
    expect(appSource).toContain('familiarJournal: draft.familiarJournal,');
    expect(appSource).toContain('relationshipJournal: draft.relationshipJournal,');
    expect(appSource).toContain('mementoNote: draft.mementoNote');
    expect(appSource).toContain('initialRememberedNote: intakeDraft.initialNote,');
    expect(appSource).not.toContain('initialRememberedNote: intakeDraft.initialNote.trim(),');
    expect(appSource).toContain('clearCharacterJournalSource(s.bio, id)');
    expect(appSource).toContain('mergeCharacterJournals(remainingJournals, bio)');
  });
});
