import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  REAGENTS,
  resolvePatient,
  type CanonicalToolState,
  type EngineInventoryItem
} from './rules';
import {
  createSerializedForagingRollbackSnapshot,
  readSerializedForagingRollbackSnapshot,
  restoreSerializedForagingRollbackState,
  resolveForagingPostEncounterCheckpoint,
  hasPendingManualForagingCheckpoint,
  isAwaitingImmediateRemedy,
  manualForagingCheckpointMatchesDraft,
  pendingForagingAfterEncounterCheckpoint,
  releaseImmediateRemedyCheckpoint
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

  it('persists the immediate-Remedy gate and releases it only for that patient after a Remedy', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'gate-patient', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const pending = {
      transactionId: 'forage:gate',
      region: 'Meadow' as const,
      locationRelation: 'current' as const,
      card: { value: 7, suit: '♥' },
      timerCostAfterEncounter: 1,
      encounterId: null,
      phase: 'encounter' as const
    };
    const held = pendingForagingAfterEncounterCheckpoint(pending, {
      patient,
      immediatelyTreatable: true,
      immediatelyTreatableAilmentIds: [patient.ailments[0].id],
      timerApplied: false,
      waitingForManualEffect: false
    });
    const reloaded = JSON.parse(JSON.stringify(held));

    expect(reloaded).toMatchObject({
      transactionId: 'forage:gate',
      phase: 'resolved',
      awaitingImmediateRemedy: true,
      immediateRemedyPatientId: patient.id,
      immediateRemedyAilmentIds: [patient.ailments[0].id]
    });
    expect(isAwaitingImmediateRemedy(reloaded)).toBe(true);
    expect(releaseImmediateRemedyCheckpoint(reloaded, 'different-patient', patient.ailments[0].id)).toEqual(reloaded);
    expect(releaseImmediateRemedyCheckpoint(reloaded, patient.id, 'different-ailment')).toEqual(reloaded);
    expect(releaseImmediateRemedyCheckpoint(reloaded, patient.id, patient.ailments[0].id)).toBeNull();
  });

  it('keeps a manual-effect checkpoint distinct from the immediate-Remedy gate', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'manual-gate', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const pending = {
      transactionId: 'forage:manual-gate',
      region: 'Forest' as const,
      locationRelation: 'current' as const,
      card: { value: 5, suit: '♣' },
      timerCostAfterEncounter: 1,
      encounterId: 'manual-encounter',
      phase: 'encounter' as const
    };
    const waiting = pendingForagingAfterEncounterCheckpoint(pending, {
      patient,
      immediatelyTreatable: false,
      immediatelyTreatableAilmentIds: [],
      timerApplied: false,
      waitingForManualEffect: true
    });

    expect(waiting).toMatchObject({ phase: 'resolved' });
    expect(waiting?.awaitingImmediateRemedy).toBeUndefined();
    expect(isAwaitingImmediateRemedy(waiting)).toBe(false);
    const patientlessManual = resolveForagingPostEncounterCheckpoint({
      patient: null,
      inventory: [],
      timerCost: 0,
      manualEffectPending: true
    });
    expect(patientlessManual.waitingForManualEffect).toBe(true);
    expect(pendingForagingAfterEncounterCheckpoint(pending, patientlessManual))
      .toMatchObject({ phase: 'resolved' });
    expect(pendingForagingAfterEncounterCheckpoint(pending, {
      patient,
      immediatelyTreatable: false,
      immediatelyTreatableAilmentIds: [],
      timerApplied: true,
      waitingForManualEffect: false
    })).toBeNull();
  });

  it('binds a manual checkpoint to the exact encounter transaction', () => {
    const pending = {
      transactionId: 'forage:owned',
      region: 'Forest' as const,
      locationRelation: 'current' as const,
      card: { value: 5, suit: '♣' },
      timerCostAfterEncounter: 1,
      encounterId: 'manual-encounter',
      phase: 'resolved' as const
    };
    const draft = {
      transactionId: null,
      status: 'manual' as const,
      context: { continuation: 'foraging' as const, encounterTransactionId: 'forage:owned:encounter' }
    } as NonNullable<Parameters<typeof manualForagingCheckpointMatchesDraft>[1]>;
    const unrelated = {
      ...draft!,
      context: { continuation: 'foraging' as const, encounterTransactionId: 'forage:other:encounter' }
    };

    expect(manualForagingCheckpointMatchesDraft(pending, draft)).toBe(true);
    expect(manualForagingCheckpointMatchesDraft(pending, unrelated)).toBe(false);
    expect(hasPendingManualForagingCheckpoint(pending, [unrelated, draft])).toBe(true);
    expect(hasPendingManualForagingCheckpoint(pending, [unrelated])).toBe(false);
  });

  it('keeps the reported Waen Drops Timer at 6 when adjacent Foraging completes its Remedy', () => {
    const ailment = AILMENTS.find(row => row.id === 'ailment-waen-drops')!;
    const beehive = REAGENTS.find(row => row.id === 'reagent-beehive')!;
    const marigold = REAGENTS.find(row => row.id === 'reagent-marigold')!;
    const honey = beehive.preparations.find(row => row.id === 'beehive-honey-used-in-consumed-remedies-4')!;
    const crushedPetals = marigold.preparations.find(row => row.id === 'marigold-petals-crushed-3')!;
    const diagnosed = resolvePatient({
      id: 'waen-adjacent-forage',
      name: 'Patient',
      species: 'Mouse',
      ailmentIds: [ailment.id]
    }).value!;
    const patient = {
      ...diagnosed,
      timers: diagnosed.timers.map(timer => ({ ...timer, current: 6 }))
    };
    const honeyItem: EngineInventoryItem = {
      id: 'waen-forage:honey',
      name: 'Beehive (Honey, USED IN CONSUMED REMEDIES)',
      type: 'reagent',
      weight: honey.weight,
      canonicalReagentId: beehive.id,
      preparationId: honey.id,
      usesRemaining: honey.uses
    };
    const petalsItem: EngineInventoryItem = {
      id: 'waen-forage:petals',
      name: 'Marigold (Petals, CRUSHED)',
      type: 'reagent',
      weight: crushedPetals.weight,
      canonicalReagentId: marigold.id,
      preparationId: crushedPetals.id,
      usesRemaining: crushedPetals.uses
    };
    const mortarItem: EngineInventoryItem = {
      id: 'waen-forage:mortar',
      name: 'Mortar and Pestle',
      type: 'tool',
      weight: 0,
      canonicalToolId: 'mortar-and-pestle'
    };
    const completeBag = [honeyItem, petalsItem, mortarItem];

    const immediateRemedy = resolveForagingPostEncounterCheckpoint({
      patient,
      inventory: completeBag,
      timerCost: 2,
      manualEffectPending: false
    });
    expect(immediateRemedy.immediatelyTreatable).toBe(true);
    expect(immediateRemedy.timerApplied).toBe(false);
    expect(immediateRemedy.patient?.timers.map(timer => timer.current)).toEqual([6]);

    const missingMortar = resolveForagingPostEncounterCheckpoint({
      patient,
      inventory: [honeyItem, petalsItem],
      timerCost: 2,
      manualEffectPending: false
    });
    expect(missingMortar.immediatelyTreatable).toBe(false);
    expect(missingMortar.timerApplied).toBe(true);
    expect(missingMortar.patient?.timers.map(timer => timer.current)).toEqual([4]);

    const waitingForManualEffect = resolveForagingPostEncounterCheckpoint({
      patient,
      inventory: completeBag,
      timerCost: 2,
      manualEffectPending: true
    });
    expect(waitingForManualEffect.waitingForManualEffect).toBe(true);
    expect(waitingForManualEffect.timerApplied).toBe(false);
    expect(waitingForManualEffect.patient?.timers.map(timer => timer.current)).toEqual([6]);

    const resumedWithCompleteBag = resolveForagingPostEncounterCheckpoint({
      patient: waitingForManualEffect.patient,
      inventory: completeBag,
      timerCost: 2,
      manualEffectPending: false
    });
    expect(resumedWithCompleteBag.immediatelyTreatable).toBe(true);
    expect(resumedWithCompleteBag.timerApplied).toBe(false);
    expect(resumedWithCompleteBag.patient?.timers.map(timer => timer.current)).toEqual([6]);
  });

  it('does not skip the post-foraging Timer when the required preparation Tool is broken or consumed', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Waen Drops')!;
    const patient = resolvePatient({ id: 'broken-forage-tool', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const rows = REAGENTS.flatMap(reagent => reagent.preparations.map(part => ({ reagent, part })));
    const pain = rows.find(row => row.part.tags.some(tag => tag.tag === 'PAIN' && tag.value >= 2))!;
    const fair = rows.find(row => row.part.tags.some(tag => tag.tag === 'FAIR' && tag.value >= 3))!;
    const inventory: EngineInventoryItem[] = [pain, fair].map(({ reagent, part }, index) => ({
      id: `broken-forage:ingredient:${index}`,
      name: part.name,
      type: 'reagent',
      weight: part.weight,
      canonicalReagentId: reagent.id,
      preparationId: part.id,
      usesRemaining: part.uses
    }));
    const requiredToolId = pain.part.requiredTools.find(tool => tool !== 'none')!;
    inventory.push({
      id: 'broken-forage:tool',
      name: requiredToolId,
      type: 'tool',
      weight: 0,
      canonicalToolId: requiredToolId
    });
    const before = patient.timers.map(timer => timer.current);
    for (const unavailable of [{ broken: true, consumed: false }, { broken: false, consumed: true }]) {
      const toolStates: CanonicalToolState[] = [{
        instanceId: 'broken-forage:tool',
        toolId: requiredToolId,
        upgradeId: null,
        charges: null,
        ...unavailable,
        acquiredBy: 'test',
        appliedEffectIds: []
      }];
      const result = resolveForagingPostEncounterCheckpoint({
        patient,
        inventory,
        toolStates,
        timerCost: 1,
        manualEffectPending: false
      });

      expect(result.immediatelyTreatable).toBe(false);
      expect(result.timerApplied).toBe(true);
      expect(result.patient?.timers.map(timer => timer.current)).toEqual(before.map(value => value - 1));
    }
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
