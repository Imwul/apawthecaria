# Apawthecaria 규칙 추적표

## 기준과 읽는 법

- 기준본: *Apawthecaria*, First Edition, Third Printing (May 2023), 룰 본문 6-213쪽.
- 감사 단위: 플레이 결과를 독립적으로 바꿀 수 있는 규칙군이다. 한 행에 같은 발동 시점과 결과를 공유하는 세부 문장을 묶었다.
- `규칙 명세`는 `발동 조건 → 플레이어 선택 / 강제 처리; 판정·수정치; 자원·상태 변화 → 결과; 예외·선후행` 순서로 적었다.
- 상태는 `Exact`, `Partial`, `Incorrect`, `Missing`, `Unreachable`, `UI-only`, `Logic-only`, `Ambiguous`, `House Rule` 중 하나만 사용했다.
- 자동 테스트 열은 해당 Rule ID를 이름에 포함한 Vitest 검증을 가리킨다. `없음`은 아직 룰북 기대값을 고정하는 자동 테스트가 없다는 뜻이다.
- 코드 위치는 감사 시점의 핵심 진입점이다. `App.tsx`의 여러 UI 분기에 같은 규칙이 중복돼 있으면 대표 함수만 적었다.

## 기본 원칙과 캐릭터

| Rule ID | 룰북 | 규칙 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| CORE-001 | p6 | 카드 판정 → A=1, 2-10은 숫자, J=11, Q/K는 Monarch(M)=12; 표가 정한 예외 우선 | 모든 카드 판정 | `App.tsx:drawPlayingCard`, `cardRuleValue` | Partial | 없음 | 표 조회에는 M=12를 쓰지만 일부 수치 판정은 K=13을 그대로 사용한다. |
| CORE-002 | p6 | 일반 규칙과 특정 항목 충돌 → 특정 카드·질환·도구 문구를 우선 적용 | 조우·질환·도구 | `printedEffects.ts`, `almanackEngine.ts`, encounter/ailment resolvers | Partial | `phase6Engine.test.ts`, `gameplayEngine.test.ts`, `manualResolution.test.ts [CORE-002]` | 22개 자동/선택형은 실행되고 336개 직접 판정형은 trigger별 원문·입력·상태 변화·후속 판정을 갖춘 처리 경로를 사용한다. |
| CORE-003 | p7 | 플레이어는 기록과 흐름을 자기 방식으로 조정할 수 있음; 의도적으로 규칙을 깨는 것은 선택이며 기본 판정은 원작 규칙 | 전체 | 자유 입력 UI | Partial | 없음 | 자유 입력과 앱이 강제하는 고정 보상/시간 규칙이 구분돼 있지 않다. |
| CORE-004 | p7 | 장면과 판정 결과를 저널에 서술; 자동화는 서술 선택권을 대체하지 않음 | 저널 | 저널 편집 UI | Partial | 없음 | 저널은 있으나 다수 핵심 단계에서 기록을 건너뛰어도 진행된다. |
| CHARACTER-001 | p10 | 새 캐릭터 → d12 성격 묘사 또는 직접 선택; 12개 항목 | 캐릭터 생성 | 생성 마법사, `gameData.ts` | Partial | 없음 | 선택지는 있으나 생성 결과와 필수 저널 연결을 검증하지 않는다. |
| CHARACTER-002 | p11 | 새 캐릭터 → 4개 Style 중 하나; 이후 해당 고유 효과 적용 | 캐릭터 생성·행동 | 캐릭터 생성, canonical Downtime, Travel adapter | Exact | `phase10ReleaseBlockers.test.ts [CHARACTER-002/CHARACTER-005]` | 원작 모드는 현재 선택된 Style의 Speed·Carry·Soar만 사용하고 Style 변경 시 이전 비행 권한을 남기지 않는다. |
| CHARACTER-003 | p12 | 시작 장비 → 5 Basic Tool과 Memento 규칙에 따라 구성; 무게 적용 | 캐릭터 생성·가방 | 생성 마법사, inventory state | Partial | 없음 | 기본 구성은 있으나 준비 방법/무게 체계가 이후 데이터와 불일치한다. |
| CHARACTER-004 | p13 | 평판 5로 시작; 0/15/25/35 구간이 심각도·보정·해금에 영향 | 상태판 | reputation state | Partial | 없음 | 초기값과 일부 보정은 있으나 심각도 추첨·Rumour 조건 등과 완전히 연결되지 않는다. |
| CHARACTER-005 | p14-15 | Familiar → d12 종류 또는 선택; 각 동물의 명시 효과만 적용 | 캐릭터·동료 | familiar data, Foraging/Travel/Barter/Patient consumers | Exact | `gameplayEngine.test.ts [CHARACTER-005/FORAGE-001/FORAGE-006]`, `phase10ReleaseBlockers.test.ts [CHARACTER-002/CHARACTER-005]` | 12종의 고유 보정·선택·주기와 Passenger 역할을 실제 행동 값에 연결하고 원작 모드의 동료 비행·방수 권한을 제거했다. |
| CHARACTER-006 | p14-15 | Familiar 효과 값은 고정 | Familiar 신뢰 UI | `rulesEngine.ts:getFamiliarReduction` | House Rule | 없음 | 신뢰 40/80에서 -2가 -3/-4로 강화되는 원작 외 성장 규칙이다. |
| CHARACTER-007 | p16 | Familiar와의 관계 → d12 또는 선택, 서술에 사용 | 캐릭터 생성 | relationship options | Partial | 없음 | 관계 기록은 있으나 12개 표와 저장 필드의 완전 대응이 검증되지 않는다. |
| CHARACTER-008 | 해당 없음 | 은퇴/계승 → 특정 평판·장비·재화를 후계자에게 전달 | 계승 UI | succession handlers | House Rule | 없음 | Sickle, 평판 10, Trinket 8 등 원작에 없는 캠페인 규칙이다. |

## 여정, 지도, 이동

| Rule ID | 룰북 | 규칙 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| JOURNEY-001 | p18 | 여정 시작 → Origin, Season, Destination, Reason, Goal, Urgency를 정하고 기록 | 여정 시작 | `journeyEngine.ts`, `App.tsx:handleStartJourney` | Exact | `phase3Engine.test.ts [JOURNEY-001]` | 여섯 항목과 Origin·Season·Goal 맥락·Urgency 저널 답변을 시작 transaction에 함께 저장하며 필수 기록이 비면 시작을 거부한다. |
| JOURNEY-002 | p18 | 첫 세션은 Odoak/Spring 권장일 뿐 강제가 아님 | 초기 설정 | default state | Exact | 없음 | 앱 기본값은 다르지만 권장 규칙이므로 결과 위반은 아니다. |
| JOURNEY-003 | p19 | 목적지 카드 → 값으로 정착지 규모/거리, 무늬로 방향 결정; 지도에서 조건에 맞는 실제 목적지 선택 | 여정 시작·지도 | `findJourneyDestinationCandidates()` | Exact | `phase3Engine.test.ts [JOURNEY-003]` | 카드 방향·거리·위치 유형에 맞는 실제 graph 후보만 선택할 수 있다. |
| JOURNEY-004 | p20-21 | Goal → 12개 표에서 추첨/선택; 목표별 완료 조건 사용 | 여정·종료 | `JOURNEY_GOALS`, `getJourneyGoalForCard()`, `evaluateJourneyGoal()` | Exact | `phase3Engine.test.ts [JOURNEY-004]` | A–J/M 카드값을 12개 Goal에 고정하고 Q/K를 M으로 처리한다. 시작 화면은 추첨 즉시 Purpose·완료 조건·Goal별 기록 질문을 표시하며 답변을 여정과 함께 보존한다. |
| JOURNEY-005 | p21 | Urgency → 평판 구간에 따라 12/9/6/3일; 0이 돼도 여정은 계속 | 여정 상태 | `getJourneyUrgency()`, day state | Exact | `phase3Engine.test.ts [JOURNEY-005]` | 네 평판 구간 수치를 고정 테스트하고, 시작 화면에 기한 초과 후에도 날짜를 계속 표시하며 결말이 달라질 수 있다는 규칙과 Goal 연계 기록을 제공한다. |
| JOURNEY-006 | p21, p116 | Justice Goal → Evidence를 들고 귀환; Evidence Weight 1 | 가방·목표 | `resolveJourneyStart()` | Exact | `phase3Engine.test.ts [JOURNEY-001/JOURNEY-006]` | Justice 시작 transaction이 Weight 1 Evidence를 canonical Inventory에 추가한다. |
| MAP-001 | p19, 지도 | 목적지·이동 선택은 인쇄 지도 경로와 지역/위치 유형을 사용 | 지도 | map data/render | Ambiguous | 없음 | 시각 지도 전체 좌표·경로를 원본 지도 이미지와 기계적으로 대조할 원천 구조가 없다. |
| MAP-002 | p22 | 일반 이동 → 현재 위치와 경로로 연결된 다음 위치만 선택 | 이동 폼 | `travelEngine.ts`, `executeCanonicalTravelMove` | Exact | `gameplayEngine.test.ts [MAP-002]` | 지도 graph에 없는 목적지와 연결되지 않은 route를 엔진이 거부한다. |
| MAP-003 | p22 | 경로 수는 실제 지나간 연결선으로 계산 | 이동 폼·여정 기록 | `travelEngine.ts:validateRoute` | Exact | `gameplayEngine.test.ts [MAP-003]` | 실제 edge를 통과한 route 길이를 path count로 기록한다. |
| MAP-004 | 편의 기능 | 지도 pan/zoom은 화면 조작일 뿐 게임 내 이동·시간을 바꾸지 않음 | 지도 | pointer handlers | Exact | 없음 | 감사한 코드 경로에서는 pan 자체가 게임 이동을 호출하지 않는다. |
| MAP-005 | 저장 요구 | 저장·재개 후 현재 위치·방문 위치·지도 상태 복원 | 지도 | schema v3 persisted state | Exact | `engine.test.ts [MAP-005]` | 위치·방문 목록·custom graph가 버전 저장 상태에서 복원되고 새 이동은 graph 검증을 거친다. |
| TRAVEL-001 | p22 | Move → Speed만큼 실제 Paths 이동; 과적 시 Speed=1 | 이동 | `travelEngine.ts:resolveTravelEngine` | Exact | `gameplayEngine.test.ts [TRAVEL-001]` | 실제 route 길이와 Speed를 일치시키고 Carry 초과 시 Speed 1을 강제한다. |
| TRAVEL-002 | p22 | 수로 이동 → 이동 수단/규칙을 충족; 젖음과 장비 보호 적용 | 이동 | `travelEngine.ts`, graph-backed travel adapter | Exact | `gameplayEngine.test.ts [TRAVEL-002]`, `phase10ReleaseBlockers.test.ts [TRAVEL-002/WAGON-001/WAGON-004]` | 실제 route의 각 edge가 Path/Waterway를 유지하며 연속 수로 비용, 정지, 젖음, 보호를 구간별로 판정한다. |
| TRAVEL-003 | p24 | Loch에 멈춤 → 적합한 장비가 있어야 함 | 이동 | `hasLochStoppingGear` | Ambiguous | 없음 | Waxed Satchel을 허용하는 해석은 문맥상 가능하지만 허용 범위가 명시적 목록은 아니다. |
| TRAVEL-004 | p22-25 | 도착 후 위치 유형에 따라 Travel 또는 Social Encounter 하나를 해결 | 이동·조우 | `travelEngine.ts` | Exact | `engine.test.ts`, `gameplayEngine.test.ts [TRAVEL-004]` | 도착 유형으로 한 Encounter family만 선택하고 pending transaction 하나를 저장한다. |
| TRAVEL-005 | p25 | Move 완료 후 1 day 표시; 조우와 후속 의무를 처리 | 이동·달력 | `travelEngine.ts` | Exact | `gameplayEngine.test.ts [TRAVEL-005]` | 일반 Move는 1 day를 적용하고 조우를 미완료 상태로 보존한다. |
| TRAVEL-006 | p25 | Local Beasts 도움 필요 결과 → 해결 전 다음 Move 불가 | 이동·조우 | `travelEngine.ts`, action hub | Exact | `gameplayEngine.test.ts [TRAVEL-006]` | Move 결과가 도움 의무를 세우며 다음 engine Move를 차단한다. |
| TRAVEL-007 | p24-25 | Soar → 방문한 위치로 직선 이동; 미방문 Ruin/Barrow 불가; 해당 계절 Soar 조우; 과적/일반 Wagon 불가 | 이동 | `travelEngine.ts` | Exact | `gameplayEngine.test.ts [TRAVEL-007]` | Carry, 방문 Titan/Barrow, 일반 Wagon, Soar encounter와 Contraption 3일을 엔진이 검증한다. |
| TRAVEL-008 | p25 | 현재 계절에 맞는 지역/Soar 조우를 카드 규칙대로 선택 | 이동·조우 | canonical encounter selector | Exact | `gameplayEngine.test.ts`, `phase3Engine.test.ts [TRAVEL-008]` | 103개 행의 지역·계절·카드 key를 원문 기준으로 선택하며 Bog/Forest의 같은 쪽 다중 계절 행도 계절 아이콘에 맞춰 교정했다. Printed effect 실행 완전성은 `TRAVEL-009`에서 별도 추적한다. |
| TRAVEL-009 | p25 | 조우의 강제 효과·선택·자원 변화를 해소한 뒤 다음 단계 | 조우 모달 | `encounterEngine.ts`, `encounterSupportEngine.ts`, manual resolution queue | Partial | `gameplayEngine.test.ts`, `manualResolution.test.ts [TRAVEL-009]`, `playerSupportEngine.test.ts` | 103개 행 모두 런타임에 도달한다. p75-84의 수치·선택 효과에 더해 최단 Location 이동, Path 추가, 계절 봉쇄, 현재 Location 한정 Rarity 보정과 단일·다중 후속 카드가 실제 지도·채집·저장 상태에 반영된다. 서사·NPC 선택과 원문에 없는 동률 판정은 플레이어가 확정한다. |
| TRAVEL-010 | p38 | 목적지 도착 후에만 여정 결말 절차 진행 | 여정 종료 | `resolveJourneyEnding()` | Exact | `phase3Engine.test.ts [TRAVEL-010/ENDING-001]` | 실제 graph location ID가 Destination과 같지 않으면 Ending transaction을 거부한다. |

## 환자, 질환, 치료

| Rule ID | 룰북 | 규칙 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| PATIENT-001 | p28 | 환자 생성 → 카드 2장으로 Personality와 Descriptor를 정해 기록 | 진단 | `patientEngine.ts` | Exact | `gameplayEngine.test.ts [PATIENT-001]` | canonical 12행 표와 3개 Personality 선택, Descriptor를 환자 graph에 기록한다. |
| PATIENT-002 | p29 | 심각도 → 무늬로 정하고 평판 상한 적용 | 진단 | `patientEngine.ts` | Exact | `gameplayEngine.test.ts [PATIENT-002]` | suit Severity를 Reputation 구간으로 제한한 결과를 저장한다. |
| PATIENT-003 | p29, p102-103 | 심각도 안에서 값으로 질환 추첨; M은 해당 단계의 복수 질환 결과 | 진단 | `patientEngine.ts:resolveAilmentDraw` | Exact | `gameplayEngine.test.ts [PATIENT-003]` | 등급별 canonical 카드 행과 재귀 Monarch draw를 실행한다. |
| PATIENT-004 | p29-31 | 한 환자가 복수 질환/복수 Timer를 가질 수 있고 각각 추적 | 환자 상태 | `PatientState` graph | Exact | `engine.test.ts`, `gameplayEngine.test.ts [PATIENT-004]` | `Ailments[]`와 각각의 `Timers[]`가 UI·저장·엔진에서 유지된다. |
| PATIENT-005 | p29 | 질환마다 Timer를 생성하고 이동·채집·흥정·시간 사용에 따라 감소 | 환자 상태 | `resolveTimer`, action adapters | Partial | `engine.test.ts [PATIENT-005]` | 복수 Timer 감소는 구현됐지만 legacy Barter/Barrow의 일부 시간 경로가 아직 adapter 밖 계산을 사용한다. |
| AILMENT-001 | p100-115 | 명명된 질환 45개와 등급 분포 12/11/11/11을 정확히 사용 | 질환 도감·진단 | `data/ailments.ts` | Exact | `validation.test.ts [AILMENT-001]` | canonical 45개와 12/11/11/11 분포를 build에서 검증한다. |
| AILMENT-002 | p102-103 | M 결과 → Intermediate는 Lesser 2개, Severe는 Intermediate 2개, Dire는 Severe 2개 | 진단 | `patientEngine.ts` | Exact | `gameplayEngine.test.ts [AILMENT-002]` | 하위 등급 2장과 중첩 Monarch를 재귀 처리한다. |
| AILMENT-003 | p100-115 | 각 질환의 요구 태그·Timer·특수 성공/실패/후속 효과를 우선 적용 | 치료·조우 | `ailmentEffectEngine.ts`, `printedEffects.ts`, manual resolution queue | Partial | `phase3Engine.test.ts`, `phase6Engine.test.ts`, `gameplayEngine.test.ts`, `manualResolution.test.ts [AILMENT-003]` | 45개 질병의 diagnosis/success/failure/timer/barter trigger를 분리해 Patient가 닫힌 뒤에도 context와 후속 판정을 보존한다. 서사적 결과는 의도적으로 manual이다. |
| AILMENT-004 | p100-115 | 반복 질환은 명시 횟수만큼 별도 치료/Timer를 운용 | 환자 상태 | `patientEngine.ts`, `PatientState` | Exact | `engine.test.ts`, `gameplayEngine.test.ts [AILMENT-004]` | canonical `repeatCount`만큼 독립 Ailment instance와 Timer를 생성한다. |
| AILMENT-005 | p100-115 | 룰 텍스트의 may/must/cannot/unless와 선택 분기를 그대로 보존 | 질환 상세 | `data/ailmentWording.ts`, ailment/foraging/manual consumers | Exact | `phase3Engine.test.ts [AILMENT-003/AILMENT-005]`, `phase10ReleaseBlockers.test.ts [AILMENT-005/UX-001]` | p104-115의 플레이 결과를 바꾸는 조건절을 독립 concordance로 고정하고 자동·선택·수동 서사 consumer를 구분했으며 Hunted 예외를 실행한다. |
| AILMENT-006 | p30-31 | 요구 태그는 AND/OR와 수치를 정확히 충족; 선택 재료만 계산 | 치료 구성 | `requirements.ts`, `treatmentEngine.ts` | Exact | `gameplayEngine.test.ts [AILMENT-006]` | 구조적 AND/OR AST, 비누적 Tag 최대값과 선택 Catalyse를 transaction 안에서 평가한다. |
| AILMENT-007 | p36-37 | 실패 시 질환별 특수 결과 후 일반 평판 손실을 적용; 예외 우선 | 치료 결과 | failure handlers | Partial | 없음 | 일반 손실은 있으나 질환별 예외가 대부분 적용되지 않는다. |
| REMEDY-001 | p30 | 재료 가용성 → 지역과 계절 각각 Common +0, Rare +3, Unavailable이면 획득 불가 | 채집·흥정 | `foragingEngine.ts`, `barterEngine.ts` | Exact | `gameplayEngine.test.ts`, `phase3Engine.test.ts [REMEDY-001]` | Foraging과 Barter가 동일한 canonical 3상태 Availability와 선택 Preparation을 사용한다. |
| REMEDY-002 | p30 | Make Do → 필요한 효능보다 1 높은 대체 태그 사용 | 치료 | `createMakeDoAcquisition()`, acquisition UI | Exact | `phase3Engine.test.ts [REMEDY-002]` | 원작 모드에서 직접 생성을 금지하고 +1 Potency 조건을 저장한 뒤 실제 canonical Part 획득을 확인한다. |
| REMEDY-003 | p30 | Replacement → BR 12, Weight 2/3; 이름·준비법을 정하고 채집/흥정으로 획득 | 치료·가방 | `createReplacementAcquisition()`, `commitAlternativeAcquisition()`, Forage/Barter success adapters | Exact | `phase3Engine.test.ts`, `phase6Engine.test.ts [REMEDY-003]` | 원작 모드에서 직접 생성하지 않으며 선택한 Forage/Barter 성공 뒤 custom metadata와 provenance를 가진 item을 한 번만 commit한다. |
| REMEDY-004 | p31 | 충분한 재료가 모이면 Remedy는 즉시 완성; 별도 시간 판정 없음 | 치료 구성 | `treatmentEngine.ts` | Exact | `gameplayEngine.test.ts [REMEDY-004]` | 유효한 치료 transaction은 Timer 시간을 소비하지 않는다. |
| REMEDY-005 | p31 | 준비법이 요구하는 Basic/Market Tool을 실제로 보유해야 Part를 준비 | 채집·가방 | Foraging/Treatment engines | Exact | `gameplayEngine.test.ts [REMEDY-005]` | 획득과 투여 양쪽에서 canonical required Tool을 강제한다. |
| REMEDY-006 | p31 | Part별 Weight와 사용 횟수를 데이터대로 유지 | 가방·치료 | canonical Preparation inventory | Exact | `gameplayEngine.test.ts [REMEDY-006]` | 준비법의 Weight/Uses를 저장하고 사용 시 Uses를 1씩 차감한다. |
| REMEDY-007 | p31 | 충분한 Remedy만 환자에게 투여; 사용 Part 소모 후 성공 절차 | 치료 결과 | `treatmentEngine.ts` | Exact | `gameplayEngine.test.ts [REMEDY-007]` | 요구 미충족은 state 없이 거부하고 성공 transaction만 재료를 소모한다. |
| REMEDY-008 | p31 | 모든 Timer가 0이고 완성 Remedy가 없으면 Overstay/실패 절차 | 환자 상태 | Timer/Treatment engines | Partial | `engine.test.ts [PATIENT-005]` | 복수 Timer 실패와 일반 평판 손실은 실행되지만 질환별 Consequence는 manual이다. |
| REMEDY-009 | p36 | 치료 성공 → Severity만큼 평판; 보상 Trinket은 Severity와 Fair/Foul 공식, 최소 0 | 결과 모달 | `treatmentEngine.ts` | Exact | `gameplayEngine.test.ts [REMEDY-009]` | Severity 및 순 FAIR-FOUL 보상을 transaction에서 계산하고 0 아래를 막는다. |
| REMEDY-010 | p36 | 보상이 1 이상이면 전부 선물하고 +2 평판을 택할 수 있음 | 결과 모달 | `treatmentEngine.ts` | Exact | `gameplayEngine.test.ts [REMEDY-010/SAVE-004]` | gifting 선택과 +2 Reputation을 같은 idempotent transaction에서 처리한다. |

## 채집과 흥정

| Rule ID | 룰북 | 규칙 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| FORAGE-001 | p32 | Wild/Titan Ruin/Barrow에서만 현재 또는 인접 지역을 채집 | 채집 | `foragingEngine.ts`, graph-backed UI candidates | Exact | `gameplayEngine.test.ts [FORAGE-001/MAP-002]`, `step3Canonical.test.ts [FORAGE-006/TOOL-005]` | 현재 위치 유형을 강제하고 모든 정상 채집·Independent·Scrounge 인접 후보와 engine 입력을 실제 지도 edge의 Region 집합으로 검증한다. |
| FORAGE-002 | p32 | 카드값과 BR 비교; 가용 재료가 없거나 너무 낮으면 FP +1 | 채집 | `foragingEngine.ts` | Exact | `gameplayEngine.test.ts [FORAGE-002]` | 목표 Reagent 실패와 후보 없음 모두 FP +1로 transaction 처리한다. |
| FORAGE-003 | p32 | 현재 FP가 BR 이상이면 낮은 카드여도 FP를 쓰지 않고 자동 획득 가능 | 채집 | `foragingEngine.ts` | Exact | `gameplayEngine.test.ts [FORAGE-003]` | FP가 BR 이상인 자동 성공은 FP를 차감하지 않는다. |
| FORAGE-004 | p32 | 부족분만큼 FP를 지불해 BR 충족 | 채집 | `foragingEngine.ts` | Exact | `gameplayEngine.test.ts [FORAGE-004]` | 카드와 BR의 정확한 gap만 선택적으로 차감한다. |
| FORAGE-005 | p32 | 성공 1회 → 한 Reagent를 발견하고 그 Reagent의 Part 하나 이상 채집 | 채집 | `foragingEngine.ts` | Exact | `gameplayEngine.test.ts [FORAGE-005]` | 한 target Reagent만 허용하며 그 Reagent의 Part 여러 개를 canonical inventory에 넣는다. |
| FORAGE-006 | p33 | 채집 뒤 해당 지역·계절·카드의 Foraging Encounter 해결 | 채집 조우 | Foraging/Encounter engines, manual resolution queue | Partial | `gameplayEngine.test.ts`, `releaseCandidate.test.ts`, `manualResolution.test.ts [FORAGE-006]` | 144개 행 모두 실행기에 도달하고 직접 판정은 채집 pending을 잃지 않고 별도 queue·journal·follow-up으로 이어진다. |
| FORAGE-007 | p33 | Remedy 완성 여부를 먼저 확인한 뒤 Timer 비용: 현재 1/인접 2 + 추가 Part 수 | 채집 종료 | Foraging/Treatment/Timer engines | Exact | `gameplayEngine.test.ts [FORAGE-007]` | canonical 치료 가능 여부 확인 후 비용을 적용하며 pending state로 새로고침 우회를 막는다. |
| FORAGE-008 | p152-187 | 6지역 각 24개 채집 조우와 계절 확률을 정확히 사용 | 채집 조우 | `data/encounters.ts` | Exact | `validation.test.ts`, `phase3Engine.test.ts [FORAGE-008/TABLE-004]` | 144개 key·분포와 경고 행 원문을 검증한다. Printed effect 실행은 `FORAGE-006`에서 별도 추적한다. |
| BARTER-001 | p34 | 현재/인접 Settlement/City에서 비-Titan Reagent를 흥정 | 흥정 | `resolveBarterStart()` | Exact | `phase3Engine.test.ts [BARTER-001]` | 실제 graph의 현재/인접 Settlement·City와 비-Titan canonical Reagent/Preparation만 허용한다. |
| BARTER-002 | p34 | 시도 횟수 → Settlement 1회, City 3회/질환; 흥정 시작 시 차감 | 흥정 | attempt counters | Exact | 없음 | 핵심 횟수와 시작 시 소비가 구현돼 있다. |
| BARTER-003 | p34 | BR 수정 → Local -2, 3 Paths 이내 교역 City -2, 제철 -1, Curiosity +2, Fair +3, Tag 3 +5, Foul +X, 평판 보정 | 흥정 | `calculateBarterBR()` | Exact | `phase3Engine.test.ts [BARTER-003]` | graph 3 Paths와 선택 Preparation만 사용해 모든 인쇄 수정치를 계산하고 UI에 근거를 표시한다. |
| BARTER-004 | p34 | Familiar의 Chatty 보정은 명시값만 적용 | 흥정 | familiar reduction | House Rule | 없음 | 신뢰도에 따라 원작 수치보다 강화된다. |
| BARTER-005 | p35 | Social Encounter를 먼저 해결하고 두 번째 카드로 BR 판정 | 흥정 | `resolveBarterEncounter()`, `resolveBarterOffer()` | Exact | `phase3Engine.test.ts [BARTER-005]` | Social 행과 첫 카드를 pending에 저장하고 명시 해결 후에만 두 번째 카드를 확정한다. |
| BARTER-006 | p35 | 성공 비용 → 카드와 BR 차이를 Trinket 및/또는 평판의 조합으로 지불 | 흥정 결제 | `resolveBarterPayment()` | Exact | `phase3Engine.test.ts [BARTER-006]` | 부족분과 정확히 같은 Trinket+Reputation 혼합 결제를 원자적으로 적용한다. |
| BARTER-007 | p35 | 실패/포기 → 획득 없이 떠남; Remedy 미완성이면 모든 Timer -1 | 흥정 종료 | `resolveBarterLeave()` | Exact | `phase3Engine.test.ts [BARTER-007/REMEDY-008]` | 획득 실패 시 복수 질환의 모든 활성 Timer를 한 번만 감소시키고 pending을 보존한다. |
| BARTER-008 | p35 | 카드의 Q/K는 M=12로 판정 | 흥정 판정 | `getRuleCardValue(..., 'barter')` | Exact | `phase3Engine.test.ts [CORE-001/BARTER-008]` | Q와 K 모두 12로 저장·비교한다. |

## 떠나기, 결말, 휴식기, 진료소

| Rule ID | 룰북 | 규칙 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| LEAVE-001 | p37 | 모든 Timer가 1 이상일 때만 Scrounge 선택 | 떠나기 | `resolveScrounge()` | Exact | `phase3Engine.test.ts [LEAVE-001]` | 복수 Timer 전부가 필요한 비용 이상일 때만 transaction을 허용한다. |
| LEAVE-002 | p37 | Scrounge 채집 → 현재 Timer -1/인접 -2, 일반 채집 규칙 | 떠나기 | `resolveScrounge()`, `resolveForaging()` | Exact | `phase3Engine.test.ts [LEAVE-002]` | 실제 graph 인접 Region을 검증하고 일반 채집·조우 pending과 복수 Timer 비용을 연결한다. |
| LEAVE-003 | p37 | 보장 Part → Potency 2 이하, 현재 3/인접 4 Timer 비용 | 떠나기 | `resolveScrounge()` | Exact | `phase3Engine.test.ts [LEAVE-003]` | canonical Preparation Potency를 검증하고 현재 3/인접 4를 모든 Timer에 적용한다. |
| LEAVE-004 | p37 | 환자를 치료하지 못하고 떠남 → Severity만큼 평판 감소 | 떠나기 | fail patient | Exact | 없음 | 일반 손실 수치는 구현돼 있다. |
| LEAVE-005 | p37 | Pawn → 버린 물건 총 Weight를 가장 가까운 정수로 반올림한 Trinket 획득 | 가방·떠나기 | `calculatePawnReward()`, `resolvePawn()` | Exact | `phase3Engine.test.ts [LEAVE-005]` | 남은 Uses가 있는 여러 물건의 Weight를 합산한 뒤 한 번 반올림하고 중복 transaction을 막는다. |
| LEAVE-006 | p37 | 필요한 준비를 마치면 다음 Move로 복귀 | 떠나기·이동 | `resolveLeave()`, canonical abandon/treated UI | Exact | `step3Canonical.test.ts [LEAVE-006/SAVE-001]`, `releaseCandidate.test.ts` | `resolveLeave()` 한 transaction이 Patient·모든 Timer·Archive·Reputation·obligation·journal을 닫고 UI는 결과만 저장한다. original gameplay의 `activeAilment` write는 제거됐다. |
| ENDING-001 | p38 | 여정 결말 → Goal 달성 여부를 서술적으로 평가하고 기록 | 여정 종료 | `resolveJourneyEnding()` | Exact | `phase3Engine.test.ts [ENDING-001]` | 목적지·Goal 근거·미해결 환자/판정을 검증하고 성공/부분/실패/중단과 회고를 저장한다. |
| ENDING-002 | p38 | 결말 자체에는 고정 +5/-3 평판 공식이 없음 | 여정 종료 | `resolveJourneyEnding()` ruleset branch | Exact | `phase3Engine.test.ts [ENDING-002]` | 원작 모드는 고정 평판을 적용하지 않으며 기존 캠페인만 명시적 legacy stakes를 유지한다. |
| ENDING-003 | p39 | 여정의 유형적 후속 효과는 선택적 예시이며 플레이어 서술에 따름 | 결말·저널 | Ending journal transaction | Exact | `phase3Engine.test.ts [ENDING-003]` | 수치 보상을 강제하지 않고 플레이어 회고와 선택적 결과를 기록한 뒤 Downtime으로 전환한다. |
| DOWNTIME-001 | p40 | 여정 종료 후 Downtime Activity 정확히 하나 선택 | 휴식기 | `downtimeEngine.ts`, action hub | Exact | `gameplayEngine.test.ts [DOWNTIME-001]` | 여정 종료가 Downtime을 요구하고 engine transaction이 두 번째 활동을 거부한다. |
| DOWNTIME-002 | p40 | Rumour → 평판 15 이상이며 City에서 종료; 4장으로 종류/방향/지역/거리, 불가능 조합 재추첨 | 휴식기 | `rumourEngine.ts`, canonical map selector | Exact | `phase4Engine.test.ts [DOWNTIME-002]` | 도시에서 끝낸 여정마다 휴식기에 한 번 듣되 Downtime Activity 1회는 소비하지 않는다. 실제 graph의 방향·지역·Path 후보만 허용하며 불가능한 조합은 재추첨한다. |
| DOWNTIME-003 | p41 | General Practice → 질환 Tag 하나를 캠페인에 맞게 바꿈 | 휴식기 | `canonicalDowntimeEngine.ts`, treatment/barter consumers | Exact | `step3Canonical.test.ts [DOWNTIME-003/REMEDY-001]` | Reputation 등급 안의 canonical Ailment와 실제 요구 Tag만 선택하게 하고, 영구 변경·5 Trinket·journal·transaction을 저장한 뒤 이후 Treatment와 Barter가 같은 override를 소비한다. |
| DOWNTIME-004 | p41 | Replenish → 가방을 규칙대로 채움 | 휴식기 | `canonicalDowntimeEngine.ts`, replenish UI | Exact | `step3Canonical.test.ts [DOWNTIME-004]` | UI가 여러 Reagent와 Part·수량을 한 번에 받아 canonical resolver에 전달하며 Tool·Region·Common Season·Carry·중복 ID를 한 transaction에서 검증한다. |
| DOWNTIME-005 | p41-42 | Explore/Work on Yourself/Reconnect → 각 조건·거리·효과를 한 번 적용 | 휴식기 | `canonicalDowntimeEngine.ts`, graph-backed activity UI | Exact | `step3Canonical.test.ts [DOWNTIME-005/DOWNTIME-007/GRAPH-001]`, `phase3Engine.test.ts [DOWNTIME-005]` | Explore·Self Improvement·nearest City 이동과 Reconnect를 canonical 처리하고 Ledger는 Forage FP, Map은 Travel draw, Gossip은 Barter 성공에서 구조적으로 소비된다. |
| DOWNTIME-006 | p42 | Relax → Tool 또는 Familiar 중 하나를 선택해 효과 적용 | 휴식기 | `downtimeEngine.ts`, relax UI | Exact | `gameplayEngine.test.ts [DOWNTIME-001]` | engine activity와 UI 모두 Tool/Familiar 중 정확히 하나만 허용한다. |
| DOWNTIME-007 | p42-43 | Lend Paw와 Commission Wagon → 명시 비용·조건·완료 시점 적용 | 휴식기 | `downtimeEngine.ts`, `mobilityEngine.ts` | Partial | `gameplayEngine.test.ts [DOWNTIME-007/WAGON-001/WAGON-002]` | Lend Paw +5와 Wagon의 City·실제 비용·한 활동 제한은 원자 적용되지만 p43 commission 20과 p68 Base Unit 15의 서로 다른 항목을 UI가 하나의 구매로 표현해 원문 관계를 추가 확인해야 한다. |
| CLINIC-001 | p44-45 | 4계절 완료 후 Wild에서 치료 성공; 15 Trinket 지불해 Clinic 설립. 충족 가능한 Agenda가 없어도 건설 가능 | 진료소 | `clinicEngine.ts`, clinic panel | Exact | `phase4Engine.test.ts [CLINIC-001/CLINIC-003]`, `phase10ReleaseBlockers.test.ts [CLINIC-001/CLINIC-005]` | 완료 계절 4회, Wild 치료, 15 Trinket, 위치 중복을 검증하며 p.46에 따라 Agenda 선택을 선택 사항으로 처리한다. |
| CLINIC-002 | p45 | 설립한 Clinic은 다음 Season 시작에 완성 | 진료소 | `seasonEngine.ts` | Exact | `gameplayEngine.test.ts [CLINIC-002]` | 설립 시 `building`으로 저장하고 지정한 다음 계절 경계에서 활성화한다. |
| CLINIC-003 | p45 | Clinic service area는 3 Paths | 지도·진료소 | `clinicEngine.ts`, `MAP_SERVICE_HOPS` | Exact | `phase4Engine.test.ts [CLINIC-003]` | graph 최단거리 3 Paths와 UI 서비스 범위가 같은 상수를 사용한다. |
| CLINIC-004 | p46-47 | Agenda는 전역이며 보유 모든 Clinic이 그 혜택을 제공 | 진료소 | agenda union | Partial | 없음 | 전역 합집합은 가깝지만 서비스 거리와 개별 상태 표현이 어긋난다. |
| CLINIC-005 | p46-47 | 10개 Agenda의 비용·조건·효과를 정확히 적용 | 진료소 | `resolveClinicAgendaAction()`, Season/Patient consumers | Exact | `phase10ReleaseBlockers.test.ts [CLINIC-001/CLINIC-005]` | Pantry, Library, Hive Boxes, Clinic별 Garden/Greenhouse, Sodden Logs, Taproom/Hostel, Mailbox, Goodwill이 실제 상태와 후속 action을 가진다. Goodwill 기부는 Clinic에 직접 머물 때만 허용한다. |
| CLINIC-006 | p46-47 | Goodwill Stand 등 무게·재화 교환은 원문 단위로 처리 | 진료소 | `seasonEngine.ts`, canonical inventory | Exact | `gameplayEngine.test.ts [CLINIC-006]` | canonical Weight 합계의 내림값으로 Reputation을 주고 계절 경계 후 기부량을 초기화한다. |

## 연감, 서비스, 장비와 동료

| Rule ID | 룰북 | 규칙 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| ALMANACK-001 | p54-71 | Almanack의 서비스·도구·업그레이드·왜건·동료 표를 참고 정보로 제공 | 연감 | `AlmanackPanel.tsx`, canonical catalogues | Exact | `phase4Engine.test.ts` | 누락 없는 표를 검색·분류·source page와 함께 제공하고 긴 목록은 단계 렌더링한다. |
| ALMANACK-002 | p56-57 | 한 번에 Trinket을 몇 개 받더라도 그중 하나를 3장 표로 물건/재질/유래를 정해 저널에 기록 | 보상·저널 | `almanackEngine.ts`, `trinketLedger.ts`, schema v9 | Exact | `phase4Engine.test.ts [ALMANACK-002]`, `playerSupportEngine.test.ts` | 중앙 상태 갱신이 획득 묶음마다 대표 Object/Material/Origin 기록 하나를 만들고 나머지는 이름 없는 수량으로 보존한다. 대표 Trinket을 직접 고르면 해당 canonical record를 우선 사용 처리한다. |
| ALMANACK-003 | p54-71 | 발견/현재 보유/참고 정보는 서로 구분하고 저장 | 연감·가방 | compendium/inventory state | Partial | 없음 | 일부 발견 상태는 있으나 완전한 잠금·사용 이력·중복 ID 검증이 없다. |
| ALMANACK-004 | p58-61 | Guild Service 17종의 조건·비용·효과를 정확히 적용 | 서비스 | `data/services.ts`, `serviceEngine.ts`, Service UI | Exact | `phase4Engine.test.ts`, `phase10ReleaseBlockers.test.ts [ALMANACK-004/SERVICE-001/SERVICE-002/SERVICE-005]` | 17종 모두 비용·위치·대상·기간을 검증하며 Smithing의 Mountain Settlement/any City 조건과 Catch of the Day의 Small/Big Fish 선택까지 엔진 경계에서 강제한다. |
| ALMANACK-005 | p62-65 | Tool 18종과 획득 제한·준비법·효과를 정확히 적용 | 상점·가방 | `data/tools.ts`, `toolEngine.ts`, gameplay consumers | Exact | `phase4Engine.test.ts`, `phase10ReleaseBlockers.test.ts [ALMANACK-005/ALMANACK-006/TOOL-003/TOOL-005]` | 18종의 준비·보관·파손·소모·이동·조우·공연·뜨개 효과가 해당 canonical 행동에서 실행된다. |
| ALMANACK-006 | p66-67 | Tool Upgrade 7종은 해당 도구와 조건을 충족할 때 고유 효과 적용 | 상점·가방 | `data/upgrades.ts`, `toolEngine.ts`, Foraging/Treatment/Patient consumers | Exact | `phase4Engine.test.ts`, `phase5Engine.test.ts`, `phase10ReleaseBlockers.test.ts [ALMANACK-005/ALMANACK-006/TOOL-003/TOOL-005]` | 일곱 Upgrade의 고유 trigger가 stable Tool instance를 유지한 채 실제 Forage/Gather/Patient/Treatment/POUND 시점에 실행된다. |
| SERVICE-001 | p59 | Forecast는 다음 3 Moves 동안 Weather Foraging Encounter의 부정적 효과를 무시 | 서비스·채집 | `serviceEngine.ts`, Travel/Foraging consumers | Exact | `phase4Engine.test.ts [SERVICE-001]`, `phase10ReleaseBlockers.test.ts [ALMANACK-004/SERVICE-001/SERVICE-002/SERVICE-005]` | 다음 3 Move를 정확히 소비하고 도착지의 Weather Foraging 조우에서 긍정 결과는 보존한 채 부정 효과만 막는다. |
| SERVICE-002 | p58-61 | Shortcut/Hitch/Bridge/Survey는 지도 거리·대상 조건을 지켜 지도 상태 변경 | 서비스·지도 | `serviceEngine.ts`, graph-backed Service/Travel UI | Exact | `phase10ReleaseBlockers.test.ts [ALMANACK-004/SERVICE-001/SERVICE-002/SERVICE-005]` | Shortcut·Survey는 좌표 근접성을, Bridge는 실제 수로 쌍을, Hitch·Taxi는 다음 Move 조건과 종료 transaction을 검증한다. |
| SERVICE-003 | p58-61 | Floodplain 효과는 다음 Spring에 되돌림 | 지도·계절 | `serviceEngine.ts` map mutation | Logic-only | `phase4Engine.test.ts [SERVICE-003]` | 이전 Region과 Spring 복원 transaction은 구현됐으나 계절 UI의 모든 legacy graph 경로에는 아직 연결되지 않았다. |
| SERVICE-004 | p58-61 | Pick of the Deep 등 카드 수치는 M=12 적용 | 서비스 | `serviceEngine.ts`, `cards.ts` | Partial | `phase4Engine.test.ts` | canonical service resolver는 M=12를 사용하지만 일부 legacy service 표현 경로가 남아 있다. |
| SERVICE-005 | p58-61 | Retrieval은 5 Paths 이상 떨어진 Settlement로 물품을 전달 | 서비스·가방 | `serviceEngine.ts`, pending service UI | Exact | `phase4Engine.test.ts [SERVICE-005]`, `phase10ReleaseBlockers.test.ts [ALMANACK-004/SERVICE-001/SERVICE-002/SERVICE-005]` | Retrieval은 5 Paths 이상 목적지 도착 시 선택 Part를 지급하고 Send Package는 외부 도착 확인 후 저장된 전달을 완료한다. |
| TOOL-001 | p62-65 | Basic/Market Tool은 명시된 Reagent 준비법만 가능하게 함 | 채집·치료 | `foragingEngine.ts`, `toolEngine.ts` | Exact | `gameplayEngine.test.ts [REMEDY-005]` | canonical Preparation의 required Tool을 획득과 투여 양쪽에서 강제한다. |
| TOOL-002 | p62-65 | Bandolier는 자격 있는 준비 Part의 Weight만 보정 | 가방 | `bandolierAdjustedWeight`, carry helper | Exact | `phase5Engine.test.ts [TOOL-002]` | canonical Reagent identity를 사용해 Plant/Insect Part 최대 5 Weight만 1 Weight로 계산한다. |
| TOOL-003 | p62-65 | Tent/Comb/Instruments/Alembic 등 특수 조건과 소모/파손을 적용 | 조우·치료 | `resolveToolEffects()`, Tool transactions, gameplay consumers | Exact | `phase5Engine.test.ts`, `phase6Engine.test.ts`, `phase10ReleaseBlockers.test.ts [ALMANACK-005/ALMANACK-006/TOOL-003/TOOL-005]` | Canvas Tent, Comb, Instruments, Crossbow/Bolts, Stilts, Knitting과 준비 도구를 해당 행동의 resolver에서 파손·소모·중복 방지와 함께 처리한다. |
| TOOL-004 | p62-65 | Tool 효과는 원문에서 허용한 행동만 제공 | 도구 사용 | `toolEngine.ts`, tool actions, schema v9 | Exact | `playerSupportEngine.test.ts` | Knitting Needles는 모든 Timer가 0보다 클 때만 사용하고 프로젝트 시간을 여러 Preparing to Leave에 누적한다. 완성 전 교체를 막고 완성 기록 또는 포기 이력을 요구한다. |
| TOOL-005 | p66-67 | 업그레이드 효과는 기본 Tool 상태와 저장·복원에 연결 | 가방 | `toolEngine.ts`, schema v5, action resolvers | Exact | `phase5Engine.test.ts [TOOL-005]`, `phase10ReleaseBlockers.test.ts [ALMANACK-005/ALMANACK-006/TOOL-003/TOOL-005]` | Upgrade identity를 보존하며 Granite POUND와 나머지 여섯 trigger를 Inventory 직접 변경 없이 canonical resolver로 적용한다. |
| WAGON-001 | p68-69 | Wagon은 기본 Weight/Speed/이동 제한을 적용 | 이동·가방 | `mobilityEngine.ts`, `travelEngine.ts` | Exact | `phase10ReleaseBlockers.test.ts [TRAVEL-002/WAGON-001/WAGON-004]` | Base/Brackets의 Carry·Speed, Sealed 수로, Pedal 연속 수로 비용과 Experimental Soar 3 Days가 Travel 입력과 결과를 결정한다. |
| WAGON-002 | p68-69 | Expansion 10종의 슬롯·비용·효과를 정확히 적용 | 왜건 | `mobilityEngine.ts`, Wagon/Travel/Foraging UI | Exact | `phase10ReleaseBlockers.test.ts [WAGON-002/COMPANION-001/COMPANION-005]` | 10종의 설치 조건·비용·능력과 Passenger·Clay Pots의 Journey/Move/수확 수명주기를 canonical transaction으로 유지한다. |
| WAGON-003 | p25, p68-69 | Soar 시 일반 Wagon 불가; 허용이 명시된 특수 장비만 예외 | 이동 | `mobilityEngine.ts`, `travelEngine.ts` | Exact | `phase4Engine.test.ts [WAGON-003]` | commissioned Wagon은 Experimental Contraption이 있을 때만 Soar하며 3 Days를 적용한다. |
| WAGON-004 | p68-69 | Sealed/Shadow/Experimental 등 확장 효과를 해당 판정 시점에만 적용 | 이동·조우 | Mobility capabilities and Travel transaction | Exact | `phase10ReleaseBlockers.test.ts [TRAVEL-002/WAGON-001/WAGON-004]`, `phase10ReleaseBlockers.test.ts [SERVICE-002/WAGON-004/UX-001]` | Sealed의 정지·방수, Shadow의 Settlement 명성, Experimental의 Soar 허용·3 Days를 정확한 도착/이동 시점에만 적용한다. |
| COMPANION-001 | p70-71 | Companion 9종은 고유 조건·주기·효과만 제공 | 동료 | `mobilityEngine.ts`, Foraging/Travel/Season consumers | Exact | `phase10ReleaseBlockers.test.ts [WAGON-002/COMPANION-001/COMPANION-005]` | 9종의 희귀도, Timer, Encounter, 공연, 10 Paths 보상, 계절 변태와 pending draw를 실제 상태 값으로 처리한다. |
| COMPANION-002 | p70-71 | Wasps → 10 Paths 뒤 채집하듯 카드 판정 | 이동·동료 | `mobilityEngine.ts`, pending Foraging UI | Exact | `phase4Engine.test.ts`, `phase5Engine.test.ts [COMPANION-002]` | 10 Paths마다 실제 카드를 뽑고 INSECT 후보만 표시하는 저장 가능한 Foraging transaction을 연다. |
| COMPANION-003 | p70-71 | Caterpillar 등 계절 전환 효과는 정확한 경계에서 적용 | 계절·동료 | `seasonEngine.ts` | Exact | `gameplayEngine.test.ts [COMPANION-003]` | Caterpillar의 계절 여행 수를 올리고 경계에서 Butterfly로 전환한다. |
| COMPANION-004 | p70-71 | 동료가 명시하지 않은 Soar/수로 안전을 제공하지 않음 | 이동 | `hasSafeWaterwayTravel`, soar checks | House Rule | 없음 | Butterfly/Honeybee/Wasp/Pond Skimmer 등에 비행·방수 권한을 추가한다. |
| COMPANION-005 | p70-71 | Beetle/Pond Skimmer 등 위치·행동 제한과 보상은 정확히 적용 | 이동·동료 | `resolveCompanionTrigger()`, Journey/Travel consumers | Exact | `phase10ReleaseBlockers.test.ts [WAGON-002/COMPANION-001/COMPANION-005]` | Beetle·Pond Skimmer의 Journey 1회, Cranky 소모, Butterfly/Spider 계절·유형과 Honeybee/Wasp 10 Paths를 각 trigger에서 강제한다. |

## Barrow와 무작위 표

| Rule ID | 룰북 | 규칙 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| BARROW-001 | p116-125 | Barrow 진입 → 8개 Delve 중 해당 절차, Suit challenge mapping 사용 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-001-009]` | UI의 진입·시작·진행·완료가 8개 canonical Delve resolver와 transaction ID만 사용하며 중간 상태는 현재 schema v9로 복원된다. |
| BARROW-002 | p116 | Flee → 1 day와 안전/후속 처리를 적용하고 Delve를 종료 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-002/BARROW-003/SAVE-001]` | Challenge 전 Flee만 허용하고 1 day·다음 Move Speed 1·차단 해제·journal을 한 idempotent transaction으로 적용한다. |
| BARROW-003 | p116-125 | Delve는 비용 없이 일반 취소할 수 없음 | Barrow | abort handler | House Rule | 없음 | 일반 중단이 상태와 Local Help 의무를 비용 없이 제거한다. |
| BARROW-004 | p117 | Collapsed Entrance → 카드값/FP/마일스톤/보상; 완료 시 Barrow 제거 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-004/CORE-001]` | M=12 카드, 마일스톤, 중간 reload, 중복 방지, reward와 실제 graph/Barrow 제거를 resolver가 원자 적용한다. |
| BARROW-005 | p118 | Uneasy Sleep → SLEEP 요구, Timer/추격/보상 절차 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-005/SAVE-004]` | SLEEP 6 Part identity·소모, Timer, 정확히 한 graph Path 이동, 추격/보상과 journal을 전용 입력 UI가 resolver에 전달한다. |
| BARROW-006 | p119 | Pilfer → face 값과 합계 21 보상을 정확히 적용 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-006]` | face/M=12 합계, 21의 실제 canonical Tool instance, Trinket 보상, Crossbow+Bolts/Companion 탈출과 사망을 stable identity로 처리한다. |
| BARROW-007 | p120-121 | Building Trust/Suitable Furnishings → 정확한 질환·재료·카드·보상 검증 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-007]`, `releaseCandidate.test.ts [SAVE-001/SAVE-005/UX-003]` | Building Trust resolver가 Patient 종료·Timer·Archive·journal·보상·Settlement·Barrow 제거를 원자 commit하며 Suitable Furnishings도 canonical identity와 순서를 보존한다. |
| BARROW-008 | p122-123 | Full Bellies/Inside Job → 요구 태그·Timer·선택 분기·지도 결과 적용 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-008]` | 요구 Tag, Bellies Timer 성공/실패, Inside Job 선택 분기와 graph/carry/speed 결과를 canonical resolver가 journal과 함께 적용한다. |
| BARROW-009 | p124-125 | Potent Poison → 서로 다른 7 Reagent와 카드값으로 진행 | Barrow | `barrowEngine.ts`, canonical Barrow UI | Exact | `step3Canonical.test.ts [BARROW-009]` | Timer 0에서만 서로 다른 일곱 canonical Reagent identity와 M=12를 합산하고 성공·실패 결과와 소모를 한 transaction으로 처리한다. |
| TABLE-001 | p72-99 | Travel 표 → Bog/Forest/Loch/Meadow/Mountain/Soar 각 16, Titan 7; 카드·계절 분포 유지 | 이동 조우 | `data/encounters.ts`, printed overrides | Exact | `validation.test.ts`, `phase3Engine.test.ts [TABLE-001]` | 103개 key·분포와 기존 경고 9행의 제목·페이지·상태를 원문 대조해 검증한다. 효과 자동화 범위는 `TRAVEL-009`에서 추적한다. |
| TABLE-002 | p100-115 | Ailment 표 → 45개 고유 항목과 등급별 M 규칙 | 진단 | `data/ailments.ts` | Exact | `validation.test.ts [TABLE-002]` | canonical 45개, Severity 분포와 Monarch rule을 자동 검증한다. |
| TABLE-003 | p126-151 | Reagent 표 → 고유 83종, 각 Region/Season 3상태, Part/Tool/Weight/Uses/Tag 정확 | 채집·연감 | `data/reagents.ts` | Exact | `validation.test.ts [TABLE-003]` | 83개 Reagent와 189 Preparation의 가용성·도구·무게·사용·태그를 검증한다. |
| TABLE-004 | p152-187 | Foraging Encounter 표 → 6지역×24, 카드·계절 확률 유지 | 채집 조우 | `data/encounters.ts`, printed overrides | Exact | `validation.test.ts`, `phase3Engine.test.ts [TABLE-004]` | 144개 key·분포와 Loch J 겨울 행을 원문 대조해 검증한다. 효과 자동화 범위는 `FORAGE-006`에서 추적한다. |
| TABLE-005 | p188-213 | Social 표 → Suit+위치 유형/도시+계절 조합으로 선택; 카드값은 무관 | 이동·흥정 조우 | `data/encounters.ts`, selector | Exact | `validation.test.ts`, `engine.test.ts [TABLE-005]` | 66개 Social key를 Suit·위치 유형·도시·계절로 직접 조회한다. |
| TABLE-006 | p10-21, p28, p40 | 캐릭터·목표·환자·Rumour 등 d12/다중 카드 표의 항목 수와 분포 유지 | 생성·여정·환자·휴식기 | canonical character/patient/journey/rumour data | Partial | `gameplayEngine.test.ts`, `phase4Engine.test.ts` | Patient 2장, Goal과 Rumour 4장 절차는 구현됐지만 캐릭터 Personality/Relationship 전체 표의 항목·분포를 독립 validator가 아직 고정하지 않는다. |

## 저장, 아카이브, 오프라인과 UX 무결성

이 절은 룰북의 게임 규칙이라기보다, 룰북상 진행 상태를 웹앱에서 손실·중복 없이 유지하기 위한 필수 구현 요구다.

| Rule ID | 근거 | 무결성 명세 | 대응 화면 | 구현 위치 | 상태 | 자동 테스트 | 문제 |
|---|---|---|---|---|---|---|---|
| SAVE-001 | 진행 보존 | 현재 캐릭터·위치·날짜·계절·재화·가방·여정·환자를 원자적으로 저장 | 전체 | `App.tsx:store`, schema v9 | Partial | `releaseCandidate.test.ts`, `manualResolution.test.ts`, `step3Canonical.test.ts [SAVE-001]` | Barrow·Tool·Downtime·Leave transaction의 직렬화와 중복 방지는 검증했지만 실제 browser storage write 중단을 주입하는 원자성 테스트는 없다. |
| SAVE-002 | 진행 보존 | 활성 Travel Encounter를 저장하고 재개 시 같은 결과로 복원 | 이동 조우 | `pendingEncounter` | Exact | `gameplayEngine.test.ts [SAVE-002]` | 선택 카드·canonical encounter·transaction ID를 저장하고 Action Hub/모달로 재개한다. |
| SAVE-003 | 진행 보존 | 활성 Foraging Encounter와 종료 전 Timer 비용을 저장 | 채집 조우 | `pendingForaging` | Exact | `gameplayEngine.test.ts [SAVE-003]` | 선택 단계·카드·지역·Timer 비용을 저장해 해결 전 비용 생략을 막는다. |
| SAVE-004 | 진행 보존 | 치료 재료 선택·카드·확정 전후 결과를 저장해 중복 지급/손실 방지 | 치료 모달 | schema v9 `TreatmentDraft`, treatment transaction IDs | Exact | `engine.test.ts`, `gameplayEngine.test.ts`, `phase6Engine.test.ts [SAVE-004]` | v6에서 도입된 선택 Part/Preparation/Tool/FAIR/FOUL/대체 context를 v9까지 보존하고 완료 transaction과 연결된 draft는 마이그레이션에서 폐기한다. |
| SAVE-005 | 데이터 호환 | 명시적 schemaVersion과 단계별 migration으로 구버전 저장을 보존 | 불러오기 | `migrations.ts` | Exact | `engine.test.ts`, `phase3Engine.test.ts`, `phase4Engine.test.ts`, `releaseCandidate.test.ts`, `manualResolution.test.ts`, `step3Canonical.test.ts [SAVE-005]` | v0→…→v9 순차 migration이 Barrow 진행, stable Tool instance, Downtime override, manual draft/follow-up, Encounter 지도 상태, Knitting 진행과 Trinket 원장을 보존한다. |
| SAVE-006 | 클라우드 동기화 | 최신 리비전·시간으로 충돌을 판정하고 여러 탭/장치 덮어쓰기 방지 | 로그인·자동 저장 | revision compare + Firebase queue | Partial | 없음 | 최신 revision 우선과 순차 쓰기는 구현됐지만 같은 revision의 동시 편집 merge는 없다. |
| SAVE-007 | 저장 한도 | 큰 저널/사진이 있어도 로컬 진행을 보존하고 제한을 사용자에게 명확히 알림 | 저널·사진 | `store.set` | Partial | 없음 | 큰 save도 로컬에는 보존하지만 cloud 생략 알림은 console warning만 제공한다. |
| SAVE-008 | 쓰기 순서 | 연속 상태 변경은 생성 순서대로 저장되고 오래된 요청이 최신 상태를 덮지 않음 | 전체 | `saveQueue.ts`, `saveRevision` | Exact | `saveQueue.test.ts [SAVE-008]` | local-first queue가 revision별 최신 항목을 유지하고 지연·실패·재시도를 자동 테스트한다. |
| ARCHIVE-001 | 기록 보존 | 환자 만남과 결과를 고유 ID/상태로 구분해 Archive에 저장 | 환자 기록 | `archiveEngine.ts` | Exact | `phase3Engine.test.ts [ARCHIVE-001]` | caseId/patientId/Personality/Descriptor와 여섯 상태를 canonical record로 보존한다. |
| ARCHIVE-002 | 기록 보존 | 사용 재료·결과·보상·패널티·시간·위치·저널을 결과와 함께 저장 | 환자 상세 | `createPatientArchiveRecord()` | Exact | `phase3Engine.test.ts [ARCHIVE-002]` | 복수 질환·Timer, Remedy, 보상·패널티, 만남·치료 시점, Journey와 transaction ID를 저장한다. |
| ARCHIVE-003 | 기록 보존 | 실패가 성공으로 정규화되거나 후속 저장으로 덮이지 않음 | 환자 기록 | `normalizeLegacyArchiveRecord()`, `upsertPatientArchive()` | Exact | `phase3Engine.test.ts [ARCHIVE-003]` | unresolved/pending은 성공이 아니며 실패 record를 stale pending/success write가 덮지 못한다. |
| ARCHIVE-004 | 기록 보존 | 구버전 선택 필드 누락과 refresh 중 pending archive를 안전하게 복원 | 환자 기록 | schema v4 migration, archive normalizers | Exact | `phase3Engine.test.ts [ARCHIVE-004/SAVE-005]` | 누락 필드·pending·failed legacy record와 중복 transaction을 migration 및 hostile-save 테스트로 검증한다. |
| OFFLINE-001 | 오프라인 | 네트워크가 없어도 동일한 번들 규칙·표로 플레이하고 로컬 저장 | 전체 | bundled canonical data, local-first store | Exact | `saveQueue.test.ts [OFFLINE-001]` | Firebase 없이도 같은 canonical bundle과 local snapshot으로 플레이한다. |
| OFFLINE-002 | 동기화 | 오프라인 변경을 큐에 보존하고 온라인 복귀 시 오래된 클라우드가 덮지 않음 | 로그인·저장 | `saveQueue.ts`, Firebase adapter | Exact | `saveQueue.test.ts [OFFLINE-002]` | outbox coalescing·retry·revision conflict policy를 저장 경로와 테스트에 연결했다. |
| OFFLINE-003 | 재현성 | 같은 미완료 판정은 저장·재개 후 같은 카드/결과를 유지 | 모든 랜덤 모달 | pending transactions, schema v5 | Partial | `saveQueue.test.ts [OFFLINE-003]` | canonical Travel/Forage/Barter/Manual/Wasp 판정은 카드를 저장하지만 일부 legacy 임시 모달은 seed를 저장하지 않는다. |
| UX-001 | 규칙 가시성 | 강제 규칙과 선택 규칙을 명확히 구분하고 불가능 행동은 차단 | 전체 gameplay | engine result flows, Action Hub, `ManualEffectPanel` | Exact | `gameplayEngine.test.ts`, `manualResolution.test.ts [CORE-002/UX-001]`, `phase10ReleaseBlockers.test.ts [AILMENT-005/UX-001]`, desktop/mobile smoke | 이번 blocker 범위의 Tool/Companion/Wagon/Clinic/Service 버튼은 설명-only 상태 없이 canonical resolver 결과나 명시적 manual transaction으로 끝난다. |
| UX-002 | 지도 가시성 | 지도 위 규칙·서비스 텍스트가 배경/확대 상태와 무관하게 읽힘 | 지도 | map overlay styles | Partial | 브라우저 시각 검증 | 고대비 라벨과 mobile overflow는 검증했지만 자동 visual regression 테스트가 없다. |
| UX-003 | 복구 UX | 저장되지 않은 진행 중 판정이 있으면 복구/재개 상태를 사용자에게 표시 | 모달·조우 | Action Hub + pending state | Exact | `gameplayEngine.test.ts [UX-003]` | Travel/Foraging 미완료 판정을 저장하고 현재 행동 허브에서 같은 단계로 재개한다. |

## 의존 관계 요약

1. `CORE-001`의 M 값 오류는 `BARTER-008`, `SERVICE-004`, `BARROW-004`, `BARROW-007`, `BARROW-009`에 전파된다.
2. `TABLE-003`과 `REMEDY-001/005/006`은 `FORAGE-*`, `BARTER-*`, `AILMENT-006`, `CLINIC-006`의 결과를 동시에 바꾼다.
3. `PATIENT-002/003/004`가 해결되지 않으면 개별 질환 특수 규칙을 구현해도 원작 확률과 복수 Timer 흐름을 재현할 수 없다.
4. `MAP-002/003`은 이동뿐 아니라 인접 채집, 교역 City 3 Paths, Clinic service area, Service와 Goal 판정을 모두 오염시킨다.
5. `SAVE-002/003/004/008`은 올바른 규칙 로직이 있어도 새로고침·연속 클릭으로 결과를 생략하거나 중복할 수 있게 한다.
6. `TABLE-001/004/005`는 조우 텍스트의 누락 문제가 아니라 카드 확률과 계절·지역 분포 자체의 오류다.

## Phase 4 + Phase 5 상태 집계

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
| 합계 | 151 | 151 |

변경 Rule ID: `DOWNTIME-002`, `CLINIC-003`, `ALMANACK-001/002/005/006`, `SERVICE-001/003/004/005`, `TOOL-001/002/005`, `WAGON-003`, `COMPANION-002`, `BARROW-002/004/005/007/008/009`, `SAVE-008`, `OFFLINE-001/002/003`.

## Release Candidate 상태 집계

| 상태 | Phase 6 | RC |
|---|---:|---:|
| Exact | 84 | 84 |
| Partial | 57 | 57 |
| Incorrect | 0 | 0 |
| Missing | 0 | 0 |
| UI-only | 0 | 0 |
| Logic-only | 2 | 2 |
| Ambiguous | 2 | 2 |
| House Rule | 6 | 6 |
| 합계 | 151 | 151 |

재검토·보강 Rule ID: `CORE-002`, `CHARACTER-005`, `JOURNEY-001/003/004`, `FORAGE-001/006`, `AILMENT-003/005`, `REMEDY-003`, `DOWNTIME-001`, `CLINIC-001/002`, `SERVICE-001`, `BARROW-005`, `SAVE-001/005`, `UX-001/002`. 상태 변화는 없다.

## Rulebook Replacement Step 3 상태 집계

| 상태 | Step 3 전 | Step 3 후 |
|---|---:|---:|
| Exact | 84 | 93 |
| Partial | 57 | 48 |
| Incorrect | 0 | 0 |
| Missing | 0 | 0 |
| UI-only | 0 | 0 |
| Logic-only | 2 | 2 |
| Ambiguous | 2 | 2 |
| House Rule | 6 | 6 |
| 합계 | 151 | 151 |

`Partial → Exact`: `FORAGE-001`, `DOWNTIME-003`, `BARROW-001`, `BARROW-002`, `BARROW-004`, `BARROW-005`, `BARROW-006`, `BARROW-008`, `BARROW-009`.

재검토했지만 `Partial`을 유지한 핵심 Rule ID: `LEAVE-006`, `DOWNTIME-004/005/007`, `TOOL-003/005`, `WAGON-001/002/004`, `COMPANION-001/005`, `BARROW-007`, `SAVE-001/006/007`, `OFFLINE-003`, `UX-001/002`. 각 행의 문제 열은 현재 runtime 경로에서 확인한 한 문장 사유다.

## Rulebook Replacement Final Phase 상태 집계

| 상태 | 이전 | 현재 |
|---|---:|---:|
| Exact | 93 | 97 |
| Partial | 48 | 44 |
| Incorrect | 0 | 0 |
| Missing | 0 | 0 |
| UI-only | 0 | 0 |
| Logic-only | 2 | 2 |
| Ambiguous | 2 | 2 |
| House Rule | 6 | 6 |
| 합계 | 151 | 151 |

`Partial → Exact`: `BARROW-007`, `LEAVE-006`, `DOWNTIME-004`, `DOWNTIME-005`.

우선순위 재검토 후 `Partial` 유지: `TOOL-003/005`, `WAGON-001/002/004`, `COMPANION-001/005`, `SAVE-001/006/007`, `OFFLINE-003`, `UX-001/002`. Stable Tool/Upgrade identity와 Mobility transaction 연결은 확대됐지만 Canvas Tent Weather 분류, Granite Mortar, Pedal/Clay Pots 수명주기, 일부 Companion 고유 조건, browser storage 중단 주입과 자동 visual regression이 남아 있다.

## Phase 10 상태 집계

| 상태 | 이전 | 현재 |
|---|---:|---:|
| Exact | 97 | 117 |
| Partial | 44 | 24 |
| Incorrect | 0 | 0 |
| Missing | 0 | 0 |
| UI-only | 0 | 0 |
| Logic-only | 2 | 2 |
| Ambiguous | 2 | 2 |
| House Rule | 6 | 6 |
| 합계 | 151 | 151 |

`Partial → Exact`: `CHARACTER-002`, `CHARACTER-005`, `TRAVEL-002`, `CLINIC-001`, `CLINIC-005`, `ALMANACK-004`, `ALMANACK-005`, `ALMANACK-006`, `SERVICE-001`, `SERVICE-002`, `SERVICE-005`, `TOOL-003`, `TOOL-005`, `WAGON-001`, `WAGON-002`, `WAGON-004`, `COMPANION-001`, `COMPANION-005`, `UX-001`, `AILMENT-005`.

남은 `Partial` 24개는 Release Blocker가 아니다. 비차단 구현·검증 한계 A 12개, 의도적 narrative/player-choice B 11개, 판본 내 Wagon 가격 충돌 C 1개이며 실제 campaign replay의 외부 룰북 참조는 0회였다.

## Phase 11 재검증

상태 변화는 없다. Phase 10의 20개 Exact ID를 독립 재실행해 graph-only Waterway, Service lifecycle, Clinic Agenda 조건, canonical Companion ID/Hive 위치, `PRESERVED` preparation write를 보강했다. `phase10ReleaseBlockers.test.ts` 8개 그룹, 전체 13 files / 139 tests, validator, schema v8 migration, desktop/mobile, canonical campaign가 모두 통과했다.

## Version 1.0 Freeze

Version `1.0.0` release packaging은 Rule ID, 상태, resolver와 test mapping을 변경하지 않는다. 공식 baseline은 `Exact 117 / Partial 24 / Incorrect 0 / Missing 0 / UI-only 0 / Logic-only 2 / Ambiguous 2 / House Rule 6`이며 24개 Partial의 분류와 사유는 `KNOWN_LIMITATIONS.md`에 고정한다.

## 2026-08-15 p.55–84 후속 구현

- `ALMANACK-002`: 각 Trinket 획득 묶음을 p.56의 대표 Object/Material/Origin 한 건과 이름 없는 잔여 수량에 연결해 `Logic-only → Exact`로 올렸다.
- `TOOL-004`: Knitting의 Timer 부족 우회를 제거하고, 여러 Preparing to Leave에 걸친 누적 진행·교체 방지·완성 Journal·포기를 구현해 `House Rule → Exact`로 올렸다.
- `TRAVEL-009`: Partial 분류는 서사·NPC 선택 때문에 유지하지만, p.75–84의 후속 카드, 최단 Location 이동, Path 추가, 계절 봉쇄, Rarity 보정은 더 이상 미구현 사유가 아니다.
- 현재 Golden Master의 실행 상태 집계는 `Exact 119 / Partial 24`; 신규 Exact 2개를 포함한 143개 Exact/Partial Rule ID를 고정한다.
- 공유 Guild save 기반 멀티플레이 전달 원장은 사용자 결정에 따라 제품 범위에서 제외한다.
