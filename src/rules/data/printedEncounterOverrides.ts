import type { EncounterDefinition } from '../types';

const manual = (code: string, description: string): EncounterDefinition['mandatoryEffects'][number] => ({
  support: 'manual-only',
  effect: { type: 'customEffect', code, description }
});

export const PRINTED_ENCOUNTER_OVERRIDES: Record<string, Partial<EncounterDefinition>> = {
  'travel-bog-7-8': {
    title: 'Climate Change',
    prompt: 'The weather takes an unexpected turn. Journal about what happens and how you adapt.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-bog-j-summer': {
    title: 'Mudlarking',
    prompt: 'A frog hides beneath the wet mud and breathes through a reed. Journal about why they are doing it and what they tell you.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-bog-m-summer': {
    title: 'Busy Work',
    prompt: 'Craftpaws are soaking reeds for weaving. Continue on, or spend a Day helping them and gain a reed-woven Trinket.',
    mandatoryEffects: [],
    choices: [
      { id: 'weave-it-alone', label: 'Weave It Alone: continue on', effects: [] },
      { id: 'sit-and-soak', label: 'Sit And Soak: Mark 1 Day and gain 1 Trinket', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
        { support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } }
      ] }
    ],
    support: 'implemented'
  },
  'travel-bog-j-autumn': {
    title: 'Fungi Founder',
    prompt: 'You discover a new mushroom species and name it. Eat it, draw a card, and resolve whether it is curative, delicious, or poisonous.',
    mandatoryEffects: [manual('FUNGI_FOUNDER_DRAW', 'Draw a card and resolve the printed Heart, Diamond, or Club/Spade result, including a custom Reagent, Trinket trade note, or halved Speed for 3 Days.')],
    choices: [],
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
  'travel-bog-j-winter': {
    title: 'Chilled To The Core',
    prompt: 'A young beast is chilled and exhausted. Guide them home, or spend the afternoon sharing warmth.',
    mandatoryEffects: [],
    choices: [
      { id: 'stop-and-help', label: 'Stop and help: Mark 2 Days, gain 3 Reputation, and move to the nearest Settlement', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 2 } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 3 } },
        manual('MOVE_TO_NEAREST_SETTLEMENT', 'Change the end of the Move to the nearest Settlement.')
      ] },
      { id: 'passing-warmth', label: 'Passing Warmth: Mark 1 Day and gain 1 Reputation', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }
      ] }
    ],
    support: 'manual-only'
  },
  'travel-forest-a-2': {
    title: 'In Bloom',
    prompt: 'Draw a card and collect a Forest Plant Reagent Part whose Base Value equals the card.',
    mandatoryEffects: [manual('DRAW_AND_CHOOSE_FOREST_PLANT', 'Draw a follow-up card, then choose one eligible Forest Plant Part with matching Base Value.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-forest-3-4': {
    title: 'Rest Stop',
    prompt: 'A traveller invites you to share their campfire. Journal about where they came from, where they are going, and the stories they share.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-forest-9-10-spring': {
    title: 'Memories',
    prompt: 'A pleasant wind makes the forest feel alive. Journal about the moment from your past that returns to you.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-forest-9-10-winter': {
    title: 'Fairwinders',
    prompt: 'A migrating beast asks for directions to the nearest City. Journal about the amazing far-away cities they describe.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-forest-j-spring': {
    title: 'Danger Ahead',
    prompt: 'A fallen wasp nest blocks the route. Re-plan the Move without the last two Paths, or drop a Reagent or Tool while rushing past.',
    mandatoryEffects: [manual('DANGER_AHEAD_CHOICE', 'Choose a new route that avoids the last two Paths, or discard one carried Reagent or Tool.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-forest-j-summer': {
    title: 'Freshly Grilled',
    prompt: 'A summer barbecue welcomes known Poulticepounders. If Guild Reputation is at least Known, add 2 to the next Timer; otherwise continue on.',
    mandatoryEffects: [manual('FRESHLY_GRILLED_REPUTATION_TIMER', 'Check whether Reputation is at least Known and, if so, add 2 to the next Timer.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-forest-m-spring': {
    title: 'Parade',
    prompt: 'You find colourfully dressed beasts singing happy songs. Journal about what they celebrate, whether you join, and the strangest part of the party.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-forest-m-summer': {
    title: 'Go Ape',
    prompt: 'Young beasts invite you to help build a treetop dexterity course. Via Ferratta means this Move does not Mark its normal Day.',
    mandatoryEffects: [{ support: 'implemented', effect: { type: 'markDays', amount: -1 } }],
    choices: [],
    support: 'implemented'
  },
  'travel-forest-m-autumn': {
    title: 'Lost-And-Found',
    prompt: 'A dropped Trinket lies half-buried in mud. Keep it, or leave it where it can be found.',
    mandatoryEffects: [],
    choices: [
      { id: 'finders-keepers', label: "Finders, Keepers: gain 1 Trinket", effects: [{ support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } }] },
      { id: 'right-thing', label: 'The Right Thing To Do: gain 1 Reputation', effects: [{ support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } }] }
    ],
    support: 'implemented'
  },
  'travel-loch-3-4': {
    title: 'Muddy Waters',
    prompt: 'Something brushes against you beneath the water. Draw a card, then journal about the Titan wreck or natural formation you discover.',
    mandatoryEffects: [manual('MUDDY_WATERS_DRAW', 'Draw a card. J or M reveals a Titan wreck; Ace through 10 reveals a natural formation.')],
    choices: [],
    support: 'manual-only'
  },
  'travel-loch-5-6': {
    title: 'Carpe Carp-ey',
    prompt: 'A great fish breaks the surface. Let it go, or draw one card for yourself and one for the fish to see which is higher.',
    mandatoryEffects: [],
    choices: [
      { id: 'let-it-go', label: 'Let it go: continue without grabbing the fish', effects: [] },
      { id: 'grabby-paws', label: 'Grabby Paws: draw one card for you and one for the Big Fish', effects: [
        manual('CARPE_CARPEY_CONTEST', 'Compare both cards. Win to gain every Big Fish Part; lose to drop one Item from your Bags.')
      ] }
    ],
    support: 'manual-only'
  },
  'travel-loch-9-10-spring': {
    title: 'Less Than Titanic',
    prompt: 'A non-aquatic beast clings to sinking driftwood. Rescue them, or leave them to learn a difficult lesson.',
    mandatoryEffects: [],
    choices: [
      { id: 'rescue', label: 'Rescue: Mark 1 Day, gain 1 Reputation, and move to the nearest non-Loch Location', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 1 } },
        manual('MOVE_TO_NEAREST_NON_LOCH', 'Change the end of the Move to the nearest non-Loch Location.')
      ] },
      { id: 'lessons', label: 'Lessons should be learned: continue without helping', effects: [] }
    ],
    support: 'manual-only'
  },
  'travel-loch-9-10-summer': {
    title: 'Log Floats',
    prompt: 'Beavers pole a raft of lashed logs along the water. Journal about where the lumber came from and what it will be used for.',
    mandatoryEffects: [],
    choices: [],
    support: 'implemented'
  },
  'travel-loch-9-10-autumn': {
    title: 'Snarling Threats',
    prompt: 'Hornweed chokes the waterway. Cull it for a Day and Reputation, or leave it and draw to see whether it spreads.',
    mandatoryEffects: [],
    choices: [
      { id: 'cull', label: 'Cull: Mark 1 Day and gain 2 Reputation', effects: [
        { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
        { support: 'implemented', effect: { type: 'modifyReputation', amount: 2 } }
      ] },
      { id: 'leave-it', label: 'Leave It: draw a card and resolve whether Hornweed spreads', effects: [
        manual('HORNWEED_SPREAD_DRAW', 'Draw a card. On Clubs or Spades, all Reagents have +3 Rarity in this Location until Winter.')
      ] }
    ],
    support: 'manual-only'
  },
  'travel-loch-j-spring': {
    title: 'Need For Speed',
    prompt: 'A showboating water bird challenges you. Refuse and alter a Journal page, or race by drawing two cards for the bird and one for yourself.',
    mandatoryEffects: [],
    choices: [
      { id: 'refuse', label: 'Refuse: record how the splashed Journal page was altered', effects: [manual('NEED_FOR_SPEED_REFUSAL', 'Record the page or words altered by the water bird.')] },
      { id: 'race', label: 'Race: draw two cards for the bird and one for you', effects: [manual('NEED_FOR_SPEED_RACE', 'Compare the highest value. Win to gain 1 Trinket; lose the race to gain 1 Reputation for good sportsmanship.')] }
    ],
    support: 'manual-only'
  },
  'travel-loch-j-summer': {
    title: 'Pi-rats!',
    prompt: 'Pirates demand your business. Treat their patient under the Parley rules, or fight Ship-to-Ship by drawing one card for yourself (two with a Crossbow) and two for the Pirates.',
    mandatoryEffects: [],
    choices: [
      { id: 'parley', label: 'Parley: Help a Local Pirate under the printed patient and prisoner rules', effects: [manual('PIRATE_PATIENT', 'Replace Local Beast rewards with Trinkets and become Taken Prisoner if the Remedy fails.')] },
      { id: 'ship-combat', label: 'Ship-to-Ship Combat: compare your total with two Pirate cards', effects: [manual('PIRATE_COMBAT', 'Use a Coracle or adapted Wagon. Draw a second player card only with a Crossbow; escape adjacent on a win or become Taken Prisoner on a loss.')] }
    ],
    support: 'manual-only'
  },
  'travel-meadow-a-2': {
    title: 'Obstruction',
    prompt: 'If travelling with a Wagon, Mark 1 Day; otherwise pass through without delay.',
    mandatoryEffects: [manual('WAGON_DAY_CHECK', 'Check whether the traveller has a Wagon. If so, Mark 1 Day.')],
    choices: [],
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
    mandatoryEffects: [manual('HAILSTORM_SOAK_AND_NEXT_TIMER', 'Check Waxed Satchel protection, soak vulnerable items, and apply -2 to the next Timer.')],
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
