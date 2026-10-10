# 원본 룰북 대조 감사

감사 시작: 2026-10-09. 재개 및 수정 검증: 2026-10-10 (Asia/Seoul). 이 문서는 규칙 담당자의 원본 대조·엔진 검증 기록이다. 실제 브라우저 결과는 같은 디렉터리의 전체 QA 기록에서 별도로 확인한다. 이 문서의 정적·단위 검증을 브라우저 전수 검증으로 해석하지 않는다.

## 근거 및 검증 방법

- 최우선 근거: 프로젝트 제공 `Apawthecaria v1.3.pdf`, First Edition, Third Printing (May 2023), 220 PDF 페이지. 아래 번호는 인쇄 페이지 번호이며 해당 PDF 페이지와 일치한다.
- PDF skill을 읽고 원본을 pypdf로 새로 추출했다. 기존 감사 보고서는 규칙의 증거로 사용하지 않았다. 제공된 `public/rulebook/reference-pages.json`의 SHA-256과 원본 파일의 SHA-256이 일치하며, 220개 페이지 전체의 정규화된 텍스트를 새 추출 결과와 비교한 결과 불일치는 0개다.
- `extracted_rulebook.json`은 220개 페이지 구조임을 확인했다. 이 파일을 원본 대신 규칙 판정의 근거로 사용하지 않았다.
- 텍스트 추출이 잃는 무게 아이콘은 원본 페이지를 직접 렌더해 확인했다. p.14 Familiar, p.62 Tools, p.65 Tools, p.128 Reagent index의 렌더를 시각적으로 확인했다. 다른 페이지 렌더는 준비했지만 시각 확인하지 않은 렌더를 확인 완료로 세지 않았다.
- 원본 근거 이미지: [p.14 Familiar](source-p14-familiar.png), [p.62 Tools 무게](source-p62-tool-weights.png). 구조 대조 결과: [source crosscheck](rulebook-source-crosscheck.json), [table crosscheck](rulebook-table-crosscheck.json).

## 실제 대조한 범위

| 범위 | 원문 페이지 | 확인한 구현·결과 | 검증 깊이 |
| --- | --- | --- | --- |
| 카드 값과 원문 우선순위 | 6–7 | A=1, J=11, Q/K=M=12, Specific Overrides General, 선택적 기록 | 원문 텍스트와 `cards.ts`, `rulesets.ts` 대조 |
| 여행 방식·기본 장비·Familiar | 11–12, 14–17 | Speed/Carry, Knife의 FP 허용, 기본 Preparation, Familiar 혜택 | 원문과 `rulesEngine.ts`, Tool/Familiar 연결 코드 대조; Chatty 결함 수정 |
| Journey 설정·종료 | 18–21, 38–43 | 카드 목적지 거리, 방향, 목표, 12/9/6/3일 Urgency, 기록 선택, Downtime | 원문과 Journey/DownTime 정의 및 엔진 대조. 모든 목표의 실제 플레이는 이 담당자가 실행하지 않음 |
| 이동·Soar·Waterway | 22–25 | Speed만큼 이동, 초과 무게의 1 Path, Loch 정지 제한, Soak, 미방문 Ruin/Barrow Soar 금지, Social/Travel 선택 | 원문과 `travelEngine.ts` 분기 대조 |
| 진단·재료·제조 순서 | 26–35 | 성격/종/Severity, Reputation 상한, 동시 Timer, 일반 태그 비중첩, FAIR/FOUL 상쇄, Remedy 후 Timer 순서 | 원문과 Patient/Foraging/Treatment/Barter 엔진 및 관련 회귀 테스트 대조 |
| Foraging | 30, 32–33 | Common +0, Rare +3/+6, Unavailable, 자동 FP 성공의 무소모, 차이만큼 FP 소비, Parts 추가 시간 | 원문과 rarity/candidate/gather/timer 계산 대조 |
| Bartering | 14, 34–35, 115 | Settlement 1회/City 3회, 비 Titan, 지역·계절·태그·Reputation 변동, 후속 카드와 부족값, Chatty·Wingbreak | 원문과 계산·실제 transaction·restore 테스트; 두 누락 수정 |
| Preparing to Leave | 36–37 | Severity 보상, FAIR/FOUL 2점당 보상, Gifting, Scrounge 비용 1/2/3/4, Pawning | 원문과 Treatment/Leave 코드 대조. 모든 실패 특수 효과의 UI 완주는 이 담당자가 실행하지 않음 |
| Clinic | 44–47 | 4 Seasons 개방, Wild 성공 후 15 Trinkets, 다음 Season 완공, Service Area 3 Paths, Agenda 조건 | 원문과 Clinic Agenda 정의 대조. 모든 Agenda transaction은 전수 실행하지 않음 |
| Trinket inspiration | 56–57 | 12행 Object/Material/Origin과 3회 draw 설명 | 원문 확인. 현재 UI의 모든 조합은 전수 실행하지 않음 |
| Services / Tools / Upgrades / Wagon / Companion | 58–71 | 제공 장소·가격·효과·Weight·기본 도구 업그레이드 및 주요 이동 혜택 | 원문과 정규 데이터 대조. Tool p.62 무게 결함 수정. 모든 서비스 후속 lifecycle은 전수 실행하지 않음 |
| Ailment index 및 기본 값 | 102–115 | Lesser 12, 다른 Severity 각 11 + M 하위 2개, 45개 이름·Timer·요구 태그 및 주요 반복/예외 | 원문 텍스트와 45개 정의 대조. 원문 내부 충돌은 아래에 보류 |
| Encounter source 및 lookup | Travel 74–99, Foraging 154–187, Social 190–212 | 103/144/66개 정규 정의와 참조 페이지·카드 범위·계절 선택 | 모든 이름/참조 구조 자동 대조 및 3,380 lookup; 모든 조우의 서사/효과 분기를 원문과 전수 의미 대조하지 않음 |
| Barrow 정의 | 118–125 | 8개 이름과 원본 참조, class/suit 구조 | 이름/참조 구조 대조. 모든 도전·보상·실패 분기 의미 검증은 미완료 |

## 발견한 결함과 수정

### RB-01 — p.62 Tool Weight가 여러 정수 단위를 1로 축소함 (P1)

원본은 Canvas Tent와 Big Iron Cauldron에 온전한 무게 원 2개, Bark Coracle에 3개를 표시한다. 기존 `src/rules/data/tools.ts`는 모두 Weight 1로 저장했다. 무게 1은 p.65 Waxed Satchel의 온전한 원 1개, 분수 아이콘은 p.62 Copper Frying Pan·Bolts와 구별해 확인했다.

| Tool | 수정 전 | 원문 및 수정 후 |
| --- | ---: | ---: |
| Canvas Tent | 1 | 2 |
| Big Iron Cauldron | 1 | 2 |
| Bark Coracle | 1 | 3 |

영향은 구매/보상/직접 복구 물품의 Weight, 초과 소지 판정과 이동 속도, Pawning 가치다. 정규 catalogue 값을 수정했고, `migrations.ts`는 이 세 도구의 알려진 이전 Weight 1을 복구한다. 인스턴스 ID·수량·다른 데이터는 보존한다. Bad Idea의 명시적 `weightAdjustment`는 보존한 채 올바른 기본 무게에 적용한다. 별도 근거가 없는 비표준 사용자 무게(예: 1.5)는 그대로 둔다.

`printedToolWeights.test.ts`의 새 6개 테스트 중 5개가 수정 전에 실패했고 수정 후 6개 모두 통과했다. 구매 결과·계산된 인벤토리 무게·기존 저장 복원·멱등 복원·명시적 무게 감소 보존을 확인했다. UI acquisition/import/reload 및 Carry 경계의 브라우저 검증은 상위 QA 담당자에게 전달했다.

### RB-02 — Chatty Familiar의 Barter Rarity -2 누락 (P1)

p.14는 Chatty가 원하는 Reagent Part의 Bartering Base Rarity를 2 낮춘다고 명시한다. 이전 `calculateBarterBR`/`resolveBarterStart`에는 Familiar 입력이 없었고, 앱의 거래 시작·목록 preview도 이를 넘기지 않았다. 문구만 혜택을 표시하고 실제 거래 수치는 바뀌지 않았다.

`barterEngine.ts`에 선택적 `familiarBenefit`을 추가했다. 기존 `FAMILIAR_BENEFITS`의 정확한 이름으로 Chatty를 식별해 -2 modifier를 넣는다. 다른 Familiar·기존 지역/계절/태그/Reputation modifier는 유지한다. BR 12 stand-in Replacement에도 동일하게 적용한다. App 호출부는 `getActiveFamiliarBenefit(state)`를 넘기므로 Passenger Booth에서 역할을 대신하는 동승자 선택도 같은 규칙 입력을 사용한다.

원본 기반 새 테스트 3개가 수정 전에 실패했고 이후 통과했다. Forest/Spring Beech Bark, Reputation 0 예시에서 거래 희귀도 3 → 1이며, 카드 1은 이전에 2점 지불 대기였으나 수정 후 성공한다. 저장/복원된 거래에도 계산값을 유지한다. 표준 Part와 Replacement를 모두 검증했다.

### RB-03 — Wingbreak의 계절 한정 Barter Rarity +2가 계산에 연결되지 않음 (P1)

p.115 Wingbreak Consequence는 모든 Reagent Part의 Bartering Rarity를 이번 Season이 끝날 때까지 2 높인다. `ailmentEffectEngine.ts`는 `wingbreak:barter-rarity-plus-2:<Season>` 조건을 기록했으나 거래 계산은 이를 읽지 않았다.

`calculateBarterBR`/`resolveBarterStart`의 선택적 `conditions` 입력으로 현재 Season의 정확한 조건을 읽고 +2 modifier를 적용한다. 중복 저장된 같은 조건은 중첩하지 않는다. Chatty -2와 함께 계산하며, Replacement에도 적용한다. App preview·transaction 입력이 동일한 조건을 받고, 공통 Season 전환에서 Wingbreak 조건을 제거하도록 연결했다. 이 제거는 내년에 같은 Season이 돌아왔을 때 만료된 조건이 재활성화되는 일을 막는다.

새 2개 테스트는 구현 전에 실패했고 수정 후 통과했다. 같은 Season의 +2, 다른 Season에서는 미적용, 중복 조건, Chatty와 조합, Replacement를 확인했다. 기본 사례 3 → 5, Chatty와 함께이면 3이다. 이 담당자는 실제 실패 발생부터 native UI에서 조건 생성까지의 전체 흐름을 브라우저에서 완주하지 않았다. 조건의 자동 생성과 수동 Consequence 기록의 경계는 최종 브라우저 기록에서 확인해야 한다.

## 카드·오라클·데이터 구조 검증 결과

- 원본 p.6과 일치: 내부 raw 12·13 모두 M=12로 처리, Travel A/2·3/4·5/6·7/8·9/10·J·M, Foraging A·2–10·J·M, Social은 suit로 조회한다.
- 원본 p.102–103의 Ailment index와 정규 배열 순서를 대조했다. M은 Intermediate→Lesser 2개, Severe→Intermediate 2개, Dire→Severe 2개를 동시 해결한다. Lesser M은 Waen Drops이다.
- 정규 데이터 599개(45 Ailments, 83 Reagents, 103 Travel, 144 Foraging, 66 Social, 8 Barrow, 10 Clinic Agenda, 23 Tools, 17 Services)의 이름이 참조한 원본 페이지에 존재하는지 정규화해 자동 대조했다. 596개 일치, 3개 예외는 아래 원문 내부 불일치/명시적 보류 행이다. 이 검사는 이름·참조 검증이며 해당 599개 효과를 의미상 모두 검증했다는 뜻이 아니다.
- 4 Seasons × raw 카드 1–13을 대상으로 Travel의 7개 Region, Foraging의 6개 Region, Settlement/City Social의 각 suit/해당 도시를 조회했다. 3,380건 모두 lookup 결과가 존재한다. lookup 존재는 선택/효과의 정확성 또는 자동 처리를 보장하지 않는다.
- 범위/출처 메타데이터는 제공 Apawthecaria 1E Third Printing을 가리킨다. 이번 감사에서 다른 룰북에서 가져온 것으로 확인된 규칙은 발견하지 않았다. 이름만 비슷한 별도 게임의 규칙 전체와 비교한 검사는 수행하지 않았다.
- 기본 `original-1e-3p`는 familiar trust scaling, legacy succession, Journey 고정 명성 swing, 재료별 brewing time, incomplete remedy, 직접 Make Do 대체, companion 비행/수상 권한, 수동 Season 전환, 무료 Delve 취소를 모두 house rule 비활성으로 구분한다. Legacy/Sandbox는 별도 설정이다. 그 모드의 모든 UI 노출을 이 담당자가 브라우저로 전수 확인하지는 않았다.

## 근거가 충돌하거나 추가 검토가 필요한 규칙

아래는 추측으로 고치지 않았다.

1. Wagon commissioning 가격: p.43은 20 Trinkets, 보다 상세한 Base Unit p.68은 15 Trinkets다. 현재 catalogue는 p.68의 15를 따른다. 저자 정오표 없이 한쪽 가격을 임의로 바꾸지 않았다.
2. Nervefright와 Seasonshift: p.103은 Severe 표에 넣지만 개별 설명 p.110/p.111에는 Lesser라고 인쇄했다. 현재 draw severity는 index의 Severe를 따른다. 이 원문 충돌을 규칙이 완전히 명확하다고 보고하지 않는다.
3. Loch Foraging Summer: p.169의 10/J 인쇄 배치가 중복/누락되어 `Summer Loch 10 · Printed Duplicate`, `Summer Loch J · No Printed Row` 두 예외 행을 명시적으로 보류한다. 이름 대조 예외 2개이며 임의 대체 조우를 창작하지 않았다. 실제 선택 UX는 상위 브라우저 QA에서 별도 확인한다.
4. Smokesnout: p.103 index는 Smokesnout, 실제 p.112 본문 제목은 Smoker's Snout. 정규 ID/표 이름은 유지했다. 이름 대조 예외 1개지만 Timer/요구 태그는 본문과 일치한다.
5. The Runs p.113 Consequence는 Intermediate `Woeful Waters`를 참조하지만 제공 룰북 Ailment index/본문에 독립 정의가 없다. 요구 태그·Timer를 창작하지 않는다. 해당 후속 사건은 원문/정오표 추가 확인이 필요하다.
6. p.103의 Wormridden 참조 113과 실제 본문 p.115, Bite The Paw/Hand 명칭·참조 차이는 실제 설명 페이지에 연결한 정규 자료를 기준으로 확인했다.
7. Wake의 ELSEWHERE 3 & 2 / JOY 3 & 2 및 Broken Beaks의 PAIN 3 & 2는 반복 요구다. 정규 특수 조건/직접 판정 경계는 존재하지만 모든 재료 사용량·별도 dose의 실제 UI 조합을 이번 담당자가 전수 실행하지 않았다.

## 실행한 테스트

수정 기대값은 원본 페이지에서 정했다. 테스트 통과를 위해 원문과 다른 기대값으로 변경하지 않았다.

- `npx vitest run src/rules/printedToolWeights.test.ts`: 수정 전 5/6 실패 → 수정 후 6/6 통과.
- `npx vitest run src/rules/chattyBarterFidelity.test.ts`: Chatty 수정 전 3개 실패 → 통과. Wingbreak 추가 2개 수정 전 실패 → 최종 5/5 통과.
- 최종 focused command: Chatty/Wingbreak, Printed Tool Weights, Phase 3, Lodge Barter, Canonical Barter Identity, Custom Remedy Acquisition, Migrations Torture, Phase 5/6/10, Canonical Validation, Rulebook Reference Registry. 12 파일, 131 테스트 통과(2026-10-10 22:12 KST 실행).
- TypeScript build와 전체 regression·lint·production build 최종 결과는 상위 QA의 최종 실행 기록에 합친다. 이 담당자가 실행한 조각을 전체 사이트 브라우저 pass로 표시하지 않는다.

## 남은 검증 경계

이번 보고서의 원본 대조 범위·자동 구조 검사를 넘어서 모든 Encounter의 nested 선택, 모든 reagent 아이콘의 Region/Season 색, 모든 Preparation 도구·용도·uses, 모든 Service/Clinic/Companion/Barrow 후속 절차를 개별 브라우저 실행으로 완전히 증명하지 않았다. 제공 원본 전체 reference가 정확히 실렸다는 것은 증명했지만, 원본의 모든 문장이 실행 가능하고 정확히 자동 처리된다는 증명은 아니다. 수동 해석이 필요한 서사·원문 오탈자·누락은 자동 규칙으로 창작하지 않았다.
