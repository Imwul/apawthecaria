import { describe, expect, it } from 'vitest';
import { ENCOUNTER_REMEDY_BY_ID } from './rules';
import {
  encounterRemedyBranchPlan,
  encounterRemedySuccessPlan,
  resolveEncounterRemedyTrigger
} from './encounterRemedyIntegration';

const remedy = (id: string) => ENCOUNTER_REMEDY_BY_ID.get(id)!;

describe('Encounter Remedy App integration decisions', () => {
  it('starts suit-bound Remedies only for their printed suits', () => {
    const talons = remedy('encounter-remedy-talons-trauma');
    expect(resolveEncounterRemedyTrigger(talons, [{ suit: '♣', value: 4 }]).status).toBe('start');
    expect(resolveEncounterRemedyTrigger(talons, [{ suit: '♦', value: 4 }]).status).toBe('skip');
    expect(resolveEncounterRemedyTrigger(talons, []).status).toBe('unresolved');
  });

  it('compares the Apothecary and opponent cards without inventing a tie result', () => {
    const biters = remedy('encounter-remedy-thousand-biters');
    expect(resolveEncounterRemedyTrigger(biters, [{ suit: '♥', value: 4 }, { suit: '♦', value: 8 }]).status).toBe('start');
    expect(resolveEncounterRemedyTrigger(biters, [{ suit: '♥', value: 9 }, { suit: '♦', value: 8 }]).status).toBe('skip');
    expect(resolveEncounterRemedyTrigger(biters, [{ suit: '♥', value: 12 }, { suit: '♠', value: 13 }])).toMatchObject({
      status: 'unresolved',
      reason: expect.stringContaining('tie')
    });
  });

  it('asks for contextual facts instead of guessing the Apothecary body or travel mode', () => {
    const deluge = remedy('encounter-remedy-deluge-cold');
    expect(resolveEncounterRemedyTrigger(deluge, []).status).toBe('ask-context');
    expect(resolveEncounterRemedyTrigger(deluge, [], true).status).toBe('start');
    expect(resolveEncounterRemedyTrigger(deluge, [], false).status).toBe('skip');
  });

  it('accounts for deterministic surrounding branch effects', () => {
    const fire = remedy('encounter-remedy-fire-and-iron-wound');
    const nonMonarch = resolveEncounterRemedyTrigger(fire, [{ suit: '♥', value: 11 }]);
    const monarch = resolveEncounterRemedyTrigger(fire, [{ suit: '♠', value: 13 }]);
    expect(encounterRemedyBranchPlan(fire, nonMonarch, [{ suit: '♥', value: 11 }], 'meadow')).toMatchObject({
      reputationDelta: 6,
      fullyHandled: true
    });
    expect(encounterRemedyBranchPlan(fire, monarch, [{ suit: '♠', value: 13 }], 'meadow')).toMatchObject({
      reputationDelta: 4,
      fullyHandled: true
    });
  });

  it('keeps only the non-Remedy remainder of Talons visible', () => {
    const talons = remedy('encounter-remedy-talons-trauma');
    const started = resolveEncounterRemedyTrigger(talons, [{ suit: '♠', value: 5 }]);
    const diamond = resolveEncounterRemedyTrigger(talons, [{ suit: '♦', value: 5 }]);
    expect(encounterRemedyBranchPlan(talons, started, [{ suit: '♠', value: 5 }], 'soar')).toMatchObject({
      fullyHandled: false,
      remainingInstruction: expect.stringContaining('중간 지점')
    });
    expect(encounterRemedyBranchPlan(talons, diamond, [{ suit: '♦', value: 5 }], 'soar')).toMatchObject({
      fullyHandled: false,
      remainingInstruction: expect.stringContaining('무게 1')
    });
  });

  it('maps every fixed success outcome to an explicit idempotent App plan', () => {
    expect(encounterRemedySuccessPlan({ code: 'HELPING_PAW', description: '' })).toMatchObject({ reputationDelta: 2, trinketDelta: 2 });
    expect(encounterRemedySuccessPlan({ code: 'IMMEDIATE_REMEDY_TIMER_COST', description: '' })).toMatchObject({ activeTimerDelta: -2 });
    expect(encounterRemedySuccessPlan({ code: 'BEAR_DEFERENCE', description: '' })).toMatchObject({ addCondition: 'bear-lord-deference' });
    expect(encounterRemedySuccessPlan({ code: 'RESTORE_FORAGING_POINTS', description: '' })?.removeConditionPrefix)
      .toBe('encounter-remedy:titan-rash-foraging-lock:');
  });
});
