# Rule Engine Status

## Phase 6 구현 상태

| 함수 | 상태 | 현재 책임 | Traceability |
|---|---|---|---|
| Barrow resolvers | Implemented, UI adapter partial | 8 Delve state machine, Flee, M=12, identity, Timer, reward, map removal, idempotency | `BARROW-001-009` |
| `resolveGuildService()` | Implemented + manual follow-up | 17 Service, graph mutation, cost/location/path, delivery pending, Spring restore | `SERVICE-001-005` |
| `resolveToolEffects()` / Tool resolvers | Implemented, gameplay wiring partial | 공통 phase context, 선택, base identity, trigger, Weight, charge, breakage, consumed, idempotency | `TOOL-001-005` |
| Mobility resolvers | Implemented | Wagon commission/expansion/capability와 Companion path/season milestone | `WAGON-001-004`, `COMPANION-001-005` |
| `resolveRumour()` | Implemented + UI | 네 장 표, actual graph 방향·Region·Path 후보, redraw, Downtime 1회 | `DOWNTIME-002` |
| Clinic resolvers | Implemented, agenda effects partial | commission, next Season, 3 Paths service area, global Agenda/Income | `CLINIC-001-006` |
| Almanack/manual resolvers | Implemented, reward wiring partial | 3-card Trinket record, manual draft validation, lazy reference index | `ALMANACK-001-006` |
| Save queue | Implemented | schema v6, treatment draft, local-first outbox, retry, same-revision conflict, ordered writes | `SAVE-001/004/006-008`, `OFFLINE-001-003` |

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
- 현재 자동 완료는 실행기와 테스트가 확인된 10개 행이며 348개는 `manual`이다. Registry 등록이나 구조 필드만으로 자동 구현 완료로 간주하지 않는다.
- 원문 경고 10행은 제목·페이지·계절·상태를 다시 대조했다. 자동화가 안전하지 않은 후속 카드, 지도 표식, 아이템 선택은 구체적인 manual decision으로 남겼다.
- Brand Care, Forager's Twitch, Pinned by Pine, Quagmire's Scale, Stingshock, Wake, Wormridden을 포함한 실행 가능한 Ailment 예외는 registry 상태와 실제 실행기를 맞췄다. 나머지 서술·지도·후속 환자 결과는 manual이다.

전체 목록은 `PRINTED_EFFECT_STATUS.md`가 권위 상태표다.

## UI와 Persistence 연결

- Journey Setup은 자유 텍스트 Destination을 받지 않고 실제 지도 후보만 제공한다.
- Barter 모달은 Social → 두 번째 카드 → 혼합 결제/포기의 pending 단계를 표시하고 각 카드를 저장한다.
- Ending은 목적지와 상태 근거를 보여주고 원작 모드에서 고정 Reputation을 적용하지 않는다.
- Scrounge/Pawn/Archive는 canonical Patient와 Inventory를 소비하며 결과를 UI에 표시한다.
- 미해결 Encounter는 저장 상태를 유지한 채 화면에서 보류할 수 있고, 진행판에서 다시 열 수 있다.
- Save import 결과는 blocking alert 대신 화면 상태 메시지로 표시한다.
- canonical Archive가 존재하면 legacy casebook이 비어 있어도 잘못된 빈 상태를 표시하지 않는다.
- schema v6는 치료 확정 전 선택과 Replacement 획득 출처를 저장하며 완료 transaction의 draft 재생을 차단한다.
- Almanack은 registry 하나를 사용해 자동 처리, 선택 필요, 직접 처리, 모호함을 표시하고 필터링한다.
- Barrow field note는 8개 Delve의 canonical 정의와 저장된 진행 단계를 한 화면에 표시한다.
- `activeAilment`, `activeBarter`, legacy casebook은 구버전 읽기와 기존 화면 표시 adapter로만 남아 있다. 새 Barter/Journey/Archive 판정은 canonical state를 쓴다.

## 남은 Stub 또는 Manual

- 348개 printed effect row는 자동 executor가 아닌 명시적 manual 상태다. 특히 지도 생성, 후속 카드, 대상 아이템 선택, 장기 NPC 상태는 다음 전사 단계가 필요하다.
- `resolveLeave()`는 pure core와 테스트가 있으나 모든 legacy 환자 포기 UI를 하나의 transaction으로 교체하지는 못했다.
- Barrow 정보 UI는 canonical definition을 직접 읽지만 조작 handler 일부는 legacy adapter가 남는다.
- Tool/Upgrade 공통 layer는 구현됐지만 모든 gameplay 진입점에서 호출되지는 않는다.
- same-revision 충돌은 local 보존과 알림으로 처리하며 자동 field merge는 하지 않는다.

## 다음 Phase 권장 순서

1. Barrow 8종 조작부를 pure resolver transaction에 직접 연결해 legacy Delve write를 제거한다.
2. Tool/Upgrade 공통 layer를 Travel/Forage/Treatment/Barter/Barrow/Downtime/Season 진입점에 연결한다.
3. `PRINTED_EFFECT_STATUS.md`의 deterministic/structured-choice 행을 원문 순서대로 executor로 이동한다.
4. `resolveLeave()`와 남은 legacy 환자 포기 UI를 하나의 transaction으로 합친다.
