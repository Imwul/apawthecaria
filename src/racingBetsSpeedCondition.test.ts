// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrateSavedRulesState } from './rules';
import {
  RACING_BETS_SNACK_NEXT_MOVE_CONDITION,
  applyRacingBetsSnackSpeed,
  consumeRacingBetsSnackSpeed
} from './racingBetsSpeedCondition';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');

describe('Racing Bets A Snack next-Move speed', () => {
  it('survives a save round-trip and gives preview and transaction the same +1', () => {
    const saved = [RACING_BETS_SNACK_NEXT_MOVE_CONDITION, 'unrelated-condition'];
    const reloaded = migrateSavedRulesState(JSON.parse(JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      manualConditions: saved
    }))).manualConditions as string[];

    expect(applyRacingBetsSnackSpeed(3, reloaded, 'move')).toBe(4);
    expect(applyRacingBetsSnackSpeed(3, reloaded, 'move')).toBe(4);
    expect(reloaded).toEqual(saved);
  });

  it('consumes the condition after that Move so it applies exactly once', () => {
    const before = [RACING_BETS_SNACK_NEXT_MOVE_CONDITION, 'unrelated-condition'];
    const after = consumeRacingBetsSnackSpeed(before, 'move');

    expect(before).toContain(RACING_BETS_SNACK_NEXT_MOVE_CONDITION);
    expect(after).toEqual(['unrelated-condition']);
    expect(applyRacingBetsSnackSpeed(3, after, 'move')).toBe(3);
  });

  it('does not spend the next-Move bonus on a Soar', () => {
    const conditions = [RACING_BETS_SNACK_NEXT_MOVE_CONDITION];
    expect(applyRacingBetsSnackSpeed(3, conditions, 'soar')).toBe(3);
    expect(consumeRacingBetsSnackSpeed(conditions, 'soar')).toBe(conditions);
  });

  it('does not apply or consume a forged look-alike condition', () => {
    const forged = ['manual:social-forest-summer-♣:Increase Speed by 10 for every Move.'];
    expect(applyRacingBetsSnackSpeed(3, forged, 'move')).toBe(3);
    expect(consumeRacingBetsSnackSpeed(forged, 'move')).toEqual(forged);
  });

  it('wires the same helper into route preview, Move resolution, and successful-Move consumption', () => {
    expect(appSource).toContain('speed = applyRacingBetsSnackSpeed(speed, s.manualConditions || [], mode);');
    expect(appSource).toContain('return applyEncounterMoveSpeed(speed, s.manualConditions || []);');
    expect(appSource).toContain('baseSpeed: applyEncounterMoveSpeed(');
    expect(appSource).toContain('applyRacingBetsSnackSpeed(');
    expect(appSource).toContain('const consumeTravelConditions = (');
    expect(appSource).toContain('let nextConditions = consumeTravelConditions(');
    expect(appSource).toContain('if (weight > getMaxCarry(s)) return 1;');
  });

  it('serializes Move commits so a rapid repeat cannot consume or apply the bonus twice', () => {
    expect(appSource).toContain('const travelMoveTransactionPendingRef = useRef(false);');
    expect(appSource).toContain('if (travelMoveTransactionPendingRef.current) return;');
    expect(appSource).toContain('await executeCanonicalTravelMoveTransaction(drawnSuit, cardVal);');
    expect(appSource).toContain('travelMoveTransactionPendingRef.current = false;');
  });
});
