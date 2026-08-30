import { describe, expect, it } from 'vitest';
import type { ForagingEncounterTransactionState } from './foragingEncounterTransactions';
import {
  FORAGING_ENCOUNTER_TRANSACTION_CODES,
  dispatchForagingEncounterTransaction
} from './foragingEncounterTransactionDispatcher';
import {
  planForagingEncounterTransaction,
  type ForagingEncounterPrompt
} from './foragingEncounterTransactionPlanner';

const state = (overrides: Partial<ForagingEncounterTransactionState> = {}): ForagingEncounterTransactionState => ({
  revision: 4,
  reputation: 12,
  trinkets: 2,
  foragingPoints: 3,
  inventory: [],
  patient: null,
  tools: [],
  companions: [],
  conditions: [],
  deliveries: [],
  sainDeClawsQuests: [],
  appliedTransactionIds: [],
  ...overrides
});

const chooseDefaults: ForagingEncounterPrompt = async request => request.defaultValue ?? '';

describe('foraging encounter transaction planner', () => {
  it('does not invent a mechanical transaction for a narrative sibling choice', async () => {
    const plan = await planForagingEncounterTransaction({
      encounterId: 'foraging-bog-8',
      choiceId: 'do-not-intervene',
      transactionId: 'forage:bog:8',
      state: state(),
      secondaryCards: [],
      locationId: 'bog-1',
      calendarDaysTotal: 90,
      daysMarkedAtEncounterStart: 20,
      companionCapacity: 1
    }, chooseDefaults);

    expect(plan).toEqual({ status: 'not-applicable' });
  });

  it('requires every already-drawn card before creating a comparison command', async () => {
    const missing = await planForagingEncounterTransaction({
      encounterId: 'foraging-bog-8',
      choiceId: 'vigilante',
      transactionId: 'forage:bog:8',
      state: state(),
      secondaryCards: [{ value: 8, suit: '♥' }],
      locationId: 'bog-1',
      calendarDaysTotal: 90,
      daysMarkedAtEncounterStart: 20,
      companionCapacity: 1
    }, chooseDefaults);

    expect(missing).toMatchObject({ status: 'invalid' });
    if (missing.status === 'invalid') expect(missing.message).toContain('강도');
  });

  it('plans Log Knocking as one preparation for each distinct physical Part', async () => {
    const plan = await planForagingEncounterTransaction({
      encounterId: 'foraging-forest-6',
      choiceId: 'choose-bug-reagent',
      transactionId: 'forage:log',
      state: state(),
      secondaryCards: [],
      locationId: 'forest-1',
      calendarDaysTotal: 90,
      daysMarkedAtEncounterStart: 20,
      companionCapacity: 1
    }, chooseDefaults);

    expect(plan.status).toBe('planned');
    if (plan.status !== 'planned') return;
    expect(plan.command.code).toBe(FORAGING_ENCOUNTER_TRANSACTION_CODES.logKnocking);
    const resolution = dispatchForagingEncounterTransaction(plan.command);
    expect(resolution.status).toBe('resolved');
    const rewards = resolution.value?.nextState.inventory || [];
    expect(new Set(rewards.map(item => item.preparationId)).size).toBe(rewards.length);
    expect(rewards.length).toBeGreaterThan(0);
  });

  it('keeps Project Launch reward deferred in the planned transaction', async () => {
    const plan = await planForagingEncounterTransaction({
      encounterId: 'foraging-meadow-9-spring',
      choiceId: 'watch-the-unveiling',
      transactionId: 'forage:project',
      state: state(),
      secondaryCards: [],
      locationId: 'meadow-1',
      calendarDaysTotal: 90,
      daysMarkedAtEncounterStart: 20,
      companionCapacity: 1
    }, chooseDefaults);

    expect(plan.status).toBe('planned');
    if (plan.status !== 'planned') return;
    const resolution = dispatchForagingEncounterTransaction(plan.command);
    expect(resolution.value?.nextState.reputation).toBe(12);
    expect(resolution.value?.nextState.deliveries).toHaveLength(1);
    expect(resolution.value?.nextState.deliveries[0].status).toBe('pending');
  });

  it('separates Mycophiliacs Beseech from the ordinary calendar branch', async () => {
    const plan = await planForagingEncounterTransaction({
      encounterId: 'foraging-meadow-m-autumn',
      choiceId: 'beseech',
      transactionId: 'forage:mycophiliacs',
      state: state({ reputation: 25 }),
      secondaryCards: [],
      locationId: 'meadow-1',
      calendarDaysTotal: 90,
      daysMarkedAtEncounterStart: 60,
      companionCapacity: 1
    }, chooseDefaults);

    expect(plan.status).toBe('planned');
    if (plan.status !== 'planned') return;
    expect(plan.command.code).toBe(FORAGING_ENCOUNTER_TRANSACTION_CODES.mycophiliacsBarter);
    expect(dispatchForagingEncounterTransaction(plan.command).status).toBe('resolved');
  });

  it('cancels cleanly before mutating when a genuine player selection is dismissed', async () => {
    const cancel: ForagingEncounterPrompt = async () => null;
    const plan = await planForagingEncounterTransaction({
      encounterId: 'foraging-titan-4',
      choiceId: 'enter-the-chamber',
      transactionId: 'forage:resting-place',
      state: state(),
      secondaryCards: [{ value: 8, suit: '♥' }],
      locationId: 'titan-1',
      calendarDaysTotal: 90,
      daysMarkedAtEncounterStart: 20,
      companionCapacity: 1
    }, cancel);

    expect(plan).toEqual({ status: 'cancelled' });
  });

  it('does not ask for a p.185 reward after the printed Club/Spade flight branch', async () => {
    let promptCount = 0;
    const plan = await planForagingEncounterTransaction({
      encounterId: 'foraging-titan-4',
      choiceId: 'enter-the-chamber',
      transactionId: 'forage:resting-place:flee',
      state: state(),
      secondaryCards: [{ value: 8, suit: '♠' }],
      locationId: 'titan-1',
      calendarDaysTotal: 90,
      daysMarkedAtEncounterStart: 20,
      companionCapacity: 1
    }, async request => {
      promptCount += 1;
      return request.defaultValue ?? '';
    });

    expect(promptCount).toBe(0);
    expect(plan.status).toBe('planned');
    if (plan.status !== 'planned') return;
    expect(dispatchForagingEncounterTransaction(plan.command)).toMatchObject({ status: 'resolved' });
  });
});
