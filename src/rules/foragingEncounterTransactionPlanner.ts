import { REAGENT_BY_ID, REAGENT_BY_NAME } from './data/reagents';
import { TOOL_BY_ID } from './data/tools';
import {
  FORAGING_ENCOUNTER_IDS,
  MEEK_ENCOUNTER_IDS,
  TRAPPED_ENCOUNTER_IDS,
  canonicalEncounterPartCandidates,
  type EncounterCardResult,
  type ForagingEncounterTransactionState
} from './foragingEncounterTransactions';
import {
  FORAGING_ENCOUNTER_TRANSACTION_CODES,
  type ForagingEncounterTransactionCommand
} from './foragingEncounterTransactionDispatcher';
import type { ReagentDefinition, RuleTag } from './types';

export interface ForagingEncounterPromptOption {
  value: string;
  label: string;
}

export interface ForagingEncounterPromptRequest {
  title: string;
  message: string;
  options?: ForagingEncounterPromptOption[];
  defaultValue?: string;
}

export type ForagingEncounterPrompt = (request: ForagingEncounterPromptRequest) => Promise<string | null>;

export interface ForagingEncounterPlanningContext {
  encounterId: string;
  choiceId?: string;
  transactionId: string;
  state: ForagingEncounterTransactionState;
  secondaryCards: readonly EncounterCardResult[];
  locationId: string;
  calendarDaysTotal: number;
  daysMarkedAtEncounterStart: number;
  companionCapacity: number;
  locationOptions?: ForagingEncounterPromptOption[];
}

export type ForagingEncounterPlan =
  | { status: 'planned'; command: ForagingEncounterTransactionCommand }
  | { status: 'not-applicable' }
  | { status: 'cancelled' }
  | { status: 'invalid'; message: string };

const invalid = (message: string): ForagingEncounterPlan => ({ status: 'invalid', message });
const cancelled = (): ForagingEncounterPlan => ({ status: 'cancelled' });

const partKey = (reagentId: string, preparationId: string): string => `${reagentId}|${preparationId}`;
const parsePartKey = (value: string): { reagentId: string; preparationId: string } | null => {
  const separator = value.indexOf('|');
  if (separator <= 0 || separator === value.length - 1) return null;
  return { reagentId: value.slice(0, separator), preparationId: value.slice(separator + 1) };
};

const partOptions = (candidates: ReturnType<typeof canonicalEncounterPartCandidates>): ForagingEncounterPromptOption[] => candidates.map(candidate => ({
  value: partKey(candidate.reagentId, candidate.preparationId),
  label: candidate.label
}));

const choosePart = async (
  prompt: ForagingEncounterPrompt,
  title: string,
  message: string,
  candidates: ReturnType<typeof canonicalEncounterPartCandidates>
): Promise<{ reagentId: string; preparationId: string } | null | false> => {
  if (candidates.length === 0) return false;
  const options = partOptions(candidates);
  const selected = await prompt({ title, message, options, defaultValue: options[0].value });
  if (selected === null) return null;
  return parsePartKey(selected) || false;
};

const chooseOne = async (
  prompt: ForagingEncounterPrompt,
  title: string,
  message: string,
  options: ForagingEncounterPromptOption[]
): Promise<string | null | false> => {
  if (options.length === 0) return false;
  const selected = await prompt({ title, message, options, defaultValue: options[0].value });
  if (selected === null) return null;
  return options.some(option => option.value === selected) ? selected : false;
};

const activeTimerOptions = (state: ForagingEncounterTransactionState): ForagingEncounterPromptOption[] => state.patient?.timers
  .filter(timer => timer.status === 'active')
  .map((timer, index) => ({ value: timer.id, label: `타이머 ${index + 1} · ${timer.current}/${timer.maximum}` })) || [];

const card = (cards: readonly EncounterCardResult[], index: number, label: string): EncounterCardResult | ForagingEncounterPlan => cards[index]
  ? cards[index]
  : invalid(`${label} 카드가 필요합니다.`);

const base = (context: ForagingEncounterPlanningContext) => ({
  transactionId: `${context.transactionId}:typed-foraging-effect`,
  encounterId: context.encounterId,
  expectedRevision: context.state.revision,
  state: context.state
});

const allBagUnitIds = (state: ForagingEncounterTransactionState): string[] => state.inventory.flatMap(item =>
  Array.from({ length: Math.max(1, Math.floor(Number(item.quantity) || 1)) }, () => item.id)
);

const toolOptions = (predicate: (toolId: string) => boolean = () => true): ForagingEncounterPromptOption[] => [...TOOL_BY_ID.values()]
  .filter(tool => predicate(tool.id))
  .map(tool => ({ value: tool.id, label: tool.canonicalName }));

/**
 * Converts the printed choice and already-drawn cards into one typed command.
 * It asks only for genuine player selections (which Part, Tool, Timer, or
 * destination), never for values the campaign already knows.
 */
export const planForagingEncounterTransaction = async (
  context: ForagingEncounterPlanningContext,
  prompt: ForagingEncounterPrompt
): Promise<ForagingEncounterPlan> => {
  const inputBase = base(context);
  const choiceId = context.choiceId || '';

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.rightPlaceWrongTime) {
    if (choiceId === 'do-not-intervene') return { status: 'not-applicable' };
    if (choiceId === 'archer') return {
      status: 'planned',
      command: { code: FORAGING_ENCOUNTER_TRANSACTION_CODES.rightPlaceArcher, input: { ...inputBase, choice: 'archer' } }
    };
    if (choiceId !== 'vigilante') return invalid('Right Place, Wrong Time 선택지를 먼저 고르세요.');
    const playerCard = card(context.secondaryCards, 0, '약제사');
    const robberCard = card(context.secondaryCards, 1, '강도');
    if ('status' in playerCard) return playerCard;
    if ('status' in robberCard) return robberCard;
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.rightPlaceVigilante,
      input: { ...inputBase, choice: 'vigilante', playerCard, robberCard }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.friendInNeed) {
    if (choiceId === 'keep-to-yourself') return { status: 'not-applicable' };
    if (choiceId !== 'help-your-guildmate') return invalid('Friend in Need 선택지를 먼저 고르세요.');
    const drawn = card(context.secondaryCards, 0, '영약재 희귀도');
    if ('status' in drawn) return drawn;
    const selectedPart = await choosePart(prompt, 'Friend in Need · 영약재', `Forest에서 Base Rarity가 정확히 ${drawn.value}인 부위 하나를 고르세요.`, canonicalEncounterPartCandidates({ region: 'Forest', exactRarity: drawn.value }));
    if (selectedPart === null) return cancelled();
    if (!selectedPart) return invalid('이 카드 값에 맞는 Forest 영약재 부위가 없습니다.');
    const timerId = await chooseOne(prompt, 'Friend in Need · 타이머', '1 줄일 활성 질환 타이머를 고르세요.', activeTimerOptions(context.state));
    if (timerId === null) return cancelled();
    if (!timerId) return invalid('줄일 활성 질환 타이머가 없습니다.');
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.friendInNeed,
      input: { ...inputBase, choice: 'help', card: drawn, ...selectedPart, timerId }
    } };
  }

  if (context.encounterId === 'foraging-forest-6' && choiceId === 'choose-bug-reagent') {
    const reagentId = await chooseOne(prompt, '썩은 통나무 · 벌레 영약재', '한 영약재를 고르면 서로 다른 모든 물리적 부위를 하나씩 얻습니다.', ['Beetles', 'Maggots', 'Wasps'].flatMap(name => {
      const reagent = REAGENT_BY_NAME.get(name);
      return reagent ? [{ value: reagent.id, label: reagent.canonicalName }] : [];
    }));
    if (reagentId === null) return cancelled();
    if (!reagentId) return invalid('선택 가능한 벌레 영약재가 없습니다.');
    const reagent = REAGENT_BY_ID.get(reagentId)!;
    const partSelections: Array<{ preparationId: string }> = [];
    for (const partName of [...new Set(reagent.preparations.map(preparation => preparation.name))]) {
      const preparations = reagent.preparations.filter(preparation => preparation.name === partName);
      const preparationId = await chooseOne(prompt, `썩은 통나무 · ${partName}`, '이 부위를 기록할 조제법 하나를 고르세요.', preparations.map(preparation => ({
        value: preparation.id,
        label: `${preparation.name} · ${preparation.method}`
      })));
      if (preparationId === null) return cancelled();
      if (!preparationId) return invalid(`${partName}의 canonical 조제법을 고를 수 없습니다.`);
      partSelections.push({ preparationId });
    }
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.logKnocking,
      input: { ...inputBase, encounterId: 'foraging-forest-6', reagentId, partSelections }
    } };
  }

  // The Branded already uses the canonical immediate patient workflow in App;
  // routing it again here would duplicate the patient and condition.
  if (context.encounterId === FORAGING_ENCOUNTER_IDS.theBranded) return { status: 'not-applicable' };

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.alluringOdours && choiceId === 'follow-your-nose') {
    const drawn = card(context.secondaryCards, 0, 'Follow Your Nose');
    if ('status' in drawn) return drawn;
    if (drawn.value < 7) return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.alluringOdours,
      input: { ...inputBase, card: drawn }
    } };
    const selectedPart = await choosePart(prompt, 'Alluring Odours · FAIR 영약재', 'Forest에서 채집할 수 있고 FAIR를 제공하는 부위 하나를 고르세요.', canonicalEncounterPartCandidates({ region: 'Forest', requiredTag: 'FAIR' }));
    if (selectedPart === null) return cancelled();
    if (!selectedPart) return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.alluringOdours,
      input: { ...inputBase, card: drawn }
    } };
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.alluringOdours,
      input: { ...inputBase, card: drawn, ...selectedPart }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.riverSnatchers) {
    const drawn = card(context.secondaryCards, 0, 'River Snatchers');
    if ('status' in drawn) return drawn;
    const expectedBagUnitIds = allBagUnitIds(context.state);
    const selectedItemId = expectedBagUnitIds.length > 0
      ? expectedBagUnitIds[(drawn.value - 1) % expectedBagUnitIds.length]
      : undefined;
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.riverSnatchers,
      input: { ...inputBase, card: drawn, expectedBagUnitIds, selectedItemId }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.fabledBehemoth) {
    if (choiceId === 'row') {
      const drawn = card(context.secondaryCards, 0, 'Row');
      if ('status' in drawn) return drawn;
      let reagentItemId: string | undefined;
      if (drawn.suit === '♠') {
        const selected = await chooseOne(prompt, 'Fabled Behemoth · 영약재 손실', '급히 노를 젓다 떨어뜨릴 영약재 부위 하나를 고르세요.', context.state.inventory.filter(item => item.type === 'reagent').map(item => ({ value: item.id, label: item.name })));
        if (selected === null) return cancelled();
        if (!selected) return invalid('스페이드 결과로 버릴 영약재가 없습니다.');
        reagentItemId = selected;
      }
      return { status: 'planned', command: {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fabledBehemothRow,
        input: { ...inputBase, choice: 'row', card: drawn, reagentItemId }
      } };
    }
    if (choiceId === 'face-the-goliath') {
      const selectedPart = await choosePart(prompt, 'Fabled Behemoth · Titan 영약재', '수면 위로 떠오른 Titan 영약재 부위 하나를 고르세요.', canonicalEncounterPartCandidates({ types: ['TITAN'] }));
      if (selectedPart === null) return cancelled();
      if (!selectedPart) return invalid('선택 가능한 Titan 영약재 부위가 없습니다.');
      return { status: 'planned', command: {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.fabledBehemothFace,
        input: { ...inputBase, choice: 'face', ...selectedPart }
      } };
    }
    return invalid('Fabled Behemoth 선택지를 먼저 고르세요.');
  }

  // Fowl Fare is already represented entirely by implemented effects and
  // requirements in the canonical Encounter definition.
  if (context.encounterId === 'foraging-meadow-8') return { status: 'not-applicable' };

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.antHeist) {
    const firstCard = card(context.secondaryCards, 0, 'Snatch and Go');
    if ('status' in firstCard) return firstCard;
    const firstPart = await choosePart(prompt, 'Ant Heist · 첫 영약재', `Meadow의 Plant/Insect 중 Base Rarity ${firstCard.value} 이하인 부위 하나를 고르세요.`, canonicalEncounterPartCandidates({ region: 'Meadow', maximumRarity: firstCard.value, types: ['PLANT', 'INSECT'] }));
    if (firstPart === null) return cancelled();
    if (!firstPart) return invalid('첫 카드에 맞는 Meadow Plant/Insect 부위가 없습니다.');
    if (choiceId === 'snatch-and-go') return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.antHeist,
      input: { ...inputBase, firstCard, firstPart }
    } };
    if (choiceId !== 'going-for-broke') return invalid('Ant Heist 선택지를 먼저 고르세요.');
    const secondCard = card(context.secondaryCards, 1, 'Going for Broke');
    if ('status' in secondCard) return secondCard;
    if (secondCard.suit !== '♥') return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.antHeist,
      input: { ...inputBase, firstCard, firstPart, secondCard }
    } };
    const secondPart = await choosePart(prompt, 'Ant Heist · 두 번째 영약재', `하트 결과로 Base Rarity ${secondCard.value} 이하인 부위 하나를 더 고르세요.`, canonicalEncounterPartCandidates({ region: 'Meadow', maximumRarity: secondCard.value, types: ['PLANT', 'INSECT'] }));
    if (secondPart === null) return cancelled();
    if (!secondPart) return invalid('두 번째 카드에 맞는 Meadow Plant/Insect 부위가 없습니다.');
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.antHeist,
      input: { ...inputBase, firstCard, firstPart, secondCard, secondPart }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.projectLaunch) {
    if (choiceId !== 'watch-the-unveiling') return { status: 'not-applicable' };
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.projectLaunch,
      input: { ...inputBase, choice: 'watch' }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.mycophiliacs) {
    const marked = context.daysMarkedAtEncounterStart;
    const remaining = context.calendarDaysTotal - marked;
    let selectedPart: { reagentId: string; preparationId: string } | undefined;
    if (remaining > marked) {
      const chosen = await choosePart(prompt, 'Mycophiliacs · Mushroom', 'Early Bird로 얻을 Mushroom 영약재 부위 하나를 고르세요.', canonicalEncounterPartCandidates({ mushroomsOnly: true }));
      if (chosen === null) return cancelled();
      if (!chosen) return invalid('선택 가능한 Mushroom 영약재 부위가 없습니다.');
      selectedPart = chosen;
    }
    const beseech = choiceId === 'beseech';
    return { status: 'planned', command: {
      code: beseech ? FORAGING_ENCOUNTER_TRANSACTION_CODES.mycophiliacsBarter : FORAGING_ENCOUNTER_TRANSACTION_CODES.mycophiliacs,
      input: { ...inputBase, locationId: context.locationId, calendarDaysTotal: context.calendarDaysTotal, daysMarkedAtEncounterStart: marked, ...selectedPart, beseech: beseech || undefined }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.lifeSavingTransplant) {
    if (choiceId !== 'take') return { status: 'not-applicable' };
    const charcoal = REAGENT_BY_NAME.get('Doused Bonfires')?.preparations.find(preparation => preparation.name === 'Charcoal');
    const sheddings = REAGENT_BY_NAME.get('Animal Sheddings')?.preparations.find(preparation => /hair|fur/i.test(preparation.name));
    if (!charcoal || !sheddings) return invalid('Charcoal 또는 Animal Sheddings canonical 부위를 찾지 못했습니다.');
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.lifeSavingTransplant,
      input: { ...inputBase, charcoalPreparationId: charcoal.id, sheddingsPreparationId: sheddings.id }
    } };
  }

  if (context.encounterId === 'foraging-meadow-9-winter' && choiceId === 'begin-present-hunt') {
    if (context.secondaryCards.length < 3) return invalid('Sain De Claws 목표 카드 3장이 필요합니다.');
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.startSainDeClaws,
      input: { ...inputBase, encounterId: 'foraging-meadow-9-winter', locationId: context.locationId, targetCards: [context.secondaryCards[0], context.secondaryCards[1], context.secondaryCards[2]] }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.stickEmUp) {
    if (choiceId === 'play-it-safe') return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.stickEmUpSurrender,
      input: { ...inputBase, choice: 'play-safe' }
    } };
    if (choiceId !== 'scrap') return invalid("Stick 'Em Up! 선택지를 먼저 고르세요.");
    if (context.secondaryCards.length < 3) return invalid('Scrap 판정에는 자신 카드 1장과 강도 카드 2장이 필요합니다.');
    const mayUseCrossbow = context.state.inventory.some(item => item.canonicalToolId === 'crossbow')
      && context.state.inventory.some(item => item.canonicalToolId === 'bolts');
    const usedCrossbowExtraDraw = mayUseCrossbow && context.secondaryCards.length >= 4;
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.stickEmUpScrap,
      input: {
        ...inputBase,
        choice: 'scrap',
        playerCards: usedCrossbowExtraDraw ? [context.secondaryCards[0], context.secondaryCards[3]] : [context.secondaryCards[0]],
        robberCards: [context.secondaryCards[1], context.secondaryCards[2]],
        usedCrossbowExtraDraw
      }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.finalRestingPlace) {
    if (choiceId !== 'enter-the-chamber') return { status: 'not-applicable' };
    const drawn = card(context.secondaryCards, 0, 'Wailing Curse');
    if ('status' in drawn) return drawn;
    const hasThingamabob = context.state.inventory.some(item => item.canonicalToolId === 'titan-thingamabob')
      || context.state.tools.some(tool => tool.toolId === 'titan-thingamabob' && !tool.broken && !tool.consumed);
    // The printed failure branch ends here: without a Thingamabob the
    // Apothecary flees and never reaches the reward choice.
    if ((drawn.suit === '♣' || drawn.suit === '♠') && !hasThingamabob) return {
      status: 'planned',
      command: {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.finalRestingPlace,
        input: { ...inputBase, card: drawn, companionCapacity: context.companionCapacity }
      }
    };
    const rewardOptions: ForagingEncounterPromptOption[] = [
      ...(context.state.companions.length < context.companionCapacity ? [{ value: 'companion', label: 'Cranky Contraption 길동무' }] : []),
      { value: 'thingamabob', label: 'Titan Thingamabob' },
      ...partOptions(canonicalEncounterPartCandidates({ maximumRarity: 8, types: ['TITAN'] })).map(option => ({ ...option, value: `part:${option.value}` }))
    ];
    const reward = await chooseOne(prompt, 'Final Resting Place · 발견물', '방에 들어갔다면 발견물 하나를 고르세요.', rewardOptions);
    if (reward === null) return cancelled();
    if (!reward) return invalid('선택 가능한 발견물이 없습니다.');
    const rewardInput = reward === 'companion'
      ? { kind: 'companion' as const }
      : reward === 'thingamabob'
        ? { kind: 'thingamabob' as const }
        : (() => {
          const selected = parsePartKey(reward.slice('part:'.length));
          return selected ? { kind: 'reagent' as const, ...selected } : null;
        })();
    if (!rewardInput) return invalid('선택한 발견물을 canonical 데이터에서 찾지 못했습니다.');
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.finalRestingPlace,
      input: { ...inputBase, card: drawn, reward: rewardInput, companionCapacity: context.companionCapacity }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.whatRemains && choiceId === 'attend-to-the-remains') {
    const action = await chooseOne(prompt, 'What Remains · 무엇을 할까요?', '조사와 빌려 쓰기는 각각 선택할 수 있습니다.', [
      { value: 'investigate', label: '조사한다' },
      { value: 'borrow', label: 'Tool만 빌린다' },
      { value: 'both', label: '조사하고 Tool도 빌린다' },
      { value: 'leave', label: '아무것도 하지 않는다' }
    ]);
    if (action === null) return cancelled();
    if (!action || action === 'leave') return { status: 'not-applicable' };
    let investigateCard: EncounterCardResult | undefined;
    let homeLocationId: string | undefined;
    let borrowedToolId: string | undefined;
    if (action === 'investigate' || action === 'both') {
      const drawn = card(context.secondaryCards, 0, 'Investigate');
      if ('status' in drawn) return drawn;
      investigateCard = drawn;
      if (drawn.value > 6) {
        const location = await chooseOne(prompt, 'What Remains · 고향', '유품에서 알아낸 야수의 고향을 지도 위치 중에서 고르세요.', context.locationOptions || []);
        if (location === null) return cancelled();
        if (!location) return invalid('성공한 조사에 기록할 고향 위치가 없습니다.');
        homeLocationId = location;
      }
    }
    if (action === 'borrow' || action === 'both') {
      const selectedTool = await chooseOne(prompt, 'What Remains · Tool', '빌려 쓸 Tool 하나를 고르세요.', toolOptions());
      if (selectedTool === null) return cancelled();
      if (!selectedTool) return invalid('선택 가능한 canonical Tool이 없습니다.');
      borrowedToolId = selectedTool;
    }
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.whatRemains,
      input: { ...inputBase, card: investigateCard, homeLocationId, borrowedToolId }
    } };
  }

  if (context.encounterId === 'foraging-titan-6') {
    if (!['light', 'cameras', 'action'].includes(choiceId)) return invalid('Lock and Key 선택지를 먼저 고르세요.');
    if (choiceId === 'action') {
      const selectedPart = await choosePart(prompt, 'Lock and Key · Titan 영약재', '드러낼 Titan 영약재 부위 하나를 고르세요.', canonicalEncounterPartCandidates({ types: ['TITAN'] }));
      if (selectedPart === null) return cancelled();
      if (!selectedPart) return invalid('선택 가능한 Titan 영약재 부위가 없습니다.');
      return { status: 'planned', command: {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerAction,
        input: { ...inputBase, encounterId: 'foraging-titan-6', choice: 'action', locationId: context.locationId, ...selectedPart }
      } };
    }
    if (choiceId === 'light') return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerLight,
      input: { ...inputBase, encounterId: 'foraging-titan-6', choice: 'light', locationId: context.locationId }
    } };
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.titanPowerCameras,
      input: { ...inputBase, encounterId: 'foraging-titan-6', choice: 'cameras', locationId: context.locationId }
    } };
  }

  if ((TRAPPED_ENCOUNTER_IDS as readonly string[]).includes(context.encounterId)) {
    if (choiceId === 'open-says-me') return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.trapped,
      input: { ...inputBase, encounterId: context.encounterId as typeof TRAPPED_ENCOUNTER_IDS[number], choice: 'open-says-me' }
    } };
    if (choiceId === 'helping-hand') return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.trapped,
      input: { ...inputBase, encounterId: context.encounterId as typeof TRAPPED_ENCOUNTER_IDS[number], choice: 'helping-hand', locationId: context.locationId }
    } };
    if (choiceId !== 'rescue') return invalid('Trapped 선택지를 먼저 고르세요.');
    const drawn = card(context.secondaryCards, 0, 'Rescue');
    if ('status' in drawn) return drawn;
    const timerId = await chooseOne(prompt, 'Trapped · 타이머', '이번 구조 시도로 1 줄일 활성 타이머를 고르세요.', activeTimerOptions(context.state));
    if (timerId === null) return cancelled();
    if (!timerId) return invalid('줄일 활성 질환 타이머가 없습니다.');
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.trapped,
      input: { ...inputBase, encounterId: context.encounterId as typeof TRAPPED_ENCOUNTER_IDS[number], choice: 'rescue', card: drawn, timerId }
    } };
  }

  if ((MEEK_ENCOUNTER_IDS as readonly string[]).includes(context.encounterId)) {
    if (choiceId !== 'stunned' && choiceId !== 'burrowed') return invalid('The Meek Shall Inherit 선택지를 먼저 고르세요.');
    const allowedNames = choiceId === 'stunned'
      ? ['Beetles', 'Honeybees', 'Butterfly', 'Wasps']
      : ['Maggots', 'Slugs', 'Spiders'];
    const candidates = allowedNames.flatMap(name => {
      const reagent = REAGENT_BY_NAME.get(name);
      return reagent?.preparations.map(preparation => ({ reagentId: reagent.id, preparationId: preparation.id, label: `${reagent.canonicalName} · ${preparation.name} · ${preparation.method}` })) || [];
    });
    const selectedPart = await choosePart(prompt, 'The Meek Shall Inherit · 영약재', '발견한 영약재 부위 하나를 고르세요.', candidates);
    if (selectedPart === null) return cancelled();
    if (!selectedPart) return invalid('인쇄된 목록에서 선택 가능한 영약재 부위가 없습니다.');
    return { status: 'planned', command: {
      code: FORAGING_ENCOUNTER_TRANSACTION_CODES.meekShallInherit,
      input: { ...inputBase, encounterId: context.encounterId as typeof MEEK_ENCOUNTER_IDS[number], search: choiceId, ...selectedPart }
    } };
  }

  if (context.encounterId === FORAGING_ENCOUNTER_IDS.odoakMarket) {
    if (choiceId === 'delightful-indulgence') return { status: 'not-applicable' };
    if (choiceId === 'irresistible-bargain') {
      const carried = context.state.inventory.filter(item => item.type === 'tool' && item.canonicalToolId && TOOL_BY_ID.get(item.canonicalToolId)?.category !== 'basic');
      const sourceToolItemId = await chooseOne(prompt, 'Odoak Market · 내놓을 Tool', '교환할 비기본 Tool 하나를 고르세요.', carried.map(item => ({ value: item.id, label: item.name })));
      if (sourceToolItemId === null) return cancelled();
      if (!sourceToolItemId) return invalid('교환할 비기본 Tool이 없습니다.');
      const sourceToolId = carried.find(item => item.id === sourceToolItemId)?.canonicalToolId;
      const targetToolId = await chooseOne(prompt, 'Odoak Market · 받을 Tool', 'Tools 목록에서 다른 Tool 하나를 고르세요.', toolOptions(toolId => toolId !== sourceToolId));
      if (targetToolId === null) return cancelled();
      if (!targetToolId) return invalid('받을 canonical Tool을 고를 수 없습니다.');
      return { status: 'planned', command: {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.odoakMarket,
        input: { ...inputBase, encounterId: FORAGING_ENCOUNTER_IDS.odoakMarket, choice: 'irresistible-bargain', sourceToolItemId, targetToolId }
      } };
    }
    if (choiceId === 'impulse-purchase') {
      const reagentName = await prompt({ title: 'Odoak Market · Foreign Reagent', message: 'Foreign Reagent의 이름을 기록하세요.' });
      if (reagentName === null) return cancelled();
      if (!reagentName.trim()) return invalid('Foreign Reagent 이름이 필요합니다.');
      const reagentType = await chooseOne(prompt, 'Odoak Market · Type', '영약재 Type 하나를 고르세요.', ['PLANT', 'ANIMAL', 'INSECT', 'EARTH', 'TITAN'].map(value => ({ value, label: value })));
      if (reagentType === null) return cancelled();
      const tag = await chooseOne(prompt, 'Odoak Market · Tag', '이 영약재가 제공할 [TAG 2]의 Tag 하나를 고르세요.', ['ELSEWHERE', 'INSTINCT', 'JOY', 'MOOD', 'NERVES', 'INFECTION', 'PAIN', 'PARASITE', 'SENSES', 'SLEEP', 'BREATH', 'BURN', 'FEATHER', 'FUR', 'HIDE', 'POISON', 'SCALE', 'STOMACH', 'TEMPERATURE', 'WOUND', 'FAIR', 'FOUL'].map(value => ({ value, label: value })));
      if (tag === null) return cancelled();
      const preparationMethod = await prompt({ title: 'Odoak Market · 조제법', message: 'Preparation Method 하나를 기록하세요.' });
      if (preparationMethod === null) return cancelled();
      if (!reagentType || !tag || !preparationMethod.trim()) return invalid('Type, Tag, Preparation Method가 모두 필요합니다.');
      return { status: 'planned', command: {
        code: FORAGING_ENCOUNTER_TRANSACTION_CODES.odoakMarket,
        input: {
          ...inputBase,
          encounterId: FORAGING_ENCOUNTER_IDS.odoakMarket,
          choice: 'impulse-purchase',
          reagentName,
          reagentType: reagentType as ReagentDefinition['type'],
          tag: tag as RuleTag,
          preparationMethods: [preparationMethod]
        }
      } };
    }
  }

  return { status: 'not-applicable' };
};
