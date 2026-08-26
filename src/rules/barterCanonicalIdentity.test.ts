import { describe, expect, it } from 'vitest';
import {
  REAGENT_BY_ID,
  canonicalMetadata,
  resolveBarterEncounter,
  resolveBarterOffer,
  resolveBarterPayment,
  resolveBarterStart,
  resolvePatient,
  type BarterMapNode,
  type BarterRuntimeState,
  type EncounterDefinition,
  type PatientState
} from './index';

const graph = (): Record<string, BarterMapNode> => ({
  meadow: { id: 'meadow', region: 'Meadow', locationType: 'Wilds', neighbors: ['city'] },
  city: { id: 'city', region: 'Forest', locationType: 'City', neighbors: ['meadow'] }
});

const patient = (): PatientState => resolvePatient({
  id: 'canonical-barter-patient',
  name: 'Bramble',
  species: 'Vole',
  ailmentIds: ['ailment-fight-marks']
}).value!;

const runtime = (): BarterRuntimeState => ({
  inventory: [],
  patient: patient(),
  reputation: 100,
  trinkets: 100,
  attemptHistory: {},
  pendingBarter: null,
  journalEvents: [],
  appliedTransactionIds: []
});

const socialEncounter: EncounterDefinition = {
  id: 'canonical-barter-social',
  encounterType: 'social',
  region: 'Forest',
  isSettlement: true,
  isTitan: false,
  locationType: 'City',
  suit: '♥',
  title: 'A careful merchant',
  prompt: 'The merchant lays out the requested Part.',
  mandatoryEffects: [],
  choices: [],
  support: 'implemented',
  ...canonicalMetadata(190)
};

const exactPart = (reagentId: string, preparationId: string) => {
  const reagent = REAGENT_BY_ID.get(reagentId)!;
  const preparation = reagent.preparations.find(row => row.id === preparationId)!;
  expect(reagent).toBeDefined();
  expect(preparation).toBeDefined();
  return { reagent, preparation };
};

const completeBarter = (
  state: BarterRuntimeState,
  reagentId: string,
  preparationId: string,
  transactionPrefix: string,
  offerValue = 12
): BarterRuntimeState => {
  const started = resolveBarterStart({
    transactionId: `${transactionPrefix}:start`,
    state,
    patientId: state.patient.id,
    targetReagentId: reagentId,
    preparationId,
    currentLocationId: 'city',
    locationId: 'city',
    season: 'Spring',
    graph: graph()
  });
  expect(started.status).toBe('resolved');
  expect(started.value?.pendingBarter).toMatchObject({ targetReagentId: reagentId, preparationId });

  const encountered = resolveBarterEncounter({
    transactionId: `${transactionPrefix}:social`,
    state: started.value!,
    card: { value: 7, suit: '♥' },
    encounter: socialEncounter
  });
  expect(encountered.status).toBe('resolved');

  const offered = resolveBarterOffer({
    transactionId: `${transactionPrefix}:offer`,
    state: encountered.value!,
    card: { value: offerValue, suit: '♦' }
  });
  expect(offered.status).toBe('resolved');
  if (offered.value?.pendingBarter?.status !== 'awaiting-payment') return offered.value!;

  const paymentRequired = offered.value.pendingBarter.paymentRequired;
  const paid = resolveBarterPayment({
    transactionId: `${transactionPrefix}:payment`,
    state: offered.value,
    payment: { trinkets: paymentRequired, reputation: 0 }
  });
  expect(paid.status).toBe('resolved');
  return paid.value!;
};

describe('canonical Barter transaction identity', () => {
  it('carries exact Nettles and both Roses/Rosehips choices into pending Barter state', () => {
    const choices = [
      ['reagent-nettles', 'nettles-leaves-brewed-1'],
      ['reagent-roses', 'roses-rosehips-crushed-3'],
      ['reagent-roses', 'roses-rosehips-distilled-4']
    ] as const;

    choices.forEach(([reagentId, preparationId], index) => {
      exactPart(reagentId, preparationId);
      const result = resolveBarterStart({
        transactionId: `exact-${index}`,
        state: runtime(),
        patientId: patient().id,
        targetReagentId: reagentId,
        preparationId,
        currentLocationId: 'city',
        locationId: 'city',
        season: 'Spring',
        graph: graph()
      });

      expect(result.status).toBe('resolved');
      expect(result.value?.pendingBarter).toMatchObject({ targetReagentId: reagentId, preparationId });
    });
  });

  it('rejects a preparation paired with the wrong reagent without mutating the input', () => {
    const state = runtime();
    const before = structuredClone(state);
    exactPart('reagent-roses', 'roses-rosehips-crushed-3');

    const result = resolveBarterStart({
      transactionId: 'mismatched-canonical-pair',
      state,
      patientId: state.patient.id,
      targetReagentId: 'reagent-nettles',
      preparationId: 'roses-rosehips-crushed-3',
      currentLocationId: 'city',
      locationId: 'city',
      season: 'Spring',
      graph: graph()
    });

    expect(result.status).toBe('invalid');
    expect(result.value).toBeNull();
    expect(state).toEqual(before);
    expect(state.appliedTransactionIds).toEqual([]);
    expect(state.attemptHistory).toEqual({});
  });

  it('acquires the exact selected preparation IDs without creating spelling variants', () => {
    const selected = [
      ['reagent-nettles', 'nettles-leaves-brewed-1'],
      ['reagent-roses', 'roses-rosehips-crushed-3'],
      ['reagent-roses', 'roses-rosehips-distilled-4']
    ] as const;
    const completed = selected.reduce(
      (state, [reagentId, preparationId], index) =>
        completeBarter(state, reagentId, preparationId, `acquire-${index}`),
      runtime()
    );
    const acquired = completed.inventory.filter(item => item.type === 'reagent');

    expect(acquired.map(item => [item.canonicalReagentId, item.preparationId])).toEqual(selected);
    expect(acquired.every(item => item.quantity === 1)).toBe(true);
    expect(acquired.every(item => item.provenance?.source === 'barter')).toBe(true);
    expect(acquired.every(item => item.provenance?.sourceTransactionId)).toBe(true);
    expect(acquired.filter(item => item.canonicalReagentId === 'reagent-roses').map(item => item.name)).toEqual([
      '장미 (Rosehips)',
      '장미 (Rosehips)'
    ]);
    expect(acquired.some(item => item.canonicalReagentId === 'reagent-rosehip')).toBe(false);
    expect(new Set(acquired.filter(item => item.canonicalReagentId === 'reagent-roses').map(item => item.name))).toHaveLength(1);
  });

  it('allows the same exact preparation to be acquired repeatedly within the City attempt limit', () => {
    const reagentId = 'reagent-nettles';
    const preparationId = 'nettles-stems-chewed-2';
    const once = completeBarter(runtime(), reagentId, preparationId, 'repeat-1');
    const twice = completeBarter(once, reagentId, preparationId, 'repeat-2');
    const matching = twice.inventory.filter(item =>
      item.canonicalReagentId === reagentId && item.preparationId === preparationId
    );

    expect(matching).toHaveLength(2);
    expect(new Set(matching.map(item => item.id)).size).toBe(2);
    expect(twice.attemptHistory[`${twice.patient.id}:city`]).toBe(2);
  });

  it('preserves exact identity through JSON reload and keeps repeated payment idempotent', () => {
    const reagentId = 'reagent-roses';
    const preparationId = 'roses-rosehips-distilled-4';
    const started = resolveBarterStart({
      transactionId: 'reload:start',
      state: { ...runtime(), reputation: 0 },
      patientId: patient().id,
      targetReagentId: reagentId,
      preparationId,
      currentLocationId: 'city',
      locationId: 'city',
      season: 'Spring',
      graph: graph()
    });
    const encountered = resolveBarterEncounter({
      transactionId: 'reload:social',
      state: started.value!,
      card: { value: 2, suit: '♥' },
      encounter: socialEncounter
    });
    const offered = resolveBarterOffer({
      transactionId: 'reload:offer',
      state: encountered.value!,
      card: { value: 1, suit: '♦' }
    });
    expect(offered.value?.pendingBarter?.status).toBe('awaiting-payment');
    const gap = offered.value!.pendingBarter!.paymentRequired;
    const paid = resolveBarterPayment({
      transactionId: 'reload:payment',
      state: offered.value!,
      payment: { trinkets: gap, reputation: 0 }
    });
    const reloaded = JSON.parse(JSON.stringify(paid.value)) as BarterRuntimeState;
    const acquired = reloaded.inventory.filter(item => item.type === 'reagent');

    expect(reloaded.pendingBarter).toMatchObject({
      targetReagentId: reagentId,
      preparationId,
      status: 'completed'
    });
    expect(acquired).toMatchObject([{ canonicalReagentId: reagentId, preparationId, quantity: 1 }]);

    const duplicate = resolveBarterPayment({
      transactionId: 'reload:payment',
      state: reloaded,
      payment: { trinkets: gap, reputation: 0 }
    });
    expect(duplicate.status).toBe('resolved');
    expect(duplicate.value).toBe(reloaded);
    expect(duplicate.value?.inventory).toEqual(acquired);
  });
});
