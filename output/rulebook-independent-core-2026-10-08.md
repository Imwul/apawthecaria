# Apawthecaria v1.3 독립 룰북 검토: 핵심 규칙과 플레이 경험

검토일: 2026-10-08. 원문 `Apawthecaria v1.3.pdf`의 PDF 1~116쪽을 순서대로 전체 읽었다. 이 범위에서는 PDF 쪽수와 인쇄 쪽수가 일치한다. 앱 구현, 기존 감사 문서, 이전 정보구조는 읽지 않았다. 본 문서는 룰북만으로 도출한 근거다. 나머지 117~220쪽의 상세 Delve/Reagent/Foraging/Social Encounter 내용은 별도 검토 범위다.

PyMuPDF로 각 페이지를 추출한 후, 글꼴 기호와 추출만으로 구별할 수 없는 표를 원본 렌더로 확인했다. 확인한 핵심 기호: region/season availability(27,30), 채집 시간 표(33), 도구 Weight 및 encounter tags(62), seasonal travel icons(75~77,79,81,83,85,95~97), ailment 불일치 및 대안 조건(104,106,110,111,115), Barrow 분기(116). 2~3쪽은 설명 없는 장비 삽화다.

## 독립적으로 파악한 실제 플레이 루프

이 게임은 단순한 reagent 검색기가 아니라 **계절 단위 여행을 하면서, 매 도착지의 환자를 한정된 시간 안에 돕고, 다음 이동을 준비하는 솔로 저널 게임**이다. 저널은 매 이벤트의 필수 저장이 아니다. 말하기, 그림, 간단한 메모도 가능하며 매 결과를 기록하지 않아도 된다(6~9).

1. 캐릭터, Familiar, 장비, Bags를 준비한다(10~16).
2. Origin, Season, Destination, Reason, Goal, Urgency를 정한다(18~21).
3. 지도에서 Paths/Waterways를 따라 Move하거나 자격이 있으면 Soar한다(22~25).
4. 도착지 유형에 맞는 Encounter를 해결한다. Wild/Titan/Barrow는 Travel, Settlement/City는 Social이다(25,72).
5. Move를 완료하면 Calendar에서 1일을 Mark한다. Encounter의 추가 비용은 별개이고, 특정 Encounter의 'Do not Mark'가 일반 규칙을 덮어쓴다(25,79,94).
6. 현지 beast를 치료하여 식사와 숙소를 얻는다. 이 단계를 해결해야 다시 Move할 수 있다(25,28~31). Barrow에서는 치료 대신 Delve를 하며, 일반 Preparing to Leave를 생략한다(40,116).
7. 환자/Severity/Ailment를 정하고 각 Ailment의 Timer를 시작한다. 현재 및 인접 위치에서 찾을 수 있는 Reagent를 연구한다(28~30).
8. Forage/Barter, Encounter, Remedy 가능 여부 확인을 반복한다. 충분한 재료가 있으면 즉시 Remedy를 만들고, 부족할 때만 Timer를 감소한다(31~35).
9. Preparing to Leave에서 지급/기증, 평판, Outcome, 남은 시간의 Scrounging, 미해결 Consequence, 현지 Services를 순서대로 처리한다(36~37).
10. 목적지에 도착하면 타이밍과 Goal의 성취를 해석하고 저널을 되돌아본다. 선택한 Tangible Effects와 Downtime 후 다음 Season/Journey를 시작한다(38~43).

Calendar의 **일**과 Ailment Timer의 **시간**은 독립된 두 시계다. 실패해도 여행의 마감일을 넘겨 계속 여행할 수 있으며, Timer 실패는 환자의 Consequence다(21,26,29).

## 매번 필요한 정보와 판정의 정확한 순서

### 여행과 지도

- 시작 추천은 Odoak + Spring일 뿐 강제 규칙이 아니다(18).
- Travel style: Slow Speed2/Carry5, Rambling 3/4, Fast 4/3, Swift and Soaring 5/2(11).
- Weight는 1/3 단위이며 Carry1당 Weight1을 보유할 수 있다. Trinkets는 Weight가 없다(11~12).
- 일반 Move는 Speed에 따라 Paths를 따라간다. 교차점 자체가 Path를 끊지 않는다(24). 문장은 'equal to your Speed'지만 예시는 더 가까운 위치에도 정지하므로 정확히 채워야 한다는 하드 잠금은 부적절하다.
- Weight > Carry이면 Over Encumbered, 이동은 1 Path이며 Soar 불가. 초과 상태에서도 채집은 가능하고 언제든 버리기 가능하다(24~25,32).
- Waterway는 물결 표시의 파란 Path다. 도구 없이 수영하여 통과할 수 있지만 물에서 정지할 수 없고 Reagents/일부 Item이 Soaked되어 버려진다. Loch Settlement/City의 bridge는 예외다(24).
- Waxed Satchel은 Soaking 방지, Bark Coracle은 안전한 Waterway 이동과 Loch 정지 및 Loch forage rarity -2다(62,65). 두 도구의 능력을 같은 것으로 취급하면 안 된다.
- Soar는 직선 Flightpath의 어떤 위치를 목표로 삼을 수 있지만, 미방문 Titan Ruin/Barrow를 목표로 하지 못한다. ground arrival table 대신 Soar table을 사용한다. 일반 Wagon은 불가, Experimental Contraption은 가능하되 Calendar3일(25,69).
- 지도는 고정 배경이 아니다. Path 추가/삭제, Location 삭제/변경, Barrow/Clinic 생성, 지역 접근 금지/추가 rarity/새로운 reagent 서식지 등 누적되는 세계 변화가 실제 규칙이다(39~47,60~61,74~115).

### 현지 환자 설정

1. 카드 2장: Personality와 beast Descriptor. Personality의 행마다 3개 중 하나를 고른다(28).
2. Severity는 suit로 draw한다: heart Lesser, diamond Intermediate, club Severe, spade Dire. 현재 Reputation tier를 넘으면 가능한 최고 tier로 낮춘다(29).
3. 해당 Severity의 Ailment table에서 draw한다. M은 Intermediate→Lesser2개, Severe→Intermediate2개, Dire→Severe2개이며 동시에 해결한다(103).
4. 각 Ailment의 Timer를 별도 기록한다. 일반 시간 증감은 모든 진행 Timer에 동시에 적용된다(29).
5. 현재 및 단일 Path/Waterway로 이어진 Adjacent Locations의 Regions와 Settlements/Cities를 확인한다(30).
6. 증상 TAG와 같거나 높은 potency의 Part + 준비법을 찾는다. 일반 TAG는 합산하지 않는다(27,30).

### 연구: 찾을 수 있는 것과 만들 수 있는 것을 함께 비교

- Reagent에는 Type(Animal/Earth/Insect/Plant/Titan), Base Rarity, Regions, Seasons, Parts, 각 Part의 Weight/Preparation/TAG가 있다(27).
- Forage rarity: common/in season +0, rare region +3, out-of-season +3, 둘 다이면 +6. Unavailable이면 forage 불가. Tools/Familiar/Companion을 추가 반영한다(30).
- 하나의 Reagent라도 현재 위치/인접 위치에 따라 Rarity가 다를 수 있으므로 모든 Location별 값이 필요하다(30).
- 준비법은 장비가 허용해야 한다. 기본 Mortar [GRIND/CRUSH], Kettle [BOIL/BREW], Jaws [CHEW/DIGEST], Paws [ADD/APPLY]로 시작한다(12). Frying Pan [COOKED], Cauldron [DISTILLED]/[PRESERVED], Alembic [CATALYSE] 등은 추가 능력이다(62~66).
- 일반 symptom potency는 여러 Part의 동일 TAG를 더하지 않는다. FAIR/FOUL만 stack하여 상쇄한다(27). Alembic의 같은 TAG 두 Part 촉매는 별도 예외(63).
- 불가능할 때는 potency1 높은 Part로 'Make Do'하고 설명하거나, Weight2/3, Rarity12의 Stand-in을 Forage/Barter하여 새 reagent를 만들 수 있다(30). 완전 일치만 보이는 검색으로 플레이를 막지 않아야 한다.

### Forage

1. 현재 또는 Adjacent의 Wild/Titan/Barrow를 선택한다(32). Settlement/City에서 forage하는 일반 규칙은 없다.
2. 카드 1장의 Value를 해당 Location의 listed Reagent Rarity와 비교한다. A1, J11, K/Q12(6,32).
3. Value >= Rarity이면 성공. 낮으면 +1 FP(knife 필요); FP >= Rarity이면 FP 소비 없이 gather, 또는 FP를 Value 부족분만큼 지출할 수 있다. 다중 보정/FP 적용 순서를 투명하게 보여줄 필요가 있다(12,32,66).
4. 성공한 **하나의 Reagent**에서 하나 또는 여러 Parts를 gather할 수 있다. 같은 Part2개도 가능하다(32).
5. **같은 카드**로 그 Region/Season의 Foraging Encounter를 해결한다(33).
6. Bags를 확인한다. 필요한 재료가 모두 있으면 **Timer 감소 전에 즉시 Remedy**를 만든다(33).
7. Remedy를 만들 수 없을 때만 Timer를 감소한다. current base1, adjacent base2 + (gathered Part count -1). 예: adjacent에서 Parts2개는3시간(33). 실패/Parts0일 때 추가항을 어떻게 적용할지는 문구상 모호하므로 임의로 음수 시간을 생성하면 안 된다.
8. Timer가 남아있으면 반복. 모두0이면 Preparing to Leave(33).

### Barter

- 현재/Adjacent Settlement/City에서 가능. Ailment당 Settlement1 attempt, City3 attempts. Haggling을 시작하면 성공 여부와 무관하게 attempt를 사용한다(34). 'once per settlement vs 전체 settlement class', 'multi ailment에서 shared attempts'는 모호하므로 수동 보정이 필요하다.
- **하나의 non-Titan Reagent Part**를 선택한다. Forage와 별개의 rarity 공식이다(34).
- Settlement local -2, City trade route(3 Paths 이내) -2, in season -1, out of season이면서 not local/trade route +2, FAIR 가능 +3, TAG3 가능 +5, FOUL potency만큼 +, Reputation Unknown +1/Established(Known)0/Upstanding -1/Trusted -2(34).
- 높은 Rarity를 보고 **Wander 전에** 취소하여 Forage로 돌아갈 수 있다(34).
- 첫 카드: 해당 Settlement/City와 Season의 Social Encounter(35).
- 두 번째 카드: Reagent Rarity와 비교하여 획득 여부(35). Forage의 같은 카드 재사용과 달리 두 draw다.
- 부족하면 Trinkets/Reputation으로 차이를 메우거나 빈손으로 나올 수 있다(35). Gossip/Titan Tale 등 특수 Item은 자동 barter 대안이다(42,78,92).
- 필요한 재료가 충분하면 즉시 Remedy. 아니면 모든 Timer -1(35).

### Remedy와 떠나기

- 준비법과 선택한 재료로 Recipe를 자유롭게 설명하고 환자 경험을 기록한다(31). 완전한 시뮬레이션의 자동 verdict만으로 서사 조건을 확정하면 안 된다.
- Preparing to Leave를 시작하면 FP0(36).
- cured Ailment당 Severity(1~4) Trinkets. net FAIR/FOUL2마다 +1/-1, 최소0. payment 대신 Gift하면 +2 Reputation, 받을 Trinkets가0이면 Gift 불가(36).
- cured Ailment당 Severity Reputation은 payment와 별도로 획득한다. Gift의 +2는 여기에 추가된다(36).
- Outcome 조건을 확인하여 해당 지시를 해결한다(36).
- 모든 Timer가0보다 높을 때만 Scrounge 가능: 1h current forage, 2h adjacent forage, 3h current 확정 Part(max potency2), 4h adjacent 확정 Part(max potency2). 모든 remaining Timer를 함께 낮춘다(37).
- 미해결 Timer0의 Consequence와 Severity Reputation 손실을 해결한다. 모든 Ailment를 실패하면 Overstayed로 즉시 Move, services/scrounge 불가(36~37). Quagmire's Scale은 다른 cured가 있어도 Overstayed가 되는 specific exception(111), Brand Care는 실패해도 Overstay가 되지 않는 exception(105).
- Settlement/City에서만 Pawning, Guild Services, Tools, Upgrades를 이용할 수 있다. Pawning은 버린 totalWeight를 nearest whole로 반올림한 Trinkets(37,58~66).

## 중요 예외: 자동화가 놓치기 쉬운 실제 정보

- **대안 요구조건**: Anxious Scratching은 fur/feather/scale 중1, Crestfallen은 두 개의 완전한 remedy 대안, Safety Stench는 nerves/instinct 중1, Sunstruck은 feather/hide 중1, Tickbitten은 fur/feather 중1, Mawfoam은 instinct/mood 중1(104,106,109,111,113).
- **복수 환자**: Fight Marks2개 separateTimers, Soured Dough4개 separateTimers/각 rewards, Groundhog3명의 환자(106~107,112). Monarch는 더 낮은 Severity2개(103).
- **서사/준비 조건**: Bad Idea FOUL 금지 + potency3 Outcome; Waen Drops minimumFAIR3; Wake FAIR4 및 ELSEWHERE/JOY3&2, cooked Outcome; Wingbreak bone setting; Paw Rot preserved Outcome; Stingshock2dose Outcome(104,110,112,114~115).
- **추가 판정**: Forager's Twitch spade/club면 WOUND1 추가; Bite the Hand That Cures는 별도의 ailment를 draw하고 환자를 BR8 reagent처럼 찾기; Mawfoam remedy 후 spade면 자신에게 추가 cure 필요(104,107,109).
- **시간에 따른 변화**: Quagmire는 Timer2 전에 해결하지 못하면 POISON1→3; Pinned by Pine은 freeing 전 매 Timer 감소 추가1; Wake barter 때 Timer+1; Hunted current forage spade는 encounter 중지/Timer-1/FP0; Seasonshift 두꺼운 fur 절단 시 Timer+2; Smoker's Snout fire aid는 Timer-2/Reputation+4(108,111~112,115).
- **장비 시간 보정**: Steel-lined Mortar는 helping 중 처음 gather한 grind/crush Part일 때 모든Timer+1, Efficient Copper Kettle는 boil/brew gather시 singleTimer+1. Knife upgrades FPgain/start modifiers는 서로 다른 효과(66).
- **Familiar는 상시/1회/카드 대체형이 혼재**: Helpful Timer+2; Perceptive FP+2; Independent once/ailment adjacent forage noEncounter/noTimer; Seasoned traveldraw2choose; Titanwise Titan rarity-2 및 Titan/Barrow foragedraw2choose; Resourceful 특정BR<=7 reagent를 anyRegion forage; Vigorous Carry+2(orwagon+4); Chatty barterBR-2; Shrewd Remedy Trinket+1; Ingenuitive Tool능력(14~15).
- **여행 Encounter는 세계를 바꾼다**: 추가/회복 Calendar Days, Move 끝점 변경, 다음 Move speed/timer/FP 보정, 제한된 Item/Service, 지속 접근금지/rarity, Journey 조기 종료/새로운 Quest, customReagent/Path 생성. 각 내용을 읽고 수동 상태 보정/기록을 할 수 있어야 한다(74~99).
- **travel table 계절 예외**: 일반 Bog/Forest/Loch/Meadow/Mountain A~8 공통,9/10,J,M 계절. Soar A~10 공통(9/10 Talons에 seasonal icon 없음), J 계절, M spring/summer공통+autumn+winter 분기. Titan A~M 모두 공통(72,94~99). 카드 범위만으로 일반화하지 말아야 한다.
- **Barrow**: 도착하면 치료 대신 해당 Behemoth type+draw suit로 Delve선택. challenge 전 Flee가능: Calendar+1 day Mark,nextMoveSpeed1. 성공하면 Barrow삭제. 일반 Preparing to Leave 생략(40,116).
- **지속 세계와 캐릭터는 별개**: Guild Reputation과 Wagon unlocks/expansions/Clinics는 다음 캐릭터에도 남는다. 여정 끝에 Character를 바꿀 수 있다(13,40,43~47,68).
- **후반 시스템은 초반 주업무가 아니다**: Clinic은 fourSeasons 후Wildcure+15Trinkets, nextSeason완성, radius3Paths와 sharedGuildAgenda(44~47). Wagon은 cityDowntime 구매, 이후 city별 expansions(43,68~69). Coop은 optional(48~53).

## 룰북 자체의 모순/미정 사항

이는 앱 해석을 근거로 한 판단이 아니라 원문에서 발견한 충돌이다. 규칙 교정과 편의 자동화를 구별해야 한다.

| 원문 | 충돌/모호함 | 정직한 도구의 처리 |
|---|---|---|
| 103 vs106 | Crestfallen indexIntermediate, detailLesser | drawtable의 context를 유지하고 상세 source discrepancy/수동severity변경 제공 |
| 103 vs110,111 | Nervefright/Seasonshift indexSevere, detailLesser | 같은 처리. quiet fabricated errata 금지 |
| 43 vs68 | Wagon base cost20 vs15Trinkets | catalog specific entry68의15를 기본으로 제시하되43의20과 충돌 표기/수동cost |
| 12 vs20 | generic 'Trial Evidence' Weight1/3, Justice Goal EvidenceWeight1 | SpecificOverridesGeneral(6); Justice에서1, genericItem에서1/3 |
| 13,21 vs34,40,46 | tier15가 Established 또는Known | 동일threshold의 대체 명칭으로 표시 가능; 값은0/15/25/35 |
| 33 | Parts0에도 X-1을 적용하는지 명시 없음 | 감소 입력/preview와 수동조정. 음수 시간 자동 생성 금지 |
| 34 | attempts scope 및 실패했지만 haggling 안했을 때 attempt 사용 문구 | 해당location usage 및 수동adjustment, 규칙 원문 접근 |
| 105 | Broken Beaks requirements PAIN3,PAIN2,STOMACH3 | 원문을 보존. 일반TAG는max라PAIN3 충족시2도충족하지만 duplicated requirement를 조용히 다른TAG로 바꾸지 말 것 |
| 107,109,115 | Groundhog x3 timers, LongDrop patient search, Wake3&2 구체적 dose해석 | 원문 조건과 자유판정/manualcompletion을 함께 보여줄 것 |
| 113 | The Runs consequence에서 Woeful Waters 언급,102~103table엔 없음 | 제공 source불완전/인덱스누락으로 표시, 새 ailment를 지어내지 말 것 |
| 24 vs25,62,65 | water-safe tool 설명이 일부 포괄적 | 구체적 Tool능력을 기준으로 Coracle=stop,Waxed=soakProtection로 구분 |

## 룰북으로부터 도출한 UX 요구사항

1. **진행중인 플레이가 첫 화면**이어야 한다. 현재 Location/Season/Journey day와 환자의 개별 Timer, 바로 해야 할 다음 단계가 항상 보이면 무엇을 눌러야 하는지 추론할 필요가 없다. 생성/후반 시스템은 해당 시점에 노출한다.
2. **환자 중심 작업 공간**에서 증상→가능한 준비법과 inventory→현/인접 후보 및 location별 rarity→Forage/Barter→Remedy를 이어야 한다. raw entirecatalog를 매번 찾아다니는 구조는 룰북이 반복시키는 연구 비용을 그대로 전가한다.
3. **현재 작업의 판정 순서**를 보여주되 모든 draw를 한 버튼으로 뭉개지 말아야 한다. Forage는 같은 카드/Barter는 두카드라는 차이, encounter후remedy전timer라는 순서가 화면의 action order로 드러나야 한다.
4. **다음 행동 전에 비용을 preview**한다. location과Parts수에 따른hours, gather후weight, FP사용, barterhaggling부족분, availablemethods를 한눈에 보여주고 실행 후중복 차감을 피해야 한다.
5. **일/시간, 캐릭터/세계**를 구별한다. travelday와patienthour, consumableBag와persistentGuildMap상태를 서로 다른명칭/시각적위계로 표현해야 한다.
6. **규칙은 contextual quickreference**여야 한다. 현재 단계에서 원문 페이지와 요약을1클릭으로 열 수 있고, 현재 encounter/patient의 specialinstructions는 실제 수행 지점에서 보인다. broad encyclopedia만으로는 반복 참조 요구를 만족하지 못한다.
7. **자동판정의 한계를 드러내고 자유입력을 허용**한다. OR조건, 서사조건, 규칙모순, customreagents/mapeffects가 있으므로 choose/manualdraw, timer/rarity수정, 수동remedy확정과 override기록은 실제 규칙충실성의 일부다(6~7,30,39).
8. **지도는 연구와 이동의 도구**다. current/adjacent/traderoute3Paths, waterconstraints, destination/route, localconsequences를 연결해야 한다. 지도보기를 끝없는fullscreen배경 탐색으로 만들 필요는 없다.
9. **저널은 lightweight optionalcontext**여야 한다. 자동mechanicallog와 narrativeprompt가 만나되 mandatorylargeform로 진행을 막아서는 안 된다(7,31,38).
10. **모바일에서는 한핵심action+항상보이는 상태**, desktop에서는환자와후보/가방을 같은view에 비교하는 배치가 맞다. 판단에 필요한timer/symptom/rarity를 다른tab에 흩어놓지 않는다.

## 순차 검토 기록 (누락 없는 1~116쪽)

- 1: 표지. 2~3: 장비삽화. 4: credits/version. 5: contents. 6: draw/cardvalues/specificrule precedence. 7: journaling/ruleflexibility/contentwarnings. 8~9: overviewloop.
- 10: characterdescriptor table. 11: travelstyle/carry/origin table. 12: initialtools/Bags/Trinkets. 13: persistentGuildReputation. 14~15: familiarbenefits. 16: relationshipprompts. 17: 삽화.
- 18: journeysetup/origin/season. 19: destinationdistance/direction. 20~21: goals/urgencycalendar. 22: locationtypes. 23: regions. 24: paths/water/move/encumbrance. 25: encounter/time/localhelp/soar.
- 26: ailmentfields. 27: reagentfields/icons/TAGnonstacking. 28: patientdraw. 29: severitydraw/ailmentdraw/Timers. 30: regionalresearch/rarity/substitution. 31: gather/remedy/leave. 32: forage/gather/FP. 33: forageencounter/remedy-beforetime/timerformula. 34~35: bartermodifiers/socialthenbarterdraw/haggle/remedy-beforetime. 36~37: departure/rewards/gift/rapport/outcomes/scrounge/consequences/services.
- 38: journeyreflection/goalresolution. 39: tangibleeffects. 40: downtime/newcharacter/barrowrumours. 41: practice/stocks/map/selfactivities. 42: guildnotes/friend/lendingactivities. 43: wagoncommission/NewGamePlus. 44: clinicunlock/build/servicearea. 45: 삽화. 46~47: guildagenda/services. 48: cooperativeamendment. 49: PenPals. 50~51: Caravan. 52~53: GuildAssociates/sharedworld/scaling.
- 54: Almanackcontents/use. 55: sectionillustration. 56: trinketgenerator. 57: 삽화. 58: universalGuildServices. 59: regionalGuildServices. 60: cityGuildServices/mapedits. 61: remainingcityservices. 62~65: alltools/weight/methods/protection/crafting. 66: basictoolupgrades/FP/timer/preparationmodifiers. 67: 삽화. 68~69: allwagonexpansions/passengers/plants/soar. 70~71: allcompanions/adoption/limits/pathtriggers. 72: travelencounterdraw/season/choices. 73: 삽화.
- 74: BogA~4. 75: Bog5~8+Spring9~M. 76: BogSummer9~M/Autumn9~10/Winter9~10. 77: BogAutumnJ/WinterJ/AutumnWinterM. 78: ForestA~8. 79: ForestSpring/Summer9~M. 80: ForestAutumn9~M. 81: ForestWinter9~M.
- 82: LochA~6. 83: Loch7~8/Spring9~M/Summer9~10. 84: LochSummerJ~M/Autumn9~J. 85: LochAutumnM/Winter9~M. 86: MeadowA~8. 87: MeadowSpring9~M/Summer9~J. 88: MeadowSummerM/Autumn9~M. 89: MeadowWinter9~M.
- 90: MountainA~8. 91: MountainSpring9~M/Quest. 92: MountainSummer9~M. 93: MountainAutumn/Winter9~M. 94: SoarA~6. 95: Soar7~10(cross-seasonTalons). 96: SoarSpring/SummerJ~M. 97: SoarAutumn/WinterJ~M. 98: TitanA~6. 99: Titan7~M/Rash/earlyending. 100: ailmentfieldreminder. 101: 삽화.
- 102: TAGglossary+Lesserindex. 103: remainingindices/Monarchmultiailments. 104: AnxiousScratching/BadIdea/BiteTheHand. 105: BlockedEars/Bloodthirst/BrandCare/BrokenBeaks. 106: Crestfallen/Dullsweats/FightMarks/Firstfever/FondFarewell. 107: Forager'sTwitch/ForgeClawed/FoulDeceiver/Groundhog. 108: Herbivorous/Hunted/BlackBeast/Lockjaw. 109: LongDrop/Mawfoam/Midge/Migration. 110: MonthlyChore/Nervefright/NightShift/PawRot. 111: Pinned/Quagmire/SafetyStench/Seasonshift. 112: Smoker'sSnout/SouredDough/Stingshock. 113: SnailAils/Sunstruck/TheRuns/Tickbitten. 114: TitanTouched/TrowelTroubles/WaenDrops. 115: Wake/Wingbreak/Wormridden. 116: BarrowDelveprocedure/flee/suittable.

범위 내 모든 rules/procedures/catalog entries/travel encounters/ailments를 읽었다. 위 요구사항을 앱과 비교하는 감사와 설계의 독립 기준으로 사용할 수 있다.
