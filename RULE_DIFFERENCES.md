# 룰북과 앱의 차이 기록

## 분류 원칙

- **편의 기능**: 원작에 없지만 확률, 비용, 보상, 가능한 행동을 바꾸지 않는다.
- **기록 기능**: 종이 저널의 보관·검색을 돕는다. 기록을 대신하거나 진행 조건을 없애면 더 이상 순수 편의가 아니다.
- **House Rule**: 원작에 없는 규칙이 실제 플레이 결과를 바꾼다.
- **Incorrect/Missing**: 원작 규칙을 구현하려 했으나 값·조건·순서가 다르거나 없다.
- **Ambiguous**: 같은 판본 안의 문구 충돌 또는 허용 범위가 불명확해 사용자 결정을 받아야 한다.
- **오래된 룰**: 다른 판본에서 왔다는 근거가 확인될 때만 사용한다. 단지 원작과 다르다는 이유로 이 이름을 붙이지 않았다.

## 게임 결과를 바꾸는 House Rule

| ID | 앱 동작 | 룰북 | 결과 영향 | 후속 권장안 |
|---|---|---|---|---|
| HR-001 | Familiar 신뢰 40/80에서 Brushwise/Chatty/Titanwise 보정이 -2에서 -3/-4로 증가 | p14-15의 효과 값은 고정 | 채집·흥정·Titan 판정 성공률 상승 | 기본 OFF인 “Familiar 성장” 선택 규칙으로 분리하고 저장 데이터에 ruleset 표기 |
| HR-002 | 은퇴/계승으로 Sickle, 평판 10, Trinket 8 등을 후계자에게 전달 | 해당 캠페인 절차 없음 | 다음 캐릭터 시작 자원과 난이도 변화 | “Legacy Campaign” 선택 규칙으로 명시하거나 원작 모드에서 비활성 |
| HR-003 | Legacy Clinic 휴식/선물 등 계승 관련 기능 | 해당 절차 없음 | 회복·재화·진행 속도 변화 | HR-002와 같은 선택 규칙으로 묶기 |
| HR-004 | legacy-campaign에서만 여정 성공 +5 평판, 실패 -3 평판 적용 | p38은 서술적 결말이며 고정 공식 없음 | 기존 캠페인의 평판 구간과 질환 난이도 변화 | `original-1e-3p`에서는 OFF; 기존 Save 호환용 legacy ruleset에만 격리 |
| HR-005 | 선택한 Remedy 재료 하나마다 1시간/Timer 소비 | p31은 충분한 재료가 모이면 즉시 Remedy 완성 | 재료가 많을수록 실패 가능성 증가 | 원작 모드에서 제거; 시간제 조제 옵션으로만 유지 |
| HR-006 | 불완전 Remedy를 투여하고 즉시 실패 확정 가능 | 완성 Remedy가 없으면 채집/흥정/떠나기 흐름 | 환자 실패와 평판 손실을 임의로 앞당김 | 원작 모드에서는 행동 숨김/차단 |
| HR-007 | legacy-campaign의 direct Make Do/Replacement 즉시 생성 | p30은 대체물을 실제로 Forage/Barter | 자원·시간·실패 위험 제거 | `original-1e-3p`에서는 직접 생성을 차단하고 pending 획득 조건을 저장; Replacement Rarity 12 자동 연결은 남은 작업 |
| HR-008 | Needle 등 일부 Tool로 Timer 부족을 무시하고 완료 | 원문에 해당 우회 없음 | 시간 제한 무력화 | 원작 모드에서 제거하거나 출처가 있는 효과로 교체 |
| HR-009 | Butterfly/Honeybee/Wasp 등으로 Soar 가능, Pond Skimmer 등을 수로 안전으로 간주 | Companion 문구에 그런 이동 권한 없음 | 지도 거리·조우·수로 위험 무시 | 원작 모드에서 Style/장비 조건만 사용 |
| HR-010 | Delve를 비용 없이 일반 중단하고 Local Help 의무도 정리 가능 | p116-125는 각 Delve의 Flee/종료 절차 사용 | Barrow 비용과 위험 우회 | 일반 취소를 없애고 각 Flee 절차로 통합 |
| HR-011 | Season을 수동으로 바꾸는 운영 UI | 원작은 여정과 Downtime 흐름 속 계절 진행 | 재료 가용성·조우·Clinic 시점 임의 변경 | 개발/sandbox 기능으로 표시하고 원작 모드에서는 절차로만 변경 |

`HR-005`부터 `HR-008`은 의도적인 확장인지 임시 구현인지 코드만으로 확정할 수 없다. 현재 결과가 원작과 다르므로 추적표에서는 `Incorrect` 또는 `House Rule`로 보수적으로 분류했고, 유지하려면 사용자에게 명시되는 선택 ruleset이 필요하다.

## Phase 3에서 해소된 차이

| 기존 차이 | 현재 처리 | 남은 제한 |
|---|---|---|
| `DF-010` Barter 수정치 | `calculateBarterBR()`가 Local, 3 Paths 교역 City, Season, Curiosity, FAIR, Tag 3, FOUL, Reputation을 선택 Preparation 기준으로 계산 | Social printed effect 자체가 manual일 수 있음 |
| `DF-011` Barter K=13 | Barter의 Q/K를 모두 M=12로 고정 | Service/Barrow의 별도 카드 판정은 해당 Rule ID에서 계속 추적 |
| `DF-012` 수량 기반 Pawn | 여러 아이템의 남은 Weight 합계를 한 번 반올림 | 없음 |
| `DF-017` 목적지 외 Ending | canonical Destination graph ID와 현재 위치가 다르면 차단 | 없음 |
| `DF-018` Evidence Weight 1/3 | Justice 시작 시 Weight 1 Evidence 생성 | 없음 |
| Journey 고정 +5/-3 | 원작 ruleset에서 제거, legacy-campaign에만 격리 | legacy 캠페인은 의도적으로 기존 결과 유지 |
| 직접 Make Do 생성 | 원작 ruleset에서 금지하고 +1 Potency 실제 Part 확인 | 기존 가방 Part도 조건을 충족하면 사용할 수 있음 |
| 실패 Archive의 성공 덮어쓰기 | canonical status/result 정규화와 stale-write 보호 | 구형 표시용 casebook은 migration adapter로 유지 |

`REMEDY-003`은 차이가 완전히 해소되지 않았다. 원작 모드에서 직접 placeholder 생성은 막았지만, 이름·Preparation·Weight 2/3·Rarity 12를 하나의 Forage/Barter transaction으로 완료하는 executor가 아직 연결되지 않아 `Partial`이다.

## Phase 4 + Phase 5에서 해소된 차이

| 기존 차이 | 현재 처리 | 남은 제한 |
|---|---|---|
| Forecast 범위를 “목적지까지”로 해석 | 실제 p59 원문대로 다음 3 Moves를 사용 | manual Weather printed effect의 자동 억제는 `Partial` |
| Rumour 자유 텍스트 위치 | 네 장의 Suit와 실제 지도 방향·Region·Path 후보만 선택 | 가능한 조합이 없으면 자동 재추첨 |
| Companion의 임의 Soar/수로 권한 | `original-1e-3p`에서 제거하고 Experimental/Coracle/Sealed 등 명시 장비만 사용 | legacy ruleset의 선택 House Rule은 보존 |
| Wasp가 Reagent를 즉시 지급 | 10 Paths마다 INSECT 전용 실제 Foraging 카드 transaction을 저장 | 없음 |
| Clinic service area 5 Paths/같은 Region | graph 최단거리 3 Paths로 통일 | legacy Clinic 선물 기능은 별도 House Rule |
| Service/Tool/Upgrade 표 누락 | 17/18/7 canonical 표와 source page를 복구 | 일부 고유 trigger UI는 `Partial` |
| 오프라인 변경 유실 | local-first outbox, retry, revision conflict 정책 추가 | 같은 revision은 자동 병합 대신 local 보존·충돌 표시 |

## 초기 감사 당시 원작 구현 오류와 누락

다음 표는 최초 감사 당시 근거를 보존한다. 현재 해소 여부와 판정은 위 Phase 3 표 및 `RULE_TRACEABILITY.md`를 따른다. “취향 차이”가 아니라 기본 원작 모드의 결과를 직접 바꾸는 항목은 House Rule로 포장하면 안 된다는 분류 원칙은 유지한다.

| ID | 차이 | 결과 | 분류 |
|---|---|---|---|
| DF-001 | 일반 Move가 지도 인접/Path를 검증하지 않고 자유 텍스트 위치로 이동 | 불가능한 이동, 거리·시간·서비스 범위 오류 | Incorrect |
| DF-002 | Settlement/City 도착에서 Travel과 Social Encounter가 모두 발생 | 조우 횟수와 자원 변화 증가 | Incorrect |
| DF-003 | Soar가 방문 여부·일반 Wagon·목적지 유형을 완전히 검증하지 않음 | 장거리 이동 제한 우회 | Incorrect |
| DF-004 | 환자 Personality/Descriptor와 Severity 카드/평판 상한이 없음 | 환자 생성과 질환 확률이 원작과 다름 | Missing |
| DF-005 | 단일 `activeAilment`만 지원 | M 결과와 다중 Timer 질환 불가능 | Incorrect |
| DF-006 | 45개 질환 데이터의 중복·누락·등급 오류, 특수 효과 대부분 미실행 | 진단, 요구, 보상, 실패 결과 왜곡 | Incorrect/UI-only |
| DF-007 | Reagent 3상태 가용성, 준비 Tool, Weight, Uses가 구조에서 손실 | 채집 가능 여부·가방·치료가 전반적으로 왜곡 | Incorrect |
| DF-008 | 한 번 채집으로 여러 종류 Reagent를 획득 가능 | 획득량 과다 | Incorrect |
| DF-009 | Foraging A-10 키가 데이터와 맞지 않아 기본 조우로 폴백 | 지역·계절 조우 확률 붕괴 | Incorrect |
| DF-010 | Barter 수정치가 거리·Curiosity·선택 Part 대신 단순화된 값을 사용 | 성공률과 비용 왜곡 | Incorrect |
| DF-011 | K를 일부 판정에서 13으로, Suitable Furnishings에서 Q/K를 10으로 사용 | 카드 확률·마일스톤 왜곡 | Incorrect |
| DF-012 | Pawn이 총 Weight 반올림이 아니라 수량만큼 지급 | 재화 과다/과소 지급 | Incorrect |
| DF-013 | Downtime을 한 번이 아니라 반복 가능 | Speed/Carry/평판/재화 무한 획득 | Incorrect |
| DF-014 | Clinic 즉시 완성, service area 5 Paths 또는 같은 Region | 해금 시점·범위 확대 | Incorrect |
| DF-015 | Travel/Foraging/Social 표의 지역·계절·카드 행이 누락/오배치 | 확률과 콘텐츠 노출이 원작과 다름 | Incorrect |
| DF-016 | 조우·질환·Tool 특수 효과를 텍스트와 수동 버튼에 맡김 | 강제 결과 생략 또는 임의 지급 가능 | UI-only |
| DF-017 | Journey가 목적지가 아닌 곳에서도 종료 가능 | 목표·결말 절차 우회 | Incorrect |
| DF-018 | Justice Evidence Weight가 1/3 | Carry와 Goal 난이도 감소 | Incorrect |
| DF-019 | 1MB를 넘는 저장은 클라우드와 로컬 모두 거부 | 사진/긴 저널과 함께 진행 전체 손실 가능 | Incorrect |
| DF-020 | 활성 Travel/Foraging 조우가 저장되지 않음 | 새로고침으로 의무 효과·Timer 비용 우회 | Missing |
| DF-021 | 비동기 저장에 순서·리비전·충돌 처리가 없음 | 오래된 상태가 최신 상태를 덮을 가능성 | Missing/Incorrect |

## 웹앱 고유 편의 기능

### 게임 결과를 바꾸지 않는 기능

| 기능 | 분류 | 조건 |
|---|---|---|
| 지도 drag-to-pan, zoom | 순수 UI 편의 | pointer 동작이 Move/Mark Day를 호출하지 않아야 함 |
| 검색, 정렬, 필터 | 순수 UI 편의 | 잠긴 정보와 미발견 정보를 새로 노출하지 않아야 함 |
| 아이콘, 애니메이션, 모달 | 순수 UI 편의 | 닫기·뒤로가기·연속 클릭이 보상을 적용하지 않아야 함 |
| Tooltips와 상태 설명 | 접근성/정보 기능 | 원문 선택/강제 의미를 바꾸지 않아야 함 |
| 자동 저장 | 기록 편의 | 최신 상태를 순서대로 보존하고 실패를 알려야 함 |
| Patient Archive | 기록 편의 | 원작 저널을 대체하지 않고 실제 결과를 정확히 보존해야 함 |
| 저널 사진 첨부 | 기록 편의 | 저장 한도 때문에 전체 진행 저장을 막지 않아야 함 |
| 북마크 | 기록 편의 | 게임 해금/보상과 연결되지 않아야 함 |

### 현재는 편의 기능의 경계를 넘는 항목

| 기능 | 원래 의도 가능한 분류 | 현재 문제 |
|---|---|---|
| 자동 조우 텍스트 | 기록 편의 | 강제 효과가 상태에 연결되지 않아 플레이어가 규칙을 놓치게 한다. |
| 자동 태그 파싱 | 계산 편의 | 구조화되지 않은 문자열과 비백트래킹 할당으로 치료 성공을 오판할 수 있다. |
| 자유 텍스트 목적지/위치 | 서술 편의 | 지도상 불가능한 이동과 서비스 거리를 허용한다. |
| 수동 Goal/Delve 카운터 | 진행 기록 편의 | 실제 요구를 충족하지 않고 완료·보상을 확정할 수 있다. |
| 결과 모달 | UI 편의 | 진행 중 상태가 모두 저장되지 않고 중복 적용 방지 테스트가 없다. |
| Almanack/Herbarium 전체 노출 | 참고 편의 | 발견과 현재 보유, 원작 기본 공개 범위가 명확히 분리되지 않는다. |

## 오래된 룰 구현 여부

감사한 저장소와 1판 3쇄 룰북만으로는 현재 차이가 이전 판본에서 왔다는 근거를 찾지 못했다. 다음 항목은 오래된 룰로 단정하지 않는다.

- 여정 성공 +5/실패 -3
- Familiar 신뢰 성장
- 은퇴/계승
- 조제 시간 1시간/재료
- Companion의 비행·방수 권한
- Clinic service area 5 Paths

이 항목들은 출처가 제시되기 전까지 각각 House Rule 또는 구현 오류로 관리해야 한다. 향후 다른 판본을 지원하려면 `rulesetId`와 `rulebookEdition`을 저장 데이터에 명시해야 한다.

## 콘텐츠 누락과 번역 차이

| 영역 | 확인된 차이 | 성격 |
|---|---|---|
| Ailment | Bite the Hand that Cures 누락, Paw Rot 중복, 등급 오분류 | 규칙 데이터 오류 |
| Reagent | Woundwort/Yarrow/Yellow Wort 누락, Horse Chestnuts 중복 | 규칙 데이터 오류 |
| Tool | Titan Thingamabob 획득·사용 모델 누락 | 콘텐츠/규칙 누락 |
| Guild Service | Send Package 누락 | co-op 콘텐츠 누락 |
| Encounter | 페이지 경계에서 Region 배열로 행이 밀림 | 파서/데이터 오류 |
| Reagent 이름 | `can only be Foraged...` 같은 각주가 이름에 결합 | 파서 오류 |
| 질환/재료 설명 | 조건·수치·부작용이 축약되거나 다른 태그로 번역 | 규칙 번역 오류 |

문장 어순, 자연스러운 한국어 표현, 분위기 차이는 게임 결과를 바꾸지 않으면 오류로 세지 않았다. 태그, 숫자, `must/cannot/unless`, 비용, 후속 상태가 바뀐 번역만 규칙 오류로 기록했다.

## 모호한 규칙 결정 기록

### AM-001: Wagon 기본 비용

- 원문 위치: p43 `Commission a Wagon`은 20 Trinkets, p68 Wagon 설명은 15 Trinkets.
- 해석 A: Downtime 활동으로 주문할 때 20, 다른 획득 맥락의 기본 가격은 15.
- 해석 B: 같은 항목의 편집상 수치 충돌이며 한 값으로 통일해야 함.
- 현재 앱: p43 Downtime 주문 절차는 20 Trinkets로 적용하고 p68의 15 Trinkets 표기는 데이터 출처 충돌로만 보존한다.
- 영향: Wagon 획득 시점이 크게 달라진다.
- 권장안: 원문 충돌을 앱 내 임의 해소하지 말고 ruleset 메모에 기록. 저자 정오표가 없다면 p43의 활동 절차 20을 우선하는 안이 보수적이다.
- 사용자 확인 필요: 예.

### AM-002: Loch에 멈출 수 있는 장비

- 원문 위치: p24 수로/Loch 문단.
- 해석 A: 문맥상 Waxed Satchel과 Coracle 같은 적합한 장비를 폭넓게 허용.
- 해석 B: 실제로 뜨거나 머물 수 있게 하는 이동 장비만 허용하고 단순 방수 가방은 제외.
- 현재 앱: Waxed Satchel을 허용.
- 영향: Loch 경유 가능 위치와 이동 경로가 달라진다.
- 권장안: 현재 처리를 `Ambiguous`로 유지하고 허용 장비 목록을 ruleset 결정으로 명시.
- 사용자 확인 필요: 예.

### AM-003: Social Encounter 계절 Suit 오탈자

- 원문 위치: p188은 계절 무늬를 `♠ or ♠`로 인쇄/추출한다.
- 해석 A: 실제 표 배열대로 ♣/♠가 계절 무늬다.
- 해석 B: 인쇄 문구를 문자 그대로 적용해 ♠만 계절로 본다.
- 현재 앱: ♣/♠ 행은 있으나 Season을 무시한다.
- 영향: 계절 조우의 절반과 확률 분포.
- 권장안: p190-213의 실제 표 구조를 근거로 ♣/♠를 사용. 이는 문맥상 강한 추론이므로 감사 문서에 근거를 남긴다.
- 사용자 확인 필요: 낮음.

### AM-004: 첫 세션 Odoak/Spring

- 원문 위치: p18.
- 해석 A: 첫 세션 편의를 위한 권장 시작.
- 해석 B: 캠페인 생성 기본값.
- 현재 앱: Oak Road/Forest/Spring 기본.
- 영향: 첫 목적지와 서사 출발점.
- 권장안: 강제 규칙이 아닌 추천 프리셋으로 제공하면 충분하다.
- 사용자 확인 필요: 아니오.

### AM-005: 의도적 규칙 변경과 기본 원작 모드

- 원문 위치: p7의 유연한 저널링/규칙 조정 안내.
- 해석 A: 플레이어가 알면서 규칙을 바꿀 수 있으므로 앱도 선택 옵션을 제공할 수 있다.
- 해석 B: 앱이 알리지 않고 다른 결과를 강제해도 된다는 뜻은 아니다.
- 현재 앱: 원작 규칙과 House Rule이 같은 화면에 섞여 있다.
- 영향: 사용자가 현재 결과가 원작인지 알 수 없다.
- 권장안: 기본은 1판 3쇄 원작, 변경 규칙은 명명된 선택 ruleset으로 분리한다.
- 사용자 확인 필요: House Rule별 유지 여부.

## 지도 텍스트 가시성

지도 위에 추가된 서비스 범위/안내 텍스트는 현재 배경색과 선, 확대 수준에 비해 대비와 글자 크기가 낮다. 이는 규칙 계산 오류와 별개의 UX 결함이지만, 사용자가 Clinic 범위나 지도 상태를 오해할 수 있어 `UX-002 Partial`로 추적했다. 다음 구현 단계에서는 배경과 무관한 고대비 라벨, 안정된 최소 글자 크기, 확대 단계별 표시 우선순위, 모바일 겹침 검사를 함께 해야 한다.

## 권장 ruleset 경계

향후 수정 단계에서는 최소한 다음 세 층을 구분하는 것이 안전하다.

1. `Apawthecaria 1E Third Printing`: 원작 수치·표·강제 절차만 적용.
2. `Optional House Rules`: Familiar 성장, Legacy, Journey Stakes 등 사용자가 각각 켜는 규칙.
3. `Sandbox/Recovery Tools`: 수동 Season, 상태 수정, 즉시 아이템 생성. 일반 플레이 기록에는 사용 여부를 남김.

이번 감사에서는 어떤 차이도 삭제하거나 유지하도록 코드에 반영하지 않았다.
