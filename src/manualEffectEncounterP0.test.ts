import { describe, expect, it } from 'vitest';
import {
  PRINTED_EFFECT_BY_OWNER,
  REAGENTS,
  createManualEffectDraft,
  resolveManualEffectTransaction,
  type EngineInventoryItem,
  type ManualEffectDraft,
  type ManualResolutionRuntimeState,
  type Season
} from './rules';
import {
  ANCIENT_SALVAGE_RESULT_INPUT_ID,
  ANCIENT_SALVAGE_RESULT_OPTIONS,
  BRANCH_BEATEN_REAGENT_INPUT_ID,
  BRANCH_BEATEN_RESULT_INPUT_ID,
  BRANCH_BEATEN_RESULT_OPTIONS,
  EARTH_REAGENT_PART_OPTIONS,
  LEECH_REAGENT_PART_INPUT_ID,
  LEECH_REAGENT_PART_OPTIONS,
  MANUAL_CARD_VALUE_OPTIONS,
  PILEDRIVER_DISCARD_COUNT_INPUT_ID,
  PILEDRIVER_RESULT_INPUT_ID,
  PILEDRIVER_RESULT_OPTIONS,
  PLEASANT_SURPRISE_CARD_INPUT_ID,
  PLEASANT_SURPRISE_REAGENT_INPUT_ID,
  bogReagentPartOptionsForSeason,
  canonicalReagentPartOption,
  setManualEffectActionTarget,
  setManualEffectEncounterChoice,
  setManualEffectInput
} from './manualEffectDraftState';

const draftFor = (ownerId: string, season?: Season): ManualEffectDraft => createManualEffectDraft(
  PRINTED_EFFECT_BY_OWNER.get(ownerId)!,
  'encounter',
  {
    encounterTransactionId: `encounter:${ownerId}`,
    continuation: 'none',
    ...(season ? { season } : {})
  },
  100
);

const state = (inventory: EngineInventoryItem[] = []): ManualResolutionRuntimeState => ({
  reputation: 6,
  trinkets: 4,
  calendarDays: 3,
  foragingPoints: 2,
  inventory,
  patient: null,
  conditions: [],
  pendingFollowUps: [],
  appliedTransactionIds: []
});

const complete = (draft: ManualEffectDraft): ManualEffectDraft => ({
  ...draft,
  resultSummary: '원문 카드 결과를 적용했습니다.',
  journalNote: ''
});

const item = (id: string, weight: number, quantity = 1): EngineInventoryItem => ({
  id,
  name: id,
  type: 'item',
  weight,
  quantity
});

describe('high-priority printed Encounter transactions', () => {
  it('p.75 applies exactly one Branch-Beaten result and restricts the reward to the current Bog season', () => {
    let below = setManualEffectEncounterChoice('draw-and-pass-the-branches')(
      draftFor('travel-bog-5-6', 'Spring')
    );
    below = complete(setManualEffectInput(BRANCH_BEATEN_RESULT_INPUT_ID, BRANCH_BEATEN_RESULT_OPTIONS[0])(below));
    expect(below.actionTemplates).toEqual([
      expect.objectContaining({ kind: 'modify-days', amount: 1, required: true })
    ]);
    const marked = resolveManualEffectTransaction({
      draft: below,
      transactionId: 'branch-beaten:below',
      state: state(),
      resolvedAt: 200
    });
    expect(marked.status).toBe('resolved');
    expect(marked.value?.nextState.calendarDays).toBe(4);
    expect(marked.value?.nextState.inventory).toEqual([]);

    const middle = complete(setManualEffectInput(
      BRANCH_BEATEN_RESULT_INPUT_ID,
      BRANCH_BEATEN_RESULT_OPTIONS[1]
    )(below));
    expect(middle.actionTemplates).toEqual([]);
    expect(resolveManualEffectTransaction({
      draft: middle,
      transactionId: 'branch-beaten:middle',
      state: state(),
      resolvedAt: 200
    }).value?.nextState.calendarDays).toBe(3);

    const springOptions = bogReagentPartOptionsForSeason('Spring');
    expect(springOptions.length).toBeGreaterThan(0);
    let reward = setManualEffectInput(
      BRANCH_BEATEN_RESULT_INPUT_ID,
      BRANCH_BEATEN_RESULT_OPTIONS[2]
    )(below);
    reward = complete(setManualEffectInput(BRANCH_BEATEN_REAGENT_INPUT_ID, springOptions[0])(reward));
    const gained = resolveManualEffectTransaction({
      draft: reward,
      transactionId: 'branch-beaten:reward',
      state: state(),
      resolvedAt: 200
    });
    expect(gained.status).toBe('resolved');
    expect(gained.value?.nextState.inventory).toEqual([
      expect.objectContaining({
        type: 'reagent',
        canonicalReagentId: expect.any(String),
        preparationId: expect.any(String)
      })
    ]);

    const unavailable = REAGENTS.find(reagent => reagent.regionAvailability.Bog === 'Unavailable')!;
    const forgedOption = canonicalReagentPartOption(unavailable.id, unavailable.preparations[0].id)!;
    const forged = {
      ...reward,
      inputFields: reward.inputFields.map(field => field.id === BRANCH_BEATEN_REAGENT_INPUT_ID
        ? { ...field, options: [forgedOption] }
        : field),
      inputValues: { ...reward.inputValues, [BRANCH_BEATEN_REAGENT_INPUT_ID]: forgedOption }
    };
    expect(resolveManualEffectTransaction({
      draft: forged,
      transactionId: 'branch-beaten:forged',
      state: state(),
      resolvedAt: 200
    }).status).toBe('invalid');
  });

  it('p.76 stores Silver Lining as one real canonical Leech Part', () => {
    let draft = setManualEffectEncounterChoice('continue')(
      draftFor('travel-bog-9-10-summer')
    );
    draft = complete(setManualEffectInput(LEECH_REAGENT_PART_INPUT_ID, LEECH_REAGENT_PART_OPTIONS[0])(draft));
    const result = resolveManualEffectTransaction({
      draft,
      transactionId: 'that-sucks:leech',
      state: state(),
      resolvedAt: 200
    });
    const leech = REAGENTS.find(reagent => reagent.canonicalName === 'Leech')!;
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.inventory).toEqual([
      expect.objectContaining({
        type: 'reagent',
        canonicalReagentId: leech.id,
        preparationId: leech.preparations[0].id,
        quantity: 1
      })
    ]);

    const wrong = REAGENTS.find(reagent => reagent.canonicalName !== 'Leech')!;
    const wrongOption = canonicalReagentPartOption(wrong.id, wrong.preparations[0].id)!;
    const forged = {
      ...draft,
      inputFields: draft.inputFields.map(field => field.id === LEECH_REAGENT_PART_INPUT_ID
        ? { ...field, options: [wrongOption] }
        : field),
      inputValues: { ...draft.inputValues, [LEECH_REAGENT_PART_INPUT_ID]: wrongOption }
    };
    expect(resolveManualEffectTransaction({
      draft: forged,
      transactionId: 'that-sucks:forged',
      state: state(),
      resolvedAt: 200
    }).status).toBe('invalid');
  });

  it('p.78 adds exactly one weightless Juicy Gossip Guild Note and is idempotent', () => {
    const draft = complete(setManualEffectEncounterChoice('eavesdrop')(
      draftFor('travel-forest-5-6')
    ));
    const first = resolveManualEffectTransaction({
      draft,
      transactionId: 'hot-tea:gossip',
      state: state(),
      resolvedAt: 200
    });
    expect(first.status).toBe('resolved');
    expect(first.value?.nextState.inventory).toEqual([expect.objectContaining({
      name: 'Juicy Gossip',
      type: 'item',
      weight: 0,
      quantity: 1,
      guildNote: { kind: 'gossip' }
    })]);
    expect(first.value?.nextState.pendingFollowUps).toEqual([]);
    expect(resolveManualEffectTransaction({
      draft,
      transactionId: 'hot-tea:gossip',
      state: first.value!.nextState,
      resolvedAt: 201
    }).status).toBe('invalid');

    const duplicated = { ...draft, selectedActionIds: [...draft.selectedActionIds, ...draft.selectedActionIds] };
    expect(resolveManualEffectTransaction({
      draft: duplicated,
      transactionId: 'hot-tea:duplicate',
      state: state(),
      resolvedAt: 200
    }).status).toBe('invalid');
  });

  it('p.81 validates the Diamond Carry threshold and atomically discards at least 3 Weight across items', () => {
    let chased = setManualEffectEncounterChoice('hurry-forwards')(
      draftFor('travel-forest-j-winter')
    );
    chased = setManualEffectInput(PILEDRIVER_RESULT_INPUT_ID, PILEDRIVER_RESULT_OPTIONS[3])(chased);
    chased = setManualEffectInput(PILEDRIVER_DISCARD_COUNT_INPUT_ID, 2)(chased);
    const removals = chased.actionTemplates.filter(action => action.kind === 'remove-inventory');
    chased = setManualEffectActionTarget(removals[0].id, 'heavy')(chased);
    chased = complete(setManualEffectActionTarget(removals[1].id, 'light')(chased));
    const before = state([item('heavy', 2), item('light', 1)]);
    const result = resolveManualEffectTransaction({
      draft: chased,
      transactionId: 'piledriver:chased',
      state: before,
      resolvedAt: 200
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.inventory).toEqual([]);
    expect(before.inventory).toHaveLength(2);

    const insufficient = resolveManualEffectTransaction({
      draft: chased,
      transactionId: 'piledriver:insufficient',
      state: state([item('heavy', 1), item('light', 1)]),
      resolvedAt: 200
    });
    expect(insufficient.status).toBe('invalid');
    expect(insufficient.messages.join(' ')).toContain('3 total Weight');

    let duplicate = setManualEffectInput(PILEDRIVER_DISCARD_COUNT_INPUT_ID, 2)(chased);
    const duplicateActions = duplicate.actionTemplates.filter(action => action.kind === 'remove-inventory');
    duplicate = setManualEffectActionTarget(duplicateActions[0].id, 'single')(duplicate);
    duplicate = complete(setManualEffectActionTarget(duplicateActions[1].id, 'single')(duplicate));
    expect(resolveManualEffectTransaction({
      draft: duplicate,
      transactionId: 'piledriver:duplicate',
      state: state([item('single', 3, 1)]),
      resolvedAt: 200
    }).status).toBe('invalid');

    let wrongDiamond = setManualEffectEncounterChoice('hurry-forwards')(
      draftFor('travel-forest-j-winter')
    );
    wrongDiamond = complete(setManualEffectInput(
      PILEDRIVER_RESULT_INPUT_ID,
      PILEDRIVER_RESULT_OPTIONS[1]
    )(wrongDiamond));
    expect(resolveManualEffectTransaction({
      draft: wrongDiamond,
      transactionId: 'piledriver:wrong-diamond',
      state: state([item('too-heavy', 5)]),
      resolvedAt: 200
    }).status).toBe('invalid');
  });

  it('p.154 grants a canonical Titan Thingamabob only for the 10-or-more result', () => {
    let success = setManualEffectEncounterChoice('dig')(draftFor('foraging-bog-2'));
    success = complete(setManualEffectInput(
      ANCIENT_SALVAGE_RESULT_INPUT_ID,
      ANCIENT_SALVAGE_RESULT_OPTIONS[0]
    )(success));
    const result = resolveManualEffectTransaction({
      draft: success,
      transactionId: 'ancient-salvage:success',
      state: state(),
      resolvedAt: 200
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.inventory).toEqual([expect.objectContaining({
      name: 'Titan Thingamabob',
      type: 'tool',
      weight: 2 / 3,
      canonicalToolId: 'titan-thingamabob'
    })]);

    const failure = complete(setManualEffectInput(
      ANCIENT_SALVAGE_RESULT_INPUT_ID,
      ANCIENT_SALVAGE_RESULT_OPTIONS[1]
    )(success));
    expect(failure.actionTemplates).toEqual([]);
    expect(resolveManualEffectTransaction({
      draft: failure,
      transactionId: 'ancient-salvage:failure',
      state: state(),
      resolvedAt: 200
    }).value?.nextState.inventory).toEqual([]);

    const stale = {
      ...success,
      inputValues: {
        ...success.inputValues,
        [ANCIENT_SALVAGE_RESULT_INPUT_ID]: ANCIENT_SALVAGE_RESULT_OPTIONS[1]
      }
    };
    expect(resolveManualEffectTransaction({
      draft: stale,
      transactionId: 'ancient-salvage:stale',
      state: state(),
      resolvedAt: 200
    }).status).toBe('invalid');
  });

  it('p.178 chooses an Earth Part before the draw and compares only its Base Rarity', () => {
    const earth = REAGENTS.find(reagent => reagent.type === 'EARTH'
      && reagent.baseRarity > 1 && reagent.baseRarity <= 10)!;
    const earthOption = canonicalReagentPartOption(earth.id, earth.preparations[0].id)!;
    expect(EARTH_REAGENT_PART_OPTIONS).toContain(earthOption);
    let success = setManualEffectEncounterChoice('luck')(draftFor('foraging-mountain-3'));
    success = setManualEffectInput(PLEASANT_SURPRISE_REAGENT_INPUT_ID, earthOption)(success);
    success = complete(setManualEffectInput(
      PLEASANT_SURPRISE_CARD_INPUT_ID,
      MANUAL_CARD_VALUE_OPTIONS[earth.baseRarity - 1]
    )(success));
    const result = resolveManualEffectTransaction({
      draft: success,
      transactionId: 'pleasant-surprise:success',
      state: state(),
      resolvedAt: 200
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.inventory).toEqual([expect.objectContaining({
      type: 'reagent',
      canonicalReagentId: earth.id,
      preparationId: earth.preparations[0].id
    })]);

    const failure = complete(setManualEffectInput(
      PLEASANT_SURPRISE_CARD_INPUT_ID,
      MANUAL_CARD_VALUE_OPTIONS[0]
    )(success));
    expect(failure.actionTemplates).toEqual([]);
    expect(resolveManualEffectTransaction({
      draft: failure,
      transactionId: 'pleasant-surprise:failure',
      state: state(),
      resolvedAt: 200
    }).value?.nextState.inventory).toEqual([]);

    const nonEarth = REAGENTS.find(reagent => reagent.type !== 'EARTH')!;
    const nonEarthOption = canonicalReagentPartOption(nonEarth.id, nonEarth.preparations[0].id)!;
    const forged = {
      ...success,
      inputFields: success.inputFields.map(field => field.id === PLEASANT_SURPRISE_REAGENT_INPUT_ID
        ? { ...field, options: [nonEarthOption] }
        : field),
      inputValues: { ...success.inputValues, [PLEASANT_SURPRISE_REAGENT_INPUT_ID]: nonEarthOption }
    };
    expect(resolveManualEffectTransaction({
      draft: forged,
      transactionId: 'pleasant-surprise:forged',
      state: state(),
      resolvedAt: 200
    }).status).toBe('invalid');
  });
});
