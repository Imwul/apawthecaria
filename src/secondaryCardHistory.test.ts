import { describe, expect, it } from 'vitest';
import {
  appendSecondaryCard,
  clearSecondaryCards,
  inferExplicitSecondaryCardCount,
  readSecondaryCardHistory,
  removeSecondaryCardAt
} from './secondaryCardHistory';
import { migrateSavedRulesState } from './rules/migrations';
import { CURRENT_SCHEMA_VERSION } from './rules/state';

describe('secondary encounter card history', () => {
  it.each([
    ['Draw two cards, one for yourself and one for the deer.', 2],
    ['Draw three cards; one for you and two for the wolf.', 3],
    ['Draw a card for you and two cards for them. The highest single card wins.', 3],
    ['Draw one card for yourself and one for them. Highest card wins.', 2],
    ['Draw one card for yourself and three for the other beasts.', 4],
    ['Draw one card for yourself and one for the Not-Cat. Lower: draw another card.', 2],
    ['Draw a card for you and a card for the robber.', 2],
    ['Draw one card each; whoever is highest escapes.', 2],
    ['Draw 4 cards and total their values.', 4],
    ['자신과 사슴을 위해 카드를 한 장씩 뽑습니다. 무기가 있으면 사슴 카드를 더 뽑습니다.', 2],
    ['자신은 카드 1장, 왜가리는 카드 2장을 뽑습니다. 조건에 따라 카드 1장을 더 뽑습니다.', 3],
    ['자신을 위해 카드 1장, 해적을 위해 카드 2장을 뽑아 합계를 겨룹니다.', 3],
    ['카드 3장을 목표로 놓고, 맞는 카드를 뽑을 때마다 선물을 찾습니다.', 3]
  ])('reads the finite minimum in %s', (printedText, expected) => {
    expect(inferExplicitSecondaryCardCount(printedText)).toBe(expected);
  });

  it.each([
    'Draw from the deck and follow the printed outcome.',
    'Draw another card if you lose.',
    'Keep drawing until you win.'
  ])('does not invent a forced count for conditional text: %s', printedText => {
    expect(inferExplicitSecondaryCardCount(printedText)).toBeNull();
  });

  it('upgrades a legacy single card into an ordered history without losing it', () => {
    const next = appendSecondaryCard(
      { secondaryCard: { suit: '♥', value: 4 } },
      { suit: '♠', value: 12 },
      'scrap'
    );

    expect(next.secondaryCards).toEqual([
      { suit: '♥', value: 4 },
      { suit: '♠', value: 12 }
    ]);
    expect(next.secondaryCard).toEqual({ suit: '♠', value: 12 });
  });

  it('keeps the latest remaining card as the legacy single-card calculation value', () => {
    const next = removeSecondaryCardAt({
      secondaryCards: [
        { suit: '♥', value: 2 },
        { suit: '♦', value: 8 },
        { suit: '♣', value: 11 }
      ],
      secondaryCard: { suit: '♣', value: 11 },
      secondaryCardChoiceId: 'fight'
    }, 2, 'fight');

    expect(next.secondaryCards).toHaveLength(2);
    expect(next.secondaryCard).toEqual({ suit: '♦', value: 8 });
  });

  it('does not reuse cards drawn for a different encounter choice', () => {
    const next = appendSecondaryCard({
      secondaryCards: [{ suit: '♥', value: 9 }],
      secondaryCard: { suit: '♥', value: 9 },
      secondaryCardChoiceId: 'flee'
    }, { suit: '♣', value: 5 }, 'fight');

    expect(next.secondaryCards).toEqual([{ suit: '♣', value: 5 }]);
    expect(next.secondaryCardChoiceId).toBe('fight');
  });

  it('preserves an explicit clear instead of resurrecting the legacy field', () => {
    const cleared = { ...clearSecondaryCards('fight'), secondaryCard: { suit: '♠', value: 13 } };
    expect(readSecondaryCardHistory(cleared)).toEqual([]);
  });

  it('drops malformed cards instead of making up replacement draws', () => {
    expect(readSecondaryCardHistory({
      secondaryCards: [
        { suit: '♥', value: 3 },
        { suit: '?', value: 7 },
        { suit: '♠', value: 20 }
      ]
    })).toEqual([{ suit: '♥', value: 3 }]);
  });

  it('round-trips ordered Travel and Foraging histories through save normalization', () => {
    const saved = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      pendingEncounter: {
        transactionId: 'travel-cards',
        encounterId: 'travel-test',
        encounter: { id: 'travel-test', title: 'Test', prompt: 'Draw cards.', sourcePage: 1 },
        phase: 'pending',
        unresolvedEffectCodes: [],
        card: { suit: '♥', value: 1 },
        selectedChoiceId: 'fight',
        secondaryCardChoiceId: 'fight',
        secondaryCard: { suit: '♠', value: 9 },
        secondaryCards: [{ suit: '♦', value: 4 }, { suit: '♠', value: 9 }]
      },
      pendingForaging: {
        transactionId: 'forage-cards',
        region: 'Forest',
        locationRelation: 'current',
        card: { suit: '♣', value: 3 },
        timerCostAfterEncounter: 1,
        encounterId: 'forage-test',
        phase: 'encounter',
        selectedChoiceId: 'chase',
        secondaryCardChoiceId: 'chase',
        secondaryCards: [{ suit: '♥', value: 8 }, { suit: '♣', value: 2 }]
      }
    };

    const migrated = migrateSavedRulesState(saved);
    const reloaded = migrateSavedRulesState(JSON.parse(JSON.stringify(migrated)));
    expect(reloaded.pendingEncounter).toMatchObject({
      secondaryCard: { suit: '♠', value: 9 },
      secondaryCards: [{ suit: '♦', value: 4 }, { suit: '♠', value: 9 }],
      secondaryCardChoiceId: 'fight'
    });
    expect(reloaded.pendingForaging).toMatchObject({
      secondaryCard: { suit: '♣', value: 2 },
      secondaryCards: [{ suit: '♥', value: 8 }, { suit: '♣', value: 2 }],
      secondaryCardChoiceId: 'chase'
    });
    expect(reloaded).toEqual(migrated);
  });

  it('recovers a legacy single draw and clears history bound to a stale branch', () => {
    const legacy = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      pendingEncounter: {
        transactionId: 'legacy-card',
        encounterId: 'travel-test',
        encounter: { id: 'travel-test', title: 'Test', prompt: 'Draw.', sourcePage: 1 },
        phase: 'pending', unresolvedEffectCodes: [], card: { suit: '♥', value: 1 },
        secondaryCard: { suit: '♦', value: 7 }
      }
    });
    expect(legacy.pendingEncounter).toMatchObject({
      secondaryCard: { suit: '♦', value: 7 },
      secondaryCards: [{ suit: '♦', value: 7 }]
    });

    const stale = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      pendingEncounter: {
        transactionId: 'stale-card',
        encounterId: 'travel-test',
        encounter: { id: 'travel-test', title: 'Test', prompt: 'Draw.', sourcePage: 1 },
        phase: 'pending', unresolvedEffectCodes: [], card: { suit: '♥', value: 1 },
        selectedChoiceId: 'leave', secondaryCardChoiceId: 'fight',
        secondaryCards: [{ suit: '♠', value: 12 }], secondaryCard: { suit: '♠', value: 12 }
      }
    });
    expect(stale.pendingEncounter.secondaryCards).toEqual([]);
    expect(stale.pendingEncounter.secondaryCard).toBeUndefined();
  });
});
