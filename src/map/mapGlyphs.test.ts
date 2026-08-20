// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CITY_TRIANGLE_POINTS, glyphUsesTerrain } from './mapGlyphTypes';

const glyphSource = readFileSync(fileURLToPath(new URL('./mapGlyphs.tsx', import.meta.url)), 'utf8');

describe('map glyphs', () => {
  it('draws the city mark as an equilateral triangle fitted inside a square', () => {
    expect(glyphSource).toContain("kind === 'City'");
    expect(glyphSource).toContain('CITY_SQUARE');
    expect(glyphSource).toContain('<rect');
    expect(glyphSource).toContain('CITY_TRIANGLE_POINTS');

    const [apex, right, left] = CITY_TRIANGLE_POINTS.split(' ').map(pair => pair.split(',').map(Number));
    const side = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const ab = side(apex, right);
    const bc = side(right, left);
    const ca = side(left, apex);
    expect(ab).toBeCloseTo(bc, 5);
    expect(bc).toBeCloseTo(ca, 5);
    expect(apex[0]).toBeCloseTo(10, 5);
    expect(apex[1]).toBeGreaterThan(3);
    expect(left[1]).toBe(right[1]);
    expect(left[1]).toBeLessThan(18);
  });

  it('keeps titan ruins free of the five terrain colours', () => {
    expect(glyphUsesTerrain('Ruin')).toBe(false);
    expect(glyphUsesTerrain('City')).toBe(true);
    expect(glyphUsesTerrain('Settlement')).toBe(true);
    expect(glyphSource).toContain('glyphUsesTerrain(kind) ? glyphColor(terrain) : glyphColor(null)');
  });
});
