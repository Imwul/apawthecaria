import type {
  PreparationToolId,
  ReagentPreparation,
  RuleTag,
  StructuredRuleEffect
} from '../types';
import { canonicalMetadata } from '../source';
import canonicalAvailability from './reagentAvailability.json';

type TagSpec = [RuleTag, number];
type RuleSpec = [string, string];
type PreparationSpec = [
  part: string,
  method: string,
  weight: number,
  tags: TagSpec[],
  options?: { uses?: number; rules?: RuleSpec[]; alternativeGroup?: string }
];

const T = 1 / 3;
const D = 2 / 3;

const S: Record<string, PreparationSpec[]> = {
  'Animal Sheddings': [
    ['Pellets', 'CRUSHED', D, [['STOMACH', 1]]],
    ['Hair', 'BOILED THEN USED', D, [['HIDE', 1]]],
    ['Sweat', 'BOILED THEN APPLIED', T, [['FEATHER', 1]]]
  ],
  Beech: [
    ['Shells', 'GROUND', T, [['HIDE', 2]]],
    ['Nuts', 'USED', T, [['FAIR', 1]]],
    ['Nuts', 'COOKED', T, [['FAIR', 2]]],
    ['Bark', 'BREWED', 1, [['WOUND', 2]]]
  ],
  Beehive: [
    ['Wax', 'USED', T, [['FEATHER', 2]]],
    ['Royal Jelly', 'USED', T, [['HIDE', 2], ['BURN', 2]]],
    ['Honey', 'ADDED', T, [['WOUND', 2]]],
    ['Honey', 'USED IN CONSUMED REMEDIES', T, [['FAIR', 4]]]
  ],
  Beetles: [
    ['Shells', 'CRUSHED', T, [['SCALE', 2]]],
    ['Shells', 'USED', T, [['ELSEWHERE', 1]]]
  ],
  'Behemoth Bits': [
    ['Musk', 'APPLIED', T, [['INSTINCT', 2]]],
    ['Urine', 'BOILED', D, [['SENSES', 2]]],
    ['Fur', 'APPLIED', 1, [['TEMPERATURE', 3]]]
  ],
  'Big Fish': [
    ['Skin', 'BOILED THEN APPLIED', D, [['HIDE', 2]]],
    ['Meat', 'COOKED', 1, [['MOOD', 2], ['SENSES', 3]]],
    ['Scales', 'CRUSHED', T, [['SCALE', 3]]]
  ],
  'Birch Polypore': [
    ['Mushroom', 'APPLIED', T, [['HIDE', 2], ['WOUND', 1]]]
  ],
  'Bird Leavings': [
    ['Guano', 'GROUND THEN COOKED', T, [['POISON', 1]]],
    ['Egg Shell', 'CRUSHED', T, [['SCALE', 1]]],
    ['Feathers', 'USED', T, [['JOY', 1]]]
  ],
  Blackcurrant: [
    ['Berries', 'USED', T, [['FAIR', 1]]],
    ['Leaves', 'BREWED', T, [['INFECTION', 1]]],
    ['Roots', 'CHEWED', 1, [['MOOD', 1]]]
  ],
  Blackthorn: [
    ['Sloes', 'USED IN CONSUMED REMEDIES', 1, [['FOUL', 2]]],
    ['Sloes', 'COOKED', 1, [['FAIR', 2], ['STOMACH', 2]]],
    ['Thorns', 'GROUND AND BREWED', T, [['POISON', 2]]]
  ],
  Brambles: [
    ['Berries', 'CHEWED', T, [['FAIR', 2]]],
    ['Berries', 'COOKED', T, [['FAIR', 3]]],
    ['Bark', 'BOILED', D, [['HIDE', 1]]],
    ['Roots', 'CHEWED THEN BREWED', 1, [['STOMACH', 1]]]
  ],
  Burdock: [
    ['Roots', 'BREWED', 1, [['INFECTION', 1]]],
    ['Stems', 'GROUND', D, [['FUR', 1]], { rules: [['SPRING_ONLY_PART', 'Stems can only be Foraged in Spring.']] }],
    ['Flowers', 'DIGESTED', T, [['JOY', 2]], { rules: [['SUMMER_ONLY_PART', 'Flowers can only be Foraged in Summer.']] }],
    ['Burrs', 'USED', T, [['PARASITE', 1]], { rules: [['AUTUMN_ONLY_PART', 'Burrs can only be Foraged in Autumn.']] }]
  ],
  Butterfly: [
    ['Living Butterfly', 'APPLIED', T, [['SLEEP', 3], ['JOY', 2]]]
  ],
  Catnip: [
    ['Roots', 'CHEWED', T, [['BREATH', 1], ['TEMPERATURE', 1]]],
    ['Flowers', 'BREWED', T, [['INSTINCT', 2], ['MOOD', 1], ['NERVES', 1]]]
  ],
  Chalk: [
    ['Chalk', 'CRUSHED', T, [['STOMACH', 2], ['POISON', 1]]]
  ],
  'Cherry Trees': [
    ['Cherries', 'COOKED', T, [['JOY', 3], ['FAIR', 4]], { rules: [['SUMMER_ONLY_PART', 'Cherries can only be Foraged in Summer.']] }],
    ['Bark', 'CRUSHED', T, [['BREATH', 1], ['TEMPERATURE', 1], ['FOUL', 2]]]
  ],
  Chillies: [
    ['Membranes', 'BOILED', T, [['PAIN', 1]]],
    ['Membranes', 'DISTILLED', T, [['PAIN', 2]]],
    ['Seeds', 'CRUSHED', T, [['NERVES', 1], ['TEMPERATURE', 1], ['FOUL', 3]]],
    ['Seeds', 'DISTILLED', T, [['NERVES', 2], ['TEMPERATURE', 2], ['FOUL', 4]]]
  ],
  Clay: [
    ['Clay', 'USED', D, [['NERVES', 1], ['POISON', 1]]],
    ['Clay', 'DIGESTED', D, [['STOMACH', 1]]]
  ],
  'Coarse Grit': [
    ['Grit', 'CHEWED', T, [['STOMACH', 2]]],
    ['Grit', 'APPLIED', T, [['SCALE', 2]]]
  ],
  'Concocted Calm': [
    ['Spritzer', 'USED', D, [['INSTINCT', 3], ['MOOD', 3]], { uses: 3 }]
  ],
  'Crab Apples': [
    ['Fruit', 'USED IN CONSUMED REMEDIES', 1, [['FOUL', 1]]],
    ['Fruit', 'COOKED', 1, [['FAIR', 2]], { rules: [['ADDS_PRESERVED', 'Cooked fruit can add PRESERVED to any remedy; FAIR 2 applies to consumed remedies.']] }]
  ],
  Cucumbers: [
    ['Flowers', 'BREWED', T, [['SENSES', 2], ['SLEEP', 1], ['FAIR', 1]], { rules: [['SPRING_ONLY_PART', 'Flowers can only be Foraged in Spring.']] }],
    ['Marrow', 'USED IN CONSUMED REMEDIES', T, [['STOMACH', 1], ['TEMPERATURE', 1]]],
    ['Marrow', 'CRUSHED', T, [['BURN', 1], ['HIDE', 1]]]
  ],
  Dandelions: [
    ['Flowers', 'USED', T, [['JOY', 1]]],
    ['Roots', 'GROUND', T, [['STOMACH', 1]]],
    ['Leaves', 'USED IN CONSUMED REMEDIES', T, [['FAIR', 1]]],
    ['Stems', 'BREWED', T, [['HIDE', 1]]]
  ],
  'Doused Bonfires': [
    ['Ash', 'APPLIED', T, [['SCALE', 2]]],
    ['Ash', 'BREWED', T, [['HIDE', 2]]],
    ['Charcoal', 'CRUSHED', T, [['POISON', 2]]],
    ['Charcoal', 'USED', T, [['ELSEWHERE', 2]]]
  ],
  'False Deathcap': [
    ['Flesh', 'CRUSHED', D, [['SENSES', 1], ['FOUL', 3]]],
    ['Flesh', 'DIGESTED', D, [['SENSES', 3], ['FOUL', 6]]]
  ],
  'Field Blewit': [
    ['Cap', 'COOKED', T, [['STOMACH', 2], ['FAIR', 2]]]
  ],
  'Fine Sand': [
    ['Sand', 'USED', D, [], { rules: [
      ['FILTER_FAIR_FOUL', 'Remove all FAIR and FOUL tags from a consumed remedy.'],
      ['FILTER_DISCARD_CHECK', 'Draw a card after filtering; discard the sand on Clubs or Spades.']
    ] }],
    ['Sand', 'APPLIED', D, [['SCALE', 3]]]
  ],
  Firegizzards: [
    ['Gizzard', 'USED', 1, [['TEMPERATURE', 3]], { rules: [['RECHARGE_ON_MOVE', 'Regain the single use each time you Move On.']] }]
  ],
  'Fly Agaric': [
    ['Spores', 'BREWED', T, [['INSTINCT', 1], ['MOOD', 2]]],
    ['Cap', 'COOKED', 1, [['SLEEP', 3]]]
  ],
  'Forget-Me-Not': [
    ['Flowers', 'BREWED', T, [['NERVES', 3]]],
    ['Nectar', 'BREWED', T, [['BREATH', 2]], { rules: [['SUMMER_ONLY_PART', 'Nectar can only be Foraged in Summer.']] }]
  ],
  'Frog Slime': [
    ['Slime', 'BOILED', T, [['INFECTION', 2], ['PARASITE', 2]]]
  ],
  'Garden Mint': [
    ['Leaves', 'CHEWED', T, [['BREATH', 2], ['PAIN', 1]]],
    ['Stems', 'BREWED', T, [['STOMACH', 2]]]
  ],
  'Glass Silk': [
    ['Thread', 'USED', T, [['HIDE', 3], ['WOUND', 3]]]
  ],
  Goosegrass: [
    ['Seeds', 'GROUND AND BREWED', T, [['SLEEP', 1]]],
    ['Shoots', 'BOILED', T, [['HIDE', 1], ['PAIN', 1]]]
  ],
  'Haircap Moss': [
    ['Barbed Strands', 'BOILED', T, [['FEATHER', 2], ['HIDE', 1]]]
  ],
  Hidelendings: [
    ['Slivers', 'USED', T, [['HIDE', 2], ['WOUND', 2]], { uses: 3 }]
  ],
  Hoarhound: [
    ['Leafy Whorls', 'COOKED', D, [['PAIN', 2], ['BREATH', 3], ['FOUL', 4]]]
  ],
  Honeybees: [
    ['Pollen', 'ADDED', T, [['STOMACH', 1], ['MOOD', 2], ['FAIR', 1]]]
  ],
  'Horse Chestnuts': [
    ['Spiky Husks', 'USED', T, [['ELSEWHERE', 1]]],
    ['Perfect Conker', 'USED', 1, [['JOY', 2]]],
    ['Chestnuts', 'BOILED', D, [['STOMACH', 2]]],
    ['Chestnuts', 'COOKED', D, [['FAIR', 2]]]
  ],
  Horsetails: [
    ['Stems', 'BOILED', T, [['WOUND', 2], ['FEATHER', 3]], { alternativeGroup: 'covering-tag' }],
    ['Stems', 'BOILED', T, [['WOUND', 2], ['FUR', 3]], { alternativeGroup: 'covering-tag' }]
  ],
  'Iron Ore': [
    ['Iron Pebbles', 'BOILED IN CONSUMED REMEDIES', T, [['NERVES', 1], ['STOMACH', 3]], { rules: [['OREBEATER_TRADE', 'Can be given to the Orebeaters for 1 Reputation or 1 Trinket.']] }]
  ],
  Ironslug: [
    ['Guts', 'USED', T, [['PAIN', 2], ['BURN', 3]]]
  ],
  Lavender: [
    ['Flowers', 'CRUSHED', T, [['SLEEP', 2], ['NERVES', 2]]],
    ['Flowers', 'DISTILLED', T, [['SLEEP', 2], ['NERVES', 2], ['BURN', 3]]]
  ],
  Leech: [
    ['Leech', 'APPLIED', D, [['INFECTION', 2], ['POISON', 2]], { rules: [['CAUSES_MOOD_1', 'This preparation causes MOOD 1.']] }],
    ['Leech', 'GROUND AND APPLIED', D, [['HIDE', 2]]]
  ],
  Maggots: [
    ['Larvae', 'USED', D, [['INFECTION', 3], ['WOUND', 3]], { rules: [['CAUSES_INSTINCT_AND_NERVES_2', 'This preparation causes INSTINCT 2 and NERVES 2.']] }]
  ],
  Marigold: [
    ['Nectar', 'ADDED', T, [['FAIR', 1]]],
    ['Nectar', 'DISTILLED', T, [['FAIR', 2]]],
    ['Petals', 'CRUSHED', D, [['PAIN', 2], ['BURN', 2]]],
    ['Petals', 'USED', D, [['JOY', 2]]]
  ],
  Marshgold: [
    ['Flower', 'USED', D, [['ELSEWHERE', 2]]],
    ['Petals', 'BREWED', T, [['JOY', 2], ['BREATH', 2]]]
  ],
  Marshmallow: [
    ['Flower', 'BOILED', T, [['FEATHER', 1], ['FUR', 1], ['SCALE', 1]]],
    ['Root Sap', 'COOKED', T, [['STOMACH', 3], ['FAIR', 1]]]
  ],
  'Meadow Waxcap': [
    ['Shells', 'ADDED', T, [['STOMACH', 1]]],
    ['Shells', 'COOKED', T, [['STOMACH', 3], ['FAIR', 2]]]
  ],
  'Miracle Loaf': [
    ['Shells', 'CRUSHED', T, [['FEATHER', 3], ['FUR', 3], ['SCALE', 3], ['STOMACH', 1], ['FAIR', 4]]]
  ],
  'Musk Scrapings': [
    ['Shanelle #4', 'USED', 2, [['JOY', 3], ['FOUL', 10]], { uses: 5 }],
    ['FILTHY', 'USED', 2, [['BREATH', 3], ['FOUL', 10]], { uses: 5 }],
    ['Eau de Marmalade', 'USED', 2, [['SENSES', 3], ['FOUL', 10]], { uses: 5 }],
    ['Cabana Boi', 'USED', 2, [['ELSEWHERE', 3], ['FOUL', 10]], { uses: 5 }],
    ['Sappho', 'USED', 2, [['MOOD', 3], ['NERVES', 3], ['FOUL', 10]], { uses: 5 }]
  ],
  Nettles: [
    ['Leaves', 'BREWED', T, [['INFECTION', 1], ['PAIN', 1]]],
    ['Stems', 'CHEWED', T, [['STOMACH', 2]]]
  ],
  Nightshade: [
    ['Berries', 'GROUND AND BREWED', T, [['SENSES', 3], ['STOMACH', 1]], { rules: [['CAUSES_POISON_2', 'This preparation causes POISON 2.']] }]
  ],
  Oak: [
    ['Catkins', 'USED', T, [['JOY', 1]], { rules: [['SPRING_ONLY_PART', 'Catkins can only be Foraged in Spring.']] }],
    ['Acorns', 'GROUND AND COOKED', T, [['FAIR', 2]], { rules: [['AUTUMN_ONLY_PART', 'Acorns can only be Foraged in Autumn.']] }],
    ['Bark', 'CRUSHED AND APPLIED', D, [['HIDE', 3]]],
    ['Bark', 'GROUND AND BOILED', D, [['POISON', 3]]],
    ['Branch', 'USED', 1, [['WOUND', 2]]]
  ],
  'Orange Peel Fungus': [
    ['Petals', 'USED', T, [['JOY', 1]], { alternativeGroup: 'joy-or-elsewhere' }],
    ['Petals', 'USED', T, [['ELSEWHERE', 1]], { alternativeGroup: 'joy-or-elsewhere' }]
  ],
  Pearls: [
    ['Pearl', 'USED', T, [['ELSEWHERE', 3]], { alternativeGroup: 'elsewhere-or-joy' }],
    ['Pearl', 'USED', T, [['JOY', 2]], { alternativeGroup: 'elsewhere-or-joy' }]
  ],
  'Pox-Be-Gones': [
    ['Bitterbones', 'CRUSHED', T, [['INFECTION', 3], ['PARASITE', 1], ['FOUL', 2]]],
    ['Purgedew', 'ADDED', D, [['INFECTION', 1], ['PARASITE', 3], ['FOUL', 3]]]
  ],
  Redsap: [
    ['Bottled Sap', 'ADDED', 1, [['PAIN', 3], ['BREATH', 3], ['FOUL', 2]], { rules: [['CAUSES_SLEEP_2', 'This preparation causes SLEEP 2.']] }]
  ],
  Rhubarb: [
    ['Stems', 'CHEWED', T, [['FOUL', 2]]],
    ['Stems', 'COOKED', T, [['FAIR', 2]]],
    ['Fibres', 'CHEWED AND WASHED', T, [['WOUND', 1]]]
  ],
  Ribwort: [
    ['Seed Pods', 'CRUSHED', T, [['FAIR', 1]]],
    ['Leaves', 'CRUSHED', T, [['POISON', 1]], { rules: [['SUMMER_AUTUMN_ONLY_PART', 'Leaves can only be Foraged in Summer and Autumn.']] }],
    ['Leaves', 'DISTILLED', T, [['POISON', 3]], { rules: [['SUMMER_AUTUMN_ONLY_PART', 'Leaves can only be Foraged in Summer and Autumn.']] }]
  ],
  Rivermint: [
    ['Leaves', 'GROUND AND APPLIED', T, [['TEMPERATURE', 2]]],
    ['Leaves', 'BREWED', T, [['BREATH', 2]]],
    ['Leaves', 'DISTILLED', T, [['BREATH', 3]]],
    ['Stems', 'CHEWED', T, [['PAIN', 1]]],
    ['Stems', 'DISTILLED', T, [['PAIN', 2]]]
  ],
  'Rock Salt': [
    ['Salt', 'USED', D, [['INFECTION', 2], ['WOUND', 2]], { rules: [['CAUSES_PAIN_2', 'This preparation causes PAIN 2.']] }]
  ],
  Roses: [
    ['Petals', 'USED', T, [['JOY', 1]]],
    ['Petals', 'CRUSHED', T, [['BURN', 2], ['SENSES', 3]]],
    ['Rosehips', 'CRUSHED', T, [['HIDE', 2], ['SCALE', 2]]],
    ['Rosehips', 'DISTILLED', T, [['HIDE', 3], ['SCALE', 3]]]
  ],
  Shells: [
    ['Shells', 'BARTERED', D, [], { rules: [['BARTER_AS_THREE_TRINKETS', 'When Bartering, swap this shell for the equivalent of 3 Trinkets.']] }]
  ],
  'Silver Ore': [
    ['Silver Shards', 'GROUND AND APPLIED', T, [['INFECTION', 3], ['PARASITE', 2]], { rules: [['OREBEATER_TRADE', 'Can be given to the Orebeaters for 2 Reputation or 1 Trinket.']] }]
  ],
  Slugs: [
    ['Slugs', 'COOKED', D, [['FAIR', 2]]]
  ],
  'Small Fish': [
    ['Bones', 'USED', T, [['SCALE', 2]]],
    ['Meat', 'COOKED IN CONSUMED REMEDIES', 1, [['FAIR', 2]]],
    ['Scales', 'BOILED THEN APPLIED', T, [['HIDE', 1]]]
  ],
  Sourchits: [
    ['Pellets', 'CRUSHED', T, [['PAIN', 3]], { uses: 3, rules: [['CAUSES_SLEEP_1', 'This preparation causes SLEEP 1.']] }]
  ],
  Spiders: [
    ['Captured Flies', 'ADDED', T, [['FAIR', 1]]],
    ['Websilk', 'USED', T, [['WOUND', 1]]]
  ],
  Strawberries: [
    ['Berries', 'USED', D, [['FAIR', 2]]],
    ['Berries', 'COOKED', D, [['FAIR', 4]]],
    ['Flowers', 'BREWED', T, [['JOY', 2]]],
    ['Flowers', 'APPLIED', T, [['JOY', 2]]],
    ['Leaves', 'CRUSHED', T, [['HIDE', 1]]]
  ],
  Tansies: [
    ['Leaves', 'DIGESTED', T, [['PARASITE', 3], ['SENSES', 2], ['FOUL', 4]]],
    ['Stems', 'BREWED', D, [['INSTINCT', 1]]]
  ],
  Thistles: [
    ['Spike Head', 'APPLIED', T, [['FUR', 2]]],
    ['Nectar', 'ADDED', T, [['MOOD', 1]]]
  ],
  Titansorrel: [
    ['Leaves', 'ADDED', T, [['MOOD', 1], ['FOUL', 1]]],
    ['Roots', 'COOKED AND APPLIED', T, [['INFECTION', 1], ['PARASITE', 3]]]
  ],
  Toads: [
    ['Poison', 'ADDED', T, [['SENSES', 1], ['FOUL', 3]]],
    ['Poison', 'DISTILLED', T, [['SENSES', 3], ['FOUL', 7]]]
  ],
  Wasps: [
    ['Venom', 'APPLIED', T, [['PARASITE', 2]]],
    ['Venom', 'USED', T, [['SENSES', 2]]]
  ],
  Waychalk: [
    ['Chalk', 'CRUSHED', T, [['POISON', 3]]],
    ['Chalk', 'USED', T, [['ELSEWHERE', 3]]]
  ],
  Whiskerburner: [
    ['Burnjuice', 'APPLIED', D, [['INFECTION', 3]], { rules: [
      ['CAUSES_PAIN_2', 'This preparation causes PAIN 2.'],
      ['PLANT_DISTILLATION_SUBSTITUTE', 'Burnjuice can be used to DISTILL any Plant Reagent Part.']
    ] }]
  ],
  'White Willow': [
    ['Bark', 'CRUSHED', 1, [['INSTINCT', 1], ['SLEEP', 2]]],
    ['Catkins', 'BOILED', D, [['PAIN', 2]], { rules: [['SUMMER_ONLY_PART', 'Catkins can only be Foraged in Summer.']] }],
    ['Catkins', 'DISTILLED', D, [['PAIN', 3]], { rules: [['SUMMER_ONLY_PART', 'Catkins can only be Foraged in Summer.']] }]
  ],
  'Wild Garlic': [
    ['Leaves', 'CHEWED AND USED', D, [['FAIR', 1], ['TEMPERATURE', 1]]],
    ['Leaves', 'DISTILLED', D, [['TEMPERATURE', 2]]],
    ['Stems', 'CRUSHED', T, [['BREATH', 2]]]
  ],
  'Wild Violet': [
    ['Flowers', 'DIGESTED', T, [['PAIN', 1]]],
    ['Flowers', 'APPLIED', T, [['PARASITE', 1], ['FEATHER', 2]]],
    ['Flowers', 'DISTILLED', T, [['PARASITE', 3]]],
    ['Leaves', 'CHEWED', T, [['SENSES', 2]]]
  ],
  Woundwort: [
    ['Roots', 'CRUSHED', D, [['INSTINCT', 3]]],
    ['Flowers', 'BOILED', T, [['NERVES', 2]]]
  ],
  Yarrow: [
    ['Flowers', 'BOILED', T, [['HIDE', 2], ['PAIN', 1], ['WOUND', 1]]],
    ['Flowers', 'DISTILLED', T, [['HIDE', 3], ['PAIN', 2], ['WOUND', 1]]],
    ['Leaves', 'DIGESTED', T, [['INFECTION', 2]]]
  ],
  'Yellow Wort': [
    ['Flower', 'USED', T, [['JOY', 2]]],
    ['Leaves', 'CRUSHED', T, [['PARASITE', 1], ['HIDE', 1]]]
  ]
};

const slugify = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const toolsForMethod = (method: string): PreparationToolId[] => {
  const tools: PreparationToolId[] = [];
  if (/GROUND|CRUSHED/.test(method)) tools.push('mortar-and-pestle');
  if (/BOILED|BREWED/.test(method)) tools.push('camp-kettle');
  if (/CHEWED|DIGESTED/.test(method)) tools.push('teeth');
  if (/ADDED|APPLIED/.test(method)) tools.push('paws');
  if (/COOKED/.test(method)) tools.push('copper-frying-pan');
  if (/DISTILLED/.test(method)) tools.push('big-iron-cauldron');
  return tools.length > 0 ? tools : ['none'];
};

const structuredRule = ([code, description]: RuleSpec): StructuredRuleEffect => ({
  support: 'structured-but-not-executed',
  effect: { type: 'customEffect', code, description }
});

export const CANONICAL_PREPARATIONS: Record<string, ReagentPreparation[]> = Object.fromEntries(
  Object.entries(S).map(([reagent, preparations]) => [
    reagent,
    preparations.map(([part, method, weight, tags, options], index) => {
      const requiredTools = toolsForMethod(method);
      const sourcePage = (canonicalAvailability as Record<string, { sourcePage: number }>)[reagent]?.sourcePage;
      if (!sourcePage) throw new Error(`Missing preparation source page for ${reagent}`);
      return {
        id: `${slugify(reagent)}-${slugify(part)}-${slugify(method)}-${index + 1}`,
        name: part,
        method,
        requiredTool: requiredTools[0],
        requiredTools,
        weight,
        uses: options?.uses || 1,
        tags: tags.map(([tag, value]) => ({ tag, value })),
        specialRules: (options?.rules || []).map(structuredRule),
        alternativeGroup: options?.alternativeGroup,
        ...canonicalMetadata(sourcePage)
      };
    })
  ])
);

export const CANONICAL_PREPARATION_REAGENT_COUNT = Object.keys(CANONICAL_PREPARATIONS).length;
