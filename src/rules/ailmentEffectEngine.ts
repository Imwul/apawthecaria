import type { CardSuit, Season } from './types';
import type { PatientState } from './state';

export interface AilmentEffectRuntimeState {
  patient: PatientState;
  reputation: number;
  worldConditions: string[];
  appliedTransactionIds: string[];
}

export interface AilmentEffectResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: AilmentEffectRuntimeState | null;
  messages: string[];
}

const updateInstance = (
  patient: PatientState,
  instanceId: string,
  update: (instance: PatientState['ailments'][number]) => PatientState['ailments'][number]
): PatientState => ({
  ...patient,
  ailments: patient.ailments.map(instance => instance.id === instanceId ? update(instance) : instance)
});

export const resolveAilmentDiagnosisEffect = (input: {
  transactionId: string;
  state: AilmentEffectRuntimeState;
  ailmentInstanceId: string;
  cardSuit?: CardSuit;
  brandCareChoice?: 'treat' | 'refuse';
}): AilmentEffectResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Ailment effect transaction is missing or already applied.'] };
  const instance = input.state.patient.ailments.find(row => row.id === input.ailmentInstanceId && row.status === 'active');
  if (!instance?.ailmentId) return { status: 'invalid', value: null, messages: ['Active Ailment instance not found.'] };
  let patient = input.state.patient;
  let reputation = input.state.reputation;
  if (instance.ailmentId === 'ailment-forager-s-twitch') {
    if (!input.cardSuit) return { status: 'manual', value: input.state, messages: ['Draw the Forager\'s Twitch follow-up card.'] };
    const badTrip = input.cardSuit === '♣' || input.cardSuit === '♠';
    patient = updateInstance(patient, instance.id, row => ({
      ...row,
      specialState: { ...row.specialState, trip: badTrip ? 'bad' : 'good', additionalRequirements: badTrip ? [{ tag: 'WOUND', threshold: 1 }] : [] },
      effectIds: [...row.effectIds, input.transactionId]
    }));
  } else if (instance.ailmentId === 'ailment-brand-care') {
    if (!input.brandCareChoice) return { status: 'manual', value: input.state, messages: ['Choose whether to treat Brand Care or refuse under Guild law.'] };
    reputation = Math.max(0, reputation + (input.brandCareChoice === 'treat' ? -2 : 2));
    patient = updateInstance(patient, instance.id, row => ({
      ...row,
      status: input.brandCareChoice === 'refuse' ? 'failed' : row.status,
      specialState: { ...row.specialState, brandCareChoice: input.brandCareChoice, suppressOverstay: input.brandCareChoice === 'refuse' },
      effectIds: [...row.effectIds, input.transactionId]
    }));
  }
  return {
    status: 'resolved',
    value: { ...input.state, patient, reputation, appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId] },
    messages: []
  };
};

export const resolveAilmentTimerEffect = (input: {
  transactionId: string;
  state: AilmentEffectRuntimeState;
  ailmentInstanceId: string;
  decreaseBy: number;
  hasSteelAxe?: boolean;
  hasLocalSettlementHelp?: boolean;
}): AilmentEffectResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Ailment Timer transaction is missing or already applied.'] };
  const instance = input.state.patient.ailments.find(row => row.id === input.ailmentInstanceId && row.status === 'active');
  if (!instance?.ailmentId) return { status: 'invalid', value: null, messages: ['Active Ailment instance not found.'] };
  const extra = instance.ailmentId === 'ailment-pinned-by-pine' && !input.hasSteelAxe && !input.hasLocalSettlementHelp ? 1 : 0;
  const timerIds = new Set(instance.timerIds);
  const timers = input.state.patient.timers.map(timer => {
    if (!timerIds.has(timer.id) || timer.status !== 'active') return timer;
    const current = Math.max(0, timer.current - input.decreaseBy - extra);
    return { ...timer, current, status: current === 0 ? 'expired' as const : 'active' as const };
  });
  const current = timers.find(timer => timerIds.has(timer.id))?.current ?? 0;
  const patient = {
    ...input.state.patient,
    timers,
    ailments: input.state.patient.ailments.map(row => {
      if (row.id !== instance.id) return row;
      const quagmire = row.ailmentId === 'ailment-quagmire-s-scale' && current <= 2;
      return {
        ...row,
        status: current === 0 ? 'failed' as const : row.status,
        failureResolved: current === 0,
        specialState: {
          ...row.specialState,
          ...(quagmire ? { poisonRequirement: 3, forcesOverstay: current === 0 } : {})
        },
        effectIds: [...row.effectIds, input.transactionId]
      };
    })
  };
  return {
    status: 'resolved',
    value: { ...input.state, patient, appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId] },
    messages: extra ? ['Pinned by Pine decreased this Timer by 1 additional point.'] : []
  };
};

export const resolveAilmentFailureEffect = (input: {
  transactionId: string;
  state: AilmentEffectRuntimeState;
  ailmentInstanceId: string;
  season: Season;
  locationId: string;
}): AilmentEffectResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) return { status: 'invalid', value: null, messages: ['Ailment failure transaction is missing or already applied.'] };
  const instance = input.state.patient.ailments.find(row => row.id === input.ailmentInstanceId);
  if (!instance?.ailmentId) return { status: 'invalid', value: null, messages: ['Ailment instance not found.'] };
  const conditions = [...input.state.worldConditions];
  if (instance.ailmentId === 'ailment-groundhog-syndrome') {
    conditions.push(input.season === 'Spring' || input.season === 'Summer'
      ? `groundhog:no-barter-social:${input.locationId}:until-next-season`
      : `groundhog:no-plant-insect-forage:${input.locationId}:radius-2:until-next-season`);
  }
  if (instance.ailmentId === 'ailment-soured-dough') {
    const siblings = input.state.patient.ailments.filter(row => row.ailmentId === instance.ailmentId);
    if (siblings.every(row => row.status !== 'treated')) conditions.push('soured-dough:next-remedy-trinkets-zero');
  }
  if (instance.ailmentId === 'ailment-stingshock') conditions.push(`stingshock:bee-hive-unavailable:${input.locationId}`);
  if (instance.ailmentId === 'ailment-wingbreak') conditions.push(`wingbreak:barter-rarity-plus-2:${input.season}`);
  return {
    status: 'manual',
    value: {
      ...input.state,
      patient: updateInstance(input.state.patient, instance.id, row => ({
        ...row,
        failureResolved: true,
        consequenceResolved: true,
        effectIds: [...row.effectIds, input.transactionId]
      })),
      worldConditions: [...new Set(conditions)],
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
    },
    messages: ['Automatic persistent effects were applied. Complete the printed narrative Consequence in the Journal.']
  };
};
