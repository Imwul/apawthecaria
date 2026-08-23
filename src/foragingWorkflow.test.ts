// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');

describe('foraging workflow order', () => {
  it('draws before the player chooses from the discovered ingredients', () => {
    const drawStep = appSource.indexOf('label="채집 카드"');
    const planningStep = appSource.indexOf('채집 전 조사 노트 · 선택');
    expect(drawStep).toBeGreaterThan(-1);
    expect(planningStep).toBeGreaterThan(drawStep);
    expect(appSource).toContain('카드 값과 이곳의 조사 목록을 비교한 뒤, 실제로 채집할 영약재를 고릅니다.');
    expect(appSource).toContain("forageContext.actionAllowed ? (");
    expect(appSource).toContain('const forageActionLabel = forageDrawCard');
    expect(appSource).toContain('`이 카드로 ${foragePlaceLabel} 채집하기`');
    expect(appSource).toContain('`${foragePlaceLabel} 카드 뽑고 채집하기`');
    expect(appSource).not.toContain('disabled={!effectiveForageTargetReagentId}');
  });

  it('offers an optional, pastoral research note without making it a rules gate', () => {
    expect(appSource).toContain('환자의 처방에 보탤 힘을 미리 살펴보세요');
    expect(appSource).toContain('이 메모는 선택을 돕는 조사 기록입니다. 실제 채집은 카드를 뽑은 뒤 발견 목록에서 정합니다.');
    expect(appSource).toContain('role="group" aria-label={`${effectiveForageTargetTag} 채집 후보`}');
    expect(appSource).toContain('right.bestCoverageCount - left.bestCoverageCount');
    expect(appSource).toContain('left.breakdown.finalRarity - right.breakdown.finalRarity');
    expect(appSource).toContain('const plannedValue = aggregateRemedyTagPotency');
    expect(appSource).toContain('aria-pressed={selected}');
    expect(appSource).toContain('previous.filter(reagentId => reagentId !== row.reagent.id)');
    expect(appSource).toContain("[...previous, row.reagent.id]");
    expect(appSource).toContain('카드 뒤의 최종 선택은 언제나 플레이어의 몫입니다.');
    expect(appSource).toContain('기억해 두기');
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
