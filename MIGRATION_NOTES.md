# Save Migration Notes

## Current Contract

- 현재 schema는 `v8`이다.
- 새 캠페인은 `original-1e-3p`를 사용한다.
- schema가 없는 legacy save는 `legacy-campaign` compatibility metadata와 함께 순차 migration한다.
- migration은 `v0 → v1 → ... → v8` 순서이며 중간 단계를 건너뛰지 않는다.

## Preserved Historical Fixtures

| Fixture | Main preservation check |
|---|---|
| v6 | pending/deferred Manual Resolution을 queue와 draft로 정규화 |
| v7 | legacy Barrow Delve와 Tool identity를 canonical v8 상태로 정규화 |
| v8 | 현재 상태를 재해석하지 않고 보존 |
| final release v8 | transaction IDs와 revision을 그대로 보존 |

Golden fixture는 `src/rules/fixtures/goldenSaves.ts`, 자동 검증은 `src/rules/goldenMaster.test.ts`에 있다.

## Compatibility Guarantees

- active Patient와 복수 Ailment/Timer
- active Journey와 pending ending
- pending Manual Resolution과 follow-up
- Barrow, Tool/Upgrade, Wagon/Companion
- Clinic/Service, Downtime/Season, Archive
- applied transaction IDs와 save revision

기존 migration을 제거하거나 과거 fixture의 기대 상태를 바꾸는 작업은 patch release로 처리하지 않는다.
