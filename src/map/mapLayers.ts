const MAP_LAYER_STORAGE_KEY = 'apawthecaria.mapLayers.v2';

export type MapPlaceType = 'City' | 'Settlement' | 'Wilds' | 'Ruin' | 'Barrow';

export type MapLayerState = {
  placeMarkers: boolean;
  visitedPlaces: boolean;
  unvisitedPlaces: boolean;
  hiddenPlaceTypes: MapPlaceType[];
  clinicService: boolean;
  currentRoute: boolean;
  travelHistory: boolean;
};

export const DEFAULT_MAP_LAYERS: MapLayerState = {
  placeMarkers: true,
  visitedPlaces: true,
  unvisitedPlaces: true,
  hiddenPlaceTypes: [],
  clinicService: false,
  currentRoute: true,
  travelHistory: false
};

export const loadMapLayers = (): MapLayerState => {
  if (typeof window === 'undefined') return { ...DEFAULT_MAP_LAYERS };
  try {
    const raw = window.localStorage.getItem(MAP_LAYER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MAP_LAYERS };
    const parsed = JSON.parse(raw) as Partial<MapLayerState>;
    const savedBoolean = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback;
    return {
      placeMarkers: savedBoolean(parsed.placeMarkers, DEFAULT_MAP_LAYERS.placeMarkers),
      visitedPlaces: savedBoolean(parsed.visitedPlaces, DEFAULT_MAP_LAYERS.visitedPlaces),
      unvisitedPlaces: savedBoolean(parsed.unvisitedPlaces, DEFAULT_MAP_LAYERS.unvisitedPlaces),
      hiddenPlaceTypes: Array.isArray(parsed.hiddenPlaceTypes)
        ? parsed.hiddenPlaceTypes.filter((type): type is MapPlaceType =>
          type === 'City' || type === 'Settlement' || type === 'Wilds' || type === 'Ruin' || type === 'Barrow')
        : [],
      clinicService: savedBoolean(parsed.clinicService, DEFAULT_MAP_LAYERS.clinicService),
      currentRoute: savedBoolean(parsed.currentRoute, DEFAULT_MAP_LAYERS.currentRoute),
      travelHistory: savedBoolean(parsed.travelHistory, DEFAULT_MAP_LAYERS.travelHistory)
    };
  } catch {
    return { ...DEFAULT_MAP_LAYERS };
  }
};

export const saveMapLayers = (layers: MapLayerState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MAP_LAYER_STORAGE_KEY, JSON.stringify(layers));
  } catch {
    // UI preference only; ignore quota / private-mode failures.
  }
};

export type MapMoveReason = 'legal' | 'too-close' | 'too-far' | 'loch-locked' | 'disconnected';

export type MapPlace = {
  id: string;
  name: string;
  x: number;
  y: number;
  region?: string;
  regionLabel?: string;
  locationType: MapPlaceType;
  locationTypeLabel: string;
  visited: boolean;
  isCurrent: boolean;
  hasClinic: boolean;
  hopsFromCurrent: number | null;
  moveReason?: MapMoveReason;
  moveCost?: number | null;
  encounterKind?: 'travel' | 'social';
  usesWaterway?: boolean;
  willSoak?: boolean;
  /** Player-confirmed encounter notes associated with this node. */
  mapRecordLabels?: string[];
};

export const isPlaceMarkerVisible = (
  place: MapPlace,
  layers: MapLayerState,
  selectedId: string | null
): boolean => {
  if (place.isCurrent || place.id === selectedId) return true;
  if (!layers.placeMarkers) return false;
  if (place.visited && !layers.visitedPlaces) return false;
  if (!place.visited && !layers.unvisitedPlaces) return false;
  if (layers.hiddenPlaceTypes.includes(place.locationType)) return false;
  return true;
};
