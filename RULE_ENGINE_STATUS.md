# Rule Engine Status

## Version 1.0 구현 상태

| 함수 | 상태 | 현재 책임 | Traceability |
|---|---|---|---|
| Barrow resolvers | Implemented | 8 Delve UI/action state machine, Building Trust Patient/Archive closure, Flee, M=12, identity, Timer, reward, map removal, death, reload, idempotency | `BARROW-001-009` |
| `resolveGuildService()` | Implemented | 17 Service, graph mutation, cost/location/path, Move duration, delivery completion, Spring restore | `SERVICE-001-005` |
| `resolveToolEffects()` / Tool transactions | Implemented | stable instance identity, purchase/upgrade, 공통 phase trigger, Weight, charge, breakage, consumed, idempotency와 gameplay consumer | `TOOL-001-005` |
| Canonical Downtime resolver | Implemented | General Practice, 다중 Replenish, Explore, Self Improvement, Reconnect와 Ledger/Map/Gossip 소비를 1회 transaction으로 처리 | `DOWNTIME-003-005` |
| `resolveLeave()` | Implemented | Patient·모든 Timer·Archive·Reputation·obligation·journal을 한 transaction으로 처리 | `LEAVE-006` |
| Mobility resolvers | Implemented | Wagon commission/upgrade/capability, Passenger, Clay Pots, Companion 입양·보관·Journey/Move/season trigger를 transaction으로 처리 | `WAGON-001-004`, `COMPANION-001-005` |
| `resolveRumour()` | Implemented + UI | 네 장 표, actual graph 방향·Region·Path 후보, redraw, City에서 끝낸 Journey당 1회(별도 Downtime Activity는 소비하지 않음) | `DOWNTIME-002` |
| Clinic resolvers | Implemented | completed-Season commission, next Season, 3 Paths service area, 10 global Agenda action/Income/Patient consumers | `CLINIC-001-006` |
| Almanack/manual resolvers | Implemented | trigger별 336개 직접 판정 task, effect-specific input, canonical preview/commit, Defer/Override, pending follow-up | `CORE-002`, `TRAVEL-009`, `FORAGE-006`, `AILMENT-003/005/007`, `UX-001` |
| Save queue | Implemented | schema v9, v7–v9 additive Barrow/Tool/Downtime/Encounter-map/Knitting/Trinket migration, treatment/manual draft, resolution/override/follow-up, local-first outbox | `SAVE-001/004/005/006-008`, `OFFLINE-001-003` |

## Release Candidate 보강

| 함수/경로 | 상태 | RC 검증 |
|---|---|---|
| `resolveForaging()` Independent source | Implemented | 실제 카드 draw, 인접 Region 후보, Encounter 없음, Timer 0, canonical pending/Inventory |
| Journey campaign chain | Implemented | 15 Paths Far destination, Evidence, successful ending, 원작 succession Off |
| Two-year season chain | Implemented | 8 Downtime + 8 Season boundary, Clinic activation, Guild Forecast, Caterpillar transformation |
| Failure/Replacement/Death | Implemented | Dire treatment failure, BR 12 Weight 2/3 acquisition, Pilfer 21 초과 사망 |
| Recovery controls | Sandbox only | Travel/Forage/Social 직접 자원·시간·조우 보정은 원작/legacy 정상 UI에서 숨김 |

## Phase 10 Release Blocker 제거

| 경로 | 상태 | 검증 |
|---|---|---|
| Character Style/Familiar | Implemented | 현재 Style만 Soar 권한을 가지며 Familiar 12종과 Passenger 역할이 실제 Travel/Forage/Patient/Barter 값에 연결됨 |
| Mixed Waterway Travel | Implemented | route edge별 Path/Waterway, 연속 수로 비용, Stop/Soak/Protection을 엔진이 계산함 |
| Clinic/Guild Service | Implemented | 완료 계절, 10 Agenda, 17 Service의 Move/Delivery/Spring 후속 consumer가 transaction으로 종료됨 |
| Tool/Upgrade | Implemented | 18 Tool과 7 Upgrade의 조건부 trigger, Granite POUND, 누적 Knitting 프로젝트, 파손·소모가 canonical state를 사용함 |
| Wagon/Companion | Implemented | 10 Expansion, Passenger 목적지, Clay Pots 2 Move, 9 Companion의 주기·보상·제약이 Mobility transaction을 사용함 |
| Ailment wording | Implemented concordance | p104-115 gameplay 조건절을 구조화하고 자동/선택/manual consumer를 연결하며 전체 336 manual 분류를 유지함 |

## Phase 3 기반 엔진

| 함수 | 상태 | 현재 책임 | Traceability |
|---|---|---|---|
| `resolveTravel()` | Implemented | graph route, Speed/Carry, Waterway, Soar, 일수와 도착 Encounter transaction | `MAP-002/003`, `TRAVEL-001/002/004-008` |
| `resolveEncounter()` / `executeEncounter()` | Implemented + manual fallback | 선택 강제, 구조화 자원·Timer·조건 효과, effect idempotency; 미전사 효과는 저장 가능한 `manual` 반환 | `CORE-002/003`, `TRAVEL-009`, `FORAGE-006` |
| `resolveForaging()` | Implemented | Region/Season/Tool/Availability/Rarity/FP, 한 Reagent의 Part, Inventory와 후속 Timer 비용 | `FORAGE-001-008`, `REMEDY-001/005/006` |
| `resolveTreatmentTransaction()` | Implemented + special fallback | Part/Tool/AST/FAIR/FOUL/Catalyse/Uses/성공·실패를 원자적으로 적용하고 핵심 Ailment 예외 우선 | `AILMENT-003/006/007`, `REMEDY-004-010` |
| `resolvePatient()` | Implemented | Personality/Descriptor, Severity, Reputation cap, Monarch 복수 질환과 반복 instance/Timer | `PATIENT-001-004`, `AILMENT-002/004` |
| `resolveSeason()` / `resolveDowntime()` | Implemented core + manual activities | Downtime 1회, Clinic/Garden/Income/Companion 계절 경계와 서술 활동 분리 | `DOWNTIME-001/003-007`, `CLINIC-002/005/006` |
| `resolveBarterStart/Encounter/Offer/Payment/Leave()` | Implemented | graph 위치·시도, canonical BR, Social pending, M=12, 혼합 결제, 모든 Timer 비용과 중복 방지 | `BARTER-001-008`, `REMEDY-001/008` |
| `resolveJourneyStart()` | Implemented | Destination 카드의 방향·거리·유형을 graph 후보에 강제하고 Reason/Goal/Urgency/Justice Evidence 저장 | `JOURNEY-001/003/004/006` |
| `evaluateJourneyGoal()` / `recordJourneyProgress()` | Implemented | 12 Goal의 Inventory·Location·Treatment·Journal 근거와 서술 선언을 분리해 추적 | `JOURNEY-004` |
| `resolveJourneyEnding()` | Implemented | 목적지·Goal·pending·환자 확인, 성공/부분/실패/중단, 회고, Downtime과 ruleset별 stakes | `TRAVEL-010`, `ENDING-001-003` |
| `resolveScrounge()` / `resolvePawn()` / `resolveLeave()` | Implemented core | 복수 Timer 비용, graph 인접 채집, Potency 2 보장 Part, Weight Pawn, Move 전 obligation | `LEAVE-001-006`, `REMEDY-008` |
| `resolveAilmentTimerEffect()` 등 | Implemented subset | Pinned, Quagmire, Groundhog, Brand Care 등 일반식보다 앞선 질환별 상태 전환 | `AILMENT-003/005/007` |
| `createMakeDoAcquisition()` | Implemented | +1 Potency 조건을 pending으로 저장하고 실제 canonical Part 획득을 확인 | `REMEDY-002` |
| `createReplacementAcquisition()` / `commitAlternativeAcquisition()` | Implemented + UI | 이름·Preparation·Rarity 12·Weight 2/3·출처를 저장하고 실제 Forage/Barter 성공 뒤 provenance와 함께 1회 commit | `REMEDY-003` |
| Archive normalizer/upsert | Implemented | 여섯 상태, 복수 질환·Timer·보상/패널티·transaction 보존과 실패 덮어쓰기 방지 | `ARCHIVE-001-004` |

모든 pure resolver는 React, localStorage, Firebase에 의존하지 않는다. 결과는 `resolved`, `manual`, `invalid` 중 하나이며 상태를 바꾸는 경로는 transaction/effect ID를 사용한다.

## Printed Effect Registry

- Encounter 313개와 Named Ailment 45개, 총 358개 owner에 고유 registry row가 있다.
- 각 row는 trigger, prerequisites, 상태 변화 범주, follow-up, journal, manual 이유, source page, Rule ID, executor, test를 가진다.
- 현재 자동 완료는 실행기와 테스트가 확인된 22개 행이며 336개는 `manual`이다. Registry 등록이나 구조 필드만으로 자동 구현 완료로 간주하지 않는다. `Muddy Waters`는 필수 카드 판정이 있어 자동 완료에서 제외했다.
- 336개 manual 행은 모두 trigger별 해결 메타데이터와 전용 UI를 가진다. 완성 `336/336`, 도달 불가 `0`; canonical action 후보와 저장되는 후속 판정은 실제 원문 선택이 있을 때만 제공한다.
- 원문 경고 행은 제목·페이지·계절·상태를 다시 대조했다. p.75–84의 후속 카드는 같은 판정 위저드에서 처리하고, Carpe Carp-ey·Need For Speed·Pi-rats!의 여러 장 비교와 Q/K→M(12) 의미를 보존한다. 최단 이동·Path·봉쇄·현재 Location 한정 Rarity 변화는 실제 graph/state에 반영한다.
- Bad Idea, Brand Care, Forager's Twitch, Pinned by Pine, Quagmire's Scale, Stingshock, Wake, Wormridden을 포함한 실행 가능한 Ailment 예외는 registry 상태와 실제 실행기를 맞췄다. 나머지 서술·지도·후속 환자 결과는 manual이다.

전체 목록은 `PRINTED_EFFECT_STATUS.md`가 권위 상태표다.

## UI와 Persistence 연결

- Journey Setup은 자유 텍스트 Destination을 받지 않고 실제 지도 후보만 제공한다.
- Barter 모달은 Social → 두 번째 카드 → 혼합 결제/포기의 pending 단계를 표시하고 각 카드를 저장한다.
- Ending은 목적지와 상태 근거를 보여주고 원작 모드에서 고정 Reputation을 적용하지 않는다.
- Scrounge/Pawn/Archive는 canonical Patient와 Inventory를 소비하며 결과를 UI에 표시한다.
- 미해결 Encounter는 저장 상태를 유지한 채 화면에서 보류할 수 있고, 진행판에서 다시 열 수 있다.
- Save import 결과는 blocking alert 대신 화면 상태 메시지로 표시한다.
- canonical Archive가 존재하면 legacy casebook이 비어 있어도 잘못된 빈 상태를 표시하지 않는다.
- schema v9은 v8 상태를 보존하면서 Encounter 지도 mutation, 누적 Knitting 프로젝트, p.56 획득 묶음별 대표 Trinket 원장을 추가한다. 기존 active Barrow Delve, stable duplicate Tool instance, `nextMoveSpeedOverride`, canonical Wagon과 영구 Ailment Tag override도 그대로 정규화한다.
- Almanack은 registry 하나를 사용해 자동 처리, 선택 필요, 직접 처리, 모호함을 표시하고 필터링한다.
- Barrow field note는 8개 Delve의 canonical 정의와 저장된 진행 단계뿐 아니라 모든 실행 버튼을 pure resolver transaction에 연결한다.
- `activeAilment`, `activeBarter`, legacy casebook은 구버전 migration/read adapter로만 남아 있다. `original-1e-3p`의 저장 wrapper는 legacy Patient/Companion 포인터 write를 제거하며 Building Trust와 Leave는 canonical 결과만 commit한다.

## 남은 Stub 또는 Manual

- 336개 printed effect row는 자동 executor가 아닌 명시적 manual 상태다. 그 안에서도 p.75–84의 단일·다중 후속 카드와 지도 결과는 구조화된 consumer가 실행하며, 서사와 장기 NPC 선택은 플레이어 판정과 pending follow-up으로 보존한다.
- 공유 Guild save 기반 멀티플레이 전달 원장은 사용자 결정에 따라 범위에서 제외했다. 싱글플레이 Send Package 기록 흐름은 유지한다.
- 24개 남은 Partial은 Release Blocker가 아니다. A 12개는 호환·검증·디지털 한계, B 11개는 의도적 narrative/player choice, C 1개는 p43/p68 Wagon 가격 충돌이다.
- same-revision 충돌은 local 보존과 알림으로 처리하며 자동 field merge는 하지 않는다.

## Version 1.0 검증 결과

- `npm test`: 26 files / 203 tests 통과. Golden Save, Rule Registry, Printed Effect snapshot, Encounter 지도·단일·다중 후속 카드, 누적 Knitting, 획득 묶음별 Trinket provenance와 responsive/reachable-action regression guard를 포함한다.
- `npm run test:rc`: 5개 시나리오 통과. Journey → Travel → Forage → Patient → Treatment → Manual → Barter → Barrow → Downtime → Season → Archive → Reload → Continue 전체 loop 포함.
- `npm run validate:rules`: Error 0 / Warning 0.
- `npm run lint`: Error 0 / Warning 0.
- `npm run build`: 성공. App async 693.69 kB/gzip 188.34 kB이며 500 kB 경고 한 건은 남는다.
- desktop/mobile browser smoke: 1280px/390px에서 문서 가로 overflow 0, 지도 레이어와 영어 Region 표기, `이어서 걷기`의 여정 작성 화면 전환, console warning/error 0을 확인했다.

## Version 1.0 판정

- Release Blocker: `20 → 0`.
- 외부 룰북 참조: `0회`.
- Printed Effect: `358/358`; automatic/structured `22`, manual `336/336`.
- Version 1.0: **Ready, with documented non-blocking limitations.**
