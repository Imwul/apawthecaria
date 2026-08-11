import { CURRENT_SCHEMA_VERSION } from '../state';

const RELEASE_EDITION = 'first-edition-third-printing-may-2023';
const FIXTURE_TIME = 1_720_000_000_000;

const baseSave = (): Record<string, unknown> => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  rulesetId: 'original-1e-3p',
  rulebookEdition: RELEASE_EDITION,
  currentSeason: 'Spring',
  activePatientId: null,
  patients: [],
  appliedTransactionIds: [],
  appliedEncounterEffectIds: [],
  pendingEncounter: null,
  pendingForaging: null,
  pendingBarter: null,
  journey: null,
  pendingEnding: null,
  pendingLeaveObligation: null,
  pendingAlternativeAcquisition: null,
  patientArchive: [],
  barrows: [],
  activeDelve: null,
  pendingServices: [],
  serviceMapMutations: [],
  toolStates: [],
  wagonState: null,
  companionStates: [],
  companionHiveStates: [],
  rumours: [],
  clinics: [],
  clinicAgendaIds: [],
  ailmentTagOverrides: [],
  trinketRecords: [],
  legacyTrinketCount: 0,
  pendingManualEffect: null,
  treatmentDraft: null,
  manualEffectDraft: null,
  manualEffectQueue: [],
  manualEffectRecords: [],
  pendingManualFollowUps: [],
  manualConditions: [],
  offlineOutbox: [],
  downtimeCompleted: false,
  downtimeRequired: false,
  saveRevision: 1
});

const activePatient = {
  id: 'golden-patient',
  name: 'Synthetic Patient',
  species: 'Vole',
  status: 'active',
  foragingPoints: 2,
  reagentsGathered: [],
  ailments: [{
    id: 'golden-ailment-1',
    ailmentId: 'paw-rot',
    severity: 'lesser',
    timerIds: ['golden-timer-1'],
    conditionIds: [],
    treatmentHistoryIds: [],
    status: 'active',
    instance: 1,
    repeatIndex: 1,
    specialState: {},
    successResolved: false,
    failureResolved: false,
    consequenceResolved: false,
    effectIds: []
  }],
  timers: [{ id: 'golden-timer-1', ailmentInstanceId: 'golden-ailment-1', current: 7, maximum: 9, status: 'active' }],
  conditions: [],
  treatmentHistory: [],
  journalEvents: [{ id: 'golden-diagnosis', type: 'diagnosis', text: '합성 진료 기록 fixture.', campaignDay: 2 }]
};

const pendingManual = {
  effectId: 'printed:golden:encounter:1',
  ruleId: 'TRAVEL-009',
  ruleIds: ['TRAVEL-009'],
  sourcePage: 128,
  summary: 'Synthetic manual encounter',
  registryEffectId: 'printed:golden',
  ownerId: 'golden-encounter',
  ownerType: 'encounter',
  trigger: 'encounter',
  printedText: 'Synthetic text used only to preserve the save shape.',
  resolutionInstruction: 'Record the player decision.',
  mandatoryConditions: [],
  choices: ['Record outcome'],
  canonicalActions: [],
  inputFields: [{ id: 'outcome', type: 'free-text', label: 'Outcome', required: true }],
  inputValues: {},
  actionTemplates: [],
  selectedActionIds: [],
  actionTargets: {},
  followUpRequirements: [],
  context: { continuation: 'travel', encounterTransactionId: 'golden-travel-encounter' },
  resultSummary: '',
  journalNote: '',
  status: 'deferred',
  transactionId: null,
  overrideReason: '',
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME
};

export const GOLDEN_SAVE_FIXTURES: Record<string, Record<string, unknown>> = {
  freshCampaign: baseSave(),
  activeJourney: {
    ...baseSave(),
    journey: { journeyId: 'golden-journey', originId: 'odoak', destinationId: 'widrow', status: 'active', pathIds: ['odoak', 'oak-road', 'widrow'], reason: 'Synthetic delivery.', rulesetId: 'original-1e-3p' },
    appliedTransactionIds: ['golden-journey:start']
  },
  activePatient: { ...baseSave(), activePatientId: activePatient.id, patients: [activePatient] },
  pendingManualResolution: { ...baseSave(), pendingManualEffect: pendingManual, manualEffectDraft: pendingManual, manualEffectQueue: [pendingManual] },
  activeBarrow: {
    ...baseSave(),
    barrows: [{ id: 'golden-barrow', name: 'Synthetic Barrow', behemothClass: 'Towering', locationId: 'golden-barrow-site', removed: false }],
    activeDelve: { delveId: 'uneasy-sleep', barrowId: 'golden-barrow', sourcePage: 118, currentStep: 'challenge', challengeSuit: '♥', cards: [{ suit: '♥', value: 7 }], requirements: ['SLEEP 2'], selectedItems: [], timer: 3, progress: 1, unresolvedChoices: [], mandatoryEffects: [], reward: { trinkets: 0, reputation: 0 }, failure: null, fleeState: { available: true, costDays: 1, nextMoveSpeed: 1 }, appliedEffectIds: [], removedFromMap: false, journalEntries: [], requiredRarities: [], ailmentId: null }
  },
  toolAndUpgrade: {
    ...baseSave(),
    toolStates: [{ instanceId: 'golden-tool', toolId: 'mortar-and-pestle', upgradeId: 'granite-mortar', charges: null, broken: false, consumed: false, acquiredBy: 'synthetic-fixture', appliedEffectIds: [] }]
  },
  wagonAndCompanion: {
    ...baseSave(),
    wagonState: { commissioned: true, expansionIds: ['sealed-carriage', 'clay-pots'], clayPotReagentId: 'dandelions', clayPotMoves: 1 },
    companionStates: [{ instanceId: 'golden-companion', companionId: 'beetle', pathsTravelled: 4, seasonsTravelled: 0, usedThisJourney: true, pendingForage: null, pendingForageDraws: 0 }]
  },
  clinicAndService: {
    ...baseSave(),
    clinics: [{ id: 'golden-clinic', locationId: 'widrow', name: 'Synthetic Clinic', status: 'active', completesAtSeason: 1, gardenReagentId: null }],
    clinicAgendaIds: ['pantry'],
    pendingServices: [{ transactionId: 'golden-service', serviceId: 'forecast', status: 'active', remainingMoves: 2 }]
  },
  midDowntime: { ...baseSave(), downtimeRequired: true, downtimeCompleted: false, appliedTransactionIds: ['golden-journey:end'] },
  postSeason: { ...baseSave(), currentSeason: 'Summer', downtimeCompleted: false, saveRevision: 4, appliedTransactionIds: ['golden-season:1'] },
  archiveHeavy: {
    ...baseSave(),
    patientArchive: Array.from({ length: 12 }, (_, index) => ({ caseId: `golden-case-${index + 1}`, patientId: `golden-patient-${index + 1}`, status: index % 3 === 0 ? 'failed' : 'treated', ailments: [], timers: [], success: index % 3 !== 0, failure: index % 3 === 0, encounteredAt: FIXTURE_TIME - index * 1_000 })),
    manualEffectRecords: Array.from({ length: 8 }, (_, index) => ({ effectId: `golden-effect-${index + 1}`, status: 'resolved', transactionId: `golden-manual-${index + 1}`, resolvedAt: FIXTURE_TIME + index })),
    appliedTransactionIds: Array.from({ length: 20 }, (_, index) => `golden-transaction-${index + 1}`)
  }
};

export const GOLDEN_MIGRATION_FIXTURES: Record<string, Record<string, unknown>> = {
  schemaV6: { ...baseSave(), schemaVersion: 6, pendingManualEffect: pendingManual, manualEffectDraft: pendingManual, manualEffectQueue: [] },
  schemaV7: {
    ...baseSave(),
    schemaVersion: 7,
    barrows: [{ id: 'golden-barrow', name: 'Synthetic Barrow', behemothClass: 'Towering', locationId: 'golden-barrow-site', removed: false }],
    activeDelve: { challengeType: 'UneasySleep', barrowId: 'golden-barrow', challengeSuit: '♥', cardsDrawn: ['♥', 7], points: 1 },
    bag: [{ id: 'golden-tool', name: 'Mortar and Pestle', type: 'tool', canonicalToolId: 'mortar-and-pestle', weight: 1 / 3 }]
  },
  schemaV8: { ...baseSave(), saveRevision: 8 },
  finalReleaseSchema: { ...baseSave(), saveRevision: 10, appliedTransactionIds: ['golden-final-release'] }
};
