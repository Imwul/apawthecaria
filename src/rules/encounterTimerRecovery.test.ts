import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from './data/encounters';
import { executeEncounter } from './encounterEngine';
import { resolvePatient } from './engine';
import type { EncounterRuntimeState } from './gameplay';
import { resolveExpiredPatientAfterTimer, unsettledExpiredAilmentIds } from './patientFailureRecovery';
import type { EncounterChoice } from './types';

const runtime = (choice: EncounterChoice, hours = 1): EncounterRuntimeState => {
  const patient = resolvePatient({ id: 'release-patient', name: 'Moss', species: 'Dormouse', ailmentIds: ['ailment-safety-stench'] }).value!;
  return {
    patient: { ...patient, timers: patient.timers.map(timer => ({ ...timer, current: hours, maximum: 10 })) },
    reputation: choice.requirements?.minGuildReputation ?? choice.requirements?.maxGuildReputation ?? 12,
    trinkets: 99, calendarDays: 0, foragingPoints: 0, inventory: [], movementBlocked: true,
    conditions: choice.requirements?.requiredConditionId ? [choice.requirements.requiredConditionId] : [],
    appliedEffectIds: []
  };
};

const settle = (transactionId: string, state: EncounterRuntimeState) => resolveExpiredPatientAfterTimer({
  transactionId,
  state: {
    inventory: state.inventory, patient: state.patient!, reputation: state.reputation,
    trinkets: state.trinkets, foragingPoints: state.foragingPoints,
    currentRegion: 'Bog', adjacentRegions: [], pendingObligation: null, journalEvents: [],
    appliedTransactionIds: [], activePatientId: state.patient!.id,
    patientArchive: [], archiveContext: { location: 'Newdam', encounteredAt: 1, resolvedAt: 2, sourceJourneyId: 'journey-release' }
  }
});

describe('printed Encounter Timer expiry settlement', () => {
  it('settles Stagnant Pitch In reward, failure penalty, Archive and leaving exactly once', () => {
    const encounter = ENCOUNTERS.find(row => row.id === 'social-bog-winter-♣')!;
    const choice = encounter.choices.find(row => row.id === 'pitch-in-briefly')!;
    const executed = executeEncounter({ transactionId: 'stagnant', encounter, choiceId: choice.id, state: runtime(choice) });
    expect(executed.value?.nextState.reputation).toBe(13);
    expect(executed.value?.nextState.patient?.timers[0].current).toBe(0);
    const recovered = settle('stagnant:expiry', executed.value!.nextState);
    expect(recovered.value?.nextState).toMatchObject({ reputation: 12, activePatientId: null, patient: { status: 'failed' } });
    expect(recovered.value?.nextState.patient.ailments[0]).toMatchObject({ status: 'failed', consequenceResolved: true });
    expect(recovered.value?.nextState.patientArchive?.[0]).toMatchObject({ status: 'failed', penalty: { reputation: 1 } });
    const reloaded = JSON.parse(JSON.stringify(recovered.value!.nextState));
    const replay = resolveExpiredPatientAfterTimer({ transactionId: 'stagnant:expiry', state: reloaded });
    expect(replay.value?.nextState.reputation).toBe(12);
    expect(replay.value?.expiredAilmentInstanceIds).toEqual([]);
  });

  it('retains an unexpired case and prevents protected Timer costs from causing failure', () => {
    const encounter = ENCOUNTERS.find(row => row.id === 'social-bog-winter-♣')!;
    const choice = encounter.choices.find(row => row.id === 'pitch-in-briefly')!;
    for (const protection of [undefined, 'negative'] as const) {
      const executed = executeEncounter({ transactionId: `stagnant:${protection}`, encounter, choiceId: choice.id, state: runtime(choice, 2), protection });
      expect(executed.value?.nextState.patient?.timers[0].current).toBe(protection ? 2 : 1);
      expect(unsettledExpiredAilmentIds(executed.value!.nextState.patient!)).toEqual([]);
      expect(settle('not-expired', executed.value!.nextState).value?.nextState.activePatientId).toBe('release-patient');
    }
  });

  const timerBranches = ENCOUNTERS.flatMap(encounter => encounter.choices
    .filter(choice => [...encounter.mandatoryEffects, ...choice.effects]
      .some(row => row.support === 'implemented' && row.effect.type === 'modifyTimer' && row.effect.amount < 0))
    .map(choice => ({ encounter, choice })));

  it('covers every table containing implemented negative Timer choices', () => {
    expect(timerBranches.length).toBeGreaterThan(20);
    expect(new Set(timerBranches.map(row => row.encounter.encounterType))).toEqual(new Set(['social', 'foraging']));
  });

  it.each(timerBranches)('$encounter.id / $choice.id settles every applied negative Timer branch', ({ encounter, choice }) => {
    const executed = executeEncounter({ transactionId: `${encounter.id}:${choice.id}`, encounter, choiceId: choice.id, state: runtime(choice) });
    expect(executed.value, executed.messages.join('\n')).not.toBeNull();
    const nextState = executed.value!.nextState;
    expect(unsettledExpiredAilmentIds(nextState.patient!)).not.toEqual([]);
    const recovered = settle(`${encounter.id}:${choice.id}:expiry`, nextState);
    expect(recovered.value, recovered.messages.join('\n')).not.toBeNull();
    expect(recovered.value?.closed).toBe(true);
    expect(recovered.value?.nextState.patient.status).toBe('failed');
    expect(recovered.value?.nextState.patient.ailments.every(row => row.consequenceResolved)).toBe(true);
    expect(recovered.value?.nextState.reputation).toBe(Math.max(0, nextState.reputation - 1));
  });
});
