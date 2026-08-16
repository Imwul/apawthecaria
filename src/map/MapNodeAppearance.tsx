import { useState } from 'react';
import { MapGlyph, MAP_GLYPH_KIND_LABELS, MAP_GLYPH_KINDS, MAP_TERRAIN_LABELS, MAP_TERRAINS, glyphUsesTerrain, type MapGlyphKind, type MapTerrain } from './mapGlyphs';

type MapNodeAppearanceProps = {
  kind: MapGlyphKind;
  terrain: MapTerrain | null;
  name?: string;
  onChange: (next: { kind: MapGlyphKind; terrain: MapTerrain | null; name?: string }) => void;
  heading?: string;
};

export function MapNodeAppearance({ kind, terrain, name = '', onChange, heading = '표시 형태' }: MapNodeAppearanceProps) {
  const [addingName, setAddingName] = useState(Boolean(name.trim()));
  const showName = addingName || Boolean(name.trim());
  const showTerrain = glyphUsesTerrain(kind);
  const emit = (next: { kind: MapGlyphKind; terrain: MapTerrain | null; name?: string }) => {
    onChange({
      ...next,
      terrain: glyphUsesTerrain(next.kind) ? next.terrain : null
    });
  };

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
            onClick={() => emit({ kind: option, terrain, name })}
          >
            <MapGlyph kind={option} terrain={option === 'Ruin' ? null : terrain} size={20} />
            <span>{MAP_GLYPH_KIND_LABELS[option]}</span>
          </button>
        ))}
      </div>
      {showTerrain && (
        <div className="map-node-appearance__row" role="group" aria-label="지형색">
          {MAP_TERRAINS.map(option => (
            <button
              key={option}
              type="button"
              className={`map-node-appearance__swatch${terrain === option ? ' is-on' : ''}`}
              aria-pressed={terrain === option}
              onClick={() => emit({ kind, terrain: option, name })}
            >
              <MapGlyph kind={kind} terrain={option} size={16} />
              <span>{MAP_TERRAIN_LABELS[option]}</span>
            </button>
          ))}
        </div>
      )}
      {showName ? (
        <div className="map-node-appearance__name-row">
          <label className="map-node-appearance__name">
            <span>이름</span>
            <input
              type="text"
              value={name}
              placeholder="이름을 적으세요"
              autoComplete="off"
              onChange={event => emit({ kind, terrain, name: event.target.value })}
            />
          </label>
          <button
            type="button"
            className="map-node-appearance__add-name"
            onClick={() => {
              setAddingName(false);
              emit({ kind, terrain, name: '' });
            }}
          >
            이름 없음
          </button>
        </div>
      ) : (
        <button type="button" className="map-node-appearance__add-name" onClick={() => setAddingName(true)}>
          이름 추가
        </button>
      )}
    </div>
  );
}
