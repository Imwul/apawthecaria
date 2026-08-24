import { describe, expect, it } from 'vitest';
import {
  normalizePendingManualFollowUp,
  resolveManualFollowUpTransaction,
  type ManualFollowUpRuntimeState,
  type PendingManualFollowUp
} from './rules';

const followUp = (patch: Partial<PendingManualFollowUp> = {}): PendingManualFollowUp => ({
  id: 'betting:friend:follow-up:1',
  effectId: 'betting-effect',
  ownerId: 'social-forest-summer-♣',
  trigger: 'encounter',
  description: 'Cocoon follow-up: after travelling 10 Paths, or when the Journey ends, it hatches into a Butterfly Companion.',
  context: { continuation: 'travel' },
  createdAt: 100,
  transactionId: 'betting:friend',
  status: 'pending',
  kind: 'cocoon-hatch',
  targetInventoryItemId: 'betting:friend:inventory:cocoon',
  ...patch
});

const state = (row = followUp()): ManualFollowUpRuntimeState => ({
  inventory: [{
    id: 'betting:friend:inventory:cocoon',
    name: 'Cocoon',
    type: 'item',
    weight: 1 / 3,
    quantity: 1,
    ruinedWhenSoaked: false
  }],
  companions: [],
  companionCapacity: 1,
  pendingFollowUps: [row],
  appliedTransactionIds: []
});

describe('manual follow-up canonical transaction', () => {
  it('atomically consumes the originating Cocoon and gains one Butterfly', () => {
    const before = state();
    const snapshot = JSON.parse(JSON.stringify(before));
    const result = resolveManualFollowUpTransaction({
      followUpId: followUp().id,
      transactionId: 'follow-up:commit',
      state: before,
      eligibilityEvidence: 'travelled-10-paths'
    });

    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.inventory).toEqual([]);
    expect(result.value?.nextState.companions).toEqual([
      expect.objectContaining({
        instanceId: 'follow-up:commit:companion:butterfly',
        companionId: 'butterfly'
      })
    ]);
    expect(result.value?.nextState.pendingFollowUps[0].status).toBe('resolved');
    expect(result.value?.nextState.appliedTransactionIds).toContain('follow-up:commit');
    expect(before).toEqual(snapshot);

    const repeated = resolveManualFollowUpTransaction({
      followUpId: followUp().id,
      transactionId: 'follow-up:commit',
      state: result.value!.nextState,
      eligibilityEvidence: 'travelled-10-paths'
    });
    expect(repeated.status).toBe('invalid');
    expect(repeated.value).toBeNull();
  });

  it('recovers a legacy Cocoon follow-up from its originating transaction id', () => {
    const legacy = normalizePendingManualFollowUp({
      ...followUp(),
      kind: undefined,
      targetInventoryItemId: undefined
    })!;
    expect(legacy).toMatchObject({ kind: 'cocoon-hatch' });
    const result = resolveManualFollowUpTransaction({
      followUpId: legacy.id,
      transactionId: 'follow-up:legacy',
      eligibilityEvidence: 'journey-ended',
      state: {
        ...state(legacy),
        inventory: [{
          id: 'betting:friend:inventory:legacy-action',
          name: 'Cocoon',
          type: 'item',
          weight: 1 / 3,
          quantity: 1,
          ruinedWhenSoaked: false
        }]
      }
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.inventory).toEqual([]);
  });

  it('does not promote a Cocoon-looking follow-up owned by another encounter', () => {
    const malformed = normalizePendingManualFollowUp({
      ...followUp(),
      ownerId: 'social-forest-spring-♣',
      kind: 'cocoon-hatch',
      targetInventoryItemId: 'betting:friend:inventory:cocoon'
    });

    expect(malformed).toMatchObject({ ownerId: 'social-forest-spring-♣' });
    expect(malformed?.kind).toBeUndefined();
    expect(malformed?.targetInventoryItemId).toBeUndefined();
  });

  it('rejects malformed saves whose linked target is not the exact originating Cocoon', () => {
    const malformedTargets = [
      [{
        id: 'betting:friend:inventory:cocoon',
        name: 'Perfect Conker',
        type: 'item' as const,
        weight: 1 / 3,
        quantity: 1,
        ruinedWhenSoaked: false
      }],
      [{
        id: 'another-transaction:inventory:cocoon',
        name: 'Cocoon',
        type: 'item' as const,
        weight: 1 / 3,
        quantity: 1,
        ruinedWhenSoaked: false
      }],
      [{
        id: 'betting:friend:inventory:cocoon',
        name: 'Cocoon',
        type: 'item' as const,
        weight: 1 / 3,
        quantity: 0,
        ruinedWhenSoaked: false
      }]
    ];

    for (const inventory of malformedTargets) {
      const malformedState = { ...state(), inventory };
      const snapshot = JSON.parse(JSON.stringify(malformedState));
      const result = resolveManualFollowUpTransaction({
        followUpId: followUp().id,
        transactionId: `follow-up:malformed:${inventory[0].id}:${inventory[0].quantity}`,
        state: malformedState,
        eligibilityEvidence: 'travelled-10-paths'
      });

      expect(result.status).toBe('invalid');
      expect(result.value).toBeNull();
      expect(malformedState).toEqual(snapshot);
    }
  });

  it('does not consume an unrelated sole Cocoon when a legacy follow-up has lost its exact target', () => {
    const legacy = normalizePendingManualFollowUp({
      ...followUp(),
      kind: undefined,
      targetInventoryItemId: undefined
    })!;
    const unrelatedState: ManualFollowUpRuntimeState = {
      ...state(legacy),
      inventory: [{
        id: 'unrelated:inventory:cocoon',
        name: 'Cocoon',
        type: 'item',
        weight: 1 / 3,
        quantity: 1,
        ruinedWhenSoaked: false
      }]
    };
    const snapshot = JSON.parse(JSON.stringify(unrelatedState));

    const result = resolveManualFollowUpTransaction({
      followUpId: legacy.id,
      transactionId: 'follow-up:legacy-unrelated',
      state: unrelatedState,
      eligibilityEvidence: 'journey-ended'
    });

    expect(result.status).toBe('invalid');
    expect(result.value).toBeNull();
    expect(unrelatedState).toEqual(snapshot);
  });

  it('leaves all state untouched when the Cocoon is missing or the companion slot is full', () => {
    const missing = { ...state(), inventory: [] };
    const missingSnapshot = JSON.parse(JSON.stringify(missing));
    expect(resolveManualFollowUpTransaction({
      followUpId: followUp().id,
      transactionId: 'follow-up:missing',
      state: missing,
      eligibilityEvidence: 'travelled-10-paths'
    }).status).toBe('invalid');
    expect(missing).toEqual(missingSnapshot);

    const full = {
      ...state(),
      companions: [{
        instanceId: 'existing:butterfly',
        companionId: 'butterfly',
        pathsTravelled: 0,
        seasonsTravelled: 0,
        usedThisJourney: false,
        pendingForage: null
      }]
    };
    const fullSnapshot = JSON.parse(JSON.stringify(full));
    expect(resolveManualFollowUpTransaction({
      followUpId: followUp().id,
      transactionId: 'follow-up:full',
      state: full,
      eligibilityEvidence: 'journey-ended'
    }).status).toBe('invalid');
    expect(full).toEqual(fullSnapshot);
  });

  it('requires one of the two printed hatch conditions before mutating the Cocoon', () => {
    const before = state();
    const snapshot = JSON.parse(JSON.stringify(before));

    const missing = resolveManualFollowUpTransaction({
      followUpId: followUp().id,
      transactionId: 'follow-up:premature',
      state: before
    });

    expect(missing.status).toBe('invalid');
    expect(missing.messages.join(' ')).toMatch(/10 Paths.*Journey/i);
    expect(before).toEqual(snapshot);
  });
});
