# Rulebook p.55–84 Detailed Audit

검토일: 2026-08-15
기준본: *Apawthecaria*, First Edition, Third Printing (May 2023)
범위: Almanack의 Trinkets, Guild Services, Tools, Upgrades, Wagon Expansions, Companions와 Travel Encounters의 Bog·Forest·Loch 도입부

## 결론

목록 자체는 완전했다. 17 Guild Services, 18 Almanack Tools, 7 Tool Upgrades, 10 Wagon Expansions, 9 Companions가 모두 canonical catalogue와 실제 행동 resolver에 존재한다. 이번 상세 대조에서는 다음 네 종류의 실제 차이를 수정했다.

1. **Smithing 위치 조건**: p.59는 Mountain Settlement 또는 any City인데 서비스 카드와 서비스 엔진이 City를 막고 있었다.
2. **Catch of the Day 대상 검증**: p.59의 1 Trinket/2 Trinket 선택이 각각 Small Fish/Big Fish인지 UI 밖 엔진 호출에서도 검증하도록 했다.
3. **도구 수리 범위**: p.62가 명시한 2 Trinket 수리는 Canvas Tent에만 적용하고, 파손된 Fine-toothed Comb 등으로 일반화하지 않게 했다.
4. **Travel Encounter 계절·효과**: p.77과 p.79의 같은 페이지 다중 계절 카드가 배치 순서 때문에 뒤바뀐 것을 계절 아이콘 기준으로 교정했다. 자동 결론이 가능한 p.75–84 조우 12행은 서사 기록 또는 선택형 수치 처리로 닫았다.

## 페이지별 감사

| 페이지 | 원문 핵심 | 현재 상태 | 상세 판정 |
|---|---|---|---|
| p.55 | Almanack 구분 삽화 | 해당 없음 | 규칙이나 상태 변화가 없는 섹션 표지다. |
| p.56 | Trinket 획득 시 하나를 Journal; 카드 3장으로 Object/Material/Origin | 부분 구현 | `createTrinketRecord()`가 세 장의 M=12 표와 개별 기록을 정확히 만든다. 다만 모든 Trinket 보상 경로가 이 기록기를 강제로 호출하지는 않는다. |
| p.57 | Trinket 삽화 | 해당 없음 | 규칙 없음. |
| p.58 | Send Package, Rug of Wonders, News From The Trail | 구현 | 5 Weight 전달 대기, Journey당 Rug 1회, 목적지 전 Travel Encounter 2장 선택을 저장 가능한 서비스 상태로 처리한다. Send Package의 실제 다른 플레이어 수령은 외부 확인이 필요하다. |
| p.59 | Smithing, Forecast, Shortcut, Hitch a Ride, Catch of the Day | 수정 완료 | Smithing을 Mountain Settlement 또는 any City에서 허용했다. Catch의 Small/Big Fish와 1/2 Trinket을 엔진에서 다시 검증한다. Forecast 3 Moves, Shortcut 근접 위치, Hitch 최대 5 Paths/Meadow/Encounter 생략은 구현돼 있다. |
| p.60 | Survey Paths, Build a Bridge, Floodplain, Taxi Service, Take Clippings | 구현 | graph에 Path 추가, 실제 Waterway 두 개 변환, 다음 Spring까지 Wild→Loch, 보호된 Soar, Plant Part 선택이 canonical transaction으로 남는다. |
| p.61 | Pick of the Deep, Retrieval, Send a Missive, Scare Tactics | 구현 / 외부 선택 | M=12 Titan Rarity, 5 Paths 이상 Settlement 회수, Settlement 최대 3곳 질환 선택, Behemoth/Barrow 제거를 검증한다. 지도 대상과 후속 수령은 사용자가 고른 실제 대상을 저장한다. |
| p.62 | Basic Tools, Canvas Tent, Frying Pan, Cauldron, Coracle, Crossbow/Bolts | 수정 완료 | 준비법·수로·Loch 정지·Rarity·Crossbow 탄약은 구현돼 있다. 2 Trinket 수리를 Canvas Tent에만 한정했다. |
| p.63 | Bandolier, Alembic, Net, Spices, Comb | 구현 | Plant/Insect 최대 5 Weight를 1로 계산하고, CATALYSE, Insect/Small Fish -3, FAIR +1, Comb 태그와 Spade 파손을 실제 Forage/Treatment에 연결한다. |
| p.64 | Knitting Needles, Blanket/Coat/Satchel/Scarf, Instruments | 구현 / 진행 표시 한계 | 완성 시간과 네 아이템 효과, Instruments의 연주자 수 및 Cricket 보정을 처리한다. 미완성 뜨개 프로젝트를 별도 장기 상태로 저장하지 않고 현재 Timer가 완성 시간을 충족할 때 한 번에 완료한다. |
| p.65 | Titan Thingamabob, Saddlebags, Waxed Satchel, Stilts | 구현 | Titan 접근 신호, 최대 두 세트의 Saddlebags, Soak 방지, Bog 출발 Move +1 Speed가 실제 trigger에서 실행된다. |
| p.66 | Basic Tool 3종과 Upgrade 7종 | 구현 | 기본 Tool identity를 유지한 채 Mortar/Knife/Kettle의 정확한 Upgrade만 장착한다. Gather, Forage, Ailment start, Treatment, POUND trigger를 구분한다. |
| p.67 | Upgrade 삽화 | 해당 없음 | 규칙 없음. |
| p.68 | Base Unit 및 Sealed/Pedal/Axel/Side/Hive 확장 | 구현 / 원문 충돌 유지 | 확장 비용·도시·효과는 구현돼 있다. p.43 Commission Wagon 20과 p.68 Base Unit 15의 관계는 같은 판본 안에서 충돌하므로 현재는 p.43의 실제 위탁 비용 20을 유지하고 자동 정정하지 않았다. |
| p.69 | Passenger Booth, Shadow Canvas, Experimental Contraption, Clay Pots | 구현 | 승객 목적지별 1/2/4 Trinket, Settlement 명성, Wagon Soar 3 Days, 제철 Plant와 2 Moves 재성장을 상태로 추적한다. |
| p.70 | Beetle, Butterfly, Caterpillar, Cranky Contraption, Cricket, Honeybee | 구현 | Journey 1회 보호, 계절 Rarity, Timer +1, Season 변태, Behemoth 희생, 공연, 10 Paths Honey를 각각 실제 소비 시점에 적용한다. |
| p.71 | Spider, Pond Skimmer, Wasp | 구현 | Insect Rarity -1, Journey당 Loch redraw 1회, 10 Paths마다 Insect Foraging draw를 저장한다. |
| p.72 | Wilds/Titan/Barrow/Soar에서 Travel Encounter; 지역·카드·계절 선택 | 구현 | 6 Region×16과 Titan 7행의 103개 key를 선택한다. Encounter의 자동·선택·직접 판정 구분은 각 행의 실제 효과를 따른다. |
| p.73 | Travel Encounter 삽화 | 해당 없음 | 규칙 없음. |
| p.74 | Bog A–4: Wisps, From Rot Comes Art | 직접 판정 유지 | 후속 카드, Tool/Reagent 선택과 Trinket 교환처럼 대상이 필요한 결과라 자동 결론을 만들지 않는다. |
| p.75 | Branch-Beaten, Climate Change, Friend in the Mists, Pottering About, Hardpacked | 일부 자동 | Climate Change는 서사 기록만으로 완료한다. 카드 결과, 다음 Forage 배수, 임시 Carry, 추가 이동은 대상·후속 상태가 필요해 직접 판정에 남긴다. |
| p.76 | Mudlarking, That Sucks, Pumped Up Cafe, Busy Work, Blood on the Ice | 일부 자동 | Mudlarking은 서사 완료, Busy Work는 계속/1 Day+1 Trinket 선택을 자동 처리한다. Reagent 선택, 반복 구매, 버릴 물품은 직접 고른다. |
| p.77 | Fungi Founder, Chilled To The Core, On The Path | 수정 완료 / 일부 직접 | 계절 아이콘 기준 Fungi Founder=Autumn, Chilled=Winter로 교정했다. On The Path는 Autumn/Winter 양쪽에서 세 선택과 Reputation을 자동 처리한다. Chilled 수치는 먼저 적용하되 nearest Settlement 이동은 직접 지정한다. |
| p.78 | Forest A–8: In Bloom, Rest Stop, Hot Tea, From Up On High | 일부 자동 | Rest Stop은 서사 기록으로 완료한다. Plant Part, Gossip, Sketch의 장기 교환 상태는 직접 판정으로 보존한다. |
| p.79 | Memories, Parade, Typical Summer, Go Ape, Danger Ahead, Freshly Grilled | 수정 완료 / 일부 직접 | Danger Ahead=Spring J, Freshly Grilled=Summer J로 계절을 교정했다. Memories/Parade는 서사 완료, Go Ape는 이미 더한 기본 Move 1 Day를 되돌린다. 경로 재계획·다음 Timer는 직접 지정한다. |
| p.80 | Wayfriend, Turning Fortune, Lost-And-Found | 일부 자동 | Lost-And-Found의 +1 Trinket/+1 Reputation 선택을 자동 처리한다. 다음 Forest Move 보호와 새 Path 대상은 저장 가능한 직접 판정으로 남긴다. |
| p.81 | Fairwinders, Piledriver, Hunger Pains | 일부 자동 | Fairwinders는 서사 완료다. 후속 카드, Weight 3 폐기, Reagent/Trinket 조건 분기는 직접 고른다. |
| p.82 | Loch A–6: Undercurrent, Muddy Waters, Carpe Carp-ey | 일부 자동 | Muddy Waters는 후속 카드와 서사 기록으로 완료한다. 방향 연쇄 이동, 대결 카드와 Big Fish/분실 물품은 지도·가방 대상이 필요하다. |
| p.83 | Push and Pull, Less Than Titanic, Log Floats, Need For Speed, Cruise | 일부 자동 | Log Floats는 서사 완료다. Less Than Titanic은 선택과 Reputation/Day를 구조화하고 nearest non-Loch 이동만 직접 지정한다. 나머지는 후속 카드·지도 이동이 필요하다. |
| p.84 | Snarling Threats, Pi-rats!, Winged Menace, Vicious Murk | 일부 자동 | Hornweed Cull의 +1 Day/+2 Reputation을 선택형으로 적용한다. 확산 Location 상태, Pirate 치료/포로, Wasp 입양, Season 종료까지 Location 봉쇄는 장기 지도 상태라 직접 판정으로 남긴다. |

## 이번에 반영한 코드 변경

- `Smithing`: Mountain Settlement **or any City** 위치 요구사항을 data, engine, UI 카드에 동일하게 반영.
- `Catch of the Day`: 선택한 가격과 Small Fish/Big Fish canonical identity 불일치 차단.
- `Canvas Tent`: 원문에 있는 2 Trinket 수리를 Tent 전용으로 제한.
- `Fungi Founder`/`Chilled To The Core`, `Danger Ahead`/`Freshly Grilled`: 같은 페이지의 계절 아이콘을 기준으로 잘못 연결된 행 교정.
- `Climate Change`, `Mudlarking`, `Rest Stop`, `Memories`, `Fairwinders`, `Parade`, `Muddy Waters`, `Log Floats`: 기계적 변화가 없는 서사 조우를 별도 manual task 없이 완료.
- `Busy Work`, `On The Path`, `Go Ape`, `Lost-And-Found`: 선택과 Day/Reputation/Trinket을 자동 적용.
- `Chilled To The Core`, `Less Than Titanic`, `Snarling Threats`: 수치 효과를 구조화하고 지도 또는 후속 카드만 직접 판정으로 분리.

## 남은 기능 차이와 우선순위

1. **지도 대상이 있는 Encounter 전용 action**: nearest Location 이동, Path 추가, Location 봉쇄·Rarity 변화의 자동 graph mutation.
2. **후속 카드 결과 위저드**: 한 조우 안에서 두 번째 카드를 뽑고 문양별 결과를 같은 transaction으로 확정.
3. **미완성 Knitting Project**: 여러 Preparing to Leave 단계에 걸친 누적 시간, 프로젝트 교체·포기 기록.
4. **Trinket provenance 강제 연결**: 모든 보상 지급이 p.56 세 장 기록 또는 명시적 건너뛰기 사유를 남기게 하기.
5. **멀티플레이 전달 원장**: Send Package를 외부 확인이 아니라 실제 공유 Guild save의 수령 이벤트로 연결.

지도·가방 대상이나 후속 카드가 필요한 원문은 앱이 임의의 대상을 고르지 않는다. 현재는 선택지, 적용 가능한 수치, 남은 대상 판정을 분리해 저장하므로 플레이 도중 룰북을 다시 펼쳐야 하는 양은 줄이되 플레이어의 원문상 선택권은 유지한다.
