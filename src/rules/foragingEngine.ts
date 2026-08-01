import { getRuleCardValue, type RuleCard } from './cards';
import { findEncounter } from './data/encounters';
import { REAGENT_BY_ID, REAGENTS } from './data/reagents';
import type { EngineInventoryItem, GameplayLocationType } from './gameplay';
import type { Availability, EncounterDefinition, ReagentDefinition, ReagentPreparation, Season, TravelRegion } from './types';

export interface ForagingPartSelection {
  preparationId: string;
  quantity: number;
}

export interface ForagingEngineState {
  season: Season;
  currentRegion: Exclude<TravelRegion, 'Soar'>;
  currentLocationType: GameplayLocationType;
  foragingPoints: number;
  inventory: EngineInventoryItem[];
  toolIds: string[];
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
  skipEncounter?: boolean;
  reagentTypeFilter?: ReagentDefinition['type'];
  source?: 'standard' | 'companion-wasp';
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
}

export interface ForagingEngineResolution {
  status: 'resolved' | 'manual' | 'invalid';
  value: ForagingEngineOutcome | null;
  messages: string[];
}

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
  const rarity = calculateCanonicalForageRarity(
    reagent,
    input.forageRegion,
    input.state.season,
    input.state.toolIds,
    input.rarityModifiers || 0
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
  const cardValue = getRuleCardValue(input.card, 'forage');
  const candidates = REAGENTS
    .filter(reagent => !input.reagentTypeFilter || reagent.type === input.reagentTypeFilter)
    .map(reagent => candidateFor(reagent, input, cardValue))
    .filter((candidate): candidate is ForagingCandidate => candidate !== null);
  const encounter = input.skipEncounter ? null : findEncounter({
    encounterType: 'foraging',
    region: input.forageRegion,
    card: input.card,
    season: input.state.season
  });
  if (!input.skipEncounter && !encounter) return { status: 'invalid', value: null, messages: ['No canonical Foraging Encounter matches this draw.'] };

  if (!input.targetReagentId) {
    const gain = candidates.length === 0 ? 1 : 0;
    return {
      status: encounter?.support === 'implemented' ? 'resolved' : 'manual',
      value: {
        transactionId: input.transactionId,
        nextState: { ...input.state, foragingPoints: input.state.foragingPoints + gain },
        candidates,
        selectedReagentId: null,
        gatheredItems: [],
        foragingPointsSpent: 0,
        foragingPointsGained: gain,
        timerCostAfterEncounter: input.locationRelation === 'adjacent' ? 2 : 1,
        encounter
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
      return {
        status: encounter?.support === 'implemented' || input.skipEncounter ? 'resolved' : 'manual',
        value: {
          transactionId: input.transactionId,
          nextState: { ...input.state, foragingPoints: input.state.foragingPoints + 1 },
          candidates,
          selectedReagentId: reagent.id,
          gatheredItems: [],
          foragingPointsSpent: 0,
          foragingPointsGained: 1,
          timerCostAfterEncounter: input.locationRelation === 'adjacent' ? 2 : 1,
          encounter
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
  const timerCost = (input.locationRelation === 'adjacent' ? 2 : 1) + Math.max(0, partCount - 1);
  return {
    status: encounter?.support === 'implemented' || input.skipEncounter ? 'resolved' : 'manual',
    value: {
      transactionId: input.transactionId,
      nextState: {
        ...input.state,
        foragingPoints: input.state.foragingPoints - pointsSpent,
        inventory: [...input.state.inventory, ...gatheredItems]
      },
      candidates,
      selectedReagentId: reagent.id,
      gatheredItems,
      foragingPointsSpent: pointsSpent,
      foragingPointsGained: 0,
      timerCostAfterEncounter: timerCost,
      encounter
    },
    messages: encounter?.support === 'implemented' || input.skipEncounter
      ? []
      : ['Parts are gathered. Resolve the printed Foraging Encounter before applying Timer cost.']
  };
};
