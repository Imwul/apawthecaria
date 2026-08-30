/**
 * Pottering About (Bog, Spring, Jack) grants this bonus only for the current
 * Journey. Keep the exact persisted condition in one place so carry previews,
 * transactions, save/reload, and Journey cleanup cannot drift apart.
 */
export const BOG_SPRING_JOURNEY_CARRY_CONDITION =
  'manual:travel-bog-j-spring:Carry +1 until the end of this Journey.';

export const journeyScopedCarryBonus = (conditions: readonly string[]): number =>
  conditions.includes(BOG_SPRING_JOURNEY_CARRY_CONDITION) ? 1 : 0;

export const clearJourneyScopedCarryConditions = (
  conditions: readonly string[]
): string[] => conditions.filter(condition => condition !== BOG_SPRING_JOURNEY_CARRY_CONDITION);
