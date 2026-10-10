// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const routeComposerSource = readFileSync(fileURLToPath(new URL('./components/RouteComposer.tsx', import.meta.url)), 'utf8');
const journalExperienceSource = readFileSync(fileURLToPath(new URL('./components/JournalExperience.tsx', import.meta.url)), 'utf8');
// Keep the same cascade order as main.tsx when checking responsive overrides.
const cssSource = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8') + readFileSync(fileURLToPath(new URL('./feature-layout.css', import.meta.url)), 'utf8') + readFileSync(fileURLToPath(new URL('./workspace.css', import.meta.url)), 'utf8') + readFileSync(fileURLToPath(new URL('./mystic-folio.css', import.meta.url)), 'utf8');

describe('mobile layout regression guards', () => {
  it('never hides save feedback and wraps long cloud/error states outside the title lane', () => {
    const rules = [...cssSource.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const hiddenSaveRules = rules.filter(([, selector, declarations]) =>
      selector.includes('.save-state') && /display\s*:\s*none\b/.test(declarations));
    expect(hiddenSaveRules).toEqual([]);
    expect(cssSource).toMatch(/\.journal-header \.journal-header__utilities\s*\{[^}]*position:\s*static;[^}]*flex-wrap:\s*wrap;/);
    expect(cssSource).toMatch(/\.journal-header \.save-state\s*\{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;/);
    expect(cssSource).toMatch(/\.journal-header \.save-state\s*\{[^}]*flex-basis:\s*auto;/);
    expect(appSource).toContain("saveStatus === 'error' || localSaveUnavailable ? 'error' : saveStatus");
    expect(appSource).toContain("role={saveStatus === 'error' || localSaveUnavailable ? 'alert' : 'status'}");
  });

  it('allows multi-option ailment requirements to wrap inside the document gutter', () => {
    expect(appSource).toContain('className="tag-choice-group"');
    expect(appSource).toContain('className="ailment-card__outcomes"');
    expect(cssSource).toMatch(/\.tag-choice-group\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?max-width:\s*100%;/);
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
    expect(appSource.match(/className="encounter-dialog-actions"/g)).toHaveLength(3);
    expect(cssSource).toMatch(/\.card-choice-options\s*\{[\s\S]*?flex-wrap:\s*wrap/);
    expect(cssSource).toMatch(/\.encounter-dialog-actions\s*\{[\s\S]*?display:\s*grid\s*!important/);
    expect(appSource).toContain('className="encounter-journal-note"');
    expect(appSource).toContain('defaultValue={activeTravelEncounter.journalNote || state.pendingEncounter?.journalNote || \'\'}');
    expect(cssSource).toMatch(/\.encounter-journal-note textarea\s*\{[\s\S]*?font-size:\s*18px\s*!important/);
  });

  it('keeps research then preparation in coherent DOM and keyboard order', () => {
    expect(appSource).toContain('id="route-planning-panel"');
    expect(appSource).toContain('id="treatment-workspace"');
    expect(appSource).toContain('id="patient-acquisition-panel"');
    expect(appSource).toContain('className="patient-intake__history"');
    const patientWorkflow = appSource.slice(appSource.indexOf('<div className="patient-workflow"'));
    expect(patientWorkflow.indexOf('id="patient-acquisition-panel"')).toBeGreaterThan(-1);
    expect(patientWorkflow.indexOf('id="patient-acquisition-panel"')).toBeLessThan(patientWorkflow.indexOf('id="treatment-workspace"'));
    expect(cssSource).toMatch(/\.patient-workflow > \*\s*\{[^}]*order:\s*0;/);
    expect(cssSource.lastIndexOf('.patient-workflow > *')).toBeGreaterThan(cssSource.lastIndexOf('.patient-workflow__acquisition { order: 2;'));
    expect(appSource).toContain('<details className="patient-intake__history"><summary>최근 진료와 기억 보기</summary>');
  });

  it('keeps the six primary tools directly visible on narrow screens without a mode gate', () => {
    const rules = [...cssSource.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const hiddenDirectNavigationRules = rules.filter(([, selector, declarations]) =>
      selector.includes('.direct-navigation') && /display\s*:\s*none\b/.test(declarations));
    expect(hiddenDirectNavigationRules).toEqual([]);
    expect(journalExperienceSource).toContain('className="direct-navigation__main"');
    expect(journalExperienceSource).toContain('<summary>기록 더 보기</summary>');
    expect(journalExperienceSource).not.toContain('station-mode-switch');
    expect(cssSource).toMatch(/@media\s*\(max-width:\s*560px\)[\s\S]*?\.direct-navigation__main\s*\{[^}]*grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
  });

  it('keeps readable controls, semantic copy, and visible keyboard focus', () => {
    expect(cssSource).toMatch(/\.main-content-panel :is\(button,input,select,textarea\)[^}]*font-size:\s*16px\s*!important/);
    expect(cssSource).toMatch(/\.main-content-panel :is\(p,li,dt,dd,label,td,th\)[^}]*font-size:\s*max\(1rem,1em\)/);
    expect(cssSource).toMatch(/body\s*\{[^}]*font:\s*18px\/1\.65/);
    expect(cssSource).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid/);
    expect(cssSource).toContain('@media(prefers-reduced-motion:reduce)');
  });

  it('keeps treatment comparison, selection, and its primary action in one responsive workspace', () => {
    expect(appSource).toContain('className="treatment-comparison"');
    expect(appSource).toContain('className="treatment-workspace"');
    expect(appSource).toContain('className={`treatment-submit-bar');
    expect(cssSource).toMatch(/#treatment-workspace \.treatment-workspace\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)/);
    expect(cssSource).toMatch(/\.treatment-submit-actions > button\s*\{[\s\S]*?min-height:\s*50px/);
    expect(cssSource).toMatch(/\.patience-clock-mark\s*\{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
    expect(cssSource).toMatch(/\.trinket-spend-button\s*\{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
    expect(cssSource).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?#treatment-workspace \.treatment-workspace,[\s\S]*?\.treatment-submit-bar\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  it('exposes the season resolver after downtime outside an active journey', () => {
    expect(appSource).toContain('className="downtime-season-action"');
    expect(appSource).toMatch(/\{state\.downtimeCompleted && \([\s\S]*?onClick=\{handleAdvanceSeason\}[\s\S]*?계절 정산 및 전환/);
    expect(appSource).toContain('const handleAdvanceSeason = async () =>');
    expect(cssSource).toMatch(/\.downtime-season-action\s*\{[\s\S]*?justify-content:\s*space-between/);
  });

  it('keeps Character context, Downtime choice, and its saved result in one progression flow', () => {
    expect(appSource).toContain('className="character-continuity__footer"');
    expect(appSource).toContain('도구 {bagToolCount} · 영약재/수집물 {bagReagentCount}');
    expect(appSource).toContain('onGoToDowntime={');
    expect(appSource).toContain("!state.bio.name.trim() && <CharacterCreationWizard");
    expect(appSource).toContain('className="downtime-context-ledger"');
    expect(appSource).toContain('className="downtime-result-receipt"');
    expect(appSource).toMatch(/\{state\.downtimeRequired && !state\.downtimeCompleted && \([\s\S]*?id="downtime-activity-choice"/);
    expect(cssSource).toMatch(/\.downtime-activity-card\.is-collapsed\s*\{[\s\S]*?min-height:\s*150px/);
    expect(cssSource).toMatch(/\.downtime-activity-card\.is-selected\s*\{[\s\S]*?grid-column:\s*1 \/ -1/);
  });

  it('keeps an optional play-tab map after the primary procedure', () => {
    expect(appSource).toContain('id="play-journey-map"');
    expect(appSource).toContain('variant="companion"');
    expect(appSource).toContain('<RouteComposer');
    expect(appSource).toContain('약제사 시작 기록');
    expect(cssSource).toMatch(/\.play-with-map\s*\{/);
    expect(cssSource).toMatch(/\.route-composer\s*\{/);
    expect(appSource).toContain('<details className="workspace-map-preview">');
    expect(appSource).not.toContain('<details className="workspace-map-preview" open=');
    const procedures = appSource.slice(appSource.indexOf('<div className="station-procedures play-folio">'));
    expect(procedures.indexOf('id="route-planning-panel"')).toBeLessThan(procedures.indexOf('id="play-journey-map"'));
    expect(appSource).toContain('문양 방향: ♥ 북쪽/위 · ♦ 남쪽/아래 · ♣ 동쪽/오른쪽 · ♠ 서쪽/왼쪽.');
  });

  it('keeps the folio context before a single procedure region without duplicating the current action or checkpoint', () => {
    const folio = appSource.slice(appSource.indexOf('<div className="station-procedures play-folio">'));
    const contextStart = folio.indexOf('<aside className="play-folio__context"');
    const contextEnd = folio.indexOf('</aside>', contextStart);
    const context = folio.slice(contextStart, contextEnd);
    const workStart = folio.indexOf('id="play-folio-work"');
    expect(contextStart).toBeGreaterThan(-1);
    expect(contextEnd).toBeLessThan(workStart);
    expect(context.indexOf('{overview}')).toBeLessThan(context.indexOf('id="action-hub"'));
    expect(context.indexOf('id="action-hub"')).toBeLessThan(context.indexOf('<QuickRules'));
    expect(context).not.toContain('id="pending-archive-panel"');
    expect(folio.indexOf('id="pending-archive-panel"')).toBeGreaterThan(workStart);
    expect(folio.indexOf('id="patient-acquisition-panel"')).toBeGreaterThan(workStart);
    expect(folio.indexOf('id="treatment-workspace"')).toBeGreaterThan(workStart);
    expect(appSource.match(/id="action-hub"/g)).toHaveLength(1);
    expect(appSource.match(/id="field-main"/g)).toHaveLength(1);
    expect(appSource.match(/<TodayOverview\b/g)).toHaveLength(1);
    expect(appSource.match(/<QuickRules\b/g)).toHaveLength(1);
    expect(appSource).toContain('overview: ReactNode;');
    expect(appSource).toContain('aria-label="오늘의 여행과 규칙"');
    expect(appSource).toContain('aria-label="현재 플레이 절차" tabIndex={-1}');
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
    expect(cssSource).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.herbarium-controls\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)/);
    expect(cssSource).toMatch(/\.rulebook-reference-detail__actions button,[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px/);
  });

  it('preserves the herbarium browse context when the player checks another journal tab', () => {
    expect(appSource).toContain('const [herbariumViewState, setHerbariumViewState]');
    expect(appSource).toContain('viewState={herbariumViewState}');
    expect(appSource).toContain("visiblePage: { key: '', count: 16 }");
    expect(appSource).toContain("const patientContextKey = patientOnly");
    expect(appSource).toContain("patient?.id || 'none'");
  });
});
