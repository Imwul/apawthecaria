import type { CardSuit } from './types';

export type RuleCard = number | { value: number; suit?: CardSuit | string } | { val: number; suit?: CardSuit | string };
export type CardContext = 'general' | 'barter' | 'forage' | 'travel' | 'delve' | 'table';
export type TableId = 'travel' | 'foraging' | 'social' | 'character' | 'journey-goal' | 'ailment';

const rawCardValue = (card: RuleCard): number => {
  if (typeof card === 'number') return card;
  return 'value' in card ? card.value : card.val;
};
export const getRuleCardValue = (card: RuleCard, _context: CardContext = 'general'): number => {
  const raw = rawCardValue(card);
  if (!Number.isInteger(raw) || raw < 1 || raw > 13) {
    throw new RangeError(`Card value must be an integer from 1 to 13; received ${raw}`);
  }
  return raw >= 12 ? 12 : raw;
};

export const getTableLookupKey = (card: RuleCard, tableId: TableId): string => {
  const raw = rawCardValue(card);
  const value = getRuleCardValue(card, 'table');

  if (tableId === 'social') {
    if (typeof card === 'number' || !card.suit) throw new Error('Social encounters require a card suit.');
    return card.suit;
  }
  if (tableId === 'travel') {
    if (raw <= 2) return 'A&2';
    if (raw <= 4) return '3&4';
    if (raw <= 6) return '5&6';
    if (raw <= 8) return '7&8';
    if (raw <= 10) return '9&10';
    if (raw === 11) return 'J';
    return 'M';
  }
  if (value === 1) return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'M';
  return String(value);
};

export const getRuleCardLabel = (card: RuleCard): string => {
  const raw = rawCardValue(card);
  if (raw === 1) return 'A';
  if (raw === 11) return 'J';
  if (raw >= 12) return 'M';
  return String(raw);
};
