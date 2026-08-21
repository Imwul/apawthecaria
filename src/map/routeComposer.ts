import {
  MAP_GLYPH_KINDS,
  MAP_TERRAINS,
  type MapGlyphKind,
  type MapTerrain
} from './mapGlyphTypes';

export const ROUTE_EDGE_KINDS = ['path', 'river', 'waterway'] as const;
export type RouteEdgeKind = (typeof ROUTE_EDGE_KINDS)[number];

export const routeEdgeLabel = (kind: RouteEdgeKind): string =>
  kind === 'waterway' ? '수로' : kind === 'river' ? '강' : '육로';

export const isWaterTravelKind = (kind?: string | null): boolean =>
  kind === 'waterway' || kind === 'river';

export const isLochWildsStop = (stop: { kind?: string | null; terrain?: string | null } | null | undefined): boolean =>
  Boolean(stop && stop.terrain === 'Loch' && stop.kind !== 'Settlement' && stop.kind !== 'City' && stop.kind !== 'Clinic');

export const edgeTouchesLoch = (
  from: { terrain?: string | null } | null | undefined,
  to: { terrain?: string | null } | null | undefined
): boolean => from?.terrain === 'Loch' || to?.terrain === 'Loch';

export const canChooseRouteEdgeKind = (
  kind: RouteEdgeKind,
  from: { terrain?: string | null } | null | undefined,
  to: { terrain?: string | null } | null | undefined
): boolean => kind !== 'waterway' || edgeTouchesLoch(from, to);

export const cycleRouteEdgeKind = (
  kind: RouteEdgeKind,
  from: { terrain?: string | null } | null | undefined,
  to: { terrain?: string | null } | null | undefined
): RouteEdgeKind => {
  const start = ROUTE_EDGE_KINDS.indexOf(kind);
  for (let step = 1; step <= ROUTE_EDGE_KINDS.length; step += 1) {
    const next = ROUTE_EDGE_KINDS[(start + step) % ROUTE_EDGE_KINDS.length];
    if (canChooseRouteEdgeKind(next, from, to)) return next;
  }
  return 'path';
};

export type RouteStop = {
  id: string;
  name: string;
  kind: MapGlyphKind;
  terrain: MapTerrain | null;
  hasClinic: boolean;
  x: number;
  y: number;
};

export type RouteDraft = {
  stops: RouteStop[];
  edgeKinds: RouteEdgeKind[];
};

export type ConfirmedRouteEdge = {
  from: string;
  to: string;
};

export type ConfirmedRouteCoverage = {
  confirmed: number;
  total: number;
  missingPairs: Array<{ from: string; to: string }>;
};

export type RouteComposerReason = 'incomplete' | 'legal' | 'too-close' | 'too-far' | 'loch-locked';

export type RouteComposerEvaluation = {
  pathCount: number;
  landCount: number;
  riverCount: number;
  waterwayCount: number;
  movementCost: number;
  usesWaterway: boolean;
  usesWaterTravel: boolean;
  endsInLochWilds: boolean;
  lochLocked: boolean;
  overEncumbered: boolean;
  effectiveSpeed: number;
  soakedItemIds: string[];
  reason: RouteComposerReason;
};

const isTerrain = (value: string | null | undefined): value is MapTerrain =>
  Boolean(value && (MAP_TERRAINS as readonly string[]).includes(value));

export const terrainFromRegion = (region?: string | null): MapTerrain | null =>
  isTerrain(region) ? region : null;

export const glyphKindFromLocation = (input: {
  kind?: string | null;
  locationType?: string | null;
  hasClinic?: boolean;
}): MapGlyphKind => {
  if (input.hasClinic) return 'Clinic';
  const raw = `${input.kind || ''} ${input.locationType || ''}`.toLowerCase();
  if (raw.includes('clinic')) return 'Clinic';
  if (raw.includes('city')) return 'City';
  if (raw.includes('settlement')) return 'Settlement';
  if (raw.includes('barrow')) return 'Barrow';
  if (raw.includes('ruin') || raw.includes('titan')) return 'Ruin';
  return 'Wilds';
};

export const locationTypeFromGlyph = (kind: MapGlyphKind): string => {
  if (kind === 'City') return 'City';
  if (kind === 'Settlement' || kind === 'Clinic') return 'Settlement';
  if (kind === 'Ruin') return 'Ruin';
  if (kind === 'Barrow') return 'Barrow';
  return 'Wilds';
};

export const mapKindFromGlyph = (kind: MapGlyphKind): 'named' | 'wild' | 'settlement' | 'city' | 'ruin' | 'barrow' | 'clinic' => {
  if (kind === 'City') return 'city';
  if (kind === 'Settlement') return 'settlement';
  if (kind === 'Ruin') return 'ruin';
  if (kind === 'Barrow') return 'barrow';
  if (kind === 'Clinic') return 'clinic';
  return 'wild';
};

export const emptyRouteDraft = (): RouteDraft => ({ stops: [], edgeKinds: [] });

const finiteCoordinate = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
};

/**
 * Safely restores an in-progress route from a campaign save. Invalid stops are
 * discarded and connector data is rebuilt to exactly match the remaining
 * stop order, so a malformed/legacy draft cannot break the editor.
 */
export const normalizeRouteDraft = (value: unknown): RouteDraft => {
  if (!value || typeof value !== 'object') return emptyRouteDraft();
  const raw = value as { stops?: unknown; edgeKinds?: unknown };
  const parsedStops = Array.isArray(raw.stops)
    ? raw.stops.flatMap((entry, index): RouteStop[] => {
        if (!entry || typeof entry !== 'object') return [];
        const row = entry as Record<string, unknown>;
        const id = typeof row.id === 'string' ? row.id.trim() : '';
        if (!id) return [];
        const kind = typeof row.kind === 'string' && (MAP_GLYPH_KINDS as readonly string[]).includes(row.kind)
          ? row.kind as MapGlyphKind
          : 'Wilds';
        const terrain = typeof row.terrain === 'string' && (MAP_TERRAINS as readonly string[]).includes(row.terrain)
          ? row.terrain as MapTerrain
          : null;
        return [{
          id,
          name: typeof row.name === 'string' ? row.name : id,
          kind,
          terrain: glyphUsesTerrainForRoute(kind) ? terrain : null,
          hasClinic: kind === 'Clinic' || row.hasClinic === true,
          x: finiteCoordinate(row.x, 50 + index),
          y: finiteCoordinate(row.y, 50)
        }];
      })
    : [];
  const stops = collapseConsecutiveRouteStops(parsedStops);
  const rawEdges = Array.isArray(raw.edgeKinds) ? raw.edgeKinds : [];
  const parsedEdgeKinds: RouteEdgeKind[] = [];
  for (let index = 0; index < Math.max(0, parsedStops.length - 1); index += 1) {
    const candidate = ROUTE_EDGE_KINDS.includes(rawEdges[index] as RouteEdgeKind)
      ? rawEdges[index] as RouteEdgeKind
      : 'path';
    parsedEdgeKinds.push(canChooseRouteEdgeKind(candidate, parsedStops[index], parsedStops[index + 1]) ? candidate : 'path');
  }
  const edgeKinds = stops.length === parsedStops.length
    ? parsedEdgeKinds
    : rebuildRouteEdgeKinds({ stops: parsedStops, edgeKinds: parsedEdgeKinds }, stops);
  return { stops, edgeKinds };
};

const glyphUsesTerrainForRoute = (kind: MapGlyphKind): boolean =>
  kind === 'Wilds' || kind === 'Settlement' || kind === 'City' || kind === 'Clinic';

export const draftFromOrigin = (origin: RouteStop | null): RouteDraft =>
  origin ? { stops: [origin], edgeKinds: [] } : emptyRouteDraft();

export const lastRouteStop = (draft: RouteDraft): RouteStop | null =>
  draft.stops[draft.stops.length - 1] || null;

export const routeDestination = (draft: RouteDraft): RouteStop | null =>
  draft.stops.length > 1 ? draft.stops[draft.stops.length - 1] : null;

export type ResolveRouteEdgeKind = (from: RouteStop, to: RouteStop) => RouteEdgeKind;

export const appendRouteStop = (
  draft: RouteDraft,
  stop: RouteStop,
  edgeKind: RouteEdgeKind = 'path'
): RouteDraft => {
  if (draft.stops.length === 0) return { stops: [stop], edgeKinds: [] };
  const last = draft.stops[draft.stops.length - 1];
  // A route may retrace a Path to spend the full Speed required by p.24.
  // Only a consecutive self-loop is ignored, which also makes rapid repeated
  // clicks on the same marker idempotent.
  if (last.id === stop.id) return draft;
  const validKind = canChooseRouteEdgeKind(edgeKind, last, stop) ? edgeKind : 'path';
  return {
    stops: [...draft.stops, stop],
    edgeKinds: [...draft.edgeKinds, validKind]
  };
};

/**
 * Adds a daily Move stop while keeping an already-recorded Journey
 * Destination at the far end of the strip. The destination remains a normal
 * route stop only when the player explicitly chooses to reach it this Move.
 */
export const insertRouteStopBeforeTarget = (
  draft: RouteDraft,
  stop: RouteStop,
  targetId: string | null | undefined,
  resolveEdgeKind?: ResolveRouteEdgeKind
): RouteDraft => {
  if (draft.stops.length === 0 || !targetId || draft.stops.at(-1)?.id !== targetId) {
    const last = draft.stops.at(-1);
    return appendRouteStop(draft, stop, last && resolveEdgeKind ? resolveEdgeKind(last, stop) : 'path');
  }
  const target = draft.stops[draft.stops.length - 1];
  if (stop.id === target.id) return draft;
  const insertionIndex = draft.stops.length - 1;
  const previousStop = draft.stops[insertionIndex - 1];
  // Fast repeated taps on the same marker must never create duplicate stops.
  if (previousStop?.id === stop.id) return draft;
  const stops = [...draft.stops.slice(0, insertionIndex), stop, target];
  return { stops, edgeKinds: rebuildRouteEdgeKinds(draft, stops, resolveEdgeKind) };
};

const routePairKey = (fromId: string, toId: string): string =>
  fromId < toId ? `${fromId}|${toId}` : `${toId}|${fromId}`;

const collapseConsecutiveRouteStops = (stops: RouteStop[]): RouteStop[] =>
  stops.filter((stop, index) => index === 0 || stops[index - 1].id !== stop.id);

const rebuildRouteEdgeKinds = (
  previous: RouteDraft,
  stops: RouteStop[],
  resolveEdgeKind?: ResolveRouteEdgeKind
): RouteEdgeKind[] => {
  const previousKindsByPair = new Map<string, RouteEdgeKind[]>();
  previous.edgeKinds.forEach((kind, index) => {
    const from = previous.stops[index];
    const to = previous.stops[index + 1];
    if (!from || !to) return;
    const key = routePairKey(from.id, to.id);
    previousKindsByPair.set(key, [...(previousKindsByPair.get(key) || []), kind]);
  });

  return stops.slice(0, -1).map((from, index) => {
    const to = stops[index + 1];
    const previousKinds = previousKindsByPair.get(routePairKey(from.id, to.id));
    const candidate = previousKinds?.shift() || resolveEdgeKind?.(from, to) || 'path';
    return canChooseRouteEdgeKind(candidate, from, to) ? candidate : 'path';
  });
};

const confirmedPairSet = (edges: readonly ConfirmedRouteEdge[]): Set<string> =>
  new Set(edges
    .filter(edge => edge.from && edge.to && edge.from !== edge.to)
    .map(edge => routePairKey(edge.from, edge.to)));

/** Counts only player-saved map connections; inferred/printed graph guesses do not qualify. */
export const confirmedRouteCoverage = (
  draft: RouteDraft,
  edges: readonly ConfirmedRouteEdge[]
): ConfirmedRouteCoverage => {
  const confirmedPairs = confirmedPairSet(edges);
  const missingPairs = draft.stops.slice(0, -1).flatMap((from, index) => {
    const to = draft.stops[index + 1];
    return confirmedPairs.has(routePairKey(from.id, to.id)) ? [] : [{ from: from.id, to: to.id }];
  });
  const total = Math.max(0, draft.stops.length - 1);
  return { confirmed: total - missingPairs.length, total, missingPairs };
};

/**
 * Breadth-first minimum distance over player-confirmed connections only.
 * `null` means that the saved connection data does not yet prove a route.
 */
export const shortestConfirmedRouteDistance = (
  edges: readonly ConfirmedRouteEdge[],
  fromId: string | null | undefined,
  toId: string | null | undefined
): number | null => {
  if (!fromId || !toId) return null;
  if (fromId === toId) return 0;
  const neighbors = new Map<string, Set<string>>();
  edges.forEach(edge => {
    if (!edge.from || !edge.to || edge.from === edge.to) return;
    if (!neighbors.has(edge.from)) neighbors.set(edge.from, new Set());
    if (!neighbors.has(edge.to)) neighbors.set(edge.to, new Set());
    neighbors.get(edge.from)!.add(edge.to);
    neighbors.get(edge.to)!.add(edge.from);
  });
  const queue: Array<{ id: string; distance: number }> = [{ id: fromId, distance: 0 }];
  const visited = new Set([fromId]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of neighbors.get(current.id) || []) {
      if (visited.has(next)) continue;
      if (next === toId) return current.distance + 1;
      visited.add(next);
      queue.push({ id: next, distance: current.distance + 1 });
    }
  }
  return null;
};

export const removeRouteStopAt = (
  draft: RouteDraft,
  index: number,
  resolveEdgeKind?: ResolveRouteEdgeKind
): RouteDraft => {
  if (index <= 0 || index >= draft.stops.length) return draft;
  const stops = collapseConsecutiveRouteStops(draft.stops.filter((_, stopIndex) => stopIndex !== index));
  return { stops, edgeKinds: rebuildRouteEdgeKinds(draft, stops, resolveEdgeKind) };
};

export const moveRouteStop = (
  draft: RouteDraft,
  fromIndex: number,
  toIndex: number,
  resolveEdgeKind?: ResolveRouteEdgeKind
): RouteDraft => {
  // The first node is the campaign's current Location, not a movable waypoint.
  if (fromIndex === 0 || toIndex === 0) return draft;
  if (fromIndex < 0 || fromIndex >= draft.stops.length) return draft;
  if (toIndex < 0 || toIndex >= draft.stops.length) return draft;
  if (fromIndex === toIndex) return draft;

  const stops = [...draft.stops];
  const [moved] = stops.splice(fromIndex, 1);
  stops.splice(toIndex, 0, moved);
  const collapsedStops = collapseConsecutiveRouteStops(stops);

  return { stops: collapsedStops, edgeKinds: rebuildRouteEdgeKinds(draft, collapsedStops, resolveEdgeKind) };
};

export const updateRouteStopAt = (draft: RouteDraft, index: number, patch: Partial<RouteStop>): RouteDraft => {
  if (index < 0 || index >= draft.stops.length) return draft;
  return {
    ...draft,
    stops: draft.stops.map((stop, stopIndex) => stopIndex === index ? { ...stop, ...patch } : stop)
  };
};

export const setRouteEdgeKind = (draft: RouteDraft, index: number, kind: RouteEdgeKind): RouteDraft => {
  if (index < 0 || index >= draft.edgeKinds.length) return draft;
  if (!canChooseRouteEdgeKind(kind, draft.stops[index], draft.stops[index + 1])) return draft;
  const selectedPair = routePairKey(draft.stops[index].id, draft.stops[index + 1].id);
  return {
    ...draft,
    // Edge type describes the physical bidirectional Path. If a route retraces
    // that Path, every occurrence must show and persist the same type.
    edgeKinds: draft.edgeKinds.map((edge, edgeIndex) => {
      const from = draft.stops[edgeIndex];
      const to = draft.stops[edgeIndex + 1];
      return from && to && routePairKey(from.id, to.id) === selectedPair ? kind : edge;
    })
  };
};

export const composedRouteCost = (
  edgeKinds: readonly RouteEdgeKind[],
  waterwaySpan = 1,
  freeStopIndexes: readonly number[] = []
): { cost: number; landCount: number; riverCount: number; waterwayCount: number } => {
  const free = new Set(freeStopIndexes);
  let cost = 0;
  let landCount = 0;
  let riverCount = 0;
  let waterwayCount = 0;
  let waterwayRun = 0;
  const flush = () => {
    if (waterwayRun > 0) cost += Math.ceil(waterwayRun / Math.max(1, waterwaySpan));
    waterwayRun = 0;
  };
  edgeKinds.forEach((kind, index) => {
    if (free.has(index + 1)) return;
    if (kind === 'waterway') {
      waterwayCount += 1;
      waterwayRun += 1;
      return;
    }
    flush();
    if (kind === 'river') riverCount += 1;
    else landCount += 1;
    cost += 1;
  });
  flush();
  return { cost, landCount, riverCount, waterwayCount };
};

export const evaluateRouteDraft = (input: {
  draft: RouteDraft;
  speed: number;
  carry: number;
  weight: number;
  waterwaySpan?: number;
  canStopInLoch?: boolean;
  protectsFromSoaking?: boolean;
  soakableItemIds?: string[];
  mustUseFullSpeed?: boolean;
  freeStopIndexes?: number[];
}): RouteComposerEvaluation => {
  const overEncumbered = input.weight > input.carry;
  const effectiveSpeed = overEncumbered ? 1 : Math.max(1, input.speed);
  const destination = routeDestination(input.draft);
  const pathCount = input.draft.edgeKinds.length;
  const { cost, landCount, riverCount, waterwayCount } = composedRouteCost(
    input.draft.edgeKinds,
    input.waterwaySpan || 1,
    input.freeStopIndexes || []
  );
  const usesWaterway = waterwayCount > 0;
  const usesWaterTravel = usesWaterway || riverCount > 0;
  const lochWilds = isLochWildsStop(destination);
  const lochLocked = Boolean(lochWilds && !input.canStopInLoch);
  let reason: RouteComposerReason = 'incomplete';
  if (pathCount > 0) {
    if (lochLocked) reason = 'loch-locked';
    else if (input.mustUseFullSpeed === false) reason = cost <= effectiveSpeed ? 'legal' : 'too-far';
    else if (cost === effectiveSpeed) reason = 'legal';
    else reason = cost < effectiveSpeed ? 'too-close' : 'too-far';
  }
  return {
    pathCount,
    landCount,
    riverCount,
    waterwayCount,
    movementCost: cost,
    usesWaterway,
    usesWaterTravel,
    endsInLochWilds: lochWilds,
    lochLocked,
    overEncumbered,
    effectiveSpeed,
    soakedItemIds: usesWaterTravel && !input.protectsFromSoaking ? [...(input.soakableItemIds || [])] : [],
    reason
  };
};

export const nearestTerrain = (
  x: number,
  y: number,
  candidates: ReadonlyArray<{ x: number; y: number; terrain?: MapTerrain | null; region?: string | null }>
): MapTerrain | null => {
  let best: MapTerrain | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  candidates.forEach(candidate => {
    const terrain = candidate.terrain || terrainFromRegion(candidate.region);
    if (!terrain) return;
    const distance = Math.hypot(candidate.x - x, candidate.y - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = terrain;
    }
  });
  return best;
};

export const stopFromPlace = (place: {
  id: string;
  name: string;
  x: number;
  y: number;
  region?: string | null;
  kind?: string | null;
  locationType?: string | null;
  hasClinic?: boolean;
}): RouteStop => ({
  id: place.id,
  name: place.name,
  kind: glyphKindFromLocation(place),
  terrain: terrainFromRegion(place.region),
  hasClinic: Boolean(place.hasClinic),
  x: place.x,
  y: place.y
});
