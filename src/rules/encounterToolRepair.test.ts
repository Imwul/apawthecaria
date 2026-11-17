import { describe, expect, it } from 'vitest';
import { migrateLegacyBagItem } from './migrations';

describe('encounter Tool repair on load', () => {
  it('turns an encounter-gained plain item named after a Tool into that canonical Tool', () => {
    const repaired = migrateLegacyBagItem({
      id: 'manual-effect:1:abc:inventory:travel-meadow-j-spring:branch:bargain:action:1',
      name: 'Fairwind Spices',
      type: 'item',
      weight: 1 / 3,
      qty: 1
    });
    expect(repaired).toMatchObject({ type: 'tool', canonicalToolId: 'fairwind-spices', weight: 1 });
  });

  it('leaves player-made items that merely share a Tool name alone', () => {
    const own = { id: 'custom-item', name: 'Fairwind Spices', type: 'item', weight: 1 / 3, qty: 1 };
    expect(migrateLegacyBagItem(own)).toEqual(own);
  });
});
