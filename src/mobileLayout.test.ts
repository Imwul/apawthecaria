// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const cssSource = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');

describe('mobile layout regression guards', () => {
  it('allows multi-option ailment requirements to wrap inside the document gutter', () => {
    expect(appSource).toContain('className="tag-choice-group"');
    expect(appSource).toContain('className="ailment-card__outcomes"');
    expect(cssSource).toMatch(/\.tag-choice-group\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?flex-wrap:\s*wrap;/);
    expect(cssSource).toMatch(/\.ailment-card__outcomes\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important;/);
  });

  it('caps responsive grid minimums at their container width', () => {
    expect(appSource).not.toMatch(/repeat\(auto-(?:fit|fill),\s*minmax\(\d+px/);
    expect(appSource).toContain('minmax(min(220px, 100%), 1fr)');
  });

  it('lets profile actions wrap below the heading on mobile', () => {
    expect(appSource).toContain('className="bio-page-header"');
    expect(cssSource).toMatch(/\.bio-page-actions\s*\{[\s\S]*?flex-wrap:\s*wrap/);
    expect(cssSource).toMatch(/\.bio-page-header\s*\{[\s\S]*?flex-direction:\s*column/);
  });

  it('reflows conditional encounter and two-card choice dialogs', () => {
    expect(appSource.match(/className="card-choice-options"/g)).toHaveLength(2);
    expect(appSource.match(/className="card-choice-option"/g)).toHaveLength(2);
    expect(appSource.match(/className="encounter-dialog-actions"/g)).toHaveLength(2);
    expect(cssSource).toMatch(/\.card-choice-options\s*\{[\s\S]*?flex-wrap:\s*wrap/);
    expect(cssSource).toMatch(/\.encounter-dialog-actions\s*\{[\s\S]*?display:\s*grid\s*!important/);
  });

  it('exposes the season resolver after downtime outside an active journey', () => {
    expect(appSource).toContain('className="downtime-season-action"');
    expect(appSource).toMatch(/\{state\.downtimeCompleted && \([\s\S]*?onClick=\{handleAdvanceSeason\}[\s\S]*?계절 정산 및 전환/);
    expect(appSource).toContain('const handleAdvanceSeason = () =>');
    expect(cssSource).toMatch(/\.downtime-season-action\s*\{[\s\S]*?justify-content:\s*space-between/);
  });

  it('keeps a play-tab map beside journey setup without covering the paper map', () => {
    expect(appSource).toContain('id="play-journey-map"');
    expect(appSource).toContain('variant="companion"');
    expect(appSource).toContain('<RouteComposer');
    expect(cssSource).toMatch(/\.play-with-map\s*\{/);
    expect(cssSource).toMatch(/\.route-composer\s*\{/);
    expect(cssSource).toMatch(/\.map-location-label\s*\{[\s\S]*?pointer-events:\s*none/);
  });
});
