import type { RouteDraft } from './map/routeComposer';
import { journeyAnnotationStartedAt, reconcileAbandonedJourneyAnnotations, type JourneyResetStamp } from './journeyAnnotationRecovery';

interface JourneyPatientRecord {
  id: string;
  status?: string;
}

export interface JourneyResettableState {
  journeyActive: boolean;
  journeyOrigin?: string;
  journey?: { originId?: string; journeyId?: string; startDate?: number } | null;
  currentLocationName?: string;
  currentMapLocationId?: string;
  currentLocationType?: string;
  currentRegion?: string;
  activePatientId?: string | null;
  patients?: JourneyPatientRecord[];
  routeDraft?: RouteDraft;
  mapEncounterRecords?: Array<{ journeyId?: string; createdAt?: number }>;
  /** Temporary landmark marks created while an active Journey was in progress. */
  barrows?: Array<{ id?: string; journeyId?: string; createdAt?: number }>;
  journeyResetHistory?: JourneyResetStamp[];
  journals?: Array<{ id: string; timestamp?: number }>;
  workflowDrafts?: { character?: unknown; patient?: unknown; journey?: unknown };
}

export interface JourneyResetOrigin {
  id?: string;
  name?: string;
  locationType?: string;
  region?: string;
}

/**
 * Out-of-game recovery for a player who wants to discard only the current
 * Journey. Character, Inventory, map edits, archives, journals, cumulative
 * campaign time survive. The current position returns to the Journey's saved
 * Origin; a legacy save without an Origin keeps its current position.
 */
export const resetJourneyForPlanning = <T extends JourneyResettableState>(state: T, resolvedOrigin?: JourneyResetOrigin, resetAt = Date.now()): T => {
  const activePatientId = state.activePatientId || null;
  const originName = resolvedOrigin?.name?.trim() || state.journeyOrigin?.trim() || state.currentLocationName;
  const originId = resolvedOrigin?.id?.trim() || state.journey?.originId?.trim();
  const patients = Array.isArray(state.patients)
    ? state.patients.filter(patient => patient.id !== activePatientId && patient.status !== 'active')
    : state.patients;
  const activeJourneyId = state.journey?.journeyId?.trim();
  const journeyStartedAt = journeyAnnotationStartedAt(state);
  // The shared repair below also understands timestamp-based legacy ids.
  // Explicit ownership takes precedence over dates, preserving landmarks
  // that belong to a different, completed Journey.
  return reconcileAbandonedJourneyAnnotations({
    ...state,
    journeyActive: false,
    ...(originName ? { currentLocationName: originName } : {}),
    ...(originId
      ? { currentMapLocationId: originId }
      : originName && originName !== state.currentLocationName
        ? { currentMapLocationId: undefined }
        : {}),
    ...(resolvedOrigin?.locationType ? { currentLocationType: resolvedOrigin.locationType } : {}),
    ...(resolvedOrigin?.region ? { currentRegion: resolvedOrigin.region } : {}),
    journeyOrigin: '',
    journeyDestination: '',
    journeyDistance: '',
    journeyTotalDistance: 0,
    journeyDirection: '',
    journeyGoalTitle: '',
    journeyGoalDesc: '',
    journeyGoalProgress: '',
    journeyGoalCounter: 0,
    journeyGoalChecklist: [],
    journey: null,
    journeyResetHistory: [...(Array.isArray(state.journeyResetHistory) ? state.journeyResetHistory : []), {
      journeyId: activeJourneyId,
      startedAt: journeyStartedAt,
      resetAt
    }],
    pendingEnding: null,
    calendarDays: 0,
    calendarMaxDays: 12,
    calendarHistory: [],
    routeDraft: { stops: [], edgeKinds: [] },
    activeAilment: null,
    activeAilments: [],
    activePatientId: null,
    patients,
    treatmentDraft: null,
    pendingTreatmentReward: null,
    ...(state.workflowDrafts ? { workflowDrafts: { ...state.workflowDrafts, patient: null, journey: null } } : {}),
    pendingEncounter: null,
    pendingForaging: null,
    pendingBarter: null,
    activeBarter: null,
    pendingLeaveObligation: null,
    pendingAlternativeAcquisition: null,
    pendingPatientArchive: null,
    pendingManualEffect: null,
    manualEffectDraft: null,
    manualEffectQueue: [],
    pendingManualFollowUps: [],
    manualConditions: [],
    needsLocalHelpBeforeMove: false,
    scroungingMode: false,
    scroungingTimer: 0,
    independentUsedThisAilment: false,
    curedAilmentInThisWilds: false,
    lastForageCardValue: 0,
    gardenHarvestedThisAilment: false,
    soddenLogHarvestedThisAilment: false,
    activeDelve: null,
    pursuedByBehemoth: null,
    nextMoveSpeedOverride: null,
    pendingServices: [],
    guildServiceTravelRerolls: 0,
    forecastMoves: 0,
    forecastActiveAtLocation: false,
    taxiSoarActive: false,
    griphUsedThisJourney: false,
    pondSkimmerUsedThisJourney: false,
    beetleUsedThisJourney: false,
    companionTravelPaths: 0,
    missiveSettlements: [],
    downtimeRequired: false,
    downtimeCompleted: false
  } as T);
};
