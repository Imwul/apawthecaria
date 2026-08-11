# Phase 11 Release Blocker Sprint

## Result

Release Blocker: **20 -> 0**.

이번 Sprint는 지정된 20개 Rule ID만 독립 재검증했다. 상태 수를 더 줄이지 않았고 새로운 Rule, UI, House Rule, narrative automation을 추가하지 않았다. B 11개, C 1개, manual Printed Effect 347개는 그대로 유지한다.

## Release Blockers

| Rule ID | Result | Verified closure |
|---|---|---|
| `CHARACTER-002` | PASS | 현재 Travel Style의 Speed, Carry, Soar만 canonical 이동에 반영된다. |
| `CHARACTER-005` | PASS | Familiar 12종과 Passenger 역할의 trigger가 실제 consumer를 사용한다. |
| `TRAVEL-002` | PASS | UI의 수로 덮어쓰기를 제거하고 route의 각 graph edge를 독립 판정한다. |
| `AILMENT-005` | PASS | p104-115 조건절과 `PRESERVED` preparation 결과가 치료 이력까지 저장된다. |
| `CLINIC-001` | PASS | 완료 Season 4회, Wild 치료, 15 Trinket을 resolver가 검증한다. |
| `CLINIC-005` | PASS | 10 Agenda의 해금 조건과 action을 엔진이 검증하며 Agenda 없는 Clinic 우회가 없다. |
| `ALMANACK-004` | PASS | 17 Service의 시작, Move, 선택 소비, 전달, 여정 종료 lifecycle이 transaction으로 닫힌다. |
| `ALMANACK-005` | PASS | 18 Tool의 준비, 이동, 채집, 치료, 파손, 소모 trigger가 연결된다. |
| `ALMANACK-006` | PASS | 7 Upgrade의 고유 trigger와 stable Tool identity가 유지된다. |
| `SERVICE-001` | PASS | Forecast는 다음 3 Move의 Weather Foraging 부정 효과만 막는다. |
| `SERVICE-002` | PASS | Shortcut, Hitch, Survey, Bridge, Taxi가 graph target과 후속 이동을 검증한다. |
| `SERVICE-005` | PASS | Retrieval, Send Package, Missive, News의 pending/consumer가 canonical state로 완료된다. |
| `TOOL-003` | PASS | Tent, Coracle, Cauldron, Alembic, Comb, Crossbow, Instruments 등 고유 trigger가 실행된다. |
| `TOOL-005` | PASS | Upgrade 효과는 Tool resolver만 사용하고 직접 Inventory 변경이 없다. |
| `WAGON-001` | PASS | Carry, Speed, Waterway span, Loch stop, Soar 비용을 Travel resolver가 계산한다. |
| `WAGON-002` | PASS | 10 Expansion과 Passenger, Clay Pots의 lifecycle이 Mobility transaction을 사용한다. |
| `WAGON-004` | PASS | Sealed, Shadow, Experimental 효과가 정확한 이동/도착 시점에만 적용된다. |
| `COMPANION-001` | PASS | 9종 ID와 rarity, timer, encounter, season, milestone consumer를 검증했다. |
| `COMPANION-005` | PASS | Journey 1회, Cranky 소모, 10 Paths 보상, Hive의 실제 Clinic 제한을 강제한다. |
| `UX-001` | PASS | 해당 행동은 canonical result 또는 명시적 manual transaction으로 끝난다. |

## Canonical Campaign

`Journey -> Travel -> Forage -> Patient -> Treatment -> Manual Printed Effect -> Barter -> Barrow -> Downtime -> Season -> Archive -> Reload -> Continue`

결과: **PASS**.

실제 replay 중 외부 룰북을 펼친 횟수: **0회**. 구현 대조에는 로컬 원본 Rulebook를 사용했지만 campaign 판정은 앱의 canonical data와 in-app manual resolution만 사용했다.

## Remaining Partial

남은 Partial은 **24개**이며 Release Blocker는 없다.

- A, 비차단 증거 또는 디지털 한계: 12개
- B, 의도적 narrative/player choice: 11개
- C, 판본 내 Wagon 가격 모호성: 1개

상세 Rule ID와 유지 이유는 `RELEASE_1_0_CERTIFICATION.md`의 Remaining Partial 표를 따른다.

## Verification

| Check | Result |
|---|---|
| Full tests | PASS, 13 files / 139 tests |
| Blocker regression | PASS, 8 grouped tests |
| Rule validator | PASS, 4 tests |
| TypeScript | PASS |
| Lint | PASS, ESLint error/warning 0 |
| Build | PASS |
| Migration | PASS, schema v8 and legacy migration |
| Desktop | PASS, console error/warning 0 |
| Mobile | PASS, document horizontal overflow 0 |
| Canonical campaign | PASS |

## Performance

| Metric | Before | After |
|---|---:|---:|
| Historical main bundle | 691.33 kB | 2.57 kB entry |
| App async chunk | bundled in main | 554.13 kB |
| App gzip | 185.45 kB historical main | 148.51 kB |

Almanack, rules, canonical data, React, Firebase는 별도 chunk다. App async chunk의 500 kB 경고 한 건은 남지만 gameplay 또는 저장 blocker는 아니다.

## Certification

**Can the application now be released as Version 1.0?**

**YES, WITH KNOWN LIMITATIONS**

**Can a player complete an entire canonical campaign while consulting the rulebook only for intentionally narrative or GM-decided moments?**

**YES**

Final Recommendation: **Version 1.0 Ready**.

이 Phase 보고서는 Version `1.0.0`의 역사적 인증 근거로 보존한다. 현재 production freeze의 gate와 배포 결과는 `RELEASE_CHECKLIST_1.0.0.md`가 추적한다.
