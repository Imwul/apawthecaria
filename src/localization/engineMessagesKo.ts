import { localizeCanonicalToolName } from './gameplayKo';
import { normalizeGuildReputationTerms } from './guildReputation';

const exactEngineMessages: Record<string, string> = {
  "Acknowledge the printed journaling prompt before resolving.": "룰북의 일지 질문을 확인한 뒤 판정하세요.",
  "A Knitted Blanket is required to prevent the premature Journey ending.": "여정이 일찍 끝나는 것을 막으려면 뜨개 담요가 필요합니다.",
  "A Passenger is unavailable or already aboard.": "태울 수 있는 동승자가 없거나 이미 탑승 중입니다.",
  "A normal Wagon cannot Soar.": "일반 마차로는 활공할 수 없습니다.",
  "A selected Pawn item is not in the Inventory.": "선택한 전당품이 가방에 없습니다.",
  "A selected canonical action is not part of this printed effect.": "선택한 행동은 이 룰북 효과에 포함되지 않습니다.",
  "A total of 21 grants one real Tool choice.": "합계 21을 달성하면 실제 도구 하나를 선택할 수 있습니다.",
  "A valid Pilfer total from 1 to 21 is required.": "Pilfer 합계는 1에서 21 사이여야 합니다.",
  "A weightless Tool cannot be lightened further.": "무게가 없는 도구는 더 가볍게 만들 수 없습니다.",
  "Acquisition transaction is missing or already applied.": "획득 처리 기록이 없거나 이미 적용되었습니다.",
  "Active Ailment instance not found.": "진행 중인 질병을 찾지 못했습니다.",
  "Active canonical Ailment instance not found.": "진행 중인 룰북 질병을 찾지 못했습니다.",
  "Adjacent Foraging requires a Region connected by the canonical map graph.": "인접 지역 채집은 지도에서 연결된 지역에서만 가능합니다.",
  "Ailment Timer transaction is missing or already applied.": "질병 타이머 처리 기록이 없거나 이미 적용되었습니다.",
  "Ailment effect transaction is missing or already applied.": "질병 효과 처리 기록이 없거나 이미 적용되었습니다.",
  "Ailment failure transaction is missing or already applied.": "질병 실패 처리 기록이 없거나 이미 적용되었습니다.",
  "Ailment instance not found.": "질병을 찾지 못했습니다.",
  "All Ailments must be resolved before leaving as treated.": "치료 완료로 떠나보내려면 모든 질병을 해결해야 합니다.",
  "Apply each printed Ailment Consequence before Moving On.": "다음 단계로 넘어가기 전에 각 질병의 룰북 결과를 적용하세요.",
  "Automatic effects were applied. Resolve the remaining printed effects manually.": "자동 효과를 적용했습니다. 룰북에 적힌 나머지 효과는 직접 판정하세요.",
  "Automatic persistent effects were applied. Complete the printed narrative Consequence in the Journal.": "지속 효과를 자동 적용했습니다. 룰북에 적힌 서사 결과를 일지에 기록하세요.",
  "Backing out is only available after the second card fails.": "물러나기는 두 번째 카드도 실패한 뒤에만 가능합니다.",
  "Bad Idea cannot be treated with a Remedy containing FOUL.": "Bad Idea는 FOUL이 포함된 처방으로 치료할 수 없습니다.",
  "Bad Idea outcome transaction is missing or already applied.": "Bad Idea 결과 처리 기록이 없거나 이미 적용되었습니다.",
  "Barter card transaction was already applied.": "물물교환 카드 처리를 이미 적용했습니다.",
  "Barter is not waiting for a Social Encounter.": "물물교환이 교류 조우 판정을 기다리는 상태가 아닙니다.",
  "Barter is not waiting for payment.": "물물교환이 지불을 기다리는 상태가 아닙니다.",
  "Barter leave transaction was already applied.": "물물교환 종료 처리를 이미 적용했습니다.",
  "Barter payment was already applied.": "물물교환 지불이 이미 적용되었습니다.",
  "Barter requires a Social Encounter.": "물물교환에는 교류 조우가 필요합니다.",
  "Barter requires the active patient and at least one active Ailment.": "물물교환에는 현재 환자와 하나 이상의 진행 중인 질병이 필요합니다.",
  "Barter start transaction is missing or already applied.": "물물교환 시작 처리 기록이 없거나 이미 적용되었습니다.",
  "Base treatment succeeded. Resolve any printed optional Outcome or special rule shown.": "기본 치료에 성공했습니다. 표시된 선택 결과나 특별 규칙이 있다면 판정하세요.",
  "Basic Tools can only replace Belt Knife, Camp Kettle, or Mortar and Pestle.": "기본 도구는 벨트 칼, 낡은 캠프 주전자, 나무 절구와 공이만 교체할 수 있습니다.",
  "Brave ended the Behemoth encounter positively and gained one local Reagent.": "Brave 효과로 거수 조우를 긍정적으로 끝내고 현지 영약재 하나를 얻었습니다.",
  "Brave requires a heart or diamond Travel Encounter with the Behemoth tag.": "Brave에는 하트 또는 다이아몬드 무늬이며 거수 태그가 있는 이동 조우가 필요합니다.",
  "Brave requires a local Reagent with Base Rarity 6 or lower.": "Brave에는 기본 희귀도 6 이하의 현지 영약재가 필요합니다.",
  "Broken canonical Tool was not found.": "파손된 룰북 도구를 찾지 못했습니다.",
  "Build a Bridge requires one Loch joined by Waterways to two non-Loch Locations.": "다리 건설에는 수로로 호수가 아닌 장소 두 곳과 이어진 호수 하나가 필요합니다.",
  "Building Trust requires its Ailment result and a journal note.": "Building Trust에는 질병 판정 결과와 일지 기록이 필요합니다.",
  "Building Trust requires its canonical Patient.": "Building Trust에 해당하는 환자가 필요합니다.",
  "Building Trust requires one drawn Intermediate Ailment.": "Building Trust에는 뽑은 중간 질병 하나가 필요합니다.",
  "Canonical Ailment definition not found.": "룰북 질병 정보를 찾지 못했습니다.",
  "Canonical Tool instance is not present in Inventory.": "해당 룰북 도구가 가방에 없습니다.",
  "Choose a legal destination candidate for the drawn card. Redraw when no candidate exists.": "뽑은 카드로 갈 수 있는 목적지를 선택하세요. 후보가 없다면 다시 뽑으세요.",
  "Choose an active Timer for the printed Timer change.": "룰북에 적힌 시간 변화를 적용할 진행 중인 타이머를 선택하세요.",
  "Choose an available Tool for Inspiration.": "영감을 적용할 수 있는 도구를 선택하세요.",
  "Choose an eligible Inventory item to remove.": "가방에서 제거할 수 있는 물품을 선택하세요.",
  "Choose one Reagent, then choose one or more Parts from that Reagent.": "영약재 하나를 고른 뒤 그 영약재의 부위를 하나 이상 선택하세요.",
  "Choose success, partial, failure, or abandoned and write the Journey ending.": "성공, 부분 성공, 실패, 포기 중 하나를 선택하고 여정의 결말을 기록하세요.",
  "Choose the Bad Idea Inspiration reward and its Tool target before committing treatment.": "치료를 확정하기 전에 Bad Idea의 영감 보상과 대상 도구를 선택하세요.",
  "Choose the printed wager and finishing result for Place a Bet.": "Place a Bet의 내기 금액과 순위 결과를 고르세요.",
  "Choose whether to treat Brand Care or refuse under Guild law.": "Brand Care를 치료할지, 길드 규정에 따라 거절할지 선택하세요.",
  "Choose which travelling Companion returns to the wild.": "함께 여행 중인 길동무 중 자연으로 돌려보낼 대상을 선택하세요.",
  "Clay Pots require one Plant Reagent that is in Season at the start of the Journey.": "이식용 진흙 화분에는 여정 시작 시 제철인 식물 영약재 하나가 필요합니다.",
  "Clay Pots with a planted Reagent are required.": "영약재를 심어 둔 이식용 진흙 화분이 필요합니다.",
  "Collapsed Entrance is not active.": "무너진 입구가 진행 중이 아닙니다.",
  "Companion is not in the selected roster.": "선택한 명단에 이 길동무가 없습니다.",
  "Companion is not travelling with you.": "이 길동무는 현재 함께 여행하지 않습니다.",
  "Companions are adopted in a City of a Region where they can be found.": "길동무는 해당 종을 만날 수 있는 지역의 도시에서 맞이할 수 있습니다.",
  "Companions can be stored or swapped only at a Clinic with Hive Boxes.": "길동무 보관과 교체는 벌집 상자가 있는 약제소에서만 가능합니다.",
  "Complete exactly one Downtime activity before ending the Season.": "계절을 끝내기 전에 휴식기 활동을 정확히 하나 완료하세요.",
  "Complete one Downtime activity first.": "먼저 휴식기 활동을 하나 완료하세요.",
  "Confirm that the recipient entered a Settlement or City before completing Send Package.": "소포 보내기를 완료하기 전에 수령인이 정착지 또는 도시에 들어왔는지 확인하세요.",
  "Crossbow protection requires a Beast or Behemoth Encounter.": "석궁 보호 효과에는 야수 또는 거수 조우가 필요합니다.",
  "Crossbow protection requires an intact Crossbow and Bolts.": "석궁 보호 효과에는 온전한 석궁과 석궁 볼트가 필요합니다.",
  "Current-location Foraging is only allowed in Wilds, Titan Ruins, and Behemoth Barrows.": "현재 장소 채집은 야생 구역, 티탄 유적, 거수 고분에서만 가능합니다.",
  "Delivery transaction is missing or already applied.": "배달 처리 기록이 없거나 이미 적용되었습니다.",
  "Destination is not present in the map graph.": "목적지가 지도 경로망에 없습니다.",
  "Downtime requires a transaction ID.": "휴식기 처리 정보가 없습니다.",
  "Draw the Forager's Twitch follow-up card.": "Forager's Twitch 후속 카드를 뽑으세요.",
  "Each Reagent Base Rarity must match its card in draw order.": "각 영약재의 기본 희귀도는 뽑은 순서의 카드와 일치해야 합니다.",
  "Each selected Stingshock ingredient needs enough remaining Uses for both complete doses.": "선택한 각 Stingshock 재료에는 두 번의 완전한 투약에 충분한 사용 횟수가 남아 있어야 합니다.",
  "Every failed Ailment must have a newly expired Timer and an unresolved Consequence.": "각 실패 질환에는 방금 만료된 타이머와 아직 적용하지 않은 결과가 있어야 합니다.",
  "Every selected Remedy ingredient needs enough remaining Uses for the complete dose.": "선택한 모든 치료제 재료에 완전한 투약분을 만들 만큼 사용 횟수가 남아 있어야 합니다.",
  "Expired Ailment instances must be a non-empty unique list.": "만료 질환 목록은 비어 있지 않아야 하며 같은 질환을 중복해서 포함할 수 없습니다.",
  "Timer failure recovery requires a transaction ID.": "만료된 환자 타이머를 마감할 처리 정보가 없습니다.",
  "Encounter requires a transaction ID.": "조우 처리 정보가 없습니다.",
  "Encounter Ailment requires stable transaction and encounter IDs.": "조우 질환을 시작하려면 안정적인 조우 및 처리 식별 정보가 필요합니다.",
  "Encounter Ailment card did not resolve on the requested Severity table.": "뽑은 조우 질환 카드가 지정된 심각도 표에서 결과로 이어지지 않았습니다.",
  "Encounter Ailment was already started.": "이 조우 질환은 이미 시작되었습니다.",
  "End the active Journey first.": "먼저 진행 중인 여정을 끝내세요.",
  "Ending transaction was already applied.": "결말 처리를 이미 적용했습니다.",
  "Escaping the Barrow requires a journal note.": "고분에서 탈출하려면 일지 기록이 필요합니다.",
  "Every selected Part must belong to the chosen Reagent.": "선택한 모든 부위는 고른 영약재에 속해야 합니다.",
  "Every selected Part must exist in Inventory with canonical identity.": "선택한 모든 부위는 룰북 식별 정보와 함께 가방에 있어야 합니다.",
  "Every selected Remedy ingredient must be a canonical prepared Reagent in Inventory.": "선택한 모든 처방 재료는 가방에 든 룰북 영약재 부위여야 합니다.",
  "Exactly one Downtime activity is allowed between Journeys.": "여정과 여정 사이에는 휴식기 활동을 정확히 하나만 할 수 있습니다.",
  "Fine-toothed Comb use requires its breakage card.": "참빗을 사용하려면 파손 판정 카드가 필요합니다.",
  "Finish the active Delve first.": "먼저 진행 중인 고분 탐사를 끝내세요.",
  "Finish the active Patient before diagnosing the Barrow community.": "고분 주민을 진단하기 전에 현재 환자 기록을 마치세요.",
  "Fitting Clay Pots requires one Plant Reagent that is in Season.": "이식용 진흙 화분 설치에는 제철 식물 영약재 하나가 필요합니다.",
  "Flee is only available before starting the Challenge.": "도망치기는 도전을 시작하기 전에만 가능합니다.",
  "Flee requires a journal note.": "도망치려면 일지 기록이 필요합니다.",
  "Floodplain requires one non-Loch Wild Location.": "범람지 만들기에는 호수가 아닌 야생 장소 하나가 필요합니다.",
  "Foraging requires a transaction ID.": "채집 처리 정보가 없습니다.",
  "Garden crops are available this Season; harvesting remains a player choice.": "이번 계절에 정원 작물을 수확할 수 있습니다. 수확 여부는 플레이어가 선택합니다.",
  "Gather at least one valid Part.": "유효한 부위를 하나 이상 채집하세요.",
  "Glass Alembic is required to CATALYSE.": "CATALYSE에는 유리 증류기가 필요합니다.",
  "Gossip Barter transaction is missing or already applied.": "Gossip 물물교환 처리 기록이 없거나 이미 적용되었습니다.",
  "Granite Mortar and Pestle is required.": "화강암 절구와 공이가 필요합니다.",
  "Guaranteed Scrounging is limited to Potency 2 or lower.": "보장된 여분 채집은 효능 2 이하로 제한됩니다.",
  "Guaranteed Scrounging requires one canonical Reagent Preparation.": "보장된 여분 채집에는 룰북 영약재 부위 하나가 필요합니다.",
  "Guild Services require a journal note.": "길드 서비스에는 일지 기록이 필요합니다.",
  "Help Local Beasts or finish the Barrow Delve before moving.": "이동하기 전에 현지 야수를 돕거나 고분 탐사를 끝내세요.",
  "Resolve a local beast's Ailment before moving again.": "다시 이동하기 전에 현지 야수의 질환 하나를 해결하세요.",
  "Hitch a Ride must end at its recorded destination.": "농부 마차 얻어타기는 기록된 목적지에서 끝나야 합니다.",
  "Hitch a Ride travels up to 5 Paths and must end in a Meadow Location.": "농부 마차 얻어타기는 최대 5개 경로를 이동하며 초원 장소에서 끝나야 합니다.",
  "Hunted: the Behemoth appeared on a Spade, the Foraging event was abandoned, and the Ailment Timer decreased by 1.": "Hunted: 스페이드에서 거수가 나타나 채집을 포기했고 질병 타이머가 1 줄었습니다.",
  "Inside Job and a journal note are required.": "Inside Job과 일지 기록이 필요합니다.",
  "Invalid Personality or Descriptor card.": "성격 또는 특징 카드가 올바르지 않습니다.",
  "Invalid Tool upgrade.": "도구 개조가 올바르지 않습니다.",
  "Journey Reason is required.": "여정을 떠나는 이유가 필요합니다.",
  "Journey transaction is missing or already applied.": "여정 처리 기록이 없거나 이미 적용되었습니다.",
  "Juicy Gossip can only be used when Haggling after the Social Encounter.": "Juicy Gossip은 교류 조우 뒤 흥정할 때만 사용할 수 있습니다.",
  "Knitting requires intact Knitting Needles and a canonical project.": "뜨개질에는 온전한 뜨개바늘과 룰북에 있는 프로젝트가 필요합니다.",
  "Leave transaction is missing or already applied.": "환자 떠남 처리 기록이 없거나 이미 적용되었습니다.",
  "Manual effect transaction is missing or already applied.": "직접 판정 처리 기록이 없거나 이미 적용되었습니다.",
  "Manual follow-up transaction is missing or already applied.": "후속 판정 처리 기록이 없거나 이미 적용되었습니다.",
  "The persisted printed choice does not match the selected Encounter branch. Re-select the printed choice before resolving.": "저장된 룰북 선택과 현재 조우 분기가 일치하지 않습니다. 판정하기 전에 룰북 선택을 다시 골라 주세요.",
  "The Cocoon created by this result is missing or ambiguous. Restore the affected item before completing its hatch.": "이 결과에서 얻은 Cocoon이 없거나 어느 물품인지 확정할 수 없습니다. 부화 판정을 마치기 전에 해당 물품을 가방에 되돌려 주세요.",
  "Confirm that the Cocoon has travelled 10 Paths since it was gained, or that its Journey has ended.": "Cocoon을 얻은 뒤 10 Paths를 이동했거나, 해당 여정을 끝냈는지 확인해 주세요.",
  "The Place a Bet Trinket result does not match the persisted wager and finishing result.": "Place a Bet의 장신구 결과가 저장된 내기 금액과 순위에 맞지 않습니다.",
  "This manual follow-up is no longer pending.": "이 후속 판정은 더 이상 대기 중이 아닙니다.",
  "No travelling Companion slot is available. Defer this result, then release or store a Companion before protecting the Queen.": "함께 여행할 길동무 자리가 없습니다. 이 판정을 잠시 덮어두고, 기존 길동무를 자연으로 보내거나 약제소에 맡긴 뒤 여왕벌을 보호하세요.",
  "No travelling Companion slot is available for the Butterfly.": "Butterfly가 함께 여행할 자리가 없습니다.",
  "Movement is complete; resolve the printed encounter before continuing.": "이동을 마쳤습니다. 계속하기 전에 룰북 조우를 판정하세요.",
  "Nefarious Concoction requires SLEEP 4 and FOUL 8.": "Nefarious Concoction에는 SLEEP 4와 FOUL 8이 필요합니다.",
  "No Barter attempts remain at this location for this patient.": "이 환자를 위해 이 장소에서 시도할 수 있는 물물교환이 남아 있지 않습니다.",
  "No Delve matches this Behemoth and suit.": "이 거수와 카드 무늬에 해당하는 고분 탐사가 없습니다.",
  "No News From The Trail choice remains.": "선택할 수 있는 길 위의 소식 항목이 남아 있지 않습니다.",
  "No Reagent is available for this draw; gain 1 Foraging Point.": "이번 카드로 얻을 수 있는 영약재가 없어 채집 포인트 1을 얻습니다.",
  "No Wasp Foraging draw is ready.": "판정할 말벌 채집 카드가 없습니다.",
  "No active Barrow Challenge.": "진행 중인 고분 도전이 없습니다.",
  "No available canonical Companion matches this trigger.": "이 조건에 맞는 룰북 길동무가 없습니다.",
  "No canonical Foraging Encounter matches this draw.": "이 카드에 해당하는 룰북 채집 조우가 없습니다.",
  "No canonical encounter matches the completed Move.": "완료한 이동에 해당하는 룰북 조우가 없습니다.",
  "No canonical encounter matches the supplied context.": "주어진 조건에 해당하는 룰북 조우가 없습니다.",
  "Not Forgotten": "잊히지 않은 기억",
  ". What is special about this spot? What memories does the memorial try to share?": "이 장소만의 특별한 점은 무엇인가요? 이 기념물은 어떤 기억을 전하려 하나요?",
  "What is special about this spot? What memories does the memorial try to share?": "이 장소만의 특별한 점은 무엇인가요? 이 기념물은 어떤 기억을 전하려 하나요?",
  "Name the printed Inventory item to gain.": "룰북에 적힌 가방 물품 중 얻을 물품의 이름을 입력하세요.",
  "The missed Reagent is unavailable in this Region or Season.": "놓친 영약재는 이 지역 또는 계절에 구할 수 없습니다.",
  "This Reagent can already be gathered without spending Foraging Points.": "이 영약재는 채집 포인트를 쓰지 않고도 이미 채집할 수 있습니다.",
  "Choose another mapped Location as the Journey Destination.": "지도에 있는 다른 장소를 여정 목적지로 선택하세요.",
  "Choose a destination matching the drawn card direction and Location type.": "뽑은 카드의 방향과 장소 유형에 맞는 목적지를 선택하세요.",
  "Confirm the printed-map path band when saved connections cannot verify it.": "저장된 연결로 확인할 수 없는 거리 구간은 인쇄 지도에서 직접 확인하세요.",
  "Draw or enter a Destination card.": "목적지 카드를 뽑거나 입력하세요.",
  "An invented Goal needs both a purpose/title and a clear completion condition.": "직접 만든 목표에는 목적 또는 제목과 명확한 완료 조건이 모두 필요합니다.",
  "Draw, choose, or invent a Journey Goal.": "여정 목표를 뽑거나, 고르거나, 직접 만드세요.",
  "Resolve a local beast’s Ailment before ending the Move at this Location.": "이 장소에서 이동을 끝내기 전에 현지 야수의 질병을 해결하세요.",
  "Destination Region and Location type must match the selected map node.": "목적지의 지역과 장소 유형은 선택한 지도 지점과 일치해야 합니다.",
  "Not enough Trinkets.": "장신구가 부족합니다.",
  "Only an intact, unmodified Basic Tool can be upgraded.": "온전하고 개조되지 않은 기본 도구만 개조할 수 있습니다.",
  "Only one bottle of Musk Scrapings can be gathered per Forage.": "사향 긁은 가루는 한 번의 채집에서 1병만 모을 수 있습니다.",
  "Only Stingshock may use exactly two complete Remedy doses in one treatment.": "한 번의 치료에서 정확히 두 번의 완전한 투약분을 쓰는 선택은 Stingshock에만 적용됩니다.",
  "Override reason is required and is recorded separately from a normal resolution.": "예외 처리 사유가 필요하며 일반 판정과 별도로 기록됩니다.",
  "POUND requires canonical Plant Parts with a BREW preparation.": "POUND에는 BREW 조제법을 지닌 룰북 식물 부위가 필요합니다.",
  "PRESERVE requires a selected Big Iron Cauldron.": "PRESERVE에는 선택한 철제 가마솥이 필요합니다.",
  "Parts are gathered. Resolve the printed Foraging Encounter before applying Timer cost.": "부위를 채집했습니다. 시간 비용을 적용하기 전에 룰북의 채집 조우를 판정하세요.",
  "Passenger Booth is required.": "조수석 부스가 필요합니다.",
  "Passenger Ingenuitive benefit requires a canonical Tool.": "동승자의 Ingenuitive 혜택에는 룰북 도구가 필요합니다.",
  "Passenger destination does not satisfy its printed distance, Region, or nearest-location condition.": "동승자 목적지가 룰북에 적힌 거리, 지역 또는 가장 가까운 장소 조건을 충족하지 않습니다.",
  "Passenger name and destination are required.": "동승자의 이름과 목적지가 필요합니다.",
  "Passenger pickup becomes available only after trading a Remedy at a Settlement.": "동승자는 정착지에서 처방을 거래한 뒤에만 태울 수 있습니다.",
  "Passenger rewards are only paid at the recorded destination.": "동승자 보상은 기록된 목적지에서만 받을 수 있습니다.",
  "Patient generation requires a transaction ID.": "환자 생성 처리 정보가 없습니다.",
  "Patient name and species are required for the record.": "환자 기록에는 이름과 종이 필요합니다.",
  "Patient state is malformed.": "환자 상태 기록이 손상되어 치료를 진행할 수 없습니다.",
  "Pawn transaction is missing.": "전당 거래 처리 기록이 없습니다.",
  "Pawn transaction was already applied.": "전당 거래 처리를 이미 적용했습니다.",
  "Payment exceeds available Trinkets or Reputation.": "지불액이 보유한 장신구 또는 길드 명성을 초과합니다.",
  "Pending Guild delivery was not found.": "대기 중인 길드 배달을 찾지 못했습니다.",
  "Pick of the Deep requires a Titan Reagent no rarer than the drawn card.": "깊은 곳의 수확에는 뽑은 카드보다 희귀하지 않은 티탄 영약재가 필요합니다.",
  "Pilfer Unnoticed is not active.": "Pilfer Unnoticed가 진행 중이 아닙니다.",
  "Pinned by Pine decreased this Timer by 1 additional point.": "Pinned by Pine으로 이 타이머가 추가로 1 줄었습니다.",
  "Potent Poison only counts the seven named Reagents with canonical identity.": "Potent Poison은 룰북 식별 정보가 있는 일곱 가지 지정 영약재만 계산합니다.",
  "Potent Poison requires a journal note.": "Potent Poison에는 일지 기록이 필요합니다.",
  "Potent Poison resolves when its Timer reaches 0.": "Potent Poison은 타이머가 0이 되면 판정합니다.",
  "Powders and Teas stored with the Granite Mortar cannot exceed Carry score.": "화강암 절구에 보관한 가루와 차의 무게는 소지 한도를 넘을 수 없습니다.",
  "Repair requires a Settlement or City and 2 Trinkets.": "수리에는 정착지 또는 도시와 장신구 2개가 필요합니다.",
  "Replacement can only be committed after a successful Forage or Barter transaction.": "Replacement는 채집 또는 물물교환에 성공한 뒤에만 확정할 수 있습니다.",
  "Replacement requires a custom name and preparation.": "Replacement에는 직접 정한 이름과 조제 부위가 필요합니다.",
  "Resolve and confirm the printed Social Encounter before continuing.": "계속하기 전에 룰북의 교류 조우를 판정하고 확정하세요.",
  "Resolve the Social Encounter before drawing the Barter card.": "물물교환 카드를 뽑기 전에 교류 조우를 판정하세요.",
  "Resolve the pending Barter before starting another.": "새 물물교환을 시작하기 전에 대기 중인 물물교환을 판정하세요.",
  "Resolve the pending Encounter or Delve before Moving On.": "다음 단계로 넘어가기 전에 대기 중인 조우 또는 고분 탐사를 판정하세요.",
  "Resolve the pending Encounter or Delve first.": "먼저 대기 중인 조우 또는 고분 탐사를 판정하세요.",
  "Resolve the Season boundary before starting the next Journey.": "다음 여정을 시작하기 전에 계절을 정산하고 전환하세요.",
  "Resolving a Delve requires a journal note.": "고분 탐사를 판정하려면 일지 기록이 필요합니다.",
  "Result summary and journal note are required.": "결과 요약과 일지 기록이 필요합니다.",
  "Retrieval cannot request a Titan Reagent.": "회수 의뢰로 티탄 영약재를 요청할 수 없습니다.",
  "Retrieval is collected only at the recorded Settlement.": "회수 의뢰 물품은 기록된 정착지에서만 받을 수 있습니다.",
  "Retrieval is missing its canonical Reagent and Preparation.": "회수 의뢰에 룰북 영약재와 조제 부위 정보가 없습니다.",
  "Retrieval requires a Settlement at least 5 Paths away.": "회수 의뢰에는 경로가 5개 이상 떨어진 정착지가 필요합니다.",
  "Rug of Wonders is limited to non-Titan Reagents with Base Rarity 9 or lower.": "놀라운 양탄자는 기본 희귀도 9 이하의 티탄이 아닌 영약재로 제한됩니다.",
  "Scare Tactics requires one Behemoth-related map target.": "위협 제거에는 거수와 관련된 지도 대상 하나가 필요합니다.",
  "Scrounge Region must match the current or a graph-adjacent Region.": "여분 채집 지역은 현재 지역 또는 지도상 인접 지역이어야 합니다.",
  "Scrounge transaction is missing or already applied.": "여분 채집 처리 기록이 없거나 이미 적용되었습니다.",
  "Scrounging requires every active Timer to be above 0.": "여분 채집을 하려면 진행 중인 모든 타이머가 0보다 커야 합니다.",
  "Sealed Carriage recycling requires the selected Bark Coracle in Inventory.": "밀폐식 마차 재활용에는 선택한 나무껍질 배가 가방에 있어야 합니다.",
  "Season resolution requires a transaction ID.": "계절 판정 처리 정보가 없습니다.",
  "Select a canonical Juicy Gossip note from Inventory.": "가방에서 룰북의 Juicy Gossip 기록을 선택하세요.",
  "Select a canonical Reagent and Preparation.": "룰북 영약재와 조제 부위를 선택하세요.",
  "Select at least one pawnable item with remaining Weight.": "무게가 남아 있고 전당 잡힐 수 있는 물품을 하나 이상 선택하세요.",
  "Select at least one prepared Reagent.": "조제된 영약재 부위를 하나 이상 선택하세요.",
  "Select one Preparation belonging to the target Reagent.": "대상 영약재에 속한 조제 부위 하나를 선택하세요.",
  "Select one printed encounter choice before resolving.": "판정하기 전에 룰북의 조우 선택지 하나를 고르세요.",
  "Selected Inventory contains an unknown Preparation.": "선택한 가방 물품에 알 수 없는 조제 부위가 있습니다.",
  "Send Package requires selected items totalling no more than 5 Weight.": "소포 보내기로 고른 물품의 총무게는 5 이하여야 합니다.",
  "Send a Missive requires one to three real Settlement targets.": "전령 보내기에는 실제 정착지 목적지 1~3곳이 필요합니다.",
  "Send a Missive selected an unknown canonical Ailment.": "전령 보내기에서 알 수 없는 룰북 질병을 선택했습니다.",
  "Service Move transaction is missing or already applied.": "서비스 이동 처리 기록이 없거나 이미 적용되었습니다.",
  "Service transaction is missing or already applied.": "서비스 처리 기록이 없거나 이미 적용되었습니다.",
  "Shortcut requires one nearby map Location other than the current Location.": "숨은 지름길에는 현재 장소가 아닌 인접 지도 장소 하나가 필요합니다.",
  "Smithing requires 3 Trinkets.": "철공 개조에는 장신구 3개가 필요합니다.",
  "Smithing requires a Mountain Settlement or City.": "철공 개조는 산맥 정착지 또는 도시에서만 가능합니다.",
  "Social Encounter transaction was already applied.": "교류 조우 처리를 이미 적용했습니다.",
  "Soporific Incense requires SLEEP 6.": "Soporific Incense에는 SLEEP 6이 필요합니다.",
  "Starting a Delve requires a journal note.": "고분 탐사를 시작하려면 일지 기록이 필요합니다.",
  "Suitable Furnishings requires a journal note.": "Suitable Furnishings에는 일지 기록이 필요합니다.",
  "Suitable Furnishings requires exactly five cards.": "Suitable Furnishings에는 정확히 카드 5장이 필요합니다.",
  "Suitable Furnishings requires five ordered Reagents.": "Suitable Furnishings에는 순서를 정한 영약재 5개가 필요합니다.",
  "Survey Paths can join one Location only to a real existing Path.": "경로 측량은 한 장소를 실제로 존재하는 경로에만 연결할 수 있습니다.",
  "Survey Paths requires two distinct nearby map Locations.": "경로 측량에는 서로 다른 인접 지도 장소 두 곳이 필요합니다.",
  "Take Clippings requires a Plant Reagent.": "온실 꺾꽂이에는 식물 영약재가 필요합니다.",
  "Taxi Service must be consumed by a Soar Move.": "독수리 택시는 활공 이동에 사용해야 합니다.",
  "The Clay Pots must regrow for two Moves before gathering.": "이식용 진흙 화분은 수확하기 전에 두 번 이동하는 동안 다시 자라야 합니다.",
  "The Delve is not ready to begin.": "고분 탐사를 시작할 준비가 되지 않았습니다.",
  "The Goal evidence does not support a successful ending. Choose partial/failure or record the required evidence.": "목표 증거가 성공 결말을 뒷받침하지 않습니다. 부분 성공이나 실패를 선택하거나 필요한 증거를 기록하세요.",
  "The Journey ends unless a specific Tool or Benefit permits escape.": "특정 도구나 혜택으로 벗어나지 못하면 여정이 끝납니다.",
  "The banquet requires JOY 2, two STOMACH 2 Parts, NERVES 2, SENSES 3, and MOOD 2.": "연회에는 JOY 2, STOMACH 2 부위 두 개, NERVES 2, SENSES 3, MOOD 2가 필요합니다.",
  "The encounter is indexed, but its printed effects still require manual resolution.": "이 조우는 색인되어 있지만 룰북에 적힌 효과는 직접 판정해야 합니다.",
  "The planted Reagent has no canonical Part.": "심은 영약재에 룰북 부위 정보가 없습니다.",
  "The planted Reagent is not in Season for this Journey.": "심은 영약재는 이번 여정의 제철 영약재가 아닙니다.",
  "The selected Barrow is not active at the current Location.": "선택한 고분이 현재 장소에서 활성화되어 있지 않습니다.",
  "The selected Reagent is unavailable in this Region or Season.": "선택한 영약재는 이 지역 또는 계절에 구할 수 없습니다.",
  "The selected upgrade does not match an unmodified Basic Tool.": "선택한 개조가 개조되지 않은 기본 도구와 맞지 않습니다.",
  "The supplied destination is not connected by the selected Path route.": "지정한 목적지가 선택한 경로로 연결되어 있지 않습니다.",
  "The target Part cannot be found in the selected Region.": "대상 부위를 선택한 지역에서 찾을 수 없습니다.",
  "There is no active Journey to end.": "끝낼 수 있는 진행 중인 여정이 없습니다.",
  "This Delve does not accept a Remedy.": "이 고분 탐사에서는 처방을 사용할 수 없습니다.",
  "This Delve does not use Foraging attempts.": "이 고분 탐사에서는 채집 시도를 사용하지 않습니다.",
  "This Downtime transaction has already been applied.": "이 휴식기 처리는 이미 적용했습니다.",
  "This Replacement acquisition is already in Inventory.": "이 Replacement 획득물은 이미 가방에 있습니다.",
  "This Season transaction has already been applied.": "이 계절 처리는 이미 적용했습니다.",
  "This Settlement has no pending Guild Missive.": "이 정착지에는 대기 중인 길드 전령이 없습니다.",
  "This Timer action requires the affected Patient to remain available.": "이 타이머 행동을 적용하려면 대상 환자가 계속 기록에 남아 있어야 합니다.",
  "This Tool cannot be purchased from a market.": "이 도구는 시장에서 구입할 수 없습니다.",
  "This Tool is not sold at the current canonical Location.": "이 도구는 현재 지도에 등록된 장소에서 판매되지 않습니다.",
  "This apothecary cannot Soar.": "이 약제사는 활공할 수 없습니다.",
  "This once-per-Journey Service has already been used.": "여정당 한 번인 이 서비스는 이미 사용했습니다.",
  "Timer hours must be a non-negative integer.": "타이머 시간은 0 이상의 정수여야 합니다.",
  "Titan Reagents cannot be Bartered for.": "티탄 영약재는 물물교환으로 얻을 수 없습니다.",
  "Tool instance identity already exists.": "같은 식별 정보를 가진 도구가 이미 있습니다.",
  "Transaction was already applied.": "이미 적용한 작업입니다.",
  "Travel requires a transaction ID.": "이동 처리 정보가 없습니다.",
  "Treat the Barrow Patient before resolving Building Trust as a success.": "Building Trust를 성공으로 판정하기 전에 고분 환자를 치료하세요.",
  "Treatment requires a transaction ID.": "치료 처리 정보가 없습니다.",
  "PURIFY requires the last gathered Reagent to have been gathered in a Mountain Location.": "PURIFY는 마지막으로 모은 영약재가 산맥 장소에서 왔을 때만 사용할 수 있습니다.",
  "Uneasy Sleep success must move exactly 1 Path away.": "Uneasy Sleep 성공 시 정확히 경로 1개만큼 이동해야 합니다.",
  "Unknown Guild Service.": "알 수 없는 길드 서비스입니다.",
  "Unknown Guild delivery.": "알 수 없는 길드 배달입니다.",
  "Unknown canonical Companion.": "알 수 없는 룰북 길동무입니다.",
  "Unknown canonical Tool.": "알 수 없는 룰북 도구입니다.",
  "Unknown target Reagent.": "알 수 없는 대상 영약재입니다.",
  "Unvisited Titan Ruins and Behemoth Barrows cannot be Soar destinations.": "방문하지 않은 티탄 유적과 거수 고분은 활공 목적지가 될 수 없습니다.",
  "Wagon action failed.": "마차 행동에 실패했습니다.",
  "Wagon commissioning and expansion require the one Downtime activity after a Journey.": "마차 제작과 확장은 여정 뒤 한 번의 휴식기 활동으로만 할 수 있습니다.",
  "You cannot Soar while over encumbered.": "소지 한도를 초과한 상태에서는 활공할 수 없습니다.",
  "You cannot normally end a Move in a Loch or River Location.": "일반적으로 호수 또는 강 장소에서 이동을 끝낼 수 없습니다.",
  "Ailment card did not resolve.": "질병 카드 판정을 완료하지 못했습니다.",
  "A Remedy was traded at this Settlement; one Passenger may now board.": "이 정착지에서 치료제를 거래해 동승자 한 명을 태울 수 있습니다.",
  "Clinic Garden harvest": "약제소 정원 수확",
  "Clinic Garden planted": "약제소 정원 심기",
  "Both Explore Locations must be close to where the last Journey ended.": "주변 탐색의 두 장소는 마지막 여정이 끝난 곳과 가까워야 합니다.",
  "Changing Travel Style requires its canonical Move and Carry values.": "이동 방식을 바꾸려면 룰북에 적힌 이동 속도와 소지 한도를 적용해야 합니다.",
  "Choose an active Clinic and one canonical Plant Reagent from Inventory.": "진행 중인 약제소 하나와 가방의 룰북 식물 영약재 하나를 선택하세요.",
  "Clinic Gardens cannot be harvested in Winter without Greenhouses.": "온실이 없으면 겨울에 약제소 정원을 수확할 수 없습니다.",
  "Clinic Location is invalid or already occupied.": "약제소 위치가 올바르지 않거나 이미 다른 약제소가 있습니다.",
  "Clinic commissioning requires one canonical Agenda.": "약제소 건설에는 룰북 운영 계획 하나가 필요합니다.",
  "Clinic requires a name.": "약제소 이름이 필요합니다.",
  "Clinic requires four completed Seasons, a successful Wild Ailment, and 15 Trinkets.": "약제소를 세우려면 계절 4회를 마치고 야생에서 질병 치료에 성공했으며 장신구 15개를 보유해야 합니다.",
  "Clinic transaction is missing or already applied.": "약제소 처리 기록이 없거나 이미 적용되었습니다.",
  "Comb breakage requires a card.": "참빗 파손 판정에는 카드가 필요합니다.",
  "Commission the Wagon first.": "먼저 마차를 제작하세요.",
  "Commissioning a Wagon requires a City, 20 Trinkets, and no existing Wagon.": "마차 제작에는 도시와 장신구 20개가 필요하며 이미 보유한 마차가 없어야 합니다.",
  "Consumed one Insect-only Foraging draw earned after ten Paths.": "경로 10개를 이동해 얻은 곤충 전용 채집 카드 1회를 사용했습니다.",
  "Discarded one Bolts Tool and ignored negative Beast or Behemoth outcomes.": "석궁 볼트 하나를 버리고 야수 또는 거수의 부정적인 결과를 무시했습니다.",
  "Destination cards require a Suit.": "목적지 카드에는 카드 무늬가 필요합니다.",
  "Donation requires the Goodwill Stand Agenda.": "기부에는 친선 매대 운영 계획이 필요합니다.",
  "Exactly one unapplied Downtime activity after a Journey is required.": "여정을 마친 뒤 아직 적용하지 않은 휴식기 활동 하나가 필요합니다.",
  "Expansion is already installed.": "이 마차 확장은 이미 설치되어 있습니다.",
  "Expansion is not available here.": "이곳에서는 해당 마차 확장을 설치할 수 없습니다.",
  "Explore requires two distinct, nearby, unconnected Locations.": "주변 탐색에는 서로 가깝고 아직 연결되지 않은 서로 다른 장소 두 곳이 필요합니다.",
  "Explore requires the player to confirm both Locations are close to where the last Journey ended.": "주변 탐색을 시작하려면 두 장소가 마지막 여정을 마친 곳 가까이에 있는지 플레이어가 확인해야 합니다.",
  "Garden harvest requires a Preparation from the planted Plant.": "정원 수확에는 심어 둔 식물의 조제 부위가 필요합니다.",
  "General Practice cannot choose an Ailment above the current Reputation tier.": "일반 진료에서는 현재 길드 명성 단계보다 높은 질병을 선택할 수 없습니다.",
  "General Practice must change one Ailment Tag.": "일반 진료에서는 질병 태그 하나를 바꿔야 합니다.",
  "General Practice requires a Remedy Tag.": "일반 진료에는 치료 태그가 필요합니다.",
  "General Practice requires a canonical Ailment.": "일반 진료에는 룰북 질병 하나가 필요합니다.",
  "Goodwill Stand donation": "친선 매대 기부",
  "Guild Mailbox call": "길드 우편함 요청",
  "Harvesting requires the Gardens Agenda.": "수확에는 정원 운영 계획이 필요합니다.",
  "Invalid Monarch rule configuration.": "Monarch 규칙 설정이 올바르지 않습니다.",
  "Invent the stand-in Reagent, add it to the Almanack, and Journal about it after it is actually acquired.": "대체 영약재를 만들고 약초 도감에 추가한 뒤 실제로 획득했을 때 일지에 기록하세요.",
  "Journal about how the stronger substitute soothes the current Ailment.": "더 강한 대체재가 현재 질병을 어떻게 달래는지 일지에 기록하세요.",
  "Ledgers and Maps require their acquired Region.": "장부와 지도에는 획득한 지역 정보가 필요합니다.",
  "Mailbox calls must be recorded from the external Guild mailbox.": "우편함 요청은 외부 길드 우편함에서 받은 내용으로 기록해야 합니다.",
  "Override reason is required.": "예외 처리 사유가 필요합니다.",
  "Pantry Hibernation requires Winter and an active Pantry Agenda.": "식료품 저장고 동면에는 겨울과 진행 중인 저장고 운영 계획이 필요합니다.",
  "Pantry Hibernation": "식료품 저장고 동면",
  "Planting requires the Gardens Agenda.": "심기에는 정원 운영 계획이 필요합니다.",
  "Reconnect Guild note has the wrong printed Weight.": "길드와 재연결해 얻은 기록의 룰북 무게가 올바르지 않습니다.",
  "Reconnect Guild note kind is invalid.": "길드와 재연결해 얻은 기록의 종류가 올바르지 않습니다.",
  "Reconnect destination is not a nearest canonical City.": "재연결 목적지가 가장 가까운 룰북 도시가 아닙니다.",
  "Reconnect requires one canonical Guild note item.": "길드와 재연결하려면 룰북에 등록된 길드 기록 하나가 필요합니다.",
  "Reconnect requires the nearest canonical City.": "길드와 재연결하려면 가장 가까운 룰북 도시로 가야 합니다.",
  "Replenish Inventory item IDs must be unique.": "재고 보충으로 추가할 가방 물품은 서로 다른 기록이어야 합니다.",
  "Replenish requires at least one canonical Reagent Part.": "재고 보충에는 룰북 영약재 부위가 하나 이상 필요합니다.",
  "Replenish requires canonical Reagent Preparations.": "재고 보충에는 룰북 영약재 조제 부위가 필요합니다.",
  "Replenish requires the canonical Region where the last Journey ended.": "재고 보충에는 마지막 여정이 끝난 룰북 지역 정보가 필요합니다.",
  "Replenish selections exceed Inventory capacity.": "선택한 재고 보충량이 가방의 소지 한도를 넘습니다.",
  "Resolve or leave every active Patient and Timer.": "진행 중인 모든 환자와 타이머를 해결하거나 환자를 떠나보내세요.",
  "Resolve the pending Barter.": "대기 중인 물물교환을 먼저 판정하세요.",
  "Resolve the pending Encounter.": "대기 중인 조우를 먼저 판정하세요.",
  "Resolve the pending Foraging action.": "대기 중인 채집 판정을 먼저 마치세요.",
  "Resolve the pending manual effect.": "대기 중인 직접 판정을 먼저 마치세요.",
  "Rumour cards require canonical suits.": "소문 카드에는 룰북 카드 무늬가 필요합니다.",
  "Rumour requires Reputation 15+, a City Journey ending, and an unused Downtime activity.": "소문을 들으려면 길드 명성 15 이상으로 도시에서 여정을 마치고 아직 휴식기 활동을 사용하지 않아야 합니다.",
  "Rumour requires Reputation 15+, a City Journey ending, and active Downtime.": "소문을 들으려면 길드 명성 15 이상으로 도시에서 여정을 마치고 현재 휴식기여야 합니다.",
  "Social encounters require a card suit.": "교류 조우에는 카드 무늬가 필요합니다.",
  "Sodden Logs are available in Spring, Summer, and Autumn.": "물에 젖은 통나무는 봄, 여름, 가을에 사용할 수 있습니다.",
  "Sodden Logs may be used once per Ailment.": "물에 젖은 통나무는 질병 하나마다 한 번만 사용할 수 있습니다.",
  "Sodden Logs require a canonical Insect Preparation.": "물에 젖은 통나무에는 룰북 곤충 조제 부위가 필요합니다.",
  "Sodden Logs require a canonical Insect Reagent.": "물에 젖은 통나무에는 룰북 곤충 영약재가 필요합니다.",
  "Sodden Logs require an active Ailment.": "물에 젖은 통나무를 사용하려면 진행 중인 질병이 필요합니다.",
  "Sodden Logs habitat": "물에 젖은 통나무 서식지",
  "Sodden Logs harvest": "물에 젖은 통나무 수확",
  "Tent breakage requires a card.": "천막 파손 판정에는 카드가 필요합니다.",
  "The Blanket miraculously prevented the Journey from ending prematurely.": "담요가 기적처럼 여정이 일찍 끝나는 것을 막았습니다.",
  "The commissioned Wagon already includes its Base Unit.": "제작된 마차에는 이미 기본 차체가 포함되어 있습니다.",
  "The donated Item is not in Inventory.": "기부할 물품이 가방에 없습니다.",
  "Unknown Downtime activity.": "알 수 없는 휴식기 활동입니다.",
  "The selected original Tag is not part of this Ailment.": "선택한 원래 태그가 이 질병에 포함되어 있지 않습니다.",
  "The same Remedy ingredient cannot be selected more than once.": "같은 치료제 재료를 두 번 선택할 수 없습니다.",
  "This Clinic Garden is unavailable for the selected Ailment.": "이 약제소 정원은 선택한 질병에 사용할 수 없습니다.",
  "Tool effects require a transaction ID.": "도구 효과 처리 정보가 없습니다.",
  "Tool transaction is invalid or already applied.": "도구 처리 기록이 올바르지 않거나 이미 적용되었습니다.",
  "Unknown Wagon Expansion.": "알 수 없는 마차 확장입니다.",
  "Upgrade can only replace its canonical Basic Tool.": "개조는 대응하는 룰북 기본 도구만 교체할 수 있습니다.",
  "You have not arrived at the canonical Destination.": "아직 지정한 목적지에 도착하지 않았습니다.",
  "Ailment consequences": "질병 결과",
  "All Ailments were resolved before Moving On.": "모든 질병을 해결한 뒤 다음 길로 떠났습니다.",
  "Barter abandoned": "물물교환 포기",
  "Bid farewell and continued the Journey.": "작별을 고하고 여정을 계속했습니다.",
  "Canonical Downtime transaction applied.": "룰북 휴식기 활동을 적용했습니다.",
  "Clay Pots harvest": "이식용 진흙 화분 수확",
  "Clay Pots ready": "이식용 진흙 화분 수확 준비",
  "Clinic Commissioned": "약제소 건설 시작",
  "Collapsed Entrance: Bedchambers": "무너진 입구: 침실 도달",
  "Collapsed Entrance: Bid Farewell": "무너진 입구: 작별",
  "Companion recalled": "길동무 다시 부르기",
  "Companion released": "길동무 방생",
  "Companion stored": "길동무 맡기기",
  "Crossbow protection": "석궁 보호",
  "Expired unused News From The Trail choices at the Journey destination.": "목적지에 도착해 사용하지 않은 길 위의 소식 선택권이 만료되었습니다.",
  "Fled the Barrow": "고분에서 후퇴",
  "Granite Mortar POUND": "화강암 절구로 빻기",
  "Guild Service Move": "길드 서비스 이동",
  "Guild Services ready for Journey": "여정용 길드 서비스 준비",
  "Guild Services ready for 여정": "여정용 길드 서비스 준비",
  "Honeybee milestone": "꿀벌 이동 이정표",
  "Journey Guild Services closed": "여정 길드 서비스 종료",
  "Journey started": "여정 시작",
  "여정 started": "여정 시작",
  "Knitted Blanket discarded": "뜨개 담요 사용",
  "Make Do Acquired": "Make Do 대용품 획득",
  "News From The Trail used": "길 위의 소식 사용",
  "Passenger available": "동승자 도움 사용 가능",
  "Passenger boarded": "동승자 탑승",
  "Passenger delivered": "동승자 도착",
  "Pawning": "담보 판매",
  "Preparing to Leave": "떠날 준비",
  "Replacement Acquired": "Replacement 재료 획득",
  "Reset once-per-Journey Service use while preserving purchased Move and Settlement effects.": "여정당 1회인 서비스 사용 기록을 초기화하고, 구입한 이동 및 정착지 효과는 유지했습니다.",
  "Scrounging": "여분 채집",
  "Selected one of two Travel Encounter cards before reaching the Journey destination.": "목적지에 도착하기 전 이동 조우 카드 두 장 중 하나를 선택했습니다.",
  "Send a Missive used": "전령 보내기 사용",
  "Shadow Canvas show": "그림자 캔버스 공연",
  "The offer was declined; every active Ailment Timer decreased by 1.": "제안을 거절해 진행 중인 모든 질병 타이머가 1 줄었습니다.",
  "Tool repaired": "도구 수리",
  "Wasp forage pending": "말벌 채집 대기",
  "Wasp Foraging draw": "말벌 채집 카드",
  "implemented": "구현됨"
};

const localizeSeasonName = (season: string) => ({
  Spring: '봄', Summer: '여름', Autumn: '가을', Winter: '겨울'
} as Record<string, string>)[season] || season;

const localizeSeasonDestination = (season: string) => ({
  Spring: '봄으로', Summer: '여름으로', Autumn: '가을로', Winter: '겨울로'
} as Record<string, string>)[season] || `${season}(으)로`;

const localizeDowntimeActivity = (activity: string) => ({
  rumour: '소문 듣기',
  'general-practice': '일반 진료',
  replenish: '재고 보충',
  explore: '숲 탐험하기',
  'self-improvement': '자기 계발',
  reconnect: '동료들과 재회하기',
  'relax-tool': '친구들과 휴식하기 · 도구 선물',
  'relax-familiar': '친구들과 휴식하기 · 길동무 교체',
  'lend-a-paw': '도움의 손길',
  'commission-clinic': '약제소 건설',
  'commission-wagon': '마차 제작',
  'upgrade-wagon': '마차 개조'
} as Record<string, string>)[activity] || activity;

const localizeToolList = (tools: string): string => tools
  .split(/,\s*/)
  .map(tool => localizeCanonicalToolName(tool.trim()))
  .join(', ');

const localizeEngineActivity = (value: string): string => ({
  Barter: '물물교환',
  barter: '물물교환',
  Clinic: '약제소',
  Encounter: '조우',
  Forage: '채집',
  forage: '채집',
  Foraging: '채집',
  Forecast: '날씨 예보',
  Journey: '여정',
  Scrounging: '여분 채집',
  Treatment: '치료',
  Travel: '이동'
} as Record<string, string>)[value] || value;

const localizeAilmentSeverity = (value: string): string => ({
  Lesser: '가벼운',
  Intermediate: '중간',
  Major: '중증'
} as Record<string, string>)[value] || value;

const dynamicEngineMessages: Array<[RegExp, (...matches: string[]) => string]> = [
  [/^Unknown Season: (.+)$/, season => `알 수 없는 계절입니다: ${season}`],
  [/^Unknown season: (.+)$/, season => `알 수 없는 계절입니다: ${season}`],
  [/^Unknown ailment: (.+)$/, ailment => `알 수 없는 질병입니다: ${ailment}`],
  [/^Unknown encounter choice: (.+)$/, choice => `알 수 없는 조우 선택지입니다: ${choice}`],
  [/^Move must use Speed (.+); route costs (.+)\.$/, (speed, cost) => `이 이동의 속도는 ${speed}이어야 하며 경로 비용은 ${cost}입니다.`],
  [/^Route exceeds Speed (.+)\.$/, speed => `경로가 속도 ${speed}을 초과합니다.`],
  [/^Payment must exactly cover the (.+)-point gap\.$/, gap => `지불액은 부족한 ${gap}점을 정확히 채워야 합니다.`],
  [/^Missing Tool for (.+): (.+)$/, (part, tools) => `${part}에 필요한 도구가 없습니다: ${localizeToolList(tools)}`],
  [/^Card (.+) is below Rarity (.+)\. Foraging failed and gained 1 Foraging Point\.$/, (card, rarity) => `카드 ${card}가 희귀도 ${rarity}보다 낮습니다. 채집에 실패하고 채집 포인트 1을 얻었습니다.`],
  [/^(.+) costs (.+) Trinkets\.$/, (service, cost) => `${service} 비용은 장신구 ${cost}개입니다.`],
  [/^Every active Timer must have at least (.+) remaining\.$/, cost => `진행 중인 모든 타이머가 ${cost}시간 이상 남아 있어야 합니다.`],
  [/^This acquisition is waiting for a successful (.+) transaction\.$/, source => `이 획득은 ${localizeEngineActivity(source)} 성공 처리를 기다리고 있습니다.`],
  [/^Commissioning or expanding a Wagon requires a City and (.+) Trinkets\.$/, cost => `마차 제작 또는 확장에는 도시와 장신구 ${cost}개가 필요합니다.`],
  [/^CATALYSE (.+) requires two different selected Reagents with that Tag\.$/, tag => `CATALYSE ${tag}에는 해당 태그를 지닌 서로 다른 영약재 두 개가 필요합니다.`],
  [/^Required Tool is not selected: (.+)$/, tools => `필요한 도구가 선택되지 않았습니다: ${localizeToolList(tools)}`],
  [/^Selected Reagent has no remaining Uses: (.+)$/, reagent => `선택한 영약재에 남은 사용 횟수가 없습니다: ${reagent}`],
  [/^One of: (.+)$/, options => `다음 중 하나 필요: ${options.split(/\s+OR\s+/).map(option => {
    const match = option.match(/^([A-Z]+) (.+) \(provided (.+)\)$/);
    return match ? `${match[1]} ${match[2]} 필요 · 현재 ${match[3]}` : option;
  }).join(' 또는 ')}`],
  [/^([A-Z]+) (.+) \(provided (.+)\)$/, (tag, required, provided) => `${tag} ${required} 필요 · 현재 ${provided}`],
  [/^(.+) requires (.+) Timer hours, and no Timer may already be 0\.$/, (project, hours) => `${project}에는 타이머 ${hours}시간이 필요하며 이미 0인 타이머가 없어야 합니다.`]
  ,[/^Barter: (.+)$/, reagent => `물물교환: ${reagent}`]
  ,[/^BR (.+); paid (.+) Trinkets and (.+) Reputation\.$/, (br, trinkets, reputation) => `기본 희귀도 ${br}; 장신구 ${trinkets}개와 길드 명성 ${reputation}점을 지불했습니다.`]
  ,[/^(.+) unresolved Ailments faced their Consequences\.$/, count => `해결되지 않은 질병 ${count}개의 결과를 적용했습니다.`]
  ,[/^(.+) was diagnosed with (.+)\.$/, (patient, ailment) => `${patient}에게 ${ailment} 진단을 내렸습니다.`]
  ,[/^(.+): (Challenge|Failed|Attempt|Diagnosis)$/, (name, step) => `${name}: ${{ Challenge: '도전', Failed: '실패', Attempt: '시도', Diagnosis: '진단' }[step] || step}`]
  ,[/^Foraging attempt recorded; Timer is now (.+)\.$/, timer => `채집 시도를 기록했습니다. 현재 타이머는 ${timer}입니다.`]
  ,[/^Reached 50 FP after (.+) draws and completed the Delve\.$/, draws => `카드 ${draws}장을 뽑아 채집 포인트 50에 도달하고 고분 탐사를 마쳤습니다.`]
  ,[/^(.+) will be completed at the start of (Spring|Summer|Autumn|Winter)\.$/, (clinic, season) => `${clinic}은(는) ${localizeSeasonName(season)} 시작에 완공됩니다.`]
  ,[/^(.+) completed$/, service => `${localizeEngineActivity(service)} 완료`]
  ,[/^(.+) consumed$/, service => `${localizeEngineActivity(service)} 사용`]
  ,[/^Selected the Ailment at (.+)\.$/, location => `${location}의 질병을 선택했습니다.`]
  ,[/^Downtime: (.+)$/, activity => `휴식기 활동: ${localizeDowntimeActivity(activity)}`]
  ,[/^Journey (success|partial|failure|abandoned)$/, outcome => `여정 ${{ success: '성공', partial: '부분 성공', failure: '실패', abandoned: '포기' }[outcome] || outcome}`]
  ,[/^(Spring|Summer|Autumn|Winter) to (Spring|Summer|Autumn|Winter)$/, (from, to) => `${localizeSeasonName(from)}에서 ${localizeSeasonDestination(to)}`]
  ,[/^(.+) acquired through (forage|barter); BR (.+), Weight (.+), target (.+), source REMEDY-003\.$/, (item, source, br, weight, target) => `${item}을(를) ${source === 'forage' ? '채집' : '물물교환'}으로 획득했습니다. 기본 희귀도 ${br}, 무게 ${weight}, 목표 태그 ${target}, 적용 규칙 REMEDY-003.`]
  ,[/^Discarded (.+) Weight and gained (.+) Trinkets\.$/, (weight, trinkets) => `무게 ${weight}만큼 버리고 장신구 ${trinkets}개를 얻었습니다.`]
  ,[/^Remedy: (.+)$/, ailment => `치료제: ${ailment}`]
  ,[/^Tool acquired: (.+)$/, tool => `도구 획득: ${localizeCanonicalToolName(tool)}`]
  ,[/^Tool upgraded: (.+)$/, tool => `도구 개조: ${localizeCanonicalToolName(tool)}`]
  ,[/^(.+) was repaired for 2 Trinkets\.$/, tool => `${localizeCanonicalToolName(tool)}을(를) 장신구 2개로 수리했습니다.`]
  ,[/^Companion trigger: (.+)$/, companion => `길동무 효과: ${companion}`]
  ,[/^Companion adopted: (.+)$/, companion => `길동무 영입: ${companion}`]
  ,[/^Paid (.+) Trinkets\.$/, cost => `장신구 ${cost}개를 지불했습니다.`]
  ,[/^(.+) returned to the wild\.$/, companion => `${companion}을(를) 자연으로 돌려보냈습니다.`]
  ,[/^(.+) is travelling to (.+)\.$/, (passenger, destination) => `${passenger}이(가) ${destination}(으)로 함께 이동합니다.`]
  ,[/^(.+) was harvested after two Moves\.$/, reagent => `두 번 이동한 뒤 ${reagent}을(를) 수확했습니다.`]
  ,[/^The planted Reagent is ready and remains available until gathered\.$/, () => '심은 영약재를 수확할 준비가 되었으며, 거둘 때까지 그대로 남습니다.']
  ,[/^Gained 1 Reputation on arriving in a Settlement\.$/, () => '정착지에 도착해 길드 명성 1점을 얻었습니다.']
  ,[/^(?:(.+) completed\. )?Forecast protection remaining: (.+)\.$/, (service, remaining) => `${service ? `${localizeEngineActivity(service)} 완료. ` : ''}날씨 예보 보호 남은 횟수: ${remaining}.`]
  ,[/^(.+) does not support the (.+) trigger\.$/, (owner, trigger) => `${owner}은(는) ${trigger} 시점을 지원하지 않습니다.`]
  ,[/^(.+) has no manual resolution metadata for (.+)\.$/, (owner, trigger) => `${owner}의 ${trigger} 직접 판정 정보가 없습니다.`]
  ,[/^Unknown Reagent: (.+)$/, reagent => `알 수 없는 영약재입니다: ${reagent}`]
  ,[/^Preparation (.+) does not belong to (.+)\.$/, (preparation, reagent) => `${preparation} 조제 부위는 ${reagent}에 속하지 않습니다.`]
  ,[/^Unknown Barter location: (.+)$/, location => `알 수 없는 물물교환 장소입니다: ${location}`]
  ,[/^BR (.+); paid (.+) Trinkets and (.+) Reputation\. Juicy Gossip was discarded to automatically obtain the Reagent\.$/, (br, trinkets, reputation) => `기본 희귀도 ${br}; 장신구 ${trinkets}개와 길드 명성 ${reputation}점을 지불했습니다. Juicy Gossip을 버리고 영약재를 자동으로 획득했습니다.`]
  ,[/^(.+) requires its canonical preparation Tool\.$/, preparation => `${preparation} 조제에는 룰북에 지정된 도구가 필요합니다.`]
  ,[/^(.+) is not both local and in season\.$/, reagent => `${reagent}은(는) 이 지역에서 자라면서 제철인 영약재가 아닙니다.`]
  ,[/^Pantry Hibernation requires (.+) Trinkets for (.+) occupant\(s\)\.$/, (cost, occupants) => `식료품 저장고 동면에는 ${occupants}명 기준 장신구 ${cost}개가 필요합니다.`]
  ,[/^No Journey Goal for (.+)\.$/, card => `${card}에 해당하는 여정 목표가 없습니다.`]
  ,[/^(.+) to (.+)\. Reason: (.+)\. Goal: (.+)\.$/, (origin, destination, reason, goal) => `${origin}에서 ${destination}(으)로 떠났습니다. 이유: ${reason}. 목표: ${goal}.`]
  ,[/^(.+) in (.+); every active Timer decreased by (.+)\.$/, (action, region, cost) => `${region}에서 ${localizeEngineActivity(action)}을(를) 수행해 진행 중인 모든 타이머가 ${cost} 줄었습니다.`]
  ,[/^Missing save migration from schema version (.+)$/, version => `저장 형식 ${version}을 현재 형식으로 변환할 수 없습니다.`]
  ,[/^(.+) Trinkets spent\.(?: (Bark Coracle) recycled\.)?$/, (cost, coracle) => `장신구 ${cost}개를 사용했습니다.${coracle ? ` ${localizeCanonicalToolName(coracle)}을 재활용했습니다.` : ''}`]
  ,[/^Generated (.+) Hive Reagent after travelling ten Paths\.$/, count => `경로 10개를 이동해 벌집 영약재 ${count}개를 얻었습니다.`]
  ,[/^(.+) Insect Foraging draw\(s\) are ready\.$/, count => `곤충 채집 카드 ${count}회를 사용할 수 있습니다.`]
  ,[/^(.+) reached (.+); gained (.+) Trinkets\.$/, (passenger, destination, reward) => `${passenger}이(가) ${destination}에 도착해 장신구 ${reward}개를 얻었습니다.`]
  ,[/^(.+) was gathered without reducing a Timer; the planter now needs two Moves to regrow\.$/, reagent => `${reagent}을(를) 타이머 감소 없이 수확했습니다. 다시 자라려면 두 번 이동해야 합니다.`]
  ,[/^Monarch requires (.+) (.+) Ailment cards\.$/, (count, severity) => `Monarch에는 ${localizeAilmentSeverity(severity)} 질병 카드 ${count}장이 필요합니다.`]
  ,[/^Record the applicable printed result for (.+)\.$/, owner => `${owner}에 해당하는 룰북 결과를 기록하세요.`]
  ,[/^Clinic income (.+); Goodwill reputation (.+); completed Clinics (.+)\.$/, (income, reputation, clinics) => `약제소 수입 ${income}; 호의 명성 ${reputation}; 완공된 약제소 ${clinics}곳.`]
  ,[/^(.+); Trinkets spent: (.+)\.$/, (source, cost) => `${source}; 장신구 ${cost}개 사용.`]
  ,[/^(.+) retained its identity and was upgraded for 3 Trinkets\.$/, tool => `${localizeCanonicalToolName(tool)}의 식별 정보를 유지한 채 장신구 3개로 개조했습니다.`]
  ,[/^(.+) Plant Part\(s\) became weightless Powder or Tea\.$/, count => `식물 부위 ${count}개를 무게 없는 가루 또는 차로 만들었습니다.`]
  ,[/^Knitted (.+)$/, project => `${project} 뜨개질 완료`]
  ,[/^Reduced all eligible Timers by (.+) hours while Preparing to Leave\.$/, hours => `떠날 준비를 하며 해당하는 모든 타이머를 ${hours}시간 줄였습니다.`]
  ,[/^Skipped Winter with (.+) occupant\(s\); spent (.+) Trinkets\.$/, (occupants, cost) => `${occupants}명과 겨울을 건너뛰고 장신구 ${cost}개를 사용했습니다.`]
  ,[/^(.+) was planted at (.+)\.$/, (reagent, clinic) => `${clinic}에 ${reagent}을(를) 심었습니다.`]
  ,[/^(.+) was gathered once for (.+)\.$/, (item, ailment) => `${ailment} 치료를 위해 ${item}을(를) 한 번 수확했습니다.`]
  ,[/^(.+) was chosen for the Sodden Logs\.$/, reagent => `물에 젖은 통나무에 ${reagent}을(를) 지정했습니다.`]
  ,[/^(.+) was gathered; all active Ailment Timers were reduced by 1\.$/, item => `${item}을(를) 수확하고 진행 중인 모든 질병 타이머를 1 줄였습니다.`]
  ,[/^(.+) \((.+) Weight\) was donated\.$/, (item, weight) => `${item}을(를) 무게 ${weight}만큼 기부했습니다.`]
];

const restoreLegacyEngineTerminology = (line: string): string => line
  .replace(/길동무/g, 'Familiar')
  .replace(/물꼬 거래/g, 'Bartering')
  .replace(/희귀도/g, 'Rarity')
  .replace(/영약재/g, 'Reagent')
  .replace(/여정/g, 'Journey')
  .replace(/일정/g, 'Calendar')
  .replace(/길드 명성/g, 'Reputation')
  .replace(/채집 포인트/g, 'Foraging Points')
  .replace(/거수/g, 'Behemoth');

const localizeLine = (line: string): string => {
  const restored = restoreLegacyEngineTerminology(line);
  const exact = exactEngineMessages[line] || exactEngineMessages[restored];
  if (exact) return exact;
  for (const [pattern, format] of dynamicEngineMessages) {
    const match = line.match(pattern) || restored.match(pattern);
    if (match) return format(...match.slice(1));
  }
  return line;
};

export const localizeGameplayMessage = (message: string): string =>
  normalizeGuildReputationTerms(message.split('\n').map(localizeLine).join('\n'));

export const ENGINE_MESSAGE_TRANSLATION_COUNT = Object.keys(exactEngineMessages).length;
