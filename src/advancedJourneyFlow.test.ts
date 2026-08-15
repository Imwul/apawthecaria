// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const cssSource = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');
const gameplayKoSource = readFileSync(fileURLToPath(new URL('./localization/gameplayKo.ts', import.meta.url)), 'utf8');

describe('advanced journey flow', () => {
  it('compares two routes and shares the result with readiness and resource forecasts', () => {
    expect(appSource).toContain('const alternativeMapPath =');
    expect(appSource).toContain('const exactCostMapPath =');
    expect(appSource).toContain("route: destRegion === 'Soar' || isTaxiMove ? undefined : travelRoute");
    expect(appSource).toContain('현재 이동력 ${activeTravelSpeed}으로 정확히 도달할 수 없습니다.');
    expect(appSource).toContain('className="route-comparison"');
    expect(appSource).toContain('className={`departure-readiness is-${readinessTone}`}');
    expect(appSource).toContain('className="travel-rule-reason"');
    expect(cssSource).toMatch(/\.route-comparison\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/);
  });

  it('provides map layers and persistent location memories with photos', () => {
    expect(appSource).toContain('className="map-layer-controls"');
    expect(appSource).toContain('interface LocationMemoryRecord');
    expect(appSource).toContain('className="location-memory-card"');
    expect(appSource).toContain('addLocationPhotos');
    expect(appSource).toContain('locationMemories:');
  });

  it('resumes sessions, gathers pending procedures, and replays journeys', () => {
    expect(appSource).toContain('className="session-resume"');
    expect(appSource).toContain('className="pending-procedures"');
    expect(appSource).toContain('function JourneyReplayPanel');
    expect(appSource).toContain('journeyReplayArchive');
  });

  it('adds a state-aware play navigator with exact handoff recovery', () => {
    expect(appSource).toContain('<PlayNavigator');
    expect(appSource).toContain('playNavigatorSignals');
    expect(appSource).toContain('sessionHandoffActionId');
    expect(appSource).toContain('saveSessionHandoff');
    expect(appSource).toContain('[data-play-primary-action="true"]');
    expect(cssSource).toMatch(/\.play-navigator__body\s*\{[\s\S]*?grid-template-columns:/);
  });

  it('adds the full experienced-player flow from departure through session close', () => {
    expect(appSource).toContain('<DepartureGate');
    expect(appSource).toContain('createUndoCheckpoint');
    expect(appSource).toContain('journeyTimeline');
    expect(appSource).toContain('<StateIntegrityPanel');
    expect(appSource).toContain('<TravelTimeline');
    expect(appSource).toContain('<QuickCommandPalette');
    expect(appSource).toContain('<SessionCloseAssistant');
    expect(appSource).toContain('encounter-focus-mode');
    expect(cssSource).toContain('.flow-dialog-backdrop');
  });

  it('keeps canonical region names in English', () => {
    expect(gameplayKoSource).toContain("Bog: 'Bog'");
    expect(gameplayKoSource).toContain("Forest: 'Forest'");
    expect(gameplayKoSource).toContain("Loch: 'Loch'");
    expect(gameplayKoSource).toContain("Meadow: 'Meadow'");
    expect(gameplayKoSource).toContain("Mountain: 'Mountain'");
    expect(gameplayKoSource).toContain("Titan: 'Titan'");
    expect(appSource).toContain('<option value="Soar">🦅 Soar</option>');
  });

  it('keeps map metadata canonical and previews Soar as a direct Flightpath', () => {
    expect(appSource).toContain('handleTravelDestinationNameChange');
    expect(appSource).toContain('setDestRegion(inferMapNodeRegion(node))');
    expect(appSource).toContain("const directFlight = plannedRegion === 'Soar'");
    expect(appSource).toContain("previewIsSoar ? '직선 Flightpath / 1회 Soar'");
    expect(appSource).toContain('const travelExpectedDays = previewIsSoar && previewWagonCapabilities.canSoar ? 3 : 1');
    expect(appSource).toContain('currentRegion: outcome.nextState.currentRegion');
    expect(appSource).toContain("s.currentRegion === 'Soar' && migratedLocationId");
  });

  it('continues through the first actionable step and keeps built-in location names in English', () => {
    expect(appSource).toContain("#action-hub .action-step:not(:disabled)");
    expect(appSource).toContain('nextAction.click()');
    expect(appSource).toContain('currentLocationName: "Oak Road"');
    expect(appSource).toContain("label: 'Oak Road'");
    expect(appSource).toContain('region: toRuleRegion(inferMapNodeRegion');
    expect(gameplayKoSource).toContain("'오크 길': 'Oak Road'");
  });
});
