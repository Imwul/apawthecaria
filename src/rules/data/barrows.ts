import { canonicalMetadata } from '../source';
import type { CanonicalRuleRecord, CardSuit, RuleTag } from '../types';

export type BehemothClass = 'Towering' | 'Many' | 'Violent' | 'Demanding';
export type BarrowDelveId =
  | 'uneasy-sleep'
  | 'collapsed-entrance'
  | 'bellies-of-many'
  | 'inside-job'
  | 'potent-poison'
  | 'pilfer-unnoticed'
  | 'building-trust'
  | 'suitable-furnishings';

export interface BarrowDelveDefinition extends CanonicalRuleRecord {
  id: BarrowDelveId;
  name: string;
  behemothClass: BehemothClass;
  suits: CardSuit[];
  challenge: string;
  initialTimer: number;
  requiredTags: Array<{ tag: RuleTag; value: number; count?: number }>;
  sourcePage: number;
  ruleIds: string[];
}

const delve = (row: Omit<BarrowDelveDefinition, keyof CanonicalRuleRecord> & { page: number }): BarrowDelveDefinition => {
  const { page, ...rest } = row;
  return { ...rest, ...canonicalMetadata(page) };
};

export const BARROW_DELVES: readonly BarrowDelveDefinition[] = [
  delve({ id: 'uneasy-sleep', name: 'Uneasy Sleep', behemothClass: 'Towering', suits: ['♥', '♦'], challenge: 'Soporific Incense', initialTimer: 4, requiredTags: [{ tag: 'SLEEP', value: 6 }], page: 118, ruleIds: ['BARROW-001', 'BARROW-005'] }),
  delve({ id: 'collapsed-entrance', name: 'Collapsed Entrance', behemothClass: 'Towering', suits: ['♣', '♠'], challenge: 'Invigorating Tea', initialTimer: 0, requiredTags: [], page: 119, ruleIds: ['BARROW-001', 'BARROW-004'] }),
  delve({ id: 'bellies-of-many', name: 'The Bellies of Many', behemothClass: 'Many', suits: ['♥', '♦'], challenge: 'Silent Service', initialTimer: 12, requiredTags: [{ tag: 'JOY', value: 2 }, { tag: 'STOMACH', value: 2, count: 2 }, { tag: 'NERVES', value: 2 }, { tag: 'SENSES', value: 3 }, { tag: 'MOOD', value: 2 }], page: 120, ruleIds: ['BARROW-001', 'BARROW-008'] }),
  delve({ id: 'inside-job', name: 'Inside Job', behemothClass: 'Many', suits: ['♣', '♠'], challenge: 'Nefarious Concoction', initialTimer: 0, requiredTags: [{ tag: 'SLEEP', value: 4 }, { tag: 'FOUL', value: 8 }], page: 121, ruleIds: ['BARROW-001', 'BARROW-008'] }),
  delve({ id: 'potent-poison', name: 'Potent Poison', behemothClass: 'Violent', suits: ['♥', '♦'], challenge: 'Potent Poison', initialTimer: 4, requiredTags: [], page: 122, ruleIds: ['BARROW-001', 'BARROW-009'] }),
  delve({ id: 'pilfer-unnoticed', name: 'Pilfer Unnoticed', behemothClass: 'Violent', suits: ['♣', '♠'], challenge: 'Steal Everything', initialTimer: 0, requiredTags: [], page: 123, ruleIds: ['BARROW-001', 'BARROW-006'] }),
  delve({ id: 'building-trust', name: 'Building Trust', behemothClass: 'Demanding', suits: ['♥', '♦'], challenge: 'The Strength of a Union', initialTimer: 0, requiredTags: [], page: 124, ruleIds: ['BARROW-001', 'BARROW-007'] }),
  delve({ id: 'suitable-furnishings', name: 'Suitable Furnishings', behemothClass: 'Demanding', suits: ['♣', '♠'], challenge: 'Making a House into a Home', initialTimer: 0, requiredTags: [], page: 125, ruleIds: ['BARROW-001', 'BARROW-007'] })
];

export const BARROW_DELVE_BY_ID = new Map(BARROW_DELVES.map(row => [row.id, row]));
export const findBarrowDelve = (behemothClass: BehemothClass, suit: CardSuit) => BARROW_DELVES.find(row => row.behemothClass === behemothClass && row.suits.includes(suit)) || null;

export const POTENT_POISON_REAGENT_IDS = [
  'reagent-blackthorn',
  'reagent-false-deathcap',
  'reagent-hoarhound',
  'reagent-tansies',
  'reagent-nettles',
  'reagent-toads',
  'reagent-wasps'
] as const;
