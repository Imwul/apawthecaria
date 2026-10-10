import { describe, expect, it } from 'vitest';
import { FAMILIAR_BENEFITS } from '../rulesEngine';
import { calculateBarterBR, resolveBarterOffer, resolveBarterStart, type BarterRuntimeState, type BarterMapNode } from './barterEngine';
import { REAGENTS } from './data/reagents';
import { createReplacementAcquisition } from './leaveEngine';
import { resolvePatient } from './engine';

const chatty = FAMILIAR_BENEFITS.find(row => row.mechanic === 'chatty')!.name;
const shrewd = FAMILIAR_BENEFITS.find(row => row.mechanic === 'shrewd')!.name;
const graph: Record<string, BarterMapNode> = {
  town: { id: 'town', region: 'Forest', locationType: 'Settlement', neighbors: [] }
};
const reagent = REAGENTS.find(row => row.canonicalName === 'Beech')!;
const preparation = reagent.preparations.find(row => row.name === 'Bark')!;
const calculation = { targetReagentId: reagent.id, preparationId: preparation.id, locationId: 'town', season: 'Spring' as const, reputation: 0, graph };
const runtime = (): BarterRuntimeState => ({
  inventory: [], patient: resolvePatient({ id: 'patient', name: 'Rowan', species: 'Vole', ailmentIds: ['ailment-paw-rot'] }).value!,
  reputation: 0, trinkets: 0, attemptHistory: {}, pendingBarter: null, journalEvents: [], appliedTransactionIds: []
});

describe('p.14 Chatty Bartering benefit', () => {
  it('reduces the printed barter Rarity by 2 while preserving every other modifier', () => {
    const normal = calculateBarterBR(calculation);
    const familiar = calculateBarterBR({ ...calculation, familiarBenefit: chatty });
    expect(familiar.br).toBe(Math.max(0, normal.br - 2));
    expect(familiar.modifiers).toContainEqual({ id: 'familiar', label: 'Chatty', amount: -2 });
    expect(familiar.modifiers.filter(row => row.id !== 'familiar')).toEqual(normal.modifiers);
    expect(calculateBarterBR({ ...calculation, familiarBenefit: shrewd })).toEqual(normal);
  });

  it('uses the adjusted Rarity during the actual second-card decision after save/restore', () => {
    const state = runtime();
    const started = resolveBarterStart({
      ...calculation, transactionId: 'chatty:barter', state, patientId: state.patient.id,
      currentLocationId: 'town', familiarBenefit: chatty
    });
    expect(started.status).toBe('resolved');
    const restored = JSON.parse(JSON.stringify(started.value)) as BarterRuntimeState;
    restored.pendingBarter!.status = 'awaiting-second-card';
    const result = resolveBarterOffer({
      transactionId: 'chatty:draw', state: restored,
      card: Math.max(1, calculateBarterBR(calculation).br - 2)
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.pendingBarter?.status).toBe('completed');
    expect(result.value?.inventory).toHaveLength(1);
  });

  it('also applies the benefit to a BR 12 stand-in Reagent', () => {
    const state = runtime();
    const replacement = {
      ...createReplacementAcquisition({ targetTag: 'PAIN', requiredPotency: 1, name: 'Moon Sap', preparation: 'USED' }),
      patientId: state.patient.id, ailmentInstanceId: state.patient.ailments[0].id
    };
    const start = (familiarBenefit?: string) => resolveBarterStart({
      transactionId: 'replacement:barter', state, patientId: state.patient.id,
      targetReagentId: replacement.id, replacement, preparationId: `replacement:${replacement.id}`,
      currentLocationId: 'town', locationId: 'town', season: 'Spring', graph, familiarBenefit
    });
    const normal = start();
    const familiar = start(chatty);
    expect(familiar.value?.pendingBarter?.calculatedBR).toBe(normal.value!.pendingBarter!.calculatedBR - 2);
    expect(familiar.value?.pendingBarter?.modifiers).toContainEqual({ id: 'familiar', label: 'Chatty', amount: -2 });
  });
});

describe('p.115 Wingbreak Bartering Consequence', () => {
  it('adds 2 during the named Season and combines with Chatty, without stacking duplicate records', () => {
    const conditions = ['wingbreak:barter-rarity-plus-2:Spring', 'wingbreak:barter-rarity-plus-2:Spring'];
    const normal = calculateBarterBR(calculation);
    const injured = calculateBarterBR({ ...calculation, conditions });
    expect(injured.br).toBe(normal.br + 2);
    expect(injured.modifiers.filter(row => row.id === 'ailment')).toEqual([{ id: 'ailment', label: 'Wingbreak', amount: 2 }]);
    expect(calculateBarterBR({ ...calculation, conditions, familiarBenefit: chatty }).br).toBe(normal.br);
    expect(calculateBarterBR({ ...calculation, season: 'Summer', conditions })).toEqual(calculateBarterBR({ ...calculation, season: 'Summer' }));
  });

  it('applies the same current-Season penalty to a stand-in Reagent transaction', () => {
    const state = runtime();
    const replacement = {
      ...createReplacementAcquisition({ targetTag: 'PAIN', requiredPotency: 1, name: 'Moon Sap', preparation: 'USED' }),
      patientId: state.patient.id, ailmentInstanceId: state.patient.ailments[0].id
    };
    const start = (conditions?: string[]) => resolveBarterStart({
      transactionId: 'replacement:wingbreak', state, patientId: state.patient.id,
      targetReagentId: replacement.id, replacement, preparationId: `replacement:${replacement.id}`,
      currentLocationId: 'town', locationId: 'town', season: 'Spring', graph, conditions
    });
    expect(start(['wingbreak:barter-rarity-plus-2:Spring']).value?.pendingBarter?.calculatedBR)
      .toBe(start().value!.pendingBarter!.calculatedBR + 2);
  });
});
