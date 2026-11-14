import { describe, expect, it } from 'vitest';
import {
  AILMENT_WORLD_INPUTS,
  AILMENT_WORLD_OWNERS,
  TROWEL_POTENCY_OPTIONS,
  SOURED_DOUGH_CONDITION,
  advanceAilmentWorldConditionsForSeason,
  ailmentWorldCondition,
  consumeTickbittenReturnPair,
  describeAilmentWorldConditions,
  hasTickbittenReturnPair,
  isBarterSocialBanned,
  isBeeHiveUnavailableAt,
  isPlantInsectForageBanned,
  isSettlementQuarantined,
  nearestSettlementId,
  resolveAilmentWorldEffect,
  titanRarityAilmentModifier,
  type AilmentWorldGraph
} from './ailmentWorldEffects';
import { PRINTED_EFFECT_BY_OWNER } from './printedEffects';
import { createManualEffectDraft, drawTrinketInspiration } from './almanackEngine';
import { scopeManualEffectDraftForEncounterChoice, setManualEffectInput } from '../manualEffectDraftState';

// wild-a — wild-b — town — wild-c — city
const graph: AilmentWorldGraph = {
  'wild-a': { neighbors: ['wild-b'], kind: 'wild', label: '숲 위치 1' },
  'wild-b': { neighbors: ['wild-a', 'town'], kind: 'wild', label: '숲 위치 2' },
  town: { neighbors: ['wild-b', 'wild-c'], kind: 'settlement', label: 'Town' },
  'wild-c': { neighbors: ['town', 'city'], kind: 'wild', label: '숲 위치 3' },
  city: { neighbors: ['wild-c'], kind: 'city', label: 'City' }
};

const resolve = (ownerId: string, trigger: string, extra: Partial<Parameters<typeof resolveAilmentWorldEffect>[0]> = {}) =>
  resolveAilmentWorldEffect({
    ownerId,
    trigger,
    season: 'Spring',
    currentLocationId: 'wild-a',
    graph,
    targets: {},
    inputValues: {},
    ...extra
  });

describe('ailment world effects', () => {
  it('finds the nearest Settlement, counting the current one', () => {
    expect(nearestSettlementId(graph, 'wild-a')).toBe('town');
    expect(nearestSettlementId(graph, 'town')).toBe('town');
    expect(nearestSettlementId(graph, 'wild-c')).toBe('city');
  });

  it('Snail Ails quarantines the nearest Settlement until the next Season begins', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.snailAils, 'treatment-failure');
    expect(outcome?.conditions).toEqual([ailmentWorldCondition.snailQuarantine('town')]);
    expect(isSettlementQuarantined(outcome!.conditions, 'town')).toBe(true);
    const nextSeason = advanceAilmentWorldConditionsForSeason(outcome!.conditions);
    expect(isSettlementQuarantined(nextSeason, 'town')).toBe(false);
  });

  it('respects a Settlement the player chose instead of the default', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.snailAils, 'treatment-failure', {
      targets: { [AILMENT_WORLD_INPUTS.settlement]: 'city' }
    });
    expect(isSettlementQuarantined(outcome!.conditions, 'city')).toBe(true);
    expect(isSettlementQuarantined(outcome!.conditions, 'town')).toBe(false);
  });

  it('Groundhog bans Barter here and at the nearest Settlement in warm Seasons for two Season changes', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.groundhog, 'treatment-failure', { season: 'Summer' });
    expect(isBarterSocialBanned(outcome!.conditions, 'wild-a')).toBe(true);
    expect(isBarterSocialBanned(outcome!.conditions, 'town')).toBe(true);
    const once = advanceAilmentWorldConditionsForSeason(outcome!.conditions);
    expect(isBarterSocialBanned(once, 'town')).toBe(true);
    const twice = advanceAilmentWorldConditionsForSeason(once);
    expect(isBarterSocialBanned(twice, 'town')).toBe(false);
  });

  it('Groundhog bans Plant/Insect Foraging within 2 Paths in cold Seasons', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.groundhog, 'treatment-failure', { season: 'Winter' });
    expect(isPlantInsectForageBanned(outcome!.conditions, 'wild-a', graph)).toBe(true);
    expect(isPlantInsectForageBanned(outcome!.conditions, 'town', graph)).toBe(true);
    expect(isPlantInsectForageBanned(outcome!.conditions, 'wild-c', graph)).toBe(false);
  });

  it('Stingshock closes Bee and Hive Reagents at that Location permanently', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.stingshock, 'treatment-failure');
    expect(isBeeHiveUnavailableAt(outcome!.conditions, 'wild-a')).toBe(true);
    const aged = advanceAilmentWorldConditionsForSeason(advanceAilmentWorldConditionsForSeason(outcome!.conditions));
    expect(isBeeHiveUnavailableAt(aged, 'wild-a')).toBe(true);
  });

  it('Titan Touched failure raises Titan Rarity until the end of next Season', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.titanTouched, 'treatment-failure');
    expect(titanRarityAilmentModifier(outcome!.conditions)).toBe(1);
    const aged = advanceAilmentWorldConditionsForSeason(advanceAilmentWorldConditionsForSeason(outcome!.conditions));
    expect(titanRarityAilmentModifier(aged)).toBe(0);
  });

  it('Titan Touched success converts a Location to a Ruin and links two Paths', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.titanTouched, 'treatment-success', {
      targets: {
        [AILMENT_WORLD_INPUTS.ruin]: 'wild-b',
        [AILMENT_WORLD_INPUTS.ruinLinkA]: 'wild-c',
        [AILMENT_WORLD_INPUTS.ruinLinkB]: 'city'
      }
    });
    expect(outcome?.ruinLocationId).toBe('wild-b');
    expect(outcome?.paths).toEqual([{ from: 'wild-b', to: 'wild-c' }, { from: 'wild-b', to: 'city' }]);
  });

  it('Trowel Troubles adds a Path only after a Potency 3 Remedy', () => {
    const without = resolve(AILMENT_WORLD_OWNERS.trowelTrouble, 'treatment-success', {
      targets: { [AILMENT_WORLD_INPUTS.pathEnd]: 'city' },
      inputValues: { [AILMENT_WORLD_INPUTS.potency]: TROWEL_POTENCY_OPTIONS[1] }
    });
    expect(without).toBeNull();
    const withPotency = resolve(AILMENT_WORLD_OWNERS.trowelTrouble, 'treatment-success', {
      targets: { [AILMENT_WORLD_INPUTS.pathEnd]: 'city' },
      inputValues: { [AILMENT_WORLD_INPUTS.potency]: TROWEL_POTENCY_OPTIONS[0] }
    });
    expect(withPotency?.paths).toEqual([{ from: 'wild-a', to: 'city' }]);
  });

  it('Tickbitten marks the nearest Settlement once for a return pair', () => {
    const outcome = resolve(AILMENT_WORLD_OWNERS.tickbitten, 'treatment-failure');
    expect(hasTickbittenReturnPair(outcome!.conditions, 'town')).toBe(true);
    expect(hasTickbittenReturnPair(consumeTickbittenReturnPair(outcome!.conditions, 'town'), 'town')).toBe(false);
  });

  it('Wingbreak and Soured Dough reuse the engine-consumed conditions', () => {
    expect(resolve(AILMENT_WORLD_OWNERS.wingbreak, 'treatment-failure')?.conditions).toEqual(['wingbreak:barter-rarity-plus-2:Spring']);
    expect(resolve(AILMENT_WORLD_OWNERS.souredDough, 'treatment-failure', { noSiblingCured: true })?.conditions).toEqual([SOURED_DOUGH_CONDITION]);
    expect(resolve(AILMENT_WORLD_OWNERS.souredDough, 'treatment-failure', { noSiblingCured: false })).toBeNull();
  });

  it('describes active effects in Korean', () => {
    const lines = describeAilmentWorldConditions([
      ailmentWorldCondition.snailQuarantine('town'),
      ailmentWorldCondition.titanRarityPlusOne()
    ], id => graph[id]?.label || id);
    expect(lines[0]).toContain('Town 격리');
    expect(lines[1]).toContain('티탄 영약재 희귀도 +1');
  });
});

describe('ailment world manual drafts', () => {
  const draftFor = (ownerId: string, trigger: 'treatment-success' | 'treatment-failure') => {
    const effect = PRINTED_EFFECT_BY_OWNER.get(ownerId)!;
    return scopeManualEffectDraftForEncounterChoice(createManualEffectDraft(effect, trigger, { locationId: 'wild-a' }, 1));
  };

  it('replaces free-text condition records with typed inputs', () => {
    const snail = draftFor(AILMENT_WORLD_OWNERS.snailAils, 'treatment-failure');
    expect(snail.actionTemplates).toEqual([]);
    expect(snail.inputFields.map(field => field.id)).toContain(AILMENT_WORLD_INPUTS.settlement);
    expect(snail.canonicalActions[0]).toContain('다음 계절');
  });

  it('asks for the new Path only after Potency 3 is confirmed', () => {
    const trowel = draftFor(AILMENT_WORLD_OWNERS.trowelTrouble, 'treatment-success');
    expect(trowel.inputFields.map(field => field.id)).not.toContain(AILMENT_WORLD_INPUTS.pathEnd);
    const confirmed = setManualEffectInput(AILMENT_WORLD_INPUTS.potency, TROWEL_POTENCY_OPTIONS[0], 2)(trowel);
    expect(confirmed.inputFields.find(field => field.id === AILMENT_WORLD_INPUTS.pathEnd)?.required).toBe(true);
  });

  it('is stable when scoped again', () => {
    const titan = draftFor(AILMENT_WORLD_OWNERS.titanTouched, 'treatment-success');
    expect(scopeManualEffectDraftForEncounterChoice(titan)).toBe(titan);
  });
});


describe('p.56 trinket inspiration', () => {
  it('reads Object, Material and Origin from three cards', () => {
    const inspiration = drawTrinketInspiration([
      { suit: '♥', value: 1 },
      { suit: '♠', value: 8 },
      { suit: '♦', value: 5 }
    ]);
    expect(inspiration.object).toBe('Implement or Gadget');
    expect(inspiration.material).toBe('Flint');
    expect(inspiration.origin).toBe('Handmade by owner');
    expect(inspiration.text).toBe('부싯돌로 만든 도구나 장치 · 주인이 손수 만듦');
  });

  it('keeps row 6 split as printed and treats Monarchs as M', () => {
    const inspiration = drawTrinketInspiration([
      { suit: '♣', value: 6 },
      { suit: '♣', value: 6 },
      { suit: '♣', value: 13 }
    ]);
    expect(inspiration.object).toBe('Toy / Entertainment');
    expect(inspiration.material).toBe('Animal / Repurposed');
    expect(inspiration.origin).toBe('A friend’s (they went Elsewhere)');
    expect(inspiration.text.startsWith('동물 재료·재활용품으로 만든 장난감·놀잇감')).toBe(true);
  });
});
