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
    mandatoryEffects: [manual('DRAW_AND_CHOOSE_FOREST_PLANT', 'Draw a follow-up card, then choose one eligible Forest Plant Part with matching Base Value.')],
    choices: [],
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
