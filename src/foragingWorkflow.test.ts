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

  it('only describes suit directions in the journey destination card control', () => {
    expect(appSource).toContain('showSuitDirections = false');
    expect(appSource).toContain("{showSuitDirections ? ' · 북쪽/위' : ''}");
    expect(appSource).toMatch(/label="목적지와 방향 카드"\s+showSuitDirections/);
  });
});
