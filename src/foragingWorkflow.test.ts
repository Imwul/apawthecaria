// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');

describe('foraging workflow order', () => {
  it('requires a researched target before the draw and persists it through the pending transaction', () => {
    const planningStep = appSource.indexOf('1. 목표 영약재 조사');
    const drawStep = appSource.indexOf('2. 채집 카드');
    expect(planningStep).toBeGreaterThan(-1);
    expect(drawStep).toBeGreaterThan(planningStep);
    expect(appSource).toContain('disabled={!effectiveForageTargetReagentId}');
    expect(appSource).toContain('targetReagentId,\n      timerCostAfterEncounter');
    expect(appSource).toContain('targetReagentId: pending.targetReagentId');
    expect(appSource).toContain('plannedForageReagentId');
  });

  it('lets the player choose a required tag before comparing ranked reagent candidates', () => {
    expect(appSource).toContain('먼저 필요한 약효 태그를 고르세요');
    expect(appSource).toContain('role="group" aria-label={`${effectiveForageTargetTag} 채집 후보`}');
    expect(appSource).toContain('right.bestCoverageCount - left.bestCoverageCount');
    expect(appSource).toContain('left.breakdown.finalRarity - right.breakdown.finalRarity');
    expect(appSource).toContain('const plannedValue = selectedForagePlans.reduce');
    expect(appSource).toContain('aria-pressed={selected}');
    expect(appSource).toContain('previous.filter(reagentId => reagentId !== row.reagent.id)');
    expect(appSource).toContain("[...previous, row.reagent.id]");
    expect(appSource).toContain('맨 앞 재료부터 한 번에 하나씩 판정합니다.');
    expect(appSource).not.toContain('id="forage-target-reagent"');
  });

  it('keeps the physical-card entry path while naming the random action clearly', () => {
    expect(appSource).toContain("'랜덤 뽑기'");
    expect(appSource).toContain('오프라인에서 뽑은 카드 입력');
  });

  it('only describes suit directions in the journey destination card control', () => {
    expect(appSource).toContain('showSuitDirections = false');
    expect(appSource).toContain("{showSuitDirections ? ' · 북쪽/위' : ''}");
    expect(appSource).toMatch(/label="목적지와 방향 카드"\s+showSuitDirections/);
  });
});
