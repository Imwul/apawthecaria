// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAP_LAYERS,
  isPlaceLabelVisible,
  isPlaceMarkerVisible,
  type MapPlace
} from './mapLayers';

const oak: MapPlace = {
  id: 'starting_oak_road',
  name: 'Oak Road',
  x: 26,
  y: 34,
  locationType: 'Wilds',
  locationTypeLabel: '야생 구역',
  visited: true,
  isCurrent: true,
  hasClinic: false,
  hopsFromCurrent: 0
};

const odoak: MapPlace = {
  id: 'odoak',
  name: 'Odoak',
  x: 47,
  y: 34,
  locationType: 'City',
  locationTypeLabel: '도시',
  visited: true,
  isCurrent: false,
  hasClinic: false,
  hopsFromCurrent: 3
};

const spoolkeep: MapPlace = {
  id: 'spoolkeep',
  name: 'Spoolkeep',
  x: 94,
  y: 17,
  locationType: 'City',
  locationTypeLabel: '도시',
  visited: false,
  isCurrent: false,
  hasClinic: false,
  hopsFromCurrent: 12
};

const mapSource = readFileSync(fileURLToPath(new URL('./PaperMap.tsx', import.meta.url)), 'utf8');
const cssSource = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
const appSource = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');

describe('map marker and filter visibility', () => {
  it('hides ordinary labels when Place Names is off', () => {
    expect(isPlaceLabelVisible(odoak, DEFAULT_MAP_LAYERS, null, null, null)).toBe(false);
    expect(isPlaceLabelVisible(oak, DEFAULT_MAP_LAYERS, null, null, null)).toBe(true);
  });

  it('shows labels for selected, hovered, focused, or Place Names on', () => {
    expect(isPlaceLabelVisible(odoak, DEFAULT_MAP_LAYERS, 'odoak', null, null)).toBe(true);
    expect(isPlaceLabelVisible(odoak, DEFAULT_MAP_LAYERS, null, 'odoak', null)).toBe(true);
    expect(isPlaceLabelVisible(odoak, DEFAULT_MAP_LAYERS, null, null, 'odoak')).toBe(true);
    expect(isPlaceLabelVisible(odoak, { ...DEFAULT_MAP_LAYERS, placeNames: true }, null, null, null)).toBe(true);
  });

  it('hides visited or unvisited markers from their filters but keeps the current place', () => {
    expect(isPlaceMarkerVisible(odoak, { ...DEFAULT_MAP_LAYERS, visitedPlaces: false }, null)).toBe(false);
    expect(isPlaceMarkerVisible(spoolkeep, { ...DEFAULT_MAP_LAYERS, unvisitedPlaces: false }, null)).toBe(false);
    expect(isPlaceMarkerVisible(oak, { ...DEFAULT_MAP_LAYERS, visitedPlaces: false, placeMarkers: false }, null)).toBe(true);
    expect(isPlaceMarkerVisible(odoak, { ...DEFAULT_MAP_LAYERS, placeMarkers: false }, 'odoak')).toBe(true);
  });

  it('keeps current and selected markers when both visit filters are off', () => {
    const bothOff = { ...DEFAULT_MAP_LAYERS, visitedPlaces: false, unvisitedPlaces: false };
    expect(isPlaceMarkerVisible(oak, bothOff, null)).toBe(true);
    expect(isPlaceMarkerVisible(odoak, bothOff, 'odoak')).toBe(true);
    expect(isPlaceMarkerVisible(spoolkeep, bothOff, null)).toBe(false);
  });
});

describe('map interaction contracts', () => {
  it('keeps labels from intercepting pointer events', () => {
    expect(cssSource).toMatch(/\.map-location-label\s*\{[\s\S]*?pointer-events:\s*none/);
    expect(mapSource).toContain('className="map-location-label"');
  });

  it('selects a location without changing current travel state', () => {
    expect(mapSource).toContain('onClick={event => {');
    expect(mapSource).toContain('selectPlace(place.id)');
    expect(mapSource).not.toMatch(/currentLocationName\s*=/);
    expect(appSource).not.toMatch(/onPickLocation=\{playMapMode === 'inspect' \? undefined : handlePlayMapPick\}/);
  });

  it('only asks gameplay to travel from the Travel action', () => {
    expect(mapSource).toContain("onClick={() => onTravelRequest(placeToPick(selectedPlace))}");
    expect(mapSource).toContain('여기로 이동');
    expect(mapSource).toContain('selectPlace(null)');
  });

  it('hides history and preview routes when those layers are off', () => {
    expect(mapSource).toContain('if (!layers.currentRoute || !currentPlace || !selectedPlace');
    expect(mapSource).toContain('if (!layers.travelHistory || historyAnchors.length < 2)');
  });

  it('does not invent coordinates for markers or routes', () => {
    expect(mapSource).not.toMatch(/charCodeAt/);
    expect(mapSource).not.toMatch(/bezier/i);
    expect(mapSource).not.toMatch(/quadratic/i);
    expect(appSource).not.toContain('getCoordinatesForLocation');
  });

  it('keeps detection debug overlays out of the ordinary play chrome', () => {
    expect(mapSource).toContain('mapDebug &&');
    expect(mapSource).not.toContain('Detected road mask');
    expect(mapSource).not.toMatch(/getImageData|createImageBitmap|OffscreenCanvas/);
    expect(cssSource).toContain('.paper-map__debug-unsafe');
  });

  it('draws reviewed water crossings as blue waterways instead of brown ink', () => {
    expect(mapSource).toContain("segment.kind === 'waterway' ? 'paper-map__waterway'");
    expect(cssSource).toContain('.paper-map__waterway');
    expect(mapSource).toContain('파란 물길입니다');
  });

  it('only offers Travel on a legal Speed stop and explains encounter, soak, and loch rules', () => {
    expect(mapSource).toContain("selectedPlace.moveReason === 'legal'");
    expect(mapSource).toContain('도착하면 사교 조우');
    expect(mapSource).toContain('도착하면 이동 조우');
    expect(mapSource).toContain('호수·강 야생에서 이동을 끝낼 수 없습니다');
    expect(mapSource).toContain('물길을 헤엄치면');
  });

  it('offers search empty state and travel only from a graph-reachable destination', () => {
    expect(mapSource).toContain('해당하는 장소가 없습니다.');
    expect(mapSource).toContain('selectedCanTravel');
    expect(mapSource).toContain('{onTravelRequest && selectedCanTravel && (');
  });
});
