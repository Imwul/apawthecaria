import type { RuleCard } from './cards';
import type { CardSuit, Region } from './types';

export type RumourDirection = 'North' | 'South' | 'East' | 'West';
export type RumourBehemoth = 'Towering' | 'Many' | 'Violent' | 'Demanding';

export interface RumourCandidate {
  locationId: string;
  region: Region;
  direction: RumourDirection;
  pathDistance: number;
}

export interface CanonicalRumour {
  id: string;
  behemoth: RumourBehemoth;
  direction: RumourDirection;
  region: Exclude<Region, 'Loch' | 'Titan'>;
  distance: '1-2' | '4-5' | '7-10' | '15+';
  targetLocationId: string;
  sourcePage: 40;
  draw: CardSuit[];
}

const suitOf = (card: RuleCard): CardSuit => {
  if (typeof card === 'number' || !card.suit || !['♥', '♦', '♣', '♠'].includes(card.suit)) throw new Error('Rumour cards require canonical suits.');
  return card.suit as CardSuit;
};

const TABLE = {
  '♥': { behemoth: 'Towering', direction: 'North', region: 'Forest', distance: '1-2' },
  '♦': { behemoth: 'Many', direction: 'South', region: 'Mountain', distance: '4-5' },
  '♣': { behemoth: 'Violent', direction: 'East', region: 'Bog', distance: '7-10' },
  '♠': { behemoth: 'Demanding', direction: 'West', region: 'Meadow', distance: '15+' }
} as const;

const inRange = (distance: CanonicalRumour['distance'], paths: number) => distance === '1-2' ? paths >= 1 && paths <= 2 : distance === '4-5' ? paths >= 4 && paths <= 5 : distance === '7-10' ? paths >= 7 && paths <= 10 : paths >= 15;

export const resolveRumour = (input: { transactionId: string; reputation: number; atCity: boolean; downtimeCompleted: boolean; cards: [RuleCard, RuleCard, RuleCard, RuleCard]; candidates: RumourCandidate[]; targetLocationId: string }) => {
  if (!input.transactionId || input.reputation < 15 || !input.atCity || input.downtimeCompleted) throw new Error('Rumour requires Reputation 15+, a City Journey ending, and active Downtime.');
  const suits = input.cards.map(suitOf) as [CardSuit, CardSuit, CardSuit, CardSuit];
  const behemoth = TABLE[suits[0]].behemoth;
  const direction = TABLE[suits[1]].direction;
  const region = TABLE[suits[2]].region;
  const distance = TABLE[suits[3]].distance;
  const valid = input.candidates.filter(row => row.direction === direction && row.region === region && inRange(distance, row.pathDistance));
  const target = valid.find(row => row.locationId === input.targetLocationId);
  if (!target) return { status: 'redraw-required' as const, rumour: null, validTargetIds: valid.map(row => row.locationId) };
  return { status: 'resolved' as const, rumour: { id: `rumour:${input.transactionId}`, behemoth, direction, region, distance, targetLocationId: target.locationId, sourcePage: 40 as const, draw: suits }, validTargetIds: valid.map(row => row.locationId) };
};
