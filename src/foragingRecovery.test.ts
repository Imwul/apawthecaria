import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  REAGENTS,
  resolvePatient,
  type EngineInventoryItem
} from './rules';
import {
  createSerializedForagingRollbackSnapshot,
  readSerializedForagingRollbackSnapshot,
  restoreSerializedForagingRollbackState,
  resolveForagingPostEncounterCheckpoint
} from './foragingRecovery';

describe('foraging recovery and p.33 checkpoint', () => {
  it('waits for the printed manual effect before checking treatment or reducing Timers', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'manual-forage', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const before = patient.timers.map(timer => timer.current);
    const waiting = resolveForagingPostEncounterCheckpoint({
      patient,
      inventory: [],
      timerCost: 2,
      manualEffectPending: true
    });
    expect(waiting.waitingForManualEffect).toBe(true);
    expect(waiting.timerApplied).toBe(false);
    expect(waiting.patient?.timers.map(timer => timer.current)).toEqual(before);

    const completed = resolveForagingPostEncounterCheckpoint({
      patient: waiting.patient,
      inventory: [],
      timerCost: 2,
      manualEffectPending: false
    });
    expect(completed.timerApplied).toBe(true);
    expect(completed.patient?.timers.map(timer => timer.current)).toEqual(before.map(value => Math.max(0, value - 2)));
  });

  it('offers the immediate Remedy checkpoint instead of decreasing a Timer once the bag can treat an active Ailment', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'ready-forage', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const reagents: EngineInventoryItem[] = REAGENTS.flatMap(reagent => reagent.preparations.map((part, index) => ({
      id: `ready:${reagent.id}:${index}`,
      name: part.name,
      type: 'reagent' as const,
      weight: part.weight,
      canonicalReagentId: reagent.id,
      preparationId: part.id,
      usesRemaining: part.uses
    })));
    const toolIds = ['belt-knife', 'mortar-and-pestle', 'camp-kettle', 'teeth', 'paws', 'copper-frying-pan', 'big-iron-cauldron'];
    const before = patient.timers.map(timer => timer.current);
    const result = resolveForagingPostEncounterCheckpoint({
      patient,
      inventory: reagents,
      availableToolIds: toolIds,
      timerCost: 1,
      manualEffectPending: false
    });
    expect(result.immediatelyTreatable).toBe(true);
    expect(result.timerApplied).toBe(false);
    expect(result.patient?.timers.map(timer => timer.current)).toEqual(before);
  });

  it('round-trips an interrupted rollback checkpoint without retaining later optional state', () => {
    const before = {
      bag: [{ id: 'old-reagent' }],
      patients: [{ id: 'patient', foragingPoints: 2 }],
      reputation: 5,
      trinkets: ['button'],
      appliedTransactionIds: ['before'],
      appliedEncounterEffectIds: [],
      manualEffectQueue: [],
      pendingManualEffect: null,
      manualEffectDraft: null,
      manualEffectRecords: [],
      pendingManualFollowUps: [],
      manualConditions: [],
      toolStates: [],
      journey: null,
      activeDelve: undefined,
      journals: [{ id: 'journal-before' }]
    };
    const encoded = createSerializedForagingRollbackSnapshot('forage:1', before);
    const decoded = readSerializedForagingRollbackSnapshot(
      JSON.parse(JSON.stringify(encoded)),
      'forage:1'
    );
    expect(decoded).not.toBeNull();
    expect(decoded?.patch).toMatchObject({
      bag: [{ id: 'old-reagent' }],
      patients: [{ id: 'patient', foragingPoints: 2 }],
      reputation: 5,
      pendingManualEffect: null
    });
    expect(Object.prototype.hasOwnProperty.call(decoded?.patch, 'activeDelve')).toBe(true);
    expect(decoded?.patch.activeDelve).toBeUndefined();
    expect(decoded?.journalIds).toEqual(['journal-before']);
    const restored = restoreSerializedForagingRollbackState({
      ...before,
      bag: [{ id: 'new-reagent' }],
      patients: [{ id: 'patient', foragingPoints: 0 }],
      reputation: 1,
      activeDelve: { id: 'later-delve' },
      pendingForaging: { transactionId: 'forage:1' },
      journals: [{ id: 'journal-during-forage' }, ...before.journals]
    }, JSON.parse(JSON.stringify(encoded)), 'forage:1');
    expect(restored).toMatchObject({
      bag: before.bag,
      patients: before.patients,
      reputation: before.reputation,
      pendingForaging: null,
      journals: before.journals
    });
    expect(Object.prototype.hasOwnProperty.call(restored, 'activeDelve')).toBe(true);
    expect(restored?.activeDelve).toBeUndefined();
    expect(readSerializedForagingRollbackSnapshot(encoded, 'forage:other')).toBeNull();
    expect(readSerializedForagingRollbackSnapshot({
      version: 1,
      transactionId: 'forage:1',
      fields: { bag: { present: true, value: [] } },
      journalIds: []
    }, 'forage:1')).toBeNull();
  });
});
