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

// Printed city mark: largest upright equilateral triangle that sits flush in the square.
const CITY_SQUARE = { x: 2.4, y: 2.4, size: 15.2 };
const CITY_INNER = CITY_SQUARE.size - 1.6;
const CITY_LEFT = (20 - CITY_INNER) / 2;
const CITY_RIGHT = 20 - CITY_LEFT;
const CITY_BOTTOM = CITY_RIGHT;
const CITY_APEX_Y = CITY_BOTTOM - CITY_INNER * Math.sqrt(3) / 2;
export const CITY_TRIANGLE_POINTS = `${10},${CITY_APEX_Y} ${CITY_RIGHT},${CITY_BOTTOM} ${CITY_LEFT},${CITY_BOTTOM}`;

export function MapGlyph({
  kind,
  terrain,
  size = 18,
  title
}: {
  kind: MapGlyphKind;
  terrain?: MapTerrain | null;
  size?: number;
  title?: string;
}) {
  const color = glyphUsesTerrain(kind) ? glyphColor(terrain) : glyphColor(null);
  const stroke = color;
  const common = {
    fill: 'none' as const,
    stroke,
    strokeWidth: 1.6,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const
  };

  return (
    <svg
      className="map-glyph"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
    >
      {title ? <title>{title}</title> : null}
      {kind === 'City' && (
        <>
          <rect
            x={CITY_SQUARE.x}
            y={CITY_SQUARE.y}
            width={CITY_SQUARE.size}
            height={CITY_SQUARE.size}
            fill="none"
            stroke={color}
            strokeWidth="1.6"
          />
          <polygon
            points={CITY_TRIANGLE_POINTS}
            fill={color}
            stroke={color}
            strokeWidth="0.4"
            strokeLinejoin="miter"
          />
        </>
      )}
      {kind === 'Settlement' && (
        <polygon points="10,3 17.4,16.2 2.6,16.2" {...common} />
      )}
      {kind === 'Wilds' && (
        <circle cx="10" cy="10" r="6.2" {...common} />
      )}
      {kind === 'Ruin' && (
        <>
          <circle cx="10" cy="10" r="7" {...common} />
          <text
            x="10"
            y="13.4"
            textAnchor="middle"
            fill={color}
            fontSize="8.4"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="700"
          >
            T
          </text>
        </>
      )}
      {kind === 'Barrow' && (
        <>
          <circle cx="10" cy="10" r="7" {...common} />
          <polygon points="10,15.2 15.4,5.6 4.6,5.6" fill={color} stroke={color} strokeWidth="0.8" strokeLinejoin="round" />
        </>
      )}
      {kind === 'Clinic' && (
        <>
          <circle cx="10" cy="10" r="7" {...common} />
          <circle cx="10" cy="10" r="3.1" fill={color} stroke={color} />
        </>
      )}
    </svg>
  );
}
