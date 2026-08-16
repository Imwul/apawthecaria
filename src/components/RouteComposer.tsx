import { MapGlyph, MAP_GLYPH_KINDS, MAP_TERRAINS, type MapGlyphKind, type MapTerrain } from '../map/mapGlyphs';
import {
  evaluateRouteDraft,
  lastRouteStop,
  routeDestination,
  type RouteDraft,
  type RouteEdgeKind,
  type RouteStop
} from '../map/routeComposer';

type RouteComposerProps = {
  draft: RouteDraft;
  speed: number;
  carry: number;
  weight: number;
  waterwaySpan: number;
  canStopInLoch: boolean;
  protectsFromSoaking: boolean;
  soakableItemNames: string[];
  canTravel: boolean;
  travelBlockedReason?: string | null;
  onChangeStop: (index: number, patch: Partial<RouteStop>) => void;
  onChangeEdge: (index: number, kind: RouteEdgeKind) => void;
  onRemoveStop: (index: number) => void;
  onClear: () => void;
  onTravel: () => void;
};

const reasonText = (reason: ReturnType<typeof evaluateRouteDraft>['reason'], speed: number, cost: number): string => {
  if (reason === 'incomplete') return '지도를 눌러 들르는 자리를 이으세요. 사이길도 직접 고릅니다.';
  if (reason === 'legal') return `이동 비용 ${cost}이 속도 ${speed}과 같습니다.`;
  if (reason === 'too-close') return `이동 비용 ${cost}은 속도 ${speed}보다 가깝습니다. 자리를 더 잇거나 수로 토글을 확인하세요.`;
  if (reason === 'too-far') return `이동 비용 ${cost}이 속도 ${speed}보다 멉니다.`;
  return '도구 없이 호수·강 야생에서 이동을 끝낼 수 없습니다.';
};

const polar = (index: number, count: number, radius: number) => {
  const angle = -Math.PI / 2 + (count === 0 ? 0 : (index * 2 * Math.PI) / count);
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle)
  };
};

export function RouteComposer({
  draft,
  speed,
  carry,
  weight,
  waterwaySpan,
  canStopInLoch,
  protectsFromSoaking,
  soakableItemNames,
  canTravel,
  travelBlockedReason,
  onChangeStop,
  onChangeEdge,
  onRemoveStop,
  onClear,
  onTravel
}: RouteComposerProps) {
  const origin = draft.stops[0] || null;
  const destination = routeDestination(draft);
  const evaluation = evaluateRouteDraft({
    draft,
    speed,
    carry,
    weight,
    waterwaySpan,
    canStopInLoch,
    protectsFromSoaking,
    soakableItemIds: soakableItemNames,
    mustUseFullSpeed: true
  });
  const count = draft.stops.length;
  const glyphSize = count > 16 ? 14 : count > 10 ? 16 : 20;
  const travelReady = canTravel && evaluation.reason === 'legal' && Boolean(destination);

  return (
    <section className="route-composer" aria-label="경로 짜기">
      <header className="route-composer__header">
        <div className="route-composer__endpoint">
          <span>출발지</span>
          {origin ? (
            <>
              <MapGlyph kind={origin.kind} terrain={origin.terrain} size={28} />
              <strong>{origin.name}</strong>
              <em>{origin.kind === 'Clinic' ? '약제소' : origin.kind === 'City' ? '도시' : origin.kind === 'Settlement' ? '정착지' : origin.kind === 'Ruin' ? '티탄 유적' : origin.kind === 'Barrow' ? '거수 고분' : '야생'}{origin.terrain ? ` · ${origin.terrain === 'Bog' ? '늪지' : origin.terrain === 'Forest' ? '숲' : origin.terrain === 'Loch' ? '호수' : origin.terrain === 'Meadow' ? '초원' : '산맥'}` : ''}</em>
            </>
          ) : (
            <strong>지도를 눌러 지금 있는 곳을 찍으세요</strong>
          )}
        </div>
        <div className="route-composer__endpoint">
          <span>도착지</span>
          {destination ? (
            <>
              <MapGlyph kind={destination.kind} terrain={destination.terrain} size={28} />
              <strong>{destination.name}</strong>
              <em>{destination.kind === 'Clinic' ? '약제소' : destination.kind === 'City' ? '도시' : destination.kind === 'Settlement' ? '정착지' : destination.kind === 'Ruin' ? '티탄 유적' : destination.kind === 'Barrow' ? '거수 고분' : '야생'}{destination.terrain ? ` · ${destination.terrain === 'Bog' ? '늪지' : destination.terrain === 'Forest' ? '숲' : destination.terrain === 'Loch' ? '호수' : destination.terrain === 'Meadow' ? '초원' : '산맥'}` : ''}</em>
            </>
          ) : (
            <strong>아직 없음</strong>
          )}
        </div>
      </header>

      <div className="route-composer__ring" aria-hidden={count === 0}>
        {count === 0 ? (
          <p className="route-composer__empty">왼쪽 지도에서 노드를 눌러 경로를 잇습니다. 빈 자리는 ⌘+클릭으로 표시할 수 있습니다.</p>
        ) : (
          <svg viewBox="0 0 100 100" className="route-composer__svg">
            {draft.edgeKinds.map((kind, index) => {
              const from = polar(index, count, 36);
              const to = polar(index + 1, count, 36);
              return (
                <path
                  key={`edge-${index}`}
                  className={kind === 'waterway' ? 'route-composer__arc route-composer__arc--water' : 'route-composer__arc'}
                  d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                />
              );
            })}
            {draft.stops.map((row, index) => {
              const point = polar(index, count, 36);
              return (
                <foreignObject
                  key={row.id + index}
                  x={point.x - 6}
                  y={point.y - 6}
                  width="12"
                  height="12"
                >
                  <div className="route-composer__node">
                    <MapGlyph kind={row.kind} terrain={row.terrain} size={glyphSize} />
                  </div>
                </foreignObject>
              );
            })}
            {draft.edgeKinds.map((kind, index) => {
              const from = polar(index, count, 36);
              const to = polar(index + 1, count, 36);
              const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
              return (
                <foreignObject
                  key={`toggle-${index}`}
                  x={mid.x - 9}
                  y={mid.y - 5}
                  width="18"
                  height="10"
                >
                  <button
                    type="button"
                    className={`route-composer__toggle${kind === 'waterway' ? ' is-water' : ''}`}
                    onClick={() => onChangeEdge(index, kind === 'waterway' ? 'path' : 'waterway')}
                  >
                    {kind === 'waterway' ? '수로' : '육로'}
                  </button>
                </foreignObject>
              );
            })}
          </svg>
        )}
      </div>

      {count > 0 && (
        <ol className="route-composer__list">
          {draft.stops.map((row, index) => (
            <li key={`${row.id}:${index}`}>
              <span className="route-composer__index">{index + 1}</span>
              <MapGlyph kind={row.kind} terrain={row.terrain} size={18} />
              <select
                aria-label={`${row.name} 형태`}
                value={row.kind}
                onChange={event => onChangeStop(index, { kind: event.target.value as MapGlyphKind, hasClinic: event.target.value === 'Clinic' })}
              >
                {MAP_GLYPH_KINDS.map(kind => (
                  <option key={kind} value={kind}>{kind === 'City' ? '도시' : kind === 'Settlement' ? '정착지' : kind === 'Wilds' ? '야생' : kind === 'Ruin' ? '티탄 유적' : kind === 'Barrow' ? '거수 고분' : '약제소'}</option>
                ))}
              </select>
              {row.kind === 'City' && (
                <input
                  type="text"
                  aria-label="도시 이름"
                  value={row.name}
                  placeholder="도시 이름"
                  autoComplete="off"
                  onChange={event => onChangeStop(index, { name: event.target.value })}
                />
              )}
              <select
                aria-label={`${row.name} 지형색`}
                value={row.terrain || ''}
                onChange={event => onChangeStop(index, { terrain: (event.target.value || null) as MapTerrain | null })}
              >
                <option value="">색 미정</option>
                {MAP_TERRAINS.map(terrain => (
                  <option key={terrain} value={terrain}>{terrain === 'Bog' ? '늪지' : terrain === 'Forest' ? '숲' : terrain === 'Loch' ? '호수' : terrain === 'Meadow' ? '초원' : '산맥'}</option>
                ))}
              </select>
              {index > 0 && (
                <button type="button" onClick={() => onRemoveStop(index)} aria-label={`${row.name} 빼기`}>빼기</button>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="route-composer__summary">
        <p>
          {evaluation.pathCount}경로 · 육로 {evaluation.landCount} · 수로 {evaluation.waterwayCount} · 이동 비용 {evaluation.movementCost} / 속도 {evaluation.effectiveSpeed}
          {evaluation.overEncumbered ? ' · 과적이라 1경로만 갑니다' : ''}
          {waterwaySpan > 1 ? ` · 연결된 수로 ${waterwaySpan}개가 1경로` : ''}
        </p>
        <p>{reasonText(evaluation.reason, evaluation.effectiveSpeed, evaluation.movementCost)}</p>
        {evaluation.usesWaterway && (
          <p className="route-composer__soak">
            {protectsFromSoaking
              ? '방수 도구가 있어 소지품이 젖지 않습니다.'
              : evaluation.soakedItemIds.length
                ? `수로를 헤엄치면 방수되지 않은 약재와 물품이 젖어 버려집니다: ${soakableItemNames.join(', ')}`
                : '수로를 헤엄치면 방수되지 않은 약재와 물품이 젖어 버려집니다.'}
          </p>
        )}
        {lastRouteStop(draft) && count === 1 && (
          <p>사이길은 지도에서 다음에 들를 자리를 눌러 고릅니다.</p>
        )}
      </div>

      <div className="route-composer__actions">
        <button type="button" onClick={onClear} disabled={count <= 1}>사이길 비우기</button>
        <button
          type="button"
          className="route-composer__go"
          onClick={onTravel}
          disabled={!travelReady}
        >
          {travelReady ? '이 경로로 이동' : (travelBlockedReason || '경로를 이은 뒤 이동합니다')}
        </button>
      </div>
    </section>
  );
}
