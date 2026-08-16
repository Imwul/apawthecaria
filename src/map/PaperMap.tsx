import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildRoadRouteGeometry,
  listAlignedRoadPolylines,
  listTracedRoadPolylines,
  listUnsafeRoadPolylines,
  listWaterwayPolylines,
  pointsToPolyString,
  type RoadRouteGeometry
} from './roadGeometry';
import {
  DEFAULT_MAP_LAYERS,
  isPlaceLabelVisible,
  isPlaceMarkerVisible,
  loadMapLayers,
  saveMapLayers,
  type MapLayerState,
  type MapPlace
} from './mapLayers';
import {
  mapDebugJunctions,
  mapDebugLocationAnchors,
  useMapDebugEnabled
} from './detection/mapDebug';

export type MapClinicOverlay = {
  id: string;
  name: string;
  points: Array<{ id: string; x: number; y: number; hops: number }>;
};

export type MapPickLocation = {
  id: string;
  name: string;
  region?: string;
  kind?: string;
};

type PaperMapProps = {
  places: MapPlace[];
  clinicOverlays?: MapClinicOverlay[];
  highlightPlaceIds?: string[];
  selectedPlaceId?: string | null;
  historyAnchors?: Array<{ id: string; x: number; y: number }>;
  variant?: 'full' | 'companion';
  companionCaption?: string;
  travelEnabled?: boolean;
  travelBlockedReason?: string | null;
  onSelectedPlaceChange?: (placeId: string | null) => void;
  onConfirmDestination?: (location: MapPickLocation) => void;
  onTravelRequest?: (location: MapPickLocation) => void;
  onOpenFullMap?: () => void;
  onOpenReference?: (request: {
    entryId: string;
    page: number;
    title: string;
    context: Array<{ label: string; value: string }>;
  }) => void;
  currentRegion?: string;
  currentSeasonLabel?: string;
};

const EMPTY_ROUTE: RoadRouteGeometry = { segments: [], missingPairs: [], total: 0 };
const ROAD_POLYLINES = listTracedRoadPolylines();
const ALIGNED_ROAD_POLYLINES = listAlignedRoadPolylines();
const UNSAFE_ROAD_POLYLINES = listUnsafeRoadPolylines();
const WATERWAY_POLYLINES = listWaterwayPolylines();
const DEBUG_LOCATION_ANCHORS = mapDebugLocationAnchors();
const DEBUG_JUNCTIONS = mapDebugJunctions();
const MIN_SCALE = 1;
const MAX_SCALE = 4;

const placeToPick = (place: MapPlace): MapPickLocation => ({
  id: place.id,
  name: place.name,
  region: place.region,
  kind: place.locationType
});

export function PaperMap({
  places,
  clinicOverlays = [],
  highlightPlaceIds = [],
  selectedPlaceId = null,
  historyAnchors = [],
  variant = 'full',
  companionCaption,
  travelEnabled = false,
  travelBlockedReason = null,
  onSelectedPlaceChange,
  onConfirmDestination,
  onTravelRequest,
  onOpenFullMap,
  onOpenReference,
  currentRegion,
  currentSeasonLabel
}: PaperMapProps) {
  const isCompanion = variant === 'companion';
  const mapDebug = useMapDebugEnabled();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; moved: boolean; startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(720);
  const [layers, setLayers] = useState<MapLayerState>(() => loadMapLayers());
  const [layersOpen, setLayersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(selectedPlaceId);
  const [seenSelectedPlaceId, setSeenSelectedPlaceId] = useState(selectedPlaceId);
  if (selectedPlaceId !== seenSelectedPlaceId) {
    setSeenSelectedPlaceId(selectedPlaceId);
    setSelectedId(selectedPlaceId);
  }

  useEffect(() => {
    saveMapLayers(layers);
  }, [layers]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setViewportWidth(Math.max(240, viewport.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const placeById = useMemo(() => new Map(places.map(place => [place.id, place])), [places]);
  const currentPlace = places.find(place => place.isCurrent) || null;
  const selectedPlace = selectedId ? placeById.get(selectedId) || null : null;
  const highlightSet = useMemo(() => new Set(highlightPlaceIds), [highlightPlaceIds]);
  const presentTypes = useMemo(
    () => Array.from(new Set(places.map(place => place.locationType))),
    [places]
  );

  const previewGeometry = useMemo(() => {
    if (!layers.currentRoute || !currentPlace || !selectedPlace || selectedPlace.id === currentPlace.id) {
      return EMPTY_ROUTE;
    }
    return buildRoadRouteGeometry([
      { id: currentPlace.id, x: currentPlace.x, y: currentPlace.y },
      { id: selectedPlace.id, x: selectedPlace.x, y: selectedPlace.y }
    ]);
  }, [layers.currentRoute, currentPlace, selectedPlace]);

  const recentGeometry = useMemo(() => {
    if (!layers.currentRoute || selectedPlace || historyAnchors.length < 2) return EMPTY_ROUTE;
    return buildRoadRouteGeometry(historyAnchors.slice(-2));
  }, [layers.currentRoute, selectedPlace, historyAnchors]);

  const historyGeometry = useMemo(() => {
    if (!layers.travelHistory || historyAnchors.length < 2) return EMPTY_ROUTE;
    const stops = selectedPlace || !layers.currentRoute ? historyAnchors : historyAnchors.slice(0, -1);
    return stops.length >= 2 ? buildRoadRouteGeometry(stops) : EMPTY_ROUTE;
  }, [layers.travelHistory, layers.currentRoute, selectedPlace, historyAnchors]);

  const contentWidth = Math.round(viewportWidth * scale);

  const selectPlace = useCallback((placeId: string | null) => {
    setSelectedId(placeId);
    onSelectedPlaceChange?.(placeId);
  }, [onSelectedPlaceChange]);

  const centerOnPlace = useCallback((place: MapPlace) => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const height = content.clientHeight;
    viewport.scrollLeft = (place.x / 100) * contentWidth - viewport.clientWidth / 2;
    viewport.scrollTop = (place.y / 100) * height - viewport.clientHeight / 2;
  }, [contentWidth]);

  const applyScale = useCallback((nextScale: number, originX?: number, originY?: number) => {
    const viewport = viewportRef.current;
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    if (!viewport) {
      setScale(clamped);
      return;
    }
    const prevWidth = Math.round(viewportWidth * scale);
    const nextWidth = Math.round(viewportWidth * clamped);
    const ratio = prevWidth === 0 ? 1 : nextWidth / prevWidth;
    const localX = originX ?? viewport.scrollLeft + viewport.clientWidth / 2;
    const localY = originY ?? viewport.scrollTop + viewport.clientHeight / 2;
    setScale(clamped);
    requestAnimationFrame(() => {
      viewport.scrollLeft = localX * ratio - (originX !== undefined ? originX - viewport.scrollLeft : viewport.clientWidth / 2);
      viewport.scrollTop = localY * ratio - (originY !== undefined ? originY - viewport.scrollTop : viewport.clientHeight / 2);
    });
  }, [scale, viewportWidth]);

  const [seenCurrentId, setSeenCurrentId] = useState(currentPlace?.id || null);
  const currentId = currentPlace?.id || null;
  const currentChanged = Boolean(seenCurrentId && currentId && seenCurrentId !== currentId);
  if (currentId !== seenCurrentId) {
    setSeenCurrentId(currentId);
    if (currentChanged) setSelectedId(null);
  }
  useEffect(() => {
    if (currentChanged && currentPlace) centerOnPlace(currentPlace);
  }, [centerOnPlace, currentChanged, currentPlace]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (searchOpen) {
        setSearchOpen(false);
        return;
      }
      if (layersOpen) {
        setLayersOpen(false);
        return;
      }
      selectPlace(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layersOpen, searchOpen, selectPlace]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return places.slice(0, 8);
    return places.filter(place =>
      place.name.toLowerCase().includes(query)
      || place.id.toLowerCase().includes(query)
      || (place.regionLabel || '').toLowerCase().includes(query)
    ).slice(0, 8);
  }, [places, searchQuery]);

  const startDrag = (clientX: number, clientY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: clientX,
      startY: clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop
    };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const viewport = viewportRef.current;
    const drag = dragRef.current;
    if (!viewport || !drag?.active) return;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    viewport.scrollLeft = drag.scrollLeft - dx;
    viewport.scrollTop = drag.scrollTop - dy;
  };

  const endBackgroundGesture = () => {
    const drag = dragRef.current;
    if (!drag?.active) {
      dragRef.current = drag ? { ...drag, active: false } : null;
      return;
    }
    dragRef.current = { ...drag, active: false };
    if (!drag.moved) selectPlace(null);
  };

  const handleBackgroundPointerDown = (event: React.MouseEvent | React.TouchEvent) => {
    if ('button' in event && event.button !== 0) return;
    const point = 'touches' in event ? event.touches[0] : event;
    if (!point) return;
    startDrag(point.clientX, point.clientY);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const originX = viewport.scrollLeft + (event.clientX - rect.left);
      const originY = viewport.scrollTop + (event.clientY - rect.top);
      const delta = event.deltaY > 0 ? -0.18 : 0.18;
      applyScale(scale + delta, originX, originY);
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [applyScale, scale]);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      pinchRef.current = {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        scale
      };
      dragRef.current = null;
      return;
    }
    handleBackgroundPointerDown(event);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchRef.current) {
      const [a, b] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinchRef.current.distance > 0) {
        applyScale(pinchRef.current.scale * (distance / pinchRef.current.distance));
      }
      return;
    }
    const point = event.touches[0];
    if (point) moveDrag(point.clientX, point.clientY);
  };

  const previewUnmapped = Boolean(selectedPlace && currentPlace && selectedPlace.id !== currentPlace.id && previewGeometry.missingPairs.length > 0);
  const previewUsesWaterway = previewGeometry.segments.some(segment => segment.kind === 'waterway');
  const selectedIsCandidate = Boolean(selectedPlace && highlightSet.has(selectedPlace.id));
  const selectedCanTravel = Boolean(
    selectedPlace
    && !selectedPlace.isCurrent
    && (selectedPlace.moveReason
      ? selectedPlace.moveReason === 'legal'
      : selectedPlace.hopsFromCurrent !== null && selectedPlace.hopsFromCurrent > 0)
  );
  const moveReasonText = selectedPlace && !selectedPlace.isCurrent
    ? selectedPlace.moveReason === 'legal'
      ? `${selectedPlace.moveCost ?? selectedPlace.hopsFromCurrent}경로 이동 · ${selectedPlace.encounterKind === 'social' ? '도착하면 사교 조우' : '도착하면 이동 조우'} · 하루가 지나고, 현지 야수를 도와야 다시 이동합니다`
      : selectedPlace.moveReason === 'too-close'
        ? '속도만큼 경로를 모두 써야 합니다. 여기는 더 가깝습니다.'
        : selectedPlace.moveReason === 'too-far'
          ? '이번 이동 속도보다 멉니다.'
          : selectedPlace.moveReason === 'loch-locked'
            ? '도구 없이 호수·강 야생에서 이동을 끝낼 수 없습니다. 물길은 멈추지 않고 헤엄쳐 지날 수 있습니다.'
            : selectedPlace.moveReason === 'disconnected'
              ? '연결된 경로가 없습니다.'
              : null
    : null;
  const searchHasQuery = searchQuery.trim().length > 0;

  return (
    <section className={`paper-map${isCompanion ? ' paper-map--companion' : ''}`} aria-label="Bristley Woods 지도">
      <div
        ref={viewportRef}
        className="paper-map__viewport"
        onMouseDown={handleBackgroundPointerDown}
        onMouseMove={event => moveDrag(event.clientX, event.clientY)}
        onMouseUp={endBackgroundGesture}
        onMouseLeave={() => {
          if (dragRef.current?.active) dragRef.current = { ...dragRef.current, active: false };
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => {
          pinchRef.current = null;
          endBackgroundGesture();
        }}
      >
        <div ref={contentRef} className="paper-map__content" style={{ width: `${contentWidth}px` }}>
          <img
            src="/Apawthecaria Map Back.jpg"
            alt="Bristley Woods 지도 후면"
            draggable={false}
            onDragStart={event => event.preventDefault()}
          />
          <svg className="paper-map__overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {mapDebug && layers.roads && ROAD_POLYLINES.map((points, index) => (
              <polyline
                key={`road:${index}`}
                className="paper-map__roads"
                points={pointsToPolyString(points)}
                fill="none"
              />
            ))}
            {mapDebug && ALIGNED_ROAD_POLYLINES.map((points, index) => (
              <polyline
                key={`debug-aligned:${index}`}
                className="paper-map__debug-aligned"
                points={pointsToPolyString(points)}
                fill="none"
              />
            ))}
            {mapDebug && UNSAFE_ROAD_POLYLINES.map((points, index) => (
              <polyline
                key={`debug-unsafe:${index}`}
                className="paper-map__debug-unsafe"
                points={pointsToPolyString(points)}
                fill="none"
              />
            ))}
            {mapDebug && WATERWAY_POLYLINES.map((points, index) => (
              <polyline
                key={`debug-waterway:${index}`}
                className="paper-map__debug-waterway"
                points={pointsToPolyString(points)}
                fill="none"
              />
            ))}
            {mapDebug && DEBUG_JUNCTIONS.map(node => (
              <circle
                key={`debug-junction:${node.id}`}
                className="paper-map__debug-junction"
                cx={node.x}
                cy={node.y}
                r={0.28}
              />
            ))}
            {mapDebug && DEBUG_LOCATION_ANCHORS.map(anchor => (
              <g key={`debug-anchor:${anchor.id}`}>
                <rect
                  className={`paper-map__debug-anchor paper-map__debug-anchor--${anchor.status.toLowerCase()}`}
                  x={anchor.x - 0.45}
                  y={anchor.y - 0.45}
                  width={0.9}
                  height={0.9}
                />
                {anchor.candidate && (
                  <line
                    className="paper-map__debug-anchor-link"
                    x1={anchor.x}
                    y1={anchor.y}
                    x2={anchor.candidate.x}
                    y2={anchor.candidate.y}
                  />
                )}
              </g>
            ))}
            {historyGeometry.segments.map((segment, index) => (
              <polyline
                key={`history:${segment.id}:${index}`}
                className={segment.kind === 'waterway' ? 'paper-map__waterway' : 'paper-map__history'}
                points={pointsToPolyString(segment.points)}
                fill="none"
              />
            ))}
            {recentGeometry.segments.map((segment, index) => (
              <polyline
                key={`recent:${segment.id}:${index}`}
                className={segment.kind === 'waterway' ? 'paper-map__waterway' : 'paper-map__recent'}
                points={pointsToPolyString(segment.points)}
                fill="none"
              />
            ))}
            {previewGeometry.segments.map((segment, index) => (
              <polyline
                key={`preview:${segment.id}:${index}`}
                className={segment.kind === 'waterway' ? 'paper-map__waterway' : 'paper-map__preview'}
                points={pointsToPolyString(segment.points)}
                fill="none"
              />
            ))}
            {layers.clinicService && clinicOverlays.map((clinic, index) => {
              if (clinic.points.length === 0) return null;
              const xs = clinic.points.map(point => point.x);
              const ys = clinic.points.map(point => point.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const x = (minX + maxX) / 2;
              const y = (minY + maxY) / 2;
              return (
                <g key={`clinic:${clinic.id}`}>
                  <ellipse
                    className="paper-map__clinic"
                    cx={x}
                    cy={y}
                    rx={Math.max(4, (maxX - minX) / 2 + 2)}
                    ry={Math.max(3, (maxY - minY) / 2 + 2)}
                    transform={`rotate(${index % 2 === 0 ? -6 : 6} ${x} ${y})`}
                  />
                  {clinic.points.map(point => (
                    <circle
                      key={`${clinic.id}:${point.id}`}
                      className={point.hops === 0 ? 'paper-map__clinic-core' : 'paper-map__clinic-dot'}
                      cx={point.x}
                      cy={point.y}
                      r={point.hops === 0 ? 0.38 : 0.22}
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {places.map(place => {
            const visible = isPlaceMarkerVisible(place, layers, selectedId);
            if (!visible) return null;
            const selected = selectedId === place.id;
            const showLabel = isPlaceLabelVisible(place, layers, selectedId, hoveredId, focusedId);
            const candidate = highlightSet.has(place.id);
            return (
              <div
                key={place.id}
                className="map-location-marker"
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
              >
                <button
                  type="button"
                  className={[
                    'map-location-hit',
                    place.isCurrent ? 'is-current' : '',
                    selected ? 'is-picked' : '',
                    candidate ? 'is-candidate' : '',
                    place.visited ? 'is-visited' : 'is-unvisited'
                  ].filter(Boolean).join(' ')}
                  aria-label={place.name}
                  aria-pressed={selected}
                  data-map-place-id={place.id}
                  onMouseDown={event => event.stopPropagation()}
                  onTouchStart={event => event.stopPropagation()}
                  onMouseEnter={() => setHoveredId(place.id)}
                  onMouseLeave={() => setHoveredId(current => current === place.id ? null : current)}
                  onFocus={() => setFocusedId(place.id)}
                  onBlur={() => setFocusedId(current => current === place.id ? null : current)}
                  onClick={event => {
                    event.stopPropagation();
                    selectPlace(place.id);
                  }}
                >
                  <span className="map-location-dot" aria-hidden="true" />
                  {place.isCurrent && <span className="map-location-ring" aria-hidden="true" />}
                  {selected && !place.isCurrent && <span className="map-location-ring map-location-ring--selected" aria-hidden="true" />}
                </button>
                {showLabel && <span className="map-location-label">{place.name}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="paper-map__controls" aria-label="지도 조절">
        <button type="button" onClick={() => applyScale(scale - 0.25)} aria-label="축소">−</button>
        <button type="button" onClick={() => applyScale(scale + 0.25)} aria-label="확대">+</button>
        <button type="button" onClick={() => { setScale(1); if (viewportRef.current) { viewportRef.current.scrollLeft = 0; viewportRef.current.scrollTop = 0; } }} aria-label="지도 맞춤">맞춤</button>
        <button
          type="button"
          onClick={() => currentPlace && centerOnPlace(currentPlace)}
          disabled={!currentPlace}
          aria-label="현재 위치로"
        >
          현재
        </button>
        <button
          type="button"
          className={searchOpen ? 'is-open' : ''}
          onClick={() => { setSearchOpen(open => !open); setLayersOpen(false); }}
          aria-expanded={searchOpen}
          aria-label="장소 검색"
        >
          검색
        </button>
        <button
          type="button"
          className={layersOpen ? 'is-open' : ''}
          onClick={() => { setLayersOpen(open => !open); setSearchOpen(false); }}
          aria-expanded={layersOpen}
          aria-label="겹침 설정"
        >
          겹침
        </button>
        {onOpenReference && (
          <button
            type="button"
            onClick={() => onOpenReference({
              entryId: `region:${currentRegion || 'Forest'}`,
              page: 23,
              title: '이동 규칙',
              context: [
                { label: '현재 위치', value: currentPlace?.name || '미기록' },
                { label: '현재 계절', value: currentSeasonLabel || '미기록' }
              ]
            })}
          >
            지역
          </button>
        )}
        {onOpenFullMap && <button type="button" onClick={onOpenFullMap}>큰 지도</button>}
      </div>

      {searchOpen && (
        <div className="paper-map__popover paper-map__search" role="search">
          <input
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="장소 이름"
            aria-label="장소 이름 검색"
            autoFocus
          />
          <ul>
            {searchResults.length === 0 && searchHasQuery && (
              <li className="paper-map__search-empty">해당하는 장소가 없습니다.</li>
            )}
            {searchResults.map(place => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectPlace(place.id);
                    centerOnPlace(place);
                    setSearchOpen(false);
                  }}
                >
                  {place.name}
                  <small>{place.locationTypeLabel}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {layersOpen && (
        <div className="paper-map__popover paper-map__layers" role="dialog" aria-label="지도 겹침">
          <section>
            <h3>장소</h3>
            <label><input type="checkbox" checked={layers.placeMarkers} onChange={event => setLayers(current => ({ ...current, placeMarkers: event.target.checked }))} /> 장소 표시</label>
            <label><input type="checkbox" checked={layers.placeNames} onChange={event => setLayers(current => ({ ...current, placeNames: event.target.checked }))} /> 지명</label>
            <label><input type="checkbox" checked={layers.visitedPlaces} onChange={event => setLayers(current => ({ ...current, visitedPlaces: event.target.checked }))} /> 방문한 곳</label>
            <label><input type="checkbox" checked={layers.unvisitedPlaces} onChange={event => setLayers(current => ({ ...current, unvisitedPlaces: event.target.checked }))} /> 미방문</label>
            {presentTypes.length > 0 && (
              <div className="paper-map__layer-sub">
                <h4>장소 유형</h4>
                {presentTypes.map(type => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={!layers.hiddenPlaceTypes.includes(type)}
                      onChange={event => setLayers(current => ({
                        ...current,
                        hiddenPlaceTypes: event.target.checked
                          ? current.hiddenPlaceTypes.filter(item => item !== type)
                          : [...current.hiddenPlaceTypes, type]
                      }))}
                    />
                    {places.find(place => place.locationType === type)?.locationTypeLabel || type}
                  </label>
                ))}
              </div>
            )}
          </section>
          <section>
            <h3>이동</h3>
            <label><input type="checkbox" checked={layers.currentRoute} onChange={event => setLayers(current => ({ ...current, currentRoute: event.target.checked }))} /> 현재 경로</label>
            <label><input type="checkbox" checked={layers.travelHistory} onChange={event => setLayers(current => ({ ...current, travelHistory: event.target.checked }))} /> 지난 경로</label>
          </section>
          <section>
            <h3>서비스</h3>
            <label><input type="checkbox" checked={layers.clinicService} onChange={event => setLayers(current => ({ ...current, clinicService: event.target.checked }))} /> 약제소 / 서비스</label>
          </section>
          <section>
            <h3>고급</h3>
            <label><input type="checkbox" checked={layers.roads} onChange={event => setLayers(current => ({ ...current, roads: event.target.checked }))} /> 도로 추적</label>
          </section>
        </div>
      )}

      {selectedPlace && !layersOpen && !searchOpen && (
        <aside className="paper-map__sheet" aria-label={`${selectedPlace.name} 정보`}>
          <div>
            <strong>{selectedPlace.name}</strong>
            <span>
              {selectedPlace.isCurrent ? '현재 위치' : selectedPlace.visited ? '방문함' : '미방문'}
              {selectedPlace.locationTypeLabel ? ` · ${selectedPlace.locationTypeLabel}` : ''}
            </span>
            {!selectedPlace.isCurrent && selectedPlace.hopsFromCurrent !== null && (
              <span>현재 위치에서 {selectedPlace.hopsFromCurrent}경로</span>
            )}
            {selectedPlace.hasClinic && <span>약제소가 있는 위치</span>}
            {moveReasonText && <span>{moveReasonText}</span>}
            {selectedPlace.willSoak && (
              <span className="paper-map__waterway-note">물길을 헤엄치면 방수되지 않은 약재와 물품이 젖어 버려집니다.</span>
            )}
            {previewUsesWaterway && !selectedPlace.willSoak && (
              <span className="paper-map__waterway-note">파란 물길입니다. 호수·강 야생에서는 멈추지 않습니다.</span>
            )}
            {previewUnmapped && <span className="paper-map__unmapped">경로를 아직 지도에 그리지 못했습니다.</span>}
          </div>
          <div className="paper-map__sheet-actions">
            {onConfirmDestination && selectedIsCandidate && (
              <button type="button" onClick={() => onConfirmDestination(placeToPick(selectedPlace))}>
                이 목적지로 정하기
              </button>
            )}
            {onTravelRequest && selectedCanTravel && (
              <button
                type="button"
                disabled={!travelEnabled}
                onClick={() => onTravelRequest(placeToPick(selectedPlace))}
              >
                {travelEnabled ? '여기로 이동' : (travelBlockedReason || '지금은 이동할 수 없습니다')}
              </button>
            )}
            <button type="button" onClick={() => selectPlace(null)}>닫기</button>
          </div>
        </aside>
      )}

      {companionCaption && !selectedPlace && (
        <p className="paper-map__caption">{companionCaption}</p>
      )}
    </section>
  );
}


