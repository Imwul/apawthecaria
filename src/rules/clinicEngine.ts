import { CLINIC_AGENDA_BY_ID } from './data/clinics';
import { REAGENT_BY_ID } from './data/reagents';
import { shortestPathDistance } from './serviceEngine';
import type { EngineInventoryItem, EngineJournalEvent, TravelGraphNode } from './gameplay';
import type { PatientState } from './state';
import type { Season } from './types';

export interface CanonicalClinicState {
  id: string;
  name: string;
  locationId: string;
  commissionedSeason: Season;
  completesAtSeason: Season;
  status: 'building' | 'active';
  gardenReagentId: string | null;
  gardenHarvestedAilmentIds?: string[];
}

export interface ClinicRuntimeState {
  currentSeason: Season;
  completedSeasons: number;
  trinkets: number;
  reputation: number;
  clinics: CanonicalClinicState[];
  agendaIds: string[];
  goodwillWeight: number;
  graph: Record<string, TravelGraphNode>;
  visitedLocationNames?: string[];
  completedReconnecting?: boolean;
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

export interface ClinicAgendaRuntimeState {
  season: Season;
  reputation: number;
  trinkets: number;
  inventory: EngineInventoryItem[];
  patient: PatientState | null;
  clinics: CanonicalClinicState[];
  agendaIds: string[];
  goodwillWeight: number;
  soddenReagentId: string | null;
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

export type ClinicAgendaAction =
  | { kind: 'hibernate'; occupants: number }
  | { kind: 'plant-garden'; clinicId: string; itemId: string }
  | { kind: 'harvest-garden'; clinicId: string; ailmentInstanceId: string; preparationId: string }
  | { kind: 'choose-sodden-logs'; reagentId: string }
  | { kind: 'harvest-sodden-logs'; ailmentInstanceId: string; reagentId: string; preparationId: string }
  | { kind: 'donate-goodwill'; itemId: string }
  | { kind: 'record-mailbox-call'; note: string };

const seasonAfter = (season: Season): Season => ({ Spring: 'Summer', Summer: 'Autumn', Autumn: 'Winter', Winter: 'Spring' })[season] as Season;

const clinicAgendaRequirementError = (state: ClinicRuntimeState, agendaId: string): string | null => {
  const visited = new Set(state.visitedLocationNames || []);
  if (agendaId === 'pantry' && state.reputation < 15) return 'Pantry requires 15 Reputation.';
  if (agendaId === 'library' && (!visited.has('Summit') || !state.completedReconnecting)) return 'Library requires visiting Summit and completing Reconnecting with Guildmates.';
  if (agendaId === 'hive-boxes' && !visited.has('Spoolkeep')) return 'Hive Boxes require visiting Spoolkeep.';
  if (agendaId === 'gardens' && !visited.has('Noonhill')) return 'Gardens require visiting Noonhill.';
  if (agendaId === 'greenhouses' && (!state.agendaIds.includes('gardens') || !visited.has('Glasswall'))) return 'Greenhouses require Gardens and visiting Glasswall.';
  if (agendaId === 'sodden-logs' && !visited.has('Odoak')) return 'Sodden Logs require visiting Odoak.';
  if (agendaId === 'taproom' && !visited.has('Vessel')) return 'Taproom requires visiting Vessel.';
  if (agendaId === 'hostel' && !state.agendaIds.includes('taproom')) return 'Hostel requires an existing Taproom.';
  return null;
};

export const commissionClinic = (input: { transactionId: string; state: ClinicRuntimeState; locationId: string; name: string; locationType: string; curedHere: boolean; agendaId?: string }) => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) throw new Error('Clinic transaction is missing or already applied.');
  if (input.state.completedSeasons < 4 || input.locationType !== 'Wild' || !input.curedHere || input.state.trinkets < 15) throw new Error('Clinic requires four completed Seasons, a successful Wild Ailment, and 15 Trinkets.');
  if (!input.state.graph[input.locationId] || input.state.clinics.some(row => row.locationId === input.locationId)) throw new Error('Clinic Location is invalid or already occupied.');
  if (!input.name.trim()) throw new Error('Clinic requires a name.');
  if (!input.agendaId || !CLINIC_AGENDA_BY_ID.has(input.agendaId)) throw new Error('Clinic commissioning requires one canonical Agenda.');
  const agendaError = clinicAgendaRequirementError(input.state, input.agendaId);
  if (agendaError) throw new Error(agendaError);
  const clinic: CanonicalClinicState = { id: `clinic:${input.transactionId}`, name: input.name.trim(), locationId: input.locationId, commissionedSeason: input.state.currentSeason, completesAtSeason: seasonAfter(input.state.currentSeason), status: 'building', gardenReagentId: null, gardenHarvestedAilmentIds: [] };
  return {
    ...input.state,
    trinkets: input.state.trinkets - 15,
    clinics: [...input.state.clinics, clinic],
    agendaIds: !input.state.agendaIds.includes(input.agendaId) ? [...input.state.agendaIds, input.agendaId] : input.state.agendaIds,
    appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId],
    journalEvents: [...input.state.journalEvents, { id: `${input.transactionId}:journal`, type: 'downtime' as const, title: 'Clinic Commissioned', text: `${clinic.name} will be completed at the start of ${clinic.completesAtSeason}.` }]
  };
};

export const completeClinicsAtSeason = (state: ClinicRuntimeState, season: Season): ClinicRuntimeState => ({
  ...state,
  currentSeason: season,
  clinics: state.clinics.map(row => row.status === 'building' && row.completesAtSeason === season ? { ...row, status: 'active' as const } : row)
});

export const clinicServiceArea = (state: ClinicRuntimeState, clinicId: string) => {
  const clinic = state.clinics.find(row => row.id === clinicId && row.status === 'active');
  if (!clinic) return [];
  return Object.keys(state.graph).filter(locationId => {
    const distance = shortestPathDistance(state.graph, clinic.locationId, locationId);
    return distance !== null && distance <= 3;
  });
};

export const resolveClinicSeasonIncome = (state: ClinicRuntimeState) => {
  const activeCount = state.clinics.filter(row => row.status === 'active').length;
  const perClinic = state.agendaIds.includes('hostel') ? 2 : state.agendaIds.includes('taproom') ? 1 : 0;
  return { trinkets: activeCount * perClinic, reputation: state.agendaIds.includes('goodwill-stand') ? Math.floor(state.goodwillWeight) : 0 };
};

const clinicAgendaError = (transactionId: string, state: ClinicAgendaRuntimeState) => !transactionId
  ? 'Clinic Agenda action requires a transaction ID.'
  : state.appliedTransactionIds.includes(transactionId)
    ? 'This Clinic Agenda transaction has already been applied.'
    : null;

const agendaItem = (transactionId: string, reagentId: string, preparationId: string): EngineInventoryItem | null => {
  const reagent = REAGENT_BY_ID.get(reagentId);
  const preparation = reagent?.preparations.find(row => row.id === preparationId);
  if (!reagent || !preparation) return null;
  return {
    id: `${transactionId}:${reagent.id}:${preparation.id}`,
    name: `${reagent.displayName} (${preparation.name})`,
    type: 'reagent',
    weight: preparation.weight,
    canonicalReagentId: reagent.id,
    preparationId: preparation.id,
    usesRemaining: preparation.uses,
    quantity: 1
  };
};

export const resolveClinicAgendaAction = (input: {
  transactionId: string;
  state: ClinicAgendaRuntimeState;
  action: ClinicAgendaAction;
}): ClinicAgendaRuntimeState => {
  const error = clinicAgendaError(input.transactionId, input.state);
  if (error) throw new Error(error);
  let next: ClinicAgendaRuntimeState = { ...input.state };
  let title: string;
  let text: string;

  if (input.action.kind === 'hibernate') {
    if (!next.agendaIds.includes('pantry') || next.season !== 'Winter') throw new Error('Pantry Hibernation requires Winter and an active Pantry Agenda.');
    const occupants = Math.max(1, Math.floor(input.action.occupants));
    const cost = next.reputation < 15 ? 15 * occupants : 0;
    if (next.trinkets < cost) throw new Error(`Pantry Hibernation requires ${cost} Trinkets for ${occupants} occupant(s).`);
    next = { ...next, season: 'Spring', trinkets: next.trinkets - cost };
    title = 'Pantry Hibernation';
    text = `Skipped Winter with ${occupants} occupant(s); spent ${cost} Trinkets.`;
  } else if (input.action.kind === 'plant-garden') {
    const action = input.action;
    if (!next.agendaIds.includes('gardens')) throw new Error('Planting requires the Gardens Agenda.');
    const clinicIndex = next.clinics.findIndex(row => row.id === action.clinicId && row.status === 'active');
    const item = next.inventory.find(row => row.id === action.itemId && row.type === 'reagent' && row.canonicalReagentId);
    const reagent = item?.canonicalReagentId ? REAGENT_BY_ID.get(item.canonicalReagentId) : null;
    if (clinicIndex < 0 || !item || reagent?.type !== 'PLANT') throw new Error('Choose an active Clinic and one canonical Plant Reagent from Inventory.');
    const clinics = [...next.clinics];
    clinics[clinicIndex] = { ...clinics[clinicIndex], gardenReagentId: reagent.id, gardenHarvestedAilmentIds: [] };
    const inventory = next.inventory.flatMap(row => {
      if (row.id !== item.id) return [row];
      const quantity = Math.max(1, row.quantity || 1);
      return quantity > 1 ? [{ ...row, quantity: quantity - 1 }] : [];
    });
    next = { ...next, clinics, inventory };
    title = 'Clinic Garden planted';
    text = `${reagent.canonicalName} was planted at ${clinics[clinicIndex].name}.`;
  } else if (input.action.kind === 'harvest-garden') {
    const action = input.action;
    if (!next.agendaIds.includes('gardens')) throw new Error('Harvesting requires the Gardens Agenda.');
    if (next.season === 'Winter' && !next.agendaIds.includes('greenhouses')) throw new Error('Clinic Gardens cannot be harvested in Winter without Greenhouses.');
    const clinicIndex = next.clinics.findIndex(row => row.id === action.clinicId && row.status === 'active');
    const clinic = next.clinics[clinicIndex];
    if (!clinic?.gardenReagentId || clinic.gardenHarvestedAilmentIds?.includes(action.ailmentInstanceId)) throw new Error('This Clinic Garden is unavailable for the selected Ailment.');
    const item = agendaItem(input.transactionId, clinic.gardenReagentId, action.preparationId);
    if (!item) throw new Error('Garden harvest requires a Preparation from the planted Plant.');
    const clinics = [...next.clinics];
    clinics[clinicIndex] = { ...clinic, gardenHarvestedAilmentIds: [...(clinic.gardenHarvestedAilmentIds || []), action.ailmentInstanceId] };
    next = { ...next, clinics, inventory: [...next.inventory, item] };
    title = 'Clinic Garden harvest';
    text = 'The Clinic Garden yielded one prepared Reagent for the current Ailment.';
  } else if (input.action.kind === 'choose-sodden-logs') {
    const reagent = REAGENT_BY_ID.get(input.action.reagentId);
    if (!next.agendaIds.includes('sodden-logs') || reagent?.type !== 'INSECT') throw new Error('Sodden Logs require a canonical Insect Reagent.');
    next = { ...next, soddenReagentId: reagent.id };
    title = 'Sodden Logs habitat';
    text = `${reagent.canonicalName} was chosen for the Sodden Logs.`;
  } else if (input.action.kind === 'harvest-sodden-logs') {
    const action = input.action;
    if (!next.agendaIds.includes('sodden-logs') || next.season === 'Winter') throw new Error('Sodden Logs are available in Spring, Summer, and Autumn.');
    if (!next.patient) throw new Error('Sodden Logs require an active Ailment.');
    const ailment = next.patient.ailments.find(row => row.id === action.ailmentInstanceId && row.status === 'active');
    if (!ailment || ailment.specialState.soddenLogsHarvested) throw new Error('Sodden Logs may be used once per Ailment.');
    const reagent = REAGENT_BY_ID.get(action.reagentId);
    const item = agendaItem(input.transactionId, action.reagentId, action.preparationId);
    if (reagent?.type !== 'INSECT' || !item) throw new Error('Sodden Logs require a canonical Insect Preparation.');
    const patient = {
      ...next.patient,
      ailments: next.patient.ailments.map(row => row.id === ailment.id ? { ...row, specialState: { ...row.specialState, soddenLogsHarvested: true } } : row),
      timers: next.patient.timers.map(timer => timer.status === 'active' ? { ...timer, current: Math.max(0, timer.current - 1) } : timer)
    };
    next = { ...next, patient, inventory: [...next.inventory, item] };
    title = 'Sodden Logs harvest';
    text = `${item.name} was gathered; all active Ailment Timers were reduced by 1.`;
  } else if (input.action.kind === 'donate-goodwill') {
    const action = input.action;
    if (!next.agendaIds.includes('goodwill-stand')) throw new Error('Donation requires the Goodwill Stand Agenda.');
    const item = next.inventory.find(row => row.id === action.itemId);
    if (!item) throw new Error('The donated Item is not in Inventory.');
    const donatedWeight = item.weight * Math.max(1, item.quantity || 1);
    next = { ...next, inventory: next.inventory.filter(row => row.id !== item.id), goodwillWeight: next.goodwillWeight + donatedWeight };
    title = 'Goodwill Stand donation';
    text = `${item.name} (${donatedWeight} Weight) was donated.`;
  } else {
    if (!next.agendaIds.includes('mailbox') || !input.action.note.trim()) throw new Error('Mailbox calls must be recorded from the external Guild mailbox.');
    title = 'Guild Mailbox call';
    text = input.action.note;
  }

  return {
    ...next,
    appliedTransactionIds: [...next.appliedTransactionIds, input.transactionId],
    journalEvents: [...next.journalEvents, {
      id: `${input.transactionId}:journal`,
      type: 'downtime',
      title,
      text,
      authorship: input.action.kind === 'record-mailbox-call' ? 'player' : 'system',
      playerMemory: input.action.kind === 'record-mailbox-call' ? text : undefined
    }]
  };
};
