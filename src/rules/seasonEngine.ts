import { SEASON_BY_ID } from './data/seasons';
import type { SeasonRuntimeState } from './gameplay';

export interface SeasonEngineInput {
  transactionId: string;
  state: SeasonRuntimeState;
}

export interface SeasonEngineOutcome {
  transactionId: string;
  nextState: SeasonRuntimeState;
  previousSeason: SeasonRuntimeState['season'];
  nextSeason: SeasonRuntimeState['season'];
  completedClinicIds: string[];
  gardenReagentIds: string[];
  clinicIncome: number;
  goodwillReputation: number;
  transformedCompanionIds: string[];
}

export interface SeasonEngineResolution {
  status: 'resolved' | 'invalid';
  value: SeasonEngineOutcome | null;
  messages: string[];
}

export const resolveSeasonBoundary = (input: SeasonEngineInput): SeasonEngineResolution => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Season resolution requires a transaction ID.'] };
  if (input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['This Season transaction has already been applied.'] };
  }
  if (!input.state.downtimeCompleted) {
    return { status: 'invalid', value: null, messages: ['Complete exactly one Downtime activity before ending the Season.'] };
  }
  const season = SEASON_BY_ID.get(input.state.season);
  if (!season) return { status: 'invalid', value: null, messages: [`Unknown Season: ${input.state.season}`] };

  const nextSeason = season.nextSeason;
  const completedClinicIds: string[] = [];
  const clinics = input.state.clinics.map(clinic => {
    if (clinic.status === 'building' && clinic.completesAtSeason === nextSeason) {
      completedClinicIds.push(clinic.id);
      return { ...clinic, status: 'active' as const, completesAtSeason: undefined };
    }
    return clinic;
  });
  const activeClinicCount = clinics.filter(clinic => clinic.status === 'active').length;
  const clinicIncome = input.state.agendaServices.includes('hostel')
    ? activeClinicCount * 2
    : input.state.agendaServices.includes('taproom')
      ? activeClinicCount
      : 0;
  const goodwillReputation = input.state.agendaServices.includes('goodwill_stand')
    ? Math.floor(Math.max(0, input.state.goodwillDonatedWeight))
    : 0;
  const transformedCompanionIds: string[] = [];
  const companions = input.state.companions.map(companion => {
    const seasonsTravelled = companion.seasonsTravelled + 1;
    if (companion.kind === 'caterpillar' && seasonsTravelled >= 1) {
      transformedCompanionIds.push(companion.id);
      return { ...companion, kind: 'butterfly', seasonsTravelled };
    }
    return { ...companion, seasonsTravelled };
  });
  const gardenReagentIds = clinics
    .filter(clinic => clinic.status === 'active' && clinic.gardenReagentId)
    .map(clinic => clinic.gardenReagentId!);
  const event = {
    id: `${input.transactionId}:season`,
    type: 'season' as const,
    title: `${input.state.season} to ${nextSeason}`,
    text: `Clinic income ${clinicIncome}; Goodwill reputation ${goodwillReputation}; completed Clinics ${completedClinicIds.length}.`
  };
  const nextState: SeasonRuntimeState = {
    ...input.state,
    season: nextSeason,
    reputation: input.state.reputation + goodwillReputation,
    trinkets: input.state.trinkets + clinicIncome,
    clinics,
    goodwillDonatedWeight: 0,
    companions,
    downtimeCompleted: false,
    journalEvents: [...input.state.journalEvents, event],
    appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
  };
  return {
    status: 'resolved',
    value: {
      transactionId: input.transactionId,
      nextState,
      previousSeason: input.state.season,
      nextSeason,
      completedClinicIds,
      gardenReagentIds,
      clinicIncome,
      goodwillReputation,
      transformedCompanionIds
    },
    messages: gardenReagentIds.length > 0
      ? ['Garden crops are available this Season; harvesting remains a player choice.']
      : []
  };
};
