export interface TobogganMapNode {
  id: string;
  region: string;
  neighbors: readonly string[];
}

export type TobogganMovementValidation =
  | { status: 'valid'; originId: string; targetId: string }
  | { status: 'invalid'; reason: string };

/**
 * p.93 Tobogganing moves the Apothecary to one adjacent non-Mountain
 * Location. It is not a normal Move: it draws no Encounter and adds no time
 * beyond the one printed day already resolved by the Encounter branch.
 */
export const validateTobogganMovement = (
  graph: Readonly<Record<string, TobogganMapNode>>,
  originId: string,
  targetId: string
): TobogganMovementValidation => {
  const origin = graph[originId];
  const target = graph[targetId];
  if (!origin) return { status: 'invalid', reason: '썰매를 출발할 현재 지도 위치를 찾지 못했습니다.' };
  if (!target) return { status: 'invalid', reason: '선택한 썰매 도착지를 지도에서 찾지 못했습니다.' };
  if (originId === targetId || !origin.neighbors.includes(targetId)) {
    return { status: 'invalid', reason: '썰매 도착지는 현재 위치와 직접 이어진 인접 위치여야 합니다.' };
  }
  if (target.region.trim().toLowerCase() === 'mountain') {
    return { status: 'invalid', reason: '썰매는 산악이 아닌 인접 지역으로만 이동할 수 있습니다.' };
  }
  return { status: 'valid', originId, targetId };
};
