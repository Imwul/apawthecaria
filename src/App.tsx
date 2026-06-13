import { useState, useEffect, useRef, Fragment } from "react";
import { db, isFirebaseConfigured, auth, googleProvider } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { GAME_DATA } from "./gameData";
import parsedSocial from "../parsed_social.json";
import parsedPrepsList from "../parsed_preps_list.json";

const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };



// =================================================================
// 1. SYNC & STORAGE SYSTEM
// =================================================================
const withTimeout = (promise: Promise<any>, ms: number = 10000) => {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
};

const store = {
  set: async (key: string, value: any) => {
    const jsonString = JSON.stringify(value);
    if (jsonString.length > 1000000) {
      console.error('데이터가 너무 큽니다.');
      alert('데이터 크기가 제한(1MB)을 초과했습니다.');
      return false;
    }
    if (isFirebaseConfigured && db) {
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const docRef = doc(db, 'saves', `uid_${currentUser.uid}`);
          await withTimeout(setDoc(docRef, { [key]: jsonString }, { merge: true }));
        }
      } catch (e: any) {
        console.error('Firebase 저장 에러:', e);
      }
    }
    try {
      localStorage.setItem(key, jsonString);
    } catch (e) {}
  },
  load: async (key: string, fallback: any) => {
    if (isFirebaseConfigured && db) {
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const docRef = doc(db, 'saves', `uid_${currentUser.uid}`);
          const snap = await withTimeout(getDoc(docRef));
          if (snap.exists() && snap.data()[key]) {
            return JSON.parse(snap.data()[key]);
          }
        }
      } catch (e) {
        console.error('Firebase 로드 에러:', e);
      }
    }
    try {
      const r = localStorage.getItem(key);
      if (r) return JSON.parse(r);
    } catch {}
    return fallback;
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
}

interface ApothecaryBio {
  name: string;
  descriptor: string;
  examples: string;
  travelStyle: string;
  speed: number;
  carry: number;
  originName: string;
  originDesc: string;
  familiarName: string;
  familiarBenefit: string;
  familiarRelation: string;
  canFly?: boolean;
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
}

interface ActiveDelve {
  behemothName: string;
  behemothClass: 'Towering' | 'Many' | 'Violent' | 'Demanding';
  challengeType: 'UneasySleep' | 'CollapsedEntrance' | 'BelliesOfMany' | 'InsideJob' | 'PotentPoison' | 'StealEverything' | 'BuildingTrust' | 'SuitableFurnishings';
  timer: number;
  points: number;
  cardsDrawn: string[];
  reagentsGathered: string[];
  requiredReagents?: string[];
}

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

interface Companion {
  id: string;
  name: string;
  koreanName: string;
  adoptedLocation: string;
}

interface BarterSession {
  reagentName: string;
  finalRarity: number;
  socialCard: { suit: string; val: number };
  socialEncounter: { page: number; suit: string; title: string; text: string };
  dealCard?: { suit: string; val: number } | null;
  phase: 'social' | 'deal' | 'result';
  journalNote: string;
}

interface GameState {
  bio: ApothecaryBio;
  reputation: number; // starts at 5
  currentLocationName: string;
  currentLocationType: string; // Wilds, Settlement, City, Ruin, Barrow
  currentRegion: string; // Bog, Forest, Loch, Meadow, Mountain, Titan, Barrow
  currentSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';

  // Inventory
  bag: BagItem[];
  trinkets: string[];

  // Journey details
  journeyActive: boolean;
  journeyOrigin?: string;
  journeyDestination: string;
  journeyDistance: string;
  journeyDirection: string;
  journeyGoalTitle: string;
  journeyGoalDesc: string;
  journeyGoalProgress: string;
  calendarDays: number;
  calendarMaxDays: number;
  calendarHistory: string[];

  // Ongoing patient
  activeAilment: ActiveAilment | null;
  barterCountThisAilment: number; // Rulebook p.34: Settlement 1x, City 3x per ailment

  // Log history
  journals: { id: string; title: string; text: string; timestamp: number }[];

  // New features
  barrows?: Barrow[];
  activeDelve?: ActiveDelve | null;
  pursuedByBehemoth?: PursuedByBehemoth | null;
  wagonExpansions?: WagonExpansions;
  companions?: Companion[];
  resourcefulReagent?: string;
  ingenuitiveTool?: string;
  clinics?: { locationName: string; region: string; agendaService: string }[];
  scroungingMode?: boolean;
  scroungingTimer?: number;
  independentUsedThisAilment?: boolean;
  visitedLocations?: string[];
  curedAilmentInThisWilds?: boolean;
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
  pendingPatientArchive?: PendingPatientArchive | null;
  worldAlmanac?: WorldAlmanacEntry[];
  travelScrapbook?: TravelScrapbookEntry[];
  trinketArchive?: TrinketMemoryRecord[];
  familiarTrust?: number;
  familiarMemories?: string[];
  legacyRestUsedThisLocation?: boolean;
  canFlyOverride?: boolean;
  lostPatientLegacy?: { name: string; species: string; ailmentName: string; day: number; consequence: string } | null;
}

const INITIAL_BIO: ApothecaryBio = {
  name: "",
  descriptor: "Burrowing",
  examples: "오소리, 토끼, 고슴도치, 두더지",
  travelStyle: "Rambling and Ready",
  speed: 3,
  carry: 4,
  originName: "약제사 사고 후의 치료 서비스",
  originDesc: "큰 사고를 당하고 치유를 받으면서 약제사의 길을 걷기로 결심했습니다.",
  familiarName: "",
  familiarBenefit: "따뜻한 약제사 (모든 질병 치료 시작 타이머 +2시간)",
  familiarRelation: "깊은 동반자 (서로 아끼고 의지함)",
  canFly: false
};

const INITIAL_BAG: BagItem[] = [
  { id: "tool_knife", name: "벨트 칼", weight: 1/3, type: "tool" },
  { id: "tool_mortar", name: "나무 절구와 공이 [GRIND/CRUSH]", weight: 1/3, type: "tool" },
  { id: "tool_kettle", name: "낡은 캠프 주전자 [BOIL/BREW]", weight: 1/3, type: "tool" },
  { id: "tool_jaws", name: "이빨 [CHEW/DIGEST]", weight: 0, type: "tool" },
  { id: "tool_paws", name: "앞발/발톱 [ADD/APPLY]", weight: 0, type: "tool" }
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
  bio: INITIAL_BIO,
  reputation: 5,
  currentLocationName: "Starting Oak Road",
  currentLocationType: "Wilds",
  currentRegion: "Forest",
  currentSeason: "Spring",
  bag: INITIAL_BAG,
  trinkets: ["기념품 (Memento)"],
  journeyActive: false,
  journeyOrigin: "",
  journeyDestination: "",
  journeyDistance: "",
  journeyDirection: "",
  journeyGoalTitle: "",
  journeyGoalDesc: "",
  journeyGoalProgress: "",
  calendarDays: 0,
  calendarMaxDays: 12,
  calendarHistory: [],
  activeAilment: null,
  barterCountThisAilment: 0,
  journals: [],
  barrows: [],
  activeDelve: null,
  pursuedByBehemoth: null,
  wagonExpansions: INITIAL_WAGON,
  companions: [],
  resourcefulReagent: "",
  ingenuitiveTool: "",
  clinics: [],
  scroungingMode: false,
  scroungingTimer: 0,
  independentUsedThisAilment: false,
  visitedLocations: ["Starting Oak Road"],
  curedAilmentInThisWilds: false,
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
  pendingPatientArchive: null,
  worldAlmanac: [],
  travelScrapbook: [],
  trinketArchive: [],
  familiarTrust: 0,
  familiarMemories: [],
  legacyRestUsedThisLocation: false,
  lostPatientLegacy: null
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

const formatDateTime = (ts: number) => {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
};

const memoryKey = (...parts: string[]) =>
  parts.join('_').toLowerCase().replace(/[^a-z0-9가-힣]+/gi, '_').replace(/^_+|_+$/g, '');

const cleanMemoryName = (name: string) =>
  name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();

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
    const matchedReag = GAME_DATA.reagents.find(r =>
      r.name.toLowerCase() === name.toLowerCase() ||
      r.rawName.toLowerCase() === name.toLowerCase() ||
      cleanMemoryName(r.name).toLowerCase() === name.toLowerCase() ||
      cleanMemoryName(r.rawName).toLowerCase() === name.toLowerCase()
    );
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
    source: 'Current location',
    notes: `${state.currentLocationType} in ${state.currentRegion}`,
    timestamp: now
  });

  if (state.journeyActive && state.journeyDestination) {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'settlement',
      name: state.journeyDestination,
      locationName: state.journeyDestination,
      region: '',
      source: 'Journey destination',
      notes: `Destination for current travel log: ${state.journeyGoalTitle || 'open journey'}`,
      timestamp: now
    });
  }

  (state.visitedLocations || []).forEach(locationName => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: locationName === state.currentLocationName ? locationCategoryFor(state.currentLocationType) : 'notable',
      name: locationName,
      locationName,
      region: locationName === state.currentLocationName ? state.currentRegion : '',
      source: 'Visited location',
      notes: 'Recorded from travel history.',
      timestamp: now
    });
  });

  (state.clinics || []).forEach(clinic => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'clinic',
      name: `${clinic.locationName} clinic`,
      locationName: clinic.locationName,
      region: clinic.region,
      source: 'Clinic network',
      notes: `Guild service: ${clinic.agendaService.toUpperCase()}`,
      timestamp: now
    });
  });

  (state.barrows || []).forEach(barrow => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'landmark',
      name: barrow.locationName || barrow.name,
      locationName: barrow.locationName,
      region: barrow.region,
      source: 'Barrow rumour',
      notes: `${barrow.behemothClass} behemoth barrow, ${barrow.direction}, ${barrow.distance}`,
      timestamp: now
    });
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'creature',
      name: barrow.name,
      locationName: barrow.locationName,
      region: barrow.region,
      source: 'Barrow rumour',
      notes: `${barrow.behemothClass} behemoth`,
      timestamp: now
    });
  });

  (state.companions || []).forEach(companion => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'creature',
      name: companion.koreanName || companion.name,
      locationName: companion.adoptedLocation,
      region: '',
      source: 'Companion record',
      notes: `${companion.name} joined the travelling apothecary.`,
      timestamp: now
    });
  });

  state.bag.filter(item => item.type === 'reagent').forEach(item => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'reagent',
      name: cleanMemoryName(item.name),
      locationName: state.currentLocationName,
      region: state.currentRegion,
      source: 'Apothecary bag',
      notes: item.preps || 'Reagent carried in the bag.',
      timestamp: now
    });
  });

  Object.values(state.discoveredRecipes || {}).flat().flat().forEach(reagentName => {
    worldAlmanac = upsertAlmanac(worldAlmanac, {
      category: 'reagent',
      name: reagentName,
      locationName: '',
      region: '',
      source: 'Known remedy',
      notes: 'Remembered from a discovered remedy combination.',
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
        title: journal.title.replace('완치 성공', 'Remedy note'),
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
      title: line.startsWith('여정 시작') ? 'Journey departure note' : `Travel log ${idx + 1}`,
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
        source: 'Current collection',
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
        fontFamily: "'Pretendard', -apple-system, sans-serif",
        whiteSpace: 'nowrap'
      }}
    >
      {finalTagText}
    </span>
  );
};

const parseAndRenderTags = (tagsStr: string) => {
  if (!tagsStr) return null;

  let prepared = tagsStr
    .replace(/([a-zA-Z가-힣]+)\s+(\d+)\s*(?:&|및|and)\s*(\d+)/g, '$1 $2 and $1 $3')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by commas, '및', 'and', or '&'
  const parts = prepared.split(/,|\s+및\s+|\s+and\s+|&/gi).map(p => p.trim()).filter(Boolean);

  return (
    <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {parts.map((part, idx) => {
        const isOrChoice = part.includes('또는') || /\bor\b/i.test(part);

        if (isOrChoice) {
          const options = part.split(/\s+또는\s+|\s+or\s+/i).map(o => o.trim()).filter(Boolean);
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
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
                fontFamily: "'Pretendard', -apple-system, sans-serif"
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
const migrateState = (s: any): GameState => {
  if (!s) return INITIAL_STATE;
  return syncWorldMemory({
    ...INITIAL_STATE,
    ...s,
    bio: {
      ...INITIAL_BIO,
      ...(s.bio || {})
    },
    canFlyOverride: s.canFlyOverride !== undefined ? s.canFlyOverride : false,
    wagonExpansions: {
      ...INITIAL_WAGON,
      ...(s.wagonExpansions || {})
    },
    barrows: s.barrows || [],
    activeDelve: s.activeDelve || null,
    pursuedByBehemoth: s.pursuedByBehemoth || null,
    companions: s.companions || [],
    resourcefulReagent: s.resourcefulReagent || "",
    ingenuitiveTool: s.ingenuitiveTool || "",
    clinics: s.clinics || [],
    scroungingMode: s.scroungingMode || false,
    scroungingTimer: s.scroungingTimer || 0,
    independentUsedThisAilment: s.independentUsedThisAilment || false,
    visitedLocations: s.visitedLocations || ["Starting Oak Road"],
    curedAilmentInThisWilds: s.curedAilmentInThisWilds || false,
    lastForageCardValue: s.lastForageCardValue || 0,
    gardenPlant: s.gardenPlant || "",
    gardenHarvestedThisAilment: s.gardenHarvestedThisAilment || false,
    soddenLogInsect: s.soddenLogInsect || "",
    soddenLogHarvestedThisAilment: s.soddenLogHarvestedThisAilment || false,
    goodwillDonationsVal: s.goodwillDonationsVal || 0,
    cumulativeDays: s.cumulativeDays || 0,
    completedReconnecting: s.completedReconnecting || false,
    journeyGoalCounter: s.journeyGoalCounter || 0,
    journeyGoalChecklist: s.journeyGoalChecklist || [],
    journeyStartReputation: s.journeyStartReputation !== undefined ? s.journeyStartReputation : (s.reputation || 5),
    journeyOrigin: s.journeyOrigin || "",
    activeBarter: s.activeBarter || null,
    legacyClinics: s.legacyClinics || [],
    legacyApothecaries: s.legacyApothecaries || [],
    discoveredRecipes: s.discoveredRecipes || {},
    journeyChronicles: s.journeyChronicles || [],
    patientCasebook: (s.patientCasebook && s.patientCasebook.length > 0)
      ? s.patientCasebook.map(normalizeCaseRecord)
      : legacyCaseRecordsFromJournals(s),
    pendingPatientArchive: s.pendingPatientArchive || null,
    worldAlmanac: s.worldAlmanac || [],
    travelScrapbook: s.travelScrapbook || [],
    trinketArchive: (s.trinketArchive && s.trinketArchive.length > 0)
      ? s.trinketArchive.map(normalizeTrinketRecord)
      : trinketArchiveFromCurrent(s),
    familiarTrust: s.familiarTrust || 0,
    familiarMemories: s.familiarMemories || [],
    legacyRestUsedThisLocation: s.legacyRestUsedThisLocation || false,
    lostPatientLegacy: s.lostPatientLegacy || null
  });
};

// Tool existence check helper (takes Ingenuitive familiar benefit into account)
const hasTool = (s: GameState, toolIdOrName: string): boolean => {
  const inBag = s.bag.some(item =>
    item.id === toolIdOrName ||
    item.name.toLowerCase().includes(toolIdOrName.toLowerCase())
  );
  if (inBag) return true;

  const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === s.bio.familiarBenefit)?.mechanic || '';
  if (familiarMechanic === 'ingenuitive' && s.ingenuitiveTool) {
    if (s.ingenuitiveTool === toolIdOrName || s.ingenuitiveTool.toLowerCase().includes(toolIdOrName.toLowerCase())) {
      return true;
    }
  }
  return false;
};

const getFamiliarReduction = (s: GameState, mechanic: string, defaultVal: number = 2): number => {
  const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === s.bio.familiarBenefit)?.mechanic || '';
  if (familiarMechanic !== mechanic) return 0;
  const trust = s.familiarTrust || 0;
  if (trust >= 80) return defaultVal + 2;
  if (trust >= 40) return defaultVal + 1;
  return defaultVal;
};

interface AilmentRequirement {
  alternatives: { tag: string; val: number }[];
  isSpecialBone?: boolean;
}

const parseAilmentRequirements = (tagsStr: string): AilmentRequirement[] => {
  if (!tagsStr) return [];

  // Normalize and translate common connectors
  let prepared = tagsStr.toUpperCase()
    .replace('MINIMUM FAIR', 'MINIMUM_FAIR')
    .replace('INSTINCTS', 'INSTINCT')
    .replace('PARASITES', 'PARASITE')
    .replace('SCALES', 'SCALE');

  // Replace "TAG X 및 Y" with "TAG X 및 TAG Y"
  prepared = prepared.replace(/([A-Z_]+)\s+(\d+)\s*(?:및|&|,)\s*(\d+)/g, '$1 $2 및 $1 $3');

  // Replace newlines and AND connectors with comma
  const normalized = prepared
    .replace(/\r?\n/g, ',')
    .replace(/\s*및\s*/g, ',')
    .replace(/\s*&\s*/g, ',');

  // Split by comma
  const clauses = normalized.split(',').map(s => s.trim()).filter(s => s.length > 0);

  return clauses.map(clause => {
    if (clause.includes('부목') || clause.toUpperCase().includes('BONE') || clause.toUpperCase().includes('SET A BONE')) {
      return { alternatives: [], isSpecialBone: true };
    }

    // Split by OR/또는
    const parts = clause.split(/\s*또는\s*|\s*OR\s*/i);
    const numbers = clause.match(/\d+/g);
    const defaultVal = numbers ? parseInt(numbers[numbers.length - 1]) : 1;

    const alternatives = parts.map(p => {
      const tagMatch = p.match(/[A-Z_]+/);
      const tag = tagMatch ? tagMatch[0] : '';
      const valMatch = p.match(/\d+/);
      const val = valMatch ? parseInt(valMatch[0]) : defaultVal;
      return { tag, val };
    }).filter(item => item.tag !== '');

    return { alternatives };
  });
};

const normalizeEffectTag = (tag: string) => tag.toUpperCase()
  .replace('INSTINCTS', 'INSTINCT')
  .replace('PARASITES', 'PARASITE')
  .replace('SCALES', 'SCALE')
  .replace('MINIMUM_FAIR', 'MINIMUM FAIR');

const reagentEffectText = (item: BagItem) => {
  const explicit = `${item.name || ''} ${item.tags || ''}`;
  if (/\[[A-Z_ ]+\s+\d+\]/i.test(explicit)) return explicit;
  return `${explicit} ${item.preps || ''}`;
};

const splitReagentPreparations = (preps: string) => {
  let parts = (preps || '').split('\n').map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length <= 1) {
    parts = (preps || '').split(/(?=⅓|⅔|1\s|🟢)/).map(p => p.trim()).filter(p => p.length > 0);
  }
  return parts.length > 0 ? parts : ['unprepared specimen'];
};

const createPreparedReagentItem = (r: any, partText: string, idPrefix: string): BagItem => ({
  id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  name: `${r.name} (${partText.trim()})`,
  weight: 1/3,
  type: 'reagent',
  qty: 1,
  tags: partText.trim(),
  preps: r.preps
});

const validateConcoction = (
  ailment: ActiveAilment | null,
  selectedReagents: BagItem[],
  bag: BagItem[],
  s: GameState
) => {
  if (!ailment) {
    return { isComplete: false, totalFair: 0, totalFoul: 0, missingRequirements: [], statusText: "환자 없음" };
  }

  // Parse reagents effects
  const providedEffects: Record<string, number> = {};
  let totalFair = 0;
  let totalFoul = 0;

  selectedReagents.forEach(item => {
    if (!item.name && !item.preps) return;
    const regex = /\[([A-Z_]+)\s+(\d+)\]/g;
    let match;
    const effectText = reagentEffectText(item);
    while ((match = regex.exec(effectText)) !== null) {
      const tag = normalizeEffectTag(match[1]);
      const val = parseInt(match[2]);

      providedEffects[tag] = (providedEffects[tag] || 0) + val;

      if (tag === 'FAIR') {
        totalFair += val;
      }
      if (tag === 'FOUL') {
        totalFoul += val;
      }
    }
  });

  // Verify requirements
  const reqs = parseAilmentRequirements(ailment.tags);
  const missingRequirements: string[] = [];

  reqs.forEach((req) => {
    if (req.isSpecialBone) {
      // Check if selectedReagents or whole bag has a bone setter tool/reagent
      const hasBoneSetter = [...selectedReagents, ...bag].some(item => {
        const nameLower = reagentEffectText(item).toLowerCase();
        return nameLower.includes('oak') || nameLower.includes('가지') || nameLower.includes('splint') || nameLower.includes('부목') || nameLower.includes('bandage') || nameLower.includes('붕대');
      });
      if (!hasBoneSetter) {
        missingRequirements.push("부목용 약재 (Oak Branch or Splint/Bandage)");
      }
    } else {
      // Check normal tag requirement
      const satisfied = req.alternatives.some(alt => {
        if (alt.tag === 'MINIMUM_FAIR') {
          return totalFair >= alt.val;
        }
        return (providedEffects[alt.tag] || 0) >= alt.val;
      });
      if (!satisfied) {
        const reqStr = req.alternatives.map(alt => `${alt.tag} ${alt.val}`).join(" 또는 ");
        missingRequirements.push(reqStr);
      }
    }
  });

  const isComplete = missingRequirements.length === 0;
  let statusText = "불완전 Remedy";
  if (isComplete) {
    statusText = totalFoul > 0 ? "Foul Remedy" : "Fair Remedy";
  }

  return {
    isComplete,
    totalFair,
    totalFoul,
    missingRequirements,
    statusText
  };
};

const checkJourneyGoalSatisfaction = (s: GameState): boolean => {
  const title = s.journeyGoalTitle;
  const counter = s.journeyGoalCounter || 0;
  const checklist = s.journeyGoalChecklist || [];

  if (title === '자아 성찰') {
    return counter >= 3;
  }
  if (title === '관계 회복') {
    return counter >= 3;
  }
  if (title === '길드의 책임') {
    const startRep = s.journeyStartReputation !== undefined ? s.journeyStartReputation : 5;
    return (s.reputation - startRep >= 5) || s.reputation >= 10;
  }
  if (title === '자연 환경 조사') {
    return counter >= 3;
  }
  if (title === '긴급 치료') {
    return s.bag.some(item => {
      if (item.type !== 'reagent' || !item.name) return false;
      const match = /\[(WOUND|INFECTION|SLEEP)\s+(\d+)\]/i.exec(item.name);
      return match !== null && parseInt(match[2]) >= 3;
    });
  }
  if (title === '신선한 영감') {
    const uniqueRegions = new Set(checklist);
    return uniqueRegions.size >= 6;
  }
  if (title === '의학 연구 자료') {
    return counter >= 3;
  }
  if (title === '호송 및 정의') {
    return s.bag.some(item => item.name.includes("Evidence") || item.name.includes("수송 증거물"));
  }
  if (title === '영약 보충') {
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
  if (title === '마음의 정리') {
    return counter >= 3;
  }
  if (title === '마지막 작별') {
    return s.bag.some(item => {
      if (item.type !== 'reagent' || !item.name) return false;
      const match = /\[ELSEWHERE\s+(\d+)\]/i.exec(item.name);
      return match !== null && parseInt(match[2]) >= 2;
    });
  }
  if (title === '방랑벽') {
    const uniqueRegions = new Set(checklist);
    return uniqueRegions.size >= 5;
  }
  return false;
};

const checkReagentGatherForGoal = (s: GameState, reagentName: string) => {
  let nextGoalCounter = s.journeyGoalCounter || 0;
  let nextChecklist = [...(s.journeyGoalChecklist || [])];
  if (s.journeyActive && s.journeyGoalTitle === '신선한 영감') {
    const dbReag = GAME_DATA.reagents.find(item => item.name.toLowerCase().includes(reagentName.toLowerCase()) || item.rawName.toLowerCase().includes(reagentName.toLowerCase()));
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
  const dbReag = GAME_DATA.reagents.find(r => r.name === item.name || r.rawName === item.name);
  return dbReag ? (dbReag.type === 'PLANT' || dbReag.type === 'INSECT') : false;
};

// Helper for max carry capacity
const getMaxCarry = (s: GameState): number => {
  let base = s.bio.carry;
  if (s.wagonExpansions?.baseUnit) {
    base += s.wagonExpansions.sideBrackets ? 6 : 4;
  }
  // Check tools in bag
  const hasSaddlebags = hasTool(s, 'saddlebag') || hasTool(s, '새들백') || hasTool(s, '안장가방');
  if (hasSaddlebags) base += 2;

  const hasSatchel = s.bag.some(item =>
    item.id === 'knit_satchel' ||
    item.name.toLowerCase().includes('satchel') ||
    item.name.includes('새철') ||
    item.name.includes('책가방')
  );
  if (hasSatchel) base += 1;

  // Familiar: Vigorous — +2 Carry (or +4 with Wagon), rulebook p.14
  const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === s.bio.familiarBenefit)?.mechanic || '';
  if (familiarMechanic === 'vigorous' || s.bio.familiarBenefit.includes('힘센 일꾼')) {
    base += s.wagonExpansions?.baseUnit ? 4 : 2;
  }

  return base;
};

// Helper for speed
const getTravelSpeed = (s: GameState, weight: number): number => {
  const maxCarry = getMaxCarry(s);
  if (weight > maxCarry) return 1; // Over Encumbered

  let base = s.bio.speed;
  if (s.wagonExpansions?.baseUnit) {
    base += s.wagonExpansions.axelSprings ? 2 : 1;
  }
  return base;
};

const calculateForageRarity = (s: GameState, r: any, regionName: string = s.currentRegion): number => {
  const isInSeason = r.seasons.includes(s.currentSeason);
  const isLocal = r.regions.includes(regionName);
  const baseRarity = r.br + (isLocal ? 0 : 3) + (isInSeason ? 0 : 3);
  let finalRarity = baseRarity;

  if (r.type === 'PLANT') {
    finalRarity = Math.max(1, finalRarity - getFamiliarReduction(s, 'brushwise'));
  }
  if (r.type === 'TITAN') {
    finalRarity = Math.max(1, finalRarity - getFamiliarReduction(s, 'titanwise'));
  }

  return finalRarity;
};

const calculateBarterRarity = (s: GameState, r: any, isCity: boolean): number => {
  let finalRarity = r.br;
  const isLocal = r.regions.includes(s.currentRegion);
  const isInSeason = r.seasons.includes(s.currentSeason);
  const preps = r.preps || '';

  if (isLocal) {
    finalRarity -= 2;
  } else if (isCity) {
    // The app tracks region rather than exact path distance, so city trade route
    // support is modelled as any reagent available to the current city region.
    finalRarity -= 2;
  }

  if (isInSeason) {
    finalRarity -= 1;
  } else if (!isLocal && !isCity) {
    finalRarity += 2;
  }

  if (/\[FAIR\s+\d+\]/i.test(preps)) {
    finalRarity += 3;
  }

  if (/\[[A-Z_]+\s+3\]/i.test(preps)) {
    finalRarity += 5;
  }

  const foulMatches = [...preps.matchAll(/\[FOUL\s+(\d+)\]/gi)];
  const foulPenalty = foulMatches.reduce((sum, match) => sum + (parseInt(match[1]) || 0), 0);
  finalRarity += foulPenalty;

  if (s.reputation >= 35) finalRarity -= 2;
  else if (s.reputation >= 25) finalRarity -= 1;
  else if (s.reputation < 15) finalRarity += 1;

  const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === s.bio.familiarBenefit)?.mechanic || '';
  if (familiarMechanic === 'chatty' || s.bio.familiarBenefit.includes('말동무')) {
    finalRarity -= getFamiliarReduction(s, 'chatty');
  }

  return Math.max(1, finalRarity);
};

const TOOLS_DB = [
  { id: 'tool_tent', name: '가죽 텐트 (Canvas Tent)', cost: 3, weight: 1, desc: '날씨(Weather) 태그 조우의 부정적 효과를 무시합니다. 사용 후 클로버/스페이드 드로우 시 파손.', places: 'Meadows Settlements' },
  { id: 'tool_frying_pan', name: '구리 프라이팬 (Copper Frying Pan)', cost: 6, weight: 2/3, desc: '[COOKED] 조제법 활성화.', places: 'Mountain Settlements' },
  { id: 'tool_cauldron', name: '철제 가마솥 (Big Iron Cauldron)', cost: 7, weight: 1, desc: '[DISTILLED] 조제법 활성화 및 치료제 보존[PRESERVE] 가능.', places: 'Mountain/Bog Settlements' },
  { id: 'tool_coracle', name: '자작나무 보트 (Bark Coracle)', cost: 5, weight: 1, desc: '영약재 분실 없이 물길 이동 가능. 호수 구역 채집 시 희귀도 -2.', places: 'Loch Settlements' },
  { id: 'tool_crossbow', name: '석궁 (Crossbow)', cost: 5, weight: 1, desc: '맹수(Beast)나 거대야수 조우 시 부정적 결과를 회피합니다. 볼트 탄약 필요.', places: 'Spoolkeep' },
  { id: 'tool_bolts', name: '석궁 볼트 (Bolts)', cost: 1, weight: 1/3, desc: '석궁 발사에 사용되는 탄약. 사용 후 폐기.', places: 'Any' },
  { id: 'tool_bandolier', name: '그린포 반도리어 (Greenpaw Bandolier)', cost: 5, weight: 1, desc: '식물 및 곤충 약재를 5 무게분까지 수납 가능하며, 수납된 무게에 상관없이 반도리어의 총 무게는 1로 고정됩니다.', places: 'Noonhill' },
  { id: 'tool_alembic', name: '유리 증류기 (Glass Alembic)', cost: 10, weight: 2/3, desc: '치료제 조제 시 동일 태그의 두 약재를 촉매[CATALYSE]하여 태그 가치 합산.', places: 'Loch Settlements' },
  { id: 'tool_spidersilk_net', name: '스파이더실크 그물 (Fine Spidersilk Net)', cost: 4, weight: 1/3, desc: '채집 시 곤충 약재 및 작은 물고기의 희귀도 -3.', places: 'Forest Settlements' },
  { id: 'tool_fairwind_spices', name: '페어윈드 양념 (Fairwind Spices)', cost: 10, weight: 1, desc: '제작하는 모든 치료제에 [FAIR 1] 효과를 추가합니다.', places: 'Odoak' },
  { id: 'tool_comb', name: '참빗 (Fine-toothed Comb)', cost: 3, weight: 1/3, desc: '치료제에 [FUR 3] 및 [PARASITE 1] 제공. 사용 후 스페이드 드로우 시 파손.', places: 'Forest/Mountain Settlements' },
  { id: 'tool_needles', name: '뜨개바늘 (Knitting Needles)', cost: 2, weight: 1/3, desc: '채집 대신 뜨개질 프로젝트(담요, 코트, 가방, 목도리)를 개시하여 도구를 제작합니다.', places: 'Noonhill' },
  { id: 'tool_instruments', name: '악기 (Instruments)', cost: 5, weight: 1, desc: '정착지/도시 진입 후 사역마나 다른 동료와 연주회를 열어 장신구를 획득합니다.', places: 'Forest/Bog Settlements' },
  { id: 'tool_waxed_satchel', name: '방수 가방 (Waxed Satchel)', cost: 5, weight: 1, desc: '영약재 분실 없이 물길 이동 가능.', places: 'Any' },
  { id: 'tool_stilts', name: '죽창 (Stilts)', cost: 3, weight: 1/3, desc: '수렁(Bog)에서 이동 시작 시 속도 +1.', places: 'Noonhill' },
  { id: 'tool_saddlebags', name: '안장가방 (Saddlebags)', cost: 3, weight: 0, desc: '가방 소지 한도 +2 (사역마에게도 1개 장착 가능).', places: 'Any' }
];

const WAGON_UPGRADES_DB = [
  { id: 'baseUnit', name: '기본 수레 (Base Unit)', cost: 15, desc: '가방 소지 한도 +4, 이동 속도 +1.', city: 'Any City' },
  { id: 'sealedCarriage', name: '밀폐식 마차와 돛 (Sealed Carriage & Sails)', cost: 10, desc: '마차 탑승 상태에서 영약재 분실 없이 수로 이동 및 정박 가능 (보트 재활용 시 5 할인).', city: 'Newdam' },
  { id: 'pedalMotor', name: '페달 모터 (Pedal Motor)', cost: 6, desc: '두 개의 연결된 수로를 단일 수로처럼 연달아 이동 가능.', city: 'Vessel' },
  { id: 'axelSprings', name: '차축 스프링 (Axel Springs)', cost: 7, desc: '마차가 제공하는 속도 보너스가 +1에서 +2로 상향됩니다.', city: 'Any City' },
  { id: 'sideBrackets', name: '측면 브래킷 (Side Brackets)', cost: 7, desc: '마차가 제공하는 소지 용량 보너스가 +4에서 +6으로 상향됩니다.', city: 'Any City' },
  { id: 'hiveBrackets', name: '벌집 브래킷 (Hive Brackets)', cost: 7, desc: '여정 도중 동반자를 최대 2마리까지 동행할 수 있습니다.', city: 'Odoak' },
  { id: 'passengerBooth', name: '조수석 부스 (Passenger Booth)', cost: 20, desc: '이동 중 승객을 동승시킬 수 있으며, 승객이 임시 사역마 역할을 수행합니다.', city: 'Summit' },
  { id: 'shadowCanvas', name: '그림자 캔버스 (Shadow Canvas)', cost: 5, desc: '정착지 진입 시 인형극을 열어 길드 명성을 +1 얻습니다.', city: 'Spoolkeep' },
  { id: 'experimentalContraption', name: '비행 기구 개조 (Experimental Balloon)', cost: 20, desc: '비행(Soar) 이동이 가능해지지만, 비행 이동 시 일정이 3일 소모됩니다.', city: 'Glasswall' },
  { id: 'clayPots', name: '이식용 진흙 화분 (Clay Pots)', cost: 5, desc: '마차 안에서 식물 약재 1종을 직접 재배하여 이동 2회당 1회씩 수확할 수 있습니다.', city: 'Noonhill' }
];

const COMPANIONS_DB = [
  { id: 'beetle', name: '딱정벌레 (Beetle)', cost: 5, region: 'Meadow, Mountain', desc: '여정당 1회, 맹수(Beast) 조우의 부정적 효과를 무시합니다.' },
  { id: 'caterpillar', name: '애벌레 (Caterpillar)', cost: 3, region: 'Bog, Forest', desc: 'Lesser/Intermediate 질병 타이머 시작 시 +1시간. 1시즌 후 나비로 탈바꿈합니다.' },
  { id: 'butterfly', name: '나비 (Butterfly)', cost: 12, region: 'Bog, Meadow', desc: '봄/여름 채집 시, 식물 약재의 희귀도를 1만큼 감소시킵니다.' },
  { id: 'honeybee', name: '꿀벌 (Honeybee)', cost: 8, region: 'Forest, Meadow', desc: '10경로를 이동할 때마다 벌집(꿀) 약재 1개를 생성합니다.' },
  { id: 'spider', name: '거미 (Spider)', cost: 7, region: 'Bog, Mountain', desc: '채집 시 곤충 약재의 희귀도를 1만큼 감소시킵니다.' },
  { id: 'pond_skimmer', name: '소금쟁이 (Pond Skimmer)', cost: 6, region: 'Loch', desc: '여정당 1회, 호수(Loch) 조우 카드를 다시 드로우합니다.' },
  { id: 'wasp', name: '말벌 (Wasp)', cost: 8, region: 'Forest, Mountain', desc: '10경로를 이동할 때마다 곤충 약재 1개를 수렵해 옵니다.' }
];

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'play' | 'bio' | 'reagents' | 'ailments' | 'patientArchive' | 'livingArchive' | 'map' | 'journals'>('play');
  const [highlightedPatientId, setHighlightedPatientId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTravelEncounter, setActiveTravelEncounter] = useState<any | null>(null);
  const [activeForageEncounter, setActiveForageEncounter] = useState<any | null>(null);

  // Seasoned & Titanwise familiar benefit states
  const [seasonedDraws, setSeasonedDraws] = useState<Array<{ suit: string; val: number }>>([]);
  const [showSeasonedModal, setShowSeasonedModal] = useState(false);
  const [titanwiseDraws, setTitanwiseDraws] = useState<Array<{ suit: string; val: number }>>([]);
  const [showTitanwiseModal, setShowTitanwiseModal] = useState(false);

  // Downtime & Delve states
  const [downtimeTab, setDowntimeTab] = useState<'activities' | 'shop' | 'companions' | 'start'>('activities');
  const [gpAilment, setGpAilment] = useState("");
  const [gpTagChange, setGpTagChange] = useState("");
  const [gpNote, setGpNote] = useState("");
  const [replenishReagentIndex, setReplenishReagentIndex] = useState<number>(-1);
  const [replenishNote, setReplenishNote] = useState("");
  const [barterJournalNote, setBarterJournalNote] = useState("");
  const [rumourCards, setRumourCards] = useState<{ suit: string; val: string; text?: string }[]>([]);
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
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && cloudData['apawthecaria_rpg_state']) {
              const parsed = JSON.parse(cloudData['apawthecaria_rpg_state']);
              const localStr = localStorage.getItem('apawthecaria_rpg_state');
              if (localStr) {
                const localParsed = JSON.parse(localStr);
                const isLocalDefault = !localParsed.bio?.name && (!localParsed.journals || localParsed.journals.length === 0);
                if (isLocalDefault || confirm("구글 클라우드에 백업된 아포테카리아 데이터를 발견했습니다. 불러오시겠습니까?\n(불러오면 현재 진행 중인 로컬 데이터는 덮어씌워집니다.)")) {
                  setState(migrateState(parsed));
                  localStorage.setItem('apawthecaria_rpg_state', JSON.stringify(parsed));
                }
              } else {
                setState(migrateState(parsed));
                localStorage.setItem('apawthecaria_rpg_state', JSON.stringify(parsed));
              }
            }
          } else {
            const localStr = localStorage.getItem('apawthecaria_rpg_state');
            if (localStr) {
              await setDoc(userDocRef, { 'apawthecaria_rpg_state': localStr }, { merge: true });
            }
          }
        } catch (err) {
          console.error("Failed to check cloud save during login:", err);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Load initial state
  useEffect(() => {
    const loadSave = async () => {
      const loaded = await store.load('apawthecaria_rpg_state', null);
      if (loaded) {
        setState(migrateState(loaded));
      } else {
        setState(syncWorldMemory(INITIAL_STATE));
      }
      setLoading(false);
    };
    loadSave();
  }, []);

  // Auto-save wrapper
  const updateState = (updater: (prev: GameState) => GameState) => {
    setState(prev => {
      if (!prev) return prev;
      let next = updater(prev);
      next = syncWorldMemory(next);

      store.set('apawthecaria_rpg_state', next);
      return next;
    });
  };

  const handleBarterProgressToDeal = () => {
    if (!state?.activeBarter) return;
    const suits = ['♥', '♦', '♣', '♠'];
    const dealSuit = suits[Math.floor(Math.random() * suits.length)];
    const dealVal = Math.floor(Math.random() * 13) + 1;

    updateState(s => {
      if (!s.activeBarter) return s;
      return {
        ...s,
        activeBarter: {
          ...s.activeBarter,
          dealCard: { suit: dealSuit, val: dealVal },
          phase: 'deal',
          journalNote: barterJournalNote
        }
      };
    });
  };

  const handleBarterFinalize = (isSuccess: boolean, paidTrinketsCount: number = 0, paidReputationCount: number = 0) => {
    if (!state?.activeBarter) return;
    const { reagentName, finalRarity, socialCard, socialEncounter, dealCard, journalNote } = state.activeBarter;
    const r = GAME_DATA.reagents.find(item => item.name === reagentName);
    if (!r) return;

    updateState(s => {
      let nextBag = s.bag;
      let nextTrinkets = s.trinkets;
      let nextReputation = s.reputation;
      let journalTitle = `🤝 물꼬 거래 실패: ${reagentName}`;
      let journalText = `[사교 조우: ${socialEncounter.title}]\n소감: ${journalNote || '협상에 실패했다.'}\n\n- 거래 희귀도: ${finalRarity}\n- 거래 카드: ${dealCard?.suit} ${dealCard?.val} (실패)`;

      if (isSuccess) {
        const firstPart = splitReagentPreparations(r.preps)[0];
        const newBagItem = createPreparedReagentItem(r, firstPart, 'barter_reag');
        nextBag = [...s.bag, newBagItem];

        if (paidTrinketsCount > 0 || paidReputationCount > 0) {
          nextTrinkets = s.trinkets.slice(paidTrinketsCount);
          nextReputation = Math.max(0, s.reputation - paidReputationCount);
          journalTitle = `🤝 거래 강제 성사: ${reagentName}`;
          journalText = `[사교 조우: ${socialEncounter.title}]\n소감: ${journalNote || '추가 대가를 치르고 거래를 마쳤다.'}\n\n- 거래 희귀도: ${finalRarity}\n- 거래 카드: ${dealCard?.suit} ${dealCard?.val} (장신구 ${paidTrinketsCount}개, 길드 명성 ${paidReputationCount}점 지불 성사)\n- 획득 영약재: ${r.name}`;
        } else {
          journalTitle = `🤝 거래 성사: ${reagentName}`;
          journalText = `[사교 조우: ${socialEncounter.title}]\n소감: ${journalNote || '협상에 성공했다.'}\n\n- 거래 희귀도: ${finalRarity}\n- 거래 카드: ${dealCard?.suit} ${dealCard?.val} (성공)\n- 획득 영약재: ${r.name}`;
        }
      }

      return {
        ...s,
        bag: nextBag,
        trinkets: nextTrinkets,
        reputation: nextReputation,
        barterCountThisAilment: s.barterCountThisAilment + 1,
        activeBarter: null,
        journals: [
          {
            id: 'barter_finish_' + Date.now(),
            title: journalTitle,
            text: journalText,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    setBarterJournalNote("");
    alert(isSuccess ? "🤝 거래가 완료되어 가방에 약재를 추가하고 저널에 기록했습니다!" : "🤝 거래에 실패하여 빈손으로 복귀하고 저널에 기록했습니다.");
  };

  const handleRetireClick = () => {
    if (!state) return;
    if (!confirm('현재 캐릭터를 은퇴시키겠습니까? (세이브 데이터의 클리닉 네트워크와 약전 처방이 다음 세대로 상속됩니다)')) {
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
      services: [c.agendaService],
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
    alert(`🌅 [대승계 완료]\n\n${retiredApothecaryName} 약제사가 은퇴하고 명예의 전당에 헌액되었습니다.\n새로운 약제사가 스승의 유산을 물려받고 방랑을 시작합니다!`);
  };

  const handleLegacyClinicRest = () => {
    if (!state) return;
    if (state.legacyRestUsedThisLocation) {
      alert("이미 이 구역의 선배 진료소에서 충분히 쉬고 물자를 보급받았습니다.");
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

      const commonReagents = GAME_DATA.reagents.filter(r => r.br <= 4);
      const randomReagent = commonReagents[Math.floor(Math.random() * commonReagents.length)];
      const firstPart = randomReagent.preps.split(']')[0] ? randomReagent.preps.split(']')[0] + ']' : 'Reagent Part';
      const itemGift: BagItem = {
        id: 'legacy_gift_' + Date.now(),
        name: `${randomReagent.name} (Part: ${firstPart})`,
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

    alert("🏡 선배의 진료소 휴식 완료!\n\n- 환자 치료 타이머 +1시간 확보\n- 거수 추격 선행거리 +1칸 벌어짐\n- 무작위 보급 약재 1개 획득!");
  };

  const handleFamiliarSpendTime = () => {
    if (!state) return;
    if ((state.familiarTrust || 0) >= 100) {
      alert("사역마와의 친밀도가 이미 최대치(100%)입니다! 더할 나위 없이 끈끈한 유대감을 느끼고 있습니다.");
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
            title: `🐾 사역마 교감: 시간 보내기`,
            text: `하루 동안 사역마와 숲속을 산책하고 털을 빗겨주며 따뜻한 교감을 나눴습니다.\n- 친밀도(Trust): ${(s.familiarTrust || 0)}% → ${nextTrust}%\n- 달력 일정 +1일 소모`,
            timestamp
          },
          ...s.journals
        ]
      };
    });

    alert("🐾 사역마와 따뜻한 시간을 보냈습니다. 친밀도가 5% 상승하고, 일정 1일이 경과했습니다.");
  };

  const handleFamiliarFeedReagent = (reagentItemId: string) => {
    if (!state) return;
    if ((state.familiarTrust || 0) >= 100) {
      alert("사역마와의 친밀도가 이미 최대치(100%)입니다!");
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
            title: `🐾 사역마 교감: 맛있는 약재 간식`,
            text: `가방에서 맛있는 약재 [${foundItem.name}]을(를) 꺼내 사역마에게 간식으로 챙겨주었습니다. 사역마가 기쁘게 받아먹으며 꼬리를 흔들었습니다.\n- 친밀도(Trust): ${(s.familiarTrust || 0)}% → ${nextTrust}%\n- 약재 소비: ${foundItem.name}`,
            timestamp
          },
          ...s.journals
        ]
      };
    });

    alert(`🐾 사역마에게 [${foundItem.name}]을(를) 간식으로 주었습니다. 친밀도가 15% 상승했습니다!`);
  };

  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Google Sign-in error:", e);
      alert("로그인 중 에러가 발생했습니다: " + e.message);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        await signOut(auth);
        const loaded = await store.load('apawthecaria_rpg_state', null);
        if (loaded) {
          setState(migrateState(loaded));
        } else {
          setState(syncWorldMemory(INITIAL_STATE));
        }
      } catch (e: any) {
        console.error("Sign-out error:", e);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("⚠️ 경고: 정말 모든 진행상황과 연대기를 초기화하고 새로운 약제사로 시작하시겠습니까? (저널 일지 기록도 함께 삭제됩니다.)")) {
      updateState(() => syncWorldMemory(INITIAL_STATE));
      setActiveTab('play');
    }
  };

  if (loading || !state) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.2rem', background: 'var(--bg-gradient)', color: 'var(--text-bright)' }}>
        <div className="stamped-icon" style={{ width: '76px', height: '76px', fontSize: '0.82rem', animation: 'cute-bounce 2s infinite ease-in-out' }}>APO</div>
        <h2 style={{ letterSpacing: 0, color: 'var(--text-bright)' }}>Apawthecaria Field Journal</h2>
        <p style={{ color: 'var(--text-muted)' }}>여행 약제사의 기록장을 여는 중...</p>
      </div>
    );
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
    const r = GAME_DATA.reagents.find(item => item.name === reagentName || item.name.toLowerCase().includes(reagentName.toLowerCase()) || item.rawName.toLowerCase().includes(reagentName.toLowerCase()));
    if (!r) {
      alert("영약재 이름을 도감에서 찾을 수 없습니다.");
      return;
    }
    const parts = splitReagentPreparations(r.preps);
    const chosenPart = prompt(`가방에 넣을 ${r.name} 부위를 선택하세요:\n${parts.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}`);
    if (!chosenPart) return;
    const partIdx = Math.max(0, (parseInt(chosenPart) || 1) - 1);
    const partText = parts[partIdx] || parts[0];
    const timestamp = Date.now();

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

  const handleAddForageFindToBag = (find: ForageFind, idx: number) => {
    addPreparedReagentToInventory(find.name, 'forage_find', () => {
      setActiveForageEncounter((prev: any) => {
        if (!prev) return prev;
        const nextFinds = [...(prev.foundReagents || [])];
        nextFinds.splice(idx, 1);
        return { ...prev, foundReagents: nextFinds };
      });
    });
  };

  const applyEncounterStateEffect = (effect: 'gainFP' | 'loseFP' | 'gainTime' | 'loseTime' | 'gainReagent' | 'loseReagent' | 'gainTrinket' | 'loseTrinket' | 'startPursuit') => {
    const amountInput = ['gainFP', 'loseFP', 'gainTime', 'loseTime', 'gainTrinket', 'loseTrinket', 'startPursuit'].includes(effect)
      ? prompt("적용할 수치를 입력하세요:", effect === 'startPursuit' ? "6" : "1")
      : null;
    const amount = Math.max(0, parseInt(amountInput || "0") || 0);
    const timestamp = Date.now();

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
      let note = "";

      if ((effect === 'gainFP' || effect === 'loseFP' || effect === 'gainTime' || effect === 'loseTime') && !nextAilment) {
        alert("현재 치료 중인 환자가 없어 이 효과를 적용할 수 없습니다.");
        return s;
      }

      if (effect === 'gainFP' && nextAilment) {
        nextAilment = { ...nextAilment, foragingPoints: nextAilment.foragingPoints + amount };
        note = `조우 효과: FP +${amount}`;
      } else if (effect === 'loseFP' && nextAilment) {
        nextAilment = { ...nextAilment, foragingPoints: Math.max(0, nextAilment.foragingPoints - amount) };
        note = `조우 효과: FP -${amount}`;
      } else if (effect === 'gainTime' && nextAilment) {
        nextAilment = { ...nextAilment, timer: nextAilment.timer + amount, maxTimer: Math.max(nextAilment.maxTimer, nextAilment.timer + amount) };
        note = `조우 효과: 치료 시간 +${amount}`;
      } else if (effect === 'loseTime' && nextAilment) {
        nextAilment = { ...nextAilment, timer: Math.max(0, nextAilment.timer - amount) };
        note = `조우 효과: 치료 시간 -${amount}`;
      } else if (effect === 'loseReagent') {
        const reagents = nextBag.filter(item => item.type === 'reagent');
        if (reagents.length === 0) {
          alert("잃을 영약재가 가방에 없습니다.");
          return s;
        }
        const choice = prompt(`잃을 영약재 번호를 선택하세요:\n${reagents.map((item, i) => `${i + 1}. ${item.name}`).join('\n')}`, "1");
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
      }

      return {
        ...s,
        activeAilment: nextAilment,
        bag: nextBag,
        trinkets: nextTrinkets,
        pursuedByBehemoth: nextPursued,
        journals: note ? [
          { id: `encounter_effect_${timestamp}`, title: '조우 상태 효과 적용', text: note, timestamp },
          ...s.journals
        ] : s.journals
      };
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      {/* Header Banner */}
      <header style={{ borderBottom: '1.5px solid var(--border-cozy)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, background: '#fbfaf4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span className="stamped-icon" style={{ width: '42px', height: '42px', fontSize: '0.65rem', transform: 'rotate(-4deg)' }}>APO</span>
          <div>
            <h1 className="cute-title" style={{ margin: 0, fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setActiveTab('play')}>
              Apawthecaria Field Journal
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {state.bio.name ? `${state.bio.name}의 여행 약제사 기록` : 'guild papers, field notes, maps, and medical cases'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {isFirebaseConfigured && auth && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', background: 'var(--primary-light)', borderRadius: '20px', border: '1.5px solid var(--glass-border)' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="profile" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>ID</span>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{user.displayName || '약제사'}</span>
                <button onClick={handleSignOut} style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={handleSignIn} style={{ padding: '0.4rem 0.8rem', border: '1.5px solid var(--primary)', borderRadius: '20px', background: 'transparent', color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 'bold' }}>
                Google 기록 동기화
              </button>
            )
          )}
          <button onClick={handleReset} style={{ padding: '0.4rem 0.8rem', border: '1.5px solid var(--accent-red)', borderRadius: '20px', background: 'transparent', color: 'var(--accent-red)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
            새 기록지 시작
          </button>
        </div>
      </header>

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
                { id: 'patientArchive', label: '환자 기록장', sub: '기억 속 야수들' },
                { id: 'livingArchive', label: '살아 있는 기록들', sub: '표본과 이야기' },
                { id: 'map', label: '접어둔 지도', sub: '가시덤불 숲' },
                { id: 'journals', label: '들녘의 일지', sub: '방랑기' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
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
              <span>Poulticepounder Record</span>
              <span className="journal-stamp" style={{ color: getReputationRank(state.reputation).color, borderColor: getReputationRank(state.reputation).color }}>
                {getReputationRank(state.reputation).rank}
              </span>
            </h3>
            {state.bio.name ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                <div><strong>이름:</strong> {state.bio.name}</div>
                <div><strong>종족:</strong> {state.bio.descriptor} ({state.bio.examples})</div>
                <div><strong>이동 스타일:</strong> {state.bio.travelStyle}</div>
                 <div><strong>속도:</strong> {travelSpeed} | <strong>길드 명성:</strong> {state.reputation}</div>

                {state.bio.familiarName && (
                  <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                    🐾 <strong>사역마:</strong> {state.bio.familiarName}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>- 특성: {state.bio.familiarBenefit}</div>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                  🎒 <strong>배낭 무게:</strong> <span style={{ color: isOverEncumbered ? 'var(--accent-red)' : 'var(--primary)', fontWeight: 'bold' }}>{formatWeight(currentWeight)}</span> / {maxCarry}
                  {isOverEncumbered && (
                    <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.1rem' }}>
                      ⚠️ 과다적재! 이동 거리가 1일당 1경로로 고정됩니다.
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
            <span className="document-kicker">Journey / Calendar</span>
            {state.journeyActive ? (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{state.journeyDestination}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>방향: {state.journeyDirection} | 거리: {state.journeyDistance}</div>

                <div className="calendar-counter" style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{state.calendarDays}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/</div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{state.calendarMaxDays} 일</div>
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.8rem' }}>
                  <button onClick={() => updateState(s => ({ ...s, calendarDays: s.calendarDays + 1 }))} style={{ flex: 1, padding: '0.3rem', background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.8rem' }}>+1일 경과</button>
                  <button onClick={() => updateState(s => ({ ...s, calendarDays: Math.max(0, s.calendarDays - 1) }))} style={{ padding: '0.3rem 0.5rem', background: '#f5f5f5', color: '#666', borderRadius: '4px', fontSize: '0.8rem' }}>-1</button>
                </div>
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
          {activeTab === 'play' && (
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
            />
          )}
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
              setActiveTab={setActiveTab}
              setHighlightedPatientId={setHighlightedPatientId}
            />
          )}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'journals' && (
            <JournalsView
              state={state}
              updateState={updateState}
              highlightedPatientId={highlightedPatientId}
              setHighlightedPatientId={setHighlightedPatientId}
            />
          )}
        </main>
      </div>

      {/* Travel Encounter Dialog Modal */}
      {activeTravelEncounter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', background: '#fff', position: 'relative', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', borderRadius: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src={getCardSvgUrl(activeTravelEncounter.suit, activeTravelEncounter.cardValue)}
                alt={`${activeTravelEncounter.suitLabel} ${activeTravelEncounter.cardValue}`}
                style={{ width: '100px', height: '150px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', marginBottom: '0.8rem' }}
              />
              <h2 style={{ color: 'var(--primary)', margin: '0.5rem 0 0 0' }}>여정 조우 (Page {activeTravelEncounter.page})</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>뽑은 카드: {activeTravelEncounter.cardValue} {activeTravelEncounter.suitLabel}</div>
            </div>

            <h3 style={{ borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-bright)' }}>
              {activeTravelEncounter.title}
            </h3>

            <p style={{ fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto', background: '#faf8f4', padding: '1rem', borderRadius: '10px', color: 'var(--text-bright)', borderLeft: '4.5px solid var(--primary)' }}>
              {activeTravelEncounter.text}
            </p>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fbfaf4', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
              <div className="document-kicker" style={{ marginBottom: '0.45rem' }}>Structured encounter effects</div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                  ['gainFP', 'Gain FP'],
                  ['loseFP', 'Lose FP'],
                  ['gainTime', 'Gain Time'],
                  ['loseTime', 'Lose Time'],
                  ['gainReagent', 'Gain Reagent'],
                  ['loseReagent', 'Lose Reagent'],
                  ['gainTrinket', 'Gain Trinket'],
                  ['loseTrinket', 'Lose Trinket'],
                  ['startPursuit', 'Start Pursuit']
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
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  // Prompt user to write about this encounter
                  const note = prompt("이 조우에 대해 저널에 한 줄 소감을 남겨주세요 (선택):");
                  if (note !== null) {
                    updateState(s => ({
                      ...s,
                      journals: [
                        {
                          id: 'journal_' + Date.now(),
                          title: `여정 조우: ${activeTravelEncounter.title}`,
                          text: `[페이지 ${activeTravelEncounter.page} - 드로우: ${activeTravelEncounter.cardValue} ${activeTravelEncounter.suitLabel}]\n${activeTravelEncounter.text}\n\n나의 행동: ${note || '묵묵히 길을 나아갔다.'}`,
                          timestamp: Date.now()
                        },
                        ...s.journals
                      ]
                    }));
                  }
                  setActiveTravelEncounter(null);
                }}
                style={{ flex: 1, padding: '0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}
              >
                Journal Only / 조우 해결
              </button>
              <button onClick={() => setActiveTravelEncounter(null)} style={{ padding: '0.8rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Foraging Encounter Dialog Modal */}
      {activeForageEncounter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', background: '#fff', position: 'relative', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', borderRadius: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src={getCardSvgUrl(activeForageEncounter.suit, activeForageEncounter.cardValue)}
                alt={`${activeForageEncounter.suitLabel} ${activeForageEncounter.cardValue}`}
                style={{ width: '100px', height: '150px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', marginBottom: '0.8rem' }}
              />
              <h2 style={{ color: 'var(--primary)', margin: '0.5rem 0 0 0' }}>채집 및 조우 (Page {activeForageEncounter.page})</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>뽑은 카드: {activeForageEncounter.cardValue} {activeForageEncounter.suitLabel}</div>
            </div>

            <h3 style={{ borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-bright)' }}>
              {activeForageEncounter.title}
            </h3>

            <p style={{ fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', background: '#faf8f4', padding: '1rem', borderRadius: '10px', color: 'var(--text-bright)', borderLeft: '4.5px solid var(--primary)' }}>
              {activeForageEncounter.text}
            </p>

            <div style={{ marginTop: '1rem', background: '#f0f9f4', padding: '1rem', borderRadius: '10px', borderLeft: '4.5px solid var(--secondary)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--secondary)', fontSize: '0.95rem' }}>🌿 Resolve Forage Finds</h4>
              {activeForageEncounter.foundReagents.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {activeForageEncounter.foundReagents.map((find: ForageFind | string, idx: number) => {
                    const normalizedFind: ForageFind = typeof find === 'string'
                      ? { name: find.replace(/\s*\(.*/, ''), rarity: 0 }
                      : find;
                    return (
                      <li key={`${normalizedFind.name}_${idx}`} style={{ color: '#2b5e3d', fontWeight: 'bold' }}>
                        <span>{normalizedFind.name} {normalizedFind.rarity ? `(희귀도: ${normalizedFind.rarity}${normalizedFind.fpAvailable ? ', FP 가능' : ''})` : ''}</span>
                        <button
                          type="button"
                          onClick={() => handleAddForageFindToBag(normalizedFind, idx)}
                          style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--secondary)', color: '#fff', borderRadius: '4px', border: 'none' }}
                        >
                          부위 선택 후 가방에 추가
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

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fbfaf4', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
              <div className="document-kicker" style={{ marginBottom: '0.45rem' }}>Structured encounter effects</div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                  ['gainFP', 'Gain FP'],
                  ['loseFP', 'Lose FP'],
                  ['gainTime', 'Gain Time'],
                  ['loseTime', 'Lose Time'],
                  ['gainReagent', 'Gain Reagent'],
                  ['loseReagent', 'Lose Reagent'],
                  ['gainTrinket', 'Gain Trinket'],
                  ['loseTrinket', 'Lose Trinket'],
                  ['startPursuit', 'Start Pursuit']
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
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const note = prompt("채집 조우와 발견한 약초에 대한 저널 기록 소감 (선택):");
                  if (note !== null) {
                    updateState(s => {
                      const listStr = activeForageEncounter.foundReagents.length > 0
                        ? activeForageEncounter.foundReagents.map((find: ForageFind | string) => typeof find === 'string' ? find : `${find.name} (희귀도: ${find.rarity}${find.fpAvailable ? ', FP 가능' : ''})`).join(', ')
                        : '없음 (+1 채집포인트)';
                      return {
                        ...s,
                        journals: [
                          {
                            id: 'forage_' + Date.now(),
                            title: `🌿 채집 일지: ${activeForageEncounter.title}`,
                            text: `[페이지 ${activeForageEncounter.page} - 드로우: ${activeForageEncounter.cardValue} ${activeForageEncounter.suitLabel}]\n위치: ${s.currentLocationName} (${activeForageEncounter.region} / ${s.currentSeason})\n조우 결과: ${activeForageEncounter.text}\n발견한 영약재: ${listStr}\n\n기록: ${note || '조심스럽게 약초 채집을 마무리했다.'}`,
                            timestamp: Date.now()
                          },
                          ...s.journals
                        ]
                      };
                    });
                  }
                  setActiveForageEncounter(null);
                }}
                style={{ flex: 1, padding: '0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}
              >
                Journal Only / 조우 해결
              </button>
              <button onClick={() => setActiveForageEncounter(null)} style={{ padding: '0.8rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Seasoned (베테랑 여행자) 카드 선택 모달 */}
      {showSeasonedModal && seasonedDraws.length === 2 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>🧭 베테랑 여행자 (Seasoned) 조우 선택</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              사역마의 베테랑 길잡이 혜택으로 2장의 카드 중 여정 조우에 적용할 카드를 선택합니다.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.8rem' }}>
              {seasonedDraws.map((card, idx) => {
                const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };
                const displayVal = card.val === 1 ? 'Ace' : card.val === 11 ? 'Jack' : card.val === 12 ? 'Queen' : card.val === 13 ? 'King' : card.val;
                return (
                  <div
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>🏛️ 유적/고분 마스터 (Titanwise) 채집 선택</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              티탄 유적이나 고분에서 2장의 카드 중 채집에 적용할 카드를 선택합니다.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.8rem' }}>
              {titanwiseDraws.map((card, idx) => {
                const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };
                const displayVal = card.val === 1 ? 'Ace' : card.val === 11 ? 'Jack' : card.val === 12 ? 'Queen' : card.val === 13 ? 'King' : card.val;
                return (
                  <div
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

      {/* 2-Step Barter Modal */}
      {state?.activeBarter && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '2px solid var(--primary)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤝 물꼬 거래 (Bartering) — {state.activeBarter.reagentName}
            </h3>

            {state.activeBarter.phase === 'social' && (
              <>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', fontWeight: 'bold' }}>
                    1단계: 사교 조우 (Social Encounter Card Draw)
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <img
                      src={getCardSvgUrl(state.activeBarter.socialCard.suit, state.activeBarter.socialCard.val)}
                      alt="Social Card"
                      style={{ width: '60px', height: '90px', objectFit: 'contain' }}
                    />
                    <div>
                      <strong>드로우된 카드:</strong> {suitLabels[state.activeBarter.socialCard.suit]} {state.activeBarter.socialCard.val === 1 ? 'A' : state.activeBarter.socialCard.val === 11 ? 'J' : state.activeBarter.socialCard.val === 12 ? 'Q' : state.activeBarter.socialCard.val === 13 ? 'K' : state.activeBarter.socialCard.val} <br />
                      <strong>조우 카드 이름:</strong> {state.activeBarter.socialEncounter.title} (p.{state.activeBarter.socialEncounter.page})
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.4, background: '#fff', padding: '0.6rem', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                    "{state.activeBarter.socialEncounter.text}"
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)' }}>✍️ 사교 조우 소감 및 상황 묘사 (저널에 기록됨):</label>
                  <textarea
                    rows={3}
                    placeholder="상인과 만난 대화 분위기나 협상 상황 등을 적어주세요..."
                    value={barterJournalNote}
                    onChange={e => setBarterJournalNote(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={handleBarterProgressToDeal}
                    className="btn-cozy-primary"
                    style={{ flex: 1, padding: '0.6rem' }}
                  >
                    🎲 2단계 Rarity 판정 카드 드로우
                  </button>
                  <button
                    onClick={() => {
                      updateState((s: GameState) => ({ ...s, activeBarter: null }));
                      setBarterJournalNote("");
                    }}
                    style={{ padding: '0.6rem 1.2rem', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    거래 중단
                  </button>
                </div>
              </>
            )}

            {state.activeBarter.phase === 'deal' && state.activeBarter.dealCard && (() => {
              const cardVal = state.activeBarter.dealCard.val;
              const dealSuit = state.activeBarter.dealCard.suit;
              const finalRarity = state.activeBarter.finalRarity;
              const success = cardVal >= finalRarity;
              const diff = finalRarity - cardVal;
              const canPayTrinkets = state.trinkets.length >= diff;
              const canPayReputation = state.reputation >= diff;

              return (
                <>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', fontWeight: 'bold' }}>
                      2단계: Rarity 검증 (Rarity Check Card Draw)
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img
                        src={getCardSvgUrl(dealSuit, cardVal)}
                        alt="Deal Card"
                        style={{ width: '70px', height: '105px', objectFit: 'contain' }}
                      />
                      <div>
                        <strong>목표 희귀도 (Rarity):</strong> {finalRarity} <br />
                        <strong>판정 카드:</strong> {suitLabels[dealSuit]} {cardVal === 1 ? 'A' : cardVal === 11 ? 'J' : cardVal === 12 ? 'Q' : cardVal === 13 ? 'K' : cardVal} <br />
                        <strong>판정 결과:</strong> {success ? (
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✅ 거래 성공!</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>❌ 거래 실패 (차이: {diff})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {success ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleBarterFinalize(true)}
                        className="btn-cozy-primary"
                        style={{ flex: 1, padding: '0.6rem' }}
                      >
                        🤝 거래 성사 및 약재 수령
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        판정 카드가 목표 희귀도보다 낮아 거래에 실패했습니다. 장신구 또는 길드 명성 {diff}점을 지불하면 강제로 물꼬를 성사시킬 수 있습니다. (장신구: {state.trinkets.length}개 / 명성: {state.reputation}점)
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleBarterFinalize(true, diff)}
                          className="btn-cozy-primary"
                          style={{ flex: 1, padding: '0.6rem' }}
                          disabled={!canPayTrinkets}
                        >
                          🪙 장신구 {diff}개 지불하고 강제 성사
                        </button>
                        <button
                          onClick={() => handleBarterFinalize(true, 0, diff)}
                          className="btn-cozy-primary"
                          style={{ flex: 1, padding: '0.6rem' }}
                          disabled={!canPayReputation}
                        >
                          📜 명성 {diff}점 지불하고 강제 성사
                        </button>
                        <button
                          onClick={() => handleBarterFinalize(false)}
                          style={{ flex: 1, padding: '0.6rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                        >
                          빈손으로 퇴각 (실패 종료)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Succession (Inheritance Selection) Modal */}
      {showSuccessionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '2px solid var(--secondary)' }}>
            <h3 style={{ margin: 0, color: 'var(--secondary)', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌅 스승의 유산 계승 (Apothecary Succession)
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
    </div>
  );
}

// =================================================================
// 5. PLAY VIEW COMPONENT
// =================================================================
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
  handleFamiliarFeedReagent
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
}) {
  const [destName, setDestName] = useState("");
  const [destRegion, setDestRegion] = useState("Forest");
  const [destType, setDestType] = useState("Wilds");

  const [newAilmentName, setNewAilmentName] = useState("");
  const [patientNameDraft, setPatientNameDraft] = useState("");
  const [patientSpeciesDraft, setPatientSpeciesDraft] = useState("");
  const [patientInitialNoteDraft, setPatientInitialNoteDraft] = useState("");
  const [finalArchiveNoteDraft, setFinalArchiveNoteDraft] = useState("");
  const [isBookmarkedDraft, setIsBookmarkedDraft] = useState(false);

  // Concoction State
  const [selectedBagItems, setSelectedBagItems] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Manual Card Selector State
  const [nextLocName, setNextLocName] = useState("");
  const [isWaterway, setIsWaterway] = useState(false);
  const [travelCardMode, setTravelCardMode] = useState<'random' | 'manual'>('random');
  const [selectedTravelSuit, setSelectedTravelSuit] = useState('♥');
  const [selectedTravelValue, setSelectedTravelValue] = useState(1);

  const [forageCardMode, setForageCardMode] = useState<'random' | 'manual'>('random');
  const [selectedForageSuit, setSelectedForageSuit] = useState('♥');
  const [selectedForageValue, setSelectedForageValue] = useState(1);

  // Barrow Delve UI state
  const [delveActive, setDelveActive] = useState(false);
  const [delveDrawnSuit, setDelveDrawnSuit] = useState<string>('');
  const [delveChallenge, setDelveChallenge] = useState<string>('');
  // Blackjack (Pilfer Unnoticed) state
  const [blackjackCards, setBlackjackCards] = useState<number[]>([]);
  const [blackjackStanding, setBlackjackStanding] = useState(false);
  // Collapsed Entrance / Invigorating Tea state
  const [delveTimer, setDelveTimer] = useState(0);
  const [delveFP, setDelveFP] = useState(0);
  // Speed-1-next-move flag (after Flee to Safety)
  const [fleeSafetyPending, setFleeSafetyPending] = useState(false);

  // Downtime state
  const [downtimeTab, setDowntimeTab] = useState<'activities' | 'shop' | 'companions' | 'start'>('activities');
  const [bypassShopRules, setBypassShopRules] = useState(false);
  const [rumourCards, setRumourCards] = useState<Array<{ text: string; suit: string; val: string }>>([]);
  const [rumourBarrowName, setRumourBarrowName] = useState('');
  const [rumourLocName, setRumourLocName] = useState('');
  const [gpAilment, setGpAilment] = useState('');
  const [gpTagChange, setGpTagChange] = useState('');
  const [gpNote, setGpNote] = useState('');
  const [scroungeReagentRegion, setScroungeReagentRegion] = useState("Forest");
  const [selectedAgendaService, setSelectedAgendaService] = useState("pantry");
  const [independentAdjRegion, setIndependentAdjRegion] = useState("Forest");

  useEffect(() => {
    setFinalArchiveNoteDraft(state.pendingPatientArchive?.initialRememberedNote || '');
    setIsBookmarkedDraft(false);
  }, [state.pendingPatientArchive?.sourceId]);

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
  const [replenishReagentIndex, setReplenishReagentIndex] = useState(0);
  const [replenishNote, setReplenishNote] = useState('');
  const [selectedToolToUpgrade, setSelectedToolToUpgrade] = useState('');
  const [selectedUpgradeOption, setSelectedUpgradeOption] = useState('');

  useEffect(() => {
    setLocalSeason(state.currentSeason);
  }, [state.currentSeason]);

  useEffect(() => {
    if (state.activeDelve) {
      setDelveActive(true);
      setDelveChallenge(state.activeDelve.challengeType || '');
      setDelveTimer(state.activeDelve.timer || 0);
      setDelveFP(state.activeDelve.points || 0);
    } else {
      setDelveActive(false);
      setDelveChallenge('');
      setDelveTimer(0);
      setDelveFP(0);
    }
  }, [state.activeDelve]);

  const atClinicLocation = (state.clinics || []).some(c => c.locationName === state.currentLocationName);
  const inClinicRegion = (state.clinics || []).some(c => c.region === state.currentRegion);

  useEffect(() => {
    (window as any)._onSelectSeasonedCard = (suit: string, val: number) => {
      executeTravelMove(suit, val, isWaterway);
    };
    (window as any)._onSelectTitanwiseCard = (suit: string, val: number) => {
      executeForageDraw(suit, val);
    };
    return () => {
      delete (window as any)._onSelectSeasonedCard;
      delete (window as any)._onSelectTitanwiseCard;
    };
  }, [state, destRegion, nextLocName, destType, currentWeight, travelCardMode, selectedTravelSuit, selectedTravelValue, forageCardMode, selectedForageSuit, selectedForageValue, isWaterway]);
  const handlePassHour = (amt: number = 1) => {
    if (!state.activeAilment) return;
    updateState((s: GameState) => {
      if (!s.activeAilment) return s;
      const nextTimer = Math.max(0, s.activeAilment.timer - amt);

      let nextAilment = { ...s.activeAilment, timer: nextTimer };
      let newRep = s.reputation;
      let journals = [...s.journals];

      if (nextTimer === 0) {
        // Trigger Consequence
        alert(`💥 침상의 야수가 깊은 고통 끝에 쓸쓸히 숨을 거두었습니다: \n${s.activeAilment.consequence}`);
        // Deduct reputation based on severity
        const loss = s.activeAilment.severity === 'dire' ? 4 : s.activeAilment.severity === 'severe' ? 3 : s.activeAilment.severity === 'intermediate' ? 2 : 1;
        newRep = Math.max(0, s.reputation - loss);
        const timestamp = Date.now();
        const sourceId = 'cure_fail_timer_' + timestamp;
        const notes = `방랑의 여정이 이어지는 동안, 약제소 침상에 누워있던 야수의 시간이 속절없이 흘러가 버렸습니다. 미처 적절한 처방을 지어 올리기도 전에 병증이 그가 견딜 수 없을 만큼 깊어졌고, 결국 약제사로서 그의 마지막 동반자가 되어주지 못했습니다. 침상 위에 홀로 남겨진 흔적(${s.activeAilment.consequence})만이 쓸쓸하게 공방의 정적 속에 남아, 약을 지어 올리지 못한 내 미숙함을 호되게 꾸짖는 듯합니다.`;

        journals.unshift({
          id: sourceId,
          title: `🕯️ 짚침상에 머문 슬픔: ${s.activeAilment.patientName || '이름 없는 이'}의 마지막 숨결`,
          text: notes,
          timestamp
        });

        const pendingArchive = createPendingPatientArchive(s, sourceId, 'failure', notes, [], s.activeAilment.consequence, timestamp);
        nextAilment = null as any;
        return {
          ...s,
          reputation: newRep,
          activeAilment: null,
          pendingPatientArchive: pendingArchive,
          journals,
          lostPatientLegacy: {
            name: s.activeAilment!.patientName || 'Anonymous patient',
            species: s.activeAilment!.species || 'Unknown species',
            ailmentName: s.activeAilment!.name,
            day: s.cumulativeDays || s.calendarDays || 0,
            consequence: s.activeAilment!.consequence
          }
        };
      }

      return {
        ...s,
        reputation: newRep,
        activeAilment: nextAilment === null ? null : nextAilment,
        journals
      };
    });
  };

  // Downtime Actions handlers
  const handleDrawRumours = () => {
    if (state.reputation < 15) {
      alert("길드 평판이 '인지도 있음(15+)' 이상이어야 소문을 들을 수 있습니다.");
      return;
    }
    // Rulebook p.40: 도시에서 여정을 마쳤을 때만 소문을 들을 수 있음
    if (state.currentLocationType !== 'City') {
      alert('소문 듣기는 🏙️ 도시(City)에서만 가능합니다!\n현재 위치에서는 사용할 수 없습니다.');
      return;
    }
    const suits = ['♥', '♦', '♣', '♠'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    // Draw 4 cards
    const drawn = Array.from({ length: 4 }, () => {
      const s = suits[Math.floor(Math.random() * suits.length)];
      const v = values[Math.floor(Math.random() * values.length)];
      return { suit: s, val: v };
    });

    const behemothClasses = { '♥': 'Towering', '♦': 'Many', '♣': 'Violent', '♠': 'Demanding' };
    const behemothLabels = { '♥': '거대 야수 (Towering Behemoth)', '♦': '군집 야수 (Many Behemoth)', '♣': '포악 야수 (Violent Behemoth)', '♠': '까다로운 야수 (Demanding Behemoth)' };
    const directions = { '♥': '북쪽 (North)', '♦': '남쪽 (South)', '♣': '동쪽 (East)', '♠': '서쪽 (West)' };
    const regions = { '♥': '숲 (Forest)', '♦': '산맥 (Mountain)', '♣': '수렁 (Bog)', '♠': '초원 (Meadow)' };
    const distances = { '♥': '1-2 Paths', '♦': '4-5 Paths', '♣': '7-10 Paths', '♠': '15+ Paths' };

    const c1 = drawn[0].suit as '♥' | '♦' | '♣' | '♠';
    const c2 = drawn[1].suit as '♥' | '♦' | '♣' | '♠';
    const c3 = drawn[2].suit as '♥' | '♦' | '♣' | '♠';
    const c4 = drawn[3].suit as '♥' | '♦' | '♣' | '♠';

    const bClass = behemothClasses[c1];
    const bDir = directions[c2];
    const bRegion = regions[c3];
    const bDist = distances[c4];

    setRumourCards([
      { ...drawn[0], text: `거수 유형: ${behemothLabels[c1]}` },
      { ...drawn[1], text: `출현 방향: ${bDir}` },
      { ...drawn[2], text: `출현 지역: ${bRegion}` },
      { ...drawn[3], text: `출현 거리: ${bDist}` }
    ]);
    setRumourBarrowName(`${behemothLabels[c1].split(' (')[0]} ${state.bio.name || '야수'}의 무덤`);
    setRumourLocName("");
  };

  const handleEstablishBarrow = () => {
    if (!rumourBarrowName.trim() || !rumourLocName.trim()) {
      alert("무덤 이름과 배치할 지도 위치명을 적어주세요!");
      return;
    }
    const behemothClasses = { '♥': 'Towering', '♦': 'Many', '♣': 'Violent', '♠': 'Demanding' };
    const c1 = rumourCards[0].suit as '♥' | '♦' | '♣' | '♠';
    const bClass = behemothClasses[c1] as 'Towering' | 'Many' | 'Violent' | 'Demanding';

    updateState(s => {
      const nextBarrows = [...(s.barrows || [])];
      nextBarrows.push({
        id: 'barrow_' + Date.now(),
        name: rumourBarrowName.trim(),
        behemothClass: bClass,
        direction: rumourCards[1].text?.split(': ')[1] || "",
        region: rumourCards[2].text?.split(': ')[1] || "",
        distance: rumourCards[3].text?.split(': ')[1] || "",
        locationName: rumourLocName.trim()
      });

      return {
        ...s,
        barrows: nextBarrows,
        journals: [
          {
            id: 'barrow_log_' + Date.now(),
            title: `🗺️ 거수 무덤 소문: ${rumourBarrowName.trim()}`,
            text: `도시에서 들은 소문에 의하면, ${rumourCards[1].text} 지역의 ${rumourCards[2].text} 방향에 있는 ${rumourCards[3].text} 거리에 ${rumourBarrowName.trim()}가 발견되었다고 합니다. 해당 위치는 ${rumourLocName.trim()}입니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert("거대 야수 고분이 지도에 기록되었습니다!");
    setRumourCards([]);
    setRumourBarrowName("");
    setRumourLocName("");
  };

  const handleGeneralPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpAilment.trim() || !gpTagChange.trim() || !gpNote.trim()) {
      alert("질병명, 태그 변경 사항, 그리고 진료 일지를 적어주세요!");
      return;
    }

    updateState(s => {
      const earned = Array(5).fill("진료 보상 장신구 (Trinket)");
      return {
        ...s,
        trinkets: [...s.trinkets, ...earned],
        journals: [
          {
            id: 'gp_' + Date.now(),
            title: `🩺 휴식기 일반 진료: ${gpAilment.trim()}`,
            text: `마을 야수들을 치료하고 5 장신구를 획득했습니다.\n- 질병 처치: ${gpAilment.trim()} (태그 변경: ${gpTagChange.trim()})\n- 진료 일지: ${gpNote.trim()}`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert("일반 진료 활동을 마치고 5 장신구를 획득했습니다!");
    setGpAilment("");
    setGpTagChange("");
    setGpNote("");
  };

  const handleReplenishStocks = (e: React.FormEvent) => {
    e.preventDefault();
    if (replenishReagentIndex < 0) {
      alert("보충할 약재를 골라주세요!");
      return;
    }
    const matchingReagents = GAME_DATA.reagents.filter(r =>
      r.regions.includes(state.currentRegion) &&
      r.seasons.includes(state.currentSeason)
    );
    const selected = matchingReagents[replenishReagentIndex];
    if (!selected) return;
    const replenishParts = splitReagentPreparations(selected.preps);
    const replenishChoice = prompt(`보충할 ${selected.name} 부위를 선택하세요:\n${replenishParts.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}`);
    if (!replenishChoice) return;
    const replenishPart = replenishParts[Math.max(0, (parseInt(replenishChoice) || 1) - 1)] || replenishParts[0];

    updateState(s => {
      const newItem = createPreparedReagentItem(selected, replenishPart, 'replenished');
      return {
        ...s,
        bag: [...s.bag, newItem],
        journals: [
          {
            id: 'replenish_' + Date.now(),
            title: `🧺 휴식기 재고 보충: ${selected.name}`,
            text: `${s.currentLocationName} 주변을 한적하게 거닐며 ${selected.name} (${replenishPart.trim()}) 약재를 채집해 가방을 보충했습니다.\n- 일지 기록: ${replenishNote.trim() || '평화롭게 숲을 거닐며 약초들을 보충했다.'}`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`${selected.name} 약재를 가방에 보충했습니다!`);
    setReplenishReagentIndex(-1);
    setReplenishNote("");
  };

  const handleWorkingOnYourself = (choice: 'speed' | 'carry' | 'style', styleVal?: string) => {
    if (choice === 'style' && styleVal === '가볍고 신속하게') {
      if (!(state.bio.canFly || state.canFlyOverride)) {
        alert("🦅 비행 능력(Can Fly) 또는 하우스 룰이 비행 제약 무시 상태여야 '가볍고 신속하게' 이동 스타일을 선택할 수 있습니다!");
        return;
      }
    }

    updateState(s => {
      let nextBio = { ...s.bio };
      let logText = "";
      if (choice === 'speed') {
        nextBio.speed += 1;
        logText = "자기 성찰과 훈련을 통해 방랑 이동 속도를 1만큼 증가시켰습니다 (+1 Speed).";
      } else if (choice === 'carry') {
        nextBio.carry += 1;
        logText = "체력 훈련과 짐 싸기 연구를 통해 가방 용량을 1만큼 증가시켰습니다 (+1 Carry).";
      } else if (choice === 'style' && styleVal) {
        nextBio.travelStyle = styleVal;
        const styleData = GAME_DATA.bioChoices.travelStyles.find(st => st.name === styleVal);
        if (styleData) {
          nextBio.speed = styleData.speed;
          nextBio.carry = styleData.carry;
        }
        logText = `이동 스타일을 "${styleVal}"로 새롭게 변경했습니다.`;
      }
      return {
        ...s,
        bio: nextBio,
        journals: [
          {
            id: 'self_' + Date.now(),
            title: `🌱 휴식기 자기 계발`,
            text: logText,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });
    alert("자기 계발 효과가 적용되었습니다!");
  };

  const handleBuyTool = (tool: any) => {
    if (state.trinkets.length < tool.cost) {
      alert("장신구가 부족합니다!");
      return;
    }
    updateState(s => {
      const nextTrinkets = s.trinkets.slice(tool.cost);
      const newItem: BagItem = {
        id: 'purchased_' + Date.now(),
        name: tool.name,
        weight: tool.weight,
        type: 'tool',
        qty: 1
      };
      return {
        ...s,
        trinkets: nextTrinkets,
        bag: [...s.bag, newItem],
        journals: [
          {
            id: 'shop_' + Date.now(),
            title: `🛒 도구 구매: ${tool.name}`,
            text: `장신구 ${tool.cost}개를 지불하고 ${tool.name} 도구를 구입했습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });
    alert(`${tool.name} 도구를 구매했습니다!`);
  };

  const handleUpgradeTool = () => {
    if (state.trinkets.length < 3) {
      alert("도구 개조에는 3 장신구가 필요합니다!");
      return;
    }
    if (!selectedToolToUpgrade || !selectedUpgradeOption) {
      alert("개조할 도구와 업그레이드 품목을 골라주세요!");
      return;
    }

    const tObj = state.bag.find(item => item.id === selectedToolToUpgrade);
    if (!tObj) return;

    updateState(s => {
      const nextTrinkets = s.trinkets.slice(3);
      const nextBag = s.bag.filter(item => item.id !== selectedToolToUpgrade);
      let weight = 1/3;
      if (selectedUpgradeOption.includes("Pairing") || selectedUpgradeOption.includes("페어링")) weight = 0;
      else if (selectedUpgradeOption.includes("Granite") || selectedUpgradeOption.includes("Double Boiler") || selectedUpgradeOption.includes("Steel Axe") || selectedUpgradeOption.includes("화강암") || selectedUpgradeOption.includes("이중 가마솥") || selectedUpgradeOption.includes("강철 도끼")) weight = 1;
      else if (selectedUpgradeOption.includes("Copper Kettle") || selectedUpgradeOption.includes("Silver Sickle") || selectedUpgradeOption.includes("구리 주전자") || selectedUpgradeOption.includes("은빛 낫")) weight = 2/3;

      const newItem: BagItem = {
        id: 'upgraded_' + Date.now(),
        name: selectedUpgradeOption,
        weight: weight,
        type: 'tool',
        qty: 1
      };

      return {
        ...s,
        trinkets: nextTrinkets,
        bag: [...nextBag, newItem],
        journals: [
          {
            id: 'upgrade_' + Date.now(),
            title: `🛠️ 도구 업그레이드: [${tObj.name}] -> [${selectedUpgradeOption}]`,
            text: `장신구 3개를 지불하고 smithing 개조를 거쳐 [${selectedUpgradeOption}]를 얻었습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert("도구 업그레이드가 성공적으로 완료되었습니다!");
    setSelectedToolToUpgrade("");
    setSelectedUpgradeOption("");
  };

  const handleBuyWagonUpgrade = (upgrade: any) => {
    let cost = upgrade.cost;
    if (upgrade.id === 'sealedCarriage' && state.bag.some(item => item.name.includes('Coracle') || item.name.includes('보트'))) {
      cost = 5;
    }

    if (state.trinkets.length < cost) {
      alert("장신구가 부족합니다!");
      return;
    }

    updateState(s => {
      const nextTrinkets = s.trinkets.slice(cost);
      const nextWagon = {
        ...(s.wagonExpansions || INITIAL_WAGON),
        [upgrade.id]: true
      };

      return {
        ...s,
        trinkets: nextTrinkets,
        wagonExpansions: nextWagon,
        journals: [
          {
            id: 'wagon_' + Date.now(),
            title: `🚚 마차 업그레이드: ${upgrade.name}`,
            text: `장신구 ${cost}개를 지불하고 마차 옵션 [${upgrade.name}]을 설치했습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`마차 업그레이드 [${upgrade.name}]를 적용했습니다!`);
  };

  const handleAdoptCompanion = (companion: any) => {
    if (state.trinkets.length < companion.cost) {
      alert("장신구가 부족합니다!");
      return;
    }

    updateState(s => {
      const nextTrinkets = s.trinkets.slice(companion.cost);
      let nextCompanions = [...(s.companions || [])];

      const maxAllowed = s.wagonExpansions?.hiveBrackets ? 2 : 1;
      let releasedMsg = "";
      if (nextCompanions.length >= maxAllowed) {
        const released = nextCompanions.shift();
        releasedMsg = `\n(기존 동반자였던 [${released?.koreanName}]은 야생으로 자연스레 돌아갑니다.)`;
      }

      nextCompanions.push({
        id: 'comp_' + Date.now(),
        name: companion.id,
        koreanName: companion.name.split(' (')[0],
        adoptedLocation: s.currentLocationName
      });

      return {
        ...s,
        trinkets: nextTrinkets,
        companions: nextCompanions,
        journals: [
          {
            id: 'companion_' + Date.now(),
            title: `🐝 동반자 고용: ${companion.name}`,
            text: `장신구 ${companion.cost}개를 지불하고 동반자 [${companion.name}]을 고용했습니다.${releasedMsg}`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`${companion.name}을 동반자로 영입했습니다!`);
  };

  const handleReleaseCompanion = (id: string) => {
    if (confirm("이 동료를 자연의 야생으로 방생하시겠습니까?")) {
      updateState(s => ({
        ...s,
        companions: (s.companions || []).filter(c => c.id !== id)
      }));
    }
  };

  const handleStartJourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName) {
      alert("목적지 이름을 적어주세요!");
      return;
    }

    // Goal and Distance Draw
    const suits = ['♥', '♦', '♣', '♠'];
    const suitNames: { [key: string]: string } = { '♥': '북쪽', '♦': '남쪽', '♣': '동쪽', '♠': '서쪽' };
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const cardVal = Math.floor(Math.random() * 13) + 1; // 1 to 13

    let distLabel = "";
    let maxDays = 12;

    if (cardVal <= 6) {
      distLabel = "가까운 거리 — 12일 경로 이하";
      maxDays = state.reputation >= 35 ? 3 : state.reputation >= 25 ? 6 : state.reputation >= 15 ? 9 : 12;
    } else if (cardVal <= 9) {
      distLabel = "먼 거리 — 13~24일 경로";
      maxDays = state.reputation >= 35 ? 6 : state.reputation >= 25 ? 9 : state.reputation >= 15 ? 12 : 15;
    } else {
      distLabel = "지평선 너머 — 24일 이상 대도시";
      maxDays = state.reputation >= 35 ? 9 : state.reputation >= 25 ? 12 : state.reputation >= 15 ? 15 : 20;
    }

    // Select random goal
    const goalObj = GAME_DATA.goals[Math.floor(Math.random() * GAME_DATA.goals.length)];

    updateState(s => {
      let nextBag = s.bag;
      if (goalObj.title === '호송 및 정의') {
        const hasEvidence = s.bag.some(item => item.name.includes("수송 증거물") || item.id === 'evidence_item');
        if (!hasEvidence) {
          nextBag = [
            ...s.bag,
            { id: 'evidence_item', name: '수송 증거물 (Evidence)', weight: 1/3, type: 'item', qty: 1 }
          ];
        }
      }

      return {
        ...s,
        journeyActive: true,
        journeyOrigin: s.currentLocationName,
        journeyDestination: destName,
        journeyDistance: distLabel,
        journeyDirection: suitNames[randomSuit] || randomSuit,
        journeyGoalTitle: goalObj.title,
        journeyGoalDesc: goalObj.desc,
        journeyGoalProgress: goalObj.goalText,
        calendarDays: 0,
        calendarMaxDays: maxDays,
        calendarHistory: [`여정 시작: ${destName}로 출발! (일수: ${maxDays}일 목표: ${goalObj.title})`],
        journeyGoalCounter: 0,
        journeyGoalChecklist: [],
        journeyStartReputation: s.reputation,
        bag: nextBag,
        journals: [
          {
            id: 'start_' + Date.now(),
            title: `새 여정 시작: ${destName}`,
            text: `${s.currentLocationName}에서 ${destName}로 출발합니다.\n목표: ${goalObj.title} - ${goalObj.desc}\n해결 일정: ${maxDays}일\n방향: ${suitNames[randomSuit]}`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    setDestName("");
  };

  const executeTravelMove = (drawnSuit: string, cardVal: number, travelWaterway: boolean = false) => {
    const maxCarry = getMaxCarry(state);
    const travelSpeed = getTravelSpeed(state, currentWeight);
    const isOverEncumbered = currentWeight > maxCarry;
    const pathsTravelled = isOverEncumbered ? 1 : travelSpeed;

    // Waterway checks and penalty calculation
    let lostReagentItem: BagItem | null = null;
    let lostReagentText = "";

    const hasWaterwayEquipment =
      hasTool(state, 'tool_coracle') || hasTool(state, 'coracle') || hasTool(state, '자작나무 보트') ||
      hasTool(state, 'tool_waxed_satchel') || hasTool(state, 'waxed_satchel') || hasTool(state, '방수 가방') ||
      !!state.wagonExpansions?.sealedCarriage ||
      state.bio.travelStyle === '가볍고 신속하게' ||
      (state.companions || []).some(comp => ['butterfly', 'honeybee', 'wasp', 'pond_skimmer'].includes(comp.name));

    if (travelWaterway && !hasWaterwayEquipment) {
      const reagentItems = state.bag.filter(item => item.type === 'reagent');
      if (reagentItems.length > 0) {
        const target = reagentItems[Math.floor(Math.random() * reagentItems.length)];
        lostReagentItem = target;
        alert(`🌊 수로 이동 안전 장비(자작나무 보트, 방수 가방 등)와 비행/수생 동반자가 없습니다!\n강을 헤엄쳐 건너야 하므로, 물에 젖어 가방 속의 약재 중 무작위 1개 [${target.name}]를 유실합니다.`);
        lostReagentText = `\n\n🌊 [헤엄쳐 수로 건너기 페널티]\n수로 이동 도구가 없어 강을 헤엄쳐 건넜으며, 약재 "${target.name}" 1개를 잃었습니다.`;
      } else {
        alert("🌊 수로 이동 안전 장비가 없습니다!\n강을 헤엄쳐 건넜으나 가방에 분실할 약재가 없었습니다.");
        lostReagentText = "\n\n🌊 [헤엄쳐 수로 건너기 페널티]\n수로 이동 도구가 없어 강을 헤엄쳐 건넜으나 유실할 약재가 없었습니다.";
      }
    }

    // Map cardVal to look up string
    let cardKey = "";
    if (cardVal === 1) cardKey = "ace & 2";
    else if (cardVal === 2) cardKey = "ace & 2";
    else if (cardVal === 3 || cardVal === 4) cardKey = "3 & 4";
    else if (cardVal === 5 || cardVal === 6) cardKey = "5 & 6";
    else if (cardVal === 7 || cardVal === 8) cardKey = "7 & 8";
    else if (cardVal === 9 || cardVal === 10) cardKey = "9 & 10";
    else if (cardVal === 11) cardKey = "J";
    else cardKey = "M"; // Jack / Monarch

    // Seek the travel encounters list in gameData
    const regionEncounters = GAME_DATA.travelEncounters[destRegion as any] || [];
    // Match based on cardKey
    // Also, seasonal adjustments if multiple exist
    const matchingEncs = regionEncounters.filter((e: any) => e.card === cardKey);
    let selectedEnc = matchingEncs[0] || { title: "호젓한 오솔길", text: "특별한 문제 없이 평화롭게 가시나무 숲 길을 지나갑니다. 주변 약초들의 향기를 맡으며 길을 재촉합니다.", page: 74 };

    if (matchingEncs.length > 1) {
      const seasonIndex = state.currentSeason === 'Spring' ? 0 : state.currentSeason === 'Summer' ? 1 : state.currentSeason === 'Autumn' ? 2 : 3;
      selectedEnc = matchingEncs[seasonIndex % matchingEncs.length] || matchingEncs[0];
    }

    const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };

    // Familiar: Brave benefit
    const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit)?.mechanic || '';
    let braveTextExtra = "";
    let braveReagentToAdd: BagItem | null = null;

    const isBehemothEnc = selectedEnc.title.toLowerCase().includes("behemoth") ||
                          selectedEnc.text.toLowerCase().includes("behemoth") ||
                          selectedEnc.title.includes("거수") ||
                          selectedEnc.text.includes("거수");

    if (familiarMechanic === 'brave' && isBehemothEnc && (drawnSuit === '♥' || drawnSuit === '♦')) {
      const candidateReagents = GAME_DATA.reagents.filter(r => r.regions.includes(destRegion) && r.br <= 6);
      if (candidateReagents.length > 0) {
        const selectedR = candidateReagents[Math.floor(Math.random() * candidateReagents.length)];
        braveReagentToAdd = {
          id: 'brave_reag_' + Date.now(),
          name: `${selectedR.name} (Brave 획득)`,
          weight: 1/3,
          type: 'reagent',
          qty: 1,
          preps: selectedR.preps
        };
        braveTextExtra = `\n\n🐾 [용감한 동반자 (Brave) 효과 발동!]\n거대 야수와 마주쳤으나 사역마의 용기 덕분에 긍정적으로 해결되었습니다. 지역 약재인 "${selectedR.name}"을(를) 획득했습니다!`;
      } else {
        braveTextExtra = `\n\n🐾 [용감한 동반자 (Brave) 효과 발동!]\n거대 야수와 마주쳤으나 사역마의 용기 덕분에 위기를 모면했습니다. (이 지역에 희귀도 6 이하 약재가 없어 추가 획득은 없습니다)`;
      }
    }

    setActiveTravelEncounter({
      ...selectedEnc,
      text: selectedEnc.text + braveTextExtra,
      cardValue: cardVal === 1 ? 'Ace' : cardVal === 11 ? 'Jack' : cardVal === 12 ? 'Queen' : cardVal === 13 ? 'King' : cardVal,
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      region: destRegion,
      locName: nextLocName
    });

    // Effective paths for chase calculation:
    // If fleeSafety was pending, force speed 1
    const effectivePaths = fleeSafetyPending ? 1 : pathsTravelled;
    if (fleeSafetyPending) setFleeSafetyPending(false);

    updateState(s => {
      const isExperimentalBalloonFlight = destRegion === 'Soar' && s.wagonExpansions?.experimentalContraption && s.bio.travelStyle !== '가볍고 신속하게' && !s.companions?.some(comp => ['butterfly', 'honeybee', 'wasp'].includes(comp.name));
      const daysToAdd = isExperimentalBalloonFlight ? 3 : 1;
      const nextDays = s.calendarDays + daysToAdd;      // Chase mechanic: Behemoth travels 3 paths per move.
      // headStart changes by (effectivePaths - 3)
      let nextPursued = s.pursuedByBehemoth;
      let caughtAlert = '';
      if (nextPursued) {
        const newHeadStart = nextPursued.headStart + (effectivePaths - 3);
        if (newHeadStart <= 0) {
          // Caught! Check for escape tools
          const hasCrossbow = hasTool(s, 'crossbow') || hasTool(s, '석궁');
          const hasBolts = s.bag.some(i => i.name.includes('볼트') || i.id === 'tool_bolts');
          const hasCranky = hasTool(s, 'cranky') || hasTool(s, '기계 장치') || hasTool(s, '기구');
          if (hasCrossbow && hasBolts) {
            caughtAlert = '🏹 거수에게 따라잡혔지만 석궁으로 탈출! 볼트 1개 소비. 선행 거리 2 재설정.';
            nextPursued = { headStart: 2 };
          } else if (hasCranky) {
            caughtAlert = '⚙️ 거수에게 따라잡혔지만 기계 장치로 탈출! 장치 소비. 선행 거리 2 재설정.';
            nextPursued = { headStart: 2 };
          } else {
            caughtAlert = '💀 거수에게 완전히 따라잡혔습니다! 탈출 도구가 없어 여정이 비극으로 끝납니다.';
            nextPursued = null;
          }
        } else if (destType === 'City') {
          // Reaching a city clears the chase
          nextPursued = null;
          caughtAlert = '🏙️ 도시에 도달! 거수가 추격을 포기했습니다.';
        } else {
          nextPursued = { headStart: newHeadStart };
        }
      }

      const nextCumulative = (s.cumulativeDays || 0) + daysToAdd;
      const nextVisited = Array.from(new Set([...(s.visitedLocations || []), nextLocName]));

      let nextGoalCounter = s.journeyGoalCounter || 0;
      if (s.journeyActive && s.journeyGoalTitle === '자아 성찰') {
        const textLower = (selectedEnc.title + " " + selectedEnc.text).toLowerCase();
        if (textLower.includes("behemoth") || textLower.includes("야수") || textLower.includes("동물") || textLower.includes("생물") || textLower.includes("새") || textLower.includes("거수") || textLower.includes("heron") || textLower.includes("kingfisher") || textLower.includes("lizard") || textLower.includes("caterpillar") || textLower.includes("wasp") || textLower.includes("spider")) {
          nextGoalCounter += 1;
        }
      }

      // Compute next bag after potential waterway loss
      let finalBag = s.bag;
      if (lostReagentItem) {
        let found = false;
        finalBag = s.bag.map(item => {
          if (!found && item.id === lostReagentItem!.id) {
            found = true;
            return { ...item, qty: item.qty - 1 };
          }
          return item;
        }).filter(item => item.qty > 0);
      }

      if (braveReagentToAdd) {
        finalBag = [...finalBag, braveReagentToAdd];
      }

      // Handle escape tool consumption
      if (caughtAlert.includes('🏹')) {
        let r = false;
        finalBag = finalBag.filter(i => { if (!r && (i.id === 'tool_bolts' || i.name.includes('볼트'))) { r = true; return false; } return true; });
      } else if (caughtAlert.includes('⚙️')) {
        finalBag = finalBag.filter(i => !i.name.toLowerCase().includes('cranky') && !i.name.includes('기계 장치'));
      }

      const newState: GameState = {
        ...s,
        currentLocationName: nextLocName,
        currentRegion: destRegion,
        currentLocationType: destType,
        pursuedByBehemoth: nextPursued,
        calendarDays: nextDays,
        cumulativeDays: nextCumulative,
        visitedLocations: nextVisited,
        curedAilmentInThisWilds: false,
        legacyRestUsedThisLocation: false,
        journeyGoalCounter: nextGoalCounter,
        bag: finalBag,
        calendarHistory: [
          ...s.calendarHistory,
          `Day ${nextDays}: ${nextLocName} (${destRegion} / ${destType})로 이동. ${effectivePaths}경로.` +
            (s.pursuedByBehemoth ? ` 추격 선행: ${s.pursuedByBehemoth.headStart} → ${nextPursued?.headStart ?? '종료'}` : '')
        ]
      };

      if (braveReagentToAdd) {
        newState.journals = [
          {
            id: 'brave_enc_' + Date.now(),
            title: `🐾 Brave 거수 조우 해결`,
            text: `${nextLocName}으로 이동 중 거수 조우에서 사역마의 용기로 위기를 극복하고 약재를 획득했습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ];
      } else {
        newState.journals = [...s.journals];
      }

      // Handle caught-by-behemoth outcomes
      if (caughtAlert.includes('💀')) {
        // Game over
        newState.journeyActive = false;
        newState.journals = [
          { id: 'death_travel_' + Date.now(), title: '💀 게임 오버 — 거수에게 잡힘', text: `${nextLocName}으로 이동하던 중 거대 야수에게 따라잡혀 쓰러졌습니다.`, timestamp: Date.now() },
          ...newState.journals
        ];
      }

      return newState;
    });

    // Show caught alert after state update
    setTimeout(() => {
      if (state.pursuedByBehemoth) {
        const newHS = state.pursuedByBehemoth.headStart + (effectivePaths - 3);
        if (newHS <= 0) {
          const hasCrossbow = hasTool(state, 'crossbow') || hasTool(state, '석궁');
          const hasBolts = state.bag.some(i => i.name.includes('볼트') || i.id === 'tool_bolts');
          const hasCranky = hasTool(state, 'cranky') || hasTool(state, '기계 장치') || hasTool(state, '기구');
          if (hasCrossbow && hasBolts) alert('🏹 석궁으로 탈출! 볼트 소비, 선행 거리 2 재설정.');
          else if (hasCranky) alert('⚙️ 기계 장치로 탈출! 장치 소비.');
          else alert('💀 게임 오버! 탈출 도구 없이 거수에게 잡혔습니다.');
        } else if (destType === 'City') {
          alert('🏙️ 도시 도달! 거수의 추격이 끝났습니다.');
        }
      }
    }, 100);

    setNextLocName("");
  };

  const handleTravelMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.journeyActive) return;

    if (!nextLocName) {
      alert("이동할 새 위치의 이름을 적어주세요!");
      return;
    }

    // Flight capability validation
    if (destRegion === 'Soar') {
      const hasFlightCapability =
        state.bio.travelStyle === '가볍고 신속하게' ||
        !!state.wagonExpansions?.experimentalContraption ||
        (state.companions || []).some(comp => ['butterfly', 'honeybee', 'wasp'].includes(comp.name));

      if (!hasFlightCapability) {
        alert("🦅 비행(Soar) 이동을 하려면 비행 능력(이동 스타일 '가볍고 신속하게', 비행 동반자[나비, 꿀벌, 말벌], 또는 마차의 비행 기구 개조)이 필요합니다!");
        return;
      }
    }

    const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit)?.mechanic || '';
    const suits = ['♥', '♦', '♣', '♠'];

    if (familiarMechanic === 'seasoned' && travelCardMode === 'random') {
      // Draw 2 cards and trigger selection modal
      const draw1 = { suit: suits[Math.floor(Math.random() * suits.length)], val: Math.floor(Math.random() * 13) + 1 };
      const draw2 = { suit: suits[Math.floor(Math.random() * suits.length)], val: Math.floor(Math.random() * 13) + 1 };
      setSeasonedDraws([draw1, draw2]);
      setShowSeasonedModal(true);
      return;
    }

    const drawnSuit = travelCardMode === 'random'
      ? suits[Math.floor(Math.random() * suits.length)]
      : selectedTravelSuit;
    const cardVal = travelCardMode === 'random'
      ? Math.floor(Math.random() * 13) + 1
      : selectedTravelValue;

    executeTravelMove(drawnSuit, cardVal, isWaterway);
  };

  // Resolve Ailment Diagnoses
  const handleDiagnoseAilment = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.activeAilment) {
      alert("이미 치료 중인 질병 환자가 있습니다. 먼저 치료제를 Concoct하거나 환자가 악화되길 기다려야 합니다.");
      return;
    }

    const chosenName = newAilmentName.trim();
    if (!chosenName) {
      alert("질병명을 골라주세요!");
      return;
    }

    // Seek in database
    const dbAil = GAME_DATA.ailments.find(a => a.name.toLowerCase().includes(chosenName.toLowerCase()) || a.rawName.toLowerCase().includes(chosenName.toLowerCase()));

    if (!dbAil) {
      alert("해당 질병을 도감에서 찾을 수 없습니다. 도감 탭에서 이름을 참고해 주세요.");
      return;
    }

    const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit)?.mechanic || '';
    const startTimer = dbAil.timer + ((familiarMechanic === 'helpful' || state.bio.familiarBenefit.includes("따뜻한 약제사")) ? 2 : 0);

    updateState(s => ({
      ...s,
      barterCountThisAilment: 0, // Reset barter count for new ailment
      independentUsedThisAilment: false,
      activeAilment: {
        id: 'ail_' + Date.now(),
        name: dbAil.name,
        severity: dbAil.severity,
        timer: startTimer,
        maxTimer: startTimer,
        tags: dbAil.tags,
        description: dbAil.description,
        outcome: dbAil.outcome,
        consequence: dbAil.consequence,
        foragingPoints: ((familiarMechanic === 'perceptive' || state.bio.familiarBenefit.includes("예리한 관찰자")) ? 2 : 0),
        reagentsGathered: [],
        patientName: patientNameDraft.trim(),
        species: patientSpeciesDraft.trim(),
        initialRememberedNote: patientInitialNoteDraft.trim(),
        startedAtDay: s.cumulativeDays || s.calendarDays || 0,
        journeyTitle: s.journeyGoalTitle || s.journeyDestination || ''
      },
      journals: [
        {
          id: 'diag_' + Date.now(),
          title: `🤒 새로운 환자 진단: ${dbAil.name}`,
          text: `환자를 진단했습니다: ${dbAil.name} (${dbAil.severity} 난이도)\n- 필요 약효 태그: ${dbAil.tags}\n- 치료 기한 타이머: ${startTimer}시간\n\n[질병 증상 설명]\n${dbAil.description}`,
          timestamp: Date.now()
        },
        ...s.journals
      ]
    }));

    setNewAilmentName("");
    setPatientNameDraft("");
    setPatientSpeciesDraft("");
    setPatientInitialNoteDraft("");
  };

  const executeForageDraw = (drawnSuit: string, cardVal: number) => {
    // Resolve Foraging Event
    const regionForage = GAME_DATA.foragingEncounters[state.currentRegion as any] || [];

    let cardKey = String(cardVal);
    if (cardVal === 1) cardKey = "ace & 2";
    else if (cardVal === 2) cardKey = "ace & 2";
    else if (cardVal === 3 || cardVal === 4) cardKey = "3 & 4";
    else if (cardVal === 5 || cardVal === 6) cardKey = "5 & 6";
    else if (cardVal === 7 || cardVal === 8) cardKey = "7 & 8";
    else if (cardVal === 9 || cardVal === 10) cardKey = "9 & 10";
    else if (cardVal === 11) cardKey = "J";
    else cardKey = "M";

    const matchingFEnc = regionForage.filter((fe: any) => fe.card === cardKey);
    let selectedFEnc = matchingFEnc[0] || { title: "조용히 풀을 뜯다", text: "위험을 만나지 않고 무사히 채집을 진행합니다.", page: 153 };

    if (matchingFEnc.length > 1) {
      const seasonIdx = state.currentSeason === 'Spring' ? 0 : state.currentSeason === 'Summer' ? 1 : state.currentSeason === 'Autumn' ? 2 : 3;
      selectedFEnc = matchingFEnc[seasonIdx % matchingFEnc.length];
    }

    // Search reagents native to the current region (or the resourceful reagent specified by the player)
    const localReagents = GAME_DATA.reagents.filter(r => {
      const isLocal = r.regions.includes(state.currentRegion);
      const isResourceful = state.resourcefulReagent && r.name === state.resourcefulReagent;
      return isLocal || isResourceful;
    });

    // Pick a list of reagents found
    const foundReagents: ForageFind[] = [];
    const currentFP = state.activeAilment?.foragingPoints || 0;
    localReagents.forEach(r => {
      const finalRarity = calculateForageRarity(state, r);
      if (cardVal >= finalRarity) {
        foundReagents.push({ name: r.name, rarity: finalRarity });
      } else if (currentFP >= finalRarity) {
        foundReagents.push({ name: r.name, rarity: finalRarity, fpAvailable: true });
      }
    });

    const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };

    setActiveForageEncounter({
      title: selectedFEnc.title,
      text: selectedFEnc.text,
      page: selectedFEnc.page,
      cardValue: cardVal === 1 ? 'Ace' : cardVal === 11 ? 'Jack' : cardVal === 12 ? 'Queen' : cardVal === 13 ? 'King' : cardVal,
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      foundReagents: foundReagents,
      region: state.currentRegion,
      season: state.currentSeason
    });

    // Update state: Add FP if no reagents found; or auto-spend FP if card was too low
    updateState((s: GameState) => {
      if (!s.activeAilment) return s;
      const currentFP = s.activeAilment.foragingPoints;
      let nextPoints = currentFP;

      if (foundReagents.length === 0) {
        nextPoints = currentFP + 1;
      }

      return {
        ...s,
        lastForageCardValue: cardVal,
        activeAilment: {
          ...s.activeAilment,
          foragingPoints: nextPoints
        }
      };
    });

    handlePassHour(1); // 1 hour for current location foraging
  };

  const handleForageDraw = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!state.activeAilment) return;

    const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit)?.mechanic || '';
    const suits = ['♥', '♦', '♣', '♠'];

    const isTitanOrBarrow = state.currentRegion === 'Titan' ||
                            state.currentLocationType === 'Barrow' ||
                            state.currentLocationType === 'Ruin';

    if (familiarMechanic === 'titanwise' && isTitanOrBarrow && forageCardMode === 'random') {
      // Draw 2 cards and trigger selection modal
      const draw1 = { suit: suits[Math.floor(Math.random() * suits.length)], val: Math.floor(Math.random() * 13) + 1 };
      const draw2 = { suit: suits[Math.floor(Math.random() * suits.length)], val: Math.floor(Math.random() * 13) + 1 };
      setTitanwiseDraws([draw1, draw2]);
      setShowTitanwiseModal(true);
      return;
    }

    const drawnSuit = forageCardMode === 'random'
      ? suits[Math.floor(Math.random() * suits.length)]
      : selectedForageSuit;
    const cardVal = forageCardMode === 'random'
      ? Math.floor(Math.random() * 13) + 1
      : selectedForageValue;

    executeForageDraw(drawnSuit, cardVal);
  };

  // Familiar: Independent benefit — forage in adjacent region once per ailment (no hour cost, no hazard event, card value fixed at 8)
  const handleIndependentForage = (adjRegion: string) => {
    if (!state.activeAilment) return;
    if (state.independentUsedThisAilment) {
      alert("이미 이번 질병 치료 중에 자유로운 영혼 채집 기회를 사용했습니다.");
      return;
    }

    const suits = ['♥', '♦', '♣', '♠'];
    const drawnSuit = suits[Math.floor(Math.random() * suits.length)];
    const cardVal = 8; // fixed value of 8

    // Search reagents native to selected adjacent region
    const localReagents = GAME_DATA.reagents.filter(r => r.regions.includes(adjRegion));
    const foundReagents: ForageFind[] = [];
    const currentFP = state.activeAilment?.foragingPoints || 0;
    localReagents.forEach(r => {
      const finalRarity = calculateForageRarity(state, r, adjRegion);
      if (cardVal >= finalRarity) {
        foundReagents.push({ name: r.name, rarity: finalRarity });
      } else if (currentFP >= finalRarity) {
        foundReagents.push({ name: r.name, rarity: finalRarity, fpAvailable: true });
      }
    });

    const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };

    setActiveForageEncounter({
      title: `🦉 자유로운 영혼의 외출 (Independent Foraging)`,
      text: `사역마가 혼자 인접 지역인 [${adjRegion}]로 날아가 안전하게 약초를 수집해 왔습니다. 어떠한 위험도 조우하지 않았습니다.`,
      page: 153,
      cardValue: '8',
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      foundReagents: foundReagents,
      region: adjRegion,
      season: state.currentSeason
    });

    updateState((s: GameState) => {
      if (!s.activeAilment) return s;
      const currentFP = s.activeAilment.foragingPoints;
      let nextPoints = currentFP;
      if (foundReagents.length === 0) {
        nextPoints = currentFP + 1;
      }
      return {
        ...s,
        independentUsedThisAilment: true,
        lastForageCardValue: cardVal,
        activeAilment: {
          ...s.activeAilment,
          foragingPoints: nextPoints
        }
      };
    });

    alert(`🦉 인접 지역 [${adjRegion}]에서 안전 채집 완료! (시간 소모 없음)`);
  };

  // Foraging Point (FP) spend to acquire reagent (rulebook p.32)
  const handleAcquireReagentWithFP = (reagentName: string) => {
    if (!state.activeAilment) return;
    const r = GAME_DATA.reagents.find(item => item.name === reagentName);
    if (!r) return;

    const finalRarity = calculateForageRarity(state, r);
    const currentFP = state.activeAilment.foragingPoints;
    const lastDraw = state.lastForageCardValue || 0;
    const autoByStoredFP = currentFP >= finalRarity;
    const gapCost = Math.max(0, finalRarity - lastDraw);
    const cost = autoByStoredFP ? 0 : gapCost;

    if (!autoByStoredFP && lastDraw <= 0) {
      alert("먼저 채집 카드를 뽑아주세요. FP는 마지막 채집 카드가 희귀도에 부족한 차이를 메우는 데 사용합니다.");
      return;
    }

    if (currentFP < cost) {
      alert(`FP가 부족합니다. (필요 FP: ${cost}, 현재 FP: ${currentFP})`);
      return;
    }
    const parts = splitReagentPreparations(r.preps);
    const chosenPart = prompt(`FP로 획득할 ${r.name} 부위를 선택하세요:\n${parts.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}`);
    if (!chosenPart) return;
    const partText = parts[Math.max(0, (parseInt(chosenPart) || 1) - 1)] || parts[0];

    updateState((s: GameState) => {
      if (!s.activeAilment) return s;
      const nextPoints = s.activeAilment.foragingPoints - cost;
      const newItem = createPreparedReagentItem(r, partText, 'foraged_fp');
      return {
        ...s,
        bag: [...s.bag, newItem],
        activeAilment: {
          ...s.activeAilment,
          foragingPoints: nextPoints
        },
        journals: [
          {
            id: 'fp_acquire_' + Date.now(),
            title: `🌿 FP 자동 획득: ${r.name}`,
            text: autoByStoredFP
              ? `누적 채집 포인트(FP)가 희귀도 ${finalRarity} 이상이므로 FP를 소모하지 않고 ${r.name} (${partText.trim()})을(를) 획득했습니다.`
              : `마지막 채집 카드 ${lastDraw}와 희귀도 ${finalRarity}의 차이인 FP ${cost}점을 소비하여 ${r.name} (${partText.trim()})을(를) 획득했습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(autoByStoredFP ? `🌿 누적 FP 기준으로 ${r.name}을(를) FP 소모 없이 획득했습니다.` : `🌿 FP ${cost}점을 소비하여 ${r.name}을(를) 가방에 획득했습니다.`);
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
    const regionForage = GAME_DATA.foragingEncounters[regionName as any] || [];
    let cardKey = String(cardVal);
    if (cardVal === 1) cardKey = "ace & 2";
    else if (cardVal === 2) cardKey = "ace & 2";
    else if (cardVal === 3 || cardVal === 4) cardKey = "3 & 4";
    else if (cardVal === 5 || cardVal === 6) cardKey = "5 & 6";
    else if (cardVal === 7 || cardVal === 8) cardKey = "7 & 8";
    else if (cardVal === 9 || cardVal === 10) cardKey = "9 & 10";
    else if (cardVal === 11) cardKey = "J";
    else cardKey = "M";

    const matchingFEnc = regionForage.filter((fe: any) => fe.card === cardKey);
    let selectedFEnc = matchingFEnc[0] || { title: "조용히 풀을 뜯다", text: "위험을 만나지 않고 무사히 채집을 진행합니다.", page: 153 };
    if (matchingFEnc.length > 1) {
      const seasonIdx = state.currentSeason === 'Spring' ? 0 : state.currentSeason === 'Summer' ? 1 : state.currentSeason === 'Autumn' ? 2 : 3;
      selectedFEnc = matchingFEnc[seasonIdx % matchingFEnc.length];
    }

    const localReagents = GAME_DATA.reagents.filter(r => r.regions.includes(regionName));
    const foundReagents: ForageFind[] = [];

    localReagents.forEach(r => {
      const finalRarity = calculateForageRarity(state, r, regionName);
      if (cardVal >= finalRarity) {
        foundReagents.push({ name: r.name, rarity: finalRarity });
      }
    });

    const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };

    setActiveForageEncounter({
      title: selectedFEnc.title,
      text: selectedFEnc.text,
      page: selectedFEnc.page,
      cardValue: cardVal === 1 ? 'Ace' : cardVal === 11 ? 'Jack' : cardVal === 12 ? 'Queen' : cardVal === 13 ? 'King' : cardVal,
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      foundReagents: foundReagents,
      region: regionName,
      season: state.currentSeason
    });

    updateState((s: GameState) => {
      const newTimer = Math.max(0, (s.scroungingTimer || 0) - cost);
      const isFinished = newTimer <= 0;
      return {
        ...s,
        scroungingTimer: newTimer,
        scroungingMode: !isFinished,
        activeAilment: isFinished ? null : s.activeAilment,
        journals: [
          {
            id: 'scrounge_forage_' + Date.now(),
            title: `🔍 여분 채집: ${selectedFEnc.title}`,
            text: `치료 후 남은 타이머 시간 동안 채집 진행.\n지역: ${regionName} (드로우: ${cardVal} ${suitLabels[drawnSuit]})\n소모 시간: ${cost}시간 (남은 시간: ${newTimer}시간)\n발견 약재: ${foundReagents.map(f => f.name).join(', ') || '없음'}`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    const nextTimeLeft = (state.scroungingTimer || 0) - cost;
    if (nextTimeLeft <= 0) {
      alert("⏱️ 여분 채집 타이머가 모두 소모되어 채집이 자동 종료되었습니다.");
    }
  };

  const handleScroungeForage = (regionName: string, cost: number) => {
    if ((state.scroungingTimer || 0) < cost) {
      alert(`시간이 부족합니다. (필요: ${cost}시간, 남은 시간: ${state.scroungingTimer}시간)`);
      return;
    }
    const suits = ['♥', '♦', '♣', '♠'];
    const drawnSuit = suits[Math.floor(Math.random() * suits.length)];
    const cardVal = Math.floor(Math.random() * 13) + 1;
    executeScroungeForageDraw(regionName, drawnSuit, cardVal, cost);
  };

  const handleScroungeGainReagent = (reagentName: string, cost: number) => {
    if ((state.scroungingTimer || 0) < cost) {
      alert(`시간이 부족합니다. (필요: ${cost}시간, 남은 시간: ${state.scroungingTimer}시간)`);
      return;
    }
    const r = GAME_DATA.reagents.find(item => item.name === reagentName);
    if (!r) return;

    const parts = splitReagentPreparations(r.preps);
    const chosenPart = prompt(`원하는 영약재 부위를 번호로 선택하세요:\n${parts.map((p, i) => `${i+1}. ${p.trim()}`).join('\n')}`);
    if (!chosenPart) return;
    const partIdx = parseInt(chosenPart) - 1;
    const partText = parts[partIdx] || parts[0];

    updateState((s: GameState) => {
      const newTimer = Math.max(0, (s.scroungingTimer || 0) - cost);
      const isFinished = newTimer <= 0;
      const newItem = createPreparedReagentItem(r, partText, 'scrounge_reag');
      return {
        ...s,
        bag: [...s.bag, newItem],
        scroungingTimer: newTimer,
        scroungingMode: !isFinished,
        activeAilment: isFinished ? null : s.activeAilment,
        journals: [
          {
            id: 'scrounge_gain_' + Date.now(),
            title: `🔍 여분 채집 (약재 획득): ${r.name}`,
            text: `치료 후 남은 시간으로 ${r.name} (${partText.trim()}) 확정 획득.\n소모 시간: ${cost}시간 (남은 시간: ${newTimer}시간)`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`🔍 ${r.name} (${partText.trim()})을(를) 획득했습니다! (소모 시간: ${cost}시간)`);
    const nextTimeLeft = (state.scroungingTimer || 0) - cost;
    if (nextTimeLeft <= 0) {
      alert("⏱️ 여분 채집 타이머가 모두 소모되어 채집이 자동 종료되었습니다.");
    }
  };

  const handleFinishScrounging = () => {
    updateState((s: GameState) => ({
      ...s,
      scroungingMode: false,
      scroungingTimer: 0,
      activeAilment: null
    }));
    alert("🚪 여분 채집이 마감되었습니다. 여정을 재개합니다.");
  };

  const handleBuildClinic = (agendaService: string) => {
    if (state.currentLocationType !== 'Wilds') {
      alert("약제소는 야생(Wilds) 지역에서만 지을 수 있습니다.");
      return;
    }
    if (state.trinkets.length < 15) {
      alert(`장신구가 부족합니다. (건설 비용: 15개, 현재 보유: ${state.trinkets.length}개)`);
      return;
    }

    updateState((s: GameState) => {
      const nextTrinkets = [...s.trinkets];
      nextTrinkets.splice(0, 15); // deduct 15 trinkets
      const newClinic = {
        locationName: s.currentLocationName,
        region: s.currentRegion,
        agendaService
      };
      return {
        ...s,
        trinkets: nextTrinkets,
        clinics: [...(s.clinics || []), newClinic],
        curedAilmentInThisWilds: false,
        journals: [
          {
            id: 'clinic_build_' + Date.now(),
            title: `🏡 약제소 건설: ${s.currentLocationName} 지부`,
            text: `장신구 15개를 투자하여 ${s.currentLocationName}에 새로운 약제소를 지었습니다!\n길드 아젠다 서비스로 [${agendaService.toUpperCase()}]를 추가했습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`🏡 ${state.currentLocationName}에 약제소를 성공적으로 지었습니다!\n아젠다 서비스: ${agendaService}가 추가되었습니다.`);
  };

  const handlePantryHibernate = () => {
    const activeServices = Array.from(new Set((state.clinics || []).map(c => c.agendaService)));
    if (!activeServices.includes('pantry')) {
      alert("식료품 저장고(Pantry) 아젠다 서비스가 활성화되어 있지 않습니다.");
      return;
    }

    const needsPay = state.reputation < 15;
    if (needsPay && state.trinkets.length < 15) {
      alert(`동면 비용이 부족합니다. 평판이 15점 미만이므로 15 장신구가 필요합니다. (보유: ${state.trinkets.length}개)`);
      return;
    }

    updateState((s: GameState) => {
      let nextTrinkets = [...s.trinkets];
      if (needsPay) {
        nextTrinkets.splice(0, 15);
      }
      return {
        ...s,
        currentSeason: 'Spring',
        calendarDays: 0,
        trinkets: nextTrinkets,
        journals: [
          {
            id: 'hibernate_' + Date.now(),
            title: `❄️ 약제소 동면 (Winter Hibernation)`,
            text: `약제소 식료품 저장고의 보존 식품 덕분에 겨울 시즌을 무사히 동면하여 보냈습니다.\n- 지불 비용: ${needsPay ? '장신구 15개' : '무료 (평판 15점 이상)'}\n- 이제 새로운 봄(Spring) 시즌이 시작됩니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert("❄️ 동면 완료! 겨울을 건너뛰고 새로운 봄(Spring)이 되었습니다. 달력 일수가 초기화됩니다.");
  };

  const handleGardenPlant = (reagentName: string) => {
    const isReagent = state.bag.some(i => i.name === reagentName || i.name.startsWith(reagentName));
    if (!isReagent) {
      alert("가방에 해당 약재가 없습니다.");
      return;
    }

    updateState((s: GameState) => {
      let removed = false;
      const nextBag = s.bag.filter(i => {
        if (!removed && (i.name === reagentName || i.name.startsWith(reagentName))) {
          removed = true;
          return false;
        }
        return true;
      });
      return {
        ...s,
        bag: nextBag,
        gardenPlant: reagentName,
        gardenHarvestedThisAilment: false
      };
    });

    alert(`🌱 ${reagentName}을(를) 약제소 정원에 심었습니다. 봄, 여름, 가을에 수확할 수 있습니다.`);
  };

  const handleGardenHarvest = () => {
    if (!state.gardenPlant) {
      alert("정원에 심어진 식물이 없습니다.");
      return;
    }
    const activeServices = Array.from(new Set((state.clinics || []).map(c => c.agendaService)));
    const isWinter = state.currentSeason === 'Winter';
    const hasGreenhouse = activeServices.includes('greenhouses');

    if (isWinter && !hasGreenhouse) {
      alert("겨울에는 정원 수확이 불가능합니다. 온실(Greenhouse) 서비스가 필요합니다.");
      return;
    }
    if (state.gardenHarvestedThisAilment) {
      alert("이번 질병 치료 중에 이미 정원 수확을 1회 진행했습니다.");
      return;
    }

    const r = GAME_DATA.reagents.find(item => item.name === state.gardenPlant);
    if (!r) return;

    const parts = splitReagentPreparations(r.preps);
    const chosenPart = prompt(`정원에서 수확할 영약재 부위를 번호로 선택하세요:\n${parts.map((p, i) => `${i+1}. ${p.trim()}`).join('\n')}`);
    if (!chosenPart) return;
    const partIdx = parseInt(chosenPart) - 1;
    const partText = parts[partIdx] || parts[0];

    updateState((s: GameState) => {
      const newItem = createPreparedReagentItem(r, partText, 'garden_harvest');
      return {
        ...s,
        bag: [...s.bag, newItem],
        gardenHarvestedThisAilment: true,
        journals: [
          {
            id: 'garden_gather_' + Date.now(),
            title: `🧺 정원 약초 수확: ${r.name}`,
            text: `약제소 정원에서 재배 중인 ${r.name} (${partText.trim()})을(를) 1개 수확했습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`🧺 정원에서 ${r.name}을(를) 수확했습니다!`);
  };

  const handleSoddenLogInsect = (reagentName: string) => {
    updateState((s: GameState) => ({
      ...s,
      soddenLogInsect: reagentName,
      soddenLogHarvestedThisAilment: false
    }));
    alert(`🐛 물에 젖은 통나무에 ${reagentName} 서식지를 지정했습니다.`);
  };

  const handleSoddenLogHarvest = () => {
    if (!state.soddenLogInsect) {
      alert("통나무에 서식하는 곤충이 지정되지 않았습니다.");
      return;
    }
    if (state.currentSeason === 'Winter') {
      alert("겨울에는 통나무 곤충 수확이 불가능합니다.");
      return;
    }
    if (state.soddenLogHarvestedThisAilment) {
      alert("이번 질병 치료 중에 이미 통나무 수확을 진행했습니다.");
      return;
    }

    const r = GAME_DATA.reagents.find(item => item.name === state.soddenLogInsect);
    if (!r) return;

    const parts = splitReagentPreparations(r.preps);
    const chosenPart = prompt(`통나무에서 채취할 곤충 부위를 번호로 선택하세요:\n${parts.map((p, i) => `${i+1}. ${p.trim()}`).join('\n')}`);
    if (!chosenPart) return;
    const partIdx = parseInt(chosenPart) - 1;
    const partText = parts[partIdx] || parts[0];

    updateState((s: GameState) => {
      const newItem = createPreparedReagentItem(r, partText, 'sodden_harvest');

      // Also reduces current ailment timer by 1
      let nextAilment = s.activeAilment;
      if (nextAilment) {
        nextAilment = {
          ...nextAilment,
          timer: Math.max(0, nextAilment.timer - 1)
        };
      }

      return {
        ...s,
        bag: [...s.bag, newItem],
        soddenLogHarvestedThisAilment: true,
        activeAilment: nextAilment,
        journals: [
          {
            id: 'sodden_gather_' + Date.now(),
            title: `🐛 통나무 곤충 수확: ${r.name}`,
            text: `물에 젖은 통나무에서 ${r.name} (${partText.trim()})을(를) 수확했습니다. (작업 시간 1시간 소모되어 질병 치료 타이머 -1)`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`🐛 통나무에서 ${r.name}을(를) 수확했습니다! (치료 타이머가 1시간 감소합니다)`);
  };

  const handleGoodwillDonate = (itemId: string) => {
    const item = state.bag.find(i => i.id === itemId);
    if (!item) return;

    if (!confirm(`🎁 이 아이템 (${item.name}, 무게: ${formatWeight(item.weight)})을 약제소 친선 매대에 기부하시겠습니까?\n시즌 종료 시 기부한 무게만큼 명성을 획득합니다.`)) {
      return;
    }

    updateState((s: GameState) => {
      const nextBag = s.bag.filter(i => i.id !== itemId);
      const donatedVal = s.goodwillDonationsVal || 0;
      return {
        ...s,
        bag: nextBag,
        goodwillDonationsVal: donatedVal + item.weight,
        journals: [
          {
            id: 'goodwill_donate_' + Date.now(),
            title: `🎁 친선 매대 기부: ${item.name}`,
            text: `약제소 친선 매대에 ${item.name} (무게: ${formatWeight(item.weight)})을 기부했습니다.`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`🎁 기부 완료! 현재 계절 누적 기부 무게: ${formatWeight((state.goodwillDonationsVal || 0) + item.weight)}`);
  };

  const handleSettleSeasonTipsAndDonations = (nextSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter') => {
    const activeServices = Array.from(new Set((state.clinics || []).map(c => c.agendaService)));
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
            title: `🍂 계절 정산 결과 (${s.currentSeason} → ${nextSeason})`,
            text: `계절이 바뀌어 길드 약제소들의 정산을 마쳤습니다.\n- 운영 중인 약제소 수: ${clinicsCount}개\n- 선술집(Taproom/Hostel) 팁 수입: 장신구 ${totalTips}개 획득\n- 친선 매대 기부 무게: ${formatWeight(s.goodwillDonationsVal || 0)} → 길드 평판 +${goodwillRep} 획득`,
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    alert(`🍂 계절 정산 완료!\n\n🪙 선술집 팁 수입: 장신구 +${totalTips}개\n🎁 기부금 명성 전환: 평판 +${goodwillRep}\n\n계절이 [${nextSeason}]으로 변경되었습니다.`);
  };

  // Bartering Resolution
  const handleBarterAttempt = (reagentName: string) => {
    if (!state.activeAilment) return;
    const r = GAME_DATA.reagents.find(item => item.name.toLowerCase().includes(reagentName.toLowerCase()) || item.rawName.toLowerCase().includes(reagentName.toLowerCase()));

    if (!r) {
      alert("해당 이름의 영약재를 찾을 수 없습니다.");
      return;
    }
    if (r.type === 'TITAN') {
      alert("룰북 p.34 기준으로 물꼬 거래 대상은 비-티탄(non-Titan) 영약재입니다. 티탄 영약재는 채집/유적/특수 서비스로 획득해야 합니다.");
      return;
    }

    // Rarity calculation
    const isCity = state.currentLocationType === 'City';
    const isSettlement = state.currentLocationType === 'Settlement';
    if (!isCity && !isSettlement) {
      alert("물꼬 거래는 정착지(Settlement)나 도시(City)에서만 가능합니다.");
      return;
    }

    // Rulebook p.34: Settlement 1x, City 3x per ailment
    const maxBarters = isCity ? 3 : 1;
    if (state.barterCountThisAilment >= maxBarters) {
      alert(`거래 횟수 초과!\n${isCity ? '도시(City): 최대 3회' : '정착지(Settlement): 최대 1회'} 거래 가능합니다.\n이미 ${state.barterCountThisAilment}회 사용했습니다.`);
      return;
    }

    const finalRarity = calculateBarterRarity(state, r, isCity);

    // Step 1: Draw Social Encounter Card
    const suits = ['♥', '♦', '♣', '♠'];
    const socialSuit = suits[Math.floor(Math.random() * suits.length)];
    const socialVal = Math.floor(Math.random() * 13) + 1;
    const socialCard = { suit: socialSuit, val: socialVal };

    // Find in parsed_social
    const regionName = state.currentRegion;
    const regionSocials = (parsedSocial as any)[regionName] || (parsedSocial as any)["Forest"] || [];
    const matchingSocials = regionSocials.filter((s: any) => s.suit === socialSuit);
    const socialEncounter = matchingSocials.length > 0
      ? matchingSocials[Math.floor(Math.random() * matchingSocials.length)]
      : { page: 190, suit: socialSuit, title: "평화로운 만남", text: "정착지 상인과 마주쳐 정답게 담소를 나누며 물꼬 거래 협상을 시작합니다." };

    updateState(s => ({
      ...s,
      activeBarter: {
        reagentName: r.name,
        finalRarity,
        socialCard,
        socialEncounter,
        phase: 'social',
        journalNote: ''
      }
    }));

    handlePassHour(1); // Bartering takes 1 hour
  };

  // Add Foraged item directly (Manual collection)
  const handleCollectReagent = (reagentName: string) => {
    const r = GAME_DATA.reagents.find(item => item.name.toLowerCase().includes(reagentName.toLowerCase()) || item.rawName.toLowerCase().includes(reagentName.toLowerCase()));
    if (!r) {
      alert("영약재 이름을 도감에서 찾을 수 없습니다.");
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

  // Concoction remedy checker
  const handleConcoctRemedy = () => {
    if (!state.activeAilment) return;

    if (selectedBagItems.length === 0) {
      alert("치료제로 조제할 영약재들을 가방에서 선택해주세요!");
      return;
    }

    const selectedReagents = state.bag.filter(item => selectedBagItems.includes(item.id));
    const { isComplete, totalFair, totalFoul, missingRequirements, statusText } = validateConcoction(state.activeAilment, selectedReagents, state.bag, state);

    const timeSpent = selectedBagItems.length;
    const severity = state.activeAilment.severity;
    const sevLevel = severity === 'dire' ? 4 : severity === 'severe' ? 3 : severity === 'intermediate' ? 2 : 1;
    const loss = sevLevel;

    // Confirm time cost
    const confirmTime = confirm(`💊 치료제 조제 검토:\n- 조합 상태: ${statusText} (Fair: ${totalFair}, Foul: ${totalFoul})\n- 필요 조건: ${state.activeAilment.tags}\n- 미충족 요구사항: ${missingRequirements.join(', ') || '없음 (충족됨) ✅'}\n\n⏱️ 조제 시간: 약재 ${timeSpent}개 사용으로 ${timeSpent}시간이 경과합니다. (환자 남은 시간: ${state.activeAilment.timer}시간 → 조제 후: ${state.activeAilment.timer - timeSpent}시간)\n\n계속 진행하시겠습니까?`);
    if (!confirmTime) return;

    const nextTimer = Math.max(0, state.activeAilment.timer - timeSpent);

    // 1. Time out failure
    if (nextTimer <= 0) {
      alert(`💥 조제하는 데 소중한 시간이 흩날려 버렸고, 탕약이 끓어오르기도 전에 그의 호흡이 멈추었습니다:\n${state.activeAilment.consequence}`);

      updateState(s => {
        const nextBag = s.bag.filter(item => !selectedBagItems.includes(item.id));
        const nextRep = Math.max(0, s.reputation - loss);
        const timestamp = Date.now();
        const sourceId = 'cure_fail_' + timestamp;
        const reagentsStr = selectedReagents.map(r => r.name.split(' (')[0]).join(', ');
        const notes = `가방에서 꺼낸 약재 [${reagentsStr}]를 다듬으며 약을 달이려 애썼으나, 불 앞에 꼬박 지새운 ${timeSpent}시간 동안 기약된 치료의 기한이 모두 다 흘러가 버렸습니다. 미처 약이 완성되기도 전에 환자의 호흡이 가늘어졌고, 침상 위 짚더미는 무정한 추위 속에서 차갑게 식어가고 말았습니다. 끝내 환자를 구하지 못했다는 깊은 자책감이 공방의 차가운 정적 속에 어둡게 내리앉았습니다.`;
        return {
          ...s,
          bag: nextBag,
          reputation: nextRep,
          activeAilment: null,
          pendingPatientArchive: createPendingPatientArchive(s, sourceId, 'failure', notes, selectedReagents.map(r => r.name.split(' (')[0]), s.activeAilment!.consequence, timestamp),
          journals: [
            {
              id: sourceId,
              title: `🕯️ 짚침상에 머문 슬픔: ${s.activeAilment!.patientName || '가여운 야수'}를 기억하며`,
              text: notes,
              timestamp
            },
            ...s.journals
          ],
          lostPatientLegacy: {
            name: s.activeAilment!.patientName || 'Anonymous patient',
            species: s.activeAilment!.species || 'Unknown species',
            ailmentName: s.activeAilment!.name,
            day: s.cumulativeDays || s.calendarDays || 0,
            consequence: s.activeAilment!.consequence
          }
        };
      });
      setSelectedBagItems([]);
      return;
    }

    // 2. Incomplete Remedy failure
    if (!isComplete) {
      const proceedIncomplete = confirm(`⚠️ 경고: 가슴 아프게도 요구하는 알맞은 성분을 이 처방전에 모두 채워 넣지 못했습니다.\n이대로 탕약을 달여 올려보내시겠습니까?`);
      if (!proceedIncomplete) return;

      alert(`💥 정성껏 달인 탕약의 효능이 모자라 차도를 보이지 못했습니다:\n${state.activeAilment.consequence}`);
      updateState(s => {
        const nextBag = s.bag.filter(item => !selectedBagItems.includes(item.id));
        const nextRep = Math.max(0, s.reputation - loss);
        const timestamp = Date.now();
        const sourceId = 'cure_fail_incomplete_' + timestamp;
        const reagentsStr = selectedReagents.map(r => r.name.split(' (')[0]).join(', ');
        const notes = `병의 깊이에 맞는 효능을 온전히 이끌어내지 못하고, 불완전하게 조제된 처방약을 올리고 말았습니다. 가방에 든 [${reagentsStr}]를 조제하여 올렸으나 약효가 가닿지 못했습니다. 약을 들이킨 야수는 차도를 보이지 못한 채, 끝내 지친 몸을 이끌고 쓸쓸히 길을 떠났습니다. 약제사로서 알맞은 효능을 찾아내지 못했다는 뼈아픈 자책과 탄식이 후회와 함께 방 안에 머뭅니다.`;
        return {
          ...s,
          bag: nextBag,
          reputation: nextRep,
          activeAilment: null,
          pendingPatientArchive: createPendingPatientArchive(s, sourceId, 'failure', notes, selectedReagents.map(r => r.name.split(' (')[0]), s.activeAilment!.consequence, timestamp),
          journals: [
            {
              id: sourceId,
              title: `🕯️ 끝내 닿지 못한 처방: ${s.activeAilment!.patientName || '이름 모를 이'}의 쓸쓸한 길`,
              text: notes,
              timestamp
            },
            ...s.journals
          ],
          lostPatientLegacy: {
            name: s.activeAilment!.patientName || 'Anonymous patient',
            species: s.activeAilment!.species || 'Unknown species',
            ailmentName: s.activeAilment!.name,
            day: s.cumulativeDays || s.calendarDays || 0,
            consequence: s.activeAilment!.consequence
          }
        };
      });
      setSelectedBagItems([]);
      return;
    }

    // 3. Successful cure (Fair / Foul Remedy)
    // Rulebook p.36: Fair and Foul cancel first, then every 2 net points adjusts trinkets.
    const repGain = sevLevel; // +1 Rep per Severity level

    const fairInput = prompt(`🌟 Fair 점수를 입력하세요 (치료제의 [FAIR] 합계):`, String(totalFair));
    const foulInput = prompt(`💀 Foul 점수를 입력하세요 (치료제의 [FOUL] 합계):`, String(totalFoul));
    const fairPts = Math.max(0, parseInt(fairInput || '0') || 0);
    const foulPts = Math.max(0, parseInt(foulInput || '0') || 0);

    const fairFoulNet = fairPts - foulPts;
    const fairFoulAdjustment = fairFoulNet >= 0
      ? Math.floor(fairFoulNet / 2)
      : -Math.floor(Math.abs(fairFoulNet) / 2);
    const trinketCalc = sevLevel + fairFoulAdjustment;
    const trinketGain = Math.max(0, trinketCalc);

    // Gifting option
    let isGifting = false;
    if (trinketGain > 0) {
      isGifting = confirm(
        `보상: 장신구 ${trinketGain}개\n\n💝 Gifting: 장신구 대신 길드 평판 +2를 선택하시겠습니까?\n(장신구 0개일 때는 Gifting 불가)`
      );
    }

    // Familiar: Shrewd — +1 Trinket when trading remedy for trinkets (not gifting)
    const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit)?.mechanic || '';
    const shrewdBonus = (!isGifting && (familiarMechanic === 'shrewd' || state.bio.familiarBenefit.includes('현명한 장사꾼'))) ? 1 : 0;

    const actualTrinkets = isGifting ? 0 : trinketGain + shrewdBonus;
    const actualRep = repGain + (isGifting ? 2 : 0);

    updateState(s => {
      const nextBag = s.bag.filter(item => !selectedBagItems.includes(item.id));
      const earnedTrinkets = Array(actualTrinkets).fill("치료 보상 장신구 (Trinket)");
      const nextTrinkets = [...s.trinkets, ...earnedTrinkets];
      const nextRep = s.reputation + actualRep;

      const isWilds = s.currentLocationType === 'Wilds';
      const triggerScrounge = nextTimer > 0;

      // Goal 7 (의학 연구 자료) check
      let nextGoalCounter = s.journeyGoalCounter || 0;
      if (s.journeyActive && s.journeyGoalTitle === '의학 연구 자료') {
         const ailmentTags = s.activeAilment?.tags || '';
         if (ailmentTags.toUpperCase().includes('SCALE') || ailmentTags.toUpperCase().includes('FEATHER') || ailmentTags.toUpperCase().includes('FUR') || ailmentTags.includes('비늘') || ailmentTags.includes('깃털') || ailmentTags.includes('털')) {
           nextGoalCounter += 1;
         }
      }

      const updatedAilment = triggerScrounge ? { ...s.activeAilment!, timer: nextTimer } : null;

      const nextDiscoveredRecipes = { ...(s.discoveredRecipes || {}) };
      const ailmentNameKey = s.activeAilment!.name;
      const reagentNames = selectedReagents.map(r => r.name.split(' (')[0]);
      if (!nextDiscoveredRecipes[ailmentNameKey]) {
        nextDiscoveredRecipes[ailmentNameKey] = [];
      }
      const exists = nextDiscoveredRecipes[ailmentNameKey].some(arr =>
        arr.length === reagentNames.length && arr.every((val, idx) => val === reagentNames[idx])
      );
      if (!exists) {
        nextDiscoveredRecipes[ailmentNameKey].push(reagentNames);
      }
      const cureTimestamp = Date.now();
      const cureSourceId = 'cure_' + cureTimestamp;
      const reagentsStr = reagentNames.join(', ');
      const cureNotes = `${s.currentLocationName}의 고요한 방에서 약재를 가려 조제하여 온전한 탕약을 올렸습니다. [${reagentsStr}]을(를) 정성껏 달여 빚은 지 수 시간 만에, 열병으로 괴로워하던 야수의 눈빛에 맑은 총기가 깃들고 편안한 숨이 돌아왔습니다. 앓던 야수는 마침내 온전히 회복하여, 고맙다는 듯이 머리를 조아린 뒤 활기차게 숲으로 돌아갔습니다. 내 가슴속에는 다시금 생명을 도왔다는 따뜻한 온기가 머무릅니다.`;
      const KEEPSAKE_TEMPLATES = [
        { name: '말린 엉겅퀴 씨앗 주머니 (Pouch of Dried Thistle)', story: '치료의 답례로 건네받은 작은 천 주머니. 흔들면 바스락거리는 마른 씨앗 소리가 납니다.' },
        { name: '구멍 뚫린 매끄러운 조약돌 (A Polished Lucky Pebble)', story: '강가에서 행운을 빌며 주웠다며 수줍게 손에 쥐여준 조약돌. 만지면 아주 차갑고 매끄럽습니다.' },
        { name: '바람에 실려온 깃털 다발 (Bundle of Crane Feathers)', story: '빛바랜 무명실로 정성껏 묶어놓은 깃털 뭉치. 만지면 포근한 온기가 느껴집니다.' },
        { name: '조각된 도토리 껍질 피리 (Carved Acorn Whistle)', story: '마른 도토리 모자를 정성껏 깎아 만든 작은 피리. 입술에 대고 불면 맑고 가녀린 솔바람 소리가 납니다.' },
        { name: '압착된 마가목 잎사귀 (Pressed Rowan Leaf)', story: '노트 갈피에 끼워 오랫동안 잘 말려둔 노란색 마가목 잎사귀.' },
        { name: '솔송나무 수지 한 조각 (Hemlock Resin Fragment)', story: '숲의 깊은 향취를 그대로 머금은 채 노랗게 굳은 작은 나무진 덩어리.' },
        { name: '민들레 솜털을 담은 작은 병 (Fluff in a Glass Vial)', story: '마치 시간이 멈춘 듯 바람 한 점 없는 투명한 유리병 속의 하얀 민들레 솜털.' },
        { name: '투박하게 깎은 자작나무 반지 (Birch Wood Ring)', story: '칼끝으로 투박하게 깎았지만, 손가락에 끼우면 자작나무 껍질의 부드러움이 느껴지는 반지.' },
        { name: '마른 라벤더와 가죽 끈 (Lavender Bound with Leather)', story: '말린 라벤더 꽃송이를 거친 가죽끈으로 묶은 것. 서랍 속에 넣어두면 은은한 옛 향기가 흐릅니다.' }
      ];
      const template = KEEPSAKE_TEMPLATES[Math.floor(Math.random() * KEEPSAKE_TEMPLATES.length)];
      const trinketArchive = actualTrinkets > 0
        ? addTrinketMemory(s.trinketArchive || [], {
          sourceId: `${cureSourceId}_trinkets`,
          name: template.name,
          count: actualTrinkets,
          source: `Patient: ${s.activeAilment!.patientName || 'Anonymous'} (${s.activeAilment!.species || 'unknown species'})`,
          story: `${template.story}\n\n— ${s.currentLocationName}에서 ${s.activeAilment!.patientName || '이름 모를 야수'}의 '${s.activeAilment!.name}'를 낫게 돕고 남겨진 조각입니다.`,
          locationName: s.currentLocationName,
          timestamp: cureTimestamp,
          spent: false,
          patientCaseId: memoryKey('case', cureSourceId)
        })
        : (s.trinketArchive || []);

      return {
        ...s,
        bag: nextBag,
        trinkets: nextTrinkets,
        trinketArchive,
        reputation: nextRep,
        activeAilment: updatedAilment,
        discoveredRecipes: nextDiscoveredRecipes,
        scroungingMode: triggerScrounge,
        scroungingTimer: nextTimer,
        curedAilmentInThisWilds: isWilds,
        journeyGoalCounter: nextGoalCounter,
        pendingPatientArchive: createPendingPatientArchive(s, cureSourceId, 'success', cureNotes, reagentNames, '', cureTimestamp),
        journals: [
          {
            id: cureSourceId,
            title: `🌿 짚침상을 털고 일어난 야수: ${s.activeAilment!.patientName || '이름 없는 이'}`,
            text: cureNotes,
            timestamp: cureTimestamp
          },
          ...s.journals
        ]
      };
    });

    setSelectedBagItems([]);
    if (nextTimer > 0) {
      alert(`🎉 완치 성공!\n장신구 +${actualTrinkets}개, 길드 명성 +${actualRep}점 획득!\n\n⏱️ 남은 시간(${nextTimer}시간) 동안 여분 채집(Scrounging)이 가능합니다.`);
    } else {
      alert(`🎉 완치 성공!\n장신구 +${actualTrinkets}개, 길드 명성 +${actualRep}점 획득!`);
    }
  };


  const handleEndJourney = () => {
    if (!state.journeyActive) return;

    if (confirm("여정 목적지에 무사히 도달하여 이 챕터를 마감하시겠습니까?\n달력 일정 내에 도착했는지 확인하고 저널에 마무리 소감을 정리하게 됩니다.")) {
      const isOntime = state.calendarDays <= state.calendarMaxDays;
      const isGoalSatisfied = checkJourneyGoalSatisfaction(state);

      const repChange = isGoalSatisfied ? 5 : -3;
      const ontimeText = isOntime ? '기한 내 성공!' : '지각 도착 (타이머 오버)';
      const goalTextResult = isGoalSatisfied ? '목표 달성 성공! 🎉 (명성 +5)' : '목표 달성 실패 ⚠️ (명성 -3)';

      const seasonText = state.currentSeason === 'Spring' ? '봄' : state.currentSeason === 'Summer' ? '여름' : state.currentSeason === 'Autumn' ? '가을' : '겨울';
      const originName = state.journeyOrigin || state.calendarHistory[0]?.replace(/^여정 시작:\s*/, '').replace(/로 출발.*$/, '') || '출발지 미상';
      const defaultMemoirText = `${seasonText}의 분위기 속에, [${originName}]에서 [${state.journeyDestination}]까지 험난한 Bristley Woods를 횡단했습니다. 총 ${state.calendarDays}일간의 방랑 끝에 목적지에 도달했습니다.\n\n여정 동안 세웠던 목표 [${state.journeyGoalTitle}]은(는) ${isGoalSatisfied ? '안전하게 완수' : '안타깝게 미완수'}로 마무리되었으며, 길드 평판은 ${repChange >= 0 ? '+' : ''}${repChange}점 변동되었습니다.`;

      const playerNotes = prompt(`✍️ 여정을 마치며 남길 연대기(Memoir) 일기를 기록하세요:`, defaultMemoirText);
      const finalMemoir = playerNotes || defaultMemoirText;

      const newChronicle = {
        id: 'chronicle_' + Date.now(),
        title: `📖 ${state.journeyGoalTitle} — ${state.journeyDestination} 도착`,
        text: finalMemoir,
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      };

      updateState(s => {
        const nextRep = Math.max(0, s.reputation + repChange);
        const nextBag = s.bag.filter(item => item.id !== 'evidence_item' && !item.name.includes("수송 증거물"));
        const nextChronicles = [newChronicle, ...(s.journeyChronicles || [])];

        return {
          ...s,
          journeyActive: false,
          journeyOrigin: "",
          pursuedByBehemoth: null, // Reaching journey end clears the chase
          calendarDays: 0,
          reputation: nextRep,
          bag: nextBag,
          journeyChronicles: nextChronicles,
          journals: [
            {
              id: 'end_' + Date.now(),
              title: `🏁 여정 마감: ${s.journeyDestination} (${isGoalSatisfied ? '성공' : '실패'})`,
              text: `${s.journeyOrigin || originName}에서 ${s.journeyDestination}까지의 모험을 끝마쳤습니다.\n- 총 이동 일수: ${s.calendarDays}일 (제한기한: ${s.calendarMaxDays}일 - ${ontimeText})\n- 달성 여정 목표: ${s.journeyGoalTitle}\n- 목표 판정: ${goalTextResult}\n- 길드 평판 변경: ${repChange >= 0 ? '+' : ''}${repChange}점 (최종 평판: ${nextRep}점)`,
              timestamp: Date.now()
            },
            ...s.journals
          ]
        };
      });

      if (isGoalSatisfied) {
        alert(`🏁 여정이 마감되었습니다!\n여정 목표 [${state.journeyGoalTitle}] 달성에 성공하여 길드 명성이 +5점 올랐습니다!`);
      } else {
        alert(`🏁 여정이 마감되었습니다!\n여정 목표 [${state.journeyGoalTitle}] 달성에 실패하여 길드 명성이 -3점 차감되었습니다.`);
      }
    }
  };

  // ---------------------------------------------------------------
  // BARROW DELVE HANDLERS
  // ---------------------------------------------------------------
  const handleFleeToSafety = () => {
    updateState((s: GameState) => ({
      ...s,
      calendarDays: s.calendarDays + 1,
      calendarHistory: [...s.calendarHistory, `고분 탈출: 위험을 피해 하루를 보냈습니다. 다음 이동 속도 1.`],
      journals: [
        { id: 'flee_' + Date.now(), title: '🏃 고분 탈출 — 피해 도망치기', text: `${s.currentLocationName}에서 고분 탐험을 포기하고 안전하게 달아났습니다. 하루가 소모되었고 다음 이동 속도는 1이 됩니다.`, timestamp: Date.now() },
        ...s.journals
      ]
    }));
    setFleeSafetyPending(true);
    setDelveActive(false);
    alert('피해 도망쳤습니다! 다음 이동 속도는 1입니다.');
  };

  const handleStartDelve = () => {
    // Find the barrow matching current location
    const barrow = (state.barrows || []).find(b => b.locationName === state.currentLocationName);
    if (!barrow) return;

    const suits = ['♥', '♦', '♣', '♠'];
    const drawnSuit = suits[Math.floor(Math.random() * suits.length)];
    setDelveDrawnSuit(drawnSuit);

    // Determine challenge by behemoth class + suit
    let challenge = '';
    const isRedSuit = drawnSuit === '♥' || drawnSuit === '♦';
    if (barrow.behemothClass === 'Towering') {
      challenge = isRedSuit ? 'UneasySleep' : 'CollapsedEntrance';
    } else if (barrow.behemothClass === 'Many') {
      challenge = isRedSuit ? 'BelliesOfMany' : 'InsideJob';
    } else if (barrow.behemothClass === 'Violent') {
      challenge = isRedSuit ? 'PotentPoison' : 'StealEverything';
    } else {
      challenge = isRedSuit ? 'BuildingTrust' : 'SuitableFurnishings';
    }

    const initialTimer = challenge === 'PotentPoison' ? 4 : 0;
    setDelveChallenge(challenge);
    setDelveTimer(initialTimer);
    setDelveFP(0);
    setBlackjackCards([]);
    setBlackjackStanding(false);

    // Log delve start
    updateState((s: GameState) => ({
      ...s,
      activeDelve: {
        behemothName: barrow.name,
        behemothClass: barrow.behemothClass,
        challengeType: challenge as any,
        timer: initialTimer,
        points: 0,
        cardsDrawn: [drawnSuit],
        reagentsGathered: []
      }
    }));

    setDelveActive(true);
  };

  const handleAbortDelve = () => {
    updateState((s: GameState) => ({ ...s, activeDelve: null }));
    setDelveActive(false);
    setDelveChallenge('');
    setDelveDrawnSuit('');
  };

  // Collapsed Entrance: Draw a card to gain FP and advance timer
  const handleDelveDrawCard = () => {
    const cardVal = Math.floor(Math.random() * 13) + 1;
    const gained = cardVal; // card value = FP gained
    const newFP = delveFP + gained;
    const newTimer = delveTimer + 1;
    setDelveFP(newFP);
    setDelveTimer(newTimer);

    // Update activeDelve
    updateState((s: GameState) => {
      if (!s.activeDelve) return s;
      const prevCards = s.activeDelve.cardsDrawn || [];
      return {
        ...s,
        activeDelve: { ...s.activeDelve, timer: newTimer, points: newFP, cardsDrawn: [...prevCards, String(cardVal)] }
      };
    });

    // Check milestones for Collapsed Entrance
    let milestone = '';
    if (newFP >= 50 && delveFP < 50) milestone = '침실 (Bedchambers) 도달! 장신구 10개 획득!';
    else if (newFP >= 30 && delveFP < 30) milestone = '식당 (Dining Hall) 도달! 평판 +5 획득!';
    else if (newFP >= 15 && delveFP < 15) milestone = '현관 (Entrance Hall) 도달! 장신구 1개 획득!';

    if (milestone) {
      // Give rewards
      updateState((s: GameState) => {
        let trinketGain = 0, repGain = 0;
        if (newFP >= 50 && delveFP < 50) trinketGain = 10;
        else if (newFP >= 30 && delveFP < 30) repGain = 5;
        else if (newFP >= 15 && delveFP < 15) trinketGain = 1;
        return {
          ...s,
          trinkets: [...s.trinkets, ...Array(trinketGain).fill('고분 보물 (Trinket)')],
          reputation: s.reputation + repGain
        };
      });
      alert(`🏆 ${milestone}`);

      if (newFP >= 50) {
        const daysToMark = Math.floor(newTimer / 4);
        updateState((s: GameState) => ({
          ...s,
          activeDelve: null,
          calendarDays: s.calendarDays + daysToMark,
          calendarHistory: [...s.calendarHistory, `고분 탐험 마감(침실 도달): 누적 타이머 ${newTimer} → ${daysToMark}일 소모`]
        }));
        setDelveActive(false);
        setDelveChallenge('');
        alert(`🛌 침실(Bedchambers)에 성공적으로 도달하여 탐험을 마칩니다. 타이머 ${newTimer} → ${daysToMark}일이 달력에 기록됩니다.`);
      }
    }
  };

  // Bid Farewell for Collapsed Entrance (leave the delve)
  const handleCollapsedFarewell = () => {
    const daysToMark = Math.floor(delveTimer / 4);
    updateState((s: GameState) => ({
      ...s,
      activeDelve: null,
      calendarDays: s.calendarDays + daysToMark,
      calendarHistory: [...s.calendarHistory, `고분 탐험 마감: 누적 타이머 ${delveTimer} → ${daysToMark}일 소모`]
    }));
    setDelveActive(false);
    setDelveChallenge('');
    alert(`탐험을 마무리했습니다. 타이머 ${delveTimer} → ${daysToMark}일이 달력에 기록됩니다.`);
  };

  // Uneasy Sleep: foraging attempt to gather SLEEP tag reagents
  const handleUneasySleepForage = () => {
    const newTimer = delveTimer + 1;
    setDelveTimer(newTimer);
    updateState((s: GameState) => {
      if (!s.activeDelve) return s;
      return { ...s, activeDelve: { ...s.activeDelve, timer: newTimer } };
    });
    if (newTimer >= 4) {
      // Timer ran out — FAIL → Chase
      alert('⏰ 시간이 다 되었습니다! 거수가 깨어납니다! 지금 당장 도망쳐야 합니다!\n\n【거대 야수 추격 시작】\n현재 여정 동안 매 이동 시 최소 3경로를 이동해야 합니다. 시작 선행 거리: 2경로.');
      updateState((s: GameState) => ({
        ...s,
        activeDelve: null,
        pursuedByBehemoth: { headStart: 2 },
        journals: [
          { id: 'chase_' + Date.now(), title: '🐾 거수의 추격 시작!', text: `고분에서 수면제 제조에 실패하여 거대 야수가 깨어났습니다. 도시 또는 여정 종료 전까지 매 이동마다 최소 3경로를 이동해야 합니다. 선행 거리: 2경로.`, timestamp: Date.now() }
          , ...s.journals
        ]
      }));
      setDelveActive(false);
      setDelveChallenge('');
    }
  };

  const handleUneasySleepSucceed = () => {
    const carryScore = getMaxCarry(state);
    const trinketGain = carryScore * 3;
    updateState((s: GameState) => ({
      ...s,
      activeDelve: null,
      calendarDays: s.calendarDays + 1,
      trinkets: [...s.trinkets, ...Array(trinketGain).fill('고분 보물 (Trinket)')],
      barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
      calendarHistory: [...s.calendarHistory, `고분 탐험 성공 (불면 고분): 장신구 ${trinketGain}개 획득, 고분 제거`],
      journals: [
        { id: 'delve_win_' + Date.now(), title: '✨ 고분 탐험 성공 — 불면의 잠', text: `수면 향을 제조하여 거수를 재웠습니다! 보물을 챙기고 탈출했습니다.\n장신구 ${trinketGain}개 획득, 달력 +1일.`, timestamp: Date.now() },
        ...s.journals
      ]
    }));
    setDelveActive(false);
    setDelveChallenge('');
    alert(`🎉 탐험 성공! 장신구 ${trinketGain}개를 획득했습니다!`);
  };

  // Pilfer Unnoticed (Steal Everything) blackjack
  // Rulebook p.123: 덱에서 카드를 뽑아 합산 (Ace=1, 2-10=face, J/Q/K=12)
  const handleBlackjackHit = () => {
    if (blackjackStanding) return;
    const raw = Math.floor(Math.random() * 13) + 1; // 1-13
    const cardVal = raw >= 11 ? 12 : raw; // J(11)/Q(12)/K(13) 모두 12점
    const newCards = [...blackjackCards, cardVal];
    setBlackjackCards(newCards);
    const total = newCards.reduce((a, b) => a + b, 0);
    if (total > 21) {
      // Bust — caught!
      const hasCrossbow = state.bag.some(i => i.name.includes('석궁') || i.id === 'tool_crossbow');
      const hasBolts = state.bag.some(i => i.name.includes('볼트') || i.id === 'tool_bolts');
      const hasCranky = state.bag.some(i => i.name.toLowerCase().includes('cranky') || i.name.includes('기구'));
      if (hasCrossbow && hasBolts) {
        alert(`❌ 합계 ${total}! 잡혔습니다!\n\n하지만 석궁으로 탈출! 볼트 1개를 소비하고 달력 +1일.`);
        updateState((s: GameState) => ({
          ...s,
          activeDelve: null,
          calendarDays: s.calendarDays + 1,
          bag: (() => {
            let removed = false;
            return s.bag.filter(i => {
              if (!removed && (i.id === 'tool_bolts' || i.name.includes('볼트'))) { removed = true; return false; }
              return true;
            });
          })()
        }));
      } else if (hasCranky) {
        alert(`❌ 합계 ${total}! 잡혔습니다!\n\n기계 장치로 탈출! 달력 +1일.`);
        updateState((s: GameState) => ({
          ...s,
          activeDelve: null,
          calendarDays: s.calendarDays + 1,
          bag: s.bag.filter(i => !i.name.toLowerCase().includes('cranky'))
        }));
      } else {
        alert(`💀 합계 ${total}! 잡혔습니다!\n\n탈출 도구가 없습니다. 여정이 비극으로 끝납니다.`);
        updateState((s: GameState) => ({
          ...s,
          activeDelve: null,
          journeyActive: false,
          journals: [
            { id: 'death_' + Date.now(), title: '💀 게임 오버 — 야수에게 잡힘', text: `물건을 훔치다 잡혀 탈출 도구도 없이 거대 야수의 분노에 쓰러졌습니다.`, timestamp: Date.now() },
            ...s.journals
          ]
        }));
      }
      setDelveActive(false);
      setBlackjackCards([]);
      setDelveChallenge('');
    }
  };

  const handleBlackjackStand = () => {
    const total = blackjackCards.reduce((a, b) => a + b, 0);
    setBlackjackStanding(true);
    const trinketGain = total === 21 ? 15 : Math.floor(total / 2);
    const isExact = total === 21;
    updateState((s: GameState) => ({
      ...s,
      activeDelve: null,
      calendarDays: s.calendarDays + 1,
      barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
      trinkets: [
        ...s.trinkets,
        ...Array(trinketGain).fill('도둑질 전리품 (Trinket)'),
        ...(isExact ? [{ id: 'tool_choice', name: '(선택 도구 교환권)', weight: 0, type: 'item' } as any] : [])
      ],
      journals: [
        { id: 'pilfer_' + Date.now(), title: isExact ? '🌬️ 완벽한 탈출!' : '🎒 조심스러운 탈출', text: isExact ? `합계 21로 완벽하게 탈출! 장신구 15개 + 원하는 도구 1개 획득.` : `합계 ${total}로 탈출. 장신구 ${trinketGain}개 획득.`, timestamp: Date.now() },
        ...s.journals
      ]
    }));
    setDelveActive(false);
    setBlackjackCards([]);
    setDelveChallenge('');
    alert(isExact ? `🌬️ 완벽한 탈출! 장신구 15개 + 도구 교환권 획득!` : `🎒 탈출 성공! 장신구 ${trinketGain}개 획득.`);
  };

  // Building Trust: Diagnose a random Moderate (intermediate) ailment for the barrow dwellers
  const handleDiagnoseBuildingTrust = () => {
    const moderateAils = GAME_DATA.ailments.filter(a => a.severity === 'intermediate');
    if (moderateAils.length === 0) return;
    const randomAil = moderateAils[Math.floor(Math.random() * moderateAils.length)];
    const cleanedName = randomAil.name.replace(/^PAGE\s*\d+\s*(---|--|-)\s*/i, '');

    updateState((s: GameState) => {
      const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === s.bio.familiarBenefit)?.mechanic || '';
      const startTimer = randomAil.timer + (familiarMechanic === 'helpful' || s.bio.familiarBenefit.includes("따뜻한 약제사") ? 2 : 0);
      const startFP = (familiarMechanic === 'perceptive' || s.bio.familiarBenefit.includes("예리한 관찰자")) ? 2 : 0;
      return {
        ...s,
        independentUsedThisAilment: false,
        activeAilment: {
          id: 'ail_' + Date.now(),
          name: `${cleanedName} (고분 환자)`,
          severity: randomAil.severity,
          timer: startTimer,
          maxTimer: startTimer,
          tags: randomAil.tags,
          description: randomAil.description,
          outcome: randomAil.outcome,
          consequence: randomAil.consequence,
          foragingPoints: startFP,
          reagentsGathered: []
        }
      };
    });
    alert(`🤝 고분 주민 질병 진료 시작: ${cleanedName} 질병을 진단했습니다.`);
  };

  // Building Trust: resolved via normal ailment flow
  // Rulebook p.124: 성공 → 장신구 대신 같은 양의 평판 획득 + 고분을 정착지(Settlement)로 교체
  //                  실패 → 고분 지도에서 제거 + 달력 +1일
  const handleBuildingTrustSuccess = () => {
    updateState((s: GameState) => {
      const ail = s.activeAilment;
      if (!ail) return s;
      // Severity level = reputation gain (instead of trinkets)
      const repGain = ail.severity === 'dire' ? 4 : ail.severity === 'severe' ? 3 : ail.severity === 'intermediate' ? 2 : 1;
      return {
        ...s,
        activeDelve: null,
        activeAilment: null,
        reputation: s.reputation + repGain,
        currentLocationType: 'Settlement',
        // Rulebook: Replace Barrow with a Settlement of same Region
        barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
        journals: [
          { id: 'trust_' + Date.now(), title: '🤝 신뢰 구축 성공!', text: `고분 거주민들의 신뢰를 얻었습니다! 길드에 대해 거래를 시작하기로 결정했습니다.\n이 고분이 정착지(Settlement)로 교체됩니다! 평판 +${repGain}.`, timestamp: Date.now() },
          ...s.journals
        ]
      };
    });
    setDelveActive(false);
    setDelveChallenge('');
    alert('🤝 신뢰 구축 성공! 장신구 대신 평판을 획득하고, 고분이 정착지로 전환됩니다!');
  };

  // Building Trust: FAILURE handler — Barrow removed from map
  const handleBuildingTrustFail = () => {
    updateState((s: GameState) => ({
      ...s,
      activeDelve: null,
      calendarDays: s.calendarDays + 1,
      barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
      journals: [
        { id: 'trust_fail_' + Date.now(), title: '😔 신뢰 구축 실패', text: '치료에 실패하여 거주민들의 신뢰를 얻지 못했습니다. 그들은 떠나기로 했고, 고분이 지도에서 사라집니다.\n달력 +1일.', timestamp: Date.now() },
        ...s.journals
      ]
    }));
    setDelveActive(false);
    setDelveChallenge('');
    alert('😔 신뢰 구축 실패. 고분 거주민들이 다른 곳으로 이사합니다. 고분이 지도에서 제거됩니다.');
  };

  // Suitable Furnishings: Draw 5 cards -> target rarities, then forage/barter
  const handleSuitableFurnishingsDrawTargets = () => {
    const targets = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10) + 1);
    updateState((s: GameState) => {
      if (!s.activeDelve) return s;
      return { ...s, activeDelve: { ...s.activeDelve, requiredReagents: targets.map(String) } };
    });
    alert(`🏡 목표 희귀도 5개 드로우 완료:\n${targets.join(', ')}\n이 희귀도에 맞는 약재들을 채집 또는 거래로 구해주세요.`);
  };

  const handleSuitableFurnishingsForage = () => {
    const newTimer = delveTimer + 1;
    setDelveTimer(newTimer);
    updateState((s: GameState) => {
      if (!s.activeDelve) return s;
      return { ...s, activeDelve: { ...s.activeDelve, timer: newTimer } };
    });
  };

  const handleSuitableFurnishingsComplete = () => {
    const timer = delveTimer;
    // Rulebook p.125: timer<10=장신구10+평판5+1일, timer<20=장신구7+1일, timer>=20=장신구1+2일
    let trinkets = 0, rep = 0, extraDays = 0, msg = '';
    if (timer < 10) { trinkets = 10; rep = 5; extraDays = 1; msg = '빠른 완료! 장신구 10개 + 평판 +5'; }
    else if (timer < 20) { trinkets = 7; extraDays = 1; msg = '완료! 장신구 7개'; }
    else { trinkets = 1; extraDays = 2; msg = '느린 완료. 장신구 1개, 달력 +2일'; }

    updateState((s: GameState) => ({
      ...s,
      activeDelve: null,
      calendarDays: s.calendarDays + extraDays,
      barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
      trinkets: [...s.trinkets, ...Array(trinkets).fill('가구 보수 보상 (Trinket)')],
      reputation: s.reputation + rep,
      journals: [
        { id: 'furnish_' + Date.now(), title: '🏡 가구 배치 완료!', text: `거수의 새 보금자리에 필요한 물건들을 구해줬습니다.\n타이머: ${timer} — ${msg} — 달력 +${extraDays}일`, timestamp: Date.now() },
        ...s.journals
      ]
    }));
    setDelveActive(false);
    setDelveChallenge('');
    alert(`🏡 완료! ${msg}`);
  };

  // Bellies of Many: create banquet (SLEEP 6 timer-style, use normal foraging)
  const handleBelliesForage = () => {
    const newTimer = delveTimer + 1;
    setDelveTimer(newTimer);
    if (newTimer >= 12) {
      alert('⏰ 연회 시간이 다 되었습니다! 충분한 요리를 만들지 못했습니다.\n거수들의 분노로 달력 +2일, 여정 재개.');
      updateState((s: GameState) => ({
        ...s,
        activeDelve: null,
        calendarDays: s.calendarDays + 2,
        calendarHistory: [...s.calendarHistory, '군집 야수 고분 실패 — 연회 재료 부족']
      }));
      setDelveActive(false);
      setDelveChallenge('');
    } else {
      updateState((s: GameState) => {
        if (!s.activeDelve) return s;
        return { ...s, activeDelve: { ...s.activeDelve, timer: newTimer } };
      });
    }
  };

  const handleBelliesComplete = () => {
    // Give Titan Detector artifact
    updateState((s: GameState) => ({
      ...s,
      activeDelve: null,
      calendarDays: s.calendarDays + 1,
      barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
      bag: [...s.bag, { id: 'artifact_titan_detector_' + Date.now(), name: '🔮 티탄 탐지 기계 (Titan Detector)', weight: 1, type: 'item' as any }],
      journals: [
        { id: 'bellies_' + Date.now(), title: '🍖 연회 성공!', text: '군집 야수들의 연회를 성공적으로 도왔습니다!\n보상: 티탄 탐지 기계 획득 (무게 1). 야생 위치 진입 시 모나크 카드를 뽑으면 그 위치를 티탄 유적으로 전환합니다.', timestamp: Date.now() },
        ...s.journals
      ]
    }));
    setDelveActive(false);
    setDelveChallenge('');
    alert('🍖 연회 성공! 티탄 탐지 기계를 획득했습니다!');
  };

  // Inside Job: Nefarious Concoction — forage each attempt adds 1 to timer
  const handleInsideJobForage = () => {
    const newTimer = delveTimer + 1;
    setDelveTimer(newTimer);
    if (newTimer >= 10) {
      alert('⏰ 거수가 돌아왔습니다! 약을 만들지 못한 채 떠납니다.\n달력 +1일, 여정 재개.');
      updateState((s: GameState) => ({
        ...s,
        activeDelve: null,
        calendarDays: s.calendarDays + 1
      }));
      setDelveActive(false);
      setDelveChallenge('');
    } else {
      updateState((s: GameState) => {
        if (!s.activeDelve) return s;
        return { ...s, activeDelve: { ...s.activeDelve, timer: newTimer } };
      });
    }
  };

  const handleInsideJobComplete = () => {
    // Rulebook p.121: 성공 시 장신구 20개 고정 (타이머와 무관)
    const trinkets = 20;
    updateState((s: GameState) => ({
      ...s,
      activeDelve: null,
      calendarDays: s.calendarDays + 1,
      barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
      trinkets: [...s.trinkets, ...Array(trinkets).fill('거래 보상 (Trinket)')],
      journals: [
        { id: 'inside_' + Date.now(), title: '🕵️ 내부 소행 성공!', text: '나쁜 음료를 제조해 음모 회의를 성공적으로 망쳤습니다!\n장신구 20개 획득 + 달력 +1일.', timestamp: Date.now() },
        ...s.journals
      ]
    }));
    setDelveActive(false);
    setDelveChallenge('');
    alert('🕵️ 성공! 장신구 20개 획득!');
  };

  // Potent Poison: gather 7 reagents then draw card
  const handlePotentPoisonForage = () => {
    const newTimer = delveTimer - 1;
    setDelveTimer(Math.max(0, newTimer));
    const newFP = delveFP + 1;
    setDelveFP(newFP);
    updateState((s: GameState) => {
      if (!s.activeDelve) return s;
      return { ...s, activeDelve: { ...s.activeDelve, timer: Math.max(0, newTimer), points: newFP } };
    });
    if (newTimer <= 0) {
      // Timer ran out — draw card + add 2 per reagent gathered
      const card = Math.floor(Math.random() * 13) + 1;
      const bonus = newFP * 2;
      const total = card + bonus;
      if (total >= 9) {
        updateState((s: GameState) => ({
          ...s,
          activeDelve: null,
          calendarDays: s.calendarDays + 1,
          barrows: (s.barrows || []).filter(b => b.locationName !== s.currentLocationName),
          trinkets: [...s.trinkets, ...Array(5).fill('용병 보수 (Trinket)')],
          bio: { ...s.bio, carry: s.bio.carry + 1 }
        }));
        alert(`⚔️ 성공! 카드 ${card} + 약재 보너스 ${bonus} = ${total}.\n거수를 물리쳤습니다! 장신구 5개, 가방 용량 +1 영구 획득!`);
      } else {
        updateState((s: GameState) => ({
          ...s,
          activeDelve: null,
          calendarDays: s.calendarDays + 1
        }));
        alert(`❌ 실패. 카드 ${card} + 보너스 ${bonus} = ${total}.\n용병들이 패퇴했습니다. 숨어있다 탈출, 달력 +1일.`);
      }
      setDelveActive(false);
      setDelveChallenge('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button 
        id="debug-inject-state"
        style={{
          background: '#d97706',
          color: '#fff',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          alignSelf: 'flex-start',
          margin: '1rem',
          zIndex: 9999
        }}
        onClick={() => {
          const customState = {
            bio: {
              name: 'Current Apprentice',
              descriptor: 'Burrowing',
              examples: '오소리, 토끼, 고슴도치, 두더지',
              travelStyle: 'Rambling and Ready',
              speed: 3,
              carry: 4,
              originName: '약제사 사고 후의 치료 서비스',
              originDesc: '큰 사고를 당하고 치유를 받으면서 약제사의 길을 걷기로 결심했습니다.',
              familiarName: 'Buddy',
              familiarRelation: '깊은 동반자 (서로 아끼고 의지함)',
              canFly: false
            },
            reputation: 15,
            currentLocationName: 'Starting Oak Road',
            currentLocationType: 'Wilds',
            currentRegion: 'Forest',
            currentSeason: 'Spring',
            bag: [
              { id: 'tool_knife', name: '벨트 칼', weight: 1/3, type: 'tool' },
              { id: 'tool_mortar', name: '나무 절구와 공이 [GRIND/CRUSH]', weight: 1/3, type: 'tool' },
              { id: 'tool_kettle', name: '낡은 캠프 주전자 [BOIL/BREW]', weight: 1/3, type: 'tool' },
              { id: 'tool_jaws', name: '이빨 [CHEW/DIGEST]', weight: 0, type: 'tool' },
              { id: 'tool_paws', name: '앞발/발톱 [ADD/APPLY]', weight: 0, type: 'tool' },
              { id: 'reagent_1', name: 'Oak Leaves (Part: ⅓ Leaves)', weight: 1/3, type: 'reagent', qty: 1, preps: '[ADD/APPLY] for [WOUND 1]' },
              { id: 'reagent_2', name: 'Birch Bark (Part: ⅔ Bark)', weight: 1/3, type: 'reagent', qty: 1, preps: '[BOIL/BREW] for [FEVER 1]' }
            ],
            trinkets: ['기념품 (Memento)'],
            journeyActive: true,
            journeyOrigin: 'Starting Oak Road',
            journeyDestination: 'Newdam',
            journeyDistance: '12 Paths',
            journeyDirection: 'North',
            journeyGoalTitle: 'Spring Restoration',
            calendarDays: 2,
            calendarMaxDays: 12,
            calendarHistory: ['여정 시작: Newdam로 출발!'],
            activeAilment: null,
            pursuedByBehemoth: {
              headStart: 3
            },
            legacyClinics: [
              {
                locationName: 'Starting Oak Road',
                region: 'Forest',
                services: ['foraging'],
                founder: '약제사 1대 스승 (Apothecary Gen 1)'
              }
            ],
            legacyApothecaries: [
              {
                name: '약제사 1대 스승 (Apothecary Gen 1)',
                ageOfRetirement: 12,
                clinicsBuilt: 1,
                legacyScore: 16
              }
            ],
            discoveredRecipes: {
              'Anxious Scratching': [
                ['Oak Leaves', 'Birch Bark']
              ]
            },
            worldAlmanac: [
              {
                id: 'alm_reagent_oak_leaves',
                category: 'reagent',
                name: 'Oak Leaves',
                locationName: 'Starting Oak Road',
                region: 'Forest',
                source: 'Current location',
                notes: 'Useful for wounds',
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                sightings: 1
              }
            ],
            travelScrapbook: [
              {
                id: 'scrap_test_log',
                sourceId: 'log_1',
                kind: 'journey',
                title: 'Travel log 1',
                text: 'Moved to Starting Oak Road',
                locationName: 'Starting Oak Road',
                timestamp: Date.now()
              }
            ],
            trinketArchive: [
              {
                id: 'trinket_smoke_test_1',
                sourceId: 'cure_smoke_test_1_trinkets',
                name: '말린 엉겅퀴 씨앗 주머니 (Pouch of Dried Thistle)',
                count: 1,
                source: 'Patient: Pip (Field Mouse)',
                story: '치료의 답례로 건네받은 작은 천 주머니. 흔들면 바스락거리는 마른 씨앗 소리가 납니다.\n\n— Starting Oak Road에서 Pip의 Anxious Scratching을 낫게 돕고 남겨진 조각입니다.',
                locationName: 'Starting Oak Road',
                timestamp: Date.now() - 3600000 * 2,
                spent: false,
                patientCaseId: 'case_smoke_test_1'
              }
            ],
            patientCasebook: [
              {
                id: 'case_smoke_test_1',
                sourceId: 'cure_smoke_test_1',
                patientName: 'Pip',
                species: 'Field Mouse',
                ailmentName: 'Anxious Scratching',
                severity: 'lesser',
                tags: 'MOOD 2, FUR',
                locationName: 'Starting Oak Road',
                region: 'Forest',
                season: 'Spring',
                journeyTitle: 'Spring Restoration',
                resolvedAtDay: 2,
                outcome: 'success',
                remedy: ['Oak Leaves', 'Birch Bark'],
                consequence: '',
                initialRememberedNote: 'Found Pip shivering behind a gorse bush on Oak Road.',
                finalArchiveNote: 'Gave Pip a warm tea brewed with Birch Bark. Pip recovered quickly and gave me a dried press thistle seed pouch.',
                notes: '',
                timestamp: Date.now() - 3600000 * 2,
                isBookmarked: true
              },
              {
                id: 'case_smoke_test_2',
                sourceId: 'cure_smoke_test_2',
                patientName: 'Barnaby',
                species: 'Elderly Badger',
                ailmentName: 'Anxious Scratching',
                severity: 'severe',
                tags: 'MOOD 2 및 FUR 또는 SCALE 1',
                locationName: 'Bristley Woods',
                region: 'Forest',
                season: 'Spring',
                journeyTitle: 'Spring Restoration',
                resolvedAtDay: 4,
                outcome: 'failure',
                remedy: [],
                consequence: 'The poor badger fully moulted under extreme stress and went into hiding in the deep woods.',
                initialRememberedNote: 'Met Barnaby near the old oak roots.',
                finalArchiveNote: 'Could not brew the remedy in time. Barnaby retreated into the den in distress.',
                notes: 'Barnaby fully moulted and went into hiding.',
                timestamp: Date.now() - 3600000,
                isBookmarked: false
              }
            ],
            lostPatientLegacy: {
              name: 'Barnaby',
              species: 'Elderly Badger',
              ailmentName: 'Anxious Scratching',
              day: 4,
              consequence: 'The poor badger fully moulted under extreme stress and went into hiding in the deep woods.'
            },
            visitedLocations: ['Starting Oak Road']
          };
          localStorage.setItem('apawthecaria_rpg_state', JSON.stringify(customState));
          window.location.reload();
        }}
      >
        🔧 Inject Smoke Test State (Debug)
      </button>
      {state.pendingPatientArchive && (
        <div style={{ position: 'fixed', right: '1.2rem', bottom: '1.2rem', zIndex: 1100, width: 'min(420px, calc(100vw - 2.4rem))' }}>
          <div className="cute-card" style={{ background: '#fffefa', border: '1.5px solid var(--border-cozy)', boxShadow: '0 8px 24px rgba(36,32,24,0.16)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.45rem', marginBottom: '0.7rem' }}>
              <div>
                <div className="document-kicker">Close Field Case File</div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem' }}>{state.pendingPatientArchive.ailmentName}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {(state.pendingPatientArchive.patientName || 'Anonymous patient')}
                  {state.pendingPatientArchive.species ? ` / ${state.pendingPatientArchive.species}` : ''}
                </div>
              </div>
              <span className="journal-stamp" style={{ color: state.pendingPatientArchive.outcome === 'success' ? 'var(--primary)' : '#8a6f65', borderColor: state.pendingPatientArchive.outcome === 'success' ? 'var(--primary)' : '#8a6f65' }}>
                {state.pendingPatientArchive.outcome}
              </span>
            </div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Final note for the archive
            </label>
            <textarea
              rows={4}
              value={finalArchiveNoteDraft}
              onChange={e => setFinalArchiveNoteDraft(e.target.value)}
              placeholder="Leave unchanged, edit, or clear this closing note."
              style={{ width: '100%', resize: 'vertical', fontSize: '0.9rem' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginTop: '0.5rem', cursor: 'pointer', color: 'var(--text-bright)', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={isBookmarkedDraft}
                onChange={e => setIsBookmarkedDraft(e.target.checked)}
              />
              <span>⭐ 이 환자를 마음에 담아두기 (Keep in Heart / Bookmark)</span>
            </label>
            {state.pendingPatientArchive.consequence && (
              <div style={{ marginTop: '0.55rem', padding: '0.55rem', background: '#f2eee9', border: '1px solid #d7cbc1', borderRadius: '4px', color: '#6c5a4f', fontSize: '0.8rem' }}>
                <strong>Consequence:</strong> {state.pendingPatientArchive.consequence}
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
                케이스 파일 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. If journey is NOT active */}
      {!state.journeyActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* Downtime record */}
          <div className="cute-card" style={{ background: '#fffefa', border: '1.5px solid var(--secondary)', borderRadius: '7px', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
              <span className="journal-stamp">Rest</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--secondary)', fontFamily: 'var(--font-fancy)' }}>휴식기 기록 (Downtime Ledger)</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  현재 위치: <strong style={{ color: 'var(--primary)' }}>{state.currentLocationName}</strong>
                  ({state.currentLocationType === 'City' ? '도시' : state.currentLocationType === 'Settlement' ? '정착지' : '야생'}) |
                  계절: <strong style={{ color: 'var(--secondary)' }}>{state.currentSeason === 'Spring' ? '봄 (Spring)' : state.currentSeason === 'Summer' ? '여름 (Summer)' : state.currentSeason === 'Autumn' ? '가을 (Autumn)' : '겨울 (Winter)'}</strong>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              여정을 안전하게 마친 후 머무는 동안, 도구를 정비하고 마차를 개조하거나 새로운 조수(동반자)를 영입해 다음 모험을 탄탄히 준비하세요.
            </p>
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
              동반자 영입 ({state.companions?.length || 0})
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
              {(atClinicLocation || inClinicRegion) && (
                <div className="cute-card" style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '12px', padding: '1.2rem' }}>
                  <h3 style={{ color: '#15803d', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                    <span>🏡 약제소 본부 (Clinic Headquarters)</span>
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#166534', margin: '0 0 1rem 0' }}>
                    현재 구역({state.currentRegion}) 또는 위치({state.currentLocationName})에 길드 약제소가 설립되어 있어 본부 혜택을 이용할 수 있습니다.
                  </p>

                  {/* 활성화된 아젠다 서비스 리스트 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(state.clinics || []).map((c, i) => (
                      <span key={i} style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        📍 {c.locationName} 지부: {c.agendaService.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* 1. Pantry (Hibernate) */}
                    {(state.clinics || []).some(c => c.agendaService === 'pantry') && (
                      <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>❄️ 식료품 저장고 (Pantry Winter Hibernation)</h4>
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
                          <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>🌱 약초 정원 (Gardens {hasGreenhouse && 'with Greenhouse'})</h4>
                          <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                            보유 중인 영약재를 정원에 심어 재배하고 수확할 수 있습니다. (질병 치료당 1회 수확 가능)
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#444' }}>
                              현재 심겨진 약재: <strong>{state.gardenPlant || '없음'}</strong>
                              {state.gardenPlant && (state.gardenHarvestedThisAilment ? ' (이번 질병 수확 완료 ❌)' : ' (수확 가능 🧺)')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select id="garden_plant_select" style={{ padding: '0.3rem', fontSize: '0.8rem' }}>
                                <option value="">-- 심을 약재 선택 --</option>
                                {state.bag.filter(item => item.type === 'reagent').map((item, idx) => (
                                  <option key={idx} value={item.name.split(' (')[0]}>{item.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  const select = document.getElementById('garden_plant_select') as HTMLSelectElement;
                                  if (select && select.value) {
                                    handleGardenPlant(select.value);
                                  } else {
                                    alert("심을 약재를 선택하세요.");
                                  }
                                }}
                                className="btn-cozy-primary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              >
                                🌱 심기
                              </button>
                            </div>
                            {state.gardenPlant && (
                              <button
                                onClick={handleGardenHarvest}
                                disabled={!canHarvest || !!state.gardenHarvestedThisAilment}
                                className="btn-cozy-secondary"
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.8rem',
                                  alignSelf: 'flex-start',
                                  background: (canHarvest && !state.gardenHarvestedThisAilment) ? '#166534' : '#e2e8f0',
                                  color: (canHarvest && !state.gardenHarvestedThisAilment) ? '#fff' : '#94a3b8',
                                  cursor: (canHarvest && !state.gardenHarvestedThisAilment) ? 'pointer' : 'not-allowed'
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
                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>🐛 물에 젖은 통나무 (Sodden Logs)</h4>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                          곤충 서식지를 만들어 곤충 약재를 수확합니다. (치료 시간 1시간을 추가로 소비하여 질병 타이머 -1)
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#444' }}>
                            현재 서식 곤충: <strong>{state.soddenLogInsect || '없음'}</strong>
                            {state.soddenLogInsect && (state.soddenLogHarvestedThisAilment ? ' (이번 질병 수확 완료 ❌)' : ' (수확 가능 🐛)')}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select id="sodden_insect_select" style={{ padding: '0.3rem', fontSize: '0.8rem' }}>
                              <option value="">-- 서식 곤충 지정 --</option>
                              {GAME_DATA.reagents.filter(r => r.type === 'INSECT').map((item, idx) => (
                                <option key={idx} value={item.name}>{item.name} (유형: {item.type})</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const select = document.getElementById('sodden_insect_select') as HTMLSelectElement;
                                if (select && select.value) {
                                  handleSoddenLogInsect(select.value);
                                } else {
                                  alert("서식할 곤충을 선택하세요.");
                                }
                              }}
                              className="btn-cozy-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              🐛 지정하기
                            </button>
                          </div>
                          {state.soddenLogInsect && (
                            <button
                              onClick={handleSoddenLogHarvest}
                              disabled={state.currentSeason === 'Winter' || !!state.soddenLogHarvestedThisAilment}
                              className="btn-cozy-secondary"
                              style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.8rem',
                                alignSelf: 'flex-start',
                                background: (state.currentSeason !== 'Winter' && !state.soddenLogHarvestedThisAilment) ? '#166534' : '#e2e8f0',
                                color: (state.currentSeason !== 'Winter' && !state.soddenLogHarvestedThisAilment) ? '#fff' : '#94a3b8',
                                cursor: (state.currentSeason !== 'Winter' && !state.soddenLogHarvestedThisAilment) ? 'pointer' : 'not-allowed'
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
                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#166534' }}>🎁 친선 매대 (Goodwill Stand)</h4>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.6rem 0' }}>
                          가방의 약재나 도구를 기부하고 계절 정산 시 평판으로 돌려받습니다.
                          (현재 계절 기부량: <strong>{formatWeight(state.goodwillDonationsVal || 0)}</strong>)
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select id="goodwill_item_select" style={{ padding: '0.3rem', fontSize: '0.8rem', flex: 1 }}>
                            <option value="">-- 기부할 가방 아이템 선택 --</option>
                            {state.bag.map((item, idx) => (
                              <option key={idx} value={item.id}>{item.name} (무게: {formatWeight(item.weight)})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const select = document.getElementById('goodwill_item_select') as HTMLSelectElement;
                              if (select && select.value) {
                                handleGoodwillDonate(select.value);
                              } else {
                                alert("기부할 아이템을 선택하세요.");
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
                const legacyClinicsHere = (state.legacyClinics || []).filter(c => c.region === state.currentRegion || c.locationName === state.currentLocationName);
                if (legacyClinicsHere.length === 0) return null;

                return (
                  <div className="cute-card" style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '1.2rem' }}>
                    <h3 style={{ color: '#b45309', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                      <span>🏡 선배의 진료소 거점 (Legacy Clinic Hub)</span>
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#78350f', margin: '0 0 1rem 0' }}>
                      이 지역({state.currentRegion}) 또는 위치({state.currentLocationName})에 이전 세대의 선배 약제사(설립자: {legacyClinicsHere.map(c => c.founder).join(', ')})가 설립한 옛 진료소가 남아있습니다.
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
                      {state.legacyRestUsedThisLocation ? '🔒 이 구역에서 이미 휴식/보급을 받았습니다' : '☕ 선배의 진료실에서 휴식 및 보급 (치료 타이머 +1시간 / Behemoth 선행거리 +1 / 보급약재 지급)'}
                    </button>
                  </div>
                );
              })()}

              {/* Listening to Rumours (City Only) */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🗺️ 소문 듣기 (Behemoth Barrow 탐색)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  길드 명성이 <strong>15점 이상</strong>이고 <strong>도시(City)</strong>에 머물 때만 가능합니다. 소문을 들어 지도상의 야생 구역에 거수 고분(Barrow)을 생성합니다. (현재 평판: {state.reputation}점)
                </p>

                {state.currentLocationType !== 'City' && !bypassShopRules ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                    ⚠️ 현재 위치가 도시(City)가 아니어서 소문을 들을 수 없습니다. (상점 규칙 우회를 켜서 활성화할 수 있습니다.)
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
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>🏷️ 거수 고분(Barrow) 이름:</label>
                            <input
                              type="text"
                              value={rumourBarrowName}
                              onChange={e => setRumourBarrowName(e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>📍 배치할 지도상의 위치명 (예: "Bog-A", "Wilds-3"):</label>
                            <input
                              type="text"
                              placeholder="지도의 빈 야생(Wilds) 위치명을 적어주세요"
                              value={rumourLocName}
                              onChange={e => setRumourLocName(e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
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
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🩺 일반 진료 (General Practice)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  동네 주민들을 진료하며 <strong>5 장신구</strong>를 벌고 질병의 태그를 영구 변경합니다.
                </p>

                <form onSubmit={handleGeneralPractice} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>진료한 질병명 선택/입력:</label>
                      <input
                        type="text"
                        placeholder="예: Paw Rot (발썩음병)"
                        value={gpAilment}
                        onChange={e => setGpAilment(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>태그 변경 기록 (예: PAIN 1 제거):</label>
                      <input
                        type="text"
                        placeholder="예: INFECTION 1 제거"
                        value={gpTagChange}
                        onChange={e => setGpTagChange(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem' }}
                      />
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
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🧺 재고 보충 (Replenishing Stocks)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  현재 구역(<strong style={{ color: 'var(--primary)' }}>{state.currentRegion}</strong>)과 계절(<strong>{state.currentSeason}</strong>)에 맞춰 가방에 제철 약재 1개를 획득합니다.
                </p>

                {(() => {
                  const matchingReagents = GAME_DATA.reagents.filter(r =>
                    r.regions.includes(state.currentRegion) &&
                    r.seasons.includes(state.currentSeason)
                  );

                  return (
                    <form onSubmit={handleReplenishStocks} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>채집 가능한 제철 약초 선택:</label>
                        <select
                          value={replenishReagentIndex}
                          onChange={e => setReplenishReagentIndex(parseInt(e.target.value))}
                          style={{ width: '100%', padding: '0.4rem' }}
                        >
                          <option value="-1">-- 약초를 선택하세요 --</option>
                          {matchingReagents.map((r, idx) => (
                            <option key={idx} value={idx}>{r.name} ({r.rawName} - 희귀도 {r.br})</option>
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
                      <button type="submit" className="btn-cozy-secondary" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }} disabled={replenishReagentIndex < 0}>
                        🧺 약초 가방에 1개 추가
                      </button>
                    </form>
                  );
                })()}
              </div>

              {/* Working on Yourself */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🌱 자기 계발 (Working on Yourself)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  바쁜 일상에서 벗어나 자신을 갈고닦습니다. 영구 능력치 버프 또는 새로운 여행 방식을 정립합니다.
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleWorkingOnYourself('speed')} className="btn-cozy-primary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>
                    🏃‍♂️ 속도 영구 향상 (+1 Speed)
                  </button>
                  <button onClick={() => handleWorkingOnYourself('carry')} className="btn-cozy-primary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>
                    🎒 짐 소지 영구 향상 (+1 Carry)
                  </button>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px dashed #eee', paddingTop: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>🧭 이동 스타일 변경:</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <select id="style_select" style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }}>
                      {GAME_DATA.bioChoices.travelStyles.map((style, idx) => (
                        <option key={idx} value={style.name}>{style.name} ({style.suit} - 속도 {style.speed}, 짐 {style.carry})</option>
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

              {/* 🐾 사역마와 교감 (Familiar Intimacy & milestones) */}
              <div className="cute-card" style={{ background: '#f8fafc', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🐾 사역마 교감 (Familiar Intimacy)</span>
                  <span style={{ fontSize: '0.8rem', background: 'var(--primary)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '12px' }}>
                    친밀도: {state.familiarTrust || 0}%
                  </span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  현재 동행 중인 사역마: <strong>{state.bio.familiarBenefit}</strong><br />
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
                    🚶‍♂️ 사역마와 하루 동안 시간 보내기 (친밀도 +5%, 일정 +1일 소모)
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <select id="familiar_feed_select" style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }}>
                      <option value="">-- 먹일 식물 약재 선택 (친밀도 +15%) --</option>
                      {state.bag.filter(item => item.type === 'reagent').map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const selVal = (document.getElementById('familiar_feed_select') as HTMLSelectElement)?.value;
                        if (selVal) {
                          handleFamiliarFeedReagent(selVal);
                        } else {
                          alert("먹일 약재를 선택해 주세요.");
                        }
                      }}
                      className="btn-cozy-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      🍎 간식 주기
                    </button>
                  </div>
                </div>
              </div>

              {/* Exploring The Woods */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🧭 숲 탐험하기 (Exploring The Woods)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  현재 머무는 위치 주변의 지도에 두 장소 간 새로운 경로(Path)나 물길을 하나 개척합니다.
                </p>
                <button
                  onClick={() => {
                    const pathDesc = prompt("개척할 새로운 경로의 상세 정보 및 연결되는 장소를 입력하세요:");
                    if (pathDesc) {
                      updateState(s => ({
                        ...s,
                        journals: [
                          {
                            id: 'explore_woods_' + Date.now(),
                            title: `🧭 숲 개척 일지: 새로운 경로`,
                            text: `새로운 경로를 개척했습니다.\n- 경로 상세: ${pathDesc}`,
                            timestamp: Date.now()
                          },
                          ...s.journals
                        ]
                      }));
                      alert("🧭 새로운 경로를 성공적으로 개척하고 일지에 기록했습니다!");
                    }
                  }}
                  className="btn-cozy-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  🗺️ 새로운 경로 개척
                </button>
              </div>

              {/* Reconnecting With Guildmates */}
              <div className="cute-card" style={{ background: '#fff', border: '1.5px solid var(--border-cozy)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🤝 동료들과 재회하기 (Reconnecting With Guildmates)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  가장 가까운 도시(City)로 이동해 다른 동료 약제사들과 정보와 노트를 공유합니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>가져갈 길드 정보 노트 선택:</label>
                    <select id="reconnect_note_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="ledger">🌿 식물학자의 장부 (Botanist's Ledger - 무게 1/3, 해당 지역 채집 시작 시 +2 FP)</option>
                      <option value="map">🗺️ 물류 지도 (Logistical Map - 무게 2/3, 해당 지역 이동 조우 시 2장 드로우 선택)</option>
                      <option value="gossip">💬 흥미로운 소문 (Juicy Gossip - 무게 0, 흥정 거래 시 소모해 자동 성공)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>노트의 적용 지역 (장부/지도 선택 시에만 필요):</label>
                    <select id="reconnect_region_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="Forest">Forest (숲)</option>
                      <option value="Meadow">Meadow (초원)</option>
                      <option value="Loch">Loch (호수)</option>
                      <option value="Bog">Bog (수렁)</option>
                      <option value="Mountain">Mountain (산맥)</option>
                      <option value="Titan">Titan (티탄 유적)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>이동할 도시(City) 이름 입력:</label>
                    <input type="text" id="reconnect_city_input" placeholder="예: Glasswall, Noonhill 등" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }} />
                  </div>
                  <button
                    onClick={() => {
                      const noteType = (document.getElementById('reconnect_note_select') as HTMLSelectElement)?.value;
                      const reg = (document.getElementById('reconnect_region_select') as HTMLSelectElement)?.value;
                      const city = (document.getElementById('reconnect_city_input') as HTMLInputElement)?.value.trim() || "가까운 대도시";

                      let name = "";
                      let wt = 1/3;
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

                      updateState(s => {
                        const newItem = { id: 'guild_note_' + Date.now(), name, weight: wt, type: 'item' as any };
                        return {
                          ...s,
                          bag: [...s.bag, newItem],
                          currentLocationName: city,
                          currentLocationType: 'City',
                          completedReconnecting: true,
                          journals: [
                            {
                              id: 'reconnect_' + Date.now(),
                              title: `🤝 길드원 동료들과의 재회`,
                              text: `대도시 ${city}로 이동하여 동료들과 재회했습니다. 정보를 교환하고 새로운 노트 [${name}]을(를) 획득했습니다.`,
                              timestamp: Date.now()
                            },
                            ...s.journals
                          ]
                        };
                      });
                      alert(`🤝 동료 약제사들과 노트를 공유하고 도시 [${city}]로 이동해 [${name}]을(를) 획득했습니다!`);
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
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>💖 친구들과 휴식하기 (Relaxing with Friends)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  동반자 사역마를 교체하거나, 가방에 들어갈 새로운 기본 도구를 이별 선물로 받습니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>획득할 선물 도구 선택 (도구를 선택할 경우):</label>
                    <select id="relax_tool_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="">-- 선물 도구 선택 --</option>
                      {TOOLS_DB.map(tool => (
                        <option key={tool.id} value={tool.name}>{tool.name} (🪙 {tool.cost}개 가치)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>새로운 사역마 영입 (사역마를 교체할 경우):</label>
                    <select id="relax_familiar_select" style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}>
                      <option value="">-- 새 사역마 혜택 선택 --</option>
                      {FAMILIAR_BENEFITS.map(f => (
                        <option key={f.card} value={f.name}>{f.name} ({f.desc})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const tName = (document.getElementById('relax_tool_select') as HTMLSelectElement)?.value;
                      const fName = (document.getElementById('relax_familiar_select') as HTMLSelectElement)?.value;

                      if (!tName && !fName) {
                        alert("도구 선물이나 사역마 교체 중 하나를 선택해 주세요.");
                        return;
                      }

                      updateState(s => {
                        let nextBag = [...s.bag];
                        let nextBio = { ...s.bio };
                        let summary = "";

                        if (tName) {
                          const toolObj = TOOLS_DB.find(t => t.name === tName);
                          if (toolObj) {
                            nextBag.push({
                              id: 'gift_tool_' + Date.now(),
                              name: toolObj.name,
                              weight: toolObj.weight,
                              type: 'tool'
                            });
                            summary += `선물 도구 [${toolObj.name}] 획득!`;
                          }
                        }

                        if (fName) {
                          nextBio.familiarBenefit = fName;
                          summary += (summary ? " & " : "") + `사역마 혜택 [${fName}]으로 변경!`;
                        }

                        return {
                          ...s,
                          bag: nextBag,
                          bio: nextBio,
                          journals: [
                            {
                              id: 'relax_friends_' + Date.now(),
                              title: `💖 친구들과 보낸 평화로운 휴식`,
                              text: `친구들과 휴식을 즐기며 충전했습니다.\n- 휴식 결과: ${summary}`,
                              timestamp: Date.now()
                            },
                            ...s.journals
                          ]
                        };
                      });
                      alert(`💖 휴식을 즐겼습니다!\n결과: ${tName ? `🎁 도구 [${tName}] 가방 획득!` : ''} ${fName ? `🦉 사역마 혜택 변경!` : ''}`);
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
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🐾 도움의 손길 (Lending A Paw)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  다른 길드나 이웃 동물들의 공공 프로젝트에 자원봉사하여 <strong>길드 Reputation +5점</strong>을 획득합니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <textarea id="lending_note" placeholder="어떤 프로젝트를 도왔는지 묘사해 일지에 남겨주세요." style={{ width: '100%', height: '50px', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <button
                    onClick={() => {
                      const note = (document.getElementById('lending_note') as HTMLTextAreaElement)?.value || "이웃 길드의 공공 프로젝트에 일손을 도왔다.";
                      updateState(s => ({
                        ...s,
                        reputation: s.reputation + 5,
                        journals: [
                          {
                            id: 'lend_paw_' + Date.now(),
                            title: `🐾 자원봉사: 도움의 손길`,
                            text: `공공 자원봉사 활동에 참여했습니다.\n- 평판 +5 획득\n- 자원봉사 기록: ${note}`,
                            timestamp: Date.now()
                          },
                          ...s.journals
                        ]
                      }));
                      alert("🐾 자원봉사 성공! 길드 명성 평판이 5점 올랐습니다!");
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
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#047857', fontSize: '1.1rem' }}>🏡 새 약제소(Clinic) 설립 가능!</h3>
                  <p style={{ fontSize: '0.85rem', color: '#065f46', margin: '0 0 1rem 0' }}>
                    야생 지역에서 성공적으로 질병을 완치했으므로, <strong>장신구 15개</strong>를 들여 여기에 영구적인 Guild Clinic을 지을 수 있습니다!<br />
                    건설하려면 아래에서 원하는 <strong>길드 아젠다 서비스(Guild Agenda Service)</strong>를 하나 선택해 주십시오. (누적 시간 {state.cumulativeDays}/120일 경과)
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                    <div>
                      <label style={{ fontWeight: 'bold', color: '#047857' }}>추가할 길드 아젠다 서비스 선택:</label>
                      <select
                        value={selectedAgendaService}
                        onChange={e => setSelectedAgendaService(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem', borderColor: '#10b981' }}
                      >
                        <option value="pantry">식료품 저장고 (Pantry - 요구 평판 15+): 겨울철 동면하여 봄으로 건너뛰기</option>
                        <option value="library">도서관 (Library - Summit 방문 및 동료 재회 완료): 질병 진단 시 2개 드로우 선택</option>
                        <option value="hive_boxes">벌집 보관함 (Hive Boxes - Spoolkeep 방문): 곤충 보관 및 교체</option>
                        <option value="gardens">약초 정원 (Gardens - Noonhill 방문): 식물 재배 및 질병당 1회 채취</option>
                        <option value="greenhouses">온실 (Greenhouses - 정원 보유 및 Glasswall 방문): 겨울에도 정원 채취 가능</option>
                        <option value="sodden_logs">물에 젖은 통나무 (Sodden Logs - Odoak 방문): 지정 곤충 채취 및 타이머 -1</option>
                        <option value="taproom">선술집 (Taproom - Vessel 방문): 계절 정산 시 약제소당 1 장신구 팁 수입</option>
                        <option value="hostel">숙소 (Hostel - 선술집 보유): 선술집 팁이 약제소당 2 장신구로 상승</option>
                        <option value="mailbox">우체통 (Mailbox - 요구사항 없음): Noonmessengers 서신 환자 진료</option>
                        <option value="goodwill_stand">친선 매대 (Goodwill Stand - 요구사항 없음): 아이템 기부하여 계절 정산 시 평판으로 변환</option>
                      </select>
                    </div>

                    {/* Requirements validation indicator */}
                    {(() => {
                      const activeServices = Array.from(new Set((state.clinics || []).map(c => c.agendaService)));
                      const isVisited = (loc: string) => (state.visitedLocations || []).includes(loc);

                      let satisfied = true;
                      let reqMsg = "";

                      if (selectedAgendaService === 'pantry') {
                        satisfied = state.reputation >= 15;
                        reqMsg = "길드 Reputation 15 이상 필요 (현재: " + state.reputation + ")";
                      } else if (selectedAgendaService === 'library') {
                        satisfied = isVisited('Summit') && !!state.completedReconnecting;
                        reqMsg = "Summit 방문 및 '동료들과 재회하기' 완료 필요 (Summit 방문: " + (isVisited('Summit') ? '✅' : '❌') + ", 재회 완료: " + (state.completedReconnecting ? '✅' : '❌') + ")";
                      } else if (selectedAgendaService === 'hive_boxes') {
                        satisfied = isVisited('Spoolkeep');
                        reqMsg = "Spoolkeep 방문 필요 (방문 여부: " + (isVisited('Spoolkeep') ? '✅' : '❌') + ")";
                      } else if (selectedAgendaService === 'gardens') {
                        satisfied = isVisited('Noonhill');
                        reqMsg = "Noonhill 방문 필요 (방문 여부: " + (isVisited('Noonhill') ? '✅' : '❌') + ")";
                      } else if (selectedAgendaService === 'greenhouses') {
                        satisfied = activeServices.includes('gardens') && isVisited('Glasswall');
                        reqMsg = "정원 서비스 구축 및 Glasswall 방문 필요 (정원 서비스: " + (activeServices.includes('gardens') ? '✅' : '❌') + ", Glasswall 방문: " + (isVisited('Glasswall') ? '✅' : '❌') + ")";
                      } else if (selectedAgendaService === 'sodden_logs') {
                        satisfied = isVisited('Odoak');
                        reqMsg = "Odoak 방문 필요 (방문 여부: " + (isVisited('Odoak') ? '✅' : '❌') + ")";
                      } else if (selectedAgendaService === 'taproom') {
                        satisfied = isVisited('Vessel');
                        reqMsg = "Vessel 방문 필요 (방문 여부: " + (isVisited('Vessel') ? '✅' : '❌') + ")";
                      } else if (selectedAgendaService === 'hostel') {
                        satisfied = activeServices.includes('taproom');
                        reqMsg = "선술집(Taproom) 구축 필요 (구축 여부: " + (activeServices.includes('taproom') ? '✅' : '❌') + ")";
                      }

                      const hasTrinkets = state.trinkets.length >= 15;
                      const hasDays = (state.cumulativeDays || 0) >= 120;

                      return (
                        <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ color: satisfied ? '#047857' : '#d97706', fontWeight: 'bold' }}>
                            📌 서비스 요구사항: {reqMsg || "없음 (즉시 건설 가능) ✅"}
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#4b5563' }}>
                            <span>💰 장신구 15개 소지: {hasTrinkets ? '✅' : '❌ (장신구 부족)'}</span>
                            <span>📅 누적 시간 120일 경과: {hasDays ? '✅' : '❌ (미달 - 프로필에서 수정 가능)'}</span>
                          </div>

                          <button
                            onClick={() => handleBuildClinic(selectedAgendaService)}
                            disabled={!satisfied || !hasTrinkets || !hasDays}
                            style={{
                              marginTop: '0.6rem',
                              padding: '0.6rem 1.2rem',
                              background: (satisfied && hasTrinkets && hasDays) ? '#059669' : '#a7f3d0',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              cursor: (satisfied && hasTrinkets && hasDays) ? 'pointer' : 'not-allowed'
                            }}
                          >
                            🏡 약제소 설립 및 아젠다 지정 (🪙 15 Trinkets 소모)
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                  {TOOLS_DB.map(tool => {
                    const hasTool = state.bag.some(item => item.name.includes(tool.name.split(' (')[0]));
                    const isAvailable = bypassShopRules ||
                      tool.places === 'Any' ||
                      (tool.places.includes('Settlements') && state.currentLocationType === 'Settlement') ||
                      (tool.places.includes('Spoolkeep') && state.currentLocationName === 'Spoolkeep') ||
                      (tool.places.includes('Noonhill') && state.currentLocationName === 'Noonhill') ||
                      (tool.places.includes('Odoak') && state.currentLocationName === 'Odoak') ||
                      (tool.places.includes('Loch Settlements') && state.currentLocationType === 'Settlement' && state.currentRegion === 'Loch');

                    return (
                      <div key={tool.id} style={{ border: '1px solid #e5dec9', borderRadius: '8px', padding: '0.8rem', background: isAvailable ? '#fff' : '#f9f6f0', opacity: isAvailable ? 1 : 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>
                          <span>{tool.name}</span>
                          <span style={{ color: 'var(--secondary)' }}>🪙 {tool.cost}개</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          무게: {formatWeight(tool.weight)} | 판매지: {tool.places}
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
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🛠️ 철공소 도구 업그레이드 (Smithing)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  산맥 정착지나 모든 도시(City)에서 <strong>3 장신구</strong>를 지불하고 기본 도구를 업그레이드합니다.
                </p>

                {state.currentLocationType !== 'City' && state.currentRegion !== 'Mountain' && !bypassShopRules ? (
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
                            <option key={idx} value={item.id}>{item.name}</option>
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
                          <option value="강철 도끼 (Steel Axe)">강철 도끼 (Steel Axe - 칼 업그레이드, 무게 1, 질병 진단 시 +3 FP)</option>
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
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.1rem' }}>🚚 마차 개조 및 확장 (Wagon Upgrades)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  <strong>모든 도시(City)</strong>에서 마차 기본 유닛을 주문(15 장신구)하거나 기존 마차를 업그레이드(장신구 소모)합니다.
                </p>

                {state.currentLocationType !== 'City' && !bypassShopRules ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                    ⚠️ 마차 개조 서비스는 도시(City)의 크래프트포(Craftpaws) 조각소에서만 가능합니다.
                  </div>
                ) : (
                  <div>
                    {!state.wagonExpansions?.baseUnit ? (
                      <div>
                        <button
                          onClick={() => handleBuyWagonUpgrade({ id: 'baseUnit', name: '기본 수레 (Base Unit)', cost: 15 })}
                          className="btn-cozy-secondary"
                          style={{ padding: '0.6rem 1.2rem' }}
                          disabled={state.trinkets.length < 15}
                        >
                          🚚 기본 마차 구매하기 (🪙 15 장신구 소모 | Carry +4, Speed +1)
                        </button>
                        {state.trinkets.length < 15 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.4rem', fontWeight: 'bold' }}>
                            ⚠️ 구매 불가: 장신구가 부족합니다. (필요: 15개, 보유: {state.trinkets.length}개)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem', marginTop: '0.5rem' }}>
                        {WAGON_UPGRADES_DB.filter(u => u.id !== 'baseUnit').map(upgrade => {
                          const hasUpgrade = (state.wagonExpansions as any)?.[upgrade.id];
                          const isWagonCity = bypassShopRules ||
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
                                개조 위치: {upgrade.city}
                              </div>
                              <p style={{ fontSize: '0.7rem', color: '#666', margin: '0.3rem 0 0.5rem 0', lineHeight: 1.3 }}>
                                {upgrade.desc}
                              </p>
                              <button
                                onClick={() => handleBuyWagonUpgrade(upgrade)}
                                className="btn-cozy-primary"
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem' }}
                                disabled={hasUpgrade || !isWagonCity || state.trinkets.length < finalCost}
                              >
                                {hasUpgrade ? '개조 완료됨' : !isWagonCity ? '이 도시에서 불가' : `🪙 ${finalCost}개에 개조하기`}
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

                {(!state.companions || state.companions.length === 0) ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    동반 중인 곤충 친구가 없습니다. 아래 상점에서 친구를 영입해 보세요!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {state.companions.map(comp => (
                      <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfaf6', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #eee' }}>
                        <div>
                          <strong style={{ color: 'var(--primary)' }}>{comp.koreanName} ({comp.name})</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>영입 위치: {comp.adoptedLocation}</span>
                        </div>
                        <button onClick={() => handleReleaseCompanion(comp.id)} className="btn-cozy-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
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
                  <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>🏪 곤충 시장 (Companion Market)</h3>
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
                  보유 장신구: <strong style={{ color: 'var(--primary)' }}>{state.trinkets.length}개</strong> | 동행 수 제한: {state.wagonExpansions?.hiveBrackets ? '최대 2마리' : '최대 1마리'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
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
                          영입 가능 도시 지역: {comp.region}
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
                            ⚠️ 영입 불가: {comp.region} 대도시(City)에서만 영입 가능합니다. (현재: {state.currentRegion} {state.currentLocationType === 'City' ? '대도시' : '일반 지형'})
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
            <div className="cute-card" style={{ background: '#fffefa', border: '1.5px solid var(--secondary)', borderRadius: '7px', padding: '1.5rem' }}>
              <h2 style={{ color: 'var(--secondary)', margin: '0 0 0.4rem 0', fontFamily: 'var(--font-fancy)' }}>새로운 여정 떠나기</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1.2rem 0' }}>
                Bristley Woods 지도를 열고 어디로 가야할 지, 이번 여행의 목적지는 어디일지 의도를 설정합니다.
              </p>

              <form onSubmit={handleStartJourney} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>도착 목표 정착지/도시 명칭:</label>
                  <input
                    type="text"
                    placeholder="예: Odoak (숲 도시), Glasswall (산맥 도시)"
                    value={destName}
                    onChange={e => setDestName(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ padding: '0.8rem', background: 'var(--secondary)', color: '#fff', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
                >
                  목적지 카드 드로우 및 여행 출발
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
          <div className="cute-card journey-record" style={{ background: '#fffefa', borderColor: 'var(--primary)' }}>
            <h2 style={{ color: 'var(--primary)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>활성화된 방랑 여정 기록</span>
              <button
                onClick={handleEndJourney}
                style={{ padding: '0.4rem 0.8rem', background: 'var(--secondary)', color: '#fff', borderRadius: '20px', fontSize: '0.85rem' }}
              >
                여정 도착지 도달 (마감)
              </button>
            </h2>
            <div className="grid-2col" style={{ marginTop: '1rem', fontSize: '0.95rem', gap: '1.5rem' }}>
              <div>
                <strong>목적지:</strong> {state.journeyDestination} ({state.journeyDistance}) <br />
                <strong>방향:</strong> {state.journeyDirection} <br />
                <strong>현재 누적 경과일:</strong> {state.calendarDays} / {state.calendarMaxDays} 일
              </div>
              <div style={{ background: '#ffffff', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <strong>여정 수행 목표: {state.journeyGoalTitle}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{state.journeyGoalDesc}</p>
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>수행 과제: {state.journeyGoalProgress}</div>
              </div>
            </div>

            {/* 여정 목표 세부 진행 상태 및 조절기 */}
            <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>목표 진행 세부 사항 (자동/수동 추적)</span>
                <span style={{ fontSize: '0.8rem', color: checkJourneyGoalSatisfaction(state) ? '#16a34a' : '#ea580c', fontWeight: 'bold' }}>
                  {checkJourneyGoalSatisfaction(state) ? '✅ 조건 충족됨' : '⚠️ 미달성 상태'}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>
                  <strong>현재 상태: </strong>
                  {state.journeyGoalTitle === '자아 성찰' && `만난 야수 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {state.journeyGoalTitle === '관계 회복' && `해결한 저널 일지 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {state.journeyGoalTitle === '길드의 책임' && `시작 평판: ${state.journeyStartReputation || 5} → 현재 평판: ${state.reputation} (+5 이상 증가 또는 평판 10 도달 필요)`}
                  {state.journeyGoalTitle === '자연 환경 조사' && `조사한 지역 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {state.journeyGoalTitle === '긴급 치료' && (
                    state.bag.some(item => {
                      if (item.type !== 'reagent' || !item.name) return false;
                      const match = /\[(WOUND|INFECTION|SLEEP)\s+(\d+)\]/i.exec(item.name);
                      return match !== null && parseInt(match[2]) >= 3;
                    }) ? '가방에 WOUND/INFECTION/SLEEP이 3 이상인 약재 보유 중! (충족)' : '가방에 WOUND/INFECTION/SLEEP이 3 이상인 약재 없음 (미충족)'
                  )}
                  {state.journeyGoalTitle === '신선한 영감' && `발견한 새로운 지역 수: ${new Set(state.journeyGoalChecklist || []).size} / 6 (${Array.from(new Set(state.journeyGoalChecklist || [])).join(', ') || '없음'})`}
                  {state.journeyGoalTitle === '의학 연구 자료' && `치료한 야수 질병 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {state.journeyGoalTitle === '호송 및 정의' && (
                    state.bag.some(item => item.name.includes("Evidence") || item.name.includes("수송 증거물")) ? '가방에 수송 증거물(Evidence) 보유 중! (충족)' : '가방에 수송 증거물(Evidence) 분실함! (미충족)'
                  )}
                  {state.journeyGoalTitle === '영약 보충' && '가방 내의 어떤 태그 약재든 3개 이상 모아야 합니다.'}
                  {state.journeyGoalTitle === '마음의 정리' && `해결한 질병/일지 수: ${(state.journeyGoalCounter || 0)} / 3`}
                  {state.journeyGoalTitle === '마지막 작별' && (
                    state.bag.some(item => {
                      if (item.type !== 'reagent' || !item.name) return false;
                      const match = /\[ELSEWHERE\s+(\d+)\]/i.exec(item.name);
                      return match !== null && parseInt(match[2]) >= 2;
                    }) ? '가방에 ELSEWHERE가 2 이상인 약재 보유 중! (충족)' : '가방에 ELSEWHERE가 2 이상인 약재 없음 (미충족)'
                  )}
                  {state.journeyGoalTitle === '방랑벽' && `방문한 독특한 지역 종류 수: ${new Set(state.journeyGoalChecklist || []).size} / 5 (${Array.from(new Set(state.journeyGoalChecklist || [])).join(', ') || '없음'})`}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>진행도(카운터) 수동 제어:</span>
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
                    ➕ 진행도 올리기
                  </button>
                </div>

                {(state.journeyGoalTitle === '신선한 영감' || state.journeyGoalTitle === '방랑벽') && (
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
                          <option key={r} value={r}>{r}</option>
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

            {/* Tangible Effects — rulebook p.39: permanent consequences after journey */}
            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fff8ee', borderRadius: '8px', border: '1px dashed #d4a853' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#8b5e1a', marginBottom: '0.5rem' }}>
                ✨ 영구적 결과 (Tangible Effects, p.39) — 여정 종료 후 아래에서 선택 적용:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => { if(confirm('이동 속도 +1 영구 적용?')) updateState((s: GameState) => ({ ...s, bio: { ...s.bio, speed: s.bio.speed + 1 } })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer' }}>
                  🦶 속도 +1
                </button>
                <button onClick={() => { if(confirm('가방 소지 한도 +1 영구 적용?')) updateState((s: GameState) => ({ ...s, bio: { ...s.bio, carry: s.bio.carry + 1 } })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer' }}>
                  🎒 용량 +1
                </button>
                <button onClick={() => { if(confirm('길드 평판 +5?')) updateState((s: GameState) => ({ ...s, reputation: s.reputation + 5 })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer' }}>
                  ⭐ 평판 +5
                </button>
                <button onClick={() => { if(confirm('길드 평판 -5?')) updateState((s: GameState) => ({ ...s, reputation: Math.max(0, s.reputation - 5) })); }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>
                  📉 평판 -5
                </button>
                <button onClick={() => {
                  const toolName = prompt('지도에서 추가할 정착지 이름을 입력하세요:');
                  if (toolName) alert(`'${toolName}' 정착지를 지도에 표시하세요. (지도는 직접 기록)`);
                }}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer' }}>
                  🏘️ 정착지 추가
                </button>
                <button onClick={handleRetireClick}
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', background: '#fdf4ff', border: '1px solid #d8b4fe', borderRadius: '6px', cursor: 'pointer' }}>
                  🌅 캐릭터 은퇴
                </button>
              </div>
            </div>
          </div>

          {/* Current location and movement form */}
          <div className="cute-card">
            <h3>📍 현재 머무는 곳: <span style={{ color: 'var(--primary)' }}>{state.currentLocationName}</span></h3>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <span>지역: <strong>{state.currentRegion}</strong></span>
              <span>지형 종류: <strong>{state.currentLocationType}</strong></span>
              <span>계절:
                <select
                  value={localSeason}
                  onChange={e => setLocalSeason(e.target.value as any)}
                  style={{ height: '30px', padding: '0 0.5rem', fontSize: '0.85rem', marginLeft: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="Spring">🌸 봄 (Spring)</option>
                  <option value="Summer">☀️ 여름 (Summer)</option>
                  <option value="Autumn">🍂 가을 (Autumn)</option>
                  <option value="Winter">❄️ 겨울 (Winter)</option>
                </select>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (localSeason === state.currentSeason) {
                    alert("전환할 새로운 계절을 선택해주세요.");
                    return;
                  }
                  if (confirm(`🍂 현재 계절(${state.currentSeason})에서 [${localSeason}] 계절로 전환하면서 약제소 및 기부 정산을 진행하시겠습니까?`)) {
                    handleSettleSeasonTipsAndDonations(localSeason);
                  }
                }}
                className="btn-cozy-secondary"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', marginLeft: '10px' }}
              >
                🍂 계절 정산 및 전환하기
              </button>
            </div>

            {/* Travel Form */}
            <form onSubmit={handleTravelMove} className="grid-travel-form" style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
              <input
                name="locName"
                type="text"
                placeholder="이동해 도달할 새 장소 이름..."
                value={nextLocName}
                onChange={e => setNextLocName(e.target.value)}
              />

              <select value={destRegion} onChange={e => setDestRegion(e.target.value)}>
                <option value="Forest">🌿 Forest (숲)</option>
                <option value="Meadow">🌾 Meadow (초원)</option>
                <option value="Loch">💧 Loch (호수/강)</option>
                <option value="Bog">🪵 Bog (수렁)</option>
                <option value="Mountain">🏔️ Mountain (산맥)</option>
                <option value="Titan">⚙️ Titan (티탄 유적)</option>
                <option value="Soar">🦅 Soar (비행 하늘)</option>
              </select>

              <select value={destType} onChange={e => setDestType(e.target.value)}>
                <option value="Wilds">야생 (Wilds)</option>
                <option value="Settlement">정착지 (Settlement)</option>
                <option value="City">대도시 (City)</option>
                <option value="Ruin">유적지 (Ruin)</option>
                <option value="Barrow">야수 고분 (Barrow)</option>
              </select>

              <button type="submit" style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>
                🚶‍♂️ 경로 이동 및 카드 조우
              </button>

              <div style={{ gridColumn: 'span 4', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', background: '#faf8f5', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '1rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={isWaterway} onChange={e => setIsWaterway(e.target.checked)} />
                  💧 수로(Waterway) 물길 이동
                </label>
                <strong>🃏 조우 드로우 방식:</strong>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input type="radio" checked={travelCardMode === 'random'} onChange={() => setTravelCardMode('random')} />
                  🎲 랜덤 드로우 (무작위)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input type="radio" checked={travelCardMode === 'manual'} onChange={() => setTravelCardMode('manual')} />
                  🎴 수동 카드 선택
                </label>
                {travelCardMode === 'manual' && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', alignItems: 'center' }}>
                    <span>문양:</span>
                    <select value={selectedTravelSuit} onChange={e => setSelectedTravelSuit(e.target.value)} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                      <option value="♥">하트 ♥ (북쪽)</option>
                      <option value="♦">다이아 ♦ (남쪽)</option>
                      <option value="♣">클로버 ♣ (동쪽)</option>
                      <option value="♠">스페이드 ♠ (서쪽)</option>
                    </select>
                    <span>값:</span>
                    <select value={selectedTravelValue} onChange={e => setSelectedTravelValue(Number(e.target.value))} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                      <option value={1}>A (Ace)</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                      <option value={7}>7</option>
                      <option value={8}>8</option>
                      <option value={9}>9</option>
                      <option value={10}>10</option>
                      <option value={11}>J (Jack)</option>
                      <option value={12}>Q (Queen)</option>
                      <option value={13}>K (King)</option>
                    </select>
                  </div>
                )}
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
                      updateState((s: GameState) => ({
                        ...s,
                        pursuedByBehemoth: null,
                        bag: (() => { let r = false; return s.bag.filter(i => { if (!r && (i.id === 'tool_bolts' || i.name.includes('볼트'))) { r = true; return false; } return true; }); })(),
                        journals: [{ id: 'escape_cb_' + Date.now(), title: '🏹 석궁으로 탈출!', text: '석궁 볼트를 사용해 추격을 뿌리쳤습니다! 볼트 1개 소비.', timestamp: Date.now() }, ...s.journals]
                      }));
                      alert('🏹 석궁으로 탈출 성공! 추격이 끝났습니다.');
                    }}
                    style={{ padding: '0.6rem 1.2rem', background: '#d94141', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                  >
                    🏹 석궁으로 도망치기 (볼트 소비)
                  </button>
                )}
                {/* Cranky Contraption escape */}
                {state.bag.some(i => i.name.toLowerCase().includes('cranky') || i.name.includes('기계 장치')) && (
                  <button
                    onClick={() => {
                      updateState((s: GameState) => ({
                        ...s,
                        pursuedByBehemoth: null,
                        bag: s.bag.filter(i => !i.name.toLowerCase().includes('cranky') && !i.name.includes('기계 장치')),
                        journals: [{ id: 'escape_cc_' + Date.now(), title: '⚙️ 기계 장치로 탈출!', text: '괴상한 기계 장치를 사용해 추격을 뿌리쳤습니다! 장치 소비.', timestamp: Date.now() }, ...s.journals]
                      }));
                      alert('⚙️ 기계 장치로 탈출 성공! 추격이 끝났습니다.');
                    }}
                    style={{ padding: '0.6rem 1.2rem', background: '#7c5cbf', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                  >
                    ⚙️ 기계 장치로 도망치기
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('탈출 도구 없이 버텼다면 주의하세요. 현재 추격 상태를 기록하고 계속 이동합니까?')) {
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
          {!delveActive && (state.barrows || []).some(b => b.locationName === state.currentLocationName) && !state.pursuedByBehemoth && (() => {
            const barrow = (state.barrows || []).find(b => b.locationName === state.currentLocationName)!;
            const classLabel: Record<string, string> = { Towering: '거대형 (Towering)', Many: '군집형 (Many)', Violent: '포악형 (Violent)', Demanding: '까다로운 (Demanding)' };
            return (
              <div className="cute-card" style={{ background: '#fdf6eb', border: '2.5px solid #c8873a', borderRadius: '12px', padding: '1.2rem' }}>
                <h3 style={{ color: '#c8873a', margin: '0 0 0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🗿 거수 고분 발견!</span>
                </h3>
                <div style={{ background: '#fff8ee', borderRadius: '8px', padding: '0.8rem', marginBottom: '0.8rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <strong style={{ fontSize: '1.05rem', color: '#7a4a10' }}>「{barrow.name}」</strong><br />
                  <span style={{ color: '#888' }}>유형: {classLabel[barrow.behemothClass] || barrow.behemothClass} · 지역: {barrow.region} · {barrow.direction}</span>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#666' }}>
                  이 장소에서는 질병 치료 대신 <strong>고분 탐험(Delve)</strong>을 진행할 수 있습니다. 탐험을 포기하고 하루를 기다리거나, 용기를 내어 카드를 뽑아 어떤 도전이 기다리는지 확인하세요.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button
                    onClick={handleFleeToSafety}
                    style={{ flex: 1, padding: '0.7rem', background: '#eee', color: '#555', border: '1.5px solid #ccc', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🏃 피해 도망치기 (+1일, 다음 속도 1)
                  </button>
                  <button
                    onClick={handleStartDelve}
                    style={{ flex: 1, padding: '0.7rem', background: '#c8873a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ⚔️ 고분 탐험 시작하기 (카드 드로우)
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              ACTIVE DELVE CHALLENGE SCREENS
             ================================================================ */}
          {delveActive && state.activeDelve && (() => {
            const delve = state.activeDelve!;
            const challengeNames: Record<string, string> = {
              UneasySleep: '불면의 잠 (Uneasy Sleep)',
              CollapsedEntrance: '무너진 입구 (Collapsed Entrance)',
              BelliesOfMany: '군집의 연회 (The Bellies of Many)',
              InsideJob: '내부 소행 (Inside Job)',
              PotentPoison: '강력한 독 (Potent Poison)',
              StealEverything: '몰래 훔치기 (Pilfer Unnoticed)',
              BuildingTrust: '신뢰 구축 (Building Trust)',
              SuitableFurnishings: '적절한 가구 (Suitable Furnishings)'
            };

            return (
              <div className="cute-card" style={{ background: '#f5f0ff', border: '2.5px solid #7c5cbf', borderRadius: '12px', padding: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div>
                    <h3 style={{ color: '#7c5cbf', margin: 0 }}>⚔️ {challengeNames[delveChallenge] || delveChallenge}</h3>
                    <div style={{ fontSize: '0.82rem', color: '#999', marginTop: '0.2rem' }}>드로우 문양: {delveDrawnSuit} · 고분: {delve.behemothName}</div>
                  </div>
                  <button onClick={handleAbortDelve} style={{ padding: '0.3rem 0.7rem', background: '#eee', color: '#888', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✕ 취소</button>
                </div>

                {/* UNEASY SLEEP */}
                {delveChallenge === 'UneasySleep' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      🌙 <strong>수면 향로 제조 (Soporific Incense)</strong><br />
                      거수가 자고 있는 동안 [SLEEP 6]을 채울 수 있는 약재를 모아 잠을 유지시키세요.<br />
                      타이머: 4시간 제한 · <strong>현재: {delveTimer}시간 경과</strong>
                    </div>
                    <div style={{ background: '#faf0ff', borderRadius: '8px', padding: '0.8rem', fontSize: '0.85rem', color: '#666' }}>
                      💡 채집 시도마다 타이머가 1씩 올라갑니다. 4에 도달하면 거수가 깨어나 추격이 시작됩니다!
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handleUneasySleepForage}
                        disabled={delveTimer >= 4}
                        style={{ flex: 1, padding: '0.7rem', background: delveTimer >= 4 ? '#eee' : '#7c5cbf', color: delveTimer >= 4 ? '#aaa' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: delveTimer >= 4 ? 'not-allowed' : 'pointer' }}
                      >
                        🌿 약재 채집 시도 (+1 타이머)
                      </button>
                      <button
                        onClick={handleUneasySleepSucceed}
                        style={{ flex: 1, padding: '0.7rem', background: '#3d824d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ✅ 수면 향 완성! (성공 처리)
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
                      성공 보상: 장신구 × (소지한도 × 3)개 획득 + 달력 +1일
                    </div>
                  </div>
                )}

                {/* COLLAPSED ENTRANCE */}
                {delveChallenge === 'CollapsedEntrance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      ⛏️ <strong>활력 차(Invigorating Tea) 제조 & 발굴 지원</strong><br />
                      카드를 뽑아 채집 포인트(FP)를 얻으며 구역을 발굴하세요.<br />
                      현재: <strong>FP {delveFP}</strong> · 타이머: {delveTimer}턴
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {[
                        { label: '현관 (15 FP) — 장신구 1', reached: delveFP >= 15, color: '#e0993a' },
                        { label: '식당 (30 FP) — 평판 +5', reached: delveFP >= 30, color: '#3d824d' },
                        { label: '침실 (50 FP) — 장신구 10', reached: delveFP >= 50, color: '#7c5cbf' }
                      ].map(m => (
                        <div key={m.label} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', background: m.reached ? m.color : '#eee', color: m.reached ? '#fff' : '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {m.reached ? '✅' : '○'} {m.label}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handleDelveDrawCard}
                        style={{ flex: 1, padding: '0.7rem', background: '#c8873a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🃏 카드 드로우 (+FP, +타이머)
                      </button>
                      <button
                        onClick={handleCollapsedFarewell}
                        style={{ flex: 1, padding: '0.7rem', background: '#eee', color: '#555', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        👋 작별 인사 (탐험 종료, 타이머÷4 = 소모 일수)
                      </button>
                    </div>
                  </div>
                )}

                {/* STEAL EVERYTHING (Pilfer Unnoticed) — blackjack */}
                {delveChallenge === 'StealEverything' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      🃏 <strong>몰래 훔치기 (블랙잭 미니게임)</strong><br />
                      카드를 뽑아 합계를 올리되, 21을 초과하면 잡힙니다! 언제든 멈추고 탈출할 수 있습니다.<br />
                      현재 합계: <strong style={{ fontSize: '1.5rem', color: blackjackCards.reduce((a,b)=>a+b,0) > 18 ? '#d94141' : '#333' }}>
                        {blackjackCards.reduce((a,b)=>a+b,0)}
                      </strong>
                      {blackjackCards.length > 0 && <span style={{ fontSize: '0.82rem', color: '#888', marginLeft: '0.5rem' }}>
                        ({blackjackCards.join(' + ')})
                      </span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handleBlackjackHit}
                        disabled={blackjackStanding}
                        style={{ flex: 1, padding: '0.7rem', background: '#c8873a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: blackjackStanding ? 'not-allowed' : 'pointer' }}
                      >
                        🃏 카드 한 장 더 (Hit)
                      </button>
                      <button
                        onClick={handleBlackjackStand}
                        disabled={blackjackStanding || blackjackCards.length === 0}
                        style={{ flex: 1, padding: '0.7rem', background: '#3d824d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (blackjackStanding || blackjackCards.length === 0) ? 'not-allowed' : 'pointer' }}
                      >
                        🚪 탈출 (Stand) — 장신구 {Math.floor(blackjackCards.reduce((a,b)=>a+b,0)/2)}개
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
                      21 정확히 = 장신구 15 + 도구 교환권 · 21 미만 탈출 = 합계÷2 장신구 · 21 초과 = 탈출 도구 필요!
                    </div>
                  </div>
                )}

                {/* BELLIES OF MANY */}
                {delveChallenge === 'BelliesOfMany' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      🍖 <strong>연회 음식 제조 (Silent Service)</strong><br />
                      [JOY 2, STOMACH 2, STOMACH 2, NERVES 2, SENSES 3, MOOD 2]를 만족하는 약재들로 연회를 준비하세요.<br />
                      타이머 제한: 12 · <strong>현재: {delveTimer} 경과</strong>
                    </div>
                    <div style={{ background: '#fff8ee', borderRadius: '8px', padding: '0.7rem', fontSize: '0.85rem' }}>
                      필요 태그: <strong>[기쁨 2, 위장 2×2, 신경 2, 감각 3, 기분 2]</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handleBelliesForage}
                        style={{ flex: 1, padding: '0.7rem', background: '#c8873a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🌿 약재 채집/거래 시도 (+1 타이머)
                      </button>
                      <button
                        onClick={handleBelliesComplete}
                        style={{ flex: 1, padding: '0.7rem', background: '#3d824d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🍽️ 연회 완성! (성공 처리)
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>성공 보상: 티탄 탐지 기계 획득 (무게 1)</div>
                  </div>
                )}

                {/* INSIDE JOB */}
                {delveChallenge === 'InsideJob' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      🕵️ <strong>나쁜 음료 제조 (Nefarious Concoction)</strong><br />
                      [SLEEP 4, FOUL 8]을 충족하는 약재를 모아 거수의 비밀 임무를 도와주세요.<br />
                      타이머: 채집 시도마다 +1, 10 도달 시 실패<br />
                      <strong>현재: {delveTimer} / 10</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handleInsideJobForage}
                        style={{ flex: 1, padding: '0.7rem', background: '#555', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🌿 채집/거래 시도 (+1 타이머)
                      </button>
                      <button
                        onClick={handleInsideJobComplete}
                        style={{ flex: 1, padding: '0.7rem', background: '#3d824d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🍺 음료 완성! (성공 처리)
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>성공 보상: 장신구 20개</div>
                  </div>
                )}

                {/* POTENT POISON */}
                {delveChallenge === 'PotentPoison' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      ☠️ <strong>강력한 독 제조 (Potent Poison)</strong><br />
                      용병들을 위해 아래 7가지 약재를 4시간 안에 구해주세요:<br />
                      흑가시(슬로베리), 가짜 독버섯(살점), 호아하운드(잎), 쑥(잎), 쐐기풀(잎), 두꺼비 독, 말벌(독)<br />
                      <strong>채집한 약재: {delveFP}/7개 · 타이머: {delveTimer}시간 남음</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handlePotentPoisonForage}
                        disabled={delveTimer <= 0}
                        style={{ flex: 1, padding: '0.7rem', background: delveTimer <= 0 ? '#eee' : '#d94141', color: delveTimer <= 0 ? '#aaa' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: delveTimer <= 0 ? 'not-allowed' : 'pointer' }}
                      >
                        🌿 약재 채집 시도 (+1 약재, 타이머 -1)
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>타이머 만료 시 카드 드로우: 카드 + (약재수×2) ≥ 9 = 성공 / 실패 = 달력 +1일</div>
                  </div>
                )}

                {/* BUILDING TRUST */}
                {delveChallenge === 'BuildingTrust' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      🤝 <strong>신뢰의 힘 (The Strength of a Union)</strong><br />
                      고분 거주민들에게 길드의 가치를 증명하세요. <strong>보통(Moderate) 수준</strong>의 질병 환자를 치료하면 됩니다.<br />
                      아래의 <strong>환자 약제소</strong>에서 진단하고 치료제를 만드세요.
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '0.7rem', fontSize: '0.85rem', color: '#3d824d' }}>
                      ✅ 성공 시: 장신구 대신 <strong>같은 양의 평판</strong> 획득 + 고분이 <strong>정착지(Settlement)</strong>로 전환
                    </div>
                    <div style={{ background: '#fff2f2', borderRadius: '8px', padding: '0.7rem', fontSize: '0.85rem', color: '#d94141' }}>
                      ❌ 실패 시: 고분 거주민들이 이사 → 고분 지도에서 제거 + 달력 +1일
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handleBuildingTrustSuccess}
                        disabled={!state.activeAilment}
                        style={{ flex: 1, padding: '0.7rem', background: state.activeAilment ? '#3d824d' : '#eee', color: state.activeAilment ? '#fff' : '#aaa', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: state.activeAilment ? 'pointer' : 'not-allowed' }}
                      >
                        🏡 치료 완료! 정착지로 전환 (평판 획득)
                      </button>
                      <button
                        onClick={handleBuildingTrustFail}
                        style={{ flex: 1, padding: '0.7rem', background: '#d94141', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ❌ 치료 실패 (고분 제거 + 달력 +1일)
                      </button>
                    </div>
                    {!state.activeAilment && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <button
                          onClick={handleDiagnoseBuildingTrust}
                          style={{ width: '100%', padding: '0.7rem', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          🏥 고분 환자 진단하기 (Moderate/보통 수준 질병)
                        </button>
                        <div style={{ fontSize: '0.82rem', color: '#888', fontStyle: 'italic' }}>진단 후 치료제를 완성해야 성공 버튼이 활성화됩니다</div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUITABLE FURNISHINGS */}
                {delveChallenge === 'SuitableFurnishings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      🏡 <strong>새 보금자리 만들기 (Making a House into a Home)</strong><br />
                      카드 5장을 드로우해 목표 희귀도를 설정하고, 해당 희귀도의 약재를 순서대로 구해주세요.<br />
                      <strong>타이머: {delveTimer} · 20 이전 완료하면 더 많은 보상!</strong>
                    </div>
                    {state.activeDelve?.requiredReagents && state.activeDelve.requiredReagents.length > 0 && (
                      <div style={{ background: '#fff8ee', borderRadius: '8px', padding: '0.7rem', fontSize: '0.85rem' }}>
                        🎯 목표 희귀도: {state.activeDelve.requiredReagents.join(' → ')}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {!state.activeDelve?.requiredReagents?.length && (
                        <button
                          onClick={handleSuitableFurnishingsDrawTargets}
                          style={{ flex: 1, padding: '0.7rem', background: '#7c5cbf', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          🃏 카드 5장 드로우 (목표 설정)
                        </button>
                      )}
                      {!!state.activeDelve?.requiredReagents?.length && (
                        <button
                          onClick={handleSuitableFurnishingsForage}
                          style={{ flex: 1, padding: '0.7rem', background: '#c8873a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          🌿 채집/거래 시도 (+1 타이머)
                        </button>
                      )}
                      {!!state.activeDelve?.requiredReagents?.length && (
                        <button
                          onClick={handleSuitableFurnishingsComplete}
                          style={{ flex: 1, padding: '0.7rem', background: '#3d824d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✅ 모든 재료 완료!
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      타이머 &lt;10 = 장신구 10 + 평판 5 · &lt;20 = 장신구 7 · 20이상 = 장신구 1
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. Ailment Patient Care Section */}
          <div className="cute-card" style={{ border: '1.5px solid var(--accent-purple)' }}>

            <h3 style={{ color: 'var(--accent-purple)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{state.scroungingMode ? '🔍 여분 채집 (Scrounging)' : '🤒 환자 약제소 (Patient Clinic)'}</span>
              {state.scroungingMode ? (
                <span style={{ fontSize: '0.9rem', color: '#d97706' }}>⏱️ 여분 시간: <strong>{state.scroungingTimer} 시간 남음</strong></span>
              ) : state.activeAilment ? (
                <span style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>⏱️ 치료 완료 기한: <strong>{state.activeAilment.timer} 시간 남음</strong></span>
              ) : null}
            </h3>

            {state.scroungingMode ? (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  🎉 환자 치료에 성공했습니다! 남은 치료 시간 동안 주변 지역에서 여분 채집(Scrounging)을 진행해 약초를 추가로 얻을 수 있습니다.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {/* Action 1: Forage Current Location (1 Hour) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf8f5', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>1. 현재 위치 채집</strong> (1시간 소모)
                      <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>현재 지역({state.currentRegion})에서 카드 드로우 채집 및 조우를 진행합니다.</div>
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
                          {['Forest', 'Meadow', 'Loch', 'Bog', 'Mountain', 'Titan'].filter(r => r !== state.currentRegion).map(r => (
                            <option key={r} value={r}>{r}</option>
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
                      <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>현재 지역({state.currentRegion}) 자생 약재 중 준비법의 최대 효능이 2 이하인 약재를 즉시 1개 획득합니다.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                      {(() => {
                        const eligible = GAME_DATA.reagents.filter(r => r.regions.includes(state.currentRegion) && isReagentPotencyTwoOrLess(r));
                        if (eligible.length === 0) return <span style={{ fontSize: '0.78rem', color: '#aaa', fontStyle: 'italic' }}>대상 약재 없음</span>;
                        return eligible.map(r => (
                          <button
                            key={r.name}
                            onClick={() => handleScroungeGainReagent(r.name, 3)}
                            disabled={(state.scroungingTimer || 0) < 3}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            🌿 {r.name}
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
                        value={scroungeReagentRegion}
                        onChange={e => setScroungeReagentRegion(e.target.value)}
                        style={{ padding: '0.25rem', fontSize: '0.8rem' }}
                      >
                        {['Forest', 'Meadow', 'Loch', 'Bog', 'Mountain', 'Titan'].filter(r => r !== state.currentRegion).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                      {(() => {
                        const eligible = GAME_DATA.reagents.filter(r => r.regions.includes(scroungeReagentRegion) && isReagentPotencyTwoOrLess(r));
                        if (eligible.length === 0) return <span style={{ fontSize: '0.78rem', color: '#aaa', fontStyle: 'italic' }}>대상 약재 없음</span>;
                        return eligible.map(r => (
                          <button
                            key={r.name}
                            onClick={() => handleScroungeGainReagent(r.name, 4)}
                            disabled={(state.scroungingTimer || 0) < 4}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            🌿 {r.name}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem', background: '#faf9f5', border: '1px solid #dcd3c1', padding: '1.1rem', borderRadius: '8px' }}>
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
                            🕯️ {p.patientName || '가여운 이'}{p.species ? ` (${p.species})` : ''} — Day {p.resolvedAtDay || 0}
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
                  현재 돌보는 환자가 없습니다. 정착지나 야생에서 만난 환자의 질병을 도감에서 검색해 진단하세요.
                </p>
                <form onSubmit={handleDiagnoseAilment} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.8rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr)', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="질병 이름 입력 (예: 발썩음병, 귀 막힘증...)"
                      value={newAilmentName}
                      onChange={e => setNewAilmentName(e.target.value)}
                    />
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
                    진단 및 타이머 작동
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <div className="grid-patient-stats" style={{ borderBottom: '1px dashed var(--glass-border)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>{state.activeAilment.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2px' }}>등급: {state.activeAilment.severity.toUpperCase()}</div>
                    {(state.activeAilment.patientName || state.activeAilment.species || state.activeAilment.initialRememberedNote) && (
                      <div style={{ marginTop: '0.5rem', padding: '0.65rem', border: '1px dashed var(--glass-border)', background: '#fffefa', borderRadius: '4px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <div><strong>환자:</strong> {state.activeAilment.patientName || 'Anonymous patient'} {state.activeAilment.species ? ` / ${state.activeAilment.species}` : ''}</div>
                        {state.activeAilment.initialRememberedNote && (
                          <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>{state.activeAilment.initialRememberedNote}</div>
                        )}
                      </div>
                    )}
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', background: '#fcfaf6', padding: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                      {state.activeAilment.description}
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
                      🧺 <strong>누적 채집 포인트:</strong> <strong style={{ color: 'var(--primary)' }}>{state.activeAilment.foragingPoints} FP</strong>
                    </div>
                  </div>
                </div>

                {/* Foraging Drawing selector */}
                <div style={{ margin: '0.8rem 0', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', background: '#faf8f5', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', flexWrap: 'wrap', width: '100%' }}>
                  <strong>🃏 채집 드로우 방식:</strong>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input type="radio" checked={forageCardMode === 'random'} onChange={() => setForageCardMode('random')} />
                    🎲 랜덤 드로우 (무작위)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input type="radio" checked={forageCardMode === 'manual'} onChange={() => setForageCardMode('manual')} />
                    🎴 수동 카드 선택
                  </label>
                  {forageCardMode === 'manual' && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', alignItems: 'center' }}>
                      <span>문양:</span>
                      <select value={selectedForageSuit} onChange={e => setSelectedForageSuit(e.target.value)} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                        <option value="♥">하트 ♥</option>
                        <option value="♦">다이아 ♦</option>
                        <option value="♣">클로버 ♣</option>
                        <option value="♠">스페이드 ♠</option>
                      </select>
                      <span>값:</span>
                      <select value={selectedForageValue} onChange={e => setSelectedForageValue(Number(e.target.value))} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                        <option value={1}>A (Ace)</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                        <option value={7}>7</option>
                        <option value={8}>8</option>
                        <option value={9}>9</option>
                        <option value={10}>10</option>
                        <option value={11}>J (Jack)</option>
                        <option value={12}>Q (Queen)</option>
                        <option value={13}>K (King)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Foraging and Bartering buttons */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
                  <button
                    onClick={(e) => handleForageDraw(e)}
                    style={{ flex: 1, padding: '0.7rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: '8px', fontWeight: 'bold' }}
                  >
                    🌿 이 위치 채집 및 조우 (Draw Forage)
                  </button>

                  {/* Barter — show remaining attempts */}
                  {(() => {
                    const isCity = state.currentLocationType === 'City';
                    const isSettlement = state.currentLocationType === 'Settlement';
                    const maxBarters = isCity ? 3 : 1;
                    const usedBarters = state.barterCountThisAilment;
                    const remaining = Math.max(0, maxBarters - usedBarters);
                    const canBarter = (isCity || isSettlement) && remaining > 0;
                    return (
                      <button
                        onClick={() => {
                          const req = prompt("수소문하여 구매할 영약재 이름을 입력하세요 (예: 너도밤나무):");
                          if (req) handleBarterAttempt(req);
                        }}
                        disabled={!canBarter}
                        title={!isCity && !isSettlement ? '정착지/도시에서만 가능' : remaining === 0 ? '거래 횟수 초과' : ''}
                        style={{ flex: 1, padding: '0.7rem', background: canBarter ? 'var(--secondary-light)' : '#eee', color: canBarter ? 'var(--secondary)' : '#aaa', border: `1.5px solid ${canBarter ? 'var(--secondary)' : '#ccc'}`, borderRadius: '8px', fontWeight: 'bold', cursor: canBarter ? 'pointer' : 'not-allowed' }}
                      >
                        🤝 물꼬 거래 (Barter) {isCity || isSettlement ? `${remaining}/${maxBarters}회 남음` : '— 정착지/도시만 가능'}
                      </button>
                    );
                  })()}

                  <button
                    onClick={() => {
                      const req = prompt("발견(채집완료) 처리할 영약재 이름을 입력하세요 (예: 너도밤나무):");
                      if (req) handleCollectReagent(req);
                    }}
                    style={{ padding: '0.7rem 1rem', background: '#f5f5f5', color: '#555', borderRadius: '8px' }}
                  >
                    🧺 수작업 영약재 획득
                  </button>

                  <button
                    onClick={() => handlePassHour(1)}
                    style={{ padding: '0.7rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}
                  >
                    ⏱️ 1시간 흘려보내기
                  </button>
                </div>

                {/* Independent Familiar UI */}
                {(() => {
                  const familiarMechanic = FAMILIAR_BENEFITS.find(f => f.name === state.bio.familiarBenefit)?.mechanic || '';
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
                            {['Forest', 'Meadow', 'Loch', 'Bog', 'Mountain', 'Titan'].filter(r => r !== state.currentRegion).map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleIndependentForage(independentAdjRegion)}
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

                {/* FP 자동 획득 섹션 */}
                {state.activeAilment.foragingPoints > 0 && (
                  <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0369a1' }}>✨ 채집 포인트(FP) 소비 획득 (p.32)</strong>
                    <div style={{ fontSize: '0.8rem', color: '#0284c7', margin: '0.2rem 0 0.6rem 0' }}>
                      누적된 채집 포인트로 현재 지역({state.currentRegion})의 자생 약재를 확정 획득할 수 있습니다.
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(() => {
                        const localReagents = GAME_DATA.reagents.filter(r => r.regions.includes(state.currentRegion) || (state.resourcefulReagent && r.name === state.resourcefulReagent));
                        if (localReagents.length === 0) {
                          return <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>이 지역에서 자생하는 약재가 없습니다.</span>;
                        }
                        return localReagents.map(r => {
                          const finalRarity = calculateForageRarity(state, r);
                          const currentFP = state.activeAilment?.foragingPoints || 0;
                          const lastDraw = state.lastForageCardValue || 0;
                          const autoByStoredFP = currentFP >= finalRarity;
                          const cost = autoByStoredFP ? 0 : Math.max(0, finalRarity - lastDraw);
                          const canAfford = state.activeAilment.foragingPoints >= cost;
                          const label = autoByStoredFP
                            ? `FP 0소모, 희귀도 ${finalRarity} 자동`
                            : lastDraw > 0
                              ? `FP ${cost}소모 (카드 ${lastDraw}→희귀도 ${finalRarity})`
                              : `채집 카드 필요 (희귀도 ${finalRarity})`;
                          return (
                            <button
                              key={r.name}
                              onClick={() => handleAcquireReagentWithFP(r.name)}
                              disabled={!canAfford || (!autoByStoredFP && lastDraw <= 0)}
                              style={{
                                padding: '0.4rem 0.6rem',
                                fontSize: '0.8rem',
                                background: canAfford ? '#e0f2fe' : '#f3f4f6',
                                color: canAfford ? '#0369a1' : '#9ca3af',
                                border: `1px solid ${canAfford ? '#7dd3fc' : '#e5e7eb'}`,
                                borderRadius: '6px',
                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold'
                              }}
                            >
                              🌱 {r.name} ({label})
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Scrounging — rulebook p.37: spend remaining timer to forage extra reagents */}
                <div style={{ marginTop: '0.5rem', padding: '0.6rem', background: '#f9f5ee', border: '1px dashed #c9b68a', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <strong>🔍 여분 채집 (Scrounging, p.37)</strong> — 치료 완료 후 남은 타이머로 여분 약재 획득 가능.<br />
                  타이머 소비: 현재 위치 채집 1회, 인접 위치 채집 1회, 현재 위치 약재 1개(효능≤2), 인접 약재 1개(효능≤2).<br />
                  <span style={{ color: '#888' }}>* 치료제 완성 후 모든 타이머가 0 이상일 때만 사용 가능.</span>
                </div>

                {/* Concocting Remedy Panel */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1rem' }}>
                  <h4>🔬 치료제 조제하기 (Concoct Remedy)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                    가방 속 영약재들을 도구를 사용하여 가공한 뒤 환자의 증상을 치료해 치료제를 만듭니다.
                  </p>

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
                                    setSelectedBagItems(nextSelected);
                                    alert(`🧪 [처방 자동 조립]\n가방 속 약재 [${recipe.join(', ')}]을(를) 조제 슬롯에 조립했습니다!`);
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

                  <div className="grid-2col" style={{ gap: '1.0rem' }}>
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
                                  if (e.target.checked) setSelectedBagItems([...selectedBagItems, item.id]);
                                  else setSelectedBagItems(selectedBagItems.filter(id => id !== item.id));
                                }}
                              />
                              {item.name}
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
                                if (e.target.checked) setSelectedTools([...selectedTools, item.id]);
                                else setSelectedTools(selectedTools.filter(id => id !== item.id));
                              }}
                            />
                            {item.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConcoctRemedy}
                    style={{ width: '100%', padding: '0.8rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem' }}
                  >
                    🧪 치료제 완성하기 (Concoct Remedy)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 6. CHARACTER SHEET (BIO & BAGS) VIEW
// Rulebook p.14-15: All 12 Familiar benefit options (card A~M)
const FAMILIAR_BENEFITS = [
  { card: 'A', name: '따뜻한 약제사 (Helpful)', desc: '모든 질병 치료 시작 타이머 +2시간', mechanic: 'helpful' },
  { card: '2', name: '덤불 마스터 (Brushwise)', desc: '모든 식물(PLANT) 약재 채집 희귀도 -2', mechanic: 'brushwise' },
  { card: '3', name: '용감한 동반자 (Brave)', desc: '거수(Behemoth) 태그 조우 시 ♥/♦ 드로우 → 지역 약재(희귀도≤6) 획득', mechanic: 'brave' },
  { card: '4', name: '말동무 (Chatty)', desc: '물꼬 거래(Bartering) 시 목표 희귀도 -2', mechanic: 'chatty' },
  { card: '5', name: '현명한 장사꾼 (Shrewd)', desc: '치료제를 장신구로 교환 시 장신구 +1', mechanic: 'shrewd' },
  { card: '6', name: '힘센 일꾼 (Vigorous)', desc: '가방 소지 한도 +2 (마차 있으면 +4)', mechanic: 'vigorous' },
  { card: '7', name: '인맥왕 (Resourceful)', desc: '특정 약재 1종 선택, 어느 지역에서든 채집 가능 (여정마다 변경 가능)', mechanic: 'resourceful' },
  { card: '8', name: '베테랑 여행자 (Seasoned)', desc: '여행 조우 드로우 시 2장 드로우 후 원하는 카드 선택', mechanic: 'seasoned' },
  { card: '9', name: '예리한 관찰자 (Perceptive)', desc: '각 질병마다 채집 포인트(FP) +2 시작', mechanic: 'perceptive' },
  { card: '10', name: '자유로운 영혼 (Independent)', desc: '질병당 1회, 인접 지역에서 채집 (이벤트/타이머 영향 없음)', mechanic: 'independent' },
  { card: 'J', name: '유적/고분 마스터 (Titanwise)', desc: 'TITAN 약재 희귀도 -2 + 티탄/고분 채집 시 2장 드로우 후 선택', mechanic: 'titanwise' },
  { card: 'M', name: '창의적인 발명가 (Ingenuitive)', desc: '도구(Tool) 1개의 효과를 추가로 보유 (여정마다 선택)', mechanic: 'ingenuitive' },
];

// =================================================================
// 6. BIO VIEW COMPONENT
// =================================================================
function BioView({ state, updateState, currentWeight, handleRetireClick }: { state: GameState; updateState: any; currentWeight: number; handleRetireClick: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.bio.name);
  const [familiarName, setFamiliarName] = useState(state.bio.familiarName);
  const [familiarBenefitEdit, setFamiliarBenefitEdit] = useState(state.bio.familiarBenefit);
  const [resourcefulReagentEdit, setResourcefulReagentEdit] = useState(state.resourcefulReagent || "");
  const [ingenuitiveToolEdit, setIngenuitiveToolEdit] = useState(state.ingenuitiveTool || "");
  const [canFly, setCanFly] = useState(!!state.bio.canFly);
  const [canFlyOverride, setCanFlyOverride] = useState(!!state.canFlyOverride);

  // Sync state if state changes from outside
  useEffect(() => {
    setName(state.bio.name);
    setFamiliarName(state.bio.familiarName);
    setFamiliarBenefitEdit(state.bio.familiarBenefit);
    setResourcefulReagentEdit(state.resourcefulReagent || "");
    setIngenuitiveToolEdit(state.ingenuitiveTool || "");
    setCanFly(!!state.bio.canFly);
    setCanFlyOverride(!!state.canFlyOverride);
  }, [state]);

  const [newTrinket, setNewTrinket] = useState("");
  const [newBagItemName, setNewBagItemName] = useState("");
  const [newBagItemWeight, setNewBagItemWeight] = useState<number>(1/3);
  const [patienceOverride, setPatienceOverride] = useState(false);

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFamiliar = FAMILIAR_BENEFITS.find(f => f.name === familiarBenefitEdit) || FAMILIAR_BENEFITS[0];
    
    if (!canFly && !canFlyOverride && state.bio.travelStyle === '가볍고 신속하게') {
      alert("⚠️ 경고: 비행 능력(Can Fly) 혹은 하우스 룰이 비행 제약 무시 상태가 아닙니다. 비행 이동 스타일 '가볍고 신속하게'를 유지할 수 없어 기본 이동 스타일('천천히 꾸준하게')로 강제 전환됩니다.");
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
          canFly
        },
        canFlyOverride,
        resourcefulReagent: selectedFamiliar.mechanic === 'resourceful' ? resourcefulReagentEdit : "",
        ingenuitiveTool: selectedFamiliar.mechanic === 'ingenuitive' ? ingenuitiveToolEdit : ""
      }));
    }
    setEditing(false);
    alert(`캐릭터 프로필이 저장되었습니다.\n사역마 혜택: ${familiarBenefitEdit}`);
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
        source: 'Handwritten trinket note',
        story: `Added to the trinket cabinet at ${s.currentLocationName}.`,
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
    if (confirm("이 아이템을 가방에서 버리시겠습니까?")) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid var(--border-cozy)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--secondary)', fontFamily: 'var(--font-fancy)' }}>📜 약제사 기록 시트</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleRetireClick}
            style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🌅 캐릭터 은퇴 및 대승계
          </button>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', border: 'none', boxShadow: 'var(--shadow-sm)' }}>
              🔧 프로필 편집
            </button>
          )}
        </div>
      </div>

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
                <div><strong>종족 구분:</strong> {state.bio.descriptor} ({state.bio.examples})</div>
                <div><strong>이동 스타일:</strong> {state.bio.travelStyle}</div>
                <div><strong>비행 능력 (Can Fly):</strong> {state.bio.canFly ? '가능 🦅' : '불가능 ❌'} {state.canFlyOverride && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(하우스 룰 허용됨)</span>}</div>
                <div><strong>출발 동기:</strong> <span style={{ color: 'var(--text-muted)' }}>{state.bio.originName}</span></div>
                <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px dashed #e5dec9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <div><strong>이동 속도:</strong> {getTravelSpeed(state, currentWeight)} (기본: {state.bio.speed})</div>
                  <div><strong>가방 소지 한도:</strong> {getMaxCarry(state)} (기본: {state.bio.carry})</div>
                </div>
              </div>
            </div>

            {/* Familiar (사역마) */}
            <div style={{ border: '2px solid var(--border-cozy)', borderRadius: '12px', padding: '1.2rem', background: '#fff', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1.5px dashed var(--border-cozy)', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🐿️</span>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>사역마 친구</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><strong>사역마 이름:</strong> {state.bio.familiarName || '이름 없음'}</div>
                <div><strong>길드 관계:</strong> {state.bio.familiarRelation}</div>
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
                      <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>🛠️ 도구 및 장비 (Tools & Equipment)</h4>
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
                                <td style={{ padding: '0.4rem 0.5rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>{item.name}</td>
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
                      <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>🌿 영약재 및 수집물 (Reagents & Collected Parts)</h4>
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
                                    {item.name}
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
                      {state.journeyGoalDesc}
                    </div>
                    <div><strong>방향/방위:</strong> {state.journeyDirection}</div>
                    <div><strong>거리 형태:</strong> {state.journeyDistance}</div>
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
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--secondary)', fontFamily: 'var(--font-fancy)' }}>⏱️ 환자 인내심 기록 (Patience Tracker)</h4>
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
                                    activeAilment: {
                                      ...s.activeAilment,
                                      timer: nextTimer
                                    }
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
                      <span>남은 치료 시간: {state.activeAilment.timer} / {state.activeAilment.maxTimer} 시간 (Timer Hours)</span>
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
                {state.companions && state.companions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {state.companions.map(comp => {
                      const dbComp = COMPANIONS_DB.find(c => c.id === comp.name);
                      return (
                        <div key={comp.id} style={{ padding: '0.6rem', background: '#fcfaf6', borderRadius: '8px', border: '1px solid var(--border-cozy)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>
                            <span>🪲 {comp.koreanName || comp.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>위치: {comp.adoptedLocation}</span>
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
                      🪙 {t}
                      <button
                        onClick={() => {
                          if (confirm("이 장신구를 물꼬 거래나 조력에 소모하시겠습니까?")) {
                            updateState((s: any) => {
                              const next = [...s.trinkets];
                              const spentName = next[idx];
                              next.splice(idx, 1);
                              let marked = false;
                              const trinketArchive = (s.trinketArchive || []).map((record: TrinketMemoryRecord) => {
                                if (!marked && !record.spent && record.name === spentName) {
                                  marked = true;
                                  return { ...record, spent: true, story: `${record.story}\nSpent from the pouch at ${s.currentLocationName}.` };
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
                { label: '정화하기', sub: '정화, p.??' }
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
            <label><strong>사역마 이름:</strong></label>
            <input type="text" value={familiarName} onChange={e => setFamiliarName(e.target.value)} placeholder="사역마 친구의 이름을 지어주세요" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label><strong>🃏 사역마 혜택 (Familiar Benefit, p.14-15):</strong></label>
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
                  {GAME_DATA.reagents.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
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
              <strong>🦅 비행 능력 보유 (Can Fly)</strong>
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
              <strong>하우스 룰: 비행 제약 무시 (Override Flight Constraints)</strong>
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
  const filtered = GAME_DATA.reagents.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.rawName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || r.preps.toLowerCase().includes(filter.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem' }}>🌿 영약재 도감</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        각 영약재 부위는 특정한 조제법(빻기, 끓이기, 바르기 등)을 통과해 질병 증상을 치료할 수 있는 고유 약효를 냅니다.
      </p>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="영약재 이름 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">전체 분류 (ALL)</option>
          <option value="PLANT">PLANT</option>
          <option value="ANIMAL">ANIMAL</option>
          <option value="INSECT">INSECT</option>
          <option value="EARTH">EARTH</option>
          <option value="TITAN">TITAN</option>
        </select>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">전체 치료 효과</option>
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

      <div className="grid-reagents" style={{ maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
        {filtered.map((r, i) => (
          <div key={i} className="cute-card" style={{ background: '#fafafa' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>{r.name}</span>
              <span style={{ fontSize: '0.85rem', background: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#555' }}>
                기본 희귀도 (BR): {r.br}
              </span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>분류:</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', background: '#eef2f7', color: '#3182ce', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {r.type.toUpperCase()}
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

            {state.journeyActive && (
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
                  alert(`${r.name}을 수동으로 배낭에 추가했습니다.`);
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

  const filtered = GAME_DATA.ailments.filter(a => {
    const cleaned = cleanAilmentName(a.name);
    const matchesSearch = cleaned.toLowerCase().includes(search.toLowerCase()) || a.rawName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || a.tags.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem' }}>🤒 질병 도감</h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
        약제사는 주민 야수들의 다양한 병증을 식별할 수 있습니다. 환자를 약제소에 등록할 때 이름을 도감에서 찾아 적용해 주세요.
      </p>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="질병 이름 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">전체 치료 효과</option>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
        {filtered.map((a, i) => {
          const cleanedName = cleanAilmentName(a.name);
          return (
            <div key={i} className="cute-card" style={{ background: '#fafafa', padding: '1.2rem', borderRadius: '12px' }}>
              <h4 style={{ margin: 0, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>{cleanedName}</span>
                <span style={{ fontSize: '0.85rem', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>
                  등급: {a.severity.toUpperCase()} | 시간: {a.timer}시간
                </span>
              </h4>
              <div style={{ marginTop: '0.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong>💊 요구 약효 태그:</strong> {parseAndRenderTags(a.tags)}
              </div>

              <p style={{ fontSize: '0.95rem', color: '#333', background: '#fff', padding: '0.8rem', borderRadius: '6px', margin: '0.6rem 0', lineHeight: '1.6' }}>
                {a.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', background: '#fff', padding: '0.8rem', borderRadius: '6px' }}>
                <div>
                  <strong style={{ color: 'var(--primary)' }}>💡 성공 시 특별 결과 (Outcome):</strong>
                  <div style={{ marginTop: '4px', color: '#444', fontSize: '0.88rem', lineHeight: '1.5' }}>{a.outcome || '성공 보상 장신구 획득'}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--accent-red)' }}>💥 실패 시 결과 (Consequence):</strong>
                  <div style={{ marginTop: '4px', color: '#444', fontSize: '0.88rem', lineHeight: '1.5' }}>{a.consequence}</div>
                </div>
              </div>

              {state.journeyActive && !state.activeAilment && (
                <button
                  onClick={() => {
                    const patientName = window.prompt("환자 이름 (선택):", "") || "";
                    const species = window.prompt("종 / 생김새 (선택):", "") || "";
                    const initialRememberedNote = window.prompt("첫 인상 메모 (선택):", "") || "";
                    updateState(s => {
                      const startTimer = a.timer + (s.bio.familiarBenefit.includes("따뜻한 약제사") ? 2 : 0);
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
                          foragingPoints: s.bio.familiarBenefit.includes("예리한 관찰자") ? 2 : 0,
                          reagentsGathered: [],
                          patientName: patientName.trim(),
                          species: species.trim(),
                          initialRememberedNote: initialRememberedNote.trim(),
                          startedAtDay: s.cumulativeDays || s.calendarDays || 0,
                          journeyTitle: s.journeyGoalTitle || s.journeyDestination || ''
                        }
                      };
                    });
                    alert(`${cleanedName} 환자를 임상에 추가해 타이머를 기동했습니다.`);
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
// 9. MAP VIEW COMPONENT
// =================================================================
function MapView() {
  const [mapWidth, setMapWidth] = useState(1600);
  const handleZoomOut = () => setMapWidth((w: number) => Math.max(800, w - 200));
  const handleZoomIn = () => setMapWidth((w: number) => Math.min(3000, w + 200));
  const handleReset = () => setMapWidth(1600);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mapContainerRef.current) return;
    setIsDragging(true);
    // Page coordinate offset calculation
    setStartX(e.pageX - mapContainerRef.current.offsetLeft);
    setStartY(e.pageY - mapContainerRef.current.offsetTop);
    setScrollLeft(mapContainerRef.current.scrollLeft);
    setScrollTop(mapContainerRef.current.scrollTop);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !mapContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - mapContainerRef.current.offsetLeft;
    const y = e.pageY - mapContainerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5; // Drag speed multiplier
    const walkY = (y - startY) * 1.5;
    mapContainerRef.current.scrollLeft = scrollLeft - walkX;
    mapContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div style={{
      width: '100%',
      color: '#3c2f1f',
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Page Layout: Two Column */}
      <div className="grid-map-view">

        {/* Left Side: Map Viewer */}
        <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box', background: '#fcf8f2', border: '2px solid #5c4033', borderRadius: '8px', padding: '1rem', boxShadow: '0 4px 12px rgba(92, 75, 50, 0.05)' }}>
          {/* Zoom Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#5c4033' }}>Bristley Woods 지도 후면</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={handleZoomOut} style={{ padding: '0.2rem 0.5rem', background: '#e8e2d5', border: '1px solid #5c4033', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>축소</button>
              <input
                type="range"
                min="800"
                max="3000"
                step="100"
                value={mapWidth}
                onChange={e => setMapWidth(parseInt(e.target.value))}
                style={{ width: '100px', height: '24px', cursor: 'pointer' }}
              />
              <button onClick={handleZoomIn} style={{ padding: '0.2rem 0.5rem', background: '#e8e2d5', border: '1px solid #5c4033', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>확대</button>
              <button onClick={handleReset} style={{ padding: '0.2rem 0.5rem', background: '#e8e2d5', border: '1px solid #5c4033', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>기본</button>
              <span style={{ fontSize: '0.85rem', color: '#6b5c4b', minWidth: '45px', textAlign: 'right' }}>{mapWidth}px</span>
            </div>
          </div>

          {/* Scrollable Map Container */}
          <div
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            style={{
              overflow: 'auto',
              width: '100%',
              maxHeight: '650px',
              border: '1px solid #dcd3c1',
              borderRadius: '6px',
              background: '#eae1d4',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <img
              src="/Apawthecaria Map Back.jpg"
              alt="Bristley Woods Map Back"
              onDragStart={e => e.preventDefault()}
              style={{
                display: 'block',
                maxWidth: 'none',
                height: 'auto',
                width: `${mapWidth}px`,
                transition: isDragging ? 'none' : 'width 0.2s ease-out',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        {/* Right Side: Map Key & Distance Scales Sidebar */}
        <div style={{
          maxHeight: '730px',
          overflowY: 'auto',
          background: '#fcf8f2',
          border: '2px solid #5c4033',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(92, 75, 50, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Section: Distance scales */}
          <div>
            <h2 style={{
              fontWeight: 800,
              fontSize: '1.4rem',
              color: '#5c4033',
              borderBottom: '2px solid #5c4033',
              paddingBottom: '0.4rem',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase'
            }}>
              <span style={{ display: 'block', letterSpacing: '0.02em' }}>UNITS OF DISTANCE</span>
              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#6b5c4b', marginTop: '0.15rem' }}>이동 거리 단위</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ background: '#fffcf7', padding: '0.8rem', borderRadius: '6px', border: '1px solid #e5dec9' }}>
                <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', color: '#8b5a2b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-5.5 2c-.8 0-1.5-.7-1.5-1.5S5.7 9 6.5 9s1.5.7 1.5 1.5S7.3 12 6.5 12zm11 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm-8 7c-.6 0-1.2-.3-1.6-.8l-2.7-3.6c-.6-.8-.5-2 .3-2.6.8-.6 2-.5 2.6.3l1 .7c.4.3.9.3 1.3 0l1-.7c.6-.8 1.8-.9 2.6-.3.8.6.9 1.8.3 2.6l-2.7 3.6c-.4.5-1 .8-1.6.8z"/></svg>
                  <span>도보 (Paws)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#5c4033', lineHeight: '1.4' }}>
                  쥐, 비버, 그리고 더 작은 동물들의 보행 속도에 기초합니다. 숲과 육로를 통해 이동하는 기본적인 하루 이동 단위입니다.
                </p>
              </div>

              <div style={{ background: '#fffcf7', padding: '0.8rem', borderRadius: '6px', border: '1px solid #e5dec9' }}>
                <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', color: '#4a8ca8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M12 2v20M12 12L4 20M12 12l8 8"/></svg>
                  <span>날개 (Wings)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#5c4033', lineHeight: '1.4' }}>
                  박새나 딱새와 같이 민첩하고 작은 조류들의 비행 속도와 관련이 있습니다. 강이나 호수 등 거친 수로 지형을 무시하고 가볍게 넘나듭니다.
                </p>
              </div>

              <div style={{ background: '#fffcf7', padding: '0.8rem', borderRadius: '6px', border: '1px solid #e5dec9' }}>
                <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', color: '#9275a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 2v20M12 12L3 21 M12 12l9 9 M12 17l-4 4 M12 17l4 4"/></svg>
                  <span>활공 (Soar)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#5c4033', lineHeight: '1.4' }}>
                  갈매기나 까마귀와 같이 날개가 넓은 큰 조류의 높은 비행 속도에 준합니다. 아주 먼 거리를 하루 만에 주파하지만 높은 고도에서의 고유 위험 조우가 발생합니다.
                </p>
              </div>
            </div>

            {/* Scale ruler gauge */}
            <div style={{ marginTop: '1.2rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#5c4033', display: 'block', marginBottom: '0.5rem' }}>거리 척도 자 비교 (Scale Comparison)</strong>
              <div style={{ border: '1px solid #e5dec9', padding: '0.8rem', borderRadius: '6px', background: '#fffdfb' }}>
                {/* Soar */}
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#9275a8' }}>
                    <span>1 Soar (활공)</span>
                    <span>최대 거리 (약 5 Paws)</span>
                  </div>
                  <div style={{ height: '16px', background: '#e8e2d5', borderRadius: '3px', position: 'relative', marginTop: '2px', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <div style={{ width: '100%', height: '6px', background: '#9275a8', borderRadius: '2px' }} />
                  </div>
                </div>
                {/* Wing */}
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#4a8ca8' }}>
                    <span>1 Wing (날개)</span>
                    <span>중간 거리 (약 3 Paws)</span>
                  </div>
                  <div style={{ height: '16px', background: '#e8e2d5', borderRadius: '3px', position: 'relative', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '60%', height: '6px', background: '#4a8ca8', borderRadius: '2px', marginLeft: '4px' }} />
                  </div>
                </div>
                {/* Paw */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#8b5a2b' }}>
                    <span>1 Paw (도보)</span>
                    <span>기본 거리</span>
                  </div>
                  <div style={{ height: '16px', background: '#e8e2d5', borderRadius: '3px', position: 'relative', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '20%', height: '6px', background: '#8b5a2b', borderRadius: '2px', marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Map Legend */}
          <div>
            <h2 style={{
              fontWeight: 800,
              fontSize: '1.4rem',
              color: '#5c4033',
              borderBottom: '2px solid #5c4033',
              paddingBottom: '0.4rem',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase'
            }}>
              <span style={{ display: 'block', letterSpacing: '0.02em' }}>MAP KEY</span>
              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#6b5c4b', marginTop: '0.15rem' }}>지도 범례</span>
            </h2>

            <div style={{
              border: '1px solid #e5dec9',
              borderRadius: '6px',
              padding: '1rem',
              background: '#fffdfb',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Category: Location Types */}
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#8b5a2b', display: 'block', borderBottom: '1px solid #e5dec9', paddingBottom: '0.2rem', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span style={{ display: 'block' }}>LOCATION TYPES</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b5c4b', fontWeight: 'normal', marginTop: '0.1rem' }}>장소 형태</span>
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" style={{ flexShrink: 0 }}>
                      <rect x="2" y="2" width="16" height="16" fill="#fff" stroke="#3c2f1f" strokeWidth="2" rx="1.5"/>
                      <polygon points="10,4 5,14 15,14" fill="none" stroke="#3c2f1f" strokeWidth="2"/>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.85rem' }}>City (도시)</strong>
                      <span style={{ fontSize: '0.7rem', color: '#6b5c4b' }}>치료소, 길드, 번화 상점</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" style={{ flexShrink: 0 }}>
                      <polygon points="10,2 2,17 18,17" fill="#fff" stroke="#3c2f1f" strokeWidth="2"/>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Settlement (정착지)</strong>
                      <span style={{ fontSize: '0.7rem', color: '#6b5c4b' }}>마을, 주민 거주지, 여각</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" style={{ flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="7.5" fill="#fff" stroke="#3c2f1f" strokeWidth="2"/>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Wilds (야생 구역)</strong>
                      <span style={{ fontSize: '0.7rem', color: '#6b5c4b' }}>정착지 밖 채집 및 탐험지</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" style={{ flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="7.5" fill="#fff" stroke="#3c2f1f" strokeWidth="2"/>
                      <text x="10" y="14" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#3c2f1f" fontFamily="Pretendard">T</text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Titan Ruins (티탄 유적)</strong>
                      <span style={{ fontSize: '0.7rem', color: '#6b5c4b' }}>고대 거인의 신비한 자생 흔적</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" style={{ flexShrink: 0 }}>
                      <polygon points="2,4 18,4 10,17" fill="#fff" stroke="#8b5a2b" strokeWidth="2"/>
                      <circle cx="10" cy="8" r="3.5" fill="none" stroke="#8b5a2b" strokeWidth="2"/>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Behemoth Barrow (거수 고분)</strong>
                      <span style={{ fontSize: '0.7rem', color: '#6b5c4b' }}>거수들의 고분군 및 위험 지대</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" style={{ flexShrink: 0 }}>
                      <rect x="2" y="2" width="16" height="16" fill="#fff" stroke="#c9524b" strokeWidth="2" rx="1.5"/>
                      <circle cx="10" cy="10" r="4.5" fill="none" stroke="#c9524b" strokeWidth="2"/>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Clinic (약제소)</strong>
                      <span style={{ fontSize: '0.7rem', color: '#6b5c4b' }}>플레이어 약제사의 치료 본부</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category: Terrains */}
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#4a8ca8', display: 'block', borderBottom: '1px solid #e5dec9', paddingBottom: '0.2rem', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span style={{ display: 'block' }}>TERRAINS</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b5c4b', fontWeight: 'normal', marginTop: '0.1rem' }}>지형 및 세부 속성</span>
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6" fill="#9275a8"/></svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Bog (늪지/습지)</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6" fill="#3d6c48"/></svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Forest (울창한 숲)</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6" fill="#4a8ca8"/></svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Loch (호수/내해)</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6" fill="#e5c158"/></svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Meadow (초원)</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                    <svg width="16" height="16" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6" fill="#c9524b"/></svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Mountain (고산/바위)</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                    <svg width="35" height="16" style={{ flexShrink: 0 }} viewBox="0 0 35 16">
                      <path d="M 2,8 C 10,3 14,13 22,8 C 30,3 33,13 34,8" fill="none" stroke="#8b5a2b" strokeWidth="2" strokeDasharray="2.5,2.5"/>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Path (연결 도로)</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                    <svg width="35" height="16" style={{ flexShrink: 0 }} viewBox="0 0 35 16">
                      <path d="M 2,5 L 33,5 M 2,11 L 33,11" fill="none" stroke="#4a8ca8" strokeWidth="1.2"/>
                      <path d="M 10,3 L 12,13 M 22,3 L 24,13" fill="none" stroke="#4a8ca8" strokeWidth="1.2"/>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Waterway (수로)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}



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
        stamp: `${entry.locationName || 'On the road'} / ${formatDateTime(entry.timestamp)}`
      }))
  ];
  const trinkets = [...(state.trinketArchive || [])].sort((a, b) => b.timestamp - a.timestamp);
  const routeStops = [...new Set([...(state.visitedLocations || []), state.currentLocationName].filter(Boolean))];

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <span>살아 있는 기록들</span>
        <span className="document-kicker">naturalist field journal</span>
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
                    🕯️ {record.patientName || '가여운 이'}{record.species ? ` (${record.species})` : ''} — Day {record.resolvedAtDay || 0}
                  </div>
                );
              }

              return (
                <article key={record.id} style={{ border: '1px solid var(--glass-border)', background: '#fbfaf4', padding: '0.75rem', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                    <strong>{record.patientName || 'Anonymous patient'}{record.species ? ` / ${record.species}` : ''}</strong>
                    <span className="journal-stamp" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                      helped
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {record.ailmentName} / {record.locationName || 'unknown place'} {record.resolvedAtDay ? `/ Day ${record.resolvedAtDay}` : ''}
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
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>사역마와의 기억</h3>
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            {state.bio.familiarName || '이름 없는 사역마'} / {state.bio.familiarRelation || '관계 미기록'}
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {(state.familiarMemories || []).slice(0, 5).map((memory, idx) => (
              <div key={`${memory}_${idx}`} style={{ borderLeft: '3px solid var(--primary)', padding: '0.45rem 0.6rem', background: '#fbfaf4', fontSize: '0.84rem', whiteSpace: 'pre-wrap' }}>
                {memory}
              </div>
            ))}
            {(!state.familiarMemories || state.familiarMemories.length === 0) && (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>사역마와 함께 시간을 보내거나 약재를 먹여 유대감을 쌓으면 여기에 기억이 새겨집니다.</div>
            )}
          </div>
        </section>

        <section className="cute-card" style={{ background: '#fffefa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>채집 약초 표본지</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
            {herbarium.slice(0, 10).map(entry => {
              let preps = entry.prepsDetail;
              let matchedReag: any = null;
              const cleanName = cleanMemoryName(entry.name).toLowerCase();
              matchedReag = GAME_DATA.reagents.find(r =>
                r.name.toLowerCase() === cleanName ||
                r.rawName.toLowerCase() === cleanName ||
                cleanMemoryName(r.name).toLowerCase() === cleanName ||
                cleanMemoryName(r.rawName).toLowerCase() === cleanName
              );
              if (!preps && matchedReag) {
                preps = (parsedPrepsList as any)[matchedReag.rawName];
              }

              return (
                <div key={entry.id} style={{ border: '1px solid var(--glass-border)', background: '#fbfaf4', padding: '0.65rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ color: 'var(--text-bright)' }}>{entry.name}</strong>
                    {matchedReag && matchedReag.rawName && matchedReag.rawName.toLowerCase() !== entry.name.toLowerCase() && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>({matchedReag.rawName})</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>📍 {entry.region || 'region unpinned'} / sightings {entry.sightings}</div>
                  
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
                                {p.part}
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
                                {p.prep}
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
                <strong>{entry.title}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.stamp}</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{entry.text}</div>
              </article>
            ))}
            {journeyEntries.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>여정을 마무리하거나 길가에서 일기를 적어 지도의 여백을 채우세요.</div>}
          </div>
        </section>

        <section className="cute-card" style={{ background: '#f8f5ee', border: '1.5px solid #a89684', gridColumn: '1 / -1', boxShadow: 'inset 0 0 15px rgba(139, 90, 43, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', borderBottom: '1px dashed #c4b5a3', paddingBottom: '0.55rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', fontFamily: 'var(--font-fancy)' }}>선물 보관함</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
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
                        {record.name}{record.count > 1 ? ` x${record.count}` : ''}
                      </strong>
                      {record.spent && <span style={{ fontSize: '0.68rem', fontStyle: 'italic', color: '#8c7a6b' }}>— 건네어 소모됨</span>}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8c7a6b', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      {record.source} {record.locationName ? ` / ${record.locationName}` : ''}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.83rem', marginTop: '0.45rem', color: record.spent ? 'var(--text-dim)' : 'var(--text-muted)', lineHeight: '1.45' }}>
                      {originalStory}
                    </div>
                    {record.spent && (
                      <div style={{ fontSize: '0.8rem', color: '#8c7a6b', marginTop: '0.35rem', fontStyle: 'italic' }}>
                        ↳ {spentStoryLine ? spentStoryLine.replace(/^Spent from the pouch at /, '약제사 배낭에서 꺼내어 ').replace(/$/, '에서 사용함') : '물꼬 거래나 조력에 사용됨'}
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
                          🌿 Revisit Giver / 선물해 준 환자 찾아보기
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
  if (clean === 'dire') return '위태로운 생사의 기로 (A dire struggle)';
  if (clean === 'severe') return '깊고 무거운 병증 (A heavy affliction)';
  if (clean === 'intermediate') return '어려운 병색 (A troublesome malady)';
  return '비교적 가벼운 앓음 (A mild discomfort)';
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
  const successCount = records.filter(r => r.outcome === 'success').length;
  const failureCount = records.filter(r => r.outcome === 'failure').length;

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
        <span>환자 기록장</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          {records.length} case files / {successCount} helped / {failureCount} unresolved
        </span>
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: 0 }}>
        들녘에서 만난 야수들, 그들이 건넨 이야기와 약제사 배낭에서 꺼내어 조제해준 약의 흔적들을 모은 기록장입니다.
      </p>

      {records.length === 0 ? (
        <div className="cute-card" style={{ background: '#fffefa', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.6' }}>
          아직 진료한 야수의 기록이 없습니다. 아픈 이가 짚더미를 털고 숲으로 돌아가거나, 어쩔 수 없이 떠나보내야 했던 모든 순간의 이야기가 기록지에 고요히 스며들 것입니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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
                    {record.locationName || 'Bristley Woods'} {record.resolvedAtDay ? `/ Day ${record.resolvedAtDay}` : ''}
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
                      Dismiss / 기억 덮기
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
                    <div><strong>Observed Malady / 관찰된 병증:</strong> {record.ailmentName}</div>
                    <div><strong>Affliction Depth / 병의 깊이:</strong> {getNaturalSeverityDescription(record.severity)}</div>
                    {record.tags && <div><strong>Symptom Requirements / 요구 효능:</strong> {record.tags}</div>}
                    {record.journeyTitle && <div><strong>Journey / 기록된 여정:</strong> {record.journeyTitle}</div>}
                    {record.remedy && record.remedy.length > 0 && (
                      <div><strong>Remedy Composition / 조제 약재 목록:</strong> {record.remedy.join(', ')}</div>
                    )}
                  </div>
                </details>

                {/* Footer stamp info */}
                <div style={{ marginTop: '0.8rem', fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{record.season || 'Season unrecorded'}</span>
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
  const [subTab, setSubTab] = useState<'casebook' | 'almanac' | 'scrapbook' | 'journals' | 'chronicles' | 'legacy'>('casebook');

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
    settlement: 'Settlements',
    clinic: 'Clinics',
    reagent: 'Reagents',
    creature: 'Creatures',
    landmark: 'Landmarks',
    notable: 'Notable Places'
  };

  const scrapbookLabels: Record<ScrapbookKind, string> = {
    journey: 'Journey',
    discovery: 'Discovery',
    patient: 'Patient',
    remedy: 'Remedy'
  };

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    updateState(s => {
      let nextGoalCounter = s.journeyGoalCounter || 0;
      let nextChecklist = [...(s.journeyGoalChecklist || [])];

      if (s.journeyActive) {
        const titleLower = newTitle.toLowerCase();
        const textLower = newText.toLowerCase();

        if (s.journeyGoalTitle === '관계 회복' && (textLower.includes("사역마") || textLower.includes("동반자") || titleLower.includes("사역마") || titleLower.includes("동반자") || textLower.includes("familiar") || textLower.includes("companion"))) {
          nextGoalCounter += 1;
        }
        if (s.journeyGoalTitle === '마음의 정리' && (textLower.includes("갈등") || textLower.includes("해결") || textLower.includes("마음") || titleLower.includes("갈등") || titleLower.includes("해결") || titleLower.includes("마음"))) {
          nextGoalCounter += 1;
        }
        if (s.journeyGoalTitle === '자연 환경 조사') {
          nextChecklist.push(s.currentRegion);
          const counts: Record<string, number> = {};
          nextChecklist.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
          nextGoalCounter = Math.max(...Object.values(counts));
        }
        if (s.journeyGoalTitle === '방랑벽') {
          const targetRegions = ['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain'];
          if (targetRegions.includes(s.currentRegion) && !nextChecklist.includes(s.currentRegion)) {
            nextChecklist.push(s.currentRegion);
          }
          nextGoalCounter = nextChecklist.length;
        }
      }

      return {
        ...s,
        journeyGoalCounter: nextGoalCounter,
        journeyGoalChecklist: nextChecklist,
        journals: [
          {
            id: 'user_journal_' + Date.now(),
            title: newTitle.trim(),
            text: newText.trim(),
            timestamp: Date.now()
          },
          ...s.journals
        ]
      };
    });

    setNewTitle("");
    setNewText("");
    alert("새 저널 일지가 등록되었습니다.");
  };

  const handleRemoveJournal = (id: string) => {
    if (confirm("이 일지 기록을 삭제하시겠습니까?")) {
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
          updateState(() => migrateState(parsed));
          alert("세이브 파일을 성공적으로 가져왔습니다!");
        } else {
          alert("유효하지 않은 아포테카리아 세이브 파일입니다.");
        }
      } catch (err) {
        alert("세이브 파일 파싱 중 에러가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📝 약제사 연대기 일지</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportData} style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>💾 내 데이터 백업하기</button>
          <label style={{ padding: '0.4rem 0.8rem', background: '#eee', color: '#333', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
            📥 데이터 불러오기
            <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
          </label>
        </div>
      </h2>

      {/* Sub tabs navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
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
          📝 개인 저널 일지 ({state.journals.length})
        </button>
        <button
          onClick={() => setSubTab('chronicles')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'chronicles' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'chronicles' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          📖 방랑 연대기 ({(state.journeyChronicles || []).length})
        </button>
        <button
          onClick={() => setSubTab('legacy')}
          style={{ padding: '0.5rem 1rem', background: subTab === 'legacy' ? 'var(--primary)' : '#f7f6ef', color: subTab === 'legacy' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          🏛️ 은퇴의 전당 및 약제소 망
        </button>
      </div>

      {subTab === 'casebook' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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
                    {record.locationName || 'Bristley Woods'} {record.resolvedAtDay ? `/ Day ${record.resolvedAtDay}` : ''}
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
                      Dismiss / 기억 덮기
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
                    <div><strong>Observed Malady / 관찰된 병증:</strong> {record.ailmentName}</div>
                    <div><strong>Affliction Depth / 병의 깊이:</strong> {getNaturalSeverityDescription(record.severity)}</div>
                    {record.tags && <div><strong>Symptom Requirements / 요구 효능:</strong> {record.tags}</div>}
                    {record.journeyTitle && <div><strong>Journey / 기록된 여정:</strong> {record.journeyTitle}</div>}
                    {record.remedy && record.remedy.length > 0 && (
                      <div><strong>Remedy Composition / 조제 약재 목록:</strong> {record.remedy.join(', ')}</div>
                    )}
                  </div>
                </details>

                <div style={{ marginTop: '0.8rem', fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{record.season || 'Season unrecorded'}</span>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {entries.map(entry => {
                    let preps = entry.prepsDetail;
                    let matchedReag: any = null;
                    if (entry.category === 'reagent') {
                      const cleanName = cleanMemoryName(entry.name).toLowerCase();
                      matchedReag = GAME_DATA.reagents.find(r =>
                        r.name.toLowerCase() === cleanName ||
                        r.rawName.toLowerCase() === cleanName ||
                        cleanMemoryName(r.name).toLowerCase() === cleanName ||
                        cleanMemoryName(r.rawName).toLowerCase() === cleanName
                      );
                      if (!preps && matchedReag) {
                        preps = (parsedPrepsList as any)[matchedReag.rawName];
                      }
                    }

                    return (
                      <div key={entry.id} style={{ border: '1px solid var(--glass-border)', background: '#fbfaf4', padding: '0.75rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{entry.name}</span>
                          {matchedReag && matchedReag.rawName && matchedReag.rawName.toLowerCase() !== entry.name.toLowerCase() && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>({matchedReag.rawName})</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {entry.locationName || 'No fixed place'} {entry.region ? `- ${entry.region}` : ''}</div>
                        
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
                              🧪 Preparation & Application (조제 및 사용법)
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
                                      {p.part}
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
                                      {p.prep}
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
                            📝 {entry.notes}
                          </div>
                        )}

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.3rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>출처: {entry.source}</span>
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
                <h4 style={{ margin: 0, color: 'var(--text-bright)' }}>{entry.title}</h4>
                <span className="document-kicker">{scrapbookLabels[entry.kind]}</span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{entry.text}</p>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.6rem' }}>
                {entry.locationName || 'On the road'} / {formatDateTime(entry.timestamp)}
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
            <button type="submit" style={{ padding: '0.6rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>🖋️ 저널 등록</button>
          </form>

          {/* List journals */}
          <div style={{ marginTop: '2rem' }}>
            <h3>📖 과거 저널 기록 ({state.journals.length}개)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto', padding: '0.5rem' }}>
              {state.journals.map(j => (
                <div key={j.id} className="cute-card" style={{ background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '0.4rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>{j.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateTime(j.timestamp)}</span>
                      <button onClick={() => handleRemoveJournal(j.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.8rem' }}>❌ 삭제</button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text-bright)', marginTop: '0.5rem' }}>
                    {j.text}
                  </p>
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
              <p style={{ fontSize: '0.88rem', color: '#451a03', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'serif', margin: 0 }}>
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
            <h4 style={{ color: 'var(--primary)', margin: '0 0 0.8rem 0' }}>🏛️ 역대 은퇴 약제사 계보 (Predecessors)</h4>
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
            <h4 style={{ color: 'var(--primary)', margin: '0 0 0.8rem 0' }}>🏡 보존된 세대별 약제소 네트워크 (Clinics Network)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.8rem' }}>
              {(state.legacyClinics || []).map((cl, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '0.8rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary)' }}>📍 {cl.locationName} 지부</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0.2rem 0' }}>
                    지형: {cl.region} | 설립자: {cl.founder}
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
    </div>
  );
}
