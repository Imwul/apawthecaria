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

  it('keeps the journey map visible for planning, travel, and encounter resolution', () => {
    expect(appSource.match(/<JourneyMapBoard/g)).toHaveLength(4);
    expect(appSource).toContain('className="glass-panel encounter-dialog encounter-dialog--journey-map"');
    expect(cssSource).toMatch(/\.encounter-dialog--journey-map\s*\{[\s\S]*?grid-template-columns:/);
    expect(cssSource).toMatch(/@media \(max-width: 980px\)[\s\S]*?\.encounter-dialog--journey-map\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  });

  it('turns the journey map into a complete intermediate-player planning surface', () => {
    expect(appSource).toContain('journeyPlannedStopIds');
    expect(appSource).toContain('favoriteMapLocationIds');
    expect(appSource).toContain('onSelectDestination={applyTravelDestination}');
    expect(appSource).toContain('className="travel-preview__facts"');
    expect(appSource).toContain('className="travel-receipts"');
    expect(cssSource).toMatch(/\.journey-map-board\.is-selectable\s+\.journey-map-board__overlay\s*\{[\s\S]*?pointer-events:\s*auto/);
  });

  it('offers guided and field modes plus an encounter resolution checklist', () => {
    expect(appSource).toContain("type PlayInterfaceMode = 'guided' | 'field'");
    expect(appSource).toContain('className="play-mode-switch"');
    expect(appSource).toContain('className="encounter-checklist"');
    expect(appSource).toContain("key === 'u'");
    expect(cssSource).toMatch(/\.play-view--field\s+\.field-mode-hide/);
    expect(cssSource).toMatch(/\.encounter-checklist\s+ol\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5/);
  });

  it('reflows the play navigator and keeps field mode concise', () => {
    expect(appSource).toContain('<PlayNavigator');
    expect(cssSource).toMatch(/@media \(max-width: 520px\)[\s\S]*?\.play-navigator__header\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
    expect(cssSource).toMatch(/\.play-view--field \.play-navigator__body/);
  });
});
