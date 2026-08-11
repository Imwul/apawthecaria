# Apawthecaria Rulebook Replacement Final Phase Report

## Release Recommendation

**PARTIAL**

정상 `original-1e-3p` 캠페인은 Journey부터 Archive·Reload·Continue까지 legacy gameplay write 없이 진행된다. 그러나 Tool, Wagon, Companion, Clinic, Service와 질환별 후속 효과 중 일부가 여전히 수동 또는 불완전한 consumer에 의존하므로 “룰북을 완전히 대체한다”는 최종 선언은 보류한다.

## Rule Coverage

| Status | Before | After | Change |
|---|---:|---:|---:|
| Exact | 93 | 97 | +4 |
| Partial | 48 | 44 | -4 |
| Incorrect | 0 | 0 | 0 |
| Missing | 0 | 0 | 0 |
| UI-only | 0 | 0 | 0 |
| Logic-only | 2 | 2 | 0 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 6 | 6 | 0 |
| Total | 151 | 151 | 0 |

`Partial → Exact`: `BARROW-007`, `LEAVE-006`, `DOWNTIME-004`, `DOWNTIME-005`.

## Canonical Completion

| Priority | Result | Canonical path |
|---|---|---|
| BARROW-007 | PASS | Building Trust resolver가 Patient·Timer·Archive·Journal·Save·Settlement를 한 번에 commit |
| LEAVE-006 | PASS | `resolveLeave()`가 Patient·Timer·Reputation·obligation·Archive를 원자 처리 |
| TOOL-003 | PARTIAL | Forage/Treatment/Travel/Social trigger는 연결; Canvas Tent Weather 분류 등 일부 남음 |
| TOOL-005 | PARTIAL | 구매·Upgrade·파손·소모 identity는 canonical; Granite Mortar 등 일부 효과 남음 |
| COMPANION | PARTIAL | 입양·보관·Journey reset·Beetle/Pond/Cranky·season은 Mobility transaction; 9종 전체 조건은 미완 |
| WAGON | PARTIAL | commission·upgrade·Coracle·Passenger·Clay Pots·Shadow·Soar는 transaction; Pedal 등 전체 수명주기 미완 |
| REPLENISH | PASS | 여러 Reagent/Part/수량을 한 Downtime transaction에서 검증·추가 |
| RECONNECT | PASS | Ledger → Forage FP, Map → Travel draw, Gossip → Barter 소비 연결 |
| SAVE | PASS | schema v8 유지, v0-v8 migration과 legacy field 보존, 새 format 없음 |
| UX | PASS | 다음 행동판, desktop/mobile 첫 페이지·도감·지도 가독성 확인 |

## Legacy Gameplay Write Audit

정상 `original-1e-3p` gameplay의 legacy Patient/Companion/Wagon write: **0**.

남은 legacy 코드는 아래 용도뿐이다.

- v0-v8 migration
- 구버전 save read adapter와 화면 projection
- `legacy-campaign` House Rule compatibility
- `sandbox` 수동 보정 도구

제거한 dead code는 legacy Travel/Forage/Diagnose handler, Building Trust setter, 중복 Downtime state, 미사용 Reagent helper와 도달 불가능한 pre-v8 `activeBarter` 모달이다.

## Campaign Validation

자동 장기 캠페인은 다음 순서를 한 시나리오에서 실행했다.

`Journey → Travel → Forage → Patient → Treatment → Manual Resolution → Barter → Barrow → Downtime → Season → Archive → JSON Save → schema v8 Reload → Continue`

별도 RC 시나리오에서 15-Path 장거리 여정, 2년/8계절, Clinic, Guild, 치료 실패, 희귀 Replacement, Pilfer 사망과 hostile legacy save도 검증했다.

## Printed Effects

| Class | Count | Status |
|---|---:|---|
| Deterministic | 7 | automated |
| Structured Choice | 4 | automated choice |
| Narrative manual | 347 | in-app resolution complete |
| Ambiguous | 0 | none |
| Total | 358 | reachable 358/358 |

347개 manual effect는 자동 narrative로 바꾸지 않았다. 모두 원문 trigger, 입력, 선택, Defer/Override, journal, pending follow-up과 schema v8 복원을 가진다.

## Remaining Partial

| Rule ID | Reason |
|---|---|
| `CORE-001` | 일부 독립 compatibility 수치 helper의 M=12 적용을 전부 고정하지 않았다. |
| `CORE-002` | 347개 서술형 결과는 canonical manual이지만 자동 executor는 아니다. |
| `CORE-003` | 자유 서술과 원작 변경 Override의 구분이 모든 구형 화면에서 동일하지 않다. |
| `CORE-004` | 일부 핵심 단계는 필수 저널 문장 없이 진행할 수 있다. |
| `CHARACTER-001` | 12개 성격 선택부터 저장까지의 독립 전체 흐름 테스트가 없다. |
| `CHARACTER-002` | 일부 legacy Travel Style 계산에 원문 밖 이동 권한이 남아 있다. |
| `CHARACTER-003` | 시작 Tool/Memento가 구매 transaction과 같은 identity 경로를 전부 쓰지 않는다. |
| `CHARACTER-004` | Reputation 구간 전체 효과를 소유하는 단일 resolver가 없다. |
| `CHARACTER-005` | Independent 외 Familiar 고유 효과 일부가 legacy helper에 남아 있다. |
| `CHARACTER-007` | Familiar 관계 12행의 분포를 validator가 독립 고정하지 않는다. |
| `TRAVEL-002` | UI가 선택 route 전체를 하나의 Waterway 여부로 단순화한다. |
| `TRAVEL-009` | 서술형 Travel 결과는 앱 내 manual resolution이다. |
| `PATIENT-005` | 복수 Timer core는 canonical이지만 일부 서비스 시간 후속은 별도 adapter다. |
| `AILMENT-003` | 45개 질환의 서사·지도·후속 카드 결과 일부는 manual이다. |
| `AILMENT-005` | 모든 may/must/cannot/unless 번역의 독립 원문 대조가 남아 있다. |
| `AILMENT-007` | 질환별 실패 예외 다수가 manual 후속이다. |
| `REMEDY-008` | 질환별 Consequence는 치료 transaction 뒤 manual transaction일 수 있다. |
| `FORAGE-006` | 서술형 Foraging 결과는 앱 내 manual resolution이다. |
| `DOWNTIME-007` | p43 Wagon 20과 p68 Base Unit 15의 판본 관계가 모호하다. |
| `CLINIC-001` | 설립 UI가 canonical Season 외 legacy 누적 일수도 읽는다. |
| `CLINIC-004` | 모든 Clinic service area 표시가 같은 graph consumer를 쓰지 않는다. |
| `CLINIC-005` | Agenda 일부는 manual이며 Garden이 전역 하나로 축약된다. |
| `ALMANACK-003` | 모든 항목의 사용 이력과 중복 instance를 저장하지 않는다. |
| `ALMANACK-004` | Guild Service 후속 일부가 manual 또는 별도 handler다. |
| `ALMANACK-005` | Tool 18종 중 일부 고유 trigger가 실제 행동 화면에 미연결이다. |
| `ALMANACK-006` | Upgrade 7종 중 일부 고유 trigger가 실제 행동 화면에 미연결이다. |
| `SERVICE-001` | Forecast가 모든 manual Weather 결과를 자동 억제하지는 않는다. |
| `SERVICE-002` | Shortcut/Hitch/Survey/Bridge 후속이 단일 consumer로 완전히 통일되지 않았다. |
| `SERVICE-004` | canonical M=12 외 legacy service 표현 adapter가 남아 있다. |
| `SERVICE-005` | Retrieval/Send Package 수령은 저장되는 manual follow-up이다. |
| `TOOL-003` | Canvas Tent Weather 등 일부 Tool trigger가 공통 layer에 미연결이다. |
| `TOOL-005` | Granite Mortar 등 일부 Upgrade 효과가 판정 지점에 미연결이다. |
| `WAGON-001` | route별 Waterway와 Passenger 부담의 모든 조합을 강제하지 않는다. |
| `WAGON-002` | Pedal Motor·Clay Pots 등 10종 전체 수명주기가 완결되지 않았다. |
| `WAGON-004` | 일부 Expansion 효과와 manual Encounter 결합 결과가 자동 보장되지 않는다. |
| `COMPANION-001` | 9종 전체의 고유 주기·조건·보상을 자동화하지 않았다. |
| `COMPANION-005` | 일부 위치·타이밍 조건은 manual 확인이 필요하다. |
| `TABLE-006` | Character Personality/Relationship 표 전체 분포 validator가 없다. |
| `SAVE-001` | 실제 browser storage write 중단을 주입하는 원자성 테스트가 없다. |
| `SAVE-006` | 같은 revision의 동시 편집을 field merge하지 않는다. |
| `SAVE-007` | cloud 용량 초과 알림이 화면이 아니라 console 중심이다. |
| `OFFLINE-003` | 일부 legacy 임시 modal은 random seed를 저장하지 않는다. |
| `UX-001` | Tool/Companion/Wagon 일부 예외의 다음 행동 안내가 균일하지 않다. |
| `UX-002` | 지도·모바일 visual regression이 자동 스냅샷 테스트는 아니다. |

## Performance

| Metric | Before | After |
|---|---:|---:|
| Initial main entry | 691.33 kB | 2.57 kB |
| Initial main gzip | 185.45 kB | 1.34 kB |
| App payload | main entry에 포함 | async 533.87 kB / gzip 143.65 kB |
| 500 kB warning | present | present, App async chunk 1건 |

Rules, canonical data, React, Firebase, Almanack과 App이 별도 chunk다. gameplay 동작은 바꾸지 않았다.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Tests | PASS | 12 files / 131 tests |
| RC campaign | PASS | 5 scenarios, full loop 포함 |
| Rule validator | PASS | 4 tests, Error 0 / Warning 0 |
| Build | PASS | TypeScript + Vite production |
| Lint | PASS | Error 0 / Warning 0; 대형 App 정보 메시지만 존재 |
| Migration | PASS | v0-v8, unknown field, Barrow/Tool/Manual/Companion 보존 |
| Desktop | PASS | 첫 페이지·도감·지도, overflow/console error 0 |
| Mobile | PASS | 273 effective px, overflow/지도 라벨 겹침/console error 0 |
| Long campaign | PASS | 2년, 15 Paths, 실패·Replacement·사망·Reload·Continue |
| Legacy gameplay write | PASS | original 정상 경로 0 |

## Final Question

**Can the application now replace the Apawthecaria rulebook for an entire campaign without relying on legacy gameplay paths?**

**PARTIAL**

Legacy gameplay path에는 의존하지 않지만, 위 44개 Partial Rule ID 때문에 모든 원문 효과를 앱만으로 정확히 자동 판정한다고 선언할 수는 없다. 다만 347개 narrative effect는 앱 안에서 완결되는 canonical manual resolution이므로, 플레이어는 진행 보존과 직접 판정을 위해 구형 gameplay path로 돌아갈 필요가 없다.
