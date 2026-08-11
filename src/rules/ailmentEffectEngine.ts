import type { CardSuit, Season } from './types';
import type { PatientState } from './state';
import { TOOL_UPGRADE_BY_ID } from './data/upgrades';
import { equipToolUpgrade, toolWeight, type CanonicalToolState } from './toolEngine';

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

export interface BadIdeaOutcomeRuntimeState {
  tools: CanonicalToolState[];
  appliedTransactionIds: string[];
}

export type BadIdeaOutcomeChoice =
  | { kind: 'upgrade-basic-tool'; toolInstanceId: string; upgradeId: string }
  | { kind: 'lighten-tool'; toolInstanceId: string };

export interface BadIdeaOutcomeResolution {
  status: 'resolved' | 'invalid';
  value: BadIdeaOutcomeRuntimeState | null;
  messages: string[];
}

export const resolveBadIdeaOutcomeEffect = (input: {
  transactionId: string;
  state: BadIdeaOutcomeRuntimeState;
  choice: BadIdeaOutcomeChoice;
}): BadIdeaOutcomeResolution => {
  if (!input.transactionId || input.state.appliedTransactionIds.includes(input.transactionId)) {
    return { status: 'invalid', value: null, messages: ['Bad Idea outcome transaction is missing or already applied.'] };
  }
  const target = input.state.tools.find(tool => tool.instanceId === input.choice.toolInstanceId && !tool.broken && !tool.consumed);
  if (!target) return { status: 'invalid', value: null, messages: ['Choose an available Tool for Inspiration.'] };

  let changed: CanonicalToolState;
  if (input.choice.kind === 'upgrade-basic-tool') {
    const upgrade = TOOL_UPGRADE_BY_ID.get(input.choice.upgradeId);
    if (target.upgradeId || !upgrade || upgrade.baseToolId !== target.toolId) {
      return { status: 'invalid', value: null, messages: ['The selected upgrade does not match an unmodified Basic Tool.'] };
    }
    changed = equipToolUpgrade(target, upgrade.id);
  } else {
    const currentWeight = toolWeight(target);
    if (currentWeight <= 0) return { status: 'invalid', value: null, messages: ['A weightless Tool cannot be lightened further.'] };
    changed = {
      ...target,
      weightAdjustment: (target.weightAdjustment || 0) - Math.min(1 / 3, currentWeight)
    };
  }
  changed = { ...changed, appliedEffectIds: [...changed.appliedEffectIds, input.transactionId] };

  return {
    status: 'resolved',
    value: {
      tools: input.state.tools.map(tool => tool.instanceId === changed.instanceId ? changed : tool),
      appliedTransactionIds: [...input.state.appliedTransactionIds, input.transactionId]
    },
    messages: []
  };
};

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
      specialState: { ...row.specialState, diagnosisCardSuit: input.cardSuit, trip: badTrip ? 'bad' : 'good', additionalRequirements: badTrip ? [{ tag: 'WOUND', threshold: 1 }] : [] },
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
  if (patient.ailments.every(row => row.status !== 'active')) patient = { ...patient, status: 'departed' };
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
