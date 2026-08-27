import { describe, expect, it } from 'vitest';
import {
  BETTING_MATCH_RESULT_OPTIONS,
  BETTING_MATCH_TRINKET_ACTION_ID,
  PRINTED_EFFECT_BY_OWNER,
  CURRENT_SCHEMA_VERSION,
  createManualEffectDraft,
  migrateSavedRulesState,
  resolveManualEffectTransaction,
  type ManualEffectDraft,
  type ManualResolutionRuntimeState
} from './rules';
import {
  BETTING_OPPORTUNITY_CHOICE_INPUT_ID,
  canonicalizeManualEffectActionTargets,
  patchManualEffectDraft,
  scopeManualEffectDraftForEncounterChoice,
  setManualEffectActionSelected,
  setManualEffectActionTarget,
  setManualEffectEncounterChoice,
  setManualEffectInput
} from './manualEffectDraftState';

const draftFor = (ownerId: string, createdAt = 100): ManualEffectDraft => createManualEffectDraft(
  PRINTED_EFFECT_BY_OWNER.get(ownerId)!,
  'encounter',
  { encounterTransactionId: `encounter:${ownerId}`, continuation: 'none' },
  createdAt
);

const manualState = (): ManualResolutionRuntimeState => ({
  reputation: 6,
  trinkets: 4,
  calendarDays: 3,
  foragingPoints: 2,
  inventory: [],
  patient: null,
  conditions: [],
  pendingFollowUps: [],
  appliedTransactionIds: []
});

const complete = (draft: ManualEffectDraft): ManualEffectDraft => ({
  ...draft,
  inputValues: {
    ...draft.inputValues,
    ...Object.fromEntries(draft.inputFields.filter(field => field.required).map(field => [
      field.id,
      field.type === 'condition' ? true : field.type === 'number' ? 1 : draft.inputValues[field.id] || '원문 조건에 따라 결정'
    ]))
  },
  resultSummary: '선택한 분기의 결과를 적용했다.',
  journalNote: '원문의 선택과 후속 조건을 일지에 기록했다.'
});

const encounterChoiceId = (draft: ManualEffectDraft): string | undefined => (
  draft.context as ManualEffectDraft['context'] & { encounterChoiceId?: string }
).encounterChoiceId;

describe('manual effect draft functional state (A)', () => {
  it('canonicalizes forged legacy targets after reload without keeping a second target source', () => {
    const protect = setManualEffectEncounterChoice('protect-the-queen')(
      draftFor('social-meadow-spring-♣')
    );
    const protectAction = protect.actionTemplates[0];
    const forgedProtect = JSON.parse(JSON.stringify({
      ...protect,
      actionTargets: { [protectAction.id]: 'forged replacement target' }
    })) as ManualEffectDraft;
    expect(canonicalizeManualEffectActionTargets(
      forgedProtect.actionTemplates,
      forgedProtect.actionTargets
    )).toEqual({ [protectAction.id]: protectAction.fixedTarget });

    const release = setManualEffectEncounterChoice('release-the-queen')(
      draftFor('social-meadow-spring-♣')
    );
    const releaseAction = release.actionTemplates[0];
    const forgedRelease = JSON.parse(JSON.stringify({
      ...release,
      inputValues: { ...release.inputValues, 'map-target': 'Mossy Clearing' },
      actionTargets: { [releaseAction.id]: 'stale old clearing' }
    })) as ManualEffectDraft;
    expect(releaseAction.targetInputId).toBe('map-target');
    expect(canonicalizeManualEffectActionTargets(
      forgedRelease.actionTemplates,
      forgedRelease.actionTargets
    )).toEqual({});
    expect(forgedRelease.inputValues['map-target']).toBe('Mossy Clearing');
    expect(setManualEffectActionTarget(releaseAction.id, 'another stale clearing')(forgedRelease).actionTargets).toEqual({});

    const freeTargetAction = {
      ...releaseAction,
      id: 'free-target-action',
      fixedTarget: undefined,
      targetInputId: undefined
    };
    expect(canonicalizeManualEffectActionTargets(
      [freeTargetAction],
      { [freeTargetAction.id]: 'saved player target' }
    )).toEqual({ [freeTargetAction.id]: 'saved player target' });
  });

  it('applies delayed input/action/target updates to the latest nested state with caller-controlled timestamps', () => {
    let draft = draftFor('social-forest-summer-♣');
    const firstAction = draft.actionTemplates[0]?.id || 'action:first';
    const secondAction = draft.actionTemplates[1]?.id || 'action:second';

    draft = patchManualEffectDraft({
      inputValues: { existing: 'kept' },
      actionTargets: { existing: 'kept' },
      mapTargetIds: { existing: 'node-existing' },
      selectedActionIds: [firstAction]
    }, 110)(draft);
    draft = setManualEffectInput('new-input', 'new value', current => current.updatedAt + 1)(draft);
    draft = setManualEffectActionSelected(secondAction, true, current => current.updatedAt + 1)(draft);
    draft = setManualEffectActionTarget(firstAction, 'first target', current => current.updatedAt + 1)(draft);
    draft = setManualEffectActionTarget(secondAction, 'second target', current => current.updatedAt + 1)(draft);

    expect(draft.inputValues).toMatchObject({ existing: 'kept', 'new-input': 'new value' });
    expect(draft.mapTargetIds).toEqual({ existing: 'node-existing' });
    expect(draft.selectedActionIds).toEqual([firstAction, secondAction]);
    expect(draft.actionTargets).toEqual({ existing: 'kept', [firstAction]: 'first target', [secondAction]: 'second target' });
    expect(draft.updatedAt).toBe(114);
  });

  it('leaves unrelated narrative-only drafts and partial workflow state unchanged when no special branch applies', () => {
    const narrative = {
      ...draftFor('social-forest-spring-♣'),
      status: 'deferred' as const,
      resultSummary: '작성 중',
      inputValues: { 'narrative-outcome': '부분 기록' }
    };
    expect(scopeManualEffectDraftForEncounterChoice(narrative)).toBe(narrative);
  });

  it('keeps a narrative resolution with no contextual target fully resolvable', () => {
    const narrative = complete(draftFor('social-forest-spring-♣'));
    expect(narrative.actionTemplates).toEqual([]);
    const resolved = resolveManualEffectTransaction({
      draft: narrative,
      transactionId: 'narrative:no-target',
      state: manualState(),
      resolvedAt: 120
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.record.transactionId).toBe('narrative:no-target');
  });
});

describe('Bees! branch integrity (B)', () => {
  it('records Queen Bee acquisition/future re-home without requesting a release Location now', () => {
    const base = draftFor('social-meadow-spring-♣');
    const protect = setManualEffectEncounterChoice('protect-the-queen', 120)(base);

    expect(encounterChoiceId(protect)).toBe('protect-the-queen');
    expect(protect.inputFields.some(field => field.id === 'map-target')).toBe(false);
    expect(protect.actionTemplates).toHaveLength(1);
    expect(protect.actionTemplates[0]).toMatchObject({ kind: 'record-condition' });
    expect(protect.actionTemplates[0].sourceText).toMatch(/Queen Bee Companion acquired now[\s\S]*wild Meadow, Bog, or Forest/i);
    expect(protect.actionTargets[protect.actionTemplates[0].id]).toMatch(/Queen Bee Companion acquired now/);
    expect(protect.followUpRequirements.join(' ')).toMatch(/future re-home[\s\S]*Honey and Wax/i);
    expect(protect.actionTemplates.some(action => action.kind === 'gain-inventory')).toBe(false);
    expect(protect.inputFields.find(field => field.id === 'condition-check')).toMatchObject({ required: true });

    const actionId = protect.actionTemplates[0].id;
    const canonicalTarget = protect.actionTemplates[0].fixedTarget;
    expect(canonicalTarget).toMatch(/Queen Bee Companion acquired now/);
    const rapidlyConfirmed = setManualEffectInput('condition-check', true, 123)(
      setManualEffectActionSelected(actionId, true, 122)(
        setManualEffectActionTarget(actionId, 'forged replacement target', 121)(protect)
      )
    );
    expect(rapidlyConfirmed.inputValues['condition-check']).toBe(true);
    expect(rapidlyConfirmed.selectedActionIds).toContain(actionId);
    expect(rapidlyConfirmed.actionTargets[actionId]).toBe(canonicalTarget);

    const resolved = resolveManualEffectTransaction({
      draft: complete(rapidlyConfirmed),
      transactionId: 'bees:protect',
      state: manualState(),
      resolvedAt: 130
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.inventory).toEqual([]);
    expect(resolved.value?.nextState.conditions).toEqual([]);
    expect(resolved.value?.nextState.companions).toEqual([
      expect.objectContaining({ companionId: 'queen-bee' })
    ]);
    expect(resolved.value?.nextState.pendingFollowUps[0]?.description).toMatch(/Queen Bee follow-up/);
    expect(resolved.value?.record.actionTargets[actionId]).toBe(canonicalTarget);
  });

  it('acquires another Queen Bee when Hive Brackets provide a second companion slot', () => {
    const protect = complete(setManualEffectEncounterChoice('protect-the-queen')(
      draftFor('social-meadow-spring-♣')
    ));
    const firstQueen = {
      instanceId: 'earlier-bees:companion:queen-bee',
      companionId: 'queen-bee',
      pathsTravelled: 0,
      seasonsTravelled: 0,
      usedThisJourney: false,
      pendingForage: null
    };
    const resolved = resolveManualEffectTransaction({
      draft: protect,
      transactionId: 'bees:protect:second',
      state: { ...manualState(), companions: [firstQueen], companionCapacity: 2 },
      resolvedAt: 130
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.companions).toEqual([
      firstQueen,
      expect.objectContaining({
        instanceId: 'bees:protect:second:companion:queen-bee',
        companionId: 'queen-bee'
      })
    ]);
  });

  it('switches cleanly to Wish Them Luck and infers the Protect branch for a legacy printed-choice save', () => {
    const base = draftFor('social-meadow-spring-♣');
    const protect = setManualEffectEncounterChoice('protect-the-queen')(base);
    const wish = setManualEffectInput('printed-choice', 'Wish Them Luck', 125)(protect);
    expect(encounterChoiceId(wish)).toBe('wish-them-luck');
    expect(wish.followUpRequirements).toEqual([]);
    expect(wish.mandatoryConditions).toEqual([]);
    expect(wish.actionTemplates).toEqual([expect.objectContaining({ kind: 'modify-reputation', amount: -1 })]);
    expect(wish.selectedActionIds).toEqual([wish.actionTemplates[0].id]);

    const resolved = resolveManualEffectTransaction({ draft: complete(wish), transactionId: 'bees:wish', state: manualState(), resolvedAt: 130 });
    expect(resolved.value?.nextState.reputation).toBe(5);
    expect(resolved.value?.nextState.pendingFollowUps).toEqual([]);

    const legacy = { ...base, inputValues: { 'printed-choice': 'Protect the Queen' } };
    const restored = scopeManualEffectDraftForEncounterChoice(JSON.parse(JSON.stringify(legacy)) as ManualEffectDraft);
    expect(encounterChoiceId(restored)).toBe('protect-the-queen');
    expect(restored.inputFields.some(field => field.id === 'map-target')).toBe(false);
  });

  it('keeps the top-level printed choice required and rejects a forged draft that omits it', () => {
    const protect = complete(setManualEffectEncounterChoice('protect-the-queen')(
      draftFor('social-meadow-spring-♣')
    ));
    expect(protect.inputFields.find(field => field.id === 'printed-choice')).toMatchObject({ required: true });
    const { ['printed-choice']: _missingChoice, ...inputValues } = protect.inputValues;
    const beforeState = manualState();
    const beforeSnapshot = JSON.parse(JSON.stringify(beforeState));

    const rejected = resolveManualEffectTransaction({
      draft: { ...protect, inputValues },
      transactionId: 'bees:missing-top-choice',
      state: beforeState,
      resolvedAt: 130
    });

    expect(rejected.status).toBe('invalid');
    expect(rejected.value).toBeNull();
    expect(rejected.messages.join(' ')).toMatch(/Required resolution input/i);
    expect(beforeState).toEqual(beforeSnapshot);
  });

  it('requires a literal true value for the printed condition confirmation', () => {
    const protect = complete(setManualEffectEncounterChoice('protect-the-queen')(
      draftFor('social-meadow-spring-♣')
    ));
    const state = manualState();
    const snapshot = JSON.parse(JSON.stringify(state));

    const rejected = resolveManualEffectTransaction({
      draft: {
        ...protect,
        inputValues: { ...protect.inputValues, 'condition-check': 'true' }
      },
      transactionId: 'bees:forged-condition-confirmation',
      state,
      resolvedAt: 130
    });

    expect(rejected.status).toBe('invalid');
    expect(rejected.value).toBeNull();
    expect(rejected.messages.join(' ')).toMatch(/Required resolution input/i);
    expect(state).toEqual(snapshot);
  });

  it('restores the context branch as the single saved choice and rejects a forged mismatch in the domain', () => {
    const protect = complete(setManualEffectEncounterChoice('protect-the-queen')(
      draftFor('social-meadow-spring-♣')
    ));
    const forged = {
      ...protect,
      inputValues: { ...protect.inputValues, 'printed-choice': 'Wish Them Luck' }
    };
    const state = manualState();
    const snapshot = JSON.parse(JSON.stringify(state));

    const rejected = resolveManualEffectTransaction({
      draft: forged,
      transactionId: 'bees:forged-branch-mismatch',
      state,
      resolvedAt: 130
    });
    expect(rejected.status).toBe('invalid');
    expect(rejected.value).toBeNull();
    expect(rejected.messages.join(' ')).toMatch(/printed choice.*selected Encounter branch/i);
    expect(state).toEqual(snapshot);

    const restored = scopeManualEffectDraftForEncounterChoice(forged, 131);
    expect(encounterChoiceId(restored)).toBe('protect-the-queen');
    expect(restored.inputValues['printed-choice']).toBe('Protect the Queen');
    expect(restored.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-condition' })
    ]);
    expect(restored.updatedAt).toBe(131);
  });

  it('round-trips a deferred partial Protect draft with its target and confirmation intact', () => {
    const protect = setManualEffectEncounterChoice('protect-the-queen')(
      draftFor('social-meadow-spring-♣')
    );
    const actionId = protect.actionTemplates[0].id;
    const canonicalTarget = protect.actionTemplates[0].fixedTarget;
    const deferred = patchManualEffectDraft({ status: 'deferred', resultSummary: '작성 중' })(
      setManualEffectInput('condition-check', true)(
        setManualEffectActionTarget(actionId, 'forged replacement target')(protect)
      )
    );
    const reloaded = scopeManualEffectDraftForEncounterChoice(
      JSON.parse(JSON.stringify(deferred)) as ManualEffectDraft
    );
    expect(reloaded).toMatchObject({
      status: 'deferred',
      resultSummary: '작성 중',
      inputValues: { 'condition-check': true },
      actionTargets: { [actionId]: canonicalTarget }
    });
  });

  it('migrates and repeatedly normalizes a deferred Protect branch without dropping contextual state', () => {
    const protect = setManualEffectEncounterChoice('protect-the-queen')(
      draftFor('social-meadow-spring-♣')
    );
    const actionId = protect.actionTemplates[0].id;
    const canonicalTarget = protect.actionTemplates[0].fixedTarget;
    const deferred = patchManualEffectDraft({ status: 'deferred', resultSummary: '작성 중' })(
      setManualEffectInput('condition-check', true)(
        setManualEffectActionTarget(actionId, 'forged replacement target')(protect)
      )
    );
    const migrated = migrateSavedRulesState({
      schemaVersion: 6,
      rulesetId: 'original-1e-3p',
      manualEffectDraft: deferred,
      pendingManualEffect: deferred
    });
    const restored = scopeManualEffectDraftForEncounterChoice(
      migrated.manualEffectQueue[0] as ManualEffectDraft
    );

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.pendingManualEffect).toBeNull();
    expect(restored).toMatchObject({
      status: 'deferred',
      resultSummary: '작성 중',
      context: { encounterChoiceId: 'protect-the-queen' },
      inputValues: { 'condition-check': true },
      actionTargets: { [actionId]: canonicalTarget }
    });
    expect(migrateSavedRulesState(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });
});

describe('Betting Match branch integrity (C)', () => {
  it('requires an explicit Snack/Friend choice and immediately scopes actions and follow-ups when it changes', () => {
    const base = draftFor('social-forest-summer-♣');
    const opportunity = setManualEffectEncounterChoice('an-opportunity', 120)(base);
    const nestedField = opportunity.inputFields.find(field => field.id === BETTING_OPPORTUNITY_CHOICE_INPUT_ID);
    expect(nestedField).toMatchObject({ type: 'choice', required: true, options: ['A Snack!', 'A Friend!'] });
    expect(opportunity.inputFields.find(field => field.id === 'condition-check')).toMatchObject({ required: true });
    expect(opportunity.actionTemplates).toEqual([]);

    const snack = setManualEffectInput(BETTING_OPPORTUNITY_CHOICE_INPUT_ID, 'A Snack!', 121)(opportunity);
    expect(snack.actionTemplates).toEqual([expect.objectContaining({ kind: 'record-condition' })]);
    expect(snack.actionTemplates[0].sourceText).toMatch(/Speed by 1 for the next Move/i);
    expect(snack.actionTemplates[0].fixedTarget).toBe('Increase Speed by 1 for the next Move only.');
    expect(snack.actionTemplates[0].targetType).toBeUndefined();
    expect(snack.actionTemplates.some(action => /cocoon/i.test(action.sourceText))).toBe(false);
    expect(snack.followUpRequirements).toEqual([]);
    const protectedSnack = setManualEffectActionTarget(
      snack.actionTemplates[0].id,
      'permanent speed increase'
    )(snack);
    expect(protectedSnack.actionTargets[snack.actionTemplates[0].id]).toBe('Increase Speed by 1 for the next Move only.');
    const snackResolved = resolveManualEffectTransaction({
      draft: complete(protectedSnack),
      transactionId: 'betting:snack',
      state: manualState(),
      resolvedAt: 125
    });
    expect(snackResolved.value?.nextState.conditions).toContain(
      'manual:social-forest-summer-♣:Increase Speed by 1 for the next Move only.'
    );

    const friend = setManualEffectInput(BETTING_OPPORTUNITY_CHOICE_INPUT_ID, 'A Friend!', 122)(snack);
    expect(friend.actionTemplates).toEqual([expect.objectContaining({ kind: 'gain-inventory' })]);
    expect(friend.actionTemplates[0].fixedTarget).toBe('Cocoon (Weight 1/3)');
    expect(friend.actionTemplates[0].targetType).toBeUndefined();
    expect(friend.actionTargets[friend.actionTemplates[0].id]).toBe('Cocoon (Weight 1/3)');
    expect(friend.actionTemplates.some(action => /speed/i.test(action.sourceText))).toBe(false);
    expect(friend.followUpRequirements.join(' ')).toMatch(/10 Paths[\s\S]*Journey ends[\s\S]*Butterfly Companion/i);

    const protectedFriend = setManualEffectActionTarget(friend.actionTemplates[0].id, 'Perfect Conker')(friend);
    expect(protectedFriend.actionTargets[friend.actionTemplates[0].id]).toBe('Cocoon (Weight 1/3)');

    const reloaded = JSON.parse(JSON.stringify(protectedFriend)) as ManualEffectDraft;
    expect(scopeManualEffectDraftForEncounterChoice(reloaded)).toEqual(reloaded);
    const resolved = resolveManualEffectTransaction({ draft: complete(reloaded), transactionId: 'betting:friend', state: manualState(), resolvedAt: 130 });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.inventory).toEqual([expect.objectContaining({ name: 'Cocoon', weight: 1 / 3 })]);
    expect(resolved.value?.nextState.conditions).toEqual([]);
    expect(resolved.value?.nextState.pendingFollowUps[0]).toMatchObject({
      description: expect.stringMatching(/10 Paths/),
      kind: 'cocoon-hatch',
      targetInventoryItemId: `betting:friend:inventory:${friend.actionTemplates[0].id}`
    });
    expect(resolved.value?.record.actionTargets[friend.actionTemplates[0].id]).toBe('Cocoon (Weight 1/3)');
  });

  it('does not mutate input follow-up requirements while appending action-derived follow-ups', () => {
    let release = setManualEffectEncounterChoice('release-the-queen')(
      draftFor('social-meadow-spring-♣')
    );
    expect(release.actionTemplates[0].targetInputId).toBe('map-target');
    release = setManualEffectInput('map-target', 'Forest Clearing')(release);
    release = complete(release);
    const originalFollowUps = [...release.followUpRequirements];
    Object.freeze(release.followUpRequirements);

    const resolved = resolveManualEffectTransaction({
      draft: release,
      transactionId: 'bees:release:immutable-follow-ups',
      state: manualState(),
      resolvedAt: 130
    });

    expect(resolved.status).toBe('resolved');
    expect(release.followUpRequirements).toEqual(originalFollowUps);
    expect(resolved.value?.nextState.pendingFollowUps.map(row => row.description)).toEqual([
      ...originalFollowUps,
      'Forest Clearing'
    ]);
  });

  it('rejects a targeted branch in the domain when its required target is absent', () => {
    const release = setManualEffectEncounterChoice('release-the-queen')(
      draftFor('social-meadow-spring-♣')
    );
    const invalidDraft = complete({ ...release, actionTargets: {} });
    const invalid = resolveManualEffectTransaction({
      draft: { ...invalidDraft, inputValues: { ...invalidDraft.inputValues, 'map-target': '' } },
      transactionId: 'bees:release:missing-target',
      state: manualState(),
      resolvedAt: 130
    });
    expect(invalid.status).toBe('invalid');
    expect(invalid.messages.join(' ')).toMatch(/required resolution input/i);
    expect(invalid.value).toBeNull();
  });

  it('uses one persisted map input as both UI context and the canonical action target', () => {
    const release = setManualEffectInput('map-target', 'Whistling Bracken')(
      setManualEffectEncounterChoice('release-the-queen')(draftFor('social-meadow-spring-♣'))
    );
    const actionId = release.actionTemplates[0].id;
    const resolved = resolveManualEffectTransaction({
      draft: complete({ ...release, actionTargets: {} }),
      transactionId: 'bees:release:single-target',
      state: manualState(),
      resolvedAt: 130
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.record.actionTargets[actionId]).toBe('Whistling Bracken');
    expect(resolved.value?.nextState.pendingFollowUps.map(row => row.description)).toContain('Whistling Bracken');
  });

  it('rejects a chosen branch when its mandatory printed action is removed', () => {
    const friend = setManualEffectInput(BETTING_OPPORTUNITY_CHOICE_INPUT_ID, 'A Friend!')(
      setManualEffectEncounterChoice('an-opportunity')(draftFor('social-forest-summer-♣'))
    );
    const invalid = resolveManualEffectTransaction({
      draft: complete({ ...friend, selectedActionIds: [] }),
      transactionId: 'betting:friend:missing-action',
      state: manualState(),
      resolvedAt: 130
    });
    expect(invalid.status).toBe('invalid');
    expect(invalid.messages.join(' ')).toMatch(/required printed action/i);
    expect(invalid.value).toBeNull();
  });

  it.each([
    [BETTING_MATCH_RESULT_OPTIONS[0], 2, 6],
    [BETTING_MATCH_RESULT_OPTIONS[1], 0, 4],
    [BETTING_MATCH_RESULT_OPTIONS[2], -2, 2]
  ] as const)('derives the required Place a Bet Trinket action for %s', (result, amount, expectedTrinkets) => {
    let bet = setManualEffectEncounterChoice('place-a-bet')(
      draftFor('social-forest-summer-♣')
    );
    bet = setManualEffectInput('bet-suit', '♣')(bet);
    bet = setManualEffectInput('bet-wager', '2')(bet);
    bet = setManualEffectInput('bet-result', result)(bet);
    bet = setManualEffectInput('condition-check', true)(bet);

    expect(bet.actionTemplates).toEqual([expect.objectContaining({
      id: BETTING_MATCH_TRINKET_ACTION_ID,
      kind: 'modify-trinkets',
      required: true,
      amount
    })]);
    expect(bet.selectedActionIds).toEqual([BETTING_MATCH_TRINKET_ACTION_ID]);

    const reloaded = scopeManualEffectDraftForEncounterChoice(
      JSON.parse(JSON.stringify(complete(bet))) as ManualEffectDraft
    );
    expect(reloaded.actionTemplates).toEqual(bet.actionTemplates);
    const resolved = resolveManualEffectTransaction({
      draft: reloaded,
      transactionId: `betting:place:${expectedTrinkets}`,
      state: manualState(),
      resolvedAt: 130
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.trinkets).toBe(expectedTrinkets);
    expect(resolved.value?.record.appliedActionIds).toEqual([BETTING_MATCH_TRINKET_ACTION_ID]);
  });

  it('rejects an unaffordable Place a Bet wager before applying its result', () => {
    let bet = setManualEffectEncounterChoice('place-a-bet')(
      draftFor('social-forest-summer-♣')
    );
    bet = setManualEffectInput('bet-suit', '♠')(bet);
    bet = setManualEffectInput('bet-wager', '4')(bet);
    bet = setManualEffectInput('bet-result', BETTING_MATCH_RESULT_OPTIONS[0])(bet);
    bet = setManualEffectInput('condition-check', true)(bet);

    const invalid = resolveManualEffectTransaction({
      draft: complete(bet),
      transactionId: 'betting:place:unaffordable',
      state: { ...manualState(), trinkets: 3 },
      resolvedAt: 130
    });

    expect(invalid.status).toBe('invalid');
    expect(invalid.value).toBeNull();
    expect(invalid.messages.join(' ')).toMatch(/requires 4 Trinkets/i);
  });

  it('rejects a required choice value that is not one of the printed options', () => {
    let bet = setManualEffectEncounterChoice('place-a-bet')(
      draftFor('social-forest-summer-♣')
    );
    bet = setManualEffectInput('bet-suit', 'not-a-printed-suit')(bet);
    bet = setManualEffectInput('bet-wager', '2')(bet);
    bet = setManualEffectInput('bet-result', BETTING_MATCH_RESULT_OPTIONS[0])(bet);
    bet = complete(setManualEffectInput('condition-check', true)(bet));
    const state = manualState();
    const snapshot = JSON.parse(JSON.stringify(state));

    const rejected = resolveManualEffectTransaction({
      draft: bet,
      transactionId: 'betting:forged-suit-option',
      state,
      resolvedAt: 130
    });

    expect(rejected.status).toBe('invalid');
    expect(rejected.value).toBeNull();
    expect(rejected.messages.join(' ')).toMatch(/Required resolution input/i);
    expect(state).toEqual(snapshot);
  });

  it('rejects a forged Place a Bet amount and applies a valid transaction only once', () => {
    let bet = setManualEffectEncounterChoice('place-a-bet')(
      draftFor('social-forest-summer-♣')
    );
    bet = setManualEffectInput('bet-suit', '♥')(bet);
    bet = setManualEffectInput('bet-wager', '1')(bet);
    bet = setManualEffectInput('bet-result', BETTING_MATCH_RESULT_OPTIONS[0])(bet);
    bet = complete(setManualEffectInput('condition-check', true)(bet));

    const forged = resolveManualEffectTransaction({
      draft: {
        ...bet,
        actionTemplates: bet.actionTemplates.map(action => ({ ...action, amount: 99 }))
      },
      transactionId: 'betting:place:forged',
      state: manualState(),
      resolvedAt: 130
    });
    expect(forged.status).toBe('invalid');
    expect(forged.messages.join(' ')).toMatch(/does not match/i);

    const first = resolveManualEffectTransaction({
      draft: bet,
      transactionId: 'betting:place:once',
      state: manualState(),
      resolvedAt: 130
    });
    expect(first.status).toBe('resolved');
    expect(first.value?.nextState.trinkets).toBe(5);

    const repeated = resolveManualEffectTransaction({
      draft: bet,
      transactionId: 'betting:place:once',
      state: first.value!.nextState,
      resolvedAt: 131
    });
    expect(repeated.status).toBe('invalid');
    expect(repeated.value).toBeNull();
    expect(first.value?.nextState.trinkets).toBe(5);
  });

  it('keeps Place a Bet separate and restores a legacy A Friend printed choice', () => {
    const base = draftFor('social-forest-summer-♣');
    const opportunity = setManualEffectEncounterChoice('an-opportunity')(base);
    const friend = setManualEffectInput(BETTING_OPPORTUNITY_CHOICE_INPUT_ID, 'A Friend!')(opportunity);
    const bet = setManualEffectEncounterChoice('place-a-bet', 130)(friend);
    expect(bet.inputFields.map(field => field.id)).toEqual(['printed-choice', 'bet-suit', 'bet-wager', 'bet-result', 'condition-check']);
    expect(bet.inputFields.filter(field => field.id !== 'printed-choice').every(field => field.required)).toBe(true);
    expect(bet.actionTemplates).toEqual([]);
    expect(bet.followUpRequirements).toEqual([]);

    const legacy = { ...base, inputValues: { 'printed-choice': 'A Friend!' } };
    const restored = scopeManualEffectDraftForEncounterChoice(legacy);
    expect(encounterChoiceId(restored)).toBe('an-opportunity');
    expect(restored.inputValues[BETTING_OPPORTUNITY_CHOICE_INPUT_ID]).toBe('A Friend!');
    expect(restored.actionTemplates).toEqual([expect.objectContaining({ kind: 'gain-inventory' })]);
  });
});
