import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  CURRENT_SCHEMA_VERSION,
  ENCOUNTERS,
  PRINTED_EFFECT_BY_OWNER,
  PRINTED_EFFECT_REGISTRY,
  createManualEffectDraft,
  executeEncounter,
  migrateSavedRulesState,
  resolveManualEffectTransaction,
  type ManualEffectDraft,
  type ManualResolutionRuntimeState
} from './index';

const encounterState = () => ({
  reputation: 6,
  trinkets: 4,
  calendarDays: 3,
  foragingPoints: 2,
  inventory: [],
  patient: null,
  movementBlocked: false,
  conditions: [],
  appliedEffectIds: []
});

const manualState = (): ManualResolutionRuntimeState => ({
  reputation: 6,
  trinkets: 4,
  calendarDays: 3,
  foragingPoints: 2,
  inventory: [{ id: 'item-1', name: 'Prepared Reagent', type: 'reagent', weight: 1 / 3, quantity: 1 }],
  patient: null,
  conditions: [],
  pendingFollowUps: [],
  appliedTransactionIds: []
});

const completeRequiredInputs = (draft: ManualEffectDraft): ManualEffectDraft => ({
  ...draft,
  inputValues: Object.fromEntries(draft.inputFields.filter(field => field.required).map(field => [
    field.id,
    field.type === 'condition' ? true : field.type === 'number' ? 1 : '원문에 따라 결정함'
  ])),
  resultSummary: '원문 조건과 선택을 확인해 결과를 정했다.',
  journalNote: '해당 효과의 선택과 결과를 여행 일지에 기록했다.'
});

describe('Step 2 printed-effect registry coverage', () => {
  it('[CORE-002/TRAVEL-009/FORAGE-006/TABLE-004/AILMENT-003] has one reachable row for every canonical owner', () => {
    expect(PRINTED_EFFECT_REGISTRY).toHaveLength(358);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'implemented')).toHaveLength(22);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'manual')).toHaveLength(336);
    expect(new Set(PRINTED_EFFECT_REGISTRY.map(row => `${row.ownerType}:${row.ownerId}`)).size).toBe(358);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'encounter' && ENCOUNTERS.find(owner => owner.id === row.ownerId)?.encounterType === 'travel')).toHaveLength(103);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'encounter' && ENCOUNTERS.find(owner => owner.id === row.ownerId)?.encounterType === 'foraging')).toHaveLength(144);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'encounter' && ENCOUNTERS.find(owner => owner.id === row.ownerId)?.encounterType === 'social')).toHaveLength(66);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'ailment')).toHaveLength(45);
    expect(PRINTED_EFFECT_BY_OWNER.get('travel-forest-9-10-spring')?.ownerName).toBe('Memories');
    expect(PRINTED_EFFECT_REGISTRY.every(row => !/^[.,;:]\s/.test(row.printedText))).toBe(true);
  });

  it('[CORE-002/UX-001] builds a source-complete, trigger-specific task for all 336 manual rows', () => {
    const manual = PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'manual');
    for (const effect of manual) {
      for (const trigger of effect.supportedTriggers) {
        const draft = createManualEffectDraft(effect, trigger, { continuation: 'none' }, 100);
        expect(draft.ownerId).toBe(effect.ownerId);
        expect(draft.sourcePage).toBe(effect.sourcePage);
        expect(draft.printedText.trim().length).toBeGreaterThan(0);
        expect(draft.ruleIds.length).toBeGreaterThan(0);
        expect(draft.resolutionInstruction).not.toMatch(/^resolve this effect manually\.?$/i);
        expect(draft.inputFields.length).toBeGreaterThan(0);
      }
    }
  });

  it('[TRAVEL-009/FORAGE-006/TABLE-004] sends every manual Encounter row through runtime resolution', () => {
    const manualEncounters = ENCOUNTERS.filter(encounter => PRINTED_EFFECT_BY_OWNER.get(encounter.id)?.status === 'manual');
    for (const encounter of manualEncounters) {
      const result = executeEncounter({
        transactionId: `reach:${encounter.id}`,
        encounter,
        choiceId: encounter.choices[0]?.id,
        state: encounterState()
      });
      expect(result.status, encounter.id).toBe('manual');
      expect(result.value?.unresolvedEffects.length, encounter.id).toBeGreaterThan(0);
    }
  });

  it('[AILMENT-003/AILMENT-005/AILMENT-007] builds every supported Named Ailment lifecycle task', () => {
    expect(AILMENTS).toHaveLength(45);
    for (const ailment of AILMENTS) {
      const effect = PRINTED_EFFECT_BY_OWNER.get(ailment.id)!;
      expect(effect).toBeDefined();
      for (const trigger of effect.supportedTriggers) {
        const draft = createManualEffectDraft(effect, trigger, {
          patientId: 'patient-1',
          ailmentInstanceId: `${ailment.id}:1`,
          continuation: 'ailment-close'
        }, 100);
        expect(draft.context.patientId).toBe('patient-1');
        expect(draft.trigger).toBe(trigger);
        expect(draft.printedText).toBe(effect.triggerText[trigger] || effect.printedText);
      }
    }
  });

  it('[AILMENT-003] does not mix diagnosis and failure instructions', () => {
    const brand = PRINTED_EFFECT_BY_OWNER.get('ailment-brand-care')!;
    const diagnosis = createManualEffectDraft(brand, 'diagnosis', {}, 100);
    const failure = createManualEffectDraft(brand, 'treatment-failure', {}, 100);
    expect(diagnosis.printedText).toContain('명성 2');
    expect(diagnosis.printedText).not.toContain('Overstay');
    expect(failure.printedText).toContain('Overstay');
    expect(failure.printedText).not.toContain('명성 2');
  });
});

describe('Step 2 manual resolution transaction', () => {
  const draftFor = (predicate: (draft: ManualEffectDraft) => boolean) => {
    for (const effect of PRINTED_EFFECT_REGISTRY.filter(row => row.manualResolution)) {
      for (const trigger of effect.supportedTriggers) {
        const draft = createManualEffectDraft(effect, trigger, { encounterTransactionId: 'source-transaction', continuation: 'none' }, 100);
        if (predicate(draft)) return draft;
      }
    }
    throw new Error('No matching manual effect fixture found.');
  };

  it('[CORE-002/UX-001] rejects resolution without required effect-specific input', () => {
    const draft = draftFor(candidate => candidate.inputFields.some(field => field.required));
    const result = resolveManualEffectTransaction({
      draft: { ...draft, resultSummary: '결과', journalNote: '기록' },
      transactionId: 'manual-required',
      state: manualState(),
      resolvedAt: 200
    });
    expect(result.status).toBe('invalid');
    expect(result.messages.join(' ')).toContain('Required resolution input');
  });

  it('[CORE-002/SAVE-004] previews and atomically applies a canonical action once', () => {
    const sourceDraft = draftFor(candidate => candidate.actionTemplates.some(action => action.kind === 'modify-reputation'));
    const action = sourceDraft.actionTemplates.find(candidate => candidate.kind === 'modify-reputation')!;
    const draft = completeRequiredInputs({ ...sourceDraft, selectedActionIds: [action.id] });
    const before = manualState();
    const result = resolveManualEffectTransaction({ draft, transactionId: 'manual-atomic', state: before, resolvedAt: 200 });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.reputation).toBe(Math.max(0, before.reputation + (action.amount || 0)));
    expect(result.value?.record.appliedActionIds).toEqual([action.id]);
    expect(result.value?.record.journalNote).toBe(draft.journalNote);
    expect(result.value?.nextState.appliedTransactionIds).toContain('manual-atomic');
    expect(before.reputation).toBe(6);

    const repeated = resolveManualEffectTransaction({ draft, transactionId: 'manual-atomic', state: result.value!.nextState, resolvedAt: 201 });
    expect(repeated.status).toBe('invalid');
  });

  it('[CORE-002/SAVE-004] leaves the entire state untouched when an action target is invalid', () => {
    const sourceDraft = draftFor(candidate => candidate.actionTemplates.some(action => action.kind === 'remove-inventory'));
    const action = sourceDraft.actionTemplates.find(candidate => candidate.kind === 'remove-inventory')!;
    const draft = completeRequiredInputs({ ...sourceDraft, selectedActionIds: [action.id], actionTargets: {} });
    const before = manualState();
    const result = resolveManualEffectTransaction({ draft, transactionId: 'manual-invalid-target', state: before, resolvedAt: 200 });
    expect(result.status).toBe('invalid');
    expect(before.inventory).toHaveLength(1);
    expect(before.appliedTransactionIds).toEqual([]);
  });

  it('[CORE-002/SAVE-004] records override separately from normal resolution', () => {
    const sourceDraft = draftFor(() => true);
    const draft = { ...completeRequiredInputs(sourceDraft), overrideReason: '테이블 합의로 서사 결과를 달리 적용했다.' };
    const result = resolveManualEffectTransaction({ draft, transactionId: 'manual-override', state: manualState(), override: true, resolvedAt: 200 });
    expect(result.status).toBe('resolved');
    expect(result.value?.record).toMatchObject({ status: 'overridden', override: true, overrideReason: draft.overrideReason });
    expect(result.value?.draft.status).toBe('overridden');
  });

  it('[CORE-002/SAVE-004] persists an explicit pending follow-up instead of burying it in the journal', () => {
    const sourceDraft = draftFor(candidate => candidate.followUpRequirements.length > 0);
    const draft = completeRequiredInputs({ ...sourceDraft, inputValues: { ...completeRequiredInputs(sourceDraft).inputValues, 'follow-up-result': '' } });
    const result = resolveManualEffectTransaction({ draft, transactionId: 'manual-follow-up', state: manualState(), resolvedAt: 200 });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.pendingFollowUps.length).toBeGreaterThan(0);
    expect(result.value?.nextState.pendingFollowUps[0]).toMatchObject({ effectId: draft.effectId, status: 'pending', transactionId: 'manual-follow-up' });
  });

  it('[SAVE-005/CORE-002] migrates a partial deferred v6 draft and restores every choice and target', () => {
    const sourceDraft = draftFor(candidate => candidate.actionTemplates.length > 0);
    const action = sourceDraft.actionTemplates[0];
    const deferred = {
      ...sourceDraft,
      status: 'deferred' as const,
      inputValues: { 'outcome-detail': '작성 중' },
      selectedActionIds: [action.id],
      actionTargets: { [action.id]: 'target-1' },
      updatedAt: 150
    };
    const migrated = migrateSavedRulesState({
      schemaVersion: 6,
      rulesetId: 'original-1e-3p',
      pendingManualEffect: null,
      manualEffectDraft: deferred,
      pendingManualFollowUps: [{ id: 'follow-up-1', status: 'pending' }],
      manualEffectRecords: [{ id: 'record-1', status: 'resolved' }]
    });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.manualEffectQueue).toHaveLength(1);
    expect(migrated.manualEffectQueue[0]).toMatchObject({
      effectId: deferred.effectId,
      status: 'deferred',
      inputValues: deferred.inputValues,
      selectedActionIds: [action.id],
      actionTargets: { [action.id]: 'target-1' }
    });
    expect(migrated.pendingManualFollowUps).toEqual([{ id: 'follow-up-1', status: 'pending' }]);
    expect(migrated.manualEffectRecords).toEqual([{ id: 'record-1', status: 'resolved' }]);
  });

  it('[TRAVEL-009/FORAGE-006/TABLE-004] covers seasonal, choice, follow-up, location, and state-changing Encounter examples', () => {
    const encounterEffects = PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'encounter' && row.status === 'manual');
    const examples = [
      encounterEffects.find(effect => ENCOUNTERS.find(row => row.id === effect.ownerId)?.season),
      encounterEffects.find(effect => effect.manualResolution?.choices.length),
      encounterEffects.find(effect => effect.manualResolution?.followUpRequirements.length),
      encounterEffects.find(effect => effect.manualResolution?.actionTemplates.some(action => action.targetType === 'location')),
      encounterEffects.find(effect => effect.manualResolution?.actionTemplates.some(action => action.kind === 'modify-reputation'))
    ];
    expect(examples.every(Boolean)).toBe(true);
    for (const effect of examples) {
      const encounter = ENCOUNTERS.find(row => row.id === effect!.ownerId)!;
      expect(executeEncounter({ transactionId: `representative:${encounter.id}`, encounter, choiceId: encounter.choices[0]?.id, state: encounterState() }).status).toBe('manual');
    }
  });
});
