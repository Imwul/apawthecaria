import { createTrinketRecord, type TrinketRecord } from './almanackEngine';
import type { RuleCard } from './cards';

export interface TrinketLedgerResolution {
  records: TrinketRecord[];
  legacyCount: number;
  createdRecords: TrinketRecord[];
  spentRecordIds: string[];
}

const hashSeed = (value: string): number => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  return hash >>> 0;
};

export const deterministicTrinketCards = (seed: string): [RuleCard, RuleCard, RuleCard] => [0, 1, 2].map(index => {
  const hash = hashSeed(`${seed}:${index}`);
  return { value: (hash % 12) + 1, suit: ['♥', '♦', '♣', '♠'][hash % 4] };
}) as [RuleCard, RuleCard, RuleCard];

export const reconcileTrinketLedger = (input: {
  previousCount: number;
  nextCount: number;
  records: TrinketRecord[];
  legacyCount: number;
  transactionId: string;
  acquiredAt: number;
  source: string;
  journalEntryId: string;
  preferredSpentRecordIds?: string[];
}): TrinketLedgerResolution => {
  const records = input.records.map(record => ({ ...record }));
  const recordedActiveCount = records.filter(record => !record.spent).length;
  let legacyCount = Math.max(0, input.legacyCount, input.previousCount - recordedActiveCount);
  const createdRecords: TrinketRecord[] = [];
  const spentRecordIds: string[] = [];
  const delta = input.nextCount - input.previousCount;
  if (delta > 0) {
    const transactionId = `${input.transactionId}:representative`;
    const record = createTrinketRecord({ transactionId, cards: deterministicTrinketCards(transactionId), acquiredAt: input.acquiredAt, source: input.source, journalEntryId: input.journalEntryId });
    if (!records.some(row => row.trinketId === record.trinketId)) {
      records.push(record);
      createdRecords.push(record);
    }
    legacyCount += Math.max(0, delta - createdRecords.length);
  }
  if (delta < 0) {
    let remaining = Math.abs(delta);
    const preferred = new Set(input.preferredSpentRecordIds || []);
    for (const record of records.filter(row => !row.spent && preferred.has(row.trinketId))) {
      if (remaining <= 0) break;
      record.spent = true;
      spentRecordIds.push(record.trinketId);
      remaining -= 1;
    }
    const legacySpent = Math.min(legacyCount, remaining);
    legacyCount -= legacySpent;
    remaining -= legacySpent;
    for (const record of records.filter(row => !row.spent).sort((a, b) => a.acquiredAt - b.acquiredAt)) {
      if (remaining <= 0) break;
      record.spent = true;
      spentRecordIds.push(record.trinketId);
      remaining -= 1;
    }
  }
  return { records, legacyCount, createdRecords, spentRecordIds };
};
