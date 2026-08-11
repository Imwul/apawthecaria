import { getRuleCardValue, type RuleCard } from './cards';
import { findEncounter } from './data/encounters';
import { REAGENT_BY_ID, REAGENTS } from './data/reagents';
import type { EngineInventoryItem, GameplayLocationType } from './gameplay';
import type { PatientState } from './state';
import type { Availability, EncounterDefinition, ReagentDefinition, ReagentPreparation, Season, TravelRegion } from './types';
import { resolveToolEffects, type CanonicalToolState } from './toolEngine';

export interface ForagingPartSelection {
  preparationId: string;
  quantity: number;
}

export interface ForagingEngineState {
  season: Season;
  currentRegion: Exclude<TravelRegion, 'Soar'>;
  currentLocationType: GameplayLocationType;
  adjacentRegions?: Array<Exclude<TravelRegion, 'Soar'>>;
  foragingPoints: number;
  inventory: EngineInventoryItem[];
  toolIds: string[];
  tools?: CanonicalToolState[];
  patient?: PatientState | null;
}

export interface ForagingEngineInput {
  transactionId: string;
  state: ForagingEngineState;
  forageRegion: Exclude<TravelRegion, 'Soar'>;
  locationRelation: 'current' | 'adjacent';
  card: RuleCard;
  targetReagentId?: string;
  parts?: ForagingPartSelection[];
  spendForagingPoints?: boolean;
  rarityModifiers?: number;
  typeRarityModifiers?: Partial<Record<ReagentDefinition['type'], number>>;
  alwaysAvailableReagentIds?: string[];
  skipEncounter?: boolean;
  reagentTypeFilter?: ReagentDefinition['type'];
  source?: 'standard' | 'companion-wasp' | 'familiar-independent' | 'barrow-delve';
  gatherTimerId?: string;
  weatherProtectionActive?: boolean;
}

export interface ForagingCandidate {
  reagentId: string;
  canonicalName: string;
  rarity: number;
  cardSuccess: boolean;
  automaticWithForagingPoints: boolean;
  gapCost: number;
}

export interface ForagingEngineOutcome {
  transactionId: string;
  nextState: ForagingEngineState;
  candidates: ForagingCandidate[];
  selectedReagentId: string | null;
  gatheredItems: EngineInventoryItem[];
  foragingPointsSpent: number;
  foragingPointsGained: number;
  timerCostAfterEncounter: number;
  encounter: EncounterDefinition | null;
  ignoredNegativeEncounterEffects: boolean;
  ailmentInterruption: 'hunted-behemoth' | null;
}

export interface ForagingEngineResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: ForagingEngineOutcome | null;
  messages: string[];
}

const applyForagingPointTool = (input: ForagingEngineInput, baseGain: number) => {
  if (baseGain <= 0 || !input.state.tools?.length) return { gain: baseGain, tools: input.state.tools };
  const resolved = resolveToolEffects({
    transactionId: `${input.transactionId}:tool:foraging-points`,
    phase: 'foraging',
    trigger: 'forage',
    tools: input.state.tools,
    rulesetId: 'original-1e-3p'
  });
  return { gain: baseGain + resolved.foragingPoints, tools: resolved.tools };
};

const increaseTimers = (patient: PatientState, timerIds: ReadonlySet<string>, amount: number): PatientState => ({
  ...patient,
  timers: patient.timers.map(timer => timer.status === 'active' && timerIds.has(timer.id)
    ? { ...timer, current: timer.current + amount, maximum: timer.maximum + amount }
    : timer)
});

const applyGatherTools = (
  input: ForagingEngineInput,
  preparations: readonly ReagentPreparation[]
): { tools: CanonicalToolState[] | undefined; patient: PatientState | null | undefined; error?: string } => {
  if (!input.state.tools?.length || !input.state.patient) return { tools: input.state.tools, patient: input.state.patient };
  let tools = input.state.tools;
  let patient = input.state.patient;
  const methods = preparations.map(preparation => preparation.method.toUpperCase());
  const activeTimerIds = patient.timers.filter(timer => timer.status === 'active').map(timer => timer.id);

  if (methods.some(method => method.includes('GRIND') || method.includes('CRUSH'))) {
    const selected = tools.filter(tool => tool.upgradeId === 'steel-lined-mortar').map(tool => tool.instanceId);
    if (selected.length > 0) {
      const resolved = resolveToolEffects({
        transactionId: `${patient.id}:tool:steel-lined-mortar:gather`,
        phase: 'foraging', trigger: 'gather', tools, selectedToolInstanceIds: selected,
        rulesetId: 'original-1e-3p'
      });
      tools = resolved.tools;
      if (resolved.timerDelta > 0) patient = increaseTimers(patient, new Set(activeTimerIds), resolved.timerDelta);
    }
  }

  if (methods.some(method => method.includes('BOIL') || method.includes('BREW'))) {
    const selected = tools.filter(tool => tool.upgradeId === 'efficient-copper-kettle').map(tool => tool.instanceId);
    if (selected.length > 0) {
      const timerId = input.gatherTimerId || (activeTimerIds.length === 1 ? activeTimerIds[0] : null);
      if (!timerId || !activeTimerIds.includes(timerId)) return { tools, patient, error: 'Efficient Copper Kettle requires one active Timer selection.' };
      const resolved = resolveToolEffects({
        transactionId: `${input.transactionId}:tool:efficient-copper-kettle`,
        phase: 'foraging', trigger: 'gather', tools, selectedToolInstanceIds: selected,
        rulesetId: 'original-1e-3p'
      });
      tools = resolved.tools;
      if (resolved.timerDelta > 0) patient = increaseTimers(patient, new Set([timerId]), resolved.timerDelta);
    }
  }
  return { tools, patient };
};

const availabilityModifier = (availability: Availability): number | null => {
  if (availability === 'Unavailable') return null;
  return availability === 'Rare' ? 3 : 0;
};

const builtInToolModifier = (reagent: ReagentDefinition, region: TravelRegion, toolIds: readonly string[]): number => {
  let modifier = 0;
  if (region === 'Loch' && toolIds.includes('bark-coracle')) modifier -= 2;
  if (toolIds.includes('fine-spidersilk-net') && (reagent.type === 'INSECT' || reagent.canonicalName === 'Small Fish')) modifier -= 3;
  return modifier;
};

export const calculateCanonicalForageRarity = (
  reagent: ReagentDefinition,
  region: Exclude<TravelRegion, 'Soar'>,
  season: Season,
  toolIds: readonly string[],
  additionalModifier = 0
): number | null => {
  const regionModifier = availabilityModifier(reagent.regionAvailability[region]);
  const seasonModifier = availabilityModifier(reagent.seasonAvailability[season]);
  if (regionModifier === null || seasonModifier === null) return null;
  return Math.max(1, reagent.baseRarity + regionModifier + seasonModifier + builtInToolModifier(reagent, region, toolIds) + additionalModifier);
};

const hasPreparationTools = (preparation: ReagentPreparation, toolIds: readonly string[]): boolean =>
  preparation.requiredTools.every(tool => tool === 'none' || toolIds.includes(tool));

const candidateFor = (
  reagent: ReagentDefinition,
  input: ForagingEngineInput,
  cardValue: number
): ForagingCandidate | null => {
  const alwaysAvailable = input.alwaysAvailableReagentIds?.includes(reagent.id);
  const rarity = alwaysAvailable
    ? (() => {
        const seasonModifier = availabilityModifier(reagent.seasonAvailability[input.state.season]);
        return seasonModifier === null ? null : Math.max(1, reagent.baseRarity + seasonModifier
          + builtInToolModifier(reagent, input.forageRegion, input.state.toolIds)
          + (input.rarityModifiers || 0) + (input.typeRarityModifiers?.[reagent.type] || 0));
      })()
    : calculateCanonicalForageRarity(
        reagent,
        input.forageRegion,
        input.state.season,
        input.state.toolIds,
        (input.rarityModifiers || 0) + (input.typeRarityModifiers?.[reagent.type] || 0)
      );
  if (rarity === null) return null;
  return {
    reagentId: reagent.id,
    canonicalName: reagent.canonicalName,
    rarity,
    cardSuccess: cardValue >= rarity,
    automaticWithForagingPoints: cardValue < rarity && input.state.foragingPoints >= rarity,
    gapCost: Math.max(0, rarity - cardValue)
  };
};

export const resolveForagingEngine = (input: ForagingEngineInput): ForagingEngineResolution => {
  if (!input.transactionId) return { status: 'invalid', value: null, messages: ['Foraging requires a transaction ID.'] };
  if (input.source !== 'companion-wasp' && input.locationRelation === 'current' && !['Wilds', 'Titan Ruin', 'Behemoth Barrow'].includes(input.state.currentLocationType)) {
    return { status: 'invalid', value: null, messages: ['Current-location Foraging is only allowed in Wilds, Titan Ruins, and Behemoth Barrows.'] };
  }
  if (input.locationRelation === 'adjacent' && input.state.adjacentRegions && !input.state.adjacentRegions.includes(input.forageRegion)) {
    return { status: 'invalid', value: null, messages: ['Adjacent Foraging requires a Region connected by the canonical map graph.'] };
  }
  const cardValue = getRuleCardValue(input.card, 'forage');
  const hunted = input.locationRelation === 'current' && typeof input.card !== 'number' && input.card.suit === '♠'
    ? input.state.patient?.ailments.find(ailment => ailment.status === 'active' && ailment.ailmentId === 'ailment-hunted')
    : null;
  if (hunted && input.state.patient) {
    const timerIds = new Set(hunted.timerIds);
    const timers = input.state.patient.timers.map(timer => {
      if (!timerIds.has(timer.id) || timer.status !== 'active') return timer;
      const current = Math.max(0, timer.current - 1);
      return { ...timer, current, status: current === 0 ? 'expired' as const : 'active' as const };
    });
    const patient = {
      ...input.state.patient,
      timers,
      ailments: input.state.patient.ailments.map(ailment => ailment.id === hunted.id
        ? {
            ...ailment,
            status: timers.some(timer => timerIds.has(timer.id) && timer.status === 'expired') ? 'failed' as const : ailment.status,
            failureResolved: timers.some(timer => timerIds.has(timer.id) && timer.status === 'expired') || ailment.failureResolved,
            effectIds: [...ailment.effectIds, `${input.transactionId}:hunted`]
          }
        : ailment)
    };
    return {
      status: 'resolved',
      value: {
        transactionId: input.transactionId,
        nextState: { ...input.state, patient },
        candidates: [], selectedReagentId: null, gatheredItems: [], foragingPointsSpent: 0, foragingPointsGained: 0,
        timerCostAfterEncounter: 0, encounter: null, ignoredNegativeEncounterEffects: false,
        ailmentInterruption: 'hunted-behemoth'
      },
      messages: ['Hunted: the Behemoth appeared on a Spade, the Foraging event was abandoned, and the Ailment Timer decreased by 1.']
    };
  }
  const candidates = REAGENTS
    .filter(reagent => !input.reagentTypeFilter || reagent.type === input.reagentTypeFilter)
    .map(reagent => candidateFor(reagent, input, cardValue))
    .filter((candidate): candidate is ForagingCandidate => candidate !== null);
  const skipsPrintedEncounter = input.skipEncounter || input.source === 'familiar-independent';
  const encounter = skipsPrintedEncounter ? null : findEncounter({
    encounterType: 'foraging',
    region: input.forageRegion,
    card: input.card,
    season: input.state.season
  });
  const ignoredNegativeEncounterEffects = Boolean(input.weatherProtectionActive && encounter?.tags?.includes('Weather'));
  if (!skipsPrintedEncounter && !encounter) return { status: 'invalid', value: null, messages: ['No canonical Foraging Encounter matches this draw.'] };

  if (!input.targetReagentId) {
    const toolGain = applyForagingPointTool(input, candidates.length === 0 ? 1 : 0);
    const gain = toolGain.gain;
    return {
      status: encounter?.support === 'implemented' || skipsPrintedEncounter ? 'resolved' : 'manual',
      value: {
        transactionId: input.transactionId,
        nextState: { ...input.state, tools: toolGain.tools, foragingPoints: input.state.foragingPoints + gain },
        candidates,
        selectedReagentId: null,
        gatheredItems: [],
        foragingPointsSpent: 0,
        foragingPointsGained: gain,
        timerCostAfterEncounter: input.source === 'familiar-independent' ? 0 : input.locationRelation === 'adjacent' ? 2 : 1,
        encounter,
        ignoredNegativeEncounterEffects,
        ailmentInterruption: null
      },
      messages: candidates.length === 0
        ? ['No Reagent is available for this draw; gain 1 Foraging Point.']
        : ['Choose one Reagent, then choose one or more Parts from that Reagent.']
    };
  }

  const reagent = REAGENT_BY_ID.get(input.targetReagentId);
  const candidate = candidates.find(row => row.reagentId === input.targetReagentId);
  if (!reagent || !candidate) return { status: 'invalid', value: null, messages: ['The selected Reagent is unavailable in this Region or Season.'] };
  const selections = input.parts || [];
  if (selections.length === 0 || selections.some(selection => !Number.isInteger(selection.quantity) || selection.quantity <= 0)) {
    return { status: 'invalid', value: null, messages: ['Gather at least one valid Part.'] };
  }
  const selectedPreparations = selections.map(selection => ({
    selection,
    preparation: reagent.preparations.find(preparation => preparation.id === selection.preparationId)
  }));
  if (selectedPreparations.some(row => !row.preparation)) {
    return { status: 'invalid', value: null, messages: ['Every selected Part must belong to the chosen Reagent.'] };
  }
  const missingTool = selectedPreparations.find(row => !hasPreparationTools(row.preparation!, input.state.toolIds));
  if (missingTool) {
    return { status: 'invalid', value: null, messages: [`Missing Tool for ${missingTool.preparation!.name}: ${missingTool.preparation!.requiredTools.join(', ')}`] };
  }

  let pointsSpent = 0;
  const succeedsWithoutSpend = candidate.cardSuccess || candidate.automaticWithForagingPoints;
  if (!succeedsWithoutSpend) {
    if (!input.spendForagingPoints || input.state.foragingPoints < candidate.gapCost) {
      const toolGain = applyForagingPointTool(input, 1);
      return {
        status: encounter?.support === 'implemented' || skipsPrintedEncounter ? 'resolved' : 'manual',
        value: {
          transactionId: input.transactionId,
          nextState: { ...input.state, tools: toolGain.tools, foragingPoints: input.state.foragingPoints + toolGain.gain },
          candidates,
          selectedReagentId: reagent.id,
          gatheredItems: [],
          foragingPointsSpent: 0,
          foragingPointsGained: toolGain.gain,
          timerCostAfterEncounter: input.source === 'familiar-independent' ? 0 : input.locationRelation === 'adjacent' ? 2 : 1,
          encounter,
          ignoredNegativeEncounterEffects,
          ailmentInterruption: null
        },
        messages: [`Card ${cardValue} is below Rarity ${candidate.rarity}. Foraging failed and gained 1 Foraging Point.`]
      };
    }
    pointsSpent = candidate.gapCost;
  }

  const gatheredItems = selectedPreparations.flatMap(({ selection, preparation }) =>
    Array.from({ length: selection.quantity }, (_, index): EngineInventoryItem => ({
      id: `${input.transactionId}:${preparation!.id}:${index + 1}`,
      name: `${reagent.canonicalName} (${preparation!.name}, ${preparation!.method})`,
      type: 'reagent',
      weight: preparation!.weight,
      canonicalReagentId: reagent.id,
      preparationId: preparation!.id,
      usesRemaining: preparation!.uses,
      ruinedWhenSoaked: true
    }))
  );
  const partCount = gatheredItems.length;
  const timerCost = input.source === 'familiar-independent'
    ? 0
    : (input.locationRelation === 'adjacent' ? 2 : 1) + Math.max(0, partCount - 1);
  const gatherTools = applyGatherTools(input, selectedPreparations.map(row => row.preparation!));
  if (gatherTools.error) return { status: 'invalid', value: null, messages: [gatherTools.error] };
  return {
    status: encounter?.support === 'implemented' || skipsPrintedEncounter ? 'resolved' : 'manual',
    value: {
      transactionId: input.transactionId,
      nextState: {
        ...input.state,
        foragingPoints: input.state.foragingPoints - pointsSpent,
        inventory: [...input.state.inventory, ...gatheredItems],
        tools: gatherTools.tools,
        patient: gatherTools.patient
      },
      candidates,
      selectedReagentId: reagent.id,
      gatheredItems,
      foragingPointsSpent: pointsSpent,
      foragingPointsGained: 0,
      timerCostAfterEncounter: timerCost,
      encounter,
      ignoredNegativeEncounterEffects,
      ailmentInterruption: null
    },
    messages: encounter?.support === 'implemented' || skipsPrintedEncounter
      ? []
      : ['Parts are gathered. Resolve the printed Foraging Encounter before applying Timer cost.']
  };
};
