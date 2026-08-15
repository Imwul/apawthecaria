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

  it('keeps canonical region names in English', () => {
    expect(gameplayKoSource).toContain("Bog: 'Bog'");
    expect(gameplayKoSource).toContain("Forest: 'Forest'");
    expect(gameplayKoSource).toContain("Loch: 'Loch'");
    expect(gameplayKoSource).toContain("Meadow: 'Meadow'");
    expect(gameplayKoSource).toContain("Mountain: 'Mountain'");
    expect(gameplayKoSource).toContain("Titan: 'Titan'");
  });
});
