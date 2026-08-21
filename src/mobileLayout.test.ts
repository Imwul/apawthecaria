// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const routeComposerSource = readFileSync(fileURLToPath(new URL('./components/RouteComposer.tsx', import.meta.url)), 'utf8');
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
    expect(appSource).toContain('className="encounter-journal-note"');
    expect(appSource).toContain('defaultValue={activeTravelEncounter.journalNote || state.pendingEncounter?.journalNote || \'\'}');
    expect(cssSource).toMatch(/\.encounter-journal-note textarea\s*\{[\s\S]*?font-size:\s*1rem\s*!important/);
  });

  it('keeps the current task ahead of historical and fallback material', () => {
    expect(appSource).toContain('id="route-planning-panel"');
    expect(appSource).toContain('id="treatment-workspace"');
    expect(appSource).toContain('id="patient-acquisition-panel"');
    expect(appSource).toContain('className="patient-intake__history"');
    expect(cssSource).toMatch(/\.patient-workflow__treatment\s*\{[\s\S]*?order:\s*1/);
    expect(cssSource).toMatch(/\.patient-workflow__acquisition\s*\{[\s\S]*?order:\s*2/);
    expect(cssSource).toMatch(/\.patient-intake__history\s*\{[\s\S]*?order:\s*10/);
  });

  it('keeps gameplay controls and semantic copy above the fine-print scale', () => {
    expect(cssSource).toMatch(/\.main-content-panel :is\(button, input, select, textarea\)[\s\S]*?font-size:\s*0\.9375rem\s*!important/);
    expect(cssSource).toMatch(/\.main-content-panel :is\(p, li, dt, dd, label, td, th\)[\s\S]*?font-size:\s*max\(0\.875rem, 1em\)/);
    expect(cssSource).toMatch(/\.save-state,[\s\S]*?\.action-hub__chip,[\s\S]*?font-size:\s*0\.875rem\s*!important/);
    expect(cssSource).toMatch(/#treatment-workspace :is\(p, span, strong, small, summary, label\),[\s\S]*?font-size:\s*0\.875rem\s*!important/);
    expect(cssSource).toMatch(/\.route-composer :is\(span, small, strong, em\)\s*\{[\s\S]*?font-size:\s*0\.875rem\s*!important/);
  });

  it('exposes the season resolver after downtime outside an active journey', () => {
    expect(appSource).toContain('className="downtime-season-action"');
    expect(appSource).toMatch(/\{state\.downtimeCompleted && \([\s\S]*?onClick=\{handleAdvanceSeason\}[\s\S]*?계절 정산 및 전환/);
    expect(appSource).toContain('const handleAdvanceSeason = async () =>');
    expect(cssSource).toMatch(/\.downtime-season-action\s*\{[\s\S]*?justify-content:\s*space-between/);
  });

  it('keeps a play-tab map beside journey setup without covering the paper map', () => {
    expect(appSource).toContain('id="play-journey-map"');
    expect(appSource).toContain('variant="companion"');
    expect(appSource).toContain('<RouteComposer');
    expect(appSource).toContain('약제사 시작 기록');
    expect(cssSource).toMatch(/\.play-with-map\s*\{/);
    expect(cssSource).toMatch(/\.route-composer\s*\{/);
    expect(cssSource).toMatch(/@media \(min-width: 1100px\)[\s\S]*?\.play-with-map__map\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*calc\(4rem \+ 0\.75rem\);[\s\S]*?max-height:\s*calc\(100dvh - 5\.5rem\);[\s\S]*?overflow-y:\s*auto;/);
    expect(appSource).toContain('문양 방향: ♥ 북쪽/위 · ♦ 남쪽/아래 · ♣ 동쪽/오른쪽 · ♠ 서쪽/왼쪽.');
  });

  it('keeps the route strip controls tappable and horizontally usable on narrow screens', () => {
    expect(appSource).toContain('className="travel-mode-switch"');
    expect(cssSource).toMatch(/html,\s*body\s*\{[\s\S]*?overflow-x:\s*clip/);
    expect(routeComposerSource).toContain('className="route-composer__track-clip"');
    expect(cssSource).toMatch(/\.route-composer__track-clip\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*100%;[\s\S]*?overflow:\s*hidden/);
    expect(cssSource).toMatch(/\.route-composer__track-container\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;[\s\S]*?contain:\s*inline-size;[\s\S]*?scroll-snap-type:\s*x proximity/);
    expect(cssSource).toMatch(/\.route-composer__track\s*\{[\s\S]*?width:\s*max-content;[\s\S]*?min-width:\s*100%/);
    expect(cssSource).toMatch(/\.route-composer \.route-card__remove-btn\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?flex-shrink:\s*0/);
    expect(cssSource).toMatch(/\.route-composer \.route-connector__btn\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px/);
    expect(cssSource).toMatch(/\.route-composer__picker-controls input,[\s\S]*?min-height:\s*2\.75rem/);
    expect(cssSource).toMatch(/\.route-composer__card--compact \.route-card__header\s*\{[\s\S]*?grid-template-columns:\s*auto minmax\(0,\s*1fr\)/);
    expect(cssSource).toMatch(/\.route-card__target-name\s*\{[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?white-space:\s*normal/);
  });

  it('keeps forage context, result feedback, and inventory actions usable on mobile', () => {
    expect(appSource).toContain('className="forage-context"');
    expect(appSource).toContain('className={`forage-result-receipt');
    expect(appSource).toContain('className="inventory-delete-button"');
    expect(appSource).toContain('className="inventory-bandolier-button"');
    expect(cssSource).toMatch(/\.forage-location-controls\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(cssSource).toMatch(/\.inventory-delete-button\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px/);
    expect(cssSource).toMatch(/\.inventory-ledger-scroll tr\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) auto auto/);
    expect(cssSource).toMatch(/\.inventory-bandolier-button\s*\{[\s\S]*?min-height:\s*44px/);
    expect(cssSource).toMatch(/\.forage-candidate > button\s*\{[\s\S]*?width:\s*100%/);
  });

  it('keeps the field reference browse, history, and long filters usable on mobile', () => {
    expect(appSource).toContain('className="herbarium-field-guide"');
    expect(appSource).toContain('className="herbarium-entry__summary"');
    expect(appSource).toContain('className="forage-reference-link"');
    expect(appSource).toContain('className="inventory-reference-button"');
    expect(cssSource).toMatch(/@media \(max-width: 820px\)[\s\S]*?\.rulebook-context-shelf,[\s\S]*?\.herbarium-context,[\s\S]*?\.herbarium-entry__detail[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(cssSource).toMatch(/@media \(max-width: 480px\)[\s\S]*?\.herbarium-controls\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(cssSource).toMatch(/\.rulebook-reference-detail__actions button,[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px/);
  });
});
