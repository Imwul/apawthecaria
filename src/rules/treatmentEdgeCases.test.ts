import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  REAGENTS,
  canTreatAilmentWithInventory,
  createPatientArchiveRecord,
  previewTreatmentSelection,
  resolvePatient,
  resolveTimer,
  resolveTreatment,
  upsertPatientArchive,
  type CanonicalToolState,
  type EngineInventoryItem,
  type PatientState
} from './index';

const waenFixture = () => {
  const ailment = AILMENTS.find(row => row.canonicalName === 'Waen Drops')!;
  const patient = resolvePatient({ id: 'waen-edge', name: 'Patient', species: 'Vole', ailmentIds: [ailment.id] }).value!;
  const marigold = REAGENTS.find(row => row.canonicalName === 'Marigold')!;
  const beehive = REAGENTS.find(row => row.canonicalName === 'Beehive')!;
  const pain = marigold.preparations.find(part => part.tags.some(tag => tag.tag === 'PAIN' && tag.value >= 2))!;
  const fair = beehive.preparations.find(part => part.tags.some(tag => tag.tag === 'FAIR' && tag.value >= 3))!;
  const ingredients: EngineInventoryItem[] = [
    { id: 'pain', name: 'Marigold', type: 'reagent', weight: pain.weight, quantity: 1, canonicalReagentId: marigold.id, preparationId: pain.id, usesRemaining: pain.uses },
    { id: 'fair', name: 'Beehive', type: 'reagent', weight: fair.weight, quantity: 1, canonicalReagentId: beehive.id, preparationId: fair.id, usesRemaining: fair.uses }
  ];
  const requiredToolIds = [...new Set([pain, fair].flatMap(part => part.requiredTools).filter(id => id !== 'none'))];
  const tools: EngineInventoryItem[] = requiredToolIds.map(id => ({
    id: `tool:${id}`, name: id, type: 'tool', weight: 0, canonicalToolId: id
  }));
  return { ailment, patient, pain, fair, ingredients, tools };
};

const treatmentState = (patient: PatientState, inventory: EngineInventoryItem[]) => ({
  inventory,
  patient,
  reputation: 5,
  trinkets: 0,
  journalEvents: [],
  appliedTransactionIds: []
});

describe('Treatment and Patient edge-case transactions', () => {
  it('covers empty, one-missing, multi-missing, missing-Tool, exact, and excess Inventory previews', () => {
    const fixture = waenFixture();
    const preview = (selectedItemIds: string[], selectedToolIds: string[], inventory = [...fixture.ingredients, ...fixture.tools]) =>
      previewTreatmentSelection({
        patient: fixture.patient,
        ailmentInstanceId: fixture.patient.ailments[0].id,
        inventory,
        selectedItemIds,
        selectedToolIds
      });

    expect(preview([], []).ready).toBe(false);
    expect(preview(['pain'], fixture.tools.map(item => item.id)).messages.join(' ')).toMatch(/FAIR 3/i);
    expect(preview(['fair'], []).messages.join(' ')).toMatch(/PAIN 2/i);
    expect(preview(['pain', 'fair'], []).missingToolIds.length).toBeGreaterThan(0);
    expect(preview(fixture.ingredients.map(item => item.id), fixture.tools.map(item => item.id)).ready).toBe(true);

    const excess = fixture.ingredients.map(item => ({ ...item, quantity: 3 }));
    expect(preview(excess.map(item => item.id), fixture.tools.map(item => item.id), [...excess, ...fixture.tools]).ready).toBe(true);
  });

  it('consumes exactly one use, preserves stacked excess, and rejects spent or duplicate ingredients atomically', () => {
    const fixture = waenFixture();
    const input = (transactionId: string, inventory: EngineInventoryItem[], selectedItemIds = fixture.ingredients.map(item => item.id)) => ({
      mode: 'treat' as const,
      transactionId,
      state: treatmentState(fixture.patient, inventory),
      ailmentInstanceId: fixture.patient.ailments[0].id,
      selectedItemIds,
      selectedToolIds: fixture.tools.map(item => item.id),
      journalText: 'Edge-case treatment.'
    });

    const exact = resolveTreatment(input('exact', [...fixture.ingredients, ...fixture.tools]));
    expect(exact.value?.nextState.patient.status).toBe('cured');
    expect(exact.value?.nextState.inventory.filter(item => item.type === 'reagent')).toHaveLength(0);

    const stacked = fixture.ingredients.map(item => ({ ...item, quantity: 3, usesRemaining: 0 }));
    const excess = resolveTreatment(input('stacked', [...stacked, ...fixture.tools]));
    expect(excess.value?.nextState.inventory.filter(item => item.type === 'reagent'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'pain', quantity: 1, usesRemaining: 1 }),
        expect.objectContaining({ id: 'fair', quantity: 1, usesRemaining: 1 })
      ]));

    const spent = fixture.ingredients.map(item => ({ ...item, usesRemaining: 0 }));
    const spentResult = resolveTreatment(input('spent', [...spent, ...fixture.tools]));
    expect(spentResult.status).toBe('invalid');
    expect(spentResult.value).toBeNull();

    const duplicate = resolveTreatment(input('duplicate', [...fixture.ingredients, ...fixture.tools], ['pain', 'pain', 'fair']));
    expect(duplicate.status).toBe('invalid');
    expect(duplicate.value).toBeNull();
  });

  it('blocks broken Tool contributions in both preview and mutation layers', () => {
    const fixture = waenFixture();
    const required = fixture.tools[0];
    const broken: CanonicalToolState = {
      instanceId: required.id,
      toolId: required.canonicalToolId!,
      upgradeId: null,
      charges: null,
      broken: true,
      consumed: false,
      acquiredBy: 'test',
      appliedEffectIds: []
    };
    const preview = previewTreatmentSelection({
      patient: fixture.patient,
      ailmentInstanceId: fixture.patient.ailments[0].id,
      inventory: [...fixture.ingredients, ...fixture.tools],
      selectedItemIds: fixture.ingredients.map(item => item.id),
      selectedToolIds: fixture.tools.map(item => item.id),
      toolStates: [broken]
    });
    expect(preview.ready).toBe(false);
    expect(preview.missingToolIds).toContain(required.canonicalToolId);
    expect(canTreatAilmentWithInventory(
      fixture.patient,
      fixture.patient.ailments[0].id,
      [...fixture.ingredients, ...fixture.tools],
      [],
      [],
      [broken]
    )).toBe(false);

    const consumed = { ...broken, broken: false, consumed: true };
    expect(canTreatAilmentWithInventory(
      fixture.patient,
      fixture.patient.ailments[0].id,
      [...fixture.ingredients, ...fixture.tools],
      [],
      [],
      [consumed]
    )).toBe(false);

    const result = resolveTreatment({
      mode: 'treat', transactionId: 'broken-tool',
      state: { ...treatmentState(fixture.patient, [...fixture.ingredients, ...fixture.tools]), tools: [broken] },
      ailmentInstanceId: fixture.patient.ailments[0].id,
      selectedItemIds: fixture.ingredients.map(item => item.id),
      selectedToolIds: fixture.tools.map(item => item.id),
      journalText: 'A broken Tool cannot prepare the Part.'
    });
    expect(result.status).toBe('invalid');
    expect(result.value).toBeNull();
  });

  it('applies intact Fairwind Spices automatically and never applies a broken copy', () => {
    const fixture = waenFixture();
    const spice: EngineInventoryItem = {
      id: 'fairwind', name: 'Fairwind Spices', type: 'tool', weight: 1, canonicalToolId: 'fairwind-spices'
    };
    const spiceState = (broken: boolean): CanonicalToolState => ({
      instanceId: spice.id, toolId: 'fairwind-spices', upgradeId: null, charges: null,
      broken, consumed: false, acquiredBy: 'test', appliedEffectIds: []
    });
    const selectedToolIds = fixture.tools.map(item => item.id);
    const baseFair = fixture.fair.tags.filter(tag => tag.tag === 'FAIR').reduce((sum, tag) => sum + tag.value, 0);
    const intact = previewTreatmentSelection({
      patient: fixture.patient, ailmentInstanceId: fixture.patient.ailments[0].id,
      inventory: [...fixture.ingredients, ...fixture.tools, spice],
      selectedItemIds: fixture.ingredients.map(item => item.id), selectedToolIds,
      toolStates: [spiceState(false)]
    });
    expect(intact.fair).toBe(baseFair + 1);
    const broken = previewTreatmentSelection({
      patient: fixture.patient, ailmentInstanceId: fixture.patient.ailments[0].id,
      inventory: [...fixture.ingredients, ...fixture.tools, spice],
      selectedItemIds: fixture.ingredients.map(item => item.id), selectedToolIds,
      toolStates: [spiceState(true)]
    });
    expect(broken.fair).toBe(baseFair);
  });

  it('is idempotent across immediate repeats and serialized reloads', () => {
    const fixture = waenFixture();
    const baseInput = {
      mode: 'treat' as const,
      transactionId: 'reload-safe',
      state: treatmentState(fixture.patient, [...fixture.ingredients, ...fixture.tools]),
      ailmentInstanceId: fixture.patient.ailments[0].id,
      selectedItemIds: fixture.ingredients.map(item => item.id),
      selectedToolIds: fixture.tools.map(item => item.id),
      journalText: 'Committed once.'
    };
    const first = resolveTreatment(baseInput);
    const reloaded = JSON.parse(JSON.stringify(first.value!.nextState));
    const repeated = resolveTreatment({ ...baseInput, state: reloaded });
    expect(repeated.status).toBe('resolved');
    expect(repeated.value?.reputationChange).toBe(0);
    expect(repeated.value?.trinketReward).toBe(0);
    expect(repeated.value?.consumedItemIds).toEqual([]);
    expect(repeated.value?.nextState).toEqual(reloaded);

    const staleNewTransaction = resolveTreatment({ ...baseInput, transactionId: 'stale-new', state: reloaded });
    expect(staleNewTransaction.status).toBe('invalid');

    const nonStingshockDoubleDose = resolveTreatment({ ...baseInput, transactionId: 'wrong-double-dose', doseCount: 2 });
    expect(nonStingshockDoubleDose.status).toBe('invalid');
  });

  it('returns a safe invalid result for malformed Patient state and tolerates a missing legacy optional field', () => {
    const fixture = waenFixture();
    const malformed = { ...fixture.patient, ailments: undefined } as unknown as PatientState;
    const preview = previewTreatmentSelection({
      patient: malformed, ailmentInstanceId: 'missing', inventory: [], selectedItemIds: [], selectedToolIds: []
    });
    expect(preview.ready).toBe(false);
    expect(preview.messages.join(' ')).toMatch(/malformed/i);
    expect(resolveTreatment({
      mode: 'treat', transactionId: 'malformed-patient', state: treatmentState(malformed, []),
      ailmentInstanceId: 'missing', selectedItemIds: [], selectedToolIds: [], journalText: ''
    }).status).toBe('invalid');

    const legacyOptional = {
      ...fixture.patient,
      ailments: fixture.patient.ailments.map(ailment => ({ ...ailment, specialState: undefined }))
    } as unknown as PatientState;
    expect(previewTreatmentSelection({
      patient: legacyOptional, ailmentInstanceId: legacyOptional.ailments[0].id,
      inventory: [...fixture.ingredients, ...fixture.tools], selectedItemIds: fixture.ingredients.map(item => item.id),
      selectedToolIds: fixture.tools.map(item => item.id)
    }).ready).toBe(true);
  });

  it('applies a Timer failure once and rejects active, empty, duplicate, or already-closed failure requests', () => {
    const fixture = waenFixture();
    const activeFailure = resolveTreatment({
      mode: 'fail-expired', transactionId: 'active-failure', state: treatmentState(fixture.patient, []),
      ailmentInstanceIds: [fixture.patient.ailments[0].id], journalText: 'Too early.'
    });
    expect(activeFailure.status).toBe('invalid');

    const expired = resolveTimer({ patient: fixture.patient, hours: fixture.ailment.timer }).value!;
    expect(resolveTreatment({
      mode: 'fail-expired', transactionId: 'empty-failure', state: treatmentState(expired, []),
      ailmentInstanceIds: [], journalText: ''
    }).status).toBe('invalid');
    expect(resolveTreatment({
      mode: 'fail-expired', transactionId: 'duplicate-failure', state: treatmentState(expired, []),
      ailmentInstanceIds: [expired.ailments[0].id, expired.ailments[0].id], journalText: ''
    }).status).toBe('invalid');

    const first = resolveTreatment({
      mode: 'fail-expired', transactionId: 'expired-once', state: treatmentState(expired, fixture.ingredients),
      ailmentInstanceIds: [expired.ailments[0].id], journalText: 'Consequence recorded.'
    });
    expect(first.value?.reputationChange).toBe(-1);
    expect(first.value?.nextState.inventory).toEqual(fixture.ingredients);
    const closedAgain = resolveTreatment({
      mode: 'fail-expired', transactionId: 'expired-twice', state: first.value!.nextState,
      ailmentInstanceIds: [expired.ailments[0].id], journalText: 'Duplicate consequence.'
    });
    expect(closedAgain.status).toBe('invalid');
    expect(closedAgain.value).toBeNull();
  });

  it('supports the canonical Stingshock two-dose resolution using stacked Uses', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Stingshock')!;
    const patient = resolvePatient({ id: 'stingshock', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const rows = REAGENTS.flatMap(reagent => reagent.preparations.map(part => ({ reagent, part })));
    const ingredients: EngineInventoryItem[] = rows.map(({ reagent, part }, index) => ({
      id: `sting:${index}`, name: part.name, type: 'reagent', weight: part.weight,
      quantity: 2, canonicalReagentId: reagent.id, preparationId: part.id, usesRemaining: part.uses
    }));
    const toolIds = [...new Set(rows.flatMap(row => row.part.requiredTools).filter(id => id !== 'none'))];
    const tools: EngineInventoryItem[] = toolIds.map(id => ({ id: `sting-tool:${id}`, name: id, type: 'tool', weight: 0, canonicalToolId: id }));
    const result = resolveTreatment({
      mode: 'treat', transactionId: 'stingshock-double', state: treatmentState(patient, [...ingredients, ...tools]),
      ailmentInstanceId: patient.ailments[0].id,
      selectedItemIds: ingredients.map(item => item.id), selectedToolIds: tools.map(item => item.id),
      doseCount: 2, journalText: 'A spare full dose was prepared.'
    });
    expect(result.value?.nextState.patient.status).toBe('cured');
    expect(result.value?.reputationChange).toBe(5);
    rows.forEach(({ part }, index) => {
      const remaining = result.value?.nextState.inventory.find(item => item.id === `sting:${index}`);
      const expectedUses = part.uses * 2 - 2;
      if (expectedUses === 0) expect(remaining).toBeUndefined();
      else {
        const quantity = remaining?.quantity || 1;
        const totalUses = (remaining?.usesRemaining || 0) + Math.max(0, quantity - 1) * part.uses;
        expect(totalUses).toBe(expectedUses);
      }
    });
  });

  it('lets the existing Glass Alembic path become ready only for a valid shared Tag pair', () => {
    const ailment = AILMENTS.find(row => row.canonicalName === 'Anxious Scratching')!;
    const patient = resolvePatient({ id: 'alembic', name: 'Patient', species: 'Mouse', ailmentIds: [ailment.id] }).value!;
    const rows = REAGENTS.flatMap(reagent => reagent.preparations.map(part => ({ reagent, part })))
      .filter(row => !row.part.tags.some(tag => tag.tag === 'FOUL'));
    const moodRows = rows.filter(row => row.part.tags.some(tag => tag.tag === 'MOOD' && tag.value === 1)).slice(0, 2);
    const covering = rows.find(row => row.part.tags.some(tag => ['FUR', 'FEATHER', 'SCALE'].includes(tag.tag) && tag.value >= 1))!;
    expect(moodRows).toHaveLength(2);
    const selectedRows = [...moodRows, covering];
    const ingredients: EngineInventoryItem[] = selectedRows.map(({ reagent, part }, index) => ({
      id: `alembic:${index}`, name: part.name, type: 'reagent', weight: part.weight,
      canonicalReagentId: reagent.id, preparationId: part.id, usesRemaining: part.uses
    }));
    const toolIds = [...new Set(selectedRows.flatMap(row => row.part.requiredTools).filter(id => id !== 'none'))];
    const tools: EngineInventoryItem[] = [
      { id: 'alembic:tool', name: 'Glass Alembic', type: 'tool', weight: 2 / 3, canonicalToolId: 'glass-alembic' },
      ...toolIds.map(id => ({ id: `alembic-tool:${id}`, name: id, type: 'tool' as const, weight: 0, canonicalToolId: id }))
    ];
    const preview = previewTreatmentSelection({
      patient, ailmentInstanceId: patient.ailments[0].id, inventory: [...ingredients, ...tools],
      selectedItemIds: ingredients.map(item => item.id), selectedToolIds: tools.map(item => item.id)
    });
    expect(preview.ready).toBe(true);
    expect(preview.requiresCatalyse).toBe(true);
    expect(preview.catalyseTags).toContain('MOOD');

    const result = resolveTreatment({
      mode: 'treat', transactionId: 'alembic-treatment', state: treatmentState(patient, [...ingredients, ...tools]),
      ailmentInstanceId: patient.ailments[0].id,
      selectedItemIds: ingredients.map(item => item.id), selectedToolIds: tools.map(item => item.id),
      catalyse: [{ tag: 'MOOD', itemIds: [ingredients[0].id, ingredients[1].id] }],
      journalText: 'The two MOOD reagents were catalysed.'
    });
    expect(result.value?.providedTags.MOOD).toBe(2);
    expect(result.value?.nextState.patient.status).toBe('cured');
  });

  it('accumulates multi-Ailment Archive contributions without double-counting a repeated transaction', () => {
    const fixture = waenFixture();
    const initial = createPatientArchiveRecord({
      caseId: fixture.patient.id, patient: fixture.patient, location: 'Odoak', encounteredAt: 10,
      treatmentResult: 'pending', specialEffects: ['Diagnosis'], journalEntryIds: ['diagnosis']
    });
    const first = createPatientArchiveRecord({
      caseId: fixture.patient.id, patient: fixture.patient, location: 'Odoak', encounteredAt: 20,
      treatmentResult: 'pending', remedyParts: ['Marigold'], reward: { trinkets: 1, reputation: 1 },
      specialEffects: ['First remedy'], journalEntryIds: ['treatment-1'], transactionIds: ['tx-1']
    });
    const second = createPatientArchiveRecord({
      caseId: fixture.patient.id, patient: fixture.patient, location: 'Odoak', encounteredAt: 30,
      treatmentResult: 'success', remedyParts: ['Beehive'], reward: { trinkets: 2, reputation: 2 },
      specialEffects: ['Second remedy'], journalEntryIds: ['treatment-2'], transactionIds: ['tx-2']
    });
    const afterFirst = upsertPatientArchive([initial], first);
    const afterSecond = upsertPatientArchive(afterFirst, second);
    const replayed = upsertPatientArchive(afterSecond, second)[0];
    expect(replayed.encounteredAt).toBe(10);
    expect(replayed.remedyParts).toEqual(['Marigold', 'Beehive']);
    expect(replayed.reward).toEqual({ trinkets: 3, reputation: 3 });
    expect(replayed.specialEffects).toEqual(['Diagnosis', 'First remedy', 'Second remedy']);
    expect(replayed.journalEntryIds).toEqual(['diagnosis', 'treatment-1', 'treatment-2']);
    expect(replayed.transactionIds).toEqual(['tx-1', 'tx-2']);
  });
});
