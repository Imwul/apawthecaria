import { AILMENTS } from './data/ailments';
import { REAGENTS } from './data/reagents';
import { normalizeLegacyArchiveRecord } from './archiveEngine';
import { normalizeLegacyManualEffectDraft } from './almanackEngine';
import { BARROW_DELVE_BY_ID, type BarrowDelveId, type BehemothClass } from './data/barrows';
import { normalizeRouteDraft } from '../map/routeComposer';
import { migrateRulesetMetadata } from './rulesets';
import { CURRENT_SCHEMA_VERSION, type PatientState, type TreatmentDraft } from './state';
import type { AilmentSeverity, RulebookEdition, RulesetId } from './types';

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

const severityFromLegacy = (value?: string): AilmentSeverity => {
  const normalized = value?.toLowerCase();
  return normalized === 'intermediate' || normalized === 'severe' || normalized === 'dire'
    ? normalized
    : 'lesser';
};

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
    return {
      activePatientId: typeof saved.activePatientId === 'string' ? saved.activePatientId : null,
      patients: saved.patients as PatientState[]
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
  saveRevision: Number.isInteger(saved.saveRevision) ? saved.saveRevision : 0,
  schemaVersion: 3
});

const migrateV3ToV4: SaveMigration = saved => ({
  ...saved,
  patients: Array.isArray(saved.patients)
    ? (saved.patients as PatientState[]).map(patient => ({
      ...patient,
      ailments: (patient.ailments || []).map((ailment, index) => ({
        ...ailment,
        repeatIndex: Number.isInteger(ailment.repeatIndex) ? ailment.repeatIndex : ailment.instance || index + 1,
        specialState: ailment.specialState && typeof ailment.specialState === 'object' ? ailment.specialState : {},
        successResolved: Boolean(ailment.successResolved),
        failureResolved: Boolean(ailment.failureResolved),
        consequenceResolved: Boolean(ailment.consequenceResolved),
        effectIds: Array.isArray(ailment.effectIds) ? ailment.effectIds : []
      }))
    }))
    : [],
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
    ? saved.patientArchive.map(row => normalizeLegacyArchiveRecord(row as SaveRecord))
    : Array.isArray(saved.patientCasebook)
      ? saved.patientCasebook.map(row => normalizeLegacyArchiveRecord(row as SaveRecord))
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
      ? saved.companions.map((row, index) => ({ instanceId: String((row as SaveRecord).id || `legacy-companion-${index + 1}`), companionId: String((row as SaveRecord).name || ''), pathsTravelled: Number(saved.companionTravelPaths || 0), seasonsTravelled: Number((row as SaveRecord).seasonsTravelled || 0), usedThisJourney: false, pendingForage: null, pendingForageDraws: 0, migratedFromLegacy: true }))
      : [],
  companionHiveStates: Array.isArray(saved.companionHiveStates)
    ? saved.companionHiveStates
    : Array.isArray(saved.companionHive)
      ? saved.companionHive.map((row, index) => ({ instanceId: String((row as SaveRecord).id || `legacy-hive-companion-${index + 1}`), companionId: String((row as SaveRecord).name || ''), pathsTravelled: 0, seasonsTravelled: Number((row as SaveRecord).seasonsTravelled || 0), usedThisJourney: false, pendingForage: null, pendingForageDraws: 0, migratedFromLegacy: true }))
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

const migrateV5ToV6: SaveMigration = saved => {
  const raw = saved.treatmentDraft && typeof saved.treatmentDraft === 'object'
    ? saved.treatmentDraft as SaveRecord
    : null;
  const draft: TreatmentDraft | null = raw && typeof raw.patientId === 'string' && typeof raw.ailmentInstanceId === 'string'
    ? {
        id: typeof raw.id === 'string' ? raw.id : `treatment-draft:${raw.patientId}:${raw.ailmentInstanceId}`,
        patientId: raw.patientId,
        ailmentInstanceId: raw.ailmentInstanceId,
        selectedParts: Array.isArray(raw.selectedParts)
          ? raw.selectedParts.filter(row => row && typeof row === 'object').map(row => {
              const part = row as SaveRecord;
              return {
                itemId: String(part.itemId || ''),
                reagentId: typeof part.reagentId === 'string' ? part.reagentId : null,
                preparationId: typeof part.preparationId === 'string' ? part.preparationId : null
              };
            }).filter(row => row.itemId)
          : [],
        selectedPreparationIds: Array.isArray(raw.selectedPreparationIds) ? raw.selectedPreparationIds.map(String) : [],
        selectedToolIds: Array.isArray(raw.selectedToolIds) ? raw.selectedToolIds.map(String) : [],
        catalyse: Array.isArray(raw.catalyse) ? raw.catalyse as TreatmentDraft['catalyse'] : [],
        fair: Number(raw.fair || 0),
        foul: Number(raw.foul || 0),
        purify: Boolean(raw.purify),
        replacementContext: raw.replacementContext && typeof raw.replacementContext === 'object'
          ? raw.replacementContext as TreatmentDraft['replacementContext']
          : null,
        status: raw.status === 'committed' || raw.status === 'discarded' ? raw.status : 'draft',
        committedTransactionId: typeof raw.committedTransactionId === 'string' ? raw.committedTransactionId : null,
        createdAt: Number(raw.createdAt || Date.now()),
        updatedAt: Number(raw.updatedAt || raw.createdAt || Date.now())
      }
    : null;
  const applied = Array.isArray(saved.appliedTransactionIds) ? saved.appliedTransactionIds.map(String) : [];
  const safeDraft = draft?.committedTransactionId && applied.includes(draft.committedTransactionId) ? null : draft;
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
    pendingManualFollowUps: Array.isArray(saved.pendingManualFollowUps) ? saved.pendingManualFollowUps : [],
    manualConditions: Array.isArray(saved.manualConditions) ? saved.manualConditions.map(String) : [],
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

export const migrateSavedRulesState = <T extends Record<string, unknown>>(saved: T | null | undefined) => {
  let migrated: SaveRecord = { ...(saved || {}) };
  let version = Number.isInteger(migrated.schemaVersion) ? Number(migrated.schemaVersion) : 0;
  while (version < CURRENT_SCHEMA_VERSION) {
    const migration = SAVE_MIGRATIONS[version];
    if (!migration) throw new Error(`Missing save migration from schema version ${version}`);
    migrated = migration(migrated);
    version = Number(migrated.schemaVersion);
  }
  const companionHiveStates = Array.isArray(migrated.companionHiveStates)
    ? migrated.companionHiveStates
    : Array.isArray(migrated.companionHive)
      ? migrated.companionHive.map((row, index) => ({
          instanceId: String((row as SaveRecord).id || `legacy-hive-companion-${index + 1}`),
          companionId: String((row as SaveRecord).name || ''), pathsTravelled: 0,
          seasonsTravelled: Number((row as SaveRecord).seasonsTravelled || 0),
          usedThisJourney: false, pendingForage: null, pendingForageDraws: 0, migratedFromLegacy: true
        }))
      : null;
  migrated = {
    ...migrated,
    routeDraft: normalizeRouteDraft(migrated.routeDraft),
    patients: Array.isArray(migrated.patients)
      ? (migrated.patients as PatientState[]).map(patient => ({
          ...patient,
          foragingPoints: Number.isFinite(patient.foragingPoints) ? Math.max(0, Number(patient.foragingPoints)) : 0,
          reagentsGathered: Array.isArray(patient.reagentsGathered) ? patient.reagentsGathered.map(String) : []
        }))
      : []
  };
  if (companionHiveStates) migrated = { ...migrated, companionHiveStates };
  return migrated as T & {
    schemaVersion: number;
    rulesetId: RulesetId;
    rulebookEdition: RulebookEdition;
    activePatientId: string | null;
    patients: PatientState[];
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
    offlineOutbox: unknown[];
    routeDraft: ReturnType<typeof normalizeRouteDraft>;
  };
};
