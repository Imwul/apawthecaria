import { describe, expect, it } from 'vitest';
import manualMapReview from './detection/manualMapReview.json';

describe('player-reviewed map overlay', () => {
  it('contains only bounded, uniquely identified map records', () => {
    const ids = manualMapReview.locations.map(location => location.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(manualMapReview.locations).toHaveLength(492);
    manualMapReview.locations.forEach(location => {
      expect(location.id.trim()).not.toBe('');
      expect(Number.isFinite(location.x)).toBe(true);
      expect(Number.isFinite(location.y)).toBe(true);
      expect(location.x).toBeGreaterThanOrEqual(0);
      expect(location.x).toBeLessThanOrEqual(100);
      expect(location.y).toBeGreaterThanOrEqual(0);
      expect(location.y).toBeLessThanOrEqual(100);
    });
  });

  it('preserves the reviewed visibility and user-added marker totals', () => {
    expect(manualMapReview.locations.filter(location => location.hidden)).toHaveLength(56);
    expect(manualMapReview.locations.filter(location => location.added && !location.hidden)).toHaveLength(41);
    expect(manualMapReview.locations.filter(location => !location.added && !location.hidden)).toHaveLength(395);
  });

  it('uses the reviewed Odoak coordinates and hides the legacy fallback duplicate', () => {
    expect(manualMapReview.locations.find(location => location.id === 'odoak')).toMatchObject({
      label: 'Odoak',
      x: 45.73903818953324,
      y: 34.47666195190948,
      kind: 'city',
      hidden: false
    });
    expect(manualMapReview.locations.find(location => location.id === 'starting_oak_road')).toMatchObject({ hidden: true });
  });

  it('does not treat generated campaign connection data as player-reviewed', () => {
    expect('edges' in manualMapReview).toBe(false);
    expect(manualMapReview.source).toBe('player-reviewed-node-editor');
  });
});
