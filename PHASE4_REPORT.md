# Phase 4 Report

## 구현 범위

Phase 4는 룰북 1판 3쇄를 기준으로 Services, Barrows, Almanack, Tools, Wagon/Companion, Rumour, Clinic, 저장과 시각 체계를 canonical 구조로 확장했다. UI만 존재하거나 잘못된 즉시 지급을 하던 경로는 pure resolver + transaction state로 교체하거나 `Partial`로 명시했다.

## Gameplay Subsystems

- **Barrow:** 8 Delve data/state machine, Flee, M=12, canonical item identity, Timer, reward, map removal, duplicate prevention. 전용 입력 UI 일부는 legacy adapter라 `Partial`이다.
- **Guild Services:** 17종과 Send Package를 복구했다. 지도 변경은 실제 graph와 mutation history를 저장하며 Retrieval은 5 Paths와 pending delivery를 사용한다.
- **Tools/Upgrades:** 18 Tool, Titan Thingamabob, 7 Upgrade, base Tool 검증, Weight, 파손과 trigger transaction을 추가했다.
- **Wagon/Companion:** p43 Wagon 주문 20 Trinket, expansion capability, Experimental Soar 3 Days, Sealed/Waterway, Wasp 10 Paths actual Foraging, Honeybee/Caterpillar state를 연결했다.
- **Rumour/Downtime:** 네 장 표와 actual graph 후보, 불가능 조합 재추첨, Downtime 1회 소비를 연결했다.
- **Clinic:** 다음 Season 완성, 3 Paths service area, 10 global Agenda data와 income/goodwill resolver를 추가했다.
- **Replacement:** 직접 생성을 차단하고 BR 12, Weight 2/3 commit resolver를 추가했다. Forage/Barter UI의 최종 commit 연결은 `Partial`이다.

## Almanack과 Manual Effects

Almanack은 Reagent, Ailment, Service, Tool, Upgrade, Wagon, Companion, Clinic, Encounter, Barrow를 검색·분류하고 발견/보유/잠금과 자동/manual 상태, source page를 구분한다. 520개 항목은 80개씩 단계 렌더링한다.

Manual effect는 요약, Rule ID, page, 강제 조건, 선택, canonical action, 결과/저널 입력, 보류/완료/override transaction을 schema v5에 보존한다. Printed Effect 자동화 수는 3/358로 과장하지 않았다.

## Save, Offline, Performance

- schema v5 migration과 service/delve/tool/wagon/companion/manual/outbox state
- local-first save, revision conflict, outbox coalescing, retry와 ordered cloud queue
- Almanack lazy load와 React/Firebase/canonical-data chunk 분리
- main bundle 약 607 kB; 기존 단일 약 1.41 MB에서 의미 있게 감소했으나 500 kB 경고는 남음
- 전체 lint 0 errors / 0 warnings

## 준수 숫자

| 상태 | Phase 3 | 현재 |
|---|---:|---:|
| Exact | 72 | 82 |
| Partial | 49 | 59 |
| Incorrect | 13 | 0 |
| Missing | 5 | 0 |
| UI-only | 4 | 0 |
| Logic-only | 0 | 2 |
| Ambiguous | 2 | 2 |
| House Rule | 6 | 6 |

변경 Rule ID는 `RULE_AUDIT.md`와 `RULE_TRACEABILITY.md`에 기록했다.

## 검증

- 8 test files / 80 tests 통과
- Validator Error 0 / Warning 0
- TypeScript, full lint, production build 통과
- 360/390/768/1024/1440/1920 반응형 확인, 문서 가로 넘침 0
- 지도 라벨, Dashboard, Journey, Map, Patient/Treatment, Inventory, Almanack, Archive 캡처
- fresh dev server console의 현재 URL error/warning 0

## 남은 작업

Barrow 전용 입력 UI, 모든 Tool trigger 연결, Replacement UI commit, 치료 draft 복원, 355 manual printed effect 중 결정 가능한 항목의 순차 자동화가 남는다. 이 제한 때문에 관련 항목은 `Partial`/`Logic-only`다.
