export const MAP_GLYPH_KINDS = ['City', 'Settlement', 'Wilds', 'Ruin', 'Barrow', 'Clinic'] as const;
export type MapGlyphKind = (typeof MAP_GLYPH_KINDS)[number];

export const MAP_TERRAINS = ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'] as const;
export type MapTerrain = (typeof MAP_TERRAINS)[number];

export const MAP_TERRAIN_COLORS: Record<MapTerrain, string> = {
  Bog: '#9d2e84',
  Forest: '#5f8f3c',
  Loch: '#1c6da8',
  Meadow: '#e5a832',
  Mountain: '#b7533c'
};

export const MAP_GLYPH_KIND_LABELS: Record<MapGlyphKind, string> = {
  City: '도시',
  Settlement: '정착지',
  Wilds: '야생',
  Ruin: '티탄 유적',
  Barrow: '거수 고분',
  Clinic: '약제소'
};

export const MAP_TERRAIN_LABELS: Record<MapTerrain, string> = {
  Bog: '늪지',
  Forest: '숲',
  Loch: '호수',
  Meadow: '초원',
  Mountain: '산맥'
};

export const glyphColor = (terrain: MapTerrain | null | undefined, fallback = '#5a4a3a'): string =>
  terrain && MAP_TERRAIN_COLORS[terrain] ? MAP_TERRAIN_COLORS[terrain] : fallback;

export const glyphUsesTerrain = (kind: MapGlyphKind): boolean => kind !== 'Ruin';

const CITY_SQUARE_SIZE = 15.2;
const CITY_INNER = CITY_SQUARE_SIZE - 1.6;
const CITY_LEFT = (20 - CITY_INNER) / 2;
const CITY_RIGHT = 20 - CITY_LEFT;
const CITY_BOTTOM = CITY_RIGHT;
const CITY_APEX_Y = CITY_BOTTOM - CITY_INNER * Math.sqrt(3) / 2;

export const CITY_SQUARE = { x: 2.4, y: 2.4, size: CITY_SQUARE_SIZE };
export const CITY_TRIANGLE_POINTS = `${10},${CITY_APEX_Y} ${CITY_RIGHT},${CITY_BOTTOM} ${CITY_LEFT},${CITY_BOTTOM}`;
