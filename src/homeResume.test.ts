// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const homeSource = readFileSync(fileURLToPath(new URL('./components/JournalExperience.tsx', import.meta.url)), 'utf8');

describe('Home campaign resume regression guards', () => {
  it('uses the actual current location as WHERE and keeps the destination separate', () => {
    expect(homeSource).toContain("const dayPlace = localizeLocationName(state.currentLocationName) || '현재 위치 미기록';");
    expect(homeSource).toContain("{ label: '여정 목적지', value: localizeLocationName(state.journeyDestination) || '미정' }");
    expect(homeSource).not.toContain('className="today-place"');
  });

  it('renders only meaningful persisted resume context instead of empty navigation cards', () => {
    expect(homeSource).toContain('const hasResumeContext = Boolean(patient || legacyAilment || requirements.length || isOverCapacity || recentJournal);');
    expect(homeSource).toContain('today-story today-story--resume');
    expect(homeSource).not.toContain('아직 찾아온 환자가 없습니다');
    expect(homeSource).not.toContain('첫 여행을 떠나면 이곳에 작은 기억이 남습니다.');
  });

  it('shares one tested action priority list with the actual Home resume button', () => {
    expect(appSource).toContain('const preferredActionIds = getCampaignResumeActionIds(state, Boolean(currentBarrow));');
    expect(appSource).toContain('if (encounterDialog) {');
    expect(appSource).not.toContain('encounterDialog?.focus();\n                      return true;');
    expect(appSource).not.toContain('className="action-hub__status"');
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
    expect(homeSource).toContain("recentJournal?.title.startsWith('새 환자:')");
    expect(homeSource).toContain("const cleanImpression = impression.replace(/^첫인상:\\s*/, '')");
    expect(homeSource).toContain("const cleanDiagnosis = diagnosis.replace(/^병증:\\s*/, '')");
    expect(homeSource).toContain(".join('\\n')");
    expect(homeSource).toContain('className="today-journal__summary"');
  });
});
