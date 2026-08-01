import { CLINIC_AGENDA_BY_ID } from './data/clinics';
import { shortestPathDistance } from './serviceEngine';
import type { EngineJournalEvent, TravelGraphNode } from './gameplay';
import type { Season } from './types';

export interface CanonicalClinicState {
  id: string;
  name: string;
  locationId: string;
  commissionedSeason: Season;
  completesAtSeason: Season;
  status: 'building' | 'active';
  gardenReagentId: string | null;
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
  appliedTransactionIds: string[];
  journalEvents: EngineJournalEvent[];
}

const seasonAfter = (season: Season): Season => ({ Spring: 'Summer', Summer: 'Autumn', Autumn: 'Winter', Winter: 'Spring' })[season] as Season;

export const commissionClinic = (input: { transactionId: string; state: ClinicRuntimeState; locationId: string; name: string; locationType: string; curedHere: boolean; agendaId?: string }) => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) throw new Error('Clinic transaction is missing or already applied.');
  if (input.state.completedSeasons < 4 || input.locationType !== 'Wild' || !input.curedHere || input.state.trinkets < 15) throw new Error('Clinic requires four completed Seasons, a successful Wild Ailment, and 15 Trinkets.');
  if (!input.state.graph[input.locationId] || input.state.clinics.some(row => row.locationId === input.locationId)) throw new Error('Clinic Location is invalid or already occupied.');
  if (!input.name.trim()) throw new Error('Clinic requires a name.');
  if (input.agendaId && !CLINIC_AGENDA_BY_ID.has(input.agendaId)) throw new Error('Unknown Clinic Agenda.');
  const clinic: CanonicalClinicState = { id: `clinic:${input.transactionId}`, name: input.name.trim(), locationId: input.locationId, commissionedSeason: input.state.currentSeason, completesAtSeason: seasonAfter(input.state.currentSeason), status: 'building', gardenReagentId: null };
  return {
    ...input.state,
    trinkets: input.state.trinkets - 15,
    clinics: [...input.state.clinics, clinic],
    agendaIds: input.agendaId && !input.state.agendaIds.includes(input.agendaId) ? [...input.state.agendaIds, input.agendaId] : input.state.agendaIds,
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
