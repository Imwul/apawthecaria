import { useState, useEffect, useEffectEvent, useRef, useCallback, useMemo, memo, Fragment, lazy, Suspense } from "react";
import { db, isFirebaseConfigured, auth, googleProvider, storage, googleSignInErrorMessage, shouldUseRedirectSignIn, firebaseProjectId } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { deleteObject, getDownloadURL, ref as storageRef, uploadString } from "firebase/storage";
import { GAME_DATA } from "./gameData";
import {
  CAMPAIGN_SAVE_KEY,
  campaignSaveHasNamedApothecary,
  decideCloudSaveAction,
  parseCampaignSaveRaw,
  tryMigrateCampaignSave
} from "./persistence/campaignSave";
import {
  type CloudSlotId,
  type CloudSlotRecord,
  type CloudSlotView,
  assembleCloudSlotDocument,
  assembleNewCloudSlotDocument,
  cloudSlotRecordFromPayload,
  confirmManualSlotDownload,
  confirmManualSlotUpload,
  emptyCloudSlotViews,
  formatCloudSlotUploadedAt,
  parseUploadedAt,
  readActiveCloudSlot,
  readCloudSlotsFromDocument,
  writeActiveCloudSlot
} from "./persistence/cloudSlots";
import { MARKER_BY_ID, MARKER_EDGES, markerEdgeKind } from "./map/markerGraph";
import { loadPlayerMarkers, removePlayerMarkerRecords, upsertPlayerMarkerRecords } from "./map/playerMarkerStore";
import {
  appendRouteStop,
  canChooseRouteEdgeKind,
  cycleRouteEdgeKind,
  draftFromOrigin,
  glyphKindFromLocation,
  isLochWildsStop,
  locationTypeFromGlyph,
  mapKindFromGlyph,
  nearestTerrain,
  removeRouteStopAt,
  routeEdgeLabel,
  setRouteEdgeKind,
  stopFromPlace,
  terrainFromRegion,
  updateRouteStopAt,
  type RouteDraft,
  type RouteStop
} from "./map/routeComposer";
import { RouteComposer } from "./components/RouteComposer";
import { MapNodeAppearance } from "./map/MapNodeAppearance";
import { mergeCharacterJournals } from "./characterJournals";
import {
  FAMILIAR_BENEFITS,
  calculateRemedyRewards,
  calculateForageRarity,
  createPreparedReagentItem,
  getActiveFamiliarBenefit,
  getActiveFamiliarMechanic,
  getStartingForagingPoints,
  hasTool,
  parseAilmentRequirements,
  previewConcoction,
  previewPatientTimer,
  selectedToolEffectItems,
  splitReagentPreparations,
  validateConcoction
} from "./rulesEngine";
import parsedPrepsList from "../parsed_preps_list.json";
import {
  CURRENT_SCHEMA_VERSION,
  AILMENTS,
  ALMANACK_TOOLS,
  BARROW_DELVE_BY_ID,
  GUILD_SERVICE_BY_ID,
  JOURNEY_GOAL_BY_ID,
  REAGENTS,
  REAGENT_BY_ID,
  RULE_TAGS,
  RULEBOOK_EDITION,
  TOOL_BY_ID,
  TOOL_UPGRADE_BY_ID,
  PRINTED_EFFECT_BY_OWNER,
  canTreatAilmentWithInventory,
  calculatePawnReward,
  beginBarrowChallenge,
  bidFarewellCollapsedEntrance,
  commissionClinic,
  clinicServiceArea,
  createMakeDoAcquisition,
  createPatientArchiveRecord,
  createManualEffectDraft,
  createReplacementAcquisition,
  commitAlternativeAcquisition,
  evaluateJourneyGoal,
  drawCollapsedEntranceCard,
  drawPilferCard,
  diagnoseBuildingTrust,
  findJourneyDestinationCandidates,
  getBarterAttemptLimit,
  getBarterAttemptsRemaining,
  getGuildLedgerForagingPointBonus,
  hasGuildLogisticalMap,
  recordJourneyProgress,
  resolveBarterEncounter,
  resolveBarterGossip,
  resolveBarterLeave,
  resolveBarterOffer,
  resolveBarterPayment,
  resolveBarterStart,
  resolveBarrowForageAttempt,
  resolveBuildingTrust,
  resolveDowntime,
  resolveCanonicalDowntime,
  resolveEncounter,
  resolveForaging,
  resolveJourneyEnding,
  resolveJourneyStart,
  resolveLeave,
  resolveManualEffectTransaction,
  normalizeLegacyManualEffectDraft,
  resolveMobilityTravel,
  resolvePassengerArrival,
  resolvePassengerBoarding,
  resolvePassengerPickupAvailability,
  resolveClayPotHarvest,
  getPassengerDestinationOptions,
  resolveCompanionAdoption,
  resolveCompanionRelease,
  resolveCompanionStorage,
  resolveCompanionTrigger,
  resolveCompanionForageDraw,
  resolveClinicAgendaAction,
  resolveMobilityJourneyStart,
  resolveWagonCapabilities,
  resolveWaterwayPermissions,
  resolveWagonUpgrade,
  resolveRumour,
  resolveSuitableFurnishings,
  resolvePotentPoison,
  standPilfer,
  startBarrowDelve,
  submitBarrowRemedy,
  fleeBarrowDelve,
  drawSuitableFurnishings,
  warnOthersInsideJob,
  completeGuildServiceDelivery,
  consumeGuildServiceMissive,
  consumeGuildServiceMove,
  consumeGuildServiceTravelReroll,
  resolveGuildService,
  resolveGuildServiceJourneyEnd,
  resolveGuildServiceJourneyStart,
  resolveBraveTravelEffect,
  isNearbyMapLocation,
  restoreSeasonalServiceMutations,
  shortestPathDistance,
  saddlebagsCarryBonus,
  toolWeight,
  withIngenuitiveToolBenefit,
  purchaseCanonicalTool,
  repairCanonicalTool,
  resolveCrossbowProtection,
  resolveGraniteMortarPound,
  resolveKnittingProject,
  resolveKnittedBlanket,
  upgradeCanonicalTool,
  resolvePawn,
  resolveScrounge,
  resolveAilmentDiagnosisEffect,
  resolvePatient,
  resolveSeason,
  resolveTimer,
  resolveToolEffects,
  resolveInstrumentShow,
  resolveTravel,
  previewMoveStops,
  listLegalMoveStops,
  resolveTreatmentTransaction,
  findEncounter,
  getRuleCardLabel,
  getRuleCardValue,
  getPatientPersonalityChoices,
  isHouseRuleEnabled,
  migrateSavedRulesState,
  upsertPatientArchive,
  type BarterMapNode,
  type BarterRuntimeState,
  type BarrowDelveState,
  type BarrowResolution,
  type BarrowRuntimeState,
  type AlternativeAcquisition,
  type BadIdeaOutcomeChoice,
  type CardSuit,
  type CanonicalPatientArchiveRecord,
  type CanonicalDowntimeState,
  type CanonicalToolState,
  type AilmentTagOverride,
  type CompanionState,
  type ClinicRuntimeState,
  type ClinicAgendaRuntimeState,
  type DowntimeEngineOutcome,
  type EngineInventoryItem,
  type GameplayLocationType,
  type GuildServiceId,
  type JourneyMapNode,
  type JourneyRuntimeState,
  type JourneyState,
  type LeaveRuntimeState,
  type ManualEffectDraft,
  type ManualEffectRecord,
  type MobilityRuntimeState,
  type PendingManualFollowUp,
  type PatientState,
  type PendingBarterState,
  type PendingEncounterState,
  type PendingForagingState,
  type PendingLeaveObligation,
  type Region,
  type RequirementExpression,
  type RuleTag,
  type RulebookEdition,
  type RulesetId,
  type ServiceMapMutation,
  type ServiceRuntimeState,
  type TreatmentDraft,
  type TravelRegion,
  type WagonState
} from './rules';
import { BarrowPanel } from './components/Phase4Panels';
import { ChapterOpening, JournalNavigation, TodayOverview, type JournalTab } from './components/JournalExperience';
import {
  localizeCharacterChoiceLabel,
  localizeCharacterDescriptor,
  localizeAilmentPresentationText,
  localizeAvailabilityLabel,
  localizeBehemothClass,
  localizeDirectionLabel,
  localizeInventoryItemName,
  localizeJourneyGoalText,
  localizeLocationName,
  localizeLocationTypeLabel,
  localizePreparationMethod,
  localizePreparationName,
  localizeReagentType,
  localizeRegionLabel,
  localizeRegionList,
  localizeSavedJourneyText,
  localizeSeasonLabel,
  localizeSeverityLabel,
  localizeTravelStyle,
  localizeTreatmentResult
} from './localization/gameplayKo';
import { localizeGameplayMessage } from './localization/engineMessagesKo';
import { enqueueOfflineSave, flushOfflineSaves, resolveRevisionConflict, type OfflineSaveEntry } from './persistence/saveQueue';
import type { RulebookReferenceRequest } from './rulebook/types';
import { referenceForJournalTab } from './rulebook/context';
import { PaperMap, type MapClinicOverlay, type MapPickLocation } from './map/PaperMap';
import { type MapPlace, type MapPlaceType } from './map/mapLayers';

const AlmanackPanel = lazy(() => import('./components/AlmanackPanel'));
const LocalizedManualEffectText = lazy(() => import('./components/LocalizedManualEffectText'));
const ManualEffectPanel = lazy(() => import('./components/ManualEffectPanel'));
const RulebookReferenceDrawer = lazy(() => import('./components/RulebookReferenceDrawer'));

const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };

const APP_NOTICE_EVENT = 'apawthecaria:notice';

const showAlert = (message: unknown) => {
  window.dispatchEvent(new CustomEvent<string>(APP_NOTICE_EVENT, {
    detail: localizeGameplayMessage(String(message))
  }));
};

const askWindowConfirm = (message: string) => window.confirm.call(window, message);

const createClientTransaction = (prefix: string) => {
  const at = Date.now();
  return { at, id: `${prefix}:${at}:${Math.random().toString(36).slice(2, 8)}` };
};

const requirementRuleTags = (requirement: RequirementExpression): RuleTag[] => {
  if (requirement.kind === 'tag') return [requirement.tag];
  if (requirement.kind === 'special') return [];
  if (requirement.kind === 'alternatives') return requirement.alternatives.flatMap(requirementRuleTags);
  return requirement.requirements.flatMap(requirementRuleTags);
};

const canResolveSeverityAtReputation = (severity: string, reputation: number) => {
  const rank = ['lesser', 'intermediate', 'severe', 'dire'].indexOf(severity);
  const maximum = reputation >= 35 ? 3 : reputation >= 25 ? 2 : reputation >= 15 ? 1 : 0;
  return rank >= 0 && rank <= maximum;
};



// =================================================================
// 1. SYNC & STORAGE SYSTEM
// =================================================================
const withTimeout = (promise: Promise<any>, ms: number = 10000) => {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
};

let cloudSaveQueue: Promise<void> = Promise.resolve();
const SAVE_OUTBOX_KEY = 'apawthecaria_save_outbox';
const readSaveOutbox = (): OfflineSaveEntry[] => {
  try { return JSON.parse(localStorage.getItem(SAVE_OUTBOX_KEY) || '[]'); } catch { return []; }
};
const writeSaveOutbox = (entries: OfflineSaveEntry[]) => localStorage.setItem(SAVE_OUTBOX_KEY, JSON.stringify(entries));

const userSaveDocRef = () => {
  if (!db || !auth?.currentUser) return null;
  return doc(db, 'saves', `uid_${auth.currentUser.uid}`);
};

const snapshotUpdatedAt = (snap: object) => {
  const updateTime = (snap as { updateTime?: { toDate?: () => Date } }).updateTime;
  return updateTime?.toDate?.().toISOString() ?? null;
};

const fetchCloudDocumentUpdatedAt = async (uid: string): Promise<string | null> => {
  try {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) return null;
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/saves/uid_${uid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) return null;
    const body = await response.json() as { updateTime?: string };
    return parseUploadedAt(body.updateTime);
  } catch {
    return null;
  }
};

const cloudWriteErrorMessage = (error: { code?: string; message?: string } | null | undefined) => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === 'not-signed-in' || message === 'not-signed-in') {
    return '구글 계정에 먼저 로그인해 주세요.';
  }
  if (code === 'permission-denied' || code.endsWith('/permission-denied')) {
    return '이 구글 계정으로 클라우드에 쓸 권한이 없습니다. 같은 계정으로 다시 로그인해 주세요.';
  }
  if (code === 'invalid-argument' || code.endsWith('/invalid-argument') || /exceed|too large|1,?048,?576|byte/i.test(String(error?.message || ''))) {
    return '기록이 너무 커서 클라우드에 올리지 못했습니다. 일지 사진을 줄인 뒤 다시 시도해 주세요.';
  }
  if (code === 'unauthenticated' || code.endsWith('/unauthenticated')) {
    return '구글 로그인이 만료되었습니다. 다시 로그인한 뒤 올려 주세요.';
  }
  return '클라우드에 올리지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.';
};

const writeCloudSlotRecord = async (record: CloudSlotRecord) => {
  const docRef = userSaveDocRef();
  if (!docRef) {
    throw new Error('not-signed-in');
  }
  const snap = await withTimeout(getDoc(docRef), 20000);
  if (!snap.exists()) {
    await withTimeout(setDoc(docRef, assembleNewCloudSlotDocument(record)), 20000);
    return;
  }
  const current = readCloudSlotsFromDocument(
    snap.data() as Record<string, unknown>,
    snapshotUpdatedAt(snap)
  );
  const records: Array<CloudSlotRecord | null> = [null, null, null];
  current.records.forEach((row, index) => {
    if (row) records[index] = row;
  });
  records[record.slot - 1] = record;
  await withTimeout(setDoc(docRef, assembleCloudSlotDocument(records), { merge: true }), 20000);
};

const store = {
  set: async (key: string, value: any) => {
    const jsonString = JSON.stringify(value);
    try {
      localStorage.setItem(key, jsonString);
    } catch (e) {
      console.error('로컬 저장 에러:', e);
    }
    if (jsonString.length >= 950000) {
      console.warn('클라우드 저장 한도에 가까워 로컬에만 저장했습니다.');
      return false;
    }
    if (isFirebaseConfigured && db && auth?.currentUser) {
      if (!campaignSaveHasNamedApothecary(value)) {
        return true;
      }
      const revision = Number(value?.saveRevision || 0);
      const queuedAt = Date.now();
      writeSaveOutbox(enqueueOfflineSave(readSaveOutbox(), { id: `${key}:${revision}:${queuedAt}`, key, payload: jsonString, revision, queuedAt }));
      cloudSaveQueue = cloudSaveQueue.catch(() => undefined).then(async () => {
        if (auth?.currentUser) {
          const flushed = await flushOfflineSaves(readSaveOutbox(), async entry => {
            const slot = readActiveCloudSlot();
            await writeCloudSlotRecord(cloudSlotRecordFromPayload(slot, entry.payload, new Date().toISOString()));
          });
          writeSaveOutbox(flushed.remaining);
        }
      }).catch(e => console.error('Firebase 저장 에러:', e));
      await cloudSaveQueue;
    }
    return true;
  },
  load: async (key: string, fallback: any) => {
    let localValue: any = null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) localValue = JSON.parse(raw);
    } catch {}
    if (isFirebaseConfigured && db) {
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const docRef = doc(db, 'saves', `uid_${currentUser.uid}`);
          const snap = await withTimeout(getDoc(docRef));
          if (snap.exists()) {
            const data = snap.data() as Record<string, unknown>;
            const slots = readCloudSlotsFromDocument(data, snapshotUpdatedAt(snap));
            const activeRecord = slots.records[readActiveCloudSlot() - 1] || slots.records[0];
            const rawPayload = activeRecord?.payload
              ?? (typeof data[key] === 'string' ? data[key] : null);
            if (!rawPayload) {
              return localValue || fallback;
            }
            const cloudValue = JSON.parse(rawPayload);
            const resolved = resolveRevisionConflict(localValue, cloudValue);
            if (resolved.conflict) {
              localStorage.setItem('apawthecaria_sync_status', 'same-revision-conflict-local-kept');
              console.warn('같은 저장 버전의 내용이 달라 로컬 기록을 보존했습니다.');
            }
            return resolved.state;
          }
        }
      } catch (e) {
        console.error('Firebase 로드 에러:', e);
      }
    }
    return localValue || fallback;
  }
};

// =================================================================
// 2. INTERFACES & INITIAL STATES
// =================================================================

interface BagItem {
  id: string;
  name: string;
  weight: number; // in thirds, e.g. 1/3 is 0.3333
  type: 'tool' | 'reagent' | 'trinket' | 'item';
  qty?: number;
  tags?: string;
  preps?: string;
  inBandolier?: boolean;
  canonicalReagentId?: string;
  preparationId?: string;
  usesRemaining?: number;
  canonicalToolId?: string;
  ruinedWhenSoaked?: boolean;
  customReagent?: EngineInventoryItem['customReagent'];
  provenance?: EngineInventoryItem['provenance'];
  guildNote?: EngineInventoryItem['guildNote'];
  granitePounded?: boolean;
  craftedItemId?: EngineInventoryItem['craftedItemId'];
}

interface PlayingCard {
  suit: string;
  value: number;
}

interface ApothecaryBio {
  name: string;
  animal: string;
  descriptor: string;
  examples: string;
  travelStyle: string;
  speed: number;
  carry: number;
  originName: string;
  originDesc: string;
  originJournal: string;
  familiarName: string;
  familiarAnimal: string;
  familiarDescriptor: string;
  familiarExamples: string;
  familiarBenefit: string;
  familiarRelation: string;
  canFly?: boolean;
  familiarJournal: string;
  relationshipJournal: string;
  mementoNote: string;
}

interface ActiveAilment {
  id: string;
  name: string;
  severity: string;
  timer: number;
  maxTimer: number;
  tags: string;
  description: string;
  outcome: string;
  consequence: string;
  foragingPoints: number;
  reagentsGathered: string[];
  patientName?: string;
  species?: string;
  initialRememberedNote?: string;
  startedAtDay?: number;
  journeyTitle?: string;
}

interface Barrow {
  id: string;
  name: string;
  behemothClass: 'Towering' | 'Many' | 'Violent' | 'Demanding';
  direction: string;
  region: string;
  distance: string;
  locationName: string;
  locationId: string;
  removed: boolean;
}

type ActiveDelve = BarrowDelveState;

interface PatientCaseRecord {
  id: string;
  sourceId: string;
  patientName: string;
  species: string;
  ailmentName: string;
  severity: string;
  tags: string;
  locationName: string;
  region: string;
  season: string;
  journeyTitle: string;
  resolvedAtDay: number;
  outcome: 'success' | 'failure';
  remedy: string[];
  consequence: string;
  initialRememberedNote: string;
  finalArchiveNote: string;
  notes: string;
  timestamp: number;
  isBookmarked?: boolean;
}

interface PendingPatientArchive {
  sourceId: string;
  patientName: string;
  species: string;
  ailmentName: string;
  severity: string;
  tags: string;
  locationName: string;
  region: string;
  season: string;
  journeyTitle: string;
  resolvedAtDay: number;
  outcome: 'success' | 'failure';
  remedy: string[];
  consequence: string;
  initialRememberedNote: string;
  notes: string;
  timestamp: number;
  isBookmarked?: boolean;
}

interface ForageFind {
  name: string;
  rarity: number;
  fpAvailable?: boolean;
  reagentId?: string;
  gapCost?: number;
  cardSuccess?: boolean;
}

type AlmanacCategory = 'settlement' | 'clinic' | 'reagent' | 'creature' | 'landmark' | 'notable';

interface WorldAlmanacEntry {
  id: string;
  category: AlmanacCategory;
  name: string;
  locationName: string;
  region: string;
  source: string;
  notes: string;
  firstSeen: number;
  lastSeen: number;
  sightings: number;
  prepsDetail?: { part: string; prep: string; tag: string; val: number }[];
}

type ScrapbookKind = 'journey' | 'discovery' | 'patient' | 'remedy';

interface TravelScrapbookEntry {
  id: string;
  sourceId: string;
  kind: ScrapbookKind;
  title: string;
  text: string;
  locationName: string;
  timestamp: number;
}

interface TrinketMemoryRecord {
  id: string;
  sourceId: string;
  name: string;
  count: number;
  source: string;
  story: string;
  locationName: string;
  timestamp: number;
  spent: boolean;
  patientCaseId?: string;
}

interface PursuedByBehemoth {
  headStart: number;
}

interface WagonExpansions {
  baseUnit: boolean;
  sealedCarriage: boolean;
  pedalMotor: boolean;
  axelSprings: boolean;
  sideBrackets: boolean;
  hiveBrackets: boolean;
  passengerBooth: boolean;
  shadowCanvas: boolean;
  experimentalContraption: boolean;
  clayPots: boolean;
}

interface Passenger {
  id: string;
  name: string;
  origin: string;
  destination: string;
  destinationType: 'nearby_settlement' | 'distant_settlement' | 'city';
  reward: number;
  roleBenefit: string;
  pickedUpAtDay: number;
  originId?: string;
  destinationId?: string;
  ingenuitiveToolId?: string;
}

interface Companion {
  id: string;
  name: string;
  koreanName: string;
  adoptedLocation: string;
  seasonsTravelled?: number;
}

interface Clinic {
  id?: string;
  locationName: string;
  region: string;
  agendaService?: string;
  status?: 'building' | 'active';
  completesAtSeason?: GameState['currentSeason'];
  gardenReagentId?: string;
  gardenHarvestedAilmentIds?: string[];
}

interface BarterSession {
  reagentName: string;
  finalRarity: number;
  barterLocationName?: string;
  barterLocationType?: 'Settlement' | 'City';
  barterLocationRegion?: string;
  socialCard: { suit: string; val: number };
  socialEncounter: { page: number; suit: string; title: string; text: string };
  dealCard?: { suit: string; val: number } | null;
  attemptCounted?: boolean;
  phase: 'social' | 'deal' | 'result';
  journalNote: string;
}

interface JournalPhoto {
  id: string;
  name: string;
  dataUrl: string;
  storagePath?: string;
}

interface JournalEntry {
  id: string;
  title: string;
  text: string;
  timestamp: number;
  photos?: JournalPhoto[];
}

interface GameState {
  schemaVersion: number;
  rulebookEdition: RulebookEdition;
  rulesetId: RulesetId;
  bio: ApothecaryBio;
  reputation: number; // starts at 5
  currentLocationName: string;
  currentLocationType: string; // Wilds, Settlement, City, Ruin, Barrow
  currentRegion: string; // Bog, Forest, Loch, Meadow, Mountain, Titan, Barrow
  currentSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  completedSeasons: number;

  // Inventory
  bag: BagItem[];
  trinkets: string[];

  // Journey details
  journeyActive: boolean;
  journeyOrigin?: string;
  journeyDestination: string;
  journeyDistance: string;
  journeyTotalDistance: number;
  journeyDirection: string;
  journeyGoalTitle: string;
  journeyGoalDesc: string;
  journeyGoalProgress: string;
  journey: JourneyState | null;
  pendingEnding: JourneyRuntimeState['pendingEnding'];
  calendarDays: number;
  calendarMaxDays: number;
  calendarHistory: string[];

  // Ongoing patient
  activeAilment: ActiveAilment | null;
  activeAilments?: ActiveAilment[];
  activePatientId: string | null;
  patients: PatientState[];
  barterCountThisAilment: number; // Rulebook p.34: Settlement 1x, City 3x per ailment
  barterAttemptHistory: Record<string, number>;
  pendingBarter: PendingBarterState | null;
  pendingLeaveObligation: PendingLeaveObligation | null;
  pendingAlternativeAcquisition: AlternativeAcquisition | null;

  // Log history
  journals: JournalEntry[];

  // New features
  barrows?: Barrow[];
  activeDelve?: ActiveDelve | null;
  pursuedByBehemoth?: PursuedByBehemoth | null;
  nextMoveSpeedOverride: number | null;
  wagonExpansions?: WagonExpansions;
  activePassenger?: Passenger | null;
  passengerPickupReady?: boolean;
  companions?: Companion[];
  companionHive?: Companion[];
  resourcefulReagent?: string;
  ingenuitiveTool?: string;
  clinics?: Clinic[];
  customMapLocations?: CustomMapLocation[];
  customMapEdges?: CustomMapEdge[];
  guildServiceTravelRerolls?: number;
  forecastMoves?: number;
  forecastActiveAtLocation?: boolean;
  taxiSoarActive?: boolean;
  griphUsedThisJourney?: boolean;
  pondSkimmerUsedThisJourney?: boolean;
  beetleUsedThisJourney?: boolean;
  companionTravelPaths?: number;
  missiveSettlements?: string[];
  scroungingMode?: boolean;
  scroungingTimer?: number;
  independentUsedThisAilment?: boolean;
  visitedLocations?: string[];
  curedAilmentInThisWilds?: boolean;
  needsLocalHelpBeforeMove?: boolean;
  lastForageCardValue?: number;
  gardenPlant?: string;
  gardenHarvestedThisAilment?: boolean;
  soddenLogInsect?: string;
  soddenLogHarvestedThisAilment?: boolean;
  goodwillDonationsVal?: number;
  cumulativeDays?: number;
  completedReconnecting?: boolean;

  // Journey Goal / Barter strengthening
  journeyGoalCounter?: number;
  journeyGoalChecklist?: string[];
  journeyStartReputation?: number;
  activeBarter?: BarterSession | null;

  // Campaign & Narrative Depth Strengthening
  legacyClinics?: { locationName: string; region: string; services: string[]; founder: string }[];
  legacyApothecaries?: { name: string; ageOfRetirement: number; clinicsBuilt: number; legacyScore: number }[];
  discoveredRecipes?: Record<string, string[][]>;
  journeyChronicles?: { id: string; title: string; text: string; date: string }[];
  patientCasebook?: PatientCaseRecord[];
  patientArchive: CanonicalPatientArchiveRecord[];
  pendingPatientArchive?: PendingPatientArchive | null;
  worldAlmanac?: WorldAlmanacEntry[];
  travelScrapbook?: TravelScrapbookEntry[];
  trinketArchive?: TrinketMemoryRecord[];
  familiarTrust?: number;
  familiarMemories?: string[];
  legacyRestUsedThisLocation?: boolean;
  canFlyOverride?: boolean;
  lostPatientLegacy?: { name: string; species: string; ailmentName: string; day: number; consequence: string } | null;
  pendingEncounter?: PendingEncounterState | null;
  pendingForaging?: PendingForagingState | null;
  appliedTransactionIds: string[];
  appliedEncounterEffectIds: string[];
  pendingServices: unknown[];
  serviceMapMutations: unknown[];
  toolStates: unknown[];
  wagonState: WagonState | null;
  companionStates: CompanionState[];
  companionHiveStates: CompanionState[];
  rumours: unknown[];
  clinicAgendaIds: string[];
  ailmentTagOverrides: AilmentTagOverride[];
  trinketRecords: unknown[];
  legacyTrinketCount: number;
  pendingManualEffect: ManualEffectDraft | null;
  treatmentDraft: TreatmentDraft | null;
  manualEffectDraft: ManualEffectDraft | null;
  manualEffectQueue: ManualEffectDraft[];
  manualEffectRecords: ManualEffectRecord[];
  pendingManualFollowUps: PendingManualFollowUp[];
  manualConditions: string[];
  offlineOutbox: unknown[];
  downtimeCompleted: boolean;
  downtimeRequired: boolean;
  saveRevision: number;
}

const INITIAL_BIO: ApothecaryBio = {
  name: "",
  animal: "",
  descriptor: "Burrowing",
  examples: "오소리, 토끼, 고슴도치, 두더지",
  travelStyle: "Rambling and Ready",
  speed: 3,
  carry: 4,
  originName: "약제사 사고 후의 치료 서비스",
  originDesc: "큰 사고를 당하고 치유를 받으면서 약제사의 길을 걷기로 결심했습니다.",
  originJournal: "",
  familiarName: "",
  familiarAnimal: "",
  familiarDescriptor: "",
  familiarExamples: "",
  familiarBenefit: "따뜻한 약제사 (모든 질병 치료 시작 타이머 +2시간)",
  familiarRelation: "깊은 동반자 (서로 아끼고 의지함)",
  canFly: false,
  familiarJournal: "",
  relationshipJournal: "",
  mementoNote: ""
};

const INITIAL_BAG: BagItem[] = [
  { id: "tool_knife", name: "벨트 칼", weight: 1/3, type: "tool", canonicalToolId: 'belt-knife' },
  { id: "tool_mortar", name: "나무 절구와 공이 [GRIND/CRUSH]", weight: 1/3, type: "tool", canonicalToolId: 'mortar-and-pestle' },
  { id: "tool_kettle", name: "낡은 캠프 주전자 [BOIL/BREW]", weight: 1/3, type: "tool", canonicalToolId: 'camp-kettle' },
  { id: "tool_jaws", name: "이빨 [CHEW/DIGEST]", weight: 0, type: "tool", canonicalToolId: 'teeth' },
  { id: "tool_paws", name: "앞발/발톱 [ADD/APPLY]", weight: 0, type: "tool", canonicalToolId: 'paws' }
];

const INITIAL_WAGON: WagonExpansions = {
  baseUnit: false,
  sealedCarriage: false,
  pedalMotor: false,
  axelSprings: false,
  sideBrackets: false,
  hiveBrackets: false,
  passengerBooth: false,
  shadowCanvas: false,
  experimentalContraption: false,
  clayPots: false
};

const INITIAL_STATE: GameState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  rulebookEdition: RULEBOOK_EDITION,
  rulesetId: 'original-1e-3p',
  bio: INITIAL_BIO,
  reputation: 5,
  currentLocationName: "Odoak",
  currentLocationType: "City",
  currentRegion: "Forest",
  currentSeason: "Spring",
  completedSeasons: 0,
  bag: INITIAL_BAG,
  trinkets: ["기념품 (Memento)"],
  journeyActive: false,
  journeyOrigin: "",
  journeyDestination: "",
  journeyDistance: "",
  journeyTotalDistance: 0,
  journeyDirection: "",
  journeyGoalTitle: "",
  journeyGoalDesc: "",
  journeyGoalProgress: "",
  journey: null,
  pendingEnding: null,
  calendarDays: 0,
  calendarMaxDays: 12,
  calendarHistory: [],
  activeAilment: null,
  activeAilments: [],
  activePatientId: null,
  patients: [],
  barterCountThisAilment: 0,
  barterAttemptHistory: {},
  pendingBarter: null,
  pendingLeaveObligation: null,
  pendingAlternativeAcquisition: null,
  journals: [],
  barrows: [],
  activeDelve: null,
  pursuedByBehemoth: null,
  nextMoveSpeedOverride: null,
  wagonExpansions: INITIAL_WAGON,
  activePassenger: null,
  passengerPickupReady: false,
  companions: [],
  companionHive: [],
  resourcefulReagent: "",
  ingenuitiveTool: "",
  clinics: [],
  customMapLocations: [],
  customMapEdges: [],
  guildServiceTravelRerolls: 0,
  forecastMoves: 0,
  forecastActiveAtLocation: false,
  taxiSoarActive: false,
  griphUsedThisJourney: false,
  pondSkimmerUsedThisJourney: false,
  beetleUsedThisJourney: false,
  companionTravelPaths: 0,
  missiveSettlements: [],
  scroungingMode: false,
  scroungingTimer: 0,
  independentUsedThisAilment: false,
  visitedLocations: ["Odoak"],
  curedAilmentInThisWilds: false,
  needsLocalHelpBeforeMove: false,
  lastForageCardValue: 0,
  gardenPlant: "",
  gardenHarvestedThisAilment: false,
  soddenLogInsect: "",
  soddenLogHarvestedThisAilment: false,
  goodwillDonationsVal: 0,
  cumulativeDays: 0,
  completedReconnecting: false,
  journeyGoalCounter: 0,
  journeyGoalChecklist: [],
  journeyStartReputation: 5,
  activeBarter: null,
  legacyClinics: [],
  legacyApothecaries: [],
  discoveredRecipes: {},
  journeyChronicles: [],
  patientCasebook: [],
  patientArchive: [],
  pendingPatientArchive: null,
  worldAlmanac: [],
  travelScrapbook: [],
  trinketArchive: [],
  familiarTrust: 0,
  familiarMemories: [],
  legacyRestUsedThisLocation: false,
  lostPatientLegacy: null,
  pendingEncounter: null,
  pendingForaging: null,
  appliedTransactionIds: [],
  appliedEncounterEffectIds: [],
  pendingServices: [],
  serviceMapMutations: [],
  toolStates: [],
  wagonState: null,
  companionStates: [],
  companionHiveStates: [],
  rumours: [],
  clinicAgendaIds: [],
  ailmentTagOverrides: [],
  trinketRecords: [],
  legacyTrinketCount: 1,
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
  saveRevision: 0
};

// =================================================================
// 3. FORMATTING HELPERS
// =================================================================
const formatWeight = (w: number) => {
  if (w <= 0) return "0";
  const thirds = Math.round(w * 3);
  const whole = Math.floor(thirds / 3);
  const rem = thirds % 3;
  if (rem === 0) return `${whole}`;
  if (whole === 0) return `${rem}/3`;
  return `${whole} ${rem}/3`;
};

const getReputationRank = (rep: number) => {
  if (rep >= 35) return { rank: "신뢰받음", color: "#5c9c6f" };
  if (rep >= 25) return { rank: "명망 높음", color: "#6ba6c9" };
  if (rep >= 15) return { rank: "인지도 있음", color: "#e59a73" };
  return { rank: "미등록", color: "#9b9487" };
};

const CHARACTER_SUITS = ['♥', '♦', '♣', '♠'];

const drawPlayingCard = (): PlayingCard => ({
  suit: CHARACTER_SUITS[Math.floor(Math.random() * CHARACTER_SUITS.length)],
  value: Math.floor(Math.random() * 13) + 1
});

const cardRuleValue = (card: PlayingCard | null) => {
  if (!card) return '';
  return getRuleCardLabel(card);
};

const cardDisplayValue = (value: number) => {
  if (value === 1) return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  return String(value);
};

const drawSocialEncounterForLocation = (regionName: string, locationName: string, season: GameState['currentSeason']) => {
  const card = drawPlayingCard();
  const normalizedLocation = normalizeMapLocationName(locationName);
  const cityNames: Record<string, string> = {
    glasswall: 'Glasswall', '글래스월': 'Glasswall',
    noonhill: 'Noonhill', '눈힐': 'Noonhill',
    odoak: 'Odoak', '오도크': 'Odoak',
    newdam: 'Newdam', '뉴댐': 'Newdam',
    vessel: 'Vessel', '베슬': 'Vessel',
    summit: 'Summit', '서밋': 'Summit',
    spoolkeep: 'Spoolkeep', '스풀킵': 'Spoolkeep'
  };
  const city = Object.entries(cityNames).find(([key]) => normalizedLocation.includes(key))?.[1];
  const encounter = findEncounter({
    encounterType: 'social',
    region: regionName as any,
    card,
    season,
    locationType: city ? 'City' : 'Settlement',
    city
  });
  if (!encounter) return null;
  return {
    card,
    tableKey: city || regionName,
    encounter: { ...encounter, text: encounter.prompt, page: encounter.sourcePage }
  };
};

const examplesToOptions = (examples: string) => examples.split(',').map(item => item.trim()).filter(Boolean);

const findByCard = <T extends { card: string }>(items: T[], card: string) => items.find(item => item.card === card) || items[0];
const findBySuit = <T extends { suit: string }>(items: T[], suit: string) => {
  return items.find(item => item.suit.split('/').map(part => part.trim()).includes(suit)) || items[0];
};

const formatDateTime = (ts: number) => {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
};

const makeJournalPhotoId = () =>
  `journal_photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('사진 파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });

const loadImageFromDataUrl = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
    image.src = dataUrl;
  });

const compressJournalImage = (image: HTMLImageElement, maxSide: number, quality: number) => {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('사진을 압축할 수 없습니다.');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
};

const uploadJournalPhoto = async (photoId: string, fileName: string, dataUrl: string): Promise<Pick<JournalPhoto, 'dataUrl' | 'storagePath'>> => {
  const currentUser = auth?.currentUser;
  if (!storage || !currentUser) {
    return { dataUrl };
  }

  const safeName = fileName.replace(/[^\w.\-가-힣]/g, '_').slice(0, 80) || 'journal-photo.jpg';
  const path = `journalPhotos/${currentUser.uid}/${photoId}-${safeName}.jpg`;
  const photoRef = storageRef(storage, path);
  await uploadString(photoRef, dataUrl, 'data_url', {
    contentType: 'image/jpeg',
    customMetadata: { originalName: fileName }
  });
  const downloadUrl = await getDownloadURL(photoRef);
  return { dataUrl: downloadUrl, storagePath: path };
};

const deleteJournalPhotoFromStorage = async (photo: JournalPhoto) => {
  if (!storage || !photo.storagePath) return;
  try {
    await deleteObject(storageRef(storage, photo.storagePath));
  } catch (err) {
    console.warn('저널 사진 Storage 삭제 실패:', err);
  }
};

const getJournalPhotoSrc = (photo: JournalPhoto) => photo.dataUrl || '';

const prepareJournalPhoto = async (file: File): Promise<JournalPhoto> => {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name}은(는) 이미지 파일이 아닙니다.`);
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(rawDataUrl);
  let dataUrl = compressJournalImage(image, 1600, 0.78);

  if (dataUrl.length > 620000) dataUrl = compressJournalImage(image, 1200, 0.72);
  if (dataUrl.length > 820000) dataUrl = compressJournalImage(image, 900, 0.62);
  if (dataUrl.length > 900000) {
    throw new Error(`${file.name} 사진이 너무 큽니다. 더 작은 이미지로 다시 시도해 주세요.`);
  }

  const id = makeJournalPhotoId();
  const uploaded = await uploadJournalPhoto(id, file.name, dataUrl);

  return {
    id,
    name: file.name,
    ...uploaded
  };
};

const prepareJournalPhotos = async (files: FileList | null): Promise<JournalPhoto[]> => {
  if (!files || files.length === 0) return [];
  return Promise.all(Array.from(files).map(file => prepareJournalPhoto(file)));
};

function JournalPhotoImage({ photo, alt, imageStyle }: { photo: JournalPhoto; alt: string; imageStyle?: any }) {
  const [failed, setFailed] = useState(false);
  const src = getJournalPhotoSrc(photo);

  if (!src || failed) {
    return (
      <div className="journal-photo-missing">
        <strong>{photo.name || '사진'}</strong>
        <span>사진 데이터를 불러올 수 없습니다.</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={imageStyle}
    />
  );
}

const CLINIC_SERVICE_LABELS: Record<string, string> = {
  pantry: '식료품 저장고',
  library: '도서관',
  hive_boxes: '벌집 보관함',
  gardens: '약초 정원',
  greenhouses: '온실',
  sodden_logs: '물에 젖은 통나무',
  taproom: '선술집',
  hostel: '숙소',
  mailbox: '우체통',
  goodwill_stand: '친선 매대',
  none: '아젠다 미지정'
};

const clinicServiceLabel = (service?: string) => CLINIC_SERVICE_LABELS[service || 'none'] || service || '아젠다 미지정';

type MapRegion = 'Bog' | 'Forest' | 'Loch' | 'Meadow' | 'Mountain' | 'Titan' | 'Wilds';
type MapLocationKind = 'named' | 'wild' | 'settlement' | 'city' | 'ruin' | 'barrow' | 'clinic';

interface MapLocationNode {
  label: string;
  x: number;
  y: number;
  region?: MapRegion;
  kind?: MapLocationKind;
  aliases?: string[];
  neighbors: string[];
}

interface CustomMapLocation extends MapLocationNode {
  id: string;
  source?: string;
  createdAt?: number;
  hidden?: boolean;
}

interface CustomMapEdge {
  id: string;
  from: string;
  to: string;
  kind?: 'path' | 'river' | 'waterway';
  label?: string;
  createdAt?: number;
}

interface BarterLocationOption {
  key: string;
  name: string;
  type: 'Settlement' | 'City';
  region: string;
  relation: 'current' | 'adjacent';
}

const MAP_REGION_CODES: Record<string, MapRegion> = {
  B: 'Bog',
  F: 'Forest',
  L: 'Loch',
  M: 'Meadow',
  R: 'Mountain',
  T: 'Titan',
  W: 'Wilds'
};

const MAP_REGION_LABELS: Record<MapRegion, string> = {
  Bog: '수렁',
  Forest: '숲',
  Loch: '호수/강',
  Meadow: '초원',
  Mountain: '산맥',
  Titan: '티탄 유적',
  Wilds: '야생'
};

const MAP_REGION_COLORS: Record<MapRegion, string> = {
  Bog: '#9d2e84',
  Forest: '#5f8f3c',
  Loch: '#1c6da8',
  Meadow: '#e5a832',
  Mountain: '#b7533c',
  Titan: '#77726c',
  Wilds: '#6b7280'
};

const MAP_LOCATIONS: Record<string, MapLocationNode> = {
  narin: { label: 'Narin', x: 11, y: 11, neighbors: ['widim', 'olddam'] },
  widim: { label: 'Widim', x: 10, y: 27, neighbors: ['narin', 'windtop', 'whitebirch'] },
  windtop: { label: 'Windtop', x: 8, y: 54, neighbors: ['widim', 'sailors_fang', 'bigpaw'] },
  bigpaw: { label: 'Bigpaw', x: 11, y: 83, neighbors: ['windtop', 'moatcourt'] },
  moatcourt: { label: 'Moatcourt', x: 20, y: 92, neighbors: ['bigpaw', 'glasswall'] },
  wavshade: { label: 'Waveshade', x: 18, y: 72, neighbors: ['glasswall', 'locsid'] },
  glasswall: { label: 'Glasswall', x: 27, y: 69, aliases: ['글래스월'], neighbors: ['vessel', 'wavshade', 'moatcourt', 'locsid'] },
  vessel: { label: 'Vessel', x: 34, y: 71, aliases: ['베셀'], neighbors: ['glasswall', 'noonhill', 'sailors_fang'] },
  noonhill: { label: 'Noonhill', x: 37, y: 91, aliases: ['눈힐'], neighbors: ['vessel', 'bogbridge', 'moatcourt'] },
  bogbridge: { label: 'Bogbridge', x: 46, y: 92, neighbors: ['noonhill', 'summit', 'sweetgorse'] },
  summit: { label: 'Summit', x: 90, y: 91, aliases: ['서밋'], neighbors: ['sweetgorse', 'shallot'] },
  sweetgorse: { label: 'Sweetgorse', x: 80, y: 88, neighbors: ['summit', 'shallot', 'bogbridge'] },
  shallot: { label: 'Shallot', x: 81, y: 78, neighbors: ['sweetgorse', 'loho', 'summit'] },
  loho: { label: 'Loho', x: 82, y: 57, neighbors: ['shallot', 'solkroot', 'highroad'] },
  solkroot: { label: 'Solkroot', x: 88, y: 56, neighbors: ['loho', 'bowing_hog', 'deepholm'] },
  bowing_hog: { label: 'Bowing Hog', x: 94, y: 66, neighbors: ['solkroot', 'deepholm'] },
  deepholm: { label: 'Deepholm', x: 95, y: 54, neighbors: ['bowing_hog', 'greenport', 'solkroot'] },
  greenport: { label: 'Greenport', x: 96, y: 42, neighbors: ['deepholm', 'grainport'] },
  grainport: { label: 'Grainport', x: 87, y: 39, neighbors: ['greenport', 'oldwife', 'cres_stitch'] },
  oldwife: { label: 'Oldwife', x: 80, y: 43, neighbors: ['grainport', 'boatlast', 'highroad'] },
  highroad: { label: 'Highroad', x: 74, y: 48, neighbors: ['oldwife', 'seven_flowers', 'loho'] },
  seven_flowers: { label: 'Seven Flowers', x: 67, y: 47, neighbors: ['highroad', 'tuskpoint', 'boatlast'] },
  boatlast: { label: 'Boatlast', x: 74, y: 40, neighbors: ['oldwife', 'pinesworth', 'seven_flowers'] },
  pinesworth: { label: 'Pinesworth', x: 65, y: 40, neighbors: ['boatlast', 'fort_ard', 'odoak'] },
  fort_ard: { label: 'Fort Ard', x: 58, y: 39, neighbors: ['pinesworth', 'odoak', 'parsley_nook'] },
  tuskpoint: { label: 'Tuskpoint', x: 59, y: 60, neighbors: ['seven_flowers', 'spinner_cot', 'rosehill'] },
  spinner_cot: { label: "Spinner's Cot", x: 50, y: 60, neighbors: ['tuskpoint', 'holdall', 'crossyce'] },
  holdall: { label: 'Holdall', x: 44, y: 62, neighbors: ['spinner_cot', 'spoutneck', 'obridge'] },
  rosehill: { label: 'Rosehill', x: 64, y: 65, neighbors: ['tuskpoint', 'shallot'] },
  crossyce: { label: 'Crossyce', x: 50, y: 49, neighbors: ['spinner_cot', 'odoak', 'widrow'] },
  obridge: { label: 'Obridge', x: 44, y: 39, neighbors: ['holdall', 'spoutneck', 'odoak'] },
  spoutneck: { label: 'Spoutneck', x: 31, y: 39, neighbors: ['obridge', 'brander', 'locsid'] },
  brander: { label: 'Brander', x: 30, y: 50, neighbors: ['spoutneck', 'sailors_fang', 'holdall'] },
  locsid: { label: 'Locsid', x: 30, y: 56, neighbors: ['brander', 'wavshade', 'glasswall'] },
  sailors_fang: { label: "Sailor's Fang", x: 23, y: 56, neighbors: ['windtop', 'brander', 'vessel'] },
  odoak: { label: 'Odoak', x: 47, y: 34, aliases: ['오도악'], neighbors: ['obridge', 'widrow', 'fort_ard', 'pinesworth', 'crossyce'] },
  widrow: { label: 'Widrow', x: 53, y: 32, neighbors: ['odoak', 'widfneck', 'willow_moot', 'parsley_nook'] },
  widfneck: { label: 'Widfneck', x: 45, y: 29, neighbors: ['widrow', 'whitebirch', 'odoak'] },
  whitebirch: { label: 'Whitebirch', x: 30, y: 23, neighbors: ['widfneck', 'widim', 'fallowfields'] },
  fallowfields: { label: 'Fallowfields', x: 43, y: 17, neighbors: ['whitebirch', 'aspengrace', 'lady_bank'] },
  aspengrace: { label: 'Aspengrace', x: 51, y: 21, neighbors: ['fallowfields', 'bramblefork', 'brambledam'] },
  bramblefork: { label: 'Bramblefork', x: 54, y: 15, neighbors: ['aspengrace', 'blueberry_pond'] },
  willow_moot: { label: 'Willow Moot', x: 59, y: 24, neighbors: ['widrow', 'parsley_nook', 'brambledam'] },
  parsley_nook: { label: 'Parsley Nook', x: 62, y: 31, neighbors: ['willow_moot', 'widrow', 'fort_ard'] },
  brambledam: { label: 'Brambledam', x: 61, y: 20, neighbors: ['willow_moot', 'aspengrace', 'blackberry_log'] },
  blueberry_pond: { label: 'Blueberry Pond', x: 59, y: 9, neighbors: ['bramblefork', 'brambledam', 'lady_bank'] },
  olddam: { label: 'Olddam', x: 29, y: 10, neighbors: ['narin', 'newdam', 'lady_bank'] },
  lady_bank: { label: "Lady's Bank", x: 43, y: 5, neighbors: ['olddam', 'blueberry_pond', 'fallowfields'] },
  newdam: { label: 'New Dam', x: 35, y: 7, aliases: ['Newdam', '뉴댐'], neighbors: ['olddam', 'lady_bank'] },
  blackberry_log: { label: 'Blackberry Log', x: 72, y: 22, neighbors: ['brambledam', 'fort_bulrush', 'cres_stitch'] },
  fort_bulrush: { label: 'Fort Bulrush', x: 80, y: 23, neighbors: ['blackberry_log', 'apple_stump', 'grainport'] },
  cres_stitch: { label: 'Cres Stitch', x: 82, y: 35, neighbors: ['fort_bulrush', 'grainport', 'blackberry_log'] },
  apple_stump: { label: 'Apple Stump', x: 86, y: 18, neighbors: ['fort_bulrush', 'elderflower_flux', 'eyrin'] },
  elderflower_flux: { label: 'Elderflower Flux', x: 86, y: 13, neighbors: ['apple_stump', 'spoolkeep', 'eyrin'] },
  eyrin: { label: 'Eyrin', x: 90, y: 24, neighbors: ['apple_stump', 'spoolkeep', 'greenport'] },
  spoolkeep: { label: 'Spoolkeep', x: 94, y: 17, aliases: ['스풀킵'], neighbors: ['elderflower_flux', 'eyrin', 'screens', 'crowless'] },
  screens: { label: 'Screens', x: 88, y: 8, neighbors: ['spoolkeep', 'skimslim'] },
  skimslim: { label: 'Skimslim', x: 74, y: 5, neighbors: ['screens', 'blueberry_pond'] },
  crowless: { label: 'Crowless', x: 96, y: 9, neighbors: ['spoolkeep', 'screens'] },
  starting_oak_road: { label: 'Odoak', x: 26, y: 34, aliases: ['Starting Odoak', '오크 길'], neighbors: ['whitebirch', 'spoutneck'] }
};

const MAP_WAYPOINTS = `77.96,3.81;48.38,4.34;82.68,4.78;54.52,5.04;51.24,5.17;3.95,5.34;47.85,5.83;61.54,6.12;85.58,6.23;7.30,6.32;44.97,6.34;57.71,6.45;76.58,6.49;72.81,6.92;90.75,6.80;84.35,7.21;14.61,7.41;88.68,7.40;65.77,7.49;43.25,7.89;76.97,8.20;63.67,8.44;82.11,8.36;51.24,8.72;7.60,8.92;33.59,8.99;36.50,9.19;69.52,9.25;21.31,9.41;92.50,9.93;61.26,10.02;4.25,10.13;63.78,10.40;71.82,10.39;26.38,10.76;9.47,11.08;29.41,11.15;16.21,11.45;12.33,12.09;67.41,12.04;38.96,12.34;77.32,12.40;49.35,12.83;95.11,12.86;3.64,13.38;30.31,13.46;36.12,13.63;57.04,14.17;64.86,13.92;14.78,13.99;83.44,14.14;23.20,14.61;31.18,15.22;80.77,15.21;74.68,15.32;28.89,15.61;68.89,15.54;34.59,15.86;86.57,15.83;18.64,16.17;65.83,16.55;5.63,16.63;37.53,16.72;44.56,17.11;14.47,17.17;29.04,17.21;96.62,17.35;65.03,17.82;33.03,17.79;77.19,17.94;22.91,18.04;87.43,18.02;39.68,18.17;93.68,18.63;90.03,18.78;36.71,18.82;84.21,18.97;44.61,19.05;4.77,19.22;70.66,19.56;60.19,19.47;16.07,19.78;28.15,19.81;40.41,20.04;25.26,20.39;76.37,20.38;12.75,20.47;38.59,20.56;70.52,20.64;36.63,20.73;20.27,21.13;9.16,21.80;50.37,22.17;46.63,22.15;96.51,22.39;62.74,22.50;17.38,22.88;19.43,23.03;67.68,23.07;15.96,23.19;49.46,23.28;23.47,23.53;41.65,23.82;75.38,23.96;27.90,24.15;77.92,24.33;93.80,24.46;37.98,24.67;57.78,24.75;35.95,24.84;2.85,24.87;15.89,24.98;53.11,25.23;64.47,25.20;60.96,25.53;72.93,25.56;95.52,25.66;69.92,25.82;21.93,26.32;92.94,26.55;65.79,27.73;42.94,27.82;58.70,27.84;28.25,27.84;8.11,27.99;83.90,27.94;40.93,28.10;33.31,28.21;61.73,28.44;5.32,28.69;32.83,29.27;72.04,29.25;86.80,29.78;21.67,29.85;56.14,29.91;36.34,29.97;64.77,30.15;33.28,30.35;18.38,30.61;75.96,31.05;15.33,31.89;79.03,32.02;52.05,32.46;81.97,32.41;58.62,32.59;89.90,32.69;2.81,32.77;41.69,32.76;55.04,32.83;9.47,33.05;32.09,33.08;62.67,33.40;27.11,33.48;85.40,33.57;15.48,33.90;20.37,34.07;47.94,34.45;73.45,34.70;45.83,34.85;5.05,35.42;79.30,35.53;16.45,35.66;28.63,35.65;86.87,35.69;24.82,36.16;55.02,36.65;12.71,36.47;57.84,36.52;30.83,36.60;61.03,37.06;42.26,37.28;55.98,37.21;94.81,37.48;65.63,37.84;87.15,38.07;18.33,38.07;28.07,38.11;34.15,38.17;69.39,38.10;23.46,38.20;45.58,38.19;11.59,38.67;5.55,38.78;20.14,38.79;37.26,38.96;76.87,39.18;62.68,39.37;35.27,39.46;22.15,39.61;54.94,39.94;97.05,39.94;50.06,40.14;27.28,40.26;32.70,40.55;58.59,40.47;21.13,40.81;64.42,40.85;78.55,40.94;24.80,41.25;74.77,41.31;52.75,41.37;15.64,41.93;88.11,41.89;54.80,41.97;22.33,42.22;84.34,42.24;80.28,42.40;56.49,42.95;94.75,42.39;69.39,42.89;37.76,42.98;30.57,43.20;40.36,43.38;55.71,43.60;93.32,43.71;90.84,43.84;96.44,43.84;36.09,44.05;73.11,44.01;65.25,44.18;55.73,44.48;33.19,44.67;18.82,44.87;67.38,45.81;23.01,45.89;97.14,45.90;45.11,46.15;27.06,46.36;5.47,46.65;92.24,46.82;15.75,46.94;86.49,47.02;36.04,47.34;51.95,47.87;95.75,47.94;39.72,48.39;69.44,48.45;48.43,48.68;90.13,48.64;33.11,48.91;26.14,49.15;9.25,49.30;86.81,49.97;96.63,49.94;72.54,50.29;15.57,50.48;36.10,50.57;91.71,50.68;31.70,51.00;28.98,51.16;57.41,51.36;33.93,51.44;44.94,51.72;95.62,51.81;41.97,51.97;89.15,51.96;39.66,52.20;83.78,52.20;77.16,52.49;68.50,52.69;86.55,52.67;93.35,52.82;91.54,52.89;47.67,53.06;18.05,53.15;39.06,53.13;25.73,53.19;30.66,53.82;84.94,54.15;63.77,54.35;73.82,54.34;10.30,54.64;75.76,55.56;61.18,55.66;34.97,55.85;7.24,56.10;84.01,56.68;31.18,56.94;66.62,57.07;82.20,57.21;87.38,57.48;18.29,57.50;63.54,57.49;51.69,57.89;75.59,58.11;9.43,59.05;54.78,59.02;14.61,59.25;79.52,59.69;70.09,59.81;73.00,60.10;48.53,60.28;58.41,60.39;20.27,61.21;46.55,61.31;90.53,61.58;7.83,61.62;76.55,61.75;28.95,62.48;17.15,62.43;55.27,62.52;61.68,62.56;37.77,63.01;45.16,63.15;69.82,63.35;4.82,63.64;83.63,63.63;89.58,64.22;74.35,64.51;62.67,64.82;19.66,65.38;42.42,65.49;81.48,66.02;4.78,66.10;77.93,66.87;57.95,67.16;27.65,67.24;82.94,67.32;68.96,67.40;73.46,67.78;85.21,68.00;92.97,68.29;13.82,68.82;9.23,68.96;78.29,69.78;44.18,70.61;66.54,70.59;21.27,70.88;55.47,71.20;83.21,71.25;6.45,71.36;71.79,72.93;51.87,73.20;80.53,74.41;13.53,75.13;75.20,75.65;58.14,76.32;5.92,76.05;38.02,76.00;77.36,76.19;62.09,76.09;77.78,77.83;34.37,78.32;61.39,78.56;18.01,79.10;89.08,79.18;60.24,79.59;5.85,79.88;57.55,80.23;61.60,80.71;78.97,81.13;93.38,81.10;10.27,81.75;29.45,82.46;91.28,82.79;50.68,83.22;68.49,83.20;12.53,83.90;3.81,83.97;8.21,84.15;80.86,84.17;19.75,84.38;93.55,84.59;39.14,84.86;91.14,85.06;35.93,85.91;63.32,86.24;76.98,86.32;85.58,86.60;32.93,86.63;95.47,87.29;53.93,87.41;91.80,87.41;41.28,87.67;12.57,87.84;8.23,88.03;4.25,88.09;72.71,88.21;44.95,88.95;87.64,89.45;91.19,89.55;37.78,90.05;69.30,90.09;59.15,90.12;48.53,90.41;95.26,90.79;31.52,90.93;35.66,91.31;82.58,92.16;75.99,92.43;51.28,92.40;39.43,92.86;53.89,92.98;4.24,93.13;8.48,93.24;15.85,93.25;42.51,93.28;59.73,93.33;34.02,93.56;86.75,94.04;24.39,94.30;93.97,95.40;57.60,96.28;19.68,96.37;39.69,96.45;8.65,96.72;12.46,96.74;4.35,96.82;26.78,97.28`
  .split(';')
  .map(pair => pair.split(',').map(Number) as [number, number]);

const MAP_WILD_REGION_CODES = `RRRLMMRRRRRRMRRRBRBRLBRLRLLMRRBRBMMLLMLMMFBMBRMTFBFRRFFRFMFMFMFBRRMLMLFFFRFFFMBLLRMFFFLLLFFBMMMFRLMRMFFFFFFFMMRRMFMFFFMMMLMLLMFFFRLMFRMMMLBMRMLFFFRMFRLFBFRRFFFRMRBFBLMFBMLFLFMRBMLMFRBRMFFLRLFFMBFRFFMLFRMFFFFLFFBBBLFFFMFFFBLMFFMFFFMMBMFBFMFBFFFFFRBFFLFMBFBFLMLFFFFMRLFFFBBMFLLRMFFMLRFFFRFRFMFFFRFMRFMMFMFMMBFFFMRFFRFBMFFFMMRRMFBFBFBBMFRLMBWLMLWLMMLFLLMMMBMMMFFFMMMBBBMMMBMBBBFFFMBMBBMBBMBBLLBBBFFFBBBMMMBBBFFFB`;

const MAP_WILD_LOCATIONS = MAP_WAYPOINTS.map(([x, y], index) => {
  const region = MAP_REGION_CODES[MAP_WILD_REGION_CODES[index]] || 'Wilds';
  return {
    label: `${MAP_REGION_LABELS[region]} 위치 ${index + 1}`,
    x,
    y,
    region,
    kind: 'wild' as const,
    neighbors: []
  };
});

const MAP_SERVICE_HOPS = 3;

const MAP_GRAPH_NODES: Record<string, MapLocationNode> = (() => {
  const nodes: Record<string, MapLocationNode> = {};
  Object.entries(MAP_LOCATIONS).forEach(([key, node]) => {
    nodes[key] = {
      ...node,
      aliases: node.aliases ? [...node.aliases] : undefined,
      neighbors: []
    };
  });

  MAP_WILD_LOCATIONS.forEach((location, index) => {
    nodes[`loc_${index}`] = { ...location, neighbors: [] };
  });

  const connect = (from: string, to: string) => {
    if (!nodes[from] || !nodes[to] || from === to) return;
    if (!nodes[from].neighbors.includes(to)) nodes[from].neighbors.push(to);
    if (!nodes[to].neighbors.includes(from)) nodes[to].neighbors.push(from);
  };

  MARKER_EDGES.forEach(edge => connect(edge.from, edge.to));
  return nodes;
})();

const normalizeMapLocationName = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/gi, '_').replace(/^_+|_+$/g, '');

const buildMapGraphNodes = (customLocations: CustomMapLocation[] = [], customEdges: CustomMapEdge[] = []): Record<string, MapLocationNode> => {
  const nodes: Record<string, MapLocationNode> = {};
  Object.entries(MAP_GRAPH_NODES).forEach(([key, node]) => {
    const marker = MARKER_BY_ID.get(key);
    nodes[key] = {
      ...node,
      aliases: node.aliases ? [...node.aliases] : undefined,
      neighbors: [...node.neighbors],
      kind: node.kind || marker?.kind,
      region: node.region || (marker?.region as MapRegion | undefined)
    };
  });

  loadPlayerMarkers().forEach(record => {
    const existing = nodes[record.id];
    const kind = (record.kind as MapLocationKind | undefined) || existing?.kind || 'wild';
    const region = (record.region as MapRegion | undefined) || existing?.region;
    if (existing) {
      nodes[record.id] = {
        ...existing,
        label: record.label || existing.label,
        x: record.x,
        y: record.y,
        kind,
        region
      };
      return;
    }
    nodes[record.id] = {
      label: record.label,
      x: record.x,
      y: record.y,
      kind,
      region,
      neighbors: []
    };
  });

  customLocations.forEach(location => {
    if (location.hidden) {
      delete nodes[location.id];
      return;
    }
    const existing = nodes[location.id];
    if (existing) {
      nodes[location.id] = {
        ...existing,
        ...location,
        label: location.label || existing.label,
        x: Number.isFinite(location.x) ? location.x : existing.x,
        y: Number.isFinite(location.y) ? location.y : existing.y,
        region: location.region || existing.region,
        kind: location.kind || existing.kind,
        aliases: Array.from(new Set([...(existing.aliases || []), ...(location.aliases || [])])),
        neighbors: Array.from(new Set([...(existing.neighbors || []), ...(location.neighbors || [])]))
      };
      return;
    }
    nodes[location.id] = {
      ...location,
      aliases: location.aliases ? [...location.aliases] : undefined,
      neighbors: [...(location.neighbors || [])]
    };
  });

  customEdges.forEach(edge => {
    if (!nodes[edge.from] || !nodes[edge.to]) return;
    if (!nodes[edge.from].neighbors.includes(edge.to)) nodes[edge.from].neighbors.push(edge.to);
    if (!nodes[edge.to].neighbors.includes(edge.from)) nodes[edge.to].neighbors.push(edge.from);
  });

  Object.keys(nodes).forEach(key => {
    nodes[key].neighbors = (nodes[key].neighbors || []).filter(neighbor => !!nodes[neighbor]);
  });

  Object.entries(nodes).forEach(([key, node]) => {
    node.neighbors.forEach(neighbor => {
      if (nodes[neighbor] && !nodes[neighbor].neighbors.includes(key)) {
        nodes[neighbor].neighbors.push(key);
      }
    });
  });

  return nodes;
};

const mapEdgeKind = (
  from: string,
  to: string,
  nodes: Record<string, MapLocationNode>,
  customEdges: CustomMapEdge[] = []
): 'path' | 'river' | 'waterway' => {
  const custom = customEdges.find(edge =>
    (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
  );
  if (custom?.kind === 'path' || custom?.kind === 'river' || custom?.kind === 'waterway') return custom.kind;
  return markerEdgeKind(from, to);
};

const findGraphLocationKey = (name: string, nodes: Record<string, MapLocationNode>): string => {
  const normalized = normalizeMapLocationName(name);
  return Object.entries(nodes).find(([key, node]) =>
    key === normalized
    || normalizeMapLocationName(node.label) === normalized
    || (node.aliases || []).some(alias => normalizeMapLocationName(alias) === normalized)
  )?.[0] || '';
};

const canonicalLocationType = (value: string): GameplayLocationType => {
  if (value === 'Settlement' || value === 'City' || value === 'Titan Ruin' || value === 'Behemoth Barrow') return value;
  if (value === 'Ruin') return 'Titan Ruin';
  if (value === 'Barrow') return 'Behemoth Barrow';
  return 'Wilds';
};

const toEngineInventory = (bag: readonly BagItem[]): EngineInventoryItem[] => bag.map(item => ({
  id: item.id,
  name: item.name,
  type: item.type,
  weight: item.weight,
  quantity: item.qty,
  canonicalToolId: item.canonicalToolId,
  canonicalReagentId: item.canonicalReagentId,
  preparationId: item.preparationId,
  usesRemaining: item.usesRemaining,
  ruinedWhenSoaked: item.ruinedWhenSoaked ?? item.type === 'reagent',
  customReagent: item.customReagent,
  provenance: item.provenance,
  guildNote: item.guildNote,
  granitePounded: item.granitePounded,
  craftedItemId: item.craftedItemId
}));

const fromEngineInventory = (inventory: readonly EngineInventoryItem[], previous: readonly BagItem[]): BagItem[] => {
  const previousById = new Map(previous.map(item => [item.id, item]));
  return inventory.map(item => ({
    ...previousById.get(item.id),
    id: item.id,
    name: item.name,
    type: item.type,
    weight: item.weight,
    qty: item.quantity,
    canonicalToolId: item.canonicalToolId,
    canonicalReagentId: item.canonicalReagentId,
    preparationId: item.preparationId,
    usesRemaining: item.usesRemaining,
    ruinedWhenSoaked: item.ruinedWhenSoaked,
    customReagent: item.customReagent,
    provenance: item.provenance,
    guildNote: item.guildNote,
    granitePounded: item.granitePounded,
    craftedItemId: item.craftedItemId
  }));
};

const canonicalToolsFromState = (state: GameState): CanonicalToolState[] => {
  const familiarMechanic = getActiveFamiliarMechanic(state);
  const ingenuitiveToolId = familiarMechanic === 'ingenuitive'
    ? state.activePassenger?.ingenuitiveToolId || state.ingenuitiveTool
    : null;
  const ingenuitiveSourceId = state.activePassenger?.id || state.journey?.journeyId || 'current-journey';
  const ingenuitiveInstanceId = `familiar:ingenuitive:${ingenuitiveSourceId}:${ingenuitiveToolId || 'none'}`;
  const storedById = new Map(
    (state.toolStates as CanonicalToolState[])
      .filter(tool => tool && typeof tool.instanceId === 'string')
      .map(tool => [tool.instanceId, tool])
  );
  const tools = [...storedById.values()];
  state.bag.forEach(item => {
    if (item.type !== 'tool' || !item.canonicalToolId || storedById.has(item.id)) return;
    tools.push({
      instanceId: item.id,
      toolId: item.canonicalToolId,
      upgradeId: null,
      charges: null,
      broken: false,
      consumed: false,
      acquiredBy: 'campaign-inventory',
      appliedEffectIds: []
    });
  });
  return withIngenuitiveToolBenefit(
    tools,
    ingenuitiveToolId && TOOL_BY_ID.has(ingenuitiveToolId) ? ingenuitiveToolId : null,
    ingenuitiveInstanceId
  );
};

const commitPendingAlternativeAcquisition = (
  state: GameState,
  source: 'forage' | 'barter',
  sourceTransactionId: string
): GameState => {
  const acquisition = state.pendingAlternativeAcquisition;
  if (!acquisition || acquisition.kind !== 'replacement' || (acquisition.selectedSource && acquisition.selectedSource !== source)) return state;
  const patient = state.patients.find(row => row.id === state.activePatientId);
  if (!patient) return state;
  const transactionId = `alternative:${acquisition.id}:${sourceTransactionId}`;
  const result = commitAlternativeAcquisition({
    transactionId,
    acquisition,
    source,
    sourceTransactionId,
    acquisitionSucceeded: true,
    state: {
      inventory: toEngineInventory(state.bag),
      patient,
      reputation: state.reputation,
      trinkets: state.trinkets.length,
      currentRegion: (state.currentRegion === 'Barrow' ? 'Titan' : state.currentRegion) as Region,
      adjacentRegions: [],
      foragingPoints: state.activeAilment?.foragingPoints || 0,
      pendingObligation: null,
      journalEvents: [],
      appliedTransactionIds: state.appliedTransactionIds
    }
  });
  if (!result.value) return state;
  return {
    ...state,
    bag: fromEngineInventory(result.value.inventory, state.bag),
    pendingAlternativeAcquisition: null,
    appliedTransactionIds: result.value.appliedTransactionIds,
    journals: result.value.journalEvents.map(event => ({
      id: event.id,
      title: event.title,
      text: event.text,
      timestamp: Date.now()
    })).concat(state.journals)
  };
};

const findMapLocationKey = (name: string, customLocations: CustomMapLocation[] = []) => {
  const normalized = normalizeMapLocationName(name);
  const custom = customLocations.find(location =>
    location.id === normalized ||
    normalizeMapLocationName(location.label) === normalized ||
    (location.aliases || []).some(alias => normalizeMapLocationName(alias) === normalized)
  );
  if (custom) return custom.id;

  const direct = Object.entries(MAP_LOCATIONS).find(([key, node]) =>
    key === normalized || normalizeMapLocationName(node.label) === normalized || (node.aliases || []).some(alias => normalizeMapLocationName(alias) === normalized)
  );
  return direct?.[0] || '';
};

const getMapServiceEntriesWithinHops = (startName: string, maxHops: number = MAP_SERVICE_HOPS, customLocations: CustomMapLocation[] = [], customEdges: CustomMapEdge[] = []) => {
  const graphNodes = buildMapGraphNodes(customLocations, customEdges);
  const startKey = findMapLocationKey(startName, customLocations);
  if (!startKey) return [];
  const seen = new Map<string, number>([[startKey, 0]]);
  const queue = [startKey];
  while (queue.length > 0) {
    const key = queue.shift()!;
    const depth = seen.get(key) || 0;
    if (depth >= maxHops) continue;
    for (const next of graphNodes[key]?.neighbors || []) {
      if (!seen.has(next)) {
        seen.set(next, depth + 1);
        queue.push(next);
      }
    }
  }
  return [...seen.entries()].map(([key, hops]) => ({ key, hops, node: graphNodes[key] })).filter(entry => entry.node);
};

const getMapLocationsWithinHops = (startName: string, maxHops: number = MAP_SERVICE_HOPS, customLocations: CustomMapLocation[] = [], customEdges: CustomMapEdge[] = []) =>
  getMapServiceEntriesWithinHops(startName, maxHops, customLocations, customEdges).filter(entry => entry.node.kind !== 'wild');

const BARTER_CITY_LOCATION_NAMES = ['Glasswall', 'Summit', 'Spoolkeep', 'New Dam', 'Newdam', 'Vessel', 'Odoak', 'Noonhill'];

const isKnownBarterCity = (key: string, node: MapLocationNode) => {
  const normalizedCityNames = BARTER_CITY_LOCATION_NAMES.map(normalizeMapLocationName);
  return [key, node.label, ...(node.aliases || [])].some(name => normalizedCityNames.includes(normalizeMapLocationName(name)));
};

const getBarterTypeForMapNode = (key: string, node: MapLocationNode): 'Settlement' | 'City' | '' => {
  if (node.kind === 'city') return 'City';
  if (node.kind === 'settlement') return 'Settlement';
  if (node.kind === 'wild' || node.kind === 'ruin' || node.kind === 'barrow') return '';
  if (isKnownBarterCity(key, node)) return 'City';
  if (MAP_LOCATIONS[key] && key !== 'starting_oak_road') return 'Settlement';
  return '';
};

const getAvailableBarterLocations = (s: GameState): BarterLocationOption[] => {
  const options: BarterLocationOption[] = [];
  const addOption = (option: BarterLocationOption) => {
    if (!options.some(existing => normalizeMapLocationName(existing.name) === normalizeMapLocationName(option.name))) {
      options.push(option);
    }
  };

  if (s.currentLocationType === 'Settlement' || s.currentLocationType === 'City') {
    addOption({
      key: findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName),
      name: s.currentLocationName,
      type: s.currentLocationType,
      region: s.currentRegion,
      relation: 'current'
    });
  }

  const graphNodes = buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || []);
  const currentKey = findMapLocationKey(s.currentLocationName, s.customMapLocations || []);
  if (!currentKey || !graphNodes[currentKey]) return options;

  (graphNodes[currentKey].neighbors || []).forEach(neighborKey => {
    const node = graphNodes[neighborKey];
    if (!node) return;
    const type = getBarterTypeForMapNode(neighborKey, node);
    if (!type) return;
    addOption({
      key: neighborKey,
      name: node.label,
      type,
      region: node.region || s.currentRegion,
      relation: 'adjacent'
    });
  });

  return options;
};

const toRuleRegion = (value: string | undefined, fallback: string = 'Forest'): Region => {
  const candidate = value === 'Barrow' || value === 'Wilds' ? fallback : value;
  return ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan'].includes(candidate || '')
    ? candidate as Region
    : 'Forest';
};

const toRuleMapGraph = (s: GameState): Record<string, JourneyMapNode> => {
  const source = buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || []);
  return Object.fromEntries(Object.entries(source).map(([id, node]) => {
    const barterType = getBarterTypeForMapNode(id, node);
    const locationType: JourneyMapNode['locationType'] = barterType
      || (node.kind === 'ruin' ? 'Titan Ruin' : node.kind === 'barrow' ? 'Behemoth Barrow' : 'Wilds');
    return [id, {
      id,
      name: node.label,
      x: node.x,
      y: node.y,
      region: toRuleRegion(node.region, s.currentRegion),
      locationType,
      neighbors: [...node.neighbors]
    }];
  }));
};

const toTravelEngineGraph = (s: GameState) => {
  const source = buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || []);
  return Object.fromEntries(Object.entries(source).map(([id, node]) => {
    const barterType = getBarterTypeForMapNode(id, node);
    const locationType = (barterType
      || (node.kind === 'ruin' ? 'Titan Ruin' : node.kind === 'barrow' ? 'Behemoth Barrow' : 'Wilds')) as 'Wilds' | 'Settlement' | 'City' | 'Titan Ruin' | 'Behemoth Barrow';
    return [id, {
      id,
      name: node.label,
      x: node.x,
      y: node.y,
      region: toRuleRegion(node.region, s.currentRegion),
      locationType,
      edges: (node.neighbors || []).filter(to => source[to]).map(to => ({
        to,
        kind: mapEdgeKind(id, to, source, s.customMapEdges || [])
      }))
    }];
  }));
};

const collectLocationDistances = (
  graph: Record<string, { neighbors?: string[] }>,
  originId: string,
  maxPaths = 64
): Map<string, number> => {
  const distances = new Map<string, number>();
  if (!originId || !graph[originId]) return distances;
  distances.set(originId, 0);
  const queue = [originId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const distance = distances.get(id)!;
    if (distance >= maxPaths) continue;
    (graph[id]?.neighbors || []).forEach(next => {
      if (!distances.has(next)) {
        distances.set(next, distance + 1);
        queue.push(next);
      }
    });
  }
  return distances;
};

const toMapPlaceType = (kind?: string): MapPlaceType => {
  if (kind === 'city' || kind === 'City') return 'City';
  if (kind === 'settlement' || kind === 'Settlement') return 'Settlement';
  if (kind === 'ruin' || kind === 'Ruin' || kind === 'Titan Ruin') return 'Ruin';
  if (kind === 'barrow' || kind === 'Barrow' || kind === 'Behemoth Barrow') return 'Barrow';
  return 'Wilds';
};

const destTypeFromMapPick = (kind?: string): string => {
  if (kind === 'city' || kind === 'City') return 'City';
  if (kind === 'settlement' || kind === 'Settlement') return 'Settlement';
  if (kind === 'ruin' || kind === 'Ruin' || kind === 'Titan Ruin') return 'Ruin';
  if (kind === 'barrow' || kind === 'Barrow' || kind === 'Behemoth Barrow') return 'Barrow';
  return 'Wilds';
};

const adjacentRuleRegions = (s: GameState): Region[] => {
  const graph = toRuleMapGraph(s);
  const currentId = findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName);
  const maxPaths = (s.currentSeason === 'Autumn' || s.currentSeason === 'Winter')
    && s.bag.some(item => item.craftedItemId === 'knitted-coat') ? 2 : 1;
  const distances = new Map<string, number>([[currentId, 0]]);
  const queue = [currentId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const distance = distances.get(id)!;
    if (distance >= maxPaths) continue;
    (graph[id]?.neighbors || []).forEach(next => {
      if (!distances.has(next)) {
        distances.set(next, distance + 1);
        queue.push(next);
      }
    });
  }
  return Array.from(new Set([...distances.entries()].filter(([id, distance]) => id !== currentId && distance <= maxPaths)
    .map(([id]) => graph[id]?.region).filter((region): region is Region => Boolean(region))));
};

const toBarterMapGraph = (s: GameState): Record<string, BarterMapNode> => Object.fromEntries(
  Object.entries(toRuleMapGraph(s)).map(([id, node]) => [id, {
    id,
    region: node.region,
    locationType: node.locationType,
    neighbors: node.neighbors
  }])
);

const toServiceMapGraph = (s: GameState): ServiceRuntimeState['graph'] => Object.fromEntries(
  Object.entries(toRuleMapGraph(s)).map(([id, node]) => [id, {
    id,
    name: node.name,
    x: node.x,
    y: node.y,
    region: node.region,
    locationType: node.locationType,
    edges: node.neighbors.map(to => ({
      to,
      kind: mapEdgeKind(id, to, buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || []), s.customMapEdges || [])
    }))
  }])
);

const toServiceRuntime = (s: GameState): ServiceRuntimeState => ({
  currentLocationId: findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName),
  currentLocationName: s.currentLocationName,
  currentLocationType: canonicalLocationType(s.currentLocationType),
  currentRegion: toRuleRegion(s.currentRegion),
  currentSeason: s.currentSeason,
  calendarDays: s.calendarDays,
  trinkets: s.trinkets.length,
  inventory: toEngineInventory(s.bag),
  graph: toServiceMapGraph(s),
  mapMutations: (s.serviceMapMutations || []) as ServiceMapMutation[],
  pendingServices: (s.pendingServices || []) as ServiceRuntimeState['pendingServices'],
  usedJourneyServiceIds: s.griphUsedThisJourney ? ['rug-of-wonders'] : [],
  weatherProtectionMoves: s.forecastMoves || 0,
  weatherProtectionActive: s.forecastActiveAtLocation || false,
  travelEncounterRerolls: s.guildServiceTravelRerolls || 0,
  missiveSettlementIds: s.missiveSettlements || [],
  removedThreatIds: [],
  appliedTransactionIds: s.appliedTransactionIds,
  journalEvents: []
});

const applyServiceRuntime = (s: GameState, runtime: ServiceRuntimeState): GameState => ({
  ...s,
  currentLocationName: runtime.currentLocationName,
  currentLocationType: runtime.currentLocationType,
  currentRegion: runtime.currentRegion,
  trinkets: resizeTrinkets(s.trinkets, runtime.trinkets, '길드 서비스 장신구'),
  bag: fromEngineInventory(runtime.inventory, s.bag),
  pendingServices: runtime.pendingServices,
  serviceMapMutations: runtime.mapMutations,
  forecastMoves: runtime.weatherProtectionMoves,
  forecastActiveAtLocation: runtime.weatherProtectionActive,
  guildServiceTravelRerolls: runtime.travelEncounterRerolls,
  missiveSettlements: runtime.missiveSettlementIds,
  griphUsedThisJourney: runtime.usedJourneyServiceIds.includes('rug-of-wonders'),
  appliedTransactionIds: runtime.appliedTransactionIds,
  journals: appendEngineJournals(s.journals, runtime.journalEvents)
});

const normalizeClinicAgendaId = (value: string | undefined) => ({
  hive_boxes: 'hive-boxes',
  sodden_logs: 'sodden-logs',
  goodwill_stand: 'goodwill-stand'
} as Record<string, string>)[value || ''] || value || '';

const canonicalClinicsFromState = (s: GameState): ClinicRuntimeState['clinics'] => (s.clinics || []).flatMap((row, index) => {
  const locationId = findMapLocationKey(row.locationName, s.customMapLocations || []);
  if (!locationId) return [];
  return [{
    id: row.id || `legacy-clinic:${locationId}:${index}`,
    name: row.locationName,
    locationId,
    commissionedSeason: s.currentSeason,
    completesAtSeason: row.completesAtSeason || s.currentSeason,
    status: row.status || 'active',
    gardenReagentId: row.gardenReagentId || null,
    gardenHarvestedAilmentIds: row.gardenHarvestedAilmentIds || []
  }];
});

const canonicalClinicAgendaIds = (s: GameState) => Array.from(new Set([
  ...(s.clinicAgendaIds || []),
  ...(s.clinics || []).flatMap(row => row.agendaService ? [normalizeClinicAgendaId(row.agendaService)] : [])
])).filter(Boolean);

const toClinicAgendaRuntime = (s: GameState): ClinicAgendaRuntimeState => ({
  season: s.currentSeason,
  reputation: s.reputation,
  trinkets: s.trinkets.length,
  inventory: toEngineInventory(s.bag),
  patient: getActivePatient(s),
  clinics: canonicalClinicsFromState(s),
  agendaIds: canonicalClinicAgendaIds(s),
  goodwillWeight: s.goodwillDonationsVal || 0,
  soddenReagentId: s.soddenLogInsect
    ? REAGENTS.find(row => row.id === s.soddenLogInsect || row.displayName === s.soddenLogInsect || row.canonicalName === s.soddenLogInsect)?.id || null
    : null,
  appliedTransactionIds: s.appliedTransactionIds,
  journalEvents: []
});

const applyClinicAgendaRuntime = (s: GameState, runtime: ClinicAgendaRuntimeState): GameState => ({
  ...s,
  currentSeason: runtime.season,
  reputation: runtime.reputation,
  trinkets: resizeTrinkets(s.trinkets, runtime.trinkets, '약제소 아젠다 장신구'),
  bag: fromEngineInventory(runtime.inventory, s.bag),
  patients: runtime.patient ? replacePatient(s.patients, runtime.patient) : s.patients,
  clinics: (s.clinics || []).map((row, index) => {
    const canonical = runtime.clinics.find(clinic => clinic.id === (row.id || `legacy-clinic:${findMapLocationKey(row.locationName, s.customMapLocations || [])}:${index}`));
    return canonical ? {
      ...row,
      id: canonical.id,
      gardenReagentId: canonical.gardenReagentId || undefined,
      gardenHarvestedAilmentIds: canonical.gardenHarvestedAilmentIds || []
    } : row;
  }),
  goodwillDonationsVal: runtime.goodwillWeight,
  soddenLogInsect: runtime.soddenReagentId || '',
  appliedTransactionIds: runtime.appliedTransactionIds,
  journals: appendEngineJournals(s.journals, runtime.journalEvents)
});

const LEGACY_SERVICE_IDS: Record<string, GuildServiceId> = {
  send_package: 'send-package', rug_wonders: 'rug-of-wonders', news_trail: 'news-from-the-trail', smithing: 'smithing',
  forecast: 'forecast', catch_day_small: 'catch-of-the-day', catch_day_big: 'catch-of-the-day', shortcut: 'shortcut',
  hitch_ride: 'hitch-a-ride', survey_paths: 'survey-paths', build_bridge: 'build-a-bridge', floodplain: 'floodplain',
  taxi_service: 'taxi-service', take_clippings: 'take-clippings', pick_deep: 'pick-of-the-deep', retrieval: 'retrieval',
  send_missive: 'send-a-missive', scare_tactics: 'scare-tactics'
};

const replacePatient = (patients: PatientState[], patient: PatientState) =>
  patients.some(row => row.id === patient.id)
    ? patients.map(row => row.id === patient.id ? patient : row)
    : [...patients, patient];

const updateActivePatient = (
  state: GameState,
  updater: (patient: PatientState) => PatientState
): PatientState[] => state.activePatientId
  ? state.patients.map(patient => patient.id === state.activePatientId ? updater(patient) : patient)
  : state.patients;

const resizeTrinkets = (current: string[], count: number, label: string) => count <= current.length
  ? current.slice(0, count)
  : [...current, ...Array(count - current.length).fill(label)];

const createPrintedManualDraft = (
  ownerId: string,
  trigger: Parameters<typeof createManualEffectDraft>[1],
  context: Parameters<typeof createManualEffectDraft>[2],
  createdAt = Date.now()
): ManualEffectDraft | null => {
  const effect = PRINTED_EFFECT_BY_OWNER.get(ownerId);
  if (!effect?.manualResolution || !effect.supportedTriggers.includes(trigger)) return null;
  return createManualEffectDraft(effect, trigger, context, createdAt);
};

const enqueueManualDrafts = (state: GameState, drafts: Array<ManualEffectDraft | null>, open = true): GameState => {
  const incoming = drafts.filter((draft): draft is ManualEffectDraft => Boolean(draft));
  if (incoming.length === 0) return state;
  const resolvedIds = new Set(state.manualEffectRecords.map(record => record.effectId));
  const queue = [...new Map([...state.manualEffectQueue, ...incoming]
    .filter(draft => !resolvedIds.has(draft.effectId) && !draft.transactionId)
    .map(draft => [draft.effectId, draft])).values()];
  const pending = state.pendingManualEffect || (open ? queue[0] || null : null);
  return {
    ...state,
    manualEffectQueue: queue,
    pendingManualEffect: pending,
    manualEffectDraft: pending || queue[0] || null
  };
};

const appendEngineJournals = (current: JournalEntry[], events: BarterRuntimeState['journalEvents']) => {
  const known = new Set(current.map(row => row.id));
  return [
    ...events.filter(row => !known.has(row.id)).map(row => ({ ...row, timestamp: Date.now() })),
    ...current
  ];
};

const getActivePatient = (s: GameState): PatientState | null =>
  s.patients.find(patient => patient.id === s.activePatientId) || null;

const canonicalCompanionId = (value: string): string => value.replace(/_/g, '-');

const projectActiveAilments = (s: GameState): ActiveAilment[] => {
  const patient = getActivePatient(s);
  if (!patient) {
    return s.rulesetId === 'legacy-campaign'
      ? s.activeAilments || (s.activeAilment ? [s.activeAilment] : [])
      : [];
  }
  const previousRows = s.activeAilments || (s.activeAilment ? [s.activeAilment] : []);
  return patient.ailments.filter(ailment => ailment.status === 'active').map(ailment => {
    const definition = AILMENTS.find(row => row.id === ailment.ailmentId);
    const display = definition ? ailmentDisplayRecord(definition) : null;
    const previous = previousRows.find(row => row.id === ailment.id);
    const timers = ailment.timerIds.map(id => patient.timers.find(timer => timer.id === id)).filter(Boolean);
    const timer = timers.length > 0 ? Math.min(...timers.map(row => row!.current)) : 0;
    const maxTimer = timers.length > 0 ? Math.max(...timers.map(row => row!.maximum)) : definition?.timer || 0;
    return {
      id: ailment.id,
      name: definition?.displayName || ailment.legacyName || previous?.name || '알 수 없는 질환',
      severity: ailment.severity,
      timer,
      maxTimer,
      tags: display?.tags || previous?.tags || ailment.requirementSnapshot || '',
      description: display?.description || previous?.description || '',
      outcome: display?.outcome || previous?.outcome || '',
      consequence: display?.consequence || previous?.consequence || '',
      foragingPoints: patient.foragingPoints || 0,
      reagentsGathered: patient.reagentsGathered || [],
      patientName: patient.name,
      species: patient.species,
      initialRememberedNote: patient.initialRememberedNote,
      startedAtDay: patient.startedAtDay,
      journeyTitle: patient.journeyTitle
    };
  });
};

const withCanonicalPatientView = (s: GameState): GameState => {
  const activeAilments = projectActiveAilments(s);
  const companions = s.rulesetId === 'original-1e-3p' && s.companionStates.length > 0
    ? s.companionStates.map(row => {
        const existing = s.companions.find(companion => companion.id === row.instanceId || companion.name === row.companionId);
        const definition = COMPANIONS_DB.find(companion => canonicalCompanionId(companion.id) === canonicalCompanionId(row.companionId));
        return existing || {
          id: row.instanceId,
          name: row.companionId,
          koreanName: definition?.name.split(' (')[0] || row.companionId,
          adoptedLocation: s.currentLocationName,
          seasonsTravelled: row.seasonsTravelled
        };
      })
    : s.companions;
  const companionHive = s.rulesetId === 'original-1e-3p' && s.companionHiveStates.length > 0
    ? s.companionHiveStates.map(row => {
        const existing = s.companionHive.find(companion => companion.id === row.instanceId || companion.name === row.companionId);
        const definition = COMPANIONS_DB.find(companion => canonicalCompanionId(companion.id) === canonicalCompanionId(row.companionId));
        return existing || {
          id: row.instanceId,
          name: row.companionId,
          koreanName: definition?.name.split(' (')[0] || row.companionId,
          adoptedLocation: s.currentLocationName,
          seasonsTravelled: row.seasonsTravelled
        };
      })
    : s.companionHive;
  return { ...s, activeAilment: activeAilments[0] || null, activeAilments, companions, companionHive };
};

const withoutLegacyPatientWrite = (s: GameState): GameState => s.rulesetId === 'original-1e-3p'
  ? { ...s, activeAilment: null, activeAilments: [], companions: [], companionHive: [] }
  : s;

const toBarterRuntime = (s: GameState, patient: PatientState): BarterRuntimeState => ({
  inventory: toEngineInventory(s.bag),
  patient,
  reputation: s.reputation,
  trinkets: s.trinkets.length,
  attemptHistory: s.barterAttemptHistory || {},
  pendingBarter: s.pendingBarter,
  journalEvents: [],
  appliedTransactionIds: s.appliedTransactionIds,
  ailmentTagOverrides: s.ailmentTagOverrides
});

const applyBarterRuntime = (s: GameState, runtime: BarterRuntimeState): GameState => ({
  ...s,
  bag: fromEngineInventory(runtime.inventory, s.bag),
  patients: replacePatient(s.patients, runtime.patient),
  reputation: runtime.reputation,
  trinkets: resizeTrinkets(s.trinkets, runtime.trinkets, '물꼬 거래 장신구'),
  barterAttemptHistory: runtime.attemptHistory,
  barterCountThisAilment: Object.entries(runtime.attemptHistory)
    .filter(([key]) => key.startsWith(`${runtime.patient.id}:`))
    .reduce((sum, [, count]) => sum + count, 0),
  pendingBarter: runtime.pendingBarter,
  appliedTransactionIds: runtime.appliedTransactionIds,
  journals: appendEngineJournals(s.journals, runtime.journalEvents)
});

const toJourneyRuntime = (s: GameState): JourneyRuntimeState => ({
  currentLocationId: findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName),
  reputation: s.reputation,
  inventory: toEngineInventory(s.bag),
  patients: s.patients,
  pendingEncounter: s.pendingEncounter,
  pendingBarter: s.pendingBarter && !['completed', 'abandoned'].includes(s.pendingBarter.status) ? s.pendingBarter : null,
  pendingForaging: s.pendingForaging,
  journey: s.journey,
  pendingEnding: s.pendingEnding,
  downtimeRequired: s.downtimeRequired,
  journalEvents: [],
  appliedTransactionIds: s.appliedTransactionIds
});

const applyJourneyRuntime = (s: GameState, runtime: JourneyRuntimeState): GameState => ({
  ...s,
  bag: fromEngineInventory(runtime.inventory, s.bag),
  reputation: runtime.reputation,
  journey: runtime.journey,
  pendingEnding: runtime.pendingEnding,
  downtimeRequired: runtime.downtimeRequired,
  appliedTransactionIds: runtime.appliedTransactionIds,
  journals: appendEngineJournals(s.journals, runtime.journalEvents)
});

const toLeaveRuntime = (s: GameState, patient: PatientState): LeaveRuntimeState => {
  const graph = toRuleMapGraph(s);
  const currentId = findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName);
  return {
    inventory: toEngineInventory(s.bag),
    patient,
    reputation: s.reputation,
    trinkets: s.trinkets.length,
    currentRegion: toRuleRegion(s.currentRegion),
    adjacentRegions: (graph[currentId]?.neighbors || []).map(id => graph[id]?.region).filter((region): region is Region => Boolean(region)),
    foragingPoints: patient.foragingPoints || 0,
    pendingObligation: s.pendingLeaveObligation,
    journalEvents: [],
    appliedTransactionIds: s.appliedTransactionIds,
    activePatientId: s.activePatientId,
    patientArchive: s.patientArchive,
    archiveContext: {
      location: s.currentLocationName,
      encounteredAt: s.journey?.startDate || Date.now(),
      resolvedAt: Date.now(),
      sourceJourneyId: s.journey?.journeyId || null
    }
  };
};

const applyLeaveRuntime = (s: GameState, runtime: LeaveRuntimeState): GameState => {
  const remaining = runtime.patient.timers.length > 0 ? Math.min(...runtime.patient.timers.map(timer => timer.current)) : 0;
  const canScrounge = runtime.patient.status === 'cured' && remaining > 0;
  return {
    ...s,
    bag: fromEngineInventory(runtime.inventory, s.bag),
    patients: replacePatient(s.patients, runtime.patient),
    reputation: runtime.reputation,
    trinkets: resizeTrinkets(s.trinkets, runtime.trinkets, '떠나기 장신구'),
    scroungingTimer: canScrounge ? remaining : 0,
    scroungingMode: canScrounge,
    pendingLeaveObligation: runtime.pendingObligation,
    activePatientId: runtime.activePatientId === undefined ? s.activePatientId : runtime.activePatientId,
    patientArchive: runtime.patientArchive || s.patientArchive,
    appliedTransactionIds: runtime.appliedTransactionIds,
    journals: appendEngineJournals(s.journals, runtime.journalEvents)
  };
};

const toCanonicalDowntimeRuntime = (s: GameState): CanonicalDowntimeState => ({
  downtimeRequired: s.downtimeRequired,
  downtimeCompleted: s.downtimeCompleted,
  reputation: s.reputation,
  trinkets: s.trinkets.length,
  speed: s.bio.speed,
  carry: s.bio.carry,
  travelStyle: s.bio.travelStyle,
  currentLocationId: findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName),
  currentSeason: s.currentSeason,
  inventory: toEngineInventory(s.bag),
  graph: toServiceMapGraph(s),
  ailmentTagOverrides: s.ailmentTagOverrides,
  appliedTransactionIds: s.appliedTransactionIds,
  journalEvents: []
});

const applyCanonicalDowntimeRuntime = (s: GameState, runtime: CanonicalDowntimeState): GameState => {
  const previousGraph = toServiceMapGraph(s);
  const knownPairs = new Set<string>();
  Object.values(previousGraph).forEach(node => node.edges.forEach(edge => knownPairs.add([node.id, edge.to].sort().join(':'))));
  const newEdges: CustomMapEdge[] = [];
  Object.values(runtime.graph).forEach(node => node.edges.forEach(edge => {
    const pair = [node.id, edge.to].sort().join(':');
    if (knownPairs.has(pair) || newEdges.some(row => [row.from, row.to].sort().join(':') === pair)) return;
    newEdges.push({ id: `downtime_edge_${pair.replace(/[^a-z0-9가-힣]+/gi, '_')}`, from: node.id, to: edge.to, kind: edge.kind || 'path', label: edge.kind === 'waterway' ? '휴식기에 발견한 물길' : '휴식기에 발견한 길', createdAt: Date.now() });
  }));
  const location = runtime.graph[runtime.currentLocationId];
  return {
    ...s,
    downtimeRequired: runtime.downtimeRequired,
    downtimeCompleted: runtime.downtimeCompleted,
    reputation: runtime.reputation,
    trinkets: resizeTrinkets(s.trinkets, runtime.trinkets, '휴식기 장신구'),
    bio: { ...s.bio, speed: runtime.speed, carry: runtime.carry, travelStyle: runtime.travelStyle },
    bag: fromEngineInventory(runtime.inventory, s.bag),
    currentLocationName: location?.name || s.currentLocationName,
    currentLocationType: location?.locationType || s.currentLocationType,
    currentRegion: location?.region === 'Soar' ? s.currentRegion : location?.region || s.currentRegion,
    customMapEdges: [...(s.customMapEdges || []), ...newEdges],
    ailmentTagOverrides: runtime.ailmentTagOverrides,
    appliedTransactionIds: runtime.appliedTransactionIds,
    journals: appendEngineJournals(s.journals, runtime.journalEvents)
  };
};

const recordCanonicalJourneyEvent = (s: GameState, event: Parameters<typeof recordJourneyProgress>[1]): JourneyState | null => {
  if (!s.journey || s.journey.status !== 'active') return s.journey;
  return recordJourneyProgress(s.journey, event, {
    inventory: toEngineInventory(s.bag),
    reputation: s.reputation,
    patients: s.patients
  });
};

const memoryKey = (...parts: string[]) =>
  parts.join('_').toLowerCase().replace(/[^a-z0-9가-힣]+/gi, '_').replace(/^_+|_+$/g, '');

const mapLocationId = (name: string) => {
  const key = normalizeMapLocationName(name || 'custom_location');
  return `custom_${key || Date.now()}`;
};

const clampMapCoordinate = (value: number) => Math.max(3, Math.min(97, value));

const mapKindFromLocationType = (locationType: string): MapLocationKind => {
  if (locationType === 'Settlement') return 'settlement';
  if (locationType === 'City') return 'city';
  if (locationType === 'Ruin') return 'ruin';
  if (locationType === 'Barrow') return 'barrow';
  if (locationType === 'Clinic') return 'clinic';
  return 'wild';
};

const sameMapPair = (from: string, to: string, edge: CustomMapEdge) =>
  (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from);

const playerEdgeId = (from: string, to: string) => {
  const [left, right] = [from, to].sort();
  return `player_edge_${left}_${right}`;
};

const stopFromGraphNode = (
  id: string,
  node: MapLocationNode,
  extras: { hasClinic?: boolean; name?: string } = {}
): RouteStop => stopFromPlace({
  id,
  name: extras.name || node.label,
  x: node.x,
  y: node.y,
  region: node.region,
  kind: node.kind,
  locationType: node.kind,
  hasClinic: extras.hasClinic
});

const upsertPlayerMapStop = (
  customLocations: CustomMapLocation[],
  stop: RouteStop,
  existingNode?: MapLocationNode
): CustomMapLocation[] => {
  const previous = customLocations.find(location => location.id === stop.id);
  const next: CustomMapLocation = {
    ...(previous || {}),
    id: stop.id,
    label: stop.name.trim(),
    x: Number.isFinite(stop.x) ? stop.x : previous?.x ?? existingNode?.x ?? 50,
    y: Number.isFinite(stop.y) ? stop.y : previous?.y ?? existingNode?.y ?? 50,
    region: (stop.terrain || previous?.region || existingNode?.region || 'Wilds') as MapRegion,
    kind: mapKindFromGlyph(stop.kind),
    aliases: Array.from(new Set([...(previous?.aliases || []), ...(existingNode?.aliases || []), previous?.label || '', existingNode?.label || '', stop.name].filter(Boolean))),
    neighbors: Array.from(new Set([...(previous?.neighbors || []), ...(existingNode?.neighbors || [])])),
    source: previous?.hidden ? 'player-correction' : (previous?.source || 'player-correction'),
    createdAt: previous?.createdAt || Date.now(),
    hidden: false
  };
  return [...customLocations.filter(location => location.id !== stop.id), next];
};

const isPlayerCreatedMapPlace = (id: string): boolean =>
  id.startsWith('mark_') || id.startsWith('custom_');

const playerRecordFromStop = (stop: RouteStop) => ({
  id: stop.id,
  label: stop.name,
  x: stop.x,
  y: stop.y,
  kind: mapKindFromGlyph(stop.kind),
  region: stop.terrain || undefined,
  updatedAt: Date.now()
});

const upsertPlayerMapEdge = (
  customEdges: CustomMapEdge[],
  from: string,
  to: string,
  kind: 'path' | 'river' | 'waterway'
): CustomMapEdge[] => {
  const id = playerEdgeId(from, to);
  const next: CustomMapEdge = {
    id,
    from,
    to,
    kind,
    label: kind === 'waterway' ? '수로' : kind === 'river' ? '강' : '육로',
    createdAt: customEdges.find(edge => edge.id === id)?.createdAt || Date.now()
  };
  return [...customEdges.filter(edge => edge.id !== id && !sameMapPair(from, to, edge)), next];
};

const inferMapCoordinates = (
  name: string,
  region: MapRegion,
  anchorName: string,
  customLocations: CustomMapLocation[] = []
) => {
  const graphNodes = buildMapGraphNodes(customLocations);
  const anchorKey = findMapLocationKey(anchorName, customLocations);
  const anchor = anchorKey ? graphNodes[anchorKey] : null;

  if (anchor) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const angle = (Math.abs(hash) % 360) * Math.PI / 180;
    const radius = 2.4 + (Math.abs(hash >> 4) % 24) / 10;
    return {
      x: clampMapCoordinate(anchor.x + Math.cos(angle) * radius),
      y: clampMapCoordinate(anchor.y + Math.sin(angle) * radius)
    };
  }

  const regionLocations = MAP_WILD_LOCATIONS.filter(location => location.region === region);
  if (regionLocations.length > 0) {
    const x = regionLocations.reduce((sum, loc) => sum + loc.x, 0) / regionLocations.length;
    const y = regionLocations.reduce((sum, loc) => sum + loc.y, 0) / regionLocations.length;
    return { x: clampMapCoordinate(x), y: clampMapCoordinate(y) };
  }

  return { x: 50, y: 50 };
};

const upsertCustomMapLocation = (
  customLocations: CustomMapLocation[] = [],
  name: string,
  regionName: string,
  locationType: string,
  anchorName: string,
  source: string,
  extraNeighbors: string[] = []
) => {
  const region = MAP_REGION_CODES[regionName?.[0]?.toUpperCase()] || (MAP_REGION_LABELS[regionName as MapRegion] ? regionName as MapRegion : 'Wilds');
  const knownKey = findMapLocationKey(name, customLocations);
  if (knownKey && !knownKey.startsWith('custom_')) return customLocations;

  const anchorKey = findMapLocationKey(anchorName, customLocations);
  const neighborKeys = Array.from(new Set([anchorKey, ...extraNeighbors].filter(Boolean)));
  const coords = inferMapCoordinates(name, region, anchorName, customLocations);
  const id = knownKey || mapLocationId(name);
  const existing = customLocations.find(location => location.id === id);
  const nextLocation: CustomMapLocation = {
    ...(existing || {}),
    id,
    label: name.trim(),
    x: existing?.x ?? coords.x,
    y: existing?.y ?? coords.y,
    region,
    kind: mapKindFromLocationType(locationType),
    aliases: Array.from(new Set([...(existing?.aliases || []), name.trim()])),
    neighbors: Array.from(new Set([...(existing?.neighbors || []), ...neighborKeys])),
    source,
    createdAt: existing?.createdAt || Date.now()
  };

  if (existing) {
    return customLocations.map(location => location.id === id ? nextLocation : location);
  }

  return [...customLocations, nextLocation];
};

const cleanMemoryName = (name: string) =>
  name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();

const findReagentMemoryDefinition = (name: string) => {
  const row = findCanonicalReagent(cleanMemoryName(name));
  return row ? reagentDisplayRecord(row) : null;
};

const remapEncounterConditions = (conditions: string[], s: GameState): string[] => {
  const locationId = findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName);
  return Array.from(new Set((conditions || []).map(condition => {
    if (condition === 'free-path:current' && locationId) return `free-path:${locationId}`;
    if (condition === 'ignore-negative-here-until-move' && locationId) return `ignore-negative:${locationId}`;
    return condition;
  })));
};

const freePathLocationIdsFromState = (s: GameState): string[] =>
  (s.manualConditions || [])
    .filter(condition => condition.startsWith('free-path:'))
    .map(condition => condition.slice('free-path:'.length));

const previewTravelSpeed = (s: GameState, weight: number): number => {
  let speed = getTravelSpeed(s, weight);
  const hasStilts = canonicalToolsFromState(s).some(tool => tool.toolId === 'stilts' && !tool.broken && !tool.consumed);
  if (s.currentRegion === 'Bog' && hasStilts) speed += 1;
  if ((s.manualConditions || []).includes('next-move-speed-double')) speed *= 2;
  return speed;
};

const consumeTravelConditions = (conditions: string[], destinationId: string, originId?: string): string[] =>
  conditions.filter(condition => {
    if (condition === 'ignore-midges-until-move') return false;
    if (condition === 'next-move-speed-double') return false;
    if (condition === 'location-encounter-fp:3') return false;
    if (condition === 'redraw-encounter-once') return false;
    if (condition === `free-path:${destinationId}`) return false;
    if (originId && condition === `ignore-negative:${originId}`) return false;
    return true;
  });

const defaultEncounterChoiceId = (encounter: { choices?: Array<{ id: string }> } | null | undefined, selectedChoiceId?: string): string | undefined => {
  const choices = encounter?.choices || [];
  if (selectedChoiceId && choices.some(choice => choice.id === selectedChoiceId)) return selectedChoiceId;
  if (choices.length === 1 && choices[0].id === 'continue') return 'continue';
  return undefined;
};

const encounterNeedsPlayerChoice = (encounter: { choices?: Array<{ id: string }> } | null | undefined, selectedChoiceId?: string): boolean => {
  const choices = encounter?.choices || [];
  if (choices.length === 0) return false;
  return !defaultEncounterChoiceId(encounter, selectedChoiceId);
};

const getLocalizedLocationName = (name: string): string => localizeLocationName(name);

const getLocalizedSource = (source: string): string => {
  const s = (source || '').toLowerCase().trim();
  if (s.includes('starting keepsake')) return '여정의 시작점';
  if (s.includes('carried trinket')) return '여정길의 길동무';
  if (s.includes('current collection')) return '약제사 배낭 속 수집품';
  if (s.includes('handwritten trinket note')) return '기록장에 끼워둔 쪽지';
  if (s.includes('cured patient keepsake') || s.includes('cured patient') || s.includes('cured beast')) return '완치된 야수의 보답';
  if (s.includes('current location')) return '현재 위치';
  if (s.includes('journey destination')) return '여정 목적지';
  if (s.includes('visited location')) return '방문한 위치';
  if (s.includes('clinic network')) return '약제소 네트워크';
  if (s.includes('barrow rumour')) return '고분 소문';
  if (s.includes('companion record')) return '동반자 기록';
  if (s.includes('apothecary bag')) return '약제사 배낭';
  if (s.includes('known remedy')) return '알려진 처방';
  return source;
};

const getLocalizedAlmanacNotes = (notes: string): string => {
  const text = notes || '';
  const s = text.toLowerCase().trim();
  if (s === 'recorded from travel history.') return '여행 기록에서 자동으로 옮겨 적었습니다.';
  if (s.includes('destination for current travel log')) return text.replace(/^Destination for current travel log:\s*/i, '현재 여정의 목적지: ').replace('open journey', '열린 여정');
  if (s.includes('guild service:')) return text.replace(/^Guild service:\s*/i, '길드 서비스: ');
  if (s.includes('joined the travelling apothecary')) return text.replace(/joined the travelling apothecary\.?/i, '약제사의 여정에 동행하게 되었습니다.');
  if (s === 'reagent carried in the bag.') return '배낭에 담아 다니는 영약재.';
  if (s === 'remembered from a discovered remedy combination.') return '성공한 처방 조합에서 기억해 둔 약재.';
  if (s.includes('behemoth barrow')) return text.replace(/Towering/i, '거대').replace(/Many/i, '군집').replace(/Violent/i, '포악').replace(/Demanding/i, '까다로운').replace(/behemoth barrow/i, '거수 고분');
  if (s.includes('behemoth')) return text.replace(/Towering/i, '거대').replace(/Many/i, '군집').replace(/Violent/i, '포악').replace(/Demanding/i, '까다로운').replace(/behemoth/i, '거수');
  return text;
};

const getLocalizedStory = (story: string): string => {
  const s = (story || '').toLowerCase().trim();
  if (s.includes('a first keepsake tucked into the bag')) {
    return '브리슬리 숲길의 먼 여정을 나서며 낡은 약제사 배낭 가장 깊은 곳에 고이 넣어둔 첫 번째 징표.';
  }
  if (s.includes('a carried trinket preserved from an older save') || s.includes('preserved from an older save')) {
    return '어느 오래된 기억의 길목에서부터 소중히 품고 온 손때 묻은 물건.';
  }
  if (s.includes('handwritten keepsake note')) {
    return '보답으로 받은 작은 물건 곁에, 고마운 마음을 서툴게 꾹꾹 눌러 쓴 작은 종이쪽지.';
  }
  if (s.includes('a warm keepsake left by a cured beast') || s.includes('cured beast') || s.includes('cured patient') || s.includes('warm keepsake')) {
    return '약이 차도를 보이고 기운을 차린 야수가, 고마움의 눈빛을 건네며 발치에 슬그머니 밀어놓고 간 물건.';
  }
  if (s.includes('a trinket currently kept in the travelling bag, preserved in the cabinet')) {
    return '약제사 배낭 속에 소중히 담아 지니고 다니는 물건. 나중에 거래에 쓰이더라도 기억이 바래지 않도록 보관함에 그 사연을 남겨둡니다.';
  }
  return story;
};

const getLocalizedSpentStory = (spentLine: string): string => {
  if (!spentLine) return '물꼬 거래나 조력에 사용됨';
  const clean = spentLine.replace(/^Spent from the pouch at /, '').replace(/\.$/, '').trim();
  const loc = getLocalizedLocationName(clean);
  return `약제사 배낭에서 꺼내어 [${loc}]에서 거래나 조력을 위해 사용함.`;
};

const locationCategoryFor = (type?: string): AlmanacCategory => {
  if (type === 'City' || type === 'Settlement') return 'settlement';
  if (type === 'Ruin' || type === 'Barrow') return 'landmark';
  return 'notable';
};

const upsertAlmanac = (
  entries: WorldAlmanacEntry[],
  entry: Omit<WorldAlmanacEntry, 'id' | 'firstSeen' | 'lastSeen' | 'sightings'> & { timestamp?: number }
) => {
  const name = cleanMemoryName(entry.name);
  if (!name) return entries;
  const idx = entries.findIndex(e =>
    e.category === entry.category &&
    e.name.toLowerCase() === name.toLowerCase() &&
    (e.locationName || '').toLowerCase() === (entry.locationName || '').toLowerCase()
  );
  const stamp = entry.timestamp || Date.now();

  let prepsDetail: { part: string; prep: string; tag: string; val: number }[] | undefined = undefined;
  if (entry.category === 'reagent') {
    const matchedReag = findReagentMemoryDefinition(name);
    if (matchedReag && (parsedPrepsList as any)[matchedReag.rawName]) {
      prepsDetail = (parsedPrepsList as any)[matchedReag.rawName];
    }
  }

  if (idx >= 0) {
    const next = [...entries];
    next[idx] = {
      ...next[idx],
      region: next[idx].region || entry.region,
      source: entry.source || next[idx].source,
      notes: entry.notes || next[idx].notes,
      lastSeen: Math.max(next[idx].lastSeen || stamp, stamp),
      sightings: (next[idx].sightings || 1) + 1,
      ...(prepsDetail ? { prepsDetail } : {})
    };
    return next;
  }

  return [
    {
      id: memoryKey('alm', entry.category, name, entry.locationName || entry.region || 'unknown'),
      category: entry.category,
      name,
      locationName: entry.locationName || '',
      region: entry.region || '',
      source: entry.source,
      notes: entry.notes,
      firstSeen: stamp,
      lastSeen: stamp,
      sightings: 1,
      ...(prepsDetail ? { prepsDetail } : {})
    },
    ...entries
  ];
};

const addScrapbookEntry = (
  entries: TravelScrapbookEntry[],
  entry: Omit<TravelScrapbookEntry, 'id'>
) => {
  if (entries.some(e => e.sourceId === entry.sourceId)) return entries;
  return [{ id: memoryKey('scrap', entry.sourceId), ...entry }, ...entries];
};

const addCasebookRecord = (
  entries: PatientCaseRecord[],
  record: Omit<PatientCaseRecord, 'id'>
) => {
  if (entries.some(e => e.sourceId === record.sourceId)) return entries;
  return [{ id: memoryKey('case', record.sourceId), ...record }, ...entries];
};

const normalizeTrinketRecord = (record: any): TrinketMemoryRecord => ({
  id: record.id || memoryKey('trinket', record.sourceId || record.name || String(record.timestamp || Date.now())),
  sourceId: record.sourceId || record.id || `legacy_trinket_${record.name || 'unknown'}_${record.timestamp || Date.now()}`,
  name: record.name || 'Unnamed trinket',
  count: Math.max(1, Number(record.count || 1)),
  source: record.source || 'Trinket collection',
  story: record.story || record.notes || 'A small object kept from the road.',
  locationName: record.locationName || '',
  timestamp: record.timestamp || Date.now(),
  spent: !!record.spent,
  patientCaseId: record.patientCaseId || ''
});

const addTrinketMemory = (
  entries: TrinketMemoryRecord[],
  record: Omit<TrinketMemoryRecord, 'id'>
) => {
  if (entries.some(e => e.sourceId === record.sourceId)) return entries;
  return [{ id: memoryKey('trinket', record.sourceId), ...record }, ...entries];
};

const trinketArchiveFromCurrent = (s: any): TrinketMemoryRecord[] => {
  const trinkets = Array.isArray(s.trinkets) ? s.trinkets : [];
  return trinkets.map((name: string, idx: number) => normalizeTrinketRecord({
    sourceId: memoryKey('starting_trinket', String(idx), name),
    name,
    count: 1,
    source: idx === 0 ? 'Starting keepsake' : 'Carried trinket',
    story: idx === 0
      ? 'A first keepsake tucked into the bag before the long road through Bristley Woods.'
      : 'A carried trinket preserved from an older save.',
    locationName: s.currentLocationName || '',
    timestamp: Date.now() - idx
  }));
};

const normalizeCaseRecord = (record: any): PatientCaseRecord => ({
  id: record.id || memoryKey('case', record.sourceId || String(record.timestamp || Date.now())),
  sourceId: record.sourceId || record.id || `legacy_case_${record.timestamp || Date.now()}`,
  patientName: record.patientName || '',
  species: record.species || '',
  ailmentName: record.ailmentName || 'Unknown ailment',
  severity: record.severity || 'unknown',
  tags: record.tags || '',
  locationName: record.locationName || '',
  region: record.region || '',
  season: record.season || '',
  journeyTitle: record.journeyTitle || '',
  resolvedAtDay: record.resolvedAtDay || 0,
  outcome: record.outcome === 'failure' ? 'failure' : 'success',
  remedy: Array.isArray(record.remedy) ? record.remedy : [],
  consequence: record.consequence || '',
  initialRememberedNote: record.initialRememberedNote || '',
  finalArchiveNote: record.finalArchiveNote || record.notes || '',
  notes: record.notes || '',
  timestamp: record.timestamp || Date.now(),
  isBookmarked: !!record.isBookmarked
});

const legacyCaseRecordsFromJournals = (s: any): PatientCaseRecord[] => {
  const journals = Array.isArray(s.journals) ? s.journals : [];
  return journals
    .filter((journal: any) => journal.id?.startsWith('cure_') || journal.id?.startsWith('cure_fail_'))
    .map((journal: any) => {
      const ailmentName = journal.title?.replace(/^.*?:\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim() || 'Unknown ailment';
      const severityMatch = journal.text?.match(/심각도:\s*([^\n(]+)/);
      return normalizeCaseRecord({
        sourceId: journal.id,
        patientName: '',
        ailmentName,
        severity: severityMatch?.[1]?.trim() || 'unknown',
        locationName: s.currentLocationName || '',
        region: s.currentRegion || '',
        season: s.currentSeason || '',
        journeyTitle: s.journeyGoalTitle || '',
        resolvedAtDay: s.cumulativeDays || s.calendarDays || 0,
        outcome: journal.id?.startsWith('cure_fail_') ? 'failure' : 'success',
        consequence: journal.id?.startsWith('cure_fail_') ? journal.text || '' : '',
        notes: journal.text || '',
        finalArchiveNote: journal.text || '',
        timestamp: journal.timestamp || Date.now()
      });
    });
};

const createPendingPatientArchive = (
  s: GameState,
  sourceId: string,
  outcome: 'success' | 'failure',
  notes: string,
  remedy: string[] = [],
  consequence: string = '',
  timestamp: number = Date.now()
): PendingPatientArchive | null => {
  if (!s.activeAilment) return null;
  return {
    sourceId,
    patientName: s.activeAilment.patientName || '',
    species: s.activeAilment.species || '',
    ailmentName: s.activeAilment.name,
    severity: s.activeAilment.severity,
    tags: s.activeAilment.tags,
    locationName: s.currentLocationName,
    region: s.currentRegion,
    season: s.currentSeason,
    journeyTitle: s.journeyGoalTitle || s.journeyDestination || '',
    resolvedAtDay: s.cumulativeDays || s.calendarDays || 0,
    outcome,
    remedy,
    consequence,
    initialRememberedNote: s.activeAilment.initialRememberedNote || '',
    notes,
    timestamp
  };
};

const getAvailableRemedyIngredients = (s: GameState, bag: BagItem[] = s.bag): BagItem[] => [
  ...bag.filter(item => item.type === 'reagent'),
  ...selectedToolEffectItems(bag, bag.filter(item => item.type === 'tool').map(item => item.id))
];

const canCreateRemedyFromBag = (s: GameState, bag: BagItem[] = s.bag): boolean => {
  if (!s.activeAilment) return false;
  return validateConcoction(
    s.activeAilment,
    getAvailableRemedyIngredients(s, bag),
    bag,
    { ...s, bag },
    false
  ).isComplete;
};

const finalizePendingPatientArchive = (pending: PendingPatientArchive, finalArchiveNote: string): PatientCaseRecord => ({
  id: memoryKey('case', pending.sourceId),
  sourceId: pending.sourceId,
  patientName: pending.patientName || '',
  species: pending.species || '',
  ailmentName: pending.ailmentName,
  severity: pending.severity,
  tags: pending.tags,
  locationName: pending.locationName,
  region: pending.region,
  season: pending.season,
  journeyTitle: pending.journeyTitle,
  resolvedAtDay: pending.resolvedAtDay,
  outcome: pending.outcome,
  remedy: pending.remedy,
  consequence: pending.consequence,
  initialRememberedNote: pending.initialRememberedNote,
  finalArchiveNote,
  notes: pending.notes,
  timestamp: pending.timestamp,
  isBookmarked: !!pending.isBookmarked
});

const classifyJournalForScrapbook = (journal: { id: string; title: string; text: string; timestamp: number }): ScrapbookKind | null => {
  if (journal.id.startsWith('character:') || journal.id.startsWith('origin_') || journal.id.startsWith('memento_') || journal.id.startsWith('familiar_') || journal.id.startsWith('relation_')) return 'journey';
  if (journal.id.startsWith('start_') || journal.id.startsWith('travel_') || journal.id.startsWith('death_travel_')) return 'journey';
  if (journal.id.startsWith('forage_') || journal.id.startsWith('barter_finish_') || journal.id.startsWith('brave_enc_')) return 'discovery';
  if (journal.id.startsWith('cure_') || journal.id.startsWith('cure_fail_')) return 'patient';
  return null;
};

const syncWorldMemory = (state: GameState): GameState => {
  let patientCasebook = [...(state.patientCasebook || [])];
  let worldAlmanac = [...(state.worldAlmanac || [])];
  let travelScrapbook = [...(state.travelScrapbook || [])];
  let trinketArchive = [...(state.trinketArchive || [])];
  const now = Date.now();

  worldAlmanac = upsertAlmanac(worldAlmanac, {
    category: locationCategoryFor(state.currentLocationType),
    name: state.currentLocationName,
    locationName: state.currentLocationName,
    region: state.currentRegion,
    source: '현재 위치',
    notes: `${localizeRegionLabel(state.currentRegion)} 지역의 ${locationTypeLabel(state.currentLocationType)} 위치`,
    timestamp: now
  });

  if (state.journeyActive && state.journeyDestination) {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'settlement',
      name: state.journeyDestination,
      locationName: state.journeyDestination,
      region: '',
      source: '여정 목적지',
      notes: `현재 여정의 목적지: ${state.journeyGoalTitle || '열린 여정'}`,
      timestamp: now
    });
  }

  (state.visitedLocations || []).forEach(locationName => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: locationName === state.currentLocationName ? locationCategoryFor(state.currentLocationType) : 'notable',
      name: locationName,
      locationName,
      region: locationName === state.currentLocationName ? state.currentRegion : '',
      source: '방문한 위치',
      notes: '여행 기록에서 자동으로 옮겨 적었습니다.',
      timestamp: now
    });
  });

  (state.customMapLocations || []).forEach(location => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: location.kind === 'settlement' || location.kind === 'city' ? 'settlement' : 'notable',
      name: location.label,
      locationName: location.label,
      region: location.region || '',
      source: location.source || '지도에 직접 추가한 위치',
      notes: `지도 좌표 ${location.x.toFixed(1)}, ${location.y.toFixed(1)} · 연결: ${location.neighbors.length || 0}개`,
      timestamp: now
    });
  });

  (state.customMapEdges || []).forEach(edge => {
    const graphNodes = buildMapGraphNodes(state.customMapLocations || [], state.customMapEdges || []);
    const fromLabel = graphNodes[edge.from]?.label || edge.from;
    const toLabel = graphNodes[edge.to]?.label || edge.to;
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'landmark',
      name: edge.label || `${fromLabel} ↔ ${toLabel}`,
      locationName: fromLabel,
      region: '',
      source: '개척한 경로',
      notes: `${fromLabel}에서 ${toLabel}로 이어지는 저장된 지도 경로입니다.`,
      timestamp: now
    });
  });

  (state.clinics || []).forEach(clinic => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'clinic',
      name: `${clinic.locationName} 약제소`,
      locationName: clinic.locationName,
      region: clinic.region,
      source: '약제소 네트워크',
      notes: `길드 서비스: ${clinicServiceLabel(clinic.agendaService)}`,
      timestamp: now
    });
  });

  (state.barrows || []).forEach(barrow => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'landmark',
      name: barrow.locationName || barrow.name,
      locationName: barrow.locationName,
      region: barrow.region,
      source: '고분 소문',
      notes: `${barrow.behemothClass} 거수 고분, ${barrow.direction}, ${barrow.distance}`,
      timestamp: now
    });
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'creature',
      name: barrow.name,
      locationName: barrow.locationName,
      region: barrow.region,
      source: '고분 소문',
      notes: `${barrow.behemothClass} 거수`,
      timestamp: now
    });
  });

  (state.companionStates || []).forEach(companion => {
    const definition = COMPANIONS_DB.find(row => canonicalCompanionId(row.id) === canonicalCompanionId(companion.companionId));
    const name = definition?.name || companion.companionId;
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'creature',
      name,
      locationName: state.currentLocationName,
      region: '',
      source: '동반자 기록',
      notes: `${name}이(가) 약제사의 여정에 동행하게 되었습니다.`,
      timestamp: now
    });
  });

  state.bag.filter(item => item.type === 'reagent').forEach(item => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'reagent',
      name: cleanMemoryName(item.name),
      locationName: state.currentLocationName,
      region: state.currentRegion,
      source: '약제사 배낭',
      notes: item.preps || '배낭에 담아 다니는 영약재.',
      timestamp: now
    });
  });

  Object.values(state.discoveredRecipes || {}).flat().flat().forEach(reagentName => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'reagent',
      name: reagentName,
      locationName: '',
      region: '',
      source: '알려진 처방',
      notes: '성공한 처방 조합에서 기억해 둔 약재.',
      timestamp: now
    });
  });

  (state.journals || []).forEach(journal => {
    const kind = classifyJournalForScrapbook(journal);
    if (kind) {
      travelScrapbook = addScrapbookEntry(travelScrapbook, {
        sourceId: journal.id,
        kind,
        title: journal.title,
        text: journal.text,
        locationName: state.currentLocationName,
        timestamp: journal.timestamp
      });
    }

    if (journal.id.startsWith('cure_') && !journal.id.startsWith('cure_fail_')) {
      travelScrapbook = addScrapbookEntry(travelScrapbook, {
        sourceId: `${journal.id}_remedy`,
        kind: 'remedy',
        title: journal.title.replace('완치 성공', '처방 기록'),
        text: journal.text,
        locationName: state.currentLocationName,
        timestamp: journal.timestamp
      });
    }
  });

  (state.journeyChronicles || []).forEach(chronicle => {
    travelScrapbook = addScrapbookEntry(travelScrapbook, {
      sourceId: chronicle.id,
      kind: 'journey',
      title: chronicle.title,
      text: chronicle.text,
      locationName: state.journeyDestination || state.currentLocationName,
      timestamp: Date.parse(chronicle.date) || now
    });
  });

  (state.calendarHistory || []).forEach((line, idx) => {
    travelScrapbook = addScrapbookEntry(travelScrapbook, {
      sourceId: memoryKey('calendar', String(idx), line),
      kind: 'journey',
      title: line.startsWith('여정 시작') ? '여정 출발 기록' : `여행 기록 ${idx + 1}`,
      text: line,
      locationName: state.currentLocationName,
      timestamp: now - idx
    });
  });

  (state.trinkets || []).forEach((name, idx) => {
    const cleanName = cleanMemoryName(name);
    const existingCount = trinketArchive.filter(record => record.name === cleanName).reduce((sum, record) => sum + record.count, 0);
    const currentCount = (state.trinkets || []).filter(t => cleanMemoryName(t) === cleanName).length;
    if (idx === (state.trinkets || []).findIndex(t => cleanMemoryName(t) === cleanName) && currentCount > existingCount) {
      trinketArchive = addTrinketMemory(trinketArchive, {
        sourceId: memoryKey('trinket_auto', cleanName, String(now)),
        name: cleanName,
        count: currentCount - existingCount,
        source: '현재 수집품',
        story: 'A trinket currently kept in the travelling bag, preserved in the cabinet so its story is not lost when it is later spent.',
        locationName: state.currentLocationName,
        timestamp: now,
        spent: false
      });
    }
  });

  return {
    ...state,
    patientCasebook,
    worldAlmanac,
    travelScrapbook,
    trinketArchive
  };
};

const getCardSvgUrl = (suit: string, value: number | string) => {
  let suitPart: string;
  const s = String(suit).toUpperCase();
  if (s.includes("HEART") || s.includes("♥")) suitPart = "HEART";
  else if (s.includes("DIAMOND") || s.includes("♦")) suitPart = "DIAMOND";
  else if (s.includes("CLUB") || s.includes("♣")) suitPart = "CLUB";
  else if (s.includes("SPADE") || s.includes("♠")) suitPart = "SPADE";
  else return "";

  let valNum = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(valNum)) {
    const valStr = String(value).toUpperCase();
    if (valStr.includes("ACE") || valStr === "A") valNum = 1;
    else if (valStr.includes("JACK") || valStr === "J") valNum = 11;
    else if (valStr.includes("QUEEN") || valStr === "Q") valNum = 12;
    else if (valStr.includes("KING") || valStr === "K") valNum = 13;
    else valNum = 1;
  }

  let valPart: string;
  if (valNum === 1) valPart = "1";
  else if (valNum === 11) valPart = "11-JACK";
  else if (valNum === 12) valPart = "12-QUEEN";
  else if (valNum === 13) valPart = "13-KING";
  else valPart = String(valNum);

  return `/cards/${suitPart}-${valPart}.svg`;
};

const SUIT_OPTIONS = ['♥', '♦', '♣', '♠'] as const;
const VALUE_OPTIONS = [
  { value: 1, label: 'A' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
  { value: 11, label: 'J' },
  { value: 12, label: 'Q' },
  { value: 13, label: 'K' },
] as const;

const CardDrawSlot = ({
  label,
  card,
  onCard,
  helper,
  disabled = false,
  variant = 'compact'
}: {
  label: string;
  card: PlayingCard | null;
  onCard: (card: PlayingCard) => void;
  helper?: string;
  disabled?: boolean;
  variant?: 'hero' | 'compact';
}) => {
  const [manualSuit, setManualSuit] = useState(card?.suit || '♥');
  const [manualValue, setManualValue] = useState(card?.value || 1);
  const [isChoosing, setIsChoosing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const toggleChooser = () => {
    if (disabled || isDrawing) return;
    if (!isChoosing && card) {
      setManualSuit(card.suit);
      setManualValue(card.value);
    }
    setIsChoosing(value => !value);
  };

  const applyManual = () => {
    onCard({ suit: manualSuit, value: manualValue });
    setIsChoosing(false);
  };

  const applyRandom = () => {
    if (disabled || isDrawing) return;
    setIsChoosing(false);
    setIsDrawing(true);
    window.setTimeout(() => {
      onCard(drawPlayingCard());
      setIsDrawing(false);
    }, 420);
  };

  // ─── HERO variant: centered, ritualistic card-at-table layout ───
  if (variant === 'hero') {
    return (
      <div className="card-draw-hero">
        <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.92rem', textAlign: 'center' }}>{label}</div>
        {helper && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4, textAlign: 'center', maxWidth: '380px' }}>{helper}</div>}

        {/* Card visual */}
        <button
          type="button"
          onClick={toggleChooser}
          disabled={disabled || isDrawing}
          className={`card-draw-hero__card ${card ? 'card-draw-hero__card--filled' : 'card-draw-hero__card--empty'} ${isDrawing ? 'card-draw-hero__card--drawing' : ''}`}
          title={card ? `${card.suit} ${cardDisplayValue(card.value)}` : '카드를 뽑거나 직접 입력하세요'}
        >
          {card ? (
            <img src={getCardSvgUrl(card.suit, card.value)} alt={`${card.suit} ${cardDisplayValue(card.value)}`} />
          ) : (
            <span>🃏<br />카드를 뽑아주세요</span>
          )}
        </button>

        {/* Action buttons */}
        <div className="card-draw-hero__actions">
          <button
            type="button"
            onClick={applyRandom}
            disabled={disabled || isDrawing}
            style={{ background: 'var(--secondary)', color: '#fff', border: 'none', cursor: disabled || isDrawing ? 'not-allowed' : 'pointer' }}
          >
            {isDrawing ? '뽑는 중…' : '🎴 랜덤 한 장 뽑기'}
          </button>
          <button
            type="button"
            onClick={toggleChooser}
            disabled={disabled || isDrawing}
            style={{ background: '#fff', color: 'var(--text-muted)', border: '1.5px solid var(--glass-border)', cursor: 'pointer' }}
          >
            {isChoosing ? '접기' : '✏️ 직접 입력'}
          </button>
        </div>

        {/* Manual input: suit buttons + value chips */}
        {isChoosing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '0.8rem', background: '#fff', border: '1.5px dashed var(--border-cozy)', borderRadius: '10px', width: '100%', maxWidth: '400px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>오프라인에서 뽑은 카드를 눌러 입력하세요</span>

            {/* Suit buttons */}
            <div className="suit-btn-row">
              {SUIT_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`suit-btn ${manualSuit === s ? 'active' : ''}`}
                  onClick={() => setManualSuit(s)}
                  disabled={disabled}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Value chips */}
            <div className="value-chip-strip">
              {VALUE_OPTIONS.map(v => (
                <button
                  key={v.value}
                  type="button"
                  className={`value-chip ${manualValue === v.value ? 'active' : ''}`}
                  onClick={() => setManualValue(v.value)}
                  disabled={disabled}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={applyManual}
              disabled={disabled}
              style={{ padding: '0.45rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {manualSuit} {VALUE_OPTIONS.find(v => v.value === manualValue)?.label} 카드 놓기
            </button>
          </div>
        )}

        {/* Current card indicator */}
        {card && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            놓인 카드: <strong>{card.suit} {cardDisplayValue(card.value)}</strong> · 룰 표기: <strong>{cardRuleValue(card)}</strong>
          </div>
        )}
      </div>
    );
  }

  // ─── COMPACT variant: original functional layout ───
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: '0.75rem', alignItems: 'start', width: '100%' }}>
      <div style={{ display: 'grid', gap: '0.4rem', justifyItems: 'stretch' }}>
        <button
          type="button"
          onClick={toggleChooser}
          disabled={disabled || isDrawing}
          title={card ? `${card.suit} ${cardDisplayValue(card.value)}` : '오프라인에서 뽑은 카드를 직접 입력합니다.'}
          style={{
            width: '104px',
            minHeight: '144px',
            border: card ? '1px solid #d8d1bf' : '2px dashed var(--glass-border)',
            borderRadius: '8px',
            background: card ? '#fff' : '#f8f6ef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: card ? '0.25rem' : '0.45rem',
            color: 'var(--text-muted)',
            fontSize: '0.76rem',
            lineHeight: 1.3,
            cursor: disabled || isDrawing ? 'not-allowed' : 'pointer',
            boxShadow: card ? '0 3px 8px rgba(55, 45, 28, 0.12)' : 'inset 0 1px 2px rgba(0,0,0,0.04)',
            transform: isDrawing ? 'translateY(-8px) rotate(-3deg)' : 'none',
            opacity: isDrawing ? 0.72 : 1,
            transition: 'transform 180ms ease, opacity 180ms ease'
          }}
        >
          {card ? (
            <img src={getCardSvgUrl(card.suit, card.value)} alt={`${card.suit} ${cardDisplayValue(card.value)}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
          ) : (
            <span>빈 카드 칸<br />직접 선택</span>
          )}
        </button>
        <button
          type="button"
          onClick={applyRandom}
          disabled={disabled || isDrawing}
          style={{ height: '32px', padding: '0 0.55rem', background: 'var(--secondary)', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 'bold' }}
        >
          {isDrawing ? '뽑는 중...' : '랜덤 선택'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>{label}</div>
        {helper && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.35 }}>{helper}</div>}
        {isChoosing && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.5rem', background: '#fff', border: '1px dashed var(--border-cozy)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '100%' }}>오프라인에서 뽑은 카드 입력</span>
            <select value={manualSuit} onChange={e => setManualSuit(e.target.value)} disabled={disabled} style={{ height: '32px', fontSize: '0.8rem' }}>
              <option value="♥">1. 문양: ♥</option>
              <option value="♦">1. 문양: ♦</option>
              <option value="♣">1. 문양: ♣</option>
              <option value="♠">1. 문양: ♠</option>
            </select>
            <select value={manualValue} onChange={e => setManualValue(Number(e.target.value))} disabled={disabled} style={{ height: '32px', fontSize: '0.8rem' }}>
              <option value={1}>2. 숫자: A</option>
              <option value={2}>2. 숫자: 2</option>
              <option value={3}>2. 숫자: 3</option>
              <option value={4}>2. 숫자: 4</option>
              <option value={5}>2. 숫자: 5</option>
              <option value={6}>2. 숫자: 6</option>
              <option value={7}>2. 숫자: 7</option>
              <option value={8}>2. 숫자: 8</option>
              <option value={9}>2. 숫자: 9</option>
              <option value={10}>2. 숫자: 10</option>
              <option value={11}>2. 숫자: J</option>
              <option value={12}>2. 숫자: Q / Monarch</option>
              <option value={13}>2. 숫자: K / Monarch</option>
            </select>
            <button type="button" onClick={applyManual} disabled={disabled} style={{ height: '32px', padding: '0 0.65rem', background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              카드 채우기
            </button>
          </div>
        )}
        {card && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            현재 카드: <strong>{card.suit} {cardDisplayValue(card.value)}</strong> · 룰 표기: <strong>{cardRuleValue(card)}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

// =================================================================
// 3.4b. TRAVEL SECONDARY DRAW SLOT (inline, self-contained)
// =================================================================
const TravelSecondaryDrawSlot = () => {
  const [drawnCard, setDrawnCard] = useState<PlayingCard | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDraw = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    window.setTimeout(() => {
      setDrawnCard(drawPlayingCard());
      setIsDrawing(false);
    }, 380);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      {drawnCard ? (
        <>
          <img
            src={getCardSvgUrl(drawnCard.suit, drawnCard.value)}
            alt={`${drawnCard.suit} ${cardDisplayValue(drawnCard.value)}`}
            style={{ width: '56px', height: '82px', objectFit: 'contain', borderRadius: '5px', boxShadow: '0 3px 8px rgba(0,0,0,0.15)' }}
          />
          <div>
            <div style={{ fontWeight: 'bold', color: '#3a4c8a', fontSize: '0.92rem' }}>
              {drawnCard.suit} {cardDisplayValue(drawnCard.value)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#666' }}>룰 표기: {cardRuleValue(drawnCard)}</div>
            <button
              type="button"
              onClick={handleDraw}
              style={{ marginTop: '0.3rem', padding: '0.25rem 0.65rem', fontSize: '0.76rem', background: '#3a4c8a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              다시 뽑기
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={handleDraw}
          disabled={isDrawing}
          style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', background: '#3a4c8a', color: '#fff', border: 'none', borderRadius: '6px', cursor: isDrawing ? 'not-allowed' : 'pointer', fontWeight: 600 }}
        >
          {isDrawing ? '뽑는 중…' : '🎴 추가 카드 뽑기'}
        </button>
      )}
    </div>
  );
};

// =================================================================
// 3.5. COZY TAG & PORTION RENDERING SYSTEM
// =================================================================
const tagTranslationMap: { [key: string]: string } = {
  '통증': 'PAIN', '상처': 'WOUND', '감염': 'INFECTION', '기생충': 'PARASITE', '감각': 'SENSES',
  '수면': 'SLEEP', '호흡': 'BREATH', '화상': 'BURN', '털': 'FUR', '깃털': 'FEATHER',
  '가죽': 'HIDE', '비늘': 'SCALE', '독': 'POISON', '위장': 'STOMACH', '체온': 'TEMPERATURE',
  '기쁨': 'JOY', '기분': 'MOOD', '본능': 'INSTINCT', '저편': 'ELSEWHERE', '신경': 'NERVES',

  'pain': 'PAIN', 'wound': 'WOUND', 'infection': 'INFECTION', 'parasite': 'PARASITE', 'senses': 'SENSES',
  'sleep': 'SLEEP', 'breath': 'BREATH', 'burn': 'BURN', 'fur': 'FUR', 'feather': 'FEATHER',
  'hide': 'HIDE', 'scale': 'SCALE', 'poison': 'POISON', 'stomach': 'STOMACH', 'temperature': 'TEMPERATURE',
  'joy': 'JOY', 'mood': 'MOOD', 'instinct': 'INSTINCT', 'elsewhere': 'ELSEWHERE', 'nerves': 'NERVES',
  'minimum fair': 'MINIMUM FAIR', 'fair': 'FAIR',
  'something to set a bone': 'SOMETHING TO SET A BONE',
  'a brightly coloured plant reagent': 'A BRIGHTLY COLOURED PLANT REAGENT'
};

const tagColorMap: { [key: string]: { bg: string, text: string, border: string } } = {
  'PAIN': { bg: '#fff0f0', text: '#d94141', border: '#fcc8c8' },
  'WOUND': { bg: '#fff5f0', text: '#e05a36', border: '#ffd2c4' },
  'INFECTION': { bg: '#f2f9f3', text: '#3d824d', border: '#cce6d2' },
  'PARASITE': { bg: '#fbf5eb', text: '#8b5a2b', border: '#e8dbcd' },
  'SENSES': { bg: '#f5f0ff', text: '#7d4bb5', border: '#e3d2fd' },
  'SLEEP': { bg: '#f0f4ff', text: '#406ac4', border: '#d0ddfc' },
  'BREATH': { bg: '#f0f9ff', text: '#207bb5', border: '#cce9fc' },
  'BURN': { bg: '#fffdf0', text: '#cca010', border: '#fcf2c4' },
  'FUR': { bg: '#faf6f0', text: '#806850', border: '#e6dec8' },
  'FEATHER': { bg: '#f0fbfb', text: '#1ea0a0', border: '#cceeee' },
  'HIDE': { bg: '#fbf6f2', text: '#8f5c38', border: '#ebd8cc' },
  'SCALE': { bg: '#f0fbf7', text: '#1a9e78', border: '#ccf0e4' },
  'POISON': { bg: '#fdf0ff', text: '#b33cb3', border: '#fcd0fc' },
  'STOMACH': { bg: '#fafdf0', text: '#76941b', border: '#edf7cc' },
  'TEMPERATURE': { bg: '#fff5f5', text: '#d94141', border: '#fcc8c8' },
  'JOY': { bg: '#fff9e6', text: '#d19200', border: '#ffeebf' },
  'MOOD': { bg: '#fdf6f7', text: '#bf435c', border: '#f7d2d8' },
  'INSTINCT': { bg: '#f7f6f5', text: '#5c544d', border: '#ded9d5' },
  'ELSEWHERE': { bg: '#f0fdf4', text: '#2b8a4a', border: '#ccf5d9' },
  'NERVES': { bg: '#f9f6ff', text: '#6930c3', border: '#dec9ff' },

  'DEFAULT': { bg: '#f5f5f5', text: '#555555', border: '#dddddd' }
};

const getTagStyle = (tagName: string) => {
  const clean = tagName.toUpperCase().trim();
  for (const key of Object.keys(tagColorMap)) {
    if (clean.includes(key)) {
      return tagColorMap[key];
    }
  }
  return tagColorMap.DEFAULT;
};

const renderSingleTagBadge = (tagContent: string) => {
  const numMatch = tagContent.trim().match(/^([\s\S]+?)\s*(\d+)$/);
  let tagName = tagContent.trim();
  let tagNum = '';
  if (numMatch) {
    tagName = numMatch[1].trim();
    tagNum = numMatch[2];
  }

  const cleanKey = tagName.toLowerCase();
  const translated = tagTranslationMap[cleanKey] || tagTranslationMap[tagName] || tagName.toUpperCase();
  const finalTagText = tagNum ? `${translated} ${tagNum}` : translated;

  const style = getTagStyle(finalTagText);
  return (
    <span
      style={{
        padding: '0.2rem 0.6rem',
        borderRadius: '8px',
        background: style.bg,
        color: style.text,
        border: `1.5px solid ${style.border}`,
        fontSize: '0.78rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-fancy)',
        whiteSpace: 'nowrap'
      }}
    >
      {finalTagText}
    </span>
  );
};

const parseAndRenderTags = (tagsStr: string) => {
  if (!tagsStr) return null;

  let prepared = localizeAilmentPresentationText(tagsStr)
    .replace(/([a-zA-Z가-힣]+)\s+(\d+)\s*(?:&|및|and)\s*(\d+)/g, '$1 $2 and $1 $3')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by commas, '및', 'and', or '&'
  const parts = prepared.split(/,|\s+및\s+|\s+and\s+|&/gi).map(p => p.trim()).filter(Boolean);

  return (
    <div className="tag-badge-list">
      {parts.map((part, idx) => {
        const isOrChoice = part.includes('또는') || /\bor\b/i.test(part);

        if (isOrChoice) {
          const options = part.split(/\s+또는\s+|\s+or\s+/i).map(o => o.trim()).filter(Boolean);
          return (
            <div
              key={idx}
              className="tag-choice-group"
              style={{
                padding: '0.25rem 0.5rem',
                border: '1.5px dashed var(--border-cozy)',
                borderRadius: '10px',
                background: '#fcfaf6',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              {options.map((opt, optIdx) => (
                <Fragment key={optIdx}>
                  {optIdx > 0 && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', fontFamily: 'var(--font-fancy)' }}>
                      또는
                    </span>
                  )}
                  {renderSingleTagBadge(opt)}
                </Fragment>
              ))}
            </div>
          );
        } else {
          return (
            <Fragment key={idx}>
              {renderSingleTagBadge(part)}
            </Fragment>
          );
        }
      })}
    </div>
  );
};

const parsePrepsLine = (line: string) => {
  const match = line.trim().match(/^(\d\/\d|\d)([\s\S]*)$/);
  if (match) {
    return {
      portion: match[1],
      content: match[2].trim()
    };
  }
  return { portion: "", content: line };
};

const PortionIndicator = ({ value }: { value: string }) => {
  let filled = 0;

  if (value === '1/3') {
    filled = 1;
  } else if (value === '2/3') {
    filled = 2;
  } else if (value === '1' || value === '1/1' || value === '3/3') {
    filled = 3;
  } else if (value === '1/2') {
    filled = 1.5;
  } else {
    const match = value.match(/(\d+)\/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      const den = parseInt(match[2]);
      if (den === 3) {
        filled = num;
      } else {
        filled = (num / den) * 3;
      }
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        filled = num * 3;
      }
    }
  }

  filled = Math.min(3, Math.max(0, filled));

  return (
    <span style={{ display: 'inline-flex', gap: '3px', marginRight: '6px', transform: 'translateY(3px)' }}>
      {[1, 2, 3].map((i) => {
        const isFilled = filled >= i;
        const isHalf = !isFilled && (filled + 0.5 >= i);
        return (
          <span
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: isFilled ? 'var(--primary)' : isHalf ? 'linear-gradient(90deg, var(--primary) 50%, #e0e0e0 50%)' : '#e0e0e0',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'inline-block'
            }}
            title={`${value} 분량`}
          />
        );
      })}
    </span>
  );
};

const prepKeywordMap: { [key: string]: { label: string; bg: string; color: string; border: string } } = {
  '빻아서': { label: '빻기 [CRUSH] 🔨', bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
  '갈아서': { label: '갈기 [GRIND] 🔨', bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
  '끓여서': { label: '끓이기 [BOIL] ♨️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  '달여서': { label: '달이기 [BREW] ♨️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  '끓인 뒤': { label: '끓이기 [BOIL] ♨️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  '요리해서': { label: '요리 [COOK] 🍳', bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  '요리하여': { label: '요리 [COOK] 🍳', bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  '씹어서': { label: '씹기 [CHEW] 🦷', bg: '#ffedd5', color: '#c2410c', border: '#fdbb2d' },
  '발라서': { label: '바르기 [APPLY] 🐾', bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' },
  '발라': { label: '바르기 [APPLY] 🐾', bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' },
  '첨가하여': { label: '첨가 [ADD] ➕', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  '첨가': { label: '첨가 [ADD] ➕', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
};

const formatTextWithPrepKeywords = (text: string, keyPrefix: string): React.ReactNode[] => {
  const keywords = Object.keys(prepKeywordMap);
  keywords.sort((a, b) => b.length - a.length);

  const pattern = new RegExp(`(${keywords.join('|')})`, 'g');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const keyword = match[1];
    const style = prepKeywordMap[keyword];

    parts.push(
      <span
        key={`${keyPrefix}_kw_${match.index}`}
        style={{
          padding: '0.12rem 0.35rem',
          borderRadius: '4px',
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          fontSize: '0.72rem',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          margin: '0 0.15rem',
          transform: 'translateY(-1px)'
        }}
      >
        {style.label}
      </span>
    );

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

const renderPreps = (prepsStr: string) => {
  if (!prepsStr) return null;

  const lines = prepsStr.split('\n').filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
      {lines.map((line, idx) => {
        const { portion, content } = parsePrepsLine(line);

        const parts: React.ReactNode[] = [];
        const tagRegex = /\[([^\]]+)\]/g;
        let lastIndex = 0;
        let match;

        while ((match = tagRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            const rawText = content.substring(lastIndex, match.index);
            parts.push(...formatTextWithPrepKeywords(rawText, `idx_${idx}_part_${lastIndex}`));
          }

          const tagText = match[1];
          const numMatch = tagText.match(/^([\s\S]+?)\s*(\d+)$/);
          let tagName = tagText;
          let tagNum = '';
          if (numMatch) {
            tagName = numMatch[1].trim();
            tagNum = numMatch[2];
          }

          const cleanKey = tagName.toLowerCase();
          const translated = tagTranslationMap[cleanKey] || tagTranslationMap[tagName] || tagName.toUpperCase();
          const finalTagText = tagNum ? `${translated} ${tagNum}` : translated;
          const style = getTagStyle(finalTagText);

          parts.push(
            <span
              key={match.index}
              style={{
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                background: style.bg,
                color: style.text,
                border: `1.2px solid ${style.border}`,
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                margin: '0 0.2rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                transform: 'translateY(-1px)',
                fontFamily: 'var(--font-fancy)'
              }}
            >
              {finalTagText}
            </span>
          );

          lastIndex = tagRegex.lastIndex;
        }

        if (lastIndex < content.length) {
          const rawText = content.substring(lastIndex);
          parts.push(...formatTextWithPrepKeywords(rawText, `idx_${idx}_end_${lastIndex}`));
        }

        const finalContent = parts.length > 0 ? parts : formatTextWithPrepKeywords(content, `idx_${idx}_full`);

        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.88rem', color: '#444', lineHeight: '1.5' }}>
            {portion && <PortionIndicator value={portion} />}
            <div style={{ flex: 1 }}>{finalContent}</div>
          </div>
        );
      })}
    </div>
  );
};

const parseLocs = (locsStr: string) => {
  if (!locsStr) return { regions: [], seasons: [], desc: "" };

  const lines = locsStr.split('\n');
  const codeLine = lines[0] || "";
  const desc = lines.slice(1).join('\n') || "";

  const regions: string[] = [];
  const seasons: string[] = [];

  const regMap: { [key: string]: string } = {
    'b': '늪지',
    'f': '숲',
    'l': '호수',
    'g': '초원',
    'm': '산맥',
    't': '티탄유적'
  };

  const seasonMap: { [key: string]: string } = {
    'p': '봄',
    's': '여름',
    'a': '가을',
    'w': '겨울'
  };

  const cleanCode = codeLine.replace(/\s+/g, '').toLowerCase();

  for (const char of cleanCode) {
    if (regMap[char]) {
      regions.push(regMap[char]);
    } else if (seasonMap[char]) {
      seasons.push(seasonMap[char]);
    }
  }

  return { regions, seasons, desc };
};

// =================================================================
// 4. MAIN APP COMPONENT
// =================================================================
const polishRuleText = (text: string = ''): string => text
  .replace(/사역마/g, '길동무')
  .replace(/길동무\s*\(Familiar\)/g, '길동무')
  .replace(/Familiar/g, '길동무')
  .replace(/Bartering/g, '물꼬 거래')
  .replace(/Social Encounter Card Draw/g, '사교 조우 카드 뽑기')
  .replace(/Rarity Check Card Draw/g, '희귀도 판정 카드 뽑기')
  .replace(/Rarity/g, '희귀도')
  .replace(/Draw a Card/gi, '카드를 뽑습니다')
  .replace(/Draw another Card/gi, '카드를 한 장 더 뽑습니다')
  .replace(/Trinkets?/g, '장신구')
  .replace(/Reagents?/g, '영약재')
  .replace(/Journey/g, '여정')
  .replace(/Calendar/g, '일정')
  .replace(/Reputation/g, '길드 명성')
  .replace(/Foraging Points?|FP/g, '채집 포인트')
  .replace(/Behemoth/g, '거수')
  .replace(/\s+\)/g, ')');

const migrateLegacyTerminology = (value: any): any => {
  if (typeof value === 'string') {
    return polishRuleText(value);
  }
  if (Array.isArray(value)) {
    return value.map(migrateLegacyTerminology);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, migrateLegacyTerminology(nested)])
    );
  }
  return value;
};

const migrateGuildNotes = (bag: BagItem[] = []): BagItem[] => bag.map(item => {
  if (item.guildNote) return item;
  const region = item.name.match(/\[(Forest|Meadow|Loch|Bog|Mountain|Titan)\]/)?.[1] as Region | undefined;
  if (/식물학자의 장부|Botanist'?s Ledger/i.test(item.name)) return { ...item, guildNote: { kind: 'ledger', region } };
  if (/물류 지도|Logistical Map/i.test(item.name)) return { ...item, guildNote: { kind: 'map', region } };
  if (/흥미로운 소문|Juicy Gossip/i.test(item.name)) return { ...item, guildNote: { kind: 'gossip' } };
  return item;
});

const normalizeLocationEntries = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map(raw => (typeof raw === 'string' ? localizeLocationName(raw) : ''))
    .filter((name): name is string => Boolean(name) && name !== 'Unknown Location'))];
};

const migrateState = (s: any): GameState => {
  if (!s) return INITIAL_STATE;
  s = migrateLegacyTerminology(migrateSavedRulesState(s));
  const migratedCurrentLocationName = typeof s.currentLocationName === 'string' && s.currentLocationName.trim()
    ? localizeLocationName(s.currentLocationName)
    : '';
  const visitedLocations = normalizeLocationEntries(s.visitedLocations);
  const fallbackCurrentLocation = migratedCurrentLocationName || visitedLocations[0] || INITIAL_STATE.currentLocationName;
  const dedupedCurrentLocation = normalizeLocationEntries([migratedCurrentLocationName])[0] || fallbackCurrentLocation;
  const mergedVisitedLocations = visitedLocations.length > 0 ? visitedLocations : [fallbackCurrentLocation];
  return syncWorldMemory({
    ...INITIAL_STATE,
    ...s,
    rulebookEdition: s.rulebookEdition || RULEBOOK_EDITION,
    schemaVersion: s.schemaVersion || CURRENT_SCHEMA_VERSION,
    rulesetId: s.rulesetId || 'legacy-campaign',
    bio: {
      ...INITIAL_BIO,
      ...(s.bio || {})
    },
    bag: migrateGuildNotes(s.bag || []),
    canFlyOverride: s.canFlyOverride !== undefined ? s.canFlyOverride : false,
    wagonExpansions: {
      ...INITIAL_WAGON,
      ...(s.wagonExpansions || {})
    },
    activePassenger: s.activePassenger || null,
    activeAilments: s.activeAilments || (s.activeAilment ? [s.activeAilment] : []),
    activePatientId: s.activePatientId || null,
    patients: s.patients || [],
    passengerPickupReady: s.passengerPickupReady || false,
    barrows: s.barrows || [],
    activeDelve: s.activeDelve || null,
    pursuedByBehemoth: s.pursuedByBehemoth || null,
    nextMoveSpeedOverride: typeof s.nextMoveSpeedOverride === 'number' ? s.nextMoveSpeedOverride : null,
    companions: s.companions || [],
    companionHive: s.companionHive || [],
    resourcefulReagent: s.resourcefulReagent || "",
    ingenuitiveTool: s.ingenuitiveTool || "",
    clinics: s.clinics || [],
    customMapLocations: s.customMapLocations || [],
    customMapEdges: s.customMapEdges || [],
    guildServiceTravelRerolls: s.guildServiceTravelRerolls || 0,
    forecastMoves: s.forecastMoves || 0,
    forecastActiveAtLocation: s.forecastActiveAtLocation || false,
    taxiSoarActive: s.taxiSoarActive || false,
    griphUsedThisJourney: s.griphUsedThisJourney || false,
    pondSkimmerUsedThisJourney: s.pondSkimmerUsedThisJourney || false,
    beetleUsedThisJourney: s.beetleUsedThisJourney || false,
    companionTravelPaths: s.companionTravelPaths || 0,
    missiveSettlements: s.missiveSettlements || [],
    scroungingMode: s.scroungingMode || false,
    scroungingTimer: s.scroungingTimer || 0,
    independentUsedThisAilment: s.independentUsedThisAilment || false,
    currentLocationName: dedupedCurrentLocation,
    visitedLocations: mergedVisitedLocations,
    curedAilmentInThisWilds: s.curedAilmentInThisWilds || false,
    needsLocalHelpBeforeMove: s.needsLocalHelpBeforeMove || false,
    lastForageCardValue: s.lastForageCardValue || 0,
    gardenPlant: s.gardenPlant || "",
    gardenHarvestedThisAilment: s.gardenHarvestedThisAilment || false,
    soddenLogInsect: s.soddenLogInsect || "",
    soddenLogHarvestedThisAilment: s.soddenLogHarvestedThisAilment || false,
    goodwillDonationsVal: s.goodwillDonationsVal || 0,
    cumulativeDays: s.cumulativeDays || 0,
    completedSeasons: Number.isInteger(s.completedSeasons)
      ? Math.max(0, s.completedSeasons)
      : Math.max(0, Math.floor((s.cumulativeDays || 0) / 30)),
    completedReconnecting: s.completedReconnecting || false,
    journeyGoalCounter: s.journeyGoalCounter || 0,
    journeyGoalChecklist: s.journeyGoalChecklist || [],
    journeyStartReputation: s.journeyStartReputation !== undefined ? s.journeyStartReputation : (s.reputation || 5),
    journeyOrigin: s.journeyOrigin || "",
    journey: s.journey || null,
    pendingEnding: s.pendingEnding || null,
    activeBarter: s.activeBarter || null,
    pendingBarter: s.pendingBarter || null,
    pendingLeaveObligation: s.pendingLeaveObligation || null,
    pendingAlternativeAcquisition: s.pendingAlternativeAcquisition || null,
    barterAttemptHistory: s.barterAttemptHistory || {},
    legacyClinics: s.legacyClinics || [],
    legacyApothecaries: s.legacyApothecaries || [],
    discoveredRecipes: s.discoveredRecipes || {},
    journeyChronicles: s.journeyChronicles || [],
    patientCasebook: (s.patientCasebook && s.patientCasebook.length > 0)
      ? s.patientCasebook.map(normalizeCaseRecord)
      : legacyCaseRecordsFromJournals(s),
    patientArchive: s.patientArchive || [],
    pendingPatientArchive: s.pendingPatientArchive || null,
    worldAlmanac: s.worldAlmanac || [],
    journals: mergeCharacterJournals(Array.isArray(s.journals) ? s.journals : [], { ...INITIAL_BIO, ...(s.bio || {}) }),
    travelScrapbook: s.travelScrapbook || [],
    trinketArchive: (s.trinketArchive && s.trinketArchive.length > 0)
      ? s.trinketArchive.map(normalizeTrinketRecord)
      : trinketArchiveFromCurrent(s),
    familiarTrust: s.familiarTrust || 0,
    familiarMemories: s.familiarMemories || [],
    legacyRestUsedThisLocation: s.legacyRestUsedThisLocation || false,
    lostPatientLegacy: s.lostPatientLegacy || null,
    pendingEncounter: s.pendingEncounter || null,
    pendingForaging: s.pendingForaging || null,
    appliedTransactionIds: s.appliedTransactionIds || [],
    appliedEncounterEffectIds: s.appliedEncounterEffectIds || [],
    pendingServices: s.pendingServices || [],
    serviceMapMutations: s.serviceMapMutations || [],
    toolStates: s.toolStates || [],
    wagonState: s.wagonState || null,
    companionStates: s.companionStates || [],
    companionHiveStates: s.companionHiveStates || [],
    rumours: s.rumours || [],
    clinicAgendaIds: s.clinicAgendaIds || [],
    ailmentTagOverrides: s.ailmentTagOverrides || [],
    trinketRecords: s.trinketRecords || [],
    legacyTrinketCount: Number.isInteger(s.legacyTrinketCount) ? s.legacyTrinketCount : 0,
    pendingManualEffect: normalizeLegacyManualEffectDraft(s.pendingManualEffect),
    treatmentDraft: s.treatmentDraft || null,
    manualEffectDraft: normalizeLegacyManualEffectDraft(s.manualEffectDraft),
    manualEffectQueue: Array.isArray(s.manualEffectQueue) ? s.manualEffectQueue.map((row: unknown) => normalizeLegacyManualEffectDraft(row)).filter((row: ManualEffectDraft | null): row is ManualEffectDraft => Boolean(row)) : [],
    manualEffectRecords: Array.isArray(s.manualEffectRecords) ? s.manualEffectRecords : [],
    pendingManualFollowUps: Array.isArray(s.pendingManualFollowUps) ? s.pendingManualFollowUps : [],
    manualConditions: Array.isArray(s.manualConditions) ? s.manualConditions.map(String) : [],
    offlineOutbox: s.offlineOutbox || [],
    downtimeCompleted: s.downtimeCompleted || false,
    downtimeRequired: s.downtimeRequired || false,
    saveRevision: s.saveRevision || 0
  });
};

const migrateCampaignSave = (raw: unknown): { ok: true; state: GameState } | { ok: false } =>
  tryMigrateCampaignSave(raw, migrateState);

const exportRawCampaignSave = () => {
  const raw = localStorage.getItem(CAMPAIGN_SAVE_KEY);
  if (!raw) {
    showAlert('내보낼 로컬 기록이 없습니다.');
    return;
  }
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(raw)}`);
  downloadAnchor.setAttribute('download', `apawthecaria_save_raw_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

const findCanonicalReagent = (reagentName: string) => {
  const needle = reagentName.trim().toLowerCase();
  if (!needle) return null;
  return REAGENTS.find(row =>
    row.canonicalName.toLowerCase() === needle
    || row.displayName.toLowerCase() === needle
    || row.canonicalName.toLowerCase().includes(needle)
    || row.displayName.toLowerCase().includes(needle)
  ) || null;
};

const availableCatalogKeys = <T extends string>(record: Record<T, 'Common' | 'Rare' | 'Unavailable'>): T[] =>
  (Object.entries(record) as [T, 'Common' | 'Rare' | 'Unavailable'][])
    .filter(([, availability]) => availability !== 'Unavailable')
    .map(([key]) => key);

const reagentDisplayRecord = (row: (typeof REAGENTS)[number]) => ({
  name: row.displayName,
  rawName: row.canonicalName,
  type: row.type,
  br: row.baseRarity,
  description: row.description,
  regions: availableCatalogKeys(row.regionAvailability),
  seasons: availableCatalogKeys(row.seasonAvailability),
  preps: row.preparations.map(part => {
    const tags = part.tags.map(tag => `[${tag.tag} ${tag.value}]`).join(' ');
    return `${part.name} [${part.method}]${tags ? ` ${tags}` : ''}`;
  }).join('\n') || 'unprepared specimen'
});

const ailmentDisplayRecord = (row: (typeof AILMENTS)[number]) => {
  const legacy = GAME_DATA.ailments.find(ailment =>
    ailment.rawName === row.canonicalName
    || ailment.name === row.displayName
    || ailment.name.toLowerCase().includes(row.canonicalName.toLowerCase())
  );
  const effectText = (effects: (typeof row.successEffects)) =>
    effects
      .map(item => item.effect.type === 'customEffect' ? item.effect.description : '')
      .filter(Boolean)
      .join('\n');
  return {
    name: row.displayName,
    rawName: row.canonicalName,
    severity: row.severity,
    timer: row.timer,
    tags: legacy?.tags || '',
    description: legacy?.description || '',
    outcome: legacy?.outcome || effectText(row.successEffects),
    consequence: legacy?.consequence || effectText(row.failureEffects)
  };
};

const isJourneyGoal = (title: string | undefined, ...names: string[]) => names.includes(title || '');

const getJourneyGoalEvaluation = (s: GameState) => s.journey
  ? evaluateJourneyGoal(s.journey, {
    inventory: toEngineInventory(s.bag),
    reputation: s.reputation,
    patients: s.patients
  })
  : null;

const checkJourneyGoalSatisfaction = (s: GameState): boolean => {
  const canonical = getJourneyGoalEvaluation(s);
  if (canonical) return canonical.complete;
  const title = s.journeyGoalTitle;
  const counter = s.journeyGoalCounter || 0;
  const checklist = s.journeyGoalChecklist || [];

  if (isJourneyGoal(title, '자아 성찰')) {
    return counter >= 3;
  }
  if (isJourneyGoal(title, '동반자 우대', '관계 회복')) {
    return counter >= 3;
  }
  if (isJourneyGoal(title, '길드의 책임')) {
    const startRep = s.journeyStartReputation !== undefined ? s.journeyStartReputation : 5;
    return (s.reputation - startRep >= 5);
  }
  if (isJourneyGoal(title, '자연 조사', '자연 환경 조사')) {
    return counter >= 3;
  }
  if (isJourneyGoal(title, '긴급 치료')) {
    return s.bag.some(item => {
      if (item.type !== 'reagent' || !item.name) return false;
      const match = /\[(WOUND|INFECTION|SLEEP)\s+(\d+)\]/i.exec(item.name);
      return match !== null && parseInt(match[2]) >= 3;
    });
  }
  if (isJourneyGoal(title, '영감 수집', '신선한 영감')) {
    const uniqueRegions = new Set(checklist);
    return uniqueRegions.size >= 6;
  }
  if (isJourneyGoal(title, '의학 연구 자료')) {
    return counter >= 3;
  }
  if (isJourneyGoal(title, '호송 및 정의')) {
    return s.bag.some(item => item.name.includes("Evidence") || item.name.includes("수송 증거물"));
  }
  if (isJourneyGoal(title, '영약 보충')) {
    const tagCounts: Record<string, number> = {};
    s.bag.forEach(item => {
      if (item.type !== 'reagent' || !item.name) return;
      const regex = /\[([A-Z_]+)\s+(\d+)\]/g;
      let match;
      while ((match = regex.exec(item.name)) !== null) {
        const tag = match[1].toUpperCase();
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
    return Object.values(tagCounts).some(count => count >= 3);
  }
  if (isJourneyGoal(title, '마음의 정리')) {
    return counter >= 3;
  }
  if (isJourneyGoal(title, '마지막 작별')) {
    return s.bag.some(item => {
      if (item.type !== 'reagent' || !item.name) return false;
      const match = /\[ELSEWHERE\s+(\d+)\]/i.exec(item.name);
      return match !== null && parseInt(match[2]) >= 2;
    });
  }
  if (isJourneyGoal(title, '방랑벽')) {
    const uniqueRegions = new Set(checklist);
    return uniqueRegions.size >= 5;
  }
  return false;
};

const checkReagentGatherForGoal = (s: GameState, reagentName: string) => {
  let nextGoalCounter = s.journeyGoalCounter || 0;
  let nextChecklist = [...(s.journeyGoalChecklist || [])];
  if (s.journeyActive && isJourneyGoal(s.journeyGoalTitle, '영감 수집', '신선한 영감')) {
    const dbReag = findCanonicalReagent(reagentName);
    if (dbReag && dbReag.type === 'PLANT') {
      const validRegions = ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan'];
      if (validRegions.includes(s.currentRegion) && !nextChecklist.includes(s.currentRegion)) {
        nextChecklist.push(s.currentRegion);
      }
      nextGoalCounter = nextChecklist.length;
    }
  }
  return { nextGoalCounter, nextChecklist };
};

const isEligibleForBandolier = (item: BagItem): boolean => {
  if (item.type !== 'reagent') return false;
  const canonical = item.canonicalReagentId ? REAGENT_BY_ID.get(item.canonicalReagentId) : null;
  if (canonical) return canonical.type === 'PLANT' || canonical.type === 'INSECT';
  const itemName = item.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const dbReag = findCanonicalReagent(itemName);
  return dbReag ? dbReag.type === 'PLANT' || dbReag.type === 'INSECT' : false;
};

const canonicalWaterwayPermissions = (s: GameState) => resolveWaterwayPermissions(
  canonicalToolsFromState(s),
  canonicalWagonFromState(s)
);

const hasLochStoppingGear = (s: GameState): boolean => canonicalWaterwayPermissions(s).canStopInLoch;

const hasSafeWaterwayTravel = (s: GameState): boolean =>
  canonicalWaterwayPermissions(s).protectsFromSoaking ||
  (isHouseRuleEnabled(s.rulesetId, 'companionFlightWaterPermissions')
    && (s.companions || []).some(comp => ['butterfly', 'honeybee', 'wasp', 'pond_skimmer'].includes(comp.name)));

const isRuinedWhenSoaked = (item: BagItem): boolean => {
  const text = `${item.id} ${item.name} ${item.tags || ''} ${item.preps || ''}`.toLowerCase();
  return item.type === 'reagent' ||
    text.includes('evidence') ||
    text.includes('ruined if soaked') ||
    item.name.includes('증거');
};

// Helper for max carry capacity
const getMaxCarry = (s: GameState): number => {
  let base = s.bio.carry;
  const wagonCapabilities = s.wagonState ? resolveWagonCapabilities(s.wagonState) : null;
  if (wagonCapabilities) base += wagonCapabilities.carryBonus;
  else if (s.wagonExpansions?.baseUnit) base += s.wagonExpansions.sideBrackets ? 6 : 4;
  // Check tools in bag
  const canonicalTools = canonicalToolsFromState(s);
  const saddlebagBonus = saddlebagsCarryBonus(canonicalTools, Boolean(s.bio.familiarName || s.activePassenger));
  base += saddlebagBonus || ((hasTool(s, 'saddlebag') || hasTool(s, '새들백') || hasTool(s, '안장가방')) ? 2 : 0);

  const hasSatchel = s.bag.some(item =>
    item.craftedItemId === 'knitted-satchel' ||
    item.id === 'knit_satchel' ||
    item.name.toLowerCase().includes('satchel') ||
    item.name.includes('새철') ||
    item.name.includes('책가방')
  );
  if (hasSatchel) base += 1;

  // Familiar: Vigorous — +2 Carry (or +4 with Wagon), rulebook p.14
  const familiarBenefit = getActiveFamiliarBenefit(s);
  const familiarMechanic = getActiveFamiliarMechanic(s);
  if (familiarMechanic === 'vigorous' || familiarBenefit.includes('힘센 일꾼')) {
    base += (s.wagonState?.commissioned || s.wagonExpansions?.baseUnit) ? 4 : 2;
  }

  return base;
};

// Helper for speed
const getTravelSpeed = (s: GameState, weight: number): number => {
  const maxCarry = getMaxCarry(s);
  if (weight > maxCarry) return 1; // Over Encumbered

  let base = s.bio.speed;
  const wagonCapabilities = s.wagonState ? resolveWagonCapabilities(s.wagonState) : null;
  if (wagonCapabilities) base += wagonCapabilities.speedBonus;
  else if (s.wagonExpansions?.baseUnit) base += s.wagonExpansions.axelSprings ? 2 : 1;
  if (s.currentSeason === 'Winter' && s.bag.some(item => item.craftedItemId === 'knitted-scarf' || item.name.includes('Knitted Scarf'))) base += 1;
  return base;
};

const canonicalForagingModifiers = (s: GameState) => {
  const mechanic = getActiveFamiliarMechanic(s);
  const plantCompanion = (s.companionStates || []).some(row => row.companionId === 'butterfly')
    && (s.currentSeason === 'Spring' || s.currentSeason === 'Summer');
  const insectCompanion = (s.companionStates || []).some(row => row.companionId === 'spider');
  const resourceful = mechanic === 'resourceful'
    ? REAGENTS.find(row => row.displayName === s.resourcefulReagent || row.canonicalName === s.resourcefulReagent)?.id
    : undefined;
  return {
    typeRarityModifiers: {
      PLANT: (mechanic === 'brushwise' ? -2 : 0) + (plantCompanion ? -1 : 0),
      INSECT: insectCompanion ? -1 : 0,
      TITAN: mechanic === 'titanwise' ? -2 : 0
    },
    alwaysAvailableReagentIds: resourceful ? [resourceful] : [],
    weatherProtectionActive: Boolean(s.forecastActiveAtLocation)
  };
};

const canonicalWagonFromState = (s: GameState): WagonState => {
  if (s.wagonState) return s.wagonState;
  const legacy = s.wagonExpansions || INITIAL_WAGON;
  const expansionIds = [
    legacy.sideBrackets && 'side-brackets', legacy.axelSprings && 'axel-springs',
    legacy.hiveBrackets && 'hive-brackets', legacy.sealedCarriage && 'sealed-carriage',
    legacy.pedalMotor && 'pedal-motor', legacy.experimentalContraption && 'experimental-contraption',
    legacy.passengerBooth && 'passenger-booth', legacy.clayPots && 'clay-pots',
    legacy.shadowCanvas && 'shadow-canvas'
  ].filter((id): id is string => Boolean(id));
  return {
    commissioned: Boolean(legacy.baseUnit),
    expansionIds,
    clayPotReagentId: null,
    clayPotMoves: 0
  };
};

const toMobilityRuntime = (s: GameState, inventory = toEngineInventory(s.bag)): MobilityRuntimeState => ({
  wagon: canonicalWagonFromState(s),
  companions: s.companionStates || [],
  storedCompanions: s.companionHiveStates || [],
  passenger: s.activePassenger || null,
  passengerPickupReady: Boolean(s.passengerPickupReady),
  reputation: s.reputation,
  trinkets: s.trinkets.length,
  inventory,
  season: s.currentSeason,
  appliedTransactionIds: s.appliedTransactionIds,
  journalEvents: [],
  downtimeRequired: s.downtimeRequired,
  downtimeCompleted: s.downtimeCompleted,
  behemothPursuitActive: Boolean(s.pursuedByBehemoth)
});

const applyMobilityRuntime = (s: GameState, runtime: MobilityRuntimeState): GameState => ({
  ...s,
  wagonState: runtime.wagon,
  companionStates: runtime.companions,
  companionHiveStates: runtime.storedCompanions,
  downtimeRequired: runtime.downtimeRequired ?? s.downtimeRequired,
  downtimeCompleted: runtime.downtimeCompleted ?? s.downtimeCompleted,
  pursuedByBehemoth: runtime.behemothPursuitActive === false ? null : s.pursuedByBehemoth,
  activePassenger: runtime.passenger,
  passengerPickupReady: runtime.passengerPickupReady,
  reputation: runtime.reputation,
  trinkets: resizeTrinkets(s.trinkets, runtime.trinkets, '이동 보상 장신구'),
  bag: fromEngineInventory(runtime.inventory, s.bag),
  appliedTransactionIds: runtime.appliedTransactionIds,
  journals: appendEngineJournals(s.journals, runtime.journalEvents)
});

const toBarrowRuntime = (s: GameState): BarrowRuntimeState => {
  const graph = toServiceMapGraph(s);
  const currentLocationId = findGraphLocationKey(s.currentLocationName, buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || []))
    || normalizeMapLocationName(s.currentLocationName);
  return {
    currentLocationId,
    calendarDays: s.calendarDays,
    reputation: s.reputation,
    trinkets: s.trinkets.length,
    carry: getMaxCarry(s),
    speed: getTravelSpeed(s, s.bag.reduce((sum, item) => sum + item.weight * Math.max(1, item.qty || 1), 0)),
    inventory: toEngineInventory(s.bag),
    companions: (s.companionStates || []) as CompanionState[],
    graph,
    barrows: (s.barrows || []).map(barrow => ({
      id: barrow.id,
      name: barrow.name,
      behemothClass: barrow.behemothClass,
      locationId: barrow.locationId || findGraphLocationKey(barrow.locationName, buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || [])) || normalizeMapLocationName(barrow.locationName),
      removed: Boolean(barrow.removed)
    })),
    activeDelve: s.activeDelve || null,
    movementBlocked: Boolean(s.activeDelve),
    needsLocalHelp: Boolean(s.needsLocalHelpBeforeMove),
    nextMoveSpeedOverride: s.nextMoveSpeedOverride,
    pursuit: s.pursuedByBehemoth ? { headStart: s.pursuedByBehemoth.headStart, minimumPaths: 3 } : null,
    journeyEnded: !s.journeyActive,
    appliedTransactionIds: s.appliedTransactionIds,
    journalEvents: [],
    patients: s.patients,
    activePatientId: s.activePatientId,
    patientArchive: s.patientArchive,
    archiveContext: {
      location: s.currentLocationName,
      encounteredAt: s.journey?.startDate || Date.now(),
      resolvedAt: Date.now(),
      sourceJourneyId: s.journey?.journeyId || null
    },
    startingForagingPoints: getStartingForagingPoints(s)
  };
};

const applyBarrowRuntime = (s: GameState, runtime: BarrowRuntimeState): GameState => {
  const before = toBarrowRuntime(s);
  const mapNodes = buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || []);
  const destination = mapNodes[runtime.currentLocationId];
  const runtimeLocation = runtime.graph[runtime.currentLocationId];
  const previousBarrows = new Map((s.barrows || []).map(row => [row.id, row]));
  let customMapLocations = s.customMapLocations || [];
  if (runtimeLocation?.locationType === 'Settlement' && destination) {
    const settlement: CustomMapLocation = {
      id: runtime.currentLocationId,
      label: runtimeLocation.name,
      x: destination.x,
      y: destination.y,
      region: runtimeLocation.region as MapRegion,
      kind: 'settlement',
      aliases: destination.aliases,
      neighbors: runtimeLocation.edges.map(edge => edge.to),
      source: 'canonical-barrow-result'
    };
    customMapLocations = [...customMapLocations.filter(row => row.id !== settlement.id), settlement];
  }
  const calendarDelta = Math.max(0, runtime.calendarDays - before.calendarDays);
  return {
    ...s,
    calendarDays: runtime.calendarDays,
    cumulativeDays: (s.cumulativeDays || 0) + calendarDelta,
    reputation: runtime.reputation,
    trinkets: resizeTrinkets(s.trinkets, runtime.trinkets, '고분 보상 장신구'),
    bio: {
      ...s.bio,
      carry: Math.max(0, s.bio.carry + runtime.carry - before.carry),
      speed: Math.max(0, s.bio.speed + runtime.speed - before.speed)
    },
    bag: fromEngineInventory(runtime.inventory, s.bag),
    companionStates: runtime.companions,
    currentLocationName: destination?.label || runtimeLocation?.name || s.currentLocationName,
    currentLocationType: runtimeLocation?.locationType === 'Settlement' ? 'Settlement' : s.currentLocationType,
    currentRegion: runtimeLocation?.region || s.currentRegion,
    customMapLocations,
    barrows: runtime.barrows.map(row => ({
      ...(previousBarrows.get(row.id) || {
        id: row.id,
        direction: '',
        region: runtime.graph[row.locationId]?.region || s.currentRegion,
        distance: '',
        locationName: runtime.graph[row.locationId]?.name || row.locationId
      }),
      id: row.id,
      name: row.name,
      behemothClass: row.behemothClass,
      locationId: row.locationId,
      removed: row.removed
    })),
    activeDelve: runtime.activeDelve,
    needsLocalHelpBeforeMove: runtime.movementBlocked || runtime.needsLocalHelp,
    nextMoveSpeedOverride: runtime.nextMoveSpeedOverride,
    pursuedByBehemoth: runtime.pursuit ? { headStart: runtime.pursuit.headStart } : null,
    journeyActive: runtime.journeyEnded ? false : s.journeyActive,
    patients: runtime.patients || s.patients,
    activePatientId: runtime.activePatientId === undefined ? s.activePatientId : runtime.activePatientId,
    patientArchive: runtime.patientArchive || s.patientArchive,
    appliedTransactionIds: runtime.appliedTransactionIds,
    journals: appendEngineJournals(s.journals, runtime.journalEvents)
  };
};

const TOOLS_DB = [
  { id: 'tool_basic_replacement', name: '기본 도구 교체품 (Basic Tools)', cost: 1, weight: 1/3, desc: '잃어버린 벨트 칼, 캠프 주전자, 절구와 공이를 대체합니다. 구매 시 이름을 선택해 가방에 넣습니다.', places: 'Any' },
  { id: 'tool_tent', name: '가죽 텐트 (Canvas Tent)', cost: 3, weight: 1, desc: '날씨(Weather) 태그 조우의 부정적 효과를 무시합니다. 사용 후 클로버/스페이드 드로우 시 파손.', places: 'Meadows Settlements' },
  { id: 'tool_frying_pan', name: '구리 프라이팬 (Copper Frying Pan)', cost: 6, weight: 2/3, desc: '[COOKED] 조제법 활성화.', places: 'Mountain Settlements' },
  { id: 'tool_cauldron', name: '철제 가마솥 (Big Iron Cauldron)', cost: 7, weight: 1, desc: '[DISTILLED] 조제법 활성화 및 치료제 보존[PRESERVE] 가능.', places: 'Mountain/Bog Settlements' },
  { id: 'tool_coracle', name: '자작나무 보트 (Bark Coracle)', cost: 5, weight: 1, desc: '영약재 분실 없이 물길을 안전하게 이동하고 Loch 위치에 멈출 수 있습니다. 호수 구역 채집 시 희귀도 -2.', places: 'Loch Settlements' },
  { id: 'tool_crossbow', name: '석궁 (Crossbow)', cost: 5, weight: 1, desc: '맹수(Beast)나 거대야수 조우 시 부정적 결과를 회피합니다. 볼트 탄약 필요.', places: 'Spoolkeep' },
  { id: 'tool_bolts', name: '석궁 볼트 (Bolts)', cost: 1, weight: 1/3, desc: '석궁 발사에 사용되는 탄약. 사용 후 폐기.', places: 'Any' },
  { id: 'tool_bandolier', name: '그린포 반도리어 (Greenpaw Bandolier)', cost: 5, weight: 1, desc: '식물 및 곤충 약재를 5 무게분까지 수납 가능하며, 수납된 무게에 상관없이 반도리어의 총 무게는 1로 고정됩니다.', places: 'Noonhill' },
  { id: 'tool_alembic', name: '유리 증류기 (Glass Alembic)', cost: 10, weight: 2/3, desc: '치료제 조제 시 동일 태그의 두 약재를 촉매[CATALYSE]하여 태그 가치 합산.', places: 'Loch Settlements' },
  { id: 'tool_spidersilk_net', name: '스파이더실크 그물 (Fine Spidersilk Net)', cost: 4, weight: 1/3, desc: '채집 시 곤충 약재 및 작은 물고기의 희귀도 -3.', places: 'Forest Settlements' },
  { id: 'tool_fairwind_spices', name: '페어윈드 양념 (Fairwind Spices)', cost: 10, weight: 1, desc: '제작하는 모든 치료제에 [FAIR 1] 효과를 추가합니다.', places: 'Odoak' },
  { id: 'tool_comb', name: '참빗 (Fine-toothed Comb)', cost: 3, weight: 1/3, desc: '치료제에 [FUR 3] 및 [PARASITE 1] 제공. 사용 후 스페이드 드로우 시 파손.', places: 'Forest/Mountain Settlements' },
  { id: 'tool_needles', name: '뜨개바늘 (Knitting Needles)', cost: 2, weight: 1/3, desc: '채집 대신 뜨개질 프로젝트(담요, 코트, 가방, 목도리)를 개시하여 도구를 제작합니다.', places: 'Noonhill' },
  { id: 'tool_instruments', name: '악기 (Instruments)', cost: 5, weight: 1, desc: '정착지/도시 진입 후 길동무나 다른 동료와 연주회를 열어 장신구를 획득합니다.', places: 'Forest/Bog Settlements' },
  { id: 'tool_waxed_satchel', name: '방수 가방 (Waxed Satchel)', cost: 5, weight: 1, desc: '영약재 분실 없이 물길 이동 가능.', places: 'Any' },
  { id: 'tool_stilts', name: '죽창 (Stilts)', cost: 3, weight: 1/3, desc: '수렁(Bog)에서 이동 시작 시 속도 +1.', places: 'Noonhill' },
  { id: 'tool_saddlebags', name: '안장가방 (Saddlebags)', cost: 3, weight: 0, desc: '가방 소지 한도 +2 (길동무에게도 1개 장착 가능).', places: 'Any' }
];

const CANONICAL_TOOL_IDS: Record<string, string> = {
  tool_basic_replacement: 'basic-tools-replacement', tool_tent: 'canvas-tent',
  tool_frying_pan: 'copper-frying-pan', tool_cauldron: 'big-iron-cauldron',
  tool_coracle: 'bark-coracle', tool_crossbow: 'crossbow', tool_bolts: 'bolts',
  tool_bandolier: 'greenpaw-bandolier', tool_alembic: 'glass-alembic',
  tool_spidersilk_net: 'fine-spidersilk-net', tool_fairwind_spices: 'fairwind-spices',
  tool_comb: 'fine-toothed-comb', tool_needles: 'knitting-needles',
  tool_instruments: 'instruments', tool_waxed_satchel: 'waxed-satchel',
  tool_stilts: 'stilts', tool_saddlebags: 'saddlebags'
};

const GUILD_SERVICES_DB = [
  { id: 'send_package', name: '소포 보내기 (Send Package)', cost: 2, places: 'Any Settlement or City', desc: '최대 무게 5의 실제 가방 물품을 다른 플레이어에게 보낼 의뢰로 기록합니다.' },
  { id: 'rug_wonders', name: '놀라운 양탄자 (Rug of Wonders)', cost: 1, places: 'Any Settlement or City', desc: '여정당 1회, 기본 희귀도 9 이하 영약재 부위 1개를 구입합니다.' },
  { id: 'news_trail', name: '길 위의 소식 (News From The Trail)', cost: 2, places: 'Any Settlement or City', desc: '목적지에 도착할 때까지 이동 조우를 한 번 2장 중 선택합니다.' },
  { id: 'smithing', name: '철공 개조 (Smithing)', cost: 3, places: 'Mountain Settlements', desc: '보유한 기본 도구 하나를 룰북 66쪽의 호환 업그레이드로 교체합니다.' },
  { id: 'forecast', name: '날씨 예보 (Forecast)', cost: 1, places: 'Bog Settlement', desc: '다음 3번 이동 동안 Weather 태그 채집 조우의 부정적 효과를 무시합니다.' },
  { id: 'shortcut', name: '숨은 지름길 (Shortcut)', cost: 2, places: 'Forest Settlement', desc: '안전한 숲길로 근처 위치까지 즉시 이동하고 지도 경로를 남깁니다.' },
  { id: 'hitch_ride', name: '농부 마차 얻어타기 (Hitch a Ride)', cost: 2, places: 'Meadow Settlement', desc: '초원 위치까지 최대 5경로 이동하고 이동 조우를 생략합니다.' },
  { id: 'catch_day_small', name: '오늘의 작은 물고기 (Catch of the Day)', cost: 1, places: 'Loch Settlement', desc: 'Small Fish 부위 1개를 얻습니다.' },
  { id: 'catch_day_big', name: '오늘의 큰 물고기 (Catch of the Day)', cost: 2, places: 'Loch Settlement', desc: 'Big Fish 부위 1개를 얻습니다.' },
  { id: 'take_clippings', name: '온실 꺾꽂이 (Take Clippings)', cost: 5, places: 'Glasswall', desc: '원하는 식물 영약재 부위 1개를 얻습니다.' },
  { id: 'taxi_service', name: '독수리 택시 (Taxi Service)', cost: 5, places: 'Summit', desc: '다음 이동을 Soar로 수행할 수 있고 Soar 부정 결과를 보호받습니다.' },
  { id: 'build_bridge', name: '다리 건설 (Build a Bridge)', cost: 8, places: 'Spoolkeep', desc: '두 위치 사이의 물길을 일반 경로로 기록합니다.' },
  { id: 'floodplain', name: '범람지 만들기 (Floodplain)', cost: 8, places: 'Newdam', desc: '야생 위치 하나를 다음 봄까지 Loch 지역으로 기록합니다.' },
  { id: 'survey_paths', name: '경로 측량 (Survey Paths)', cost: 10, places: 'Any City', desc: '지도에 새 경로를 추가합니다.' },
  { id: 'pick_deep', name: '깊은 곳의 수확 (Pick of the Deep)', cost: 2, places: 'Vessel', desc: '카드를 뽑아 값 이하의 티탄 영약재 1개를 얻습니다.' },
  { id: 'scare_tactics', name: '위협 제거 (Scare Tactics)', cost: 8, places: 'Odoak', desc: '지도 위 거대 야수/고분 효과 하나를 제거합니다.' },
  { id: 'retrieval', name: '회수 의뢰 (Retrieval)', cost: 5, places: 'Vessel', desc: '비-티탄 영약재나 잃어버린 물건 회수 의뢰를 기록하고 가방에 표시합니다.' },
  { id: 'send_missive', name: '전령 보내기 (Send a Missive)', cost: 3, places: 'Noonhill', desc: '정착지 최대 3곳을 지정해 도착 시 질병을 직접 선택할 수 있게 기록합니다.' }
];

const WAGON_UPGRADES_DB = [
  { id: 'baseUnit', name: '기본 마차 위탁 (Commission Wagon)', cost: 20, desc: '룰북 p.43: 가방 소지 한도 +4, 이동 속도 +1.', city: 'Any City' },
  { id: 'sealedCarriage', name: '밀폐식 마차와 돛 (Sealed Carriage & Sails)', cost: 10, desc: '마차 탑승 상태에서 영약재 분실 없이 수로 이동 및 정박 가능 (보트 재활용 시 5 할인).', city: 'Newdam' },
  { id: 'pedalMotor', name: '페달 모터 (Pedal Motor)', cost: 6, desc: '두 개의 연결된 수로를 단일 수로처럼 연달아 이동 가능.', city: 'Vessel' },
  { id: 'axelSprings', name: '차축 스프링 (Axel Springs)', cost: 7, desc: '마차가 제공하는 속도 보너스가 +1에서 +2로 상향됩니다.', city: 'Any City' },
  { id: 'sideBrackets', name: '측면 브래킷 (Side Brackets)', cost: 7, desc: '마차가 제공하는 소지 용량 보너스가 +4에서 +6으로 상향됩니다.', city: 'Any City' },
  { id: 'hiveBrackets', name: '벌집 브래킷 (Hive Brackets)', cost: 7, desc: '여정 도중 동반자를 최대 2마리까지 동행할 수 있습니다.', city: 'Odoak' },
  { id: 'passengerBooth', name: '조수석 부스', cost: 20, desc: '이동 중 승객을 동승시킬 수 있으며, 승객이 임시 길동무 역할을 수행합니다.', city: 'Summit' },
  { id: 'shadowCanvas', name: '그림자 캔버스 (Shadow Canvas)', cost: 5, desc: '정착지 진입 시 인형극을 열어 길드 명성을 +1 얻습니다.', city: 'Spoolkeep' },
  { id: 'experimentalContraption', name: '비행 기구 개조 (Experimental Balloon)', cost: 20, desc: '비행(Soar) 이동이 가능해지지만, 비행 이동 시 일정이 3일 소모됩니다.', city: 'Glasswall' },
  { id: 'clayPots', name: '이식용 진흙 화분 (Clay Pots)', cost: 5, desc: '마차 안에서 식물 약재 1종을 직접 재배하여 이동 2회당 1회씩 수확할 수 있습니다.', city: 'Noonhill' }
];

const COMPANIONS_DB = [
  { id: 'cranky_contraption', name: '성질 고약한 기계장치 (Cranky Contraption)', cost: 3, region: 'Titan', desc: '거수(Behemoth) 조우 중 자신을 희생해 부정적 결과를 피하고 탈출합니다.' },
  { id: 'cricket', name: '귀뚜라미 (Cricket)', cost: 6, region: 'Bog, Forest', desc: '악기 도구로 공연할 때 추가 악기이자 연주할 발 한 쌍으로 계산됩니다.' },
  { id: 'beetle', name: '딱정벌레 (Beetle)', cost: 5, region: 'Meadow, Mountain', desc: '여정당 1회, 맹수(Beast) 조우의 부정적 효과를 무시합니다.' },
  { id: 'caterpillar', name: '애벌레 (Caterpillar)', cost: 3, region: 'Bog, Forest', desc: '가벼운/중간 질병 타이머 시작 시 +1시간. 1시즌 후 나비로 탈바꿈합니다.' },
  { id: 'butterfly', name: '나비 (Butterfly)', cost: 12, region: 'Bog, Meadow', desc: '봄/여름 채집 시, 식물 약재의 희귀도를 1만큼 감소시킵니다.' },
  { id: 'honeybee', name: '꿀벌 (Honeybee)', cost: 8, region: 'Forest, Meadow', desc: '10경로를 이동할 때마다 벌집(꿀) 약재 1개를 생성합니다.' },
  { id: 'spider', name: '거미 (Spider)', cost: 7, region: 'Bog, Mountain', desc: '채집 시 곤충 약재의 희귀도를 1만큼 감소시킵니다.' },
  { id: 'pond_skimmer', name: '소금쟁이 (Pond Skimmer)', cost: 6, region: 'Loch', desc: '여정당 1회, 호수(Loch) 조우 카드를 다시 드로우합니다.' },
  { id: 'wasp', name: '말벌 (Wasp)', cost: 8, region: 'Forest, Mountain', desc: '10경로를 이동할 때마다 곤충 약재 1개를 수렵해 옵니다.' }
];

const isToolAvailableAtLocation = (tool: any, s: GameState, bypass: boolean = false) => {
  if (bypass) return true;
  const places = String(tool.places || '');
  if (places === 'Any') return s.currentLocationType === 'Settlement' || s.currentLocationType === 'City';
  if (['Odoak', 'Noonhill', 'Spoolkeep', 'Glasswall', 'Summit', 'Vessel', 'Newdam'].some(city => places.includes(city) && s.currentLocationName === city)) {
    return true;
  }
  if (!places.includes('Settlements') || s.currentLocationType !== 'Settlement') return false;
  const normalized = places.replace('Meadows', 'Meadow');
  return ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'].some(region => normalized.includes(region) && s.currentRegion === region);
};

const isGuildServiceAvailableAtLocation = (service: any, s: GameState, bypass: boolean = false) => {
  if (bypass) return true;
  const places = String(service.places || '');
  const isSettlementOrCity = s.currentLocationType === 'Settlement' || s.currentLocationType === 'City';
  if (places === 'Any Settlement or City') return isSettlementOrCity;
  if (places === 'Any City') return s.currentLocationType === 'City';
  if (places.includes('Settlement') && s.currentLocationType !== 'Settlement') return false;
  if (places.includes('City') && s.currentLocationType !== 'City') return false;
  if (['Glasswall', 'Summit', 'Spoolkeep', 'Newdam', 'Vessel', 'Odoak', 'Noonhill'].some(city => places.includes(city) && s.currentLocationName === city)) return true;
  return ['Bog', 'Forest', 'Meadow', 'Loch', 'Mountain'].some(region => places.includes(region) && s.currentRegion === region);
};

export default function App() {
  const [storedState, setState] = useState<GameState | null>(null);
  const state = storedState ? withCanonicalPatientView(storedState) : null;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JournalTab>('play');
  const [highlightedPatientId, setHighlightedPatientId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showCloudSlots, setShowCloudSlots] = useState(false);
  const [cloudSlotViews, setCloudSlotViews] = useState<CloudSlotView[]>(emptyCloudSlotViews);
  const [cloudSlotBusy, setCloudSlotBusy] = useState(false);
  const [activeCloudSlot, setActiveCloudSlot] = useState<CloudSlotId>(() => readActiveCloudSlot());
  const [activeTravelEncounter, setActiveTravelEncounter] = useState<any | null>(null);
  const [deferredEncounterId, setDeferredEncounterId] = useState<string | null>(null);
  const [activeForageEncounter, setActiveForageEncounter] = useState<any | null>(null);
  const [controlledPrompt, setControlledPrompt] = useState<ControlledPromptRequest | null>(null);
  const [controlledPromptValue, setControlledPromptValue] = useState('');
  const [controlledPromptResolver, setControlledPromptResolver] = useState<((value: string | null) => void) | null>(null);
  const [noticeQueue, setNoticeQueue] = useState<string[]>([]);
  const [rulebookRequest, setRulebookRequest] = useState<RulebookReferenceRequest | null>(null);
  const [pendingMapTravel, setPendingMapTravel] = useState<MapPickLocation | null>(null);
  const [saveLoadError, setSaveLoadError] = useState<string | null>(null);

  const requestControlledPrompt = useCallback((request: ControlledPromptRequest) => new Promise<string | null>(resolve => {
    setControlledPromptResolver(() => resolve);
    setControlledPromptValue(request.defaultValue);
    setControlledPrompt(request);
  }), []);

  const closeControlledPrompt = useCallback((value: string | null) => {
    const resolve = controlledPromptResolver;
    setControlledPromptResolver(null);
    setControlledPrompt(null);
    resolve?.(value);
  }, [controlledPromptResolver]);

  useEffect(() => {
    const handleNotice = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (message) setNoticeQueue(queue => [...queue, message]);
    };

    window.addEventListener(APP_NOTICE_EVENT, handleNotice);
    return () => window.removeEventListener(APP_NOTICE_EVENT, handleNotice);
  }, []);

  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth).catch(error => {
      console.error('Google redirect sign-in error:', error);
      showAlert(googleSignInErrorMessage(error));
    });
  }, []);

  const dismissNotice = useCallback(() => {
    setNoticeQueue(queue => queue.slice(1));
  }, []);

  // Seasoned & Titanwise familiar benefit states
  const [seasonedDraws, setSeasonedDraws] = useState<Array<{ suit: string; val: number }>>([]);
  const [showSeasonedModal, setShowSeasonedModal] = useState(false);
  const [titanwiseDraws, setTitanwiseDraws] = useState<Array<{ suit: string; val: number }>>([]);
  const [showTitanwiseModal, setShowTitanwiseModal] = useState(false);

  const [barterJournalNote, setBarterJournalNote] = useState("");
  const [barterPaymentTrinkets, setBarterPaymentTrinkets] = useState(0);
  const [rumourCards, setRumourCards] = useState<{ suit: string; val: string; text?: string }[]>([]);

  const changeActiveTab = (tab: JournalTab) => {
    setActiveTab(tab);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  };
  const [rumourBarrowName, setRumourBarrowName] = useState("");
  const [rumourLocName, setRumourLocName] = useState("");
  const [selectedToolToUpgrade, setSelectedToolToUpgrade] = useState("");
  const [selectedUpgradeOption, setSelectedUpgradeOption] = useState("");
  const [bypassShopRules, setBypassShopRules] = useState(false);

  // Succession states
  const [showSuccessionModal, setShowSuccessionModal] = useState(false);
  const [retiredApothecaryName, setRetiredApothecaryName] = useState("");
  const [clinicsBuiltCount, setClinicsBuiltCount] = useState(0);
  const [searchReagent, setSearchReagent] = useState("");
  const [searchAilment, setSearchAilment] = useState("");
  const [reagentFilter, setReagentFilter] = useState("");
  const [reagentTypeFilter, setReagentTypeFilter] = useState("");
  const [ailmentFilter, setAilmentFilter] = useState("");

  // Preload card & map images for zero-latency display
  useEffect(() => {
    const suits = ["HEART", "DIAMOND", "CLUB", "SPADE"];
    const values = [
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
      "11-JACK", "12-QUEEN", "13-KING"
    ];
    suits.forEach(suit => {
      values.forEach(val => {
        const img = new Image();
        img.src = `/cards/${suit}-${val}.svg`;
      });
    });
  }, []);

  // Listen to Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDocRef = doc(db!, 'saves', `uid_${u.uid}`);
          const snap = await getDoc(userDocRef);
          const cloudData = snap.exists() ? snap.data() : null;
          const documentUpdatedAt = snap.exists()
            ? snapshotUpdatedAt(snap) || await fetchCloudDocumentUpdatedAt(u.uid)
            : null;
          const slots = readCloudSlotsFromDocument(cloudData as Record<string, unknown> | null, documentUpdatedAt);
          setCloudSlotViews(slots.views);
          if (slots.migratedFromLegacy && slots.records[0]) {
            await writeCloudSlotRecord(slots.records[0]);
          }
          const slot1 = slots.records[0];
          const cloudPayload = slot1?.payload ?? (typeof cloudData?.[CAMPAIGN_SAVE_KEY] === 'string' ? cloudData[CAMPAIGN_SAVE_KEY] : null);
          if (cloudPayload) {
              const parsed = JSON.parse(cloudPayload);
              const localStr = localStorage.getItem(CAMPAIGN_SAVE_KEY);
              if (localStr) {
                const localParsed = parseCampaignSaveRaw(localStr);
                const localRevision = Number(
                  localParsed.ok && localParsed.value && typeof localParsed.value === 'object'
                    ? (localParsed.value as { saveRevision?: number }).saveRevision || 0
                    : 0
                );
                const cloudRevision = Number((parsed as { saveRevision?: number }).saveRevision || 0);
                const cloudHasNamedApothecary = campaignSaveHasNamedApothecary(parsed);
                const action = decideCloudSaveAction({
                  localRaw: localStr,
                  cloudRevision,
                  cloudHasNamedApothecary,
                  confirmOverwrite: () => askWindowConfirm(
                    cloudRevision > localRevision
                      ? '클라우드 기록이 더 최근입니다. 지금 기기의 로컬 기록을 덮어쓸까요?'
                      : '구글 클라우드에 백업된 아포테카리아 데이터를 발견했습니다. 불러오시겠습니까?\n(불러오면 현재 진행 중인 로컬 데이터는 덮어씌워집니다.)'
                  )
                });
                if (action === 'load-cloud') {
                  const migrated = migrateCampaignSave(parsed);
                  if (!migrated.ok) {
                    showAlert('클라우드 저장을 올리지 못했습니다. 로컬 기록은 그대로 둡니다.');
                  } else {
                    setState(migrated.state);
                    localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(migrated.state));
                    writeActiveCloudSlot(1);
                    setActiveCloudSlot(1);
                    const name = migrated.state.bio?.name?.trim();
                    showAlert(name ? `${name} 약제사 기록을 불러왔습니다.` : '클라우드 기록을 불러왔습니다.');
                  }
                } else if (action === 'upload-local') {
                  const uploaded = cloudSlotRecordFromPayload(1, localStr, new Date().toISOString());
                  await writeCloudSlotRecord(uploaded);
                  setCloudSlotViews(readCloudSlotsFromDocument({
                    [CAMPAIGN_SAVE_KEY]: localStr,
                    ...assembleNewCloudSlotDocument(uploaded)
                  }, uploaded.uploadedAt).views);
                }
              } else {
                const migrated = migrateCampaignSave(parsed);
                if (!migrated.ok) {
                  showAlert('클라우드 저장을 올리지 못했습니다. 로컬 기록은 그대로 둡니다.');
                } else {
                  setState(migrated.state);
                  localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(migrated.state));
                  writeActiveCloudSlot(1);
                  setActiveCloudSlot(1);
                  const name = migrated.state.bio?.name?.trim();
                  showAlert(name ? `${name} 약제사 기록을 불러왔습니다.` : '클라우드 기록을 불러왔습니다.');
                }
              }
          } else {
            const localStr = localStorage.getItem(CAMPAIGN_SAVE_KEY);
            const localParsed = parseCampaignSaveRaw(localStr);
            const localHasName = localParsed.ok && campaignSaveHasNamedApothecary(localParsed.value);
            if (localStr && localHasName) {
              await writeCloudSlotRecord(cloudSlotRecordFromPayload(1, localStr, new Date().toISOString()));
              setCloudSlotViews(readCloudSlotsFromDocument({
                [CAMPAIGN_SAVE_KEY]: localStr
              }, new Date().toISOString()).views);
            } else {
              showAlert('이 구글 계정에는 저장된 약제사가 없습니다. 원래 기기에서 같은 계정으로 로그인한 뒤 ‘클라우드 기록’에서 올려 주세요.');
            }
          }
        } catch (err) {
          console.error("Failed to check cloud save during login:", err);
          showAlert('구글 기록을 불러오지 못했습니다. 네트워크와 로그인 계정을 확인한 뒤 다시 시도해 주세요.');
        }
      }
    });
    return unsubscribe;
  }, []);

  // Load initial state
  useEffect(() => {
    const loadSave = async () => {
      const failLoad = (message: string) => {
        setSaveLoadError(message);
        showAlert(`${message} 원본을 내보낸 뒤 다시 시도하세요.`);
      };
      const raw = localStorage.getItem(CAMPAIGN_SAVE_KEY);
      if (raw) {
        const parsed = parseCampaignSaveRaw(raw);
        if (!parsed.ok) {
          failLoad('저장 파일이 손상되어 열 수 없습니다. 기존 기록은 지우지 않았습니다.');
          setLoading(false);
          return;
        }
        const migrated = migrateCampaignSave(parsed.value);
        if (!migrated.ok) {
          failLoad('저장 데이터를 올리지 못했습니다. 기존 기록은 디스크에서 지우지 않았습니다.');
          setLoading(false);
          return;
        }
        setState(migrated.state);
        setSaveLoadError(null);
        setLoading(false);
        return;
      }
      const loaded = await store.load(CAMPAIGN_SAVE_KEY, null);
      if (loaded) {
        const migrated = migrateCampaignSave(loaded);
        if (migrated.ok) {
          setState(migrated.state);
          setSaveLoadError(null);
        } else {
          failLoad('저장 데이터를 올리지 못했습니다. 기존 기록은 디스크에서 지우지 않았습니다.');
        }
      } else {
        setState(syncWorldMemory(INITIAL_STATE));
      }
      setLoading(false);
    };
    loadSave();
  }, []);

  useEffect(() => {
    if (!state?.pendingEncounter || activeTravelEncounter || deferredEncounterId === state.pendingEncounter.transactionId) return;
    const pending = state.pendingEncounter;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setActiveTravelEncounter({
        ...pending.encounter,
        page: pending.encounter.sourcePage,
        text: `${pending.ignoreNegativeEncounterEffects ? '[보호 적용] 이 조우의 모든 부정적 결과를 적용하지 않습니다.\n\n' : ''}${pending.encounter.prompt}`,
        cardValue: cardDisplayValue(pending.card.value),
        suit: pending.card.suit || '♥',
        suitLabel: suitLabels[pending.card.suit || '♥'] || pending.card.suit || '',
        region: pending.encounter.region,
        locName: state.currentLocationName,
        transactionId: pending.transactionId,
        selectedChoiceId: pending.selectedChoiceId
      });
    });
    return () => { cancelled = true; };
  }, [state?.pendingEncounter, state?.currentLocationName, activeTravelEncounter, deferredEncounterId]);

  useEffect(() => {
    if (!state?.pendingForaging || activeForageEncounter) return;
    const pending = state.pendingForaging;
    const result = resolveForaging({
      transactionId: pending.transactionId,
      state: {
        season: state.currentSeason,
        currentRegion: (state.currentRegion === 'Barrow' ? 'Titan' : state.currentRegion) as Exclude<TravelRegion, 'Soar'>,
        currentLocationType: canonicalLocationType(state.currentLocationType),
        adjacentRegions: adjacentRuleRegions(state),
        foragingPoints: state.activeAilment?.foragingPoints || 0,
        inventory: toEngineInventory(state.bag),
        toolIds: canonicalToolsFromState(state).filter(tool => !tool.broken && !tool.consumed).map(tool => tool.toolId),
        tools: canonicalToolsFromState(state),
        patient: getActivePatient(state),
        conditions: state.manualConditions || []
      },
      forageRegion: pending.region,
      locationRelation: pending.locationRelation,
      card: pending.card,
      reagentTypeFilter: pending.reagentTypeFilter,
      source: pending.source,
      ...canonicalForagingModifiers(state),
      weatherProtectionActive: pending.ignoreNegativeEncounterEffects || state.forecastActiveAtLocation
    });
    if (!result.value) return;
    const encounter = result.value.encounter;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setActiveForageEncounter({
        ...(encounter || {}),
        title: encounter?.title || '채집',
        text: `${result.value!.ignoredNegativeEncounterEffects ? '[Forecast] Weather 태그 조우의 모든 부정적 효과를 무시합니다.\n\n' : ''}${encounter?.prompt || ''}`,
        ignoredNegativeEncounterEffects: result.value!.ignoredNegativeEncounterEffects,
        page: encounter?.sourcePage || 152,
        cardValue: cardDisplayValue(pending.card.value), suitLabel: suitLabels[pending.card.suit || '♥'], suit: pending.card.suit || '♥',
        foundReagents: result.value!.candidates.map(candidate => ({
          name: candidate.canonicalName, reagentId: candidate.reagentId, rarity: candidate.rarity,
          fpAvailable: candidate.automaticWithForagingPoints, gapCost: candidate.gapCost, cardSuccess: candidate.cardSuccess
        })),
        region: pending.region, season: state.currentSeason,
        timerBaseCost: pending.locationRelation === 'adjacent' ? 2 : 1,
        gatheredPartCount: 0, selectedReagentId: pending.selectedReagentId,
        transactionId: pending.transactionId
      });
    });
    return () => { cancelled = true; };
  }, [state, activeForageEncounter]);

  // Auto-save wrapper
  const updateState = (updater: (prev: GameState) => GameState) => {
    setState(prev => {
      if (!prev) return prev;
      let next = updater(withCanonicalPatientView(prev));
      next = {
        ...withoutLegacyPatientWrite(next),
        schemaVersion: CURRENT_SCHEMA_VERSION,
        saveRevision: (prev.saveRevision || 0) + 1
      };
      next = syncWorldMemory(next);

      store.set(CAMPAIGN_SAVE_KEY, next);
      return next;
    });
  };

  const openPendingWaspForage = useEffectEvent(() => {
    updateState(s => {
      const companions = (s.companionStates || []) as CompanionState[];
      const hasWaspDraw = companions.some(row => row.companionId === 'wasp' && (row.pendingForageDraws || 0) > 0);
      if (!hasWaspDraw || s.pendingEncounter || s.pendingForaging || s.currentRegion === 'Soar') return s;
      const card = drawPlayingCard();
      const transactionId = `companion-wasp-forage:${Date.now()}`;
      const consumed = resolveCompanionForageDraw({ transactionId, state: toMobilityRuntime(s) });
      if (!consumed.value) return s;
      const next = applyMobilityRuntime(s, consumed.value);
      return {
        ...next,
        pendingForaging: {
          transactionId,
          region: (s.currentRegion === 'Barrow' ? 'Titan' : s.currentRegion) as Exclude<TravelRegion, 'Soar'>,
          locationRelation: 'current',
          card,
          timerCostAfterEncounter: 1,
          encounterId: null,
          phase: 'choose-reagent',
          reagentTypeFilter: 'INSECT',
          source: 'companion-wasp'
        },
        journals: [{
          id: `${transactionId}:draw`, title: '말벌 동료 채집 카드',
          text: `10경로 보상으로 ${card.suit} ${cardDisplayValue(card.value)}를 뽑았습니다. 곤충 영약재만 선택할 수 있습니다.`, timestamp: Date.now()
        }, ...next.journals]
      };
    });
  });

  useEffect(() => {
    const hasPendingWaspDraw = ((state?.companionStates || []) as CompanionState[])
      .some(row => row.companionId === 'wasp' && (row.pendingForageDraws || 0) > 0);
    if (!state || state.pendingEncounter || state.pendingForaging || state.currentRegion === 'Soar' || !hasPendingWaspDraw) return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) openPendingWaspForage(); });
    return () => { cancelled = true; };
  }, [state]);

  const handleBarterProgressToDeal = async () => {
    if (!state?.pendingBarter) return;
    const patient = state.patients.find(row => row.id === state.pendingBarter?.patientId);
    if (!patient) return;
    let runtime = toBarterRuntime(state, patient);
    const pending = runtime.pendingBarter;
    if (pending?.status === 'manual-social' && pending.socialEncounter && pending.firstCard) {
      const encounter = pending.socialEncounter;
      const socialChoices = encounter.choices || [];
      let selectedChoiceId = socialChoices.length === 1 ? socialChoices[0].id : undefined;
      if (socialChoices.length > 1) {
        const picked = await requestControlledPrompt({
          title: encounter.title,
          message: encounter.prompt,
          defaultValue: socialChoices[0].id,
          kicker: `사교 조우 · p.${encounter.sourcePage}`,
          options: socialChoices.map(choice => ({ value: choice.id, label: choice.label }))
        });
        if (picked === null) return;
        selectedChoiceId = picked;
      }
      if (selectedChoiceId) {
        const executed = resolveEncounter({
          transactionId: `${pending.barterId}:social-choice`,
          encounter,
          choiceId: selectedChoiceId,
          state: {
            reputation: state.reputation,
            trinkets: state.trinkets.length,
            calendarDays: state.calendarDays,
            foragingPoints: state.activeAilment?.foragingPoints || 0,
            inventory: toEngineInventory(state.bag),
            patient,
            movementBlocked: Boolean(state.needsLocalHelpBeforeMove),
            conditions: state.manualConditions || [],
            appliedEffectIds: state.appliedEncounterEffectIds
          }
        });
        if (!executed.value) {
          showAlert(executed.messages.join('\n'));
          return;
        }
        const leftover = executed.value.unresolvedEffects.length > 0;
        updateState(s => {
          const runtimeState = executed.value!.nextState;
          const patients = runtimeState.patient
            ? s.patients.map(row => row.id === runtimeState.patient!.id
              ? { ...runtimeState.patient!, foragingPoints: runtimeState.foragingPoints }
              : row)
            : s.patients;
          let next: GameState = {
            ...s,
            reputation: runtimeState.reputation,
            trinkets: Array.from({ length: runtimeState.trinkets }, (_, index) => s.trinkets[index] || '사교 조우 장신구'),
            calendarDays: runtimeState.calendarDays,
            bag: fromEngineInventory(runtimeState.inventory, s.bag),
            patients,
            appliedEncounterEffectIds: runtimeState.appliedEffectIds,
            manualConditions: remapEncounterConditions(runtimeState.conditions, s)
          };
          if (leftover) {
            const draft = createPrintedManualDraft(encounter.id, 'encounter', {
              encounterTransactionId: `${pending.barterId}:social`,
              barterId: pending.barterId,
              patientId: patient.id,
              locationId: pending.locationId,
              continuation: 'barter-social'
            });
            next = enqueueManualDrafts(next, [draft]);
          }
          return next;
        });
        if (leftover) {
          showAlert('인쇄된 사교 효과를 적용했습니다. 남은 서술 판정을 마친 뒤 두 번째 카드를 뽑을 수 있습니다.');
          return;
        }
        runtime = toBarterRuntime({
          ...state,
          reputation: executed.value.nextState.reputation,
          trinkets: Array.from({ length: executed.value.nextState.trinkets }, (_, index) => state.trinkets[index] || '사교 조우 장신구'),
          calendarDays: executed.value.nextState.calendarDays,
          bag: fromEngineInventory(executed.value.nextState.inventory, state.bag),
          patients: executed.value.nextState.patient
            ? state.patients.map(row => row.id === executed.value!.nextState.patient!.id
              ? { ...executed.value!.nextState.patient!, foragingPoints: executed.value!.nextState.foragingPoints }
              : row)
            : state.patients,
          appliedEncounterEffectIds: executed.value.nextState.appliedEffectIds,
          manualConditions: remapEncounterConditions(executed.value.nextState.conditions, state)
        }, patient);
      } else {
        const savedDraft = state.manualEffectQueue.find(draft => draft.context.barterId === pending.barterId);
        const draft = savedDraft || createPrintedManualDraft(pending.socialEncounter.id, 'encounter', {
          encounterTransactionId: `${pending.barterId}:social`,
          barterId: pending.barterId,
          patientId: patient.id,
          locationId: pending.locationId,
          continuation: 'barter-social'
        });
        if (draft) updateState(s => enqueueManualDrafts(s, [draft]));
        showAlert('사교 조우의 직접 판정을 먼저 완료해야 두 번째 카드를 뽑을 수 있습니다.');
        return;
      }
      const confirmed = resolveBarterEncounter({
        transactionId: `${pending.barterId}:social-confirm`,
        state: runtime,
        card: pending.firstCard,
        encounter,
        manualConfirmed: true
      });
      if (!confirmed.value) {
        showAlert(confirmed.messages.join('\n'));
        return;
      }
      runtime = confirmed.value;
      updateState((s: GameState) => applyBarterRuntime(s, confirmed.value!));
    }
    if (runtime.pendingBarter?.status !== 'awaiting-second-card') {
      showAlert('사교 조우를 먼저 해결해야 합니다.');
      return;
    }
    const gossip = runtime.inventory.find(item => item.guildNote?.kind === 'gossip');
    if (gossip && askWindowConfirm('흥미로운 소문을 버리고 이 영약재를 자동으로 받을까요?')) {
      const transactionId = `${runtime.pendingBarter.barterId}:gossip`;
      const gossipResult = resolveBarterGossip({ transactionId, state: runtime, gossipItemId: gossip.id });
      if (!gossipResult.value) {
        showAlert(gossipResult.messages.join('\n'));
        return;
      }
      updateState((s: GameState) => commitPendingAlternativeAcquisition(applyBarterRuntime(s, gossipResult.value!), 'barter', transactionId));
      setBarterJournalNote('');
      setBarterPaymentTrinkets(0);
      showAlert('흥미로운 소문을 건네고 선택한 영약재를 받았습니다.');
      return;
    }
    const dealCard = drawPlayingCard();
    const offer = resolveBarterOffer({
      transactionId: `${runtime.pendingBarter.barterId}:offer`,
      state: runtime,
      card: dealCard
    });
    if (!offer.value) {
      showAlert(offer.messages.join('\n'));
      return;
    }
    updateState((s: GameState) => {
      const next = applyBarterRuntime(s, offer.value!);
      return barterJournalNote.trim()
        ? { ...next, journals: [{ id: `${runtime.pendingBarter!.barterId}:social-note`, title: '사교 조우 기록', text: barterJournalNote.trim(), timestamp: Date.now() }, ...next.journals] }
        : next;
    });
    setBarterPaymentTrinkets(0);
  };

  const handleBarterFinalize = (isSuccess: boolean, paidTrinketsCount: number = 0, paidReputationCount: number = 0) => {
    if (!state?.pendingBarter) return;
    const patient = state.patients.find(row => row.id === state.pendingBarter?.patientId);
    if (!patient) return;
    const runtime = toBarterRuntime(state, patient);
    const transactionId = `${state.pendingBarter.barterId}:${isSuccess ? 'payment' : 'leave'}`;
    const result = isSuccess
      ? resolveBarterPayment({ transactionId, state: runtime, payment: { trinkets: paidTrinketsCount, reputation: paidReputationCount } })
      : resolveBarterLeave({ transactionId, state: runtime });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState((s: GameState) => {
      const next = applyBarterRuntime(s, result.value!);
      return isSuccess ? commitPendingAlternativeAcquisition(next, 'barter', transactionId) : next;
    });
    setBarterJournalNote("");
    setBarterPaymentTrinkets(0);
    showAlert(isSuccess ? "거래가 완료되어 선택한 조제 부위가 가방에 추가되었습니다." : "거래를 중단해 모든 활성 타이머가 1 감소했습니다.");
  };

  const handleRetireClick = () => {
    if (!state) return;
    if (!isHouseRuleEnabled(state.rulesetId, 'legacySuccession')) {
      showAlert('현재 original-1e-3p ruleset에서는 Legacy Succession이 비활성화되어 있습니다.');
      return;
    }
    if (!askWindowConfirm('현재 캐릭터를 은퇴시키겠습니까? (세이브 데이터의 클리닉 네트워크와 약전 처방이 다음 세대로 상속됩니다)')) {
      return;
    }
    setRetiredApothecaryName(state.bio.name || "이름 없는 약제사");
    setClinicsBuiltCount(state.clinics?.length || 0);
    setShowSuccessionModal(true);
  };

  const handleSuccessionConfirm = (inheritanceOption: 'sickle' | 'reputation' | 'trinkets') => {
    if (!state) return;

    const currentClinics = state.clinics || [];
    const archivedClinics = currentClinics.map(c => ({
      locationName: c.locationName,
      region: c.region,
      services: c.agendaService && c.agendaService !== 'none' ? [c.agendaService] : [],
      founder: retiredApothecaryName
    }));

    const legacyScore = (state.reputation || 0) + (currentClinics.length * 10) + (state.trinkets?.length || 0);

    const retiredRecord = {
      name: retiredApothecaryName,
      ageOfRetirement: state.cumulativeDays || 0,
      clinicsBuilt: currentClinics.length,
      legacyScore: legacyScore
    };

    updateState(s => {
      const nextState: GameState = {
        ...INITIAL_STATE,
        rulebookEdition: s.rulebookEdition,
        rulesetId: s.rulesetId,
        legacyClinics: [...(s.legacyClinics || []), ...archivedClinics],
        legacyApothecaries: [...(s.legacyApothecaries || []), retiredRecord],
        discoveredRecipes: s.discoveredRecipes || {},
        journeyChronicles: s.journeyChronicles || [],
        patientCasebook: s.patientCasebook || [],
        worldAlmanac: s.worldAlmanac || [],
        travelScrapbook: s.travelScrapbook || []
      };

      if (inheritanceOption === 'sickle') {
        const itemSilverSickle: BagItem = {
          id: 'tool_silver_sickle_' + Date.now(),
          name: '은빛 낫 (Silver Sickle - 업그레이드)',
          weight: 2/3,
          type: 'tool',
          qty: 1,
          preps: '은빛 낫 (Silver Sickle - 칼 업그레이드, 무게 2/3, 채집 점수 +1)'
        };
        nextState.bag = [...INITIAL_BAG, itemSilverSickle];
      } else if (inheritanceOption === 'reputation') {
        nextState.reputation = 10;
      } else if (inheritanceOption === 'trinkets') {
        nextState.trinkets = Array(8).fill("🪙 장신구");
      }

      return nextState;
    });

    setShowSuccessionModal(false);
    showAlert(`🌅 [대승계 완료]\n\n${retiredApothecaryName} 약제사가 은퇴하고 명예의 전당에 헌액되었습니다.\n새로운 약제사가 스승의 유산을 물려받고 방랑을 시작합니다!`);
  };

  const handleLegacyClinicRest = () => {
    if (!state) return;
    if (state.rulesetId !== 'legacy-campaign') return;
    if (state.legacyRestUsedThisLocation) {
      showAlert("이미 이 구역의 선배 진료소에서 충분히 쉬고 물자를 보급받았습니다.");
      return;
    }

    updateState(s => {
      let nextActiveAilment = s.activeAilment;
      if (nextActiveAilment) {
        nextActiveAilment = {
          ...nextActiveAilment,
          timer: nextActiveAilment.timer + 1
        };
      }

      let nextPursued = s.pursuedByBehemoth;
      if (nextPursued) {
        nextPursued = {
          ...nextPursued,
          headStart: nextPursued.headStart + 1
        };
      }

      const commonReagents = REAGENTS.filter(r => r.baseRarity <= 4).map(reagentDisplayRecord);
      const randomReagent = commonReagents[Math.floor(Math.random() * commonReagents.length)];
      const firstPart = randomReagent.preps.split(']')[0] ? randomReagent.preps.split(']')[0] + ']' : '영약재 부위';
      const itemGift: BagItem = {
        id: 'legacy_gift_' + Date.now(),
        name: `${randomReagent.name} (부위: ${firstPart})`,
        weight: 1/3,
        type: 'reagent',
        qty: 1,
        preps: randomReagent.preps
      };

      return {
        ...s,
        activeAilment: nextActiveAilment,
        pursuedByBehemoth: nextPursued,
        bag: [...s.bag, itemGift],
        legacyRestUsedThisLocation: true,
        journals: [
          {
            id: 'legacy_rest_' + Date.now(),
            title: `🏡 선배의 진료소 거점 휴식`,
            text: `${s.currentLocationName}에 남겨진 선배 약제사의 옛 진료소에서 안전하게 머무르며 휴식을 취했습니다. 옛 보관함에서 [${randomReagent.name}]을(를) 보급받고 기운을 차렸습니다. (환자 치료 시간 +1시간 및 거수 선행거리 +1 획득)`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    showAlert("🏡 선배의 진료소 휴식 완료!\n\n- 환자 치료 타이머 +1시간 확보\n- 거수 추격 선행거리 +1칸 벌어짐\n- 무작위 보급 약재 1개 획득!");
  };

  const handleFamiliarSpendTime = () => {
    if (!state) return;
    if ((state.familiarTrust || 0) >= 100) {
      showAlert("길동무와의 친밀도가 이미 최대치(100%)입니다! 더할 나위 없이 끈끈한 유대감을 느끼고 있습니다.");
      return;
    }

    updateState(s => {
      const nextTrust = Math.min(100, (s.familiarTrust || 0) + 5);
      const nextDays = s.calendarDays + 1;
      const nextCumulative = s.cumulativeDays + 1;
      const timestamp = Date.now();
      const memory = `${formatDateTime(timestamp)} / ${s.currentLocationName}: 하루를 함께 보내며 친밀도 ${(s.familiarTrust || 0)}%에서 ${nextTrust}%로 깊어졌다.`;

      return {
        ...s,
        familiarTrust: nextTrust,
        familiarMemories: [memory, ...(s.familiarMemories || [])],
        calendarDays: nextDays,
        cumulativeDays: nextCumulative,
        journals: [
          {
            id: 'familiar_bond_' + timestamp,
            title: `🐾 길동무 교감: 시간 보내기`,
            text: `하루 동안 길동무와 숲속을 산책하고 털을 빗겨주며 따뜻한 교감을 나눴습니다.\n- 친밀도: ${(s.familiarTrust || 0)}% → ${nextTrust}%\n- 달력 일정 +1일 소모`,
            timestamp
          },
          ...s.journals
        ]
      };
    });

    showAlert("🐾 길동무와 따뜻한 시간을 보냈습니다. 친밀도가 5% 상승하고, 일정 1일이 경과했습니다.");
  };

  const handleFamiliarFeedReagent = (reagentItemId: string) => {
    if (!state) return;
    if ((state.familiarTrust || 0) >= 100) {
      showAlert("길동무와의 친밀도가 이미 최대치(100%)입니다!");
      return;
    }
    const foundItem = state.bag.find(item => item.id === reagentItemId);
    if (!foundItem) return;

    updateState(s => {
      const nextBag = s.bag.filter(item => item.id !== reagentItemId);
      const nextTrust = Math.min(100, (s.familiarTrust || 0) + 15);
      const timestamp = Date.now();
      const memory = `${formatDateTime(timestamp)} / ${s.currentLocationName}: ${foundItem.name}을(를) 나눠 먹고 친밀도 ${(s.familiarTrust || 0)}%에서 ${nextTrust}%로 올랐다.`;

      return {
        ...s,
        bag: nextBag,
        familiarTrust: nextTrust,
        familiarMemories: [memory, ...(s.familiarMemories || [])],
        journals: [
          {
            id: 'familiar_feed_' + timestamp,
            title: `🐾 길동무 교감: 맛있는 약재 간식`,
            text: `가방에서 맛있는 약재 [${foundItem.name}]을(를) 꺼내 길동무에게 간식으로 챙겨주었습니다. 길동무가 기쁘게 받아먹으며 꼬리를 흔들었습니다.\n- 친밀도: ${(s.familiarTrust || 0)}% → ${nextTrust}%\n- 약재 소비: ${foundItem.name}`,
            timestamp
          },
          ...s.journals
        ]
      };
    });

    showAlert(`🐾 길동무에게 [${foundItem.name}]을(를) 간식으로 주었습니다. 친밀도가 15% 상승했습니다!`);
  };

  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      if (shouldUseRedirectSignIn()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Google Sign-in error:", e);
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError: any) {
          showAlert(googleSignInErrorMessage(redirectError));
          return;
        }
      }
      showAlert(googleSignInErrorMessage(e));
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    if (askWindowConfirm("로그아웃 하시겠습니까?")) {
      try {
        await signOut(auth);
        setShowCloudSlots(false);
        setCloudSlotViews(emptyCloudSlotViews());
        const loaded = await store.load(CAMPAIGN_SAVE_KEY, null);
        if (loaded) {
          const migrated = migrateCampaignSave(loaded);
          if (migrated.ok) setState(migrated.state);
          else showAlert('저장 데이터를 올리지 못했습니다. 기존 기록은 지우지 않았습니다.');
        } else {
          setState(syncWorldMemory(INITIAL_STATE));
        }
      } catch (e: any) {
        console.error("Sign-out error:", e);
      }
    }
  };

  const refreshCloudSlots = async () => {
    const docRef = userSaveDocRef();
    if (!docRef) {
      setCloudSlotViews(emptyCloudSlotViews());
      return;
    }
    const snap = await getDoc(docRef);
    const documentUpdatedAt = snap.exists()
      ? snapshotUpdatedAt(snap) || (auth?.currentUser ? await fetchCloudDocumentUpdatedAt(auth.currentUser.uid) : null)
      : null;
    const slots = readCloudSlotsFromDocument(snap.exists() ? snap.data() as Record<string, unknown> : null, documentUpdatedAt);
    if (slots.migratedFromLegacy && slots.records[0]) {
      await writeCloudSlotRecord(slots.records[0]);
    }
    setCloudSlotViews(slots.views);
  };

  const openCloudSlots = async () => {
    setShowCloudSlots(true);
    setCloudSlotBusy(true);
    try {
      await refreshCloudSlots();
    } catch (error) {
      console.error('Failed to load cloud slots:', error);
      showAlert('클라우드 슬롯을 불러오지 못했습니다. 네트워크와 로그인 계정을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setCloudSlotBusy(false);
    }
  };

  const handleDownloadCloudSlot = async (slot: CloudSlotId) => {
    if (cloudSlotBusy) return;
    setCloudSlotBusy(true);
    try {
      const docRef = userSaveDocRef();
      if (!docRef) {
        showAlert('구글 계정에 먼저 로그인해 주세요.');
        return;
      }
      const snap = await getDoc(docRef);
      const documentUpdatedAt = snap.exists() ? snapshotUpdatedAt(snap) : null;
      const slots = readCloudSlotsFromDocument(snap.exists() ? snap.data() as Record<string, unknown> : null, documentUpdatedAt);
      setCloudSlotViews(slots.views);
      const record = slots.records[slot - 1];
      if (!record) {
        showAlert(`슬롯 ${slot}은 비어 있습니다.`);
        return;
      }
      const localStr = localStorage.getItem(CAMPAIGN_SAVE_KEY);
      if (!confirmManualSlotDownload({
        slot,
        localRaw: localStr,
        cloudName: record.name
      })) return;
      const migrated = migrateCampaignSave(JSON.parse(record.payload));
      if (!migrated.ok) {
        showAlert('클라우드 저장을 올리지 못했습니다. 로컬 기록은 그대로 둡니다.');
        return;
      }
      setState(migrated.state);
      localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(migrated.state));
      writeActiveCloudSlot(slot);
      setActiveCloudSlot(slot);
      const name = migrated.state.bio?.name?.trim() || record.name;
      showAlert(name ? `슬롯 ${slot}에서 ${name} 약제사 기록을 내려받았습니다.` : `슬롯 ${slot} 기록을 내려받았습니다.`);
    } catch (error) {
      console.error('Failed to download cloud slot:', error);
      showAlert('클라우드 기록을 내려받지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setCloudSlotBusy(false);
    }
  };

  const handleUploadCloudSlot = async (slot: CloudSlotId) => {
    if (cloudSlotBusy) return;
    setCloudSlotBusy(true);
    try {
      if (!userSaveDocRef()) {
        showAlert('구글 계정에 먼저 로그인해 주세요.');
        return;
      }
      const localStr = localStorage.getItem(CAMPAIGN_SAVE_KEY) || (state ? JSON.stringify(state) : null);
      if (!localStr) {
        showAlert('이 기기에 올릴 기록이 없습니다.');
        return;
      }
      if (localStr.length >= 950000) {
        showAlert('기록이 너무 커서 클라우드에 올릴 수 없습니다. 로컬에만 저장됩니다.');
        return;
      }
      const parsed = parseCampaignSaveRaw(localStr);
      if (!parsed.ok || !campaignSaveHasNamedApothecary(parsed.value)) {
        showAlert('약제사 이름이 있는 기록만 클라우드에 올릴 수 있습니다.');
        return;
      }
      const currentView = cloudSlotViews.find(row => row.slot === slot);
      if (!confirmManualSlotUpload({
        slot,
        localRaw: localStr,
        occupied: Boolean(currentView && !currentView.empty),
        cloudName: currentView?.name || null
      })) return;
      const record = cloudSlotRecordFromPayload(slot, localStr, new Date().toISOString());
      await writeCloudSlotRecord(record);
      writeActiveCloudSlot(slot);
      setActiveCloudSlot(slot);
      await refreshCloudSlots();
      showAlert(record.name ? `슬롯 ${slot}에 ${record.name} 기록을 올렸습니다.` : `슬롯 ${slot}에 기록을 올렸습니다.`);
    } catch (error) {
      console.error('Failed to upload cloud slot:', error);
      showAlert(cloudWriteErrorMessage(error as { code?: string; message?: string }));
    } finally {
      setCloudSlotBusy(false);
    }
  };

  const handleReset = () => {
    if (askWindowConfirm("⚠️ 경고: 정말 모든 진행상황과 연대기를 초기화하고 새로운 약제사로 시작하시겠습니까? (저널 일지 기록도 함께 삭제됩니다.)")) {
      updateState(() => syncWorldMemory(INITIAL_STATE));
      changeActiveTab('play');
    }
  };

  if (loading || !state) {
    if (saveLoadError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: 'var(--bg-gradient)', color: 'var(--text-bright)', padding: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ letterSpacing: 0, color: 'var(--text-bright)', margin: 0 }}>저장 기록을 열 수 없습니다</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '32rem', lineHeight: 1.55 }}>{saveLoadError}</p>
          <p style={{ color: 'var(--text-muted)', maxWidth: '32rem', lineHeight: 1.55 }}>
            기존 로컬 기록은 디스크에서 지우지 않았습니다. 먼저 원본을 내보낸 뒤 다시 시도하거나, 확인 후에만 새로 시작하세요.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={exportRawCampaignSave}
              style={{ padding: '0.55rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              원본 저장 내보내기
            </button>
            <button
              type="button"
              onClick={() => {
                if (!askWindowConfirm('기존 기록을 지우고 새 약제사로 시작할까요? 먼저 원본을 내보내세요.')) return;
                const fresh = syncWorldMemory(INITIAL_STATE);
                setState(fresh);
                localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(fresh));
                setSaveLoadError(null);
              }}
              style={{ padding: '0.55rem 1rem', background: '#fff', color: '#8f2f28', border: '1px solid #c77972', borderRadius: '8px', cursor: 'pointer' }}
            >
              기록을 지우고 새로 시작
            </button>
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.2rem', background: 'var(--bg-gradient)', color: 'var(--text-bright)' }}>
        <h2 style={{ letterSpacing: 0, color: 'var(--text-bright)' }}>Apawthecaria 들녘 일지</h2>
        <p style={{ color: 'var(--text-muted)' }}>여행 약제사의 기록장을 여는 중...</p>
      </div>
    );
  }

  function handlePassHour(amt: number = 1, timerIds?: string[]) {
    const patient = state.patients.find(row => row.id === state.activePatientId);
    if (!patient) return;
    const timerResult = resolveTimer({ patient, hours: amt, timerIds });
    if (!timerResult.value) {
      showAlert(timerResult.messages.join('\n'));
      return;
    }
    const expiredAilmentIds = timerResult.value.ailments
      .filter(row => row.status === 'failed' && patient.ailments.find(previous => previous.id === row.id)?.status === 'active')
      .map(row => row.id);
    let nextPatient = timerResult.value;
    let nextReputation = state.reputation;
    let appliedTransactionIds = state.appliedTransactionIds;
    let failureTransactionId: string | null = null;
    if (expiredAilmentIds.length > 0) {
      failureTransactionId = `timer-failure:${Date.now()}`;
      const failure = resolveTreatmentTransaction({
        mode: 'fail-expired', transactionId: failureTransactionId,
        state: {
          inventory: toEngineInventory(state.bag), patient: nextPatient,
          reputation: state.reputation, trinkets: state.trinkets.length,
          journalEvents: [], appliedTransactionIds: state.appliedTransactionIds,
          ailmentTagOverrides: state.ailmentTagOverrides
        },
        ailmentInstanceIds: expiredAilmentIds,
        journalText: '환자 타이머가 만료되어 인쇄된 실패 결과를 적용한다.'
      });
      if (failure.value) {
        nextPatient = failure.value.nextState.patient;
        nextReputation = failure.value.nextState.reputation;
        appliedTransactionIds = failure.value.nextState.appliedTransactionIds;
      }
    }
    const hasActiveAilments = nextPatient.ailments.some(row => row.status === 'active');
    const failureDrafts = expiredAilmentIds.map(instanceId => {
      const failed = nextPatient.ailments.find(row => row.id === instanceId);
      return failed?.ailmentId && failureTransactionId
        ? createPrintedManualDraft(failed.ailmentId, 'treatment-failure', {
          encounterTransactionId: `${failureTransactionId}:${instanceId}`,
          patientId: nextPatient.id,
          ailmentInstanceId: instanceId,
          locationId: findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName),
          continuation: 'ailment-close'
        })
        : null;
    });
    updateState(s => {
      const timestamp = Date.now();
      const existingArchive = s.patientArchive.find(row => row.caseId === nextPatient.id);
      const failedArchive = expiredAilmentIds.length > 0
        ? createPatientArchiveRecord({
          caseId: nextPatient.id,
          patient: nextPatient,
          location: s.currentLocationName,
          encounteredAt: existingArchive?.encounteredAt || timestamp,
          treatedAt: timestamp,
          treatmentResult: 'failure',
          penalty: { reputation: Math.max(0, s.reputation - nextReputation) },
          specialEffects: ['Timer expiry and printed Ailment Consequence'],
          journalEntryIds: [`timer-expired:${timestamp}`],
          sourceJourneyId: s.journey?.journeyId || null,
          transactionIds: appliedTransactionIds.filter(id => !s.appliedTransactionIds.includes(id))
        })
        : null;
      let next = enqueueManualDrafts({
        ...s,
        patients: s.patients.map(row => row.id === nextPatient.id ? nextPatient : row),
        activePatientId: nextPatient.id,
        reputation: nextReputation,
        appliedTransactionIds,
        needsLocalHelpBeforeMove: hasActiveAilments,
        patientArchive: failedArchive ? upsertPatientArchive(s.patientArchive, failedArchive) : s.patientArchive,
        journals: expiredAilmentIds.length > 0 ? [{
          id: `timer-expired:${timestamp}`, title: '환자 타이머 만료',
          text: `만료된 질환 ${expiredAilmentIds.length}개. 인쇄된 실패 결과를 확인해야 합니다.`, timestamp
        }, ...s.journals] : s.journals
      }, failureDrafts);
      if (hasActiveAilments) return next;
      const leave = resolveLeave({
        transactionId: `leave-after:${failureTransactionId || `timer:${timestamp}`}`,
        state: toLeaveRuntime(next, nextPatient),
        status: 'failed',
        journalNote: '환자 타이머가 만료되어 인쇄된 실패 결과를 적용하고 환자 기록을 마감했다.'
      });
      if (leave.value) next = { ...applyLeaveRuntime(next, leave.value), needsLocalHelpBeforeMove: false };
      return next;
    });
    if (expiredAilmentIds.length > 0) showAlert('환자 타이머가 만료되었습니다. 각 질환의 실패 결과를 전용 직접 판정에 저장했습니다.');
  }

  // Calculate current weight
  // Calculate current weight (taking Greenpaw Bandolier weight saving into account)
  const hasBandolier = hasTool(state, 'tool_bandolier') || hasTool(state, 'Greenpaw Bandolier');
  let bandolierContentsWeight = 0;
  let baseWeight = 0;
  state.bag.forEach(item => {
    const itemTotalWeight = item.weight * (item.qty || 1);
    if (hasBandolier && item.inBandolier && isEligibleForBandolier(item)) {
      bandolierContentsWeight += itemTotalWeight;
    } else {
      baseWeight += itemTotalWeight;
    }
  });
  const currentWeight = hasBandolier
    ? baseWeight + Math.max(0, bandolierContentsWeight - 5)
    : baseWeight + bandolierContentsWeight;
  const maxCarry = getMaxCarry(state);
  const travelSpeed = getTravelSpeed(state, currentWeight);
  const isOverEncumbered = currentWeight > maxCarry;

  const addPreparedReagentToInventory = (reagentName: string, sourceLabel: string, onAdded?: () => void) => {
    const canonical = findCanonicalReagent(reagentName);
    const r = canonical ? reagentDisplayRecord(canonical) : null;
    if (!r) {
      showAlert("영약재 이름을 도감에서 찾을 수 없습니다.");
      return;
    }
    const parts = splitReagentPreparations(r.preps);
    const chosenPart = prompt(`가방에 넣을 ${r.name} 부위를 선택하세요:\n${parts.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}`);
    if (!chosenPart) return;
    const partIdx = Math.max(0, (parseInt(chosenPart) || 1) - 1);
    const partText = parts[partIdx] || parts[0];
    const timestamp = createClientTransaction('inventory-reagent').at;

    updateState(s => {
      const newItem = createPreparedReagentItem(r, partText, sourceLabel);
      const { nextGoalCounter, nextChecklist } = checkReagentGatherForGoal(s, r.name);
      return {
        ...s,
        bag: [...s.bag, newItem],
        journeyGoalCounter: nextGoalCounter,
        journeyGoalChecklist: nextChecklist,
        journals: [
          {
            id: `${sourceLabel}_${timestamp}`,
            title: `🌿 영약재 획득: ${r.name}`,
            text: `${r.name} (${partText.trim()})을(를) 가방에 넣었습니다.`,
            timestamp
          },
          ...s.journals
        ]
      };
    });
    onAdded?.();
  };

  const applyPostForageTimer = (encounter: any | null) => {
    const baseTimerCost = Number(encounter?.timerBaseCost || 0);
    if (baseTimerCost <= 0) return;

    const gatheredPartCount = Math.max(0, Number(encounter?.gatheredPartCount || 0));
    const timerCost = baseTimerCost + Math.max(0, gatheredPartCount - 1);
    if (timerCost <= 0) return;

    updateState((s: GameState) => {
      const patient = s.patients.find(row => row.id === s.activePatientId);
      const activeAilment = patient?.ailments.find(ailment => ailment.status === 'active');
      if (!patient || (activeAilment && canTreatAilmentWithInventory(patient, activeAilment.id, toEngineInventory(s.bag), s.ailmentTagOverrides))) {
        return { ...s, pendingForaging: null };
      }
      const timerResult = resolveTimer({ patient, hours: timerCost });
      if (!timerResult.value) return s;
      return {
        ...s,
        patients: s.patients.map(row => row.id === patient.id ? timerResult.value! : row),
        pendingForaging: null
      };
    });
  };

  const handleAddForageFindToBag = async (find: ForageFind, _idx: number) => {
    const pending = state.pendingForaging;
    const reagent = REAGENTS.find(row => row.id === find.reagentId);
    if (!pending || !reagent) return;
    const availableParts = reagent.preparations.filter(part => part.requiredTools.every(tool => tool === 'none' || state.bag.some(item => item.canonicalToolId === tool)));
    if (availableParts.length === 0) {
      showAlert('이 영약재를 준비하는 데 필요한 도구가 없습니다.');
      return;
    }
    const chosen = await requestControlledPrompt({
      title: '채집할 부위를 선택하세요',
      message: reagent.displayName,
      defaultValue: '1',
      kicker: '채집 기록',
      options: availableParts.map((part, partIndex) => ({
        value: String(partIndex + 1),
        label: `${partIndex + 1}. ${localizePreparationName(part.name)} (${localizePreparationMethod(part.method)}, 무게 ${formatWeight(part.weight)}, ${part.uses}회분)`
      }))
    });
    if (chosen === null) return;
    const preparation = availableParts[Math.max(0, (parseInt(chosen, 10) || 1) - 1)] || availableParts[0];
    const quantityInput = await requestControlledPrompt({
      title: '채집 수량',
      message: `${localizePreparationName(preparation.name)}을 몇 개 채집하나요?`,
      defaultValue: '1',
      kicker: '채집 기록',
      label: '수량',
      inputMode: 'number'
    });
    if (quantityInput === null) return;
    const quantity = Math.max(1, parseInt(quantityInput, 10) || 1);
    const graniteMortar = canonicalToolsFromState(state).find(tool => tool.upgradeId === 'granite-mortar' && !tool.broken && !tool.consumed);
    const poundWithGranite = Boolean(graniteMortar && reagent.type === 'PLANT' && /BREW/i.test(preparation.method)
      && askWindowConfirm('Granite Mortar로 이 부위를 무게 없는 Powder/Tea로 POUND할까요?'));
    const spendGap = !find.cardSuccess && !find.fpAvailable && (find.gapCost || 0) > 0
      ? askWindowConfirm(`카드와 희귀도 차이 ${find.gapCost}만큼 채집 포인트를 사용하시겠습니까? 취소하면 채집에 실패하고 채집 포인트 1을 얻습니다.`)
      : false;
    const activePatient = state.patients.find(patient => patient.id === state.activePatientId) || null;
    const hasEfficientKettle = canonicalToolsFromState(state).some(tool => tool.upgradeId === 'efficient-copper-kettle' && !tool.broken && !tool.consumed);
    let gatherTimerId: string | undefined;
    if (hasEfficientKettle && /BOIL|BREW/i.test(preparation.method) && activePatient) {
      const activeTimers = activePatient.timers.filter(timer => timer.status === 'active');
      if (activeTimers.length === 1) gatherTimerId = activeTimers[0].id;
      else if (activeTimers.length > 1) {
        const timerChoice = await requestControlledPrompt({
          title: '타이머를 선택하세요',
          message: 'Efficient Copper Kettle로 +1 할 타이머를 고릅니다.',
          defaultValue: '1',
          kicker: '도구 효과',
          options: activeTimers.map((timer, index) => ({
            value: String(index + 1),
            label: `${index + 1}. ${timer.ailmentInstanceId} · ${timer.current}/${timer.maximum}`
          }))
        });
        if (timerChoice === null) return;
        gatherTimerId = activeTimers[(parseInt(timerChoice, 10) || 1) - 1]?.id;
        if (!gatherTimerId) return showAlert('목록에 있는 타이머를 선택해 주세요.');
      }
    }
    const result = resolveForaging({
      transactionId: pending.transactionId,
      state: {
        season: state.currentSeason,
        currentRegion: (state.currentRegion === 'Barrow' ? 'Titan' : state.currentRegion) as Exclude<TravelRegion, 'Soar'>,
        currentLocationType: canonicalLocationType(state.currentLocationType),
        adjacentRegions: adjacentRuleRegions(state),
        foragingPoints: state.activeAilment?.foragingPoints || 0,
        inventory: toEngineInventory(state.bag),
        toolIds: state.bag.flatMap(item => item.canonicalToolId ? [item.canonicalToolId] : []),
        tools: canonicalToolsFromState(state),
        patient: activePatient,
        conditions: state.manualConditions || []
      },
      forageRegion: pending.region,
      locationRelation: pending.locationRelation,
      card: { value: pending.card.value, suit: pending.card.suit },
      reagentTypeFilter: pending.reagentTypeFilter,
      source: pending.source,
      targetReagentId: reagent.id,
      parts: [{ preparationId: preparation.id, quantity }],
      spendForagingPoints: spendGap,
      gatherTimerId,
      ...canonicalForagingModifiers(state),
      weatherProtectionActive: pending.ignoreNegativeEncounterEffects || state.forecastActiveAtLocation
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    const pounded = poundWithGranite ? resolveGraniteMortarPound({
      transactionId: `${pending.transactionId}:tool:granite-mortar`,
      state: {
        trinkets: state.trinkets.length,
        inventory: outcome.nextState.inventory,
        tools: outcome.nextState.tools || canonicalToolsFromState(state),
        appliedTransactionIds: state.appliedTransactionIds,
        journalEvents: []
      },
      itemIds: outcome.gatheredItems.map(item => item.id),
      carryScore: getMaxCarry(state)
    }) : null;
    if (pounded && !pounded.value) {
      showAlert(pounded.messages.join('\n'));
      return;
    }
    const finalInventory = pounded?.value?.inventory || outcome.nextState.inventory;
    const finalTools = pounded?.value?.tools || outcome.nextState.tools || canonicalToolsFromState(state);
    updateState(s => {
      const nextBag = fromEngineInventory(finalInventory, s.bag);
      const nextBase: GameState = {
        ...s,
        bag: nextBag,
        toolStates: finalTools,
        patients: outcome.nextState.patient
          ? s.patients.map(patient => patient.id === outcome.nextState.patient!.id ? {
            ...outcome.nextState.patient!,
            foragingPoints: outcome.nextState.foragingPoints,
            reagentsGathered: outcome.gatheredItems.length > 0
              ? [...(outcome.nextState.patient!.reagentsGathered || []), reagent.id]
              : outcome.nextState.patient!.reagentsGathered
          } : patient)
          : s.patients,
        pendingForaging: {
          ...pending,
          selectedReagentId: reagent.id,
          timerCostAfterEncounter: outcome.timerCostAfterEncounter,
          encounterId: outcome.encounter?.id || null,
          phase: 'encounter'
        },
        appliedTransactionIds: Array.from(new Set([...s.appliedTransactionIds, pending.transactionId, ...(pounded?.value?.appliedTransactionIds || [])])),
        journals: pounded?.value ? appendEngineJournals(s.journals, pounded.value.journalEvents) : s.journals
      };
      const withJourney = {
        ...nextBase,
        journey: outcome.gatheredItems.length > 0
          ? recordCanonicalJourneyEvent(nextBase, {
            id: `${pending.transactionId}:journey-forage`, type: 'forage', reagentId: reagent.id,
            region: pending.region, locationId: findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName)
          })
          : nextBase.journey
      };
      return outcome.gatheredItems.length > 0
        ? commitPendingAlternativeAcquisition(withJourney, 'forage', pending.transactionId)
        : withJourney;
    });
    setActiveForageEncounter((prev: any) => prev ? {
      ...prev,
      foundReagents: [{ ...find, name: reagent.displayName }],
      selectedReagentId: reagent.id,
      gatheredPartCount: outcome.gatheredItems.length,
      timerBaseCost: pending.timerCostAfterEncounter,
      forageFailed: outcome.gatheredItems.length === 0
    } : prev);
    if (outcome.gatheredItems.length === 0) showAlert(result.messages.join('\n'));
  };

  const applyEncounterStateEffect = (effect: 'gainFP' | 'loseFP' | 'gainTime' | 'loseTime' | 'gainReagent' | 'loseReagent' | 'gainTrinket' | 'loseTrinket' | 'startPursuit' | 'clearPursuit' | 'gainRep' | 'loseRep' | 'markDay' | 'moveSettlement' | 'endJourney') => {
    const amountInput = ['gainFP', 'loseFP', 'gainTime', 'loseTime', 'gainTrinket', 'loseTrinket', 'startPursuit', 'gainRep', 'loseRep', 'markDay'].includes(effect)
      ? prompt("적용할 수치를 입력하세요:", effect === 'startPursuit' ? "6" : "1")
      : null;
    const amount = Math.max(0, parseInt(amountInput || "0") || 0);
    const timestamp = createClientTransaction('encounter-effect').at;

    if (effect === 'gainReagent') {
      const reagentName = prompt("획득할 영약재 이름:", "");
      if (reagentName) addPreparedReagentToInventory(reagentName, 'encounter_reagent');
      return;
    }

    updateState(s => {
      let nextAilment = s.activeAilment;
      let nextBag = [...s.bag];
      let nextTrinkets = [...s.trinkets];
      let nextPursued = s.pursuedByBehemoth;
      let nextReputation = s.reputation;
      let nextCalendarDays = s.calendarDays;
      let nextCumulative = s.cumulativeDays || 0;
      let nextJourneyActive = s.journeyActive;
      let nextCurrentLocationName = s.currentLocationName;
      let nextCurrentLocationType = s.currentLocationType;
      let nextCustomMapLocations = s.customMapLocations || [];
      let note = "";

      if ((effect === 'gainFP' || effect === 'loseFP' || effect === 'gainTime' || effect === 'loseTime') && !nextAilment) {
        showAlert("현재 치료 중인 환자가 없어 이 효과를 적용할 수 없습니다.");
        return s;
      }

      if (effect === 'gainFP' && nextAilment) {
        nextAilment = { ...nextAilment, foragingPoints: nextAilment.foragingPoints + amount };
        note = `조우 효과: 채집 포인트 +${amount}`;
      } else if (effect === 'loseFP' && nextAilment) {
        nextAilment = { ...nextAilment, foragingPoints: Math.max(0, nextAilment.foragingPoints - amount) };
        note = `조우 효과: 채집 포인트 -${amount}`;
      } else if (effect === 'gainTime' && nextAilment) {
        nextAilment = { ...nextAilment, timer: nextAilment.timer + amount, maxTimer: Math.max(nextAilment.maxTimer, nextAilment.timer + amount) };
        note = `조우 효과: 치료 시간 +${amount}`;
      } else if (effect === 'loseTime' && nextAilment) {
        nextAilment = { ...nextAilment, timer: Math.max(0, nextAilment.timer - amount) };
        note = `조우 효과: 치료 시간 -${amount}`;
      } else if (effect === 'loseReagent') {
        const reagents = nextBag.filter(item => item.type === 'reagent');
        if (reagents.length === 0) {
          showAlert("잃을 영약재가 가방에 없습니다.");
          return s;
        }
        const choice = prompt(`잃을 영약재 번호를 선택하세요:\n${reagents.map((item, i) => `${i + 1}. ${localizeInventoryItemName(item.name)}`).join('\n')}`, "1");
        const target = reagents[Math.max(0, (parseInt(choice || "1") || 1) - 1)] || reagents[0];
        let removed = false;
        nextBag = nextBag.filter(item => {
          if (!removed && item.id === target.id) {
            removed = true;
            return false;
          }
          return true;
        });
        note = `조우 효과: 영약재 ${target.name} 상실`;
      } else if (effect === 'gainTrinket') {
        nextTrinkets = [...nextTrinkets, ...Array(amount).fill('조우 보상 장신구 (Trinket)')];
        note = `조우 효과: 장신구 +${amount}`;
      } else if (effect === 'loseTrinket') {
        nextTrinkets = nextTrinkets.slice(Math.min(amount, nextTrinkets.length));
        note = `조우 효과: 장신구 -${Math.min(amount, s.trinkets.length)}`;
      } else if (effect === 'startPursuit') {
        nextPursued = { headStart: amount || 6 };
        note = `조우 효과: 거수 추격 시작 (선행거리 ${amount || 6})`;
      } else if (effect === 'clearPursuit') {
        nextPursued = null;
        note = `조우 효과: 거수 추격 종료`;
      } else if (effect === 'gainRep') {
        nextReputation = nextReputation + amount;
        note = `조우 효과: 길드 명성 +${amount}`;
      } else if (effect === 'loseRep') {
        nextReputation = Math.max(0, nextReputation - amount);
        note = `조우 효과: 길드 명성 -${amount}`;
      } else if (effect === 'markDay') {
        nextCalendarDays = nextCalendarDays + amount;
        nextCumulative = nextCumulative + amount;
        note = `조우 효과: 일정 +${amount}일`;
      } else if (effect === 'moveSettlement') {
        const settlementName = prompt("이동할 정착지 이름:", s.currentLocationName);
        if (!settlementName) return s;
        nextCurrentLocationName = settlementName;
        nextCurrentLocationType = 'Settlement';
        nextCustomMapLocations = upsertCustomMapLocation(
          s.customMapLocations || [],
          settlementName,
          s.currentRegion,
          'Settlement',
          s.currentLocationName,
          '조우 효과로 도착한 정착지'
        );
        note = `조우 효과: ${settlementName} 정착지로 이동`;
      } else if (effect === 'endJourney') {
        if (!askWindowConfirm("이 조우 효과로 현재 여정을 종료할까요?")) return s;
        nextJourneyActive = false;
        note = `조우 효과: 여정 종료`;
      }

      return {
        ...s,
        activeAilment: nextAilment,
        bag: nextBag,
        trinkets: nextTrinkets,
        pursuedByBehemoth: nextPursued,
        reputation: nextReputation,
        calendarDays: nextCalendarDays,
        cumulativeDays: nextCumulative,
        journeyActive: nextJourneyActive,
        currentLocationName: nextCurrentLocationName,
        currentLocationType: nextCurrentLocationType,
        customMapLocations: nextCustomMapLocations,
        journals: note ? [
          { id: `encounter_effect_${timestamp}`, title: '조우 상태 효과 적용', text: note, timestamp },
          ...s.journals
        ] : s.journals
      };
    });
  };

  const handleUseBeetleCompanion = (encounterTitle: string) => {
    const transaction = createClientTransaction('companion:beetle');
    const result = resolveCompanionTrigger({ transactionId: transaction.id, state: toMobilityRuntime(state), trigger: 'beast' });
    if (!result.value) return showAlert(result.messages.join('\n'));
    updateState(s => {
      const next = applyMobilityRuntime(s, result.value!);
      return {
        ...next,
        pendingEncounter: next.pendingEncounter ? { ...next.pendingEncounter, ignoreNegativeEncounterEffects: true, encounterProtection: 'all' as const } : null,
        journals: [{ id: `${transaction.id}:detail`, title: '딱정벌레 동반자 보호', text: `${encounterTitle || '여정 조우'}의 맹수 효과를 무시했습니다.`, timestamp: transaction.at }, ...next.journals]
      };
    });
    showAlert("딱정벌레 동반자 효과를 이번 여정 1회 사용으로 기록했습니다.");
  };

  const applyArrivalInstrumentEffects = (s: GameState, transactionId: string): GameState => {
    if (s.currentLocationType !== 'Settlement' && s.currentLocationType !== 'City') return s;
    const tools = canonicalToolsFromState(s);
    const instruments = tools.filter(tool => tool.toolId === 'instruments' && !tool.broken && !tool.consumed);
    if (instruments.length === 0) return s;
    const resolved = resolveInstrumentShow({
      transactionId: `${transactionId}:tool:instruments`,
      tools,
      hasFamiliar: Boolean(s.bio.familiarName),
      hasPassenger: Boolean(s.activePassenger),
      hasCricket: (s.companionStates || []).some(row => row.companionId === 'cricket'),
      rulesetId: s.rulesetId
    });
    if (resolved.trinketsDelta === 0) return { ...s, toolStates: resolved.tools };
    return {
      ...s,
      toolStates: resolved.tools,
      trinkets: resizeTrinkets(s.trinkets, s.trinkets.length + resolved.trinketsDelta, '악기 연주 보상'),
      journals: [{
        id: `${transactionId}:tool:instruments:journal`, title: '정착지 연주회',
        text: `${resolved.appliedToolInstanceIds.length}개의 악기로 공연해 장신구 ${resolved.trinketsDelta}개를 받았습니다.`, timestamp: Date.now()
      }, ...s.journals]
    };
  };

  const resolveCanonicalEncounter = (note: string) => {
    const pending = state.pendingEncounter;
    if (!pending) {
      setActiveTravelEncounter(null);
      return;
    }
    if (encounterNeedsPlayerChoice(pending.encounter, activeTravelEncounter?.selectedChoiceId || pending.selectedChoiceId)) {
      showAlert('인쇄된 선택지 중 하나를 고른 뒤 판정을 계속하세요.');
      return;
    }
    const activePatient = state.patients.find(patient => patient.id === state.activePatientId) || null;
    const result = resolveEncounter({
      transactionId: pending.transactionId,
      encounter: pending.encounter,
      choiceId: defaultEncounterChoiceId(pending.encounter, activeTravelEncounter?.selectedChoiceId || pending.selectedChoiceId),
      state: {
        reputation: state.reputation,
        trinkets: state.trinkets.length,
        calendarDays: state.calendarDays,
        foragingPoints: state.activeAilment?.foragingPoints || 0,
        inventory: toEngineInventory(state.bag),
        patient: activePatient,
        movementBlocked: Boolean(state.needsLocalHelpBeforeMove),
        conditions: state.manualConditions || [],
        appliedEffectIds: state.appliedEncounterEffectIds
      },
      protection: pending.encounterProtection || (pending.ignoreNegativeEncounterEffects ? 'negative' : undefined)
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    const runtime = outcome.nextState;
    let manualDraft = outcome.unresolvedEffects.length > 0
      ? createPrintedManualDraft(pending.encounter.id, 'encounter', {
        encounterTransactionId: pending.transactionId,
        locationId: findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName),
        patientId: activePatient?.id,
        continuation: 'travel'
      })
      : null;
    const printedEffect = PRINTED_EFFECT_BY_OWNER.get(pending.encounter.id);
    if (manualDraft && note.trim()) manualDraft = { ...manualDraft, resultSummary: note.trim(), journalNote: note.trim() };
    if ((pending.encounterProtection || pending.ignoreNegativeEncounterEffects) && manualDraft) manualDraft = {
      ...manualDraft,
      printedText: `[보호 적용] ${pending.encounterProtection === 'all' ? '이 조우의 기계적 효과 전체' : '부정적 결과'}는 무효입니다.\n\n${manualDraft.printedText}`,
      mandatoryConditions: [`보호 효과 적용: ${pending.encounterProtection === 'all' ? '조우 효과 전체' : '부정적 결과'}를 적용하지 않는다.`, ...manualDraft.mandatoryConditions],
      canonicalActions: ['Encounter protection committed', ...manualDraft.canonicalActions]
    };
    updateState(s => {
      const patients = runtime.patient
        ? s.patients.map(patient => patient.id === runtime.patient!.id
          ? { ...runtime.patient!, foragingPoints: runtime.foragingPoints }
          : patient)
        : s.patients;
      const next: GameState = {
        ...s,
        reputation: runtime.reputation,
        trinkets: Array.from({ length: runtime.trinkets }, (_, index) => s.trinkets[index] || '조우 보상 장신구'),
        calendarDays: runtime.calendarDays,
        bag: fromEngineInventory(runtime.inventory, s.bag),
        patients,
        appliedEncounterEffectIds: runtime.appliedEffectIds,
        pendingEncounter: null,
        manualConditions: remapEncounterConditions(runtime.conditions, s),
        journals: [{
          id: `${pending.transactionId}:${manualDraft ? 'pending-manual' : 'resolved'}`,
          title: `${manualDraft ? '판정 대기' : '여정 조우'}: ${printedEffect?.ownerName || pending.encounter.title}`,
          text: `[p.${pending.encounter.sourcePage}] ${printedEffect?.printedText || pending.encounter.prompt}${manualDraft ? '\n\n전용 직접 판정에서 선택과 상태 변화를 완료해야 합니다.' : `\n\n나의 선택: ${note || '인쇄된 지시를 해결했다.'}`}`,
          timestamp: Date.now()
        }, ...s.journals]
      };
      return enqueueManualDrafts(manualDraft ? next : applyArrivalInstrumentEffects(next, pending.transactionId), [manualDraft]);
    });
    setActiveTravelEncounter(null);
  };

  const resolveCanonicalForageEncounter = (note: string): boolean => {
    const pending = state.pendingForaging;
    if (!pending) return true;
    if (pending.source !== 'familiar-independent'
      && encounterNeedsPlayerChoice(activeForageEncounter, activeForageEncounter?.selectedChoiceId || pending.selectedChoiceId)) {
      showAlert('인쇄된 채집 선택지 중 하나를 고른 뒤 판정을 계속하세요.');
      return false;
    }
    if (pending.phase === 'choose-reagent' && (activeForageEncounter?.foundReagents?.length || 0) > 0) {
      showAlert('먼저 영약재 하나와 채집할 부위를 선택해 주세요.');
      return false;
    }
    if (pending.source === 'familiar-independent') {
      updateState(s => ({
        ...s,
        pendingForaging: null,
        journals: [{
          id: `${pending.transactionId}:resolved`,
          title: '자유로운 길동무의 채집',
          text: `${localizeRegionLabel(pending.region)}에서 조우와 시간 소모 없이 채집을 마쳤다.\n\n${note || '길동무가 무사히 돌아왔다.'}`,
          timestamp: Date.now()
        }, ...s.journals]
      }));
      return true;
    }
    const activePatient = state.patients.find(patient => patient.id === state.activePatientId) || null;
    const encounter = activeForageEncounter as any;
    const encounterResult = resolveEncounter({
      transactionId: `${pending.transactionId}:encounter`,
      encounter,
      choiceId: defaultEncounterChoiceId(encounter, activeForageEncounter?.selectedChoiceId || pending.selectedChoiceId),
      state: {
        reputation: state.reputation, trinkets: state.trinkets.length, calendarDays: state.calendarDays,
        foragingPoints: state.activeAilment?.foragingPoints || 0,
        inventory: toEngineInventory(state.bag), patient: activePatient,
        movementBlocked: Boolean(state.needsLocalHelpBeforeMove),
        conditions: state.manualConditions || [],
        appliedEffectIds: state.appliedEncounterEffectIds
      },
      protection: pending.ignoreNegativeEncounterEffects
        || ((state.manualConditions || []).includes('ignore-midges-until-move') && /midge/i.test(`${encounter.title || ''} ${encounter.prompt || ''}`))
        || (state.manualConditions || []).includes(`ignore-negative:${findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName)}`)
        ? 'negative'
        : undefined
    });
    if (!encounterResult.value) {
      showAlert(encounterResult.messages.join('\n'));
      return false;
    }
    const runtime = encounterResult.value.nextState;
    const printedEffect = PRINTED_EFFECT_BY_OWNER.get(encounter.id || pending.encounterId || '');
    let manualDraft = encounterResult.value.unresolvedEffects.length > 0
      ? createPrintedManualDraft(encounter.id || pending.encounterId || '', 'encounter', {
        encounterTransactionId: `${pending.transactionId}:encounter`,
        locationId: findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName),
        patientId: activePatient?.id,
        continuation: 'foraging'
      })
      : null;
    if (manualDraft && note.trim()) manualDraft = { ...manualDraft, resultSummary: note.trim(), journalNote: note.trim() };
    if (pending.ignoreNegativeEncounterEffects && manualDraft) manualDraft = {
      ...manualDraft,
      printedText: `[Forecast] Weather 태그 조우의 모든 부정적 효과는 무효입니다.\n\n${manualDraft.printedText}`,
      mandatoryConditions: ['Forecast 적용: 부정적 효과를 적용하지 않는다.', ...manualDraft.mandatoryConditions],
      canonicalActions: ['Forecast protection committed', ...manualDraft.canonicalActions]
    };
    let patient: PatientState | null = runtime.patient ? { ...runtime.patient, foragingPoints: runtime.foragingPoints } : null;
    const activeAilment = patient?.ailments.find(ailment => ailment.status === 'active');
    if (patient && activeAilment && !canTreatAilmentWithInventory(patient, activeAilment.id, runtime.inventory, state.ailmentTagOverrides)) {
      patient = resolveTimer({ patient, hours: pending.timerCostAfterEncounter }).value || patient;
    }
    updateState(s => {
      let next: GameState = {
        ...s,
        reputation: runtime.reputation,
        trinkets: Array.from({ length: runtime.trinkets }, (_, index) => s.trinkets[index] || '채집 조우 보상 장신구'),
        calendarDays: runtime.calendarDays,
        bag: fromEngineInventory(runtime.inventory, s.bag),
        patients: patient ? s.patients.map(row => row.id === patient!.id ? patient! : row) : s.patients,
        appliedEncounterEffectIds: runtime.appliedEffectIds,
        pendingForaging: null,
        manualConditions: remapEncounterConditions(runtime.conditions, s),
        journals: [{
          id: `${pending.transactionId}:${manualDraft ? 'pending-manual' : 'resolved'}`, title: `${manualDraft ? '판정 대기' : '채집 조우'}: ${printedEffect?.ownerName || encounter.title}`,
          text: `${printedEffect?.printedText || encounter.prompt}${manualDraft ? '\n\n전용 직접 판정에서 선택과 상태 변화를 완료해야 합니다.' : `\n\n${note || '인쇄된 채집 조우를 해결했다.'}`}`,
          timestamp: Date.now()
        }, ...s.journals]
      };
      if (pending.source === 'barrow-delve' && next.activeDelve) {
        const attempt = resolveBarrowForageAttempt(`barrow:attempt:${pending.transactionId}`, toBarrowRuntime(next));
        if (attempt.value) next = applyBarrowRuntime(next, attempt.value);
      }
      return enqueueManualDrafts(next, [manualDraft]);
    });
    return true;
  };

  const handleCompleteManualFollowUp = async (followUpId: string) => {
    const followUp = state.pendingManualFollowUps.find(row => row.id === followUpId && row.status === 'pending');
    if (!followUp) return;
    const note = await requestControlledPrompt({
      title: '후속 판정 기록',
      message: followUp.description,
      defaultValue: '화면에 표시된 조건을 확인하고 후속 판정을 완료했다.',
      kicker: '직접 판정',
      label: '해결 기록',
      inputMode: 'multiline'
    });
    if (!note?.trim()) return;
    const transaction = createClientTransaction('manual-follow-up');
    updateState(s => {
      const current = s.pendingManualFollowUps.find(row => row.id === followUpId && row.status === 'pending');
      if (!current || s.appliedTransactionIds.includes(transaction.id)) return s;
      return {
        ...s,
        pendingManualFollowUps: s.pendingManualFollowUps.map(row => row.id === followUpId ? { ...row, status: 'resolved' as const } : row),
        appliedTransactionIds: [...s.appliedTransactionIds, transaction.id],
        journals: [{
          id: `${transaction.id}:journal`,
          title: `후속 판정 완료: ${current.ownerId}`,
          text: `${current.description}\n\n${note.trim()}`,
          timestamp: transaction.at
        }, ...s.journals]
      };
    });
  };

  const currentRulebookRequest = activeTravelEncounter
    ? { entryId: activeTravelEncounter.id ? `encounter:${activeTravelEncounter.id}` : undefined, page: activeTravelEncounter.sourcePage, query: activeTravelEncounter.title, title: '현재 Travel Encounter' }
    : activeForageEncounter
      ? { entryId: activeForageEncounter.id ? `encounter:${activeForageEncounter.id}` : undefined, page: activeForageEncounter.sourcePage, query: activeForageEncounter.title, title: '현재 Foraging Encounter' }
      : referenceForJournalTab(activeTab, state);

  return (
    <div className={`journal-app journal-app--${activeTab}`}>
      {/* Header Banner */}
      <header className="journal-header">
        <button type="button" className="journal-brand" onClick={() => changeActiveTab('play')} aria-label="오늘의 여행 첫 페이지로 돌아가기">
          <span className="journal-brand__eyebrow">Bristley Woods · A travelling apothecary's field notes</span>
          <h1 className="journal-brand__title"><span>APAW</span><span>THECARIA</span></h1>
          <span className="journal-brand__edition">들녘 일지 · 제1권</span>
        </button>

        <div className="journal-header__utilities">
          <button type="button" className="journal-header__action" onClick={() => setRulebookRequest(currentRulebookRequest)} aria-label="현재 페이지의 룰북 맥락 열기" title="현재 페이지의 룰북 맥락">
            <span className="emoji-icon" aria-hidden="true">📚</span><span>룰북</span>
          </button>
          {isFirebaseConfigured && auth && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', background: 'var(--primary-light)', borderRadius: '20px', border: '1.5px solid var(--glass-border)' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="프로필" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>사용자</span>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{user.displayName || '약제사'}</span>
                <button type="button" className="journal-header__icon-button" onClick={() => void openCloudSlots()} aria-label="클라우드 기록" title="클라우드 기록">
                  <span className="emoji-icon" aria-hidden="true">☁️</span><span>클라우드 기록</span>
                </button>
                <button className="journal-header__icon-button" onClick={handleSignOut} title="동기화 연결 해제">
                  <span className="emoji-icon" aria-hidden="true">🚪</span><span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button onClick={handleSignIn} className="journal-header__action" aria-label="Google 기록 동기화" title="Google 기록 동기화">
                <span className="emoji-icon" aria-hidden="true">☁️</span><span>Google 기록 동기화</span>
              </button>
            )
          )}
          <button onClick={handleReset} className="journal-header__action journal-header__action--reset" aria-label="새 기록지 시작" title="새 기록지 시작">
            <span className="emoji-icon" aria-hidden="true">🔄</span><span>새 기록지 시작</span>
          </button>
          {state.manualEffectQueue.length > 0 && !state.pendingManualEffect && (
            <button type="button" className="pending-action-button" onClick={() => updateState(s => ({ ...s, pendingManualEffect: s.manualEffectQueue[0] || null, manualEffectDraft: s.manualEffectQueue[0] || null }))}>
              보류 판정 {state.manualEffectQueue.length}개
            </button>
          )}
          <span className="save-state" role="status" aria-live="polite">
            {isFirebaseConfigured && user ? (state.offlineOutbox.length > 0 ? '로컬 저장 · 동기화 대기' : '로컬 우선 · 동기화 연결') : '로컬 저장'}
          </span>
        </div>
      </header>

      <JournalNavigation activeTab={activeTab} onChange={changeActiveTab} />

      <div className="grid-dashboard">
        {/* =================================================================
            SIDEBAR PANEL
           ================================================================= */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Navigation panel */}
          <div className="glass-panel cute-border" style={{ padding: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {[
                { id: 'play', label: '여정 일지', sub: '여정과 달력' },
                { id: 'bio', label: '약제사 정보', sub: '초상과 배낭' },
                { id: 'reagents', label: '약초 관찰기', sub: '약재와 제조법' },
                { id: 'ailments', label: '진료 기록', sub: '병증과 처방' },
                { id: 'almanack', label: '자연사 색인', sub: '규칙과 도감 색인' },
                { id: 'patientArchive', label: '환자 기록장', sub: '기억 속 야수들' },
                { id: 'livingArchive', label: '살아 있는 기록들', sub: '표본과 이야기' },
                { id: 'map', label: '접어둔 지도', sub: '가시덤불 숲' },
                { id: 'journals', label: '들녘의 일지', sub: '방랑기' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => changeActiveTab(t.id as JournalTab)}
                  className={`nav-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{t.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Profile Summary */}
          <div className="glass-panel" style={{ padding: '1.2rem', background: '#fffefa' }}>
            <h3 style={{ borderBottom: '1.5px dashed var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Poulticepounder 기록</span>
              <span className="journal-stamp" style={{ color: getReputationRank(state.reputation).color, borderColor: getReputationRank(state.reputation).color }}>
                {getReputationRank(state.reputation).rank}
              </span>
            </h3>
            {state.bio.name ? (
              <div className="prose-summary">
                <strong>{state.bio.animal || state.bio.examples}</strong> 약제사 <strong>{state.bio.name}</strong>.
                <br />
                {state.bio.travelStyle}으로 여행하며, 길드에서는 {getReputationRank(state.reputation).rank} <span className="dim">(명성 {state.reputation})</span>.

                {state.bio.familiarName && (
                  <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '0.45rem', paddingTop: '0.45rem' }}>
                    🐾 길동무 <strong>{state.bio.familiarName}</strong>{state.bio.familiarAnimal ? ` (${state.bio.familiarAnimal})` : ''}.
                    <br />
                    <span className="dim">{state.bio.familiarBenefit}.</span>
                    {state.activePassenger && (
                      <>
                        <br />
                        <span className="dim">승객 {state.activePassenger.name}의 임시 역할: {state.activePassenger.roleBenefit}.</span>
                      </>
                    )}
                  </div>
                )}

                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '0.45rem', paddingTop: '0.45rem' }}>
                  🎒 배낭 <span style={{ color: isOverEncumbered ? 'var(--accent-red)' : 'var(--primary)', fontWeight: 'bold' }}>{formatWeight(currentWeight)}</span> / {maxCarry}
                  <div className="bag-progress">
                    <div
                      className="bag-progress__fill"
                      style={{
                        width: `${Math.min(100, (currentWeight / maxCarry) * 100)}%`,
                        background: isOverEncumbered ? 'var(--accent-red)' : currentWeight / maxCarry > 0.8 ? 'var(--accent-orange)' : 'var(--primary)'
                      }}
                    />
                  </div>
                  {isOverEncumbered && (
                    <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                      ⚠️ 과다적재! 이동이 1경로로 고정됩니다.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                [약제사 시트] 탭에서 이름을 작성하고 캐릭터를 잠금해제 하세요!
              </div>
            )}
          </div>

          {/* Current Journey Calendar */}
          <div className="glass-panel journey-record" style={{ padding: '1.2rem', textAlign: 'left', background: '#fffefa' }}>
              <span className="document-kicker">여정 / 일정</span>
            {state.journeyActive ? (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{state.journeyDestination}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  방향: {state.journeyDirection} | 거리 형태: {state.journeyDistance} · 총거리: {state.journeyTotalDistance || 0}경로
                </div>

                <div className="calendar-counter" style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{state.calendarDays}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/</div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{state.calendarMaxDays} 일</div>
                </div>

                {state.rulesetId === 'sandbox' && <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.8rem' }}>
                  <button onClick={() => updateState(s => ({ ...s, calendarDays: s.calendarDays + 1 }))} style={{ flex: 1, padding: '0.3rem', background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.8rem' }}>+1일 경과</button>
                  <button onClick={() => updateState(s => ({ ...s, calendarDays: Math.max(0, s.calendarDays - 1) }))} style={{ padding: '0.3rem 0.5rem', background: '#f5f5f5', color: '#666', borderRadius: '4px', fontSize: '0.8rem' }}>-1</button>
                </div>}
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                활성화된 여정이 없습니다.
              </div>
            )}
          </div>
        </aside>

        {/* =================================================================
            MAIN CONTENT VIEWS
           ================================================================= */}
        <main className="glass-panel main-content-panel">
          {state.pendingManualFollowUps.some(row => row.status === 'pending') && (
            <section id="pending-follow-ups" className="pending-follow-ups" aria-labelledby="pending-follow-ups-title">
              <header><span className="document-kicker">잊지 말아야 할 일</span><h2 id="pending-follow-ups-title">남은 후속 판정</h2></header>
              <div className="pending-follow-ups__list">
                {state.pendingManualFollowUps.filter(row => row.status === 'pending').map(row => (
                  <article key={row.id}>
                    <div><strong>{PRINTED_EFFECT_BY_OWNER.get(row.ownerId)?.ownerName || row.ownerId}</strong><p><Suspense fallback={row.description}><LocalizedManualEffectText text={row.description} /></Suspense></p></div>
                    <button type="button" onClick={() => handleCompleteManualFollowUp(row.id)}>완료 기록</button>
                  </article>
                ))}
              </div>
            </section>
          )}
          {activeTab === 'play' && (
            <>
              <TodayOverview
                state={state}
                currentWeight={currentWeight}
                maxCarry={maxCarry}
                onNavigate={setActiveTab}
                onContinue={() => {
                  const focusContinueTarget = () => {
                    const encounterDialog = document.querySelector<HTMLElement>('.encounter-dialog-backdrop .encounter-dialog');
                    if (state.pendingEncounter || activeTravelEncounter || state.pendingForaging || activeForageEncounter) {
                      encounterDialog?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      encounterDialog?.focus();
                      return true;
                    }

                    const clickActionById = (ids: string[]) => {
                      for (const id of ids) {
                        const actionButton = document.querySelector<HTMLButtonElement>(`#action-hub .action-step[data-play-action-id="${id}"]:not(:disabled)`);
                        if (!actionButton) continue;
                        actionButton.click();
                        actionButton.focus({ preventScroll: true });
                        return true;
                      }
                      return false;
                    };

                    const currentBarrow = (state.barrows || []).find(b => !b.removed && b.locationName === state.currentLocationName);

                    const preferredActionIds: string[] = [];
                    if (!state.journeyActive) {
                      preferredActionIds.push('start-journey', 'downtime-activities', 'downtime-shop');
                    } else {
                      if (state.pendingEncounter) preferredActionIds.push('pending-encounter');
                      if (state.pendingForaging) preferredActionIds.push('pending-foraging');
                      if (state.pendingPatientArchive) preferredActionIds.push('archive-patient');
                      if (state.pursuedByBehemoth) preferredActionIds.push('behemoth-chase');
                      else if (state.activeDelve) preferredActionIds.push('active-delve');
                      else if (currentBarrow) preferredActionIds.push('barrow-here');
                      if (state.scroungingMode) preferredActionIds.push('scrounging');
                      if (state.needsLocalHelpBeforeMove && !state.activeAilment && !state.scroungingMode) preferredActionIds.push('local-help');
                      if (!state.needsLocalHelpBeforeMove && !state.pursuedByBehemoth) preferredActionIds.push('travel-next');
                      if (state.activeAilment) {
                        preferredActionIds.push('active-patient', 'barter-reagent', 'clinic-open');
                      } else {
                        preferredActionIds.push('clinic-open');
                      }
                    }

                    if (!clickActionById(preferredActionIds)) {
                      const fallbackAction = document.querySelector<HTMLButtonElement>('#action-hub .action-step:not(:disabled)');
                      if (fallbackAction) {
                        fallbackAction.click();
                        fallbackAction.focus({ preventScroll: true });
                        return true;
                      }

                      const fallbackPanels = !state.journeyActive
                        ? ['journey-start-panel', 'downtime-panel']
                        : (() => {
                          const panels = [];
                          if (state.pendingPatientArchive) panels.push('pending-archive-panel');
                          if (state.pendingEncounter || state.pendingForaging) panels.push('travel-panel');
                          if (state.activeDelve || ((state.barrows || []).some(b => !b.removed && b.locationName === state.currentLocationName)) || state.needsLocalHelpBeforeMove) panels.push('barrow-panel');
                          if (state.activeAilment || state.scroungingMode || state.pursuedByBehemoth) panels.push('patient-clinic-panel');
                          if (!state.pursuedByBehemoth && !state.needsLocalHelpBeforeMove) panels.push('travel-panel');
                          return panels;
                        })();

                      for (const panelId of fallbackPanels) {
                        const panel = document.getElementById(panelId);
                        if (panel) {
                          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          return true;
                        }
                      }
                    }
                    return false;
                  };

                  const actionHub = document.getElementById('action-hub');
                  const pendingFollowUps = document.getElementById('pending-follow-ups');
                  if (focusContinueTarget()) return;
                  (pendingFollowUps || actionHub)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                onOpenReference={setRulebookRequest}
              />
              <BarrowPanel delve={state.activeDelve} />
              <PlayView
                state={state}
                updateState={updateState}
                currentWeight={currentWeight}
                activeTravelEncounter={activeTravelEncounter}
                setActiveTravelEncounter={setActiveTravelEncounter}
                activeForageEncounter={activeForageEncounter}
                setActiveForageEncounter={setActiveForageEncounter}
                seasonedDraws={seasonedDraws}
                setSeasonedDraws={setSeasonedDraws}
                showSeasonedModal={showSeasonedModal}
                setShowSeasonedModal={setShowSeasonedModal}
                titanwiseDraws={titanwiseDraws}
                setTitanwiseDraws={setTitanwiseDraws}
                showTitanwiseModal={showTitanwiseModal}
                setShowTitanwiseModal={setShowTitanwiseModal}
                handleRetireClick={handleRetireClick}
                handleLegacyClinicRest={handleLegacyClinicRest}
                handleFamiliarSpendTime={handleFamiliarSpendTime}
                handleFamiliarFeedReagent={handleFamiliarFeedReagent}
                handlePassHour={handlePassHour}
                handleBarterProgressToDeal={handleBarterProgressToDeal}
                handleBarterFinalize={handleBarterFinalize}
                requestControlledPrompt={requestControlledPrompt}
                onOpenReference={setRulebookRequest}
                onOpenFullMap={() => changeActiveTab('map')}
                pendingMapTravel={pendingMapTravel}
                onConsumePendingMapTravel={() => setPendingMapTravel(null)}
              />
            </>
          )}
          {activeTab !== 'play' && (
            <>
              <ChapterOpening
                tab={activeTab}
                state={state}
                currentWeight={currentWeight}
                maxCarry={maxCarry}
                onReturnToToday={() => {
                  setActiveTab('play');
                  window.setTimeout(() => document.getElementById('action-hub')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                }}
                onOpenReference={setRulebookRequest}
              />
              <section
                className={`journal-chapter journal-chapter--${activeTab}`}
                aria-label={`${({
                  ailments: '진료 수첩',
                  reagents: '약초 도감',
                  bio: '배낭과 약제사',
                  map: '접어둔 지도',
                  almanack: '자연사 색인',
                  patientArchive: '환자 기록장',
                  livingArchive: '표본과 기억',
                  journals: '들녘의 일지'
                } as Record<string, string>)[activeTab] || '현재 기록'} 장`}
              >
                {activeTab === 'bio' && <BioView state={state} updateState={updateState} currentWeight={currentWeight} handleRetireClick={handleRetireClick} />}
                {activeTab === 'reagents' && (
                  <ReagentsView
                    state={state}
                    updateState={updateState}
                    search={searchReagent}
                    setSearch={setSearchReagent}
                    filter={reagentFilter}
                    setFilter={setReagentFilter}
                    typeFilter={reagentTypeFilter}
                    setTypeFilter={setReagentTypeFilter}
                  />
                )}
                {activeTab === 'ailments' && (
                  <AilmentsView
                    state={state}
                    updateState={updateState}
                    search={searchAilment}
                    setSearch={setSearchAilment}
                    filter={ailmentFilter}
                    setFilter={setAilmentFilter}
                  />
                )}
                {activeTab === 'almanack' && (
                  <Suspense fallback={<div className="panel-loading" role="status">자연사 색인을 여는 중...</div>}>
                    <AlmanackPanel
                      ownedIds={state.bag.flatMap(item => [item.canonicalReagentId, item.canonicalToolId].filter((id): id is string => Boolean(id)))}
                      discoveredIds={(state.worldAlmanac || []).map(row => row.name)}
                      pendingManualEffects={state.manualEffectQueue}
                      manualEffectRecords={state.manualEffectRecords}
                    />
                  </Suspense>
                )}
                {activeTab === 'patientArchive' && (
                  <PatientArchiveView
                    state={state}
                    updateState={updateState}
                    highlightedPatientId={highlightedPatientId}
                    setHighlightedPatientId={setHighlightedPatientId}
                  />
                )}
                {activeTab === 'livingArchive' && (
                  <LivingArchiveView
                    state={state}
                    setActiveTab={changeActiveTab}
                    setHighlightedPatientId={setHighlightedPatientId}
                  />
                )}
                {activeTab === 'map' && (
                  <AtlasMapPanel
                    state={state}
                    updateState={updateState}
                    onOpenReference={setRulebookRequest}
                  />
                )}
                {activeTab === 'journals' && (
                  <JournalsView
                    state={state}
                    updateState={updateState}
                    highlightedPatientId={highlightedPatientId}
                    setHighlightedPatientId={setHighlightedPatientId}
                  />
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {rulebookRequest && (
        <Suspense fallback={<div className="rulebook-drawer-backdrop"><div className="rulebook-drawer rulebook-drawer--loading" role="status">룰북 맥락을 여는 중...</div></div>}>
          <RulebookReferenceDrawer request={rulebookRequest} onClose={() => setRulebookRequest(null)} />
        </Suspense>
      )}

      {controlledPrompt && (
        <ControlledPromptDialog
          request={controlledPrompt}
          value={controlledPromptValue}
          onChange={setControlledPromptValue}
          onCancel={() => closeControlledPrompt(null)}
          onConfirm={() => closeControlledPrompt(controlledPromptValue)}
        />
      )}

      {state.pendingManualEffect && (
        <div className="phase4-modal-backdrop" role="presentation">
          <div className="phase4-modal" role="dialog" aria-modal="true" aria-label="직접 판정 기록">
            <Suspense fallback={<div className="manual-effect">판정 기록을 펼치는 중...</div>}>
              <ManualEffectPanel
              draft={state.pendingManualEffect}
              inventoryItems={state.bag.map(item => ({ id: item.id, name: localizeInventoryItemName(item.name) }))}
              timers={(state.patients.find(patient => patient.id === state.pendingManualEffect?.context.patientId) || state.patients.find(patient => patient.id === state.activePatientId))?.timers.filter(timer => timer.status === 'active').map(timer => ({ id: timer.id, label: `${timer.ailmentInstanceId} · ${timer.current}/${timer.maximum}` })) || []}
              onChange={draft => updateState(s => ({ ...s, pendingManualEffect: draft, manualEffectDraft: draft, manualEffectQueue: s.manualEffectQueue.map(row => row.effectId === draft.effectId ? draft : row) }))}
              onDefer={() => updateState(s => {
                if (!s.pendingManualEffect) return s;
                const deferred = { ...s.pendingManualEffect, status: 'deferred' as const, updatedAt: Date.now() };
                const queue = s.manualEffectQueue.map(row => row.effectId === deferred.effectId ? deferred : row);
                return { ...s, manualEffectQueue: queue, manualEffectDraft: deferred, pendingManualEffect: null };
              })}
              onResolve={override => {
                const transaction = createClientTransaction('manual-effect');
                const draft = state.pendingManualEffect!;
                const patient = state.patients.find(row => row.id === draft.context.patientId) || state.patients.find(row => row.id === state.activePatientId) || null;
                const resolved = resolveManualEffectTransaction({
                  draft,
                  transactionId: transaction.id,
                  override,
                  resolvedAt: transaction.at,
                  state: {
                    reputation: state.reputation,
                    trinkets: state.trinkets.length,
                    calendarDays: state.calendarDays,
                    foragingPoints: state.activeAilment?.foragingPoints || 0,
                    inventory: toEngineInventory(state.bag),
                    patient,
                    conditions: state.manualConditions,
                    pendingFollowUps: state.pendingManualFollowUps,
                    appliedTransactionIds: state.appliedTransactionIds
                  }
                });
                if (!resolved.value) {
                  showAlert(resolved.messages.join('\n'));
                  return;
                }
                updateState(s => {
                  const outcome = resolved.value!;
                  const stillPending = s.manualEffectQueue.some(row => row.effectId === draft.effectId && !row.transactionId);
                  const alreadyResolved = s.manualEffectRecords.some(record => record.effectId === draft.effectId);
                  if (!stillPending || alreadyResolved) return s;
                  const nextPatient = outcome.nextState.patient;
                  const queue = s.manualEffectQueue.filter(row => row.effectId !== draft.effectId);
                  const pendingFollowUps = [...new Map([...s.pendingManualFollowUps, ...outcome.nextState.pendingFollowUps].map(row => [row.id, row])).values()];
                  let next: GameState = {
                    ...s,
                    reputation: outcome.nextState.reputation,
                    trinkets: resizeTrinkets(s.trinkets, outcome.nextState.trinkets, '직접 판정 장신구'),
                    calendarDays: outcome.nextState.calendarDays,
                    cumulativeDays: (s.cumulativeDays || 0) + Math.max(0, outcome.nextState.calendarDays - s.calendarDays),
                    bag: fromEngineInventory(outcome.nextState.inventory, s.bag),
                    patients: nextPatient
                      ? replacePatient(s.patients, { ...nextPatient, foragingPoints: outcome.nextState.foragingPoints })
                      : s.patients,
                    manualConditions: Array.from(new Set([...s.manualConditions, ...outcome.nextState.conditions])),
                    pendingManualFollowUps: pendingFollowUps,
                    appliedTransactionIds: Array.from(new Set([...s.appliedTransactionIds, ...outcome.nextState.appliedTransactionIds])),
                    manualEffectQueue: queue,
                    manualEffectRecords: [...s.manualEffectRecords, outcome.record],
                    pendingManualEffect: queue[0] || null,
                    manualEffectDraft: queue[0] || null,
                    journals: [{
                      id: `${transaction.id}:journal`,
                      title: `${override ? '예외 처리' : '직접 판정'}: ${draft.summary}`,
                      text: `[${draft.ruleIds.join(', ')} · p.${draft.sourcePage}]\n${outcome.record.resultSummary}\n\n${outcome.record.journalNote}${override ? `\n\n예외 처리 사유: ${outcome.record.overrideReason}` : ''}`,
                      timestamp: transaction.at
                    }, ...s.journals]
                  };

                  const serviceTransactionId = draft.effectId.startsWith('service-followup:') ? draft.effectId.slice('service-followup:'.length) : null;
                  if (serviceTransactionId) {
                    const completed = completeGuildServiceDelivery({
                      transactionId: `${transaction.id}:service-delivery`,
                      state: toServiceRuntime(next),
                      serviceTransactionId,
                      confirmExternalDelivery: true
                    });
                    if (completed.value) next = applyServiceRuntime(next, completed.value.nextState);
                  }

                  if (draft.context.continuation === 'barter-social' && next.pendingBarter?.status === 'manual-social' && next.pendingBarter.socialEncounter && next.pendingBarter.firstCard) {
                    const barterPatient = next.patients.find(row => row.id === next.pendingBarter?.patientId);
                    if (barterPatient) {
                      const social = resolveBarterEncounter({
                        transactionId: `${transaction.id}:barter-continuation`,
                        state: toBarterRuntime(next, barterPatient),
                        card: next.pendingBarter.firstCard,
                        encounter: next.pendingBarter.socialEncounter,
                        manualConfirmed: true
                      });
                      if (social.value) next = applyBarterRuntime(next, social.value);
                    }
                  }
                  if (draft.context.continuation === 'travel') next = applyArrivalInstrumentEffects(next, draft.context.encounterTransactionId || transaction.id);
                  return next;
                });
              }}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Travel Encounter Dialog Modal */}
      {activeTravelEncounter && (() => {
        const printedEffect = PRINTED_EFFECT_BY_OWNER.get(activeTravelEncounter.id || state.pendingEncounter?.encounterId || '');
        const encTitle: string = printedEffect?.ownerName || activeTravelEncounter.title || '';
        const rawEncounterText: string = activeTravelEncounter.text || '';
        const protectionNotice = rawEncounterText.startsWith('[보호 적용]');
        const encText: string = printedEffect?.printedText || rawEncounterText;
        const secondaryDrawPhrases = [
          'draw a card', 'draw another card', 'pull another card', 'draw from the deck',
          '추가 카드', '다시 카드', '카드를 뽑', 'draw two cards', 'draw one card'
        ];
        const hasSecondaryDraw = secondaryDrawPhrases.some(phrase =>
          encText.toLowerCase().includes(phrase.toLowerCase()) ||
          encTitle.toLowerCase().includes(phrase.toLowerCase())
        );
        const canUseBeetleCompanion =
          (state.companionStates || []).some(comp => comp.companionId === 'beetle' && !comp.usedThisJourney) &&
          activeTravelEncounter.tags?.includes('Beast') && !activeTravelEncounter.tags?.includes('Behemoth');

        return (
          <div className="encounter-dialog-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-panel encounter-dialog" style={{ maxWidth: '600px', width: '100%', padding: '2rem', background: '#fff', position: 'relative', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', borderRadius: '20px', maxHeight: '92vh', overflowY: 'auto' }}>

              {/* Card header */}
              <div style={{ textAlign: 'center', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={getCardSvgUrl(activeTravelEncounter.suit, activeTravelEncounter.cardValue)}
                  alt={`${activeTravelEncounter.suitLabel} ${activeTravelEncounter.cardValue}`}
                  style={{ width: '100px', height: '150px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', marginBottom: '0.8rem' }}
                />
                <h2 style={{ color: 'var(--primary)', margin: '0.5rem 0 0 0' }}>여정 조우 <span style={{ fontWeight: 'normal', fontSize: '0.82em', color: 'var(--text-muted)' }}>p.{activeTravelEncounter.page}</span></h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>뽑은 카드: <strong>{activeTravelEncounter.cardValue} {activeTravelEncounter.suitLabel}</strong></div>
              </div>


              {/* Encounter title */}
              <h3 style={{ borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-bright)' }}>
                {encTitle}
              </h3>

              {/* Encounter body text */}
              <p style={{ fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '220px', overflowY: 'auto', background: '#faf8f4', padding: '1rem', borderRadius: '10px', color: 'var(--text-bright)', borderLeft: '4.5px solid var(--primary)' }}>
                {protectionNotice && <>보호 효과가 적용되어 이 조우의 모든 부정적 결과를 무시합니다.{"\n\n"}</>}
                <Suspense fallback={encText}><LocalizedManualEffectText kind="text" summary={encTitle} text={encText} /></Suspense>
              </p>

              {activeTravelEncounter.choices?.length > 0 && (
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.9rem' }}>
                  {activeTravelEncounter.choices.map((choice: any) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => {
                        setActiveTravelEncounter((current: any) => ({ ...current, selectedChoiceId: choice.id }));
                        updateState(s => ({ ...s, pendingEncounter: s.pendingEncounter ? { ...s.pendingEncounter, selectedChoiceId: choice.id } : null }));
                      }}
                      style={{ padding: '0.65rem', textAlign: 'left', border: activeTravelEncounter.selectedChoiceId === choice.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: '#fff', borderRadius: '6px' }}
                    >
                      <Suspense fallback={choice.label}><LocalizedManualEffectText kind="option" text={choice.label} /></Suspense>
                    </button>
                  ))}
                </div>
              )}

              {/* Secondary draw guidance */}
              {hasSecondaryDraw && (
                <div style={{ marginTop: '0.9rem', padding: '0.8rem 1rem', background: '#f0f4ff', border: '1.5px dashed #7a8ec9', borderRadius: '10px', fontSize: '0.88rem', lineHeight: 1.65 }}>
                  <div style={{ fontWeight: 'bold', color: '#3a4c8a', marginBottom: '0.35rem' }}>🎴 추가 카드 뽑기 필요</div>
                  <div style={{ color: '#3a4c8a', marginBottom: '0.6rem' }}>
                    이 조우는 추가 카드 뽑기를 요구합니다.<br />
                    실제 덱이나 앱의 카드 뽑기 도구를 사용해 다음 지시를 처리하십시오.
                  </div>
                  <TravelSecondaryDrawSlot />
                </div>
              )}

              {/* Effect shortcuts */}
              {state.rulesetId === 'sandbox' && <div style={{ marginTop: '0.9rem', padding: '0.75rem', background: '#fbfaf4', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>조우 효과 적용</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {([
                    ['gainFP', '채집 포인트 +'],
                    ['loseFP', '채집 포인트 −'],
                    ['gainTime', '타이머 +'],
                    ['loseTime', '타이머 −'],
                    ['gainReagent', '약재 획득'],
                    ['loseReagent', '약재 분실'],
                    ['gainTrinket', '장신구 획득'],
                    ['loseTrinket', '장신구 분실'],
                    ['gainRep', '명성 +'],
                    ['loseRep', '명성 −'],
                    ['markDay', '일정 +일'],
                    ['startPursuit', '거수 추격 시작'],
                    ['clearPursuit', '거수 추격 종료'],
                    ['moveSettlement', '정착지로 이동'],
                    ['endJourney', '여정 종료']
                  ] as [string, string][]).map(([effect, label]) => (
                    <button
                      key={effect}
                      type="button"
                      onClick={() => applyEncounterStateEffect(effect as any)}
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem', border: '1px solid var(--glass-border)', background: '#fffefa', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {label}
                    </button>
                  ))}
                  {canUseBeetleCompanion && (
                    <button
                      type="button"
                      onClick={() => handleUseBeetleCompanion(encTitle)}
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem', border: '1px solid #8e6d3a', background: '#fff7df', color: '#7a4a10', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      딱정벌레 보호 사용
                    </button>
                  )}
                </div>
              </div>}

              {canUseBeetleCompanion && state.rulesetId !== 'sandbox' && (
                <button type="button" onClick={() => handleUseBeetleCompanion(encTitle)} className="btn-cozy-secondary" style={{ marginTop: '0.9rem' }}>
                  딱정벌레 보호 사용
                </button>
              )}

              {/* Action buttons */}
              <div className="encounter-dialog-actions" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => resolveCanonicalEncounter('')}
                  style={{ flex: 1, padding: '0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  조우 판정 계속
                </button>
                <button onClick={() => {
                  setDeferredEncounterId(state.pendingEncounter?.transactionId || null);
                  setActiveTravelEncounter(null);
                }} style={{ padding: '0.8rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>나중에 계속</button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Foraging Encounter Dialog Modal */}
      {activeForageEncounter && (() => {
        const printedEffect = PRINTED_EFFECT_BY_OWNER.get(activeForageEncounter.id || state.pendingForaging?.encounterId || '');
        const encTitle: string = printedEffect?.ownerName || activeForageEncounter.title || '';
        const rawEncounterText: string = activeForageEncounter.text || '';
        const protectionNotice = rawEncounterText.startsWith('[Forecast]');
        const encText: string = printedEffect?.printedText || rawEncounterText;
        const secondaryDrawPhrases = [
          'draw a card', 'draw another card', 'pull another card', 'draw from the deck',
          '추가 카드', '다시 카드', '카드를 뽑', 'draw two cards', 'draw one card'
        ];
        const hasSecondaryDraw = secondaryDrawPhrases.some(phrase =>
          encText.toLowerCase().includes(phrase.toLowerCase()) ||
          encTitle.toLowerCase().includes(phrase.toLowerCase())
        );
        const closeForageEncounter = () => {
          if (resolveCanonicalForageEncounter('')) {
            if (state.pendingLeaveObligation?.kind === 'foraging-encounter') {
              updateState((s: GameState) => ({
                ...s,
                pendingLeaveObligation: s.pendingLeaveObligation ? { ...s.pendingLeaveObligation, resolved: true } : null
              }));
            }
            setActiveForageEncounter(null);
          }
        };

        return (
          <div className="encounter-dialog-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-panel encounter-dialog" style={{ maxWidth: '600px', width: '100%', padding: '2rem', background: '#fff', position: 'relative', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', borderRadius: '20px', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={getCardSvgUrl(activeForageEncounter.suit, activeForageEncounter.cardValue)}
                  alt={`${activeForageEncounter.suitLabel} ${activeForageEncounter.cardValue}`}
                  style={{ width: '100px', height: '150px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', marginBottom: '0.8rem' }}
                />
                <h2 style={{ color: 'var(--primary)', margin: '0.5rem 0 0 0' }}>채집 및 조우 <span style={{ fontWeight: 'normal', fontSize: '0.82em', color: 'var(--text-muted)' }}>p.{activeForageEncounter.page}</span></h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>뽑은 카드: {activeForageEncounter.cardValue} {activeForageEncounter.suitLabel}</div>
              </div>

              <h3 style={{ borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-bright)' }}>
                {encTitle}
              </h3>

              <p style={{ fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', background: '#faf8f4', padding: '1rem', borderRadius: '10px', color: 'var(--text-bright)', borderLeft: '4.5px solid var(--primary)' }}>
                {protectionNotice && <>Forecast가 적용되어 Weather 태그 조우의 모든 부정적 결과를 무시합니다.{"\n\n"}</>}
                <Suspense fallback={encText}><LocalizedManualEffectText kind="text" summary={encTitle} text={encText} /></Suspense>
              </p>

              {activeForageEncounter.choices?.length > 0 && (
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.9rem' }}>
                  {activeForageEncounter.choices.map((choice: { id: string; label: string }) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => {
                        setActiveForageEncounter((current: any) => ({ ...current, selectedChoiceId: choice.id }));
                        updateState(s => ({
                          ...s,
                          pendingForaging: s.pendingForaging ? { ...s.pendingForaging, selectedChoiceId: choice.id } : null
                        }));
                      }}
                      style={{ padding: '0.65rem', textAlign: 'left', border: activeForageEncounter.selectedChoiceId === choice.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: '#fff', borderRadius: '6px' }}
                    >
                      <Suspense fallback={choice.label}><LocalizedManualEffectText kind="option" text={choice.label} /></Suspense>
                    </button>
                  ))}
                </div>
              )}

              {/* Secondary draw guidance */}
              {hasSecondaryDraw && (
                <div style={{ marginTop: '0.9rem', padding: '0.8rem 1rem', background: '#f0f4ff', border: '1.5px dashed #7a8ec9', borderRadius: '10px', fontSize: '0.88rem', lineHeight: 1.65 }}>
                  <div style={{ fontWeight: 'bold', color: '#3a4c8a', marginBottom: '0.35rem' }}>🎴 추가 카드 뽑기 필요</div>
                  <div style={{ color: '#3a4c8a', marginBottom: '0.6rem' }}>
                    이 조우는 추가 카드 뽑기를 요구합니다.<br />
                    실제 덱이나 앱의 카드 뽑기 도구를 사용해 다음 지시를 처리하십시오.
                  </div>
                  <TravelSecondaryDrawSlot />
                </div>
              )}

              <div style={{ marginTop: '1rem', background: '#f0f9f4', padding: '1rem', borderRadius: '10px', borderLeft: '4.5px solid var(--secondary)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--secondary)', fontSize: '0.95rem' }}>🌿 채집 발견 처리</h4>
                {activeForageEncounter.foundReagents.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {activeForageEncounter.foundReagents.map((find: ForageFind | string, idx: number) => {
                      const normalizedFind: ForageFind = typeof find === 'string'
                        ? { name: find.replace(/\s*\(.*/, ''), rarity: 0 }
                        : find;
                      return (
                        <li key={`${normalizedFind.name}_${idx}`} style={{ color: '#2b5e3d', fontWeight: 'bold' }}>
                          <span>{normalizedFind.name} {normalizedFind.rarity ? `(희귀도: ${normalizedFind.rarity}${normalizedFind.fpAvailable ? ', 채집 포인트 사용 가능' : ''})` : ''}</span>
                          <button
                            type="button"
                            onClick={() => handleAddForageFindToBag(normalizedFind, idx)}
                            disabled={Boolean(activeForageEncounter.selectedReagentId)}
                            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.55rem', fontSize: '0.75rem', background: 'var(--secondary)', color: '#fff', borderRadius: '4px', border: 'none' }}
                          >
                            {activeForageEncounter.selectedReagentId ? '선택 완료' : '부위 선택 후 가방에 추가'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                    영약재의 희귀도가 뽑은 카드 값보다 높아 발견하지 못했습니다. (+1 채집 포인트 획득)
                  </div>
                )}
              </div>

              {state.rulesetId === 'sandbox' && <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fbfaf4', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                <div className="document-kicker" style={{ marginBottom: '0.45rem' }}>조우 효과 적용</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    ['gainFP', '채집 포인트 +'],
                    ['loseFP', '채집 포인트 −'],
                    ['gainTime', '타이머 +'],
                    ['loseTime', '타이머 −'],
                    ['gainReagent', '영약재 획득'],
                    ['loseReagent', '영약재 분실'],
                    ['gainTrinket', '장신구 획득'],
                    ['loseTrinket', '장신구 분실'],
                    ['gainRep', '명성 +'],
                    ['loseRep', '명성 −'],
                    ['markDay', '일정 +일'],
                    ['startPursuit', '거수 추격 시작'],
                    ['clearPursuit', '거수 추격 종료'],
                    ['moveSettlement', '정착지로 이동'],
                    ['endJourney', '여정 종료']
                  ].map(([effect, label]) => (
                    <button
                      key={effect}
                      type="button"
                      onClick={() => applyEncounterStateEffect(effect as any)}
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem', border: '1px solid var(--glass-border)', background: '#fffefa', color: 'var(--text-muted)', borderRadius: '4px' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>}

              <div className="encounter-dialog-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={async () => {
                    const note = await requestControlledPrompt({
                      title: '채집 일지',
                      message: '채집 조우와 발견한 약초에 대한 소감을 남길 수 있습니다.',
                      defaultValue: '',
                      kicker: '채집 기록',
                      label: '선택 메모',
                      inputMode: 'multiline'
                    });
                    if (note !== null) {
                      updateState(s => {
                        const listStr = activeForageEncounter.foundReagents.length > 0
                          ? activeForageEncounter.foundReagents.map((find: ForageFind | string) => typeof find === 'string' ? find : `${find.name} (희귀도: ${find.rarity}${find.fpAvailable ? ', 채집 포인트 사용 가능' : ''})`).join(', ')
                          : '없음 (+1 채집포인트)';
                        return {
                          ...s,
                          journals: [
                            {
                              id: 'forage_' + Date.now(),
                              title: `🌿 채집 일지: ${encTitle}`,
                              text: `[페이지 ${activeForageEncounter.page} - 드로우: ${activeForageEncounter.cardValue} ${activeForageEncounter.suitLabel}]\n위치: ${s.currentLocationName} (${localizeRegionLabel(activeForageEncounter.region)} / ${localizeSeasonLabel(s.currentSeason)})\n조우 결과: ${encText}\n발견한 영약재: ${listStr}\n\n기록: ${note || '조심스럽게 약초 채집을 마무리했다.'}`,
                              timestamp: Date.now()
                            },
                            ...s.journals
                          ]
                        };
                      });
                    }
                    closeForageEncounter();
                  }}
                  style={{ flex: 1, padding: '0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}
                >
                  저널 기록 후 조우 해결
                </button>
                <button onClick={closeForageEncounter} style={{ padding: '0.8rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}>닫기</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Seasoned (베테랑 여행자) 카드 선택 모달 */}
      {showSeasonedModal && seasonedDraws.length === 2 && (
        <div className="card-choice-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
          <div className="glass-panel card-choice-dialog" style={{ maxWidth: '500px', width: '100%', padding: '2rem', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>🧭 베테랑 여행자 (Seasoned) 조우 선택</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              길동무의 베테랑 길잡이 혜택으로 2장의 카드 중 여정 조우에 적용할 카드를 선택합니다.
            </p>
            <div className="card-choice-options" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.8rem' }}>
              {seasonedDraws.map((card, idx) => {
                const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };
                const displayVal = card.val === 1 ? 'Ace' : card.val === 11 ? 'Jack' : card.val === 12 ? 'Queen' : card.val === 13 ? 'King' : card.val;
                return (
                  <div
                    className="card-choice-option"
                    key={idx}
                    onClick={() => {
                      // We need to trigger executeTravelMove which is defined inside PlayView.
                      // Since executeTravelMove is in PlayView, we can trigger a custom event or pass callbacks.
                      // Alternatively, we can dispatch a custom event or register a ref callback.
                      // But the simplest React way is to store the selected card in state, and let PlayView handle it,
                      // OR we can define executeTravelMove / executeForageDraw in App.tsx instead of PlayView.
                      // Actually, let's store the selection callback or selected card, or let's pass a handler!
                      // Let's pass the selection handler from PlayView up to App.
                      (window as any)._onSelectSeasonedCard?.(card.suit, card.val);
                      setShowSeasonedModal(false);
                      setSeasonedDraws([]);
                    }}
                    style={{
                      border: '2px solid var(--border-cozy)',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      background: '#fffdf9',
                      transition: 'transform 0.2s',
                      width: '120px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img
                      src={getCardSvgUrl(card.suit, card.val)}
                      alt={`${card.suit}${card.val}`}
                      style={{ width: '80px', height: '120px', objectFit: 'contain', marginBottom: '0.5rem' }}
                    />
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{suitLabels[card.suit]}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>{displayVal}</div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => { setShowSeasonedModal(false); setSeasonedDraws([]); }}
              style={{ padding: '0.6rem 1.2rem', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Titanwise (유적/고분 마스터) 카드 선택 모달 */}
      {showTitanwiseModal && titanwiseDraws.length === 2 && (
        <div className="card-choice-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
          <div className="glass-panel card-choice-dialog" style={{ maxWidth: '500px', width: '100%', padding: '2rem', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>🏛️ 유적/고분 마스터 (Titanwise) 채집 선택</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              티탄 유적이나 고분에서 2장의 카드 중 채집에 적용할 카드를 선택합니다.
            </p>
            <div className="card-choice-options" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.8rem' }}>
              {titanwiseDraws.map((card, idx) => {
                const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };
                const displayVal = card.val === 1 ? 'Ace' : card.val === 11 ? 'Jack' : card.val === 12 ? 'Queen' : card.val === 13 ? 'King' : card.val;
                return (
                  <div
                    className="card-choice-option"
                    key={idx}
                    onClick={() => {
                      (window as any)._onSelectTitanwiseCard?.(card.suit, card.val);
                      setShowTitanwiseModal(false);
                      setTitanwiseDraws([]);
                    }}
                    style={{
                      border: '2px solid var(--border-cozy)',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      background: '#fffdf9',
                      transition: 'transform 0.2s',
                      width: '120px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img
                      src={getCardSvgUrl(card.suit, card.val)}
                      alt={`${card.suit}${card.val}`}
                      style={{ width: '80px', height: '120px', objectFit: 'contain', marginBottom: '0.5rem' }}
                    />
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{suitLabels[card.suit]}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>{displayVal}</div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => { setShowTitanwiseModal(false); setTitanwiseDraws([]); }}
              style={{ padding: '0.6rem 1.2rem', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {showSuccessionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '2px solid var(--secondary)' }}>
            <h3 style={{ margin: 0, color: 'var(--secondary)', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌅 스승의 유산 계승
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.4 }}>
              <strong>{retiredApothecaryName}</strong> 약제사는 은퇴하여 Bristley Woods의 역사로 기록됩니다. 설립된 <strong>{clinicsBuiltCount}개</strong>의 약제소 본부는 지도에 영구적으로 보존되며, 다음 대의 제자가 계승하게 됩니다.
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.6rem' }}>
                🎁 다음 대 약제사에게 물려줄 유산 선택:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  onClick={() => handleSuccessionConfirm('sickle')}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}
                >
                  <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>🗡️ 스승의 명검: 은빛 낫 (Silver Sickle) 상속</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>개조된 은빛 낫 도구를 가방에 둔 채로 시작합니다. (채집 점수 +1 효과)</span>
                </button>
                <button
                  onClick={() => handleSuccessionConfirm('reputation')}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}
                >
                  <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>📜 길드 추천 서한: 시작 평판 +10으로 상향</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>길드 내 지명도를 인정받아 시작 평판이 5에서 10으로 증가합니다.</span>
                </button>
                <button
                  onClick={() => handleSuccessionConfirm('trinkets')}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}
                >
                  <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>🪙 비상용 장신구 주머니: 시작 장신구 8개 지급</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>초반 마차 확보나 도구 보강에 쓸 수 있게 장신구 8개를 들고 시작합니다.</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessionModal(false)}
              style={{ width: '100%', padding: '0.6rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              은퇴 결정 취소
            </button>
          </div>
        </div>
      )}

      {showCloudSlots && (
        <CloudSlotsDialog
          slots={cloudSlotViews}
          activeSlot={activeCloudSlot}
          busy={cloudSlotBusy}
          onDownload={slot => void handleDownloadCloudSlot(slot)}
          onUpload={slot => void handleUploadCloudSlot(slot)}
          onClose={() => setShowCloudSlots(false)}
        />
      )}
      {noticeQueue[0] && (
        <NoticeDialog message={noticeQueue[0]} onDismiss={dismissNotice} />
      )}
    </div>
  );
}

// =================================================================
// 5. PLAY VIEW COMPONENT
// =================================================================
type ActionHubTone = 'primary' | 'warning' | 'neutral' | 'done';

interface ActionHubItem {
  id: string;
  label: string;
  detail: string;
  meta?: string;
  targetId?: string;
  tone?: ActionHubTone;
  disabled?: boolean;
  activate?: () => void;
}

const locationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    City: '도시',
    city: '도시',
    Settlement: '정착지',
    settlement: '정착지',
    Wilds: '야생',
    wild: '야생',
    Ruin: '유적지',
    ruin: '유적지',
    Barrow: '야수 고분',
    barrow: '야수 고분',
    named: '이름난 장소'
  };
  return labels[type] || type || '미정';
};

const patientPersonalityLabel = (personality: string) => ({
  Witty: '재치 있는', Passionate: '열정적인', Snide: '빈정대는',
  Soft: '부드러운', Stoic: '묵묵한', Cruel: '잔인한',
  Furious: '격노한', Oblivious: '둔감한', Scared: '겁먹은',
  Joyous: '기쁨에 찬', Depressed: '침울한', Evasive: '회피적인',
  Immaterial: '초연한', Dreamy: '몽상적인', Distracted: '산만한',
  Suspicious: '의심 많은', Curious: '호기심 많은', Secretive: '비밀스러운',
  Loud: '목소리 큰', Disgusting: '불쾌한', Brash: '거침없는',
  Radiant: '빛나는', Generous: '너그러운', Energetic: '활기찬',
  Cool: '냉정한', Calm: '차분한', Collected: '침착한',
  Whelmed: '벅찬', Draining: '기운 빠지게 하는', Killjoy: '흥을 깨는',
  Anxious: '불안한', Skittish: '겁 많은', Jubilant: '환희에 찬',
  Distant: '거리감 있는', Righteous: '정의로운', Rebellious: '반항적인'
} as Record<string, string>)[personality] || personality;

interface ControlledPromptOption {
  value: string;
  label: string;
}

interface ControlledPromptRequest {
  title: string;
  message: string;
  defaultValue: string;
  options?: ControlledPromptOption[];
  label?: string;
  inputMode?: 'text' | 'number' | 'multiline';
  kicker?: string;
}

function CloudSlotsDialog({
  slots,
  activeSlot,
  busy,
  onDownload,
  onUpload,
  onClose
}: {
  slots: CloudSlotView[];
  activeSlot: CloudSlotId;
  busy: boolean;
  onDownload: (slot: CloudSlotId) => void;
  onUpload: (slot: CloudSlotId) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="phase4-modal-backdrop controlled-prompt-backdrop app-dialog-backdrop"
      role="presentation"
      onKeyDown={event => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <section
        className="phase4-modal controlled-prompt app-dialog app-dialog--slots"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloud-slots-title"
        aria-describedby="cloud-slots-message"
      >
        <header className="app-dialog__header">
          <div>
            <span className="app-dialog__kicker">Google 기록</span>
            <h2 id="cloud-slots-title">클라우드 기록</h2>
          </div>
        </header>
        <p id="cloud-slots-message" className="app-dialog__message">
          슬롯은 최대 3개입니다. 지금 클라우드에 있던 기록은 슬롯 1에 있습니다. 다른 기기에서 맞추려면 슬롯을 고른 뒤 내려받거나 올리세요.
        </p>
        <ol className="cloud-slots">
          {slots.map(slot => (
            <li key={slot.slot} className={`cloud-slot${slot.empty ? ' cloud-slot--empty' : ''}${slot.slot === activeSlot ? ' cloud-slot--active' : ''}`}>
              <div className="cloud-slot__meta">
                <strong>슬롯 {slot.slot}</strong>
                <span>{slot.empty ? '비어 있음' : (slot.name || '이름 없는 기록')}</span>
                <time dateTime={slot.uploadedAt || undefined}>
                  마지막 업로드 {slot.empty ? '없음' : formatCloudSlotUploadedAt(slot.uploadedAt)}
                </time>
                {slot.slot === activeSlot && !slot.empty && <em>이 기기 자동 저장</em>}
              </div>
              <div className="cloud-slot__actions">
                <button type="button" disabled={busy || slot.empty} onClick={() => onDownload(slot.slot)}>
                  데이터 내려받기
                </button>
                <button type="button" className="app-dialog__primary" disabled={busy} onClick={() => onUpload(slot.slot)}>
                  클라우드에 올리기
                </button>
              </div>
            </li>
          ))}
        </ol>
        <footer className="controlled-prompt__actions app-dialog__actions">
          <button type="button" autoFocus onClick={onClose}>닫기</button>
        </footer>
      </section>
    </div>
  );
}

function NoticeDialog({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="phase4-modal-backdrop controlled-prompt-backdrop app-dialog-backdrop"
      role="presentation"
      onKeyDown={event => {
        if (event.key === 'Escape') onDismiss();
      }}
    >
      <section
        className="phase4-modal controlled-prompt app-dialog app-dialog--notice"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-notice-title"
        aria-describedby="app-notice-message"
      >
        <header className="app-dialog__header">
          <div>
            <span className="app-dialog__kicker">여행 기록</span>
            <h2 id="app-notice-title">안내</h2>
          </div>
        </header>
        <p id="app-notice-message" className="app-dialog__message">{message}</p>
        <footer className="controlled-prompt__actions app-dialog__actions">
          <button className="app-dialog__primary" type="button" autoFocus onClick={onDismiss}>확인</button>
        </footer>
      </section>
    </div>
  );
}

function ControlledPromptDialog({
  request,
  value,
  onChange,
  onCancel,
  onConfirm
}: {
  request: ControlledPromptRequest;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="phase4-modal-backdrop controlled-prompt-backdrop app-dialog-backdrop"
      role="presentation"
      onKeyDown={event => {
        if (event.key === 'Escape') onCancel();
      }}
    >
      <form
        className="phase4-modal controlled-prompt app-dialog app-dialog--prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="controlled-prompt-title"
        aria-describedby="controlled-prompt-message"
        onSubmit={event => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <header className="app-dialog__header">
          <div>
            <span className="app-dialog__kicker">{request.kicker || '여행 기록 선택'}</span>
            <h2 id="controlled-prompt-title">{request.title}</h2>
          </div>
        </header>
        <p id="controlled-prompt-message" className="app-dialog__message">{request.message}</p>
        <div className="app-dialog__field">
        <label htmlFor="controlled-prompt-input">{request.label || '선택'}</label>
        {request.options ? (
          <select
            id="controlled-prompt-input"
            value={value}
            onChange={event => onChange(event.target.value)}
            autoFocus
          >
            {request.options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : request.inputMode === 'multiline' ? (
          <textarea
            id="controlled-prompt-input"
            value={value}
            onChange={event => onChange(event.target.value)}
            rows={4}
            autoFocus
          />
        ) : (
          <input
            id="controlled-prompt-input"
            type={request.inputMode === 'number' ? 'number' : 'text'}
            value={value}
            onChange={event => onChange(event.target.value)}
            autoFocus
          />
        )}
        </div>
        <footer className="controlled-prompt__actions app-dialog__actions">
          <button type="button" onClick={onCancel}>취소</button>
          <button className="app-dialog__primary" type="submit">선택 확정</button>
        </footer>
      </form>
    </div>
  );
}

function IsolatedTextarea({
  valueRef,
  initialValue = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  valueRef: React.MutableRefObject<string>;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  valueRef.current = value;
  return (
    <textarea
      {...props}
      value={value}
      onChange={event => {
        const next = event.target.value;
        valueRef.current = next;
        setValue(next);
      }}
    />
  );
}

function PlayView({
  state,
  updateState,
  currentWeight,
  activeTravelEncounter,
  setActiveTravelEncounter,
  activeForageEncounter,
  setActiveForageEncounter,
  seasonedDraws,
  setSeasonedDraws,
  showSeasonedModal,
  setShowSeasonedModal,
  titanwiseDraws,
  setTitanwiseDraws,
  showTitanwiseModal,
  setShowTitanwiseModal,
  handleRetireClick,
  handleLegacyClinicRest,
  handleFamiliarSpendTime,
  handleFamiliarFeedReagent,
  handlePassHour,
  handleBarterProgressToDeal,
  handleBarterFinalize,
  requestControlledPrompt,
  onOpenReference,
  onOpenFullMap,
  pendingMapTravel,
  onConsumePendingMapTravel
}: {
  state: GameState;
  updateState: any;
  currentWeight: number;
  activeTravelEncounter: any;
  setActiveTravelEncounter: any;
  activeForageEncounter: any;
  setActiveForageEncounter: any;
  seasonedDraws: Array<{ suit: string; val: number }>;
  setSeasonedDraws: any;
  showSeasonedModal: boolean;
  setShowSeasonedModal: any;
  titanwiseDraws: Array<{ suit: string; val: number }>;
  setTitanwiseDraws: any;
  showTitanwiseModal: boolean;
  setShowTitanwiseModal: any;
  handleRetireClick: () => void;
  handleLegacyClinicRest: () => void;
  handleFamiliarSpendTime: () => void;
  handleFamiliarFeedReagent: (itemId: string) => void;
  handlePassHour: (amt?: number, timerIds?: string[]) => void;
  handleBarterProgressToDeal: () => void;
  handleBarterFinalize: (isSuccess: boolean, paidTrinketsCount?: number, paidReputationCount?: number) => void;
  requestControlledPrompt: (request: ControlledPromptRequest) => Promise<string | null>;
  onOpenReference: (request: RulebookReferenceRequest) => void;
  onOpenFullMap: () => void;
  pendingMapTravel: MapPickLocation | null;
  onConsumePendingMapTravel: () => void;
}) {
  const [destName, setDestName] = useState("");
  const journeyReasonRef = useRef("");
  const [destRegion, setDestRegion] = useState("Forest");
  const [destType, setDestType] = useState("Wilds");
  const [journeyDestinationCard, setJourneyDestinationCard] = useState<PlayingCard | null>(null);
  const [journeyGoalCard, setJourneyGoalCard] = useState<PlayingCard | null>(null);
  const journeyGoalPreview = useMemo(() => {
    if (!journeyGoalCard) return null;
    const key = getRuleCardLabel(journeyGoalCard);
    return Array.from(JOURNEY_GOAL_BY_ID.values()).find(row => row.cardKey === key) || null;
  }, [journeyGoalCard]);

  const journeyGraph = useMemo(
    () => toRuleMapGraph(state),
    [state.customMapLocations, state.customMapEdges, state.currentRegion]
  );
  const journeyOriginId = useMemo(
    () => findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName),
    [state.currentLocationName, state.customMapLocations]
  );
  const journeyDestinationCandidates = useMemo(
    () => journeyDestinationCard
      ? findJourneyDestinationCandidates({ graph: journeyGraph, originId: journeyOriginId, card: journeyDestinationCard as PlayingCard & { suit: CardSuit } })
      : [],
    [journeyDestinationCard, journeyGraph, journeyOriginId]
  );
  const selectedJourneyDestination = useMemo(
    () => journeyDestinationCandidates.find(row => row.id === destName) || null,
    [journeyDestinationCandidates, destName]
  );
  const journeyCandidateGroups = useMemo(() => {
    if (journeyDestinationCandidates.length === 0) return [];
    const near = journeyDestinationCandidates.filter(row => row.locationType === 'Settlement' && row.paths <= 12);
    const far = journeyDestinationCandidates.filter(row => row.locationType === 'Settlement' && row.paths >= 13 && row.paths <= 24);
    const overHorizon = journeyDestinationCandidates.filter(row => row.locationType === 'City' && row.paths >= 24);
    return [
      { key: 'near', label: '가까운 거리', range: '12경로 이하', candidates: near },
      { key: 'far', label: '먼 거리', range: '13~24경로', candidates: far },
      { key: 'overHorizon', label: '지평선 너머', range: '24경로 이상', candidates: overHorizon }
    ].filter(entry => entry.candidates.length > 0);
  }, [journeyDestinationCandidates]);
  const journeyDistanceBandText = useMemo(() => {
    if (!journeyDestinationCard) return '';
    const value = getRuleCardValue(journeyDestinationCard, 'table');
    if (value <= 6) return '가까운 거리(정착지 · 12경로 이하, 카드 값 A~6)';
    if (value <= 9) return '먼 거리(정착지 · 13~24경로, 카드 값 7~9)';
    return '지평선 너머(도시 · 24경로 이상, 카드 값 10~J/M)';
  }, [journeyDestinationCard]);
  const scroungeAdjacentRegions = useMemo(
    () => adjacentRuleRegions(state),
    [state.customMapLocations, state.customMapEdges, state.currentLocationName, state.currentSeason, state.currentRegion, state.bag]
  );

  const [newAilmentName, setNewAilmentName] = useState("");
  const [patientNameDraft, setPatientNameDraft] = useState("");
  const [patientSpeciesDraft, setPatientSpeciesDraft] = useState("");
  const [patientInitialNoteDraft, setPatientInitialNoteDraft] = useState("");
  const patientCreationPending = useRef(false);
  const [finalArchiveNoteDraft, setFinalArchiveNoteDraft] = useState("");
  const [isBookmarkedDraft, setIsBookmarkedDraft] = useState(false);
  const [pawnItemIds, setPawnItemIds] = useState<string[]>([]);

  // Concoction State
  const [selectedBagItems, setSelectedBagItems] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [usePurify, setUsePurify] = useState(false);

  const persistTreatmentDraft = (nextItemIds: string[], nextToolIds: string[], nextPurify: boolean) => {
    setSelectedBagItems(nextItemIds);
    setSelectedTools(nextToolIds);
    setUsePurify(nextPurify);
    const patient = state.patients.find(row => row.id === state.activePatientId);
    const ailment = patient?.ailments.find(row => row.status === 'active' && row.id === state.activeAilment?.id)
      || patient?.ailments.find(row => row.status === 'active');
    if (!patient || !ailment) return;
    const selectedParts = nextItemIds.flatMap(itemId => {
      const item = state.bag.find(row => row.id === itemId && row.type === 'reagent');
      return item ? [{ itemId, reagentId: item.canonicalReagentId || null, preparationId: item.preparationId || null }] : [];
    });
    const preparations = selectedParts.flatMap(part => part.reagentId && part.preparationId
      ? [REAGENT_BY_ID.get(part.reagentId)?.preparations.find(row => row.id === part.preparationId)]
      : []).filter(Boolean);
    const fair = preparations.reduce((sum, preparation) => sum + (preparation?.tags.filter(tag => tag.tag === 'FAIR').reduce((part, tag) => part + tag.value, 0) || 0), 0);
    const foul = nextPurify ? 0 : preparations.reduce((sum, preparation) => sum + (preparation?.tags.filter(tag => tag.tag === 'FOUL').reduce((part, tag) => part + tag.value, 0) || 0), 0);
    updateState((current: GameState) => {
      const now = Date.now();
      const previous = current.treatmentDraft?.patientId === patient.id && current.treatmentDraft.ailmentInstanceId === ailment.id
        ? current.treatmentDraft
        : null;
      return {
        ...current,
        treatmentDraft: {
          id: previous?.id || `treatment-draft:${patient.id}:${ailment.id}`,
          patientId: patient.id,
          ailmentInstanceId: ailment.id,
          selectedParts,
          selectedPreparationIds: selectedParts.flatMap(part => part.preparationId ? [part.preparationId] : []),
          selectedToolIds: nextToolIds,
          catalyse: previous?.catalyse || [],
          fair,
          foul,
          purify: nextPurify,
          replacementContext: current.pendingAlternativeAcquisition ? {
            kind: current.pendingAlternativeAcquisition.kind,
            targetTag: current.pendingAlternativeAcquisition.targetTag,
            requiredPotency: current.pendingAlternativeAcquisition.requiredPotency
          } : null,
          status: 'draft',
          committedTransactionId: null,
          createdAt: previous?.createdAt || now,
          updatedAt: now
        }
      };
    });
  };

  useEffect(() => {
    const draft = state.treatmentDraft;
    if (!draft || draft.status !== 'draft' || draft.patientId !== state.activePatientId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setSelectedBagItems(draft.selectedParts.map(part => part.itemId).filter(id => state.bag.some(item => item.id === id)));
      setSelectedTools(draft.selectedToolIds.filter(id => state.bag.some(item => item.id === id)));
      setUsePurify(draft.purify);
    });
    return () => { cancelled = true; };
  }, [state.treatmentDraft, state.activePatientId, state.bag]);

  // Manual Card Selector State
  const travelFormRef = useRef<HTMLFormElement>(null);
  const [nextLocName, setNextLocName] = useState(pendingMapTravel?.name || "");
  const [routeDraft, setRouteDraft] = useState<RouteDraft>({ stops: [], edgeKinds: [] });
  const routeDraftRef = useRef(routeDraft);
  routeDraftRef.current = routeDraft;
  const routeGraphNodes = useMemo(
    () => buildMapGraphNodes(state.customMapLocations || [], state.customMapEdges || []),
    [state.customMapLocations, state.customMapEdges]
  );
  const currentRouteOrigin = useMemo<RouteStop | null>(() => {
    const currentId = findMapLocationKey(state.currentLocationName, state.customMapLocations || [])
      || normalizeMapLocationName(state.currentLocationName);
    const node = currentId ? routeGraphNodes[currentId] : null;
    const clinicHere = (state.clinics || []).some(clinic =>
      findMapLocationKey(clinic.locationName, state.customMapLocations || []) === currentId
    );
    if (!node) {
      return {
        id: currentId || 'here',
        name: state.currentLocationName,
        kind: state.currentLocationType === 'City'
          ? 'City'
          : state.currentLocationType === 'Settlement'
            ? 'Settlement'
            : state.currentLocationType === 'Ruin'
              ? 'Ruin'
              : state.currentLocationType === 'Barrow'
                ? 'Barrow'
                : 'Wilds',
        terrain: terrainFromRegion(state.currentRegion),
        hasClinic: clinicHere,
        x: 50,
        y: 50
      };
    }
    return stopFromGraphNode(currentId, node, { hasClinic: clinicHere, name: node.label || state.currentLocationName });
  }, [routeGraphNodes, state.currentLocationName, state.currentLocationType, state.currentRegion, state.clinics, state.customMapLocations]);
  useEffect(() => {
    if (!currentRouteOrigin) return;
    setRouteDraft(previous => {
      if (previous.stops.length === 0) return draftFromOrigin(currentRouteOrigin);
      if (previous.stops[0].id === currentRouteOrigin.id) return previous;
      return draftFromOrigin(currentRouteOrigin);
    });
  }, [currentRouteOrigin]);
  const [travelCardMode, setTravelCardMode] = useState<'random' | 'manual'>('random');
  const [selectedTravelSuit, setSelectedTravelSuit] = useState('♥');
  const [selectedTravelValue, setSelectedTravelValue] = useState(1);
  const [travelDrawCard, setTravelDrawCard] = useState<PlayingCard | null>(null);

  const [forageCardMode, setForageCardMode] = useState<'random' | 'manual'>('random');
  const [selectedForageSuit, setSelectedForageSuit] = useState('♥');
  const [selectedForageValue, setSelectedForageValue] = useState(1);
  const [forageDrawCard, setForageDrawCard] = useState<PlayingCard | null>(null);
  const [forageLocationType, setForageLocationType] = useState<'current' | 'adjacent'>('current');
  const [forageAdjacentRegion, setForageAdjacentRegion] = useState<string>('Forest');

  const [barrowJournalNote, setBarrowJournalNote] = useState('');
  const [barrowSelectedItemIds, setBarrowSelectedItemIds] = useState<string[]>([]);
  const [barrowMoveTargetId, setBarrowMoveTargetId] = useState('');
  const [barrowEscapeItemIds, setBarrowEscapeItemIds] = useState<string[]>([]);
  const [barrowSelectedToolId, setBarrowSelectedToolId] = useState('');
  const barrowActionPendingRef = useRef(false);

  // Downtime state
  const [downtimeTab, setDowntimeTab] = useState<'activities' | 'shop' | 'companions' | 'start'>('activities');
  const [bypassShopRules, setBypassShopRules] = useState(false);
  const [rumourCards, setRumourCards] = useState<Array<{ text: string; suit: string; val: string }>>([]);
  const [rumourBarrowName, setRumourBarrowName] = useState('');
  const [rumourLocName, setRumourLocName] = useState('');
  const [gpAilment, setGpAilment] = useState('');
  const [gpTagChange, setGpTagChange] = useState('');
  const [gpReplacementTag, setGpReplacementTag] = useState('');
  const [gpNote, setGpNote] = useState('');
  const [scroungeReagentRegion, setScroungeReagentRegion] = useState("Forest");
  const [selectedAgendaService, setSelectedAgendaService] = useState("pantry");
  const [independentAdjRegion, setIndependentAdjRegion] = useState("Forest");

  const handlePickUpPassenger = () => {
    if (!canonicalWagonFromState(state).expansionIds.includes('passenger-booth')) {
      showAlert("조수석 부스를 먼저 설치해야 합니다.");
      return;
    }
    if (state.activePassenger) {
      showAlert("이미 동승 중인 승객이 있습니다.");
      return;
    }
    if (!state.passengerPickupReady) {
      showAlert("승객은 정착지에서 치료제를 거래한 뒤 모집할 수 있습니다.");
      return;
    }

    const name = prompt("태울 승객 이름:", "길손");
    if (!name) return;
    const graph = toServiceMapGraph(state);
    const originId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
    const destinationOptions = getPassengerDestinationOptions(graph, originId);
    if (destinationOptions.length === 0) {
      showAlert('현재 지도에서 승객 규칙을 만족하는 목적지를 찾을 수 없습니다.');
      return;
    }
    const destinationChoice = prompt(
      `승객 목적지를 고르세요.\n${destinationOptions.map((option, index) => `${index + 1}. ${option.destination} · 경로 ${option.distance}개 · 장신구 ${option.reward}`).join('\n')}`,
      '1'
    );
    if (!destinationChoice) return;
    const destination = destinationOptions[Math.max(0, (parseInt(destinationChoice, 10) || 1) - 1)];
    if (!destination) return;
    const roleChoice = prompt(
      `이 승객이 이동 중 맡을 임시 길동무 역할 번호를 고르세요:\n${FAMILIAR_BENEFITS.map((f, idx) => `${idx + 1}. ${f.name}`).join('\n')}`,
      "1"
    );
    if (roleChoice === null) return;
    const role = FAMILIAR_BENEFITS[Math.max(0, (parseInt(roleChoice, 10) || 1) - 1)] || FAMILIAR_BENEFITS[0];
    const roleBenefit = role.name;
    let ingenuitiveToolId: string | undefined;
    if (role.mechanic === 'ingenuitive') {
      const toolChoice = prompt(
        `Ingenuitive 승객이 제공할 도구 효과를 선택하세요.\n${ALMANACK_TOOLS.map((tool, index) => `${index + 1}. ${tool.canonicalName}`).join('\n')}`,
        '1'
      );
      if (toolChoice === null) return;
      ingenuitiveToolId = ALMANACK_TOOLS[Math.max(0, (parseInt(toolChoice, 10) || 1) - 1)]?.id;
      if (!ingenuitiveToolId) return;
    }
    const transaction = createClientTransaction('passenger-board');
    const result = resolvePassengerBoarding({
      transactionId: transaction.id,
      state: toMobilityRuntime(state),
      origin: state.currentLocationName,
      originId,
      graph,
      passenger: {
        name,
        destination: destination.destination,
        destinationId: destination.destinationId,
        destinationType: destination.destinationType,
        roleBenefit,
        ingenuitiveToolId,
        pickedUpAtDay: state.cumulativeDays || state.calendarDays || 0
      }
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState(s => applyMobilityRuntime(s, result.value!));
  };

  const handleDropOffPassenger = () => {
    if (!state.activePassenger) return;
    const transaction = createClientTransaction('passenger-arrival');
    const result = resolvePassengerArrival({
      transactionId: transaction.id,
      state: toMobilityRuntime(state),
      locationName: state.currentLocationName
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState(s => applyMobilityRuntime(s, result.value!));
  };

  const handleHarvestClayPots = () => {
    const transaction = createClientTransaction('clay-pots-harvest');
    const result = resolveClayPotHarvest({ transactionId: transaction.id, state: toMobilityRuntime(state) });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState(s => applyMobilityRuntime(s, result.value!));
  };

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setFinalArchiveNoteDraft(state.pendingPatientArchive?.initialRememberedNote || '');
      setIsBookmarkedDraft(false);
    });
    return () => { cancelled = true; };
  }, [state.pendingPatientArchive?.sourceId, state.pendingPatientArchive?.initialRememberedNote]);

  const handleFinalizePatientArchive = () => {
    const pending = state.pendingPatientArchive;
    if (!pending) return;
    const record = finalizePendingPatientArchive({
      ...pending,
      isBookmarked: isBookmarkedDraft
    }, finalArchiveNoteDraft);
    updateState((s: GameState) => ({
      ...s,
      patientCasebook: addCasebookRecord(s.patientCasebook || [], record),
      pendingPatientArchive: null
    }));
    setFinalArchiveNoteDraft("");
    setIsBookmarkedDraft(false);
  };

  const [localSeason, setLocalSeason] = useState(state.currentSeason);
  const [replenishReagentIndexes, setReplenishReagentIndexes] = useState<number[]>([]);
  const [replenishNote, setReplenishNote] = useState('');
  const [selectedToolToUpgrade, setSelectedToolToUpgrade] = useState('');
  const [selectedUpgradeOption, setSelectedUpgradeOption] = useState('');
  const [travelChoiceSource, setTravelChoiceSource] = useState<'seasoned' | 'news' | 'pondSkimmer' | 'logistical-map' | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setLocalSeason(state.currentSeason); });
    return () => { cancelled = true; };
  }, [state.currentSeason]);

  const currentClinicLocationId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
  const clinicRuntimeForArea: ClinicRuntimeState = {
    currentSeason: state.currentSeason,
    completedSeasons: state.completedSeasons,
    trinkets: state.trinkets.length,
    reputation: state.reputation,
    clinics: canonicalClinicsFromState(state),
    agendaIds: canonicalClinicAgendaIds(state),
    goodwillWeight: state.goodwillDonationsVal || 0,
    graph: toServiceMapGraph(state),
    appliedTransactionIds: state.appliedTransactionIds,
    journalEvents: []
  };
  const atClinicLocation = clinicRuntimeForArea.clinics.some(clinic => clinic.status === 'active' && clinic.locationId === currentClinicLocationId);
  const inClinicServiceArea = clinicRuntimeForArea.clinics.some(clinic => clinicServiceArea(clinicRuntimeForArea, clinic.id).includes(currentClinicLocationId));
  const currentCanonicalClinic = clinicRuntimeForArea.clinics.find(clinic => clinic.status === 'active' && clinic.locationId === currentClinicLocationId);
  const currentGardenReagent = currentCanonicalClinic?.gardenReagentId ? REAGENT_BY_ID.get(currentCanonicalClinic.gardenReagentId) : null;
  const currentClinicAilment = getActivePatient(state)?.ailments.find(ailment => ailment.status === 'active') || null;
  const gardenHarvestedForCurrentAilment = Boolean(currentClinicAilment
    && currentCanonicalClinic?.gardenHarvestedAilmentIds?.includes(currentClinicAilment.id));
  const soddenReagent = state.soddenLogInsect ? REAGENT_BY_ID.get(state.soddenLogInsect) : null;
  const soddenHarvestedForCurrentAilment = Boolean(currentClinicAilment?.specialState.soddenLogsHarvested);

  const resolveDowntimeActivity = (
    activity: Parameters<typeof resolveDowntime>[0]['activity'],
    transactionId: string,
    source: GameState = state,
    resourceCost?: number
  ): DowntimeEngineOutcome | null => {
    if (!source.downtimeRequired) {
      showAlert('다운타임은 여정을 마친 뒤 한 번 수행합니다.');
      return null;
    }
    const result = resolveDowntime({
      transactionId,
      activity,
      atCity: source.currentLocationType === 'City',
      resourceCost,
      state: {
        downtimeCompleted: source.downtimeCompleted,
        reputation: source.reputation,
        trinkets: source.trinkets.length,
        journalEvents: [],
        appliedTransactionIds: source.appliedTransactionIds
      }
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return null;
    }
    return result.value;
  };

  const applyDowntimeOutcome = (s: GameState, outcome: DowntimeEngineOutcome): GameState => ({
      ...s,
      downtimeCompleted: true,
      downtimeRequired: false,
      reputation: outcome.nextState.reputation,
      trinkets: resizeTrinkets(s.trinkets, outcome.nextState.trinkets, '휴식기 보상 장신구'),
      appliedTransactionIds: outcome.nextState.appliedTransactionIds,
      journals: appendEngineJournals(s.journals, outcome.nextState.journalEvents)
    });

    // Downtime Actions handlers
  const getRumourMapCandidates = () => {
    const graph = buildMapGraphNodes(state.customMapLocations || [], state.customMapEdges || []);
    const currentId = findGraphLocationKey(state.currentLocationName, graph);
    const current = graph[currentId];
    if (!current) return [];
    const distances = new Map<string, number>([[currentId, 0]]);
    const queue = [currentId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const depth = distances.get(id)!;
      graph[id].neighbors.forEach(next => {
        if (!distances.has(next)) {
          distances.set(next, depth + 1);
          queue.push(next);
        }
      });
    }
    return Object.entries(graph).flatMap(([locationId, node]) => {
      if (node.kind !== 'wild' || !node.region || ['Loch', 'Titan', 'Wilds'].includes(node.region)) return [];
      const dx = node.x - current.x;
      const dy = node.y - current.y;
      const direction = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'East' : 'West') : (dy >= 0 ? 'South' : 'North');
      return [{ locationId, label: node.label, region: node.region as Exclude<Region, 'Loch' | 'Titan'>, direction: direction as 'North' | 'South' | 'East' | 'West', pathDistance: distances.get(locationId) ?? Infinity }];
    });
  };

  const handleDrawRumours = () => {
    if (state.reputation < 15) {
      showAlert("길드 평판이 '인지도 있음(15+)' 이상이어야 소문을 들을 수 있습니다.");
      return;
    }
    // Rulebook p.40: 도시에서 여정을 마쳤을 때만 소문을 들을 수 있음
    if (state.currentLocationType !== 'City') {
      showAlert('소문 듣기는 도시에서만 가능합니다.\n현재 위치에서는 사용할 수 없습니다.');
      return;
    }
    if (!state.downtimeRequired || state.downtimeCompleted) {
      showAlert('소문 듣기는 여정 종료 뒤 선택할 수 있는 휴식기 활동 한 번을 사용합니다.');
      return;
    }
    const candidates = getRumourMapCandidates();
    let drawn: [PlayingCard, PlayingCard, PlayingCard, PlayingCard] | null = null;
    let validTargetIds: string[] = [];
    for (let attempt = 0; attempt < 100 && validTargetIds.length === 0; attempt += 1) {
      const cards = [drawPlayingCard(), drawPlayingCard(), drawPlayingCard(), drawPlayingCard()] as [PlayingCard, PlayingCard, PlayingCard, PlayingCard];
      const preview = resolveRumour({ transactionId: `rumour-preview:${attempt}`, reputation: state.reputation, atCity: true, downtimeCompleted: false, cards, candidates, targetLocationId: '' });
      drawn = cards;
      validTargetIds = preview.validTargetIds;
    }
    if (!drawn || validTargetIds.length === 0) {
      showAlert('현재 지도에서 조건을 만족하는 고분 위치 조합을 찾지 못했습니다. 지도 연결과 지역 표기를 확인해 주세요.');
      return;
    }

    const behemothClasses = { '♥': 'Towering', '♦': 'Many', '♣': 'Violent', '♠': 'Demanding' };
    const behemothLabels = { '♥': '거대한 야수', '♦': '무리를 이룬 야수', '♣': '폭력적인 야수', '♠': '까다로운 야수' };
    const directions = { '♥': '북쪽', '♦': '남쪽', '♣': '동쪽', '♠': '서쪽' };
    const regions = { '♥': '숲', '♦': '산맥', '♣': '늪지', '♠': '초원' };
    const distances = { '♥': '경로 1-2개', '♦': '경로 4-5개', '♣': '경로 7-10개', '♠': '경로 15개 이상' };

    const c1 = drawn[0].suit as '♥' | '♦' | '♣' | '♠';
    const c2 = drawn[1].suit as '♥' | '♦' | '♣' | '♠';
    const c3 = drawn[2].suit as '♥' | '♦' | '♣' | '♠';
    const c4 = drawn[3].suit as '♥' | '♦' | '♣' | '♠';

    const bClass = behemothClasses[c1];
    const bDir = directions[c2];
    const bRegion = regions[c3];
    const bDist = distances[c4];

    setRumourCards([
      { suit: c1, val: cardDisplayValue(drawn[0].value), text: `거수 유형: ${behemothLabels[c1]}` },
      { suit: c2, val: cardDisplayValue(drawn[1].value), text: `출현 방향: ${bDir}` },
      { suit: c3, val: cardDisplayValue(drawn[2].value), text: `출현 지역: ${bRegion}` },
      { suit: c4, val: cardDisplayValue(drawn[3].value), text: `출현 거리: ${bDist}` }
    ]);
    setRumourBarrowName(`${behemothLabels[c1]} ${state.bio.name || '야수'}의 무덤`);
    setRumourLocName(validTargetIds[0]);
  };

  const handleEstablishBarrow = () => {
    if (!rumourBarrowName.trim() || !rumourLocName.trim()) {
      showAlert("무덤 이름과 룰북 조건을 만족하는 지도 위치를 선택해 주세요.");
      return;
    }
    const candidates = getRumourMapCandidates();
    const cards = rumourCards.map(card => ({ value: card.val === 'A' ? 1 : card.val === 'J' ? 11 : card.val === 'Q' ? 12 : card.val === 'K' ? 13 : Number(card.val), suit: card.suit })) as [PlayingCard, PlayingCard, PlayingCard, PlayingCard];
    const transactionId = `rumour:${Date.now()}`;
    const resolved = resolveRumour({ transactionId, reputation: state.reputation, atCity: state.currentLocationType === 'City', downtimeCompleted: state.downtimeCompleted, cards, candidates, targetLocationId: rumourLocName });
    if (resolved.status !== 'resolved' || !resolved.rumour) {
      showAlert('선택한 위치는 카드의 방향·지역·거리 조건을 만족하지 않습니다. 카드를 다시 뽑아 주세요.');
      return;
    }
    const downtime = resolveDowntimeActivity('rumour', transactionId);
    if (!downtime) return;
    const target = buildMapGraphNodes(state.customMapLocations || [], state.customMapEdges || [])[rumourLocName];
    if (!target) return;
    const behemothClasses = { '♥': 'Towering', '♦': 'Many', '♣': 'Violent', '♠': 'Demanding' };
    const c1 = rumourCards[0].suit as '♥' | '♦' | '♣' | '♠';
    const bClass = behemothClasses[c1] as 'Towering' | 'Many' | 'Violent' | 'Demanding';

    updateState(s => {
      const base = applyDowntimeOutcome(s, downtime);
      const nextBarrows = [...(base.barrows || [])];
      nextBarrows.push({
        id: 'barrow_' + Date.now(),
        name: rumourBarrowName.trim(),
        behemothClass: bClass,
        direction: resolved.rumour!.direction,
        region: resolved.rumour!.region,
        distance: resolved.rumour!.distance,
        locationName: target.label,
        locationId: rumourLocName,
        removed: false
      });

      return {
        ...base,
        barrows: nextBarrows,
        rumours: [...base.rumours, resolved.rumour!],
        journals: [
          {
            id: 'barrow_log_' + Date.now(),
            title: `🗺️ 거수 무덤 소문: ${rumourBarrowName.trim()}`,
            text: `${localizeDirectionLabel(resolved.rumour!.direction)}의 ${localizeRegionLabel(resolved.rumour!.region)}, 경로 ${resolved.rumour!.distance}개 조건을 만족하는 ${target.label}에 ${rumourBarrowName.trim()}를 기록했습니다.`,
            timestamp: Date.now()
          },
          ...base.journals
        ]
      };
    });

    showAlert("거대 야수 고분이 지도에 기록되었습니다!");
    setRumourCards([]);
    setRumourBarrowName("");
    setRumourLocName("");
  };

  const handleGeneralPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpAilment || !gpTagChange || !gpReplacementTag || !gpNote.trim()) {
      showAlert("질환과 바꿀 태그, 그리고 진료 일지를 모두 선택해 주세요.");
      return;
    }
    const ailment = AILMENTS.find(row => row.id === gpAilment);
    const transaction = createClientTransaction('downtime:general-practice');
    try {
      const runtime = resolveCanonicalDowntime(transaction.id, toCanonicalDowntimeRuntime(state), {
        activity: 'general-practice',
        ailmentId: gpAilment,
        originalTag: gpTagChange as RuleTag,
        replacementTag: gpReplacementTag as RuleTag,
        journalText: `${ailment?.displayName || gpAilment}: ${gpTagChange}를 ${gpReplacementTag}로 바꿨다. ${gpNote.trim()}`
      });
      updateState((s: GameState) => {
        return applyCanonicalDowntimeRuntime(s, runtime);
      });
      showAlert("일반 진료를 마쳤습니다. 태그 변경과 장신구 5개가 함께 기록되었습니다.");
      setGpAilment('');
      setGpTagChange('');
      setGpReplacementTag('');
      setGpNote('');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '일반 진료를 완료하지 못했습니다.');
    }
  };

  const handleReplenishStocks = (e: React.FormEvent) => {
    e.preventDefault();
    if (replenishReagentIndexes.length === 0) {
      showAlert("보충할 약재를 하나 이상 골라주세요!");
      return;
    }
    const region = toRuleRegion(state.currentRegion);
    const matchingReagents = REAGENTS.filter(reagent =>
      reagent.regionAvailability[region] !== 'Unavailable'
      && reagent.seasonAvailability[state.currentSeason] === 'Common'
    );
    const availableTools = new Set([
      ...state.bag.filter(item => item.type === 'tool').flatMap(item => [item.canonicalToolId, item.id].filter(Boolean)),
      ...canonicalToolsFromState(state).map(item => item.toolId)
    ]);
    const transaction = createClientTransaction('downtime:replenish');
    const items: EngineInventoryItem[] = [];
    const notes: string[] = [];
    let remaining = Math.max(0, getMaxCarry(state) - currentWeight);
    for (const reagentIndex of replenishReagentIndexes) {
      const selected = matchingReagents[reagentIndex];
      if (!selected) continue;
      const preparations = selected.preparations.filter(part => part.requiredTools.every(tool => tool === 'none' || availableTools.has(tool)));
      if (preparations.length === 0) {
        showAlert(`${selected.displayName}: 현재 도구로 준비할 수 있는 부위가 없습니다.`);
        return;
      }
      const choice = prompt(`보충할 ${selected.displayName} 부위를 선택하세요:\n${preparations.map((part, index) => `${index + 1}. ${localizePreparationName(part.name)} · 무게 ${formatWeight(part.weight)} · ${part.uses}회분`).join('\n')}`, '1');
      if (choice === null) return;
      const preparation = preparations[(parseInt(choice, 10) || 1) - 1];
      if (!preparation) return showAlert('목록에 있는 부위를 선택해 주세요.');
      const maximum = preparation.weight > 0 ? Math.max(0, Math.floor(remaining / preparation.weight)) : 1;
      if (maximum === 0) return showAlert(`${selected.displayName}을(를) 담을 공간이 없습니다.`);
      const amountText = prompt(`${selected.displayName} ${preparation.name}을 몇 개 채울까요? 최대 ${maximum}개`, '1');
      if (amountText === null) return;
      const quantity = Math.max(1, Math.min(maximum, parseInt(amountText, 10) || 1));
      items.push({
        id: `${transaction.id}:${preparation.id}`,
        name: `${selected.displayName} (${preparation.name})`,
        type: 'reagent', weight: preparation.weight, quantity,
        canonicalReagentId: selected.id, preparationId: preparation.id, usesRemaining: preparation.uses
      });
      remaining -= preparation.weight * quantity;
      notes.push(`${selected.displayName} ${preparation.name} ${quantity}개`);
    }
    if (items.length === 0) return;
    try {
      const runtime = resolveCanonicalDowntime(transaction.id, toCanonicalDowntimeRuntime(state), {
        activity: 'replenish',
        items: [...toEngineInventory(state.bag), ...items],
        addedItemIds: items.map(item => item.id),
        totalCapacity: getMaxCarry(state),
        journalText: `${state.currentLocationName}에서 ${notes.join(', ')}로 가방을 채웠다. ${replenishNote.trim()}`
      });
      updateState((s: GameState) => applyCanonicalDowntimeRuntime(s, runtime));
      showAlert(`${items.length}종의 영약재를 가방에 보충했습니다.`);
      setReplenishReagentIndexes([]);
      setReplenishNote('');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '재고를 보충하지 못했습니다.');
    }
  };

  const handleWorkingOnYourself = (choice: 'speed' | 'carry' | 'style', styleVal?: string) => {
    const styleData = choice === 'style' ? GAME_DATA.bioChoices.travelStyles.find(style => style.name === styleVal) : null;
    if (choice === 'style' && !styleData) return;
    const transaction = createClientTransaction('downtime:self-improvement');
    const journalText = choice === 'speed'
      ? '지난 기록을 다시 읽고 이동 속도를 1 높였다.'
      : choice === 'carry'
        ? '지난 기록을 다시 읽고 소지 한도를 1 높였다.'
        : `지난 기록을 다시 읽고 이동 방식을 ${styleData!.name}(으)로 바꿨다.`;
    try {
      const runtime = resolveCanonicalDowntime(transaction.id, toCanonicalDowntimeRuntime(state), choice === 'style'
        ? { activity: 'self-improvement', choice, travelStyle: styleData!.name, styleSpeed: styleData!.speed, styleCarry: styleData!.carry, journalText }
        : { activity: 'self-improvement', choice, journalText });
      updateState((s: GameState) => {
        const next = applyCanonicalDowntimeRuntime(s, runtime);
        return choice === 'style'
          ? { ...next, bio: { ...next.bio, canFly: styleData!.name === '가볍고 신속하게' } }
          : next;
      });
      showAlert("자기 계발 효과가 한 번의 휴식기 기록으로 적용되었습니다.");
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '자기 계발을 완료하지 못했습니다.');
    }
  };

  const handleBuyTool = (tool: any) => {
    if (!isToolAvailableAtLocation(tool, state, bypassShopRules)) {
      showAlert("현재 위치에서는 이 도구를 구입할 수 없습니다.");
      return;
    }
    if (state.trinkets.length < tool.cost) {
      showAlert("장신구가 부족합니다!");
      return;
    }
    let canonicalToolId = CANONICAL_TOOL_IDS[tool.id];
    let source: 'market' | 'basic-replacement' = 'market';
    if (tool.id === 'tool_basic_replacement') {
      const chosen = prompt("교체할 기본 도구를 선택하세요:\n1. 벨트 칼\n2. 낡은 캠프 주전자\n3. 나무 절구와 공이", "1");
      if (chosen === null) return;
      canonicalToolId = chosen === '2' ? 'camp-kettle' : chosen === '3' ? 'mortar-and-pestle' : 'belt-knife';
      source = 'basic-replacement';
    }
    if (!canonicalToolId) {
      showAlert('정식 도구 ID가 없는 도구입니다.');
      return;
    }
    const transaction = createClientTransaction('tool-purchase');
    const result = purchaseCanonicalTool({
      transactionId: transaction.id,
      state: {
        trinkets: state.trinkets.length,
        inventory: toEngineInventory(state.bag),
        tools: canonicalToolsFromState(state),
        appliedTransactionIds: state.appliedTransactionIds,
        journalEvents: []
      },
      toolId: canonicalToolId,
      source,
      currentLocationName: state.currentLocationName,
      currentLocationType: state.currentLocationType,
      currentRegion: state.currentRegion,
      allowLocationOverride: bypassShopRules && state.rulesetId !== 'original-1e-3p'
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    updateState(s => ({
      ...s,
      trinkets: resizeTrinkets(s.trinkets, outcome.trinkets, '도구 구매 장신구'),
      bag: fromEngineInventory(outcome.inventory, s.bag),
      toolStates: outcome.tools,
      appliedTransactionIds: outcome.appliedTransactionIds,
      journals: appendEngineJournals(s.journals, outcome.journalEvents)
    }));
    showAlert(`${outcome.inventory.find(item => item.id === `${transaction.id}:tool`)?.name || '도구'}를 구매했습니다.`);
  };

  const handleHireGuildService = (service: any) => {
    const serviceId = LEGACY_SERVICE_IDS[service.id];
    const definition = serviceId ? GUILD_SERVICE_BY_ID.get(serviceId) : null;
    if (!definition) {
      showAlert('이 서비스는 정식 목록에 없습니다.');
      return;
    }
    if (serviceId === 'smithing') {
      handleUpgradeTool();
      return;
    }
    const transaction = createClientTransaction(`service:${serviceId}`);
    const graph = toServiceMapGraph(state);
    const currentLocationId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
    const chooseOne = (label: string, rows: Array<{ id: string; label: string }>) => {
      if (rows.length === 0) return null;
      const raw = prompt(`${label}\n${rows.map((row, index) => `${index + 1}. ${row.label}`).join('\n')}`, '1');
      if (raw === null) return null;
      return rows[Math.max(0, (parseInt(raw, 10) || 1) - 1)]?.id || null;
    };
    const chooseMany = (label: string, rows: Array<{ id: string; label: string }>, maximum: number) => {
      const raw = prompt(`${label}\n${rows.map((row, index) => `${index + 1}. ${row.label}`).join('\n')}\n번호를 쉼표로 구분하세요.`, '1');
      if (raw === null) return null;
      const indexes = [...new Set(raw.split(',').map(value => parseInt(value.trim(), 10) - 1).filter(index => index >= 0 && index < rows.length))].slice(0, maximum);
      return indexes.map(index => rows[index].id);
    };
    const note = prompt(`${definition.name} 이용 기록을 남겨주세요:`, '')?.trim();
    if (!note) return;
    const targetIds: string[] = [];
    let selectedItemIds: string[] = [];
    let selectedReagentId: string | undefined;
    let selectedPreparationId: string | undefined;
    let card: PlayingCard | undefined;
    const nodes = Object.values(graph).map(node => ({ id: node.id, label: `${node.name} · ${localizeRegionLabel(node.region)} · ${locationTypeLabel(node.locationType)}` }));

    if (serviceId === 'send-package') {
      const chosen = chooseMany('보낼 실제 가방 물품을 선택하세요. 최대 총 무게 5.', state.bag.map(item => ({ id: item.id, label: `${localizeInventoryItemName(item.name)} · ${formatWeight(item.weight * (item.qty || 1))}` })), state.bag.length);
      if (!chosen?.length) return;
      selectedItemIds = chosen;
    } else if (serviceId === 'shortcut') {
      const chosen = chooseOne('지름길로 이동할 가까운 위치를 선택하세요.', nodes.filter(row => isNearbyMapLocation(graph, currentLocationId, row.id)));
      if (!chosen) return;
      targetIds.push(chosen);
    } else if (serviceId === 'hitch-a-ride') {
      const candidates = nodes.filter(row => graph[row.id].region === 'Meadow' && (shortestPathDistance(graph, currentLocationId, row.id) || Infinity) <= 5);
      const chosen = chooseOne('경로 5개 이내의 초원 목적지를 선택하세요.', candidates);
      if (!chosen) return;
      targetIds.push(chosen);
    } else if (serviceId === 'survey-paths') {
      const mode = prompt('Survey Paths 방식을 선택하세요.\n1. 가까운 두 장소를 연결\n2. 한 장소를 기존 경로에 연결', '1');
      if (mode === null) return;
      if (mode === '2') {
        const location = chooseOne('기존 경로에 연결할 장소를 선택하세요.', nodes);
        if (!location) return;
        const pathRows = Object.values(graph).flatMap(node => node.edges
          .filter(edge => node.id < edge.to && graph[edge.to])
          .map(edge => ({ id: `${node.id}|${edge.to}`, label: `${node.name} ↔ ${graph[edge.to].name}` })));
        const path = chooseOne('연결할 기존 경로를 선택하세요.', pathRows.filter(row => !row.id.split('|').includes(location)));
        if (!path) return;
        const [a, b] = path.split('|');
        targetIds.push(location, a, b);
      } else {
        const first = chooseOne('새 경로의 첫 장소를 선택하세요.', nodes);
        if (!first) return;
        const second = chooseOne('가까운 두 번째 위치를 선택하세요.', nodes.filter(row => isNearbyMapLocation(graph, first, row.id)));
        if (!second) return;
        targetIds.push(first, second);
      }
    } else if (serviceId === 'build-a-bridge') {
      const loch = chooseOne('다리를 놓을 호수 위치를 선택하세요.', nodes.filter(row => graph[row.id].region === 'Loch'));
      if (!loch) return;
      const neighbors = graph[loch].edges.filter(edge => graph[edge.to]?.region !== 'Loch').map(edge => ({ id: edge.to, label: graph[edge.to].name }));
      const banks = chooseMany('양쪽 둑 위치 두 곳을 선택하세요.', neighbors, 2);
      if (!banks || banks.length !== 2) return;
      targetIds.push(loch, ...banks);
    } else if (serviceId === 'floodplain') {
      const chosen = chooseOne('다음 봄까지 호수가 될 야생 위치를 선택하세요.', nodes.filter(row => graph[row.id].locationType === 'Wilds' && graph[row.id].region !== 'Loch'));
      if (!chosen) return;
      targetIds.push(chosen);
    } else if (serviceId === 'retrieval') {
      const chosen = chooseOne('경로 5개 이상 떨어진 정착지를 선택하세요.', nodes.filter(row => graph[row.id].locationType === 'Settlement' && (shortestPathDistance(graph, currentLocationId, row.id) || 0) >= 5));
      if (!chosen) return;
      targetIds.push(chosen);
      const reagentId = chooseOne('회수할 비-Titan 영약재를 선택하세요.', REAGENTS.filter(row => row.type !== 'TITAN').map(row => ({ id: row.id, label: `${row.displayName} · 기본 희귀도 ${row.baseRarity}` })));
      const reagent = reagentId ? REAGENT_BY_ID.get(reagentId) : null;
      if (!reagent) return;
      const preparationId = chooseOne('회수할 부위와 조제법을 선택하세요.', reagent.preparations.map(row => ({ id: row.id, label: `${localizePreparationName(row.name)} · ${localizePreparationMethod(row.method)} · 무게 ${formatWeight(row.weight)}` })));
      if (!preparationId) return;
      selectedReagentId = reagent.id;
      selectedPreparationId = preparationId;
    } else if (serviceId === 'send-a-missive') {
      const chosen = chooseMany('서신을 보낼 정착지를 최대 세 곳 선택하세요.', nodes.filter(row => graph[row.id].locationType === 'Settlement'), 3);
      if (!chosen?.length) return;
      targetIds.push(...chosen);
    } else if (serviceId === 'scare-tactics') {
      const chosen = chooseOne('제거할 지도상의 고분을 선택하세요.', (state.barrows || []).filter(row => !row.removed).map(row => ({ id: row.id, label: `${row.name} · ${row.locationName}` })));
      if (!chosen) return;
      targetIds.push(chosen);
    }

    if (['rug-of-wonders', 'catch-of-the-day', 'take-clippings', 'pick-of-the-deep'].includes(serviceId)) {
      if (serviceId === 'pick-of-the-deep') card = drawPlayingCard();
      const limit = card ? getRuleCardValue(card, 'table') : 12;
      const candidates = REAGENTS.filter(row => serviceId === 'rug-of-wonders' ? row.type !== 'TITAN' && row.baseRarity <= 9 : serviceId === 'take-clippings' ? row.type === 'PLANT' : serviceId === 'pick-of-the-deep' ? row.type === 'TITAN' && row.baseRarity <= limit : row.canonicalName === (service.id === 'catch_day_big' ? 'Big Fish' : 'Small Fish'));
      const chosen = chooseOne('획득할 정식 영약재를 선택하세요.', candidates.map(row => ({ id: row.id, label: `${row.displayName} · 기본 희귀도 ${row.baseRarity}` })));
      const reagent = chosen ? REAGENT_BY_ID.get(chosen) : null;
      if (!reagent) return;
      const preparationId = chooseOne('획득할 부위와 조제법을 선택하세요.', reagent.preparations.map(row => ({ id: row.id, label: `${localizePreparationName(row.name)} · ${localizePreparationMethod(row.method)} · 무게 ${formatWeight(row.weight)}` })));
      if (!preparationId) return;
      selectedReagentId = reagent.id;
      selectedPreparationId = preparationId;
    }

    const runtime = toServiceRuntime(state);
    const result = resolveGuildService({ transactionId: transaction.id, state: runtime, serviceId, targetIds, selectedItemIds, selectedReagentId, selectedPreparationId, option: service.id === 'catch_day_big' ? 'big' : 'small', card, journalNote: note });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    updateState(s => {
      let customMapLocations = s.customMapLocations || [];
      let customMapEdges = s.customMapEdges || [];
      outcome.nextState.mapMutations.filter(mutation => mutation.transactionId === transaction.id).forEach(mutation => {
        if (mutation.kind === 'add-path' || mutation.kind === 'convert-waterway') {
          const pairs = mutation.kind === 'add-path'
            ? mutation.nodeIds.length === 3
              ? [[mutation.nodeIds[0], mutation.nodeIds[1]], [mutation.nodeIds[0], mutation.nodeIds[2]]]
              : [[mutation.nodeIds[0], mutation.nodeIds[1]]]
            : [[mutation.nodeIds[0], mutation.nodeIds[1]], [mutation.nodeIds[0], mutation.nodeIds[2]]];
          pairs.forEach(([from, to]) => {
            const id = `service-edge:${[from, to].sort().join(':')}`;
            if (!customMapEdges.some(edge => edge.id === id)) customMapEdges = [...customMapEdges, { id, from, to, kind: 'path', label: outcome.service.name, createdAt: transaction.at }];
          });
        }
        if (mutation.kind === 'temporary-region') {
          const node = outcome.nextState.graph[mutation.nodeIds[0]];
          customMapLocations = upsertCustomMapLocation(customMapLocations, node.name, node.region, 'Wilds', s.currentLocationName, 'Floodplain: next Spring restore');
        }
      });
      const pendingDraft: ManualEffectDraft | null = outcome.pendingService?.serviceId === 'send-package' ? normalizeLegacyManualEffectDraft({
        effectId: `service-followup:${transaction.id}`, ruleId: outcome.service.ruleIds[0] || 'SERVICE-005', sourcePage: outcome.service.sourcePage,
        ownerId: outcome.service.id, ownerType: 'service', trigger: 'service-follow-up', printedText: outcome.service.followUp,
        summary: `${outcome.service.name} 후속 절차`, mandatoryConditions: [outcome.service.followUp], choices: ['원문 조건을 충족한 뒤 완료 기록'], canonicalActions: [`pending service ${outcome.pendingService.status}`], resultSummary: '', journalNote: note, status: 'manual', transactionId: null
      }, transaction.at) : null;
      const next: GameState = {
        ...s,
        currentLocationName: outcome.nextState.currentLocationName,
        currentLocationType: outcome.nextState.currentLocationType,
        currentRegion: outcome.nextState.currentRegion,
        trinkets: resizeTrinkets(s.trinkets, outcome.nextState.trinkets, `${outcome.service.name} 정산 장신구`),
        bag: fromEngineInventory(outcome.nextState.inventory, s.bag),
        pendingServices: outcome.nextState.pendingServices,
        serviceMapMutations: outcome.nextState.mapMutations,
        forecastMoves: outcome.nextState.weatherProtectionMoves,
        guildServiceTravelRerolls: outcome.nextState.travelEncounterRerolls,
        missiveSettlements: outcome.nextState.missiveSettlementIds,
        griphUsedThisJourney: outcome.nextState.usedJourneyServiceIds.includes('rug-of-wonders'),
        customMapLocations,
        customMapEdges,
        barrows: serviceId === 'scare-tactics' ? (s.barrows || []).filter(row => !targetIds.includes(row.id)) : s.barrows,
        pendingManualEffect: pendingDraft,
        manualEffectDraft: pendingDraft,
        appliedTransactionIds: outcome.nextState.appliedTransactionIds,
        journals: [{ id: `${transaction.id}:journal`, title: `길드 서비스: ${outcome.service.name}`, text: `${note}\n${outcome.service.followUp}`, timestamp: transaction.at }, ...s.journals]
      };
      return enqueueManualDrafts(next, [pendingDraft]);
    });
  };

  const handleUpgradeTool = () => {
    if (state.currentLocationType !== 'City' && !(state.currentLocationType === 'Settlement' && state.currentRegion === 'Mountain') && !bypassShopRules) {
      showAlert("도구 개조는 산맥 정착지 또는 도시에서만 가능합니다.");
      return;
    }
    if (state.trinkets.length < 3) {
      showAlert("도구 개조에는 3 장신구가 필요합니다!");
      return;
    }
    if (!selectedToolToUpgrade || !selectedUpgradeOption) {
      showAlert("개조할 도구와 업그레이드 품목을 골라주세요!");
      return;
    }

    const tObj = state.bag.find(item => item.id === selectedToolToUpgrade && item.type === 'tool' && item.canonicalToolId);
    if (!tObj) return;
    const upgradeId = selectedUpgradeOption.includes('Silver Sickle') ? 'silver-sickle'
      : selectedUpgradeOption.includes('Steel Axe') ? 'steel-axe'
        : selectedUpgradeOption.includes('Pairing Knife') ? 'pairing-knife'
          : selectedUpgradeOption.includes('Steel-Lined') ? 'steel-lined-mortar'
            : selectedUpgradeOption.includes('Granite Mortar') ? 'granite-mortar'
              : selectedUpgradeOption.includes('Double Boiler') ? 'double-boiler'
                : selectedUpgradeOption.includes('Efficient Copper Kettle') ? 'efficient-copper-kettle' : '';
    const transaction = createClientTransaction('tool-upgrade');
    const result = upgradeCanonicalTool({
      transactionId: transaction.id,
      state: {
        trinkets: state.trinkets.length,
        inventory: toEngineInventory(state.bag),
        tools: canonicalToolsFromState(state),
        appliedTransactionIds: state.appliedTransactionIds,
        journalEvents: []
      },
      toolInstanceId: tObj.id,
      upgradeId,
      currentLocationType: state.currentLocationType,
      currentRegion: state.currentRegion,
      allowLocationOverride: bypassShopRules && state.rulesetId !== 'original-1e-3p'
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    updateState(s => ({
      ...s,
      trinkets: resizeTrinkets(s.trinkets, outcome.trinkets, '도구 개조 장신구'),
      bag: fromEngineInventory(outcome.inventory, s.bag),
      toolStates: outcome.tools,
      journals: appendEngineJournals(s.journals, outcome.journalEvents),
      appliedTransactionIds: outcome.appliedTransactionIds
    }));

    showAlert("도구 업그레이드가 성공적으로 완료되었습니다!");
    setSelectedToolToUpgrade("");
    setSelectedUpgradeOption("");
  };

  const handleBuyWagonUpgrade = (upgrade: any) => {
    const expansionId = ({ sealedCarriage: 'sealed-carriage', pedalMotor: 'pedal-motor', axelSprings: 'axel-springs', sideBrackets: 'side-brackets', hiveBrackets: 'hive-brackets', passengerBooth: 'passenger-booth', shadowCanvas: 'shadow-canvas', experimentalContraption: 'experimental-contraption', clayPots: 'clay-pots' } as Record<string, string>)[upgrade.id];
    const coracle = state.bag.find(item => item.canonicalToolId === 'bark-coracle');
    const recycleCoracle = expansionId === 'sealed-carriage' && !!coracle && askWindowConfirm('Bark Coracle을 부품으로 재활용해 비용을 5 줄일까요? 사용한 Coracle은 가방에서 제거됩니다.');
    const transaction = createClientTransaction(upgrade.id === 'baseUnit' ? 'downtime:commission-wagon' : 'wagon-expansion');
    const allowOverride = bypassShopRules && state.rulesetId !== 'original-1e-3p';
    let clayPotReagentId: string | undefined;
    if (expansionId === 'clay-pots') {
      const plants = REAGENTS.filter(row => row.type === 'PLANT' && row.seasonAvailability[state.currentSeason] !== 'Unavailable');
      const choice = prompt(`Clay Pots에 심을 제철 식물을 선택하세요.\n${plants.map((row, index) => `${index + 1}. ${row.displayName}`).join('\n')}`, '1');
      if (!choice) return;
      clayPotReagentId = plants[Math.max(0, (parseInt(choice, 10) || 1) - 1)]?.id;
      if (!clayPotReagentId) return;
    }
    const result = resolveWagonUpgrade({
      transactionId: transaction.id,
      state: toMobilityRuntime(state),
      action: upgrade.id === 'baseUnit' ? 'commission' : 'install',
      expansionId,
      locationName: state.currentLocationName,
      isCity: state.currentLocationType === 'City' || allowOverride,
      recycleCoracleItemId: recycleCoracle ? coracle?.id : undefined,
      clayPotReagentId
    });
    if (!result.value) return showAlert(result.messages.join('\n'));
    updateState(s => applyMobilityRuntime(s, result.value!));
  };

  const handleAdoptCompanion = (companion: any) => {
    const companionSlots = resolveWagonCapabilities(canonicalWagonFromState(state)).companionSlots;
    let replaceCompanionInstanceId: string | undefined;
    if ((state.companionStates || []).length >= companionSlots) {
      const choice = prompt(
        `동행 한도가 가득 찼습니다. 야생으로 돌려보낼 동반자를 선택하세요.\n${(state.companionStates || []).map((row, index) => {
          const definition = COMPANIONS_DB.find(item => canonicalCompanionId(item.id) === canonicalCompanionId(row.companionId));
          return `${index + 1}. ${definition?.name || row.companionId}`;
        }).join('\n')}`,
        '1'
      );
      if (choice === null) return;
      replaceCompanionInstanceId = state.companionStates[Math.max(0, (parseInt(choice, 10) || 1) - 1)]?.instanceId;
      if (!replaceCompanionInstanceId) return;
    }
    const transaction = createClientTransaction('companion-adoption');
    const result = resolveCompanionAdoption({
      transactionId: transaction.id,
      state: toMobilityRuntime(state),
      companionId: canonicalCompanionId(companion.id),
      currentRegion: state.currentRegion,
      currentLocationType: state.currentLocationType,
      replaceCompanionInstanceId
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState(s => applyMobilityRuntime(s, result.value!));
    showAlert(`${companion.name}을 동반자로 영입했습니다!`);
  };

	  const handleReleaseCompanion = (id: string) => {
	    if (askWindowConfirm("이 동료를 자연의 야생으로 방생하시겠습니까?")) {
	      const transaction = createClientTransaction('companion-release');
	      const result = resolveCompanionRelease({ transactionId: transaction.id, state: toMobilityRuntime(state), companionInstanceId: id });
	      if (!result.value) return showAlert(result.messages.join('\n'));
	      updateState(s => applyMobilityRuntime(s, result.value!));
	    }
	  };

	  const handleStoreCompanionInHive = (id: string) => {
	    const transaction = createClientTransaction('companion-store');
	    const result = resolveCompanionStorage({
        transactionId: transaction.id, state: toMobilityRuntime(state), companionInstanceId: id, action: 'store',
        atClinic: atClinicLocation,
        hasHiveBoxes: canonicalClinicAgendaIds(state).includes('hive-boxes')
      });
	    if (!result.value) return showAlert(result.messages.join('\n'));
	    updateState(s => applyMobilityRuntime(s, result.value!));
	  };

	  const handleRecallHiveCompanion = (id: string) => {
	    const transaction = createClientTransaction('companion-recall');
	    const result = resolveCompanionStorage({
        transactionId: transaction.id, state: toMobilityRuntime(state), companionInstanceId: id, action: 'recall',
        atClinic: atClinicLocation,
        hasHiveBoxes: canonicalClinicAgendaIds(state).includes('hive-boxes')
      });
	    if (!result.value) return showAlert(result.messages.join('\n'));
	    updateState(s => applyMobilityRuntime(s, result.value!));
	  };

  const handleStartJourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journeyDestinationCard || !journeyGoalCard) {
      showAlert('목적지 카드와 목표 카드를 모두 뽑아주세요.');
      return;
    }
    if (!destName || !journeyDestinationCandidates.some(row => row.id === destName)) {
      showAlert('이동 가능한 목적지 후보를 선택하세요. 후보가 없으면 카드를 다시 뽑으세요.');
      return;
    }
    const journeyReason = journeyReasonRef.current;
    if (!journeyReason.trim()) {
      showAlert('이번 여정을 떠나는 이유를 기록해주세요.');
      return;
    }
    if (state.downtimeRequired) {
      showAlert('이전 여정을 마친 뒤 다운타임 활동 하나를 먼저 완료해야 합니다.');
      return;
    }

    const suitNames: { [key: string]: string } = { '♥': '북쪽', '♦': '남쪽', '♣': '동쪽', '♠': '서쪽' };
    const destinationCard = journeyDestinationCard;
    const goalCard = journeyGoalCard;
    const randomSuit = destinationCard.suit;
    const cardVal = getRuleCardValue(destinationCard, 'table');
    const transaction = createClientTransaction('journey');
    const transactionId = transaction.id;
    const result = resolveJourneyStart({
      transactionId,
      state: toJourneyRuntime(state),
      graph: journeyGraph,
      originId: journeyOriginId,
      season: state.currentSeason,
      destinationCard: destinationCard as PlayingCard & { suit: CardSuit },
      destinationId: destName,
      goalCard,
      reason: journeyReason,
      startDate: transaction.at,
      rulesetId: state.rulesetId
    });
    if (!result.value?.journey) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const canonicalJourney = result.value.journey;
    const goal = JOURNEY_GOAL_BY_ID.get(canonicalJourney.goalId)!;
    const destination = journeyDestinationCandidates.find(row => row.id === destName)!;
    const journeyWagon = canonicalWagonFromState(state);
    let clayPotReagentId: string | null = null;
    if (journeyWagon.commissioned && journeyWagon.expansionIds.includes('clay-pots')) {
      const plants = REAGENTS.filter(row => row.type === 'PLANT' && row.seasonAvailability[state.currentSeason] !== 'Unavailable');
      const plantChoice = prompt(`Clay Pots에 심을 제철 식물을 선택하세요.\n${plants.map((row, index) => `${index + 1}. ${row.displayName}`).join('\n')}`, '1');
      if (plantChoice === null) return;
      clayPotReagentId = plants[Math.max(0, (parseInt(plantChoice, 10) || 1) - 1)]?.id || null;
      if (!clayPotReagentId) return;
    }
    const familiarMechanic = getActiveFamiliarMechanic(state);
    let resourcefulReagent = state.resourcefulReagent || '';
    if (familiarMechanic === 'resourceful') {
      const candidates = REAGENTS.filter(row => row.baseRarity <= 7);
      const choice = prompt(`Resourceful 길동무가 이번 여정에 조달할 기본 희귀도 7 이하 영약재를 선택하세요.\n${candidates.map((row, index) => `${index + 1}. ${row.displayName} · 기본 희귀도 ${row.baseRarity}`).join('\n')}`, '1');
      if (choice === null) return;
      resourcefulReagent = candidates[Math.max(0, (parseInt(choice, 10) || 1) - 1)]?.displayName || '';
      if (!resourcefulReagent) return;
    }
    let ingenuitiveTool = state.ingenuitiveTool || '';
    if (familiarMechanic === 'ingenuitive') {
      const choice = prompt(`Ingenuitive 길동무가 제공할 도구 효과를 선택하세요.\n${ALMANACK_TOOLS.map((tool, index) => `${index + 1}. ${tool.canonicalName}`).join('\n')}`, '1');
      if (choice === null) return;
      ingenuitiveTool = ALMANACK_TOOLS[Math.max(0, (parseInt(choice, 10) || 1) - 1)]?.id || '';
      if (!ingenuitiveTool) return;
    }
    updateState((s: GameState) => {
      const journeyState = applyJourneyRuntime(s, result.value!);
      const serviceStart = resolveGuildServiceJourneyStart({
        transactionId: `${transactionId}:services`,
        state: toServiceRuntime(journeyState)
      });
      const withServices = serviceStart.value ? applyServiceRuntime(journeyState, serviceStart.value) : journeyState;
      const mobility = resolveMobilityJourneyStart({ transactionId: `${transactionId}:mobility`, state: toMobilityRuntime(withServices), clayPotReagentId });
      const next = mobility.value ? applyMobilityRuntime(withServices, mobility.value) : withServices;
      return {
        ...next,
        journeyActive: true,
        downtimeCompleted: false,
        journeyOrigin: s.currentLocationName,
        journeyDestination: destination.name,
        journeyDistance: journeyDistanceBandText,
        journeyTotalDistance: destination.paths,
        journeyDirection: suitNames[randomSuit] || randomSuit,
        journeyGoalTitle: goal.title,
        journeyGoalDesc: goal.requiredState,
        journeyGoalProgress: goal.requiredState,
        calendarDays: 0,
        calendarMaxDays: canonicalJourney.urgency.days,
        calendarHistory: [`여정 시작: ${destination.name}로 출발 (목적지 ${randomSuit} ${cardDisplayValue(cardVal)}, 목표 ${goalCard.suit} ${cardDisplayValue(goalCard.value)}, Urgency ${canonicalJourney.urgency.days}일, 이유: ${journeyReason.trim()})`],
        journeyGoalCounter: 0,
        journeyGoalChecklist: [],
        journeyStartReputation: s.reputation,
        companionTravelPaths: 0,
        taxiSoarActive: false,
        resourcefulReagent,
        ingenuitiveTool,
        journals: next.journals
      };
    });

    setDestName("");
    journeyReasonRef.current = "";
    setJourneyDestinationCard(null);
    setJourneyGoalCard(null);
  };

  const executeCanonicalTravelMove = (drawnSuit: string, cardVal: number) => {
    const mapNodes = buildMapGraphNodes(state.customMapLocations || [], state.customMapEdges || []);
    const composedDraft = routeDraftRef.current;
    const currentLocationId = findGraphLocationKey(state.currentLocationName, mapNodes)
      || composedDraft.stops[0]?.id
      || '';
    const destinationId = findGraphLocationKey(nextLocName, mapNodes)
      || composedDraft.stops[composedDraft.stops.length - 1]?.id
      || '';
    if (!currentLocationId || !destinationId) {
      showAlert('현재 위치와 목적지는 지도 위의 실제 위치여야 합니다. 지도에 표시된 장소 이름을 선택해 주세요.');
      return;
    }
    const destinationType = canonicalLocationType(destType);
    const canonicalWagon = canonicalWagonFromState(state);
    const wagonCapabilities = resolveWagonCapabilities(canonicalWagon);
    const pendingMoveService = ((state.pendingServices || []) as ServiceRuntimeState['pendingServices']).find(service =>
      service.status === 'pending-move' && ['hitch-a-ride', 'taxi-service'].includes(service.serviceId)
    );
    const isHitchMove = pendingMoveService?.serviceId === 'hitch-a-ride';
    const isTaxiMove = pendingMoveService?.serviceId === 'taxi-service';
    const engineGraph = Object.fromEntries(Object.entries(mapNodes).map(([id, node]) => [id, {
      id,
      name: node.label,
      region: (node.region && node.region !== 'Wilds' ? node.region : destRegion === 'Soar' ? state.currentRegion : destRegion) as TravelRegion,
      locationType: canonicalLocationType(node.kind === 'settlement' ? 'Settlement' : node.kind === 'city' ? 'City' : node.kind === 'ruin' ? 'Ruin' : node.kind === 'barrow' ? 'Barrow' : 'Wilds'),
      edges: node.neighbors.map(to => ({
        to,
        kind: mapEdgeKind(id, to, mapNodes, state.customMapEdges || [])
      }))
    }]));
    const transactionId = `travel:${Date.now()}`;
    let travelTools = canonicalToolsFromState(state);
    let repairedTentState: ReturnType<typeof repairCanonicalTool>['value'] = null;
    const brokenTent = travelTools.find(tool => tool.toolId === 'canvas-tent' && tool.broken && !tool.consumed);
    if (brokenTent && ['Settlement', 'City'].includes(state.currentLocationType) && state.trinkets.length >= 2
      && askWindowConfirm('출발 전에 파손된 Canvas Tent를 장신구 2개로 수리할까요?')) {
      const repaired = repairCanonicalTool({
        transactionId: `${transactionId}:tool:repair-tent`,
        state: {
          trinkets: state.trinkets.length,
          inventory: toEngineInventory(state.bag),
          tools: travelTools,
          appliedTransactionIds: state.appliedTransactionIds,
          journalEvents: []
        },
        toolInstanceId: brokenTent.instanceId,
        currentLocationType: state.currentLocationType
      });
      if (!repaired.value) return showAlert(repaired.messages.join('\n'));
      repairedTentState = repaired.value;
      travelTools = repaired.value.tools;
    }
    const stilts = state.currentRegion === 'Bog'
      ? travelTools.filter(tool => tool.toolId === 'stilts' && !tool.broken && !tool.consumed)
      : [];
    const travelStartTools = stilts.length > 0 ? resolveToolEffects({
      transactionId: `${transactionId}:tool:stilts`,
      phase: 'travel', trigger: 'bog-move', tools: travelTools,
      selectedToolInstanceIds: stilts.map(tool => tool.instanceId),
      rulesetId: state.rulesetId
    }) : null;
    const composed = composedDraft;
    const composedIds = composed.stops.map(stop => findGraphLocationKey(stop.id, mapNodes) || findGraphLocationKey(stop.name, mapNodes) || stop.id);
    const composedMatches = composedIds.length >= 2
      && composedIds[0] === currentLocationId
      && composedIds[composedIds.length - 1] === destinationId;
    if (composedMatches) {
      composed.stops.forEach((stop, index) => {
        const from = composedIds[index];
        const to = composedIds[index + 1];
        if (!from || !to) return;
        if (!engineGraph[from]) {
          engineGraph[from] = {
            id: from,
            name: stop.name,
            region: (stop.terrain || destRegion) as TravelRegion,
            locationType: canonicalLocationType(locationTypeFromGlyph(stop.kind)),
            edges: []
          };
        }
        if (!engineGraph[to]) {
          const nextStop = composed.stops[index + 1];
          engineGraph[to] = {
            id: to,
            name: nextStop.name,
            region: (nextStop.terrain || destRegion) as TravelRegion,
            locationType: canonicalLocationType(locationTypeFromGlyph(nextStop.kind)),
            edges: []
          };
        }
        const kind = composed.edgeKinds[index] || 'path';
        if (!engineGraph[from].edges.some(edge => edge.to === to)) {
          engineGraph[from].edges.push({ to, kind });
        } else {
          engineGraph[from].edges = engineGraph[from].edges.map(edge => edge.to === to ? { ...edge, kind } : edge);
        }
        if (!engineGraph[to].edges.some(edge => edge.to === from)) {
          engineGraph[to].edges.push({ to: from, kind });
        }
      });
    }
    const result = resolveTravel({
      transactionId,
      state: {
        currentLocationId,
        currentLocationName: state.currentLocationName,
        currentRegion: (state.currentRegion === 'Barrow' ? 'Titan' : state.currentRegion) as TravelRegion,
        currentLocationType: canonicalLocationType(state.currentLocationType),
        baseSpeed: (isHitchMove ? 5 : (state.nextMoveSpeedOverride ?? getTravelSpeed(state, currentWeight))) + (travelStartTools?.speedDelta || 0),
        carry: getMaxCarry(state),
        inventory: toEngineInventory(state.bag),
        calendarDays: state.calendarDays,
        visitedLocationIds: (state.visitedLocations || []).map(name => findGraphLocationKey(name, mapNodes)).filter(Boolean),
        needsLocalHelp: Boolean(state.needsLocalHelpBeforeMove),
        canSoar: Boolean(state.bio.travelStyle === '가볍고 신속하게'
          || (state.rulesetId !== 'original-1e-3p' && (state.bio.canFly || state.canFlyOverride))
          || isTaxiMove || wagonCapabilities.canSoar),
        ridingWagon: canonicalWagon.commissioned,
        experimentalContraption: wagonCapabilities.canSoar
      },
      graph: engineGraph,
      destinationId,
      destinationRegion: destRegion as TravelRegion,
      destinationType,
      mode: destRegion === 'Soar' || isTaxiMove ? 'soar' : 'move',
      card: { suit: drawnSuit, value: cardVal },
      season: state.currentSeason,
      route: composedMatches ? composedIds : undefined,
      canStopInLoch: hasLochStoppingGear(state),
      protectsFromSoaking: hasSafeWaterwayTravel(state),
      waterwaySpan: wagonCapabilities.waterwaySpan,
      mustUseFullSpeed: !isHitchMove,
      freePathLocationIds: (state.manualConditions || [])
        .filter(condition => condition.startsWith('free-path:'))
        .map(condition => condition.slice('free-path:'.length))
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    const braveApplies = getActiveFamiliarMechanic(state) === 'brave'
      && outcome.encounter.tags?.includes('Behemoth')
      && ['♥', '♦'].includes(drawnSuit);
    let braveInventory = outcome.nextState.inventory;
    if (braveApplies) {
      const candidates = REAGENTS.filter(reagent => reagent.baseRarity <= 6
        && reagent.regionAvailability[toRuleRegion(destRegion, state.currentRegion)] !== 'Unavailable');
      const reagentChoice = prompt(`Brave: 획득할 지역 영약재를 선택하세요.\n${candidates.map((row, index) => `${index + 1}. ${row.displayName} · 기본 희귀도 ${row.baseRarity}`).join('\n')}`, '1');
      if (reagentChoice === null) return;
      const reagent = candidates[Math.max(0, (parseInt(reagentChoice, 10) || 1) - 1)];
      if (!reagent) return;
      const partChoice = prompt(`획득할 부위를 선택하세요.\n${reagent.preparations.map((row, index) => `${index + 1}. ${localizePreparationName(row.name)} · ${localizePreparationMethod(row.method)}`).join('\n')}`, '1');
      if (partChoice === null) return;
      const preparation = reagent.preparations[Math.max(0, (parseInt(partChoice, 10) || 1) - 1)];
      if (!preparation) return;
      const brave = resolveBraveTravelEffect({
        transactionId: `${transactionId}:brave`, inventory: braveInventory, encounter: outcome.encounter,
        region: toRuleRegion(destRegion, state.currentRegion), card: { suit: drawnSuit, value: cardVal },
        reagentId: reagent.id, preparationId: preparation.id
      });
      if (brave.status !== 'resolved') return showAlert(brave.messages.join('\n'));
      braveInventory = brave.inventory;
    }
    const crankyApplies = !braveApplies && outcome.encounter.tags?.includes('Behemoth')
      && (state.companionStates || []).some(row => row.companionId === 'cranky-contraption');
    const clayPotWillBeReady = canonicalWagon.expansionIds.includes('clay-pots')
      && Boolean(canonicalWagon.clayPotReagentId)
      && canonicalWagon.clayPotMoves + 1 >= 2;
    const harvestClayPot = clayPotWillBeReady
      ? askWindowConfirm('Clay Pots의 식물이 두 번의 이동을 마쳐 수확할 수 있습니다. 지금 부위 하나를 수확할까요?')
      : false;
    const servicePreview = consumeGuildServiceMove({
      transactionId: `${transactionId}:services`,
      state: toServiceRuntime(state),
      destinationId,
      destinationRegion: isTaxiMove ? 'Soar' : destRegion as TravelRegion,
      mode: destRegion === 'Soar' || isTaxiMove ? 'soar' : 'move',
      pathCount: outcome.pathCount
    });
    if (!servicePreview.value) {
      showAlert(servicePreview.messages.join('\n'));
      return;
    }
    let travelInventory = braveInventory;
    let resolvedTravelTools = travelStartTools?.tools || travelTools;
    let toolProtectionAppliedTransactionIds: string[] = [];
    let toolProtectionJournals: ClinicAgendaRuntimeState['journalEvents'] = [];
    if (destRegion === 'Titan' || destinationType === 'Titan Ruin') {
      const titanSignal = resolveToolEffects({
        transactionId: `${transactionId}:tool:titan-proximity`, phase: 'travel', trigger: 'titan-proximity',
        tools: resolvedTravelTools, rulesetId: state.rulesetId
      });
      resolvedTravelTools = titanSignal.tools;
      if (titanSignal.appliedToolInstanceIds.length > 0) {
        toolProtectionJournals.push({
          id: `${transactionId}:tool:titan-proximity:journal`, type: 'travel', title: 'Titan Thingamabob signal',
          text: 'The Thingamabob chirped on approaching this old Titan place.'
        });
      }
    }
    const beetleApplies = !braveApplies && !crankyApplies && outcome.encounter.tags?.includes('Beast')
      && (state.companionStates || []).some(row => row.companionId === 'beetle' && !row.usedThisJourney);
    let tentProtection = false;
    if (!servicePreview.value.skipTravelEncounter && !braveApplies && !crankyApplies
      && !servicePreview.value.protectNegativeEncounter && outcome.encounter.tags?.includes('Weather')) {
      const tents = resolvedTravelTools.filter(tool => tool.toolId === 'canvas-tent' && !tool.broken && !tool.consumed);
      if (tents.length > 0) {
        const breakageCard = drawPlayingCard();
        const tent = resolveToolEffects({
          transactionId: `${transactionId}:tool:canvas-tent`, phase: 'travel', trigger: 'weather-encounter',
          tools: resolvedTravelTools, selectedToolInstanceIds: [tents[0].instanceId], card: breakageCard,
          rulesetId: state.rulesetId
        });
        resolvedTravelTools = tent.tools;
        tentProtection = tent.ignoredOutcome;
        const broke = tent.tools.find(tool => tool.instanceId === tents[0].instanceId)?.broken;
        toolProtectionJournals.push({
          id: `${transactionId}:tool:canvas-tent:journal`, type: 'travel', title: 'Canvas Tent protection',
          text: `Weather 조우의 부정적 결과를 막았습니다. 파손 판정 ${breakageCard.suit} ${cardDisplayValue(breakageCard.value)}: ${broke ? '파손됨' : '온전함'}.`
        });
      }
    }
    let crossbowProtection = false;
    if (!servicePreview.value.skipTravelEncounter && !braveApplies && !crankyApplies && !beetleApplies
      && !servicePreview.value.protectNegativeEncounter && !tentProtection
      && outcome.encounter.tags?.some(tag => tag === 'Beast' || tag === 'Behemoth')
      && resolvedTravelTools.some(tool => tool.toolId === 'crossbow' && !tool.broken && !tool.consumed)
      && resolvedTravelTools.some(tool => tool.toolId === 'bolts' && !tool.broken && !tool.consumed)
      && askWindowConfirm('Crossbow와 Bolts를 사용해 이 조우의 부정적 결과를 무시할까요? Bolts 하나를 버립니다.')) {
      const protectedState = resolveCrossbowProtection({
        transactionId: `${transactionId}:tool:crossbow`,
        state: {
          trinkets: state.trinkets.length,
          inventory: travelInventory,
          tools: resolvedTravelTools,
          appliedTransactionIds: state.appliedTransactionIds,
          journalEvents: []
        },
        encounterTags: outcome.encounter.tags || []
      });
      if (!protectedState.value) return showAlert(protectedState.messages.join('\n'));
      crossbowProtection = true;
      travelInventory = protectedState.value.inventory;
      resolvedTravelTools = protectedState.value.tools;
      toolProtectionAppliedTransactionIds = protectedState.value.appliedTransactionIds;
      toolProtectionJournals.push(...protectedState.value.journalEvents);
    }
    const printedIgnoreMidges = (state.manualConditions || []).includes('ignore-midges-until-move')
      && /midge/i.test(`${outcome.encounter.title} ${outcome.encounter.prompt}`);
    const printedIgnoreHere = (state.manualConditions || []).includes(`ignore-negative:${destinationId}`);
    const encounterProtected = servicePreview.value.protectNegativeEncounter
      || tentProtection
      || crossbowProtection
      || beetleApplies
      || printedIgnoreMidges
      || printedIgnoreHere;
    const encounterSkipped = servicePreview.value.skipTravelEncounter || braveApplies || crankyApplies;
    if (!encounterSkipped) setActiveTravelEncounter({
      ...outcome.encounter,
      page: outcome.encounter.sourcePage,
      text: `${encounterProtected ? '[보호 적용] 이 조우의 모든 부정적 결과는 무시합니다.\n\n' : ''}${outcome.encounter.prompt}`,
      cardValue: cardDisplayValue(cardVal),
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      region: destRegion,
      locName: outcome.nextState.currentLocationName,
      transactionId: outcome.pendingEncounter.transactionId
    });
    updateState(s => {
      const mobility = resolveMobilityTravel({
        transactionId,
        state: toMobilityRuntime(s, travelInventory),
        paths: outcome.pathCount,
        destinationName: outcome.nextState.currentLocationName,
        destinationType: destType,
        harvestClayPot
      });
      if (!mobility.value) return s;
      let next = applyMobilityRuntime(s, mobility.value);
      if (repairedTentState) next = {
        ...next,
        trinkets: resizeTrinkets(next.trinkets, Math.max(0, next.trinkets.length - 2), '도구 수리 장신구'),
        appliedTransactionIds: Array.from(new Set([...next.appliedTransactionIds, ...repairedTentState.appliedTransactionIds])),
        journals: appendEngineJournals(next.journals, repairedTentState.journalEvents)
      };
      if (crankyApplies) {
        const cranky = resolveCompanionTrigger({
          transactionId: `${transactionId}:companion:cranky`, state: toMobilityRuntime(next), trigger: 'behemoth'
        });
        if (cranky.value) next = applyMobilityRuntime(next, cranky.value);
      }
      if (beetleApplies) {
        const beetle = resolveCompanionTrigger({
          transactionId: `${transactionId}:companion:beetle`, state: toMobilityRuntime(next), trigger: 'beast'
        });
        if (beetle.value) next = applyMobilityRuntime(next, beetle.value);
      }
      const originId = currentLocationId;
      let nextConditions = consumeTravelConditions(s.manualConditions || [], destinationId, originId);
      if (printedIgnoreHere) nextConditions = nextConditions.filter(condition => condition !== `ignore-negative:${destinationId}`);
      next = {
      ...next,
      currentLocationName: outcome.nextState.currentLocationName,
      currentRegion: destRegion,
      currentLocationType: destType,
      calendarDays: outcome.nextState.calendarDays,
      cumulativeDays: (s.cumulativeDays || 0) + (outcome.nextState.calendarDays - s.calendarDays),
      visitedLocations: Array.from(new Set([...(s.visitedLocations || []), outcome.nextState.currentLocationName])),
      needsLocalHelpBeforeMove: encounterSkipped || encounterProtected ? false : outcome.nextState.needsLocalHelp,
      toolStates: resolvedTravelTools,
      nextMoveSpeedOverride: null,
      manualConditions: nextConditions,
      pendingEncounter: encounterSkipped ? null : {
        ...outcome.pendingEncounter,
        ignoreNegativeEncounterEffects: encounterProtected,
        encounterProtection: beetleApplies ? 'all' as const : encounterProtected ? 'negative' as const : undefined
      },
      appliedTransactionIds: Array.from(new Set([...next.appliedTransactionIds, ...toolProtectionAppliedTransactionIds])),
      calendarHistory: [...s.calendarHistory, `${outcome.nextState.calendarDays}일째: ${outcome.nextState.currentLocationName}으로 ${outcome.pathCount}구간 이동 (이동 비용 ${outcome.movementCost}).`],
      journals: [{
        id: `${transactionId}:journal`,
        title: `이동: ${outcome.nextState.currentLocationName}`,
        text: `${outcome.pathCount}구간을 이동했습니다 (이동 비용 ${outcome.movementCost}).${outcome.soakedItemIds.length ? ` 젖어 버린 물품: ${outcome.soakedItemIds.join(', ')}` : ''}\n${servicePreview.value!.skipTravelEncounter ? 'Hitch a Ride: 여행 조우 대신 농부의 마차 안 풍경을 기록했습니다.' : braveApplies ? 'Brave 길동무가 거수 조우를 긍정적으로 끝내고 지역 영약재를 확보했습니다.' : crankyApplies ? 'Cranky Contraption이 자신을 희생해 거수 조우의 부정적 결과를 모두 막았습니다.' : beetleApplies ? 'Beetle이 맹수 조우의 효과를 막았습니다.' : outcome.encounter.title}`,
        timestamp: Date.now()
      }, ...appendEngineJournals(next.journals, toolProtectionJournals)]
      };
      const consumed = consumeGuildServiceMove({
        transactionId: `${transactionId}:services`,
        state: toServiceRuntime(next),
        destinationId,
        destinationRegion: isTaxiMove ? 'Soar' : destRegion as TravelRegion,
        mode: destRegion === 'Soar' || isTaxiMove ? 'soar' : 'move',
        pathCount: outcome.pathCount
      });
      if (consumed.value) next = applyServiceRuntime(next, consumed.value.nextState);
      const retrieval = (next.pendingServices as ServiceRuntimeState['pendingServices']).find(service =>
        service.serviceId === 'retrieval' && service.status === 'pending-delivery' && service.targetIds[0] === destinationId
      );
      if (retrieval) {
        const delivered = completeGuildServiceDelivery({
          transactionId: `${transactionId}:retrieval`, state: toServiceRuntime(next), serviceTransactionId: retrieval.transactionId
        });
        if (delivered.value) next = applyServiceRuntime(next, delivered.value.nextState);
      }
      return next;
    });
    setNextLocName('');
  };

  const handleTravelMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.journeyActive) return;

    if (state.needsLocalHelpBeforeMove) {
      showAlert("p.25 Earning Your Keep: 이동 후에는 현지 야수를 돕거나 고분 문제를 해결해야 다시 이동할 수 있습니다. 현재 환자 기록 또는 고분 델브를 마무리하세요.");
      return;
    }

    if (!nextLocName) {
      showAlert("이동할 새 위치의 이름을 적어주세요!");
      return;
    }

    // Flight capability validation
    if (destRegion === 'Soar') {
      const hasPendingTaxi = ((state.pendingServices || []) as ServiceRuntimeState['pendingServices'])
        .some(service => service.serviceId === 'taxi-service' && service.status === 'pending-move');
      const hasFlightCapability =
        state.bio.travelStyle === '가볍고 신속하게' ||
        canonicalWagonFromState(state).expansionIds.includes('experimental-contraption') ||
        hasPendingTaxi ||
        !!state.taxiSoarActive ||
        (isHouseRuleEnabled(state.rulesetId, 'companionFlightWaterPermissions')
          && (state.companions || []).some(comp => ['butterfly', 'honeybee', 'wasp'].includes(comp.name)));

      if (!hasFlightCapability) {
        showAlert("🦅 비행(Soar) 이동을 하려면 비행 능력(이동 스타일 '가볍고 신속하게', 비행 동반자[나비, 꿀벌, 말벌], 또는 마차의 비행 기구 개조)이 필요합니다!");
        return;
      }
    }

    const familiarMechanic = getActiveFamiliarMechanic(state);
    const canUseNewsReroll = (state.guildServiceTravelRerolls || 0) > 0;
    const canUseLogisticalMap = destRegion !== 'Soar'
      && hasGuildLogisticalMap(toEngineInventory(state.bag), destRegion as Region);
    const canUsePondSkimmer =
      destRegion === 'Loch' &&
      (state.companionStates || []).some(comp => comp.companionId === 'pond-skimmer' && !comp.usedThisJourney);

    if ((familiarMechanic === 'seasoned' || canUseNewsReroll || canUsePondSkimmer || canUseLogisticalMap) && !travelDrawCard) {
      // Draw 2 cards and trigger selection modal
      const c1 = drawPlayingCard();
      const c2 = drawPlayingCard();
      const draw1 = { suit: c1.suit, val: c1.value };
      const draw2 = { suit: c2.suit, val: c2.value };
      setTravelChoiceSource(familiarMechanic === 'seasoned' ? 'seasoned' : canUseNewsReroll ? 'news' : canUsePondSkimmer ? 'pondSkimmer' : 'logistical-map');
      setSeasonedDraws([draw1, draw2]);
      setShowSeasonedModal(true);
      return;
    }

    const card = travelDrawCard || drawPlayingCard();
    if (!travelDrawCard) setTravelDrawCard(card);
    const drawnSuit = card.suit;
    const cardVal = card.value;

    executeCanonicalTravelMove(drawnSuit, cardVal);
    setTravelDrawCard(null);
  };

  // Resolve Ailment Diagnoses
  const handleDiagnoseAilment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.activePatientId && state.patients.some(patient => patient.id === state.activePatientId && patient.status === 'active')) {
      showAlert('현재 환자의 모든 질환을 먼저 해결해야 합니다.');
      return;
    }
    if (patientCreationPending.current) return;
    patientCreationPending.current = true;
    try {
      const personalityCard = drawPlayingCard();
      const personalityChoices = getPatientPersonalityChoices(personalityCard);
      const choiceInput = await requestControlledPrompt({
        title: '환자의 성격을 선택하세요',
        message: `성격 카드 ${cardDisplayValue(personalityCard.value)}`,
        defaultValue: '1',
        options: personalityChoices.map((choice, index) => ({ value: String(index + 1), label: `${index + 1}. ${patientPersonalityLabel(choice)}` }))
      });
      if (choiceInput === null) return;
      const personalityChoice = Math.min(2, Math.max(0, (parseInt(choiceInput, 10) || 1) - 1)) as 0 | 1 | 2;
      const descriptorCard = drawPlayingCard();
      const severityCard = drawPlayingCard();
      const firstAilmentCard = drawPlayingCard();
      let ailmentCard = firstAilmentCard;
      if (inClinicServiceArea && canonicalClinicAgendaIds(state).includes('library')) {
        const secondAilmentCard = drawPlayingCard();
        const choice = await requestControlledPrompt({
          title: 'Library 질환 카드 선택',
          message: '질환 카드를 두 장 뽑았습니다. 맡을 카드를 선택하세요.',
          defaultValue: '1',
          options: [firstAilmentCard, secondAilmentCard].map((card, index) => ({
            value: String(index + 1),
            label: `${index + 1}. ${card.suit} ${cardDisplayValue(card.value)}`
          }))
        });
        if (choice === null) return;
        ailmentCard = choice === '2' ? secondAilmentCard : firstAilmentCard;
      }
      const lowerCards = Array.from({ length: 24 }, () => drawPlayingCard());
      const currentSettlementId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
      const canChooseMissiveAilment = state.currentLocationType === 'Settlement' && (state.missiveSettlements || []).includes(currentSettlementId);
      let chosenAilmentId: string | undefined;
      if (canChooseMissiveAilment) {
        const choice = await requestControlledPrompt({
          title: 'Send a Missive 질환 선택',
          message: '이 정착지에서 맡을 질환을 선택하세요.',
          defaultValue: '1',
          options: AILMENTS.map((ailment, index) => ({
            value: String(index + 1),
            label: `${index + 1}. ${ailment.displayName} · ${localizeSeverityLabel(ailment.severity)}`
          }))
        });
        if (choice === null) return;
        chosenAilmentId = AILMENTS[Math.max(0, (parseInt(choice, 10) || 1) - 1)]?.id;
        if (!chosenAilmentId) return showAlert('목록에 있는 질환을 선택해 주세요.');
      }
      const transactionId = `patient:${Date.now()}`;
      const result = resolvePatient({
      transactionId,
      patientName: patientNameDraft.trim() || '이름 없는 환자',
      species: patientSpeciesDraft.trim() || '알 수 없는 동물',
      personalityCard,
      personalityChoice,
      descriptorCard,
      severityCard: { value: severityCard.value, suit: severityCard.suit as CardSuit },
      ailmentCard,
      chosenAilmentId,
      multipleAilmentCards: lowerCards,
      reputation: state.reputation,
      timerBonus: getActiveFamiliarMechanic(state) === 'helpful' ? 2 : 0,
      lesserIntermediateTimerBonus: (state.companionStates || []).some(companion => companion.companionId === 'caterpillar') ? 1 : 0
    });
      if (!result.value) {
        showAlert(result.messages.join('\n'));
        return;
      }
      let diagnosisState = {
      patient: result.value.patient,
      reputation: state.reputation,
      worldConditions: [] as string[],
      appliedTransactionIds: [...state.appliedTransactionIds]
    };
      const diagnosisNotes: string[] = [];
      for (const ailmentState of diagnosisState.patient.ailments) {
        if (ailmentState.ailmentId === 'ailment-brand-care') {
          const choice = await requestControlledPrompt({
            title: 'Brand Care 환자 맞이',
            message: '환자를 어떻게 맞이할까요?',
            defaultValue: '1',
            options: [
              { value: '1', label: '1. 치료한다 (길드 명성 -2)' },
              { value: '2', label: '2. 치료를 거절한다 (길드 명성 +2, 환자는 떠남)' }
            ]
          });
          if (choice === null) return;
          if (choice !== '1' && choice !== '2') {
            showAlert('1 또는 2를 선택해 주세요.');
            return;
          }
        const resolved = resolveAilmentDiagnosisEffect({
          transactionId: `${transactionId}:printed:${ailmentState.id}`,
          state: diagnosisState,
          ailmentInstanceId: ailmentState.id,
          brandCareChoice: choice === '1' ? 'treat' : 'refuse'
        });
        if (!resolved.value || resolved.status === 'invalid') {
          showAlert(resolved.messages.join('\n'));
          return;
        }
        diagnosisState = resolved.value;
        diagnosisNotes.push(choice === '1'
          ? 'Brand Care: 길드의 요청을 받아 치료하기로 했다. 명성 -2.'
          : 'Brand Care: 치료를 거절했다. 명성 +2, 환자는 떠났다.');
        }
        if (ailmentState.ailmentId === 'ailment-forager-s-twitch') {
        const followUpCard = drawPlayingCard();
        const resolved = resolveAilmentDiagnosisEffect({
          transactionId: `${transactionId}:printed:${ailmentState.id}`,
          state: diagnosisState,
          ailmentInstanceId: ailmentState.id,
          cardSuit: followUpCard.suit as CardSuit
        });
        if (!resolved.value || resolved.status === 'invalid') {
          showAlert(resolved.messages.join('\n'));
          return;
        }
        diagnosisState = resolved.value;
        const addedWound = followUpCard.suit === '♣' || followUpCard.suit === '♠';
        diagnosisNotes.push(`Forager's Twitch 후속 카드: ${followUpCard.suit} ${cardDisplayValue(followUpCard.value)}${addedWound ? ' · WOUND 1 추가' : ' · 추가 요구조건 없음'}`);
        }
      }
      let patient = diagnosisState.patient;
    const diagnosisTools = canonicalToolsFromState(state);
    const steelAxe = diagnosisTools.find(tool => tool.upgradeId === 'steel-axe' && !tool.broken && !tool.consumed);
    const ailmentStartTools = steelAxe ? resolveToolEffects({
      transactionId: `${transactionId}:tool:ailment-start`,
      phase: 'treatment',
      trigger: 'ailment-start',
      tools: diagnosisTools,
      selectedToolInstanceIds: [steelAxe.instanceId],
      rulesetId: state.rulesetId
    }) : { tools: diagnosisTools, foragingPoints: 0 };
    const ledgerForagingPoints = getGuildLedgerForagingPointBonus(
      toEngineInventory(state.bag),
      toRuleRegion(state.currentRegion)
    );
    patient = {
      ...patient,
      foragingPoints: getStartingForagingPoints(state) + ailmentStartTools.foragingPoints + ledgerForagingPoints,
      reagentsGathered: [],
      initialRememberedNote: patientInitialNoteDraft.trim(),
      startedAtDay: state.cumulativeDays || state.calendarDays,
      journeyTitle: state.journeyGoalTitle || state.journeyDestination
    };
    const activeRows: ActiveAilment[] = patient.ailments.filter(row => row.status === 'active').map(ailmentState => {
      const definition = AILMENTS.find(ailment => ailment.id === ailmentState.ailmentId)!;
      const timer = patient.timers.find(row => row.ailmentInstanceId === ailmentState.id)!;
      return {
        id: ailmentState.id,
        name: definition.displayName,
        severity: definition.severity,
        timer: timer.current,
        maxTimer: timer.maximum,
        tags: definition.requirements.kind === 'special' ? definition.requirements.description : definition.canonicalName,
        description: definition.canonicalName,
        outcome: definition.successEffects.map(effect => effect.effect.type).join(', '),
        consequence: definition.failureEffects.map(effect => effect.effect.type).join(', '),
        foragingPoints: getStartingForagingPoints(state) + ailmentStartTools.foragingPoints + ledgerForagingPoints,
        reagentsGathered: [],
        patientName: patient.name,
        species: patient.species,
        initialRememberedNote: patientInitialNoteDraft.trim(),
        startedAtDay: state.cumulativeDays || state.calendarDays,
        journeyTitle: state.journeyGoalTitle || state.journeyDestination
      };
    });
    const diagnosisDrafts = patient.ailments.map(ailmentState => {
      if (!ailmentState.ailmentId) return null;
      const draft = createPrintedManualDraft(ailmentState.ailmentId, 'diagnosis', {
        encounterTransactionId: `${transactionId}:diagnosis:${ailmentState.id}`,
        patientId: patient.id,
        ailmentInstanceId: ailmentState.id,
        locationId: findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName),
        continuation: 'none'
      });
      if (!draft) return null;
      const cardSuit = String(ailmentState.specialState.diagnosisCardSuit || '');
      const brandChoice = String(ailmentState.specialState.brandCareChoice || '');
      return {
        ...draft,
        inputValues: {
          ...draft.inputValues,
          ...(cardSuit ? { 'follow-up-card': cardSuit, 'condition-check': true } : {}),
          ...(brandChoice ? { 'printed-choice': brandChoice, 'condition-check': true } : {})
        }
      };
    });
    updateState(s => {
      let base = s;
      if (canChooseMissiveAilment) {
        const consumed = consumeGuildServiceMissive({
          transactionId: `${transactionId}:service:missive`,
          state: toServiceRuntime(s),
          settlementId: currentSettlementId
        });
        if (!consumed.value) return s;
        base = applyServiceRuntime(s, consumed.value);
      }
      const archive = createPatientArchiveRecord({
        caseId: patient.id,
        patient,
        location: base.currentLocationName,
        encounteredAt: Date.now(),
        treatmentResult: activeRows.length > 0 ? 'pending' : 'abandoned',
        specialEffects: diagnosisNotes,
        journalEntryIds: [`${transactionId}:journal`],
        sourceJourneyId: base.journey?.journeyId || null,
        transactionIds: [...diagnosisState.appliedTransactionIds.filter(id => !base.appliedTransactionIds.includes(id)), transactionId]
      });
      return enqueueManualDrafts({
        ...base,
        activePatientId: activeRows.length > 0 ? patient.id : null,
        patients: [...base.patients.filter(row => row.id !== patient.id), patient],
        toolStates: ailmentStartTools.tools,
        barterCountThisAilment: 0,
        barterAttemptHistory: Object.fromEntries(Object.entries(base.barterAttemptHistory).filter(([key]) => !key.startsWith(`${patient.id}:`))),
        patientArchive: upsertPatientArchive(base.patientArchive, archive),
        independentUsedThisAilment: false,
        reputation: diagnosisState.reputation,
        appliedTransactionIds: Array.from(new Set([...base.appliedTransactionIds, ...diagnosisState.appliedTransactionIds, transactionId])),
        journals: [{
          id: `${transactionId}:journal`,
          title: `새 환자: ${patient.name}`,
          text: `${patient.personality} · ${patient.descriptor}\n${activeRows.map(row => `${row.name} (${localizeSeverityLabel(row.severity)}, ${row.timer}시간)`).join('\n')}${diagnosisNotes.length > 0 ? `\n\n${diagnosisNotes.join('\n')}` : ''}`,
          timestamp: Date.now()
        }, ...base.journals]
      }, diagnosisDrafts);
    });
    setNewAilmentName('');
    setPatientNameDraft('');
    setPatientSpeciesDraft('');
      setPatientInitialNoteDraft('');
    } finally {
      patientCreationPending.current = false;
    }
  };

  const executeForageDraw = (
    drawnSuit: string,
    cardVal: number,
    overrideRegion?: string,
    source: PendingForagingState['source'] = 'standard'
  ) => {
    const region = (overrideRegion || state.currentRegion) as Exclude<TravelRegion, 'Soar'>;
    const transactionId = `forage:${Date.now()}`;
    const locationRelation = overrideRegion ? 'adjacent' as const : 'current' as const;
    const result = resolveForaging({
      transactionId,
      state: {
        season: state.currentSeason,
        currentRegion: (state.currentRegion === 'Barrow' ? 'Titan' : state.currentRegion) as Exclude<TravelRegion, 'Soar'>,
        currentLocationType: canonicalLocationType(state.currentLocationType),
        adjacentRegions: adjacentRuleRegions(state),
        foragingPoints: state.activeAilment?.foragingPoints || 0,
        inventory: toEngineInventory(state.bag),
        toolIds: state.bag.flatMap(item => item.canonicalToolId ? [item.canonicalToolId] : []),
        tools: canonicalToolsFromState(state),
        patient: getActivePatient(state),
        conditions: state.manualConditions || []
      },
      forageRegion: region,
      locationRelation,
      card: { value: cardVal, suit: drawnSuit },
      source,
      ...canonicalForagingModifiers(state)
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    if (result.value.ailmentInterruption === 'hunted-behemoth') {
      const huntedTimerIds = getActivePatient(state)?.ailments.find(row => row.status === 'active' && row.ailmentId === 'ailment-hunted')?.timerIds;
      handlePassHour(1, huntedTimerIds);
      updateState(s => ({
        ...s,
        appliedTransactionIds: [...s.appliedTransactionIds, transactionId],
        journals: [{
          id: `${transactionId}:hunted`, title: 'Hunted: 거수 출현',
          text: '현재 위치의 스페이드 채집에서 거수가 나타나 조우를 중단했습니다. 채집 포인트를 얻지 못하고 질환 타이머를 1 줄였습니다.',
          timestamp: Date.now()
        }, ...s.journals]
      }));
      showAlert(result.messages.join('\n'));
      return;
    }
    const encounter = result.value.encounter;
    const pending: PendingForagingState = {
      transactionId,
      region,
      locationRelation,
      card: { value: cardVal, suit: drawnSuit },
      timerCostAfterEncounter: result.value.timerCostAfterEncounter,
      encounterId: encounter?.id || null,
      phase: 'choose-reagent',
      source,
      ignoreNegativeEncounterEffects: result.value.ignoredNegativeEncounterEffects
    };
    setActiveForageEncounter({
      ...(encounter || {}),
      title: encounter?.title || '채집',
      text: `${result.value.ignoredNegativeEncounterEffects ? '[Forecast] Weather 태그 조우의 모든 부정적 효과를 무시합니다.\n\n' : ''}${encounter?.prompt || ''}`,
      ignoredNegativeEncounterEffects: result.value.ignoredNegativeEncounterEffects,
      page: encounter?.sourcePage || 152,
      cardValue: cardDisplayValue(cardVal),
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      foundReagents: result.value.candidates.map(candidate => ({
        name: candidate.canonicalName,
        reagentId: candidate.reagentId,
        rarity: candidate.rarity,
        fpAvailable: candidate.automaticWithForagingPoints,
        gapCost: candidate.gapCost,
        cardSuccess: candidate.cardSuccess
      })),
      region,
      season: state.currentSeason,
      timerBaseCost: result.value.timerCostAfterEncounter,
      gatheredPartCount: 0,
      transactionId
    });
    updateState(s => ({
      ...s,
      pendingForaging: pending,
      lastForageCardValue: cardVal,
      independentUsedThisAilment: source === 'familiar-independent' ? true : s.independentUsedThisAilment,
      toolStates: result.value!.nextState.tools || canonicalToolsFromState(s),
      patients: result.value!.foragingPointsGained > 0
        ? updateActivePatient(s, patient => ({ ...patient, foragingPoints: result.value!.nextState.foragingPoints }))
        : s.patients
    }));
  };

  const selectSeasonedCard = useEffectEvent((suit: string, val: number) => {
    if (travelChoiceSource === 'news') {
      updateState((s: GameState) => {
        const result = consumeGuildServiceTravelReroll({
          transactionId: createClientTransaction('service:news-from-trail').id,
          state: toServiceRuntime(s)
        });
        return result.value ? applyServiceRuntime(s, result.value) : s;
      });
    } else if (travelChoiceSource === 'pondSkimmer') {
      const transaction = createClientTransaction('companion:pond-skimmer');
      const result = resolveCompanionTrigger({ transactionId: transaction.id, state: toMobilityRuntime(state), trigger: 'loch-redraw' });
      if (!result.value) return showAlert(result.messages.join('\n'));
      updateState((s: GameState) => applyMobilityRuntime(s, result.value!));
    }
    setTravelChoiceSource(null);
    executeCanonicalTravelMove(suit, val);
  });

  const selectTitanwiseCard = useEffectEvent((suit: string, val: number) => {
    executeForageDraw(suit, val);
  });

  useEffect(() => {
    (window as any)._onSelectSeasonedCard = selectSeasonedCard;
    (window as any)._onSelectTitanwiseCard = selectTitanwiseCard;
    return () => {
      delete (window as any)._onSelectSeasonedCard;
      delete (window as any)._onSelectTitanwiseCard;
    };
  }, []);

  const handleForageDraw = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!state.activeAilment) return;

    const familiarMechanic = getActiveFamiliarMechanic(state);

    const isAdjacent = forageLocationType === 'adjacent';
    const activeRegion = isAdjacent ? forageAdjacentRegion : state.currentRegion;
    const canForageCurrentLocation = ['Wilds', 'Ruin', 'Barrow'].includes(state.currentLocationType);
    if (!isAdjacent && !canForageCurrentLocation) {
      showAlert("룰북 p.32 기준으로 현재 위치 채집은 야생 구역, Titan 유적, 거수 고분에서만 가능합니다. 정착지나 도시에 있다면 인접 위치 채집이나 물꼬 거래를 사용하세요.");
      return;
    }
    if (isAdjacent && !scroungeAdjacentRegions.includes(toRuleRegion(activeRegion))) {
      showAlert('인접 채집은 현재 위치와 실제 지도 경로로 연결된 지역만 선택할 수 있습니다.');
      return;
    }

    const isTitanOrBarrow = activeRegion === 'Titan' ||
                            (!isAdjacent && (state.currentLocationType === 'Barrow' || state.currentLocationType === 'Ruin'));

    if (familiarMechanic === 'titanwise' && isTitanOrBarrow && !forageDrawCard) {
      // Draw 2 cards and trigger selection modal
      const c1 = drawPlayingCard();
      const c2 = drawPlayingCard();
      const draw1 = { suit: c1.suit, val: c1.value };
      const draw2 = { suit: c2.suit, val: c2.value };
      setTitanwiseDraws([draw1, draw2]);
      setShowTitanwiseModal(true);
      return;
    }

    const card = forageDrawCard || drawPlayingCard();
    if (!forageDrawCard) setForageDrawCard(card);
    const drawnSuit = card.suit;
    const cardVal = card.value;

    executeForageDraw(drawnSuit, cardVal, isAdjacent ? forageAdjacentRegion : undefined);
    setForageDrawCard(null);
  };

  // Familiar: Independent benefit - draw normally and forage in an adjacent region without encounter or Timer cost.
  const handleIndependentForage = (adjRegion: string) => {
    if (!state.activeAilment) return;
    if (state.independentUsedThisAilment) {
      showAlert("이미 이번 질병 치료 중에 자유로운 영혼 채집 기회를 사용했습니다.");
      return;
    }
    if (!scroungeAdjacentRegions.includes(toRuleRegion(adjRegion))) {
      showAlert('자유로운 영혼 채집도 현재 위치와 실제 지도 경로로 연결된 지역에서만 가능합니다.');
      return;
    }

    const card = drawPlayingCard();
    executeForageDraw(card.suit, card.value, adjRegion, 'familiar-independent');
  };

  // Check if reagent has at least one prep with potency <= 2
  const isReagentPotencyTwoOrLess = (r: any) => {
    if (!r || !r.preps) return false;
    const matches = r.preps.match(/\[[^\]]+\s+(\d+)\]/g);
    if (!matches) return true; // fallback
    for (const m of matches) {
      const numMatch = m.match(/(\d+)/);
      if (numMatch) {
        const val = parseInt(numMatch[1]);
        if (val <= 2) return true;
      }
    }
    return false;
  };

  // Scrounging Forage Draw Resolver
  const executeScroungeForageDraw = (regionName: string, drawnSuit: string, cardVal: number, cost: number) => {
    const transactionId = `scrounge:foraging:${Date.now()}`;
    const relation = cost === 2 ? 'adjacent' as const : 'current' as const;
    const result = resolveForaging({
      transactionId,
      state: {
        season: state.currentSeason,
        currentRegion: toRuleRegion(state.currentRegion),
        currentLocationType: canonicalLocationType(state.currentLocationType),
        adjacentRegions: adjacentRuleRegions(state),
        foragingPoints: state.activeAilment?.foragingPoints || 0,
        inventory: toEngineInventory(state.bag),
        toolIds: state.bag.flatMap(item => item.canonicalToolId ? [item.canonicalToolId] : []),
        tools: canonicalToolsFromState(state),
        patient: getActivePatient(state),
        conditions: state.manualConditions || []
      },
      forageRegion: toRuleRegion(regionName),
      locationRelation: relation,
      card: { suit: drawnSuit, value: cardVal },
      ...canonicalForagingModifiers(state)
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    if (result.value.ailmentInterruption === 'hunted-behemoth') {
      const huntedTimerIds = getActivePatient(state)?.ailments.find(row => row.status === 'active' && row.ailmentId === 'ailment-hunted')?.timerIds;
      handlePassHour(1, huntedTimerIds);
      updateState(s => ({
        ...s,
        appliedTransactionIds: [...s.appliedTransactionIds, transactionId],
        journals: [{
          id: `${transactionId}:hunted`, title: 'Hunted: 거수 출현',
          text: '현재 위치의 스페이드 채집에서 거수가 나타나 조우를 중단했습니다. 채집 포인트를 얻지 못하고 질환 타이머를 1 줄였습니다.',
          timestamp: Date.now()
        }, ...s.journals]
      }));
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    const selectedFEnc = outcome.encounter;
    const foundReagents: ForageFind[] = outcome.candidates.map(candidate => ({
      name: candidate.canonicalName,
      reagentId: candidate.reagentId,
      rarity: candidate.rarity,
      fpAvailable: candidate.automaticWithForagingPoints,
      gapCost: candidate.gapCost,
      cardSuccess: candidate.cardSuccess
    }));

    setActiveForageEncounter({
      ...(selectedFEnc || {}),
      title: selectedFEnc?.title || '채집',
      text: `${outcome.ignoredNegativeEncounterEffects ? '[Forecast] Weather 태그 조우의 모든 부정적 효과를 무시합니다.\n\n' : ''}${selectedFEnc?.prompt || ''}`,
      ignoredNegativeEncounterEffects: outcome.ignoredNegativeEncounterEffects,
      page: selectedFEnc?.sourcePage || 152,
      cardValue: cardVal === 1 ? 'Ace' : cardVal === 11 ? 'Jack' : cardVal === 12 ? 'Queen' : cardVal === 13 ? 'King' : cardVal,
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      foundReagents: foundReagents,
      region: regionName,
      season: state.currentSeason,
      timerBaseCost: 0,
      gatheredPartCount: 0,
      transactionId
    });

    updateState((s: GameState) => ({
      ...s,
      pendingForaging: {
        transactionId,
        region: toRuleRegion(regionName),
        locationRelation: relation,
        card: { suit: drawnSuit, value: cardVal },
        timerCostAfterEncounter: 0,
        encounterId: selectedFEnc?.id || null,
        phase: 'choose-reagent'
      }
    }));
  };

  const handleScroungeForage = (regionName: string, cost: number) => {
    const patient = state.patients.find(row => row.id === state.activePatientId) || state.patients.at(-1);
    if (!patient) return;
    const result = resolveScrounge({
      transactionId: `scrounge:forage:${Date.now()}`,
      state: toLeaveRuntime(state, patient),
      action: cost === 2 ? 'forage-adjacent' : 'forage-current',
      region: toRuleRegion(regionName)
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState((s: GameState) => applyLeaveRuntime(s, result.value!));
    const suits = ['♥', '♦', '♣', '♠'];
    const drawnSuit = suits[Math.floor(Math.random() * suits.length)];
    const cardVal = Math.floor(Math.random() * 13) + 1;
    executeScroungeForageDraw(regionName, drawnSuit, cardVal, cost);
  };

  const handleScroungeGainReagent = (reagentName: string, cost: number) => {
    const patient = state.patients.find(row => row.id === state.activePatientId) || state.patients.at(-1);
    const normalized = reagentName.toLowerCase();
    const reagent = REAGENTS.find(row => row.displayName.toLowerCase() === normalized || row.canonicalName.toLowerCase() === normalized || row.displayName.toLowerCase().includes(normalized));
    if (!patient || !reagent) return;
    const eligibleParts = reagent.preparations.filter(part => Math.max(0, ...part.tags.filter(tag => !['FAIR', 'FOUL'].includes(tag.tag)).map(tag => tag.value)) <= 2);
    const chosenPart = prompt(`원하는 조제 부위를 선택하세요:\n${eligibleParts.map((part, index) => `${index + 1}. ${localizePreparationName(part.name)} · 무게 ${formatWeight(part.weight)} · ${part.uses}회분`).join('\n')}`);
    if (!chosenPart) return;
    const preparation = eligibleParts[Math.max(0, (parseInt(chosenPart) || 1) - 1)] || eligibleParts[0];
    const region = cost === 4
      ? (scroungeAdjacentRegions.includes(scroungeReagentRegion as Region) ? scroungeReagentRegion : scroungeAdjacentRegions[0])
      : state.currentRegion;
    if (!region) {
      showAlert('지도에서 인접 지역을 찾을 수 없습니다.');
      return;
    }
    const result = resolveScrounge({
      transactionId: createClientTransaction('scrounge:guaranteed').id,
      state: toLeaveRuntime(state, patient),
      action: cost === 4 ? 'guaranteed-adjacent' : 'guaranteed-current',
      region: toRuleRegion(region),
      targetReagentId: reagent.id,
      preparationId: preparation.id
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState((s: GameState) => applyLeaveRuntime(s, result.value!));
    showAlert(`${reagent.displayName} (${preparation.name})을 획득했습니다.`);
  };

  const handleFinishScrounging = () => {
    if (state.pendingLeaveObligation && !state.pendingLeaveObligation.resolved) {
      showAlert('먼저 여분 채집으로 발생한 채집 조우를 해결해야 합니다.');
      return;
    }
    const patient = state.patients.find(row => row.id === state.activePatientId)
      || [...state.patients].reverse().find(row => row.status === 'cured');
    if (!patient) {
      showAlert('마감할 정식 환자 기록을 찾지 못했습니다.');
      return;
    }
    const transactionId = createClientTransaction('leave:treated').id;
    const result = resolveLeave({ transactionId, state: toLeaveRuntime(state, patient), status: 'treated' });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState((s: GameState) => ({
      ...applyLeaveRuntime(s, result.value!),
      scroungingMode: false,
      scroungingTimer: 0
    }));
    showAlert("🚪 여분 채집이 마감되었습니다. 여정을 재개합니다.");
  };

  const handleAbandonPatient = async () => {
    const patient = state.patients.find(row => row.id === state.activePatientId);
    if (!patient || !askWindowConfirm(`${patient.name}의 해결되지 않은 질환 결과를 적용하고 떠나보냅니까?`)) return;
    const note = (await requestControlledPrompt({
      title: '환자를 떠나보낸 기록',
      message: '떠나보낸 장면과 남은 여파를 기록하세요.',
      defaultValue: '',
      kicker: '환자 기록',
      label: '기록',
      inputMode: 'multiline'
    }))?.trim();
    if (!note) return;
    const transaction = createClientTransaction('leave:abandoned');
    const result = resolveLeave({
      transactionId: transaction.id,
      state: toLeaveRuntime(state, patient),
      status: 'abandoned',
      journalNote: note
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState(s => ({
      ...applyLeaveRuntime(s, result.value!),
      needsLocalHelpBeforeMove: false
    }));
  };

  const handleSellOddment = () => {
    const patient = state.patients.find(row => row.id === state.activePatientId) || state.patients.at(-1);
    if (!patient || pawnItemIds.length === 0) return;
    const inventory = toEngineInventory(state.bag);
    const preview = calculatePawnReward(inventory, pawnItemIds);
    if (!askWindowConfirm(`선택한 물건의 전체 무게 ${formatWeight(preview.totalWeight)}를 버리고 장신구 ${preview.trinketReward}개를 받을까요?`)) return;
    const graph = toRuleMapGraph(state);
    const currentId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
    const result = resolvePawn({
      transactionId: `pawn:${Date.now()}`,
      state: {
        inventory,
        patient,
        reputation: state.reputation,
        trinkets: state.trinkets.length,
        currentRegion: toRuleRegion(state.currentRegion),
        adjacentRegions: (graph[currentId]?.neighbors || []).map(id => graph[id]?.region).filter((region): region is Region => Boolean(region)),
        foragingPoints: state.activeAilment?.foragingPoints || 0,
        pendingObligation: null,
        journalEvents: [],
        appliedTransactionIds: state.appliedTransactionIds
      },
      selectedItemIds: pawnItemIds
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    updateState((s: GameState) => ({
      ...s,
      bag: fromEngineInventory(result.value!.inventory, s.bag),
      trinkets: resizeTrinkets(s.trinkets, result.value!.trinkets, '담보 판매 장신구'),
      appliedTransactionIds: result.value!.appliedTransactionIds,
      journals: appendEngineJournals(s.journals, result.value!.journalEvents)
    }));
    setPawnItemIds([]);
  };

  const handleKnitProject = () => {
    if (!hasTool(state, 'tool_needles') && !hasTool(state, '뜨개바늘') && !hasTool(state, 'Knitting Needles')) {
      showAlert("뜨개바늘이 필요합니다.");
      return;
    }
    const projects: Record<string, { id: 'knitted-blanket' | 'knitted-coat' | 'knitted-satchel' | 'knitted-scarf'; name: string; hours: number }> = {
      '1': { id: 'knitted-blanket', name: '뜨개 담요 (Knitted Blanket)', hours: 20 },
      '2': { id: 'knitted-coat', name: '뜨개 코트 (Knitted Coat)', hours: 15 },
      '3': { id: 'knitted-satchel', name: '뜨개 가방 (Knitted Satchel)', hours: 10 },
      '4': { id: 'knitted-scarf', name: '뜨개 목도리 (Knitted Scarf)', hours: 5 }
    };
    const choice = prompt("뜨개 프로젝트 선택:\n1. 담요 20시간\n2. 코트 15시간\n3. 가방 10시간\n4. 목도리 5시간", "4") || '4';
    const project = projects[choice] || projects['4'];
    const availableTimer = state.scroungingTimer || state.activeAilment?.timer || 0;
    if (availableTimer <= 0) {
      showAlert("줄일 수 있는 타이머가 0이면 뜨개질을 진행할 수 없습니다.");
      return;
    }
    if (availableTimer < project.hours) {
      if (state.rulesetId !== 'sandbox') {
        showAlert(`${project.name} 완성에는 ${project.hours}시간이 필요합니다. 현재 타이머는 ${availableTimer}시간입니다.`);
        return;
      }
      if (!askWindowConfirm(`현재 추적 중인 타이머가 ${availableTimer}시간뿐입니다. 복구용 샌드박스에서 ${project.name}을 완성 처리할까요?`)) return;
    }

    const transaction = createClientTransaction('tool:knitting');
    const result = resolveKnittingProject({
      transactionId: transaction.id,
      state: {
        trinkets: state.trinkets.length,
        inventory: toEngineInventory(state.bag),
        tools: canonicalToolsFromState(state),
        appliedTransactionIds: state.appliedTransactionIds,
        journalEvents: []
      },
      projectId: project.id,
      availableHours: availableTimer
    });
    if (!result.value) return showAlert(result.messages.join('\n'));
    updateState((s: GameState) => {
      const nextScroungingTimer = s.scroungingTimer ? Math.max(0, s.scroungingTimer - project.hours) : s.scroungingTimer;
      const patient = getActivePatient(s);
      const nextPatient = patient && !s.scroungingTimer
        ? resolveTimer({ patient, hours: project.hours }).value
        : null;
      return {
        ...s,
        scroungingTimer: nextScroungingTimer,
        patients: nextPatient ? replacePatient(s.patients, nextPatient) : s.patients,
        bag: fromEngineInventory(result.value!.inventory, s.bag),
        toolStates: result.value!.tools,
        appliedTransactionIds: result.value!.appliedTransactionIds,
        journals: appendEngineJournals(s.journals, result.value!.journalEvents)
      };
    });
  };

  const handleExploreNewPath = () => {
    const graph = toServiceMapGraph(state);
    const currentId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
    const nearby = Object.values(graph).filter(node => (shortestPathDistance(graph, currentId, node.id) ?? Infinity) <= 2);
    const candidates = nearby.flatMap((from, index) => nearby.slice(index + 1).flatMap(to =>
      from.edges.some(edge => edge.to === to.id) ? [] : [{ from, to }]
    ));
    if (candidates.length === 0) {
      showAlert('여정 종료 지점 가까이에 새로 연결할 수 있는 두 기존 장소가 없습니다.');
      return;
    }
    const selection = prompt(`연결할 두 장소를 선택하세요:\n${candidates.map((row, index) => `${index + 1}. ${row.from.name} ↔ ${row.to.name}`).join('\n')}`, '1');
    if (selection === null) return;
    const candidate = candidates[(parseInt(selection, 10) || 1) - 1];
    if (!candidate) {
      showAlert('목록에 있는 연결을 선택해 주세요.');
      return;
    }
    const kindChoice = prompt('새 연결의 종류를 선택하세요.\n1. 길\n2. 물길', '1');
    if (kindChoice === null) return;
    const kind = kindChoice === '2' ? 'waterway' as const : 'path' as const;
    const pathDesc = prompt('길을 벗어나 발견한 풍경과 야생 동물을 기록하세요.', `${candidate.from.name}에서 ${candidate.to.name}(으)로 이어지는 ${kind === 'waterway' ? '물길' : '길'}을 발견했다.`)?.trim();
    if (!pathDesc) return;
    const transaction = createClientTransaction('downtime:explore');
    try {
      const runtime = resolveCanonicalDowntime(transaction.id, toCanonicalDowntimeRuntime(state), {
        activity: 'explore', fromId: candidate.from.id, toId: candidate.to.id, kind, journalText: pathDesc
      });
      updateState((s: GameState) => {
        const next = applyCanonicalDowntimeRuntime(s, runtime);
        return { ...next, visitedLocations: Array.from(new Set([...(next.visitedLocations || []), candidate.from.name, candidate.to.name])) };
      });
      showAlert('새 연결을 지도와 휴식기 일지에 함께 저장했습니다.');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '새 경로를 저장하지 못했습니다.');
    }
  };

  const handleAddMappedSettlement = () => {
    const settlementName = prompt("지도에 추가할 정착지 이름을 입력하세요:")?.trim();
    if (!settlementName) return;
    const regionName = prompt("정착지 지역을 입력하세요: 숲(Forest), 초원(Meadow), 호수(Loch), 늪지(Bog), 산맥(Mountain), Titan 유적", state.currentRegion)?.trim() || state.currentRegion;
    const sourceNote = prompt("이 정착지가 생긴 이유나 특징을 적어주세요:", "여정의 영구적 결과로 생긴 정착지")?.trim() || "여정의 영구적 결과로 생긴 정착지";

    updateState((s: GameState) => ({
      ...s,
      customMapLocations: upsertCustomMapLocation(
        s.customMapLocations || [],
        settlementName,
        regionName,
        'Settlement',
        s.currentLocationName,
        '영구적 결과: 정착지 추가'
      ),
      visitedLocations: Array.from(new Set([...(s.visitedLocations || []), settlementName])),
      journals: [
        {
          id: 'settlement_map_' + Date.now(),
          title: `🏘️ 지도에 새 정착지 추가: ${settlementName}`,
          text: `${s.currentLocationName} 근처에 ${settlementName} 정착지를 지도에 표시했습니다.\n지역: ${regionName}\n기록: ${sourceNote}`,
          timestamp: Date.now()
        },
        ...s.journals
      ]
    }));

    showAlert(`🏘️ ${settlementName} 정착지를 지도에 저장했습니다.`);
  };

  const getClinicAgendaRequirement = (agendaService: string, s: GameState = state) => {
    const activeServices = Array.from(new Set((s.clinics || []).map(c => c.agendaService).filter(Boolean))) as string[];
    const isVisited = (loc: string) => (s.visitedLocations || []).includes(loc);

    if (agendaService === 'pantry') {
      return { satisfied: s.reputation >= 15, message: `길드 명성 15 이상 필요 (현재: ${s.reputation})` };
    }
    if (agendaService === 'library') {
      return {
        satisfied: isVisited('Summit') && !!s.completedReconnecting,
        message: `Summit 방문 및 '동료들과 재회하기' 완료 필요 (Summit 방문: ${isVisited('Summit') ? '✅' : '❌'}, 재회 완료: ${s.completedReconnecting ? '✅' : '❌'})`
      };
    }
    if (agendaService === 'hive_boxes') {
      return { satisfied: isVisited('Spoolkeep'), message: `Spoolkeep 방문 필요 (방문 여부: ${isVisited('Spoolkeep') ? '✅' : '❌'})` };
    }
    if (agendaService === 'gardens') {
      return { satisfied: isVisited('Noonhill'), message: `Noonhill 방문 필요 (방문 여부: ${isVisited('Noonhill') ? '✅' : '❌'})` };
    }
    if (agendaService === 'greenhouses') {
      return {
        satisfied: activeServices.includes('gardens') && isVisited('Glasswall'),
        message: `정원 서비스 구축 및 Glasswall 방문 필요 (정원 서비스: ${activeServices.includes('gardens') ? '✅' : '❌'}, Glasswall 방문: ${isVisited('Glasswall') ? '✅' : '❌'})`
      };
    }
    if (agendaService === 'sodden_logs') {
      return { satisfied: isVisited('Odoak'), message: `Odoak 방문 필요 (방문 여부: ${isVisited('Odoak') ? '✅' : '❌'})` };
    }
    if (agendaService === 'taproom') {
      return { satisfied: isVisited('Vessel'), message: `Vessel 방문 필요 (방문 여부: ${isVisited('Vessel') ? '✅' : '❌'})` };
    }
    if (agendaService === 'hostel') {
      return { satisfied: activeServices.includes('taproom'), message: `선술집(Taproom) 구축 필요 (구축 여부: ${activeServices.includes('taproom') ? '✅' : '❌'})` };
    }

    return { satisfied: true, message: '없음 (즉시 추가 가능) ✅' };
  };

	  const handleBuildClinic = (agendaService: string) => {
    const requirement = getClinicAgendaRequirement(agendaService);
	    if (!requirement.satisfied) {
      showAlert(requirement.message);
      return;
    }
	    const agendaId = normalizeClinicAgendaId(agendaService);
    let soddenReagentId: string | null = null;
    if (requirement.satisfied && agendaId === 'sodden-logs') {
      const insects = REAGENTS.filter(row => row.type === 'INSECT');
      const choice = prompt(`Sodden Logs에서 기를 곤충 영약재를 선택하세요.\n${insects.map((row, index) => `${index + 1}. ${row.displayName}`).join('\n')}`, '1');
      if (choice === null) return;
      soddenReagentId = insects[Math.max(0, (parseInt(choice, 10) || 1) - 1)]?.id || null;
      if (!soddenReagentId) return;
    }
    const name = prompt('완공될 약제소 이름을 기록하세요:', `${state.currentLocationName} 약제소`)?.trim();
    if (!name) return;
    const transaction = createClientTransaction('clinic-commission');
    const locationId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
    const runtime: ClinicRuntimeState = {
      currentSeason: state.currentSeason,
      completedSeasons: state.completedSeasons,
      trinkets: state.trinkets.length,
      reputation: state.reputation,
      clinics: canonicalClinicsFromState(state),
      agendaIds: canonicalClinicAgendaIds(state),
      goodwillWeight: state.goodwillDonationsVal || 0,
      graph: toServiceMapGraph(state),
      visitedLocationNames: state.visitedLocations || [],
      completedReconnecting: Boolean(state.completedReconnecting),
      appliedTransactionIds: state.appliedTransactionIds,
      journalEvents: []
    };
    try {
      const outcome = commissionClinic({ transactionId: transaction.id, state: runtime, locationId, name, locationType: state.currentLocationType === 'Wilds' ? 'Wild' : state.currentLocationType, curedHere: !!state.curedAilmentInThisWilds, agendaId });
      const clinic = outcome.clinics.find(row => row.id === `clinic:${transaction.id}`)!;
      updateState(s => {
        let next: GameState = {
        ...s,
        trinkets: s.trinkets.slice(15),
        clinics: [...(s.clinics || []), { id: clinic.id, locationName: s.currentLocationName, region: s.currentRegion, agendaService, status: clinic.status, completesAtSeason: clinic.completesAtSeason }],
        clinicAgendaIds: outcome.agendaIds,
        customMapLocations: upsertCustomMapLocation(s.customMapLocations || [], s.currentLocationName, s.currentRegion, 'Clinic', s.currentLocationName, '약제소 건설'),
        curedAilmentInThisWilds: false,
        appliedTransactionIds: outcome.appliedTransactionIds,
        journals: [{ id: `${transaction.id}:journal`, title: `약제소 건설: ${name}`, text: `${s.currentLocationName}에 건설을 시작했습니다. ${clinic.completesAtSeason} 시작에 완공됩니다.`, timestamp: transaction.at }, ...s.journals]
        };
        if (soddenReagentId) {
          const agenda = resolveClinicAgendaAction({
            transactionId: `${transaction.id}:sodden-logs`,
            state: toClinicAgendaRuntime(next),
            action: { kind: 'choose-sodden-logs', reagentId: soddenReagentId }
          });
          next = applyClinicAgendaRuntime(next, agenda);
        }
        return next;
      });
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '약제소 설립 조건을 확인해 주세요.');
    }
	  };

	  const handleMailboxPatient = () => {
    const note = prompt('외부 길드 우체통에서 확인한 도움 요청을 기록하세요:', '도움 요청의 발신자, 위치, 요청 내용을 기록했다.')?.trim();
    if (!note) return;
    const transaction = createClientTransaction('clinic:mailbox');
    try {
      const outcome = resolveClinicAgendaAction({
        transactionId: transaction.id,
        state: toClinicAgendaRuntime(state),
        action: { kind: 'record-mailbox-call', note }
      });
      updateState(s => applyClinicAgendaRuntime(s, outcome));
      showAlert('길드 우체통의 도움 요청을 일지에 기록했습니다. 환자와 질환은 원문의 일반 절차로 진단하세요.');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '우체통 기록을 완료하지 못했습니다.');
    }
	  };

  const handlePantryHibernate = () => {
    if (!atClinicLocation) return showAlert('Pantry 동면은 약제소에 머물 때만 사용할 수 있습니다.');
    const occupantsInput = prompt('함께 동면할 인원 수를 입력하세요. 평판 15 미만이면 인원당 장신구 15개가 필요합니다.', '1');
    if (occupantsInput === null) return;
    const occupants = Math.max(1, parseInt(occupantsInput, 10) || 1);
    const transaction = createClientTransaction('clinic:pantry');
    try {
      const outcome = resolveClinicAgendaAction({
        transactionId: transaction.id,
        state: toClinicAgendaRuntime(state),
        action: { kind: 'hibernate', occupants }
      });
      const season = resolveSeason({
        transactionId: `${transaction.id}:season`,
        state: {
          season: state.currentSeason,
          completedSeasons: state.completedSeasons,
          reputation: outcome.reputation,
          trinkets: outcome.trinkets,
          clinics: outcome.clinics.map(clinic => ({
            id: clinic.id, locationId: clinic.locationId, status: clinic.status,
            completesAtSeason: clinic.completesAtSeason, gardenReagentId: clinic.gardenReagentId
          })),
          agendaServices: outcome.agendaIds,
          goodwillDonatedWeight: outcome.goodwillWeight,
          companions: (state.companionStates || []).map(companion => ({ id: companion.instanceId, kind: companion.companionId, seasonsTravelled: companion.seasonsTravelled || 0 })),
          downtimeCompleted: true,
          journalEvents: outcome.journalEvents,
          appliedTransactionIds: outcome.appliedTransactionIds
        }
      });
      if (!season.value) throw new Error(season.messages.join('\n'));
      updateState(s => {
        let next = applyClinicAgendaRuntime(s, outcome);
        next = {
          ...next,
          currentSeason: season.value!.nextSeason,
          completedSeasons: season.value!.nextState.completedSeasons,
          reputation: season.value!.nextState.reputation,
          trinkets: resizeTrinkets(next.trinkets, season.value!.nextState.trinkets, 'Pantry 계절 정산 장신구'),
          goodwillDonationsVal: 0,
          downtimeCompleted: false,
          calendarDays: 0,
          appliedTransactionIds: season.value!.nextState.appliedTransactionIds,
          clinics: (next.clinics || []).map((clinic, index) => {
            const canonical = season.value!.nextState.clinics[index];
            return canonical ? { ...clinic, status: canonical.status, completesAtSeason: canonical.completesAtSeason } : clinic;
          }),
          companionStates: (next.companionStates || []).map(companion => {
            const canonical = season.value!.nextState.companions.find(row => row.id === companion.instanceId);
            return canonical ? { ...companion, companionId: canonical.kind, seasonsTravelled: canonical.seasonsTravelled } : companion;
          })
        };
        const restored = restoreSeasonalServiceMutations(toServiceRuntime(next), season.value!.nextSeason);
        return applyServiceRuntime(next, restored);
      });
      showAlert('겨울 동면을 마치고 봄이 시작되었습니다.');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '동면을 완료하지 못했습니다.');
    }
  };

  const handleGardenPlant = (itemId: string) => {
    const clinic = canonicalClinicsFromState(state).find(row => row.status === 'active' && row.locationId === currentClinicLocationId);
    if (!clinic) return showAlert('정원에 심으려면 해당 약제소에 머물러야 합니다.');
    const transaction = createClientTransaction('clinic:garden:plant');
    try {
      const outcome = resolveClinicAgendaAction({
        transactionId: transaction.id,
        state: toClinicAgendaRuntime(state),
        action: { kind: 'plant-garden', clinicId: clinic.id, itemId }
      });
      updateState(s => applyClinicAgendaRuntime(s, outcome));
      showAlert('이 약제소의 정원에 식물 영약재를 심었습니다.');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '정원에 심지 못했습니다.');
    }
  };

  const handleGardenHarvest = () => {
    const clinic = canonicalClinicsFromState(state).find(row => row.status === 'active' && row.locationId === currentClinicLocationId);
    const patient = getActivePatient(state);
    const ailment = patient?.ailments.find(row => row.status === 'active');
    const reagent = clinic?.gardenReagentId ? REAGENT_BY_ID.get(clinic.gardenReagentId) : null;
    if (!clinic || !ailment || !reagent) return showAlert('현재 약제소의 정원과 치료 중인 질환이 모두 필요합니다.');
    const choice = prompt(`수확할 부위를 선택하세요:\n${reagent.preparations.map((part, index) => `${index + 1}. ${localizePreparationName(part.name)} · ${localizePreparationMethod(part.method)}`).join('\n')}`, '1');
    if (choice === null) return;
    const preparation = reagent.preparations[Math.max(0, (parseInt(choice, 10) || 1) - 1)];
    if (!preparation) return;
    const transaction = createClientTransaction('clinic:garden:harvest');
    try {
      const outcome = resolveClinicAgendaAction({
        transactionId: transaction.id,
        state: toClinicAgendaRuntime(state),
        action: { kind: 'harvest-garden', clinicId: clinic.id, ailmentInstanceId: ailment.id, preparationId: preparation.id }
      });
      updateState(s => applyClinicAgendaRuntime(s, outcome));
      showAlert(`${reagent.displayName}의 부위를 정원에서 수확했습니다.`);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '정원 수확을 완료하지 못했습니다.');
    }
  };

  const handleSoddenLogInsect = (reagentId: string) => {
    const transaction = createClientTransaction('clinic:sodden:choose');
    try {
      const outcome = resolveClinicAgendaAction({
        transactionId: transaction.id,
        state: toClinicAgendaRuntime(state),
        action: { kind: 'choose-sodden-logs', reagentId }
      });
      updateState(s => applyClinicAgendaRuntime(s, outcome));
      showAlert('물에 젖은 통나무의 곤충 영약재를 지정했습니다.');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '곤충을 지정하지 못했습니다.');
    }
  };

  const handleSoddenLogHarvest = () => {
    const patient = getActivePatient(state);
    const ailment = patient?.ailments.find(row => row.status === 'active');
    const reagent = state.soddenLogInsect ? REAGENT_BY_ID.get(state.soddenLogInsect) : null;
    if (!ailment || !reagent) return showAlert('치료 중인 질환과 지정된 곤충 영약재가 필요합니다.');
    const choice = prompt(`채취할 부위를 선택하세요:\n${reagent.preparations.map((part, index) => `${index + 1}. ${localizePreparationName(part.name)} · ${localizePreparationMethod(part.method)}`).join('\n')}`, '1');
    if (choice === null) return;
    const preparation = reagent.preparations[Math.max(0, (parseInt(choice, 10) || 1) - 1)];
    if (!preparation) return;
    const transaction = createClientTransaction('clinic:sodden:harvest');
    try {
      const outcome = resolveClinicAgendaAction({
        transactionId: transaction.id,
        state: toClinicAgendaRuntime(state),
        action: { kind: 'harvest-sodden-logs', ailmentInstanceId: ailment.id, reagentId: reagent.id, preparationId: preparation.id }
      });
      updateState(s => applyClinicAgendaRuntime(s, outcome));
      showAlert(`${reagent.displayName}을 채취하고 모든 질환 타이머를 1 줄였습니다.`);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '통나무 수확을 완료하지 못했습니다.');
    }
  };

  const handleGoodwillDonate = (itemId: string) => {
    const item = state.bag.find(i => i.id === itemId);
    if (!item) return;

    if (!askWindowConfirm(`🎁 이 아이템 (${localizeInventoryItemName(item.name)}, 무게: ${formatWeight(item.weight)})을 약제소 친선 매대에 기부하시겠습니까?\n시즌 종료 시 기부한 무게만큼 명성을 획득합니다.`)) {
      return;
    }

    const transaction = createClientTransaction('clinic:goodwill');
    try {
      const outcome = resolveClinicAgendaAction({
        transactionId: transaction.id,
        state: toClinicAgendaRuntime(state),
        action: { kind: 'donate-goodwill', itemId }
      });
      updateState(s => applyClinicAgendaRuntime(s, outcome));
      showAlert(`기부 완료. 현재 계절 누적 기부 무게: ${formatWeight(outcome.goodwillWeight)}`);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : '기부를 완료하지 못했습니다.');
    }
  };

  const handleLegacySettleSeasonTipsAndDonations = (nextSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter') => {
    const activeServices = Array.from(new Set((state.clinics || []).map(c => c.agendaService).filter(Boolean))) as string[];
    const clinicsCount = (state.clinics || []).length;

    // Taproom / Hostel calculation
    let tipPerClinic = 0;
    if (activeServices.includes('hostel')) tipPerClinic = 2;
    else if (activeServices.includes('taproom')) tipPerClinic = 1;

    const totalTips = clinicsCount * tipPerClinic;
    const goodwillRep = Math.round(state.goodwillDonationsVal || 0);

    updateState((s: GameState) => {
      const earnedTrinkets = Array(totalTips).fill("선술집 수입 (Trinket)");
      const nextTrinkets = [...s.trinkets, ...earnedTrinkets];
      const nextRep = s.reputation + goodwillRep;

      return {
        ...s,
        currentSeason: nextSeason,
        trinkets: nextTrinkets,
        reputation: nextRep,
        goodwillDonationsVal: 0,
        journals: [
          {
            id: 'season_settle_' + Date.now(),
            title: `🍂 계절 정산 결과 (${localizeSeasonLabel(s.currentSeason)} → ${localizeSeasonLabel(nextSeason)})`,
            text: `계절이 바뀌어 길드 약제소들의 정산을 마쳤습니다.\n- 운영 중인 약제소 수: ${clinicsCount}개\n- 선술집(Taproom/Hostel) 팁 수입: 장신구 ${totalTips}개 획득\n- 친선 매대 기부 무게: ${formatWeight(s.goodwillDonationsVal || 0)} → 길드 평판 +${goodwillRep} 획득`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    showAlert(`🍂 계절 정산 완료!\n\n🪙 선술집 팁 수입: 장신구 +${totalTips}개\n🎁 기부금 명성 전환: 평판 +${goodwillRep}\n\n계절이 [${localizeSeasonLabel(nextSeason)}]으로 변경되었습니다.`);
  };

  const handleSettleSeasonTipsAndDonations = (_requestedSeason?: 'Spring' | 'Summer' | 'Autumn' | 'Winter') => {
    const transactionId = `season:${Date.now()}`;
    const result = resolveSeason({
      transactionId,
      state: {
        season: state.currentSeason,
        completedSeasons: state.completedSeasons,
        reputation: state.reputation,
        trinkets: state.trinkets.length,
        clinics: (state.clinics || []).map((clinic, index) => ({
          id: clinic.id || `clinic:${normalizeMapLocationName(clinic.locationName)}:${index}`,
          locationId: findMapLocationKey(clinic.locationName, state.customMapLocations || []) || clinic.locationName,
          status: clinic.status || 'active',
          completesAtSeason: clinic.completesAtSeason,
          gardenReagentId: clinic.gardenReagentId
        })),
        agendaServices: Array.from(new Set((state.clinics || []).flatMap(clinic => clinic.agendaService ? [clinic.agendaService] : []))),
        goodwillDonatedWeight: state.goodwillDonationsVal || 0,
        companions: (state.companionStates || []).map(companion => ({ id: companion.instanceId, kind: companion.companionId, seasonsTravelled: companion.seasonsTravelled || 0 })),
        downtimeCompleted: state.downtimeCompleted,
        journalEvents: [],
        appliedTransactionIds: state.appliedTransactionIds
      }
    });
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    const outcome = result.value;
    updateState(s => {
      let next: GameState = {
        ...s,
        currentSeason: outcome.nextSeason,
        completedSeasons: outcome.nextState.completedSeasons,
        reputation: outcome.nextState.reputation,
        trinkets: Array.from({ length: outcome.nextState.trinkets }, (_, index) => s.trinkets[index] || '약제소 계절 수입 장신구'),
        goodwillDonationsVal: 0,
        downtimeCompleted: false,
        appliedTransactionIds: outcome.nextState.appliedTransactionIds,
        clinics: (s.clinics || []).map((clinic, index) => {
          const canonical = outcome.nextState.clinics[index];
          return canonical ? { ...clinic, id: canonical.id, status: canonical.status, completesAtSeason: canonical.completesAtSeason } : clinic;
        }),
        companionStates: (s.companionStates || []).map(companion => {
          const canonical = outcome.nextState.companions.find(row => row.id === companion.instanceId);
          return canonical ? { ...companion, companionId: canonical.kind, seasonsTravelled: canonical.seasonsTravelled } : companion;
        }),
        journals: [{
          id: `${transactionId}:journal`, title: `계절 전환: ${localizeSeasonLabel(outcome.previousSeason)} → ${localizeSeasonLabel(outcome.nextSeason)}`,
          text: `약제소 수입 장신구 +${outcome.clinicIncome}, 친선 기부 명성 +${outcome.goodwillReputation}, 완공 약제소 ${outcome.completedClinicIds.length}개, 변태한 동반자 ${outcome.transformedCompanionIds.length}마리.`,
          timestamp: Date.now()
        }, ...s.journals]
      };
      const beforeMutations = (next.serviceMapMutations || []) as ServiceMapMutation[];
      const restored = restoreSeasonalServiceMutations(toServiceRuntime(next), outcome.nextSeason);
      const restoredNodeIds = new Set(beforeMutations.filter(mutation =>
        mutation.active && mutation.kind === 'temporary-region' && mutation.restoredAtSeason === outcome.nextSeason
      ).flatMap(mutation => mutation.nodeIds));
      next = applyServiceRuntime(next, restored);
      if (restoredNodeIds.size > 0) {
        next = {
          ...next,
          customMapLocations: (next.customMapLocations || []).map(location => restoredNodeIds.has(location.id) && restored.graph[location.id]
            ? { ...location, region: toRuleRegion(restored.graph[location.id].region) }
            : location)
        };
      }
      return next;
    });
    setLocalSeason(outcome.nextSeason);
    showAlert(`${localizeSeasonLabel(outcome.nextSeason)}으로 계절이 바뀌었습니다. 장신구 +${outcome.clinicIncome}, 명성 +${outcome.goodwillReputation}.`);
  };

  const handleAdvanceSeason = () => {
    if (askWindowConfirm(`${localizeSeasonLabel(state.currentSeason)}을 마치고 룰북 순서의 다음 계절로 전환하시겠습니까?`)) {
      handleSettleSeasonTipsAndDonations();
    }
  };

  // Bartering Resolution
  const handleBarterAttempt = async (reagentName: string, barterLocation?: BarterLocationOption) => {
    const patient = state.patients.find(row => row.id === state.activePatientId);
    if (!patient) {
      showAlert('먼저 현재 환자를 확정해야 합니다.');
      return;
    }
    const normalized = reagentName.trim().toLowerCase();
    const reagent = REAGENTS.find(row =>
      row.displayName.toLowerCase().includes(normalized)
      || row.canonicalName.toLowerCase().includes(normalized)
    );
    if (!reagent) {
      showAlert("해당 이름의 영약재를 찾을 수 없습니다.");
      return;
    }
    if (reagent.type === 'TITAN') {
      showAlert('티탄 영약재는 물꼬 거래로 구할 수 없습니다.');
      return;
    }

    const availableBarterLocations = getAvailableBarterLocations(state);
    const selectedBarterLocation = barterLocation || availableBarterLocations[0];
    if (!selectedBarterLocation) {
      showAlert("룰북 p.34 기준으로 물꼬 거래는 현재 위치 또는 인접한 정착지/도시에서만 가능합니다.");
      return;
    }

    const preparationChoice = reagent.preparations.length === 1
      ? '1'
      : await requestControlledPrompt({
        title: '거래할 부위를 선택하세요',
        message: reagent.displayName,
        defaultValue: '1',
        kicker: '물꼬 거래',
        options: reagent.preparations.map((row, index) => ({
          value: String(index + 1),
          label: `${index + 1}. ${localizePreparationName(row.name)} · 무게 ${formatWeight(row.weight)} · ${row.uses}회분`
        }))
      });
    if (!preparationChoice) return;
    const preparation = reagent.preparations[Math.max(0, (parseInt(preparationChoice) || 1) - 1)] || reagent.preparations[0];
    const graph = toBarterMapGraph(state);
    const currentLocationId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
    const transactionId = createClientTransaction(`barter:${patient.id}`).id;
    const started = resolveBarterStart({
      transactionId,
      state: toBarterRuntime(state, patient),
      patientId: patient.id,
      targetReagentId: reagent.id,
      preparationId: preparation.id,
      currentLocationId,
      locationId: selectedBarterLocation.key,
      season: state.currentSeason,
      graph
    });
    if (!started.value) {
      showAlert(started.messages.join('\n'));
      return;
    }

    // Step 1: Draw Social Encounter Card
    const socialDraw = drawPlayingCard();
    const socialSuit = socialDraw.suit as CardSuit;
    const socialVal = socialDraw.value;
    const socialCard = { suit: socialSuit, value: socialVal };

    const regionName = selectedBarterLocation.region || state.currentRegion;
    const indexedEncounter = findEncounter({
      encounterType: 'social',
      region: regionName as TravelRegion,
      season: state.currentSeason,
      locationType: selectedBarterLocation.type,
      city: selectedBarterLocation.type === 'City' ? selectedBarterLocation.name : undefined,
      card: socialCard
    });
    if (!indexedEncounter) {
      showAlert('해당 카드의 정규 Social Encounter를 찾지 못했습니다.');
      return;
    }
    const social = resolveBarterEncounter({
      transactionId: `${transactionId}:social`,
      state: started.value,
      card: socialCard,
      encounter: indexedEncounter
    });
    if (!social.value) {
      showAlert(social.messages.join('\n'));
      return;
    }
    const manualDraft = social.status === 'manual'
      ? createPrintedManualDraft(indexedEncounter.id, 'encounter', {
        encounterTransactionId: `${transactionId}:social`,
        barterId: transactionId,
        patientId: patient.id,
        locationId: selectedBarterLocation.key,
        continuation: 'barter-social'
      })
      : null;
    updateState((s: GameState) => enqueueManualDrafts(applyBarterRuntime(s, social.value!), [manualDraft]));

  };

  // Add Foraged item directly (Manual collection)
  const handleCollectReagent = (reagentName: string) => {
    const canonical = findCanonicalReagent(reagentName);
    const r = canonical ? reagentDisplayRecord(canonical) : null;
    if (!r) {
      showAlert("영약재 이름을 도감에서 찾을 수 없습니다.");
      return;
    }

    // Split preps by newlines or green circles or fractions
    const parts = splitReagentPreparations(r.preps);
    const chosenPart = prompt(`원하는 영약재 부위를 번호로 선택하세요:\n${parts.map((p, i) => `${i+1}. ${p.trim()}`).join('\n')}`);

    if (!chosenPart) return;
    const partIdx = parseInt(chosenPart) - 1;
    const partText = parts[partIdx] || parts[0];

    updateState(s => {
      const newItem: BagItem = createPreparedReagentItem(r, partText, 'reag');

      const { nextGoalCounter, nextChecklist } = checkReagentGatherForGoal(s, r.name);

      return {
        ...s,
        bag: [...s.bag, newItem],
        journeyGoalCounter: nextGoalCounter,
        journeyGoalChecklist: nextChecklist
      };
    });
  };

  const handleCreateReplacementReagent = () => {
    if (!state.activeAilment) return;
    const requirements = parseAilmentRequirements(state.activeAilment.tags);
    const choices = requirements.flatMap(req => {
      if (req.isSpecialBone) return [{ tag: 'BONE', val: 1, label: '부목용 약재' }];
      return req.alternatives.map(alt => ({ tag: alt.tag, val: alt.val, label: `${alt.tag} ${alt.val}` }));
    });

    if (choices.length === 0) {
      showAlert("이 질병에서 대체할 요구 성분을 찾지 못했습니다.");
      return;
    }

    const choiceInput = prompt(
      `대체할 요구 성분을 선택하세요:\n${choices.map((choice, idx) => `${idx + 1}. ${choice.label}`).join('\n')}`,
      '1'
    );
    const choice = choices[Math.max(0, (parseInt(choiceInput || '1') || 1) - 1)] || choices[0];
    const modeInput = prompt("대체 방식 선택:\n1. Make Do — 한 단계 높은 가치의 대용품\n2. Replacement — 희귀도 12, 무게 2/3 대안 재료", "2");
    if (!modeInput) return;
    const isMakeDo = modeInput === '1';
    if (!isHouseRuleEnabled(state.rulesetId, 'directMakeDoReplacement')) {
      const tag = choice.tag as RuleTag;
      const acquisitionBase = isMakeDo
        ? createMakeDoAcquisition(tag, choice.val)
        : createReplacementAcquisition({
          targetTag: tag,
          requiredPotency: choice.val,
          name: prompt('발견할 대체 영약재의 이름을 정하세요.', `${choice.tag} 대체재`) || `${choice.tag} 대체재`,
          preparation: prompt('발견할 조제 부위의 이름을 정하세요.', '준비한 부위') || '준비한 부위'
        });
      const sourceInput = prompt('어떤 방식으로 획득할까요?\n1. 채집\n2. 흥정', '1');
      if (!sourceInput) return;
      const acquisition = { ...acquisitionBase, selectedSource: sourceInput === '2' ? 'barter' as const : 'forage' as const };
      updateState((s: GameState) => ({
        ...s,
        pendingAlternativeAcquisition: acquisition,
        journals: [{
          id: `alternative-acquisition:${Date.now()}`,
          title: `${isMakeDo ? 'Make Do' : 'Replacement'} 탐색 시작`,
          text: `${choice.label}을 대신할 조건을 기록했습니다. ${isMakeDo ? `${choice.tag} ${choice.val + 1} 이상의 실제 부위` : `희귀도 12, 무게 2/3의 ${acquisition.name} (${acquisition.preparation})`}를 ${acquisition.selectedSource === 'barter' ? '흥정' : '채집'} 성공으로 획득해야 합니다.`,
          timestamp: Date.now()
        }, ...s.journals]
      }));
      showAlert('대체 조건을 저장했습니다. 가방에는 아직 아무것도 추가되지 않았습니다. 실제 채집 또는 흥정으로 조건을 충족하세요.');
      return;
    }
    const providedVal = isMakeDo ? choice.val + 1 : choice.val;
    const weight = isMakeDo ? 1/3 : 2/3;
    const id = `legacy-replacement:${state.saveRevision}:${choice.tag}:${selectedBagItems.length}`;
    const name = choice.tag === 'BONE'
      ? `${isMakeDo ? 'Make Do 대용 부목' : 'Replacement 대안 부목'} (희귀도 12)`
      : `${isMakeDo ? 'Make Do 대용 재료' : 'Replacement 대안 재료'} (${choice.tag} ${providedVal}, 희귀도 12)`;
    const tags = choice.tag === 'BONE' ? '[BONE 1] 부목' : `[${choice.tag} ${providedVal}]`;

    updateState((s: GameState) => {
      const timestamp = Date.now();
      return {
        ...s,
        bag: [
          ...s.bag,
          { id, name, weight, type: 'reagent', qty: 1, tags, preps: tags }
        ],
        journals: [
          {
            id: `replacement_reagent_${timestamp}`,
            title: `🧩 약재 대체: ${choice.label}`,
            text: `${state.activeAilment?.name || '현재 질병'} 치료를 위해 ${isMakeDo ? 'Make Do' : 'Replacement'} 규칙으로 대체 재료를 만들었습니다.\n- 제공 효능: ${tags}\n- 무게: ${formatWeight(weight)}\n- 기록: 희귀도 12 대안/대용 재료로 취급`,
            timestamp
          },
          ...s.journals
        ]
      };
    });

    persistTreatmentDraft(Array.from(new Set([...selectedBagItems, id])), selectedTools, usePurify);
    showAlert(`🧩 ${name}을(를) 가방에 추가하고 조제 재료로 선택했습니다.`);
  };

  const handleConfirmMakeDoAcquisition = (itemId: string) => {
    const acquisition = state.pendingAlternativeAcquisition;
    const item = state.bag.find(row => row.id === itemId);
    const preparation = item?.canonicalReagentId && item.preparationId
      ? REAGENT_BY_ID.get(item.canonicalReagentId)?.preparations.find(row => row.id === item.preparationId)
      : null;
    const matchingTag = preparation?.tags.find(row => row.tag === acquisition?.targetTag && row.value >= (acquisition?.requiredPotency || Infinity));
    if (!acquisition || acquisition.kind !== 'make-do' || !item || !matchingTag) {
      showAlert('저장된 Make Do 조건을 충족하는 실제 채집/흥정 부위가 아닙니다.');
      return;
    }
    updateState((s: GameState) => ({
      ...s,
      pendingAlternativeAcquisition: null,
      journals: [{
        id: `make-do-acquired:${Date.now()}`,
        title: `Make Do 획득: ${item.name}`,
        text: `${acquisition.targetTag} ${acquisition.requiredPotency} 조건을 실제 부위로 충족했습니다. ${acquisition.journalPrompt}`,
        timestamp: Date.now()
      }, ...s.journals]
    }));
    persistTreatmentDraft(Array.from(new Set([...selectedBagItems, itemId])), selectedTools, usePurify);
  };

  const handleConcoctRemedy = async () => {
    const patient = state.patients.find(row => row.id === state.activePatientId);
    const ailment = patient?.ailments.find(row => row.status === 'active' && row.id === state.activeAilment?.id)
      || patient?.ailments.find(row => row.status === 'active');
    if (!patient || !ailment) {
      showAlert('치료할 정식 환자와 활성 질환을 찾을 수 없습니다. 기존 세이브를 다시 불러와 마이그레이션해 주세요.');
      return;
    }
    if (selectedBagItems.length === 0) {
      showAlert('치료제에 사용할 준비된 영약재를 선택해 주세요.');
      return;
    }
    const canonicalTools = canonicalToolsFromState(state);
    const ingenuitiveTool = canonicalTools.find(tool => tool.acquiredBy === 'familiar-ingenuitive' && !tool.broken && !tool.consumed);
    const effectiveSelectedTools = Array.from(new Set([
      ...selectedTools,
      ...(ingenuitiveTool ? [ingenuitiveTool.instanceId] : [])
    ]));
    const selectedAlembic = canonicalTools.find(tool => effectiveSelectedTools.includes(tool.instanceId) && tool.toolId === 'glass-alembic');
    let catalyse: any[] | undefined;
    if (selectedAlembic && selectedBagItems.length >= 2 && askWindowConfirm('Glass Alembic으로 CATALYSE를 적용하시겠습니까?')) {
      const tag = (await requestControlledPrompt({
        title: 'CATALYSE 태그',
        message: '합산할 태그 이름을 입력하세요. 예: MOOD',
        defaultValue: 'MOOD',
        kicker: '치료제 조제',
        label: '태그'
      }))?.trim().toUpperCase();
      const first = state.bag.find(item => item.id === selectedBagItems[0]);
      const second = state.bag.find(item => item.id === selectedBagItems[1]);
      if (tag && first && second) catalyse = [{ tag, itemIds: [first.id, second.id] }];
    }
    const preserve = canonicalTools.some(tool =>
      effectiveSelectedTools.includes(tool.instanceId)
      && tool.toolId === 'big-iron-cauldron'
      && !tool.broken
      && !tool.consumed
    ) && askWindowConfirm('Big Iron Cauldron으로 이 치료제를 PRESERVE 처리할까요?');
    const transactionId = `treatment:${Date.now()}`;
    const journalText = await requestControlledPrompt({
      title: '치료 기록',
      message: '이번 치료제와 환자에 대한 기록을 남겨 주세요.',
      defaultValue: `${patient.name}의 치료제를 조제했다.`,
      kicker: '환자 기록',
      label: '기록',
      inputMode: 'multiline'
    }) || `${patient.name}의 치료제를 조제했다.`;
    const toolCards = Object.fromEntries(canonicalTools
      .filter(tool => effectiveSelectedTools.includes(tool.instanceId) && tool.toolId === 'fine-toothed-comb' && !tool.broken && !tool.consumed)
      .map(tool => [tool.instanceId, drawPlayingCard()]));
    const baseInput = {
      mode: 'treat' as const,
      transactionId,
      state: {
        inventory: toEngineInventory(state.bag),
        tools: canonicalTools,
        patient,
        reputation: state.reputation,
        trinkets: state.trinkets.length,
        journalEvents: [],
        appliedTransactionIds: state.appliedTransactionIds,
        ailmentTagOverrides: state.ailmentTagOverrides
      },
      ailmentInstanceId: ailment.id,
      selectedItemIds: selectedBagItems,
      selectedToolIds: effectiveSelectedTools,
      catalyse,
      preserve,
      toolCards,
      trinketRewardBonus: getActiveFamiliarMechanic(state) === 'shrewd' ? 1 : 0,
      journalText
    };
    let treatmentInput: typeof baseInput & { badIdeaOutcome?: BadIdeaOutcomeChoice; confirmedManualRequirements?: string[]; gifting?: boolean } = baseInput;
    let result = resolveTreatmentTransaction(treatmentInput);
    if (!result.value && result.manualAction?.kind === 'bad-idea-inspiration') {
      const action = result.manualAction;
      const availableKinds: Array<'upgrade' | 'lighten'> = [
        ...(action.upgradeTargets.length > 0 ? ['upgrade' as const] : []),
        ...(action.lightenTargets.length > 0 ? ['lighten' as const] : [])
      ];
      if (availableKinds.length === 0) {
        showAlert('Bad Idea의 Inspiration을 적용할 수 있는 도구가 없습니다. 사용 가능한 기본 도구 또는 무게가 있는 도구가 필요합니다.');
        return;
      }
      const kindChoice = availableKinds.length === 1
        ? '1'
        : prompt('Bad Idea의 Inspiration을 선택하세요.\n1. 기본 도구를 업그레이드한다\n2. 도구 무게를 1/3 줄인다', '1');
      if (kindChoice === null) return;
      const requestedKind = availableKinds.length === 1
        ? availableKinds[0]
        : kindChoice === '1' ? 'upgrade' : kindChoice === '2' ? 'lighten' : null;
      if (!requestedKind || !availableKinds.includes(requestedKind)) {
        showAlert('적용 가능한 Inspiration을 선택해 주세요.');
        return;
      }

      let badIdeaOutcome: BadIdeaOutcomeChoice;
      if (requestedKind === 'upgrade') {
        const toolChoice = prompt(`업그레이드할 기본 도구를 선택하세요.\n${action.upgradeTargets.map((target, index) => `${index + 1}. ${state.bag.find(item => item.id === target.toolInstanceId)?.name || target.toolId}`).join('\n')}`, '1');
        if (toolChoice === null) return;
        const target = action.upgradeTargets[(parseInt(toolChoice, 10) || 0) - 1];
        if (!target) {
          showAlert('목록에 있는 기본 도구를 선택해 주세요.');
          return;
        }
        const upgradeChoice = prompt(`적용할 개조를 선택하세요.\n${target.upgrades.map((upgrade, index) => `${index + 1}. ${upgrade.canonicalName}`).join('\n')}`, '1');
        if (upgradeChoice === null) return;
        const upgrade = target.upgrades[(parseInt(upgradeChoice, 10) || 0) - 1];
        if (!upgrade) {
          showAlert('목록에 있는 개조를 선택해 주세요.');
          return;
        }
        badIdeaOutcome = { kind: 'upgrade-basic-tool', toolInstanceId: target.toolInstanceId, upgradeId: upgrade.id };
      } else {
        const toolChoice = prompt(`무게를 줄일 도구를 선택하세요.\n${action.lightenTargets.map((target, index) => `${index + 1}. ${state.bag.find(item => item.id === target.toolInstanceId)?.name || target.toolId} (${formatWeight(target.currentWeight)})`).join('\n')}`, '1');
        if (toolChoice === null) return;
        const target = action.lightenTargets[(parseInt(toolChoice, 10) || 0) - 1];
        if (!target) {
          showAlert('목록에 있는 도구를 선택해 주세요.');
          return;
        }
        badIdeaOutcome = { kind: 'lighten-tool', toolInstanceId: target.toolInstanceId };
      }
      treatmentInput = { ...treatmentInput, badIdeaOutcome };
      result = resolveTreatmentTransaction(treatmentInput);
    }
    if (!result.value && result.status === 'manual') {
      const confirmed = result.messages.filter(message => askWindowConfirm(`${localizeGameplayMessage(message)}\n\n이 수동 요구조건을 충족했습니까?`));
      if (confirmed.length !== result.messages.length) return;
      treatmentInput = { ...treatmentInput, confirmedManualRequirements: confirmed };
      result = resolveTreatmentTransaction(treatmentInput);
    }
    if (!result.value) {
      showAlert(result.messages.join('\n'));
      return;
    }
    if (result.value.trinketReward > 0 && askWindowConfirm(`치료 보상 장신구 ${result.value.trinketReward}개를 모두 선물하고 길드 명성 +2를 받으시겠습니까?`)) {
      treatmentInput = { ...treatmentInput, gifting: true };
      result = resolveTreatmentTransaction(treatmentInput);
      if (!result.value) {
        showAlert(result.messages.join('\n'));
        return;
      }
    }
    const outcome = result.value;
    const nextPatient = outcome.nextState.patient;
    const treatmentManualDraft = ailment.ailmentId
      ? createPrintedManualDraft(ailment.ailmentId, 'treatment-success', {
        encounterTransactionId: transactionId,
        patientId: nextPatient.id,
        ailmentInstanceId: ailment.id,
        locationId: findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName),
        continuation: 'ailment-close'
      })
      : null;
    const nextAilmentState = nextPatient.ailments.find(row => row.status === 'active');
    const nextDefinition = nextAilmentState ? AILMENTS.find(row => row.id === nextAilmentState.ailmentId) : null;
    const remainingTime = nextPatient.timers.length > 0
      ? Math.min(...nextPatient.timers.map(timer => timer.current))
      : 0;
    updateState(s => {
      const nextToolStates = outcome.nextState.tools || canonicalTools;
      const nextToolById = new Map(nextToolStates.map(tool => [tool.instanceId, tool]));
      const nextBag = fromEngineInventory(outcome.nextState.inventory, s.bag).map(item => {
        const tool = nextToolById.get(item.id);
        if (!tool) return item;
        const upgrade = tool.upgradeId ? TOOL_UPGRADE_BY_ID.get(tool.upgradeId) : null;
        return { ...item, name: upgrade?.canonicalName || item.name, weight: toolWeight(tool), canonicalToolId: tool.toolId };
      });
      const nextBase: GameState = {
        ...s,
        bag: nextBag,
        toolStates: nextToolStates,
        patients: s.patients.map(row => row.id === nextPatient.id ? nextPatient : row),
        activePatientId: nextPatient.id,
        reputation: outcome.nextState.reputation,
        trinkets: Array.from({ length: outcome.nextState.trinkets }, (_, index) => s.trinkets[index] || '치료 보상 장신구'),
        appliedTransactionIds: outcome.nextState.appliedTransactionIds,
        treatmentDraft: null,
        needsLocalHelpBeforeMove: !outcome.allAilmentsResolved,
        curedAilmentInThisWilds: outcome.allAilmentsResolved && s.currentLocationType === 'Wilds',
        scroungingMode: outcome.allAilmentsResolved && remainingTime > 0,
        scroungingTimer: outcome.allAilmentsResolved ? remainingTime : 0,
        journals: [{
          id: `${transactionId}:journal`, title: `치료: ${nextDefinition?.displayName || state.activeAilment?.name}`,
          text: `${journalText}\nFAIR ${outcome.fair}, FOUL ${outcome.foul}${outcome.remedyFlags.includes('PRESERVED') ? ', PRESERVED' : ''}; 명성 ${outcome.reputationChange >= 0 ? '+' : ''}${outcome.reputationChange}, 장신구 +${outcome.trinketReward}${outcome.badIdeaOutcomeApplied ? '\nBad Idea Inspiration을 도구에 적용했다.' : ''}`,
          timestamp: Date.now()
        }, ...s.journals]
      };
      const archive = createPatientArchiveRecord({
        caseId: nextPatient.id,
        patient: nextPatient,
        location: s.currentLocationName,
        encounteredAt: state.journey?.startDate || Date.now(),
        treatedAt: Date.now(),
        remedyParts: selectedBagItems,
        treatmentResult: outcome.allAilmentsResolved ? 'success' : 'pending',
        reward: { trinkets: outcome.trinketReward, reputation: outcome.reputationChange },
        journalEntryIds: [`${transactionId}:journal`],
        sourceJourneyId: s.journey?.journeyId || null,
        transactionIds: [transactionId]
      });
      let withArchive = enqueueManualDrafts({
        ...nextBase,
        patientArchive: upsertPatientArchive(s.patientArchive, archive),
        journey: recordCanonicalJourneyEvent(nextBase, {
          id: `${transactionId}:journey-treatment`, type: 'treatment',
          ailmentId: ailment.ailmentId || undefined,
          locationId: findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName),
          region: toRuleRegion(s.currentRegion)
        })
      }, [treatmentManualDraft]);
      if (outcome.allAilmentsResolved
        && s.currentLocationType === 'Settlement'
        && canonicalWagonFromState(withArchive).expansionIds.includes('passenger-booth')
        && !withArchive.activePassenger
        && !treatmentInput.gifting) {
        const passengerReady = resolvePassengerPickupAvailability({
          transactionId: `${transactionId}:passenger-ready`,
          state: toMobilityRuntime(withArchive),
          currentLocationType: s.currentLocationType,
          remedyTraded: true
        });
        if (passengerReady.value) withArchive = applyMobilityRuntime(withArchive, passengerReady.value);
      }
      if (!outcome.allAilmentsResolved || remainingTime > 0) return withArchive;
      const leave = resolveLeave({
        transactionId: `leave-after:${transactionId}`,
        state: toLeaveRuntime(withArchive, nextPatient),
        status: 'treated'
      });
      return leave.value ? applyLeaveRuntime(withArchive, leave.value) : withArchive;
    });
    setSelectedBagItems([]);
    setSelectedTools([]);
    setUsePurify(false);
    showAlert(`치료가 완료되었습니다. 명성 ${outcome.reputationChange >= 0 ? '+' : ''}${outcome.reputationChange}, 장신구 +${outcome.trinketReward}.${outcome.badIdeaOutcomeApplied ? '\nInspiration 도구 보상도 함께 저장했습니다.' : ''}${treatmentManualDraft ? '\n이어지는 인쇄 효과는 전용 직접 판정에 열었습니다.' : ''}`);
  };


  const handleEndJourney = async () => {
    if (!state.journeyActive || !state.journey) return;
    const evaluation = evaluateJourneyGoal(state.journey, {
      inventory: toEngineInventory(state.bag),
      reputation: state.reputation,
      patients: state.patients
    });
    const choice = await requestControlledPrompt({
      title: '여정 결말을 선택하세요',
      message: evaluation.complete ? '현재 목표 조건을 충족했습니다.' : '현재 목표 조건이 완전히 충족되지 않았습니다.',
      defaultValue: evaluation.complete ? '1' : '2',
      kicker: '여정 마감',
      options: [
        { value: '1', label: '1. 성공' },
        { value: '2', label: '2. 부분 성공' },
        { value: '3', label: '3. 실패' },
        { value: '4', label: '4. 포기' }
      ]
    });
    if (!choice) return;
    const outcomes = ['success', 'partial', 'failure', 'abandoned'] as const;
    const outcome = outcomes[Math.max(0, Math.min(3, (parseInt(choice) || 1) - 1))];
    const blanket = state.bag.find(item => item.craftedItemId === 'knitted-blanket' || item.name.includes('Knitted Blanket'));
    if ((outcome === 'failure' || outcome === 'abandoned') && blanket
      && askWindowConfirm('Knitted Blanket을 버려 이 여정의 조기 종료를 막을까요?')) {
      const transaction = createClientTransaction('tool:knitted-blanket');
      const saved = resolveKnittedBlanket({
        transactionId: transaction.id,
        state: {
          trinkets: state.trinkets.length,
          inventory: toEngineInventory(state.bag).map(item => item.id === blanket.id ? { ...item, craftedItemId: 'knitted-blanket' } : item),
          tools: canonicalToolsFromState(state),
          appliedTransactionIds: state.appliedTransactionIds,
          journalEvents: []
        },
        itemId: blanket.id
      });
      if (!saved.value) return showAlert(saved.messages.join('\n'));
      updateState(s => ({
        ...s,
        bag: fromEngineInventory(saved.value!.inventory, s.bag),
        appliedTransactionIds: saved.value!.appliedTransactionIds,
        journals: appendEngineJournals(s.journals, saved.value!.journalEvents)
      }));
      showAlert('담요가 여정을 지켜냈습니다. 여정은 계속됩니다.');
      return;
    }
    const defaultMemoir = `${state.journeyOrigin || '출발지'}에서 ${state.journeyDestination}까지 ${state.calendarDays}일 동안 여행했다. 목표 ${state.journeyGoalTitle}의 결말과 이 길이 남긴 변화를 기록한다.`;
    const memoir = await requestControlledPrompt({
      title: '여정의 결말',
      message: '이 길이 남긴 변화와 결말을 기록하세요.',
      defaultValue: defaultMemoir,
      kicker: '여정 마감',
      label: '회고',
      inputMode: 'multiline'
    });
    if (!memoir?.trim()) return;
    const manualConfirmed = evaluation.manualConfirmationRequired
      ? askWindowConfirm('이 목표의 서사적 조건을 직접 확인했습니까?')
      : false;
    const transactionId = `${state.journey.journeyId}:ending`;
    const result = resolveJourneyEnding({
      transactionId,
      state: toJourneyRuntime(state),
      endedAt: Date.now(),
      outcome,
      journalText: memoir,
      playerDeclaredGoalComplete: manualConfirmed,
      journeyStakesEnabled: isHouseRuleEnabled(state.rulesetId, 'journeyReputationSwing')
    });
    if (!result.value || result.status === 'invalid') {
      showAlert(result.messages.join('\n'));
      return;
    }
    const newChronicle = {
      id: `${transactionId}:chronicle`,
      title: `${state.journeyGoalTitle} · ${state.journeyDestination}`,
      text: memoir.trim(),
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    updateState((s: GameState) => {
      const journeyState = applyJourneyRuntime(s, result.value!);
      const serviceEnd = resolveGuildServiceJourneyEnd({
        transactionId: `${transactionId}:services`,
        state: toServiceRuntime(journeyState)
      });
      const next = serviceEnd.value ? applyServiceRuntime(journeyState, serviceEnd.value) : journeyState;
      return {
      ...next,
      journeyActive: false,
      downtimeCompleted: false,
      journeyOrigin: '',
      needsLocalHelpBeforeMove: false,
      pursuedByBehemoth: null,
      calendarDays: 0,
      journeyChronicles: [newChronicle, ...(s.journeyChronicles || [])]
      };
    });
    showAlert(`여정이 ${outcome === 'success' ? '성공' : outcome === 'partial' ? '부분 성공' : outcome === 'failure' ? '실패' : '포기'}으로 기록되었습니다.${state.rulesetId === 'original-1e-3p' ? ' 원작 규칙에는 고정 명성 증감이 없습니다.' : ''}`);
  };

  // ---------------------------------------------------------------
  // BARROW DELVE HANDLERS
  // ---------------------------------------------------------------
  const resetBarrowInputs = () => {
    setBarrowJournalNote('');
    setBarrowSelectedItemIds([]);
    setBarrowMoveTargetId('');
    setBarrowEscapeItemIds([]);
    setBarrowSelectedToolId('');
  };

  const commitCanonicalBarrow = (resolve: (runtime: BarrowRuntimeState) => BarrowResolution, successMessage?: string) => {
    if (barrowActionPendingRef.current) return;
    barrowActionPendingRef.current = true;
    let errorMessage = '';
    let completed = false;
    updateState(s => {
      const result = resolve(toBarrowRuntime(s));
      if (!result.value) {
        errorMessage = result.messages.join('\n');
        return s;
      }
      completed = !result.value.activeDelve;
      return applyBarrowRuntime(s, result.value);
    });
    queueMicrotask(() => {
      barrowActionPendingRef.current = false;
      if (errorMessage) showAlert(errorMessage);
      else if (successMessage) showAlert(successMessage);
      if (completed) resetBarrowInputs();
    });
  };

  const selectedBarrowParts = (runtime: BarrowRuntimeState, transactionId: string) => barrowSelectedItemIds.flatMap(itemId => {
    const item = runtime.inventory.find(row => row.id === itemId);
    return item?.canonicalReagentId && item.preparationId
      ? [{ itemId, reagentId: item.canonicalReagentId, preparationId: item.preparationId, sourceTransactionId: transactionId }]
      : [];
  });

  const handleStartDelve = () => {
    if (!barrowJournalNote.trim()) {
      showAlert('고분의 모습과 거수에 대한 첫 기록을 적어주세요.');
      return;
    }
    const suit = drawPlayingCard().suit as CardSuit;
    const transactionId = createClientTransaction('barrow:start').id;
    commitCanonicalBarrow(runtime => {
      const barrow = runtime.barrows.find(row => row.locationId === runtime.currentLocationId && !row.removed);
      return barrow
        ? startBarrowDelve({ transactionId, state: runtime, barrowId: barrow.id, suit, journalNote: barrowJournalNote })
        : { status: 'invalid', value: null, messages: ['현재 위치에 활성 고분이 없습니다.'] };
    }, '고분의 도전 카드를 펼쳤습니다. 도전을 시작하거나 지금 안전하게 물러날 수 있습니다.');
  };

  const handleBeginDelve = () => {
    const transactionId = createClientTransaction('barrow:begin').id;
    commitCanonicalBarrow(runtime => beginBarrowChallenge(transactionId, runtime));
  };

  const handleFleeToSafety = () => {
    if (!barrowJournalNote.trim()) {
      showAlert('도망친 장면을 저널에 기록해 주세요.');
      return;
    }
    const transactionId = createClientTransaction('barrow:flee').id;
    commitCanonicalBarrow(runtime => fleeBarrowDelve(transactionId, runtime, barrowJournalNote), '하루를 기다렸습니다. 다음 이동의 속도는 1입니다.');
  };

  const handleAbortDelve = () => {
    showAlert(isHouseRuleEnabled(state.rulesetId, 'freeDelveCancellation')
      ? '이전 캠페인의 자유 취소 규칙은 호환 정보로만 남습니다. 현재 탐사는 룰북의 Flee 또는 결과 절차로 마쳐야 합니다.'
      : '도전을 시작한 뒤에는 비용 없이 취소할 수 없습니다. 해당 Delve의 결과 절차를 완료하세요.');
  };

  const handleDelveDrawCard = () => {
    const card = drawPlayingCard();
    const transactionId = createClientTransaction('barrow:collapsed').id;
    commitCanonicalBarrow(runtime => drawCollapsedEntranceCard(transactionId, runtime, { ...card, suit: card.suit as CardSuit }));
  };

  const handleCollapsedFarewell = () => {
    const transactionId = createClientTransaction('barrow:farewell').id;
    commitCanonicalBarrow(runtime => bidFarewellCollapsedEntrance(transactionId, runtime, barrowJournalNote));
  };

  const handleBarrowForage = () => {
    if (state.pendingForaging || activeForageEncounter) {
      showAlert('진행 중인 채집 판정을 먼저 마쳐주세요.');
      return;
    }
    const card = drawPlayingCard();
    executeForageDraw(card.suit, card.value, undefined, 'barrow-delve');
  };

  const handleSubmitBarrowRemedy = () => {
    if (!barrowJournalNote.trim()) {
      showAlert('결과를 저널에 기록해 주세요.');
      return;
    }
    const transactionId = createClientTransaction('barrow:remedy').id;
    commitCanonicalBarrow(runtime => submitBarrowRemedy({
      transactionId,
      state: runtime,
      selections: selectedBarrowParts(runtime, transactionId),
      moveTargetId: barrowMoveTargetId || undefined,
      journalNote: barrowJournalNote
    }));
  };

  const handleWarnOthers = () => {
    const transactionId = createClientTransaction('barrow:warn').id;
    commitCanonicalBarrow(runtime => warnOthersInsideJob(transactionId, runtime, barrowJournalNote));
  };

  const handleBlackjackHit = () => {
    const card = drawPlayingCard();
    const transactionId = createClientTransaction('barrow:pilfer-draw').id;
    commitCanonicalBarrow(runtime => drawPilferCard(transactionId, runtime, { ...card, suit: card.suit as CardSuit }, barrowEscapeItemIds));
  };

  const handleBlackjackStand = () => {
    const transactionId = createClientTransaction('barrow:pilfer-stand').id;
    commitCanonicalBarrow(runtime => standPilfer({ transactionId, state: runtime, selectedToolId: barrowSelectedToolId || undefined, journalNote: barrowJournalNote }));
  };

  const handleDiagnoseBuildingTrust = () => {
    if (state.activePatientId) {
      showAlert('현재 환자 기록을 먼저 마쳐야 고분 주민을 진단할 수 있습니다.');
      return;
    }
    const card = drawPlayingCard();
    const rows = AILMENTS.filter(row => row.severity === 'intermediate');
    const ailment = rows[getRuleCardValue(card, 'table') - 1];
    if (!ailment) return;
    const transactionId = createClientTransaction('barrow:trust-diagnosis').id;
    commitCanonicalBarrow(runtime => diagnoseBuildingTrust(transactionId, runtime, ailment.id));
  };

  const handleBuildingTrustOutcome = (success: boolean) => {
    const transactionId = createClientTransaction(`barrow:trust-${success ? 'success' : 'failure'}`).id;
    commitCanonicalBarrow(runtime => resolveBuildingTrust({ transactionId, state: runtime, success, journalNote: barrowJournalNote }));
  };

  const handleSuitableFurnishingsDrawTargets = () => {
    const cards = Array.from({ length: 5 }, () => {
      const card = drawPlayingCard();
      return { ...card, suit: card.suit as CardSuit };
    });
    const transactionId = createClientTransaction('barrow:furnishings-draw').id;
    commitCanonicalBarrow(runtime => drawSuitableFurnishings(transactionId, runtime, cards));
  };

  const handleSuitableFurnishingsComplete = () => {
    const transactionId = createClientTransaction('barrow:furnishings-complete').id;
    commitCanonicalBarrow(runtime => resolveSuitableFurnishings({ transactionId, state: runtime, selections: selectedBarrowParts(runtime, transactionId), journalNote: barrowJournalNote }));
  };

  const handlePotentPoisonComplete = () => {
    const card = drawPlayingCard();
    const transactionId = createClientTransaction('barrow:poison-complete').id;
    commitCanonicalBarrow(runtime => resolvePotentPoison({ transactionId, state: runtime, selections: selectedBarrowParts(runtime, transactionId), card: { ...card, suit: card.suit as CardSuit }, journalNote: barrowJournalNote }));
  };

  const actionHubItems: ActionHubItem[] = [];
  const currentBarrow = (state.barrows || []).find(b => !b.removed && b.locationName === state.currentLocationName);
  const patientReagentCount = state.bag.filter(item => item.type === 'reagent').length;
  const maxCarry = getMaxCarry(state);
  const activeTravelSpeed = state.journeyActive ? getTravelSpeed(state, currentWeight) : state.bio.speed;
  const barterLocations = state.activeAilment ? getAvailableBarterLocations(state) : [];
  const barterLimit = barterLocations.reduce((max, option) => Math.max(max, getBarterAttemptLimit(option.type)), 0);
  const barterRemaining = barterLocations.reduce((max, option) => Math.max(max,
    state.activePatientId ? getBarterAttemptsRemaining(state.barterAttemptHistory, state.activePatientId, option.key, option.type) : 0
  ), 0);
  const journeyGoalDone = state.journeyActive ? checkJourneyGoalSatisfaction(state) : false;
  const hubLocation = `${localizeRegionLabel(state.currentRegion)} · ${locationTypeLabel(state.currentLocationType)} · ${state.currentLocationName}`;
  const playMapMode: 'destination' | 'travel' | 'inspect' = !state.journeyActive && downtimeTab === 'start'
    ? 'destination'
    : state.journeyActive
      ? 'travel'
      : 'inspect';
  const playMapHighlightIds = useMemo(() => {
    if (playMapMode === 'destination') return journeyDestinationCandidates.map(row => row.id);
    const routeIds = routeDraft.stops.map(stop => stop.id);
    if (routeIds.length > 0) return routeIds;
    if (playMapMode === 'travel') {
      return listLegalMoveStops({
        graph: toTravelEngineGraph(state),
        originId: journeyOriginId,
        speed: activeTravelSpeed,
        canStopInLoch: hasLochStoppingGear(state),
        waterwaySpan: resolveWagonCapabilities(canonicalWagonFromState(state)).waterwaySpan,
        mustUseFullSpeed: true
      });
    }
    return [];
  }, [playMapMode, journeyDestinationCandidates, state, journeyOriginId, activeTravelSpeed, routeDraft.stops]);
  const playMapSelectedId = playMapMode === 'destination'
    ? destName || null
    : playMapMode === 'travel'
      ? findMapLocationKey(nextLocName, state.customMapLocations || []) || null
      : null;
  const applyMapTravelLocation = useCallback((location: MapPickLocation, submit: boolean) => {
    setNextLocName(location.name);
    if (location.region && ['Forest', 'Meadow', 'Loch', 'Bog', 'Mountain', 'Titan'].includes(location.region)) {
      setDestRegion(location.region);
    }
    setDestType(destTypeFromMapPick(location.kind));
    if (submit) queueMicrotask(() => travelFormRef.current?.requestSubmit());
  }, []);

  const handlePlayMapPick = useCallback((location: MapPickLocation) => {
    if (playMapMode === 'destination' && journeyDestinationCandidates.some(row => row.id === location.id)) {
      setDestName(location.id);
    }
  }, [playMapMode, journeyDestinationCandidates]);

  const handlePlayMapTravel = useCallback((location: MapPickLocation) => {
    applyMapTravelLocation(location, true);
  }, [applyMapTravelLocation]);

  const persistRouteStop = useCallback((stop: RouteStop) => {
    upsertPlayerMarkerRecords([playerRecordFromStop(stop)]);
    updateState((s: GameState) => {
      const nodes = buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || []);
      const nextLocations = upsertPlayerMapStop(s.customMapLocations || [], stop, nodes[stop.id]);
      const currentId = findMapLocationKey(s.currentLocationName, nextLocations) || normalizeMapLocationName(s.currentLocationName);
      const touchesCurrent = currentId === stop.id;
      return {
        ...s,
        customMapLocations: nextLocations,
        ...(touchesCurrent ? {
          currentLocationName: stop.name.trim() || s.currentLocationName,
          currentLocationType: locationTypeFromGlyph(stop.kind),
          currentRegion: stop.terrain || s.currentRegion
        } : {})
      };
    });
  }, [updateState]);

  const persistRouteEdge = useCallback((from: string, to: string, kind: 'path' | 'river' | 'waterway') => {
    updateState((s: GameState) => ({
      ...s,
      customMapEdges: upsertPlayerMapEdge(s.customMapEdges || [], from, to, kind)
    }));
  }, [updateState]);

  const handleAddRouteWaypoint = useCallback((location: MapPickLocation) => {
    const node = routeGraphNodes[location.id];
    const clinicHere = (state.clinics || []).some(clinic =>
      findMapLocationKey(clinic.locationName, state.customMapLocations || []) === location.id
    );
    const stop = node
      ? stopFromGraphNode(location.id, node, { hasClinic: clinicHere || location.hasClinic, name: location.name || node.label })
      : stopFromPlace({
        id: location.id,
        name: location.name,
        x: location.x ?? 50,
        y: location.y ?? 50,
        region: location.region,
        kind: location.kind,
        locationType: location.kind,
        hasClinic: location.hasClinic
      });
    setRouteDraft(previous => {
      const last = previous.stops[previous.stops.length - 1];
      const existingIndex = previous.stops.findIndex(row => row.id === stop.id);
      if (existingIndex > 0) {
        const next = removeRouteStopAt(previous, existingIndex);
        const destination = next.stops[next.stops.length - 1];
        if (next.stops.length > 1 && destination) {
          setNextLocName(destination.name);
          setDestType(locationTypeFromGlyph(destination.kind));
          setDestRegion(destination.kind === 'Ruin' ? 'Titan' : (destination.terrain || state.currentRegion));
          if (isLochWildsStop(destination) && !hasLochStoppingGear(state)) {
            showAlert('호수·강 야생에서 멈추려면 자작나무 보트(Bark Coracle)나 밀폐식 마차(Sealed Carriage)가 필요합니다. 지나갈 수는 있으니 다음 자리를 잇거나 도구를 챙기세요.');
          }
        } else {
          setNextLocName('');
          setDestType('');
          setDestRegion('');
        }
        return next;
      }
      if (existingIndex === 0) {
        return previous;
      }
      const inferredKind = last
        ? mapEdgeKind(last.id, stop.id, routeGraphNodes, state.customMapEdges || [])
        : 'path';
      const edgeKind = last && canChooseRouteEdgeKind(inferredKind, last, stop) ? inferredKind : 'path';
      const next = appendRouteStop(previous, stop, edgeKind);
      if (next.stops.length > 1) {
        const dest = next.stops[next.stops.length - 1];
        setNextLocName(dest.name);
        setDestType(locationTypeFromGlyph(dest.kind));
        setDestRegion(dest.kind === 'Ruin' ? 'Titan' : (dest.terrain || state.currentRegion));
        if (isLochWildsStop(dest) && !hasLochStoppingGear(state)) {
          showAlert('호수·강 야생에서 멈추려면 자작나무 보트(Bark Coracle)나 밀폐식 마차(Sealed Carriage)가 필요합니다. 지나갈 수는 있으니 다음 자리를 잇거나 도구를 챙기세요.');
        }
      }
      return next;
    });
  }, [routeGraphNodes, state.clinics, state.customMapLocations, state.currentRegion, state.customMapEdges, state.bag, state.wagonExpansions]);

  const handleCreateMapPlace = useCallback((request: { x: number; y: number; kind?: string; terrain?: string; name?: string }) => {
    const stop: RouteStop = {
      id: `mark_${Date.now()}`,
      name: request.name?.trim() || '',
      kind: request.kind === 'City' || request.kind === 'Settlement' || request.kind === 'Ruin' || request.kind === 'Barrow' || request.kind === 'Clinic'
        ? request.kind
        : 'Wilds',
      terrain: terrainFromRegion(request.terrain) || nearestTerrain(request.x, request.y, Object.values(routeGraphNodes).map(node => ({
        x: node.x,
        y: node.y,
        region: node.region
      }))) || terrainFromRegion(state.currentRegion) || 'Forest',
      hasClinic: request.kind === 'Clinic',
      x: Math.max(1, Math.min(99, request.x)),
      y: Math.max(1, Math.min(99, request.y))
    };
    persistRouteStop(stop);
    handleAddRouteWaypoint({
      id: stop.id,
      name: stop.name,
      region: stop.terrain || undefined,
      kind: stop.kind,
      x: stop.x,
      y: stop.y,
      hasClinic: stop.hasClinic
    });
  }, [handleAddRouteWaypoint, persistRouteStop, routeGraphNodes, state.currentRegion]);

  const handleSetMappedCurrentLocation = useCallback((location: MapPickLocation) => {
    const node = routeGraphNodes[location.id];
    const stop = node
      ? stopFromGraphNode(location.id, node, { name: location.name || node.label, hasClinic: location.hasClinic })
      : stopFromPlace({
        id: location.id,
        name: location.name,
        x: location.x ?? 50,
        y: location.y ?? 50,
        region: location.region,
        kind: location.kind,
        locationType: location.kind,
        hasClinic: location.hasClinic
      });
    persistRouteStop(stop);
    updateState((s: GameState) => ({
      ...s,
      currentLocationName: stop.name,
      currentLocationType: locationTypeFromGlyph(stop.kind),
      currentRegion: stop.terrain || s.currentRegion,
      visitedLocations: Array.from(new Set([...(s.visitedLocations || []), stop.name]))
    }));
    setRouteDraft(draftFromOrigin(stop));
  }, [persistRouteStop, routeGraphNodes, updateState]);

  const handleRouteStopChange = useCallback((index: number, patch: Partial<RouteStop>) => {
    setRouteDraft(previous => {
      const next = updateRouteStopAt(previous, index, patch);
      const stop = next.stops[index];
      if (stop) persistRouteStop(stop);
      if (index === next.stops.length - 1 && next.stops.length > 1) {
        setNextLocName(stop.name);
        setDestType(locationTypeFromGlyph(stop.kind));
        setDestRegion(stop.terrain || (stop.kind === 'Ruin' ? 'Titan' : state.currentRegion));
      }
      return next;
    });
  }, [persistRouteStop, state.currentRegion]);

  const handleRouteEdgeChange = useCallback((index: number, kind: 'path' | 'river' | 'waterway') => {
    setRouteDraft(previous => {
      const next = setRouteEdgeKind(previous, index, kind);
      const from = next.stops[index];
      const to = next.stops[index + 1];
      if (from && to) persistRouteEdge(from.id, to.id, kind);
      return next;
    });
  }, [persistRouteEdge]);

  const handleRemoveRouteStop = useCallback((index: number) => {
    setRouteDraft(previous => {
      const next = removeRouteStopAt(previous, index);
      const dest = next.stops[next.stops.length - 1];
      if (next.stops.length > 1 && dest) {
        setNextLocName(dest.name);
        setDestType(locationTypeFromGlyph(dest.kind));
        setDestRegion(dest.terrain || state.currentRegion);
      }
      return next;
    });
  }, [state.currentRegion]);

  const handleClearRouteSides = useCallback(() => {
    setRouteDraft(previous => draftFromOrigin(previous.stops[0] || currentRouteOrigin));
  }, [currentRouteOrigin]);

  const handleMoveMapPlace = useCallback((location: MapPickLocation) => {
    if (location.x === undefined || location.y === undefined) return;
    const x = Math.max(1, Math.min(99, location.x));
    const y = Math.max(1, Math.min(99, location.y));
    setRouteDraft(previous => ({
      ...previous,
      stops: previous.stops.map(stop => stop.id === location.id ? { ...stop, x, y } : stop)
    }));
    const node = routeGraphNodes[location.id];
    persistRouteStop({
      id: location.id,
      name: location.name || node?.label || location.id,
      kind: node ? stopFromGraphNode(location.id, node).kind : (location.kind === 'City' ? 'City' : location.kind === 'Settlement' ? 'Settlement' : location.kind === 'Ruin' ? 'Ruin' : location.kind === 'Barrow' ? 'Barrow' : 'Wilds'),
      terrain: terrainFromRegion(location.region || node?.region),
      hasClinic: Boolean(location.hasClinic),
      x,
      y
    });
  }, [persistRouteStop, routeGraphNodes]);

  const handleSaveMapPlaces = useCallback(() => {
    const draft = routeDraftRef.current;
    if (draft.stops.length === 0 && (state.customMapLocations || []).length === 0) {
      showAlert('저장할 표시가 없습니다. 지도에서 자리를 고르거나 ⌘+클릭으로 남기세요.');
      return;
    }
    upsertPlayerMarkerRecords(draft.stops.map(playerRecordFromStop));
    draft.stops.forEach(persistRouteStop);
    showAlert('표시를 이 기록에 남겼습니다. 형태와 자리를 고친 값도 다음에 그대로 보입니다.');
  }, [persistRouteStop, state.customMapLocations]);

  const handleEditMapPlace = useCallback((location: MapPickLocation) => {
    const node = routeGraphNodes[location.id];
    const stop: RouteStop = {
      id: location.id,
      name: location.name ?? node?.label ?? '',
      kind: location.kind === 'City' || location.kind === 'Settlement' || location.kind === 'Ruin' || location.kind === 'Barrow' || location.kind === 'Clinic'
        ? location.kind
        : (node ? stopFromGraphNode(location.id, node).kind : 'Wilds'),
      terrain: terrainFromRegion(location.region) || (node ? stopFromGraphNode(location.id, node).terrain : null),
      hasClinic: Boolean(location.hasClinic) || location.kind === 'Clinic',
      x: location.x ?? node?.x ?? 50,
      y: location.y ?? node?.y ?? 50
    };
    persistRouteStop(stop);
    setRouteDraft(previous => ({
      ...previous,
      stops: previous.stops.map(row => row.id === stop.id ? { ...row, ...stop } : row)
    }));
  }, [persistRouteStop, routeGraphNodes]);

  const handleDeleteMapPlace = useCallback((location: MapPickLocation) => {
    if (!isPlayerCreatedMapPlace(location.id)) {
      setRouteDraft(previous => {
        const index = previous.stops.findIndex(stop => stop.id === location.id);
        return index > 0 ? removeRouteStopAt(previous, index) : previous;
      });
      return;
    }
    if (findMapLocationKey(state.currentLocationName, state.customMapLocations || []) === location.id) {
      showAlert('지금 있는 자리의 표시는 지울 수 없습니다.');
      return;
    }
    removePlayerMarkerRecords([location.id]);
    setRouteDraft(previous => {
      const index = previous.stops.findIndex(stop => stop.id === location.id);
      if (index <= 0) return { ...previous, stops: previous.stops.filter(stop => stop.id !== location.id) };
      return removeRouteStopAt(previous, index);
    });
    updateState((s: GameState) => ({
      ...s,
      customMapLocations: (s.customMapLocations || []).filter(row => row.id !== location.id),
      customMapEdges: (s.customMapEdges || []).filter(edge => edge.from !== location.id && edge.to !== location.id)
    }));
  }, [state.currentLocationName, state.customMapLocations, updateState]);

  const handleComposerTravel = useCallback(() => {
    const draft = routeDraftRef.current;
    const destination = draft.stops[draft.stops.length - 1];
    if (draft.stops.length < 2 || !destination) return;
    applyMapTravelLocation({
      id: destination.id,
      name: destination.name,
      region: destination.terrain || undefined,
      kind: locationTypeFromGlyph(destination.kind)
    }, true);
  }, [applyMapTravelLocation]);

  const addActionHubItem = (item: ActionHubItem) => {
    if (!actionHubItems.some(existing => existing.id === item.id) && actionHubItems.length < 4) {
      actionHubItems.push(item);
    }
  };

  if (state.pendingEncounter) {
    const pendingEffect = PRINTED_EFFECT_BY_OWNER.get(state.pendingEncounter.encounterId);
    addActionHubItem({
      id: 'pending-encounter',
      label: '미해결 이동 조우',
      detail: pendingEffect
        ? `${pendingEffect.ownerName} 판정이 기다리고 있습니다.`
        : '이동 조우 판정이 기다리고 있습니다.',
      meta: `p.${state.pendingEncounter.encounter.sourcePage}`,
      targetId: 'travel-panel',
      tone: 'warning',
      activate: () => setActiveTravelEncounter(null)
    });
  } else if (state.pendingForaging) {
    addActionHubItem({
      id: 'pending-foraging',
      label: '미해결 채집 절차',
      detail: state.pendingForaging.phase === 'choose-reagent' ? '영약재 하나와 부위를 선택합니다.' : '채집 조우와 타이머를 해결합니다.',
        meta: `${localizeRegionLabel(state.pendingForaging.region)} · ${state.pendingForaging.timerCostAfterEncounter}시간`,
      targetId: 'patient-clinic-panel',
      tone: 'warning',
      activate: () => setActiveForageEncounter(null)
    });
  }

  if (!state.journeyActive) {
    addActionHubItem({
      id: 'start-journey',
      label: '새 여정 출발',
      detail: '목적지와 여정 목표 카드를 뽑아 다음 여행을 시작합니다.',
      meta: `현재 위치: ${state.currentLocationName}`,
      targetId: 'journey-start-panel',
      tone: 'primary',
      activate: () => setDowntimeTab('start')
    });
    addActionHubItem({
      id: 'downtime-activities',
      label: '휴식기 활동',
      detail: '본부 업무, 유산 클리닉, 기부와 회복을 정리합니다.',
      targetId: 'downtime-panel',
      tone: 'neutral',
      activate: () => setDowntimeTab('activities')
    });
    addActionHubItem({
      id: 'downtime-shop',
      label: '마차와 동료 정비',
      detail: '도구, 마차 개조, 동반자 영입을 확인합니다.',
      targetId: 'downtime-panel',
      tone: 'neutral',
      activate: () => setDowntimeTab(state.companionStates?.length ? 'companions' : 'shop')
    });
  } else {
    if (state.pendingPatientArchive) {
      addActionHubItem({
        id: 'archive-patient',
        label: '진료 기록 마감',
        detail: `${state.pendingPatientArchive.patientName || '이름 모를 야수'}의 ${state.pendingPatientArchive.ailmentName} 기록을 닫습니다.`,
        meta: state.pendingPatientArchive.outcome === 'success' ? '회복 기록' : '실패 기록',
        targetId: 'pending-archive-panel',
        tone: state.pendingPatientArchive.outcome === 'success' ? 'done' : 'warning'
      });
    }

    if (state.pursuedByBehemoth) {
      addActionHubItem({
        id: 'behemoth-chase',
        label: '거수 추격 대응',
        detail: `선행 거리 ${state.pursuedByBehemoth.headStart}경로. 이동 계획이나 탈출 도구를 확인합니다.`,
        targetId: 'travel-panel',
        tone: 'warning'
      });
    }

    if (state.activeDelve) {
      addActionHubItem({
        id: 'active-delve',
        label: '고분 도전 해결',
        detail: `${BARROW_DELVE_BY_ID.get(state.activeDelve.delveId)?.name || '고분'} 도전을 이어갑니다.`,
        meta: `타이머 ${state.activeDelve.timer} · 진행 ${state.activeDelve.progress}`,
        targetId: 'barrow-panel',
        tone: 'primary'
      });
    } else if (currentBarrow && !state.pursuedByBehemoth) {
      addActionHubItem({
        id: 'barrow-here',
        label: '거수 고분 처리',
        detail: `${currentBarrow.name} 고분을 탐험하거나 피해 도망칩니다.`,
        meta: localizeBehemothClass(currentBarrow.behemothClass),
        targetId: 'barrow-panel',
        tone: 'primary'
      });
    }

    if (state.scroungingMode) {
      addActionHubItem({
        id: 'scrounging',
        label: '여분 채집 사용',
        detail: `치료 후 남은 ${state.scroungingTimer || 0}시간으로 추가 약재를 확보합니다.`,
        meta: `가방 약재 ${patientReagentCount}개`,
        targetId: 'patient-clinic-panel',
        tone: 'primary'
      });
    } else if (state.activeAilment) {
      addActionHubItem({
        id: 'active-patient',
        label: '환자 치료 진행',
        detail: `${state.activeAilment.name} 치료 기한 ${state.activeAilment.timer}시간, 채집 포인트 ${state.activeAilment.foragingPoints}.`,
        meta: `가방 약재 ${patientReagentCount}개`,
        targetId: 'patient-clinic-panel',
        tone: 'primary'
      });

      if (barterLimit > 0) {
        const barterLocationSummary = barterLocations.some(option => option.relation === 'current')
          ? locationTypeLabel(barterLocations.find(option => option.relation === 'current')?.type || '')
          : '인접 정착지/도시';
        addActionHubItem({
          id: 'barter-reagent',
          label: barterRemaining > 0 ? '거래로 재료 확보' : '거래 횟수 소진',
          detail: barterRemaining > 0
            ? `${barterLocationSummary}에서 이 환자에게 ${barterRemaining}회 더 거래할 수 있습니다.`
            : `${barterLocationSummary} 거래 한도를 모두 사용했습니다.`,
          targetId: 'patient-clinic-panel',
          tone: barterRemaining > 0 ? 'neutral' : 'warning',
          disabled: barterRemaining <= 0
        });
      }
    }

    if (state.needsLocalHelpBeforeMove && !state.activeAilment && !state.scroungingMode) {
      addActionHubItem({
        id: 'local-help',
        label: '현지 기록 마무리',
        detail: '이곳의 환자나 고분 문제를 해결해야 다음 이동이 열립니다.',
        targetId: currentBarrow ? 'barrow-panel' : 'patient-clinic-panel',
        tone: 'warning'
      });
    }

    if (!state.needsLocalHelpBeforeMove && !state.pursuedByBehemoth) {
      addActionHubItem({
        id: 'travel-next',
        label: '다음 위치로 이동',
        detail: `현재 이동 속도 ${activeTravelSpeed}. 새 장소와 지역을 정합니다.`,
        meta: journeyGoalDone ? '여정 목표 충족' : '여정 목표 진행 중',
        targetId: 'travel-panel',
        tone: journeyGoalDone ? 'done' : 'neutral'
      });
    }

    addActionHubItem({
      id: 'clinic-open',
      label: state.activeAilment ? '치료제 조제 확인' : '새 환자 진료',
      detail: state.activeAilment ? '요구 태그와 선택 재료를 함께 검토합니다.' : '현재 위치에서 환자를 진단하거나 채집을 시작합니다.',
      targetId: 'patient-clinic-panel',
      tone: 'neutral'
    });
  }

  const actionHubStatus = [
    { label: '상태', value: state.journeyActive ? '여정 중' : '휴식기' },
    { label: '위치', value: hubLocation },
    { label: '가방', value: `${formatWeight(currentWeight)} / ${maxCarry}` },
    state.journeyActive
      ? { label: '목표', value: journeyGoalDone ? '충족' : '진행 중' }
      : { label: '평판', value: `${state.reputation}점` },
    state.scroungingMode
      ? { label: '여분 시간', value: `${state.scroungingTimer || 0}시간` }
      : state.activePatientId
        ? { label: '환자', value: `${state.patients.find(patient => patient.id === state.activePatientId)?.ailments.filter(ailment => ailment.status === 'active').length || 0}개 질환 · ${Math.min(...(state.patients.find(patient => patient.id === state.activePatientId)?.timers.filter(timer => timer.status === 'active').map(timer => timer.current) || [0]))}시간` }
        : null
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const handleActionHubItem = (item: ActionHubItem) => {
    if (item.disabled) return;
    item.activate?.();
    if (item.targetId) {
      window.setTimeout(() => {
        document.getElementById(item.targetId || '')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {state.pendingPatientArchive && (
        <div id="pending-archive-panel" style={{ position: 'fixed', right: '1.2rem', bottom: '1.2rem', zIndex: 1100, width: 'min(420px, calc(100vw - 2.4rem))' }}>
          <div className="cute-card" style={{ background: '#fffefa', border: '1.5px solid var(--border-cozy)', boxShadow: '0 8px 24px rgba(36,32,24,0.16)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.45rem', marginBottom: '0.7rem' }}>
              <div>
                <div className="document-kicker">진료 일지 덮기</div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem' }}>{state.pendingPatientArchive.ailmentName}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {(state.pendingPatientArchive.patientName || '이름 모를 야수')}
                  {state.pendingPatientArchive.species ? ` / ${state.pendingPatientArchive.species}` : ''}
                </div>
              </div>
              <span className="journal-stamp" style={{ color: state.pendingPatientArchive.outcome === 'success' ? 'var(--primary)' : '#8a6f65', borderColor: state.pendingPatientArchive.outcome === 'success' ? 'var(--primary)' : '#8a6f65' }}>
                {state.pendingPatientArchive.outcome === 'success' ? '온전히 나아감' : '꺾지 못함'}
              </span>
            </div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              기록장에 남길 맺음말
            </label>
            <textarea
              rows={4}
              value={finalArchiveNoteDraft}
              onChange={e => setFinalArchiveNoteDraft(e.target.value)}
              placeholder="맺음말을 그대로 두거나, 알맞게 다듬거나 비워두세요."
              style={{ width: '100%', resize: 'vertical', fontSize: '0.9rem' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginTop: '0.5rem', cursor: 'pointer', color: 'var(--text-bright)', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={isBookmarkedDraft}
                onChange={e => setIsBookmarkedDraft(e.target.checked)}
              />
              <span>⭐ 이 인연을 마음에 깊이 품어두기</span>
            </label>
            {state.pendingPatientArchive.consequence && (
              <div style={{ marginTop: '0.55rem', padding: '0.55rem', background: '#f2eee9', border: '1px solid #d7cbc1', borderRadius: '4px', color: '#6c5a4f', fontSize: '0.8rem' }}>
                <strong>이후의 병색과 여파:</strong> {state.pendingPatientArchive.consequence}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.8rem' }}>
              <button
                onClick={() => setFinalArchiveNoteDraft(state.pendingPatientArchive?.initialRememberedNote || '')}
                style={{ padding: '0.45rem 0.7rem', border: '1px solid var(--glass-border)', background: '#f7f6ef', color: 'var(--text-muted)', borderRadius: '4px', fontSize: '0.8rem' }}
              >
                원래 메모로
              </button>
              <button
                onClick={handleFinalizePatientArchive}
                className="btn-cozy-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              >
                기록장에 새기기
              </button>
            </div>
          </div>
        </div>
      )}

        <section id="action-hub" className="action-hub" aria-label="현재 진행판">
        <div className="action-hub__header">
          <div>
            <div className="document-kicker">진행판</div>
            <h2>지금 이어갈 일</h2>
          </div>
          <div className="action-hub__status" aria-label="현재 상태">
            {actionHubStatus.map(item => (
              <span key={item.label} className="action-hub__chip">
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="action-hub__grid">
                {actionHubItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`action-step action-step--${item.tone || 'neutral'}`}
                  data-play-action-id={item.id}
                  onClick={() => handleActionHubItem(item)}
                  disabled={item.disabled}
                >
              <span className="action-step__index">{index + 1}</span>
              <span className="action-step__body">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
                {item.meta && <em>{item.meta}</em>}
              </span>
            </button>
          ))}
        </div>
      </section>

      {canonicalWagonFromState(state).expansionIds.includes('passenger-booth') && (
        <div className="cute-card" style={{ background: '#fffefa', border: '1.5px solid var(--border-cozy)', borderRadius: '7px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div className="document-kicker">조수석 부스</div>
              <h3 style={{ margin: '0.2rem 0 0.35rem 0', color: 'var(--primary)', fontSize: '1.05rem' }}>조수석 부스</h3>
              {state.activePassenger ? (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.55 }}>
                  <strong>{state.activePassenger.name}</strong> 동승 중 · 목적지: <strong>{state.activePassenger.destination}</strong><br />
                  임시 길동무 역할: <strong>{state.activePassenger.roleBenefit}</strong> · 도착 보상: 장신구 {state.activePassenger.reward}개
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.55 }}>
                  정착지에서 치료제를 거래한 뒤 승객을 모집할 수 있습니다.
                  {state.passengerPickupReady ? ' 지금 이 위치에서 승객을 태울 수 있습니다.' : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {state.activePassenger ? (
                <button
                  type="button"
                  onClick={handleDropOffPassenger}
                  className="btn-cozy-primary"
                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
                >
                  승객 내려주기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePickUpPassenger}
                  disabled={!state.passengerPickupReady}
                  className="btn-cozy-secondary"
                  style={{
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.82rem',
                    opacity: state.passengerPickupReady ? 1 : 0.55,
                    cursor: state.passengerPickupReady ? 'pointer' : 'not-allowed'
                  }}
                >
                  승객 태우기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="play-with-map">
        <aside id="play-journey-map" className="play-with-map__map" aria-label="여정 지도">
          <MapView
            state={state}
            onOpenReference={onOpenReference}
            variant="companion"
            highlightLocationIds={playMapHighlightIds}
            selectedLocationId={playMapSelectedId}
            includeWilds
            routePlaceIds={routeDraft.stops.map(stop => stop.id)}
            onConfirmDestination={playMapMode === 'destination' ? handlePlayMapPick : undefined}
            onTravelRequest={playMapMode === 'travel' ? handlePlayMapTravel : undefined}
            onAddWaypoint={handleAddRouteWaypoint}
            onSetCurrentLocation={handleSetMappedCurrentLocation}
            onCreatePlace={undefined}
            onMovePlace={undefined}
            onEditPlace={undefined}
            onDeletePlace={undefined}
            onSavePlaces={undefined}
            canDeletePlace={undefined}
            veiled
            showWaypointAction={false}
            travelEnabled={Boolean(state.journeyActive && !state.needsLocalHelpBeforeMove)}
            travelBlockedReason={state.needsLocalHelpBeforeMove ? '현지 일을 마친 뒤 이동할 수 있습니다.' : null}
            onOpenFullMap={onOpenFullMap}
            showRoutePreview={false}
            companionCaption={
              playMapMode === 'destination'
                ? (journeyDestinationCard
                  ? (selectedJourneyDestination
                    ? `선택된 후보: ${selectedJourneyDestination.name} · 총거리 ${selectedJourneyDestination.paths}경로`
                    : journeyDestinationCandidates.length > 0
                      ? '여정 조건을 충족하는 후보를 지도에서 골라 목적지로 지정하세요. 오른쪽에서 들르는 자리도 이어서 확인할 수 있습니다.'
                      : '현재는 이동 가능한 후보가 없습니다. 목적지 카드를 다시 뽑으세요.')
                  : '목적지 카드를 뽑으면 방향·거리 조건에 맞는 정착지가 지도에 표시됩니다.')
                : `노드를 눌러 사이길을 잇고, 오른쪽에서 육로/수로를 고르세요. 빈 자리는 ⌘+클릭으로 표시합니다. 자리를 옮기려면 먼저 이동 잠금을 켜세요.${currentWeight > maxCarry ? ' 소지 한도를 넘어 1경로만 갑니다.' : ''}`
            }
          />
        </aside>
        <div className="play-with-map__panels">
          {!state.journeyActive && downtimeTab === 'start' && (
            <section
              className="journey-candidate-list"
              aria-label="도달 후보 빠른 선택"
              style={{
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: '#fffdfa',
                padding: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem'
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                도달 후보(이름/거리: A~6=12이하, 7~9=13~24, 10/J/M=24+)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                지도에서 표시되는 후보는 카드 값 구간으로 필터된 목적지들입니다. 왼쪽은 후보 이름, 오른쪽은 실제 경로 수입니다.
              </div>
              {!journeyDestinationCard && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  목적지 카드를 먼저 뽑으면 후보가 표시됩니다.
                </div>
              )}
              {journeyDestinationCard && journeyDestinationCandidates.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                  현재는 이동 가능한 후보가 없습니다. 지도 카드 규칙을 다시 뽑아 주세요.
                </div>
              )}
              {journeyDestinationCard && journeyCandidateGroups.length > 0 && (
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  {journeyCandidateGroups.map(group => (
                    <div key={group.key} style={{ display: 'grid', gap: '0.32rem' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {`${group.label} (${group.range}, ${group.candidates.length}개)`}
                      </div>
                      {group.candidates.map(candidate => (
                        <button
                          type="button"
                          key={candidate.id}
                          onClick={() => setDestName(candidate.id)}
                          style={{
                            borderRadius: '8px',
                            border: `1.5px solid ${candidate.id === destName ? 'var(--primary)' : '#e9e0cf'}`,
                            background: candidate.id === destName ? 'var(--paper)' : '#fff',
                            padding: '0.45rem 0.55rem',
                            textAlign: 'left',
                            fontSize: '0.82rem',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '0.5rem'
                          }}
                        >
                          <span>{candidate.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{candidate.paths}경로</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          <RouteComposer
            draft={routeDraft}
            speed={activeTravelSpeed}
            carry={maxCarry}
            weight={currentWeight}
            waterwaySpan={resolveWagonCapabilities(canonicalWagonFromState(state)).waterwaySpan}
            canStopInLoch={hasLochStoppingGear(state)}
            protectsFromSoaking={hasSafeWaterwayTravel(state)}
            soakableItemNames={state.bag.filter(item => isRuinedWhenSoaked(item)).map(item => item.name)}
            canTravel={Boolean(state.journeyActive && !state.needsLocalHelpBeforeMove)}
            travelBlockedReason={
              !state.journeyActive
                ? '여정을 시작한 뒤 이 경로로 이동합니다.'
                : state.needsLocalHelpBeforeMove
                  ? '현지 일을 마친 뒤 이동할 수 있습니다.'
                  : null
            }
            onChangeStop={handleRouteStopChange}
            onChangeEdge={handleRouteEdgeChange}
            onRemoveStop={handleRemoveRouteStop}
            onClear={handleClearRouteSides}
            onTravel={handleComposerTravel}
          />

      {/* 1. If journey is NOT active */}
      {!state.journeyActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* Downtime record */}
          <div id="downtime-panel" className="cute-card" style={{ background: '#fffefa', border: '1.5px solid var(--secondary)', borderRadius: '7px', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
              <span className="journal-stamp">휴식</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--secondary)', fontFamily: 'var(--font-fancy)' }}>휴식기 기록</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  현재 위치: <strong style={{ color: 'var(--primary)' }}>{state.currentLocationName}</strong>
                  ({state.currentLocationType === 'City' ? '도시' : state.currentLocationType === 'Settlement' ? '정착지' : '야생'}) |
                  계절: <strong style={{ color: 'var(--secondary)' }}>{localizeSeasonLabel(state.currentSeason)}</strong>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              여정을 안전하게 마친 후 머무는 동안, 도구를 정비하고 마차를 개조하거나 새로운 조수(동반자)를 영입해 다음 모험을 탄탄히 준비하세요.
            </p>
            {state.downtimeCompleted && (
              <div className="downtime-season-action">
                <div>
                  <strong>{localizeSeasonLabel(state.currentSeason)}의 휴식기 정산이 끝났습니다.</strong>
                  <span>약제소 수입과 기부, 동반자 변화를 반영하고 다음 계절로 넘어갑니다.</span>
                </div>
                <button type="button" className="btn-cozy-secondary" onClick={handleAdvanceSeason}>
                  계절 정산 및 전환
                </button>
              </div>
            )}
          </div>

          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderBottom: '2px solid var(--border-cozy)', paddingBottom: '0.4rem' }}>
            <button
              className={`nav-tab-btn ${downtimeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setDowntimeTab('activities')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              휴식기 활동
            </button>
            <button
              className={`nav-tab-btn ${downtimeTab === 'shop' ? 'active' : ''}`}
              onClick={() => setDowntimeTab('shop')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              도구 & 마차 개조
            </button>
            <button
              className={`nav-tab-btn ${downtimeTab === 'companions' ? 'active' : ''}`}
              onClick={() => setDowntimeTab('companions')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              동반자 영입 ({state.companionStates?.length || 0})
            </button>
            <button
              className={`nav-tab-btn ${downtimeTab === 'start' ? 'active' : ''}`}
              onClick={() => setDowntimeTab('start')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              새 여정 출발
            </button>
          </div>

          {/* 1. Downtime Activities tab */}
          {downtimeTab === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {/* 🏡 약제소 본부 (Clinic Headquarters) */}
              {(atClinicLocation || inClinicServiceArea) && (
                <div className="cute-card" style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '12px', padding: '1.2rem' }}>
                  <h3 style={{ color: '#15803d', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                    <span>🏡 약제소 본부</span>
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#166534', margin: '0 0 1rem 0' }}>
                    현재 구역({localizeRegionLabel(state.currentRegion)}) 또는 위치({state.currentLocationName})에 길드 약제소가 설립되어 있어 본부 혜택을 이용할 수 있습니다.
                  </p>

                  {/* 활성화된 아젠다 서비스 리스트 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(state.clinics || []).map((c, i) => (
                      <span key={i} style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        📍 {c.locationName} 지부: {clinicServiceLabel(c.agendaService)}
                      </span>
                    ))}
	                  </div>

	                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
	                    {/* Hive Boxes */}
	                    {canonicalClinicAgendaIds(state).includes('hive-boxes') && (
	                      <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
	                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>🐝 벌집 보관함</h4>
	                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
	                          활성 약제소에 머물 때 동반자를 보관하거나 다시 동행시킬 수 있습니다. 동행 한도가 꽉 찬 상태에서 회수하면 가장 오래 동행한 친구가 보관함으로 들어갑니다.
	                        </p>
	                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '0.75rem' }}>
	                          <div>
	                            <strong style={{ fontSize: '0.8rem', color: '#166534' }}>현재 동행</strong>
	                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
	                              {(state.companionStates || []).length === 0 && <span style={{ fontSize: '0.78rem', color: '#888', fontStyle: 'italic' }}>동행 중인 곤충이 없습니다.</span>}
	                              {(state.companionStates || []).map(comp => (
	                                <div key={comp.instanceId} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', border: '1px solid #dcfce7', borderRadius: '6px', padding: '0.4rem', fontSize: '0.8rem' }}>
	                                  <span>{COMPANIONS_DB.find(row => canonicalCompanionId(row.id) === canonicalCompanionId(comp.companionId))?.name || comp.companionId}</span>
	                                  <button disabled={!atClinicLocation} onClick={() => handleStoreCompanionInHive(comp.instanceId)} style={{ border: 'none', borderRadius: '6px', padding: '0.25rem 0.45rem', background: '#dcfce7', color: '#166534', cursor: atClinicLocation ? 'pointer' : 'not-allowed', opacity: atClinicLocation ? 1 : 0.55, fontWeight: 'bold', fontSize: '0.75rem' }}>보관</button>
	                                </div>
	                              ))}
	                            </div>
	                          </div>
	                          <div>
	                            <strong style={{ fontSize: '0.8rem', color: '#166534' }}>벌집 보관함</strong>
	                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
	                              {(!state.companionHiveStates || state.companionHiveStates.length === 0) && <span style={{ fontSize: '0.78rem', color: '#888', fontStyle: 'italic' }}>보관 중인 곤충이 없습니다.</span>}
	                              {(state.companionHiveStates || []).map(comp => (
	                                <div key={comp.instanceId} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', border: '1px solid #dcfce7', borderRadius: '6px', padding: '0.4rem', fontSize: '0.8rem' }}>
	                                  <span>{COMPANIONS_DB.find(row => canonicalCompanionId(row.id) === canonicalCompanionId(comp.companionId))?.name || comp.companionId}</span>
	                                  <button disabled={!atClinicLocation} onClick={() => handleRecallHiveCompanion(comp.instanceId)} style={{ border: 'none', borderRadius: '6px', padding: '0.25rem 0.45rem', background: '#166534', color: '#fff', cursor: atClinicLocation ? 'pointer' : 'not-allowed', opacity: atClinicLocation ? 1 : 0.55, fontWeight: 'bold', fontSize: '0.75rem' }}>동행</button>
	                                </div>
	                              ))}
	                            </div>
	                          </div>
	                        </div>
	                      </div>
	                    )}

	                    {/* Mailbox */}
	                    {(state.clinics || []).some(c => c.agendaService === 'mailbox') && (
	                      <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
	                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>📮 우체통</h4>
	                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
	                          외부 길드 우체통에서 확인한 도움 요청을 일지에 기록합니다. 환자와 질환은 일반 진단 절차로 시작합니다.
	                        </p>
	                        <button
	                          onClick={handleMailboxPatient}
	                          className="btn-cozy-secondary"
	                          style={{
	                            padding: '0.4rem 0.8rem',
	                            fontSize: '0.8rem',
	                            background: '#166534',
	                            color: '#fff',
	                            cursor: 'pointer'
	                          }}
	                        >
	                          📮 도움 요청 기록
	                        </button>
	                      </div>
	                    )}

	                    {/* 1. Pantry (Hibernate) */}
	                    {(state.clinics || []).some(c => c.agendaService === 'pantry') && (
                      <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>❄️ 식료품 저장고 겨울잠</h4>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                          겨울 시즌에 식료품 저장고를 통해 동면을 수행하여 즉시 봄으로 건너뛸 수 있습니다. (평판 15점 이상 시 무료, 미만 시 15 장신구 소모)
                        </p>
                        <button
                          onClick={handlePantryHibernate}
                          disabled={state.currentSeason !== 'Winter'}
                          className="btn-cozy-secondary"
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            background: state.currentSeason === 'Winter' ? '#22c55e' : '#e2e8f0',
                            color: state.currentSeason === 'Winter' ? '#fff' : '#94a3b8',
                            cursor: state.currentSeason === 'Winter' ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {state.currentSeason === 'Winter' ? '❄️ 겨울 동면 시작하기 (봄으로 건너뛰기)' : '⚠️ 겨울 시즌에만 동면이 가능합니다.'}
                        </button>
                      </div>
                    )}

                    {/* 2. Gardens (약초 정원) */}
                    {(state.clinics || []).some(c => c.agendaService === 'gardens') && (() => {
                      const hasGreenhouse = (state.clinics || []).some(c => c.agendaService === 'greenhouses');
                      const isWinter = state.currentSeason === 'Winter';
                      const canHarvest = !isWinter || hasGreenhouse;
                      return (
                        <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>🌱 약초 정원{hasGreenhouse && '과 온실'}</h4>
                          <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                            보유 중인 영약재를 정원에 심어 재배하고 수확할 수 있습니다. (질병 치료당 1회 수확 가능)
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#444' }}>
                              현재 약제소에 심긴 약재: <strong>{currentGardenReagent?.displayName || '없음'}</strong>
                              {currentGardenReagent && (gardenHarvestedForCurrentAilment ? ' (이번 질병 수확 완료)' : ' (수확 가능)')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select id="garden_plant_select" style={{ padding: '0.3rem', fontSize: '0.8rem' }}>
                                <option value="">-- 심을 약재 선택 --</option>
                                {state.bag.filter(item => item.type === 'reagent'
                                  && item.canonicalReagentId
                                  && REAGENT_BY_ID.get(item.canonicalReagentId)?.type === 'PLANT').map((item, idx) => (
                                  <option key={idx} value={item.id}>{localizeInventoryItemName(item.name)}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  const select = document.getElementById('garden_plant_select') as HTMLSelectElement;
                                  if (select && select.value) {
                                    handleGardenPlant(select.value);
                                  } else {
                                    showAlert("심을 약재를 선택하세요.");
                                  }
                                }}
                                className="btn-cozy-primary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              >
                                🌱 심기
                              </button>
                            </div>
                            {currentGardenReagent && (
                              <button
                                onClick={handleGardenHarvest}
                                disabled={!atClinicLocation || !canHarvest || gardenHarvestedForCurrentAilment || !currentClinicAilment}
                                className="btn-cozy-secondary"
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.8rem',
                                  alignSelf: 'flex-start',
                                  background: (atClinicLocation && canHarvest && !gardenHarvestedForCurrentAilment && currentClinicAilment) ? '#166534' : '#e2e8f0',
                                  color: (atClinicLocation && canHarvest && !gardenHarvestedForCurrentAilment && currentClinicAilment) ? '#fff' : '#94a3b8',
                                  cursor: (atClinicLocation && canHarvest && !gardenHarvestedForCurrentAilment && currentClinicAilment) ? 'pointer' : 'not-allowed'
                                }}
                              >
                                🧺 정원 약초 수확하기
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. Sodden Logs (물에 젖은 통나무) */}
                    {(state.clinics || []).some(c => c.agendaService === 'sodden_logs') && (
                      <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>🐛 물에 젖은 통나무</h4>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                          곤충 서식지를 만들어 곤충 약재를 수확합니다. (치료 시간 1시간을 추가로 소비하여 질병 타이머 -1)
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#444' }}>
                            현재 서식 곤충: <strong>{soddenReagent?.displayName || '없음'}</strong>
                            {soddenReagent && (soddenHarvestedForCurrentAilment ? ' (이번 질병 수확 완료)' : ' (수확 가능)')}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select id="sodden_insect_select" style={{ padding: '0.3rem', fontSize: '0.8rem' }}>
                              <option value="">-- 서식 곤충 지정 --</option>
                              {REAGENTS.filter(r => r.type === 'INSECT').map((item, idx) => (
                                <option key={idx} value={item.id}>{item.displayName}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const select = document.getElementById('sodden_insect_select') as HTMLSelectElement;
                                if (select && select.value) {
                                  handleSoddenLogInsect(select.value);
                                } else {
                                  showAlert("서식할 곤충을 선택하세요.");
                                }
                              }}
                              className="btn-cozy-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              🐛 지정하기
                            </button>
                          </div>
                          {soddenReagent && (
                            <button
                              onClick={handleSoddenLogHarvest}
                              disabled={state.currentSeason === 'Winter' || soddenHarvestedForCurrentAilment || !currentClinicAilment}
                              className="btn-cozy-secondary"
                              style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.8rem',
                                alignSelf: 'flex-start',
                                background: (state.currentSeason !== 'Winter' && !soddenHarvestedForCurrentAilment && currentClinicAilment) ? '#166534' : '#e2e8f0',
                                color: (state.currentSeason !== 'Winter' && !soddenHarvestedForCurrentAilment && currentClinicAilment) ? '#fff' : '#94a3b8',
                                cursor: (state.currentSeason !== 'Winter' && !soddenHarvestedForCurrentAilment && currentClinicAilment) ? 'pointer' : 'not-allowed'
                              }}
                            >
                              🧺 통나무 곤충 수확하기 (치료 중일 때만 가능)
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. Goodwill Stand (친선 매대 기부) */}
                    {(state.clinics || []).some(c => c.agendaService === 'goodwill_stand') && (
                      <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>🎁 친선 매대</h4>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                          가방의 약재나 도구를 기부하고 계절 정산 시 평판으로 돌려받습니다.
                          (현재 계절 기부량: <strong>{formatWeight(state.goodwillDonationsVal || 0)}</strong>)
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select id="goodwill_item_select" style={{ padding: '0.3rem', fontSize: '0.8rem', flex: 1 }}>
                            <option value="">-- 기부할 가방 아이템 선택 --</option>
                            {state.bag.map((item, idx) => (
                              <option key={idx} value={item.id}>{localizeInventoryItemName(item.name)} (무게: {formatWeight(item.weight)})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const select = document.getElementById('goodwill_item_select') as HTMLSelectElement;
                              if (select && select.value) {
                                handleGoodwillDonate(select.value);
                              } else {
                                showAlert("기부할 아이템을 선택하세요.");
                              }
                            }}
                            className="btn-cozy-primary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            🎁 기부하기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 🏡 선배의 진료소 거점 (Legacy Clinic Hub) */}
              {(() => {
                if (state.rulesetId !== 'legacy-campaign') return null;
                const legacyClinicsHere = (state.legacyClinics || []).filter(c => c.region === state.currentRegion || c.locationName === state.currentLocationName);
                if (legacyClinicsHere.length === 0) return null;

                return (
                  <div className="cute-card" style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '1.2rem' }}>
                    <h3 style={{ color: '#b45309', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                      <span>🏡 선배의 진료소 거점</span>
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#78350f', margin: '0 0 1rem 0' }}>
                      이 지역({localizeRegionLabel(state.currentRegion)}) 또는 위치({state.currentLocationName})에 이전 세대의 선배 약제사(설립자: {legacyClinicsHere.map(c => c.founder).join(', ')})가 설립한 옛 진료소가 남아있습니다.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {legacyClinicsHere.map((c, i) => (
                        <span key={i} style={{ background: '#fffbeb', color: '#78350f', border: '1px solid #fde68a', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          📍 {c.locationName} 지부 ({c.services.join(', ').toUpperCase()})
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleLegacyClinicRest}
                      disabled={state.legacyRestUsedThisLocation}
                      className="btn-cozy-primary"
                      style={{
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.85rem',
                        background: state.legacyRestUsedThisLocation ? '#cbd5e1' : '#f59e0b',
                        color: '#fff',
                        cursor: state.legacyRestUsedThisLocation ? 'not-allowed' : 'pointer',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold'
                      }}
                    >
                      {state.legacyRestUsedThisLocation ? '🔒 이 구역에서 이미 휴식/보급을 받았습니다' : '☕ 선배의 진료실에서 휴식 및 보급 (치료 타이머 +1시간 / 거수 선행 거리 +1 / 보급약재 지급)'}
                    </button>
                  </div>
                );
              })()}

              {/* Listening to Rumours (City Only) */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🗺️ 소문 듣기 (거수 고분 탐색)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  길드 명성이 <strong>15점 이상</strong>이고 <strong>도시</strong>에 머물 때만 가능합니다. 소문을 들어 지도상의 야생 구역에 거수 고분을 생성합니다. (현재 평판: {state.reputation}점)
                </p>

                {state.currentLocationType !== 'City' && !bypassShopRules ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                    ⚠️ 현재 위치가 도시가 아니어서 소문을 들을 수 없습니다. (상점 규칙 우회를 켜서 활성화할 수 있습니다.)
                  </div>
                ) : state.reputation < 15 && !bypassShopRules ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                    ⚠️ 길드 평판이 부족합니다. (최소 15점 필요, 현재 {state.reputation}점)
                  </div>
                ) : (
                  <div>
                    <button onClick={handleDrawRumours} className="btn-cozy-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      🎲 소문 카드 4장 드로우하기
                    </button>

                    {rumourCards.length > 0 && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fcfaf6', border: '1.5px dashed var(--border-cozy)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem' }}>🔮 드로우된 거수 정보</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem' }}>
                          {rumourCards.map((c, idx) => (
                            <div key={idx} style={{ flex: '0 0 100px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '0.5rem', textAlign: 'center' }}>
                              <img src={getCardSvgUrl(c.suit, c.val)} alt={`${c.suit}${c.val}`} style={{ width: '40px', height: 'auto', marginBottom: '0.3rem' }} />
                              <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>카드 {idx+1}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>{c.text}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>🏷️ 거수 고분 이름:</label>
                            <input
                              type="text"
                              value={rumourBarrowName}
                              onChange={e => setRumourBarrowName(e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>📍 카드 조건을 만족하는 지도 위치:</label>
                            <select
                              value={rumourLocName}
                              onChange={e => setRumourLocName(e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                              {(() => {
                                if (rumourCards.length !== 4) return null;
                                const cards = rumourCards.map(card => ({ value: card.val === 'A' ? 1 : card.val === 'J' ? 11 : card.val === 'Q' ? 12 : card.val === 'K' ? 13 : Number(card.val), suit: card.suit })) as [PlayingCard, PlayingCard, PlayingCard, PlayingCard];
                                const candidates = getRumourMapCandidates();
                                const valid = resolveRumour({ transactionId: 'rumour-ui-preview', reputation: Math.max(15, state.reputation), atCity: true, downtimeCompleted: false, cards, candidates, targetLocationId: '' }).validTargetIds;
                                return valid.map(id => {
                                  const row = candidates.find(candidate => candidate.locationId === id);
                                  return <option key={id} value={id}>{row?.label || id} · {localizeRegionLabel(row?.region)} · 경로 {row?.pathDistance}개</option>;
                                });
                              })()}
                            </select>
                          </div>
                          <button onClick={handleEstablishBarrow} className="btn-cozy-secondary" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }}>
                            💾 고분 위치 지도에 등록
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* General Practice */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🩺 일반 진료</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  동네 주민들을 진료하며 <strong>5 장신구</strong>를 벌고 질병의 태그를 영구 변경합니다.
                </p>

                <form onSubmit={handleGeneralPractice} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>현재 명성으로 다룰 수 있는 질환:</label>
                      <select
                        value={gpAilment}
                        onChange={e => {
                          const ailmentId = e.target.value;
                          const tags = Array.from(new Set(requirementRuleTags(AILMENTS.find(row => row.id === ailmentId)?.requirements || { kind: 'special', code: 'NONE', description: '' })));
                          setGpAilment(ailmentId);
                          setGpTagChange(tags[0] || '');
                          setGpReplacementTag(RULE_TAGS.find(tag => !['FAIR', 'FOUL', tags[0]].includes(tag)) || '');
                        }}
                        style={{ width: '100%', padding: '0.4rem' }}
                      >
                        <option value="">-- 질환을 선택하세요 --</option>
                        {AILMENTS.filter(row => canResolveSeverityAtReputation(row.severity, state.reputation)).map(row => (
                          <option key={row.id} value={row.id}>{row.displayName} · {localizeSeverityLabel(row.severity)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>영구적으로 바꿀 태그:</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.35rem', alignItems: 'center' }}>
                        <select value={gpTagChange} onChange={e => setGpTagChange(e.target.value)} disabled={!gpAilment} style={{ width: '100%', padding: '0.4rem' }}>
                          {Array.from(new Set(requirementRuleTags(AILMENTS.find(row => row.id === gpAilment)?.requirements || { kind: 'special', code: 'NONE', description: '' }))).map(tag => <option key={tag} value={tag}>{tag}</option>)}
                        </select>
                        <span aria-hidden="true">→</span>
                        <select value={gpReplacementTag} onChange={e => setGpReplacementTag(e.target.value)} disabled={!gpAilment} style={{ width: '100%', padding: '0.4rem' }}>
                          {RULE_TAGS.filter(tag => tag !== 'FAIR' && tag !== 'FOUL' && tag !== gpTagChange).map(tag => <option key={tag} value={tag}>{tag}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>진료 일지 소감 기록:</label>
                    <textarea
                      placeholder="지역 약제사로서 진료하며 겪은 이야기를 일지로 기록합니다."
                      value={gpNote}
                      onChange={e => setGpNote(e.target.value)}
                      style={{ width: '100%', height: '60px', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <button type="submit" className="btn-cozy-secondary" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }}>
                    🩺 일반 진료 완료 및 5장신구 획득
                  </button>
                </form>
              </div>

              {/* Replenishing Stocks */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🧺 재고 보충</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  현재 구역(<strong style={{ color: 'var(--primary)' }}>{localizeRegionLabel(state.currentRegion)}</strong>)과 계절(<strong>{localizeSeasonLabel(state.currentSeason)}</strong>)에 맞는 제철 약재를 가방이 허용하는 만큼 여러 종류 고릅니다.
                </p>

                {(() => {
                  const region = toRuleRegion(state.currentRegion);
                  const matchingReagents = REAGENTS.filter(reagent =>
                    reagent.regionAvailability[region] !== 'Unavailable'
                    && reagent.seasonAvailability[state.currentSeason] === 'Common'
                  );

                  return (
                    <form onSubmit={handleReplenishStocks} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>채집 가능한 제철 약초 선택:</label>
                        <select
                          multiple
                          size={Math.min(8, Math.max(4, matchingReagents.length))}
                          value={replenishReagentIndexes.map(String)}
                          onChange={e => setReplenishReagentIndexes(Array.from(e.currentTarget.selectedOptions).map(option => parseInt(option.value, 10)))}
                          style={{ width: '100%', padding: '0.4rem' }}
                        >
                          {matchingReagents.map((reagent, idx) => (
                            <option key={reagent.id} value={idx}>{reagent.displayName} ({reagent.canonicalName} · 희귀도 {reagent.baseRarity})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>채집 방랑 일지:</label>
                        <input
                          type="text"
                          placeholder="약초를 캐면서 느꼈던 한적한 경험을 기록해 보세요."
                          value={replenishNote}
                          onChange={e => setReplenishNote(e.target.value)}
                          style={{ width: '100%', padding: '0.4rem' }}
                        />
                      </div>
                      <button type="submit" className="btn-cozy-secondary" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }} disabled={replenishReagentIndexes.length === 0}>
                        🧺 선택한 약초 보충하기
                      </button>
                    </form>
                  );
                })()}
              </div>

              {/* Working on Yourself */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🌱 자기 계발</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  바쁜 일상에서 벗어나 자신을 갈고닦습니다. 영구 능력치 버프 또는 새로운 여행 방식을 정립합니다.
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleWorkingOnYourself('speed')} className="btn-cozy-primary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>
                    🏃‍♂️ 속도 영구 향상 (+1 속도)
                  </button>
                  <button onClick={() => handleWorkingOnYourself('carry')} className="btn-cozy-primary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>
                    🎒 짐 소지 영구 향상 (+1 소지 한도)
                  </button>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px dashed #eee', paddingTop: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>🧭 이동 스타일 변경:</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <select id="style_select" style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }}>
                      {GAME_DATA.bioChoices.travelStyles.map((style, idx) => (
                        <option key={idx} value={style.name}>{localizeTravelStyle(style.name)} ({style.suit} - 속도 {style.speed}, 짐 {style.carry})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const sel = (document.getElementById('style_select') as HTMLSelectElement)?.value;
                        if (sel) handleWorkingOnYourself('style', sel);
                      }}
                      className="btn-cozy-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      변경 적용
                    </button>
                  </div>
                </div>
              </div>

              {/* 🐾 길동무와 교감 (Familiar Intimacy & milestones) */}
              {state.rulesetId === 'legacy-campaign' && <div className="cute-card" style={{ background: '#f8fafc', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🐾 길동무 교감</span>
                  <span style={{ fontSize: '0.8rem', background: 'var(--primary)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '12px' }}>
                    친밀도: {state.familiarTrust || 0}%
                  </span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  현재 동행 중인 길동무: <strong>{state.bio.familiarBenefit}</strong><br />
                  - 친밀도 마일스톤 등급: <strong>{ (state.familiarTrust || 0) >= 80 ? '🌟 영혼의 동반자 (최대)' : (state.familiarTrust || 0) >= 40 ? '🤝 신뢰하는 파트너' : '🌱 어색한 동행' }</strong><br />
                  - 친밀도 보너스: {
                    (() => {
                      const trust = state.familiarTrust || 0;
                      const benefit = state.bio.familiarBenefit;
                      if (benefit.includes("덤불") || benefit.includes("Brushwise") || benefit.includes("덤불 마스터")) {
                        return `식물 채집 희귀도 -${trust >= 80 ? 4 : trust >= 40 ? 3 : 2} 적용`;
                      } else if (benefit.includes("말동무") || benefit.includes("Chatty")) {
                        return `물꼬 거래 희귀도 -${trust >= 80 ? 4 : trust >= 40 ? 3 : 2} 적용`;
                      } else if (benefit.includes("유적") || benefit.includes("Titanwise") || benefit.includes("유적/고분 마스터")) {
                        return `고분/유물 채집 희귀도 -${trust >= 80 ? 4 : trust >= 40 ? 3 : 2} 적용`;
                      }
                      return `친밀도에 따라 고유 능력이 강화됩니다.`;
                    })()
                  }
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <button
                    type="button"
                    onClick={handleFamiliarSpendTime}
                    className="btn-cozy-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', alignSelf: 'flex-start' }}
                  >
                    🚶‍♂️ 길동무와 하루 동안 시간 보내기 (친밀도 +5%, 일정 +1일 소모)
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <select id="familiar_feed_select" style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }}>
                      <option value="">-- 먹일 식물 약재 선택 (친밀도 +15%) --</option>
                      {state.bag.filter(item => item.type === 'reagent').map(item => (
                        <option key={item.id} value={item.id}>{localizeInventoryItemName(item.name)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const selVal = (document.getElementById('familiar_feed_select') as HTMLSelectElement)?.value;
                        if (selVal) {
                          handleFamiliarFeedReagent(selVal);
                        } else {
                          showAlert("먹일 약재를 선택해 주세요.");
                        }
                      }}
                      className="btn-cozy-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      🍎 간식 주기
                    </button>
                  </div>
                </div>
              </div>}

              {/* Exploring The Woods */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🧭 숲 탐험하기</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  현재 머무는 위치 주변의 지도에 두 장소 간 새로운 경로나 물길을 하나 개척합니다.
                </p>
                <button
                  onClick={handleExploreNewPath}
                  className="btn-cozy-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  🗺️ 새로운 경로 개척
                </button>
              </div>

              {/* Reconnecting With Guildmates */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🤝 동료들과 재회하기</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  가장 가까운 도시로 이동해 다른 동료 약제사들과 정보와 노트를 공유합니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>가져갈 길드 정보 노트 선택:</label>
                    <select id="reconnect_note_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="ledger">🌿 식물학자의 장부 (Botanist's Ledger - 무게 1/3, 해당 지역 채집 시작 시 채집 포인트 +2)</option>
                      <option value="map">🗺️ 물류 지도 (Logistical Map - 무게 2/3, 해당 지역 이동 조우 시 2장 드로우 선택)</option>
                      <option value="gossip">💬 흥미로운 소문 (Juicy Gossip - 무게 0, 흥정 거래 시 소모해 자동 성공)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>노트의 적용 지역 (장부/지도 선택 시에만 필요):</label>
                    <select id="reconnect_region_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="Forest">숲</option>
                      <option value="Meadow">초원</option>
                      <option value="Loch">호수</option>
                      <option value="Bog">수렁</option>
                      <option value="Mountain">산맥</option>
                      <option value="Titan">Titan 유적</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>이동할 도시:</span>{' '}
                    실제 지도 경로상 가장 가까운 도시가 자동으로 계산됩니다. 같은 거리의 도시가 여럿이면 선택할 수 있습니다.
                  </div>
                  <button
                    onClick={() => {
                      const noteType = (document.getElementById('reconnect_note_select') as HTMLSelectElement)?.value;
                      const selectedRegion = (document.getElementById('reconnect_region_select') as HTMLSelectElement)?.value;
                      const graph = toServiceMapGraph(state);
                      const currentId = findMapLocationKey(state.currentLocationName, state.customMapLocations || []) || normalizeMapLocationName(state.currentLocationName);
                      const cities = Object.values(graph).filter(node => node.locationType === 'City')
                        .map(node => ({ node, distance: shortestPathDistance(graph, currentId, node.id) }))
                        .filter((row): row is { node: ServiceRuntimeState['graph'][string]; distance: number } => row.distance !== null);
                      const minimum = Math.min(...cities.map(row => row.distance));
                      const nearest = cities.filter(row => row.distance === minimum);
                      if (nearest.length === 0) {
                        showAlert('현재 지도에서 경로로 닿을 수 있는 도시를 찾지 못했습니다.');
                        return;
                      }
                      let destination = nearest[0].node;
                      if (nearest.length > 1) {
                        const cityChoice = prompt(`가장 가까운 도시가 여럿입니다. 한 곳을 선택하세요:\n${nearest.map((row, index) => `${index + 1}. ${row.node.name} · 경로 ${row.distance}개`).join('\n')}`, '1');
                        if (cityChoice === null) return;
                        destination = nearest[(parseInt(cityChoice, 10) || 1) - 1]?.node;
                        if (!destination) return;
                      }
                      const cityRegion = destination.region === 'Soar' ? toRuleRegion(state.currentRegion) : destination.region;
                      const reg = normalizeMapLocationName(destination.name) === 'glasswall' ? selectedRegion : cityRegion;
                      let name: string;
                      let wt: number;
                      if (noteType === 'ledger') {
                        name = `식물학자의 장부 [${reg}]`;
                        wt = 1/3;
                      } else if (noteType === 'map') {
                        name = `물류 지도 [${reg}]`;
                        wt = 2/3;
                      } else {
                        name = `흥미로운 소문`;
                        wt = 0;
                      }
                      const transaction = createClientTransaction('downtime:reconnect');
                      const noteItem: EngineInventoryItem = {
                        id: `${transaction.id}:note`,
                        name,
                        weight: wt,
                        type: 'item',
                        quantity: 1,
                        guildNote: {
                          kind: noteType as 'ledger' | 'map' | 'gossip',
                          ...(noteType === 'gossip' ? {} : { region: reg as Region })
                        }
                      };
                      try {
                        const runtime = resolveCanonicalDowntime(transaction.id, toCanonicalDowntimeRuntime(state), {
                          activity: 'reconnect',
                          nearestCityId: destination.id,
                          noteItem,
                          journalText: `${destination.name}(으)로 이동해 동료들과 재회하고 ${name}을 받았다.`
                        });
                        updateState((s: GameState) => ({ ...applyCanonicalDowntimeRuntime(s, runtime), completedReconnecting: true }));
                        showAlert(`동료들과 노트를 공유하고 ${destination.name}(으)로 이동해 ${name}을 받았습니다.`);
                      } catch (error) {
                        showAlert(error instanceof Error ? error.message : '동료들과 재회하지 못했습니다.');
                      }
                    }}
                    className="btn-cozy-secondary"
                    style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}
                  >
                    🤝 동료들과 재회 완료
                  </button>
                </div>
              </div>

              {/* Relaxing with Friends */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>💖 친구들과 휴식하기</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  길동무를 교체하거나, 가방에 들어갈 새로운 기본 도구를 이별 선물로 받습니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>획득할 선물 도구 선택 (도구를 선택할 경우):</label>
                    <select id="relax_tool_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="">-- 선물 도구 선택 --</option>
                      {ALMANACK_TOOLS.map(tool => (
                        <option key={tool.id} value={tool.id}>{tool.canonicalName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>새로운 길동무 영입 (길동무를 교체할 경우):</label>
                    <select id="relax_familiar_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="">-- 새 길동무 혜택 선택 --</option>
                      {FAMILIAR_BENEFITS.map(f => (
                        <option key={f.card} value={f.name}>{f.name} ({f.desc})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const toolId = (document.getElementById('relax_tool_select') as HTMLSelectElement)?.value;
                      const fName = (document.getElementById('relax_familiar_select') as HTMLSelectElement)?.value;

                      if (!toolId && !fName) {
                        showAlert("도구 선물이나 길동무 교체 중 하나를 선택해 주세요.");
                        return;
                      }
                      if (toolId && fName) {
                        showAlert('도구 선물 또는 길동무 교체 중 하나만 선택해 주세요.');
                        return;
                      }
                      const transaction = createClientTransaction('downtime:relax');
                      if (toolId) {
                        const toolResult = purchaseCanonicalTool({
                          transactionId: `${transaction.id}:gift`,
                          state: {
                            trinkets: state.trinkets.length,
                            inventory: toEngineInventory(state.bag),
                            tools: canonicalToolsFromState(state),
                            appliedTransactionIds: state.appliedTransactionIds,
                            journalEvents: []
                          },
                          toolId,
                          source: 'downtime-gift'
                        });
                        if (!toolResult.value) {
                          showAlert(toolResult.messages.join('\n'));
                          return;
                        }
                        const toolState = toolResult.value;
                        const source: GameState = {
                          ...state,
                          bag: fromEngineInventory(toolState.inventory, state.bag),
                          toolStates: toolState.tools,
                          appliedTransactionIds: toolState.appliedTransactionIds,
                          journals: appendEngineJournals(state.journals, toolState.journalEvents)
                        };
                        const downtime = resolveDowntimeActivity('relax-tool', transaction.id, source);
                        if (!downtime) return;
                        updateState((s: GameState) => {
                          const withTool: GameState = {
                            ...s,
                            bag: fromEngineInventory(toolState.inventory, s.bag),
                            toolStates: toolState.tools,
                            appliedTransactionIds: toolState.appliedTransactionIds,
                            journals: appendEngineJournals(s.journals, toolState.journalEvents)
                          };
                          return applyDowntimeOutcome(withTool, downtime);
                        });
                        showAlert(`${ALMANACK_TOOLS.find(tool => tool.id === toolId)?.canonicalName || '도구'}를 이별 선물로 받았습니다.`);
                        return;
                      }
                      const downtime = resolveDowntimeActivity('relax-familiar', transaction.id);
                      if (!downtime) return;
                      updateState((s: GameState) => {
                        const next = applyDowntimeOutcome(s, downtime);
                        return {
                          ...next,
                          bio: { ...next.bio, familiarBenefit: fName },
                          journals: [{
                            id: `${transaction.id}:familiar`,
                            title: '친구들과 보낸 휴식',
                            text: `친구들과 쉬며 새 길동무 ${fName}와 함께하기로 했다.`,
                            timestamp: transaction.at
                          }, ...next.journals]
                        };
                      });
                      showAlert(`새 길동무 혜택을 ${fName}(으)로 바꿨습니다.`);
                    }}
                    className="btn-cozy-secondary"
                    style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}
                  >
                    💖 휴식 및 재충전 완료
                  </button>
                </div>
              </div>

              {/* Lending A Paw */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🐾 도움의 손길</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  다른 길드나 이웃 동물들의 공공 프로젝트에 자원봉사하여 <strong>길드 명성 +5점</strong>을 획득합니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <textarea id="lending_note" placeholder="어떤 프로젝트를 도왔는지 묘사해 일지에 남겨주세요." style={{ width: '100%', height: '50px', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <button
                    onClick={() => {
	                      const note = (document.getElementById('lending_note') as HTMLTextAreaElement)?.value.trim();
                      if (!note) {
                        showAlert('도운 프로젝트와 함께한 길드, 맡은 일을 기록해 주세요.');
                        return;
                      }
                      const transaction = createClientTransaction('downtime:lend-a-paw');
                      const downtime = resolveDowntimeActivity('lend-a-paw', transaction.id);
                      if (!downtime) return;
	                      updateState(s => {
                        const next = applyDowntimeOutcome(s, downtime);
                        return {
	                        ...next,
                        journals: [
                          {
                            id: `${transaction.id}:project`,
                            title: `🐾 자원봉사: 도움의 손길`,
                            text: `공공 자원봉사 활동에 참여했습니다.\n- 평판 +5 획득\n- 자원봉사 기록: ${note}`,
                            timestamp: transaction.at
                          },
                          ...next.journals
                        ]
                      };
                    });
                      showAlert("🐾 자원봉사 성공! 길드 명성 평판이 5점 올랐습니다!");
                    }}
                    className="btn-cozy-secondary"
                    style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}
                  >
                    🐾 자원봉사 기록 및 평판 +5 획득
                  </button>
                </div>
              </div>

              {/* Clinic Construction Panel */}
              {state.currentLocationType === 'Wilds' && state.curedAilmentInThisWilds && (
                <div className="cute-card" style={{ background: '#ecfdf5', border: '1.5px solid #10b981' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#047857', fontSize: '1.1rem' }}>🏡 새 약제소 설립 가능!</h3>
                  <p style={{ fontSize: '0.85rem', color: '#065f46', margin: '0 0 1rem 0' }}>
                    야생 지역에서 성공적으로 질병을 완치했으므로, <strong>장신구 15개</strong>를 들여 여기에 영구적인 길드 약제소를 지을 수 있습니다!<br />
                    건설하려면 아래에서 원하는 <strong>길드 아젠다 서비스</strong>를 하나 선택해 주십시오. (완료한 계절 {state.completedSeasons}/4)
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                    <div>
                      <label style={{ fontWeight: 'bold', color: '#047857' }}>추가할 길드 아젠다 서비스 선택:</label>
                      <select
                        value={selectedAgendaService}
                        onChange={e => setSelectedAgendaService(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem', borderColor: '#10b981' }}
                      >
                        <option value="pantry">식료품 저장고 (요구 명성 15+): 겨울철 동면하여 봄으로 건너뛰기</option>
                        <option value="library">도서관 (Summit 방문 및 동료 재회 완료): 질병 진단 시 2개 드로우 선택</option>
	                        <option value="hive_boxes">벌집 보관함 (Spoolkeep 방문): 곤충 보관 및 교체</option>
                        <option value="gardens">약초 정원 (Noonhill 방문): 식물 재배 및 질병당 1회 채취</option>
                        <option value="greenhouses">온실 (정원 보유 및 Glasswall 방문): 겨울에도 정원 채취 가능</option>
                        <option value="sodden_logs">물에 젖은 통나무 (Odoak 방문): 지정 곤충 채취 및 타이머 -1</option>
                        <option value="taproom">선술집 (Vessel 방문): 계절 정산 시 약제소당 1 장신구 팁 수입</option>
                        <option value="hostel">숙소 (선술집 보유): 선술집 팁이 약제소당 2 장신구로 상승</option>
	                        <option value="mailbox">우체통 (요구사항 없음): Noonmessengers 서신 환자 진료</option>
                        <option value="goodwill_stand">친선 매대 (요구사항 없음): 아이템 기부하여 계절 정산 시 평판으로 변환</option>
                      </select>
                    </div>

	                    {/* Requirements validation indicator */}
	                    {(() => {
	                      const requirement = getClinicAgendaRequirement(selectedAgendaService);
	                      const hasTrinkets = state.trinkets.length >= 15;
	                      const hasSeasons = state.completedSeasons >= 4;
	                      const canBuildClinic = hasTrinkets && hasSeasons;

	                      return (
	                        <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
	                          <div style={{ color: requirement.satisfied ? '#047857' : '#d97706', fontWeight: 'bold' }}>
	                            📌 아젠다 서비스 요구사항: {requirement.message}
	                          </div>
	                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#4b5563' }}>
	                            <span>💰 장신구 15개 소지: {hasTrinkets ? '✅' : '❌ (장신구 부족)'}</span>
	                            <span>📅 완료한 계절 4회: {hasSeasons ? '✅' : `❌ (현재 ${state.completedSeasons}회)`}</span>
	                          </div>

	                          <button
	                            onClick={() => handleBuildClinic(selectedAgendaService)}
	                            disabled={!canBuildClinic || !requirement.satisfied}
	                            style={{
	                              marginTop: '0.6rem',
	                              padding: '0.6rem 1.2rem',
	                              background: canBuildClinic ? '#059669' : '#a7f3d0',
	                              color: '#fff',
	                              border: 'none',
	                              borderRadius: '8px',
	                              fontWeight: 'bold',
	                              cursor: canBuildClinic && requirement.satisfied ? 'pointer' : 'not-allowed'
	                            }}
	                          >
	                            🏡 약제소 설립 및 아젠다 지정 (장신구 15개 소모)
	                          </button>
	                        </div>
	                      );
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 2. Shop & Upgrades tab */}
          {downtimeTab === 'shop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              <div className="cute-card" style={{ background: '#fffdf8', border: '1.5px solid var(--border-cozy)', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🛎️ 길드 서비스 (p.58-61)</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.8rem 0', lineHeight: 1.45 }}>
                  정착지/도시를 떠나기 전 고용하는 지역 서비스입니다. 적용한 서비스는 가방, 지도, 이동 보정, 일지 중 해당 위치에 바로 기록됩니다.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {(state.guildServiceTravelRerolls || 0) > 0 && <span>🗞️ 이동 조우 선택권 {state.guildServiceTravelRerolls}회</span>}
                  {(state.forecastMoves || 0) > 0 && <span>🌦️ 예보 보호 {state.forecastMoves}회 이동</span>}
                  {state.taxiSoarActive && <span>🦅 다음 활공 택시 활성</span>}
                  {(state.missiveSettlements || []).length > 0 && <span>✉️ 서신: {(state.missiveSettlements || []).join(', ')}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: '0.75rem' }}>
                  {GUILD_SERVICES_DB.map(service => {
                    const isAvailable = isGuildServiceAvailableAtLocation(service, state, bypassShopRules);
                    const isUsed = service.id === 'rug_wonders' && !!state.griphUsedThisJourney;
                    const disabled = !isAvailable || isUsed || state.trinkets.length < service.cost;
                    return (
                      <div key={service.id} style={{ border: '1px solid #e5dec9', borderRadius: '8px', padding: '0.75rem', background: isAvailable ? '#fff' : '#f9f6f0', opacity: isAvailable ? 1 : 0.62 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.84rem', color: 'var(--primary)' }}>
                          <span>{service.name}</span>
                          <span style={{ color: 'var(--secondary)', whiteSpace: 'nowrap' }}>🪙 {service.cost}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{service.places}</div>
                        <p style={{ fontSize: '0.74rem', color: '#666', margin: '0.35rem 0 0.55rem 0', lineHeight: 1.35, minHeight: '40px' }}>{service.desc}</p>
                        <button
                          type="button"
                          onClick={() => handleHireGuildService(service)}
                          className="btn-cozy-secondary"
                          style={{ width: '100%', padding: '0.35rem', fontSize: '0.76rem' }}
                          disabled={disabled}
                        >
                          {isUsed ? '여정 중 이미 이용' : !isAvailable ? '현재 위치 불가' : state.trinkets.length < service.cost ? '장신구 부족' : '고용/이용'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>🛒 저잣거리 도구 상점</h3>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bypassShopRules}
                      onChange={e => setBypassShopRules(e.target.checked)}
                    />
                    ⚙️ 모든 지역 잠금 해제 (상점 규칙 우회)
                  </label>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  보유 장신구: <strong style={{ color: 'var(--primary)' }}>{state.trinkets.length}개</strong>
                </p>

                {/* Tools market list */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.8rem' }}>
                  {TOOLS_DB.map(tool => {
                    const hasTool = tool.id !== 'tool_basic_replacement' && state.bag.some(item => item.name.includes(tool.name.split(' (')[0]));
                    const isAvailable = isToolAvailableAtLocation(tool, state, bypassShopRules);

                    return (
                      <div key={tool.id} style={{ border: '1px solid #e5dec9', borderRadius: '8px', padding: '0.8rem', background: isAvailable ? '#fff' : '#f9f6f0', opacity: isAvailable ? 1 : 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>
                          <span>{tool.name}</span>
                          <span style={{ color: 'var(--secondary)' }}>🪙 {tool.cost}개</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          무게: {formatWeight(tool.weight)} | 판매지: {localizeAvailabilityLabel(tool.places)}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.4rem 0 0.6rem 0', minHeight: '34px', lineHeight: 1.4 }}>
                          {tool.desc}
                        </p>
                        <button
                          onClick={() => handleBuyTool(tool)}
                          className="btn-cozy-primary"
                          style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem' }}
                          disabled={hasTool || !isAvailable || state.trinkets.length < tool.cost}
                        >
                          {hasTool ? '이미 소유 중' : !isAvailable ? '구입 지역 아님' : `🪙 ${tool.cost}개 지불하고 구매`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Smithing / Upgrade basic tool */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🛠️ 철공소 도구 업그레이드</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  산맥 정착지나 모든 도시에서 <strong>장신구 3개</strong>를 지불하고 기본 도구를 업그레이드합니다.
                </p>

                {state.currentLocationType !== 'City' && !(state.currentLocationType === 'Settlement' && state.currentRegion === 'Mountain') && !bypassShopRules ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                    ⚠️ 현재 위치가 도시나 산맥 구역이 아니어서 대장간 이용이 불가능합니다.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>개조할 가방 안의 기본 도구:</label>
                        <select
                          value={selectedToolToUpgrade}
                          onChange={e => setSelectedToolToUpgrade(e.target.value)}
                          style={{ width: '100%', padding: '0.4rem' }}
                        >
                          <option value="">-- 도구를 고르세요 --</option>
                          {state.bag.filter(i => i.type === 'tool' && !i.name.includes("업그레이드")).map((item, idx) => (
                            <option key={idx} value={item.id}>{localizeInventoryItemName(item.name)}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>업그레이드 옵션 선택:</label>
                        <select
                          value={selectedUpgradeOption}
                          onChange={e => setSelectedUpgradeOption(e.target.value)}
                          style={{ width: '100%', padding: '0.4rem' }}
                        >
                          <option value="">-- 업그레이드 옵션을 고르세요 --</option>
                          <option value="은빛 낫 (Silver Sickle)">은빛 낫 (Silver Sickle - 칼 업그레이드, 무게 2/3, 채집 점수 +1)</option>
                          <option value="강철 도끼 (Steel Axe)">강철 도끼 (Steel Axe - 칼 업그레이드, 무게 1, 질병 진단 시 채집 포인트 +3)</option>
                          <option value="페어링 칼 (Pairing Knife)">페어링 칼 (Pairing Knife - 칼 업그레이드, 무게 0)</option>
                          <option value="강철 보강 절구 (Steel-Lined Mortar)">강철 보강 절구 (Steel-Lined Mortar - 절구 업그레이드, 무게 1/3, 첫 빻기 채집 시 타이머 +1)</option>
                          <option value="화강암 절구와 공이 (Granite Mortar)">화강암 절구와 공이 (Granite Mortar - 절구 업그레이드, 무게 1, 식물 가루 제조)</option>
                          <option value="이중 가마솥 (Double Boiler)">이중 가마솥 (Double Boiler - 주전자 업그레이드, 무게 1, 이중 끓임으로 효능 +1)</option>
                          <option value="구리 주전자 (Efficient Copper Kettle)">구리 주전자 (Efficient Copper Kettle - 주전자 업그레이드, 무게 2/3, 끓임 채집 시 타이머 +1)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleUpgradeTool}
                      className="btn-cozy-secondary"
                      style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }}
                      disabled={state.trinkets.length < 3 || !selectedToolToUpgrade || !selectedUpgradeOption}
                    >
                      🛠️ 3 장신구 지불하고 도구 개조
                    </button>
                  </div>
                )}
              </div>

              {/* Commission / Upgrade Wagon (City Only) */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🚚 마차 개조 및 확장</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  <strong>모든 도시</strong>에서 마차 기본 유닛을 주문(장신구 15개)하거나 기존 마차를 업그레이드(장신구 소모)합니다.
                </p>

                {state.currentLocationType !== 'City' && !bypassShopRules ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                    ⚠️ 마차 개조 서비스는 도시의 Craftpaws 조각소에서만 가능합니다.
                  </div>
                ) : (
                  <div>
                    {!(state.wagonState?.commissioned || state.wagonExpansions?.baseUnit) ? (
                      <div>
                        <button
                          onClick={() => handleBuyWagonUpgrade({ id: 'baseUnit', name: '기본 마차 위탁 (Commission Wagon)', cost: 20 })}
                          className="btn-cozy-secondary"
                          style={{ padding: '0.6rem 1.2rem' }}
                          disabled={state.trinkets.length < 20 || !state.downtimeRequired || state.downtimeCompleted}
                        >
                          🚚 기본 마차 위탁하기 (장신구 20개 소모 | 소지 한도 +4, 속도 +1)
                        </button>
                        {(state.trinkets.length < 20 || !state.downtimeRequired || state.downtimeCompleted) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.4rem', fontWeight: 'bold' }}>
                            위탁 불가: 여정 뒤 사용하지 않은 휴식기 1회와 장신구 20개가 필요합니다. (보유: {state.trinkets.length}개)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.8rem', marginTop: '0.5rem' }}>
                        {WAGON_UPGRADES_DB.filter(u => u.id !== 'baseUnit').map(upgrade => {
                          const expansionId = ({ sealedCarriage: 'sealed-carriage', pedalMotor: 'pedal-motor', axelSprings: 'axel-springs', sideBrackets: 'side-brackets', hiveBrackets: 'hive-brackets', passengerBooth: 'passenger-booth', shadowCanvas: 'shadow-canvas', experimentalContraption: 'experimental-contraption', clayPots: 'clay-pots' } as Record<string, string>)[upgrade.id];
                          const hasUpgrade = state.wagonState?.expansionIds.includes(expansionId) || (state.wagonExpansions as any)?.[upgrade.id];
                          const isWagonCity = (bypassShopRules && state.rulesetId !== 'original-1e-3p') ||
                            upgrade.city === 'Any City' ||
                            (upgrade.city === 'Newdam' && state.currentLocationName === 'Newdam') ||
                            (upgrade.city === 'Vessel' && state.currentLocationName === 'Vessel') ||
                            (upgrade.city === 'Odoak' && state.currentLocationName === 'Odoak') ||
                            (upgrade.city === 'Summit' && state.currentLocationName === 'Summit') ||
                            (upgrade.city === 'Spoolkeep' && state.currentLocationName === 'Spoolkeep') ||
                            (upgrade.city === 'Noonhill' && state.currentLocationName === 'Noonhill') ||
                            (upgrade.city === 'Glasswall' && state.currentLocationName === 'Glasswall');

                          let finalCost = upgrade.cost;
                          if (upgrade.id === 'sealedCarriage' && state.bag.some(item => item.name.includes('Coracle') || item.name.includes('보트'))) {
                            finalCost = 5;
                          }

                          return (
                            <div key={upgrade.id} style={{ border: '1px solid #d8d0b5', borderRadius: '8px', padding: '0.8rem', background: '#fff', opacity: isWagonCity ? 1 : 0.6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                <span>{upgrade.name}</span>
                                <span style={{ color: 'var(--secondary)' }}>🪙 {finalCost}개</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                                개조 위치: {localizeAvailabilityLabel(upgrade.city)}
                              </div>
                              <p style={{ fontSize: '0.7rem', color: '#666', margin: '0.3rem 0 0.5rem 0', lineHeight: 1.3 }}>
                                {upgrade.desc}
                              </p>
                              <button
                                onClick={() => handleBuyWagonUpgrade(upgrade)}
                                className="btn-cozy-primary"
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem' }}
                                disabled={hasUpgrade || !isWagonCity || state.trinkets.length < finalCost || !state.downtimeRequired || state.downtimeCompleted}
                              >
                                {hasUpgrade ? '개조 완료됨' : !state.downtimeRequired || state.downtimeCompleted ? '다음 휴식기에 가능' : !isWagonCity ? '이 도시에서 불가' : `🪙 ${finalCost}개에 개조하기`}
                              </button>
                              {!hasUpgrade && !isWagonCity && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', marginTop: '0.3rem', fontWeight: 'bold' }}>
                                  ⚠️ 개조 불가: {upgrade.city} 도시 내의 조각소에서만 가능합니다.
                                </div>
                              )}
                              {!hasUpgrade && isWagonCity && state.trinkets.length < finalCost && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', marginTop: '0.3rem', fontWeight: 'bold' }}>
                                  ⚠️ 개조 불가: 장신구 부족 (필요: {finalCost}개, 보유: {state.trinkets.length}개)
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 3. Companions tab */}
          {downtimeTab === 'companions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {/* Active companions list */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.8rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🐝 현재 동반 중인 곤충 동료</h3>

                {(!state.companionStates || state.companionStates.length === 0) ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    동반 중인 곤충 친구가 없습니다. 아래 상점에서 친구를 영입해 보세요!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {state.companionStates.map(comp => (
                      <div key={comp.instanceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfaf6', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #eee' }}>
                        <div>
                          <strong style={{ color: 'var(--primary)' }}>{COMPANIONS_DB.find(row => canonicalCompanionId(row.id) === canonicalCompanionId(comp.companionId))?.name || comp.companionId}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>이동 경로 {comp.pathsTravelled}/10개</span>
                        </div>
                        <button onClick={() => handleReleaseCompanion(comp.instanceId)} className="btn-cozy-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                          야생으로 보내기
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adopt list */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>🏪 곤충 시장</h3>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bypassShopRules}
                      onChange={e => setBypassShopRules(e.target.checked)}
                    />
                    ⚙️ 모든 도시 영입 허용 (우회)
                  </label>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  보유 장신구: <strong style={{ color: 'var(--primary)' }}>{state.trinkets.length}개</strong> | 동행 수 제한: {resolveWagonCapabilities(canonicalWagonFromState(state)).companionSlots}마리
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.8rem' }}>
                  {COMPANIONS_DB.map(comp => {
                    const isCompanionAvailable = bypassShopRules ||
                      state.currentLocationType === 'City' && comp.region.split(', ').some(r => r === state.currentRegion);

                    return (
                      <div key={comp.id} style={{ border: '1px solid #e5dec9', borderRadius: '8px', padding: '0.8rem', background: '#fff', opacity: isCompanionAvailable ? 1 : 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)' }}>
                          <span>{comp.name}</span>
                          <span style={{ color: 'var(--secondary)' }}>🪙 {comp.cost}개</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                          영입 가능 도시 지역: {localizeRegionList(comp.region)}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#666', margin: '0.3rem 0 0.5rem 0', lineHeight: 1.3, minHeight: '26px' }}>
                          {comp.desc}
                        </p>
                        <button
                          onClick={() => handleAdoptCompanion(comp)}
                          className="btn-cozy-primary"
                          style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem' }}
                          disabled={!isCompanionAvailable || state.trinkets.length < comp.cost}
                        >
                          {!isCompanionAvailable ? '지역 제한으로 영입 불가' : `🪙 ${comp.cost}개 지불하고 영입`}
                        </button>
                        {!isCompanionAvailable && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', marginTop: '0.3rem', fontWeight: 'bold' }}>
                            ⚠️ 영입 불가: {localizeRegionList(comp.region)} 도시에서만 영입 가능합니다. (현재: {localizeRegionLabel(state.currentRegion)} {state.currentLocationType === 'City' ? '도시' : '일반 지형'})
                          </div>
                        )}
                        {isCompanionAvailable && state.trinkets.length < comp.cost && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', marginTop: '0.3rem', fontWeight: 'bold' }}>
                            ⚠️ 영입 불가: 장신구 부족 (필요: {comp.cost}개, 보유: {state.trinkets.length}개)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* 4. Start journey form */}
          {downtimeTab === 'start' && (
            <div id="journey-start-panel" className="cute-card" style={{ background: '#fffefa', border: '1.5px solid var(--secondary)', borderRadius: '7px', padding: '1.5rem' }}>
              <h2 style={{ color: 'var(--secondary)', margin: '0 0 0.4rem 0', fontFamily: 'var(--font-fancy)' }}>새로운 여정 떠나기</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1.2rem 0' }}>
                목적지·목표 카드를 뽑은 뒤, 옆 지도를 보며 후보를 골라 목적지 총 경로를 확인하세요.
              </p>
              <div style={{ padding: '0.8rem', borderRadius: '8px', border: '1px dashed var(--glass-border)', background: '#fffcf2', fontSize: '0.84rem', color: 'var(--text)', display: 'grid', gap: '0.35rem' }}>
                <div><strong>여행 거리 형태:</strong> {journeyDestinationCard ? journeyDistanceBandText : '목적지 카드를 먼저 뽑으세요.'}</div>
                <div><strong>지도에서 선택한 총 거리:</strong> {selectedJourneyDestination ? `${selectedJourneyDestination.paths}경로` : '선택된 후보가 없습니다'}</div>
                <div><strong>현재 일일 이동력:</strong> {getTravelSpeed(state, currentWeight)}경로</div>
              </div>

              <form onSubmit={handleStartJourney} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>여정을 떠나는 이유</label>
                  <IsolatedTextarea
                    rows={2}
                    placeholder="왜 지금 이 길을 떠나는지 기록하세요."
                    valueRef={journeyReasonRef}
                    style={{ padding: '0.55rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gap: '0.75rem', padding: '0.85rem', background: '#fffdf8', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    룰북 p.19-25 순서: 목적지/거리 카드와 목표 카드를 뽑고, 지도를 보며 후보를 골라 이동합니다.
                  </div>
                  <CardDrawSlot
                    label="목적지와 방향 카드 (p.19)"
                    helper="값은 검은 선으로 이어진 점 개수(A–6 ≤12, 7–9 13–24, 10/J/M 24+), 문양은 대략적인 방향입니다. 이름 없는 점도 후보가 됩니다."
                    card={journeyDestinationCard}
                    onCard={(card: PlayingCard) => { setJourneyDestinationCard(card); setDestName(''); }}
                  />
                  <CardDrawSlot
                    label="여정 목표 카드 (p.20-21)"
                    helper="값으로 목표 표를 찾습니다. Q/K는 Monarch(M) 목표로 처리합니다."
                    card={journeyGoalCard}
                    onCard={setJourneyGoalCard}
                  />
                  {journeyGoalCard && (
                    <div style={{ padding: '0.75rem', borderRadius: '7px', border: '1px dashed var(--glass-border)', background: '#fffdfa', color: 'var(--text)' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        현재 카드: {journeyGoalCard.suit} {cardDisplayValue(journeyGoalCard.value)} · 규칙 표기: {cardRuleValue(journeyGoalCard)}
                      </div>
                      {journeyGoalPreview ? (
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{journeyGoalPreview.title}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{localizeJourneyGoalText(journeyGoalPreview.requiredState)}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'var(--accent-red)' }}>이 카드 값에 해당하는 목표 표를 찾을 수 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  style={{ padding: '0.8rem', background: 'var(--secondary)', color: '#fff', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
                >
                  여정 기록 확정 및 출발
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* 2. Active Journey Record */}
      {state.journeyActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Active stats panel */}
          <div id="active-journey-panel" className="cute-card journey-record" style={{ background: '#fffefa', borderColor: 'var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem' }}>
              <div className="prose-summary" style={{ fontSize: '0.95rem' }}>
                <strong>{state.journeyDestination}</strong>을 향해 {state.journeyDirection} 방향으로 이동 중 (거리 형태: {state.journeyDistance}, 총거리 <span style={{ fontWeight: 700 }}>{state.journeyTotalDistance || 0}경로</span>).
                <br />
                출발한 지 <strong>{state.calendarDays}일째</strong>, 남은 시간은 <strong>{Math.max(0, state.calendarMaxDays - state.calendarDays)}일</strong>.
              </div>
              <button
                type="button"
                onClick={handleEndJourney}
                style={{ padding: '0.4rem 0.8rem', background: 'var(--secondary)', color: '#fff', borderRadius: '20px', fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                여정 마감
              </button>
            </div>
            <div style={{ marginTop: '0.8rem', background: '#ffffff', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              목표: <strong style={{ color: 'var(--primary)' }}>{state.journeyGoalTitle}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}> — {localizeJourneyGoalText(state.journeyGoalDesc)}</span>
              <div style={{ marginTop: '0.3rem', fontSize: '0.84rem', fontWeight: 'bold', color: checkJourneyGoalSatisfaction(state) ? '#16a34a' : '#ea580c' }}>
                {checkJourneyGoalSatisfaction(state) ? '✅ 조건 충족됨' : '⚠️ 미달성'} · {localizeJourneyGoalText(state.journeyGoalProgress)}
              </div>
            </div>

            {/* Canonical Journey Goal evidence */}
            {state.journey && (() => {
              const evaluation = getJourneyGoalEvaluation(state)!;
              return (
                <details style={{ marginTop: '0.8rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.4rem 0' }}>목표 판정 근거</summary>
                  <div style={{ display: 'grid', gap: '0.35rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    {evaluation.evidence.map(row => (
                      <div key={row.id} style={{ fontSize: '0.82rem', color: row.satisfied ? '#166534' : '#9a3412' }}>
                        <strong>{row.satisfied ? '충족' : '미충족'}</strong> · {localizeJourneyGoalText(row.label)}{!row.automatic ? ' · 플레이어 확인 필요' : ''}
                      </div>
                    ))}
                  </div>
                </details>
              );
            })()}

            {state.rulesetId === 'legacy-campaign' && !state.journey && (<details style={{ marginTop: '0.8rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.4rem 0' }}>▸ 목표 세부 사항 및 수동 조절</summary>
              <div style={{ marginTop: '0.4rem', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>
                  <strong>현재 상태: </strong>
                  {isJourneyGoal(state.journeyGoalTitle, '자아 성찰') && `만난 야수 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {isJourneyGoal(state.journeyGoalTitle, '동반자 우대', '관계 회복') && `길동무/동반자 저널 기록 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {isJourneyGoal(state.journeyGoalTitle, '길드의 책임') && `시작 평판: ${state.journeyStartReputation || 5} → 현재 평판: ${state.reputation} (시작 대비 +5 이상 증가 필요)`}
                  {isJourneyGoal(state.journeyGoalTitle, '자연 조사', '자연 환경 조사') && `조사한 지역 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {isJourneyGoal(state.journeyGoalTitle, '긴급 치료') && (
                    state.bag.some(item => {
                      if (item.type !== 'reagent' || !item.name) return false;
                      const match = /\[(WOUND|INFECTION|SLEEP)\s+(\d+)\]/i.exec(item.name);
                      return match !== null && parseInt(match[2]) >= 3;
                    }) ? '가방에 WOUND/INFECTION/SLEEP이 3 이상인 약재 보유 중! (충족)' : '가방에 WOUND/INFECTION/SLEEP이 3 이상인 약재 없음 (미충족)'
                  )}
                  {isJourneyGoal(state.journeyGoalTitle, '영감 수집', '신선한 영감') && `식물 약재를 채집한 지역 수: ${new Set(state.journeyGoalChecklist || []).size} / 6 (${Array.from(new Set(state.journeyGoalChecklist || [])).join(', ') || '없음'})`}
                  {isJourneyGoal(state.journeyGoalTitle, '의학 연구 자료') && `치료한 야수 질병 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {isJourneyGoal(state.journeyGoalTitle, '호송 및 정의') && (
                    state.bag.some(item => item.name.includes("Evidence") || item.name.includes("수송 증거물")) ? '가방에 수송 증거물(Evidence) 보유 중! (충족)' : '가방에 수송 증거물(Evidence) 분실함! (미충족)'
                  )}
                  {isJourneyGoal(state.journeyGoalTitle, '영약 보충') && '가방 내의 어떤 태그 약재든 3개 이상 모아야 합니다.'}
                  {isJourneyGoal(state.journeyGoalTitle, '마음의 정리') && `해결한 질병/일지 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {isJourneyGoal(state.journeyGoalTitle, '마지막 작별') && (
                    state.bag.some(item => {
                      if (item.type !== 'reagent' || !item.name) return false;
                      const match = /\[ELSEWHERE\s+(\d+)\]/i.exec(item.name);
                      return match !== null && parseInt(match[2]) >= 2;
                    }) ? '가방에 ELSEWHERE가 2 이상인 약재 보유 중! (충족)' : '가방에 ELSEWHERE가 2 이상인 약재 없음 (미충족)'
                  )}
                  {isJourneyGoal(state.journeyGoalTitle, '방랑벽') && `방문한 독특한 지역 종류 수: ${new Set(state.journeyGoalChecklist || []).size} / 5 (${Array.from(new Set(state.journeyGoalChecklist || [])).join(', ') || '없음'})`}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>진행도 수동 제어:</span>
                  <button
                    type="button"
                    onClick={() => updateState((s: GameState) => ({ ...s, journeyGoalCounter: Math.max(0, (s.journeyGoalCounter || 0) - 1) }))}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ➖
                  </button>
                  <span style={{ fontWeight: 'bold', minWidth: '1.2rem', textAlign: 'center' }}>
                    {state.journeyGoalCounter || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateState((s: GameState) => ({ ...s, journeyGoalCounter: (s.journeyGoalCounter || 0) + 1 }))}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: 'var(--primary)' }}
                  >
                    ➕
                  </button>
                </div>

                {(isJourneyGoal(state.journeyGoalTitle, '영감 수집', '신선한 영감') || isJourneyGoal(state.journeyGoalTitle, '방랑벽')) && (
                  <div style={{ marginTop: '0.3rem', padding: '0.4rem', background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.2rem' }}>체크리스트 지역 관리:</div>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      {(state.journeyGoalChecklist || []).map((region, idx) => (
                        <span key={idx} style={{ padding: '0.1rem 0.4rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {region}
                          <button
                            type="button"
                            onClick={() => {
                              updateState((s: GameState) => {
                                const list = [...(s.journeyGoalChecklist || [])];
                                list.splice(idx, 1);
                                return { ...s, journeyGoalChecklist: list };
                              });
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, fontWeight: 'bold', fontSize: '0.75rem' }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <select
                        id="goal-region-add-select"
                        style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                      >
                        <option value="">--지역 선택--</option>
                        {['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Wilds'].map(r => (
                          <option key={r} value={r}>{localizeRegionLabel(r)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const sel = document.getElementById('goal-region-add-select') as HTMLSelectElement;
                          if (sel && sel.value) {
                            updateState((s: GameState) => {
                              const list = [...(s.journeyGoalChecklist || [])];
                              if (!list.includes(sel.value)) {
                                list.push(sel.value);
                              }
                              return { ...s, journeyGoalChecklist: list };
                            });
                            sel.value = "";
                          }
                        }}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        추가
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </details>)}

            {/* Tangible Effects — collapsible */}
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#8b5e1a', padding: '0.4rem 0' }}>▸ 영구적 결과 적용 (p.39)</summary>
              <div style={{ marginTop: '0.3rem', padding: '0.7rem', background: '#fff8ee', borderRadius: '8px', border: '1px dashed #d4a853', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => { if(askWindowConfirm('이동 속도 +1 영구 적용?')) updateState((s: GameState) => ({ ...s, bio: { ...s.bio, speed: s.bio.speed + 1 } })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer' }}>
                  🦶 속도 +1
                </button>
                <button onClick={() => { if(askWindowConfirm('가방 소지 한도 +1 영구 적용?')) updateState((s: GameState) => ({ ...s, bio: { ...s.bio, carry: s.bio.carry + 1 } })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer' }}>
                  🎒 용량 +1
                </button>
                <button onClick={() => { if(askWindowConfirm('길드 평판 +5?')) updateState((s: GameState) => ({ ...s, reputation: s.reputation + 5 })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer' }}>
                  ⭐ 평판 +5
                </button>
                <button onClick={() => { if(askWindowConfirm('길드 평판 -5?')) updateState((s: GameState) => ({ ...s, reputation: Math.max(0, s.reputation - 5) })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>
                  📉 평판 -5
                </button>
                <button onClick={() => {
                  handleAddMappedSettlement();
                }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer' }}>
                  🏘️ 정착지 추가
                </button>
                <button onClick={handleRetireClick}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#fdf4ff', border: '1px solid #d8b4fe', borderRadius: '6px', cursor: 'pointer' }}>
                  🌅 캐릭터 은퇴
                </button>
              </div>
            </details>
          </div>

          {/* Current location and movement form */}
          <div id="travel-panel" className="cute-card">
            <div className="prose-summary" style={{ marginBottom: '0.8rem' }}>
              📍 <strong>{localizeRegionLabel(state.currentRegion)}</strong> 지역 {state.currentLocationType === 'City' ? '도시' : state.currentLocationType === 'Settlement' ? '정착지' : state.currentLocationType === 'Wilds' ? '야생' : state.currentLocationType === 'Ruin' ? '유적지' : state.currentLocationType === 'Barrow' ? '야수 고분' : state.currentLocationType} <strong>{state.currentLocationName}</strong>에 머무는 중.
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <span>계절:
                <select
                  value={localSeason}
                  onChange={e => setLocalSeason(e.target.value as any)}
                  disabled={state.rulesetId === 'original-1e-3p'}
                  style={{ height: '30px', padding: '0 0.5rem', fontSize: '0.85rem', marginLeft: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="Spring">🌸 봄</option>
                  <option value="Summer">☀️ 여름</option>
                  <option value="Autumn">🍂 가을</option>
                  <option value="Winter">❄️ 겨울</option>
                </select>
              </span>
              <button
                type="button"
                onClick={handleAdvanceSeason}
                disabled={!state.downtimeCompleted || state.journeyActive}
                className="btn-cozy-secondary"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', marginLeft: '10px' }}
              >
                {state.downtimeCompleted ? '계절 정산 및 전환' : '다운타임 완료 후 계절 전환'}
              </button>
            </div>

            {/* Travel Form */}
            {state.needsLocalHelpBeforeMove && (
              <div style={{ borderTop: '1px dashed var(--glass-border)', padding: '0.8rem', background: '#fffdf8', borderRadius: '8px', border: '1px solid var(--border-cozy)', color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.45 }}>
                <strong style={{ color: 'var(--primary)' }}>현지 기록 미결 (p.25 Earning Your Keep)</strong><br />
                이곳에서 환자를 돌보거나 고분 문제를 마무리해야 다음 위치로 이동할 수 있습니다.
              </div>
            )}
            {canonicalWagonFromState(state).expansionIds.includes('clay-pots') && canonicalWagonFromState(state).clayPotReagentId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderTop: '1px dashed var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                <span>
                  Clay Pots · {REAGENT_BY_ID.get(canonicalWagonFromState(state).clayPotReagentId!)?.displayName || '제철 식물'} · 재성장 {canonicalWagonFromState(state).clayPotMoves}/2회 이동
                </span>
                <button
                  type="button"
                  className="btn-cozy-secondary"
                  disabled={canonicalWagonFromState(state).clayPotMoves < 2}
                  onClick={handleHarvestClayPots}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                >
                  부위 수확
                </button>
              </div>
            )}
            <form id="travel-move-form" ref={travelFormRef} onSubmit={handleTravelMove} className="grid-travel-form" style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
              <input
                name="locName"
                type="text"
                list="map-destination-options"
                placeholder="이동해 도달할 새 장소 이름..."
                value={nextLocName}
                onChange={e => setNextLocName(e.target.value)}
              />
              <datalist id="map-destination-options">
                {Object.entries(buildMapGraphNodes(state.customMapLocations || [], state.customMapEdges || [])).map(([key, node]) => (
                  <option key={key} value={node.label}>{node.region ? `${localizeRegionLabel(node.region)} · ` : ''}{locationTypeLabel(node.kind || 'named')}</option>
                ))}
              </datalist>

              <select value={destRegion} onChange={e => setDestRegion(e.target.value)}>
                <option value="Forest">🌿 숲</option>
                <option value="Meadow">🌾 초원</option>
                <option value="Loch">💧 호수/강</option>
                <option value="Bog">🪵 수렁</option>
                <option value="Mountain">🏔️ 산맥</option>
                <option value="Titan">⚙️ Titan 유적</option>
                <option value="Soar">🦅 활공</option>
              </select>

              <select value={destType} onChange={e => setDestType(e.target.value)}>
                <option value="Wilds">야생 구역</option>
                <option value="Settlement">정착지</option>
                <option value="City">대도시</option>
                <option value="Ruin">유적지</option>
                <option value="Barrow">거수 고분</option>
              </select>

              <button type="submit" disabled={state.needsLocalHelpBeforeMove} style={{ background: state.needsLocalHelpBeforeMove ? '#d8d1c4' : 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: state.needsLocalHelpBeforeMove ? 'not-allowed' : 'pointer' }}>
                {state.needsLocalHelpBeforeMove ? '현지 일을 마친 뒤 이동 가능' : '🚶‍♂️ 경로 이동 및 카드 조우'}
              </button>

              <div style={{ gridColumn: 'span 4', display: 'grid', gap: '0.75rem', fontSize: '0.85rem', background: '#faf8f5', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginTop: '0.4rem' }}>
                <CardDrawSlot
                  label="이동 조우 카드 (p.25)"
                  helper="빈 칸을 문양/숫자로 채우거나 랜덤으로 뽑습니다. 이동 버튼을 누를 때 비어 있으면 자동 랜덤 드로우됩니다."
                  card={travelDrawCard}
                  onCard={(card) => {
                    setTravelDrawCard(card);
                    setSelectedTravelSuit(card.suit);
                    setSelectedTravelValue(card.value);
                    setTravelCardMode('manual');
                  }}
                />
              </div>
            </form>
          </div>

          {/* ================================================================
              BEHEMOTH CHASE HUD
             ================================================================ */}
          {state.pursuedByBehemoth && (
            <div className="cute-card" style={{ background: '#fff2f2', border: '2.5px solid #d94141', borderRadius: '12px', padding: '1.2rem' }}>
              <h3 style={{ color: '#d94141', margin: '0 0 0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🐾 거수 추격 중!</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#888', marginLeft: 'auto' }}>선행 거리: <strong style={{ fontSize: '1.3rem', color: '#d94141' }}>{state.pursuedByBehemoth.headStart}</strong> 경로</span>
              </h3>
              <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', lineHeight: 1.6, color: '#555' }}>
                거대 야수가 뒤를 쫓고 있습니다! 이동할 때마다 <strong>최소 3경로</strong>를 이동해야 합니다.
                3경로 미만으로 이동하면 야수가 따라잡습니다.
                도시에 도달하거나 여정을 종료하면 추격이 끝납니다.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {/* Crossbow escape */}
                {state.bag.some(i => i.name.includes('석궁') || i.id === 'tool_crossbow') &&
                 state.bag.some(i => i.name.includes('볼트') || i.id === 'tool_bolts') && (
                  <button
                    onClick={() => {
                      const transaction = createClientTransaction('tool:crossbow:pursuit');
                      const result = resolveCrossbowProtection({
                        transactionId: transaction.id,
                        state: {
                          trinkets: state.trinkets.length,
                          inventory: toEngineInventory(state.bag),
                          tools: canonicalToolsFromState(state),
                          appliedTransactionIds: state.appliedTransactionIds,
                          journalEvents: []
                        },
                        encounterTags: ['Behemoth']
                      });
                      if (!result.value) return showAlert(result.messages.join('\n'));
                      updateState((s: GameState) => ({
                        ...s,
                        pursuedByBehemoth: null,
                        bag: fromEngineInventory(result.value!.inventory, s.bag),
                        toolStates: result.value!.tools,
                        appliedTransactionIds: result.value!.appliedTransactionIds,
                        journals: appendEngineJournals(s.journals, result.value!.journalEvents)
                      }));
                      showAlert('석궁으로 탈출했습니다. Bolts 하나가 정식 트랜잭션으로 소비되었습니다.');
                    }}
                    style={{ padding: '0.6rem 1.2rem', background: '#d94141', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                  >
                    🏹 석궁으로 도망치기 (볼트 소비)
                  </button>
                )}
                {/* Cranky Contraption escape */}
                {(state.companionStates || []).some(companion => companion.companionId === 'cranky-contraption') && (
                  <button
                    onClick={() => {
                      const transaction = createClientTransaction('companion:cranky-contraption');
                      const result = resolveCompanionTrigger({ transactionId: transaction.id, state: toMobilityRuntime(state), trigger: 'behemoth' });
                      if (!result.value) return showAlert(result.messages.join('\n'));
                      updateState((s: GameState) => applyMobilityRuntime(s, result.value!));
                      showAlert('⚙️ 기계 장치로 탈출 성공! 추격이 끝났습니다.');
                    }}
                    style={{ padding: '0.6rem 1.2rem', background: '#7c5cbf', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                  >
                    ⚙️ 기계 장치로 도망치기
                  </button>
                )}
                <button
                  onClick={() => {
                    if (askWindowConfirm('탈출 도구 없이 버텼다면 주의하세요. 현재 추격 상태를 기록하고 계속 이동합니까?')) {
                      // Just leave the HUD in place; travel will update head start via handleTravelMove
                    }
                  }}
                  style={{ padding: '0.6rem 1rem', background: '#eee', color: '#555', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  🚶 계속 이동 (이동 후 선행 거리 자동 갱신)
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              BARROW DELVE TRIGGER (when at a Barrow location)
             ================================================================ */}
          {!state.activeDelve && currentBarrow && !state.pursuedByBehemoth && (
            <div id="barrow-panel" className="cute-card" style={{ background: '#f5ead8', border: '1.5px solid #9b7851', padding: '1.2rem' }}>
              <h3 style={{ color: '#725537', margin: '0 0 0.6rem' }}>거수의 고분 · {currentBarrow.name}</h3>
              <p style={{ margin: '0 0 0.8rem', lineHeight: 1.65, color: 'var(--text-muted)' }}>
                {localizeBehemothClass(currentBarrow.behemothClass)} 거수의 고분이다. 탐험을 시작하면 문양에 맞는 도전을 확인한 뒤, 도전 직전까지만 안전하게 물러날 수 있다.
              </p>
              <textarea
                rows={3}
                value={barrowJournalNote}
                onChange={event => setBarrowJournalNote(event.target.value)}
                placeholder="고분과 거수를 처음 마주한 장면을 기록하세요."
                style={{ width: '100%', resize: 'vertical', marginBottom: '0.7rem' }}
              />
              <button onClick={handleStartDelve} style={{ padding: '0.7rem 1rem', background: '#876442', color: '#fff', fontWeight: 'bold' }}>
                도전 카드 펼치기
              </button>
            </div>
          )}

          {state.activeDelve && (() => {
            const delve = state.activeDelve;
            const definition = BARROW_DELVE_BY_ID.get(delve.delveId)!;
            const runtime = toBarrowRuntime(state);
            const availableParts = state.bag.filter(item => item.type === 'reagent' && item.canonicalReagentId && item.preparationId);
            const escapeTools = state.bag.filter(item => item.canonicalToolId === 'crossbow' || item.canonicalToolId === 'bolts');
            const trustPatient = state.patients.find(row => row.id === state.activePatientId)
              || state.patients.find(row => row.species === '고분 공동체' && row.ailments.some(ailment => ailment.ailmentId === delve.ailmentId));
            const trustResolved = Boolean(trustPatient && trustPatient.ailments.every(ailment => ailment.status !== 'active'));
            const togglePart = (itemId: string, checked: boolean) => setBarrowSelectedItemIds(current => checked
              ? [...current.filter(id => id !== itemId), itemId]
              : current.filter(id => id !== itemId));
            const renderPartPicker = (ordered = false) => (
              <fieldset style={{ border: '1px solid #cabaa5', padding: '0.75rem', margin: 0 }}>
                <legend style={{ padding: '0 0.35rem' }}>{ordered ? '영약재 선택 순서' : '사용할 영약재'}</legend>
                {availableParts.length === 0 ? <p style={{ margin: 0, color: 'var(--text-muted)' }}>준비된 정식 영약재가 없습니다.</p> : (
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    {availableParts.map(item => {
                      const order = barrowSelectedItemIds.indexOf(item.id);
                      const preparation = REAGENT_BY_ID.get(item.canonicalReagentId!)?.preparations.find(row => row.id === item.preparationId);
                      const tagText = preparation?.tags.map(tag => `${tag.tag} ${tag.value}`).join(', ') || item.tags || '';
                      return (
                        <label key={item.id} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '0.55rem', alignItems: 'start' }}>
                          <input type="checkbox" checked={order >= 0} onChange={event => togglePart(item.id, event.target.checked)} />
                          <span><strong>{ordered && order >= 0 ? `${order + 1}. ` : ''}{localizeInventoryItemName(item.name)}</strong>{tagText ? <small style={{ display: 'block', color: 'var(--text-muted)' }}>{tagText}</small> : null}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            );
            const forageDisabled = Boolean(state.pendingForaging || activeForageEncounter);
            return (
              <div id="barrow-panel" className="cute-card" style={{ background: '#eee9dc', border: '1.5px solid #7d755e', padding: '1.25rem' }}>
                <BarrowPanel delve={delve} />
                <p style={{ lineHeight: 1.6, margin: '0.7rem 0' }}><strong>{definition.challenge}</strong> · p.{definition.sourcePage}</p>
                <textarea
                  rows={3}
                  value={barrowJournalNote}
                  onChange={event => setBarrowJournalNote(event.target.value)}
                  placeholder="이번 선택과 결과를 여행 일지에 남기세요."
                  style={{ width: '100%', resize: 'vertical', marginBottom: '0.75rem' }}
                />

                {delve.currentStep === 'ready' ? (
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button onClick={handleFleeToSafety} style={{ padding: '0.65rem 0.9rem' }}>안전하게 물러나기 · +1일, 다음 이동 속도 1</button>
                    <button onClick={handleBeginDelve} style={{ padding: '0.65rem 0.9rem', background: '#6f7552', color: '#fff', fontWeight: 'bold' }}>도전 시작</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {['uneasy-sleep', 'bellies-of-many', 'inside-job'].includes(delve.delveId) && <>
                      <p style={{ margin: 0 }}>필요 조건: <strong>{delve.requirements.join(', ')}</strong> · 타이머 {delve.timer}</p>
                      {renderPartPicker()}
                      {delve.delveId === 'uneasy-sleep' && (
                        <label>성공 후 한 경로 이동
                          <select value={barrowMoveTargetId} onChange={event => setBarrowMoveTargetId(event.target.value)} style={{ display: 'block', width: '100%', marginTop: '0.3rem' }}>
                            <option value="">목적지를 선택하세요</option>
                            {(runtime.graph[runtime.currentLocationId]?.edges || []).map(edge => <option key={edge.to} value={edge.to}>{runtime.graph[edge.to]?.name || edge.to}</option>)}
                          </select>
                        </label>
                      )}
                      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                        <button onClick={handleBarrowForage} disabled={forageDisabled}>영약재 채집 시도</button>
                        <button onClick={handleSubmitBarrowRemedy} style={{ background: '#6f7552', color: '#fff' }}>처방 제출</button>
                        {delve.delveId === 'inside-job' && <button onClick={handleWarnOthers}>주변에 경고하고 떠나기</button>}
                      </div>
                    </>}

                    {delve.delveId === 'collapsed-entrance' && <>
                      <p style={{ margin: 0 }}>누적 채집 포인트 <strong>{delve.progress}</strong> · 드로우 {delve.timer}회 · 보상 장신구 {delve.reward.trinkets}, 명성 {delve.reward.reputation}</p>
                      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                        <button onClick={handleDelveDrawCard}>발굴 카드 뽑기</button>
                        <button onClick={handleCollapsedFarewell}>작별하고 여정 계속</button>
                      </div>
                    </>}

                    {delve.delveId === 'pilfer-unnoticed' && <>
                      <p style={{ margin: 0 }}>현재 합계 <strong>{delve.progress}</strong>{delve.cards.length > 1 ? ` · ${delve.cards.slice(1).map(card => card.ruleValue).join(' + ')}` : ''}</p>
                      {escapeTools.length > 0 && <fieldset style={{ border: '1px solid #cabaa5', padding: '0.7rem' }}>
                        <legend>21 초과 시 사용할 탈출 도구</legend>
                        {escapeTools.map(item => <label key={item.id} style={{ display: 'block' }}><input type="checkbox" checked={barrowEscapeItemIds.includes(item.id)} onChange={event => setBarrowEscapeItemIds(ids => event.target.checked ? [...ids, item.id] : ids.filter(id => id !== item.id))} /> {localizeInventoryItemName(item.name)}</label>)}
                      </fieldset>}
                      {delve.progress === 21 && <label>획득할 도구
                        <select value={barrowSelectedToolId} onChange={event => setBarrowSelectedToolId(event.target.value)} style={{ display: 'block', width: '100%', marginTop: '0.3rem' }}>
                          <option value="">도구를 선택하세요</option>
                          {ALMANACK_TOOLS.map(tool => <option key={tool.id} value={tool.id}>{tool.canonicalName}</option>)}
                        </select>
                      </label>}
                      <div style={{ display: 'flex', gap: '0.55rem' }}>
                        <button onClick={handleBlackjackHit}>한 장 더 뽑기</button>
                        <button onClick={handleBlackjackStand} disabled={delve.progress < 1}>멈추고 탈출</button>
                      </div>
                    </>}

                    {delve.delveId === 'building-trust' && <>
                      <p style={{ margin: 0 }}>중간 등급 질환을 치료합니다. 성공 보상은 장신구 대신 같은 수치의 길드 명성이며, 고분은 정착지가 됩니다.</p>
                      {!delve.ailmentId ? (
                        <button onClick={handleDiagnoseBuildingTrust}>고분 주민의 질환 카드 뽑기</button>
                      ) : <p style={{ margin: 0 }}>질환: <strong>{AILMENTS.find(ailment => ailment.id === delve.ailmentId)?.displayName || delve.ailmentId}</strong>. 아래 환자 기록에서 치료를 마치세요.</p>}
                      {delve.ailmentId && <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                        <button onClick={() => handleBuildingTrustOutcome(true)} disabled={!trustResolved}>치료 성공 확정</button>
                        <button onClick={() => handleBuildingTrustOutcome(false)}>치료 실패 확정</button>
                      </div>}
                    </>}

                    {delve.delveId === 'suitable-furnishings' && <>
                      <p style={{ margin: 0 }}>타이머 {delve.timer} · 목표 희귀도 {delve.requiredRarities.length ? delve.requiredRarities.join(' → ') : '아직 뽑지 않음'}</p>
                      {!delve.requiredRarities.length ? <button onClick={handleSuitableFurnishingsDrawTargets}>희귀도 카드 5장 뽑기</button> : <>
                        {renderPartPicker(true)}
                        <div style={{ display: 'flex', gap: '0.55rem' }}><button onClick={handleBarrowForage} disabled={forageDisabled}>영약재 채집 시도</button><button onClick={handleSuitableFurnishingsComplete}>순서대로 제출</button></div>
                      </>}
                    </>}

                    {delve.delveId === 'potent-poison' && <>
                      <p style={{ margin: 0 }}>남은 타이머 <strong>{delve.timer}</strong> · 채집 시도 {delve.progress}회. 지정된 일곱 영약재만 판정에 포함된다.</p>
                      {renderPartPicker()}
                      <div style={{ display: 'flex', gap: '0.55rem' }}><button onClick={handleBarrowForage} disabled={forageDisabled || delve.timer === 0}>영약재 채집 시도</button><button onClick={handlePotentPoisonComplete} disabled={delve.timer !== 0}>최종 카드 판정</button></div>
                    </>}

                    <button onClick={handleAbortDelve} style={{ justifySelf: 'start', color: 'var(--text-muted)' }}>현재 도전은 무료 취소할 수 없음</button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. Ailment Patient Care Section */}
          <div id="patient-clinic-panel" className="cute-card" style={{ border: '1.5px solid var(--accent-purple)' }}>

            <h3 style={{ color: 'var(--accent-purple)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{state.scroungingMode ? '🔍 여분 채집' : '🤒 환자 약제소'}</span>
              {state.scroungingMode ? (
                <span style={{ fontSize: '0.9rem', color: '#d97706' }}>⏱️ 여분 시간: <strong>{state.scroungingTimer} 시간 남음</strong></span>
              ) : state.activeAilment ? (
                <span style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>⏱️ 치료 완료 기한: <strong>{state.activeAilment.timer} 시간 남음</strong></span>
              ) : null}
            </h3>

            {state.scroungingMode ? (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  🎉 환자 치료에 성공했습니다! 남은 치료 시간 동안 주변 지역에서 여분 채집을 진행해 약초를 추가로 얻을 수 있습니다.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {/* Action 1: Forage Current Location (1 Hour) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf8f5', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>1. 현재 위치 채집</strong> (1시간 소모)
                      <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>현재 지역({localizeRegionLabel(state.currentRegion)})에서 카드 드로우 채집 및 조우를 진행합니다.</div>
                    </div>
                    <button
                      onClick={() => handleScroungeForage(state.currentRegion, 1)}
                      disabled={(state.scroungingTimer || 0) < 1}
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      채집 실행
                    </button>
                  </div>

                  {/* Action 2: Forage Adjacent Location (2 Hours) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#faf8f5', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>2. 인접 위치 채집</strong> (2시간 소모)
                        <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>선택한 인접 지역에서 카드 드로우 채집 및 조우를 진행합니다.</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <select id="scrounge-adj-region" style={{ padding: '0.25rem', fontSize: '0.8rem' }}>
                          {scroungeAdjacentRegions.map(r => (
                            <option key={r} value={r}>{localizeRegionLabel(r)}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const sel = (document.getElementById('scrounge-adj-region') as HTMLSelectElement)?.value;
                            if (sel) handleScroungeForage(sel, 2);
                          }}
                          disabled={(state.scroungingTimer || 0) < 2}
                          style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          채집 실행
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action 3: Gain Current Reagent (3 Hours) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#faf8f5', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>3. 현재 지역 약재 획득 (최대 효능 2 이하)</strong> (3시간 소모)
                      <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>현재 지역({localizeRegionLabel(state.currentRegion)}) 자생 약재 중 준비법의 최대 효능이 2 이하인 약재를 즉시 1개 획득합니다.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                      {(() => {
                        const region = toRuleRegion(state.currentRegion);
                        const eligible = REAGENTS.filter(reagent => reagent.regionAvailability[region] !== 'Unavailable' && reagent.preparations.some(part => Math.max(0, ...part.tags.filter(tag => !['FAIR', 'FOUL'].includes(tag.tag)).map(tag => tag.value)) <= 2));
                        if (eligible.length === 0) return <span style={{ fontSize: '0.78rem', color: '#aaa', fontStyle: 'italic' }}>대상 약재 없음</span>;
                        return eligible.map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleScroungeGainReagent(r.displayName, 3)}
                            disabled={(state.scroungingTimer || 0) < 3}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            {r.displayName}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Action 4: Gain Adjacent Reagent (4 Hours) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#faf8f5', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>4. 인접 지역 약재 획득 (최대 효능 2 이하)</strong> (4시간 소모)
                        <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>선택한 인접 지역 자생 약재 중 준비법의 최대 효능이 2 이하인 약재를 즉시 1개 획득합니다.</div>
                      </div>
                      <select
                        value={scroungeAdjacentRegions.includes(scroungeReagentRegion as Region) ? scroungeReagentRegion : scroungeAdjacentRegions[0] || ''}
                        onChange={e => setScroungeReagentRegion(e.target.value)}
                        style={{ padding: '0.25rem', fontSize: '0.8rem' }}
                      >
                        {scroungeAdjacentRegions.map(r => (
                          <option key={r} value={r}>{localizeRegionLabel(r)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                      {(() => {
                        const selectedRegion = scroungeAdjacentRegions.includes(scroungeReagentRegion as Region) ? scroungeReagentRegion as Region : scroungeAdjacentRegions[0];
                        const eligible = selectedRegion ? REAGENTS.filter(reagent => reagent.regionAvailability[selectedRegion] !== 'Unavailable' && reagent.preparations.some(part => Math.max(0, ...part.tags.filter(tag => !['FAIR', 'FOUL'].includes(tag.tag)).map(tag => tag.value)) <= 2)) : [];
                        if (eligible.length === 0) return <span style={{ fontSize: '0.78rem', color: '#aaa', fontStyle: 'italic' }}>대상 약재 없음</span>;
                        return eligible.map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleScroungeGainReagent(r.displayName, 4)}
                            disabled={(state.scroungingTimer || 0) < 4}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            {r.displayName}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFinishScrounging}
                  style={{ width: '100%', padding: '0.8rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem', cursor: 'pointer' }}
                >
                  🚪 여분 채집 마감하고 여정 계속하기
                </button>
              </div>
            ) : !state.activeAilment ? (
              <div style={{ marginTop: '1rem' }}>
                {state.lostPatientLegacy && (
                  <div className="cute-card" style={{ border: '1.5px dashed #c4b5a3', background: '#fbf9f4', padding: '1.25rem', marginBottom: '1.2rem', position: 'relative', boxShadow: 'inset 0 0 12px rgba(139, 90, 43, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div className="document-kicker" style={{ color: '#8c7a6b', borderColor: '#c4b5a3', marginBottom: '0.45rem', textTransform: 'uppercase', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                          온기를 잃고 비어버린 짚침상
                        </div>
                        <h4 style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '1.12rem', color: 'var(--text-bright)', fontFamily: 'var(--font-fancy)' }}>
                          {state.lostPatientLegacy.name} {state.lostPatientLegacy.species ? `(${state.lostPatientLegacy.species})` : ''}
                        </h4>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 0.8rem 0', fontStyle: 'italic', lineHeight: '1.5' }}>
                          아침 햇살이 창문을 넘어 들어왔을 때, 침상은 이미 싸늘하게 비어 있었습니다. 밤새 가쁜 호흡을 몰아쉬던 그 가여운 생명은 결국 마지막 한 숨을 거두고 길을 잃고 말았습니다. 식어버린 짚더미 위에 남겨진 흩뜨려진 모포를 보며, 약효가 닿지 못했던 내 부족한 손길을 탓해 봅니다. 가슴을 짓누르는 정적 속에 슬픔만이 자욱하게 내려앉습니다.
                        </p>
                        {state.lostPatientLegacy.consequence && (
                          <div style={{ padding: '0.75rem', background: '#f8f5ee', border: '1px dashed #dcd3c1', borderRadius: '4px', fontSize: '0.84rem', color: '#5c4d3c', lineHeight: '1.55' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c7a6b', fontWeight: 'bold', marginBottom: '0.25rem' }}>남겨진 흔적:</span>
                            {state.lostPatientLegacy.consequence}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '1.8rem', opacity: 0.65, marginLeft: '0.8rem', userSelect: 'none' }}>🕯️</span>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          updateState(s => ({ ...s, lostPatientLegacy: null }));
                        }}
                        className="btn-cozy-secondary"
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', background: '#fff', border: '1px solid #d4c5b3', color: '#6e5d4f', cursor: 'pointer' }}
                      >
                        시트를 거두고 새로 짚을 깔며 그를 보냅니다
                      </button>
                    </div>
                  </div>
                )}

                {/* Workshop Shelves */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '1.2rem', marginBottom: '1.5rem', background: '#faf9f5', border: '1px solid #dcd3c1', padding: '1.1rem', borderRadius: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--primary)', fontSize: '0.92rem', fontFamily: 'var(--font-fancy)' }}>
                      🌿 최근 다녀간 이들
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {(() => {
                        const cured = (state.patientCasebook || []).filter(p => p.outcome === 'success').slice(0, 3);
                        if (cured.length === 0) {
                          return <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.3rem 0' }}>아직 다녀간 야수의 온기가 남아있지 않습니다.</div>;
                        }
                        return cured.map(p => (
                          <div key={p.id} style={{ borderBottom: '1px dotted var(--glass-border)', padding: '0.45rem 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            🌿 {p.patientName || '이름 모를 이'}{p.species ? ` (${p.species})` : ''} — {p.locationName || '어느 숲'}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.6rem 0', color: '#8c7a6b', fontSize: '0.92rem', fontFamily: 'var(--font-fancy)' }}>
                      🕯️ 기억 속에 남은 이들
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {(() => {
                        const lost = (state.patientCasebook || []).filter(p => p.outcome === 'failure').slice(0, 3);
                        if (lost.length === 0) {
                          return <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.3rem 0' }}>아직 아프게 남은 상실의 흔적이 없습니다. 숲속을 스쳐 지나간 바람만이 빈자리 주위를 맴돌 뿐입니다.</div>;
                        }
                        return lost.map(p => (
                          <div key={p.id} style={{ borderBottom: '1px dotted var(--glass-border)', padding: '0.45rem 0', fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                            🕯️ {p.patientName || '가여운 이'}{p.species ? ` (${p.species})` : ''} — {p.resolvedAtDay || 0}일째
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                  
                  {/* Ambient Workshop Lines */}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1.5px dashed var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.4rem', textAlign: 'center' }}>
                    {(() => {
                      const dayVal = state.cumulativeDays || state.calendarDays || 0;
                      const casebookLen = (state.patientCasebook || []).length;
                      const trinketLen = (state.trinketArchive || []).length;
                      const repVal = state.reputation || 0;
                      const ambientIndex = (dayVal + casebookLen + trinketLen + repVal) % 6;
                      
                      const ambientLines = [
                        "약초 다발이 천장 아래에서 천천히 마르고 있습니다.",
                        "창가에 놓인 빈 찻잔에는 아직도 은은한 향이 남아 있습니다.",
                        "오래된 약절구에는 말린 잎의 가루가 희미하게 남아 있습니다.",
                        "빗물이 지나간 창문 너머로 숲이 조용히 흔들립니다.",
                        "벽에 꽂힌 식물 표본들이 조용히 계절을 견디고 있습니다.",
                        "누군가 남기고 간 작은 발자국이 아직도 문가에 희미하게 남아 있습니다."
                      ];
                      
                      return (
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-base)' }}>
                          ✨ {ambientLines[ambientIndex]}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  현재 돌보는 환자가 없습니다. 카드 절차로 환자의 성격, 묘사, 중증도와 질환을 생성합니다.
                </p>
                <form onSubmit={handleDiagnoseAilment} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.8rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="환자 이름 (선택)"
                      value={patientNameDraft}
                      onChange={e => setPatientNameDraft(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="종 / 생김새 (선택)"
                      value={patientSpeciesDraft}
                      onChange={e => setPatientSpeciesDraft(e.target.value)}
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="첫 인상 메모 (선택): 예를 들어 처음 만났을 때의 모습, 걱정하던 동반자, 기억하고 싶은 작은 단서"
                    value={patientInitialNoteDraft}
                    onChange={e => setPatientInitialNoteDraft(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                  <button type="submit" style={{ padding: '0.6rem 1rem', background: 'var(--accent-purple)', color: '#fff', borderRadius: '8px', fontWeight: 'bold', alignSelf: 'flex-start' }}>
                    환자 카드 절차 시작
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                {(() => {
                  const patient = state.patients.find(row => row.id === state.activePatientId);
                  if (!patient || patient.ailments.filter(row => row.status === 'active').length <= 1) return null;
                  return (
                    <div style={{ marginBottom: '0.9rem', padding: '0.75rem', border: '1px solid var(--glass-border)', background: '#faf8f4', borderRadius: '6px' }}>
                      <strong style={{ fontSize: '0.82rem' }}>{patient.name}의 활성 질환과 개별 타이머</strong>
                      <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.45rem' }}>
                        {patient.ailments.filter(row => row.status === 'active').map(row => {
                          const definition = AILMENTS.find(ailment => ailment.id === row.ailmentId);
                          const timer = patient.timers.find(candidate => candidate.ailmentInstanceId === row.id);
                          return <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', fontSize: '0.8rem' }}><span>{definition?.displayName || row.legacyName}</span><strong>{timer?.current || 0} / {timer?.maximum || 0}시간</strong></div>;
                        })}
                      </div>
                    </div>
                  );
                })()}
                <div className="grid-patient-stats" style={{ borderBottom: '1px dashed var(--glass-border)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>{state.activeAilment.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2px' }}>병색의 깊이: {getNaturalSeverityDescription(state.activeAilment.severity)}</div>
                    {(state.activeAilment.patientName || state.activeAilment.species || state.activeAilment.initialRememberedNote) && (
                      <div style={{ marginTop: '0.5rem', padding: '0.65rem', border: '1px dashed var(--glass-border)', background: '#fffefa', borderRadius: '4px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <div><strong>환자:</strong> {state.activeAilment.patientName || '이름 모를 야수'} {state.activeAilment.species ? ` / ${state.activeAilment.species}` : ''}</div>
                        {state.activeAilment.initialRememberedNote && (
                          <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>{state.activeAilment.initialRememberedNote}</div>
                        )}
                      </div>
                    )}
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', background: '#fcfaf6', padding: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                      {localizeAilmentPresentationText(state.activeAilment.description)}
                    </p>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem' }}>
                      💊 <strong>필요 약효 성분:</strong>
                      <div style={{ marginTop: '0.4rem' }}>
                        {parseAndRenderTags(state.activeAilment.tags)}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
                      🧺 <strong>누적 채집 포인트:</strong> <strong style={{ color: 'var(--primary)' }}>{state.activeAilment.foragingPoints}</strong>
                    </div>
                  </div>
                </div>

                {/* Foraging Drawing selector */}
                <div style={{ margin: '0.8rem 0', display: 'grid', gap: '0.75rem', fontSize: '0.85rem', background: '#faf8f5', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', width: '100%' }}>
                  <CardDrawSlot
                    label="채집 카드"
                    helper="카드 값이 영약재 희귀도 이상이면 발견합니다. 빈 칸이면 채집 버튼을 누를 때 자동 랜덤 드로우됩니다."
                    card={forageDrawCard}
                    onCard={(card) => {
                      setForageDrawCard(card);
                      setSelectedForageSuit(card.suit);
                      setSelectedForageValue(card.value);
                      setForageCardMode('manual');
                    }}
                  />
                </div>

                {/* Foraging Location Type Selector */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', marginBottom: '0.5rem', background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>📍 채집 지역:</span>
                  <select
                    value={forageLocationType}
                    onChange={(e) => setForageLocationType(e.target.value as 'current' | 'adjacent')}
                    style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', background: '#fff', color: '#333' }}
                  >
                    <option value="current">현재 지역 ({localizeRegionLabel(state.currentRegion)}) (기본 1시간)</option>
                    <option value="adjacent" disabled={scroungeAdjacentRegions.length === 0}>인접 지역 (기본 2시간)</option>
                  </select>

                  {forageLocationType === 'adjacent' && (
                    <select
                      value={forageAdjacentRegion}
                      onChange={(e) => setForageAdjacentRegion(e.target.value)}
                      style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', background: '#fff', color: '#333' }}
                    >
                      {scroungeAdjacentRegions.map(r => (
                          <option key={r} value={r}>{localizeRegionLabel(r)}</option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Foraging and Bartering buttons */}
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
                  {(() => {
                    const currentForageAllowed = ['Wilds', 'Ruin', 'Barrow'].includes(state.currentLocationType);
                    const forageDisabled = (forageLocationType === 'current' && !currentForageAllowed)
                      || (forageLocationType === 'adjacent' && !scroungeAdjacentRegions.includes(toRuleRegion(forageAdjacentRegion)));
                    return (
                      <button
                        onClick={(e) => handleForageDraw(e)}
                        disabled={forageDisabled}
                        title={forageDisabled ? '현재 위치 채집은 Wilds, Titan Ruins, Barrows에서만 가능합니다.' : ''}
                        style={{
                          flex: 1,
                          padding: '0.7rem',
                          background: forageDisabled ? '#eee' : 'var(--primary-light)',
                          color: forageDisabled ? '#999' : 'var(--primary)',
                          border: `1.5px solid ${forageDisabled ? '#ccc' : 'var(--primary)'}`,
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: forageDisabled ? 'not-allowed' : 'pointer'
                        }}
                      >
                        🌿 {forageLocationType === 'adjacent' ? `인접 지역 [${forageAdjacentRegion}] 채집 시작` : '이 위치 채집 및 조우'}
                      </button>
                    );
                  })()}

                  {/* Barter — show remaining attempts */}
                  {(() => {
                    const barterOptions = getAvailableBarterLocations(state);
                    const maxBarters = barterOptions.reduce((max, option) => Math.max(max, getBarterAttemptLimit(option.type)), 0);
                    const remaining = barterOptions.reduce((max, option) => Math.max(max,
                      state.activePatientId ? getBarterAttemptsRemaining(state.barterAttemptHistory, state.activePatientId, option.key, option.type) : 0
                    ), 0);
                    const pendingBarter = state.pendingBarter && !['completed', 'abandoned'].includes(state.pendingBarter.status)
                      ? state.pendingBarter
                      : null;
                    const canBarter = Boolean(pendingBarter) || (barterOptions.length > 0 && remaining > 0);
                    const barterButtonLabel = pendingBarter?.status === 'manual-social'
                      ? '사교 조우 판정 계속'
                      : pendingBarter?.status === 'awaiting-second-card'
                        ? '물꼬 거래 카드 뽑기'
                        : pendingBarter?.status === 'awaiting-payment'
                          ? `거래 대가 ${pendingBarter.paymentRequired} 지불`
                          : barterOptions.length > 0
                            ? `물꼬 거래 ${remaining}/${maxBarters}회 남음`
                            : '물꼬 거래 — 현재/인접 정착지·도시만 가능';
                    return (
                      <button
                        onClick={async () => {
                          if (pendingBarter?.status === 'manual-social' || pendingBarter?.status === 'awaiting-second-card') {
                            handleBarterProgressToDeal();
                            return;
                          }
                          if (pendingBarter?.status === 'awaiting-payment') {
                            const paymentOptions = Array.from({ length: pendingBarter.paymentRequired + 1 }, (_, trinkets) => ({
                              trinkets,
                              reputation: pendingBarter.paymentRequired - trinkets
                            })).filter(payment => payment.trinkets <= state.trinkets.length && payment.reputation <= state.reputation);
                            const choice = await requestControlledPrompt({
                              title: '거래 대가를 정하세요',
                              message: `부족한 값 ${pendingBarter.paymentRequired}을 장신구와 길드 명성으로 정확히 채웁니다. 거래를 포기하면 진행 중인 모든 질병 타이머가 1 줄어듭니다.`,
                              defaultValue: paymentOptions.length > 0 ? '0' : 'abandon',
                              kicker: '물꼬 거래 마감',
                              options: [
                                ...paymentOptions.map((payment, index) => ({
                                  value: String(index),
                                  label: `장신구 ${payment.trinkets}개 · 길드 명성 ${payment.reputation}`
                                })),
                                { value: 'abandon', label: '거래 포기' }
                              ]
                            });
                            if (choice === null) return;
                            if (choice === 'abandon') {
                              handleBarterFinalize(false);
                              return;
                            }
                            const payment = paymentOptions[parseInt(choice, 10) || 0];
                            if (payment) handleBarterFinalize(true, payment.trinkets, payment.reputation);
                            return;
                          }
                          let selectedLocation = barterOptions[0];
                          if (barterOptions.length > 1) {
                            const choice = await requestControlledPrompt({
                              title: '거래할 장소를 선택하세요',
                              message: '현재 위치 또는 인접한 정착지와 도시에서 거래할 수 있습니다.',
                              defaultValue: '1',
                              kicker: '물꼬 거래',
                              options: barterOptions.map((option, idx) => ({
                                value: String(idx + 1),
                                label: `${idx + 1}. ${option.name} (${option.type === 'City' ? '도시' : '정착지'}, ${option.relation === 'current' ? '현재 위치' : '인접 위치'})`
                              }))
                            });
                            if (!choice) return;
                            selectedLocation = barterOptions[Math.max(0, (parseInt(choice) || 1) - 1)] || barterOptions[0];
                          }
                          const req = await requestControlledPrompt({
                            title: '구매할 영약재',
                            message: `${selectedLocation.name}에서 수소문할 영약재 이름을 입력하세요.`,
                            defaultValue: '',
                            kicker: '물꼬 거래',
                            label: '영약재 이름'
                          });
                          if (req) handleBarterAttempt(req, selectedLocation);
                        }}
                        disabled={!canBarter}
                        title={barterOptions.length === 0 ? '현재 또는 인접한 정착지/도시에서만 가능' : remaining === 0 ? '거래 횟수 초과' : ''}
                        style={{ flex: 1, padding: '0.7rem', background: canBarter ? 'var(--secondary-light)' : '#eee', color: canBarter ? 'var(--secondary)' : '#aaa', border: `1.5px solid ${canBarter ? 'var(--secondary)' : '#ccc'}`, borderRadius: '8px', fontWeight: 'bold', cursor: canBarter ? 'pointer' : 'not-allowed' }}
                      >
                        🤝 {barterButtonLabel}
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={handleAbandonPatient}
                    style={{ padding: '0.7rem 1rem', background: '#f3e6df', color: '#7a4d42', border: '1px solid #cda99d', fontWeight: 'bold' }}
                  >
                    환자를 떠나보내기
                  </button>

                  {state.rulesetId === 'sandbox' && <button
                    onClick={() => {
                      const req = prompt("발견(채집완료) 처리할 영약재 이름을 입력하세요 (예: 너도밤나무):");
                      if (req) handleCollectReagent(req);
                    }}
                    style={{ padding: '0.7rem 1rem', background: '#f5f5f5', color: '#555', borderRadius: '8px' }}
                  >
                    🧺 수작업 영약재 획득
                  </button>}

                  {state.rulesetId === 'sandbox' && <button
                    onClick={() => handlePassHour(1)}
                    style={{ padding: '0.7rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}
                  >
                    ⏱️ 1시간 흘려보내기
                  </button>}
                </div>

                {/* Independent Familiar UI */}
                {(() => {
                  const familiarMechanic = getActiveFamiliarMechanic(state);
                  if (familiarMechanic === 'independent' && !state.independentUsedThisAilment) {
                    return (
                      <div style={{ width: '100%', marginTop: '0.8rem', padding: '0.8rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#92400e' }}>🦉 자유로운 영혼 (Independent) 혜택: 인접 지역 안전 채집 (질병당 1회)</strong>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem' }}>인접 채집할 지역 선택:</span>
                          <select
                            value={independentAdjRegion}
                            onChange={e => setIndependentAdjRegion(e.target.value)}
                            style={{ padding: '0.2rem', fontSize: '0.8rem' }}
                          >
                            {scroungeAdjacentRegions.map(r => (
                              <option key={r} value={r}>{localizeRegionLabel(r)}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleIndependentForage(independentAdjRegion)}
                            disabled={!scroungeAdjacentRegions.includes(toRuleRegion(independentAdjRegion))}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            🦉 안전 채집 실행
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Scrounging — rulebook p.37: spend remaining timer to forage extra reagents */}
                <div style={{ marginTop: '0.5rem', padding: '0.6rem', background: '#f9f5ee', border: '1px dashed #c9b68a', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <strong>🔍 여분 채집 (p.37)</strong> — 치료 완료 후 남은 타이머로 여분 약재 획득 가능.<br />
                  타이머 소비: 현재 위치 채집 1회, 인접 위치 채집 1회, 현재 위치 약재 1개(효능≤2), 인접 약재 1개(효능≤2).<br />
                  <span style={{ color: '#888' }}>* 치료제 완성 후 모든 타이머가 0 이상일 때만 사용 가능.</span>
                  {(hasTool(state, 'tool_needles') || hasTool(state, '뜨개바늘') || hasTool(state, 'Knitting Needles')) && (
                    <div style={{ marginTop: '0.65rem', paddingTop: '0.55rem', borderTop: '1px dashed #d6c8a8' }}>
                      <strong style={{ color: '#7c5a2a' }}>🧶 뜨개질 프로젝트 (Knitting Needles, p.64)</strong>
                      <div style={{ marginTop: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={handleKnitProject}
                          style={{ padding: '0.35rem 0.6rem', background: '#fffaf0', border: '1px solid #d8b16c', borderRadius: '6px', color: '#7c5a2a', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          담요/코트/가방/목도리 완성
                        </button>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const saleableOddments = state.bag.filter(item => item.type !== 'tool' && (item.type !== 'reagent' || (item.usesRemaining || 0) > 0));
                    if (saleableOddments.length === 0) return null;
                    const preview = calculatePawnReward(toEngineInventory(state.bag), pawnItemIds);
                    return (
                      <div style={{ marginTop: '0.65rem', paddingTop: '0.55rem', borderTop: '1px dashed #d6c8a8' }}>
                        <strong style={{ color: '#7c5a2a' }}>떠나기 전 담보 판매</strong>
                        <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.45rem' }}>
                          {saleableOddments.map(item => (
                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}>
                              <input
                                type="checkbox"
                                checked={pawnItemIds.includes(item.id)}
                                onChange={event => setPawnItemIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))}
                              />
                              <span>{localizeInventoryItemName(item.name)} · 무게 {formatWeight(item.weight * (item.qty || 1))}</span>
                            </label>
                          ))}
                        </div>
                        <button type="button" onClick={handleSellOddment} disabled={pawnItemIds.length === 0} style={{ marginTop: '0.5rem', padding: '0.4rem 0.65rem', background: '#fffaf0', border: '1px solid #d8b16c', borderRadius: '6px', color: '#7c5a2a', fontSize: '0.78rem', fontWeight: 'bold' }}>
                          전체 무게 {formatWeight(preview.totalWeight)} · 장신구 {preview.trinketReward}개 받기
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Concocting Remedy Panel */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1rem' }}>
                  <h4>🔬 치료제 조제하기</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                    가방 속 영약재들을 도구를 사용하여 가공한 뒤 환자의 증상을 치료해 치료제를 만듭니다.
                  </p>

                  {(() => {
                    const selectedReagents = [
                      ...state.bag.filter(item => selectedBagItems.includes(item.id)),
                      ...selectedToolEffectItems(state.bag, selectedTools)
                    ];
                    const validation = validateConcoction(state.activeAilment, selectedReagents, state.bag, state, usePurify);
                    const alternative = state.pendingAlternativeAcquisition;
                    const makeDoMatches = alternative?.kind === 'make-do'
                      ? state.bag.filter(item => {
                        const preparation = item.canonicalReagentId && item.preparationId
                          ? REAGENT_BY_ID.get(item.canonicalReagentId)?.preparations.find(row => row.id === item.preparationId)
                          : null;
                        return preparation?.tags.some(row => row.tag === alternative.targetTag && row.value >= alternative.requiredPotency);
                      })
                      : [];
                    return (
                      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fff8ee', border: '1px dashed #d4a853', borderRadius: '8px', fontSize: '0.82rem', lineHeight: 1.45 }}>
                        <strong style={{ color: '#8b5e1a' }}>🧩 약재 대체 및 대안 (Replacement, p.30)</strong>
                        <div style={{ marginTop: '0.25rem', color: '#6f604d' }}>
                          현재 선택 기준 미충족: {validation.missingRequirements.length > 0 ? validation.missingRequirements.join(', ') : '없음'}
                        </div>
                        {alternative && (
                          <div style={{ marginTop: '0.55rem', padding: '0.55rem', background: '#fff', border: '1px solid #dfcfaa', borderRadius: '4px' }}>
                            <strong>{alternative.kind === 'make-do' ? 'Make Do 탐색 중' : 'Replacement 탐색 중'}</strong>
                            <div>{alternative.targetTag} {alternative.requiredPotency} · 채집 또는 흥정으로 실제 획득 필요</div>
                            {alternative.kind === 'replacement' && <div>희귀도 12 · 무게 2/3 · {alternative.name} ({alternative.preparation})</div>}
                            {makeDoMatches.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                                {makeDoMatches.map(item => (
                                  <button key={item.id} type="button" onClick={() => handleConfirmMakeDoAcquisition(item.id)} style={{ padding: '0.35rem 0.55rem', border: '1px solid #b99652', borderRadius: '4px', background: '#fffaf0', color: '#6f4e23' }}>
                                    {localizeInventoryItemName(item.name)} 사용
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleCreateReplacementReagent}
                          style={{ marginTop: '0.55rem', padding: '0.45rem 0.75rem', background: '#f5efe2', border: '1px solid #c9a66b', borderRadius: '6px', color: '#6f4e23', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          🧩 Make Do / Replacement 탐색 조건 정하기
                        </button>
                      </div>
                    );
                  })()}

                  {/* 과거 성공 처방 (Discovered Recipes) 추천 및 자동 완성 */}
                  {(() => {
                    const discovered = (state.discoveredRecipes || {})[state.activeAilment.name] || [];
                    if (discovered.length === 0) return null;

                    return (
                      <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1.5px solid var(--border-cozy)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>📖 성공했던 처방 이력 (Pharmacopoeia):</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {discovered.map((recipe, idx) => {
                            const missingReagents = recipe.filter(name => {
                              const matchingInBag = state.bag.some(item => item.type === 'reagent' && item.name.split(' (')[0] === name);
                              return !matchingInBag;
                            });
                            const canAutoFill = missingReagents.length === 0;

                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                                <span>{recipe.join(' + ')}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextSelected: string[] = [];
                                    const bagCopy = [...state.bag];
                                    recipe.forEach(name => {
                                      const found = bagCopy.find(item => item.type === 'reagent' && item.name.split(' (')[0] === name && !nextSelected.includes(item.id));
                                      if (found) {
                                        nextSelected.push(found.id);
                                      }
                                    });
                                    persistTreatmentDraft(nextSelected, selectedTools, usePurify);
                                    showAlert(`🧪 [처방 자동 조립]\n가방 속 약재 [${recipe.join(', ')}]을(를) 조제 슬롯에 조립했습니다!`);
                                  }}
                                  disabled={!canAutoFill}
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    background: canAutoFill ? 'var(--primary)' : '#e2e8f0',
                                    color: canAutoFill ? '#fff' : '#94a3b8',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    cursor: canAutoFill ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {canAutoFill ? '⚡ 자동 조립' : '❌ 약재 부족'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {state.treatmentDraft?.status === 'draft' && state.treatmentDraft.patientId === state.activePatientId && (
                    <div className="treatment-draft-note" role="status">
                      <div>
                        <span className="journal-note-label">저장된 처방 초안</span>
                        <strong>{state.treatmentDraft.selectedParts.length}개 부위 · 도구 {state.treatmentDraft.selectedToolIds.length}개</strong>
                      </div>
                      <div><span>FAIR</span><strong>{state.treatmentDraft.fair}</strong></div>
                      <div><span>FOUL</span><strong>{state.treatmentDraft.foul}</strong></div>
                      <div><span>상태</span><strong>{state.treatmentDraft.selectedParts.length ? '조제 검토 중' : '재료 선택 전'}</strong></div>
                    </div>
                  )}

                  <div className="grid-2col treatment-workspace" style={{ gap: '1.0rem' }}>
                    {/* Reagents selection */}
                    <div style={{ background: '#fafafa', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '180px', overflowY: 'auto' }}>
                      <strong style={{ fontSize: '0.85rem' }}>🎒 가방 내 영약재 선택:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                        {state.bag.filter(item => item.type === 'reagent').length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>가방에 쓸 수 있는 영약재가 없습니다.</span>
                        ) : (
                          state.bag.filter(item => item.type === 'reagent').map(item => (
                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={selectedBagItems.includes(item.id)}
                                onChange={e => {
                                  if (e.target.checked) persistTreatmentDraft([...selectedBagItems, item.id], selectedTools, usePurify);
                                  else persistTreatmentDraft(selectedBagItems.filter(id => id !== item.id), selectedTools, usePurify);
                                }}
                              />
                              {localizeInventoryItemName(item.name)}
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Tools selection */}
                    <div style={{ background: '#fafafa', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                      <strong style={{ fontSize: '0.85rem' }}>⚒️ 사용할 기본 도구/조제법:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                        {state.bag.filter(item => item.type === 'tool').map(item => (
                          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedTools.includes(item.id)}
                              onChange={e => {
                                if (e.target.checked) persistTreatmentDraft(selectedBagItems, [...selectedTools, item.id], usePurify);
                                else persistTreatmentDraft(selectedBagItems, selectedTools.filter(id => id !== item.id), usePurify);
                              }}
                            />
                            {localizeInventoryItemName(item.name)}
                          </label>
                        ))}
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.4rem', paddingTop: '0.45rem', borderTop: '1px dashed #ddd' }}>
                          <input
                            type="checkbox"
                            checked={usePurify}
                            onChange={e => persistTreatmentDraft(selectedBagItems, selectedTools, e.target.checked)}
                          />
                          <span>
                            정화하기 [PURIFY] 적용
                            <small style={{ display: 'block', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                              산맥의 특별 조제법을 사용해 이 치료제의 [FOUL]을 0으로 계산합니다.
                            </small>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConcoctRemedy}
                    style={{ width: '100%', padding: '0.8rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem' }}
                  >
                    🧪 치료제 완성하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 6. CHARACTER SHEET (BIO & BAGS) VIEW
const WizardFieldCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ border: '1.5px solid var(--border-cozy)', borderRadius: '8px', padding: '1rem', background: '#fff' }}>
    <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary)', fontFamily: 'var(--font-fancy)', fontSize: '1.15rem' }}>{title}</h4>
    {children}
  </div>
);

const WizardChoiceSelect = ({ value, onChange, items, labelKey = 'name' }: { value: string; onChange: (item: any) => void; items: any[]; labelKey?: string }) => (
  <select
    value={value}
    onChange={e => onChange(items.find(item => item[labelKey] === e.target.value) || items[0])}
    style={{ width: '100%', height: '38px', fontSize: '0.9rem' }}
  >
    {items.map(item => (
      <option key={`${item.card || item.suit}_${item[labelKey]}`} value={item[labelKey]}>
        {item.card || item.suit} - {localizeCharacterChoiceLabel(String(item[labelKey]))}
      </option>
    ))}
  </select>
);

// =================================================================
function CharacterCreationWizard({ state, updateState }: { state: GameState; updateState: any }) {
  const bioChoices = GAME_DATA.bioChoices;
  const initialDescriptor = bioChoices.descriptors.find((d: any) => d.examples === state.bio.examples) || bioChoices.descriptors[2];
  const initialTravel = bioChoices.travelStyles.find((t: any) => t.name === state.bio.travelStyle || (t.speed === state.bio.speed && t.carry === state.bio.carry)) || bioChoices.travelStyles[1];
  const initialOrigin = bioChoices.origins.find((o: any) => state.bio.originName.includes(o.name) || o.name.includes(state.bio.originName)) || bioChoices.origins[3];
  const initialFamiliarDescriptor = bioChoices.descriptors.find((d: any) => d.examples === state.bio.familiarExamples) || bioChoices.descriptors[0];
  const initialBenefit = bioChoices.familiars.find((f: any) => state.bio.familiarBenefit.includes(f.name)) || bioChoices.familiars[1];
  const initialRelationship = bioChoices.relationships.find((r: any) => state.bio.familiarRelation.includes(r.name)) || bioChoices.relationships[1];

  const [open, setOpen] = useState(!state.bio.name);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    name: state.bio.name,
    descriptor: initialDescriptor,
    animal: state.bio.animal,
    travel: initialTravel,
    origin: initialOrigin,
    originJournal: state.bio.originJournal,
    mementoNote: state.bio.mementoNote,
    familiarName: state.bio.familiarName,
    familiarDescriptor: initialFamiliarDescriptor,
    familiarAnimal: state.bio.familiarAnimal,
    familiarBenefit: initialBenefit,
    relationship: initialRelationship,
    familiarJournal: state.bio.familiarJournal,
    relationshipJournal: state.bio.relationshipJournal,
    resourcefulReagent: state.resourcefulReagent || "",
    ingenuitiveTool: state.ingenuitiveTool || ""
  });
  const [wizardCards, setWizardCards] = useState<Record<string, PlayingCard | null>>({});

  const steps = [
    '약제사 동물',
    '이동 방식',
    '출발 계기',
    '장비와 기념품',
    '길동무 동물',
    '길동무 도움',
    '관계',
    '확정'
  ];

  const applyWizardCard = (key: string, card: PlayingCard, action: (card: PlayingCard) => void) => {
    const previous = wizardCards[key];
    const isChanging = previous && (previous.suit !== card.suit || previous.value !== card.value);
    if (isChanging && !askWindowConfirm("이미 나온 카드가 있습니다. 룰북의 우연성을 살리려면 지금 결과를 그대로 가져가는 편을 추천합니다. 그래도 조심스럽게 바꿀까요?")) return;
    setWizardCards(cards => ({ ...cards, [key]: card }));
    action(card);
  };

  const applyDescriptorCard = (target: 'self' | 'familiar', key: string, card: PlayingCard) => {
    applyWizardCard(key, card, selected => {
      const drawn = findByCard(bioChoices.descriptors as any[], cardRuleValue(selected));
      if (target === 'self') {
        setDraft(d => ({ ...d, descriptor: drawn, animal: "" }));
      } else {
        setDraft(d => ({ ...d, familiarDescriptor: drawn, familiarAnimal: "" }));
      }
    });
  };

  const applyTravelCard = (card: PlayingCard) => {
    applyWizardCard('travel', card, selected => {
      setDraft(d => ({ ...d, travel: findBySuit(bioChoices.travelStyles as any[], selected.suit) }));
    });
  };

  const applyOriginCard = (card: PlayingCard) => {
    applyWizardCard('origin', card, selected => {
      setDraft(d => ({ ...d, origin: findBySuit(bioChoices.origins as any[], selected.suit) }));
    });
  };

  const applyBenefitCard = (card: PlayingCard) => {
    applyWizardCard('familiarBenefit', card, selected => {
      setDraft(d => ({ ...d, familiarBenefit: findByCard(bioChoices.familiars as any[], cardRuleValue(selected)) }));
    });
  };

  const applyRelationshipCard = (card: PlayingCard) => {
    applyWizardCard('relationship', card, selected => {
      setDraft(d => ({ ...d, relationship: findByCard(bioChoices.relationships as any[], cardRuleValue(selected)) }));
    });
  };

  const saveCharacter = () => {
    if (!draft.name.trim() || !draft.animal.trim() || !draft.familiarName.trim() || !draft.familiarAnimal.trim()) {
      showAlert("약제사 이름/동물, 길동무 이름/동물을 채우면 시트가 완성됩니다.");
      return;
    }

    const timestamp = Date.now();
    const matchedBenefit = FAMILIAR_BENEFITS.find(f => f.card === draft.familiarBenefit.card);
    const canFlyFromTravel = draft.travel.speed === 5 && draft.travel.carry === 2;

    updateState((s: GameState) => ({
      ...s,
      bio: {
        ...s.bio,
        name: draft.name.trim(),
        animal: draft.animal.trim(),
        descriptor: draft.descriptor.name,
        examples: draft.descriptor.examples,
        travelStyle: draft.travel.name,
        speed: draft.travel.speed,
        carry: draft.travel.carry,
        canFly: canFlyFromTravel,
        originName: draft.origin.name,
        originDesc: draft.origin.desc,
        originJournal: draft.originJournal.trim(),
        familiarName: draft.familiarName.trim(),
        familiarAnimal: draft.familiarAnimal.trim(),
        familiarDescriptor: draft.familiarDescriptor.name,
        familiarExamples: draft.familiarDescriptor.examples,
        familiarBenefit: matchedBenefit?.name || draft.familiarBenefit.name,
        familiarRelation: `${draft.relationship.name} (${draft.relationship.desc})`,
        familiarJournal: draft.familiarJournal.trim(),
        relationshipJournal: draft.relationshipJournal.trim(),
        mementoNote: draft.mementoNote.trim()
      },
      resourcefulReagent: matchedBenefit?.mechanic === 'resourceful' ? draft.resourcefulReagent : "",
      ingenuitiveTool: matchedBenefit?.mechanic === 'ingenuitive' ? draft.ingenuitiveTool : "",
      trinkets: s.trinkets.length > 0 ? s.trinkets : ["기념품 (Memento)"],
      journals: mergeCharacterJournals(s.journals, {
        originName: draft.origin.name,
        originJournal: draft.originJournal,
        mementoNote: draft.mementoNote,
        familiarJournal: draft.familiarJournal,
        familiarRelation: draft.relationship.name,
        relationshipJournal: draft.relationshipJournal
      }, timestamp)
    }));
    setOpen(false);
    showAlert("룰북 절차에 따라 약제사 시트가 완성되었습니다.");
  };

  const animalChips = (examples: string, onPick: (value: string) => void) => (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {examplesToOptions(examples).map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onPick(option)}
          style={{ padding: '0.25rem 0.55rem', border: '1px solid var(--glass-border)', borderRadius: '999px', background: '#fffdf8', color: 'var(--text-muted)', fontSize: '0.8rem' }}
        >
          {option}
        </button>
      ))}
    </div>
  );

  if (!open) {
    return (
      <div style={{ border: '1.5px dashed var(--border-cozy)', borderRadius: '10px', padding: '0.8rem 1rem', background: '#fff', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '1.2rem' }}>
        <div>
          <strong style={{ color: 'var(--primary)' }}>룰북 기반 캐릭터 생성</strong>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>10-16쪽 순서대로 약제사와 길동무를 다시 정리합니다.</div>
        </div>
        <button type="button" onClick={() => setOpen(true)} style={{ padding: '0.45rem 0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 'bold' }}>
          생성 도우미 열기
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1rem', background: '#fffdf8', marginBottom: '1.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.75rem', marginBottom: '0.9rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--secondary)', fontFamily: 'var(--font-fancy)', fontSize: '1.35rem' }}>룰북 따라 캐릭터 만들기</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>p.10-16의 표를 따라 카드 드로우 또는 직접 선택으로 시트를 완성합니다.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} style={{ padding: '0.35rem 0.65rem', background: '#eee', color: '#555', borderRadius: '6px' }}>접기</button>
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {steps.map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(idx)}
            style={{
              padding: '0.35rem 0.55rem',
              border: '1px solid var(--glass-border)',
              borderRadius: '999px',
              background: step === idx ? 'var(--primary)' : '#fff',
              color: step === idx ? '#fff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: step === idx ? 'bold' : 'normal'
            }}
          >
            {idx + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <WizardFieldCard title="어떤 동물인가요?">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="약제사의 이름을 지어주세요" />
            <CardDrawSlot
              variant="hero"
              label="약제사 정체성 카드 (p.10)"
              helper="카드 한 장을 뽑아 당신의 종족을 알아보세요. 오프라인 덱이 있다면 직접 입력도 가능합니다."
              card={wizardCards.self || null}
              onCard={card => applyDescriptorCard('self', 'self', card)}
            />
            <div style={{ color: 'var(--text-bright)', fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center' }}>
              {wizardCards.self ? (
                <>뽑은 카드가 말하길, 당신은 <strong style={{ color: 'var(--primary)' }}>{localizeCharacterDescriptor(draft.descriptor.name)}</strong> 약제사입니다.<br /><span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{draft.descriptor.examples} 중에서 골라보세요.</span></>
              ) : (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>카드를 뽑으면 종족이 정해집니다.</span>
              )}
            </div>
            {animalChips(draft.descriptor.examples, value => setDraft(d => ({ ...d, animal: value })))}
            <input value={draft.animal} onChange={e => setDraft(d => ({ ...d, animal: e.target.value }))} placeholder="실제 동물 또는 외형을 적어주세요" />
            <details style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>직접 고르기 ▾</summary>
              <div style={{ marginTop: '0.4rem' }}>
                <WizardChoiceSelect value={draft.descriptor.name} items={bioChoices.descriptors as any[]} onChange={item => setDraft(d => ({ ...d, descriptor: item, animal: "" }))} />
              </div>
            </details>
          </div>
        </WizardFieldCard>
      )}

      {step === 1 && (
        <WizardFieldCard title="어떻게 여행하나요?">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <CardDrawSlot
              variant="hero"
              label="이동 방식 카드 (p.11)"
              helper="문양이 여행 스타일을 정합니다. 느릿느릿 짐을 잔뜩 싣거나, 가볍게 날듯이 움직이거나."
              card={wizardCards.travel || null}
              onCard={applyTravelCard}
            />
            <div style={{ padding: '0.8rem', background: '#fff', border: '1px dashed var(--border-cozy)', borderRadius: '8px', fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center' }}>
              {wizardCards.travel ? (
                <>
                  <strong style={{ color: 'var(--primary)' }}>{localizeTravelStyle(draft.travel.name)}</strong> 방식으로 여행합니다.<br />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    하루에 {draft.travel.speed}경로를 이동하고, 짐은 {draft.travel.carry}칸까지 들 수 있습니다.
                  </span><br />
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', fontStyle: 'italic' }}>{draft.travel.desc}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>카드를 뽑으면 이동 방식이 정해집니다.</span>
              )}
            </div>
            <details style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>직접 고르기 ▾</summary>
              <div style={{ marginTop: '0.4rem' }}>
                <WizardChoiceSelect value={draft.travel.name} items={bioChoices.travelStyles as any[]} onChange={item => setDraft(d => ({ ...d, travel: item }))} />
              </div>
            </details>
          </div>
        </WizardFieldCard>
      )}

      {step === 2 && (
        <WizardFieldCard title="왜 약제사의 길을 떠났나요?">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <CardDrawSlot
              variant="hero"
              label="출발 계기 카드 (p.12)"
              helper="문양이 약제사가 된 동기를 알려줍니다."
              card={wizardCards.origin || null}
              onCard={applyOriginCard}
            />
            <div style={{ fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center' }}>
              {wizardCards.origin ? (
                <>
                  <strong style={{ color: 'var(--primary)' }}>{draft.origin.name}</strong><br />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{draft.origin.desc}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>카드를 뽑으면 출발 계기가 정해집니다.</span>
              )}
            </div>
            <textarea value={draft.originJournal} onChange={e => setDraft(d => ({ ...d, originJournal: e.target.value }))} rows={4} placeholder="그 계기가 약제사의 길로 어떻게 이어졌는지 짧게 기록하세요." />
            <details style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>직접 고르기 ▾</summary>
              <div style={{ marginTop: '0.4rem' }}>
                <WizardChoiceSelect value={draft.origin.name} items={bioChoices.origins as any[]} onChange={item => setDraft(d => ({ ...d, origin: item }))} />
              </div>
            </details>
          </div>
        </WizardFieldCard>
      )}

      {step === 3 && (
        <WizardFieldCard title="가방에 무엇을 챙겼나요?">
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ padding: '0.8rem', background: '#fff', border: '1px dashed var(--border-cozy)', borderRadius: '8px', lineHeight: 1.55 }}>
              벨트 칼, 나무 절구와 공이, 낡은 캠프 주전자, 이빨, 앞발/발톱을 챙겼습니다.<br />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>그리고 소중한 기념품 하나를 장신구 대신 들고 떠납니다. (규칙서 p.12: 기념품 장신구 1개로 시작)</span>
            </div>

            <textarea
              value={draft.mementoNote}
              onChange={e => setDraft(d => ({ ...d, mementoNote: e.target.value }))}
              rows={4}
              placeholder="첫 여정에 들고 가는 기념품이 무엇이고, 왜 소중한지 기록하세요."
            />
          </div>
        </WizardFieldCard>
      )}


      {step === 4 && (
        <WizardFieldCard title="함께하는 길동무는 누구인가요?">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input value={draft.familiarName} onChange={e => setDraft(d => ({ ...d, familiarName: e.target.value }))} placeholder="길동무의 이름을 지어주세요" />
            <CardDrawSlot
              variant="hero"
              label="길동무 정체성 카드 (p.14)"
              helper="약제사와 같은 동물 표를 사용합니다. 카드 한 장으로 길동무의 종족을 알아보세요."
              card={wizardCards.familiar || null}
              onCard={card => applyDescriptorCard('familiar', 'familiar', card)}
            />
            <div style={{ color: 'var(--text-bright)', fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center' }}>
              {wizardCards.familiar ? (
                <>당신의 길동무는 <strong style={{ color: 'var(--primary)' }}>{localizeCharacterDescriptor(draft.familiarDescriptor.name)}</strong> 유형입니다.<br /><span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{draft.familiarDescriptor.examples} 중에서 골라보세요.</span></>
              ) : (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>카드를 뽑으면 길동무의 종족이 정해집니다.</span>
              )}
            </div>
            {animalChips(draft.familiarDescriptor.examples, value => setDraft(d => ({ ...d, familiarAnimal: value })))}
            <input value={draft.familiarAnimal} onChange={e => setDraft(d => ({ ...d, familiarAnimal: e.target.value }))} placeholder="길동무의 실제 동물 또는 외형" />
            <textarea value={draft.familiarJournal} onChange={e => setDraft(d => ({ ...d, familiarJournal: e.target.value }))} rows={3} placeholder="처음 어떻게 만났는지 기록하세요." />
            <details style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>직접 고르기 ▾</summary>
              <div style={{ marginTop: '0.4rem' }}>
                <WizardChoiceSelect value={draft.familiarDescriptor.name} items={bioChoices.descriptors as any[]} onChange={item => setDraft(d => ({ ...d, familiarDescriptor: item, familiarAnimal: "" }))} />
              </div>
            </details>
          </div>
        </WizardFieldCard>
      )}

      {step === 5 && (() => {
        const matchedBenefit = FAMILIAR_BENEFITS.find(f => f.card === draft.familiarBenefit.card);
        return (
          <WizardFieldCard title="길동무가 어떻게 도와주나요?">
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <CardDrawSlot
                variant="hero"
                label="길동무 도움 카드 (p.15)"
                helper="카드 값이 길동무의 특기를 정합니다. Q와 K는 Monarch로 처리됩니다."
                card={wizardCards.familiarBenefit || null}
                onCard={applyBenefitCard}
              />
              <div style={{ padding: '0.8rem', background: '#fff', border: '1px dashed var(--border-cozy)', borderRadius: '8px', fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center' }}>
                {wizardCards.familiarBenefit ? (
                  <>
                    길동무의 특기: <strong style={{ color: 'var(--primary)' }}>{draft.familiarBenefit.name}</strong><br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{draft.familiarBenefit.desc}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>카드를 뽑으면 길동무의 도움이 정해집니다.</span>
                )}
              </div>

              {/* Resourceful familiar: select target reagent */}
              {matchedBenefit?.mechanic === 'resourceful' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.88rem' }}><strong>🌱 상시 채집할 약재 지정 (희귀도 7 이하):</strong></label>
                  <select
                    value={draft.resourcefulReagent}
                    onChange={e => setDraft(d => ({ ...d, resourcefulReagent: e.target.value }))}
                    style={{ padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border-cozy)' }}
                  >
                    <option value="">-- 약재 선택 --</option>
                    {REAGENTS.filter(r => r.baseRarity <= 7).map(r => (
                      <option key={r.id} value={r.displayName}>{r.displayName} (희귀도: {r.baseRarity})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ingenuitive familiar: select target tool */}
              {matchedBenefit?.mechanic === 'ingenuitive' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.88rem' }}><strong>⚒️ 모방할 추가 도구 지정:</strong></label>
                  <select
                    value={draft.ingenuitiveTool}
                    onChange={e => setDraft(d => ({ ...d, ingenuitiveTool: e.target.value }))}
                    style={{ padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border-cozy)' }}
                  >
                    <option value="">-- 도구 선택 --</option>
                    <option value="tool_crossbow">석궁 (Crossbow)</option>
                    <option value="tool_saddlebags">안장가방 (Saddlebags)</option>
                    <option value="tool_stilts">죽창 (Stilts)</option>
                    <option value="tool_mortar">나무 절구와 공이 (Mortar & Pestle)</option>
                    <option value="tool_kettle">낡은 캠프 주전자 (Kettle)</option>
                    <option value="tool_knife">벨트 칼 (Knife)</option>
                  </select>
                </div>
              )}

              <details style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>직접 고르기 ▾</summary>
                <div style={{ marginTop: '0.4rem' }}>
                  <WizardChoiceSelect value={draft.familiarBenefit.name} items={bioChoices.familiars as any[]} onChange={item => setDraft(d => ({ ...d, familiarBenefit: item }))} />
                </div>
              </details>
            </div>
          </WizardFieldCard>
        );
      })()}

      {step === 6 && (
        <WizardFieldCard title="길동무와 어떤 사이인가요?">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <CardDrawSlot
              variant="hero"
              label="관계 카드 (p.16)"
              helper="카드 값이 약제사와 길동무 사이의 관계를 정합니다."
              card={wizardCards.relationship || null}
              onCard={applyRelationshipCard}
            />
            <div style={{ fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center' }}>
              {wizardCards.relationship ? (
                <>
                  둘의 관계: <strong style={{ color: 'var(--primary)' }}>{draft.relationship.name}</strong><br />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{draft.relationship.desc}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>카드를 뽑으면 관계가 정해집니다.</span>
              )}
            </div>
            <textarea value={draft.relationshipJournal} onChange={e => setDraft(d => ({ ...d, relationshipJournal: e.target.value }))} rows={4} placeholder="둘의 관계를 보여주는 짧은 장면이나 기억을 기록하세요." />
            <details style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>직접 고르기 ▾</summary>
              <div style={{ marginTop: '0.4rem' }}>
                <WizardChoiceSelect value={draft.relationship.name} items={bioChoices.relationships as any[]} onChange={item => setDraft(d => ({ ...d, relationship: item }))} />
              </div>
            </details>
          </div>
        </WizardFieldCard>
      )}

      {step === 7 && (() => {
        const matchedBenefit = FAMILIAR_BENEFITS.find(f => f.card === draft.familiarBenefit.card);
        return (
          <WizardFieldCard title="시트를 확정할까요?">
            <div style={{ display: 'grid', gap: '0.7rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
              <div className="prose-summary">
                <strong>{localizeCharacterDescriptor(draft.descriptor.name)}</strong> 약제사 <strong>{draft.name || '(이름 미정)'}</strong>.<br />
                {draft.animal && <>{draft.animal}의 모습으로, </>}<strong>{localizeTravelStyle(draft.travel.name)}</strong> 방식으로 여행합니다.<br />
                <span className="dim">하루 {draft.travel.speed}경로 이동, 짐 {draft.travel.carry}칸. 출발 동기: {draft.origin.name}.</span>
              </div>
              <div className="prose-summary" style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '0.6rem' }}>
                길동무 <strong>{draft.familiarName || '(이름 미정)'}</strong>{draft.familiarAnimal && `, ${draft.familiarAnimal}`}.<br />
                특기: <strong>{draft.familiarBenefit.name}</strong>
                {matchedBenefit?.mechanic === 'resourceful' && draft.resourcefulReagent && ` (지정 약재: ${draft.resourcefulReagent})`}
                {matchedBenefit?.mechanic === 'ingenuitive' && draft.ingenuitiveTool && ` (지정 도구: ${draft.ingenuitiveTool})`}
                .<br />
                관계: {draft.relationship.name}.
              </div>
              <button type="button" onClick={saveCharacter} style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem' }}>
                ✨ 약제사 시트에 저장
              </button>
            </div>
          </WizardFieldCard>
        );
      })()}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.9rem' }}>
        <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ padding: '0.45rem 0.8rem', borderRadius: '6px', background: step === 0 ? '#eee' : '#fff', color: step === 0 ? '#aaa' : 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>이전</button>
        <button type="button" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1} style={{ padding: '0.45rem 0.8rem', borderRadius: '6px', background: step === steps.length - 1 ? '#eee' : 'var(--secondary)', color: step === steps.length - 1 ? '#aaa' : '#fff', border: 'none' }}>다음</button>
      </div>
    </div>
  );
}

function BioView({ state, updateState, currentWeight, handleRetireClick }: { state: GameState; updateState: any; currentWeight: number; handleRetireClick: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.bio.name);
  const [familiarName, setFamiliarName] = useState(state.bio.familiarName);
  const [familiarBenefitEdit, setFamiliarBenefitEdit] = useState(state.bio.familiarBenefit);
  const [resourcefulReagentEdit, setResourcefulReagentEdit] = useState(state.resourcefulReagent || "");
  const [ingenuitiveToolEdit, setIngenuitiveToolEdit] = useState(state.ingenuitiveTool || "");
  const [canFly, setCanFly] = useState(!!state.bio.canFly);
  const [canFlyOverride, setCanFlyOverride] = useState(!!state.canFlyOverride);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setName(state.bio.name);
      setFamiliarName(state.bio.familiarName);
      setFamiliarBenefitEdit(state.bio.familiarBenefit);
      setResourcefulReagentEdit(state.resourcefulReagent || "");
      setIngenuitiveToolEdit(state.ingenuitiveTool || "");
      setCanFly(!!state.bio.canFly);
      setCanFlyOverride(!!state.canFlyOverride);
    });
    return () => { cancelled = true; };
  }, [state]);

  const [newTrinket, setNewTrinket] = useState("");
  const [newBagItemName, setNewBagItemName] = useState("");
  const [newBagItemWeight, setNewBagItemWeight] = useState<number>(1/3);
  const [patienceOverride, setPatienceOverride] = useState(false);

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFamiliar = FAMILIAR_BENEFITS.find(f => f.name === familiarBenefitEdit) || FAMILIAR_BENEFITS[0];
    
    if (!canFly && !canFlyOverride && state.bio.travelStyle === '가볍고 신속하게') {
      showAlert("⚠️ 경고: 비행 능력이 없고 하우스 룰의 비행 제약 무시도 꺼져 있습니다. 비행 이동 스타일 '가볍고 신속하게'를 유지할 수 없어 기본 이동 스타일 '천천히 꾸준하게'로 전환됩니다.");
      updateState((s: GameState) => ({
        ...s,
        bio: {
          ...s.bio,
          name,
          familiarName,
          familiarBenefit: familiarBenefitEdit,
          canFly: false,
          travelStyle: '천천히 꾸준하게',
          speed: 2,
          carry: 5
        },
        canFlyOverride: false,
        resourcefulReagent: selectedFamiliar.mechanic === 'resourceful' ? resourcefulReagentEdit : "",
        ingenuitiveTool: selectedFamiliar.mechanic === 'ingenuitive' ? ingenuitiveToolEdit : ""
      }));
    } else {
      updateState((s: GameState) => ({
        ...s,
        bio: {
          ...s.bio,
          name,
          familiarName,
          familiarBenefit: familiarBenefitEdit,
          canFly: s.rulesetId === 'original-1e-3p' ? s.bio.travelStyle === '가볍고 신속하게' : canFly
        },
        canFlyOverride: s.rulesetId === 'original-1e-3p' ? false : canFlyOverride,
        resourcefulReagent: selectedFamiliar.mechanic === 'resourceful' ? resourcefulReagentEdit : "",
        ingenuitiveTool: selectedFamiliar.mechanic === 'ingenuitive' ? ingenuitiveToolEdit : ""
      }));
    }
    setEditing(false);
    showAlert(`캐릭터 프로필이 저장되었습니다.\n길동무 혜택: ${familiarBenefitEdit}`);
  };

  const handleAddTrinket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrinket.trim()) return;
    const timestamp = Date.now();
    const trinketName = newTrinket.trim();
    updateState(s => ({
      ...s,
      trinkets: [...s.trinkets, trinketName],
      trinketArchive: addTrinketMemory(s.trinketArchive || [], {
        sourceId: memoryKey('manual_trinket', trinketName, String(timestamp)),
        name: trinketName,
        count: 1,
        source: '손으로 적은 장신구 메모',
        story: `${s.currentLocationName}에서 장신구 보관함에 넣었습니다.`,
        locationName: s.currentLocationName,
        timestamp,
        spent: false
      })
    }));
    setNewTrinket("");
  };

  const handleAddBagItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBagItemName.trim()) return;
    updateState(s => {
      const newItem: BagItem = {
        id: 'user_item_' + Date.now(),
        name: newBagItemName.trim(),
        weight: newBagItemWeight,
        type: 'item',
        qty: 1
      };
      return {
        ...s,
        bag: [...s.bag, newItem]
      };
    });
    setNewBagItemName("");
  };

  const handleRemoveBagItem = (id: string) => {
    if (askWindowConfirm("이 아이템을 가방에서 버리시겠습니까?")) {
      updateState(s => ({
        ...s,
        bag: s.bag.filter(item => item.id !== id)
      }));
    }
  };

  const handleToggleBandolier = (itemId: string) => {
    updateState(s => {
      const nextBag = s.bag.map(item => {
        if (item.id === itemId) {
          return { ...item, inBandolier: !item.inBandolier };
        }
        return item;
      });
      return { ...s, bag: nextBag };
    });
  };

  return (
    <div className="parchment-panel cute-border" style={{ padding: '1.8rem', background: '#fffdf9' }}>

      {/* 1. Header with custom fonts */}
      <div className="bio-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid var(--border-cozy)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--secondary)', fontFamily: 'var(--font-fancy)' }}>약제사 기록 시트</h2>
        <div className="bio-page-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleRetireClick}
            style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <span className="emoji-icon" aria-hidden="true">🍂</span> 은퇴 및 대승계
          </button>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', border: 'none', boxShadow: 'var(--shadow-sm)' }}>
              <span className="emoji-icon" aria-hidden="true">✏️</span> 프로필 편집
            </button>
          )}
        </div>
      </div>

      <CharacterCreationWizard state={state} updateState={updateState} />

      {!editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Top Row: PoulticePounder Profile & Familiar Box */}
          <div className="grid-2col">

            {/* PoulticePounder (약제사) */}
            <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🦡</span>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>약제사 정보</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><strong>약제사 이름:</strong> {state.bio.name || '미등록'}</div>
                <div><strong>실제 동물:</strong> {state.bio.animal || '미정'}</div>
                <div><strong>종족 구분:</strong> {localizeCharacterDescriptor(state.bio.descriptor)} ({state.bio.examples})</div>
                <div><strong>이동 스타일:</strong> {localizeTravelStyle(state.bio.travelStyle)}</div>
                <div><strong>비행 능력:</strong> {state.bio.canFly ? '가능 🦅' : '불가능 ❌'} {state.canFlyOverride && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(하우스 룰 허용됨)</span>}</div>
                <div><strong>출발 동기:</strong> <span style={{ color: 'var(--text-muted)' }}>{state.bio.originName}</span></div>
                {state.bio.originJournal && (
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.55 }}>{state.bio.originJournal}</p>
                )}
                {state.bio.mementoNote && (
                  <div>
                    <strong>첫 기념품:</strong>
                    <p style={{ margin: '0.2rem 0 0', whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.55 }}>{state.bio.mementoNote}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px dashed #e5dec9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <div><strong>이동 속도:</strong> {getTravelSpeed(state, currentWeight)} (기본: {state.bio.speed})</div>
                  <div><strong>가방 소지 한도:</strong> {getMaxCarry(state)} (기본: {state.bio.carry})</div>
                </div>
              </div>
            </div>

            {/* Familiar (길동무) */}
            <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🐿️</span>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>길동무</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><strong>길동무 이름:</strong> {state.bio.familiarName || '이름 없음'}</div>
                <div><strong>길동무 동물:</strong> {state.bio.familiarAnimal || state.bio.familiarExamples || '미정'}</div>
                <div><strong>길드 관계:</strong> {state.bio.familiarRelation}</div>
                {state.bio.familiarJournal && (
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.55 }}>{state.bio.familiarJournal}</p>
                )}
                {state.bio.relationshipJournal && (
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.55 }}>{state.bio.relationshipJournal}</p>
                )}
                <div style={{ background: '#f3faf5', borderRadius: '8px', padding: '0.6rem', border: '1px solid #c8e6c9' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.2rem' }}>
                    {(() => {
                      const fb = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit);
                      return fb ? `🃏 카드 ${fb.card}: ${fb.name}` : `🃏 ${state.bio.familiarBenefit}`;
                    })()}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#3d824d' }}>
                    {(() => {
                      const fb = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit);
                      return fb ? fb.desc : '';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Bags Table & Journey Calendar */}
          <div className="grid-bio-middle">

            {/* Bags (배낭 보관함) */}
            <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff' }}>
              {(() => {
                const hasBandolier = hasTool(state, 'tool_bandolier') || hasTool(state, 'Greenpaw Bandolier');
                
                let bandolierLoad = 0;
                state.bag.forEach(item => {
                  if (hasBandolier && item.inBandolier && isEligibleForBandolier(item)) {
                    bandolierLoad += item.weight * (item.qty || 1);
                  }
                });

                const toolItems = state.bag.filter(item => item.id.startsWith("tool_") || item.type === 'tool');
                const reagentItems = state.bag.filter(item => !item.id.startsWith("tool_") && item.type !== 'tool');

                return (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>🎒 배낭 수집물</h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          총 무게: <span style={{ color: currentWeight > getMaxCarry(state) ? 'var(--accent-red)' : 'var(--primary)', fontWeight: 'bold' }}>{formatWeight(currentWeight)}</span> / {getMaxCarry(state)}
                        </span>
                      </div>
                      {hasBandolier && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          <span>🎽 반도리어 수납 무게: <span style={{ color: bandolierLoad > 5 ? 'var(--accent-red)' : 'var(--primary)', fontWeight: 'bold' }}>{formatWeight(bandolierLoad)}</span> / 5</span>
                          {bandolierLoad > 5 && <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>(용량 초과! ⚠️)</span>}
                        </div>
                      )}
                    </div>

                    {/* Table A: Tools & Equipment */}
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>🛠️ 도구 및 장비</h4>
                      <div style={{ overflowX: 'auto', maxHeight: '150px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1.5px solid var(--border-cozy)', color: 'var(--text-muted)', background: '#fafafa' }}>
                              <th style={{ padding: '0.4rem 0.5rem' }}>도구명</th>
                              <th style={{ padding: '0.4rem 0.5rem', width: '80px' }}>무게</th>
                              <th style={{ padding: '0.4rem 0.5rem', width: '50px' }}>삭제</th>
                            </tr>
                          </thead>
                          <tbody>
                            {toolItems.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.4rem 0.5rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>{localizeInventoryItemName(item.name)}</td>
                                <td style={{ padding: '0.4rem 0.5rem' }}>{formatWeight(item.weight)}</td>
                                <td style={{ padding: '0.4rem 0.5rem' }}>
                                  {!item.id.startsWith("tool_") ? (
                                    <button onClick={() => handleRemoveBagItem(item.id)} style={{ background: 'transparent', color: 'var(--accent-red)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>❌</button>
                                  ) : (
                                    <span style={{ color: 'var(--text-dim)' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {toolItems.length === 0 && (
                              <tr>
                                <td colSpan={3} style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>도구가 없습니다.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Table B: Reagents & Items */}
                    <div>
                      <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>🌿 영약재 및 수집물</h4>
                      <div style={{ overflowX: 'auto', maxHeight: '200px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1.5px solid var(--border-cozy)', color: 'var(--text-muted)', background: '#fafafa' }}>
                              <th style={{ padding: '0.4rem 0.5rem' }}>영약재명</th>
                              <th style={{ padding: '0.4rem 0.5rem', width: '80px' }}>무게</th>
                              {hasBandolier && <th style={{ padding: '0.4rem 0.5rem', width: '100px' }}>반도리어</th>}
                              <th style={{ padding: '0.4rem 0.5rem', width: '50px' }}>삭제</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reagentItems.map(item => {
                              const eligible = isEligibleForBandolier(item);
                              const inBando = item.inBandolier && eligible;
                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: inBando ? '#f3faf5' : 'transparent' }}>
                                  <td style={{ padding: '0.4rem 0.5rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>
                                    {localizeInventoryItemName(item.name)}
                                    {inBando && <span style={{ color: '#16a34a', fontSize: '0.7rem', marginLeft: '0.3rem', fontWeight: 'bold', background: '#dcfce7', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>🎽 반도리어</span>}
                                  </td>
                                  <td style={{ padding: '0.4rem 0.5rem' }}>
                                    {inBando ? (
                                      <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)' }}>
                                        {formatWeight(item.weight)}
                                      </span>
                                    ) : (
                                      formatWeight(item.weight)
                                    )}
                                  </td>
                                  {hasBandolier && (
                                    <td style={{ padding: '0.4rem 0.5rem' }}>
                                      {eligible ? (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBandolier(item.id)}
                                          style={{
                                            background: inBando ? '#fee2e2' : '#dcfce7',
                                            color: inBando ? '#dc2626' : '#16a34a',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '0.15rem 0.4rem',
                                            fontSize: '0.72rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {inBando ? "🎒 배낭으로" : "🎽 수납"}
                                        </button>
                                      ) : (
                                        <span style={{ color: 'var(--text-dim)' }}>-</span>
                                      )}
                                    </td>
                                  )}
                                  <td style={{ padding: '0.4rem 0.5rem' }}>
                                    <button onClick={() => handleRemoveBagItem(item.id)} style={{ background: 'transparent', color: 'var(--accent-red)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>❌</button>
                                  </td>
                                </tr>
                              );
                            })}
                            {reagentItems.length === 0 && (
                              <tr>
                                <td colSpan={hasBandolier ? 4 : 3} style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>영약재가 없습니다.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}

              <form onSubmit={handleAddBagItem} className="grid-bag-add-form" style={{ marginTop: '0.8rem', borderTop: '1px dashed #eee', paddingTop: '0.8rem' }}>
                <input
                  type="text"
                  placeholder="아이템 이름 수동 기입..."
                  value={newBagItemName}
                  onChange={e => setNewBagItemName(e.target.value)}
                  style={{ height: '36px', fontSize: '0.85rem' }}
                />
                <select value={newBagItemWeight} onChange={e => setNewBagItemWeight(parseFloat(e.target.value))} style={{ height: '36px', fontSize: '0.85rem' }}>
                  <option value={0.3333333333333333}>무게 1/3</option>
                  <option value={0.6666666666666666}>무게 2/3</option>
                  <option value={1.0}>무게 1.0</option>
                  <option value={0.0}>무게 0</option>
                </select>
                <button type="submit" style={{ background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', height: '36px' }}>🎒 추가</button>
              </form>
            </div>

            {/* Journey & Calendar */}
            <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', marginBottom: '0.8rem', fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>🧭 여정 계획</h3>
                {state.journeyActive ? (
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div><strong>목적지:</strong> {state.journeyDestination}</div>
                    <div><strong>목표:</strong> {state.journeyGoalTitle}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: '#faf6ee', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5dec9' }}>
                      {localizeJourneyGoalText(state.journeyGoalDesc)}
                    </div>
                    <div><strong>방향/방위:</strong> {state.journeyDirection}</div>
                    <div><strong>거리 형태:</strong> {state.journeyDistance} · 총거리 <span style={{ fontWeight: 700 }}>{state.journeyTotalDistance || 0}경로</span> · 일일 이동력 <strong>{state.journeyActive ? getTravelSpeed(state, currentWeight) : state.bio.speed}</strong>경로</div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                    활성화된 여정이 없습니다.
                  </div>
                )}
              </div>

              {/* Calendar stamp grid */}
              <div style={{ borderTop: '1.5px dashed var(--border-cozy)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--secondary)', fontFamily: 'var(--font-fancy)' }}>📅 일정 소모 기록</h4>
                {state.journeyActive ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {Array.from({ length: state.calendarMaxDays }).map((_, idx) => {
                        const isPassed = idx < state.calendarDays;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isPassed) {
                                updateState((s: any) => ({ ...s, calendarDays: idx }));
                              } else {
                                updateState((s: any) => ({ ...s, calendarDays: idx + 1 }));
                              }
                            }}
                            style={{
                              aspectRatio: '1',
                              border: '1.5px solid var(--border-cozy)',
                              borderRadius: '4px',
                              background: isPassed ? 'var(--secondary-light)' : '#fff',
                              color: 'var(--secondary)',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: isPassed ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                          >
                            {isPassed ? '印' : idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                      하루 소모 시 각 칸을 눌러 도장(印)을 찍으세요. ({state.calendarDays} / {state.calendarMaxDays}일 경과)
                    </div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center' }}>
                    여정 출발 후 달력 도장판이 나타납니다.
                  </div>
                )}
              </div>

              {/* Patience Tracker (인내심 기록) */}
              <div style={{ borderTop: '1.5px dashed var(--border-cozy)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--secondary)', fontFamily: 'var(--font-fancy)' }}>⏱️ 환자 인내심 기록</h4>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={patienceOverride}
                      onChange={e => setPatienceOverride(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    수동 편집 허용
                  </label>
                </div>
                {state.activeAilment ? (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '0.5rem' }}>
                      {(() => {
                        const maxTimer = state.activeAilment.maxTimer;
                        const timer = state.activeAilment.timer;
                        const spent = maxTimer - timer;
                        return Array.from({ length: maxTimer }).map((_, idx) => {
                          const isChecked = idx < spent;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!patienceOverride}
                              onClick={() => {
                                if (!patienceOverride) return;
                                let nextSpent;
                                if (isChecked) {
                                  nextSpent = idx;
                                } else {
                                  nextSpent = idx + 1;
                                }
                                const nextTimer = Math.max(0, maxTimer - nextSpent);
                                updateState((s: GameState) => {
                                  if (!s.activeAilment) return s;
                                  return {
                                    ...s,
                                    patients: updateActivePatient(s, patient => ({
                                      ...patient,
                                      timers: patient.timers.map(timer => timer.ailmentInstanceId === s.activeAilment!.id
                                        ? { ...timer, current: nextTimer, status: nextTimer === 0 ? 'expired' : 'active' }
                                        : timer)
                                    }))
                                  };
                                });
                              }}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                border: '2px solid var(--primary)',
                                background: isChecked ? 'var(--primary)' : 'transparent',
                                cursor: patienceOverride ? 'pointer' : 'default',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isChecked ? '#fff' : 'transparent',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                padding: 0,
                                transition: 'all 0.2s'
                              }}
                              title={isChecked ? `소모 시간: ${idx + 1}시간` : `남은 시간: ${idx + 1}시간`}
                            >
                              {isChecked ? "✓" : (idx + 1)}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>남은 치료 시간: {state.activeAilment.timer} / {state.activeAilment.maxTimer}시간</span>
                      {state.activeAilment.timer === 0 && <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>⚠️ 시간 초과!</span>}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center' }}>
                    돌보고 있는 환자가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Companions, Guild, Trinkets */}
          <div className="grid-2col">

            {/* Companions & Trinkets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Companions (동반자) */}
              <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>🪲</span>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>동반자 곤충</h3>
                </div>
                {state.companionStates && state.companionStates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {state.companionStates.map(comp => {
                      const dbComp = COMPANIONS_DB.find(c => canonicalCompanionId(c.id) === canonicalCompanionId(comp.companionId));
                      return (
                        <div key={comp.instanceId} style={{ padding: '0.6rem', background: '#fcfaf6', borderRadius: '8px', border: '1px solid var(--border-cozy)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>
                            <span>🪲 {dbComp?.name || comp.companionId}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>경로 {comp.pathsTravelled}/10개</span>
                          </div>
                          {dbComp && (
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.3rem', lineHeight: '1.4' }}>
                              {dbComp.desc}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    아직 고용된 곤충 동반자가 없습니다. 도시의 길드 편의소에서 입양하여 여행의 조력자로 삼으세요.
                  </div>
                )}
              </div>

              {/* Trinkets (장신구) */}
              <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>🪙 물꼬 장신구</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>보유: {state.trinkets.length}개</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                  {state.trinkets.map((t, idx) => (
                    <span key={idx} style={{ padding: '0.3rem 0.6rem', background: '#fff9ef', border: '1.5px solid var(--secondary)', color: 'var(--secondary-hover)', borderRadius: '20px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      🪙 {localizeInventoryItemName(t)}
                      <button
                        onClick={() => {
                          if (askWindowConfirm("이 장신구를 물꼬 거래나 조력에 소모하시겠습니까?")) {
                            updateState((s: any) => {
                              const next = [...s.trinkets];
                              const spentName = next[idx];
                              next.splice(idx, 1);
                              let marked = false;
                              const trinketArchive = (s.trinketArchive || []).map((record: TrinketMemoryRecord) => {
                                if (!marked && !record.spent && record.name === spentName) {
                                  marked = true;
                                  return { ...record, spent: true, story: `${record.story}\n${s.currentLocationName}에서 주머니로부터 꺼내 사용했습니다.` };
                                }
                                return record;
                              });
                              return { ...s, trinkets: next, trinketArchive };
                            });
                          }
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                      >
                        ✖
                      </button>
                    </span>
                  ))}
                  {state.trinkets.length === 0 && <span style={{ fontStyle: 'italic', color: 'var(--text-dim)', fontSize: '0.85rem' }}>보유한 장신구가 없습니다.</span>}
                </div>
                <form onSubmit={handleAddTrinket} style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="장신구 직접 기입..."
                    value={newTrinket}
                    onChange={e => setNewTrinket(e.target.value)}
                    style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                  />
                  <button type="submit" style={{ padding: '0 0.8rem', background: 'var(--secondary)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', height: '36px' }}>추가</button>
                </form>
              </div>
            </div>

            {/* The Guild (약제사 치유 길드) */}
            <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', marginBottom: '0.8rem', fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>🛡️ 치유 길드 명성</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf6ee', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e5dec9', marginBottom: '1rem' }}>
                  <div><strong>길드 명성 수치:</strong></div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{state.reputation}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                  {[
                    { label: '미등록 (0+)', minRep: 0 },
                    { label: '인지도 있음 (15+)', minRep: 15 },
                    { label: '명망 높음 (25+)', minRep: 25 },
                    { label: '신뢰받음 (35+)', minRep: 35 }
                  ].map(level => {
                    const isActive = state.reputation >= level.minRep;
                    return (
                      <div key={level.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActive ? 'var(--text-bright)' : 'var(--text-dim)', fontWeight: isActive ? 'bold' : 'normal' }}>
                        <div style={{ width: '18px', height: '18px', border: '2.2px solid var(--border-cozy)', borderRadius: '4px', background: isActive ? 'var(--primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                          {isActive && '✓'}
                        </div>
                        <span>{level.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '10px 0 0 0', borderTop: '1px dashed #eee', paddingTop: '0.8rem', lineHeight: '1.4' }}>
                성공적으로 약제 처방을 마칠 때마다 명성이 올라갑니다. 높은 길드 단계에서는 새로운 마차 확장 칸과 업그레이드가 개방됩니다.
              </p>
            </div>
          </div>

          {/* Stamped Icons: Preparation Methods */}
          <div style={{ borderTop: '2.5px solid var(--border-cozy)', paddingTop: '1.2rem', marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--primary)', textAlign: 'center', marginBottom: '1rem', fontFamily: 'var(--font-fancy)' }}>🔬 약제 조제 기법 도장</h3>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
              {[
                { label: '빻기/갈기', sub: '빻기, p.12' },
                { label: '끓이기', sub: '끓이기, p.12' },
                { label: '씹기/소화', sub: '씹기, p.12' },
                { label: '바르기/부착', sub: '바르기, p.12' },
                { label: '이중탕', sub: '이중탕, p.66' },
                { label: '두드리기', sub: '두드리기, p.68' },
                { label: '촉매작용', sub: '촉매작용, p.83' },
                { label: '증류하기', sub: '증류, p.82' },
                { label: '보존하기', sub: '보존, p.82' },
                { label: '요리하기', sub: '요리, p.62' },
                { label: '정화하기', sub: '정화, p.180' }
              ].map((stamp, idx) => (
                <div
                  key={idx}
                  className="stamped-icon"
                  style={{
                    transform: `rotate(${((idx % 3) - 1) * 5}deg)`,
                    borderColor: idx < 5 ? 'var(--primary)' : 'var(--secondary)',
                    color: idx < 5 ? 'var(--primary)' : 'var(--secondary)',
                    background: idx < 5 ? '#f3faf5' : '#faf5f0',
                    width: '64px',
                    height: '64px',
                    fontSize: '0.7rem'
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{stamp.label}</span>
                  <span style={{ fontSize: '0.5rem', opacity: 0.8, marginTop: '1px' }}>{stamp.sub}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <form onSubmit={handleSaveBio} className="cute-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem', maxWidth: '500px', background: '#fff' }}>
          <h3 style={{ borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', fontFamily: 'var(--font-fancy)', color: 'var(--secondary)', fontSize: '1.4rem' }}>🔧 약제사 프로필 수정</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label><strong>약제사 이름:</strong></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="약제사 동물의 이름을 지어주세요" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label><strong>길동무 이름:</strong></label>
            <input type="text" value={familiarName} onChange={e => setFamiliarName(e.target.value)} placeholder="길동무의 이름을 지어주세요" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label><strong>🃏 길동무 혜택 (p.14-15):</strong></label>
            <select
              value={familiarBenefitEdit}
              onChange={e => setFamiliarBenefitEdit(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-cozy)', fontSize: '0.9rem' }}
            >
              {FAMILIAR_BENEFITS.map(f => (
                <option key={f.mechanic} value={f.name}>
                  카드 {f.card}: {f.name}
                </option>
              ))}
            </select>
            {FAMILIAR_BENEFITS.find(f => f.name === familiarBenefitEdit) && (
              <div style={{ fontSize: '0.82rem', color: '#3d824d', background: '#f3faf5', borderRadius: '6px', padding: '0.4rem 0.6rem', border: '1px solid #c8e6c9' }}>
                ✨ {FAMILIAR_BENEFITS.find(f => f.name === familiarBenefitEdit)!.desc}
              </div>
            )}

            {/* Resourceful familiar: select target reagent */}
            {FAMILIAR_BENEFITS.find(f => f.name === familiarBenefitEdit)?.mechanic === 'resourceful' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.88rem' }}><strong>🌱 상시 채집할 약재 지정:</strong></label>
                <select
                  value={resourcefulReagentEdit}
                  onChange={e => setResourcefulReagentEdit(e.target.value)}
                  style={{ padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border-cozy)' }}
                >
                  <option value="">-- 약재 선택 --</option>
                  {REAGENTS.filter(r => r.baseRarity <= 7).map(r => (
                    <option key={r.id} value={r.displayName}>{r.displayName} (희귀도: {r.baseRarity})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Ingenuitive familiar: select target tool */}
            {FAMILIAR_BENEFITS.find(f => f.name === familiarBenefitEdit)?.mechanic === 'ingenuitive' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.88rem' }}><strong>⚒️ 모방할 추가 도구 지정:</strong></label>
                <select
                  value={ingenuitiveToolEdit}
                  onChange={e => setIngenuitiveToolEdit(e.target.value)}
                  style={{ padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border-cozy)' }}
                >
                  <option value="">-- 도구 선택 --</option>
                  <option value="tool_crossbow">석궁 (Crossbow)</option>
                  <option value="tool_saddlebags">안장가방 (Saddlebags)</option>
                  <option value="tool_stilts">죽창 (Stilts)</option>
                  <option value="tool_mortar">나무 절구와 공이 (Mortar & Pestle)</option>
                  <option value="tool_kettle">낡은 캠프 주전자 (Kettle)</option>
                  <option value="tool_knife">벨트 칼 (Knife)</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px dashed #eee', paddingTop: '0.8rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
              <input
                type="checkbox"
                checked={canFly}
                onChange={e => setCanFly(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <strong>🦅 비행 능력 보유</strong>
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '26px' }}>
              조류나 박쥐 등 선천적인 날개를 가진 종족일 경우 체크합니다.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
              <input
                type="checkbox"
                checked={canFlyOverride}
                onChange={e => setCanFlyOverride(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <strong>하우스 룰: 비행 제약 무시</strong>
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '26px' }}>
              선천적인 비행 능력이 없더라도 '가볍고 신속하게' 이동 스타일을 허용합니다.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem' }}>저장</button>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: '0.6rem 1.2rem', background: '#ccc', color: '#333', borderRadius: '8px', fontSize: '0.95rem' }}>취소</button>
          </div>
        </form>
      )}
    </div>
  );
}

// =================================================================
// 7. REAGENTS VIEW COMPONENT
// =================================================================
function ReagentsView({ state, updateState, search, setSearch, filter, setFilter, typeFilter, setTypeFilter }: { state: GameState; updateState: any; search: string; setSearch: any; filter: string; setFilter: any; typeFilter: string; setTypeFilter: any }) {
  const filtered = REAGENTS.map(reagentDisplayRecord).filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.rawName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || r.preps.toLowerCase().includes(filter.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem' }}>영약재 관찰 기록</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        각 영약재 부위는 특정한 조제법(빻기, 끓이기, 바르기 등)을 통과해 질병 증상을 치료할 수 있는 고유 약효를 냅니다.
      </p>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="기록장에서 영약재 이름 뒤적이기..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">모든 분류</option>
          <option value="PLANT">풀과 나무</option>
          <option value="ANIMAL">야수의 흔적</option>
          <option value="INSECT">곤충과 벌레</option>
          <option value="EARTH">흙과 돌</option>
          <option value="TITAN">거수의 조각</option>
        </select>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">약효별로 대조하기</option>
          <option value="pain">통증</option>
          <option value="wound">상처</option>
          <option value="infection">감염</option>
          <option value="parasite">기생충</option>
          <option value="senses">감각</option>
          <option value="sleep">수면</option>
          <option value="breath">호흡</option>
          <option value="burn">화상</option>
          <option value="fur">털</option>
          <option value="feather">깃털</option>
          <option value="hide">가죽</option>
          <option value="scale">비늘</option>
          <option value="poison">독</option>
          <option value="stomach">위장</option>
          <option value="temperature">체온</option>
          <option value="joy">기쁨</option>
          <option value="mood">기분</option>
          <option value="instinct">본능</option>
          <option value="elsewhere">저편</option>
        </select>
      </div>

      <div className="grid-reagents" style={{ padding: '0.5rem' }}>
        {filtered.map((r, i) => (
          <div key={i} className="cute-card" style={{ background: '#fafafa' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>{r.name}</span>
              <span style={{ fontSize: '0.85rem', background: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#555' }}>
                기본 희귀도: {r.br}
              </span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>분류:</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', background: '#eef2f7', color: '#3182ce', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {localizeReagentType(r.type)}
                </span>

                {r.regions && r.regions.length > 0 && (
                  <>
                    <span style={{ color: 'var(--text-dim)' }}>|</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>자생지:</span>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {r.regions.map((reg, idx) => {
                        const koReg: { [key: string]: string } = {
                          'Bog': '늪지', 'Forest': '숲', 'Loch': '호수', 'Meadow': '초원', 'Mountain': '산맥', 'Titan': '티탄유적'
                        };
                        return (
                          <span key={idx} style={{ fontSize: '0.78rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            {koReg[reg] || reg}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}

                {r.seasons && r.seasons.length > 0 && (
                  <>
                    <span style={{ color: 'var(--text-dim)' }}>|</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>채집 계절:</span>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {r.seasons.map((seas, idx) => {
                        const koSeas: { [key: string]: string } = {
                          'Spring': '봄', 'Summer': '여름', 'Autumn': '가을', 'Winter': '겨울'
                        };
                        const seasLabel = koSeas[seas] || seas;
                        let bg = '#fff5f5';
                        let co = '#e53e3e';
                        if (seasLabel === '봄') { bg = '#f0fff4'; co = '#38a169'; }
                        if (seasLabel === '여름') { bg = '#ebf8ff'; co = '#3182ce'; }
                        if (seasLabel === '가을') { bg = '#fffaf0'; co = '#dd6b20'; }
                        if (seasLabel === '겨울') { bg = '#f7fafc'; co = '#4a5568'; }
                        return (
                          <span key={idx} style={{ fontSize: '0.78rem', background: bg, color: co, padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            {seasLabel}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              {r.description && (
                <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.88rem', lineHeight: '1.4' }}>
                  {r.description}
                </p>
              )}
            </div>

            <div style={{ marginTop: '0.6rem', fontSize: '0.92rem', background: '#fff', padding: '0.8rem', borderRadius: '6px', border: '1px solid #eee' }}>
              <strong>📋 부위별 조제 성분:</strong>
              <div style={{ marginTop: '0.3rem', lineHeight: '1.5', color: '#333' }}>
                {renderPreps(r.preps)}
              </div>
            </div>

            {state.journeyActive && state.rulesetId === 'sandbox' && (
              <button
                onClick={() => {
                  const parts = splitReagentPreparations(r.preps);
                  const chosenPart = window.prompt(`가방에 넣을 ${r.name} 부위를 선택하세요:\n${parts.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}`);
                  if (!chosenPart) return;
                  const partText = parts[Math.max(0, (parseInt(chosenPart) || 1) - 1)] || parts[0];
                  updateState(s => {
                    const item = createPreparedReagentItem(r, partText, 'user_reag');
                    return {
                      ...s,
                      bag: [...s.bag, item]
                    };
                  });
                  showAlert(`${r.name}을 수동으로 배낭에 추가했습니다.`);
                }}
                style={{ width: '100%', padding: '0.3rem', marginTop: '0.6rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.8rem' }}
              >
                🧺 배낭에 수동 획득 추가
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =================================================================
// 8. AILMENTS VIEW COMPONENT
// =================================================================
function AilmentsView({ state, updateState, search, setSearch, filter, setFilter }: { state: GameState; updateState: any; search: string; setSearch: any; filter: string; setFilter: any }) {
  const cleanAilmentName = (n: string) => n.replace(/^PAGE\s*\d+\s*(---|--|-)\s*/i, '');

  const filtered = AILMENTS.map(ailmentDisplayRecord).filter(a => {
    const cleaned = cleanAilmentName(a.name);
    const matchesSearch = cleaned.toLowerCase().includes(search.toLowerCase()) || a.rawName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || a.tags.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem' }}>병세와 처방 관찰</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        약제사는 길녘에서 만나는 야수들의 다양한 병증을 살핍니다. 환자의 병명을 이 기록에서 대조하여 알맞은 탕약을 지으세요.
      </p>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="기록장에서 병색 찾아보기..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">약효별로 대조하기</option>
          <option value="pain">통증</option>
          <option value="wound">상처</option>
          <option value="infection">감염</option>
          <option value="parasite">기생충</option>
          <option value="senses">감각</option>
          <option value="sleep">수면</option>
          <option value="breath">호흡</option>
          <option value="burn">화상</option>
          <option value="fur">털</option>
          <option value="feather">깃털</option>
          <option value="hide">가죽</option>
          <option value="scale">비늘</option>
          <option value="poison">독</option>
          <option value="stomach">위장</option>
          <option value="temperature">체온</option>
          <option value="joy">기쁨</option>
          <option value="mood">기분</option>
          <option value="instinct">본능</option>
          <option value="elsewhere">저편</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem' }}>
        {filtered.map((a, i) => {
          const cleanedName = cleanAilmentName(a.name);
          return (
            <div key={i} className="cute-card ailment-card" style={{ background: '#fafafa', padding: '1.2rem', borderRadius: '12px' }}>
              <h4 className="ailment-card__header" style={{ margin: 0, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>{cleanedName}</span>
                <span style={{ fontSize: '0.85rem', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>
                  등급: {localizeSeverityLabel(a.severity)} | 시간: {a.timer}시간
                </span>
              </h4>
              <div className="ailment-card__requirements" style={{ marginTop: '0.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong>💊 요구 약효 태그:</strong> {parseAndRenderTags(a.tags)}
              </div>

              <p style={{ fontSize: '0.95rem', color: '#333', background: '#fff', padding: '0.8rem', borderRadius: '6px', margin: '0.6rem 0', lineHeight: '1.6' }}>
                {localizeAilmentPresentationText(a.description)}
              </p>

              <div className="ailment-card__outcomes" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', background: '#fff', padding: '0.8rem', borderRadius: '6px' }}>
                <div>
                  <strong style={{ color: 'var(--primary)' }}>💡 성공 시 특별 결과:</strong>
                  <div style={{ marginTop: '4px', color: '#444', fontSize: '0.88rem', lineHeight: '1.5' }}>{localizeAilmentPresentationText(a.outcome || '성공 보상 장신구 획득')}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--accent-red)' }}>💥 실패 시 결과:</strong>
                  <div style={{ marginTop: '4px', color: '#444', fontSize: '0.88rem', lineHeight: '1.5' }}>{localizeAilmentPresentationText(a.consequence)}</div>
                </div>
              </div>

              {state.journeyActive && !state.activeAilment && state.rulesetId === 'sandbox' && (
                <button
                  onClick={() => {
                    const patientName = window.prompt("환자 이름 (선택):", "") || "";
                    const species = window.prompt("종 / 생김새 (선택):", "") || "";
                    const initialRememberedNote = window.prompt("첫 인상 메모 (선택):", "") || "";
                    updateState(s => {
                      const familiarBenefit = getActiveFamiliarBenefit(s);
                      const familiarMechanic = getActiveFamiliarMechanic(s);
                      const caterpillarBonus = (s.companionStates || []).some(row => row.companionId === 'caterpillar')
                        && (a.severity === 'lesser' || a.severity === 'intermediate') ? 1 : 0;
                      const startTimer = a.timer + (familiarMechanic === 'helpful' || familiarBenefit.includes("따뜻한 약제사") ? 2 : 0) + caterpillarBonus;
                      return {
                        ...s,
                        activeAilment: {
                          id: 'ail_' + Date.now(),
                          name: cleanedName,
                          severity: a.severity,
                          timer: startTimer,
                          maxTimer: startTimer,
                          tags: a.tags,
                          description: a.description,
                          outcome: a.outcome,
                          consequence: a.consequence,
                          foragingPoints: getStartingForagingPoints(s),
                          reagentsGathered: [],
                          patientName: patientName.trim(),
                          species: species.trim(),
                          initialRememberedNote: initialRememberedNote.trim(),
                          startedAtDay: s.cumulativeDays || s.calendarDays || 0,
                          journeyTitle: s.journeyGoalTitle || s.journeyDestination || ''
                        }
                      };
                    });
                    showAlert(`${cleanedName} 환자를 임상에 추가해 타이머를 기동했습니다.`);
                  }}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.6rem', background: 'var(--accent-purple)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  🏥 이 환자를 현재 약제소에 진단/등록
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// 9. MAP VIEW COMPONENT (Cartographer’s Margins Pass)
// =================================================================
function AtlasMapPanel({
  state,
  updateState,
  onOpenReference
}: {
  state: GameState;
  updateState: (recipe: (s: GameState) => GameState) => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkFromId, setLinkFromId] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<{ from: string; to: string } | null>(null);
  const customLocations = state.customMapLocations || [];
  const nodes = buildMapGraphNodes(customLocations, state.customMapEdges || []);
  const selected = selectedId ? nodes[selectedId] : null;
  const playerMarks = customLocations.filter(row => isPlayerCreatedMapPlace(row.id) && !row.hidden);
  const correctedPrints = customLocations.filter(row => !isPlayerCreatedMapPlace(row.id) && !row.hidden);
  const hiddenPrints = customLocations.filter(row => !isPlayerCreatedMapPlace(row.id) && row.hidden);
  const selectedEdges = selectedId
    ? (state.customMapEdges || []).filter(edge => edge.from === selectedId || edge.to === selectedId)
    : [];
  const persistStop = (stop: RouteStop) => {
    upsertPlayerMarkerRecords([playerRecordFromStop(stop)]);
    updateState(s => ({
      ...s,
      customMapLocations: upsertPlayerMapStop(s.customMapLocations || [], stop, buildMapGraphNodes(s.customMapLocations || [], s.customMapEdges || [])[stop.id])
    }));
  };
  const persistLink = (from: string, to: string, kind: 'path' | 'river' | 'waterway') => {
    updateState(s => ({
      ...s,
      customMapEdges: upsertPlayerMapEdge(s.customMapEdges || [], from, to, kind)
    }));
    setPendingLink(null);
  };
  const clearPlaceSelection = (id: string) => {
    setSelectedId(current => current === id ? null : current);
    setLinkFromId(current => current === id ? null : current);
    setPendingLink(current => current && (current.from === id || current.to === id) ? null : current);
  };
  const deletePlace = (id: string) => {
    if (findMapLocationKey(state.currentLocationName, customLocations) === id) {
      showAlert('지금 있는 자리의 표시는 지울 수 없습니다.');
      return;
    }
    removePlayerMarkerRecords([id]);
    clearPlaceSelection(id);
    updateState(s => {
      const locations = s.customMapLocations || [];
      const edges = (s.customMapEdges || []).filter(edge => edge.from !== id && edge.to !== id);
      if (isPlayerCreatedMapPlace(id)) {
        return {
          ...s,
          customMapLocations: locations.filter(row => row.id !== id),
          customMapEdges: edges
        };
      }
      const existing = locations.find(row => row.id === id);
      const printed = MAP_GRAPH_NODES[id] || MARKER_BY_ID.get(id);
      const hidden: CustomMapLocation = {
        id,
        label: existing?.label || printed?.label || id,
        x: existing?.x ?? printed?.x ?? 50,
        y: existing?.y ?? printed?.y ?? 50,
        region: existing?.region || (printed?.region as MapRegion | undefined),
        kind: existing?.kind || printed?.kind,
        neighbors: [],
        source: 'player-hidden',
        createdAt: existing?.createdAt || Date.now(),
        hidden: true
      };
      return {
        ...s,
        customMapLocations: [...locations.filter(row => row.id !== id), hidden],
        customMapEdges: edges
      };
    });
  };
  const restorePrintedPlace = (id: string) => {
    removePlayerMarkerRecords([id]);
    clearPlaceSelection(id);
    updateState(s => ({
      ...s,
      customMapLocations: (s.customMapLocations || []).filter(row => row.id !== id)
    }));
  };
  const stopFromRequest = (location: MapPickLocation): RouteStop => {
    const node = nodes[location.id];
    const kind = location.kind === 'City' || location.kind === 'Settlement' || location.kind === 'Ruin' || location.kind === 'Barrow' || location.kind === 'Clinic'
      ? location.kind
      : (node ? stopFromGraphNode(location.id, node).kind : 'Wilds');
    return {
      id: location.id,
      name: location.name ?? node?.label ?? '',
      kind,
      terrain: terrainFromRegion(location.region) || (node ? stopFromGraphNode(location.id, node).terrain : null),
      hasClinic: Boolean(location.hasClinic) || kind === 'Clinic',
      x: location.x ?? node?.x ?? 50,
      y: location.y ?? node?.y ?? 50
    };
  };
  const kindLabel = (kind?: string) =>
    kind === 'city' || kind === 'City' ? '도시'
      : kind === 'settlement' || kind === 'Settlement' ? '정착지'
        : kind === 'ruin' || kind === 'Ruin' ? '티탄 유적'
          : kind === 'barrow' || kind === 'Barrow' ? '거수 고분'
            : kind === 'clinic' || kind === 'Clinic' ? '약제소'
              : '야생';
  return (
    <div className="map-atelier">
      <MapView
        state={state}
        onOpenReference={onOpenReference}
        includeWilds
        selectedLocationId={selectedId}
        highlightLocationIds={[linkFromId, pendingLink?.from, pendingLink?.to].filter((id): id is string => Boolean(id))}
        onSelectedPlaceChange={id => {
          if (linkFromId && id && id !== linkFromId) {
            setPendingLink({ from: linkFromId, to: id });
            setLinkFromId(null);
            setSelectedId(id);
            return;
          }
          setSelectedId(id);
        }}
        onCreatePlace={request => {
          const id = `mark_${Date.now()}`;
          persistStop({
            id,
            name: request.name?.trim() || '',
            kind: request.kind === 'City' || request.kind === 'Settlement' || request.kind === 'Ruin' || request.kind === 'Barrow' || request.kind === 'Clinic' ? request.kind : 'Wilds',
            terrain: terrainFromRegion(request.terrain) || 'Forest',
            hasClinic: request.kind === 'Clinic',
            x: request.x,
            y: request.y
          });
          setSelectedId(id);
        }}
      onMovePlace={location => {
          if (location.x === undefined || location.y === undefined || !location.id) return;
          persistStop(stopFromRequest(location));
        }}
      onSetCurrentLocation={handleSetMappedCurrentLocation}
      onEditPlace={location => persistStop(stopFromRequest(location))}
      onDeletePlace={location => deletePlace(location.id)}
        onSavePlaces={() => {
          const custom = state.customMapLocations || [];
          upsertPlayerMarkerRecords(custom.filter(row => !row.hidden).map(row => ({
            id: row.id,
            label: row.label,
            x: row.x,
            y: row.y,
            kind: row.kind,
            region: row.region,
            updatedAt: Date.now()
          })));
          showAlert('접어둔 지도의 표시를 이 기록에 남겼습니다.');
        }}
        showTravelRoutes={false}
        veiled
        companionCaption="이 탭은 지도를 고치는 자리입니다. ⌘+클릭으로 표시를 남기고, 이동 잠금 뒤에 끌어 자리를 고칩니다."
      />
      <aside className="map-atelier__desk" aria-label="표시 자세히 고치기">
        <h3>지도 고치기</h3>
        <p>오늘의 여행은 경로를 잇고, 여기서는 표시 자체(형태, 색, 자리, 연결)를 고칩니다.</p>

        {linkFromId && <p className="map-atelier__note">이을 다음 표시를 지도에서 누르세요.</p>}
        {pendingLink && (
          <div className="map-atelier__block">
            <strong>두 표시를 어떻게 이을까요?</strong>
            <div className="map-atelier__actions">
              <button type="button" onClick={() => persistLink(pendingLink.from, pendingLink.to, 'path')}>육로로 잇기</button>
              <button type="button" onClick={() => persistLink(pendingLink.from, pendingLink.to, 'river')}>강으로 잇기</button>
              <button
                type="button"
                disabled={!canChooseRouteEdgeKind('waterway', { terrain: terrainFromRegion(nodes[pendingLink.from]?.region) }, { terrain: terrainFromRegion(nodes[pendingLink.to]?.region) })}
                title="수로는 적어도 한쪽이 호수여야 합니다."
                onClick={() => persistLink(pendingLink.from, pendingLink.to, 'waterway')}
              >
                수로로 잇기
              </button>
              <button type="button" onClick={() => setPendingLink(null)}>취소</button>
            </div>
          </div>
        )}

        {selected && selectedId ? (
          <div className="map-atelier__block">
            <strong>{kindLabel(selected.kind)} 표시</strong>
            <span>{isPlayerCreatedMapPlace(selectedId) ? '직접 남긴 표시' : '인쇄된 표시를 고치는 중'}</span>
            <MapNodeAppearance
              key={selectedId}
              kind={glyphKindFromLocation({ kind: selected.kind, hasClinic: selected.kind === 'clinic' })}
              terrain={terrainFromRegion(selected.region)}
              name={selected.label}
              onChange={next => persistStop({
                id: selectedId,
                name: next.name ?? selected.label,
                kind: next.kind,
                terrain: next.terrain,
                hasClinic: next.kind === 'Clinic',
                x: selected.x,
                y: selected.y
              })}
            />
            <div className="map-atelier__nudge" aria-label="자리 미세 이동">
              <span>자리</span>
              <button type="button" onClick={() => persistStop({ ...stopFromGraphNode(selectedId, selected), x: Math.max(1, selected.x - 0.4) })}>←</button>
              <button type="button" onClick={() => persistStop({ ...stopFromGraphNode(selectedId, selected), y: Math.max(1, selected.y - 0.4) })}>↑</button>
              <button type="button" onClick={() => persistStop({ ...stopFromGraphNode(selectedId, selected), y: Math.min(99, selected.y + 0.4) })}>↓</button>
              <button type="button" onClick={() => persistStop({ ...stopFromGraphNode(selectedId, selected), x: Math.min(99, selected.x + 0.4) })}>→</button>
            </div>
            <div className="map-atelier__actions">
              <button type="button" onClick={() => { setLinkFromId(selectedId); setPendingLink(null); }}>다음 표시와 잇기</button>
              <button type="button" className="map-atelier__delete" onClick={() => deletePlace(selectedId)}>이 표시 지우기</button>
            </div>
            {selectedEdges.length > 0 && (
              <ul className="map-atelier__edges">
                {selectedEdges.map(edge => {
                  const otherId = edge.from === selectedId ? edge.to : edge.from;
                  const other = nodes[otherId];
                  return (
                    <li key={edge.id}>
                      <span>{kindLabel(other?.kind)} · {routeEdgeLabel(edge.kind === 'river' || edge.kind === 'waterway' ? edge.kind : 'path')}</span>
                      <button
                        type="button"
                        onClick={() => persistLink(edge.from, edge.to, cycleRouteEdgeKind(
                          edge.kind === 'river' || edge.kind === 'waterway' ? edge.kind : 'path',
                          { terrain: terrainFromRegion(selected.region) },
                          { terrain: terrainFromRegion(other?.region) }
                        ))}
                      >
                        바꾸기
                      </button>
                      <button
                        type="button"
                        onClick={() => updateState(s => ({
                          ...s,
                          customMapEdges: (s.customMapEdges || []).filter(row => row.id !== edge.id)
                        }))}
                      >
                        끊기
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <p>지도의 표시를 누르거나, 빈 자리를 ⌘+클릭해 새 표시를 남기세요.</p>
        )}

        <div className="map-atelier__block">
          <strong>내가 남긴 표시 {playerMarks.length}</strong>
          {playerMarks.length === 0 ? (
            <p>아직 없습니다. 빈 자리를 ⌘+클릭하세요.</p>
          ) : (
            <ul className="map-atelier__list">
              {playerMarks.map(row => (
                <li key={row.id}>
                  <button type="button" className={selectedId === row.id ? 'is-on' : ''} onClick={() => setSelectedId(row.id)}>
                    {kindLabel(row.kind)}{row.label ? ` · ${row.label}` : ''} · {row.region || '색 미정'}
                  </button>
                  <button type="button" className="map-atelier__delete" onClick={() => deletePlace(row.id)}>지우기</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {correctedPrints.length > 0 && (
          <div className="map-atelier__block">
            <strong>고친 인쇄 표시 {correctedPrints.length}</strong>
            <ul className="map-atelier__list">
              {correctedPrints.map(row => (
                <li key={row.id}>
                  <button type="button" className={selectedId === row.id ? 'is-on' : ''} onClick={() => setSelectedId(row.id)}>
                    {kindLabel(row.kind)}{row.label ? ` · ${row.label}` : ''} · {row.region || '색 미정'}
                  </button>
                  <button type="button" className="map-atelier__delete" onClick={() => deletePlace(row.id)}>지우기</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hiddenPrints.length > 0 && (
          <div className="map-atelier__block">
            <strong>지운 인쇄 표시 {hiddenPrints.length}</strong>
            <ul className="map-atelier__list">
              {hiddenPrints.map(row => (
                <li key={row.id}>
                  <span>{kindLabel(row.kind)} · {row.label || row.id}</span>
                  <button type="button" onClick={() => restorePrintedPlace(row.id)}>되돌리기</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

const MapView = memo(function MapView({
  state,
  onOpenReference,
  variant = 'full',
  highlightLocationIds = [],
  selectedLocationId = null,
  includeWilds = false,
  routePlaceIds = [],
  onConfirmDestination,
  onTravelRequest,
  onAddWaypoint,
  onSetCurrentLocation,
  onCreatePlace,
  onMovePlace,
  onEditPlace,
  onDeletePlace,
  onSavePlaces,
  canDeletePlace,
  showWaypointAction = true,
  showTravelRoutes = true,
  veiled = false,
  showRoutePreview = true,
  onSelectedPlaceChange,
  onOpenFullMap,
  companionCaption,
  travelEnabled,
  travelBlockedReason
}: {
  state: GameState;
  onOpenReference: (request: RulebookReferenceRequest) => void;
  variant?: 'full' | 'companion';
  highlightLocationIds?: string[];
  selectedLocationId?: string | null;
  includeWilds?: boolean;
  routePlaceIds?: string[];
  onConfirmDestination?: (location: MapPickLocation) => void;
  onTravelRequest?: (location: MapPickLocation) => void;
  onAddWaypoint?: (location: MapPickLocation) => void;
  onSetCurrentLocation?: (location: MapPickLocation) => void;
  onCreatePlace?: (request: { x: number; y: number; kind?: string; terrain?: string; name?: string }) => void;
  onMovePlace?: (location: MapPickLocation) => void;
  onEditPlace?: (location: MapPickLocation) => void;
  onDeletePlace?: (location: MapPickLocation) => void;
  onSavePlaces?: () => void;
  canDeletePlace?: (placeId: string) => boolean;
  showWaypointAction?: boolean;
  showTravelRoutes?: boolean;
  veiled?: boolean;
  showRoutePreview?: boolean;
  onSelectedPlaceChange?: (placeId: string | null) => void;
  onOpenFullMap?: () => void;
  companionCaption?: string;
  travelEnabled?: boolean;
  travelBlockedReason?: string | null;
}) {
  const customMapLocations = state.customMapLocations || [];
  const customMapEdges = state.customMapEdges || [];
  const nodes = buildMapGraphNodes(customMapLocations, customMapEdges);
  const currentId = findMapLocationKey(state.currentLocationName, customMapLocations);
  const extraIds = new Set<string>([...highlightLocationIds, selectedLocationId, currentId, ...routePlaceIds].filter((id): id is string => Boolean(id)));
  (state.visitedLocations || []).forEach(name => {
    const id = findMapLocationKey(name, customMapLocations);
    if (id) extraIds.add(id);
  });
  const visitedIds = new Set(
    (state.visitedLocations || []).flatMap(name => {
      const id = findMapLocationKey(name, customMapLocations);
      return id ? [id] : [];
    })
  );
  const clinicIds = new Set(
    (state.clinics || []).flatMap(clinic => {
      const id = findMapLocationKey(clinic.locationName, customMapLocations);
      return id ? [id] : [];
    })
  );
  const distances = currentId ? collectLocationDistances(nodes, currentId) : new Map<string, number>();
  const weight = state.bag.reduce((sum, item) => sum + item.weight * Math.max(1, item.qty || 1), 0);
  const movePreviews = state.journeyActive && currentId
    ? previewMoveStops({
      graph: toTravelEngineGraph(state),
      originId: currentId,
      speed: previewTravelSpeed(state, weight),
      canStopInLoch: hasLochStoppingGear(state),
      waterwaySpan: resolveWagonCapabilities(canonicalWagonFromState(state)).waterwaySpan,
      mustUseFullSpeed: true,
      freePathLocationIds: freePathLocationIdsFromState(state)
    })
    : {};
  const soakProtected = hasSafeWaterwayTravel(state);
  Object.entries(movePreviews).forEach(([id, preview]) => {
    if (preview.reason === 'legal') extraIds.add(id);
  });
  const places: MapPlace[] = Object.entries(nodes)
    .filter(([id, node]) => includeWilds || node.kind !== 'wild' || extraIds.has(id))
    .map(([id, node]) => {
      const locationType = toMapPlaceType(node.kind || getBarterTypeForMapNode(id, node) || 'Wilds');
      const preview = movePreviews[id];
      return {
        id,
        name: node.label,
        x: node.x,
        y: node.y,
        region: node.region,
        regionLabel: node.region ? localizeRegionLabel(node.region) : undefined,
        locationType,
        locationTypeLabel: localizeLocationTypeLabel(locationType),
        visited: visitedIds.has(id) || id === currentId,
        isCurrent: id === currentId,
        hasClinic: clinicIds.has(id),
        hopsFromCurrent: preview?.cost ?? (distances.has(id) ? distances.get(id)! : null),
        moveReason: preview?.reason,
        moveCost: preview?.cost ?? null,
        encounterKind: preview?.encounterKind,
        usesWaterway: preview?.usesWaterway,
        willSoak: Boolean(preview?.usesWaterway && !soakProtected)
      };
    });
  const clinicOverlays: MapClinicOverlay[] = (state.clinics || []).flatMap(clinic => {
    const id = findMapLocationKey(clinic.locationName, customMapLocations);
    const entries = getMapServiceEntriesWithinHops(clinic.locationName, MAP_SERVICE_HOPS, customMapLocations, customMapEdges);
    const points = entries.filter(entry => entry.node).map(entry => ({
      id: entry.key,
      x: entry.node.x,
      y: entry.node.y,
      hops: entry.hops
    }));
    if (!id || points.length === 0) return [];
    return [{ id, name: clinic.locationName, points }];
  });
  const historyAnchors = [...new Set([...(state.visitedLocations || []), state.currentLocationName].filter(Boolean))].flatMap(name => {
    const id = findMapLocationKey(name, customMapLocations);
    const node = id ? nodes[id] : undefined;
    return node ? [{ id, x: node.x, y: node.y }] : [];
  });

  return (
    <PaperMap
      places={places}
      clinicOverlays={clinicOverlays}
      highlightPlaceIds={highlightLocationIds}
      selectedPlaceId={selectedLocationId}
      historyAnchors={historyAnchors}
      variant={variant}
      companionCaption={companionCaption}
      travelEnabled={travelEnabled}
      travelBlockedReason={travelBlockedReason}
      onConfirmDestination={onConfirmDestination}
      onTravelRequest={onTravelRequest}
      onAddWaypoint={onAddWaypoint}
      onSetCurrentLocation={onSetCurrentLocation}
      onCreatePlace={onCreatePlace}
      onMovePlace={onMovePlace}
      onEditPlace={onEditPlace}
      onDeletePlace={onDeletePlace}
      onSavePlaces={onSavePlaces}
      canDeletePlace={canDeletePlace}
      showWaypointAction={showWaypointAction}
      showTravelRoutes={showTravelRoutes}
      showRoutePreview={showRoutePreview}
      veiled={veiled}
      routePlaceIds={routePlaceIds}
      onSelectedPlaceChange={onSelectedPlaceChange}
      onOpenFullMap={onOpenFullMap}
      onOpenReference={onOpenReference}
      currentRegion={state.currentRegion}
      currentSeasonLabel={localizeSeasonLabel(state.currentSeason)}
    />
  );
});

// =================================================================
// 11. LIVING ARCHIVE VIEW COMPONENT
// =================================================================
function LivingArchiveView({ state, setActiveTab, setHighlightedPatientId }: { state: GameState; setActiveTab?: any; setHighlightedPatientId?: any }) {
  const patients = [...(state.patientCasebook || [])].sort((a, b) => b.timestamp - a.timestamp);
  const herbarium = (state.worldAlmanac || [])
    .filter(entry => entry.category === 'reagent')
    .sort((a, b) => b.lastSeen - a.lastSeen);
  const journeyEntries = [
    ...(state.journeyChronicles || []).map(c => ({
      id: c.id,
      title: c.title,
      text: c.text,
      stamp: c.date
    })),
    ...(state.travelScrapbook || [])
      .filter(entry => entry.kind === 'journey')
      .slice(0, 8)
      .map(entry => ({
        id: entry.id,
        title: entry.title,
        text: entry.text,
        stamp: `${entry.locationName ? getLocalizedLocationName(entry.locationName) : '길 위'} / ${formatDateTime(entry.timestamp)}`
      }))
  ];
  const trinkets = [...(state.trinketArchive || [])].sort((a, b) => b.timestamp - a.timestamp);
  const routeStops = [...new Set([...(state.visitedLocations || []), state.currentLocationName].filter(Boolean))];

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <span>살아 있는 기록들</span>
        <span className="document-kicker">박물지 현장 기록</span>
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: 0 }}>
        약제사가 숲을 거닐며 모은 인연과 배낭에 담긴 장신구의 사연, 박물지 표본이 서랍 속에 소중히 깃들어 있습니다.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '1rem', alignItems: 'start' }}>
        <section className="cute-card" style={{ background: '#fffefa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>환자 기록장</h3>
          </div>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {patients.slice(0, 5).map(record => {
              const isFailure = record.outcome === 'failure';
              if (isFailure) {
                return (
                  <div key={record.id} style={{ borderBottom: '1px dotted var(--glass-border)', padding: '0.6rem 0', fontSize: '0.86rem', color: 'var(--text-dim)' }}>
                    🕯️ {record.patientName || '가여운 이'}{record.species ? ` (${record.species})` : ''} — {record.resolvedAtDay || 0}일째 되던 날
                  </div>
                );
              }

              return (
                <article key={record.id} style={{ border: '1px solid var(--glass-border)', background: '#fbfaf4', padding: '0.75rem', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                    <strong>{record.patientName || '이름 모를 야수'}{record.species ? ` / ${record.species}` : ''}</strong>
                    <span className="journal-stamp" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                      온전히 나아 길을 떠남
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {record.ailmentName} / {getLocalizedLocationName(record.locationName)} {record.resolvedAtDay ? `| ${record.resolvedAtDay}일째` : ''}
                  </div>
                  {(record.finalArchiveNote || record.initialRememberedNote) && (
                    <div style={{ fontSize: '0.84rem', marginTop: '0.45rem', whiteSpace: 'pre-wrap' }}>
                      {record.finalArchiveNote || record.initialRememberedNote}
                    </div>
                  )}
                </article>
              );
            })}
            {patients.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>아직 진료한 야수의 기록이 없습니다. 아픈 이가 짚더미를 털고 숲으로 돌아가거나, 어쩔 수 없이 떠나보내야 했던 모든 순간의 이야기가 기록지에 고요히 스며들 것입니다.</div>}
          </div>
        </section>

        <section className="cute-card" style={{ background: '#fffefa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>길동무와의 기억</h3>
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            {state.bio.familiarName || '이름 없는 길동무'} / {state.bio.familiarRelation || '관계 미기록'}
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {(state.familiarMemories || []).slice(0, 5).map((memory, idx) => (
              <div key={`${memory}_${idx}`} style={{ borderLeft: '3px solid var(--primary)', padding: '0.45rem 0.6rem', background: '#fbfaf4', fontSize: '0.84rem', whiteSpace: 'pre-wrap' }}>
                {memory}
              </div>
            ))}
            {(!state.familiarMemories || state.familiarMemories.length === 0) && (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>길동무와 함께 시간을 보내거나 약재를 먹여 유대감을 쌓으면 여기에 기억이 새겨집니다.</div>
            )}
          </div>
        </section>

        <section className="cute-card" style={{ background: '#fffefa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>채집 약초 표본지</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '0.65rem' }}>
            {herbarium.slice(0, 10).map(entry => {
              let preps = entry.prepsDetail;
              const cleanName = cleanMemoryName(entry.name).toLowerCase();
              const matchedReag: any = findReagentMemoryDefinition(cleanName);
              if (!preps && matchedReag) {
                preps = (parsedPrepsList as any)[matchedReag.rawName];
              }

              return (
                <div key={entry.id} style={{ border: '1px solid var(--glass-border)', background: '#fbfaf4', padding: '0.65rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ color: 'var(--text-bright)' }}>{matchedReag?.name || entry.name}</strong>
                    {matchedReag && matchedReag.rawName && matchedReag.rawName.toLowerCase() !== (matchedReag.name || entry.name).toLowerCase() && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>({matchedReag.rawName})</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>📍 {localizeRegionLabel(entry.region)} / 발견 횟수 {entry.sightings}</div>
                  
                  {preps && preps.length > 0 && (
                    <div style={{ 
                      marginTop: '0.25rem', 
                      padding: '0.35rem 0.45rem', 
                      background: '#f4f3e8', 
                      borderRadius: '4px', 
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.74rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {preps.map((p, idx) => {
                          let prepBg = '#f1f5f9';
                          let prepColor = '#475569';
                          const prepUpper = p.prep.toUpperCase();
                          if (prepUpper === 'BOILED' || prepUpper === 'BREWED') {
                            prepBg = '#e0f2fe';
                            prepColor = '#0369a1';
                          } else if (prepUpper === 'CRUSHED' || prepUpper === 'GROUND') {
                            prepBg = '#fef3c7';
                            prepColor = '#b45309';
                          } else if (prepUpper === 'COOKED' || prepUpper === 'CONSUMED') {
                            prepBg = '#dcfce7';
                            prepColor = '#15803d';
                          } else if (prepUpper === 'ADDED' || prepUpper === 'APPLIED') {
                            prepBg = '#f3e8ff';
                            prepColor = '#6b21a8';
                          }

                          let tagBg = '#f3f4f6';
                          let tagColor = '#4b5563';
                          const tagUpper = p.tag.toUpperCase();
                          if (['WOUND', 'BURN', 'PAIN'].includes(tagUpper)) {
                            tagBg = '#fee2e2';
                            tagColor = '#b91c1c';
                          } else if (['FEVER', 'STOMACH', 'SENSES', 'BREATH'].includes(tagUpper)) {
                            tagBg = '#e0f2fe';
                            tagColor = '#0369a1';
                          } else if (['FAIR', 'JOY', 'MOOD'].includes(tagUpper)) {
                            tagBg = '#d1fae5';
                            tagColor = '#047857';
                          } else if (['HIDE', 'FEATHER', 'SCALE', 'FUR', 'INSTINCT'].includes(tagUpper)) {
                            tagBg = '#ffedd5';
                            tagColor = '#c2410c';
                          }

                          return (
                            <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0', borderBottom: idx < preps.length - 1 ? '1px dashed #e2d6b5' : 'none' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--text-bright)', fontSize: '0.74rem' }}>
                                {localizePreparationName(p.part)}
                              </span>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.05rem 0.35rem',
                                borderRadius: '10px',
                                fontSize: '0.64rem',
                                fontWeight: 'bold',
                                background: prepBg,
                                color: prepColor
                              }}>
                                {localizePreparationMethod(p.prep)}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>→</span>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.05rem 0.35rem',
                                borderRadius: '10px',
                                fontSize: '0.64rem',
                                fontWeight: 'bold',
                                background: tagBg,
                                color: tagColor
                              }}>
                                {p.tag} {p.val}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {entry.notes && <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: 'var(--text-bright)' }}>{entry.notes}</div>}
                </div>
              );
            })}
            {herbarium.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>길가에서 약재를 채취하거나 지니고 다녔던 표본들이 여기에 채워집니다.</div>}
          </div>
        </section>

        <section className="cute-card" style={{ background: '#fffefa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>방랑 지도 기록</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {routeStops.map(stop => (
              <span key={stop} style={{ border: '1px solid var(--glass-border)', background: '#fbfaf4', padding: '0.3rem 0.55rem', borderRadius: '4px', fontSize: '0.78rem' }}>{stop}</span>
            ))}
          </div>
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {journeyEntries.slice(0, 4).map(entry => (
              <article key={entry.id} style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '0.5rem' }}>
                <strong><Suspense fallback={localizeGameplayMessage(entry.title)}><LocalizedManualEffectText kind="journal-title" text={localizeGameplayMessage(entry.title)} /></Suspense></strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.stamp}</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}><Suspense fallback={localizeGameplayMessage(localizeSavedJourneyText(entry.text))}><LocalizedManualEffectText kind="journal-text" text={localizeGameplayMessage(localizeSavedJourneyText(entry.text))} /></Suspense></div>
              </article>
            ))}
            {journeyEntries.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>여정을 마무리하거나 길가에서 일기를 적어 지도의 여백을 채우세요.</div>}
          </div>
        </section>

        <section className="cute-card" style={{ background: '#f8f5ee', border: '1.5px solid #a89684', gridColumn: '1 / -1', boxShadow: 'inset 0 0 15px rgba(139, 90, 43, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px dashed #c4b5a3', paddingBottom: '0.55rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>선물 보관함</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '0.75rem' }}>
            {(() => {
              const oldestTrinket = trinkets.length > 0 ? trinkets[trinkets.length - 1] : null;

              return trinkets.map(record => {
                const isOldest = oldestTrinket && record.id === oldestTrinket.id;
                
                // Deterministic hashing based on timestamp for vintage patina
                const t = record.timestamp || 0;
                const paperTones = ['#fbfaf4', '#fcfbf7', '#faf8f2', '#fbfaf2', '#fbfbf7'];
                const borderStyles = ['dashed', 'dotted', 'solid'];
                
                const paperTone = isOldest ? '#f2eae0' : paperTones[t % paperTones.length];
                const borderStyle = isOldest ? 'double' : borderStyles[t % borderStyles.length];
                const borderWidth = isOldest ? '3px' : '1.3px';
                const boxS = isOldest ? '0 4px 10px rgba(107, 81, 59, 0.15)' : 'none';
                
                // Split spent details from story
                const storyLines = (record.story || '').split('\n');
                const originalStory = storyLines[0];
                const spentStoryLine = storyLines.slice(1).join('\n').trim();

                return (
                  <article 
                    key={record.id} 
                    className={record.spent ? 'keepsake-spent' : ''}
                    style={{ 
                      border: `${borderWidth} ${borderStyle} #c4b5a3`, 
                      background: paperTone, 
                      padding: '0.8rem', 
                      borderRadius: '4px',
                      boxShadow: boxS,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center' }}>
                      <strong 
                        className={record.spent ? 'keepsake-spent-title' : ''}
                        style={{ color: 'var(--text-bright)', fontSize: '0.88rem' }}
                      >
                        {localizeInventoryItemName(record.name)}{record.count > 1 ? ` x${record.count}` : ''}
                      </strong>
                      {record.spent && <span style={{ fontSize: '0.68rem', fontStyle: 'italic', color: '#8c7a6b' }}>— 건네어 소모됨</span>}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8c7a6b', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      {getLocalizedSource(record.source)} {record.locationName ? ` / ${getLocalizedLocationName(record.locationName)}` : ''}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.83rem', marginTop: '0.45rem', color: record.spent ? 'var(--text-dim)' : 'var(--text-muted)', lineHeight: '1.45' }}>
                      {getLocalizedStory(originalStory)}
                    </div>
                    {record.spent && (
                      <div style={{ fontSize: '0.8rem', color: '#8c7a6b', marginTop: '0.35rem', fontStyle: 'italic' }}>
                        ↳ {getLocalizedSpentStory(spentStoryLine)}
                      </div>
                    )}
                    {record.patientCaseId && (
                      <div style={{ marginTop: '0.6rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            if (setActiveTab && setHighlightedPatientId) {
                              setHighlightedPatientId(record.patientCaseId);
                              setActiveTab('patientArchive');
                            }
                          }}
                          className="btn-cozy-secondary"
                          style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', border: '1px dashed #c4b5a3', background: '#fff', color: '#6e5d4f', cursor: 'pointer' }}
                        >
                          🌿 선물을 보낸 인연 돌아보기
                        </button>
                      </div>
                    )}
                  </article>
                );
              });
            })()}
            {trinkets.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', padding: '1rem', gridColumn: '1 / -1', lineHeight: '1.6' }}>
                보관함이 텅 비어 있습니다. 정성껏 빚은 약의 답례로 건네받은 작은 나뭇잎, 돌멩이, 조약돌 소리가 서랍장을 채우기까지, 야수들의 고마운 마음을 기다립니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}



// =================================================================
// 12. PATIENT ARCHIVE VIEW COMPONENT
// =================================================================
const getNaturalSeverityDescription = (severity: string) => {
  const clean = (severity || '').toLowerCase().trim();
  if (clean === 'dire') return '위태로운 생사의 기로';
  if (clean === 'severe') return '깊고 무거운 병증';
  if (clean === 'intermediate') return '가볍지 않은 병색';
  return '비교적 가벼운 앓음';
};

function PatientArchiveView({
  state,
  updateState,
  highlightedPatientId,
  setHighlightedPatientId
}: {
  state: GameState;
  updateState: any;
  highlightedPatientId: string | null;
  setHighlightedPatientId: any;
}) {
  const records = [...(state.patientCasebook || [])].sort((a, b) => b.timestamp - a.timestamp);
  const successCount = records.filter(r => r.outcome === 'success').length
    + state.patientArchive.filter(record => record.success).length;
  const failureCount = records.filter(r => r.outcome === 'failure').length
    + state.patientArchive.filter(record => record.failure).length;
  const archiveCount = records.length + state.patientArchive.length;

  useEffect(() => {
    if (highlightedPatientId) {
      const el = document.getElementById(highlightedPatientId);
      if (el) {
        // Wait a small moment for tabs to settle
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedPatientId]);

  const handleToggleBookmark = (recordId: string) => {
    updateState((s: GameState) => ({
      ...s,
      patientCasebook: (s.patientCasebook || []).map(r =>
        r.id === recordId ? { ...r, isBookmarked: !r.isBookmarked } : r
      )
    }));
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span>기록장</span>
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: 0 }}>
        들녘에서 만난 야수들, 그들이 건넨 이야기와 약제사 배낭에서 꺼내어 조제해준 약의 흔적들을 모은 기록장입니다.
        {archiveCount > 0 && ` 지금까지 온전히 나아 돌아간 야수들 ${successCount}마리와, 끝내 병세를 꺾지 못한 ${failureCount}마리의 이야기가 기록되어 있습니다.`}
      </p>

      {state.patientArchive.length > 0 && (
        <section style={{ margin: '1rem 0 1.25rem', padding: '0.9rem 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>정규 환자 상태</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '0.6rem' }}>
            {[...state.patientArchive].sort((a, b) => b.encounteredAt - a.encounteredAt).map(record => {
              const patient = state.patients.find(row => row.id === record.patientId);
              const statusLabel: Record<CanonicalPatientArchiveRecord['status'], string> = {
                encountered: '만남', active: '치료 중', treated: '치료 성공', failed: '치료 실패', abandoned: '떠나보냄', unresolved: '미해결'
              };
              return (
                <article key={record.caseId} style={{ padding: '0.7rem', border: `1px solid ${record.failure ? '#fca5a5' : record.success ? '#86efac' : '#d6d3d1'}`, borderRadius: '6px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <strong>{patient?.name || record.patientName || record.descriptor || record.patientId}</strong>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: record.failure ? '#b91c1c' : record.success ? '#166534' : '#57534e' }}>{statusLabel[record.status]}</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.location || '위치 미기록'} · 질환 {record.ailments.length} · 타이머 {record.timers.length}</div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>결과: {localizeTreatmentResult(record.treatmentResult)} · 성공 {record.success ? '예' : '아니오'} · 실패 {record.failure ? '예' : '아니오'}</div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {archiveCount === 0 ? (
        <div className="cute-card" style={{ background: '#fffefa', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.6' }}>
          아직 진료한 야수의 기록이 없습니다. 아픈 이가 짚더미를 털고 숲으로 돌아가거나, 어쩔 수 없이 떠나보내야 했던 모든 순간의 이야기가 기록지에 고요히 스며들 것입니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
          {records.map(record => {
            const isFailure = record.outcome === 'failure';
            const isHighlighted = record.id === highlightedPatientId;

            return (
              <article
                key={record.id}
                id={record.id}
                className="cute-card"
                style={{
                  background: isHighlighted ? '#fffef2' : '#fcfaf5',
                  border: isHighlighted
                    ? '2px solid #d97706'
                    : `1px dashed ${isFailure ? '#b9aca3' : '#c4b5a3'}`,
                  boxShadow: isHighlighted ? '0 0 14px rgba(217, 119, 6, 0.4)' : 'none',
                  transition: 'all 0.3s ease',
                  padding: '1.1rem'
                }}
              >
                {/* Visual Header: Date & Bookmark */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.55rem', marginBottom: '0.75rem' }}>
                  <div className="document-kicker" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', margin: 0 }}>
                    {getLocalizedLocationName(record.locationName)} {record.resolvedAtDay ? `| ${record.resolvedAtDay}일째 되던 날` : ''}
                  </div>
                  <button
                    onClick={() => handleToggleBookmark(record.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.15rem', padding: 0, display: 'inline-flex', alignItems: 'center', color: record.isBookmarked ? '#d97706' : '#c4b5a3', transition: 'color 0.2s' }}
                    title={record.isBookmarked ? '이 환자와의 만남을 마음에 깊이 품어두었습니다.' : '이 환자와의 만남을 마음에 품어두기'}
                  >
                    {record.isBookmarked ? '★' : '☆'}
                  </button>
                </div>

                {/* Visual Highlight Banner if clicked from Trinket cabinet */}
                {isHighlighted && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcf8eb', border: '1px dashed #d97706', borderRadius: '4px', padding: '0.45rem 0.65rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#b45309', fontStyle: 'italic' }}>
                    <span>🕯️ 이 물건을 건네주고 떠난 야수의 소중한 기억이 여기에 깃들어 있습니다.</span>
                    <button
                      onClick={() => setHighlightedPatientId(null)}
                      style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: '#b45309', padding: 0, fontWeight: 'bold', fontSize: '0.75rem' }}
                    >
                      기억 덮기
                    </button>
                  </div>
                )}

                {/* 1. Patient Name */}
                <h3 style={{ margin: '0 0 0.65rem 0', fontSize: '1.25rem', color: 'var(--text-bright)', fontFamily: 'var(--font-fancy)' }}>
                  <span>{record.patientName || '이름 모를 야수'}</span>
                  {record.species && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.4rem' }}>
                      ({record.species})
                    </span>
                  )}
                </h3>

                {/* Restructured ordering */}
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {/* 2. Remembered Note */}
                  {record.finalArchiveNote && (
                    <div style={{ padding: '0.65rem', border: '1px solid #dcd3c1', background: '#faf8f2', borderRadius: '4px', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.01)' }}>
                      <div className="document-kicker" style={{ color: 'var(--primary)', fontSize: '0.7rem' }}>새겨진 기억</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--text-bright)', lineHeight: '1.5', fontFamily: 'var(--font-base)' }}>{record.finalArchiveNote}</div>
                    </div>
                  )}

                  {/* 3. First Impression */}
                  {record.initialRememberedNote && (
                    <div style={{ padding: '0.65rem', border: '1px dashed #dcd3c1', background: '#fcfbf7', borderRadius: '4px' }}>
                      <div className="document-kicker" style={{ color: '#8c7a6b', fontSize: '0.7rem' }}>첫인상</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{record.initialRememberedNote}</div>
                    </div>
                  )}

                  {/* 4. Outcome sentence */}
                  <div style={{ fontSize: '0.86rem', fontStyle: 'italic', fontWeight: 600, color: isFailure ? '#8c7a6b' : '#4a6b48', padding: '0.2rem 0' }}>
                    {isFailure ? '결국 치료하지 못하고 길을 잃었습니다.' : '이 야수는 온전히 나아 길을 떠났습니다.'}
                  </div>

                  {/* 5. Keepsake status */}
                  {(() => {
                    if (record.outcome !== 'success') return null;
                    const keepsake = (state.trinketArchive || []).find(t => t.patientCaseId === record.id || (record.sourceId && t.patientCaseId === memoryKey('case', record.sourceId)));
                    if (keepsake) {
                      if (!keepsake.spent) {
                        return <div style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>💝 이 야수는 ’{keepsake.name}’를 남겼습니다.</div>;
                      } else {
                        return <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>🪙 이 야수의 선물은 이후 거래에 사용되었습니다.</div>;
                      }
                    } else {
                      return <div style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>🙏 이 야수는 선물 대신 감사의 축복을 남겼습니다.</div>;
                    }
                  })()}

                  {/* 6. Narrative notes */}
                  {record.notes && record.notes !== record.finalArchiveNote && (
                    <div style={{ padding: '0.65rem', border: '1px dashed #dcd3c1', background: '#fcfbf7', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.45' }}>
                      <div className="document-kicker" style={{ color: '#8c7a6b', fontSize: '0.7rem' }}>경과기록</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{record.notes}</div>
                    </div>
                  )}
                </div>

                {/* 7. Clinical Drawer (🗒️ 병증에 관한 관찰 일지) */}
                <details className="medical-drawer" style={{ marginTop: '0.85rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.55rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dim)', outline: 'none', userSelect: 'none' }}>
                    🗒️ 병증에 관한 관찰 일지
                  </summary>
                  <div style={{ padding: '0.6rem', background: '#f8f6f0', border: '1px dashed #c4b5a3', borderRadius: '4px', marginTop: '0.45rem', fontSize: '0.8rem', display: 'grid', gap: '0.4rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    <div><strong>관찰된 병증:</strong> {record.ailmentName}</div>
                    <div><strong>병색의 깊이:</strong> {getNaturalSeverityDescription(record.severity)}</div>
                    {record.tags && <div><strong>요구되는 약효:</strong> {record.tags}</div>}
                    {record.journeyTitle && <div><strong>기록된 여정:</strong> {record.journeyTitle}</div>}
                    {record.remedy && record.remedy.length > 0 && (
                      <div><strong>우려낸 약재들:</strong> {record.remedy.join(', ')}</div>
                    )}
                  </div>
                </details>

                {/* Footer stamp info */}
                <div style={{ marginTop: '0.8rem', fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{record.season ? (record.season === 'Spring' ? '봄' : record.season === 'Summer' ? '여름' : record.season === 'Autumn' ? '가을' : '겨울') : '계절 미기록'}</span>
                  <span>{formatDateTime(record.timestamp)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =================================================================
// 11. JOURNALS VIEW COMPONENT
// =================================================================
function JournalsView({
  state,
  updateState,
  highlightedPatientId,
  setHighlightedPatientId
}: {
  state: GameState;
  updateState: any;
  highlightedPatientId?: string | null;
  setHighlightedPatientId?: any;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newPhotos, setNewPhotos] = useState<JournalPhoto[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<{ photo: JournalPhoto; title: string } | null>(null);
  const [subTab, setSubTab] = useState<'casebook' | 'almanac' | 'scrapbook' | 'journals' | 'chronicles' | 'legacy'>('journals');
  const [importNotice, setImportNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (highlightedPatientId && subTab === 'casebook') {
      const el = document.getElementById('journals_case_' + highlightedPatientId);
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedPatientId, subTab]);

  const almanacLabels: Record<AlmanacCategory, string> = {
    settlement: '정착지와 도시',
    clinic: '약제소',
    reagent: '영약재',
    creature: '만난 이들',
    landmark: '랜드마크',
    notable: '기억할 만한 장소'
  };

  const scrapbookLabels: Record<ScrapbookKind, string> = {
    journey: '여정',
    discovery: '발견',
    patient: '환자',
    remedy: '처방'
  };

  const handleNewJournalPhotos = async (files: FileList | null) => {
    try {
      const photos = await prepareJournalPhotos(files);
      if (photos.length > 0) {
        setNewPhotos(prev => [...prev, ...photos]);
      }
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '사진을 추가하지 못했습니다.');
    }
  };

  const handleRemovePendingPhoto = (photoId: string) => {
    const photo = newPhotos.find(item => item.id === photoId);
    if (photo) void deleteJournalPhotoFromStorage(photo);
    setNewPhotos(prev => prev.filter(item => item.id !== photoId));
  };

  const handleAddPhotosToJournal = async (journalId: string, files: FileList | null) => {
    try {
      const photos = await prepareJournalPhotos(files);
      if (photos.length === 0) return;
      updateState((s: GameState) => ({
        ...s,
        journals: s.journals.map(j =>
          j.id === journalId ? { ...j, photos: [...(j.photos || []), ...photos] } : j
        )
      }));
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '사진을 추가하지 못했습니다.');
    }
  };

  const handleRemoveJournalPhoto = (journalId: string, photoId: string) => {
    if (!askWindowConfirm("이 사진을 일지에서 삭제하시겠습니까?")) return;
    const photo = state.journals.find(j => j.id === journalId)?.photos?.find(item => item.id === photoId);
    if (photo) void deleteJournalPhotoFromStorage(photo);
    updateState((s: GameState) => ({
      ...s,
      journals: s.journals.map(j =>
        j.id === journalId ? { ...j, photos: (j.photos || []).filter(photo => photo.id !== photoId) } : j
      )
    }));
  };

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || (!newText.trim() && newPhotos.length === 0)) return;

    updateState((s: GameState) => {
      let nextGoalCounter = s.journeyGoalCounter || 0;
      let nextChecklist = [...(s.journeyGoalChecklist || [])];
      const journalId = 'user_journal_' + Date.now();

      if (s.journeyActive) {
        const titleLower = newTitle.toLowerCase();
        const textLower = newText.toLowerCase();

        if (isJourneyGoal(s.journeyGoalTitle, '동반자 우대', '관계 회복') && (textLower.includes("길동무") || textLower.includes("동반자") || titleLower.includes("길동무") || titleLower.includes("동반자") || textLower.includes("familiar") || textLower.includes("companion"))) {
          nextGoalCounter += 1;
        }
        if (isJourneyGoal(s.journeyGoalTitle, '마음의 정리') && (textLower.includes("갈등") || textLower.includes("해결") || textLower.includes("마음") || titleLower.includes("갈등") || titleLower.includes("해결") || titleLower.includes("마음"))) {
          nextGoalCounter += 1;
        }
        if (isJourneyGoal(s.journeyGoalTitle, '자연 조사', '자연 환경 조사')) {
          nextChecklist.push(s.currentRegion);
          const counts: Record<string, number> = {};
          nextChecklist.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
          nextGoalCounter = Math.max(...Object.values(counts));
        }
        if (isJourneyGoal(s.journeyGoalTitle, '방랑벽')) {
          const targetRegions = ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'];
          if (targetRegions.includes(s.currentRegion) && !nextChecklist.includes(s.currentRegion)) {
            nextChecklist.push(s.currentRegion);
          }
          nextGoalCounter = nextChecklist.length;
        }
      }

      const nextBase: GameState = {
        ...s,
        journeyGoalCounter: nextGoalCounter,
        journeyGoalChecklist: nextChecklist,
        journals: [
          {
            id: journalId,
            title: newTitle.trim(),
            text: newText.trim(),
            timestamp: Date.now(),
            photos: newPhotos
          },
          ...s.journals
        ]
      };
      if (!s.journey) return nextBase;
      const text = `${newTitle} ${newText}`.toLowerCase();
      const category = s.journey.goalId === 'partnership' && /길동무|동반자|familiar|companion/.test(text)
        ? 'familiar'
        : s.journey.goalId === 'closure' && /갈등|해결|마음|conflict/.test(text)
          ? 'conflict'
          : s.journey.goalId === 'survey'
            ? 'survey'
            : undefined;
      return {
        ...nextBase,
        journey: recordCanonicalJourneyEvent(nextBase, {
          id: `${journalId}:journey`, type: 'journal', category,
          region: toRuleRegion(s.currentRegion),
          locationId: findMapLocationKey(s.currentLocationName, s.customMapLocations || []) || normalizeMapLocationName(s.currentLocationName),
          text: newText.trim()
        })
      };
    });

    setNewTitle("");
    setNewText("");
    setNewPhotos([]);
    showAlert("새 저널 일지가 등록되었습니다.");
  };

  const handleRemoveJournal = (id: string) => {
    if (askWindowConfirm("이 일지 기록을 삭제하시겠습니까?")) {
      const journal = state.journals.find(j => j.id === id);
      (journal?.photos || []).forEach(photo => void deleteJournalPhotoFromStorage(photo));
      updateState(s => ({
        ...s,
        journals: s.journals.filter(j => j.id !== id)
      }));
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apawthecaria_save_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.bio && parsed.bag) {
          const migrated = migrateCampaignSave(parsed);
          if (!migrated.ok) {
            setImportNotice({ kind: 'error', text: '세이브 파일을 올리지 못했습니다. 현재 기록은 그대로 둡니다.' });
            return;
          }
          updateState(() => migrated.state);
          setImportNotice({ kind: 'success', text: '세이브 파일을 성공적으로 가져왔습니다.' });
        } else {
          setImportNotice({ kind: 'error', text: '유효하지 않은 아포테카리아 세이브 파일입니다.' });
        }
      } catch (err) {
        setImportNotice({ kind: 'error', text: '세이브 파일 파싱 중 오류가 발생했습니다.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>약제사 연대기 일지</span>
        <div className="journal-document-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportData} style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}><span className="emoji-icon" aria-hidden="true">📥</span> 내 기록 백업</button>
          <label style={{ padding: '0.4rem 0.8rem', background: '#eee', color: '#333', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <span className="emoji-icon" aria-hidden="true">📤</span> 기록 불러오기
            <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
          </label>
        </div>
      </h2>
      {importNotice && (
        <div role="status" style={{ margin: '0.75rem 0', padding: '0.65rem 0.8rem', border: `1px solid ${importNotice.kind === 'success' ? '#86a77a' : '#c77972'}`, borderRadius: '6px', background: importNotice.kind === 'success' ? '#f3f8ef' : '#fff2f0', color: importNotice.kind === 'success' ? '#355b2f' : '#8f2f28', fontSize: '0.85rem' }}>
          {importNotice.text}
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="journal-subtabs" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSubTab('casebook')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'casebook' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'casebook' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          진료 기록 ({(state.patientCasebook || []).length})
        </button>
        <button
          onClick={() => setSubTab('almanac')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'almanac' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'almanac' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          세계 도감 ({(state.worldAlmanac || []).length})
        </button>
        <button
          onClick={() => setSubTab('scrapbook')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'scrapbook' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'scrapbook' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          여정 기록장 ({(state.travelScrapbook || []).length})
        </button>
        <button
          onClick={() => setSubTab('journals')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'journals' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'journals' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          개인 저널 일지 ({state.journals.length})
        </button>
        <button
          onClick={() => setSubTab('chronicles')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'chronicles' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'chronicles' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          방랑 연대기 ({(state.journeyChronicles || []).length})
        </button>
        <button
          onClick={() => setSubTab('legacy')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'legacy' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'legacy' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          은퇴의 전당 및 약제소 망
        </button>
      </div>

      {subTab === 'casebook' && (
        <div className="journal-casebook-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
          {(state.patientCasebook || []).map(record => {
            const isFailure = record.outcome === 'failure';
            const isHighlighted = record.id === highlightedPatientId;

            return (
              <div
                key={record.id}
                id={'journals_case_' + record.id}
                className="cute-card"
                style={{
                  background: isHighlighted ? '#fffef2' : '#fcfaf5',
                  border: isHighlighted
                    ? '2px solid #d97706'
                    : `1px dashed ${isFailure ? '#b9aca3' : '#c4b5a3'}`,
                  boxShadow: isHighlighted ? '0 0 14px rgba(217, 119, 6, 0.4)' : 'none',
                  transition: 'all 0.3s ease',
                  padding: '1.1rem'
                }}
              >
                {/* Visual Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.55rem', marginBottom: '0.75rem' }}>
                  <div className="document-kicker" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', margin: 0 }}>
                    {getLocalizedLocationName(record.locationName)} {record.resolvedAtDay ? `| ${record.resolvedAtDay}일째 되던 날` : ''}
                  </div>
                  <button
                    onClick={() => {
                      updateState((s: GameState) => ({
                        ...s,
                        patientCasebook: (s.patientCasebook || []).map(r =>
                          r.id === record.id ? { ...r, isBookmarked: !r.isBookmarked } : r
                        )
                      }));
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.15rem', padding: 0, display: 'inline-flex', alignItems: 'center', color: record.isBookmarked ? '#d97706' : '#c4b5a3', transition: 'color 0.2s' }}
                    title={record.isBookmarked ? '이 환자와의 만남을 마음에 깊이 품어두었습니다.' : '이 환자와의 만남을 마음에 품어두기'}
                  >
                    {record.isBookmarked ? '★' : '☆'}
                  </button>
                </div>

                {/* Highlight Banner */}
                {isHighlighted && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcf8eb', border: '1px dashed #d97706', borderRadius: '4px', padding: '0.45rem 0.65rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#b45309', fontStyle: 'italic' }}>
                    <span>🕯️ 이 물건을 건네주고 떠난 야수의 소중한 기억이 여기에 깃들어 있습니다.</span>
                    <button
                      onClick={() => setHighlightedPatientId && setHighlightedPatientId(null)}
                      style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: '#b45309', padding: 0, fontWeight: 'bold', fontSize: '0.75rem' }}
                    >
                      기억 덮기
                    </button>
                  </div>
                )}

                {/* 1. Patient Name */}
                <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '1.25rem', color: 'var(--text-bright)', fontFamily: 'var(--font-fancy)' }}>
                  <span>{record.patientName || '이름 모를 야수'}</span>
                  {record.species && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.4rem' }}>
                      ({record.species})
                    </span>
                  )}
                </h4>

                {/* Restructured ordering */}
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {/* 2. Remembered Note */}
                  {record.finalArchiveNote && (
                    <div style={{ padding: '0.65rem', border: '1px solid #dcd3c1', background: '#faf8f2', borderRadius: '4px' }}>
                      <div className="document-kicker" style={{ color: 'var(--primary)', fontSize: '0.7rem' }}>새겨진 기억</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.84rem', color: 'var(--text-bright)', lineHeight: '1.5', fontFamily: 'var(--font-base)' }}>{record.finalArchiveNote}</div>
                    </div>
                  )}

                  {/* 3. First Impression */}
                  {record.initialRememberedNote && (
                    <div style={{ padding: '0.5rem', border: '1px dashed #dcd3c1', background: '#fbfaf4', borderRadius: '4px' }}>
                      <div className="document-kicker" style={{ color: '#8c7a6b', fontSize: '0.7rem' }}>첫인상</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{record.initialRememberedNote}</div>
                    </div>
                  )}

                  {/* 4. Outcome sentence */}
                  <div style={{ fontSize: '0.86rem', fontStyle: 'italic', fontWeight: 600, color: isFailure ? '#8c7a6b' : '#4a6b48', padding: '0.2rem 0' }}>
                    {isFailure ? '결국 치료하지 못하고 길을 잃었습니다.' : '이 야수는 온전히 나아 길을 떠났습니다.'}
                  </div>

                  {/* 5. Keepsake status */}
                  {(() => {
                    if (record.outcome !== 'success') return null;
                    const keepsake = (state.trinketArchive || []).find(t => t.patientCaseId === record.id || (record.sourceId && t.patientCaseId === memoryKey('case', record.sourceId)));
                    if (keepsake) {
                      if (!keepsake.spent) {
                        return <div style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>💝 이 야수는 ’{keepsake.name}’를 남겼습니다.</div>;
                      } else {
                        return <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>🪙 이 야수의 선물은 이후 거래에 사용되었습니다.</div>;
                      }
                    } else {
                      return <div style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>🙏 이 야수는 선물 대신 감사의 축복을 남겼습니다.</div>;
                    }
                  })()}

                  {/* 6. Narrative notes */}
                  {record.notes && record.notes !== record.finalArchiveNote && (
                    <div style={{ padding: '0.5rem', border: '1px dashed #dcd3c1', background: '#fcfbf7', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.45' }}>
                      <div className="document-kicker" style={{ color: '#8c7a6b', fontSize: '0.7rem' }}>경과기록</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{record.notes}</div>
                    </div>
                  )}
                </div>

                {/* 7. Clinical Drawer (🗒️ 병증에 관한 관찰 일지) */}
                <details className="medical-drawer" style={{ marginTop: '0.85rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.55rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-dim)', outline: 'none', userSelect: 'none' }}>
                    🗒️ 병증에 관한 관찰 일지
                  </summary>
                  <div style={{ padding: '0.6rem', background: '#f8f6f0', border: '1px dashed #c4b5a3', borderRadius: '4px', marginTop: '0.45rem', fontSize: '0.8rem', display: 'grid', gap: '0.4rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    <div><strong>관찰된 병증:</strong> {record.ailmentName}</div>
                    <div><strong>병색의 깊이:</strong> {getNaturalSeverityDescription(record.severity)}</div>
                    {record.tags && <div><strong>요구되는 약효:</strong> {record.tags}</div>}
                    {record.journeyTitle && <div><strong>기록된 여정:</strong> {record.journeyTitle}</div>}
                    {record.remedy && record.remedy.length > 0 && (
                      <div><strong>우려낸 약재들:</strong> {record.remedy.join(', ')}</div>
                    )}
                  </div>
                </details>

                <div style={{ marginTop: '0.8rem', fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{record.season ? (record.season === 'Spring' ? '봄' : record.season === 'Summer' ? '여름' : record.season === 'Autumn' ? '가을' : '겨울') : '계절 미기록'}</span>
                  <span>{formatDateTime(record.timestamp)}</span>
                </div>
              </div>
            );
          })}
          {(!state.patientCasebook || state.patientCasebook.length === 0) && (
            <div className="cute-card" style={{ color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
              아직 치료 완료된 환자 기록이 없습니다. 환자를 치료하거나 실패 결과가 발생하면 자동으로 영구 케이스가 남습니다.
            </div>
          )}
        </div>
      )}

      {subTab === 'almanac' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(['settlement', 'clinic', 'reagent', 'creature', 'landmark', 'notable'] as AlmanacCategory[]).map(category => {
            const entries = (state.worldAlmanac || []).filter(entry => entry.category === category);
            if (entries.length === 0) return null;
            return (
              <section key={category} className="cute-card" style={{ background: '#fffefa' }}>
                <h3 style={{ margin: '0 0 0.8rem 0', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{almanacLabels[category]}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '0.75rem' }}>
                  {entries.map(entry => {
                    let preps = entry.prepsDetail;
                    let matchedReag: any = null;
                    if (entry.category === 'reagent') {
                      const cleanName = cleanMemoryName(entry.name).toLowerCase();
                      matchedReag = findReagentMemoryDefinition(cleanName);
                      if (!preps && matchedReag) {
                        preps = (parsedPrepsList as any)[matchedReag.rawName];
                      }
                    }

                    return (
                      <div key={entry.id} style={{ border: '1px solid var(--glass-border)', background: '#fbfaf4', padding: '0.75rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{matchedReag?.name || getLocalizedLocationName(entry.name)}</span>
                          {matchedReag && matchedReag.rawName && matchedReag.rawName.toLowerCase() !== (matchedReag.name || entry.name).toLowerCase() && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>({matchedReag.rawName})</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {entry.locationName ? getLocalizedLocationName(entry.locationName) : '정해진 장소 없음'} {entry.region ? `- ${localizeRegionLabel(entry.region)}` : ''}</div>
                        
                        {entry.category === 'reagent' && preps && preps.length > 0 && (
                          <div style={{ 
                            marginTop: '0.4rem', 
                            padding: '0.5rem', 
                            background: '#f4f3e8', 
                            borderRadius: '4px', 
                            border: '1px solid var(--glass-border)',
                            fontSize: '0.78rem'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.74rem', color: 'var(--text-bright)', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
                              🧪 조제 및 사용법
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {preps.map((p, idx) => {
                                let prepBg = '#f1f5f9';
                                let prepColor = '#475569';
                                const prepUpper = p.prep.toUpperCase();
                                if (prepUpper === 'BOILED' || prepUpper === 'BREWED') {
                                  prepBg = '#e0f2fe';
                                  prepColor = '#0369a1';
                                } else if (prepUpper === 'CRUSHED' || prepUpper === 'GROUND') {
                                  prepBg = '#fef3c7';
                                  prepColor = '#b45309';
                                } else if (prepUpper === 'COOKED' || prepUpper === 'CONSUMED') {
                                  prepBg = '#dcfce7';
                                  prepColor = '#15803d';
                                } else if (prepUpper === 'ADDED' || prepUpper === 'APPLIED') {
                                  prepBg = '#f3e8ff';
                                  prepColor = '#6b21a8';
                                }

                                let tagBg = '#f3f4f6';
                                let tagColor = '#4b5563';
                                const tagUpper = p.tag.toUpperCase();
                                if (['WOUND', 'BURN', 'PAIN'].includes(tagUpper)) {
                                  tagBg = '#fee2e2';
                                  tagColor = '#b91c1c';
                                } else if (['FEVER', 'STOMACH', 'SENSES', 'BREATH'].includes(tagUpper)) {
                                  tagBg = '#e0f2fe';
                                  tagColor = '#0369a1';
                                } else if (['FAIR', 'JOY', 'MOOD'].includes(tagUpper)) {
                                  tagBg = '#d1fae5';
                                  tagColor = '#047857';
                                } else if (['HIDE', 'FEATHER', 'SCALE', 'FUR', 'INSTINCT'].includes(tagUpper)) {
                                  tagBg = '#ffedd5';
                                  tagColor = '#c2410c';
                                }

                                return (
                                  <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0', borderBottom: idx < preps.length - 1 ? '1px dashed #e2d6b5' : 'none' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-bright)', fontSize: '0.78rem' }}>
                                      {localizePreparationName(p.part)}
                                    </span>
                                    <span style={{ 
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '12px',
                                      fontSize: '0.68rem',
                                      fontWeight: 'bold',
                                      background: prepBg,
                                      color: prepColor
                                    }}>
                                      {localizePreparationMethod(p.prep)}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>→</span>
                                    <span style={{ 
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '12px',
                                      fontSize: '0.68rem',
                                      fontWeight: 'bold',
                                      background: tagBg,
                                      color: tagColor
                                    }}>
                                      {p.tag} {p.val}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {entry.notes && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-bright)', marginTop: '0.2rem' }}>
                            📝 {getLocalizedAlmanacNotes(entry.notes)}
                          </div>
                        )}

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.3rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>출처: {getLocalizedSource(entry.source)}</span>
                          <span>발견 횟수: {entry.sightings}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {subTab === 'scrapbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(state.travelScrapbook || []).map(entry => (
            <div key={entry.id} className="cute-card" style={{ background: '#fffefa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.45rem', marginBottom: '0.7rem', gap: '0.8rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-bright)' }}><Suspense fallback={localizeGameplayMessage(entry.title)}><LocalizedManualEffectText kind="journal-title" text={localizeGameplayMessage(entry.title)} /></Suspense></h4>
                <span className="document-kicker">{scrapbookLabels[entry.kind]}</span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}><Suspense fallback={localizeGameplayMessage(localizeSavedJourneyText(entry.text))}><LocalizedManualEffectText kind="journal-text" text={localizeGameplayMessage(localizeSavedJourneyText(entry.text))} /></Suspense></p>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.6rem' }}>
                {entry.locationName ? getLocalizedLocationName(entry.locationName) : '길 위'} / {formatDateTime(entry.timestamp)}
              </div>
            </div>
          ))}
          {(!state.travelScrapbook || state.travelScrapbook.length === 0) && (
            <div className="cute-card" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              여정, 발견, 환자, 처방 기록이 생기면 자동으로 스크랩북에 붙습니다.
            </div>
          )}
        </div>
      )}

      {subTab === 'journals' && (
        <>
          <section className="cute-card" style={{ background: '#fffdf8', border: '1.5px solid var(--border-cozy)', padding: '1rem', marginTop: '1rem' }} aria-label="약제사 시작 기록">
            <h3 style={{ margin: '0 0 0.35rem 0', color: 'var(--primary)' }}>약제사 시작 기록</h3>
            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              캐릭터를 만들 때 짧게 적어 둔 출발 계기, 기념품, 길동무 만남이 여기에 남습니다. 나중에 더 적을 수도 있습니다.
            </p>
            {([
              { key: 'originJournal', title: '약제사의 출발 계기', value: state.bio.originJournal || '', hint: state.bio.originName },
              { key: 'mementoNote', title: '첫 여정의 기념품', value: state.bio.mementoNote || '', hint: '' },
              { key: 'familiarJournal', title: '길동무와의 첫 만남', value: state.bio.familiarJournal || '', hint: state.bio.familiarName },
              { key: 'relationshipJournal', title: '길동무와의 관계', value: state.bio.relationshipJournal || '', hint: state.bio.familiarRelation }
            ] as const).map(row => (
              <label key={row.key} style={{ display: 'grid', gap: '0.3rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)' }}>{row.title}</span>
                {row.hint ? <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{row.hint}</span> : null}
                <textarea
                  rows={3}
                  value={row.value}
                  onChange={event => {
                    const nextValue = event.target.value;
                    updateState((s: GameState) => {
                      const bio = { ...s.bio, [row.key]: nextValue };
                      return { ...s, bio, journals: mergeCharacterJournals(s.journals, bio) };
                    });
                  }}
                  placeholder="아직 적힌 문장이 없습니다."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </label>
            ))}
          </section>
          {/* Write custom journal */}
          <form onSubmit={handleAddJournal} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#fafafa', padding: '1.2rem', borderRadius: '12px', border: '1px solid #ddd', marginTop: '1rem' }}>
            <h4>✍️ 새로운 저널 일지 작성하기</h4>
            <input
              type="text"
              placeholder="제목 (예: Odoak 정착지 도착, 곰의 다리를 꿰매다...)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <textarea
              placeholder="여행 기록 내용, 묘사, 환자의 상태나 내 동물의 느낌을 자유롭게 서술해 주세요..."
              rows={4}
              value={newText}
              onChange={e => setNewText(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '0.75rem', border: '1px dashed #d6d1c6', borderRadius: '8px', background: '#fffdf7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-bright)', fontSize: '0.9rem' }}>📷 사진 첨부</span>
                <label style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--glass-border)', borderRadius: '999px', background: '#fff', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>
                  사진 선택
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async e => {
                      await handleNewJournalPhotos(e.currentTarget.files);
                      e.currentTarget.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              {newPhotos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(110px, 100%), 1fr))', gap: '0.6rem' }}>
                  {newPhotos.map(photo => (
                    <div key={photo.id} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', background: '#f8f6f0' }}>
                      <JournalPhotoImage photo={photo} alt={photo.name} imageStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <button type="button" onClick={() => handleRemovePendingPhoto(photo.id)} style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', border: 'none', borderRadius: '999px', background: 'rgba(30, 24, 18, 0.78)', color: '#fff', width: '1.55rem', height: '1.55rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>로그인 상태에서는 사진을 서버 파일 저장소에 올리고, 세이브에는 주소만 남깁니다.</div>
            </div>
            <button type="submit" style={{ padding: '0.6rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>🖋️ 저널 등록</button>
          </form>

          {/* List journals */}
          <div style={{ marginTop: '2rem' }}>
            <h3>📖 과거 저널 기록 ({state.journals.length}개)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
              {state.journals.map(j => (
                <div key={j.id} className="cute-card" style={{ background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '0.4rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--primary)' }}><Suspense fallback={localizeGameplayMessage(j.title)}><LocalizedManualEffectText kind="journal-title" text={localizeGameplayMessage(j.title)} /></Suspense></h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateTime(j.timestamp)}</span>
                      <label style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        📷 사진 추가
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async e => {
                            await handleAddPhotosToJournal(j.id, e.currentTarget.files);
                            e.currentTarget.value = '';
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button onClick={() => handleRemoveJournal(j.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.8rem' }}>❌ 삭제</button>
                    </div>
                  </div>
                  {j.text && (
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text-bright)', marginTop: '0.5rem' }}>
                      <Suspense fallback={localizeGameplayMessage(localizeSavedJourneyText(j.text))}><LocalizedManualEffectText kind="journal-text" text={localizeGameplayMessage(localizeSavedJourneyText(j.text))} /></Suspense>
                    </p>
                  )}
                  {(j.photos || []).length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: (j.photos || []).length === 1 ? 'minmax(0, 760px)' : 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem', marginTop: '1.1rem', alignItems: 'start' }}>
                      {(j.photos || []).map(photo => (
                        <figure key={photo.id} style={{ margin: 0, border: '1px solid #e2ddd2', borderRadius: '10px', overflow: 'hidden', background: '#faf8f2', boxShadow: '0 2px 8px rgba(39, 32, 24, 0.08)' }}>
                          <button
                            onClick={() => setViewingPhoto({ photo, title: j.title })}
                            style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: '#f5f1e8', cursor: 'zoom-in' }}
                            title="크게 보기"
                          >
                            <JournalPhotoImage photo={photo} alt={photo.name || j.title} imageStyle={{ width: '100%', maxHeight: '620px', objectFit: 'contain', display: 'block' }} />
                          </button>
                          <figcaption style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.6rem', borderTop: '1px solid #e2ddd2', color: 'var(--text-dim)', fontSize: '0.76rem' }}>
                            <button onClick={() => setViewingPhoto({ photo, title: j.title })} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>🔎 원본 보기</button>
                            <button onClick={() => handleRemoveJournalPhoto(j.id, photo.id)} style={{ border: 'none', background: 'transparent', color: 'var(--accent-red)', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>삭제</button>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {state.journals.length === 0 && (
                <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
                  아직 등록된 일지 기록이 없습니다. 여정 이동과 환자 완치 시 자동으로 기록되거나 직접 쓸 수 있습니다.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {subTab === 'chronicles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(state.journeyChronicles || []).map(c => (
            <div key={c.id} className="cute-card" style={{ background: '#fefcf8', border: '1.5px solid #e2d6b5', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2d6b5', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                <h4 style={{ margin: 0, color: '#854d0e', fontSize: '1.05rem', fontWeight: 'bold' }}>{c.title}</h4>
                <span style={{ fontSize: '0.8rem', color: '#a16207' }}>{c.date}</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#451a03', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-base)', margin: 0 }}>
                {c.text}
              </p>
            </div>
          ))}
          {(!state.journeyChronicles || state.journeyChronicles.length === 0) && (
            <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>
              아직 완성된 여정 연대기 기록이 없습니다. 지도에서 여정을 마칠 때 자동으로 생성되어 여기에 보존됩니다.
            </div>
          )}
        </div>
      )}

      {subTab === 'legacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="cute-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <h4 style={{ color: 'var(--primary)', margin: '0 0 0.8rem 0' }}>🏛️ 역대 은퇴 약제사 계보</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {(state.legacyApothecaries || []).map((ap, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '0.8rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>{i + 1}대 약제사 {ap.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      활동 기간: {ap.ageOfRetirement}일 | 건설한 약제소: {ap.clinicsBuilt}개
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold' }}>명예 전당 점수: {ap.legacyScore}점</span>
                  </div>
                </div>
              ))}
              {(!state.legacyApothecaries || state.legacyApothecaries.length === 0) && (
                <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>
                  아직 은퇴한 선대 약제사가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="cute-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <h4 style={{ color: 'var(--primary)', margin: '0 0 0.8rem 0' }}>🏡 보존된 세대별 약제소 네트워크</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: '0.8rem' }}>
              {(state.legacyClinics || []).map((cl, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '0.8rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)' }}>📍 {cl.locationName} 지부</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0.2rem 0' }}>
                    지형: {localizeRegionLabel(cl.region)} | 설립자: {cl.founder}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 'bold' }}>
                    지정 아젠다: {cl.services.join(', ').toUpperCase()}
                  </div>
                </div>
              ))}
              {(!state.legacyClinics || state.legacyClinics.length === 0) && (
                <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem', gridColumn: '1 / -1' }}>
                  아직 네트워크에 등록된 보존 약제소가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20, 17, 14, 0.82)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(1120px, 96vw)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', color: '#fff' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewingPhoto.title}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewingPhoto.photo.name}</div>
              </div>
              <button onClick={() => setViewingPhoto(null)} style={{ border: '1px solid rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: '999px', width: '2.2rem', height: '2.2rem', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#f7f3ea', borderRadius: '10px', padding: '0.75rem', overflow: 'auto', boxShadow: '0 18px 40px rgba(0,0,0,0.35)' }}>
              <JournalPhotoImage photo={viewingPhoto.photo} alt={viewingPhoto.photo.name || viewingPhoto.title} imageStyle={{ display: 'block', maxWidth: '100%', maxHeight: '82vh', width: 'auto', height: 'auto', margin: '0 auto' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
