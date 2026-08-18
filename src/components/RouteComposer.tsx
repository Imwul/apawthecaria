import { useState } from 'react';
import { MapGlyph, MAP_GLYPH_KINDS, MAP_TERRAINS, glyphUsesTerrain, type MapGlyphKind, type MapTerrain } from '../map/mapGlyphs';
import {
  cycleRouteEdgeKind,
  evaluateRouteDraft,
  lastRouteStop,
  routeDestination,
  routeEdgeLabel,
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
  return '호수·강 야생에서 멈추려면 자작나무 보트(Bark Coracle)나 밀폐식 마차(Sealed Carriage)가 필요합니다. 방수 가방(Waxed Satchel)은 젖음만 막습니다.';
};

const polar = (index: number, count: number, radius: number) => {
  if (count <= 0) return { x: 50, y: 50 };
  const angle = -Math.PI / 2 + (count === 0 ? 0 : (index * 2 * Math.PI) / count);
  const halfWidth = radius * 1.08;
  const halfHeight = Math.max(10, radius * 0.34);
  const cornerRadius = Math.max(4, radius * 0.14);
  const straightTop = Math.max(2, (2 * halfWidth) - (2 * cornerRadius));
  const straightBottom = Math.max(2, (2 * halfHeight) - (2 * cornerRadius));
  const rightArc = Math.PI * cornerRadius;
  const totalPerimeter = 2 * straightTop + 2 * straightBottom + 2 * rightArc;
  const offset = ((index % count + count) % count) / count * totalPerimeter;
  const cx = 50;
  const cy = 50;

  if (offset < straightTop) {
    return {
      x: cx - halfWidth + cornerRadius + offset,
      y: cy - halfHeight
    };
  }

  if (offset < straightTop + rightArc) {
    const arcOffset = offset - straightTop;
    const theta = -Math.PI / 2 + arcOffset / cornerRadius;
    const rx = cx + halfWidth - cornerRadius;
    return {
      x: rx + cornerRadius * Math.cos(theta),
      y: cy + cornerRadius * Math.sin(theta)
    };
  }

  if (offset < 2 * straightTop + rightArc) {
    const local = offset - (straightTop + rightArc);
    return {
      x: cx + halfWidth - cornerRadius - local,
      y: cy + halfHeight
    };
  }

  const leftArcOffset = offset - (2 * straightTop + rightArc);
  const theta = Math.PI / 2 + leftArcOffset / cornerRadius;
  const lx = cx - halfWidth + cornerRadius;
  return {
    x: lx + cornerRadius * Math.cos(theta),
    y: cy + cornerRadius * Math.sin(theta)
  };
};

const insetSegmentPoint = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  inset: number
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (!len || !inset) return from;
  const safeInset = Math.min(0.45 * len, inset);
  if (safeInset <= 0) return from;
  return {
    x: from.x + (dx / len) * safeInset,
    y: from.y + (dy / len) * safeInset
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
  const [nameOpen, setNameOpen] = useState<Record<string, boolean>>({});

  return (
    <section className="route-composer" aria-label="경로 짜기">
      <header className="route-composer__header">
        <div className="route-composer__endpoint">
          <span>출발지</span>
          {origin ? (
            <>
              <MapGlyph kind={origin.kind} terrain={origin.terrain} size={28} />
              <strong>{origin.name.trim() || '이름 없음'}</strong>
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
              <strong>{destination.name.trim() || '이름 없음'}</strong>
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
              const inset = Math.max(2, glyphSize * 0.2);
              const insetFrom = insetSegmentPoint(from, to, inset);
              const insetTo = insetSegmentPoint(to, from, inset);
              const nextKindHint = routeEdgeLabel(cycleRouteEdgeKind(kind, draft.stops[index], draft.stops[index + 1]));
              return (
                <path
                  key={`edge-${index}`}
                  className={kind === 'path' ? 'route-composer__arc' : `route-composer__arc route-composer__arc--${kind}`}
                  d={`M ${insetFrom.x} ${insetFrom.y} L ${insetTo.x} ${insetTo.y}`}
                  role="button"
                  aria-label={`경로 ${index + 1}의 타입을 바꾸기 (현재 ${routeEdgeLabel(kind)})`}
                  tabIndex={0}
                  onClick={() => onChangeEdge(index, cycleRouteEdgeKind(kind, draft.stops[index], draft.stops[index + 1]))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onChangeEdge(index, cycleRouteEdgeKind(kind, draft.stops[index], draft.stops[index + 1]));
                    }
                  }}
                />
              );
            })}
            {draft.stops.map((row, index) => {
              const point = polar(index, count, 36);
              const nodeFrame = Math.max(18, glyphSize + 8);
              return (
                <foreignObject
                  key={row.id + index}
                  x={point.x - nodeFrame / 2}
                  y={point.y - nodeFrame / 2}
                  width={nodeFrame}
                  height={nodeFrame}
                >
                  <div className="route-composer__node">
                    <MapGlyph kind={row.kind} terrain={row.terrain} size={glyphSize} />
                  </div>
                </foreignObject>
              );
            })}
          </svg>
        )}
      </div>
      {count > 1 && (
        <p className="route-composer__edge-hint">
          경로 타입은 각 구간 선을 클릭하거나 Enter/Space로 순환해서 변경할 수 있습니다. (현재 타입 → 다음 타입)
        </p>
      )}

      {count > 0 && (
        <ol className="route-composer__list">
          {draft.stops.map((row, index) => (
            <li key={`${row.id}:${index}`}>
              <span className="route-composer__index">{index + 1}</span>
              <MapGlyph kind={row.kind} terrain={row.terrain} size={18} />
              <select
                aria-label={`${row.name} 형태`}
                value={row.kind}
                onChange={event => {
                  const kind = event.target.value as MapGlyphKind;
                  onChangeStop(index, {
                    kind,
                    hasClinic: kind === 'Clinic',
                    terrain: glyphUsesTerrain(kind) ? row.terrain : null
                  });
                }}
              >
                {MAP_GLYPH_KINDS.map(kind => (
                  <option key={kind} value={kind}>{kind === 'City' ? '도시' : kind === 'Settlement' ? '정착지' : kind === 'Wilds' ? '야생' : kind === 'Ruin' ? '티탄 유적' : kind === 'Barrow' ? '거수 고분' : '약제소'}</option>
                ))}
              </select>
              {row.name.trim() || nameOpen[`${row.id}:${index}`] ? (
                <>
                  <input
                    type="text"
                    aria-label="이름"
                    value={row.name}
                    placeholder="이름"
                    autoComplete="off"
                    onChange={event => onChangeStop(index, { name: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNameOpen(current => ({ ...current, [`${row.id}:${index}`]: false }));
                      onChangeStop(index, { name: '' });
                    }}
                  >
                    이름 없음
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setNameOpen(current => ({ ...current, [`${row.id}:${index}`]: true }))}>
                  이름 추가
                </button>
              )}
              {glyphUsesTerrain(row.kind) && (
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
              )}
              {index > 0 && (
                <button type="button" onClick={() => onRemoveStop(index)} aria-label={`${row.name} 빼기`}>빼기</button>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="route-composer__summary">
        <p>
          {evaluation.pathCount}경로 · 육로 {evaluation.landCount} · 강 {evaluation.riverCount} · 수로 {evaluation.waterwayCount} · 이동 비용 {evaluation.movementCost} / 속도 {evaluation.effectiveSpeed}
          {evaluation.overEncumbered ? ' · 과적이라 1경로만 갑니다' : ''}
          {waterwaySpan > 1 ? ` · 연결된 수로 ${waterwaySpan}개가 1경로` : ''}
        </p>
        <p>{reasonText(evaluation.reason, evaluation.effectiveSpeed, evaluation.movementCost)}</p>
        {evaluation.usesWaterTravel && (
          <p className="route-composer__soak">
            {protectsFromSoaking
              ? '방수 도구가 있어 소지품이 젖지 않습니다.'
              : evaluation.soakedItemIds.length
                ? `강이나 수로를 헤엄치면 방수되지 않은 약재와 물품이 젖어 버려집니다: ${soakableItemNames.join(', ')}`
                : '강이나 수로를 헤엄치면 방수되지 않은 약재와 물품이 젖어 버려집니다.'}
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
