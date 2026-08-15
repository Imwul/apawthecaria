# Rulebook p.55–84 Detailed Audit

검토일: 2026-08-15
기준본: *Apawthecaria*, First Edition, Third Printing (May 2023)
범위: Almanack의 Trinkets, Guild Services, Tools, Upgrades, Wagon Expansions, Companions와 Travel Encounters의 Bog·Forest·Loch 도입부

## 결론

목록 자체는 완전했다. 17 Guild Services, 18 Almanack Tools, 7 Tool Upgrades, 10 Wagon Expansions, 9 Companions가 모두 canonical catalogue와 실제 행동 resolver에 존재한다. 이번 상세 대조와 후속 구현에서는 다음 여덟 종류의 실제 차이를 수정했다.

1. **Smithing 위치 조건**: p.59는 Mountain Settlement 또는 any City인데 서비스 카드와 서비스 엔진이 City를 막고 있었다.
2. **Catch of the Day 대상 검증**: p.59의 1 Trinket/2 Trinket 선택이 각각 Small Fish/Big Fish인지 UI 밖 엔진 호출에서도 검증하도록 했다.
3. **도구 수리 범위**: p.62가 명시한 2 Trinket 수리는 Canvas Tent에만 적용하고, 파손된 Fine-toothed Comb 등으로 일반화하지 않게 했다.
4. **Travel Encounter 계절·효과**: p.77과 p.79의 같은 페이지 다중 계절 카드가 배치 순서 때문에 뒤바뀐 것을 계절 아이콘 기준으로 교정했다. 자동 결론이 가능한 p.75–84 조우 12행은 서사 기록 또는 선택형 수치 처리로 닫았다.
5. **Encounter 지도 결과**: nearest Location 이동, 새 Path, 계절성 Location 봉쇄, Hornweed Rarity +3을 실제 graph와 채집 조건에 연결했다.
6. **후속 카드**: 실제 카드 입력 또는 앱의 재현 가능한 카드 뽑기와 문양·값 결과를 원 조우 transaction 안에서 확정한다. Carpe Carp-ey, Need For Speed, Pi-rats!는 원문대로 2–4장의 카드를 따로 뽑아 비교한다.
7. **누적 Knitting**: p.64의 프로젝트별 시간을 여러 Preparing to Leave 단계에 나눠 누적하고, 가장 짧은 활성 Timer만큼만 진행하며 완성 기록·포기 기록을 저장한다.
8. **Trinket provenance**: 한 번에 몇 개를 받더라도 p.56 원문대로 그중 **하나**만 Object/Material/Origin 대표 기록으로 만들고 나머지는 이름 없는 수량으로 보존한다. 이름이 있는 대표 Trinket을 직접 사용하면 같은 기록이 사용 처리된다.

## 페이지별 감사

| 페이지 | 원문 핵심 | 현재 상태 | 상세 판정 |
|---|---|---|---|
| p.55 | Almanack 구분 삽화 | 해당 없음 | 규칙이나 상태 변화가 없는 섹션 표지다. |
| p.56 | 한 번에 받은 Trinket 중 하나를 Journal; 카드 3장으로 Object/Material/Origin | 구현 완료 | 획득 transaction마다 대표 Trinket 하나만 `createTrinketRecord()`의 세 장 M=12 결과로 만들고 나머지는 이름 없는 수량으로 유지한다. 표의 6행도 Object=`Toy / Entertainment`, Material=`Animal / Repurposed`로 열 이동 없이 교정했다. 대표 Trinket을 직접 지불·분실하면 해당 canonical record를 우선 사용 처리한다. |
| p.57 | Trinket 삽화 | 해당 없음 | 규칙 없음. |
| p.58 | Send Package, Rug of Wonders, News From The Trail | 싱글플레이 구현 | 5 Weight 전달 대기, Journey당 Rug 1회, 목적지 전 Travel Encounter 2장 선택을 저장 가능한 서비스 상태로 처리한다. 공유 Guild save/다른 플레이어 수령은 사용자 결정에 따라 제품 범위에서 제외했다. |
| p.59 | Smithing, Forecast, Shortcut, Hitch a Ride, Catch of the Day | 수정 완료 | Smithing을 Mountain Settlement 또는 any City에서 허용했다. Catch의 Small/Big Fish와 1/2 Trinket을 엔진에서 다시 검증한다. Forecast 3 Moves, Shortcut 근접 위치, Hitch 최대 5 Paths/Meadow/Encounter 생략은 구현돼 있다. |
| p.60 | Survey Paths, Build a Bridge, Floodplain, Taxi Service, Take Clippings | 구현 | graph에 Path 추가, 실제 Waterway 두 개 변환, 다음 Spring까지 Wild→Loch, 보호된 Soar, Plant Part 선택이 canonical transaction으로 남는다. |
| p.61 | Pick of the Deep, Retrieval, Send a Missive, Scare Tactics | 구현 / 외부 선택 | M=12 Titan Rarity, 5 Paths 이상 Settlement 회수, Settlement 최대 3곳 질환 선택, Behemoth/Barrow 제거를 검증한다. 지도 대상과 후속 수령은 사용자가 고른 실제 대상을 저장한다. |
| p.62 | Basic Tools, Canvas Tent, Frying Pan, Cauldron, Coracle, Crossbow/Bolts | 수정 완료 | 준비법·수로·Loch 정지·Rarity·Crossbow 탄약은 구현돼 있다. 2 Trinket 수리를 Canvas Tent에만 한정했다. |
| p.63 | Bandolier, Alembic, Net, Spices, Comb | 구현 | Plant/Insect 최대 5 Weight를 1로 계산하고, CATALYSE, Insect/Small Fish -3, FAIR +1, Comb 태그와 Spade 파손을 실제 Forage/Treatment에 연결한다. |
| p.64 | Knitting Needles, Blanket/Coat/Satchel/Scarf, Instruments | 구현 완료 | Blanket 20/Coat 15/Satchel 10/Scarf 5시간을 여러 Preparing to Leave 단계에 걸쳐 누적한다. 모든 **활성** Timer 중 가장 짧은 값만큼만 진행하고 활성 Timer가 0이면 막는다. 치료로 정지한 0 Timer는 잘못 차단하지 않는다. 진행 중 교체를 막고, 완성 시 Journal을 요구하며, 포기 이력도 저장한다. Instruments의 연주자 수와 Cricket 보정도 유지한다. |
| p.65 | Titan Thingamabob, Saddlebags, Waxed Satchel, Stilts | 구현 | Titan 접근 신호, 최대 두 세트의 Saddlebags, Soak 방지, Bog 출발 Move +1 Speed가 실제 trigger에서 실행된다. |
| p.66 | Basic Tool 3종과 Upgrade 7종 | 구현 | 기본 Tool identity를 유지한 채 Mortar/Knife/Kettle의 정확한 Upgrade만 장착한다. Gather, Forage, Ailment start, Treatment, POUND trigger를 구분한다. |
| p.67 | Upgrade 삽화 | 해당 없음 | 규칙 없음. |
| p.68 | Base Unit 및 Sealed/Pedal/Axel/Side/Hive 확장 | 구현 / 원문 충돌 유지 | 확장 비용·도시·효과는 구현돼 있다. p.43 Commission Wagon 20과 p.68 Base Unit 15의 관계는 같은 판본 안에서 충돌하므로 현재는 p.43의 실제 위탁 비용 20을 유지하고 자동 정정하지 않았다. |
| p.69 | Passenger Booth, Shadow Canvas, Experimental Contraption, Clay Pots | 구현 | 승객 목적지별 1/2/4 Trinket, Settlement 명성, Wagon Soar 3 Days, 제철 Plant와 2 Moves 재성장을 상태로 추적한다. |
| p.70 | Beetle, Butterfly, Caterpillar, Cranky Contraption, Cricket, Honeybee | 구현 | Journey 1회 보호, 계절 Rarity, Timer +1, Season 변태, Behemoth 희생, 공연, 10 Paths Honey를 각각 실제 소비 시점에 적용한다. |
| p.71 | Spider, Pond Skimmer, Wasp | 구현 | Insect Rarity -1, Journey당 Loch redraw 1회, 10 Paths마다 Insect Foraging draw를 저장한다. |
| p.72 | Wilds/Titan/Barrow/Soar에서 Travel Encounter; 지역·카드·계절 선택 | 구현 | 6 Region×16과 Titan 7행의 103개 key를 선택한다. Encounter의 자동·선택·직접 판정 구분은 각 행의 실제 효과를 따른다. |
| p.73 | Travel Encounter 삽화 | 해당 없음 | 규칙 없음. |
| p.74 | Bog A–4: Wisps, From Rot Comes Art | 구조화 판정 | 후속 카드는 같은 조우 안에서 뽑거나 입력해 결과를 보존하고, Tool/Reagent/Trinket 대상은 플레이어가 실제 가방 항목을 고른다. |
| p.75 | Branch-Beaten, Climate Change, Friend in the Mists, Pottering About, Hardpacked | 구조화 판정 | Climate Change는 서사 기록으로 완료한다. 카드 결과는 후속 카드 위저드, 다음 Forage 배수·임시 Carry·추가 이동은 명시적 선택과 저장 상태로 처리한다. |
| p.76 | Mudlarking, That Sucks, Pumped Up Cafe, Busy Work, Blood on the Ice | 일부 자동 | Mudlarking은 서사 완료, Busy Work는 계속/1 Day+1 Trinket 선택을 자동 처리한다. Reagent 선택, 반복 구매, 버릴 물품은 직접 고른다. |
| p.77 | Fungi Founder, Chilled To The Core, On The Path | 수정 완료 | 계절 아이콘 기준 Fungi Founder=Autumn, Chilled=Winter로 교정했다. On The Path는 Autumn/Winter 양쪽에서 세 선택과 Reputation을 자동 처리한다. Chilled는 수치 효과 후 실제 graph의 최단 Settlement 후보만 이동 대상으로 허용한다. |
| p.78 | Forest A–8: In Bloom, Rest Stop, Hot Tea, From Up On High | 일부 자동 | Rest Stop은 서사 기록으로 완료한다. Plant Part, Gossip, Sketch의 장기 교환 상태는 직접 판정으로 보존한다. |
| p.79 | Memories, Parade, Typical Summer, Go Ape, Danger Ahead, Freshly Grilled | 수정 완료 / 일부 직접 | Danger Ahead=Spring J, Freshly Grilled=Summer J로 계절을 교정했다. Memories/Parade는 서사 완료, Go Ape는 이미 더한 기본 Move 1 Day를 되돌린다. 경로 재계획·다음 Timer는 직접 지정한다. |
| p.80 | Wayfriend, Turning Fortune, Lost-And-Found | 구조화 판정 | Lost-And-Found의 +1 Trinket/+1 Reputation 선택을 자동 처리한다. Turning Fortune은 1 Day 또는 Reagent/Tool 손실을 강제한 뒤 현재 Location과 인접한 미연결 Location에 실제 Path를 추가한다. |
| p.81 | Fairwinders, Piledriver, Hunger Pains | 구조화 판정 | Fairwinders는 서사 완료다. 후속 카드는 위저드로 판정하며 Weight 3 폐기와 Reagent/Trinket 분기는 실제 보유 대상을 고른다. |
| p.82 | Loch A–6: Undercurrent, Muddy Waters, Carpe Carp-ey | 구조화 판정 | Muddy Waters는 필수 카드 한 장의 A–10/J–M 분기를 기록한다. Carpe Carp-ey는 플레이어와 Big Fish 카드를 따로 뽑아 M=12로 비교하며, 동률은 원문에 규정이 없음을 명시하고 테이블 판정을 기록하게 한다. 방향 이동과 분실 물품은 실제 지도·가방 대상을 선택한다. |
| p.83 | Push and Pull, Less Than Titanic, Log Floats, Need For Speed, Cruise | 구조화 판정 | Log Floats는 서사 완료다. Less Than Titanic은 선택과 Reputation/Day를 적용한 뒤 실제 graph의 최단 non-Loch 후보만 이동 대상으로 허용한다. Need For Speed는 물새 2장 중 최고값과 플레이어 1장을 비교하고, Q/K 화면 표기는 모두 원문 M(12) 판정임을 드러낸다. |
| p.84 | Snarling Threats, Pi-rats!, Winged Menace, Vicious Murk | 구조화 판정 | Hornweed Cull의 +1 Day/+2 Reputation을 적용한다. Leave It의 Club/Spade는 **현재 Location에서 채집할 때만** Reagent Rarity +3을 Winter까지 유지한다. Pi-rats!는 플레이어 1장, Crossbow가 있을 때의 선택적 추가 1장, Pirates 2장을 합산한다. Vicious Murk는 현재 Location을 계절 끝까지 봉쇄한 뒤 인접 Location으로 1 Path 후퇴시킨다. |

## 이번에 반영한 코드 변경

- `Smithing`: Mountain Settlement **or any City** 위치 요구사항을 data, engine, UI 카드에 동일하게 반영.
- `Catch of the Day`: 선택한 가격과 Small Fish/Big Fish canonical identity 불일치 차단.
- `Canvas Tent`: 원문에 있는 2 Trinket 수리를 Tent 전용으로 제한.
- `Fungi Founder`/`Chilled To The Core`, `Danger Ahead`/`Freshly Grilled`: 같은 페이지의 계절 아이콘을 기준으로 잘못 연결된 행 교정.
- `Climate Change`, `Mudlarking`, `Rest Stop`, `Memories`, `Fairwinders`, `Parade`, `Log Floats`: 기계적 변화가 없는 서사 조우를 별도 manual task 없이 완료. `Muddy Waters`는 원문상 카드 판정이 있으므로 직접 카드 task로 되돌렸다.
- `Busy Work`, `On The Path`, `Go Ape`, `Lost-And-Found`: 선택과 Day/Reputation/Trinket을 자동 적용.
- `Chilled To The Core`, `Less Than Titanic`, `Snarling Threats`: 수치 효과를 구조화하고 지도 또는 후속 카드만 직접 판정으로 분리.
- `Encounter map support`: 최단 Location 검증, Path 추가, 봉쇄·Rarity 계절 상태를 실제 지도와 채집에 반영.
- `Follow-up card wizard`: 실제 카드 입력과 재현 가능한 뽑기, M=12 표기, 여러 장 비교 결과를 원 조우 기록에 저장.
- `Knitting Project`: 가장 짧은 활성 Timer를 기준으로 여러 단계 누적, 교체 방지, 완성 Journal, 포기 이력을 schema v9에 저장.
- `Trinket ledger`: 획득 묶음마다 p.56 대표 한 건만 세 장 카드로 기록하고, 이름 없는 잔여 수량과 선택 소비를 함께 동기화.

## 범위 판정

- 위 후속 구현 목록 1–4는 완료했다.
- **멀티플레이 전달 원장**은 협동 플레이를 하지 않는다는 사용자 결정에 따라 의도적으로 구현하지 않는다. Send Package의 싱글플레이 기록·외부 확인 흐름은 유지한다.
- 지도·가방 대상은 앱이 임의로 고르지 않고 실제 후보만 제시한다. 카드 뽑기는 transaction에 저장되므로 저장·재개 뒤에도 판정 맥락을 잃지 않는다.
