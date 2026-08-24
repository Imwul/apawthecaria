import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '../rules/data/encounters';
import {
  ENCOUNTER_REVIEW_CHOICE_KO,
  ENCOUNTER_REVIEW_CONTEXT_KO
} from './encounterReviewKo';
import {
  localizeEncounterDisplayText,
  localizeManualEffectOption
} from './manualEffectKo';

describe('combined encounter review layer', () => {
  it('covers every canonical encounter context exactly once', () => {
    const canonicalIds = ENCOUNTERS.map(encounter => encounter.id).sort();
    const reviewedIds = Object.keys(ENCOUNTER_REVIEW_CONTEXT_KO).sort();

    expect(reviewedIds).toEqual(canonicalIds);
    expect(reviewedIds).toHaveLength(313);
  });

  it('covers every canonical selectable result and no stale result ids', () => {
    const missing: string[] = [];
    const stale: string[] = [];

    for (const encounter of ENCOUNTERS) {
      const reviewed = ENCOUNTER_REVIEW_CHOICE_KO[encounter.id] || {};
      for (const choice of encounter.choices) {
        if (choice.id === 'continue') continue;
        if (!reviewed[choice.id]) missing.push(`${encounter.id}/${choice.id}`);
      }
      for (const choiceId of Object.keys(reviewed)) {
        if (!encounter.choices.some(choice => choice.id === choiceId)) {
          stale.push(`${encounter.id}/${choiceId}`);
        }
      }
    }

    expect(missing).toEqual([]);
    expect(stale).toEqual([]);
  });

  it('is the copy actually rendered by the encounter popup', () => {
    const contextMismatches = ENCOUNTERS.flatMap(encounter => {
      const actual = localizeEncounterDisplayText(encounter.title, encounter.prompt);
      const expected = ENCOUNTER_REVIEW_CONTEXT_KO[encounter.id];
      return actual === expected ? [] : [{ encounterId: encounter.id, expected, actual }];
    });
    const choiceMismatches = ENCOUNTERS.flatMap(encounter => encounter.choices.flatMap(choice => {
      if (choice.id === 'continue') return [];
      const actual = localizeManualEffectOption(choice.label);
      const expected = ENCOUNTER_REVIEW_CHOICE_KO[encounter.id]?.[choice.id];
      return actual === expected ? [] : [{ encounterId: encounter.id, choiceId: choice.id, expected, actual }];
    }));

    expect(contextMismatches).toEqual([]);
    expect(choiceMismatches).toEqual([]);
  });

  it('preserves every printed suit symbol and bracketed rule tag in reviewed choices', () => {
    const mismatches: Array<{ key: string; source: string[]; reviewed: string[] }> = [];
    const tokens = (value: string): string[] => [
      ...(value.match(/[♥♦♣♠]/g) || []),
      ...(value.match(/\[[A-Z]+(?:\s+\d+(?:\/\d+)?)?\]/g) || [])
    ].filter(token => token !== '[TAG]').sort();

    for (const encounter of ENCOUNTERS) {
      for (const choice of encounter.choices) {
        if (choice.id === 'continue') continue;
        const source = tokens(choice.label);
        const reviewed = tokens(ENCOUNTER_REVIEW_CHOICE_KO[encounter.id]?.[choice.id] || '');
        // Some parser-generated choice labels contain only part of the
        // printed procedure. A reviewed parent choice may therefore add the
        // suit outcomes that used to live in removed child choices. Require
        // every token already present on the canonical choice to survive,
        // while the hierarchy-specific tests verify those added outcomes.
        const reviewedCounts = reviewed.reduce<Record<string, number>>((counts, token) => {
          counts[token] = (counts[token] || 0) + 1;
          return counts;
        }, {});
        const sourceCounts = source.reduce<Record<string, number>>((counts, token) => {
          counts[token] = (counts[token] || 0) + 1;
          return counts;
        }, {});
        const preservesSource = Object.entries(sourceCounts)
          .every(([token, count]) => (reviewedCounts[token] || 0) >= count);
        if (!preservesSource) {
          mismatches.push({ key: `${encounter.id}/${choice.id}`, source, reviewed });
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('still localizes generic continue actions outside the reviewed choice maps', () => {
    const unresolved = ENCOUNTERS.flatMap(encounter => encounter.choices.flatMap(choice => {
      if (choice.id !== 'continue') return [];
      const actual = localizeManualEffectOption(choice.label);
      return /\bcontinue\b/i.test(actual) ? [`${encounter.id}: ${actual}`] : [];
    }));

    expect(unresolved).toEqual([]);
  });
});
