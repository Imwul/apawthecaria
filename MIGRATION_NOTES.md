# Save Migration Notes

## Current Contract

- 현재 schema는 `v9`이다.
- 새 캠페인은 `original-1e-3p`를 사용한다.
- schema가 없는 legacy save는 `legacy-campaign` compatibility metadata와 함께 순차 migration한다.
- migration은 `v0 → v1 → ... → v9` 순서이며 중간 단계를 건너뛰지 않는다.
- `v0`은 `schemaVersion`이 없던 저장 형식을 포함한다.
- 앱보다 새로운 schema는 조용히 재해석하지 않고 원본을 보존한 채 load/import를 거부한다.

## Preserved Historical Fixtures

| Fixture | Main preservation check |
|---|---|
| v6 | pending/deferred Manual Resolution을 queue와 draft로 정규화 |
| v7 | legacy Barrow Delve와 Tool identity를 canonical v8 상태로 정규화 |
| v8 | Route draft를 canonical v9 상태로 정규화 |
| v9 | 현재 상태를 재해석하지 않고 보존 |
| final release v8 | transaction IDs와 revision을 그대로 보존하면서 v9로 이동 |

Golden fixture는 `src/rules/fixtures/goldenSaves.ts`, 자동 검증은 `src/rules/goldenMaster.test.ts`에 있다.

## Compatibility Guarantees

- active Patient와 복수 Ailment/Timer
- active Journey와 pending ending
- pending Manual Resolution과 follow-up
- Barrow, Tool/Upgrade, Wagon/Companion
- Clinic/Service, Downtime/Season, Archive
- applied transaction IDs와 save revision
- in-progress Route node 순서와 mixed 육로/강/수로 connector
- 부분 손상된 optional array/Patient 값의 deterministic normalization
- migration 및 JSON round-trip idempotency

기존 migration을 제거하거나 과거 fixture의 기대 상태를 바꾸는 작업은 patch release로 처리하지 않는다.
