/** Plain card helpers for the opening spread (kept apart so the component file only exports components). */
export type SpreadPlayingCard = { suit: string; value: number };

export const SPREAD_SUITS = ['♥', '♦', '♣', '♠'] as const;
export const SPREAD_VALUES = [
  [1, 'A'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [7, '7'],
  [8, '8'], [9, '9'], [10, '10'], [11, 'J'], [12, 'Q'], [13, 'K']
] as const;

export const rankLabel = (value: number) => SPREAD_VALUES.find(([v]) => v === value)?.[1] ?? String(value);

export const randomSpreadCard = (): SpreadPlayingCard => ({
  suit: SPREAD_SUITS[Math.floor(Math.random() * SPREAD_SUITS.length)],
  value: Math.floor(Math.random() * 13) + 1
});

export const isRedSuit = (suit: string) => suit === '♥' || suit === '♦';

