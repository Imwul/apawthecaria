# Data Validation

## 실행 기준

- 판본: *Apawthecaria*, First Edition, Third Printing (May 2023)
- 실행일: 2026-08-09
- 명령: `npm run validate:rules`
- Build 연결: `npm run build`가 Validator를 먼저 실행함
- 결과: Error 0, Warning 0

## 데이터 개수

| 데이터셋 | 기대 | 실제 | 결과 |
|---|---:|---:|---|
| Reagents | 83 | 83 | Pass |
| Preparations | 1개 이상/Reagent | 189 | Pass |
| Ailments | 45 | 45 | Pass |
| Lesser / Intermediate / Severe / Dire | 12/11/11/11 | 12/11/11/11 | Pass |
| Travel Encounters | 103 | 103 | Pass |
| Foraging Encounters | 144 | 144 | Pass |
| Social Encounters | 66 | 66 | Pass |
| Regions | 7 | 7 | Pass |
| Seasons | 4 | 4 | Pass |
| Physical/Reference Tool records | 23 | 23 | Pass |
| p62-65 Almanack Tool entries | 18 | 18 | Pass |
| Tags | 22 | 22 | Pass |
| Printed Effect Registry | 313 Encounter + 45 Ailment | 358 | Pass |
| Barrow Delves | 8 | 8 | Pass |
| Guild Services | 17 | 17 | Pass |
| Tool Upgrades | 7 | 7 | Pass |
| Wagon catalogue entries | 10 | 10 | Pass |
| Companions | 9 | 9 | Pass |
| Clinic Agendas | 10 | 10 | Pass |

## 오류 검사 결과

| 검사 | 결과 | 상세 |
|---|---|---|
| 누락 Reagent/Ailment/Encounter key | 0 | 요구 개수 및 표 분포 충족 |
| Duplicate ID | 0 | 모든 데이터셋과 189 Preparation 전역 검사 |
| Invalid Region Reference | 0 | Reagent/Encounter 참조가 Region Registry에 존재 |
| Invalid Tool Reference | 0 | `none` 외 Preparation 도구가 Tool Registry에 존재 |
| Missing Preparation | 0 | 모든 Reagent에 1개 이상 존재 |
| Invalid Tag | 0 | Requirement와 Preparation이 중앙 Tag Registry만 참조 |
| Invalid Page/Source/Edition | 0 | p1-213, source.page 일치, 판본 일치 |
| Invalid Severity | 0 | 네 등급과 12/11/11/11 분포 일치 |
| Invalid Timer | 0 | 모든 Ailment Timer가 양의 정수 |
| Encounter Duplicate | 0 | ID 및 명시적 table key 검사 |
| Invalid Card Range | 0 | Travel/Foraging key와 Social suit 제한 충족 |
| Invalid Season | 0 | Season Registry 참조 및 계절별 key 검사 |
| Invalid Ruleset | 0 | `original-1e-3p` House Rule 전부 Off |
| Printed Effect Duplicate/Owner/Page/Executor/Rule ID | 0 | 358개 row 전부 유효한 owner, page, executor와 기존 Rule ID 참조 |
| Manual Effect Metadata | 0 | 347개 전부 trigger text, reason, decision, input, journal 지시 보유 |
| Runtime-unreachable Manual Encounter | 0 | Travel/Foraging/Social manual 행을 실제 Encounter 실행기에 전수 입력 |

## Warning 0

기존 경고 10행은 원본 PDF와 직접 대조해 제목·본문 요약·계절·페이지와 명시적 `implemented/manual` 상태를 복원했다.

- `travel-bog-m-winter`
- `travel-forest-a-2`
- `travel-meadow-a-2`
- `travel-mountain-9-10-winter`
- `travel-soar-9-10-summer`
- `travel-soar-9-10-autumn`
- `travel-soar-9-10-winter`
- `travel-soar-j-winter`
- `travel-soar-m-winter`
- `foraging-loch-j-winter`

Validator 경고가 0이라는 사실은 모든 printed effect가 자동화됐다는 뜻이 아니다. 358개 registry row 중 11개는 `implemented`, 347개는 안전한 자동 executor가 없어 `manual`이며, `PRINTED_EFFECT_STATUS.md`에서 별도 추적한다.

## 자동 테스트

현재 12개 Test File, 131개 Test가 다음을 고정한다.

- 83 Reagents와 189 Preparations
- 45 Ailments, Severity, Timer, 반복/Monarch 구조
- 103/144/66 Encounter와 모든 selector round-trip
- Region/Season/Tag/Tool registry
- Duplicate detection
- original/legacy Ruleset
- `v0 -> v1 -> ... -> v8` Save migration, 네 종류 hostile save와 gameplay idempotency 필드
- 복수 Ailment/Timer Patient 생성과 순수 Timer 감소
- Travel과 Social의 위치 유형별 단일 선택
- 실제 지도 route, Speed/Carry, 과적, Waterway, Soar 제한과 이동 차단
- Encounter 자동 효과/선택/manual fallback과 effect 중복 방지
- Foraging Availability/BR/FP/Tool/단일 Reagent/복수 Part/Timer 비용
- Treatment Tool/Tag/Catalyse/Uses/보상/선물의 원자적 transaction
- Bad Idea Inspiration의 구조화 선택, 도구 개조/Weight 감소, 취소 전 무차감과 idempotency
- Steel-Lined Mortar, Efficient Kettle, Double Boiler, Comb, Stilts, Instruments의 gameplay trigger
- Wagon upgrade 비용·Bark Coracle 회수, Passenger·Clay Pots·Companion Journey/season trigger transaction
- Replenish 다중 선택과 Reconnect Ledger/Map/Gossip 후속 consumer
- Brand Care와 Forager's Twitch 진단 효과의 Reputation/Requirement/Patient 저장
- Personality/Descriptor/Severity/Reputation/Monarch 환자 생성
- Downtime 1회 제한, General Practice/Lend a Paw, Season/Clinic/Companion 경계 효과
- 358개 Printed Effect owner/ID/Page/Executor/Rule ID 참조
- 347개 manual effect의 trigger별 source/decision/input/action/follow-up 완전성과 313개 Encounter 런타임 도달성
- 필수 입력 차단, action preview/원자적 commit, target 실패 무변경, 중복 transaction, Override, pending follow-up
- 경고 10개 Encounter의 원문 제목·source page·명시적 support 상태
- Barter 위치·시도·모든 BR 수정치·M=12·혼합 결제·복수 Timer·저장·중복 방지
- Journey graph 후보·Reason·12 Goal·Evidence Weight 1·목적지 Ending·원작 고정 평판 제거
- Scrounge 복수 Timer/인접 비용/Potency, Pawn Weight 반올림, Archive 실패 무결성
- Journey부터 Archive·schema v8 reload·다음 Journey 재개까지의 전체 canonical campaign loop
- 8 Barrow/17 Service/18 Tool/7 Upgrade/10 Wagon row/9 Companion/10 Agenda 수량과 source metadata
- Wasp 10 Paths 실제 INSECT Foraging pending, Honeybee milestone, Wagon commission/Soar/Waterway
- Rumour graph 후보, Clinic 3 Paths, Tool breakage/idempotency, Bandolier Weight
- schema v8 migration, v7 Barrow/Tool/Downtime 정규화, v6 manual partial draft/target/follow-up/record 복원, treatment draft replay 차단, Replacement provenance/중복 방지
- manual/service/tool/wagon/companion state, offline outbox/retry/conflict
- Independent Familiar의 실제 카드 기반 인접 채집, Encounter 생략, Timer 0
- 15 Paths Far Journey와 성공 Ending, 8계절 캠페인, Guild/Clinic/Downtime
- Dire 치료 실패, BR 12 Replacement, Pilfer 사망, schema v8 hostile-save와 v6 manual draft 보존
- 8개 Barrow의 UI-facing state machine, 중간 reload, M=12, reward, map removal, Pilfer Tool/death와 중복 transaction 방지
- stable duplicate Tool instance의 구매·업그레이드·파손·소모·reload와 Silver Sickle Foraging trigger
- General Practice 영구 Tag override의 reload 및 Treatment/Barter 소비, local/Common Replenish, nearest City Reconnect
- 실제 graph edge가 없는 인접 Foraging 거부와 Wagon expansion 비용의 단일 차감

검증 결과는 구조와 참조 무결성을 뜻한다. `manual-only` 또는 `structured-but-not-executed` 효과가 실제 게임 상태에 자동 반영됐다는 뜻은 아니다.

## 최종 명령 결과

| 명령 | 결과 |
|---|---|
| `npm run validate:rules` | Pass, 4 tests; Error 0 / Warning 0 |
| `npm test` | Pass, 12 files / 131 tests |
| `npm run test:rc` | Pass, 5 campaign/exception tests; full canonical loop 포함 |
| `npx tsc -b` | Pass |
| `npm run build` | Pass; initial entry 2.57 kB/gzip 1.34 kB, App async 533.87 kB/gzip 143.65 kB, 500 kB 경고 1건 |
| `npm run lint` | Pass; 0 errors / 0 warnings |
| Browser desktop/mobile | Pass; 첫 페이지·도감·지도, 문서 가로 넘침 0, 지도 라벨 겹침 0, console error 0 |

브라우저는 기존 로컬 캠페인을 바꾸지 않는 read-only smoke로 확인했다. Barrow/Tool/Downtime/Leave의 state-changing 직접 클릭은 수행하지 않았고 해당 흐름은 자동 resolver/UI-path 회귀 테스트로 검증했다.
