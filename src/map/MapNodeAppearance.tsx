import { useState } from 'react';
import { MapGlyph } from './mapGlyphs';
import { MAP_GLYPH_KIND_LABELS, MAP_GLYPH_KINDS, MAP_TERRAIN_LABELS, MAP_TERRAINS, glyphUsesTerrain, type MapGlyphKind, type MapTerrain } from './mapGlyphTypes';

type MapNodeAppearanceProps = {
  kind: MapGlyphKind;
  terrain: MapTerrain | null;
  /**
   * A few printed places (currently Glasswall) span more than one terrain.
   * The singular `terrain` remains the primary colour used by the glyph;
   * this list records the complete manual map annotation.
   */
  terrainOptions?: readonly MapTerrain[];
  multipleTerrains?: boolean;
  name?: string;
  onChange: (next: { kind: MapGlyphKind; terrain: MapTerrain | null; terrainOptions?: MapTerrain[]; name?: string }) => void;
  heading?: string;
};

export function MapNodeAppearance({
  kind,
  terrain,
  terrainOptions,
  multipleTerrains = false,
  name = '',
  onChange,
  heading = '표시 형태'
}: MapNodeAppearanceProps) {
  const [addingName, setAddingName] = useState(Boolean(name.trim()));
  const [draftName, setDraftName] = useState(name);
  const [lastCommittedName, setLastCommittedName] = useState(name);
  if (name !== lastCommittedName) {
    setLastCommittedName(name);
    setDraftName(name);
  }
  const showName = addingName || Boolean(name.trim());
  const showTerrain = glyphUsesTerrain(kind);
  const selectedTerrains = new Set<MapTerrain>(
    (multipleTerrains ? (terrainOptions?.length ? terrainOptions : terrain ? [terrain] : []) : terrain ? [terrain] : [])
      .filter((value): value is MapTerrain => MAP_TERRAINS.includes(value))
  );
  const emit = (next: { kind: MapGlyphKind; terrain: MapTerrain | null; terrainOptions?: MapTerrain[]; name?: string }) => {
    onChange({
      ...next,
      terrain: glyphUsesTerrain(next.kind) ? next.terrain : null,
      terrainOptions: multipleTerrains
        ? Array.from(new Set((next.terrainOptions || []).filter((value): value is MapTerrain => MAP_TERRAINS.includes(value))))
        : undefined
    });
  };
  const commitName = (nextName = draftName) => {
    if (nextName === name) return;
    emit({ kind, terrain, name: nextName });
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
            onClick={() => emit({ kind: option, terrain, name: draftName })}
          >
            <MapGlyph kind={option} terrain={option === 'Ruin' ? null : terrain} size={20} />
            <span>{MAP_GLYPH_KIND_LABELS[option]}</span>
          </button>
        ))}
      </div>
      {showTerrain && (
        <div className="map-node-appearance__terrain-group" role={multipleTerrains ? 'group' : undefined} aria-label={multipleTerrains ? '지형 여러 개 선택' : '지형색'}>
          {multipleTerrains && <p className="map-node-appearance__terrain-help">이 위치는 여러 지형에 걸칩니다. 해당되는 지형을 모두 표시하세요.</p>}
          <div className="map-node-appearance__row" role="group" aria-label="지형색">
          {MAP_TERRAINS.map(option => (
            <button
              key={option}
              type="button"
              className={`map-node-appearance__swatch${selectedTerrains.has(option) ? ' is-on' : ''}`}
              aria-pressed={selectedTerrains.has(option)}
              onClick={() => {
                if (!multipleTerrains) {
                  emit({ kind, terrain: option, name: draftName });
                  return;
                }
                const nextTerrains = new Set(selectedTerrains);
                if (nextTerrains.has(option)) nextTerrains.delete(option);
                else nextTerrains.add(option);
                if (nextTerrains.size === 0) return;
                const ordered = MAP_TERRAINS.filter(value => nextTerrains.has(value));
                emit({ kind, terrain: terrain && nextTerrains.has(terrain) ? terrain : ordered[0], terrainOptions: ordered, name: draftName });
              }}
            >
              <MapGlyph kind={kind} terrain={option} size={16} />
              <span>{MAP_TERRAIN_LABELS[option]}</span>
            </button>
          ))}
          </div>
        </div>
      )}
      {showName ? (
        <div className="map-node-appearance__name-row">
          <label className="map-node-appearance__name">
            <span>이름</span>
            <input
              type="text"
              value={draftName}
              placeholder="이름을 적으세요"
              autoComplete="off"
              onChange={event => setDraftName(event.target.value)}
              onBlur={event => commitName(event.currentTarget.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) event.currentTarget.blur();
              }}
            />
          </label>
          <button
            type="button"
            className="map-node-appearance__add-name"
            onClick={() => {
              setAddingName(false);
              setDraftName('');
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
