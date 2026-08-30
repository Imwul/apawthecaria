import { describe, expect, it } from 'vitest';
import {
  ENCOUNTER_CONDITION_CODES,
  ENCOUNTER_CONDITION_OWNERS,
  FABLED_BEHEMOTH_MUST_MOVE_CONDITION,
  INITIAL_CHILLED_TO_BONE_CONDITION,
  INITIAL_DASTARDS_WARNING_CONDITION,
  INITIAL_FUNGI_POISON_CONDITION,
  advanceEncounterConditionsOnMarkedDays,
  applyEncounterConditionsAfterForage,
  applyEncounterConditionsAtAilmentStart,
  applyEncounterMoveSpeed,
  areFishUnavailableUntilMove,
  bindDastardsWarningTarget,
  clearEncounterConditionsOnMove,
  consumeEncounterConditionsOnMove,
  consumeLodgeBarterStepTwoSkip,
  encounterForagingPointMultiplier,
  encounterMoveCarryBonus,
  hasWayfriendProtection,
  isCurrentLocationForageBlocked,
  mushroomRarityConditionModifier,
  nextForageAdjacentPathLimit,
  normalizeEncounterConditions,
  resolveDastardsWarningArrival,
  consumePermanentEncounterStatDeltas,
  consumeTitanEncounterRedraw,
  encounterCompletionForagingPointBonus,
  isDuchyOfDeerLocationBlocked,
  isNegativeEncounterCondition,
  isStackableEncounterCondition,
  spoilFreshClamsOnMarkedDay,
  storedEncounterCondition
} from './encounterConditionRuntime';
import { canonicalMetadata } from './index';
import type { PatientState } from './state';
import { executeEncounter } from './encounterEngine';

const at = (owner: string, code: string, locationId: string) =>
  storedEncounterCondition(owner, code, locationId);

describe('Encounter condition runtime contracts', () => {
  it('enforces the Duchy prohibition only at the marked Location and never clears it on Move', () => {
    const blocked = at(
      ENCOUNTER_CONDITION_OWNERS.duchyOfDeer,
      ENCOUNTER_CONDITION_CODES.duchyOfDeerBan,
      'bog-42'
    );
    const conditions = [blocked, 'unrelated'];

    expect(isDuchyOfDeerLocationBlocked(conditions, 'bog-42')).toBe(true);
    expect(isDuchyOfDeerLocationBlocked(conditions, 'bog-43')).toBe(false);
    expect(clearEncounterConditionsOnMove(conditions)).toContain(blocked);
  });

  it('scopes the startled-fish block to its Location and clears it on the next Move', () => {
    const fish = at(
      ENCOUNTER_CONDITION_OWNERS.boatThatRocks,
      ENCOUNTER_CONDITION_CODES.startledFish,
      'loch-party'
    );
    expect(areFishUnavailableUntilMove([fish], 'loch-party')).toBe(true);
    expect(areFishUnavailableUntilMove([fish], 'another-loch')).toBe(false);
    expect(clearEncounterConditionsOnMove([fish, 'unrelated'])).toEqual(['unrelated']);
  });

  it('adds only exact-location Encounter completion bonuses and clears both on Move', () => {
    const lodge = at(
      ENCOUNTER_CONDITION_OWNERS.lodgeOfWonders,
      ENCOUNTER_CONDITION_CODES.lodgeVisit,
      'lodge-loch'
    );
    const titan = at(
      ENCOUNTER_CONDITION_OWNERS.lockAndKey,
      ENCOUNTER_CONDITION_CODES.titanLight,
      'titan-lock'
    );
    expect(encounterCompletionForagingPointBonus([lodge, titan], 'lodge-loch')).toBe(2);
    expect(encounterCompletionForagingPointBonus([lodge, titan], 'titan-lock')).toBe(3);
    expect(encounterCompletionForagingPointBonus([
      lodge,
      at(ENCOUNTER_CONDITION_OWNERS.lockAndKey, ENCOUNTER_CONDITION_CODES.titanLight, 'lodge-loch')
    ], 'lodge-loch')).toBe(5);
    expect(clearEncounterConditionsOnMove([lodge, titan, 'unrelated'])).toEqual(['unrelated']);
  });

  it('consumes the Lodge barter exception and Titan redraw once without touching other conditions', () => {
    const trade = at(
      ENCOUNTER_CONDITION_OWNERS.lodgeOfWonders,
      ENCOUNTER_CONDITION_CODES.lodgeTrade,
      'lodge-loch'
    );
    const cameras = at(
      ENCOUNTER_CONDITION_OWNERS.lockAndKey,
      ENCOUNTER_CONDITION_CODES.titanCameras,
      'titan-lock'
    );
    const firstTrade = consumeLodgeBarterStepTwoSkip([trade, cameras, 'unrelated'], 'lodge-loch');
    expect(firstTrade).toEqual({ active: true, conditions: [cameras, 'unrelated'] });
    expect(consumeLodgeBarterStepTwoSkip(firstTrade.conditions, 'lodge-loch').active).toBe(false);

    const firstRedraw = consumeTitanEncounterRedraw(firstTrade.conditions, 'titan-lock');
    expect(firstRedraw).toEqual({ active: true, conditions: ['unrelated'] });
    expect(consumeTitanEncounterRedraw(firstRedraw.conditions, 'titan-lock').active).toBe(false);
  });

  it('extracts every stackable permanent Howl loss exactly once', () => {
    const speed = storedEncounterCondition(
      ENCOUNTER_CONDITION_OWNERS.howl,
      ENCOUNTER_CONDITION_CODES.howlSpeedLoss
    );
    const carry = storedEncounterCondition(
      ENCOUNTER_CONDITION_OWNERS.howl,
      ENCOUNTER_CONDITION_CODES.howlCarryLoss
    );
    const result = consumePermanentEncounterStatDeltas([speed, speed, carry, 'unrelated']);
    expect(result).toEqual({
      conditions: ['unrelated'],
      delta: { speed: -2, carry: -1 }
    });
    expect(isStackableEncounterCondition(speed)).toBe(true);
    expect(isStackableEncounterCondition(carry)).toBe(true);
    expect(isStackableEncounterCondition('unrelated')).toBe(false);
  });

  it('spoils exactly the Fresh Clams units owned by next-Mark-Day conditions', () => {
    const prefix = storedEncounterCondition(
      ENCOUNTER_CONDITION_OWNERS.workingForSnack,
      ENCOUNTER_CONDITION_CODES.freshClamsSpoil
    );
    const result = spoilFreshClamsOnMarkedDay(
      [`${prefix}:clams:one`, `${prefix}:clams:one`, `${prefix}:missing`, 'unrelated'],
      [
        { id: 'clams:one', name: 'Fresh Clams', type: 'item', weight: 2 / 3, quantity: 3, barterValue: 3 },
        { id: 'other', name: 'Parcel', type: 'item', weight: 1 / 3, quantity: 1 }
      ]
    );
    expect(result.conditions).toEqual(['unrelated']);
    expect(result.inventory).toEqual([
      expect.objectContaining({ id: 'clams:one', quantity: 1 }),
      expect.objectContaining({ id: 'other', quantity: 1 })
    ]);
    expect(result.spoiledItemIds).toEqual(['clams:one', 'clams:one']);
  });

  it('keeps Fungi Founder as a three-Mark-Day countdown instead of marking days immediately', () => {
    expect(applyEncounterMoveSpeed(5, [INITIAL_FUNGI_POISON_CONDITION])).toBe(2);
    const dayOne = advanceEncounterConditionsOnMarkedDays([INITIAL_FUNGI_POISON_CONDITION], 1);
    expect(dayOne.conditions).toEqual([
      `${storedEncounterCondition(
        ENCOUNTER_CONDITION_OWNERS.fungiFounder,
        ENCOUNTER_CONDITION_CODES.fungiPoisoned
      )}:2`
    ]);
    expect(applyEncounterMoveSpeed(5, dayOne.conditions)).toBe(2);
    const expired = advanceEncounterConditionsOnMarkedDays(dayOne.conditions, 2);
    expect(expired.conditions).toEqual([]);
    expect(expired.expired).toContain('fungi-poison');
    expect(applyEncounterMoveSpeed(5, expired.conditions)).toBe(5);
  });

  it('binds Dastards Ahead to one Settlement, awards +4 only on timely arrival, and expires after two marked Days', () => {
    const bound = bindDastardsWarningTarget([INITIAL_DASTARDS_WARNING_CONDITION, 'other'], 'settlement-near');
    expect(resolveDastardsWarningArrival(bound, 'settlement-far')).toEqual({
      conditions: bound,
      reputationGained: 0
    });
    const afterOneDay = advanceEncounterConditionsOnMarkedDays(bound, 1).conditions;
    expect(resolveDastardsWarningArrival(afterOneDay, 'settlement-near')).toEqual({
      conditions: ['other'],
      reputationGained: 4
    });
    const expired = advanceEncounterConditionsOnMarkedDays(bound, 2);
    expect(expired.expired).toContain('dastards-warning');
    expect(resolveDastardsWarningArrival(expired.conditions, 'settlement-near').reputationGained).toBe(0);

    const legacyUnbound = advanceEncounterConditionsOnMarkedDays([INITIAL_DASTARDS_WARNING_CONDITION], 1);
    expect(bindDastardsWarningTarget(legacyUnbound.conditions, 'settlement-near')).toEqual([
      `${INITIAL_DASTARDS_WARNING_CONDITION}:settlement-near:1`
    ]);
    expect(advanceEncounterConditionsOnMarkedDays([INITIAL_DASTARDS_WARNING_CONDITION], 2).expired)
      .toContain('dastards-warning');
  });

  it('ticks the Chilled To The Bone Timer only on Mountain Forages and fires Warm Up exactly once', () => {
    const forest = applyEncounterConditionsAfterForage([INITIAL_CHILLED_TO_BONE_CONDITION], 'Forest');
    expect(forest.chilledTimerRemaining).toBeNull();
    expect(forest.timerCost).toBe(0);
    const first = applyEncounterConditionsAfterForage(forest.conditions, 'Mountain');
    const second = applyEncounterConditionsAfterForage(first.conditions, 'Mountain');
    const third = applyEncounterConditionsAfterForage(second.conditions, 'Mountain');
    expect([first.chilledTimerRemaining, second.chilledTimerRemaining, third.chilledTimerRemaining]).toEqual([2, 1, 0]);
    expect([first.timerCost, second.timerCost, third.timerCost]).toEqual([0, 0, 3]);
    expect(third.conditions).toEqual([]);
    expect(applyEncounterConditionsAfterForage(third.conditions, 'Mountain').timerCost).toBe(0);
    expect(consumeEncounterConditionsOnMove(first.conditions, 'Forest')).toEqual([]);
  });

  it('applies and consumes exact next-Move, next-Forage, and until-Move effects', () => {
    const conditions = [
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.typicalSummer, ENCOUNTER_CONDITION_CODES.typicalSummer),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.wayfriend, ENCOUNTER_CONDITION_CODES.wayfriend),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.roadtreat, ENCOUNTER_CONDITION_CODES.roadtreat),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.rootingAround, ENCOUNTER_CONDITION_CODES.rootingAround),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.musty, ENCOUNTER_CONDITION_CODES.musty),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.rayTracing, ENCOUNTER_CONDITION_CODES.rayTracing),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.boatmakers, ENCOUNTER_CONDITION_CODES.boatmakers),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.panning, ENCOUNTER_CONDITION_CODES.refreshingDip)
    ];
    expect(applyEncounterMoveSpeed(4, conditions)).toBe(3); // (4 + 2) / 2
    expect(encounterMoveCarryBonus(conditions)).toBe(2);
    expect(hasWayfriendProtection(conditions, 'Forest')).toBe(true);
    expect(hasWayfriendProtection(conditions, 'Bog')).toBe(false);
    expect(nextForageAdjacentPathLimit(conditions)).toBe(2);
    expect(isCurrentLocationForageBlocked(conditions)).toBe(true);
    expect(mushroomRarityConditionModifier(conditions)).toBe(-4);
    expect(applyEncounterConditionsAfterForage(conditions, 'Bog').foragingPointsGained).toBe(1);
    const nonForestMove = consumeEncounterConditionsOnMove(conditions, 'Bog');
    expect(nonForestMove).toEqual([
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.wayfriend, ENCOUNTER_CONDITION_CODES.wayfriend),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.roadtreat, ENCOUNTER_CONDITION_CODES.roadtreat)
    ]);
    expect(consumeEncounterConditionsOnMove(nonForestMove, 'Forest')).toEqual([
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.roadtreat, ENCOUNTER_CONDITION_CODES.roadtreat)
    ]);
  });

  it('blocks Fabled Behemoth Row re-foraging until the next Move, then clears it', () => {
    expect(isCurrentLocationForageBlocked([FABLED_BEHEMOTH_MUST_MOVE_CONDITION])).toBe(true);
    const moved = consumeEncounterConditionsOnMove([FABLED_BEHEMOTH_MUST_MOVE_CONDITION], 'Forest');
    expect(moved).toEqual([]);
    expect(isCurrentLocationForageBlocked(moved)).toBe(false);
  });

  it('consumes queued next-Ailment modifiers once and keeps Frostbitten tied to that patient', () => {
    const patient: PatientState = {
      id: 'patient-1', name: 'Moss', species: 'hare', status: 'active', foragingPoints: 2,
      ailments: [{
        id: 'ailment-1', ailmentId: 'ailment-test', severity: 'intermediate', timerIds: ['timer-1'],
        conditionIds: [], treatmentHistoryIds: [], status: 'active', instance: 1, repeatIndex: 0,
        specialState: {}, successResolved: false, failureResolved: false, consequenceResolved: false, effectIds: []
      }],
      timers: [{ id: 'timer-1', ailmentInstanceId: 'ailment-1', current: 7, maximum: 7, status: 'active' }],
      conditions: [], treatmentHistory: [], journalEvents: []
    };
    const queued = [
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.freshlyGrilled, ENCOUNTER_CONDITION_CODES.freshlyGrilled),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.parched, ENCOUNTER_CONDITION_CODES.parched),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.frostbitten, ENCOUNTER_CONDITION_CODES.frostbitten),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.marshWader, ENCOUNTER_CONDITION_CODES.marshWader),
      'unrelated'
    ];
    const applied = applyEncounterConditionsAtAilmentStart(queued, patient, 3);
    expect(applied.timerDelta).toBe(-1);
    expect(applied.patient.timers[0]).toMatchObject({ current: 6, maximum: 6 });
    expect(applied.foragingPoints).toBe(5); // Frostbitten starts at 0, Marsh Wader then grants 5.
    expect(applied.conditions).toContain('unrelated');
    expect(encounterForagingPointMultiplier(applied.conditions, patient.id)).toBe(0.5);
    expect(encounterForagingPointMultiplier(applied.conditions, 'another-patient')).toBe(1);
    const encounterGain = executeEncounter({
      transactionId: 'frostbitten-encounter-gain',
      encounter: {
        id: 'frostbitten-encounter-gain', title: 'Gain', prompt: 'Gain 3 FP', encounterType: 'foraging',
        region: 'Loch', isSettlement: false, isTitan: false, season: 'Winter', tags: [], choices: [],
        mandatoryEffects: [{
          support: 'implemented', effect: { type: 'modifyForagingPoints', amount: 3 }
        }],
        support: 'implemented', ...canonicalMetadata(85)
      },
      state: {
        reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: applied.foragingPoints,
        inventory: [], patient: applied.patient, movementBlocked: false,
        conditions: applied.conditions, appliedEffectIds: []
      }
    });
    expect(encounterGain.value?.nextState.foragingPoints).toBe(6); // +floor(3 / 2)
    const reapplied = applyEncounterConditionsAtAilmentStart(applied.conditions, patient, 3);
    expect(reapplied.timerDelta).toBe(0);
    expect(reapplied.foragingPoints).toBe(3);
  });

  it('keeps a stacked next-Ailment Timer penalty from producing an active Ailment with an expired Timer', () => {
    const patient: PatientState = {
      id: 'patient-expiry', name: 'Ash', species: 'mouse', status: 'active', foragingPoints: 0,
      ailments: [{
        id: 'ailment-expiry', ailmentId: 'ailment-test', severity: 'lesser', timerIds: ['timer-expiry'],
        conditionIds: [], treatmentHistoryIds: [], status: 'active', instance: 1, repeatIndex: 0,
        specialState: {}, successResolved: false, failureResolved: false, consequenceResolved: false, effectIds: []
      }],
      timers: [{ id: 'timer-expiry', ailmentInstanceId: 'ailment-expiry', current: 3, maximum: 3, status: 'active' }],
      conditions: [], treatmentHistory: [], journalEvents: []
    };
    const applied = applyEncounterConditionsAtAilmentStart([
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.parched, ENCOUNTER_CONDITION_CODES.parched)
    ], patient, 0);
    expect(applied.patient.timers[0].status).toBe('expired');
    expect(applied.patient.ailments[0].status).toBe('failed');
  });

  it('normalizes only exact legacy machine codes and never guesses narrative prose', () => {
    const legacy = storedEncounterCondition(
      ENCOUNTER_CONDITION_OWNERS.chilledToBone,
      'CHILLED_TO_BONE_TIMER'
    );
    expect(normalizeEncounterConditions([legacy])).toEqual([INITIAL_CHILLED_TO_BONE_CONDITION]);
    expect(normalizeEncounterConditions([
      ENCOUNTER_CONDITION_CODES.typicalSummer,
      ENCOUNTER_CONDITION_CODES.roadtreat,
      `${ENCOUNTER_CONDITION_CODES.chilledToBone}:3`
    ])).toEqual([
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.typicalSummer, ENCOUNTER_CONDITION_CODES.typicalSummer),
      storedEncounterCondition(ENCOUNTER_CONDITION_OWNERS.roadtreat, ENCOUNTER_CONDITION_CODES.roadtreat),
      INITIAL_CHILLED_TO_BONE_CONDITION
    ]);
    expect(normalizeEncounterConditions(['manual:unknown:Speed is halved for a while'])).toEqual([
      'manual:unknown:Speed is halved for a while'
    ]);
  });

  it('lets negative-effect protection preserve beneficial deferred conditions', () => {
    expect(isNegativeEncounterCondition(ENCOUNTER_CONDITION_CODES.roadtreat)).toBe(false);
    expect(isNegativeEncounterCondition(ENCOUNTER_CONDITION_CODES.hospitality)).toBe(false);
    expect(isNegativeEncounterCondition(ENCOUNTER_CONDITION_CODES.rootingAround)).toBe(true);
    expect(isNegativeEncounterCondition('legacy-unknown-condition')).toBe(true);
  });

  it('does not let negative-only Encounter protection swallow a beneficial deferred reward', () => {
    const encounter = {
      id: 'condition-protection-test',
      title: 'Condition protection',
      prompt: 'Test only',
      encounterType: 'travel' as const,
      region: 'Meadow' as const,
      isSettlement: false,
      isTitan: false,
      season: 'Spring' as const,
      sourcePage: 86,
      tags: [],
      mandatoryEffects: [
        { support: 'implemented' as const, effect: { type: 'addCondition' as const, conditionId: ENCOUNTER_CONDITION_CODES.roadtreat } },
        { support: 'implemented' as const, effect: { type: 'addCondition' as const, conditionId: ENCOUNTER_CONDITION_CODES.rootingAround } }
      ],
      choices: [],
      support: 'implemented' as const,
      ...canonicalMetadata(86)
    };
    const result = executeEncounter({
      transactionId: 'condition-protection',
      encounter,
      protection: 'negative',
      state: {
        reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 0,
        inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
      }
    });
    expect(result.value?.nextState.conditions).toContain(ENCOUNTER_CONDITION_CODES.roadtreat);
    expect(result.value?.nextState.conditions).not.toContain(ENCOUNTER_CONDITION_CODES.rootingAround);
  });
});
