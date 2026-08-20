import { MapGlyph } from '../map/mapGlyphs';
import { MAP_GLYPH_KINDS, MAP_TERRAINS, glyphUsesTerrain, type MapGlyphKind, type MapTerrain } from '../map/mapGlyphTypes';
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
  movementMode?: 'move' | 'soar';
  travelBlockedReason?: string | null;
  onChangeStop: (index: number, patch: Partial<RouteStop>) => void;
  onChangeEdge: (index: number, kind: RouteEdgeKind) => void;
  onRemoveStop: (index: number) => void;
  onMoveStop?: (fromIndex: number, toIndex: number) => void;
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
  movementMode = 'move',
  travelBlockedReason,
  onChangeStop,
  onChangeEdge,
  onRemoveStop,
  onMoveStop,
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
  const travelReady = canTravel
    && Boolean(destination)
    && (movementMode === 'soar' || evaluation.reason === 'legal');

  return (
    <section className="route-composer" aria-label="경로 짜기">
      <header className="route-composer__header">
        <div className="route-composer__endpoint">
          <span>출발지</span>
          {origin ? (
            <div className="route-composer__endpoint-info">
              <MapGlyph kind={origin.kind} terrain={origin.terrain} size={22} />
              <strong>{origin.name.trim() || '이름 없음'}</strong>
              <em>{origin.kind === 'Clinic' ? '약제소' : origin.kind === 'City' ? '도시' : origin.kind === 'Settlement' ? '정착지' : origin.kind === 'Ruin' ? '티탄 유적' : origin.kind === 'Barrow' ? '거수 고분' : '야생'}{origin.terrain ? ` · ${origin.terrain === 'Bog' ? '늪지' : origin.terrain === 'Forest' ? '숲' : origin.terrain === 'Loch' ? '호수' : origin.terrain === 'Meadow' ? '초원' : '산맥'}` : ''}</em>
            </div>
          ) : (
            <strong>지도를 눌러 지금 있는 곳을 찍으세요</strong>
          )}
        </div>
        <div className="route-composer__endpoint">
          <span>도착지</span>
          {destination ? (
            <div className="route-composer__endpoint-info">
              <MapGlyph kind={destination.kind} terrain={destination.terrain} size={22} />
              <strong>{destination.name.trim() || '이름 없음'}</strong>
              <em>{destination.kind === 'Clinic' ? '약제소' : destination.kind === 'City' ? '도시' : destination.kind === 'Settlement' ? '정착지' : destination.kind === 'Ruin' ? '티탄 유적' : destination.kind === 'Barrow' ? '거수 고분' : '야생'}{destination.terrain ? ` · ${destination.terrain === 'Bog' ? '늪지' : destination.terrain === 'Forest' ? '숲' : destination.terrain === 'Loch' ? '호수' : destination.terrain === 'Meadow' ? '초원' : '산맥'}` : ''}</em>
            </div>
          ) : (
            <strong>아직 없음</strong>
          )}
        </div>
      </header>

      {/* Track of horizontal cards and interactive connector lines */}
      <div className="route-composer__track-container">
        {count === 0 ? (
          <p className="route-composer__empty">왼쪽 지도에서 위치를 클릭하면 경로에 노드가 가로 방향으로 추가됩니다. 빈 자리는 ⌘+클릭으로 표시합니다.</p>
        ) : (
          <div className="route-composer__track" role="region" aria-label="가로 경로 목록">
            {draft.stops.map((row, index) => {
              const edgeKind = draft.edgeKinds[index] || 'path';
              const nextStop = draft.stops[index + 1];
              return (
                <div key={`${row.id}:${index}`} className="route-composer__step-unit">
                  {/* Rounded horizontal rectangular node card */}
                  <div className="route-composer__card">
                    <div className="route-card__header">
                      <span className="route-card__index">{index === 0 ? '출발' : index + 1}</span>
                      <MapGlyph kind={row.kind} terrain={row.terrain} size={18} />
                      <input
                        type="text"
                        className="route-card__name-input"
                        aria-label={`${index + 1}번 노드 이름`}
                        value={row.name}
                        placeholder="이름 없음"
                        autoComplete="off"
                        onChange={event => onChangeStop(index, { name: event.target.value })}
                      />
                      <div className="route-card__actions">
                        <button
                          type="button"
                          className="route-card__move-btn"
                          disabled={index <= 0}
                          onClick={() => onMoveStop?.(index, index - 1)}
                          aria-label="왼쪽으로 이동"
                          title="왼쪽으로 이동"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          className="route-card__move-btn"
                          disabled={index === 0 || index >= count - 1}
                          onClick={() => onMoveStop?.(index, index + 1)}
                          aria-label="오른쪽으로 이동"
                          title="오른쪽으로 이동"
                        >
                          ▶
                        </button>
                        {index > 0 && (
                          <button
                            type="button"
                            className="route-card__remove-btn"
                            onClick={() => onRemoveStop(index)}
                            aria-label={`${row.name || '노드'} 삭제`}
                          >
                            빼기
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="route-card__controls">
                      <select
                        className="route-card__select"
                        aria-label={`${row.name || '노드'} 형태`}
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
                          <option key={kind} value={kind}>
                            {kind === 'City' ? '도시' : kind === 'Settlement' ? '정착지' : kind === 'Wilds' ? '야생' : kind === 'Ruin' ? '티탄 유적' : kind === 'Barrow' ? '거수 고분' : '약제소'}
                          </option>
                        ))}
                      </select>
                      {glyphUsesTerrain(row.kind) && (
                        <select
                          className="route-card__select"
                          aria-label={`${row.name || '노드'} 지형색`}
                          value={row.terrain || ''}
                          onChange={event => onChangeStop(index, { terrain: (event.target.value || null) as MapTerrain | null })}
                        >
                          <option value="">색 미정</option>
                          {MAP_TERRAINS.map(terrain => (
                            <option key={terrain} value={terrain}>
                              {terrain === 'Bog' ? '늪지' : terrain === 'Forest' ? '숲' : terrain === 'Loch' ? '호수' : terrain === 'Meadow' ? '초원' : '산맥'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Interactive connector line between cards */}
                  {index < count - 1 && (
                    <div className="route-connector" role="group" aria-label={`구간 ${index + 1} 연결선`}>
                      <div className={`route-connector__line route-connector__line--${edgeKind}`} />
                      <button
                        type="button"
                        className={`route-connector__btn route-connector__btn--${edgeKind}`}
                        onClick={() => onChangeEdge(index, cycleRouteEdgeKind(edgeKind, row, nextStop))}
                        aria-label={`구간 ${index + 1} 연결선 클릭하여 타입 변경 (현재: ${routeEdgeLabel(edgeKind)})`}
                        title={`클릭하여 육로/수로/강 전환 (현재: ${routeEdgeLabel(edgeKind)})`}
                      >
                        <span className="route-connector__icon">
                          {edgeKind === 'waterway' ? '⛵' : edgeKind === 'river' ? '🌊' : '🌲'}
                        </span>
                        <span className="route-connector__label">{routeEdgeLabel(edgeKind)}</span>
                      </button>
                      <div className={`route-connector__line route-connector__line--${edgeKind}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {count > 1 && (
        <p className="route-composer__edge-hint">
          연결선 버튼을 클릭하여 육로 ↔ 강/수로를 전환하세요. (◀ ▶ 버튼으로 순서를 바꿉니다)
        </p>
      )}

      <div className="route-composer__summary">
        {movementMode === 'soar' ? (
          <p>활공에서는 출발지와 마지막 노드만 사용합니다. 중간 노드와 연결 유형은 Move로 되돌릴 때 그대로 남습니다.</p>
        ) : (
          <>
            <p>
              {evaluation.pathCount}경로 · 육로 {evaluation.landCount} · 강 {evaluation.riverCount} · 수로 {evaluation.waterwayCount} · 이동 비용 {evaluation.movementCost} / 속도 {evaluation.effectiveSpeed}
              {evaluation.overEncumbered ? ' · 과적이라 1경로만 갑니다' : ''}
              {waterwaySpan > 1 ? ` · 연결된 수로 ${waterwaySpan}개가 1경로` : ''}
            </p>
            <p>{reasonText(evaluation.reason, evaluation.effectiveSpeed, evaluation.movementCost)}</p>
          </>
        )}
        {evaluation.overEncumbered && (
          <div style={{ padding: '0.4rem 0.6rem', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '6px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.3rem' }}>
            🎒 과적 상태 (무게 {weight}/{carry}): 일일 이동 속도가 1경로로 제한됩니다. (룰북 p.22)
          </div>
        )}
        {evaluation.reason === 'loch-locked' && (
          <div style={{ padding: '0.4rem 0.6rem', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '6px', color: '#92400e', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.3rem' }}>
            ⛵ 호수/강 정차 제한 (룰북 p.24): 호수(Loch) 야생에서 멈추려면 자작나무 보트(Bark Coracle)나 밀폐식 마차(Sealed Carriage)가 필요합니다.
          </div>
        )}
        {evaluation.usesWaterTravel && (
          <p className="route-composer__soak">
            {protectsFromSoaking
              ? '✨ 방수 도구 또는 안전한 수상 이동 능력이 있어 소지품이 젖지 않습니다.'
              : evaluation.soakedItemIds.length
                ? `⚠️ 주의: 방수 장비 없이 물길을 건너면 물품이 젖어 파손됩니다 (${soakableItemNames.join(', ')})`
                : '⚠️ 주의: 방수 장비 없이 물길을 건너면 방수되지 않은 약재와 물품이 젖어 버려집니다.'}
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
          {travelReady
            ? (movementMode === 'soar' ? '마지막 위치로 활공' : '이 경로로 이동')
            : (travelBlockedReason || '경로를 이은 뒤 이동합니다')}
        </button>
      </div>
    </section>
  );
}
