import type { EncounterDefinition } from '../types';

const manual = (code: string, description: string): EncounterDefinition['mandatoryEffects'][number] => ({
  support: 'manual-only',
  effect: { type: 'customEffect', code, description }
});

const HELPED_EXILED_OR_BRANDED_BEAST = 'helped-exiled-or-branded-beast';
const TREMBLING_TECH_KNOWLEDGE = 'knowledge:trembling-titan-technology';

const RESEARCHER_VISIT_OVERRIDE: Partial<EncounterDefinition> = {
  mandatoryEffects: [],
  choices: [
    {
      id: 'resolve-bakar-visit',
      label: 'Meet Bakar — Apply Chat on the first meeting, Reunion when this repeats in a new Titan Location, or Discovery only after visiting every Titan Location and drawing this event again.',
      effects: [manual(
        'RESEARCHER_VISIT_STAGE',
        '바카르와의 실제 만남 이력을 확인합니다. 처음 만났다면 Chat을 적용해 티탄과 글을 읽는 법에 관해 대화합니다. 이 사건을 새로운 Titan Location에서 다시 만났다면 Reunion을 적용해 새로 알아낸 지식을 나눕니다. 모든 Titan Location을 방문한 뒤 이 사건을 다시 만났다면 Discovery를 적용해 바카르의 먼 여행과 티탄의 비밀에 관한 가설을 이야기합니다. 이 셋은 자유 선택지가 아니라 방문 이력에 따른 단계입니다.'
      )]
    }
  ],
  support: 'manual-only'
};

export const PRINTED_ENCOUNTER_OVERRIDES: Record<string, Partial<EncounterDefinition>> = {
  // A printed card result is not a second decision. Keep each draw and all of
  // its possible outcomes inside the action that caused it, so the encounter
  // UI never asks the player to choose the result they happened to draw.
  'travel-bog-5-6': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'draw-and-pass-the-branches',
        label: 'Draw and Pass the Branches — Draw one card. Below 5: mark 1 Day. 5-9: continue the Journey. 10 or more: gain an in-season Bog Reagent of your choice.',
        effects: [manual('BRANCH_BEATEN_DRAW', '카드 1장을 뽑습니다. 5 미만이면 달력에 1일을 표시합니다. 5-9이면 여정을 계속합니다. 10 이상이면 원하는 제철 늪지 영약재 하나를 얻습니다.')]
      }
    ],
    support: 'manual-only'
  },
  'travel-loch-j-spring': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'refuse',
        label: 'Refuse — The bird mocks you and splashes water at you. Mark or blur a few words on a Journal page.',
        effects: []
      },
      {
        id: 'race',
        label: 'Race — Draw two cards for the bird and one for yourself; the highest card wins. Win: gain 1 Trinket. Lose: gain 1 Reputation for being a good sport.',
        effects: [manual('NEED_FOR_SPEED_RACE', '물새를 위해 카드 2장, 자신을 위해 카드 1장을 뽑고 가장 높은 카드로 승패를 정합니다. 이기면 장신구 1개를, 지면 Guild Reputation 1을 얻습니다.')]
      }
    ],
    support: 'manual-only'
  },
  // p.85: Spill The Beans and Keep Quiet are the present decisions.
  // Vigilante is a possible future consequence of Keep Quiet, and its win/
  // lose paragraphs are outcomes of that future draw rather than choices now.
  'travel-loch-m-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'spill-the-beans',
        label: 'Spill The Beans — Tell the guards everything you know. Decide whether the beast is caught and what happens to them.',
        effects: []
      },
      {
        id: 'keep-quiet',
        label: 'Keep Quiet — Do not inform the guards. If a future Travel Encounter draws a Monarch, you meet this beast again and may decide whether to attempt an arrest. Resolve the printed Vigilante draw and its win or lose result then.',
        effects: [manual(
          'TWO_FACED_KEEP_QUIET',
          '이 야수와 경비병의 혐의를 기록해 둡니다. 이후 여정 조우에서 M을 뽑아 다시 마주치면, 유죄라고 판단할 경우 체포를 시도할 수 있습니다. 자신을 위해 카드 1장(석궁이나 무기가 있으면 2장), 상대를 위해 1장을 뽑습니다. 이기면 가장 가까운 도시를 목적지로 하는 새 목표를 시작하고, 데려가는 데 성공했을 때 Guild Reputation 10을 얻은 뒤 정의를 집행한 이유를 일지에 남깁니다. 지면 야수는 달아나 다시는 마주치지 않습니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.78: taking the Sketch is the present, optional action. The Craftpaws
  // and Knowers paragraphs describe two later uses of that same carried item,
  // not two more decisions to resolve during this encounter.
  'travel-forest-7-8': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'the-gift-of-knowledge',
        label: 'The Gift of Knowledge — Add a Sketch (Weight 1/3) to your Bags. Later, trade that one Sketch either to a Craftspaw in a City for any local Reagent, or to the Knowers at Journey end for 5 Trinkets or one Tool of your choice.',
        effects: [manual(
          'FROM_UP_HIGH_SKETCH',
          'Sketch(소묘, 무게 1/3)를 가방에 기록합니다. 이후 도시에서 Craftspaws 길드원에게 건네면 값과 관계없이 현지 Reagent 하나와 교환할 수 있습니다. 또는 여정 끝의 Downtime에 찾아오는 Knowers 길드의 까치에게 건네고 장신구 5개나 원하는 Tool 하나를 받습니다. 두 보상은 같은 Sketch를 소비하는 서로 다른 미래 사용처입니다.'
        )]
      },
      {
        id: 'leave-without-sketch',
        label: 'Leave Without a Sketch — Continue the Journey without recording the object.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  'travel-meadow-9-10-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'challenge-accepted',
        label: 'Challenge Accepted — Draw one card for yourself and three for the other beasts. If yours is the highest, gain a trophy that counts as a Trinket; otherwise you are knocked into the slushy snow.',
        effects: [manual('BEHEMOTH_OF_THE_BRANCH', '자신을 위해 카드 1장, 다른 야수들을 위해 카드 3장을 뽑습니다. 자신의 카드가 가장 높으면 장신구로 취급하는 트로피 1개를 얻습니다. 그렇지 않으면 통나무에서 떨어집니다.')]
      },
      {
        id: 'decline-the-game',
        label: 'Decline — Do not join the game and continue the Journey.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.91: the only immediate decision is whether to abandon the current
  // Journey and take the Quest. Fighting/Too Late are arrival-time branches
  // of the accepted Quest, so retain the entire procedure under that choice.
  'travel-mountain-j-spring': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'quest',
        label: 'Quest! — Abandon the current Journey and begin the printed 24-Path, Important (9 Days) Quest in a random direction. Resolve Fighting the Behemoth or Too Late at its destination, then apply the printed end-of-Journey rewards.',
        effects: [manual(
          'KNIGHTS_ROUND_TABLE_QUEST',
          '현재 여정을 포기하고 같은 계절에 무작위 방향으로 경로 24개 떨어진 목적지까지 중요함(9일) 원정을 시작합니다. 목적지에 거수 고분을 표시하고, 원정 중 만나는 질환은 이 원정대와 연결합니다. 기한 안에 도착하면 카드 1장을 뽑아 해결하지 못한 질환마다 최종 값을 2 낮춥니다. 최종 값이 7 이상이면 거수를 쓰러뜨리고, 7 미만이면 거수가 이깁니다. 늦으면 거수는 자취를 감추고 원정대는 떠납니다. 여정 끝에 성공적으로 해결한 질환마다 Guild Reputation 1을 얻고, 거수를 쓰러뜨렸다면 장신구 10개와 원하는 Tool 하나를 얻습니다.'
        )]
      },
      {
        id: 'decline-quest',
        label: 'Decline the Quest — Keep the current Journey and let the Questing Beasts continue without you.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.99: Fixer Upper begins one repair draw. M/J, 2-10, and Ace are
  // outcomes of that draw (and 2-10 may loop), never choices made up front.
  'travel-titan-m': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'fixer-upper',
        label: 'Fixer Upper — Mark 1 Day and draw a card. Resolve M/J, 2-10, or Ace; a 2-10 may start another one-Day repair draw.',
        effects: [
          { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
          manual(
            'ELECTRICIAN_REPAIR_LOOP',
            '첫 수리 시 달력의 1일은 이미 표시되었습니다. 카드를 뽑습니다. M 또는 J이면 상자와 유적에 빛과 음악이 돌아오며, 이번 계절이 끝난 뒤 이 유적이 정착지가 된다고 지도에 기록합니다. 2-10이면 장신구 1개를 받고, 원한다면 달력에 1일을 더 표시한 뒤 다시 뽑아 같은 결과표를 반복합니다. A이면 폭발 뒤 가까운 정착지에서 깨어나며, 다음 계절이 시작될 때까지 쉬고 여정을 끝냅니다.'
          )
        ]
      },
      {
        id: 'decline-repair',
        label: 'Decline the Repair — Leave the box and continue the Journey.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.154: Dig is optional; the number drawn determines the result. It is
  // not a second player choice after choosing to dig.
  'foraging-bog-2': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'dig',
        label: 'Dig! — Decrease all Timers by 1 and draw a card. 10 or more: gain one Titan Thingamabob. Below 10: the object sinks out of reach.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
          manual('ANCIENT_SALVAGE_DRAW', '카드 값이 10 이상이면 Titan Thingamabob(티탄 장치) 하나를 가방에 넣습니다. 10 미만이면 물건이 진흙 아래로 가라앉아 아무것도 얻지 못합니다.')
        ]
      },
      {
        id: 'leave-it-buried',
        label: 'Leave It Buried — Do not spend time digging and continue the Forage.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.159: falling into the freezing bog always costs time. Warm Up is the
  // instruction itself, not an optional branch.
  'foraging-bog-10-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'warm-up',
        label: 'Warm Up — Take a moment to heat up before trudging on. Decrease all Timers by 1.',
        effects: [{ support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } }]
      }
    ],
    support: 'implemented'
  },
  'foraging-bog-8': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'vigilante',
        label: 'Vigilante — Draw one card for yourself and one for the robber. Higher: chase them off and gain 3 Reputation. Lower: resolve Wounded, travel to the nearest Settlement, rest for the Season, abandon the Journey, and gain 3 Reputation.',
        effects: [manual('RIGHT_PLACE_VIGILANTE', '자신과 강도를 위해 카드 1장씩 뽑습니다. 자신의 카드가 더 높으면 강도를 쫓아내고 Guild Reputation 3을 얻습니다. 더 낮으면 부상 결과를 적용해 가장 가까운 정착지로 이동하고, 남은 계절 동안 쉬며 여정을 포기한 뒤 Guild Reputation 3을 얻습니다.')]
      },
      {
        id: 'archer',
        label: 'Archer — If you have a Crossbow and Bolt, chase off the robber and gain 3 Reputation.',
        effects: [manual('RIGHT_PLACE_ARCHER', '석궁과 볼트가 있는지 확인합니다. 둘 다 있다면 강도를 쫓아내고 Guild Reputation 3을 얻습니다.')]
      },
      {
        id: 'do-not-intervene',
        label: 'Do Not Intervene — Do not fend off the robber and continue the Forage.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  'foraging-bog-9-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'run',
        label: 'Run! — Draw one card for yourself and one for the midges. Higher: lose 1 Foraging Point. Lower: treat [HIDE 2] and [POISON 1]; if it is not soothed before the next Move On, lose 1 Reputation.',
        effects: [manual('THOUSAND_BITERS_RUN', '자신과 등에 떼를 위해 카드 1장씩 뽑습니다. 자신의 카드가 더 높으면 채집 포인트 1을 잃습니다. 더 낮으면 [HIDE 2]와 [POISON 1]을 치료해야 하며, 다음 이동 전까지 가려움을 달래지 못하면 Guild Reputation 1을 잃습니다.')]
      }
    ],
    support: 'manual-only'
  },
  'foraging-bog-10-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'run',
        label: 'Run! — Draw one card for yourself and one for the midges. Higher: lose 1 Foraging Point. Lower: lose 3 Foraging Points.',
        effects: [manual('MIDGES_AUTUMN_RUN', '자신과 등에 떼를 위해 카드 1장씩 뽑습니다. 자신의 카드가 더 높으면 채집 포인트 1을, 더 낮으면 채집 포인트 3을 잃습니다.')]
      }
    ],
    support: 'manual-only'
  },
  'foraging-loch-9-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'too-risky',
        label: 'Too Risky — Seek a safer opportunity and gain 1 Foraging Point.',
        effects: [{ support: 'implemented', effect: { type: 'modifyForagingPoints', amount: 1 } }]
      },
      {
        id: 'brave-the-ice',
        label: 'Brave the Ice — Draw one card. At or below Carry: immediately gather a Reagent you are seeking. Above Carry: fall through the ice and decrease all Timers by 2.',
        effects: [manual('THIN_ICE_DRAW', '카드 1장을 뽑습니다. 카드 값이 운반 한도 이하라면 찾던 영약재를 즉시 얻습니다. 운반 한도보다 높다면 얼음물에 빠져 모든 타이머를 2 줄입니다.')]
      }
    ],
    support: 'manual-only'
  },
  'foraging-mountain-8': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'play-it-safe',
        label: 'Play It Safe — Hand over your satchel: discard everything in your Bags and lose all Trinkets.',
        effects: [manual('STICK_EM_UP_SURRENDER', '가방의 모든 물품을 버리고 장신구를 전부 잃습니다.')]
      },
      {
        id: 'scrap',
        label: 'Scrap — Draw one card for yourself and two for the robber; a Crossbow and Bolt lets you draw one more. Win: take their Weapon. Lose: discard all Items and lose all Trinkets.',
        effects: [manual('STICK_EM_UP_SCRAP', '자신을 위해 카드 1장, 상대를 위해 카드 2장을 뽑습니다. 석궁과 볼트가 있다면 자신의 카드 1장을 더 뽑습니다. 가장 높은 단일 카드로 승패를 정합니다. 이기면 일반 야수에게만 쓸 수 있는 무기를 얻고, 지면 모든 물품과 장신구를 잃습니다.')]
      }
    ],
    support: 'manual-only'
  },
  // p.182: win and lose are results of Blood to Blood's opposed draw. Stay
  // Low is deterministic, while the fight remains manual because a loss asks
  // the player to choose which permanent stat to lower.
  'foraging-mountain-10-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'stay-low',
        label: 'Stay Low — Hide in dew-soaked shrubs; the wolf does not spot you. Decrease all Timers by 2.',
        effects: [{ support: 'implemented', effect: { type: 'modifyTimer', amount: -2, target: 'all' } }]
      },
      {
        id: 'blood-to-blood',
        label: 'Blood to Blood — Draw one card for yourself and two for the wolf, then compare each side\'s total. Draw one extra card for yourself for each Crossbow and/or Weapon carried. Win: drive the wolf away. Lose: escape with a scar and lower Speed or Carry by 1.',
        effects: [manual(
          'HOWL_BLOOD_TO_BLOOD',
          '자신을 위해 카드 1장, 늑대를 위해 카드 2장을 뽑아 양쪽 합계를 비교합니다. 석궁이나 무기가 있다면 하나마다 자신의 카드 1장을 더 뽑습니다. 이기면 늑대가 더 쉬운 먹잇감을 찾아 물러날 만큼 어떻게 상처 입혔는지 묘사합니다. 지면 고통스러운 부상과 흉터를 안고 탈출하며, Speed 또는 Carry 중 하나를 골라 1 낮춥니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.183: Harsh Wind starts a special three-step cold Timer automatically.
  // Warm Up is the consequence at zero, not an action offered immediately.
  'foraging-mountain-10-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'harsh-wind',
        label: 'Harsh Wind — Start a special Timer at 3. Decrease it after each Mountain Forage until it reaches 0 or you Move On; at 0, resolve Warm Up and decrease all patient Timers by 3.',
        effects: [manual(
          'CHILLED_TO_BONE_TIMER',
          '별도의 추위 타이머를 3으로 둡니다. 다음 Move On 전까지 산맥 위치에서 채집할 때마다 이 타이머를 1 줄입니다. 0이 되면 불을 피우고 땔감과 피난처를 찾느라 모든 환자 타이머를 3 줄입니다. 0이 되기 전에 Move On하면 이 추위 타이머를 끝냅니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.184: Look Around establishes an optional replacement for later J/M
  // forage draws. Opening the door and choosing its use only happen after a
  // Symbol has actually been found.
  'foraging-titan-2': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'look-around',
        label: 'Look Around — During this Forage, a later J or M may reveal a Symbol instead of a Reagent. Only after finding one may you open the door and choose the Codex or Clinic result.',
        effects: [manual(
          'PASSWORD_SYMBOL_HUNT',
          '이번 채집 중 이후 J 또는 M을 뽑으면 Reagent 대신 티탄 문양이 적힌 물건을 찾을 수 있습니다. 문양을 찾았다면 문을 열 수 있습니다. 유적을 묘사한 방식에 따라 Titan Codex(티탄 기록서, 무게 1)를 얻어 여정 끝에 Knowers 길드와 장신구 20개에 교환하거나, 이 위치에 Clinic을 세우고 자격이 없는 새 Service 하나도 Agenda에 더합니다. Knowers 길드는 직접 찾아갈 필요 없이 여정 끝에 찾아옵니다.'
        )]
      },
      {
        id: 'leave-it-locked',
        label: 'Leave It Locked — Do not hunt for a Symbol during this Forage.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.184: Rush is a compulsory repeating instruction through the next Move
  // On. Poisoned is the consequence of drawing a Spade, not a decision.
  'foraging-titan-3': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'rush',
        label: 'Rush — Through the next Move On, draw after every Encounter here. A Spade causes [POISON 2]; if untreated, lose all Foraging Points and cannot Forage here again before moving.',
        effects: [manual(
          'GAS_LEAK_RUSH',
          '이 사건을 포함해 다음 Move On 전까지 이 위치에서 조우를 마칠 때마다 카드 1장을 뽑습니다. ♠을 뽑으면 [POISON 2]를 치료해야 합니다. 치료하지 않으면 채집 포인트를 모두 잃고, 다음 Move On 전까지 이 위치에서 다시 채집할 수 없습니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  'foraging-titan-4': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'enter-the-chamber',
        label: 'Enter the Chamber — Draw one card. Hearts or Diamonds: enter. Clubs or Spades: flee unless a Titan Thingamabob silences the siren. If you enter, gain a Cranky Contraption Companion, Titan Thingamabob, or Titan Reagent of value 8 or lower.',
        effects: [manual('FINAL_RESTING_PLACE_ENTRY', '카드 1장을 뽑습니다. ♥ 또는 ♦이면 방에 들어갑니다. ♣ 또는 ♠이면 티탄 장치로 사이렌을 멈추지 않는 한 달아납니다. 방에 들어갔다면 성질 고약한 기계장치 길동무, 티탄 장치, 또는 값 8 이하의 티탄 영약재 중 하나를 얻습니다.')]
      },
      {
        id: 'leave-the-chamber',
        label: 'Leave the Chamber — Do not enter the newly revealed chamber and continue the Forage.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  'foraging-titan-5': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'flee-and-resolve',
        label: 'Flee — Draw one card for yourself and one for the Not-Cat. Higher: escape. Lower: draw another card and add it to your first. If your total is still lower, draw one more card and decrease all Timers by that value while trapped.',
        effects: [manual('NOT_CAT_FLEE', '자신과 ‘고양이 아닌 것’을 위해 카드 1장씩 뽑습니다. 자신의 카드가 더 높으면 탈출합니다. 더 낮으면 카드 1장을 더 뽑아 처음 값에 더합니다. 합계가 여전히 상대보다 낮다면 다시 카드 1장을 뽑고, 갇혀 지낸 시간만큼 모든 타이머를 그 카드 값만큼 줄입니다.')]
      }
    ],
    support: 'manual-only'
  },
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
  'travel-bog-3-4': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'trade-spare-material',
        label: 'Spare Material — 장신구 1개를 건네고 Common 또는 Rare Bog Reagent 하나를 고릅니다.',
        requirements: { minTrinkets: 1 },
        effects: [
          { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } },
          manual('SPARE_MATERIAL_REAGENT', 'Common 또는 Rare Bog Reagent 하나를 골라 가방에 넣습니다.')
        ]
      },
      {
        id: 'continue-without-trading',
        label: '교환하지 않고 계속 — 작품 이야기만 듣거나 인사한 뒤 여정을 계속합니다.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  'travel-bog-9-10-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'buy-boxes-of-treats',
        label: 'Delicious! — 장신구 1개당 Box of Treats 하나를 구입합니다. 각 상자는 무게 ⅔이고 FAIR 4로 쓸 수 있으며, 원하는 만큼 구입할 수 있습니다.',
        requirements: { minTrinkets: 1 },
        effects: [manual('PUMPKIN_CAFE_TREATS', '구입할 상자 수를 정합니다. 상자당 장신구 1개를 지불하고 Box of Treats(무게 ⅔, FAIR 4)를 같은 수만큼 가방에 넣습니다.')]
      },
      {
        id: 'leave-the-cafe',
        label: '구입하지 않고 계속 — 호박 카페를 뒤로하고 여정을 계속합니다.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  'foraging-bog-3': {
    choices: [
      { id: 'communal', label: 'Communal — 장신구 1개를 남기고, 이후 이 지역을 지날 때 경로 1개를 무료로 이동합니다.', requirements: { minTrinkets: 1 }, effects: [
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
  'foraging-bog-m-autumn': {
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
  'foraging-bog-m-winter': {
    title: 'Winged Menace',
    prompt: 'A massive heron swoops down at you, giving you just enough time to take cover. It laughs and taunts as it raises its wings to put you in shade. It seems like it might be a clawlicker or a bandit. What do they want?',
    mandatoryEffects: [],
    choices: [
      {
        id: 'bold',
        label: '용감하게 맞서기 — 자신은 카드 1장, 왜가리는 카드 2장을 뽑습니다. 자신이 고슴도치보다 크다면 카드 1장을 더 뽑습니다. 합계가 더 높으면 왜가리를 쫓아내고 길드 명성 1을 얻습니다. 합계가 더 낮으면 도망치기 전에 심하게 쪼입니다. 이 만남으로 어떤 흉터가 남았나요?',
        effects: [manual('WINGED_MENACE_BOLD', '카드 합계를 비교합니다. 자신이 더 높으면 길드 명성 1을 얻고, 왜가리가 더 높으면 도망치기 전에 쪼여 생긴 흉터를 기록합니다.')]
      },
      {
        id: 'bargain',
        label: '흥정하기 — 장신구 1개를 주고 왜가리를 돌려보냅니다. 어떤 눈에 띄는 표식이 있었나요? 신고할 건가요?',
        requirements: { minTrinkets: 1 },
        effects: [{ support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } }]
      }
    ],
    support: 'manual-only'
  },
  'foraging-bog-j-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'help',
        label: 'Help! — Guild law를 어기고 낙인찍힌 야수를 진창에서 구합니다. 구조 방법을 일지에 남기고 모든 타이머를 2 줄입니다.',
        requiresJournal: true,
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: -2, target: 'all' } },
          { support: 'implemented', effect: { type: 'addCondition', conditionId: HELPED_EXILED_OR_BRANDED_BEAST } }
        ]
      },
      {
        id: 'turn-away',
        label: 'Turn Away — 추방된 야수에게 다가가지 않고 지나갑니다.',
        effects: []
      }
    ],
    support: 'implemented'
  },
  'foraging-bog-9-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'bog-bargains',
        label: 'Bog Bargains — 이곳에서 한 번 Barter할 수 있으며 Bartering 2단계를 건너뜁니다.',
        effects: [manual('RUSTY_PICK_BOG_BARGAINS', '현재 위치에서 Barter 1회를 진행하고 Bartering 2단계를 건너뜁니다.')]
      },
      {
        id: 'pounder-s-take',
        label: "Pounder's Take — Iron Ore(철광석)나 Silver Ore(은광석)를 찾고 있고 Guild Reputation이 Trusted(35+)이면 해당 부위를 무료로 받습니다.",
        requirements: { minGuildReputation: 35 },
        effects: [manual('RUSTY_PICK_POUNDERS_TAKE', '현재 채집 목표가 Iron Ore 또는 Silver Ore인지 확인한 뒤 해당 영약재 부위 하나를 무료로 가방에 넣습니다.')]
      },
      {
        id: 'continue',
        label: '그대로 채집 계속 — Barter나 무료 광석 제안을 사용하지 않고 채집을 계속합니다.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.156: "New Connections" applies whether the apothecary helps or
  // ignores the Peatdiver. It is not an alternative to "Assistant".
  'foraging-bog-9-spring': {
    mandatoryEffects: [
      { support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }
    ],
    choices: [
      {
        id: 'assistant',
        label: 'Assistant — 풀무질을 도와 타이머를 2 줄이고 장신구 1개를 얻습니다.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: -2, target: 'all' } },
          { support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } }
        ]
      },
      {
        id: 'keep-moving',
        label: '돕지 않고 계속 — 탐사에는 참여하지 않지만, 새로 생긴 Guild와의 인연은 남습니다.',
        effects: []
      }
    ],
    support: 'implemented'
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
        requirements: { minTrinkets: 1 },
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
  'travel-forest-j-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'recognised-by-the-guild',
        label: '초대받기 — Guild Reputation이 15 이상이면 약제사로 알아보고 바비큐에 초대합니다. 다음에 시작하는 질환의 타이머에 2를 더합니다.',
        requirements: { minGuildReputation: 15 },
        effects: [manual('FRESHLY_GRILLED_NEXT_TIMER', '다음에 시작하는 질환의 모든 타이머에 2를 더합니다.')]
      },
      {
        id: 'unknown-to-the-guild',
        label: '지나가기 — Guild Reputation이 15 미만이면 야수들이 정중히 고개만 끄덕이고, 아무 효과 없이 계속 이동합니다.',
        requirements: { maxGuildReputation: 14 },
        effects: []
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
  'foraging-forest-9-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'guild-level-is-established-or-lower',
        label: '내어 주지 않음 — Guild Reputation이 24 이하이면 야수는 곤충 요리를 내주지 않고, 가져가려 하면 재빨리 먹어 버립니다.',
        requirements: { maxGuildReputation: 24 },
        effects: []
      },
      {
        id: 'guild-level-is-upstanding-or-higher',
        label: '요리를 건네받기 — Guild Reputation이 25 이상이고 곤충 영약재 부위를 찾고 있었다면 그 부위를 가방에 넣습니다.',
        requirements: { minGuildReputation: 25 },
        effects: [manual('INSECT_PICNIC_REAGENT', '현재 찾는 대상이 곤충 영약재 부위라면 그 부위 하나를 가방에 넣습니다.')]
      }
    ],
    support: 'manual-only'
  },
  'foraging-forest-9-spring': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'compassion',
        label: 'Compassion — 아무도 모르게 추방자의 새 Lesser Ailment를 맡습니다. 이 치료에서는 Guild Reputation과 Trinket을 얻거나 잃지 않으며, Overstay Your Welcome 전에 마쳐야 합니다.',
        effects: [
          { support: 'implemented', effect: { type: 'addCondition', conditionId: HELPED_EXILED_OR_BRANDED_BEAST } },
          manual('START_BRANDED_LESSER_AILMENT', '추방자를 위한 새 Lesser Ailment 환자를 즉시 시작하고 Patient / Treatment 단계로 이어갑니다. 이 환자의 치료 보상은 Guild Reputation 0, Trinket 0이며 Overstay Your Welcome 전에 완료해야 합니다.')
        ],
        followUp: {
          type: 'start-patient',
          timing: 'immediate',
          severity: 'lesser',
          rewardMode: 'none',
          deadline: 'before-overstay',
          patientKind: 'exiled-beast'
        }
      },
      {
        id: 'duty',
        label: 'Duty — 통상적인 Guild law에 따라 야수를 두고 떠나 Guild Reputation 1을 얻습니다. 떠나는 당신에게 무슨 말을 하나요? 어떤 기분이 드나요?',
        effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }]
      }
    ],
    support: 'manual-only'
  },
  'foraging-forest-m-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'flee',
        label: 'Flee — 자신과 추방자를 위해 카드 한 장씩 뽑아 높은 값을 비교합니다. 이기면 무사히 달아납니다. 지면 가장 가까운 정착지로 이동하고 겨울 여정을 끝냅니다.',
        effects: [manual('FANGS_A_HUNGERING_FLEE', '자신과 추방자의 카드 값을 비교합니다. 패배하면 가장 가까운 Settlement로 이동하고 Winter Journey를 끝낸 뒤 다음 Season까지 회복합니다.')]
      },
      {
        id: 'kindness',
        label: 'Kindness — 이전에 추방되었거나 낙인찍힌 야수를 도왔다면, 그 소문을 들은 공격자가 멈춥니다. 추방 생활에 관한 이야기를 떠올립니다.',
        requirements: { requiredConditionId: HELPED_EXILED_OR_BRANDED_BEAST },
        effects: []
      }
    ],
    support: 'manual-only'
  },
  'travel-meadow-a-2': {
    title: 'Obstruction',
    prompt: 'Little wagons laden with foods and goods are backed up along the path; a fallen tree blocks the road while beavers gnaw it clear. If you have a Wagon, mark 1 Day on the Calendar while stuck in traffic. Without a Wagon, slip through and scramble over the trunk with a friendly boost from the beavers.',
    mandatoryEffects: [],
    choices: [
      {
        id: 'resolve-obstruction',
        label: 'Resolve the Obstruction — If travelling with a Wagon, mark 1 Day while stuck in traffic. Without a Wagon, slip through and continue without delay.',
        effects: [manual(
          'OBSTRUCTION_WAGON_CHECK',
          '현재 이동에 Wagon을 쓰는지 확인합니다. Wagon과 함께라면 교통이 풀릴 때까지 기다리며 달력에 1일을 표시합니다. Wagon 없이 이동 중이라면 마차 사이를 빠져나와 비버의 도움으로 나무줄기를 넘고 지체 없이 계속합니다.'
        )]
      }
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
        label: 'Ship-to-Ship Combat — Coracle 또는 개조 마차가 있을 때 자신을 위해 카드 1장(석궁 보유 시 2장), 해적을 위해 카드 2장을 뽑아 합계를 겨룹니다.',
        effects: [manual('PIRATE_COMBAT', '카드 합계를 비교합니다. 승리하면 인접 지역으로 탈출하고, 패배하면 포로가 되어 여정과 이번 계절이 끝납니다.')]
      }
    ],
    support: 'manual-only'
  },
  'travel-loch-j-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'a-second-chance',
        label: 'A Second Chance — Coracle 또는 adapted Wagon이 있다면 물에 빠진 말벌을 구조하고 Wasp Companion으로 맞이합니다.',
        effects: [manual('WASP_COMPANION_RESCUE', 'Coracle 또는 adapted Wagon 보유를 확인한 뒤 Wasp Companion을 기록합니다.')]
      },
      {
        id: 'do-not-risk-it',
        label: '구조하지 않고 계속 — 구조 수단이 없거나 위험을 감수하지 않고 여정을 계속합니다.',
        effects: []
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
  // p.157: Munched is the later failure consequence of the Ailment started by
  // Distracted, not a second result the player may select immediately.
  'foraging-bog-m-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'check-for-soothing-supplies',
        label: 'Check for Something Soothing — If nothing can soothe the itch, start [HIDE 2], [POISON 1] with Timer 8. Only if that Ailment later fails, resolve Munched.',
        effects: [manual(
          'FANGS_WITH_WINGS_AILMENT',
          '가려움을 달랠 만한 것이 있는지 확인합니다. 없다면 [HIDE 2], [POISON 1], 타이머 8인 새 질환을 시작합니다. 그 질환의 치료에 실패한 경우에만 Munched를 적용해, 참기 힘든 가려움 때문에 패밀리어에게 아주 무례한 말을 내뱉은 뒤의 일을 이야기합니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.163: Lost Item belongs to the result of either Give Chase or Leave
  // Them. Preserve the source's duplicated Club symbol without inventing a
  // missing suit.
  'foraging-forest-j-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'give-chase',
        label: 'Give Chase — Decrease all Timers by 1 and draw. Hearts or Diamonds recover the stolen property; the printed “Clubs or Clubs” result loses the thief, then discards the Bag item reached by the card value.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
          manual(
            'THIEF_GIVE_CHASE_DRAW',
            '카드 1장을 뽑습니다. ♥ 또는 ♦이면 도둑을 따라잡아 물건을 되찾고, 도둑의 사과나 변명을 이야기합니다. 공식 원문에 그대로 인쇄된 “♣ 또는 ♣”이면 뿌리와 부엽토 사이에서 도둑을 놓칩니다. 그때 카드 값만큼 가방의 물품 목록을 세어 마지막으로 센 물품 하나를 버립니다. 누락된 무늬를 임의로 보충하지 않습니다.'
          )
        ]
      },
      {
        id: 'leave-them',
        label: 'Leave Them — Increase all Timers by 1, draw a card, then use its value to count through the Bags and discard the item reached.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: 1, target: 'all' } },
          manual(
            'THIEF_LEAVE_LOST_ITEM',
            '카드 1장을 뽑고 그 값만큼 가방의 물품 목록을 세어 마지막으로 센 물품 하나를 버립니다. 훔쳐야 할 만큼 절박했던 야수를 그냥 보내고 하던 일에 집중합니다.'
          )
        ]
      }
    ],
    support: 'manual-only'
  },
  // p.163: size determines how the rescue resolves. The two printed result
  // headings are not freely interchangeable choices.
  'foraging-forest-m-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'rescue-young-beast',
        label: 'Rescue the Young Beast — Compare your size. Larger: lift them free and take any Stinging Nettles Part. Smaller: guide them out and gain 1 Guild Reputation.',
        effects: [manual(
          'STUNG_ON_ALL_SIDES_SIZE_BRANCH',
          '어린 야수와 자신의 크기를 비교해 해당 결과만 적용합니다. 자신이 더 크면 어린 야수를 쐐기풀에서 들어 올리고 Stinging Nettles의 원하는 부위 하나를 얻습니다. 자신이 더 작으면 어떻게 안전하게 안내했는지 이야기하고 Guild Reputation 1을 얻습니다. 공식 원문은 같은 크기일 때의 결과를 따로 적지 않았으므로 그 경우 임의로 자동 판정하지 않습니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.169: Sick Tadpoles is the suit result of Tadpediatrician and Helping
  // Paw is the reward only after that Remedy succeeds.
  'foraging-loch-9-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'tadpediatrician',
        label: 'Tadpediatrician — Draw one card. Hearts or Diamonds: healthy. Clubs or Spades: create [TEMPERATURE 2], [INFECTION 1] before your highest Timer ends; curing them grants 2 Guild Reputation and 2 Trinkets.',
        effects: [manual(
          'SMALL_AILMENT_TADPOLE_DRAW',
          '카드 1장을 뽑습니다. ♥ 또는 ♦이면 올챙이들은 건강하며 추가 효과가 없습니다. ♣ 또는 ♠이면 가장 높은 환자 타이머가 끝나기 전에 [TEMPERATURE 2]와 [INFECTION 1] 치료제를 만듭니다. 이 아픈 올챙이들을 실제로 치료했을 때만 Guild Reputation 2와 장신구 2개를 얻습니다.'
        )]
      }
    ],
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
  // p.175: Sweet and Rescue are mutually exclusive inventory results of the
  // same decision to help, not two outcomes the player may choose freely.
  'foraging-meadow-j-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'help-the-bee',
        label: 'Help the Bee — With Honey or another FAIR Reagent, nurse it back to health. Without either, decrease all Timers by 4 while carrying it to safety. Both results grant a Honey Bee Companion.',
        effects: [manual(
          'BEE_KIND_SUPPLY_BRANCH',
          'Honey 또는 다른 FAIR Reagent를 가지고 있는지 확인합니다. 있다면 그것으로 벌을 간호해 Honey Bee Companion을 얻습니다. 둘 다 없다면 모든 타이머를 4 줄이고 벌을 안전한 곳까지 옮긴 뒤 Honey Bee Companion을 얻습니다. 두 결과 중 보유 상태에 맞는 하나만 적용합니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.175: the card and immediate-treatment check happen only after choosing
  // Intervene. They are results, not three separate declarations of success.
  'foraging-meadow-m-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'intervene',
        label: 'Intervene — Draw a card. Monarch: gain 4 Guild Reputation. Otherwise gain 6, suffer [WOUND 2], then reduce Timers by 2 if you can make its Remedy now or by 8 if the fighters take you to a Stitcher.',
        effects: [manual(
          'FIRE_AND_IRON_INTERVENE_DRAW',
          '카드 1장을 뽑습니다. M이면 싸움을 잠시 멈추고 Guild Reputation 4를 얻은 뒤 무엇을 물었고 평화에 어떤 대가가 따르는지 이야기합니다. M이 아니면 싸움을 멈추지만 휘말려 Guild Reputation 6을 얻고 [WOUND 2]를 입습니다. 지금 그 치료제를 만들 수 있다면 즉시 만들고 모든 타이머를 2 줄입니다. 만들 수 없다면 두 야수가 바느질꾼에게 데려가며 모든 타이머를 8 줄입니다.'
        )]
      },
      {
        id: 'leave-them-be',
        label: 'Leave Them Be — Do not intervene in the feud.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.176: Knowledge is unlocked by an earlier Run & Hide. Persist that
  // printed fact and prevent first-time players from selecting it directly.
  'foraging-meadow-j-autumn': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'run-hide',
        label: 'Run & Hide — Decrease all Timers by 1, hear the Crow Scarer legend, and unlock Knowledge for a later repeat of this event.',
        effects: [
          { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
          { support: 'implemented', effect: { type: 'addCondition', conditionId: TREMBLING_TECH_KNOWLEDGE } }
        ]
      },
      {
        id: 'knowledge',
        label: 'Continue with Knowledge — Available only after a previous Run & Hide; recognise the Crow Scarer and continue Foraging.',
        requirements: { requiredConditionId: TREMBLING_TECH_KNOWLEDGE },
        effects: []
      }
    ],
    support: 'implemented'
  },
  // p.177: Chill always establishes the Cold Timer. Snotladen is its future
  // zero-Timer result, while Hot Toddy is the current optional Tent procedure.
  'foraging-meadow-10-winter': {
    mandatoryEffects: [manual(
      'WORRYING_ACHE_COLD_TIMER',
      '감기 타이머를 6으로 설정합니다. 이 특별 타이머는 채집할 때만 줄어듭니다. 타이머가 0이 된 경우에만 Snotladen을 적용해, 다음 Move On 전에 달력에 2일을 표시하고 심한 감기를 쉬어 낫게 합니다.'
    )],
    choices: [
      {
        id: 'hot-toddy',
        label: 'Hot Toddy — If you have a Tent, shelter and drink something warm while Foraging; decrease all Timers by 1. If you draw this event again during the same Ailment, Journal about the drink.',
        effects: [manual(
          'WORRYING_ACHE_HOT_TODDY',
          'Tent를 가지고 있다면 야영지를 세워 몸을 피하고 따뜻한 음료를 마시며 모든 타이머를 1 줄입니다. 같은 질환 중 이 사건을 다시 만났다면 Hot Toddy에 관해 일지에 기록합니다.'
        )]
      },
      {
        id: 'continue-in-the-cold',
        label: 'Continue in the Cold — Do not use the optional Tent and Hot Toddy procedure; keep the Cold Timer at 6.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.178: Exhausted is the compulsory cost; the only decision after resting
  // is whether to share that rest with the Fellow Hiker.
  'foraging-mountain-4': {
    mandatoryEffects: [
      { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } }
    ],
    choices: [
      {
        id: 'rest-alone',
        label: 'Rest Alone — Catch your breath without stopping to chat.',
        effects: []
      },
      {
        id: 'fellow-hiker',
        label: 'Fellow Hiker — Rest beside another hiking beast and ask where they are headed and why.',
        effects: []
      }
    ],
    support: 'implemented'
  },
  // p.180: Scamper introduces the escape; Down, Up, and conditional flight
  // are the actual alternatives.
  'foraging-mountain-j-spring': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'down-the-scree',
        label: 'Down the Scree — Escape safely, but do not Forage at this Location again until you Move On.',
        effects: [manual(
          'PROTECTIVE_PARENTS_DOWN',
          '너덜비탈 아래로 달아나 무사히 벗어납니다. 다음 Move On 전까지 이 위치에서 다시 채집하지 않는다고 기록합니다.'
        )]
      },
      {
        id: 'up-the-slope',
        label: 'Up the Slope — Escape out of sight and continue Foraging; decrease all Timers by 2 while resting your aching limbs.',
        effects: [{ support: 'implemented', effect: { type: 'modifyTimer', amount: -2, target: 'all' } }]
      },
      {
        id: 'on-flitting-wings',
        label: 'On Flitting Wings — Only if you or your Familiar can fly, dart out of reach and continue Foraging.',
        effects: [manual(
          'PROTECTIVE_PARENTS_FLIGHT_CHECK',
          '자신 또는 패밀리어가 날 수 있는지 확인합니다. 가능할 때만 양 떼가 닿지 못할 곳으로 날아 채집을 계속합니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.181: body type selects the result. The apothecary does not choose which
  // relationship with the heat applies.
  'foraging-mountain-m-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'resolve-blazing-sun',
        label: 'Resolve the Blazing Sun — Cold-blooded beasts increase all Timers by 2; otherwise seek water and shade and decrease all Timers by 2.',
        effects: [manual(
          'BLAZING_SUN_BODY_BRANCH',
          '약제사가 냉혈 동물인지 확인합니다. 냉혈 동물이라면 더위에 활력을 얻어 모든 타이머를 2 늘립니다. 아니라면 물과 그늘을 찾느라 모든 타이머를 2 줄입니다. 보유한 신체 조건에 맞는 결과 하나만 적용합니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  'foraging-bog-j-summer': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'helping-wing',
        label: '도움의 날개 — Guild Reputation이 25 이상이면 전령새가 정찰하거나 등에 태워 주어 채집 포인트 4를 얻습니다.',
        requirements: { minGuildReputation: 25 },
        effects: [{ support: 'implemented', effect: { type: 'modifyForagingPoints', amount: 4 } }]
      },
      {
        id: 'unknown',
        label: '그냥 지나감 — Guild Reputation이 25 미만이면 새는 대열을 깨지 않고, 아무 효과 없이 계속 날아갑니다.',
        requirements: { maxGuildReputation: 24 },
        effects: []
      }
    ],
    support: 'implemented'
  },
  'foraging-meadow-8': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'airlift',
        label: 'Airlift — Guild Reputation이 Trusted(35+)이면 새가 다음 채집 장소까지 무료로 태워 줍니다. 채집 포인트 4를 얻습니다.',
        requirements: { minGuildReputation: 35 },
        effects: [{ support: 'implemented', effect: { type: 'modifyForagingPoints', amount: 4 } }]
      },
      {
        id: 'taxi',
        label: 'Taxi — Guild Reputation이 Upstanding 이하(34 이하)일 때 장신구 1개를 주고 새의 제안을 받아 채집 포인트 4를 얻습니다.',
        requirements: { maxGuildReputation: 34, minTrinkets: 1 },
        effects: [
          { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } },
          { support: 'implemented', effect: { type: 'modifyForagingPoints', amount: 4 } }
        ]
      },
      {
        id: 'decline',
        label: '제안을 받지 않고 계속 — 무료 Airlift 조건이 아니거나 Taxi 비용을 내지 않거나, 제안을 거절하고 아무 효과 없이 채집을 계속합니다.',
        effects: []
      }
    ],
    support: 'implemented'
  },
  // p.176: the Calendar result is automatic, Beseech is an optional extra,
  // and the conversation Journal replaces the Social Encounter in either
  // case. The extracted headings must therefore not become three exclusive
  // player choices.
  'foraging-meadow-m-autumn': {
    mandatoryEffects: [
      manual(
        'MYCOPHILIACS_CALENDAR_BRANCH',
        '조우 시작 시 달력의 표시된 날과 남은 날을 비교합니다. 남은 날이 더 많으면 원하는 Mushroom Reagent 하나를 얻고, 표시된 날이 과반이면 이 위치에서 Mushroom Reagent의 Rarity를 10으로 올립니다.'
      )
    ],
    choices: [
      {
        id: 'beseech',
        label: 'Beseech — Guild Reputation이 Upstanding일 때 Mushroom을 대상으로 Barter를 한 번 합니다. Social Encounter 대신 채집꾼들과 나눈 대화를 일지에 남깁니다.',
        requirements: { minGuildReputation: 25, maxGuildReputation: 34 },
        requiresJournal: true,
        effects: [manual('MYCOPHILIACS_BARTER', 'Mushroom을 대상으로 Barter를 한 번 진행합니다.')]
      },
      {
        id: 'continue-without-barter',
        label: 'Barter 없이 계속 — Social Encounter 대신 채집꾼들과 나눈 대화를 일지에 남깁니다.',
        requiresJournal: true,
        effects: []
      }
    ],
    support: 'manual-only'
  },
  // p.177: Locally Sourced sets up the present hunt; Cheerful Delivery is its
  // later reward, not a mutually exclusive action available before setup.
  'foraging-meadow-9-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'begin-present-hunt',
        label: '선물 찾기 시작 — 카드 3장을 목표로 놓고, 이번 채집 중 값이나 무늬가 맞는 카드를 뽑을 때마다 잃어버린 선물을 하나 찾습니다.',
        effects: [manual(
          'SAIN_DE_CLAWS_PRESENT_HUNT',
          '카드 3장을 뽑아 옆에 둡니다. 이번 지역에서 채집하며 그 값이나 무늬와 일치하는 카드를 뽑을 때마다 선물을 하나 찾습니다. 찾은 선물을 돌려주면 계절 끝에 개봉할 장신구를 받고, 세 개를 모두 돌려주면 그 장신구들이 원하는 Tool 하나로 합쳐집니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.183: accepting the Bear Lord's Ailment is the present decision. Just In
  // Time and Too Late are mutually exclusive future resolutions of its Timer.
  'foraging-mountain-m-winter': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'start-ailment',
        label: 'Start the Ailment — Take responsibility for [INFECTION 3], [INFECTION 3], [PAIN 2] with Timer 8. Resolve Just In Time or Too Late when that Timer succeeds or expires.',
        effects: [manual(
          'MERCY_FOR_MIGHTY_AILMENT',
          '[INFECTION 3], [INFECTION 3], [PAIN 2], 타이머 8인 별도 질환을 시작합니다. 제때 Remedy를 만들면 이후 곰 조우의 부정적 결과를 “거대한 곰이 예의를 보이는 장면을 일지에 남기기”로 대체합니다. 타이머가 0이 되면 곰은 Elsewhere로 떠납니다. 장례 의식과 곰의 생전 흔적을 묘사하고, 원한다면 유형과 관계없이 희귀도 합계 10 이하의 Reagent를 고분에서 가져옵니다.'
        )]
      },
      {
        id: 'decline-ailment',
        label: 'Decline the Ailment — Do not take responsibility for treating the Bear Lord.',
        effects: []
      }
    ],
    support: 'manual-only'
  },
  'foraging-mountain-10-spring': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'secrets-of-the-craft',
        label: 'Secrets Of The Craft — Guild Reputation이 Upstanding(25–34)이면 특별한 PURIFY 조제법을 배웁니다. Mountain에서 마지막 영약재를 채집한 치료제에 사용하면 모든 FOUL을 제거합니다.',
        requirements: { minGuildReputation: 25, maxGuildReputation: 34 },
        effects: [{ support: 'implemented', effect: { type: 'addCondition', conditionId: 'purify-trained' } }]
      },
      {
        id: 'shunned',
        label: 'Shunned — Guild Reputation이 Established 이하(24 이하)이면 야수들은 물건을 챙겨 가시금작화 덤불로 달아납니다.',
        requirements: { maxGuildReputation: 24 },
        effects: []
      },
      {
        id: 'trusted-source-gap',
        label: 'Trusted · 원문 판정 필요 — 공식 p.180은 Upstanding과 Established 이하만 설명하고 Trusted 결과는 적지 않았습니다. PURIFY를 자동으로 배우지 않고 사용할 판정을 직접 정합니다.',
        requirements: { minGuildReputation: 35 },
        effects: [manual('SPECIAL_TECHNIQUE_TRUSTED_GAP', '공식 p.180에 Trusted 결과가 없습니다. Upstanding 결과를 확장한다고 추측하지 말고 테이블에서 직접 판정합니다.')]
      }
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
  // p.186: Memento is only available after borrowing the Tool and later
  // taking news home. Keep the optional immediate acts and delayed rewards in
  // one procedure so Memento cannot be selected out of sequence.
  'foraging-titan-7': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'attend-to-the-remains',
        label: 'Attend to the Remains — Choose whether to Investigate and/or Borrow. A successful Investigation can lead to 4 Guild Reputation on later delivery; a borrowed Tool returned with that news grants an additional 6.',
        effects: [manual(
          'WHAT_REMAINS_PROCEDURE',
          '원한다면 조사와 빌려 쓰기를 각각 진행합니다. 조사한다면 카드 1장을 뽑고, 6보다 높을 때만 유품에서 고향을 알아낼 단서를 찾습니다. 이후 사망 소식을 그 고향에 전하면 Guild Reputation 4를 얻습니다. 빌려 쓰기를 선택하면 원하는 Tool 하나를 무료로 얻습니다. 그 Tool을 빌렸고 나중에 사망 소식을 고향에 전하는 경우에만, Tool을 유품으로 돌려주고 Guild Reputation 6을 추가로 얻을 수 있습니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  // p.186: Searching merely introduces the Careful/Quick decision.
  'foraging-titan-8': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'careful',
        label: 'Careful — Until you Move On, decrease all Timers by an additional 1 after each Encounter while checking for Titan traps.',
        effects: [manual(
          'SNAP_CRACKLE_CAREFUL',
          '다음 Move On 전까지 이 위치에서 조우를 마칠 때마다, 티탄 함정을 자주 살피는 대가로 모든 타이머를 추가로 1 줄입니다.'
        )]
      },
      {
        id: 'quick',
        label: 'Quick — Until you Move On, draw after each Encounter; Clubs or Spades trigger the dangerous device and force you to leave this Location and end the Forage.',
        effects: [manual(
          'SNAP_CRACKLE_QUICK',
          '다음 Move On 전까지 이 위치에서 조우를 마칠 때마다 카드 1장을 뽑습니다. ♣ 또는 ♠이면 위험한 장치를 건드려 고통이 온몸을 관통하므로, 상처를 돌보기 위해 이 위치를 떠나 채집을 끝냅니다.'
        )]
      }
    ],
    support: 'manual-only'
  },
  'foraging-titan-m-spring': RESEARCHER_VISIT_OVERRIDE,
  'foraging-titan-m-summer': RESEARCHER_VISIT_OVERRIDE,
  'foraging-titan-m-autumn': RESEARCHER_VISIT_OVERRIDE,
  'foraging-titan-m-winter': RESEARCHER_VISIT_OVERRIDE,
  // p.206: Protect the Queen and Wish Them Luck are the immediate choices.
  // Release the Queen is the later completion of the accepted companion task.
  'social-meadow-spring-♣': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'protect-the-queen',
        label: 'Protect the Queen — Record the Queen Bee as a Companion. Later, release her in a wild Meadow, Bog, or Forest to establish a Beehive whose Honey and Wax are gathered automatically there.',
        effects: [manual(
          'BEES_REHOME_QUEEN',
          'Queen Bee(여왕벌)를 길동무로 기록합니다. 이후 야생 초원·늪지·숲 중 한 곳에 다시 자리 잡게 하면 그 위치를 새 벌집으로 지도에 표시합니다. 그 뒤 당신과 다른 약제사들은 그 위치에서 채집할 때 Beehive의 Honey(꿀)와 Wax(밀랍) 부위를 자동으로 얻을 수 있습니다.'
        )]
      },
      {
        id: 'wish-them-luck',
        label: 'Wish Them Luck — Leave the matter to the Hivewardens and lose 1 Guild Reputation.',
        effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: -1 } }]
      }
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
  // p.204: the contents of the Bags determine the Inspection result. Both
  // printed branches require a Journal entry, so expose one checked procedure
  // rather than asking the player to choose the inspector's reaction.
  'social-meadow-settlement-♥': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'inspect-bags',
        label: 'Inspect the Bags — No mushroom Plant Reagent Parts: Waved On Past. Any such Part: A Stern Lecture. Journal the matching printed prompt.',
        requiresJournal: true,
        effects: [manual(
          'INSPECTION_MUSHROOM_BRANCH',
          '가방에 버섯에서 얻은 Plant Reagent Part가 있는지 확인합니다. 없다면 검사관이 미소로 보내 주며, 이런 검사가 여행자와 정착지에 미치는 영향을 일지에 남깁니다. 하나라도 있다면 약용이라는 설명 뒤에도 겨울 식량의 병해 위험에 관해 엄중한 주의를 듣고, 검사관이 왜 자원했는지와 병해를 직접 겪었는지 일지에 남깁니다.'
        )]
      }
    ],
    support: 'manual-only'
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
      { id: 'weave-a-trinket', label: '만드는 중 · 장신구 엮기 — 장신구 1개를 기념물에 엮고 길드 명성 1을 얻습니다.', requirements: { minTrinkets: 1 }, effects: [
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
      { id: 'homecooked-meal', label: 'Homecooked Meal — 장신구 1개를 식사와 바꾸고 다음 Move의 속도를 두 배로 합니다.', requirements: { minTrinkets: 1 }, effects: [
        { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } },
        { support: 'implemented', effect: { type: 'addCondition', conditionId: 'next-move-speed-double' } }
      ] },
      { id: 'wharf-rats', label: 'Wharf Rats — 부두 끝에서 놀이 중인 어린 쥐들과 규칙이 달라진 게임을 이야기합니다.', effects: [] }
    ],
    support: 'manual-only'
  },
  // p.213: Fresh Face and Reintroduction are prior-meeting branches, not a
  // narrative choice the player makes for Griph.
  'social-glasswall-♦': {
    mandatoryEffects: [],
    choices: [
      {
        id: 'greet-griph',
        label: 'Greet Griph — If this is your first meeting, resolve A Fresh Face; if you have met before, resolve A Reintroduction.',
        effects: [manual(
          'DONE_DEAL_GRIPH_HISTORY',
          '그리프를 전에 만났는지 확인합니다. 초면이라면 A Fresh Face를 적용해 여행 상인이자 일꾼인 그리프의 자기소개를 듣습니다. 전에 만났다면 A Reintroduction을 적용해, 다시 자기소개하던 그리프가 중간에 당신을 기억하고 길 위의 이야기와 Glasswall에 온 경위를 나누는 장면을 이야기합니다.'
        )]
      }
    ],
    support: 'manual-only'
  }
};

export const applyPrintedEncounterOverride = (encounter: EncounterDefinition): EncounterDefinition => ({
  ...encounter,
  ...(PRINTED_ENCOUNTER_OVERRIDES[encounter.id] || {})
});
