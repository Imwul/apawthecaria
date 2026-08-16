import { MapGlyph, MAP_GLYPH_KIND_LABELS, MAP_GLYPH_KINDS, MAP_TERRAIN_LABELS, MAP_TERRAINS, type MapGlyphKind, type MapTerrain } from './mapGlyphs';

type MapNodeAppearanceProps = {
  kind: MapGlyphKind;
  terrain: MapTerrain | null;
  name?: string;
  onChange: (next: { kind: MapGlyphKind; terrain: MapTerrain | null; name?: string }) => void;
  heading?: string;
};

export function MapNodeAppearance({ kind, terrain, name = '', onChange, heading = '표시 형태' }: MapNodeAppearanceProps) {
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
            onClick={() => onChange({ kind: option, terrain, name })}
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
            onClick={() => onChange({ kind, terrain: option, name })}
          >
            <MapGlyph kind={kind} terrain={option} size={16} />
            <span>{MAP_TERRAIN_LABELS[option]}</span>
          </button>
        ))}
      </div>
      {kind === 'City' && (
        <label className="map-node-appearance__name">
          <span>도시 이름</span>
          <input
            type="text"
            value={name}
            placeholder="도시 이름을 적으세요"
            autoComplete="off"
            onChange={event => onChange({ kind, terrain, name: event.target.value })}
          />
        </label>
      )}
    </div>
  );
}
