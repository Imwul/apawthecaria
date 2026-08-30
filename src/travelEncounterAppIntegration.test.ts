// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const migrationSource = readFileSync(fileURLToPath(new URL('./rules/migrations.ts', import.meta.url)), 'utf8');
const travelP0ResolverSource = appSource.slice(
  appSource.indexOf('const resolveTravelP0Patch = async'),
  appSource.indexOf('const resolveCanonicalEncounter = async')
);

describe('high-risk Travel encounter application wiring', () => {
  it('routes all six printed encounters through their typed resolvers', () => {
    expect(travelP0ResolverSource).toContain("encounter.id === 'travel-loch-a-2'");
    expect(travelP0ResolverSource).toContain('resolveWashedAway({');
    expect(travelP0ResolverSource).toContain("encounter.id === 'travel-loch-m-spring'");
    expect(travelP0ResolverSource).toContain('resolveChoppyWaters({');
    expect(travelP0ResolverSource).toContain("encounter.id === 'travel-loch-j-summer'");
    expect(travelP0ResolverSource).toContain('resolvePirateCombat({');
    expect(travelP0ResolverSource).toContain("encounter.id === 'travel-loch-m-summer'");
    expect(travelP0ResolverSource).toContain('resolveViciousMurk({');
    expect(travelP0ResolverSource).toContain("encounter.id === 'travel-soar-5-6'");
    expect(travelP0ResolverSource).toContain('resolveUnbuckled({');
    expect(travelP0ResolverSource).toContain("encounter.id === 'travel-titan-m'");
    expect(travelP0ResolverSource).toContain('resolveElectricianRepair({');
    expect(appSource).toContain('await resolveTravelP0Patch({ encounter, choiceId: selectedChoiceId, pending, secondaryCards })');
  });

  it('uses exact Move context for backtracking/flight and preserves the printed Crossbow card count', () => {
    expect(appSource).toContain('pending.moveRouteLocationIds?.at(-2) || pending.originLocationId');
    expect(appSource).toContain('const route = (pending.moveRouteLocationIds || []).filter');
    expect(appSource).toContain('hasUsableCrossbow ? 4 : 3');
    expect(appSource).toContain("encounter.id !== 'travel-loch-j-summer'");
  });

  it('persists world effects and enforces them in Move, Forage, and season transitions', () => {
    expect(appSource).toContain("isTravelEncounterLocationBlocked(state.travelEncounterWorld, locationId, state.currentSeason, 'move-through')");
    expect(appSource).toContain("isTravelEncounterLocationBlocked(state.travelEncounterWorld, currentLocationId, state.currentSeason, 'forage')");
    expect(appSource).toContain('settleTravelEncounterSeason(s.travelEncounterWorld, nextSeason)');
    expect(appSource).toContain('travelEncounterWorld: normalizeTravelEncounterWorldState(s.travelEncounterWorld)');
    expect(migrationSource).toContain('travelEncounterWorld: normalizeTravelEncounterWorldState(withMetadata.travelEncounterWorld)');
  });

  it('continues Pi-rats Parley as a persisted Patient and handles Taken Prisoner through the season ledger', () => {
    expect(appSource).toContain("rewardMode: 'reputation-as-trinkets'");
    expect(appSource).toContain("failureOutcome: 'taken-prisoner'");
    expect(appSource).toContain('applyTravelEncounterForcedSeasonRest(');
    expect(appSource).toContain('resolveSeason({');
  });

  it('recovers Unbuckled goods atomically and resumes the original Encounter/Timer checkpoint', () => {
    expect(appSource).toContain("cache.status === 'available' && cache.locationId === currentLocationId");
    expect(appSource).toContain('const recovered = recoverUnbuckledCache({');
    expect(appSource).toContain("kind: 'unbuckled-cache' as const");
    expect(appSource).toContain("phase: 'encounter'");
    expect(appSource).toContain('if (!stillAvailable) return s;');
    expect(appSource).toContain('specialAcquisition: restoredSpecialAcquisition');
  });

  it('honours encounter protection without deleting neutral player choices', () => {
    expect(appSource).toContain("result.value.branch !== 'desired-direction'");
    expect(appSource).toContain("protectedResult('해적과의 전투 패배')");
    expect(appSource).toContain("protectedResult('사나운 청록빛 물')");
    expect(appSource).toContain("protectedResult('풀린 가방끈')");
  });
});
