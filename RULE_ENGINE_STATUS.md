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
| `resolveRumour()` | Implemented + UI | 네 장 표, actual graph 방향·Region·Path 후보, redraw, Downtime 1회 | `DOWNTIME-002` |
| Clinic resolvers | Implemented | completed-Season commission, next Season, 3 Paths service area, 10 global Agenda action/Income/Patient consumers | `CLINIC-001-006` |
| Almanack/manual resolvers | Implemented | 현재 manual312개 직접 판정 task, effect-specific input, canonical preview/commit, Defer/Override, pending follow-up | `CORE-002`, `TRAVEL-009`, `FORAGE-006`, `AILMENT-003/005/007`, `UX-001` |
| Save queue | Implemented | schema v9, v0-v9 sequential migration, route/treatment/manual draft recovery, monotonic revision, local-first outbox | `SAVE-001/004/005/006-008`, `OFFLINE-001-003` |

## Release Candidate 보강

| 함수/경로 | 상태 | RC 검증 |
|---|---|---|
| `resolveForaging()` Independent source | Implemented | 실제 카드 draw, 인접 Region 후보, Encounter 없음, Timer 0, canonical pending/Inventory |
| Journey campaign chain | Implemented | 15 Paths Far destination, Evidence, successful ending, 원작 succession Off |
| Two-year season chain | Implemented | 8 Downtime + 8 Season boundary, Clinic activation, Guild Forecast, Caterpillar transformation |
| Failure/Replacement/Death | Implemented + engine-chain 재검증 | Dire treatment failure와 Pilfer 사망은 기존 검증; Replacement는 새BR12 획득·즉시 조제·소비·reload·결제 재개·영구 도감 테스트 확인 |
| Recovery controls | Sandbox only | Travel/Forage/Social 직접 자원·시간·조우 보정은 원작/legacy 정상 UI에서 숨김 |

## Phase 10 Release Blocker 제거

| 경로 | 상태 | 검증 |
|---|---|---|
| Character Style/Familiar | Implemented | 현재 Style만 Soar 권한을 가지며 Familiar 12종과 Passenger 역할이 실제 Travel/Forage/Patient/Barter 값에 연결됨 |
| Mixed Waterway Travel | Implemented | route edge별 Path/Waterway, 연속 수로 비용, Stop/Soak/Protection을 엔진이 계산함 |
| Clinic/Guild Service | Implemented | 완료 계절, 10 Agenda, 17 Service의 Move/Delivery/Spring 후속 consumer가 transaction으로 종료됨 |
| Tool/Upgrade | Implemented | 18 Tool과 7 Upgrade의 조건부 trigger, Granite POUND, Knitting, 파손·소모가 canonical state를 사용함 |
| Wagon/Companion | Implemented | 10 Expansion, Passenger 목적지, Clay Pots 2 Move, 9 Companion의 주기·보상·제약이 Mobility transaction을 사용함 |
| Ailment wording | Implemented concordance | p104-115 gameplay 조건절을 구조화하고 자동/선택/manual consumer를 연결하며 현재312 manual 분류와 명시적 후속 판정을 유지함 |

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
| `createReplacementAcquisition()` / `commitAlternativeAcquisition()` | Implemented + 새 engine-chain 검증 | 대체재 자체BR12 판정→실제Part→도구·uses·조제·소비·JSON migration·결제 재개; 성공한 정의는 영구 도감에 남고 실패에는 생성하지 않음. 새 목록 UI의 브라우저 점검은 별도 기록 | `REMEDY-003` |
| Archive normalizer/upsert | Implemented | 여섯 상태, 복수 질환·Timer·보상/패널티·transaction 보존과 실패 덮어쓰기 방지 | `ARCHIVE-001-004` |

모든 pure resolver는 React, localStorage, Firebase에 의존하지 않는다. 결과는 `resolved`, `manual`, `invalid` 중 하나이며 상태를 바꾸는 경로는 transaction/effect ID를 사용한다.

## Printed Effect Registry

- Encounter 313개와 Named Ailment 45개, 총 358개 owner에 고유 registry row가 있다.
- 각 row는 trigger, prerequisites, 상태 변화 범주, follow-up, journal, manual 이유, source page, Rule ID, executor, test를 가진다.
- 현재 registry/Golden Master 계약은 implemented46개와 manual312개다. 전체358개를 자동 처리하는 것으로 표시하지 않는다. Registry 등록이나 구조 필드만으로 자동 구현 완료로 간주하지 않는다.
- manual312개는 직접 판정으로 등록돼 있다. 과거347/347 메타데이터 보강·172개 canonical 후보·90개 후속 판정 수치는 당시 기록이며 현재 실행 분류를 대체하지 않는다.
- 원문 경고 10행은 제목·페이지·계절·상태를 다시 대조했다. 자동화가 안전하지 않은 후속 카드, 지도 표식, 아이템 선택은 구체적인 manual decision으로 남겼다.
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
- schema v8은 v7 상태를 보존하면서 active Barrow Delve, stable duplicate Tool instance, `nextMoveSpeedOverride`, canonical Wagon과 영구 Ailment Tag override를 정규화하고, schema v9은 편집 중 Route draft를 canonical node/connector 상태로 복원한다.
- Almanack은 registry 하나를 사용해 자동 처리, 선택 필요, 직접 처리, 모호함을 표시하고 필터링한다.
- Barrow field note는 8개 Delve의 canonical 정의와 저장된 진행 단계뿐 아니라 모든 실행 버튼을 pure resolver transaction에 연결한다.
- `activeAilment`, `activeBarter`, legacy casebook은 구버전 migration/read adapter로만 남아 있다. `original-1e-3p`의 저장 wrapper는 legacy Patient/Companion 포인터 write를 제거하며 Building Trust와 Leave는 canonical 결과만 commit한다.

## 남은 Stub 또는 Manual

- 현재312개 printed effect row는 자동 executor가 아닌 명시적 manual 상태다. 지도 생성, 후속 카드, 장기 NPC 상태는 앱이 결론을 만들지 않고 플레이어 판정과 pending follow-up으로 보존한다.
- Version 1.0 당시 Partial24개의 분류는 과거 기록이다. 2026-10-03 재감사에서는 Replacement의 이전 완료 판정을 철회한 뒤 새 획득·소비·저장 경계·영구 도감 테스트에 따라 다시 Exact로 판정했다. 현재 상태와 근거는 `RULE_TRACEABILITY.md`의 개별 행을 따른다.
- Wagon의 p43 Commission Wagon20개/p68 Base Unit15개 충돌은 원문 안의 모호성이다. 앱은 도시의 휴식기 위탁 절차 p43의20개를 채택하며 작업 화면과 최종 확인에서 근거를 설명한다.
- 장신구 보상 때 한 개를 기록하는 요구와 p56의 선택 영감 세 장 드로우를 구별한다. 선택 생성기가 모든 보상에서 자동 실행되지 않는 것 자체는 필수 규칙 위반이 아니다.
- same-revision 충돌은 local 보존과 알림으로 처리하며 자동 field merge는 하지 않는다.

## Version 1.0 검증 결과 (과거 baseline)

- `npm test`: 19 files / 165 tests 통과. Golden Save, Rule Registry, Printed Effect snapshot과 responsive/reachable-action regression guard를 포함한다.
- `npm run test:rc`: 5개 시나리오 통과. Journey → Travel → Forage → Patient → Treatment → Manual → Barter → Barrow → Downtime → Season → Archive → Reload → Continue 전체 loop 포함.
- `npm run validate:rules`: Error 0 / Warning 0.
- `npm run lint`: Error 0 / Warning 0.
- `npm run build`: 성공. 초기 entry 2.60 kB/gzip 1.36 kB, App async 611.56 kB/gzip 165.49 kB이며 500 kB 경고 한 건은 남는다.
- desktop/mobile browser smoke: 가로 overflow 0, 지도 라벨 겹침 0, 첫 페이지·도감·지도 가독성과 console error 0을 확인했다.

## Version 1.0 판정

- Release Blocker: `20 → 0`.
- 외부 룰북 참조: `0회`.
- Printed Effect: `358/358`; manual narrative `347/347` 유지.
- Version 1.0 당시 판정: **Ready, with documented non-blocking limitations.** 새 감사에서 확인한 결함과 이후 검증을 대체하지 않는다.

## 2026-10-03 UI/규칙 재감사 통합

- 사용자 승인 범위: 감사 후보1~30 중27 협동 모드 확장 제외. 외국 약재, Replacement, 복수 회분, 이동 거리, 현재 행동·시간 표시를 보강한다. 이전 데이터나 registry 존재만으로 끝까지 구현된 것으로 표시하지 않는다.
- 여행/채집 조우와 controlled 선택·안내·클라우드 모달에 공유 포커스 처리 적용: 진입, Tab순환, 배경 inert, 닫은 뒤 복귀. Escape는 미해결 조우와 입력 메모를 저장하여 보류한다.
- 판정 버튼 옆에 미완료 선택·기록·추가 카드와 해당 입력으로 이동하는 버튼을 표시한다. native prompt 입력은 맥락·취소·자원 예고를 가진 controlled UI로 교체했다.
- 클라우드 용량 초과는 실제 UTF-8크기·한도·기기 저장 상태·백업/복구 방법을 화면에 표시한다. 백업은 편집 초안을 flush한 최신 저장을 JSON으로 내보내며, 초기화 확인은 백업 보존 선택을 먼저 제공한다.
- 통합 125파일/1,287테스트와 build(규칙·원문 registry·tsc 포함)·lint·diff 검사 통과. 새 용량 판정·복구2개와 Replacement/Foreign/Bear13개 engine-chain 테스트를 포함한다. JSON migration·결제 재개·소비 뒤 영구 도감 보존을 확인한다. Drawer sourceguard는 공유 포커스 hook 연결과 키보드/배경/복귀 계약을 확인하도록 갱신했다. 초기119파일/1,243테스트 통과는 재감사 이전 결과다.
- 로컬 UI로 환자 생성→채집→교환→두 부위 조제→취소/재시도→보상 checkpoint reload→한 번 확정→진료 마감→여정 종료→휴식기→계절 전환→새 여정 준비를 확인했다. 후속 현지 진료에는 외부 기록 UI 검증 fixture를 사용했으며 추가 자동 치료로 세지 않는다. 직접 판정 창의 조우 뒤 겹침을 고치고 Escape후 선택·메모 재개, 원문 서랍 Tab순환·Escape복귀를 확인했다. 상세 증거와 제한은 `output/design-thinking-workspace-renewal-2026-10-03.md`를 따른다.
- 실제 초보 사용자 테스트와 배포는 실시하지 않았다. 로컬 preview의 에이전트 점검을 사용자 검증으로 서술하지 않는다.
