import type { EngineJournalEvent } from './gameplay';

export type DowntimeActivity =
  | 'rumour'
  | 'general-practice'
  | 'replenish'
  | 'explore'
  | 'self-improvement'
  | 'reconnect'
  | 'relax-tool'
  | 'relax-familiar'
  | 'lend-a-paw'
  | 'commission-wagon';

export interface DowntimeEngineState {
  downtimeCompleted: boolean;
  reputation: number;
  trinkets: number;
  journalEvents: EngineJournalEvent[];
  appliedTransactionIds: string[];
}

export interface DowntimeEngineInput {
  transactionId: string;
  state: DowntimeEngineState;
  activity: DowntimeActivity;
  atCity?: boolean;
}

export interface DowntimeEngineOutcome {
  transactionId: string;
  nextState: DowntimeEngineState;
  manualSteps: string[];
}

const MANUAL_STEPS: Record<DowntimeActivity, string[]> = {
  rumour: [],
  'general-practice': ['Choose the temporary Ailment Tag after drawing the General Practice card.'],
  replenish: ['Choose and prepare the locally available Reagent Parts.'],
  explore: ['Record the newly discovered path on the map.'],
  'self-improvement': ['Choose Speed or Carry and apply the rulebook improvement.'],
  reconnect: ['Record the personal item and the creature it concerns.'],
  'relax-tool': ['Choose one Tool to relax with.'],
  'relax-familiar': ['Choose one Familiar to relax with.'],
  'lend-a-paw': [],
  'commission-wagon': ['Record the commissioned Wagon and its delivery state.']
};

export const resolveDowntime = (input: DowntimeEngineInput): {
  status: 'resolved' | 'manual' | 'invalid';
  value: DowntimeEngineOutcome | null;
  messages: string[];
} => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Downtime requires a transaction ID.'] };
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['This Downtime transaction has already been applied.'] };
  }
  if (input.state.downtimeCompleted) {
    return { status: 'invalid', value: null, messages: ['Exactly one Downtime activity is allowed between Journeys.'] };
  }
  if (input.activity === 'commission-wagon' && (!input.atCity || input.state.trinkets < 20)) {
    return { status: 'invalid', value: null, messages: ['Commissioning a Wagon requires a City and 20 Trinkets.'] };
  }
  const reputation = input.state.reputation + (input.activity === 'lend-a-paw' ? 5 : 0);
  const trinkets = input.state.trinkets
    + (input.activity === 'general-practice' ? 5 : 0)
    - (input.activity === 'commission-wagon' ? 20 : 0);
  const manualSteps = MANUAL_STEPS[input.activity];
  const event: EngineJournalEvent = {
    id: `${input.transactionId}:downtime`,
    type: 'downtime',
    title: `Downtime: ${input.activity}`,
    text: manualSteps.join(' ') || 'Downtime effects applied.'
  };
  return {
    status: manualSteps.length > 0 ? 'manual' : 'resolved',
    value: {
      transactionId: input.transactionId,
      nextState: {
        ...input.state,
        downtimeCompleted: true,
        reputation,
        trinkets,
        journalEvents: [...input.state.journalEvents, event],
        appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
      },
      manualSteps
    },
    messages: manualSteps
  };
};
