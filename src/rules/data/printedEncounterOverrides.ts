import type { EncounterDefinition } from '../types';

const manual = (code: string, description: string): EncounterDefinition['mandatoryEffects'][number] => ({
  support: 'manual-only',
  effect: { type: 'customEffect', code, description }
});

export const PRINTED_ENCOUNTER_OVERRIDES: Record<string, Partial<EncounterDefinition>> = {
  'travel-bog-m-autumn': {
    title: 'On The Path',
    prompt: 'Thickblood mercenaries track a fugitive. Mind your business, help them, or hinder them.',
    mandatoryEffects: [],
    choices: [
      { id: 'mind-business', label: 'Mind Your Business', effects: [] },
      { id: 'help', label: 'Help: gain 1 Reputation', effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }] },
      { id: 'hinder', label: 'Hinder: lose 1 Reputation', effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: -1 } }] }
    ],
    support: 'implemented'
  },
  'foraging-bog-3': {
    choices: [
      { id: 'communal', label: 'Communal — 장신구 1개를 남기고, 이후 이 지역을 지날 때 경로 1개를 무료로 이동합니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } },
        { support: 'implemented', effect: { type: 'addCondition', conditionId: 'free-path:current' } }
      ] },
      { id: 'humble', label: 'Humble — 장신구를 남기지 않고 그대로 건넙니다.', effects: [] }
    ],
    support: 'implemented'
  },
  'foraging-forest-5': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'record-beaver-dam',
        label: '비버 댐 기록 — 현재 위치를 비버 댐으로 표시하고 지역을 호수로 바꿉니다. 겨울이 끝나면 댐이 무너져 다시 숲으로 돌아옵니다.',
        effects: [manual('BEAVER_DAM_CYCLE', '현재 위치를 비버 댐·호수 지역으로 기록하고, 겨울이 끝난 뒤 숲 지역으로 복원될 후속 변화를 함께 저장합니다.')]
      }
    ],
    support: 'manual-only'
  },
  'foraging-bog-m-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'instant-trial',
        label: '즉석 재판 — 자신과 사슴을 위해 카드를 한 장씩 뽑습니다. 석궁이나 무기마다 사슴 카드를 한 장 더 뽑아 가장 높은 카드를 비교합니다.',
        effects: [manual('DUCHY_OF_DEER_TRIAL', '자신과 사슴의 카드를 비교합니다. 자신이 더 높으면 이곳에서 채집하고, 사슴이 더 높으면 이번 채집을 포기한 뒤 이 지역에서 다시 이동하거나 채집할 수 없음을 기록합니다.')]
      }
    ],
    support: 'manual-only'
  },
  'foraging-forest-j-winter': {
    mandatoryEffects: [],
    choices: [
      { id: 'pass-by', label: '그냥 지나가기 — 문을 두드리지 않고 채집을 계속합니다.', effects: [] },
      {
        id: 'charity',
        label: '자선을 부탁하기 — 타이머를 1 줄이고 카드를 한 장 뽑습니다. ♥이면 원하는 숲 영약재 부위 하나를 얻습니다.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
          manual('WINTER_FEAST_CHARITY_DRAW', '뽑은 카드가 ♥이면 원하는 숲 영약재 부위 하나를 가방에 기록합니다.')
        ]
      },
      {
        id: 'sing',
        label: '노래 부르기 — 타이머를 1 줄이고 장신구 1개를 얻습니다.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
          { support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } }
        ]
      }
    ],
    support: 'manual-only'
  },
  'travel-bog-m-winter': {
    title: 'On The Path',
    prompt: 'Thickblood mercenaries track a fugitive. Mind your business, help them, or hinder them.',
    mandatoryEffects: [],
    choices: [
      { id: 'mind-business', label: 'Mind Your Business', effects: [] },
      { id: 'help', label: 'Help: gain 1 Reputation', effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }] },
      { id: 'hinder', label: 'Hinder: lose 1 Reputation', effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: -1 } }] }
    ],
    support: 'implemented'
  },
  'travel-forest-a-2': {
    title: 'In Bloom',
    prompt: 'Draw a card and collect a Forest Plant Reagent Part whose Base Value equals the card.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-forest-m-winter': {
    choices: [
      {
        id: 'roadside-tea',
        label: 'Roadside Tea — FAIR 또는 STOMACH 효과를 내는 영약재가 있을 때 차를 끓입니다. 달력에 1일을 표시하고 길드 명성 3을 얻습니다.',
        effects: [manual('ROADSIDE_TEA_REAGENT', 'FAIR 또는 STOMACH 효과를 내는 영약재를 확인하고 사용한 뒤 달력 +1일, 길드 명성 +3을 적용합니다.')]
      },
      {
        id: 'aid',
        label: 'Aid — 장신구 1개를 주고 길드 명성 1을 얻습니다.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } },
          { support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }
        ]
      },
      {
        id: 'cold-shoulder',
        label: 'Cold Shoulder — 카드를 뽑아 무늬별 결과를 적용합니다.',
        effects: [manual('HUNGER_PAINS_DRAW', '♥/♦는 그대로 여정을 계속합니다. ♣는 길드 명성 1을 잃고, ♠는 장신구 3개를 잃습니다.')]
      }
    ],
    support: 'manual-only'
  },
  // The legacy transcription omitted the printed Weight 1 from the Parcel.
  // Keep it in the runtime prompt so the bag transaction and player-facing
  // choice both use the rulebook value on p.86.
  'travel-meadow-7-8': {
    prompt: "Something falls out of a passing Noonmessenger’s satchel. Call out to the Messenger - Gain 1 Reputation. Deliver the Parcel - Add a 'Parcel' (Weight 1) to your Bags. Choose a Location 4 Paths away for its address. Gain 3 Trinkets if you go to that Location, delivering it. Keep the Parcel - Choose and Gain a Tool or Upgrade from the Almanac, and lose 1 Reputation."
  },
  'foraging-forest-m-spring': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'mark-barrow',
        label: '물러나기 — 현재 위치를 Towering Behemoth Barrow로 표시하고 이후 Scurry 규칙을 적용합니다.',
        effects: []
      },
      {
        id: 'appease',
        label: 'Appease — [FAIR 5]를 제공해 곰을 떠나보내고 이 고분을 제거합니다.',
        effects: [manual('APPEASE_BEAR', 'Provide Reagent Parts with cumulative FAIR 5, then remove this bear Barrow from the map.')]
      }
    ],
    support: 'manual-only'
  },
  'travel-meadow-a-2': {
    title: 'Obstruction',
    prompt: 'If travelling with a Wagon, Mark 1 Day; otherwise pass through without delay.',
    mandatoryEffects: [],
    choices: [
      { id: 'with-wagon', label: '마차를 타고 있음 — Mark 1 Day', effects: [{ support: 'implemented', effect: { type: 'markDays', amount: 1 } }] },
      { id: 'on-foot', label: '걸어 지나감 — 지연 없음', effects: [] }
    ],
    support: 'manual-only'
  },
  'travel-loch-j-summer': {
    choices: [
      {
        id: 'parley',
        label: 'Parley — 해적 환자를 돕습니다. 이 질환으로 얻을 명성은 장신구로 받고, 치료에 실패하면 포로가 됩니다.',
        effects: [manual('PIRATE_PATIENT', '현지 환자 대신 해적 환자를 생성하고, 명성 보상을 장신구로 바꾸며 실패 시 포로 결과를 적용합니다.')]
      },
      {
        id: 'ship-to-ship-combat',
        label: 'Ship-to-Ship Combat — Coracle 또는 개조 마차가 있을 때 자신(석궁 보유 시 2장)과 해적(2장)의 카드 합계를 겨룹니다.',
        effects: [manual('PIRATE_COMBAT', '카드 합계를 비교합니다. 승리하면 인접 지역으로 탈출하고, 패배하면 포로가 되어 여정과 이번 계절이 끝납니다.')]
      }
    ],
    support: 'manual-only'
  },
  'travel-meadow-9-10-autumn': {
    choices: [
      { id: 'find-shelter', label: 'Find Shelter — 비를 피하며 달력에 1일을 표시합니다.', effects: [{ support: 'implemented', effect: { type: 'markDays', amount: 1 } }] },
      { id: 'push-on', label: 'Push On — 수생 생물이 아니라면 TEMPERATURE 1 치료제를 만듭니다. 실패하면 달력에 3일을 표시합니다.', effects: [manual('DELUGE_PUSH_ON', '수생 여부와 치료 성공을 판정하고, 실패한 경우에만 달력 +3일을 적용합니다.')] }
    ],
    support: 'manual-only'
  },
  'travel-mountain-j-winter': {
    choices: [
      { id: 'sled', label: 'Sled — 인접한 비산악 지역으로 이동하고 달력에 1일을 표시합니다.', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
        manual('TOBOGGAN_MOVE', '인접한 비산악 지역으로 이동합니다.')
      ] },
      { id: 'long-walk', label: 'Long Walk — 인접한 비산악 지역으로 이동하고 달력에 1일을 표시한 뒤 길드 명성 1을 얻습니다.', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } },
        manual('TOBOGGAN_MOVE', '인접한 비산악 지역으로 이동합니다.')
      ] }
    ],
    support: 'manual-only'
  },
  'travel-mountain-m-summer': {
    choices: [
      { id: 'fetch-the-oil', label: 'Fetch The Oil — 장신구 1개를 얻고 달력에 1일을 표시합니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } },
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } }
      ] },
      { id: 'shrug', label: 'Shrug — 길드원을 두고 떠나 길드 명성 1을 잃습니다.', effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: -1 } }] }
    ],
    support: 'implemented'
  },
  'travel-mountain-9-10-winter': {
    title: 'Dastards Ahead',
    prompt: 'Warn the nearest Settlement before 2 Days pass to foil the bandits and gain 4 Reputation, or leave the future change unresolved.',
    mandatoryEffects: [manual('SETTLEMENT_WARNING_DEADLINE', 'Create a 2-Day map obligation tied to the nearest Settlement.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-soar-9-10-summer': {
    title: 'Talons',
    prompt: 'Draw a follow-up card while escaping a Sea Eagle and apply the printed suit result.',
    mandatoryEffects: [manual('TALONS_FOLLOW_UP', 'Draw and resolve the Talons suit outcome, including item Weight loss or an emergency Remedy.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-soar-9-10-autumn': {
    title: 'Talons',
    prompt: 'Draw a follow-up card while escaping a Sea Eagle and apply the printed suit result.',
    mandatoryEffects: [manual('TALONS_FOLLOW_UP', 'Draw and resolve the Talons suit outcome, including item Weight loss or an emergency Remedy.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-soar-9-10-winter': {
    title: 'Talons',
    prompt: 'Draw a follow-up card while escaping a Sea Eagle and apply the printed suit result.',
    mandatoryEffects: [manual('TALONS_FOLLOW_UP', 'Draw and resolve the Talons suit outcome, including item Weight loss or an emergency Remedy.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-soar-j-winter': {
    title: 'Glimpses Of Elsewhere',
    prompt: 'Reflect on who waits beyond the sunset, then end the Soar at the chosen Destination.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-soar-m-spring': {
    choices: [
      { id: 'spiral-intervene', label: '선회 착륙 · 개입하기 — 비행 경로 근처 지역에 착륙해 무작위 여행자의 조우를 대신 정상 해결합니다.', effects: [manual('HIGH_ABOVE_INTERVENE', '비행 경로 근처 지역을 고르고 이동한 뒤 그 지역의 여행 조우를 무작위 여행자 대신 해결합니다.')] },
      { id: 'spiral-mind-business', label: '선회 착륙 · 관여하지 않기 — 비행 경로 근처 지역에 착륙해 관여하지 않고 비행을 끝냅니다.', effects: [manual('HIGH_ABOVE_LAND', '비행 경로 근처 지역을 골라 그곳에서 비행을 끝냅니다.')] },
      { id: 'ignore-distraction', label: '주의를 돌리고 계속 비행 — 원래 목적지에서 비행을 끝냅니다.', effects: [manual('SOAR_END_DESTINATION', '원래 목적지에서 비행을 끝냅니다.')] }
    ],
    support: 'manual-only'
  },
  'travel-soar-m-summer': {
    choices: [
      { id: 'spiral-intervene', label: '선회 착륙 · 개입하기 — 비행 경로 근처 지역에 착륙해 무작위 여행자의 조우를 대신 정상 해결합니다.', effects: [manual('HIGH_ABOVE_INTERVENE', '비행 경로 근처 지역을 고르고 이동한 뒤 그 지역의 여행 조우를 무작위 여행자 대신 해결합니다.')] },
      { id: 'spiral-mind-business', label: '선회 착륙 · 관여하지 않기 — 비행 경로 근처 지역에 착륙해 관여하지 않고 비행을 끝냅니다.', effects: [manual('HIGH_ABOVE_LAND', '비행 경로 근처 지역을 골라 그곳에서 비행을 끝냅니다.')] },
      { id: 'ignore-distraction', label: '주의를 돌리고 계속 비행 — 원래 목적지에서 비행을 끝냅니다.', effects: [manual('SOAR_END_DESTINATION', '원래 목적지에서 비행을 끝냅니다.')] }
    ],
    support: 'manual-only'
  },
  'travel-soar-m-winter': {
    title: 'Hailstorm',
    prompt: 'End at the chosen Destination, become Soaked unless protected by a Waxed Satchel, and reduce the next Timer by 2.',
    mandatoryEffects: [
      manual('HAILSTORM_NEXT_TIMER', '다음에 시작하는 질환 타이머를 2 줄입니다.'),
      manual('HAILSTORM_SOAK', 'Waxed Satchel가 없으면 물에 젖는 시약과 물품을 버린다.')
    ],
    choices: [],
    support: 'manual-only'
  },
  'foraging-loch-j-winter': {
    title: 'A Gentle Moment',
    prompt: 'You and your Familiar watch the falling snow and share a quiet moment.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'foraging-loch-10-summer': {
    title: 'Summer Loch 10 · Printed Duplicate',
    prompt: '공식 룰북 p.169에는 여름 호수 10 결과가 두 개 인쇄되어 있습니다. 어느 행을 사용할지 플레이어가 선택합니다.',
    mandatoryEffects: [],
    choices: [
      { id: 'summertime-swim', label: '여름 물놀이 — 타이머를 1 줄이고 현지 야수를 만납니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
        manual('SUMMERTIME_SWIM_ANIMAL', '현지 야수와의 만남을 장면으로 해결합니다.')
      ] },
      { id: 'the-boat-that-rocks', label: '흔들리는 파티 배 — 다음 Move 전까지 이 지역에서 큰 물고기와 작은 물고기를 찾을 수 없습니다.', effects: [manual('STARTLED_FISH', '다음 Move 전까지 현재 지역의 Big Fish와 Small Fish 채집을 막습니다.')] }
    ],
    support: 'manual-only'
  },
  'foraging-loch-j-summer': {
    title: 'Summer Loch J · No Printed Row',
    prompt: '공식 룰북 p.169에는 여름 호수 J 행이 인쇄되어 있지 않습니다. 결과를 추측해 자동 적용하지 않습니다.',
    mandatoryEffects: [manual('MISSING_PRINTED_SUMMER_LOCH_J', '공식 표에 여름 호수 J 행이 없습니다. 테이블에서 사용할 판정을 직접 정합니다.')],
    choices: [],
    support: 'manual-only'
  },
  'foraging-loch-m-winter': {
    choices: [
      { id: 'trade', label: 'Trade — 영약재를 거래하되 거래 절차의 2단계를 건너뜁니다.', effects: [manual('LODGE_TRADE', '영약재 거래에서 2단계를 건너뜁니다.')] },
      { id: 'visit', label: 'Visit — 타이머를 1 줄이고, 다음 Move 전까지 이 위치에서 조우를 마칠 때마다 채집 포인트 2를 얻습니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
        manual('LODGE_VISIT_BONUS', '다음 Move 전까지 이 위치에서 조우를 마칠 때마다 채집 포인트 +2를 적용합니다.')
      ] },
      { id: 'help', label: 'Help — 타이머를 3 줄이고 장신구 1개를 얻습니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTimer', amount: -3, target: 'all' } },
        { support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } }
      ] }
    ],
    support: 'manual-only'
  },
  'foraging-meadow-m-summer': {
    choices: [
      { id: 'intervene-monarch', label: 'Intervene · Monarch — 카드를 뽑아 Monarch가 나왔습니다. 싸움을 막고 길드 명성 4를 얻습니다.', effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: 4 } }] },
      { id: 'intervene-remedy', label: 'Intervene · Not A Monarch · 즉시 치료 — 길드 명성 6을 얻고 WOUND 2 치료제를 즉시 만든 뒤 타이머를 2 줄입니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 6 } },
        { support: 'implemented', effect: { type: 'modifyTimer', amount: -2, target: 'all' } },
        manual('FIRE_AND_IRON_WOUND', '자신의 WOUND 2 치료제를 즉시 만들어 해결합니다.')
      ] },
      { id: 'intervene-stitcher', label: 'Intervene · Not A Monarch · Stitcher 치료 — 길드 명성 6을 얻고 WOUND 2를 입은 뒤 타이머를 8 줄입니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 6 } },
        { support: 'implemented', effect: { type: 'modifyTimer', amount: -8, target: 'all' } },
        manual('FIRE_AND_IRON_STITCHER', 'WOUND 2 부상을 기록하고 Stitcher에게 치료받습니다.')
      ] },
      { id: 'leave-them-be', label: 'Leave Them Be — 결투에 관여하지 않고 떠납니다.', effects: [] }
    ],
    support: 'manual-only'
  },
  'foraging-mountain-m-winter': {
    choices: [
      { id: 'just-in-time', label: 'Just In Time — 타이머가 끝나기 전에 치료제를 만들면 이후 곰 조우의 부정적 결과를 대체하는 규칙을 기록합니다.', effects: [manual('BEAR_LORDS_DEFERENCE', '치료 성공 여부를 확인하고 이후 곰 조우 대체 규칙을 기록합니다.')] },
      { id: 'too-late', label: 'Too Late — 타이머가 0이 되면 장례를 치르거나, 원한다면 고분에서 희귀도 합계 10 이하의 영약재를 가져갑니다.', effects: [manual('BEAR_LORDS_TOO_LATE', '장례 장면과 선택한 영약재를 직접 기록합니다.')] }
    ],
    support: 'manual-only'
  },
  'foraging-titan-6': {
    choices: [
      { id: 'light', label: 'Light — Titan Thingamabob을 장치에 넣고, 다음 Move 전까지 이 위치에서 조우를 마칠 때마다 채집 포인트 3을 얻습니다.', effects: [manual('TITAN_POWER_LIGHT', 'Titan Thingamabob을 장치에 넣고 위치 한정 채집 포인트 보너스를 기록합니다.')] },
      { id: 'cameras', label: 'Cameras — Titan Thingamabob을 장치에 넣고, 다음 Move 전까지 조우 카드 1장을 한 번 다시 뽑을 수 있습니다.', effects: [manual('TITAN_POWER_CAMERAS', 'Titan Thingamabob을 장치에 넣고 1회 재추첨 상태를 기록합니다.')] },
      { id: 'action', label: 'Action — Titan Thingamabob을 장치에 넣고 원하는 Titan 영약재 하나를 드러냅니다.', effects: [manual('TITAN_POWER_ACTION', 'Titan Thingamabob을 장치에 넣고 선택한 Titan 영약재를 획득합니다.')] }
    ],
    support: 'manual-only'
  },
  'social-bog-winter-♣': {
    mandatoryEffects: [],
    choices: [
      { id: 'wish-them-luck', label: 'Wish Them Luck — 행운을 빌고 지나갑니다.', effects: [] },
      { id: 'pitch-in-briefly', label: 'Pitch In — 잠시 도와 타이머를 1 줄이고 길드 명성 1을 얻습니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }
      ] },
      { id: 'pitch-in-for-the-day', label: '하루 동안 돕기 — 달력에 1일을 표시하고 길드 명성 3을 얻습니다.', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 3 } }
      ] }
    ],
    support: 'implemented'
  },
  'social-bog-settlement-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'time-capsule', label: '타임캡슐 — 이탄을 자르다 발견한 오래된 물건과 그것을 묻은 야수를 떠올립니다.', effects: [] },
      { id: 'guild-offering', label: '길드의 봉헌물 — 미래 세대를 위한 매장 풍습을 생각하고, 가방에서 함께 묻을 물건이 있는지 정합니다.', effects: [] }
    ],
    support: 'implemented'
  },
  'social-bog-noonhill-♥': {
    mandatoryEffects: [],
    choices: [
      { id: 'hivewarden', label: '벌집지기 — 거미실로 잠자리 떼를 이끄는 길드 야수가 어디로, 왜 가는지 떠올립니다.', effects: [] },
      { id: 'noonmessenger', label: '정오 전령 — 잠자리들이 끄는 작은 전령이 나르는 가장 중요한 소포를 떠올립니다.', effects: [] },
      { id: 'fleeing-thickblood', label: '도망치는 Thickblood — 말벌에게 쫓긴 용병이 어디로 피하는지 떠올립니다.', effects: [] }
    ],
    support: 'implemented'
  },
  'social-bog-noonhill-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'smell-the-flowers', label: '꽃향기 맡기 — 꽃집 오두막에 멈춰 살아 있는 듯한 정원의 향을 즐깁니다.', effects: [] },
      { id: 'keen-eye', label: '예리한 눈 — 들키지 않고 희귀도 6 이상의 식물 영약재 부위 하나를 얻습니다.', effects: [manual('FLORIST_KEEN_EYE', '희귀도 6 이상의 식물 영약재 부위 하나를 골라 가방에 넣습니다.')] },
      { id: 'connoisseur-of-scents', label: '향기 감정가 — Titan Musk Scrapings를 건네고, 가방 한도까지 원하는 희귀도의 식물 영약재 부위로 교환합니다.', effects: [manual('FLORIST_MUSK_TRADE', 'Titan Musk Scrapings를 제거하고 가방 한도 안에서 원하는 식물 영약재 부위를 고릅니다.')] }
    ],
    support: 'manual-only'
  },
  'social-forest-settlement-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'swinging', label: '흔들리는 다리 — 다리를 흔드는 어린 야수와 주변의 반응을 떠올립니다.', effects: [] },
      { id: 'new-paths', label: '새로운 길 — 폭풍에 끊어진 다리를 보며 이곳의 다리가 얼마나 자주 끊기고 주민들이 어떻게 받아들이는지 떠올립니다.', effects: [] }
    ],
    support: 'implemented'
  },
  'social-forest-odoak-♥': {
    mandatoryEffects: [],
    choices: [
      { id: 'a-quick-cure', label: '빠른 처치 — INFECTION, BURN, PAIN 영약재를 제공하고 효능 1마다 장신구 1개를 받습니다.', effects: [manual('OREBEATER_QUICK_CURE', '제공할 INFECTION, BURN, PAIN 영약재를 제거하고 효능 합계만큼 장신구를 받습니다.')] },
      { id: 'work-in-progress', label: '작업 중 — 복잡한 작업을 잠시 쉬는 광석장이와 어떤 소식을 나눌지 떠올립니다.', effects: [] }
    ],
    support: 'manual-only'
  },
  'social-loch-newdam-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'regrowth', label: '다시 심기 — 묘목 하나를 개간지까지 옮기려면 비버가 몇 마리 필요한지 떠올립니다.', effects: [] },
      { id: 'mother-o-fruits', label: '열매의 어머니 — 지금 열린 열매를 정하고, FAIR 2/3에 그대로 쓰거나 요리할 수 있는 Fruit 하나를 가방에 넣습니다.', effects: [manual('NEWDAM_FRUIT', 'Fruit 1개(무게 및 사용 정보는 인쇄 지시에 따름)를 가방에 기록합니다.')] }
    ],
    support: 'manual-only'
  },
  'social-meadow-settlement-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'weave-a-trinket', label: '만드는 중 · 장신구 엮기 — 장신구 1개를 기념물에 엮고 길드 명성 1을 얻습니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }
      ] },
      { id: 'leave-the-monument', label: '만드는 중 · 지켜보기 — 장신구를 엮지 않고 작업 중인 기념물을 바라봅니다.', effects: [] },
      { id: 'a-curious-marking', label: '수상한 표식 — 오래된 표식의 재료와 원래 용도를 떠올립니다.', effects: [] }
    ],
    support: 'implemented'
  },
  'social-meadow-summit-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'sorry', label: '미안해요! — 붐비는 길에서 발을 밟거나 밀친 뒤 서로 어떻게 반응하는지 떠올립니다.', effects: [] },
      { id: 'pocketpaws', label: '소매치기 — 열린 가방에서 무언가 사라졌습니다. 장신구 1개를 잃고, 도난이라고 생각하는지 떠올립니다.', effects: [{ support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } }] }
    ],
    support: 'implemented'
  },
  'social-mountain-settlement-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'ease-of-access', label: '딱 맞는 통로 — 자신의 몸과 이동 방식에 꼭 맞게 지은 공간에서 어떤 기분이 드는지 떠올립니다.', effects: [] },
      { id: 'unaccommodating-spaces', label: '지날 수 없는 공간 — 길을 막은 높이·너비·이동 방식의 문제와 그때의 감정을 떠올립니다.', effects: [] }
    ],
    support: 'implemented'
  },
  'social-mountain-spoolkeep-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'bleated-wisdom', label: '염소의 지혜 — 갓 털을 깎고 안마받는 거대한 염소가 어떤 조언을 건네는지 떠올립니다.', effects: [] },
      { id: 'woolworks', label: '양털 작업장 — 염소 털을 씻는 일을 돕고 Behemoth Bits 하나를 가방에 넣습니다.', effects: [manual('SPOOLKEEP_BEHEMOTH_BITS', 'Behemoth Bits 하나를 가방에 기록합니다.')] }
    ],
    support: 'manual-only'
  },
  'social-loch-vessel-♦': {
    mandatoryEffects: [],
    choices: [
      { id: 'lockdown', label: 'Lockdown — BREATH 영약재 부위 1개를 기부하고 길드 명성 1을 얻습니다.', effects: [manual('VESSEL_LOCKDOWN_DONATION', 'BREATH 영약재 부위 1개를 가방에서 제거하고 길드 명성 +1을 적용합니다.')] },
      { id: 'homecooked-meal', label: 'Homecooked Meal — 장신구 1개를 식사와 바꾸고 다음 Move의 속도를 두 배로 합니다.', effects: [
        { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } },
        { support: 'implemented', effect: { type: 'addCondition', conditionId: 'next-move-speed-double' } }
      ] },
      { id: 'wharf-rats', label: 'Wharf Rats — 부두 끝에서 놀이 중인 어린 쥐들과 규칙이 달라진 게임을 이야기합니다.', effects: [] }
    ],
    support: 'manual-only'
  }
};

export const applyPrintedEncounterOverride = (encounter: EncounterDefinition): EncounterDefinition => ({
  ...encounter,
  ...(PRINTED_ENCOUNTER_OVERRIDES[encounter.id] || {})
});
