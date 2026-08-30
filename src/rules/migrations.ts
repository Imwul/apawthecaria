import { AILMENTS } from './data/ailments';
import type { CompanionState } from './data/mobility';
import { SOCIAL_ENCOUNTERS } from './data/encounters';
import { REAGENTS, REAGENT_BY_ID } from './data/reagents';
import { normalizeLegacyArchiveRecord } from './archiveEngine';
import {
  acquireQueenBeeCompanion,
  BEES_MANUAL_OWNER_ID,
  normalizeLegacyManualEffectDraft,
  normalizePendingManualFollowUp,
  QUEEN_BEE_COMPANION_ID
} from './almanackEngine';
import { BARROW_DELVE_BY_ID, type BarrowDelveId, type BehemothClass } from './data/barrows';
import { normalizeRouteDraft } from '../map/routeComposer';
import { normalizeSaveRevision } from '../persistence/revision';
import { normalizeSecondaryDrawCard, readSecondaryCardHistory } from '../secondaryCardHistory';
import { readCalendarClocks } from '../calendarTime';
import { getRuleCardValue } from './cards';
import { migrateRulesetMetadata } from './rulesets';
import { immediatelyTreatableAilmentIds } from './immediateRemedyEngine';
import { normalizeEncounterConditions } from './encounterConditionRuntime';
import { normalizeTravelEncounterWorldState } from './travelEncounterRuntime';
import { CURRENT_SCHEMA_VERSION, type PatientState, type TreatmentDraft } from './state';
import type { EngineInventoryItem } from './gameplay';
import type { CanonicalToolState } from './toolEngine';
import type { TreatmentAilmentTagOverride } from './treatmentEngine';
import type { AilmentSeverity, RulebookEdition, RulesetId, RuleTag } from './types';

export interface LegacyBagItem {
  id?: string;
  name?: string;
  weight?: number;
  type?: string;
  qty?: number;
  tags?: string;
  preps?: string;
  preparationId?: string;
  canonicalReagentId?: string;
  usesRemaining?: number;
  canonicalToolId?: string;
  [key: string]: unknown;
}

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
const slugify = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';

export const migrateLegacyBagItem = (item: LegacyBagItem): LegacyBagItem => {
  if (item.type === 'tool') {
    const toolAliases: Record<string, string> = {
      toolknife: 'belt-knife', toolmortar: 'mortar-and-pestle', toolkettle: 'camp-kettle',
      tooljaws: 'teeth', toolpaws: 'paws', toolfryingpan: 'copper-frying-pan',
      toolcauldron: 'big-iron-cauldron', toolcoracle: 'bark-coracle', toolcrossbow: 'crossbow',
      toolbolts: 'bolts', toolbandolier: 'greenpaw-bandolier', toolalembic: 'glass-alembic',
      toolspidersilknet: 'fine-spidersilk-net', toolfairwindspices: 'fairwind-spices',
      toolcomb: 'fine-toothed-comb', toolneedles: 'knitting-needles', toolinstruments: 'instruments',
      toolwaxedsatchel: 'waxed-satchel', toolstilts: 'stilts', toolsaddlebags: 'saddlebags',
      tooltent: 'canvas-tent'
    };
    return { ...item, canonicalToolId: item.canonicalToolId || toolAliases[normalize(item.id || '')] };
  }
  if (item.type !== 'reagent') return item;
  const itemName = normalize(item.name || '');
  const reagent = REAGENTS.find(candidate =>
    item.canonicalReagentId === candidate.id
    || itemName.includes(normalize(candidate.canonicalName))
    || itemName.includes(normalize(candidate.displayName))
  );
  if (!reagent) {
    return {
      ...item,
      weight: typeof item.weight === 'number' ? item.weight : 1 / 3,
      usesRemaining: typeof item.usesRemaining === 'number' ? item.usesRemaining : 1
    };
  }
  const preparation = item.preparationId
    ? reagent.preparations.find(candidate => candidate.id === item.preparationId)
    : reagent.preparations.find(candidate => itemName.includes(normalize(candidate.name))) || reagent.preparations[0];
  return {
    ...item,
    canonicalReagentId: reagent.id,
    preparationId: preparation?.id,
    weight: typeof item.weight === 'number' ? item.weight : preparation?.weight || 1 / 3,
    usesRemaining: typeof item.usesRemaining === 'number' ? item.usesRemaining : preparation?.uses || 1
  };
};

interface LegacyAilmentState {
  id?: string;
  name?: string;
  severity?: string;
  timer?: number;
  maxTimer?: number;
  tags?: string;
  patientName?: string;
  species?: string;
  [key: string]: unknown;
}

type SaveRecord = Record<string, unknown>;
type SaveMigration = (saved: SaveRecord) => SaveRecord;

const isSaveRecord = (value: unknown): value is SaveRecord =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const stringArray = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((row): row is string | number => typeof row === 'string' || typeof row === 'number').map(String)
  : [];

const recordArray = (value: unknown): SaveRecord[] => Array.isArray(value)
  ? value.filter(isSaveRecord)
  : [];

const severityFromLegacy = (value?: string): AilmentSeverity => {
  const normalized = value?.toLowerCase();
  return normalized === 'intermediate' || normalized === 'severe' || normalized === 'dire'
    ? normalized
    : 'lesser';
};

const normalizePatient = (value: unknown, patientIndex: number): PatientState | null => {
  if (!isSaveRecord(value)) return null;
  const patientId = typeof value.id === 'string' && value.id.trim()
    ? value.id.trim()
    : `legacy-patient-${patientIndex + 1}`;
  const ailments: PatientState['ailments'] = recordArray(value.ailments).map((ailment, index) => {
    const id = typeof ailment.id === 'string' && ailment.id.trim()
      ? ailment.id.trim()
      : `${patientId}-ailment-${index + 1}`;
    const instance = Number.isInteger(ailment.instance) && Number(ailment.instance) > 0
      ? Number(ailment.instance)
      : index + 1;
    return {
      ...ailment,
      id,
      ailmentId: typeof ailment.ailmentId === 'string' ? ailment.ailmentId : null,
      severity: severityFromLegacy(typeof ailment.severity === 'string' ? ailment.severity : undefined),
      timerIds: stringArray(ailment.timerIds),
      conditionIds: stringArray(ailment.conditionIds),
      treatmentHistoryIds: stringArray(ailment.treatmentHistoryIds),
      status: (ailment.status === 'treated' || ailment.status === 'failed' ? ailment.status : 'active') as PatientState['ailments'][number]['status'],
      instance,
      repeatIndex: Number.isInteger(ailment.repeatIndex) && Number(ailment.repeatIndex) > 0
        ? Number(ailment.repeatIndex)
        : instance,
      specialState: isSaveRecord(ailment.specialState) ? ailment.specialState : {},
      successResolved: Boolean(ailment.successResolved),
      failureResolved: Boolean(ailment.failureResolved),
      consequenceResolved: Boolean(ailment.consequenceResolved),
      effectIds: stringArray(ailment.effectIds)
    };
  });
  const timers: PatientState['timers'] = recordArray(value.timers).map((timer, index) => {
    const maximum = Number.isFinite(Number(timer.maximum)) ? Math.max(0, Number(timer.maximum)) : 0;
    const current = Number.isFinite(Number(timer.current)) ? Math.max(0, Number(timer.current)) : maximum;
    return {
      ...timer,
      id: typeof timer.id === 'string' && timer.id ? timer.id : `${patientId}-timer-${index + 1}`,
      ailmentInstanceId: typeof timer.ailmentInstanceId === 'string'
        ? timer.ailmentInstanceId
        : ailments[index]?.id || '',
      current,
      maximum,
      status: (timer.status === 'expired' || timer.status === 'stopped' ? timer.status : 'active') as PatientState['timers'][number]['status']
    };
  });
  const conditions = recordArray(value.conditions).map((condition, index) => ({
    ...condition,
    id: typeof condition.id === 'string' && condition.id ? condition.id : `${patientId}-condition-${index + 1}`,
    code: typeof condition.code === 'string' ? condition.code : '',
    description: typeof condition.description === 'string' ? condition.description : '',
    active: condition.active !== false
  }));
  const treatmentHistory: PatientState['treatmentHistory'] = recordArray(value.treatmentHistory).map((entry, index) => ({
    ...entry,
    id: typeof entry.id === 'string' && entry.id ? entry.id : `${patientId}-treatment-${index + 1}`,
    ailmentInstanceIds: stringArray(entry.ailmentInstanceIds),
    preparationIds: stringArray(entry.preparationIds),
    providedTags: (isSaveRecord(entry.providedTags) ? entry.providedTags : {}) as PatientState['treatmentHistory'][number]['providedTags'],
    outcome: (entry.outcome === 'success' || entry.outcome === 'failure' ? entry.outcome : 'pending') as PatientState['treatmentHistory'][number]['outcome'],
    effects: (Array.isArray(entry.effects) ? entry.effects : []) as PatientState['treatmentHistory'][number]['effects']
  }));
  const journalEvents = recordArray(value.journalEvents).map((event, index) => ({
    ...event,
    id: typeof event.id === 'string' && event.id ? event.id : `${patientId}-journal-${index + 1}`,
    type: ['diagnosis', 'timer', 'treatment', 'success', 'failure', 'note'].includes(String(event.type))
      ? event.type as PatientState['journalEvents'][number]['type']
      : 'note',
    text: typeof event.text === 'string' ? event.text : ''
  }));
  return {
    ...value,
    id: patientId,
    name: typeof value.name === 'string' ? value.name : '',
    species: typeof value.species === 'string' ? value.species : '',
    status: value.status === 'cured' || value.status === 'failed' || value.status === 'departed' ? value.status : 'active',
    foragingPoints: Number.isFinite(Number(value.foragingPoints)) ? Math.max(0, Number(value.foragingPoints)) : 0,
    reagentsGathered: stringArray(value.reagentsGathered),
    ailments,
    timers,
    conditions,
    treatmentHistory,
    journalEvents
  };
};

const normalizePatients = (value: unknown): PatientState[] =>
  (Array.isArray(value) ? value : [])
    .map(normalizePatient)
    .filter((patient): patient is PatientState => Boolean(patient));

const canonicalAilmentId = (legacy: LegacyAilmentState): string | null => {
  const legacyName = normalize(legacy.name || '');
  return AILMENTS.find(ailment =>
    legacy.id === ailment.id
    || legacyName === normalize(ailment.canonicalName)
    || legacyName === normalize(ailment.displayName)
    || normalize(ailment.displayName).includes(legacyName)
  )?.id || null;
};

export const migrateLegacyPatientState = (saved: SaveRecord): {
  activePatientId: string | null;
  patients: PatientState[];
} => {
  if (Array.isArray(saved.patients)) {
    const patients = normalizePatients(saved.patients);
    const requestedActiveId = typeof saved.activePatientId === 'string' ? saved.activePatientId : null;
    return {
      activePatientId: requestedActiveId && patients.some(patient => patient.id === requestedActiveId)
        ? requestedActiveId
        : null,
      patients
    };
  }
  const legacyRows = Array.isArray(saved.activeAilments) && saved.activeAilments.length > 0
    ? saved.activeAilments as LegacyAilmentState[]
    : saved.activeAilment && typeof saved.activeAilment === 'object'
      ? [saved.activeAilment as LegacyAilmentState]
      : [];
  if (legacyRows.length === 0) return { activePatientId: null, patients: [] };

  const first = legacyRows[0];
  const patientId = 'legacy-active-patient';
  const ailments = legacyRows.map((legacy, index) => {
    const ailmentId = canonicalAilmentId(legacy);
    const instanceId = `${patientId}-${ailmentId || `legacy-${slugify(legacy.name || String(index + 1))}`}-${index + 1}`;
    return {
      id: instanceId,
      ailmentId,
      legacyName: legacy.name,
      severity: severityFromLegacy(legacy.severity),
      requirementSnapshot: legacy.tags,
      timerIds: [`${instanceId}-timer`],
      conditionIds: [],
      treatmentHistoryIds: [],
      status: 'active' as const,
      instance: index + 1,
      repeatIndex: index + 1,
      specialState: {},
      successResolved: false,
      failureResolved: false,
      consequenceResolved: false,
      effectIds: []
    };
  });
  const timers = ailments.map((ailment, index) => {
    const legacy = legacyRows[index];
    const maximum = typeof legacy.maxTimer === 'number'
      ? legacy.maxTimer
      : typeof legacy.timer === 'number' ? legacy.timer : 0;
    return {
      id: ailment.timerIds[0],
      ailmentInstanceId: ailment.id,
      current: typeof legacy.timer === 'number' ? legacy.timer : maximum,
      maximum,
      status: (legacy.timer === 0 ? 'expired' : 'active') as 'expired' | 'active'
    };
  });
  return {
    activePatientId: patientId,
    patients: [{
      id: patientId,
      name: first.patientName || 'Legacy Patient',
      species: first.species || '',
      foragingPoints: typeof first.foragingPoints === 'number' ? first.foragingPoints : 0,
      reagentsGathered: Array.isArray(first.reagentsGathered) ? first.reagentsGathered.map(String) : [],
      initialRememberedNote: typeof first.initialRememberedNote === 'string' ? first.initialRememberedNote : undefined,
      status: 'active',
      ailments,
      timers,
      conditions: [],
      treatmentHistory: [],
      journalEvents: []
    }]
  };
};

const migrateV0ToV1: SaveMigration = saved => {
  const withRuleset = migrateRulesetMetadata(saved);
  const bag = Array.isArray(withRuleset.bag)
    ? withRuleset.bag.map(item => migrateLegacyBagItem(item as LegacyBagItem))
    : withRuleset.bag;
  return { ...withRuleset, bag, schemaVersion: 1 };
};

const migrateV1ToV2: SaveMigration = saved => ({
  ...saved,
  ...migrateLegacyPatientState(saved),
  schemaVersion: 2
});

const migrateV2ToV3: SaveMigration = saved => ({
  ...saved,
  bag: Array.isArray(saved.bag) ? saved.bag.map(item => migrateLegacyBagItem(item as LegacyBagItem)) : saved.bag,
  appliedTransactionIds: Array.isArray(saved.appliedTransactionIds) ? saved.appliedTransactionIds : [],
  appliedEncounterEffectIds: Array.isArray(saved.appliedEncounterEffectIds) ? saved.appliedEncounterEffectIds : [],
  pendingEncounter: saved.pendingEncounter && typeof saved.pendingEncounter === 'object' ? saved.pendingEncounter : null,
  pendingForaging: saved.pendingForaging && typeof saved.pendingForaging === 'object' ? saved.pendingForaging : null,
  downtimeCompleted: typeof saved.downtimeCompleted === 'boolean' ? saved.downtimeCompleted : false,
  downtimeRequired: typeof saved.downtimeRequired === 'boolean' ? saved.downtimeRequired : false,
  saveRevision: normalizeSaveRevision(saved.saveRevision),
  schemaVersion: 3
});

const migrateV3ToV4: SaveMigration = saved => ({
  ...saved,
  patients: normalizePatients(saved.patients),
  pendingBarter: saved.pendingBarter && typeof saved.pendingBarter === 'object'
    ? saved.pendingBarter
    : saved.activeBarter && typeof saved.activeBarter === 'object'
      ? { ...(saved.activeBarter as SaveRecord), status: 'manual-social', migratedFromLegacy: true }
      : null,
  journey: saved.journey && typeof saved.journey === 'object'
    ? saved.journey
    : saved.journeyActive
      ? {
        journeyId: 'legacy-active-journey',
        originId: String(saved.journeyOrigin || ''),
        destinationId: String(saved.journeyDestination || ''),
        reason: 'Migrated legacy Journey; review the original journal.',
        status: 'active',
        rulesetId: 'legacy-campaign',
        deviations: ['Destination was stored as legacy free text.'],
        migratedFromLegacy: true
      }
      : null,
  pendingEnding: saved.pendingEnding && typeof saved.pendingEnding === 'object' ? saved.pendingEnding : null,
  pendingLeaveObligation: saved.pendingLeaveObligation && typeof saved.pendingLeaveObligation === 'object'
    ? saved.pendingLeaveObligation
    : null,
  pendingAlternativeAcquisition: saved.pendingAlternativeAcquisition && typeof saved.pendingAlternativeAcquisition === 'object'
    ? saved.pendingAlternativeAcquisition
    : null,
  patientArchive: Array.isArray(saved.patientArchive)
    ? recordArray(saved.patientArchive).map(row => normalizeLegacyArchiveRecord(row))
    : Array.isArray(saved.patientCasebook)
      ? recordArray(saved.patientCasebook).map(row => normalizeLegacyArchiveRecord(row))
      : [],
  schemaVersion: 4
});

const migrateV4ToV5: SaveMigration = saved => ({
  ...saved,
  activeDelve: saved.activeDelve && typeof saved.activeDelve === 'object' ? saved.activeDelve : null,
  pendingServices: Array.isArray(saved.pendingServices) ? saved.pendingServices : [],
  serviceMapMutations: Array.isArray(saved.serviceMapMutations) ? saved.serviceMapMutations : [],
  toolStates: Array.isArray(saved.toolStates) ? saved.toolStates : [],
  wagonState: saved.wagonState && typeof saved.wagonState === 'object'
    ? saved.wagonState
    : saved.wagonExpansions && typeof saved.wagonExpansions === 'object'
      ? { commissioned: Boolean((saved.wagonExpansions as SaveRecord).baseUnit), expansionIds: Object.entries(saved.wagonExpansions as SaveRecord).filter(([, value]) => Boolean(value)).map(([key]) => key), clayPotReagentId: saved.gardenPlant || null, clayPotMoves: 0, migratedFromLegacy: true }
      : null,
  companionStates: Array.isArray(saved.companionStates)
    ? saved.companionStates
    : Array.isArray(saved.companions)
      ? recordArray(saved.companions).map((row, index) => ({ instanceId: String(row.id || `legacy-companion-${index + 1}`), companionId: String(row.name || ''), pathsTravelled: Number(saved.companionTravelPaths || 0), seasonsTravelled: Number(row.seasonsTravelled || 0), usedThisJourney: false, pendingForage: null, pendingForageDraws: 0, migratedFromLegacy: true }))
      : [],
  companionHiveStates: Array.isArray(saved.companionHiveStates)
    ? saved.companionHiveStates
    : Array.isArray(saved.companionHive)
      ? recordArray(saved.companionHive).map((row, index) => ({ instanceId: String(row.id || `legacy-hive-companion-${index + 1}`), companionId: String(row.name || ''), pathsTravelled: 0, seasonsTravelled: Number(row.seasonsTravelled || 0), usedThisJourney: false, pendingForage: null, pendingForageDraws: 0, migratedFromLegacy: true }))
      : [],
  rumours: Array.isArray(saved.rumours) ? saved.rumours : [],
  clinics: Array.isArray(saved.clinics) ? saved.clinics : [],
  clinicAgendaIds: Array.isArray(saved.clinicAgendaIds) ? saved.clinicAgendaIds : [],
  ailmentTagOverrides: Array.isArray(saved.ailmentTagOverrides) ? saved.ailmentTagOverrides : [],
  trinketRecords: Array.isArray(saved.trinketRecords) ? saved.trinketRecords : [],
  legacyTrinketCount: Number.isInteger(saved.legacyTrinketCount)
    ? saved.legacyTrinketCount
    : Array.isArray(saved.trinkets) ? saved.trinkets.length : typeof saved.trinkets === 'number' ? saved.trinkets : 0,
  pendingManualEffect: saved.pendingManualEffect && typeof saved.pendingManualEffect === 'object' ? saved.pendingManualEffect : null,
  treatmentDraft: saved.treatmentDraft && typeof saved.treatmentDraft === 'object' ? saved.treatmentDraft : null,
  manualEffectDraft: saved.manualEffectDraft && typeof saved.manualEffectDraft === 'object' ? saved.manualEffectDraft : null,
  offlineOutbox: Array.isArray(saved.offlineOutbox) ? saved.offlineOutbox : [],
  schemaVersion: 5
});

const normalizeTreatmentDraft = (value: unknown, appliedTransactionIds: string[]): TreatmentDraft | null => {
  const raw = isSaveRecord(value) ? value : null;
  if (!raw || typeof raw.patientId !== 'string' || typeof raw.ailmentInstanceId !== 'string') return null;
  const createdAt = Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : 0;
  const replacement = isSaveRecord(raw.replacementContext)
    && (raw.replacementContext.kind === 'make-do' || raw.replacementContext.kind === 'replacement')
    && typeof raw.replacementContext.targetTag === 'string'
    && Number.isFinite(Number(raw.replacementContext.requiredPotency))
    ? {
        kind: raw.replacementContext.kind as 'make-do' | 'replacement',
        targetTag: raw.replacementContext.targetTag as RuleTag,
        requiredPotency: Number(raw.replacementContext.requiredPotency)
      }
    : null;
  const draft: TreatmentDraft = {
    id: typeof raw.id === 'string' ? raw.id : `treatment-draft:${raw.patientId}:${raw.ailmentInstanceId}`,
    patientId: raw.patientId,
    ailmentInstanceId: raw.ailmentInstanceId,
    selectedParts: recordArray(raw.selectedParts).map(part => ({
      itemId: String(part.itemId || ''),
      reagentId: typeof part.reagentId === 'string' ? part.reagentId : null,
      preparationId: typeof part.preparationId === 'string' ? part.preparationId : null
    })).filter(row => row.itemId),
    selectedPreparationIds: stringArray(raw.selectedPreparationIds),
    selectedToolIds: stringArray(raw.selectedToolIds),
    catalyse: recordArray(raw.catalyse).map(row => ({
      tag: String(row.tag || '') as TreatmentDraft['catalyse'][number]['tag'],
      itemIds: stringArray(row.itemIds)
    })).filter(row => row.tag),
    fair: Number.isFinite(Number(raw.fair)) ? Number(raw.fair) : 0,
    foul: Number.isFinite(Number(raw.foul)) ? Number(raw.foul) : 0,
    purify: Boolean(raw.purify),
    replacementContext: replacement,
    status: raw.status === 'committed' || raw.status === 'discarded' ? raw.status : 'draft',
    committedTransactionId: typeof raw.committedTransactionId === 'string' ? raw.committedTransactionId : null,
    createdAt,
    updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : createdAt
  };
  return draft.committedTransactionId && appliedTransactionIds.includes(draft.committedTransactionId)
    ? null
    : draft;
};

const migrateV5ToV6: SaveMigration = saved => {
  const applied = stringArray(saved.appliedTransactionIds);
  const safeDraft = normalizeTreatmentDraft(saved.treatmentDraft, applied);
  const rawAcquisition = saved.pendingAlternativeAcquisition && typeof saved.pendingAlternativeAcquisition === 'object'
    ? saved.pendingAlternativeAcquisition as SaveRecord
    : null;
  const pendingAlternativeAcquisition = rawAcquisition
    ? {
        ...rawAcquisition,
        id: typeof rawAcquisition.id === 'string'
          ? rawAcquisition.id
          : `${String(rawAcquisition.kind || 'replacement')}:${String(rawAcquisition.targetTag || 'tag')}:${slugify(String(rawAcquisition.name || rawAcquisition.requiredPotency || 'pending'))}`,
        selectedSource: rawAcquisition.selectedSource === 'forage' || rawAcquisition.selectedSource === 'barter'
          ? rawAcquisition.selectedSource
          : null
      }
    : null;
  return { ...saved, treatmentDraft: safeDraft, pendingAlternativeAcquisition, schemaVersion: 6 };
};

const migrateV6ToV7: SaveMigration = saved => {
  const pending = normalizeLegacyManualEffectDraft(saved.pendingManualEffect);
  const deferred = normalizeLegacyManualEffectDraft(saved.manualEffectDraft);
  const queue = Array.isArray(saved.manualEffectQueue)
    ? saved.manualEffectQueue.map(row => normalizeLegacyManualEffectDraft(row)).filter((row): row is NonNullable<typeof row> => Boolean(row))
    : [];
  const drafts = [pending, deferred, ...queue].filter((row): row is NonNullable<typeof row> => Boolean(row));
  const uniqueDrafts = [...new Map(drafts.map(row => [row.effectId, row])).values()]
    .filter(row => row.status === 'manual' || row.status === 'deferred');
  return {
    ...saved,
    pendingManualEffect: pending,
    manualEffectDraft: deferred || pending,
    manualEffectQueue: uniqueDrafts,
    manualEffectRecords: Array.isArray(saved.manualEffectRecords) ? saved.manualEffectRecords : [],
    pendingManualFollowUps: Array.isArray(saved.pendingManualFollowUps)
      ? saved.pendingManualFollowUps
        .map(row => normalizePendingManualFollowUp(row))
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
      : [],
    manualConditions: normalizeEncounterConditions(
      Array.isArray(saved.manualConditions) ? saved.manualConditions.map(String) : []
    ),
    schemaVersion: 7
  };
};

const LEGACY_DELVE_IDS: Record<string, BarrowDelveId> = {
  UneasySleep: 'uneasy-sleep',
  CollapsedEntrance: 'collapsed-entrance',
  BelliesOfMany: 'bellies-of-many',
  InsideJob: 'inside-job',
  PotentPoison: 'potent-poison',
  StealEverything: 'pilfer-unnoticed',
  BuildingTrust: 'building-trust',
  SuitableFurnishings: 'suitable-furnishings'
};

const canonicalBarrows = (saved: SaveRecord) => {
  const rows = Array.isArray(saved.barrows) ? saved.barrows.filter(row => row && typeof row === 'object') as SaveRecord[] : [];
  return rows.map((row, index) => ({
    ...row,
    id: typeof row.id === 'string' ? row.id : `legacy-barrow-${index + 1}`,
    name: String(row.name || `Legacy Barrow ${index + 1}`),
    behemothClass: String(row.behemothClass || 'Towering') as BehemothClass,
    locationId: typeof row.locationId === 'string' && row.locationId
      ? row.locationId
      : slugify(String(row.locationName || row.name || `legacy-barrow-${index + 1}`)),
    removed: Boolean(row.removed)
  }));
};

const canonicalDelve = (saved: SaveRecord, barrows: ReturnType<typeof canonicalBarrows>) => {
  if (!saved.activeDelve || typeof saved.activeDelve !== 'object') return null;
  const raw = saved.activeDelve as SaveRecord;
  const legacyId = typeof raw.challengeType === 'string' ? LEGACY_DELVE_IDS[raw.challengeType] : undefined;
  const delveId = (typeof raw.delveId === 'string' ? raw.delveId : legacyId) as BarrowDelveId | undefined;
  const definition = delveId ? BARROW_DELVE_BY_ID.get(delveId) : null;
  if (!definition) return null;
  const legacySuit = Array.isArray(raw.cardsDrawn) && typeof raw.cardsDrawn[0] === 'string'
    ? raw.cardsDrawn[0]
    : undefined;
  const challengeSuit = ['♥', '♦', '♣', '♠'].includes(String(raw.challengeSuit || legacySuit))
    ? String(raw.challengeSuit || legacySuit)
    : definition.suits[0];
  const matchingBarrow = barrows.find(row => row.id === raw.barrowId)
    || barrows.find(row => row.name === raw.behemothName)
    || barrows.find(row => !row.removed);
  const legacyCards = Array.isArray(raw.cardsDrawn)
    ? raw.cardsDrawn.slice(1).map(value => ({ value: Number(value) || undefined }))
    : [];
  return {
    ...raw,
    delveId,
    barrowId: typeof raw.barrowId === 'string' ? raw.barrowId : matchingBarrow?.id || 'legacy-barrow',
    sourcePage: Number(raw.sourcePage || definition.sourcePage),
    currentStep: ['ready', 'challenge', 'awaiting-choice', 'resolved', 'failed', 'fled'].includes(String(raw.currentStep))
      ? raw.currentStep
      : 'challenge',
    challengeSuit,
    cards: Array.isArray(raw.cards) ? raw.cards : [{ suit: challengeSuit }, ...legacyCards],
    requirements: Array.isArray(raw.requirements) ? raw.requirements : definition.requiredTags.map(row => `${row.tag} ${row.value}${row.count ? ` x${row.count}` : ''}`),
    selectedItems: Array.isArray(raw.selectedItems) ? raw.selectedItems : [],
    timer: Number(raw.timer ?? definition.initialTimer),
    progress: Number(raw.progress ?? raw.points ?? 0),
    unresolvedChoices: Array.isArray(raw.unresolvedChoices) ? raw.unresolvedChoices : [],
    mandatoryEffects: Array.isArray(raw.mandatoryEffects) ? raw.mandatoryEffects : [],
    reward: raw.reward && typeof raw.reward === 'object' ? raw.reward : { trinkets: 0, reputation: 0 },
    failure: raw.failure && typeof raw.failure === 'object' ? raw.failure : null,
    fleeState: raw.fleeState && typeof raw.fleeState === 'object' ? raw.fleeState : { available: false, costDays: 1, nextMoveSpeed: 1 },
    appliedEffectIds: Array.isArray(raw.appliedEffectIds) ? raw.appliedEffectIds : [],
    removedFromMap: Boolean(raw.removedFromMap),
    journalEntries: Array.isArray(raw.journalEntries) ? raw.journalEntries : [],
    requiredRarities: Array.isArray(raw.requiredRarities)
      ? raw.requiredRarities.map(Number)
      : Array.isArray(raw.requiredReagents) ? raw.requiredReagents.map(Number) : [],
    ailmentId: typeof raw.ailmentId === 'string' ? raw.ailmentId : null
  };
};

const canonicalToolStates = (saved: SaveRecord) => {
  const stored = Array.isArray(saved.toolStates)
    ? saved.toolStates.filter(row => row && typeof row === 'object') as SaveRecord[]
    : [];
  const byId = new Map(stored
    .filter(row => typeof row.instanceId === 'string' && typeof row.toolId === 'string')
    .map(row => [String(row.instanceId), {
      ...row,
      instanceId: String(row.instanceId),
      toolId: String(row.toolId),
      upgradeId: typeof row.upgradeId === 'string' ? row.upgradeId : null,
      charges: typeof row.charges === 'number' ? row.charges : null,
      broken: Boolean(row.broken),
      consumed: Boolean(row.consumed),
      acquiredBy: String(row.acquiredBy || 'legacy-campaign'),
      appliedEffectIds: Array.isArray(row.appliedEffectIds) ? row.appliedEffectIds.map(String) : []
    }]));
  const bag = Array.isArray(saved.bag) ? saved.bag.filter(row => row && typeof row === 'object') as SaveRecord[] : [];
  bag.forEach((row, index) => {
    if (row.type !== 'tool' || typeof row.canonicalToolId !== 'string') return;
    const instanceId = typeof row.id === 'string' && row.id ? row.id : `legacy-tool-${index + 1}`;
    if (!byId.has(instanceId)) byId.set(instanceId, {
      instanceId,
      toolId: row.canonicalToolId,
      upgradeId: null,
      charges: null,
      broken: false,
      consumed: false,
      acquiredBy: 'legacy-inventory',
      appliedEffectIds: []
    });
  });
  return [...byId.values()];
};

const migrateV7ToV8: SaveMigration = saved => {
  const barrows = canonicalBarrows(saved);
  return {
    ...saved,
    barrows,
    activeDelve: canonicalDelve(saved, barrows),
    toolStates: canonicalToolStates(saved),
    nextMoveSpeedOverride: typeof saved.nextMoveSpeedOverride === 'number' ? saved.nextMoveSpeedOverride : null,
    schemaVersion: 8
  };
};

const migrateV8ToV9: SaveMigration = saved => ({
  ...saved,
  routeDraft: normalizeRouteDraft(saved.routeDraft),
  schemaVersion: 9
});

export const SAVE_MIGRATIONS: Readonly<Record<number, SaveMigration>> = {
  0: migrateV0ToV1,
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
  6: migrateV6ToV7,
  7: migrateV7ToV8,
  8: migrateV8ToV9
};

const normalizeSeason = (value: unknown): 'Spring' | 'Summer' | 'Autumn' | 'Winter' => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'summer') return 'Summer';
  if (normalized === 'autumn' || normalized === 'fall') return 'Autumn';
  if (normalized === 'winter') return 'Winter';
  return 'Spring';
};

const normalizeJourneyState = (value: unknown, save: SaveRecord): SaveRecord | null => {
  if (!isSaveRecord(value)) return null;
  const goalId = typeof value.goalId === 'string' && value.goalId.trim() ? value.goalId.trim() : 'custom';
  const storedGoal = isSaveRecord(value.customGoal) ? value.customGoal : null;
  const legacyGoalTitle = typeof save.journeyGoalTitle === 'string' && save.journeyGoalTitle.trim()
    ? save.journeyGoalTitle.trim()
    : '기존 여정 목표';
  const legacyGoalRequirement = typeof save.journeyGoalDesc === 'string' && save.journeyGoalDesc.trim()
    ? save.journeyGoalDesc.trim()
    : typeof save.journeyGoalProgress === 'string' && save.journeyGoalProgress.trim()
      ? save.journeyGoalProgress.trim()
      : '예전 기록을 확인한 뒤 완료 여부를 직접 판단합니다.';
  const goalState = isSaveRecord(value.goalState) ? value.goalState : {};
  const evaluation = isSaveRecord(goalState.evaluation) ? goalState.evaluation : {};
  const urgency = isSaveRecord(value.urgency) ? value.urgency : {};
  const urgencyDays = Number.isFinite(Number(urgency.days))
    ? Math.max(1, Math.floor(Number(urgency.days)))
    : Number.isFinite(Number(save.calendarMaxDays))
      ? Math.max(1, Math.floor(Number(save.calendarMaxDays)))
      : 12;
  const urgencyLabel = ['Relaxed', 'Important', 'Urgent', 'Dire'].includes(String(urgency.label))
    ? String(urgency.label)
    : 'Important';
  const status = ['setup', 'active', 'ending', 'completed', 'abandoned'].includes(String(value.status))
    ? String(value.status)
    : save.journeyActive ? 'active' : 'setup';
  return {
    ...value,
    journeyId: typeof value.journeyId === 'string' && value.journeyId.trim() ? value.journeyId.trim() : 'legacy-active-journey',
    // A printed location name is not a stable map id. Keep a missing id empty
    // so the UI can resolve the saved name against the current reviewed map.
    originId: typeof value.originId === 'string' ? value.originId.trim() : '',
    destinationId: typeof value.destinationId === 'string' ? value.destinationId.trim() : '',
    season: normalizeSeason(value.season || save.currentSeason),
    reason: typeof value.reason === 'string' && value.reason.trim() ? value.reason : '기존 여정 기록에서 복구됨',
    goalId,
    customGoal: goalId === 'custom'
      ? {
          title: typeof storedGoal?.title === 'string' && storedGoal.title.trim() ? storedGoal.title.trim() : legacyGoalTitle,
          requiredState: typeof storedGoal?.requiredState === 'string' && storedGoal.requiredState.trim() ? storedGoal.requiredState.trim() : legacyGoalRequirement
        }
      : storedGoal,
    goalState: {
      ...goalState,
      events: recordArray(goalState.events),
      playerDeclaredComplete: Boolean(goalState.playerDeclaredComplete),
      gmOverride: Boolean(goalState.gmOverride),
      evaluation: {
        ...evaluation,
        goalId,
        complete: Boolean(evaluation.complete),
        automaticComplete: Boolean(evaluation.automaticComplete),
        evidence: recordArray(evaluation.evidence),
        manualConfirmationRequired: goalId === 'custom' || Boolean(evaluation.manualConfirmationRequired)
      }
    },
    urgency: { label: urgencyLabel, days: urgencyDays },
    startDate: Number.isFinite(Number(value.startDate)) ? Number(value.startDate) : 0,
    status,
    journalPrompts: stringArray(value.journalPrompts),
    deviations: stringArray(value.deviations),
    rulesetId: typeof value.rulesetId === 'string' ? value.rulesetId : String(save.rulesetId || 'legacy-campaign'),
    startReputation: Number.isFinite(Number(value.startReputation))
      ? Number(value.startReputation)
      : Number.isFinite(Number(save.journeyStartReputation))
        ? Number(save.journeyStartReputation)
        : Number.isFinite(Number(save.reputation)) ? Number(save.reputation) : 5
  };
};

const normalizePendingJourneyEnding = (value: unknown, journey: SaveRecord | null): SaveRecord | null => {
  if (!isSaveRecord(value) || !journey || !['active', 'ending'].includes(String(journey.status))) return null;
  const journeyId = typeof value.journeyId === 'string' && value.journeyId.trim()
    ? value.journeyId.trim()
    : String(journey.journeyId || '');
  if (!journeyId || journeyId !== journey.journeyId) return null;
  const goalState = isSaveRecord(journey.goalState) ? journey.goalState : {};
  const evaluation = isSaveRecord(value.evaluation)
    ? value.evaluation
    : isSaveRecord(goalState.evaluation) ? goalState.evaluation : null;
  if (!evaluation) return null;
  const selectedOutcome = ['success', 'partial', 'failure', 'abandoned'].includes(String(value.selectedOutcome))
    ? String(value.selectedOutcome)
    : undefined;
  const journalText = typeof value.journalText === 'string' ? value.journalText : undefined;
  const updatedAt = Number.isFinite(Number(value.updatedAt)) ? Math.max(0, Number(value.updatedAt)) : undefined;
  return {
    journeyId,
    blockers: stringArray(value.blockers),
    evaluation,
    ...(selectedOutcome ? { selectedOutcome } : {}),
    ...(journalText !== undefined ? { journalText } : {}),
    ...(typeof value.playerDeclaredGoalComplete === 'boolean'
      ? { playerDeclaredGoalComplete: value.playerDeclaredGoalComplete }
      : {}),
    ...(typeof value.gmOverride === 'boolean' ? { gmOverride: value.gmOverride } : {}),
    ...(updatedAt !== undefined ? { updatedAt } : {})
  };
};

const normalizeCard = (value: unknown): { value: number; suit?: string } | null => {
  const cardValue = Number(isSaveRecord(value) ? value.value : Number.NaN);
  if (!isSaveRecord(value) || !Number.isInteger(cardValue) || cardValue < 1 || cardValue > 13) return null;
  const suit = typeof value.suit === 'string' ? value.suit : undefined;
  return { value: cardValue, ...(suit ? { suit } : {}) };
};

const normalizeNonNegativeInteger = (value: unknown): number | null => {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

const normalizeSecondaryCardFields = (value: SaveRecord) => {
  const selectedChoiceId = typeof value.selectedChoiceId === 'string' && value.selectedChoiceId.trim()
    ? value.selectedChoiceId.trim()
    : undefined;
  const secondaryCardChoiceId = typeof value.secondaryCardChoiceId === 'string' && value.secondaryCardChoiceId.trim()
    ? value.secondaryCardChoiceId.trim()
    : undefined;
  const belongsToSelectedChoice = !secondaryCardChoiceId || !selectedChoiceId || secondaryCardChoiceId === selectedChoiceId;
  const hasPersistedHistory = Array.isArray(value.secondaryCards) || Boolean(normalizeSecondaryDrawCard(value.secondaryCard));
  const secondaryCards = belongsToSelectedChoice ? readSecondaryCardHistory(value) : [];
  return {
    secondaryCard: secondaryCards.at(-1),
    secondaryCards: hasPersistedHistory ? secondaryCards : undefined,
    secondaryCardChoiceId
  };
};

const normalizePendingEncounter = (value: unknown): SaveRecord | null => {
  if (!isSaveRecord(value) || typeof value.transactionId !== 'string' || !isSaveRecord(value.encounter)) return null;
  const card = normalizeCard(value.card);
  if (!card) return null;
  return {
    ...value,
    card,
    ...normalizeSecondaryCardFields(value),
    phase: value.phase === 'manual' || value.phase === 'resolved' ? value.phase : 'pending',
    unresolvedEffectCodes: stringArray(value.unresolvedEffectCodes)
  };
};

const normalizeImmediateRemedyFields = ({
  value,
  eligible,
  patients,
  fallbackPatientId,
  inventory,
  overrides,
  toolStates
}: {
  value: SaveRecord;
  eligible: boolean;
  patients: PatientState[];
  fallbackPatientId: string | null;
  inventory: EngineInventoryItem[];
  overrides: TreatmentAilmentTagOverride[];
  toolStates: CanonicalToolState[];
}) => {
  if (!eligible || value.awaitingImmediateRemedy !== true) {
    return {
      awaitingImmediateRemedy: false,
      immediateRemedyPatientId: undefined,
      immediateRemedyAilmentIds: undefined
    };
  }
  const requestedPatientId = typeof value.immediateRemedyPatientId === 'string'
    && value.immediateRemedyPatientId.trim()
    ? value.immediateRemedyPatientId.trim()
    : fallbackPatientId;
  const patient = patients.find(row => row.id === requestedPatientId);
  if (!patient) {
    // An orphan has no canonical Timer on which to settle the deferred cost.
    // Clearing the malformed gate avoids permanently locking the campaign.
    return {
      awaitingImmediateRemedy: false,
      immediateRemedyPatientId: undefined,
      immediateRemedyAilmentIds: undefined
    };
  }
  const activeAilmentIds = new Set(patient.ailments
    .filter(ailment => ailment.status === 'active')
    .map(ailment => ailment.id));
  const hasPersistedExactIds = Array.isArray(value.immediateRemedyAilmentIds);
  const exactAilmentIds = hasPersistedExactIds
    ? [...new Set(stringArray(value.immediateRemedyAilmentIds))].filter(id => activeAilmentIds.has(id))
    : immediatelyTreatableAilmentIds(
      patient,
      inventory,
      overrides,
      toolStates.filter(tool => !tool.broken && !tool.consumed).map(tool => tool.toolId),
      toolStates
    );
  return {
    awaitingImmediateRemedy: true,
    immediateRemedyPatientId: patient.id,
    immediateRemedyAilmentIds: exactAilmentIds
  };
};

const normalizePendingForaging = (
  value: unknown,
  context: {
    patients: PatientState[];
    activePatientId: string | null;
    inventory: EngineInventoryItem[];
    overrides: TreatmentAilmentTagOverride[];
    toolStates: CanonicalToolState[];
  }
): SaveRecord | null => {
  if (!isSaveRecord(value) || typeof value.transactionId !== 'string') return null;
  const card = normalizeCard(value.card);
  const validRegions = ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan'];
  if (!card || !validRegions.includes(String(value.region))) return null;
  const validPhases = ['choose-reagent', 'encounter', 'timer', 'resolved'];
  const phase = validPhases.includes(String(value.phase)) ? value.phase : 'choose-reagent';
  const canonicalReagentId = (candidate: unknown): string | undefined => {
    if (typeof candidate !== 'string') return undefined;
    const id = candidate.trim();
    return id && REAGENT_BY_ID.has(id) ? id : undefined;
  };
  const rememberedReagentIds = Array.isArray(value.rememberedReagentIds)
    ? [...new Set(value.rememberedReagentIds.flatMap(candidate => {
        const id = canonicalReagentId(candidate);
        return id ? [id] : [];
      }))]
    : undefined;
  const immediateRemedy = normalizeImmediateRemedyFields({
    value,
    eligible: phase === 'resolved',
    patients: context.patients,
    fallbackPatientId: context.activePatientId,
    inventory: context.inventory,
    overrides: context.overrides,
    toolStates: context.toolStates
  });
  const rawSpecialAcquisition = isSaveRecord(value.specialAcquisition)
    ? value.specialAcquisition
    : null;
  const specialAcquisition = rawSpecialAcquisition?.kind === 'unbuckled-cache'
    && typeof rawSpecialAcquisition.cacheId === 'string'
    && Boolean(rawSpecialAcquisition.cacheId.trim())
    && typeof rawSpecialAcquisition.label === 'string'
    && Boolean(rawSpecialAcquisition.label.trim())
    ? {
      kind: 'unbuckled-cache' as const,
      cacheId: rawSpecialAcquisition.cacheId,
      label: rawSpecialAcquisition.label,
      itemCount: Number.isFinite(Number(rawSpecialAcquisition.itemCount))
        ? Math.max(1, Math.floor(Number(rawSpecialAcquisition.itemCount)))
        : 1
    }
    : undefined;
  return {
    ...value,
    card,
    ...normalizeSecondaryCardFields(value),
    targetReagentId: canonicalReagentId(value.targetReagentId),
    rememberedReagentIds,
    candidateSelectionReagentId: phase === 'choose-reagent'
      ? canonicalReagentId(value.candidateSelectionReagentId)
      : undefined,
    selectedReagentId: canonicalReagentId(value.selectedReagentId),
    specialAcquisition: phase === 'choose-reagent' ? undefined : specialAcquisition,
    locationRelation: value.locationRelation === 'adjacent' ? 'adjacent' : 'current',
    timerCostAfterEncounter: Number.isFinite(Number(value.timerCostAfterEncounter))
      ? Math.max(0, Number(value.timerCostAfterEncounter))
      : 0,
    encounterId: typeof value.encounterId === 'string' ? value.encounterId : null,
    phase,
    ...immediateRemedy
  };
};

const normalizePendingBarter = (
  value: unknown,
  context: {
    patients: PatientState[];
    activePatientId: string | null;
    inventory: EngineInventoryItem[];
    overrides: TreatmentAilmentTagOverride[];
    toolStates: CanonicalToolState[];
  }
): SaveRecord | null => {
  if (!isSaveRecord(value)) return null;
  const status = typeof value.status === 'string' ? value.status : '';
  const patientId = typeof value.patientId === 'string' && value.patientId.trim()
    ? value.patientId.trim()
    : context.activePatientId;
  const terminal = status === 'completed' || status === 'abandoned';
  if (terminal) {
    return {
      ...value,
      patientId,
      appliedEffectIds: stringArray(value.appliedEffectIds),
      ...normalizeImmediateRemedyFields({
        value,
        eligible: status === 'completed',
        patients: context.patients,
        fallbackPatientId: patientId,
        inventory: context.inventory,
        overrides: context.overrides,
        toolStates: context.toolStates
      })
    };
  }

  // Only checkpoints the current UI can resume are kept. Older `activeBarter`
  // objects did not identify a canonical Part, so guessing a replacement here
  // could buy the wrong ingredient or crash when payment is finalized.
  if (!['manual-social', 'awaiting-second-card', 'awaiting-payment'].includes(status)) return null;
  if (!patientId || !context.patients.some(patient => patient.id === patientId)) return null;
  const barterId = typeof value.barterId === 'string' ? value.barterId.trim() : '';
  const reagentId = typeof value.targetReagentId === 'string' ? value.targetReagentId.trim() : '';
  const preparationId = typeof value.preparationId === 'string' ? value.preparationId.trim() : '';
  const locationId = typeof value.locationId === 'string' ? value.locationId.trim() : '';
  const reagent = REAGENT_BY_ID.get(reagentId);
  const preparation = reagent?.preparations.find(row => row.id === preparationId);
  const locationType = value.locationType === 'City' || value.locationType === 'Settlement'
    ? value.locationType
    : null;
  const calculatedBR = normalizeNonNegativeInteger(value.calculatedBR);
  const firstCard = normalizeCard(value.firstCard);
  const secondCard = normalizeCard(value.secondCard);
  const socialEncounterId = isSaveRecord(value.socialEncounter) && typeof value.socialEncounter.id === 'string'
    ? value.socialEncounter.id.trim()
    : '';
  const socialEncounter = SOCIAL_ENCOUNTERS.find(encounter => encounter.id === socialEncounterId) ?? null;
  const socialStepSkipped = value.socialStepSkipped === true;
  const paymentRequired = normalizeNonNegativeInteger(value.paymentRequired);
  if (!barterId || !reagent || !preparation || reagent.type === 'TITAN' || !locationId || !locationType || calculatedBR === null) {
    return null;
  }
  if (status === 'manual-social' && (!firstCard || !socialEncounter)) return null;
  if (status === 'awaiting-second-card' && !socialStepSkipped && (!firstCard || !socialEncounter)) return null;
  if (status === 'awaiting-payment') {
    if ((!socialStepSkipped && (!firstCard || !socialEncounter)) || !secondCard || paymentRequired === null || paymentRequired <= 0) return null;
    const expectedPayment = Math.max(0, calculatedBR - getRuleCardValue(secondCard, 'barter'));
    if (paymentRequired !== expectedPayment) return null;
  }
  return {
    ...value,
    barterId,
    patientId,
    targetReagentId: reagent.id,
    preparationId: preparation.id,
    locationId,
    locationType,
    calculatedBR,
    firstCard,
    secondCard,
    socialEncounter,
    socialStepSkipped,
    paymentRequired: status === 'awaiting-payment' ? paymentRequired : 0,
    appliedEffectIds: stringArray(value.appliedEffectIds),
    ...normalizeImmediateRemedyFields({
      value,
      eligible: false,
      patients: context.patients,
      fallbackPatientId: patientId,
      inventory: context.inventory,
      overrides: context.overrides,
      toolStates: context.toolStates
    })
  };
};

const normalizeCurrentSave = (saved: SaveRecord): SaveRecord => {
  const withMetadata = migrateRulesetMetadata(saved);
  const calendarClocks = readCalendarClocks({
    calendarDays: withMetadata.calendarDays,
    cumulativeDays: withMetadata.cumulativeDays
  });
  const patients = normalizePatients(withMetadata.patients);
  const requestedActivePatientId = typeof withMetadata.activePatientId === 'string'
    ? withMetadata.activePatientId
    : null;
  const activePatientId = requestedActivePatientId && patients.some(patient => patient.id === requestedActivePatientId)
    ? requestedActivePatientId
    : null;
  const bag = recordArray(withMetadata.bag).map(item => migrateLegacyBagItem(item)) as EngineInventoryItem[];
  const toolStates = canonicalToolStates(withMetadata) as CanonicalToolState[];
  const ailmentTagOverrides = (Array.isArray(withMetadata.ailmentTagOverrides)
    ? withMetadata.ailmentTagOverrides
    : []) as TreatmentAilmentTagOverride[];
  const checkpointContext = {
    patients,
    activePatientId,
    inventory: bag,
    overrides: ailmentTagOverrides,
    toolStates
  };
  const appliedTransactionIds = [...new Set(stringArray(withMetadata.appliedTransactionIds))];
  const normalizedPendingManualEffect = normalizeLegacyManualEffectDraft(withMetadata.pendingManualEffect);
  const pendingManualEffect = normalizedPendingManualEffect?.status === 'manual'
    && !normalizedPendingManualEffect.transactionId
    ? normalizedPendingManualEffect
    : null;
  const manualEffectDraft = normalizeLegacyManualEffectDraft(withMetadata.manualEffectDraft);
  const manualEffectQueue = Array.isArray(withMetadata.manualEffectQueue)
    ? withMetadata.manualEffectQueue
      .map(row => normalizeLegacyManualEffectDraft(row))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
    : [];
  const uniqueManualQueue = [...new Map([
    ...(manualEffectDraft && !manualEffectDraft.transactionId ? [manualEffectDraft] : []),
    ...(normalizedPendingManualEffect && !normalizedPendingManualEffect.transactionId ? [normalizedPendingManualEffect] : []),
    ...manualEffectQueue
  ]
    .filter(row => !row.transactionId)
    .map(row => [row.effectId, row])).values()];
  const normalizedPendingForaging = normalizePendingForaging(withMetadata.pendingForaging, checkpointContext);
  const pendingForaging = normalizedPendingForaging?.phase === 'resolved'
    && normalizedPendingForaging.awaitingImmediateRemedy !== true
    && !uniqueManualQueue.some(draft => (draft.status === 'manual' || draft.status === 'deferred')
      && draft.context.continuation === 'foraging'
      && draft.context.encounterTransactionId === `${normalizedPendingForaging.transactionId}:encounter`)
    ? null
    : normalizedPendingForaging;
  const pendingBarter = normalizePendingBarter(withMetadata.pendingBarter, checkpointContext);
  const companionHiveStates = Array.isArray(withMetadata.companionHiveStates)
    ? withMetadata.companionHiveStates
    : recordArray(withMetadata.companionHive).map((row, index) => ({
        instanceId: String(row.id || `legacy-hive-companion-${index + 1}`),
        companionId: String(row.name || ''),
        pathsTravelled: 0,
        seasonsTravelled: Number(row.seasonsTravelled || 0),
        usedThisJourney: false,
        pendingForage: null,
        pendingForageDraws: 0,
        migratedFromLegacy: true
      }));
  const manualConditions = stringArray(withMetadata.manualConditions);
  const savedCompanionStates = (Array.isArray(withMetadata.companionStates) ? withMetadata.companionStates : []) as CompanionState[];
  const isLegacyQueenCondition = (condition: string) =>
    condition.startsWith(`manual:${BEES_MANUAL_OWNER_ID}:`)
    && /queen bee companion acquired now/i.test(condition);
  const legacyQueenAcquired = manualConditions.some(isLegacyQueenCondition);
  const canonicalManualConditions = normalizeEncounterConditions(
    manualConditions.filter(condition => !isLegacyQueenCondition(condition))
  );
  const companionStates = legacyQueenAcquired
    && !savedCompanionStates.some(row => isSaveRecord(row) && row.companionId === QUEEN_BEE_COMPANION_ID)
    ? acquireQueenBeeCompanion(savedCompanionStates, 'legacy-protect-queen')
    : savedCompanionStates;
  const normalizedPendingManualFollowUps = Array.isArray(withMetadata.pendingManualFollowUps)
    ? withMetadata.pendingManualFollowUps
      .map(row => normalizePendingManualFollowUp(row))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
    : [];
  const hasLegacyQueenRehomeReminder = normalizedPendingManualFollowUps.some(row =>
    row.ownerId === BEES_MANUAL_OWNER_ID
    && /queen bee follow-up|re-home.{0,120}(?:queen|beehive)/i.test(row.description)
  );
  const pendingManualFollowUps = legacyQueenAcquired && !hasLegacyQueenRehomeReminder
    ? [...normalizedPendingManualFollowUps, {
        id: 'legacy-protect-queen:follow-up:rehome',
        effectId: 'legacy-protect-queen',
        ownerId: BEES_MANUAL_OWNER_ID,
        trigger: 'encounter' as const,
        description: 'Queen Bee follow-up: after a future re-home in a wild Meadow, Bog, or Forest, mark that Location as a new Beehive.',
        context: { continuation: 'travel' as const },
        createdAt: 0,
        transactionId: 'legacy-protect-queen',
        status: 'pending' as const
      }]
    : normalizedPendingManualFollowUps;
  const normalizedJourney = normalizeJourneyState(withMetadata.journey, withMetadata);
  const normalizedPendingEnding = normalizePendingJourneyEnding(withMetadata.pendingEnding, normalizedJourney);
  const journey = normalizedJourney && normalizedPendingEnding && normalizedJourney.status === 'active'
    ? { ...normalizedJourney, status: 'ending' }
    : normalizedJourney;
  const journeyActive = journey
    ? ['active', 'ending'].includes(String(journey.status))
    : Boolean(withMetadata.journeyActive);
  return {
    ...withMetadata,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    calendarDays: calendarClocks.calendarDays,
    cumulativeDays: calendarClocks.cumulativeDays,
    calendarHistory: Array.isArray(withMetadata.calendarHistory)
      ? withMetadata.calendarHistory.filter((entry): entry is string => typeof entry === 'string')
      : [],
    currentSeason: normalizeSeason(withMetadata.currentSeason),
    bag,
    routeDraft: normalizeRouteDraft(withMetadata.routeDraft),
    activePatientId,
    patients,
    appliedTransactionIds,
    appliedEncounterEffectIds: [...new Set(stringArray(withMetadata.appliedEncounterEffectIds))],
    pendingEncounter: normalizePendingEncounter(withMetadata.pendingEncounter),
    pendingForaging,
    pendingBarter,
    journey,
    journeyActive,
    pendingEnding: normalizedPendingEnding,
    pendingLeaveObligation: isSaveRecord(withMetadata.pendingLeaveObligation) ? withMetadata.pendingLeaveObligation : null,
    pendingAlternativeAcquisition: isSaveRecord(withMetadata.pendingAlternativeAcquisition) ? withMetadata.pendingAlternativeAcquisition : null,
    patientArchive: recordArray(withMetadata.patientArchive).map(row => normalizeLegacyArchiveRecord(row)),
    barrows: Array.isArray(withMetadata.barrows) ? withMetadata.barrows : [],
    activeDelve: isSaveRecord(withMetadata.activeDelve) ? withMetadata.activeDelve : null,
    pendingServices: Array.isArray(withMetadata.pendingServices) ? withMetadata.pendingServices : [],
    serviceMapMutations: Array.isArray(withMetadata.serviceMapMutations) ? withMetadata.serviceMapMutations : [],
    toolStates,
    wagonState: isSaveRecord(withMetadata.wagonState) ? withMetadata.wagonState : null,
    companionStates,
    companionHiveStates,
    rumours: Array.isArray(withMetadata.rumours) ? withMetadata.rumours : [],
    clinics: Array.isArray(withMetadata.clinics) ? withMetadata.clinics : [],
    clinicAgendaIds: stringArray(withMetadata.clinicAgendaIds),
    ailmentTagOverrides,
    trinketRecords: Array.isArray(withMetadata.trinketRecords) ? withMetadata.trinketRecords : [],
    legacyTrinketCount: Number.isInteger(withMetadata.legacyTrinketCount) && Number(withMetadata.legacyTrinketCount) >= 0
      ? Number(withMetadata.legacyTrinketCount)
      : 0,
    pendingManualEffect,
    treatmentDraft: normalizeTreatmentDraft(withMetadata.treatmentDraft, appliedTransactionIds),
    manualEffectDraft,
    manualEffectQueue: uniqueManualQueue,
    manualEffectRecords: Array.isArray(withMetadata.manualEffectRecords) ? withMetadata.manualEffectRecords : [],
    pendingManualFollowUps,
    manualConditions: canonicalManualConditions,
    travelEncounterWorld: normalizeTravelEncounterWorldState(withMetadata.travelEncounterWorld),
    offlineOutbox: Array.isArray(withMetadata.offlineOutbox) ? withMetadata.offlineOutbox : [],
    downtimeCompleted: typeof withMetadata.downtimeCompleted === 'boolean' ? withMetadata.downtimeCompleted : false,
    downtimeRequired: typeof withMetadata.downtimeRequired === 'boolean' ? withMetadata.downtimeRequired : false,
    saveRevision: normalizeSaveRevision(withMetadata.saveRevision)
  };
};

export const migrateSavedRulesState = <T extends Record<string, unknown>>(saved: T | null | undefined) => {
  let migrated: SaveRecord = { ...(saved || {}) };
  const parsedVersion = Number(migrated.schemaVersion);
  let version = Number.isInteger(parsedVersion) ? parsedVersion : 0;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Save schema version ${version} is newer than supported version ${CURRENT_SCHEMA_VERSION}`);
  }
  while (version < CURRENT_SCHEMA_VERSION) {
    const migration = SAVE_MIGRATIONS[version];
    if (!migration) throw new Error(`Missing save migration from schema version ${version}`);
    migrated = migration(migrated);
    version = Number(migrated.schemaVersion);
  }
  migrated = normalizeCurrentSave(migrated);
  return migrated as T & {
    schemaVersion: number;
    rulesetId: RulesetId;
    rulebookEdition: RulebookEdition;
    activePatientId: string | null;
    patients: PatientState[];
    appliedTransactionIds: string[];
    appliedEncounterEffectIds: string[];
    pendingBarter: unknown | null;
    journey: unknown | null;
    pendingEnding: unknown | null;
    pendingLeaveObligation: unknown | null;
    pendingAlternativeAcquisition: unknown | null;
    patientArchive: unknown[];
    activeDelve: unknown | null;
    pendingServices: unknown[];
    serviceMapMutations: unknown[];
    toolStates: unknown[];
    wagonState: unknown | null;
    companionStates: unknown[];
    companionHiveStates: unknown[];
    rumours: unknown[];
    clinics: unknown[];
    clinicAgendaIds: string[];
    ailmentTagOverrides: unknown[];
    trinketRecords: unknown[];
    legacyTrinketCount: number;
    pendingManualEffect: unknown | null;
    treatmentDraft: TreatmentDraft | null;
    manualEffectDraft: unknown | null;
    manualEffectQueue: unknown[];
    manualEffectRecords: unknown[];
    pendingManualFollowUps: unknown[];
    manualConditions: string[];
    travelEncounterWorld: ReturnType<typeof normalizeTravelEncounterWorldState>;
    offlineOutbox: unknown[];
    downtimeCompleted: boolean;
    downtimeRequired: boolean;
    saveRevision: number;
    currentSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
    routeDraft: ReturnType<typeof normalizeRouteDraft>;
  };
};
