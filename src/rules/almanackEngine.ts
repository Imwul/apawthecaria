import { getRuleCardValue, type RuleCard } from './cards';

const OBJECTS = ['Implement or Gadget', 'Container', 'Accessory', 'Clothing or Equipment', 'Book', 'Toy / Animal / Entertainment', 'Instrument', 'Tchotchke', 'Pilgrimage Memento', 'Local Souvenir', 'Food / Delicacy', 'Seedling / Potted Plant'] as const;
const MATERIALS = ['Titanesque', 'Hardwood', 'Bone', 'Iron', 'Silver', 'Repurposed', 'Copper', 'Flint', 'Grasses / Plant Fibres', 'Pretty Stone', 'Glass', 'Softwood'] as const;
const ORIGINS = ['Unwanted Gift', 'Tattered & sentimental', 'Inherited from family', 'Discovered by roadside', 'Handmade by owner', 'Part of a collection', 'Traded from faraway', 'Survived spring cleaning', 'Imported from the west coast', 'Permanently borrowed', 'Too big or small for the original owner', 'A friend’s (they went Elsewhere)'] as const;

export interface TrinketRecord {
  trinketId: string;
  object: string;
  material: string;
  origin: string;
  acquiredAt: number;
  source: string;
  spent: boolean;
  journalEntryId: string;
}

export const createTrinketRecord = (input: { transactionId: string; cards: [RuleCard, RuleCard, RuleCard]; acquiredAt: number; source: string; journalEntryId: string }): TrinketRecord => {
  const indexes = input.cards.map(card => getRuleCardValue(card, 'table') - 1);
  return { trinketId: `trinket:${input.transactionId}`, object: OBJECTS[indexes[0]], material: MATERIALS[indexes[1]], origin: ORIGINS[indexes[2]], acquiredAt: input.acquiredAt, source: input.source, spent: false, journalEntryId: input.journalEntryId };
};

export interface ManualEffectDraft {
  effectId: string;
  ruleId: string;
  sourcePage: number;
  summary: string;
  mandatoryConditions: string[];
  choices: string[];
  canonicalActions: string[];
  resultSummary: string;
  journalNote: string;
  status: 'manual' | 'deferred' | 'resolved' | 'overridden';
  transactionId: string | null;
}

export const resolveManualEffect = (draft: ManualEffectDraft, transactionId: string, override = false): ManualEffectDraft => {
  if (!transactionId || draft.transactionId) throw new Error('Manual effect transaction is missing or already applied.');
  if (!draft.resultSummary.trim() || !draft.journalNote.trim()) throw new Error('Result summary and journal note are required.');
  return { ...draft, transactionId, status: override ? 'overridden' : 'resolved' };
};
