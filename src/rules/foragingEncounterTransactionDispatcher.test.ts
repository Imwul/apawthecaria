import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID, REAGENT_BY_NAME } from './data/reagents';
import { TOOL_BY_ID } from './data/tools';
import type { PatientState } from './state';
import type { CanonicalToolState } from './toolEngine';
import {
  FORAGING_ENCOUNTER_IDS,
  MEEK_ENCOUNTER_IDS,
  TRAPPED_ENCOUNTER_IDS,
  canonicalEncounterPartCandidates,
  type EncounterInventoryItem,
  type ForagingEncounterTransactionState
} from './foragingEncounterTransactions';
import {
  FORAGING_ENCOUNTER_TRANSACTION_CODES,
  dispatchForagingEncounterTransaction,
  type ForagingEncounterTransactionCommand
} from './foragingEncounterTransactionDispatcher';

const patient = (): PatientState => ({
  id: 'patient-1',
  name: 'Moss',
  species: 'Badger',
  status: 'active',
  ailments: [{
    id: 'ailment-instance-1',
    ailmentId: 'ailment-1',
    severity: 'lesser',
    timerIds: ['timer-1', 'timer-2'],
    conditionIds: [],
    treatmentHistoryIds: [],
    status: 'active',
    instance: 1,
    repeatIndex: 0,
    specialState: {},
    successResolved: false,
    failureResolved: false,
    consequenceResolved: false,
    effectIds: []
  }],
  timers: [
    { id: 'timer-1', ailmentInstanceId: 'ailment-instance-1', current: 6, maximum: 8, status: 'active' },
    { id: 'timer-2', ailmentInstanceId: 'ailment-instance-1', current: 2, maximum: 8, status: 'active' }
  ],
  conditions: [],
  treatmentHistory: [],
  journalEvents: []
});

const state = (overrides: Partial<ForagingEncounterTransactionState> = {}): ForagingEncounterTransactionState => ({
  revision: 3,
  reputation: 15,
  trinkets: 4,
  foragingPoints: 2,
  inventory: [],
  patient: patient(),
  tools: [],
  companions: [],
  conditions: [],
  deliveries: [],
  sainDeClawsQuests: [],
  appliedTransactionIds: [],
  ...overrides
});

const canonicalTool = (toolId: string, id = `tool:${toolId}`): { item: EncounterInventoryItem; tool: CanonicalToolState } => {
  const definition = TOOL_BY_ID.get(toolId)!;
  return {
    item: { id, name: definition.canonicalName, type: 'tool', weight: definition.weight, quantity: 1, canonicalToolId: toolId },
    tool: { instanceId: id, toolId, upgradeId: null, charges: null, broken: false, consumed: false, acquiredBy: 'test', appliedEffectIds: [] }
  };
};

const part = (name: string, partName?: string) => {
  const reagent = REAGENT_BY_NAME.get(name)!;
  const preparation = partName ? reagent.preparations.find(row => row.name === partName)! : reagent.preparations[0];
  return { reagentId: reagent.id, preparationId: preparation.id };
};

describe('foraging encounter transaction dispatcher', () => {
  it('does not let a manual-effect code resolve its sibling choice', () => {
    const result = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.rightPlaceVigilante,
      input: {
        transactionId: 'right-place:mixed-branch',
        encounterId: FORAGING_ENCOUNTER_IDS.rightPlaceWrongTime,
        expectedRevision: 3,
        state: state(),
        choice: 'archer'
      }
    });

    expect(result).toMatchObject({ status: 'invalid', code: 'invalid-choice', value: null });
  });

  it('routes the Branded compassion branch to the immediate Lesser Ailment directive', () => {
    const result = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.startBrandedLesserAilment,
      input: {
        transactionId: 'branded:compassion',
        encounterId: FORAGING_ENCOUNTER_IDS.theBranded,
        expectedRevision: 3,
        state: state(),
        choice: 'compassion'
      }
    });

    expect(result.value?.directives).toContainEqual({
      kind: 'start-lesser-ailment-before-overstay',
      sourcePage: 162
    });
  });

  it('routes all-Timer and canonical Reagent outcomes without trusting UI labels', () => {
    const fairPart = canonicalEncounterPartCandidates({ region: 'Forest', requiredTag: 'FAIR' })[0];
    const result = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.alluringOdours,
      input: {
        transactionId: 'alluring:dispatcher',
        encounterId: FORAGING_ENCOUNTER_IDS.alluringOdours,
        expectedRevision: 3,
        state: state(),
        card: { value: 7, suit: '♣' },
        ...fairPart
      }
    });

    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.patient?.timers.map(timer => timer.current)).toEqual([5, 1]);
    expect(result.value?.nextState.inventory).toHaveLength(1);
  });

  it('keeps Project Launch Reputation deferred until the exact delivery is completed once', () => {
    const pickup = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.projectLaunch,
      input: {
        transactionId: 'project:pickup',
        encounterId: FORAGING_ENCOUNTER_IDS.projectLaunch,
        expectedRevision: 3,
        state: state(),
        choice: 'watch'
      }
    });
    const afterPickup = pickup.value!.nextState;
    const deliveryId = afterPickup.deliveries[0].id;

    expect(afterPickup.reputation).toBe(15);
    expect(afterPickup.patient?.timers.map(timer => timer.current)).toEqual([4, 0]);

    const delivery = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.deliveryHook,
      input: {
        transactionId: 'project:delivery',
        encounterId: 'encounter-delivery',
        expectedRevision: afterPickup.revision,
        state: afterPickup,
        deliveryId,
        currentLocationId: 'odoak',
        currentLocationType: 'Settlement'
      }
    });
    expect(delivery.value?.nextState.reputation).toBe(17);
    expect(delivery.value?.nextState.deliveries[0].status).toBe('resolved');
    expect(delivery.value?.nextState.inventory).toHaveLength(0);

    const replayWithFreshId = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.deliveryHook,
      input: {
        transactionId: 'project:delivery:again',
        encounterId: 'encounter-delivery',
        expectedRevision: delivery.value!.nextState.revision,
        state: delivery.value!.nextState,
        deliveryId,
        currentLocationId: 'odoak',
        currentLocationType: 'Settlement'
      }
    });
    expect(replayWithFreshId).toMatchObject({ status: 'invalid', code: 'invalid-selection' });
  });

  it('routes the Sain De Claws forage, return, and season-end lifecycle atomically', () => {
    const started = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.startSainDeClaws,
      input: {
        transactionId: 'sain:start',
        encounterId: 'foraging-meadow-9-winter',
        expectedRevision: 3,
        state: state(),
        locationId: 'odoak',
        targetCards: [
          { value: 2, suit: '♥' },
          { value: 7, suit: '♦' },
          { value: 12, suit: '♠' }
        ]
      }
    });
    const questId = started.value!.nextState.sainDeClawsQuests[0].id;
    const matched = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.sainMatchHook,
      input: {
        transactionId: 'sain:match:0',
        encounterId: 'sain-de-claws-match',
        expectedRevision: started.value!.nextState.revision,
        state: started.value!.nextState,
        questId,
        forageTransactionId: 'forage:match:0',
        locationId: 'odoak',
        forageCard: { value: 2, suit: '♣' },
        targetIndex: 0
      }
    });
    const returned = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.sainReturnHook,
      input: {
        transactionId: 'sain:return:0',
        encounterId: 'sain-de-claws-return',
        expectedRevision: matched.value!.nextState.revision,
        state: matched.value!.nextState,
        questId,
        locationId: 'odoak',
        targetIndexes: [0]
      }
    });
    const settled = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.sainSeasonEndHook,
      input: {
        transactionId: 'sain:season-end',
        encounterId: 'sain-de-claws-season-end',
        expectedRevision: returned.value!.nextState.revision,
        state: returned.value!.nextState,
        questId,
        atSeasonEnd: true
      }
    });

    expect(settled.value?.nextState.trinkets).toBe(5);
    expect(settled.value?.nextState.sainDeClawsQuests[0].status).toBe('resolved');
  });

  it('rejects a Titan power choice wired to the wrong manual-effect code', () => {
    const result = dispatchForagingEncounterTransaction({
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerLight,
      input: {
        transactionId: 'lock-and-key:mixed-branch',
        encounterId: 'foraging-titan-6',
        expectedRevision: 3,
        state: state(),
        choice: 'action',
        locationId: 'glasswall',
        reagentId: 'forged-reagent',
        preparationId: 'forged-part'
      }
    });

    expect(result).toMatchObject({ status: 'invalid', code: 'invalid-choice', value: null });
  });

  it('has a valid, canonical transaction for every non-lifecycle dispatcher code', () => {
    const crossbow = canonicalTool('crossbow');
    const bolts = canonicalTool('bolts');
    const thingamabob = canonicalTool('titan-thingamabob');
    const beetles = REAGENT_BY_NAME.get('Beetles')!;
    const meadowPart = canonicalEncounterPartCandidates({ region: 'Meadow', maximumRarity: 12, types: ['PLANT', 'INSECT'] })[0];
    const meadowPartRarity = meadowPart ? REAGENT_BY_ID.get(meadowPart.reagentId)?.baseRarity : undefined;
    const titanPart = canonicalEncounterPartCandidates({ types: ['TITAN'] })[0];
    const charcoal = part('Doused Bonfires', 'Charcoal');
    const sheddings = part('Animal Sheddings', 'Hair');

    expect(meadowPart).toBeDefined();
    expect(meadowPartRarity).toBeDefined();
    expect(titanPart).toBeDefined();

    const validCommands = [
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.rightPlaceVigilante,
        input: { transactionId: 'coverage:right:vigilante', encounterId: FORAGING_ENCOUNTER_IDS.rightPlaceWrongTime, expectedRevision: 3, state: state(), choice: 'vigilante', playerCard: { value: 8, suit: '♥' }, robberCard: { value: 3, suit: '♠' } }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.rightPlaceArcher,
        input: { transactionId: 'coverage:right:archer', encounterId: FORAGING_ENCOUNTER_IDS.rightPlaceWrongTime, expectedRevision: 3, state: state({ inventory: [crossbow.item, bolts.item], tools: [crossbow.tool, bolts.tool] }), choice: 'archer' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.friendInNeed,
        input: { transactionId: 'coverage:friend', encounterId: FORAGING_ENCOUNTER_IDS.friendInNeed, expectedRevision: 3, state: state(), choice: 'keep-to-yourself' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.logKnocking,
        input: { transactionId: 'coverage:log', encounterId: 'foraging-forest-6', expectedRevision: 3, state: state(), reagentId: beetles.id, partSelections: [{ preparationId: beetles.preparations[0].id }] }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.startBrandedLesserAilment,
        input: { transactionId: 'coverage:branded', encounterId: FORAGING_ENCOUNTER_IDS.theBranded, expectedRevision: 3, state: state(), choice: 'compassion' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.alluringOdours,
        input: { transactionId: 'coverage:odours', encounterId: FORAGING_ENCOUNTER_IDS.alluringOdours, expectedRevision: 3, state: state(), card: { value: 6, suit: '♣' } }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.riverSnatchers,
        input: { transactionId: 'coverage:river', encounterId: FORAGING_ENCOUNTER_IDS.riverSnatchers, expectedRevision: 3, state: state(), card: { value: 3, suit: '♦' }, expectedBagUnitIds: [] }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fabledBehemothRow,
        input: { transactionId: 'coverage:fabled:row', encounterId: FORAGING_ENCOUNTER_IDS.fabledBehemoth, expectedRevision: 3, state: state(), choice: 'row', card: { value: 4, suit: '♥' } }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fabledBehemothFace,
        input: { transactionId: 'coverage:fabled:face', encounterId: FORAGING_ENCOUNTER_IDS.fabledBehemoth, expectedRevision: 3, state: state({ inventory: [crossbow.item, bolts.item], tools: [crossbow.tool, bolts.tool] }), choice: 'face', ...titanPart }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fowlFareAirlift,
        input: { transactionId: 'coverage:fowl:airlift', encounterId: 'foraging-meadow-8', expectedRevision: 3, state: state({ reputation: 35 }), choice: 'airlift' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fowlFareTaxi,
        input: { transactionId: 'coverage:fowl:taxi', encounterId: 'foraging-meadow-8', expectedRevision: 3, state: state(), choice: 'taxi' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fowlFareDecline,
        input: { transactionId: 'coverage:fowl:decline', encounterId: 'foraging-meadow-8', expectedRevision: 3, state: state(), choice: 'decline' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.antHeist,
        input: { transactionId: 'coverage:ant', encounterId: FORAGING_ENCOUNTER_IDS.antHeist, expectedRevision: 3, state: state(), firstCard: { value: meadowPartRarity!, suit: '♥' }, firstPart: meadowPart }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.projectLaunch,
        input: { transactionId: 'coverage:project', encounterId: FORAGING_ENCOUNTER_IDS.projectLaunch, expectedRevision: 3, state: state(), choice: 'watch' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.mycophiliacs,
        input: { transactionId: 'coverage:myco:calendar', encounterId: FORAGING_ENCOUNTER_IDS.mycophiliacs, expectedRevision: 3, state: state(), locationId: 'meadow:1', calendarDaysTotal: 12, daysMarkedAtEncounterStart: 6 }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.mycophiliacsBarter,
        input: { transactionId: 'coverage:myco:barter', encounterId: FORAGING_ENCOUNTER_IDS.mycophiliacs, expectedRevision: 3, state: state({ reputation: 25 }), locationId: 'meadow:1', calendarDaysTotal: 12, daysMarkedAtEncounterStart: 6, beseech: true }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.lifeSavingTransplant,
        input: { transactionId: 'coverage:transplant', encounterId: FORAGING_ENCOUNTER_IDS.lifeSavingTransplant, expectedRevision: 3, state: state(), charcoalPreparationId: charcoal.preparationId, sheddingsPreparationId: sheddings.preparationId }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.startSainDeClaws,
        input: { transactionId: 'coverage:sain', encounterId: 'foraging-meadow-9-winter', expectedRevision: 3, state: state(), locationId: 'meadow:1', targetCards: [{ value: 2, suit: '♥' }, { value: 7, suit: '♦' }, { value: 12, suit: '♠' }] }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.stickEmUpSurrender,
        input: { transactionId: 'coverage:stick:surrender', encounterId: FORAGING_ENCOUNTER_IDS.stickEmUp, expectedRevision: 3, state: state(), choice: 'play-safe' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.stickEmUpScrap,
        input: { transactionId: 'coverage:stick:scrap', encounterId: FORAGING_ENCOUNTER_IDS.stickEmUp, expectedRevision: 3, state: state(), choice: 'scrap', playerCards: [{ value: 12, suit: '♥' }], robberCards: [{ value: 3, suit: '♣' }, { value: 8, suit: '♠' }], usedCrossbowExtraDraw: false }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.finalRestingPlace,
        input: { transactionId: 'coverage:rest', encounterId: FORAGING_ENCOUNTER_IDS.finalRestingPlace, expectedRevision: 3, state: state(), card: { value: 5, suit: '♥' }, reward: { kind: 'thingamabob' }, companionCapacity: 1 }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.whatRemains,
        input: { transactionId: 'coverage:remains', encounterId: FORAGING_ENCOUNTER_IDS.whatRemains, expectedRevision: 3, state: state(), card: { value: 6, suit: '♥' } }
      },
      ...(['light', 'cameras'] as const).map(choice => ({
        code: choice === 'light' ? FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerLight : FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerCameras,
        input: { transactionId: `coverage:titan:${choice}`, encounterId: 'foraging-titan-6' as const, expectedRevision: 3, state: state({ inventory: [thingamabob.item], tools: [thingamabob.tool] }), choice, locationId: 'glasswall' }
      })),
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerAction,
        input: { transactionId: 'coverage:titan:action', encounterId: 'foraging-titan-6', expectedRevision: 3, state: state({ inventory: [thingamabob.item], tools: [thingamabob.tool] }), choice: 'action', locationId: 'glasswall', ...titanPart }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.trapped,
        input: { transactionId: 'coverage:trapped', encounterId: TRAPPED_ENCOUNTER_IDS[0], expectedRevision: 3, state: state(), choice: 'rescue', card: { value: 7, suit: '♥' }, timerId: 'timer-1' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.meekShallInherit,
        input: { transactionId: 'coverage:meek', encounterId: MEEK_ENCOUNTER_IDS[0], expectedRevision: 3, state: state(), search: 'stunned', ...part('Beetles') }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.odoakMarket,
        input: { transactionId: 'coverage:odoak', encounterId: FORAGING_ENCOUNTER_IDS.odoakMarket, expectedRevision: 3, state: state(), choice: 'delightful-indulgence' }
      }
    ] satisfies ForagingEncounterTransactionCommand[];

    const resolutions = validCommands.map(command => ({
      code: command.code,
      resolution: dispatchForagingEncounterTransaction(command)
    }));
    expect(resolutions.filter(row => row.resolution.status !== 'resolved')).toEqual([]);

    const lifecycleCodes = [
      FORAGING_ENCOUNTER_TRANSACTION_CODES.deliveryHook,
      FORAGING_ENCOUNTER_TRANSACTION_CODES.sainMatchHook,
      FORAGING_ENCOUNTER_TRANSACTION_CODES.sainReturnHook,
      FORAGING_ENCOUNTER_TRANSACTION_CODES.sainSeasonEndHook
    ];
    expect(new Set([...validCommands.map(command => command.code), ...lifecycleCodes])).toEqual(
      new Set(Object.values(FORAGING_ENCOUNTER_TRANSACTION_CODES))
    );
  });

  it('rejects sibling-only branches for every branch-specific dispatcher code', () => {
    const mismatches: ForagingEncounterTransactionCommand[] = [
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.rightPlaceArcher,
        input: { transactionId: 'mixed:right', encounterId: FORAGING_ENCOUNTER_IDS.rightPlaceWrongTime, expectedRevision: 3, state: state(), choice: 'vigilante', playerCard: { value: 8, suit: '♥' }, robberCard: { value: 3, suit: '♠' } }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fabledBehemothFace,
        input: { transactionId: 'mixed:fabled', encounterId: FORAGING_ENCOUNTER_IDS.fabledBehemoth, expectedRevision: 3, state: state(), choice: 'row', card: { value: 3, suit: '♥' } }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fowlFareAirlift,
        input: { transactionId: 'mixed:fowl', encounterId: 'foraging-meadow-8', expectedRevision: 3, state: state(), choice: 'decline' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.projectLaunch,
        input: { transactionId: 'mixed:project', encounterId: FORAGING_ENCOUNTER_IDS.projectLaunch, expectedRevision: 3, state: state(), choice: 'keep-head-down' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.mycophiliacs,
        input: { transactionId: 'mixed:myco:calendar', encounterId: FORAGING_ENCOUNTER_IDS.mycophiliacs, expectedRevision: 3, state: state({ reputation: 25 }), locationId: 'meadow:1', calendarDaysTotal: 12, daysMarkedAtEncounterStart: 6, beseech: true }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.mycophiliacsBarter,
        input: { transactionId: 'mixed:myco:barter', encounterId: FORAGING_ENCOUNTER_IDS.mycophiliacs, expectedRevision: 3, state: state(), locationId: 'meadow:1', calendarDaysTotal: 12, daysMarkedAtEncounterStart: 6 }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.stickEmUpScrap,
        input: { transactionId: 'mixed:stick', encounterId: FORAGING_ENCOUNTER_IDS.stickEmUp, expectedRevision: 3, state: state(), choice: 'play-safe' }
      },
      {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerCameras,
        input: { transactionId: 'mixed:titan', encounterId: 'foraging-titan-6', expectedRevision: 3, state: state(), choice: 'action', locationId: 'glasswall', reagentId: 'forged', preparationId: 'forged' }
      }
    ];

    expect(mismatches.map(command => dispatchForagingEncounterTransaction(command))).toEqual(
      mismatches.map(() => expect.objectContaining({ status: 'invalid', code: 'invalid-choice', value: null }))
    );
  });
});
