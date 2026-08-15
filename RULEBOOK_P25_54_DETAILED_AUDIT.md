# Rulebook p.25–54 Detailed Audit

검토일: 2026-08-15
검토 범위: `Apawthecaria v1.3.pdf` p.25–54, 총 30페이지
기준: 원문 규칙 → 정식 데이터/엔진 → 실제 화면 흐름 → 회귀 테스트 순서로 대조

## 결론

솔로 플레이의 핵심 루프인 Encounter, Ailment, Reagent, Foraging, Bartering, Preparing to Leave, Downtime, Wagon, Clinic은 대부분 구현되어 있다. 다만 이번 검토에서 룰북과 실제 동작이 다른 다섯 영역을 확인해 즉시 수정했다.

1. Soar가 항상 3일로 표시되고 지도 Path를 따라가는 것처럼 보이던 문제
2. Soar 착륙 후 현재 Region이 실제 지형이 아니라 `Soar`로 저장될 수 있던 문제
3. 목적지 이름을 직접 고를 때 Region/Location Type이 이전 선택값으로 남을 수 있던 문제
4. Agenda 조건을 만족하지 못하면 Clinic 자체도 건설할 수 없던 문제
5. Rumour가 Downtime Activity 1회를 소비하고, Goodwill Stand를 Clinic 밖에서도 쓸 수 있던 문제

가장 큰 미구현 영역은 p.48–53의 선택형 협동 플레이 세 가지다. 현재는 룰북 참조만 제공하며 Pen Pals, Caravan, Guild of Associates를 실제 캠페인 상태로 운영하는 기능은 없다.

## 페이지별 대조

| 페이지 | 원문 핵심 | 현재 상태 | 판정 및 상세 |
|---|---|---|---|
| p.25 | 도착 Location에 따른 Travel/Social Encounter, Move 후 1일, Earning Your Keep, Soar | 수정 완료 / 일부 수동 | Encounter 종류와 계절·Region 표는 정식 데이터로 연결된다. Soar를 직선 Flightpath, 0 Path, 1 Move로 표시하고 기본 1일만 더하도록 수정했다. Experimental Contraption만 3일이다. 미방문 Titan Ruin/Behemoth Barrow, 과적, 일반 Wagon 제한도 출발 전에 표시한다. 개별 Encounter의 서사 효과 일부는 여전히 수동 판정이다. |
| p.26 | Ailment 카드의 이름, Severity, Tags, Timer, Outcome, Consequence 구조 | 구현 | 정식 Ailment 데이터와 환자/타이머 상태가 각 필드를 보존한다. 다만 고유 서사 Consequence 가운데 구조화하기 어려운 효과는 Manual Effect 절차로 남는다. |
| p.27 | Reagent의 Type, Region/Season, Base Rarity, Parts, Preparation, Uses, Weight, Tags | 구현 | Reagent와 Preparation을 정식 ID로 관리하고 가방에서도 부위·조제법·Uses·Weight를 유지한다. |
| p.28 | 환자 생성, Personality/Descriptor, 기억할 점, Ailment 수 | 구현 | 환자 생성 카드와 기록 필드, 복수 Ailment 상태, 환자 기록 보관이 연결돼 있다. |
| p.29 | Reputation 상한에 따른 Severity, Ailment 식별, Timer 시작 | 구현 | Severity 상한, 진단, 복수 타이머가 엔진에서 검증된다. 일부 Ailment 전용 진단 후속 효과는 정식 수동 절차를 함께 사용한다. |
| p.30 | 현재/인접 Region과 Settlement/City를 기준으로 Reagent 조사 | 구현 | 지도 graph의 한 Path/Waterway 인접성을 사용하고 Region·Season·Tag·Potency 후보를 계산한다. |
| p.31 | Forage/Barter, Remedy 생성, Outcome, 실패 시 떠나기 | 핵심 구현 / 일부 수동 | 조제 재료 검증, Remedy 사용, 성공/실패와 환자 종료는 구현됐다. Ailment별 인쇄 Outcome/Consequence 중 서사적 선택은 Manual Effect로 확인한다. |
| p.32 | Wild/Titan/Barrow Foraging, 현재 또는 인접 Location, 카드와 Rarity | 구현 | 허용 Location, 인접 Region, 카드 희귀도, Foraging Point, 부위 선택을 검증한다. |
| p.33 | Foraging Encounter, Bags 확인, Timer 감소, 반복 여부 | 핵심 구현 / 일부 수동 | 채집 → Encounter → 가방 → 타이머 순서가 상태로 이어진다. 일부 Foraging Encounter의 인쇄 효과는 수동 선택이 남아 있다. |
| p.34 | 현재/인접 Settlement/City Bartering, Ailment당 횟수 | 구현 | 지도 인접성, 환자/Ailment, 장소별 시도 횟수와 목표 Reagent를 관리한다. |
| p.35 | Social Encounter, Haggle, 성공·실패 지불과 획득 | 구현 | Social Encounter 확인 뒤 카드 판정, 지불, Reagent 획득으로 이어진다. |
| p.36 | Preparing to Leave, FP 초기화, Overstay, 치료 보상, Rapport | 구현 | 떠나기 전 차단 조건, 환자 결과, 보상 및 기록 보관이 연결된다. 고유 Consequence는 해당 Ailment의 수동 절차가 개입할 수 있다. |
| p.37 | Scrounging, Consequence, Pawning, Guild Services | 구현 | 남은 Timer를 쓰는 Scrounge, 전당, 서비스 진입이 있다. 서비스별 세부 효과는 이후 Almanack 페이지의 정식 엔진을 사용한다. |
| p.38 | Journey 회고 질문과 결말 기록 | 부분 구현 | 결말·회고·Chronicle·Replay는 저장하지만 원문의 여러 회고 질문을 개별 체크리스트로 안내하지 않고 하나의 자유 기록 입력으로 압축한다. 플레이 편의상 구조화할 여지가 있다. |
| p.39 | 선택형 Tangible Effects 예시 | 부분 구현 | Speed/Carry, Reputation, 새 Settlement, 은퇴 등 주요 조정 도구는 있다. Familiar 교체, Path 제거/Region 변화, 할인·출입 금지 같은 모든 예시를 전용 UI로 제공하지는 않는다. 이 페이지는 선택 규칙이므로 핵심 진행 차단은 아니다. |
| p.40 | Downtime 1회, City 종료 시 Rumour, 4장으로 Barrow 생성 | 수정 완료 | Rumour를 일반 Downtime Activity와 분리했다. Reputation 15+, City에서 끝낸 Journey, Journey당 1회 조건을 저장하며 활동 1회는 소비하지 않는다. 방향·Region·거리와 실제 지도 후보를 검증한다. |
| p.41 | General Practice, Replenish, Explore, Self Improvement | 구현 | 보상·영구 Tag 변경·가방 보충·지도 연결·Travel Style/능력치 변경이 Downtime 1회 규칙과 연결된다. |
| p.42 | Reconnecting, Relaxing with Friends, Lending a Paw | 구현 | 최근 Journey 종료점에서 가장 가까운 City, Ledger/Map/Juicy Gossip, Tool/Familiar, Reputation +5를 처리한다. |
| p.43 | City Wagon 20 Trinkets, +4 Carry/+1 Speed, 확장, New Game Plus | 구현 / 판본 주의 | 현재 p.43의 20 Trinket을 따른다. p.68 Base Unit 표기와 비용 해석이 충돌할 여지가 있어 자동 변경하지 않았다. Wagon과 확장은 상태로 유지된다. |
| p.44 | 4 Seasons 뒤 Wild 치료 성공, 15 Trinkets, Clinic 건설·완공·Service Area | 구현 | 조건, 중복 위치, 다음 Season 완공, graph 3 Path Service Area를 검증한다. |
| p.45 | 삽화 | 해당 규칙 없음 | 구현 대상이 없다. |
| p.46 | Clinic마다 조건 충족 시 전역 Agenda 추가, Agenda 없이도 Clinic 건설 가능, Pantry/Library/Hive/Gardens/Greenhouses | 수정 완료 / 일부 표현 개선 여지 | Agenda 선택을 선택 사항으로 바꿨다. 전역 Agenda 합집합과 Service Area 효과가 작동한다. Clinic별 Garden 상태와 전역 서비스의 차이는 기능상 처리되지만 화면 설명을 더 명확히 할 여지는 있다. |
| p.47 | Sodden Logs, Taproom, Hostel, Mailbox, Goodwill Stand | 수정 완료 | 계절·Ailment당 1회·Timer·Season 수입·기부 Weight를 상태로 처리한다. Goodwill Stand는 원문대로 Clinic에 직접 머물 때만 기부할 수 있도록 수정했다. |
| p.48 | Co-op 원칙과 합의에 의한 규칙 변경 | 참조만 제공 | 룰북 원문은 찾을 수 있으나 공동 합의·세션 규칙을 저장하는 기능은 없다. |
| p.49 | Pen Pals, Familiar Benefit, 정착지/City를 떠날 때 편지, Send Package | 미구현 | 비동기 플레이어 명단, 플레이어별 Familiar Benefit, Journey 편지, 공유 Mailbox가 없다. Send Package는 솔로 서비스만 구현돼 있다. |
| p.50 | Caravan 생성, 공유 Travel Style, 플레이어당 Carry +1, Soar 제한 | 미구현 | 다인 캐릭터 roster와 Caravan 계산 상태가 없다. |
| p.51 | 공유 Timer/FP, 병렬 Forage/Barter, Settlement 2회·City 4회, Downtime Benefit 1개 | 미구현 | 솔로 환자와 개별 시도 횟수만 존재한다. 다중 Encounter 배분과 공동 승인 흐름이 없다. |
| p.52 | Guild of Associates의 공유 Map/Reputation/Season, Chronicler, 공동 Tangible Effects, Wagon Contract | 미구현 | 현재 저장은 한 플레이어 캠페인 단위다. 공유 Guild 원장, 제출/승인, Season 동기화 기능이 없다. |
| p.53 | 플레이어 수별 Reputation/Clinic/Wagon 배율 | 미구현 | 캠페인 인원수와 동적 임계값 테이블을 적용하는 엔진이 없다. |
| p.54 | Almanack 색인과 참조 안내 | 구현 | Rulebook Hub와 문맥 참조가 관련 페이지로 연결된다. 이 페이지 자체는 진행 규칙이 아니다. |

## 이번에 수정한 동작

### Travel / Soar

- 지도에 존재하는 목적지 이름을 입력하면 실제 Region과 Location Type을 자동 적용한다.
- 실제 지도 위치를 골랐을 때 임의의 다른 Region/Location Type을 섞지 못하게 한다. `Soar`만 이동 방식으로 별도 선택할 수 있다.
- Soar 미리보기와 지도 오버레이를 최단 Path가 아닌 현재 위치와 목적지를 잇는 직선 Flightpath로 표시한다.
- 보통 Soar는 1일, Experimental Contraption은 3일로 계산한다.
- 착륙 후 `currentRegion`은 `Soar`가 아니라 목적지의 실제 Region으로 저장한다.
- Soar 불가 사유를 카드 드로우 전에 출발 점검에서 보여준다.
- Region 명칭과 `Soar` 선택지는 영어 표기를 유지한다.

### Downtime / Rumour

- Rumour를 “Downtime Activity 1회”와 분리했다.
- City에서 끝낸 Journey ID를 기준으로 한 번만 들을 수 있게 저장한다.
- 이미 활동을 마친 뒤에도 다음 Journey를 시작하기 전이라면 해당 Journey의 Rumour를 들을 수 있다.
- 새 Journey를 끝내면 새 Journey ID로 다시 한 번 들을 수 있다.

### Clinic / Agenda

- Agenda를 고르지 않고 Clinic만 건설할 수 있다.
- Agenda를 골랐을 때만 정식 ID와 선행 조건을 검증한다.
- Goodwill Stand 기부는 active Clinic에 직접 머물 때만 허용하고 UI도 비활성화한다.

## 남은 기능 제안 우선순위

### P1 — Co-op Campaign Modes

가장 큰 공백이다. 한 번에 모두 만들기보다 다음 순서가 안전하다.

1. `Campaign Mode`: Solo / Pen Pals / Caravan / Guild of Associates
2. `Player Roster`: 이름, 캐릭터, 제공 Familiar Benefit, 활성/휴면 상태
3. `Shared Ledger`: Reputation, Season, World Map mutation, Wagon Contract
4. `Proposal & Approval`: 지도·Reputation·Tangible Effect 변경을 제출하고 Chronicler가 승인
5. Caravan 전용 공유 Timer, Foraging Point, Barter 횟수, Encounter 배분
6. Pen Pals 편지 작성 알림과 Send Package 수령 확인

공유 서버가 없는 현재 구조에서 곧바로 실시간 동기화를 넣으면 저장 충돌 위험이 크다. 먼저 로컬 campaign schema와 export/import 가능한 변경 원장을 만든 뒤 Firebase 공유를 연결하는 편이 안전하다.

### P2 — Structured Reflection

p.38의 회고 질문을 접을 수 있는 체크리스트로 제공하고, 답하지 않아도 자유 기록으로 끝낼 수 있게 하면 규칙을 강제하지 않으면서 기록 품질을 높일 수 있다.

### P2 — Tangible Effect Assistant

p.39의 선택 효과를 “제안 → 미리보기 → 확인 → Undo 가능한 적용” 흐름으로 만들 수 있다. 특히 Path 제거, Region 변경, Familiar 변화, Location 출입 제한은 지도와 상태에 장기 영향을 주므로 변경 원장과 함께 구현해야 한다.

### P2 — Printed Effect Automation

현재 Manual Effect 절차는 규칙 누락을 막지만, Ailment/Foraging/Travel Encounter의 반복적인 숫자 변화는 더 자동화할 수 있다. 서사 선택은 수동으로 유지하고 Timer, Reputation, Trinket, Item, Map mutation만 구조화하는 것이 적절하다.

## QA 기준

- Soar: 기본 1일, Experimental Contraption 3일, Path 0, 실제 착륙 Region 유지
- Travel: 목적지 이름/지도 선택 시 Region과 Location Type 동기화
- Rumour: City Journey 종료 필요, Reputation 15+, Journey당 1회, Downtime Activity 미소비
- Clinic: Agenda 없이 건설 가능, 선택 Agenda 조건은 계속 강제
- Goodwill: Clinic 밖에서는 거부, Clinic에서는 Item 전체 Weight 누적
- 전체 test suite, rule validation, reference validation, TypeScript build, production bundle build
