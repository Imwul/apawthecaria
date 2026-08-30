import { canonicalMetadata } from '../source';
import type { AilmentSeverity, CardSuit, RequirementExpression, RuleTag } from '../types';

export type EncounterRemedyDeadline =
  | 'immediate'
  | 'before-move-on'
  | 'before-highest-active-timer'
  | 'until-treated';

export type EncounterRemedyTriggerCondition =
  | 'always'
  | 'club-or-spade'
  | 'spade'
  | 'self-card-lower'
  | 'no-soothing-supply'
  | 'swimming'
  | 'non-aquatic'
  | 'not-monarch';

export interface EncounterRemedyOutcomeMetadata {
  code: string;
  description: string;
}

export interface EncounterRemedyDoseRequirement {
  id: string;
  requirement: RequirementExpression;
}

export interface EncounterRemedyDefinition {
  id: string;
  /** ID persisted on PatientAilmentState. Canonical Ailments keep their canonical ID. */
  patientAilmentId: string;
  canonicalAilmentId: string | null;
  canonicalName: string;
  displayName: string;
  sourcePage: number;
  source: ReturnType<typeof canonicalMetadata>['source'];
  rulebookEdition: ReturnType<typeof canonicalMetadata>['rulebookEdition'];
  encounterIds: readonly string[];
  choiceId?: string;
  trigger: {
    condition: EncounterRemedyTriggerCondition;
    cardCount?: 1 | 2;
    suits?: readonly CardSuit[];
    afterEveryEncounterUntilMoveOn?: boolean;
  };
  patientKind: 'apothecary' | 'local-beast' | 'bear-lord' | 'tadpoles';
  /**
   * Compatibility value for PatientAilmentState. Special encounter Remedies do
   * not acquire a printed Severity from this value and never use normal rewards.
   */
  stateSeverity: AilmentSeverity;
  requirements: RequirementExpression;
  /** Separate doses which must not be collapsed into one aggregate tag total. */
  requirementDoses?: readonly EncounterRemedyDoseRequirement[];
  timerHours: number | null;
  deadline?: EncounterRemedyDeadline;
  success: EncounterRemedyOutcomeMetadata | null;
  failure: EncounterRemedyOutcomeMetadata | null;
}

const tag = (tagName: RuleTag, threshold: number): RequirementExpression => ({
  kind: 'tag',
  tag: tagName,
  threshold
});

const allOf = (...requirements: RequirementExpression[]): RequirementExpression => ({
  kind: 'allOf',
  requirements
});

const fixed = (
  definition: Omit<EncounterRemedyDefinition, 'rulebookEdition' | 'source'>
): EncounterRemedyDefinition => ({ ...definition, ...canonicalMetadata(definition.sourcePage) });

/**
 * Fixed Remedies printed inside Encounter outcomes. They are deliberately kept
 * out of AILMENTS: they do not belong to the normal Ailment draw tables and
 * several have no Severity or independent Timer in the rulebook.
 */
export const ENCOUNTER_REMEDIES: readonly EncounterRemedyDefinition[] = [
  fixed({
    id: 'encounter-remedy-talons-trauma',
    patientAilmentId: 'encounter-remedy-talons-trauma',
    canonicalAilmentId: null,
    canonicalName: 'Talons Trauma',
    displayName: 'Talons · 추락상',
    sourcePage: 95,
    encounterIds: [
      'travel-soar-9-10-spring',
      'travel-soar-9-10-summer',
      'travel-soar-9-10-autumn',
      'travel-soar-9-10-winter'
    ],
    choiceId: 'outmanoeuvre',
    trigger: { condition: 'club-or-spade', cardCount: 1, suits: ['♣', '♠'] },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: allOf(tag('WOUND', 3), tag('INFECTION', 2), tag('PAIN', 2)),
    timerHours: 12,
    success: null,
    failure: { code: 'APOTHECARY_DIES', description: 'If the Remedy is not created before the Timer ends, the Apothecary dies.' }
  }),
  fixed({
    id: 'encounter-remedy-titan-rash',
    patientAilmentId: 'encounter-remedy-titan-rash',
    canonicalAilmentId: null,
    canonicalName: 'Titan Rash',
    displayName: 'Titan Rash (티탄 발진)',
    sourcePage: 99,
    encounterIds: ['travel-titan-7-8'],
    choiceId: 'duty-calls',
    trigger: { condition: 'always' },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: allOf(tag('HIDE', 2), tag('POISON', 1)),
    timerHours: null,
    deadline: 'until-treated',
    success: { code: 'RESTORE_FORAGING_POINTS', description: 'Once the rash is solved, the Apothecary may gain Foraging Points again.' },
    failure: null
  }),
  fixed({
    id: 'encounter-remedy-fangs-with-wings',
    patientAilmentId: 'encounter-remedy-fangs-with-wings',
    canonicalAilmentId: null,
    canonicalName: 'Fangs With Wings',
    displayName: 'Fangs With Wings (날개 달린 송곳니)',
    sourcePage: 157,
    encounterIds: ['foraging-bog-m-summer'],
    choiceId: 'check-for-soothing-supplies',
    trigger: { condition: 'no-soothing-supply' },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: allOf(tag('HIDE', 2), tag('POISON', 1)),
    timerHours: 8,
    success: null,
    failure: { code: 'MUNCHED', description: 'The unbearable itching makes the Apothecary say something very rude to their Familiar.' }
  }),
  fixed({
    id: 'encounter-remedy-thousand-biters',
    patientAilmentId: 'encounter-remedy-thousand-biters',
    canonicalAilmentId: null,
    canonicalName: 'A Thousand Thousand Biters',
    displayName: 'A Thousand Thousand Biters (수천수만의 등에)',
    sourcePage: 157,
    encounterIds: ['foraging-bog-9-summer'],
    choiceId: 'run',
    trigger: { condition: 'self-card-lower', cardCount: 2 },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: allOf(tag('HIDE', 2), tag('POISON', 1)),
    timerHours: null,
    deadline: 'before-move-on',
    success: null,
    failure: { code: 'BITING_MOOD', description: 'If still untreated at the next Move On, lose 1 Guild Reputation.' }
  }),
  fixed({
    id: 'encounter-remedy-sick-tadpoles',
    patientAilmentId: 'encounter-remedy-sick-tadpoles',
    canonicalAilmentId: null,
    canonicalName: 'Sick Tadpoles',
    displayName: 'Sick Tadpoles (아픈 올챙이들)',
    sourcePage: 169,
    encounterIds: ['foraging-loch-9-summer'],
    choiceId: 'tadpediatrician',
    trigger: { condition: 'club-or-spade', cardCount: 1, suits: ['♣', '♠'] },
    patientKind: 'tadpoles',
    stateSeverity: 'lesser',
    requirements: allOf(tag('TEMPERATURE', 2), tag('INFECTION', 1)),
    timerHours: null,
    deadline: 'before-highest-active-timer',
    success: { code: 'HELPING_PAW', description: 'Curing the tadpoles grants 2 Guild Reputation and 2 Trinkets.' },
    failure: null
  }),
  fixed({
    id: 'encounter-remedy-boreal-dancer-cut',
    patientAilmentId: 'encounter-remedy-boreal-dancer-cut',
    canonicalAilmentId: null,
    canonicalName: 'Blades of the Boreal Dancer Cut',
    displayName: 'Boreal Dancer · 베인 상처',
    sourcePage: 165,
    encounterIds: ['foraging-forest-9-winter'],
    choiceId: 'dodge',
    trigger: { condition: 'spade', cardCount: 1, suits: ['♠'] },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: tag('WOUND', 2),
    timerHours: null,
    deadline: 'immediate',
    success: null,
    failure: { code: 'STITCHER_PATH_COST', description: 'If it cannot be treated immediately, decrease every active Timer by 1 per Path to the nearest Settlement; a Stitcher treats the wound there.' }
  }),
  fixed({
    id: 'encounter-remedy-fish-slap-wound',
    patientAilmentId: 'encounter-remedy-fish-slap-wound',
    canonicalAilmentId: null,
    canonicalName: 'Fish Slap Wound',
    displayName: 'Fish Slap (연어 꼬리 상처)',
    sourcePage: 167,
    encounterIds: ['foraging-loch-7'],
    trigger: { condition: 'swimming' },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: tag('WOUND', 2),
    timerHours: null,
    deadline: 'before-highest-active-timer',
    success: null,
    failure: { code: 'CONCUSSION_RECOVERY', description: 'If untreated before the highest Timer ends, mark 3 Days on the Calendar.' }
  }),
  fixed({
    id: 'encounter-remedy-little-biters-tick',
    patientAilmentId: 'ailment-tickbitten-twice-shy',
    canonicalAilmentId: 'ailment-tickbitten-twice-shy',
    canonicalName: 'Tickbitten, Twice Shy',
    displayName: 'Tickbitten, Twice Shy (진드기 물림)',
    sourcePage: 172,
    encounterIds: ['foraging-meadow-3'],
    choiceId: 'risk-it',
    trigger: { condition: 'club-or-spade', cardCount: 1, suits: ['♣', '♠'] },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: allOf(
      tag('PARASITE', 1),
      { kind: 'anyOf', requirements: [tag('FUR', 2), tag('FEATHER', 2)] }
    ),
    timerHours: 8,
    deadline: 'before-move-on',
    success: null,
    failure: { code: 'CANONICAL_AILMENT_CONSEQUENCE', description: 'If it is not cured before Move On, resolve the printed Tickbitten, Twice Shy consequence.' }
  }),
  fixed({
    id: 'encounter-remedy-fire-and-iron-wound',
    patientAilmentId: 'encounter-remedy-fire-and-iron-wound',
    canonicalAilmentId: null,
    canonicalName: 'Fire and Iron Wound',
    displayName: 'Fire and Iron (싸움의 상처)',
    sourcePage: 175,
    encounterIds: ['foraging-meadow-m-summer'],
    choiceId: 'intervene',
    trigger: { condition: 'not-monarch', cardCount: 1 },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: tag('WOUND', 2),
    timerHours: null,
    deadline: 'immediate',
    success: { code: 'IMMEDIATE_REMEDY_TIMER_COST', description: 'If the Remedy can be made now, make it and decrease every active Timer by 2.' },
    failure: { code: 'STITCHER_TIMER_COST', description: 'Otherwise the fighters take the Apothecary to a Stitcher and every active Timer decreases by 8.' }
  }),
  fixed({
    id: 'encounter-remedy-deluge-cold',
    patientAilmentId: 'encounter-remedy-deluge-cold',
    canonicalAilmentId: null,
    canonicalName: 'Deluge Cold',
    displayName: 'Deluge (폭우 뒤 한기)',
    sourcePage: 88,
    encounterIds: ['travel-meadow-9-10-autumn'],
    choiceId: 'push-on',
    trigger: { condition: 'non-aquatic' },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: tag('TEMPERATURE', 1),
    timerHours: null,
    deadline: 'before-move-on',
    success: null,
    failure: { code: 'BEDRIDDEN_COLD', description: 'If the Remedy is not made before Move On, mark 3 Days on the Calendar.' }
  }),
  fixed({
    id: 'encounter-remedy-bear-lord',
    patientAilmentId: 'encounter-remedy-bear-lord',
    canonicalAilmentId: null,
    canonicalName: 'Mercy for the Mighty',
    displayName: 'Mercy for the Mighty (거대한 이를 위한 자비)',
    sourcePage: 183,
    encounterIds: ['foraging-mountain-m-winter'],
    choiceId: 'start-ailment',
    trigger: { condition: 'always' },
    patientKind: 'bear-lord',
    stateSeverity: 'lesser',
    requirements: allOf(
      {
        kind: 'special',
        code: 'TWO_SEPARATE_INFECTION_3_DOSES',
        description: 'Create two separately listed INFECTION 3 Remedy doses; do not collapse them into INFECTION 6.'
      },
      tag('PAIN', 2)
    ),
    requirementDoses: [
      { id: 'infection-dose-1', requirement: tag('INFECTION', 3) },
      { id: 'infection-dose-2', requirement: tag('INFECTION', 3) }
    ],
    timerHours: 8,
    success: { code: 'BEAR_DEFERENCE', description: 'Future negative bear outcomes are replaced by journaling about the massive bear showing deference.' },
    failure: { code: 'BEAR_LORD_PASSES_ELSEWHERE', description: 'The Bear Lord dies. After the passing rites, the player may take Reagents of any type with total Rarity up to 10.' }
  }),
  fixed({
    id: 'encounter-remedy-gas-leak-poison',
    patientAilmentId: 'encounter-remedy-gas-leak-poison',
    canonicalAilmentId: null,
    canonicalName: 'Gas Leak Poisoning',
    displayName: 'Gas Leak (가스 중독)',
    sourcePage: 184,
    encounterIds: ['foraging-titan-3'],
    choiceId: 'rush',
    trigger: { condition: 'spade', cardCount: 1, suits: ['♠'], afterEveryEncounterUntilMoveOn: true },
    patientKind: 'apothecary',
    stateSeverity: 'lesser',
    requirements: tag('POISON', 2),
    timerHours: null,
    deadline: 'immediate',
    success: null,
    failure: { code: 'GAS_LEAK_FORAGING_LOCK', description: 'If the Remedy is not made, lose all Foraging Points and cannot Forage here again until Move On.' }
  })
];

export const ENCOUNTER_REMEDY_BY_ID = new Map(
  ENCOUNTER_REMEDIES.map(definition => [definition.id, definition])
);

export const ENCOUNTER_REMEDY_BY_PATIENT_AILMENT_ID = new Map(
  ENCOUNTER_REMEDIES.map(definition => [definition.patientAilmentId, definition])
);

export const encounterRemediesForEncounter = (
  encounterId: string,
  choiceId?: string | null
): readonly EncounterRemedyDefinition[] => ENCOUNTER_REMEDIES.filter(definition =>
  definition.encounterIds.includes(encounterId)
  && (choiceId == null || definition.choiceId == null || definition.choiceId === choiceId)
);
