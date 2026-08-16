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

const start: MapPlace = {
  id: 'starting_oak_road',
  name: 'Odoak',
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
const appearanceSource = readFileSync(fileURLToPath(new URL('./MapNodeAppearance.tsx', import.meta.url)), 'utf8');

describe('map marker and filter visibility', () => {
  it('hides ordinary labels when Place Names is off', () => {
    expect(isPlaceLabelVisible(odoak, DEFAULT_MAP_LAYERS, null, null, null)).toBe(false);
    expect(isPlaceLabelVisible(start, DEFAULT_MAP_LAYERS, null, null, null)).toBe(true);
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
    expect(isPlaceMarkerVisible(start, { ...DEFAULT_MAP_LAYERS, visitedPlaces: false, placeMarkers: false }, null)).toBe(true);
    expect(isPlaceMarkerVisible(odoak, { ...DEFAULT_MAP_LAYERS, placeMarkers: false }, 'odoak')).toBe(true);
  });

  it('keeps current and selected markers when both visit filters are off', () => {
    const bothOff = { ...DEFAULT_MAP_LAYERS, visitedPlaces: false, unvisitedPlaces: false };
    expect(isPlaceMarkerVisible(start, bothOff, null)).toBe(true);
    expect(isPlaceMarkerVisible(odoak, bothOff, 'odoak')).toBe(true);
    expect(isPlaceMarkerVisible(spoolkeep, bothOff, null)).toBe(false);
  });
});

describe('map interaction contracts', () => {
  it('keeps leftover label styles from intercepting pointer events and does not paint names on nodes', () => {
    expect(cssSource).toMatch(/\.map-location-label\s*\{[\s\S]*?pointer-events:\s*none/);
    expect(mapSource).not.toContain('className="map-location-label"');
  });

  it('selects a location without changing current travel state', () => {
    expect(mapSource).toContain('onClick={event => {');
    expect(mapSource).toContain('selectPlace(place.id)');
    expect(mapSource).not.toMatch(/currentLocationName\s*=/);
    expect(appSource).not.toMatch(/onPickLocation=\{playMapMode === 'inspect' \? undefined : handlePlayMapPick\}/);
  });

  it('keeps journey-reason typing from re-rendering the play map', () => {
    expect(appSource).toContain('function IsolatedTextarea');
    expect(appSource).toContain('valueRef={journeyReasonRef}');
    expect(appSource).not.toMatch(/setJourneyReason\(e\.target\.value\)/);
  });

  it('only asks gameplay to travel from the Travel action', () => {
    expect(mapSource).toContain("onClick={() => onTravelRequest(placeToPick(selectedPlace))}");
    expect(mapSource).toContain('여기로 이동');
    expect(mapSource).toContain('selectPlace(null)');
  });

  it('adds a clicked node to the composed route and lets Command-click mark a missing place', () => {
    expect(mapSource).toContain('onAddWaypoint?.(placeToPick(place))');
    expect(mapSource).toContain('경로에 넣기');
    expect(mapSource).toContain('여기를 지금 있는 곳으로');
    expect(mapSource).toContain('onCreatePlace');
    expect(mapSource).toContain('어떤 표시를 남길까요?');
    expect(mapSource).toContain('이 자리에 남기기');
    expect(mapSource).toContain('event.metaKey || event.ctrlKey');
    expect(mapSource).not.toContain('detail === 2');
    expect(appSource).toContain('id="play-journey-map"');
    expect(appSource).toContain('<RouteComposer');
    expect(appSource).toContain("source: previous?.hidden ? 'player-correction' : (previous?.source || 'player-correction')");
  });

  it('locks map panning before a marker can be dragged to a new place', () => {
    expect(mapSource).toContain('지도 이동 잠그기');
    expect(mapSource).toContain('if (panLocked && !modify) return');
    expect(mapSource).toContain('onMovePlace');
    expect(cssSource).toContain('.paper-map--locked');
    expect(appSource).toContain('onSavePlaces={handleSaveMapPlaces}');
    expect(mapSource).toContain('className="paper-map__save"');
    expect(mapSource).toContain('이 표시 지우기');
  });

  it('gives the folded-map tab a workshop for creating, linking, and deleting marks', () => {
    expect(appSource).toContain('function AtlasMapPanel');
    expect(appSource).toContain('지도 고치기');
    expect(appSource).toContain('다음 표시와 잇기');
    expect(appSource).toContain('내가 남긴 표시');
    expect(appSource).toContain('육로로 잇기');
    expect(appSource).toContain('강으로 잇기');
    expect(appSource).toContain('수로로 잇기');
    expect(appSource).toContain('showTravelRoutes={false}');
    expect(appSource).toContain('className="map-atelier__delete"');
    expect(appSource).toContain('hidden: true');
    expect(appSource).toContain('지운 인쇄 표시');
    expect(appSource).not.toContain('canDeletePlace={isPlayerCreatedMapPlace}\n        companionCaption');
    expect(appSource).toContain('veiled');
    expect(mapSource).toContain('paper-map--veiled');
    expect(mapSource).toContain('paper-map__veil');
    expect(mapSource).toContain('유산지');
    expect(mapSource).toContain("event.key === 'v' || event.key === 'V'");
    expect(cssSource).toContain('.paper-map--veiled');
    expect(cssSource).toContain('.paper-map__veil');
    expect(appearanceSource).toContain('이름 추가');
    expect(appearanceSource).toContain('이름 없음');
    expect(appearanceSource).toContain('glyphUsesTerrain');
    expect(appearanceSource).not.toContain('도시 이름');
    expect(appSource).toContain('label: stop.name.trim()');
  });

  it('hides history and preview routes when those layers are off', () => {
    expect(mapSource).toContain('if (!showTravelRoutes || !layers.currentRoute || !currentPlace || !selectedPlace');
    expect(mapSource).toContain('if (!showTravelRoutes || !layers.travelHistory || historyAnchors.length < 2)');
    expect(mapSource).toContain('showTravelRoutes = true');
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
