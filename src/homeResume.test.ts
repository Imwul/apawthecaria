// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TodayOverview } from './components/JournalExperience';
import { getCampaignNextAction } from './campaignContinuity';
import { focusCurrentWorkspace } from './workspaceNavigation';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const journeyState = {
  bio: { name: '클로버' }, journeyActive: true,
  journey: { journeyId: 'j', status: 'active' as const, destinationId: 'summit' },
  currentMapLocationId: 'odoak', currentLocationName: 'Odoak', currentSeason: 'Spring',
  journeyDestination: 'Summit', calendarDays: 3, calendarMaxDays: 12,
  patients: [], bag: [], journals: [], reputation: 0
};
const renderToday = (overrides: Record<string, unknown> = {}, currentWeight = 1) => renderToStaticMarkup(createElement(TodayOverview, {
  state: { ...journeyState, ...overrides }, currentWeight, maxCarry: 12,
  onNavigate: () => {}, onContinue: () => {}, onOpenReference: () => {}
}));
afterEach(() => vi.unstubAllGlobals());

describe('Home campaign resume regression guards', () => {
  it('uses the actual current location as WHERE and keeps the destination separate', () => {
    const html = renderToday();
    const context = html.match(/class="workspace-today__context">([\s\S]*?)<\/div>/)?.[1] || '';
    expect(context).toContain('Odoak');
    expect(context).not.toContain('Summit');
    expect(html).toContain('<dt>여정 목적지</dt><dd>Summit</dd>');
  });

  it('renders only meaningful persisted resume context instead of empty navigation cards', () => {
    const html = renderToday();
    expect(html).not.toContain('workspace-patient-strip');
    expect(html).not.toContain('아직 찾아온 환자가 없습니다');
    expect(html).not.toContain('첫 여행을 떠나면 이곳에 작은 기억이 남습니다.');
    expect(renderToday({}, 13)).toContain('배낭 한도 초과');
    expect(renderToday({ activeAilment: { name: '첫 열병', patientName: '토끼', timer: 3 } })).toContain('현재 환자');
  });

  it('uses the shared next action for the Home label and its actual target', () => {
    const state = { ...journeyState, pendingBarter: { status: 'awaiting-payment' } };
    const next = getCampaignNextAction(state);
    expect(next.targetId).toBe('patient-acquisition-panel');
    expect(next.actionId).toBeUndefined();
    expect(renderToday({ pendingBarter: state.pendingBarter })).toContain(`${next.label}<span aria-hidden="true"> →</span>`);
    const start = appSource.indexOf('<TodayOverview');
    const callback = appSource.slice(start, appSource.indexOf('onOpenReference={openRulebookReference}', start));
    expect(callback).toContain('const next = getCampaignNextAction(state);');
    expect(callback).toContain('changeActiveTab(next.tab);');
    expect(callback).toContain("focusCurrentWorkspace(next.targetId || 'field-main', next.actionId)");
    expect(callback).not.toContain('getCampaignResumeActionIds');
  });

  it('returns to the saved position when Home opens a reference chapter', () => {
    expect(appSource).toContain('onNavigate={(tab) => changeActiveTab(tab, { restoreScroll: true })}');
  });

  it('clears campaign-scoped reference, journal, filter, and forage drafts when replacing the campaign', () => {
    expect(appSource).toContain('const resetCampaignScopedUi = useCallback(() => {');
    expect(appSource).toContain('setHerbariumViewState(initialHerbariumViewState())');
    expect(appSource).toContain('setForageTargetReagentIds([])');
    expect(appSource).toContain('foragePlanningKeyRef.current =');
    expect(appSource).toContain("setAilmentFilter('')");
    expect(appSource).toContain('initialSetupRouted.current = false');
    expect(appSource).toContain('officialMapDefaultsLoaded.current = false');
    expect(appSource).toContain('}, [campaignReadyForOfficialMap, campaignUiEpoch]);');
    expect(appSource).toContain('key={`journals-${campaignUiEpoch}`}');
    expect(appSource).toContain('key={`atlas-${campaignUiEpoch}`}');
    expect(appSource).toContain('settleControlledPromptResolver(controlledPromptResolverRef, null)');
  });

  it('keeps Character record folds open across same-campaign tab round-trips and resets them with a replaced campaign', () => {
    expect(appSource).toContain('const [bioRecordFolds, setBioRecordFolds] = useState<BioRecordFoldState>(initialBioRecordFoldState);');
    expect(appSource).toContain('recordFolds={bioRecordFolds}');
    expect(appSource).toContain('setRecordFolds={setBioRecordFolds}');
    expect(appSource).toContain('open={recordFolds.profile}');
    expect(appSource).toContain('open={recordFolds.extended}');
    expect(appSource).toContain('open={recordFolds.methods}');
    expect(appSource).toContain('setBioRecordFolds(initialBioRecordFoldState())');
  });

  it('separates a newly met patient impression from the diagnosis in the recent journal', () => {
    const html = renderToday({ journals: [{
      id: 'diagnosis:journal', title: '새 환자: 토끼', timestamp: 1,
      text: '첫인상: 낯을 가리는 · 풍성한 털\n병증: 첫 열병 (가벼움, 8시간)'
    }] });
    expect(html).toMatch(/>첫인상<\/\w+>/);
    expect(html).toMatch(/>병증<\/\w+>/);
    expect(html).toContain('낯을 가리는 · 풍성한 털');
    expect(html).toContain('첫 열병 (가벼움, 8시간)');
    expect(html).not.toContain('첫인상: 낯을 가리는 · 풍성한 털 병증:');
  });
});

class WorkspaceElement {
  parentElement: WorkspaceElement | null = null;
  tabIndex = 0;
  matches = vi.fn(() => false);
  focus = vi.fn();
  scrollIntoView = vi.fn();
}
class WorkspaceDetails extends WorkspaceElement { open = false; }

describe('Home resumes the existing workspace', () => {
  it('focuses an existing modal without replaying its action', () => {
    const dialog = new WorkspaceElement();
    const action = { click: vi.fn() };
    vi.stubGlobal('HTMLDetailsElement', WorkspaceDetails);
    const querySelector = vi.fn((selector: string) => selector === '[role="dialog"][aria-modal="true"]' ? dialog : action);
    vi.stubGlobal('document', { querySelector });
    focusCurrentWorkspace('treatment-workspace', 'active-patient');
    expect(dialog.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(dialog.tabIndex).toBe(-1);
    expect(action.click).not.toHaveBeenCalled();
    expect(querySelector).toHaveBeenCalledTimes(1);
  });

  it('opens every enclosing fold and focuses the persisted target when no hub action exists', () => {
    const outer = new WorkspaceDetails();
    const inner = new WorkspaceDetails();
    const target = new WorkspaceElement();
    inner.parentElement = outer;
    target.parentElement = inner;
    const getElementById = vi.fn((id: string) => id === 'patient-acquisition-panel' ? target : null);
    vi.stubGlobal('HTMLDetailsElement', WorkspaceDetails);
    vi.stubGlobal('document', { querySelector: () => null, getElementById });
    vi.stubGlobal('window', { requestAnimationFrame: (callback: FrameRequestCallback) => { callback(0); return 1; } });
    focusCurrentWorkspace('patient-acquisition-panel');
    expect(outer.open).toBe(true);
    expect(inner.open).toBe(true);
    expect(target.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
