import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  ENCOUNTER_REMEDIES,
  ENCOUNTER_REMEDY_BY_ID,
  REAGENTS,
  canTreatAilmentWithInventory,
  encounterRemediesForEncounter,
  getTreatmentAilmentDefinition,
  previewTreatmentSelection,
  resolveTimer,
  resolveTreatment,
  startFixedEncounterRemedy,
  type EngineInventoryItem,
  type PatientState,
  type RequirementExpression
} from './index';

const tagRequirements = (
  requirement: RequirementExpression
): Array<{ tag: string; threshold: number }> => {
  if (requirement.kind === 'tag') return [{ tag: requirement.tag, threshold: requirement.threshold }];
  if (requirement.kind === 'special') return [];
  if (requirement.kind === 'alternatives') return requirement.alternatives.flatMap(tagRequirements);
  return requirement.requirements.flatMap(tagRequirements);
};

const existingPatient = (): PatientState => ({
  id: 'patient-existing',
  name: 'Existing Patient',
  species: 'Vole',
  status: 'active',
  foragingPoints: 2,
  reagentsGathered: [],
  ailments: [{
    id: 'existing-ailment',
    ailmentId: AILMENTS[0].id,
    severity: AILMENTS[0].severity,
    timerIds: ['existing-timer'],
    conditionIds: [],
    treatmentHistoryIds: [],
    status: 'active',
    instance: 1,
    repeatIndex: 1,
    specialState: {},
    successResolved: false,
    failureResolved: false,
    consequenceResolved: false,
    effectIds: []
  }],
  timers: [{ id: 'existing-timer', ailmentInstanceId: 'existing-ailment', current: 6, maximum: 8, status: 'active' }],
  conditions: [],
  treatmentHistory: [],
  journalEvents: []
});

const reagentItem = (preparationId: string, id = preparationId): EngineInventoryItem => {
  const reagent = REAGENTS.find(row => row.preparations.some(part => part.id === preparationId))!;
  const preparation = reagent.preparations.find(part => part.id === preparationId)!;
  return {
    id,
    name: `${reagent.canonicalName} (${preparation.name})`,
    type: 'reagent',
    weight: preparation.weight,
    quantity: 1,
    canonicalReagentId: reagent.id,
    preparationId,
    usesRemaining: preparation.uses
  };
};

describe('Encounter-only fixed Remedies', () => {
  it('keeps special Remedies out of the normal Ailment draw pool', () => {
    const normalIds = new Set(AILMENTS.map(ailment => ailment.id));
    ENCOUNTER_REMEDIES
      .filter(remedy => remedy.canonicalAilmentId === null)
      .forEach(remedy => expect(normalIds.has(remedy.patientAilmentId), remedy.id).toBe(false));

    const tick = ENCOUNTER_REMEDY_BY_ID.get('encounter-remedy-little-biters-tick')!;
    expect(tick.canonicalAilmentId).toBe('ailment-tickbitten-twice-shy');
    expect(normalIds.has(tick.patientAilmentId)).toBe(true);
  });

  it('transcribes the fixed tag requirements, Timers, and deadlines from the Encounter pages', () => {
    const expected = [
      ['encounter-remedy-talons-trauma', 12, undefined, [['WOUND', 3], ['INFECTION', 2], ['PAIN', 2]]],
      ['encounter-remedy-titan-rash', null, 'until-treated', [['HIDE', 2], ['POISON', 1]]],
      ['encounter-remedy-fangs-with-wings', 8, undefined, [['HIDE', 2], ['POISON', 1]]],
      ['encounter-remedy-thousand-biters', null, 'before-move-on', [['HIDE', 2], ['POISON', 1]]],
      ['encounter-remedy-sick-tadpoles', null, 'before-highest-active-timer', [['TEMPERATURE', 2], ['INFECTION', 1]]],
      ['encounter-remedy-boreal-dancer-cut', null, 'immediate', [['WOUND', 2]]],
      ['encounter-remedy-fish-slap-wound', null, 'before-highest-active-timer', [['WOUND', 2]]],
      ['encounter-remedy-fire-and-iron-wound', null, 'immediate', [['WOUND', 2]]],
      ['encounter-remedy-deluge-cold', null, 'before-move-on', [['TEMPERATURE', 1]]],
      ['encounter-remedy-gas-leak-poison', null, 'immediate', [['POISON', 2]]]
    ] as const;

    expected.forEach(([id, timerHours, deadline, tags]) => {
      const definition = ENCOUNTER_REMEDY_BY_ID.get(id)!;
      expect(definition, id).toBeDefined();
      expect(definition.timerHours, id).toBe(timerHours);
      expect(definition.deadline, id).toBe(deadline);
      expect(tagRequirements(definition.requirements), id).toEqual(
        tags.map(([tag, threshold]) => ({ tag, threshold }))
      );
    });
  });

  it('preserves the Bear Lord requirements as two separate INFECTION 3 doses', () => {
    const bear = ENCOUNTER_REMEDY_BY_ID.get('encounter-remedy-bear-lord')!;
    expect(bear.timerHours).toBe(8);
    expect(bear.requirements).toMatchObject({
      kind: 'allOf',
      requirements: [
        { kind: 'special', code: 'TWO_SEPARATE_INFECTION_3_DOSES' },
        { kind: 'tag', tag: 'PAIN', threshold: 2 }
      ]
    });
    expect(bear.requirementDoses).toEqual([
      { id: 'infection-dose-1', requirement: { kind: 'tag', tag: 'INFECTION', threshold: 3 } },
      { id: 'infection-dose-2', requirement: { kind: 'tag', tag: 'INFECTION', threshold: 3 } }
    ]);
  });

  it('indexes every Talons season and only returns a matching choice when one is supplied', () => {
    expect(encounterRemediesForEncounter('travel-soar-9-10-spring', 'outmanoeuvre'))
      .toEqual([ENCOUNTER_REMEDY_BY_ID.get('encounter-remedy-talons-trauma')]);
    expect(encounterRemediesForEncounter('travel-soar-9-10-spring', 'another-choice')).toEqual([]);
    expect(ENCOUNTER_REMEDY_BY_ID.get('encounter-remedy-gas-leak-poison')?.trigger)
      .toMatchObject({ condition: 'spade', afterEveryEncounterUntilMoveOn: true });
  });

  it('starts a timer-bearing fixed Remedy idempotently and preserves source-grounded outcome metadata', () => {
    const started = startFixedEncounterRemedy({
      transactionId: 'talons:one',
      patient: existingPatient(),
      remedyId: 'encounter-remedy-talons-trauma',
      encounterId: 'travel-soar-9-10-summer',
      choiceId: 'outmanoeuvre',
      patientName: '약제사',
      species: '수달',
      context: '바다 독수리에게서 추락함',
      timerBonus: 2
    });

    expect(started.status).toBe('resolved');
    expect(started.value?.timerId).toBeTruthy();
    expect(started.value?.patient.timers[0]).toMatchObject({ current: 14, maximum: 14, status: 'active' });
    expect(started.value?.patient.timers.slice(1)).toEqual(existingPatient().timers);
    expect(started.value?.patient.ailments[0]).toMatchObject({
      ailmentId: 'encounter-remedy-talons-trauma',
      timerIds: [started.value?.timerId],
      specialState: {
        sourceEncounterId: 'travel-soar-9-10-summer',
        sourceEncounterChoiceId: 'outmanoeuvre',
        encounterRemedy: true,
        rewardMode: 'none',
        timerKind: 'fixed',
        failureOutcome: { code: 'APOTHECARY_DIES' }
      }
    });

    const replayed = startFixedEncounterRemedy({
      transactionId: 'talons:one',
      patient: started.value!.patient,
      remedyId: 'encounter-remedy-talons-trauma',
      encounterId: 'travel-soar-9-10-summer',
      choiceId: 'outmanoeuvre',
      patientName: '약제사',
      species: '수달',
      context: '바다 독수리에게서 추락함'
    });
    expect(replayed.value?.patient).toEqual(started.value?.patient);
    expect(replayed.messages).toContain('Fixed Encounter Remedy was already started.');
  });

  it('represents a no-Timer Remedy with no timer record, not an expired Timer at zero', () => {
    const patient = existingPatient();
    const started = startFixedEncounterRemedy({
      transactionId: 'titan-rash:one',
      patient,
      remedyId: 'encounter-remedy-titan-rash',
      encounterId: 'travel-titan-7-8',
      choiceId: 'duty-calls',
      patientName: '약제사',
      species: '수달',
      context: '티탄 유적의 자극성 물질에 노출됨',
      timerBonus: 99,
      specialState: {
        successOutcome: { code: 'CUSTOM_SUCCESS', description: 'Caller-supplied source interpretation.' }
      }
    });

    expect(started.value?.timerId).toBeNull();
    expect(started.value?.patient.timers).toEqual(patient.timers);
    expect(started.value?.patient.ailments[0]).toMatchObject({
      timerIds: [],
      specialState: {
        timerKind: 'none',
        deadline: 'until-treated',
        successOutcome: { code: 'CUSTOM_SUCCESS' },
        failureOutcome: null
      }
    });
  });

  it('rejects unknown Remedies and encounter/choice mismatches without mutating the patient', () => {
    const patient = existingPatient();
    const unknown = startFixedEncounterRemedy({
      transactionId: 'unknown', patient, remedyId: 'missing', encounterId: 'foraging-meadow-3',
      patientName: '약제사', species: '수달', context: ''
    });
    expect(unknown).toMatchObject({ status: 'invalid', value: null });

    const mismatch = startFixedEncounterRemedy({
      transactionId: 'mismatch', patient, remedyId: 'encounter-remedy-little-biters-tick',
      encounterId: 'foraging-meadow-3', choiceId: 'tick-check',
      patientName: '약제사', species: '수달', context: ''
    });
    expect(mismatch).toMatchObject({ status: 'invalid', value: null });
    expect(patient.ailments).toHaveLength(1);
  });

  it('exposes an Ailment-compatible treatment view without adding the Remedy to AILMENTS', () => {
    const view = getTreatmentAilmentDefinition('encounter-remedy-boreal-dancer-cut');
    expect(view).toMatchObject({
      id: 'encounter-remedy-boreal-dancer-cut',
      canonicalName: 'Blades of the Boreal Dancer Cut',
      displayName: 'Boreal Dancer · 베인 상처',
      encounterOnly: true,
      sourcePage: 165,
      requirements: { kind: 'tag', tag: 'WOUND', threshold: 2 }
    });
    expect(AILMENTS.some(row => row.id === view?.id)).toBe(false);
    expect(getTreatmentAilmentDefinition('ailment-tickbitten-twice-shy')).toMatchObject({
      canonicalName: 'Tickbitten, Twice Shy',
      encounterOnly: false
    });
  });

  it('previews, validates, consumes, and resolves an encounter-only fixed Remedy with no normal rewards', () => {
    const started = startFixedEncounterRemedy({
      transactionId: 'boreal:patient',
      patient: null,
      remedyId: 'encounter-remedy-boreal-dancer-cut',
      encounterId: 'foraging-forest-9-winter',
      choiceId: 'dodge',
      patientName: '약제사',
      species: '수달',
      context: '고드름에 베임'
    }).value!;
    const wound = reagentItem('hidelendings-slivers-used-1', 'wound-remedy');
    const preview = previewTreatmentSelection({
      patient: started.patient,
      ailmentInstanceId: started.ailmentInstanceId,
      inventory: [wound],
      selectedItemIds: [wound.id],
      selectedToolIds: []
    });
    expect(preview).toMatchObject({ ready: true, providedTags: { WOUND: 2 } });
    expect(canTreatAilmentWithInventory(started.patient, started.ailmentInstanceId, [wound])).toBe(true);

    const resolved = resolveTreatment({
      mode: 'treat',
      transactionId: 'boreal:treatment',
      state: {
        inventory: [wound], patient: started.patient, reputation: 11, trinkets: 4,
        journalEvents: [], appliedTransactionIds: []
      },
      ailmentInstanceId: started.ailmentInstanceId,
      selectedItemIds: [wound.id],
      selectedToolIds: [],
      journalText: '상처를 씻고 감쌌다.'
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value).toMatchObject({
      reputationChange: 0,
      trinketReward: 0,
      consumedItemIds: [wound.id],
      nextState: {
        reputation: 11,
        trinkets: 4,
        inventory: [{ id: wound.id, quantity: 1, usesRemaining: 2 }]
      }
    });
    expect(resolved.value?.nextState.patient.ailments[0].status).toBe('treated');
  });

  it('rejects a fixed Remedy when the selected Reagents do not satisfy its printed tags', () => {
    const started = startFixedEncounterRemedy({
      transactionId: 'gas:patient', patient: null,
      remedyId: 'encounter-remedy-gas-leak-poison', encounterId: 'foraging-titan-3', choiceId: 'rush',
      patientName: '약제사', species: '수달', context: '가스에 노출됨'
    }).value!;
    const wrong = reagentItem('hidelendings-slivers-used-1', 'wrong-remedy');
    const preview = previewTreatmentSelection({
      patient: started.patient, ailmentInstanceId: started.ailmentInstanceId,
      inventory: [wrong], selectedItemIds: [wrong.id], selectedToolIds: []
    });
    expect(preview.ready).toBe(false);
    expect(preview.messages.join(' ')).toContain('POISON 2');
    expect(canTreatAilmentWithInventory(started.patient, started.ailmentInstanceId, [wrong])).toBe(false);

    const resolved = resolveTreatment({
      mode: 'treat', transactionId: 'gas:treatment',
      state: { inventory: [wrong], patient: started.patient, reputation: 11, trinkets: 4, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: started.ailmentInstanceId,
      selectedItemIds: [wrong.id], selectedToolIds: [], journalText: ''
    });
    expect(resolved.status).toBe('invalid');
    expect(resolved.value).toBeNull();
  });

  it('never treats the Bear Lord as complete from one aggregate INFECTION selection', () => {
    const started = startFixedEncounterRemedy({
      transactionId: 'bear:patient', patient: null,
      remedyId: 'encounter-remedy-bear-lord', encounterId: 'foraging-mountain-m-winter', choiceId: 'start-ailment',
      patientName: '곰 영주', species: '곰', context: '검은 핏줄의 감염'
    }).value!;
    const infection = reagentItem('maggots-larvae-used-1', 'infection-dose');
    const pain = reagentItem('ironslug-guts-used-1', 'pain-dose');
    const inventory = [infection, pain];
    const preview = previewTreatmentSelection({
      patient: started.patient, ailmentInstanceId: started.ailmentInstanceId,
      inventory, selectedItemIds: inventory.map(item => item.id), selectedToolIds: []
    });
    expect(preview.ready).toBe(false);
    expect(preview.messages.join(' ')).toContain('separately prepared doses');
    expect(canTreatAilmentWithInventory(started.patient, started.ailmentInstanceId, inventory)).toBe(false);

    const resolved = resolveTreatment({
      mode: 'treat', transactionId: 'bear:treatment',
      state: { inventory, patient: started.patient, reputation: 11, trinkets: 4, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceId: started.ailmentInstanceId,
      selectedItemIds: inventory.map(item => item.id), selectedToolIds: [], journalText: '',
      confirmedManualRequirements: ['TWO_SEPARATE_INFECTION_3_DOSES']
    });
    expect(resolved.status).toBe('manual');
    expect(resolved.value).toBeNull();
    expect(resolved.messages.join(' ')).toContain('separately prepared doses');
  });

  it('never applies a normal Severity reputation penalty when a fixed Encounter Remedy Timer expires', () => {
    const started = startFixedEncounterRemedy({
      transactionId: 'talons:failure-patient', patient: null,
      remedyId: 'encounter-remedy-talons-trauma', encounterId: 'travel-soar-9-10-winter', choiceId: 'outmanoeuvre',
      patientName: '약제사', species: '수달', context: '바다 독수리에게서 추락함'
    }).value!;
    const expired = resolveTimer({ patient: started.patient, hours: 12 }).value!;
    const failed = resolveTreatment({
      mode: 'fail-expired', transactionId: 'talons:failure',
      state: { inventory: [], patient: expired, reputation: 11, trinkets: 4, journalEvents: [], appliedTransactionIds: [] },
      ailmentInstanceIds: [started.ailmentInstanceId], journalText: '인쇄된 사망 결과를 이어서 처리합니다.'
    });
    expect(failed.status).toBe('manual');
    expect(failed.value).toMatchObject({ reputationChange: 0, nextState: { reputation: 11, trinkets: 4 } });
  });
});
