import {
  deliverEncounterPayload,
  recordSainDeClawsMatch,
  resolveAlluringOdours,
  resolveAntHeist,
  resolveFabledBehemoth,
  resolveFinalRestingPlace,
  resolveFowlFare,
  resolveFriendInNeed,
  resolveLifeSavingTransplant,
  resolveLockAndKey,
  resolveLogKnocking,
  resolveMeekShallInherit,
  resolveMycophiliacs,
  resolveOdoakMarket,
  resolveProjectLaunch,
  resolveRightPlaceWrongTime,
  resolveRiverSnatchers,
  resolveStickEmUp,
  resolveTheBranded,
  resolveTrapped,
  resolveWhatRemains,
  returnSainDeClawsPresents,
  settleSainDeClawsAtSeasonEnd,
  startSainDeClawsQuest,
  type ForagingEncounterTransactionResolution
} from './foragingEncounterTransactions';

export const FORAGING_ENCOUNTER_TRANSACTION_CODES = {
  rightPlaceVigilante: 'RIGHT_PLACE_VIGILANTE',
  rightPlaceArcher: 'RIGHT_PLACE_ARCHER',
  friendInNeed: 'FRIEND_IN_NEED_PROCEDURE',
  logKnocking: 'LOG_KNOCKING_ALL_PARTS',
  startBrandedLesserAilment: 'START_BRANDED_LESSER_AILMENT',
  alluringOdours: 'ALLURING_ODOURS_DRAW',
  riverSnatchers: 'RIVER_SNATCHERS_DRAW',
  fabledBehemothRow: 'FABLED_BEHEMOTH_ROW',
  fabledBehemothFace: 'FABLED_BEHEMOTH_FACE',
  fowlFareAirlift: 'FOWL_FARE_AIRLIFT',
  fowlFareTaxi: 'FOWL_FARE_TAXI',
  fowlFareDecline: 'FOWL_FARE_DECLINE',
  antHeist: 'ANT_HEIST_PROCEDURE',
  projectLaunch: 'PROJECT_LAUNCH_WATCH',
  mycophiliacs: 'MYCOPHILIACS_CALENDAR_BRANCH',
  mycophiliacsBarter: 'MYCOPHILIACS_BARTER',
  lifeSavingTransplant: 'LIFE_SAVING_TRANSPLANT_TAKE',
  startSainDeClaws: 'SAIN_DE_CLAWS_PRESENT_HUNT',
  stickEmUpSurrender: 'STICK_EM_UP_SURRENDER',
  stickEmUpScrap: 'STICK_EM_UP_SCRAP',
  finalRestingPlace: 'FINAL_RESTING_PLACE_ENTRY',
  whatRemains: 'WHAT_REMAINS_PROCEDURE',
  titanPowerLight: 'TITAN_POWER_LIGHT',
  titanPowerCameras: 'TITAN_POWER_CAMERAS',
  titanPowerAction: 'TITAN_POWER_ACTION',
  trapped: 'TRAPPED_PROCEDURE',
  meekShallInherit: 'MEEK_SHALL_INHERIT_PART',
  odoakMarket: 'ODOAK_MARKET_TRANSACTION',
  deliveryHook: 'ENCOUNTER_DELIVERY_HOOK',
  sainMatchHook: 'SAIN_DE_CLAWS_MATCH_HOOK',
  sainReturnHook: 'SAIN_DE_CLAWS_RETURN_HOOK',
  sainSeasonEndHook: 'SAIN_DE_CLAWS_SEASON_END_HOOK'
} as const;

type RightPlaceInput = Parameters<typeof resolveRightPlaceWrongTime>[0];
type FabledBehemothInput = Parameters<typeof resolveFabledBehemoth>[0];
type FowlFareInput = Parameters<typeof resolveFowlFare>[0];
type StickEmUpInput = Parameters<typeof resolveStickEmUp>[0];
type LockAndKeyInput = Parameters<typeof resolveLockAndKey>[0];

export type ForagingEncounterTransactionCommand =
  | { code: 'RIGHT_PLACE_VIGILANTE'; input: RightPlaceInput }
  | { code: 'RIGHT_PLACE_ARCHER'; input: RightPlaceInput }
  | { code: 'FRIEND_IN_NEED_PROCEDURE'; input: Parameters<typeof resolveFriendInNeed>[0] }
  | { code: 'LOG_KNOCKING_ALL_PARTS'; input: Parameters<typeof resolveLogKnocking>[0] }
  | { code: 'START_BRANDED_LESSER_AILMENT'; input: Parameters<typeof resolveTheBranded>[0] }
  | { code: 'ALLURING_ODOURS_DRAW'; input: Parameters<typeof resolveAlluringOdours>[0] }
  | { code: 'RIVER_SNATCHERS_DRAW'; input: Parameters<typeof resolveRiverSnatchers>[0] }
  | { code: 'FABLED_BEHEMOTH_ROW'; input: FabledBehemothInput }
  | { code: 'FABLED_BEHEMOTH_FACE'; input: FabledBehemothInput }
  | { code: 'FOWL_FARE_AIRLIFT'; input: FowlFareInput }
  | { code: 'FOWL_FARE_TAXI'; input: FowlFareInput }
  | { code: 'FOWL_FARE_DECLINE'; input: FowlFareInput }
  | { code: 'ANT_HEIST_PROCEDURE'; input: Parameters<typeof resolveAntHeist>[0] }
  | { code: 'PROJECT_LAUNCH_WATCH'; input: Parameters<typeof resolveProjectLaunch>[0] }
  | { code: 'MYCOPHILIACS_CALENDAR_BRANCH'; input: Parameters<typeof resolveMycophiliacs>[0] }
  | { code: 'MYCOPHILIACS_BARTER'; input: Parameters<typeof resolveMycophiliacs>[0] }
  | { code: 'LIFE_SAVING_TRANSPLANT_TAKE'; input: Parameters<typeof resolveLifeSavingTransplant>[0] }
  | { code: 'SAIN_DE_CLAWS_PRESENT_HUNT'; input: Parameters<typeof startSainDeClawsQuest>[0] }
  | { code: 'STICK_EM_UP_SURRENDER'; input: StickEmUpInput }
  | { code: 'STICK_EM_UP_SCRAP'; input: StickEmUpInput }
  | { code: 'FINAL_RESTING_PLACE_ENTRY'; input: Parameters<typeof resolveFinalRestingPlace>[0] }
  | { code: 'WHAT_REMAINS_PROCEDURE'; input: Parameters<typeof resolveWhatRemains>[0] }
  | { code: 'TITAN_POWER_LIGHT'; input: LockAndKeyInput }
  | { code: 'TITAN_POWER_CAMERAS'; input: LockAndKeyInput }
  | { code: 'TITAN_POWER_ACTION'; input: LockAndKeyInput }
  | { code: 'TRAPPED_PROCEDURE'; input: Parameters<typeof resolveTrapped>[0] }
  | { code: 'MEEK_SHALL_INHERIT_PART'; input: Parameters<typeof resolveMeekShallInherit>[0] }
  | { code: 'ODOAK_MARKET_TRANSACTION'; input: Parameters<typeof resolveOdoakMarket>[0] }
  | { code: 'ENCOUNTER_DELIVERY_HOOK'; input: Parameters<typeof deliverEncounterPayload>[0] }
  | { code: 'SAIN_DE_CLAWS_MATCH_HOOK'; input: Parameters<typeof recordSainDeClawsMatch>[0] }
  | { code: 'SAIN_DE_CLAWS_RETURN_HOOK'; input: Parameters<typeof returnSainDeClawsPresents>[0] }
  | { code: 'SAIN_DE_CLAWS_SEASON_END_HOOK'; input: Parameters<typeof settleSainDeClawsAtSeasonEnd>[0] };

const branchMismatch = (code: string, expectedChoice: string): ForagingEncounterTransactionResolution => ({
  status: 'invalid',
  value: null,
  code: 'invalid-choice',
  messages: [`${code} can only resolve the ${expectedChoice} branch.`]
});

/** Typed bridge between manual-effect codes/lifecycle hooks and the pure
 * transaction helpers. It intentionally performs no App state mapping. */
export const dispatchForagingEncounterTransaction = (
  command: ForagingEncounterTransactionCommand
): ForagingEncounterTransactionResolution => {
  switch (command.code) {
    case 'RIGHT_PLACE_VIGILANTE':
      return command.input.choice === 'vigilante'
        ? resolveRightPlaceWrongTime(command.input)
        : branchMismatch(command.code, 'vigilante');
    case 'RIGHT_PLACE_ARCHER':
      return command.input.choice === 'archer'
        ? resolveRightPlaceWrongTime(command.input)
        : branchMismatch(command.code, 'archer');
    case 'FRIEND_IN_NEED_PROCEDURE': return resolveFriendInNeed(command.input);
    case 'LOG_KNOCKING_ALL_PARTS': return resolveLogKnocking(command.input);
    case 'START_BRANDED_LESSER_AILMENT':
      return command.input.choice === 'compassion'
        ? resolveTheBranded(command.input)
        : branchMismatch(command.code, 'compassion');
    case 'ALLURING_ODOURS_DRAW': return resolveAlluringOdours(command.input);
    case 'RIVER_SNATCHERS_DRAW': return resolveRiverSnatchers(command.input);
    case 'FABLED_BEHEMOTH_ROW':
      return command.input.choice === 'row'
        ? resolveFabledBehemoth(command.input)
        : branchMismatch(command.code, 'row');
    case 'FABLED_BEHEMOTH_FACE':
      return command.input.choice === 'face'
        ? resolveFabledBehemoth(command.input)
        : branchMismatch(command.code, 'face');
    case 'FOWL_FARE_AIRLIFT':
      return command.input.choice === 'airlift'
        ? resolveFowlFare(command.input)
        : branchMismatch(command.code, 'airlift');
    case 'FOWL_FARE_TAXI':
      return command.input.choice === 'taxi'
        ? resolveFowlFare(command.input)
        : branchMismatch(command.code, 'taxi');
    case 'FOWL_FARE_DECLINE':
      return command.input.choice === 'decline'
        ? resolveFowlFare(command.input)
        : branchMismatch(command.code, 'decline');
    case 'ANT_HEIST_PROCEDURE': return resolveAntHeist(command.input);
    case 'PROJECT_LAUNCH_WATCH':
      return command.input.choice === 'watch'
        ? resolveProjectLaunch(command.input)
        : branchMismatch(command.code, 'watch');
    case 'MYCOPHILIACS_CALENDAR_BRANCH':
      return command.input.beseech
        ? branchMismatch(command.code, 'calendar branch without Beseech')
        : resolveMycophiliacs(command.input);
    case 'MYCOPHILIACS_BARTER':
      return command.input.beseech
        ? resolveMycophiliacs(command.input)
        : branchMismatch(command.code, 'Beseech');
    case 'LIFE_SAVING_TRANSPLANT_TAKE': return resolveLifeSavingTransplant(command.input);
    case 'SAIN_DE_CLAWS_PRESENT_HUNT': return startSainDeClawsQuest(command.input);
    case 'STICK_EM_UP_SURRENDER':
      return command.input.choice === 'play-safe'
        ? resolveStickEmUp(command.input)
        : branchMismatch(command.code, 'play-safe');
    case 'STICK_EM_UP_SCRAP':
      return command.input.choice === 'scrap'
        ? resolveStickEmUp(command.input)
        : branchMismatch(command.code, 'scrap');
    case 'FINAL_RESTING_PLACE_ENTRY': return resolveFinalRestingPlace(command.input);
    case 'WHAT_REMAINS_PROCEDURE': return resolveWhatRemains(command.input);
    case 'TITAN_POWER_LIGHT':
      return command.input.choice === 'light'
        ? resolveLockAndKey(command.input)
        : branchMismatch(command.code, 'light');
    case 'TITAN_POWER_CAMERAS':
      return command.input.choice === 'cameras'
        ? resolveLockAndKey(command.input)
        : branchMismatch(command.code, 'cameras');
    case 'TITAN_POWER_ACTION':
      return command.input.choice === 'action'
        ? resolveLockAndKey(command.input)
        : branchMismatch(command.code, 'action');
    case 'TRAPPED_PROCEDURE': return resolveTrapped(command.input);
    case 'MEEK_SHALL_INHERIT_PART': return resolveMeekShallInherit(command.input);
    case 'ODOAK_MARKET_TRANSACTION': return resolveOdoakMarket(command.input);
    case 'ENCOUNTER_DELIVERY_HOOK': return deliverEncounterPayload(command.input);
    case 'SAIN_DE_CLAWS_MATCH_HOOK': return recordSainDeClawsMatch(command.input);
    case 'SAIN_DE_CLAWS_RETURN_HOOK': return returnSainDeClawsPresents(command.input);
    case 'SAIN_DE_CLAWS_SEASON_END_HOOK': return settleSainDeClawsAtSeasonEnd(command.input);
  }
};
