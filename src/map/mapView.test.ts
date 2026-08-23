// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_MAP_LAYERS,
  loadMapLayers,
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
  it('normalizes saved layer preferences without retaining removed debug flags', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => JSON.stringify({ currentRoute: false, placeNames: true, roads: true }),
        setItem: () => undefined
      }
    });
    try {
      const layers = loadMapLayers();
      expect(layers.currentRoute).toBe(false);
      expect(layers).not.toHaveProperty('placeNames');
      expect(layers).not.toHaveProperty('roads');
    } finally {
      vi.unstubAllGlobals();
    }
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
  it('does not paint obsolete name labels on nodes', () => {
    expect(mapSource).not.toContain('className="map-location-label"');
    expect(cssSource).not.toContain('.map-location-label');
  });

  it('selects a location without changing current travel state', () => {
    expect(mapSource).toContain('onClick={event => {');
    expect(mapSource).toContain('selectPlace(place.id)');
    expect(mapSource).not.toMatch(/currentLocationName\s*=/);
    expect(appSource).not.toMatch(/onPickLocation=\{playMapMode === 'inspect' \? undefined : handlePlayMapPick\}/);
  });

  it('keeps named destinations above overlapping wild markers and provides a destination confirmation action', () => {
    expect(mapSource).toContain("place.locationType === 'Wilds' ? 3 : 4");
    expect(mapSource).toContain('이곳을 여정 목적지로');
    expect(mapSource).toContain('onConfirmDestination(placeToPick(selectedPlace))');
    expect(mapSource).not.toContain('현재 위치에서 {selectedPlace.hopsFromCurrent}경로');
  });

  it('keeps journey-reason typing from re-rendering the play map', () => {
    expect(appSource).toContain('function IsolatedTextarea');
    expect(appSource).toContain('valueRef={journeyReasonRef}');
    expect(appSource).not.toMatch(/setJourneyReason\(e\.target\.value\)/);
  });

  it('orders the reversible journey draft like the printed setup sequence', () => {
    const originAndSeason = appSource.indexOf('<dt>출발</dt>');
    const destination = appSource.indexOf('<legend>목적지 정하기 (p.19)</legend>');
    const reason = appSource.indexOf('>여정을 떠나는 이유</label>');
    const goal = appSource.indexOf('<legend>목표 정하기 (p.20–21)</legend>');
    const urgency = appSource.indexOf('여정 기한 (p.21)');
    expect(originAndSeason).toBeGreaterThan(-1);
    expect(destination).toBeGreaterThan(originAndSeason);
    expect(reason).toBeGreaterThan(destination);
    expect(goal).toBeGreaterThan(reason);
    expect(urgency).toBeGreaterThan(goal);
    expect(appSource).toContain('출발 준비 지우기');
    expect(appSource).toContain('저장된 캠페인과 지도 연결은 바뀌지 않습니다.');
    expect(appSource).toContain("if (choice === 'clear') clearJourneyStartDraft();");
    expect(appSource).toContain('key={journeyStartDraftRevision}');
  });

  it('interprets a drawn destination card and supports measured or printed-map-confirmed candidates', () => {
    expect(appSource).toContain('journey-card-result');
    expect(appSource).toContain('이 카드의 목적지');
    expect(appSource).toContain('journeyDestinationRequirement.direction.short');
    expect(appSource).toContain('confirmedRouteSummariesFrom');
    expect(appSource).toContain('{candidate.routeSummary.distance}경로 확인됨');
    expect(appSource).toContain('강 {candidate.routeSummary.riverCount}');
    expect(appSource).toContain('수로 {candidate.routeSummary.waterwayCount}');
    expect(appSource).toContain('destinationDistanceConfirmed');
    expect(appSource).toContain('journeyDistanceConfirmedManually');
    expect(appSource).toContain('인쇄 지도에서 {journeyDestinationRequirement?.distance}임을 확인했습니다.');
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

  it('does not add a route stop while the map is being used to choose a journey destination', () => {
    expect(appSource).toContain("onAddWaypoint={playMapMode === 'destination' ? undefined : handleAddRouteWaypoint}");
    expect(appSource).toContain("onSelectedPlaceChange={playMapMode === 'destination' ? handlePlayMapSelection : undefined}");
    expect(appSource).toContain("journeyDestinationMode === 'choose'\n      ? Boolean(journeyGraph[locationId])");
    expect(appSource).toContain('— 출발지가 아닌 목적지를 고르세요 —');
  });

  it('locks map panning before a marker can be dragged to a new place', () => {
    expect(mapSource).toContain('지도 이동 잠그기');
    expect(mapSource).toContain('if (panLocked && !modify) return');
    expect(mapSource).toContain('onMovePlace');
    expect(cssSource).toContain('.paper-map--locked');
    expect(appSource).toContain('onSavePlaces={() => {');
    expect(mapSource).toContain('className="paper-map__save"');
    expect(mapSource).toContain('이 표시 지우기');
  });

  it('gives the folded-map tab a workshop for creating, linking, and deleting marks', () => {
    expect(appSource).toContain('function AtlasMapPanel');
    expect(appSource).toContain('지도 고치기');
    expect(appSource).toContain('지도 연결 편집 모드');
    expect(appSource).toContain('연결 편집 시작');
    expect(appSource).toContain('내가 남긴 표시');
    expect(appSource).toContain('육로로 잇기');
    expect(appSource).toContain('물길 · 실선');
    expect(appSource).toContain('물길 · 빗금');
    expect(appSource).toContain('Shift</kbd>를 누른 채 노드 두 개를 차례로 클릭');
    expect(appSource).toContain("event.key === '1'");
    expect(appSource).toContain("event.key === '2'");
    expect(appSource).toContain("event.key === '3'");
    expect(mapSource).toContain('quickConnect: event.shiftKey');
    expect(appSource).toContain('showTravelRoutes={false}');
    expect(appSource).toContain('showSavedConnections');
    expect(appSource).toContain('veiled\n            showSavedConnections');
    expect(appSource).toContain('hideSelectedPlaceSheet={connectionEditMode}');
    expect(appSource).toContain('currentMapLocationId: stop.id');
    expect(appSource).toContain('resolveCurrentMapLocationKey(state) === id');
    expect(appSource).toContain('인쇄 표시 원래대로');
    expect(appSource).toContain('onDeletePlace={location => hasPrintedOverride(location.id) ? restorePrintedPlace(location.id) : deletePlace(location.id)}');
    expect(mapSource).toContain('paper-map__saved-connection--${connection.kind}');
    expect(mapSource).toContain('connectionHatches(connection)');
    expect(mapSource).toContain('return [-1, 1].map(offset =>');
    expect(mapSource).toContain('{ across: -0.4, nudge: 0 }');
    expect(mapSource).toContain('alongX * 0.18 * offset');
    expect(cssSource).toContain('.paper-map__saved-connection--path');
    expect(cssSource).toContain('.paper-map__saved-connection--river');
    expect(cssSource).toContain('.paper-map__saved-connection-hatch');
    expect(cssSource).toContain('.map-atelier__quick-kinds');
    expect(appSource).toContain('className="map-atelier__delete"');
    expect(appSource).toContain('hidden: true');
    expect(appSource).toContain('지운 인쇄 표시');
    expect(appSource).not.toContain('canDeletePlace={isPlayerCreatedMapPlace}\n        companionCaption');
    expect(appSource).toContain('veiled');
    expect(mapSource).toContain('paper-map--veiled');
    expect(mapSource).toContain('paper-map__veil');
    expect(mapSource).toContain('가림막');
    expect(mapSource).toContain("event.key === 'v' || event.key === 'V'");
    expect(cssSource).toContain('.paper-map--veiled');
    expect(cssSource).toContain('.paper-map__veil');
    expect(appearanceSource).toContain('이름 추가');
    expect(appearanceSource).toContain('이름 없음');
    expect(appearanceSource).toContain('glyphUsesTerrain');
    expect(appearanceSource).toContain('value={draftName}');
    expect(appearanceSource).toContain('if (name !== lastCommittedName)');
    expect(appearanceSource).toContain('onChange={event => setDraftName(event.target.value)}');
    expect(appearanceSource).toContain('onBlur={event => commitName(event.currentTarget.value)}');
    expect(appearanceSource).toContain("!event.nativeEvent.isComposing");
    expect(appearanceSource).not.toContain('onChange={event => emit({ kind, terrain, name: event.target.value })}');
    expect(appearanceSource).not.toContain('도시 이름');
    expect(appSource).toContain('label: stop.name.trim()');
    expect(appSource).toContain('!REVIEWED_MAP_LOCATION_BY_ID.get(location.id)?.hidden');
    expect(appSource).toContain('neighbors: MAP_GRAPH_NODES[location.id]');
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

  it('keeps the map image, saved connections, and node markers in one zooming coordinate surface', () => {
    const contentStart = mapSource.indexOf('<div ref={contentRef} className="paper-map__content"');
    const contentEnd = mapSource.indexOf('<div className="paper-map__controls"', contentStart);
    const content = mapSource.slice(contentStart, contentEnd);
    expect(contentStart).toBeGreaterThan(-1);
    expect(content).toContain('<img');
    expect(content).toContain('className="paper-map__overlay" viewBox="0 0 100 100"');
    expect(content).toContain('{places.map(place =>');
    expect(mapSource).toContain('left: `${position.x}%`');
    expect(mapSource).toContain('top: `${position.y}%`');
    expect(cssSource).toContain('.paper-map__content > img');
    expect(cssSource).toContain('.paper-map__overlay');
  });

  it('marks the active Journey destination on the same zooming map surface', () => {
    expect(appSource).toContain('destinationPlaceId={destinationId}');
    expect(mapSource).toContain("destinationPlaceId === place.id");
    expect(mapSource).toContain('map-location-destination');
    expect(mapSource).toContain('<span>여정 목적지</span>');
    expect(cssSource).toContain('.map-location-ring--destination');
    expect(cssSource).toMatch(/\.map-location-destination\.is-left-edge\s*\{\s*left:\s*50%/);
    expect(cssSource).toMatch(/\.map-location-destination\.is-right-edge\s*\{\s*right:\s*50%/);
  });

  it('keeps offline detection overlays out of the production map', () => {
    expect(mapSource).not.toContain('mapDebug');
    expect(mapSource).not.toContain('Detected road mask');
    expect(mapSource).not.toMatch(/getImageData|createImageBitmap|OffscreenCanvas/);
    expect(cssSource).not.toContain('.paper-map__debug-unsafe');
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
