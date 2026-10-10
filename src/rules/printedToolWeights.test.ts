import { describe, expect, it } from 'vitest';
import { TOOL_BY_ID } from './data/tools';
import { migrateSavedRulesState } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './state';
import { purchaseCanonicalTool, toolWeight, type CanonicalToolState } from './toolEngine';
import { inventoryWeight } from './travelEngine';

// Original PDF, printed p.62: the filled circles are whole Weight units.
// Canvas Tent and Big Iron Cauldron have two circles; Bark Coracle has three.
const PRINTED_WEIGHTS = [
  ['canvas-tent', 2],
  ['big-iron-cauldron', 2],
  ['bark-coracle', 3]
] as const;

describe('printed p.62 Tool Weight and persisted inventory', () => {
  it.each(PRINTED_WEIGHTS)('%s keeps every printed whole Weight unit', (toolId, expectedWeight) => {
    expect(TOOL_BY_ID.get(toolId)?.weight).toBe(expectedWeight);
    const acquired = purchaseCanonicalTool({
      transactionId: `acquire:${toolId}`,
      state: { trinkets: 20, inventory: [], tools: [], appliedTransactionIds: [], journalEvents: [] },
      toolId,
      source: 'downtime-gift'
    });
    expect(acquired.status).toBe('resolved');
    expect(acquired.value!.inventory[0].weight).toBe(expectedWeight);
    expect(toolWeight(acquired.value!.tools[0])).toBe(expectedWeight);
    expect(inventoryWeight(acquired.value!.inventory)).toBe(expectedWeight);
  });

  it('repairs old weight-1 saves without changing identities, quantities or unrelated custom weights', () => {
    const bag = PRINTED_WEIGHTS.map(([toolId]) => ({
      id: `saved:${toolId}`, name: toolId, type: 'tool', canonicalToolId: toolId, weight: 1, qty: 2
    }));
    const saved = {
      schemaVersion: CURRENT_SCHEMA_VERSION, rulesetId: 'original-1e-3p',
      bag: [...bag, { id: 'custom', name: 'Custom item', type: 'item', weight: 1.5 }],
      journal: ['Keep this memory'], trinkets: 17
    };
    const restored = migrateSavedRulesState(saved);
    expect(restored.bag.map(item => item.weight)).toEqual([2, 2, 3, 1.5]);
    expect(restored.bag.map(item => item.id)).toEqual([...bag.map(item => item.id), 'custom']);
    expect(restored.bag[0]).toMatchObject({ qty: 2 });
    expect(restored.journal).toEqual(saved.journal);
    expect(restored.trinkets).toBe(17);
    expect(migrateSavedRulesState(restored)).toEqual(restored);
  });

  it('preserves a recorded Bad Idea weight reduction while repairing the erroneous printed base', () => {
    const lightened: CanonicalToolState = {
      instanceId: 'lightened-coracle', toolId: 'bark-coracle', upgradeId: null,
      charges: null, broken: false, consumed: false, acquiredBy: 'market',
      appliedEffectIds: ['bad-idea:lighten'], weightAdjustment: -1 / 3
    };
    const restored = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION, rulesetId: 'original-1e-3p',
      bag: [{ id: lightened.instanceId, name: 'Bark Coracle', type: 'tool', canonicalToolId: lightened.toolId, weight: 2 / 3 }],
      toolStates: [lightened]
    });
    expect(restored.bag[0].weight).toBeCloseTo(3 - 1 / 3);
    expect(restored.toolStates).toContainEqual(lightened);
  });

  it('keeps an explicit untracked custom weight instead of guessing its reason', () => {
    const restored = migrateSavedRulesState({
      schemaVersion: CURRENT_SCHEMA_VERSION, rulesetId: 'sandbox',
      bag: [{ id: 'custom-coracle', name: 'Bark Coracle', type: 'tool', canonicalToolId: 'bark-coracle', weight: 1.5 }]
    });
    expect(restored.bag[0].weight).toBe(1.5);
  });
});
