export const RACING_BETS_SNACK_SPEED_TEXT = 'Increase Speed by 1 for the next Move only.';
export const RACING_BETS_SNACK_NEXT_MOVE_CONDITION =
  `manual:social-forest-summer-♣:${RACING_BETS_SNACK_SPEED_TEXT}`;

export type TravelSpeedConditionMode = 'move' | 'soar';

/** Apply the printed A Snack! bonus without changing the persisted condition list. */
export const applyRacingBetsSnackSpeed = (
  speed: number,
  conditions: readonly string[],
  mode: TravelSpeedConditionMode = 'move'
): number => mode === 'move' && conditions.includes(RACING_BETS_SNACK_NEXT_MOVE_CONDITION)
  ? speed + 1
  : speed;

/** Consume only the exact printed A Snack! condition after a successful Move. */
export const consumeRacingBetsSnackSpeed = (
  conditions: string[],
  mode: TravelSpeedConditionMode = 'move'
): string[] => mode === 'move'
  ? conditions.filter(condition => condition !== RACING_BETS_SNACK_NEXT_MOVE_CONDITION)
  : conditions;
