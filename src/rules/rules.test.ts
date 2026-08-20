import { describe, expect, it } from 'vitest';
import {
  AILMENTS,
  AILMENT_MONARCH_RULES,
  ALMANACK_TOOLS,
  CANONICAL_PREPARATIONS,
  CURRENT_SCHEMA_VERSION,
  ENCOUNTERS,
  FORAGING_ENCOUNTERS,
  PRINTED_EFFECT_BY_OWNER,
  REAGENTS,
  REGIONS,
  RULESETS,
  RULE_TAGS,
  SEASONS,
  SOCIAL_ENCOUNTERS,
  TAG_DEFINITIONS,
  TOOLS,
  TRAVEL_ENCOUNTERS,
  findEncounter,
  getRuleCardValue,
  getTableLookupKey,
  migrateSavedRulesState
} from './index';
import type { LegacyBagItem } from './migrations';
import type { CardSuit, EncounterDefinition, RequirementExpression, Season } from './types';

const uniqueSize = (values: string[]) => new Set(values).size;

const requirementTags = (requirement: RequirementExpression): string[] => {
  if (requirement.kind === 'tag') return [requirement.tag];
  if (requirement.kind === 'special') return [];
  if (requirement.kind === 'alternatives') return requirement.alternatives.flatMap(requirementTags);
  return requirement.requirements.flatMap(requirementTags);
};

const cardForKey = (key: string): number => ({
  'A&2': 1,
  '3&4': 3,
  '5&6': 5,
  '7&8': 7,
  '9&10': 9,
  A: 1,
  J: 11,
  M: 13
}[key] ?? Number(key));

describe('central card rules', () => {
  it('[CORE-001] treats both queens and kings as monarch value 12', () => {
    expect(getRuleCardValue(12)).toBe(12);
    expect(getRuleCardValue(13)).toBe(12);
    expect(getRuleCardValue({ val: 13, suit: '♠' }, 'barter')).toBe(12);
  });

  it('[TABLE-001/TABLE-004/TABLE-005] uses rulebook table buckets', () => {
    expect(getTableLookupKey(1, 'travel')).toBe('A&2');
    expect(getTableLookupKey(10, 'travel')).toBe('9&10');
    expect(getTableLookupKey(11, 'travel')).toBe('J');
    expect(getTableLookupKey(12, 'travel')).toBe('M');
    expect(getTableLookupKey(13, 'travel')).toBe('M');
    expect(getTableLookupKey(13, 'foraging')).toBe('M');
    expect(getTableLookupKey({ val: 7, suit: '♦' }, 'social')).toBe('♦');
  });
});

describe('rulesets and save migration', () => {
  it('[CORE-002] keeps the original ruleset free of campaign house rules', () => {
    expect(Object.values(RULESETS['original-1e-3p'].houseRules).every(value => value === false)).toBe(true);
    expect(Object.values(RULESETS['legacy-campaign'].houseRules).every(value => value === true)).toBe(true);
    expect(RULESETS.sandbox.allowRecoveryTools).toBe(true);
  });

  it('[SAVE-005] loads metadata-free saves in compatibility mode without dropping bag fields', () => {
    const saved = {
      reputation: 17,
      bag: [{ id: 'old-mint', name: 'Garden Mint BOILED', type: 'reagent', qty: 2, customNote: 'keep me' }]
    };
    const migrated = migrateSavedRulesState(saved);
    const item = migrated.bag?.[0] as LegacyBagItem | undefined;

    expect(migrated.rulesetId).toBe('legacy-campaign');
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.reputation).toBe(17);
    expect(item?.id).toBe('old-mint');
    expect(item?.qty).toBe(2);
    expect(item?.customNote).toBe('keep me');
    expect(item?.canonicalReagentId).toBe('reagent-garden-mint');
    expect(item?.preparationId).toBeTruthy();
    expect(item?.usesRemaining).toBeGreaterThan(0);
  });
});

describe('canonical reagent data', () => {
  it('[TABLE-003] contains exactly 83 unique, fully keyed reagents', () => {
    expect(REAGENTS).toHaveLength(83);
    expect(uniqueSize(REAGENTS.map(row => row.id))).toBe(83);
    expect(uniqueSize(REAGENTS.map(row => row.canonicalName))).toBe(83);
    expect(Object.keys(CANONICAL_PREPARATIONS).sort()).toEqual(REAGENTS.map(row => row.canonicalName).sort());
    expect(REAGENTS.map(row => row.canonicalName)).toEqual(expect.arrayContaining(['Woundwort', 'Yarrow', 'Yellow Wort']));
  });

  it('[REMEDY-001/REMEDY-005/TABLE-003] validates availability and every preparation field', () => {
    const allowedAvailability = ['Common', 'Rare', 'Unavailable'];
    const allowedTools = ['none', 'belt-knife', 'mortar-and-pestle', 'camp-kettle', 'teeth', 'paws', 'copper-frying-pan', 'big-iron-cauldron'];
    const allowedTypes = ['PLANT', 'ANIMAL', 'INSECT', 'EARTH', 'TITAN'];

    REAGENTS.forEach(reagent => {
      expect(allowedTypes).toContain(reagent.type);
      expect(reagent.baseRarity).toBeGreaterThan(0);
      expect(reagent.baseRarity).toBeLessThanOrEqual(11);
      expect(reagent.sourcePage).toBeGreaterThanOrEqual(132);
      expect(reagent.sourcePage).toBeLessThanOrEqual(151);
      expect(Object.keys(reagent.regionAvailability)).toHaveLength(6);
      expect(Object.keys(reagent.seasonAvailability)).toHaveLength(4);
      expect(Object.values(reagent.regionAvailability).every(value => allowedAvailability.includes(value))).toBe(true);
      expect(Object.values(reagent.seasonAvailability).every(value => allowedAvailability.includes(value))).toBe(true);
      expect(reagent.preparations.length, reagent.canonicalName).toBeGreaterThan(0);

      reagent.preparations.forEach(preparation => {
        expect(preparation.id).toBeTruthy();
        expect(preparation.name).toBeTruthy();
        expect(preparation.method).toBeTruthy();
        expect(allowedTools).toContain(preparation.requiredTool);
        expect(preparation.requiredTools.length).toBeGreaterThan(0);
        preparation.requiredTools.forEach(tool => expect(allowedTools).toContain(tool));
        expect(preparation.weight).toBeGreaterThan(0);
        expect(preparation.uses).toBeGreaterThan(0);
        expect(Array.isArray(preparation.tags)).toBe(true);
        expect(preparation.tags.length + preparation.specialRules.length).toBeGreaterThan(0);
        preparation.tags.forEach(tag => {
          expect(RULE_TAGS).toContain(tag.tag);
          expect(tag.value).toBeGreaterThan(0);
        });
      });
    });

    const allAvailability = REAGENTS.flatMap(reagent => [
      ...Object.values(reagent.regionAvailability),
      ...Object.values(reagent.seasonAvailability)
    ]);
    expect(new Set(allAvailability)).toEqual(new Set(allowedAvailability));
    expect(REAGENTS.find(row => row.canonicalName === 'Animal Sheddings')?.regionAvailability).toMatchObject({
      Bog: 'Common', Loch: 'Unavailable', Mountain: 'Rare'
    });
    expect(REAGENTS.find(row => row.canonicalName === 'Silver Ore')?.baseRarity).toBe(11);
  });

  it('[REMEDY-005/REMEDY-006/TABLE-003] locks parser corrections, side effects, alternatives and compound tools', () => {
    const byName = (name: string) => REAGENTS.find(row => row.canonicalName === name)!;
    const tagPairs = (name: string) => byName(name).preparations.flatMap(preparation =>
      preparation.tags.map(tag => `${tag.tag}:${tag.value}`)
    );

    expect(tagPairs('Butterfly')).toEqual(expect.arrayContaining(['SLEEP:3', 'JOY:2']));
    expect(tagPairs('Miracle Loaf')).toEqual(expect.arrayContaining(['SCALE:3', 'STOMACH:1', 'FAIR:4']));
    expect(tagPairs('Leech')).toEqual(expect.arrayContaining(['INFECTION:2', 'POISON:2', 'HIDE:2']));
    expect(byName('Leech').preparations[0].specialRules.some(rule => rule.effect.type === 'customEffect' && rule.effect.code === 'CAUSES_MOOD_1')).toBe(true);
    expect(byName('Musk Scrapings').preparations.every(preparation => preparation.weight === 2 && preparation.uses === 5)).toBe(true);
    expect(byName('Musk Scrapings').preparations.every(preparation => preparation.tags.some(tag => tag.tag === 'FOUL' && tag.value === 10))).toBe(true);
    expect(byName('Bird Leavings').preparations[0].requiredTools).toEqual(['mortar-and-pestle', 'copper-frying-pan']);
    expect(byName('Orange Peel Fungus').preparations.map(row => row.alternativeGroup)).toEqual(['joy-or-elsewhere', 'joy-or-elsewhere']);
    expect(byName('Frog Slime').specialAcquisition).toHaveLength(0);
    expect(byName('Wild Garlic').specialAcquisition).toHaveLength(0);
  });
});

describe('canonical ailment data', () => {
  it('[AILMENT-001] contains all 45 unique ailments in the printed severity distribution', () => {
    expect(AILMENTS).toHaveLength(45);
    expect(uniqueSize(AILMENTS.map(row => row.id))).toBe(45);
    expect(uniqueSize(AILMENTS.map(row => row.canonicalName))).toBe(45);
    expect(AILMENTS.filter(row => row.severity === 'lesser')).toHaveLength(12);
    expect(AILMENTS.filter(row => row.severity === 'intermediate')).toHaveLength(11);
    expect(AILMENTS.filter(row => row.severity === 'severe')).toHaveLength(11);
    expect(AILMENTS.filter(row => row.severity === 'dire')).toHaveLength(11);
    expect(AILMENTS.some(row => row.canonicalName === 'Bite the Hand that Cures')).toBe(true);
  });

  it('[AILMENT-002/AILMENT-004/PATIENT-004] keeps multi-ailment and monarch rules explicit', () => {
    expect(AILMENTS.find(row => row.canonicalName === 'Fight Marks')?.repeatCount).toBe(2);
    expect(AILMENTS.find(row => row.canonicalName === 'Groundhog Syndrome')?.repeatCount).toBe(3);
    expect(AILMENTS.find(row => row.canonicalName === 'Soured Dough')?.repeatCount).toBe(4);
    expect(AILMENT_MONARCH_RULES.intermediate).toEqual({ kind: 'drawMultiple', count: 2, severity: 'lesser' });
    expect(AILMENT_MONARCH_RULES.severe).toEqual({ kind: 'drawMultiple', count: 2, severity: 'intermediate' });
    expect(AILMENT_MONARCH_RULES.dire).toEqual({ kind: 'drawMultiple', count: 2, severity: 'severe' });
  });

  it('[AILMENT-003/AILMENT-007] does not invent a Trinket Outcome where the printed ailment has none', () => {
    const dullsweats = AILMENTS.find(row => row.canonicalName === 'Dullsweats');
    expect(dullsweats?.successEffects).toEqual([]);
    expect(PRINTED_EFFECT_BY_OWNER.get(dullsweats!.id)?.supportedTriggers).toEqual(['treatment-failure']);
  });

  it('[AILMENT-003/AILMENT-006] preserves boolean and special requirement structures with registered tags', () => {
    AILMENTS.forEach(ailment => {
      requirementTags(ailment.requirements).forEach(tag => expect(RULE_TAGS).toContain(tag));
    });
    expect(AILMENTS.find(row => row.canonicalName === 'Crestfallen')?.requirements.kind).toBe('alternatives');
    expect(AILMENTS.find(row => row.canonicalName === 'Mawfoam')?.requirements).toMatchObject({ kind: 'allOf' });
    expect(AILMENTS.find(row => row.canonicalName === 'Wingbreak')?.requirements).toMatchObject({ kind: 'allOf' });
  });
});

describe('canonical encounter indices', () => {
  it('[TABLE-001/TABLE-004/TABLE-005] contains complete indexed table sizes with unique ids', () => {
    expect(TRAVEL_ENCOUNTERS).toHaveLength(103);
    expect(FORAGING_ENCOUNTERS).toHaveLength(144);
    expect(SOCIAL_ENCOUNTERS).toHaveLength(66);
    expect(ENCOUNTERS).toHaveLength(313);
    expect(uniqueSize(ENCOUNTERS.map(row => row.id))).toBe(313);
  });

  it('[TABLE-001/TABLE-004/TABLE-005] uses valid region, season, suit and card keys', () => {
    const travelKeys = new Set(['A&2', '3&4', '5&6', '7&8', '9&10', 'J', 'M']);
    const foragingKeys = new Set(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'M']);
    const seasons = new Set(['Spring', 'Summer', 'Autumn', 'Winter']);
    const suits = new Set(['♥', '♦', '♣', '♠']);

    TRAVEL_ENCOUNTERS.forEach(entry => expect(travelKeys.has(entry.cardKey || '')).toBe(true));
    FORAGING_ENCOUNTERS.forEach(entry => expect(foragingKeys.has(entry.cardKey || '')).toBe(true));
    SOCIAL_ENCOUNTERS.forEach(entry => {
      expect(suits.has(entry.suit || '')).toBe(true);
      if (entry.season) expect(seasons.has(entry.season)).toBe(true);
    });

    ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Soar'].forEach(region => {
      expect(TRAVEL_ENCOUNTERS.filter(entry => entry.region === region)).toHaveLength(16);
    });
    expect(TRAVEL_ENCOUNTERS.filter(entry => entry.region === 'Titan')).toHaveLength(7);
    ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan'].forEach(region => {
      expect(FORAGING_ENCOUNTERS.filter(entry => entry.region === region)).toHaveLength(24);
    });
  });

  it('[TRAVEL-008/FORAGE-008] round-trips every travel and foraging index through the selector', () => {
    [...TRAVEL_ENCOUNTERS, ...FORAGING_ENCOUNTERS].forEach(entry => {
      const found = findEncounter({
        encounterType: entry.encounterType,
        region: entry.region,
        season: entry.season,
        card: cardForKey(entry.cardKey || '')
      });
      expect(found?.id, entry.id).toBe(entry.id);
    });
  });

  it('[TABLE-005] round-trips every social index by suit and location context', () => {
    SOCIAL_ENCOUNTERS.forEach(entry => {
      const found = findEncounter({
        encounterType: 'social',
        region: entry.region,
        season: entry.season as Season | undefined,
        locationType: entry.locationType,
        city: entry.city,
        card: { val: 1, suit: entry.suit as CardSuit }
      });
      expect(found?.id, entry.id).toBe(entry.id);
    });
  });

  it('[TABLE-001/TABLE-004/TABLE-005] keeps source metadata and support status on every encounter', () => {
    const validSupport: EncounterDefinition['support'][] = ['implemented', 'structured-but-not-executed', 'manual-only', 'ambiguous'];
    ENCOUNTERS.forEach(entry => {
      expect(entry.sourcePage).toBeGreaterThanOrEqual(74);
      expect(entry.sourcePage).toBeLessThanOrEqual(213);
      expect(entry.title).toBeTruthy();
      expect(entry.prompt).toBeTruthy();
      expect(validSupport).toContain(entry.support);
      expect(entry.source.page).toBe(entry.sourcePage);
      expect(entry.rulebookEdition).toBe(entry.source.edition);
    });
  });
});

describe('independent canonical registries', () => {
  it('[CHARACTER-003/ALMANACK-005/TOOL-001] contains five basic and 18 printed Almanack tool entries', () => {
    expect(TOOLS.filter(tool => tool.category === 'basic')).toHaveLength(5);
    expect(ALMANACK_TOOLS).toHaveLength(18);
    expect(TOOLS.some(tool => tool.id === 'titan-thingamabob')).toBe(true);
  });

  it('[REMEDY-001/TABLE-003] centralizes regions, seasons, and tags with rulebook sources', () => {
    expect(REGIONS.map(region => region.id)).toEqual(['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan', 'Soar']);
    expect(SEASONS.map(season => season.id)).toEqual(['Spring', 'Summer', 'Autumn', 'Winter']);
    expect(TAG_DEFINITIONS.map(tag => tag.id)).toEqual(RULE_TAGS);
    [...REGIONS, ...SEASONS, ...TAG_DEFINITIONS].forEach(record => {
      expect(record.source.kind).toBe('rulebook');
      expect(record.source.page).toBe(record.sourcePage);
    });
  });
});
