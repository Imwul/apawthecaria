import { describe, expect, it } from 'vitest';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import {
  BOG_SPRING_JOURNEY_CARRY_CONDITION,
  clearJourneyScopedCarryConditions,
  journeyScopedCarryBonus
} from './journeyCarryCondition';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');

describe('Pottering About Journey Carry bonus', () => {
  it('grants exactly +1 for the canonical saved condition, including after JSON round-trip', () => {
    const conditions = JSON.parse(JSON.stringify([
      'unrelated-condition',
      BOG_SPRING_JOURNEY_CARRY_CONDITION
    ])) as string[];

    expect(journeyScopedCarryBonus(conditions)).toBe(1);
    expect(journeyScopedCarryBonus([...conditions, BOG_SPRING_JOURNEY_CARRY_CONDITION])).toBe(1);
  });

  it('does not infer a bonus from similar narrative text', () => {
    expect(journeyScopedCarryBonus([
      'manual:travel-bog-j-spring:Carry +10 until every Journey ends.'
    ])).toBe(0);
  });

  it('removes only the Journey-scoped Carry condition when the Journey ends', () => {
    const unrelated = 'manual:social-forest-summer:keep-this-condition';
    expect(clearJourneyScopedCarryConditions([
      unrelated,
      BOG_SPRING_JOURNEY_CARRY_CONDITION
    ])).toEqual([unrelated]);
  });

  it('wires the bonus into Carry and clears legacy-stale and normally completed Journey state', () => {
    expect(appSource).toContain('base += journeyScopedCarryBonus(s.manualConditions || []);');
    expect(appSource).toContain('const migratedManualConditions = bindDastardsWarningTarget(');
    expect(appSource).toContain('manualConditions: migratedManualConditions');
    expect(appSource).toContain(': clearJourneyScopedCarryConditions(normalizedEncounterConditions)');
    expect(appSource).toContain('manualConditions: clearJourneyScopedCarryConditions(next.manualConditions || [])');
  });
});
