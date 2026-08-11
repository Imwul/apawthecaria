# Apawthecaria-apo 원작 규칙 전수 감사

## 결론

Phase 10을 마친 현재 **Version 1.0 Release Blocker 20개는 모두 제거됐다.** 8개 Barrow, Leave, Replenish, Reconnect뿐 아니라 Character Style/Familiar, 구간별 Waterway, Clinic Agenda, Guild Service 후속, Tool/Upgrade, Wagon/Companion과 Ailment 조건 문구가 실제 gameplay consumer에 연결됐다.

남은 24개 `Partial`은 Release Blocker가 아니다. A 12개는 룰북 재참조가 필요 없는 호환·증거·디지털 한계, B 11개는 원문이 플레이어의 서사 판단을 요구해 의도적으로 manual인 항목, C 1개는 Wagon 가격의 판본 내 충돌이다. Encounter/Ailment의 서술·지도 후속 printed effect 347개는 자동화하지 않았고 기존 B/C 분류를 그대로 유지한다. original 정상 플레이의 legacy Patient/Companion/Wagon write는 0이며 migration·read adapter·legacy-campaign compatibility만 남겼다.

아래 초기 문제 설명은 감사 당시 근거를 보존한다. 현재 판정과 코드·테스트 위치의 권위 표는 `RULE_TRACEABILITY.md`다.

Release Candidate에서는 원본 p6-213을 다시 읽고 전체 판정을 재검토했다. 독립 행동 동료의 채집과 개발용 직접 보정 경로를 수정했지만 Rule ID 전체가 닫힌 항목은 없어 집계는 `Exact 84 / Partial 57 / Incorrect 0 / Missing 0 / UI-only 0 / Logic-only 2 / Ambiguous 2 / House Rule 6`으로 유지한다. 상세 근거와 출시 권고는 `RC_REPORT.md`에 기록했다.

Rulebook Replacement Step 2에서도 Rule ID 단위 집계는 바꾸지 않았다. 대신 `CORE-002`, `TRAVEL-009`, `FORAGE-006`, `AILMENT-003/005/007`, `SAVE-005`, `UX-001`의 manual 실행 근거를 보강했다. Printed Effect는 완성 메타데이터 `347/347`, 런타임 도달 불가 `0`, 전체 테스트 `11 files / 105 tests`다.

Rulebook Replacement Step 3에서는 `FORAGE-001`, `DOWNTIME-003`, `BARROW-001/002/004/005/006/008/009`를 `Partial → Exact`로 승격했다. 현재 집계는 `Exact 93 / Partial 48 / Incorrect 0 / Missing 0 / UI-only 0 / Logic-only 2 / Ambiguous 2 / House Rule 6`이며, 전체 테스트는 `12 files / 124 tests`다. `BARROW-007`, `TOOL-003/005`, `LEAVE-006`, Mobility와 Save/Offline 일부는 엄격한 단일 write 기준을 충족하지 않아 유지했다.

Rulebook Replacement Final Phase에서는 `BARROW-007`, `LEAVE-006`, `DOWNTIME-004/005`를 `Partial → Exact`로 승격했다. 현재 집계는 `Exact 97 / Partial 44 / Incorrect 0 / Missing 0 / UI-only 0 / Logic-only 2 / Ambiguous 2 / House Rule 6`이며, 전체 테스트는 `12 files / 131 tests`다. Tool·Wagon·Companion은 공통 transaction 연결을 확대했지만 원문 전체 고유 효과가 닫히지 않아 보수적으로 `Partial`을 유지했다.

Phase 10에서는 지정된 Release Blocker 20개만 `Partial → Exact`로 승격했다. 현재 집계는 `Exact 117 / Partial 24 / Incorrect 0 / Missing 0 / UI-only 0 / Logic-only 2 / Ambiguous 2 / House Rule 6`이며, 전체 테스트는 `13 files / 139 tests`다. Printed Effect는 `358/358`, manual narrative는 `347/347`, B 11개와 C 1개는 변동 없다.

Phase 11에서는 같은 20개 ID를 독립 재검증했다. 실제 graph 외 수로 덮어쓰기, Service direct write, Agenda 없는 Clinic 우회, Hive service-area 우회, Companion ID 불일치와 `PRESERVED` preparation 소비를 닫았으며 상태 집계는 변경하지 않았다. 전체 `13 files / 139 tests`, 외부 룰북 없는 canonical campaign, desktop/mobile 검증은 모두 통과했다.

## 감사 범위

### 기준 룰북

- *Apawthecaria*, First Edition, Third Printing, May 2023.
- 룰 본문 6-213쪽을 처음부터 끝까지 검토했다.
- 확인한 범위: 기본 카드 규칙, 캐릭터, 여정/지도/이동, 환자/질환, 채집/흥정/치료, 보상/실패, Downtime, Clinic, Almanack, Guild Services, Tools/Upgrades, Wagon/Companions, Travel/Foraging/Social Encounter, 8 Barrow Delves.
- co-op p48-53은 앱의 주 플레이 흐름에 구현되지 않은 선택 모드로 기록했다. 단독 플레이 정확성의 Critical 결함으로 세지는 않았지만, Send Package 등 Almanack 완전성에는 반영했다.

### 저장소

- `src/App.tsx`: 화면, 상태 전환, 행동 핸들러, 저장 호출, 무작위 판정.
- `src/rulesEngine.ts`: 태그/치료/보정 계산.
- `src/gameData.ts`: 질환, Reagent, 조우, Almanack 표.
- `src/firebase.ts`: 인증/클라우드 연결.
- `src/rulebook_ko.json`, `extracted_rulebook.json`: 번역/추출 룰북 자료.
- `package.json`: 빌드·린트·테스트 진입점.

### 감사 방식

1. 룰북을 플레이 결과가 달라지는 규칙군으로 분해하고 고유 Rule ID를 부여했다.
2. 각 ID에 발동 조건, 선택/강제 처리, 카드 판정, 수정치, 자원/상태 변화, 결과, 예외, 선후행 규칙, 관련 표와 대응 UI를 기록했다.
3. UI에서 입력한 값이 실제 상태와 저장 결과까지 어떻게 이어지는지 정적 추적했다.
4. 표는 행 수뿐 아니라 카드값/무늬, Season, Region/City, 준비법, 태그, Weight, Uses와 런타임 선택기를 함께 대조했다.
5. 앱에 함수나 문구가 있다는 사실만으로 `Exact` 판정을 주지 않았다.

## 판정 집계

감사 단위는 총 **151개**다. 원작 규칙군 133개와, 원작 진행을 디지털에서 보존하기 위한 저장·아카이브·오프라인·UX 무결성 요구 18개를 포함한다.

| 상태 | 수 | 의미 |
|---|---:|---|
| Exact | 117 | 입력부터 결과까지 확인한 범위에서 원작과 일치 |
| Partial | 24 | 출시를 막지 않는 호환·증거 한계 또는 의도적 서사/원문 모호성 |
| Incorrect | 0 | 현재 추적표에서 확인된 명시적 오판정은 없음 |
| Missing | 0 | 필요한 규칙은 최소 canonical 또는 manual 경로로 존재 |
| Unreachable | 0 | 코드가 있으나 정상 경로에서 도달 불가인 독립 규칙은 확인되지 않음 |
| UI-only | 0 | 문구만 있고 상태에 반영되지 않는 독립 규칙은 남기지 않음 |
| Logic-only | 2 | pure resolver는 있으나 전체 UI 연결이 남음 |
| Ambiguous | 2 | 판본 내 충돌 또는 허용 범위 불명확 |
| House Rule | 6 | 원작에 없고 플레이 결과를 바꾸는 앱 고유 규칙 |
| 합계 | 151 |  |

### Phase 2 변화

| 상태 | 이전 | 현재 | 변화 |
|---|---:|---:|---:|
| Exact | 6 | 44 | +38 |
| Partial | 63 | 65 | +2 |
| Incorrect | 51 | 23 | -28 |
| Missing | 14 | 5 | -9 |
| UI-only | 7 | 5 | -2 |
| Ambiguous | 3 | 2 | -1 |
| House Rule | 7 | 7 | 0 |

상태가 변경된 Rule ID:

`MAP-002/003/005`, `TRAVEL-001/004-009`, `PATIENT-001-004`, `AILMENT-001/002/004/006`, `REMEDY-001/004-007/009/010`, `FORAGE-002/003/005-008`, `DOWNTIME-001/003/004/006/007`, `CLINIC-002/006`, `COMPANION-003`, `TABLE-001-005`, `SAVE-002/003/005-008`, `UX-003`.

`Partial`이 여전히 가장 많은 이유는 핵심 엔진 밖의 Barter/Barrow/Service/Ending과 고유 printed effect가 남아 있기 때문이다. 수동 상태를 자동 완료로 간주하지 않았고, legacy 경로가 존재하는 Rule ID는 보수적으로 `Partial`을 유지했다.

### Phase 3 변화

| 상태 | 이전 | 현재 | 변화 |
|---|---:|---:|---:|
| Exact | 44 | 72 | +28 |
| Partial | 65 | 49 | -16 |
| Incorrect | 23 | 13 | -10 |
| Missing | 5 | 5 | 0 |
| UI-only | 5 | 4 | -1 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 7 | 6 | -1 |

상태가 변경된 Rule ID:

`JOURNEY-001/003/004/006`, `TRAVEL-008/010`, `AILMENT-003/005`, `REMEDY-001/002/003`, `FORAGE-008`, `BARTER-001/003/005-008`, `LEAVE-001/002/003/005`, `ENDING-001/002/003`, `TABLE-001/004`, `ARCHIVE-001-004`.

`TRAVEL-009`, `FORAGE-006`, `AILMENT-003/005/007`, `REMEDY-003/008`, `LEAVE-006`은 일부 실행기 또는 저장 경로가 있어도 수동 후속이나 미연결 획득 단계가 남아 있어 `Partial`을 유지했다. Printed Effect Registry의 존재만으로 `Exact`를 부여하지 않았다.

최종 검증은 5개 테스트 파일의 61개 테스트, Error/Warning 0인 canonical validator, production build, 데스크톱·모바일 핵심 흐름과 브라우저 콘솔을 포함한다. UI smoke에서 발견한 Archive 빈 상태 중복, Encounter 보류 재개방, save-import blocking alert, 모바일 가로 넘침은 수정 후 재확인했다. 기존 `App.tsx` lint 8 errors / 5 warnings와 500 kB 초과 build chunk 경고는 규칙 판정과 별개인 잔여 기술 부채로 기록한다.

### Phase 4 + Phase 5 변화

| 상태 | 이전 | 현재 | 변화 |
|---|---:|---:|---:|
| Exact | 72 | 82 | +10 |
| Partial | 49 | 59 | +10 |
| Incorrect | 13 | 0 | -13 |
| Missing | 5 | 0 | -5 |
| UI-only | 4 | 0 | -4 |
| Logic-only | 0 | 2 | +2 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 6 | 6 | 0 |

상태가 변경된 Rule ID:

`DOWNTIME-002`, `CLINIC-003`, `ALMANACK-001/002/005/006`, `SERVICE-001/003/004/005`, `TOOL-001/002/005`, `WAGON-003`, `COMPANION-002`, `BARROW-002/004/005/007/008/009`, `SAVE-008`, `OFFLINE-001/002/003`.

`Incorrect/Missing/UI-only`가 0이라는 것은 151개 규칙이 모두 자동화됐다는 뜻이 아니다. Barrow 전용 입력, Tool trigger, Floodplain 계절 UI, 모든 Trinket 지급 연결처럼 엔진 또는 manual 경로만 있는 항목을 `Partial`/`Logic-only`로 남겼고, printed effect 355개도 계속 manual이다.

### Phase 6 변화

| 상태 | 이전 | 현재 | 변화 |
|---|---:|---:|---:|
| Exact | 82 | 84 | +2 |
| Partial | 59 | 57 | -2 |
| Incorrect | 0 | 0 | 0 |
| Missing | 0 | 0 | 0 |
| UI-only | 0 | 0 | 0 |
| Logic-only | 2 | 2 | 0 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 6 | 6 | 0 |

상태가 변경된 Rule ID: `REMEDY-003`, `SAVE-004`.

`REMEDY-003`은 이름·Preparation·BR 12·Weight 2/3·target tag·획득 출처를 저장하고 실제 Forage/Barter 성공 뒤 provenance가 있는 Inventory item을 한 번만 commit한다. `SAVE-004`는 치료 draft를 schema v6에 저장하고 완료 transaction이 다시 열리지 않게 마이그레이션한다. `TOOL-003`과 `BARROW-001-009`는 공통 resolver/전용 정보 UI가 보강됐지만 모든 조작 경로가 canonical write로 교체되지는 않아 `Partial`을 유지했다.

Printed Effect는 7개 Ailment family의 기존 실행 경로를 registry 상태와 일치시켜 `implemented 3 → 10`, `manual 355 → 348`로 갱신했다. 서술·지도·대상 선택을 요구하는 348개는 자동 수치를 창작하지 않고 manual로 유지한다.

### Release Candidate 변화

| 상태 | Phase 6 | RC | 변화 |
|---|---:|---:|---:|
| Exact | 84 | 84 | 0 |
| Partial | 57 | 57 | 0 |
| Incorrect | 0 | 0 | 0 |
| Missing | 0 | 0 | 0 |
| UI-only | 0 | 0 | 0 |
| Logic-only | 2 | 2 | 0 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 6 | 6 | 0 |

재검토·보강 Rule ID: `CORE-002`, `CHARACTER-005`, `JOURNEY-001/003/004`, `FORAGE-001/006`, `AILMENT-003/005`, `REMEDY-003`, `DOWNTIME-001`, `CLINIC-001/002`, `SERVICE-001`, `BARROW-005`, `SAVE-001/005`, `UX-001/002`.

독립 행동 동료는 실제 카드와 canonical Foraging transaction을 사용하고 Encounter/Timer를 생략한다. 개발용 직접 자원·시간·조우 보정 버튼은 sandbox로 제한했다. 그러나 다른 Familiar 효과, graph 인접 검증, 347개 manual Printed Effect, Barrow/Tool/Downtime adapter가 남아 관련 `Partial` 상태는 유지했다.

### Rulebook Replacement Step 1 변화

| 상태 | RC | Step 1 | 변화 |
|---|---:|---:|---:|
| Exact | 84 | 84 | 0 |
| Partial | 57 | 57 | 0 |
| Incorrect | 0 | 0 | 0 |
| Missing | 0 | 0 | 0 |
| UI-only | 0 | 0 | 0 |
| Logic-only | 2 | 2 | 0 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 6 | 6 | 0 |

보강 Rule ID: `CORE-002`, `AILMENT-003`, `TOOL-003`, `SAVE-004`, `UX-001`.

`Bad Idea` Inspiration은 Potency 3/FOUL 조건, 업그레이드 또는 Weight 1/3 감소 선택, Inventory 차감, Patient 성공, Tool 저장을 하나의 transaction으로 처리한다. `Brand Care`와 `Forager's Twitch`는 진단 UI에서 resolver를 거쳐 Reputation, 추가 Requirement, Patient 상태, Journal에 저장된다. 이 세 규칙이 포함된 `AILMENT-003` 전체에는 아직 서술형 후속이 남아 `Partial`을 유지했다. Printed Effect 실행 상태는 `implemented 10 → 11`, `manual 348 → 347`이다.

### Rulebook Replacement Step 3 변화

| 상태 | Step 3 전 | Step 3 후 | 변화 |
|---|---:|---:|---:|
| Exact | 84 | 93 | +9 |
| Partial | 57 | 48 | -9 |
| Incorrect | 0 | 0 | 0 |
| Missing | 0 | 0 | 0 |
| UI-only | 0 | 0 | 0 |
| Logic-only | 2 | 2 | 0 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 6 | 6 | 0 |

상태가 변경된 Rule ID: `FORAGE-001`, `DOWNTIME-003`, `BARROW-001/002/004/005/006/008/009`.

- Barrow 8종 모두 실제 UI에서 pure resolver와 transaction ID를 사용한다. 그중 7개는 reload·중복 클릭·보상·지도 결과까지 닫혔고, Building Trust가 포함된 `BARROW-007`만 Patient/legacy 포인터 결합 때문에 `Partial`이다.
- Tool 구매·업그레이드·파손·소모는 stable instance ID를 보존하지만 모든 특수 trigger가 공통 layer를 사용하지 않아 `TOOL-003/005`는 `Partial`이다.
- General Practice는 canonical Ailment/Tag, 평판 등급, 5 Trinket, 영구 override, 치료/흥정 소비자와 schema v8 reload까지 연결됐다.
- 인접 채집은 normal, Independent, Scrounge 모두 실제 graph edge에서 만든 Region 후보를 engine에서 재검증한다.
- Leave의 명시적 버튼은 `resolveLeave()`를 사용하지만 Archive 및 `activeAilment` 호환 write가 resolver 밖에 있어 `LEAVE-006`을 승격하지 않았다.

### Rulebook Replacement Final Phase 변화

| 상태 | 이전 | 현재 | 변화 |
|---|---:|---:|---:|
| Exact | 93 | 97 | +4 |
| Partial | 48 | 44 | -4 |
| Incorrect | 0 | 0 | 0 |
| Missing | 0 | 0 | 0 |
| UI-only | 0 | 0 | 0 |
| Logic-only | 2 | 2 | 0 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 6 | 6 | 0 |

상태가 변경된 Rule ID: `BARROW-007`, `LEAVE-006`, `DOWNTIME-004`, `DOWNTIME-005`.

- Building Trust와 Leave는 Patient·Timer·Archive·Journal·Save를 resolver 결과 하나로 commit한다.
- Replenish는 여러 Reagent/Part를 한 활동에서 선택하고, Reconnect의 Ledger/Map/Gossip은 각각 Forage/Travel/Barter consumer에 연결됐다.
- Tool·Upgrade·Companion·Wagon은 공통 transaction 사용 범위를 넓혔지만 일부 고유 효과가 남아 관련 Rule ID는 `Partial`을 유지했다.
- original 정상 플레이에서 legacy Patient/Companion/Wagon 필드 write는 0이며 migration·read adapter·`legacy-campaign` compatibility만 남는다.

## 초기 감사 당시 Critical 문제

이 절은 최초 감사의 결함 근거다. Phase 2 현재 상태는 위 집계와 `RULE_TRACEABILITY.md`를 따른다.

### C-001: 원본 표 데이터와 런타임 선택 확률 붕괴

- 관련 규칙: `TABLE-001`~`TABLE-005`, `TRAVEL-008`, `FORAGE-006/008`.
- Travel은 기대 103행 대비 94행, Foraging은 144행 대비 123행이다.
- Social은 총 66행이지만 지역별 기대 `12/12/14/12/12/4`가 앱에서 `7/13/14/12/12/8`로 배치됐다.
- Foraging A-10은 선택기 키와 데이터 키가 달라 실제 행 대신 기본 문구로 폴백한다.
- 영향: 같은 카드라도 잘못된 지역/계절 조우가 나오거나 조우가 사라져 캠페인 확률과 자원이 달라진다.

### C-002: 환자 생성·심각도·복수 질환 모델 부재

- 관련 규칙: `PATIENT-001`~`PATIENT-004`, `AILMENT-001/002/004`.
- p28의 Personality/Descriptor 2장 추첨, p29의 Suit 심각도와 평판 상한이 없다.
- 앱은 단일 `activeAilment`만 보유해 상위 등급 M의 복수 질환과 Fight Marks/Groundhog/Soured Dough를 표현할 수 없다.
- 영향: 환자 정체성, 질환 확률, Timer, 치료 횟수와 실패 시점이 모두 원작과 달라진다.

### C-003: Reagent 데이터 모델이 핵심 규칙을 보존하지 못함

- 관련 규칙: `TABLE-003`, `REMEDY-001/005/006`, `AILMENT-006`.
- 룰북 83종 대비 앱은 81행/80고유종이다. 3종 누락, 1종 중복이며 49종의 태그 집합이 다르거나 없다.
- Common/Rare/Unavailable 3상태를 목록 포함 여부로 축약했고, 준비 Tool·Part Weight·Uses를 구조화하지 않았다.
- 모든 준비 Part가 Weight 1/3으로 생성된다.
- 영향: 무엇을 얻을 수 있는지, 어떤 도구가 필요한지, Carry, 치료 성공, Fair/Foul 보상이 연쇄 왜곡된다.

### C-004: 지도와 Path가 일반 이동의 권위 데이터가 아님

- 관련 규칙: `MAP-002/003`, `TRAVEL-001`, `JOURNEY-003`, `CLINIC-003`.
- 자유 텍스트 위치로 비인접/존재하지 않는 곳에 이동할 수 있고 실제 경로 대신 Speed를 이동 Path로 기록한다.
- 영향: 목적지 거리, 인접 채집/흥정, 3 Paths 교역, Clinic 범위, Guild Service와 Goal 판정이 모두 신뢰할 수 없다.

### C-005: Travel과 Social 조우의 배타 규칙 위반

- 관련 규칙: `TRAVEL-004`, `TABLE-005`.
- 룰북은 도착 위치에 따라 Travel **또는** Social 하나를 해결하지만 앱은 Settlement/City에서도 Travel을 뽑고 Social을 추가한다.
- 영향: 조우, 보상, 손실, 저널 프롬프트가 이중 발생한다.

### C-006: 특수 규칙이 표시만 되고 강제되지 않음

- 관련 규칙: `CORE-002`, `AILMENT-003`, `TRAVEL-009`, `BARROW-005/008`, `TOOL-003/005`.
- 질환, Encounter, Tool, Upgrade, Barrow의 특수 조건 대부분이 텍스트와 수동 버튼에 머문다.
- 영향: `must/cannot/unless` 효과를 생략하거나 요구를 충족하지 않고 보상을 받을 수 있다.

### C-007: 채집 한 번에 여러 종류 Reagent 획득 가능

- 관련 규칙: `FORAGE-005`.
- 원작은 한 Reagent를 찾고 그 Reagent의 Part 하나 이상을 채집하지만, 앱은 한 카드에서 조건을 만족한 여러 종류를 각각 획득하게 한다.
- 영향: 재료와 치료 가능성이 과도하게 늘어난다.

### C-008: Downtime 반복으로 무한 자원/능력 증가

- 관련 규칙: `DOWNTIME-001`~`DOWNTIME-007`.
- 원작은 여정 종료 후 활동 하나지만 앱은 여러 활동을 반복할 수 있다.
- 영향: Speed, Carry, 평판, Trinket, Tool 등을 제한 없이 얻을 수 있다.

### C-009: 진행 중 조우 저장 누락

- 관련 규칙: `SAVE-002/003/004`, `OFFLINE-003`.
- 활성 Travel/Foraging Encounter, 선택 중 Remedy, 일부 카드/모달이 영속 상태가 아니다.
- 영향: 새로고침으로 강제 조우 효과와 Forage 종료 Timer 비용을 건너뛰거나 판정을 다시 뽑을 수 있다.

### C-010: 저장 한도·순서·충돌로 진행 손실 가능

- 관련 규칙: `SAVE-006/007/008`, `OFFLINE-002`.
- 직렬화 데이터가 1MB를 넘으면 로컬 저장도 거부한다. 연속 비동기 쓰기에 queue/revision이 없고 오프라인 outbox/충돌 정책도 없다.
- 영향: 사진/긴 저널 또는 빠른 연속 행동에서 최신 진행이 사라지거나 오래된 상태로 덮일 수 있다.

## High 문제

| ID | 관련 규칙 | 요약 |
|---|---|---|
| H-001 | `CORE-001`, `BARTER-008`, `SERVICE-004`, `BARROW-004/007/009` | Q/K를 M=12로 통일하지 않아 일부 K=13, 일부 Q/K=10으로 판정한다. |
| H-002 | `BARTER-003/006` | 거리, Curiosity, 선택 Part 수정치와 혼합 결제가 원작과 다르다. |
| H-003 | `REMEDY-004/007`, `HR-005/006` | 조제 시간과 불완전 Remedy 투여가 원작에 없는 실패를 만든다. |
| H-004 | `LEAVE-005` | Pawn 보상이 Weight가 아닌 수량 기준이다. |
| H-005 | `ENDING-001/002`, `TRAVEL-010` | 목적지가 아니어도 종료 가능하고 고정 +5/-3 평판을 적용한다. |
| H-006 | `CLINIC-002/003` | Clinic이 즉시 완성되고 범위가 3이 아니라 5 Paths/같은 Region으로 확장된다. |
| H-007 | `BARROW-002/003` | Flee는 교착될 수 있고 일반 취소는 비용/의무를 우회한다. |
| H-008 | `ARCHIVE-001`~`ARCHIVE-004` | Archive는 편리하지만 원작 환자 속성, 보상/패널티, 명시적 상태와 결과 정규화가 불완전하다. |

## 초기 감사 당시 플레이 흐름 지도

```text
새 게임/기본 상태
  -> 캐릭터 생성 (성격/Style/Tool/Familiar 일부)
  -> 여정 시작 (Destination 카드, Goal, Urgency; Reason/지도 검증 누락)
  -> 일반 Move 또는 Soar (자유 텍스트 위치, 일부 장비 검사)
  -> Travel Encounter 생성
  -> Settlement/City이면 Social Encounter도 추가
  -> 1 Day 및 Local Help 차단 상태
  -> 진단 (환자 직접 입력 + 전체 질환 목록 선택)
  -> 단일 Ailment/Timer
  -> Forage 또는 Barter
     -> 잘못된 가용성/표/준비법 데이터로 Part 획득
  -> Remedy 조합/태그 파서
  -> 성공·실패, 평판/Trinket, Archive/Journal
  -> Journey 종료 (목적지 검증 없음, 고정 평판)
  -> 반복 가능한 Downtime / Clinic / 다음 Season
```

상태는 대부분 `App.tsx`의 큰 React 상태와 핸들러에 있고, 데이터는 `gameData.ts`, 일부 계산은 `rulesEngine.ts`, 저장은 Firebase와 localStorage fallback에 분산돼 있다. 같은 규칙이 화면 분기마다 재구현돼 카드값과 조건이 서로 달라지는 사례가 확인됐다.

## 초기 감사 당시 세부 영역 판정

### 캐릭터와 시작

- 초기 평판 5와 Urgency 구간은 구현됐다.
- Odoak/Spring은 p18의 권장안이므로 앱 기본 시작점이 다르다는 사실만으로 오류는 아니다.
- 시작 Journey의 Reason과 필수 저널 항목이 없고, 목적지 카드 조건을 실제 지도 선택에 강제하지 않는다.
- Familiar 신뢰, 계승/Legacy는 원작과 구분되지 않은 House Rule이다.

### 시간, Season, Weather

- Move의 1 Day와 Forage/Barter Timer 감소 일부는 존재한다.
- 독립 일일 Weather 표는 룰북에도 없다. Weather는 Encounter의 분류/효과다.
- 앱의 Forecast는 원작의 “다음 목적지까지” 대신 Move 횟수처럼 처리되고 조우 효과가 자동 적용되지 않는다.
- Season 전환이 캠페인 절차보다 수동 조작에 의존해 경계 시점과 Clinic 완료를 보장하지 않는다.

### Almanack와 Herbarium

- 주요 참고 목록과 검색 UI는 있으나 원본 표와 데이터가 다르므로 완전한 Almanack가 아니다.
- 발견, 현재 보유, 사용 이력, 잠금 정보가 모든 항목에서 일관되게 구분되지 않는다.
- Trinket을 받을 때마다 object/material/origin을 기록하는 p56 절차가 없다.
- Tool Upgrade는 다수 항목이 이름/설명만 저장되는 `UI-only`다.

### Patient Archive와 저널

- Archive는 이름, 종, 질환, 심각도, 태그, 위치, Season, 여정/날짜, 결과, Remedy, 메모, timestamp, bookmark 등 많은 필드를 보존한다.
- 다만 원작 환자 Personality/Descriptor를 생성하지 않으며 patientId, 명시적 status, 만남/치료 시점 분리, 보상/패널티 의미가 충분하지 않다.
- 저널은 자유 입력을 제공하지만 Journey Reason, Trinket 3장, 조우의 필수 기록을 진행 조건으로 연결하지 않는다.
- 자동 기록은 종이 저널을 보조할 수 있으나 플레이어 서술을 대체하거나 필수 단계를 조용히 생략해서는 안 된다.

### 오프라인

- 게임 표가 번들돼 있어 네트워크 없이 기본 화면과 localStorage fallback을 사용할 수 있다.
- 온라인과 오프라인이 다른 데이터 세트를 쓰는 문제는 확인되지 않았지만, 공통 번들 데이터 자체가 룰북과 다르다.
- 오프라인 변경 queue, 재시도, revision, conflict merge가 없어 온라인 복귀 시 최신성 보장이 없다.

## 모호한 규칙

상세한 해석 A/B와 권장안은 `RULE_DIFFERENCES.md`에 기록했다.

1. p43 Wagon 20 Trinkets와 p68 Wagon 15 Trinkets의 충돌.
2. p24에서 Waxed Satchel이 Loch에 “멈출 수 있는 적합 장비”인지의 범위.
3. p188의 계절 Suit 오탈자는 실제 p190-213 표 구조를 근거로 ♣/♠로 결정해 `TABLE-005 Exact`로 반영했다.

## 초기 수정 우선순위

아래 1-4, 6, 8번은 Foundation/Phase 2에서 완료됐다. 5번과 7번의 특수 효과·Ending 범위가 다음 단계 핵심이다.

1. 판본이 고정된 canonical data schema와 표 무결성 검사부터 복원한다.
2. 카드값/M, 지도 그래프/Path, Region/Season/City 선택기를 순수 규칙 함수로 만든다.
3. 환자 2장 생성, Severity/평판 상한, 복수 Ailment/Timer 상태 모델을 도입한다.
4. Reagent 준비법별 Tool/Weight/Uses/가용성 3상태와 Remedy 판정을 복원한다.
5. Encounter/Ailment/Tool/Barrow 특수 효과를 수동 텍스트가 아닌 명시 상태 전환으로 구현한다.
6. 결과 적용을 idempotent transaction으로 만들고 진행 중 판정까지 저장한다.
7. Downtime, Clinic, Ending과 House Rule을 원작 모드/선택 ruleset으로 분리한다.
8. Rule ID를 테스트 이름에 넣어 단위→상태 전환→E2E 순으로 고정한다.

## Phase 2 수정 결과

- Travel, Encounter, Foraging, Treatment, Patient, Timer, Downtime, Season engine을 실제 UI write path에 연결했다.
- schema v3와 pending 판정, transaction/effect idempotency, save revision/Firebase queue를 추가했다.
- legacy Save는 순차 migration하고 새 게임은 `original-1e-3p`를 유지한다.
- Phase 2 자동 테스트 13개를 추가해 총 38개가 됐다.
- 상세 구현과 남은 Stub은 `RULE_ENGINE_STATUS.md`, Phase 요약은 `PHASE2_REPORT.md`에 기록한다.

## Phase 3 수정 결과

- Journey 시작·목적지 후보·12 Goal·Ending을 지도 graph와 transaction으로 연결했다.
- Barter의 위치/시도/BR/Social/두 번째 카드/혼합 결제/복수 Timer 비용을 canonical transaction으로 교체했다.
- Scrounge와 Pawn을 복수 Timer, graph 인접성, Preparation Potency와 Weight 기준으로 교체했다.
- schema v4에 pending Barter/Journey/Ending/Leave/대체 획득과 canonical Archive를 보존한다.
- 358개 Encounter/Ailment 항목을 Printed Effect Registry와 Validator에 등록했다. 자동화되지 않은 항목은 숨기지 않고 `manual`로 기록했다.
- 상세 구현, 수동 범위와 61개 테스트 결과는 `PHASE3_REPORT.md`, `PRINTED_EFFECT_STATUS.md`, `RULE_ENGINE_STATUS.md`에 기록한다.

## Phase 4 + Phase 5 수정 결과

- 8 Barrow, 17 Guild Service, 18 Tool, 7 Upgrade, 10 Wagon entry, 9 Companion, 10 Clinic Agenda의 canonical data와 resolver를 추가했다.
- Rumour를 4장 표와 실제 graph 후보에 연결하고 자유 텍스트 위치를 제거했다.
- Wasps 10 Paths를 실제 INSECT Foraging transaction으로, Wagon 이동 능력을 canonical mobility state로 연결했다.
- schema v5, manual draft, service/delve/tool/companion state, offline outbox와 revision conflict 정책을 추가했다.
- Almanack을 lazy panel로 분리하고 긴 색인을 단계 렌더링했으며 360-1920px overflow를 확인했다.
- 전체 lint를 0 errors/0 warnings로 정리하고 테스트를 8 files / 80 tests로 확장했다.

## 검증 결과

| 검사 | 결과 | 비고 |
|---|---|---|
| Rule ID/상태 집계 | 통과 | 151개, 중복 ID 0; 상태 합계가 본문과 일치 |
| Markdown whitespace | 통과 | `git diff --check` 오류 없음 |
| TypeScript + production build | 통과 | `npm run build`; Vite chunk size 경고 1건만 발생 |
| Lint | 통과 | 전체 0 errors / 0 warnings; Babel 대형 파일 정보 메시지만 존재 |
| 단위/상태 전환 테스트 | 통과 | 13 files / 139 tests; Phase 10 blocker 8 tests와 전체 canonical campaign loop 포함 |
| 브라우저 검증 | 통과 | desktop/mobile 첫 페이지, 문서 가로 넘침 0, 새 console error 0 |

Production build는 boot entry, React, Firebase, canonical data, rules, Almanack과 App을 분리한다. 초기 entry는 2.57 kB, gzip 1.34 kB이고 App async chunk는 551.62 kB, gzip 147.75 kB여서 500 kB 경고 한 건은 남는다.

## 관련 문서

- `RULE_TRACEABILITY.md`: 151개 Rule ID의 규칙 명세와 코드/테스트 대응표.
- `RULE_DIFFERENCES.md`: House Rule, 편의 기능, 구현 오류, 번역/콘텐츠 차이, 모호성 결정 기록.
- `DATA_TABLE_AUDIT.md`: 질환/Reagent/Encounter/Almanack 표의 수량·중복·누락·확률 감사.
