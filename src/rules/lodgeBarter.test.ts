import { describe, expect, it } from 'vitest';
import {
  REAGENT_BY_ID,
  resolveBarterOffer,
  resolveBarterSkipSocialEncounter,
  resolveBarterStart,
  resolvePatient,
  type BarterMapNode,
  type BarterRuntimeState
} from './index';

const patient = resolvePatient({
  id: 'lodge-patient',
  name: 'Moss',
  species: 'Vole',
  ailmentIds: ['ailment-fight-marks']
}).value!;

const runtime: BarterRuntimeState = {
  inventory: [], patient, reputation: 0, trinkets: 0,
  attemptHistory: {}, pendingBarter: null, journalEvents: [], appliedTransactionIds: []
};

const graph: Record<string, BarterMapNode> = {
  lodge: { id: 'lodge', region: 'Loch', locationType: 'Settlement', neighbors: [] }
};

describe('Lodge of Wonders special Barter (p.171)', () => {
  it('skips only Wander the Streets and proceeds to the ordinary offer card', () => {
    const reagent = [...REAGENT_BY_ID.values()].find(row => row.type !== 'TITAN')!;
    const preparation = reagent.preparations[0];
    const started = resolveBarterStart({
      transactionId: 'lodge:start', state: runtime, patientId: patient.id,
      targetReagentId: reagent.id, preparationId: preparation.id,
      currentLocationId: 'lodge', locationId: 'lodge', season: 'Winter', graph
    });
    expect(started.value?.pendingBarter?.status).toBe('awaiting-social');

    const skipped = resolveBarterSkipSocialEncounter({
      transactionId: 'lodge:skip-step-2', state: started.value!
    });
    expect(skipped.value?.pendingBarter).toMatchObject({
      status: 'awaiting-second-card', socialStepSkipped: true,
      socialEncounter: null, firstCard: null
    });

    const offered = resolveBarterOffer({
      transactionId: 'lodge:offer', state: skipped.value!, card: { value: 13, suit: '♥' }
    });
    expect(offered.status).toBe('resolved');
    // Face cards use the rulebook value cap (K = 12), just like an ordinary
    // Barter offer drawn after Wander the Streets.
    expect(offered.value?.pendingBarter?.secondCard?.value).toBe(12);
  });

  it('is transaction-safe and cannot skip after the social step has passed', () => {
    expect(resolveBarterSkipSocialEncounter({ transactionId: '', state: runtime }).status).toBe('invalid');
    expect(resolveBarterSkipSocialEncounter({
      transactionId: 'late',
      state: { ...runtime, pendingBarter: { barterId: 'x', patientId: patient.id } as never }
    }).status).toBe('invalid');
  });
});
