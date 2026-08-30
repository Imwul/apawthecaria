import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  CURRENT_SCHEMA_VERSION,
  ENCOUNTERS,
  PRINTED_EFFECT_BY_OWNER,
  PRINTED_EFFECT_REGISTRY,
  createManualEffectDraft,
  encounterChoiceAvailability,
  executeEncounter,
  migrateSavedRulesState,
  normalizePendingManualFollowUp,
  resolveDeliveryFollowUpsAtLocation,
  resolveManualEffectTransaction,
  type ManualEffectDraft,
  type ManualResolutionRuntimeState
} from './index';
import { scopeManualEffectDraftForEncounterChoice } from '../manualEffectDraftState';

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
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'implemented')).toHaveLength(46);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'manual')).toHaveLength(312);
    expect(new Set(PRINTED_EFFECT_REGISTRY.map(row => `${row.ownerType}:${row.ownerId}`)).size).toBe(358);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'encounter' && ENCOUNTERS.find(owner => owner.id === row.ownerId)?.encounterType === 'travel')).toHaveLength(103);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'encounter' && ENCOUNTERS.find(owner => owner.id === row.ownerId)?.encounterType === 'foraging')).toHaveLength(144);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'encounter' && ENCOUNTERS.find(owner => owner.id === row.ownerId)?.encounterType === 'social')).toHaveLength(66);
    expect(PRINTED_EFFECT_REGISTRY.filter(row => row.ownerType === 'ailment')).toHaveLength(45);
    expect(PRINTED_EFFECT_BY_OWNER.get('travel-forest-9-10-spring')?.ownerName).toBe('Memories');
    expect(PRINTED_EFFECT_REGISTRY.every(row => !/^[.,;:]\s/.test(row.printedText))).toBe(true);
  });

  it('[CORE-002/UX-001] builds a source-complete, trigger-specific task for every manual row', () => {
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

  it('[CORE-002/UX-001] gives each affected item or map target one canonical input owner', () => {
    for (const effect of PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'manual')) {
      for (const trigger of effect.supportedTriggers) {
        const draft = createManualEffectDraft(effect, trigger, { continuation: 'none' }, 100);
        if (draft.actionTemplates.some(action => action.targetType === 'inventory-item' || action.kind === 'gain-inventory')) {
          expect(draft.inputFields.some(field => field.id === 'resource-item'), effect.ownerId).toBe(false);
        }
        if (draft.actionTemplates.some(action => action.targetType === 'location')) {
          expect(draft.inputFields.some(field => field.id === 'map-target'), effect.ownerId).toBe(false);
        }
      }
    }
  });

  it('[CORE-002 p.7] keeps prose inputs optional and preserves every printed encounter branch', () => {
    for (const effect of PRINTED_EFFECT_REGISTRY.filter(row => row.manualResolution)) {
      expect(effect.manualResolution!.inputFields
        .filter(field => field.type === 'free-text')
        .every(field => field.required === false), effect.ownerId).toBe(true);
      if (effect.ownerType !== 'encounter') continue;
      const encounter = ENCOUNTERS.find(row => row.id === effect.ownerId)!;
      expect(effect.optionalChoices.map(choice => choice.id), effect.ownerId).toEqual(
        encounter.choices.filter(choice => choice.id !== 'continue').map(choice => choice.id)
      );
    }
  });

  it('[TRAVEL-009/FORAGE-006/TABLE-004] sends every manual Encounter row through runtime resolution', () => {
    const manualEncounters = ENCOUNTERS.filter(encounter => PRINTED_EFFECT_BY_OWNER.get(encounter.id)?.status === 'manual');
    for (const encounter of manualEncounters) {
      const state = encounterState();
      const firstChoice = encounter.choices.find(choice => encounterChoiceAvailability(choice, state).available);
      const result = executeEncounter({
        transactionId: `reach:${encounter.id}`,
        encounter,
        choiceId: firstChoice?.id,
        journalAcknowledged: true,
        state
      });
      expect(result.status, encounter.id).not.toBe('invalid');
      expect(result.value, encounter.id).toBeTruthy();
      const leftover = (firstChoice?.effects || []).some(effect => effect.support !== 'implemented')
        || encounter.mandatoryEffects.some(effect => effect.support !== 'implemented');
      if (leftover) {
        expect(result.status, encounter.id).toBe('manual');
        expect(result.value?.unresolvedEffects.length, encounter.id).toBeGreaterThan(0);
      }
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
    const draft = scopeManualEffectDraftForEncounterChoice(createManualEffectDraft(
      PRINTED_EFFECT_BY_OWNER.get('travel-meadow-7-8')!,
      'encounter',
      { encounterTransactionId: 'source-transaction', encounterChoiceId: 'deliver-the-parcel', continuation: 'travel' },
      100
    ));
    const result = resolveManualEffectTransaction({
      draft: { ...draft, inputValues: {} },
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

  it('[CORE-002 p.7] resolves without prose fields and stores a canonical system summary', () => {
    const sourceDraft = createManualEffectDraft(
      PRINTED_EFFECT_BY_OWNER.get('social-forest-spring-♣')!,
      'encounter',
      { encounterTransactionId: 'optional-journal', continuation: 'none' },
      100
    );
    const result = resolveManualEffectTransaction({
      draft: sourceDraft,
      transactionId: 'optional-journal:resolve',
      state: manualState(),
      resolvedAt: 200
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.record.resultSummary).toContain('추가 상태 변화 없음');
    expect(result.value?.record.journalNote).toBe('');
    expect(result.value?.draft.resultSummary).toBe(result.value?.record.resultSummary);
  });

  it('[FORAGE-006/SAVE-004] applies the printed Startle reset to zero exactly once', () => {
    const sourceDraft = createManualEffectDraft(
      PRINTED_EFFECT_BY_OWNER.get('foraging-loch-9-autumn')!,
      'encounter',
      { encounterTransactionId: 'startle', encounterChoiceId: 'startle', continuation: 'foraging' },
      100
    );
    const draft = scopeManualEffectDraftForEncounterChoice(sourceDraft);
    expect(draft.actionTemplates).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'set-foraging-points', amount: 0, required: true }),
      expect.objectContaining({ kind: 'record-condition', required: true })
    ]));
    const result = resolveManualEffectTransaction({
      draft,
      transactionId: 'startle:resolve',
      state: { ...manualState(), foragingPoints: 7 },
      resolvedAt: 200
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.foragingPoints).toBe(0);
    expect(result.value?.nextState.conditions.join(' ')).toMatch(/second Forage does not decrease your Timers/i);
    const repeated = resolveManualEffectTransaction({
      draft,
      transactionId: 'startle:resolve',
      state: result.value!.nextState,
      resolvedAt: 201
    });
    expect(repeated.status).toBe('invalid');
  });

  it('[FORAGE-006] keeps both Blackwater funeral changes available for manual recording', () => {
    const effect = PRINTED_EFFECT_BY_OWNER.get('foraging-loch-8')!;
    const draft = createManualEffectDraft(effect, 'encounter', { continuation: 'none' }, 100);
    expect(draft.actionTemplates).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'modify-timer', amount: -1, targetType: 'timer' }),
      expect.objectContaining({ kind: 'modify-reputation', amount: 1 })
    ]));
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

  it('[CORE-002/SAVE-004] adds a named printed Bag item instead of leaving a duplicate follow-up', () => {
    const sourceDraft = createManualEffectDraft(
      PRINTED_EFFECT_BY_OWNER.get('travel-meadow-7-8')!,
      'encounter',
      { encounterTransactionId: 'parcel-encounter', continuation: 'travel' },
      100
    );
    const action = sourceDraft.actionTemplates.find(candidate =>
      candidate.kind === 'gain-inventory' && /to\s+(?:your\s+)?bags?/i.test(candidate.sourceText)
    )!;
    const draft = completeRequiredInputs({
      ...sourceDraft,
      selectedActionIds: [action.id],
      actionTargets: { [action.id]: 'Parcel' }
    });
    const result = resolveManualEffectTransaction({ draft, transactionId: 'manual-gain-parcel', state: manualState(), resolvedAt: 200 });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.inventory).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Parcel', type: 'item', weight: 1, ruinedWhenSoaked: false })
    ]));
    expect(result.value?.nextState.pendingFollowUps).toHaveLength(0);
  });

  it('[TRAVEL-009/SAVE-004] persists and resolves the printed Parcel delivery at its chosen address exactly once', () => {
    const sourceDraft = createManualEffectDraft(
      PRINTED_EFFECT_BY_OWNER.get('travel-meadow-7-8')!,
      'encounter',
      {
        encounterTransactionId: 'parcel-encounter',
        encounterChoiceId: 'deliver-the-parcel',
        continuation: 'travel'
      },
      100
    );
    const scoped = scopeManualEffectDraftForEncounterChoice(sourceDraft);
    const completedDraft = completeRequiredInputs(scoped);
    const draft = {
      ...completedDraft,
      inputValues: { ...completedDraft.inputValues, 'printed-choice': 'Deliver the Parcel', 'parcel-address': 'Odoak', 'condition-check': true }
    };
    const result = resolveManualEffectTransaction({
      draft,
      transactionId: 'manual-parcel-delivery',
      state: manualState(),
      resolvedAt: 200
    });
    expect(result.status).toBe('resolved');
    const pending = result.value?.nextState.pendingFollowUps;
    expect(pending).toEqual([expect.objectContaining({
      kind: 'delivery',
      targetLocationName: 'Odoak',
      deliveryReward: { trinkets: 3 },
      status: 'pending'
    })]);
    const delivery = resolveDeliveryFollowUpsAtLocation({
      transactionId: 'manual-parcel-delivery:move',
      destinationId: 'odoak',
      destinationName: 'Odoak',
      state: {
        inventory: result.value!.nextState.inventory,
        reputation: result.value!.nextState.reputation,
        trinkets: result.value!.nextState.trinkets,
        pendingFollowUps: pending!,
        appliedTransactionIds: result.value!.nextState.appliedTransactionIds
      }
    });
    expect(delivery.status).toBe('resolved');
    expect(delivery.value?.nextState.inventory.some(item => item.name === 'Parcel')).toBe(false);
    expect(delivery.value?.nextState.trinkets).toBe(7);
    expect(delivery.value?.nextState.pendingFollowUps[0]).toMatchObject({ status: 'resolved' });
    const repeated = resolveDeliveryFollowUpsAtLocation({
      transactionId: 'manual-parcel-delivery:move',
      destinationId: 'odoak',
      destinationName: 'Odoak',
      state: delivery.value!.nextState
    });
    expect(repeated.status).toBe('invalid');
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
    expect(migrated.pendingManualFollowUps).toEqual([{
      id: 'follow-up-1',
      effectId: 'follow-up-1',
      ownerId: 'follow-up-1',
      trigger: 'service-follow-up',
      description: '',
      context: { continuation: 'none' },
      createdAt: 0,
      transactionId: 'follow-up-1:legacy',
      status: 'pending'
    }]);
    expect(migrateSavedRulesState(migrated).pendingManualFollowUps).toEqual(migrated.pendingManualFollowUps);
    expect(migrated.manualEffectRecords).toEqual([{ id: 'record-1', status: 'resolved' }]);
  });

  it('[SAVE-005/CORE-002] normalizes legacy pending follow-ups without inventing canonical completion', () => {
    const normalized = normalizePendingManualFollowUp({
      id: 'legacy-follow-up',
      description: 'Queen Bee follow-up: after a future re-home in a wild Meadow, Bog, or Forest, mark that Location as a new Beehive.',
      status: 'pending'
    }, 123);
    expect(normalized).toEqual({
      id: 'legacy-follow-up',
      effectId: 'legacy-follow-up',
      ownerId: 'legacy-follow-up',
      trigger: 'service-follow-up',
      description: 'Queen Bee follow-up: after a future re-home in a wild Meadow, Bog, or Forest, mark that Location as a new Beehive.',
      context: { continuation: 'none' },
      transactionId: 'legacy-follow-up:legacy',
      createdAt: 123,
      status: 'pending'
    });
  });

  it('[SAVE-005/CORE-002] preserves the legacy Protect Queen re-home reminder as a typed pending follow-up', () => {
    const legacyCondition = 'manual:social-meadow-spring-♣:Queen Bee Companion acquired now. Later, re-home her in a wild Meadow, Bog, or Forest; only then mark that Location as a new Beehive.';
    const first = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      manualConditions: [legacyCondition],
      companionStates: [],
      pendingManualFollowUps: []
    });

    expect(first.manualConditions).not.toContain(legacyCondition);
    expect(first.companionStates).toEqual(expect.arrayContaining([
      expect.objectContaining({ companionId: 'queen-bee' })
    ]));
    expect(first.pendingManualFollowUps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'legacy-protect-queen:follow-up:rehome',
        ownerId: 'social-meadow-spring-♣',
        status: 'pending'
      })
    ]));

    const repeated = migrateSavedRulesState(first);
    expect(repeated.pendingManualFollowUps).toEqual(first.pendingManualFollowUps);
    expect(repeated.companionStates).toEqual(first.companionStates);
  });

  it('[SAVE-005/CORE-002] repairs malformed follow-ups idempotently', () => {
    const malformed = {
      id: 'malformed-follow-up',
      trigger: 'invented-trigger',
      context: [],
      createdAt: 'not-a-number'
    };
    const first = normalizePendingManualFollowUp(malformed, 456);
    expect(first).toEqual({
      id: 'malformed-follow-up',
      effectId: 'malformed-follow-up',
      ownerId: 'malformed-follow-up',
      trigger: 'service-follow-up',
      description: '',
      context: { continuation: 'none' },
      createdAt: 456,
      transactionId: 'malformed-follow-up:legacy',
      status: 'pending'
    });
    expect(normalizePendingManualFollowUp(JSON.parse(JSON.stringify(first)), 999)).toEqual(first);
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
      const result = executeEncounter({ transactionId: `representative:${encounter.id}`, encounter, choiceId: encounter.choices[0]?.id, state: encounterState() });
      expect(result.status, encounter.id).not.toBe('invalid');
      const leftover = (encounter.choices[0]?.effects || []).some(row => row.support !== 'implemented')
        || encounter.mandatoryEffects.some(row => row.support !== 'implemented');
      if (leftover) expect(result.status, encounter.id).toBe('manual');
    }
  });
});
