# Apawthecaria 데이터 표 감사

## 기준과 판정 방법

- 기준본: *Apawthecaria*, First Edition, Third Printing (May 2023).
- 룰북 PDF에서 페이지별 표를 추출한 `extracted_rulebook.json`과 앱의 `src/gameData.ts`, `src/rulebook_ko.json`을 이름·개수·페이지·카드·무늬·계절·태그 단위로 대조했다.
- 단순 행 수가 같아도 카드 분포, 계절, 지역, 준비법, Weight, Uses, 특수 문구 중 하나가 다르면 일치로 보지 않았다.
- 앱 데이터는 런타임 로직까지 추적했다. 표시만 되는 문구는 실제 표 구현으로 인정하지 않았다.
- 원문 설명 안에 섞인 자유 서술 질문은 독립 행으로 세지 않고, 그 질문을 포함하는 원본 표 행이 보존됐는지 확인했다.

## 전체 결과

| 표 | 룰북 기대값 | 앱 | 판정 | 핵심 차이 |
|---|---:|---:|---|---|
| Character Descriptor | 12 | 12개 선택 UI | Partial | 표면 항목은 있으나 필수 저널·랜덤 결과 추적이 없다. |
| Style | 4 | 4 | Partial | 일부 Style 효과에 원작 외 수로/비행 권한이 섞인다. |
| Basic Tool | 5 | 시작 구성 존재 | Partial | 실제 준비법 자격 검증에 사용되지 않는다. |
| Familiar | 12 | 12 | Partial | 신뢰 성장, 비행·방수 등 원작 외 효과가 있다. |
| Familiar Relationship | 12 | 12개 선택 UI | Partial | 표와 저장 필드의 완전 대응 테스트가 없다. |
| Journey Goal | 12 | 12 | Partial | 일부 완료 조건이 잘못된 필드를 읽고 수동 카운터로 우회 가능하다. |
| Patient Personality | 12 | 0 | Missing | p28의 첫 카드 표가 없다. |
| Patient Descriptor | 12 | 0 | Missing | p28의 두 번째 카드 표가 없다. |
| Ailment named rows | 45 unique | 45행, 44 unique | Incorrect | 중복 1, 누락 1, 오분류 3 이상, M 복수 결과 없음. |
| Ailment requirement tags | 20종 어휘 | 중앙 레지스트리 없음 | Partial | 문자열 파서가 실제 판정에 쓰이며 미등록/오타 경고가 없다. |
| Reagent | 83 unique | 81행, 80 unique | Incorrect | 중복 1, 누락 3, 49종 태그 집합 차이, 3상태 가용성 미지원. |
| Travel Encounter | 6지역×16 + Titan 7 = 103 | 94 | Incorrect | 지역 경계 번짐, 카드/계절 분포 손상. |
| Foraging Encounter | 6지역×24 = 144 | 123 | Incorrect | 21행 누락/오배치, A-10 런타임 키 불일치. |
| Social Encounter | 66 | 66 | Incorrect | 총수만 같고 지역별 배치와 Season/City 선택 로직이 틀림. |
| Barrow Delve | 8 | 8 UI | Partial | 요구 태그·재료·완료 조건 대부분이 수동 자기확인이다. |
| Guild Service | 17 | 16 | Partial | co-op 전용 Send Package 누락, 여러 서비스 효과 축약. |
| Tool | 18 | 17 | Incorrect | Titan Thingamabob 누락, 준비 도구 자격 미적용. |
| Tool Upgrade | 7 | 7 | UI-only | 이름은 있으나 다수 효과가 규칙 판정에 연결되지 않는다. |
| Wagon Expansion | 10 | 10 | Partial | 일부 이동/수로/조우 효과가 강제되지 않는다. |
| Companion | 9 | 9 | Partial | 조건·주기 누락과 원작 외 이동 권한이 있다. |
| Clinic Agenda | 10 | 10 | Partial | 거리, 활성 시점, Gardens 상태가 원작과 다르다. |
| Rumour | 4-card procedure | 0 | Missing | 평판/City 조건과 class/direction/region/distance 추첨이 없다. |
| Trinket creation | 3-card object/material/origin | 0 | Missing | 보상은 숫자로만 지급된다. |
| 독립 Weather 표 | 없음 | 없음 | Exact | 날씨는 독립 일일 표가 아니라 Encounter의 `Weather` 결과다. 앱의 문제는 표 누락이 아니라 효과 자동화 누락이다. |

## 질환 표

### 등급과 고유성

| Severity | 룰북 named rows | 앱 행 | 차이 |
|---|---:|---:|---|
| Lesser | 12 | 16 | +4 |
| Intermediate | 11 | 10 | -1 |
| Severe | 11 | 8 | -3 |
| Dire | 11 | 11 | 0 |
| 합계 | 45 | 45 | 행 수는 같지만 고유 이름은 44 |

룰북의 각 M 결과는 별도 named ailment가 아니다. Intermediate M은 Lesser 2개, Severe M은 Intermediate 2개, Dire M은 Severe 2개를 생성한다. 앱에는 이 분포와 복수 Timer를 표현할 자료구조가 없다.

### 확인된 행 오류

| 항목 | 룰북 | 앱 | 판정 |
|---|---|---|---|
| Paw Rot | 한 named ailment | 두 행 | Duplicate |
| Bite the Hand that Cures | Severe에 존재 | 없음 | Missing |
| Crestfallen | Intermediate | Lesser | Incorrect |
| Nervefright | Severe | Lesser | Incorrect |
| Seasonshift | Severe | Lesser | Incorrect |

### 규칙 텍스트와 결과 열

`tags`, `timer`, `description`, `outcome`, `consequence` 문자열은 존재하지만 대부분 일반 치료 엔진이 읽지 않는다. 다음은 표시만으로는 구현으로 볼 수 없는 대표 행이다.

| 질환/결과군 | 룰북 데이터 의미 | 앱 판정 |
|---|---|---|
| Bad Idea | Foul 관련 특수 결과 | UI-only |
| Brand Care | 선택에 따른 평판 ±2 | UI-only |
| Forager's Twitch | Suit 기반 후속 처리 | UI-only |
| Fight Marks | 2개 질환/Timer 구조 | Missing |
| Groundhog | 3개 질환과 계절 지도 제한 | Missing |
| Pinned by Pine | 추가 Timer/후속 조건 | Incorrect |
| Quagmire | 임계값 기반 결과 | UI-only |
| Soured Dough | 4개 질환 구조 | Missing |
| Stingshock | double dose | Missing |
| Wake | Barter와 Timer 특수 처리 | UI-only |
| Wormridden | Foul 평판 손실 예외 | UI-only |

문자열 번역 차이 중 분위기만 바뀐 것은 규칙 오류로 세지 않았다. 그러나 조건, 수치, 선택지, 후속 상태가 달라진 축약/오역은 `Incorrect`다.

## Reagent 표

### 개수와 구조

- 룰북: p132-151에 고유 Reagent 83종. p126의 Horse Chestnuts는 설명 예시이며 두 번째 데이터 행이 아니다.
- 앱: 81행, 고유 이름 80종. Horse Chestnuts가 중복되고 Woundwort, Yarrow, Yellow Wort가 없다.
- 이름을 맞춘 뒤 각 준비법의 대괄호 태그를 집합으로 비교하면 34종만 태그 집합이 같고 49종은 다르거나 누락됐다.
- 태그가 같은 34종도 `Region/Season` 3상태, Tool, Weight, Uses, 특수 조건을 구조적으로 보존하지 않아 전체 행을 `Exact`로 판정할 수 없다.

### 태그 집합이 일치한 34종

| 결과 | Reagent |
|---|---|
| 태그 열 일치, 전체 구현은 Partial | Beech; Beetles; Behemoth Bits; Birch Polypore; Bird Leavings; Blackcurrant; Blackthorn; Chalk; Clay; Concocted Calm; Dandelions; Doused Bonfires; Firegizzards; Fly Agaric; Forget-Me-Not; Frog Slime; Garden Mint; Glass Silk; Goosegrass; Haircap Moss; Hidelendings; Horse Chestnuts; Horsetails; Iron Ore; Ironslug; Marshgold; Meadow Waxcap; Nettles; Orange Peel Fungus; Pearls; Shells; Slugs; Strawberries; Thistles |

### 태그 집합이 다른 46종

| 결과 | Reagent |
|---|---|
| Incorrect | Animal Sheddings; Beehive; Big Fish; Brambles; Burdock; Butterfly; Catnip; Cherry Trees; Chillies; Coarse Grit; Crab Apples; Cucumbers; False Deathcap; Field Blewit; Fine Sand; Hoarhound; Honeybees; Lavender; Leech; Maggots; Marigold; Marshmallow; Miracle Loaf; Musk Scrapings; Nightshade; Oak; Pox-Be-Gones; Redsap; Rhubarb; Ribwort; Rivermint; Rock Salt; Roses; Silver Ore; Small Fish; Sourchits; Spiders; Tansies; Titansorrel; Toads; Wasps; Waychalk; Whiskerburner; White Willow; Wild Garlic; Wild Violet |

### 누락 3종과 중복 1종

| 유형 | Reagent | 영향 |
|---|---|---|
| Missing | Woundwort | 채집·흥정·치료 후보에서 영구 제외 |
| Missing | Yarrow | 채집·흥정·치료 후보에서 영구 제외 |
| Missing | Yellow Wort | 채집·흥정·치료 후보에서 영구 제외 |
| Duplicate | Horse Chestnuts | 표시/선택 중복 및 확률 왜곡 가능 |

### 대표적인 실제 태그 차이

| Reagent | 룰북 | 앱 | 영향 |
|---|---|---|---|
| Animal Sheddings, Sweat | `[FEATHER 1]` | `[HIDE 1]` | 다른 질환을 충족한다. |
| Beehive, Honey | 치료 태그와 `[FAIR 4]` | Fair 4 누락 | 보상 Trinket 계산이 낮아진다. |
| Silver Ore | `[INFECTION 3]`, `[PARASITE 2]` | `[WOUND 2]` | 완전히 다른 질환 후보가 된다. |
| Leech | `[INFECTION 2]`, `[POISON 2]`, 사용 시 `[MOOD 1]`; 대체 준비 `[HIDE 2]` | `[PARASITE 2]`, `[WOUND 2]` 중심 | 요구 충족과 부작용이 모두 달라진다. |
| Butterfly | 준비 Part 태그 존재 | 태그 없음 | 치료 재료로 기능하지 않는다. |

### 모든 Reagent에 공통으로 영향을 주는 스키마 손실

| 원본 필드 | 룰북 의미 | 앱 표현 | 판정 |
|---|---|---|---|
| Region availability | Common / Rare / Unavailable | `regions: string[]` | Incorrect |
| Season availability | Common / Rare / Unavailable | `seasons: string[]` | Incorrect |
| Preparation Tool | Basic/Market Tool 자격 | `preps` 설명 문자열 | UI-only |
| Part Weight | 1/3, 2/3, 1 등 | 생성 시 일괄 1/3 | Incorrect |
| Uses | 한 Part의 복수 사용 | 잔여 횟수 없음 | Missing |
| Positive/negative tags | 준비법별 별도 태그 | 문자열 파싱 | Partial |
| Special acquisition | 특정 계절/조우/제한 | 이름·설명에 섞임 | Partial |

`rawName`에도 파서 흔적이 남아 있다. 예: `can only be Foraged for in Summer Frog Slime`, `Trinket Ironslug`, `Can only be Foraged for in Summer Wild Garlic`. 이 문자열이 ID나 이름 비교에 사용되면 도감 중복과 선택 실패를 일으킬 수 있다.

## Travel Encounter 표

룰북 p72의 분포는 일반 6지역에서 A-8이 4개 묶음(A&2, 3&4, 5&6, 7&8), 9/10/J/M이 계절별 4종이므로 지역당 16행이다. Titan은 계절 분기 없이 7행이다.

| Region | 룰북 | 앱 | 차이 | 판정 |
|---|---:|---:|---:|---|
| Bog | 16 | 12 | -4 | Incorrect |
| Forest | 16 | 15 | -1 | Incorrect |
| Loch | 16 | 15 | -1 | Incorrect |
| Meadow | 16 | 16 | 0 | Incorrect: 개수만 같고 행 경계/순서 신뢰 불가 |
| Mountain | 16 | 13 | -3 | Incorrect |
| Soar | 16 | 13 | -3 | Incorrect |
| Titan | 7 | 10 | +3 | Incorrect |
| 합계 | 103 | 94 | -9 | Incorrect |

앱 선택기는 파싱된 배열 순서에 의존해 계절 행을 고른다. 따라서 행 수가 맞는 Meadow도 카드와 Season의 확률 대응이 보장되지 않는다.

## Foraging Encounter 표

룰북 p152의 분포는 각 지역에서 A-8이 개별 8행, 9/10/J/M이 각각 4계절이므로 지역당 24행이다.

| Region | 룰북 | 앱 | 차이 | 판정 |
|---|---:|---:|---:|---|
| Bog | 24 | 19 | -5 | Incorrect |
| Forest | 24 | 23 | -1 | Incorrect |
| Loch | 24 | 23 | -1 | Incorrect |
| Meadow | 24 | 23 | -1 | Incorrect |
| Mountain | 24 | 23 | -1 | Incorrect |
| Titan | 24 | 12 | -12 | Incorrect |
| 합계 | 144 | 123 | -21 | Incorrect |

수량 오류와 별개로 런타임은 A-10을 `ace & 2`, `3 & 4` 같은 묶음 키로 찾지만 데이터는 `2`, `3` 같은 개별 키를 가진다. 결과적으로 A-10 대부분은 실제 행을 찾지 못하고 기본 문구로 폴백한다. 이는 배열 인덱스 한 칸 오류보다 범위가 큰 확률 붕괴다.

## Social Encounter 표

룰북 p188은 카드값을 쓰지 않는다. Suit와 현재 Settlement/City, Region, Season을 사용한다. ♥/♦는 일반 Settlement 또는 여섯 City의 고유 결과이고, ♣/♠는 계절 결과다.

| Group | 룰북 | 앱 | 차이 | 비고 |
|---|---:|---:|---:|---|
| Bog + Noonhill | 12 | 7 | -5 | p190-193 일부가 다음 배열로 밀림 |
| Forest + Odoak | 12 | 13 | +1 | 앞 지역 행 유입과 뒤 지역 경계 혼재 |
| Loch + Newdam + Vessel | 14 | 14 | 0 | 두 City 때문에 14; 개수만 같고 선택기는 City/Season 무시 |
| Meadow + Summit | 12 | 12 | 0 | 개수만 같고 페이지 경계 신뢰 불가 |
| Mountain + Spoolkeep | 12 | 12 | 0 | p211 계절 행이 Glasswall로 밀림 |
| Glasswall | 4 | 8 | +4 | p211 Mountain 계절 4행이 잘못 포함 |
| 합계 | 66 | 66 | 0 | 총수 일치는 정확성의 증거가 아님 |

런타임 선택도 `suit`만 필터한 뒤 카드값 modulo로 후보를 고른다. Season과 named City를 무시하므로 데이터 배열을 바로잡기만 해도 원작 확률은 복원되지 않는다.

## 기타 Almanack 표

| 표 | 룰북 위치 | 룰북 | 앱 | 데이터 판정 | 로직 판정 |
|---|---|---:|---:|---|---|
| Guild Services | p58-61 | 17 | 16 | Partial | Partial/Incorrect 혼합 |
| Tools | p62-65 | 18 | 17 | Incorrect | Incorrect |
| Tool Upgrades | p66-67 | 7 | 7 | 표면 일치 | UI-only 다수 |
| Wagon Expansions | p68-69 | 10 | 10 | 표면 일치 | Partial |
| Companions | p70-71 | 9 | 9 | 표면 일치 | Partial/House Rule 혼합 |
| Clinic Agendas | p46-47 | 10 | 10 | 표면 일치 | Partial/Incorrect 혼합 |
| Barrow Delves | p116-125 | 8 | 8 | 표면 일치 | UI-only/Incorrect 혼합 |

누락된 Tool인 Titan Thingamabob은 일반 구매 목록에는 나오지 않는 조우 획득물이다. 따라서 앱 상점에 없다는 사실 자체가 오류는 아니지만, 데이터 모델과 조우 보상에도 존재하지 않아 획득·소지·Titan Ruin 사용을 할 수 없다는 점이 `Missing`이다. Send Package는 co-op 전용이므로 단독 플레이 범위에서는 영향이 없지만 “Almanack 완전 수록” 기준으로는 누락이다.

## 지역, 계절, 날씨

| 영역 | 룰북 | 앱 | 판정 |
|---|---|---|---|
| Regions | Bog, Forest, Loch, Meadow, Mountain, Titan; Soar는 이동 조우군 | 주요 enum/문자열 존재 | Partial |
| Location types | Wild, Settlement, City, Titan Ruin, Barrow 등 | 자유 텍스트/선택 혼합 | Partial |
| Seasons | Spring, Summer, Autumn, Winter | 상태값 존재 | Partial |
| Season transition | 여정/휴식기 흐름과 계절 진행 | 수동 전환과 일수 기반 상태 혼합 | Incorrect |
| Weather | 독립 일일 날씨가 아니라 Encounter의 Weather 분류 | 문구 노출 및 Forecast flag | UI-only |

지도 노드는 있어도 일반 Move가 그 그래프를 권위 데이터로 사용하지 않는다. 따라서 지역 표 자체보다 `현재/인접/3 Paths/service area`를 계산하는 모든 파생 표가 신뢰할 수 없다.

## 저널 프롬프트와 결과 표

### 저널 프롬프트

룰북의 저널 프롬프트는 별도 단일 목록이 아니라 Character, Journey, Encounter, Ailment, Ending 문장에 분산돼 있다. 앱 파서는 이 문장들을 주로 `description`/`text`에 보존하지만 “기록 후 진행”이라는 의무 상태로 모델링하지 않는다.

| 프롬프트군 | 원본 위치 | 앱 | 판정 |
|---|---|---|---|
| 캐릭터/관계 | p10-16 | 생성 입력 일부 | Partial |
| 여정 시작/Reason | p18-21 | Reason 누락 | Missing |
| Travel/Foraging/Social 선택 | p72-99, p152-213 | 조우 텍스트 | UI-only |
| Trinket object/material/origin | p56-57 | 없음 | Missing |
| 치료/실패/보상 | p28-37, p100-115 | 자동 기록+자유 메모 일부 | Partial |
| 여정 결말 | p38-39 | 자유 기록 | Partial |

### 성공·실패와 보상

| 결과 표/공식 | 룰북 | 앱 | 판정 |
|---|---|---|---|
| 치료 성공 평판 | +Severity | 일반식 존재 | Exact 단독 계산, 전체 흐름은 Partial |
| 치료 Trinket | Severity + floor(Fair/2) - floor(Foul/2), 최소 0 | 유사 공식 | Partial: 값을 수동 덮어쓸 수 있음 |
| 보상 선물 | 보상이 1 이상이면 전부 대신 +2 평판 | 선택 존재 | Partial |
| 치료 실패 | -Severity 평판 + 질환 특수 결과 | 일반 손실 중심 | Partial |
| Journey ending | 고정 평판 없음 | 성공 +5/실패 -3 | House Rule |
| Pawn | 총 Weight 반올림 | 수량 기준 | Incorrect |
| Barrow 보상 | Delve별 고유식 | placeholder/수동 완료 혼합 | Incorrect |

## 데이터 파이프라인 원인

1. PDF 페이지 텍스트를 장 경계나 머리말/꼬리말 인식 없이 순차 배열로 붙여, 다음 Region의 배열에 이전 페이지 행이 유입된다.
2. 카드 표의 “한 카드 묶음”과 “개별 카드”를 표별 스키마로 구분하지 않아 Foraging 런타임 키가 데이터와 맞지 않는다.
3. Reagent의 준비법을 구조화하지 않고 하나의 `preps` 문자열로 저장해 Tool, Weight, Uses, positive/negative tags를 안정적으로 판정할 수 없다.
4. Availability를 목록 포함 여부로 축약해 Common/Rare/Unavailable 세 상태를 잃었다.
5. 행의 안정적 원본 ID, 판본, source page, checksum이 없어 중복·누락·번역 변경을 자동 탐지할 수 없다.

## 다음 수정 단계의 데이터 합격 기준

이번 실행에서는 구현하지 않는다. 이후 수정 시 다음 무결성 검사를 룰북 기대값으로 고정해야 한다.

1. Ailment: named 45 unique, 분포 12/11/11/11, 각 상위 등급 M의 복수 추첨 규칙 별도 표현.
2. Reagent: 83 unique, 준비법별 `tool`, `weight`, `uses`, `tags`, `sideEffects`; Region/Season 각각 3상태 enum.
3. Travel: 일반 6지역 16행씩, Titan 7행; 카드 묶음과 seasonal key 유일성 검사.
4. Foraging: 6지역 24행씩; A-8 개별, 9/10/J/M×4 seasons 유일성 검사.
5. Social: 66행; Region/City/Season/Suit 복합키 검사, 카드값을 선택에 사용하지 않는 테스트.
6. 모든 행에 `edition`, `sourcePage`, `sourceKey`, 안정적 ID를 두고 번역 텍스트와 규칙 필드를 분리.
7. 파서 산출물을 앱에 직접 넣기 전에 중복 이름, 빈 태그, 알 수 없는 태그, 페이지 범위, 기대 행 수 검사를 실패 조건으로 둔다.
