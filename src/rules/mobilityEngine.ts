import { COMPANION_BY_ID, WAGON_EXPANSION_BY_ID, type CompanionState, type WagonState } from './data/mobility';
import type { Season } from './types';

export interface MobilityCapabilities {
  carryBonus: number;
  speedBonus: number;
  canStopInLoch: boolean;
  canUseWaterway: boolean;
  waterwaySpan: number;
  canSoar: boolean;
  soarDays: number;
  companionSlots: number;
}

export const resolveWagonCapabilities = (wagon: WagonState): MobilityCapabilities => {
  const owned = new Set(wagon.expansionIds.filter(id => WAGON_EXPANSION_BY_ID.has(id)));
  if (!wagon.commissioned) return { carryBonus: 0, speedBonus: 0, canStopInLoch: false, canUseWaterway: false, waterwaySpan: 1, canSoar: false, soarDays: 1, companionSlots: 1 };
  return {
    carryBonus: owned.has('side-brackets') ? 6 : 4,
    speedBonus: owned.has('axel-springs') ? 2 : 1,
    canStopInLoch: owned.has('sealed-carriage'),
    canUseWaterway: owned.has('sealed-carriage'),
    waterwaySpan: owned.has('pedal-motor') ? 2 : 1,
    canSoar: owned.has('experimental-contraption'),
    soarDays: owned.has('experimental-contraption') ? 3 : 1,
    companionSlots: owned.has('hive-brackets') ? 2 : 1
  };
};

export const commissionWagon = (input: { wagon: WagonState; isCity: boolean; trinkets: number }) => {
  if (!input.isCity || input.trinkets < 20 || input.wagon.commissioned) throw new Error('Commissioning a Wagon requires a City, 20 Trinkets, and no existing Wagon.');
  return { wagon: { ...input.wagon, commissioned: true }, trinkets: input.trinkets - 20 };
};

export const installWagonExpansion = (input: { wagon: WagonState; expansionId: string; locationName: string; isCity: boolean; trinkets: number; recycleCoracle?: boolean }) => {
  const expansion = WAGON_EXPANSION_BY_ID.get(input.expansionId);
  if (!expansion) throw new Error('Unknown Wagon Expansion.');
  if (!input.isCity || (expansion.location !== 'Any City' && expansion.location !== input.locationName)) throw new Error('Expansion is not available here.');
  const cost = expansion.id === 'sealed-carriage' && input.recycleCoracle ? expansion.cost - 5 : expansion.cost;
  if (input.trinkets < cost) throw new Error('Not enough Trinkets.');
  if (input.wagon.expansionIds.includes(expansion.id)) throw new Error('Expansion is already installed.');
  if (!input.wagon.commissioned) throw new Error('Commission the Wagon first.');
  if (expansion.id === 'base-unit') throw new Error('The commissioned Wagon already includes its Base Unit.');
  return {
    wagon: { ...input.wagon, commissioned: true, expansionIds: [...input.wagon.expansionIds, expansion.id] },
    trinkets: input.trinkets - cost
  };
};

export const advanceCompanions = (companions: CompanionState[], paths: number) => companions.map(row => {
  const nextPaths = row.pathsTravelled + Math.max(0, paths);
  if (row.companionId === 'wasp' && nextPaths >= 10) return {
    ...row,
    pathsTravelled: nextPaths % 10,
    pendingForage: 'insect' as const,
    pendingForageDraws: (row.pendingForageDraws || 0) + Math.floor(nextPaths / 10)
  };
  return { ...row, pathsTravelled: nextPaths % 10 };
});

export interface CompanionTravelOutcome {
  companions: CompanionState[];
  honeyHarvests: number;
  waspForageDraws: number;
}

export const resolveCompanionTravel = (companions: CompanionState[], paths: number): CompanionTravelOutcome => {
  let honeyHarvests = 0;
  let waspForageDraws = 0;
  const safePaths = Math.max(0, paths);
  const next = companions.map(row => {
    const total = row.pathsTravelled + safePaths;
    const milestones = Math.floor(total / 10);
    if (row.companionId === 'honeybee') honeyHarvests += milestones;
    if (row.companionId === 'wasp') waspForageDraws += milestones;
    return row.companionId === 'wasp' && milestones > 0
      ? { ...row, pathsTravelled: total % 10, pendingForage: 'insect' as const, pendingForageDraws: (row.pendingForageDraws || 0) + milestones }
      : { ...row, pathsTravelled: total % 10 };
  });
  return { companions: next, honeyHarvests, waspForageDraws };
};

export const advanceCompanionSeason = (companions: CompanionState[], _season: Season) => companions.map(row => {
  const seasonsTravelled = row.seasonsTravelled + 1;
  return row.companionId === 'caterpillar' && seasonsTravelled >= 1
    ? { ...row, companionId: 'butterfly', seasonsTravelled: 0 }
    : { ...row, seasonsTravelled };
});

export const canUseCompanion = (state: CompanionState, trigger: 'beast' | 'behemoth' | 'loch-redraw') => {
  if (!COMPANION_BY_ID.has(state.companionId)) return false;
  if (trigger === 'beast') return state.companionId === 'beetle' && !state.usedThisJourney;
  if (trigger === 'behemoth') return state.companionId === 'cranky-contraption';
  return state.companionId === 'pond-skimmer' && !state.usedThisJourney;
};
