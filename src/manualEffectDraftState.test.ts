import { describe, expect, it } from 'vitest';
import {
  BETTING_MATCH_RESULT_OPTIONS,
  BETTING_MATCH_TRINKET_ACTION_ID,
  ENCOUNTERS,
  REAGENTS,
  PRINTED_EFFECT_BY_OWNER,
  CURRENT_SCHEMA_VERSION,
  createManualEffectDraft,
  deriveEncounterBranchActionTemplates,
  migrateSavedRulesState,
  resolvePatient,
  resolveManualEffectTransaction,
  type ManualEffectDraft,
  type ManualResolutionRuntimeState
} from './rules';
import {
  BETTING_OPPORTUNITY_CHOICE_INPUT_ID,
  BEE_KIND_BRANCH_INPUT_ID,
  BUTTERFLY_CARD_VALUE_INPUT_ID,
  BUTTERFLY_PLANT_PART_INPUT_ID,
  CLAMMY_PAYMENT_INPUT_ID,
  COLLECTOR_FOREST_PART_INPUT_ID,
  DEER_TRIAL_RESULT_INPUT_ID,
  DEEP_WATER_SPLIT_INPUT_ID,
  ENCOUNTER_CONDITION_CODES,
  FOREST_REAGENT_PART_OPTIONS,
  HOWL_FIGHT_RESULT_INPUT_ID,
  QUICK_CURE_COUNT_INPUT_ID,
  PURCHASE_DECISION_INPUT_ID,
  TITAN_REAGENT_PART_INPUT_ID,
  TITAN_REAGENT_PART_OPTIONS,
  TOBOGGAN_DESTINATION_INPUT_ID,
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

const draftForAt = (ownerId: string, locationId: string, createdAt = 100): ManualEffectDraft => createManualEffectDraft(
  PRINTED_EFFECT_BY_OWNER.get(ownerId)!,
  'encounter',
  { encounterTransactionId: `encounter:${ownerId}`, continuation: 'none', locationId },
  createdAt
);

const draftForPatient = (ownerId: string, patientId: string, createdAt = 100): ManualEffectDraft => createManualEffectDraft(
  PRINTED_EFFECT_BY_OWNER.get(ownerId)!,
  'encounter',
  { encounterTransactionId: `encounter:${ownerId}`, continuation: 'barter-social', patientId },
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

const reagentPart = (canonicalName: string, preparationIndex = 0, id = `${canonicalName}:${preparationIndex}`, quantity = 1) => {
  const reagent = REAGENTS.find(row => row.canonicalName === canonicalName)!;
  const preparation = reagent.preparations[preparationIndex];
  return {
    id,
    name: `${reagent.canonicalName} (${preparation.name})`,
    type: 'reagent' as const,
    weight: preparation.weight,
    quantity,
    canonicalReagentId: reagent.id,
    preparationId: preparation.id,
    usesRemaining: preparation.uses
  };
};

const complete = (draft: ManualEffectDraft): ManualEffectDraft => ({
  ...draft,
  inputValues: {
    ...draft.inputValues,
    ...Object.fromEntries(draft.inputFields.filter(field => field.required).map(field => [
      field.id,
      draft.inputValues[field.id]
        ?? (field.type === 'condition' ? true : field.type === 'number' ? 1 : '원문 조건에 따라 결정')
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
    const firstAction = 'action:first';
    const secondAction = 'action:second';
    draft = {
      ...draft,
      actionTemplates: [
        { id: firstAction, kind: 'record-condition', label: 'first', targetType: 'free-text', sourceText: 'first' },
        { id: secondAction, kind: 'record-condition', label: 'second', targetType: 'free-text', sourceText: 'second' }
      ]
    };

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

  it('keeps only the selected Roadside Tea branch and preselects its deterministic changes', () => {
    const roadsideTea = setManualEffectEncounterChoice('roadside-tea')(
      draftFor('travel-forest-m-winter')
    );

    expect(encounterChoiceId(roadsideTea)).toBe('roadside-tea');
    expect(roadsideTea.inputFields).toEqual([
      expect.objectContaining({ id: 'printed-choice', required: true, options: [expect.stringContaining('Roadside Tea')] })
    ]);
    expect(roadsideTea.actionTemplates).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'modify-days', amount: 1, required: true }),
      expect.objectContaining({ kind: 'modify-reputation', amount: 3, required: true }),
      expect.objectContaining({ kind: 'remove-inventory', required: true })
    ]));
    expect(roadsideTea.actionTemplates).toHaveLength(3);
    expect(roadsideTea.selectedActionIds).toEqual(roadsideTea.actionTemplates.map(action => action.id));
    expect(roadsideTea.actionTemplates.some(action => action.amount === -1 || action.amount === -3)).toBe(false);
    expect(roadsideTea.mandatoryConditions.join(' ')).not.toMatch(/Cold Shoulder|Aid/i);
  });

  it('does not re-offer an already applied Timer change from a mixed automatic/manual branch', () => {
    const charity = setManualEffectEncounterChoice('charity')(
      draftFor('foraging-forest-j-winter')
    );

    expect(charity.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'gain-inventory', required: false })
    ]);
    expect(charity.selectedActionIds).toEqual([]);
    expect(charity.actionTemplates.some(action => action.kind === 'modify-timer')).toBe(false);
    expect(charity.inputFields.some(field => field.id === 'narrative-outcome' && field.required)).toBe(false);
  });

  it('keeps the exact Iris Oil target beside the conditional Timer result', () => {
    const demonstration = setManualEffectEncounterChoice('demonstration')(
      draftFor('social-bog-summer-♣')
    );
    expect(demonstration.actionTemplates).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'modify-timer', amount: -1 }),
      expect.objectContaining({ kind: 'gain-inventory', fixedTarget: 'Iris Oil' })
    ]));
    expect(demonstration.actionTemplates.every(action => /Cold Shoulder|Roadside Tea/i.test(action.sourceText) === false)).toBe(true);
  });

  it('never offers numeric effects already committed by encounter execution a second time', () => {
    const guidedHome = setManualEffectEncounterChoice('stop-and-help')(
      draftFor('travel-bog-j-winter')
    );
    expect(guidedHome.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-movement', required: true })
    ]);
    expect(guidedHome.actionTemplates.some(action => action.kind === 'modify-days' || action.kind === 'modify-reputation')).toBe(false);

    const helpedGriph = setManualEffectEncounterChoice('swoop-in-to-help')(
      draftFor('travel-soar-7-8')
    );
    expect(helpedGriph.actionTemplates.some(action => action.kind === 'modify-reputation')).toBe(false);
    expect(helpedGriph.actionTemplates).toContainEqual(expect.objectContaining({ kind: 'record-movement' }));
  });

  it('keeps later item use as a follow-up instead of consuming the item immediately', () => {
    const titanTale = setManualEffectEncounterChoice('stop-for-a-tale')(
      draftFor('travel-mountain-9-10-summer')
    );
    expect(titanTale.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'gain-inventory', fixedTarget: 'Titan Tale', required: true })
    ]);
    expect(titanTale.followUpRequirements.join(' ')).toMatch(/Haggling/i);
  });

  it('covers fixed Tool, singular Trinket, and card-selected Bag losses without prose re-entry', () => {
    const spices = setManualEffectEncounterChoice('bargain')(
      draftFor('travel-meadow-j-spring')
    );
    expect(spices.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'gain-inventory', fixedTarget: 'Fairwind Spices', required: true })
    ]);

    const mushroom = setManualEffectEncounterChoice('junior')(
      draftFor('foraging-forest-4')
    );
    expect(mushroom.actionTemplates).toContainEqual(
      expect.objectContaining({ kind: 'modify-trinkets', amount: 1, required: false })
    );

    const thief = setManualEffectEncounterChoice('give-chase')(
      draftFor('foraging-forest-j-summer')
    );
    expect(thief.actionTemplates).toContainEqual(
      expect.objectContaining({ kind: 'remove-inventory', targetType: 'inventory-item', required: false })
    );
  });

  it('rebuilds every ordinary manual encounter draft from only its selected branch remainder', () => {
    const specialOwners = new Set([
      'social-meadow-spring-♣',
      'social-forest-summer-♣',
      'travel-meadow-7-8',
      'travel-forest-m-winter',
      'travel-mountain-j-winter',
      'travel-bog-j-spring',
      'travel-bog-5-6',
      'travel-bog-9-10-summer',
      'travel-forest-5-6',
      'travel-forest-j-winter',
      'travel-loch-5-6',
      'travel-loch-7-8',
      'foraging-bog-m-autumn',
      'foraging-loch-10-summer',
      'foraging-loch-m-winter',
      'foraging-mountain-10-autumn',
      'foraging-titan-6',
      'foraging-forest-3',
      'social-loch-spring-♣',
      'social-forest-odoak-♥',
      'foraging-bog-j-spring',
      'foraging-bog-2',
      'foraging-loch-a',
      'foraging-loch-8',
      'foraging-mountain-10-summer',
      'foraging-mountain-3',
      'foraging-meadow-j-summer',
      'social-loch-settlement-♦',
      'social-loch-autumn-♣',
      'social-mountain-spoolkeep-♥',
      'social-bog-winter-♠',
      'social-mountain-autumn-♣'
    ]);
    for (const encounter of ENCOUNTERS.filter(row => !specialOwners.has(row.id))) {
      if (!PRINTED_EFFECT_BY_OWNER.get(encounter.id)?.manualResolution) continue;
      for (const choice of encounter.choices) {
        const expected = deriveEncounterBranchActionTemplates(encounter.id, choice.id);
        const hasManualRemainder = encounter.mandatoryEffects.some(effect => effect.support !== 'implemented')
          || choice.effects.some(effect => effect.support !== 'implemented');
        if (!hasManualRemainder) continue;
        const scoped = setManualEffectEncounterChoice(choice.id)(draftFor(encounter.id));
        expect(scoped.choices, `${encounter.id}:${choice.id}`).toEqual([choice.label]);
        expect(scoped.inputValues['printed-choice'], `${encounter.id}:${choice.id}`).toBe(choice.label);
        const expectedIds = new Set(expected.map(action => action.id));
        expect(scoped.actionTemplates.every(action => expectedIds.has(action.id)), `${encounter.id}:${choice.id}`)
          .toBe(true);
      }
    }
  });

  it('keeps mutually exclusive card results from applying sibling effects', () => {
    const cases = [
      ['travel-bog-a-2', 'follow-the-trail', 'wisp-card-result', '♦ · 원하는 Tool 하나', 'gain-inventory', undefined],
      ['travel-mountain-9-10-spring', 'deep-breath', 'pretty-prickles-card-result', '♥ · 무사히 통과', undefined, undefined],
      ['foraging-bog-m-spring', 'get-a-better-view', 'legacy-tower-card-result', '♥ / ♦ · 채집 포인트 +3', 'modify-foraging-points', 3],
      ['foraging-forest-10-summer', 'nap', 'siesta-card-result', '♣ / ♠ · 채집 포인트 -1', 'modify-foraging-points', -1],
      ['foraging-meadow-10-autumn', 'bump', 'heavy-fog-card-result', '♣ / ♠ · 장신구 -1', 'modify-trinkets', -1],
      ['foraging-mountain-9-summer', 'debate-the-goats', 'goat-debate-card-result', '♠ · 채집 포인트 -2', 'modify-foraging-points', -2],
      ['foraging-loch-10-winter', 'fish-some-more', 'ice-fishing-card-result', '♣ · Big Fish의 모든 부위', 'gain-inventory', undefined]
    ] as const;

    for (const [ownerId, choiceId, inputId, result, kind, amount] of cases) {
      const scoped = setManualEffectInput(inputId, result)(
        setManualEffectEncounterChoice(choiceId)(draftFor(ownerId))
      );
      expect(scoped.actionTemplates.every(action => action.required), ownerId).toBe(true);
      expect(scoped.selectedActionIds, ownerId).toEqual(scoped.actionTemplates.map(action => action.id));
      if (!kind) expect(scoped.actionTemplates, ownerId).toEqual([]);
      else expect(scoped.actionTemplates, ownerId).toEqual([
        expect.objectContaining({ kind, ...(amount === undefined ? {} : { amount }) })
      ]);
    }

    const panning = setManualEffectInput('panning-card-result', '♦ / ♣ / ♠ · 추가 획득 없음')(
      setManualEffectEncounterChoice('go-panning')(draftFor('social-mountain-autumn-♣'))
    );
    expect(panning.actionTemplates).toEqual([]);
  });

  it('resolves Marsh Wader and Panning through canonical inventory and deferred conditions', () => {
    const food = reagentPart('Marigold', 0, 'marsh-food');
    let marsh = setManualEffectEncounterChoice('curiosity')(draftFor('social-bog-winter-♠'));
    marsh = setManualEffectActionTarget(
      marsh.actionTemplates.find(action => action.kind === 'remove-inventory')!.id,
      food.id
    )(marsh);
    const fed = resolveManualEffectTransaction({
      draft: complete(marsh),
      transactionId: 'marsh-wader:fed',
      state: { ...manualState(), inventory: [food] }
    });
    expect(fed.status).toBe('resolved');
    expect(fed.value?.nextState.inventory).toEqual([]);
    expect(fed.value?.nextState.conditions).toContain(
      'manual:social-bog-winter-♠:marsh-wader:next-ailment-foraging-points:+5'
    );

    const patient = resolvePatient({
      id: 'panning-patient', name: 'Moss', species: 'Mouse', ailmentIds: ['ailment-dullsweats']
    }).value!;
    const beforeTimer = patient.timers[0].current;
    let panning = setManualEffectEncounterChoice('go-panning')(
      draftForPatient('social-mountain-autumn-♣', patient.id)
    );
    panning = setManualEffectInput('panning-card-result', '♥ · Silver Shards 획득')(panning);
    const panned = resolveManualEffectTransaction({
      draft: complete(panning),
      transactionId: 'panning:heart',
      state: { ...manualState(), patient }
    });
    expect(panned.status).toBe('resolved');
    expect(panned.value?.nextState.patient?.timers[0].current).toBe(beforeTimer - 1);
    expect(panned.value?.nextState.inventory).toContainEqual(expect.objectContaining({
      canonicalReagentId: REAGENTS.find(row => row.canonicalName === 'Silver Ore')!.id,
      preparationId: REAGENTS.find(row => row.canonicalName === 'Silver Ore')!
        .preparations.find(row => row.name === 'Silver Shards')!.id
    }));

    const refreshing = setManualEffectEncounterChoice('a-refreshing-dip')(
      draftFor('social-mountain-autumn-♣')
    );
    const refreshed = resolveManualEffectTransaction({
      draft: complete(refreshing),
      transactionId: 'refreshing:travelling',
      state: manualState()
    });
    expect(refreshed.status).toBe('resolved');
    expect(refreshed.value?.nextState.conditions).toContain(
      'manual:social-mountain-autumn-♣:panning:next-move-speed:+2'
    );
  });

  it('uses the Not-Cat final card value once, and only when the Apothecary remains trapped', () => {
    let trapped = setManualEffectEncounterChoice('flee-and-resolve')(draftFor('foraging-titan-5'));
    trapped = setManualEffectInput('not-cat-result', '합계도 낮아 갇힘 · 마지막 카드 값만큼 타이머 감소')(trapped);
    trapped = setManualEffectInput('not-cat-final-card', 'J · 11')(trapped);
    expect(trapped.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'modify-timer', amount: -11, required: true })
    ]);

    const patient = resolvePatient({
      id: 'not-cat-patient',
      name: 'Test patient',
      species: 'Mouse',
      ailmentIds: ['ailment-dullsweats']
    }).value!;
    const before = patient.timers[0].current;
    const resolved = resolveManualEffectTransaction({
      draft: complete(trapped),
      transactionId: 'not-cat:trapped',
      state: { ...manualState(), patient },
      resolvedAt: 130
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.patient?.timers[0].current).toBe(Math.max(0, before - 11));

    const escaped = setManualEffectInput('not-cat-result', '첫 비교에서 더 높아 탈출')(trapped);
    expect(escaped.inputFields.some(field => field.id === 'not-cat-final-card')).toBe(false);
    expect(escaped.actionTemplates).toEqual([]);
  });

  it('records later food spoilage and tadpole treatment without applying their future rewards now', () => {
    const food = setManualEffectEncounterChoice('follow-your-stomach')(draftFor('foraging-meadow-7'));
    expect(food.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-condition', required: true })
    ]);
    expect(food.actionTemplates.some(action => action.kind === 'modify-days')).toBe(false);

    const tadpoles = setManualEffectEncounterChoice('tadpediatrician')(draftFor('foraging-loch-9-summer'));
    expect(tadpoles.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-condition', required: false })
    ]);
    expect(tadpoles.actionTemplates.some(action => action.kind === 'modify-reputation' || action.kind === 'modify-trinkets')).toBe(false);
  });

  it('commits the Handmade Pot and temporary Carry condition without reapplying its automatic Day', () => {
    const draft = complete(setManualEffectEncounterChoice('join-in-the-class')(
      draftFor('travel-bog-j-spring')
    ));
    expect(draft.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'gain-inventory', fixedTarget: 'Handmade Pot (No Weight)', required: true }),
      expect.objectContaining({ kind: 'record-condition', fixedTarget: 'Carry +1 until the end of this Journey.', required: true })
    ]);
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'pottering:typed',
      state: manualState(),
      resolvedAt: 140
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.calendarDays).toBe(3);
    expect(resolved.value?.nextState.inventory).toEqual([
      expect.objectContaining({ name: 'Handmade Pot', weight: 0, type: 'item' })
    ]);
    expect(resolved.value?.nextState.conditions).toContain(
      'manual:travel-bog-j-spring:Carry +1 until the end of this Journey.'
    );
  });

  it('applies exactly one Grabby Paws card result and creates canonical Big Fish Parts', () => {
    let higher = setManualEffectEncounterChoice('grabby-paws')(draftFor('travel-loch-5-6'));
    higher = complete(setManualEffectInput('grabby-paws-result', '내 카드가 더 높음 · Big Fish 모든 부위 획득')(higher));
    const won = resolveManualEffectTransaction({
      draft: higher,
      transactionId: 'grabby:higher',
      state: manualState(),
      resolvedAt: 140
    });
    const bigFish = REAGENTS.find(row => row.canonicalName === 'Big Fish')!;
    expect(won.value?.nextState.inventory).toHaveLength(bigFish.preparations.length);
    expect(won.value?.nextState.inventory.every(item => item.canonicalReagentId === bigFish.id)).toBe(true);

    let lower = setManualEffectInput('grabby-paws-result', '물고기 카드가 더 높음 · 가방 물품 하나 분실')(higher);
    const stacked = reagentPart('Big Fish', 0, 'stacked-fish', 2);
    const loseAction = lower.actionTemplates.find(action => action.kind === 'remove-inventory')!;
    lower = complete(setManualEffectActionTarget(loseAction.id, stacked.id)(lower));
    const lost = resolveManualEffectTransaction({
      draft: lower,
      transactionId: 'grabby:lower',
      state: { ...manualState(), inventory: [stacked] },
      resolvedAt: 140
    });
    expect(lost.value?.nextState.inventory).toEqual([expect.objectContaining({ id: stacked.id, quantity: 1 })]);
  });

  it('stores the Push and Pull suit as one direction-specific movement follow-up', () => {
    let draft = setManualEffectEncounterChoice('continue')(draftFor('travel-loch-7-8'));
    draft = complete(setManualEffectInput('push-pull-suit', '♣ / ♠ · 뒤로 1경로 이동')(draft));
    expect(draft.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-movement', fixedTarget: expect.stringContaining('뒤로 1 Path') })
    ]);
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'push-pull:back',
      state: manualState(),
      resolvedAt: 140
    });
    expect(resolved.value?.nextState.pendingFollowUps).toEqual([
      expect.objectContaining({ description: expect.stringContaining('뒤로 1 Path') })
    ]);
  });

  it('atomically swaps one owned Reagent Part for a canonical Forest Part', () => {
    const offered = reagentPart('Big Fish', 0, 'collector-offer');
    let draft = setManualEffectEncounterChoice('collections-development-policy')(
      draftFor('foraging-forest-3')
    );
    draft = setManualEffectInput(COLLECTOR_FOREST_PART_INPUT_ID, FOREST_REAGENT_PART_OPTIONS[0])(draft);
    const remove = draft.actionTemplates.find(action => action.kind === 'remove-inventory')!;
    draft = complete(setManualEffectActionTarget(remove.id, offered.id)(draft));
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'collector:swap',
      state: { ...manualState(), inventory: [offered] },
      resolvedAt: 140
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.inventory).toEqual([
      expect.objectContaining({ type: 'reagent', canonicalReagentId: expect.any(String), preparationId: expect.any(String) })
    ]);
    expect(resolved.value?.nextState.inventory[0].id).not.toBe(offered.id);
  });

  it('enforces either exact Clammy Deal payment before granting the weightless Pearl', () => {
    let trinkets = setManualEffectEncounterChoice('a-clammy-deal')(draftFor('social-loch-spring-♣'));
    trinkets = complete(setManualEffectInput(CLAMMY_PAYMENT_INPUT_ID, '장신구 3개 지불')(trinkets));
    const paid = resolveManualEffectTransaction({
      draft: trinkets,
      transactionId: 'clammy:trinkets',
      state: manualState(),
      resolvedAt: 140
    });
    expect(paid.value?.nextState.trinkets).toBe(1);
    expect(paid.value?.nextState.inventory).toEqual([expect.objectContaining({ name: 'Pearl', weight: 0 })]);

    let partPayment = setManualEffectInput(CLAMMY_PAYMENT_INPUT_ID, '지정된 영약재 부위 하나 제공')(trinkets);
    const blackcurrant = reagentPart('Blackcurrant', 0, 'clammy-part');
    const payment = partPayment.actionTemplates.find(action => action.kind === 'remove-inventory')!;
    partPayment = complete(setManualEffectActionTarget(payment.id, blackcurrant.id)(partPayment));
    const traded = resolveManualEffectTransaction({
      draft: partPayment,
      transactionId: 'clammy:part',
      state: { ...manualState(), inventory: [blackcurrant] },
      resolvedAt: 140
    });
    expect(traded.status).toBe('resolved');
    expect(traded.value?.nextState.trinkets).toBe(4);
    expect(traded.value?.nextState.inventory).toEqual([expect.objectContaining({ name: 'Pearl' })]);
  });

  it('trades multiple Quick Cure Parts once and derives the reward from canonical eligible Potency', () => {
    const eligible = REAGENTS.flatMap(reagent => reagent.preparations.flatMap((preparation, index) => {
      const potency = preparation.tags
        .filter(tag => tag.tag === 'INFECTION' || tag.tag === 'BURN' || tag.tag === 'PAIN')
        .reduce((sum, tag) => sum + tag.value, 0);
      return potency > 0 ? [{ item: reagentPart(reagent.canonicalName, index, `quick:${reagent.id}:${index}`), potency }] : [];
    })).slice(0, 2);
    let draft = setManualEffectEncounterChoice('a-quick-cure')(draftFor('social-forest-odoak-♥'));
    draft = setManualEffectInput(QUICK_CURE_COUNT_INPUT_ID, 2)(draft);
    const removals = draft.actionTemplates.filter(action => action.kind === 'remove-inventory');
    removals.forEach((action, index) => { draft = setManualEffectActionTarget(action.id, eligible[index].item.id)(draft); });
    draft = complete(draft);
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'quick-cure:many',
      state: { ...manualState(), inventory: eligible.map(row => row.item) },
      resolvedAt: 140
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.inventory).toEqual([]);
    expect(resolved.value?.nextState.trinkets).toBe(4 + eligible.reduce((sum, row) => sum + row.potency, 0));
  });

  it('rejects forged or unaffordable typed trades before changing either side of the exchange', () => {
    let clammy = setManualEffectEncounterChoice('a-clammy-deal')(draftFor('social-loch-spring-♣'));
    clammy = complete(setManualEffectInput(CLAMMY_PAYMENT_INPUT_ID, '장신구 3개 지불')(clammy));
    const unaffordable = resolveManualEffectTransaction({
      draft: clammy,
      transactionId: 'clammy:unaffordable',
      state: { ...manualState(), trinkets: 2 },
      resolvedAt: 141
    });
    expect(unaffordable.status).toBe('invalid');
    expect(unaffordable.value).toBeNull();

    const offered = reagentPart('Big Fish', 0, 'collector-invalid-offer');
    let collector = setManualEffectEncounterChoice('collections-development-policy')(
      draftFor('foraging-forest-3')
    );
    collector = {
      ...collector,
      inputValues: { ...collector.inputValues, [COLLECTOR_FOREST_PART_INPUT_ID]: '꾸며 낸 영약재 · 없음 · 없음' }
    };
    const remove = collector.actionTemplates.find(action => action.kind === 'remove-inventory')!;
    collector = complete(setManualEffectActionTarget(remove.id, offered.id)(collector));
    const forged = resolveManualEffectTransaction({
      draft: collector,
      transactionId: 'collector:forged',
      state: { ...manualState(), inventory: [offered] },
      resolvedAt: 141
    });
    expect(forged.status).toBe('invalid');
    expect(forged.value).toBeNull();

    const onePart = reagentPart('Roses', 0, 'quick-only-one');
    let quick = setManualEffectEncounterChoice('a-quick-cure')(draftFor('social-forest-odoak-♥'));
    quick = setManualEffectInput(QUICK_CURE_COUNT_INPUT_ID, 2)(quick);
    for (const action of quick.actionTemplates.filter(row => row.kind === 'remove-inventory')) {
      quick = setManualEffectActionTarget(action.id, onePart.id)(quick);
    }
    const duplicate = resolveManualEffectTransaction({
      draft: complete(quick),
      transactionId: 'quick-cure:duplicate',
      state: { ...manualState(), inventory: [onePart] },
      resolvedAt: 141
    });
    expect(duplicate.status).toBe('invalid');
    expect(duplicate.value).toBeNull();
  });

  it('applies exactly the drawn Cold Shoulder suit result', () => {
    let clubs = setManualEffectEncounterChoice('cold-shoulder')(draftFor('travel-forest-m-winter'));
    clubs = complete(setManualEffectInput('cold-shoulder-suit', '♣ · Guild Reputation -1')(clubs));
    const rumour = resolveManualEffectTransaction({
      draft: clubs,
      transactionId: 'cold-shoulder:clubs',
      state: manualState(),
      resolvedAt: 142
    });
    expect(rumour.value?.nextState.reputation).toBe(5);
    expect(rumour.value?.nextState.trinkets).toBe(4);

    const calm = setManualEffectInput('cold-shoulder-suit', '♥ / ♦ · 변화 없이 여정 계속')(clubs);
    expect(calm.actionTemplates).toEqual([]);

    const spades = complete(setManualEffectInput('cold-shoulder-suit', '♠ · 장신구 -3')(clubs));
    const chased = resolveManualEffectTransaction({
      draft: spades,
      transactionId: 'cold-shoulder:spades',
      state: manualState(),
      resolvedAt: 142
    });
    expect(chased.value?.nextState.reputation).toBe(6);
    expect(chased.value?.nextState.trinkets).toBe(1);
  });

  it('stores Tobogganing as one typed destination without replaying its automatic Day or Reputation', () => {
    let draft = setManualEffectEncounterChoice('long-walk')(draftFor('travel-mountain-j-winter'));
    draft = complete(setManualEffectInput(TOBOGGAN_DESTINATION_INPUT_ID, 'Mossy Meadow')(draft));
    expect(draft.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-movement', targetInputId: TOBOGGAN_DESTINATION_INPUT_ID, required: true })
    ]);
    expect(draft.actionTemplates.some(action => action.kind === 'modify-days' || action.kind === 'modify-reputation')).toBe(false);
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'toboggan:long-walk',
      state: manualState(),
      resolvedAt: 142
    });
    expect(resolved.value?.nextState.calendarDays).toBe(3);
    expect(resolved.value?.nextState.reputation).toBe(6);
    expect(resolved.value?.nextState.pendingFollowUps).toEqual([
      expect.objectContaining({ description: 'Mossy Meadow' })
    ]);
  });

  it('cancels the current Forage and records the exact location only when the deer wins the trial', () => {
    let lost = setManualEffectEncounterChoice('instant-trial')(draftForAt('foraging-bog-m-autumn', 'bog-42'));
    lost = complete(setManualEffectInput(
      DEER_TRIAL_RESULT_INPUT_ID,
      '사슴 · 이번 채집 실패 및 이 위치 영구 출입 금지'
    )(lost));
    const resolved = resolveManualEffectTransaction({
      draft: lost,
      transactionId: 'duchy:lost',
      state: { ...manualState(), foragingPoints: 8 },
      resolvedAt: 142
    });
    expect(resolved.value?.nextState.foragingPoints).toBe(0);
    expect(resolved.value?.nextState.conditions).toContain(
      `manual:foraging-bog-m-autumn:${ENCOUNTER_CONDITION_CODES.duchyOfDeerBan}:bog-42`
    );

    const won = setManualEffectInput(DEER_TRIAL_RESULT_INPUT_ID, '약제사 · 이번 채집을 계속함')(lost);
    expect(won.actionTemplates).toEqual([]);
  });

  it('records the Boat and Lodge location effects as machine-readable until-Move conditions', () => {
    const boat = complete(setManualEffectEncounterChoice('the-boat-that-rocks')(
      draftForAt('foraging-loch-10-summer', 'loch-party')
    ));
    const boatResult = resolveManualEffectTransaction({
      draft: boat,
      transactionId: 'boat:startled',
      state: manualState(),
      resolvedAt: 142
    });
    expect(boatResult.value?.nextState.conditions).toContain(
      `manual:foraging-loch-10-summer:${ENCOUNTER_CONDITION_CODES.startledFish}:loch-party`
    );

    const visit = complete(setManualEffectEncounterChoice('visit')(
      draftForAt('foraging-loch-m-winter', 'lodge-loch')
    ));
    expect(visit.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-condition', fixedTarget: `${ENCOUNTER_CONDITION_CODES.lodgeVisit}:lodge-loch` })
    ]);
    const visited = resolveManualEffectTransaction({
      draft: visit,
      transactionId: 'lodge:visit',
      state: manualState(),
      resolvedAt: 142
    });
    expect(visited.value?.nextState.conditions).toContain(
      `manual:foraging-loch-m-winter:${ENCOUNTER_CONDITION_CODES.lodgeVisit}:lodge-loch`
    );

    const trade = complete(setManualEffectEncounterChoice('trade')(
      draftForAt('foraging-loch-m-winter', 'lodge-loch')
    ));
    expect(trade.actionTemplates).toEqual([
      expect.objectContaining({ fixedTarget: `${ENCOUNTER_CONDITION_CODES.lodgeTrade}:lodge-loch` })
    ]);
  });

  it('turns a lost Blood to Blood fight into one explicit permanent stat change', () => {
    let draft = setManualEffectEncounterChoice('blood-to-blood')(draftFor('foraging-mountain-10-autumn'));
    draft = complete(setManualEffectInput(HOWL_FIGHT_RESULT_INPUT_ID, '패배 · Carry -1')(draft));
    expect(draft.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'record-condition', fixedTarget: ENCOUNTER_CONDITION_CODES.howlCarryLoss })
    ]);
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'howl:carry',
      state: manualState(),
      resolvedAt: 142
    });
    expect(resolved.value?.nextState.conditions).toContain(
      `manual:foraging-mountain-10-autumn:${ENCOUNTER_CONDITION_CODES.howlCarryLoss}`
    );
    const repeated = resolveManualEffectTransaction({
      draft: { ...draft, transactionId: null },
      transactionId: 'howl:carry:again',
      state: resolved.value!.nextState,
      resolvedAt: 143
    });
    expect(repeated.value?.nextState.conditions.filter(condition =>
      condition === `manual:foraging-mountain-10-autumn:${ENCOUNTER_CONDITION_CODES.howlCarryLoss}`
    )).toHaveLength(2);
    expect(setManualEffectInput(HOWL_FIGHT_RESULT_INPUT_ID, '승리 · 수치 변화 없음')(draft).actionTemplates).toEqual([]);
  });

  it('atomically consumes one Thingamabob and grants only the selected canonical Titan Part', () => {
    const thingamabob = {
      id: 'thingamabob:owned',
      name: 'Titan Thingamabob',
      type: 'tool' as const,
      weight: 2 / 3,
      quantity: 1,
      canonicalToolId: 'titan-thingamabob'
    };
    let draft = setManualEffectEncounterChoice('action')(draftForAt('foraging-titan-6', 'titan-lock'));
    draft = complete(setManualEffectInput(TITAN_REAGENT_PART_INPUT_ID, TITAN_REAGENT_PART_OPTIONS[0])(draft));
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'lock-and-key:action',
      state: { ...manualState(), inventory: [thingamabob] },
      resolvedAt: 142
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.inventory).toEqual([
      expect.objectContaining({ type: 'reagent', canonicalReagentId: expect.any(String), preparationId: expect.any(String) })
    ]);
    const granted = REAGENTS.find(row => row.id === resolved.value?.nextState.inventory[0].canonicalReagentId);
    expect(granted?.type).toBe('TITAN');

    const unavailable = resolveManualEffectTransaction({
      draft: { ...draft, transactionId: null },
      transactionId: 'lock-and-key:no-tool',
      state: manualState(),
      resolvedAt: 142
    });
    expect(unavailable.status).toBe('invalid');
    expect(unavailable.value).toBeNull();

    const light = complete(setManualEffectEncounterChoice('light')(draftForAt('foraging-titan-6', 'titan-lock')));
    const lit = resolveManualEffectTransaction({
      draft: light,
      transactionId: 'lock-and-key:light',
      state: { ...manualState(), inventory: [thingamabob] },
      resolvedAt: 142
    });
    expect(lit.value?.nextState.inventory).toEqual([]);
    expect(lit.value?.nextState.conditions).toContain(
      `manual:foraging-titan-6:${ENCOUNTER_CONDITION_CODES.titanLight}:titan-lock`
    );
  });

  it('materializes every canonical Fish Part instead of one placeholder item', () => {
    const smallFish = REAGENTS.find(row => row.canonicalName === 'Small Fish')!;
    const bigFish = REAGENTS.find(row => row.canonicalName === 'Big Fish')!;
    const goFish = complete(setManualEffectEncounterChoice('go-fish')(draftFor('foraging-loch-10-winter')));
    const caughtSmall = resolveManualEffectTransaction({
      draft: goFish,
      transactionId: 'ice-fishing:small',
      state: manualState(),
      resolvedAt: 142
    });
    expect(caughtSmall.value?.nextState.inventory).toHaveLength(smallFish.preparations.length);
    expect(caughtSmall.value?.nextState.inventory.every(item => item.canonicalReagentId === smallFish.id)).toBe(true);

    let more = setManualEffectEncounterChoice('fish-some-more')(draftFor('foraging-loch-10-winter'));
    more = complete(setManualEffectInput('ice-fishing-card-result', '♣ · Big Fish의 모든 부위')(more));
    const caughtBig = resolveManualEffectTransaction({
      draft: more,
      transactionId: 'ice-fishing:big',
      state: manualState(),
      resolvedAt: 142
    });
    expect(caughtBig.value?.nextState.inventory).toHaveLength(bigFish.preparations.length);
    expect(caughtBig.value?.nextState.inventory.every(item => item.canonicalReagentId === bigFish.id)).toBe(true);
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

describe('typed canonical Encounter transactions (D)', () => {

  it('applies Working for a Snack without inventing an immediate marked Day', () => {
    const patient = resolvePatient({
      id: 'snack-patient', name: 'Patient', species: 'Mouse', ailmentIds: ['ailment-dullsweats']
    }).value!;
    const before = patient.timers[0].current;
    const draft = complete(setManualEffectEncounterChoice('working-for-a-snack')(
      draftFor('social-loch-autumn-♣')
    ));
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'working-snack:one',
      state: { ...manualState(), patient },
      resolvedAt: 200
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.calendarDays).toBe(3);
    expect(resolved.value?.nextState.patient?.timers[0].current).toBe(before - 1);
    expect(resolved.value?.nextState.inventory).toContainEqual(expect.objectContaining({
      name: 'Fresh Clams', weight: 2 / 3, barterValue: 3
    }));
    const clams = resolved.value!.nextState.inventory[0];
    expect(resolved.value?.nextState.conditions).toContain(
      `manual:social-loch-autumn-♣:${ENCOUNTER_CONDITION_CODES.freshClamsSpoil}:${clams.id}`
    );
  });

  it('consumes one canonical Reagent for Snack Time and increases only the chosen Timer', () => {
    const patient = resolvePatient({
      id: 'mountain-patient', name: 'Patient', species: 'Mouse', ailmentIds: ['ailment-dullsweats', 'ailment-anxious-scratching']
    }).value!;
    const offered = reagentPart(REAGENTS.find(row => row.preparations.length > 0)!.canonicalName, 0, 'snack-part');
    let draft = setManualEffectEncounterChoice('snack-time')(draftFor('foraging-mountain-10-summer'));
    const payment = draft.actionTemplates.find(action => action.id.endsWith(':snack-time:reagent'))!;
    const timer = draft.actionTemplates.find(action => action.id.endsWith(':snack-time:timer'))!;
    draft = setManualEffectActionTarget(payment.id, offered.id)(draft);
    draft = complete(setManualEffectActionTarget(timer.id, patient.timers[0].id)(draft));
    const before = patient.timers.map(row => row.current);
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'snack-time:one',
      state: { ...manualState(), patient, inventory: [offered] },
      resolvedAt: 201
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.inventory).toEqual([]);
    expect(resolved.value?.nextState.patient?.timers.map(row => row.current)).toEqual([
      Math.min(patient.timers[0].maximum, before[0] + 1), before[1]
    ]);
  });

  it('derives the Funeral Rites reward from the consumed ELSEWHERE Potency', () => {
    const reagent = REAGENTS.find(row => row.preparations.some(prep => prep.tags.some(tag => tag.tag === 'ELSEWHERE')))!;
    const preparationIndex = reagent.preparations.findIndex(prep => prep.tags.some(tag => tag.tag === 'ELSEWHERE'));
    const offered = reagentPart(reagent.canonicalName, preparationIndex, 'elsewhere-part');
    const potency = reagent.preparations[preparationIndex].tags
      .filter(tag => tag.tag === 'ELSEWHERE').reduce((sum, tag) => sum + tag.value, 0);
    let draft = setManualEffectEncounterChoice('funeral-rites')(draftFor('foraging-loch-8'));
    draft = complete(setManualEffectActionTarget(
      draft.actionTemplates.find(action => action.id.endsWith(':funeral-rites:elsewhere-part'))!.id,
      offered.id
    )(draft));
    const resolved = resolveManualEffectTransaction({
      draft,
      transactionId: 'funeral:one',
      state: { ...manualState(), inventory: [offered] },
      resolvedAt: 202
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.inventory).toEqual([]);
    expect(resolved.value?.nextState.reputation).toBe(6 + 1 + potency);

    const ordinary = REAGENTS.find(row => row.preparations.some(prep => prep.tags.every(tag => tag.tag !== 'ELSEWHERE')))!;
    const wrongPart = reagentPart(ordinary.canonicalName, ordinary.preparations.findIndex(prep => prep.tags.every(tag => tag.tag !== 'ELSEWHERE')), 'wrong-part');
    const wrongDraft = complete(setManualEffectActionTarget(
      draft.actionTemplates.find(action => action.id.endsWith(':funeral-rites:elsewhere-part'))!.id,
      wrongPart.id
    )({ ...draft, transactionId: null }));
    expect(resolveManualEffectTransaction({
      draft: wrongDraft, transactionId: 'funeral:wrong',
      state: { ...manualState(), inventory: [wrongPart] }, resolvedAt: 202
    }).status).toBe('invalid');
  });

  it('validates the two Bee Kind branches against the actual Bags and grants one Honeybee', () => {
    const fair = REAGENTS.find(row => row.preparations.some(prep => prep.tags.some(tag => tag.tag === 'FAIR')))!;
    const fairIndex = fair.preparations.findIndex(prep => prep.tags.some(tag => tag.tag === 'FAIR'));
    const supplied = reagentPart(fair.canonicalName, fairIndex, 'fair-part');
    let sweet = setManualEffectEncounterChoice('help-the-bee')(draftFor('foraging-meadow-j-summer'));
    sweet = setManualEffectInput(BEE_KIND_BRANCH_INPUT_ID, 'Sweet · Honey 또는 FAIR 부위 사용')(sweet);
    sweet = setManualEffectActionTarget(
      sweet.actionTemplates.find(action => action.id.endsWith(':bee-kind:supply'))!.id,
      supplied.id
    )(sweet);
    const sweetResult = resolveManualEffectTransaction({
      draft: complete(sweet), transactionId: 'bee:sweet',
      state: { ...manualState(), inventory: [supplied], companions: [], companionCapacity: 2 }, resolvedAt: 203
    });
    expect(sweetResult.status).toBe('resolved');
    expect(sweetResult.value?.nextState.inventory).toEqual([]);
    expect(sweetResult.value?.nextState.companions).toContainEqual(expect.objectContaining({ companionId: 'honeybee' }));

    const patient = resolvePatient({ id: 'bee-patient', name: 'Patient', species: 'Mouse', ailmentIds: ['ailment-dullsweats'] }).value!;
    const before = patient.timers[0].current;
    const rescue = complete(setManualEffectInput(
      BEE_KIND_BRANCH_INPUT_ID,
      'Rescue · 보유 재료 없이 모든 타이머 -4'
    )(setManualEffectEncounterChoice('help-the-bee')(draftFor('foraging-meadow-j-summer'))));
    const rescued = resolveManualEffectTransaction({
      draft: rescue, transactionId: 'bee:rescue',
      state: { ...manualState(), patient, companions: [], companionCapacity: 2 }, resolvedAt: 204
    });
    expect(rescued.status).toBe('resolved');
    expect(rescued.value?.nextState.patient?.timers[0].current).toBe(Math.max(0, before - 4));
    expect(rescued.value?.nextState.companions).toContainEqual(expect.objectContaining({ companionId: 'honeybee' }));
    expect(resolveManualEffectTransaction({
      draft: { ...rescue, transactionId: null }, transactionId: 'bee:forged-rescue',
      state: { ...manualState(), patient, inventory: [supplied], companions: [], companionCapacity: 2 }, resolvedAt: 204
    }).status).toBe('invalid');
  });

  it('handles both Fluttering Fancy branches with canonical Plant Parts', () => {
    const plant = REAGENTS.find(row => row.type === 'PLANT')!;
    const payment = reagentPart(plant.canonicalName, 0, 'plant-part');
    let befriend = setManualEffectEncounterChoice('befriend-it')(draftFor('foraging-bog-j-spring'));
    befriend = setManualEffectActionTarget(
      befriend.actionTemplates.find(action => action.id.endsWith(':butterfly:plant-payment'))!.id,
      payment.id
    )(befriend);
    const befriended = resolveManualEffectTransaction({
      draft: complete(befriend), transactionId: 'butterfly:friend',
      state: { ...manualState(), inventory: [payment], companions: [], companionCapacity: 2 }, resolvedAt: 205
    });
    expect(befriended.status).toBe('resolved');
    expect(befriended.value?.nextState.companions).toContainEqual(expect.objectContaining({ companionId: 'butterfly' }));

    let follow = setManualEffectEncounterChoice('follow-it')(draftFor('foraging-bog-j-spring'));
    follow = setManualEffectInput(BUTTERFLY_CARD_VALUE_INPUT_ID, 12)(follow);
    const option = follow.inputFields.find(field => field.id === BUTTERFLY_PLANT_PART_INPUT_ID)!.options![0];
    follow = complete(setManualEffectInput(BUTTERFLY_PLANT_PART_INPUT_ID, option)(follow));
    const followed = resolveManualEffectTransaction({
      draft: follow, transactionId: 'butterfly:follow', state: manualState(), resolvedAt: 206
    });
    expect(followed.status).toBe('resolved');
    expect(followed.value?.nextState.inventory).toContainEqual(expect.objectContaining({ type: 'reagent' }));
  });

  it('keeps every Deep Water split exclusive and totaling exactly five', () => {
    for (let timerLoss = 0; timerLoss <= 5; timerLoss += 1) {
      const scoped = setManualEffectInput(DEEP_WATER_SPLIT_INPUT_ID, String(timerLoss))(
        setManualEffectEncounterChoice('deep-water')(draftFor('foraging-loch-a'))
      );
      const total = scoped.actionTemplates.reduce((sum, action) => sum + Math.abs(action.amount || 0), 0);
      expect(total, `timer split ${timerLoss}`).toBe(5);
      expect(scoped.actionTemplates.every(action => action.required)).toBe(true);
    }

    const patient = resolvePatient({
      id: 'deep-water-patient', name: 'Patient', species: 'Mouse', ailmentIds: ['ailment-dullsweats']
    }).value!;
    const before = patient.timers[0].current;
    const split = complete(setManualEffectInput(DEEP_WATER_SPLIT_INPUT_ID, '3')(
      setManualEffectEncounterChoice('deep-water')(draftFor('foraging-loch-a'))
    ));
    const resolved = resolveManualEffectTransaction({
      draft: split, transactionId: 'deep-water:split',
      state: { ...manualState(), patient, foragingPoints: 6 }, resolvedAt: 206
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.nextState.patient?.timers[0].current).toBe(Math.max(0, before - 3));
    expect(resolved.value?.nextState.foragingPoints).toBe(4);
  });

  it('charges exactly five Trinkets only when buying each canonical market item', () => {
    const cases = [
      ['social-loch-settlement-♦', 'projects-wide', 'Bark Coracle', { canonicalToolId: 'bark-coracle' }],
      ['social-mountain-spoolkeep-♥', 'offcuts', 'Lumpy Blanket', { craftedItemId: 'knitted-blanket' }]
    ] as const;
    for (const [ownerId, choiceId, itemName, metadata] of cases) {
      const buy = complete(setManualEffectInput(PURCHASE_DECISION_INPUT_ID, '구입 · 장신구 5개 지불')(
        setManualEffectEncounterChoice(choiceId)(draftFor(ownerId))
      ));
      const bought = resolveManualEffectTransaction({
        draft: buy, transactionId: `purchase:${choiceId}`,
        state: { ...manualState(), trinkets: 5 }, resolvedAt: 207
      });
      expect(bought.status).toBe('resolved');
      expect(bought.value?.nextState.trinkets).toBe(0);
      expect(bought.value?.nextState.inventory).toContainEqual(expect.objectContaining({ name: itemName, ...metadata }));
      expect(resolveManualEffectTransaction({
        draft: { ...buy, transactionId: null }, transactionId: `purchase:poor:${choiceId}`,
        state: { ...manualState(), trinkets: 4 }, resolvedAt: 207
      }).status).toBe('invalid');

      const decline = complete(setManualEffectInput(PURCHASE_DECISION_INPUT_ID, '구입하지 않음')(
        setManualEffectEncounterChoice(choiceId)(draftFor(ownerId, 101))
      ));
      const declined = resolveManualEffectTransaction({
        draft: decline, transactionId: `decline:${choiceId}`, state: manualState(), resolvedAt: 208
      });
      expect(declined.value?.nextState.trinkets).toBe(4);
      expect(declined.value?.nextState.inventory).toEqual([]);
    }
  });

  it('does not require legacy free-text prose to commit a mechanical result', () => {
    const draft: ManualEffectDraft = {
      ...draftFor('social-forest-spring-♣'),
      inputFields: [{ id: 'legacy-prose', type: 'free-text', label: '이야기', required: true }],
      inputValues: {},
      resultSummary: '',
      journalNote: ''
    };
    const resolved = resolveManualEffectTransaction({
      draft, transactionId: 'optional-prose', state: manualState(), resolvedAt: 209
    });
    expect(resolved.status).toBe('resolved');
    expect(resolved.value?.record.resultSummary).not.toBe('');
  });
});
