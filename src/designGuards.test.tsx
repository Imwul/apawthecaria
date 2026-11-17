// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReagentNameWithPart } from './components/ReagentPart';
import { PLAY_TASK_PANELS } from './workspaceNavigation';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const storybookCss = read('./storybook.css');
const cottageCss = read('./cottage.css');
const indexCss = read('./index.css');
const indexHtml = read('../index.html');

// Static guards for the storybook design layer. They cannot see pixels, but they catch the
// regressions that broke screens before: a task panel added without its hide rule, a zoom band
// whose viewport math disagrees with its zoom, a font that silently stops loading.
describe('storybook design guards', () => {
  it('gives every play task panel a focus rule that hides all the other panels', () => {
    const ids = PLAY_TASK_PANELS.map(panel => panel.id);
    for (const id of ids) {
      const rule = storybookCss.match(new RegExp(`#play-folio-work\\[data-task-focus="${id}"\\] :is\\(([^)]*)\\)`));
      expect(rule, `missing focus rule for ${id}`).not.toBeNull();
      const hidden = rule![1].split(',').map(selector => selector.trim().replace(/^#/, ''));
      expect(new Set(hidden), `focus rule for ${id} must list every task panel`).toEqual(new Set(ids));
    }
  });

  it('keeps each page-zoom band consistent with its viewport-unit correction', () => {
    const bands = [...cottageCss.matchAll(/:root\s*\{\s*--page-zoom:\s*([\d.]+);\s*zoom:\s*([\d.]+);\s*\}/g)];
    expect(bands.length).toBeGreaterThanOrEqual(4);
    for (const [, pageZoom, zoom] of bands) expect(pageZoom).toBe(zoom);
    expect(cottageCss).toMatch(/--dvh:\s*calc\(1dvh \/ var\(--page-zoom\)\)/);
    // A 3440×1440 monitor in a browser with toolbars and the Dock must still reach the largest band.
    const largest = cottageCss.match(/@media \(min-width: (\d+)px\) and \(min-height: (\d+)px\) \{ :root \{ --page-zoom: 1\.55;/);
    expect(largest).not.toBeNull();
    expect(Number(largest![1])).toBeLessThanOrEqual(3440);
    expect(Number(largest![2])).toBeLessThanOrEqual(1150);
  });

  it('loads the handwriting body font and the Chewy tag/title font', () => {
    expect(indexCss).toMatch(/@font-face\s*\{[^}]*font-family:\s*LeeSeoyun;[^}]*size-adjust:/);
    expect(indexHtml).toContain('family=Chewy');
    expect(storybookCss).toMatch(/--font-tag:\s*Chewy,/);
    expect(storybookCss).toMatch(/\.journal-brand__title\s*\{[^}]*var\(--font-tag\)/);
  });

  it('does not keep piling !important overrides onto the storybook layer', () => {
    // Raise this deliberately (and say why in the commit) rather than letting it creep.
    const count = (storybookCss.match(/!important/g) || []).length;
    expect(count).toBeLessThanOrEqual(320);
  });

  it('lifts a stored part and method out of a reagent name as labels', () => {
    const html = renderToStaticMarkup(<ReagentNameWithPart text="Chillies (고추) — 막 (Membranes) · 증류" />);
    expect(html).toContain('<span class="reagent-name__base">Chillies (고추)</span>');
    expect(html).toContain('<span class="part-chip">막 (Membranes)</span>');
    expect(html).toContain('<span class="part-method">증류</span>');
    expect(renderToStaticMarkup(<ReagentNameWithPart text="벨트 칼" />)).toBe('벨트 칼');
  });
});
