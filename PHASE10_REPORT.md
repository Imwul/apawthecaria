# Phase 10 Report

## Scope

Version 1.0 Certification에서 지정된 Release Blocker 20개만 수정했다. 나머지 Partial, 347개 manual Printed Effect, narrative·GM·player choice, House Rule과 schema v8 형식은 변경하지 않았다.

## Coverage Change

| Status | Before | After |
|---|---:|---:|
| Exact | 97 | 117 |
| Partial | 44 | 24 |
| Incorrect | 0 | 0 |
| Missing | 0 | 0 |
| UI-only | 0 | 0 |

Release Blocker: **20 → 0**.

## Implemented Rule IDs

`CHARACTER-002`, `CHARACTER-005`, `TRAVEL-002`, `CLINIC-001`, `CLINIC-005`, `ALMANACK-004`, `ALMANACK-005`, `ALMANACK-006`, `SERVICE-001`, `SERVICE-002`, `SERVICE-005`, `TOOL-003`, `TOOL-005`, `WAGON-001`, `WAGON-002`, `WAGON-004`, `COMPANION-001`, `COMPANION-005`, `UX-001`, `AILMENT-005`.

모든 ID는 `PASS`다. 세부 closure evidence는 `RELEASE_1_0_CERTIFICATION.md`의 Release Blockers 표와 `RULE_TRACEABILITY.md` 각 행에 연결했다.

## Gameplay Closure

- Travel은 route의 Path/Waterway edge를 보존하고 Pedal Motor의 연속 수로 비용, Stop, Soak, protection을 구분한다.
- Familiar 12종, Tool 18종, Upgrade 7종, Wagon entry 10종, Companion 9종이 실제 행동 consumer에 연결된다.
- Clinic은 완료 Season 4회와 10 Agenda action을 사용한다.
- Guild Service 17종은 Move, delivery, target legality와 Spring restore까지 transaction으로 종료된다.
- Ailment p104-115 조건절 concordance를 추가하고 Hunted의 Spade Foraging 중단을 실행한다.
- `Seasonshift`와 `Smokesnout`를 포함한 narrative choice는 자동화하지 않고 기존 manual 분류를 유지한다.

## Canonical Write Audit

original gameplay의 affected path는 Travel, Service, Tool, Upgrade, Wagon, Companion, Clinic resolver 결과를 소비한다. legacy aggregate 필드는 migration/read adapter와 화면 호환에만 남으며 이번 blocker의 정상 action을 독립적으로 계산하지 않는다.

## Campaign Replay

Journey → Travel → Forage → Patient → Treatment → Printed Effect → Barter → Barrow → Downtime → Season → Archive → Reload → Continue를 완료했다.

외부 룰북을 펼친 횟수: **0회**.

## Verification

| Check | Result |
|---|---|
| Full tests | PASS, 13 files / 139 tests |
| New blocker regression | PASS, 8 tests |
| Rule validator | PASS, 4 tests |
| TypeScript | PASS |
| Lint | PASS |
| Production build | PASS |
| Migration/save | PASS, 5 files / 55 tests |
| Desktop/mobile | PASS |
| Long campaign | PASS, 5 scenarios |

Build warning은 App async chunk 551.62 kB 한 건이다. 기능·저장·규칙 정확성 경고는 없다.

## Release Decision

**Version 1.0: Ready, with documented non-blocking limitations.**

남은 Partial 24개는 A 12개 비차단 증거/디지털 한계, B 11개 의도적 narrative/player choice, C 1개 판본 내 모호성이다.
