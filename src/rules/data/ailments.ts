import { GAME_DATA } from '../../gameData';
import { normalizeRuleTag } from '../tags';
import { canonicalMetadata } from '../source';
import type {
  AilmentDefinition,
  AilmentSeverity,
  MultiAilmentRule,
  RequirementExpression,
  StructuredRuleEffect
} from '../types';

const EXPECTED: Record<AilmentSeverity, Array<[string, number]>> = {
  lesser: [
    ['Anxious Scratching', 104], ['Dullsweats', 106], ['Firstfever', 106], ['Fond Farewell', 106],
    ['Forgeclawed', 107], ['Monthly Chore', 110], ['Paw Rot', 110], ['Safety Stench', 111],
    ['Sunstruck', 113], ['The Runs', 113], ['Tickbitten, Twice Shy', 113], ['Waen Drops', 114]
  ],
  intermediate: [
    ['Blocked Ears', 105], ['Brand Care', 105], ['Crestfallen', 106], ["Forager's Twitch", 107],
    ['Midge Munched', 109], ['Migration Migraine', 109], ['Night Shift', 110], ['Soured Dough', 112],
    ['Stingshock', 112], ['Trowel Trouble', 114], ['Wormridden', 115]
  ],
  severe: [
    ['Bad Idea', 104], ['Bite the Hand that Cures', 104], ['Bloodthirst', 105],
    ['Broken Beaks and Thinning Fangs', 105], ['Herbivorous Tendencies', 108], ['Nervefright', 110],
    ['Pinned by Pine', 111], ["Quagmire's Scale", 111], ['Seasonshift', 111], ['Smokesnout', 112], ['Snail Ails', 113]
  ],
  dire: [
    ['Fight Marks', 106], ['Foul Deceiver', 107], ['Groundhog Syndrome', 107], ['Hunted', 108],
    ['Living With a Black Beast', 108], ['Lockjaw', 108], ['Long Drop', 109], ['Mawfoam', 109],
    ['Titan Touched', 114], ['Wake', 115], ['Wingbreak', 115]
  ]
};

const aliases: Record<string, string> = {
  Forgeclawed: 'Forge Clawed',
  'Trowel Trouble': 'Trowel Troubles',
  'Living With a Black Beast': 'Living With a Black Beast',
  'Long Drop': 'Long Drop'
};

const slugify = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const englishName = (name: string): string => name.match(/\(([^()]*)\)\s*$/)?.[1]?.trim() || name.trim();
const normalizeName = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '');

const requirementFromText = (text: string): RequirementExpression => {
  const pairs = [...text.toUpperCase().matchAll(/([A-Z]+)\s*(\d+)/g)]
    .map(match => {
      const tag = normalizeRuleTag(match[1]);
      return tag ? { kind: 'tag' as const, tag, threshold: Number(match[2]) } : null;
    })
    .filter((value): value is Extract<RequirementExpression, { kind: 'tag' }> => value !== null);
  if (pairs.length === 0) return { kind: 'special', code: 'MANUAL_REQUIREMENT', description: text };
  return pairs.length === 1 ? pairs[0] : { kind: 'allOf', requirements: pairs };
};

const tagRequirement = (tag: Parameters<typeof normalizeRuleTag>[0], threshold: number): RequirementExpression => {
  const normalized = normalizeRuleTag(tag);
  if (!normalized) throw new Error(`Unknown requirement tag: ${tag}`);
  return { kind: 'tag', tag: normalized, threshold };
};

const allOf = (...requirements: RequirementExpression[]): RequirementExpression => ({ kind: 'allOf', requirements });
const anyOf = (...requirements: RequirementExpression[]): RequirementExpression => ({ kind: 'anyOf', requirements });

const REQUIREMENT_OVERRIDES: Record<string, RequirementExpression> = {
  'Anxious Scratching': allOf(
    tagRequirement('MOOD', 2),
    anyOf(tagRequirement('FUR', 1), tagRequirement('FEATHER', 1), tagRequirement('SCALE', 1))
  ),
  Crestfallen: {
    kind: 'alternatives',
    alternatives: [
      allOf(tagRequirement('FEATHER', 2), tagRequirement('NERVES', 2), tagRequirement('INSTINCT', 2)),
      allOf(
        tagRequirement('FEATHER', 2),
        tagRequirement('JOY', 2),
        { kind: 'special', code: 'BRIGHTLY_COLOURED_PLANT', description: 'Include a brightly coloured Plant Reagent.' }
      )
    ]
  },
  Mawfoam: allOf(
    tagRequirement('POISON', 3),
    tagRequirement('SENSES', 3),
    tagRequirement('WOUND', 2),
    anyOf(tagRequirement('INSTINCT', 2), tagRequirement('MOOD', 2))
  ),
  'Safety Stench': allOf(
    tagRequirement('SENSES', 1),
    anyOf(tagRequirement('NERVES', 1), tagRequirement('INSTINCT', 1))
  ),
  Sunstruck: allOf(
    tagRequirement('SLEEP', 1),
    tagRequirement('SENSES', 2),
    anyOf(tagRequirement('FEATHER', 1), tagRequirement('HIDE', 1))
  ),
  'Tickbitten, Twice Shy': allOf(
    tagRequirement('PARASITE', 1),
    anyOf(tagRequirement('FUR', 2), tagRequirement('FEATHER', 2))
  ),
  Wake: allOf(
    { kind: 'special', code: 'MULTIPLE_TAG_DOSES', description: 'Provide ELSEWHERE 3 and 2, plus JOY 3 and 2, as separate listed requirements.' },
    tagRequirement('FAIR', 4)
  ),
  Wingbreak: allOf(
    tagRequirement('FEATHER', 3),
    tagRequirement('TEMPERATURE', 3),
    tagRequirement('MOOD', 2),
    tagRequirement('PAIN', 2),
    { kind: 'special', code: 'BONE_SETTING_ITEM', description: 'Provide something long and sturdy to set the bone, such as Oak (Branch), or donate a proper tool.' }
  )
};

const specialRule = (code: string, description: string): StructuredRuleEffect => ({
  support: 'structured-but-not-executed',
  effect: { type: 'customEffect', code, description }
});

const expectedRows = Object.entries(EXPECTED).flatMap(([severity, rows]) =>
  rows.map(([canonicalName, sourcePage]) => ({ severity: severity as AilmentSeverity, canonicalName, sourcePage }))
);

const legacyByName = new Map<string, (typeof GAME_DATA.ailments)[number]>();
GAME_DATA.ailments.forEach(row => {
  const name = englishName(row.name);
  if (!legacyByName.has(normalizeName(name))) legacyByName.set(normalizeName(name), row);
});

export const AILMENTS: AilmentDefinition[] = expectedRows.map(expected => {
  const expectedAlias = aliases[expected.canonicalName] || expected.canonicalName;
  const legacy = legacyByName.get(normalizeName(expectedAlias));
  const isMissingBite = expected.canonicalName === 'Bite the Hand that Cures';
  const requirements = isMissingBite
    ? { kind: 'special', code: 'DRAW_LOWER_AILMENT_AND_FIND_PATIENT', description: 'Draw a Lesser or Intermediate ailment, then find the patient as BR 8 in the current or adjacent location.' } as RequirementExpression
    : REQUIREMENT_OVERRIDES[expected.canonicalName] || requirementFromText(legacy?.tags || '');
  const specialRules: StructuredRuleEffect[] = [];
  let repeatCount: number | undefined;
  if (expected.canonicalName === 'Fight Marks') {
    repeatCount = 2;
    specialRules.push(specialRule('SEPARATE_PATIENT_TIMERS', 'Treat as two ailments with separate Timers.'));
  }
  if (expected.canonicalName === 'Groundhog Syndrome') {
    repeatCount = 3;
    specialRules.push(specialRule('THREE_AILMENTS_AND_SEASONAL_MAP_BANS', 'Treat three ailments and retain the seasonal map consequences.'));
  }
  if (expected.canonicalName === 'Soured Dough') {
    repeatCount = 4;
    specialRules.push(specialRule('FOUR_SEPARATE_TIMERS', 'Treat as four ailments with four separate Timers.'));
  }
  if (expected.canonicalName === 'Stingshock') {
    specialRules.push(specialRule('OPTIONAL_DOUBLE_DOSE', 'Two remedy doses grant the Emergency Averted outcome.'));
  }
  if (isMissingBite) {
    specialRules.push(specialRule('FIND_PATIENT_BR_8', 'The patient is treated as a BR 8 target before administering the remedy.'));
  }
  return {
    id: `ailment-${slugify(expected.canonicalName)}`,
    canonicalName: expected.canonicalName,
    displayName: legacy?.name || '치료자를 무는 환자 (Bite the Hand that Cures)',
    severity: expected.severity,
    timer: isMissingBite ? 12 : legacy?.timer || 12,
    requirements,
    successEffects: legacy?.outcome
      ? [specialRule('AILMENT_OUTCOME', legacy.outcome)]
      : [],
    failureEffects: legacy?.consequence
      ? [specialRule('AILMENT_CONSEQUENCE', legacy.consequence)]
      : isMissingBite
        ? [specialRule('LAUGHING_STOCK', 'Apply the Laughing Stock consequence from p104.')]
        : [],
    specialRules,
    allowsMultiple: repeatCount !== undefined,
    repeatCount,
    multiAilmentRule: repeatCount ? { kind: 'repeat', count: repeatCount } : undefined,
    ...canonicalMetadata(expected.sourcePage),
    support: 'structured-but-not-executed'
  };
});

export const AILMENT_MONARCH_RULES: Record<Exclude<AilmentSeverity, 'lesser'>, MultiAilmentRule> = {
  intermediate: { kind: 'drawMultiple', count: 2, severity: 'lesser' },
  severe: { kind: 'drawMultiple', count: 2, severity: 'intermediate' },
  dire: { kind: 'drawMultiple', count: 2, severity: 'severe' }
};

export const AILMENT_BY_ID = new Map(AILMENTS.map(ailment => [ailment.id, ailment]));
