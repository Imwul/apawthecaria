import { MapGlyph, MAP_GLYPH_KIND_LABELS, MAP_GLYPH_KINDS, MAP_TERRAIN_LABELS, MAP_TERRAINS, type MapGlyphKind, type MapTerrain } from './mapGlyphs';

type MapNodeAppearanceProps = {
  kind: MapGlyphKind;
  terrain: MapTerrain | null;
  onChange: (next: { kind: MapGlyphKind; terrain: MapTerrain | null }) => void;
  heading?: string;
};

export function MapNodeAppearance({ kind, terrain, onChange, heading = '표시 형태' }: MapNodeAppearanceProps) {
  return (
    <div className="map-node-appearance">
      <p className="map-node-appearance__heading">{heading}</p>
      <div className="map-node-appearance__row" role="group" aria-label="형태">
        {MAP_GLYPH_KINDS.map(option => (
          <button
            key={option}
            type="button"
            className={`map-node-appearance__choice${kind === option ? ' is-on' : ''}`}
            aria-pressed={kind === option}
            onClick={() => onChange({ kind: option, terrain })}
          >
            <MapGlyph kind={option} terrain={terrain} size={20} />
            <span>{MAP_GLYPH_KIND_LABELS[option]}</span>
          </button>
        ))}
      </div>
      <div className="map-node-appearance__row" role="group" aria-label="지형색">
        {MAP_TERRAINS.map(option => (
          <button
            key={option}
            type="button"
            className={`map-node-appearance__swatch${terrain === option ? ' is-on' : ''}`}
            aria-pressed={terrain === option}
            onClick={() => onChange({ kind, terrain: option })}
          >
            <MapGlyph kind={kind} terrain={option} size={16} />
            <span>{MAP_TERRAIN_LABELS[option]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
