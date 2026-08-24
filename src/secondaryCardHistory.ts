export interface SecondaryDrawCard {
  suit: string;
  value: number;
}

export interface SecondaryCardState {
  secondaryCard?: SecondaryDrawCard | null;
  secondaryCards?: unknown;
  secondaryCardChoiceId?: unknown;
}

const CARD_SUITS = new Set(['♥', '♦', '♣', '♠']);
const CARD_NUMBER_WORDS: Readonly<Record<string, number>> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4
};
const KOREAN_CARD_NUMBER_WORDS: Readonly<Record<string, number>> = {
  '한': 1,
  '두': 2,
  '세': 3,
  '네': 4
};

const parsedCardCount = (value: string): number | null => {
  const normalized = value.toLowerCase();
  if (/^\d+$/.test(normalized)) {
    const count = Number(normalized);
    return Number.isInteger(count) && count > 0 && count <= 12 ? count : null;
  }
  return CARD_NUMBER_WORDS[normalized] || null;
};

/**
 * Returns a minimum only when the printed sentence states a finite card count.
 * Conditional later draws ("draw another card if…") intentionally do not get
 * folded into that minimum because the app cannot decide whether they occur.
 */
export const inferExplicitSecondaryCardCount = (printedText: string): number | null => {
  const text = printedText.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const firstKoreanDraw = text.search(/뽑/);
  if (firstKoreanDraw >= 0) {
    const immediateInstruction = text.slice(0, firstKoreanDraw);
    if (/카드(?:를)?\s*(?:한|1)\s*장씩/i.test(immediateInstruction)) return 2;
    const counts = [...immediateInstruction.matchAll(/카드(?:를)?\s*(\d+|한|두|세|네)\s*장/gi)]
      .map(match => /^\d+$/.test(match[1]) ? Number(match[1]) : KOREAN_CARD_NUMBER_WORDS[match[1]])
      .filter(count => Number.isInteger(count) && count > 0 && count <= 12);
    if (counts.length > 0) return counts.reduce((sum, count) => sum + count, 0);
  }
  const countWord = '(a|an|one|two|three|four|\\d+)';
  const paired = text.match(new RegExp(
    `\\bdraw\\s+${countWord}\\s+cards?\\s+for\\b[^.;!?]{0,96}?\\band\\s+${countWord}(?:\\s+cards?)?\\s+for\\b`,
    'i'
  ));
  if (paired) {
    const first = parsedCardCount(paired[1]);
    const second = parsedCardCount(paired[2]);
    if (first && second) return first + second;
  }
  if (/\bdraw\s+(?:a|one)\s+card\s+each\b/i.test(text)) return 2;
  const explicit = text.match(new RegExp(`\\bdraw\\s+${countWord}\\s+cards?\\b`, 'i'));
  return explicit ? parsedCardCount(explicit[1]) : null;
};

export const normalizeSecondaryDrawCard = (value: unknown): SecondaryDrawCard | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const cardValue = Number(row.value);
  const suit = typeof row.suit === 'string' ? row.suit : '';
  if (!Number.isInteger(cardValue) || cardValue < 1 || cardValue > 13 || !CARD_SUITS.has(suit)) return null;
  return { suit, value: cardValue };
};

/**
 * Reads the additive draw history while keeping pre-history saves compatible.
 * An explicitly saved empty array means the player cleared the history, so it
 * must not fall back to the legacy single-card field.
 */
export const readSecondaryCardHistory = (state: SecondaryCardState | null | undefined): SecondaryDrawCard[] => {
  if (!state) return [];
  if (Array.isArray(state.secondaryCards)) {
    return state.secondaryCards
      .map(normalizeSecondaryDrawCard)
      .filter((card): card is SecondaryDrawCard => Boolean(card));
  }
  const legacyCard = normalizeSecondaryDrawCard(state.secondaryCard);
  return legacyCard ? [legacyCard] : [];
};

const normalizedChoiceId = (choiceId: unknown): string | undefined =>
  typeof choiceId === 'string' && choiceId.trim() ? choiceId.trim() : undefined;

export const appendSecondaryCard = (
  state: SecondaryCardState | null | undefined,
  card: SecondaryDrawCard,
  choiceId?: string
) => {
  const normalizedCard = normalizeSecondaryDrawCard(card);
  if (!normalizedCard) return clearSecondaryCards(choiceId);
  const existingChoiceId = normalizedChoiceId(state?.secondaryCardChoiceId);
  const nextChoiceId = normalizedChoiceId(choiceId);
  const canReuseHistory = !existingChoiceId || !nextChoiceId || existingChoiceId === nextChoiceId;
  const secondaryCards = [...(canReuseHistory ? readSecondaryCardHistory(state) : []), normalizedCard];
  return {
    secondaryCard: normalizedCard,
    secondaryCards,
    secondaryCardChoiceId: nextChoiceId
  };
};

export const removeSecondaryCardAt = (
  state: SecondaryCardState | null | undefined,
  index: number,
  choiceId?: string
) => {
  const secondaryCards = readSecondaryCardHistory(state).filter((_, cardIndex) => cardIndex !== index);
  return {
    secondaryCard: secondaryCards.at(-1),
    secondaryCards,
    secondaryCardChoiceId: normalizedChoiceId(choiceId) || normalizedChoiceId(state?.secondaryCardChoiceId)
  };
};

export const clearSecondaryCards = (choiceId?: string) => ({
  secondaryCard: undefined,
  secondaryCards: [] as SecondaryDrawCard[],
  secondaryCardChoiceId: normalizedChoiceId(choiceId)
});
