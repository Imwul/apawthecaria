import { describe, expect, it } from 'vitest';
import { PRINTED_EFFECT_REGISTRY } from '../rules/printedEffects';
import { ENCOUNTERS } from '../rules/data/encounters';
import generatedTranslations from './printedEffectKo.generated.json';
import {
  localizeEncounterDisplayText,
  localizeEncounterTitle,
  localizeManualEffectLine,
  localizeManualEffectOption,
  localizeManualEffectText,
  localizeManualEffectValue,
  localizeManualJournalText,
  localizeManualJournalTitle
} from './manualEffectKo';

const displayedManualStrings = (effect: (typeof PRINTED_EFFECT_REGISTRY)[number]): string[] => {
  const resolutions = [effect.manualResolution, ...Object.values(effect.manualResolutionByTrigger)].filter(Boolean);
  return [
    effect.printedText,
    ...Object.values(effect.triggerText),
    ...resolutions.flatMap(resolution => [
      resolution!.decision,
      ...resolution!.choices,
      ...resolution!.mandatoryConditions,
      ...resolution!.inputFields.flatMap(field => [field.label, field.helpText || '', ...(field.options || [])]),
      ...resolution!.actionTemplates.flatMap(action => [action.label, action.sourceText]),
      ...resolution!.followUpRequirements
    ])
  ].filter(Boolean);
};

describe('printed effect Korean reading layer', () => {
  it('covers every English printed effect and manual-resolution line', () => {
    const untranslatedCanonicalLabels = ['Hot Toddy', 'Junior', 'Senior'];
    const uncovered = PRINTED_EFFECT_REGISTRY.flatMap(effect => displayedManualStrings(effect))
      .filter(text => /[A-Za-z]{2}/.test(text) && !/[가-힣]/.test(text))
      .filter(text => localizeManualEffectValue(text) === text)
      .filter(text => !untranslatedCanonicalLabels.includes(text));
    expect(uncovered).toEqual([]);
  });

  it('preserves card suits and encounter proper names', () => {
    for (const effect of PRINTED_EFFECT_REGISTRY) {
      const translated = localizeManualEffectText(effect.ownerName, effect.printedText);
      for (const suit of ['♥', '♦', '♣', '♠']) {
        expect([...translated].filter(value => value === suit)).toHaveLength([...effect.printedText].filter(value => value === suit).length);
      }
      if (effect.printedText.includes(effect.ownerName)) expect(translated).toContain(effect.ownerName);
    }
  });

  it('ships no translator placeholder tokens', () => {
    expect(Object.keys(generatedTranslations)).toHaveLength(1219);
    expect(Object.values(generatedTranslations).some(value => value.includes('ZZPN') || value.includes('ZZLOC'))).toBe(false);
  });

  it('localizes manual conditions and legacy pending journal entries', () => {
    expect(localizeManualEffectLine('Region: Forest')).toBe('지역: 숲');
    expect(localizeManualEffectLine('Season: Spring')).toBe('계절: 봄');
    expect(localizeManualJournalTitle('판정 대기: Memories A pleasant wind blows through the trees')).toBe('판정 대기: 추억');
    expect(localizeManualJournalTitle('여정 조우: Cul tivation')).toBe('여정 조우: 가지 가꾸기');
    expect(localizeManualJournalTitle('직접 판정: Dam Lotta Trouble')).toBe('직접 판정: 댐 때문에 골치 아파');
    expect(localizeManualJournalText('[p.79] . You feel your thoughts drift back, reflecting on your past. What moment do you recall?\n\n전용 직접 판정에서 선택과 상태 변화를 완료해야 합니다.')).toContain('어떤 순간이 생각나나요?');
    expect(localizeManualJournalText("[p.196] . Caretakers of any hometree know that now is the time to set plans for the coming year, binding branches into new roads, and pruning their trees to provide additional shelter from the elements. New Plans - Several important looking beasts are crowded around a set of sketched plans pinned to their hometree's bark. What are they building?"))
      .toContain('내년에 대한 계획을 세우고');
    const mindYerself = ENCOUNTERS.find(encounter => encounter.title === 'Mind Yerself!')!;
    expect(localizeManualJournalText(`조우 결과: ${mindYerself.prompt}\n위치와 획득 기록`))
      .toContain('심술궂은 초원 토끼가 뛰어오며');
    const printedMindYerself = PRINTED_EFFECT_REGISTRY.find(effect => effect.ownerName === 'Mind Yerself!')!;
    expect(localizeManualJournalText(`${printedMindYerself.printedText}\n\n전용 직접 판정에서 선택과 상태 변화를 완료해야 합니다.`))
      .toContain('심술궂은 초원 토끼가 뛰어오며');
    expect(localizeManualEffectOption('Junior')).toBe('풋내기 (젊은 채집꾼)');
    expect(localizeManualEffectOption('Senior')).toBe('숙련자 (숙련된 채집꾼)');
    expect(localizeManualEffectOption('Interrupt')).toBe('말 끊기');
    expect(localizeManualEffectOption('Follow Your Nose — Draw a card and decrease all Timers by 1. If your result was 7 or higher, gain a Reagent that can provide [Fair] and that can also be Foraged for in the Forest. If no such Reagent exists, invent a new one for your Almanack. 162'))
      .toContain('코를 따라가세요 — 카드를 한 장 뽑고 모든 타이머를 1만큼 줄입니다.');
    expect(localizeManualEffectOption('Awkward Small Talk — You find yourself scampering for an available lift, and a local holds it until you leap aboard. Journal about your experience aboard the lift, out of breath and assailed with polite questions about your day.'))
      .toContain('어색한 잡담 — 이용 가능한 승강기로 달려가자');
  });

  it('separates encounter context from choices and removes PDF extraction residue', () => {
    const damPrompt = '. How do they feel about their work? What gossip have the builders got to share? Beaver Flood - This location has been flooded with river water from a local dam. Mark on your map that this is a Beaver Dam, and that its Region has changed Loch. Dam Burst - The dam bursts after Winter, causing this Location to return to being a Forest Region. 161';
    expect(localizeEncounterDisplayText('Dam Lotta Trouble', damPrompt)).toBe('그들은 자신의 일에 대해 어떻게 생각하나요? 건축업자들은 어떤 이야기를 들려주나요?');
    expect(localizeManualEffectOption('Beaver Flood — This location has been flooded with river water from a local dam. Mark on your map that this is a Beaver Dam, and that its Region has changed Loch'))
      .toBe('비버 댐 범람 — 이 위치가 인근 비버 댐의 강물로 잠겼습니다. 지도에 이곳을 비버 댐으로 표시하고 지역을 호수로 바꾸세요.');
    expect(localizeManualEffectOption('Dam Burst — The dam bursts after Winter, causing this Location to return to being a Forest Region. 161'))
      .toBe('댐 붕괴 — 겨울이 지난 뒤 댐이 무너집니다. 이 위치의 지역을 다시 숲으로 바꾸세요.');

    const restStopPrompt = 'They invite you to sit and share stories from the road. Where have they come from, and where are they going? What stories do they share with you? Forest travel encounters Thick boughs of pine, spruce, oak, silver birch and more hold up the immense canopy above. Meandering trails can lead travellers safely home... usually. 78';
    const restStop = localizeEncounterDisplayText('Rest Stop', restStopPrompt);
    expect(restStop).not.toContain('숲 여행');
    expect(restStop).not.toMatch(/\b78\b/);
  });

  it('renders the Inspection encounter without machine-translated false friends', () => {
    const inspection = ENCOUNTERS.find(encounter => encounter.title.startsWith('Inspection'))!;
    expect(localizeEncounterDisplayText('Inspection', inspection.prompt)).toBe(
      '현지 자원봉사자들이 여행자의 가방을 살피고 있습니다. 곡물처럼 귀중한 물자에 포자를 퍼뜨릴 수 있는 오염원을 막기 위한 검사입니다.'
    );
    expect(localizeManualEffectOption(inspection.choices[0].label)).toContain('그냥 통과');
    expect(localizeManualEffectOption(inspection.choices[0].label)).not.toContain('과거에 손');
    expect(localizeManualEffectOption(inspection.choices[1].label)).toContain('엄중한 주의');
    expect(localizeManualEffectOption(inspection.choices[1].label)).not.toContain('엄중한 강의');
  });

  it('renders the Market encounter with natural rule terms', () => {
    const market = ENCOUNTERS.find(encounter => encounter.title.startsWith('Market'))!;
    expect(localizeEncounterDisplayText('Market', market.prompt)).toBe(
      '나무로 된 거리가 숲 바닥에서 우듬지까지 빙 둘러 이어집니다.'
    );
    const choices = market.choices.map(choice => localizeManualEffectOption(choice.label));
    expect(choices[0]).toContain('거절하기 힘든 거래');
    expect(choices[1]).toContain('기분 좋은 호사');
    expect(choices[2]).toContain('외지 영약재');
    expect(choices.join(' ')).not.toMatch(/외국인 영약재|조제법 방법|유쾌한 방종/);
  });

  it('renders the playful Highway Robbery scene without pup mistranslations', () => {
    const highwayRobbery = ENCOUNTERS.find(encounter => encounter.title.startsWith('Highway Robbery'))!;
    expect(localizeEncounterTitle(highwayRobbery.title)).toBe('꼬마 산적의 통행세');
    expect(localizeEncounterDisplayText(highwayRobbery.title, highwayRobbery.prompt)).toBe(
      '장난감 검을 든 어린 들쥐가 길을 막고 서서, 장난스럽게 통행세를 내라고 요구합니다.'
    );
    const choices = highwayRobbery.choices.map(choice => localizeManualEffectOption(choice.label));
    expect(choices).toEqual([
      '장신구로 내기 — 장신구 1개를 잃습니다. 갑자기 전리품을 얻은 들쥐 아이는 어떤 반응을 보이나요?',
      '결투로 대신하기 — 달력에 1일을 표시합니다. 들쥐 아이와 모의 결투를 벌이고, 둘 중 누가 누구를 ‘쓰러뜨렸는지’ 일지에 기록하세요.',
      '그냥 지나치기 — 아이를 성급히 지나쳐 여정을 계속합니다. 길드 명성 1을 잃습니다.'
    ]);
    expect(choices.join(' ')).not.toMatch(/쥐 새끼|강아지|목숨을 걸고|인내심을 잃고/);
    expect(localizeManualEffectOption('Pay with your life')).toBe('결투로 대신하기');
    expect(localizeManualEffectOption('Pay with your pockets — Lose 1 장신구. How does the mouse pup react to their sudden bounty')).toBe(choices[0]);
    expect(localizeManualEffectOption("Pay with your life — Mark 1 Day on your 일정. Journal about a mock fight you have with the pup, and how one of you 'slays' the other")).toBe(choices[1]);
    expect(localizeManualEffectOption('Pay with your patience — Storming past the pup, you continue your 여정. Lose 1 길드 명성.')).toBe(choices[2]);
  });

  it('gives every encounter popup a compact Korean title', () => {
    const titles = [...new Set(PRINTED_EFFECT_REGISTRY
      .filter(effect => effect.trigger === 'encounter')
      .map(effect => effect.ownerName))];
    const unresolved = titles.filter(title => localizeEncounterTitle(title) === title);
    expect(unresolved).toEqual([]);
    expect(localizeEncounterTitle('Parade')).toBe('축제 행렬');
    expect(localizeEncounterTitle('To Glide, or not to Glide')).toBe('활공할까, 말까');
  });

  it('does not leave English instruction sentences in encounter choice buttons', () => {
    const englishInstruction = /\b(?:the|this|that|your|you|they|their|with|from|after|before|gain|lose|draw|mark|location|region|reagent|timer|reputation|journal|path|forest|loch|winter|spring|summer|autumn)\b/i;
    const unresolved = ENCOUNTERS.flatMap(encounter => encounter.choices.map(choice => ({
      encounterId: encounter.id,
      text: localizeManualEffectOption(choice.label)
    }))).filter(row => englishInstruction.test(row.text));
    expect(unresolved).toEqual([]);
  });

  it('does not leave English instruction sentences in encounter context', () => {
    const englishInstruction = /\b(?:the|this|that|your|you|they|their|with|from|after|before|gain|lose|draw|mark|location|region|reagent|timer|reputation|journal|path|forest|loch|winter|spring|summer|autumn)\b/i;
    const unresolved = ENCOUNTERS.map(encounter => ({
      encounterId: encounter.id,
      text: localizeEncounterDisplayText(encounter.title, encounter.prompt)
    })).filter(row => englishInstruction.test(row.text));
    expect(unresolved).toEqual([]);
  });

  it('restores the complete Fresh Catch scene without the adjacent Loch overview', () => {
    const freshCatch = ENCOUNTERS.find(encounter => encounter.title.startsWith('Fresh Catch'))!;
    const translated = localizeEncounterDisplayText(freshCatch.title, freshCatch.prompt);

    expect(translated).toContain('선착장을 지나던 중');
    expect(translated).toContain('오늘은 무엇을 잡았을까요?');
    expect(translated).not.toMatch(/반이동식|안전한 항구|Lochs|로크스|\b198\b/);
  });

  it('keeps every adjacent social overview out of the encounter popup', () => {
    const contaminatedTitles = ['Preserved', 'Airborne', 'Florist', 'Bridges', 'Orebeater Forges', 'Fresh Catch', 'Nursery', 'Exterior', 'Monuments', 'Junction', 'Getting Around', 'Thinkers'];
    const rendered = ENCOUNTERS
      .filter(encounter => contaminatedTitles.some(title => encounter.title.startsWith(title)))
      .flatMap(encounter => [
        localizeEncounterDisplayText(encounter.title, encounter.prompt),
        ...encounter.choices.map(choice => localizeManualEffectOption(choice.label))
      ])
      .join('\n');

    expect(rendered).not.toMatch(/늪지 정착지를 찾을 수 있습니다|숲 정착지는 토착|고대 Titan 채석장에 건설된 이 도시|산간 정착지의 건축물|한마디로 Spoolkeep|Bogs|Forests|Lochs|Meadows|Mountains/);
  });

  it('describes card-value inventory counting without the landing mistranslation', () => {
    const legacyInMud = localizeManualEffectOption('Get A Better View — You may be able to scout the land better from up there. Draw a Card: ♥ or ♦ - It holds remarkably well, and you get a good view. Gain 3 Foraging Points ♣ or ♠ - It shifts unexpectedly and sinks further in the bog. Something falls out of your satchel and vanishes into the mud below! Count down the Items in your Bags equal to the card’s value; discard the Item you land on.');
    const lostItem = localizeManualEffectOption('Lost Item — Use the value of your card to count down the list of items in your Bags; discard the item you land on.');

    expect(legacyInMud).toContain('마지막으로 센 물품 하나를 버리세요');
    expect(legacyInMud).toContain('\n♥ 또는 ♦');
    expect(legacyInMud).toContain('\n♣ 또는 ♠');
    expect(lostItem).toContain('마지막으로 센 물품 하나를 버리세요');
    expect(`${legacyInMud} ${lostItem}`).not.toContain('착륙');
    expect(localizeManualEffectValue('. It looks like it was built quickly and abandoned just as fast. Why would someone build a tower out here? Does it bear any markings? Get A Better View - You may be able to scout the land better from up there. Draw a Card: ♥ or ♦ - It holds remarkably well, and you get a good view. Gain 3 Foraging Points ♣ or ♠ - It shifts unexpectedly and sinks further in the bog. Something falls out of your satchel and vanishes into the mud below! Count down the Items in your Bags equal to the card’s value; discard the Item you land on.'))
      .not.toContain('착륙');
    const persistedPartialDraft = localizeManualEffectText('Legacy In Mud', 'It looks like it was built quickly and abandoned just as fast. Why would someone build a tower out here? Does it bear any markings? Get A Better View - 위에서 땅을 더 잘 정찰할 수 있습니다. 카드를 뽑습니다: ♥ or ♦ - It holds remarkably well, and you get a good view. Gain 3 채집 포인트 ♣ or ♠ - It shifts unexpectedly and sinks further in the bog. Something falls out of your satchel and vanishes into the mud below! Count down the Items in your Bags equal to the card’s value; discard the Item you land on.');
    expect(persistedPartialDraft).toContain('급히 세웠다가');
    expect(persistedPartialDraft).toContain('마지막으로 센 물품 하나를 버리세요');
    expect(persistedPartialDraft).not.toMatch(/It looks|Count down|착륙/);
    expect(localizeManualEffectLine('Gain 3 채집 포인트 ♣ or ♠ - It shifts unexpectedly and sinks further in the bog.'))
      .toContain('♥ 또는 ♦ 결과에서만');
    expect(localizeManualEffectLine('카드를 뽑습니다: ♥ or ♦ - It holds remarkably well, and you get a good view.'))
      .not.toMatch(/Draw|It holds|\bor\b/);
  });

  it('translates generic Region words while preserving printed proper names', () => {
    const bridges = PRINTED_EFFECT_REGISTRY.find(effect => effect.ownerName === 'Bridges')!;
    const translated = localizeManualEffectText(bridges.ownerName, bridges.printedText);
    expect(translated).toContain('숲');
    expect(translated).not.toMatch(/\bForest\b/);
    expect(localizeManualEffectValue('Mountain Rescue')).toBe('Mountain Rescue');
  });

  it('leaves no English-only generic branch headings in the 358 printed effects', () => {
    const genericEnglishFragments = [
      'Catch of the Day', 'Fixer Upper', 'Junior', 'Senior', 'Old Verse', 'New Verse',
      'Outmanoeuvre', 'Run & Hide', 'Snatch and Go', 'Take Shelter', 'Spill The Beans',
      'Stitcher\'s Care', 'Helping Paw', 'Tick Check', 'Going For Broke', 'Move On',
      'Base Rarity', 'Hot Toddy', 'Pounder\'s Take', 'Friendly Natter', 'Choppy Waters'
    ];
    const remaining = PRINTED_EFFECT_REGISTRY.flatMap(effect => {
      const translated = localizeManualEffectText(effect.ownerName, effect.printedText);
      return genericEnglishFragments.filter(fragment => translated.includes(fragment)).map(fragment => `${effect.ownerName}: ${fragment}`);
    });

    expect(remaining).toEqual([]);
  });
});
