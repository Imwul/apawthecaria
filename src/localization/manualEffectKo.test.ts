import { describe, expect, it } from 'vitest';
import { PRINTED_EFFECT_REGISTRY } from '../rules/printedEffects';
import generatedTranslations from './printedEffectKo.generated.json';
import {
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
    expect(localizeManualJournalTitle('판정 대기: Memories A pleasant wind blows through the trees')).toBe('판정 대기: Memories');
    expect(localizeManualJournalText('[p.79] . You feel your thoughts drift back, reflecting on your past. What moment do you recall?\n\n전용 직접 판정에서 선택과 상태 변화를 완료해야 합니다.')).toContain('어떤 순간이 생각나나요?');
    expect(localizeManualEffectOption('Junior')).toBe('풋내기 (젊은 채집꾼)');
    expect(localizeManualEffectOption('Senior')).toBe('숙련자 (숙련된 채집꾼)');
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
