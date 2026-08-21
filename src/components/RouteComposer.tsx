import { useEffect, useMemo, useRef, useState } from 'react';
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
  availableStops?: RouteStop[];
  journeyTarget?: RouteStop | null;
  confirmedSegmentCount?: number;
  journeyMinimumDistance?: number | null;
  seasonLabel?: string;
  daysRemaining?: number | null;
  onAddStop?: (stop: RouteStop) => void;
  onChangeStop: (index: number, patch: Partial<RouteStop>) => void;
  onChangeEdge: (index: number, kind: RouteEdgeKind) => void;
  onRemoveStop: (index: number) => void;
  onMoveStop?: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onTravel: () => void;
};

const reasonText = (reason: ReturnType<typeof evaluateRouteDraft>['reason'], speed: number, cost: number): string => {
  if (reason === 'incomplete') return `지도나 위치 검색에서 이번 Move가 지날 ${speed}개의 경로를 순서대로 고르세요.`;
  if (reason === 'legal') return `이동력 ${speed}을 모두 사용했습니다. 이 경로로 Move할 수 있습니다.`;
  if (reason === 'too-close') return `이동력 ${speed}을 모두 사용하려면 경로를 ${speed - cost}개 더 이으세요.`;
  if (reason === 'too-far') return `이동력보다 경로가 ${cost - speed}개 많습니다. 도착점을 앞당기거나 위치를 빼세요.`;
  return '호수·강 야생에서 멈추려면 자작나무 보트(Bark Coracle)나 밀폐식 마차(Sealed Carriage)가 필요합니다. 방수 가방(Waxed Satchel)은 젖음만 막습니다.';
};

const blockedActionText = (reason: ReturnType<typeof evaluateRouteDraft>['reason']): string => {
  if (reason === 'too-far') return '이동력에 맞게 경로를 줄이세요';
  if (reason === 'loch-locked') return '호수·강 정차 장비가 필요합니다';
  return '속도만큼 경로를 이으세요';
};

const stopKindLabel = (stop: RouteStop): string =>
  stop.kind === 'Clinic' ? '약제소' : stop.kind === 'City' ? '도시' : stop.kind === 'Settlement' ? '정착지' : stop.kind === 'Ruin' ? '티탄 유적' : stop.kind === 'Barrow' ? '거수 고분' : '야생';

const stopTerrainLabel = (stop: RouteStop): string =>
  stop.terrain === 'Bog' ? '늪지' : stop.terrain === 'Forest' ? '숲' : stop.terrain === 'Loch' ? '호수·강' : stop.terrain === 'Meadow' ? '초원' : stop.terrain === 'Mountain' ? '산맥' : '';

const stopMeta = (stop: RouteStop): string =>
  `${stopKindLabel(stop)}${stopTerrainLabel(stop) ? ` · ${stopTerrainLabel(stop)}` : ''}`;

const displayWeight = (value: number): string => Number.isInteger(value)
  ? String(value)
  : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

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
  availableStops = [],
  journeyTarget = null,
  confirmedSegmentCount = 0,
  journeyMinimumDistance = null,
  seasonLabel,
  daysRemaining = null,
  onAddStop,
  onChangeStop,
  onChangeEdge,
  onRemoveStop,
  onMoveStop,
  onClear,
  onTravel
}: RouteComposerProps) {
  const [placeQuery, setPlaceQuery] = useState('');
  const [compactView, setCompactView] = useState(true);
  const [routeFeedback, setRouteFeedback] = useState('');
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(draft.stops.length);
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
  const availableStopOptions = useMemo(() => {
    const nameCounts = new Map<string, number>();
    availableStops.forEach(stop => {
      const key = stop.name.trim().toLocaleLowerCase();
      nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
    });
    return availableStops.map(stop => ({
      stop,
      inputValue: (nameCounts.get(stop.name.trim().toLocaleLowerCase()) || 0) > 1
        ? `${stop.name} · ${stop.id}`
        : stop.name
    }));
  }, [availableStops]);
  const exactStopMatch = useMemo(() => {
    const query = placeQuery.trim().toLocaleLowerCase();
    if (!query) return null;
    return availableStopOptions.find(option =>
      option.inputValue.trim().toLocaleLowerCase() === query || option.stop.id.toLocaleLowerCase() === query
    )?.stop || null;
  }, [availableStopOptions, placeQuery]);
  const exactStopAlreadyAdded = Boolean(exactStopMatch && destination?.id === exactStopMatch.id);
  const targetIsMoveEnd = Boolean(journeyTarget && destination?.id === journeyTarget.id);
  const pinnedTarget = journeyTarget && !targetIsMoveEnd ? journeyTarget : null;
  const displayedCount = count + (pinnedTarget ? 1 : 0);

  useEffect(() => {
    const previousCount = previousCountRef.current;
    previousCountRef.current = count;
    if (count <= previousCount || !trackContainerRef.current) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    trackContainerRef.current.scrollTo({ left: trackContainerRef.current.scrollWidth, behavior });
  }, [count, displayedCount]);

  const addStop = (stop: RouteStop) => {
    onAddStop?.(stop);
    setPlaceQuery('');
    setRouteFeedback(`${stop.name || '위치'}을(를) 이번 Move 경로에 추가했습니다.`);
  };

  const removeStop = (index: number, stop: RouteStop) => {
    onRemoveStop(index);
    setRouteFeedback(`${stop.name || `${index + 1}번 위치`}을(를) 경로에서 뺐습니다.`);
  };

  const moveStop = (fromIndex: number, toIndex: number, stop: RouteStop) => {
    onMoveStop?.(fromIndex, toIndex);
    setRouteFeedback(`${stop.name || `${fromIndex + 1}번 위치`}을(를) ${toIndex + 1}번으로 옮겼습니다.`);
  };

  const scrollRoute = (direction: -1 | 1) => {
    const container = trackContainerRef.current;
    if (!container) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    container.scrollBy({ left: direction * Math.max(240, container.clientWidth * 0.72), behavior });
  };

  return (
    <section className="route-composer" aria-label="경로 짜기">
      <div className="route-composer__title-row">
        <div>
          <span className="route-composer__eyebrow">이번 MOVE</span>
          <h2>경로 짜기</h2>
        </div>
        <div className={`route-composer__readiness route-composer__readiness--${travelReady ? 'ready' : 'editing'}`} role="status" aria-live="polite">
          {movementMode === 'soar'
            ? (travelReady ? '활공 준비 완료' : destination ? '이동 전 확인 필요' : '착륙 위치를 고르세요')
            : evaluation.reason === 'legal' && canTravel
              ? 'Move 준비 완료'
              : travelBlockedReason
                ? '이동 전 확인 필요'
              : `경로 ${evaluation.movementCost}/${evaluation.effectiveSpeed}`}
        </div>
      </div>

      <div className="route-composer__conditions" aria-label="이번 이동 조건">
        <span>속도 <strong>{evaluation.effectiveSpeed}</strong></span>
        <span>짐 <strong>{displayWeight(weight)}/{displayWeight(carry)}</strong></span>
        {seasonLabel && <span>계절 <strong>{seasonLabel}</strong></span>}
        {daysRemaining !== null && <span>기한 <strong>{Math.max(0, daysRemaining)}일 남음</strong></span>}
      </div>

      <header className="route-composer__header">
        <div className="route-composer__endpoint">
          <span>현재 위치</span>
          {origin ? (
            <div className="route-composer__endpoint-info">
              <MapGlyph kind={origin.kind} terrain={origin.terrain} size={22} />
              <strong>{origin.name.trim() || '이름 없음'}</strong>
              <em>{stopMeta(origin)}</em>
            </div>
          ) : (
            <strong>지도를 눌러 지금 있는 곳을 찍으세요</strong>
          )}
        </div>
        <div className="route-composer__endpoint">
          <span>이번 Move 도착</span>
          {destination ? (
            <div className="route-composer__endpoint-info">
              <MapGlyph kind={destination.kind} terrain={destination.terrain} size={22} />
              <strong>{destination.name.trim() || '이름 없음'}</strong>
              <em>{stopMeta(destination)}</em>
            </div>
          ) : (
            <strong>아직 없음</strong>
          )}
        </div>
        <div className="route-composer__endpoint route-composer__endpoint--journey">
          <span>여정 목적지</span>
          {journeyTarget ? (
            <div className="route-composer__endpoint-info">
              <MapGlyph kind={journeyTarget.kind} terrain={journeyTarget.terrain} size={22} />
              <strong>{journeyTarget.name.trim() || '이름 없음'}</strong>
              <em>{targetIsMoveEnd ? '이번 Move에서 도착' : `${stopMeta(journeyTarget)} · 끝에 고정`}</em>
            </div>
          ) : (
            <strong>여정 설정에서 정하세요</strong>
          )}
        </div>
      </header>

      {onAddStop && availableStops.length > 0 && (
        <div className="route-composer__picker">
          <div className="route-composer__picker-copy">
            <strong>위치 추가</strong>
            <span>
              {movementMode === 'soar'
                ? '착륙할 지도 위치를 검색하세요. 중간 위치는 Move로 돌아갈 때 그대로 남습니다.'
                : '지도에서 다음 노드를 누르면 이번 Move 경로에 바로 들어갑니다. 여정 목적지는 항상 맨 뒤에 고정됩니다.'}
            </span>
          </div>
          <div className="route-composer__picker-controls">
            <input
              type="search"
              list="route-stop-options"
              value={placeQuery}
              onChange={event => setPlaceQuery(event.target.value)}
              placeholder="경유지 또는 Move 도착 검색"
              aria-label="경로에 추가할 위치 검색"
              autoComplete="off"
            />
            <datalist id="route-stop-options">
              {availableStopOptions.map(({ stop, inputValue }) => (
                <option key={stop.id} value={inputValue}>{stopMeta(stop)}</option>
              ))}
            </datalist>
            <button
              type="button"
              disabled={!exactStopMatch || exactStopAlreadyAdded}
              onClick={() => exactStopMatch && addStop(exactStopMatch)}
            >
              {exactStopAlreadyAdded ? '추가됨' : '경로에 추가'}
            </button>
          </div>
          {pinnedTarget && (
            <p className="route-composer__target-progress">
              <strong>{pinnedTarget.name}</strong>은(는) 여정 목적지로 잠겨 있습니다. 오늘 도착하려면 지도에서 목적지 노드를 직접 누르세요.
            </p>
          )}
        </div>
      )}

      {/* Track of horizontal cards and interactive connector lines */}
      <div className="route-composer__strip-heading">
        <div className="route-composer__strip-labels">
          <span>현재 위치 → 이번 Move 경로 → 고정 목적지</span>
        </div>
        <div className="route-composer__strip-actions">
          <button
            type="button"
            className="route-composer__density-toggle"
            aria-pressed={!compactView}
            onClick={() => setCompactView(current => !current)}
          >
            {compactView ? '세부 편집' : '간결 보기'}
          </button>
          {displayedCount > 2 && (
            <div className="route-composer__scroll-actions" aria-label="긴 경로 보기">
              <button type="button" onClick={() => scrollRoute(-1)} aria-label="이전 경로 보기">‹</button>
              <button type="button" onClick={() => scrollRoute(1)} aria-label="다음 경로 보기">›</button>
            </div>
          )}
        </div>
      </div>
      <div className="route-composer__track-clip">
        <div className="route-composer__track-container" ref={trackContainerRef} tabIndex={0} aria-label="선택 순서대로 이어진 경로. 좌우로 스크롤할 수 있습니다.">
        {count === 0 ? (
          <p className="route-composer__empty">현재 위치를 확인한 뒤 지도나 위치 검색에서 첫 node를 고르세요.</p>
        ) : (
          <div className={`route-composer__track${compactView ? ' route-composer__track--compact' : ''}`} role="region" aria-label="가로 경로 목록">
            {draft.stops.map((row, index) => {
              const edgeKind = draft.edgeKinds[index] || 'path';
              const nextStop = draft.stops[index + 1];
              const isLockedTarget = Boolean(index > 0 && journeyTarget?.id === row.id && index === count - 1);
              const roleLabel = index === 0 ? '출발' : isLockedTarget ? '여정 목적지' : index === count - 1 ? '오늘 도착' : `경유 ${index}`;
              return (
                <div key={`${row.id}:${index}`} className="route-composer__step-unit">
                  {/* Rounded horizontal rectangular node card */}
                  <div className={`route-composer__card${compactView ? ' route-composer__card--compact' : ''}${isLockedTarget ? ' route-composer__card--target' : ''}`}>
                    <div className="route-card__header">
                      <span className="route-card__index">{roleLabel}</span>
                      <MapGlyph kind={row.kind} terrain={row.terrain} size={18} />
                      <input
                        type="text"
                        className="route-card__name-input"
                        aria-label={`${index + 1}번 노드 이름`}
                        value={row.name}
                        title={row.name}
                        placeholder="이름 없음"
                        autoComplete="off"
                        readOnly={isLockedTarget}
                        onChange={event => onChangeStop(index, { name: event.target.value })}
                      />
                    </div>
                    {compactView || isLockedTarget ? (
                      <span className="route-card__meta" title={stopMeta(row)}>{stopMeta(row)}</span>
                    ) : (
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
                                {terrain === 'Bog' ? '늪지' : terrain === 'Forest' ? '숲' : terrain === 'Loch' ? '호수·강' : terrain === 'Meadow' ? '초원' : '산맥'}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                    {index === 0 ? (
                      <span className="route-card__fixed">현재 위치 · 순서 고정</span>
                    ) : isLockedTarget ? (
                      <div className="route-card__target-actions">
                        <span className="route-card__fixed">여정 목적지 · 맨 뒤 고정</span>
                        <button
                          type="button"
                          className="route-card__remove-btn"
                          onClick={() => removeStop(index, row)}
                          aria-label={`${row.name || '여정 목적지'}를 이번 Move 도착에서 제외`}
                        >
                          오늘 경로에서 빼기
                        </button>
                      </div>
                    ) : (
                      <div className="route-card__actions">
                        <button
                          type="button"
                          className="route-card__move-btn"
                          disabled={index <= 0}
                          onClick={() => moveStop(index, index - 1, row)}
                          aria-label={`앞 순서로 이동: ${row.name || roleLabel}`}
                          title="앞 순서로 이동"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          className="route-card__move-btn"
                          disabled={index === 0 || index >= count - 1}
                          onClick={() => moveStop(index, index + 1, row)}
                          aria-label={`뒤 순서로 이동: ${row.name || roleLabel}`}
                          title="뒤 순서로 이동"
                        >
                          ▶
                        </button>
                        <button
                          type="button"
                          className="route-card__remove-btn"
                          onClick={() => removeStop(index, row)}
                          aria-label={`${row.name || '노드'} 삭제`}
                        >
                          빼기
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Interactive connector line between cards */}
                  {index < count - 1 && (
                    <div className="route-connector" role="group" aria-label={`구간 ${index + 1}: ${row.name || '이름 없음'}에서 ${nextStop?.name || '이름 없음'}까지`}>
                      <div className={`route-connector__line route-connector__line--${edgeKind}`} />
                      <button
                        type="button"
                        className={`route-connector__btn route-connector__btn--${edgeKind}`}
                        onClick={() => onChangeEdge(index, cycleRouteEdgeKind(edgeKind, row, nextStop))}
                        aria-label={`구간 ${index + 1}: ${row.name || '이름 없음'}에서 ${nextStop?.name || '이름 없음'}까지, 클릭하여 타입 변경 (현재: ${routeEdgeLabel(edgeKind)})`}
                        title={`클릭하여 육로/수로/강 전환 (현재: ${routeEdgeLabel(edgeKind)})`}
                      >
                        <span className="route-connector__icon">
                          {edgeKind === 'waterway' ? '⛵' : edgeKind === 'river' ? '🌊' : '🌲'}
                        </span>
                        <span className="route-connector__label">{routeEdgeLabel(edgeKind)}</span>
                        <span className="route-connector__action">눌러 변경</span>
                      </button>
                      <div className={`route-connector__line route-connector__line--${edgeKind}`} />
                    </div>
                  )}
                </div>
              );
            })}
            {pinnedTarget && (
              <div className="route-composer__step-unit route-composer__step-unit--target" aria-label={`고정된 여정 목적지 ${pinnedTarget.name}`}>
                <div className="route-connector route-connector--remaining" aria-hidden="true">
                  <div className="route-connector__line route-connector__line--remaining" />
                  <span className="route-connector__remaining-label">여정 계속</span>
                  <div className="route-connector__line route-connector__line--remaining" />
                </div>
                <div className={`route-composer__card route-composer__card--target${compactView ? ' route-composer__card--compact' : ''}`}>
                  <div className="route-card__header">
                    <span className="route-card__index">여정 목적지</span>
                    <MapGlyph kind={pinnedTarget.kind} terrain={pinnedTarget.terrain} size={18} />
                    <strong className="route-card__target-name" title={pinnedTarget.name}>{pinnedTarget.name || '이름 없음'}</strong>
                  </div>
                  <span className="route-card__meta" title={stopMeta(pinnedTarget)}>{stopMeta(pinnedTarget)}</span>
                  <span className="route-card__fixed">목적지 고정 · 이번 Move 거리에는 미포함</span>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {routeFeedback && <p className="route-composer__feedback" role="status" aria-live="polite">{routeFeedback}</p>}

      {count > 1 && (
        <p className="route-composer__edge-hint">
          위치 사이의 연결 버튼을 눌러 육로·강·수로를 바꾸세요. 수로는 호수·강에 닿는 구간에서만 선택됩니다.
        </p>
      )}

      <div className="route-composer__summary">
        {movementMode === 'soar' ? (
          <p>활공에서는 출발지와 마지막 노드만 사용합니다. 중간 노드와 연결 유형은 Move로 되돌릴 때 그대로 남습니다.</p>
        ) : (
          <>
            <p>
              선택한 이동 거리 <strong>{evaluation.pathCount}경로</strong> · 육로 {evaluation.landCount} · 강 {evaluation.riverCount} · 수로 {evaluation.waterwayCount} · 필요한 이동력 {evaluation.movementCost}/{evaluation.effectiveSpeed}
              {evaluation.overEncumbered ? ' · 과적으로 속도 1' : ''}
              {waterwaySpan > 1 ? ` · 이어진 수로 ${waterwaySpan}개를 1경로로 계산` : ''}
            </p>
            {evaluation.pathCount > 0 && (
              <p className={confirmedSegmentCount === evaluation.pathCount ? 'route-composer__confirmed' : 'route-composer__unconfirmed'}>
                저장된 연결 {confirmedSegmentCount}/{evaluation.pathCount}구간
                {confirmedSegmentCount === evaluation.pathCount
                  ? ' · 선택한 이동 거리를 확정 연결로 계산했습니다.'
                  : ` · ${evaluation.pathCount - confirmedSegmentCount}구간은 05 지도에서 아직 연결을 확정하지 않았습니다.`}
              </p>
            )}
            {journeyTarget && (
              <p className="route-composer__minimum-distance">
                현재 위치 → {journeyTarget.name} 최소 거리: <strong>{journeyMinimumDistance === null ? '확정 연결 부족' : `${journeyMinimumDistance}경로`}</strong>
              </p>
            )}
            <p>{reasonText(evaluation.reason, evaluation.effectiveSpeed, evaluation.movementCost)}</p>
          </>
        )}
        {evaluation.overEncumbered && (
          <div style={{ padding: '0.4rem 0.6rem', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '6px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.3rem' }}>
            🎒 과적 상태 (무게 {weight}/{carry}): 일일 이동 속도가 1경로로 제한됩니다. (룰북 p.24)
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
          <p>지도나 위치 검색에서 첫 경유지를 고르세요.</p>
        )}
        {travelBlockedReason && <p className="route-composer__blocker">{travelBlockedReason}</p>}
      </div>

      <div className="route-composer__actions">
        <button type="button" onClick={onClear} disabled={count <= 1}>경로 초기화</button>
        <button
          type="button"
          className="route-composer__go"
          onClick={onTravel}
          disabled={!travelReady}
        >
          {travelReady
            ? (movementMode === 'soar' ? '마지막 위치로 활공' : '이 경로로 이동')
            : (travelBlockedReason || (movementMode === 'soar' ? '착륙 위치를 고르세요' : blockedActionText(evaluation.reason)))}
        </button>
      </div>
    </section>
  );
}
