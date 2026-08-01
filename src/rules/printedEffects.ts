import { AILMENTS } from './data/ailments';
import { ENCOUNTERS } from './data/encounters';

export type PrintedEffectStatus = 'implemented' | 'manual' | 'ambiguous' | 'not-applicable' | 'source-conflict';
export type PrintedTrigger = 'encounter' | 'diagnosis' | 'timer-change' | 'barter' | 'treatment-success' | 'treatment-failure' | 'leave';

export interface PrintedStateChange {
  id: string;
  category: 'resource' | 'timer' | 'inventory' | 'movement' | 'map' | 'reputation' | 'condition' | 'journal';
  operation: string;
  amount?: number;
  target?: string;
}

export interface PrintedManualResolution {
  reason: string;
  decision: string;
  choices: string[];
  stateChangesAfterDecision: PrintedStateChange[];
}

export interface PrintedEffectDefinition {
  id: string;
  ownerType: 'encounter' | 'ailment';
  ownerId: string;
  status: PrintedEffectStatus;
  trigger: PrintedTrigger;
  prerequisites: string[];
  mandatoryEffects: PrintedStateChange[];
  optionalChoices: Array<{ id: string; label: string; effects: PrintedStateChange[] }>;
  resourceChanges: PrintedStateChange[];
  timerChanges: PrintedStateChange[];
  inventoryChanges: PrintedStateChange[];
  movementChanges: PrintedStateChange[];
  mapChanges: PrintedStateChange[];
  reputationChanges: PrintedStateChange[];
  followUpState: string | null;
  journalPrompt: string | null;
  manualResolution: PrintedManualResolution | null;
  ruleIds: string[];
  sourcePage: number;
  executor: string;
  testId: string | null;
}

const change = (id: string, category: PrintedStateChange['category'], operation: string, amount?: number, target?: string): PrintedStateChange => ({ id, category, operation, amount, target });

const encounterDefaults: PrintedEffectDefinition[] = ENCOUNTERS.map(encounter => ({
  id: `printed:${encounter.id}`,
  ownerType: 'encounter',
  ownerId: encounter.id,
  status: encounter.support === 'implemented' ? 'implemented' : 'manual',
  trigger: 'encounter',
  prerequisites: [encounter.season ? `Season: ${encounter.season}` : 'Any Season', `Region: ${encounter.region}`],
  mandatoryEffects: [],
  optionalChoices: encounter.choices.map(choice => ({ id: choice.id, label: choice.label, effects: [] })),
  resourceChanges: [], timerChanges: [], inventoryChanges: [], movementChanges: [], mapChanges: [], reputationChanges: [],
  followUpState: null,
  journalPrompt: encounter.prompt,
  manualResolution: encounter.support === 'implemented' ? null : {
    reason: 'The printed row includes a narrative, map placement, item identity, or follow-up choice not represented by a safe automatic value.',
    decision: 'Choose the printed option and confirm its resulting state changes.',
    choices: encounter.choices.map(choice => choice.label),
    stateChangesAfterDecision: []
  },
  ruleIds: [encounter.encounterType === 'travel' ? 'TRAVEL-009' : encounter.encounterType === 'foraging' ? 'FORAGE-006' : 'TABLE-004', 'CORE-002'],
  sourcePage: encounter.sourcePage,
  executor: 'executeEncounter',
  testId: null
}));

const encounterOverrides: Record<string, Partial<PrintedEffectDefinition>> = {
  'travel-bog-m-winter': {
    status: 'implemented',
    reputationChanges: [change('help-reputation', 'reputation', 'add', 1), change('hinder-reputation', 'reputation', 'add', -1)],
    manualResolution: null,
    testId: 'TRAVEL-009 warning rows'
  },
  'travel-forest-a-2': {
    followUpState: 'draw-card-and-choose-forest-plant',
    inventoryChanges: [change('forest-plant', 'inventory', 'add-matching-forest-plant-part')],
    testId: 'TRAVEL-008/TRAVEL-009 warning rows'
  },
  'travel-meadow-a-2': {
    prerequisites: ['Check Wagon ownership'],
    mandatoryEffects: [change('wagon-delay', 'resource', 'mark-day-if-wagon', 1)],
    testId: 'TRAVEL-009 warning rows'
  },
  'travel-mountain-9-10-winter': {
    followUpState: 'settlement-warning-deadline-2-days',
    reputationChanges: [change('foil-bandits', 'reputation', 'add-if-arrived-before-deadline', 4)],
    mapChanges: [change('marked-settlement', 'map', 'mark-future-bandit-change')],
    testId: 'TRAVEL-009 warning rows'
  },
  'travel-soar-9-10-summer': { followUpState: 'talons-suit-draw', testId: 'TRAVEL-009 warning rows' },
  'travel-soar-9-10-autumn': { followUpState: 'talons-suit-draw', testId: 'TRAVEL-009 warning rows' },
  'travel-soar-9-10-winter': { followUpState: 'talons-suit-draw', testId: 'TRAVEL-009 warning rows' },
  'travel-soar-j-winter': { status: 'implemented', manualResolution: null, testId: 'TRAVEL-009 warning rows' },
  'travel-soar-m-winter': {
    inventoryChanges: [change('hail-soak', 'inventory', 'soak-unprotected-items')],
    timerChanges: [change('hail-next-timer', 'timer', 'decrease-next-timer', 2)],
    testId: 'TRAVEL-009 warning rows'
  },
  'foraging-loch-j-winter': { status: 'implemented', manualResolution: null, testId: 'FORAGE-006 warning rows' }
};

const ailmentDefaults: PrintedEffectDefinition[] = AILMENTS.map(ailment => ({
  id: `printed:${ailment.id}`,
  ownerType: 'ailment',
  ownerId: ailment.id,
  status: ailment.successEffects.length === 0 && ailment.failureEffects.length === 0 && ailment.specialRules.length === 0 ? 'not-applicable' : 'manual',
  trigger: 'treatment-success',
  prerequisites: [],
  mandatoryEffects: [], optionalChoices: [], resourceChanges: [], timerChanges: [], inventoryChanges: [], movementChanges: [], mapChanges: [], reputationChanges: [],
  followUpState: null,
  journalPrompt: `Resolve the printed Outcome and Consequence for ${ailment.canonicalName}.`,
  manualResolution: ailment.successEffects.length === 0 && ailment.failureEffects.length === 0 && ailment.specialRules.length === 0 ? null : {
    reason: 'The printed Ailment result is primarily narrative or requires a player-selected map, Tool, or follow-up patient.',
    decision: 'Confirm the applicable Outcome or Consequence after the special rule is checked.',
    choices: [],
    stateChangesAfterDecision: []
  },
  ruleIds: ['AILMENT-003', 'AILMENT-005', 'AILMENT-007', 'CORE-002'],
  sourcePage: ailment.sourcePage,
  executor: 'resolveTreatmentTransaction / resolveAilmentPrintedEffect',
  testId: null
}));

const ailmentOverrides: Record<string, Partial<PrintedEffectDefinition>> = {
  'ailment-bad-idea': {
    prerequisites: ['Remedy cannot contain FOUL', 'Potency 3 Reagent required for Inspiration'],
    optionalChoices: [
      { id: 'upgrade-basic-tool', label: 'Upgrade one Basic Tool', effects: [change('upgrade-tool', 'inventory', 'upgrade-basic-tool')] },
      { id: 'lighten-tool', label: 'Decrease one Tool Weight by 1/3', effects: [change('lighten-tool', 'inventory', 'decrease-tool-weight', 1 / 3)] }
    ],
    testId: 'AILMENT-003/AILMENT-007 special success'
  },
  'ailment-brand-care': {
    trigger: 'diagnosis',
    optionalChoices: [
      { id: 'treat', label: 'Treat: lose 2 Reputation', effects: [change('brand-treat', 'reputation', 'add', -2)] },
      { id: 'refuse', label: 'Refuse: gain 2 Reputation', effects: [change('brand-refuse', 'reputation', 'add', 2)] }
    ],
    reputationChanges: [change('brand-choice', 'reputation', 'choice', undefined)],
    testId: 'AILMENT-003 special choice'
  },
  'ailment-fight-marks': {
    prerequisites: ['Two independent Ailment instances and Timers', 'Both treated', 'JOY 3 Reagent for reconciliation'],
    mandatoryEffects: [change('fight-repeat', 'condition', 'create-two-instances')],
    testId: 'AILMENT-003/AILMENT-004 special success'
  },
  'ailment-forager-s-twitch': {
    trigger: 'diagnosis',
    optionalChoices: [
      { id: 'good-trip', label: 'Heart/Diamond: requirements unchanged', effects: [] },
      { id: 'bad-trip', label: 'Club/Spade: add WOUND 1', effects: [change('twitch-wound', 'condition', 'add-requirement', 1, 'WOUND')] }
    ],
    testId: 'AILMENT-003 special diagnosis'
  },
  'ailment-groundhog-syndrome': {
    mandatoryEffects: [change('groundhog-repeat', 'condition', 'create-three-instances')],
    mapChanges: [change('groundhog-season-ban', 'map', 'apply-seasonal-settlement-or-forage-ban')],
    testId: 'AILMENT-003/AILMENT-005 special failure'
  },
  'ailment-pinned-by-pine': {
    trigger: 'timer-change',
    prerequisites: ['Steel Axe or local Settlement help prevents the extra loss'],
    timerChanges: [change('pine-extra-timer', 'timer', 'decrease', 1)],
    testId: 'AILMENT-003 special timer'
  },
  'ailment-quagmire-s-scale': {
    trigger: 'timer-change',
    timerChanges: [change('quagmire-threshold', 'condition', 'replace-POISON-1-with-POISON-3-at-timer-2')],
    followUpState: 'failure-forces-overstay',
    testId: 'AILMENT-003/AILMENT-005 special timer'
  },
  'ailment-soured-dough': {
    mandatoryEffects: [change('dough-repeat', 'condition', 'create-four-instances')],
    resourceChanges: [change('dough-failure', 'resource', 'next-remedy-trinkets-zero-if-none-treated')],
    testId: 'AILMENT-003/AILMENT-005 special failure'
  },
  'ailment-stingshock': {
    prerequisites: ['Two complete Remedy doses'],
    reputationChanges: [change('stingshock-double-dose', 'reputation', 'add', 3)],
    testId: 'AILMENT-003/AILMENT-007 special success'
  },
  'ailment-wake': {
    trigger: 'barter',
    timerChanges: [change('wake-barter', 'timer', 'increase-this-ailment', 1)],
    reputationChanges: [change('wake-cooked', 'reputation', 'add-if-cooked-remedy', 2)],
    testId: 'AILMENT-003/AILMENT-007 special success'
  },
  'ailment-wormridden': {
    prerequisites: ['FOUL cancels FAIR but cannot reduce the reward below the Severity base'],
    resourceChanges: [change('wormridden-foul', 'resource', 'suppress-foul-penalty')],
    testId: 'AILMENT-003/AILMENT-007 special success'
  }
};

export const PRINTED_EFFECT_REGISTRY: PrintedEffectDefinition[] = [
  ...encounterDefaults.map(row => ({ ...row, ...(encounterOverrides[row.ownerId] || {}) })),
  ...ailmentDefaults.map(row => ({ ...row, ...(ailmentOverrides[row.ownerId] || {}) }))
];

export const PRINTED_EFFECT_BY_OWNER = new Map(PRINTED_EFFECT_REGISTRY.map(row => [row.ownerId, row]));
