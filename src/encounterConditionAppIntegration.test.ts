// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const migrationSource = readFileSync(fileURLToPath(new URL('./rules/migrations.ts', import.meta.url)), 'utf8');
const barterSource = readFileSync(fileURLToPath(new URL('./rules/barterEngine.ts', import.meta.url)), 'utf8');

describe('Encounter persistent-condition shell wiring', () => {
  it('applies and consumes permanent Howl losses exactly at manual commit', () => {
    expect(appSource).toContain('consumePermanentEncounterStatDeltas(outcome.nextState.conditions)');
    expect(appSource).toContain('manualConditions: permanentEncounterStats.conditions');
    expect(appSource).toContain('speed: Math.max(0, s.bio.speed + permanentEncounterStats.delta.speed)');
    expect(appSource).toContain('carry: Math.max(0, s.bio.carry + permanentEncounterStats.delta.carry)');
  });

  it('enforces location restrictions and clears move-duration conditions', () => {
    expect(appSource).toContain('consumeEncounterConditionsOnMove(');
    expect(appSource).toContain('isDuchyOfDeerLocationBlocked(state.manualConditions || [], currentLocationId)');
    expect(appSource).toContain('isCurrentLocationForageBlocked(state.manualConditions || [])');
    expect(appSource).toContain('consumeNextForageRangeCondition(');
    expect(appSource).toContain('areFishUnavailableUntilMove(state.manualConditions || [], currentLocationId)');
    expect(appSource).toContain('result.value.candidates.filter(candidate => !isBigOrSmallFishReagent(candidate.reagentId))');
  });

  it('applies active Lodge/Titan FP rewards when an Encounter completes', () => {
    expect(appSource.match(/applyEncounterCompletionForagingPoints\(/g)?.length).toBe(3);
    expect(appSource).toContain('encounterCompletionForagingPointBonus(s.manualConditions || [], locationId)');
    expect(appSource).toContain('newlyActivatedEncounterBonus');
    expect(appSource).toContain('encounterCompletionForagingPointBonus(outcome.nextState.conditions, encounterLocationId)');
  });

  it('consumes the optional Titan redraw and Lodge one-Barter exception in their actual workflows', () => {
    expect(appSource).toContain("consumeTitanEncounterRedraw(state.manualConditions || [], currentLocationId)");
    expect(appSource).toContain('titanCameraRedrawn');
    expect(appSource).toContain('consumeLodgeBarterStepTwoSkip(');
    expect(appSource).toContain('resolveBarterSkipSocialEncounter({');
    expect(barterSource).toContain("status: 'awaiting-second-card'");
    expect(appSource).toContain('비버의 초대로 거리의 사교 조우(물꼬 거래 2단계)를 건너뛰고');
    expect(migrationSource).toContain('const socialStepSkipped = value.socialStepSkipped === true;');
    expect(migrationSource).toContain("status === 'awaiting-second-card' && !socialStepSkipped");
  });

  it('moves Tobogganing to the validated map node without starting a normal Move', () => {
    expect(appSource).toContain("draft.ownerId !== 'travel-mountain-j-winter'");
    expect(appSource).toContain('validateTobogganMovement(');
    expect(appSource).toContain('currentMapLocationId: tobogganMovement.targetId');
    expect(appSource).toContain('directMapDescriptions.add(tobogganMovement.description)');
  });

  it('round-trips printed Barter value and expires Fresh Clams on every Mark Day path', () => {
    expect(appSource).toContain('barterValue: item.barterValue');
    expect(appSource).toContain('applyCalendarAdvanceWithEncounterExpiry');
    expect(appSource).toContain('spoilFreshClamsOnMarkedDay(');
    expect(appSource).not.toMatch(/\.\.\.applyCalendarAdvance\(/);
  });
});
