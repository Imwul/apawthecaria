import {
  CITY_SQUARE,
  CITY_TRIANGLE_POINTS,
  glyphColor,
  glyphUsesTerrain,
  type MapGlyphKind,
  type MapTerrain
} from './mapGlyphTypes';

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
