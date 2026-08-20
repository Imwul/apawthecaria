import type { EncounterDefinition } from '../types';

const manual = (code: string, description: string): EncounterDefinition['mandatoryEffects'][number] => ({
  support: 'manual-only',
  effect: { type: 'customEffect', code, description }
});

export const PRINTED_ENCOUNTER_OVERRIDES: Record<string, Partial<EncounterDefinition>> = {
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
  'travel-soar-m-winter': {
    title: 'Hailstorm',
    prompt: 'End at the chosen Destination, become Soaked unless protected by a Waxed Satchel, and reduce the next Timer by 2.',
    mandatoryEffects: [
      { support: 'implemented', effect: { type: 'modifyTimer', amount: -2, target: 'all' } },
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
  }
};

export const applyPrintedEncounterOverride = (encounter: EncounterDefinition): EncounterDefinition => ({
  ...encounter,
  ...(PRINTED_ENCOUNTER_OVERRIDES[encounter.id] || {})
});
